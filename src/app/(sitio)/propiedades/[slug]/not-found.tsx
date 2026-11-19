import Link from "next/link";

export default function PropiedadNoEncontrada() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
      <h1 className="font-serif text-4xl text-tinta">Propiedad no encontrada</h1>
      <p className="text-tinta/70">Puede que ya no esté publicada o que el enlace tenga un error.</p>
      <Link href="/propiedades" className="rounded-full bg-tinta px-6 py-2.5 text-sm text-white hover:bg-marino">
        Ver todas las propiedades
      </Link>
    </div>
  );
}
