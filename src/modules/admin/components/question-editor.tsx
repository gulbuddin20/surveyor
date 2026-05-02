import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SurveyQuestion, SurveySection } from "@/lib/types";
import { deleteQuestionAction } from "@/modules/admin/controllers/admin.controller";
import { QuestionForm } from "@/modules/admin/components/question-form";

export function QuestionEditor({
  templateId,
  question,
  sections,
}: {
  templateId: string;
  question: SurveyQuestion;
  sections: SurveySection[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">{question.label}</p>
          {question.help_text ? <p className="mt-1 text-sm text-slate-500">{question.help_text}</p> : null}
        </div>
        <div className="flex gap-2">
          <Badge>Bobot {Number(question.weight)}</Badge>
          <Badge className={question.is_active ? undefined : "bg-slate-100 text-slate-700"}>
            {question.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <QuestionForm templateId={templateId} question={question} sections={sections} />
      <form action={deleteQuestionAction} className="mt-3">
        <input type="hidden" name="questionId" value={question.id} />
        <Button type="submit" variant="destructive" size="sm">Hapus pertanyaan</Button>
      </form>
    </div>
  );
}
