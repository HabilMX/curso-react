export function FiltroFallas({
  soloFallas,
  alCambiar,
}: {
  readonly soloFallas: boolean;
  readonly alCambiar: (soloFallas: boolean) => void;
}) {
  return (
    <label className="filtro">
      <input
        type="checkbox"
        checked={soloFallas}
        onChange={(evento) => alCambiar(evento.target.checked)}
      />{" "}
      Solo fallas
    </label>
  );
}
