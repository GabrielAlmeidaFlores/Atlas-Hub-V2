import { useEffect, type ReactNode } from "react";
import { AppRouter } from "@/router";
import { useAuthStore } from "@/stores/auth";
import { ToastProvider } from "@/components/ui/toast-provider";

export function App(): ReactNode {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <>
      <AppRouter />
      <ToastProvider />
    </>
  );
}
