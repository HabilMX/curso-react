// Servidor de práctica del curso de React. Responde el mismo contrato público que
// la API del curso de TypeScript (GET /api/estados y GET /salud) y las rutas que el
// panel necesita desde la Lección 3 (detalle) y la 4 (reintento y alta). Guarda los
// servicios en memoria: al reiniciarlo, vuelven los cuatro de siempre. No se explica
// en el curso: el curso es de pantalla. Se arranca con `npm run servidor`.
//
// Variables:
//   PUERTO     puerto donde escucha (3100 si no se define)
//   ESCENARIO  normal | vacio | caido
//              vacio: arranca sin servicios (para ver el estado vacío)
//              caido: GET /api/estados responde siempre 503 (para ver el error)
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type {
  DetalleServicio,
  EstadoPublico,
  NuevoServicio,
  ReportePublico,
} from "../src/compartido/contrato.ts";

const PUERTO = Number(process.env.PUERTO ?? "3100");
const ESCENARIO = process.env.ESCENARIO ?? "normal";
const DEMORA_MS = 300;
const LIMITE_CUERPO_BYTES = 10_000;

// El detalle de "pagos" tarda más que los demás a propósito: así se puede reproducir
// la carrera de respuestas de la Lección 3 (pedir pagos, cambiar a otro antes de que
// llegue, y ver cuál respuesta gana).
const DEMORA_DETALLE_MS: Readonly<Record<string, number>> = { pagos: 1500 };
const DEMORA_DETALLE_PREDETERMINADA_MS = 200;

const iniciales: readonly EstadoPublico[] = [
  { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
  { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
  { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
];

let estados: EstadoPublico[] = ESCENARIO === "vacio" ? [] : [...iniciales];
let revisiones = 0;
let ultimaRevision = new Date().toISOString();

type Campos = Partial<Record<keyof NuevoServicio, string>>;

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

async function leerJson(solicitud: IncomingMessage): Promise<unknown> {
  let texto = "";

  for await (const pedazo of solicitud) {
    texto += String(pedazo);

    if (texto.length > LIMITE_CUERPO_BYTES) {
      throw new Error("cuerpo demasiado grande");
    }
  }

  return JSON.parse(texto);
}

function validarAlta(valor: unknown): { ok: true; valor: NuevoServicio } | { ok: false; campos: Campos } {
  const campos: Campos = {};
  const registro =
    typeof valor === "object" && valor !== null && !Array.isArray(valor)
      ? (valor as Record<string, unknown>)
      : {};
  const { nombre, url, timeoutMs } = registro;

  if (typeof nombre !== "string" || nombre.trim() === "") {
    campos.nombre = "escribe un nombre";
  }

  if (typeof url !== "string" || !/^https?:\/\/\S+$/.test(url)) {
    campos.url = "escribe una dirección que empiece con http:// o https://";
  }

  if (typeof timeoutMs !== "number" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    campos.timeoutMs = "escribe un número entero de milisegundos mayor que cero";
  }

  if (Object.keys(campos).length > 0) {
    return { ok: false, campos };
  }

  return {
    ok: true,
    valor: { nombre: String(nombre).trim(), url: String(url), timeoutMs: Number(timeoutMs) },
  };
}

async function atender(solicitud: IncomingMessage, respuesta: ServerResponse): Promise<void> {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;
  const metodo = solicitud.method ?? "?";

  if (metodo === "GET" && ruta === "/salud") {
    respuesta.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    respuesta.end("ok");
    return;
  }

  if (metodo === "GET" && ruta === "/api/estados") {
    despues(respuesta, DEMORA_MS, () => {
      if (ESCENARIO === "caido") {
        enviarJson(respuesta, 503, { detalle: "la API no está disponible" });
        return;
      }

      enviarJson(respuesta, 200, revisar());
    });
    return;
  }

  if (metodo === "POST" && ruta === "/api/servicios") {
    let cuerpo: unknown;

    try {
      cuerpo = await leerJson(solicitud);
    } catch {
      enviarJson(respuesta, 400, { detalle: "el cuerpo debe ser JSON" });
      return;
    }

    const alta = validarAlta(cuerpo);

    despues(respuesta, DEMORA_MS, () => {
      if (!alta.ok) {
        enviarJson(respuesta, 400, { detalle: "hay campos inválidos", campos: alta.campos });
        return;
      }

      if (estados.some((estado) => estado.nombre === alta.valor.nombre)) {
        enviarJson(respuesta, 409, {
          detalle: `ya existe un servicio llamado ${alta.valor.nombre}`,
          campos: { nombre: "ese nombre ya existe" },
        });
        return;
      }

      const nuevo: EstadoPublico = {
        nombre: alta.valor.nombre,
        tipo: "disponible",
        codigoHttp: 200,
        duracionMs: 75,
      };
      estados = [...estados, nuevo];
      enviarJson(respuesta, 201, nuevo);
    });
    return;
  }

  const reintento = /^\/api\/servicios\/([^/]+)\/reintento$/.exec(ruta);

  if (metodo === "POST" && reintento !== null) {
    const nombre = decodeURIComponent(reintento[1] ?? "");

    despues(respuesta, DEMORA_MS, () => {
      if (!estados.some((estado) => estado.nombre === nombre)) {
        enviarJson(respuesta, 404, { detalle: `no existe el servicio ${nombre}` });
        return;
      }

      // Volver a revisar siempre encuentra el servicio recuperado: así el panel tiene
      // un cambio visible que mostrar después de invalidar su caché.
      const recuperado: EstadoPublico = { nombre, tipo: "disponible", codigoHttp: 200, duracionMs: 95 };
      estados = estados.map((estado) => (estado.nombre === nombre ? recuperado : estado));
      enviarJson(respuesta, 200, recuperado);
    });
    return;
  }

  const servicio = /^\/api\/servicios\/([^/]+)$/.exec(ruta);

  if (metodo === "GET" && servicio !== null) {
    const nombre = decodeURIComponent(servicio[1] ?? "");
    const demora = DEMORA_DETALLE_MS[nombre] ?? DEMORA_DETALLE_PREDETERMINADA_MS;

    despues(respuesta, demora, () => {
      const estado = estados.find((candidato) => candidato.nombre === nombre);

      if (estado === undefined) {
        enviarJson(respuesta, 404, { detalle: `no existe el servicio ${nombre}` });
        return;
      }

      const detalle: DetalleServicio = { nombre, estado, revisiones, ultimaRevision };
      enviarJson(respuesta, 200, detalle);
    });
    return;
  }

  if (metodo !== "GET" && metodo !== "POST") {
    respuesta.setHeader("allow", "GET, POST");
    enviarJson(respuesta, 405, { detalle: "método no permitido" });
    return;
  }

  enviarJson(respuesta, 404, { detalle: "ruta no encontrada" });
}

const servidor = createServer((solicitud, respuesta) => {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => {
    registrar(`${metodo} ${ruta} ${respuesta.statusCode}`);
  });
  respuesta.once("close", () => {
    if (!respuesta.writableFinished) {
      registrar(`${metodo} ${ruta} cancelada por el cliente`);
    }
  });

  atender(solicitud, respuesta).catch((error: unknown) => {
    registrar(`error: ${error instanceof Error ? error.message : "desconocido"}`);

    if (!respuesta.headersSent) {
      enviarJson(respuesta, 500, { detalle: "error interno" });
    }
  });
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`servidor de práctica en http://127.0.0.1:${PUERTO} (escenario: ${ESCENARIO})`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor de práctica detenido"));
    servidor.closeAllConnections();
  });
}
