/**
 * Who counts as an admin.
 *
 * - Owner admins: emails in the ADMIN_EMAILS env allowlist (comma-separated).
 *   Always admins; they can't be demoted, blocked or deleted from the panel.
 * - Everyone else: the user's `is_admin` flag, which any admin can turn on/off
 *   in Admin → Users → Moderate.
 */
export function ownerAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerAdmin(email: string | null | undefined, raw: string | undefined): boolean {
  return !!email && ownerAdminEmails(raw).includes(email.toLowerCase());
}

export function isEffectiveAdmin(
  user: { email?: string | null; is_admin?: boolean },
  raw: string | undefined,
): boolean {
  return !!user.is_admin || isOwnerAdmin(user.email, raw);
}
