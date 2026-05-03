import { useLifecycle } from "@/hooks/useLifecycle";

export function LifecycleGuard({ children }: { children: React.ReactNode }) {
  useLifecycle();
  return <>{children}</>;
}
