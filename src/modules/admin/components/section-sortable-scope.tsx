"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { DragEvent, PointerEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { SortableAdminItem } from "@/modules/admin/components/sortable-admin-list";

type SectionContainer = {
  parentId: string | null;
  sectionIds: string[];
};

type SectionParentOrder = {
  parentId: string | null;
  orderedIds: string[];
};

type SectionDragScopeProps = {
  children: ReactNode;
  containers: SectionContainer[];
  items: SortableAdminItem[];
  reorderAction: (sections: SectionParentOrder[]) => Promise<void>;
};

type SectionSortableListProps = {
  parentId: string | null;
  empty?: ReactNode;
  className?: string;
};

type SectionSortableCardProps = {
  containerId: string;
  index: number;
  item: SortableAdminItem;
  totalItems: number;
};

type SectionDragContextValue = {
  activeId: string | null;
  containerItems: Record<string, string[]>;
  dragHandleId: string | null;
  error: string | null;
  isPending: boolean;
  itemMap: Map<string, SortableAdminItem>;
  overContainerId: string | null;
  dropOnContainer: (containerId: string) => void;
  dropOnItem: (overId: string) => void;
  endDrag: () => void;
  moveByButton: (id: string, direction: -1 | 1) => void;
  moveOverItem: (overId: string) => void;
  setOverContainerId: (id: string | null) => void;
  setDragHandleId: (id: string | null) => void;
  startDrag: (id: string, event: DragEvent<HTMLDivElement>) => void;
};

const ROOT_CONTAINER_ID = "__root_sections__";
const SectionDragContext = createContext<SectionDragContextValue | null>(null);

function containerIdForParent(parentId: string | null) {
  return parentId ?? ROOT_CONTAINER_ID;
}

function parentIdForContainer(containerId: string) {
  return containerId === ROOT_CONTAINER_ID ? null : containerId;
}

function createInitialContainerItems(containers: SectionContainer[]) {
  return Object.fromEntries(
    containers.map((container) => [containerIdForParent(container.parentId), container.sectionIds]),
  );
}

function findContainer(containerItems: Record<string, string[]>, id: string) {
  if (id in containerItems) return id;
  return Object.keys(containerItems).find((containerId) => containerItems[containerId]?.includes(id)) ?? null;
}

function createSectionOrders(containerItems: Record<string, string[]>): SectionParentOrder[] {
  return Object.entries(containerItems).map(([containerId, orderedIds]) => ({
    parentId: parentIdForContainer(containerId),
    orderedIds,
  }));
}

function useSectionDragContext() {
  const context = useContext(SectionDragContext);
  if (!context) throw new Error("SectionSortableList must be used inside SectionDragScope");
  return context;
}

function moveItemBefore(
  current: Record<string, string[]>,
  activeId: string,
  overId: string,
) {
  const activeContainerId = findContainer(current, activeId);
  const overContainerId = findContainer(current, overId);
  if (!activeContainerId || !overContainerId) return current;

  const activeItems = current[activeContainerId] ?? [];
  const overItems = current[overContainerId] ?? [];
  const activeIndex = activeItems.indexOf(activeId);
  const overIndex = overItems.indexOf(overId);
  if (activeIndex < 0 || overIndex < 0) return current;
  if (activeContainerId === overContainerId && activeIndex === overIndex) return current;

  const nextActiveItems = activeItems.filter((id) => id !== activeId);
  const nextOverItems = activeContainerId === overContainerId ? nextActiveItems : overItems;
  const adjustedOverIndex = activeContainerId === overContainerId && activeIndex < overIndex
    ? overIndex - 1
    : overIndex;

  return {
    ...current,
    [activeContainerId]: nextActiveItems,
    [overContainerId]: [
      ...nextOverItems.slice(0, adjustedOverIndex),
      activeId,
      ...nextOverItems.slice(adjustedOverIndex),
    ],
  };
}

