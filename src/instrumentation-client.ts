// Sentry en el navegador.
import * as Sentry from "@sentry/nextjs";
import { opcionesSentry } from "../sentry.opciones";

Sentry.init({
  ...opcionesSentry,
  // Replay solo de sesiones con error: no se graba el uso normal y se ahorra cuota.
  // Por defecto enmascara textos e inputs.
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
