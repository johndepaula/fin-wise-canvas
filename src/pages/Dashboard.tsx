import { useMemo, useState } from "react";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TODAS_CATEGORIAS } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBills } from "@/hooks/useBills";
import { TrendingUp, TrendingDown, CalendarDays, Tag, Lightbulb, Wallet } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardInfoBar } from "@/components/DashboardInfoBar";
import { formatCurrencyBRL } from "@/lib/currency";

type Periodo = string;

export default function Dashboard() {
  const { registros, loading } = useRegistrosContext();
  const { settings } = useUserSettings();
  const { bills } = useBills();
  const { profile } = useProfile();
  const { user } = useAuth();
  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = profile?.display_name || email.split("@")[0];
  const diasDoMesAtual = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate().toString();
  const [periodo, setPeriodo] = useState<Periodo>(diasDoMesAtual);
  const [catFiltro, setCatFiltro] = useState("todas");

  const filtrados = useMemo(() => {
    const now = new Date();
    return registros.filter((r) => {
      if (periodo !== "total") {
        const dias = parseInt(periodo);
        const diff = (now.getTime() - new Date(r.data).getTime()) / (1000 * 60 * 60 * 24);
        if (diff > dias) return false;
      }
      if (catFiltro !== "todas" && r.categoria !== catFiltro) return false;
      return true;
    });
  }, [registros, periodo, catFiltro]);

  const totalEntradas = filtrados.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
  const totalSaidas = filtrados.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);

  const diasPeriodo = periodo === "total" ? Math.max(1, Math.ceil((Date.now() - Math.min(...filtrados.map((r) => new Date(r.data).getTime()))) / (1000 * 60 * 60 * 24))) : parseInt(periodo);
  const gastoMedioDiario = totalSaidas / Math.max(1, diasPeriodo);

  const categoriaMaiorGasto = useMemo(() => {
    const map: Record<string, number> = {};
    filtrados.filter((r) => r.tipo === "saida").forEach((r) => { map[r.categoria] = (map[r.categoria] || 0) + r.valor; });
    const entries = Object.entries(map);
    if (!entries.length) return { nome: "—", valor: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { nome: entries[0][0], valor: entries[0][1] };
  }, [filtrados]);

  const gastosPorDia = useMemo(() => {
    const map: Record<string, number> = {};
    filtrados.filter((r) => r.tipo === "saida").forEach((r) => {
      const day = new Date(r.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map[day] = (map[day] || 0) + r.valor;
    });
    return Object.entries(map)
      .map(([dia, valor]) => ({ dia, valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => {
        const [da, ma] = a.dia.split("/").map(Number);
        const [db, mb] = b.dia.split("/").map(Number);
        return ma - mb || da - db;
      });
  }, [filtrados]);

  const despesasPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    filtrados.filter((r) => r.tipo === "saida").forEach((r) => { map[r.categoria] = (map[r.categoria] || 0) + r.valor; });
    return Object.entries(map)
      .map(([categoria, valor]) => ({ categoria, valor: Math.round(valor * 100) / 100 }))
      .sort((a, b) => b.valor - a.valor);
  }, [filtrados]);

  const insights = useMemo(() => {
    const list: { icon: typeof Lightbulb; text: string }[] = [];
    if (categoriaMaiorGasto.nome !== "—") {
      const pct = totalSaidas > 0 ? ((categoriaMaiorGasto.valor / totalSaidas) * 100).toFixed(0) : "0";
      list.push({ icon: Tag, text: `${categoriaMaiorGasto.nome} representa ${pct}% das suas despesas.` });
    }
    const maiorGasto = filtrados.filter((r) => r.tipo === "saida").sort((a, b) => b.valor - a.valor)[0];
    if (maiorGasto) {
      list.push({ icon: TrendingUp, text: `Seu maior gasto individual foi R$ ${maiorGasto.valor.toFixed(2)} em ${maiorGasto.categoria}.` });
    }
    if (gastoMedioDiario > 0) {
      list.push({ icon: CalendarDays, text: `Você gasta em média R$ ${gastoMedioDiario.toFixed(2)} por dia.` });
    }
    const saldo = totalEntradas - totalSaidas;
    if (saldo > 0) {
      list.push({ icon: TrendingUp, text: `Você está com saldo positivo de R$ ${saldo.toFixed(2)} no período.` });
    } else if (saldo < 0) {
      list.push({ icon: TrendingDown, text: `Atenção: suas saídas superaram as entradas em R$ ${Math.abs(saldo).toFixed(2)}.` });
    }
    return list;
  }, [filtrados, categoriaMaiorGasto, totalEntradas, totalSaidas, gastoMedioDiario]);

  const formatCurrency = formatCurrencyBRL;

  const totalGeralEntradas = registros.filter((r) => r.tipo === "entrada").reduce((s, r) => s + (r.valor || 0), 0);
  const totalGeralSaidas = registros.filter((r) => r.tipo === "saida").reduce((s, r) => s + (r.valor || 0), 0);
  const totalAPagar = bills.reduce((s, b) => s + (b.amount || 0), 0);
  const totalPago = bills.reduce((s, b) => s + (b.amount_paid || 0), 0);
  
  const restanteContas = totalAPagar - totalPago;
  const saldoBase = totalGeralEntradas - totalGeralSaidas;
  let saldoEmConta = saldoBase - restanteContas;
  
  if (Number.isNaN(saldoEmConta) || !Number.isFinite(saldoEmConta)) {
    saldoEmConta = 0;
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl">
        <div className="animate-fade-in-up">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
     <div className="space-y-8 max-w-7xl">
       {/* Profile Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <Avatar className="h-9 w-9 shrink-0">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
          <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
      </div>

      {/* Info Bar */}
      <DashboardInfoBar />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral das suas finanças</p>
        </div>
        <div className="flex gap-3">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value={diasDoMesAtual}>Últimos {diasDoMesAtual} dias</SelectItem>
              <SelectItem value="total">Total</SelectItem>
            </SelectContent>
          </Select>
          <Select value={catFiltro} onValueChange={setCatFiltro}>
            <SelectTrigger className="w-[160px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {TODAS_CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Saldo em Conta", value: formatCurrency(saldoEmConta), icon: Wallet, color: saldoEmConta >= 0 ? "text-income" : "text-expense", bg: saldoEmConta >= 0 ? "bg-income/10" : "bg-expense/10" },
          { label: "Total de Entradas", value: formatCurrency(totalEntradas), icon: TrendingUp, color: "text-income", bg: "bg-income/10" },
          { label: "Total de Saídas", value: formatCurrency(totalSaidas), icon: TrendingDown, color: "text-expense", bg: "bg-expense/10" },
          { label: "Gasto Médio Diário", value: formatCurrency(gastoMedioDiario), icon: CalendarDays, color: "text-muted-foreground", bg: "bg-muted" },
          { label: "Maior Gasto", value: categoriaMaiorGasto.nome, sub: formatCurrency(categoriaMaiorGasto.valor), icon: Tag, color: "text-muted-foreground", bg: "bg-muted" },
        ].map((kpi, i) => (
          <Card key={kpi.label} className={`animate-fade-in-up stagger-${i + 1} bg-card border-border hover:border-primary/20 transition-colors duration-200`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-xl font-semibold ${kpi.color !== "text-muted-foreground" ? kpi.color : "text-foreground"}`}>{kpi.value}</p>
              {"sub" in kpi && kpi.sub && <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — colors from user settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in-up stagger-3 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastos por Dia</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {gastosPorDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gastosPorDia}>
                  <defs>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={settings.chart_color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={settings.chart_color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 12% 18%)" />
                  <XAxis dataKey="dia" tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(224 18% 13%)", border: "1px solid hsl(224 12% 18%)", borderRadius: 8, color: "hsl(210 20% 92%)", fontSize: 12 }} formatter={(value: number) => [formatCurrency(value), "Gasto"]} />
                  <Area type={settings.chart_line_style as any} dataKey="valor" stroke={settings.chart_color} strokeWidth={2} fill="url(#colorGasto)" dot={{ fill: settings.chart_color, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up stagger-4 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {despesasPorCategoria.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despesasPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 12% 18%)" />
                  <XAxis dataKey="categoria" tick={{ fill: "hsl(215 12% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 12% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(224 18% 13%)", border: "1px solid hsl(224 12% 18%)", borderRadius: 8, color: "hsl(210 20% 92%)", fontSize: 12 }} />
                  <Bar dataKey="valor" fill={settings.category_chart_color} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados no período</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="animate-fade-in-up stagger-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" /> Insights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((ins, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ins.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{ins.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
