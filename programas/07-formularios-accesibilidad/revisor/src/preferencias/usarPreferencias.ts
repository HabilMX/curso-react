import { useContext } from "react";
import { ContextoPreferencias } from "./contexto";
import type { ValorPreferencias } from "./preferencias";

export function usePreferencias(): ValorPreferencias {
  const valor = useContext(ContextoPreferencias);

  if (valor === null) {
    throw new Error("usePreferencias necesita un <ProveedorPreferencias> más arriba en el árbol");
  }

  return valor;
}
