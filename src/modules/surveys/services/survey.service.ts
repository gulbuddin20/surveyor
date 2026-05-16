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
  uploadSignatureImage,
} from "@/modules/surveys/repositories/survey.repository";
import { calculateSurveyScore } from "@/modules/surveys/services/formula.service";
import { parseSignaturePayload, type PendingSignature } from "@/modules/surveys/services/survey-signature.service";
import {
  collectPhotoInputs,
  multiPhotoTargetBytes,
  singlePhotoTargetBytes,
  validatePhotoInputs,
} from "@/modules/surveys/services/survey-upload.service";

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
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const template = await getTemplateDetail(parsed.data.templateId);
  if (!template) return { ok: false, message: "Template tidak ditemukan" };
  const businessName = parsed.data.businessName?.trim() || "Tanpa nama tempat";

  for (const field of template.identityFields) {
    if (field.is_required && !parsed.data.identityValues[field.field_key]?.trim()) {
      return { ok: false, message: `${field.label} wajib diisi` };
    }
  }

  const normalizedResponseValues: Record<string, unknown> = { ...parsed.data.responseValues };
  const pendingSignatures: PendingSignature[] = [];

  for (const field of template.responseFields) {
    if (
      field.field_type !== "photo"
      && field.field_type !== "signature"
      && field.is_required
      && !parsed.data.responseValues[field.field_key]?.trim()
    ) {
      return { ok: false, message: `${field.label} wajib diisi` };
    }
  }

  for (const field of template.responseFields.filter((item) => item.field_type === "signature")) {
    const rawValue = parsed.data.responseValues[field.field_key]?.trim() ?? "";
    if (!rawValue) {
      delete normalizedResponseValues[field.field_key];
      if (field.is_required) return { ok: false, message: `${field.label} wajib ditandatangani` };
      continue;
    }

    const signature = parseSignaturePayload(rawValue);
    if (!signature) return { ok: false, message: `${field.label} tidak valid` };
    if ("storagePath" in signature) {
      normalizedResponseValues[field.field_key] = signature;
    } else {
      pendingSignatures.push({
        fieldKey: field.field_key,
        dataUrl: signature.dataUrl,
        signedAt: signature.signedAt,
      });
      delete normalizedResponseValues[field.field_key];
    }
  }

  const photoInputs = collectPhotoInputs(template, formData);
  const photoValidation = validatePhotoInputs({
    inputs: photoInputs,
    isNewResponse: !responseId,
    profile,
    template,
  });
  if (!photoValidation.ok) return photoValidation;

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
    notes: getTextResponseValue(normalizedResponseValues.notes),
    recommendation_notes: getTextResponseValue(normalizedResponseValues.recommendation_notes),
    response_values: normalizedResponseValues,
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
    photoInputs.flatMap((input) => {
      const maxOutputBytes = input.files.length === 1 ? singlePhotoTargetBytes : multiPhotoTargetBytes;
      return [
        ...input.uploaded.map((photo) => ({
          kind: "uploaded" as const,
          photo,
          fieldKey: input.field.field_key,
        })),
        ...input.files.map((file) => ({
          kind: "file" as const,
          file,
          fieldKey: input.field.field_key,
          maxOutputBytes,
        })),
      ];
    }).map(async (input) => {
      if (input.kind === "uploaded") {
        return {
          response_id: finalResponseId,
          question_id: null,
          field_key: input.fieldKey,
          storage_path: input.photo.storagePath,
          file_name: input.photo.fileName,
          mime_type: input.photo.mimeType,
          file_size_bytes: input.photo.fileSizeBytes,
          caption: null,
        };
      }
      const stored = await uploadEvidencePhoto({
        userId: profile.id,
        responseId: finalResponseId,
        file: input.file,
        maxOutputBytes: input.maxOutputBytes,
      });
      return {
        response_id: finalResponseId,
        question_id: null,
        field_key: input.fieldKey,
        storage_path: stored.storagePath,
        file_name: input.file.name,
        mime_type: stored.mimeType,
        file_size_bytes: stored.fileSizeBytes,
        caption: null,
      };
    }),
  );
  await createPhotos(photoRows);

  if (pendingSignatures.length) {
    const signatureValues = Object.fromEntries(
      await Promise.all(
        pendingSignatures.map(async (signature) => {
          const stored = await uploadSignatureImage({
            userId: profile.id,
            responseId: finalResponseId,
            fieldKey: signature.fieldKey,
            dataUrl: signature.dataUrl,
          });
          return [
            signature.fieldKey,
            {
              ...stored,
              signedAt: signature.signedAt,
            },
          ] as const;
        }),
      ),
    );
    Object.assign(normalizedResponseValues, signatureValues);
    await updateResponse(finalResponseId, {
      response_values: normalizedResponseValues,
      updated_at: new Date().toISOString(),
    });
  }

  return { ok: true, responseId: finalResponseId };
}

function flattenQuestions(sections: SectionWithQuestions[]): SurveyQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}

function getTextResponseValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
