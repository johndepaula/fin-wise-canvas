import { useState, useRef } from "react";
import { useAssistant } from "@/hooks/useAssistant";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Terminal } from "lucide-react";

export function CommandBar() {
  const [value, setValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { process } = useAssistant();

  const handleSubmit = async () => {
    if (!value.trim() || processing) return;
    setProcessing(true);
    try {
      const response = await process(value);
      toast({ title: "Assistente", description: response });
      setValue("");
    } catch {
      toast({ title: "Erro", description: "Falha ao processar comando.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-card/50">
      <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Digite um comando... ex: 'adicionar gasto 50 transporte gasolina'"
        className="h-8 text-sm border-none bg-transparent shadow-none focus-visible:ring-0"
        disabled={processing}
      />
    </div>
  );
}
