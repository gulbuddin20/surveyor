import { createHmac, randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import type { Profile, TemplateDetail } from "@/lib/types";
import {
  maxPhotoFilesPerField,
  multiPhotoTargetBytes,
  singlePhotoTargetBytes,
} from "@/modules/surveys/services/survey-upload.service";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadTokenTtlSeconds = 5 * 60;

export type UploadTokenInput = {
  fieldKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  template: TemplateDetail;
  totalFiles: number;
};

export function createDirectUploadGrant(profile: Profile, input: UploadTokenInput) {
  if (!env.METADATA_UPLOAD_URL || !env.METADATA_UPLOAD_TOKEN_SECRET) {
    return { ok: false as const, status: 501, message: "Direct upload belum aktif" };
  }

  const field = input.template.responseFields.find((item) => item.field_key === input.fieldKey && item.field_type === "photo");
  if (!field) {
    return { ok: false as const, status: 404, message: "Field foto tidak terdaftar di template" };
  }

  const safeTotalFiles = Number.isFinite(input.totalFiles) ? input.totalFiles : 1;
  if (safeTotalFiles < 1 || safeTotalFiles > maxPhotoFilesPerField) {
    return { ok: false as const, status: 400, message: `Maksimal ${maxPhotoFilesPerField} foto` };
  }
  if (!allowedTypes.has(input.mimeType)) {
    return { ok: false as const, status: 400, message: "Foto harus JPG, PNG, atau WebP" };
  }

  const maxSizeMb = typeof field.settings?.max_size_mb === "number"
    ? field.settings.max_size_mb
    : Number(input.template.photo_max_size_mb);
  const maxOriginalBytes = maxSizeMb * 1024 * 1024;
  if (input.fileSizeBytes < 1 || input.fileSizeBytes > maxOriginalBytes) {
    return { ok: false as const, status: 400, message: `${input.fileName} melebihi batas ${maxSizeMb} MB` };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    aud: "metadata-upload",
    category: "photos",
    exp: nowSeconds + uploadTokenTtlSeconds,
    fieldKey: input.fieldKey,
    fileName: input.fileName,
    iat: nowSeconds,
    jti: randomUUID(),
    maxOriginalBytes,
    maxOutputBytes: safeTotalFiles === 1 ? singlePhotoTargetBytes : multiPhotoTargetBytes,
    mimeType: input.mimeType,
    project: "surveyor",
    sub: profile.id,
    templateId: input.template.id,
  };

  return {
    ok: true as const,
    token: signUploadToken(payload, env.METADATA_UPLOAD_TOKEN_SECRET),
    uploadUrl: env.METADATA_UPLOAD_URL.replace(/\/+$/, "") + "/direct/surveyor/photos",
  };
}

function signUploadToken(payload: Record<string, unknown>, secret: string) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}
