import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SectionWithQuestions, TemplateAdminDetail } from "@/lib/types";
import { IdentityFieldEditor } from "@/modules/admin/components/identity-field-editor";
import { IdentityFieldForm } from "@/modules/admin/components/identity-field-form";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { SectionEditor } from "@/modules/admin/components/section-editor";
import { SectionForm } from "@/modules/admin/components/section-form";
import { updateTemplateSettingsAction } from "@/modules/admin/controllers/admin.controller";

export function TemplateEditor({ detail }: { detail: TemplateAdminDetail }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{detail.name}</CardTitle>
          <CardDescription>{detail.description}</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{detail.status}</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">{detail.sections.length} bagian utama</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">{countQuestions(detail.sections)} pertanyaan</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">Denominator {Number(detail.denominator)}</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">Upload {Number(detail.photo_max_size_mb)} MB</Badge>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Field identitas & upload</CardTitle>
          <CardDescription>
            Atur field di atas kuesioner untuk setiap UMKM dan batas ukuran foto bukti.
          </CardDescription>
        </CardHeader>
        <form action={updateTemplateSettingsAction} className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="templateId" value={detail.id} />
          <div className="space-y-2">
            <Label>Max upload foto (MB)</Label>
            <Input name="photoMaxSizeMb" type="number" min={1} max={25} defaultValue={detail.photo_max_size_mb} />
          </div>
          <Button type="submit" className="md:self-end">Simpan pengaturan</Button>
        </form>
        <IdentityFieldForm templateId={detail.id} />
        <div className="mt-4 space-y-3">
          {detail.identityFields.length === 0 ? (
            <p className="text-sm text-[color:rgba(22,37,29,0.58)]">Belum ada field identitas khusus.</p>
          ) : null}
          {detail.identityFields.map((field) => (
            <IdentityFieldEditor key={field.id} templateId={detail.id} field={field} />
          ))}
        </div>
      </Card>
      <SectionForm templateId={detail.id} sections={detail.flatSections} />
      <QuestionForm templateId={detail.id} sections={detail.flatSections} />
      <div className="space-y-4">
        {detail.sections.map((section) => (
          <SectionEditor key={section.id} templateId={detail.id} section={section} sections={detail.flatSections} />
        ))}
      </div>
    </div>
  );
}

function countQuestions(sections: SectionWithQuestions[]): number {
  return sections.reduce((total, section) => total + section.questions.length + countQuestions(section.children), 0);
}
