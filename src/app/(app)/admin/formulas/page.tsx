import { FormulaManagement } from "@/modules/admin/components/formula-management";
import { loadFormulasController } from "@/modules/admin/controllers/admin.controller";

export default async function AdminFormulasPage() {
  const data = await loadFormulasController();
  return <FormulaManagement templates={data.templates} formulas={data.formulas} />;
}
