import { TemplatePicker } from "@/modules/surveys/components/template-picker";
import { loadSurveyStartController } from "@/modules/surveys/controllers/survey.controller";

export default async function SurveysPage() {
  const { templates } = await loadSurveyStartController();
  return (
    <div className="atlas-reveal space-y-6">
      <div>
        <p className="atlas-kicker">Survei baru</p>
        <h1 className="atlas-heading mt-4 text-4xl font-black tracking-tight text-[var(--atlas-ink)] sm:text-5xl">Pilih jenis IKL</h1>
        <p className="mt-2 max-w-2xl text-[color:rgba(22,37,29,0.66)]">
          Surveyor hanya mencatat kriteria yang tidak terpenuhi. Kriteria yang memenuhi syarat cukup dilewati.
        </p>
      </div>
      <TemplatePicker templates={templates} />
    </div>
  );
}
