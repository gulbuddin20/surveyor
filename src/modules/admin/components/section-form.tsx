import { Button } from "@/components/ui/button";
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
    <form action={saveSectionAction} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-[1fr_160px_160px_auto]">
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
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
    </form>
  );
}
