import { describe, expect, test } from "vitest";
import { consultaDetalle } from "../detalle/consultas";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { crearClienteConsultas } from "./cliente";

describe("el cliente de consultas", () => {
  test("no reintenta un 404: el servicio no va a aparecer por insistir", async () => {
    const fetchFalso = instalarFetchFalso({});
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("nada"))).rejects.toThrow("la API respondió 404");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("reintenta dos veces un 503: puede ser pasajero", { timeout: 10_000 }, async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 503, cuerpo: { detalle: "caída" } },
    });
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("pagos"))).rejects.toThrow("la API respondió 503");
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });
});
