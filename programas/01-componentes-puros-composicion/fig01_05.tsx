import { renderToStaticMarkup } from "react-dom/server";

function ResumenConTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

function ResumenSinTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas > 0 && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

for (const fallas of [2, 0]) {
  console.log(`con ${fallas} fallas:`);
  console.log(`  fallas && …     ${renderToStaticMarkup(<ResumenConTrampa total={4} fallas={fallas} />)}`);
  console.log(`  fallas > 0 && … ${renderToStaticMarkup(<ResumenSinTrampa total={4} fallas={fallas} />)}`);
}
