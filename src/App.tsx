import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RegistrosProvider } from "@/contexts/RegistrosContext";
import { useState, useEffect, useRef } from "react";
import Dashboard from "./pages/Dashboard";
import Registros from "./pages/Registros";
import Contas from "./pages/Contas";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import Relatorios from "./pages/Relatorios";
import Auth from "./pages/Auth";
import Indicacoes from "./pages/Indicacoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const welcomeTranslations: Record<string, string> = {
  pt: "SEJA BEM-VINDO",
  en: "WELCOME",
  es: "BIENVENIDO",
  fr: "BIENVENUE",
  de: "WILLKOMMEN",
  it: "BENVENUTO",
  ja: "ようこそ",
  zh: "欢迎",
};

function getWelcomeMessage() {
  const lang = navigator.language?.slice(0, 2) || "en";
  return welcomeTranslations[lang] || welcomeTranslations.en;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const prevSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const currentSessionId = session?.user?.id || null;
    const prevSessionId = prevSessionRef.current;

    if (session && !loading && currentSessionId !== prevSessionId) {
      prevSessionRef.current = currentSessionId;
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 2000);
    } else if (!session) {
      prevSessionRef.current = null;
    }
  }, [session, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-lg bg-primary animate-pulse" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  if (showWelcome) {
    return (
      <div className="animate-welcome-container min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground animate-welcome-text">
            {getWelcomeMessage()}
          </h1>
          <img
            src="/logo.png"
            alt="Logo do Sistema"
            className="h-32 sm:h-40 w-auto max-w-full object-contain animate-welcome-logo"
          />
        </div>
      </div>
    );
  }

  return (
    <RegistrosProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registros" element={<Registros />} />
          <Route path="/contas" element={<Contas />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/indicacoes" element={<Indicacoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </RegistrosProvider>
  );
}
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPageWrapper />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function AuthPageWrapper() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Auth />;
}

export default App;
