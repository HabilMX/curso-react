import { esEstadoPublico, esRegistro, type EstadoPublico, type NuevoServicio } from "../compartido/contrato";
import type { ErroresAlta } from "./esquemaAlta";

export type RespuestaAlta =
  | { readonly ok: true; readonly estado: EstadoPublico }
  | { readonly ok: false; readonly detalle: string; readonly errores: ErroresAlta };

function erroresDe(valor: unknown): ErroresAlta {
  if (!esRegistro(valor)) {
    return {};
  }

  const errores: ErroresAlta = {};

  for (const clave of ["nombre", "url", "timeoutMs"] as const) {
    const texto = valor[clave];

    if (typeof texto === "string") {
      errores[clave] = texto;
    }
  }

  return errores;
}

export async function darDeAlta(nuevo: NuevoServicio): Promise<RespuestaAlta> {
  const respuesta = await fetch("/api/servicios", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nuevo),
  });
  const cuerpo: unknown = await respuesta.json();

  if (respuesta.status === 201 && esEstadoPublico(cuerpo)) {
    return { ok: true, estado: cuerpo };
  }

  if ((respuesta.status === 400 || respuesta.status === 409) && esRegistro(cuerpo)) {
    return {
      ok: false,
      detalle: typeof cuerpo.detalle === "string" ? cuerpo.detalle : "la API rechazó el alta",
      errores: erroresDe(cuerpo.campos),
    };
  }

  throw new Error(`la API respondió ${respuesta.status}`);
}
