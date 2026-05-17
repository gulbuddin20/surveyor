import { SurveyHistoryTable } from "@/modules/surveys/components/survey-history-table";
import { loadSurveyHistoryController } from "@/modules/surveys/controllers/survey.controller";

export default async function SurveyHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const { canDelete, history } = await loadSurveyHistoryController(params);

  return (
    <div className="atlas-reveal space-y-6">
      <div>
        <p className="atlas-kicker">Arsip survei</p>
        <h1 className="atlas-heading mt-4 text-4xl font-black tracking-tight text-[var(--atlas-ink)] sm:text-5xl">
          Riwayat hasil IKL
        </h1>
        <p className="mt-2 max-w-3xl text-[color:rgba(22,37,29,0.66)]">
          Semua input tersimpan per lokasi dan template. Admin melihat seluruh surveyor, user biasa hanya melihat pekerjaannya sendiri.
        </p>
      </div>
      <SurveyHistoryTable canDelete={canDelete} history={history} />
    </div>
  );
}
