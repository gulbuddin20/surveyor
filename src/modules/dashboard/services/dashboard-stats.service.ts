import type { DashboardStats } from "@/lib/types";
import type { DashboardResponseMetric } from "@/modules/dashboard/repositories/dashboard.repository";

export function calculateDashboardStats(rows: DashboardResponseMetric[], totalSubjects: number): DashboardStats {
  const submitted = rows.filter((row) => row.status === "submitted");
  const totalScore = submitted.reduce((total, row) => total + Number(row.score), 0);

  return {
    totalResponses: rows.length,
    submittedResponses: submitted.length,
    draftResponses: rows.filter((row) => row.status === "draft").length,
    averageScore: submitted.length ? Number((totalScore / submitted.length).toFixed(2)) : 0,
    totalSubjects,
    failedResponses: submitted.filter((row) => Number(row.score) < 80).length,
  };
}
