export function Campo({
  nombre,
  etiqueta,
  ayuda,
  tipo = "text",
  valorInicial,
  error,
}: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly tipo?: "text" | "url";
  readonly valorInicial: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required
        defaultValue={valorInicial}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && (
        <p id={idError} className="error-campo">
          {error}
        </p>
      )}
      <p id={idAyuda} className="ayuda">
        {ayuda}
      </p>
    </div>
  );
}
