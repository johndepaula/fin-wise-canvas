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
import Auth from "./pages/Auth";
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
  const hasShownWelcome = useRef(false);

  useEffect(() => {
    if (session && !loading && !hasShownWelcome.current) {
      const alreadyShown = sessionStorage.getItem("welcome_shown");
      if (!alreadyShown) {
        hasShownWelcome.current = true;
        sessionStorage.setItem("welcome_shown", "true");
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 2500);
      } else {
        hasShownWelcome.current = true;
      }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <p className="text-2xl font-bold tracking-widest text-primary animate-fade-in" style={{ animationDuration: "0.6s" }}>
          {getWelcomeMessage()}
        </p>
        <img
          src="/lovable-uploads/853f9d2e-1310-4b8f-bfcd-0aa85d8a98ef.png"
          alt="Logo"
          className="h-24 w-auto animate-scale-in"
          style={{ animationDuration: "0.8s", animationDelay: "0.3s", animationFillMode: "both" }}
        />
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
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/perfil" element={<Perfil />} />
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
