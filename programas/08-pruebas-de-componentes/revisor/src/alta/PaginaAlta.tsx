import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { FormularioAlta } from "./FormularioAlta";

export function PaginaAlta() {
  useTituloDocumento("Dar de alta · Revisor");

  return (
    <Tarjeta titulo="Dar de alta un servicio">
      <FormularioAlta />
    </Tarjeta>
  );
}
