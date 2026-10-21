import { useOutletContext } from "react-router";
import type { Notas } from "../reporte/notas";

export interface ContextoNotas {
  readonly notas: Notas;
  readonly guardarNota: (nombre: string, texto: string) => void;
}

export function useNotas(): ContextoNotas {
  return useOutletContext<ContextoNotas>();
}
