import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TemplateIdentityField } from "@/lib/types";
import { saveIdentityFieldAction } from "@/modules/admin/controllers/admin.controller";
import { IdentityFieldTypeControls } from "@/modules/admin/components/identity-field-type-controls";

export function IdentityFieldForm({
  templateId,
  field,
}: {
  templateId: string;
  field?: TemplateIdentityField;
}) {
  return (
    <ActionForm
      action={saveIdentityFieldAction}
      className="atlas-fieldset grid gap-3 rounded-[1.5rem] p-4 lg:grid-cols-12"
      resetOnSuccess={!field}
      successMessage={field ? "Header identitas diperbarui." : "Header identitas ditambahkan."}
      errorMessage="Header gagal disimpan"
    >
      <input type="hidden" name="templateId" value={templateId} />
      {field ? <input type="hidden" name="fieldId" value={field.id} /> : null}
      <div className="space-y-2 lg:col-span-3">
        <Label>Label field</Label>
        <Input name="label" defaultValue={field?.label} placeholder="Contoh: NIB" required />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Kunci</Label>
        <Input name="fieldKey" defaultValue={field?.field_key} placeholder="nib" required />
      </div>
      <IdentityFieldTypeControls defaultType={field?.field_type} options={field?.options ?? []} />
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
      <div className="lg:col-span-2 lg:pt-6">
        <Button type="submit" className="w-full">
          {field ? "Update" : "Tambah field"}
        </Button>
      </div>
    </ActionForm>
  );
}
