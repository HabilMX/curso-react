# Leçon 9 — Performance, publication et quand utiliser un framework

*Il est 17 h 40 un vendredi et le `revisor` doit être publié à 18 h sur le serveur de l'équipe d'exploitation. Dans le canal du projet, trois messages attendent une réponse. Le premier : « le panneau paraît lent, on met `useMemo` partout avant de publier ? ». Le deuxième, de la personne qui a préparé le serveur : « j'ouvre `/servicios/pagos` et ça marche, mais si je recharge la page j'obtiens un 404 ». Le troisième, de quelqu'un qui voulait que le panneau n'interroge « presque jamais » dans l'environnement de test : il a mis `VITE_CADA_MS=2147483648`, et le journal de l'API s'est rempli de requêtes, une toutes les trois dixièmes de seconde. Personne n'a rien mesuré. Il reste vingt minutes et trois avis différents sur ce qu'il faut faire. Cette leçon fait ce qui a manqué : mesurer d'abord, décider ensuite, et publier avec un serveur qui sait ce qu'est une route du client.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 9.2 et 9.3)

**Ce que tu construis :** le `revisor` mesuré, optimisé et publié : le compilateur de React activé au moment du build, un serveur de publication maison qui sert `dist/` avec une réécriture vers `index.html`, une politique de sécurité du contenu et un cache correct, et cinq correctifs issus de la mesure du panneau, chacun avec le test qui passe au rouge avant le correctif et au vert après

**Ce que tu apprends :** mesurer avec le Profiler **avant** de mémoïser ; la structure d'abord ; React Compiler 1.0 ; `vite build` et pourquoi `vite preview` n'est pas un serveur de production ; la réécriture vers `index.html` ; `VITE_` sans secrets ; rappel sur le XSS ; Server Components et Server Functions : ce que c'est et pourquoi ce panneau ne les utilise pas ; quand il convient de migrer vers un framework

**D'où tu viens.** Du point de contrôle de la [Leçon 8](08-pruebas-de-componentes.md) : un `revisor` avec quatre écrans (la liste sur `/`, le détail sur `/servicios/:nombre`, l'enregistrement sur `/servicios/nuevo` et la page « non trouvée »), les données du serveur dans TanStack Query, des avis et des préférences dans un contexte, un formulaire accessible et une suite de 27 tests dans 7 fichiers qui passent au rouge quand quelqu'un annule un correctif. Tout cela fonctionne avec `npm run dev`. Ce qui n'a pas été fait, c'est la question finale : à quelle vitesse est-ce, et comment le livre-t-on à celles et ceux qui vont l'utiliser ?

**Ce que cette leçon ne fait pas.** Elle n'ajoute aucun écran et ne change rien à ce que fait le panneau. Elle n'utilise ni `useMemo`, ni `useCallback`, ni `memo` dans le `revisor` : la mesure ne les a pas demandés, et la section 9.1 explique pourquoi. Elle ne migre pas le panneau vers un framework et ne monte pas de Server Components : la section 9.3 explique ce que c'est et pourquoi ce panneau n'en a pas besoin. Elle ne configure pas de serveur web de production comme nginx ou Caddy : elle en écrit un petit en Node pour que chaque décision reste visible, et nomme ce qu'un vrai serveur ajoute. Et ce n'est pas un cours de sécurité : elle rappelle les deux défenses que le panneau avait déjà contre l'injection de code (React et le linter) et ajoute la troisième, la politique de sécurité du contenu.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon. Le point de contrôle a été installé de zéro avec `npm ci` dans une copie hors du dépôt, identique fichier par fichier au point de contrôle, et là `npm run lint`, `npm test` et `npm run build` se sont terminés avec le code 0 : 35 tests sur 35 dans 11 fichiers (lu dans le résumé de Vitest), `dist/assets/index-Cs1CcfeN.js` (le nom du paquet et les sorties de 9.1 et 9.2 ont été mesurés de nouveau le 22 octobre 2026, sur macOS) et `dist/assets/index-CbqUABMA.css`. Les sorties de Vitest ont été prises avec `--reporter=default`, ce que tu vois dans ton terminal. Les cinq correctifs de 9.4 sont déjà dans le point de contrôle. Leur phase rouge a été mesurée dans une **copie** du point de contrôle sans les correctifs, appelée `rojo`, et c'est pourquoi cette sortie indique `~/curso-react/rojo` ; la phase verte, dans le point de contrôle. Ce qui est vu « dans le navigateur » a été mesuré avec Chrome sans fenêtre (`--headless`) : le DOM de `/servicios/pagos` avec `--dump-dom` et, pour l'interrogation périodique (polling) et les nouvelles tentatives, en ouvrant la page quelques secondes pendant que l'API d'entraînement notait chaque requête. Ces exécutions ont utilisé les ports 3109 (API), 4109 (aperçu et serveur publié) et 5109 (développement) à la place de 3100, 4173, 4180 et 5173, parce que d'autres choses tournaient en même temps sur la machine ; pour pointer le *proxy* de développement vers le 3109, on a modifié `vite.config.ts` dans les copies, pas dans l'original. Les sorties montrent les ports réellement utilisés ; tu utiliseras ceux du cours. Les figures se trouvent dans [`programas/09-rendimiento-publicacion/`](../programas/09-rendimiento-publicacion), aux côtés de `revisor/`, avec leur propre `package.json` : elles sont compilées avec `tsc` et exécutées avec `node`, comme dans les leçons précédentes, et ajoutent `@babel/core`, `babel-plugin-react-compiler` et `@types/convert-source-map`, qui s'installent dans `~/curso-react/figuras/` avec `npm install --save-dev --save-exact @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0 @types/convert-source-map@2.0.3` (le dernier parce que les types de `@babel/core` 8.0.7 l'importent et que `tsc --strict` sans `skipLibCheck` ne compile pas sans lui). **Sorties archivées.** À côté des figures, dans `programas/09-rendimiento-publicacion/`, se trouvent les sorties de cette leçon qu'on peut reproduire avec une commande, relancées lors de la révision : `build.salida.txt`, `build-sin-compilador.salida.txt`, `secretos.grep.txt` (les marques du compilateur et la recherche de 9.2.4), `preview.curl.txt`, `publicado.curl.txt` et `suite.vitest.txt`. Seuls les heures et les dates des en-têtes changent. **Ne sont pas archivées**, et ont été mesurées en une seule exécution de la leçon sans copie dans `programas/` : la phase rouge de 9.4 (elle exige une copie sans les correctifs), les journaux et le vidage du DOM mesurés avec Chrome (9.2.3, 9.4.1 et 9.4.3), le build avec de fausses clés de 9.2.4, et la sortie d'ESLint de « L'erreur que tu vas voir ».

Le point de contrôle a aussi été installé de zéro dans un conteneur Linux (Debian 12, image officielle `node:24.22.0-bookworm`) : `npm run build` a donné le même nom de fichier et `npm test` s'est terminé avec le code 0 et `Tests  35 passed (35)`. Après la dernière modification de `PaginaServicio` (conserver l'ancien détail si une mise à jour échoue), on a répété sous macOS, contre le nouveau point de contrôle, les deux builds de 9.1.6, les recherches dans `dist/` de 9.1.6 et 9.2.4, les réponses de `curl` et le journal de 9.2.2 et 9.2.3, le vidage du DOM publié et le build avec de fausses clés. L'exécution n'a pas eu lieu sur un vrai Linux Mint ; rien de ce qui est montré ne dépend du système. Les heures du journal des serveurs sont en UTC ; celles de Vitest (`Start at`), à l'heure locale de la machine. **Ce qui n'a pas été mesuré**, et c'est dit là où cela apparaît : le Profiler des outils de développement de React, qui se lit à l'œil, et le panneau publié derrière un serveur web de production. Les chemins longs sont affichés à partir de `~/curso-react`.

## À la fin, tu seras capable de

