# Leçon 4 — État du serveur avec TanStack Query

*Il est 16 h 50 et à 17 h 00 l'exploitation termine son quart avec une question : « est-ce que pagos s'est rétabli ? ». Sur ton panneau, `pagos` est toujours en rouge. Quelqu'un de l'équipe infrastructure jure l'avoir redémarré il y a cinq minutes. Tu ouvres le détail de `pagos` : il indique « En falla ». Tu fermes le détail, ouvres celui de `catálogo`, reviens à `pagos`… et le panneau redemande tout depuis zéro, avec son habituel « Cargando… », comme s'il ne l'avait jamais vu. Tu cliques sur « Actualizar » : la liste passe au vert, mais le détail que tu avais ouvert continue d'afficher « En falla ». Deux parties du même écran racontent deux histoires différentes sur le même service, et tu as dix minutes pour dire où est la vérité. Le problème ne vient pas de l'API. C'est que chaque composant va chercher ses données de son côté et aucun ne sait ce que sait l'autre. Cette leçon donne au panneau un endroit unique où réside ce qui est arrivé du serveur.*

(Tu ne peux pas encore reproduire cette scène avec le serveur d'entraînement de la Leçon 3 : chez lui, `pagos` ne se rétablit jamais. Cette leçon donne au serveur la route qui le « réexamine », et en 4.6.1 tu vas voir la scène complète, et résolue.)

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 4.4 et 4.5)

**Ce que tu construis :** le rapport du `revisor` avec cache, mise à jour en arrière-plan, les quatre états d'une requête plus celui des « données périmées », un bouton « Volver a revisar » qui demande au serveur de réexaminer un service et remet la liste et le détail à jour, et un périmètre d'erreur qui capture ce qui échoue lors du rendu

**Ce que tu apprends :** pourquoi récupérer des données manuellement ne passe pas à l'échelle (cache, cascades, concurrence entre les requêtes) ; `useQuery`, `queryKey` et `signal` ; `status` face à `fetchStatus` ; `staleTime`, réessais et `refetchInterval` ; `useMutation` et invalidation ; **le quatrième état : vide** ; ce que Suspense ne fait pas ; l'Error Boundary, l'unique classe du cours

**D'où tu viens.** De la [Leçon 3](03-effects-sincronizar.md). Ton `revisor` demande le rapport avec un hook personnalisé, `useReporte`, qui effectue une interrogation périodique (polling) toutes les 10 secondes avec un Effect, un `AbortController` et un `useEffectEvent` pour que cette interrogation ne redémarre pas quand `Panel` lui passe une nouvelle fonction. Le détail d'un service est récupéré par un autre hook, `useDetalle`, avec son propre Effect qui annule la requête quand le nom change, et `ContenidoReporte` monte `<PanelDetalle key={seleccionado}>` pour que changer de service réinitialise le panneau complet. Tout cela fonctionne, et fonctionne pour de bonnes raisons : la Leçon 3 a reproduit la concurrence entre les réponses (race condition) et l'a corrigée. Dans cette leçon, tu vas supprimer les deux hooks. Pas parce qu'ils étaient mauvais, mais parce qu'ils résolvaient manuellement, un par un, un problème qui a un nom et un outil dédié. Tu travailles sur le même projet, `~/curso-react/revisor/`.

**Ce que cette leçon ne fait pas.** Elle n'ajoute ni écrans ni adresses : la liste et le détail restent sur la même page, et la sélection reste un état de `Panel` ; les routes arrivent dans la [Leçon 5](05-rutas-url-como-estado.md). Elle n'utilise pas Suspense pour charger des données : elle explique ce qu'il ferait et pourquoi ce panneau n'en a pas besoin. Elle n'écrit pas de tests automatisés : ceux des quatre états arrivent dans la [Leçon 8](08-pruebas-de-componentes.md). Elle ne permet pas d'enregistrer de nouveaux services : le serveur d'entraînement sait déjà le faire dès cette leçon, mais le formulaire relève de la [Leçon 7](07-formularios-accesibilidad.md). Et elle n'explique pas le serveur d'entraînement, qui atteint ici sa version finale : elle indique seulement quelles nouvelles routes il propose.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon. Le point de contrôle a été réinstallé avec `npm ci` et a passé `npm run lint` et `npm run build`, avec le même nom de fichier dans `dist/` que les exécutions du cours ont également obtenu dans un conteneur Linux (`index-CHheidKQ.js`) ; c'est pourquoi ce que tu vois ici est ce que tu verras sur ton Linux Mint, à l'exception d'un avertissement de `npm ci` concernant `fsevents` qui n'apparaît que sous macOS et qui est expliqué là où il survient. Après la dernière modification du point de contrôle (le bouton de ligne qui bascule et la garde de `%` dans le serveur d'entraînement), il a été réinstallé depuis zéro avec `npm ci` dans un conteneur Linux (image officielle `node:24.22.0-bookworm`) et a donné le même nom sous macOS et sous Linux. Ce qui se voit « dans le navigateur » a été mesuré avec Chrome en mode headless (`--headless`), piloté par son protocole de débogage : un petit programme ouvrait la page, cliquait sur les boutons comme tu le ferais et notait, avec les millisecondes écoulées depuis l'ouverture de la page, chaque requête envoyée à `/api/` et chaque modification à l'écran. C'est le même enregistrement que celui que tu vois dans l'onglet « Réseau » des outils de développement, transcrit par écrit. Les captures du navigateur de 4.5, 4.6.1 et 4.9 ont été prises avec une version de `PanelDetalle` qui, si la mise à jour du détail échouait, n'affichait que l'erreur et masquait les données ; celle que tu vois en 4.6 corrige cela, et l'on a vérifié qu'elle fournit toujours le même résultat lorsque les requêtes aboutissent, ce qui est tout ce que ces captures enregistrent. Les heures du journal du serveur d'entraînement sont en UTC ; l'heure qu'affiche le panneau (« Actualizado a las 2:11:47 a.m. ») est l'heure locale de la machine, configurée sur le fuseau horaire du centre du Mexique. Les chemins longs sont présentés à partir de `~/curso-react`. Pour comparer les tailles, le point de contrôle de la Leçon 3 a également été généré, avec le même résultat que celui consigné pour lui par les exécutions du cours (`index-CTkBRgQQ.js`). Les programmes se trouvent dans [`programas/04-estado-del-servidor/`](../programas/04-estado-del-servidor) : `revisor/` est le point de contrôle et les trois figures sont à côté, avec leur propre `package.json`, qui est celui des figures de la Leçon 0 enrichi de `@tanstack/react-query`. Les trois ont été réexécutées depuis zéro dans un dossier neuf, en partant du `package.json` de la Leçon 0 et en ajoutant uniquement Query, comme indiqué en 4.1, et ont donné des sorties identiques à celles affichées ici. Chaque leçon du cours a été écrite avec ses propres ports pour éviter d'entrer en conflit avec d'autres exécutions sur la même machine ; utilise pour ta part ceux habituels : 3100 pour le serveur d'entraînement, 5173 pour `npm run dev` et 4173 pour `npm run preview`.

## À la fin, tu seras capable de

- Montrer, à l'aide d'une figure qui compte les appels, combien de requêtes déclenche une donnée demandée manuellement par deux composants et combien elle en déclenche avec TanStack Query, et expliquer d'où vient la différence.
- Configurer un `QueryClient` avec `staleTime` et `retry`, le monter avec `QueryClientProvider` et écrire une requête avec `queryOptions`, une clé et une fonction qui reçoit le `signal`.
- Distinguer `status` de `fetchStatus`, nommer les cinq combinaisons produites par la figure 2 et indiquer laquelle affiche « · actualizando… » dans le pied de page du panneau.
- Représenter les quatre états d'une requête (chargement, erreur, vide et avec données) plus celui des « données périmées », et provoquer chacun d'eux avec le serveur d'entraînement.
- Écrire une mutation avec `useMutation` qui, une fois menée à bien, invalide les requêtes concernées, et lire dans le journal la requête `POST` suivie des deux requêtes provoquées par l'invalidation.
- Expliquer quelles erreurs un Error Boundary capture et lesquelles il ne capture pas, et pourquoi c'est l'unique classe du cours.

## Le pourquoi avant le comment

Regarde ce que fait le `revisor` aujourd'hui, à la fin de la Leçon 3, avec les yeux de la personne qui exploite le panneau.

**La même donnée est demandée deux fois.** `Panel` a besoin du rapport pour la liste ; le titre de l'onglet, `(2) Revisor`, a besoin du même rapport pour compter les pannes. Aujourd'hui, cela fonctionne parce que les deux résident dans le même composant et partagent le résultat d'un seul `useReporte`. Mais dès que l'en-tête de la [Leçon 5](05-rutas-url-como-estado.md) voudra afficher « 2 services en panne » depuis une autre partie de l'arborescence, tu auras deux options : faire remonter l'état jusqu'à un ancêtre commun et le redescendre par des props, ou appeler `useReporte` deux fois et faire deux requêtes pour la même donnée. Aucune des deux approches ne passe à l'échelle.

**Quitter et revenir coûte aussi cher qu'entrer.** Quand tu choisis `pagos`, `useDetalle` le demande ; quand tu choisis `catálogo` et reviens à `pagos`, il le redemande depuis zéro, avec son « Cargando detalle… » de 1,5 seconde, alors que tu l'as vu il y a cinq secondes. Le hook n'a aucune mémoire : son état vit dans le composant, et le composant est démonté. La documentation de React l'exprime en ces termes : demander des données directement dans un Effect signifie généralement que tu ne les précharges ni ne les mets en cache, si bien que lorsque le composant est démonté puis remonté, il doit les redemander ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)).

**Ce que tu modifies à un endroit n'est pas répercuté à l'autre.** Si demain le détail disposait d'un bouton demandant au serveur de réexaminer `pagos`, la réponse arriverait au détail… et la liste continuerait d'afficher `pagos` en rouge jusqu'à la prochaine interrogation périodique, dix secondes plus tard. Pour avertir la liste, tu devrais passer à `PanelDetalle` une fonction `recargarLista` depuis `Panel`, et une autre pour chaque écran dépendant de ce service.

**Et chaque hook réécrit la même chose.** `useReporte` et `useDetalle` ont, chacun, leur `AbortController`, leur `try`/`catch`, leur `if (control.signal.aborted) return`, leur union `cargando`/`listo`/`error`. C'est le code que la Leçon 3 t'a appris à écrire correctement, et c'est précisément pour cela qu'il convient de mesurer ce qu'il pèse : la page de React le qualifie elle-même de « peu ergonomique », avec beaucoup de code répétitif pour éviter de tomber dans des pièges comme les situations de compétition.

Cette page ne se limite pas au constat : elle recommande, en l'absence de framework, « d'utiliser ou de construire un cache côté client », et cite trois solutions libres ; la première est **TanStack Query**. Et elle ajoute une précision qui mérite d'être lue attentivement : si tu construis le tien, tu utiliseras des Effects sous le capot, mais tu devras ajouter la logique pour ne pas répéter les requêtes, mettre en cache les réponses et éviter les cascades. C'est exactement ce que fait la bibliothèque. Sous le capot, il y a toujours un `fetch` avec un `signal` ; ce qui change, c'est **qui est propriétaire de la donnée**. Jusqu'à présent, le propriétaire du rapport était le composant qui le demandait. À partir de cette leçon, le propriétaire est un cache qui vit en dehors des composants, et les composants se contentent de s'**abonner** à ce dont ils ont besoin.

Ce changement porte un nom qui donne son titre à la leçon : **l'état du serveur**. L'état que la Leçon 2 t'a appris à gérer — la case « Solo fallas », le service sélectionné, le brouillon d'une note — t'appartient : il naît à l'écran, seul l'écran le modifie et il ne vieillit pas de lui-même. Le rapport est une tout autre affaire. C'est une **copie** de quelque chose qui réside sur une autre machine, que d'autres personnes peuvent modifier sans te prévenir, qui met du temps à arriver, qui peut échouer lorsqu'on la demande et qui commence à vieillir dès l'instant où elle arrive. Le traiter avec `useState`, c'est regarder une photographie en croyant regarder par une fenêtre.

