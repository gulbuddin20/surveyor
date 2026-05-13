"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
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

type SortableCardProps = {
  item: SortableAdminItem;
  index: number;
  isPending: boolean;
  itemClassName?: string;
  totalItems: number;
  onMove: (id: string, direction: -1 | 1) => void;
  onMeasure: (id: string, rect: DOMRect) => void;
};

type DragPreviewSize = {
  width: number;
  height: number;
} | null;

const TOUCH_LONG_PRESS_MS = 2000;

function areOrdersEqual(left: SortableAdminItem[], right: SortableAdminItem[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

function SortableCard({
  item,
  index,
  isPending,
  itemClassName,
  totalItems,
  onMove,
  onMeasure,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (node) onMeasure(item.id, node.getBoundingClientRect());
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        className={cn(
          "group rounded-[1.75rem] transition-shadow duration-200",
          isDragging
            ? "opacity-30 ring-2 ring-[color:rgba(242,111,76,0.28)]"
            : "hover:shadow-[0_14px_34px_rgba(22,37,29,0.08)]",
          itemClassName,
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="mb-2 flex min-h-10 w-full cursor-grab touch-manipulation items-center justify-center rounded-2xl border border-dashed border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,249,234,0.62)] text-[var(--atlas-jungle)] transition hover:border-[var(--atlas-coral)] hover:bg-[color:rgba(255,249,234,0.9)] active:cursor-grabbing"
          aria-label={`Drag ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="grid gap-3 md:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-2 md:flex-col md:justify-start">
            <div
              aria-hidden="true"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[color:rgba(22,37,29,0.16)] bg-[color:rgba(255,249,234,0.82)] text-[var(--atlas-jungle)] shadow-[0_10px_24px_rgba(22,37,29,0.08)]"
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
                onClick={() => onMove(item.id, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-9 rounded-xl px-2"
                aria-label={`Turunkan ${item.label}`}
                disabled={index === totalItems - 1 || isPending}
                onClick={() => onMove(item.id, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {item.node}
        </div>
      </div>
    </div>
  );
}

function DragPreview({
  item,
  itemClassName,
  size,
}: {
  item: SortableAdminItem;
  itemClassName?: string;
  size: DragPreviewSize;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] bg-[color:rgba(255,249,234,0.96)] opacity-95 ring-2 ring-[color:rgba(242,111,76,0.36)] shadow-[0_28px_72px_rgba(22,37,29,0.28)]",
        itemClassName,
      )}
      style={{
        width: size?.width,
        minHeight: size?.height,
      }}
    >
      <div className="mb-2 flex min-h-10 w-full cursor-grabbing items-center justify-center rounded-2xl border border-[var(--atlas-coral)] bg-[color:rgba(255,249,234,0.92)] text-[var(--atlas-jungle)]">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="grid gap-3 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-2 md:flex-col md:justify-start">
          <div
            aria-hidden="true"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-[var(--atlas-coral)] bg-[color:rgba(255,249,234,0.92)] text-[var(--atlas-jungle)] shadow-[0_10px_24px_rgba(22,37,29,0.12)]"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        </div>
        <div className="pointer-events-none">{item.node}</div>
      </div>
    </div>
  );
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
  const [activeSize, setActiveSize] = useState<DragPreviewSize>(null);
  const [itemRects, setItemRects] = useState<Record<string, DragPreviewSize>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: TOUCH_LONG_PRESS_MS, tolerance: 10 },
    }),
  );

  const persistOrder = (nextItems: SortableAdminItem[]) => {
    if (areOrdersEqual(nextItems, items)) return;

    setError(null);
    startTransition(() => {
      void reorderAction(nextItems.map((item) => item.id)).catch((caught: unknown) => {
        setOrderedItems(items);
        setError(caught instanceof Error ? caught.message : "Gagal menyimpan urutan.");
      });
    });
  };

  const moveByButton = (id: string, direction: -1 | 1) => {
    const currentIndex = orderedItems.findIndex((item) => item.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) return;
    const nextItems = arrayMove(orderedItems, currentIndex, nextIndex);
    setOrderedItems(nextItems);
    persistOrder(nextItems);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveId = String(event.active.id);
    setActiveId(nextActiveId);
    setActiveSize(itemRects[nextActiveId] ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveSize(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIndex = orderedItems.findIndex((item) => item.id === active.id);
    const overIndex = orderedItems.findIndex((item) => item.id === over.id);
    if (activeIndex < 0 || overIndex < 0) return;

    const nextItems = arrayMove(orderedItems, activeIndex, overIndex);
    setOrderedItems(nextItems);
    persistOrder(nextItems);
  };

  if (orderedItems.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  const measureItem = (id: string, rect: DOMRect) => {
    const nextSize = { width: rect.width, height: rect.height };
    setItemRects((current) => {
      const currentSize = current[id];
      if (currentSize?.width === nextSize.width && currentSize.height === nextSize.height) return current;
      return { ...current, [id]: nextSize };
    });
  };

  const activeItem = activeId ? orderedItems.find((item) => item.id === activeId) : null;

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={() => {
          setActiveId(null);
          setActiveSize(null);
        }}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedItems.map((item, index) => (
              <SortableCard
                key={item.id}
                item={item}
                index={index}
                isPending={isPending}
                itemClassName={itemClassName}
                totalItems={orderedItems.length}
                onMove={moveByButton}
                onMeasure={measureItem}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay
          adjustScale={false}
          dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}
        >
          {activeItem ? <DragPreview item={activeItem} itemClassName={itemClassName} size={activeSize} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
