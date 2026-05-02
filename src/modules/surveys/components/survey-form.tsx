"use client";

import { useMemo } from "react";
import { Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { SectionWithQuestions, TemplateDetail } from "@/lib/types";
import { calculateSurveyScore } from "@/modules/surveys/services/formula.service";
import { submitSurveyAction } from "@/modules/surveys/controllers/survey.controller";
import { useSurveyWizardStore } from "@/stores/survey-wizard.store";

export function SurveyForm({ template }: { template: TemplateDetail }) {
  const selectedQuestionIds = useSurveyWizardStore((state) => state.selectedQuestionIds);
  const toggleQuestion = useSurveyWizardStore((state) => state.toggleQuestion);
  const questions = useMemo(() => flattenQuestions(template.sections), [template]);
  const result = calculateSurveyScore(questions, selectedQuestionIds, template.formula);
  const progress = questions.length ? (selectedQuestionIds.length / questions.length) * 100 : 0;

  return (
    <form action={submitSurveyAction} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="templateId" value={template.id} />
      {selectedQuestionIds.map((questionId) => (
        <input key={questionId} type="hidden" name="nonconformities" value={questionId} />
      ))}
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Identitas MSME/TPP</CardTitle>
            <CardDescription>Isi data usaha yang sedang disurvei.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nama usaha</Label>
              <Input id="businessName" name="businessName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Nama pemilik</Label>
              <Input id="ownerName" name="ownerName" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea id="address" name="address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
        </Card>
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
              Upload foto bukti bisa ditambahkan saat integrasi storage production; catatan tersimpan sekarang.
            </CardDescription>
          </CardHeader>
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            <Camera className="mx-auto mb-2 h-6 w-6" />
            Komponen upload disiapkan untuk bucket survey-evidence.
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="notes">Catatan surveyor</Label>
            <Textarea id="notes" name="notes" />
          </div>
        </Card>
      </div>
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle>Hasil sementara</CardTitle>
            <CardDescription>{template.name}</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Progress value={progress} />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Ketidaksesuaian</p>
                <p className="text-2xl font-bold">{result.totalNonconformity}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Skor</p>
                <p className="text-2xl font-bold text-emerald-700">{result.score}</p>
              </div>
            </div>
            <p className="rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-slate-800">
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
          <div key={child.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <h3 className="font-semibold text-slate-950">{child.title}</h3>
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
        className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
      >
        <input
          checked={checked}
          onChange={() => onToggleQuestion(question.id)}
          type="checkbox"
          className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600"
        />
        <span className="flex-1">
          <span className="block font-medium text-slate-900">{question.label}</span>
          {question.help_text ? (
            <span className="mt-1 block text-sm text-slate-500">{question.help_text}</span>
          ) : null}
          <span className="mt-1 inline-flex text-xs font-semibold text-amber-700">
            Nilai ketidaksesuaian: {Number(question.weight)}
          </span>
        </span>
      </label>
    );
  });
}

function flattenQuestions(sections: SectionWithQuestions[]): SectionWithQuestions["questions"] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenQuestions(section.children),
  ]);
}
