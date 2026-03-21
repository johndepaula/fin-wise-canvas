import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Registro } from "@/data/mockData";

export function useRegistros() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = useCallback(async () => {
    if (!user) { setRegistros([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("financial_records")
      .select("*")
      .order("data", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar registros", description: error.message, variant: "destructive" });
    } else {
      setRegistros(
        (data || []).map((r) => ({
          id: r.id,
          tipo: r.tipo as Registro["tipo"],
          valor: Number(r.valor),
          categoria: r.categoria,
          descricao: r.descricao,
          data: r.data,
          criado_em: r.criado_em,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

  const adicionar = useCallback(async (reg: Omit<Registro, "id" | "criado_em">) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("financial_records")
      .insert({ user_id: user.id, tipo: reg.tipo, valor: reg.valor, categoria: reg.categoria, descricao: reg.descricao, data: reg.data })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar registro", description: error.message, variant: "destructive" });
    } else {
      setRegistros((prev) => [{
        id: data.id,
        tipo: data.tipo as Registro["tipo"],
        valor: Number(data.valor),
        categoria: data.categoria,
        descricao: data.descricao,
        data: data.data,
        criado_em: data.criado_em,
      }, ...prev]);
      toast({ title: "Registro criado", description: `${reg.tipo === "entrada" ? "Entrada" : "Saída"} de R$ ${reg.valor.toFixed(2)} adicionada.` });
    }
  }, [user]);

  const editar = useCallback(async (id: string, updates: Partial<Registro>) => {
    const { error } = await supabase
      .from("financial_records")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      setRegistros((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      toast({ title: "Registro atualizado", description: "As alterações foram salvas." });
    }
  }, []);

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("financial_records")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Registro removido", description: "O registro foi excluído com sucesso." });
    }
  }, []);

  return { registros, loading, adicionar, editar, remover };
}
