import type { Profile } from "@/lib/types";
import { getDashboardStats } from "@/modules/dashboard/repositories/dashboard.repository";
import { listResponsesForUser } from "@/modules/surveys/repositories/survey.repository";

export async function getDashboardData(profile: Profile) {
  const isAdmin = profile.role === "super_admin";
  const [stats, recentResponses] = await Promise.all([
    getDashboardStats(profile.id, isAdmin),
    listResponsesForUser(profile.id, isAdmin),
  ]);
  return { stats, recentResponses, isAdmin };
}
