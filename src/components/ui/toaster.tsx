"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";

type ToastVariant = NonNullable<ToastProps["variant"]>;

type AppToast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside AppToaster");
  return context;
}

export function AppToaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<AppToast[]>([]);

  const toast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [
      ...current.slice(-3),
      {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "default",
      },
    ]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider swipeDirection="right" duration={4200}>
        {children}
        {toasts.map((item) => (
          <Toast
            key={item.id}
            variant={item.variant}
            onOpenChange={(open) => {
              if (!open) setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id));
            }}
          >
            <div>
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
