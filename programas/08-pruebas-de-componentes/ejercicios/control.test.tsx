// ejercicios/control.test.tsx — va en revisor/src/pruebas/control.test.tsx (fuera del punto de control)
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { expect, test } from "vitest";

function Tardio() {
  const [texto, establecerTexto] = useState("esperando");
  useEffect(() => {
    const temporizador = setTimeout(() => establecerTexto("listo"), 10);
    return () => clearTimeout(temporizador);
  }, []);
  return <p>{texto}</p>;
}

test("una actualización fuera de act", async () => {
  render(<Tardio />);
  // Se espera con un temporizador simple, no con findBy: nadie envuelve el cambio en act.
  await new Promise((listo) => setTimeout(listo, 50));
  expect(screen.getByText("listo")).toBeDefined();
});
