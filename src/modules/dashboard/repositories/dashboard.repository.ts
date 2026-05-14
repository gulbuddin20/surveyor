import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardStats } from "@/lib/types";

export async function getDashboardStats(userId: string, isAdmin: boolean): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const scopeResponses = <T>(query: T) => {
    if (isAdmin) return query;
    return (query as { eq: (column: string, value: string) => T }).eq("surveyor_id", userId);
  };
  const scopeSubjects = <T>(query: T) => {
    if (isAdmin) return query;
    return (query as { eq: (column: string, value: string) => T }).eq("owner_id", userId);
  };

  const responseCountQuery = scopeResponses(
    supabase.schema("surveyor").from("survey_responses").select("id", { count: "exact", head: true }),
  );
  const submittedCountQuery = scopeResponses(
    supabase.schema("surveyor").from("survey_responses").select("id", { count: "exact", head: true }).eq("status", "submitted"),
  );
  const draftCountQuery = scopeResponses(
    supabase.schema("surveyor").from("survey_responses").select("id", { count: "exact", head: true }).eq("status", "draft"),
  );
  const failedCountQuery = scopeResponses(
    supabase.schema("surveyor").from("survey_responses").select("id", { count: "exact", head: true }).eq("status", "submitted").lt("score", 80),
  );
  const subjectCountQuery = scopeSubjects(
    supabase.schema("surveyor").from("msme_subjects").select("id", { count: "exact", head: true }),
  );
  let scoreQuery = supabase.schema("surveyor").from("survey_responses").select("score").eq("status", "submitted");
  if (!isAdmin) {
    scoreQuery = scoreQuery.eq("surveyor_id", userId);
  }

  const [
    { count: totalResponses, error: totalResponseError },
    { count: submittedResponses, error: submittedError },
    { count: draftResponses, error: draftError },
    { count: failedResponses, error: failedError },
    { count: totalSubjects, error: subjectError },
    { data: submittedScores, error: scoreError },
  ] = await Promise.all([
    responseCountQuery,
    submittedCountQuery,
    draftCountQuery,
    failedCountQuery,
    subjectCountQuery,
    scoreQuery,
  ]);

  if (totalResponseError) throw totalResponseError;
  if (submittedError) throw submittedError;
  if (draftError) throw draftError;
  if (failedError) throw failedError;
  if (subjectError) throw subjectError;
  if (scoreError) throw scoreError;

  const scores = submittedScores ?? [];
  const totalScore = scores.reduce((total, row) => total + Number(row.score), 0);

  return {
    totalResponses: totalResponses ?? 0,
    submittedResponses: submittedResponses ?? 0,
    draftResponses: draftResponses ?? 0,
    averageScore: scores.length ? Number((totalScore / scores.length).toFixed(2)) : 0,
    totalSubjects: totalSubjects ?? 0,
    failedResponses: failedResponses ?? 0,
  };
}
