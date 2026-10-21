const CADA_MS_PREDETERMINADO = 10_000;

// Menos de un segundo entre preguntas no deja respirar a la API (cada respuesta tarda
// 300 ms), y más de una hora ya no es un sondeo. Además, setInterval guarda el intervalo
// en un entero de 32 bits: arriba de 2_147_483_647 ms se desborda, y la espera queda en
// cualquier valor, a veces cero.
const CADA_MS_MINIMO = 1_000;
const CADA_MS_MAXIMO = 3_600_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  const ms = Number(valor);
  return ms >= CADA_MS_MINIMO && ms <= CADA_MS_MAXIMO ? ms : CADA_MS_PREDETERMINADO;
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
