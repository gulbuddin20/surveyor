import Link from "next/link";
import { ClipboardList, FileText, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { logoutAction } from "@/modules/auth/controllers/auth.controller";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/surveys", label: "Mulai Survei", icon: ClipboardList },
];

const adminNav = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/templates", label: "Template", icon: FileText },
  { href: "/admin/formulas", label: "Formula", icon: Settings },
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const nav = profile.role === "super_admin" ? [...userNav, ...adminNav] : userNav;

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:flex md:w-64 md:flex-col md:border-r md:border-t-0 md:p-4">
        <div className="hidden px-2 pb-6 md:block">
          <p className="text-xl font-bold text-slate-950">Surveyor IKL</p>
          <p className="text-sm text-slate-500">Permenkes 17/2024</p>
        </div>
        <nav className="grid grid-cols-5 gap-1 md:block md:space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-center text-[11px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 sm:text-xs md:flex-row md:px-3 md:text-left md:text-sm"
              >
                <Icon className="h-5 w-5" />
                <span className="truncate md:whitespace-normal">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction} className="md:mt-auto md:border-t md:border-slate-100 md:pt-4">
          <Button variant="ghost" size="sm" className="h-auto w-full flex-col px-1.5 py-2 text-[11px] sm:text-xs md:flex-row md:justify-start md:px-3 md:text-sm">
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </form>
      </aside>
      <main className="pb-24 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Masuk sebagai</p>
              <p className="font-semibold text-slate-950">{profile.full_name}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {profile.role === "super_admin" ? "Super Admin" : "Surveyor"}
            </span>
          </div>
        </header>
        <div className="px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
