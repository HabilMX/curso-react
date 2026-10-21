import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
