# Leçon 1 — Composants purs et composition

*Il est 18 h 50 et la responsable des opérations veut, pour demain à la première heure, une seule ligne au-dessus du panneau : combien de services ont été vérifiés et combien échouent. Cela ressemble à une modification de cinq minutes. Tu ouvres `Panel.tsx` et tu tombes sur un fichier où cohabitent la ligne, la liste, les trois états du chargement et le bouton ; pour ajouter une ligne, tu dois comprendre les quatre choses à la fois. Tu l'ajoutes comme tu peux et tu la testes avec les données habituelles : le résultat semble correct. À 19 h 30, quelqu'un de l'équipe de nuit redémarre l'API avec tous les services opérationnels, et tout au bout de la nouvelle ligne, collé à « revisados », apparaît un `0` que personne n'a écrit : `4 servicios revisados0`. Plus tard, en triant la liste « pour faire joli », la liste conservée par une autre partie du programme se retrouve elle aussi triée, sans que personne ne l'ait demandé. Et lorsqu'un collègue glisse un compteur dans un composant « d'aide » défini à l'intérieur du panneau, le compteur revient à zéro toutes les dix secondes, à chaque mise à jour. Rien de tout cela ne casse la compilation ni le linter. Cette leçon découpe le panneau en pièces compréhensibles séparément et t'enseigne les trois règles qui évitent ces trois sueurs froides.*

**Durée :** 2 × 45 min (la coupure naturelle se trouve entre les sections 1.3 et 1.4)

**Ce que tu construis :** le panneau découpé en pièces que l'on peut comprendre et modifier séparément : une `Tarjeta` qui enveloppe n'importe quel contenu, un résumé des pannes calculé avec des fonctions pures, ainsi que la liste, la ligne et les trois états du chargement dans leurs propres fichiers

**Ce que tu apprends :** render et *commit* ; pureté : mêmes entrées, même sortie ; trois impuretés plantées qu'il faut débusquer ; `children` et composition ; `key` avec un identifiant stable ; le piège du `0` affiché par `&&` ; pourquoi un composant ne se définit jamais à l'intérieur d'un autre

**D'où tu viens.** De la [Leçon 0](00-un-proyecto-de-verdad.md). Ton `revisor` est déjà un projet Vite avec le linter de React activé, `StrictMode` actif, un *proxy* vers le serveur d'entraînement et un `Panel.tsx` qui fait tout : il définit `FilaEstado`, définit `Contenido` avec le `switch` des trois états du chargement, et assemble la page. Il fonctionne et passe le linter. Ce qui lui manque, c'est une structure : c'est un seul fichier avec trois responsabilités. Tu travailles dans le même dossier, `~/curso-react/revisor/`.

**Ce que cette leçon ne fait pas.** Elle n'ajoute pas de nouvel état : pas de filtres, pas de sélection, pas de notes ; cela arrive dans la [Leçon 2](02-estado-instantanea-forma.md). Elle ne touche pas à `useReporte` ni à la frontière réseau : le hook et `cargar.ts` restent identiques. Elle ne modifie pas le serveur d'entraînement, qui reste dans sa première version (`GET /salud` et `GET /api/estados`). Et elle ne fait pas d'optimisations : tu verras que React réappelle tes composants plus souvent que tu ne l'espères, et la réponse de cette leçon n'est pas « mémoïse-le », mais « assure-toi que l'appeler trop souvent ne fasse aucun dégât ». Mesurer et optimiser est le sujet de la [Leçon 9](09-rendimiento-publicacion.md).

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes fixées par le `package.json` du point de contrôle (les mêmes que dans la Leçon 0 : React 19.3.1, Vite 8.3.5, ESLint 10.13.0, `eslint-plugin-react-hooks` 7.1.1). À l'exception de l'avertissement de `fsevents` expliqué à la section 1.7, rien de ce qui est montré ne dépend du système d'exploitation. Lors des exécutions du cours, ce point de contrôle a été réinstallé à partir de zéro dans un conteneur Linux (`node:24.22.0-bookworm`) et a produit le même nom de fichier dans `dist/` que celui présenté ici, `index-Dezp5bTH.js` ; comme ce nom dérive du contenu, les deux machines ont produit le même bundle. Les figures ont été exécutées uniquement sous macOS ; rien n'a été exécuté sur un véritable Linux Mint. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome en mode headless (`--headless --dump-dom`), qui exécute le JavaScript de la page et renvoie le document obtenu. Les figures sont exécutées dans `~/curso-react/figuras/`, le même dossier que dans la Leçon 0, avec le même `package.json` ; les chemins longs affichés par ESLint sont présentés à partir de `~/curso-react`. Les heures du journal du serveur d'entraînement sont en UTC. Les programmes se trouvent dans [`programas/01-componentes-puros-composicion/`](../programas/01-componentes-puros-composicion) : `revisor/` est le point de contrôle et les figures se trouvent à ses côtés.

## À la fin, tu seras capable de

- Distinguer dans une sortie réelle quelle partie relève du *render* (React appelle tes fonctions) et quelle partie relève du *commit* (React touche au DOM), et expliquer pourquoi un render supplémentaire ne modifie pas l'écran.
- Débusquer les trois impuretés d'un composant — modifier quelque chose d'externe, muter une prop, lire l'horloge — et corriger chacune sans changer ce que l'utilisateur voit.
- Découper un gros composant en pièces à responsabilité unique, et écrire un composant recevant `children` pour envelopper un contenu qu'il ne connaît pas.
- Choisir la `key` d'une liste et démontrer par une exécution ce qui arrive à l'état de chaque ligne lorsque la `key` est la position, lorsqu'elle change avec la position et lorsqu'elle est l'identifiant.
- Reconnaître le piège du `0` dans un `&&` et écrire la condition pour qu'il n'affiche jamais un nombre isolé.
- Lire l'erreur `static-components` du linter et expliquer, avec une exécution à l'appui, pourquoi un composant défini à l'intérieur d'un autre perd son état.

## Le pourquoi avant le comment

Ouvre le `Panel.tsx` de la Leçon 0 et compte à combien de questions différentes il répond. À quoi ressemble un service disponible et à quoi ressemble un service en panne ? C'est `FilaEstado`. Qu'affiche-t-on pendant le chargement, si le chargement échoue et lorsqu'il y a des données ? C'est `Contenido`. De quoi la page est-elle entourée, le titre et le bouton ? C'est `Panel`. Trois questions dans un fichier de soixante lignes. Aujourd'hui, cela se lit encore ; le problème, c'est la suite. Dans les prochaines leçons, le panneau va s'enrichir d'un filtre, d'une sélection, de notes, du détail de chaque service, d'avertissements et d'un formulaire. Si tout cela entre dans le même fichier, la responsable des opérations de la scène va demander une ligne et tu vas devoir en lire trois cents.

La réponse évidente est « découpe-le en composants ». Et elle est correcte, mais découper sans comprendre ce qu'est un composant pour React produit des pièces qui se brisent de façons bizarres : le `0` qui apparaît tout seul, la liste qui se trie sans que personne n'y touche, le compteur qui revient à zéro à chaque mise à jour. Ces trois défaillances ont la même racine : **React n'appelle pas tes composants quand tu le crois, ni le nombre de fois que tu le crois.** Il les appelle chaque fois que quelque chose a pu changer, parfois deux fois de suite, et il part du principe que les appeler n'a aucune conséquence. Si un composant respecte ce contrat, tu peux le découper, le déplacer et le réutiliser sans crainte. S'il ne le respecte pas, chaque nouvelle pièce multiplie les surprises.

C'est pourquoi cette leçon ne commence pas par découper des fichiers, mais par trois idées, une par grande section :

1. **Pureté** (1.1 et 1.2). Ce que fait React lorsqu'il « dessine » et pourquoi tes composants doivent être des fonctions pures : mêmes entrées, même sortie, et interdiction formelle de modifier ce qui existait avant de les appeler.
2. **Composition** (1.3). Comment découper un composant par responsabilités et comment un composant peut envelopper un contenu qu'il ne connaît pas, avec `children`.
3. **Identité** (1.4 à 1.6). Comment React sait que la ligne de `pagos` de ce dessin est la même que celle du précédent : la `key`, la position dans l'arbre et la raison pour laquelle un composant ne se définit jamais à l'intérieur d'un autre. Le piège du `0` y trouve aussi sa place, car c'est un cas où « React a dessiné quelque chose auquel tu ne t'attendais pas ».

La section 1.7 effectue le parcours complet : vérifier le point de contrôle et l'observer dans le navigateur. Au final, voici la construction que tu vas obtenir, et tu sauras pourquoi le JavaScript a changé de nom par rapport à la Leçon 0 alors même que le panneau « fait la même chose » :

