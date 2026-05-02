"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/modules/auth/services/auth.service";
import {
  createRegularUserFromForm,
  createTemplateFromForm,
  getFormulaManagementData,
  getTemplateEditorData,
  getTemplateManagementData,
  getUserManagementData,
  removeQuestionFromForm,
  removeSectionFromForm,
  saveQuestionFromForm,
  saveSectionFromForm,
  updateFormulaFromForm,
} from "@/modules/admin/services/admin.service";

export async function loadUsersController() {
  await requireSuperAdmin();
  return getUserManagementData();
}

export async function loadTemplatesController() {
  await requireSuperAdmin();
  return getTemplateManagementData();
}

export async function loadTemplateEditorController(templateId?: string) {
  await requireSuperAdmin();
  const data = await getTemplateManagementData();
  const selectedId = templateId ?? data.templates[0]?.id;
  if (!selectedId) return { templates: data.templates, detail: null };
  return getTemplateEditorData(selectedId);
}

export async function loadFormulasController() {
  await requireSuperAdmin();
  return getFormulaManagementData();
}

export async function createUserAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await createRegularUserFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal membuat user");
  revalidatePath("/admin/users");
}

export async function createTemplateAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await createTemplateFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal membuat template");
  revalidatePath("/admin/templates");
}

export async function updateFormulaAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await updateFormulaFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal memperbarui formula");
  revalidatePath("/admin/formulas");
}

export async function saveSectionAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await saveSectionFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan bagian");
  revalidatePath("/admin/templates");
}

export async function deleteSectionAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await removeSectionFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menghapus bagian");
  revalidatePath("/admin/templates");
}

export async function saveQuestionAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await saveQuestionFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan pertanyaan");
  revalidatePath("/admin/templates");
}

export async function deleteQuestionAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await removeQuestionFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menghapus pertanyaan");
  revalidatePath("/admin/templates");
}
