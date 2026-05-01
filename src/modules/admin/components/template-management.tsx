import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SurveyTemplate } from "@/lib/types";
import { createTemplateAction } from "@/modules/admin/controllers/admin.controller";

export function TemplateManagement({ templates }: { templates: SurveyTemplate[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Template baru</CardTitle>
          <CardDescription>Template bisa dikembangkan menjadi section/question editor.</CardDescription>
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
          <select name="status" className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <Button type="submit" className="w-full">Simpan template</Button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>{template.status}</Badge>
              <Badge className="bg-slate-100 text-slate-700">/{Number(template.denominator)}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
