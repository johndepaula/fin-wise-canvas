import { useClock } from "@/hooks/useClock";
import { useWeather } from "@/hooks/useWeather";
import { useBills } from "@/hooks/useBills";
import { useRegistrosContext } from "@/contexts/RegistrosContext";
import { Clock, MapPin, Calendar, DollarSign, Wallet } from "lucide-react";

export function DashboardInfoBar() {
  const { time, date, now } = useClock();
  const weather = useWeather();
  const { bills } = useBills();
  const { registros } = useRegistrosContext();

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(0, lastDay - now.getDate());

  const totalEntradas = registros.filter((r) => r.tipo === "entrada").reduce((s, r) => s + r.valor, 0);
  const totalSaidas = registros.filter((r) => r.tipo === "saida").reduce((s, r) => s + r.valor, 0);
  const saldoReal = totalEntradas - totalSaidas;

  const totalContas = bills.reduce((s, b) => s + b.amount, 0);
  const totalPago = bills.reduce((s, b) => s + b.amount_paid, 0);
  const restanteContas = Math.max(0, totalContas - totalPago);

  const valorPorDia = diasRestantes > 0 ? Math.max(0, restanteContas - saldoReal) / diasRestantes : restanteContas;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground animate-fade-in-up">
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{time}</span>
      </span>
      <span className="hidden sm:inline text-border">|</span>
      <span className="hidden sm:flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{date}</span>
      </span>
      {!weather.loading && weather.condition !== "—" && (
        <>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-semibold text-foreground">
              {weather.city ? `${weather.city} — ` : ""}{weather.temperature}°C {weather.condition}
            </span>
          </span>
        </>
      )}
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{diasRestantes} dias restantes</span>
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">R$ {valorPorDia.toFixed(2)}/dia</span>
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5" />
        <span className={`font-semibold ${saldoReal >= 0 ? "text-income" : "text-expense"}`}>
          Saldo: R$ {saldoReal.toFixed(2)}
        </span>
      </span>
    </div>
  );
}
