# Leçon 5 — Routes et l'URL comme état

*Il est 23 h 10 et tu es d'astreinte. À 23 h 04, `pagos` a commencé à tomber en panne, et la personne de l'exploitation en charge de l'incident t'écrit sur le chat : « tu peux me passer le panneau déjà filtré, avec seulement ce qui échoue ? ». Tu lui colles l'adresse que tu as dans ton navigateur. Elle l'ouvre et voit les quatre services, sans aucun filtre, car la case « Solo fallas » résidait dans la mémoire de ton onglet et non dans l'adresse. Tu lui expliques par écrit : « coche la case, puis clique sur pagos ». Elle le fait, voit le détail, et pour avoir des données fraîches, appuie sur F5. Le navigateur lui répond par une page d'erreur du serveur : `404 File not found`. À 23 h 12, elle t'appelle pour te demander si le panneau était en panne lui aussi. Il ne l'était pas. Il lui manquait deux choses : une adresse qui indique ce que tu es en train de regarder et un serveur qui sache quoi répondre quand quelqu'un recharge cette adresse. Cette leçon construit les deux.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 5.2 et 5.3)

**Ce que tu construis :** le `revisor` avec trois écrans accessibles par un lien direct : la liste sur `/`, le détail de chaque service sur `/servicios/:nombre` et une page « non trouvée » pour toute autre adresse ; les filtres « Solo fallas » et « Buscar por nombre » voyagent dans l'adresse (`?fallas=1&q=pag`), et les notes survivent aux allers-retours entre les écrans ; et si une page plante lors de son rendu, le panneau affiche son propre avertissement plutôt qu'une page d'erreur en anglais

**Ce que tu apprends :** les routes sous forme d'objets avec `createBrowserRouter`, imbriquées avec `<Outlet />` ; les paramètres de route avec `useParams` et de recherche avec `useSearchParams` ; un filtre que l'on partage en copiant le lien ; `Link` et `NavLink` ; le périmètre d'erreur d'une route avec `ErrorBoundary` et `useRouteError` ; **ce qui se passe quand quelqu'un recharge une route du client et pourquoi le serveur doit répondre `index.html`**

**D'où tu viens.** De la [Leçon 4](04-estado-del-servidor.md). Ton `revisor` récupère déjà les données avec TanStack Query : le rapport est demandé avec `useQuery`, conservé en cache, mis à jour en arrière-plan toutes les 10 secondes et possède ses quatre états plus un (chargement, erreur, vide, avec données, et données périmées avec avertissement). Le détail d'un service apparaît sous la liste, dans un `PanelDetalle`, lorsque tu cliques sur son nom, et le bouton « Volver a revisar » est une mutation qui invalide le rapport et le détail. Tout cela réside dans un seul écran, gouverné par le composant `Panel`, qui conserve trois états avec `useState` : `soloFallas`, `seleccionado` et `notas`. Tu pars du point de contrôle [`programas/04-estado-del-servidor/revisor/`](../programas/04-estado-del-servidor/revisor).

**Ce que cette leçon ne fait pas.** Elle ne touche pas au serveur d'exercice : il reste dans sa version C, la même que dans la Leçon 4, avec les mêmes routes. Elle n'utilise pas les *loaders* ni les *actions* de React Router : les données continuent d'être récupérées par TanStack Query, pour des raisons expliquées en 5.1. Elle ne déplace pas les notes vers un contexte React : elles remontent d'un niveau, dans la disposition des routes, et la [Leçon 6](06-reducer-contexto.md) examinera si c'est leur place définitive. Elle n'ajoute pas l'écran d'enregistrement de service, qui arrivera avec sa route `/servicios/nuevo` dans la [Leçon 7](07-formularios-accesibilidad.md). Elle ne teste pas les routes avec un routeur en mémoire au sein d'une suite de tests : c'est l'objet de la [Leçon 8](08-pruebas-de-componentes.md), bien que les figures de cette leçon utilisent déjà ce routeur. Et elle n'écrit pas le serveur qui sert `dist/` avec réécriture : cette leçon démontre pourquoi il est nécessaire ; la [Leçon 9](09-rendimiento-publicacion.md) se charge de l'écrire.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon, et avec Python 3.12 pour le serveur statique de 5.3. Le point de contrôle a été installé depuis zéro avec `npm ci` ; `npm run lint` et `npm run build` se sont terminés sans erreur et ont produit `dist/assets/index-CyH_ELFs.js`, le même nom que celui obtenu lors de la vérification du point de contrôle dans un conteneur Linux (Debian 12, image `node:24.22.0-bookworm`). Rien n'a été exécuté sur un Linux Mint réel ; rien de ce qui est montré ne dépend du système d'exploitation. `npm ci` affiche sous macOS un avertissement `install-scripts` concernant `fsevents@2.3.3` : c'est une dépendance optionnelle qui ne s'installe que sous macOS pour surveiller les fichiers, il n'est pas nécessaire de l'approuver et elle n'apparaîtra pas sur ton Mint. Ce qui se voit « dans le navigateur » a été mesuré avec Chrome sans interface graphique (`--headless --dump-dom`) en interrogeant `vite preview`, avec l'option `--virtual-time-budget`, qui avance les horloges de la page pour ne pas attendre pour de vrai : c'est pourquoi les heures du journal du serveur d'exercice (en UTC) ne servent pas à mesurer les délais dans cette leçon, mais uniquement à compter les requêtes. Les captures du détail ont été prises avec une `PaginaServicio` qui, si une mise à jour échouait, masquait le détail et l'éditeur de la note ; celle de 5.2.1 corrige cela et fournit le même résultat lorsque les requêtes aboutissent, ce qui est tout ce que ces captures enregistrent. Les exécutions du périmètre d'erreur (5.1.6, exercice 3) et celles de `curl` en 5.3 ont été réalisées avec l'API d'exercice sur le port 3199 et avec `vite preview` ainsi que le serveur Python sur le port 4199, car sur la machine utilisée pour les exécutions, les ports habituels étaient occupés par d'autres processus ; la leçon les présente avec les ports du cours (3100, 4173 et 4190), ce qui est la seule chose qui change. Les figures ont été exécutées avec leur propre `package.json` dans [`programas/05-rutas-url-como-estado/`](../programas/05-rutas-url-como-estado), aux côtés de `revisor/` ; les chemins longs sont affichés à partir de `~/curso-react`. Le serveur d'entraînement (le même fichier depuis la leçon 4) répond `400` avec `{"detalle":"nombre de servicio inválido"}` à une adresse comportant un `%` mal formé, comme `/api/servicios/%`, et à sa route `/reintento` ; auparavant, il répondait `500`. On l'a mesuré avec `curl` contre une copie, avant et après, et le processus est resté en vie dans les deux cas.

## À la fin, tu seras capable de

- Déclarer les routes d'une application sous forme de tableau d'objets (`RouteObject[]`), les imbriquer sous une disposition avec `<Outlet />` et prédire quel composant affiche chaque adresse, y compris une adresse inexistante.
- Lire un paramètre de route avec `useParams`, expliquer pourquoi TypeScript le type en `string | undefined` et vérifier qu'il arrive décodé (`cat%C3%A1logo` → `catálogo`).
- Conserver des filtres dans l'adresse avec `useSearchParams`, expliquer à l'aide d'une figure la différence entre `replace: true` et une navigation normale pour le bouton « Retour », et partager un filtre en copiant le lien.
- Utiliser `Link` et `NavLink`, et repérer dans le HTML le `aria-current="page"` ainsi que la classe `active` appliqués par `NavLink`.
- Expliquer pourquoi un composant de route préserve son état lorsque seul le paramètre change, et le réinitialiser avec `key`.
- Expliquer pourquoi le `LimiteDeError` de la Leçon 4 cesse de voir les erreurs des pages lorsque le routeur entre en jeu, provoquer le `Unexpected Application Error!` et déclarer un `ErrorBoundary` sur la route racine affichant le même avertissement.
- Démontrer avec `curl` qu'un serveur statique sans réécriture répond 404 lors du rechargement de `/servicios/pagos`, et que `vite preview` répond `index.html`.

## Le pourquoi avant le comment

Le `revisor` de la Leçon 4 fonctionne, mais il ne possède **qu'une seule adresse** : `http://localhost:5173/`. Tout le reste — si tu es en train de filtrer, quel service tu as choisi, quelle note tu as rédigée — réside à l'intérieur de l'onglet, dans l'état de `Panel`. Pose quatre questions à cet écran et tu verras les failles.

**Peux-tu envoyer ce que tu es en train de regarder ?** Non. L'adresse est toujours la même, si bien que la personne qui l'ouvre voit la liste complète, sans filtre et sans aucun service sélectionné. Pour « envoyer » une vue, tu dois envoyer des instructions. C'est la scène du début.

**Le bouton « Retour » fonctionne-t-il ?** Pas davantage. Si tu choisis `pagos` puis `inventario`, et que tu appuies sur « Retour », le navigateur ne revient pas à `pagos` : il quitte le panneau, car pour lui il n'y a jamais eu plus d'une seule page. L'utilisateur emploie le bouton dont il se sert le plus au monde et l'application a un comportement inattendu.

**Que se passe-t-il si tu recharges ?** Tout ce qui ne figurait pas dans l'adresse est perdu : le filtre et le service sélectionné reprennent leur valeur initiale. Sur un écran d'astreinte, où recharger est un réflexe, cela oblige à recliquer à chaque fois.

**Comment l'application grandit-elle ?** Dans la Leçon 7 arrive un écran de création de service. Avec une seule adresse, `Panel` devrait décider avec de plus en plus de `if` ce qu'il doit afficher, et chaque nouvel écran constituerait une branche d'état supplémentaire que l'on risque d'oublier de réinitialiser.

Ces quatre questions ont la même réponse : **ce que la personne est en train de regarder doit être écrit dans l'adresse.** L'adresse est un état, exactement comme un `useState`, avec trois avantages qu'aucun `useState` ne possède : elle peut être copiée, le navigateur conserve son historique (c'est pourquoi le bouton « Retour » existe) et elle survit à un rechargement. Et elle a une conséquence facile à oublier : si l'adresse `/servicios/pagos` peut être copiée, quelqu'un va la coller dans un navigateur fraîchement ouvert, et ce navigateur va la demander **au serveur**, qui n'a jamais entendu parler de `pagos`.

L'outil pour répondre au premier point est un **routeur** : une pièce logicielle qui lit l'adresse, décide quels composants afficher et modifie l'adresse sans recharger la page lorsque l'utilisateur navigue. Le cours utilise **React Router**, dans sa version 8.5.0, et l'installe sous la forme d'un paquet unique, `react-router` : la version 8 a cessé de publier `react-router-dom`, le paquet que tu verras dans d'anciens tutoriels, et les composants propres au navigateur sont désormais importés depuis `react-router/dom` ([React Router, « Upgrading from v7 »](https://reactrouter.com/upgrading/v7)). Ce même guide précise ses exigences : Node 22.22 ou supérieur et React 19.2.7 ou supérieur ; le cours utilise Node 24 et React 19.3.1. Pour le second point, aucune bibliothèque n'est requise : il suffit de comprendre ce que le navigateur demande au serveur et ce que celui-ci doit répondre ; c'est l'objet de 5.3.

La leçon comporte trois parties, une par concept : les routes sous forme d'objets, la disposition qui les enveloppe et le périmètre d'erreur qui les protège (5.1) ; les paramètres et la recherche, c'est-à-dire l'adresse comme état (5.2) ; et le rechargement d'une route du client (5.3). Au final, voici ce qu'affiche le `revisor` lorsque tu ouvres `http://localhost:4173/?fallas=1` dans un navigateur neuf, sans avoir effectué le moindre clic (le titre et le conteneur sont présentés tels que Chrome sans interface graphique les a retournés) :

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox" checked=""> Solo fallas</label><label>Buscar por nombre <input type="search" value=""></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="falla"><a href="/servicios/pagos" data-discover="true">pagos</a>: falla (HTTP 503)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul><p class="actualizado">Actualizado a las 2:14:52 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

La case arrive cochée (`checked=""`) et la liste ne comporte que `pagos` et `reportes`. Personne ne l'a cochée : c'est l'adresse qui l'a fait.

## Les concepts

### 5.1 Les routes sont des objets, et la disposition les enveloppe

#### 5.1.1 Installer le routeur, et dans quel mode l'utiliser

Depuis `~/curso-react/revisor/`, avec la version exacte fixée par le cours :

```bash
npm install --save-exact react-router@8.5.0
```

Le `package.json` du point de contrôle devient le suivant ; la version change pour suivre celle de la leçon, ainsi que la nouvelle dépendance :

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.5.0",
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
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
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

React Router peut être utilisé de trois manières, que sa documentation qualifie de **modes** et qui s'empilent les unes sur les autres ([React Router, « Picking a Mode »](https://reactrouter.com/start/modes)). Dans le **mode déclaratif**, tu enveloppes l'application dans un `<BrowserRouter>` et tu écris les routes sous forme de composants au sein de l'arbre. Dans le **mode de données**, tu déclares les routes **en dehors** de React, sous la forme d'un tableau d'objets que tu transmets à `createBrowserRouter`, et tu les affiches avec `<RouterProvider>` ; en contrepartie, tu gagnes les *loaders*, les *actions* et les états de navigation. Enfin, le **mode framework** englobe celui de données avec un plugin Vite qui ajoute des conventions de fichiers, le découpage de code (*code splitting*) et le rendu côté serveur.

Le cours emploie le mode de données, mais sans ses *loaders*. La raison du premier choix est pratique : un tableau d'objets peut être **exporté**, et la Leçon 8 charge ce même tableau dans un routeur en mémoire pour tester les écrans sans navigateur ; les figures de cette leçon le font déjà. La raison du second est que le `revisor` a déjà résolu dans la Leçon 4 la question de la récupération des données : TanStack Query gère le cache, met à jour en arrière-plan et partage une requête entre plusieurs écrans. Ajouter en plus les *loaders* créerait deux systèmes responsables de la même tâche. C'est un choix propre au cours, pas une règle imposée par React Router ; dans une application dépourvue de bibliothèque de données, les *loaders* sont une excellente solution. Et le mode framework reste à l'écart pour la même raison que celle évoquée dans la Leçon 9 lors de l'étude des frameworks : le cours souhaite que tu voies chaque pièce séparément.

