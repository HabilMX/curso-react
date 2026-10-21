import { esReportePublico, type ReportePublico } from "../compartido/contrato";

export type Cargar = (senal: AbortSignal) => Promise<ReportePublico>;

export async function cargarReporte(senal: AbortSignal): Promise<ReportePublico> {
  const respuesta = await fetch("/api/estados", { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esReportePublico(cuerpo)) {
    throw new Error("la API no entregó un reporte válido");
  }

  return cuerpo;
}
