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
  const [newPassword, setNewPassword] = useState("");

  const [passwordMsg, setPasswordMsg] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

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

    const trimmedPassword = newPassword.trim();

    if (!trimmedPassword) {
      setPasswordMsg("Please enter a new password.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setPasswordMsg("Password should be at least 6 characters.");
      return;
    }

    setLoadingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: trimmedPassword,
    });

    if (error) {
      setPasswordMsg(`Error: ${error.message}`);
    } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
    }

    setLoadingPassword(false);
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
          body="Update your email and password here. Email changes may require inbox confirmation before they take effect."
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