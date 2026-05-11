import { SurveyForm } from "@/modules/surveys/components/survey-form";
import { loadSurveyEditController } from "@/modules/surveys/controllers/survey.controller";

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail, template } = await loadSurveyEditController(id);

  return (
    <div className="atlas-reveal space-y-6">
      <div>
        <p className="atlas-kicker">Edit survei</p>
        <h1 className="atlas-heading mt-4 text-4xl font-black tracking-tight text-[var(--atlas-ink)] sm:text-5xl">
          {template.name}
        </h1>
        <p className="mt-2 max-w-3xl text-[color:rgba(22,37,29,0.66)]">
          Perbarui identitas lokasi, temuan ketidaksesuaian, catatan, dan rekomendasi. Foto lama tetap tersimpan.
        </p>
      </div>
      <SurveyForm template={template} mode="edit" initialDetail={detail} />
    </div>
  );
}
