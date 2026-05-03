import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HistoricalMonth {
  month: string; // YYYY-MM
  records: any[];
  bills: any[];
  totals: { entradas: number; saidas: number; saldo: number; registrosCount: number; billsCount: number };
}

export function useHistoricalMonths() {
  const { user } = useAuth();
  const [months, setMonths] = useState<HistoricalMonth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorical = useCallback(async () => {
    if (!user) { setMonths([]); setLoading(false); return; }
    setLoading(true);

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Records and bills BEFORE current month
    const [{ data: records }, { data: bills }] = await Promise.all([
      supabase.from("financial_records").select("*").lt("data", monthStart).order("data", { ascending: false }),
      supabase.from("bills").select("*").lt("due_date", monthStart).order("due_date", { ascending: false }),
    ]);

    const map: Record<string, HistoricalMonth> = {};
    const bucket = (key: string) => {
      if (!map[key]) {
        map[key] = { month: key, records: [], bills: [], totals: { entradas: 0, saidas: 0, saldo: 0, registrosCount: 0, billsCount: 0 } };
      }
      return map[key];
    };

    (records || []).forEach((r: any) => {
      const key = String(r.data).slice(0, 7);
      const b = bucket(key);
      b.records.push(r);
      const v = Number(r.valor) || 0;
      if (r.tipo === "entrada") b.totals.entradas += v;
      else if (r.tipo === "saida") b.totals.saidas += v;
    });
    (bills || []).forEach((bi: any) => {
      const key = String(bi.due_date).slice(0, 7);
      const b = bucket(key);
      b.bills.push(bi);
    });

    Object.values(map).forEach((m) => {
      m.totals.saldo = m.totals.entradas - m.totals.saidas;
      m.totals.registrosCount = m.records.length;
      m.totals.billsCount = m.bills.length;
    });

    setMonths(Object.values(map).sort((a, b) => b.month.localeCompare(a.month)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchHistorical(); }, [fetchHistorical]);

  return { months, loading, refetch: fetchHistorical };
}
