import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SurveySection } from "@/lib/types";
import { saveSectionAction } from "@/modules/admin/controllers/admin.controller";

export function SectionForm({
  templateId,
  section,
  sections,
}: {
  templateId: string;
  section?: SurveySection;
  sections: SurveySection[];
}) {
  return (
    <ActionForm
      action={saveSectionAction}
      className="atlas-fieldset grid gap-3 rounded-[1.5rem] p-4 md:grid-cols-[1fr_160px_160px_auto]"
      resetOnSuccess={!section}
      successMessage={section ? "Bagian diperbarui." : "Bagian ditambahkan."}
      errorMessage="Bagian gagal disimpan"
    >
      <input type="hidden" name="templateId" value={templateId} />
      {section ? <input type="hidden" name="sectionId" value={section.id} /> : null}
      <div className="space-y-2">
        <Label>Judul bagian</Label>
        <Input name="title" defaultValue={section?.title} placeholder="Contoh: Inspeksi Area Dapur" required />
      </div>
      <div className="space-y-2">
        <Label>Induk</Label>
        <select
          name="parentId"
          defaultValue={section?.parent_id ?? ""}
          className="atlas-select"
        >
          <option value="">Bagian utama</option>
          {sections
            .filter((item) => item.id !== section?.id)
            .map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Urutan</Label>
        <Input name="sortOrder" type="number" defaultValue={section?.sort_order ?? 0} />
      </div>
      <div className="flex items-end gap-2">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={section?.is_active ?? true} /> Aktif
        </label>
        <Button type="submit">{section ? "Update" : "Tambah"}</Button>
      </div>
    </ActionForm>
  );
}
