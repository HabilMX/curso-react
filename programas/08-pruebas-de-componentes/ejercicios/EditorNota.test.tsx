// ejercicios/EditorNota.test.tsx — va en revisor/src/detalle/EditorNota.test.tsx
import { act, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

test("el borrador de una nota no se arrastra a otro servicio", async () => {
  instalarFetchFalso({
    "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
    "GET /api/servicios/reportes": {
      status: 200,
      cuerpo: { ...detallePagos, nombre: "reportes", estado: { ...detallePagos.estado, nombre: "reportes" } },
    },
  });
  const { enrutador, usuario } = montarEn("/servicios/reportes");
  await screen.findByRole("textbox", { name: "Nota sobre reportes" });
  await act(() => enrutador.navigate("/servicios/pagos"));
  await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

  await act(() => enrutador.navigate("/servicios/reportes"));
  const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
  expect(editor.value).toBe("");
});
