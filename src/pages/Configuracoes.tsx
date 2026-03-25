import { useState, useEffect } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Configuracoes() {
  const { settings, loading, save } = useUserSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (!loading) setForm(settings);
  }, [loading, settings]);

  const handleSave = () => save(form);

  if (loading) {
    return (
      <div className="max-w-lg animate-fade-in-up">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-60 mb-8" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Configurações</h1>
      <p className="text-muted-foreground text-sm mb-8">Personalize a aparência dos gráficos</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="text-xs text-muted-foreground">Cor da Linha (Gastos por Dia)</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={form.chart_color}
                onChange={(e) => setForm((f) => ({ ...f, chart_color: e.target.value }))}
                className="h-10 w-10 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <Input value={form.chart_color} onChange={(e) => setForm((f) => ({ ...f, chart_color: e.target.value }))} className="bg-background border-border w-32" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cor das Barras (Despesas por Categoria)</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={form.category_chart_color}
                onChange={(e) => setForm((f) => ({ ...f, category_chart_color: e.target.value }))}
                className="h-10 w-10 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <Input value={form.category_chart_color} onChange={(e) => setForm((f) => ({ ...f, category_chart_color: e.target.value }))} className="bg-background border-border w-32" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cor de Fundo (Dashboard)</Label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={form.background_color}
                onChange={(e) => setForm((f) => ({ ...f, background_color: e.target.value }))}
                className="h-10 w-10 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <Input value={form.background_color} onChange={(e) => setForm((f) => ({ ...f, background_color: e.target.value }))} className="bg-background border-border w-32" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Estilo da Linha do Gráfico</Label>
            <Select value={form.chart_line_style} onValueChange={(v) => setForm((f) => ({ ...f, chart_line_style: v }))}>
              <SelectTrigger className="bg-background border-border mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monotone">Suave (monotone)</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="step">Degrau (step)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full">Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
}
