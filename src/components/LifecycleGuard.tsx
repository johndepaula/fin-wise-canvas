import type { ReactNode } from "react";
import { useLifecycle } from "@/hooks/useLifecycle";

export function LifecycleGuard({ children }: { children: ReactNode }) {
  useLifecycle();
  return <>{children}</>;
}

