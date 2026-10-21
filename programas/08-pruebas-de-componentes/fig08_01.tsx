// fig08_01.tsx
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useEffect, useState } from "react";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Una copia reducida de lo que dibuja `/`: la bandeja de avisos (un `status` vacío)
// y el contenido del reporte, que dice «Cargando…» y 100 ms después muestra la lista.
function Reporte() {
  const [estados, establecerEstados] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerEstados(["catálogo", "pagos"]), 100);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <>
      <section aria-label="Avisos">
        <div role="status" aria-atomic="false"></div>
      </section>
      {estados === null ? (
        <p role="status">Cargando…</p>
      ) : (
        <ul>
          {estados.map((nombre) => (
            <li key={nombre}>{nombre}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// Solo la primera línea del mensaje: el resto es el DOM completo, que aquí estorba.
function primeraLinea(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

const pantalla = render(<Reporte />);

console.log("1. antes de que lleguen los datos");
try {
  pantalla.getByRole("list");
} catch (error) {
  console.log(`   getByRole("list")   lanza: ${primeraLinea(error)}`);
}
console.log(`   queryByRole("list") devuelve: ${String(pantalla.queryByRole("list"))}`);
try {
  pantalla.getByRole("status");
} catch (error) {
  console.log(`   getByRole("status") lanza: ${primeraLinea(error)}`);
}
console.log(`   getAllByRole("status") encuentra: ${pantalla.getAllByRole("status").length}`);
const cargando = pantalla.getByText("Cargando…");
console.log(`   getByText("Cargando…") tiene role="${cargando.getAttribute("role")}"`);

console.log("2. esperando con findBy");
const lista = await pantalla.findByRole("list");
console.log(`   findByRole("list") la encontró, con ${lista.children.length} elementos`);
console.log(`   queryByText("Cargando…") ahora devuelve: ${String(pantalla.queryByText("Cargando…"))}`);

console.log("3. lo que nunca aparece");
try {
  await pantalla.findByRole("table", {}, { timeout: 300 });
} catch (error) {
  console.log(`   findByRole("table") rechaza: ${primeraLinea(error)}`);
}

pantalla.unmount();
dom.window.close();
