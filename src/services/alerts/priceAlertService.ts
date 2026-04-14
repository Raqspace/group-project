import type { AlertDirection, AlertSymbol, PriceAlert } from "../../domain/entities/PriceAlert";
import {
  createLocal,
  deleteLocal,
  listLocal,
  rearmLocal,
  updateLocal,
} from "./priceAlertLocalStore";
import { supabase } from "../supabaseClient";

type Row = {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  target_price: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
};

/** After the first failed Supabase call for this tab, we stay on local storage until reload. */
let activeBackend: "supabase" | "local" = "supabase";

export function getPriceAlertsBackend(): "supabase" | "local" {
  return activeBackend;
}

function isTableMissingError(e: unknown): boolean {
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = String((e as { code?: string }).code ?? "");
    if (code === "PGRST205" || code === "42P01") return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.toLowerCase();
  return (
    m.includes("price_alerts") ||
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find the table")
  );
}

function fromRow(r: Row): PriceAlert {
  return {
    id: r.id,
    userId: r.user_id,
    symbol: r.symbol as AlertSymbol,
    direction: r.direction as AlertDirection,
    targetPrice: Number(r.target_price),
    isActive: r.is_active,
    triggeredAt: r.triggered_at,
    createdAt: r.created_at,
  };
}

export async function listPriceAlertsForUser(userId: string): Promise<PriceAlert[]> {
  if (activeBackend === "local") {
    return listLocal(userId);
  }
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isTableMissingError(error)) {
      activeBackend = "local";
      return listLocal(userId);
    }
    throw error;
  }
  activeBackend = "supabase";
  return (data as Row[]).map(fromRow);
}

export async function createPriceAlert(params: {
  userId: string;
  symbol: AlertSymbol;
  direction: AlertDirection;
  targetPrice: number;
}): Promise<PriceAlert> {
  if (activeBackend === "local") {
    return createLocal(params);
  }
  const { data, error } = await supabase
    .from("price_alerts")
    .insert({
      user_id: params.userId,
      symbol: params.symbol,
      direction: params.direction,
      target_price: params.targetPrice,
      is_active: true,
      triggered_at: null,
    })
    .select()
    .single();

  if (error) {
    if (isTableMissingError(error)) {
      activeBackend = "local";
      return createLocal(params);
    }
    throw error;
  }
  activeBackend = "supabase";
  return fromRow(data as Row);
}

export async function updatePriceAlert(
  id: string,
  patch: Partial<{ isActive: boolean; triggeredAt: string | null }>
): Promise<void> {
  if (activeBackend === "local") {
    updateLocal(id, patch);
    return;
  }
  const row: Record<string, unknown> = {};
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (patch.triggeredAt !== undefined) row.triggered_at = patch.triggeredAt;

  const { error } = await supabase.from("price_alerts").update(row).eq("id", id);
  if (error) {
    if (isTableMissingError(error)) {
      activeBackend = "local";
      updateLocal(id, patch);
      return;
    }
    throw error;
  }
}

export async function deletePriceAlert(id: string): Promise<void> {
  if (activeBackend === "local") {
    deleteLocal(id);
    return;
  }
  const { error } = await supabase.from("price_alerts").delete().eq("id", id);
  if (error) {
    if (isTableMissingError(error)) {
      activeBackend = "local";
      deleteLocal(id);
      return;
    }
    throw error;
  }
}

export async function rearmPriceAlert(id: string): Promise<void> {
  if (activeBackend === "local") {
    rearmLocal(id);
    return;
  }
  const { error } = await supabase
    .from("price_alerts")
    .update({ triggered_at: null, is_active: true })
    .eq("id", id);
  if (error) {
    if (isTableMissingError(error)) {
      activeBackend = "local";
      rearmLocal(id);
      return;
    }
    throw error;
  }
}

export function isAlertConditionMet(alert: PriceAlert, liveUsd: number): boolean {
  if (!alert.isActive || alert.triggeredAt) return false;
  if (alert.direction === "above") return liveUsd >= alert.targetPrice;
  return liveUsd <= alert.targetPrice;
}
