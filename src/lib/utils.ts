import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_NAME = 'IHARC — Integrated Homelessness and Addictions Response Centre';
export const DEFAULT_TIMEZONE = 'America/Toronto';