```text
$ npm run build

> revisor@0.1.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 26 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-BUsPRE_Z.css    0.35 kB │ gzip:  0.22 kB
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

Vingt-six modules au lieu de vingt : ce sont les six nouveaux fichiers de cette leçon. Le panneau affiche la même chose qu'avant, plus une carte avec son en-tête et une ligne de résumé ; la vraie différence ne se voit pas à l'écran, elle se voit quand quelqu'un doit le modifier.

## Les concepts

### 1.1 Render et *commit* : ce que fait React lorsqu'il « dessine »

#### 1.1.1 Trois étapes, pas une

Jusqu'ici, tu disais « React dessine le composant » comme s'il s'agissait d'une seule chose. La documentation de React sépare cela en trois étapes, avec une métaphore de restaurant : quelqu'un **déclenche** la commande, la cuisine la **prépare** et le serveur l'**apporte** à la table. Dans React, elles s'appellent *trigger*, *render* et *commit*, et toute mise à jour de l'écran passe par les trois ([React, « Render and Commit »](https://react.dev/learn/render-and-commit)) :

1. **Déclencher** (*trigger*). Quelque chose demande un dessin : le premier `createRoot(...).render(...)` à l'ouverture de la page, ou un changement d'état, comme le `establecerCarga` de `useReporte` quand la réponse arrive.
2. **Render.** React **appelle tes fonctions de composant**. Il appelle `Panel`, `Panel` renvoie du JSX qui mentionne `Tarjeta`, React appelle `Tarjeta`, et ainsi de suite vers le bas. La documentation précise que le processus est récursif : il continue jusqu'à ce qu'il ne reste plus de composants imbriqués et que React sache exactement ce qui doit être affiché. Le résultat de cette étape n'est pas l'écran ; c'est une description de ce à quoi il devrait ressembler.
3. ***Commit.*** React applique au DOM les différences qu'il a déjà calculées pendant le render, et **ne touche au DOM que là où il y a une différence**. La comparaison entre la nouvelle description et la précédente a lieu pendant qu'il dessine ; lors du *commit*, seuls les changements sont exécutés. Selon les termes de la documentation : React ne modifie les nœuds du DOM que s'il y a une différence entre un render et le suivant, et applique les opérations minimales nécessaires, « calculées pendant le render ».

Après le *commit*, le navigateur repeint l'écran. La documentation nomme cette dernière étape *painting* (peindre) pour ne pas la confondre avec le render de React. Dans ce cours, on utilise la même distinction : le **render** désigne le moment où React appelle tes fonctions ; **peindre** désigne le moment où le navigateur dessine les pixels. En français, « dessiner » un composant a été utilisé jusqu'ici comme synonyme de render, et continue de l'être.

Le render produit un **arbre** : `Panel` en haut, `Tarjeta` en dessous, puis `ContenidoReporte`, et ainsi de suite. La documentation l'appelle l'arbre de render, et précise qu'il est constitué uniquement de composants React ([React, « Understanding Your UI as a Tree »](https://react.dev/learn/understanding-your-ui-as-a-tree)). Cet arbre aura toute son importance en 1.4 et 1.6, quand la question sera de savoir comment React sait qu'un composant de ce render est le même que celui du précédent.

#### 1.1.2 Le voir sur une exécution

La première figure rend cela visible. Une liste de deux lignes affiche une ligne de texte chaque fois que React appelle un composant (render), et un `MutationObserver` — l'API du navigateur qui signale quand quelque chose change dans le DOM — compte combien de modifications le *commit* a effectuées. On dessine trois fois : la première fois, une autre avec les mêmes données, et une troisième avec un nombre différent.

```tsx
// fig01_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly ms: number };

function Fila({ servicio }: { readonly servicio: Servicio }) {
  console.log(`  render: Fila ${servicio.nombre}`);
  return (
    <li>
      {servicio.nombre}: {servicio.ms} ms
    </li>
  );
}

function Lista({ servicios }: { readonly servicios: readonly Servicio[] }) {
  console.log("  render: Lista");
  return (
    <ul>
      {servicios.map((servicio) => (
        <Fila key={servicio.nombre} servicio={servicio} />
      ))}
    </ul>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
let cambios = 0;
const observador = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
observador.observe(contenedor, { childList: true, subtree: true, characterData: true });
const raiz = createRoot(contenedor);

async function dibujar(titulo: string, servicios: readonly Servicio[]): Promise<void> {
  console.log(titulo);
  await act(async () => {
    raiz.render(<Lista servicios={servicios} />);
  });
  cambios += observador.takeRecords().length;
  console.log(`  commit: cambios en el DOM = ${cambios}`);
  cambios = 0;
}

await dibujar("1) primera vez:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("2) mismos datos:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("3) cambia un número:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 97 },
]);
console.log(`DOM final: ${contenedor.innerHTML}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_01.tsx
$ node fig01_01.js
1) primera vez:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
2) mismos datos:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 0
3) cambia un número:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
DOM final: <ul><li>catálogo: 42 ms</li><li>inventario: 97 ms</li></ul>
```

Lis les trois parties posément, car toute la leçon s'appuie dessus :

- **La première fois**, React a appelé les trois composants et le *commit* n'a fait qu'une seule modification : il a inséré l'élément `<ul>` complet, avec ses deux lignes à l'intérieur, en une seule fois.
- **Avec les mêmes données**, React a de nouveau appelé les trois composants — le render s'est déroulé en entier — et le *commit* a fait **zéro** modification. React a comparé, n'a trouvé aucune différence et n'a pas touché au DOM.
- **Avec un nombre différent**, les trois ont été appelés à nouveau, y compris la ligne de `catálogo`, qui n'a pourtant pas changé. Le *commit* n'a fait qu'une seule modification : le texte `118` est devenu `97`. Il n'a remplacé ni la ligne ni la liste ; il a modifié un nœud de texte.

Deux conclusions s'en dégagent, et toutes deux vont à l'encontre de l'intuition. La première : **le fait que React appelle ton composant ne signifie pas que l'écran change.** Un render est une question (« à quoi cela devrait-il ressembler maintenant ? »), pas un ordre de repeindre. La seconde : **React appelle tes composants plus souvent que ce dont tu aurais besoin** : la ligne de `catálogo` a été calculée trois fois, dont deux sans que rien de ce qui la concerne n'ait changé. Ce n'est pas un défaut qu'il faudrait traquer avec `memo` (la Leçon 9 explique quand le faire, et toujours après avoir mesuré) ; cela fait partie de la conception. React peut se permettre d'appeler en trop parce qu'il compte sur une condition : qu'appeler ton composant n'ait aucune conséquence. Cette condition porte un nom.

#### 1.1.3 Pourquoi c'est important pour découper le panneau

Quand le panneau ne formait qu'une seule pièce, chaque render appelait `Panel`, `Contenido` et quatre `FilaEstado`. Maintenant que tu vas le découper, il y aura plus de composants, et chacun sera appelé à chaque render de son parent. Si l'un d'eux « fait quelque chose » lorsqu'on l'appelle — incrémenter un compteur, modifier un tableau, lire l'heure —, ce quelque chose va se répéter autant de fois que React décidera de l'appeler, et tu ne contrôles pas ce nombre. C'est pourquoi la pureté passe avant le découpage : c'est elle qui rend sûr le fait d'avoir de nombreuses pièces.

### 1.2 Pureté : mêmes entrées, même sortie

#### 1.2.1 Les deux conditions

La documentation de React définit un composant pur par deux conditions, empruntées à la définition de fonction pure en mathématiques et en programmation ([React, « Keeping Components Pure »](https://react.dev/learn/keeping-components-pure)) :

- **Il s'occupe de ses affaires.** Il ne modifie aucun objet ni aucune variable qui existait avant qu'on ne l'appelle.
- **Mêmes entrées, même sortie.** Avec les mêmes entrées, il renvoie toujours le même résultat.

Quelles sont les entrées d'un composant ? La même page l'indique : dans React, il y a trois types d'entrées que tu peux lire pendant qu'il dessine, à savoir les props, l'état et le contexte, et toutes trois sont traitées **comme étant en lecture seule**. Aujourd'hui, tu n'utilises que des props ; l'état arrive dans la Leçon 2 et le contexte dans la 6, et la règle sera la même pour les trois. La référence des règles de React le formule avec un mot technique : les composants doivent être **idempotents**, renvoyer toujours la même sortie par rapport à leurs entrées, parce que React peut dessiner un composant plusieurs fois pour offrir la meilleure expérience possible ([React, « Components and Hooks must be pure »](https://react.dev/reference/rules/components-and-hooks-must-be-pure)).

Ce qui est permis, en revanche, c'est de modifier ce que le composant lui-même vient de créer. La documentation appelle cela une **mutation locale** : si à l'intérieur du composant tu crées un nouveau tableau et que tu lui ajoutes des éléments, personne de l'extérieur ne le voit, et l'appel suivant en créera un nouveau. Le problème n'est jamais de muter ; le problème est de muter quelque chose qui **existait déjà** avant l'appel.

#### 1.2.2 Trois impuretés plantées

La deuxième figure comporte un composant avec trois impuretés cachées dans trois lignes consécutives. Avant de lire l'explication, regarde le code et la sortie et essaie de les trouver toi-même. Les indices sont dans la sortie : chacune des lignes 2, 3 et 4 est le symptôme de l'une d'elles.

```tsx
// fig01_02.tsx
import { JSDOM } from "jsdom";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

let revision = 0;

function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
  revision = revision + 1;
  const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const hora = new Date().toISOString().slice(11, 19);

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}

const servicios: Servicio[] = [
  { nombre: "pagos", tipo: "falla" },
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "reportes", tipo: "falla" },
];
const nombres = () => servicios.map((s) => s.nombre).join(", ");

console.log(`1) el arreglo antes de dibujar:   ${nombres()}`);
const raiz = createRoot(dom.window.document.getElementById("raiz")!);
await act(async () => {
  raiz.render(
    <StrictMode>
      <ResumenImpuro servicios={servicios} />
    </StrictMode>,
  );
});
console.log(`2) el arreglo después de dibujar: ${nombres()}`);
console.log(`3) se montó una vez y el contador dice: ${revision}`);

const horaDe = (html: string) => /a las (\d\d:\d\d:\d\d)/.exec(html)?.[1];
const primera = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
await new Promise((listo) => setTimeout(listo, 1100));
const segunda = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
console.log(`4) mismas props, ¿misma hora en los dos dibujos? ${horaDe(primera) === horaDe(segunda) ? "sí" : "no"}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_02.tsx
$ node fig01_02.js
1) el arreglo antes de dibujar:   pagos, catálogo, reportes
2) el arreglo después de dibujar: catálogo, pagos, reportes
3) se montó una vez y el contador dice: 2
4) mismas props, ¿misma hora en los dos dibujos? no
```

`renderToStaticMarkup` est une fonction de `react-dom/server` qui dessine un arbre et renvoie le HTML sous forme de texte, sans navigateur ni DOM ; elle sert ici à dessiner le même composant deux fois, à une seconde d'intervalle, et à comparer. Si tu as déjà trouvé les trois, compare avec la liste. Sinon, relis les trois premières lignes du corps de `ResumenImpuro` avant de continuer.

**Impureté 1 : elle modifie une variable externe.** `revision = revision + 1` modifie une variable qui existait avant l'appel au composant. Le symptôme est la ligne 3 : il a été monté **une** fois et le compteur indique **2**. Pourquoi ? Parce que `StrictMode`, en développement, appelle chaque composant deux fois précisément pour démasquer cela ; la documentation le formule ainsi : en appelant deux fois les fonctions de composant, `StrictMode` aide à trouver les composants qui enfreignent ces règles ([React, « Keeping Components Pure »](https://react.dev/learn/keeping-components-pure)). Dans la Leçon 0, tu as vu le cycle supplémentaire des effets ; en voici le jumeau, le render supplémentaire. En production, il n'y aurait pas de double appel, mais tu ne serais pas sauvé pour autant : React peut appeler le composant chaque fois que son parent est dessiné, et le nombre cesserait de signifier « révisions » pour signifier « nombre de fois où cela convenait à React de m'appeler ».

**Impureté 2 : elle mute une prop.** `servicios.sort(...)` donne l'impression de « calculer une version triée », mais `sort` trie le tableau **sur place** et renvoie le même tableau ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). Le symptôme est la ligne 2 : le tableau qui appartenait à celui qui a appelé le composant s'est retrouvé réordonné. C'est la deuxième frayeur de la scène, la liste qui s'est triée toute seule. Les props sont, selon les termes de la documentation, des photographies immuables d'un instant : on ne les modifie pas ([React, « Passing Props to a Component »](https://react.dev/learn/passing-props-to-a-component)).

**Impureté 3 : elle lit l'horloge.** `new Date()` renvoie quelque chose de différent à chaque appel, même si les props sont identiques. Le symptôme est la ligne 4 : mêmes props, deux dessins, deux heures différentes. La référence de React utilise ce même exemple : `new Date()` n'est pas idempotent, car il renvoie la date actuelle et change à chaque appel ; il en va de même pour `Math.random()` ([React, « Components and Hooks must be pure »](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). Avec une horloge dans le render, la sortie dépend du **moment** où React a décidé d'appeler le composant, ce que tu ne contrôles pas.

#### 1.2.3 Qui t'avertit de chacune ?

La question pratique est de savoir lequel de tes outils attrape chaque impureté avant qu'elle n'atteigne l'utilisateur. On a mesuré cela avec les trois outils du cours, et le résultat n'est pas celui auquel on s'attendrait.

**Le linter attrape la première.** Voici ce que dit ESLint sur la figure :

```text
$ npx eslint fig01_02.tsx

