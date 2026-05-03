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

    // 1. Check if "Saldo do mês anterior" already exists for this month
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

    const hasBalanceTransition = registros.some(
      (r) =>
        r.descricao === "Saldo do mês anterior" &&
        r.data.startsWith(startOfMonth.slice(0, 7)) // Check YYYY-MM
    );

    if (hasBalanceTransition) return;

    // 2. Calculate balance of previous month
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();
    const startOfPrevMonth = new Date(prevYear, prevMonth, 1).toISOString().split("T")[0];
    const endOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).toISOString().split("T")[0];

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

    // 3. Create balance transition record
    if (prevSaldo > 0) {
      await addRegistro({
        tipo: "entrada",
        descricao: "Saldo do mês anterior",
        valor: prevSaldo,
        categoria: "Outros",
        data: startOfMonth,
      });
    } else if (prevSaldo < 0) {
      await addRegistro({
        tipo: "saida",
        descricao: "Saldo negativo do mês anterior",
        valor: Math.abs(prevSaldo),
        categoria: "Outros",
        data: startOfMonth,
      });
    } else {
      await addRegistro({
        tipo: "entrada",
        descricao: "Saldo do mês anterior",
        valor: 0,
        categoria: "Outros",
        data: startOfMonth,
      });
    }

    // 4. Persistence of Accounts (Bills) - CLONE BEFORE CLOSURE
    const prevMonthBills = bills.filter(
      (b) => b.due_date >= startOfPrevMonth && b.due_date <= endOfPrevMonth
    );

    let billsCloned = 0;
    for (const bill of prevMonthBills) {
      const dueDay = new Date(bill.due_date + "T00:00:00").getDate();
      const newDueDate = new Date(currentYear, currentMonth, dueDay);
      
      if (newDueDate.getMonth() !== currentMonth) {
        newDueDate.setDate(0);
      }
      
      const newDueDateStr = newDueDate.toISOString().split("T")[0];

      const alreadyExists = bills.some(
        (b) =>
          b.account_type === bill.account_type &&
          b.due_date === newDueDateStr
      );

      if (!alreadyExists) {
        await addBill({
          account_type: bill.account_type,
          amount: bill.amount,
          amount_paid: 0,
          due_date: newDueDateStr,
        });
        billsCloned++;
      }
    }

    // 5. Automated Closure of Previous Month
    const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;
    
    // Check if already closed manually
    const { data: existingClosure } = await supabase
      .from("monthly_closures")
      .select("id")
      .eq("month", prevMonthKey)
      .maybeSingle();

    if (!existingClosure) {
      // Fetch all records and bills of previous month again to ensure we have the latest
      // (This is safer than using the filtered lists above)
      const [{ data: recordsToClose }, { data: billsToClose }] = await Promise.all([
        supabase.from("financial_records").select("*").gte("data", startOfPrevMonth).lte("data", endOfPrevMonth),
        supabase.from("bills").select("*").gte("due_date", startOfPrevMonth).lte("due_date", endOfPrevMonth),
      ]);

      if ((recordsToClose && recordsToClose.length) || (billsToClose && billsToClose.length)) {
        const ent = (recordsToClose || []).filter(r => r.tipo === "entrada").reduce((s, r) => s + Number(r.valor), 0);
        const sai = (recordsToClose || []).filter(r => r.tipo === "saida").reduce((s, r) => s + Number(r.valor), 0);
        
        await supabase.from("monthly_closures").insert({
          user_id: user.id,
          month: prevMonthKey,
          records: recordsToClose || [],
          bills: billsToClose || [],
          totals: {
            entradas: ent,
            saidas: sai,
            saldo: ent - sai,
            registrosCount: recordsToClose?.length || 0,
            billsCount: billsToClose?.length || 0,
          },
        });

        // Delete originals to maintain "fixed history" in closures table
        if (recordsToClose?.length) await supabase.from("financial_records").delete().in("id", recordsToClose.map(r => r.id));
        if (billsToClose?.length) await supabase.from("bills").delete().in("id", billsToClose.map(b => b.id));
      }
    }

    import("@/hooks/use-toast").then(({ toast }) => {
      toast({
        title: "Transição de mês concluída!",
        description: `Saldo transportado, ${billsCloned} contas renovadas e histórico do mês anterior arquivado.`,
      });
    });

  }, [user, registros, bills, loadingRegistros, loadingBills, addRegistro, addBill]);


  useEffect(() => {
    if (user && !loadingRegistros && !loadingBills) {
      checkAndTransitionMonth();
    }
  }, [user, loadingRegistros, loadingBills, checkAndTransitionMonth]);
}
