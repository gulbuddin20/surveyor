import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormulaInput, TemplateInput, UserInput } from "@/lib/schemas";
import type { FormulaRule, Profile, SurveyTemplate } from "@/lib/types";

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
