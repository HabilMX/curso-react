import { QueryClient } from "@tanstack/react-query";

// Un 4xx es una respuesta, no una falla pasajera: preguntar otra vez da lo mismo.
// Lo demás (un 503, la red caída) se reintenta dos veces, como antes.
function convieneReintentar(fallas: number, error: Error): boolean {
  const status = error.cause;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }

  return fallas < 2;
}

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: convieneReintentar,
      },
    },
  });
}
