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
    const { data, error } = await supabase.from("bills").select("*").order("due_date", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar contas", description: error.message, variant: "destructive" });
    } else {
      setBills((data || []).map((b) => ({
        id: b.id, account_type: b.account_type, due_date: b.due_date,
        amount: Number(b.amount), amount_paid: Number(b.amount_paid), created_at: b.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (bill: Omit<Bill, "id" | "created_at">) => {
    if (!user) return;
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
