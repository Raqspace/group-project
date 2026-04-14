import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import {
  hydrateTutorialProfileFromUser,
  loadCachedTutorialProfile,
  type TutorialProfile,
} from "../utils/tutorialProfile";

type TutorialProfileContextValue = {
  /** Best-effort profile for tips; null when logged out or not yet hydrated. */
  profile: TutorialProfile | null;
};

const TutorialProfileContext = createContext<TutorialProfileContextValue | undefined>(undefined);

type TutorialProfileProviderProps = {
  /** Current Supabase user from the shell; when null, profile is cleared. */
  user: User | null;
  children: ReactNode;
};

/**
 * Lives under `MainApp` so every authenticated route can call `useTutorialProfile()`
 * without prop drilling. Re-hydrates when `user.id` or metadata reference changes.
 */
export function TutorialProfileProvider({ user, children }: TutorialProfileProviderProps) {
  // Seed from sessionStorage immediately so the first frame after login can personalize before getUser effects complete.
  const [profile, setProfile] = useState<TutorialProfile | null>(() => loadCachedTutorialProfile());

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(hydrateTutorialProfileFromUser(user));
  }, [user, user?.user_metadata]);

  const value = useMemo(() => ({ profile }), [profile]);

  return <TutorialProfileContext.Provider value={value}>{children}</TutorialProfileContext.Provider>;
}

export function useTutorialProfile(): TutorialProfileContextValue {
  const ctx = useContext(TutorialProfileContext);
  if (!ctx) {
    throw new Error("useTutorialProfile must be used inside TutorialProfileProvider");
  }
  return ctx;
}
