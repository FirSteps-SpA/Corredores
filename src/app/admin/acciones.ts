"use server";

import { redirect } from "next/navigation";
import { destinoSeguro, exigirAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// `email` vuelve al formulario: React 19 vacía los campos tras cada acción y así el correo
// no hay que escribirlo de nuevo después de un error.
export type Estado = { error?: string; ok?: string; email?: string };

export async function iniciarSesion(_previo: Estado, form: FormData): Promise<Estado> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Ingresa tu correo y tu contraseña.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Mismo mensaje exista o no el correo.
    return {
      error:
        error.code === "over_request_rate_limit"
          ? "Demasiados intentos. Espera unos minutos."
          : "Correo o contraseña incorrectos.",
      email,
    };
  }
  redirect(destinoSeguro(form.get("next")));
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function cambiarContrasena(_previo: Estado, form: FormData): Promise<Estado> {
  const sesion = await exigirAdmin();

  const actual = String(form.get("actual") ?? "");
  const nueva = String(form.get("nueva") ?? "");
  const confirmacion = String(form.get("confirmacion") ?? "");
  if (!actual || !nueva) return { error: "Completa todos los campos." };
  if (nueva !== confirmacion) return { error: "Las contraseñas nuevas no coinciden." };

  const supabase = await createClient();
  const verificacion = await supabase.auth.signInWithPassword({ email: sesion.email, password: actual });
  if (verificacion.error) return { error: "La contraseña actual no es correcta." };

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    return {
      error:
        error.code === "weak_password"
          ? "La contraseña nueva debe tener al menos 10 caracteres, con letras y dígitos."
          : error.code === "same_password"
            ? "La contraseña nueva debe ser distinta de la actual."
            : "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
    };
  }
  return { ok: "Listo: tu contraseña fue cambiada." };
}
