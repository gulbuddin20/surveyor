import { surveySubmissionSchema } from "@/lib/schemas";
import type { Profile, SectionWithQuestions, SurveyQuestion } from "@/lib/types";
import {
  createAnswers,
  createPhotos,
  createResponse,
  createSubject,
  getTemplateDetail,
  getSurveyResultDetail,
  listSurveyHistory,
  listActiveTemplates,
  replaceAnswers,
  updateResponse,
  updateSubject,
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

export async function getSurveyHistoryData(
  profile: Profile,
  searchParams: { limit?: string; page?: string; q?: string },
) {
  return {
    history: await listSurveyHistory({
      userId: profile.id,
      isAdmin: profile.role === "super_admin",
      page: Number(searchParams.page ?? 1),
      limit: Number(searchParams.limit ?? 10),
      query: searchParams.q ?? "",
    }),
  };
}

export async function getSurveyEditData(profile: Profile, responseId: string) {
  const detail = await getSurveyResultDetail(responseId, profile.id, profile.role === "super_admin");
  if (!detail) throw new Error("Hasil survei tidak ditemukan");
  const template = await getTemplateDetail(detail.template.id);
  if (!template) throw new Error("Template tidak ditemukan");
  return { detail, template };
}

export async function submitSurvey(profile: Profile, formData: FormData) {
  const responseId = String(formData.get("responseId") ?? "");
  const nonconformities = Array.from(new Set(formData.getAll("nonconformities").map(String)));
  const identityValues = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => key.startsWith("identity."))
      .map(([key, value]) => [key.replace("identity.", ""), String(value)]),
  );
  const parsed = surveySubmissionSchema.safeParse({
    templateId: formData.get("templateId"),
    businessName: identityValues.business_name || Object.values(identityValues).find((value) => value.trim()),
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
  const businessName = parsed.data.businessName?.trim();
  if (!businessName) return { ok: false, message: "Minimal satu field identitas wajib diisi" };

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
  const byId = new Map<string, SurveyQuestion>(questions.map((question) => [question.id, question]));
  const validNonconformities = parsed.data.nonconformities.filter((questionId) => byId.has(questionId));
  if (validNonconformities.length !== parsed.data.nonconformities.length) {
    return { ok: false, message: "Pertanyaan tidak valid" };
  }
  const score = calculateSurveyScore(questions, validNonconformities, {
    formula: template.formula,
    templateDenominator: template.denominator,
    templatePassingScore: template.passing_score,
  });

  const subjectPayload = {
    owner_id: profile.id,
    business_name: businessName,
    owner_name: parsed.data.ownerName ?? null,
    address: parsed.data.address ?? null,
    business_type: template.name,
    phone: parsed.data.phone ?? null,
    metadata: parsed.data.identityValues,
    updated_at: new Date().toISOString(),
  };

  const responsePayload = {
    template_id: template.id,
    surveyor_id: profile.id,
    status: "submitted",
    total_nonconformity: score.totalNonconformity,
    score: score.score,
    result_label: score.resultLabel,
    notes: parsed.data.notes ?? null,
    recommendation_notes: parsed.data.recommendationNotes ?? null,
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as const;

  const answerRows = validNonconformities.map((questionId) => {
      const question = byId.get(questionId);
      if (!question) throw new Error("Pertanyaan tidak valid");
      return {
        response_id: responseId,
        question_id: question.id,
        is_nonconforming: true,
        value: { checked: true },
        score: Number(question.weight),
        notes: null,
      };
    });

  let finalResponseId = responseId;
  if (responseId) {
    const existing = await getSurveyResultDetail(responseId, profile.id, profile.role === "super_admin");
    if (!existing) return { ok: false, message: "Hasil survei tidak ditemukan" };
    if (existing.template.id !== template.id) return { ok: false, message: "Template survei tidak sesuai" };
    await updateSubject(existing.subject.id, subjectPayload);
    const response = await updateResponse(responseId, {
      ...responsePayload,
      subject_id: existing.subject.id,
    });
    finalResponseId = response.id;
    await replaceAnswers(response.id, answerRows.map((row) => ({ ...row, response_id: response.id })));
  } else {
    const subject = await createSubject(subjectPayload);
    const response = await createResponse({
      ...responsePayload,
      subject_id: subject.id,
    });
    finalResponseId = response.id;
    await createAnswers(answerRows.map((row) => ({ ...row, response_id: response.id })));
  }

  const photoRows = await Promise.all(
    photoFiles.map(async (file) => ({
      response_id: finalResponseId,
      question_id: null,
      storage_path: await uploadEvidencePhoto({ userId: profile.id, responseId: finalResponseId, file }),
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      caption: photoCaption,
    })),
  );
  await createPhotos(photoRows);

  return { ok: true, responseId: finalResponseId };
}

function flattenQuestions(sections: SectionWithQuestions[]): SurveyQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}