Il y a trois nouveaux concepts. Le premier est **la requête : une donnée du serveur avec une clé et un cache**, et il occupe trois sections : le problème mesuré (4.1), l'installation et le client (4.2), et les clés, les fonctions de requête et l'interrogation périodique (4.3). Le deuxième, ce sont **les états d'une requête et la façon dont l'écran les affiche** : `status` face à `fetchStatus` (4.4) et les quatre états plus un (4.5) ; le complètent, après le troisième, ce que Suspense ne fait pas avec ces états (4.7) et le périmètre d'erreur, qui intercepte l'état d'erreur quand il s'échappe du composant (4.8). Le troisième est **la mutation et l'invalidation** : modifier une donnée sur le serveur et prévenir le cache (4.6). La section 4.9 n'ajoute pas de concept : c'est le parcours complet, où l'on voit les trois ensemble. À la fin, tu vas construire ceci, et tu sauras pourquoi le JavaScript a pris environ 37 kilo-octets :

```text
$ npm run build

> revisor@0.4.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 83 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-Bjb9BrLB.css    0.75 kB │ gzip:  0.40 kB
dist/assets/index-CHheidKQ.js   262.59 kB │ gzip: 81.55 kB

✓ built in 263ms
```

## Les concepts

### 4.1 Le problème, mesuré : deux composants, une donnée

Avant d'installer quoi que ce soit, mesure le problème. La première figure monte deux fois le même composant — pense à l'en-tête et au résumé, qui ont besoin du même rapport —, compte combien de fois est appelée une « API » factice qui met 50 ms à répondre, puis les démonte (la personne quitte l'écran) et les remonte (elle revient). Elle le fait deux fois : avec un Effect par composant, comme dans la Leçon 3, et avec TanStack Query.

Les figures de cette leçon importent TanStack Query, ton dossier de figures en a donc également besoin. Dans `~/curso-react/figuras/`, celui que tu as préparé dans la Leçon 0, ajoute-le avec sa version exacte :

```bash
npm install --save-dev --save-exact @tanstack/react-query@5.104.5
```

Ou copie le `package.json` et le `package-lock.json` de `programas/04-estado-del-servidor/` et lance `npm ci`. Les deux manières ont été testées depuis un dossier vide et les trois figures ont produit exactement les sorties affichées ici. Si tu sautes cette étape, le premier `npx tsc` se plaindra de ne pas trouver le module `@tanstack/react-query`.

```tsx
// fig04_01.tsx
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Una «API» de mentira que cuenta cuántas veces la llamaron y tarda 50 ms.
let llamadas = 0;

async function cargarNombres(senal: AbortSignal): Promise<readonly string[]> {
  llamadas += 1;
  await new Promise((resolver) => setTimeout(resolver, 50));
  senal.throwIfAborted();
  return ["catálogo", "pagos", "inventario", "reportes"];
}

// Forma 1: cada componente trae sus datos con su propio Effect.
function ConteoAMano() {
  const [nombres, establecerNombres] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const control = new AbortController();
    cargarNombres(control.signal).then(establecerNombres, () => {});
    return () => control.abort();
  }, []);

  return <p>{nombres === null ? "cargando" : `${nombres.length} servicios`}</p>;
}

// Forma 2: los dos componentes piden la misma clave a TanStack Query.
function ConteoConQuery() {
  const consulta = useQuery({
    queryKey: ["reporte"],
    queryFn: ({ signal }) => cargarNombres(signal),
    staleTime: 5_000,
  });

  return <p>{consulta.data === undefined ? "cargando" : `${consulta.data.length} servicios`}</p>;
}

const esperar = (ms: number) => act(() => new Promise<void>((resolver) => setTimeout(resolver, ms)));

async function medir(titulo: string, Conteo: ComponentType): Promise<void> {
  console.log(titulo);
  llamadas = 0;
  const clienteConsultas = new QueryClient();
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  // El encabezado y el resumen necesitan el mismo dato: dos componentes, un reporte.
  const dibujar = (visible: boolean) =>
    raiz.render(
      <QueryClientProvider client={clienteConsultas}>
        {visible && (
          <>
            <Conteo />
            <Conteo />
          </>
        )}
      </QueryClientProvider>,
    );

  await act(async () => dibujar(true));
  await esperar(100);
  console.log(`  al abrir:          ${llamadas} llamada(s) a la API`);

  // La persona sale de la pantalla y vuelve un momento después.
  await act(async () => dibujar(false));
  llamadas = 0;
  await act(async () => dibujar(true));
  console.log(`  al volver, de inmediato se ve: «${contenedor.textContent}»`);
  await esperar(100);
  console.log(`  al volver:         ${llamadas} llamada(s) a la API`);

  await act(async () => raiz.unmount());
  clienteConsultas.clear();
}

await medir("a mano, un Effect por componente:", ConteoAMano);
await medir("con TanStack Query, misma clave:", ConteoConQuery);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_01.tsx
$ node fig04_01.js
a mano, un Effect por componente:
  al abrir:          2 llamada(s) a la API
  al volver, de inmediato se ve: «cargandocargando»
  al volver:         2 llamada(s) a la API
con TanStack Query, misma clave:
  al abrir:          1 llamada(s) a la API
  al volver, de inmediato se ve: «4 servicios4 servicios»
  al volver:         0 llamada(s) a la API
```

Lis les deux moitiés ligne par ligne.

**Manuellement, deux composants représentent deux appels.** Chaque `ConteoAMano` a son propre Effect, son propre état et son propre `AbortController`. Il n'y a aucun moyen pour l'un de savoir que l'autre est déjà en train de demander la même chose : les Effects sont privés à chaque composant. Au retour, les deux recommencent à l'état `cargando` et effectuent deux autres appels, car leur état a été perdu lors du démontage.

**Avec Query, deux composants ne font qu'un seul appel.** Les deux `ConteoConQuery` demandent la clé `["reporte"]`. La première fois que quelqu'un la demande, Query lance la fonction ; lorsque le second la demande alors que la première est toujours en vol, Query n'en lance pas une autre : il l'**abonne** à la même. C'est ce qu'on appelle la *déduplication* de requêtes. Et au retour, l'écran affiche « 4 servicios » **immédiatement**, sans passer par `cargando`, et n'effectue aucun appel. La donnée ne résidait pas dans les composants : elle résidait dans le cache du `QueryClient`, qui est resté là pendant que l'écran était vide.

Pourquoi aucun appel au retour ? Grâce à la ligne `staleTime: 5_000`. Elle indique à Query que, pendant cinq secondes après son arrivée, cette donnée est considérée comme **fraîche** et qu'il ne vaut pas la peine de la redemander. Lorsque ce délai expire, la donnée devient **périmée** (*stale*), et la prochaine fois qu'un composant s'y abonnera, Query affichera ce qu'il a et, en parallèle, la redemandera. Dans l'exercice 2, tu supprimes cette ligne et tu le constates par toi-même.

Le plan de ce cours résume en trois mots pourquoi aller chercher les données manuellement ne passe pas à l'échelle : **cache**, **cascades** et **concurrence entre les requêtes** (*race conditions*). La figure vient tout juste de mesurer le premier. La page de React citée dans « Le pourquoi » énumère quatre problèmes : le fait que les Effects ne s'exécutent pas sur le serveur, les cascades, l'absence de préchargement ou de mise en cache, et le manque d'ergonomie, avec des erreurs telles que les situations de compétition. Le premier ne s'applique pas à ce panneau, qui n'est pas rendu sur un serveur ; les trois autres sont ceux du plan. Le deuxième mot correspond aux **cascades** (*network waterfalls*), le deuxième problème de cette liste : un parent demande ses données, effectue son rendu, et c'est seulement alors que ses enfants commencent à demander les leurs ; avec un réseau lent, chaque niveau additionne son temps d'attente ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). La figure ne le mesure pas et le `revisor` n'en souffre pas encore, car son détail n'est demandé que lorsque quelqu'un sélectionne un service. Ce que Query apporte contre les cascades, c'est qu'une requête peut être déclenchée **depuis l'extérieur d'un composant** — par exemple, lorsque le routeur sait vers quel écran tu te diriges, avant même de le rendre —, et c'est ce dont la Leçon 5 tirerait parti si nécessaire. Ici, il suffit de savoir que le problème existe et qu'il a une solution. Le troisième mot, la **concurrence entre les requêtes**, tu l'as vue de près dans la Leçon 3 ; la manière dont Query l'évite est expliquée en 4.3.2, lorsque le `signal` fera son apparition.

### 4.2 L'installation et le client

TanStack Query est une bibliothèque constituée d'un seul paquet pour React. Elle s'installe dans `dependencies`, car elle est incluse dans le code envoyé au navigateur, avec sa version exacte :

```bash
npm install --save-exact @tanstack/react-query@5.104.5
```

Cette version a été publiée le 19 octobre 2026 et c'est la plus récente que `npm view @tanstack/react-query version` ait retournée le jour de l'exécution. Si tu installes sous macOS, `npm ci` ou `npm install` se termine par un avertissement semblable à celui-ci :

```text
npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

Ce n'est pas Query qui le provoque. `fsevents` est une dépendance optionnelle, réservée à macOS, qu'utilisent les outils de développement pour être avertis rapidement de tout changement de fichier ; avec npm 11, les scripts d'installation des dépendances sont bloqués tant que personne ne les a approuvés, et npm termine l'installation en signalant ceux qu'il a ignorés ([npm, « npm install-scripts »](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). Avec `fsevents`, il n'est pas nécessaire d'approuver quoi que ce soit : le paquet embarque déjà son fichier compilé `fsevents.node` (tu peux le voir dans `node_modules/fsevents/`), l'installation se termine bien et Vite fonctionne à l'identique. Lorsqu'un paquet nécessite réellement son script, on l'examine avec `npm install-scripts ls` et on l'approuve avec `npm install-scripts approve <paquet>` ; approuver est une décision de sécurité, car ce script s'exécute avec tes permissions. Sous Linux, cela n'apparaît pas, car ce paquet déclare dans son `package.json` qu'il est réservé à `darwin` (macOS) et npm ne l'installe même pas.

Le `package.json` se présente ainsi ; la seule ligne nouvelle, en plus du numéro de version, est celle de Query :

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.4.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5"
  }
}
```

La bibliothèque comprend deux éléments qui s'installent une seule fois. Le premier est le **`QueryClient`** : l'objet qui conserve le cache et les règles. Le point de contrôle le crée à l'aide d'une fonction, dans son propre fichier, afin que les tests de la Leçon 8 puissent en créer un nouveau à chaque test :

```ts
// revisor/src/consultas/cliente.ts
import { QueryClient } from "@tanstack/react-query";

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: 2,
      },
    },
  });
}
```

Ces deux options modifient deux valeurs par défaut que la documentation de Query recense dans sa page sur les « valeurs par défaut importantes » ([TanStack Query, « Important Defaults »](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)) :

- **`staleTime`** vaut `0` par défaut : une donnée est considérée comme périmée dès son arrivée. Avec `0`, chaque nouveau composant qui s'abonne, chaque reprise de focus par la fenêtre et chaque reconnexion réseau poussent Query à redemander la donnée. Pour un panneau qui s'actualise de toute façon toutes les dix secondes, cinq secondes de fraîcheur évitent des requêtes qui n'apportent rien : si tu viens de recevoir le rapport, ouvrir le détail ou revenir sur l'onglet n'en réclame pas un autre. C'est un choix propre à ce cours, pas une règle absolue : le bon chiffre dépend de la vitesse à laquelle ta donnée évolue et du coût que représente pour toi le fait de l'afficher légèrement périmée.
- **`retry`** vaut `3` par défaut : une requête qui échoue fait l'objet de trois tentatives supplémentaires, en silence, avec une attente qui double entre chaque tentative. Le cours ramène ce chiffre à `2` pour que, lorsque l'API est en panne, l'alerte apparaisse en quatre secondes environ et non huit. Dans la section 4.5, tu vas l'observer dans le journal, tentative par tentative.

