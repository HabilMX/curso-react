import { describe, expect, test } from "vitest";
import { camposAlta } from "../alta/esquemaAlta";
import { validarCampos } from "./esquema";

describe("validarCampos con el esquema del alta", () => {
  test("convierte el texto del formulario en un NuevoServicio", () => {
    expect(
      validarCampos(camposAlta, { nombre: " correo ", url: "https://correo.example", timeoutMs: "1500" }),
    ).toEqual({
      ok: true,
      valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 },
    });
  });

  test("informa todos los campos inválidos a la vez", () => {
    expect(validarCampos(camposAlta, { nombre: "  ", url: "ftp://x", timeoutMs: "1.5" })).toEqual({
      ok: false,
      errores: {
        nombre: "escribe un valor",
        url: "escribe una dirección que empiece con http:// o https://",
        timeoutMs: "escribe un número entero mayor que cero",
      },
    });
  });
});
