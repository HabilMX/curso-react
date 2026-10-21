export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      return {
        avisos: [nuevo, ...estado.avisos].slice(0, MAXIMO_AVISOS),
        siguienteId: estado.siguienteId + 1,
      };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
