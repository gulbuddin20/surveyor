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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
            Surveyor IKL
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Digitalisasi survei MSME/TPP berbasis Permenkes 17/2024.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Aplikasi SSR Next.js untuk super admin dan surveyor reguler dengan Supabase, RLS, formula dinamis, dan desain responsif.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/login">Masuk aplikasi <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/surveys">Lihat template</Link></Button>
          </div>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <Icon className="h-8 w-8 text-emerald-600" />
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
