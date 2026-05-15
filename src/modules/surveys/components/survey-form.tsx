"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { ConfirmedSubmitButton } from "@/components/ui/confirmed-submit-button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SectionWithQuestions, SurveyResultDetail, TemplateDetail } from "@/lib/types";
import { IdentityFieldsCard } from "@/modules/surveys/components/identity-fields-card";
import { ResponseFieldsCard } from "@/modules/surveys/components/response-fields-card";
import type { ExistingPhotoPreview } from "@/modules/surveys/components/photo-upload-field";
import { calculateSurveyProgress, calculateSurveyScore, flattenQuestions } from "@/modules/surveys/services/formula.service";
import { submitSurveyAction } from "@/modules/surveys/controllers/survey.controller";
import { useSurveyWizardStore } from "@/stores/survey-wizard.store";

export function SurveyForm({
  template,
  mode = "create",
  initialDetail,
  initialPhotoPreviews = [],
}: {
  template: TemplateDetail;
  mode?: "create" | "edit";
  initialDetail?: SurveyResultDetail;
  initialPhotoPreviews?: ExistingPhotoPreview[];
}) {
  const selectedQuestionIds = useSurveyWizardStore((state) => state.selectedQuestionIds);
  const setSelectedQuestionIds = useSurveyWizardStore((state) => state.setSelectedQuestionIds);
  const toggleQuestion = useSurveyWizardStore((state) => state.toggleQuestion);
  const reset = useSurveyWizardStore((state) => state.reset);
  const [uploadingPhotoFields, setUploadingPhotoFields] = useState<Record<string, boolean>>({});
  const questions = useMemo(() => flattenQuestions(template.sections), [template]);
  const hasPendingPhotoUpload = Object.values(uploadingPhotoFields).some(Boolean);
  const result = calculateSurveyScore(questions, selectedQuestionIds, {
    formula: template.formula,
    templateDenominator: template.denominator,
    templatePassingScore: template.passing_score,
  });
  const progress = calculateSurveyProgress(questions.length, selectedQuestionIds);

  useEffect(() => {
    if (initialDetail) {
      setSelectedQuestionIds(initialDetail.answers.map((answer) => answer.question_id));
      return;
    }
    reset();
  }, [initialDetail, reset, setSelectedQuestionIds, template.id]);

  const handlePhotoUploadStateChange = useCallback((fieldKey: string, isUploading: boolean) => {
    setUploadingPhotoFields((current) => {
      if (current[fieldKey] === isUploading) return current;
      return { ...current, [fieldKey]: isUploading };
    });
  }, []);

  return (
    <form action={submitSurveyAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="templateId" value={template.id} />
      {initialDetail ? <input type="hidden" name="responseId" value={initialDetail.response.id} /> : null}
      {selectedQuestionIds.map((questionId) => (
        <input key={questionId} type="hidden" name="nonconformities" value={questionId} />
      ))}
      <div className="space-y-5">
        <IdentityFieldsCard fields={template.identityFields} values={initialDetail?.subject.metadata} />
        {template.sections.map((section) => (
          <SurveySectionCard
            key={section.id}
            section={section}
            selectedQuestionIds={selectedQuestionIds}
            onToggleQuestion={toggleQuestion}
          />
        ))}
        <ResponseFieldsCard
          fields={template.responseFields}
          templateId={template.id}
          values={initialDetail?.response.response_values}
          photos={initialPhotoPreviews}
          onPhotoUploadStateChange={handlePhotoUploadStateChange}
        />
        {initialDetail?.photos.length ? (
          <p className="rounded-2xl bg-[color:rgba(255,249,234,0.62)] p-3 text-sm font-semibold text-[color:rgba(22,37,29,0.58)]">
            {initialDetail.photos.length} foto lama tetap tersimpan. Upload foto baru hanya menambahkan bukti tambahan.
          </p>
        ) : null}
      </div>
      <aside className="xl:sticky xl:top-24 xl:h-fit">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "edit" ? "Perbarui hasil" : "Hasil sementara"}</CardTitle>
            <CardDescription>{template.name}</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Progress value={progress} />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-[color:rgba(22,37,29,0.06)] p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[color:rgba(22,37,29,0.52)]">Ketidaksesuaian</p>
                <p className="atlas-heading text-3xl font-black">{result.totalNonconformity}</p>
              </div>
              <div className="rounded-2xl bg-[color:rgba(121,168,77,0.16)] p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--atlas-canopy)]">Skor</p>
                <p className="atlas-heading text-3xl font-black text-[var(--atlas-canopy)]">{result.score}</p>
              </div>
            </div>
            <p className="rounded-2xl bg-[color:rgba(242,111,76,0.12)] p-3 text-sm font-extrabold text-[var(--atlas-ink)]">
              {result.resultLabel}
            </p>
            <ConfirmedSubmitButton
              className="w-full"
              disabled={hasPendingPhotoUpload}
              confirmActionLabel={mode === "edit" ? "Ya, simpan perubahan" : "Ya, simpan survei"}
              confirmDescription="Hasil survei akan disimpan ke database. Periksa kembali identitas, jawaban, foto, dan catatan sebelum melanjutkan."
              confirmTitle={mode === "edit" ? "Simpan perubahan survei?" : "Simpan survei baru?"}
              pendingLabel={mode === "edit" ? "Menyimpan perubahan..." : "Menyimpan survei..."}
            >
              <Save className="h-4 w-4" />
              {hasPendingPhotoUpload ? "Menunggu foto selesai..." : mode === "edit" ? "Simpan perubahan" : "Simpan survei"}
            </ConfirmedSubmitButton>
          </div>
        </Card>
      </aside>
    </form>
  );
}

