"use client";

import { Eraser, PenLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type SignaturePayload = {
  dataUrl?: string;
  storagePath?: string;
  signedAt?: string;
  sha256?: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

type SignatureFieldProps = {
  id: string;
  name: string;
  label: string;
  placeholder?: string | null;
  required?: boolean;
  value?: unknown;
};

export function SignatureField({ id, name, label, placeholder, required = false, value }: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const initialSignature = useMemo(() => parseSignatureValue(value), [value]);
  const initialDataUrl = initialSignature?.dataUrl ?? "";
  const [fieldValue, setFieldValue] = useState(() => {
    const parsed = parseSignatureValue(value);
    return parsed ? JSON.stringify(parsed) : "";
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signaturePad = new SignaturePad(canvas, {
      backgroundColor: "rgba(255, 249, 234, 0)",
      penColor: "rgb(18, 63, 49)",
      minWidth: 0.8,
      maxWidth: 2.4,
      throttle: 8,
    });
    padRef.current = signaturePad;

    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      const context = canvas.getContext("2d");
      context?.scale(ratio, ratio);
      signaturePad.clear();
      if (initialDataUrl) {
        signaturePad.fromDataURL(initialDataUrl, {
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const saveSignature = () => {
      if (signaturePad.isEmpty()) {
        setFieldValue("");
        return;
      }
      const payload: SignaturePayload = {
        dataUrl: signaturePad.toDataURL("image/png"),
        signedAt: new Date().toISOString(),
      };
      setFieldValue(JSON.stringify(payload));
    };

    resizeCanvas();
    signaturePad.addEventListener("endStroke", saveSignature);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      signaturePad.removeEventListener("endStroke", saveSignature);
      window.removeEventListener("resize", resizeCanvas);
      signaturePad.off();
      padRef.current = null;
    };
  }, [initialDataUrl]);

  const clearSignature = () => {
    padRef.current?.clear();
    setFieldValue("");
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
          <Eraser className="h-4 w-4" />
          Hapus tanda tangan
        </Button>
      </div>
      <input id={id} name={name} type="hidden" value={fieldValue} required={required} readOnly />
      <div className="rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.22)] bg-[color:rgba(255,249,234,0.48)] p-3 shadow-inner">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[color:rgba(22,37,29,0.46)]">
          <PenLine className="h-4 w-4" />
          Area tanda tangan
        </div>
        <canvas
          ref={canvasRef}
          className="block h-52 w-full touch-none rounded-[1.1rem] bg-[color:rgba(255,255,255,0.42)]"
          aria-label={label}
        />
        <p className="mt-2 text-xs leading-5 text-[color:rgba(22,37,29,0.58)]">
          {placeholder ?? "Tanda tangani langsung menggunakan layar sentuh, stylus, atau mouse."}
        </p>
        {initialSignature?.storagePath && !fieldValue.startsWith("{\"dataUrl\"") ? (
          <p className="mt-2 rounded-xl bg-[color:rgba(121,168,77,0.12)] px-3 py-2 text-xs font-bold text-[var(--atlas-canopy)]">
            Tanda tangan tersimpan. Tanda tangan baru akan mengganti file lama saat survei disimpan.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function parseSignatureValue(value: unknown): SignaturePayload | null {
  const parsed = typeof value === "string" ? safeParseJson(value) : value;
  if (!parsed || typeof parsed !== "object") return null;
  const storagePath = "storagePath" in parsed ? parsed.storagePath : null;
  if (typeof storagePath === "string" && storagePath.trim()) {
    const dataUrl = "dataUrl" in parsed ? parsed.dataUrl : null;
    return {
      storagePath,
      dataUrl: typeof dataUrl === "string" && dataUrl.startsWith("data:image/") ? dataUrl : undefined,
      signedAt: "signedAt" in parsed && typeof parsed.signedAt === "string" ? parsed.signedAt : undefined,
      sha256: "sha256" in parsed && typeof parsed.sha256 === "string" ? parsed.sha256 : undefined,
      mimeType: "mimeType" in parsed && typeof parsed.mimeType === "string" ? parsed.mimeType : undefined,
      fileSizeBytes: "fileSizeBytes" in parsed && typeof parsed.fileSizeBytes === "number" ? parsed.fileSizeBytes : undefined,
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
