import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export function useFinancialGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("financial_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setGoals(data as unknown as FinancialGoal[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addGoal = async (goal: { title: string; target_amount: number; deadline?: string }) => {
    if (!user) return;
    const { error } = await supabase.from("financial_goals").insert({
      user_id: user.id,
      title: goal.title,
      target_amount: goal.target_amount,
      deadline: goal.deadline || null,
    } as any);
    if (error) { toast({ title: "Erro ao criar meta", variant: "destructive" }); return; }
    toast({ title: "Meta criada!" });
    fetch();
  };

  const updateGoal = async (id: string, updates: Partial<Pick<FinancialGoal, "title" | "target_amount" | "current_amount" | "deadline">>) => {
    if (!user) return;
    const { error } = await supabase.from("financial_goals").update(updates as any).eq("id", id).eq("user_id", user.id);
    if (error) { toast({ title: "Erro ao atualizar meta", variant: "destructive" }); return; }
    fetch();
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    await supabase.from("financial_goals").delete().eq("id", id).eq("user_id", user.id);
    toast({ title: "Meta removida" });
    fetch();
  };

  return { goals, loading, addGoal, updateGoal, deleteGoal, refetch: fetch };
}
