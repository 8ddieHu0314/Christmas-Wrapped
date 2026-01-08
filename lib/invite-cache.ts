// =============================================
// Invite Page Data Cache (Module-level)
// =============================================
// Uses module-level variables to persist data across
// client-side navigation. Clears on page refresh.

interface Invitation {
  id: string;
  email: string;
  status: string;
  invite_token: string;
  created_at: string;
  hasVoted: boolean;
  calendar_code: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  calendar_code: string | null;
  [key: string]: any;
}

interface InviteCacheData {
  userData: UserData;
  invitations: Invitation[];
  userId: string;
}

// Module-level cache - persists across navigation, clears on refresh
let cache: InviteCacheData | null = null;

export function getInviteCache(userId: string): InviteCacheData | null {
  // Ensure cache belongs to current user
  if (cache && cache.userId !== userId) {
    cache = null;
    return null;
  }
  return cache;
}

export function setInviteCache(
  userId: string,
  userData: UserData,
  invitations: Invitation[]
): void {
  cache = {
    userData,
    invitations,
    userId,
  };
}

export function updateCacheInvitations(userId: string, invitations: Invitation[]): void {
  if (cache && cache.userId === userId) {
    cache.invitations = invitations;
  }
}

export function updateCacheCalendarCode(userId: string, calendarCode: string): void {
  if (cache && cache.userId === userId) {
    cache.userData = { ...cache.userData, calendar_code: calendarCode };
  }
}

export function addCacheInvitation(userId: string, invitation: Invitation): void {
  if (cache && cache.userId === userId) {
    cache.invitations = [invitation, ...cache.invitations];
  }
}

export function removeCacheInvitation(userId: string, invitationId: string): void {
  if (cache && cache.userId === userId) {
    cache.invitations = cache.invitations.filter(i => i.id !== invitationId);
  }
}

export function clearInviteCache(): void {
  cache = null;
}

export type { Invitation, UserData, InviteCacheData };

