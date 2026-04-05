import { useState, useCallback, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CATEGORY_MAP: Record<string, string> = {
  gasolina: "transporte",
  combustível: "transporte",
  uber: "transporte",
  ônibus: "transporte",
  mercado: "alimentação",
  supermercado: "alimentação",
  restaurante: "alimentação",
  almoço: "alimentação",
  jantar: "alimentação",
  café: "alimentação",
  lanche: "alimentação",
  farmácia: "saúde",
  remédio: "saúde",
  médico: "saúde",
  academia: "saúde",
  aluguel: "moradia",
  condomínio: "moradia",
  luz: "moradia",
  água: "moradia",
  internet: "moradia",
  salário: "salário",
  freelance: "renda extra",
  pix: "transferência",
};

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return "outros";
}

function parseValue(text: string): number | null {
  // Match patterns like "55 reais e 39 centavos", "55,39", "55.39", "R$ 55", "55 reais"
  const normalized = text
    .toLowerCase()
    .replace(/r\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  // "X reais e Y centavos"
  const reaisMatch = normalized.match(/(\d+)\s*reais?\s*e?\s*(\d+)\s*centavos?/);
  if (reaisMatch) return parseFloat(`${reaisMatch[1]}.${reaisMatch[2].padStart(2, "0")}`);

  // "X reais"
  const simpleReais = normalized.match(/(\d+)\s*reais?/);
  if (simpleReais) return parseFloat(simpleReais[1]);

  // Pure number
  const numMatch = normalized.match(/(\d+\.?\d*)/);
  if (numMatch) return parseFloat(numMatch[1]);

  return null;
}

export function VoiceAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const processCommand = useCallback(
    async (transcript: string) => {
      const lower = transcript.toLowerCase().trim();
      setStatus(`"${transcript}"`);

      // Navigation commands
      if (lower.includes("abrir dashboard") || lower.includes("ir para dashboard")) {
        navigate("/");
        toast({ title: "🎙️ Navegando", description: "Abrindo Dashboard" });
        return;
      }
      if (lower.includes("abrir registros") || lower.includes("ir para registros")) {
        navigate("/registros");
        toast({ title: "🎙️ Navegando", description: "Abrindo Registros" });
        return;
      }
      if (lower.includes("abrir contas") || lower.includes("ir para contas")) {
        navigate("/contas");
        toast({ title: "🎙️ Navegando", description: "Abrindo Contas" });
        return;
      }

      // Add record commands
      const isExpense = lower.includes("gasto") || lower.includes("saída") || lower.includes("despesa");
      const isIncome = lower.includes("entrada") || lower.includes("receita") || lower.includes("salário") || lower.includes("renda");

      if (isExpense || isIncome) {
        const valor = parseValue(transcript);
        if (!valor || !user) {
          toast({ title: "🎙️ Não entendi o valor", description: "Tente novamente com o valor.", variant: "destructive" });
          return;
        }

        const tipo = isIncome ? "entrada" : "saida";
        const categoria = inferCategory(lower);
        const descricao = transcript;
        const data = new Date().toISOString().slice(0, 10);

        const { error } = await supabase.from("financial_records").insert({
          user_id: user.id,
          tipo,
          valor,
          categoria,
          descricao,
          data,
        });

        if (error) {
          toast({ title: "Erro ao registrar", description: error.message, variant: "destructive" });
        } else {
          toast({
            title: "🎙️ Registro adicionado!",
            description: `${tipo === "entrada" ? "Entrada" : "Saída"} de R$ ${valor.toFixed(2)} em ${categoria}`,
          });
          // Log command
          await supabase.from("ai_commands_history").insert({
            user_id: user.id,
            command: transcript,
            action_type: `voice_${tipo}`,
            response: `Registrado R$ ${valor.toFixed(2)} em ${categoria}`,
          });
        }
        return;
      }

      toast({ title: "🎙️ Comando não reconhecido", description: `"${transcript}"`, variant: "destructive" });
    },
    [user, navigate]
  );

  const toggleListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suporta", description: "Use Chrome ou Edge para comandos de voz.", variant: "destructive" });
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setStatus("");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      setStatus("Ouvindo...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processCommand(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      setStatus("");
      toast({ title: "Erro no microfone", description: "Tente novamente.", variant: "destructive" });
    };

    recognition.onend = () => {
      setListening(false);
      setTimeout(() => setStatus(""), 3000);
    };

    recognition.start();
  }, [listening, SpeechRecognition, processCommand]);

  if (!SpeechRecognition) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {status && (
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground max-w-[250px] shadow-lg animate-fade-in-up">
          {status}
        </div>
      )}
      <Button
        onClick={toggleListening}
        size="icon"
        className={`h-12 w-12 rounded-full shadow-lg transition-all ${
          listening
            ? "bg-destructive hover:bg-destructive/90 animate-pulse"
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
    </div>
  );
}
