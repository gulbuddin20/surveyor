import { TemplateManagement } from "@/modules/admin/components/template-management";
import { loadTemplateEditorController } from "@/modules/admin/controllers/admin.controller";

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const { templates, detail } = await loadTemplateEditorController(params.template);
  return <TemplateManagement templates={templates} detail={detail} />;
}
