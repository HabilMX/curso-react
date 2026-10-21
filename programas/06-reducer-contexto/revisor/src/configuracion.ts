const CADA_MS_PREDETERMINADO = 10_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  return Number(valor);
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
