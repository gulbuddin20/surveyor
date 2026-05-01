import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecentResponses } from "@/modules/dashboard/components/recent-responses";
import { StatsGrid } from "@/modules/dashboard/components/stats-grid";
import { loadDashboardController } from "@/modules/dashboard/controllers/dashboard.controller";

export default async function DashboardPage() {
  const { profile, dashboard } = await loadDashboardController();
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-950">Halo, {profile.full_name}</h1>
          <p className="mt-1 text-slate-500">Pantau progress digitalisasi survei MSME/TPP.</p>
        </div>
        <Button asChild><Link href="/surveys">Mulai survei</Link></Button>
      </div>
      <StatsGrid stats={dashboard.stats} />
      <RecentResponses rows={dashboard.recentResponses} />
    </div>
  );
}
