"use client";

import { useRouter } from "next/navigation";
import type { FormHTMLAttributes } from "react";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toaster";

type ActionFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (formData: FormData) => Promise<void>;
  errorMessage?: string;
  resetOnSuccess?: boolean;
  successMessage: string;
};

export function ActionForm({
  action,
  children,
  errorMessage = "Aksi gagal",
  resetOnSuccess = false,
  successMessage,
  ...props
}: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      ref={formRef}
      {...props}
      aria-busy={isSubmitting}
      onSubmit={(event) => {
        event.preventDefault();
        if (isSubmittingRef.current) return;

        const form = event.currentTarget;
        const formData = new FormData(form);
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
            isSubmittingRef.current = false;
            setIsSubmitting(false);
          });
      }}
    >
      <fieldset className="contents" disabled={isSubmitting}>
        {children}
      </fieldset>
    </form>
  );
}
