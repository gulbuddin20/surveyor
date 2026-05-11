import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyTemplate, TemplateAdminDetail } from "@/lib/types";
import { createTemplateAction, deleteTemplateAction } from "@/modules/admin/controllers/admin.controller";
import { TemplateEditor } from "@/modules/admin/components/template-editor";

export function TemplateManagement({
  templates,
  detail,
  error,
}: {
  templates: SurveyTemplate[];
  detail: TemplateAdminDetail | null;
  error?: string;
}) {
  return (
    <div className="atlas-reveal space-y-6">
      <div>
        <p className="atlas-kicker">Admin template</p>
        <h1 className="atlas-heading mt-4 text-4xl font-black text-[var(--atlas-ink)] sm:text-5xl">Template, bagian, dan butir IKL</h1>
        <p className="mt-2 max-w-3xl text-[color:rgba(22,37,29,0.66)]">
          Kelola struktur bertingkat seperti formulir Food Truck: bagian, subbagian, pertanyaan, tipe input, dan bobot ketidaksesuaian.
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-[color:rgba(242,111,76,0.35)] bg-[color:rgba(242,111,76,0.1)] px-4 py-3 text-sm font-bold text-[var(--atlas-coral)]">
          {error}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template baru</CardTitle>
              <CardDescription>Buat jenis formulir IKL baru.</CardDescription>
            </CardHeader>
            <form action={createTemplateAction} className="space-y-4">
              <Input name="code" placeholder="kode-template" required />
              <Input name="name" placeholder="Nama template" required />
              <Textarea name="description" placeholder="Deskripsi" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Denominator</Label>
                  <Input name="denominator" type="number" defaultValue={100} required />
                </div>
                <div className="space-y-2">
                  <Label>Passing score</Label>
                  <Input name="passingScore" type="number" defaultValue={80} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Max upload foto (MB)</Label>
                <Input name="photoMaxSizeMb" type="number" min={1} max={25} defaultValue={10} required />
              </div>
              <select name="status" className="atlas-select">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <Button type="submit" className="w-full">Simpan template</Button>
            </form>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Daftar template</CardTitle>
              <CardDescription>Pilih template untuk mengedit bagian dan pertanyaan.</CardDescription>
            </CardHeader>
            <div className="space-y-2">
              {templates.map((template) => (
                <TemplateLink key={template.id} template={template} active={detail?.id === template.id} />
              ))}
            </div>
          </Card>
        </div>
        {detail ? <TemplateEditor detail={detail} /> : <EmptyTemplateState />}
      </div>
    </div>
  );
}

function TemplateLink({ template, active }: { template: SurveyTemplate; active: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-3 transition hover:-translate-y-0.5 ${
        active ? "border-[var(--atlas-coral)] bg-[color:rgba(242,111,76,0.1)]" : "border-[color:rgba(22,37,29,0.1)] hover:bg-[var(--atlas-paper)]"
      }`}
    >
      <Link href={`/admin/templates?template=${template.id}`} className="block">
        <p className="font-extrabold text-[var(--atlas-ink)]">{template.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{template.status}</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">/{Number(template.denominator)}</Badge>
        </div>
      </Link>
      <form action={deleteTemplateAction} className="mt-3">
        <input type="hidden" name="templateId" value={template.id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          className="min-h-9 px-3 py-1.5 text-xs"
          title="Hanya super admin yang bisa menghapus template"
        >
          Hapus template
        </Button>
      </form>
    </div>
  );
}

function EmptyTemplateState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Belum ada template</CardTitle>
        <CardDescription>Buat template terlebih dahulu sebelum menambah bagian dan pertanyaan.</CardDescription>
      </CardHeader>
    </Card>
  );
}
