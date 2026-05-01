"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/modules/auth/services/auth.service";
import {
  createRegularUserFromForm,
  createTemplateFromForm,
  getFormulaManagementData,
  getTemplateManagementData,
  getUserManagementData,
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
