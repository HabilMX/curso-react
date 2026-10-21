import { isRouteErrorResponse, useRouteError } from "react-router";
import { AvisoDeError } from "../compartido/AvisoDeError";

// React Router atrapa los errores de sus rutas antes de que lleguen a
// LimiteDeError. Este es el límite que dibuja en su lugar: el mismo aviso.
export function ErrorDeRuta() {
  const error = useRouteError();

  return <AvisoDeError mensaje={describirError(error)} />;
}

// En JavaScript se puede lanzar cualquier cosa, no solo un Error.
function describirError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "error desconocido";
}
