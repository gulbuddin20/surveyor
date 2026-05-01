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
          <Card key={item.key} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{item.label}</p>
              <Icon className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatNumber(Number(stats[item.key]))}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
