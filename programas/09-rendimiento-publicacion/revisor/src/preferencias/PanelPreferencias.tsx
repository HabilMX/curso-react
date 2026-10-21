import { usePreferencias } from "./usarPreferencias";

export function PanelPreferencias() {
  const { preferencias, cambiarPreferencias } = usePreferencias();

  return (
    <fieldset className="preferencias">
      <legend>Preferencias</legend>
      <label>
        <input
          type="checkbox"
          checked={preferencias.mostrarDuracion}
          onChange={(evento) => cambiarPreferencias({ mostrarDuracion: evento.target.checked })}
        />{" "}
        Mostrar duración
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferencias.compacto}
          onChange={(evento) => cambiarPreferencias({ compacto: evento.target.checked })}
        />{" "}
        Vista compacta
      </label>
    </fieldset>
  );
}
