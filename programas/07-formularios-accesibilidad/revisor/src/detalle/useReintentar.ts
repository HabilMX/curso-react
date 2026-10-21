import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async (estado) => {
      despachar({
        tipo: "agregado",
        nivel: estado.tipo === "disponible" ? "exito" : "error",
        texto:
          estado.tipo === "disponible"
            ? `${nombre} se volvió a revisar: disponible`
            : `${nombre} se volvió a revisar: sigue en falla`,
      });
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
    onError: (error) => {
      despachar({
        tipo: "agregado",
        nivel: "error",
        texto: `No se pudo volver a revisar ${nombre}: ${error.message}`,
      });
    },
  });
}
