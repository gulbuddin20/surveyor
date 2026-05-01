import type { FormulaRule, SurveyQuestion } from "@/lib/types";

export type FormulaResult = {
  totalNonconformity: number;
  score: number;
  resultLabel: string;
};

export function calculateSurveyScore(
  questions: SurveyQuestion[],
  selectedQuestionIds: string[],
  formula: FormulaRule | null,
): FormulaResult {
  const selected = new Set(selectedQuestionIds);
  const totalNonconformity = questions.reduce((total, question) => {
    return selected.has(question.id) ? total + Number(question.weight) : total;
  }, 0);
  const denominator = Number(formula?.denominator ?? 100);
  const passingScore = Number(formula?.passing_score ?? 80);
  const score = Math.max(0, 100 - (totalNonconformity / denominator) * 100);

  return {
    totalNonconformity,
    score: Number(score.toFixed(2)),
    resultLabel: score >= passingScore ? "Memenuhi syarat" : "Belum memenuhi syarat",
  };
}
