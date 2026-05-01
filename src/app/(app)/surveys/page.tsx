import { TemplatePicker } from "@/modules/surveys/components/template-picker";
import { loadSurveyStartController } from "@/modules/surveys/controllers/survey.controller";

export default async function SurveysPage() {
  const { templates } = await loadSurveyStartController();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Survei baru</p>
        <h1 className="text-3xl font-bold text-slate-950">Pilih jenis IKL</h1>
        <p className="mt-1 max-w-2xl text-slate-500">
          Surveyor hanya mencatat kriteria yang tidak terpenuhi. Kriteria yang memenuhi syarat cukup dilewati.
        </p>
      </div>
      <TemplatePicker templates={templates} />
    </div>
  );
}
