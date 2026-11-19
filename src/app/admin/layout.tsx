import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel · GyCmar Propiedades Iquique",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex flex-1 flex-col bg-crema">{children}</div>;
}
