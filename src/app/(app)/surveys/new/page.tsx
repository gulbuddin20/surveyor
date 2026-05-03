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
    <div className="atlas-reveal space-y-6">
      <div>
        <p className="atlas-kicker">Input survei</p>
        <h1 className="atlas-heading mt-4 text-4xl font-black tracking-tight text-[var(--atlas-ink)] sm:text-5xl">{template.name}</h1>
        <p className="mt-2 max-w-3xl text-[color:rgba(22,37,29,0.66)]">{template.description}</p>
      </div>
      <SurveyForm template={template} />
    </div>
  );
}
