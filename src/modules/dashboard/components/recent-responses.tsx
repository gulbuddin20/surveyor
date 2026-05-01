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
        {rows.length === 0 ? <p className="text-sm text-slate-500">Belum ada survei.</p> : null}
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">
                  {row.msme_subjects?.business_name ?? "Nama usaha belum ada"}
                </p>
                <p className="text-sm text-slate-500">{row.survey_templates?.name ?? "Template"}</p>
              </div>
              <Badge className={Number(row.score) >= 80 ? undefined : "bg-amber-50 text-amber-700"}>
                Skor {formatNumber(Number(row.score))}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-400">{formatDate(row.created_at)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