~/curso-react/figuras/fig01_02.tsx
  19:3  error  Error: Cannot reassign variables declared outside of the component/hook

Variable `revision` is declared outside of the component/hook. Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render).

~/curso-react/figuras/fig01_02.tsx:19:3
  17 |
  18 | function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
> 19 |   revision = revision + 1;
     |   ^^^^^^^^ `revision` cannot be reassigned
  20 |   const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  21 |   const hora = new Date().toISOString().slice(11, 19);
  22 |  react-hooks/globals

✖ 1 problem (1 error, 0 warnings)
```

C'est la règle `globals`, l'une des quatorze qui viennent du React Compiler et que la Leçon 0 a activées : elle vérifie qu'aucune variable globale n'est assignée ni mutée pendant le render ([React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals)). Le message propose même les deux issues : si la valeur sert à dessiner, qu'elle devienne un état ; sinon, qu'elle soit mise à jour dans un effet.

**Les deux autres, le linter ne les a pas vues.** On l'a vérifié en supprimant la ligne de `revision` dans une copie et en relançant ESLint : le seul avertissement restant était `prefer-const` (parce que `revision` n'était plus réassignée), rien venant de React. Ni le `sort` sur la prop ni le `new Date()` n'ont produit d'erreur. Ce second point mérite un commentaire : la page de la règle `purity` mentionne `new Date()` parmi ses exemples ([React, lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity)), mais dans la version 7.1.1 du paquet, mesurée ce jour-là, la règle se déclenche avec `Date.now()` et non avec `new Date()`. En remplaçant dans la copie `new Date()` par `new Date(Date.now())`, `Error: Cannot call impure function during render` est apparu, avec la règle `react-hooks/purity`. La page elle-même présente sa liste comme des « exemples habituels » (*usual examples*, avec `Date.now()` et `new Date()` sur la même ligne), et non comme un inventaire exhaustif de ce que la version installée détecte. La leçon pratique : **le linter est un filet, pas un mur.** Il attrape beaucoup de choses, et ce qu'il n'attrape pas reste sous ta responsabilité.

**TypeScript attrape la deuxième, si tu le lui demandes.** Regarde le type de la prop : `Servicio[]`, sans `readonly`. On l'a écrit ainsi exprès, pour que la figure compile. Si tu changes le type en `readonly Servicio[]`, qui est la façon dont `contrato.ts` du `revisor` déclare ses listes depuis la Leçon 0 (`readonly estados: readonly EstadoPublico[]`), la compilation s'arrête :

```text
fig01_02.tsx(20,31): error TS2339: Property 'sort' does not exist on type 'readonly Servicio[]'.
```

Un tableau `readonly` en TypeScript n'a pas les méthodes qui mutent : ni `sort`, ni `push`, ni `splice`. Ce mot qui avait l'air décoratif dans `contrato.ts` est, en réalité, la défense contre la deuxième impureté. Les trois erreurs de type qui l'accompagnent dans cette exécution (`TS7006`, paramètres avec un type `any` implicite) sont une conséquence de la première : comme `sort` n'existe pas, TypeScript ne sait plus quel type ont `a` et `b`, ni le résultat `ordenados`, et par conséquent le `s` du `map` de la ligne 25 non plus.

**`StrictMode` attrape celles qui changent quelque chose à chaque appel.** Le compteur qui indique 2 a été démasqué par `StrictMode`. Dans une vraie application, tu verrais cela sous la forme « la révision saute de deux en deux en développement », et cette bizarrerie est la piste.

Résumé de la défense : **le linter** pour ce qui se voit dans le texte du code, **TypeScript avec `readonly`** pour les mutations de données que tu reçois, **`StrictMode`** pour les effets qui se répètent, et **tes yeux** pour le reste. Aucun ne suffit à lui seul. L'exercice 1 te demande de corriger les trois.

#### 1.2.4 Où va ce qui est impur

Si un composant ne peut ni lire l'horloge ni rien modifier, où fait-on ces choses-là ? La documentation de React répond avec un ordre de préférence : les effets de bord vont normalement dans **les gestionnaires d'événements** (le `onClick` d'un bouton, par exemple), que React n'appelle pas pendant le render ; et s'il n'y a aucun événement correspondant, en dernier recours, dans un `useEffect` ([React, « Keeping Components Pure »](https://react.dev/learn/keeping-components-pure)). Ton panneau fait déjà les choses correctement : la requête vers l'API vit dans l'effet de `useReporte`, parce qu'il s'agit de se synchroniser avec quelque chose d'extérieur, et le `establecerCarga({ tipo: "cargando" })` de « Actualizar » vit dans `recargar`, qui s'exécute lors d'un clic. La Leçon 3 revient en détail sur les effets.

Et ce qui peut être **calculé** à partir des props n'est pas un effet de bord : c'est précisément ce qu'un composant pur fait. Compter combien de services échouent est un calcul. C'est pourquoi le premier nouveau fichier du point de contrôle n'est pas un composant, mais deux fonctions pures :

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}
```

Toutes deux respectent les deux conditions. `contarFallas` reçoit une liste `readonly`, de sorte qu'elle ne pourrait pas la muter même si elle le voulait, et `filter` renvoie un nouveau tableau (une mutation locale que personne ne voit). `textoFallas` gère le singulier, car « 1 servicios con falla » se lirait mal. Aucune des deux ne sait quoi que ce soit de React, du JSX ou du DOM, et c'est pourquoi on peut les tester avec un simple `console.log` ou, dans la Leçon 8, avec un test de trois lignes, sans rien monter. **Séparer le calcul de la présentation** est le premier mouvement de cette leçon : ce qui relève du calcul va dans une fonction pure dans un fichier `.ts` ; ce qui relève de la présentation va dans un composant qui l'appelle.

### 1.3 Composition : découper le panneau par responsabilités

#### 1.3.1 Quand découper et par où

