import copyDeckData from './copy-deck.json';
import flaggedTermsData from './flagged-terms.json';

export type CopyDeck = typeof copyDeckData;
export const copyDeck: CopyDeck = copyDeckData;

export const flaggedTerms = flaggedTermsData.terms.map((term) => term.toLowerCase());
export type FlaggedTerm = (typeof flaggedTerms)[number];

export const containsFlaggedTerm = (value: string): boolean => {
  const lowerValue = value.toLowerCase();
  return flaggedTerms.some((term) => lowerValue.includes(term));
};