function SurveySectionCard({
  section,
  selectedQuestionIds,
  onToggleQuestion,
}: {
  section: SectionWithQuestions;
  selectedQuestionIds: string[];
  onToggleQuestion: (questionId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
        <CardDescription>
          Centang hanya kriteria yang tidak terpenuhi. Jika memenuhi syarat, lewati.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <QuestionList
          questions={section.questions}
          selectedQuestionIds={selectedQuestionIds}
          onToggleQuestion={onToggleQuestion}
        />
        {section.children.map((child) => (
          <div key={child.id} className="atlas-fieldset rounded-[1.5rem] p-4">
            <h3 className="atlas-heading text-xl font-black text-[var(--atlas-ink)]">{child.title}</h3>
            <div className="mt-3 space-y-3">
              <QuestionList
                questions={child.questions}
                selectedQuestionIds={selectedQuestionIds}
                onToggleQuestion={onToggleQuestion}
              />
              {child.children.map((grandchild) => (
                <SurveySectionCard
                  key={grandchild.id}
                  section={grandchild}
                  selectedQuestionIds={selectedQuestionIds}
                  onToggleQuestion={onToggleQuestion}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function QuestionList({
  questions,
  selectedQuestionIds,
  onToggleQuestion,
}: {
  questions: SectionWithQuestions["questions"];
  selectedQuestionIds: string[];
  onToggleQuestion: (questionId: string) => void;
}) {
  return questions.map((question) => {
    const checked = selectedQuestionIds.includes(question.id);
    return (
      <label
        key={question.id}
        className="flex cursor-pointer gap-3 rounded-[1.5rem] border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.56)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]"
      >
        <input
          checked={checked}
          onChange={() => onToggleQuestion(question.id)}
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-[color:rgba(22,37,29,0.24)] text-[var(--atlas-coral)]"
        />
        <span className="flex-1">
          <span className="block font-extrabold text-[var(--atlas-ink)]">{question.label}</span>
          {question.help_text ? (
            <span className="mt-1 block text-sm text-[color:rgba(22,37,29,0.58)]">{question.help_text}</span>
          ) : null}
          <span className="mt-1 inline-flex text-xs font-semibold text-amber-700">
            Nilai ketidaksesuaian: {Number(question.weight)}
          </span>
        </span>
      </label>
    );
  });
}
