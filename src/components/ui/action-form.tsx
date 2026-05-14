"use client";

import { useRouter } from "next/navigation";
import type { FormHTMLAttributes } from "react";
import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type ActionFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (formData: FormData) => Promise<void>;
  confirmActionLabel?: string;
  confirmDescription?: string;
  confirmTitle?: string;
  confirmVariant?: "default" | "destructive";
  requireConfirmation?: boolean;
  errorMessage?: string;
  resetOnSuccess?: boolean;
  successMessage: string;
};

export function ActionForm({
  action,
  children,
  className,
  confirmActionLabel = "Ya, lanjutkan",
  confirmDescription = "Perubahan ini akan disimpan ke database. Pastikan data sudah benar.",
  confirmTitle = "Konfirmasi perubahan",
  confirmVariant = "default",
  errorMessage = "Aksi gagal",
  requireConfirmation = true,
  resetOnSuccess = false,
  successMessage,
  ...props
}: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmittingRef = useRef(false);
  const pendingFormDataRef = useRef<FormData | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFormData = (formData: FormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    void action(formData)
      .then(() => {
        toast({
          title: "Berhasil",
          description: successMessage,
          variant: "success",
        });
        if (resetOnSuccess) formRef.current?.reset();
        router.refresh();
      })
      .catch((caught: unknown) => {
        toast({
          title: errorMessage,
          description: caught instanceof Error ? caught.message : "Terjadi kesalahan. Coba lagi.",
          variant: "error",
        });
      })
      .finally(() => {
        pendingFormDataRef.current = null;
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <form
        ref={formRef}
        {...props}
        aria-busy={isSubmitting}
        onSubmit={(event) => {
          event.preventDefault();
          if (isSubmittingRef.current) return;

          const formData = new FormData(event.currentTarget);
          if (requireConfirmation) {
            pendingFormDataRef.current = formData;
            setIsConfirmOpen(true);
            return;
          }

          submitFormData(formData);
        }}
      >
        <fieldset
          className={cn("min-w-0 border-0 p-0 disabled:opacity-70", className)}
          disabled={isSubmitting || isConfirmOpen}
        >
          {children}
        </fieldset>
      </form>
      <ConfirmDialog
        actionLabel={confirmActionLabel}
        description={confirmDescription}
        onConfirm={() => {
          const formData = pendingFormDataRef.current;
          if (!formData) return;
          submitFormData(formData);
        }}
        open={isConfirmOpen}
        title={confirmTitle}
        variant={confirmVariant}
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
          if (!open && !isSubmittingRef.current) pendingFormDataRef.current = null;
        }}
      />
    </>
  );
}
