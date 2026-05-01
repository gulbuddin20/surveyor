import { redirect } from "next/navigation";
import { SurveyForm } from "@/modules/surveys/components/survey-form";
import { loadSurveyFormController } from "@/modules/surveys/controllers/survey.controller";

export default async function NewSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  if (!params.template) redirect("/surveys");
  const { template } = await loadSurveyFormController(params.template);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Input survei</p>
        <h1 className="text-3xl font-bold text-slate-950">{template.name}</h1>
        <p className="mt-1 max-w-2xl text-slate-500">{template.description}</p>
      </div>
      <SurveyForm template={template} />
    </div>
  );
}
