"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { ClipboardList, FileClock, FileText, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings, Users } from "lucide-react";
import { FiklingoLogo } from "@/components/brand/fiklingo-logo";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/modules/auth/controllers/auth.controller";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/surveys", label: "Mulai Survei", icon: ClipboardList },
  { href: "/surveys/history", label: "Riwayat Survei", icon: FileClock },
];

const adminNav = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/templates", label: "Template", icon: FileText },
  { href: "/admin/formulas", label: "Formula", icon: Settings },
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const nav = profile.role === "super_admin" ? [...userNav, ...adminNav] : userNav;
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    const mobileSidebar = document.getElementById("mobile-sidebar");
    if (mobileSidebar instanceof HTMLInputElement) mobileSidebar.checked = false;
  }, [pathname]);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      pathname === href
    ) {
      return;
    }

    event.preventDefault();
    setTargetPath(href);
    startNavigation(() => {
      router.push(href);
    });
  };

  const showRoutePending = isNavigating || Boolean(targetPath && targetPath !== pathname);

  return (
    <div className="group/shell min-h-screen has-[[data-sidebar='collapsed']:checked]:md:[--sidebar-width:5.75rem] md:[--sidebar-width:18rem]">
      <input id="mobile-sidebar" type="checkbox" className="peer/mobile sr-only" aria-hidden="true" />
      <input id="desktop-sidebar" type="checkbox" className="peer/desktop sr-only" aria-hidden="true" data-sidebar="collapsed" />

      <label
        htmlFor="mobile-sidebar"
        className="fixed inset-0 z-40 hidden bg-[color:rgba(22,37,29,0.56)] backdrop-blur-sm peer-checked/mobile:block md:hidden"
        aria-label="Tutup menu"
      />

      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-[color:rgba(255,249,234,0.32)] bg-[color:rgba(18,63,49,0.93)] p-4 text-[var(--atlas-paper)] shadow-2xl shadow-[rgba(18,63,49,0.22)] backdrop-blur-xl transition duration-300 peer-checked/mobile:translate-x-0 md:w-[var(--sidebar-width)] md:translate-x-0 md:shadow-none md:transition-[width]">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[color:rgba(255,249,234,0.18)] bg-[color:rgba(255,249,234,0.08)] px-4 py-4 md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-3">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--atlas-coral)]/30 blur-2xl" />
          <div className="relative flex min-h-14 items-center justify-between gap-3 md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center">
            <FiklingoLogo
              className="text-[var(--atlas-paper)] md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden"
              markClassName="rounded-2xl ring-white/30"
            />
            <FiklingoLogo
              showText={false}
              className="hidden md:group-has-[[data-sidebar='collapsed']:checked]/shell:flex"
              markClassName="h-11 w-11 rounded-2xl ring-white/30"
            />
          </div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/surveys"
              ? pathname === item.href || pathname === "/surveys/new"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={cn(
                  "group/nav flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-extrabold text-[color:rgba(255,249,234,0.68)] transition hover:bg-[color:rgba(255,249,234,0.11)] hover:text-[var(--atlas-paper)] md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-0",
                  active && "bg-[var(--atlas-paper)] text-[var(--atlas-jungle)] shadow-[0_16px_38px_rgba(0,0,0,0.16)]",
                  targetPath === item.href && !active && "bg-[color:rgba(255,249,234,0.16)] text-[var(--atlas-paper)]",
                )}
                onClick={(event) => handleNavClick(event, item.href)}
                onMouseEnter={() => router.prefetch(item.href)}
                title={item.label}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[color:rgba(255,249,234,0.1)] text-[color:rgba(255,249,234,0.7)] transition group-hover/nav:bg-[color:rgba(255,249,234,0.16)] group-hover/nav:text-[var(--atlas-paper)]",
                    active && "bg-[var(--atlas-coral)] text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[color:rgba(255,249,234,0.14)] pt-4">
          <label
            htmlFor="desktop-sidebar"
            className="hidden min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3 text-sm font-extrabold text-[color:rgba(255,249,234,0.62)] transition hover:bg-[color:rgba(255,249,234,0.1)] hover:text-[var(--atlas-paper)] md:flex md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-0"
            title="Expand/collapse sidebar"
          >
            <PanelLeftClose className="h-5 w-5 md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden" />
            <PanelLeftOpen className="hidden h-5 w-5 md:group-has-[[data-sidebar='collapsed']:checked]/shell:block" />
            <span className="md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">Collapse</span>
          </label>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-[color:rgba(255,249,234,0.7)] hover:bg-[color:rgba(242,111,76,0.16)] hover:text-[var(--atlas-paper)] md:group-has-[[data-sidebar='collapsed']:checked]/shell:justify-center md:group-has-[[data-sidebar='collapsed']:checked]/shell:px-0"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
              <span className="md:group-has-[[data-sidebar='collapsed']:checked]/shell:hidden">Keluar</span>
            </Button>
          </form>
        </div>
      </aside>

      <main className="min-h-screen transition-[margin] duration-300 md:ml-[var(--sidebar-width)]">
        {showRoutePending ? (
          <div className="fixed inset-x-0 top-0 z-[70] h-1 bg-[color:rgba(15,107,79,0.16)] md:left-[var(--sidebar-width)]">
            <div className="h-full w-1/2 animate-pulse rounded-r-full bg-[var(--atlas-coral)]" />
          </div>
        ) : null}
        <header className="sticky top-0 z-30 border-b border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(243,234,215,0.78)] px-4 py-3 shadow-sm shadow-black/5 backdrop-blur-xl md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <label
                htmlFor="mobile-sidebar"
                className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-2xl border border-[color:rgba(22,37,29,0.16)] bg-[var(--atlas-paper)] text-[var(--atlas-ink)] shadow-sm md:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </label>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--atlas-canopy)]">Masuk sebagai</p>
                <p className="truncate font-extrabold text-[var(--atlas-ink)]">{profile.full_name}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-full border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.64)] px-3 py-1.5 text-xs font-extrabold text-[var(--atlas-canopy)] sm:inline-flex">
                {profile.role === "super_admin" ? "Super Admin" : "Surveyor"}
              </span>
            </div>
          </div>
        </header>
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 md:py-8 lg:px-8",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
