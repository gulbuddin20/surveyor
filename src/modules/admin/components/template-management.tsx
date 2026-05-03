import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyTemplate, TemplateAdminDetail } from "@/lib/types";
import { createTemplateAction } from "@/modules/admin/controllers/admin.controller";
import { TemplateEditor } from "@/modules/admin/components/template-editor";

export function TemplateManagement({
  templates,
  detail,
}: {
  templates: SurveyTemplate[];
  detail: TemplateAdminDetail | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Admin template</p>
        <h1 className="text-3xl font-bold text-slate-950">Template, bagian, dan butir IKL</h1>
        <p className="mt-1 max-w-3xl text-slate-500">
          Kelola struktur bertingkat seperti formulir Food Truck: bagian, subbagian, pertanyaan, tipe input, dan bobot ketidaksesuaian.
        </p>
      </div>
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
              <select name="status" className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
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
    <Link
      href={`/admin/templates?template=${template.id}`}
      className={`block rounded-2xl border p-3 transition ${
        active ? "border-emerald-300 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"
      }`}
    >
      <p className="font-semibold text-slate-950">{template.name}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge>{template.status}</Badge>
        <Badge className="bg-slate-100 text-slate-700">/{Number(template.denominator)}</Badge>
      </div>
    </Link>
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
