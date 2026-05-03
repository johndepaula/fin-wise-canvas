import { useMemo, useState, useEffect } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { useMonthlyClosure, ClosureFull } from "@/hooks/useMonthlyClosure";
import { useHistoricalMonths, HistoricalMonth } from "@/hooks/useHistoricalMonths";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { formatCurrencyBRL } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, BarChart3, Download, Calendar, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingDown, Archive, Eye, Lock } from "lucide-react";

const PIE_COLORS = [
  "#2DD4BF", "#22D3EE", "#818CF8", "#C084FC", "#F472B6",
  "#FB7185", "#FDA4AF", "#FCD34D", "#A3E635", "#4ADE80",
];

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatMonthLabel(m: string) {
  const [y, mm] = m.split("-").map(Number);
  return `${MONTH_NAMES[mm - 1]} ${y}`;
}

const CustomAnualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatCurrency = formatCurrencyBRL;
    
    return (
      <div className="bg-card border-border border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-income text-sm">Entradas: {formatCurrency(data.entradas)}</p>
        <p className="text-expense text-sm">Saídas: {formatCurrency(data.saidas)}</p>
        <div className="my-1 border-t border-border" />
        <p className={`text-sm font-bold ${data.resultado >= 0 ? 'text-income' : 'text-expense'}`}>
          Resultado: {formatCurrency(data.resultado)}
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

const renderCustomBarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (value === 0) return null;
  const isPositive = value > 0;
  const yPos = isPositive ? y - 10 : y + height + 20;
  
  return (
    <text x={x + width / 2} y={yPos} fill={isPositive ? "#4ADE80" : "#F87171"} textAnchor="middle" fontSize={12} fontWeight="bold">
      {isPositive ? "+" : "-"}
    </text>
  );
};

