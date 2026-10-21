import { Link, useLocation } from "react-router";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";

export function PaginaNoEncontrada() {
  const { pathname } = useLocation();
  useTituloDocumento("Página no encontrada · Revisor");

  return (
    <Tarjeta titulo="Página no encontrada">
      <p>No existe ninguna página en {pathname}.</p>
      <p>
        <Link to="/">Ir al reporte</Link>
      </p>
    </Tarjeta>
  );
}
