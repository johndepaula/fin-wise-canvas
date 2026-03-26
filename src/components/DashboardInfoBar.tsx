import { useClock } from "@/hooks/useClock";
import { useWeather } from "@/hooks/useWeather";
import { useBills } from "@/hooks/useBills";
import { Clock, MapPin, Calendar, DollarSign } from "lucide-react";

export function DashboardInfoBar() {
  const { time, date, now } = useClock();
  const weather = useWeather();
  const { bills } = useBills();

  // Dias restantes no mês
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const diasRestantes = Math.max(0, lastDay - now.getDate());

  // Valor por dia baseado em contas
  const totalContas = bills.reduce((s, b) => s + b.amount, 0);
  const totalPago = bills.reduce((s, b) => s + b.amount_paid, 0);
  const restante = Math.max(0, totalContas - totalPago);
  const valorPorDia = diasRestantes > 0 ? restante / diasRestantes : restante;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground animate-fade-in-up">
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {time}
      </span>
      <span className="hidden sm:inline text-border">|</span>
      <span className="hidden sm:flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {date}
      </span>
      {!weather.loading && weather.condition !== "—" && (
        <>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {weather.temperature}°C {weather.condition}
          </span>
        </>
      )}
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {diasRestantes} dias restantes
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5" />
        R$ {valorPorDia.toFixed(2)}/dia
      </span>
    </div>
  );
}
