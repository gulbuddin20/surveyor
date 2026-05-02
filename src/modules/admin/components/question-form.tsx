import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionType, SurveyQuestion, SurveySection } from "@/lib/types";
import { saveQuestionAction } from "@/modules/admin/controllers/admin.controller";

const questionTypes: QuestionType[] = [
  "checkbox",
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "radio",
  "photo",
];

export function QuestionForm({
  templateId,
  question,
  sections,
  sectionId,
}: {
  templateId: string;
  question?: SurveyQuestion;
  sections: SurveySection[];
  sectionId?: string;
}) {
  return (
    <form action={saveQuestionAction} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <input type="hidden" name="templateId" value={templateId} />
      {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_120px_120px]">
        <div className="space-y-2">
          <Label>Butir pertanyaan/kriteria</Label>
          <Textarea name="label" defaultValue={question?.label} required />
        </div>
        <div className="space-y-2">
          <Label>Bagian</Label>
          <select
            name="sectionId"
            defaultValue={question?.section_id ?? sectionId ?? ""}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Tanpa bagian</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Tipe</Label>
          <select
            name="questionType"
            defaultValue={question?.question_type ?? "checkbox"}
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          >
            {questionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Bobot/skor</Label>
          <Input name="weight" type="number" step="0.01" defaultValue={question?.weight ?? 1} required />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_120px_auto]">
        <div className="space-y-2">
          <Label>Bantuan/catatan</Label>
          <Input name="helpText" defaultValue={question?.help_text ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Urutan</Label>
          <Input name="sortOrder" type="number" defaultValue={question?.sort_order ?? 0} />
        </div>
        <div className="flex items-end gap-3">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input name="isRequired" type="checkbox" defaultChecked={question?.is_required ?? false} /> Wajib
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={question?.is_active ?? true} /> Aktif
          </label>
          <Button type="submit">{question ? "Update" : "Tambah pertanyaan"}</Button>
        </div>
      </div>
    </form>
  );
}
