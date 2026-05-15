import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { loadSurveyResultController } from "@/modules/surveys/controllers/survey.controller";
import { downloadEvidenceFile } from "@/modules/surveys/repositories/evidence-storage";

type SignatureDisplayValue = { dataUrl: string; signedAt?: string };
type PhotoDisplayValue = {
  id: string;
  fieldKey: string | null;
  fileName: string | null;
  caption: string | null;
  storagePath: string;
  dataUrl: string | null;
};

export default async function SurveyResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail } = await loadSurveyResultController(id);
  const identityValues = detail.subject.metadata;
  const responseValues = detail.response.response_values ?? {};
  const textResponseFields = detail.responseFields.filter((field) => !["photo", "signature"].includes(field.field_type));
  const signatureFields = detail.responseFields.filter((field) => field.field_type === "signature");
  const signatureBlocks = await Promise.all(
    signatureFields.map(async (field) => ({
      field,
      signature: await getSignatureDisplayValue(responseValues[field.field_key]),
    })),
  );
  const photoFieldLabels = new Map(detail.responseFields.map((field) => [field.field_key, field.label]));
  const photoBlocks = await Promise.all(detail.photos.map(getPhotoDisplayValue));
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
          <Button asChild variant="secondary"><Link href={`/surveys/${id}/edit`}>Edit survei</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard">Dashboard</Link></Button>
          <Button asChild variant="outline"><Link href="/surveys">Survei lagi</Link></Button>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
          <CardDescription>Disubmit {formatDate(detail.response.submitted_at)}</CardDescription>
        </CardHeader>
        <dl className="grid gap-3 md:grid-cols-2">
          {detail.identityFields.map((field) => {
            const value = identityValues[field.field_key];
            return (
              <div key={field.id} className="rounded-2xl bg-[color:rgba(255,249,234,0.52)] p-3">
                <dt className="text-xs font-black uppercase tracking-wide text-[color:rgba(22,37,29,0.42)]">{field.label}</dt>
                <dd className="mt-1 text-sm text-[var(--atlas-ink)]">{String(value || "-")}</dd>
              </div>
            );
          })}
        </dl>
        {textResponseFields.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {textResponseFields.map((field) => (
              <NoteBlock key={field.id} title={field.label} value={String(responseValues[field.field_key] || "")} />
            ))}
          </div>
        ) : null}
        {signatureFields.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {signatureBlocks.map(({ field, signature }) => (
              <SignatureBlock key={field.id} title={field.label} signature={signature} />
            ))}
          </div>
        ) : null}
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
            {photoBlocks.map((photo) => (
              <div key={photo.id} className="rounded-2xl border border-[color:rgba(22,37,29,0.1)] bg-[var(--atlas-paper)] p-3 text-sm text-[color:rgba(22,37,29,0.62)]">
                {photo.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.dataUrl} alt={photo.fileName ?? "Foto bukti"} className="mb-3 aspect-[4/3] w-full rounded-[1.25rem] object-cover" />
                ) : null}
                <p className="font-extrabold text-[var(--atlas-ink)]">{photoFieldLabels.get(photo.fieldKey ?? "") ?? "Foto bukti"}</p>
                <p>{photo.fileName ?? "Foto bukti"}</p>
                <p>{photo.caption ?? "Tanpa keterangan"}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

async function getPhotoDisplayValue(photo: {
  id: string;
  field_key: string | null;
  file_name: string | null;
  caption: string | null;
  storage_path: string;
  mime_type: string | null;
}): Promise<PhotoDisplayValue> {
  const data = await downloadEvidenceFile(photo.storage_path);
  return {
    id: photo.id,
    fieldKey: photo.field_key,
    fileName: photo.file_name,
    caption: photo.caption,
    storagePath: photo.storage_path,
    dataUrl: data ? `data:${photo.mime_type ?? data.mimeType};base64,${data.buffer.toString("base64")}` : null,
  };
}

function NoteBlock({ title, value }: { title: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-[color:rgba(255,249,234,0.52)] p-4">
      <p className="text-sm font-extrabold text-[var(--atlas-ink)]">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-[color:rgba(22,37,29,0.62)]">{value || "-"}</p>
    </div>
  );
}

function SignatureBlock({ title, signature }: { title: string; signature: SignatureDisplayValue | null }) {
  return (
    <div className="rounded-2xl bg-[color:rgba(255,249,234,0.52)] p-4">
      <p className="text-sm font-extrabold text-[var(--atlas-ink)]">{title}</p>
      {signature ? (
        <div className="mt-3 rounded-2xl border border-[color:rgba(22,37,29,0.1)] bg-white/50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signature.dataUrl} alt={title} className="h-24 max-w-full object-contain" />
          {signature.signedAt ? (
            <p className="mt-2 text-xs text-[color:rgba(22,37,29,0.5)]">Ditandatangani {formatDate(signature.signedAt)}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[color:rgba(22,37,29,0.62)]">Belum ditandatangani.</p>
      )}
    </div>
  );
}

async function getSignatureDisplayValue(value: unknown): Promise<SignatureDisplayValue | null> {
  const parsed = parseSignatureValue(value);
  if (!parsed) return null;
  if ("dataUrl" in parsed) return parsed;

  const data = await downloadEvidenceFile(parsed.storagePath);
  if (!data) return null;
  return {
    dataUrl: `data:${parsed.mimeType ?? data.mimeType ?? "image/png"};base64,${data.buffer.toString("base64")}`,
    signedAt: parsed.signedAt,
  };
}

function parseSignatureValue(value: unknown): SignatureDisplayValue | { storagePath: string; signedAt?: string; mimeType?: string } | null {
  const parsed = typeof value === "string" ? safeParseJson(value) : value;
  if (!parsed || typeof parsed !== "object") return null;
  const storagePath = "storagePath" in parsed ? parsed.storagePath : null;
  if (typeof storagePath === "string" && storagePath.trim()) {
    return {
      storagePath,
      signedAt: "signedAt" in parsed && typeof parsed.signedAt === "string" ? parsed.signedAt : undefined,
      mimeType: "mimeType" in parsed && typeof parsed.mimeType === "string" ? parsed.mimeType : undefined,
    };
  }
  const dataUrl = "dataUrl" in parsed ? parsed.dataUrl : null;
  const signedAt = "signedAt" in parsed ? parsed.signedAt : null;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) return null;
  return {
    dataUrl,
    signedAt: typeof signedAt === "string" ? signedAt : undefined,
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
