"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/modules/auth/services/auth.service";
import {
  getSurveyFormData,
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

export async function submitSurveyAction(formData: FormData) {
  const profile = await requireProfile();
  const result = await submitSurvey(profile, formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan survei");
  if (result.responseId) redirect(`/surveys/${result.responseId}`);
}
