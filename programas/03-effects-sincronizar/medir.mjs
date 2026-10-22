// medir.mjs — abre el panel en un Chrome sin ventana, hace clics de ratón reales y
// escribe lo que ve el recuadro de detalle. No es una figura ni parte del revisor:
// es el guion con que se midieron las salidas «medidas con Chrome sin ventana» de la
// Lección 3. La bitácora del servidor no sale de aquí: es la salida del propio
// `npm run servidor`, que conviene redirigir a un archivo (ver abajo).
//
// Uso, con el servidor de práctica y el servidor de desarrollo encendidos (para ver el
// ciclo extra de StrictMode hace falta `npm run dev`, no `npm run preview`) y un Chrome
// abierto así:
//   google-chrome --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-curso
// En una terminal:   npm run servidor > bitacora.txt
// En otra:           npm run dev
// En una tercera:    node medir.mjs <escenario>
//
// Escenarios (cada uno se corre sobre el punto de control o sobre la copia que dice):
//   detalle       3.2.3  punto de control sin cambios: pagos y 300 ms después inventario
//   sin-guarda    3.2.3  copia sin `if (control.signal.aborted) return;` en useDetalle
//   sin-abort     3.3.3  copia sin `return () => control.abort();` (con la key)
//   sin-key-sin-abort  3.3.3  copia sin la key de ContenidoReporte y sin abort
//   sin-key       3.3.3  copia sin la key de ContenidoReporte, con abort: pagos, espera, catálogo
//   lazo          3.5.2  copia con alRecibir en la lista de dependencias: cinco segundos desde abrir, sin clics
//   clics         3.6.2  punto de control: veintiún segundos con seis clics
// Variables: DEPURACION (puerto de Chrome, 9222) y PAGINA (http://localhost:5173/).
const depuracion = `http://127.0.0.1:${process.env.DEPURACION ?? "9222"}`;
const direccion = process.env.PAGINA ?? "http://localhost:5173/";
const escenario = process.argv[2] ?? "detalle";

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
const hora = () => new Date().toISOString().slice(11, 23);
const decir = (texto) => console.log(`${hora()} ${texto}`);

// Un clic de ratón de verdad: el centro del elemento, con los mismos eventos que produce una mano.
async function clic(descripcion, expresionElemento) {
  const caja = await leer(`(() => { const e = ${expresionElemento}; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  decir(`clic en ${descripcion}`);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await enviar("Input.dispatchMouseEvent", { type, x: caja.x, y: caja.y, button: "left", clickCount: 1 });
  }
}
const boton = (texto) => `[...document.querySelectorAll("button")].find((b) => b.textContent === ${JSON.stringify(texto)})`;
const casilla = `document.querySelector(".filtro input")`;
const recuadro = async () => decir(`aside:\n${await leer(`document.querySelector("aside")?.innerText ?? "(sin recuadro)"`)}`);

await enviar("Page.enable");
decir(`abre ${direccion}`);
await enviar("Page.navigate", { url: direccion });
await esperar(1500);

if (escenario === "detalle" || escenario === "sin-abort" || escenario === "sin-key-sin-abort") {
  await clic("pagos", boton("pagos"));
  await esperar(300);
  await recuadro();
  await clic("inventario", boton("inventario"));
  await esperar(500);
  await recuadro();
  await esperar(2000);
  await recuadro();
} else if (escenario === "sin-guarda") {
  await clic("pagos", boton("pagos"));
  await esperar(150);
  await recuadro();
  await esperar(1700);
  await recuadro();
  await clic("inventario", boton("inventario"));
  await esperar(100);
  await recuadro();
  await esperar(500);
  await recuadro();
} else if (escenario === "sin-key") {
  await clic("pagos", boton("pagos"));
  await esperar(2000);
  await recuadro();
  await clic("catálogo", boton("catálogo"));
  await esperar(40);
  await recuadro();
  await esperar(600);
  await recuadro();
} else if (escenario === "lazo") {
  // Cinco segundos desde que se abre la página: ya pasaron 1.5 s de espera inicial.
  await esperar(3500);
} else if (escenario === "clics") {
  const actualizado = async () => decir(`document.querySelector(".actualizado").textContent → ${JSON.stringify(await leer(`document.querySelector(".actualizado")?.textContent`))}`);
  await actualizado();
  await clic("la casilla", casilla);
  await esperar(2000);
  await clic("la casilla", casilla);
  await esperar(2000);
  await clic("catálogo", boton("catálogo"));
  await esperar(2000);
  await clic("inventario", boton("inventario"));
  await esperar(5000);
  await actualizado();
  await clic("la casilla", casilla);
  await esperar(2000);
  await clic("la casilla", casilla);
  await esperar(7000);
  await actualizado();
} else {
  console.log(`escenario desconocido: ${escenario}`);
}

ws.close();
await fetch(`${depuracion}/json/close/${pestana.id}`);
