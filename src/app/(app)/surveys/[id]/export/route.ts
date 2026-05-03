import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getSurveyResultData } from "@/modules/surveys/services/survey.service";
import { formatDate, formatNumber } from "@/lib/utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const { detail } = await getSurveyResultData(profile, id);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = 44;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("FORMULIR INSPEKSI KESEHATAN LINGKUNGAN", pageWidth / 2, y, { align: "center" });
  y += 18;
  pdf.setFontSize(12);
  pdf.text(detail.template.name.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 24;

  y = sectionTitle(pdf, "Identitas MSME/TPP", y);
  const identityRows = Object.entries(detail.subject.metadata);
  for (const [key, value] of identityRows) {
    y = ensureSpace(pdf, y, 36);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(labelize(key), margin, y);
    pdf.setFont("helvetica", "normal");
    y = writeWrapped(pdf, String(value || "-"), margin + 190, y, 320, 10);
    y += 8;
  }

  y += 8;
  y = sectionTitle(pdf, "Hasil Inspeksi", y);
  const scoreRows = [
    ["Total ketidaksesuaian", formatNumber(Number(detail.response.total_nonconformity))],
    ["Skor", formatNumber(Number(detail.response.score))],
    ["Kesimpulan", detail.response.result_label],
    ["Tanggal submit", formatDate(detail.response.submitted_at)],
  ];
  for (const [label, value] of scoreRows) {
    y = writeLine(pdf, label, value, y);
  }

  y += 8;
  y = sectionTitle(pdf, "Kriteria Tidak Terpenuhi", y);
  if (detail.answers.length === 0) {
    y = writeWrapped(pdf, "Tidak ada ketidaksesuaian dicatat.", margin, y, pageWidth - margin * 2, 10) + 8;
  }
  detail.answers.forEach((answer, index) => {
    y = ensureSpace(pdf, y, 54);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(`${index + 1}. Bobot ${formatNumber(Number(answer.score))}`, margin, y);
    pdf.setFont("helvetica", "normal");
    y = writeWrapped(pdf, answer.survey_questions?.label ?? "Pertanyaan", margin + 90, y, pageWidth - margin * 2 - 90, 10);
    y += 8;
  });

  y += 8;
  y = sectionTitle(pdf, "Catatan dan Rekomendasi", y);
  y = writeLine(pdf, "Catatan / kritik / saran", detail.response.notes || "-", y);
  y = writeLine(pdf, "Rekomendasi tindak lanjut", detail.response.recommendation_notes || "-", y);

  y += 8;
  y = sectionTitle(pdf, "Foto Bukti", y);
  if (detail.photos.length === 0) {
    y = writeWrapped(pdf, "Tidak ada foto bukti diunggah.", margin, y, pageWidth - margin * 2, 10) + 8;
  }
  detail.photos.forEach((photo, index) => {
    y = writeLine(pdf, `Foto ${index + 1}`, `${photo.file_name ?? "Foto bukti"} — ${photo.caption ?? "Tanpa keterangan"}`, y);
  });

  y = ensureSpace(pdf, y + 28, 90);
  pdf.setFont("helvetica", "normal");
  pdf.text("TTD Petugas Pemeriksa", margin, y);
  pdf.text("Tanda Tangan Pengelola/Pemilik TPP", pageWidth - margin, y, { align: "right" });
  y += 64;
  pdf.line(margin, y, margin + 160, y);
  pdf.line(pageWidth - margin - 160, y, pageWidth - margin, y);

  const bytes = Buffer.from(pdf.output("arraybuffer"));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="survei-${id}.pdf"`,
    },
  });
}

function sectionTitle(pdf: jsPDF, title: string, y: number) {
  y = ensureSpace(pdf, y, 36);
  pdf.setFillColor(236, 253, 245);
  pdf.rect(40, y - 14, pdf.internal.pageSize.getWidth() - 80, 22, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(title, 48, y);
  return y + 24;
}

function writeLine(pdf: jsPDF, label: string, value: string, y: number) {
  y = ensureSpace(pdf, y, 32);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(label, 40, y);
  pdf.setFont("helvetica", "normal");
  return writeWrapped(pdf, value, 210, y, 340, 10) + 8;
}

function writeWrapped(pdf: jsPDF, text: string, x: number, y: number, width: number, lineHeight: number) {
  const lines = pdf.splitTextToSize(text, width) as string[];
  lines.forEach((line, index) => {
    y = ensureSpace(pdf, y, lineHeight + 8);
    pdf.text(line, x, y + index * lineHeight);
  });
  return y + Math.max(lines.length - 1, 0) * lineHeight;
}

function ensureSpace(pdf: jsPDF, y: number, needed: number) {
  if (y + needed < pdf.internal.pageSize.getHeight() - 40) return y;
  pdf.addPage();
  return 44;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
