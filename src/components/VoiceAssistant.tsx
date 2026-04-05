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
  const normalized = text
    .toLowerCase()
    .replace(/r\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const reaisMatch = normalized.match(/(\d+)\s*reais?\s*e?\s*(\d+)\s*centavos?/);
  if (reaisMatch) return parseFloat(`${reaisMatch[1]}.${reaisMatch[2].padStart(2, "0")}`);

  const simpleReais = normalized.match(/(\d+)\s*reais?/);
  if (simpleReais) return parseFloat(simpleReais[1]);

  const numMatch = normalized.match(/(\d+\.?\d*)/);
  if (numMatch) return parseFloat(numMatch[1]);

  return null;
}

function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }
}

interface PendingCommand {
  tipo: "entrada" | "saida";
  descricao: string;
  categoria: string;
}

export function VoiceAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<any>(null);
  const pendingRef = useRef<PendingCommand | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      setStatus("🎙️ Ouvindo...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleTranscript(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      setStatus("");
      toast({ title: "Erro no microfone", description: "Tente novamente.", variant: "destructive" });
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }, [SpeechRecognition]);

  const listenForValue = useCallback(() => {
    if (!SpeechRecognition) return;
    // Small delay so TTS finishes before listening
    setTimeout(() => {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setListening(true);
        setStatus("🎙️ Aguardando valor...");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleValueResponse(transcript);
      };

      recognition.onerror = () => {
        setListening(false);
        setStatus("");
        pendingRef.current = null;
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    }, 1500);
  }, [SpeechRecognition]);

  const saveRecord = useCallback(async (tipo: string, valor: number, categoria: string, descricao: string) => {
    if (!user) return;
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
      const msg = "Erro ao registrar. Tente novamente.";
      speak(msg);
      setStatus(`❌ ${msg}`);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const msg = `Registro adicionado! ${tipo === "entrada" ? "Entrada" : "Saída"} de ${valor.toFixed(2)} reais em ${categoria}.`;
      speak(msg);
      setStatus(`✅ R$ ${valor.toFixed(2)} → ${categoria}`);
      toast({ title: "🎙️ Registro adicionado!", description: `${tipo === "entrada" ? "Entrada" : "Saída"} de R$ ${valor.toFixed(2)} em ${categoria}` });

      await supabase.from("ai_commands_history").insert({
        user_id: user.id,
        command: descricao,
        action_type: `voice_${tipo}`,
        response: `Registrado R$ ${valor.toFixed(2)} em ${categoria}`,
      });
    }

    setTimeout(() => setStatus(""), 4000);
  }, [user]);

  const handleValueResponse = useCallback((transcript: string) => {
    const pending = pendingRef.current;
    if (!pending) return;

    setStatus(`"${transcript}"`);
    const valor = parseValue(transcript);

    if (!valor) {
      const msg = "Não entendi o valor. Pode repetir?";
      speak(msg);
      setStatus(`❓ ${msg}`);
      pendingRef.current = null;
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    pendingRef.current = null;
    saveRecord(pending.tipo, valor, pending.categoria, pending.descricao);
  }, [saveRecord]);

  const handleTranscript = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    setStatus(`"${transcript}"`);

    // Navigation
    if (lower.includes("abrir dashboard") || lower.includes("ir para dashboard")) {
      navigate("/");
      speak("Abrindo Dashboard");
      toast({ title: "🎙️ Navegando", description: "Abrindo Dashboard" });
      setTimeout(() => setStatus(""), 2000);
      return;
    }
    if (lower.includes("abrir registros") || lower.includes("ir para registros")) {
      navigate("/registros");
      speak("Abrindo Registros");
      toast({ title: "🎙️ Navegando", description: "Abrindo Registros" });
      setTimeout(() => setStatus(""), 2000);
      return;
    }
    if (lower.includes("abrir contas") || lower.includes("ir para contas")) {
      navigate("/contas");
      speak("Abrindo Contas");
      toast({ title: "🎙️ Navegando", description: "Abrindo Contas" });
      setTimeout(() => setStatus(""), 2000);
      return;
    }
    if (lower.includes("abrir relatório") || lower.includes("ir para relatório")) {
      navigate("/relatorios");
      speak("Abrindo Relatórios");
      toast({ title: "🎙️ Navegando", description: "Abrindo Relatórios" });
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    // Record commands
    const isExpense = lower.includes("gasto") || lower.includes("saída") || lower.includes("despesa");
    const isIncome = lower.includes("entrada") || lower.includes("receita") || lower.includes("salário") || lower.includes("renda");

    if (isExpense || isIncome) {
      const tipo = isIncome ? "entrada" : "saida";
      const categoria = inferCategory(lower);
      const valor = parseValue(transcript);

      // If value already in the phrase, save directly
      if (valor) {
        saveRecord(tipo as "entrada" | "saida", valor, categoria, transcript);
        return;
      }

      // Otherwise, ask for value (conversational flow)
      pendingRef.current = { tipo: tipo as "entrada" | "saida", descricao: transcript, categoria };
      const msg = "Qual valor deseja adicionar?";
      speak(msg);
      setStatus(`🎙️ ${msg}`);
      listenForValue();
      return;
    }

    // Unknown
    const msg = "Não entendi o comando. Tente dizer: adicionar gasto de gasolina 50 reais.";
    speak(msg);
    setStatus(`❓ "${transcript}"`);
    toast({ title: "🎙️ Comando não reconhecido", description: `"${transcript}"`, variant: "destructive" });
    setTimeout(() => setStatus(""), 4000);
  }, [navigate, saveRecord, listenForValue]);

  const toggleListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suporta", description: "Use Chrome ou Edge para comandos de voz.", variant: "destructive" });
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setStatus("");
      pendingRef.current = null;
      return;
    }

    startListening();
  }, [listening, SpeechRecognition, startListening]);

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
