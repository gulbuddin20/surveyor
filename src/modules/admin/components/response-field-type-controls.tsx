"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateResponseFieldType } from "@/lib/types";

type ResponseFieldTypeControlsProps = {
  defaultType?: TemplateResponseFieldType;
  maxSizeMb: number;
  options: string[];
};

const fieldTypes: TemplateResponseFieldType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "select",
  "photo",
  "signature",
];

export function ResponseFieldTypeControls({
  defaultType = "textarea",
  maxSizeMb,
  options,
}: ResponseFieldTypeControlsProps) {
  const [fieldType, setFieldType] = useState<TemplateResponseFieldType>(defaultType);

  return (
    <>
      <div className="space-y-2 lg:col-span-2">
        <Label>Tipe</Label>
        <select
          name="fieldType"
          value={fieldType}
          className="atlas-select"
          onChange={(event) => setFieldType(event.target.value as TemplateResponseFieldType)}
        >
          {fieldTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {fieldType === "select" ? (
        <div className="space-y-2 lg:col-span-6">
          <Label>Opsi select</Label>
          <Textarea
            name="optionsText"
            defaultValue={options.join("\n")}
            placeholder="Satu opsi per baris"
          />
        </div>
      ) : null}

      {fieldType === "photo" ? (
        <div className="space-y-2 lg:col-span-2">
          <Label>Max foto (MB)</Label>
          <Input name="maxSizeMb" type="number" min={1} max={25} defaultValue={maxSizeMb} />
        </div>
      ) : null}
    </>
  );
}
