export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