La documentation de React, dans son guide pour concevoir une interface, propose de découper avec les mêmes techniques que celles utilisées pour décider d'écrire une nouvelle fonction ; l'une d'elles est la séparation des responsabilités : un composant ne devrait idéalement s'occuper que d'une seule chose, et s'il grandit, il se décompose en sous-composants plus petits ([React, « Thinking in React »](https://react.dev/learn/thinking-in-react)). Appliqué au `Panel.tsx` de la Leçon 0, les responsabilités étaient déjà sous les yeux ; elles cohabitaient simplement dans un même fichier. Le point de contrôle les sépare ainsi, de bas en haut :

| Fichier | Question à laquelle il répond | Ce qu'il reçoit |
|---|---|---|
| `FilaEstado.tsx` | À quoi ressemble **un** service ? | un `EstadoPublico` |
| `ListaEstados.tsx` | À quoi ressemble la **liste** des services ? | la liste |
| `ResumenFallas.tsx` | Que dit la ligne de **résumé** ? | la liste |
| `ContenidoReporte.tsx` | Qu'affiche-t-on selon le **chargement** : attente, erreur ou données ? | une `Carga` |
| `Tarjeta.tsx` | À quoi ressemble une **boîte avec un titre**, quel que soit son contenu ? | un titre et `children` |
| `Panel.tsx` | Comment la page est-elle **assemblée** ? | `cargar` et `cadaMs` |

Regarde bien la colonne « Ce qu'il reçoit » : chaque pièce ne reçoit que ce dont elle a besoin. `FilaEstado` ignore qu'un chargement existe ; `ListaEstados` ignore qu'il y a un bouton ; `ResumenFallas` ignore comment le rapport est demandé. Cette ignorance est ce qui a de la valeur : si demain tu modifies l'apparence d'une ligne, tu ouvres un fichier de dix-huit lignes et tu n'as rien d'autre à comprendre.

Les deux premiers sortent de l'ancien `Panel.tsx` presque sans retouche. `FilaEstado` est identique à celle de la Leçon 0, désormais exportée depuis son propre fichier :

```tsx
// revisor/src/reporte/FilaEstado.tsx
import type { EstadoPublico } from "../compartido/contrato";

export function FilaEstado({ estado }: { readonly estado: EstadoPublico }) {
  if (estado.tipo === "disponible") {
    return (
      <li className="disponible">
        <strong>{estado.nombre}</strong>: disponible (HTTP {estado.codigoHttp}, {estado.duracionMs}{" "}
        ms)
      </li>
    );
  }

  return (
    <li className="falla">
      <strong>{estado.nombre}</strong>: falla ({estado.detalle})
    </li>
  );
}
```

`ListaEstados` est le `<ul>` avec son `map`, qui vivait auparavant dans le `case "listo"`. Elle comporte une modification par rapport à la Leçon 0, au niveau de la `key`, que la section 1.4 explique avec une exécution à l'appui :

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado key={estado.nombre} estado={estado} />
      ))}
    </ul>
  );
}
```

Le résumé est nouveau, et c'est la ligne que demandait la responsable des opérations. Il utilise les deux fonctions pures de 1.2.4 et intègre, déjà résolu, le piège du `0` expliqué en 1.5 :

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {estados.length} servicios revisados
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

Un détail de JSX qui explique pourquoi le texte sort collé comme il le doit : le saut de ligne et l'indentation entre `servicios revisados` et l'accolade `{fallas > 0 && …}` **ne produisent pas** d'espace sur la page, car JSX écarte les espaces blancs qui incluent un saut de ligne. C'est pourquoi le séparateur `·` porte son espace à l'intérieur du `<strong>` : `<strong> · …</strong>`. Si tu enlevais cet espace, tu verrais à l'écran `revisados· 2 servicios`.

`ContenidoReporte` est l'ancien `Contenido`, avec son nom complet et le `case "listo"` transformé en deux pièces. Les `<>` et `</>` forment un **fragment** : une manière de renvoyer deux éléments frères sans les envelopper dans un `<div>` dépourvu de sens :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { ListaEstados } from "./ListaEstados";
import { ResumenFallas } from "./ResumenFallas";
import type { Carga } from "./useReporte";

export function ContenidoReporte({ carga }: { readonly carga: Carga }) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo":
      return (
        <>
          <ResumenFallas estados={carga.reporte.estados} />
          <ListaEstados estados={carga.reporte.estados} />
        </>
      );
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Le `default` avec `never` est le même que dans la Leçon 0, et il reste pour la même raison : si demain quelqu'un ajoute un quatrième type à `Carga` (la Leçon 4 ajoute l'état vide, bien que d'une autre manière), TypeScript signale ce `switch` comme incomplet. Remarque aussi ce qui n'a **pas** été fait : `ResumenFallas` et `ListaEstados` reçoivent la même liste et chacun en fait son affaire. Aucun ne la stocke, aucun ne la copie dans un état, aucun ne la modifie. Tous deux sont purs, et c'est pourquoi partager la même liste est sans danger.

#### 1.3.2 `children` : le trou que remplit le parent

Il manque la pièce la plus instructive. La responsable des opérations souhaite que le rapport se présente sous la forme d'une carte : un encadré avec un titre. Et l'on devine sans peine que, dès qu'elle existera, quelqu'un voudra une autre carte identique pour le détail d'un service, une autre pour les alertes et une autre pour le formulaire. Tu pourrais écrire `TarjetaReporte`, `TarjetaDetalle` et `TarjetaAvisos`, trois composants presque identiques. Ou tu peux écrire **une seule** carte qui ne sait pas ce qu'elle contient.

React résout cela avec une prop spéciale. Lorsque tu imbriques du contenu à l'intérieur d'une balise JSX, le composant parent reçoit ce contenu dans une prop appelée `children`. La documentation propose de l'imaginer ainsi : un composant doté de `children` possède un « trou » que les composants qui l'utilisent peuvent remplir avec le JSX qu'ils souhaitent, et il n'a pas besoin de savoir ce qui est dessiné à l'intérieur ([React, « Passing Props to a Component »](https://react.dev/learn/passing-props-to-a-component)). C'est cela, la **composition** : assembler de grandes pièces en combinant des pièces qui ne se connaissent pas entre elles.

```tsx
// revisor/src/compartido/Tarjeta.tsx
import type { ReactNode } from "react";

export function Tarjeta({
  titulo,
  children,
}: {
  readonly titulo: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="tarjeta" aria-label={titulo}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
```

Trois décisions dans ce fichier :

- **Il vit dans `src/compartido/`, pas dans `src/reporte/`.** Il ne sait rien du rapport. C'est la première pièce de l'application pensée pour plusieurs fonctionnalités, et le dossier l'affiche clairement. C'est le principe d'organisation des dossiers par fonctionnalité de la Leçon 0 : ce qui ne sert qu'à une seule fonctionnalité vit avec elle ; ce qui sert à plusieurs vit dans `compartido/`.
- **`children` a pour type `ReactNode`.** C'est le type exporté par React pour désigner « tout ce qui peut être dessiné » : un élément JSX, un texte, un nombre, une liste d'éléments, `null`. La carte accepte ainsi tout ce que tu y mets et TypeScript t'avertit si tu lui passes quelque chose que React ne sait pas dessiner, comme un objet brut.
- **Il utilise `<section>` avec un nom accessible.** Un `<section>` ordinaire n'a aucune signification particulière pour un lecteur d'écran. Mais, d'après MDN, un `<section>` communique le rôle `region` (une zone nommée vers laquelle l'utilisateur peut naviguer directement) lorsqu'il possède un nom accessible ([MDN, rôle `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role)). Ici, le nom lui est conféré par `aria-label={titulo}`. MDN préfère, lorsqu'il y a un en-tête visible, utiliser `aria-labelledby` pointant vers l'en-tête plutôt que de répéter le texte ; le point de contrôle utilise `aria-label` par simplicité : le texte est identique à celui du `<h2>`, et la méthode préférée de MDN, `aria-labelledby`, demande un `id` unique par carte, que l'on génère dans React avec `useId`, un hook que le cours n'a pas encore présenté. C'est un choix pédagogique du cours, pas une règle absolue : les deux manières produisent le même nom. L'accessibilité, comme le mentionne le plan du cours, est une habitude que l'on enseigne là où elle apparaît ; la Leçon 8 interroge la page par rôle et par nom, et cette région fait partie de ce qu'elle trouve.

Et `Panel` devient ainsi, sans aucune logique de présentation propre :

```tsx
// revisor/src/reporte/Panel.tsx
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import "./panel.css";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <ContenidoReporte carga={carga} />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Lis le JSX de `Panel` comme une phrase : « la page comporte un titre et une carte intitulée Estado de los servicios, qui contient le contenu du rapport et un bouton ». Ce qui se trouve entre `<Tarjeta>` et `</Tarjeta>` — le contenu et le bouton — est exactement ce que `Tarjeta` reçoit comme `children` et place sous son `<h2>`. `Tarjeta` ignore qu'il y a un bouton ou qu'un chargement existe ; `Panel` ignore que la carte utilise un `<section>`. Si demain la carte change de style, tu modifies un seul fichier et toutes les cartes en héritent.

Il y a un effet moins visible et très utile : le bouton **voyage avec l'état qui le contrôle**. `recargar` provient de `useReporte`, qui vit dans `Panel` ; le bouton se trouve dans le JSX de `Panel`. `Tarjeta` le dessine, mais ne le connaît pas. Si au lieu de `children` tu avais passé `recargar` comme prop à `Tarjeta` pour qu'elle dessine le bouton, la carte cesserait d'être générique : elle aurait connaissance des rechargements. `children` permet à chaque pièce de ne connaître que ses propres affaires, et la Leçon 6 y reviendra lorsqu'on se demandera si un contexte est nécessaire : bien souvent, la réponse est « non, `children` suffit ».

La feuille de styles s'enrichit de deux règles, une pour la carte et une autre pour mettre en valeur le nombre de pannes :

```css revisor/src/reporte/panel.css
body {
  font-family: system-ui, sans-serif;
  margin: 2rem auto;
  max-width: 40rem;
  padding: 0 1rem;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  border-left: 0.5rem solid #888;
  margin: 0.5rem 0;
  padding: 0.5rem 0.75rem;
}

li.disponible {
  border-color: #1a7f37;
}

li.falla {
  border-color: #cf222e;
}

.tarjeta {
  border: 1px solid #d0d7de;
  border-radius: 0.5rem;
  padding: 0 1rem 1rem;
}

.resumen strong {
  color: #cf222e;
}
```

La règle `.tarjeta` réside dans la feuille du rapport bien que `Tarjeta` soit dans `compartido/`. Le cours utilise **une seule feuille de styles** qui grandit de leçon en leçon ; c'est une simplification délibérée pour éviter de traquer les styles entre plusieurs fichiers. Quand un projet grandit pour de vrai, chaque composant partagé apporte généralement sa propre feuille ; ici, ce n'est pas encore nécessaire.

`useReporte.ts`, `cargar.ts`, `main.tsx`, le contrat, la configuration et le serveur d'entraînement ne changent pas. Dans `package.json`, seul le numéro de version change, passant de `0.0.0` à `0.1.0` : le cours utilise `0.N.0` dans le point de contrôle de la leçon N.

### 1.4 `key` : comment React sait qu'une ligne est la même

#### 1.4.1 Le problème résolu

Reviens à la figure 1. Lors du troisième dessin, React a modifié un texte et n'a pas remplacé la ligne. Comment a-t-il su que la ligne de `inventario` du troisième dessin était **la même** que celle du deuxième, et qu'il suffisait de modifier son numéro ? Avec une liste qui apporte toujours les mêmes éléments dans le même ordre, il pourrait utiliser la position. Mais les listes changent : un nouveau service apparaît en haut, un autre disparaît, l'ordre change. Pour apparier les éléments d'une liste entre un render et le suivant, React utilise la `key`.

La documentation pose deux règles ([React, « Rendering Lists »](https://react.dev/learn/rendering-lists)) :

- **Les `key` sont uniques entre frères.** Deux éléments d'une même liste ne peuvent pas la partager (dans des listes différentes, elles peuvent se répéter).
- **Les `key` ne doivent pas changer**, sinon leur raison d'être disparaît ; c'est pourquoi on ne les génère pas pendant le render.

Et elle clarifie un détail qui porte à confusion : ton composant **ne reçoit pas** `key` comme prop. C'est un indice destiné à React ; si `FilaEstado` avait besoin du nom, tu le lui passerais séparément (ici il l'a déjà, à l'intérieur de `estado`).

#### 1.4.2 Trois `key` pour la même liste

Dans la Leçon 0, la ligne portait `` key={`${posicion}-${estado.nombre}`} ``. Cela fonctionnait et il n'y avait pas de doublons. Pourquoi en changer ? La figure 3 y répond en mesurant. Une liste de quatre services en reçoit un cinquième, `correo`, **au tout début**, et l'on teste trois formes de `key`. Chaque ligne conserve dans son état le nom avec lequel elle est née — un `useState` avec une valeur initiale, expliqué en détail dans la Leçon 2 ; ici, il suffit de savoir que React le conserve tant que la ligne reste « la même » — et affiche un avertissement si c'est désormais un autre nom qu'elle doit dessiner. De plus, on compte combien de `<li>` du DOM sont nouveaux après le changement.

```tsx
// fig01_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Fila({ nombre }: { readonly nombre: string }) {
  const [nacio] = useState(nombre);

  return <li>{nombre === nacio ? nombre : `${nombre} (nació como ${nacio})`}</li>;
}

