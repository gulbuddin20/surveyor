import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

type RecentRow = {
  id: string;
  score: number;
  result_label: string;
  created_at: string;
  survey_templates?: { name?: string } | null;
  msme_subjects?: { business_name?: string; address?: string | null } | null;
};

export function RecentResponses({ rows }: { rows: RecentRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Survei terbaru</CardTitle>
        <CardDescription>Aktivitas input IKL terakhir.</CardDescription>
      </CardHeader>
      <div className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-[color:rgba(22,37,29,0.58)]">Belum ada survei.</p> : null}
        {rows.map((row) => (
          <div key={row.id} className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.44)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--atlas-paper)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-extrabold text-[var(--atlas-ink)]">
                  {row.msme_subjects?.business_name ?? "Nama usaha belum ada"}
                </p>
                <p className="text-sm text-[color:rgba(22,37,29,0.58)]">{row.survey_templates?.name ?? "Template"}</p>
              </div>
              <Badge className={Number(row.score) >= 80 ? undefined : "bg-[color:rgba(217,155,53,0.16)] text-[#8a5818]"}>
                Skor {formatNumber(Number(row.score))}
              </Badge>
            </div>
            <p className="mt-2 text-xs font-semibold text-[color:rgba(22,37,29,0.42)]">{formatDate(row.created_at)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
