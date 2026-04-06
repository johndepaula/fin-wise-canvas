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
  passagem: "transporte",
  estacionamento: "transporte",
  pedágio: "transporte",
  mercado: "alimentação",
  supermercado: "alimentação",
  restaurante: "alimentação",
  almoço: "alimentação",
  jantar: "alimentação",
  café: "alimentação",
  lanche: "alimentação",
  comida: "alimentação",
  padaria: "alimentação",
  farmácia: "saúde",
  remédio: "saúde",
  médico: "saúde",
  academia: "saúde",
  hospital: "saúde",
  consulta: "saúde",
  aluguel: "moradia",
  condomínio: "moradia",
  luz: "moradia",
  energia: "moradia",
  água: "moradia",
  internet: "moradia",
  gás: "moradia",
  salário: "salário",
  freelance: "renda extra",
  pix: "transferência",
  roupa: "vestuário",
  sapato: "vestuário",
  escola: "educação",
  curso: "educação",
  faculdade: "educação",
  presente: "presente",
};

const NAV_ROUTES: Array<{ keywords: string[]; path: string; label: string }> = [
  { keywords: ["dashboard", "início", "inicio", "home", "painel"], path: "/", label: "Dashboard" },
  { keywords: ["registro", "registros", "meus registros", "lançamento"], path: "/registros", label: "Registros" },
  { keywords: ["conta", "contas", "boleto", "boletos"], path: "/contas", label: "Contas" },
  { keywords: ["relatório", "relatórios", "relatorio", "relatorios"], path: "/relatorios", label: "Relatórios" },
  { keywords: ["configuração", "configurações", "ajuste", "ajustes", "config"], path: "/configuracoes", label: "Configurações" },
  { keywords: ["perfil", "meu perfil"], path: "/perfil", label: "Perfil" },
  { keywords: ["feedback", "sugestão", "sugestões"], path: "/feedback", label: "Feedback" },
  { keywords: ["indicação", "indicações", "indicar", "convite"], path: "/indicacoes", label: "Indicações" },
];

function inferCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return "outros";
}

function inferDescription(text: string): string {
  const lower = text.toLowerCase();
  for (const keyword of Object.keys(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return keyword;
  }
  const cleaned = lower
    .replace(/adicionar|gasto|despesa|saída|saida|entrada|receita|renda|de|do|da|um|uma/g, "")
    .trim();
  return cleaned || "registro por voz";
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

function matchesNav(text: string): { path: string; label: string } | null {
  const lower = text.toLowerCase();
  const navPrefixes = ["abrir", "ir para", "ir pra", "mostrar", "ver", "acessar", "navegar"];
  const hasNavIntent = navPrefixes.some((p) => lower.includes(p));
  if (!hasNavIntent) return null;

  for (const route of NAV_ROUTES) {
    if (route.keywords.some((kw) => lower.includes(kw))) {
      return { path: route.path, label: route.label };
    }
  }
  return null;
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
    const now = new Date();
    const data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const { error } = await supabase.from("financial_records").insert({
      user_id: user.id,
      tipo,
      valor,
      categoria,
      descricao,
      data: data + "T12:00:00",
    });

    if (error) {
      const msg = "Erro ao registrar. Tente novamente.";
      speak(msg);
      setStatus(`❌ ${msg}`);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const tipoLabel = tipo === "entrada" ? "Entrada" : "Saída";
      const msg = `Registro adicionado! ${tipoLabel} de ${valor.toFixed(2)} reais em ${categoria}.`;
      speak(msg);
      setStatus(`✅ R$ ${valor.toFixed(2)} → ${categoria}`);
      toast({ title: "🎙️ Registro adicionado!", description: `${tipoLabel} de R$ ${valor.toFixed(2)} em ${categoria}` });

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
    const nav = matchesNav(lower);
    if (nav) {
      navigate(nav.path);
      speak(`Abrindo ${nav.label}`);
      toast({ title: "🎙️ Navegando", description: `Abrindo ${nav.label}` });
      setTimeout(() => setStatus(""), 2000);
      return;
    }

    // Record commands - flexible keyword matching
    const expenseKeywords = ["gasto", "saída", "saida", "despesa", "paguei", "pagar", "comprei", "compra", "gastei"];
    const incomeKeywords = ["entrada", "receita", "salário", "renda", "recebi", "ganhei", "ganho"];

    const isExpense = expenseKeywords.some((kw) => lower.includes(kw));
    const isIncome = incomeKeywords.some((kw) => lower.includes(kw));

    if (isExpense || isIncome) {
      const tipo = isIncome ? "entrada" : "saida";
      const categoria = inferCategory(lower);
      const descricao = inferDescription(lower);
      const valor = parseValue(transcript);

      if (valor) {
        saveRecord(tipo, valor, categoria, descricao);
        return;
      }

      pendingRef.current = { tipo: tipo as "entrada" | "saida", descricao, categoria };
      const msg = "Qual valor deseja adicionar?";
      speak(msg);
      setStatus(`🎙️ ${msg}`);
      listenForValue();
      return;
    }

    // Fallback with helpful guidance
    const msg = "Não entendi. Tente dizer: adicionar gasto de gasolina 50 reais, ou abrir dashboard.";
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
