import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ResumenFallas } from "./ResumenFallas";

describe("el resumen de fallas", () => {
  test("un solo servicio se dice en singular", () => {
    render(<ResumenFallas estados={[{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }]} />);
    expect(screen.getByText(/revisad/).textContent).toBe("1 servicio revisado · 1 servicio con falla");
  });
});
