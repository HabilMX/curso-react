export interface Preferencias {
  readonly mostrarDuracion: boolean;
  readonly compacto: boolean;
}

export const preferenciasIniciales: Preferencias = { mostrarDuracion: true, compacto: false };

export interface ValorPreferencias {
  readonly preferencias: Preferencias;
  readonly cambiarPreferencias: (cambio: Partial<Preferencias>) => void;
}
