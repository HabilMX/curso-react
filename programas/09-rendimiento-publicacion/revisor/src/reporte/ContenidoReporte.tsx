import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportePublico } from "../compartido/contrato";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados, type Filtros } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";

export function ContenidoReporte({
  consulta,
  filtros,
  notas,
}: {
  readonly consulta: UseQueryResult<ReportePublico>;
  readonly filtros: Filtros;
  readonly notas: Notas;
}) {
  if (consulta.isPending) {
    return <p role="status">Cargando…</p>;
  }

  if (consulta.isError && consulta.data === undefined) {
    return (
      <div role="alert">
        <p>No se pudo cargar el reporte: {consulta.error.message}</p>
        <button type="button" onClick={() => void consulta.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { estados } = consulta.data;

  if (estados.length === 0) {
    return <p>No hay servicios configurados todavía.</p>;
  }

  return (
    <>
      {consulta.isError && (
        <p role="alert" className="viejo">
          Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      <ResumenFallas estados={estados} />
      <ListaEstados estados={filtrarEstados(estados, filtros)} notas={notas} />
    </>
  );
}