type Llave = (nombre: string, posicion: number) => string;

function Lista({ nombres, llave }: { readonly nombres: readonly string[]; readonly llave: Llave }) {
  return (
    <ul>
      {nombres.map((nombre, posicion) => (
        <Fila key={llave(nombre, posicion)} nombre={nombre} />
      ))}
    </ul>
  );
}

const antes = ["catálogo", "pagos", "inventario", "reportes"];
const despues = ["correo", ...antes];

const estrategias: readonly (readonly [string, Llave])[] = [
  ["key={posicion}", (_nombre, posicion) => String(posicion)],
  ["key={`${posicion}-${nombre}`}", (nombre, posicion) => `${posicion}-${nombre}`],
  ["key={nombre}", (nombre) => nombre],
];

for (const [titulo, llave] of estrategias) {
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Lista nombres={antes} llave={llave} />);
  });
  const viejos = new Set(contenedor.querySelectorAll("li"));
  await act(async () => {
    raiz.render(<Lista nombres={despues} llave={llave} />);
  });
  const filas = [...contenedor.querySelectorAll("li")];
  const nuevos = filas.filter((li) => !viejos.has(li));
  console.log(titulo);
  console.log(`  filas creadas desde cero: ${nuevos.length} de ${filas.length}`);
  console.log(`  ${filas.map((li) => li.textContent).join(" | ")}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_03.tsx
$ node fig01_03.js
key={posicion}
  filas creadas desde cero: 1 de 5
  correo (nació como catálogo) | catálogo (nació como pagos) | pagos (nació como inventario) | inventario (nació como reportes) | reportes
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 5 de 5
  correo | catálogo | pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 1 de 5
  correo | catálogo | pagos | inventario | reportes
```

Trois résultats, trois leçons :

- **`key={posicion}` : la mauvaise identité.** React a apparié par position : la ligne qui occupait l'emplacement 0 (celle de `catálogo`) reçoit désormais `correo`, celle de l'emplacement 1 (celle de `pagos`) reçoit `catálogo`, et ainsi de suite. Il n'a créé qu'une seule nouvelle ligne, la dernière. Le DOM s'est retrouvé avec les bons textes, mais **l'état de chaque ligne est resté à sa place pendant que les données se sont décalées** : la ligne qui affiche `correo` est, pour React, celle qui est née en tant que `catálogo`. Si la ligne de `pagos` stockait dans son propre état quelque chose que l'utilisateur avait saisi, ce texte apparaîtrait maintenant à côté de `catálogo`. La documentation met en garde : utiliser la position comme `key` (ce que fait React si tu n'en fournis aucune) mène couramment à des bugs subtils et déroutants lorsque des éléments sont insérés, supprimés ou réordonnés ([React, « Rendering Lists »](https://react.dev/learn/rendering-lists)).
- **`` key={`${posicion}-${nombre}`} `` : l'identité perdue.** La `key` de la Leçon 0. Elle ne confond jamais une ligne avec une autre, car elle inclut le nom. Mais elle inclut aussi la position, et en insérant `correo` en tête, **toutes** les positions ont changé : `0-catálogo` est devenu `1-catálogo`, une `key` que React n'avait jamais vue. Résultat : cinq lignes créées à partir de zéro sur cinq, et les quatre anciennes détruites avec tout leur état. C'est le même défaut que celui souligné par la documentation pour `key={Math.random()}`, à un degré moindre : les `key` ne coïncident pas d'un render à l'autre et les composants ainsi que le DOM sont recréés. Dans le `revisor`, cela ne se remarque pas car `FilaEstado` ne conserve pas d'état propre, et la Leçon 2 le maintient ainsi délibérément : les notes vivront dans `Panel` et la marque « avec note » de chaque ligne sera calculée à partir d'elles, de sorte que recréer une ligne n'efface rien. Mais le coût de traitement reste là (cinq lignes détruites et recréées alors qu'il suffisait d'en créer une), et le jour où une ligne stockera effectivement quelque chose dans son propre état, comme un champ de texte en cours de saisie, ce contenu serait perdu sur toutes les lignes. Une `key` stable est celle qui ne dépend pas du fait que quelqu'un se souvienne de cette condition.
- **`key={nombre}` : l'identité correcte.** Une seule nouvelle ligne, celle de `correo`, et les quatre habituelles conservées, chacune avec son propre état. C'est la `key` du point de contrôle.

#### 1.4.3 Pourquoi le nom est une `key` sûre

La documentation recommande d'extraire la `key` des données : si elles viennent d'une base de données, leurs identifiants sont uniques par nature ([React, « Rendering Lists »](https://react.dev/learn/rendering-lists)). Le contrat de l'API, dans `contrato.ts`, ne comporte pas d'identifiant numérique ; il comporte le nom du service. Est-il unique ? Il l'est parce que l'API le garantit : le nom constitue l'identité du service dans tout le système (l'URL du détail, à partir de la Leçon 3, est `/api/servicios/:nombre`), et à partir de la Leçon 4, lorsque le serveur d'entraînement acceptera des ajouts, tenter d'ajouter un nom qui existe déjà renvoie `409` avec `ya existe un servicio llamado X`. L'écran peut se reposer sur cette garantie parce que l'API la fait respecter ; ce n'est pas l'écran qui l'invente.

Et si l'API commettait une erreur et envoyait deux services avec le même nom ? React t'avertit en développement. La figure 4 provoque les deux avertissements de `key` que tu verras dans la console du navigateur : la liste sans `key` et la `key` répétée. Les messages de React sortent via `console.error` ; la figure les intercepte pour les afficher avec un préfixe.

```tsx
// fig01_04.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { format } from "node:util";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

console.error = (...partes: unknown[]) => {
  const mensaje = format(...partes);
  console.log(`  console.error: ${mensaje}`);
};

function SinLlave({ nombres }: { readonly nombres: readonly string[] }) {
  return <ul>{nombres.map((nombre) => <li>{nombre}</li>)}</ul>;
}

function LlaveRepetida({ nombres }: { readonly nombres: readonly string[] }) {
  return (
    <ul>
      {nombres.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

for (const [titulo, arbol] of [
  ["sin key:", <SinLlave nombres={["catálogo", "pagos"]} />],
  ["dos servicios con el mismo nombre:", <LlaveRepetida nombres={["pagos", "pagos"]} />],
] as const) {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));
  await act(async () => {
    raiz.render(arbol);
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_04.tsx
$ node fig01_04.js
sin key:
  console.error: Each child in a list should have a unique "key" prop.

Check the render method of `SinLlave`. See https://react.dev/link/warning-keys for more information.
dos servicios con el mismo nombre:
  console.error: Encountered two children with the same key, `pagos`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Le premier avertissement indique « chaque enfant d'une liste doit posséder une prop `key` unique » et te pointe le composant fautif : « vérifie la méthode de render de `SinLlave` ». Le second indique « deux enfants ont été trouvés avec la même `key`, `pagos` », et avertit qu'avec des `key` dupliquées, React risque de dupliquer ou d'omettre des éléments, et que ce comportement n'est pas pris en charge. Un fait mesuré, bon à savoir : **ni TypeScript ni le linter du cours ne détectent la `key` manquante.** `npx eslint fig01_04.tsx` se termine sans aucun avertissement, car `eslint-plugin-react-hooks` vérifie les règles des hooks et du compilateur, pas celles des listes. L'avertissement n'apparaît qu'à l'exécution, dans la console, et seulement en développement. C'est pourquoi il ne faut jamais ignorer la console du navigateur : un `console.error` de React est une anomalie, même si la page semble s'afficher correctement.

### 1.5 Le piège du `0`

C'est le défaut le plus célèbre de JSX et le plus facile à éviter dès qu'on le comprend. L'opérateur `&&` de JavaScript ne renvoie pas `true` ou `false` : il renvoie **la première valeur qui tranche**. `a && b` renvoie `a` si `a` est « faux » (`false`, `0`, `""`, `null`, `undefined`), et `b` dans le cas contraire. Avec un booléen à gauche, `false && <strong>…</strong>` renvoie `false`, et React ne dessine rien pour `false`. Avec un nombre à gauche, `0 && <strong>…</strong>` renvoie `0`… et React, lui, **dessine bel et bien les nombres**. La documentation en fait un avertissement explicite : ne place pas de nombres du côté gauche de `&&`, car si le côté gauche vaut `0`, toute l'expression vaut `0` et React dessinera `0` au lieu de ne rien afficher ([React, « Conditional Rendering »](https://react.dev/learn/conditional-rendering)).

La figure 5 le montre avec le résumé du panneau, dans deux versions qui ne diffèrent que d'une seule ligne :

```tsx
// fig01_05.tsx
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
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_05.tsx
$ node fig01_05.js
con 2 fallas:
  fallas && …     <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
  fallas > 0 && … <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
con 0 fallas:
  fallas && …     <p class="resumen">4 servicios revisados0</p>
  fallas > 0 && … <p class="resumen">4 servicios revisados</p>
```

Avec deux pannes, les deux versions sont identiques : c'est pourquoi le piège survit aux tests manuels avec les données habituelles, dans lesquelles `pagos` et `reportes` échouent. Avec zéro panne, la première affiche `4 servicios revisados0` : le `0` qui est apparu dans la scène lorsque l'équipe de nuit a redémarré l'API avec tous les services opérationnels. La seconde n'affiche rien de trop.

La correction est celle que propose la documentation : **fais en sorte que le côté gauche soit un booléen.** `fallas > 0` vaut `true` ou `false`, jamais un nombre. C'est exactement ce que fait `ResumenFallas` dans le point de contrôle. D'autres formes qui fonctionnent : `Boolean(fallas) && …`, `!!fallas && …` ou un ternaire, `fallas > 0 ? <strong>…</strong> : null`. Le cours utilise la comparaison parce qu'elle se lit selon ce qu'elle signifie : « s'il y a des pannes ». Ici non plus, il n'y a pas de filet : TypeScript accepte `fallas && …` sans protester (un `number` est un enfant JSX valide) et le linter du cours ne le signale pas non plus ; on l'a vérifié en exécutant `npx eslint fig01_05.tsx`, qui se termine sans avertissement. La défense réside dans l'habitude : **à gauche de `&&`, toujours un booléen.** Dans la Leçon 8, un test du cours place délibérément `fallas &&` et vérifie que le texte ressort avec le `0` collé ; c'est le test qui passe au rouge dès que l'on annule le correctif.

### 1.6 Jamais un composant à l'intérieur d'un autre

#### 1.6.1 La tentation

Lorsque tu découpes un composant, une tentation naturelle surgit : définir la petite pièce **à l'intérieur** de la grande, afin qu'elle ait sous la main les variables du parent sans avoir à les lui passer sous forme de props. Quelque chose comme ceci, dans `Panel` :

```tsx
// Extrait : ce qu'on ne fait PAS
export function Panel({ cargar, cadaMs = 10_000 }: { readonly cargar: Cargar; readonly cadaMs?: number }) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  function BotonActualizar() {
    return <button type="button" onClick={recargar}>Actualizar</button>;
  }

  // ...
}
```

Cela semble pratique : `BotonActualizar` voit `recargar` sans que personne ne la lui passe. La documentation l'interdit sans détour : les composants peuvent dessiner d'autres composants, mais on **n'imbrique jamais** leurs définitions ; chaque composant se définit au niveau supérieur du fichier, et si l'enfant a besoin de données du parent, on les lui transmet par des props ([React, « Your First Component »](https://react.dev/learn/your-first-component)).

#### 1.6.2 Pourquoi : l'identité à nouveau

La raison est la même que pour la `key`. Pour décider si un composant de ce render est le même que celui du précédent, React regarde **sa position dans l'arbre et son type**. Le type de `<BotonActualizar />` est la fonction `BotonActualizar`. Si cette fonction est définie à l'intérieur de `Panel`, **chaque render de `Panel` crée une nouvelle fonction** : le même code, mais un objet différent. Pour React, c'est un autre type de composant. Il détruit donc l'ancien, avec son état et ses nœuds du DOM, et en monte un nouveau. La documentation l'explique à travers l'état : React préserve l'état tant que le même composant est dessiné à la même position, et l'état disparaît parce qu'à chaque render, une fonction différente est créée ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)).

La figure 6 le mesure. Deux panneaux identiques ; dans l'un, le compteur de clics est défini à l'extérieur, et dans l'autre, à l'intérieur. On clique deux fois sur le compteur, puis le parent est mis à jour :

```tsx
// fig01_06.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ContadorDeFuera() {
  const [clics, establecerClics] = useState(0);
  return (
    <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
      clics: {clics}
    </button>
  );
}

function PanelBien() {
  const [vueltas, establecerVueltas] = useState(0);
  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeFuera />
    </section>
  );
}

function PanelMal() {
  const [vueltas, establecerVueltas] = useState(0);

  function ContadorDeDentro() {
    const [clics, establecerClics] = useState(0);
    return (
      <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
        clics: {clics}
      </button>
    );
  }

  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeDentro />
    </section>
  );
}

