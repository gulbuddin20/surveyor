import { requireProfile } from "@/modules/auth/services/auth.service";
import { getDashboardData } from "@/modules/dashboard/services/dashboard.service";

export async function loadDashboardController() {
  const profile = await requireProfile();
  const dashboard = await getDashboardData(profile);
  return { profile, dashboard };
}
