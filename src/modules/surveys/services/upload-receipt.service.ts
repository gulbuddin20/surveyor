import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export type UploadReceiptPayload = {
  aud: "metadata-upload-receipt";
  category: "photos";
  exp: number;
  fieldKey: string;
  fileName: string;
  fileSizeBytes: number;
  iat: number;
  mimeType: string;
  project: "surveyor";
  sha256: string;
  storagePath: string;
  sub: string;
  templateId: string;
};

export function createUploadReceipt(payload: UploadReceiptPayload) {
  if (!env.METADATA_UPLOAD_TOKEN_SECRET) return undefined;
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", env.METADATA_UPLOAD_TOKEN_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyUploadReceipt(receipt: string | undefined): UploadReceiptPayload | null {
  if (!receipt || !env.METADATA_UPLOAD_TOKEN_SECRET) return null;
  const [encodedPayload, signature] = receipt.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = createHmac("sha256", env.METADATA_UPLOAD_TOKEN_SECRET).update(encodedPayload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isUploadReceiptPayload(parsed)) return null;
  if (Math.floor(Date.now() / 1000) > parsed.exp) return null;
  return parsed;
}

function isUploadReceiptPayload(value: unknown): value is UploadReceiptPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<UploadReceiptPayload>;
  return payload.aud === "metadata-upload-receipt"
    && payload.category === "photos"
    && payload.project === "surveyor"
    && typeof payload.exp === "number"
    && typeof payload.iat === "number"
    && typeof payload.fieldKey === "string"
    && typeof payload.fileName === "string"
    && typeof payload.fileSizeBytes === "number"
    && typeof payload.mimeType === "string"
    && typeof payload.sha256 === "string"
    && typeof payload.storagePath === "string"
    && typeof payload.sub === "string"
    && typeof payload.templateId === "string";
}
