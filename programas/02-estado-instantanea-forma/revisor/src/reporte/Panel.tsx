import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
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
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <ContenidoReporte
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
