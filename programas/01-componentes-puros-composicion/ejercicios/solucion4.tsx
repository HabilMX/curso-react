import { renderToStaticMarkup } from "react-dom/server";

const estados: readonly string[] = [];

console.log(renderToStaticMarkup(<section>{estados.length && <ul />}</section>));
console.log(renderToStaticMarkup(<section>{estados.length > 0 && <ul />}</section>));
