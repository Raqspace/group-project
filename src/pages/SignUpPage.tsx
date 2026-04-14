// Registration: collects lightweight personalization for contextual tips (metadata + session cache).

import { useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { hydrateTutorialProfileFromUser, type PrimaryGoal, stashSignupIntentForFirstLogin } from "../utils/tutorialProfile";

const GOAL_OPTIONS: { value: PrimaryGoal; label: string; hint: string }[] = [
  { value: "explore", label: "Look around", hint: "General tour of the simulator" },
  { value: "trade", label: "Buy & sell", hint: "Tips emphasize Deposit → Trade" },
  { value: "track", label: "Track value", hint: "Tips emphasize Dashboard & Portfolio totals" },
];

/** Parse `#/signup?goal=trade` from the hash (path is stripped by the router; query remains on `location.hash`). */
function readGoalFromHash(): PrimaryGoal {
  const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  const query = raw.split("?")[1] ?? "";
  const g = new URLSearchParams(query).get("goal");
  if (g === "trade" || g === "track" || g === "explore") return g;
  return "explore";
}

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(() => readGoalFromHash());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  /** Shown on the email-confirmation welcome screen so the chosen name is visible immediately. */
  const [welcomeName, setWelcomeName] = useState<string | null>(null);

  const trimmedName = useMemo(() => displayName.trim(), [displayName]);

  const handleSignUp = async () => {
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const metaName = trimmedName || email.split("@")[0] || "there";

    const { data, error: signErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: metaName,
          primary_goal: primaryGoal,
        },
      },
    });

    if (signErr) {
      setError(signErr.message);
      setLoading(false);
      return;
    }

    /** Immediate session (e.g. email confirmation off): go straight into the app. */
    if (data.session && data.user) {
      hydrateTutorialProfileFromUser(data.user);
      window.location.hash = "#/dashboard";
      setLoading(false);
      return;
    }

    /**
     * Email-confirmation flow: no session yet — stash answers locally so first login can merge into `user_metadata`.
     */
    if (data.user?.email) {
      stashSignupIntentForFirstLogin({
        email: data.user.email,
        display_name: metaName,
        primary_goal: primaryGoal,
      });
    }

    setWelcomeName(metaName);
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="card" style={{ maxWidth: 440, margin: "72px auto", padding: "28px 32px" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#656663" }}>
          Almost there
        </p>
        <h2 style={{ margin: "10px 0 12px" }}>
          {welcomeName ? (
            <>
              Welcome, <span style={{ color: "#2f5247" }}>{welcomeName}</span>
            </>
          ) : (
            "Welcome"
          )}
        </h2>
        <p className="live-note" style={{ marginBottom: "1rem", lineHeight: 1.55 }}>
          Your account is ready. If this project asks you to confirm email, use the link in your inbox — then sign in. Your display name
          and focus show in the sidebar and in page tips.
        </p>
        <a className="chip" href="#/login" style={{ textDecoration: "none", display: "inline-block" }}>
          Go to log in
        </a>
        <p style={{ marginTop: "1.25rem", marginBottom: 0 }}>
          <a href="#/home" className="live-note" style={{ color: "#2f5247", fontWeight: 600 }}>
            ← Back to home
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 440, margin: "72px auto", padding: "28px 32px" }}>
      <h2 style={{ marginTop: 0 }}>Create account</h2>
      <p className="live-note" style={{ marginBottom: "1.25rem", lineHeight: 1.55 }}>
        Choose a focus and optional display name — they appear in the <strong>sidebar</strong> and in <strong>personalized tips</strong>{" "}
        on each page. Skip the name and we use the part of your email before @.
      </p>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>What’s your focus?</label>
      <select
        value={primaryGoal}
        onChange={(e) => setPrimaryGoal(e.target.value as PrimaryGoal)}
        style={{ display: "block", marginBottom: "12px", width: "100%", padding: "8px" }}
      >
        {GOAL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} — {o.hint}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Display name (optional)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "100%", padding: "8px" }}
      />

      <button type="button" onClick={() => void handleSignUp()} disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>

      <p className="live-note" style={{ marginTop: "1.25rem" }}>
        Already have an account?{" "}
        <a href="#/login" style={{ color: "#2f5247", fontWeight: 600 }}>
          Log in
        </a>
      </p>
      <p className="live-note" style={{ marginTop: "0.5rem" }}>
        <a href="#/home" style={{ color: "#656663" }}>
          ← Home
        </a>
      </p>
    </div>
  );
}