#### 5.1.2 Les routes du `revisor`

Voici le nouveau fichier le plus important de la leçon. Il s'agit d'un tableau d'objets, où chaque objet indique **quelle adresse** et **quel composant** :

```tsx
// revisor/src/app/rutas.tsx
import type { RouteObject } from "react-router";
import { PaginaServicio } from "../detalle/PaginaServicio";
import { PaginaReporte } from "../reporte/PaginaReporte";
import { Disposicion } from "./Disposicion";
import { ErrorDeRuta } from "./ErrorDeRuta";
import { PaginaNoEncontrada } from "./PaginaNoEncontrada";

export const rutas: RouteObject[] = [
  {
    path: "/",
    Component: Disposicion,
    ErrorBoundary: ErrorDeRuta,
    children: [
      { index: true, Component: PaginaReporte },
      { path: "servicios/:nombre", Component: PaginaServicio },
      { path: "*", Component: PaginaNoEncontrada },
    ],
  },
];
```

Lis-le de l'extérieur vers l'intérieur, car c'est ainsi que React Router le parcourt :

- **La route extérieure**, `path: "/"`, affiche `Disposicion` : l'en-tête, la navigation et l'emplacement où la page prend place. Toutes les autres routes sont ses **enfants** (`children`), si bien que la disposition enveloppe n'importe quelle page enfant (avec une exception que tu verras en 5.1.6 : si une erreur remonte jusqu'au périmètre d'erreur de cette même route, le périmètre s'affiche à la place de la disposition). La documentation le formule ainsi : le chemin du parent est automatiquement préfixé à celui de chaque enfant, et les enfants sont affichés dans le `<Outlet />` du parent ([React Router, « Routing »](https://reactrouter.com/start/data/routing)).
- **La route index**, `index: true`, n'a pas de `path` : c'est la page qui s'affiche dans le `<Outlet />` lorsque l'adresse correspond exactement à celle du parent, `/`. C'est le rapport.
- **`servicios/:nombre`** ne commence pas par `/` car elle est relative au parent : l'adresse complète est `/servicios/:nombre`. Les deux-points signalent un **segment dynamique** : lorsque l'adresse correspond, la valeur située à cette position est fournie comme paramètre `nombre`.
- **`*`** correspond à tout ce qu'aucune route sœur n'a intercepté. C'est la page « non trouvée ».
- **`ErrorBoundary: ErrorDeRuta`** n'est pas une adresse : elle indique quoi afficher si un élément de cette route, ou de ses enfants, plante lors du rendu. C'est la dernière pièce de 5.1, et elle fait l'objet d'une section dédiée, la 5.1.6.

Remarque que les routes utilisent `Component: PaginaReporte` et non `element: <PaginaReporte />`. Les deux formes existent ; avec `Component`, tu passes le composant et React Router l'instancie lorsqu'il le faut, sans créer d'éléments à l'avance. C'est la syntaxe retenue par les exemples actuels de la documentation.

Et qu'en est-il de l'ordre ? On pourrait penser que `*` doit impérativement figurer à la fin pour ne pas « avaler » les autres. Ce n'est pas nécessaire : React Router ne teste pas les routes dans l'ordre où tu les as écrites, mais les **classe** selon leur degré de spécificité : un segment fixe l'emporte sur un dynamique, et un dynamique l'emporte sur `*`. La page de la documentation censée détailler cet algorithme, [« Route Matching »](https://reactrouter.com/explanation/route-matching), est vide dans cette version (consultée le 21 octobre 2026) ; nous l'avons donc vérifié manuellement : à l'aide de la fonction `matchRoutes` de `react-router` et de trois routes déclarées dans l'ordre inverse (`*`, puis `servicios/:nombre`, puis `servicios/nuevo`), `/servicios/nuevo` a bien choisi la fixe, `/servicios/pagos` la dynamique et `/otra` le caractère générique. Malgré tout, le cours les ordonne de la plus spécifique à la moins spécifique, car c'est plus lisible. La Leçon 7 placera d'ailleurs `servicios/nuevo` juste avant `servicios/:nombre` pour cette même raison.

La première figure vérifie ces quatre règles sans navigateur. Elle construit un arbre de routes identique en forme à celui du `revisor`, avec des composants qui indiquent simplement ce qu'ils sont, et l'affiche à l'aide de `createMemoryRouter`, le pendant de `createBrowserRouter` qui conserve l'adresse en mémoire au lieu de la lire dans la barre d'adresse du navigateur :

```tsx
// fig05_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, Outlet, useLocation, useParams, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Disposicion() {
  return (
    <>
      [disposición] <Outlet />
    </>
  );
}

function Reporte() {
  return <>reporte</>;
}

function Servicio() {
  const { nombre } = useParams();
  return <>servicio «{nombre}»</>;
}

function NoEncontrada() {
  return <>no existe {useLocation().pathname}</>;
}

const rutas: RouteObject[] = [
  {
    path: "/",
    Component: Disposicion,
    children: [
      { index: true, Component: Reporte },
      { path: "servicios/:nombre", Component: Servicio },
      { path: "*", Component: NoEncontrada },
    ],
  },
];

for (const direccion of ["/", "/servicios/pagos", "/servicios/cat%C3%A1logo", "/servicios", "/servicios/pagos/extra"]) {
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`${direccion.padEnd(26)} → ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_01.tsx
$ node fig05_01.js
/                          → [disposición] reporte
/servicios/pagos           → [disposición] servicio «pagos»
/servicios/cat%C3%A1logo   → [disposición] servicio «catálogo»
/servicios                 → [disposición] no existe /servicios
/servicios/pagos/extra     → [disposición] no existe /servicios/pagos/extra
```

Cinq adresses, cinq réponses, et sur les cinq apparaît `[disposición]` : tant que rien ne casse, la route extérieure est rendue dans tous les cas. La troisième ligne donne un avant-goût de 5.2 : l'adresse contenait `cat%C3%A1logo`, sous forme encodée, et le paramètre est parvenu décodé sous la forme `catálogo`. Les deux dernières lignes montrent qu'un segment dynamique correspond à **exactement un segment** : `/servicios` (il en manque un) et `/servicios/pagos/extra` (il y en a un de trop) ne correspondent pas à `servicios/:nombre`, et sont interceptés par `*`.

#### 5.1.3 Créer le routeur une seule fois, en dehors de React

Le point d'entrée change peu. `Panel` disparaît de `main.tsx` pour laisser la place au routeur :

```tsx
// revisor/src/main.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { rutas } from "./app/rutas";
import { LimiteDeError } from "./compartido/LimiteDeError";
import { crearClienteConsultas } from "./consultas/cliente";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

const clienteConsultas = crearClienteConsultas();
const enrutador = createBrowserRouter(rutas);

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <QueryClientProvider client={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
```

Deux détails sont essentiels. Le premier : **`createBrowserRouter(rutas)` est appelé une seule fois, au chargement du module, en dehors de tout composant.** La documentation est explicite : les routeurs de données ne sont pas conservés dans l'état de React ; ils sont créés une fois en dehors de l'arbre et transmis à `<RouterProvider>` ([React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)). Si tu le créais à l'intérieur d'un composant, chaque rendu de celui-ci recréerait un routeur neuf, qui repartirait de zéro. C'est le même principe que celui appliqué dans la Leçon 0 avec `cargarReporte` : ce qui doit rester invariant se déclare au niveau du module. Et remarque d'où provient chaque pièce : `createBrowserRouter` depuis `react-router`, et `RouterProvider` depuis `react-router/dom`, comme le prescrit le guide d'installation du mode de données ([React Router, « Installation »](https://reactrouter.com/start/data/installation)).

Le second détail concerne **l'ordre des composants enveloppants**. Le cache de TanStack Query vit dans l'objet `clienteConsultas`, créé une unique fois par `main.tsx` ; `QueryClientProvider` se contente de le mettre à disposition des composants situés sous lui. En le plaçant **à l'extérieur** de `RouterProvider`, toutes les pages peuvent y accéder : lorsque tu passes de la liste au détail, `PaginaReporte` est démonté, mais le rapport reste dans le cache, et au retour la liste peut s'afficher avec ces données pendant que Query vérifie s'il est nécessaire de les redemander (ce que la Leçon 4 a nommé `staleTime`). Si tu plaçais le fournisseur à l'intérieur de `PaginaReporte`, `PaginaServicio` se retrouverait sans client et son `useQuery` lèverait une erreur. Et si, en plus, tu créais le client à l'intérieur de la page, le cache disparaîtrait à chaque fois que la page est démontée.

Que signifie « afficher avec le routeur du navigateur » ? `createBrowserRouter` modifie l'adresse à l'aide de `history.pushState` et `history.replaceState`, deux fonctions du navigateur qui changent ce qui s'affiche dans la barre d'adresse **sans rien demander au serveur**. MDN l'exprime ainsi à propos de `pushState` : le navigateur n'essaiera pas de charger cette adresse après l'appel, bien qu'il puisse tenter de la charger plus tard, par exemple après un redémarrage ([MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)). Retiens bien cette phrase, « puisse tenter de la charger plus tard », car toute la section 5.3 y est consacrée.

#### 5.1.4 La disposition et l'`<Outlet />`

La disposition est le composant de la route extérieure. Elle affiche ce qui ne change pas d'une page à l'autre et réserve un emplacement pour ce qui varie :

```tsx
// revisor/src/app/Disposicion.tsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});

  const contexto: ContextoNotas = {
    notas,
    guardarNota: (nombre, texto) => establecerNotas((actuales) => conNota(actuales, nombre, texto)),
  };

  return (
    <>
      <header>
        <h1>Revisor</h1>
        <nav aria-label="Principal">
          <NavLink to="/" end>
            Reporte
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
```

Le `<Outlet />` est cet emplacement réservé. Lorsque l'adresse est `/`, `PaginaReporte` s'y affiche ; lorsqu'elle est `/servicios/pagos`, c'est `PaginaServicio`. L'en-tête et la navigation ne sont pas remontés lors d'un changement de page : ils restent les mêmes composants, avec le même état. Et c'est précisément ce que l'on met à profit pour les notes.

Dans la Leçon 2, les notes vivaient dans `Panel`, aux côtés de la liste et du détail, car les deux en avaient besoin. Désormais, la liste et le détail sont des **pages distinctes**, et lorsque tu navigues de l'une à l'autre, la première est démontée. Si les notes restaient dans `PaginaReporte`, tu écrirais une note dans le détail de `pagos`, tu reviendrais à la liste et l'indication « con nota » aurait disparu, car l'état de la liste aurait été détruit en partant et recréé vide au retour. La règle de la Leçon 2 reste pleinement valable, avec simplement un cran de plus : **l'état remonte jusqu'à l'ancêtre commun le plus proche de ceux qui l'utilisent**, et l'ancêtre commun des deux pages est la disposition.

Pour transmettre la valeur aux pages descendantes, `<Outlet>` accepte une propriété `context`, et les pages la lisent avec le hook `useOutletContext`. La documentation le présente exactement pour ce cas : les routes parentes gèrent souvent un état qu'elles souhaitent partager avec leurs enfants, et ce besoin est si fréquent qu'il est directement intégré dans `<Outlet>`, sans que tu aies besoin de concevoir ton propre contexte ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)). La même page recommande, avec TypeScript, que le parent fournisse **son propre hook** pour le lire, afin que les consommateurs disposent du bon typage et que l'on sache clairement qui s'en sert. C'est l'objet de `contextoNotas.ts` :

```ts
// revisor/src/app/contextoNotas.ts
import { useOutletContext } from "react-router";
import type { Notas } from "../reporte/notas";

export interface ContextoNotas {
  readonly notas: Notas;
  readonly guardarNota: (nombre: string, texto: string) => void;
}

export function useNotas(): ContextoNotas {
  return useOutletContext<ContextoNotas>();
}
```

`useNotas()` est le seul endroit du code qui appelle `useOutletContext`, et le seul qui indique à TypeScript la structure de cette valeur. Les pages importent `useNotas` sans avoir à savoir d'où proviennent les notes. Si, dans la Leçon 6, les notes devaient changer d'emplacement, seul ce fichier serait modifié.

Soyons honnêtes au sujet de `Disposicion` : l'objet `contexto` et la fonction `guardarNota` sont recréés à chaque rendu. Cela signifie qu'à chaque fois que la disposition effectue un nouveau rendu, la page qui consomme le contexte en fait un également. Ce n'est pas un problème mesuré ici, et le cours ne mémoïse pas sans une mesure préalable qui le justifie ; la Leçon 9 montre comment le mesurer.

#### 5.1.5 La page « non trouvée »

La route `*` affiche cette page :

```tsx
// revisor/src/app/PaginaNoEncontrada.tsx
import { Link, useLocation } from "react-router";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";

export function PaginaNoEncontrada() {
  const { pathname } = useLocation();
  useTituloDocumento("Página no encontrada · Revisor");

  return (
    <Tarjeta titulo="Página no encontrada">
      <p>No existe ninguna página en {pathname}.</p>
      <p>
        <Link to="/">Ir al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

`useLocation()` fournit l'adresse courante ; seul son `pathname` nous intéresse ici, pour indiquer à l'utilisateur quelle adresse n'existe pas. La page est rendue **à l'intérieur** de la disposition, de sorte que l'en-tête et la navigation restent présents : la personne dispose d'un moyen pour repartir. Et elle définit son propre titre d'onglet grâce au hook de la Leçon 3. Voici ce que Chrome a retourné pour `/no-existe` :

```text
<title>Página no encontrada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Página no encontrada"><h2>Página no encontrada</h2><p>No existe ninguna página en /no-existe.</p><p><a href="/" data-discover="true">Ir al reporte</a></p></section></main></div>
```

#### 5.1.6 Quand une page plante : le périmètre d'erreur des routes

Il existe une autre catégorie de « page qui ne fonctionne pas », qu'il convient de bien distinguer de la précédente : celle qui **existe** mais lève une erreur lors de son rendu. Dans la Leçon 4, tu as écrit `LimiteDeError` précisément pour cela : elle enveloppait `Panel`, et si un problème survenait lors du rendu, un avertissement avec le message et un bouton de rechargement apparaissait au lieu d'un écran blanc. Dans `main.tsx`, elle est toujours là, désormais autour de `RouterProvider`. On pourrait penser que rien n'a changé. Pourtant, tout a changé, et la seule manière d'en être convaincu est de le constater par soi-même.

Pour cela, il nous faut une page qui plante. Dans une **copie** du point de contrôle, jamais sur l'original, ajoute dans `PaginaReporte`, immédiatement après `useTituloDocumento`, une erreur déclenchée depuis l'adresse :

```tsx
// en una copia: revisor/src/reporte/PaginaReporte.tsx (fragmento)
  if (filtros.texto === "romper") {
    throw new Error("la página se rompió al dibujar");
  }
```

Elle se place après les hooks, et non en première ligne du composant, pour une raison que tu connais déjà : avec un `throw` avant `useQuery`, les hooks situés en dessous ne seraient appelés que « par intermittence », et `react-hooks/rules-of-hooks` le refuserait en signalant une erreur par hook (mesuré : quatre erreurs). Avec `npm run build`, le serveur d'exercice et `npm run preview` en marche, ouvre `http://localhost:4173/?q=romper`. Voici ce que Chrome a retourné avec le code que possédait le `revisor` avant cette section (la trace d'exécution de l'erreur, dix lignes avec les chemins locaux de la machine, est tronquée par `…`) :

```text
<title>Revisor</title>
<div id="raiz"><h2>Unexpected Application Error!</h2><h3 style="font-style: italic;">la página se rompió al dibujar</h3><pre style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);">Error: la página se rompió al dibujar
    at …</pre></div>
```

Pas la moindre trace de `LimiteDeError` : ni son `role="alert"`, ni « Algo salió mal al dibujar el panel », ni le bouton pour recharger. À la place, une page en anglais, avec la trace d'erreur exposée aux yeux de tous, que ton code n'a jamais produite. Et avec elle ont disparu l'en-tête et la navigation. C'est exactement ce que verrait la personne d'astreinte de notre scène d'ouverture, à 23 h 10, si le panneau comportait une anomalie.

La raison : React Router positionne **son propre périmètre d'erreur sur chaque route**. Lorsqu'une page lève une exception, React remonte l'arbre à la recherche du périmètre le plus proche, et le plus proche n'est plus `LimiteDeError` : c'est celui de React Router, intercalé entre ton périmètre et la page. La documentation l'explique ainsi : les erreurs survenues dans une route sont automatiquement capturées et le `ErrorBoundary` le plus proche est alors affiché ; si une route n'a pas le sien, l'erreur remonte à la route parente ([React Router, « Error Boundaries »](https://reactrouter.com/how-to/error-boundary)). Si aucune route n'en déclare un, React Router affiche celui par défaut, qui correspond précisément à ce que tu viens de voir. L'erreur n'atteint jamais `LimiteDeError`, car elle a été interceptée avant.

La figure 6 reproduit les deux situations sans navigateur, avec une disposition minimale et une page qui lève une exception. D'abord sans périmètre dédié, puis avec un périmètre sur la route racine qui lit l'erreur à l'aide de `useRouteError` :

```tsx
// fig05_06.tsx
import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { createMemoryRouter, Outlet, useRouteError, type RouteObject } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola se esperan; aquí solo se cuentan.
let avisosDeConsola = 0;
console.error = () => {
  avisosDeConsola += 1;
};

function Disposicion() {
  return (
    <>
      <header>
        <h1>Revisor</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

function PaginaRota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

function ErrorDeRuta() {
  const error = useRouteError();

  return (
    <div role="alert" className="limite-de-error">
      <h2>Algo salió mal al dibujar el panel</h2>
      <p>{error instanceof Error ? error.message : "error desconocido"}</p>
    </div>
  );
}

async function dibujar(titulo: string, raizDeRutas: RouteObject): Promise<void> {
  console.log(titulo);
  avisosDeConsola = 0;
  const enrutador = createMemoryRouter([raizDeRutas]);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla:    ${copia.textContent}`);
  console.log(`  encabezado:  ${copia.querySelector("header") === null ? "no está" : "está"}`);
  console.log(`  role=alert:  ${copia.querySelector('[role="alert"]') === null ? "no está" : "está"}`);
  console.log(`  avisos de consola: ${avisosDeConsola}`);
  await act(async () => {
    raiz.unmount();
  });
}

const hijas: RouteObject[] = [{ index: true, Component: PaginaRota }];

await dibujar("1. sin ErrorBoundary:", { path: "/", Component: Disposicion, children: hijas });
await dibujar("2. con ErrorBoundary en la ruta raíz:", {
  path: "/",
  Component: Disposicion,
  ErrorBoundary: ErrorDeRuta,
  children: hijas,
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_06.tsx
$ node fig05_06.js
1. sin ErrorBoundary:
  pantalla:    Unexpected Application Error!la página se rompió al dibujar
  encabezado:  no está
  role=alert:  no está
  avisos de consola: 2
2. con ErrorBoundary en la ruta raíz:
  pantalla:    Algo salió mal al dibujar el panella página se rompió al dibujar
  encabezado:  no está
  role=alert:  está
  avisos de consola: 2
```

Trois constats se dégagent de cette exécution. Sans périmètre dédié, l'écran affiche `Unexpected Application Error!` sans aucun `role="alert"` : un lecteur d'écran n'annonce rien du tout. Avec le périmètre sur la racine, ton message s'affiche bien, avec son `role="alert"`. Et dans les deux cas, **l'en-tête est absent**, car le périmètre d'erreur d'une route s'affiche **à la place** de ce que cette route aurait dû afficher, et ici la route dotée du périmètre est la route extérieure, celle qui effectue le rendu de la disposition. (Les deux messages d'avertissement dans la console apparaissent dans les deux cas : capturer une erreur ne la masque pas au développeur.)

La solution consiste à déclarer ce périmètre. La documentation demande d'ailleurs que toute application en possède au moins une sur la route racine. Dans le mode de données, elle se déclare avec la propriété `ErrorBoundary` de l'objet de route, et le composant accède à l'erreur via `useRouteError()`, puisqu'il ne reçoit pas de props. Il existe également `errorElement`, qui accepte un élément déjà instancié ; c'est la même nuance qu'entre `Component` et `element`, et le cours utilise `ErrorBoundary` pour la même raison qu'il emploie `Component`.

Et que doit-elle afficher ? Ce qui est idiomatique dans le `revisor`, c'est d'afficher **le même avertissement** que `LimiteDeError`. Pour la personne qui utilise le panneau, « un problème est survenu lors de l'affichage » signifie la même chose quelle qu'en soit la source, et deux messages distincts pour la même réalité représenteraient deux éléments à maintenir. Pour éviter de dupliquer ce balisage, la présentation est extraite de la classe pour devenir un composant dédié :

```tsx
// revisor/src/compartido/AvisoDeError.tsx
// Lo que ve la persona cuando algo se rompe al dibujar. Lo comparten los dos
// límites del revisor: LimiteDeError, afuera del enrutador, y ErrorDeRuta,
// dentro de él.
export function AvisoDeError({ mensaje }: { readonly mensaje: string }) {
  return (
    <div role="alert" className="limite-de-error">
      <h2>Algo salió mal al dibujar el panel</h2>
      <p>{mensaje}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Recargar la página
      </button>
    </div>
  );
}
```

`LimiteDeError` conserve la même fonction que dans la Leçon 4 ; elle délègue simplement le rendu visuel :

```tsx
// revisor/src/compartido/LimiteDeError.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AvisoDeError } from "./AvisoDeError";

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
      return <AvisoDeError mensaje={this.state.error.message} />;
    }

    return this.props.children;
  }
}
```

Et voici le périmètre d'erreur des routes :

```tsx
// revisor/src/app/ErrorDeRuta.tsx
import { isRouteErrorResponse, useRouteError } from "react-router";
import { AvisoDeError } from "../compartido/AvisoDeError";

// React Router atrapa los errores de sus rutas antes de que lleguen a
// LimiteDeError. Este es el límite que dibuja en su lugar: el mismo aviso.
export function ErrorDeRuta() {
  const error = useRouteError();

  return <AvisoDeError mensaje={describirError(error)} />;
}

// En JavaScript se puede lanzar cualquier cosa, no solo un Error.
function describirError(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "error desconocido";
}
```

`useRouteError` renvoie la valeur qui a été levée, et son type est `unknown` et non `Error`, car en JavaScript on peut lever n'importe quoi : une chaîne de caractères, un nombre, un objet. C'est pourquoi `describirError` teste le type avant d'accéder aux propriétés. La documentation distingue trois cas et `describirError` les examine dans cet ordre : une réponse d'erreur de React Router, identifiable avec `isRouteErrorResponse` et comportant `status` et `statusText` (levée par les *loaders* et les *actions* ; le `revisor` ne les utilise pas, donc aucune n'arrive aujourd'hui, mais la prendre en charge ne coûte que trois lignes) ; une instance d'`Error`, avec sa propriété `message` ; et toute autre valeur. Remarque que `ErrorDeRuta` est un composant **fonctionnel** : l'unique classe du cours demeure `LimiteDeError`, car React Router a déjà implémenté la classe pour toi et ne te demande que ce qui doit être rendu.

La dernière étape consiste à la raccorder : la ligne `ErrorBoundary: ErrorDeRuta` dans `rutas.tsx`, que tu as déjà vue en 5.1.2. Grâce à elle, la même copie réexécutée a fourni ceci sur `/?q=romper` :

```text
<title>Revisor</title>
<div id="raiz"><div role="alert" class="limite-de-error"><h2>Algo salió mal al dibujar el panel</h2><p>la página se rompió al dibujar</p><button type="button">Recargar la página</button></div></div>
```

C'est l'avertissement de la Leçon 4, mot pour mot, avec son `role="alert"` et son bouton. Et sur cette même copie, `/?q=pag` a continué d'afficher la liste avec son en-tête : le périmètre n'intervient que si un plantage survient. Deux détails supplémentaires méritent d'être soulignés. Le titre de l'onglet est resté bloqué sur `Revisor`, celui de `index.html` : la page en erreur n'a jamais achevé son rendu, et son Effect dans `useTituloDocumento` n'a jamais pu s'exécuter. De plus, l'en-tête a disparu, exactement comme dans la figure 6 : ce périmètre est le filet de sécurité ultime, celui qui remplace l'ensemble de l'écran. Une conséquence qu'il vaut mieux voir avant qu'elle ne te surprenne : ici, l'erreur est provoquée par l'adresse elle-même (`?q=romper`), donc le bouton « Recargar la página » rouvre cette même adresse, lève de nouveau l'exception et affiche de nouveau l'avertissement ; recharger n'est pas une issue. Comme l'en-tête n'est plus là, il n'y a pas non plus de lien à portée de main, et la personne doit modifier l'adresse manuellement. C'est une limitation réelle de ce périmètre de racine et une raison de plus pour l'exercice 3, où le périmètre le plus proche laisse visible le lien « Volver al reporte ». Si tu souhaites que l'utilisateur conserve l'en-tête et la navigation lorsqu'**une seule** page plante, le périmètre doit être placé plus en profondeur dans l'arborescence ; c'est l'objet de l'exercice 3.

`LimiteDeError` est-elle donc superflue ? Non. Les périmètres d'erreur des routes ne voient que ce qui est rendu **à l'intérieur** des routes. Tout ce qui se situe en dehors, comme `QueryClientProvider`, échappe à leur champ d'action, et c'est la raison pour laquelle `LimiteDeError` reste en place dans `main.tsx`. Chacune surveille son propre périmètre, et toutes deux présentent le même avertissement.


### 5.2 Paramètres et recherche : l'adresse comme état

Une adresse se compose de plusieurs parties, et React Router en fournit deux sous forme de données. Dans `http://localhost:5173/servicios/pagos`, la partie déterminante est le **chemin** (`/servicios/pagos`), et le segment dynamique se lit avec `useParams`. Dans `http://localhost:5173/?fallas=1&q=pag`, le chemin est `/` et ce qui suit le `?` constitue la **chaîne de recherche** (*query string*), qui se lit avec `useSearchParams`. Toutes deux sont de l'état : elles déterminent ce qui est affiché, et les modifier revient à naviguer.

#### 5.2.1 Le paramètre de route : `useParams`

Le détail d'un service cesse d'être un panneau situé sous la liste pour devenir une page à part entière. `PanelDetalle` disparaît, et `PaginaServicio` prend sa place :

```tsx
// revisor/src/detalle/PaginaServicio.tsx
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { useNotas } from "../app/contextoNotas";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { EditorNota } from "../reporte/EditorNota";
import { consultaDetalle } from "./consultas";
import { useReintentar } from "./useReintentar";

export function PaginaServicio() {
  const { nombre = "" } = useParams();
  const consulta = useQuery(consultaDetalle(nombre));
  const reintento = useReintentar(nombre);
  const { notas, guardarNota } = useNotas();
  useTituloDocumento(`${nombre} · Revisor`);

  return (
    <Tarjeta titulo={`Servicio ${nombre}`}>
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
        <>
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
          <button type="button" disabled={reintento.isPending} onClick={() => reintento.mutate()}>
            {reintento.isPending ? "Revisando…" : "Volver a revisar"}
          </button>
          {reintento.isError && (
            <p role="alert">No se pudo volver a revisar: {reintento.error.message}</p>
          )}
          <EditorNota
            key={nombre}
            nombre={nombre}
            notaGuardada={notas[nombre] ?? ""}
            alGuardar={guardarNota}
          />
        </>
      )}
      <p>
        <Link to="/">Volver al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

La première ligne du composant est celle qu'il importe le plus de bien saisir : `const { nombre = "" } = useParams();`. `useParams` renvoie les segments dynamiques de l'adresse sous la forme d'un objet ; ici, `{ nombre: "pagos" }` ([React Router, `useParams`](https://reactrouter.com/api/hooks/useParams)). Son typage indique que chaque valeur est de type `string | undefined`, et ce n'est pas un excès de prudence de TypeScript : le hook ignore dans quelle route tu l'appelles, et un composant pourrait très bien être employé dans une route dépourvue de `:nombre`. L'affectation par défaut `= ""` lui confère une valeur de secours afin que le reste du composant manipule un type `string`. Dans la section « L'erreur que tu vas voir », tu la supprimeras pour observer les quatre erreurs qui apparaissent alors. En pratique, cette page n'est rendue que sous `servicios/:nombre`, si bien que `nombre` n'arrive jamais vide.

Munie de ce nom, la page réalise ce que faisait `PanelDetalle` : elle demande le détail à l'aide de la même requête que dans la Leçon 4, `consultaDetalle(nombre)`, dont la clé `["servicio", nombre]` isole le cache propre à chaque service, et propose la mutation « Volver a revisar ». La nouveauté réside dans ce qui n'est plus nécessaire. Dans la Leçon 4, `ContenidoReporte` vérifiait que le service sélectionné figurait bien dans la liste avant d'afficher son panneau. Un élément du bloc de données vient de la Leçon 4 et il ne faut pas le perdre : la page affiche le détail s'il y a des `data`, et pas seulement si `isSuccess`, car lorsqu'une mise à jour échoue, `status` passe à `error` et `data` est toujours là ; avec `isSuccess`, l'ancien détail et, pire, l'`EditorNota` avec le brouillon que la personne était en train d'écrire disparaîtraient de l'écran juste au moment où le réseau trébuche. Désormais, n'importe qui peut saisir `/servicios/nada` dans la barre d'adresse, et la page ne dispose d'aucune liste préalable pour effectuer cette vérification. Ce n'est pas gênant : l'API renvoie un code 404 pour un service qui n'existe pas, `cargarDetalle` le convertit en erreur, et la page affiche l'alerte. Voici ce que Chrome a rendu :

```text
<title>nada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio nada"><h2>Servicio nada</h2><p role="alert">No se pudo cargar el detalle: la API respondió 404</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Et voici ce qu'a consigné le journal du serveur d'exercice :

```text
08:15:01.057 GET /api/servicios/nada 404
08:15:01.263 GET /api/servicios/nada 404
08:15:01.468 GET /api/servicios/nada 404
```

Trois requêtes pour une seule visite. Ce n'est pas le fait de `StrictMode`, car il s'agit ici de la version construite pour la production, où aucun cycle de rendu supplémentaire n'a lieu : c'est l'effet du paramètre `retry: 2` configuré dans le client de requêtes lors de la Leçon 4, qui réessaie face à **n'importe quelle** erreur, y compris un 404 qui ne changera jamais. (Les horodatages sont très resserrés en raison de l'horloge accélérée de Chrome ; avec un navigateur ordinaire, les tentatives arrivent de façon espacée.) C'est un comportement que l'on peut affiner — en ne réessayant que lorsque l'erreur le justifie —, mais ce n'est pas le sujet de cette leçon ; note-le simplement dans ton journal de bord comme une observation faite en passant.

#### 5.2.2 Encoder à l'écriture, décoder à la lecture

Le nom du service `catálogo` comporte un `á`. Dans une adresse web, les caractères ne faisant pas partie d'un jeu restreint voyagent **encodés par pourcentage** (*percent-encoding*) : le `á` est représenté par deux octets en UTF-8, transcrits sous la forme `%C3%A1`. Celui qui compose l'adresse encode ; celui qui la lit décode. Dans le `revisor`, trois étapes se succèdent :

1. `FilaEstado` construit le lien à l'aide de `encodeURIComponent(estado.nombre)`, qui transforme `catálogo` en `cat%C3%A1logo`. On emploie `encodeURIComponent` et non `encodeURI` car il encode également les caractères dotés d'une signification propre dans une adresse, tels que `/`, `?` et `#` ([MDN, `encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)). Si un jour un service s'appelait `a/b`, l'adresse sans encodage deviendrait `/servicios/a/b`, ce qui constituerait un tout autre chemin et aboutirait sur la page « non trouvée ».
2. `useParams` fournit le paramètre **déjà décodé**. Tu as pu le constater dans la figure 1 : `cat%C3%A1logo` est parvenu sous la forme `catálogo`. La documentation du hook ne le formule pas explicitement ainsi ; c'est l'exécution du code qui le prouve, et c'est la raison d'être de cette figure.
3. `cargarDetalle`, dès la Leçon 3, réencode le nom pour le demander à l'API. Le journal du serveur le confirme : `GET /api/servicios/cat%C3%A1logo 200`.

Encoder deux fois de suite constituerait une erreur (`%C3` deviendrait `%25C3`), et ne jamais encoder en serait une autre. La règle est limpide : **le texte qui voyage à l'intérieur d'une adresse est encodé au moment précis où on l'y insère et décodé au moment précis où on l'en extrait**, et partout entre les deux, on manipule le texte normal. Voici ce que Chrome a affiché à l'ouverture de `/servicios/cat%C3%A1logo` :

```text
<title>catálogo · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio catálogo"><h2>Servicio catálogo</h2><dl><dt>Estado</dt><dd>Disponible: HTTP 200 en 42 ms</dd><dt>Revisiones</dt><dd>2</dd><dt>Última revisión</dt><dd>2026-10-21T08:14:55.465Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre catálogo<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

#### 5.2.3 La même page, un autre paramètre : pourquoi `key={nombre}`

Dans la Leçon 3, `<PanelDetalle key={seleccionado}>` réinitialisait l'ensemble du panneau lors d'un changement de service. Dans `PaginaServicio`, la `key` se situe plus bas dans l'arbre, sur `<EditorNota key={nombre}>`. Est-elle vraiment nécessaire ? Pour y répondre, il faut comprendre le comportement de React Router lorsque l'adresse bascule de `/servicios/pagos` à `/servicios/inventario` : **la route est identique** (`servicios/:nombre`), par conséquent le composant chargé de son affichage est rigoureusement le même, au même emplacement dans l'arbre. React ne voit pas une nouvelle page ; il voit la même `PaginaServicio` avec un paramètre différent. Et la documentation de React est sans équivoque sur ce point : un même composant conservé au même emplacement dans l'arborescence préserve son état interne ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)).

La figure 2 le met en évidence avec un composant qui, à l'image d'`EditorNota`, initialise son état à partir d'une prop. Elle navigue de `pagos` à `inventario` à deux reprises : sans `key`, puis avec elle.

```tsx
// fig05_02.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Borrador({ nombre }: { readonly nombre: string }) {
  // El estado inicial solo se usa la PRIMERA vez que se monta el componente.
  const [borrador] = useState(`nota sobre ${nombre}`);
  return <>dirección: {nombre} · borrador: {borrador}</>;
}

function SinKey() {
  const { nombre = "" } = useParams();
  return <Borrador nombre={nombre} />;
}

function ConKey() {
  const { nombre = "" } = useParams();
  return <Borrador key={nombre} nombre={nombre} />;
}

async function recorrer(titulo: string, Pagina: ComponentType): Promise<void> {
  console.log(titulo);
  const enrutador = createMemoryRouter([{ path: "/servicios/:nombre", Component: Pagina }], {
    initialEntries: ["/servicios/pagos"],
  });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    await enrutador.navigate("/servicios/inventario");
  });
  console.log(`  ${contenedor.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await recorrer("sin key:", SinKey);
await recorrer("con key={nombre}:", ConKey);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_02.tsx
$ node fig05_02.js
sin key:
  dirección: pagos · borrador: nota sobre pagos
  dirección: inventario · borrador: nota sobre pagos
con key={nombre}:
  dirección: pagos · borrador: nota sobre pagos
  dirección: inventario · borrador: nota sobre inventario
```

Sans `key`, l'adresse indique bien `inventario`, mais le brouillon continue de mentionner `pagos` : `useState` n'utilise sa valeur initiale que la toute première fois où le composant est monté, et ici, il n'a jamais été remonté. Avec `key={nombre}`, React traite chaque nom distinct comme un composant différent, détruit l'ancien et en crée un nouveau. Dans le `revisor`, sans cette `key`, le brouillon de la note rédigée pour `pagos` subsisterait sur la page d'`inventario`, prêt à être enregistré par erreur sur le mauvais service.

Et pourquoi la `key` est-elle posée sur `EditorNota` plutôt que sur la page tout entière ? Parce que l'état qui ferait le plus de dégâts est le brouillon, celui que la personne a écrit à la main. La requête de détail n'a nul besoin d'être réinitialisée : sa clé de requête intègre le nom du service, si bien qu'en changeant de nom, TanStack Query bascule automatiquement d'entrée dans le cache. Il existe un second état propre que la `key` de `EditorNota` ne couvre pas : celui de la mutation `useReintentar`, qui vit dans `PaginaServicio` et conserve son `isError`, son `error` et son `isPending` tant que le composant reste le même. Si un jour un lien menait d'un détail à un autre et que la mutation du premier avait échoué, l'avertissement « No se pudo volver a revisar » resterait à l'écran sous le second service. La solution consiste à déplacer la `key` sur la route (`key={nombre}` sur `PaginaServicio`, ce qui réinitialise tout) ou à appeler `reintento.reset()` quand le nom change ([TanStack Query, `useMutation`](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)). Et pour être tout à fait honnête, l'interface actuelle du `revisor` n'offre pas de passage direct d'un détail à un autre : on repasse systématiquement par la liste, ce qui démonte la page. La `key` constitue une protection pour le jour où quelqu'un ajoutera un lien « service suivant », et son coût est si dérisoire qu'il serait absurde d'attendre ce jour-là pour la mettre en place.

#### 5.2.4 Les filtres dans la recherche : `useSearchParams`

Les filtres représentent le cas d'école par excellence de l'« état qui doit résider dans l'adresse » : ils décrivent ce que tu es en train d'examiner, et quelqu'un d'autre voudra consulter exactement la même chose. Le plan du cours les insère dans la chaîne de recherche sous forme de deux paramètres : `fallas=1` pour « Solo fallas » et `q=texto` pour « Buscar por nombre ». Voyons d'abord le type et la fonction pure effectuant le filtrage, dans `resumen.ts` :

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

`Filtros` réunit les deux critères dans un objet, et `filtrarEstados` applique les deux simultanément : un service est retenu s'il respecte la condition « uniquement les pannes » (ou si ce filtre est désactivé) **et** si son nom contient le texte recherché (ou si aucune recherche n'est saisie). La recherche fait abstraction des majuscules et des espaces aux extrémités, et applique `toLocaleLowerCase("es-MX")` pour que la comparaison respecte les règles de la langue. Il s'agit d'une fonction pure : mêmes entrées, même sortie, et la Leçon 8 la testera en isolation complète de React.

Voici maintenant la nouvelle brique, le hook assurant la traduction entre l'adresse et les filtres :

```ts
// revisor/src/reporte/filtrosEnUrl.ts
import { useSearchParams } from "react-router";
import type { Filtros } from "./resumen";

export function useFiltrosEnUrl(): {
  readonly filtros: Filtros;
  readonly cambiarFiltros: (cambio: Partial<Filtros>) => void;
} {
  const [parametros, establecerParametros] = useSearchParams();
  const filtros: Filtros = {
    soloFallas: parametros.get("fallas") === "1",
    texto: parametros.get("q") ?? "",
  };

  function cambiarFiltros(cambio: Partial<Filtros>): void {
    const siguientes = { ...filtros, ...cambio };

    establecerParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales);

        if (siguientes.soloFallas) {
          nuevos.set("fallas", "1");
        } else {
          nuevos.delete("fallas");
        }

        if (siguientes.texto === "") {
          nuevos.delete("q");
        } else {
          nuevos.set("q", siguientes.texto);
        }

        return nuevos;
      },
      { replace: true },
    );
  }

  return { filtros, cambiarFiltros };
}
```

`useSearchParams` renvoie deux éléments, à l'instar de `useState` : les paramètres actuels, sous forme d'un objet `URLSearchParams` standard du navigateur, et une fonction permettant de les modifier, qui **déclenche une navigation** vers la nouvelle adresse ([React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)). `URLSearchParams` est une interface web standard dotée de méthodes de lecture et d'écriture de la chaîne de recherche ; sa méthode `get` renvoie `null` lorsque le paramètre est absent ([MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)). Cinq partis pris dans ce fichier méritent d'être explicités :

- **Les filtres sont calculés, non stockés.** Il n'y a aucun `useState` pour les filtres qui viendrait se « synchroniser » avec l'adresse : chaque rendu les lit directement depuis celle-ci. C'est la règle de la Leçon 2, « ne stocke pas ce que tu peux calculer », appliquée à une nouvelle source de vérité. L'existence d'un `useState` en doublon de l'adresse créerait deux vérités susceptibles de diverger, et la tentation de les maintenir alignées via un Effect, ce que le tout premier principe du cours proscrit formellement.
- **`fallas` vaut `"1"` ou n'existe pas.** La lecture s'écrit `parametros.get("fallas") === "1"` : toute autre valeur, y compris un `?fallas=0` écrit à la main, est lue comme un filtre désactivé. Et la désactivation du filtre **supprime** le paramètre au lieu d'inscrire `fallas=0`. Il en va de même pour un `q` vide. Ainsi, l'adresse par défaut reste `/`, propre et nette, plutôt que `/?fallas=0&q=`.
- **La fonction de mise à jour ne reçoit que la partie modifiée.** `cambiarFiltros({ soloFallas: true })` ne touche pas au texte, car `{ ...filtros, ...cambio }` fusionne la modification avec l'existant. C'est pourquoi le type attendu est `Partial<Filtros>`.
- **On effectue une copie plutôt qu'une mutation directe.** La variante avec fonction, `establecerParametros((actuales) => …)`, reçoit les paramètres courants ; le code en produit une copie via `new URLSearchParams(actuales)` et modifie cette copie. La documentation prévient que l'objet fourni par le hook est mutable, et que si tu le modifies directement sans invoquer la fonction de mise à jour, ses valeurs changeront d'un rendu à l'autre sans que l'adresse ne le répercute. La copie évite ce piège tout en préservant tout autre paramètre éventuel déjà présent dans l'adresse. Cette même page signale une autre différence avec `useState` : deux appels consécutifs dans le même instant logique **ne s'enchaînent pas** comme le ferait la forme fonctionnelle de mise à jour de React. Dans le `revisor`, chaque événement ne déclenche qu'un unique appel, donc ce piège ne nous concerne pas.
- **`replace: true`.** C'est le choix qui se remarque le plus à l'usage, et il bénéficie de sa propre figure explicative.

#### 5.2.5 `replace: true` : écrire dans l'adresse sans encombrer l'historique

Chaque fois que l'adresse est modifiée avec `pushState`, le navigateur ajoute une nouvelle entrée dans son historique, et le bouton « Retour » ramène à la précédente. Pour passer de la liste au détail, c'est exactement le comportement attendu. Pour un champ de recherche, c'est l'inverse : chaque caractère tapé modifie `q`, et si chaque frappe créait une entrée dans l'historique, taper le mot `pagos` en créerait cinq de plus, contraignant la personne à cliquer cinq fois sur « Retour » pour parvenir à quitter la liste. Avec `replace: true`, la mise à jour **remplace** l'entrée courante au lieu d'en empiler une autre : il s'agit de `replaceState`, que MDN décrit comme la méthode permettant de modifier l'entrée active de l'historique ([MDN, `History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)). La documentation de `Link` l'illustre sous forme de schéma textuel : avec un historique `A → B`, une navigation standard produit `A → B → C` ; avec `replace`, on obtient `A → C` ([React Router, `Link`](https://reactrouter.com/api/components/Link)).

La figure 3 le mesure. Elle part de la liste, après avoir visité le détail de `pagos` (soit un historique de deux entrées), saisit successivement `p`, `pa` et `pag` dans un champ de recherche analogue à celui du `revisor`, puis appuie sur « Retour ». L'expérience est menée deux fois : en navigation normale, puis avec `replace: true`.

```tsx
// fig05_03.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// React DOM decide al cargarse si hay un navegador; por eso se importa DESPUÉS de crear el DOM.
const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

function Buscador({ reemplazar }: { readonly reemplazar: boolean }) {
  const [parametros, establecerParametros] = useSearchParams();

  return (
    <input
      type="search"
      value={parametros.get("q") ?? ""}
      onChange={(evento) => establecerParametros({ q: evento.target.value }, { replace: reemplazar })}
    />
  );
}

function Detalle() {
  return null;
}

const escribirValor = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;

async function teclear(reemplazar: boolean): Promise<void> {
  console.log(`replace: ${reemplazar}`);
  const enrutador = createMemoryRouter(
    [
      { path: "/", element: <Buscador reemplazar={reemplazar} /> },
      { path: "/servicios/:nombre", Component: Detalle },
    ],
    { initialEntries: ["/servicios/pagos", "/"], initialIndex: 1 },
  );
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });

  const caja = contenedor.querySelector("input")!;
  for (const texto of ["p", "pa", "pag"]) {
    await act(async () => {
      escribirValor.call(caja, texto);
      caja.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    });
    const { pathname, search } = enrutador.state.location;
    console.log(`  tecleó «${texto}»: ${pathname}${search} (${enrutador.state.historyAction})`);
  }

  await act(async () => {
    await enrutador.navigate(-1);
  });
  const { pathname, search } = enrutador.state.location;
  console.log(`  botón Atrás:  ${pathname}${search}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await teclear(false);
await teclear(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_03.tsx
$ node fig05_03.js
replace: false
  tecleó «p»: /?q=p (PUSH)
  tecleó «pa»: /?q=pa (PUSH)
  tecleó «pag»: /?q=pag (PUSH)
  botón Atrás:  /?q=pa
replace: true
  tecleó «p»: /?q=p (REPLACE)
  tecleó «pa»: /?q=pa (REPLACE)
  tecleó «pag»: /?q=pag (REPLACE)
  botón Atrás:  /servicios/pagos
```

Avec une navigation classique, chaque touche a généré un `PUSH`, et « Retour » te dépose sur `/?q=pa` : cela annule une unique lettre. Avec `replace: true`, chaque frappe a déclenché un `REPLACE`, et « Retour » te ramène directement sur le détail de `pagos`, ce qui correspond exactement à ce que l'utilisateur cherchait à faire. L'adresse obtenue est identique dans les deux cas ; seul l'historique a changé. Deux remarques sur cette figure : React DOM est importé **après** l'initialisation du DOM de test, car il détermine au chargement s'il se trouve dans un environnement de navigateur, condition sine qua non pour que les événements clavier parviennent à `onChange` (les figures 1, 2 et 5 ne déclenchent aucun événement, se contentant de rendre et de lire du texte, raison pour laquelle elles peuvent l'importer en en-tête) ; par ailleurs, la figure écrit dans le champ en manipulant le descripteur de propriété `set` du prototype de `HTMLInputElement` afin que React perçoive la modification, ce que la Leçon 8 fera automatiquement pour toi à l'aide de `user-event`.

C'est un parti pris de conception, pas une vérité absolue : dans le `revisor`, la case « Solo fallas » remplace également l'entrée d'historique. On pourrait soutenir que cocher une case mérite une entrée propre dans l'historique ; le cours a pris le parti de traiter les deux filtres sur un pied d'égalité, comme une simple modalité d'affichage de la liste, pour que « Retour » conserve toujours le sens de « retourner à l'écran précédent ».

Et qu'en est-il des espaces ? Si tu cherches `pago s` (avec un espace), `URLSearchParams` transcrit l'espace sous la forme `+` : MDN explique qu'il applique l'encodage par pourcentage à ce qui en a besoin et transcrit l'espace en `+`, tout en réinterprétant ce `+` comme un espace à la lecture. Tu n'as rien de particulier à faire : le hook écrit et lit selon les mêmes conventions. Ne sois simplement pas surpris d'observer `?q=pago+s` dans la barre d'adresse.

#### 5.2.6 Le rapport, désormais sous forme de page

`Panel` s'efface au profit de `PaginaReporte`. Elle ne comporte plus le moindre `useState` : la requête est la même que dans la Leçon 4, les filtres sont extraits de l'adresse et les notes proviennent de la disposition.

```tsx
// revisor/src/reporte/PaginaReporte.tsx
import { useQuery } from "@tanstack/react-query";
import { useNotas } from "../app/contextoNotas";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { cadaMs } from "../configuracion";
import { consultaReporte } from "./consultas";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { useFiltrosEnUrl } from "./filtrosEnUrl";
import { contarFallas } from "./resumen";

export function PaginaReporte() {
  const consulta = useQuery(consultaReporte(cadaMs));
  const { filtros, cambiarFiltros } = useFiltrosEnUrl();
  const { notas } = useNotas();

  const fallas = consulta.data === undefined ? 0 : contarFallas(consulta.data.estados);
  useTituloDocumento(fallas > 0 ? `(${fallas}) Revisor` : "Revisor");

  return (
    <Tarjeta titulo="Estado de los servicios">
      <FiltroFallas filtros={filtros} alCambiar={cambiarFiltros} />
      <ContenidoReporte consulta={consulta} filtros={filtros} notas={notas} />
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
  );
}
```

`cadaMs` ne transite plus sous forme de prop depuis `main.tsx` : la page l'importe directement depuis `configuracion.ts`, puisque `main.tsx` ne rend plus de pages, mais le routeur. Le reste se décompose comme suit :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReportePublico } from "../compartido/contrato";
import { ListaEstados } from "./ListaEstados";
import type { Notas } from "./notas";
import { filtrarEstados, type Filtros } from "./resumen";
import { ResumenFallas } from "./ResumenFallas";

export function ContenidoReporte({
  consulta,
  filtros,
  notas,
}: {
  readonly consulta: UseQueryResult<ReportePublico>;
  readonly filtros: Filtros;
  readonly notas: Notas;
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

  return (
    <>
      {consulta.isError && (
        <p role="alert" className="viejo">
          Mostrando el último reporte que llegó: la actualización falló ({consulta.error.message}).
        </p>
      )}
      <ResumenFallas estados={estados} />
      <ListaEstados estados={filtrarEstados(estados, filtros)} notas={notas} />
    </>
  );
}
```

`ContenidoReporte` perd trois props (`seleccionado`, `alSeleccionar`, `alGuardarNota`) ainsi que le panneau de détail : ce n'est plus de son ressort. Ses quatre états plus un demeurent strictement identiques. Il reçoit les filtres sous forme d'un objet et les transmet à `filtrarEstados`. Observe un détail visible dans la sortie de Chrome pour `/?q=inv` : le récapitulatif affiche `4 servicios revisados · 2 servicios con falla` alors même que la liste ne présente qu'un unique service. C'est délibéré : `ResumenFallas` reçoit `estados`, c'est-à-dire l'intégralité des services, et non la sélection filtrée. Le résumé décrit le rapport dans sa globalité ; le filtre se borne à déterminer les lignes visibles à l'écran.

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox"> Solo fallas</label><label>Buscar por nombre <input type="search" value="inv"></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li></ul><p class="actualizado">Actualizado a las 2:14:55 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

Le filtre s'enrichit d'un deuxième champ de saisie :

```tsx
// revisor/src/reporte/FiltroFallas.tsx
import type { Filtros } from "./resumen";

export function FiltroFallas({
  filtros,
  alCambiar,
}: {
  readonly filtros: Filtros;
  readonly alCambiar: (cambio: Partial<Filtros>) => void;
}) {
  return (
    <div className="filtros">
      <label>
        <input
          type="checkbox"
          checked={filtros.soloFallas}
          onChange={(evento) => alCambiar({ soloFallas: evento.target.checked })}
        />{" "}
        Solo fallas
      </label>
      <label>
        Buscar por nombre{" "}
        <input
          type="search"
          value={filtros.texto}
          onChange={(evento) => alCambiar({ texto: evento.target.value })}
        />
      </label>
    </div>
  );
}
```

Les deux champs sont des composants **contrôlés** : leur valeur émane de `filtros`, qui découle de l'adresse, et chaque frappe réclame une nouvelle adresse. Le cycle complet d'une touche de clavier s'enchaîne ainsi : l'utilisateur tape, `onChange` invoque `alCambiar`, le hook navigue avec `replace`, l'adresse change, React Router redéclenche le rendu de la page, `useFiltrosEnUrl` lit le texte nouvellement saisi et le champ l'affiche. Cela peut sembler long, mais cela s'exécute dans le même instant perceptible. Le champ de recherche utilise `type="search"`, l'élément HTML natif prévu à cet effet, que les lecteurs d'écran annoncent explicitement comme champ de recherche.

La liste distingue désormais deux cas de liste vide :

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import type { Notas } from "./notas";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({
  estados,
  notas,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly notas: Notas;
}) {
  if (estados.length === 0) {
    return <p>Ningún servicio coincide con los filtros.</p>;
  }

  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          tieneNota={notas[estado.nombre] !== undefined}
        />
      ))}
    </ul>
  );
}
```

« No hay servicios configurados todavía. » (dans `ContenidoReporte`) signifie que le serveur ne possède aucun service : c'est le quatrième état de la Leçon 4. « Ningún servicio coincide con los filtros. » signifie qu'il y en a bien, mais que tes critères de filtrage les masquent tous. Ce sont deux cas distincts appelant des actions différentes — patienter jusqu'à ce que des services soient configurés, ou supprimer un filtre —, raison pour laquelle ils bénéficient de deux messages distincts.

#### 5.2.7 `Link` et `NavLink`

La ligne du tableau ne comporte plus un bouton qui sélectionne, mais un lien qui mène ailleurs :

```tsx
// revisor/src/reporte/FilaEstado.tsx
import { Link } from "react-router";
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
  tieneNota,
}: {
  readonly estado: EstadoPublico;
  readonly tieneNota: boolean;
}) {
  return (
    <li className={estado.tipo}>
      <Link to={`/servicios/${encodeURIComponent(estado.nombre)}`}>{estado.nombre}</Link>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

`Link` produit une balise `<a>` tout à fait standard, avec son attribut `href` : la documentation le qualifie d'« enveloppeur de `<a href>` progressivement amélioré » pour naviguer côté client ([React Router, `Link`](https://reactrouter.com/api/components/Link)). Dans la sortie de Chrome, on peut le constater : `<a href="/servicios/pagos" data-discover="true">pagos</a>`. Lors d'un clic, `Link` empêche le navigateur d'aller réclamer la page au serveur et ordonne au routeur de naviguer avec `pushState`. Comme il s'agit d'un véritable `<a>`, tout ce que l'on attend d'un lien fonctionne comme prévu : l'ouvrir dans un nouvel onglet avec Ctrl+clic ou le clic molette, copier son adresse ou l'apercevoir au survol de la souris. Avec le bouton de la Leçon 2, rien de tout cela n'était possible. De surcroît, le lecteur d'écran l'annonce comme un « lien », ce qu'il est en vérité : il conduit vers une autre destination. L'attribut `data-discover` est apposé par React Router pour son mécanisme de découverte de routes, propre au mode framework ([React Router, « Lazy Route Discovery »](https://reactrouter.com/explanation/lazy-route-discovery)) ; en mode de données, tu peux simplement l'ignorer.

Naviguer côté client induit toutefois un écueil dont un rechargement traditionnel est exempt. Lorsque le navigateur charge une page entière, le lecteur d'écran annonce la nouvelle page et le focus se repositionne au sommet. Avec `pushState`, aucun de ces deux automatismes ne se produit spontanément : le contenu visuel change sous les yeux de la personne, tandis que le focus demeure figé à son emplacement précédent. React Router propose de rétablir la position de défilement grâce à `ScrollRestoration` (« émule la restauration du défilement du navigateur », précise sa documentation, [React Router, `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)), mais cette page ne traite nullement du focus. Le titre mis à jour par page via `useTituloDocumento` apporte un premier élément de réponse ; la seconde partie, consistant à déplacer le focus là où commence la nouvelle page, relève de ta responsabilité. La Leçon 7, consacrée à l'accessibilité, reviendra en détail sur la gestion du clavier et du focus. Pour l'heure, parcours le `revisor` avec la touche Tab après avoir cliqué sur un service, et note dans ton journal de bord où s'est arrêté le focus.

La navigation de la disposition fait appel à `NavLink`, une variante de `Link` capable de déterminer si sa cible coïncide avec l'adresse active. Quand c'est le cas, elle lui adjoint la classe `active` ainsi que l'attribut `aria-current="page"`, qui informe les lecteurs d'écran : « voici la page sur laquelle vous vous trouvez » ([React Router, `NavLink`](https://reactrouter.com/api/components/NavLink)). Compare les deux sorties fournies par Chrome : sur `/?fallas=1`, le lien affiche `aria-current="page" class="active"` ; sur `/servicios/pagos`, il affiche `class=""`. La feuille de styles se charge de mettre en gras le lien actif :

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

.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}

header nav a {
  margin-right: 1rem;
}

header nav a.active {
  font-weight: bold;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}
```

Et qu'en est-il du `end` dans `<NavLink to="/" end>` ? En temps normal, un `NavLink` est également considéré comme actif pour les adresses qui **débutent** par sa destination : un lien vers `/servicios` serait actif sur `/servicios/pagos`. La propriété `end` modifie cette règle : le lien n'est actif que si l'adresse **se termine** précisément par ce chemin. La documentation mentionne toutefois une exception notable : étant donné que **toutes** les adresses commencent par un `/`, un `NavLink` pointant vers `/` agit déjà par défaut comme s'il possédait `end`. La figure 5 permet de le vérifier :

```tsx
// fig05_05.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, NavLink } from "react-router";
import { RouterProvider } from "react-router/dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Menu() {
  return (
    <nav>
      <NavLink to="/">raíz sin end</NavLink>
      <NavLink to="/" end>raíz con end</NavLink>
      <NavLink to="/servicios">servicios sin end</NavLink>
      <NavLink to="/servicios" end>servicios con end</NavLink>
    </nav>
  );
}

for (const direccion of ["/", "/servicios", "/servicios/pagos"]) {
  const enrutador = createMemoryRouter([{ path: "*", Component: Menu }], { initialEntries: [direccion] });
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<RouterProvider router={enrutador} />);
  });
  const activos = [...contenedor.querySelectorAll("a.active")].map((enlace) => enlace.textContent);
  console.log(`${direccion.padEnd(17)} activos: ${activos.join(" · ") || "ninguno"}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_05.tsx
$ node fig05_05.js
/                 activos: raíz sin end · raíz con end
/servicios        activos: servicios sin end · servicios con end
/servicios/pagos  activos: servicios sin end
```

Sur `/servicios/pagos`, seul « servicios sin end » est actif ; les deux liens pointant vers la racine ne le sont pas, qu'ils portent `end` ou non. Ainsi, dans le `revisor`, la présence de `end` ne modifie pas le résultat, et pourtant nous l'écrivons expressément : cela explicite l'intention (« ce lien ne concerne que la liste ») pour toute personne relisant le code, sans lui imposer de se souvenir d'un cas particulier.

Dernier point : les classes `.seleccionar` et `.detalle` de la feuille de styles ne sont plus employées par aucun composant. Elles appartenaient au bouton de la Leçon 2 et au panneau de la Leçon 3. Le point de contrôle les garde pour l'instant ; note-les comme nettoyage à effectuer.

### 5.3 Recharger une route du client : le serveur doit répondre `index.html`

#### 5.3.1 Deux chemins pour arriver à la même adresse

Il existe deux façons de parvenir à `/servicios/pagos`, et pour le serveur, elles n'ont absolument rien de commun.

**En naviguant à l'intérieur de l'application.** Tu ouvres `/`, le serveur envoie `index.html`, le JavaScript démarre, et tu cliques sur `pagos`. `Link` appelle `pushState`, la barre d'adresse indique désormais `/servicios/pagos` et React Router affiche `PaginaServicio`. **Le serveur n'en a rien su** : l'unique nouvelle requête émise sur le réseau a été celle adressée à l'API, `GET /api/servicios/pagos`.

**En arrivant depuis l'extérieur.** Tu recharges avec F5, ou tu colles le lien dans un navigateur vierge, ou tu l'ouvres depuis un courriel. Dans cette situation, aucune application n'est encore chargée en mémoire. Le navigateur agit comme face à n'importe quelle adresse : il transmet `GET /servicios/pagos` **au serveur**. C'est le fameux « puisse tenter de la charger plus tard » relevé sur MDN. Et le serveur doit renvoyer une ressource permettant au navigateur d'initialiser l'application, afin que React Router puisse lire l'adresse et afficher le détail correspondant. Cette ressource, c'est `index.html`, exactement le même fichier que pour `/` : la page servie ne change pas, seule varie l'adresse avec laquelle elle démarre son exécution.

Si le serveur cherche un fichier physique nommé `servicios/pagos` au sein de `dist/`, il ne le trouvera pas, pour la simple raison qu'il n'existe pas : `dist/` ne contient qu'un `index.html`, un fichier `.js` et un `.css`. Et il répondra par une erreur 404.

#### 5.3.2 Ce que répondent `vite dev` et `vite preview`

Jusqu'à présent, tu n'as jamais été confronté à cette erreur 404 car les deux serveurs intégrés à Vite appliquent d'emblée le bon comportement. Vite propose une option, `appType`, dont la valeur par défaut est `'spa'` (*Single Page Application*, application monopage), qui active ce que sa documentation appelle le *SPA fallback* : le mécanisme de secours qui renvoie `index.html` dès lors que l'adresse demandée ne correspond pas à un fichier existant sur le disque ([Vite, « Shared Options », `appType`](https://vite.dev/config/shared-options)). Dans `vite dev`, cela est pris en charge par un middleware de Vite ; dans `vite preview`, la même documentation indique qu'il configure `sirv`, le serveur de fichiers statiques sous-jacent, avec l'option `single: true`, laquelle sert `index.html` pour toute ressource non trouvée. La Leçon 0 l'avait déjà effleuré dans son exercice 3, lorsque `curl http://localhost:5173/salud` avait retourné le HTML de la page. Voici ce que `vite preview` a répondu dans cette leçon :

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://localhost:4173/servicios/cat%C3%A1logo"
200 text/html
$ curl -s "http://localhost:4173/servicios/cat%C3%A1logo" | head -12
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
    <script type="module" crossorigin src="/assets/index-CyH_ELFs.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-yYL09Z4k.css">
  </head>
  <body>
    <div id="raiz"></div>
  </body>
```

C'est bien `index.html`, avec un code HTTP 200. Et note la forme des chemins de fichiers : `/assets/index-CyH_ELFs.js`, avec une barre oblique `/` au tout début. Cela a une importance bien plus grande qu'il n'y paraît. Si le chemin était `assets/index-CyH_ELFs.js`, sans barre initiale, le navigateur le résoudrait **relativement à l'adresse courante**, et depuis `/servicios/pagos`, il réclamerait `/servicios/assets/index-CyH_ELFs.js`, qui n'existe absolument pas. La barre oblique initiale garantit que le JavaScript est sollicité à la racine du domaine, quelle que soit la profondeur de l'adresse active. Cela vaut tant que l'application est publiée à la racine : Vite construit ces chemins avec son option `base`, qui vaut `/` par défaut ([Vite, « Shared Options », `base`](https://vite.dev/config/shared-options#base)). Si un jour tu la publies sous un sous-répertoire, comme `/revisor/`, il faut fixer `base` dans la configuration, car avec `/assets/…` le navigateur demanderait les fichiers à la racine du domaine et ne les trouverait pas.

Le mécanisme de secours de `vite preview` est généreux, peut-être même un peu trop. Voici ce qu'il a renvoyé pour trois autres adresses :

```text
/no-existe → 200 text/html
/assets/no-existe.js → 200 text/html
/servicios/pagos?x=1 → 200 text/html
```

Le premier cas correspond au comportement attendu : `/no-existe` est une route du client, et l'affichage de la page « non trouvée » incombe à React. Note qu'elle arrive avec un code **200** : le serveur ignore quelles routes sont déclarées dans `rutas.tsx`, il ne peut donc pas émettre un code 404. Le deuxième cas est plus discutable : un fichier JavaScript inexistant reçoit également du HTML accompagné d'un code 200, si bien qu'un navigateur attendant du code exécutable se voit servir une page web. Le serveur écrit dans la Leçon 9 distinguera explicitement les deux cas : il réécrira vers `index.html` les routes clientes, mais répondra un véritable 404 pour tout ce qui fait défaut sous `/assets/`.

#### 5.3.3 Le serveur qui ne réécrit pas

Pour observer concrètement cette erreur 404, il nous faut un serveur qui serve des fichiers et strictement rien d'autre. Python en intègre un : `python3 -m http.server`, avec `--directory` pour cibler le dossier voulu et `--bind` pour restreindre l'écoute à ta machine locale. Sa documentation prévient expressément qu'il n'est pas conçu pour la production, et précise que si la requête ne correspond à aucun fichier, il renvoie `404 File not found` ([Python, `http.server`](https://docs.python.org/3/library/http.server.html)). Il est idéal pour notre démonstration, précisément en raison de sa simplicité élémentaire. Après avoir exécuté `npm run build`, lance depuis `~/curso-react/revisor/` :

```text
$ python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

Et depuis un autre terminal :

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/
200 text/html
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/servicios/pagos
404 text/html;charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/assets/index-CyH_ELFs.js
200 text/javascript
```

La racine fonctionne sans encombre, puisque `dist/index.html` est bien présent sur le disque ; le fichier JavaScript également. En revanche, `/servicios/pagos`, qui produisait un 200 sous `vite preview`, déclenche ici une erreur 404. Si tu ouvres la racine dans le navigateur et que tu cliques sur `pagos`, tout fonctionne parfaitement, parce que le clic ne transite jamais par le serveur. Mais si à cet instant précis tu recharges la page, le navigateur t'affiche ceci, ce qui correspond exactement à ce qu'a subi la personne de notre scénario :

```text
$ curl -s http://127.0.0.1:4190/servicios/pagos
<!DOCTYPE HTML>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Error response</title>
    </head>
    <body>
        <h1>Error response</h1>
        <p>Error code: 404</p>
        <p>Message: File not found.</p>
        <p>Error code explanation: 404 - Nothing matches the given URI.</p>
    </body>
</html>
```

Le journal de Python en porte la trace écrite :

```text
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /assets/index-CyH_ELFs.js HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
```

On relève une ligne `GET` pour chacun des quatre appels `curl`, et chaque 404 est précédé de son explication ; la dernière paire correspond au `curl` ayant récupéré l'intégralité de la page d'erreur. (Les horodatages de ce journal correspondent à l'heure locale de la machine, et non à l'UTC.) Arrête le serveur avec Ctrl+C.

L'enseignement est immédiat : **dès lors qu'une application met en œuvre des routes côté client, le serveur chargé de la servir se voit confier une tâche inédite.** Pour toute adresse qui ne pointe pas vers un fichier réel existant, il doit retourner `index.html`, et laisser le routeur décider de l'affichage. La manière de configurer cela dépend du serveur retenu : un serveur web traditionnel fait appel à une règle de réécriture, une plateforme d'hébergement propose une case d'activation « application monopage », et un serveur sur mesure gère cela en quelques lignes de code, celles-là mêmes que rédige la Leçon 9. Ce qui ne varie jamais, en revanche, c'est le test à opérer : **recharge une route profonde sur le véritable serveur.** Se contenter de vérifier avec `vite preview` ne prouve rien quant à la réalité de la production, car `vite preview` gère déjà la réécriture de manière transparente et, comme le rappelle la documentation de Vite dès la Leçon 0, ne constitue pas un serveur de production.

Il existe une autre échappatoire, qu'il est utile de connaître pour mieux la rejeter en connaissance de cause : faire figurer la route derrière un croisillon `#` (`/#/servicios/pagos`). Le navigateur ne transmettant jamais au serveur ce qui suit le `#`, ce dernier ne voit que `/` et répond systématiquement par `index.html`. React Router le permet via `createHashRouter`. Cela fonctionne sur n'importe quel serveur statique, mais les adresses deviennent inélégantes, le `#` perd sa capacité native de saut vers une ancre de la page, et le véritable problème — un serveur incapable de servir convenablement une application web — se trouve simplement éludé plutôt que résolu. Le cours fait le choix d'adresses standards et règle le problème côté serveur.


## L'erreur que tu vas voir

Cette leçon présente une erreur principale, le 404 lors du rechargement, que tu as déjà rencontré en 5.3, ainsi que deux erreurs secondaires qui surgissent lors de l'écriture des pages.

**L'erreur principale : « chez moi, ça marche ».** Tout fonctionne avec `npm run dev`, tout fonctionne avec `npm run preview`, tout fonctionne au clic. L'échec ne se produit que lorsque quelqu'un **recharge** ou **ouvre un lien direct** sur le serveur où l'application est déployée, et l'erreur prend la forme d'une page qui n'appartient pas à ton application : `Error code: 404`, `File not found` ou l'équivalent propre à ton serveur. L'indice pour la reconnaître est que la racine `/` fonctionne toujours et que seul le reste échoue, et que dans l'onglet Réseau des outils de développement, la requête défaillante est celle du **document** (`/servicios/pagos`), non celle de l'API (`/api/servicios/pagos`). Si c'est celle de l'API qui échoue, le problème est d'une autre nature. La solution ne se trouve pas dans React : elle consiste à configurer le serveur pour qu'il retourne `index.html` pour les routes gérées côté client.

**Un composant de route en dehors du routeur.** La figure 4 affiche deux arbres au sein d'un périmètre d'erreur personnalisé, analogue au `LimiteDeError` du `revisor`. Le premier emploie `useSearchParams` sans le moindre routeur pour l'envelopper, ce qui se produit si tu effectues le rendu d'une page isolée, par exemple dans un test où l'on aurait oublié de la monter dans un routeur. Le second correspond à une route qui lève une exception lors de son rendu, au sein de `RouterProvider` :

```tsx
// fig05_04.tsx
import { JSDOM } from "jsdom";
import { act, Component, type ReactNode } from "react";
import { createMemoryRouter, useSearchParams } from "react-router";

const dom = new JSDOM('<!doctype html><body></body>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");
const { RouterProvider } = await import("react-router/dom");

// Los avisos de consola de React traen pilas largas: aquí solo se muestra su primer renglón.
console.error = (...partes: unknown[]) => {
  const [formato, ...resto] = partes;
  const texto = typeof formato === "string" && formato.startsWith("%o") ? resto : partes;
  const primero = texto.map((parte) => (parte instanceof Error ? parte.message : String(parte))).join(" ");
  console.log(`  [consola] ${primero.split("\n")[0]}`);
};

class Limite extends Component<{ readonly children: ReactNode }, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error === null ? this.props.children : <>[límite propio] {this.state.error.message}</>;
  }
}

function Filtros() {
  const [parametros] = useSearchParams();
  return <>q = {parametros.get("q")}</>;
}

function Rota(): ReactNode {
  throw new Error("la página se rompió al dibujar");
}

async function dibujar(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Limite>{arbol}</Limite>);
  });
  // Sin el <pre> de la pila, que trae rutas de la máquina.
  const copia = contenedor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("pre").forEach((pila) => pila.remove());
  console.log(`  pantalla: ${copia.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await dibujar("1. useSearchParams sin enrutador:", <Filtros />);

const enrutador = createMemoryRouter([{ path: "/", Component: Rota }]);
await dibujar("2. una ruta que lanza, dentro de RouterProvider:", <RouterProvider router={enrutador} />);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig05_04.tsx
$ node fig05_04.js
1. useSearchParams sin enrutador:
  [consola] useLocation() may be used only in the context of a <Router> component. The above error occurred in the <Filtros> component. React will try to recreate this component tree from scratch using the error boundary you provided, Limite.
  pantalla: [límite propio] useLocation() may be used only in the context of a <Router> component.
2. una ruta que lanza, dentro de RouterProvider:
  [consola] la página se rompió al dibujar The above error occurred in the <Rota> component. React will try to recreate this component tree from scratch using the error boundary you provided, RenderErrorBoundary.
  [consola] React Router caught the following error during render la página se rompió al dibujar
  pantalla: Unexpected Application Error!la página se rompió al dibujar
```

Le premier message indique `useLocation() may be used only in the context of a <Router> component.` alors même que le code a invoqué `useSearchParams` : sous le capot, `useSearchParams` s'appuie sur `useLocation`, et l'erreur est levée par le premier composant qui s'en aperçoit. Il faut le lire ainsi : « ce hook nécessite un routeur plus haut dans l'arborescence et n'en a trouvé aucun ». La solution ne consiste jamais à modifier le hook, mais à effectuer le rendu du composant au sein d'un routeur ; dans la Leçon 8, la fonction utilitaire `montarEn(direccion)` fera très exactement cela à l'aide de `createMemoryRouter(rutas)`.

Le second cas correspond à la situation décrite en 5.1.6. Le périmètre d'erreur personnalisé n'en a rien su : React indique dans la console qu'il utilisera le périmètre `RenderErrorBoundary`, qui appartient à React Router, et l'écran affiche `Unexpected Application Error!` suivi du message d'erreur. (La figure élimine de la sortie le bloc contenant la trace d'appel de l'erreur, qui comporte des chemins locaux de la machine. De plus, lors d'une exécution en mode développement, React Router ajoute un paragraphe à l'intention du développeur, l'invitant à déclarer un `ErrorBoundary` propre ; la figure s'exécute avec la version de production du paquet, qui n'inclut pas cet encart.) C'est la même chose que ce que tu as observé sur le `revisor` en 5.1.6, et la correction est celle présentée dans cette même section : déclarer un `ErrorBoundary` sur la route.

**Le paramètre qui peut manquer.** Supprime la valeur par défaut dans `PaginaServicio` et écris simplement `const { nombre } = useParams();`. Voici ce que renvoie `tsc -b` :

```text
$ npx tsc -b
src/detalle/PaginaServicio.tsx(12,45): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(13,35): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(50,13): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(51,33): error TS2538: Type 'undefined' cannot be used as an index type.
```

Quatre erreurs, une pour chaque endroit qui **exige formellement** un `string` : la requête du détail, la mutation, la prop `nombre` de `EditorNota` et l'indexation `notas[nombre]`. Les trois autres utilisations (le titre de l'onglet, celui de la carte et la `key`) ne protestent pas : un littéral de gabarit transforme silencieusement `undefined` en la chaîne de caractères `"undefined"` et l'imprime à l'écran sans avertir, ce qui constitue une erreur que TypeScript n'intercepte pas. C'est le même avertissement qu'en 5.2.1, vu sous l'angle du compilateur : `useParams` ne peut garantir que le paramètre existe effectivement. Il existe trois solutions raisonnables : la valeur par défaut `= ""` adoptée par le point de contrôle ; une vérification initiale qui affiche un autre contenu en cas d'absence ; ou, en mode framework, les types générés automatiquement par route. Ce qui n'est pas raisonnable, c'est de masquer le problème avec `nombre!` : ce point d'exclamation intime à TypeScript « fais-moi confiance », ce qui détruit précisément la protection que le compilateur cherchait à t'apporter. (Cette erreur a été provoquée dans une copie du point de contrôle ; l'original passe `tsc -b` sans la moindre remarque.)

## Ce qui se fait de travers

**Copier l'adresse dans un `useState` et les synchroniser avec un Effect.** « Je lis `?q=` au montage, je l'enregistre dans un état local, et un Effect écrit cet état dans l'adresse dès qu'il change. » Cela crée deux sources de vérité, un rendu superflu à chaque modification et un Effect qui ne se synchronise avec aucun système externe. L'adresse constitue déjà l'état : lis-la directement à chaque rendu.

**Utiliser `<a href>` pour naviguer à l'intérieur de l'application.** Cela fonctionne en apparence, et c'est bien ce qui rend la chose trompeuse : chaque clic recharge la page dans sa totalité ; le cache de TanStack Query est perdu, les notes de la disposition sont détruites, et le navigateur doit redemander la page et réexécuter toute l'application depuis zéro. Au sein de l'application, utilise `Link` ; réserve la balise `<a>` brute exclusivement aux sorties vers l'extérieur.

**Un bouton avec `onClick` pour naviguer, au lieu d'un lien.** Cela détruit tous les avantages qu'un lien offre gratuitement : l'ouverture dans un nouvel onglet, la copie de l'adresse, l'annonce vocale en tant que « lien » par les lecteurs d'écran. Si un élément mène vers un autre endroit, c'est un lien.

**Écrire dans l'historique à chaque frappe de touche.** Sans `replace: true`, un champ de recherche engendre une nouvelle entrée par lettre saisie, et le bouton « Retour » se transforme en une commande d'annulation fastidieuse, lettre par lettre (figure 3).

**Construire des adresses sans les encoder.** `` `/servicios/${nombre}` `` fonctionne avec `pagos` et plantera le jour où un nom de service comportera un `/`, un `?` ou un `#`. Encode lors de l'insertion du texte, avec `encodeURIComponent`, et laisse `useParams` décoder à la lecture.

**Se reposer sur le périmètre extérieur pour les erreurs survenant dans les pages.** `LimiteDeError` dans `main.tsx` ne voit pas ce qui se déroule au sein des routes : React Router l'intercepte avant lui. Sans un `ErrorBoundary` propre, l'utilisateur se retrouve face à `Unexpected Application Error!` et à la trace brute de l'erreur (5.1.6).

**Créer le routeur à l'intérieur d'un composant.** Chaque nouveau rendu recréerait une nouvelle instance de routeur repartant de zéro. Il se crée une seule fois, au niveau du module, conformément aux directives de la documentation.

**Installer `react-router-dom`.** Ce paquet est toujours présent sur npm, mais il s'est arrêté à la version 7 (mesuré : sa version `latest` est la 7.18.4, et dépend de `react-router` 7.18.4) ; la version 8 ne le publie plus. C'est pourquoi `npm install react-router-dom` ne signale aucune erreur : il télécharge silencieusement une seconde copie, `react-router@7`, aux côtés de la version 8. Si tu mélanges les imports entre ces deux paquets, chaque copie cherchera son propre routeur sans trouver celui de l'autre, ce qui produit la première erreur illustrée par la figure 4. Tout s'importe désormais depuis `react-router`, et `RouterProvider` depuis `react-router/dom`.

**Considérer le déploiement comme validé sous prétexte que `vite preview` fonctionne.** `vite preview` effectue la réécriture vers `index.html` de son propre chef. Le seul test probant consiste à recharger une route profonde sur le véritable serveur où l'application sera publiée.

**Conserver dans l'adresse ce qui ne décrit pas la vue.** Un brouillon de texte à peine commencé, un mot de passe, un jeton d'authentification : l'adresse se copie, est mémorisée dans l'historique du navigateur, apparaît dans les journaux d'accès des serveurs et voyage au sein de l'en-tête HTTP `Referer`. On ne place dans l'adresse que ce qu'un utilisateur souhaiterait partager ; rien d'autre.

## Exercices

### Exercice 1 — Prédis l'adresse

Avec le serveur d'exercice et `npm run dev` lancés, ouvre `http://localhost:5173/`. **Avant de toucher à quoi que ce soit**, écris dans ton journal de bord quelle sera l'adresse exacte obtenue après avoir accompli ces actions, dans cet ordre : taper `rep` dans « Buscar por nombre », puis cocher « Solo fallas ». Indique également quels services s'afficheront, et où te ramènera le bouton « Retour » du navigateur. Réalise la manipulation et compare tes prédictions. Répète ensuite l'opération dans l'ordre inverse (d'abord la case à cocher, puis la saisie du texte) en partant de `/`. L'adresse obtenue est-elle rigoureusement identique ? Cela a-t-il une quelconque importance ?

### Exercice 2 — Retire `replace` et compte

Dans une copie du point de contrôle, efface `{ replace: true }` dans `filtrosEnUrl.ts` (avec la virgule qui le précède). **Prédis** combien de fois tu devras cliquer sur « Retour » pour revenir au détail de `pagos` si, depuis cette vue détaillée, tu retournes à la liste et tapes le mot `inventario` dans le champ de recherche. Vérifie ton hypothèse dans le navigateur. Cela correspond-il aux observations de la figure 3 ? Rétablis la ligne une fois terminé, puis lance `npm run lint` et `npm run build`.

### Exercice 3 — Un périmètre dédié pour le détail

Le périmètre d'erreur posé à la racine constitue le filet de sécurité ultime : lorsqu'elle s'affiche, elle emporte avec elle l'en-tête et la navigation. Pour le détail d'un service, tu peux faire nettement mieux. Dans une copie du point de contrôle, ajoute à la route `servicios/:nombre` un périmètre dédié, dans un nouveau fichier `src/detalle/ErrorDeServicio.tsx`, qui affiche une `Tarjeta` intitulée `Servicio <nombre>`, un paragraphe avec `role="alert"` indiquant « No se pudo mostrar este servicio: » suivi du message d'erreur, ainsi qu'un lien « Volver al reporte ». Pour vérifier son fonctionnement, fais en sorte que `PaginaServicio` lève une exception **uniquement** lorsque `nombre` vaut `pagos` ; réfléchis à l'endroit précis où positionner ce `throw` pour que `npm run lint` l'accepte sans protester.

**Avant de tester**, prédis trois choses : sur `/servicios/pagos`, l'en-tête « Revisor » et sa navigation restent-ils visibles ? Quel titre prend l'onglet du navigateur ? Et sur `/servicios/inventario`, observe-t-on le moindre changement ? Vérifie avec `npm run build` et `npm run preview`, puis supprime la copie de travail une fois l'exercice achevé.

### Exercice 4 — Où réside chaque état ?

Sans regarder le code, classe chaque élément d'état du `revisor` dans l'un des quatre emplacements suivants : **local** (un `useState` à l'intérieur d'un composant), **adresse**, **serveur** (TanStack Query) ou **disposition** (`Outlet context`). Voici la liste des éléments : le brouillon d'une note ; la note déjà enregistrée ; « Solo fallas » ; le texte recherché ; le service dont le détail est affiché ; la liste des services ; le détail d'un service ; l'indicateur d'une mise à jour en cours (« · actualizando… »). Pour chacun d'eux, fournis une justification en une ligne. Vérifie ensuite tes réponses en examinant le code source.

## Solutions

### Solution 1

Lors de la saisie de `rep`, l'adresse évolue successivement par `/?q=r`, `/?q=re` et `/?q=rep`, et la liste ne présente plus que `reportes`. En cochant la case, l'adresse devient `/?q=rep&fallas=1`, et tu continues de voir `reportes`, qui se trouve en panne. Le bouton « Retour » te fait sortir de la liste pour te ramener là où tu te trouvais avant de l'ouvrir (si tu as ouvert l'onglet directement sur `/`, vers la page précédente de l'historique du navigateur), car les quatre modifications ont remplacé l'entrée courante au lieu d'en empiler de nouvelles. Dans l'ordre inverse, l'adresse obtenue est `/?fallas=1&q=rep`. La chaîne n'est pas strictement identique, car `cambiarFiltros` duplique les paramètres existants et la méthode `set` ajoute à la fin un paramètre qui n'existait pas encore, préservant l'ordre de ceux qui étaient déjà là. Mais cela n'a aucune conséquence : `useFiltrosEnUrl` lit chaque paramètre par son nom avec `get`, si bien que les deux adresses affichent rigoureusement la même vue. Si tu partages l'une ou l'autre de ces deux adresses, la personne qui l'ouvrira verra exactement ton écran.

### Solution 2

Sans `replace`, l'historique depuis le détail de `pagos` s'établit comme suit : la page de détail, la liste après le clic sur « Volver al reporte », puis une entrée distincte pour chacune des dix lettres du mot `inventario`. Pour revenir au détail, il faut donc cliquer onze fois sur « Retour » : dix clics pour défaire les lettres une à une, et un dernier clic pour sortir de la liste. C'est exactement le comportement illustré par la figure 3 avec trois lettres, où un unique clic sur « Retour » n'avait défait qu'un seul caractère. Une fois `replace: true` rétabli, un seul clic suffit. Cet exercice se vérifie de visu dans un vrai navigateur ; la figure 3 en constitue la transcription automatisée.

### Solution 3

```tsx
// en una copia: revisor/src/detalle/ErrorDeServicio.tsx
import { Link, useParams, useRouteError } from "react-router";
import { Tarjeta } from "../compartido/Tarjeta";

export function ErrorDeServicio() {
  const { nombre = "" } = useParams();
  const error = useRouteError();

  return (
    <Tarjeta titulo={`Servicio ${nombre}`}>
      <p role="alert">
        No se pudo mostrar este servicio: {error instanceof Error ? error.message : "error desconocido"}
      </p>
      <p>
        <Link to="/">Volver al reporte</Link>
      </p>
    </Tarjeta>
  );
}
```

Dans `rutas.tsx`, la route de détail reçoit son propre périmètre (et le fichier gagne l'importation de `ErrorDeServicio`) :

```tsx
// en una copia: revisor/src/app/rutas.tsx (fragmento)
      { path: "servicios/:nombre", Component: PaginaServicio, ErrorBoundary: ErrorDeServicio },
```

Et l'erreur provoquée volontairement se place dans `PaginaServicio` après l'ensemble de ses hooks, juste avant l'instruction `return`, pour la même raison qu'en 5.1.6 :

```tsx
// en una copia: revisor/src/detalle/PaginaServicio.tsx (fragmento)
  if (nombre === "pagos") {
    throw new Error("el detalle se rompió al dibujar");
  }
```

Munie de ces ajustements, la copie a passé avec succès `npm run lint` et `npm run build`, et Chrome a produit ceci sur `/servicios/pagos` :

```text
<title>Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><p role="alert">No se pudo mostrar este servicio: el detalle se rompió al dibujar</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Les trois prédictions : **Oui**, l'en-tête et la navigation restent bien présents : l'erreur a recherché le périmètre le plus proche en remontant l'arbre, et le plus proche est désormais celui de la route de détail, qui ne remplace que `PaginaServicio` ; `Disposicion` n'a pas été impactée. Le titre de l'onglet reste `Revisor` et non `pagos · Revisor` : la page a levé une exception avant la fin de son rendu, et son Effect dans `useTituloDocumento` n'a jamais pu s'exécuter. Si tu souhaites mettre à jour le titre, le périmètre d'erreur doit s'en charger lui-même. Et sur `/servicios/inventario`, rien ne change : le détail s'est affiché dans son intégralité (`Disponible: HTTP 200 en 118 ms`), car le périmètre n'intervient que si une erreur se produit.

`useParams` fonctionne parfaitement au sein du périmètre d'erreur, car celui-ci est rendu à l'emplacement exact de la route, avec les mêmes paramètres disponibles. Et le message est personnalisé à dessein : « No se pudo mostrar este servicio » informe clairement la personne sur la partie spécifique qui a échoué tout en lui laissant une porte de sortie immédiate, alors que l'avertissement de la racine concerne l'application tout entière. Si tu avais placé le `throw` en toute première ligne du composant, `npm run lint` aurait répondu par une erreur `rules-of-hooks` pour chacun des hooks situés en dessous ; par ailleurs, `tsc` se serait plaint, car après un `throw` inconditionnel, il ne peut plus déduire avec certitude que `consulta.data` existe.

### Solution 4

| État | Où réside-t-il | Pourquoi |
|---|---|---|
| brouillon d'une note | local (`EditorNota`) | n'intéresse que la personne en train de le rédiger, et doit se réinitialiser lors d'un changement de service (`key`) |
| note enregistrée | disposition (`Outlet context`) | nécessaire à deux pages, la liste (indicateur « con nota ») et le détail, et doit survivre aux allers-retours |
| « Solo fallas » | adresse (`?fallas=1`) | décrit la vue courante et a vocation à être partagé |
| texte recherché | adresse (`?q=`) | même motif que le précédent |
| service en cours de consultation | adresse (`/servicios/:nombre`) | constitue la page elle-même ; dans la Leçon 2, c'était le `useState` `seleccionado` |
| liste des services | serveur (`["reporte"]`) | appartient au serveur ; l'écran en conserve une copie en cache |
| détail d'un service | serveur (`["servicio", nombre]`) | identique, avec une entrée de cache distincte par service |
| « · actualizando… » | serveur (`isFetching` de la requête) | personne ne le stocke : il est directement déduit par TanStack Query |

Si tu avais envisagé de placer les notes dans l'adresse, songe à ce qui se produirait en partageant le lien : tes notes voyageraient jusqu'à l'autre personne, et feraient grossir démesurément la longueur de l'adresse sans aucune limite. Si tu les avais attribuées au serveur, tu as raison sur le long terme — aujourd'hui, elles sont perdues au rechargement —, mais l'API d'exercice ne dispose d'aucune route permettant de les persister. La [Leçon 6](06-reducer-contexto.md) reviendra sur ce tableau pour lui adjoindre une nouvelle colonne : le contexte.

## Comment savoir que j'ai réussi

- [ ] `npm ci`, `npm run lint` et `npm run build` se terminent avec succès dans `~/curso-react/revisor/`, et `npm run build` génère `dist/assets/index-CyH_ELFs.js` si ton code est rigoureusement identique à celui du point de contrôle.
- [ ] `npm ls react-router` affiche `react-router@8.5.0`, et `npm ls react-router-dom` répond `└── (empty)` avec un code de sortie 1, ce qui est le comportement attendu ici : le paquet n'a pas été trouvé.
- [ ] Avec le serveur d'exercice et `npm run preview` en marche, ouvrir `http://localhost:4173/?fallas=1` dans un nouvel onglet affiche la case cochée et uniquement `pagos` et `reportes` ; le titre de l'onglet est `(2) Revisor`.
- [ ] `http://localhost:4173/servicios/pagos` affiche le détail de `pagos` et le titre `pagos · Revisor` ; `http://localhost:4173/no-existe` affiche « Página no encontrada » surmontée de l'en-tête du `revisor`.
- [ ] Dans le navigateur : tu saisis une note dans le détail de `pagos`, tu l'enregistres, tu reviens au rapport avec « Volver al reporte » et la ligne de `pagos` affiche « · con nota ». (Cela se vérifie manuellement : les exécutions de test de cette leçon ne simulent aucun clic.)
- [ ] Lorsque tu tapes dans « Buscar por nombre », l'adresse se modifie à chaque frappe, et un unique clic sur « Retour » te fait sortir de la liste.
- [ ] Dans le HTML de la page (via les outils de développement ou avec Chrome sans interface graphique), le lien « Reporte » comporte `aria-current="page"` sur `/` et ne le comporte pas sur `/servicios/pagos`.
- [ ] Avec `python3 -m http.server 4190 --bind 127.0.0.1 --directory dist`, un appel `curl` vers `/servicios/pagos` répond `404`, alors qu'avec `vite preview`, la même route répond `200 text/html`. Tu es en mesure d'expliquer pourquoi, et tu as bien arrêté les deux serveurs.
- [ ] Dans une copie comportant le `throw` de 5.1.6, `/?q=romper` affiche « Algo salió mal al dibujar el panel » avec `role="alert"` et non `Unexpected Application Error!` ; dans le point de contrôle, sans le `throw`, la liste s'affiche normalement. Tu sais expliquer pourquoi cet avertissement n'est pas rendu par `LimiteDeError`.
- [ ] Les six figures compilent avec `tsc` et leur sortie correspond exactement à celle consignée dans la leçon.
- [ ] Tu as noté dans ton [journal de bord](bitacora.md) quel état a été déplacé dans l'adresse, quel état a été remonté dans la disposition, ainsi que le code 404 observé avec Python.

## Résumé

Réponds sans regarder la leçon :

1. Quels sont les quatre manques du panneau à adresse unique qui sont résolus en conservant la vue dans l'adresse ?
2. Que rend une route index ? Pourquoi `servicios/:nombre` ne commence-t-elle pas par un `/` ? Qu'intercepte la route `*` ?
3. Pourquoi le routeur est-il créé au niveau du module, et pourquoi `QueryClientProvider` se place-t-il à l'extérieur de `RouterProvider` ?
4. Pourquoi les notes ont-elles été remontées dans la disposition, et comment les pages y accèdent-elles ?
5. Pourquoi `useParams` type-t-il le paramètre en `string | undefined` ? À quel moment précis `catálogo` est-il encodé et à quel moment est-il décodé ?
6. Pourquoi `PaginaServicio` n'est-elle pas remontée lors du passage de `/servicios/pagos` à `/servicios/inventario`, et quel est le rôle de `key={nombre}` sur `EditorNota` ?
7. Pourquoi les filtres sont-ils lus depuis l'adresse à chaque rendu plutôt que d'être stockés dans un `useState` ? Que change `replace: true` ?
8. Que demande le navigateur au serveur lors d'un rechargement de `/servicios/pagos`, que doit répondre celui-ci, et pourquoi tester avec `vite preview` ne prouve rien quant à la réalité de la production ?
9. Pourquoi `LimiteDeError` a-t-elle cessé d'intercepter les erreurs des pages avec l'arrivée du routeur ? Où déclare-t-on le périmètre qui les capture, pourquoi son affichage remplace-t-il l'en-tête, et à quoi sert le maintien de `LimiteDeError` dans `main.tsx` ?

## Pour aller plus loin

- [React Router, « Picking a Mode »](https://reactrouter.com/start/modes) et [« Installation » (mode de données)](https://reactrouter.com/start/data/installation) : les modes déclaratif, de données et framework, les apports de chacun, et d'où s'importent `createBrowserRouter` et `RouterProvider`. Consulté le 21 octobre 2026.
- [React Router, « Routing » (mode de données)](https://reactrouter.com/start/data/routing) : les routes sous forme d'objets, les routes imbriquées avec `<Outlet />`, les routes index, les segments dynamiques et le caractère générique `*`. Consulté le 21 octobre 2026.
- [React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter) : l'utilisation sous-jacente de `pushState` et `replaceState`, et la recommandation d'instancier le routeur une seule fois en dehors de l'arborescence React. Consulté le 21 octobre 2026.
- [React Router, `useParams`](https://reactrouter.com/api/hooks/useParams) : les paramètres dynamiques de l'adresse et leur typage. Consulté le 21 octobre 2026.
- [React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams) : le couple paramètres et fonction de mise à jour, la forme avec fonction de mise à jour, la mise en garde relative aux appels successifs et à la mutation directe de l'objet. Consulté le 21 octobre 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext) : le partage d'état depuis un parent vers les routes enfants, et la bonne pratique consistant à concevoir un hook dédié avec TypeScript. Consulté le 21 octobre 2026.
- [React Router, `Link`](https://reactrouter.com/api/components/Link) et [`NavLink`](https://reactrouter.com/api/components/NavLink) : la balise `<a href>` améliorée, `replace`, la classe `active`, `aria-current="page"`, la propriété `end` et le cas particulier de `/`. Consulté le 21 octobre 2026.
- [React Router, « Error Boundaries »](https://reactrouter.com/how-to/error-boundary) : la capture des erreurs au niveau d'une route, le périmètre minimal sur la route racine, l'usage de `ErrorBoundary` avec `useRouteError` en mode de données, le traitement des trois cas (`isRouteErrorResponse`, `Error`, toute autre valeur) et la remontée de l'erreur vers le périmètre le plus proche. Consulté le 21 octobre 2026.
- [React Router, « Upgrading from v7 »](https://reactrouter.com/upgrading/v7) : les raisons pour lesquelles la version 8 ne distribue plus `react-router-dom`, et les prérequis de versions pour Node et React. Consulté le 21 octobre 2026.
- [React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state) : la conservation de l'état d'un même composant au même emplacement, et l'usage de `key` pour forcer sa réinitialisation. Consulté le 21 octobre 2026.
- [MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) et [`History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) : l'ajout ou le remplacement d'une entrée dans l'historique de navigation sans déclencher le rechargement de l'adresse. Consulté le 21 octobre 2026.
- [MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) et [`encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) : la lecture et l'écriture de la chaîne de recherche, la conversion de l'espace en `+`, et la liste des caractères à encoder au sein d'un segment d'adresse. Consulté le 21 octobre 2026.
- [Vite, « Shared Options », `appType`](https://vite.dev/config/shared-options) : la valeur par défaut `'spa'` et le mécanisme de secours renvoyant `index.html` sous `vite dev` et `vite preview`. Consulté le 21 octobre 2026.
- [Python, `http.server`](https://docs.python.org/3/library/http.server.html) : le serveur statique intégré en ligne de commande, les options `--directory` et `--bind`, l'erreur 404 retournée face à un fichier introuvable et la recommandation formelle de ne pas l'utiliser en production. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| routeur | la pièce logicielle qui lit l'adresse, décide quels composants afficher et modifie l'adresse sans recharger la page |
| route du client | une adresse qui n'existe que pour le routeur, comme `/servicios/pagos` ; aucun fichier portant ce nom n'existe sur le serveur |
| disposition (*layout*) | le composant d'une route parente : il affiche ce qui ne change pas d'une page à l'autre et réserve un `<Outlet />` pour la page active |
| route index | la route enfant sans `path` qui s'affiche lorsque l'adresse correspond très exactement à celle du parent |
| segment dynamique | la portion d'une route débutant par `:`, comme `:nombre` ; la valeur présente à cet emplacement est injectée sous forme de paramètre |
| recherche (*query string*) | la partie située après le `?` dans une adresse, comme `fallas=1&q=pag` ; elle se lit au moyen de `useSearchParams` |
| encodage par pourcentage | l'écriture des caractères spéciaux dans une adresse à l'aide de `%` suivi de deux chiffres hexadécimaux par octet, comme `á` → `%C3%A1` |
| `replace` | naviguer en remplaçant l'entrée active de l'historique plutôt qu'en en empilant une nouvelle |
| périmètre d'erreur (*error boundary*) | le composant qui s'affiche à la place de son sous-arbre lorsque celui-ci lève une exception lors du rendu ; React Router en place une sur chaque route, et la tienne se déclare via `ErrorBoundary` |
| réécriture (secours SPA) | la règle du serveur qui renvoie `index.html` pour toute adresse ne correspondant pas à un fichier physique, afin que l'application s'initialise et que le routeur prenne la main |

---

**Suivante :** [Leçon 6 — État partagé : reducer et contexte](06-reducer-contexto.md)
