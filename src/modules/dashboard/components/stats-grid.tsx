import { Activity, AlertTriangle, ClipboardCheck, Store, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const cards = [
  { key: "totalResponses", label: "Total survei", icon: ClipboardCheck },
  { key: "submittedResponses", label: "Terkirim", icon: Activity },
  { key: "totalSubjects", label: "MSME/TPP", icon: Store },
  { key: "averageScore", label: "Rata-rata skor", icon: TrendingUp },
  { key: "failedResponses", label: "Perlu perbaikan", icon: AlertTriangle },
] as const;

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.key} className="group p-4 hover:-translate-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[color:rgba(22,37,29,0.52)]">{item.label}</p>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:rgba(242,111,76,0.12)] text-[var(--atlas-coral)] transition group-hover:rotate-3 group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="atlas-heading mt-5 text-4xl font-black text-[var(--atlas-ink)]">
              {formatNumber(Number(stats[item.key]))}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
