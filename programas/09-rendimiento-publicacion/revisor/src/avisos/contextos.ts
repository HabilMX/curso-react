import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
