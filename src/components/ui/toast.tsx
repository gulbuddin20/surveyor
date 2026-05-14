"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>) => (
  <ToastPrimitive.Viewport
    className={cn(
      "fixed top-3 left-1/2 z-[100] flex max-h-screen w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-col gap-2 p-0 sm:top-4 sm:right-4 sm:left-auto sm:w-full sm:max-w-sm sm:translate-x-0",
      className,
    )}
    {...props}
  />
);

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-2xl border p-4 pr-10 shadow-[0_18px_48px_rgba(22,37,29,0.18)] backdrop-blur-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-right-full",
  {
    variants: {
      variant: {
        success: "border-[color:rgba(15,107,79,0.24)] bg-[color:rgba(235,249,240,0.96)] text-[var(--atlas-jungle)]",
        error: "border-[color:rgba(242,111,76,0.32)] bg-[color:rgba(255,238,232,0.97)] text-[#8f2d1b]",
        default: "border-[color:rgba(22,37,29,0.14)] bg-[color:rgba(255,249,234,0.96)] text-[var(--atlas-ink)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>;

export const Toast = ({ className, variant, ...props }: ToastProps) => (
  <ToastPrimitive.Root className={cn(toastVariants({ variant }), className)} {...props} />
);

export const ToastTitle = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>) => (
  <ToastPrimitive.Title className={cn("text-sm font-black", className)} {...props} />
);

export const ToastDescription = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>) => (
  <ToastPrimitive.Description className={cn("mt-1 text-sm leading-5 opacity-82", className)} {...props} />
);

export const ToastClose = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>) => (
  <ToastPrimitive.Close
    className={cn(
      "absolute right-2 top-2 rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:rgba(22,37,29,0.18)]",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
);
