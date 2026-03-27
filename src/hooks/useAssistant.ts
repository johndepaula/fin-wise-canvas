import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { useBills } from "@/hooks/useBills";
import { useClock } from "@/hooks/useClock";
import { toast } from "@/hooks/use-toast";

const ROUTES: Record<string, string> = {
  dashboard: "/",
  registros: "/registros",
  contas: "/contas",
  perfil: "/perfil",
  configuracoes: "/configuracoes",
  "configurações": "/configuracoes",
};

export function useAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registros, adicionar } = useRegistrosContext();
  const { bills } = useBills();
  const { now } = useClock();

  const saveCommand = useCallback(async (command: string, actionType: string, response: string) => {
    if (!user) return;
    await supabase.from("ai_commands_history" as any).insert({
      user_id: user.id, command, action_type: actionType, response,
    });
  }, [user]);

  const process = useCallback(async (input: string): Promise<string> => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return "Digite um comando.";

    // Navigation
    const navMatch = cmd.match(/^(?:abrir|ir para?|mostrar)\s+(.+)/i);
    if (navMatch) {
      const target = navMatch[1].trim();
      for (const [key, route] of Object.entries(ROUTES)) {
        if (target.includes(key)) {
          navigate(route);
          const resp = `Abrindo ${key}...`;
          await saveCommand(input, "navigation", resp);
          return resp;
        }
      }
      const resp = `Não encontrei a página "${target}".`;
      await saveCommand(input, "navigation_fail", resp);
      return resp;
    }

    // Queries
    if (cmd.includes("valor por dia") || cmd.includes("quanto por dia")) {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const diasRestantes = Math.max(0, lastDay - now.getDate());
      const totalEntradas = registros.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
      const totalSaidas = registros.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);
      const saldoReal = totalEntradas - totalSaidas;
      const totalContas = bills.reduce((s, b) => s + b.amount, 0);
      const totalPago = bills.reduce((s, b) => s + b.amount_paid, 0);
      const restanteContas = Math.max(0, totalContas - totalPago);
      const vpd = diasRestantes > 0 ? Math.max(0, restanteContas - saldoReal) / diasRestantes : restanteContas;
      const resp = `Seu valor por dia é R$ ${vpd.toFixed(2)} (${diasRestantes} dias restantes).`;
      await saveCommand(input, "query", resp);
      return resp;
    }

    if (cmd.includes("saldo")) {
      const totalEntradas = registros.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
      const totalSaidas = registros.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);
      const saldo = totalEntradas - totalSaidas;
      const resp = `Seu saldo atual é R$ ${saldo.toFixed(2)}.`;
      await saveCommand(input, "query", resp);
      return resp;
    }

    if (cmd.includes("dias restantes") || cmd.includes("quantos dias faltam")) {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const diasRestantes = Math.max(0, lastDay - now.getDate());
      const resp = `Faltam ${diasRestantes} dias para o fim do mês.`;
      await saveCommand(input, "query", resp);
      return resp;
    }

    if (cmd.includes("que horas") || cmd.includes("hora atual")) {
      const resp = `Agora são ${now.toLocaleTimeString("pt-BR")}.`;
      await saveCommand(input, "query", resp);
      return resp;
    }

    // Insert command
    const addMatch = cmd.match(/^adicionar\s+(gasto|saida|saída|entrada)\s+(\d+[\.,]?\d*)\s+(\S+)\s*(.*)/i);
    if (addMatch) {
      const tipoRaw = addMatch[1];
      const tipo = tipoRaw === "entrada" ? "entrada" : "saida";
      const valor = parseFloat(addMatch[2].replace(",", "."));
      const categoria = addMatch[3].charAt(0).toUpperCase() + addMatch[3].slice(1);
      const descricao = addMatch[4].trim() || categoria;

      await adicionar({ tipo, valor, categoria, descricao, data: new Date().toISOString() });
      const resp = `Registro adicionado: ${tipo} de R$ ${valor.toFixed(2)} em ${categoria}.`;
      await saveCommand(input, "insert", resp);
      return resp;
    }

    const resp = "Comando não reconhecido. Tente: 'abrir dashboard', 'qual meu saldo', 'adicionar gasto 50 transporte gasolina'.";
    await saveCommand(input, "unknown", resp);
    return resp;
  }, [navigate, user, registros, bills, now, adicionar, saveCommand]);

  return { process };
}
