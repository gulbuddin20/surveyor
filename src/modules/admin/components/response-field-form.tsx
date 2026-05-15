import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateResponseField } from "@/lib/types";
import { saveResponseFieldAction } from "@/modules/admin/controllers/admin.controller";
import { ResponseFieldTypeControls } from "@/modules/admin/components/response-field-type-controls";

export function ResponseFieldForm({
  templateId,
  field,
}: {
  templateId: string;
  field?: TemplateResponseField;
}) {
  const maxSizeMb = typeof field?.settings?.max_size_mb === "number" ? field.settings.max_size_mb : 10;

  return (
    <ActionForm
      action={saveResponseFieldAction}
      className="atlas-fieldset grid gap-3 rounded-[1.5rem] p-4 lg:grid-cols-12"
      resetOnSuccess={!field}
      successMessage={field ? "Field setelah kuesioner diperbarui." : "Field setelah kuesioner ditambahkan."}
      errorMessage="Field gagal disimpan"
    >
      <input type="hidden" name="templateId" value={templateId} />
      {field ? <input type="hidden" name="fieldId" value={field.id} /> : null}
      <div className="space-y-2 lg:col-span-3">
        <Label>Label field</Label>
        <Input name="label" defaultValue={field?.label} placeholder="Contoh: Foto bukti" required />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Kunci</Label>
        <Input name="fieldKey" defaultValue={field?.field_key} placeholder="evidence_photos" required />
      </div>
      <ResponseFieldTypeControls
        defaultType={field?.field_type}
        maxSizeMb={maxSizeMb}
        options={field?.options ?? []}
      />
      <div className="space-y-2 lg:col-span-3">
        <Label>Placeholder</Label>
        <Input name="placeholder" defaultValue={field?.placeholder ?? ""} placeholder="Petunjuk singkat" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Urutan</Label>
        <Input name="sortOrder" type="number" defaultValue={field?.sort_order ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm font-extrabold text-[var(--atlas-ink)] lg:col-span-1 lg:pt-8">
        <input name="isRequired" type="checkbox" defaultChecked={field?.is_required ?? false} />
        Wajib
      </label>
      <label className="flex items-center gap-2 text-sm font-extrabold text-[var(--atlas-ink)] lg:col-span-1 lg:pt-8">
        <input name="isActive" type="checkbox" defaultChecked={field?.is_active ?? true} />
        Aktif
      </label>
      <div className="flex justify-end lg:col-span-12">
        <Button type="submit" className="w-full sm:w-auto sm:min-w-36">
          {field ? "Update" : "Tambah field"}
        </Button>
      </div>
    </ActionForm>
  );
}