- Mesurer avec `<Profiler>` combien de fois une partie de l'arbre est dessinée et combien de temps cela prend, et décider avec ce nombre s'il faut optimiser.
- Supprimer des dessins en trop en changeant la **structure** (descendre l'état, passer du JSX en `children`) avant de penser à mémoïser (conserver le résultat d'un calcul ou d'un dessin pour le réutiliser tant que ses entrées ne changent pas), et montrer par la mesure que cela a fonctionné.
- Activer React Compiler 1.0 dans un projet Vite, lire le code qu'il produit et vérifier dans `dist/` qu'il a agi.
- Expliquer pourquoi `vite preview` n'est pas un serveur de production, et vérifier avec `curl` que le serveur de publication réécrit les routes du client vers `index.html`, envoie la politique de sécurité du contenu et met chaque fichier correctement en cache.
- Chercher des secrets dans `dist/` et **lire** le résultat, en distinguant une correspondance d'une fuite.
- Expliquer ce que sont les Server Components et les Server Functions, pourquoi le `revisor` ne les utilise pas, et quels signaux diraient qu'il convient de migrer vers un framework.
- Écrire, pour un défaut trouvé en mesurant, le test qui passe au rouge avant le correctif et au vert après.

## Le pourquoi avant le comment

Les trois messages de la scène sont trois questions différentes, et toutes trois ont le même piège : on peut y répondre par un avis.

**« Ça paraît lent ».** Qu'est-ce qui est lent ? Le premier dessin, la saisie dans un champ, le changement de page, la réponse de l'API ? Dans le `revisor`, l'API d'entraînement met 300 ms à répondre le rapport et 1,5 s le détail de `pagos`, exprès. Si c'est cela que l'on « ressent », aucun `useMemo` ne le corrige, car le temps n'est pas dépensé dans React. Et si le temps est bien dépensé dans React, il faut savoir **dans quel composant** et **combien de fois**, car mémoïser le mauvais composant ajoute du code et n'enlève rien. React fournit un outil pour le mesurer, et la documentation demande de l'utiliser avant de mémoïser. Cette leçon l'utilise.

**« Si je recharge, j'obtiens un 404 ».** Dans la Leçon 5, tu as vu pourquoi : `/servicios/pagos` n'est pas un fichier, c'est une route que décide React Router dans le navigateur. Tant que tu navigues dans l'application, le serveur n'en sait rien. Quand tu recharges, le navigateur demande `/servicios/pagos` au serveur, et un serveur de fichiers qui ne sait rien des routes du client répond ce qui est vrai pour lui : ce fichier n'existe pas. L'aperçu de Vite règle déjà cela, et cela prête à confusion, car on se dit qu'« en production, ça marchera pareil ». La documentation de Vite dit le contraire : l'aperçu n'est pas un serveur de production. Celui qui publie doit décider ce que répond chaque adresse.

**« J'ai mis un grand nombre et le journal s'est rempli ».** Ce n'est pas un problème de performance : c'est un défaut. `leerCadaMs` accepte n'importe quel entier positif, et un nombre qui ressemblait à « presque jamais » a fini par signifier « tout le temps ». Personne ne l'a vu jusqu'à ce que quelqu'un le mesure. La section 9.4 rassemble cinq défauts comme celui-ci, trouvés en mesurant le panneau pour cette leçon, et les ferme avec l'habitude de la Leçon 8 : d'abord le test rouge, puis le correctif, puis le test vert.

Les concepts nouveaux sont trois : mesurer et laisser le compilateur mémoïser (9.1), publier ce que `vite build` laisse dans `dist/` (9.2) et savoir quand le panneau aurait besoin d'un serveur React (9.3). La section 9.4 est la récolte.

## Les concepts

### 9.1 Mesurer avant de mémoïser

#### 9.1.1 Ce que coûte un dessin en trop

Quand l'état d'un composant change, React le dessine de nouveau (il rappelle la fonction), et avec lui tous les composants qu'il dessine à l'intérieur, même si leurs props n'ont pas changé. Tu l'as vu dans la Leçon 1 : dessiner, c'est calculer un arbre, puis React compare cet arbre au précédent et ne touche au DOM que là où il y a eu des différences. Presque toujours, c'est bon marché. Un composant qui renvoie quatre `<li>` se dessine en microsecondes, et le dessiner dix fois de trop ne se remarque pas.

Cela se remarque quand deux choses se combinent : un composant **coûteux** (une liste de milliers de lignes, un calcul lourd, un graphique) et un état qui change **souvent** (à chaque touche, à chaque mouvement de la souris) et qui vit **au-dessus** de lui. La documentation de `memo` le dit en une phrase qu'il convient de retenir : l'optimisation avec `memo` ne vaut la peine que lorsque le composant est redessiné souvent avec exactement les mêmes props et que son dessin est coûteux ; s'il n'y a pas de latence perceptible, `memo` est superflu ([React, `memo`](https://react.dev/reference/react/memo)). Les deux conditions se mesurent. Aucune ne se devine.

#### 9.1.2 `<Profiler>` : mesurer avec un programme

React fournit un composant pour mesurer : `<Profiler>`. Tu enveloppes une partie de l'arbre, tu lui donnes un `id` et une fonction `onRender`, et React appelle cette fonction chaque fois que cette partie de l'arbre est validée (*commit*). La documentation énumère ce qu'elle reçoit ([React, `<Profiler>`](https://react.dev/reference/react/Profiler)) :

- `id` : celui du `<Profiler>`, pour savoir lequel c'était si tu en as plusieurs ;
- `phase` : `"mount"` la première fois ; `"update"` quand il a été redessiné à cause d'un changement de props, d'état ou de hooks ; et `"nested-update"`, un cas qui n'apparaît pas dans cette leçon ;
- `actualDuration` : les millisecondes passées à dessiner ce sous-arbre lors de cette mise à jour ; selon la documentation, elle devrait idéalement baisser nettement après le montage si la mémoïsation fonctionne ;
- `baseDuration` : une estimation du temps qu'il faudrait pour dessiner le sous-arbre complet sans aucune optimisation ; la comparer à `actualDuration` dit si la mémoïsation sert à quelque chose ;
- `startTime` et `commitTime` : des repères de temps.

Un avertissement de la même page : mesurer a un coût, donc **le Profiler est désactivé dans le build de production**. Tu mesures en développement, ou avec un build spécial de React qui l'active.

La figure 1 reproduit la scène du premier message avec un panneau minimal. Il a un champ pour écrire une note et une liste qui met 20 ms à se dessiner ; le coût est voulu, pour qu'on le voie. La figure mesure la liste avec un `<Profiler>` pendant qu'on « tape » le mot `caído`, cinq touches, dans deux versions du panneau. Dans la version A, le brouillon de la note vit dans le panneau, qui est le parent de la liste. Dans la version B, le brouillon descend dans un composant dédié, `CampoNota`, le seul à l'utiliser.

```tsx
// fig09_01.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState, type ProfilerOnRenderCallback } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");

const SERVICIOS = ["catálogo", "pagos", "inventario", "reportes"];

// Gasta tiempo sin hacer nada útil: simula un dibujo caro. Sigue siendo impuro (lee el
// reloj); el linter no lo ve porque está en otra función. Se acepta solo porque no
// produce nada que se dibuje: nunca escondas así una impureza de verdad.
function gastar(ms: number): void {
  const hasta = performance.now() + ms;
  while (performance.now() < hasta) {
    // espera activa
  }
}

// Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
function ListaLenta() {
  gastar(20);
  return (
    <ul>
      {SERVICIOS.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

// Lo que mide el Profiler: cuántos dibujos hubo de la lista y cuánto tardaron.
const medidas: { fase: string; ms: number }[] = [];
const anotar: ProfilerOnRenderCallback = (_id, fase, duracionReal) => {
  medidas.push({ fase, ms: duracionReal });
};

function ListaMedida() {
  return (
    <Profiler id="lista" onRender={anotar}>
      <ListaLenta />
    </Profiler>
  );
}

// A. El borrador de la nota vive en el panel: cada tecla dibuja el panel completo.
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}

// B. Estructura primero: el borrador baja al único componente que lo usa.
function CampoNota() {
  const [borrador, establecerBorrador] = useState("");
  return <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />;
}

function PanelAbajo() {
  return (
    <>
      <CampoNota />
      <ListaMedida />
    </>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function medir(titulo: string, Panel: () => React.ReactNode): Promise<void> {
  medidas.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Panel />));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  let texto = "";
  for (const letra of "caído") {
    texto += letra;
    await act(async () => escribir(campo, texto));
  }

  const fases = medidas.map((medida) => medida.fase).join(", ");
  const lentas = medidas.filter((medida) => medida.ms >= 20).length;
  console.log(titulo);
  const veces = medidas.length === 1 ? "1 vez" : `${medidas.length} veces`;
  console.log(`  5 teclas → la lista se dibujó ${veces}: ${fases}`);
  console.log(`  dibujos de la lista que tardaron 20 ms o más: ${lentas}`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await medir("A. el borrador vive en el panel:", PanelArriba);
await medir("B. el borrador vive en CampoNota:", PanelAbajo);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_01.tsx
$ node fig09_01.js
A. el borrador vive en el panel:
  5 teclas → la lista se dibujó 6 veces: mount, update, update, update, update, update
  dibujos de la lista que tardaron 20 ms o más: 6
B. el borrador vive en CampoNota:
  5 teclas → la lista se dibujó 1 vez: mount
  dibujos de la lista que tardaron 20 ms o más: 1
```

Lis les deux mesures calmement, car elles disent plus qu'il n'y paraît :

- **Dans la version A**, cinq touches ont produit six dessins de la liste : le montage et un par touche. Chacun a duré ce que dure la liste, 20 ms ou plus. La liste n'a jamais changé (ce sont toujours les mêmes quatre services), mais elle a été redessinée parce que son parent a changé d'état. Si la liste mettait 200 ms, chaque touche figerait l'écran un cinquième de seconde : voilà ce que veut dire « ça paraît lent ».
- **Dans la version B**, la liste a été dessinée une fois, au montage. Écrire a changé l'état de `CampoNota`, et React n'a redessiné que `CampoNota`, parce que la liste n'est pas son enfant. Il n'y a eu ni `memo`, ni `useMemo`, ni compilateur : il y a eu un état placé au bon endroit.

Remarque le détail de `gastar` : l'attente vit dans une fonction à part. La première version de la figure l'avait à l'intérieur de `ListaLenta`, et le linter l'a rejetée. La déplacer **ne la rend pas pure** : `gastar` lit toujours l'horloge pendant le dessin, et le linter ne la voit plus uniquement parce qu'il ne regarde pas à l'intérieur des fonctions que tu appelles. On l'accepte ici parce que la figure simule un coût et ne dessine rien qui dépende de l'horloge ; le commentaire du code le dit. Tu le verras en entier dans « L'erreur que tu vas voir ».

#### 9.1.3 Le Profiler des outils de développement

`<Profiler>` sert à mesurer avec un programme. Pour regarder une application entière, il existe l'onglet **Profiler** des outils de développement de React (React Developer Tools, l'extension du navigateur). Il enregistre ce qui se passe pendant que tu utilises la page et te dessine chaque *commit* sous forme de graphique à barres : quels composants ont été dessinés, combien de temps chacun a pris et, si tu actives l'option d'enregistrer pourquoi chaque composant a été dessiné, la cause (une prop a changé, l'état a changé, un hook a changé, le parent a été dessiné). La documentation de `memo` renvoie là quand une interaction semble encore lente : utilise le Profiler pour voir quels composants bénéficieraient le plus de la mémoïsation, et ne mémoïse que ceux-là ([React, `memo`](https://react.dev/reference/react/memo)).

Cette mesure **n'a pas été exécutée pour la leçon** : le Profiler de l'extension se lit à l'œil, et une exécution automatique ne peut pas le vérifier. Le pas à pas pour la faire toi-même se trouve dans l'exercice 1, et la manière de savoir si tu as réussi, dans « Comment savoir que j'ai réussi ».

#### 9.1.4 La structure d'abord

La version B de la figure n'est pas une astuce : c'est la deuxième de cinq recommandations que la documentation de `memo` donne pour que la majeure partie de la mémoïsation soit inutile ([React, `memo`](https://react.dev/reference/react/memo)). Les cinq, avec ce qu'elles signifient dans le `revisor` :

1. **Si un composant en enveloppe visuellement d'autres, qu'il les reçoive comme `children`.** Quand l'enveloppe change son propre état, React sait que les enfants arrivés comme `children` n'ont pas besoin d'être redessinés, parce qu'ils ont été créés par un autre composant. C'est `Tarjeta`, depuis la Leçon 1.
2. **Préfère l'état local et ne le remonte pas plus que nécessaire.** Le brouillon d'une note appartient à `EditorNota`, pas à la page ; depuis la Leçon 2 il vit là, et c'est pourquoi écrire une note ne redessine pas la liste. La figure 1 est ce point, mesuré.
3. **Garde le dessin pur.** Si redessiner provoque un problème visible, c'est un défaut du composant et on le corrige, on ne le masque pas avec de la mémoïsation. La Leçon 1 tout entière traite de cela.
4. **Évite les Effects qui ne font que mettre à jour l'état.** La documentation dit que la plupart des problèmes de performance dans les applications React viennent de chaînes de mises à jour issues d'Effects, qui font dessiner les composants encore et encore. La Leçon 3 a appris à reconnaître les Effects superflus.
5. **Retire les dépendances inutiles des Effects.** Avec TanStack Query, depuis la Leçon 4, le panneau n'a plus d'Effects à lui pour récupérer des données.

C'est pourquoi le cours n'a mis `useMemo` dans aucune leçon. Ce n'était pas un oubli : chaque fois que la tentation est apparue, la structure avait déjà supprimé le dessin en trop. Le principe qui traverse le cours, « on mesure d'abord et on optimise ensuite », ne dit pas « ne mémoïse jamais » ; il dit que la mémoïsation est un outil qui a un coût (du code plus difficile à lire, des dépendances à tenir à jour et qui peuvent la casser) et que la mesure décide quand ce coût en vaut la peine.

#### 9.1.5 React Compiler 1.0 : la mémoïsation que tu n'écris pas

Il y a un autre chemin, et le point de contrôle le prend. React Compiler est un outil de build qui mémoïse les composants et les hooks de lui-même : il lit ton code, comprend les règles de React, et écrit l'équivalent de `memo`, `useMemo` et `useCallback` là où c'est nécessaire ([React, « Introduction to React Compiler »](https://react.dev/learn/react-compiler/introduction)). Sa première version stable, la 1.0, est sortie le 7 octobre 2025 ; l'annonce dit qu'elle a déjà été éprouvée sur de grandes applications de Meta et qu'elle est prête pour la production ([React, « React Compiler v1.0 »](https://react.dev/blog/2025/10/07/react-compiler-1)). Pour du code nouveau, la documentation recommande de laisser la mémoïsation au compilateur et d'utiliser `useMemo` ou `useCallback` là où un contrôle précis est nécessaire, par exemple une valeur mémoïsée qui est la dépendance d'un Effect.

Dans un projet Vite, il s'active comme un *preset* de Babel. La documentation d'installation donne exactement cette forme pour `@vitejs/plugin-react` 6 ou postérieur ([React, « Installation »](https://react.dev/learn/react-compiler/installation)), et c'est le principal changement de configuration du point de contrôle (les lignes de `css` dans `test` sont expliquées en 9.4.4) :

```ts
// revisor/vite.config.ts
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
```

Avec trois nouvelles dépendances de développement, fixées à une version exacte : `@rolldown/plugin-babel` 0.2.4 (le *plugin* qui exécute Babel dans le build de Vite), `@babel/core` 8.0.7 et `babel-plugin-react-compiler` 1.0.0. Elles s'installent depuis `~/curso-react/revisor/` :

```bash
npm install --save-dev --save-exact @rolldown/plugin-babel@0.2.4 @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0
```

Dans `package.json`, deux autres choses changent : `"version": "0.9.0"`, comme à chaque leçon, et le nouveau script de 9.2.3, `"publicado": "node servidor/publicar.ts"`. Le README de `@vitejs/plugin-react` mentionne aussi un chemin natif, sans Babel, mais il le signale comme expérimental, et le point de contrôle ne l'utilise pas.

Qu'écrit le compilateur ? La figure 2 lui pose directement la question. Elle donne à Babel, avec le *plugin* du compilateur, le panneau A de la figure 1 sous forme de texte, ainsi qu'un composant qui enfreint une règle de React : il modifie un objet reçu en prop.

```ts
// fig09_02.ts
import { transformAsync } from "@babel/core";

// El panel A de la figura 1, tal cual, como texto: lo que el compilador recibe.
const panel = `
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}
`;

// Un componente que rompe una regla de React: cambia un objeto que recibió como prop.
const impuro = `
function FilaContada({ estado }) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
`;

async function compilar(titulo: string, codigo: string): Promise<void> {
  const resultado = await transformAsync(codigo, {
    filename: "panel.jsx",
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx"] },
    plugins: [["babel-plugin-react-compiler", {}]],
  });
  console.log(`=== ${titulo}`);
  console.log(resultado?.code ?? "(sin salida)");
}

await compilar("el panel A, compilado", panel);
await compilar("un componente impuro, compilado", impuro);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_02.ts
$ node fig09_02.js
=== el panel A, compilado
import { c as _c } from "react/compiler-runtime";
function PanelArriba() {
  const $ = _c(6);
  const [borrador, establecerBorrador] = useState("");
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = e => establecerBorrador(e.target.value);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== borrador) {
    t1 = <input aria-label="Nota" value={borrador} onChange={t0} />;
    $[1] = borrador;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <ListaMedida />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1) {
    t3 = <>{t1}{t2}</>;
    $[4] = t1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}
=== un componente impuro, compilado
function FilaContada({
  estado
}) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
```

Le panneau compilé se lit de haut en bas :

- `const $ = _c(6)` demande à React un cache de six cases pour ce composant. `_c` vient de `react/compiler-runtime`, que React 19 fournit déjà.
- La fonction du `onChange` (`t0`) n'est créée qu'une seule fois : la case `$[0]` démarre avec une valeur spéciale, `Symbol.for("react.memo_cache_sentinel")`, qui signifie « encore vide » ; la première fois on enregistre la fonction et les suivantes on la réutilise. C'est un `useCallback` que tu n'as pas écrit.
- Le `<input>` (`t1`) n'est recréé que si `borrador` a changé.
- `<ListaMedida />` (`t2`) est créé **une seule fois**, parce qu'il ne dépend de rien. Quand React retrouve dans le nouvel arbre exactement le même élément que dans le précédent, il ne redessine pas ce composant. Le compilateur a obtenu la même chose que la version B de la figure 1, sans déplacer l'état.

Le second résultat est tout aussi important : **le composant impur est ressorti intact**. Il n'y a ni `_c`, ni cache, ni avertissement. La documentation l'explique : quand le compilateur trouve du code susceptible d'enfreindre les règles de React, il saute l'optimisation plutôt que de risquer de changer le comportement de ton application ([React, « Debugging and Troubleshooting »](https://react.dev/learn/react-compiler/debugging)). Le compilateur ne corrige pas un composant impur ; il le laisse tel quel, et c'est le linter qui le détecte : depuis `eslint-plugin-react-hooks` 7, il intègre les règles du compilateur dans sa configuration recommandée.

#### 9.1.6 Vérifier que le compilateur a agi dans le `revisor`

Une configuration qui n'échoue pas ne prouve pas que quelque chose fonctionne. La documentation d'installation suggère deux vérifications : le badge « Memo ✨ » à côté des composants dans les outils de développement, et la recherche, dans le code construit, de la logique que le compilateur ajoute. La seconde peut être exécutée. Voici le build du point de contrôle :

```text
$ npm run build
> revisor@0.9.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 193 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-Cs1CcfeN.js   374.65 kB │ gzip: 117.28 kB

✓ built in 282ms
```

Et voici celui d'une copie identique avec une seule différence : dans `vite.config.ts`, `plugins: [react()]`, sans le compilateur.

```text
$ npx vite build
...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-DuGgkiHN.js   367.32 kB │ gzip: 114.56 kB
```

Le même test, fait avant les cinq correctifs de 9.4, avait donné sans le compilateur `index-WLyq37jn.js` : le même nom que produisaient alors les points de contrôle 7 et 8, parce que jusque-là le code de l'application était identique à celui de ces leçons, octet pour octet. Depuis cette mesure, les points de contrôle 7, 8 et 9 ont modifié une condition de `PaginaServicio` (conserver l'ancien détail si une mise à jour échoue), et les 7 et 8 s'appellent désormais `index-C_lOH5GL.js` ; la comparaison avec le 9 antérieur aux correctifs n'a pas été répétée. On compte maintenant les marques du compilateur dans chacun :

```text
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # con el compilador
      18
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # sin el compilador
       1
```

Sans le compilateur, il y en a une, qui vient de React DOM : c'est la constante `Symbol.for("react.memo_cache_sentinel")` avec laquelle React marque, en interne, un cache encore vide (mesuré : elle apparaît dans `react-dom-client.production.js` et pas dans le `compiler-runtime` de React, qui ne fait que demander le cache). Avec le compilateur, il y en a 18 : celle-là plus 17 ajoutées par le compilateur, une pour chaque valeur qu'il enregistre la première fois et ne recalcule plus parce qu'elle ne dépend de rien, comme `t0` et `t2` dans la figure 2. Ce n'est pas le compte des cases : dans ce bundle, le compilateur a demandé 24 caches (24 appels à `c(…)`, le `_c` de la figure déjà minifié) avec 255 cases au total, mesuré en additionnant leurs arguments. Pour savoir s'il a agi, il suffit que le nombre augmente. Un avertissement de mesure : `grep -c` **ne** convient **pas** ici, car il compte des **lignes** contenant des correspondances et non des correspondances, et le JavaScript minifié tient presque tout sur quelques lignes. Mesuré sur le même fichier, `grep -c memo_cache_sentinel` dit `2` : les 18 marques sont sur deux lignes. Un nombre qui sort sans erreur n'est pas un nombre correct.

Et un dernier compte, que la documentation ne te donnera pas : la mémoïsation n'est pas gratuite, même en octets. Le bundle est passé de 367,32 kB à 374,65 kB (de 114,56 à 117,28 kB compressés) : 7,33 kB de plus de code qui s'exécute à chaque dessin pour décider quoi réutiliser. Dans le `revisor`, où aucun composant n'est coûteux, c'est presque certainement une petite perte, pas un gain ; le point de contrôle l'active parce que le plan du cours demande d'enseigner le compilateur et parce que les 35 tests passent à l'identique avec lui, pas parce qu'une mesure l'a demandé. **C'est une décision de jugement, et elle est présentée comme telle.** Dans une application avec de longues listes ou des interactions fines, le calcul s'inverse, et l'annonce de la version 1.0 rapporte des améliorations allant jusqu'à 12 % sur les chargements et les navigations dans des applications de Meta ([React, « React Compiler v1.0 »](https://react.dev/blog/2025/10/07/react-compiler-1)).

### 9.2 Publier

#### 9.2.1 Ce qui reste dans `dist/`

`npm run build` fait deux choses, dans l'ordre : `tsc -b`, qui vérifie les types et ne génère pas de JavaScript (il ne laisse qu'un fichier d'état dans `node_modules/.tmp/` pour que la vérification suivante soit plus rapide), et `vite build`, qui empaquette. Ce qui reste dans `dist/` tient en trois fichiers : un `index.html` qui pointe vers un JavaScript et une feuille de styles, et ces deux-là dans `dist/assets/`, avec un morceau de leur contenu dans le nom (`Cs1CcfeN`, `CbqUABMA`). Ce morceau change chaque fois que le contenu change, et c'est ce qui permet un cache agressif : le navigateur peut garder `index-Cs1CcfeN.js` toute une année, parce que si le code change, le nouveau fichier portera un autre nom. Celui qui **ne** peut **pas** être gardé sans demander, c'est `index.html`, qui dit quels fichiers sont d'actualité.

`dist/` est tout ce qui est publié. Il n'y a pas de serveur React, ni de Node, ni rien qui s'exécute côté serveur : ce sont des fichiers statiques. La documentation de Vite le dit ainsi : tu peux déployer le dossier `dist` sur la plateforme de ton choix ([Vite, « Deploying a Static Site »](https://vite.dev/guide/static-deploy)). Ce que cette phrase ne dit pas, c'est ce que cette plateforme doit faire, et c'est là que commencent les problèmes.

#### 9.2.2 `vite preview` n'est pas un serveur de production

`npm run preview` démarre un serveur qui sert `dist/` sur le port 4173. La documentation de Vite est explicite sur son usage : il sert à prévisualiser le build sur ta machine et **n'est pas conçu comme un serveur de production** ([Vite, « Deploying a Static Site »](https://vite.dev/guide/static-deploy)). Dans la Leçon 5, tu as vu qu'il renvoie bien `index.html` quand tu recharges une route du client. Alors, que lui manque-t-il ? On mesure. Trois questions posées à l'aperçu du point de contrôle :

```text
$ npx vite preview --port 4109 --strictPort
$ curl -sI http://localhost:4109/servicios/pagos
HTTP/1.1 200 OK
Vary: Origin
Content-Type: text/html
Cache-Control: no-cache
Etag: W/"188-NTjMluUw3sCMmwdKb29psG22o7w"
Date: Thu, 22 Oct 2026 19:29:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4109/assets/no-existe.js
200 text/html
$ curl -sI http://localhost:4109/assets/index-Cs1CcfeN.js | grep -i "cache-control\|content-type"
Content-Type: text/javascript
Cache-Control: no-cache
```

Trois constats, et aucun n'est une erreur de Vite, car l'aperçu ne promet rien de tout cela :

1. **Il n'y a pas de politique de sécurité du contenu.** La réponse ne porte pas `Content-Security-Policy`. Si un jour du HTML étranger se glisse dans la page (9.2.5), le navigateur n'a aucune règle qui lui permette de refuser de l'exécuter.
2. **Un fichier qui n'existe pas répond `200` avec du HTML.** Tu as demandé `/assets/no-existe.js` et l'aperçu t'a donné `index.html`. Imagine que tu publies une nouvelle version pendant que quelqu'un a l'ancienne ouverte, et que sa page demande un JavaScript qui n'est plus là : au lieu d'un `404` clair, le navigateur reçoit du HTML là où il attendait du JavaScript et échoue avec une erreur de type de contenu que personne ne comprend. La réécriture est correcte pour les routes du client et fausse pour les fichiers.
3. **Le JavaScript dont le nom contient un condensat du contenu n'est pas mis en cache.** `no-cache` sur `index-Cs1CcfeN.js` oblige le navigateur à demander à chaque fois, alors que ce fichier ne peut jamais changer.

#### 9.2.3 Le serveur de publication du `revisor`

Le point de contrôle apporte un serveur maison, `servidor/publicar.ts`, de 146 lignes, qui sert `dist/` et règle justement ces trois points. Ce n'est pas fait pour que tu l'utilises tel quel en production : c'est pour que tu voies chaque décision qu'un vrai serveur (nginx, Caddy, celui de ta plateforme d'hébergement) doit prendre, écrite dans un langage que tu lis déjà. Il se démarre avec un nouveau script, `"publicado": "node servidor/publicar.ts"`, sur le port 4180, et redirige `/api/*` vers l'API d'entraînement, comme le *proxy* de Vite en développement.

```ts
// revisor/servidor/publicar.ts
// Servidor de la versión publicada del `revisor` (Lección 9). Sirve lo que
// `npm run build` dejó en dist/, con tres cosas que `vite preview` no garantiza:
//   1. Reescritura: una ruta del cliente (/servicios/pagos) responde index.html.
//   2. Encabezados de seguridad: CSP sin 'unsafe-inline' y nosniff.
//   3. Una lista CERRADA de archivos: solo se entrega lo que había en dist/ al
//      arrancar; ninguna ruta que escriba el cliente se convierte en una ruta de disco.
// Las peticiones a /api se reenvían a la API (API_URL), como hacía el proxy de Vite.
import { readdir, readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PUERTO = Number(process.env.PUERTO ?? "4180");
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100";
const RAIZ = fileURLToPath(new URL("../dist/", import.meta.url));

const TIPOS: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const POLITICA = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

async function listarArchivos(carpeta: string): Promise<Map<string, Buffer>> {
  const archivos = new Map<string, Buffer>();
  const entradas = await readdir(carpeta, { recursive: true, withFileTypes: true });

  for (const entrada of entradas) {
    if (entrada.isFile()) {
      const ruta = join(entrada.parentPath, entrada.name);
      archivos.set(`/${relative(carpeta, ruta).split(sep).join("/")}`, await readFile(ruta));
    }
  }

  return archivos;
}

function enviar(
  respuesta: ServerResponse,
  codigo: number,
  tipo: string,
  cuerpo: Buffer | string,
  cache: string,
): void {
  respuesta.writeHead(codigo, {
    "content-type": tipo,
    "cache-control": cache,
    "content-security-policy": POLITICA,
    "x-content-type-options": "nosniff",
  });
  respuesta.end(cuerpo);
}

const archivos = await listarArchivos(RAIZ);
const indice = archivos.get("/index.html");

if (indice === undefined) {
  registrar("no existe dist/index.html: corre `npm run build` antes de `npm run publicado`");
  process.exit(1);
}

const servidor = createServer((solicitud, respuesta) => {
  const url = new URL(solicitud.url ?? "/", "http://revisor.local");
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => registrar(`${metodo} ${url.pathname} ${respuesta.statusCode}`));

  if (url.pathname.startsWith("/api/")) {
    const cuerpo = metodo === "GET" || metodo === "HEAD" ? undefined : solicitud;

    fetch(new URL(url.pathname + url.search, API_URL), {
      method: metodo,
      headers: { "content-type": solicitud.headers["content-type"] ?? "application/json" },
      body: cuerpo,
      duplex: "half",
    } as RequestInit)
      .then(async (deLaApi) => {
        respuesta.writeHead(deLaApi.status, {
          "content-type": deLaApi.headers.get("content-type") ?? "application/json",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        respuesta.end(Buffer.from(await deLaApi.arrayBuffer()));
      })
      .catch(() => {
        respuesta.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        respuesta.end(JSON.stringify({ detalle: "la API no responde" }));
      });
    return;
  }

  if (metodo !== "GET" && metodo !== "HEAD") {
    respuesta.writeHead(405, { allow: "GET, HEAD" });
    respuesta.end();
    return;
  }

  const archivo = archivos.get(url.pathname);

  if (archivo !== undefined && url.pathname !== "/index.html") {
    const inmutable = url.pathname.startsWith("/assets/");
    enviar(
      respuesta,
      200,
      TIPOS[extname(url.pathname)] ?? "application/octet-stream",
      archivo,
      inmutable ? "public, max-age=31536000, immutable" : "no-cache",
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    enviar(respuesta, 404, "text/plain; charset=utf-8", "no existe", "no-store");
    return;
  }

  // Reescritura: cualquier otra ruta es del cliente, y la decide React Router.
  enviar(respuesta, 200, TIPOS[".html"] ?? "text/html", indice, "no-cache");
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`revisor publicado en http://127.0.0.1:${PUERTO} (API en ${API_URL})`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor detenido"));
    servidor.closeAllConnections();
  });
}
```

Ce qu'il faut comprendre, décision par décision :

- **Le chemin de `dist/` vient de `fileURLToPath`.** `import.meta.url` est une adresse `file:///…`, et la propriété `pathname` d'une `URL` laisse les espaces et les accents encodés (`Mis%20cursos`), ce qui n'est pas un chemin de disque : avec ton dossier dans `~/Mis cursos/`, le serveur échouerait avec `ENOENT` sans dire pourquoi. `fileURLToPath` ([Node.js, `url`](https://nodejs.org/api/url.html#urlfileurltopathurl)) décode. C'est mesuré : avec le serveur copié dans un dossier appelé « con espacios y acentós », `pathname` ne trouve pas `dist/`, alors que `fileURLToPath` le trouve.
- **Une liste fermée de fichiers.** Au démarrage, `listarArchivos` lit **tout** `dist/` en mémoire, dans une `Map` dont la clé est le chemin public (`/assets/index-Cs1CcfeN.js`). Ensuite, aucune requête ne touche le disque : le serveur cherche l'adresse dans la `Map` et, si elle n'y est pas, elle n'existe pas. Ainsi, aucune adresse écrite par quelqu'un (`/../../etc/passwd`, par exemple) ne se transforme en chemin de fichier. C'est la défense la plus simple contre la traversée de répertoires (*path traversal*), parce que l'attaque n'a nulle part où s'appliquer.
- **La réécriture, avec une exception.** Toute adresse qui n'est pas un fichier répond `index.html`, pour que React Router décide ; **sauf** celles qui commencent par `/assets/`, qui répondent `404`. Là, un fichier manquant est bien une erreur et on le dit.
- **La politique de sécurité du contenu.** `default-src 'none'` interdit tout, et chaque directive suivante n'ouvre que le nécessaire : scripts, styles, images et connexions depuis la même origine (`'self'`), formulaires qui ne s'envoient qu'à la même origine, aucune balise `<base>` et aucun site pouvant mettre le panneau dans un `<iframe>`. Il n'y a pas de `'unsafe-inline'` : un `<script>` écrit dans le HTML ne s'exécute pas. Le build de Vite ne place aucun script en ligne dans `index.html`, et c'est pourquoi cette politique ne casse pas le panneau.
- **`nosniff`.** Il dit au navigateur de croire le `content-type` que déclare le serveur et de ne pas essayer de le deviner d'après le contenu.
- **Un cache par type de fichier.** `/assets/*` porte `public, max-age=31536000, immutable` : un an, et la promesse que cela ne changera pas. `index.html` porte `no-cache` : le navigateur peut le garder, mais doit demander avant de l'utiliser. Ce serveur n'envoie ni `ETag` ni `Last-Modified`, donc cette « question » se termine toujours par un téléchargement complet : c'est 392 octets et cela n'a pas d'importance ; un serveur de production ajoute le validateur et répond `304` quand le fichier n'a pas changé.

Avec l'API d'entraînement et le serveur de publication démarrés, six questions :

```text
$ PUERTO=3109 npm run servidor
$ PUERTO=4109 API_URL=http://127.0.0.1:3109 npm run publicado
$ curl -sI http://127.0.0.1:4109/servicios/pagos
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
content-security-policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
x-content-type-options: nosniff
Date: Thu, 22 Oct 2026 19:29:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/assets/no-existe.js
404 text/plain; charset=utf-8
$ curl -sI http://127.0.0.1:4109/assets/index-Cs1CcfeN.js | grep -i cache-control
cache-control: public, max-age=31536000, immutable
$ curl -s --path-as-is -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/../../etc/passwd
200 text/html; charset=utf-8
$ curl -s -X POST -H "content-type: application/json" -d '{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}' -w " → %{http_code}\n" http://127.0.0.1:4109/api/servicios
{"nombre":"correo","tipo":"disponible","codigoHttp":200,"duracionMs":75} → 201
$ curl -sI http://127.0.0.1:4109/favicon.ico | head -3
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
```

La première est le rechargement de la scène, résolu : `200` avec `index.html`, la politique et `no-cache`. La deuxième est le fichier manquant : `404`, et non plus du HTML déguisé. La troisième, le cache long. La quatrième mérite une lecture attentive : `--path-as-is` demande à `curl` de **ne pas** nettoyer les `..` et de les envoyer tels quels, comme le ferait quelqu'un qui essaie de sortir du dossier. Le serveur a répondu `200` avec `index.html`, pas avec le fichier du système. Le journal du serveur dit pourquoi :

```text
19:29:32.997 revisor publicado en http://127.0.0.1:4109 (API en http://127.0.0.1:3109)
19:29:34.967 HEAD /servicios/pagos 200
19:29:34.976 GET /assets/no-existe.js 404
19:29:34.985 HEAD /assets/index-Cs1CcfeN.js 200
19:29:34.992 GET /etc/passwd 200
19:29:35.314 POST /api/servicios 201
19:29:35.322 HEAD /favicon.ico 200
19:29:36.676 GET /servicios/pagos 200
19:29:36.683 GET /assets/index-CbqUABMA.css 200
19:29:36.684 GET /assets/index-Cs1CcfeN.js 200
19:29:36.720 GET /favicon.ico 200
19:29:38.213 GET /api/servicios/pagos 200
```

`new URL()` a normalisé `/../../etc/passwd` en `/etc/passwd`, qui n'est pas dans la `Map`, donc c'est « une route du client » et il répond `index.html`. Deux défenses superposées : la normalisation de l'URL et la liste fermée. Et la cinquième question, le `POST` de l'enregistrement, est arrivée à l'API par la redirection avec son `201`. La sixième, `/favicon.ico`, tu en auras besoin dans l'exercice 3 ; ne la lis pas encore.

Les cinq dernières lignes du journal sont Chrome sans fenêtre qui ouvre `/servicios/pagos` sur le serveur publié : il demande la page, la feuille de styles, le JavaScript et l'icône de l'onglet, puis, une fois React lancé, le détail à l'API. Voici le `#raiz` qu'il a dessiné, avec l'en-tête, le bac à avis vide et le détail de `pagos` :

```text
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a><a class="" href="/servicios/nuevo" data-discover="true">Dar de alta</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header><section class="bandeja" aria-label="Avisos"><div role="status" aria-atomic="false"></div></section><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><dl><dt>Estado</dt><dd>En falla: HTTP 503</dd><dt>Revisiones</dt><dd>0</dd><dt>Última revisión</dt><dd>2026-10-22T19:29:17.619Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre pagos<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Le titre de l'onglet, dans le `<head>` du même vidage, était `pagos · Revisor` : l'Effect de `useTituloDocumento` de la Leçon 3, qui fonctionne dans la version publiée, avec la politique de sécurité activée.

Ce que ce serveur **ne** fait **pas**, et qu'un serveur de production fait : HTTPS, compression (gzip ou brotli), journaux avec rotation, limites de taille et de durée pour les requêtes, et redémarrage automatique en cas de panne. Pour cela, on place nginx, Caddy ou la plateforme de ton choix devant, ou à sa place, avec les mêmes règles : réécriture sauf `/assets/`, la même politique et le même cache. Les règles sont ce que cette section enseigne ; le programme qui les applique peut changer.

#### 9.2.4 `VITE_` sans secrets, maintenant dans ce qui est publié

La Leçon 0 l'a démontré en développement : ce qui commence par `VITE_` est écrit dans le JavaScript que n'importe qui télécharge, et ce qui ne commence pas ainsi n'y arrive pas ([Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode)). À la publication, on boucle la boucle par une habitude : **avant de publier, on cherche dans `dist/`**. Sur le point de contrôle :

```text
$ grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js dist/index.html | sort | uniq -c
   1 dist/assets/index-Cs1CcfeN.js:clave
   3 dist/assets/index-Cs1CcfeN.js:password
$ grep -ioE ".{60}password.{60}" dist/assets/*.js
datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0
.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Qr=An&&`
===`http:`||t.protocol===`https:`)return t.username!==``||t.password!==``?{ok:!1,detalle:`quita el usuario y la clave de la dire
```

Quatre correspondances, sur deux lignes du fichier (`grep -c` dirait `2`), et aucune n'est une fuite. Deux sont du code de React DOM qui énumère les types de `<input>` (`email`, `number`, `password`, `url`…) pour savoir comment traiter chacun. Les deux autres viennent du `revisor` lui-même : le schéma de l'ajout de la Leçon 7 lit `url.password` pour refuser une adresse avec un utilisateur ou un mot de passe, et son message dit « quita el usuario y la clave de la dirección ». La leçon importante n'est pas le nombre : **un résultat de recherche se lit, il ne se compte pas**. Zéro correspondance n'aurait rien prouvé non plus, car une vraie clé ne s'appelle presque jamais `clave`.

C'est pourquoi la recherche qui sert vraiment est celle des **valeurs**. Pour le voir, une copie du point de contrôle lit deux variables qu'elle ne devrait pas lire (l'une avec préfixe et l'autre sans), les déclare dans `vite-env.d.ts` et affiche les deux depuis `main.tsx` pour que le build ne les écarte pas :

```ts
// fragmento: la copia, al final de src/configuracion.ts
// ⛔ SOLO PARA LA DEMOSTRACIÓN: una clave en una variable VITE_ y otra sin el prefijo.
export const claveConPrefijo = import.meta.env.VITE_CLAVE_MONITOREO;
export const claveSinPrefijo = import.meta.env.CLAVE_MONITOREO;

// fragmento: la copia, en src/vite-env.d.ts, dentro de ImportMetaEnv
  readonly VITE_CLAVE_MONITOREO?: string;
  readonly CLAVE_MONITOREO?: string;

// fragmento: la copia, en src/main.tsx, después de los import
import { claveConPrefijo, claveSinPrefijo } from "./configuracion";

console.info("monitoreo:", claveConPrefijo, claveSinPrefijo);
```

Et on construit avec de fausses valeurs :

```text
$ VITE_CLAVE_MONITOREO=mon_prueba_7f3a91 CLAVE_MONITOREO=mon_secreta_c0ffee npm run build
...
dist/assets/index-DfHw2mrm.js   374.71 kB │ gzip: 117.32 kB
$ grep -o '.\{30\}mon_prueba_7f3a91.\{10\}' dist/assets/*.js
s?t:ds}var hs=ms(`10000`),gs=`mon_prueba_7f3a91`;async fu
$ grep -c mon_secreta_c0ffee dist/assets/*.js
0
```

Celle de `VITE_` est restée écrite à côté de `ms(`10000`)`, qui est `leerCadaMs` avec la valeur du `.env`. L'autre, non. Si ton équipe conserve les valeurs réelles de ses clés dans un gestionnaire de secrets, la recherche qui compte est celle-là : prendre chaque valeur et la chercher dans `dist/`. Si elle apparaît, la clé n'est plus secrète et il faut la changer, pas seulement la retirer du bundle.

#### 9.2.5 Rappel sur le XSS : trois couches

Le cours de TypeScript a enseigné l'attaque : si une page insère comme HTML un texte venu de l'extérieur, ce texte peut apporter un `<script>` ou un `onerror` qui s'exécute avec les droits de la personne qui a ouvert la page. Cela s'appelle le *cross-site scripting* (XSS). Dans le `revisor`, « l'extérieur », c'est l'API : les noms de service sont saisis par la personne qui enregistre, et ils arrivent à l'écran de tout le monde. La figure 3 donne à React un nom de service qui contient une attaque, et une adresse `javascript:` dans un lien :

```tsx
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
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_03.tsx
$ node fig09_03.js
1. texto como hijo de JSX:
  <strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong>
2. texto en un atributo:
  <li title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;">pagos</li>
3. una URL javascript: en href:
  <a href="javascript:throw new Error(&#x27;React has blocked a javascript: URL as a security precaution.&#x27;)">pagos</a>
```

Remarque qu'aucun `[aviso de React]` n'est sorti dans cette exécution : React 19.3.1 a remplacé l'adresse sans rien afficher dans `console.error`. Le crochet du haut est là pour que tu le voies par toi-même.

**Première couche : React échappe le texte.** Dans les cas 1 et 2, le `<img onerror>` est arrivé comme du texte : `&lt;img …&gt;`. Le navigateur l'affiche comme des lettres et ne crée aucune image. Cela se produit toujours quand la donnée va comme enfant de JSX ou comme valeur d'un attribut de texte (`title`, `aria-label`, `value`), ce qui est la manière dont le `revisor` affiche tout. Les attributs que le navigateur traite comme une adresse ou comme un document (`href`, `src`, `formAction`, `srcDoc` d'un `<iframe>`) sont une autre histoire : l'échappement ne les protège pas, car une adresse dangereuse ne contient aucun caractère à échapper. React 19 bloque `javascript:`, comme le montre le cas 3, mais ne vérifie pas le reste. Une adresse qui vient de l'extérieur se valide avant d'être utilisée, par exemple en exigeant qu'elle commence par `https://`, comme le fait le schéma d'enregistrement de la Leçon 7 avec `urlHttp`. La voie que React offre pour insérer du HTML est `dangerouslySetInnerHTML` (en dehors de React, avec un `ref`, il reste aussi `innerHTML`, `outerHTML` et `insertAdjacentHTML` ; la règle du linter de la Leçon 0 couvre les deux premiers, et les deux autres se vérifient à l'œil), et la documentation de React le dit sans détour : si le HTML n'est pas de confiance, par exemple s'il repose sur des données d'utilisateurs, tu t'exposes à une vulnérabilité XSS ([React, composants communs](https://react.dev/reference/react-dom/components/common)). Dans le cas 3, React 19 a remplacé l'adresse `javascript:` par une adresse qui lève une erreur : « React has blocked a javascript: URL as a security precaution ». React 16.9 avait annoncé qu'il le ferait dans une future version majeure ([React, « React v16.9.0 »](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html)) ; la figure montre que la 19.3.1 le fait déjà.

**Deuxième couche : le linter.** Le `eslint.config.js` du `revisor` apporte depuis la Leçon 0 une règle `no-restricted-syntax` qui rejette `dangerouslySetInnerHTML` et les affectations à `innerHTML`. Si quelqu'un l'ouvre, `npm run lint` passe au rouge et la vérification du cours ne passe pas.

**Troisième couche : la politique de sécurité du contenu.** Si les deux premières échouaient (une bibliothèque qui insère du HTML de son propre chef, une étourderie), la politique du serveur de publication interdit encore d'exécuter des scripts qui ne viennent pas d'un fichier de la même origine. Un `onerror` écrit dans le HTML est du code en ligne, et sans `'unsafe-inline'` le navigateur ne l'exécute pas. C'est la seule des trois couches qui ne vit **pas** dans ton code : elle vit dans le serveur. C'est pourquoi il importe de savoir qui publie et comment.

### 9.3 Server Components, Server Functions et quand utiliser un framework

#### 9.3.1 Ce que c'est

Tout ce que le `revisor` dessine, c'est le navigateur qui le dessine. React 19 offre une autre possibilité. Les **Server Components** sont des composants qui sont dessinés plus tôt, dans un environnement séparé de l'application du navigateur : ils peuvent s'exécuter une fois au moment du build, sur le serveur d'intégration continue, ou à chaque requête, sur un serveur web ([React, « Server Components »](https://react.dev/reference/rsc/server-components)). Comme ils s'exécutent sur le serveur, ils peuvent lire une base de données ou un fichier directement, sans API entre les deux, et ce qui arrive au navigateur est le résultat déjà dessiné, pas le code qui l'a produit. Les **Server Functions** sont le chemin de retour : des fonctions asynchrones qui s'exécutent sur le serveur et qu'un composant du navigateur peut appeler. Elles sont marquées par la directive `"use server"` ; le framework crée une référence qui voyage jusqu'au navigateur, et quand on l'appelle, React envoie une requête au serveur pour l'exécuter et renvoie le résultat ([React, « Server Functions »](https://react.dev/reference/rsc/server-functions)). Jusqu'en septembre 2024 elles s'appelaient « Server Actions » ; aujourd'hui ce nom est réservé à celles que l'on passe à une `action` ou que l'on appelle depuis une action, comme le `<form action>` de la Leçon 7.

Deux précisions de la documentation qui évitent des confusions courantes. La première : **il n'y a pas de directive pour les Server Components** ; `"use server"` sert aux Server Functions, pas à marquer un composant. La seconde, qui décide beaucoup : même si les Server Components de React 19 sont stables entre versions mineures, les éléments internes que les bundlers et les frameworks utilisent pour les implémenter **ne suivent pas le versionnage sémantique** et peuvent casser entre des versions mineures de React 19.x. C'est pourquoi la documentation recommande à qui construit cette intégration de fixer une version exacte de React ou d'utiliser la version *Canary*. Ce qui suit est déjà un jugement propre à ce cours, pas à la documentation : les Server Components s'utilisent à travers un framework qui maintient cette intégration à ta place. Vite a un *plugin* officiel pour eux, `@vitejs/plugin-rsc` (version 0.5.38 le 21 octobre 2026, encore avant la 1.0), qui se décrit comme agnostique du framework et fournit les briques de bas niveau pour en construire un par-dessus ; c'est une base pour qui fabrique des frameworks, pas une pièce pour une application comme le `revisor`.

Et un avertissement de sécurité qui vaut pour toute conception avec un serveur : les arguments d'une Server Function **sont entièrement contrôlés par le client**. La documentation demande de toujours les traiter comme une entrée non fiable, de les valider, et de vérifier dans chaque Server Function que la personne qui l'appelle a le droit de faire ce qu'elle demande ([React, `"use server"`](https://react.dev/reference/rsc/use-server)). Une Server Function est, en pratique, une route publique de ton serveur sous un autre nom. Le précédent le plus marquant est récent : le 3 décembre 2025, l'équipe de React a publié une vulnérabilité critique dans les Server Components, la CVE-2025-55182, avec un score CVSS de 10,0 (CVSS est l'échelle standard de gravité ; 10,0 est le maximum), qui permettait d'exécuter du code sur le serveur sans s'authentifier en exploitant un défaut dans la façon dont React décodait les requêtes vers les Server Functions. Selon l'avis, une application pouvait être vulnérable même sans définir aucune Server Function, du seul fait d'admettre les Server Components ; et une application dont le code React n'utilise pas de serveur n'était pas concernée ([React, « Critical Security Vulnerability in React Server Components »](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)). Le `revisor` fait partie de la seconde catégorie. C'est l'autre face des « éléments internes qui ne suivent pas le versionnage sémantique » : celui qui les utilise doit les mettre à jour dès que le correctif sort. Parmi les paquets que l'avis liste comme affectés figure `@vitejs/plugin-rsc`, le même *plugin* que ci-dessus.

#### 9.3.2 Pourquoi ce panneau ne les utilise pas

Le `revisor` n'utilise pas de Server Components pour trois raisons, et il convient de les énoncer avec précision, car « il n'en a pas besoin » sans raisons n'est qu'une opinion :

1. **Ses données ont déjà un serveur, et c'en est un autre.** Le rapport et le détail viennent d'une API qui n'appartient pas au panneau : dans le cours, c'est le serveur d'entraînement ; dans la vie réelle, ce serait le revisor du cours de Go ou celui de TypeScript. Un Server Component brille quand le composant peut lire les données de près. Ici, il devrait les demander à cette même API par HTTP, ce que fait déjà le navigateur, simplement depuis une autre machine.
2. **Ses données changent toutes seules, toutes les dix secondes.** Le rapport est interrogé périodiquement (polling) avec `refetchInterval` (Leçon 4) et invalidé à la nouvelle tentative (Leçon 4) ou à l'enregistrement (Leçon 7). C'est de l'état du serveur **dans le navigateur**, et TanStack Query le gère avec un cache, des nouvelles tentatives et une mise à jour en arrière-plan. Un dessin côté serveur sert pour le premier chargement, pas pour les dix secondes suivantes.
3. **Il n'a pas besoin d'apparaître dans les moteurs de recherche ni de se charger sans JavaScript.** C'est un outil interne, derrière un accès. Les deux gains les plus cités du dessin sur le serveur (que le contenu soit dans le premier HTML pour les moteurs de recherche, et que quelque chose soit visible avant l'arrivée du JavaScript) ne lui rapportent rien.

Il y a une quatrième raison, qui est celle de ce cours et non du panneau : les Server Components exigent un framework, et apprendre un framework en même temps que React cache ce que fait chacun. C'est pourquoi le cours a d'abord enseigné le React qui s'exécute dans le navigateur.

#### 9.3.3 Quand il convient de migrer vers un framework

La documentation de React est claire dans sa recommandation : pour une nouvelle application, **commencer avec un framework** (elle mentionne l'App Router de Next.js, React Router en mode framework et Expo pour les applications natives, entre autres), parce qu'ils apportent déjà le routage, le chargement des données et le dessin sur le serveur ; partir de zéro, avec un outil comme Vite, donne plus de souplesse en échange du fait que tu prends ces décisions toi-même ([React, « Creating a React App »](https://react.dev/learn/creating-a-react-app)). La même page reconnaît les raisons de partir de zéro : des contraintes que les frameworks ne résolvent pas bien, l'envie de construire sa propre structure, ou celle d'apprendre les bases d'une application React. Ce cours relève de la troisième. Et il y a un détail qu'il vaut la peine de connaître : ces frameworks produisent aussi des applications d'une seule page sans serveur, qui peuvent être publiées comme fichiers statiques, et te laissent ajouter des fonctions serveur route par route quand tu en as besoin.

Le critère pour migrer le `revisor`, ou toute application semblable, est propre à ce cours, pas à la documentation, et il s'écrit sous forme de signaux vérifiables :

| Signal | À quoi cela ressemble dans le `revisor` | Migrer ? |
|---|---|---|
| Des pages publiques doivent apparaître dans les moteurs de recherche | Non : c'est un outil interne | Non |
| Le premier chargement est lent et la mesure le démontre (gros JavaScript, cascades de requêtes à l'ouverture) | 117 kB compressés et une requête à l'ouverture ; non mesuré comme un problème | Non |
| Les données sont dans une base de données propre et l'API n'existe que pour l'écran | Non : l'API appartient à un autre programme et a d'autres clients | Non |
| Des données ou des clés ne peuvent pas arriver au navigateur et obligent aujourd'hui à écrire une API uniquement pour cela | Non : il n'y a pas de secrets à l'écran (9.2.4) | Non |
| L'équipe réinvente à grand effort le routage, le chargement des données par route et la gestion des erreurs | Non : React Router et TanStack Query s'en chargent | Non |

Si un jour deux ou trois lignes passent de « Non » à « Oui », la migration commence à rentabiliser son coût, qui est réel : un serveur Node à exploiter, un nouveau modèle mental (ce qui s'exécute où), et des éléments qui dépendent des versions du framework. D'ici là, le `revisor` est ce que la documentation appelle une application d'une seule page, et il est bon qu'il le soit.

### 9.4 Ce que nous avons trouvé en mesurant

Écrire cette leçon a obligé à mesurer le panneau de bout en bout, et la mesure a trouvé cinq défauts qu'aucune leçon précédente n'avait vus. Aucun ne casse un test de la Leçon 8, parce qu'aucun test ne les cherchait. Tous se ferment de la même manière, avec l'habitude de cette leçon : d'abord on écrit le test qui décrit le comportement correct et on le voit **rouge** contre le code d'aujourd'hui ; ensuite on corrige, et le même test se voit **vert**. Les huit nouveaux tests vivent dans quatre fichiers et couvrent les cinq défauts (les deux de CSS partagent un fichier).

Les cinq correctifs et leurs quatre fichiers de test font partie du point de contrôle de cette leçon. Pour voir la phase rouge, les quatre fichiers de test ont été exécutés dans une copie du point de contrôle **sans** les correctifs, c'est-à-dire contre le code tel que la Leçon 8 l'a laissé :

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts

 RUN  v5.0.5 ~/curso-react/rojo

 ❯ src/configuracion.test.ts (3 tests | 1 failed) 4ms
   ❯ leerCadaMs (3)
     ✓ acepta un intervalo razonable 1ms
     ✓ usa diez segundos si el valor no es un entero positivo 0ms
     × usa diez segundos si el intervalo se sale de los límites 2ms
 ❯ src/reporte/ResumenFallas.test.tsx (1 test | 1 failed) 14ms
   ❯ el resumen de fallas (1)
     × un solo servicio se dice en singular 13ms
 ❯ src/reporte/panel.test.ts (2 tests | 2 failed) 6ms
   ❯ la hoja de estilos (2)
     × cada clase de la hoja la usa algún componente 5ms
     × la hora de actualización se ve secundaria y se lee bien 0ms
 ❯ src/consultas/cliente.test.ts (2 tests | 1 failed) 6017ms
   ❯ el cliente de consultas (2)
     × no reintenta un 404: el servicio no va a aparecer por insistir 3011ms
     ✓ reintenta dos veces un 503: puede ser pasajero 3006ms
...
 Test Files  4 failed (4)
      Tests  5 failed | 3 passed (8)
```

Cinq rouges, un par défaut, et trois verts qui protégeaient déjà ce qui fonctionnait. Chaque section suivante montre son test, le message de son échec et le correctif, tels qu'ils figurent dans le point de contrôle.

#### 9.4.1 `VITE_CADA_MS` sans limite

**Ce qui a été mesuré.** C'est le troisième message de la scène. Avec le point de contrôle sous `npm run dev`, `VITE_CADA_MS=2147483648` et Chrome sans fenêtre ouvert sur `/` pendant cinq secondes, le journal de l'API d'entraînement :

```text
$ VITE_CADA_MS=2147483648 npx vite --port 5109 --strictPort
10:10:47.922 GET /api/estados cancelada por el cliente
10:10:48.225 GET /api/estados 200
10:10:48.537 GET /api/estados 200
10:10:48.842 GET /api/estados 200
10:10:49.151 GET /api/estados 200
10:10:49.457 GET /api/estados 200
10:10:49.761 GET /api/estados 200
10:10:50.066 GET /api/estados 200
10:10:50.371 GET /api/estados 200
10:10:50.675 GET /api/estados 200
10:10:50.978 GET /api/estados 200
```

(La première ligne est la paire habituelle de `StrictMode`.) Dix requêtes en moins de trois secondes, une toutes les ~305 ms environ, ce qui est exactement le temps que met l'API à répondre : le panneau interroge dès qu'on lui répond. La personne qui a écrit ce nombre voulait environ 25 jours entre deux interrogations. Pourquoi ? L'interrogation périodique de TanStack Query utilise `setInterval`, et MDN explique la limite : le délai est converti en entier signé sur 32 bits, donc le maximum est 2 147 483 647 ms (environ 24,8 jours) ; une valeur supérieure **déborde** et peut donner un nombre négatif, que le navigateur traite comme « sans attente » ([MDN, `setTimeout`, « Maximum delay value »](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)). 2 147 483 648 est exactement un de plus que le maximum : en débordant, il devient −2 147 483 648, un délai négatif. Et le débordement n'est pas toujours aussi spectaculaire : avec `VITE_CADA_MS=99999999999`, dans le même test de cinq secondes il n'y a eu qu'une seule requête, parce que ce nombre, en débordant, donne environ 14 jours. Un défaut qui tantôt se voit et tantôt non est le pire type.

L'autre extrémité existe aussi : `VITE_CADA_MS=1` passe le filtre de `leerCadaMs` (c'est un entier positif) et demande au navigateur une interrogation sans pause. La même exécution de cinq secondes :

```text
$ VITE_CADA_MS=1 npx vite --port 5109 --strictPort
13:22:56.829 GET /api/estados cancelada por el cliente
13:22:57.131 GET /api/estados 200
13:22:57.452 GET /api/estados 200
13:22:57.759 GET /api/estados 200
13:22:58.066 GET /api/estados 200
13:22:58.371 GET /api/estados 200
13:22:58.678 GET /api/estados 200
13:22:58.988 GET /api/estados 200
13:22:59.299 GET /api/estados 200
13:22:59.606 GET /api/estados 200
13:22:59.912 GET /api/estados 200
13:23:00.218 GET /api/estados 200
13:23:00.461 GET /api/estados cancelada por el cliente
```

Le même résultat pratique : une interrogation dès que la réponse arrive. (La dernière ligne est la requête en cours quand Chrome a été fermé.)

**Le test.** Un nouveau fichier à côté de `configuracion.ts` :

```ts
// revisor/src/configuracion.test.ts
import { describe, expect, test } from "vitest";
import { leerCadaMs } from "./configuracion";

describe("leerCadaMs", () => {
  test("acepta un intervalo razonable", () => {
    expect(leerCadaMs("5000")).toBe(5_000);
  });

  test("usa diez segundos si el valor no es un entero positivo", () => {
    for (const valor of [undefined, "", "abc", "0", "-5", "1e4", "10s"]) {
      expect(leerCadaMs(valor)).toBe(10_000);
    }
  });

  test("usa diez segundos si el intervalo se sale de los límites", () => {
    expect(leerCadaMs("999")).toBe(10_000);
    expect(leerCadaMs("1000")).toBe(1_000);
    expect(leerCadaMs("3600000")).toBe(3_600_000);
    expect(leerCadaMs("3600001")).toBe(10_000);
    expect(leerCadaMs("99999999999")).toBe(10_000);
  });
});
```

La phase rouge : `expected 999 to be 10000`. Aujourd'hui `leerCadaMs("999")` renvoie 999 ; le test dit qu'un intervalle inférieur à une seconde n'est pas accepté.

**Le correctif.** Deux limites, avec leur raison écrite à côté. En dehors d'elles, on utilise la valeur habituelle, comme pour un texte qui n'est pas un nombre : la configuration invalide ne casse pas le panneau, elle est ignorée.

```ts
// revisor/src/configuracion.ts
const CADA_MS_PREDETERMINADO = 10_000;

// Menos de un segundo entre preguntas no deja respirar a la API (cada respuesta tarda
// 300 ms), y más de una hora ya no es un sondeo. Además, setInterval guarda el intervalo
// en un entero de 32 bits: arriba de 2_147_483_647 ms se desborda, y la espera queda en
// cualquier valor, a veces cero.
const CADA_MS_MINIMO = 1_000;
const CADA_MS_MAXIMO = 3_600_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  const ms = Number(valor);
  return ms >= CADA_MS_MINIMO && ms <= CADA_MS_MAXIMO ? ms : CADA_MS_PREDETERMINADO;
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

Le minimum d'une seconde et le maximum d'une heure sont un critère propre au cours, pas une norme : une seconde, c'est plus de trois fois le temps que met l'API à répondre, et au-delà d'une heure ce n'est plus une interrogation périodique. Ce qui n'est **pas** un critère, c'est que le maximum reste en dessous de 2 147 483 647 : c'est `setInterval` qui l'exige. La même mesure avec le correctif, le même nombre et les mêmes cinq secondes :

```text
10:10:59.307 GET /api/estados cancelada por el cliente
10:10:59.610 GET /api/estados 200
```

Une requête : la valeur a été ignorée et le panneau est revenu à ses dix secondes.

#### 9.4.2 Le singulier de « servicios »

**Ce qui a été mesuré.** Avec un seul service dans le rapport, le résumé dit « 1 servicios revisados ». La Leçon 1 a soigné le singulier des pannes avec `textoFallas` (« 1 servicio con falla »), mais le total est resté écrit à la main dans le composant, `{estados.length} servicios revisados`, et personne ne l'a testé avec un seul. Le test de la Leçon 8 qui protège le `0` isolé utilise deux services, donc il ne le voyait pas non plus.

**Le test.** Il monte uniquement `ResumenFallas` avec un service en panne, parce que le défaut est celui de ce composant et que l'application entière n'est pas nécessaire :

```tsx
// revisor/src/reporte/ResumenFallas.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ResumenFallas } from "./ResumenFallas";

describe("el resumen de fallas", () => {
  test("un solo servicio se dice en singular", () => {
    render(<ResumenFallas estados={[{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }]} />);
    expect(screen.getByText(/revisad/).textContent).toBe("1 servicio revisado · 1 servicio con falla");
  });
});
```

La phase rouge le dit lettre par lettre :

```text
Expected: "1 servicio revisado · 1 servicio con falla"
Received: "1 servicios revisados · 1 servicio con falla"
```

**Le correctif.** Le texte sort dans une fonction pure, à côté de `textoFallas`, et le composant l'utilise :

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export interface Filtros {
  readonly soloFallas: boolean;
  readonly texto: string;
}

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  filtros: Filtros,
): readonly EstadoPublico[] {
  const buscado = filtros.texto.trim().toLocaleLowerCase("es-MX");

  return estados.filter(
    (estado) =>
      (!filtros.soloFallas || estado.tipo === "falla") &&
      (buscado === "" || estado.nombre.toLocaleLowerCase("es-MX").includes(buscado)),
  );
}
```

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas, textoRevisados } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {textoRevisados(estados.length)}
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

Le test existant « sin fallas no pinta un 0 suelto en el resumen » reste vert, parce qu'avec deux services le texte est le même qu'avant.

#### 9.4.3 La nouvelle tentative après un 404

**Ce qui a été mesuré.** Ouvrir `/servicios/nada`, un service qui n'existe pas, avec Chrome sans fenêtre et l'API d'entraînement :

```text
10:11:05.994 GET /api/servicios/nada cancelada por el cliente
10:11:06.195 GET /api/servicios/nada 404
10:11:07.401 GET /api/servicios/nada 404
10:11:09.607 GET /api/servicios/nada 404
```

Trois requêtes, avec 1,2 et 2,2 secondes entre elles, et la personne qui voit « Cargando detalle… » pendant plus de trois secondes avant d'apprendre que le service n'existe pas. C'est le `retry: 2` de la Leçon 4, qui s'applique à **toute** erreur, plus l'attente que TanStack Query place entre les tentatives : elle commence à une seconde et double à chaque fois, jusqu'à un plafond de 30 secondes ([TanStack Query, « Query Retries »](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)). Réessayer a du sens face à un `503` (le service peut revenir dans une seconde) ou à un réseau coupé. Face à un `404`, la réponse est la réponse : le service n'apparaîtra pas à force d'insister. Une précision avant de généraliser : dans le `revisor`, l'API ne répond que `400`, `404` et `409`, et aucun ne change en insistant, donc la règle du point de contrôle est « ne réessayer aucun 4xx ». Dans une vraie API, il y a deux 4xx qui sont bien passagers, le `408` (le délai de la requête est dépassé) et le `429` (trop de requêtes, qui porte souvent `Retry-After`), et une vraie règle de nouvelle tentative les distingue.

Pourquoi la Leçon 8 ne l'a-t-elle pas vu ? Parce que `montarEn` crée son propre `QueryClient` avec `retry: false`, exprès, pour qu'une erreur se voie immédiatement dans les tests. C'est correct pour tester les écrans, et cela laisse sans test la configuration réelle. Le nouveau test utilise le vrai client, `crearClienteConsultas()` :

```ts
// revisor/src/consultas/cliente.test.ts
import { describe, expect, test } from "vitest";
import { consultaDetalle } from "../detalle/consultas";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { crearClienteConsultas } from "./cliente";

describe("el cliente de consultas", () => {
  test("no reintenta un 404: el servicio no va a aparecer por insistir", async () => {
    const fetchFalso = instalarFetchFalso({});
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("nada"))).rejects.toThrow("la API respondió 404");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("reintenta dos veces un 503: puede ser pasajero", { timeout: 10_000 }, async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 503, cuerpo: { detalle: "caída" } },
    });
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("pagos"))).rejects.toThrow("la API respondió 503");
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });
});
```

La phase rouge : `expected "vi.fn()" to be called 1 times, but got 3 times`. Le second test, celui du `503`, est vert depuis le début, et c'est lui qui empêche le correctif paresseux : `retry: false` mettrait le premier au vert et le second au rouge. Les deux ensemble décrivent la règle complète. (Il dure vraiment trois secondes, à cause des attentes entre les tentatives ; c'est pourquoi il porte `timeout: 10_000`.)

**Le correctif.** L'erreur porte le code HTTP comme cause (`cause`, une propriété standard de `Error`), et le client décide avec une fonction plutôt qu'avec un nombre :

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`, { cause: respuesta.status });
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

```ts
// revisor/src/consultas/cliente.ts
import { QueryClient } from "@tanstack/react-query";

// Un 4xx es una respuesta, no una falla pasajera: preguntar otra vez da lo mismo.
// Lo demás (un 503, la red caída) se reintenta dos veces, como antes.
function convieneReintentar(fallas: number, error: Error): boolean {
  const status = error.cause;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }

  return fallas < 2;
}

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: convieneReintentar,
      },
    },
  });
}
```

La même mesure dans le navigateur, avec le correctif :

```text
10:11:13.704 GET /api/servicios/nada cancelada por el cliente
10:11:13.905 GET /api/servicios/nada 404
```

Une requête, et l'avis « No se pudo cargar el detalle: la API respondió 404 » apparaît dès que la réponse arrive.

#### 9.4.4 Du CSS inutilisé

**Ce qui a été mesuré.** `panel.css` contient deux règles qu'aucun composant n'utilise depuis la Leçon 5 : `.seleccionar` (le bouton avec `aria-pressed` de la Leçon 2, que la 5 a remplacé par un lien) et `.detalle` (le panneau de détail de la Leçon 3, que la 5 a remplacé par une page). Ce sont 19 lignes qui voyagent vers chaque navigateur et qui égarent qui lit la feuille, car elles semblent vivantes.

**Le test, et le piège trouvé en l'écrivant.** Le test lit la feuille de styles et le texte des composants, extrait les classes de la feuille et vérifie que chacune apparaît dans un `className`. Pour lire des fichiers comme du texte sans Node, il utilise deux fonctions de Vite que Vitest comprend : `import hoja from "./panel.css?raw"` et `import.meta.glob(…, { query: "?raw" })`.

```ts
// revisor/src/reporte/panel.test.ts
import { describe, expect, test } from "vitest";
import hoja from "./panel.css?raw";

// El texto de cada componente, tal como está escrito (sin las pruebas).
const fuentes = Object.values(
  import.meta.glob<string>(["/src/**/*.tsx", "!/src/**/*.test.tsx"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

// Clases que ningún className escribe con todas sus letras: `disponible` y `falla`
// salen de `estado.tipo` (FilaEstado), y `active` la pone el NavLink de React Router.
const DINAMICAS = ["disponible", "falla", "active"];

function clasesDeLaHoja(css: string): string[] {
  const selectores = css.replace(/\{[^}]*\}/g, " ");
  return [...new Set([...selectores.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1] ?? ""))];
}

// Los textos entre comillas o acentos graves que aparecen después de `className=`.
function usosDeClassName(codigo: string): string[] {
  return codigo
    .split("\n")
    .filter((linea) => linea.includes("className="))
    .flatMap((linea) =>
      [...linea.slice(linea.indexOf("className=")).matchAll(/"([^"]*)"|`([^`]*)`/g)].map(
        (m) => m[1] ?? m[2] ?? "",
      ),
    );
}

function seUsa(clase: string, usos: readonly string[]): boolean {
  return (
    DINAMICAS.includes(clase) ||
    usos.some((uso) =>
      uso
        .split(/\s+/)
        .some((pieza) => new RegExp(`^${pieza.replace(/\$\{[^}]*\}/g, "[a-z0-9-]+")}$`).test(clase)),
    )
  );
}

// Contraste entre dos colores #rrggbb, con la fórmula de WCAG 2.2.
function contraste(uno: string, otro: string): number {
  const luminancia = (hex: string): number => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [clara, oscura] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return ((clara ?? 0) + 0.05) / ((oscura ?? 0) + 0.05);
}

describe("la hoja de estilos", () => {
  test("cada clase de la hoja la usa algún componente", () => {
    const clases = clasesDeLaHoja(hoja);
    const usos = fuentes.flatMap(usosDeClassName);
    // Control positivo: si la hoja o los componentes llegaran vacíos, no habría nada que revisar.
    expect(clases).toContain("tarjeta");
    expect(usos).toContain("tarjeta");
    expect(clases.filter((clase) => !seUsa(clase, usos))).toEqual([]);
  });

  test("la hora de actualización se ve secundaria y se lee bien", () => {
    const regla = /\.actualizado\s*\{([^}]*)\}/.exec(hoja)?.[1] ?? "";
    const color = /(?:^|;|\s)color:\s*(#[0-9a-f]{6})/i.exec(regla)?.[1];
    expect(color, "falta el color de .actualizado").toBeDefined();
    expect(contraste(color ?? "#000000", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(color ?? "#000000", "#ffffff")).toBeLessThan(21);
  });
});
```

La première version de ce test **est passée au vert contre le code défectueux**. Ce n'est pas que le défaut n'existait pas : c'est que la feuille arrivait vide. Vitest, par défaut, ne traite pas les fichiers `.css` ; sa documentation dit que les fichiers exclus sont remplacés par un texte vide, et que `css.include` (vide par défaut) est la liste de ceux qui sont traités ([Vitest, `css`](https://vitest.dev/config/css)). Le reste a été mesuré, la documentation ne le dit pas : un fichier qui n'est pas dans cette liste arrivait aussi vide, même avec `?raw` : `hoja.length` valait `0`. Une feuille vide n'a pas de classes inutilisées, et le test concluait, sans erreur, que tout allait bien. C'est la sorte de vert la plus dangereuse, celle qui n'a rien mesuré.

C'est pourquoi le test comporte deux changements. Le premier est dans `vite.config.ts`, à l'intérieur de `test` :

```ts
// fragmento: revisor/vite.config.ts, solo la parte de `test`
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
```

Le second est le **contrôle positif** dans le test lui-même : avant de chercher des classes inutilisées, il vérifie qu'il en a trouvé au moins une qui est bien utilisée, `tarjeta`, dans la feuille et dans les composants. Sans `css.include`, le test échoue maintenant là où il le doit, au lieu de passer :

```text
 FAIL  src/reporte/panel.test.ts > la hoja de estilos > cada clase de la hoja la usa algún componente
AssertionError: expected [] to include 'tarjeta'
```

Avec la feuille réellement lue, la phase rouge est celle qui intéresse :

```text
AssertionError: expected [ 'seleccionar', 'detalle' ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "seleccionar",
+   "detalle",
+ ]
```

Remarque `DINAMICAS`. Il y a des classes qu'aucun `className` n'écrit en toutes lettres : `disponible` et `falla` viennent de `estado.tipo`, et `active` est posée par `NavLink` sur le lien de la page courante. Un test comme celui-ci ne peut pas les deviner ; il faut les déclarer, et la liste fait partie du code qui est relu. C'est le même problème que rencontrent les outils qui suppriment automatiquement le CSS inutilisé, et c'est pourquoi ils acceptent souvent une liste d'exceptions (dans PurgeCSS, elle s'appelle *safelist*). Le correctif, dans ce cas, est de supprimer ces 19 lignes.

#### 9.4.5 Le CSS de `.actualizado`

**Ce qui a été mesuré.** C'est le défaut à l'envers : `PaginaReporte` dessine `<p className="actualizado">` depuis la Leçon 3, et `panel.css` n'a jamais eu de règle pour cette classe. La ligne « Actualizado a las … · actualizando… » s'affiche avec la même taille et la même couleur que les données, en concurrence avec ce qui compte. Une classe que le composant pose et que la feuille ignore est une promesse non tenue.

**Le test.** Tu l'as déjà vu dans `panel.test.ts` : il cherche la règle `.actualizado`, prend sa `color` et calcule le contraste par rapport au fond blanc avec la formule de WCAG 2.2. Il exige deux choses : qu'il soit d'au moins 4,5 pour 1, le minimum pour du texte normal selon le critère 1.4.3 ([W3C, « Understanding SC 1.4.3: Contrast (Minimum) »](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), et qu'il soit inférieur à 21 pour 1, qui est le noir pur. Cette borne supérieure n'écarte que le noir exact (un `#111111` donne 18,88 pour 1 et passerait) : que la ligne paraisse **secondaire** se décide à l'œil, et le test garantit seulement que la règle existe, qu'elle déclare une couleur et qu'elle se lit. La phase rouge : `falta el color de .actualizado: expected undefined to be defined`.

**Le correctif.** Une règle, à l'endroit où se trouvaient les deux qui ont été supprimées, avec le même gris que celui déjà utilisé par les aides du formulaire de la Leçon 7 :

```css
/* fragmento: revisor/src/reporte/panel.css, solo la regla nueva */
.actualizado {
  color: #57606a;
  font-size: 0.875rem;
}
```

Le contraste de `#57606a` sur fond blanc, calculé avec la même formule : 6,39 pour 1. À titre de comparaison, un gris qui « a l'air bien » au premier regard, `#999999`, donne 2,85 pour 1 et le test le rejetterait.

#### 9.4.6 La phase verte et la suite complète

Les mêmes quatre fichiers de test, dans le point de contrôle, avec les cinq correctifs :

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 22ms
 ✓ src/configuracion.test.ts (3 tests) 3ms
 ✓ src/reporte/panel.test.ts (2 tests) 3ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3012ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  4 passed (4)
      Tests  8 passed (8)
   Start at  07:11:08
   Duration  4.09s (tests 47%, environment 44%, setup 7%, transform 1%, import 1%)
```

Et la suite complète, pour vérifier qu'aucun correctif n'a cassé ce qui était déjà protégé :

```text
$ npm test -- --reporter=default

> revisor@0.9.0 test
> vitest run --reporter=default

 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts (4 tests) 8ms
 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 153ms
 ✓ src/reporte/resumen.test.ts (3 tests) 67ms
 ✓ src/reporte/panel.test.ts (2 tests) 5ms
 ✓ src/app/rutas.test.tsx (3 tests) 486ms
   ✓ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 414ms
 ✓ src/detalle/PaginaServicio.test.tsx (3 tests) 778ms
   ✓ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección 428ms
 ✓ src/reporte/PaginaReporte.test.tsx (7 tests) 791ms
   ✓ la página del reporte (7)
     ✓ error: muestra el motivo y un botón para reintentar 331ms
 ✓ src/compartido/esquema.test.ts (2 tests) 6ms
 ✓ src/configuracion.test.ts (3 tests) 4ms
 ✓ src/alta/FormularioAlta.test.tsx (5 tests) 1259ms
   ✓ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 554ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3020ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  11 passed (11)
      Tests  35 passed (35)
   Start at  16:13:56
   Duration  6.23s (environment 53%, tests 18%, transform 13%, import 8%, setup 7%)

Environment  jsdom was created 11 times · 19.53s total, 53% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

35 sur 35 dans 11 fichiers : les 27 de la Leçon 8 plus les 8 nouveaux. Le bloc `Environment` de trois lignes à la fin est une suggestion de Vitest sur sa propre vitesse (créer jsdom une fois par processus au lieu de onze), pas un avertissement des tests ; il peut apparaître ou non chez toi. Dans le point de contrôle, `npm run lint` s'est terminé sans avertissement et `npm run build` a laissé `index-Cs1CcfeN.js` (374,65 kB) et `index-CbqUABMA.css`, de 1,27 kB : environ 230 octets de moins que la feuille d'avant les correctifs (1,50 kB ; Vite arrondit aux centièmes, et si tu veux le nombre exact, `wc -c` sur les deux fichiers). Le compilateur a continué d'agir : 18 marques.

## L'erreur que tu vas voir

**L'erreur principale : lire l'horloge pendant le dessin.** La première version de la figure 1 avait l'attente à l'intérieur du composant, ainsi :

```tsx
// fragmento: la primera versión de ListaLenta, la que el linter rechazó
function ListaLenta() {
  const hasta = performance.now() + 20;
  while (performance.now() < hasta) {
    // espera activa
  }
  // …
```

Et `npx eslint` a répondu :

```text
~/curso-react/figuras/fig09_01.tsx
  19:17  error  Error: Cannot call impure function during render

`performance.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

~/curso-react/figuras/fig09_01.tsx:19:17
  17 | // Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
  18 | function ListaLenta() {
> 19 |   const hasta = performance.now() + 20;
     |                 ^^^^^^^^^^^^^^^^^ Cannot call impure function
  20 |   while (performance.now() < hasta) {
  21 |     // espera activa
  22 |   }  react-hooks/purity
  20:10  error  Error: Cannot call impure function during render
…
✖ 2 problems (2 errors, 0 warnings)
```

C'est la règle `react-hooks/purity`, l'une de celles que `eslint-plugin-react-hooks` 7 reprend du compilateur. Elle dit quelque chose que tu sais depuis la Leçon 1 : un composant doit donner le même résultat avec les mêmes entrées, et `performance.now()` donne un nombre différent à chaque fois. Si le compilateur mémoïsait un composant qui lit l'horloge, la deuxième fois il réutiliserait l'heure de la première. C'est pourquoi les deux outils partagent des règles : le linter signale ce qui ferait se tromper le compilateur (ou lui ferait sauter le composant, comme dans la figure 2). Le correctif de la figure sort l'attente dans une fonction à part. Attention : cela ne la rend pas pure, cela la cache seulement du linter, qui ne regarde pas à l'intérieur des fonctions que tu appelles. On l'accepte ici **uniquement** parce qu'elle simule un coût et ne produit rien qui soit dessiné, et le commentaire de `gastar` le signale ; faire de même avec une vraie impureté reviendrait à faire taire le linter par un autre chemin. Dans un vrai composant, une heure qui s'affiche est conservée dans l'état ou arrive en prop.

**Le silencieux : le fichier qui n'existe pas et répond du HTML.** Dans l'aperçu, `/assets/no-existe.js` a répondu `200 text/html` (9.2.2). Dans le navigateur, cela se voit comme une page blanche et, dans la console, une erreur qui dit qu'on attendait un module JavaScript et que le serveur a répondu avec le type MIME `text/html`. Elle ne dit pas quel fichier manquait ni pourquoi. Si tu la vois après avoir publié, la question est : mon serveur réécrit-il aussi les adresses de `/assets/` ? Le correctif est celui de `publicar.ts` : la réécriture est pour les routes du client, jamais pour les fichiers.

**L'autre silencieux : le test vert qui n'a rien lu.** Tu l'as vu en 9.4.4. Si un test lit un fichier et conclut « il n'y a pas de problème », demande-toi ce qu'il aurait dit avec le fichier vide. Si la réponse est « la même chose », il lui manque un contrôle positif.

## Les erreurs courantes

**`useMemo` et `memo` partout, « au cas où ».** La figure 1 a montré que la cause des dessins en trop était un état au mauvais endroit. Mémoïser aurait caché le symptôme et laissé la cause, avec plus de code à maintenir.

**Optimiser sans mesurer.** Si tu ne sais pas combien de fois un composant est dessiné ni combien de temps cela prend, tu ne sais pas si ce que tu as changé a servi. `<Profiler>` ou l'onglet Profiler répondent aux deux questions en quelques minutes.

**Mesurer dans le build de production avec `<Profiler>`.** Il y est désactivé, exprès. Les mesures de dessin se font en développement, et celles de l'expérience complète (chargement, réseau) dans la version publiée, avec les outils du navigateur.

**Activer le compilateur sans vérifier qu'il a agi.** Une configuration qui ne donne pas d'erreur ne prouve rien. Cherche ses marques dans `dist/`, et compte-les avec `grep -o … | wc -l`, pas avec `grep -c`.

**Faire taire le linter pour que le compilateur « fonctionne ».** Si une règle du compilateur se plaint, le composant enfreint une règle de React. On corrige le composant. La faire taire laisse un composant que le compilateur saute, ou pire, qu'il optimise mal.

**Publier avec `vite preview`.** Il n'est pas fait pour cela : pas de politique de sécurité, pas de cache pour les fichiers dont le nom contient un condensat du contenu, et du HTML en réponse là où un fichier manque.

**Tout réécrire vers `index.html`, fichiers compris.** Cela transforme un `404` clair en une erreur de type de contenu que personne ne comprend.

**Servir des fichiers en construisant le chemin de disque avec ce que demande le client.** Cela ouvre la porte à la traversée de répertoires. La liste fermée de `publicar.ts` n'a pas cette porte.

**Compter les correspondances en cherchant des secrets.** Le `password` de React DOM est une correspondance qui n'est pas une fuite ; une vraie clé ne s'appelle presque jamais `clave`. On lit chaque résultat, et on cherche les **valeurs**.

**Un test qui lit un fichier sans contrôle positif.** Si le fichier arrive vide, il passe. Ajoute une vérification qu'il a trouvé quelque chose que tu sais être là.

**`retry: false` pour « corriger » une nouvelle tentative de trop.** Cela cesse de réessayer ce qu'il valait bien la peine de réessayer. C'est pourquoi le test du `503` accompagne celui du `404`.

**Migrer vers un framework parce que c'est ce que la documentation recommande pour les nouveaux projets.** Le `revisor` n'est pas un nouveau projet, et le tableau de 9.3.3 n'a pas un seul « Oui ». Une migration se justifie par des signaux, pas par une tendance.

## Exercices

### Exercice 1 — Le Profiler avec tes yeux

Installe l'extension React Developer Tools dans ton navigateur. Avec l'API d'entraînement et `npm run dev` démarrés, ouvre `http://localhost:5173/`, ouvre l'onglet **Profiler**, et dans sa configuration active l'option d'enregistrer pourquoi chaque composant a été dessiné. **Avant d'enregistrer, prédis :** si tu écris `pag` dans « Buscar por nombre », quels composants vont être dessinés à chaque lettre ? `EditorNota` est-il dessiné ? `BandejaAvisos` est-il dessiné ? Enregistre, écris les trois lettres, arrête l'enregistrement et vérifie ta prédiction dans chaque *commit*. Ensuite, regarde l'onglet **Components** : quels composants portent le badge « Memo ✨ » ? Enfin, répète l'enregistrement dans une copie avec `plugins: [react()]`, sans le compilateur, et note si un composant apparaît en trop.

### Exercice 2 — L'autre sens

Le test de 9.4.4 cherche les classes de la feuille qu'aucun composant n'utilise. Pose la question à l'envers, à la main : y a-t-il un `className` écrit dans un composant qui n'a aucune règle dans `panel.css` ? Utilise `grep -rn 'className' src` dans la copie avec les correctifs. **Prédis d'abord** combien tu vas en trouver, en plus de `actualizado`, qui est déjà corrigée. Ensuite décide, pour chacune, s'il lui manque une règle ou si elle va bien sans, et écris ta raison dans le journal de bord.

### Exercice 3 — L'icône qui a répondu `200`

Dans le journal du serveur publié de 9.2.3 apparaît `GET /favicon.ico 200`, mais `dist/` n'a aucun `favicon.ico`. Sans rien exécuter, explique ce que le serveur a répondu et avec quel type de contenu. Puis vérifie-le avec `curl -sI http://127.0.0.1:4180/favicon.ico`. Est-ce un défaut ? Que changerais-tu dans `publicar.ts`, si tu changeais quelque chose ?

### Exercice 4 — Migrer ou non ?

Une équipe te décrit son application : une boutique en ligne avec 4 000 produits, chacun avec sa page, qui est aujourd'hui une application d'une seule page faite avec Vite et React Router ; le service marketing se plaint que les pages produit n'apparaissent pas bien dans les moteurs de recherche, et le premier chargement sur téléphone met, mesuré, quatre secondes. Remplis le tableau de 9.3.3 pour cette application et décide s'il convient de migrer vers un framework. Écris ce que tu mesurerais avant de commencer.

## Solutions

### Solution 1

Ce que tu devrais voir, déduit du code : à chaque lettre sont dessinés au moins `PaginaReporte` (parce que l'adresse a changé : le texte de recherche vit dans `?q=`, Leçon 5, et il le lit avec `useSearchParams`, donc la raison qu'affichera le Profiler sera un changement de hook, ou « le parent a été dessiné », selon la version des outils), `FiltroFallas`, `ContenidoReporte`, `ListaEstados` et les `FilaEstado` qui restent dans la liste. `EditorNota` n'apparaît pas : dans la liste, il n'est pas dessiné, seulement dans la page de détail. `BandejaAvisos` non plus, ni `PanelPreferencias` : ils vivent dans `Disposicion`, et `Disposicion` **n'est pas** redessinée à chaque lettre, parce que celui qui lit `?q=` est `PaginaReporte` et que le changement se produit là, pas dans la disposition qui l'entoure. Ce n'est ni de la mémoïsation ni un contexte qui n'a pas changé : c'est la structure de 9.1.4. Cela a été mesuré avec un compteur dans chaque composant et deux lettres saisies : `PaginaReporte` est passée de 1 à 3 dessins, et `Disposicion`, `BandejaAvisos` et `PanelPreferencias` sont restées à 1, **avec le compilateur et sans lui**. Si, dans ton Profiler, l'un des trois apparaît, quelque chose dans ta copie a fait remonter l'état jusqu'à la disposition, et c'est l'indice. Si le compilateur est activé, plusieurs composants de l'onglet **Components** portent « Memo ✨ », et dans le Profiler il est probable que certains enfants dont les props n'ont pas changé apparaissent sans avoir été dessinés dans un *commit*. Si une prédiction s'est révélée fausse, note laquelle et pourquoi : c'est exactement ce qu'enseigne le Profiler. Cette mesure n'a pas été exécutée pour la leçon ; c'est ton résultat qui compte.

### Solution 2

En plus de `actualizado`, apparaît `marca-nota`, dans `FilaEstado` : le texte « · con nota » qui marque un service avec une note depuis la Leçon 2, sans règle dans `panel.css`. Les classes dynamiques (`disponible` et `falla` de `estado.tipo`, `aviso-${aviso.nivel}`) ont bien une règle. `marca-nota` a-t-elle besoin d'une règle ? C'est une décision, pas un fait : le texte se lit bien à côté du nom, donc elle peut rester sans style, et la classe sert à la retrouver dans un test ou dans les outils de développement. Si tu décides qu'elle doit se distinguer (par exemple, dans le gris de `.actualizado`), écris son test avant, comme en 9.4.5. Ce qui ne vaut pas, c'est de laisser la question sans réponse : une classe sans règle doit être une décision, pas un oubli.

### Solution 3

`/favicon.ico` n'est pas dans la liste de fichiers et ne commence pas par `/assets/`, donc le serveur l'a traité comme une route du client et a répondu `index.html` : `200`, `text/html; charset=utf-8`, avec la politique et `no-cache` (c'est la sixième question de 9.2.3 : `200`, `content-type: text/html; charset=utf-8` et `cache-control: no-cache`). Le navigateur reçoit du HTML là où il attendait une icône, ne peut pas la dessiner et laisse l'onglet sans icône ; il n'y a pas d'autre dommage. C'est un défaut mineur de la même famille que celui de l'aperçu (9.2.2) : la réécriture a été appliquée à quelque chose qui est un fichier. Il y a deux correctifs raisonnables. Le plus simple, ajouter un `favicon.ico` (ou un `<link rel="icon">` vers un fichier dans `/assets/`) pour qu'il existe. Le plus général, que la réécriture ne s'applique qu'aux adresses sans extension, de sorte que `/favicon.ico` réponde `404` ; mais si tu fais cela, vérifie qu'aucune route du client ne contient de point (`/servicios/v1.2` ne se rechargerait plus). Choisir entre les deux relève du jugement ; mesurer l'effet, non.

### Solution 4

Le tableau change presque en entier. Des pages publiques qui doivent apparaître dans les moteurs de recherche : **Oui**, 4 000. Un premier chargement lent et mesuré : **Oui**, quatre secondes sur téléphone. Des données propres (le catalogue est à eux) : probablement **Oui**. Des secrets : cela dépend (prix spéciaux, stock), à vérifier. Réinventer le chargement de données par route : probable. Avec deux ou trois « Oui » mesurés, un framework avec dessin sur le serveur par route commence à rentabiliser son coût : les pages produit arriveraient déjà dessinées dans le HTML. Avant de commencer, tu mesurerais : quelle part des quatre secondes est le téléchargement du JavaScript et quelle part l'attente des données (onglet réseau du navigateur), combien pèse le bundle, et si le problème des moteurs de recherche est un problème de contenu (il n'est pas dans le HTML) ou autre chose (titres, liens). Et un avertissement : la migration peut se faire route par route, en commençant par la page produit, sans réécrire le panier ni le compte.

## Comment savoir que j'ai réussi

- [ ] `npm ci`, `npm run lint`, `npm test` et `npm run build` se terminent avec le code 0 dans `~/curso-react/revisor/` ; le résumé de `npm test -- --reporter=default` dit `Tests  35 passed (35)` dans `11 passed (11)` fichiers, et `npm run build` laisse `dist/assets/index-Cs1CcfeN.js` et `dist/assets/index-CbqUABMA.css` si ton code est identique à celui du point de contrôle.
- [ ] `grep -o memo_cache_sentinel dist/assets/*.js | wc -l` donne `18`, et dans une copie sans le compilateur il donne `1`.
- [ ] Les figures 1, 2 et 3 donnent sur ta machine la même sortie que dans la leçon.
- [ ] Avec `npm run servidor` et `npm run publicado`, `curl -sI http://127.0.0.1:4180/servicios/pagos` répond `200` avec `content-security-policy` et `cache-control: no-cache` ; `/assets/no-existe.js` répond `404` ; et en ouvrant `http://127.0.0.1:4180/servicios/pagos` dans ton navigateur puis en **rechargeant**, on voit le détail de `pagos`.
- [ ] `grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js` ne trouve que les correspondances de React DOM et celles du schéma de l'ajout, et tu sais expliquer pourquoi ce ne sont pas des fuites.
- [ ] Dans une copie à toi **sans** les cinq correctifs de 9.4 (avec les nouveaux tests et la ligne `css` de `vite.config.ts`), les quatre nouveaux fichiers de test se voient rouges, avec 5 tests en échec sur 8 ; dans le point de contrôle, verts.
- [ ] **Manuellement, avec les outils de développement :** tu as fait l'exercice 1 et noté dans ton [journal de bord](bitacora.md) quels composants ont été dessinés à chaque lettre et lesquels portent « Memo ✨ ».
- [ ] Tu sais expliquer, sans regarder, pourquoi le `revisor` n'utilise pas de Server Components.

## Résumé

Réponds sans regarder la leçon :

1. Quelles deux conditions doivent être remplies pour que `memo` en vaille la peine ? Comment mesures-tu chacune ?
2. Quelle différence y a-t-il entre `actualDuration` et `baseDuration` dans `onRender` ? Pourquoi ne peux-tu pas utiliser `<Profiler>` dans le build de production ?
3. Dans la figure 1, pourquoi la version B n'a-t-elle pas redessiné la liste, alors qu'elle n'utilise pas `memo` ? Laquelle des cinq recommandations de la documentation s'applique ?
4. Que fait React Compiler d'un composant qui respecte les règles de React, et que fait-il d'un composant qui les enfreint ? Comment vérifies-tu qu'il a agi dans ton build ?
5. Pourquoi `grep -c` donnait-il 2 et `grep -o … | wc -l` donnait-il 18 sur le même fichier ?
6. Quelles trois choses manquaient à `vite preview` pour publier ? Comment `publicar.ts` les résout-il ?
7. Pourquoi la réécriture vers `index.html` ne s'applique-t-elle pas à `/assets/*` ?
8. Quelles sont les trois couches contre le XSS du `revisor`, et laquelle ne vit pas dans ton code ?
9. Qu'est-ce qu'un Server Component et qu'est-ce qu'une Server Function ? Pourquoi le `revisor` ne les utilise-t-il pas ?
10. Parmi les cinq défauts de 9.4, lequel avait un test vert qui n'avait rien mesuré, et qu'est-ce qui l'a corrigé ?

## Pour aller plus loin

- [React, `<Profiler>`](https://react.dev/reference/react/Profiler) : `onRender` et ses paramètres, `actualDuration` face à `baseDuration`, et pourquoi il est désactivé en production. Consulté le 21 octobre 2026.
- [React, `memo`](https://react.dev/reference/react/memo) : quand la mémoïsation en vaut la peine, les cinq recommandations pour qu'elle ne soit pas nécessaire, et l'avertissement sur React Compiler. Consulté le 21 octobre 2026.
- [React, « React Compiler v1.0 »](https://react.dev/blog/2025/10/07/react-compiler-1), [« Introduction »](https://react.dev/learn/react-compiler/introduction), [« Installation »](https://react.dev/learn/react-compiler/installation) et [« Debugging and Troubleshooting »](https://react.dev/learn/react-compiler/debugging) : la version stable du 7 octobre 2025, ce qu'il mémoïse, que faire de `useMemo` et `useCallback`, la configuration avec `reactCompilerPreset` dans Vite, comment vérifier qu'il a agi, et le fait qu'il saute le code qui pourrait enfreindre les règles de React. Consulté le 21 octobre 2026.
- [Vite, « Deploying a Static Site »](https://vite.dev/guide/static-deploy) : `vite build`, le dossier `dist` et l'avertissement que `vite preview` n'est pas un serveur de production. Consulté le 21 octobre 2026.
- [Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode) : le préfixe `VITE_`, le remplacement statique au build et l'avertissement sur les informations sensibles. Consulté le 21 octobre 2026.
- [React, composants communs : `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) et [« React v16.9.0 »](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html) : le risque de XSS avec du HTML qui n'est pas de confiance, et l'annonce que React cesserait d'accepter les adresses `javascript:`. Consulté le 21 octobre 2026.
- [React, « Server Components »](https://react.dev/reference/rsc/server-components), [« Server Functions »](https://react.dev/reference/rsc/server-functions) et [`"use server"`](https://react.dev/reference/rsc/use-server) : ce que c'est, où ils s'exécutent, pourquoi leurs éléments internes ne suivent pas le versionnage sémantique, et pourquoi les arguments d'une Server Function sont une entrée non fiable ; et l'avis de la [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components). Consulté le 21 octobre 2026.
- [React, « Creating a React App »](https://react.dev/learn/creating-a-react-app) : la recommandation de commencer avec un framework et les raisons de partir de zéro. Consulté le 21 octobre 2026.
- [MDN, `setTimeout`, « Maximum delay value »](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value) et [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) : le délai comme entier signé sur 32 bits et le débordement. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Retries »](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries) : `retry` comme nombre ou comme fonction, et l'attente qui double entre les tentatives. Consulté le 21 octobre 2026.
- [Vitest, `css`](https://vitest.dev/config/css) : `css.include` et les fichiers de styles remplacés par un texte vide. Consulté le 21 octobre 2026.
- [W3C, « Understanding SC 1.4.3: Contrast (Minimum) »](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) : le contraste minimal de 4,5 pour 1 et la formule de luminance relative. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| dessin en trop | redessiner un composant dont le résultat n'a pas changé, parce que l'état d'un parent a changé |
| `<Profiler>` | composant de React qui mesure combien de fois et combien de temps une partie de l'arbre est dessinée |
| `actualDuration` / `baseDuration` | ce qu'a duré le dessin de cette mise à jour / ce qu'il durerait sans aucune mémoïsation |
| mémoïser | conserver un résultat pour le réutiliser tant que ses entrées ne changent pas |
| React Compiler | outil de build qui mémoïse de lui-même les composants et les hooks, et saute ceux qui enfreignent les règles de React |
| `memo_cache_sentinel` | la marque « cache encore vide » de React ; le compilateur l'écrit pour chaque valeur qu'il ne conserve qu'une fois, donc la compter dans `dist/` dit s'il a agi |
| réécriture vers `index.html` | répondre avec la page de l'application pour toute adresse qui est une route du client |
| politique de sécurité du contenu (CSP) | en-tête qui dit au navigateur d'où il peut charger et exécuter chaque type de ressource |
| `immutable` | indication de cache qui promet que le fichier ne changera jamais |
| traversée de répertoires (*path traversal*) | attaque qui utilise `..` dans une adresse pour lire des fichiers en dehors du dossier publié |
| Server Component | composant qui est dessiné sur le serveur ou au moment du build, avant d'arriver au navigateur |
| Server Function | fonction qui s'exécute sur le serveur et qu'un composant du navigateur peut appeler |
| contrôle positif | vérification, à l'intérieur d'un test, qu'il a trouvé quelque chose dont tu sais que cela existe, pour qu'un fichier vide ne donne pas de vert |
| débordement (*overflow*) | un nombre qui ne tient pas dans la taille où il est stocké et devient un autre nombre |

---

**Fin du cours.** Si tu es arrivé jusqu'ici avec ton `revisor`, retourne à [« Comment savoir que tu as terminé »](README.md#comment-savoir-que-tu-as-terminé) dans le README et vérifie les cinq conditions. Et ouvre ton [journal de bord](bitacora.md) : ce que tu as noté dans ces dix leçons est ce qui vaut la peine d'être relu.
