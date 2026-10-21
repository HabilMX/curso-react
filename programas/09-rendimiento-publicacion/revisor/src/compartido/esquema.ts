// Los esquemas de la lección 6 del curso de TypeScript: un valor que sabe leer
// `unknown` en ejecución y del que se deriva el tipo de su salida.
export type Resultado<T> = { ok: true; valor: T } | { ok: false; detalle: string };

export type Esquema<T> = {
  leer(valor: unknown): Resultado<T>;
};

export type Inferir<E extends Esquema<unknown>> = E extends Esquema<infer T> ? T : never;

export const textoNoVacio: Esquema<string> = {
  leer(valor) {
    if (typeof valor === "string" && valor.trim() !== "") {
      return { ok: true, valor: valor.trim() };
    }

    return { ok: false, detalle: "escribe un valor" };
  },
};

export const urlHttp: Esquema<string> = {
  leer(valor) {
    if (typeof valor !== "string") {
      return { ok: false, detalle: "escribe una dirección" };
    }

    try {
      const url = new URL(valor.trim());

      if (url.protocol === "http:" || url.protocol === "https:") {
        return { ok: true, valor: url.href };
      }
    } catch {
      // cae al mensaje de abajo
    }

    return { ok: false, detalle: "escribe una dirección que empiece con http:// o https://" };
  },
};

export const enteroPositivoDeTexto: Esquema<number> = {
  leer(valor) {
    if (typeof valor === "string" && /^[1-9]\d*$/.test(valor.trim())) {
      const numero = Number(valor.trim());

      if (Number.isSafeInteger(numero)) {
        return { ok: true, valor: numero };
      }
    }

    return { ok: false, detalle: "escribe un número entero mayor que cero" };
  },
};

export type ValoresDe<T extends Record<string, Esquema<unknown>>> = {
  [K in keyof T]: Inferir<T[K]>;
};

export type ErroresDe<T> = Partial<Record<keyof T, string>>;

// A diferencia de `objeto` en TypeScript, que se detiene en el primer error, un
// formulario necesita TODOS los errores a la vez: uno junto a cada campo.
export function validarCampos<T extends Record<string, Esquema<unknown>>>(
  campos: T,
  valores: Readonly<Record<string, unknown>>,
): { ok: true; valor: ValoresDe<T> } | { ok: false; errores: ErroresDe<T> } {
  const salida: Record<string, unknown> = {};
  const errores: ErroresDe<T> = {};

  for (const clave of Object.keys(campos) as (keyof T & string)[]) {
    const resultado = campos[clave].leer(valores[clave]);

    if (resultado.ok) {
      salida[clave] = resultado.valor;
    } else {
      errores[clave] = resultado.detalle;
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return { ok: true, valor: salida as ValoresDe<T> };
}
