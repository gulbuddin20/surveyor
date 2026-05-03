import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionType, SectionWithQuestions, SurveyQuestion, SurveySection, SurveyTemplate, TemplateAdminDetail } from "@/lib/types";
import {
  createTemplateAction,
  deleteQuestionAction,
  deleteSectionAction,
  saveQuestionAction,
  saveSectionAction,
} from "@/modules/admin/controllers/admin.controller";
import { countQuestions } from "@/modules/surveys/services/formula.service";

const questionTypes: QuestionType[] = [
  "checkbox",
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "radio",
  "photo",
];

export function TemplateManagement({
  templates,
  detail,
}: {
  templates: SurveyTemplate[];
  detail: TemplateAdminDetail | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-emerald-700">Admin template</p>
        <h1 className="text-3xl font-bold text-slate-950">Template, bagian, dan butir IKL</h1>
        <p className="mt-1 max-w-3xl text-slate-500">
          Kelola struktur bertingkat seperti formulir Food Truck: bagian, subbagian, pertanyaan, tipe input, dan bobot ketidaksesuaian.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Template baru</CardTitle>
              <CardDescription>Buat jenis formulir IKL baru.</CardDescription>
            </CardHeader>
            <form action={createTemplateAction} className="space-y-4">
              <Input name="code" placeholder="kode-template" required />
              <Input name="name" placeholder="Nama template" required />
              <Textarea name="description" placeholder="Deskripsi" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Denominator</Label>
                  <Input name="denominator" type="number" defaultValue={100} required />
                </div>
                <div className="space-y-2">
                  <Label>Passing score</Label>
                  <Input name="passingScore" type="number" defaultValue={80} required />
                </div>
              </div>
              <select name="status" className="h-11 w-full rounded-xl border border-slate-200 px-3">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <Button type="submit" className="w-full">Simpan template</Button>
            </form>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Daftar template</CardTitle>
              <CardDescription>Pilih template untuk mengedit bagian dan pertanyaan.</CardDescription>
            </CardHeader>
            <div className="space-y-2">
              {templates.map((template) => {
                const active = detail?.id === template.id;
                return (
                  <Link
                    href={`/admin/templates?template=${template.id}`}
                    key={template.id}
                    className={`block rounded-2xl border p-3 transition ${
                      active ? "border-emerald-300 bg-emerald-50" : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold text-slate-950">{template.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{template.status}</Badge>
                      <Badge className="bg-slate-100 text-slate-700">/{Number(template.denominator)}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
        {detail ? <TemplateEditor detail={detail} /> : <EmptyTemplateState />}
      </div>
    </div>
  );
}

function EmptyTemplateState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Belum ada template</CardTitle>
        <CardDescription>Buat template terlebih dahulu sebelum menambah bagian dan pertanyaan.</CardDescription>
      </CardHeader>
    </Card>
  );
}

function TemplateEditor({ detail }: { detail: TemplateAdminDetail }) {
  const questions = countQuestions(detail.sections);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{detail.name}</CardTitle>
          <CardDescription>{detail.description}</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge>{detail.status}</Badge>
          <Badge className="bg-slate-100 text-slate-700">{detail.sections.length} bagian utama</Badge>
          <Badge className="bg-slate-100 text-slate-700">{questions} pertanyaan</Badge>
          <Badge className="bg-slate-100 text-slate-700">Denominator {Number(detail.denominator)}</Badge>
        </div>
      </Card>
      <SectionForm templateId={detail.id} sections={detail.flatSections} />
      <QuestionForm templateId={detail.id} sections={detail.flatSections} />
      <div className="space-y-4">
        {detail.sections.map((section) => (
          <SectionEditor key={section.id} templateId={detail.id} section={section} sections={detail.flatSections} />
        ))}
      </div>
    </div>
  );
}

function SectionEditor({
  templateId,
  section,
  sections,
  depth = 0,
}: {
  templateId: string;
  section: SectionWithQuestions;
  sections: SurveySection[];
  depth?: number;
}) {
  return (
    <Card className={depth ? "border-slate-200 bg-slate-50/60" : undefined}>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 lg:flex-row">
          <div>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>
              {section.questions.length} pertanyaan langsung · {section.children.length} subbagian
            </CardDescription>
          </div>
          <Badge className={section.is_active ? undefined : "bg-slate-100 text-slate-700"}>
            {section.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </CardHeader>
      <div className="space-y-4">
        <SectionForm templateId={templateId} section={section} sections={sections} />
        <form action={deleteSectionAction}>
          <input type="hidden" name="sectionId" value={section.id} />
          <Button type="submit" variant="outline" size="sm">Hapus bagian</Button>
        </form>
        <QuestionForm templateId={templateId} sections={sections} sectionId={section.id} />
        <div className="space-y-3">
          {section.questions.map((question) => (
            <QuestionEditor key={question.id} templateId={templateId} question={question} sections={sections} />
          ))}
        </div>
        {section.children.length ? (
          <div className="space-y-4 border-l-2 border-slate-200 pl-4">
            {section.children.map((child) => (
              <SectionEditor
                key={child.id}
                templateId={templateId}
                section={child}
                sections={sections}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SectionForm({
  templateId,
  section,
  sections,
}: {
  templateId: string;
  section?: SurveySection;
  sections: SurveySection[];
}) {
  return (
    <form action={saveSectionAction} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_160px_120px_auto]">
      <input type="hidden" name="templateId" value={templateId} />
      {section ? <input type="hidden" name="sectionId" value={section.id} /> : null}
      <div className="space-y-2">
        <Label>Judul bagian</Label>
        <Input name="title" defaultValue={section?.title} placeholder="Contoh: Inspeksi Area Dapur" required />
      </div>
      <div className="space-y-2">
        <Label>Induk</Label>
        <select
          name="parentId"
          defaultValue={section?.parent_id ?? ""}
          className="h-11 w-full rounded-xl border border-slate-200 px-3"
        >
          <option value="">Bagian utama</option>
          {sections.map((item) => (
            <option key={item.id} value={item.id} disabled={item.id === section?.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Urutan</Label>
        <Input name="sortOrder" type="number" defaultValue={section?.sort_order ?? 0} />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input name="isActive" type="checkbox" defaultChecked={section?.is_active ?? true} /> Aktif
        </label>
        <Button type="submit">{section ? "Update" : "Tambah"}</Button>
      </div>
    </form>
  );
}

function QuestionEditor({
  templateId,
  question,
  sections,
}: {
  templateId: string;
  question: SurveyQuestion;
  sections: SurveySection[];
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">{question.label}</p>
          {question.help_text ? <p className="mt-1 text-sm text-slate-500">{question.help_text}</p> : null}
        </div>
        <div className="flex gap-2">
          <Badge>Bobot {Number(question.weight)}</Badge>
          <Badge className={question.is_active ? undefined : "bg-slate-100 text-slate-700"}>
            {question.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <QuestionForm templateId={templateId} question={question} sections={sections} />
      <form action={deleteQuestionAction} className="mt-3">
        <input type="hidden" name="questionId" value={question.id} />
        <Button type="submit" variant="outline" size="sm">Hapus pertanyaan</Button>
      </form>
    </div>
  );
}

function QuestionForm({
  templateId,
  question,
  sections,
  sectionId,
}: {
  templateId: string;
  question?: SurveyQuestion;
  sections: SurveySection[];
  sectionId?: string;
}) {
  return (
    <form action={saveQuestionAction} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <input type="hidden" name="templateId" value={templateId} />
      {question ? <input type="hidden" name="questionId" value={question.id} /> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px_120px]">
        <div className="space-y-2">
          <Label>Butir pertanyaan/kriteria</Label>
          <Textarea name="label" defaultValue={question?.label} required />
        </div>
        <div className="space-y-2">
          <Label>Bagian</Label>
          <select
            name="sectionId"
            defaultValue={question?.section_id ?? sectionId ?? ""}
            className="h-11 w-full rounded-xl border border-slate-200 px-3"
          >
            <option value="">Tanpa bagian</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Tipe</Label>
          <select
            name="questionType"
            defaultValue={question?.question_type ?? "checkbox"}
            className="h-11 w-full rounded-xl border border-slate-200 px-3"
          >
            {questionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Bobot/skor</Label>
          <Input name="weight" type="number" step="0.01" defaultValue={question?.weight ?? 1} required />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_120px_auto]">
        <div className="space-y-2">
          <Label>Bantuan/catatan</Label>
          <Input name="helpText" defaultValue={question?.help_text ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Urutan</Label>
          <Input name="sortOrder" type="number" defaultValue={question?.sort_order ?? 0} />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input name="isRequired" type="checkbox" defaultChecked={question?.is_required ?? false} /> Wajib
          </label>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" defaultChecked={question?.is_active ?? true} /> Aktif
          </label>
          <Button type="submit" className="w-full sm:w-auto">{question ? "Update" : "Tambah pertanyaan"}</Button>
        </div>
      </div>
    </form>
  );
}
