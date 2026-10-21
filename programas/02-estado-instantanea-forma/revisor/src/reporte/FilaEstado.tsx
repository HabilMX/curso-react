import type { EstadoPublico } from "../compartido/contrato";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  if (estado.tipo === "disponible") {
    return (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    );
  }

  return <>falla ({estado.detalle})</>;
}

export function FilaEstado({
  estado,
  seleccionado,
  tieneNota,
  alSeleccionar,
}: {
  readonly estado: EstadoPublico;
  readonly seleccionado: boolean;
  readonly tieneNota: boolean;
  readonly alSeleccionar: (nombre: string) => void;
}) {
  return (
    <li className={estado.tipo}>
      <button
        type="button"
        className="seleccionar"
        aria-pressed={seleccionado}
        onClick={() => alSeleccionar(estado.nombre)}
      >
        {estado.nombre}
      </button>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
