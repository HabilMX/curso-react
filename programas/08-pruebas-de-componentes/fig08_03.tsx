// fig08_03.tsx
import { JSDOM } from "jsdom";

// Sin React a propósito: lo que se mide aquí es el DOM de prueba, no la biblioteca.
// `pretendToBeVisual` le da a jsdom un requestAnimationFrame, para esperar dos cuadros
// como en fig08_03.html, la misma página para Chrome.
const dom = new JSDOM(`<!doctype html>
<style>
  button[aria-disabled="true"] { opacity: 0.6; cursor: not-allowed; }
  .oculto { display: none; }
</style>
<button type="submit" id="enviar">Dar de alta</button>
<button type="button" id="escondido" class="oculto">Escondido</button>`, { pretendToBeVisual: true });

const { document } = dom.window;
const enviar = document.getElementById("enviar") as HTMLButtonElement;
const escondido = document.getElementById("escondido") as HTMLButtonElement;

function quienTieneElFoco(): string {
  const activo = document.activeElement;
  return activo === null ? "nadie" : activo.id === "" ? activo.tagName.toLowerCase() : `#${activo.id}`;
}

console.log("1. el foco en un botón que se desactiva");
enviar.focus();
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);
enviar.disabled = true;
console.log(`   después de disabled = true: foco en ${quienTieneElFoco()}`);
await new Promise((listo) => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(listo)));
console.log(`   dos cuadros después: foco en ${quienTieneElFoco()}`);
enviar.disabled = false;
enviar.focus();

console.log("2. el foco en un elemento con display: none");
escondido.focus();
console.log(`   display calculado: ${dom.window.getComputedStyle(escondido).display}`);
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);

console.log("3. el diseño");
const caja = enviar.getBoundingClientRect();
console.log(`   getBoundingClientRect(): ${caja.width} × ${caja.height} en (${caja.x}, ${caja.y})`);
console.log(`   offsetWidth: ${enviar.offsetWidth}`);

console.log("4. la hoja de estilos");
enviar.setAttribute("aria-disabled", "true");
const estilo = dom.window.getComputedStyle(enviar);
console.log(`   opacity: ${estilo.opacity}, cursor: ${estilo.cursor}`);

dom.window.close();
