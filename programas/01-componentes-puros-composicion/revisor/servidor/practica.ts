// Servidor de práctica del curso de React. Responde el mismo contrato público que
// la API del curso de TypeScript (GET /api/estados y GET /salud) con datos fijos,
// para que el panel tenga a quién preguntarle. No se explica en el curso: el curso
// es de pantalla. Se arranca con `npm run servidor`.
import { createServer } from "node:http";
import type { ReportePublico } from "../src/compartido/contrato.ts";

const PUERTO = Number(process.env.PUERTO ?? "3100");
const DEMORA_MS = 300;

const reporte: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

const servidor = createServer((solicitud, respuesta) => {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;

  respuesta.once("finish", () => {
    registrar(`${solicitud.method ?? "?"} ${ruta} ${respuesta.statusCode}`);
  });
  solicitud.once("close", () => {
    if (!respuesta.writableFinished) {
      registrar(`${solicitud.method ?? "?"} ${ruta} cancelada por el cliente`);
    }
  });

  if (solicitud.method !== "GET") {
    respuesta.writeHead(405, { allow: "GET", "content-type": "application/json; charset=utf-8" });
    respuesta.end(JSON.stringify({ detalle: "método no permitido" }));
    return;
  }

  if (ruta === "/salud") {
    respuesta.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    respuesta.end("ok");
    return;
  }

  if (ruta === "/api/estados") {
    setTimeout(() => {
      if (respuesta.destroyed) {
        return;
      }
      respuesta.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      respuesta.end(JSON.stringify(reporte));
    }, DEMORA_MS);
    return;
  }

  respuesta.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  respuesta.end(JSON.stringify({ detalle: "ruta no encontrada" }));
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`servidor de práctica en http://127.0.0.1:${PUERTO}`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor de práctica detenido"));
    servidor.closeAllConnections();
  });
}
