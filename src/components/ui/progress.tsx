import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <ProgressPrimitive.Root className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-emerald-600 transition-all"
        style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
