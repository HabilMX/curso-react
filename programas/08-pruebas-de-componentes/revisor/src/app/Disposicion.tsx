import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BandejaAvisos } from "../avisos/BandejaAvisos";
import { PanelPreferencias } from "../preferencias/PanelPreferencias";
import { usePreferencias } from "../preferencias/usarPreferencias";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});
  const { preferencias } = usePreferencias();

  const contexto: ContextoNotas = {
    notas,
    guardarNota: (nombre, texto) => establecerNotas((actuales) => conNota(actuales, nombre, texto)),
  };

  return (
    <>
      <header>
        <h1>Revisor</h1>
        <nav aria-label="Principal">
          <NavLink to="/" end>
            Reporte
          </NavLink>
          <NavLink to="/servicios/nuevo">Dar de alta</NavLink>
        </nav>
        <PanelPreferencias />
      </header>
      <BandejaAvisos />
      <main className={preferencias.compacto ? "compacto" : undefined}>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
