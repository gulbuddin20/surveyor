import type { FormulaRule, SurveyQuestion } from "@/lib/types";

export type ScoreSettings = {
  formula: FormulaRule | null;
  templateDenominator: number;
  templatePassingScore: number;
};

export type FormulaResult = {
  totalNonconformity: number;
  score: number;
  resultLabel: string;
};

export function calculateSurveyScore(
  questions: SurveyQuestion[],
  selectedQuestionIds: string[],
  settings: ScoreSettings,
): FormulaResult {
  const selected = new Set(selectedQuestionIds);
  const totalNonconformity = questions.reduce((total, question) => {
    return selected.has(question.id) ? total + Number(question.weight) : total;
  }, 0);
  const denominator = Number(settings.formula?.denominator ?? settings.templateDenominator);
  const passingScore = Number(settings.formula?.passing_score ?? settings.templatePassingScore);
  const score = Math.max(0, 100 - (totalNonconformity / denominator) * 100);

  return {
    totalNonconformity,
    score: Number(score.toFixed(2)),
    resultLabel: score >= passingScore ? "Memenuhi syarat" : "Belum memenuhi syarat",
  };
}
