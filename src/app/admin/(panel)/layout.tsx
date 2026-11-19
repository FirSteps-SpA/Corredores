import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { obtenerSesion } from "@/lib/auth";
import { cerrarSesion } from "../acciones";

// Solo el marco del panel. El control de acceso lo hace cada página con exigirAdmin()
// (src/lib/auth.ts), dentro de su propio <Suspense>.
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="bg-marino">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
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
          <div className="flex items-center gap-6 text-sm">
            <Suspense>
              <MenuAdmin />
            </Suspense>
            <form action={cerrarSesion}>
              <button className="text-oro-claro hover:text-white">Cerrar sesión</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
    </>
  );
}

// Enlaces y correo solo para el admin: una cuenta sin acceso no ve nada del panel.
async function MenuAdmin() {
  const sesion = await obtenerSesion();
  if (!sesion?.esAdmin) return null;
  return (
    <nav className="flex items-center gap-6 text-white/80">
      <Link href="/admin" className="hover:text-white">
        Propiedades
      </Link>
      <Link href="/admin/cuenta" className="hover:text-white" title={`Sesión iniciada como ${sesion.email}`}>
        <span className="hidden sm:inline">{sesion.email} · </span>Cambiar contraseña
      </Link>
    </nav>
  );
}
