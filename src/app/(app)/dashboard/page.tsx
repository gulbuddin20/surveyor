import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecentResponses } from "@/modules/dashboard/components/recent-responses";
import { StatsGrid } from "@/modules/dashboard/components/stats-grid";
import { loadDashboardController } from "@/modules/dashboard/controllers/dashboard.controller";

export default async function DashboardPage() {
  const { profile, dashboard } = await loadDashboardController();
  return (
    <div className="atlas-reveal space-y-6">
      <div className="relative overflow-hidden rounded-[2.4rem] border border-[color:rgba(22,37,29,0.1)] bg-[var(--atlas-jungle)] p-6 text-[var(--atlas-paper)] shadow-[0_28px_80px_rgba(18,63,49,0.22)] sm:p-8">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[var(--atlas-coral)]/35 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--atlas-coral)]">Dashboard</p>
            <h1 className="atlas-heading mt-3 text-4xl font-black tracking-tight sm:text-5xl">Halo, {profile.full_name}</h1>
            <p className="mt-2 max-w-2xl text-[color:rgba(255,249,234,0.72)]">Pantau progress digitalisasi survei MSME/TPP dari satu ruang kendali lapangan.</p>
          </div>
          <Button asChild className="w-full sm:w-auto"><Link href="/surveys">Mulai survei</Link></Button>
        </div>
      </div>
      <StatsGrid stats={dashboard.stats} />
      <RecentResponses rows={dashboard.recentResponses} />
    </div>
  );
}
