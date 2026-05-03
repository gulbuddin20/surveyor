import type { SectionWithQuestions, SurveyQuestion, SurveySection } from "@/lib/types";

export function buildSectionTree(sections: SurveySection[], questions: SurveyQuestion[]): SectionWithQuestions[] {
  const questionsBySection = new Map<string, SurveyQuestion[]>();
  questions.forEach((question) => {
    if (!question.section_id) return;
    const sectionQuestions = questionsBySection.get(question.section_id) ?? [];
    sectionQuestions.push(question);
    questionsBySection.set(question.section_id, sectionQuestions);
  });

  const byId = new Map<string, SectionWithQuestions>();
  sections.forEach((section) => {
    byId.set(section.id, {
      ...section,
      questions: questionsBySection.get(section.id) ?? [],
      children: [],
    });
  });

  const roots: SectionWithQuestions[] = [];
  byId.forEach((section) => {
    if (section.parent_id && byId.has(section.parent_id)) {
      byId.get(section.parent_id)?.children.push(section);
    } else {
      roots.push(section);
    }
  });

  sortSectionTree(roots);
  return roots;
}

function sortSectionTree(items: SectionWithQuestions[]) {
  items.sort((left, right) => left.sort_order - right.sort_order || left.title.localeCompare(right.title));
  items.forEach((item) => {
    item.questions.sort((left, right) => left.sort_order - right.sort_order || left.label.localeCompare(right.label));
    sortSectionTree(item.children);
  });
}
