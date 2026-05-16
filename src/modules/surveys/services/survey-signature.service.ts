const maxSignatureDataUrlBytes = 250000;

export type PendingSignature = {
  fieldKey: string;
  dataUrl: string;
  signedAt: string;
};

export type StoredSignaturePayload = {
  storagePath: string;
  signedAt?: string;
  sha256?: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

export function parseSignaturePayload(value: string): { dataUrl: string; signedAt: string } | StoredSignaturePayload | null {
  if (value.length > maxSignatureDataUrlBytes) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const storagePath = "storagePath" in parsed ? parsed.storagePath : null;
  if (typeof storagePath === "string" && storagePath.trim()) {
    const signedAt = "signedAt" in parsed ? parsed.signedAt : null;
    const sha256 = "sha256" in parsed ? parsed.sha256 : null;
    const mimeType = "mimeType" in parsed ? parsed.mimeType : null;
    const fileSizeBytes = "fileSizeBytes" in parsed ? parsed.fileSizeBytes : null;
    return {
      storagePath,
      signedAt: typeof signedAt === "string" ? signedAt : undefined,
      sha256: typeof sha256 === "string" ? sha256 : undefined,
      mimeType: typeof mimeType === "string" ? mimeType : undefined,
      fileSizeBytes: typeof fileSizeBytes === "number" ? fileSizeBytes : undefined,
    };
  }
  const dataUrl = "dataUrl" in parsed ? parsed.dataUrl : null;
  const signedAt = "signedAt" in parsed ? parsed.signedAt : null;
  if (typeof dataUrl !== "string") return null;
  if (!dataUrl.startsWith("data:image/png;base64,")) return null;
  if (dataUrl.length > maxSignatureDataUrlBytes) return null;
  return {
    dataUrl,
    signedAt: typeof signedAt === "string" ? signedAt : new Date().toISOString(),
  };
}
