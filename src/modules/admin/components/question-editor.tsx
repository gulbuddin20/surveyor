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
    <div className="rounded-[1.5rem] border border-[color:rgba(22,37,29,0.1)] bg-[color:rgba(255,249,234,0.52)] p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-extrabold text-[var(--atlas-ink)]">{question.label}</p>
          {question.help_text ? <p className="mt-1 text-sm text-[color:rgba(22,37,29,0.58)]">{question.help_text}</p> : null}
        </div>
        <div className="flex gap-2">
          <Badge>Bobot {Number(question.weight)}</Badge>
          <Badge className={question.is_active ? undefined : "bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]"}>
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
