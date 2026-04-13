// WalletPage() — wallet creation, recovery phrase, walkthrough.
import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { RecoveryPhraseModal } from "../components/wallet/RecoveryPhraseModal";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import { generateSimRecoveryPhrase } from "../utils/simRecoveryPhrase";

type WalletRow = {
  id: string;
  user_id: string;
  public_address: string;
  balance: number;
  recovery_phrase?: string | null;
};

type HoldingRow = { id: string; symbol: string; amount: number };

export function WalletPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [revealPhrase, setRevealPhrase] = useState<string | null>(null);

  const introRef = useRef<HTMLDivElement>(null);
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const balancesRef = useRef<HTMLDivElement>(null);
  const receiveSectionRef = useRef<HTMLDivElement>(null);
  const tourContextRef = useRef({ hasWallet: false, phraseOpen: false });

  const tourCreate = useWalkthroughTour();
  const tourSaved = useWalkthroughTour();

  tourContextRef.current = { hasWallet: !!wallet, phraseOpen: !!revealPhrase };

  const startWalletTour = useCallback(() => {
    const { hasWallet: hw, phraseOpen } = tourContextRef.current;
    if (phraseOpen) return;
    if (!hw) tourCreate.start();
    else tourSaved.start();
  }, [tourCreate.start, tourSaved.start]);

  useListenTour("wallet", startWalletTour);

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (wallet) tourCreate.finish();
    else tourSaved.finish();
  }, [wallet, tourCreate.finish, tourSaved.finish]);

  const generateWalletAddress = () => {
    const chars = "0123456789abcdef";
    let address = "0x";
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)]!;
    }
    return address;
  };

  const loadWallet = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: walletData } = await supabase
      .from("Wallet")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletData) {
      setWallet(walletData as WalletRow);
      const { data: rows } = await supabase
        .from("holdings")
        .select("id, symbol, amount")
        .eq("wallet_id", (walletData as WalletRow).id);
      if (rows) setHoldings(rows as HoldingRow[]);
    } else {
      setHoldings([]);
    }
  };

  const handleCreateWallet = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to create a wallet");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("Wallet")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      setError("You already have a wallet");
      setLoading(false);
      return;
    }

    const phrase = generateSimRecoveryPhrase();
    const baseRow = {
      user_id: user.id,
      public_address: generateWalletAddress(),
      balance: 0,
    };

    let { error: walletError } = await supabase
      .from("Wallet")
      .insert({ ...baseRow, recovery_phrase: phrase });

    if (walletError) {
      const retry = await supabase.from("Wallet").insert(baseRow);
      walletError = retry.error;
    }

    if (walletError) {
      setError("Failed to create wallet. Please try again.");
      setLoading(false);
      return;
    }

    const { data: newWallet } = await supabase
      .from("Wallet")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!newWallet) {
      setError("Wallet created but could not load id.");
      setLoading(false);
      return;
    }

    await supabase.from("holdings").insert([
      { wallet_id: newWallet.id, symbol: "BTC", amount: 0.001 },
      { wallet_id: newWallet.id, symbol: "ETH", amount: 1.5 },
      { wallet_id: newWallet.id, symbol: "XRP", amount: 100 },
    ]);

    setLoading(false);
    setSuccess("Wallet created.");
    setRevealPhrase(phrase);
    await loadWallet();
  };

  const afterRecoveryContinue = () => {
    setRevealPhrase(null);
    window.location.hash = "#/portfolio";
  };

  if (revealPhrase) {
    return <RecoveryPhraseModal phrase={revealPhrase} onContinue={afterRecoveryContinue} />;
  }

  if (!wallet) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "20px", position: "relative" }}>
        <div ref={introRef}>
          <h2>Welcome to Your Crypto Wallet</h2>
          <p>You do not have a wallet yet. Create one to get started.</p>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}
        <button
          ref={createBtnRef}
          type="button"
          onClick={handleCreateWallet}
          disabled={loading}
          style={{ marginTop: "20px", padding: "12px 24px", fontSize: "16px" }}
        >
          {loading ? "Creating your wallet..." : "Create My Wallet"}
        </button>

        {tourCreate.step === 0 ? (
          <WalkthroughPopup
            anchorRef={introRef}
            title="No wallet yet"
            body="This makes a practice wallet in the app (not a real bank). You get demo coins, an address, and a recovery phrase to save."
            onClose={tourCreate.finish}
            onNext={tourCreate.next}
            showNext
            stepLabel="1 / 2"
          />
        ) : null}
        {tourCreate.step === 1 ? (
          <WalkthroughPopup
            anchorRef={createBtnRef}
            title="Create button"
            body="Creates your address, seeds BTC/ETH/XRP amounts, then shows 12 words once. Next stop: Portfolio."
            onClose={tourCreate.finish}
            onNext={tourCreate.finish}
            showNext
            nextLabel="OK"
            stepLabel="2 / 2"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px", position: "relative" }}>
      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h2>My Wallet</h2>
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: 12 }}>
          In this simulator one practice address stands in for receiving funds. Your real balances for each coin live in the{" "}
          <strong>holdings</strong> list below and match what you see on Portfolio.
        </p>
        <p>
          <strong>Address:</strong> {wallet.public_address}
        </p>
        <div ref={balancesRef} style={{ marginTop: 14 }}>
          <strong>Holdings (amounts)</strong>
          {holdings.length === 0 ? (
            <p style={{ margin: "8px 0 0", color: "#666" }}>No rows yet. They appear when the wallet is created.</p>
          ) : (
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {holdings.map((h) => (
                <li key={h.id}>
                  {h.amount} {h.symbol}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "30px", padding: "14px 16px", background: "#ecece8", borderRadius: 8, border: "1px solid #cdcdc7" }}>
        <h3 style={{ marginTop: 0 }}>Send crypto</h3>
        <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#454642" }}>
          Sends are handled on the <strong>Portfolio</strong> page so you pick the asset (BTC, ETH, XRP) and the app updates the right holding. The old ETH-only field here did not match your real balances.
        </p>
        <a href="#/portfolio" style={{ fontWeight: 600, color: "#1f3c34" }}>
          Open Portfolio to send
        </a>
      </div>

      <div ref={receiveSectionRef} style={{ marginBottom: "30px" }}>
        <h3>Receive Crypto</h3>
        <p>Share your address to receive crypto:</p>
        <div style={{ background: "#eee", padding: "10px", borderRadius: "4px", wordBreak: "break-all" }}>
          {wallet.public_address}
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(wallet.public_address)}
          style={{ marginTop: "10px" }}
        >
          Copy Address
        </button>
      </div>

      {tourSaved.step === 0 ? (
        <WalkthroughPopup
          anchorRef={balancesRef}
          title="Address + amounts"
          body="0x line = practice receive address. List = your coin counts (same as Portfolio / Dashboard math). To send, use Portfolio."
          onClose={tourSaved.finish}
          onNext={tourSaved.next}
          showNext
          stepLabel="1 / 2"
        />
      ) : null}
      {tourSaved.step === 1 ? (
        <WalkthroughPopup
          anchorRef={receiveSectionRef}
          title="Receive"
          body="Share this address so someone can send you practice coins here. Address is ok to share; recovery phrase is not."
          onClose={tourSaved.finish}
          onNext={tourSaved.finish}
          showNext
          nextLabel="Done"
          stepLabel="2 / 2"
        />
      ) : null}
    </div>
  );
}
