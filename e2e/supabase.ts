import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, type Browser, type Page } from "@playwright/test";

// Acceso a Supabase LOCAL con la clave secreta para preparar y limpiar datos de prueba.
const out = execFileSync("supabase", ["status", "-o", "json"], { encoding: "utf8" });
const { API_URL, SECRET_KEY } = JSON.parse(out.slice(out.indexOf("{")));
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(API_URL)) throw new Error(`Supabase no es local: ${API_URL}`);
export const API: string = API_URL;

export async function admin(method: string, path: string, body?: unknown) {
  const res = await fetch(API + path, {
    method,
    headers: { apikey: SECRET_KEY, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

export const run = randomUUID().slice(0, 8);
export const PASSWORD = "Valida-12345";

export async function crearCuenta(alias: string, esAdmin: boolean) {
  const email = `${alias}-${run}@test.local`;
  const u = await admin("POST", "/auth/v1/admin/users", { email, password: PASSWORD, email_confirm: true });
  if (u.status !== 200) throw new Error(`crear ${alias}: ${u.status}`);
  if (esAdmin) await admin("POST", "/rest/v1/admins", { user_id: u.data.id });
  return { id: u.data.id as string, email };
}

export async function borrarCuenta(id: string) {
  await admin("DELETE", `/auth/v1/admin/users/${id}`);
}

export async function crearPropiedad(titulo: string) {
  const slug = `${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${run}`;
  const r = await admin("POST", "/rest/v1/propiedades", {
    titulo: `${titulo} ${run}`, slug, operacion: "venta", tipo: "casa", precio: 1000, moneda: "UF", comuna: "Iquique",
  });
  if (r.status !== 201) throw new Error(`crear propiedad: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data[0].id as string;
}

// Borra las propiedades de esta corrida con sus archivos en Storage.
export async function limpiarPropiedades() {
  const { data } = await admin("GET", `/rest/v1/propiedades?select=id&titulo=like.*${run}*`);
  for (const { id } of data ?? []) {
    const lista = await admin("POST", "/storage/v1/object/list/propiedades", { prefix: id, limit: 1000 });
    const prefixes = (lista.data ?? []).map((a: { name: string }) => `${id}/${a.name}`);
    if (prefixes.length) await admin("DELETE", "/storage/v1/object/propiedades", { prefixes });
    await admin("DELETE", `/rest/v1/propiedades?id=eq.${id}`);
  }
}

export async function fotosDe(propiedadId: string): Promise<{ id: string; path: string; orden: number }[]> {
  const r = await admin("GET", `/rest/v1/propiedad_fotos?select=id,path,orden&propiedad_id=eq.${propiedadId}&order=orden,id`);
  return r.data;
}

export async function iniciarSesion(browser: Browser, email: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin(\/sin-acceso)?$/);
  return page;
}
