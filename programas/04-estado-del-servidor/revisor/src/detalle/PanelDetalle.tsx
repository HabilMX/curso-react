import { useQuery } from "@tanstack/react-query";
import { EditorNota } from "../reporte/EditorNota";
import { consultaDetalle } from "./consultas";
import { useReintentar } from "./useReintentar";

export function PanelDetalle({
  nombre,
  notaGuardada,
  alGuardarNota,
  alCerrar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  const consulta = useQuery(consultaDetalle(nombre));
  const reintento = useReintentar(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {consulta.isPending && <p role="status">Cargando detalle…</p>}
      {consulta.isError && consulta.data === undefined && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isError && consulta.data !== undefined && (
        <p role="alert" className="viejo">
          Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      {consulta.data !== undefined && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {consulta.data.estado.tipo === "disponible"
              ? `Disponible: HTTP ${consulta.data.estado.codigoHttp} en ${consulta.data.estado.duracionMs} ms`
              : `En falla: ${consulta.data.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{consulta.data.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{consulta.data.ultimaRevision}</dd>
        </dl>
      )}
      <button type="button" disabled={reintento.isPending} onClick={() => reintento.mutate()}>
        {reintento.isPending ? "Revisando…" : "Volver a revisar"}
      </button>
      {reintento.isError && (
        <p role="alert">No se pudo volver a revisar: {reintento.error.message}</p>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
