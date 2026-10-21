import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

export function BotonEnviar() {
  const { pending } = useFormStatus();

  // `disabled` le quitaría el foco al botón mientras está pendiente, y quien usa el
  // teclado perdería su lugar. `aria-disabled` lo anuncia como no disponible sin
  // sacarle el foco; el segundo envío se ignora aquí, cancelando el clic.
  function alPulsar(evento: MouseEvent<HTMLButtonElement>): void {
    if (pending) {
      evento.preventDefault();
    }
  }

  return (
    <button type="submit" aria-disabled={pending} onClick={alPulsar}>
      {pending ? "Dando de alta…" : "Dar de alta"}
    </button>
  );
}
