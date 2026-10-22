# Leçon 2 — État : instantané, immuabilité et forme

*Il est 18 h 05 et l'astreinte de nuit commence à 18 h 30. Avant de partir, tu veux laisser à ta collègue une note dans le `revisor` : « pagos : le fournisseur indique qu'il revient à 20 h 00, ne pas escalader ». Tu choisis `pagos`, tu écris la note, tu l'enregistres… et la ligne ne bouge pas. Tu repasses mentalement ce que tu as fait : le code ajoute la note à l'objet des notes et l'enregistre à nouveau dans l'état. La note est bien là, en mémoire ; la console le confirme. Mais l'écran n'en sait rien. Dix secondes plus tard arrive l'interrogation périodique suivante (polling), le panneau s'affiche à nouveau et, tout à coup, la mention « con nota » apparaît, comme si quelqu'un l'avait posée à contretemps. Et en choisissant `reportes`, la zone de texte indique toujours « pagos : le fournisseur indique qu'il revient… ». Si ta collègue enregistre sans lire, la note de `pagos` finit collée dans `reportes`. Il reste vingt-cinq minutes. Les deux dysfonctionnements proviennent de la même erreur : penser l'état de React comme une variable que l'on modifie. Il n'en est rien : c'est une photographie que l'on remplace, et React la conserve à un endroit précis de l'arbre. Cette leçon explique cette phrase et la traduit en code.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 2.3 et 2.4)

**Ce que tu construis :** le filtre « Solo fallas », la sélection d'un service avec son détail et une note par service, avec un brouillon qui ne se propage pas d'un service à l'autre

**Ce que tu apprends :** l'état est une photographie par rendu ; la forme de mise à jour `establecerN((n) => n + 1)` ; copier plutôt que muter ; les cinq règles de structuration de l'état (parmi lesquelles : un `tipo` et non trois drapeaux, conserver l'identifiant et non l'objet, et ne pas stocker ce qui peut être calculé) ; faire remonter l'état ; `key` pour le réinitialiser

**D'où tu viens.** De la [Leçon 1](01-componentes-puros-composicion.md). Ton `revisor` est déjà découpé en pièces pures : `Tarjeta` reçoit un titre et ses `children` ; `ResumenFallas` affiche « 4 servicios revisados · 2 servicios con falla » à l'aide de fonctions pures de `resumen.ts` ; `ContenidoReporte` décide de ce qu'il faut afficher selon le chargement ; `ListaEstados` parcourt les états avec `key={estado.nombre}` ; et `FilaEstado` affiche une ligne. `Panel` se contente de composer. La seule chose qui change au fil du temps est ce qu'apporte `useReporte`, le hook de la leçon 0 qui appelle `GET /api/estados` toutes les dix secondes. Jusqu'à aujourd'hui, la personne qui regarde le panneau ne peut rien faire d'autre que cliquer sur « Actualizar ». Aujourd'hui, le panneau commence à se souvenir de ce que fait cette personne.

**Ce que cette leçon ne fait pas.** Elle n'apporte pas de nouvelles données depuis l'API : le détail d'un service se construit avec ce qui est déjà arrivé dans le rapport, et demander à l'API le détail d'un seul service fait l'objet de la [Leçon 3](03-effects-sincronizar.md), avec sa concurrence entre les réponses (*race condition*). Les notes vivent en mémoire : si tu recharges la page, elles sont perdues, et c'est très bien ainsi pour le moment. Le filtre et la sélection ne voyagent pas non plus dans l'adresse de la page ; le fait qu'un filtre puisse être partagé en copiant le lien relève de la [Leçon 5](05-rutas-url-como-estado.md). Il n'y a ni contexte ni réducteur (*reducer*), qui font l'objet de la [Leçon 6](06-reducer-contexto.md), ni formulaires avec `action`, qui font l'objet de la [Leçon 7](07-formularios-accesibilidad.md). Et il n'y a aucun nouvel Effect : la leçon entière se résout avec `useState`, des calculs pendant le rendu et une `key`.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon (React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 pour `tsc`, ESLint 10.13.0 et `eslint-plugin-react-hooks` 7.1.1). Comme le cours suppose Linux Mint, ce point de contrôle a été réinstallé depuis zéro dans un conteneur `node:24.22.0-bookworm` et a produit le même nom de fichier dans `dist/` que celui visible ici, `index-7jh0TEYR.js` ; il n'a pas été exécuté sur un vrai Linux Mint, mais rien de ce qui est montré ne dépend du système d'exploitation, sauf l'avertissement de `fsevents` qui suit. Sous macOS, `npm ci` affiche en outre un avertissement concernant `install-scripts` : il fait référence à `fsevents`, un paquet optionnel qui ne s'installe que sous macOS et qui n'apparaît pas sur ton Mint ; il n'est pas nécessaire de l'approuver. Les figures sont exécutées dans `~/curso-react/figuras/`, le même dossier que dans les leçons précédentes ; leur `package.json` ne change pas. Elles sont compilées avec `tsc` et exécutées avec `node` sur un DOM de test (jsdom), comme dans la leçon 0. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome en mode headless (`--headless`), piloté par un script qui clique sur les boutons et lit la page via le protocole de débogage de Chrome : c'est un vrai navigateur exécutant le JavaScript de `dist/`, pas une simulation. Le script se trouve aux côtés des figures, dans `medir.mjs`, et son premier commentaire explique comment le lancer. Il nécessite Google Chrome ou Chromium, que Linux Mint n'installe pas par défaut ; si tu n'en disposes pas, il n'est pas indispensable pour suivre la leçon : effectue les mêmes étapes manuellement dans ton navigateur et tu devrais observer la même chose. Les sorties de chaque mesure et de chaque erreur provoquée, avec les modifications exactes de chaque copie, se trouvent dans [`programas/02-estado-instantanea-forma/ejercicios/`](../programas/02-estado-instantanea-forma/ejercicios). Les longs chemins affichés par ESLint et `tsc` sont présentés à partir de `~/curso-react`, et dans une sortie d'ESLint, les espaces d'alignement de la colonne de règle ont été raccourcis. Les erreurs de « L'erreur que tu vas voir » ont été provoquées dans une copie du point de contrôle, jamais dans l'original, qui, une fois tout cela terminé, a de nouveau passé `npm ci`, `npm run lint` et `npm run build`. Les programmes se trouvent dans [`programas/02-estado-instantanea-forma/`](../programas/02-estado-instantanea-forma) : `revisor/` est le point de contrôle et les figures se trouvent à ses côtés.

## À la fin, tu seras capable de

- Prédire la valeur affichée par un composant après avoir appelé plusieurs fois une fonction `establecer…` au sein d'un même clic, et vérifier ta prédiction avec une figure.
- Écrire une mise à jour avec la forme de mise à jour (*updater function*) lorsque l'état suivant dépend du précédent, et expliquer quand elle produit un résultat différent de la simple transmission de la valeur.
- Mettre à jour un objet de l'état en créant une copie, et démontrer avec une figure que le fait de le muter et de le renvoyer ne déclenche aucun nouveau rendu.
- Examiner l'état d'un composant au regard des cinq règles de structuration et désigner dans le `revisor` un exemple de chacune d'elles (un exemple peut servir pour deux règles).
- Décider dans quel composant réside chaque morceau d'état, le faire remonter vers l'ancêtre commun et transmettre vers le bas la valeur ainsi que la fonction qui la modifie.
- Utiliser une `key` pour qu'un composant reparte de zéro lorsque ce qu'il représente change, et reproduire l'erreur qui survient si elle manque.

## Le pourquoi avant le comment

Ouvre le `revisor` de la leçon 1 et demande-lui trois choses qu'un opérateur réclamerait dès le premier jour.

**« Montre-moi seulement ce qui est en panne. »** Avec quatre services, ce n'est pas nécessaire, mais le véritable `revisor` d'une entreprise en surveille des dizaines. Une case à cocher « Solo fallas » doit mémoriser si elle est cochée, et deux éléments distincts ont besoin de le savoir : la case elle-même, pour s'afficher cochée, et la liste, pour décider quelles lignes afficher.

**« Je veux voir un service en détail. »** La personne choisit `pagos` et un encadré apparaît avec son état. Dix secondes plus tard, l'interrogation périodique suivante arrive et `pagos` s'est rétabli : l'encadré doit afficher « Disponible », et non ce qu'il affichait dix secondes plus tôt. Cela dépend de **ce que** tu conserves lorsque quelqu'un fait un choix : le service tout entier ou seulement son nom.

**« Laisse-moi noter quelque chose. »** Une note par service, qui survive au fait de changer de service puis d'y revenir, et qui signale la ligne pour que l'équipe suivante la voie. Et pendant que tu écris, un brouillon qui ne s'immisce pas dans la note d'un autre service.

