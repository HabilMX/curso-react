import type { ErroresAlta, TextosAlta } from "./esquemaAlta";

export type EstadoFormulario =
  | { readonly tipo: "inicial" }
  | {
      readonly tipo: "con-errores";
      readonly detalle: string;
      readonly errores: ErroresAlta;
      readonly textos: TextosAlta;
    }
  | { readonly tipo: "agregado"; readonly nombre: string };

export const estadoInicialFormulario: EstadoFormulario = { tipo: "inicial" };

export function textosDe(datos: FormData): TextosAlta {
  const texto = (clave: string): string => {
    const valor = datos.get(clave);
    return typeof valor === "string" ? valor : "";
  };

  return { nombre: texto("nombre"), url: texto("url"), timeoutMs: texto("timeoutMs") };
}
