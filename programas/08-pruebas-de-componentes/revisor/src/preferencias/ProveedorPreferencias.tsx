import { useState, type ReactNode } from "react";
import { ContextoPreferencias } from "./contexto";
import { preferenciasIniciales, type Preferencias } from "./preferencias";

export function ProveedorPreferencias({ children }: { readonly children: ReactNode }) {
  const [preferencias, establecerPreferencias] = useState<Preferencias>(preferenciasIniciales);

  function cambiarPreferencias(cambio: Partial<Preferencias>): void {
    establecerPreferencias((actuales) => ({ ...actuales, ...cambio }));
  }

  return (
    <ContextoPreferencias value={{ preferencias, cambiarPreferencias }}>
      {children}
    </ContextoPreferencias>
  );
}
