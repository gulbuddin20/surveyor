import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionWithQuestions, SurveySection } from "@/lib/types";
import { deleteSectionAction } from "@/modules/admin/controllers/admin.controller";
import { QuestionEditor } from "@/modules/admin/components/question-editor";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { SectionForm } from "@/modules/admin/components/section-form";

export function SectionEditor({
  templateId,
  section,
  sections,
  depth = 0,
}: {
  templateId: string;
  section: SectionWithQuestions;
  sections: SurveySection[];
  depth?: number;
}) {
  return (
    <Card className={depth ? "border-slate-200 bg-slate-50/60" : undefined}>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>
              {section.questions.length} pertanyaan langsung · {section.children.length} subbagian
            </CardDescription>
          </div>
          <Badge className={section.is_active ? undefined : "bg-slate-100 text-slate-700"}>
            {section.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </CardHeader>
      <div className="space-y-4">
        <SectionForm templateId={templateId} section={section} sections={sections} />
        <form action={deleteSectionAction}>
          <input type="hidden" name="sectionId" value={section.id} />
          <Button type="submit" variant="destructive" size="sm">Hapus bagian</Button>
        </form>
        <QuestionForm templateId={templateId} sections={sections} sectionId={section.id} />
        <div className="space-y-3">
          {section.questions.map((question) => (
            <QuestionEditor key={question.id} templateId={templateId} question={question} sections={sections} />
          ))}
        </div>
        {section.children.length ? (
          <div className="space-y-4 border-l-2 border-slate-200 pl-4">
            {section.children.map((child) => (
              <SectionEditor
                key={child.id}
                templateId={templateId}
                section={child}
                sections={sections}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