async function clic(contenedor: Element, clase: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`.${clase}`)!
      .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

for (const [titulo, Panel] of [
  ["definido fuera", PanelBien],
  ["definido dentro", PanelMal],
] as const) {
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Panel />);
  });
  await clic(contenedor, "mas");
  await clic(contenedor, "mas");
  const antes = contenedor.querySelector(".mas")!.textContent;
  await clic(contenedor, "actualizar");
  const despues = contenedor.querySelector(".mas")!.textContent;
  console.log(`${titulo}: dos clics → «${antes}»; el padre se actualiza → «${despues}»`);
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_06.tsx
$ node fig01_06.js
definido fuera: dos clics → «clics: 2»; el padre se actualiza → «clics: 2»
definido dentro: dos clics → «clics: 2»; el padre se actualiza → «clics: 0»
```

Le compteur extérieur conserve ses deux clics lorsque le parent est mis à jour. Celui de l'intérieur revient à zéro, ce qui correspond à la troisième frayeur de la scène : le render de `PanelMal` a créé un nouveau `ContadorDeDentro`, React l'a perçu comme un type différent, a démonté l'ancien et en a monté un autre avec l'état initial. Imagine cela dans le `revisor` : toutes les dix secondes, l'interrogation périodique (polling) de `useReporte` met à jour le panneau ; si la ligne était définie à l'intérieur du panneau, toutes les dix secondes, tout ce que l'utilisateur y aurait saisi serait effacé. En plus de l'état, du travail est gaspillé : React détruit et recrée les nœuds du DOM à chaque render, alors que la figure 1 a montré que la normale consiste à ne toucher qu'à ce qui a changé.

Cette fois, le linter est bien de ton côté. C'est la règle `static-components`, une autre de celles du compilateur :

```text
$ npx eslint fig01_06.tsx

~/curso-react/figuras/fig01_06.tsx
  51:8  error  Error: Cannot create components during render

Components created during render will reset their state each time they are created. Declare components outside of render.

~/curso-react/figuras/fig01_06.tsx:51:8
  49 |         actualizar ({vueltas})
  50 |       </button>
> 51 |       <ContadorDeDentro />
     |        ^^^^^^^^^^^^^^^^ This component is created during render
  52 |     </section>
  53 |   );
  54 | }

~/curso-react/figuras/fig01_06.tsx:37:3
  35 |   const [vueltas, establecerVueltas] = useState(0);
  36 |
