/**
 * Derive a 1-2 letter monogram from an email address for avatar placeholders.
 * Splits the local-part on `.`, `_`, `-` and takes the first character of the
 * first one or two segments. Returns "—" when the input is empty so the
 * avatar slot still has something to render.
 */
export const deriveInitials = (email?: string | null): string => {
  if (!email) return '—';
  const local = email.split('@')[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return (local[0] ?? '—').toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
