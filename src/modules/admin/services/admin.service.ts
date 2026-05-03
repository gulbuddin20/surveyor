import { formulaSchema, questionSchema, sectionSchema, templateSchema, userSchema } from "@/lib/schemas";
import {
  createTemplate,
  createUser,
  deleteQuestion,
  deleteSection,
  getTemplateAdminDetail,
  listFormulas,
  listUsers,
  updateFormula,
  upsertQuestion,
  upsertSection,
} from "@/modules/admin/repositories/admin.repository";
import { listAllTemplates } from "@/modules/surveys/repositories/survey.repository";

export async function getUserManagementData() {
  return { users: await listUsers() };
}

export async function getTemplateManagementData() {
  return { templates: await listAllTemplates() };
}

export async function getTemplateEditorData(templateId: string) {
  const [templates, detail] = await Promise.all([
    listAllTemplates(),
    getTemplateAdminDetail(templateId),
  ]);
  return { templates, detail };
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

export async function saveSectionFromForm(formData: FormData) {
  const parsed = sectionSchema.safeParse({
    templateId: formData.get("templateId"),
    sectionId: formData.get("sectionId") || undefined,
    parentId: formData.get("parentId") || undefined,
    title: formData.get("title"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await upsertSection(parsed.data);
  return { ok: true, message: "Bagian disimpan" };
}

export async function removeSectionFromForm(formData: FormData) {
  const sectionId = String(formData.get("sectionId") ?? "");
  if (!sectionId) return { ok: false, message: "Bagian tidak valid" };
  await deleteSection(sectionId);
  return { ok: true, message: "Bagian dihapus" };
}

export async function saveQuestionFromForm(formData: FormData) {
  const parsed = questionSchema.safeParse({
    templateId: formData.get("templateId"),
    questionId: formData.get("questionId") || undefined,
    sectionId: formData.get("sectionId") || undefined,
    label: formData.get("label"),
    helpText: formData.get("helpText") || undefined,
    questionType: formData.get("questionType") || "checkbox",
    weight: formData.get("weight"),
    isRequired: formData.get("isRequired") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await upsertQuestion(parsed.data);
  return { ok: true, message: "Pertanyaan disimpan" };
}

export async function removeQuestionFromForm(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return { ok: false, message: "Pertanyaan tidak valid" };
  await deleteQuestion(questionId);
  return { ok: true, message: "Pertanyaan dihapus" };
}
