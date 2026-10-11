/**
 * Version of the Terms + Privacy Policy a user agrees to at sign-up.
 * Bump this (and the "Last updated" date on the policy pages) whenever the
 * policies change, so we know which version each user accepted.
 */
export const POLICY_VERSION = '2026-10-11';

/** Stored in Clerk unsafeMetadata at sign-up, then saved on the profile. */
export interface SignupConsent {
  policy_version: string;
  age_confirmed: boolean;
  accepted_terms: boolean;
  marketing_opt_in: boolean;
  accepted_at: string; // ISO date
}

export function makeConsent(marketingOptIn: boolean): SignupConsent {
  return {
    policy_version: POLICY_VERSION,
    age_confirmed: true,
    accepted_terms: true,
    marketing_opt_in: marketingOptIn,
    accepted_at: new Date().toISOString(),
  };
}

/** Consent saved at sign-up for the current policy version, if any. */
export function readConsent(metadata: Record<string, unknown> | undefined): SignupConsent | null {
  const c = metadata?.consent as Partial<SignupConsent> | undefined;
  if (!c || c.accepted_terms !== true || c.age_confirmed !== true) return null;
  if (c.policy_version !== POLICY_VERSION) return null;
  return c as SignupConsent;
}
