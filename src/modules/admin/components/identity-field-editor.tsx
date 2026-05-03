import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TemplateIdentityField } from "@/lib/types";
import { deleteIdentityFieldAction } from "@/modules/admin/controllers/admin.controller";
import { IdentityFieldForm } from "@/modules/admin/components/identity-field-form";

export function IdentityFieldEditor({
  templateId,
  field,
}: {
  templateId: string;
  field: TemplateIdentityField;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">{field.label}</p>
          <p className="text-sm text-slate-500">
            {field.field_key} · {field.field_type}
          </p>
        </div>
        <div className="flex gap-2">
          {field.is_required ? <Badge>Wajib</Badge> : null}
          <Badge className={field.is_active ? undefined : "bg-slate-100 text-slate-700"}>
            {field.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <IdentityFieldForm templateId={templateId} field={field} />
      <form action={deleteIdentityFieldAction} className="mt-3">
        <input type="hidden" name="fieldId" value={field.id} />
        <Button type="submit" variant="destructive" size="sm">
          Hapus field
        </Button>
      </form>
    </div>
  );
}
