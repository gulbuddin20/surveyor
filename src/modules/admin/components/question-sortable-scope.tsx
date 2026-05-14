"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useDroppable,
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
import { createContext, useContext, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { SortableAdminItem } from "@/modules/admin/components/sortable-admin-list";

type QuestionContainer = {
  sectionId: string;
  title: string;
  questionIds: string[];
};

type QuestionSectionOrder = {
  sectionId: string;
  orderedIds: string[];
};

type QuestionDragScopeProps = {
  children: ReactNode;
  containers: QuestionContainer[];
  items: SortableAdminItem[];
  reorderAction: (sections: QuestionSectionOrder[]) => Promise<void>;
};

type QuestionSortableListProps = {
  sectionId: string;
  empty?: ReactNode;
};

type QuestionDragContextValue = {
  activeId: string | null;
  activeSize: DragPreviewSize;
  containerItems: Record<string, string[]>;
  error: string | null;
  isPending: boolean;
  itemMap: Map<string, SortableAdminItem>;
  moveByButton: (id: string, direction: -1 | 1) => void;
  measureItem: (id: string, rect: DOMRect) => void;
};

type DragPreviewSize = {
  width: number;
  height: number;
} | null;

const TOUCH_LONG_PRESS_MS = 2000;
const QuestionDragContext = createContext<QuestionDragContextValue | null>(null);

function createInitialContainerItems(containers: QuestionContainer[]) {
  return Object.fromEntries(containers.map((container) => [container.sectionId, container.questionIds]));
}

function findContainer(containerItems: Record<string, string[]>, id: string) {
  if (id in containerItems) return id;
  return Object.keys(containerItems).find((containerId) => containerItems[containerId]?.includes(id)) ?? null;
}

function createSectionOrders(containerItems: Record<string, string[]>): QuestionSectionOrder[] {
  return Object.entries(containerItems).map(([sectionId, orderedIds]) => ({ sectionId, orderedIds }));
}

function useQuestionDragContext() {
  const context = useContext(QuestionDragContext);
  if (!context) throw new Error("QuestionSortableList must be used inside QuestionDragScope");
  return context;
}

function QuestionSortableCard({
  item,
  index,
  totalItems,
}: {
  item: SortableAdminItem;
  index: number;
  totalItems: number;
}) {
  const { isPending, moveByButton, measureItem } = useQuestionDragContext();
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
        if (node) measureItem(item.id, node.getBoundingClientRect());
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        className={cn(
          "group relative rounded-[1.75rem] transition-shadow duration-200",
          isDragging
            ? "opacity-30 ring-2 ring-[color:rgba(242,111,76,0.28)]"
            : "hover:shadow-[0_14px_34px_rgba(22,37,29,0.08)]",
        )}
      >
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="absolute left-1/2 top-1 z-10 flex h-7 w-12 -translate-x-1/2 cursor-grab touch-manipulation items-center justify-center rounded-full border border-dashed border-[color:rgba(22,37,29,0.18)] bg-[color:rgba(255,249,234,0.94)] text-[var(--atlas-jungle)] shadow-[0_8px_18px_rgba(22,37,29,0.08)] transition hover:border-[var(--atlas-coral)] hover:bg-[color:rgba(255,249,234,1)] active:cursor-grabbing"
          aria-label={`Drag ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="absolute left-2 top-12 z-10 flex flex-col gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-8 rounded-xl border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.92)] px-2 shadow-[0_8px_16px_rgba(22,37,29,0.08)]"
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
            className="min-h-8 rounded-xl border border-[color:rgba(22,37,29,0.12)] bg-[color:rgba(255,249,234,0.92)] px-2 shadow-[0_8px_16px_rgba(22,37,29,0.08)]"
            aria-label={`Turunkan ${item.label}`}
            disabled={index === totalItems - 1 || isPending}
            onClick={() => moveByButton(item.id, 1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-w-0">
          {item.node}
        </div>
      </div>
    </div>
  );
}

function QuestionDragPreview({ item, size }: { item: SortableAdminItem; size: DragPreviewSize }) {
  return (
    <div
      className="relative rounded-[1.75rem] bg-[color:rgba(255,249,234,0.96)] opacity-95 ring-2 ring-[color:rgba(242,111,76,0.36)] shadow-[0_28px_72px_rgba(22,37,29,0.28)]"
      style={{
        width: size?.width,
        minHeight: size?.height,
      }}
    >
      <div className="absolute left-1/2 top-1 z-10 flex h-7 w-12 -translate-x-1/2 cursor-grabbing items-center justify-center rounded-full border border-[var(--atlas-coral)] bg-[color:rgba(255,249,234,0.98)] text-[var(--atlas-jungle)] shadow-[0_8px_18px_rgba(22,37,29,0.12)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="pointer-events-none min-w-0">{item.node}</div>
    </div>
  );
}

export function QuestionSortableList({ sectionId, empty }: QuestionSortableListProps) {
  const { activeId, containerItems, itemMap, error } = useQuestionDragContext();
  const { setNodeRef, isOver } = useDroppable({ id: sectionId });
  const questionIds = containerItems[sectionId] ?? [];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-3 rounded-[1.75rem] transition",
        activeId ? "min-h-16 border border-dashed border-[color:rgba(22,37,29,0.14)] p-2" : null,
        isOver ? "border-[color:rgba(15,107,79,0.4)] bg-[color:rgba(121,168,77,0.12)] ring-2 ring-[color:rgba(15,107,79,0.22)]" : null,
      )}
    >
      {error ? (
        <p className="rounded-2xl border border-[color:rgba(242,111,76,0.26)] bg-[color:rgba(242,111,76,0.08)] px-3 py-2 text-sm font-bold text-[var(--atlas-coral)]">
          {error}
        </p>
      ) : null}
      <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
        {isOver ? (
          <p className="rounded-2xl border border-[color:rgba(15,107,79,0.18)] bg-[color:rgba(255,249,234,0.76)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--atlas-canopy)]">
            Lepas pertanyaan di sini
          </p>
        ) : null}
        {questionIds.length ? questionIds.map((questionId, index) => {
          const item = itemMap.get(questionId);
          if (!item) return null;
          return (
            <QuestionSortableCard
              key={item.id}
              item={item}
              index={index}
              totalItems={questionIds.length}
            />
          );
        }) : (
          empty ?? (
            <p className={cn(
              "rounded-2xl border border-dashed px-4 py-5 text-sm transition",
              activeId
                ? "border-[color:rgba(15,107,79,0.28)] bg-[color:rgba(121,168,77,0.08)] font-bold text-[var(--atlas-canopy)]"
                : "border-[color:rgba(22,37,29,0.16)] text-[color:rgba(22,37,29,0.58)]",
            )}>
              {activeId ? "Drop pertanyaan ke sini" : "Belum ada pertanyaan. Drag pertanyaan ke bagian ini atau tambah pertanyaan baru."}
            </p>
          )
        )}
      </SortableContext>
    </div>
  );
}

export function QuestionDragScope({
  children,
  containers,
  items,
  reorderAction,
}: QuestionDragScopeProps) {
  const [containerItems, setContainerItems] = useState(() => createInitialContainerItems(containers));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<DragPreviewSize>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestContainerItems = useRef(containerItems);
  const dragStartContainerItems = useRef(containerItems);
  const itemRects = useRef<Record<string, DragPreviewSize>>({});
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: TOUCH_LONG_PRESS_MS, tolerance: 10 },
    }),
  );

  const persistOrder = (nextContainerItems: Record<string, string[]>) => {
    latestContainerItems.current = nextContainerItems;
    setError(null);
    startTransition(() => {
      void reorderAction(createSectionOrders(nextContainerItems))
        .then(() => {
          toast({
            title: "Pertanyaan dipindahkan",
            description: "Urutan dan bagian pertanyaan berhasil disimpan.",
            variant: "success",
          });
        })
        .catch((caught: unknown) => {
          const message = caught instanceof Error ? caught.message : "Gagal menyimpan perpindahan pertanyaan.";
          const resetItems = createInitialContainerItems(containers);
          latestContainerItems.current = resetItems;
          setContainerItems(resetItems);
          setError(message);
          toast({
            title: "Pertanyaan gagal dipindahkan",
            description: message,
            variant: "error",
          });
        });
    });
  };

  const moveByButton = (id: string, direction: -1 | 1) => {
    const containerId = findContainer(containerItems, id);
    if (!containerId) return;

    const currentItems = containerItems[containerId] ?? [];
    const currentIndex = currentItems.indexOf(id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentItems.length) return;

    const nextContainerItems = {
      ...containerItems,
      [containerId]: arrayMove(currentItems, currentIndex, nextIndex),
    };
    setContainerItems(nextContainerItems);
    persistOrder(nextContainerItems);
  };

  const measureItem = (id: string, rect: DOMRect) => {
    const nextSize = { width: rect.width, height: rect.height };
    const currentSize = itemRects.current[id];
    if (currentSize?.width === nextSize.width && currentSize.height === nextSize.height) return;
    itemRects.current[id] = nextSize;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const nextActiveId = String(event.active.id);
    dragStartContainerItems.current = latestContainerItems.current;
    setActiveId(nextActiveId);
    setActiveSize(itemRects.current[nextActiveId] ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);
    const activeContainerId = findContainer(latestContainerItems.current, activeItemId);
    const overContainerId = findContainer(latestContainerItems.current, overItemId);
    if (!activeContainerId || !overContainerId) return;

    setContainerItems((current) => {
      const currentActiveContainerId = findContainer(current, activeItemId);
      const currentOverContainerId = findContainer(current, overItemId);
      if (!currentActiveContainerId || !currentOverContainerId) return current;

      const activeItems = current[currentActiveContainerId] ?? [];
      const overItems = current[currentOverContainerId] ?? [];
      const activeIndex = activeItems.indexOf(activeItemId);
      const overIndex = overItems.indexOf(overItemId);
      if (activeIndex < 0) return current;

      if (currentActiveContainerId === currentOverContainerId) {
        if (overIndex < 0 || activeIndex === overIndex) return current;
        const next = {
          ...current,
          [currentActiveContainerId]: arrayMove(activeItems, activeIndex, overIndex),
        };
        latestContainerItems.current = next;
        return next;
      }

      const nextOverIndex = overIndex >= 0 ? overIndex : overItems.length;
      const next = {
        ...current,
        [currentActiveContainerId]: activeItems.filter((id) => id !== activeItemId),
        [currentOverContainerId]: [
          ...overItems.slice(0, nextOverIndex),
          activeItemId,
          ...overItems.slice(nextOverIndex),
        ],
      };
      latestContainerItems.current = next;
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveSize(null);
    if (!event.over) {
      latestContainerItems.current = dragStartContainerItems.current;
      setContainerItems(dragStartContainerItems.current);
      return;
    }
    persistOrder(latestContainerItems.current);
  };

  const activeItem = activeId ? itemMap.get(activeId) : null;
  const dragOverlay = (
    <DragOverlay
      adjustScale={false}
      dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}
    >
      {activeItem ? <QuestionDragPreview item={activeItem} size={activeSize} /> : null}
    </DragOverlay>
  );

  return (
    <QuestionDragContext.Provider
      value={{
        activeId,
        activeSize,
        containerItems,
        error,
        isPending,
        itemMap,
        moveByButton,
        measureItem,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={() => {
          setActiveId(null);
          setActiveSize(null);
          latestContainerItems.current = dragStartContainerItems.current;
          setContainerItems(dragStartContainerItems.current);
        }}
        onDragEnd={handleDragEnd}
      >
        {children}
        {typeof document === "undefined" ? dragOverlay : createPortal(dragOverlay, document.body)}
      </DndContext>
    </QuestionDragContext.Provider>
  );
}
