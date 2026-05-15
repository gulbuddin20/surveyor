import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { SurveyPhoto } from "@/lib/types";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getSurveyResultData } from "@/modules/surveys/services/survey.service";
import { formatDate, formatNumber } from "@/lib/utils";
import { downloadEvidenceFile } from "@/modules/surveys/repositories/evidence-storage";

const maxEmbeddedPhotoBytes = 8 * 1024 * 1024;
type SignatureValue = { dataUrl: string; signedAt?: string };
type StoredSignatureValue = { storagePath: string; signedAt?: string; mimeType?: string };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const { detail } = await getSurveyResultData(profile, id);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;
  let y = 44;

  y = writeCenteredHeading(pdf, "FORMULIR INSPEKSI KESEHATAN LINGKUNGAN", y, 14);
  y = writeCenteredHeading(pdf, detail.template.name.toUpperCase(), y, 12);
  y += 8;

  y = sectionTitle(pdf, "Identitas MSME/TPP", y);
  for (const field of detail.identityFields) {
    const value = detail.subject.metadata[field.field_key];
    y = writeLine(pdf, field.label, String(value || "-"), y);
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
  const responseFields = detail.responseFields.filter((field) => !["photo", "signature"].includes(field.field_type));
  if (responseFields.length) {
    y = sectionTitle(pdf, "Field Tambahan", y);
    for (const field of responseFields) {
      y = writeLine(pdf, field.label, String(detail.response.response_values?.[field.field_key] || "-"), y);
    }
    y += 8;
  }

  const photoFields = detail.responseFields.filter((field) => field.field_type === "photo");
  if (photoFields.length || detail.photos.length) {
    y = sectionTitle(pdf, "Foto Bukti", y);
    if (detail.photos.length === 0) {
      y = writeWrapped(pdf, "Tidak ada foto bukti diunggah.", margin, y, pageWidth - margin * 2, 10) + 8;
    }
    const photoFieldLabels = new Map(detail.responseFields.map((field) => [field.field_key, field.label]));
    const photoEvidence = await Promise.all(detail.photos.map(async (photo, index) => ({
      photo,
      index,
      image: await getPhotoImageData(photo),
      fieldLabel: photoFieldLabels.get(photo.field_key ?? "") ?? "Foto bukti",
    })));
    for (const item of photoEvidence) {
      y = writePhotoEvidence(pdf, item.photo, item.index, y, item.fieldLabel, item.image);
    }
  }

  const signatureFields = await Promise.all(
    detail.responseFields.filter((field) => field.field_type === "signature").map(async (field) => ({
      field,
      signature: await getSignatureImageData(detail.response.response_values?.[field.field_key]),
    })),
  );

  if (signatureFields.length) {
    y += 8;
    y = sectionTitle(pdf, "Tanda Tangan", y);
    y = writeSignatureTable(pdf, signatureFields, y);
  }

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

function writeCenteredHeading(pdf: jsPDF, text: string, y: number, fontSize: number) {
  y = ensureSpace(pdf, y, 44);
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, pageWidth - 120) as string[];
  pdf.text(lines, pageWidth / 2, y, { align: "center" });
  return y + lines.length * (fontSize + 4);
}

