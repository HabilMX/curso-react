import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { rutas } from "./app/rutas";
import { LimiteDeError } from "./compartido/LimiteDeError";
import { crearClienteConsultas } from "./consultas/cliente";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

const clienteConsultas = crearClienteConsultas();
const enrutador = createBrowserRouter(rutas);

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <QueryClientProvider client={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