function moveItemToContainerEnd(
  current: Record<string, string[]>,
  activeId: string,
  targetContainerId: string,
) {
  const activeContainerId = findContainer(current, activeId);
  if (!activeContainerId || !(targetContainerId in current)) return current;

  const activeItems = current[activeContainerId] ?? [];
  const targetItems = current[targetContainerId] ?? [];
  if (activeContainerId === targetContainerId && targetItems.at(-1) === activeId) return current;

  return {
    ...current,
    [activeContainerId]: activeItems.filter((id) => id !== activeId),
    [targetContainerId]: [
      ...targetItems.filter((id) => id !== activeId),
      activeId,
    ],
  };
}

function SectionSortableCard({
  containerId,
  index,
  item,
  totalItems,
}: SectionSortableCardProps) {
  const {
    activeId,
    dragHandleId,
    isPending,
    setOverContainerId,
    dropOnItem,
    endDrag,
    moveByButton,
    moveOverItem,
    setDragHandleId,
    startDrag,
  } = useSectionDragContext();
  const isDragging = activeId === item.id;

  const markHandle = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") return;
    setDragHandleId(item.id);
  };

  return (
    <div
      draggable={dragHandleId === item.id}
      onDragStart={(event) => startDrag(item.id, event)}
      onDragOver={(event) => {
        event.preventDefault();
        setOverContainerId(containerId);
        moveOverItem(item.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        dropOnItem(item.id);
      }}
      onDragEnd={endDrag}
      data-section-container={containerId}
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
          type="button"
          className="absolute left-1/2 top-1 z-10 flex h-7 w-12 -translate-x-1/2 cursor-grab touch-manipulation items-center justify-center rounded-full border border-dashed border-[color:rgba(22,37,29,0.18)] bg-[color:rgba(255,249,234,0.94)] text-[var(--atlas-jungle)] shadow-[0_8px_18px_rgba(22,37,29,0.08)] transition hover:border-[var(--atlas-coral)] hover:bg-[color:rgba(255,249,234,1)] active:cursor-grabbing"
          aria-label={`Drag ${item.label}`}
          onPointerDown={markHandle}
          onPointerUp={() => setDragHandleId(null)}
          onPointerCancel={() => setDragHandleId(null)}
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
        <div className="min-w-0">{item.node}</div>
      </div>
    </div>
  );
}

export function SectionSortableList({ parentId, empty, className }: SectionSortableListProps) {
  const { activeId, containerItems, error, itemMap, overContainerId, dropOnContainer, setOverContainerId } = useSectionDragContext();
  const containerId = containerIdForParent(parentId);
  const sectionIds = containerItems[containerId] ?? [];
  const isOver = overContainerId === containerId;

  return (
    <div
      className={cn(
        "space-y-4 rounded-[1.75rem] transition",
        activeId ? "min-h-16 border border-dashed border-[color:rgba(22,37,29,0.14)] p-2" : null,
        isOver ? "border-[color:rgba(15,107,79,0.4)] bg-[color:rgba(121,168,77,0.12)] ring-2 ring-[color:rgba(15,107,79,0.22)]" : null,
        className,
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setOverContainerId(containerId);
      }}
      onDragLeave={() => setOverContainerId(null)}
      onDrop={(event) => {
        event.preventDefault();
        dropOnContainer(containerId);
      }}
    >
      {error ? (
        <p className="rounded-2xl border border-[color:rgba(242,111,76,0.26)] bg-[color:rgba(242,111,76,0.08)] px-3 py-2 text-sm font-bold text-[var(--atlas-coral)]">
          {error}
        </p>
      ) : null}
      {isOver ? (
        <p className="rounded-2xl border border-[color:rgba(15,107,79,0.18)] bg-[color:rgba(255,249,234,0.76)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--atlas-canopy)]">
          Lepas bagian di sini
        </p>
      ) : null}
      {sectionIds.length ? sectionIds.map((sectionId, index) => {
        const item = itemMap.get(sectionId);
        if (!item) return null;
        return (
          <SectionSortableCard
            key={item.id}
            containerId={containerId}
            index={index}
            item={item}
            totalItems={sectionIds.length}
          />
        );
      }) : (
        empty ?? (
          activeId ? (
            <p className="rounded-2xl border border-dashed border-[color:rgba(15,107,79,0.28)] bg-[color:rgba(121,168,77,0.08)] px-4 py-5 text-sm font-bold text-[var(--atlas-canopy)]">
              Drop bagian ke sini
            </p>
          ) : null
        )
      )}
    </div>
  );
}

