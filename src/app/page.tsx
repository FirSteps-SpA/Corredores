import Image from "next/image";

// Página provisional hasta el sitio público (spec 5).
const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 bg-crema px-6 py-16 text-center">
      <Image
        src="/brand/gycmar-logo.svg"
        alt="GyCmar Propiedades Iquique"
        width={480}
        height={270}
        priority
        unoptimized
        className="h-auto w-72 sm:w-96"
      />
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-serif text-4xl text-marino sm:text-5xl">
          Sitio en <em>construcción</em>
        </h1>
        <p className="text-xs tracking-[0.3em] text-oro uppercase">
          Compra • Vende • Arrienda
        </p>
        <p className="max-w-md text-tinta/80">
          Muy pronto podrás ver aquí nuestras propiedades en Iquique.
        </p>
      </div>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          className="rounded-full bg-marino px-6 py-3 text-sm text-white transition-colors hover:bg-tinta"
        >
          Escríbenos por WhatsApp
        </a>
      )}
    </main>
  );
}
