"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SortableAdminItem = {
  id: string;
  label: string;
  node: ReactNode;
};

type SortableAdminListProps = {
  items: SortableAdminItem[];
  empty?: ReactNode;
  className?: string;
  itemClassName?: string;
  reorderAction: (orderedIds: string[]) => Promise<void>;
};

const TOUCH_LONG_PRESS_MS = 2000;
const TOUCH_CANCEL_DISTANCE = 12;
const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "label",
  "select",
  "summary",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[data-no-card-drag]",
].join(",");

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function areOrdersEqual(left: SortableAdminItem[], right: SortableAdminItem[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

function canStartCardDrag(target: EventTarget | null) {
  return target instanceof Element && !target.closest(INTERACTIVE_SELECTOR);
}

function findSortableRow(target: Element | null, listId: string) {
  let current: Element | null = target;
  while (current) {
    if (current instanceof HTMLElement && current.dataset.sortableId && current.dataset.sortableListId === listId) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function SortableAdminList({
  items,
  empty,
  className,
  itemClassName,
  reorderAction,
}: SortableAdminListProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listId = useId();
  const latestItems = useRef(items);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    activated: boolean;
    hasChanged: boolean;
    timer: ReturnType<typeof setTimeout> | null;
    surface: HTMLElement | null;
  } | null>(null);

  useEffect(() => {
    document.body.style.userSelect = activeId ? "none" : "";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [activeId]);

  const persistOrder = (nextItems: SortableAdminItem[]) => {
    if (areOrdersEqual(nextItems, items)) return;

    setError(null);
    startTransition(() => {
      void reorderAction(nextItems.map((item) => item.id)).catch((caught: unknown) => {
        latestItems.current = items;
        setOrderedItems(items);
        setError(caught instanceof Error ? caught.message : "Gagal menyimpan urutan.");
      });
    });
  };

  const activateDrag = (id: string) => {
    if (!dragState.current) return;
    dragState.current.activated = true;
    setActiveId(id);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, id: string) => {
    if (event.button !== 0) return;
    if (!canStartCardDrag(event.target)) return;

    const surface = event.currentTarget;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      activated: false,
      hasChanged: false,
      timer: null,
      surface,
    };
    surface.setPointerCapture(event.pointerId);

    if (event.pointerType === "touch" || event.pointerType === "pen") {
      dragState.current.timer = setTimeout(() => activateDrag(id), TOUCH_LONG_PRESS_MS);
      return;
    }

    event.preventDefault();
    activateDrag(id);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>, id: string) => {
    const current = dragState.current;
    if (!current || current.pointerId !== event.pointerId) return;

    if (!current.activated) {
      const deltaX = Math.abs(event.clientX - current.startX);
      const deltaY = Math.abs(event.clientY - current.startY);
      if (deltaX > TOUCH_CANCEL_DISTANCE || deltaY > TOUCH_CANCEL_DISTANCE) {
        if (current.timer) clearTimeout(current.timer);
        if (current.surface?.hasPointerCapture(event.pointerId)) {
          current.surface.releasePointerCapture(event.pointerId);
        }
        dragState.current = null;
      }
      return;
    }

    event.preventDefault();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const targetRow = target instanceof Element ? findSortableRow(target, listId) : null;
    const overId = targetRow?.dataset.sortableId;
    if (!overId || overId === id) return;

    setOrderedItems((currentItems) => {
      const fromIndex = currentItems.findIndex((item) => item.id === id);
      const toIndex = currentItems.findIndex((item) => item.id === overId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return currentItems;
      if (dragState.current) dragState.current.hasChanged = true;
      const nextItems = moveItem(currentItems, fromIndex, toIndex);
      latestItems.current = nextItems;
      return nextItems;
    });
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = dragState.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.timer) clearTimeout(current.timer);
    if (current.surface?.hasPointerCapture(event.pointerId)) {
      current.surface.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setActiveId(null);

    if (current.activated && current.hasChanged) {
      persistOrder(latestItems.current);
    }
  };

  const moveByButton = (id: string, direction: -1 | 1) => {
    const currentIndex = orderedItems.findIndex((item) => item.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) return;
    const nextItems = moveItem(orderedItems, currentIndex, nextIndex);
    latestItems.current = nextItems;
    setOrderedItems(nextItems);
    persistOrder(nextItems);
  };

  if (orderedItems.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[color:rgba(22,37,29,0.48)]">
        <span>Drag kartu untuk mengatur urutan</span>
        {isPending ? <span>Menyimpan...</span> : null}
      </div>
      {error ? (
        <p className="rounded-2xl border border-[color:rgba(242,111,76,0.26)] bg-[color:rgba(242,111,76,0.08)] px-3 py-2 text-sm font-bold text-[var(--atlas-coral)]">
          {error}
        </p>
      ) : null}
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          data-sortable-id={item.id}
          data-sortable-list-id={listId}
          className={cn(
            "group grid cursor-grab gap-3 rounded-[1.75rem] transition duration-200 [touch-action:pan-y] md:grid-cols-[auto_1fr]",
            activeId === item.id
              ? "z-10 scale-[1.01] cursor-grabbing ring-2 ring-[color:rgba(242,111,76,0.36)] shadow-[0_22px_48px_rgba(22,37,29,0.18)]"
              : "hover:shadow-[0_14px_34px_rgba(22,37,29,0.08)]",
            itemClassName,
          )}
          onPointerDown={(event) => handlePointerDown(event, item.id)}
          onPointerMove={(event) => handlePointerMove(event, item.id)}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="flex items-center gap-2 md:flex-col md:justify-start">
            <div
              aria-hidden="true"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,249,234,0.82)] text-[var(--atlas-jungle)] shadow-[0_10px_24px_rgba(22,37,29,0.08)] transition group-hover:border-[var(--atlas-coral)]"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex gap-1 md:flex-col">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9 rounded-xl px-2"
                aria-label={`Naikkan ${item.label}`}
                disabled={index === 0 || isPending}
                onClick={() => moveByButton(item.id, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9 rounded-xl px-2"
                aria-label={`Turunkan ${item.label}`}
                disabled={index === orderedItems.length - 1 || isPending}
                onClick={() => moveByButton(item.id, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {item.node}
        </div>
      ))}
    </div>
  );
}
