import { describe, expect, test } from "vitest";
import hoja from "./panel.css?raw";

// El texto de cada componente, tal como está escrito (sin las pruebas).
const fuentes = Object.values(
  import.meta.glob<string>(["/src/**/*.tsx", "!/src/**/*.test.tsx"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

// Clases que ningún className escribe con todas sus letras: `disponible` y `falla`
// salen de `estado.tipo` (FilaEstado), y `active` la pone el NavLink de React Router.
const DINAMICAS = ["disponible", "falla", "active"];

function clasesDeLaHoja(css: string): string[] {
  const selectores = css.replace(/\{[^}]*\}/g, " ");
  return [...new Set([...selectores.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1] ?? ""))];
}

// Los textos entre comillas o acentos graves que aparecen después de `className=`.
function usosDeClassName(codigo: string): string[] {
  return codigo
    .split("\n")
    .filter((linea) => linea.includes("className="))
    .flatMap((linea) =>
      [...linea.slice(linea.indexOf("className=")).matchAll(/"([^"]*)"|`([^`]*)`/g)].map(
        (m) => m[1] ?? m[2] ?? "",
      ),
    );
}

function seUsa(clase: string, usos: readonly string[]): boolean {
  return (
    DINAMICAS.includes(clase) ||
    usos.some((uso) =>
      uso
        .split(/\s+/)
        .some((pieza) => new RegExp(`^${pieza.replace(/\$\{[^}]*\}/g, "[a-z0-9-]+")}$`).test(clase)),
    )
  );
}

// Contraste entre dos colores #rrggbb, con la fórmula de WCAG 2.2.
function contraste(uno: string, otro: string): number {
  const luminancia = (hex: string): number => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [clara, oscura] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return ((clara ?? 0) + 0.05) / ((oscura ?? 0) + 0.05);
}

describe("la hoja de estilos", () => {
  test("cada clase de la hoja la usa algún componente", () => {
    const clases = clasesDeLaHoja(hoja);
    const usos = fuentes.flatMap(usosDeClassName);
    // Control positivo: si la hoja o los componentes llegaran vacíos, no habría nada que revisar.
    expect(clases).toContain("tarjeta");
    expect(usos).toContain("tarjeta");
    expect(clases.filter((clase) => !seUsa(clase, usos))).toEqual([]);
  });

  test("la hora de actualización se ve secundaria y se lee bien", () => {
    const regla = /\.actualizado\s*\{([^}]*)\}/.exec(hoja)?.[1] ?? "";
    const color = /(?:^|;|\s)color:\s*(#[0-9a-f]{6})/i.exec(regla)?.[1];
    expect(color, "falta el color de .actualizado").toBeDefined();
    expect(contraste(color ?? "#000000", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(color ?? "#000000", "#ffffff")).toBeLessThan(21);
  });
});
