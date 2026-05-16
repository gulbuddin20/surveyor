import type { Profile } from "@/lib/types";
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
import { parseSignaturePayload, type PendingSignature } from "@/modules/surveys/services/survey-signature.service";
import {
  collectPhotoInputs,
  multiPhotoTargetBytes,
  singlePhotoTargetBytes,
  validatePhotoInputs,
} from "@/modules/surveys/services/survey-upload.service";
import {
  buildSurveyPayloads,
  parseSurveySubmission,
  validateTemplateRequiredFields,
} from "@/modules/surveys/services/survey-submission-parser";

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
  const submission = parseSurveySubmission(formData);
  if (!submission.ok) return submission;

  const template = await getTemplateDetail(submission.data.templateId);
  if (!template) return { ok: false, message: "Template tidak ditemukan" };
  const requiredValidation = validateTemplateRequiredFields(template, submission.data);
  if (!requiredValidation.ok) return requiredValidation;

  const normalizedResponseValues: Record<string, unknown> = { ...submission.data.responseValues };
  const pendingSignatures: PendingSignature[] = [];

  for (const field of template.responseFields.filter((item) => item.field_type === "signature")) {
    const rawValue = typeof submission.data.responseValues[field.field_key] === "string"
      ? submission.data.responseValues[field.field_key].trim()
      : "";
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
    isNewResponse: !submission.data.responseId,
    profile,
    template,
  });
  if (!photoValidation.ok) return photoValidation;

  const payloads = buildSurveyPayloads({
    profile,
    submission: { ...submission.data, responseValues: normalizedResponseValues },
    template,
  });
  if (!payloads.ok) return payloads;

  let finalResponseId = submission.data.responseId;
  if (submission.data.responseId) {
    const existing = await getSurveyResultDetail(submission.data.responseId, profile.id, profile.role === "super_admin");
    if (!existing) return { ok: false, message: "Hasil survei tidak ditemukan" };
    if (existing.template.id !== template.id) return { ok: false, message: "Template survei tidak sesuai" };
    await updateSubject(existing.subject.id, payloads.subjectPayload);
    const response = await updateResponse(submission.data.responseId, {
      ...payloads.responsePayload,
      subject_id: existing.subject.id,
    });
    finalResponseId = response.id;
    await replaceAnswers(response.id, payloads.answerRows.map((row) => ({ ...row, response_id: response.id })));
  } else {
    const subject = await createSubject(payloads.subjectPayload);
    const response = await createResponse({
      ...payloads.responsePayload,
      subject_id: subject.id,
    });
    finalResponseId = response.id;
    await createAnswers(payloads.answerRows.map((row) => ({ ...row, response_id: response.id })));
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
