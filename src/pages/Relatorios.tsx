import { useMemo } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrencyBRL } from "@/lib/currency";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, BarChart3, Download } from "lucide-react";

const CustomAnualTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const currentYear = new Date().getFullYear();
    const formatCurrency = formatCurrencyBRL;
    
    return (
      <div className="bg-card border-border border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label} {currentYear}</p>
        <p className="text-income text-sm">Entradas: {formatCurrency(data.entradas)}</p>
        <p className="text-expense text-sm">Saídas: {formatCurrency(data.saidas)}</p>
        <div className="my-1 border-t border-border" />
        <p className={`text-sm font-bold ${data.resultado >= 0 ? 'text-income' : 'text-expense'}`}>
          Resultado: {formatCurrency(data.resultado)}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Margem: {data.percentual > -100 ? `${data.percentual.toFixed(1)}%` : '---'}
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

  const depth = width * 0.3; // Responsive depth
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
    <text 
      x={x + width / 2} 
      y={yPos} 
      fill={isPositive ? "#4ADE80" : "#F87171"} 
      textAnchor="middle" 
      fontSize={12} 
      fontWeight="bold"
    >
      {isPositive ? "+" : "-"}
    </text>
  );
};

export default function Relatorios() {
  const { registros } = useRegistrosContext();
  const formatCurrency = formatCurrencyBRL;
  const currentYear = new Date().getFullYear();

  const dadosAnuais = useMemo(() => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Initialize data array
    const data = meses.map((mes, index) => ({
      mes,
      mesIndex: index,
      entradas: 0,
      saidas: 0,
      resultado: 0,
      percentual: 0,
    }));

    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getFullYear() === currentYear) {
        const mesIndex = date.getMonth();
        if (r.tipo === "entrada") {
          data[mesIndex].entradas += Number(r.valor) || 0;
        } else if (r.tipo === "saida") {
          data[mesIndex].saidas += Number(r.valor) || 0;
        }
      }
    });

    data.forEach((d) => {
      d.resultado = d.entradas - d.saidas;
      if (d.entradas > 0) {
        d.percentual = (d.resultado / d.entradas) * 100;
      } else if (d.saidas > 0) {
        d.percentual = -100;
      }
    });

    return data;
  }, [registros, currentYear]);

  const resumoIR = useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    const categorias: Record<string, number> = {};

    registros.forEach((r) => {
      const date = new Date(r.data);
      if (date.getFullYear() === currentYear) {
        if (r.tipo === "entrada") entradas += Number(r.valor) || 0;
        if (r.tipo === "saida") {
          saidas += Number(r.valor) || 0;
          categorias[r.categoria] = (categorias[r.categoria] || 0) + (Number(r.valor) || 0);
        }
      }
    });

    const categoriasArray = Object.entries(categorias)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);

    return { entradas, saidas, saldo: entradas - saidas, categorias: categoriasArray };
  }, [registros, currentYear]);

  return (
    <div className="space-y-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground text-sm mt-1">Desempenho anual e preparação contábil</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
              <FileText className="h-4 w-4" />
              Relatório para IR
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Resumo para Imposto de Renda ({currentYear})
              </DialogTitle>
              <DialogDescription>
                Dados organizados para auxiliar no controle contábil.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-income/10 rounded-xl border border-income/20">
                  <p className="text-xs text-muted-foreground uppercase mb-1 font-medium tracking-wide">Total Entradas</p>
                  <p className="text-lg font-bold text-income">{formatCurrency(resumoIR.entradas)}</p>
                </div>
                <div className="p-4 bg-expense/10 rounded-xl border border-expense/20">
                  <p className="text-xs text-muted-foreground uppercase mb-1 font-medium tracking-wide">Total Saídas</p>
                  <p className="text-lg font-bold text-expense">{formatCurrency(resumoIR.saidas)}</p>
                </div>
              </div>
              
              <div className={`p-5 rounded-xl border shadow-sm ${resumoIR.saldo >= 0 ? 'bg-income/5 border-income/20' : 'bg-expense/5 border-expense/20'}`}>
                <p className="text-xs text-muted-foreground uppercase mb-1 font-medium tracking-wide">Saldo Anual</p>
                <p className={`text-3xl font-bold tracking-tight ${resumoIR.saldo >= 0 ? 'text-income' : 'text-expense'}`}>
                  {resumoIR.saldo > 0 ? '+' : ''}{formatCurrency(resumoIR.saldo)}
                </p>
              </div>

              <div className="pt-3 border-t border-border mt-2">
                <p className="text-sm font-semibold mb-3">Principais Categorias</p>
                <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
                  {resumoIR.categorias.map(cat => (
                    <div key={cat.nome} className="flex justify-between items-center text-sm group">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{cat.nome}</span>
                      <span className="font-semibold text-foreground bg-secondary/50 px-2 py-0.5 rounded">{formatCurrency(cat.valor)}</span>
                    </div>
                  ))}
                  {resumoIR.categorias.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-lg">Nenhuma despesa registrada.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-5 border-t border-border mt-2">
              <Button variant="outline" className="w-full gap-2 border-primary/20 hover:border-primary/50" onClick={() => alert("A exportação de dados para contabilidade estará disponível na próxima atualização.")}>
                <Download className="h-4 w-4" />
                Preparar Exportação (CSV)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            Evolução Mensal ({currentYear})
            <span className="text-xs font-normal text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
              Comparativo Entradas vs Saídas
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[450px] pt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosAnuais} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 12% 18%)" vertical={false} />
              <XAxis 
                dataKey="mes" 
                tick={{ fill: "hsl(215 12% 50%)", fontSize: 13, fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fill: "hsl(215 12% 50%)", fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `R$ ${Math.abs(v) >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} 
                dx={-10}
              />
              <Tooltip 
                content={<CustomAnualTooltip />} 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
              />
              
              <Bar 
                dataKey="resultado" 
                shape={<Custom3DBar />}
                label={renderCustomBarLabel}
                animationBegin={200}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
