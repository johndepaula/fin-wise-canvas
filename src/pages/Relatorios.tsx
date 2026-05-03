import { useMemo, useState, useEffect } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { useMonthlyClosure, ClosureFull } from "@/hooks/useMonthlyClosure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrencyBRL } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CalendarCheck, Archive, Eye, Lock } from "lucide-react";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
function formatMonthLabel(m: string) {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTH_NAMES[mm - 1]} ${y}`;
}

const CustomAnualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const currentYear = new Date().getFullYear();
    return (
      <div className="bg-card border-border border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label} {currentYear}</p>
        <p className="text-income text-sm">Entradas: {formatCurrencyBRL(data.entradas)}</p>
        <p className="text-expense text-sm">Saídas: {formatCurrencyBRL(data.saidas)}</p>
        <div className="my-1 border-t border-border" />
        <p className={`text-sm font-bold ${data.resultado >= 0 ? 'text-income' : 'text-expense'}`}>
          Resultado: {formatCurrencyBRL(data.resultado)}
        </p>
      </div>
    );
  }
  return null;
};

const Custom3DBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!height || Number.isNaN(height)) return null;
  const isPositive = payload.resultado >= 0;
  const colorFront = isPositive ? "rgba(34, 197, 94, 0.85)" : "rgba(239, 68, 68, 0.85)";
  const colorTop = isPositive ? "rgba(74, 222, 128, 0.95)" : "rgba(248, 113, 113, 0.95)";
  const colorSide = isPositive ? "rgba(21, 128, 61, 0.95)" : "rgba(185, 28, 28, 0.95)";
  const depth = width * 0.3;
  const dx = depth;
  const dy = -depth * 0.7;
  return (
    <g>
      <path d={`M${x},${y} L${x+dx},${y+dy} L${x+width+dx},${y+dy} L${x+width},${y} Z`} fill={colorTop} />
      <path d={`M${x+width},${y} L${x+width+dx},${y+dy} L${x+width+dx},${y+height+dy} L${x+width},${y+height} Z`} fill={colorSide} />
      <rect x={x} y={y} width={width} height={height} fill={colorFront} />
    </g>
  );
};

export default function Relatorios() {
  const { registros } = useRegistrosContext();
  const { closures, closeMonth, loadClosure } = useMonthlyClosure();
  const formatCurrency = formatCurrencyBRL;
  const currentYear = new Date().getFullYear();
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [openClosure, setOpenClosure] = useState<ClosureFull | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const handleViewClosure = async (month: string) => {
    const c = await loadClosure(month);
    if (c) {
      setOpenClosure(c);
      setViewOpen(true);
    }
  };

  const dadosAnuais = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const data = meses.map((mes, index) => ({ mes, mesIndex: index, entradas: 0, saidas: 0, resultado: 0 }));

    // Live records
    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getFullYear() === currentYear) {
        const mesIndex = date.getMonth();
        if (r.tipo === "entrada") data[mesIndex].entradas += Number(r.valor) || 0;
        else if (r.tipo === "saida") data[mesIndex].saidas += Number(r.valor) || 0;
      }
    });
    // Closed months
    closures.forEach((c) => {
      const [y, m] = c.month.split("-").map(Number);
      if (y === currentYear) {
        data[m - 1].entradas += Number(c.totals?.entradas || 0);
        data[m - 1].saidas += Number(c.totals?.saidas || 0);
      }
    });
    data.forEach((d) => { d.resultado = d.entradas - d.saidas; });
    return data;
  }, [registros, closures, currentYear]);

  // Closure detail computed sections
  const closureCategorias = useMemo(() => {
    if (!openClosure) return [];
    const map: Record<string, number> = {};
    (openClosure.records || []).filter((r: any) => r.tipo === "saida").forEach((r: any) => {
      map[r.categoria] = (map[r.categoria] || 0) + Number(r.valor);
    });
    return Object.entries(map).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  }, [openClosure]);

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground text-sm mt-1">Histórico mensal e desempenho anual</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <CalendarCheck className="h-4 w-4" />
              Fechar mês atual
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar {formatMonthLabel(currentMonthKey)}?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os registros e contas deste mês serão movidos para os Relatórios em modo somente leitura.
                Os dados não serão perdidos. O próximo mês começará vazio.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => closeMonth(currentMonthKey)}>Encerrar mês</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Closed months list */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Archive className="h-4 w-4" /> Meses Encerrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {closures.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum mês encerrado ainda. Use o botão acima para arquivar o mês atual.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {closures.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleViewClosure(c.month)}
                  className="text-left p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-accent/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{formatMonthLabel(c.month)}</span>
                    <Badge variant="outline" className="gap-1 text-xs"><Lock className="h-3 w-3" /> Leitura</Badge>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Entradas</span><span className="text-income">{formatCurrency(Number(c.totals?.entradas || 0))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Saídas</span><span className="text-expense">{formatCurrency(Number(c.totals?.saidas || 0))}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border/50 mt-1">
                      <span>Saldo</span>
                      <span className={Number(c.totals?.saldo || 0) >= 0 ? "text-income" : "text-expense"}>{formatCurrency(Number(c.totals?.saldo || 0))}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Ver detalhes
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annual chart */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            Evolução Mensal ({currentYear})
            <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
              Inclui meses encerrados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[450px] pt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosAnuais} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 12% 18%)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "hsl(215 12% 50%)", fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${Math.abs(v) >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} dx={-10} />
              <Tooltip content={<CustomAnualTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="resultado" shape={<Custom3DBar />} animationBegin={200} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Closure detail dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-card border-border max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório de {openClosure ? formatMonthLabel(openClosure.month) : ""}
            </DialogTitle>
            <DialogDescription>
              Modo somente leitura — dados arquivados em {openClosure ? new Date(openClosure.closed_at).toLocaleDateString("pt-BR") : ""}
            </DialogDescription>
          </DialogHeader>

          {openClosure && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-income/10 rounded-xl border border-income/20">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Entradas</p>
                  <p className="text-lg font-bold text-income">{formatCurrency(Number(openClosure.totals?.entradas || 0))}</p>
                </div>
                <div className="p-4 bg-expense/10 rounded-xl border border-expense/20">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Saídas</p>
                  <p className="text-lg font-bold text-expense">{formatCurrency(Number(openClosure.totals?.saidas || 0))}</p>
                </div>
                <div className={`p-4 rounded-xl border ${Number(openClosure.totals?.saldo || 0) >= 0 ? 'bg-income/10 border-income/20' : 'bg-expense/10 border-expense/20'}`}>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Saldo Final</p>
                  <p className={`text-lg font-bold ${Number(openClosure.totals?.saldo || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(Number(openClosure.totals?.saldo || 0))}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Registros ({openClosure.records?.length || 0})</h3>
                <div className="border border-border rounded-lg overflow-hidden max-h-[260px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {(openClosure.records || []).map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{(r.data || "").slice(0, 10).split("-").reverse().join("/")}</TableCell>
                          <TableCell><Badge variant="outline" className={`text-xs ${r.tipo === "entrada" ? "text-income border-income/30" : "text-expense border-expense/30"}`}>{r.tipo}</Badge></TableCell>
                          <TableCell className="text-xs">{r.categoria}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.descricao}</TableCell>
                          <TableCell className={`text-xs text-right tabular-nums ${r.tipo === "entrada" ? "text-income" : "text-expense"}`}>{formatCurrency(Number(r.valor))}</TableCell>
                        </TableRow>
                      ))}
                      {(!openClosure.records || openClosure.records.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-4">Sem registros</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Contas ({openClosure.bills?.length || 0})</h3>
                <div className="border border-border rounded-lg overflow-hidden max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Tipo</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Pago</TableHead><TableHead>Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {(openClosure.bills || []).map((b: any) => {
                        const remaining = Number(b.amount) - Number(b.amount_paid);
                        return (
                          <TableRow key={b.id}>
                            <TableCell className="text-xs">{b.account_type}</TableCell>
                            <TableCell className="text-xs">{(b.due_date || "").split("-").reverse().join("/")}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{formatCurrency(Number(b.amount))}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums text-income">{formatCurrency(Number(b.amount_paid))}</TableCell>
                            <TableCell><Badge variant="outline" className={`text-xs ${remaining <= 0 ? "text-income border-income/30" : "text-expense border-expense/30"}`}>{remaining <= 0 ? "Pago" : "Pendente"}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                      {(!openClosure.bills || openClosure.bills.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-4">Sem contas</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {closureCategorias.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Saídas por categoria</h3>
                  <div className="space-y-2">
                    {closureCategorias.map((c) => (
                      <div key={c.nome} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{c.nome}</span>
                        <span className="font-medium">{formatCurrency(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
