'use client';

import { useEffect, useMemo, useState, useTransition, type CSSProperties } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from '@/components/ui/use-toast';
import type { IdeaSummary } from '@/components/portal/idea-card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/portal/status-badge';

export const STATUS_COLUMNS = [
  { key: 'new', label: 'New', limit: Infinity },
  { key: 'under_review', label: 'Under review', limit: 8 },
  { key: 'in_progress', label: 'In progress', limit: 5 },
  { key: 'adopted', label: 'Adopted', limit: Infinity },
  { key: 'not_feasible', label: 'Not feasible', limit: Infinity },
  { key: 'archived', label: 'Archived', limit: Infinity },
] as const;

export type ColumnKey = (typeof STATUS_COLUMNS)[number]['key'];

type KanbanIdea = IdeaSummary & { status: ColumnKey };

type ColumnState = {
  status: ColumnKey;
  items: KanbanIdea[];
};

export function KanbanBoard({ ideas, viewerRole }: { ideas: KanbanIdea[]; viewerRole: 'user' | 'org_rep' | 'moderator' | 'admin' | null }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const canEdit = viewerRole === 'moderator' || viewerRole === 'admin';

  const initialColumns = useMemo<ColumnState[]>(
    () =>
      STATUS_COLUMNS.map((column) => ({
        status: column.key,
        items: ideas.filter((idea) => idea.status === column.key),
      })),
    [ideas],
  );

  const [columns, setColumns] = useState<ColumnState[]>(initialColumns);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sourceColumn = columns.find((column) => column.items.some((item) => item.id === active.id));
    if (!sourceColumn) return;

    const targetColumnId = (over.data.current?.columnId as ColumnKey | undefined) ?? sourceColumn.status;
    if (sourceColumn.status === targetColumnId) {
      return;
    }

    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only moderators can reorder ideas on the board.',
      });
      return;
    }

    const targetColumn = columns.find((column) => column.status === targetColumnId);
    if (!targetColumn) {
      return;
    }

    const targetMeta = STATUS_COLUMNS.find((column) => column.key === targetColumnId);
    const limit = targetMeta?.limit ?? Infinity;
    if (Number.isFinite(limit) && targetColumn.items.length >= limit) {
      toast({
        title: 'WIP limit reached',
        description: `Move an idea out of “${targetMeta?.label ?? targetColumnId}” before adding more.`,
        variant: 'destructive',
      });
      return;
    }

    const idea = sourceColumn.items.find((item) => item.id === active.id);
    if (!idea) return;

    setColumns((prev) =>
      prev.map((column) => {
        if (column.status === sourceColumn.status) {
          return { status: column.status, items: column.items.filter((item) => item.id !== idea.id) };
        }
        if (column.status === targetColumn.status) {
          return { status: column.status, items: [...column.items, { ...idea, status: targetColumn.status }] };
        }
        return column;
      }),
    );

    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', idea_id: idea.id, status: targetColumn.status }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Status update failed');
        }
        toast({
          title: 'Status updated',
          description: `${idea.title} moved to ${statusLabel(targetColumn.status)}.`,
        });
      } catch (error) {
        toast({
          title: 'Unable to move idea',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
        setColumns(initialColumns);
      }
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 overflow-x-auto pb-4 lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            column={column}
            canEdit={canEdit}
            pending={pending}
            limit={STATUS_COLUMNS.find((item) => item.key === column.status)?.limit ?? Infinity}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  column,
  canEdit,
  pending,
  limit,
}: {
  column: ColumnState;
  canEdit: boolean;
  pending: boolean;
  limit: number;
}) {
  const { setNodeRef } = useDroppable({ id: column.status, data: { columnId: column.status } });

  const limitLabel = Number.isFinite(limit)
    ? `${column.items.length}/${limit}`
    : `${column.items.length}`;

  return (
    <div
      ref={setNodeRef}
      className="flex h-full min-w-[260px] flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
          {statusLabel(column.status)}
          <Badge variant="secondary">{limitLabel}</Badge>
        </div>
        {pending && <span className="text-xs text-slate-400">Saving…</span>}
      </header>
      <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3">
          {column.items.map((idea) => (
            <SortableIdeaCard key={idea.id} idea={idea} disabled={!canEdit} />
          ))}
          {!column.items.length && (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Drop ideas here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableIdeaCard({ idea, disabled }: { idea: KanbanIdea; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
    disabled,
    data: { columnId: idea.status },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950"
      {...(!disabled ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <StatusBadge status={idea.status} />
        <span>👍 {idea.voteCount}</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{idea.title}</h3>
      <p className="mt-1 line-clamp-3 text-xs text-slate-600 dark:text-slate-300">
        {idea.proposalSummary || idea.problemStatement || idea.body}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{idea.isAnonymous ? 'Anonymous' : idea.authorDisplayName}</span>
        <span>💬 {idea.commentCount}</span>
      </div>
    </div>
  );
}

function statusLabel(status: ColumnKey) {
  const entry = STATUS_COLUMNS.find((column) => column.key === status);
  return entry ? entry.label : status;
}
