// Sentry en el navegador. Sin Replay: el sitio no lo necesita y ahorra cuota.
import * as Sentry from "@sentry/nextjs";
import { opcionesSentry } from "../sentry.opciones";

Sentry.init(opcionesSentry);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
