import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ClosureSummary {
  id: string;
  month: string; // YYYY-MM
  closed_at: string;
  totals: { entradas: number; saidas: number; saldo: number; registrosCount: number; billsCount: number };
}

export interface ClosureFull extends ClosureSummary {
  records: any[];
  bills: any[];
}

function monthOf(dateStr: string) {
  return dateStr.slice(0, 7);
}

export function useMonthlyClosure() {
  const { user } = useAuth();
  const [closures, setClosures] = useState<ClosureSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClosures = useCallback(async () => {
    if (!user) { setClosures([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("monthly_closures")
      .select("id, month, closed_at, totals")
      .order("month", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar relatórios", description: error.message, variant: "destructive" });
    } else {
      setClosures((data || []) as any);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchClosures(); }, [fetchClosures]);

  const loadClosure = useCallback(async (month: string): Promise<ClosureFull | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("monthly_closures")
      .select("*")
      .eq("month", month)
      .maybeSingle();
    if (error) {
      toast({ title: "Erro ao abrir relatório", description: error.message, variant: "destructive" });
      return null;
    }
    return data as any;
  }, [user]);

  /**
   * Closes a specific month. Takes a snapshot of all financial_records and bills
   * whose date falls in that month, persists them to monthly_closures, then
   * deletes those rows from the live tables.
   */
  const closeMonth = useCallback(async (month?: string) => {
    if (!user) return false;

    // Default = current month
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthStart = `${targetMonth}-01`;
    // Compute next month start
    const [y, m] = targetMonth.split("-").map(Number);
    const next = new Date(y, m, 1);
    const nextMonthStart = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

    // Already closed?
    const { data: existing } = await supabase
      .from("monthly_closures")
      .select("id")
      .eq("month", targetMonth)
      .maybeSingle();
    if (existing) {
      toast({ title: "Mês já encerrado", description: `O mês ${targetMonth} já está nos Relatórios.`, variant: "destructive" });
      return false;
    }

    // Fetch records of that month
    const { data: records, error: recErr } = await supabase
      .from("financial_records")
      .select("*")
      .gte("data", monthStart)
      .lt("data", nextMonthStart);
    if (recErr) {
      toast({ title: "Erro ao buscar registros", description: recErr.message, variant: "destructive" });
      return false;
    }

    const { data: bills, error: billErr } = await supabase
      .from("bills")
      .select("*")
      .gte("due_date", monthStart)
      .lt("due_date", nextMonthStart);
    if (billErr) {
      toast({ title: "Erro ao buscar contas", description: billErr.message, variant: "destructive" });
      return false;
    }

    if ((!records || records.length === 0) && (!bills || bills.length === 0)) {
      toast({ title: "Nada a fechar", description: `Não há dados para o mês ${targetMonth}.` });
      return false;
    }

    const entradas = (records || []).filter((r: any) => r.tipo === "entrada").reduce((s: number, r: any) => s + Number(r.valor), 0);
    const saidas = (records || []).filter((r: any) => r.tipo === "saida").reduce((s: number, r: any) => s + Number(r.valor), 0);

    const totals = {
      entradas,
      saidas,
      saldo: entradas - saidas,
      registrosCount: records?.length || 0,
      billsCount: bills?.length || 0,
    };

    // Insert snapshot
    const { error: insErr } = await supabase.from("monthly_closures").insert({
      user_id: user.id,
      month: targetMonth,
      records: records || [],
      bills: bills || [],
      totals,
    });
    if (insErr) {
      toast({ title: "Erro ao salvar relatório", description: insErr.message, variant: "destructive" });
      return false;
    }

    // Delete originals
    if (records && records.length) {
      const ids = records.map((r: any) => r.id);
      await supabase.from("financial_records").delete().in("id", ids);
    }
    if (bills && bills.length) {
      const ids = bills.map((b: any) => b.id);
      await supabase.from("bills").delete().in("id", ids);
    }

    toast({ title: "Mês encerrado", description: `${targetMonth} foi movido para Relatórios.` });
    await fetchClosures();
    return true;
  }, [user, fetchClosures]);

  return { closures, loading, closeMonth, loadClosure, refetch: fetchClosures };
}

export { monthOf };
