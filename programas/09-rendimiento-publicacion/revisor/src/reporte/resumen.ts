import type { EstadoPublico } from "../compartido/contrato";

export interface Filtros {
  readonly soloFallas: boolean;
  readonly texto: string;
}

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  filtros: Filtros,
): readonly EstadoPublico[] {
  const buscado = filtros.texto.trim().toLocaleLowerCase("es-MX");

  return estados.filter(
    (estado) =>
      (!filtros.soloFallas || estado.tipo === "falla") &&
      (buscado === "" || estado.nombre.toLocaleLowerCase("es-MX").includes(buscado)),
  );
}