export function SectionDragScope({
  children,
  containers,
  items,
  reorderAction,
}: SectionDragScopeProps) {
  const [containerItems, setContainerItems] = useState(() => createInitialContainerItems(containers));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragHandleId, setDragHandleId] = useState<string | null>(null);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestContainerItems = useRef(containerItems);
  const dragStartContainerItems = useRef(containerItems);
  const didDrop = useRef(false);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const router = useRouter();
  const { toast } = useToast();

  const persistOrder = (nextContainerItems: Record<string, string[]>) => {
    latestContainerItems.current = nextContainerItems;
    setError(null);
    startTransition(() => {
      void reorderAction(createSectionOrders(nextContainerItems))
        .then(() => {
          router.refresh();
          toast({
            title: "Bagian dipindahkan",
            description: "Urutan dan induk bagian berhasil disimpan.",
            variant: "success",
          });
        })
        .catch((caught: unknown) => {
          const message = caught instanceof Error ? caught.message : "Gagal menyimpan perpindahan bagian.";
          const resetItems = createInitialContainerItems(containers);
          latestContainerItems.current = resetItems;
          setContainerItems(resetItems);
          setError(message);
          toast({
            title: "Bagian gagal dipindahkan",
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
      [containerId]: [
        ...currentItems.slice(0, Math.min(currentIndex, nextIndex)),
        currentItems[Math.max(currentIndex, nextIndex)],
        currentItems[Math.min(currentIndex, nextIndex)],
        ...currentItems.slice(Math.max(currentIndex, nextIndex) + 1),
      ],
    };
    setContainerItems(nextContainerItems);
    persistOrder(nextContainerItems);
  };

  const startDrag = (id: string, event: DragEvent<HTMLDivElement>) => {
    didDrop.current = false;
    dragStartContainerItems.current = latestContainerItems.current;
    setActiveId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const moveOverItem = (overId: string) => {
    if (!activeId || activeId === overId) return;
    setContainerItems((current) => {
      const next = moveItemBefore(current, activeId, overId);
      latestContainerItems.current = next;
      return next;
    });
  };

  const dropOnItem = (overId: string) => {
    if (!activeId) return;
    const next = moveItemBefore(latestContainerItems.current, activeId, overId);
    didDrop.current = true;
    setContainerItems(next);
    persistOrder(next);
    setActiveId(null);
    setDragHandleId(null);
    setOverContainerId(null);
  };

  const dropOnContainer = (containerId: string) => {
    if (!activeId) return;
    const next = moveItemToContainerEnd(latestContainerItems.current, activeId, containerId);
    didDrop.current = true;
    setContainerItems(next);
    persistOrder(next);
    setActiveId(null);
    setDragHandleId(null);
    setOverContainerId(null);
  };

  const endDrag = () => {
    if (!didDrop.current && activeId) {
      latestContainerItems.current = dragStartContainerItems.current;
      setContainerItems(dragStartContainerItems.current);
    }
    setActiveId(null);
    setDragHandleId(null);
    setOverContainerId(null);
    didDrop.current = false;
  };

  return (
    <SectionDragContext.Provider
      value={{
        activeId,
        containerItems,
        dragHandleId,
        error,
        isPending,
        itemMap,
        overContainerId,
        dropOnContainer,
        dropOnItem,
        endDrag,
        moveByButton,
        moveOverItem,
        setOverContainerId,
        setDragHandleId,
        startDrag,
      }}
    >
      {children}
    </SectionDragContext.Provider>
  );
}
