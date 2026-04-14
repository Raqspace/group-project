/**
 * Tutorial profile: display name + goal for tip copy, cached in sessionStorage for a fast first paint.
 * Supabase `user.user_metadata` is the source of truth (`display_name`, `primary_goal`).
 */

import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

/** What the user said they care about on signup (drives copy, not product logic). */
export type PrimaryGoal = "explore" | "trade" | "track";

/** Normalized shape consumed by walkthrough copy helpers and React context. */
export type TutorialProfile = {
  displayName: string;
  primaryGoal: PrimaryGoal;
};

const SESSION_PROFILE_KEY = "cw_tutorial_profile_cache";
const SIGNUP_INTENT_KEY = "cw_signup_intent_profile";

const GOALS: PrimaryGoal[] = ["explore", "trade", "track"];

function normalizeGoal(raw: unknown): PrimaryGoal {
  if (typeof raw === "string" && GOALS.includes(raw as PrimaryGoal)) return raw as PrimaryGoal;
  return "explore";
}

/** Shown in the sidebar and used in personalized tip lines. */
export function pickDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    "";
  if (fromMeta) return fromMeta;
  const email = user.email ?? "";
  const local = email.split("@")[0];
  return local || "there";
}

export function hydrateTutorialProfileFromUser(user: User): TutorialProfile {
  const meta = user.user_metadata ?? {};
  const profile: TutorialProfile = {
    displayName: pickDisplayName(user),
    primaryGoal: normalizeGoal(meta.primary_goal),
  };
  try {
    sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode / quota */
  }
  return profile;
}

export function loadCachedTutorialProfile(): TutorialProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TutorialProfile>;
    if (!parsed.displayName) return null;
    return {
      displayName: parsed.displayName,
      primaryGoal: normalizeGoal(parsed.primaryGoal),
    };
  } catch {
    return null;
  }
}

export function clearTutorialSessionProfileCache() {
  try {
    sessionStorage.removeItem(SESSION_PROFILE_KEY);
  } catch {
    /* noop */
  }
}

/** Clears per-page “already auto-tipped this session” flags so the next login can show intros again. */
export function clearSessionTourFlags() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("cw_session_tour_")) sessionStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
}

export type SignupIntentPayload = {
  email: string;
  display_name: string;
  primary_goal: PrimaryGoal;
};

export function stashSignupIntentForFirstLogin(payload: SignupIntentPayload) {
  try {
    sessionStorage.setItem(SIGNUP_INTENT_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export async function mergeSignupIntentIntoUser(user: User): Promise<void> {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(SIGNUP_INTENT_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  try {
    const intent = JSON.parse(raw) as SignupIntentPayload;
    if (!intent.email || intent.email.toLowerCase() !== (user.email ?? "").toLowerCase()) return;

    await supabase.auth.updateUser({
      data: {
        display_name: intent.display_name,
        primary_goal: intent.primary_goal,
      },
    });
    sessionStorage.removeItem(SIGNUP_INTENT_KEY);
  } catch {
    /* non-fatal */
  }
}

export function personalizedTourLead(
  profile: TutorialProfile | null,
  surface: "dashboard" | "deposit" | "trade" | "portfolio"
): string {
  if (!profile) return "";
  const { displayName, primaryGoal } = profile;
  switch (surface) {
    case "dashboard":
      if (primaryGoal === "trade") {
        return `Hi ${displayName} — you chose trading as a focus. This screen tracks totals and live quotes; Deposit funds GBP, then use Trade.`;
      }
      if (primaryGoal === "track") {
        return `Hi ${displayName} — you want to track performance. The big total here matches Portfolio so you always get one consistent number.`;
      }
      return `Hi ${displayName} — quick orientation: totals are yours, small cards are market prices for context.`;
    case "deposit":
      if (primaryGoal === "trade") {
        return `${displayName}, funding here unlocks buys on Trade.`;
      }
      return `${displayName}, add GBP on this page before you buy crypto elsewhere in the app.`;
    case "trade":
      if (primaryGoal === "trade") {
        return `${displayName}, this is the hub for turning GBP into coins (and back).`;
      }
      return `${displayName}, swaps run here using your GBP balance and holdings.`;
    case "portfolio":
      if (primaryGoal === "track") {
        return `${displayName}, you’ll use this view most to see how holdings stack up in USD.`;
      }
      return `${displayName}, holdings and send/receive tools live here after you trade.`;
    default:
      return "";
  }
}

export function withPersonalizedLead(
  profile: TutorialProfile | null,
  surface: Parameters<typeof personalizedTourLead>[1],
  body: string
): string {
  const lead = personalizedTourLead(profile, surface);
  return lead ? `${lead}\n\n${body}` : body;
}
