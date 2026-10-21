// fig00_02.tsx
import { useEffect, useState } from "react";

export function Resumen({ cadaMs, visible }: { readonly cadaMs: number; readonly visible: boolean }) {
  if (!visible) {
    return null;
  }

  const [vueltas, establecerVueltas] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => establecerVueltas((n) => n + 1), cadaMs);
    return () => clearInterval(temporizador);
  }, []);

  return <p>{vueltas} actualizaciones</p>;
}
