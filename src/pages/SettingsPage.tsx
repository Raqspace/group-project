import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";
import { supabase } from "../services/supabaseClient";

export function SettingsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour]);
  useListenTour("settings", startTour);
  useAutoStartPageTour("settings", startTour);

  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [passwordMsg, setPasswordMsg] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const [priceAlerts, setPriceAlerts] = useState(
    localStorage.getItem("settings.priceAlerts") === "true"
  );
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem("settings.emailNotifications") === "true"
  );
  const [tradeConfirmations, setTradeConfirmations] = useState(
    localStorage.getItem("settings.tradeConfirmations") === "true"
  );

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setCurrentEmail(data.user.email);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("settings.priceAlerts", String(priceAlerts));
  }, [priceAlerts]);

  useEffect(() => {
    localStorage.setItem("settings.emailNotifications", String(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem("settings.tradeConfirmations", String(tradeConfirmations));
  }, [tradeConfirmations]);

  useEffect(() => {
    const targetRef = tour.step === 0 ? accountRef : tour.step === 1 ? notificationsRef : null;
    targetRef?.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [tour.step]);

  const handleUpdatePassword = async () => {
    setPasswordMsg("");
    setResetMsg("");
    setShowForgotPassword(false);

    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (!trimmedCurrentPassword) {
      setPasswordMsg("Please enter your current password.");
      return;
    }

    if (!trimmedNewPassword) {
      setPasswordMsg("Please enter a new password.");
      return;
    }

    if (trimmedNewPassword.length < 6) {
      setPasswordMsg("Password should be at least 6 characters.");
      return;
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setPasswordMsg("Your new password must be different from your current password.");
      return;
    }

    if (!currentEmail) {
      setPasswordMsg("Could not verify your account email.");
      return;
    }

    setLoadingPassword(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: trimmedCurrentPassword,
    });

    if (verifyError) {
      setPasswordMsg("Current password is incorrect.");
      setShowForgotPassword(true);
      setLoadingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: trimmedNewPassword,
    });

    if (updateError) {
      setPasswordMsg(`Error: ${updateError.message}`);
    } else {
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setShowForgotPassword(false);
    }

    setLoadingPassword(false);
  };

  const handleForgotPassword = async () => {
    setResetMsg("");

    if (!currentEmail) {
      setResetMsg("Could not find your account email.");
      return;
    }

    setSendingReset(true);

    const { error } = await supabase.auth.resetPasswordForEmail(currentEmail, {
      redirectTo: `${window.location.origin}/#/login`,
    });

    if (error) {
      setResetMsg(`Error: ${error.message}`);
    } else {
      setResetMsg("Password reset email sent. Please check your inbox.");
    }

    setSendingReset(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 0.8rem",
    marginTop: "0.45rem",
    borderRadius: 10,
    border: "1px solid #cdcdc7",
    background: "#fbfbf8",
    color: "#2e2e2d",
    font: "inherit",
  };

  const sectionTitleStyle: React.CSSProperties = {
    marginTop: 0,
    marginBottom: "0.35rem",
  };

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gap: "0.85rem",
  };

  const toggleRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.75rem 0",
    borderTop: "1px solid #d9d9d2",
  };

  return (
    <div ref={rootRef} style={{ maxWidth: 720, display: "grid", gap: "0.9rem" }}>
      <div ref={accountRef} className="card">
        <h3 style={sectionTitleStyle}>Account</h3>
        <p className="live-note" style={{ lineHeight: 1.55, marginTop: 0 }}>
          Manage your sign-in details here.
        </p>

        <div style={{ ...rowStyle, marginTop: "1rem" }}>
          <div>
            <label htmlFor="settings-current-email" style={{ fontWeight: 600 }}>
              Current email
            </label>
            <input
              id="settings-current-email"
              type="email"
              value={currentEmail}
              disabled
              style={{ ...inputStyle, opacity: 0.8 }}
            />
          </div>

          <div>
            <label htmlFor="settings-current-password" style={{ fontWeight: 600 }}>
              Current password
            </label>
            <input
              id="settings-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="settings-new-password" style={{ fontWeight: 600 }}>
              New password
            </label>
            <input
              id="settings-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a new password"
              style={inputStyle}
            />
            <button
              type="button"
              className="chip secondary"
              onClick={handleUpdatePassword}
              disabled={loadingPassword}
              style={{ marginTop: "0.75rem" }}
            >
              {loadingPassword ? "Updating..." : "Update Password"}
            </button>
            {passwordMsg ? <p className="live-note">{passwordMsg}</p> : null}

            {showForgotPassword ? (
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="chip"
                >
                  {sendingReset ? "Sending..." : "Forgot password?"}
                </button>
              </div>
            ) : null}

            {resetMsg ? <p className="live-note">{resetMsg}</p> : null}
          </div>
        </div>
      </div>

      <div ref={notificationsRef} className="card">
        <h3 style={sectionTitleStyle}>Notifications</h3>
        <p className="live-note" style={{ lineHeight: 1.55, marginTop: 0 }}>
          Choose which wallet updates you want to keep enabled on this device.
        </p>

        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ ...toggleRowStyle, borderTop: "none" }}>
            <div>
              <strong style={{ display: "block" }}>Price alerts</strong>
              <p className="live-note" style={{ margin: "0.2rem 0 0" }}>
                Receive alerts when tracked asset prices move.
              </p>
            </div>
            <input
              type="checkbox"
              checked={priceAlerts}
              onChange={() => setPriceAlerts((prev) => !prev)}
            />
          </div>

          <div style={toggleRowStyle}>
            <div>
              <strong style={{ display: "block" }}>Email notifications</strong>
              <p className="live-note" style={{ margin: "0.2rem 0 0" }}>
                Keep email updates enabled for account activity.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={() => setEmailNotifications((prev) => !prev)}
            />
          </div>

          <div style={toggleRowStyle}>
            <div>
              <strong style={{ display: "block" }}>Trade confirmations</strong>
              <p className="live-note" style={{ margin: "0.2rem 0 0" }}>
                Show confirmations after placing trades.
              </p>
            </div>
            <input
              type="checkbox"
              checked={tradeConfirmations}
              onChange={() => setTradeConfirmations((prev) => !prev)}
            />
          </div>
        </div>
      </div>

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={accountRef}
          title="Account settings"
          body="Review your account details here and update your password when needed."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="1 / 2"
        />
      ) : null}

      {tour.step === 1 ? (
        <WalkthroughPopup
          anchorRef={notificationsRef}
          title="Notification settings"
          body="Choose which alerts and confirmations stay enabled on this device while you use the wallet."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="2 / 2"
        />
      ) : null}
    </div>
  );
}