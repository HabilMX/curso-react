import type { ReactNode } from "react";

export function Tarjeta({
  titulo,
  children,
}: {
  readonly titulo: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="tarjeta" aria-label={titulo}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
