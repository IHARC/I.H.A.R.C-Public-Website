export type IdeaStatusColumn = {
  key:
    | 'new'
    | 'under_review'
    | 'in_progress'
    | 'adopted'
    | 'not_feasible'
    | 'archived';
  label: string;
  limit: number;
};

export const IDEA_STATUS_COLUMNS = [
  { key: 'new', label: 'New', limit: Number.POSITIVE_INFINITY },
  { key: 'under_review', label: 'Under review', limit: 8 },
  { key: 'in_progress', label: 'In progress', limit: 5 },
  { key: 'adopted', label: 'Adopted', limit: Number.POSITIVE_INFINITY },
  { key: 'not_feasible', label: 'Not feasible', limit: Number.POSITIVE_INFINITY },
  { key: 'archived', label: 'Archived', limit: Number.POSITIVE_INFINITY },
] as const satisfies readonly IdeaStatusColumn[];

export type IdeaStatusKey = (typeof IDEA_STATUS_COLUMNS)[number]['key'];

export function isIdeaStatusKey(value: unknown): value is IdeaStatusKey {
  return typeof value === 'string' && IDEA_STATUS_COLUMNS.some((column) => column.key === value);
}

export function getIdeaStatusMeta(status: IdeaStatusKey) {
  return IDEA_STATUS_COLUMNS.find((column) => column.key === status) ?? null;
}

export function ideaStatusLabel(status: IdeaStatusKey) {
  return getIdeaStatusMeta(status)?.label ?? status;
}

export function getIdeaStatusLimit(status: IdeaStatusKey) {
  return getIdeaStatusMeta(status)?.limit ?? Number.POSITIVE_INFINITY;
}