Il existe deux autres valeurs qu'il est utile de connaître même si le point de contrôle n'y touche pas. **`gcTime`** (pour *garbage collection*, ramasse-miettes) représente la durée pendant laquelle survit dans le cache une donnée qu'aucun composant n'utilise plus : cinq minutes. C'est pour cela que dans la figure 1 la donnée était toujours présente au retour. Et **`refetchOnWindowFocus`** est activé : dès que la personne revient sur l'onglet du panneau, les requêtes périmées sont relancées. C'est ce qui permet à un panneau resté une demi-heure derrière une autre fenêtre de se remettre à niveau dès que tu le regardes. La documentation le formule ainsi : les requêtes périmées sont relancées en arrière-plan lorsqu'une nouvelle instance est montée, lorsque la fenêtre reprend le focus ou lors d'une reconnexion réseau.

Le deuxième élément est le **`QueryClientProvider`**, qui met le client à la disposition de l'arborescence tout entière. `main.tsx` le crée **une seule fois, en dehors de tout composant**, et enveloppe le panneau :

```tsx
// revisor/src/main.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LimiteDeError } from "./compartido/LimiteDeError";
import { cadaMs } from "./configuracion";
import { crearClienteConsultas } from "./consultas/cliente";
import { Panel } from "./reporte/Panel";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

const clienteConsultas = crearClienteConsultas();

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <QueryClientProvider client={clienteConsultas}>
        <Panel cadaMs={cadaMs} />
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
```

