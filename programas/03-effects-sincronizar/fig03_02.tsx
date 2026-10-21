// fig03_02.tsx
import { useEffect, useState } from "react";

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const [fallas, establecerFallas] = useState(0);

  useEffect(() => {
    establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
  }, [estados]);

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  const [pedido, establecerPedido] = useState(false);

  useEffect(() => {
    if (pedido) {
      void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
      establecerPedido(false);
    }
  }, [pedido, nombre]);

  return (
    <button type="button" onClick={() => establecerPedido(true)}>
      Volver a revisar
    </button>
  );
}
