// Sentry en el runtime edge (proxy y rutas edge).
import * as Sentry from "@sentry/nextjs";
import { opcionesSentry } from "./sentry.opciones";

Sentry.init(opcionesSentry);
