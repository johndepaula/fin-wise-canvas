import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Configuracoes() {
  const { settings, save } = useUserSettings();
  const [form, setForm] = useState(settings);

  // Sync when settings load
  const [synced, setSynced] = useState(false);
  if (!synced && settings.chart_color !== "#8B5CF6" || !synced && settings.chart_line_style !== "monotone") {
    setForm(settings);
    setSynced(true);
  }

  const handleSave = () => save(form);

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Configurações</h1>
      <p className="text-muted-foreground text-sm mb-8">Personalize a aparência dos gráficos</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          <div>
            <Label className="text-xs text-muted-foreground">Cor dos Gráficos</Label>
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
