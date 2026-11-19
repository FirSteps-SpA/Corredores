import Image from "next/image";
import Link from "next/link";
import { cerrarSesion } from "../acciones";

// Solo el marco del panel. El control de acceso lo hace cada página con exigirAdmin()
// (src/lib/auth.ts), dentro de su propio <Suspense>.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="bg-marino">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin">
            <Image
              src="/brand/gycmar-logo-horizontal-oscuro.svg"
              alt="GyCmar Propiedades Iquique"
              width={320}
              height={80}
              unoptimized
              className="h-auto w-40"
            />
          </Link>
          <form action={cerrarSesion}>
            <button className="text-sm text-oro-claro hover:text-white">Cerrar sesión</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </>
  );
}
