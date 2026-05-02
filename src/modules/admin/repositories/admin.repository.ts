import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormulaInput, QuestionInput, SectionInput, TemplateInput, UserInput } from "@/lib/schemas";
import type {
  FormulaRule,
  Profile,
  SectionWithQuestions,
  SurveyQuestion,
  SurveySection,
  SurveyTemplate,
  TemplateAdminDetail,
} from "@/lib/types";

function buildSectionTree(sections: SurveySection[], questions: SurveyQuestion[]): SectionWithQuestions[] {
  const byId = new Map<string, SectionWithQuestions>();
  sections.forEach((section) => {
    byId.set(section.id, {
      ...section,
      questions: questions.filter((question) => question.section_id === section.id),
      children: [],
    });
  });

  const roots: SectionWithQuestions[] = [];
  byId.forEach((section) => {
    if (section.parent_id && byId.has(section.parent_id)) {
      const parent = byId.get(section.parent_id);
      if (parent) parent.children.push(section);
    } else {
      roots.push(section);
    }
  });

  const sortTree = (items: SectionWithQuestions[]) => {
    items.sort((left, right) => left.sort_order - right.sort_order || left.title.localeCompare(right.title));
    items.forEach((item) => {
      item.questions.sort((left, right) => left.sort_order - right.sort_order || left.label.localeCompare(right.label));
      sortTree(item.children);
    });
  };
  sortTree(roots);
  return roots;
}

export async function listUsers(): Promise<Profile[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function createUser(input: UserInput) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password ?? crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: input.role },
  });
  if (error) throw error;

  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    full_name: input.fullName,
    email: input.email,
    role: input.role,
    is_active: input.isActive,
  });
  if (profileError) throw profileError;
  return data.user;
}

export async function listFormulas(): Promise<Array<FormulaRule & { survey_templates?: { name: string } }>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("formula_rules")
    .select("*, survey_templates(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateFormula(input: FormulaInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("surveyor")
    .from("formula_rules")
    .update({
      denominator: input.denominator,
      passing_score: input.passingScore,
      expression: input.expression,
    })
    .eq("template_id", input.templateId)
    .eq("is_active", true);
  if (error) throw error;
}

export async function createTemplate(input: TemplateInput): Promise<SurveyTemplate> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .insert({
      code: input.code,
      name: input.name,
      description: input.description,
      status: input.status,
      denominator: input.denominator,
      passing_score: input.passingScore,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SurveyTemplate;
}

export async function getTemplateAdminDetail(templateId: string): Promise<TemplateAdminDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: template, error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  if (!template) return null;

  const [{ data: sections, error: sectionError }, { data: questions, error: questionError }] = await Promise.all([
    supabase
      .schema("surveyor")
      .from("survey_sections")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order"),
    supabase
      .schema("surveyor")
      .from("survey_questions")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order"),
  ]);
  if (sectionError) throw sectionError;
  if (questionError) throw questionError;

  const flatSections = (sections ?? []) as SurveySection[];
  return {
    ...(template as SurveyTemplate),
    flatSections,
    sections: buildSectionTree(flatSections, (questions ?? []) as SurveyQuestion[]),
  };
}

export async function upsertSection(input: SectionInput) {
  const supabase = await createSupabaseServerClient();
  const payload = {
    template_id: input.templateId,
    parent_id: input.parentId ?? null,
    title: input.title,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  const query = input.sectionId
    ? supabase.schema("surveyor").from("survey_sections").update(payload).eq("id", input.sectionId)
    : supabase.schema("surveyor").from("survey_sections").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteSection(sectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("surveyor").from("survey_sections").delete().eq("id", sectionId);
  if (error) throw error;
}

export async function upsertQuestion(input: QuestionInput) {
  const supabase = await createSupabaseServerClient();
  const payload = {
    template_id: input.templateId,
    section_id: input.sectionId ?? null,
    label: input.label,
    help_text: input.helpText || null,
    question_type: input.questionType,
    weight: input.weight,
    is_required: input.isRequired,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
  const query = input.questionId
    ? supabase.schema("surveyor").from("survey_questions").update(payload).eq("id", input.questionId)
    : supabase.schema("surveyor").from("survey_questions").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("surveyor").from("survey_questions").delete().eq("id", questionId);
  if (error) throw error;
}
