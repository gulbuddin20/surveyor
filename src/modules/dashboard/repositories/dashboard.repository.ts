import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/lib/types";

export async function getDashboardStats(userId: string, isAdmin: boolean): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  let responseQuery = supabase.schema("surveyor").from("survey_responses").select("status, score");
  let subjectQuery = supabase.schema("surveyor").from("msme_subjects").select("id");
  if (!isAdmin) {
    responseQuery = responseQuery.eq("surveyor_id", userId);
    subjectQuery = subjectQuery.eq("owner_id", userId);
  }

  const [{ data: responses, error: responseError }, { data: subjects, error: subjectError }] =
    await Promise.all([responseQuery, subjectQuery]);

  if (responseError) throw responseError;
  if (subjectError) throw subjectError;

  const rows = responses ?? [];
  const submitted = rows.filter((row) => row.status === "submitted");
  const totalScore = submitted.reduce((total, row) => total + Number(row.score), 0);

  return {
    totalResponses: rows.length,
    submittedResponses: submitted.length,
    draftResponses: rows.filter((row) => row.status === "draft").length,
    averageScore: submitted.length ? Number((totalScore / submitted.length).toFixed(2)) : 0,
    totalSubjects: subjects?.length ?? 0,
    failedResponses: submitted.filter((row) => Number(row.score) < 80).length,
  };
}
