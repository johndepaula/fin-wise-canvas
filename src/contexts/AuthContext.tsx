import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  loading: boolean; // Para manter compatibilidade onde `loading` já era usado
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log("[Auth Flow] 🟢 1. Inicializando AuthProvider (Mount)...");

    async function checkSession() {
      try {
        console.log("[Auth Flow] 🔍 2. Buscando sessão do banco/storage...");
        const { data: { session: localSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth Flow] 🔴 Erro ao buscar sessão:", error);
          throw error;
        }

        if (mounted) {
          console.log(`[Auth Flow] 📋 3. Sessão encontrada? ${!!localSession}`);
          setSession(localSession);
        }
      } catch (error) {
        if (mounted) setSession(null);
      } finally {
        if (mounted) {
          console.log("[Auth Flow] 🔓 4. Finalizado carregamento inicial. isLoadingAuth = false");
          setIsLoadingAuth(false);
        }
      }
    }

    checkSession();

    console.log("[Auth Flow] 🎧 Registrando ouvinte global onAuthStateChange...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`[Auth Flow] ⚡ Evento recebido: ${event}. Sessão presente: ${!!newSession}`);
        if (mounted) {
          setSession(newSession);
          // Permite desbloquear o loading pois a sessão já é conhecida no callback
          setIsLoadingAuth(false);
        }
      }
    );

    return () => {
      console.log("[Auth Flow] 🧹 Limpando listener e useEffect...");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("[Auth Flow] 🚪 Iniciando processo de signOut...");
      setIsLoadingAuth(true);
      await supabase.auth.signOut();
    } finally {
      console.log("[Auth Flow] 🚪 signOut concluído com sucesso.");
      setSession(null);
      setIsLoadingAuth(false);
    }
  };

  const isAuthenticated = !!session?.user;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user: session?.user ?? null, 
      isAuthenticated,
      isLoadingAuth,
      loading: isLoadingAuth, // Mantido apenas para não quebrar App.tsx caso use
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