Le fait que `crearClienteConsultas()` soit appelé au niveau du module, et non à l'intérieur d'un composant, n'est pas un détail de style. Si tu le créais à l'intérieur d'un composant, chaque rendu de ce composant créerait un cache neuf et vide, et tu perdrais tout ce que la figure 1 vient de montrer. Dans `main.tsx`, il s'exécute une seule fois, lorsque le navigateur charge le module. (Le `LimiteDeError` qui enveloppe l'ensemble est expliqué en 4.8.)

Et voici la taille mentionnée à la fin du « pourquoi ». Le point de contrôle de la Leçon 3 a également été généré pour comparaison : son JavaScript pesait 225,86 ko (70,67 ko compressé) et provenait de 33 modules ; celui de cette leçon pèse 262,59 ko (81,55 ko compressé) et provient de 83 modules. D'une leçon à l'autre, le code propre au `revisor` n'augmente quasiment pas — on supprime même deux hooks —, de sorte que ces 37 ko et 50 modules supplémentaires sont, pour l'essentiel, la bibliothèque. On est en droit de se demander si le jeu en vaut la chandelle. Pour un panneau qui ne demanderait qu'une seule chose une seule fois, probablement pas ; pour un panneau qui comporte cache, interrogation périodique, réessais, déduplication, invalidation et données périmées pendant la mise à jour, ce qui pèse est largement compensé par tout ce que tu n'as pas à écrire et à maintenir toi-même.

### 4.3 Clés, fonctions de requête et interrogation périodique (polling)

Une requête comporte deux éléments obligatoires : une **clé** qui l'identifie et une **fonction** qui récupère la donnée. Tout le reste est optionnel.

#### 4.3.1 La clé : le nom de la donnée dans le cache

La clé est un tableau. La documentation pose trois règles : elle doit être un tableau au premier niveau, elle doit pouvoir être convertie en JSON et elle doit être unique pour cette donnée ; et elle en ajoute une quatrième qui est celle qui évite le plus d'erreurs : **si la fonction dépend d'une variable, cette variable doit figurer dans la clé** ([TanStack Query, « Query Keys »](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)). Le détail de `pagos` et celui de `catálogo` sont des données distinctes, leurs clés doivent donc être distinctes : `["servicio", "pagos"]` et `["servicio", "catálogo"]`.

Le point de contrôle regroupe toutes les clés dans un seul fichier, afin que personne n'écrive `["reportes"]` d'un côté et `["reporte"]` de l'autre :

```ts
// revisor/src/consultas/claves.ts
export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
```

Le `as const` fait en sorte que TypeScript retienne la forme exacte du tableau (`readonly ["reporte"]` et non `string[]`), et `servicio` est une fonction parce que sa clé dépend du nom. Cette manière de les écrire offre un avantage qui se révèle en 4.6 : les clés sont comparées **par préfixe**. Invalider `["servicio"]` ciblerait tous les détails ; invalider `["servicio", "pagos"]`, uniquement celui-là.

Remarque ce que cette règle remplace. Dans la Leçon 3, `useDetalle` contenait `[nombre]` dans sa liste de dépendances, et `exhaustive-deps` veillait à ce que tu ne l'oublies pas. La clé de Query joue exactement le même rôle : quand `nombre` change, la clé change, et Query demande la nouvelle donnée. La différence, c'est que le linter de React n'examine pas les clés de Query. Si tu oublies de mettre le nom dans la clé, personne ne te prévient ; l'exercice 4 te montre ce que tu vois alors à l'écran.

#### 4.3.2 La fonction : la même frontière réseau, avec le `signal` fourni par Query

La fonction de requête du rapport est `cargarReporte`, la frontière réseau issue de la Leçon 0, avec une seule modification : elle perd le type `Cargar`, qui n'existait que pour passer la fonction sous forme de prop à `Panel` et qui n'est plus utilisé.

```ts
// revisor/src/reporte/cargar.ts
import { esReportePublico, type ReportePublico } from "../compartido/contrato";

export async function cargarReporte(senal: AbortSignal): Promise<ReportePublico> {
  const respuesta = await fetch("/api/estados", { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esReportePublico(cuerpo)) {
    throw new Error("la API no entregó un reporte válido");
  }

  return cuerpo;
}
```

Elle continue de recevoir un `AbortSignal`, et cela a toute son importance. Query fournit à chaque fonction de requête son propre `AbortSignal`, et l'annule lorsque la requête n'est plus nécessaire avant d'être terminée : soit parce que la clé a changé, soit parce qu'aucun composant n'y est plus abonné ([TanStack Query, « Query Cancellation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Tu n'écris plus `new AbortController()` ni `control.abort()` : Query les écrit pour toi, et tu n'as plus qu'à transmettre le `signal` à `fetch`. La documentation ajoute une précision : si ta fonction **utilise** le `signal`, Query annule la promesse et ramène la requête à son état antérieur ; si elle ne l'utilise pas, la réponse est enregistrée dans le cache même si plus personne ne l'attend.

Dans la section 4.9, tu vas observer cette annulation dans le journal, avec la même paire `cancelada por el cliente` + `200` que `StrictMode` produisait dans la Leçon 0. Ce n'est pas un hasard : `StrictMode` démonte puis remonte le panneau, la requête se retrouve un instant sans aucun abonné, Query annule le `signal` et relance la demande lors du remontage. Le nettoyage existe toujours ; il a simplement changé de responsable.

Et cela referme la situation de compétition de la Leçon 3, sur deux plans. Ce que tu as vu dans la Leçon 3, c'est que la réponse tardive de `pagos` n'atteignait l'écran que lorsque les deux protections manquaient simultanément : l'`abort` du nettoyage et la `key` qui démonte le panneau. Query apporte sa propre version de chacune. La première est le `signal` : si tu sélectionnes `pagos` puis immédiatement `catálogo`, la requête de `pagos` se retrouve sans abonné et Query annule son appel. La seconde est la clé : même si l'appel n'était pas annulé, sa réponse serait rangée dans l'entrée `["servicio", "pagos"]` du cache, et non dans celle de `catálogo`. Chaque clé forme son propre casier, et une réponse tardive n'a aucun moyen de glisser dans le mauvais casier. Le composant de `catálogo` ne lit que le casier de `catálogo`.

#### 4.3.3 `queryOptions` : la requête en un seul endroit

C'est avec la clé et la fonction que l'on construit la requête. Le point de contrôle ne l'écrit pas à l'intérieur du composant, mais dans un fichier dédié à la fonctionnalité, avec `queryOptions` :

```ts
// revisor/src/reporte/consultas.ts
import { queryOptions } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { cargarReporte } from "./cargar";

export function consultaReporte(cadaMs: number) {
  return queryOptions({
    queryKey: claves.reporte,
    queryFn: ({ signal }) => cargarReporte(signal),
    refetchInterval: cadaMs,
  });
}
```

`queryOptions` ne fait rien à l'exécution : il renvoie l'objet même qu'on lui donne. Ce qu'il apporte, c'est du typage. Il rassemble clé, fonction et options dans un objet partageable entre plusieurs endroits — un composant, un test, un préchargement — et TypeScript déduit depuis la fonction le type de la donnée, `ReportePublico`, pour l'ensemble d'entre eux ([TanStack Query, « Query Options »](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)). Si demain la Leçon 8 veut interroger le cache pour savoir ce qui se trouve sous `["reporte"]`, elle utilisera le même objet et obtiendra le type adéquat sans rien répéter.

La nouvelle option est **`refetchInterval: cadaMs`** : tant qu'un composant reste abonné, Query redemande la donnée à cette fréquence, en millisecondes ([TanStack Query, « useQuery »](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)). C'est l'interrogation périodique toutes les dix secondes de la Leçon 0, le même `VITE_CADA_MS`, sans `setInterval` ni `clearInterval`. Et elle s'accompagne d'une règle que l'interrogation périodique manuelle n'avait pas : avec l'option associée `refetchIntervalInBackground` fixée à `false`, sa valeur par défaut, l'interrogation périodique s'interrompt tant que l'onglet est en arrière-plan. Un panneau oublié dans un onglet ne continue plus d'interroger l'API toutes les dix secondes tout au long de la nuit.

La requête du détail adopte la même forme, avec le nom dans la clé et dans la fonction :

```ts
// revisor/src/detalle/consultas.ts
import { queryOptions } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { cargarDetalle } from "./cargar";

export function consultaDetalle(nombre: string) {
  return queryOptions({
    queryKey: claves.servicio(nombre),
    queryFn: ({ signal }) => cargarDetalle(nombre, signal),
  });
}
```

Son `cargarDetalle` ne change pas par rapport à la Leçon 3. Ainsi, `src/reporte/useReporte.ts` et `src/detalle/useDetalle.ts` disparaissent du projet, et avec `useReporte` s'en va également le `useEffectEvent` que la Leçon 3 lui avait adjoint pour éviter que l'interrogation périodique ne redémarre. Ce n'était pas une mauvaise pratique : c'était la façon rigoureuse de résoudre ce problème avec un Effect fait main. Simplement, il n'y a plus d'Effect fait main.

Et qu'en est-il de `useTituloDocumento`, l'autre Effect de la Leçon 3 ? Celui-là reste. Il synchronise `document.title` avec ce que React sait, ce qui correspond exactement à la raison d'être d'un Effect. Tous les Effects ne disparaissent pas : seul disparaît celui qui allait chercher des données.

### 4.4 `status` face à `fetchStatus`

`useQuery` renvoie un objet comportant de nombreux champs. Les deux qu'il importe le plus de comprendre sont `status` et `fetchStatus`, car ils répondent à **deux questions distinctes**, et la documentation le résume par une règle mnémotechnique simple : `status` te renseigne sur les **données** — en ai-je ou n'en ai-je pas ? — et `fetchStatus` te renseigne sur la **fonction** — est-elle en train de tourner ou non ? ([TanStack Query, « Queries »](https://tanstack.com/query/latest/docs/framework/react/guides/queries)).

| Champ | Valeur | Ce que cela signifie |
|---|---|---|
| `status` | `pending` | il n'y a pas encore de données |
| | `error` | la dernière tentative a échoué |
| | `success` | il y a des données |
| `fetchStatus` | `fetching` | la fonction est en cours d'exécution |
| | `paused` | elle voulait s'exécuter, mais il n'y a pas de réseau |
| | `idle` | elle ne fait rien |

Pourquoi deux champs plutôt qu'un seul ? Parce qu'avec un cache et des mises à jour en arrière-plan, **toutes les combinaisons sont envisageables**, et une variable unique ne peut en rendre compte. La deuxième figure les provoque une par une : elle monte un composant sans réseau, rétablit le réseau, puis fait échouer l'API avant de relancer la demande. Le composant consigne une ligne chaque fois que l'un des deux champs change.

```tsx
// fig04_02.tsx
import { onlineManager, QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// La «API» responde bien o falla según esta variable.
let apiCaida = false;

async function cargarNombres(): Promise<readonly string[]> {
  await new Promise((resolver) => setTimeout(resolver, 50));

  if (apiCaida) {
    throw new Error("la API respondió 503");
  }

  return ["catálogo", "pagos", "inventario", "reportes"];
}

function Observador() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: cargarNombres, retry: false });
  const datos = consulta.data === undefined ? "sin datos" : `${consulta.data.length} servicios`;

  // Escribir en la consola es sincronizarse con algo de fuera de React: un Effect.
  useEffect(() => {
    console.log(`  status=${consulta.status.padEnd(7)} fetchStatus=${consulta.fetchStatus.padEnd(8)} ${datos}`);
  }, [consulta.status, consulta.fetchStatus, datos]);

  return null;
}

const esperar = (ms: number) => act(() => new Promise<void>((resolver) => setTimeout(resolver, ms)));
const clienteConsultas = new QueryClient();
const raiz = createRoot(dom.window.document.createElement("div"));

console.log("1. sin red, se monta el componente:");
onlineManager.setOnline(false);
await act(async () =>
  raiz.render(
    <QueryClientProvider client={clienteConsultas}>
      <Observador />
    </QueryClientProvider>,
  ),
);
await esperar(100);

console.log("2. vuelve la red:");
await act(async () => onlineManager.setOnline(true));
await esperar(100);

console.log("3. la API se cae y se pide otra vez:");
apiCaida = true;
await act(async () => void clienteConsultas.refetchQueries({ queryKey: ["reporte"] }));
await esperar(100);

await act(async () => raiz.unmount());
clienteConsultas.clear();
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_02.tsx
$ node fig04_02.js
1. sin red, se monta el componente:
  status=pending fetchStatus=paused   sin datos
2. vuelve la red:
  status=pending fetchStatus=fetching sin datos
  status=success fetchStatus=idle     4 servicios
3. la API se cae y se pide otra vez:
  status=success fetchStatus=fetching 4 servicios
  status=error   fetchStatus=idle     4 servicios
```

Cinq lignes, cinq situations que le panneau doit savoir restituer à l'écran :

1. **`pending` + `paused`.** Il n'y a pas de données et rien n'est même en cours de demande : Query a constaté l'absence de réseau (`onlineManager.setOnline(false)` le simule) et a patienté. Si ton écran ne regardait que « est-ce en train de charger ? », il dirait ici non, et s'il ne regardait que « ai-je des données ? », il dirait également non. Les deux affirmations sont exactes.
2. **`pending` + `fetching`.** Le chargement initial : il n'y a pas de données et elles sont en cours de récupération. C'est le « Cargando… ».
3. **`success` + `idle`.** Il y a des données et aucune requête n'est en cours. L'écran au repos.
4. **`success` + `fetching`.** Il y a des données **et** elles sont redemandées en arrière-plan. C'est le cas qu'une union `cargando`/`listo`/`error` comme celle de la Leçon 0 ne pouvait pas formuler : là-bas, actualiser supposait de repasser par `cargando` et d'effacer la liste. Ici, la liste reste visible et, tout au plus, on signale une mise à jour en cours.
5. **`error` + `idle` avec « 4 servicios ».** La dernière tentative a échoué, **mais les données précédentes sont toujours là**. Query ne les efface pas. `status` vaut `error` et `data` contient toujours le rapport précédent.

La cinquième ligne est celle qui surprend le plus et qui compte le plus pour un panneau de supervision : lorsque l'API flanche un instant, la pire chose à faire est de laisser l'opérateur devant un écran vide. Query te donne les deux simultanément, l'erreur et la dernière bonne donnée, et c'est à ton écran de choisir comment les afficher.

En plus de ces deux champs, `useQuery` propose des raccourcis booléens : `isPending` vaut `status === "pending"`, `isError` vaut `status === "error"`, `isSuccess` vaut `status === "success"` et `isFetching` vaut `fetchStatus === "fetching"`. La documentation de `useQuery` précise au sujet de `isFetching` : il vaut `true` chaque fois que la fonction est en train de s'exécuter, **y compris** lors du chargement initial. Le point de contrôle utilise ces raccourcis, car ils facilitent par ailleurs le travail de TypeScript : après un `if (consulta.isPending) return …`, TypeScript sait que `consulta.data` ne peut plus être `undefined`. Dans « L'erreur que tu vas voir », tu supprimes ce `if` et TypeScript te le rappelle aussitôt.

Voici comment se présente `Panel`, qui ne reçoit désormais plus que `cadaMs` :

```tsx
// revisor/src/reporte/Panel.tsx
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { consultaReporte } from "./consultas";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { contarFallas } from "./resumen";

export function Panel({ cadaMs = 10_000 }: { readonly cadaMs?: number }) {
  const consulta = useQuery(consultaReporte(cadaMs));
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  const fallas = consulta.data === undefined ? 0 : contarFallas(consulta.data.estados);
  useTituloDocumento(fallas > 0 ? `(${fallas}) Revisor` : "Revisor");

  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <ContenidoReporte
          consulta={consulta}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        {consulta.dataUpdatedAt > 0 && (
          <p className="actualizado">
            Actualizado a las {new Date(consulta.dataUpdatedAt).toLocaleTimeString("es-MX")}
            {consulta.isFetching && " · actualizando…"}
          </p>
        )}
        <button type="button" disabled={consulta.isFetching} onClick={() => void consulta.refetch()}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Trois éléments ont changé par rapport à la Leçon 3 :

- **La requête remplace le hook.** `useQuery(consultaReporte(cadaMs))` retourne l'objet complet, et `Panel` le transmet tel quel à `ContenidoReporte`. Il n'y a plus de prop `cargar` : le composant ne reçoit pas la fonction qui apporte les données, car la fonction réside dans la requête.
- **« Actualizado a las » provient de `dataUpdatedAt`.** Dans la Leçon 3, c'était un état propre, `actualizadoEn`, écrit dans un `alRecibir` enveloppé dans un `useEffectEvent`. Désormais, Query enregistre déjà le moment où la dernière donnée valide est arrivée, sous forme d'un nombre de millisecondes ([TanStack Query, « useQuery »](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)), et vaut `0` tant qu'aucune n'est parvenue. C'est un état que l'on a cessé de stocker parce qu'on pouvait désormais le lire : la règle de la Leçon 2 « ne stocke pas ce que tu peux calculer », appliquée au cache.
- **Le bouton « Actualizar » appelle `refetch`** et est désactivé tant que `isFetching` est à `true`. Le `void` de `onClick={() => void consulta.refetch()}` est l'opérateur JavaScript qui évalue une expression et en écarte le résultat ([MDN, « void »](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)) : `refetch` renvoie une promesse, et écrire `void` rend visible qu'ici on ne l'attend ni ne l'utilise, au lieu de la laisser en suspens par inadvertance. Et le pied de page ajoute « · actualizando… » exactement dans le quatrième cas de la figure : il y a des données et elles sont en cours de rafraîchissement. C'est la nuance entre `status` et `fetchStatus`, illustrée sur une seule ligne.

### 4.5 Les quatre états, plus un

Une donnée provenant d'un serveur présente, au bas mot, **quatre états** que l'écran doit restituer : en chargement, en erreur, vide et avec données. Les trois premiers sont ceux que l'on oublie. L'erreur, parce que sur la machine de la personne qui programme, l'API répond toujours. Et l'état **vide**, parce que sur sa machine, il y a toujours des données de test : une liste vide est alors restituée sous la forme d'une liste sans lignes, ce qui à l'écran ne se distingue en rien d'une interface cassée. C'est pourquoi le plan du cours l'appelle « le quatrième état » et le met en gras.

Le cinquième, qui n'existe que grâce au cache, est **avec données et avec erreur** : la dernière mise à jour a échoué, mais un rapport antérieur peut être affiché. C'est la ligne 5 de la figure 2. `ContenidoReporte` restitue ces cinq états, dans cet ordre (le détail de 4.6 fait de même, à son échelle) :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportePublico } from "../compartido/contrato";
import { PanelDetalle } from "../detalle/PanelDetalle";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";

export function ContenidoReporte({
  consulta,
  soloFallas,
  seleccionado,
  notas,
  alSeleccionar,
  alGuardarNota,
}: {
  readonly consulta: UseQueryResult<ReportePublico>;
  readonly soloFallas: boolean;
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
}) {
  if (consulta.isPending) {
    return <p role="status">Cargando…</p>;
  }

  if (consulta.isError && consulta.data === undefined) {
    return (
      <div role="alert">
        <p>No se pudo cargar el reporte: {consulta.error.message}</p>
        <button type="button" onClick={() => void consulta.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const { estados } = consulta.data;

  if (estados.length === 0) {
    return <p>No hay servicios configurados todavía.</p>;
  }

  const visibles = filtrarEstados(estados, soloFallas);
  const existe = estados.some((estado) => estado.nombre === seleccionado);

  return (
    <>
      {consulta.isError && (
        <p role="alert" className="viejo">
          Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      <ResumenFallas estados={estados} />
      <ListaEstados
        estados={visibles}
        seleccionado={seleccionado}
        notas={notas}
        alSeleccionar={alSeleccionar}
      />
      {seleccionado !== null && existe && (
        <PanelDetalle
          key={seleccionado}
          nombre={seleccionado}
          notaGuardada={notas[seleccionado] ?? ""}
          alGuardarNota={alGuardarNota}
          alCerrar={() => alSeleccionar(null)}
        />
      )}
    </>
  );
}
```

Lis l'ordre des `if`, car chacun écarte un cas et laisse le suivant face à moins de possibilités :

1. **`isPending`** → « Cargando… », à l'intérieur d'un `role="status"`, qu'un lecteur d'écran annonce sans interrompre l'utilisateur. S'il n'y a pas encore de données, il n'y a rien d'autre à afficher.
2. **`isError` sans données** → l'alerte et un bouton « Reintentar » qui appelle `refetch`. C'est l'erreur véritable : l'appel a échoué et rien n'est disponible pour s'y substituer. `role="alert"` incite le lecteur d'écran à l'annoncer immédiatement.
3. **Une liste vide** → « No hay servicios configurados todavía. ». Remarque bien qu'il ne s'agit ni d'une erreur ni d'un chargement : c'est une réponse valide, `{"estados":[]}`, qui a une signification différente. Ce texte informe l'utilisateur de la situation au lieu de le laisser deviner si l'écran est en panne.
4. **Avec données** → le résumé, la liste et le détail, comme dans la Leçon 3.
5. **Avec données et avec erreur** → la même chose que le 4, avec un avertissement au sommet : « Mostrando el último reporte que llegó ». La classe `viejo` l'habille d'une bordure ambrée afin de le distinguer de la liste sans pour autant la masquer.

Après le deuxième `if`, TypeScript sait que `consulta.data` existe : si `isPending` avait été vrai, la fonction aurait déjà retourné, et s'il y avait eu une erreur sans données, également. C'est pourquoi `const { estados } = consulta.data;` compile sans nécessiter de `?.` ni de `!`. L'ordonnancement des `if` n'est pas qu'une question de lisibilité : c'est ce qui permet au compilateur de t'épauler.

La feuille de styles ajoute une règle, partagée avec le périmètre d'erreur de la section 4.8 :

```css
.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}
```

Provoque-les maintenant avec le serveur d'entraînement, qui accepte depuis cette leçon une variable `ESCENARIO` : `normal` (le comportement habituel), `vacio` (démarre sans services) ou `caido` (`GET /api/estados` renvoie systématiquement `503`). Avec `ESCENARIO=vacio npm run servidor` et `npm run dev`, voici ce que Chrome en mode headless a relevé à l'écran (le texte visible du conteneur) :

```text
Revisor
Estado de los servicios
 Solo fallas

No hay servicios configurados todavía.

Actualizado a las 2:11:47 a.m.

Actualizar
```

Et voici le journal du serveur : la paire de `StrictMode` et une bonne réponse, vide.

```text
08:11:44.790 servidor de práctica en http://127.0.0.1:3100 (escenario: vacio)
08:11:47.090 GET /api/estados cancelada por el cliente
08:11:47.395 GET /api/estados 200
```

Remarque la présence de « Actualizado a las… » : pour Query, une liste vide est un succès, et elle l'est effectivement. En revanche, avec `ESCENARIO=caido`, l'écran s'est présenté ainsi :

```text
Revisor
Estado de los servicios
 Solo fallas

No se pudo cargar el reporte: la API respondió 503

Reintentar
Actualizar
```

La partie intéressante se trouve dans le journal, ainsi que dans le relevé réseau consigné par le navigateur, avec les millisecondes écoulées depuis l'ouverture de la page :

```text
08:11:53.455 servidor de práctica en http://127.0.0.1:3100 (escenario: caido)
08:11:55.655 GET /api/estados cancelada por el cliente
08:11:55.955 GET /api/estados 503
08:11:57.262 GET /api/estados 503
08:11:59.571 GET /api/estados 503
```
```text
  342 ms  red  → GET /api/estados
  343 ms  red  → GET /api/estados
  343 ms  red  ✗ GET /api/estados net::ERR_ABORTED
  376 ms  red  ← GET /api/estados 503
 1373 ms  red  → GET /api/estados
 1685 ms  red  ← GET /api/estados 503
 3682 ms  red  → GET /api/estados
 3986 ms  red  ← GET /api/estados 503
```

Trois `503` après l'annulation : la tentative originale et les **deux réessais** configurés par `retry: 2`. Observe les intervalles entre une réponse et la requête suivante : environ 1 000 ms, puis environ 2 000 ms. C'est le délai d'attente par défaut de Query, qui débute à une seconde et double à chaque tentative, sans dépasser 30 secondes ([TanStack Query, « Query Retries »](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)). Pendant ce temps, l'écran est resté sur « Cargando… » : les réessais sont silencieux, et l'alerte ne se manifeste qu'une fois ces derniers épuisés. Avec la valeur par défaut `retry: 3`, l'utilisateur aurait attendu environ huit secondes avant de découvrir que l'API était hors service ; avec `2`, environ quatre secondes. (Un détail de lecture : dans le relevé du navigateur, il n'y a que 33 ms entre la première requête et son `503`, alors que le serveur met 300 ms. Ce n'est pas que le serveur a répondu plus vite ; le journal du serveur affiche bien les 300 ms. C'est que, pendant le chargement initial de la page, le navigateur a transmis les premières notifications groupées au programme qui les enregistrait, et ce dernier leur a apposé l'heure à laquelle il les a reçues. Dès la deuxième requête, les notifications arrivent une par une et les 300 ms réapparaissent : de 1373 à 1685 et de 3682 à 3986.)

Remarque aussi que sur cet écran il y a deux boutons, « Reintentar » et « Actualizar », et que tous deux appellent `consulta.refetch()`. Ce n'est pas un oubli de mise en page : ils appartiennent à des propriétaires différents. « Reintentar » appartient à `ContenidoReporte` et n'existe que dans l'état d'erreur sans données, où c'est la seule issue que la personne ait sous les yeux. « Actualizar » appartient à `Panel` et est toujours là, car rafraîchir un rapport que l'on voit est une action de la carte, et non de l'erreur. Que les deux coexistent dans ce seul état est le prix à payer pour que chaque composant ne connaisse que ce qui le concerne ; si cela te gêne dans ton produit, la solution est de masquer « Actualizar » quand il n'y a pas de données, et c'est une décision de conception, non de Query.

Et une observation qui n'apparaît sur aucune ligne : « Actualizado a las… » ne s'affiche pas, car `dataUpdatedAt` est resté à `0`. Aucune donnée valide n'est jamais arrivée. Si le serveur était tombé en panne **après** un chargement réussi, tu aurais vu le cinquième état : la liste surmontée de l'avertissement ambré.

### 4.6 Mutations et invalidation

Jusqu'ici, il n'était question que de lecture. Mais le détail d'un service dispose désormais d'un bouton qui **modifie** quelque chose sur le serveur : « Volver a revisar » demande au serveur d'entraînement de réexaminer le service. Le serveur propose une nouvelle route pour cela, `POST /api/servicios/:nombre/reintento`, qui, si le service existe, le trouve rétabli : elle renvoie `200` avec `{"nombre":"pagos","tipo":"disponible","codigoHttp":200,"duracionMs":95}` et, fait capital, **met à jour ses données internes**, de sorte que le prochain `GET /api/estados` renvoie d'emblée `pagos` en vert. (Si le service n'existe pas, elle renvoie `404` ; si le nom de l'adresse ne peut pas être décodé, comme dans `/api/servicios/%`, elle renvoie `400` avec `{"detalle":"nombre de servicio inválido"}` ; et elle propose depuis cette leçon la route `POST /api/servicios` pour enregistrer de nouveaux services ; cette dernière sera exploitée dans la Leçon 7.)

Une opération qui modifie des données sur le serveur s'appelle une **mutation**, et dispose dans Query de son propre hook, `useMutation`. La frontière réseau est identique aux deux autres : elle envoie la requête, vérifie le code retour et valide la forme de la réponse.

```ts
// revisor/src/detalle/reintentar.ts
import { esEstadoPublico, type EstadoPublico } from "../compartido/contrato";

export async function reintentarServicio(nombre: string): Promise<EstadoPublico> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, {
    method: "POST",
  });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esEstadoPublico(cuerpo)) {
    throw new Error("la API no entregó un estado válido");
  }

  return cuerpo;
}
```

Pour valider la réponse, elle utilise `esEstadoPublico`, la garde de type présente depuis la Leçon 0 et que `contrato.ts` n'exportait pas jusqu'ici, car seul `esReportePublico` l'employait. L'unique modification dans `contrato.ts` est ce mot-clé, `export`, complété de l'interface `NuevoServicio` dont le serveur a besoin pour l'enregistrement :

```ts
// revisor/src/compartido/contrato.ts (fragmento)
export function esEstadoPublico(valor: unknown): valor is EstadoPublico {
```

Le hook est concis, et chaque ligne a sa justification :

```ts
// revisor/src/detalle/useReintentar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async () => {
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
  });
}
```

- **`useMutation` ne s'exécute pas tout seul.** Contrairement à `useQuery`, qui lance une requête dès son montage, une mutation attend que quelqu'un appelle `mutate()`. Une lecture peut être réitérée sans conséquence ; une écriture, non, et c'est pourquoi elle ne se produit que sur demande expresse de l'utilisateur.
- **`useQueryClient()`** retourne le client même que `main.tsx` a placé dans le fournisseur. C'est le moyen d'interagir avec le cache depuis un composant.
- **`onSuccess` invalide deux clés.** `invalidateQueries` accomplit deux actions : il marque comme périmées les requêtes dont la clé concorde et, si l'une d'elles est en train d'être affichée à l'écran à cet instant, il la redemande en arrière-plan ([TanStack Query, « Query Invalidation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)). Les deux clés sont `["reporte"]`, puisque la liste a changé, et `["servicio", nombre]`, puisque le détail a également changé.
- **`onSuccess` renvoie une promesse** (la fonction est `async` et attend `Promise.all`). Cela influe directement sur le moment où la mutation est considérée comme achevée. Le guide de l'invalidation depuis les mutations l'indique en une phrase : renvoyer une promesse dans `onSuccess` garantit que les données sont actualisées avant que la mutation ne se termine tout à fait, et `isPending` reste à `true` tant que cette promesse n'est pas tenue ([TanStack Query, « Invalidations from Mutations »](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)). Sans ce `await`, le bouton réafficherait « Volver a revisar » alors que l'écran afficherait encore les données précédentes.

C'est ce que le `revisor` ne pouvait pas faire dans la Leçon 3 sans transmettre des fonctions de composant en composant : `PanelDetalle` ignore l'existence d'une liste, son emplacement ou qui l'affiche. Il sait simplement qu'en modifiant un service, la donnée `["reporte"]` n'est plus fiable. Le cache se charge de prévenir quiconque est en train de l'utiliser.

`PanelDetalle` exploite ces deux éléments, la requête et la mutation :

```tsx
// revisor/src/detalle/PanelDetalle.tsx
import { useQuery } from "@tanstack/react-query";
import { EditorNota } from "../reporte/EditorNota";
import { consultaDetalle } from "./consultas";
import { useReintentar } from "./useReintentar";

export function PanelDetalle({
  nombre,
  notaGuardada,
  alGuardarNota,
  alCerrar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  const consulta = useQuery(consultaDetalle(nombre));
  const reintento = useReintentar(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {consulta.isPending && <p role="status">Cargando detalle…</p>}
      {consulta.isError && consulta.data === undefined && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isError && consulta.data !== undefined && (
        <p role="alert" className="viejo">
          Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      {consulta.data !== undefined && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {consulta.data.estado.tipo === "disponible"
              ? `Disponible: HTTP ${consulta.data.estado.codigoHttp} en ${consulta.data.estado.duracionMs} ms`
              : `En falla: ${consulta.data.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{consulta.data.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{consulta.data.ultimaRevision}</dd>
        </dl>
      )}
      <button type="button" disabled={reintento.isPending} onClick={() => reintento.mutate()}>
        {reintento.isPending ? "Revisando…" : "Volver a revisar"}
      </button>
      {reintento.isError && (
        <p role="alert">No se pudo volver a revisar: {reintento.error.message}</p>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

Le bouton est désactivé et son libellé passe à « Revisando… » tant que `reintento.isPending` est vrai, pour éviter que quelqu'un n'envoie le même `POST` cinq fois par impatience. Si la mutation échoue, `reintento.isError` affiche l'alerte sous le bouton. Et note bien que la requête du détail utilise `isPending` et la présence de `data`, et non `isFetching` : pendant que le détail est redemandé après l'invalidation, la personne continue de voir la donnée précédente et non un « Cargando detalle… » intempestif qui l'effacerait.

Le détail affiche aussi le cinquième état de 4.5. Si la mise à jour échoue mais qu'un détail existait déjà, `status` vaut `error` et `data` est toujours là ; c'est pourquoi le bloc de données dépend de `consulta.data !== undefined` et non de `consulta.isSuccess`, qui vaudrait alors `false` et ferait disparaître précisément ce dont la personne a besoin pour décider. Avec un détail qui n'est jamais arrivé, en revanche, on ne voit que l'alerte d'erreur, comme dans `ContenidoReporte`.

#### 4.6.1 Ce qui se passe en cliquant sur « Volver a revisar », mesuré

C'est ici la partie de la leçon qu'il vaut le plus la peine de voir de ses propres yeux plutôt que de croire sur parole. Avec le serveur dans son scénario normal et `npm run dev`, le programme qui pilotait Chrome a sélectionné `pagos`, a attendu son détail et a cliqué sur « Volver a revisar ». Il a consigné chaque requête vers `/api/` et, chaque fois qu'un élément changeait, quatre indicateurs à l'écran : la ligne de `pagos` dans la liste, l'état dans le détail, le bouton et le pied de page. L'heure du pied de page a été remplacée par `HH:MM:SS` pour faciliter la lecture. Voici l'enregistrement complet :

```text
  188 ms  red  → GET /api/estados
  190 ms  red  → GET /api/estados
  191 ms  red  ✗ GET /api/estados net::ERR_ABORTED
  499 ms  red  ← GET /api/estados 200
  551 ms  pantalla: lista dibujada
  557 ms  red  → GET /api/servicios/pagos
  557 ms  red  → GET /api/servicios/pagos
  557 ms  clic en «pagos»
  558 ms  red  ✗ GET /api/servicios/pagos net::ERR_ABORTED
  558 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: Cargando detalle… | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
 2061 ms  red  ← GET /api/servicios/pagos 200
 2070 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
 3110 ms  red  → POST /api/servicios/pagos/reintento
 3111 ms  clic en «Volver a revisar»
 3113 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS
 3418 ms  red  ← POST /api/servicios/pagos/reintento 200
 3418 ms  red  → GET /api/estados
 3419 ms  red  → GET /api/servicios/pagos
 3428 ms  pantalla: fila: pagos: falla (HTTP 503) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS · actualizando…
 3723 ms  red  ← GET /api/estados 200
 3741 ms  pantalla: fila: pagos: disponible (HTTP 200, 95 ms) | detalle: En falla: HTTP 503 | botón: Revisando… [deshabilitado] | pie: Actualizado a las HH:MM:SS
 4940 ms  red  ← GET /api/servicios/pagos 200
 4965 ms  pantalla: fila: pagos: disponible (HTTP 200, 95 ms) | detalle: Disponible: HTTP 200 en 95 ms | botón: Volver a revisar | pie: Actualizado a las HH:MM:SS
```

Et voici le journal du serveur, issu de la même exécution :

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:11:26.236 GET /api/estados cancelada por el cliente
08:11:26.539 GET /api/estados 200
08:11:26.599 GET /api/servicios/pagos cancelada por el cliente
08:11:28.100 GET /api/servicios/pagos 200
08:11:29.454 POST /api/servicios/pagos/reintento 200
08:11:29.761 GET /api/estados 200
08:11:30.962 GET /api/servicios/pagos 200
```

Lis le relevé à partir du clic sur « Volver a revisar » (3111 ms) :

- **Le `POST` part une seule fois** et le bouton passe à « Revisando… [deshabilitado] » deux millisecondes plus tard. C'est « la mutation dans l'onglet réseau » : un `POST`, sans la paire de `StrictMode`, car il n'est pas déclenché par un Effect mais par un clic.
- **Dès l'arrivée de son `200` (3418 ms), deux `GET` partent dans la même milliseconde** : `/api/estados` et `/api/servicios/pagos`. Ce sont les deux invalidations de `onSuccess`. Personne ne les a formulées comme des requêtes ; elles ont été écrites comme « cette donnée n'est plus fiable », et Query les a converties en requêtes parce que les deux données étaient présentes à l'écran.
- **Pendant qu'elles arrivent, l'écran ne se vide pas.** À 3428 ms, la liste indique toujours `falla (HTTP 503)`, le détail indique toujours `En falla` et le pied de page ajoute « · actualizando… ». C'est la quatrième ligne de la figure 2, `success` + `fetching`, dans le véritable panneau.
- **La liste se met à jour en premier (3741 ms)**, car `GET /api/estados` met 300 ms. Pendant 1,2 seconde, la liste indique `disponible` et le détail indique encore `En falla` : le détail de `pagos` met 1,5 s à dessein, depuis la Leçon 3. Ce sont deux données distinctes dans le cache, chacune suivant son propre trajet. La scène par laquelle la leçon a débuté — deux parties de l'écran racontant des histoires divergentes — dure ici une seconde et se résout d'elle-même, au lieu de persister jusqu'à ce que quelqu'un clique sur « Actualizar ».
- **Le bouton ne revient à « Volver a revisar » qu'à 4965 ms**, moment où le détail est également arrivé. C'est l'effet du `await Promise.all` dans `onSuccess` : la mutation n'est pas considérée comme achevée tant que les deux requêtes n'ont pas été réexécutées. Le bouton dit la vérité quant au moment où l'écran est effectivement à jour.

Deux détails supplémentaires apparaissent dans la partie supérieure du relevé. En sélectionnant `pagos`, la paire `cancelada` + `200` du détail se manifeste : `StrictMode` monte, démonte et remonte `PanelDetalle`, et comme `cargarDetalle` exploite le `signal`, Query annule la première requête. De plus, le détail a mis 1,5 s à arriver, exactement comme dans la Leçon 3, parce que c'était la première fois qu'il était demandé. Si tu le fermes et le rouvres avant cinq secondes, il n'y a plus de requête : la donnée est dans le cache et elle est fraîche.

### 4.7 Ce que Suspense ne fait pas

Si tu cherches comment afficher « Cargando… » dans React, tu finis tôt ou tard par croiser `<Suspense fallback={…}>`. La tentation est de penser qu'envelopper le panneau dans un `Suspense` fera apparaître le `fallback` pendant que le rapport est demandé. Il n'en est rien, et il vaut mieux savoir pourquoi avant que cela ne te coûte un après-midi de travail.

`Suspense` affiche son `fallback` tant que quelque chose **à l'intérieur de lui** n'est pas prêt pour le rendu. La documentation de React détaille ce qui compte comme « non prêt » : le code d'un composant chargé avec `lazy`, une promesse lue avec `use` (par exemple des données provenant de Server Components ou d'un framework prévu pour Suspense), une feuille de styles avec `precedence`, et quelques autres situations liées au rendu sur le serveur et aux transitions. Et elle y adjoint un avertissement qui est ici fondamental : **Suspense ne détecte pas les données demandées à l'intérieur d'un Effect ou d'un gestionnaire d'événements** ([React, « Suspense »](https://react.dev/reference/react/Suspense)). `useQuery` sollicite ses données en dehors du rendu et communique par son objet de résultat ; ainsi, un `Suspense` entourant ce panneau n'afficherait jamais son `fallback` : le panneau ferait immédiatement son rendu avec `isPending` à `true`.

Query dispose bien d'une façon de fonctionner avec Suspense : un hook distinct, `useSuspenseQuery`, qui **suspend** le rendu tant qu'il n'y a pas de données. Avec lui, `data` est toujours défini, car le chargement et l'erreur **sans données** sont pris en charge par le `Suspense` et le périmètre d'erreur qui l'enveloppent ([TanStack Query, « Suspense »](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)). Ce même guide précise que toute erreur n'atteint pas nécessairement le périmètre : elle n'est levée que lorsqu'aucune autre donnée ne peut être affichée. Si une mise à jour échoue alors qu'un rapport réside dans le cache, `useSuspenseQuery` continue de rendre le composant avec `data` et avec `isError` à `true`, si bien que le cinquième état, « avec données et avec erreur », reste bien à sa place. C'est une façon parfaitement valable de concevoir un écran, mais elle a un coût pédagogique pour cette leçon : « en chargement » et « erreur sans données » ne sont plus visibles dans le composant, mais dispersés entre un `fallback` plus haut et un périmètre d'erreur encore plus haut. Pour un panneau dont la valeur réside précisément dans l'exposition claire des cinq états, le cours préfère les regrouper tous ensemble, dans `ContenidoReporte`, sous les yeux de qui lit le code. C'est pourquoi le point de contrôle n'emploie pas Suspense ; c'est un choix délibéré, pas un dogme.

### 4.8 Le périmètre d'erreur : l'unique classe du cours

Tout ce qui précède traite des erreurs **attendues** : l'API a renvoyé 503, la connexion réseau a été coupée. Celles-ci sont restituées sous forme d'états dans l'interface. Mais il existe une autre catégorie d'erreur : un composant qui, lors de son rendu, lève une exception. Un `undefined` imprévu, un `.map` invoqué sur ce qui n'est pas un tableau. Dans React, une telle erreur survenue pendant le rendu démonte l'arborescence tout entière : l'écran devient blanc.

Pour l'intercepter, il existe l'**Error Boundary**, qui s'appelle ici `LimiteDeError`. La documentation de React décrit la façon dont on l'écrit : un composant qui définit `static getDerivedStateFromError`, que React appelle lorsqu'un enfant — même éloigné — lève une erreur pendant son rendu, afin qu'au lieu d'effacer l'écran tu puisses afficher un message de secours ; et, facultativement, `componentDidCatch`, pour consigner l'erreur auprès d'un service de télémétrie. Et elle explique également pourquoi ce cours, qui n'enseigne pas les composants sous forme de classes, fait ici une exception : **il n'existe à ce jour aucun moyen d'écrire un Error Boundary sous forme de composant fonctionnel** ([React, « Component »](https://react.dev/reference/react/Component)).

```tsx
// revisor/src/compartido/LimiteDeError.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Propiedades {
  readonly children: ReactNode;
}

interface Estado {
  readonly error: Error | null;
}

// La única clase del curso: React todavía no ofrece una forma de función para
// atrapar los errores que ocurren al dibujar.
export class LimiteDeError extends Component<Propiedades, Estado> {
  state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  componentDidCatch(error: Error, informacion: ErrorInfo): void {
    console.error("error al dibujar", error, informacion.componentStack);
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div role="alert" className="limite-de-error">
          <h2>Algo salió mal al dibujar el panel</h2>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar la página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Ce composant s'articule en trois temps :

- **`getDerivedStateFromError`** est statique : elle n'a pas accès à `this`, reçoit simplement l'erreur et retourne le nouvel état. React l'appelle pendant le rendu ; elle doit donc être pure, comme tout rendu (Leçon 1).
- **`componentDidCatch`** est appelée après coup, une fois que React a terminé, et peut donc accomplir des effets de bord : ici, afficher dans la console l'erreur et la pile des composants. Dans un système en production, ce serait l'endroit désigné pour transmettre l'incident à un service de suivi d'erreurs.
- **`render`** affiche l'alerte en cas d'erreur, ou les enfants dans le cas contraire. Le bouton recharge la page entière : une erreur de rendu traduit presque toujours une anomalie dans le code, et, au niveau le plus élevé du panneau, repartir de zéro est la voie la plus directe pour retrouver un arbre sain. (Un périmètre plus petit, autour d'une seule section, pourrait proposer de réafficher uniquement cette partie sans perdre ce que la personne a dans le reste ; le cours n'en utilise qu'un, en haut.) Une précision sur le type : `getDerivedStateFromError(error: Error)` suppose que ce qui est levé est une `Error`, mais en JavaScript on peut lever n'importe quelle valeur ([MDN, « throw »](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw)). Si un enfant levait un simple texte, `error.message` vaudrait `undefined` et l'alerte s'afficherait sans message. Le périmètre du cours reste donc court ; la Leçon 5 revient sur le type `unknown` de ce qui est levé. Remarque que l'alerte affiche `error.message` tel quel. Comme cette valeur est insérée en tant que texte enfant dans du JSX, elle n'ouvre pas de faille XSS, mais elle expose à tout un chacun le message brut d'une exception, susceptible de divulguer des détails internes : noms de champs, chemins d'accès, fragments de requête. Dans ce panneau d'entraînement, cela facilite le débogage ; dans une application ouverte au public, il convient d'afficher un texte générique et de réserver le détail au journal de `componentDidCatch`.

Ce qu'un périmètre d'erreur **ne capture pas** importe tout autant que ce qu'il capture. Selon la même documentation : les erreurs survenues dans les gestionnaires d'événements (un `onClick` qui lève une exception), le code asynchrone (un `setTimeout`, une promesse non capturée), le rendu côté serveur et les erreurs survenues au sein du périmètre d'erreur lui-même. La page mentionne une exception que tu découvriras dans la [Leçon 7](07-formularios-accesibilidad.md) : ce qui est levé au sein d'une transition, telle qu'une action de formulaire, parvient effectivement jusqu'au périmètre. Cela éclaire la répartition des rôles dans ce panneau : un `fetch` qui échoue n'est pas une erreur de rendu, c'est une donnée arrivée en échec, gérée par Query sous forme d'état ; le périmètre d'erreur reste dédié à ce que personne n'avait anticipé.

Où se place-t-il ? Dans `main.tsx`, à **l'extérieur** du `QueryClientProvider`, enveloppant l'ensemble. Il intercepte ainsi également les éventuelles défaillances du fournisseur et de tout ce qui se trouve en dessous. La figure 3 de « L'erreur que tu vas voir » te montre la première erreur que tu commettras avec Query, et comment ce périmètre la convertit en un message intelligible au lieu d'un écran blanc.

### 4.9 Le parcours complet

Avec deux terminaux, comme dans la Leçon 0. Dans le premier, lance le serveur d'entraînement ; depuis cette leçon, il indique dans quel scénario il a démarré :

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
```

Dans le second, exécute `npm run dev`, puis ouvre `http://localhost:5173/`. Tu dois voir la liste des quatre services, le résumé « 4 servicios revisados · 2 servicios con falla », « Actualizado a las… » et, toutes les dix secondes, un bref « · actualizando… » dans le pied de page. Sélectionne `pagos`, attends son détail et clique sur « Volver a revisar » : la ligne passe au vert, puis le détail, et le bouton retrouve son libellé initial. C'est l'enregistrement de la section 4.6.1. Et une vérification de plus, sur la ligne elle-même : le bouton `pagos` est un bouton bascule (`aria-pressed`, Leçon 2), donc cliquer dessus **une seconde fois** ferme le détail. On l'a mesuré dans Chrome en mode headless, piloté par son protocole de débogage : `aria-pressed` valait `false` à l'ouverture, `true` après le premier clic (avec le détail visible), `false` après le deuxième (sans détail) et `true` après le troisième. Avec le code précédent, qui envoyait toujours le nom, le deuxième clic laissait `true` et le détail ouvert.

Ensuite, compile et observe la version de production, en laissant le serveur tourner : `npm run build` et `npm run preview`, sur `http://localhost:4173/`. Voici ce que le journal a consigné lorsque Chrome a ouvert cette version :

```text
08:13:08.422 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:13:10.768 GET /api/estados 200
```

Une seule requête. Sans `StrictMode`, il n'y a pas de montage supplémentaire, et la requête n'est émise qu'une seule fois. Et voici l'écran, avec le titre de l'onglet à `(2) Revisor` :

```text
Revisor
Estado de los servicios
 Solo fallas

4 servicios revisados · 2 servicios con falla

catálogo: disponible (HTTP 200, 42 ms)
pagos: falla (HTTP 503)
inventario: disponible (HTTP 200, 118 ms)
reportes: falla (tiempo límite agotado)

Actualizado a las 2:13:10 a.m.

Actualizar
```

Arrête tout avec Ctrl+C. Pour terminer, lance la vérification du point de contrôle, celle qu'exécute toute vérification automatisée : `npm ci`, `npm run lint` et `npm run build`, tous trois retournant le code de sortie 0. Le linter n'a signalé aucun problème, et la compilation a produit le même nom de fichier que les exécutions du cours sous macOS et Linux, `index-CHheidKQ.js`.

## L'erreur que tu vas voir

La leçon présente une erreur principale, celle que presque tout le monde commet la première fois avec Query, et une erreur d'accompagnement, que TypeScript intercepte pour toi.

**L'erreur principale : le fournisseur est absent.** `useQuery` a besoin d'un `QueryClient`, et le recherche dans le `QueryClientProvider` le plus proche vers le haut de l'arborescence. S'il n'y en a aucun — parce que tu as oublié d'envelopper l'arbre, ou monté un composant dans un test sans lui —, `useQuery` lève une erreur **au moment du rendu**. La troisième figure la provoque à dessein, avec un périmètre d'erreur calqué sur `LimiteDeError`, et demande à React de notifier quand un périmètre capture quelque chose (`onCaughtError`) :

```tsx
// fig04_03.tsx
import { useQuery } from "@tanstack/react-query";
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// El mismo patrón que LimiteDeError del revisor, reducido a lo indispensable.
class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      return <p role="alert">Algo salió mal al dibujar el panel: {this.state.error.message}</p>;
    }

    return this.props.children;
  }
}

function Panel() {
  const consulta = useQuery({ queryKey: ["reporte"], queryFn: async () => ["catálogo"] });
  return <p>{consulta.data?.length ?? 0} servicios</p>;
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor, {
  onCaughtError: (error) => console.log(`React atrapó: ${error instanceof Error ? error.message : error}`),
});

// Falta <QueryClientProvider> alrededor de <Panel />.
await act(async () =>
  raiz.render(
    <Limite>
      <Panel />
    </Limite>,
  ),
);
console.log(`En pantalla: ${contenedor.textContent}`);

await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig04_03.tsx
$ node fig04_03.js
React atrapó: No QueryClient set, use QueryClientProvider to set one
En pantalla: Algo salió mal al dibujar el panel: No QueryClient set, use QueryClientProvider to set one
```

Le message est parfaitement explicite : « aucun `QueryClient` défini, utilise `QueryClientProvider` pour en définir un ». Et l'on constate aussi le rôle joué par le périmètre : au lieu d'un écran blanc, l'utilisateur voit un message. Sans ce périmètre, React aurait démonté l'arborescence entière et la console aurait affiché cette même erreur comme non interceptée. La correction réside dans le `QueryClientProvider` de `main.tsx`. Dans les tests de la Leçon 8, cette même erreur est la raison d'être d'un utilitaire montant systématiquement chaque composant au sein de son fournisseur.

**L'erreur d'accompagnement : utiliser `data` avant de savoir s'il existe.** Dans `ContenidoReporte`, supprime le premier `if`, celui de `isPending`, et vérifie les types. Cela a été testé sur une copie du point de contrôle :

```text
$ npx tsc -b
src/reporte/ContenidoReporte.tsx(35,11): error TS2339: Property 'estados' does not exist on type 'ReportePublico | undefined'.
src/reporte/ContenidoReporte.tsx(42,32): error TS7006: Parameter 'estado' implicitly has an 'any' type.
```

Sans ce `if`, `consulta.data` peut valoir `undefined` — c'est précisément le cas `pending` — et TypeScript refuse de le déstructurer. (Les deux avertissements dépendent de `"strict": true` dans le `tsconfig`, celui que la Leçon 0 a fixé : sans lui, `undefined` passerait sans protester.) La seconde erreur découle de la première : faute de savoir ce qu'est `estados`, il ignore également ce qu'est chaque `estado`. L'intérêt majeur réside dans le fait que l'alerte surgit **avant** toute exécution : dans le navigateur, un tel oubli se traduirait par un `TypeError` lors du premier rendu, précisément le genre d'incident qui atterrit dans le périmètre de la section 4.8. La solution ne consiste ni en `consulta.data!.estados` ni en `consulta.data?.estados ?? []` : le premier ment, et le second transforme « je ne sais pas encore » en « il n'y a pas de services », ce qui correspond au quatrième état et signifie tout autre chose. La solution consiste à rendre convenablement le cas `pending`.

## Ce qui se fait de travers

**Copier les données de Query dans un `useState`.** `const [reporte, establecerReporte] = useState(consulta.data)` accompagné d'un Effect pour les synchroniser. C'est le réflexe habituel de quiconque a l'habitude de récupérer les données manuellement. On se retrouve alors avec deux copies de la même donnée, l'une devient obsolète, et l'Effect est précisément celui que la Leçon 3 t'a appris à ne pas écrire. Lis `consulta.data` là où tu en as besoin.

**Créer le `QueryClient` à l'intérieur d'un composant.** Chaque rendu instancie un cache neuf et vide : adieu la déduplication, la donnée qui survit au retour et tous les gains observés dans la figure 1. Il doit être placé au niveau du module, dans `main.tsx`, ou dans une fonction appelée une seule fois.

**Omettre de la clé une variable exploitée par la fonction.** `queryKey: ["servicio"]` associé à une fonction qui demande `nombre` fait partager à tous les détails une seule et même entrée du cache. Le linter ne le voit pas. La règle : ce que la fonction utilise doit figurer dans la clé.

**Traiter `isFetching` comme un état de « chargement ».** Si tu masques la liste chaque fois que `isFetching` est vrai, tu la vides toutes les dix secondes à cause de l'interrogation périodique. L'état de « chargement » correspond à `isPending` ; `isFetching` n'appelle, tout au plus, qu'un discret indicateur visuel.

**N'afficher que l'erreur en dissimulant les données périmées.** Lorsque `status` vaut `error` mais que `data` existe, tu as quelque chose d'utile à présenter. Un panneau de supervision qui devient blanc parce qu'une mise à jour a échoué est bien pire qu'un panneau indiquant « ceci date d'il y a une minute ».

**Oublier l'état vide.** Une liste sans lignes ne se distingue en rien d'un écran en panne. Une phrase telle que « No hay servicios configurados todavía. » ne coûte qu'une seule ligne de code.

**Invalider dans le composant immédiatement après `mutate()`.** Appeler `invalidateQueries` juste après `mutate()`, dans le `onClick`, déclenche l'invalidation **avant** que le serveur n'ait répondu : la liste est redemandée trop tôt et risque de rapporter l'ancienne donnée. L'invalidation a sa place dans `onSuccess`, qui s'exécute une fois la réponse bien reçue.

**Augmenter `retry` pour « réparer » une API instable.** Multiplier les réessais ne rend pas l'API plus fiable : cela retarde simplement le moment où l'utilisateur s'aperçoit de la défaillance. Avec le délai qui double à chaque étape, chaque réessai supplémentaire ajoute de longues secondes à l'affichage de « Cargando… ».

**Placer un `Suspense` autour de `useQuery` en espérant un `fallback`.** Il n'apparaîtra pas : `useQuery` ne suspend pas le rendu. Pour utiliser Suspense, il faut se tourner vers un autre hook, `useSuspenseQuery`, qui implique une autre répartition de la gestion des états.

**Employer le périmètre d'erreur pour les erreurs réseau.** Un `fetch` qui échoue est un état d'interface à afficher aux côtés de la liste, accompagné de son bouton « Reintentar ». Le périmètre d'erreur est réservé aux incidents imprévus.

## Exercices

### Exercice 1 — Prédis le journal sans réessais

Avec le serveur en `ESCENARIO=caido`, le journal de la section 4.5 a consigné une requête annulée et trois codes `503`. **Avant de modifier quoi que ce soit**, prédis ce qu'il enregistrera si, dans `cliente.ts`, tu remplaces `retry: 2` par `retry: 0`, et combien de temps mettra l'alerte à s'afficher. Vérifie ensuite avec `npm run dev`, puis rétablis la valeur `2` une fois terminé.

### Exercice 2 — Sans `staleTime`

Dans `fig04_01.tsx`, supprime la ligne `staleTime: 5_000,` au sein de `ConteoConQuery`. Prédis ce qui changera dans les trois lignes de la section Query : les appels à l'ouverture, ce qui s'affiche immédiatement au retour et les appels au retour. Compile-la et exécute-la.

### Exercice 3 — N'invalide que le détail

Dans `useReintentar.ts`, ne conserve dans le `Promise.all` que l'invalidation de `claves.servicio(nombre)`. Avant de tester, prédis ce qu'affichera la **liste** après avoir cliqué sur « Volver a revisar » pour `pagos`, et à quel moment elle se mettra à jour. Quelle facette de la scène d'ouverture de la leçon réapparaît alors ? Rétablis le fichier une fois terminé.

### Exercice 4 — La clé qui a oublié le nom

Dans `src/detalle/consultas.ts`, remplace `queryKey: claves.servicio(nombre)` par `queryKey: ["servicio"]`. Ouvre le détail de `pagos`, attends son chargement et, avant que cinq secondes ne s'écoulent, sélectionne `catálogo`. Qu'indique le détail sous le titre « catálogo » ? Le linter ou TypeScript t'ont-ils alerté ? Explique quelle règle de la section 4.3.1 tu as enfreinte. Rétablis le fichier une fois terminé.

## Solutions

### Solution 1

Avec `retry: 0`, Query ne retente pas l'opération : le journal consigne la paire de `StrictMode` et **un seul** `503`, c'est-à-dire `GET /api/estados cancelada por el cliente` suivi de `GET /api/estados 503`. L'alerte apparaît dès la réception de cette réponse, environ 300 ms après l'ouverture de la page, au lieu des quatre secondes nécessaires avec `retry: 2`. Cette prédiction découle de deux observations déjà mesurées : chaque `503` de la section 4.5 correspond à une tentative, et les intervalles de 1 et 2 secondes entre eux constituent le délai des réessais, qui disparaît avec zéro réessai. Si ta session ne fait pas apparaître la mention `cancelada`, cela tient à ce qu'expliquait la Leçon 0 : cela dépend de la capacité de la connexion à atteindre le serveur avant l'annulation. Zéro réessai a toutefois un prix : le moindre accroc réseau momentané se transforme instantanément en alerte à l'écran. C'est pourquoi le cours retient la valeur `2` et non `0`.

### Solution 2

Voici la sortie réelle de la figure sans cette ligne :

```text
a mano, un Effect por componente:
  al abrir:          2 llamada(s) a la API
  al volver, de inmediato se ve: «cargandocargando»
  al volver:         2 llamada(s) a la API
con TanStack Query, misma clave:
  al abrir:          1 llamada(s) a la API
  al volver, de inmediato se ve: «4 servicios4 servicios»
  al volver:         1 llamada(s) a la API
```

Un seul chiffre est modifié : **au retour, il y a un appel**. À l'ouverture, il n'y en a toujours qu'un seul, car la déduplication est indépendante de `staleTime`. Et au retour, on voit toujours « 4 servicios » immédiatement, puisque la donnée réside toujours dans le cache (elle est préservée par `gcTime`, non par `staleTime`). Le changement réside dans le fait qu'avec un `staleTime` à `0`, cette donnée est d'ores et déjà périmée ; Query l'affiche donc **et** la redemande en arrière-plan, une seule fois pour les deux composants. C'est la stratégie couramment désignée sous le nom « affiche ce que tu as pendant que tu revalides » (*stale-while-revalidate*) : l'utilisateur ne subit aucun temps de chargement superflu et la donnée s'actualise d'elle-même. `staleTime` ne conditionne pas l'existence du cache ; il détermine le moment à partir duquel il devient opportun de le rafraîchir.

### Solution 3

La liste **continue d'indiquer `pagos: falla (HTTP 503)`** alors même que le détail affiche déjà « Disponible ». Elle ne se mettra à jour qu'à la prochaine interrogation périodique de `refetchInterval`, au maximum dix secondes plus tard, ou plus tôt si la fenêtre perd puis reprend le focus (car la donnée de la liste devient périmée au bout de cinq secondes et `refetchOnWindowFocus` est actif). C'est exactement la scène d'ouverture de la leçon : le détail et la liste racontant deux histoires divergentes au sujet du même service. Rien dans le code n'est « incorrect » au sens où cela empêcherait la compilation ou alerterait le linter ; ce qui fait défaut, c'est d'avertir le cache que la donnée `["reporte"]` a elle aussi changé. L'invalidation décrit **quelles données sont affectées par une écriture**, et cette liste relève de la responsabilité de la personne qui rédige la mutation. Dans le journal, le constat est immédiat : après le `POST`, un seul `GET` est émis, celui du détail.

### Solution 4

Sous le titre « catálogo », apparaît le détail **de `pagos`** : « En falla: HTTP 503 ». Avec `["servicio"]` comme clé, les détails de l'ensemble des services partagent une unique entrée dans le cache. En choisissant `catálogo`, `PanelDetalle` est remonté (en raison du `key={seleccionado}` dans `ContenidoReporte`) et réclame la clé `["servicio"]` ; Query y trouve les informations de `pagos`, encore fraîches puisque les cinq secondes de `staleTime` ne se sont pas écoulées, et les délivre sans émettre de requête. Une fois ces cinq secondes passées, un nouveau montage redemanderait la donnée et afficherait `catálogo`, non sans avoir présenté un instant une information erronée. Ni le linter ni TypeScript n'émettent d'avertissement : la clé est un tableau valide et le type de la donnée est rigoureusement conforme, à ceci près qu'il s'agit de celle d'un autre service. Tu as enfreint la règle de la section 4.3.1 : « si la fonction dépend d'une variable, cette variable doit figurer dans la clé » : `cargarDetalle(nombre, signal)` dépend de `nombre`, par conséquent `nombre` doit obligatoirement figurer dans la clé. C'est le pendant, sous Query, de la dépendance omise dans l'Effect de la Leçon 0, avec une différence notable : ici, aucun `exhaustive-deps` n'est là pour veiller au grain.

## Comment savoir que j'ai réussi

- [ ] `npm ls @tanstack/react-query`, exécuté dans `~/curso-react/revisor/`, affiche `@tanstack/react-query@5.104.5`, et `src/` ne contient plus `useReporte.ts` ni `useDetalle.ts`.
- [ ] `npm run lint` s'achève sans signaler le moindre problème, et `npm run build` se conclut par `✓ built` en déposant dans `dist/assets/` un fichier nommé `index-CHheidKQ.js` : si ton code est identique à celui du point de contrôle, le nom correspond exactement.
- [ ] `node fig04_01.js` affiche `1 llamada(s)` à l'ouverture et `0 llamada(s)` au retour dans la partie Query, et tu sais expliquer l'origine de chaque valeur.
- [ ] Avec `ESCENARIO=vacio`, le panneau indique « No hay servicios configurados todavía. » ; avec `ESCENARIO=caido`, il affiche l'alerte accompagnée de « Reintentar » et le journal consigne trois `503` (précédés, si elle a le temps d'aboutir, d'une mention `cancelada por el cliente`).
- [ ] Dans le navigateur, le bouton de la ligne `pagos` bascule : un clic affiche le détail (`aria-pressed="true"`) et un second clic le masque (`aria-pressed="false"`).
- [ ] Dans le scénario normal, cliquer sur « Volver a revisar » pour `pagos` inscrit dans le journal un `POST /api/servicios/pagos/reintento 200` suivi d'un `GET /api/estados 200` et d'un `GET /api/servicios/pagos 200`, et la ligne de `pagos` passe au vert sans avoir à cliquer sur « Actualizar ».
- [ ] Tu peux citer les cinq combinaisons de `status` et `fetchStatus` de la figure 2 et indiquer laquelle affiche « · actualizando… » dans le pied de page.
- [ ] Avec `npm run preview`, ouvrir la page ne génère qu'une seule requête `GET /api/estados` dans le journal.
- [ ] En retirant temporairement le `QueryClientProvider` de `main.tsx` (puis en le rétablissant), tu vois s'afficher le message de `LimiteDeError` au lieu d'un écran blanc.
- [ ] Tu as noté dans ton [journal de bord](bitacora.md) combien de requêtes tu réalisais manuellement par rapport à ce que Query effectue désormais, une action automatique de Query qui t'a surpris, et dans quelle situation un `staleTime` différent de zéro s'est avéré pertinent.

## Résumé

Réponds sans consulter la leçon :

1. D'après le plan du cours, aller chercher les données manuellement ne passe pas à l'échelle pour trois raisons : cache, cascades et concurrence entre les requêtes. Que dit la documentation de React pour chacune d'elles, et comment Query y répond-il ? Laquelle a été mesurée par la figure 1 ?
2. Pourquoi le `QueryClient` est-il créé dans `main.tsx` et non à l'intérieur d'un composant ? Que contient-il ?
3. Qu'est-ce qu'une clé de requête et quelle règle empêche deux données distinctes de partager la même entrée dans le cache ?
4. Qui crée désormais l'`AbortController`, et quand Query annule-t-il le `signal` ?
5. À quelle question répond `status` et à laquelle répond `fetchStatus` ? Quelle combinaison signifie « j'ai des données et je suis en train de rafraîchir » ?
6. Quels sont les quatre états d'une requête, et quel est le cinquième qui n'existe que grâce au cache ?
7. Que font `staleTime`, `retry` et `refetchInterval` dans ce panneau ? Pourquoi trouve-t-on trois `503` dans le journal avec `retry: 2` ?
8. Que fait `invalidateQueries` et pourquoi se place-t-il dans `onSuccess` ? Pourquoi le bouton affiche-t-il « Revisando… » jusqu'à ce que le détail soit lui aussi arrivé ?
9. Pourquoi un `Suspense` placé autour de `useQuery` n'affiche-t-il pas son `fallback` ?
10. Quelles erreurs un Error Boundary intercepte-t-il, lesquelles laisse-t-il passer, et pourquoi est-il implémenté sous forme de classe ?

## Pour aller plus loin

- [React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects), section « What are good alternatives to data fetching in Effects? » : les inconvénients de la récupération de données dans un Effect (absence de serveur, cascades, absence de cache, manque d'ergonomie) et la recommandation d'un cache côté client. Consulté le 21 octobre 2026.
- [React, « Suspense »](https://react.dev/reference/react/Suspense) : les éléments qui déclenchent un périmètre Suspense et l'avertissement précisant qu'il ne détecte pas les données sollicitées au sein d'un Effect ou d'un gestionnaire d'événements. Consulté le 21 octobre 2026.
- [React, « Component »](https://react.dev/reference/react/Component), section « Catching rendering errors with an Error Boundary » : `getDerivedStateFromError`, `componentDidCatch`, les erreurs non interceptées et l'absence actuelle d'alternative fonctionnelle. Consulté le 21 octobre 2026.
- [TanStack Query, « Important Defaults »](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) : `staleTime` à zéro, `gcTime` fixé à cinq minutes, trois réessais et mises à jour automatiques au montage, à la reprise de focus et à la reconnexion. Consulté le 21 octobre 2026.
- [TanStack Query, « Queries »](https://tanstack.com/query/latest/docs/framework/react/guides/queries) : `status` face à `fetchStatus` et leurs valeurs respectives. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Keys »](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) : les clés sous forme de tableaux sérialisables et la règle d'y intégrer les variables dont dépend la fonction. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Options »](https://tanstack.com/query/latest/docs/framework/react/guides/query-options) : `queryOptions` pour partager clé et fonction avec leur type déduit. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Cancellation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) : l'`AbortSignal` fourni à chaque fonction et les circonstances de son annulation. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Retries »](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries) : le nombre de réessais et le délai d'attente exponentiel doublant d'une seconde jusqu'à 30 secondes. Consulté le 21 octobre 2026.
- [TanStack Query, « useQuery »](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) : `refetchInterval`, `refetchIntervalInBackground`, `dataUpdatedAt`, `isFetching`, `isPending` et `refetch`. Consulté le 21 octobre 2026.
- [TanStack Query, « Mutations »](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) : `useMutation`, ses états et les fonctions retournant des promesses. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Invalidation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation) : le fonctionnement de `invalidateQueries` et la correspondance par préfixe de clé. Consulté le 21 octobre 2026.
- [TanStack Query, « Invalidations from Mutations »](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations) : le renvoi d'une promesse dans `onSuccess` maintenant `isPending` à `true` jusqu'à sa résolution. Consulté le 21 octobre 2026.
- [TanStack Query, « Suspense »](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) : `useSuspenseQuery`, la garantie de données toujours définies et la nature des erreurs parvenant au périmètre d'erreur. Consulté le 21 octobre 2026.
- [npm, « npm install-scripts »](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts) : le blocage des scripts d'installation des dépendances par défaut, et la procédure pour les examiner et les approuver. Consulté le 21 octobre 2026.
- [npm, `@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query) : la version 5.104.5, publiée le 19 octobre 2026. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce que cela signifie |
|---|---|
| état du serveur | la copie, à l'écran, d'une donnée résidant sur une autre machine : elle met du temps à arriver, peut échouer et vieillit |
| cache | l'emplacement, en dehors des composants, où Query conserve ce qui est parvenu du serveur, à raison d'une entrée par clé |
| clé de requête | le tableau identifiant une donnée dans le cache, par exemple `["servicio", "pagos"]` |
| déduplication | lorsque deux composants demandent la même clé au même moment, une seule requête réseau est émise |
| fraîche / périmée (*stale*) | une donnée est fraîche pendant la durée de `staleTime` après son arrivée ; passé ce délai, elle est affichée mais redemandée en cas de besoin |
| `status` / `fetchStatus` | présence de données (`pending`, `error`, `success`) / activité de la fonction de requête (`fetching`, `paused`, `idle`) |
| mutation | une opération modifiant des données sur le serveur ; dans Query, `useMutation`, qui ne s'exécute que lors d'un appel à `mutate()` |
| invalider | marquer comme périmées les requêtes d'une clé et redemander immédiatement celles qui sont visibles à l'écran |
| état vide | une réponse valide ne contenant aucune donnée, que l'interface doit distinguer d'un chargement et d'une erreur |
| Error Boundary (périmètre d'erreur) | un composant de classe interceptant les erreurs levées par ses enfants lors du rendu afin d'afficher une interface de secours |

---

**Suivante :** [Leçon 5 — Routes et l'URL comme état](05-rutas-url-como-estado.md)
