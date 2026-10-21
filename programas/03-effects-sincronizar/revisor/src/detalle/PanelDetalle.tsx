import { EditorNota } from "../reporte/EditorNota";
import { useDetalle } from "./useDetalle";

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
  const carga = useDetalle(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {carga.tipo === "cargando" && <p role="status">Cargando detalle…</p>}
      {carga.tipo === "error" && <p role="alert">No se pudo cargar el detalle: {carga.detalle}</p>}
      {carga.tipo === "listo" && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {carga.detalle.estado.tipo === "disponible"
              ? `Disponible: HTTP ${carga.detalle.estado.codigoHttp} en ${carga.detalle.estado.duracionMs} ms`
              : `En falla: ${carga.detalle.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{carga.detalle.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{carga.detalle.ultimaRevision}</dd>
        </dl>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
