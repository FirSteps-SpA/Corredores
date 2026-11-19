"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// Errores de renderizado en cualquier parte de la app: se reportan a Sentry.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-CL">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
