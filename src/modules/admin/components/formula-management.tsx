import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormulaRule, SurveyTemplate } from "@/lib/types";
import { updateFormulaAction } from "@/modules/admin/controllers/admin.controller";

type FormulaRow = FormulaRule & { survey_templates?: { name: string } };

export function FormulaManagement({
  templates,
  formulas,
}: {
  templates: SurveyTemplate[];
  formulas: FormulaRow[];
}) {
  return (
    <div className="atlas-reveal grid gap-4 xl:grid-cols-2">
      {templates.map((template) => {
        const formula = formulas.find((item) => item.template_id === template.id);
        return (
          <Card key={template.id} className="hover:-translate-y-1">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>Atur denominator dan ambang lulus.</CardDescription>
            </CardHeader>
            <form action={updateFormulaAction} className="space-y-4">
              <input type="hidden" name="templateId" value={template.id} />
              <div className="space-y-2">
                <Label>Expression</Label>
                <Input
                  name="expression"
                  defaultValue={formula?.expression ?? "100 - ((total_nonconformity / denominator) * 100)"}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Denominator</Label>
                  <Input name="denominator" type="number" defaultValue={formula?.denominator ?? template.denominator} />
                </div>
                <div className="space-y-2">
                  <Label>Passing score</Label>
                  <Input name="passingScore" type="number" defaultValue={formula?.passing_score ?? template.passing_score} />
                </div>
              </div>
              <Button type="submit" className="w-full">Update formula</Button>
            </form>
          </Card>
        );
      })}
    </div>
  );
}
