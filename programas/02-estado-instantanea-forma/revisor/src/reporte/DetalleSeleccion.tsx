import type { EstadoPublico } from "../compartido/contrato";
import { EditorNota } from "./EditorNota";
import type { Notas } from "./notas";

export function DetalleSeleccion({
  estado,
  notas,
  alGuardarNota,
  alCerrar,
}: {
  readonly estado: EstadoPublico;
  readonly notas: Notas;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  return (
    <aside className="detalle" aria-label={`Detalle de ${estado.nombre}`}>
      <h3>{estado.nombre}</h3>
      <p>
        {estado.tipo === "disponible"
          ? `Disponible: HTTP ${estado.codigoHttp} en ${estado.duracionMs} ms`
          : `En falla: ${estado.detalle}`}
      </p>
      <EditorNota
        key={estado.nombre}
        nombre={estado.nombre}
        notaGuardada={notas[estado.nombre] ?? ""}
        alGuardar={alGuardarNota}
      />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
