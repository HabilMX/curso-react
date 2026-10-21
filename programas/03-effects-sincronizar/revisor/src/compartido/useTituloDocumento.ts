import { useEffect } from "react";

export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
