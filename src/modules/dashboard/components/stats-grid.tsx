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
          <Card key={item.key} className="group p-4 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-black tracking-tight text-slate-950">
              {formatNumber(Number(stats[item.key]))}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
