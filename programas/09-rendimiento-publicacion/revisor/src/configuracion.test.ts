import { describe, expect, test } from "vitest";
import { leerCadaMs } from "./configuracion";

describe("leerCadaMs", () => {
  test("acepta un intervalo razonable", () => {
    expect(leerCadaMs("5000")).toBe(5_000);
  });

  test("usa diez segundos si el valor no es un entero positivo", () => {
    for (const valor of [undefined, "", "abc", "0", "-5", "1e4", "10s"]) {
      expect(leerCadaMs(valor)).toBe(10_000);
    }
  });

  test("usa diez segundos si el intervalo se sale de los límites", () => {
    expect(leerCadaMs("999")).toBe(10_000);
    expect(leerCadaMs("1000")).toBe(1_000);
    expect(leerCadaMs("3600000")).toBe(3_600_000);
    expect(leerCadaMs("3600001")).toBe(10_000);
    expect(leerCadaMs("99999999999")).toBe(10_000);
  });
});
