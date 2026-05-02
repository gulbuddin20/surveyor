import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionWithQuestions, TemplateAdminDetail } from "@/lib/types";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { SectionEditor } from "@/modules/admin/components/section-editor";
import { SectionForm } from "@/modules/admin/components/section-form";

export function TemplateEditor({ detail }: { detail: TemplateAdminDetail }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{detail.name}</CardTitle>
          <CardDescription>{detail.description}</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{detail.status}</Badge>
          <Badge className="bg-slate-100 text-slate-700">{detail.sections.length} bagian utama</Badge>
          <Badge className="bg-slate-100 text-slate-700">{countQuestions(detail.sections)} pertanyaan</Badge>
          <Badge className="bg-slate-100 text-slate-700">Denominator {Number(detail.denominator)}</Badge>
        </div>
      </Card>
      <SectionForm templateId={detail.id} sections={detail.flatSections} />
      <QuestionForm templateId={detail.id} sections={detail.flatSections} />
      <div className="space-y-4">
        {detail.sections.map((section) => (
          <SectionEditor key={section.id} templateId={detail.id} section={section} sections={detail.flatSections} />
        ))}
      </div>
    </div>
  );
}

function countQuestions(sections: SectionWithQuestions[]): number {
  return sections.reduce((total, section) => total + section.questions.length + countQuestions(section.children), 0);
}
