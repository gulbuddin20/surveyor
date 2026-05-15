import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateResponseField } from "@/lib/types";
import { saveResponseFieldAction } from "@/modules/admin/controllers/admin.controller";

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
      <div className="space-y-2 lg:col-span-2">
        <Label>Tipe</Label>
        <select name="fieldType" defaultValue={field?.field_type ?? "textarea"} className="atlas-select">
          <option value="text">text</option>
          <option value="textarea">textarea</option>
          <option value="number">number</option>
          <option value="date">date</option>
          <option value="time">time</option>
          <option value="select">select</option>
          <option value="photo">photo</option>
          <option value="signature">signature</option>
        </select>
      </div>
      <div className="space-y-2 lg:col-span-3">
        <Label>Placeholder</Label>
        <Input name="placeholder" defaultValue={field?.placeholder ?? ""} placeholder="Petunjuk singkat" />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Urutan</Label>
        <Input name="sortOrder" type="number" defaultValue={field?.sort_order ?? 0} />
      </div>
      <div className="space-y-2 lg:col-span-6">
        <Label>Opsi select</Label>
        <Textarea
          name="optionsText"
          defaultValue={(field?.options ?? []).join("\n")}
          placeholder="Satu opsi per baris, hanya untuk tipe select"
        />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Label>Max foto (MB)</Label>
        <Input name="maxSizeMb" type="number" min={1} max={25} defaultValue={maxSizeMb} />
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
