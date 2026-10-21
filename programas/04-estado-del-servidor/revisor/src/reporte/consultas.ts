import { queryOptions } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { cargarReporte } from "./cargar";

export function consultaReporte(cadaMs: number) {
  return queryOptions({
    queryKey: claves.reporte,
    queryFn: ({ signal }) => cargarReporte(signal),
    refetchInterval: cadaMs,
  });
}
