import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState, useOptimistic, useState } from "react";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { validarCampos } from "../compartido/esquema";
import { claves } from "../consultas/claves";
import { BotonEnviar } from "./BotonEnviar";
import { Campo } from "./Campo";
import { darDeAlta } from "./darDeAlta";
import { camposAlta } from "./esquemaAlta";
import { estadoInicialFormulario, textosDe, type EstadoFormulario } from "./estadoFormulario";

interface Alta {
  readonly nombre: string;
  readonly pendiente: boolean;
}

export function FormularioAlta() {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();
  const [altas, establecerAltas] = useState<readonly Alta[]>([]);
  const [altasVisibles, agregarAltaOptimista] = useOptimistic(
    altas,
    (actuales, nombre: string) =>
      actuales.some((alta) => alta.nombre === nombre)
        ? actuales
        : [...actuales, { nombre, pendiente: true }],
  );

  async function enviar(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const textos = textosDe(datos);
    const validacion = validarCampos(camposAlta, textos);

    if (!validacion.ok) {
      return { tipo: "con-errores", detalle: "Revisa los campos marcados.", errores: validacion.errores, textos };
    }

    agregarAltaOptimista(validacion.valor.nombre);

    try {
      const respuesta = await darDeAlta(validacion.valor);

      if (!respuesta.ok) {
        return { tipo: "con-errores", detalle: respuesta.detalle, errores: respuesta.errores, textos };
      }

      // Después de un `await`, una actualización de estado ya no pertenece a la acción:
      // `startTransition` la devuelve a ella, y la fila optimista y la confirmada se
      // reemplazan en el mismo dibujo. El aviso de éxito lo da solo la bandeja.
      startTransition(() => {
        establecerAltas((actuales) => [...actuales, { nombre: respuesta.estado.nombre, pendiente: false }]);
        despachar({ tipo: "agregado", nivel: "exito", texto: `Se dio de alta ${respuesta.estado.nombre}` });
      });
      await clienteConsultas.invalidateQueries({ queryKey: claves.reporte });
      return { tipo: "agregado", nombre: respuesta.estado.nombre };
    } catch (error: unknown) {
      const detalle = error instanceof Error ? error.message : "falló el alta";
      return { tipo: "con-errores", detalle: `No se pudo dar de alta: ${detalle}`, errores: {}, textos };
    }
  }

  const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
  const errores = estado.tipo === "con-errores" ? estado.errores : {};
  const textos = estado.tipo === "con-errores" ? estado.textos : { nombre: "", url: "", timeoutMs: "" };

  return (
    <>
      <form action={accion} noValidate aria-describedby="resultado-alta">
        <Campo
          nombre="nombre"
          etiqueta="Nombre"
          ayuda="Un nombre corto y único, por ejemplo: correo"
          valorInicial={textos.nombre}
          error={errores.nombre}
        />
        <Campo
          nombre="url"
          etiqueta="Dirección"
          tipo="url"
          ayuda="La dirección que se va a revisar, con http:// o https://"
          valorInicial={textos.url}
          error={errores.url}
        />
        <Campo
          nombre="timeoutMs"
          etiqueta="Tiempo límite (ms)"
          ayuda="Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500"
          valorInicial={textos.timeoutMs}
          error={errores.timeoutMs}
        />
        <BotonEnviar />
      </form>
      <div id="resultado-alta">
        <div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
      </div>
      {altasVisibles.length > 0 && (
        <section aria-label="Altas de esta sesión">
          <h3>Altas de esta sesión</h3>
          <ul>
            {altasVisibles.map((alta) => (
              <li key={alta.nombre} className={alta.pendiente ? "pendiente" : undefined}>
                {alta.nombre}
                {alta.pendiente && " (agregando…)"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
