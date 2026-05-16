import { surveySubmissionSchema } from "@/lib/schemas";
import type { Profile, SurveyQuestion, TemplateDetail } from "@/lib/types";
import { calculateSurveyScore } from "@/modules/surveys/services/formula.service";

export type ParsedSurveySubmission = {
  businessName: string;
  identityValues: Record<string, string>;
  nonconformities: string[];
  responseId: string;
  responseValues: Record<string, unknown>;
  templateId: string;
};

export function parseSurveySubmission(formData: FormData) {
  const responseId = String(formData.get("responseId") ?? "");
  const nonconformities = Array.from(new Set(formData.getAll("nonconformities").map(String)));
  const identityValues = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("identity."))
      .map(([key, value]) => [key.replace("identity.", ""), String(value)]),
  );
  const responseValues = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("response."))
      .map(([key, value]) => [key.replace("response.", ""), String(value)]),
  );

  const parsed = surveySubmissionSchema.safeParse({
    templateId: formData.get("templateId"),
    responseId: responseId || undefined,
    businessName: identityValues.business_name || Object.values(identityValues).find((value) => value.trim()),
    ownerName: identityValues.owner_name,
    address: identityValues.address,
    phone: identityValues.phone,
    identityValues,
    responseValues,
    nonconformities,
  });

  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  return {
    ok: true as const,
    data: {
      businessName: parsed.data.businessName?.trim() || "Tanpa nama tempat",
      identityValues: parsed.data.identityValues,
      nonconformities: parsed.data.nonconformities,
      responseId,
      responseValues: parsed.data.responseValues,
      templateId: parsed.data.templateId,
    },
  };
}

export function validateTemplateRequiredFields(template: TemplateDetail, submission: ParsedSurveySubmission) {
  for (const field of template.identityFields) {
    if (field.is_required && !submission.identityValues[field.field_key]?.trim()) {
      return { ok: false as const, message: `${field.label} wajib diisi` };
    }
  }

  for (const field of template.responseFields) {
    if (
      field.field_type !== "photo"
      && field.field_type !== "signature"
      && field.is_required
      && !getTextResponseValue(submission.responseValues[field.field_key])
    ) {
      return { ok: false as const, message: `${field.label} wajib diisi` };
    }
  }

  return { ok: true as const };
}

export function buildSurveyPayloads({
  profile,
  submission,
  template,
}: {
  profile: Profile;
  submission: ParsedSurveySubmission;
  template: TemplateDetail;
}) {
  const questions = flattenQuestions(template.sections);
  const byId = new Map<string, SurveyQuestion>(questions.map((question) => [question.id, question]));
  const validNonconformities = submission.nonconformities.filter((questionId) => byId.has(questionId));
  if (validNonconformities.length !== submission.nonconformities.length) {
    return { ok: false as const, message: "Pertanyaan tidak valid" };
  }

  const score = calculateSurveyScore(questions, validNonconformities, {
    formula: template.formula,
    templateDenominator: template.denominator,
    templatePassingScore: template.passing_score,
  });

  return {
    ok: true as const,
    answerRows: validNonconformities.map((questionId) => {
      const question = byId.get(questionId);
      if (!question) throw new Error("Pertanyaan tidak valid");
      return {
        response_id: submission.responseId,
        question_id: question.id,
        is_nonconforming: true,
        value: { checked: true },
        score: Number(question.weight),
        notes: null,
      };
    }),
    responsePayload: {
      template_id: template.id,
      surveyor_id: profile.id,
      status: "submitted",
      total_nonconformity: score.totalNonconformity,
      score: score.score,
      result_label: score.resultLabel,
      notes: getTextResponseValue(submission.responseValues.notes),
      recommendation_notes: getTextResponseValue(submission.responseValues.recommendation_notes),
      response_values: { ...submission.responseValues } as Record<string, unknown>,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as const,
    subjectPayload: {
      owner_id: profile.id,
      business_name: submission.businessName,
      owner_name: submission.identityValues.owner_name ?? null,
      address: submission.identityValues.address ?? null,
      business_type: template.name,
      phone: submission.identityValues.phone ?? null,
      metadata: submission.identityValues,
      updated_at: new Date().toISOString(),
    },
  };
}

function flattenQuestions(sections: TemplateDetail["sections"]): SurveyQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}

function getTextResponseValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
