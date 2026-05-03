import { surveySubmissionSchema } from "@/lib/schemas";
import type { Profile, SectionWithQuestions, SurveyQuestion } from "@/lib/types";
import {
  createAnswers,
  createPhotos,
  createResponse,
  createSubject,
  getTemplateDetail,
  getSurveyResultDetail,
  listActiveTemplates,
  uploadEvidencePhoto,
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

export async function getSurveyResultData(profile: Profile, responseId: string) {
  const detail = await getSurveyResultDetail(responseId, profile.id, profile.role === "super_admin");
  if (!detail) throw new Error("Hasil survei tidak ditemukan");
  return { detail };
}

export async function submitSurvey(profile: Profile, formData: FormData) {
  const nonconformities = formData.getAll("nonconformities").map(String);
  const identityValues = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("identity."))
      .map(([key, value]) => [key.replace("identity.", ""), String(value)]),
  );
  const parsed = surveySubmissionSchema.safeParse({
    templateId: formData.get("templateId"),
    businessName: identityValues.business_name,
    ownerName: identityValues.owner_name,
    address: identityValues.address,
    phone: identityValues.phone,
    identityValues,
    notes: formData.get("notes"),
    recommendationNotes: formData.get("recommendationNotes"),
    nonconformities,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const template = await getTemplateDetail(parsed.data.templateId);
  if (!template) return { ok: false, message: "Template tidak ditemukan" };

  for (const field of template.identityFields) {
    if (field.is_required && !parsed.data.identityValues[field.field_key]?.trim()) {
      return { ok: false, message: `${field.label} wajib diisi` };
    }
  }

  const photoCaption = String(formData.get("photoCaption") ?? "").slice(0, 500) || null;
  const photoFiles = formData
    .getAll("evidencePhotos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const maxBytes = Number(template.photo_max_size_mb) * 1024 * 1024;
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  for (const file of photoFiles) {
    if (!allowedTypes.has(file.type)) return { ok: false, message: "Foto bukti harus JPG, PNG, atau WebP" };
    if (file.size > maxBytes) return { ok: false, message: `Ukuran foto maksimal ${template.photo_max_size_mb} MB` };
  }

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
    metadata: parsed.data.identityValues,
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
    recommendation_notes: parsed.data.recommendationNotes ?? null,
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

  const photoRows = await Promise.all(
    photoFiles.map(async (file) => ({
      response_id: response.id,
      question_id: null,
      storage_path: await uploadEvidencePhoto({ userId: profile.id, responseId: response.id, file }),
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      caption: photoCaption,
    })),
  );
  await createPhotos(photoRows);

  return { ok: true, responseId: response.id };
}

function flattenQuestions(sections: SectionWithQuestions[]): SurveyQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}
