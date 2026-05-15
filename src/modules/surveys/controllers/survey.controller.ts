"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/modules/auth/services/auth.service";
import {
  getSurveyFormData,
  getSurveyEditData,
  getSurveyHistoryData,
  getSurveyResultData,
  getSurveyStartData,
  submitSurvey,
} from "@/modules/surveys/services/survey.service";

export async function loadSurveyStartController() {
  await requireProfile();
  return getSurveyStartData();
}

export async function loadSurveyFormController(templateId: string) {
  await requireProfile();
  return getSurveyFormData(templateId);
}

export async function loadSurveyResultController(responseId: string) {
  const profile = await requireProfile();
  return getSurveyResultData(profile, responseId);
}

export async function loadSurveyHistoryController(searchParams: { limit?: string; page?: string; q?: string }) {
  const profile = await requireProfile();
  return getSurveyHistoryData(profile, searchParams);
}

export async function loadSurveyEditController(responseId: string) {
  const profile = await requireProfile();
  return getSurveyEditData(profile, responseId);
}

export async function submitSurveyAction(formData: FormData) {
  const profile = await requireProfile();
  const result = await submitSurvey(profile, formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan survei");
  if (result.responseId) {
    revalidatePath("/surveys/history");
    revalidatePath("/dashboard");
    revalidatePath(`/surveys/${result.responseId}`);
    revalidatePath(`/surveys/${result.responseId}/edit`);
    redirect(`/surveys/${result.responseId}`);
  }
}
