import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaRule,
  MsmeSubject,
  ResponseStatus,
  SurveyAnswer,
  SurveyQuestion,
  SurveyResponse,
  SurveySection,
  SurveyTemplate,
  TemplateDetail,
} from "@/lib/types";
import { buildSectionTree } from "@/modules/admin/services/template-tree.service";

export type RecentSurveyResponse = Pick<
  SurveyResponse,
  "id" | "template_id" | "subject_id" | "surveyor_id" | "status" | "total_nonconformity" | "score" | "result_label" | "submitted_at" | "created_at"
> & {
  survey_templates?: { name?: string } | null;
  msme_subjects?: { business_name?: string; address?: string | null } | null;
};

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

  const [{ data: sections }, { data: questions }, { data: formula }] = await Promise.all([
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
  ]);

  const questionRows = (questions ?? []) as SurveyQuestion[];

  return {
    ...(template as SurveyTemplate),
    formula: (formula as FormulaRule | null) ?? null,
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

export async function listResponsesForUser(userId: string, isAdmin: boolean): Promise<RecentSurveyResponse[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .schema("surveyor")
    .from("survey_responses")
    .select("id, template_id, subject_id, surveyor_id, status, total_nonconformity, score, result_label, submitted_at, created_at, survey_templates(name), msme_subjects(business_name, address)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!isAdmin) query = query.eq("surveyor_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    status: row.status as ResponseStatus,
    survey_templates: Array.isArray(row.survey_templates) ? row.survey_templates[0] : row.survey_templates,
    msme_subjects: Array.isArray(row.msme_subjects) ? row.msme_subjects[0] : row.msme_subjects,
  })) as RecentSurveyResponse[];
}
