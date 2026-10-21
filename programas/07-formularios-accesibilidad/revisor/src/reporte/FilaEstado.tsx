import { Link } from "react-router";
import type { EstadoPublico } from "../compartido/contrato";
import { usePreferencias } from "../preferencias/usarPreferencias";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  const { preferencias } = usePreferencias();

  if (estado.tipo === "disponible") {
    return preferencias.mostrarDuracion ? (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    ) : (
      <>disponible (HTTP {estado.codigoHttp})</>
    );
  }

  return <>falla ({estado.detalle})</>;
}

export function FilaEstado({
  estado,
  tieneNota,
}: {
  readonly estado: EstadoPublico;
  readonly tieneNota: boolean;
}) {
  return (
    <li className={estado.tipo}>
      <Link to={`/servicios/${encodeURIComponent(estado.nombre)}`}>{estado.nombre}</Link>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
