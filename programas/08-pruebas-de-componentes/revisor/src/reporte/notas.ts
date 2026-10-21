export type Notas = Readonly<Record<string, string>>;

export function conNota(notas: Notas, nombre: string, texto: string): Notas {
  const limpio = texto.trim();

  if (limpio === "") {
    return Object.fromEntries(Object.entries(notas).filter(([clave]) => clave !== nombre));
  }

  return { ...notas, [nombre]: limpio };
}
