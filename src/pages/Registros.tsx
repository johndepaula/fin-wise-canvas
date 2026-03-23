import { useState, useMemo, useEffect, useCallback } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { Registro, RegistroTipo, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, TODAS_CATEGORIAS } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";

type SortField = "data" | "valor";
type SortDir = "asc" | "desc";

interface FormData {
  tipo: RegistroTipo;
  valor: string;
  categoria: string;
  categoriaCustom: string;
  descricao: string;
  data: string;
}

const emptyForm: FormData = { tipo: "saida", valor: "", categoria: "", categoriaCustom: "", descricao: "", data: new Date().toISOString().slice(0, 10) };

export default function Registros() {
  const { registros, adicionar, editar, remover } = useRegistrosContext();
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [catFiltro, setCatFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "data", dir: "desc" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const filtrados = useMemo(() => {
    let list = [...registros];
    if (tipoFiltro !== "todos") list = list.filter((r) => r.tipo === tipoFiltro);
    if (catFiltro !== "todas") list = list.filter((r) => r.categoria === catFiltro);
    if (busca) list = list.filter((r) => r.descricao.toLowerCase().includes(busca.toLowerCase()));
    list.sort((a, b) => {
      const mul = sort.dir === "asc" ? 1 : -1;
      if (sort.field === "data") return mul * (new Date(a.data).getTime() - new Date(b.data).getTime());
      return mul * (a.valor - b.valor);
    });
    return list;
  }, [registros, tipoFiltro, catFiltro, busca, sort]);

  const toggleSort = (field: SortField) => {
    setSort((prev) => ({ field, dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc" }));
  };

  const openNew = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((r: Registro) => {
    setEditingId(r.id);
    setForm({ tipo: r.tipo, valor: r.valor.toString(), categoria: r.categoria, descricao: r.descricao, data: r.data.slice(0, 10) });
    setModalOpen(true);
  }, []);

  const handleSave = async () => {
    const valor = parseFloat(form.valor);
    if (!valor || !form.categoria || !form.descricao || !form.data) return;
    if (editingId) {
      await editar(editingId, { tipo: form.tipo, valor, categoria: form.categoria, descricao: form.descricao, data: new Date(form.data).toISOString() });
    } else {
      await adicionar({ tipo: form.tipo, valor, categoria: form.categoria, descricao: form.descricao, data: new Date(form.data).toISOString() });
    }
    setModalOpen(false);
  };

  const categorias = form.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !modalOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        openNew();
      }
      if (e.key === "Escape" && modalOpen) setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen, openNew]);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus Registros</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie suas entradas e saídas</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Registro
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar descrição..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 w-[220px] bg-card border-border" />
        </div>
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-[140px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFiltro} onValueChange={setCatFiltro}>
          <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas categorias</SelectItem>
            {TODAS_CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">Nenhum registro encontrado</p>
              <p className="text-sm">Tente ajustar seus filtros ou adicione um novo registro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("data")}>
                      <span className="flex items-center gap-1">Data <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("valor")}>
                      <span className="flex items-center justify-end gap-1">Valor <ArrowUpDown className="h-3 w-3" /></span>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((r) => (
                    <TableRow key={r.id} className="border-border hover:bg-accent/30 transition-colors">
                      <TableCell className="text-sm">{new Date(r.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.tipo === "entrada" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                          {r.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{r.categoria}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.descricao}</TableCell>
                      <TableCell className={`text-sm font-medium text-right tabular-nums ${r.tipo === "entrada" ? "text-income" : "text-expense"}`}>
                        {r.tipo === "entrada" ? "+" : "−"} R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Registro" : "Novo Registro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["entrada", "saida"] as RegistroTipo[]).map((t) => (
                <Button key={t} variant={form.tipo === t ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, tipo: t, categoria: "" }))} className="flex-1">
                  {t === "entrada" ? "Entrada" : "Saída"}
                </Button>
              ))}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                <SelectTrigger className="bg-background border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input placeholder="Ex: Supermercado" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="bg-background border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className="bg-background border-border mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { remover(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
