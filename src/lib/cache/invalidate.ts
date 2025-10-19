import { revalidatePath, revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './tags';

type InvalidateOptions = {
  ideaId?: string;
  planSlug?: string;
  petitionSlug?: string;
  pitSlug?: string;
  extraTags?: string[];
  paths?: string[];
};

export async function invalidateIdeaCaches(options: InvalidateOptions = {}) {
  const tasks: Array<Promise<void>> = [
    revalidateTag(CACHE_TAGS.ideasList),
  ];

  if (options.ideaId) {
    tasks.push(revalidateTag(CACHE_TAGS.idea(options.ideaId)));
    tasks.push(revalidateTag(CACHE_TAGS.ideaComments(options.ideaId)));
    tasks.push(revalidateTag(CACHE_TAGS.ideaReactions(options.ideaId)));
  }

  if (options.extraTags) {
    for (const tag of options.extraTags) {
      tasks.push(revalidateTag(tag));
    }
  }

  if (options.paths) {
    for (const path of options.paths) {
      tasks.push(revalidatePath(path));
    }
  }

  await Promise.all(tasks);
}

export async function invalidateMetricCaches() {
  await revalidateTag(CACHE_TAGS.metrics);
}

export async function invalidatePlanCaches(options: InvalidateOptions = {}) {
  const tasks: Array<Promise<void>> = [revalidateTag(CACHE_TAGS.plansList)];
  if (options.planSlug) {
    tasks.push(revalidateTag(CACHE_TAGS.plan(options.planSlug)));
  }

  if (options.paths) {
    for (const path of options.paths) {
      tasks.push(revalidatePath(path));
    }
  }

  if (options.extraTags) {
    for (const tag of options.extraTags) {
      tasks.push(revalidateTag(tag));
    }
  }

  await Promise.all(tasks);
}

export async function invalidateMythCaches(options: Omit<InvalidateOptions, 'ideaId' | 'planSlug' | 'petitionSlug' | 'pitSlug'> = {}) {
  const tasks: Array<Promise<void>> = [revalidateTag(CACHE_TAGS.mythEntries)];

  if (options.paths) {
    for (const path of options.paths) {
      tasks.push(revalidatePath(path));
    }
  }

  if (options.extraTags) {
    for (const tag of options.extraTags) {
      tasks.push(revalidateTag(tag));
    }
  }

  await Promise.all(tasks);
}

export async function invalidatePitCaches(options: Omit<InvalidateOptions, 'ideaId' | 'planSlug' | 'petitionSlug'> = {}) {
  const tasks: Array<Promise<void>> = [revalidateTag(CACHE_TAGS.pitSummary)];

  if (options.pitSlug) {
    tasks.push(revalidateTag(CACHE_TAGS.pitCount(options.pitSlug)));
  }

  if (options.paths) {
    for (const path of options.paths) {
      tasks.push(revalidatePath(path));
    }
  }

  if (options.extraTags) {
    for (const tag of options.extraTags) {
      tasks.push(revalidateTag(tag));
    }
  }

  await Promise.all(tasks);
}

export async function invalidatePetitionCaches(slug: string, options: Omit<InvalidateOptions, 'petitionSlug' | 'planSlug' | 'ideaId'> = {}) {
  const tasks: Array<Promise<void>> = [
    revalidateTag(CACHE_TAGS.petition(slug)),
    revalidateTag(CACHE_TAGS.petitionSigners(slug)),
  ];

  if (options.paths) {
    for (const path of options.paths) {
      tasks.push(revalidatePath(path));
    }
  }

  if (options.extraTags) {
    for (const tag of options.extraTags) {
      tasks.push(revalidateTag(tag));
    }
  }

  await Promise.all(tasks);
}
