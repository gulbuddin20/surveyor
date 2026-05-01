import { TemplateManagement } from "@/modules/admin/components/template-management";
import { loadTemplatesController } from "@/modules/admin/controllers/admin.controller";

export default async function AdminTemplatesPage() {
  const { templates } = await loadTemplatesController();
  return <TemplateManagement templates={templates} />;
}
