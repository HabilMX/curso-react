import type { NuevoServicio } from "../compartido/contrato";
import {
  enteroPositivoDeTexto,
  textoNoVacio,
  urlHttp,
  type ErroresDe,
  type ValoresDe,
} from "../compartido/esquema";

export const camposAlta = {
  nombre: textoNoVacio,
  url: urlHttp,
  timeoutMs: enteroPositivoDeTexto,
};

export type ValoresAlta = ValoresDe<typeof camposAlta>;
export type ErroresAlta = ErroresDe<typeof camposAlta>;
export type TextosAlta = Readonly<Record<keyof typeof camposAlta, string>>;

// Si el contrato y el esquema dejan de coincidir, esta línea deja de compilar.
export const comprobarContrato: (valores: ValoresAlta) => NuevoServicio = (valores) => valores;
