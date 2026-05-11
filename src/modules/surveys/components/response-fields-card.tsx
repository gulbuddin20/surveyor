import { Camera } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateResponseField } from "@/lib/types";

export function ResponseFieldsCard({
  fields,
  values = {},
}: {
  fields: TemplateResponseField[];
  values?: Record<string, unknown>;
}) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field setelah kuesioner</CardTitle>
        <CardDescription>Isi field tambahan sesuai konfigurasi template.</CardDescription>
      </CardHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <ResponseFieldControl key={field.id} field={field} value={values[field.field_key]} />
        ))}
      </div>
    </Card>
  );
}

function ResponseFieldControl({ field, value }: { field: TemplateResponseField; value?: unknown }) {
  const id = `response-${field.field_key}`;
  const name = `response.${field.field_key}`;
  const defaultValue = typeof value === "string" ? value : "";

  if (field.field_type === "photo") {
    const maxSizeMb = typeof field.settings?.max_size_mb === "number" ? field.settings.max_size_mb : 10;
    return (
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={id}>
          {field.label}
          {field.is_required ? <span className="text-red-600"> *</span> : null}
        </Label>
        <label className="block cursor-pointer rounded-[1.5rem] border border-dashed border-[color:rgba(22,37,29,0.2)] bg-[color:rgba(255,249,234,0.38)] p-5 text-center text-sm text-[color:rgba(22,37,29,0.58)] transition hover:border-[var(--atlas-coral)] hover:bg-[var(--atlas-paper)]">
          <Camera className="mx-auto mb-2 h-6 w-6" />
          <span className="block font-extrabold text-[var(--atlas-ink)]">{field.label}</span>
          <span>{field.placeholder ?? `JPG, PNG, atau WebP. Maksimal ${maxSizeMb} MB per file.`}</span>
          <input
            id={id}
            name={`responseFiles.${field.field_key}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
          />
        </label>
      </div>
    );
  }

  const commonProps = {
    id,
    name,
    defaultValue,
    required: field.is_required,
    placeholder: field.placeholder ?? undefined,
  };

  return (
    <div className={`space-y-2 ${field.field_type === "textarea" ? "md:col-span-2" : ""}`}>
      <Label htmlFor={id}>
        {field.label}
        {field.is_required ? <span className="text-red-600"> *</span> : null}
      </Label>
      {field.field_type === "textarea" ? <Textarea {...commonProps} /> : null}
      {field.field_type === "select" ? (
        <select {...commonProps} className="atlas-select">
          <option value="">Pilih {field.label}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {!["textarea", "select"].includes(field.field_type) ? (
        <Input {...commonProps} type={field.field_type} />
      ) : null}
    </div>
  );
}
