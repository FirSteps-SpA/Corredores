import { describe, expect, it } from "vitest";
import { esRutaDe, rutaNueva, urlPublica } from "./rutas";

const id = "6f1c2c1e-1b7a-4c0e-9a77-3d2f5f0b9c11";

describe("rutas de fotos", () => {
  it("una ruta nueva va en la carpeta de la propiedad y es JPEG", () => {
    const ruta = rutaNueva(id);
    expect(ruta).toMatch(new RegExp(`^${id}/[0-9a-f-]{36}\\.jpg$`));
    expect(esRutaDe(ruta, id)).toBe(true);
  });
  it("rechaza rutas de otra propiedad, subcarpetas o con ..", () => {
    expect(esRutaDe(`otra/${crypto.randomUUID()}.jpg`, id)).toBe(false);
    expect(esRutaDe(`${id}/../otra/x.jpg`, id)).toBe(false);
    expect(esRutaDe(`${id}/sub/x.jpg`, id)).toBe(false);
    expect(esRutaDe(`${id}/x.pdf`, id)).toBe(false);
  });
  it("arma la URL pública", () => {
    expect(urlPublica(`${id}/a.jpg`, "https://x.supabase.co")).toBe(
      `https://x.supabase.co/storage/v1/object/public/propiedades/${id}/a.jpg`,
    );
  });
});
