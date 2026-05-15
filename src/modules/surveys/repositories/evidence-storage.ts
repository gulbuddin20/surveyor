import { createHash, randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const project = "surveyor";
const bucket = "survey-evidence";

type StoredFile = {
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  provider: "metadata-api" | "supabase";
};

type MetadataUploadResponse = {
  ok: boolean;
  path?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sha256?: string;
  message?: string;
};

export function isMetadataApiConfigured() {
  return Boolean(
    env.METADATA_API_URL
      && env.METADATA_API_KEY
      && env.METADATA_CF_ACCESS_CLIENT_ID
      && env.METADATA_CF_ACCESS_CLIENT_SECRET,
  );
}

export async function uploadEvidenceFile({
  category,
  path,
  file,
  mimeType: forcedMimeType,
}: {
  category: "photos" | "signatures";
  path: string;
  file: File | Blob | Buffer;
  mimeType?: string;
}): Promise<StoredFile> {
  const buffer = Buffer.from(await toArrayBuffer(file));
  const mimeType = forcedMimeType ?? getMimeType(file);

  if (isMetadataApiConfigured()) {
    return uploadToMetadataApi({ category, file, path, mimeType, buffer });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;

  return {
    storagePath: path,
    mimeType,
    fileSizeBytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    provider: "supabase",
  };
}

export async function downloadEvidenceFile(storagePath: string) {
  if (isMetadataApiConfigured() && storagePath.startsWith(`${project}/`)) {
    const response = await fetch(`${metadataBaseUrl()}/files/${encodePath(storagePath)}`, {
      headers: metadataHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      buffer,
      mimeType: response.headers.get("content-type") ?? "application/octet-stream",
      size: buffer.length,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error || !data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  return {
    buffer,
    mimeType: data.type || "application/octet-stream",
    size: data.size,
  };
}

async function uploadToMetadataApi({
  category,
  file,
  path,
  mimeType,
  buffer,
}: {
  category: "photos" | "signatures";
  file: File | Blob | Buffer;
  path: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<StoredFile> {
  const formData = new FormData();
  formData.set("file", toUploadBlob(file, mimeType), getFileName(file, path));

  const response = await fetch(`${metadataBaseUrl()}/files/${project}/${category}`, {
    method: "POST",
    headers: metadataHeaders(),
    body: formData,
  });
  const payload = await response.json().catch(() => null) as MetadataUploadResponse | null;
  if (!response.ok || !payload?.ok || !payload.path) {
    throw new Error(payload?.message ?? "Gagal mengunggah file ke metadata API");
  }

  return {
    storagePath: payload.path,
    mimeType: payload.mimeType ?? mimeType,
    fileSizeBytes: payload.fileSizeBytes ?? buffer.length,
    sha256: payload.sha256 ?? createHash("sha256").update(buffer).digest("hex"),
    provider: "metadata-api",
  };
}

function metadataBaseUrl() {
  if (!env.METADATA_API_URL) throw new Error("METADATA_API_URL belum dikonfigurasi");
  return env.METADATA_API_URL.replace(/\/+$/, "");
}

function metadataHeaders() {
  if (!env.METADATA_API_KEY || !env.METADATA_CF_ACCESS_CLIENT_ID || !env.METADATA_CF_ACCESS_CLIENT_SECRET) {
    throw new Error("Metadata API credentials belum lengkap");
  }
  return {
    "x-metadata-key": env.METADATA_API_KEY,
    "CF-Access-Client-Id": env.METADATA_CF_ACCESS_CLIENT_ID,
    "CF-Access-Client-Secret": env.METADATA_CF_ACCESS_CLIENT_SECRET,
  };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function toArrayBuffer(file: File | Blob | Buffer) {
  if (Buffer.isBuffer(file)) return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  return file.arrayBuffer();
}

function toUploadBlob(file: File | Blob | Buffer, mimeType: string) {
  if (Buffer.isBuffer(file)) return new Blob([new Uint8Array(file)], { type: mimeType });
  return file;
}

function getMimeType(file: File | Blob | Buffer) {
  if (Buffer.isBuffer(file)) return "image/png";
  return file.type || "application/octet-stream";
}

function getFileName(file: File | Blob | Buffer, fallbackPath: string) {
  if (!Buffer.isBuffer(file) && "name" in file && typeof file.name === "string" && file.name.trim()) return file.name;
  return `${fallbackPath.split("/").at(-1) ?? randomUUID()}`;
}
