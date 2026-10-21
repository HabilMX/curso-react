import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas, textoRevisados } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {textoRevisados(estados.length)}
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
