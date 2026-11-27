/**
 * Chip colour a viewer sees: their own pick, else the creator's pick, so friends
 * see the colour the creator chose. `own_color` is only the viewer's pick.
 */
export function chipColors(
  colors: { user_id: { toString(): string }; color: string }[] | undefined,
  viewerId: string | null,
  creatorId: string,
): { my_color: string | null; own_color: string | null } {
  const pick = (id: string | null) =>
    (id && colors?.find((c) => c.user_id.toString() === id)?.color) || null;
  const own = pick(viewerId);
  return { my_color: own ?? pick(creatorId), own_color: own };
}
