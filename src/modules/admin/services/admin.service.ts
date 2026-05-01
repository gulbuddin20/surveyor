import { formulaSchema, templateSchema, userSchema } from "@/lib/schemas";
import {
  createTemplate,
  createUser,
  listFormulas,
  listUsers,
  updateFormula,
} from "@/modules/admin/repositories/admin.repository";
import { listAllTemplates } from "@/modules/surveys/repositories/survey.repository";

export async function getUserManagementData() {
  return { users: await listUsers() };
}

export async function getTemplateManagementData() {
  return { templates: await listAllTemplates() };
}

export async function getFormulaManagementData() {
  const [templates, formulas] = await Promise.all([listAllTemplates(), listFormulas()]);
  return { templates, formulas };
}

export async function createRegularUserFromForm(formData: FormData) {
  const parsed = userSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await createUser(parsed.data);
  return { ok: true, message: "User dibuat" };
}

export async function createTemplateFromForm(formData: FormData) {
  const parsed = templateSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    denominator: formData.get("denominator"),
    passingScore: formData.get("passingScore"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await createTemplate(parsed.data);
  return { ok: true, message: "Template dibuat" };
}

export async function updateFormulaFromForm(formData: FormData) {
  const parsed = formulaSchema.safeParse({
    templateId: formData.get("templateId"),
    denominator: formData.get("denominator"),
    passingScore: formData.get("passingScore"),
    expression: formData.get("expression"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await updateFormula(parsed.data);
  return { ok: true, message: "Formula diperbarui" };
}
