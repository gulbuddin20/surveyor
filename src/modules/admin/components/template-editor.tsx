import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateAdminDetail } from "@/lib/types";
import { IdentityFieldEditor } from "@/modules/admin/components/identity-field-editor";
import { IdentityFieldForm } from "@/modules/admin/components/identity-field-form";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { ResponseFieldEditor } from "@/modules/admin/components/response-field-editor";
import { ResponseFieldForm } from "@/modules/admin/components/response-field-form";
import { SectionEditor } from "@/modules/admin/components/section-editor";
import { SectionForm } from "@/modules/admin/components/section-form";
import { SortableAdminList } from "@/modules/admin/components/sortable-admin-list";
import {
  reorderIdentityFieldsAction,
  reorderResponseFieldsAction,
  reorderSectionsAction,
  updateTemplateSettingsAction,
} from "@/modules/admin/controllers/admin.controller";
import { countQuestions } from "@/modules/surveys/services/formula.service";

export function TemplateEditor({ detail }: { detail: TemplateAdminDetail }) {
  const reorderIdentityAction = reorderIdentityFieldsAction.bind(null, detail.id);
  const reorderResponseAction = reorderResponseFieldsAction.bind(null, detail.id);
  const reorderRootSectionsAction = reorderSectionsAction.bind(null, detail.id, null);

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
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">{detail.identityFields.length} header</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">{detail.responseFields.length} field tambahan</Badge>
          <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">Denominator {Number(detail.denominator)}</Badge>
        </div>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Header identitas</CardTitle>
          <CardDescription>
            Field ini muncul sebelum kuesioner. Gunakan untuk Alamat, NIB, Nama Pemeriksa, Tanggal Penilaian, dan header lain dari formulir.
          </CardDescription>
        </CardHeader>
        <details className="group rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.42)] p-3">
          <summary className="cursor-pointer list-none text-sm font-extrabold text-[var(--atlas-jungle)]">
            Tambah header
          </summary>
          <div className="mt-3">
            <IdentityFieldForm templateId={detail.id} />
          </div>
        </details>
        <SortableAdminList
          key={detail.identityFields.map((field) => `${field.id}:${field.sort_order}:${field.updated_at}`).join("|")}
          className="mt-4"
          reorderAction={reorderIdentityAction}
          empty={<p className="mt-4 text-sm text-[color:rgba(22,37,29,0.58)]">Belum ada header. Klik Tambah header untuk mulai dari kosong.</p>}
          items={detail.identityFields.map((field) => ({
            id: field.id,
            label: field.label,
            node: <IdentityFieldEditor templateId={detail.id} field={field} />,
          }))}
        />
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Field setelah kuesioner</CardTitle>
          <CardDescription>
            Atur catatan, rekomendasi, upload foto, atau field tambahan lain. Jika kosong, tidak ada field tambahan yang muncul.
          </CardDescription>
        </CardHeader>
        <form action={updateTemplateSettingsAction} className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="templateId" value={detail.id} />
          <div className="space-y-2">
            <Label>Default max upload foto (MB)</Label>
            <Input name="photoMaxSizeMb" type="number" min={1} max={25} defaultValue={detail.photo_max_size_mb} />
          </div>
          <Button type="submit" className="md:self-end">Simpan pengaturan</Button>
        </form>
        <details className="group rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.42)] p-3">
          <summary className="cursor-pointer list-none text-sm font-extrabold text-[var(--atlas-jungle)]">
            Tambah field setelah kuesioner
          </summary>
          <div className="mt-3">
            <ResponseFieldForm templateId={detail.id} />
          </div>
        </details>
        <SortableAdminList
          key={detail.responseFields.map((field) => `${field.id}:${field.sort_order}:${field.updated_at}`).join("|")}
          className="mt-4"
          reorderAction={reorderResponseAction}
          empty={<p className="mt-4 text-sm text-[color:rgba(22,37,29,0.58)]">Belum ada field setelah kuesioner.</p>}
          items={detail.responseFields.map((field) => ({
            id: field.id,
            label: field.label,
            node: <ResponseFieldEditor templateId={detail.id} field={field} />,
          }))}
        />
      </Card>
      <SectionForm templateId={detail.id} sections={detail.flatSections} />
      <QuestionForm templateId={detail.id} sections={detail.flatSections} />
      <SortableAdminList
        key={detail.sections.map((section) => `${section.id}:${section.sort_order}:${section.title}:${section.is_active}`).join("|")}
        className="space-y-4"
        reorderAction={reorderRootSectionsAction}
        items={detail.sections.map((section) => ({
          id: section.id,
          label: section.title,
          node: <SectionEditor templateId={detail.id} section={section} sections={detail.flatSections} />,
        }))}
      />
    </div>
  );
}
