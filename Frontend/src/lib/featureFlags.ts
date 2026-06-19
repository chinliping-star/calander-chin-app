/**
 * Development feature flags.
 *
 * ALL_FEATURES_FREE: during the development phase every feature is unlocked for
 * every user (no subscription). Flip to `false` to re-enable premium gating.
 */
export const ALL_FEATURES_FREE = true;

/** Effective premium status: true for everyone while ALL_FEATURES_FREE is on. */
export function effectivePremium(isPremium?: boolean): boolean {
  return ALL_FEATURES_FREE || !!isPremium;
}
