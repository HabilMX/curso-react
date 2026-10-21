import { useState } from "react";

export function EditorNota({
  nombre,
  notaGuardada,
  alGuardar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardar: (nombre: string, texto: string) => void;
}) {
  const [borrador, establecerBorrador] = useState(notaGuardada);

  return (
    <div className="editor-nota">
      <label>
        Nota sobre {nombre}
        <textarea
          rows={3}
          value={borrador}
          onChange={(evento) => establecerBorrador(evento.target.value)}
        />
      </label>
      <button type="button" onClick={() => alGuardar(nombre, borrador)}>
        Guardar nota
      </button>
    </div>
  );
}
