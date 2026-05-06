import { supabase } from './supabase';

/**
 * Account-level operations that don't fit the per-feature service split.
 * Kept thin — currently just account deletion. Add things here only when
 * they're cross-domain (auth + multiple feature tables).
 */

/**
 * Wipes the calling user. Hits the `delete-account` Edge Function which
 * authenticates via the user's JWT, then calls auth.admin.deleteUser
 * server-side. FK cascades sweep every user-scoped table.
 *
 * On success, the caller's session is already invalidated server-side
 * but the client still has the cached tokens. Caller MUST follow up
 * with supabase.auth.signOut() to clear local state and trigger the
 * navigator to swap to the login screen.
 *
 * Throws on any non-2xx response so the UI can show an error toast and
 * keep the modal open instead of half-deleting and stranding the user.
 */
export const deleteAccount = async (): Promise<void> => {
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });
  if (error) {
    throw new Error(error.message || 'Account deletion failed');
  }
};
