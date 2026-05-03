import type { Profile } from "@/lib/types";
import { listDashboardMetricRows } from "@/modules/dashboard/repositories/dashboard.repository";
import { calculateDashboardStats } from "@/modules/dashboard/services/dashboard-stats.service";
import { listResponsesForUser } from "@/modules/surveys/repositories/survey.repository";

export async function getDashboardData(profile: Profile) {
  const isAdmin = profile.role === "super_admin";
  const [metricRows, recentResponses] = await Promise.all([
    listDashboardMetricRows(profile.id, isAdmin),
    listResponsesForUser(profile.id, isAdmin),
  ]);
  const stats = calculateDashboardStats(metricRows.responses, metricRows.totalSubjects);
  return { stats, recentResponses, isAdmin };
}