export default function Relatorios() {
  const { registros } = useRegistrosContext();
  const { closures, loadClosure } = useMonthlyClosure();
  const { months: historicalMonths } = useHistoricalMonths();
  const formatCurrency = formatCurrencyBRL;
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [openClosure, setOpenClosure] = useState<ClosureFull | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  // Combine auto-derived past months with closures
  const allPastMonths = useMemo(() => {
    const map: Record<string, { month: string; totals: any; source: "closure" | "auto" }> = {};
    historicalMonths.forEach((m) => {
      map[m.month] = { month: m.month, totals: m.totals, source: "auto" };
    });
    closures.forEach((c) => {
      map[c.month] = { month: c.month, totals: c.totals, source: "closure" };
    });
    return Object.values(map)
      .filter((m) => m.month !== currentMonthKey)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [historicalMonths, closures, currentMonthKey]);

  const handleViewMonth = async (m: { month: string; source: "closure" | "auto" }) => {
    if (m.source === "closure") {
      const c = await loadClosure(m.month);
      if (c) { setOpenClosure(c); setViewOpen(true); }
    } else {
      const hist = historicalMonths.find((h) => h.month === m.month);
      if (hist) {
        setOpenClosure({
          id: m.month,
          month: m.month,
          closed_at: new Date().toISOString(),
          totals: hist.totals,
          records: hist.records,
          bills: hist.bills,
        } as any);
        setViewOpen(true);
      }
    }
  };

  const dadosAnuais = useMemo(() => {
    const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const data = mesesAbrev.map((mes, index) => ({
      mes,
      mesIndex: index,
      entradas: 0,
      saidas: 0,
      resultado: 0,
    }));

    // Live data for current year
    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getFullYear().toString() === selectedYear) {
        const mesIndex = date.getMonth();
        if (r.tipo === "entrada") data[mesIndex].entradas += Number(r.valor) || 0;
        else if (r.tipo === "saida") data[mesIndex].saidas += Number(r.valor) || 0;
      }
    });

    // Merge with archived months for the same year
    allPastMonths.forEach((m) => {
      const [y, mo] = m.month.split("-").map(Number);
      if (y.toString() === selectedYear) {
        data[mo - 1].entradas = Math.max(data[mo - 1].entradas, Number(m.totals?.entradas || 0));
        data[mo - 1].saidas = Math.max(data[mo - 1].saidas, Number(m.totals?.saidas || 0));
      }
    });

    data.forEach((d) => { d.resultado = d.entradas - d.saidas; });
    return data;
  }, [registros, allPastMonths, selectedYear]);

  const dadosMensais = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    const categorias: Record<string, number> = {};

    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getMonth().toString() === selectedMonth && date.getFullYear().toString() === selectedYear) {
        if (r.tipo === "entrada") entradas += Number(r.valor) || 0;
        if (r.tipo === "saida") {
          saidas += Number(r.valor) || 0;
          categorias[r.categoria] = (categorias[r.categoria] || 0) + (Number(r.valor) || 0);
        }
      }
    });

    const categoriasArray = Object.entries(categorias)
      .map(([nome, valor]) => ({ 
        nome, 
        valor, 
        percentual: saidas > 0 ? (valor / saidas) * 100 : 0 
      }))
      .sort((a, b) => b.valor - a.valor);

    return { 
      entradas, 
      saidas, 
      saldo: entradas - saidas, 
      categorias: categoriasArray,
      topCategorias: categoriasArray.slice(0, 5)
    };
  }, [registros, selectedMonth, selectedYear]);

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
          <p className="text-muted-foreground text-sm mt-1">Gestão financeira avançada e detalhamento de gastos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] bg-card">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/20 hover:border-primary/50">
                <FileText className="h-4 w-4" />
                IR {selectedYear}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle>Resumo para Imposto de Renda ({selectedYear})</DialogTitle>
                <DialogDescription>Dados anuais consolidados.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-income/10 rounded-lg border border-income/20">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Entradas</p>
                    <p className="text-lg font-bold text-income">{formatCurrency(dadosAnuais.reduce((s, d) => s + d.entradas, 0))}</p>
                  </div>
                  <div className="p-3 bg-expense/10 rounded-lg border border-expense/20">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Saídas</p>
                    <p className="text-lg font-bold text-expense">{formatCurrency(dadosAnuais.reduce((s, d) => s + d.saidas, 0))}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Meses Anteriores (Archive) */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Archive className="h-4 w-4" /> Meses Anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allPastMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhum mês anterior com dados arquivados.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allPastMonths.map((m) => (
                <button
                  key={m.month}
                  onClick={() => handleViewMonth(m)}
                  className="text-left p-4 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-accent/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{formatMonthLabel(m.month)}</span>
                    <Badge variant="outline" className="gap-1 text-xs"><Lock className="h-3 w-3" /> Arquivado</Badge>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Entradas</span><span className="text-income">{formatCurrency(Number(m.totals?.entradas || 0))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Saídas</span><span className="text-expense">{formatCurrency(Number(m.totals?.saidas || 0))}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-border/50 mt-1">
                      <span>Saldo</span>
                      <span className={Number(m.totals?.saldo || 0) >= 0 ? "text-income" : "text-expense"}>{formatCurrency(Number(m.totals?.saldo || 0))}</span>
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

      {/* Monthly Summary Cards (for Selected Month) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-income/10 flex items-center justify-center">
              <ArrowUpCircle className="h-6 w-6 text-income" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Entradas no Mês</p>
              <p className="text-xl font-bold text-income">{formatCurrency(dadosMensais.entradas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-expense/10 flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6 text-expense" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Saídas no Mês</p>
              <p className="text-xl font-bold text-expense">{formatCurrency(dadosMensais.saidas)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${dadosMensais.saldo >= 0 ? 'bg-blue-500/10' : 'bg-expense/10'}`}>
              <Wallet className={`h-6 w-6 ${dadosMensais.saldo >= 0 ? 'text-blue-500' : 'text-expense'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Saldo Final</p>
              <p className={`text-xl font-bold ${dadosMensais.saldo >= 0 ? 'text-blue-500' : 'text-expense'}`}>{formatCurrency(dadosMensais.saldo)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Table */}
        <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-expense" />
              Saídas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Total Gasto</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosMensais.categorias.length > 0 ? (
                  dadosMensais.categorias.map((cat) => (
                    <TableRow key={cat.nome}>
                      <TableCell className="font-medium">{cat.nome}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(cat.valor)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">{cat.percentual.toFixed(1)}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${cat.percentual}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Nenhuma despesa registrada para este mês.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Expenses & Distribution */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">🏆 Maiores Gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dadosMensais.topCategorias.map((cat, i) => (
                <div key={cat.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm font-medium">{cat.nome}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(cat.valor)}</span>
                </div>
              ))}
              {dadosMensais.topCategorias.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Distribuição</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] p-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosMensais.categorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="valor"
                    nameKey="nome"
                  >
                    {dadosMensais.categorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "hsl(224 18% 13%)", border: "1px solid hsl(224 12% 18%)", borderRadius: 8 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Annual Evolution */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Mensal ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] pt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosAnuais} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 12% 18%)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "hsl(215 12% 50%)", fontSize: 13 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${Math.abs(v) >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} dx={-10} />
              <Tooltip content={<CustomAnualTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="resultado" shape={<Custom3DBar />} label={renderCustomBarLabel} animationBegin={200} animationDuration={1500} />
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
