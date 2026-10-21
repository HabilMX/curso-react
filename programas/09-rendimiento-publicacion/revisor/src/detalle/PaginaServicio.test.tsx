import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página de un servicio", () => {
  test("muestra el detalle del servicio de la dirección", async () => {
    instalarFetchFalso({ "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos } });
    montarEn("/servicios/pagos");
    expect(await screen.findByText("En falla: HTTP 503")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Servicio pagos" })).toBeDefined();
  });

  test("volver a revisar deja un aviso en la bandeja", async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    await usuario.click(await screen.findByRole("button", { name: "Volver a revisar" }));
    expect(await screen.findByText("pagos se volvió a revisar: disponible")).toBeDefined();
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "POST")).toBe(true);
  });
});
