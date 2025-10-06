import type { User } from '@supabase/supabase-js';
import type { PortalProfile } from '@/lib/profile';
import { resolveNameParts, type NameParts } from '@/lib/names';

export type PetitionSignerDefaults = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type Metadata = Record<string, unknown>;

function getMetadata(user: User | null): Metadata {
  return (user?.user_metadata ?? {}) as Metadata;
}

function pickFirstNonEmptyString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return undefined;
}

export function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}

function deriveNamePartsFromSources(metadata: Metadata, profile: PortalProfile | null): NameParts {
  const fullName = pickFirstNonEmptyString(
    metadata.full_name,
    metadata.name,
    metadata.preferred_username,
    profile?.display_name,
  );

  return resolveNameParts({
    firstName: metadata.first_name,
    lastName: metadata.last_name,
    fullName,
  });
}

export function deriveSignerDefaults(user: User | null, profile: PortalProfile | null): PetitionSignerDefaults | null {
  if (!user) {
    return null;
  }

  const metadata = getMetadata(user);
  const { firstName, lastName } = deriveNamePartsFromSources(metadata, profile);
  const email = normalizeEmail(metadata.email) ?? normalizeEmail(user.email);

  return {
    firstName,
    lastName,
    email,
  };
}
