import { createContext, useContext, ReactNode } from "react";
import { useBills, Bill } from "@/hooks/useBills";

interface BillsContextType {
  bills: Bill[];
  loading: boolean;
  add: (bill: Omit<Bill, "id" | "created_at">) => Promise<void>;
  update: (id: string, updates: Partial<Bill>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const BillsContext = createContext<BillsContextType | null>(null);

export function BillsProvider({ children }: { children: ReactNode }) {
  const value = useBills();
  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
}

export function useBillsContext() {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error("useBillsContext must be used within BillsProvider");
  return ctx;
}
