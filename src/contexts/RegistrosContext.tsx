import { createContext, useContext, ReactNode } from "react";
import { useRegistros } from "@/hooks/useRegistros";
import type { Registro } from "@/data/mockData";

interface RegistrosContextType {
  registros: Registro[];
  adicionar: (reg: Omit<Registro, "id" | "criado_em">) => Registro;
  editar: (id: string, updates: Partial<Registro>) => void;
  remover: (id: string) => void;
}

const RegistrosContext = createContext<RegistrosContextType | null>(null);

export function RegistrosProvider({ children }: { children: ReactNode }) {
  const value = useRegistros();
  return <RegistrosContext.Provider value={value}>{children}</RegistrosContext.Provider>;
}

export function useRegistrosContext() {
  const ctx = useContext(RegistrosContext);
  if (!ctx) throw new Error("useRegistrosContext must be used within RegistrosProvider");
  return ctx;
}
