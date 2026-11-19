import { Encabezado } from "./_componentes/encabezado";
import { Pie } from "./_componentes/pie";

export default function SitioLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Encabezado />
      <main className="flex-1">{children}</main>
      <Pie />
    </>
  );
}
