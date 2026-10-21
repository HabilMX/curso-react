import { useContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function useAvisos(): EstadoAvisos {
  const estado = useContext(ContextoAvisos);

  if (estado === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return estado;
}

export function useDespachoAvisos(): Dispatch<AccionAvisos> {
  const despachar = useContext(ContextoDespachoAvisos);

  if (despachar === null) {
    throw new Error("useDespachoAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return despachar;
}
