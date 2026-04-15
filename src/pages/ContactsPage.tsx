import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WalkthroughPopup } from "../components/walkthrough/WalkthroughPopup";
import { useAutoStartPageTour } from "../hooks/useAutoStartPageTour";
import { useWalkthroughTour } from "../hooks/useWalkthroughTour";
import { useListenTour } from "../utils/tourBus";
import { supabase } from "../services/supabaseClient";

type ContactRow = {
  key: string;
  username: string;
  address: string;
  label: string;
  sendCount: number;
  receiveCount: number;
  totalCount: number;
};

const PAGE_SIZE = 4;

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function ContactsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tour = useWalkthroughTour();
  const startTour = useCallback(() => tour.start(), [tour.start]);
  useListenTour("contacts", startTour);
  useAutoStartPageTour("contacts", startTour);

  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const { data: myWallet, error: myWalletError } = await supabase
      .from("Wallet")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (myWalletError) {
      console.error("load my wallet failed:", myWalletError);
    }

    const { data: savedContacts, error: savedContactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("owner_user_id", user.id);

    if (savedContactsError) {
      console.error("load contacts failed:", savedContactsError);
    }

    const { data: sentTx, error: sentTxError } = await supabase
      .from("transactions")
      .select("*")
      .eq("sender_wallet_id", myWallet.id);

    if (sentTxError) {
      console.error("load sent transactions failed:", sentTxError);
    }

    const { data: receivedTx, error: receivedTxError } = await supabase
      .from("transactions")
      .select("*")
      .eq("recipient_wallet_id", myWallet.id);

    if (receivedTxError) {
      console.error("load received transactions failed:", receivedTxError);
    }

    const walletIds = new Set<string>();
    const addressByWalletId: Record<string, string> = {};
    const labelByWalletId: Record<string, string> = {};
    const usernameByWalletId: Record<string, string> = {};
    const sendCountByWalletId: Record<string, number> = {};
    const receiveCountByWalletId: Record<string, number> = {};


    (savedContacts || []).forEach((c: any) => {
      if (c.contact_wallet_id) walletIds.add(c.contact_wallet_id);

      if (c.contact_wallet_id && c.contact_address) {
        addressByWalletId[c.contact_wallet_id] = c.contact_address;
      }

      if (c.contact_wallet_id && c.label) {
        labelByWalletId[c.contact_wallet_id] = c.label;
      }

      if (c.contact_wallet_id && c.username) {
        usernameByWalletId[c.contact_wallet_id] = c.username;
      }
    });

    (sentTx || []).forEach((tx: any) => {
      const id = tx.recipient_wallet_id;
      if (!id) return;
      walletIds.add(id);
      sendCountByWalletId[id] = (sendCountByWalletId[id] || 0) + 1;
    });

    (receivedTx || []).forEach((tx: any) => {
      const id = tx.sender_wallet_id;
      if (!id) return;
      walletIds.add(id);
      receiveCountByWalletId[id] = (receiveCountByWalletId[id] || 0) + 1;
    });

    const walletIdList = Array.from(walletIds);

    let walletRows: any[] = [];
    if (walletIdList.length > 0) {
      const { data } = await supabase.from("Wallet").select("*").in("id", walletIdList);
      walletRows = data || [];
    }

    const walletMap: Record<string, any> = {};
    walletRows.forEach((w: any) => {
      walletMap[w.id] = w;
      if (w.public_address) addressByWalletId[w.id] = w.public_address;
    });

    const rows: ContactRow[] = walletIdList.map((walletId) => {
      const wallet = walletMap[walletId];
      const username =
        usernameByWalletId[walletId] ||
        wallet?.username ||
        "Unknown user";

      const sendCount = sendCountByWalletId[walletId] || 0;
      const receiveCount = receiveCountByWalletId[walletId] || 0;

      return {
        key: walletId,
        username,
        address: addressByWalletId[walletId] || "",
        label: labelByWalletId[walletId] || "",
        sendCount,
        receiveCount,
        totalCount: sendCount + receiveCount,
      };
    });

    rows.sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      if (b.sendCount !== a.sendCount) return b.sendCount - a.sendCount;
      return b.receiveCount - a.receiveCount;
    });

    setContacts(rows);
    setPage(0);
    setLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(contacts.length / PAGE_SIZE));

  const pagedContacts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return contacts.slice(start, start + PAGE_SIZE);
  }, [contacts, page]);

  return (
    <div
      ref={rootRef}
      style={{
        maxWidth: 760,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        minHeight: "700px",
        paddingTop: "12px",
      }}
    >
        <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>Contacts</h3>
        <p className="live-note" style={{ lineHeight: 1.55, marginBottom: 18 }}>
          Saved recipients and people you interact with most often. Ranked by total send + receive count.
        </p>

        {loading ? (
          <p>Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <p style={{ color: "#666" }}>
            No contacts yet. Send crypto from Portfolio and save the recipient as a contact.
          </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "stretch",
                minHeight: "520px",
              }}
            >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pagedContacts.map((contact) => (
                <div
                  key={contact.key}
                  style={{
                    background: "#f7f7f7",
                    borderRadius: "10px",
                    padding: "16px",
                    border: "1px solid #e1e1e1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                        <div style={{ fontSize: "18px", fontWeight: 700 }}>
                          {contact.username || "Unknown user"}
                        </div>

                        <div style={{ fontSize: "13px", color: "#888" }}>
                          {contact.label || "No label"}
                        </div>
                      </div>

                      <div style={{ color: "#666", fontSize: "13px", wordBreak: "break-all", marginTop: "8px" }}>
                        {contact.address ? contact.address : "No saved address"}
                      </div>
                    </div>

                    <div style={{ minWidth: "190px", fontSize: "14px" }}>
                      <div style={{ marginBottom: "6px" }}>
                        <strong>Send:</strong> {contact.sendCount}
                      </div>
                      <div style={{ marginBottom: "6px" }}>
                        <strong>Receive:</strong> {contact.receiveCount}
                      </div>
                      <div>
                        <strong>Total:</strong> {contact.totalCount}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: "14px", color: "#666" }}>
                Page {page + 1} of {totalPages}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: page === 0 ? "#cfcfcf" : "#1B3A5C",
                    color: "white",
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous page
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: page >= totalPages - 1 ? "#cfcfcf" : "#1B3A5C",
                    color: "white",
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Next page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {tour.step === 0 ? (
        <WalkthroughPopup
          anchorRef={rootRef}
          title="Contacts"
          body="This page shows the people you interact with most. It ranks them by total send and receive count."
          onClose={tour.finish}
          onNext={tour.finish}
          showNext
          nextLabel="Done"
          stepLabel="1 / 1"
        />
      ) : null}
    </div>
  );
}