function writeLine(pdf: jsPDF, label: string, value: string, y: number) {
  const labelX = 40;
  const valueX = 210;
  const lineHeight = 10;
  const labelLines = pdf.splitTextToSize(label, 154) as string[];
  const valueLines = pdf.splitTextToSize(value, 340) as string[];
  const rowHeight = Math.max(labelLines.length, valueLines.length) * lineHeight + 8;
  y = ensureSpace(pdf, y, rowHeight + 8);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(labelLines, labelX, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(valueLines, valueX, y);
  return y + rowHeight;
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

function writePhotoEvidence(
  pdf: jsPDF,
  photo: SurveyPhoto,
  index: number,
  y: number,
  fieldLabel: string,
  image: { dataUrl: string; format: "JPEG" | "PNG" | "WEBP" } | null,
) {
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
  pdf.text(`${fieldLabel} ${index + 1}`, margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(photo.file_name ?? "Foto bukti", margin + 60, y);
  y += 12;

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

function writeSignatureTable(
  pdf: jsPDF,
  items: Array<{ field: { label: string }; signature: SignatureValue | null }>,
  y: number,
) {
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const tableWidth = pageWidth - margin * 2;
  const columnWidth = tableWidth / 2;
  const headerHeight = 34;
  const bodyHeight = 96;
  const rowHeight = headerHeight + bodyHeight;

  for (let index = 0; index < items.length; index += 2) {
    const rowItems = items.slice(index, index + 2);
    y = ensureSpace(pdf, y, rowHeight + 16);

    for (let column = 0; column < 2; column += 1) {
      const item = rowItems[column];
      const x = margin + column * columnWidth;
      pdf.rect(x, y, columnWidth, rowHeight);
      pdf.line(x, y + headerHeight, x + columnWidth, y + headerHeight);

      if (!item) continue;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      const labelLines = pdf.splitTextToSize(item.field.label, columnWidth - 18) as string[];
      const visibleLabelLines = labelLines.slice(0, 2);
      const labelStartY = y + 14 + (visibleLabelLines.length === 1 ? 6 : 0);
      pdf.text(visibleLabelLines, x + columnWidth / 2, labelStartY, {
        align: "center",
      });

      if (!item.signature) continue;

      const imageWidth = Math.min(170, columnWidth - 36);
      const imageHeight = 66;
      const imageX = x + (columnWidth - imageWidth) / 2;
      const imageY = y + headerHeight + 14;
      try {
        pdf.addImage(item.signature.dataUrl, "PNG", imageX, imageY, imageWidth, imageHeight, undefined, "FAST");
      } catch {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("Tanda tangan tidak dapat dimuat.", x + columnWidth / 2, imageY + 20, { align: "center" });
      }
    }

    y += rowHeight + 12;
  }

  return y;
}

async function getSignatureImageData(value: unknown): Promise<SignatureValue | null> {
  const parsed = parseSignatureValue(value);
  if (!parsed) return null;
  if ("dataUrl" in parsed) return parsed;

  const data = await downloadEvidenceFile(parsed.storagePath);
  if (!data) return null;
  if (data.size > maxEmbeddedPhotoBytes) return null;

  return {
    dataUrl: `data:${parsed.mimeType ?? data.mimeType ?? "image/png"};base64,${data.buffer.toString("base64")}`,
    signedAt: parsed.signedAt,
  };
}

function parseSignatureValue(value: unknown): SignatureValue | StoredSignatureValue | null {
  const parsed = typeof value === "string" ? safeParseJson(value) : value;
  if (!parsed || typeof parsed !== "object") return null;
  const storagePath = "storagePath" in parsed ? parsed.storagePath : null;
  if (typeof storagePath === "string" && storagePath.trim()) {
    return {
      storagePath,
      signedAt: "signedAt" in parsed && typeof parsed.signedAt === "string" ? parsed.signedAt : undefined,
      mimeType: "mimeType" in parsed && typeof parsed.mimeType === "string" ? parsed.mimeType : undefined,
    };
  }
  const dataUrl = "dataUrl" in parsed ? parsed.dataUrl : null;
  const signedAt = "signedAt" in parsed ? parsed.signedAt : null;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) return null;
  return {
    dataUrl,
    signedAt: typeof signedAt === "string" ? signedAt : undefined,
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function getPhotoImageData(photo: SurveyPhoto): Promise<{ dataUrl: string; format: "JPEG" | "PNG" | "WEBP" } | null> {
  const format = getImageFormat(photo.mime_type, photo.file_name);
  if (!format) return null;

  const data = await downloadEvidenceFile(photo.storage_path);
  if (!data) return null;
  if (data.size > maxEmbeddedPhotoBytes) return null;

  const mimeType = photo.mime_type ?? mimeTypeForFormat(format);
  return {
    dataUrl: `data:${mimeType};base64,${data.buffer.toString("base64")}`,
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
