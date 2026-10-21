import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import "./panel.css";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <ContenidoReporte carga={carga} />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
