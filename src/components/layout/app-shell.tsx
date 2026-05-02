"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ClipboardList, FileText, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
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
  const pathname = usePathname();

  useEffect(() => {
    const mobileSidebar = document.getElementById("mobile-sidebar");
    if (mobileSidebar instanceof HTMLInputElement) mobileSidebar.checked = false;
  }, [pathname]);

  return (
    <div className="group/shell min-h-screen bg-[radial-gradient(circle_at_top_left,#d1fae5_0,#f8fafc_32rem)] has-[[data-sidebar='collapsed']:checked]:md:[--sidebar-width:5.5rem] md:[--sidebar-width:17rem]">
      <input id="mobile-sidebar" type="checkbox" className="peer/mobile sr-only" aria-hidden="true" />
      <input id="desktop-sidebar" type="checkbox" className="peer/desktop sr-only" aria-hidden="true" data-sidebar="collapsed" />

      <label
        htmlFor="mobile-sidebar"
        className="fixed inset-0 z-40 hidden bg-slate-950/40 backdrop-blur-sm peer-checked/mobile:block md:hidden"
        aria-label="Tutup menu"
      />

      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-white/70 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur transition duration-300 peer-checked/mobile:translate-x-0 md:w-[var(--sidebar-width)] md:translate-x-0 md:shadow-none md:transition-[width]">
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-4 py-3 text-white md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-3">
          <div className="min-w-0 md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">
            <p className="truncate text-lg font-bold">Surveyor IKL</p>
            <p className="truncate text-xs text-emerald-50">Permenkes 17/2024</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15 text-sm font-bold ring-1 ring-white/20">
            IKL
          </span>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group/nav flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-0",
                  active && "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-900/5",
                )}
                title={item.label}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover/nav:bg-white group-hover/nav:text-emerald-700",
                    active && "bg-white text-emerald-700",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 pt-4">
          <label
            htmlFor="desktop-sidebar"
            className="hidden min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 md:flex md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-0"
            title="Expand/collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5 md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden" />
            <PanelLeftOpen className="hidden h-5 w-5 md:group-has-[[data-sidebar='collapsed']:checked]/shell:block" />
            <span className="md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">Collapse</span>
          </label>
        </div>
      </aside>

      <main className="min-h-screen transition-[margin] duration-300 md:ml-[var(--sidebar-width)]">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <label
                htmlFor="mobile-sidebar"
                className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </label>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Masuk sebagai</p>
                <p className="truncate font-semibold text-slate-950">{profile.full_name}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex">
                {profile.role === "super_admin" ? "Super Admin" : "Surveyor"}
              </span>
              <form action={logoutAction}>
                <Button variant="outline" size="sm" className="rounded-full px-4">
                  Keluar
                </Button>
              </form>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 md:py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
