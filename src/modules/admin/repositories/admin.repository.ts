import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaInput,
  IdentityFieldInput,
  QuestionInput,
  ResponseFieldInput,
  SectionInput,
  TemplateInput,
  TemplateSettingsInput,
  UserInput,
} from "@/lib/schemas";
import type {
  FormulaRule,
  Profile,
  SectionWithQuestions,
  SurveyQuestion,
  SurveySection,
  SurveyTemplate,
  TemplateIdentityField,
  TemplateResponseField,
  TemplateAdminDetail,
} from "@/lib/types";

function buildSectionTree(sections: SurveySection[], questions: SurveyQuestion[]): SectionWithQuestions[] {
  const byId = new Map<string, SectionWithQuestions>();
  const questionsBySectionId = new Map<string, SurveyQuestion[]>();

  questions.forEach((question) => {
    if (!question.section_id) return;
    const sectionQuestions = questionsBySectionId.get(question.section_id) ?? [];
    sectionQuestions.push(question);
    questionsBySectionId.set(question.section_id, sectionQuestions);
  });

  sections.forEach((section) => {
    byId.set(section.id, {
      ...section,
      questions: questionsBySectionId.get(section.id) ?? [],
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
    .upsert({
      template_id: input.templateId,
      name: "Skor Total Inspeksi",
      denominator: input.denominator,
      passing_score: input.passingScore,
      expression: input.expression,
      is_active: true,
    }, { onConflict: "template_id,name" });
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
      photo_max_size_mb: input.photoMaxSizeMb,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SurveyTemplate;
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .schema("surveyor")
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);
  if (countError) throw countError;

  if (count && count > 0) {
    throw new Error("Template sudah memiliki hasil survei dan tidak bisa dihapus langsung.");
  }

  const { error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .delete()
    .eq("id", templateId);
  if (error) throw error;
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

  const [
    { data: sections, error: sectionError },
    { data: questions, error: questionError },
    { data: identityFields, error: identityFieldError },
    { data: responseFields, error: responseFieldError },
  ] = await Promise.all([
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
    supabase
      .schema("surveyor")
      .from("template_identity_fields")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order"),
    supabase
      .schema("surveyor")
      .from("template_response_fields")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order"),
  ]);
  if (sectionError) throw sectionError;
  if (questionError) throw questionError;
  if (identityFieldError) throw identityFieldError;
  if (responseFieldError) throw responseFieldError;

  const flatSections = (sections ?? []) as SurveySection[];
  return {
    ...(template as SurveyTemplate),
    identityFields: (identityFields ?? []) as TemplateIdentityField[],
    responseFields: (responseFields ?? []) as TemplateResponseField[],
    flatSections,
    sections: buildSectionTree(flatSections, (questions ?? []) as SurveyQuestion[]),
  };
}

export async function updateTemplateSettings(input: TemplateSettingsInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .update({ photo_max_size_mb: input.photoMaxSizeMb })
    .eq("id", input.templateId);
  if (error) throw error;
}

export async function upsertIdentityField(input: IdentityFieldInput) {
  const supabase = await createSupabaseServerClient();
  const options = (input.optionsText ?? "")
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
  const payload = {
    template_id: input.templateId,
    field_key: input.fieldKey,
    label: input.label,
    field_type: input.fieldType,
    placeholder: input.placeholder || null,
    options,
    is_required: input.isRequired,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
  const query = input.fieldId
    ? supabase.schema("surveyor").from("template_identity_fields").update(payload).eq("id", input.fieldId).eq("template_id", input.templateId)
    : supabase.schema("surveyor").from("template_identity_fields").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteIdentityField(fieldId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("surveyor").from("template_identity_fields").delete().eq("id", fieldId);
  if (error) throw error;
}

export async function upsertResponseField(input: ResponseFieldInput) {
  const supabase = await createSupabaseServerClient();
  const options = (input.optionsText ?? "")
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
  const payload = {
    template_id: input.templateId,
    field_key: input.fieldKey,
    label: input.label,
    field_type: input.fieldType,
    placeholder: input.placeholder || null,
    options,
    settings: input.fieldType === "photo" ? { max_size_mb: input.maxSizeMb ?? 10 } : {},
    is_required: input.isRequired,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
  const query = input.fieldId
    ? supabase.schema("surveyor").from("template_response_fields").update(payload).eq("id", input.fieldId).eq("template_id", input.templateId)
    : supabase.schema("surveyor").from("template_response_fields").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteResponseField(fieldId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema("surveyor").from("template_response_fields").delete().eq("id", fieldId);
  if (error) throw error;
}

export async function upsertSection(input: SectionInput) {
  const supabase = await createSupabaseServerClient();
  if (input.sectionId && input.parentId) {
    const { data: parent, error: parentError } = await supabase
      .schema("surveyor")
      .from("survey_sections")
      .select("id")
      .eq("id", input.parentId)
      .eq("template_id", input.templateId)
      .maybeSingle();
    if (parentError) throw parentError;
    if (!parent) throw new Error("Bagian induk tidak valid");
  }

  const payload = {
    template_id: input.templateId,
    parent_id: input.parentId ?? null,
    title: input.title,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  const query = input.sectionId
    ? supabase.schema("surveyor").from("survey_sections").update(payload).eq("id", input.sectionId).eq("template_id", input.templateId)
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
  if (input.sectionId) {
    const { data: section, error: sectionError } = await supabase
      .schema("surveyor")
      .from("survey_sections")
      .select("id")
      .eq("id", input.sectionId)
      .eq("template_id", input.templateId)
      .maybeSingle();
    if (sectionError) throw sectionError;
    if (!section) throw new Error("Bagian pertanyaan tidak valid");
  }

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
    ? supabase.schema("surveyor").from("survey_questions").update(payload).eq("id", input.questionId).eq("template_id", input.templateId)
    : supabase.schema("surveyor").from("survey_questions").insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error: countError } = await supabase
    .schema("surveyor")
    .from("survey_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);
  if (countError) throw countError;

  if (count && count > 0) {
    const { error } = await supabase
      .schema("surveyor")
      .from("survey_questions")
      .update({ is_active: false })
      .eq("id", questionId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .schema("surveyor")
    .from("survey_questions")
    .delete()
    .eq("id", questionId);
  if (error) throw error;
}
