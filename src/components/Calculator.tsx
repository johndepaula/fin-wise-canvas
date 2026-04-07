import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator as CalcIcon, Delete } from "lucide-react";

export function CalculatorModal({ collapsed }: { collapsed?: boolean }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePress = useCallback((val: string) => {
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
      // Prevent leading zeros unless it's a decimal
      setDisplay(display === "0" && val !== "." ? val : display + val);
    }
  }, [display, resetNext]);

  const calculate = useCallback(() => {
    if (prev === null || !op) return;
    const cur = parseFloat(display);
    let result = 0;
    switch (op) {
      case "+": result = prev + cur; break;
      case "−": result = prev - cur; break;
      case "×": result = prev * cur; break;
      case "÷": result = cur !== 0 ? prev / cur : 0; break;
    }
    // Limit precision to avoid float issues
    setDisplay(Number.isFinite(result) ? String(Math.round(result * 100000000) / 100000000) : "Erro");
    setPrev(null);
    setOp(null);
    setResetNext(true);
  }, [display, prev, op]);

  const handleBackspace = useCallback(() => {
    if (resetNext || display === "Erro") {
      setDisplay("0");
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }, [display, resetNext]);

  // Keyboard Support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block if interacting with input fields somehow
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        handlePress(key);
        e.preventDefault();
      } else if (key === '.' || key === ',') {
        handlePress('.');
        e.preventDefault();
      } else if (key === '+') {
        handlePress('+');
        e.preventDefault();
      } else if (key === '-') {
        handlePress('−');
        e.preventDefault();
      } else if (key === '*') {
        handlePress('×');
        e.preventDefault();
      } else if (key === '/') {
        handlePress('÷');
        e.preventDefault();
      } else if (key === 'Enter' || key === '=') {
        calculate();
        e.preventDefault();
      } else if (key === 'Escape') {
        handlePress('C');
        e.preventDefault();
      } else if (key === 'Backspace') {
        handleBackspace();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePress, calculate, handleBackspace]);

  // UI display formatting
  const formatDisplay = (val: string) => {
    if (val === "Erro") return val;
    // Handle negative sign correctly
    const isNegative = val.startsWith("-");
    const cleanVal = isNegative ? val.substring(1) : val;
    
    const parts = cleanVal.split(".");
    // Add Brazilian thousands separator (.) and decimal (,)
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formatted = parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center w-full cursor-pointer group mx-[11px]">
          <CalcIcon className="mr-2.5 h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
          {!collapsed && <span>Calculadora</span>}
        </div>
      </DialogTrigger>
      <DialogContent className="bg-card border-border shadow-2xl sm:max-w-xs p-5 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-left font-semibold text-muted-foreground flex items-center gap-2">
            <CalcIcon className="h-4 w-4" /> Calculadora
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Display Setup */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 text-right flex flex-col justify-end h-24 shadow-inner">
            <span className="text-xs text-muted-foreground font-medium mb-1 tracking-wider h-4">
              {prev !== null && op ? `${formatDisplay(String(prev))} ${op}` : ''}
            </span>
            <span className="text-4xl font-semibold tabular-nums text-foreground truncate tracking-tight">
              {formatDisplay(display)}
            </span>
          </div>

          {/* Grids with feedback capabilities */}
          <div className="grid grid-cols-4 gap-2.5">
            <Button onClick={() => handlePress('C')} variant="destructive" className="col-span-2 h-14 text-lg font-semibold rounded-lg shadow-sm active:scale-95 transition-all">C</Button>
            <Button onClick={handleBackspace} variant="secondary" className="h-14 text-lg rounded-lg shadow-sm active:scale-95 transition-all bg-secondary/80 hover:bg-secondary">
              <Delete className="h-5 w-5" />
            </Button>
            <Button onClick={() => handlePress('÷')} variant="secondary" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-primary/10 hover:bg-primary/20 text-primary">÷</Button>
            
            <Button onClick={() => handlePress('7')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">7</Button>
            <Button onClick={() => handlePress('8')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">8</Button>
            <Button onClick={() => handlePress('9')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">9</Button>
            <Button onClick={() => handlePress('×')} variant="secondary" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-primary/10 hover:bg-primary/20 text-primary">×</Button>
            
            <Button onClick={() => handlePress('4')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">4</Button>
            <Button onClick={() => handlePress('5')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">5</Button>
            <Button onClick={() => handlePress('6')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">6</Button>
            <Button onClick={() => handlePress('−')} variant="secondary" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-primary/10 hover:bg-primary/20 text-primary">−</Button>
            
            <Button onClick={() => handlePress('1')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">1</Button>
            <Button onClick={() => handlePress('2')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">2</Button>
            <Button onClick={() => handlePress('3')} variant="outline" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">3</Button>
            <Button onClick={() => handlePress('+')} variant="secondary" className="h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-primary/10 hover:bg-primary/20 text-primary">+</Button>
            
            <Button onClick={() => handlePress('0')} variant="outline" className="col-span-2 h-14 text-xl font-medium rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">0</Button>
            <Button onClick={() => handlePress('.')} variant="outline" className="h-14 text-2xl font-bold rounded-lg shadow-sm active:scale-95 transition-all bg-background hover:bg-muted">,</Button>
            <Button onClick={calculate} className="h-14 text-xl font-semibold rounded-lg shadow-md active:scale-95 transition-all bg-primary hover:bg-primary/90 text-primary-foreground">=</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
