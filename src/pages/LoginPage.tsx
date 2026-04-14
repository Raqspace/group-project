// Login: merges stashed signup metadata (email-confirm flow) and hydrates tip personalization cache.

import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { hydrateTutorialProfileFromUser, mergeSignupIntentIntoUser } from "../utils/tutorialProfile";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });

    if (signInErr) {
      setError(signInErr.message);
      setLoading(false);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("No user returned");
      setLoading(false);
      return;
    }

    /**
     * If the user confirmed email after signup, onboarding fields may only exist in sessionStorage —
     * merge them into Supabase metadata once, then re-read the session for fresh metadata.
     */
    await mergeSignupIntentIntoUser(user);

    const {
      data: { user: refreshed },
    } = await supabase.auth.getUser();

    const effective = refreshed ?? user;
    hydrateTutorialProfileFromUser(effective);

    window.location.hash = "#/dashboard";
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: 440, margin: "72px auto", padding: "28px 32px" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#656663" }}>
        Welcome back
      </p>
      <h2 style={{ margin: "10px 0 8px" }}>Log in</h2>
      <p className="live-note" style={{ marginTop: 0, marginBottom: "1.25rem", lineHeight: 1.55 }}>
        After you sign in, open any section — short tips run once per visit per page (replay anytime with <strong>Page tips</strong>).
      </p>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

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

      <button type="button" onClick={() => void handleLogin()} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className="live-note" style={{ marginTop: "1.25rem" }}>
        New here?{" "}
        <a href="#/signup" style={{ color: "#2f5247", fontWeight: 600 }}>
          Create an account
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