Toutes les trois demandent la même chose : que le panneau **se souvienne** de quelque chose entre un rendu et le suivant. En React, ce dont on se souvient s'appelle l'**état** (*state*), et l'outil pour cela est `useState`, que tu as déjà utilisé dans la leçon 0 au sein de `useReporte`. La leçon 9 de TypeScript t'a appris à l'écrire ; cette leçon t'apprend à **le penser**, car presque toutes les erreurs avec l'état viennent du fait de le concevoir comme une variable. Une variable se modifie, et la modification se voit à la ligne suivante. Pour l'état, il n'en est rien : chaque rendu reçoit une photographie fixe, et demander une modification ne touche pas à cette photographie, mais demande à React d'en prendre une autre ([React, « State as a Snapshot »](https://react.dev/learn/state-as-a-snapshot)). Penser l'état comme une variable explique les deux dysfonctionnements de la scène d'ouverture, chacun de son côté : la note qui n'apparaît pas provient de la photographie (tu as redonné à React la même, retouchée, et React n'a rien vu de neuf), et le brouillon qui persiste provient de l'endroit où React conserve l'état (il a gardé celui de l'éditeur car, pour lui, à cette position se trouvait toujours le même éditeur).

Il y a trois nouveaux concepts. Le premier est **l'état comme photographie**, avec la forme de mise à jour (2.1). Le deuxième est **un état que l'on copie et qui a une forme** : copier plutôt que muter (2.2) et les cinq règles de structuration de l'état (2.3). Le troisième est **qui est propriétaire de l'état et quand il se réinitialise** : faire remonter l'état vers le composant qui le partage (2.4) et `key` pour le réinitialiser (2.5). La section 2.6 n'ajoute pas de concept : c'est le parcours complet, où les trois apparaissent ensemble. Voici à quoi ressemble le résultat, mesuré avec Chrome en mode headless sur le point de contrôle, en sélectionnant `pagos`, en enregistrant une note et en changeant de service (ce sont les étapes 3 à 6 du parcours de 2.6) :

```text
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
```

À la fin de la leçon, tu sauras d'où provient chaque ligne, et pourquoi la dernière affiche ce qu'elle affiche.

## Les concepts

### 2.1 L'état est une photographie

#### 2.1.1 Ce qui se passe quand tu appelles `establecer…`

Lorsque tu écris `const [revisiones, establecerRevisiones] = useState(0)`, React te fournit deux choses : la valeur qu'il a enregistrée **pour ce rendu** et une fonction pour lui en demander une autre. L'essentiel réside dans le mot « demander ». La documentation de React le formule ainsi : l'état se comporte comme une photographie ; le modifier ne change pas la variable que tu possèdes déjà, mais déclenche un nouveau rendu ([React, « State as a Snapshot »](https://react.dev/learn/state-as-a-snapshot)). Et dans la référence de `useState`, très explicitement : la fonction `set` met uniquement à jour la variable d'état **pour le prochain rendu** ([React, `useState`](https://react.dev/reference/react/useState)).

La première figure met cela à l'épreuve avec la situation la plus élémentaire qui soit : un bouton qui, au cours d'un seul clic, appelle trois fois la fonction qui incrémente une révision. Il existe deux versions. La première transmet à React la valeur, `revisiones + 1` ; la seconde lui transmet une fonction, `(actual) => actual + 1`. Toutes deux affichent, au sein du clic, la valeur de `revisiones`, et la figure lit ce qu'indique le bouton à la fin.

```tsx
// fig02_01.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ConValor() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

function ConActualizadora() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

async function hacerClic(titulo: string, Componente: ComponentType): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<Componente />);
  });

  const boton = contenedor.querySelector("button");
  await act(async () => {
    boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  console.log(`  después del clic, el botón dice ${boton?.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await hacerClic("con el valor (revisiones + 1, tres veces):", ConValor);
await hacerClic("con la forma actualizadora (actual => actual + 1, tres veces):", ConActualizadora);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_01.tsx
$ node fig02_01.js
con el valor (revisiones + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

Avant de lire l'explication, regarde les deux lignes qui indiquent « dentro del clic » : dans les deux versions, `revisiones` vaut `0`, bien que l'on ait déjà appelé trois fois `establecerRevisiones`. C'est cela, la photographie. Le gestionnaire de clic est une fonction qui a été créée pendant le rendu où `revisiones` valait `0`, et pour cette fonction, `revisiones` vaut `0` pour toujours, comme une constante. React ne réécrit pas tes variables ; ce qu'il fait, c'est appeler à nouveau ton composant, et lors de ce nouvel appel, `useState` renvoie la nouvelle valeur. La documentation le résume en une règle : **la valeur d'une variable d'état ne change jamais au sein d'un même rendu**, même si le code du gestionnaire est asynchrone ([React, « State as a Snapshot »](https://react.dev/learn/state-as-a-snapshot)).

Dès lors, la première version s'explique d'elle-même. Les trois appels disent la même chose : « au prochain rendu, `revisiones` vaut `0 + 1` ». Trois fois `1`, cela fait `1`. Le bouton affiche `1`, et non `3`. C'est exactement l'exemple utilisé par la documentation de React avec son bouton « +3 » ([React, « State as a Snapshot »](https://react.dev/learn/state-as-a-snapshot)).

#### 2.1.2 La file d'attente des mises à jour et la forme de mise à jour

Pourquoi le bouton ne s'est-il pas affiché trois fois, une fois par appel ? Parce que React **attend que tout le code du gestionnaire soit terminé** avant de traiter les mises à jour d'état. C'est ce qu'on appelle le **regroupement** (*batching*), et c'est ce qui évite les rendus superflus et les écrans à moitié mis à jour ([React, « Queueing a Series of State Updates »](https://react.dev/learn/queueing-a-series-of-state-updates)). Pendant que le gestionnaire s'exécute, chaque appel à `establecer…` prend place dans une file d'attente. Quand il se termine, React parcourt la file dans l'ordre pour calculer la valeur du prochain rendu.

C'est là qu'intervient la seconde version. Si, au lieu d'une valeur, tu lui passes une **fonction**, React ne l'exécute pas sur le coup : il la place dans la file d'attente et, au moment de la traiter, lui transmet le résultat de la précédente. La documentation nomme cela une **fonction de mise à jour** (*updater function*) ([React, « Queueing a Series of State Updates »](https://react.dev/learn/queueing-a-series-of-state-updates)). La première reçoit `0` et renvoie `1` ; la deuxième reçoit `1` et renvoie `2` ; la troisième reçoit `2` et renvoie `3`. Le bouton affiche `3`. Remarque que, même ainsi, la ligne « dentro del clic » indique toujours `0` : la forme de mise à jour ne modifie pas la photographie actuelle, elle modifie **la façon dont la suivante est calculée**.

Trois points à retenir :

- **Le nom du paramètre.** La documentation suggère de le nommer avec les initiales de la variable (`n => n + 1`) ou, si tu préfères quelque chose de plus long, en répétant le nom complet ou en lui préfixant `prev` ([React, « Queueing a Series of State Updates »](https://react.dev/learn/queueing-a-series-of-state-updates)). Ce cours utilise un nom en espagnol qui indique clairement ce qu'il est : `actual`, `actuales`. C'est un choix délibéré, pensé pour que la lecture soit homogène avec le reste du code.
- **Elle doit être pure.** La fonction de mise à jour s'exécute pendant le rendu, elle ne doit donc que calculer et renvoyer : pas question d'y demander des données, d'afficher quoi que ce soit ou d'appeler une autre fonction `establecer…`. En `StrictMode`, et uniquement pendant le développement, React l'appelle **deux fois** et ne conserve que l'un des résultats (dans la version construite pour la production, il ne l'appelle qu'une seule fois), précisément pour débusquer les fonctions impures ([React, `useState`](https://react.dev/reference/react/useState)). C'est le même test gratuit que celui vu dans la leçon 0, appliqué ici à l'état.
- **Si tu as besoin de la nouvelle valeur immédiatement, calcule-la toi-même.** Si, après `establecerRevisiones(revisiones + 1)`, tu souhaites utiliser la nouvelle valeur au sein du même gestionnaire, enregistre-la au préalable dans une constante : `const siguiente = revisiones + 1`. Lire `revisiones` te donnerait l'ancienne photographie ; la référence de `useState` présente ce cas en tête de sa section consacrée aux problèmes fréquents ([React, `useState`](https://react.dev/reference/react/useState)).

#### 2.1.3 Dans le `revisor` : `establecerNotas((actuales) => …)`

Dans le point de contrôle, la forme de mise à jour apparaît une fois, dans `Panel`, lors de l'enregistrement d'une note :

```tsx
// revisor/src/reporte/Panel.tsx (fragmento)
  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }
```

Sois honnête avec ce que cela démontre : dans le panneau d'aujourd'hui, `establecerNotas(conNota(notas, nombre, texto))` donnerait le même résultat, car `guardarNota` n'est appelée qu'une seule fois par clic. Alors, pourquoi employer la forme de mise à jour ? Parce que **l'état suivant dépend du précédent** : une nouvelle note s'ajoute à celles qui existaient déjà. Avec la forme de mise à jour, le calcul s'effectue avec le dernier élément présent dans la file d'attente, et non avec la photographie dont disposait le gestionnaire au moment de sa création. Le jour où quelqu'un ajoutera un bouton qui enregistre deux notes au cours du même clic, ou lorsque la note proviendra d'une fonction créée lors d'un rendu antérieur, ce code restera correct sans que personne n'ait à y repenser. La documentation de React n'impose pas la forme de mise à jour dans tous les cas ; la règle du cours est plus simple à mémoriser : **si la nouvelle valeur se calcule à partir de l'ancienne, passe une fonction à React**. Si la nouvelle valeur ne dépend pas de l'ancienne, comme `establecerSoloFallas(true)` ou `establecerSeleccionado("pagos")`, passe directement la valeur.

### 2.2 Copier plutôt que muter

#### 2.2.1 React compare la photographie, pas son contenu

Comment React sait-il que l'état a changé ? Il ne parcourt pas ton objet champ par champ : il compare la nouvelle valeur avec la valeur actuelle à l'aide de `Object.is`, et si elles sont **identiques**, il saute le rendu de ce composant et de ses enfants ([React, `useState`](https://react.dev/reference/react/useState)). Pour les nombres et le texte, « identique » correspond à ce que tu attends. Pour les objets et les tableaux, cela signifie autre chose : `Object.is` considère que deux objets sont identiques uniquement s'ils partagent **la même référence en mémoire**, et non s'ils ont les mêmes champs ([MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)). Deux objets ayant le même contenu sont distincts ; un objet dont tu as modifié une propriété reste le même objet.

La deuxième figure reproduit le premier dysfonctionnement de la scène d'ouverture. Un bloc-notes conserve un objet dans l'état et dispose de deux boutons. « mutar » ajoute la note à l'objet déjà existant et le renvoie. « copiar » crée un nouvel objet contenant tout ce qui précédait plus la note. Un `<Profiler>` de React compte combien de fois un rendu s'est achevé ; c'est le moyen de compter sans introduire d'effet de bord au sein du composant (la Leçon 9 reviendra sur le Profiler).

```tsx
// fig02_02.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Notas = Record<string, string>;

let dibujos = 0;

function BlocDeNotas() {
  const [notas, establecerNotas] = useState<Notas>({});

  function mutar(): void {
    notas.pagos = "se reinició a las 9:40";
    establecerNotas(notas);
  }

  function copiar(): void {
    establecerNotas({ ...notas, pagos: "se reinició a las 9:40" });
  }

  return (
    <>
      <p>notas guardadas: {Object.keys(notas).length}</p>
      <button type="button" id="mutar" onClick={mutar}>
        mutar
      </button>
      <button type="button" id="copiar" onClick={copiar}>
        copiar
      </button>
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);

async function clic(id: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`#${id}`)
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  console.log(`clic en «${id}»: pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
}

await act(async () => {
  raiz.render(
    <Profiler id="bloc" onRender={() => (dibujos += 1)}>
      <BlocDeNotas />
    </Profiler>,
  );
});
console.log(`al montar:      pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
await clic("mutar");
await clic("copiar");
await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_02.tsx
$ node fig02_02.js
al montar:      pantalla «notas guardadas: 0», dibujos: 1
clic en «mutar»: pantalla «notas guardadas: 0», dibujos: 1
clic en «copiar»: pantalla «notas guardadas: 1», dibujos: 2
```

Après « mutar », le compteur de rendus reste à `1` et l'écran continue d'afficher `0`. L'objet a pourtant bien changé : il contient la note de `pagos`. Mais ce que tu as passé à React est **le même objet** qu'il avait déjà, `Object.is` a répondu « identique » et React n'a rien fait. La documentation l'explique avec l'exemple d'un point qui suit la souris : sans la fonction qui met à jour l'état, React n'a aucune idée du fait que l'objet a changé et ne réagit pas ([React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state)) ; et la référence de `useState` répertorie cela sous le problème « j'ai mis à jour l'état, mais l'écran ne change pas » ([React, `useState`](https://react.dev/reference/react/useState)).

Regarde maintenant la dernière ligne : après « copiar », il y a un nouveau rendu et l'écran affiche `1`. Remarque que le nouvel objet contient la note de `pagos` par deux voies différentes : la mutation précédente, qui restait tapie au sein de l'ancien objet et qui a été copiée avec `...notas`, ainsi que la copie elle-même. L'écran a affiché la mutation **lorsqu'autre chose a provoqué le rendu**. C'est précisément ce que tu as observé dans la scène initiale avec l'interrogation périodique toutes les dix secondes : la mention « con nota » est apparue à contretemps, lorsque le rapport suivant a forcé un rendu et que la mutation cachée a été révélée au grand jour. Une mutation n'est pas toujours perdue ; parfois, elle apparaît tardivement, ce qui est pire, car cela donne l'illusion que le code fonctionne.

#### 2.2.2 Copier : la syntaxe de décomposition

La règle énoncée par la documentation est sans détour : **traite tout objet placé dans l'état comme étant en lecture seule** ; au lieu de le modifier, remplace-le par un autre ([React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state)). L'outil de JavaScript pour cela est la **syntaxe de décomposition** (*spread syntax*, `...`) : dans un objet littéral, `{ ...notas, pagos: "texto" }` copie les propriétés énumérables propres de `notas` (pour un tel objet, toutes) dans un nouvel objet, puis écrit `pagos` ; si `pagos` existait déjà, il prend la dernière valeur fournie ([MDN, « Spread syntax »](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).

Un avertissement qui prend toute son importance dès que ton état prend de l'ampleur : la décomposition est **superficielle** (*shallow*). Elle ne copie qu'un seul niveau ; si une propriété est elle-même un objet, la copie pointe vers le même objet interne, et le modifier constituerait à nouveau une mutation. La documentation de React le souligne et montre comment copier niveau par niveau ([React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state)). C'est l'une des raisons de la cinquième règle de structuration (2.3) : un état plat se copie en une seule étape.

Dans le `revisor`, la copie réside dans une fonction pure, en dehors des composants, dans son propre fichier :

```ts
// revisor/src/reporte/notas.ts
export type Notas = Readonly<Record<string, string>>;

export function conNota(notas: Notas, nombre: string, texto: string): Notas {
  const limpio = texto.trim();

  if (limpio === "") {
    return Object.fromEntries(Object.entries(notas).filter(([clave]) => clave !== nombre));
  }

  return { ...notas, [nombre]: limpio };
}
```

Lis-la ligne par ligne :

- **`Notas` est `Readonly<Record<string, string>>`.** Un registre dont les clés sont des noms de services et dont les valeurs sont le texte de la note, marqué en lecture seule. `Record<K, T>` construit un type d'objet avec les clés `K` et les valeurs `T`, et `Readonly<T>` fait en sorte que ses propriétés ne puissent pas être réassignées ([TypeScript, « Utility Types »](https://www.typescriptlang.org/docs/handbook/utility-types.html)). Il s'agit d'une vérification de types, pas d'une protection à l'exécution : l'objet n'est pas gelé, mais `tsc` rejette toute assignation. Dans « L'erreur que tu vas voir », tu le verras bloquer la mutation de la scène d'ouverture avant même qu'elle n'atteigne le navigateur.
- **`texto.trim()`.** Une note constituée uniquement d'espaces n'est pas une note. Le nettoyage se fait une seule fois, ici, et personne d'autre n'a à s'en soucier.
- **Si le texte devient vide, la note est retirée.** `Object.entries` transforme l'objet en une liste de paires `[clé, valeur]`, `filter` écarte celle du service, et `Object.fromEntries` réassemble un objet avec celles qui restent. Les trois fonctions créent de nouveaux objets ; aucune ne touche à `notas`. Ainsi, « effacer le texte et enregistrer » retire la mention « con nota » de la ligne, ce à quoi une personne s'attend légitimement.
- **S'il y a du texte, on copie et on écrit.** `{ ...notas, [nombre]: limpio }` correspond à la décomposition vue plus haut, avec une clé calculée entre crochets.

Pourquoi une fonction séparée plutôt que trois lignes dans `Panel` ? Pour la même raison que `contarFallas` dans la leçon 1 : une fonction pure — mêmes entrées, même sortie, sans toucher à rien d'extérieur — se comprend d'elle-même, peut être testée sans React (tu le verras avec `resumen.ts` dans la Leçon 8) et peut être appelée depuis la fonction de mise à jour sans craindre que `StrictMode` ne l'exécute deux fois.

#### 2.2.3 Pourquoi tout ce cérémonial

On pourrait avoir l'impression que copier est plus coûteux et plus verbeux que muter. La documentation de React avance cinq raisons de procéder ainsi malgré tout ([React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state)), et trois se font déjà sentir aujourd'hui dans le `revisor` :

1. **Déboguer.** Si tu affiches l'état avec `console.log` et que tu ne le mutes jamais, les anciens journaux continuent d'afficher ce qu'ils affichaient à ce moment précis ; avec des mutations, un journal d'il y a cinq secondes t'affiche la valeur actuelle.
2. **Optimiser.** Si l'objet précédent est le même que le nouveau, rien à l'intérieur n'a pu changer. C'est cette comparaison en une seule étape que réalise React avec `Object.is`, et celle qu'utilisera la mémoïsation lorsque la Leçon 9 en mesurera l'impact.
3. **Les nouvelles fonctionnalités de React le supposent.** La documentation indique que les fonctionnalités en cours de développement dans React reposent sur le fait que l'état soit traité comme une photographie. Dans ce cours, tu le constateras avec `useOptimistic` dans la Leçon 7.

Si un jour ton état est si profondément imbriqué que copier manuellement devient illisible, la documentation mentionne Immer, une bibliothèque qui te permet d'écrire sous forme de mutation tout en produisant les copies pour toi ([React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state)). Ce cours ne l'utilise pas : l'état du `revisor` est délibérément plat, et la section suivante explique pourquoi.

### 2.3 La forme de l'état : cinq règles

#### 2.3.1 Les cinq règles, et ce que chacune évite

Savoir modifier l'état ne suffit pas ; il importe aussi de savoir **ce que** l'on stocke. La documentation de React propose cinq principes pour structurer l'état ([React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure)). Ils sont présentés ici en miroir du `revisor`, car chacun trouve son illustration dans le point de contrôle :

1. **Regroupe l'état lié.** Si tu modifies toujours deux variables en même temps, réunis-les en une seule. Dans le `revisor` : le résultat d'un chargement est une valeur unique `Carga`, et non un « rapport » d'un côté et un « détail de l'erreur » de l'autre que l'on modifierait constamment ensemble. `Carga` illustre les règles 1 et 2 à la fois : il regroupe le rapport et le détail de l'erreur (règle 1) et, s'agissant d'une union, empêche qu'ils ne se contredisent (règle 2).
2. **Évite les contradictions.** Si plusieurs morceaux d'état peuvent « être en désaccord », tu laisses la porte ouverte aux anomalies. L'exemple de la documentation montre deux drapeaux, `isSending` et `isSent`, qui ne devraient jamais être vrais en même temps et qui sont remplacés par un unique `status` à trois valeurs. Dans le `revisor`, c'est `Carga` depuis la leçon 0 : un `tipo` qui vaut `"cargando"`, `"listo"` ou `"error"`. Avec trois drapeaux `cargando`, `listo` et `conError`, il y aurait huit combinaisons possibles alors que trois seulement auraient du sens ; avec une union discriminée, les cinq cas impossibles ne peuvent même pas s'écrire. La documentation pose cela comme un objectif : qu'il n'y ait jamais en mémoire un état qui ne corresponde à aucun écran valide ([React, « Reacting to Input with State »](https://react.dev/learn/reacting-to-input-with-state)).
3. **Évite l'état redondant.** Si quelque chose peut être calculé pendant le rendu à partir des props ou de l'état existant, ne l'enregistre pas. Dans le `revisor` : la liste filtrée, le service sélectionné, le nombre de pannes et le fait qu'une ligne possède ou non une note. Aucun d'eux n'est un état ; tous les quatre se calculent.
4. **Évite la duplication.** Si la même donnée vit à deux endroits, les maintenir en accord devient ton problème. Dans le `revisor` : on stocke le **nom** du service sélectionné, et non l'objet service lui-même.
5. **Évite l'état trop imbriqué.** Un état hiérarchique est inconfortable à copier. Dans le `revisor` : les notes forment un registre plat par nom, `{ pagos: "…", reportes: "…" }`, distinct des états du rapport ; elles ne sont pas injectées à l'intérieur de chaque service.

Les règles 3 et 4 sont celles qui évitent le plus d'erreurs, et toutes deux ont leur démonstration.

#### 2.3.2 Conserver l'identifiant, pas l'objet

Lorsque la personne choisit `pagos`, la tentation est de stocker l'objet qui a été sélectionné : `{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }`. Tu l'as déjà sous la main, et pour afficher le détail, c'est précisément ce dont tu as besoin. Le problème est que cet objet **est déjà stocké** ailleurs : à l'intérieur du rapport. La documentation le formule ainsi : le contenu de l'élément sélectionné est le même objet que l'un de ceux de la liste, si bien que son information se trouve dupliquée à deux endroits ([React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure)). Tant que rien ne change, cela ne se remarque pas. Dans le `revisor`, quelque chose change toutes les dix secondes.

La quatrième figure met les deux stratégies côte à côte. Un écran reçoit la liste des états ; un composant stocke l'objet sélectionné et un autre stocke uniquement le nom et recherche l'objet lors du rendu. Puis arrive un nouveau rapport dans lequel `pagos` s'est rétabli :

```tsx
// fig02_04.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

const primerReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "falla" },
];
const segundoReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "disponible" },
];

function GuardaElObjeto({ estados }: { readonly estados: readonly Estado[] }) {
  const [elegido] = useState<Estado | null>(estados[1] ?? null);
  return <p>guarda el objeto: {elegido === null ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function GuardaElNombre({ estados }: { readonly estados: readonly Estado[] }) {
  const [seleccionado] = useState<string | null>("pagos");
  const elegido = estados.find((estado) => estado.nombre === seleccionado);
  return <p>guarda el nombre: {elegido === undefined ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function Pantalla({ estados }: { readonly estados: readonly Estado[] }) {
  const lista = estados.map((estado) => `${estado.nombre}=${estado.tipo}`).join(", ");
  return (
    <>
      <p>lista: {lista}</p>
      <GuardaElObjeto estados={estados} />
      <GuardaElNombre estados={estados} />
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);
const imprimir = (titulo: string) => {
  console.log(titulo);
  for (const parrafo of contenedor.querySelectorAll("p")) {
    console.log(`  ${parrafo.textContent}`);
  }
};

await act(async () => {
  raiz.render(<Pantalla estados={primerReporte} />);
});
imprimir("primer reporte, con pagos elegido:");

await act(async () => {
  raiz.render(<Pantalla estados={segundoReporte} />);
});
imprimir("llega el siguiente sondeo (pagos se recuperó):");

await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_04.tsx
$ node fig02_04.js
primer reporte, con pagos elegido:
  lista: catálogo=disponible, pagos=falla
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está falla
llega el siguiente sondeo (pagos se recuperó):
  lista: catálogo=disponible, pagos=disponible
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está disponible
```

La liste indique que `pagos` est disponible, et le composant qui a stocké l'objet persiste à dire qu'il est en panne : il détient une photographie qui date de l'interrogation périodique précédente, et personne ne la mettra à jour, car l'état n'est initialisé que lors du tout premier rendu. Celui qui a conservé le nom dit la vérité sans rien faire de particulier : à chaque rendu, il recherche `pagos` dans la liste qui vient d'arriver. Imagine l'opérateur de la scène d'ouverture lisant « En falla » dans le détail et « disponible » sur la ligne juste à côté, alors que l'astreinte est sur le point de débuter.

C'est pourquoi, dans le point de contrôle, `seleccionado` est de type `string | null` — le nom, ou rien — et le service choisi est recherché au moment du rendu, dans `ContenidoReporte` :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx (fragmento)
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

`elegido` n'est pas un état : c'est une constante dont la durée de vie est celle du rendu. La documentation propose exactement cette approche avec son `selectedId` : conserver uniquement l'identifiant, qui constitue l'information essentielle, et calculer le reste pendant le rendu ([React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure)). Et cela s'accompagne d'un avantage : si le service disparaît du rapport, `find` renvoie `undefined` et le détail n'est tout simplement pas affiché ; il n'est nullement nécessaire de « nettoyer » la sélection par du code additionnel ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)). Rechercher par nom est sûr tant que l'API respecte sa règle de ne pas avoir deux services portant le même nom, la même règle sur laquelle s'appuie la `key={estado.nombre}` de la leçon 1 ; si un jour l'API l'enfreignait, `find` renverrait le premier qu'il trouve et React signalerait dans la console les `key` en double.

#### 2.3.3 Ne pas stocker ce qui peut être calculé

La troisième règle connaît une variante que la documentation répète sur deux pages distinctes : **lorsque quelque chose peut être calculé à partir des props ou de l'état déjà existants, ne le place pas dans l'état ; calcule-le pendant le rendu** ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)). Dans le point de contrôle, il y a quatre calculs de ce genre, et aucun ne sollicite d'état :

- **La liste filtrée.** `filtrarEstados(estados, soloFallas)` est une nouvelle fonction pure de `resumen.ts`. Si la case est cochée, elle ne conserve que les pannes ; sinon, elle renvoie la même liste sans la copier.

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  soloFallas: boolean,
): readonly EstadoPublico[] {
  return soloFallas ? estados.filter((estado) => estado.tipo === "falla") : estados;
}
```

- **Le service sélectionné**, que tu viens de voir.
- **Le résumé.** `ResumenFallas` reçoit la liste **complète**, et non la liste filtrée, à dessein : « 4 servicios revisados · 2 servicios con falla » décrit ce que l'interrogation périodique a inspecté, et non ce que tu as choisi de laisser visible. La mesure Chrome le confirme : avec la case cochée, le résumé continue d'indiquer 4 et 2.
- **Le fait qu'une ligne possède une note.** `ListaEstados` transmet à chaque ligne `tieneNota={notas[estado.nombre] !== undefined}`. Il n'existe aucune liste distincte de « services avec note » qu'il faudrait maintenir à jour.

Et si ces calculs étaient lourds ? Filtrer quatre, ou même quatre cents éléments à chaque rendu ne l'est absolument pas. La démarche du cours est celle de son README : on mesure d'abord, on optimise ensuite, et la Leçon 9 apportera cette mesure. Enregistrer un calcul dans l'état « pour ne pas le répéter » n'est pas une optimisation : c'est une copie que quelqu'un doit maintenir synchronisée, et la manière la plus fréquente de la synchroniser — un Effect qui la recalcule — est précisément celle que le linter rejette, comme tu vas le constater dans « L'erreur que tu vas voir ».

### 2.4 Faire remonter l'état

#### 2.4.1 Chaque morceau d'état a un propriétaire

Tu sais désormais comment modifier l'état et que stocker. Il reste à décider **où**. La documentation pose cela comme un principe : pour chaque élément d'état unique, tu choisis le composant qui en est le « propriétaire », et c'est cela avoir une **source unique de vérité** ; cela ne signifie pas que tout l'état vive en un seul endroit, mais que chaque morceau a un composant bien défini qui en a la garde ([React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components)). Lorsque deux composants ont besoin de la même donnée, le propriétaire est leur **plus proche ancêtre commun** : on retire l'état des enfants, on l'installe chez le parent et on le leur transmet vers le bas par les props, avec les fonctions chargées de le modifier. C'est ce que la documentation appelle **faire remonter l'état** (*lifting state up*), et elle souligne qu'il s'agit de l'une des opérations les plus courantes en React ([React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components)).

Applique la question « qui en a besoin ? » aux trois nouveaux états du `revisor` :

| État | Qui le lit | Qui le modifie | Ancêtre commun |
|---|---|---|---|
| `soloFallas` | `FiltroFallas` (pour s'afficher) et `ContenidoReporte` (pour filtrer) | `FiltroFallas` | `Panel` |
| `seleccionado` | `FilaEstado` (pour `aria-pressed`) et `ContenidoReporte` (pour le détail) | `FilaEstado` et le bouton « Cerrar detalle » | `Panel` |
| `notas` | `FilaEstado` (le marqueur) et `EditorNota` (ce qui est enregistré) | `EditorNota` | `Panel` |
| `borrador` | uniquement `EditorNota` | uniquement `EditorNota` | `EditorNota` |

Les trois premiers remontent dans `Panel`. Le quatrième reste en bas, et il est tout aussi important de comprendre pourquoi : le brouillon correspond à ce que la personne est en train de taper **avant** de décider de l'enregistrer. Personne d'autre n'en a besoin, et s'il remontait dans `Panel`, chaque frappe de touche réafficherait l'intégralité du panneau au lieu du seul éditeur. Faire remonter n'est pas une fin en soi : l'état ne monte **que jusqu'au niveau où il est nécessaire, et pas un étage de plus**.

Voici comment se présente `Panel`, qui en est désormais le propriétaire :

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
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
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <ContenidoReporte
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Trois `useState`, un par morceau d'état, chacun doté de son type : `false` suffit à TypeScript pour déduire `boolean` ; `seleccionado` requiert `<string | null>` car il démarre à `null` et contiendra plus tard un nom ; `notas` démarre à `{}` avec le type `Notas`. Les fonctions descendent avec le préfixe `al` (`alCambiar`, `alSeleccionar`, `alGuardarNota`), qui est la convention de nommage du cours pour les props qui sont des fonctions. Remarque que deux d'entre elles sont directement les fonctions fournies par React : `alCambiar={establecerSoloFallas}` et `alSeleccionar={establecerSeleccionado}`. Les fonctions `establecer…` issues de `useState` sont stables — la référence de `useState` indique qu'elles disposent d'une identité stable, identique à chaque rendu ([React, `useState`](https://react.dev/reference/react/useState)) — et leur signature correspond exactement à ce qu'attend l'enfant, si bien qu'il n'est pas nécessaire de les envelopper.

#### 2.4.2 La case à cocher : un composant contrôlé

`FiltroFallas` ne détient aucun état. Il reçoit la valeur ainsi qu'une fonction, et se borne à afficher et à notifier :

```tsx
// revisor/src/reporte/FiltroFallas.tsx
export function FiltroFallas({
  soloFallas,
  alCambiar,
}: {
  readonly soloFallas: boolean;
  readonly alCambiar: (soloFallas: boolean) => void;
}) {
  return (
    <label className="filtro">
      <input
        type="checkbox"
        checked={soloFallas}
        onChange={(evento) => alCambiar(evento.target.checked)}
      />{" "}
      Solo fallas
    </label>
  );
}
```

Un élément `<input>` auquel on transmet `checked` est un **champ contrôlé** : c'est React qui décide s'il est coché, et non le navigateur. C'est pourquoi la documentation exige qu'avec `checked`, tu fournisses un `onChange` qui mette à jour cette valeur de manière synchrone ; sans cela, le champ reste en lecture seule et React le signale dans la console par « You provided a `checked` prop to a form field without an `onChange` handler » ([React, `<input>`](https://react.dev/reference/react-dom/components/input)). Pour une case à cocher, on lit `evento.target.checked`, et non `evento.target.value`, ce qui constitue un autre oubli courant relevé par la même page. De plus, la case est imbriquée dans son `<label>` : ainsi, cliquer sur le texte « Solo fallas » permet aussi de la cocher, et un lecteur d'écran annonce la case avec son intitulé. C'est du HTML natif, sans ARIA.

Le terme « contrôlé » s'applique également à des composants entiers : la documentation qualifie de contrôlé un composant dont les informations essentielles proviennent de ses props et non de son propre état, et de non contrôlé celui qui les conserve lui-même ([React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components)). `FiltroFallas` est contrôlé ; `EditorNota`, avec son brouillon, est non contrôlé. Attention à ce double sens : le `<textarea>` d'`EditorNota` est un champ contrôlé (sa valeur est fixée par `borrador`), mais le composant en lui-même est non contrôlé, car ce `borrador` vit en son sein et `Panel` ne peut y toucher. Le premier terme concerne le champ de formulaire ; le second, le composant ; la documentation précise d'ailleurs elle-même que « contrôlé » et « non contrôlé » ne sont pas des termes techniques au sens strict. Aucun des deux n'est supérieur à l'autre : le contrôlé permet au parent d'orchestrer ; le non contrôlé est plus aisé à employer. La Leçon 7 reviendra sur cette nuance à propos des formulaires.

#### 2.4.3 La ligne : un bouton qui indique s'il est sélectionné

Pour sélectionner un service, le nom de chaque ligne devient un bouton :

```tsx
// revisor/src/reporte/FilaEstado.tsx
import type { EstadoPublico } from "../compartido/contrato";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  if (estado.tipo === "disponible") {
    return (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    );
  }

  return <>falla ({estado.detalle})</>;
}

export function FilaEstado({
  estado,
  seleccionado,
  tieneNota,
  alSeleccionar,
}: {
  readonly estado: EstadoPublico;
  readonly seleccionado: boolean;
  readonly tieneNota: boolean;
  readonly alSeleccionar: (nombre: string | null) => void;
}) {
  return (
    <li className={estado.tipo}>
      <button
        type="button"
        className="seleccionar"
        aria-pressed={seleccionado}
        onClick={() => alSeleccionar(seleccionado ? null : estado.nombre)}
      >
        {estado.nombre}
      </button>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

Plusieurs décisions en peu de lignes :

- **Un `<button>`, pas un `<span>` avec `onClick`.** Un bouton natif est accessible avec la touche Tab, s'active avec Entrée ou la barre d'espace, et un lecteur d'écran l'annonce comme bouton. Avec un `<span>`, tu devrais reconstituer tout cela manuellement.
- **`aria-pressed`, et un bouton qui bascule vraiment.** Indique l'état enfoncé d'un bouton bascule : avec `true` ou `false`, le bouton est annoncé comme un élément activable et précise s'il l'est actuellement ([MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)). C'est pourquoi le clic dit `seleccionado ? null : estado.nombre` : selon MDN, un bouton bascule passe à `true` quand on l'enfonce une fois et revient à `false` quand on l'enfonce une autre fois, et un lecteur d'écran qui annonce « enfoncé » invite à l'enfoncer de nouveau. Si le clic renvoyait toujours le même nom, le bouton dirait qu'il peut basculer et ne basculerait pas. Mesuré : en cliquant deux fois sur `pagos`, le détail apparaît puis disparaît, et `aria-pressed` passe de `true` à `false` (`node medir.mjs alternar`, sortie dans `ejercicios/medir-alternar.salida.txt`). MDN demande en outre de ne pas modifier le texte du bouton lorsque cet état bascule, et le `revisor` respecte cette consigne : le bouton indique `pagos`, qu'il soit sélectionné ou non. La feuille de style utilise ce même attribut pour épaissir le soulignement, avec le sélecteur `.seleccionar[aria-pressed="true"]` : ce que l'œil perçoit et ce que le lecteur d'écran énonce proviennent de la même donnée.
- **`className={estado.tipo}`.** La classe CSS de la ligne, `disponible` ou `falla`, correspond exactement au texte du type, si bien qu'un `if` avec deux `<li>` quasi identiques n'est plus nécessaire. Le `if` qui distingue les deux cas a été déplacé dans `Descripcion`, un petit composant chargé d'afficher le texte. Il est défini **en dehors** de `FilaEstado`, jamais à l'intérieur, selon la règle de la leçon 1 : un composant défini au sein d'un autre devient un composant nouveau à chaque rendu, et son état serait réinitialisé sans crier gare ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)).
- **`{tieneNota && …}`.** Ici, `&&` est sûr car `tieneNota` est un booléen ; le piège du `0` de la leçon 1 ne surgit que lorsque la condition est numérique.
- **La ligne ne sait pas ce qui est sélectionné globalement.** Elle reçoit `seleccionado: boolean`, déjà calculé par la liste. La ligne est pure : mêmes props, même rendu.

La liste prend en charge les calculs par ligne et ne conserve rien :

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";
import type { Notas } from "./notas";

export function ListaEstados({
  estados,
  seleccionado,
  notas,
  alSeleccionar,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
}) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          seleccionado={estado.nombre === seleccionado}
          tieneNota={notas[estado.nombre] !== undefined}
          alSeleccionar={alSeleccionar}
        />
      ))}
    </ul>
  );
}
```

Son `alSeleccionar` accepte `string | null`, comme celui de `Panel` : le `null` signifie « aucun sélectionné ». Il est envoyé par la ligne quand on clique de nouveau sur le service déjà sélectionné, et aussi par un autre élément, le bouton « Cerrar detalle ».

#### 2.4.4 Celui qui répartit

`ContenidoReporte` reçoit l'ensemble et détermine ce qu'il faut afficher. Le cas `"listo"` dispose à présent de ses propres accolades afin de déclarer les trois constantes calculées présentées en 2.3 :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { DetalleSeleccion } from "./DetalleSeleccion";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";
import type { Carga } from "./useReporte";

export function ContenidoReporte({
  carga,
  soloFallas,
  seleccionado,
  notas,
  alSeleccionar,
  alGuardarNota,
}: {
  readonly carga: Carga;
  readonly soloFallas: boolean;
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
}) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo": {
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);

      return (
        <>
          <ResumenFallas estados={estados} />
          <ListaEstados
            estados={visibles}
            seleccionado={seleccionado}
            notas={notas}
            alSeleccionar={alSeleccionar}
          />
          {elegido !== undefined && (
            <DetalleSeleccion
              estado={elegido}
              notas={notas}
              alGuardarNota={alGuardarNota}
              alCerrar={() => alSeleccionar(null)}
            />
          )}
        </>
      );
    }
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Remarque deux éléments. Le premier : le détail est recherché dans `estados`, la liste intégrale, et non dans `visibles`. C'est un choix délibéré, et non une négligence, et l'exercice 3 t'invitera à y réfléchir. Le second : `alCerrar={() => alSeleccionar(null)}` est la seule nouvelle fonction créée ici ; « fermer » ne consiste en rien d'autre qu'à ne rien sélectionner.

### 2.5 `key` pour réinitialiser l'état

#### 2.5.1 L'état vit dans une position, pas dans le composant

Reste le second dysfonctionnement de la scène d'ouverture : le brouillon qui persiste. Pour le comprendre, il est nécessaire de savoir **où** React conserve l'état d'un composant. Il ne le conserve pas « à l'intérieur » de la fonction ni au sein du JSX : il l'associe à la **position** qu'occupe le composant dans l'arbre affiché. Tant qu'à cette position se trouve le même composant rendu, React conserve son état ; si ce composant disparaît, ou si un autre s'affiche à cet endroit, il le détruit ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)).

Pense à l'éditeur de notes. Tu sélectionnes `pagos` : à l'emplacement de l'éditeur s'affiche un `EditorNota` avec `nombre="pagos"`. Tu écris. Tu sélectionnes `reportes` : à **la même position** s'affiche **le même composant**, `EditorNota`, désormais doté de `nombre="reportes"`. Pour React, rien n'indique qu'il s'agisse d'un autre éditeur : une prop a changé, comme change n'importe quelle prop, et l'état `borrador` est maintenu. La documentation s'appuie sur un cas quasi identique, celui d'un chat où le texte tapé pour un destinataire reste présent lorsque l'on sélectionne une autre personne, et le signale explicitement : dans bien des applications, c'est le comportement attendu, mais pas dans un chat, car quelqu'un pourrait expédier au mauvais contact un message déjà rédigé ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). Dans le `revisor`, cela se traduit par une note destinée à `pagos` qui se retrouve enregistrée sur `reportes`.

La troisième figure reproduit cela avec un éditeur minimal conservant son brouillon, et l'affiche deux fois : sans `key`, puis avec `key={nombre}`.

```tsx
// fig02_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom comprueba al cargarse si existe `window.document` y si el documento
// admite el evento `input`, así que se importa después de que exista `window`
// (los import de arriba se cargan antes).
const { createRoot } = await import("react-dom/client");

function Editor({ nombre }: { readonly nombre: string }) {
  const [borrador, establecerBorrador] = useState("");

  return (
    <label>
      {`Nota sobre ${nombre}`}
      <textarea value={borrador} onChange={(evento) => establecerBorrador(evento.target.value)} />
    </label>
  );
}

function Detalle({ nombre, conKey }: { readonly nombre: string; readonly conKey: boolean }) {
  return conKey ? <Editor key={nombre} nombre={nombre} /> : <Editor nombre={nombre} />;
}

function escribir(area: HTMLTextAreaElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set;
  asignar?.call(area, texto);
  area.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function probar(conKey: boolean): Promise<void> {
  console.log(conKey ? "con key={nombre}:" : "sin key:");
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  const leer = () =>
    `«${contenedor.querySelector("label")?.firstChild?.textContent}» → borrador «${contenedor.querySelector("textarea")?.value}»`;

  await act(async () => {
    raiz.render(<Detalle nombre="pagos" conKey={conKey} />);
  });
  await act(async () => {
    const area = contenedor.querySelector("textarea");
    if (area !== null) {
      escribir(area, "llamar al proveedor");
    }
  });
  console.log(`  escribes en pagos:    ${leer()}`);

  await act(async () => {
    raiz.render(<Detalle nombre="reportes" conKey={conKey} />);
  });
  console.log(`  eliges reportes:      ${leer()}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await probar(false);
await probar(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_03.tsx
$ node fig02_03.js
sin key:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «llamar al proveedor»
con key={nombre}:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «»
```

Sans `key`, l'intitulé de l'éditeur devient « Nota sobre reportes », mais le brouillon affiche toujours « llamar al proveedor » : la prop a changé et l'état est resté. Avec `key={nombre}`, le brouillon redevient vide. (Une précision au sujet de la figure : à la différence de celles de la leçon 0, elle importe `react-dom/client` **après** avoir créé `window`. react-dom vérifie à son chargement si `window.document` existe et si le document prend en charge l'événement `input`, et c'est ce résultat qui détermine la manière de détecter qu'on écrit dans un `<textarea>` (on l'a lu dans le code du paquet installé, `react-dom-client.development.js` : les variables `canUseDOM` et `isInputEventSupported` ; ce n'est pas quelque chose que décrit la documentation de React). S'il est chargé avant qu'une fenêtre n'existe, cette vérification est négative et la saisie provoquée par la figure n'arrive pas correctement à `onChange`. Dans un vrai navigateur, la fenêtre existe toujours en premier, si bien que dans le `revisor`, rien de tout cela n'est nécessaire.)

#### 2.5.2 Ce que fait la `key`

Dans la leçon 1, tu as utilisé `key` au sein d'une liste afin que React identifie chaque ligne d'un rendu à l'autre. C'est exactement le même mécanisme : **une `key` indique à React d'inclure la `key` elle-même dans la définition de la position**, au lieu de se baser uniquement sur l'ordre dans le parent ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). Et la documentation le souligne : les `key` ne sont pas réservées aux listes. Avec `key="pagos"` puis `key="reportes"`, il s'agit pour React de **deux éditeurs distincts** : il démonte le premier avec tout son état et en monte un nouveau, qui redémarre depuis `useState(…)` comme au premier jour. Les `key` n'ont pas besoin d'être uniques dans toute l'application ; elles ne font que discriminer les positions au sein d'un même parent ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)).

La documentation donne à cet usage un intitulé précis dans « You Might Not Need an Effect » : **réinitialiser tout l'état lorsqu'une prop change**. Son exemple est un profil recevant `key={userId}` afin que, lors d'un changement d'utilisateur, le commentaire à moitié tapé et tout autre état sous-jacent soient remis à zéro ; elle qualifie explicitement d'approche « à éviter » l'alternative consistant à réinitialiser l'état depuis un Effect ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)). C'est le second grand principe du cours qui se fait jour avant la Leçon 3 : ce qui peut se résoudre par la structure ne se résout pas avec un Effect.

Dans le point de contrôle, la `key` est située dans `DetalleSeleccion`, l'encadré du service sélectionné :

```tsx
// revisor/src/reporte/DetalleSeleccion.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { EditorNota } from "./EditorNota";
import type { Notas } from "./notas";

export function DetalleSeleccion({
  estado,
  notas,
  alGuardarNota,
  alCerrar,
}: {
  readonly estado: EstadoPublico;
  readonly notas: Notas;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  return (
    <aside className="detalle" aria-label={`Detalle de ${estado.nombre}`}>
      <h3>{estado.nombre}</h3>
      <p>
        {estado.tipo === "disponible"
          ? `Disponible: HTTP ${estado.codigoHttp} en ${estado.duracionMs} ms`
          : `En falla: ${estado.detalle}`}
      </p>
      <EditorNota
        key={estado.nombre}
        nombre={estado.nombre}
        notaGuardada={notas[estado.nombre] ?? ""}
        alGuardar={alGuardarNota}
      />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

`key={estado.nombre}` exprime exactement ce qu'il signifie : un éditeur pour la note de `pagos` et un éditeur pour celle de `reportes` sont, conceptuellement, deux éditeurs différents. C'est ce que dit la documentation pour son application de chat : une conversation avec une personne est différente d'une conversation avec une autre, il est donc logique de lui attribuer une `key` selon l'interlocuteur ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). Une précision relative à l'accessibilité : l'encadré est un `<aside>` avec `aria-label="Detalle de pagos"`, de sorte qu'un lecteur d'écran l'énonce comme un contenu complémentaire nommé, « Detalle de pagos ». L'attribut `aria-label` n'a rien d'un ornement : comme le `<aside>` se trouve à l'intérieur de la `<section>` de `Tarjeta`, sans libellé il perdrait ce rôle sémantique pour devenir un simple conteneur générique ([MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside)). Enfin, la description de l'état utilise l'opérateur ternaire sur `estado.tipo`, que TypeScript affine dans chaque branche : dans la première, il sait qu'existent `codigoHttp` et `duracionMs` ; dans la seconde, `detalle`.

#### 2.5.3 L'éditeur : un état local avec une valeur initiale

```tsx
// revisor/src/reporte/EditorNota.tsx
import { useState } from "react";

export function EditorNota({
  nombre,
  notaGuardada,
  alGuardar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardar: (nombre: string, texto: string) => void;
}) {
  const [borrador, establecerBorrador] = useState(notaGuardada);

  return (
    <div className="editor-nota">
      <label>
        Nota sobre {nombre}
        <textarea
          rows={3}
          value={borrador}
          onChange={(evento) => establecerBorrador(evento.target.value)}
        />
      </label>
      <button type="button" onClick={() => alGuardar(nombre, borrador)}>
        Guardar nota
      </button>
    </div>
  );
}
```

`borrador` commence avec `notaGuardada`, la note préexistante ou `""`. Cela mérite une précision, car la documentation met en garde contre quelque chose qui y ressemble : copier une prop dans l'état. Son exemple montre un message qui effectue `useState(messageColor)` : si le parent transmet ultérieurement une autre couleur, l'état ne s'en aperçoit pas, parce que **l'état n'est initialisé que lors du premier rendu** ([React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure)). La même page indique le cas où cela a du sens : lorsque tu **souhaites** explicitement ignorer les modifications futures de la prop, auquel cas il convient que son nom commence par `initial` ou `default` pour que cela soit apparent.

Ici, c'est précisément le comportement recherché. Pendant que la personne tape, le brouillon ne doit pas être réinitialisé sous prétexte qu'un nouveau rapport arrive ; il ne doit repartir à zéro que lors d'un changement de service. Et c'est la `key` de `DetalleSeleccion` qui s'en charge : chaque fois que le service change, l'éditeur est monté de nouveau et `useState(notaGuardada)` relit la note enregistrée de **ce** service. C'est pourquoi, dans la mesure effectuée avec Chrome, revenir sur `pagos` affiche « llamar al proveedor », la note enregistrée, et non le brouillon resté non sauvegardé. Le tandem « valeur initiale + `key` » forme le motif complet ; retirer l'un des deux éléments brise l'ensemble.

Et si l'on souhaitait **conserver** le brouillon non enregistré de chaque service pour le retrouver au retour ? La documentation offre trois pistes : rendre l'ensemble des éditeurs et masquer les inactifs, stocker les brouillons dans un autre emplacement, ou faire remonter l'état au parent, ce qu'elle désigne comme la solution la plus classique ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). Dans le `revisor`, « faire remonter » est déjà appliqué pour ce qui importe : la note enregistrée vit dans `Panel`. Le brouillon non sauvegardé est écarté délibérément.

### 2.6 Le parcours complet

Avec l'état remonté et la `key` en place, il ne manque que la feuille de style. Voici les règles qui viennent s'ajouter à la fin de `panel.css`, l'unique feuille du cours, qui s'étoffe leçon après leçon :

```css
/* revisor/src/reporte/panel.css (fragmento: lo que se agrega al final) */
.seleccionar {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  font-weight: bold;
  padding: 0;
  text-decoration: underline;
}

.seleccionar[aria-pressed="true"] {
  text-decoration-thickness: 3px;
}

.detalle {
  background: #f6f8fa;
  border-radius: 0.5rem;
  margin: 1rem 0;
  padding: 0.5rem 1rem 1rem;
}

.editor-nota textarea {
  display: block;
  margin: 0.5rem 0;
  width: 100%;
}
```

`.seleccionar` retire au bouton son apparence de bouton ordinaire pour le réduire à un nom en gras, souligné pour mettre en évidence qu'il est cliquable ; `font: inherit` fait en sorte qu'il hérite de la même police que le reste de la ligne, car les boutons n'en héritent pas par défaut. Le reste du fichier est celui de la leçon 1. Les autres fichiers du point de contrôle — `main.tsx`, `useReporte.ts`, `cargar.ts`, `contrato.ts`, `Tarjeta`, `ResumenFallas`, la configuration et le serveur d'entraînement — ne sont pas modifiés dans cette leçon ; le fichier `package.json` passe simplement sa version à `0.2.0`.

La vérification du point de contrôle se déroule comme d'habitude, depuis `~/curso-react/revisor/` :

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0

$ npm run build

> revisor@0.2.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 30 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-CGNql20r.css    0.68 kB │ gzip:  0.38 kB
dist/assets/index-7jh0TEYR.js   224.30 kB │ gzip: 70.28 kB

✓ built in 189ms
```

Le linter ne formule aucune remarque et la construction se conclut par `index-7jh0TEYR.js`, le nom exact apparu tant sous macOS que sous Linux. Ce nom étant dérivé du contenu, si ton `revisor` est rigoureusement identique au point de contrôle, tu obtiendras le même. Avec `npm run servidor` dans un terminal et `npm run dev` (ou `npm run preview`) dans un autre, ouvre la page et parcours-la. Voici ce qu'a mesuré Chrome en mode headless sur la version construite, servie avec `vite preview`, pas à pas, à l'aide de `node medir.mjs recorrido` :

```text
1. al cargar
   resumen: 4 servicios revisados · 2 servicios con falla
   botones: catálogo aria-pressed=false, pagos aria-pressed=false, inventario aria-pressed=false, reportes aria-pressed=false
2. marcas «Solo fallas»
   filas: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado)
   resumen: 4 servicios revisados · 2 servicios con falla
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
7. cierras el detalle
   ¿hay detalle?: false · pagos aria-pressed: false
```

Chaque ligne trouve son explication dans la leçon. L'étape 1 montre les boutons avec `aria-pressed="false"` (2.4.3). L'étape 2 montre la liste filtrée avec le résumé inchangé (2.3.3). L'étape 3 montre le bouton sélectionné à `true` et le détail résolu par le nom (2.3.2). L'étape 4 montre la note copiée dans l'état et la mention « con nota » sur la ligne (2.2). L'étape 5 montre le brouillon non sauvegardé qui **ne s'est pas** propagé à `reportes` (2.5). L'étape 6 montre la note enregistrée qui réapparaît au retour sur `pagos`, lue par l'éditeur nouvellement monté (2.5.3). Et l'étape 7 illustre « fermer » comme le fait de ne rien sélectionner (2.4.4). Arrête tout avec Ctrl+C dans chaque terminal.

## L'erreur que tu vas voir

Cette leçon présente deux erreurs que les outils interceptent, et une qu'aucun outil ne perçoit.

**La mutation de la scène d'ouverture.** Dans une copie du point de contrôle, modifie `guardarNota` dans `Panel.tsx` de façon à ajouter la note à l'objet déjà existant :

```tsx
// guardarNota mutando (fragmento; en una copia, nunca en el punto de control)
  function guardarNota(nombre: string, texto: string): void {
    notas[nombre] = texto;
    establecerNotas(notas);
  }
```

Deux garde-fous distincts l'interrompent, chacun à sa manière. D'abord, `tsc` :

(Les modifications exactes de la copie se trouvent dans `ejercicios/copia-mutando.diff.txt` et les sorties complètes dans `ejercicios/copia-mutando.lint-tsc.salida.txt`.)

```text
$ npx tsc -b
src/reporte/Panel.tsx(6,10): error TS6133: 'conNota' is declared but its value is never read.
src/reporte/Panel.tsx(23,5): error TS2542: Index signature in type 'Readonly<Record<string, string>>' only permits reading.
```

La seconde ligne est celle qui compte : le type `Notas` est `Readonly`, son index « n'autorise que la lecture ». (La première ligne en découle : `conNota` n'est plus utilisé.) Puis ESLint, au moyen de la règle `immutability` du paquet React :

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/Panel.tsx
   6:10  error  'conNota' is defined but never used  @typescript-eslint/no-unused-vars
  23:5   error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/revisor/src/reporte/Panel.tsx:23:5
  21 |
  22 |   function guardarNota(nombre: string, texto: string): void {
> 23 |     notas[nombre] = texto;
     |     ^^^^^ `notas` cannot be modified
  24 |     establecerNotas(notas);
  25 |   }
  26 |  react-hooks/immutability

✖ 2 problems (2 errors, 0 warnings)
```

« Modifier une valeur renvoyée par `useState()`, qui ne doit pas être modifiée directement. Utilise plutôt la fonction de mise à jour. » La règle contrôle que l'on ne mute pas les props, l'état ou toute autre valeur que React traite comme immuable ; sa documentation indique que les props et l'état d'un composant sont des photographies immuables ([React, « immutability »](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability)). Remarque qu'elle bloque la mutation même si le type n'était pas `Readonly` : la figure 2 utilise un `Record<string, string>` dépourvu de `Readonly`, et `tsc` la compile sans broncher, mais le linter la rejette tout autant :

```text
$ npx eslint fig02_02.tsx

~/curso-react/figuras/fig02_02.tsx
  22:5  error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/figuras/fig02_02.tsx:22:5
  20 |
  21 |   function mutar(): void {
> 22 |     notas.pagos = "se reinició a las 9:40";
     |     ^^^^^ `notas` cannot be modified
  23 |     establecerNotas(notas);
  24 |   }
  25 |  react-hooks/immutability

✖ 1 problem (1 error, 0 warnings)
```

C'est pourquoi le `revisor` dispose des deux protections : le type t'alerte dans l'éditeur pendant que tu tapes, et le linter intercepte la mutation même si quelqu'un oublie le `Readonly`. Le correctif est celui vu en 2.2 : `establecerNotas((actuales) => conNota(actuales, nombre, texto))`.

**Stocker ce qui peut être calculé, et le synchroniser avec un Effect.** Dans une autre copie, au lieu de passer directement à l'éditeur `notas[estado.nombre] ?? ""`, `DetalleSeleccion` stocke la note dans son propre état et la « maintient à jour » par un Effect :

```tsx
// DetalleSeleccion con estado redundante (fragmento; en una copia)
  const [notaGuardada, establecerNotaGuardada] = useState("");

  useEffect(() => {
    establecerNotaGuardada(notas[estado.nombre] ?? "");
  }, [notas, estado.nombre]);
```

`tsc -b` ne trouve rien à redire : les types sont valides. Le linter, en revanche, intervient (`ejercicios/copia-efecto.diff.txt` et `ejercicios/copia-efecto.lint-tsc.salida.txt`) :

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx
  20:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx:20:5
  18 |
  19 |   useEffect(() => {
> 20 |     establecerNotaGuardada(notas[estado.nombre] ?? "");
     |     ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  21 |   }, [notas, estado.nombre]);
  22 |
  23 |   return (  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

Il s'agit de la règle `set-state-in-effect`, celle-là même que la leçon 0 t'a montrée dans `useReporte`. Elle apparaît ici pour la raison évoquée en 2.3.3 : `notaGuardada` est la copie d'une donnée déjà présente dans `notas`, et l'Effect n'existe que pour aligner la copie sur l'original. Cela coûte un rendu supplémentaire à chaque modification — d'abord avec l'ancienne copie, puis avec la nouvelle — et, pire encore, cela génère un bogue bien visible. Lors d'un changement de service, `DetalleSeleccion` n'est pas remonté : il est à la même position et constitue le même composant, de sorte que lors de ce rendu, son `notaGuardada` porte encore la valeur du service **précédent**. L'éditeur, qui lui est remonté grâce à sa `key`, démarre avec cette ancienne valeur et, comme expliqué en 2.5.3, n'écoute plus ce qui lui parvient par la suite lorsque l'Effect vient rectifier la copie. Une fois cette copie construite et mesurée avec Chrome en mode headless (`node medir.mjs efecto`) :

```text
a. guardas una nota en pagos, eliges catálogo y regresas: Detalle de pagos · borrador: ""
b. guardas una nota en catálogo y eliges pagos: Detalle de pagos · borrador: "revisar el disco"
   filas: catálogo: disponible (HTTP 200, 42 ms) · con nota | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
```

À l'étape a, `catálogo` ne possédait pas de note, de sorte que l'éditeur de `pagos` démarre vide : la ligne indique pourtant « con nota » et l'utilisateur ne voit rien. À l'étape b, `catálogo` en possède une, et l'éditeur de `pagos` démarre avec **la note de `catálogo`** : c'est le dysfonctionnement de la scène d'ouverture, une note d'un service prête à être collée sur un autre, avec une origine différente. La solution ne consiste pas à faire taire la règle, mais à supprimer l'état ainsi que l'Effect : ce qui peut être calculé, on le calcule.

**L'erreur que personne ne voit : retirer la `key`.** Dans une troisième copie, supprime la ligne `key={estado.nombre}` dans `DetalleSeleccion.tsx` :

(Sortie dans `ejercicios/copia-sin-key.lint-tsc.salida.txt` ; la modification, dans `ejercicios/copia-sin-key.diff.txt`.)

```text
$ npx tsc -b; echo "tsc: $?"
tsc: 0
$ npx eslint . --max-warnings 0; echo "lint: $?"
lint: 0
```

Tous deux au vert, et le panneau hérite du dysfonctionnement de la scène d'ouverture : le brouillon se propage d'un service à l'autre. Aucune règle du linter du cours ne détecte que, pour toi, un éditeur pour `pagos` et un éditeur pour `reportes` sont deux entités distinctes ; c'est un choix de conception métier, et non de syntaxe. On ne s'en aperçoit qu'en manipulant le panneau, ou au moyen d'un test de composant qui le manipule à notre place : la Leçon 8 t'apprendra à les écrire. C'est le même constat que celui laissé par le nettoyage manquant de la leçon 0 : le linter et les types forment deux lignes de défense, pas l'intégralité du dispositif.

## Ce qui se fait de travers

**Lire l'état immédiatement après l'avoir modifié.** `establecerX(nuevo); console.log(x)` affiche la valeur de la photographie du rendu en cours, c'est-à-dire l'ancienne (dans un gestionnaire d'événement, comme ceux-ci). Si tu as besoin de la nouvelle valeur au sein du même gestionnaire, enregistre-la au préalable dans une constante.

**Passer la valeur brute quand la valeur suivante dépend de la précédente.** `establecerN(n + 1)` fonctionne jusqu'au jour où elle est appelée deux fois lors du même clic, ou depuis une fonction générée lors d'un rendu antérieur. Si la nouvelle valeur est calculée à partir de l'ancienne, passe une fonction.

**Muter et repasser le même objet.** React compare avec `Object.is` ; un objet retouché demeure le même objet, et l'écran ne change pas. Ou alors il change avec retard, lorsqu'un autre élément déclenche un rendu, ce qui est pire encore puisque cela semble fonctionner.

**Ne copier que le premier niveau d'un état imbriqué.** La décomposition est superficielle. Si ton état renferme des objets au sein d'objets, chaque niveau modifié doit être copié ; mieux encore, aplatis-le.

**Trois drapeaux là où un `tipo` suffit.** `cargando`, `listo` et `conError` sous forme de booléens distincts autorisent des combinaisons qui ne correspondent à aucun écran réel. Une union discriminée interdit purement et simplement de les écrire.

**Conserver l'objet sélectionné.** Il s'agit d'une copie d'un élément de la liste qui deviendra obsolète à l'interrogation périodique suivante. Conserve l'identifiant et résous l'objet au moment du rendu.

**Stocker ce qui peut être calculé, et pire encore, le synchroniser avec un Effect.** Une liste filtrée, un total ou un élément sélectionné ne constituent pas un état. Les calculer pendant le rendu est plus simple, plus rapide et prémunit contre toute désynchronisation.

**Faire trop remonter l'état.** Monter le brouillon d'une zone de texte jusqu'au composant racine force chaque frappe de touche à réafficher l'écran tout entier. L'état ne doit remonter que jusqu'à l'ancêtre commun des éléments qui l'utilisent, pas un niveau plus haut.

**Réinitialiser l'état avec un Effect lorsqu'une prop change.** Un Effect qui remet le brouillon à `""` lorsque `nombre` change effectue un premier rendu avec l'ancien brouillon, puis un second avec la valeur vide. Une `key` accomplit cela en une seule étape et le rend explicite dans le code.

**Définir un composant à l'intérieur d'un autre.** Cela produit un composant inédit à chaque rendu : React constate une modification à la même position et détruit son état sans avertissement. C'est la règle de la leçon 1, et tu comprends désormais ce que perd quiconque l'enfreint.

## Exercices

### Exercice 1 — Prédis le bouton

Enregistre une copie de `fig02_01.tsx` sous le nom `ejercicio1.tsx` dans `~/curso-react/figuras/` et remplace-y les trois appels de `ConValor` par ceux-ci :

```tsx
// ejercicio 1 (fragmento)
    establecerRevisiones(revisiones + 5);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones(revisiones + 1);
```

Modifie également le titre de l'appel pour que la sortie reflète ce que tu as exécuté : `await hacerClic("ejercicio (+5, actualizadora, +1):", ConValor);`.

**Avant de l'exécuter**, consigne dans ton journal de bord quel nombre le bouton affichera après le clic et pourquoi, en parcourant la file d'attente des mises à jour ligne par ligne. Ensuite, compile et exécute.

### Exercice 2 — Compte les notes sans nouvel état

Ajoute au titre de la carte, ou juste sous le résumé, un texte indiquant « Notas guardadas: N » avec le nombre de services pourvus d'une note. La contrainte : **tu ne peux ajouter aucun `useState`**. Avant d'écrire, réponds : quelle règle de structuration t'interdit un état `cuantasNotas`, et que devrais-tu penser à faire dans `guardarNota` si tu l'avais ?

### Exercice 3 — Le détail et le filtre

Le panneau étant ouvert, sélectionne `catálogo` puis coche « Solo fallas ». **Avant de le faire**, prédis : le détail de `catálogo` reste-t-il visible ? Vérifie-le et explique pourquoi, en désignant la ligne de `ContenidoReporte` responsable. Ensuite, modifie le panneau de sorte que le détail disparaisse lorsque le service sélectionné est écarté par le filtre, **sans ajouter d'état et sans effacer `seleccionado`**. Que devient la sélection si tu décoches la case ?

### Exercice 4 — La `key` manquante, manuellement

Dans une copie du point de contrôle, retire `key={estado.nombre}` de `DetalleSeleccion.tsx`. Vérifie que `npm run lint` et `npm run build` restent au vert. Ouvre le panneau, sélectionne `pagos`, écris un brouillon **sans l'enregistrer** et sélectionne `reportes`. Note ce que tu observes. Enregistre ensuite une note sur `pagos`, choisis `catálogo` et reviens à `pagos` : qu'affiche l'éditeur et pourquoi ? Rétablis la `key` une fois terminé.

## Solutions

### Solution 1

Le bouton affiche `1`. La file d'attente des mises à jour, dans l'ordre :

| Dans la file | Reçoit | Résultat |
|---|---|---|
| « remplacer par `revisiones + 5` », avec `revisiones` à `0` | — | `5` |
| `(actual) => actual + 1` | `5` | `6` |
| « remplacer par `revisiones + 1` », avec `revisiones` à `0` | — | `1` |

Le dernier appel ne dépend pas de ce qui précède : il remplace la valeur par `0 + 1`, car la photographie dont dispose le gestionnaire mentionne toujours `0`. Voici le résultat de l'exécution (le fichier et sa sortie se trouvent dans `ejercicios/ejercicio1.tsx` et `ejercicios/ejercicio1.salida.txt`) :

```text
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx ejercicio1.tsx
$ node ejercicio1.js
ejercicio (+5, actualizadora, +1):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

La seconde moitié correspond à celle de la figure, restée inchangée. La documentation de React propose un exercice de même forme, comportant un remplacement après une fonction de mise à jour ([React, « Queueing a Series of State Updates »](https://react.dev/learn/queueing-a-series-of-state-updates)). La leçon à retenir : combiner les deux formes sur le même état au sein d'un même gestionnaire est syntaxiquement valide, mais quiconque lit le code doit reconstituer ce tableau mentalement. Si tu te surprends à devoir le faire, opte pour une forme unique.

### Solution 2

Le nombre se calcule pendant le rendu, à partir de `notas`, dans `Panel` :

```tsx
// Panel.tsx (fragmento de la solución)
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <p>Notas guardadas: {Object.keys(notas).length}</p>
```

Un état `cuantasNotas` violerait la règle 3, l'état redondant : c'est une information qui se calcule directement depuis `notas`. Si tu le possédais, `guardarNota` devrait mettre à jour deux états à chaque opération, et de surcroît décider s'il convient d'ajouter un (nouvelle note), de laisser inchangé (note modifiée) ou de soustraire un (note supprimée avec un texte vide). Grâce au calcul dérivé, `conNota` prend déjà toutes ces décisions et le décompte provient toujours de `notas`, de sorte qu'il ne peut pas se retrouver désynchronisé par rapport à elles. Remarque également que `&&` n'est pas nécessaire : afficher un `0` ici est précisément ce que l'on souhaite.

### Solution 3

Oui : le détail de `catálogo` demeure visible bien que sa ligne n'apparaisse plus. C'est ce qu'a mesuré Chrome en mode headless sur le point de contrôle (`node medir.mjs filtro`) :

```text
a. eliges catálogo: Detalle de catálogo
b. marcas «Solo fallas»: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado) · Detalle de catálogo
c. desmarcas: Detalle de catálogo
```

La ligne responsable au sein de `ContenidoReporte` est la suivante :

```tsx
// ContenidoReporte.tsx (fragmento)
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

Elle effectue la recherche dans `estados`, la liste intégrale, et non dans `visibles`. Pour que le détail disparaisse sous l'effet du filtre, il suffit d'effectuer la recherche dans la liste filtrée :

```tsx
// ContenidoReporte.tsx (fragmento de la solución)
      const elegido = visibles.find((estado) => estado.nombre === seleccionado);
```

En décochant la case, le détail de `catálogo` **réapparaît**, car `seleccionado` a conservé la valeur `"catálogo"` tout du long ; seul a changé ce qui est calculé à partir de lui. C'est l'avantage présenté en 2.3.2 sous une autre forme : comme le détail est calculé, il n'y a rien à « nettoyer ». Laquelle des deux approches est préférable ? C'est un choix produit, et non une contrainte React : le point de contrôle garde le détail visible car l'utilisateur l'a sélectionné intentionnellement, et le masquer lors du filtrage pourrait le surprendre. Ce qui n'est pas contestable, en revanche, c'est qu'aucune des deux approches ne réclame d'état additionnel.

### Solution 4

Lint et build demeurent au vert, exactement comme dans « L'erreur que tu vas voir ». Voici ce qu'a mesuré Chrome en mode headless sur cette copie construite (`node medir.mjs sin-key`) :

```text
a. escribes en pagos sin guardar y eliges reportes: Detalle de reportes · borrador: "borrador de pagos"
b. guardas una nota en pagos y eliges catálogo: Detalle de catálogo · borrador: "llamar al proveedor"
c. cierras el detalle y eliges reportes: Detalle de reportes · borrador: ""
```

À l'étape a, l'intitulé devient « Detalle de reportes » et la zone de texte conserve le brouillon de `pagos` : c'est la figure 3 au cœur du `revisor`. L'étape b est plus subtile : avec une note enregistrée sur `pagos`, en se rendant sur `catálogo`, l'éditeur **continue d'afficher la note de `pagos`**. `useState(notaGuardada)` n'a lu sa valeur initiale que la toute première fois que l'éditeur s'est monté ; sans `key`, l'éditeur n'est jamais démonté ni remonté tant qu'un service est sélectionné, si bien que `notaGuardada` change mais que le brouillon l'ignore. C'est exactement l'avertissement de la documentation concernant la copie d'une prop dans l'état (2.5.3). Avec la `key`, chaque service monte son propre éditeur et le duo « valeur initiale + `key` » retrouve son bon fonctionnement. Enfin, l'étape c montre une exception : si l'on ferme le détail puis sélectionne un autre service, l'éditeur se monte bel et bien à nouveau, car la fermeture l'a retiré de l'arbre, et le brouillon ressort vide. Cela confère à l'anomalie un caractère intermittent, ce qui représente la pire catégorie de bogue.

## Comment savoir que j'ai réussi

- [ ] `npm run lint` s'achève sans signaler le moindre problème et `npm run build` se conclut par `✓ built`, avec un fichier `index-….js` dans `dist/assets/`.
- [ ] Avec le serveur d'entraînement et `npm run dev` lancés, la case « Solo fallas » n'affiche plus que `pagos` et `reportes`, et le résumé continue d'indiquer « 4 servicios revisados · 2 servicios con falla ».
- [ ] En sélectionnant un service, son bouton passe à `aria-pressed="true"` (observe-le dans les outils de développement du navigateur, onglet Éléments) et son détail apparaît ; « Cerrar detalle » le masque et le bouton repasse à `false` ; cliquer de nouveau sur le même service le masque aussi.
- [ ] Une note enregistrée marque la ligne par « · con nota », et enregistrer un texte vide retire la mention.
- [ ] Un brouillon non enregistré ne se propage pas lors de la sélection d'un autre service, et au retour, la note enregistrée réapparaît.
- [ ] Tu es en mesure d'exécuter les quatre figures et d'expliquer chaque ligne de leur sortie sans regarder la leçon.
- [ ] Dans une copie, la mutation de `guardarNota` est rejetée par `tsc` (TS2542) et par `npm run lint` (`react-hooks/immutability`), et tu sais expliquer pourquoi les deux sont nécessaires.
- [ ] Tu peux désigner dans le `revisor` une illustration de chacune des cinq règles de structuration (un cas peut servir pour deux).
- [ ] Tu as consigné dans ton [journal de bord](bitacora.md) ta prédiction pour l'exercice 1 avant de l'exécuter, et indiqué si elle s'est avérée exacte.

## Résumé

Réponds sans regarder la leçon :

1. Pourquoi `revisiones` vaut-il la même chose avant et après l'appel à `establecerRevisiones` au sein d'un clic ? Que signifie le fait que l'état soit une photographie ?
2. Qu'est-ce que le regroupement (*batching*) et quel rapport entretient-il avec la file d'attente des mises à jour ?
3. Qu'est-ce qui change si l'on passe à `establecer…` une fonction au lieu d'une valeur ? Quand le cours utilise-t-il chaque forme ?
4. Pourquoi muter un objet et le repasser ne déclenche-t-il aucun nouveau rendu ? Que compare React et avec quelle fonction JavaScript ?
5. Quelles sont les cinq règles de structuration de l'état ? Donne un exemple issu du `revisor` pour chacune d'elles.
6. Pourquoi `seleccionado` stocke-t-il un nom et non un service ? Que verrait-on d'anormal s'il stockait l'objet service ?
7. Comment décides-tu du composant dans lequel réside un morceau d'état ? Pourquoi le brouillon ne remonte-t-il pas jusqu'à `Panel` ?
8. Où React stocke-t-il l'état d'un composant ? Que fait une `key` à cet égard, et pourquoi aucun outil ne t'avertit si elle manque ?

## Pour aller plus loin

- [React, « State as a Snapshot »](https://react.dev/learn/state-as-a-snapshot) : l'état comme photographie, l'exemple du bouton « +3 » et la raison pour laquelle la valeur ne change pas au sein d'un rendu. Consulté le 21 octobre 2026.
- [React, « Queueing a Series of State Updates »](https://react.dev/learn/queueing-a-series-of-state-updates) : le regroupement (*batching*), la file d'attente des mises à jour, la fonction de mise à jour (*updater function*) et le nommage de son paramètre. Consulté le 21 octobre 2026.
- [React, `useState`](https://react.dev/reference/react/useState) : la fonction `set`, la comparaison avec `Object.is`, le double appel en `StrictMode` et les problèmes fréquents (« le log donne l'ancienne valeur », « l'écran ne change pas »). Consulté le 21 octobre 2026.
- [React, « Updating Objects in State »](https://react.dev/learn/updating-objects-in-state) : traiter l'état comme étant en lecture seule, la décomposition superficielle, les motivations de l'immuabilité et Immer. Consulté le 21 octobre 2026.
- [React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure) : les cinq règles de structuration, `selectedId` plutôt que l'objet et la mise en garde contre la copie de props dans l'état. Consulté le 21 octobre 2026.
- [React, « Reacting to Input with State »](https://react.dev/learn/reacting-to-input-with-state) : les états « impossibles » et un `status` au lieu de plusieurs drapeaux. Consulté le 21 octobre 2026.
- [React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components) : faire remonter l'état, composants contrôlés et non contrôlés, et la source unique de vérité. Consulté le 21 octobre 2026.
- [React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state) : l'état lié à la position dans l'arbre, `key` en dehors des listes et l'exemple de l'application de messagerie. Consulté le 21 octobre 2026.
- [React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect) : calculer pendant le rendu, réinitialiser tout l'état avec une `key` et conserver l'identifiant sélectionné. Consulté le 21 octobre 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input) : champs contrôlés, `checked` avec `onChange` et `evento.target.checked` sur les cases à cocher. Consulté le 21 octobre 2026.
- [React, « immutability »](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability) : la règle de linter qui interdit de muter les props et l'état. Consulté le 21 octobre 2026.
- [MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) : la notion de « même valeur » et le fait que deux objets ne sont identiques que s'ils partagent la même référence. Consulté le 21 octobre 2026.
- [MDN, « Spread syntax »](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) : la syntaxe de décomposition dans les objets littéraux, la copie superficielle et la résolution des conflits de propriétés. Consulté le 21 octobre 2026.
- [MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed) : l'état d'un bouton bascule et la raison pour laquelle son intitulé ne change pas. Consulté le 21 octobre 2026.
- [MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside) : le rôle sémantique de contenu complémentaire et la nécessité d'un libellé lorsqu'il est imbriqué dans une section. Consulté le 21 octobre 2026.
- [TypeScript, « Utility Types »](https://www.typescriptlang.org/docs/handbook/utility-types.html) : `Readonly<Type>` et `Record<Keys, Type>`. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| état | ce dont un composant se souvient entre un rendu et le suivant ; React le conserve et le fournit avec `useState` |
| photographie (*snapshot*) | la valeur fixe de l'état pendant un rendu ; la modifier demande un nouveau rendu, elle ne réécrit pas la variable |
| regroupement (*batching*) | attendre que le gestionnaire se termine pour traiter toutes les mises à jour d'état en un seul rendu |
| fonction de mise à jour | la fonction que l'on passe à `establecer…` pour calculer la nouvelle valeur à partir de la dernière présente dans la file d'attente |
| muter | modifier un objet déjà existant au lieu d'en créer un nouveau |
| décomposition (`...`) | la syntaxe qui copie les propriétés d'un objet dans un nouvel objet ; ne copie qu'un seul niveau |
| état redondant | information stockée dans l'état qui pourrait être calculée à partir d'un autre état ou des props |
| faire remonter l'état | déplacer un état vers l'ancêtre commun des composants qui l'utilisent et le transmettre vers le bas par les props |
| composant contrôlé | composant dont les informations importantes proviennent de ses props plutôt que d'être conservées par lui-même |
| `key` (pour réinitialiser) | identifiant que React utilise comme partie intégrante de la position ; s'il change, React démonte le composant et en monte un nouveau |

---

**Suivante :** [Leçon 3 — Effects : synchroniser, pas « quand ça charge »](03-effects-sincronizar.md)
