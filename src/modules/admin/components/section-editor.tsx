import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SectionWithQuestions, SurveySection } from "@/lib/types";
import {
  deleteSectionAction,
  reorderSectionsAction,
} from "@/modules/admin/controllers/admin.controller";
import { QuestionForm } from "@/modules/admin/components/question-form";
import { QuestionSortableList } from "@/modules/admin/components/question-sortable-scope";
import { SectionForm } from "@/modules/admin/components/section-form";
import { SortableAdminList } from "@/modules/admin/components/sortable-admin-list";

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
  const reorderChildSectionsAction = reorderSectionsAction.bind(null, templateId, section.id);

  return (
    <Card className={depth ? "bg-[color:rgba(255,249,234,0.64)]" : undefined}>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>
              {section.questions.length} pertanyaan langsung · {section.children.length} subbagian
            </CardDescription>
          </div>
          <Badge className={section.is_active ? undefined : "bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]"}>
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
        <QuestionSortableList sectionId={section.id} />
        {section.children.length ? (
          <SortableAdminList
            key={section.children.map((child) => `${child.id}:${child.sort_order}:${child.title}:${child.is_active}`).join("|")}
            className="space-y-4 border-l-2 border-[color:rgba(242,111,76,0.28)] pl-4"
            reorderAction={reorderChildSectionsAction}
            items={section.children.map((child) => ({
              id: child.id,
              label: child.title,
              node: (
                <SectionEditor
                  templateId={templateId}
                  section={child}
                  sections={sections}
                  depth={depth + 1}
                />
              ),
            }))}
          />
        ) : null}
      </div>
    </Card>
  );
}
