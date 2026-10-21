import type { EstadoPublico } from "../compartido/contrato";
import type { Notas } from "./notas";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({
  estados,
  notas,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly notas: Notas;
}) {
  if (estados.length === 0) {
    return <p>Ningún servicio coincide con los filtros.</p>;
  }

  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          tieneNota={notas[estado.nombre] !== undefined}
        />
      ))}
    </ul>
  );
}
