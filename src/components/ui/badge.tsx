import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.68)] px-2.5 py-1 text-xs font-extrabold text-[var(--atlas-canopy)] shadow-sm shadow-black/5",
        className,
      )}
      {...props}
    />
  );
}
