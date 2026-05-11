import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateIdentityField } from "@/lib/types";

export function IdentityFieldsCard({
  fields,
  values = {},
}: {
  fields: TemplateIdentityField[];
  values?: Record<string, unknown>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identitas MSME/TPP</CardTitle>
        <CardDescription>Isi data usaha sesuai formulir IKL untuk jenis UMKM ini.</CardDescription>
      </CardHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <IdentityFieldControl key={field.id} field={field} value={values[field.field_key]} />
        ))}
      </div>
    </Card>
  );
}

function IdentityFieldControl({ field, value }: { field: TemplateIdentityField; value?: unknown }) {
  const id = `identity-${field.field_key}`;
  const name = `identity.${field.field_key}`;
  const commonProps = {
    id,
    name,
    defaultValue: typeof value === "string" ? value : "",
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
        <select
          {...commonProps}
          className="atlas-select"
        >
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