> 37 |   function ContadorDeDentro() {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 38 |     const [clics, establecerClics] = useState(0);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 39 |     return (
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 40 |       <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 41 |         clics: {clics}
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 42 |       </button>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 43 |     );
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |   }
     | ^^^^ The component is created during render here
  45 |
  46 |   return (
  47 |     <section>  react-hooks/static-components

✖ 1 problem (1 error, 0 warnings)
```

Le message pointe deux endroits : là où le composant créé pendant le render est **utilisé** (ligne 51) et là où il est **défini** (lignes 37 à 44). Et il en formule la conséquence en une phrase : les composants créés pendant le render réinitialisent leur état chaque fois qu'ils sont créés. La page de la règle ajoute le pourquoi : React voit chacun d'eux comme un nouveau type de composant, démonte l'ancien et monte le nouveau, détruisant tout l'état et les nœuds du DOM ([React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components)). Comme il s'agit d'une erreur et non d'un avertissement, `npm run lint` s'arrête même si tu n'utilises pas `--max-warnings 0`.

La correction est toujours la même : sortir la définition au niveau supérieur du fichier (ou dans son propre fichier) et lui passer par des props ce qu'il utilisait du parent. Pour le bouton de l'extrait de 1.6.1, cela donne `function BotonActualizar({ alPulsar }: { readonly alPulsar: () => void })` en dehors de `Panel`, et `<BotonActualizar alPulsar={recargar} />` à l'intérieur. Le nom `alPulsar` respecte la convention de nommage du cours : les props qui sont des fonctions commencent par `al`. Dans le point de contrôle, ce composant n'a même pas été nécessaire : le bouton vit directement dans le JSX de `Panel`, qui est l'endroit où réside `recargar`, et voyage jusqu'à la carte sous forme de `children`. Parfois, la meilleure manière de ne pas imbriquer un composant est de ne pas le créer.

### 1.7 Le parcours complet

Avec les six pièces en place, vérifie le point de contrôle comme le fait toute vérification automatique du cours : installation propre, linter et construction. Les trois se sont terminés avec le code 0 :

```text
$ npm ci
...
$ npm run lint

> revisor@0.1.0 lint
> eslint . --max-warnings 0

$ npm run build
...
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

`npm run lint` n'affiche rien après l'en-tête : aucun problème. (Lors de l'exécution de `npm ci` pour cette leçon, npm a également affiché un avertissement concernant `install-scripts`. Il provient de `fsevents`, une dépendance facultative qui ne s'installe que sous macOS pour surveiller les fichiers et qui comporte un script d'installation ; il n'y a rien à approuver. Sur ta Mint, cette dépendance ne s'installe pas, il est donc normal que l'avertissement n'apparaisse pas.) La construction est celle que tu as vue dans « Le pourquoi avant le comment » : vingt-six modules, une feuille de styles légèrement plus grande en raison des deux nouvelles règles et un JavaScript qui a changé de nom. Ce changement de nom n'est pas un caprice : Vite calcule le nom à partir du contenu, et le contenu a changé. C'est le `index-Dezp5bTH.js` documenté par le cours pour ce point de contrôle ; si tu obtiens un autre nom, une partie de ton code n'est pas identique à celle du cours.

Pour le voir dans le navigateur, utilise les deux mêmes terminaux que dans la Leçon 0 : `npm run servidor` dans l'un et, dans l'autre, `npm run dev` pour développer ou `npm run preview` pour visualiser la version construite. Voici ce qu'a renvoyé Chrome en mode headless à l'ouverture de la version construite (seul le conteneur est affiché) :

```text
<div id="raiz"><main><h1>Revisor</h1><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></section></main></div>
```

Compare-le avec celui de la Leçon 0. Les lignes sont identiques, caractère par caractère : découper `FilaEstado` dans son propre fichier n'a rien changé à ce qu'il dessine. La nouveauté réside dans la `<section>` avec son nom accessible, le `<h2>` et le paragraphe de résumé, avec `4 servicios revisados` et, en rouge, `· 2 servicios con falla`. Le bouton « Actualizar » est resté à l'intérieur de la carte, en tant que `children`. Et le journal du serveur d'entraînement a enregistré une seule requête, comme il se doit pour la version construite : `StrictMode` est toujours présent dans `main.tsx`, mais ses vérifications n'agissent qu'en développement :

```text
08:14:17.848 GET /api/estados 200
```

Avec `npm run dev`, en revanche, tu verras le couple de la Leçon 0 (une requête `cancelada por el cliente` et un `200`) si la connexion a le temps d'aboutir. Et tu sais désormais qu'en plus du cycle supplémentaire de l'effet, `StrictMode` appelle deux fois chacun de tes six composants à chaque render. Tu ne t'en rends pas compte car tous les six sont purs : les appeler deux fois donne deux fois le même résultat. C'est le test gratuit de la Leçon 0, appliqué aux composants.

## L'erreur que tu vas voir

**L'erreur principale : `Cannot create components during render`.** C'est celle de 1.6. Elle apparaît dès que tu définis un composant à l'intérieur d'un autre, et comme c'est une erreur (et non un avertissement), `npm run lint` s'arrête. Elle se lit en trois parties : la ligne où tu utilises le composant (`This component is created during render`), le bloc où tu le définis (`The component is created during render here`) et la règle, `react-hooks/static-components`. Elle se corrige en sortant la définition au niveau supérieur et en lui passant par des props ce qu'elle empruntait au parent. Il n'existe aucune exception raisonnable : si tu penses en avoir besoin, c'est presque toujours que tu souhaites passer le contenu en tant que `children`.

**L'avertissement qui n'apparaît qu'à l'exécution : `Each child in a list should have a unique "key" prop.`** C'est celui de la figure 4. Ni TypeScript ni le linter du cours ne le signalent ; il apparaît dans la console du navigateur, en développement, la première fois que la liste est dessinée. Il t'indique dans quel composant chercher (`Check the render method of …`). On le corrige avec une `key` stable issue des données, jamais avec la position et jamais avec une valeur générée pendant le render. Son cousin, `Encountered two children with the same key`, signifie que tes données ne respectent pas l'unicité que tu supposais : la solution ne consiste pas à inventer une autre `key`, mais à comprendre pourquoi l'API a envoyé des doublons.

**L'erreur de type qui te sauve de la mutation : `Property 'sort' does not exist on type 'readonly …[]'`.** C'est celle de 1.2.3. Si tu la vois, TypeScript te prévient que tu as tenté de modifier une liste qui ne t'appartient pas. Ne retire pas le `readonly` pour que cela compile : copie avant de trier, avec `[...lista].sort(…)`, ou utilise `toSorted`, qui renvoie un nouveau tableau et laisse l'original intact ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). `toSorted` fait partie d'ES2023 ; le fichier `tsconfig.app.json` du `revisor` déclare `"lib": ["ES2023", "DOM"]`, tu peux donc l'utiliser là-bas.

## Ce qui se fait de travers

**Modifier quelque chose d'externe pendant le render.** Un compteur de module, une variable globale, un `document.title = …` dans le corps du composant. Cela s'exécute autant de fois que React appelle le composant, ce qui n'est pas équivalent à « chaque fois que l'écran change ». En développement, `StrictMode` le fait se produire deux fois et te met sur la piste ; en production, le nombre ment tout simplement.

**Muter les props.** `props.estados.sort()`, `props.estados.push(…)`, `estado.nombre = …`. Tu modifies des données qui appartiennent à un autre composant, et cet autre composant n'est pas averti qu'elles ont changé. Le coût est une panne survenant loin de l'endroit où la faute a été commise : la liste se trie toute seule « ailleurs ». Déclare les props avec `readonly` et TypeScript l'empêchera.

**Lire l'horloge ou le hasard dans le render.** `new Date()`, `Date.now()`, `Math.random()`. La sortie dépend du moment où React a décidé de t'appeler. Si le composant a besoin de l'heure, qu'il la reçoive sous forme de prop ou qu'il la conserve dans un état mis à jour depuis un effet, comme le montre la référence de React.

**Utiliser la position comme `key`, ou une `key` qui change avec la position.** La première confond les lignes entre elles quand la liste change ; la seconde les détruit toutes. Aucune ne se remarque tant que les lignes ne possèdent pas d'état, et c'est pourquoi toutes deux survivent jusqu'au jour où la ligne hérite d'une note ou d'un champ de texte.

**Générer la `key` pendant le render.** `key={Math.random()}` ou `key={crypto.randomUUID()}` à l'intérieur du `map`. Chaque render produit de nouvelles `key`, et React recrée tous les composants ainsi que tout le DOM de la liste à chaque fois.

**Un nombre à gauche de `&&`.** `{fallas && …}`, `{lista.length && …}`. Cela fonctionne avec les données de test et affiche un `0` le jour où il n'y a rien. À gauche de `&&`, toujours un booléen.

**Définir un composant à l'intérieur d'un autre.** Il perd son état et son DOM à chaque render du parent. Le linter l'interrompt avec `static-components` ; ne le réduis pas au silence.

**Découper pour le plaisir de découper.** Un composant pour chaque balise HTML ne constitue pas une meilleure conception : cela fait juste plus de fichiers à lire. Le critère est la responsabilité, « à quelle question répond cette pièce ? », et non la taille. `Tarjeta` existe parce qu'« une boîte avec un titre » est une question qui se répète ; un `TextoRevisados` d'une seule ligne que personne d'autre n'utilise ne le serait pas.

**Créer une carte qui en sait trop.** Transmettre à `Tarjeta` le `recargar`, le chargement ou le type de contenu pour qu'elle décide de ce qu'il faut dessiner la lie à une seule fonctionnalité. Avec `children`, c'est celui qui l'utilise qui décide de ce qui va à l'intérieur.

## Exercices

### Exercice 1 — Nettoie les trois impuretés

Copie `fig01_02.tsx` dans `~/curso-react/figuras/` et corrige `ResumenImpuro` pour qu'il soit pur, sans rien perdre de ce qu'il affiche : un numéro de révision, une heure et les noms triés. **Avant de modifier quoi que ce soit, prédis** ce que diront les quatre lignes de la sortie lorsque le composant sera pur. Une fois terminé, la sortie doit confirmer ta prédiction et `npx eslint` ne doit signaler aucun problème. Indice : un composant pur ne peut pas inventer la révision ni l'heure ; quelqu'un doit les lui fournir.

### Exercice 2 — Retirer au lieu d'ajouter

Dans la figure 3, `correo` était ajouté au début. Modifie une seule ligne pour que, au lieu de cela, on **retire** `catálogo`, le premier de la liste : `const despues = antes.slice(1);`. **Avant de l'exécuter, prédis** pour chacune des trois `key` combien de lignes sont créées à partir de zéro et quel texte affiche chaque ligne. Exécute-la ensuite et compare. Lequel des trois résultats serait le plus dangereux si chaque ligne conservait, dans son propre état, une note rédigée par l'utilisateur ? (Dans le `revisor`, ce ne sera pas le cas : dès la Leçon 2, les notes vivent dans `Panel`. La question est posée pour que tu saches reconnaître le risque lorsqu'une ligne conserve effectivement un état.)

### Exercice 3 — Le singulier manquant

Le résumé du point de contrôle gère le singulier des pannes (« 1 servicio con falla »), mais pas celui des vérifiés : avec un seul service, il afficherait `1 servicios revisados`. Écris, dans un fichier `textoRevisados.ts` au sein de `~/curso-react/figuras/` (pas dans le `revisor`, afin que ton projet reste identique au point de contrôle), une fonction pure `textoRevisados(total: number): string` sur le modèle de `textoFallas`, et teste-la avec `node textoRevisados.ts` pour 0, 1 et 4. **Avant de l'exécuter, écris** les trois sorties que tu attends. Pourquoi cette fonction peut-elle être testée sans React, sans jsdom et sans navigateur ?

### Exercice 4 — Trouve le piège

Un collègue propose, pour la Leçon 4, de n'afficher la liste que s'il y a des services : `{carga.reporte.estados.length && <ListaEstados estados={carga.reporte.estados} />}` à l'intérieur d'une `<section>`. **Sans rien exécuter**, écris quel HTML cela produit lorsque l'API répond `{"estados":[]}`. Vérifie ensuite avec `renderToStaticMarkup`, comme dans la figure 5, et écris la version correcte.

## Solutions

### Solution 1

La prédiction, avec le composant pur : la ligne 2 affiche le tableau **sans modification** (`pagos, catálogo, reportes`), car plus personne ne le trie sur place ; la ligne 3 indique `0`, car le composant ne touche plus à la variable de module ; et la ligne 4 indique `sí`, car l'heure arrive comme prop et est identique lors des deux dessins. Les trois corrections, une par impureté :

```tsx
// fig01_02.tsx corrigé (extrait)
function ResumenImpuro({
  servicios,
  revision,
  hora,
}: {
  readonly servicios: readonly Servicio[];
  readonly revision: number;
  readonly hora: string;
}) {
  const ordenados = [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}
```

La révision et l'heure sont désormais des props : celui qui utilise le composant décide de ce qu'elles valent (dans les appels de la figure, par exemple, `revision={1} hora="10:00:00"`), et le composant se contente de les afficher. La liste est copiée avec `[...servicios]` avant d'être triée : c'est une mutation locale, sur un tableau que le composant vient de créer, et elle est autorisée. Le type `readonly Servicio[]` empêche quiconque d'écrire à nouveau `servicios.sort(…)` sans que TypeScript ne l'arrête. Il reste un détail dans le reste de la figure : la ligne 3 continue d'afficher la variable de module `revision`, que plus personne ne modifie. Si tu la laisses sous la forme `let revision = 0;`, ESLint signale `prefer-const`, précisément parce que plus personne ne la réassigne ; transforme-la en `const revision = 0;`. On a mesuré très exactement cette version, compilée avec la commande habituelle : les quatre lignes sont sorties `pagos, catálogo, reportes` (avant), `pagos, catálogo, reportes` (après), `0` et `sí`, et `npx eslint` s'est terminé sans encombre. Dans le `revisor`, d'où proviendraient réellement la révision et l'heure ? De données qui changent avec le temps, c'est-à-dire d'un état ; la Leçon 2 l'apporte.

### Solution 2

Mesuré à l'exécution :

```text
key={posicion}
  filas creadas desde cero: 0 de 3
  pagos (nació como catálogo) | inventario (nació como pagos) | reportes (nació como inventario)
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 3 de 3
  pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 0 de 3
  pagos | inventario | reportes
```

Avec la position, React ne crée rien et **supprime la dernière ligne**, celle qui était née sous le nom de `reportes` ; les trois restantes conservent leur propre état (celui de la ligne née à cet emplacement), mais dessinent désormais le nom de leur voisine du dessous : celle qui était née comme `catálogo` affiche `pagos`, et ainsi de suite. Avec la position et le nom, les trois lignes restantes sont recréées à partir de zéro, car leurs positions ont changé. Avec le nom, rien n'est créé : React supprime la ligne de `catálogo` et les trois autres restent les mêmes. Le résultat le plus dangereux est le premier, parce qu'il ne se voit pas : l'écran affiche les bons noms et le mauvais état. La note que l'utilisateur avait rédigée pour `pagos` apparaîtrait à côté d'`inventario` et personne ne s'en apercevrait avant qu'il ne soit trop tard. Le deuxième a au moins « seulement » pour effet d'effacer le travail ; le premier le déplace.

### Solution 3

Les sorties attendues sont `0 servicios revisados`, `1 servicio revisado` et `4 servicios revisados`. Une solution :

```ts
// textoRevisados.ts (dans ~/curso-react/figuras/)
export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

for (const n of [0, 1, 4]) console.log(`${n} → ${textoRevisados(n)}`);
```

```text
$ node textoRevisados.ts
0 → 0 servicios revisados
1 → 1 servicio revisado
4 → 4 servicios revisados
```

Node 24 exécute le fichier `.ts` directement, tout comme le serveur d'entraînement (Leçon 0). On peut la tester sans React parce que c'est une fonction pure qui ignore tout de React : elle reçoit un nombre et renvoie un texte. C'est l'avantage de séparer le calcul de la présentation : ce qui est calculé se teste avec un `console.log`. Remarque que le `0` est au pluriel (« 0 servicios »), ce qui correspond à la façon dont on s'exprime en espagnol. Si tu voulais l'intégrer au `revisor`, la fonction irait dans `resumen.ts`, aux côtés de `textoFallas`, et `ResumenFallas` l'appellerait ; ne le fais pas dans ta copie du point de contrôle, pour qu'elle reste fidèle à celle du cours.

### Solution 4

Avec la liste vide, `estados.length` vaut `0`, `0 && …` vaut `0`, et React dessine le nombre. Vérifié avec `renderToStaticMarkup` sur un `<section>` avec ce même `&&` et une liste vide :

```text
<section>0</section>
<section></section>
```

La première ligne est la version du collègue : un `0` solitaire à l'intérieur de la section. La seconde est la version correcte, avec un booléen à gauche : `{carga.reporte.estados.length > 0 && <ListaEstados estados={carga.reporte.estados} />}`. Une observation de conception pour ton journal de bord : une liste vide, dans le `revisor`, ne devrait pas s'afficher sous forme de « rien », mais avec un message indiquant qu'il n'y a aucun service. C'est le quatrième état, « vide », que la Leçon 4 ajoute avec son propre texte.

## Comment savoir que j'ai réussi

- [ ] Dans `~/curso-react/revisor/`, `npm ci`, `npm run lint` et `npm run build` se terminent avec le code 0, `npm run lint` ne signale aucun problème, et la construction dépose dans `dist/assets/` un fichier nommé `index-Dezp5bTH.js`.
- [ ] Avec le serveur d'entraînement et `npm run dev` lancés, `http://localhost:5173/` affiche une carte avec l'en-tête « Estado de los servicios », la ligne `4 servicios revisados · 2 servicios con falla` au-dessus de la liste, et le bouton « Actualizar » à l'intérieur de la carte. La console du navigateur ne contient aucune erreur de React.
- [ ] Tu peux identifier, dans la sortie de la figure 1, quelles lignes relèvent du render et lesquelles relèvent du *commit*, et expliquer pourquoi le deuxième dessin n'apporte aucune modification au DOM.
- [ ] Tu as trouvé les trois impuretés de la figure 2 et tu sais laquelle est attrapée par le linter, laquelle est attrapée par TypeScript avec `readonly` et laquelle n'est visible que dans la sortie.
- [ ] En définissant temporairement un composant à l'intérieur de `Panel`, `npm run lint` échoue avec `react-hooks/static-components` ; en le sortant, il repasse au vert. (Restaure le fichier à la fin.)
- [ ] En copiant `fig01_05.tsx` et en remplaçant `[2, 0]` par `[0]`, tu prédis avant de l'exécuter les deux lignes qu'il affiche, et l'exécution te donne raison : avec `fallas &&`, on obtient `4 servicios revisados0`, et avec `fallas > 0 &&`, `4 servicios revisados`. (Le serveur d'entraînement de cette leçon ne propose pas de scénario sans pannes ; la Leçon 8 le teste sur le `revisor`.)
- [ ] Tu peux expliquer, à partir de la sortie de la figure 3, pourquoi le `revisor` utilise `key={estado.nombre}` et pourquoi c'est sûr avec l'API du cours.
- [ ] Tu as noté dans ton [journal de bord](bitacora.md) les trois impuretés et comment tu les as trouvées, un composant que tu as découpé et ce que tu y as gagné, et un `0` qui est apparu à l'écran sans que tu le demandes.

## Résumé

Réponds sans regarder la leçon :

1. Que se passe-t-il pendant le render et que se passe-t-il pendant le *commit* ? Pourquoi React peut-il appeler ton composant sans que l'écran ne change ?
2. Quelles sont les deux conditions d'un composant pur ? Qu'est-ce qu'une mutation locale et pourquoi est-elle autorisée ?
3. Nomme trois impuretés typiques et, pour chacune, quel outil du cours la détecte (ou si aucun ne la détecte).
4. Que reçoit un composant dans `children` ? Pourquoi `Tarjeta` réside-t-il dans `compartido/` et non dans `reporte/` ?
5. Que devient l'état des lignes si la `key` est la position et qu'un élément est inséré au début ? Et si la `key` combine la position et le nom ?
6. Pourquoi `{fallas && …}` peut-il afficher un `0`, et comment l'écrit-on pour que cela ne se produise pas ?
7. Pourquoi un composant défini à l'intérieur d'un autre perd-il son état à chaque render du parent ? Quelle règle du linter le détecte ?

## Pour aller plus loin

- [React, « Render and Commit »](https://react.dev/learn/render-and-commit) : les trois étapes d'une mise à jour, le render récursif et pourquoi React ne touche au DOM que là où il y a des différences. Consulté le 21 octobre 2026.
- [React, « Keeping Components Pure »](https://react.dev/learn/keeping-components-pure) : les deux conditions de la pureté, la mutation locale, le double render de `StrictMode` et l'endroit où vont les effets de bord. Consulté le 21 octobre 2026.
- [React, « Components and Hooks must be pure »](https://react.dev/reference/rules/components-and-hooks-must-be-pure) : idempotence, `new Date()` et `Math.random()`, props et état immuables, effets hors du render. Consulté le 21 octobre 2026.
- [React, « Passing Props to a Component »](https://react.dev/learn/passing-props-to-a-component) : `children` comme un trou que remplit le parent, et les props comme des photographies immuables. Consulté le 21 octobre 2026.
- [React, « Understanding Your UI as a Tree »](https://react.dev/learn/understanding-your-ui-as-a-tree) : l'arbre de render, constitué uniquement de composants. Consulté le 21 octobre 2026.
- [React, « Thinking in React »](https://react.dev/learn/thinking-in-react) : découper une interface en composants par séparation des responsabilités. Consulté le 21 octobre 2026.
- [React, « Rendering Lists »](https://react.dev/learn/rendering-lists) : les règles de la `key`, le danger de la position et des `key` générées à la volée, et d'où les extraire. Consulté le 21 octobre 2026.
- [React, « Conditional Rendering »](https://react.dev/learn/conditional-rendering) : la mise en garde concernant les nombres à gauche de `&&`. Consulté le 21 octobre 2026.
- [React, « Your First Component »](https://react.dev/learn/your-first-component) : ne jamais imbriquer de définitions de composants ; noms avec majuscule initiale. Consulté le 21 octobre 2026.
- [React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state) : l'état lié à la position dans l'arbre et pourquoi un composant imbriqué le perd. Consulté le 21 octobre 2026.
- [React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components) : la règle qui détecte les composants créés pendant le render. Consulté le 21 octobre 2026.
- [React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals) et [lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity) : les règles qui détectent les modifications de variables externes et les fonctions impures pendant le render. Consulté le 21 octobre 2026.
- [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) : `sort` trie sur place ; `toSorted` renvoie un nouveau tableau. Consulté le 21 octobre 2026.
- [MDN, rôle ARIA `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role) : quand un `<section>` constitue une région et comment lui donner un nom. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| render | l'étape où React appelle tes fonctions de composant pour savoir à quoi l'écran devrait ressembler ; il ne touche pas au DOM |
| *commit* | l'étape où React applique au DOM uniquement les différences entre le nouveau render et le précédent |
| peindre | ce que fait le navigateur après le *commit* : dessiner les pixels |
| composant pur | ne modifie rien de ce qui existait avant de l'appeler et, avec les mêmes entrées, renvoie la même sortie |
| mutation locale | modifier un objet ou un tableau que le composant lui-même vient de créer ; elle est autorisée car personne de l'extérieur ne la voit |
| idempotent | qui renvoie la même chose chaque fois qu'on l'appelle avec les mêmes entrées |
| composition | assembler de grands composants en combinant des pièces qui ne se connaissent pas entre elles |
| `children` | la prop dans laquelle un composant reçoit le contenu imbriqué entre sa balise ouvrante et sa balise fermante |
| fragment (`<>…</>`) | une manière de renvoyer plusieurs éléments frères sans les envelopper dans un autre élément |
| `key` | l'indice avec lequel React apparie les éléments d'une liste entre un render et le suivant ; unique entre frères et stable |
| région | une zone de la page dotée d'un nom propre vers laquelle un lecteur d'écran peut naviguer ; un `<section>` avec un nom accessible en est une |

---

**Suivante :** [Leçon 2 — État : instantané, immuabilité et forme](02-estado-instantanea-forma.md)
