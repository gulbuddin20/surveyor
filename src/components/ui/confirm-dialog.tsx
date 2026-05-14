"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  actionLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
  description?: string;
  onConfirm: () => void;
  open: boolean;
  title?: string;
  variant?: "default" | "destructive";
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  actionLabel = "Lanjutkan",
  cancelLabel = "Batal",
  children,
  description = "Pastikan perubahan sudah benar sebelum disimpan.",
  onConfirm,
  open,
  title = "Konfirmasi aksi",
  variant = "default",
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(22,37,29,0.38)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-paper)] p-5 shadow-[0_-28px_72px_rgba(22,37,29,0.22)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,440px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:shadow-[0_28px_72px_rgba(22,37,29,0.26)] sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0",
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[color:rgba(22,37,29,0.16)] sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-black text-[var(--atlas-ink)]">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm font-semibold leading-6 text-[color:rgba(22,37,29,0.62)]">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.72)] text-[var(--atlas-ink)] transition hover:bg-[color:rgba(22,37,29,0.06)]"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="w-full">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              className="w-full"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
