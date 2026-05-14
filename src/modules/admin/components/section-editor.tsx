import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import type { SectionWithQuestions, SurveySection } from "@/lib/types";
import { deleteSectionAction } from "@/modules/admin/controllers/admin.controller";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { QuestionSortableList } from "@/modules/admin/components/question-sortable-scope";
import { SectionCollapseCard } from "@/modules/admin/components/section-collapse-card";
import { SectionSortableList } from "@/modules/admin/components/section-sortable-scope";
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
    <SectionCollapseCard
      active={section.is_active}
      childCount={section.children.length}
      defaultOpen={depth === 0}
      questionCount={section.questions.length}
      title={section.title}
    >
      <SectionForm templateId={templateId} section={section} sections={sections} />
      <ActionForm
        action={deleteSectionAction}
        successMessage="Bagian dihapus."
        errorMessage="Bagian gagal dihapus"
      >
        <input type="hidden" name="sectionId" value={section.id} />
        <Button type="submit" variant="destructive" size="sm">Hapus bagian</Button>
      </ActionForm>
      <QuestionForm templateId={templateId} sections={sections} sectionId={section.id} />
      <QuestionSortableList sectionId={section.id} />
      <SectionSortableList
        parentId={section.id}
        className="border-l-2 border-[color:rgba(242,111,76,0.28)] pl-4"
      />
    </SectionCollapseCard>
  );
}
