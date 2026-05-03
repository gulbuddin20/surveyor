import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateIdentityField } from "@/lib/types";

export function IdentityFieldsCard({ fields }: { fields: TemplateIdentityField[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identitas MSME/TPP</CardTitle>
        <CardDescription>Isi data usaha sesuai formulir IKL untuk jenis UMKM ini.</CardDescription>
      </CardHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <IdentityFieldControl key={field.id} field={field} />
        ))}
      </div>
    </Card>
  );
}

function IdentityFieldControl({ field }: { field: TemplateIdentityField }) {
  const id = `identity-${field.field_key}`;
  const name = `identity.${field.field_key}`;
  const commonProps = {
    id,
    name,
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
          className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white/95 px-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
