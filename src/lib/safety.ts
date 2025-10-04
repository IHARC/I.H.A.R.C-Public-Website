const PII_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b\+?1?[-.\s]?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3,5}\s+[\w\s]+(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|court|ct|lane|ln)\b/i,
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+\d{4,5}\b/, // name + number combos
];

const PROFANITY_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'asshole',
  'slut',
  'cunt',
];

export type SafetyScanResult = {
  hasPii: boolean;
  hasProfanity: boolean;
  matches: {
    pii: string[];
    profanity: string[];
  };
};

export function scanContentForSafety(content: string): SafetyScanResult {
  const piiMatches = PII_PATTERNS
    .map((pattern) => content.match(pattern))
    .filter(Boolean)
    .map((match) => match![0]);

  const normalized = content.toLowerCase();
  const profanityMatches = PROFANITY_WORDS.filter((word) => normalized.includes(word));

  return {
    hasPii: piiMatches.length > 0,
    hasProfanity: profanityMatches.length > 0,
    matches: {
      pii: piiMatches,
      profanity: profanityMatches,
    },
  };
}

export function sanitizeForAudit<T>(value: T): T {
  if (typeof value === 'string') {
    return (value.length > 500 ? `${value.slice(0, 500)}…` : value) as T;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(entries.map(([key, val]) => [key, sanitizeForAudit(val)])) as T;
  }

  return value;
}
