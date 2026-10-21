import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado key={estado.nombre} estado={estado} />
      ))}
    </ul>
  );
}
