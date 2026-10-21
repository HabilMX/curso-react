// fig06_01.ts
import {
  estadoInicialAvisos,
  reducirAvisos,
  type AccionAvisos,
  type EstadoAvisos,
} from "./avisos.ts";

function mostrar(titulo: string, estado: EstadoAvisos): void {
  const lista = estado.avisos.map((aviso) => `${aviso.id}:${aviso.texto}`).join(", ");
  console.log(`${titulo}: [${lista}] siguienteId=${estado.siguienteId}`);
}

const seis: AccionAvisos[] = ["a", "b", "c", "d", "e", "f"].map((letra) => ({
  tipo: "agregado",
  nivel: "exito",
  texto: letra,
}));

const conSeis = seis.reduce(reducirAvisos, estadoInicialAvisos);
mostrar("seis agregados", conSeis);

const sinElTres = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
mostrar("descartado el 3", sinElTres);

const sinNinguno = reducirAvisos(sinElTres, { tipo: "todos-descartados" });
mostrar("todos descartados", sinNinguno);

const otraVez = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
console.log(`la misma acción sobre el mismo estado da lo mismo: ${JSON.stringify(otraVez) === JSON.stringify(sinElTres)}`);
console.log(`el estado de antes sigue intacto: ${conSeis.avisos.length} avisos`);
console.log(`el estado inicial sigue vacío: ${estadoInicialAvisos.avisos.length} avisos`);
