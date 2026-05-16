import type { Profile, TemplateDetail, TemplateResponseField } from "@/lib/types";
import { verifyUploadReceipt } from "@/modules/surveys/services/upload-receipt.service";

export const maxPhotoFilesPerField = 3;
export const singlePhotoTargetBytes = 1024 * 1024;
export const multiPhotoTargetBytes = 500 * 1024;

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadedPhotoPayload = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256?: string;
  provider?: string;
  uploadReceipt?: string;
};

export type PhotoInput = {
  field: TemplateResponseField;
  files: File[];
  uploaded: UploadedPhotoPayload[];
  maxSizeMb: number;
};

export function collectPhotoInputs(template: TemplateDetail, formData: FormData): PhotoInput[] {
  return template.responseFields
    .filter((field) => field.field_type === "photo")
    .map((field) => {
      const files = formData
        .getAll(`responseFiles.${field.field_key}`)
        .filter((value): value is File => value instanceof File && value.size > 0);
      const uploaded = formData
        .getAll(`uploadedPhotos.${field.field_key}`)
        .map((value) => parseUploadedPhotoPayload(String(value)))
        .filter((value): value is UploadedPhotoPayload => Boolean(value));
      const maxSizeMb = typeof field.settings?.max_size_mb === "number"
        ? field.settings.max_size_mb
        : Number(template.photo_max_size_mb);
      return { field, files, uploaded, maxSizeMb };
    });
}

export function validatePhotoInputs({
  inputs,
  isNewResponse,
  profile,
  template,
}: {
  inputs: PhotoInput[];
  isNewResponse: boolean;
  profile: Profile;
  template: TemplateDetail;
}) {
  for (const input of inputs) {
    if (input.files.length + input.uploaded.length > maxPhotoFilesPerField) {
      return { ok: false as const, message: `${input.field.label} maksimal ${maxPhotoFilesPerField} foto` };
    }
    if (input.field.is_required && isNewResponse && input.files.length === 0 && input.uploaded.length === 0) {
      return { ok: false as const, message: `${input.field.label} wajib diunggah` };
    }

    const maxBytes = input.maxSizeMb * 1024 * 1024;
    for (const file of input.files) {
      if (!allowedPhotoTypes.has(file.type)) {
        return { ok: false as const, message: `${input.field.label} harus JPG, PNG, atau WebP` };
      }
      if (file.size > maxBytes) {
        return { ok: false as const, message: `Ukuran ${input.field.label} maksimal ${input.maxSizeMb} MB` };
      }
    }

    for (const photo of input.uploaded) {
      const receipt = verifyUploadReceipt(photo.uploadReceipt);
      if (!receipt) return { ok: false as const, message: `${input.field.label} harus diunggah ulang` };
      if (
        receipt.category !== "photos"
        || receipt.project !== "surveyor"
        || receipt.sub !== profile.id
        || receipt.templateId !== template.id
        || receipt.fieldKey !== input.field.field_key
        || receipt.storagePath !== photo.storagePath
        || receipt.fileName !== photo.fileName
        || receipt.mimeType !== photo.mimeType
        || receipt.fileSizeBytes !== photo.fileSizeBytes
        || receipt.sha256 !== photo.sha256
      ) {
        return { ok: false as const, message: `${input.field.label} tidak valid, unggah ulang foto` };
      }
    }
  }

  return { ok: true as const };
}

function parseUploadedPhotoPayload(value: string): UploadedPhotoPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const storagePath = "storagePath" in parsed ? parsed.storagePath : null;
  const fileName = "fileName" in parsed ? parsed.fileName : null;
  const mimeType = "mimeType" in parsed ? parsed.mimeType : null;
  const fileSizeBytes = "fileSizeBytes" in parsed ? parsed.fileSizeBytes : null;
  if (typeof storagePath !== "string" || !storagePath.trim()) return null;
  if (typeof fileName !== "string" || !fileName.trim()) return null;
  if (typeof mimeType !== "string" || !mimeType.trim()) return null;
  if (typeof fileSizeBytes !== "number" || !Number.isFinite(fileSizeBytes)) return null;
  return {
    storagePath,
    fileName,
    mimeType,
    fileSizeBytes,
    sha256: "sha256" in parsed && typeof parsed.sha256 === "string" ? parsed.sha256 : undefined,
    provider: "provider" in parsed && typeof parsed.provider === "string" ? parsed.provider : undefined,
    uploadReceipt: "uploadReceipt" in parsed && typeof parsed.uploadReceipt === "string" ? parsed.uploadReceipt : undefined,
  };
}
