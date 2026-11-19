// Destino de exigirAdmin() para cuentas con sesión que no son admin. No muestra datos.
export default function SinAcceso() {
  return (
    <div className="rounded-xl bg-white p-8 shadow-sm">
      <h1 className="font-serif text-3xl text-marino">Sin acceso</h1>
      <p className="mt-2 text-tinta/80">Tu cuenta no tiene acceso al panel.</p>
    </div>
  );
}
