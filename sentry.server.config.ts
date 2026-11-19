// Sentry en el servidor (Node). Ver https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { opcionesSentry } from "./sentry.opciones";

Sentry.init({
  ...opcionesSentry,
  // console.warn/error del servidor también llegan como logs.
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] })],
});
