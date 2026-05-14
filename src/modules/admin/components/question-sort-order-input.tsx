"use client";

import { Input } from "@/components/ui/input";
import { useQuestionPlacement } from "@/modules/admin/components/question-sortable-scope";

export function QuestionSortOrderInput({
  initialSortOrder,
  questionId,
}: {
  initialSortOrder: number;
  questionId: string;
}) {
  const placement = useQuestionPlacement(questionId);
  const sortOrder = placement?.sortOrder ?? initialSortOrder;

  return (
    <Input
      key={sortOrder}
      name="sortOrder"
      type="number"
      defaultValue={sortOrder}
    />
  );
}
