import Image from "next/image";
import { cn } from "@/lib/utils";

export function FiklingoLogo({
  className,
  markClassName,
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Image
        src="/fiklingo-logo.jpeg"
        width={96}
        height={96}
        alt=""
        className={cn(
          "h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-[color:rgba(22,37,29,0.12)]",
          markClassName,
        )}
      />
      {showText ? (
        <div className="min-w-0">
          <p className="atlas-heading truncate text-2xl font-black leading-none">FIKLINGO</p>
          <p className="mt-1 truncate text-xs font-bold uppercase tracking-[0.14em] opacity-75">
            Form Kesehatan Lingkungan Online
          </p>
        </div>
      ) : null}
    </div>
  );
}
