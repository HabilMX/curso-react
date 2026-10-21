import { useReducer, type ReactNode } from "react";
import { estadoInicialAvisos, reducirAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function ProveedorAvisos({ children }: { readonly children: ReactNode }) {
  const [estado, despachar] = useReducer(reducirAvisos, estadoInicialAvisos);

  return (
    <ContextoAvisos value={estado}>
      <ContextoDespachoAvisos value={despachar}>{children}</ContextoDespachoAvisos>
    </ContextoAvisos>
  );
}
