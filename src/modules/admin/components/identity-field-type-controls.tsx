"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IdentityFieldType } from "@/lib/types";

type IdentityFieldTypeControlsProps = {
  defaultType?: IdentityFieldType;
  options: string[];
};

const fieldTypes: IdentityFieldType[] = ["text", "textarea", "number", "date", "time", "select"];

export function IdentityFieldTypeControls({ defaultType = "text", options }: IdentityFieldTypeControlsProps) {
  const [fieldType, setFieldType] = useState<IdentityFieldType>(defaultType);

  return (
    <>
      <div className="space-y-2 lg:col-span-2">
        <Label>Tipe</Label>
        <select
          name="fieldType"
          value={fieldType}
          className="atlas-select"
          onChange={(event) => setFieldType(event.target.value as IdentityFieldType)}
        >
          {fieldTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {fieldType === "select" ? (
        <div className="space-y-2 lg:col-span-8">
          <Label>Opsi select</Label>
          <Textarea
            name="optionsText"
            defaultValue={options.join("\n")}
            placeholder="Satu opsi per baris"
          />
        </div>
      ) : null}
    </>
  );
}
