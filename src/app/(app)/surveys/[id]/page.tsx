import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { loadSurveyResultController } from "@/modules/surveys/controllers/survey.controller";

export default async function SurveyResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail } = await loadSurveyResultController(id);
  const identityValues = detail.subject.metadata;
  return (
    <div className="atlas-reveal mx-auto max-w-5xl space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Survei tersimpan</CardTitle>
          <CardDescription>ID response: {id}</CardDescription>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-[color:rgba(22,37,29,0.06)] p-4 md:col-span-2">
            <p className="text-sm font-bold text-[color:rgba(22,37,29,0.52)]">Nama usaha</p>
            <p className="font-extrabold text-[var(--atlas-ink)]">{detail.subject.business_name}</p>
            <p className="mt-1 text-sm text-[color:rgba(22,37,29,0.58)]">{detail.template.name}</p>
          </div>
          <div className="rounded-2xl bg-[color:rgba(121,168,77,0.16)] p-4">
            <p className="text-sm font-bold text-[var(--atlas-canopy)]">Skor</p>
            <p className="atlas-heading text-4xl font-black text-[var(--atlas-canopy)]">{formatNumber(Number(detail.response.score))}</p>
          </div>
          <div className="rounded-2xl bg-[color:rgba(242,111,76,0.12)] p-4">
            <p className="text-sm font-bold text-[var(--atlas-coral)]">Ketidaksesuaian</p>
            <p className="atlas-heading text-4xl font-black text-[var(--atlas-ink)]">{formatNumber(Number(detail.response.total_nonconformity))}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><a href={`/surveys/${id}/export`}>Export PDF</a></Button>
          <Button asChild variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
          <Button asChild variant="outline"><Link href="/surveys">Survei lagi</Link></Button>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Identitas & catatan</CardTitle>
          <CardDescription>Disubmit {formatDate(detail.response.submitted_at)}</CardDescription>
        </CardHeader>
        <dl className="grid gap-3 md:grid-cols-2">
          {Object.entries(identityValues).map(([key, value]) => (
            <div key={key} className="rounded-2xl bg-[color:rgba(255,249,234,0.52)] p-3">
              <dt className="text-xs font-black uppercase tracking-wide text-[color:rgba(22,37,29,0.42)]">{key.replaceAll("_", " ")}</dt>
              <dd className="mt-1 text-sm text-[var(--atlas-ink)]">{String(value || "-")}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NoteBlock title="Catatan / kritik / saran" value={detail.response.notes} />
          <NoteBlock title="Rekomendasi tindak lanjut" value={detail.response.recommendation_notes} />
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Temuan & foto bukti</CardTitle>
          <CardDescription>Butir yang dicentang sebagai tidak memenuhi persyaratan.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {detail.answers.length === 0 ? <p className="text-sm text-[color:rgba(22,37,29,0.58)]">Tidak ada ketidaksesuaian dicatat.</p> : null}
          {detail.answers.map((answer) => (
            <div key={answer.id} className="rounded-2xl border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.52)] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="font-extrabold text-[var(--atlas-ink)]">{answer.survey_questions?.label ?? "Pertanyaan"}</p>
                <Badge>Bobot {formatNumber(Number(answer.score))}</Badge>
              </div>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            {detail.photos.map((photo) => (
              <div key={photo.id} className="rounded-2xl border border-[color:rgba(22,37,29,0.1)] bg-[var(--atlas-paper)] p-3 text-sm text-[color:rgba(22,37,29,0.62)]">
                <p className="font-extrabold text-[var(--atlas-ink)]">{photo.file_name ?? "Foto bukti"}</p>
                <p>{photo.caption ?? "Tanpa keterangan"}</p>
                <p className="mt-1 text-xs text-[color:rgba(22,37,29,0.4)]">{photo.storage_path}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function NoteBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-[color:rgba(255,249,234,0.52)] p-4">
      <p className="text-sm font-extrabold text-[var(--atlas-ink)]">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[color:rgba(22,37,29,0.62)]">{value || "-"}</p>
    </div>
  );
}
