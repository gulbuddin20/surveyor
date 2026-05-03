"use client";

import { useEffect, useMemo } from "react";
import { Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { SectionWithQuestions, TemplateDetail } from "@/lib/types";
import { IdentityFieldsCard } from "@/modules/surveys/components/identity-fields-card";
import { calculateSurveyProgress, calculateSurveyScore, flattenQuestions } from "@/modules/surveys/services/formula.service";
import { submitSurveyAction } from "@/modules/surveys/controllers/survey.controller";
import { useSurveyWizardStore } from "@/stores/survey-wizard.store";

export function SurveyForm({ template }: { template: TemplateDetail }) {
  const selectedQuestionIds = useSurveyWizardStore((state) => state.selectedQuestionIds);
  const toggleQuestion = useSurveyWizardStore((state) => state.toggleQuestion);
  const reset = useSurveyWizardStore((state) => state.reset);
  const questions = useMemo(() => flattenQuestions(template.sections), [template]);
  const result = calculateSurveyScore(questions, selectedQuestionIds, {
    formula: template.formula,
    templateDenominator: template.denominator,
    templatePassingScore: template.passing_score,
  });
  const progress = calculateSurveyProgress(questions.length, selectedQuestionIds);

  useEffect(() => {
    reset();
  }, [reset, template.id]);

  return (
    <form action={submitSurveyAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="templateId" value={template.id} />
      {selectedQuestionIds.map((questionId) => (
        <input key={questionId} type="hidden" name="nonconformities" value={questionId} />
      ))}
      <div className="space-y-5">
        <IdentityFieldsCard fields={template.identityFields} />
        {template.sections.map((section) => (
          <SurveySectionCard
            key={section.id}
            section={section}
            selectedQuestionIds={selectedQuestionIds}
            onToggleQuestion={toggleQuestion}
          />
        ))}
        <Card>
          <CardHeader>
            <CardTitle>Foto bukti & catatan</CardTitle>
            <CardDescription>
              Upload foto bukti kunjungan. Maksimal {Number(template.photo_max_size_mb)} MB per file.
            </CardDescription>
          </CardHeader>
          <label className="block cursor-pointer rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.2)] bg-[color:rgba(255,249,234,0.38)] p-5 text-center text-sm text-[color:rgba(22,37,29,0.58)] transition hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]">
            <Camera className="mx-auto mb-2 h-6 w-6" />
            <span className="block font-extrabold text-[var(--atlas-ink)]">Pilih foto bukti</span>
            <span>JPG, PNG, atau WebP. Boleh lebih dari satu foto.</span>
            <input
              name="evidencePhotos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
            />
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan / kritik / saran</Label>
              <Textarea id="notes" name="notes" placeholder="Catatan temuan, kritik, atau saran pembinaan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendationNotes">Rekomendasi tindak lanjut</Label>
              <Textarea
                id="recommendationNotes"
                name="recommendationNotes"
                placeholder="Contoh: perbaiki fasilitas cuci tangan, lengkapi APD"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="photoCaption">Keterangan foto</Label>
            <Textarea id="photoCaption" name="photoCaption" placeholder="Keterangan umum untuk foto bukti" />
          </div>
        </Card>
      </div>
      <aside className="xl:sticky xl:top-24 xl:h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Hasil sementara</CardTitle>
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
            <Button className="w-full" type="submit">
              <Save className="h-4 w-4" />
              Simpan survei
            </Button>
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
