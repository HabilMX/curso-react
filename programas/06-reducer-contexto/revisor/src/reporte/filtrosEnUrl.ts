import { useSearchParams } from "react-router";
import type { Filtros } from "./resumen";

export function useFiltrosEnUrl(): {
  readonly filtros: Filtros;
  readonly cambiarFiltros: (cambio: Partial<Filtros>) => void;
} {
  const [parametros, establecerParametros] = useSearchParams();
  const filtros: Filtros = {
    soloFallas: parametros.get("fallas") === "1",
    texto: parametros.get("q") ?? "",
  };

  function cambiarFiltros(cambio: Partial<Filtros>): void {
    const siguientes = { ...filtros, ...cambio };

    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales);

        if (siguientes.soloFallas) {
          nuevos.set("fallas", "1");
        } else {
          nuevos.delete("fallas");
        }

        if (siguientes.texto === "") {
          nuevos.delete("q");
        } else {
          nuevos.set("q", siguientes.texto);
        }

        return nuevos;
      },
      { replace: true },
    );
  }

  return { filtros, cambiarFiltros };
}
