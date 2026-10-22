// Servidor de práctica del curso de React. Responde los mismos datos públicos que
// la API del curso de TypeScript (GET /api/estados y GET /salud) con datos fijos,
// más el detalle de un servicio, para que el panel tenga a quién preguntarle. No se
// explica en el curso: el curso es de pantalla. Se arranca con `npm run servidor`.
import { createServer, type ServerResponse } from "node:http";
import type { DetalleServicio, EstadoPublico, ReportePublico } from "../src/compartido/contrato.ts";

const PUERTO = Number(process.env.PUERTO ?? "3100");
const DEMORA_MS = 300;

// El detalle de "pagos" tarda más que los demás a propósito: así se puede reproducir
// la carrera de respuestas de la Lección 3 (pedir pagos, cambiar a otro antes de que
// llegue, y ver cuál respuesta gana).
const DEMORA_DETALLE_MS: Readonly<Record<string, number>> = { pagos: 1500 };
const DEMORA_DETALLE_PREDETERMINADA_MS = 200;

const estados: EstadoPublico[] = [
  { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
  { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
  { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
];

let revisiones = 0;
let ultimaRevision = new Date().toISOString();

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

function enviarJson(respuesta: ServerResponse, codigo: number, cuerpo: unknown): void {
  respuesta.writeHead(codigo, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  respuesta.end(JSON.stringify(cuerpo));
}

function despues(respuesta: ServerResponse, demoraMs: number, accion: () => void): void {
  setTimeout(() => {
    if (!respuesta.destroyed) {
      accion();
    }
  }, demoraMs);
}

function revisar(): ReportePublico {
  revisiones += 1;
  ultimaRevision = new Date().toISOString();
  return { estados };
}

const servidor = createServer((solicitud, respuesta) => {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => {
    registrar(`${metodo} ${ruta} ${respuesta.statusCode}`);
  });
  solicitud.once("close", () => {
    if (!respuesta.writableFinished) {
      registrar(`${metodo} ${ruta} cancelada por el cliente`);
    }
  });

  if (metodo !== "GET") {
    respuesta.setHeader("allow", "GET");
    enviarJson(respuesta, 405, { detalle: "método no permitido" });
    return;
  }

  if (ruta === "/salud") {
    respuesta.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    respuesta.end("ok");
    return;
  }

  if (ruta === "/api/estados") {
    despues(respuesta, DEMORA_MS, () => enviarJson(respuesta, 200, revisar()));
    return;
  }

  const servicio = /^\/api\/servicios\/([^/]+)$/.exec(ruta);

  if (servicio !== null) {
    let nombre: string;

    try {
      nombre = decodeURIComponent(servicio[1] ?? "");
    } catch {
      enviarJson(respuesta, 400, { detalle: "nombre de servicio inválido" });
      return;
    }

    const estado = estados.find((candidato) => candidato.nombre === nombre);
    const demora = DEMORA_DETALLE_MS[nombre] ?? DEMORA_DETALLE_PREDETERMINADA_MS;

    despues(respuesta, demora, () => {
      if (estado === undefined) {
        enviarJson(respuesta, 404, { detalle: `no existe el servicio ${nombre}` });
        return;
      }

      const detalle: DetalleServicio = { nombre, estado, revisiones, ultimaRevision };
      enviarJson(respuesta, 200, detalle);
    });
    return;
  }

  enviarJson(respuesta, 404, { detalle: "ruta no encontrada" });
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
