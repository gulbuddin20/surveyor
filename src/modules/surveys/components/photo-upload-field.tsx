"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, CheckCircle2, ImageIcon, Loader2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const maxPhotoCount = 3;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ExistingPhotoPreview = {
  id: string;
  fieldKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storagePath: string;
  dataUrl: string | null;
};

type UploadedPhotoPayload = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  provider: string;
};

type PreviewItem = {
  id: string;
  file: File;
  url: string;
  status: "uploading" | "uploaded" | "error";
  message: string;
  uploaded?: UploadedPhotoPayload;
};

export function PhotoUploadField({
  id,
  fieldKey,
  name,
  label,
  placeholder,
  required,
  maxSizeMb,
  templateId,
  existingPhotos = [],
  onUploadStateChange,
}: {
  id: string;
  fieldKey: string;
  name: string;
  label: string;
  placeholder?: string | null;
  required: boolean;
  maxSizeMb: number;
  templateId: string;
  existingPhotos?: ExistingPhotoPreview[];
  onUploadStateChange?: (fieldKey: string, isUploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<PreviewItem[]>([]);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const maxBytes = maxSizeMb * 1024 * 1024;
  const isUploading = items.some((item) => item.status === "uploading");

  const helperText = useMemo(() => {
    return placeholder ?? `JPG, PNG, atau WebP. Maksimal ${maxSizeMb} MB per file, sampai ${maxPhotoCount} foto.`;
  }, [maxSizeMb, placeholder]);

  useEffect(() => {
    itemsRef.current = items;
    onUploadStateChange?.(fieldKey, items.some((item) => item.status === "uploading"));
  }, [fieldKey, items, onUploadStateChange]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
      onUploadStateChange?.(fieldKey, false);
    };
  }, [fieldKey, onUploadStateChange]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setError(null);

    if (files.length > maxPhotoCount) {
      event.target.value = "";
      setItems([]);
      setError(`Maksimal ${maxPhotoCount} foto untuk ${label}.`);
      return;
    }

    const invalidType = files.find((file) => !acceptedTypes.has(file.type));
    if (invalidType) {
      event.target.value = "";
      setItems([]);
      setError(`${invalidType.name} harus JPG, PNG, atau WebP.`);
      return;
    }

    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      event.target.value = "";
      setItems([]);
      setError(`${oversized.name} melebihi batas ${maxSizeMb} MB.`);
      return;
    }

    const nextItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      url: URL.createObjectURL(file),
      status: "uploading" as const,
      message: "Mengunggah dan mengompres...",
    }));
    setItems(nextItems);
    void uploadFiles(nextItems);
  }

  async function uploadFiles(nextItems: PreviewItem[]) {
    await Promise.all(nextItems.map(async (item) => {
      try {
        const formData = new FormData();
        formData.set("templateId", templateId);
        formData.set("fieldKey", fieldKey);
        formData.set("totalFiles", String(nextItems.length));
        formData.set("file", item.file);

        const response = await fetch("/surveys/uploads", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json().catch(() => null) as { ok?: boolean; file?: UploadedPhotoPayload; message?: string } | null;
        if (!response.ok || !payload?.ok || !payload.file) {
          throw new Error(payload?.message ?? "Upload gagal");
        }
        setItems((current) => current.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, status: "uploaded", message: "Foto siap disimpan", uploaded: payload.file }
            : currentItem
        )));
      } catch (caught) {
        setItems((current) => current.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, status: "error", message: caught instanceof Error ? caught.message : "Upload gagal" }
            : currentItem
        )));
      }
    }));
  }

  function removeItem(id: string) {
    const nextItems = items.filter((item) => item.id !== id);
    const removed = items.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    setItems(nextItems);
    if (inputRef.current && nextItems.length === 0) inputRef.current.value = "";
  }

  const hasPreview = items.length > 0 || existingPhotos.length > 0;

  return (
    <div className="space-y-3 md:col-span-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>

      <div className="rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.2)] bg-[color:rgba(255,249,234,0.38)] p-4 transition hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]">
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-[1.15rem] px-4 py-8 text-center text-sm text-[color:rgba(22,37,29,0.58)]",
            hasPreview && "border border-dashed border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,255,255,0.28)] py-5",
            isUploading && "pointer-events-none opacity-70",
          )}
        >
          <Camera className="mb-2 h-6 w-6" />
          <span className="block font-extrabold text-[var(--atlas-ink)]">
            {hasPreview ? "Tambah / ganti foto bukti" : label}
          </span>
          <span>{helperText}</span>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading}
            onChange={handleChange}
            className="sr-only"
          />
        </label>

        {hasPreview ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {existingPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                imageUrl={photo.dataUrl}
                name={photo.fileName ?? "Foto tersimpan"}
                size={photo.fileSizeBytes}
                status="stored"
                message="Sudah tersimpan"
              />
            ))}
            {items.map((item) => (
              <PhotoCard
                key={item.id}
                imageUrl={item.url}
                name={item.file.name}
                size={item.uploaded?.fileSizeBytes ?? item.file.size}
                status={item.status}
                message={item.message}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {items.map((item) => item.status === "uploaded" && item.uploaded ? (
        <input key={item.id} type="hidden" name={name} value={JSON.stringify(item.uploaded)} readOnly />
      ) : null)}

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{error}</p>
      ) : null}
    </div>
  );
}

function PhotoCard({
  imageUrl,
  name,
  size,
  status,
  message,
  onRemove,
}: {
  imageUrl: string | null;
  name: string;
  size: number | null;
  status: "stored" | "uploading" | "uploaded" | "error";
  message: string;
  onRemove?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-[color:rgba(22,37,29,0.1)] bg-[var(--atlas-paper)] shadow-sm">
      <div className="relative aspect-[4/3] bg-[color:rgba(22,37,29,0.06)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-[color:rgba(22,37,29,0.42)]">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--atlas-ink)] shadow-sm transition hover:bg-white"
            aria-label={`Hapus ${name}`}
          >
            <XCircle className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start gap-2">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--atlas-canopy)]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[var(--atlas-ink)]">{name}</p>
            {typeof size === "number" ? (
              <p className="text-xs font-semibold text-[color:rgba(22,37,29,0.52)]">{formatFileSize(size)}</p>
            ) : null}
          </div>
        </div>
        <StatusLine status={status} message={message} />
      </div>
    </div>
  );
}

function StatusLine({ status, message }: { status: "stored" | "uploading" | "uploaded" | "error"; message: string }) {
  if (status === "uploading") {
    return (
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-bold text-[var(--atlas-canopy)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {message}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-[color:rgba(22,37,29,0.08)]">
          <div className="h-full w-1/2 animate-[atlas-upload_1s_ease-in-out_infinite] rounded-full bg-[var(--atlas-canopy)]" />
        </div>
      </div>
    );
  }
  if (status === "error") return <p className="text-xs font-bold text-red-700">{message}</p>;
  return (
    <p className="inline-flex items-center gap-2 text-xs font-bold text-[var(--atlas-canopy)]">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
