import { useState } from "react";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, Plus, Trash2, TrendingUp } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/currency";
import { CurrencyInput } from "@/components/CurrencyInput";

export function FinancialGoals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinancialGoals();
  const [open, setOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositValue, setDepositValue] = useState("");
  const [form, setForm] = useState({ title: "", target_amount: "", deadline: "" });

  const handleAdd = async () => {
    const target = parseFloat(form.target_amount.replace(/\./g, "").replace(",", "."));
    if (!form.title || !target) return;
    await addGoal({ title: form.title, target_amount: target, deadline: form.deadline || undefined });
    setForm({ title: "", target_amount: "", deadline: "" });
    setOpen(false);
  };

  const handleDeposit = async (goalId: string, currentAmount: number) => {
    const val = parseFloat(depositValue.replace(/\./g, "").replace(",", "."));
    if (!val || val <= 0) return;
    await updateGoal(goalId, { current_amount: currentAmount + val });
    setDepositGoalId(null);
    setDepositValue("");
  };

  return (
    <div className="animate-fade-in-up stagger-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" /> Metas Financeiras
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Meta Financeira</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Nome da meta (ex: Viagem, Reserva)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <CurrencyInput value={form.target_amount} onChange={(v) => setForm((f) => ({ ...f, target_amount: v }))} placeholder="Valor alvo" />
              <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              <Button onClick={handleAdd} className="w-full">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            Nenhuma meta criada. Clique em "Nova Meta" para começar!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
            const completed = pct >= 100;
            return (
              <Card key={goal.id} className="bg-card border-border hover:border-primary/20 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${completed ? "bg-income/10" : "bg-primary/10"}`}>
                        {completed ? <TrendingUp className="h-3.5 w-3.5 text-income" /> : <Target className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <span className="text-sm font-medium">{goal.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-expense" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{formatCurrencyBRL(goal.current_amount)}</span>
                      <span>{formatCurrencyBRL(goal.target_amount)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% concluído</p>
                  </div>

                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Prazo: {(() => { const d = goal.deadline.slice(0, 10).split("-"); return `${d[2]}/${d[1]}/${d[0]}`; })()}
                    </p>
                  )}

                  {!completed && (
                    depositGoalId === goal.id ? (
                      <div className="flex gap-2">
                        <CurrencyInput value={depositValue} onChange={setDepositValue} placeholder="Valor" className="flex-1" />
                        <Button size="sm" className="h-9" onClick={() => handleDeposit(goal.id, goal.current_amount)}>OK</Button>
                        <Button size="sm" variant="ghost" className="h-9" onClick={() => setDepositGoalId(null)}>✕</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => setDepositGoalId(goal.id)}>
                        + Depositar
                      </Button>
                    )
                  )}

                  {completed && <p className="text-xs text-income font-medium text-center">🎉 Meta alcançada!</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
