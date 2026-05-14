"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCollapseCardProps = {
  active: boolean;
  children: React.ReactNode;
  childCount: number;
  defaultOpen?: boolean;
  questionCount: number;
  title: string;
};

export function SectionCollapseCard({
  active,
  children,
  childCount,
  defaultOpen = true,
  questionCount,
  title,
}: SectionCollapseCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn(!open ? "pb-3" : undefined)}>
      <CardHeader className={open ? undefined : "mb-0"}>
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
          <button
            type="button"
            className="group flex min-w-0 flex-1 items-start gap-3 rounded-2xl text-left outline-none transition hover:bg-[color:rgba(22,37,29,0.04)] focus-visible:ring-4 focus-visible:ring-[color:rgba(242,111,76,0.18)]"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.72)] text-[var(--atlas-jungle)] transition group-hover:border-[var(--atlas-coral)]">
              <ChevronDown className={cn("h-4 w-4 transition", open ? "rotate-0" : "-rotate-90")} />
            </span>
            <span className="min-w-0">
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {questionCount} pertanyaan langsung · {childCount} subbagian
              </CardDescription>
            </span>
          </button>
          <Badge className={active ? undefined : "bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]"}>
            {active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </CardHeader>
      {open ? <div className="space-y-4">{children}</div> : null}
    </Card>
  );
}
