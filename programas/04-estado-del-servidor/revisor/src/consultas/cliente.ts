import { QueryClient } from "@tanstack/react-query";

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: 2,
      },
    },
  });
}
