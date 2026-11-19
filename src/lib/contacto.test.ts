import { describe, expect, it } from "vitest";
import { correoContacto, enlaceWhatsApp, instagram, mensajePropiedad } from "./contacto";

describe("enlaceWhatsApp", () => {
  it("sin número no hay enlace", () => {
    expect(enlaceWhatsApp("hola", "")).toBeNull();
    expect(enlaceWhatsApp(undefined, undefined)).toBeNull();
  });
  it("deja solo dígitos y codifica el mensaje", () => {
    expect(enlaceWhatsApp(undefined, "+56 9 1234 5678")).toBe("https://wa.me/56912345678");
    expect(enlaceWhatsApp("Hola, ¿está disponible?", "56912345678")).toBe(
      "https://wa.me/56912345678?text=Hola%2C%20%C2%BFest%C3%A1%20disponible%3F",
    );
  });
});

describe("mensajePropiedad", () => {
  it("con código", () => {
    expect(mensajePropiedad({ codigo: "GC-12", titulo: "Casa en Cavancha", url: "https://x.cl/propiedades/casa" })).toBe(
      "Hola, me interesa la propiedad GC-12 – Casa en Cavancha: https://x.cl/propiedades/casa",
    );
  });
  it("sin código", () => {
    expect(mensajePropiedad({ codigo: null, titulo: "Casa", url: "u" })).toBe("Hola, me interesa la propiedad Casa: u");
  });
});

describe("correo e Instagram", () => {
  it("correo válido o nada", () => {
    expect(correoContacto(" contacto@gycmar.cl ")).toBe("contacto@gycmar.cl");
    expect(correoContacto("no-es-correo")).toBeNull();
    expect(correoContacto("")).toBeNull();
  });
  it("Instagram desde usuario, @usuario o URL", () => {
    for (const v of ["gycmar", "@gycmar", "https://www.instagram.com/gycmar/"]) {
      expect(instagram(v)).toEqual({ usuario: "gycmar", url: "https://www.instagram.com/gycmar/" });
    }
    expect(instagram("")).toBeNull();
  });
});
