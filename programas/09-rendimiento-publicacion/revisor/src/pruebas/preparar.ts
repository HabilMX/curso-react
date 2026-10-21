import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React solo avisa de las actualizaciones fuera de act() si esta variable está encendida.
// Testing Library la enciende sola cuando el ejecutor expone `beforeAll` como global; con
// `globals` apagado no lo hace, y hay que hacerlo aquí.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
