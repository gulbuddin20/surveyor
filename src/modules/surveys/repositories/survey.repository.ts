import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaRule,
  MsmeSubject,
  SectionWithQuestions,
  SurveyAnswer,
  SurveyQuestion,
  SurveyPhoto,
  SurveyResponse,
  SurveySection,
  SurveyTemplate,
  TemplateIdentityField,
  TemplateDetail,
  SurveyResultDetail,
  SurveyHistoryPage,
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

export async function listActiveTemplates(): Promise<SurveyTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .select("*")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as SurveyTemplate[];
}

export async function listAllTemplates(): Promise<SurveyTemplate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_templates")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as SurveyTemplate[];
}

export async function getTemplateDetail(templateId: string): Promise<TemplateDetail | null> {
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
    { data: formula, error: formulaError },
    { data: identityFields, error: identityFieldError },
  ] = await Promise.all([
    supabase
      .schema("surveyor")
      .from("survey_sections")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .schema("surveyor")
      .from("survey_questions")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .schema("surveyor")
      .from("formula_rules")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .schema("surveyor")
      .from("template_identity_fields")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  if (sectionError) throw sectionError;
  if (questionError) throw questionError;
  if (formulaError) throw formulaError;
  if (identityFieldError) throw identityFieldError;

  const questionRows = (questions ?? []) as SurveyQuestion[];

  return {
    ...(template as SurveyTemplate),
    formula: (formula as FormulaRule | null) ?? null,
    identityFields: (identityFields ?? []) as TemplateIdentityField[],
    sections: buildSectionTree((sections ?? []) as SurveySection[], questionRows),
  };
}

export async function createSubject(input: Omit<MsmeSubject, "id" | "created_at">) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("msme_subjects")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as MsmeSubject;
}

export async function createResponse(input: Omit<SurveyResponse, "id" | "created_at">) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_responses")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as SurveyResponse;
}

export async function updateSubject(subjectId: string, input: Partial<Omit<MsmeSubject, "id" | "created_at">>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("msme_subjects")
    .update(input)
    .eq("id", subjectId)
    .select("*")
    .single();
  if (error) throw error;
  return data as MsmeSubject;
}

export async function updateResponse(responseId: string, input: Partial<Omit<SurveyResponse, "id" | "created_at">>) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_responses")
    .update(input)
    .eq("id", responseId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SurveyResponse;
}

export async function createAnswers(inputs: Array<Omit<SurveyAnswer, "id" | "created_at">>) {
  if (inputs.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_answers")
    .insert(inputs)
    .select("*");
  if (error) throw error;
  return (data ?? []) as SurveyAnswer[];
}

export async function replaceAnswers(responseId: string, inputs: Array<Omit<SurveyAnswer, "id" | "created_at">>) {
  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .schema("surveyor")
    .from("survey_answers")
    .delete()
    .eq("response_id", responseId);
  if (deleteError) throw deleteError;
  return createAnswers(inputs);
}

export async function uploadEvidencePhoto({
  userId,
  responseId,
  file,
}: {
  userId: string;
  responseId: string;
  file: File;
}) {
  const supabase = await createSupabaseServerClient();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120) || "evidence";
  const path = `${userId}/${responseId}/${crypto.randomUUID()}-${cleanName}`;
  const { error } = await supabase.storage.from("survey-evidence").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function createPhotos(inputs: Array<Omit<SurveyPhoto, "id" | "created_at">>) {
  if (inputs.length === 0) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("surveyor")
    .from("survey_photos")
    .insert(inputs)
    .select("*");
  if (error) throw error;
  return (data ?? []) as SurveyPhoto[];
}

export async function getSurveyResultDetail(responseId: string, userId: string, isAdmin: boolean): Promise<SurveyResultDetail | null> {
  const supabase = await createSupabaseServerClient();
  let responseQuery = supabase
    .schema("surveyor")
    .from("survey_responses")
    .select("*")
    .eq("id", responseId);
  if (!isAdmin) responseQuery = responseQuery.eq("surveyor_id", userId);
  const { data: response, error: responseError } = await responseQuery.maybeSingle();
  if (responseError) throw responseError;
  if (!response) return null;

  const [
    { data: template, error: templateError },
    { data: subject, error: subjectError },
    { data: answers, error: answerError },
    { data: photos, error: photoError },
  ] = await Promise.all([
    supabase.schema("surveyor").from("survey_templates").select("*").eq("id", response.template_id).single(),
    supabase.schema("surveyor").from("msme_subjects").select("*").eq("id", response.subject_id).single(),
    supabase
      .schema("surveyor")
      .from("survey_answers")
      .select("*, survey_questions(*)")
      .eq("response_id", responseId)
      .order("created_at"),
    supabase.schema("surveyor").from("survey_photos").select("*").eq("response_id", responseId).order("created_at"),
  ]);
  if (templateError) throw templateError;
  if (subjectError) throw subjectError;
  if (answerError) throw answerError;
  if (photoError) throw photoError;

  return {
    response: response as SurveyResponse,
    template: template as SurveyTemplate,
    subject: subject as SurveyResultDetail["subject"],
    answers: (answers ?? []) as SurveyResultDetail["answers"],
    photos: (photos ?? []) as SurveyPhoto[],
  };
}

export async function listSurveyHistory({
  userId,
  isAdmin,
  page,
  limit,
  query,
}: {
  userId: string;
  isAdmin: boolean;
  page: number;
  limit: number;
  query: string;
}): Promise<SurveyHistoryPage> {
  const supabase = await createSupabaseServerClient();
  const safePage = Math.max(1, page);
  const safeLimit = [10, 20, 50].includes(limit) ? limit : 10;
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let dbQuery = supabase
    .schema("surveyor")
    .from("survey_responses")
    .select("*, survey_templates(name), msme_subjects(business_name, address), profiles(full_name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!isAdmin) dbQuery = dbQuery.eq("surveyor_id", userId);
  const trimmedQuery = query.trim();

  const { data, error, count } = await dbQuery;
  if (error) throw error;
  const total = count ?? 0;
  return {
    rows: (data ?? []) as SurveyHistoryPage["rows"],
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    query: trimmedQuery,
  };
}

export async function listResponsesForUser(userId: string, isAdmin: boolean) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .schema("surveyor")
    .from("survey_responses")
    .select("*, survey_templates(name), msme_subjects(business_name, address)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!isAdmin) query = query.eq("surveyor_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
