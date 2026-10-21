// fig06_02.tsx
import { JSDOM } from "jsdom";
import { act, createContext, useContext, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

interface ValorAvisos {
  readonly avisos: readonly string[];
  readonly avisar: (texto: string) => void;
}

// A: un valor por omisión que "funciona" sin proveedor.
const ContextoConOmision = createContext<ValorAvisos>({ avisos: [], avisar: () => {} });

function BandejaA() {
  const { avisos, avisar } = useContext(ContextoConOmision);
  return (
    <button type="button" onClick={() => avisar("pagos se volvió a revisar")}>
      {avisos.length} avisos
    </button>
  );
}

// B: null por omisión y un hook que se niega a seguir sin proveedor.
const ContextoSinOmision = createContext<ValorAvisos | null>(null);

function useAvisos(): ValorAvisos {
  const valor = useContext(ContextoSinOmision);
  if (valor === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }
  return valor;
}

function BandejaB() {
  const { avisos } = useAvisos();
  return <p>{avisos.length} avisos</p>;
}

async function montarSinProveedor(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  try {
    await act(async () => {
      raiz.render(arbol);
    });
  } catch (error: unknown) {
    console.log(`  error al dibujar: ${error instanceof Error ? error.message : String(error)}`);
  }
  console.log(`  en pantalla: "${contenedor.textContent}"`);

  const boton = contenedor.querySelector("button");
  if (boton !== null) {
    await act(async () => {
      boton.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
    console.log(`  después del clic: "${contenedor.textContent}"`);
  }

  await act(async () => {
    raiz.unmount();
  });
}

await montarSinProveedor("A, con valor por omisión:", <BandejaA />);
await montarSinProveedor("B, con el hook que lanza:", <BandejaB />);
dom.window.close();
