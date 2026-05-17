"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { EllipsisVertical, X } from "lucide-react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResponsiveActionMenuProps = {
  children: ReactNode;
  description?: string;
  title: string;
  triggerLabel?: string;
};

export function ResponsiveActionMenu({
  children,
  description,
  title,
  triggerLabel = "Buka aksi",
}: ResponsiveActionMenuProps) {
  return (
    <>
      <div className="hidden sm:block">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-10 w-10 min-w-10 rounded-full p-0" aria-label={triggerLabel}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-56 rounded-[1.25rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-paper)] p-2 text-[var(--atlas-ink)] shadow-[0_18px_54px_rgba(22,37,29,0.18)]"
            >
              <DropdownMenu.Label className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.46)]">
                {title}
              </DropdownMenu.Label>
              <div className="grid gap-1">{children}</div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="sm:hidden">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-10 w-10 min-w-10 rounded-full p-0" aria-label={triggerLabel}>
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(22,37,29,0.38)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-paper)] p-5 text-[var(--atlas-ink)] shadow-[0_-28px_72px_rgba(22,37,29,0.22)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[color:rgba(22,37,29,0.16)]" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Dialog.Title className="text-xl font-black text-[var(--atlas-ink)]">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-2 text-sm font-semibold leading-6 text-[color:rgba(22,37,29,0.62)]">
                      {description}
                    </Dialog.Description>
                  ) : null}
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
              <div className="mt-5 grid gap-2">{children}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  );
}

export function ActionMenuItem({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-extrabold text-[var(--atlas-ink)] transition hover:bg-[color:rgba(22,37,29,0.06)] disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function ActionMenuLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        "flex min-h-11 w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-extrabold text-[var(--atlas-ink)] transition hover:bg-[color:rgba(22,37,29,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
