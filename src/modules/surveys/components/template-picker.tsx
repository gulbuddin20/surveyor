import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SurveyTemplate } from "@/lib/types";

export function TemplatePicker({ templates }: { templates: SurveyTemplate[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Link key={template.id} href={`/surveys/new?template=${template.id}`} className="block focus:outline-none">
          <Card className="group h-full hover:-translate-y-1 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{template.name}</CardTitle>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                  <ArrowRight className="h-5 w-5" />
                </span>
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
