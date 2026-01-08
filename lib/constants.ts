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
  { id: 4, name: 'Character', emoji: '🎭' },
  { id: 5, name: 'Season', emoji: '❄️' },
  { id: 6, name: 'Hobby', emoji: '🎨' },
  { id: 7, name: 'Food', emoji: '🍕' },
  { id: 8, name: 'Colour', emoji: '🎨' },
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
// App Configuration
// =============================================

export const APP_CONFIG = {
  name: 'Friend Gifts',
  maxAnswerLength: 500,
  sparkleCount: 25,
} as const;

// =============================================
// UI Text/Labels
// =============================================

export const MESSAGES = {
  loading: 'Loading... 🎁',
  loadingGifts: 'Loading your gifts... 🎁',
  loadingInvitations: 'Loading invitations... 🎁',
  footer: '🎄 Made with love for the holiday season 🎄',
} as const;

