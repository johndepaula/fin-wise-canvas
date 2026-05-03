import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { useBillsContext } from "@/contexts/BillsContext";
import { supabase } from "@/integrations/supabase/client";

export function useLifecycle() {
  const { user } = useAuth();
  const { registros, adicionar: addRegistro, loading: loadingRegistros } = useRegistrosContext();
  const { bills, add: addBill, loading: loadingBills } = useBillsContext();

  const checkAndTransitionMonth = useCallback(async () => {
    if (!user || loadingRegistros || loadingBills) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Month definitions
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    const startOfPrevMonth = new Date(prevYear, prevMonth, 1).toISOString().split("T")[0];
    const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).toISOString().split("T")[0];
    const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

    // 2. Handle Balance Transition (Once per month)
    const hasBalanceTransition = registros.some(
      (r) =>
        (r.descricao === "Saldo do mês anterior" || r.descricao === "Saldo negativo do mês anterior") &&
        r.data.startsWith(startOfMonth.slice(0, 7))
    );

    if (!hasBalanceTransition) {
      const prevMonthRegistros = registros.filter(
        (r) => r.data >= startOfPrevMonth && r.data <= endOfPrevMonth
      );

      const prevEntradas = prevMonthRegistros
        .filter((r) => r.tipo === "entrada")
        .reduce((sum, r) => sum + r.valor, 0);
      const prevSaidas = prevMonthRegistros
        .filter((r) => r.tipo === "saida")
        .reduce((sum, r) => sum + r.valor, 0);
      const prevSaldo = prevEntradas - prevSaidas;

      if (prevSaldo > 0) {
        await addRegistro({ tipo: "entrada", descricao: "Saldo do mês anterior", valor: prevSaldo, categoria: "Outros", data: startOfMonth });
      } else if (prevSaldo < 0) {
        await addRegistro({ tipo: "saida", descricao: "Saldo negativo do mês anterior", valor: Math.abs(prevSaldo), categoria: "Outros", data: startOfMonth });
      } else {
        await addRegistro({ tipo: "entrada", descricao: "Saldo do mês anterior", valor: 0, categoria: "Outros", data: startOfMonth });
      }
    }

    // 3. Handle Recurring Bills (Migration/Repair)
    const currentMonthBills = bills.filter(b => b.due_date >= startOfMonth);
    
    // Check previous month bills in live table
    let prevBillsSource = bills.filter(b => b.due_date >= startOfPrevMonth && b.due_date <= endOfPrevMonth);
    
    // If live table is empty (maybe already archived), check closures
    if (prevBillsSource.length === 0) {
      const { data: closure } = await supabase.from("monthly_closures").select("bills").eq("month", prevMonthKey).maybeSingle();
      if (closure?.bills) prevBillsSource = closure.bills as any[];
    }

    // RULE: If current month is "incomplete" (0 or 1 bill) while prev month had many
    if (currentMonthBills.length <= 1 && prevBillsSource.length > 1) {
      // Clear current month's incomplete bills
      for (const b of currentMonthBills) {
        await supabase.from("bills").delete().eq("id", b.id);
      }

      let billsCloned = 0;
      for (const bill of prevBillsSource) {
        const dueDay = new Date(bill.due_date + "T00:00:00").getDate();
        const newDueDate = new Date(currentYear, currentMonth, dueDay);
        if (newDueDate.getMonth() !== currentMonth) newDueDate.setDate(0);
        const newDueDateStr = newDueDate.toISOString().split("T")[0];

        await addBill({
          account_type: bill.account_type,
          amount: bill.amount,
          amount_paid: 0,
          due_date: newDueDateStr,
        });
        billsCloned++;
      }

      if (billsCloned > 0) {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({ title: "Contas sincronizadas!", description: `${billsCloned} contas recorrentes foram migradas de ${prevMonthKey} para este mês.` });
        });
      }
    }

    // 4. Automated Closure of Previous Month (If not done)
    const { data: existingClosure } = await supabase.from("monthly_closures").select("id").eq("month", prevMonthKey).maybeSingle();

    if (!existingClosure) {
      const [{ data: recordsToClose }, { data: billsToClose }] = await Promise.all([
        supabase.from("financial_records").select("*").gte("data", startOfPrevMonth).lte("data", endOfPrevMonth),
        supabase.from("bills").select("*").gte("due_date", startOfPrevMonth).lte("due_date", endOfPrevMonth),
      ]);

      if ((recordsToClose && recordsToClose.length) || (billsToClose && billsToClose.length)) {
        const ent = (recordsToClose || []).filter(r => r.tipo === "entrada").reduce((s, r) => s + Number(r.valor), 0);
        const sai = (recordsToClose || []).filter(r => r.tipo === "saida").reduce((s, r) => s + Number(r.valor), 0);
        await supabase.from("monthly_closures").insert({
          user_id: user.id, month: prevMonthKey, records: recordsToClose || [], bills: billsToClose || [],
          totals: { entradas: ent, saidas: sai, saldo: ent - sai, registrosCount: recordsToClose?.length || 0, billsCount: billsToClose?.length || 0 }
        });
        if (recordsToClose?.length) await supabase.from("financial_records").delete().in("id", recordsToClose.map(r => r.id));
        if (billsToClose?.length) await supabase.from("bills").delete().in("id", billsToClose.map(b => b.id));
      }
    }


  }, [user, registros, bills, loadingRegistros, loadingBills, addRegistro, addBill]);


  useEffect(() => {
    if (user && !loadingRegistros && !loadingBills) {
      checkAndTransitionMonth();
    }
  }, [user, loadingRegistros, loadingBills, checkAndTransitionMonth]);
}
