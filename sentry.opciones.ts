// Opciones comunes de Sentry (servidor, edge y navegador).
export const opcionesSentry = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Solo builds de producción con DSN: sin DSN (CI, local) Sentry no se inicializa.
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
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
