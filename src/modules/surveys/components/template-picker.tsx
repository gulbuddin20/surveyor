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
          <Card className="group h-full overflow-hidden hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{template.name}</CardTitle>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--atlas-jungle)] text-[var(--atlas-paper)] transition group-hover:rotate-[-6deg] group-hover:bg-[var(--atlas-coral)]">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>Denominator {Number(template.denominator)}</Badge>
              <Badge className="bg-[color:rgba(22,37,29,0.08)] text-[var(--atlas-ink)]">Lulus {Number(template.passing_score)}</Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
