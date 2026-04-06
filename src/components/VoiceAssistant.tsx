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

const KNOWN_CATEGORIES = [
  "alimentação", "transporte", "saúde", "moradia", "educação",
  "vestuário", "lazer", "salário", "renda extra", "transferência",
  "presente", "outros",
];

const NAV_ROUTES: Array<{ keywords: string[]; path: string; label: string }> = [
  { keywords: ["dashboard", "início", "inicio", "home", "painel"], path: "/", label: "Painel" },
  { keywords: ["registro", "registros", "meus registros", "lançamento"], path: "/registros", label: "Registros" },
  { keywords: ["conta", "contas", "boleto", "boletos"], path: "/contas", label: "Contas" },
  { keywords: ["relatório", "relatórios", "relatorio", "relatorios"], path: "/relatorios", label: "Relatórios" },
  { keywords: ["configuração", "configurações", "ajuste", "ajustes", "config"], path: "/configuracoes", label: "Configurações" },
  { keywords: ["perfil", "meu perfil"], path: "/perfil", label: "Perfil" },
  { keywords: ["feedback", "sugestão", "sugestões"], path: "/feedback", label: "Feedback" },
  { keywords: ["indicação", "indicações", "indicar", "convite"], path: "/indicacoes", label: "Indicações" },
];

function inferCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return null;
}

function inferDescription(text: string): string | null {
  const lower = text.toLowerCase();
  for (const keyword of Object.keys(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return keyword;
  }
  return null;
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

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
    // Fallback timeout in case onend doesn't fire
    setTimeout(resolve, 5000);
  });
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

function matchCategory(text: string): string | null {
  const lower = text.toLowerCase().trim();
  // Direct match to known categories
  for (const cat of KNOWN_CATEGORIES) {
    if (lower.includes(cat)) return cat;
  }
  // Try keyword map
  return inferCategory(lower);
}

type ConversationStep = "idle" | "ask_category" | "ask_description" | "ask_value";

interface ConversationState {
  step: ConversationStep;
  tipo: "entrada" | "saida";
  categoria?: string;
  descricao?: string;
  valor?: number;
}

export function VoiceAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<any>(null);
  const convoRef = useRef<ConversationState | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const listenOnce = useCallback((onResult: (t: string) => void, statusMsg?: string) => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      if (statusMsg) setStatus(statusMsg);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setStatus("");
      convoRef.current = null;
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.start();
  }, [SpeechRecognition]);

  const saveRecord = useCallback(async (tipo: string, valor: number, categoria: string, descricao: string) => {
    if (!user) return;
    const now = new Date();
    const data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const { error } = await supabase.from("financial_records").insert({
      user_id: user.id, tipo, valor, categoria, descricao,
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
    convoRef.current = null;
    setTimeout(() => setStatus(""), 4000);
  }, [user]);

  // Advance the conversation to the next missing field
  const advanceConversation = useCallback(async (state: ConversationState) => {
    convoRef.current = state;

    if (!state.categoria) {
      const msg = "Qual a categoria?";
      setStatus(`🎙️ ${msg}`);
      await speak(msg);
      setTimeout(() => {
        listenOnce((transcript) => {
          setStatus(`"${transcript}"`);
          const cat = matchCategory(transcript) || transcript.toLowerCase().trim();
          advanceConversation({ ...state, categoria: cat });
        }, "🎙️ Aguardando categoria...");
      }, 500);
      return;
    }

    if (!state.descricao) {
      const msg = "Qual a descrição?";
      setStatus(`🎙️ ${msg}`);
      await speak(msg);
      setTimeout(() => {
        listenOnce((transcript) => {
          setStatus(`"${transcript}"`);
          advanceConversation({ ...state, descricao: transcript.toLowerCase().trim() });
        }, "🎙️ Aguardando descrição...");
      }, 500);
      return;
    }

    if (!state.valor) {
      const msg = "Qual o valor?";
      setStatus(`🎙️ ${msg}`);
      await speak(msg);
      setTimeout(() => {
        listenOnce((transcript) => {
          setStatus(`"${transcript}"`);
          const valor = parseValue(transcript);
          if (!valor) {
            speak("Não entendi o valor. Pode repetir?");
            setStatus("❓ Não entendi o valor");
            convoRef.current = null;
            setTimeout(() => setStatus(""), 3000);
            return;
          }
          advanceConversation({ ...state, valor });
        }, "🎙️ Aguardando valor...");
      }, 500);
      return;
    }

    // All fields collected — save
    saveRecord(state.tipo, state.valor, state.categoria, state.descricao);
  }, [listenOnce, saveRecord]);

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

    // Record commands
    const expenseKeywords = ["gasto", "saída", "saida", "despesa", "paguei", "pagar", "comprei", "compra", "gastei", "adicionar saída"];
    const incomeKeywords = ["entrada", "receita", "salário", "renda", "recebi", "ganhei", "ganho", "adicionar entrada"];

    const isExpense = expenseKeywords.some((kw) => lower.includes(kw));
    const isIncome = incomeKeywords.some((kw) => lower.includes(kw));

    if (isExpense || isIncome) {
      const tipo: "entrada" | "saida" = isIncome ? "entrada" : "saida";

      // Try to extract as much as possible from the initial command
      const categoria = inferCategory(lower);
      const descricao = inferDescription(lower);
      const valor = parseValue(transcript);

      // If we got everything, save immediately (smart shortcut)
      if (categoria && descricao && valor) {
        saveRecord(tipo, valor, categoria, descricao);
        return;
      }

      // Start conversational flow for missing fields
      advanceConversation({
        step: "idle",
        tipo,
        categoria: categoria || undefined,
        descricao: descricao || undefined,
        valor: valor || undefined,
      });
      return;
    }

    // Fallback
    const msg = "Não entendi. Tente dizer: adicionar gasto de gasolina 50 reais, ou abrir painel.";
    speak(msg);
    setStatus(`❓ "${transcript}"`);
    toast({ title: "🎙️ Comando não reconhecido", description: `"${transcript}"`, variant: "destructive" });
    setTimeout(() => setStatus(""), 4000);
  }, [navigate, saveRecord, advanceConversation]);

  const toggleListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suporta", description: "Use Chrome ou Edge para comandos de voz.", variant: "destructive" });
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      setStatus("");
      convoRef.current = null;
      return;
    }

    listenOnce(handleTranscript, "🎙️ Ouvindo...");
  }, [listening, SpeechRecognition, listenOnce, handleTranscript]);

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
