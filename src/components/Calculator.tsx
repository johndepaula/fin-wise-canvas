import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator as CalcIcon } from "lucide-react";

const buttons = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  ["C", "0", ".", "+"],
];

export function CalculatorModal({ collapsed }: { collapsed?: boolean }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  const handlePress = (val: string) => {
    if (val === "C") {
      setDisplay("0");
      setPrev(null);
      setOp(null);
      setResetNext(false);
      return;
    }

    if (["+", "−", "×", "÷"].includes(val)) {
      setPrev(parseFloat(display));
      setOp(val);
      setResetNext(true);
      return;
    }

    if (val === "." && display.includes(".")) return;

    if (resetNext) {
      setDisplay(val === "." ? "0." : val);
      setResetNext(false);
    } else {
      setDisplay(display === "0" && val !== "." ? val : display + val);
    }
  };

  const calculate = () => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    let result = 0;
    switch (op) {
      case "+": result = prev + cur; break;
      case "−": result = prev - cur; break;
      case "×": result = prev * cur; break;
      case "÷": result = cur !== 0 ? prev / cur : 0; break;
    }
    setDisplay(Number.isFinite(result) ? String(Math.round(result * 100000000) / 100000000) : "Erro");
    setPrev(null);
    setOp(null);
    setResetNext(true);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center w-full cursor-pointer">
          <CalcIcon className="mr-2.5 h-4 w-4 shrink-0" />
          {!collapsed && <span>Calculadora</span>}
        </div>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Calculadora</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-background border border-border rounded-lg p-3 text-right text-2xl font-mono tabular-nums truncate">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn) => (
              <Button
                key={btn}
                variant={["+", "−", "×", "÷"].includes(btn) ? "secondary" : btn === "C" ? "destructive" : "outline"}
                className="h-12 text-lg font-medium"
                onClick={() => handlePress(btn)}
              >
                {btn}
              </Button>
            ))}
            <Button className="col-span-4 h-12 text-lg font-semibold" onClick={calculate}>
              =
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
