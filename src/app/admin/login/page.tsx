import Image from "next/image";
import { Suspense } from "react";
import { FormularioLogin } from "./formulario";

export default function Login({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Image
          src="/brand/gycmar-logo.svg"
          alt="GyCmar Propiedades Iquique"
          width={480}
          height={270}
          priority
          unoptimized
          className="mx-auto h-auto w-48"
        />
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h1 className="mb-6 font-serif text-3xl text-marino">Panel</h1>
          <Suspense>
            <ConDestino searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function ConDestino({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { next } = await searchParams;
  return <FormularioLogin next={typeof next === "string" ? next : undefined} />;
}
