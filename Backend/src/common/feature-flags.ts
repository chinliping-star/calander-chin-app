/**
 * Development feature flags.
 *
 * DEV_UNLOCK_ALL: during the development phase every premium feature/limit is
 * unlocked for every user (no subscription). Set to `false` to re-enable gating.
 */
export const DEV_UNLOCK_ALL = true;

/** Effective premium status: true for everyone while DEV_UNLOCK_ALL is on. */
export function effectivePremium(isPremium: boolean): boolean {
  return DEV_UNLOCK_ALL || isPremium;
}
