// fig06_03.tsx
import { JSDOM } from "jsdom";
import {
  act,
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ComponentType,
  type Dispatch,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Accion = { readonly tipo: "agregado" };
type Despachar = Dispatch<Accion>;

function contar(cuantos: number, accion: Accion): number {
  return accion.tipo === "agregado" ? cuantos + 1 : cuantos;
}

// Un Effect sin lista de dependencias corre después de cada dibujo confirmado:
// sirve para contar sin ensuciar el dibujo mismo.
const dibujos = { bandeja: 0, boton: 0 };

function useContarDibujos(quien: keyof typeof dibujos): void {
  useEffect(() => {
    dibujos[quien] += 1;
  });
}

// Uno: estado y despacho en el mismo valor.
const ContextoJunto = createContext<{ cuantos: number; despachar: Despachar } | null>(null);

function ProveedorJunto({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return <ContextoJunto value={{ cuantos, despachar }}>{children}</ContextoJunto>;
}

function BandejaJunta() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoJunto)?.cuantos} avisos</p>;
}

function BotonJunto() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoJunto)?.despachar;
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

// Dos: un contexto para el estado y otro para el despacho.
const ContextoEstado = createContext<number | null>(null);
const ContextoDespacho = createContext<Despachar | null>(null);

function ProveedorSeparado({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return (
    <ContextoEstado value={cuantos}>
      <ContextoDespacho value={despachar}>{children}</ContextoDespacho>
    </ContextoEstado>
  );
}

function BandejaSeparada() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoEstado)} avisos</p>;
}

function BotonSeparado() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoDespacho);
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

async function tresClics(
  titulo: string,
  Proveedor: ComponentType<{ children: ReactNode }>,
  Bandeja: ComponentType,
  Boton: ComponentType,
): Promise<void> {
  dibujos.bandeja = 0;
  dibujos.boton = 0;
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(
      <Proveedor>
        <Bandeja />
        <Boton />
      </Proveedor>,
    );
  });

  const boton = contenedor.querySelector("button");
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }

  console.log(titulo);
  console.log(`  en pantalla: "${contenedor.querySelector("p")?.textContent}"`);
  console.log(`  dibujos de la bandeja: ${dibujos.bandeja}   dibujos del botón: ${dibujos.boton}`);
  await act(async () => {
    raiz.unmount();
  });
}

await tresClics("un contexto con { cuantos, despachar }:", ProveedorJunto, BandejaJunta, BotonJunto);
await tresClics("dos contextos, estado y despacho:", ProveedorSeparado, BandejaSeparada, BotonSeparado);
dom.window.close();
