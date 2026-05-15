"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { MouseEvent } from "react";
import { Download, Eye, FilePenLine, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate, formatNumber } from "@/lib/utils";
import type { SurveyHistoryPage } from "@/lib/types";

const limitOptions = [10, 20, 50];

export function SurveyHistoryTable({ history }: { history: SurveyHistoryPage }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = searchParams.size ? `${pathname}?${searchParams.toString()}` : pathname;
  const showPending = isPending || Boolean(pendingHref && pendingHref !== currentPath);

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <Card className="relative overflow-hidden">
      {showPending ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[color:rgba(255,249,234,0.72)] backdrop-blur-sm">
          <div className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.12)] bg-[var(--atlas-paper)] px-5 py-4 text-center shadow-xl shadow-black/10">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--atlas-canopy)]" />
            <p className="mt-2 text-sm font-extrabold text-[var(--atlas-ink)]">Memuat halaman survei...</p>
            <p className="mt-1 text-xs font-semibold text-[color:rgba(22,37,29,0.52)]">Data dan foto sedang disiapkan.</p>
          </div>
        </div>
      ) : null}
      <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>Riwayat input survei</CardTitle>
          <CardDescription>
            {history.total} hasil tersimpan. Buka detail, edit jawaban, atau cetak PDF hasil inspeksi.
          </CardDescription>
        </div>
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center" action="/surveys/history">
          <label className="text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.5)]">
            Baris per halaman
          </label>
          <select name="limit" defaultValue={history.limit} className="atlas-select min-h-11 sm:w-28">
            {limitOptions.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
          <SubmitButton variant="outline" size="sm" pendingLabel="Menerapkan...">
            Terapkan
          </SubmitButton>
        </form>
      </CardHeader>

      {history.rows.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,249,234,0.48)] p-6 text-sm font-semibold text-[color:rgba(22,37,29,0.58)]">
          Belum ada survei tersimpan.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.48)]">
                  <th className="px-3 py-2">Tanggal</th>
                  <th className="px-3 py-2">Tempat</th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Surveyor</th>
                  <th className="px-3 py-2">Skor</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((row) => (
                  <tr key={row.id} className="rounded-2xl bg-[color:rgba(255,249,234,0.54)] shadow-sm shadow-black/5">
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-[color:rgba(22,37,29,0.62)]">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-extrabold text-[var(--atlas-ink)]">
                        {row.msme_subjects?.business_name ?? "Nama tempat belum ada"}
                      </p>
                      <p className="mt-1 max-w-72 truncate text-xs font-semibold text-[color:rgba(22,37,29,0.48)]">
                        {row.msme_subjects?.address ?? "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-bold text-[var(--atlas-ink)]">{row.survey_templates?.name ?? "Template"}</td>
                    <td className="px-3 py-3 text-[color:rgba(22,37,29,0.62)]">{row.profiles?.full_name ?? "-"}</td>
                    <td className="px-3 py-3">
                      <ScoreBadge score={Number(row.score)} />
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <RowActions id={row.id} pendingHref={pendingHref} onNavigate={navigate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {history.rows.map((row) => (
              <article
                key={row.id}
                className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.54)] p-4 shadow-sm shadow-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[var(--atlas-ink)]">
                      {row.msme_subjects?.business_name ?? "Nama tempat belum ada"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[color:rgba(22,37,29,0.58)]">
                      {row.survey_templates?.name ?? "Template"}
                    </p>
                  </div>
                  <ScoreBadge score={Number(row.score)} />
                </div>
                <dl className="mt-4 grid gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.42)]">
                      Tanggal
                    </dt>
                    <dd className="font-semibold text-[color:rgba(22,37,29,0.68)]">{formatDate(row.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.42)]">
                      Alamat
                    </dt>
                    <dd className="font-semibold text-[color:rgba(22,37,29,0.68)]">{row.msme_subjects?.address ?? "-"}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <RowActions id={row.id} pendingHref={pendingHref} onNavigate={navigate} />
                </div>
              </article>
            ))}
          </div>

          <Pagination history={history} pendingHref={pendingHref} onNavigate={navigate} />
        </>
      )}
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge className={score >= 80 ? undefined : "bg-[color:rgba(217,155,53,0.16)] text-[#8a5818]"}>
      Skor {formatNumber(score)}
    </Badge>
  );
}

function RowActions({
  id,
  pendingHref,
  onNavigate,
}: {
  id: string;
  pendingHref: string | null;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const detailHref = `/surveys/${id}`;
  const editHref = `/surveys/${id}/edit`;
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild variant="outline" size="sm" className="min-h-9 px-3 py-1.5 text-xs">
        <Link href={detailHref} onClick={(event) => onNavigate(event, detailHref)}>
          {pendingHref === detailHref ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          {pendingHref === detailHref ? "Memuat..." : "Detail"}
        </Link>
      </Button>
      <Button asChild variant="secondary" size="sm" className="min-h-9 px-3 py-1.5 text-xs">
        <Link href={editHref} onClick={(event) => onNavigate(event, editHref)}>
          {pendingHref === editHref ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePenLine className="h-4 w-4" />}
          {pendingHref === editHref ? "Memuat..." : "Edit"}
        </Link>
      </Button>
      <Button asChild size="sm" className="min-h-9 px-3 py-1.5 text-xs">
        <a href={`/surveys/${id}/export`}>
          <Download className="h-4 w-4" />
          PDF
        </a>
      </Button>
    </div>
  );
}

function Pagination({
  history,
  pendingHref,
  onNavigate,
}: {
  history: SurveyHistoryPage;
  pendingHref: string | null;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const previousPage = Math.max(1, history.page - 1);
  const nextPage = Math.min(history.totalPages, history.page + 1);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[color:rgba(22,37,29,0.1)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-[color:rgba(22,37,29,0.58)]">
        Halaman {history.page} dari {history.totalPages}
      </p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className={history.page <= 1 ? "pointer-events-none opacity-50" : undefined}>
          <Link href={pageHref(previousPage, history.limit)} onClick={(event) => onNavigate(event, pageHref(previousPage, history.limit))}>
            {pendingHref === pageHref(previousPage, history.limit) ? "Memuat..." : "Sebelumnya"}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={history.page >= history.totalPages ? "pointer-events-none opacity-50" : undefined}
        >
          <Link href={pageHref(nextPage, history.limit)} onClick={(event) => onNavigate(event, pageHref(nextPage, history.limit))}>
            {pendingHref === pageHref(nextPage, history.limit) ? "Memuat..." : "Berikutnya"}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function pageHref(page: number, limit: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return `/surveys/history?${params.toString()}`;
}
