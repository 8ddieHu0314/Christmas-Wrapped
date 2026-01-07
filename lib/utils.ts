import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize answer text: lowercase, only a-z and spaces
 * "Golden Retriever!!!" → "golden retriever"
 * "Café Mocha" → "caf mocha"
 */
export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, ' '); // collapse multiple spaces
}

