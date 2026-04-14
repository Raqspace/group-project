import { useCallback, useEffect, useState } from "react";
import type { PriceAlert } from "../domain/entities/PriceAlert";
import type { LivePricesUsd } from "../services/prices/priceService";
import {
  createPriceAlert,
  deletePriceAlert,
  getPriceAlertsBackend,
  isAlertConditionMet,
  listPriceAlertsForUser,
  rearmPriceAlert,
  updatePriceAlert,
} from "../services/alerts/priceAlertService";
import { supabase } from "../services/supabaseClient";

async function applyFiresIfNeeded(list: PriceAlert[], prices: LivePricesUsd, userId: string): Promise<PriceAlert[]> {
  const toFire = list.filter((a) => isAlertConditionMet(a, prices[a.symbol]));
  if (toFire.length === 0) return list;
  const now = new Date().toISOString();
  for (const a of toFire) {
    await updatePriceAlert(a.id, { triggeredAt: now, isActive: false });
  }
  return listPriceAlertsForUser(userId);
}

export function usePriceAlerts(prices: LivePricesUsd | null) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<"supabase" | "local">(() => getPriceAlertsBackend());

  const loadAndEvaluate = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      let list = await listPriceAlertsForUser(user.id);
      if (prices) {
        list = await applyFiresIfNeeded(list, prices, user.id);
      }
      setAlerts(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load alerts";
      setError(
        msg.toLowerCase().includes("price_alerts") || msg.includes("schema cache")
          ? "Price alerts table not found. Run supabase/price_alerts.sql in your Supabase SQL editor."
          : msg
      );
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [prices]);

  useEffect(() => {
    void loadAndEvaluate();
  }, [loadAndEvaluate]);

  const addAlert = useCallback(
    async (input: { symbol: PriceAlert["symbol"]; direction: PriceAlert["direction"]; targetPrice: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      await createPriceAlert({
        userId: user.id,
        symbol: input.symbol,
        direction: input.direction,
        targetPrice: input.targetPrice,
      });
      await loadAndEvaluate();
    },
    [loadAndEvaluate]
  );

  const removeAlert = useCallback(
    async (id: string) => {
      await deletePriceAlert(id);
      await loadAndEvaluate();
    },
    [loadAndEvaluate]
  );

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) => {
      await updatePriceAlert(id, { isActive });
      await loadAndEvaluate();
    },
    [loadAndEvaluate]
  );

  const rearm = useCallback(
    async (id: string) => {
      await rearmPriceAlert(id);
      await loadAndEvaluate();
    },
    [loadAndEvaluate]
  );

  return { alerts, loading, error, backend, refresh: loadAndEvaluate, addAlert, removeAlert, toggleActive, rearm };
}
