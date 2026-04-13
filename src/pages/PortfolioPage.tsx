import { useCallback, useEffect, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { supabase } from "../services/supabaseClient";
import { useListenTour } from "../utils/tourBus";
import type { UnitPricesUsd } from "../utils/unitPrices";
import { portfolioTotalUsd } from "../utils/unitPrices";

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function unitPx(symbol: string, u: UnitPricesUsd): number {
  const m: Record<string, number> = { BTC: u.BTC, ETH: u.ETH, XRP: u.XRP, USDT: u.USDT };
  return m[symbol] ?? 0;
}

type Holding = {
  id: string;
  symbol: string;
  amount: number;
};

type PortfolioPageProps = {
  unitPrices: UnitPricesUsd;
};

export function PortfolioPage({ unitPrices }: PortfolioPageProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"send" | "receive">("send");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendSymbol, setSendSymbol] = useState("ETH");
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendLoading, setSendLoading] = useState(false);

  const totalRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const holdingsRef = useRef<HTMLHeadingElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("portfolio", startTour);

  const totalUsd = portfolioTotalUsd(holdings, unitPrices);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await loadWallet();
    setLoading(false);
  };

  const loadWallet = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: walletData } = await supabase.from("Wallet").select("*").eq("user_id", user.id).single();

    if (walletData) {
      setWallet(walletData);
      loadHoldings(walletData.id);
    }
  };

  const loadHoldings = async (walletId: string) => {
    const { data } = await supabase.from("holdings").select("*").eq("wallet_id", walletId);

    if (data) setHoldings(data);
  };

  const openModal = (type: "send" | "receive") => {
    setModalType(type);
    setSendError("");
    setSendSuccess("");
    setRecipientAddress("");
    setSendAmount("");
    setShowModal(true);
  };

  const handleSend = async () => {
    setSendError("");
    setSendSuccess("");

    const amount = parseFloat(sendAmount);

    if (!recipientAddress) {
      setSendError("Please enter a recipient address");
      return;
    }
    if (!amount || amount <= 0) {
      setSendError("Please enter a valid amount");
      return;
    }

    const holding = holdings.find((h) => h.symbol === sendSymbol);
    if (!holding || holding.amount < amount) {
      setSendError("Insufficient balance");
      return;
    }
    if (recipientAddress === wallet.public_address) {
      setSendError("Cannot send to your own address");
      return;
    }

    setSendLoading(true);

    const { error: deductError } = await supabase
      .from("holdings")
      .update({ amount: holding.amount - amount })
      .eq("id", holding.id);

    if (deductError) {
      setSendError("Transaction failed");
      setSendLoading(false);
      return;
    }

    const { data: recipientWallet } = await supabase
      .from("Wallet")
      .select("id")
      .eq("public_address", recipientAddress)
      .single();

    if (recipientWallet) {
      const { data: recipientHolding } = await supabase
        .from("holdings")
        .select("*")
        .eq("wallet_id", recipientWallet.id)
        .eq("symbol", sendSymbol)
        .single();

      if (recipientHolding) {
        await supabase
          .from("holdings")
          .update({ amount: recipientHolding.amount + amount })
          .eq("id", recipientHolding.id);
      }
    }

    setSendSuccess(`Successfully sent ${amount} ${sendSymbol}`);
    setRecipientAddress("");
    setSendAmount("");
    loadWallet();
    setSendLoading(false);
  };

  if (loading) {
    return <p style={{ padding: "40px" }}>Loading portfolio...</p>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px", position: "relative" }}>
      <div
        ref={totalRef}
        style={{ background: "#1B3A5C", color: "white", padding: "24px", borderRadius: "8px", marginBottom: "30px" }}
      >
        <p style={{ margin: 0, opacity: 0.7 }}>Total portfolio value (USD)</p>
        <h2 style={{ margin: "8px 0 0" }}>{formatUsd(totalUsd)}</h2>
        <p style={{ margin: "10px 0 0", fontSize: "13px", opacity: 0.85, lineHeight: 1.45 }}>
          This is the sum of every row below: <strong>amount × today’s USD price</strong> for each coin. Dashboard uses the same prices,
          so this number should match the <strong>Portfolio total</strong> and the <strong>Holdings total</strong> there.
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "13px", opacity: 0.6 }}>
          Practice wallet: {wallet?.public_address?.slice(0, 18)}…
        </p>
      </div>

      <div ref={actionsRef} style={{ display: "flex", gap: "12px", marginBottom: "30px" }}>
        <button
          type="button"
          onClick={() => openModal("send")}
          style={{
            padding: "10px 24px",
            background: "#1B3A5C",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => openModal("receive")}
          style={{
            padding: "10px 24px",
            background: "#2E7D32",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Receive
        </button>
      </div>

      <h3 ref={holdingsRef}>My holdings</h3>
      <p style={{ margin: "0 0 14px", fontSize: "0.88rem", color: "#555" }}>
        <strong>Units</strong> = how many coins the simulator stored for you. <strong>USD value</strong> = units × the price shown. Prices
        refresh with the rest of the app (BTC, ETH, USDT from the main feed, XRP from the same snapshot).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {holdings.map((h) => {
          const up = unitPx(h.symbol, unitPrices);
          const lineUsd = h.amount * up;
          return (
            <div
              key={h.id}
              style={{
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "18px" }}>{h.symbol}</strong>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
                  {h.amount} units
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{formatUsd(lineUsd)}</strong>
                <p style={{ margin: "4px 0 0", color: "#666", fontSize: "13px" }}>
                  @ {formatUsd(up)} / unit
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {holdings.length > 0 ? (
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "#ecece8",
            borderRadius: 8,
            border: "1px solid #cdcdc7",
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
          }}
        >
          <span>Cross-check total</span>
          <span>{formatUsd(totalUsd)}</span>
        </div>
      ) : null}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px", position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>

            {modalType === "send" ? (
              <>
                <h3>Send Crypto</h3>
                {sendError && <p style={{ color: "red" }}>{sendError}</p>}
                {sendSuccess && <p style={{ color: "green" }}>{sendSuccess}</p>}

                <select
                  value={sendSymbol}
                  onChange={(e) => setSendSymbol(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="XRP">XRP</option>
                </select>

                <input
                  type="text"
                  placeholder="Recipient address (0x...)"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "10px" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  style={{ display: "block", width: "100%", padding: "8px", marginBottom: "16px" }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sendLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#1B3A5C",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {sendLoading ? "Sending..." : "Confirm Send"}
                </button>
              </>
            ) : (
              <>
                <h3>Receive Crypto</h3>
                <p>Share your wallet address to receive crypto:</p>
                <div style={{ background: "#eee", padding: "12px", borderRadius: "6px", wordBreak: "break-all", fontSize: "13px" }}>
                  {wallet?.public_address}
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(wallet?.public_address)}
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    padding: "10px",
                    background: "#2E7D32",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Copy Address
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {wallet && tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={totalRef}
          title="Total in dollars"
          body="Pretend portfolio only. This number is the sum of every coin row below (amount × price). Matches Dashboard."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="1 / 3"
        />
      ) : null}
      {wallet && tour.step === 1 ? (
        <WalkthroughPopup
          anchorRef={actionsRef}
          title="Send / Receive"
          body="Send moves one asset to another user’s address in this app. Receive shows your address to copy. Simulator only, not a real chain."
          onClose={tour.finish}
          onNext={tour.next}
          showNext
          stepLabel="2 / 3"
        />
      ) : null}
      {wallet && tour.step === 2 ? (
        <WalkthroughPopup
          anchorRef={holdingsRef}
          title="Each row"
          body="Left = how many coins you have. Right = that stack in USD. Add the right side → equals the blue total."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="3 / 3"
        />
      ) : null}
    </div>
  );
}
