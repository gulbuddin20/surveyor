import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { SurveyPhoto } from "@/lib/types";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getSurveyResultData } from "@/modules/surveys/services/survey.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  for (const [index, photo] of detail.photos.entries()) {
    y = await writePhotoEvidence(pdf, photo, index, y);
  }

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
  lines.forEach((line) => {
    y = ensureSpace(pdf, y, lineHeight + 8);
    pdf.text(line, x, y);
    y += lineHeight;
  });
  return y - lineHeight;
}

function ensureSpace(pdf: jsPDF, y: number, needed: number) {
  if (y + needed < pdf.internal.pageSize.getHeight() - 40) return y;
  pdf.addPage();
  return 44;
}

function labelize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function writePhotoEvidence(pdf: jsPDF, photo: SurveyPhoto, index: number, y: number) {
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const imageWidth = 180;
  const imageHeight = 120;
  const caption = photo.caption ?? "Tanpa keterangan";
  const metaX = margin + imageWidth + 16;
  const metaWidth = maxWidth - imageWidth - 16;
  const captionLineHeight = 10;
  const captionLines = pdf.splitTextToSize(caption, metaWidth) as string[];
  const captionHeight = Math.max(captionLineHeight, captionLines.length * captionLineHeight);
  y = ensureSpace(pdf, y, Math.max(imageHeight, captionHeight) + 30);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(`Foto ${index + 1}`, margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(photo.file_name ?? "Foto bukti", margin + 60, y);
  y += 12;

  const image = await getPhotoImageData(photo);
  if (image) {
    try {
      pdf.addImage(image.dataUrl, image.format, margin, y, imageWidth, imageHeight, undefined, "FAST");
    } catch {
      pdf.rect(margin, y, imageWidth, imageHeight);
      pdf.text("Foto tidak dapat dimuat ke PDF.", margin + 10, y + 18);
    }
  } else {
    pdf.rect(margin, y, imageWidth, imageHeight);
    pdf.text("Foto tidak dapat dimuat ke PDF.", margin + 10, y + 18);
  }

  const imageBottom = y + imageHeight;
  pdf.text(captionLines, metaX, y + 10);
  const captionBottom = y + 10 + captionHeight;
  return Math.max(imageBottom, captionBottom) + 18;
}

async function getPhotoImageData(photo: SurveyPhoto): Promise<{ dataUrl: string; format: "JPEG" | "PNG" | "WEBP" } | null> {
  const format = getImageFormat(photo.mime_type, photo.file_name);
  if (!format) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("survey-evidence").download(photo.storage_path);
  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const mimeType = photo.mime_type ?? mimeTypeForFormat(format);
  return {
    dataUrl: `data:${mimeType};base64,${buffer.toString("base64")}`,
    format,
  };
}

function getImageFormat(mimeType: string | null, fileName: string | null): "JPEG" | "PNG" | "WEBP" | null {
  const value = `${mimeType ?? ""} ${fileName ?? ""}`.toLowerCase();
  if (value.includes("jpeg") || value.includes("jpg")) return "JPEG";
  if (value.includes("png")) return "PNG";
  if (value.includes("webp")) return "WEBP";
  return null;
}

function mimeTypeForFormat(format: "JPEG" | "PNG" | "WEBP") {
  if (format === "JPEG") return "image/jpeg";
  if (format === "PNG") return "image/png";
  return "image/webp";
}
