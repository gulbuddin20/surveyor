import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getTemplateDetail } from "@/modules/surveys/repositories/survey.repository";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoFilesPerField = 3;
const singlePhotoTargetBytes = 1024 * 1024;
const multiPhotoTargetBytes = 500 * 1024;
const uploadTokenTtlSeconds = 5 * 60;

export async function POST(request: Request) {
  const profile = await requireProfile();
  if (!env.METADATA_UPLOAD_URL || !env.METADATA_UPLOAD_TOKEN_SECRET) {
    return NextResponse.json({ ok: false, message: "Direct upload belum aktif" }, { status: 501 });
  }

  const body = await request.json().catch(() => null) as {
    templateId?: string;
    fieldKey?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    totalFiles?: number;
  } | null;

  const templateId = String(body?.templateId ?? "");
  const fieldKey = String(body?.fieldKey ?? "");
  const fileName = String(body?.fileName ?? "");
  const mimeType = String(body?.mimeType ?? "");
  const fileSizeBytes = Number(body?.fileSizeBytes ?? 0);
  const totalFiles = Number(body?.totalFiles ?? 1);

  if (!templateId || !fieldKey || !fileName || !mimeType || !Number.isFinite(fileSizeBytes)) {
    return NextResponse.json({ ok: false, message: "Payload upload tidak valid" }, { status: 400 });
  }

  const template = await getTemplateDetail(templateId);
  const field = template?.responseFields.find((item) => item.field_key === fieldKey && item.field_type === "photo");
  if (!template || !field) {
    return NextResponse.json({ ok: false, message: "Field foto tidak terdaftar di template" }, { status: 404 });
  }

  const safeTotalFiles = Number.isFinite(totalFiles) ? totalFiles : 1;
  if (safeTotalFiles < 1 || safeTotalFiles > maxPhotoFilesPerField) {
    return NextResponse.json({ ok: false, message: `Maksimal ${maxPhotoFilesPerField} foto` }, { status: 400 });
  }
  if (!allowedTypes.has(mimeType)) {
    return NextResponse.json({ ok: false, message: "Foto harus JPG, PNG, atau WebP" }, { status: 400 });
  }

  const maxSizeMb = typeof field.settings?.max_size_mb === "number"
    ? field.settings.max_size_mb
    : Number(template.photo_max_size_mb);
  const maxOriginalBytes = maxSizeMb * 1024 * 1024;
  if (fileSizeBytes < 1 || fileSizeBytes > maxOriginalBytes) {
    return NextResponse.json({ ok: false, message: `${fileName} melebihi batas ${maxSizeMb} MB` }, { status: 400 });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "metadata-upload",
    category: "photos",
    exp: nowSeconds + uploadTokenTtlSeconds,
    fieldKey,
    fileName,
    iat: nowSeconds,
    jti: randomUUID(),
    maxOriginalBytes,
    maxOutputBytes: safeTotalFiles === 1 ? singlePhotoTargetBytes : multiPhotoTargetBytes,
    mimeType,
    project: "surveyor",
    sub: profile.id,
    templateId,
  };
  const token = signUploadToken(payload, env.METADATA_UPLOAD_TOKEN_SECRET);

  return NextResponse.json({
    ok: true,
    uploadUrl: env.METADATA_UPLOAD_URL.replace(/\/+$/, "") + "/direct/surveyor/photos",
    token,
  });
}

function signUploadToken(payload: Record<string, unknown>, secret: string) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
