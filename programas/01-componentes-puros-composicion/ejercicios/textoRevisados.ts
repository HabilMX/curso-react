export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

for (const n of [0, 1, 4]) console.log(`${n} → ${textoRevisados(n)}`);
