import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/app";
import { configureAmplify } from "@/lib/cognito";
import { VITE_MODE } from "@/lib/env";
import "@/styles/globals.css";

configureAmplify();

async function enableMocking(): Promise<void> {
  if (VITE_MODE !== "development") return;
  const { worker, workerOptions } = await import("@/mocks/browser");
  await worker.start(workerOptions);
}

void enableMocking().then(() => {
  const root = document.getElementById("root");
  if (root === null) throw new Error("Root element not found");
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
