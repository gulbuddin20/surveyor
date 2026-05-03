import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root className={cn("h-3 overflow-hidden rounded-full bg-[color:rgba(22,37,29,0.1)] ring-1 ring-[color:rgba(22,37,29,0.08)]", className)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-[var(--atlas-moss)] via-[var(--atlas-lagoon)] to-[var(--atlas-coral)] transition-all duration-500"
        style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
