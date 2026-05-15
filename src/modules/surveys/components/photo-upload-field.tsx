"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const maxPhotoCount = 3;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type PreviewItem = {
  id: string;
  file: File;
  url: string;
};

export function PhotoUploadField({
  id,
  name,
  label,
  placeholder,
  required,
  maxSizeMb,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string | null;
  required: boolean;
  maxSizeMb: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<PreviewItem[]>([]);
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { pending } = useFormStatus();
  const maxBytes = maxSizeMb * 1024 * 1024;

  const helperText = useMemo(() => {
    return placeholder ?? `JPG, PNG, atau WebP. Maksimal ${maxSizeMb} MB per file, sampai ${maxPhotoCount} foto.`;
  }, [maxSizeMb, placeholder]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

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

    setItems(files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      file,
      url: URL.createObjectURL(file),
    })));
  }

  function removeItem(id: string) {
    const nextItems = items.filter((item) => item.id !== id);
    const removed = items.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    setItems(nextItems);
    syncInputFiles(nextItems.map((item) => item.file));
  }

  function syncInputFiles(files: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    inputRef.current.files = transfer.files;
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>

      <label
        htmlFor={id}
        className={cn(
          "block cursor-pointer rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.2)] bg-[color:rgba(255,249,234,0.38)] p-5 text-center text-sm text-[color:rgba(22,37,29,0.58)] transition",
          "hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]",
          pending && "pointer-events-none opacity-70",
        )}
      >
        <Camera className="mx-auto mb-2 h-6 w-6" />
        <span className="block font-extrabold text-[var(--atlas-ink)]">{items.length ? "Ganti foto bukti" : label}</span>
        <span>{helperText}</span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={pending}
          onChange={handleChange}
          className="sr-only"
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">{error}</p>
      ) : null}

      {items.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[1.25rem] border border-[color:rgba(22,37,29,0.1)] bg-[var(--atlas-paper)] shadow-sm">
              <div className="relative aspect-[4/3] bg-[color:rgba(22,37,29,0.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeItem(item.id)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--atlas-ink)] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Hapus ${item.file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start gap-2">
                  <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--atlas-canopy)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--atlas-ink)]">{item.file.name}</p>
                    <p className="text-xs font-semibold text-[color:rgba(22,37,29,0.52)]">{formatFileSize(item.file.size)}</p>
                  </div>
                </div>
                {pending ? (
                  <div className="space-y-2">
                    <p className="inline-flex items-center gap-2 text-xs font-bold text-[var(--atlas-canopy)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Mengunggah dan mengompres...
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[color:rgba(22,37,29,0.08)]">
                      <div className="h-full w-1/2 animate-[atlas-upload_1s_ease-in-out_infinite] rounded-full bg-[var(--atlas-canopy)]" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-[var(--atlas-canopy)]">Siap diunggah</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
