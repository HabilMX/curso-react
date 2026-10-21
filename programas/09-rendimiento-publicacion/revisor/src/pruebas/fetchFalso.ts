import { vi } from "vitest";

export interface RespuestaFalsa {
  readonly status: number;
  readonly cuerpo: unknown;
}

export type Rutas = Readonly<Record<string, RespuestaFalsa | (() => Promise<RespuestaFalsa>)>>;

// Sustituye `fetch` por una función que responde según "MÉTODO /ruta". Lo que no
// esté en la tabla responde 404, para que una ruta olvidada se note en la prueba.
export function instalarFetchFalso(rutas: Rutas) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const clave = `${opciones?.method ?? "GET"} ${decodeURIComponent(url.pathname)}`;
    const definida = rutas[clave];
    const respuesta =
      definida === undefined
        ? { status: 404, cuerpo: { detalle: `sin ruta falsa para ${clave}` } }
        : typeof definida === "function"
          ? await definida()
          : definida;

    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return falso;
}

export function nuncaResponde(): Promise<RespuestaFalsa> {
  return new Promise(() => {});
}
