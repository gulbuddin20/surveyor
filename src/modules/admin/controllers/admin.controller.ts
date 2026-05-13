"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/modules/auth/services/auth.service";
import {
  createRegularUserFromForm,
  createTemplateFromForm,
  getFormulaManagementData,
  getTemplateEditorData,
  getTemplateManagementData,
  getUserManagementData,
  removeIdentityFieldFromForm,
  removeQuestionFromForm,
  removeResponseFieldFromForm,
  removeSectionFromForm,
  removeTemplateFromForm,
  reorderIdentityFieldsFromInput,
  reorderQuestionSectionsFromInput,
  reorderQuestionsFromInput,
  reorderResponseFieldsFromInput,
  reorderSectionsFromInput,
  saveIdentityFieldFromForm,
  saveQuestionFromForm,
  saveResponseFieldFromForm,
  saveSectionFromForm,
  updateFormulaFromForm,
  updateTemplateSettingsFromForm,
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
  const result = await createTemplateFromForm(formData).catch((error: unknown) => ({
    ok: false,
    message: error instanceof Error ? error.message : "Gagal membuat template",
  }));
  if (!result.ok) redirect(`/admin/templates?error=${encodeURIComponent(result.message ?? "Gagal membuat template")}`);
  const templateId = "templateId" in result ? result.templateId : null;
  if (!templateId) redirect("/admin/templates?error=Template%20dibuat%20tetapi%20ID%20tidak%20ditemukan");
  revalidatePath("/admin/templates");
  redirect(`/admin/templates?template=${templateId}`);
}

export async function deleteTemplateAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await removeTemplateFromForm(formData).catch((error: unknown) => ({
    ok: false,
    message: error instanceof Error ? error.message : "Gagal menghapus template",
  }));
  if (!result.ok) redirect(`/admin/templates?error=${encodeURIComponent(result.message ?? "Gagal menghapus template")}`);
  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateFormulaAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await updateFormulaFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal memperbarui formula");
  revalidatePath("/admin/formulas");
}

export async function updateTemplateSettingsAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await updateTemplateSettingsFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal memperbarui pengaturan template");
  revalidatePath("/admin/templates");
}

export async function saveIdentityFieldAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await saveIdentityFieldFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan field identitas");
  revalidatePath("/admin/templates");
}

export async function deleteIdentityFieldAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await removeIdentityFieldFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menghapus field identitas");
  revalidatePath("/admin/templates");
}

export async function saveResponseFieldAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await saveResponseFieldFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan field setelah kuesioner");
  revalidatePath("/admin/templates");
}

export async function deleteResponseFieldAction(formData: FormData) {
  await requireSuperAdmin();
  const result = await removeResponseFieldFromForm(formData);
  if (!result.ok) throw new Error(result.message ?? "Gagal menghapus field setelah kuesioner");
  revalidatePath("/admin/templates");
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

export async function reorderIdentityFieldsAction(templateId: string, orderedIds: string[]) {
  await requireSuperAdmin();
  const result = await reorderIdentityFieldsFromInput(templateId, orderedIds);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan urutan header");
  revalidatePath("/admin/templates");
}

export async function reorderResponseFieldsAction(templateId: string, orderedIds: string[]) {
  await requireSuperAdmin();
  const result = await reorderResponseFieldsFromInput(templateId, orderedIds);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan urutan field");
  revalidatePath("/admin/templates");
}

export async function reorderSectionsAction(templateId: string, parentId: string | null, orderedIds: string[]) {
  await requireSuperAdmin();
  const result = await reorderSectionsFromInput(templateId, parentId, orderedIds);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan urutan bagian");
  revalidatePath("/admin/templates");
}

export async function reorderQuestionsAction(templateId: string, sectionId: string | null, orderedIds: string[]) {
  await requireSuperAdmin();
  const result = await reorderQuestionsFromInput(templateId, sectionId, orderedIds);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan urutan pertanyaan");
  revalidatePath("/admin/templates");
}

export async function reorderQuestionSectionsAction(
  templateId: string,
  sections: Array<{ sectionId: string; orderedIds: string[] }>,
) {
  await requireSuperAdmin();
  const result = await reorderQuestionSectionsFromInput(templateId, sections);
  if (!result.ok) throw new Error(result.message ?? "Gagal menyimpan perpindahan pertanyaan");
  revalidatePath("/admin/templates");
}
