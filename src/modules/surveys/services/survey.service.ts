import { surveySubmissionSchema } from "@/lib/schemas";
import type { Profile, SectionWithQuestions, SurveyQuestion } from "@/lib/types";
import {
  createAnswers,
  createResponse,
  createSubject,
  getTemplateDetail,
  listActiveTemplates,
} from "@/modules/surveys/repositories/survey.repository";
import { calculateSurveyScore } from "@/modules/surveys/services/formula.service";

export async function getSurveyStartData() {
  return { templates: await listActiveTemplates() };
}

export async function getSurveyFormData(templateId: string) {
  const template = await getTemplateDetail(templateId);
  if (!template) throw new Error("Template tidak ditemukan");
  return { template };
}

export async function submitSurvey(profile: Profile, formData: FormData) {
  const nonconformities = formData.getAll("nonconformities").map(String);
  const parsed = surveySubmissionSchema.safeParse({
    templateId: formData.get("templateId"),
    businessName: formData.get("businessName"),
    ownerName: formData.get("ownerName"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    nonconformities,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const template = await getTemplateDetail(parsed.data.templateId);
  if (!template) return { ok: false, message: "Template tidak ditemukan" };

  const questions = flattenQuestions(template.sections);
  const score = calculateSurveyScore(questions, parsed.data.nonconformities, {
    formula: template.formula,
    templateDenominator: template.denominator,
    templatePassingScore: template.passing_score,
  });

  const subject = await createSubject({
    owner_id: profile.id,
    business_name: parsed.data.businessName,
    owner_name: parsed.data.ownerName ?? null,
    address: parsed.data.address ?? null,
    business_type: template.name,
    phone: parsed.data.phone ?? null,
    metadata: {},
    updated_at: new Date().toISOString(),
  });

  const response = await createResponse({
    template_id: template.id,
    subject_id: subject.id,
    surveyor_id: profile.id,
    status: "submitted",
    total_nonconformity: score.totalNonconformity,
    score: score.score,
    result_label: score.resultLabel,
    notes: parsed.data.notes ?? null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const byId = new Map<string, SurveyQuestion>(questions.map((question) => [question.id, question]));
  await createAnswers(
    parsed.data.nonconformities.flatMap((questionId) => {
      const question = byId.get(questionId);
      if (!question) return [];
      return {
        response_id: response.id,
        question_id: question.id,
        is_nonconforming: true,
        value: { checked: true },
        score: Number(question.weight),
        notes: null,
      };
    }),
  );

  return { ok: true, responseId: response.id };
}

function flattenQuestions(sections: SectionWithQuestions[]): SurveyQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}
