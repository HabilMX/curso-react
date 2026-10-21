import { esEstadoPublico, type EstadoPublico } from "../compartido/contrato";

export async function reintentarServicio(nombre: string): Promise<EstadoPublico> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, {
    method: "POST",
  });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esEstadoPublico(cuerpo)) {
    throw new Error("la API no entregó un estado válido");
  }

  return cuerpo;
}
