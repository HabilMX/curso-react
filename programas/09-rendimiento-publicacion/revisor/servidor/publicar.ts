// Servidor de la versión publicada del `revisor` (Lección 9). Sirve lo que
// `npm run build` dejó en dist/, con tres cosas que `vite preview` no garantiza:
//   1. Reescritura: una ruta del cliente (/servicios/pagos) responde index.html.
//   2. Encabezados de seguridad: CSP sin 'unsafe-inline' y nosniff.
//   3. Una lista CERRADA de archivos: solo se entrega lo que había en dist/ al
//      arrancar; ninguna ruta que escriba el cliente se convierte en una ruta de disco.
// Las peticiones a /api se reenvían a la API (API_URL), como hacía el proxy de Vite.
import { readdir, readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PUERTO = Number(process.env.PUERTO ?? "4180");
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100";
const RAIZ = fileURLToPath(new URL("../dist/", import.meta.url));

const TIPOS: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const POLITICA = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

async function listarArchivos(carpeta: string): Promise<Map<string, Buffer>> {
  const archivos = new Map<string, Buffer>();
  const entradas = await readdir(carpeta, { recursive: true, withFileTypes: true });

  for (const entrada of entradas) {
    if (entrada.isFile()) {
      const ruta = join(entrada.parentPath, entrada.name);
      archivos.set(`/${relative(carpeta, ruta).split(sep).join("/")}`, await readFile(ruta));
    }
  }

  return archivos;
}

function enviar(
  respuesta: ServerResponse,
  codigo: number,
  tipo: string,
  cuerpo: Buffer | string,
  cache: string,
): void {
  respuesta.writeHead(codigo, {
    "content-type": tipo,
    "cache-control": cache,
    "content-security-policy": POLITICA,
    "x-content-type-options": "nosniff",
  });
  respuesta.end(cuerpo);
}

const archivos = await listarArchivos(RAIZ);
const indice = archivos.get("/index.html");

if (indice === undefined) {
  registrar("no existe dist/index.html: corre `npm run build` antes de `npm run publicado`");
  process.exit(1);
}

const servidor = createServer((solicitud, respuesta) => {
  const url = new URL(solicitud.url ?? "/", "http://revisor.local");
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => registrar(`${metodo} ${url.pathname} ${respuesta.statusCode}`));

  if (url.pathname.startsWith("/api/")) {
    const cuerpo = metodo === "GET" || metodo === "HEAD" ? undefined : solicitud;

    fetch(new URL(url.pathname + url.search, API_URL), {
      method: metodo,
      headers: { "content-type": solicitud.headers["content-type"] ?? "application/json" },
      body: cuerpo,
      duplex: "half",
    } as RequestInit)
      .then(async (deLaApi) => {
        respuesta.writeHead(deLaApi.status, {
          "content-type": deLaApi.headers.get("content-type") ?? "application/json",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        respuesta.end(Buffer.from(await deLaApi.arrayBuffer()));
      })
      .catch(() => {
        respuesta.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        respuesta.end(JSON.stringify({ detalle: "la API no responde" }));
      });
    return;
  }

  if (metodo !== "GET" && metodo !== "HEAD") {
    respuesta.writeHead(405, { allow: "GET, HEAD" });
    respuesta.end();
    return;
  }

  const archivo = archivos.get(url.pathname);

  if (archivo !== undefined && url.pathname !== "/index.html") {
    const inmutable = url.pathname.startsWith("/assets/");
    enviar(
      respuesta,
      200,
      TIPOS[extname(url.pathname)] ?? "application/octet-stream",
      archivo,
      inmutable ? "public, max-age=31536000, immutable" : "no-cache",
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    enviar(respuesta, 404, "text/plain; charset=utf-8", "no existe", "no-store");
    return;
  }

  // Reescritura: cualquier otra ruta es del cliente, y la decide React Router.
  enviar(respuesta, 200, TIPOS[".html"] ?? "text/html", indice, "no-cache");
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`revisor publicado en http://127.0.0.1:${PUERTO} (API en ${API_URL})`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor detenido"));
    servidor.closeAllConnections();
  });
}
