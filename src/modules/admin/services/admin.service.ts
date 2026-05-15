import {
  formulaSchema,
  identityFieldSchema,
  questionSchema,
  questionSectionOrdersSchema,
  responseFieldSchema,
  sectionSchema,
  sectionParentOrdersSchema,
  templateSchema,
  templateReorderSchema,
  templateSettingsSchema,
  userSchema,
} from "@/lib/schemas";
import {
  createTemplate,
  createUser,
  deleteIdentityField,
  deleteQuestion,
  deleteResponseField,
  deleteSection,
  deleteTemplate,
  getTemplateAdminDetail,
  listFormulas,
  listUsers,
  reorderIdentityFields,
  reorderQuestions,
  reorderQuestionsAcrossSections,
  reorderResponseFields,
  reorderSections,
  reorderSectionsAcrossParents,
  updateFormula,
  updateTemplateSettings,
  upsertIdentityField,
  upsertQuestion,
  upsertResponseField,
  upsertSection,
} from "@/modules/admin/repositories/admin.repository";
import { listAllTemplates } from "@/modules/surveys/repositories/survey.repository";

export async function getUserManagementData() {
  return { users: await listUsers() };
}

export async function getTemplateManagementData() {
  return { templates: await listAllTemplates() };
}

export async function getTemplateEditorData(templateId: string, templates?: Awaited<ReturnType<typeof listAllTemplates>>) {
  const [templateRows, detail] = await Promise.all([
    templates ? Promise.resolve(templates) : listAllTemplates(),
    getTemplateAdminDetail(templateId),
  ]);
  return { templates: templateRows, detail };
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
    photoMaxSizeMb: formData.get("photoMaxSizeMb") || 10,
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const template = await createTemplate(parsed.data);
  return { ok: true, message: "Template dibuat", templateId: template.id };
}

export async function removeTemplateFromForm(formData: FormData) {
  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) return { ok: false, message: "Template tidak valid" };
  await deleteTemplate(templateId);
  return { ok: true, message: "Template dihapus" };
}

export async function updateTemplateSettingsFromForm(formData: FormData) {
  const parsed = templateSettingsSchema.safeParse({
    templateId: formData.get("templateId"),
    photoMaxSizeMb: formData.get("photoMaxSizeMb") || undefined,
    status: formData.get("status") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await updateTemplateSettings(parsed.data);
  return { ok: true, message: "Pengaturan template disimpan" };
}

export async function saveIdentityFieldFromForm(formData: FormData) {
  const parsed = identityFieldSchema.safeParse({
    templateId: formData.get("templateId"),
    fieldId: formData.get("fieldId") || undefined,
    fieldKey: formData.get("fieldKey"),
    label: formData.get("label"),
    fieldType: formData.get("fieldType") || "text",
    placeholder: formData.get("placeholder") || undefined,
    optionsText: formData.get("optionsText") || undefined,
    isRequired: formData.get("isRequired") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await upsertIdentityField(parsed.data);
  return { ok: true, message: "Field identitas disimpan" };
}

export async function removeIdentityFieldFromForm(formData: FormData) {
  const fieldId = String(formData.get("fieldId") ?? "");
  if (!fieldId) return { ok: false, message: "Field identitas tidak valid" };
  await deleteIdentityField(fieldId);
  return { ok: true, message: "Field identitas dihapus" };
}

export async function saveResponseFieldFromForm(formData: FormData) {
  const parsed = responseFieldSchema.safeParse({
    templateId: formData.get("templateId"),
    fieldId: formData.get("fieldId") || undefined,
    fieldKey: formData.get("fieldKey"),
    label: formData.get("label"),
    fieldType: formData.get("fieldType") || "textarea",
    placeholder: formData.get("placeholder") || undefined,
    optionsText: formData.get("optionsText") || undefined,
    maxSizeMb: formData.get("maxSizeMb") || undefined,
    isRequired: formData.get("isRequired") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await upsertResponseField(parsed.data);
  return { ok: true, message: "Field setelah kuesioner disimpan" };
}

export async function removeResponseFieldFromForm(formData: FormData) {
  const fieldId = String(formData.get("fieldId") ?? "");
  if (!fieldId) return { ok: false, message: "Field setelah kuesioner tidak valid" };
  await deleteResponseField(fieldId);
  return { ok: true, message: "Field setelah kuesioner dihapus" };
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
  const sectionId = formData.get("sectionId") || undefined;
  const parentId = formData.get("parentId") || undefined;
  if (sectionId && parentId && sectionId === parentId) {
    return { ok: false, message: "Bagian tidak boleh menjadi induk untuk dirinya sendiri" };
  }

  const parsed = sectionSchema.safeParse({
    templateId: formData.get("templateId"),
    sectionId,
    parentId,
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

export async function reorderIdentityFieldsFromInput(templateId: string, orderedIds: string[]) {
  const parsed = templateReorderSchema.safeParse({ templateId, orderedIds });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderIdentityFields(parsed.data);
  return { ok: true, message: "Urutan header disimpan" };
}

export async function reorderResponseFieldsFromInput(templateId: string, orderedIds: string[]) {
  const parsed = templateReorderSchema.safeParse({ templateId, orderedIds });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderResponseFields(parsed.data);
  return { ok: true, message: "Urutan field disimpan" };
}

export async function reorderSectionsFromInput(templateId: string, parentId: string | null, orderedIds: string[]) {
  const parsed = templateReorderSchema.safeParse({ templateId, parentId, orderedIds });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderSections(parsed.data);
  return { ok: true, message: "Urutan bagian disimpan" };
}

export async function reorderSectionParentsFromInput(
  templateId: string,
  sections: Array<{ parentId: string | null; orderedIds: string[] }>,
) {
  const parsed = sectionParentOrdersSchema.safeParse({ templateId, sections });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderSectionsAcrossParents(parsed.data);
  return { ok: true, message: "Urutan dan induk bagian disimpan" };
}

export async function reorderQuestionsFromInput(templateId: string, sectionId: string | null, orderedIds: string[]) {
  const parsed = templateReorderSchema.safeParse({ templateId, sectionId, orderedIds });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderQuestions(parsed.data);
  return { ok: true, message: "Urutan pertanyaan disimpan" };
}

export async function reorderQuestionSectionsFromInput(
  templateId: string,
  sections: Array<{ sectionId: string; orderedIds: string[] }>,
) {
  const parsed = questionSectionOrdersSchema.safeParse({ templateId, sections });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  await reorderQuestionsAcrossSections(parsed.data);
  return { ok: true, message: "Urutan dan bagian pertanyaan disimpan" };
}
