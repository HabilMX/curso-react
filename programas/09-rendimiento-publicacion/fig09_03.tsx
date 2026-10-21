// fig09_03.tsx
import { renderToStaticMarkup } from "react-dom/server";

// Lo que un atacante escribiría como nombre de servicio, si la API se lo dejara pasar.
const nombre = '<img src=x onerror="alert(1)">';
const enlace = "javascript:alert(1)";

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

console.log("1. texto como hijo de JSX:");
console.log(`  ${renderToStaticMarkup(<strong>{nombre}</strong>)}`);

console.log("2. texto en un atributo:");
console.log(`  ${renderToStaticMarkup(<li title={nombre}>pagos</li>)}`);

console.log("3. una URL javascript: en href:");
console.log(`  ${renderToStaticMarkup(<a href={enlace}>pagos</a>)}`);
