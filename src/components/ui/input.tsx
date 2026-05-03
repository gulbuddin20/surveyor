import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-2xl border border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,249,234,0.78)] px-3.5 text-sm text-[var(--atlas-ink)] outline-none transition placeholder:text-[color:rgba(22,37,29,0.42)] hover:border-[color:rgba(22,37,29,0.28)] focus:border-[var(--atlas-coral)] focus:bg-[var(--atlas-paper)] focus:ring-4 focus:ring-[color:rgba(242,111,76,0.16)]",
        className,
      )}
      {...props}
    />
  );
}
