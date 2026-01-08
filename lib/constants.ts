// =============================================
// Gift Calendar Categories
// =============================================

export interface Category {
  id: number;
  name: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Animal', emoji: '🐾' },
  { id: 2, name: 'Place', emoji: '🌍' },
  { id: 3, name: 'Plant', emoji: '🌸' },
  { id: 4, name: 'Season', emoji: '❄️' },
  { id: 5, name: 'Hobby', emoji: '🎨' },
  { id: 6, name: 'Food', emoji: '🍕' },
  { id: 7, name: 'Colour', emoji: '🎨' },
  { id: 8, name: 'Character', emoji: '🎭' },
  { id: 9, name: 'Personal Note', emoji: '💌' },
];

// =============================================
// UI Decorations
// =============================================

export interface DecorationItem {
  emoji: string;
  position: string;
  delay: string;
}

export const FLOATING_DECORATIONS: DecorationItem[] = [
  { emoji: '🎄', position: 'top-10 left-10', delay: '0s' },
  { emoji: '⭐', position: 'top-20 right-20', delay: '0.5s' },
  { emoji: '🎁', position: 'bottom-20 left-20', delay: '1s' },
  { emoji: '❄️', position: 'bottom-10 right-10', delay: '1.5s' },
];

// =============================================
// Development / Testing Flags
// =============================================

/**
 * When set to true, all gift boxes can be revealed immediately
 * without waiting for the date-based unlock countdown.
 * Set to false for production use.
 */
export const TEST_MODE = true;

