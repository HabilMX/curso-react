import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async () => {
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
  });
}
