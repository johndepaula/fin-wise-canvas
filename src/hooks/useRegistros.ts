import { useState, useCallback } from "react";
import { Registro, gerarDadosMock } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

const initialData = gerarDadosMock();

export function useRegistros() {
  const [registros, setRegistros] = useState<Registro[]>(initialData);

  const adicionar = useCallback((reg: Omit<Registro, "id" | "criado_em">) => {
    const novo: Registro = {
      ...reg,
      id: Math.random().toString(36).substring(2, 10),
      criado_em: new Date().toISOString(),
    };
    setRegistros((prev) => [novo, ...prev]);
    toast({ title: "Registro criado", description: `${reg.tipo === "entrada" ? "Entrada" : "Saída"} de R$ ${reg.valor.toFixed(2)} adicionada.` });
    return novo;
  }, []);

  const editar = useCallback((id: string, updates: Partial<Registro>) => {
    setRegistros((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    toast({ title: "Registro atualizado", description: "As alterações foram salvas." });
  }, []);

  const remover = useCallback((id: string) => {
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Registro removido", description: "O registro foi excluído com sucesso." });
  }, []);

  return { registros, adicionar, editar, remover };
}
