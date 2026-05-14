import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import type { TemplateResponseField } from "@/lib/types";
import { deleteResponseFieldAction } from "@/modules/admin/controllers/admin.controller";
import { ResponseFieldForm } from "@/modules/admin/components/response-field-form";

export function ResponseFieldEditor({
  templateId,
  field,
}: {
  templateId: string;
  field: TemplateResponseField;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.52)] p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-extrabold text-[var(--atlas-ink)]">{field.label}</p>
          <p className="text-sm text-[color:rgba(22,37,29,0.58)]">
            {field.field_key} · {field.field_type}
          </p>
        </div>
        <div className="flex gap-2">
          {field.is_required ? <Badge>Wajib</Badge> : null}
          <Badge className={field.is_active ? undefined : "bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]"}>
            {field.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <ResponseFieldForm templateId={templateId} field={field} />
      <ActionForm
        action={deleteResponseFieldAction}
        className="mt-3"
        confirmActionLabel="Ya, hapus field"
        confirmDescription={`Field "${field.label}" akan dihapus dari bagian setelah kuesioner.`}
        confirmTitle="Hapus field setelah kuesioner?"
        confirmVariant="destructive"
        successMessage="Field setelah kuesioner dihapus."
        errorMessage="Field gagal dihapus"
      >
        <input type="hidden" name="fieldId" value={field.id} />
        <Button type="submit" variant="destructive" size="sm">
          Hapus field
        </Button>
      </ActionForm>
    </div>
  );
}
