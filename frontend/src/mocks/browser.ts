import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

export const workerOptions = {
  serviceWorker: { url: "/mock-service-worker.js" },
  onUnhandledRequest: "bypass" as const,
};
