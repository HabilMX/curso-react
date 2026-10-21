import { useQuery } from "@tanstack/react-query";
import { useNotas } from "../app/contextoNotas";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { cadaMs } from "../configuracion";
import { consultaReporte } from "./consultas";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { useFiltrosEnUrl } from "./filtrosEnUrl";
import { contarFallas } from "./resumen";

export function PaginaReporte() {
  const consulta = useQuery(consultaReporte(cadaMs));
  const { filtros, cambiarFiltros } = useFiltrosEnUrl();
  const { notas } = useNotas();

  const fallas = consulta.data === undefined ? 0 : contarFallas(consulta.data.estados);
  useTituloDocumento(fallas > 0 ? `(${fallas}) Revisor` : "Revisor");

  return (
    <Tarjeta titulo="Estado de los servicios">
      <FiltroFallas filtros={filtros} alCambiar={cambiarFiltros} />
      <ContenidoReporte consulta={consulta} filtros={filtros} notas={notas} />
      {consulta.dataUpdatedAt > 0 && (
        <p className="actualizado">
          Actualizado a las {new Date(consulta.dataUpdatedAt).toLocaleTimeString("es-MX")}
          {consulta.isFetching && " · actualizando…"}
        </p>
      )}
      <button type="button" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>
        Actualizar
      </button>
    </Tarjeta>
  );
}
