/**
 * Browser fallback when `price_alerts` is not created in Supabase yet.
 * One object in localStorage keyed by user id.
 */
import type { AlertDirection, AlertSymbol, PriceAlert } from "../../domain/entities/PriceAlert";

const STORAGE_KEY = "cw_price_alerts_v1";

type Bucket = Record<string, PriceAlert[]>;

function readAll(): Bucket {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Bucket;
    return typeof p === "object" && p !== null ? p : {};
  } catch {
    return {};
  }
}

function writeAll(b: Bucket) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
}

function findUserIdForAlert(alertId: string): string | null {
  const b = readAll();
  for (const [uid, list] of Object.entries(b)) {
    if (list.some((a) => a.id === alertId)) return uid;
  }
  return null;
}

export function listLocal(userId: string): PriceAlert[] {
  const b = readAll();
  return [...(b[userId] ?? [])].sort(
    (a, c) => new Date(c.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createLocal(params: {
  userId: string;
  symbol: AlertSymbol;
  direction: AlertDirection;
  targetPrice: number;
}): PriceAlert {
  const b = readAll();
  const list = b[params.userId] ?? [];
  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    userId: params.userId,
    symbol: params.symbol,
    direction: params.direction,
    targetPrice: params.targetPrice,
    isActive: true,
    triggeredAt: null,
    createdAt: new Date().toISOString(),
  };
  b[params.userId] = [alert, ...list];
  writeAll(b);
  return alert;
}

export function updateLocal(
  alertId: string,
  patch: Partial<{ isActive: boolean; triggeredAt: string | null }>
): void {
  const uid = findUserIdForAlert(alertId);
  if (!uid) return;
  const b = readAll();
  const list = b[uid] ?? [];
  b[uid] = list.map((a) =>
    a.id === alertId
      ? {
          ...a,
          ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
          ...(patch.triggeredAt !== undefined ? { triggeredAt: patch.triggeredAt } : {}),
        }
      : a
  );
  writeAll(b);
}

export function deleteLocal(alertId: string): void {
  const uid = findUserIdForAlert(alertId);
  if (!uid) return;
  const b = readAll();
  b[uid] = (b[uid] ?? []).filter((a) => a.id !== alertId);
  writeAll(b);
}

export function rearmLocal(alertId: string): void {
  updateLocal(alertId, { triggeredAt: null, isActive: true });
}
