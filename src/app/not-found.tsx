import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-crema px-5 py-24 text-center">
      <h1 className="font-serif text-4xl text-marino">Página no encontrada</h1>
      <Link href="/" className="rounded-full bg-marino px-6 py-2.5 text-sm text-white hover:bg-tinta">
        Ir al inicio
      </Link>
    </main>
  );
}
