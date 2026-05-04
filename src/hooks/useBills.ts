import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Bill {
  id: string;
  account_type: string;
  due_date: string;
  amount: number;
  amount_paid: number;
  created_at: string;
}

export function useBills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setBills([]); setLoading(false); return; }
    // Apenas mês atual — contas anteriores aparecem em Relatórios
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const next = new Date(y, m + 1, 1);
    const nextMonthStart = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .gte("due_date", monthStart)
      .lt("due_date", nextMonthStart)
      .order("due_date", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar contas", description: error.message, variant: "destructive" });
    } else {
      const seen = new Set<string>();
      const unique: Bill[] = [];
      for (const b of data || []) {
        const key = `${b.account_type}|${b.due_date}|${Number(b.amount)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push({
          id: b.id, account_type: b.account_type, due_date: b.due_date,
          amount: Number(b.amount), amount_paid: Number(b.amount_paid), created_at: b.created_at,
        });
      }
      setBills(unique);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (bill: Omit<Bill, "id" | "created_at">) => {
    if (!user) return;
    // Check for existing duplicate (same user + type + due date + amount)
    const { data: existing } = await supabase.from("bills").select("*")
      .eq("user_id", user.id)
      .eq("account_type", bill.account_type)
      .eq("due_date", bill.due_date)
      .eq("amount", bill.amount)
      .maybeSingle();
    if (existing) {
      toast({ title: "Conta já existe", description: "Uma conta idêntica já foi cadastrada.", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase.from("bills")
      .insert({ user_id: user.id, ...bill }).select().single();
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      setBills((prev) => [...prev, { id: data.id, account_type: data.account_type, due_date: data.due_date, amount: Number(data.amount), amount_paid: Number(data.amount_paid), created_at: data.created_at }]);
      toast({ title: "Conta criada" });
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Bill>) => {
    const { error } = await supabase.from("bills").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      setBills((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
      toast({ title: "Conta atualizada" });
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("bills").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setBills((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "Conta removida" });
    }
  }, []);

  return { bills, loading, add, update, remove };
}
