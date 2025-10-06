export type NameParts = {
  firstName?: string;
  lastName?: string;
};

/**
 * Trims and normalizes a name fragment, returning undefined when no characters remain.
 */
export function normalizeNamePart(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Resolves usable first and last name values by combining explicit parts with a fallback full name.
 */
export function resolveNameParts({
  firstName,
  lastName,
  fullName,
}: {
  firstName?: unknown;
  lastName?: unknown;
  fullName?: unknown;
}): NameParts {
  const normalizedFirst = normalizeNamePart(firstName);
  const normalizedLast = normalizeNamePart(lastName);

  if (normalizedFirst && normalizedLast) {
    return {
      firstName: normalizedFirst,
      lastName: normalizedLast,
    };
  }

  const normalizedFullName = normalizeNamePart(fullName);
  if (!normalizedFullName) {
    return {
      firstName: normalizedFirst,
      lastName: normalizedLast,
    };
  }

  const parts = normalizedFullName.split(/\s+/).filter(Boolean);
  const fallbackFirst = normalizedFirst ?? parts[0];
  const fallbackLast = normalizedLast ?? (parts.length > 1 ? parts.slice(1).join(' ') : undefined);

  return {
    firstName: fallbackFirst,
    lastName: fallbackLast,
  };
}
