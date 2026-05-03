import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResponseStatus } from "@/lib/types";

export type DashboardResponseMetric = {
  status: ResponseStatus;
  score: number;
};

export async function listDashboardMetricRows(userId: string, isAdmin: boolean) {
  const supabase = await createSupabaseServerClient();
  let responseQuery = supabase.schema("surveyor").from("survey_responses").select("status, score");
  let subjectQuery = supabase.schema("surveyor").from("msme_subjects").select("id", { count: "exact", head: true });
  if (!isAdmin) {
    responseQuery = responseQuery.eq("surveyor_id", userId);
    subjectQuery = subjectQuery.eq("owner_id", userId);
  }

  const [{ data: responses, error: responseError }, { count: subjectCount, error: subjectError }] =
    await Promise.all([responseQuery, subjectQuery]);

  if (responseError) throw responseError;
  if (subjectError) throw subjectError;

  return {
    responses: (responses ?? []) as DashboardResponseMetric[],
    totalSubjects: subjectCount ?? 0,
  };
}
