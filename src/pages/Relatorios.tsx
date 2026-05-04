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
import { FileText, BarChart3, Download, Calendar, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingDown, Archive, Eye, Lock, Search, X, Bot, MessageSquare, Sparkles } from "lucide-react";

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

import { useBillsContext } from "@/contexts/BillsContext";

export default function Relatorios() {
  const { registros } = useRegistrosContext();
  const { bills } = useBillsContext();
  const { closures, loadClosure } = useMonthlyClosure();
  const { months: historicalMonths } = useHistoricalMonths();
  const formatCurrency = formatCurrencyBRL;
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [openClosure, setOpenClosure] = useState<ClosureFull | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [isChatActive, setIsChatActive] = useState(false);

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  const monthToNum: Record<string, number> = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12
  };

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

  const handleViewMonth = async (m: { month: string; source: "closure" | "auto" }, startChat = false) => {
    if (m.source === "closure") {
      const c = await loadClosure(m.month);
      if (c) { 
        setOpenClosure(c); 
        setViewOpen(true); 
        setIsChatActive(startChat);
        setChatSearch("");
      }
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
        setIsChatActive(startChat);
        setChatSearch("");
      }
    }
  };

  const handleGlobalSearch = (val: string) => {
    setSearchQuery(val);
    const lowerQ = val.toLowerCase();
    
    const monthMatch = lowerQ.match(/(?:abrir|ver|mês de|mês)?\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i);
    
    if (monthMatch) {
      const monthName = monthMatch[1].toLowerCase();
      const monthNum = monthToNum[monthName];
      if (monthNum) {
        const found = allPastMonths.find(m => {
          const [_, mm] = m.month.split("-").map(Number);
          return mm === monthNum;
        });
        
        if (found) {
          handleViewMonth(found, true);
          setSearchQuery("");
          setShowSearch(false);
        }
      }
    }
  };

  const filteredPastMonths = useMemo(() => {
    if (!searchQuery) return allPastMonths;
    const q = searchQuery.toLowerCase();
    
    return allPastMonths.filter(m => {
      const label = formatMonthLabel(m.month).toLowerCase();
      if (label.includes(q)) return true;
      
      const hist = historicalMonths.find(h => h.month === m.month);
      if (hist) {
        return hist.records.some(r => {
          const dateStr = (r.data || "").slice(0, 10).split("-").reverse().join("/");
          return r.categoria.toLowerCase().includes(q) || 
            r.descricao.toLowerCase().includes(q) ||
            r.tipo.toLowerCase().includes(q) ||
            dateStr.includes(q) ||
            r.data.includes(q);
        });
      }
      return false;
    });
  }, [allPastMonths, searchQuery, historicalMonths]);

  const filteredRecords = useMemo(() => {
    if (!openClosure) return [];
    if (!chatSearch) return openClosure.records || [];
    const q = chatSearch.toLowerCase();
    return (openClosure.records || []).filter((r: any) => {
      const dateStr = (r.data || "").slice(0, 10).split("-").reverse().join("/");
      return r.categoria.toLowerCase().includes(q) ||
        r.descricao.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q) ||
        dateStr.includes(q) ||
        r.data.includes(q)
    });
  }, [openClosure, chatSearch]);

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
          const normalizedCat = r.categoria.charAt(0).toUpperCase() + r.categoria.slice(1).toLowerCase();
          categorias[normalizedCat] = (categorias[normalizedCat] || 0) + (Number(r.valor) || 0);
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

    const contasDoMes = bills.filter((b) => {
      const date = new Date(b.due_date + "T00:00:00");
      return date.getMonth().toString() === selectedMonth && date.getFullYear().toString() === selectedYear;
    }).sort((a, b) => a.due_date.localeCompare(b.due_date));

    return { 
      entradas, 
      saidas, 
      saldo: entradas - saidas, 
      categorias: categoriasArray,
      topCategorias: categoriasArray.slice(0, 5),
      contas: contasDoMes
    };
  }, [registros, bills, selectedMonth, selectedYear]);

  const closureCategorias = useMemo(() => {
    if (!openClosure) return [];
    const map: Record<string, number> = {};
    (openClosure.records || []).filter((r: any) => r.tipo === "saida").forEach((r: any) => {
      const normalizedCat = r.categoria.charAt(0).toUpperCase() + r.categoria.slice(1).toLowerCase();
      map[normalizedCat] = (map[normalizedCat] || 0) + Number(r.valor);
    });
    const totalSaidas = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([nome, valor]) => ({ 
        nome, 
        valor,
        percentual: totalSaidas > 0 ? (valor / totalSaidas) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
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
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Archive className="h-4 w-4" /> Meses Anteriores
            </CardTitle>
            <div className="flex items-center gap-2">
              {showSearch ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Pesquisar..."
                      className="bg-background border border-border rounded-full py-1.5 pl-8 pr-4 text-xs w-[180px] sm:w-[240px] focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      value={searchQuery}
                      onChange={(e) => handleGlobalSearch(e.target.value)}
                    />
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 h-8 rounded-full border-primary/20 hover:border-primary/50" onClick={() => setShowSearch(true)}>
                  <Search className="h-3.5 w-3.5" />
                  Pesquisar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPastMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {searchQuery ? "Nenhum resultado encontrado para esta pesquisa." : "Nenhum mês anterior com dados arquivados."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPastMonths.map((m) => (
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
              <div className="bg-accent/10 p-4 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary/80">Assistente Inteligente</p>
                    <p className="text-xs text-muted-foreground">O que você deseja ver em {formatMonthLabel(openClosure.month)}?</p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Sparkles className="h-4 w-4 text-primary/50 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input 
                    type="text"
                    className="w-full bg-background/50 border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="Ex: transporte, alimentação, uber, entrada, saida..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    autoFocus
                  />
                  {chatSearch && (
                    <button 
                      onClick={() => setChatSearch("")}
                      className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

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
                      {filteredRecords.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{(r.data || "").slice(0, 10).split("-").reverse().join("/")}</TableCell>
                          <TableCell><Badge variant="outline" className={`text-xs ${r.tipo === "entrada" ? "text-income border-income/30" : "text-expense border-expense/30"}`}>{r.tipo}</Badge></TableCell>
                          <TableCell className="text-xs">{r.categoria}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.descricao}</TableCell>
                          <TableCell className={`text-xs text-right tabular-nums ${r.tipo === "entrada" ? "text-income" : "text-expense"}`}>{formatCurrency(Number(r.valor))}</TableCell>
                        </TableRow>
                      ))}
                      {filteredRecords.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                          {chatSearch ? `Nenhum registro encontrado para "${chatSearch}"` : "Sem registros"}
                        </TableCell></TableRow>
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
                            <TableCell><Badge variant="outline" className={`text-xs ${remaining <= 0 ? "text-income border-income/30" : "text-expense border-expense/30"}`}>{remaining <= 0 ? "Pago" : "Não pago"}</Badge></TableCell>
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

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
