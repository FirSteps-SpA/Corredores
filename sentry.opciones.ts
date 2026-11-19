// Opciones comunes de Sentry (servidor, edge y navegador).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
// "production" en Netlify; en local, NEXT_PUBLIC_SENTRY_ENVIRONMENT=local en .env.local.
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production";

export const opcionesSentry = {
  dsn,
  environment,
  // Solo builds de producción (`next build`) con DSN: ni CI ni `next dev` envían eventos.
  enabled: process.env.NODE_ENV === "production" && !!dsn,
  // Todas las trazas en local para verificar; 10 % en producción (ajustar según el uso).
  // Los logs (Sentry.logger y consoleLoggingIntegration) vienen activos por defecto en el SDK v11.
  tracesSampleRate: environment === "production" ? 0.1 : 1.0,
  // Sin datos que identifiquen a las personas, como en VetApp.
  dataCollection: {
    userInfo: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    httpBodies: [],
    httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    cookies: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
  },
};
