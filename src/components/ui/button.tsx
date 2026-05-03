import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl text-sm font-extrabold tracking-[-0.01em] transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(242,111,76,0.22)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--atlas-jungle)] text-[var(--atlas-paper)] shadow-[0_14px_32px_rgba(18,63,49,0.25)] hover:-translate-y-0.5 hover:bg-[var(--atlas-canopy)]",
        secondary:
          "bg-[color:rgba(121,168,77,0.16)] text-[var(--atlas-jungle)] hover:-translate-y-0.5 hover:bg-[color:rgba(121,168,77,0.24)]",
        outline:
          "border border-[color:rgba(22,37,29,0.18)] bg-[color:rgba(255,249,234,0.7)] text-[var(--atlas-ink)] hover:-translate-y-0.5 hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]",
        ghost:
          "text-[var(--atlas-ink)] hover:bg-[color:rgba(22,37,29,0.07)]",
        destructive:
          "bg-[var(--atlas-coral)] text-white shadow-[0_14px_32px_rgba(242,111,76,0.24)] hover:-translate-y-0.5 hover:bg-[#d95433]",
      },
      size: {
        sm: "min-h-10 px-3.5",
        default: "px-4 py-2.5",
        lg: "min-h-13 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
