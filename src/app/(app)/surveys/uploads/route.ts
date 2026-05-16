import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getTemplateDetail, uploadEvidencePhoto } from "@/modules/surveys/repositories/survey.repository";
import { createUploadReceipt } from "@/modules/surveys/services/upload-receipt.service";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoFilesPerField = 3;
const singlePhotoTargetBytes = 1024 * 1024;
const multiPhotoTargetBytes = 500 * 1024;

export async function POST(request: Request) {
  const profile = await requireProfile();
  const formData = await request.formData();
  const templateId = String(formData.get("templateId") ?? "");
  const fieldKey = String(formData.get("fieldKey") ?? "");
  const totalFiles = Number(formData.get("totalFiles") ?? 1);
  const file = formData.get("file");

  if (!templateId || !fieldKey) {
    return NextResponse.json({ ok: false, message: "Template atau field foto tidak valid" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, message: "File foto tidak ditemukan" }, { status: 400 });
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
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ ok: false, message: "Foto harus JPG, PNG, atau WebP" }, { status: 400 });
  }

  const maxSizeMb = typeof field.settings?.max_size_mb === "number"
    ? field.settings.max_size_mb
    : Number(template.photo_max_size_mb);
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ ok: false, message: `${file.name} melebihi batas ${maxSizeMb} MB` }, { status: 400 });
  }

  const stored = await uploadEvidencePhoto({
    userId: profile.id,
    responseId: `pending-${randomUUID()}`,
    file,
    maxOutputBytes: safeTotalFiles === 1 ? singlePhotoTargetBytes : multiPhotoTargetBytes,
  });
  const nowSeconds = Math.floor(Date.now() / 1000);

  return NextResponse.json({
    ok: true,
    file: {
      storagePath: stored.storagePath,
      fileName: file.name,
      mimeType: stored.mimeType,
      fileSizeBytes: stored.fileSizeBytes,
      sha256: stored.sha256,
      provider: stored.provider,
      uploadReceipt: createUploadReceipt({
        aud: "metadata-upload-receipt",
        category: "photos",
        exp: nowSeconds + 24 * 60 * 60,
        fieldKey,
        fileName: file.name,
        fileSizeBytes: stored.fileSizeBytes,
        iat: nowSeconds,
        mimeType: stored.mimeType,
        project: "surveyor",
        sha256: stored.sha256,
        storagePath: stored.storagePath,
        sub: profile.id,
        templateId,
      }),
    },
  });
}
