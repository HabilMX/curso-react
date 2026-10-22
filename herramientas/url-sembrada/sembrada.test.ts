// sembrada.test.ts — no es de ninguna lección. verificar-url-sembrada.sh lo corre con el
// runner de Node contra cada esquema del curso que lee una dirección (el `esquema.ts` de los
// revisores 7 a 9 y la figura 2 de la lección 7). La ruta del módulo llega en URL_SEMBRADA_MODULO.
//
// La URL sembrada trae usuario, clave, un token en el query string y un fragmento.
// El esquema la rechaza y su mensaje no repite nada de eso.
import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";

type Resultado = { ok: true; valor: unknown } | { ok: false; detalle: string };
type Esquema = { leer(valor: unknown): Resultado };

const CON_CLAVE = "http://usuario:clave@127.0.0.1:1/estado?token=SECRETO#x";
const SECRETOS = ["usuario:clave", "SECRETO", "token=", "#x", "127.0.0.1"];

const ruta = process.env.URL_SEMBRADA_MODULO;
assert.ok(ruta, "falta URL_SEMBRADA_MODULO");
const modulo = (await import(pathToFileURL(ruta).href)) as { urlHttp?: Esquema };
const urlHttp = modulo.urlHttp;
assert.ok(urlHttp, "el módulo no exporta urlHttp");

function noRepiteSecretos(texto: string): void {
  for (const secreto of SECRETOS) {
    assert.ok(!texto.includes(secreto), `repite «${secreto}»: ${texto}`);
  }
}

test("control: una dirección sin usuario ni clave se acepta", () => {
  // Si esto deja de ser cierto, el rechazo de abajo ya no mide nada.
  assert.deepEqual(urlHttp.leer(" https://correo.example "), { ok: true, valor: "https://correo.example/" });
});

test("rechaza una dirección con usuario y clave, sin repetirla", () => {
  const resultado = urlHttp.leer(CON_CLAVE);
  assert.equal(resultado.ok, false, `aceptó una URL con usuario y clave: ${JSON.stringify(resultado)}`);
  if (!resultado.ok) {
    noRepiteSecretos(resultado.detalle);
  }
});

test("rechaza también una dirección con solo usuario", () => {
  const resultado = urlHttp.leer("https://usuario@correo.example/");
  assert.equal(resultado.ok, false, `aceptó una URL con usuario: ${JSON.stringify(resultado)}`);
});
