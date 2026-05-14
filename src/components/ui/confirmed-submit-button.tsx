"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubmitButton, type SubmitButtonProps } from "@/components/ui/submit-button";

type ConfirmedSubmitButtonProps = SubmitButtonProps & {
  confirmActionLabel?: string;
  confirmDescription?: string;
  confirmTitle?: string;
  confirmVariant?: "default" | "destructive";
};

export function ConfirmedSubmitButton({
  children,
  confirmActionLabel = "Ya, simpan",
  confirmDescription = "Perubahan ini akan disimpan ke database. Pastikan data sudah benar.",
  confirmTitle = "Konfirmasi perubahan",
  confirmVariant = "default",
  ...props
}: ConfirmedSubmitButtonProps) {
  const submitRef = useRef<HTMLButtonElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <SubmitButton
        {...props}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (props.disabled) return;
          setIsConfirmOpen(true);
        }}
      >
        {children}
      </SubmitButton>
      <button ref={submitRef} type="submit" hidden aria-hidden="true" tabIndex={-1} />
      <ConfirmDialog
        actionLabel={confirmActionLabel}
        description={confirmDescription}
        onConfirm={() => submitRef.current?.form?.requestSubmit(submitRef.current)}
        open={isConfirmOpen}
        title={confirmTitle}
        variant={confirmVariant}
        onOpenChange={setIsConfirmOpen}
      />
    </>
  );
}
