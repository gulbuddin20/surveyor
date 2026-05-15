import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateResponseField } from "@/lib/types";
import { PhotoUploadField } from "@/modules/surveys/components/photo-upload-field";
import { SignatureField } from "@/modules/surveys/components/signature-field";

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
      <PhotoUploadField
        id={id}
        name={`responseFiles.${field.field_key}`}
        label={field.label}
        placeholder={field.placeholder}
        required={field.is_required}
        maxSizeMb={maxSizeMb}
      />
    );
  }

  if (field.field_type === "signature") {
    return (
      <SignatureField
        id={id}
        name={name}
        label={field.label}
        placeholder={field.placeholder}
        required={field.is_required}
        value={value}
      />
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
