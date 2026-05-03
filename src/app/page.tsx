import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Paperless IKL",
    description: "Input hanya temuan tidak sesuai, sistem menghitung skor otomatis.",
    icon: ClipboardCheck,
  },
  {
    title: "Admin regulasi",
    description: "Template survei dan formula bisa disesuaikan saat aturan berubah.",
    icon: ShieldCheck,
  },
  {
    title: "Mobile first",
    description: "UI responsif untuk surveyor lapangan di perangkat mobile.",
    icon: Smartphone,
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[var(--atlas-coral)]/20 blur-3xl" />
      <div className="absolute -left-28 bottom-12 h-80 w-80 rounded-full bg-[var(--atlas-lagoon)]/18 blur-3xl" />
      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="atlas-reveal max-w-4xl">
          <p className="atlas-kicker">Surveyor IKL</p>
          <h1 className="atlas-heading mt-6 max-w-4xl text-5xl font-black leading-[0.92] text-[var(--atlas-ink)] sm:text-7xl lg:text-8xl">
            Atlas lapangan untuk inspeksi kesehatan lingkungan.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-[color:rgba(22,37,29,0.68)]">
            Formulir IKL Permenkes 17/2024 yang terasa seperti peta kerja surveyor: cepat dibaca, siap mobile,
            dan tetap presisi untuk admin regulasi.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/login">Masuk aplikasi <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/surveys">Lihat template</Link></Button>
          </div>
        </div>
        <div className="atlas-reveal relative rounded-[2.4rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-jungle)] p-5 text-[var(--atlas-paper)] shadow-[0_34px_90px_rgba(18,63,49,0.28)] [animation-delay:120ms]">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--atlas-coral)]/45 blur-2xl" />
          <div className="relative rounded-[1.8rem] border border-[color:rgba(255,249,234,0.16)] bg-[color:rgba(255,249,234,0.08)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[color:rgba(255,249,234,0.58)]">
              Field console
            </p>
            <p className="atlas-heading mt-8 text-6xl font-black">17/24</p>
            <p className="mt-3 text-sm leading-6 text-[color:rgba(255,249,234,0.7)]">
              Input hanya temuan tidak sesuai, skor dihitung otomatis, dan bukti lapangan tersimpan rapi.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-[var(--atlas-paper)] p-4 text-[var(--atlas-jungle)]">
                <p className="text-xs font-black uppercase tracking-[0.18em]">Mode</p>
                <p className="atlas-heading mt-6 text-3xl font-black">SSR</p>
              </div>
              <div className="rounded-3xl border border-[color:rgba(255,249,234,0.16)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--atlas-coral)]">RLS</p>
                <p className="atlas-heading mt-6 text-3xl font-black">Safe</p>
              </div>
            </div>
          </div>
        </div>
        <div className="atlas-reveal grid gap-4 md:grid-cols-3 lg:col-span-2 [animation-delay:220ms]">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:-translate-y-1">
                <Icon className="h-8 w-8 text-[var(--atlas-coral)]" />
                <CardHeader className="px-0 pb-0">
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
