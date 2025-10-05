'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/portal/status-badge';
import type { IdeaSummary } from '@/components/portal/idea-card';

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

function buildColumns(ideas: KanbanIdea[]): ColumnState[] {
  return STATUS_COLUMNS.map((column) => ({
    status: column.key,
    items: ideas.filter((idea) => idea.status === column.key),
  }));
}

export function KanbanBoard({
  ideas,
  viewerRole,
}: {
  ideas: KanbanIdea[];
  viewerRole: 'user' | 'org_rep' | 'moderator' | 'admin' | null;
}) {
  const canModerateAll = viewerRole === 'moderator' || viewerRole === 'admin';
  const canTransitionLimited = viewerRole === 'org_rep';
  const canDrag = canModerateAll || canTransitionLimited;
  const initialColumns = useMemo(() => buildColumns(ideas), [ideas]);
  const [columns, setColumns] = useState<ColumnState[]>(initialColumns);
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const allowedOrgRepTransitions: Partial<Record<ColumnKey, ColumnKey[]>> = useMemo(
    () => ({
      new: ['under_review'],
      under_review: ['in_progress', 'not_feasible'],
      in_progress: ['adopted', 'not_feasible'],
    }),
    [],
  );

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const moveIdea = (ideaId: string, targetStatus: ColumnKey) => {
    const snapshot = columns.map((column) => ({
      status: column.status,
      items: column.items.map((item) => ({ ...item })),
    }));

    const sourceColumn = columns.find((column) => column.items.some((item) => item.id === ideaId));
    if (!sourceColumn) return;

    if (sourceColumn.status === targetStatus) {
      return;
    }

    if (!canModerateAll && !canTransitionLimited) {
      toast({
        title: 'Read-only access',
        description: 'Only moderators can reorder ideas on the board.',
      });
      return;
    }

    if (canTransitionLimited && !canModerateAll) {
      const allowedTargets = allowedOrgRepTransitions[sourceColumn.status] ?? [];
      if (!allowedTargets.includes(targetStatus)) {
        toast({
          title: 'Move requires moderator support',
          description: 'Reach out to a moderator to move ideas outside your lane.',
          variant: 'destructive',
        });
        return;
      }
    }

    const targetColumn = columns.find((column) => column.status === targetStatus);
    if (!targetColumn) return;

    const targetMeta = STATUS_COLUMNS.find((column) => column.key === targetStatus);
    const limit = targetMeta?.limit ?? Infinity;
    if (Number.isFinite(limit) && targetColumn.items.length >= limit) {
      toast({
        title: 'WIP limit reached',
        description: `Move an idea out of “${targetMeta?.label ?? targetStatus}” before adding more.`,
        variant: 'destructive',
      });
      return;
    }

    const idea = sourceColumn.items.find((item) => item.id === ideaId);
    if (!idea) return;

    setColumns((prev) =>
      prev.map((column) => {
        if (column.status === sourceColumn.status) {
          return {
            status: column.status,
            items: column.items.filter((item) => item.id !== ideaId),
          };
        }
        if (column.status === targetColumn.status) {
          return {
            status: column.status,
            items: [...column.items, { ...idea, status: targetStatus }],
          };
        }
        return column;
      }),
    );

    startTransition(async () => {
      try {
        const response = await fetch('/api/portal/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', idea_id: ideaId, status: targetStatus }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Status update failed');
        }
        toast({
          title: 'Status updated',
          description: `${idea.title} moved to ${statusLabel(targetStatus)}.`,
        });
      } catch (error) {
        toast({
          title: 'Unable to move idea',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
        setColumns(snapshot);
      }
    });
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, status: ColumnKey) => {
    event.preventDefault();
    const ideaId = event.dataTransfer.getData('text/plain');
    if (ideaId) {
      moveIdea(ideaId, status);
    }
    setDraggingId(null);
  };

  return (
    <div className="grid gap-4 overflow-x-auto pb-4 lg:grid-cols-3 xl:grid-cols-6">
      {columns.map((column) => {
        const columnMeta = STATUS_COLUMNS.find((meta) => meta.key === column.status);
        const limitLabel = columnMeta && Number.isFinite(columnMeta.limit)
          ? `${column.items.length}/${columnMeta.limit}`
          : `${column.items.length}`;

        return (
          <div
            key={column.status}
            onDragOver={(event) => {
              if (canDrag) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => handleDrop(event, column.status)}
            className="flex h-full min-w-[260px] flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                {statusLabel(column.status)}
                <Badge variant="secondary">{limitLabel}</Badge>
              </div>
              {pending && <span className="text-xs text-muted-subtle">Saving…</span>}
            </header>
            <div className="flex flex-1 flex-col gap-3">
              {column.items.map((idea) => (
                <KanbanCard
                  key={idea.id}
                  idea={idea}
                  canDrag={canDrag}
                  isDragging={draggingId === idea.id}
                  onDragStart={() => setDraggingId(idea.id)}
                  onDragEnd={() => setDraggingId(null)}
                />
              ))}
              {!column.items.length && (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-muted-subtle dark:border-slate-700 dark:text-slate-300">
                  {canDrag ? 'Drop ideas here' : 'No ideas yet'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  idea,
  canDrag,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  idea: KanbanIdea;
  canDrag: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={canDrag}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', idea.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition dark:border-slate-700 dark:bg-slate-950 ${
        canDrag ? 'cursor-move hover:shadow-md' : 'cursor-default'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <StatusBadge status={idea.status} />
        <span>👍 {idea.voteCount}</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{idea.title}</h3>
      <p className="mt-1 line-clamp-3 text-xs text-slate-600 dark:text-slate-300">
        {idea.proposalSummary || idea.problemStatement || idea.body}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
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
