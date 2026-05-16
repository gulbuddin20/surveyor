import { NextResponse } from "next/server";
import { requireProfile } from "@/modules/auth/services/auth.service";
import { getTemplateDetail } from "@/modules/surveys/repositories/survey.repository";
import { createDirectUploadGrant } from "@/modules/surveys/services/upload-token.service";

export async function POST(request: Request) {
  const profile = await requireProfile();
  const body = await request.json().catch(() => null) as {
    templateId?: string;
    fieldKey?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    totalFiles?: number;
  } | null;

  const templateId = String(body?.templateId ?? "");
  const fieldKey = String(body?.fieldKey ?? "");
  const fileName = String(body?.fileName ?? "");
  const mimeType = String(body?.mimeType ?? "");
  const fileSizeBytes = Number(body?.fileSizeBytes ?? 0);
  const totalFiles = Number(body?.totalFiles ?? 1);

  if (!templateId || !fieldKey || !fileName || !mimeType || !Number.isFinite(fileSizeBytes)) {
    return NextResponse.json({ ok: false, message: "Payload upload tidak valid" }, { status: 400 });
  }

  const template = await getTemplateDetail(templateId);
  if (!template) return NextResponse.json({ ok: false, message: "Template tidak ditemukan" }, { status: 404 });
  const grant = createDirectUploadGrant(profile, {
    fieldKey,
    fileName,
    fileSizeBytes,
    mimeType,
    template,
    totalFiles,
  });
  if (!grant.ok) return NextResponse.json({ ok: false, message: grant.message }, { status: grant.status });

  return NextResponse.json({
    ok: true,
    uploadUrl: grant.uploadUrl,
    token: grant.token,
  });
}
