import { useState, useMemo, useCallback } from "react";
import { useBills, Bill } from "@/hooks/useBills";
import { useRegistros } from "@/hooks/useRegistros";
import { useInputHistory } from "@/hooks/useInputHistory";
import { SuggestionDropdown } from "@/components/SuggestionDropdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Wallet, AlertTriangle, CheckCircle, Search, Filter, X } from "lucide-react";
import { formatCurrencyBRL, parseCurrencyInput } from "@/lib/currency";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormData {
  account_type: string;
  due_date: string;
  amount: string;
  amount_paid: string;
}

function getLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const emptyForm: FormData = { account_type: "", due_date: getLocalDate(), amount: "", amount_paid: "0" };

function getDueStatus(due_date: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(due_date + "T00:00:00");
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "overdue";
  if (diff <= 3) return "soon";
  return "ok";
}

export default function Contas() {
  const { bills, loading, add, update, remove } = useBills();
  const { adicionar: addRegistro } = useRegistros();
  const accountHistory = useInputHistory("tipo_conta");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [accountSuggestions, setAccountSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [catFiltro, setCatFiltro] = useState("todas");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [periodoRapido, setPeriodoRapido] = useState("");

  const todasCategorias = useMemo(() => {
    const cats = new Set(bills.map(b => b.account_type));
    return Array.from(cats).sort();
  }, [bills]);

  const totals = useMemo(() => {
    const total = bills.reduce((s, b) => s + b.amount, 0);
    const paid = bills.reduce((s, b) => s + b.amount_paid, 0);
    return { total, paid, remaining: total - paid };
  }, [bills]);

  const sortedBills = useMemo(() => {
    let list = [...bills];
    
    if (busca) list = list.filter((b) => b.account_type.toLowerCase().includes(busca.toLowerCase()));
    
    if (statusFiltro === "pago") {
      list = list.filter(b => b.amount - b.amount_paid <= 0);
    } else if (statusFiltro === "pendente") {
      list = list.filter(b => b.amount - b.amount_paid > 0);
    }

    if (catFiltro !== "todas") {
      list = list.filter(b => b.account_type === catFiltro);
    }

    if (dataInicial) {
      list = list.filter(b => b.due_date >= dataInicial);
    }
    if (dataFinal) {
      list = list.filter(b => b.due_date <= dataFinal);
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.due_date + "T00:00:00").getTime();
      const dateB = new Date(b.due_date + "T00:00:00").getTime();
      return dateA - dateB;
    });
  }, [bills, busca, statusFiltro, catFiltro, dataInicial, dataFinal]);

  const totaisFiltrados = useMemo(() => {
    return { pendentesCount: sortedBills.filter(b => b.amount - b.amount_paid > 0).length };
  }, [sortedBills]);

  const setQuickFilter = (type: string) => {
    setPeriodoRapido(type);
    const today = new Date();
    if (type === "hoje") {
      const dt = today.toISOString().slice(0, 10);
      setDataInicial(dt);
      setDataFinal(dt);
    } else if (type === "semana") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setDataInicial(firstDay.toISOString().slice(0, 10));
      setDataFinal(lastDay.toISOString().slice(0, 10));
    } else if (type === "mes") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDataInicial(firstDay.toISOString().slice(0, 10));
      setDataFinal(lastDay.toISOString().slice(0, 10));
    } else {
      setDataInicial("");
      setDataFinal("");
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setStatusFiltro("todos");
    setCatFiltro("todas");
    setDataInicial("");
    setDataFinal("");
    setPeriodoRapido("");
  };

  const openNew = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setAccountSuggestions([]);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((b: Bill) => {
    setEditingId(b.id);
    setForm({
      account_type: b.account_type,
      due_date: b.due_date,
      amount: b.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      amount_paid: b.amount_paid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    setAccountSuggestions([]);
    setModalOpen(true);
  }, []);

  const handleAccountTypeChange = (value: string) => {
    setForm((f) => ({ ...f, account_type: value }));
    setAccountSuggestions(value.length >= 2 ? accountHistory.getSuggestions(value) : []);
  };

  const handleSave = async () => {
    const amount = parseCurrencyInput(form.amount);
    const amount_paid = parseCurrencyInput(form.amount_paid);
    if (!form.account_type || !form.due_date || !amount) return;

    await accountHistory.save(form.account_type);

    if (editingId) {
      await update(editingId, { account_type: form.account_type, due_date: form.due_date, amount, amount_paid });
    } else {
      await add({ account_type: form.account_type, due_date: form.due_date, amount, amount_paid });
    }
    setModalOpen(false);
  };

  const handleMarkAsPaid = async (b: Bill) => {
    if (b.amount - b.amount_paid <= 0) return;
    await update(b.id, { amount_paid: b.amount });
    await addRegistro({
      tipo: "saida",
      valor: b.amount,
      categoria: b.account_type,
      descricao: `Pagamento: ${b.account_type}`,
      data: getLocalDate(),
    });
  };

  const fmt = formatCurrencyBRL;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl animate-fade-in-up">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas contas a pagar</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Conta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Valor total em contas", value: fmt(totals.total), icon: Wallet, color: "text-foreground" },
          { label: "Total Pago", value: fmt(totals.paid), icon: CheckCircle, color: "text-income" },
          { label: "Restante", value: fmt(totals.remaining), icon: AlertTriangle, color: totals.remaining > 0 ? "text-expense" : "text-income" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className={`text-xl font-semibold ${kpi.color}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Toggle & Counters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2 justify-between">
        <div className="flex gap-4 items-center">
          <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="h-4 w-4" /> {showFilters ? "Ocultar Filtros" : "Pesquisar / Filtros"}
          </Button>
          <div className="flex gap-4 text-sm bg-card px-4 py-2 rounded-lg border border-border">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs uppercase cursor-default">Contas Pendentes (Filtro)</span>
              <span className="font-semibold text-expense">{totaisFiltrados.pendentesCount} {totaisFiltrados.pendentesCount === 1 ? 'conta' : 'contas'}</span>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="bg-card border-border mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs mb-1 block text-muted-foreground">Buscar conta</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por tipo..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 bg-background" />
                </div>
              </div>
              <div className="w-[140px]">
                <Label className="text-xs mb-1 block text-muted-foreground">Status</Label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <Label className="text-xs mb-1 block text-muted-foreground">Categoria</Label>
                <Select value={catFiltro} onValueChange={setCatFiltro}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {todasCategorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Label className="text-xs mb-1 block text-muted-foreground">Vencimento Inicial</Label>
                <Input type="date" value={dataInicial} onChange={(e) => { setDataInicial(e.target.value); setPeriodoRapido(""); }} className="bg-background" />
              </div>
              <div className="w-[140px]">
                <Label className="text-xs mb-1 block text-muted-foreground">Vencimento Final</Label>
                <Input type="date" value={dataFinal} onChange={(e) => { setDataFinal(e.target.value); setPeriodoRapido(""); }} className="bg-background" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-border/50">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground mr-2">Filtros Rápidos:</span>
                <Button variant={periodoRapido === "hoje" ? "secondary" : "outline"} size="sm" onClick={() => setQuickFilter("hoje")}>Vence Hoje</Button>
                <Button variant={periodoRapido === "semana" ? "secondary" : "outline"} size="sm" onClick={() => setQuickFilter("semana")}>Esta Semana</Button>
                <Button variant={periodoRapido === "mes" ? "secondary" : "outline"} size="sm" onClick={() => setQuickFilter("mes")}>Este Mês</Button>
              </div>
              <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-muted-foreground hover:text-foreground gap-1">
                <X className="h-4 w-4" /> Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
          <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          {sortedBills.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">Nenhuma conta encontrada</p>
              <p className="text-sm">Adicione sua primeira conta a pagar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead>Tipo de Conta</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead className="text-right">Restante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBills.map((b) => {
                    const status = getDueStatus(b.due_date);
                    const remaining = b.amount - b.amount_paid;
                    return (
                      <TableRow key={b.id} className="border-border hover:bg-accent/30 transition-colors">
                        <TableCell className="text-sm font-medium">{b.account_type}</TableCell>
                        <TableCell className="text-sm">{new Date(b.due_date + "T00:00:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{fmt(b.amount)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums text-income">{fmt(b.amount_paid)}</TableCell>
                        <TableCell className={`text-sm text-right tabular-nums ${remaining > 0 ? "text-expense" : "text-income"}`}>{fmt(remaining)}</TableCell>
                        <TableCell>
                          {remaining <= 0 ? (
                            <Badge variant="outline" className="border-income/30 text-income text-xs">Pago</Badge>
                          ) : status === "overdue" ? (
                            <Badge variant="destructive" className="text-xs">Vencido</Badge>
                          ) : status === "soon" ? (
                            <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-xs">Vence em breve</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Em dia</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 items-center">
                            <Button
                              variant={remaining <= 0 ? "outline" : "default"}
                              size="sm"
                              className={`h-8 font-medium px-3 text-xs mr-1 transition-all ${remaining <= 0 ? "border-income/50 text-income bg-income/5 hover:bg-income/5 cursor-not-allowed opacity-100" : "shadow-sm"}`}
                              onClick={() => { if (remaining > 0) handleMarkAsPaid(b); }}
                              disabled={remaining <= 0}
                            >
                              {remaining <= 0 ? "Pago ✔" : "Pago"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Label className="text-xs text-muted-foreground">Tipo de Conta</Label>
              <Input
                placeholder="Ex: Aluguel, Luz, Internet"
                value={form.account_type}
                onChange={(e) => handleAccountTypeChange(e.target.value)}
                onBlur={() => setTimeout(() => setAccountSuggestions([]), 150)}
                className="bg-background border-border mt-1"
              />
              <SuggestionDropdown suggestions={accountSuggestions} onSelect={(v) => { setForm((f) => ({ ...f, account_type: v })); setAccountSuggestions([]); }} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <CurrencyInput value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor Pago (R$)</Label>
              <CurrencyInput value={form.amount_paid} onChange={(v) => setForm((f) => ({ ...f, amount_paid: v }))} className="bg-background border-border mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { remove(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
