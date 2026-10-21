// medir.mjs — recorre el panel en un Chrome sin ventana y escribe lo que ve.
// No es una figura ni parte del revisor: es el guion con que se midieron las
// salidas «medidas con Chrome sin ventana» de la Lección 2.
//
// Uso, con el servidor de práctica (`npm run servidor`) y la versión construida
// (`npm run build` y `npm run preview`) encendidos, y un Chrome abierto así:
//   google-chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-curso
// En otra terminal:
//   node medir.mjs recorrido     (sección 2.6)
//   node medir.mjs filtro        (solución 3)
//   node medir.mjs sin-key       (solución 4; sobre una copia sin la key de DetalleSeleccion)
//   node medir.mjs efecto        (El error que vas a ver; sobre la copia con el Effect)
// Variables: DEPURACION (puerto de Chrome, 9222) y PAGINA (http://localhost:4173/).
const depuracion = `http://127.0.0.1:${process.env.DEPURACION ?? "9222"}`;
const direccion = process.env.PAGINA ?? "http://localhost:4173/";
const escenario = process.argv[2] ?? "recorrido";

const pestana = await (await fetch(`${depuracion}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(pestana.webSocketDebuggerUrl);
await new Promise((listo) => ws.addEventListener("open", listo));

let siguienteId = 0;
const pendientes = new Map();
ws.addEventListener("message", (mensaje) => {
  const datos = JSON.parse(mensaje.data);
  pendientes.get(datos.id)?.(datos);
  pendientes.delete(datos.id);
});
const enviar = (method, params = {}) =>
  new Promise((listo) => {
    siguienteId += 1;
    pendientes.set(siguienteId, listo);
    ws.send(JSON.stringify({ id: siguienteId, method, params }));
  });
const leer = async (expresion) =>
  (await enviar("Runtime.evaluate", { expression: expresion, returnByValue: true })).result.result.value;
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));
const hacer = async (expresion) => {
  await leer(expresion);
  await esperar(200);
};

await enviar("Page.navigate", { url: direccion });
await esperar(1500);
await leer(`
  window.boton = (texto) => [...document.querySelectorAll("button")].find((b) => b.textContent === texto);
  window.escribir = (texto) => {
    const area = document.querySelector("textarea");
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(area, texto);
    area.dispatchEvent(new Event("input", { bubbles: true }));
  };
  window.filas = () => [...document.querySelectorAll("li")].map((li) => li.textContent).join(" | ");
`);
const detalle = () => leer(`document.querySelector("aside")?.getAttribute("aria-label") ?? "sin detalle"`);
const borrador = async () => JSON.stringify(await leer(`document.querySelector("textarea")?.value ?? null`));
const casilla = `document.querySelector(".filtro input").click()`;

if (escenario === "recorrido") {
  console.log("1. al cargar");
  console.log("   resumen:", await leer(`document.querySelector(".resumen").textContent`));
  console.log("   botones:", await leer(`[...document.querySelectorAll("button.seleccionar")].map((b) => b.textContent + " aria-pressed=" + b.getAttribute("aria-pressed")).join(", ")`));
  await hacer(casilla);
  console.log("2. marcas «Solo fallas»");
  console.log("   filas:", await leer(`filas()`));
  console.log("   resumen:", await leer(`document.querySelector(".resumen").textContent`));
  await hacer(`${casilla}; boton("pagos").click()`);
  console.log("3. desmarcas y eliges pagos");
  console.log("   pagos aria-pressed:", await leer(`boton("pagos").getAttribute("aria-pressed")`));
  console.log("   detalle:", await leer(`document.querySelector("aside").getAttribute("aria-label") + " — " + document.querySelector("aside p").textContent`));
  await hacer(`escribir("llamar al proveedor")`);
  await hacer(`boton("Guardar nota").click()`);
  console.log("4. escribes una nota y la guardas");
  console.log("   filas:", await leer(`filas()`));
  await hacer(`escribir("borrador sin guardar")`);
  await hacer(`boton("reportes").click()`);
  console.log("5. empiezas otra nota en pagos sin guardarla y eliges reportes");
  console.log("   detalle:", await detalle(), "· borrador:", await borrador());
  await hacer(`boton("pagos").click()`);
  console.log("6. regresas a pagos");
  console.log("   borrador:", await borrador());
  await hacer(`boton("Cerrar detalle").click()`);
  console.log("7. cierras el detalle");
  console.log("   ¿hay detalle?:", await leer(`document.querySelector("aside") !== null`), "· pagos aria-pressed:", await leer(`boton("pagos").getAttribute("aria-pressed")`));
} else if (escenario === "filtro") {
  await hacer(`boton("catálogo").click()`);
  console.log("a. eliges catálogo:", await detalle());
  await hacer(casilla);
  console.log("b. marcas «Solo fallas»:", await leer(`filas()`), "·", await detalle());
  await hacer(casilla);
  console.log("c. desmarcas:", await detalle());
} else if (escenario === "sin-key") {
  await hacer(`boton("pagos").click()`);
  await hacer(`escribir("borrador de pagos")`);
  await hacer(`boton("reportes").click()`);
  console.log("a. escribes en pagos sin guardar y eliges reportes:", await detalle(), "· borrador:", await borrador());
  await hacer(`boton("pagos").click()`);
  await hacer(`escribir("llamar al proveedor")`);
  await hacer(`boton("Guardar nota").click()`);
  await hacer(`boton("catálogo").click()`);
  console.log("b. guardas una nota en pagos y eliges catálogo:", await detalle(), "· borrador:", await borrador());
  await hacer(`boton("Cerrar detalle").click()`);
  await hacer(`boton("reportes").click()`);
  console.log("c. cierras el detalle y eliges reportes:", await detalle(), "· borrador:", await borrador());
} else if (escenario === "efecto") {
  await hacer(`boton("pagos").click()`);
  await hacer(`escribir("llamar al proveedor")`);
  await hacer(`boton("Guardar nota").click()`);
  await hacer(`boton("catálogo").click()`);
  await hacer(`boton("pagos").click()`);
  console.log("a. guardas una nota en pagos, eliges catálogo y regresas:", await detalle(), "· borrador:", await borrador());
  await hacer(`boton("catálogo").click()`);
  await hacer(`escribir("revisar el disco")`);
  await hacer(`boton("Guardar nota").click()`);
  await hacer(`boton("pagos").click()`);
  console.log("b. guardas una nota en catálogo y eliges pagos:", await detalle(), "· borrador:", await borrador());
  console.log("   filas:", await leer(`filas()`));
} else {
  console.log(`escenario desconocido: ${escenario}`);
}

ws.close();
await fetch(`${depuracion}/json/close/${pestana.id}`);
