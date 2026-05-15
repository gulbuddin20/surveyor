import { SurveyForm } from "@/modules/surveys/components/survey-form";
import { loadSurveyEditController } from "@/modules/surveys/controllers/survey.controller";
import { downloadEvidenceFile } from "@/modules/surveys/repositories/evidence-storage";

export default async function EditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail, template } = await loadSurveyEditController(id);
  const initialPhotoPreviews = await Promise.all(detail.photos.map(async (photo) => {
    const data = await downloadEvidenceFile(photo.storage_path);
    return {
      id: photo.id,
      fieldKey: photo.field_key,
      fileName: photo.file_name,
      mimeType: photo.mime_type,
      fileSizeBytes: photo.file_size_bytes,
      storagePath: photo.storage_path,
      dataUrl: data ? `data:${photo.mime_type ?? data.mimeType};base64,${data.buffer.toString("base64")}` : null,
    };
  }));
  const hydratedResponseValues = { ...detail.response.response_values };
  await Promise.all(template.responseFields.filter((field) => field.field_type === "signature").map(async (field) => {
    const value = hydrateSignatureValue(detail.response.response_values[field.field_key]);
    if (!value?.storagePath) return;
    const data = await downloadEvidenceFile(value.storagePath);
    if (!data) return;
    hydratedResponseValues[field.field_key] = {
      ...value,
      dataUrl: `data:${value.mimeType ?? data.mimeType ?? "image/png"};base64,${data.buffer.toString("base64")}`,
    };
  }));
  const hydratedDetail = {
    ...detail,
    response: {
      ...detail.response,
      response_values: hydratedResponseValues,
    },
  };

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
      <SurveyForm template={template} mode="edit" initialDetail={hydratedDetail} initialPhotoPreviews={initialPhotoPreviews} />
    </div>
  );
}

function hydrateSignatureValue(value: unknown): { storagePath?: string; signedAt?: string; mimeType?: string } | null {
  const parsed = typeof value === "string" ? safeParseJson(value) : value;
  if (!parsed || typeof parsed !== "object") return null;
  return {
    storagePath: "storagePath" in parsed && typeof parsed.storagePath === "string" ? parsed.storagePath : undefined,
    signedAt: "signedAt" in parsed && typeof parsed.signedAt === "string" ? parsed.signedAt : undefined,
    mimeType: "mimeType" in parsed && typeof parsed.mimeType === "string" ? parsed.mimeType : undefined,
  };
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
