import { useMemo, useState } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { formatCurrencyBRL } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, ArrowUpCircle, ArrowDownCircle, Wallet, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PIE_COLORS = [
  "#2DD4BF", "#22D3EE", "#818CF8", "#C084FC", "#F472B6",
  "#FB7185", "#FDA4AF", "#FCD34D", "#A3E635", "#4ADE80",
];

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
  const formatCurrency = formatCurrencyBRL;
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const anos = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - 2 + i).toString());

  const dadosAnuais = useMemo(() => {
    const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const data = mesesAbrev.map((mes, index) => ({
      mes,
      mesIndex: index,
      entradas: 0,
      saidas: 0,
      resultado: 0,
    }));

    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getFullYear().toString() === selectedYear) {
        const mesIndex = date.getMonth();
        if (r.tipo === "entrada") data[mesIndex].entradas += Number(r.valor) || 0;
        else if (r.tipo === "saida") data[mesIndex].saidas += Number(r.valor) || 0;
      }
    });

    data.forEach((d) => { d.resultado = d.entradas - d.saidas; });
    return data;
  }, [registros, selectedYear]);

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

      <Card className="bg-card border-border">
        <CardHeader>
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
    </div>
  );
}
