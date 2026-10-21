import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
});
