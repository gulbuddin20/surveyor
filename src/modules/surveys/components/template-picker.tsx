import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyTemplate } from "@/lib/types";

export function TemplatePicker({ templates }: { templates: SurveyTemplate[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Link key={template.id} href={`/surveys/new?template=${template.id}`}>
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{template.name}</CardTitle>
                <ArrowRight className="h-5 w-5 text-emerald-600" />
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>Denominator {Number(template.denominator)}</Badge>
              <Badge className="bg-slate-100 text-slate-700">Lulus {Number(template.passing_score)}</Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
