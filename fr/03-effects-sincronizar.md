# Leçon 3 — Effects : synchroniser, pas « quand ça charge »

*Il est 9 h 52 et l'équipe d'astreinte du matin examine le panneau avant la réunion de 10 h. Dans le nouveau `revisor`, on peut déjà choisir un service et voir son détail. L'opératrice clique sur `pagos`, regrette aussitôt son geste et choisit `inventario`. L'en-tête « inventario » apparaît et, en dessous, « Disponible: HTTP 200 en 118 ms ». Elle respire. Une seconde plus tard, sans que personne ne touche à rien, le même encadré bascule sur « En falla: HTTP 503 ». Elle téléphone à l'équipe d'inventario, qui examine ses serveurs pendant quinze minutes sans rien trouver d'anormal. Inventario n'est jamais tombé en panne. Ce qui s'est affiché, c'est la réponse de `pagos`, plus lente, qui est arrivée en retard et s'est écrite par-dessus celle d'`inventario`. Personne n'avait écrit de bogue au sens habituel : chaque ligne de code faisait ce qu'elle disait. Il manquait une ligne pour dire quoi faire lorsque la question n'a plus d'importance. Cette leçon écrit cette ligne et explique pourquoi elle est indispensable.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 3.3 et 3.4)

**Ce que tu construis :** un panneau de détail qui demande au serveur les données du service sélectionné et se réinitialise tout seul quand tu en choisis un autre ; le titre de l'onglet avec le nombre de pannes, `(2) Revisor` ; et la ligne « Actualizado a las … », qui indique quand est arrivé le dernier rapport sans réinitialiser la scrutation toutes les 10 secondes

**Ce que tu apprends :** le cycle d'un Effect : commencer et cesser de synchroniser ; le nettoyage ; la concurrence entre les réponses (race condition), reproduite et corrigée ; `StrictMode` comme test gratuit de l'existence du nettoyage ; des dépendances qui décrivent le code (**le linter ne se fait pas taire**) ; `useEffectEvent` ; les cas où un Effect n'est pas nécessaire

**D'où tu viens.** De la [Leçon 2](02-estado-instantanea-forma.md). Ton `revisor` dispose déjà de la case « Solo fallas », des noms des services sous forme de boutons avec `aria-pressed`, d'une note par service et d'un encadré de détail, `DetalleSeleccion`, qui est **calculé** à partir de la liste : il ne demande rien au serveur, il se contente de réafficher ce que le rapport apportait déjà. Le panneau intègre depuis la [Leçon 0](00-un-proyecto-de-verdad.md) un Effect, celui de `useReporte`, qui appelle `GET /api/estados` toutes les 10 secondes et que `StrictMode` monte deux fois en développement. Cette leçon t'a montré le duo « cancelada por el cliente » + « 200 » dans le journal du serveur et a promis que l'on expliquerait cela en détail ici. Tu travailles dans `~/curso-react/revisor/`, qui au départ est identique au point de contrôle de la Leçon 2.

**Ce que cette leçon ne fait pas.** Elle n'ajoute pas de routes de navigateur : le détail continue d'apparaître sur la même page, sous la liste, et l'adresse `/servicios/pagos` n'arrive qu'à la [Leçon 5](05-rutas-url-como-estado.md). Elle ne remplace pas la récupération manuelle des données par une bibliothèque : ici, tu écris toi-même l'Effect qui demande le détail, avec son nettoyage, pour comprendre quel problème il résout ; selon le plan du cours, à la [Leçon 4](04-estado-del-servidor.md), ce même travail sera confié à TanStack Query. Elle ne comporte pas non plus de tests automatisés : ils arrivent à la [Leçon 8](08-pruebas-de-componentes.md). Et elle n'utilise ni `useMemo`, ni `useCallback`, ni `memo` : le cours ne les introduit jamais sans une mesure qui les réclame, et en 3.6 tu vas voir que le problème que l'on « masque » habituellement avec `useCallback` a ici une solution plus directe.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` du point de contrôle. Dans cette leçon, il n'y a pas eu de réinstallation dans un conteneur Linux : les exécutions du cours ont produit les mêmes noms de fichiers dans `dist/` sous macOS et dans un conteneur `node:24.22.0` pour tous les points de contrôle, et la construction du point de contrôle de cette leçon a donné ici ce même nom (`index-CTkBRgQQ.js`). Rien de ce qui est montré ne dépend du système d'exploitation. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome 155 sans interface graphique (`--headless`), piloté par son protocole de débogage : un script ouvrait la page, attendait, envoyait de vrais clics de souris (les mêmes événements que ceux produits par ta main) et lisait le texte de l'encadré de détail. Les expériences qui cassent le code exprès ont été réalisées sur une **copie** du point de contrôle, et comme sur la même machine tournaient d'autres processus sur les ports habituels, cette copie a utilisé le port 3103 pour le serveur d'entraînement, le 5103 pour Vite et le 9303 pour le protocole de débogage de Chrome. Sur ta machine, ce sont le 3100 et le 5173, et rien d'autre ne change. Une première série d'exécutions dans le navigateur a été écartée et répétée intégralement, parce qu'un autre processus de la machine utilisait le même port de débogage et qu'il n'était pas possible de garantir que les clics provenaient uniquement du script ; les sorties présentées sont toutes issues de la seconde série, et elles ont reproduit ligne par ligne le même comportement que la première. Les heures du journal du serveur sont en UTC ; l'heure de « Actualizado a las … » est l'heure locale du navigateur, qui se trouvait dans le fuseau horaire de Mexico (UTC−6), et c'est pourquoi les deux horloges ne coïncident pas. Les longs chemins affichés par ESLint sont présentés à partir de `~/curso-react`. Les programmes se trouvent dans [`programas/03-effects-sincronizar/`](../programas/03-effects-sincronizar) : `revisor/` est le point de contrôle et les figures se trouvent à ses côtés.

## À la fin, tu seras capable de

- Expliquer avec tes propres mots ce que synchronise chacun des trois Effects du `revisor` (la scrutation, le détail et le titre), ce que fait son corps et ce que défait son nettoyage.
- Reproduire la concurrence entre les réponses (race condition) sur une copie du panneau, la lire dans le journal du serveur et la corriger avec `AbortController` dans le nettoyage.
- Expliquer pourquoi `<PanelDetalle key={seleccionado}>` réinitialise le panneau tout entier, et pourquoi c'est la façon correcte de revenir à « Cargando detalle… » au lieu d'un `setState` à l'intérieur de l'Effect.
- Lire dans le journal le duo « cancelada por el cliente » + « 200 » que produit `StrictMode` et dire ce qu'il démontre.
- Face à un avertissement d'`exhaustive-deps`, modifier le code pour que la liste des dépendances dise la vérité, sans faire taire la règle, et reconnaître quand la vérité est qu'une fonction ne doit pas réinitialiser l'Effect.
- Utiliser `useEffectEvent` pour lire la fonction la plus récente depuis un Effect sans que l'Effect ne se réinitialise, et nommer les deux choses que le linter ne te laisse pas faire avec.
- Repérer dans un composant un Effect qui n'est pas nécessaire (un calcul ou la réponse à un clic) et le déplacer à l'endroit qui lui revient.

## Le pourquoi avant le comment

Dans la Leçon 2, l'encadré de détail ne demandait rien. Il affichait le même `EstadoPublico` qui venait déjà dans la liste. Cela présente un avantage énorme : il n'y a aucun risque qu'il affiche quelque chose de différent de la liste, puisque c'est la liste. Mais l'équipe d'exploitation a demandé plus : combien de fois ce service a-t-il été vérifié et à quand remonte la dernière vérification. Ces données ne figurent pas dans le rapport. Il faut les demander au serveur **par service**, et à cet instant, l'encadré cesse d'être un calcul et devient une conversation avec quelque chose qui vit en dehors de React.

Pose trois questions à cet encadré et tu verras pourquoi un outil est indispensable.

**Quand demande-t-on le détail ?** La réponse tentante est « quand le composant charge ». Cette réponse est précisément celle que cette leçon vient démonter. Le détail ne se demande pas « au chargement » : on le demande **tant que** l'encadré affiche un service, et il cesse d'avoir de l'importance dès qu'il en affiche un autre. Si tu choisis `pagos`, l'écran doit être en accord avec le serveur concernant `pagos`. Si tu passes à `inventario`, l'accord sur `pagos` n'est plus valable et un nouveau commence. Ce n'est pas un événement qui arrive une fois ; c'est une **synchronisation** qui commence et qui finit.

**Que devient l'ancienne question quand tu en poses une nouvelle ?** Le serveur d'entraînement met 1,5 seconde à répondre pour le détail de `pagos` et 0,2 seconde pour les autres. Si tu choisis `pagos` puis immédiatement `inventario`, il y a deux questions en suspens, et celle posée en premier arrive en dernier. Si personne ne dit à la première qu'elle n'a plus d'importance, lorsqu'elle arrivera, elle écrira son résultat dans l'encadré, par-dessus le bon. C'est ce qu'a vu l'opératrice d'astreinte dans la scène d'ouverture.

**Qui est prévenu quand quelque chose change en dehors de React ?** L'onglet du navigateur a un titre. Si le panneau pouvait y indiquer le nombre de pannes, `(2) Revisor`, la personne d'astreinte le verrait même en étant sur un autre onglet. Mais le titre ne fait pas partie de l'arbre de React ; c'est une propriété du document, `document.title`. Quelqu'un doit le maintenir en accord avec l'état du panneau, et le remettre comme il était quand le panneau ne le contrôle plus.

Les trois questions ont la même structure : il y a quelque chose en dehors de React (le serveur, le document, un minuteur) et l'écran doit être en accord avec ce quelque chose. C'est pour cela qu'existe l'Effect. La documentation de React le définit ainsi : les Effects te permettent d'exécuter du code après le rendu pour **synchroniser** ton composant avec un système extérieur à React ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). Remarque le verbe. Elle ne dit pas « exécuter du code quand le composant apparaît ». Elle dit synchroniser. Ce cours répète un principe dans toutes les leçons, et c'est dans cette leçon qu'il naît : **un Effect sert à se synchroniser avec quelque chose qui est en dehors de React ; pas à calculer, pas à réagir à un clic et pas pour « quand ça charge ».**

La leçon comporte sept parties : ce qu'est un Effect, avec le titre de l'onglet comme exemple (3.1) ; le détail demandé au serveur et son nettoyage (3.2) ; la concurrence entre les réponses (race condition), reproduite et corrigée (3.3) ; `StrictMode` comme test gratuit (3.4) ; les dépendances qui décrivent le code (3.5) ; `useEffectEvent` (3.6) ; et les cas où un Effect n'est pas nécessaire (3.7). Voici ce qui change dans ton projet :

```text
revisor/
├── package.json                      ~ versión 0.3.0
├── servidor/practica.ts              ~ agrega GET /api/servicios/:nombre
└── src/
    ├── compartido/
    │   ├── contrato.ts               ~ agrega DetalleServicio y esDetalleServicio
    │   └── useTituloDocumento.ts     + Effect que sincroniza document.title
    ├── detalle/
    │   ├── cargar.ts                 + cargarDetalle(nombre, senal)
    │   ├── useDetalle.ts             + Effect con dependencias [nombre] y limpieza que aborta
    │   └── PanelDetalle.tsx          + el recuadro, con «Cargando detalle…»
    └── reporte/
        ├── ContenidoReporte.tsx      ~ monta <PanelDetalle key={seleccionado}>
        ├── DetalleSeleccion.tsx      − lo reemplaza PanelDetalle
        ├── Panel.tsx                 ~ «Actualizado a las …» y el título (2) Revisor
        └── useReporte.ts             ~ tercer parámetro alRecibir, con useEffectEvent
```

Les marques sont celles du cours : **+** nouveau fichier, **~** fichier modifié et **−** fichier supprimé.

## Les concepts

### 3.1 Qu'est-ce qu'un Effect : commencer et cesser de synchroniser

#### 3.1.1 Deux fonctions, pas un instant

Commençons par la plus petite pièce du nouveau `revisor` : le titre de l'onglet. Voici le hook complet :

```ts
// revisor/src/compartido/useTituloDocumento.ts
import { useEffect } from "react";

export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
```

Un Effect, ce sont **deux fonctions** et une liste. La première est celle que tu passes à `useEffect` : elle indique comment **commencer** à synchroniser. Ici, elle conserve le titre qu'il y avait et met le nouveau. La seconde est celle que cette première **renvoie**, le nettoyage : elle indique comment **cesser** de synchroniser. Ici, elle remet le titre qu'il y avait. La liste, `[titulo]`, indique de quelles valeurs dépend la synchronisation.

La documentation de React insiste sur une façon de penser qui demande un effort au début : un Effect ne peut faire que deux choses, commencer à synchroniser quelque chose et, ensuite, cesser de le synchroniser ([React, « Lifecycle of Reactive Effects »](https://react.dev/learn/lifecycle-of-reactive-effects)). La même page indique qu'il convient de penser du point de vue de l'Effect et non du composant : « concentre-toi toujours sur un seul cycle de démarrage et d'arrêt à la fois ; peu importe que le composant soit en train de se monter, de se mettre à jour ou de se démonter ». Cette phrase fait toute la différence entre ce cours et les explications qui parlent de `useEffect` comme « le `componentDidMount` des fonctions ». Il n'y a ni « au montage » ni « au démontage ». Il y a un cycle qui commence et un cycle qui finit, et il se répète chaque fois que la liste indique que quelque chose a changé.

Quand tourne chaque fonction ? La référence de `useEffect` le dit avec précision : React exécute la fonction de configuration (*setup*) quand le composant est validé à l'écran (le *commit* de la Leçon 1) ; quand les dépendances changent, il exécute d'abord l'ancien nettoyage, avec les anciennes valeurs, puis la nouvelle configuration, avec les nouvelles valeurs ; et quand le composant est retiré, il exécute le nettoyage une dernière fois ([React, « useEffect »](https://react.dev/reference/react/useEffect)). Pour comparer les dépendances, il utilise `Object.is`, qui pour les nombres et les textes compare la valeur, et pour les objets et les fonctions compare **l'identité** : s'il s'agit du même objet en mémoire, et non du même contenu. Garde ce détail en tête ; en 3.5, il est la cause d'un problème sérieux.

Parcours le titre du `revisor` avec cette règle. À l'ouverture de la page, le rapport n'est pas encore arrivé, si bien que `Panel` calcule le titre `"Revisor"`. L'Effect commence : il enregistre `"Revisor"` (celui du `<title>` de `index.html`) et applique `"Revisor"`. Le rapport arrive avec deux pannes et `Panel` calcule `"(2) Revisor"`. La liste a changé, React exécute donc l'ancien nettoyage (il remet `"Revisor"`) puis la nouvelle configuration (il enregistre `"Revisor"` et applique `"(2) Revisor"`). Chaque cycle laisse les choses telles qu'il les a trouvées avant que le suivant ne démarre. C'est ce qui fait que l'ordre n'a pas d'importance.

#### 3.1.2 Dans le `revisor`

`Panel` utilise le hook avec une valeur qu'il **calcule pendant le rendu**, et non qu'il stocke :

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { contarFallas } from "./resumen";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const [actualizadoEn, establecerActualizadoEn] = useState<Date | null>(null);
  const { carga, recargar } = useReporte(cargar, cadaMs, () => establecerActualizadoEn(new Date()));
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  const fallas = carga.tipo === "listo" ? contarFallas(carga.reporte.estados) : 0;
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
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        {actualizadoEn !== null && (
          <p className="actualizado">Actualizado a las {actualizadoEn.toLocaleTimeString("es-MX")}</p>
        )}
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Regarde bien `fallas`. Ce n'est pas un état : c'est une constante calculée à chaque rendu avec `contarFallas`, la fonction pure de la Leçon 1. L'Effect ne calcule rien ; il se contente de **copier** vers le document une valeur que React connaît déjà. Cette répartition du travail est celle que tu retrouveras dans tous les bons Effects : React calcule, l'Effect synchronise. En 3.7, tu verras ce qui arrive quand quelqu'un fait l'inverse. (`actualizadoEn` et le troisième argument de `useReporte` sont expliqués en 3.6.)

Voici ce que Chrome sans interface graphique a lu dans `document.title`, une seconde et demie après avoir ouvert le panneau avec le serveur d'entraînement démarré :

```text
08:28:18.814 document.title = "(2) Revisor"
```

`document.title` est exactement ce que son nom indique : la propriété qui lit ou modifie le titre du document, celui qui apparaît dans l'onglet, et qui modifie en outre le contenu de l'élément `<title>` ([MDN, « Document: title property »](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)). React n'y touche pas de lui-même, car `<title>` vit dans le `<head>` et le panneau s'affiche à l'intérieur de `<div id="raiz">`. C'est, au sens exact de la définition, un système extérieur à React.

React 19 apporte en outre un composant `<title>` que tu peux afficher depuis n'importe quel composant et que React place toujours dans le `<head>` ([React, « <title> »](https://react.dev/reference/react-dom/components/title)). Avec lui, le titre cesserait d'être un système externe et un Effect ne serait pas nécessaire. Ici, on ne l'utilise pas pour une raison précise : `index.html` comporte déjà son `<title>Revisor</title>`, et cette même documentation avertit qu'il ne faut afficher qu'un seul `<title>` à la fois, car avec deux, le comportement des navigateurs et des moteurs de recherche reste indéfini. L'Effect modifie le titre qui existe déjà et le remet comme il était. Si un jour le titre ne vivait que dans React (sans celui de `index.html`), le `<title>` natif serait l'option sans Effect ; sa seule exigence est que l'enfant soit un texte unique, par exemple ``{`(${fallas}) Revisor`}``.

Pourquoi le nettoyage remet-il le titre précédent au lieu de le laisser tel quel ? Parce que l'Effect doit pouvoir être défait. Si demain le panneau n'est affiché que sur l'un de plusieurs écrans (le plan du cours le prévoit pour la Leçon 5), en le quittant, le titre ne doit pas continuer d'afficher `(2) Revisor` sur un écran qui ne montre pas de pannes. Un nettoyage qui reproduit en miroir la préparation permet au hook de fonctionner sans avoir besoin de savoir où il sera utilisé.

### 3.2 Le détail demandé au serveur

#### 3.2.1 La nouvelle route du serveur d'entraînement

Le serveur d'entraînement passe à sa deuxième version. On ne l'explique pas ligne par ligne (le cours porte sur l'interface graphique), mais il est utile de savoir quelle nouvelle route il propose et ce qu'elle renvoie : `GET /api/servicios/:nombre` renvoie le détail d'un service, ou un `404` s'il n'existe pas. Il met 1,5 seconde pour `pagos` et 0,2 seconde pour les autres ; cette différence est introduite exprès, afin qu'en 3.3 tu puisses reproduire la race condition. Interroge-le avec `curl` avant de le mélanger avec quoi que ce soit :

```text
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/pagos
{"nombre":"pagos","estado":{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 1.507730 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/inventario
{"nombre":"inventario","estado":{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 0.207895 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/nada
{"detalle":"no existe el servicio nada"}
404 en 0.203791 s
```

(L'exécution a été réalisée sur le port 3103, comme l'explique « À propos des exécutions ».) `revisiones` compte combien de fois le rapport complet a été demandé depuis le démarrage du serveur, et `ultimaRevision` est l'heure de la dernière fois. Comme personne n'avait encore demandé `GET /api/estados`, ils valent `0` et indiquent l'heure du démarrage.

`contrato.ts` ajoute le type et son garde de type, tout comme `esReportePublico` dans la Leçon 0 : ce qui arrive par le réseau est `unknown` jusqu'à preuve du contraire. Le fichier complet devient :

```ts
// revisor/src/compartido/contrato.ts
export type EstadoPublico =
  | {
      readonly nombre: string;
      readonly tipo: "disponible";
      readonly codigoHttp: number;
      readonly duracionMs: number;
    }
  | {
      readonly nombre: string;
      readonly tipo: "falla";
      readonly detalle: string;
    };

export interface ReportePublico {
  readonly estados: readonly EstadoPublico[];
}

export function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esEstadoPublico(valor: unknown): valor is EstadoPublico {
  if (!esRegistro(valor) || typeof valor.nombre !== "string") {
    return false;
  }

  if (valor.tipo === "disponible") {
    return typeof valor.codigoHttp === "number" && typeof valor.duracionMs === "number";
  }

  return valor.tipo === "falla" && typeof valor.detalle === "string";
}

export function esReportePublico(valor: unknown): valor is ReportePublico {
  return esRegistro(valor) && Array.isArray(valor.estados) && valor.estados.every(esEstadoPublico);
}

export interface DetalleServicio {
  readonly nombre: string;
  readonly estado: EstadoPublico;
  readonly revisiones: number;
  readonly ultimaRevision: string;
}

export function esDetalleServicio(valor: unknown): valor is DetalleServicio {
  return (
    esRegistro(valor) &&
    typeof valor.nombre === "string" &&
    esEstadoPublico(valor.estado) &&
    typeof valor.revisiones === "number" &&
    typeof valor.ultimaRevision === "string"
  );
}
```

`esDetalleServicio` réutilise `esEstadoPublico` pour le champ `estado` : le détail contient en son sein le même `EstadoPublico` que la liste, et il est validé avec le même garde. Comme le serveur d'entraînement importe ces types, `tsc -b` vérifie également que le serveur et l'écran sont en accord.

#### 3.2.2 La frontière réseau

La fonction qui demande le détail suit le modèle de `cargarReporte` : une seule responsabilité, le réseau, et rien de React.

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

Deux détails. Le premier est `encodeURIComponent(nombre)`. L'un des services s'appelle `catálogo`, avec un accent, et dans une URL, les caractères en dehors de l'alphabet anglais voyagent encodés ; le journal du serveur le montre sous la forme `GET /api/servicios/cat%C3%A1logo`, et le serveur le décode en retour. Si un jour un service s'appelait `a/b`, sans encodage, la barre oblique modifierait la route. Le second détail est le paramètre `senal`, un `AbortSignal`. La fonction ne décide pas quand annuler ; elle accepte simplement que quelqu'un, de l'extérieur, puisse le faire. Ce « quelqu'un » est le nettoyage de l'Effect.

Que se passe-t-il quand quelqu'un abandonne ? MDN décrit `AbortController.abort()` ainsi : il interrompt une opération asynchrone avant qu'elle ne soit terminée, ce qui inclut les requêtes `fetch`, la lecture de leur corps et les flux (*streams*) ; si aucune raison n'est fournie, la raison est une exception `DOMException` appelée `AbortError` ([MDN, « AbortController: abort() method »](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)). Pour le dire brièvement : la promesse renvoyée par `fetch` (ou celle de `respuesta.json()`, si l'on était déjà en train de lire le corps) est **rejetée**. Et le navigateur coupe la connexion, ce que le serveur d'entraînement enregistre sous la mention `cancelada por el cliente`.

#### 3.2.3 L'Effect qui demande le détail

Voici le cœur de la leçon. Lis-le avec l'idée de 3.1 en tête : un cycle qui commence et un qui finit.

```ts
// revisor/src/detalle/useDetalle.ts
import { useEffect, useState } from "react";
import type { DetalleServicio } from "../compartido/contrato";
import { cargarDetalle } from "./cargar";

export type CargaDetalle =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly detalle: DetalleServicio }
  | { readonly tipo: "error"; readonly detalle: string };

export function useDetalle(nombre: string): CargaDetalle {
  const [carga, establecerCarga] = useState<CargaDetalle>({ tipo: "cargando" });

  useEffect(() => {
    const control = new AbortController();

    cargarDetalle(nombre, control.signal).then(
      (detalle) => establecerCarga({ tipo: "listo", detalle }),
      (error: unknown) => {
        if (control.signal.aborted) {
          return;
        }

        const detalle = error instanceof Error ? error.message : "falló la carga";
        establecerCarga({ tipo: "error", detalle });
      },
    );

    return () => control.abort();
  }, [nombre]);

  return carga;
}
```

Il commence : il crée un `AbortController` **propre à ce cycle**, demande le détail de `nombre` et lui transmet son signal. Quand la réponse arrive, il écrit `listo` ; s'il échoue, il écrit `error`. Il finit : il annule (*abort*). Et la liste indique `[nombre]`, car `nombre` est la seule chose qui vient de l'extérieur de l'Effect et qui change entre deux rendus.

La forme de l'état respecte la règle de la Leçon 2 : une seule union `CargaDetalle` avec trois cas, et non trois drapeaux (`cargando`, `error`, `datos`) qui pourraient se contredire. C'est la même forme que `Carga` dans `useReporte`.

Regarde la ligne `if (control.signal.aborted) return;`. Quand le nettoyage annule, la promesse est rejetée avec `AbortError`. Sans cette ligne, en développement, tu le verrais sur chaque service que tu choisis : le cycle supplémentaire de `StrictMode` (3.4) annule la première requête, et son rejet arrive au même encadré que tu as sous les yeux, car `StrictMode` nettoie et reconfigure l'Effect **du même composant**, qui conserve son état. Cela a été mesuré sur une copie sans cette ligne, avec Chrome sans interface graphique, en choisissant `pagos` et, une fois chargé, `inventario` :

```text
08:39:27.086 clic en pagos
08:39:27.237 aside:
pagos

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.939 aside:
pagos
Estado
En falla: HTTP 503
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.945 clic en inventario
08:39:29.045 aside:
inventario

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre inventario
Guardar nota
Cerrar detalle
08:39:29.547 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Une fausse erreur à l'écran pendant 1,7 seconde avec `pagos` et 0,5 seconde avec `inventario`, jusqu'à ce que la bonne réponse vienne la remplacer. Le texte « signal is aborted without reason » est celui de Chrome ; d'autres navigateurs écrivent autre chose. En production, sans le cycle supplémentaire, tu ne le verrais pas avec ce point de contrôle, parce que la `key` démonte l'ancien panneau et que son rejet n'a personne à qui écrire ; mais sans `key`, tu le verrais aussi à chaque changement de service. Une annulation **n'est pas une erreur** : c'est la façon dont ce cycle dit « cela ne m'importe plus ». C'est pourquoi on le reconnaît et on l'ignore. Remarque bien ce que l'on vérifie : non pas la nature de l'erreur, mais si **mon** contrôleur a annulé la requête. Si le serveur tombe en panne et que de surcroît l'utilisateur change de service au même moment, la bonne question est « est-ce que ce cycle est toujours d'actualité ? », et non « de quel genre d'erreur s'agit-il ? ».

Et remarque ce qu'il **ne fait pas** : il n'écrit pas `establecerCarga({ tipo: "cargando" })` au démarrage. Quand tu changes de service, l'encadré doit revenir à « Cargando detalle… », mais ce n'est pas l'Effect qui s'en charge. C'est la `key`, et la raison occupe toute la section 3.3.4. Pour l'instant, retiens cet indice : l'état initial est `{ tipo: "cargando" }`, et le seul moment où il est utilisé, c'est à la naissance du composant.

`establecerCarga` est bel et bien appelée dans l'Effect, mais uniquement au sein des fonctions transmises à `.then(...)`, c'est-à-dire quand la réponse **arrive de l'extérieur**. C'est exactement la forme que la Leçon 0 t'a montrée comme autorisée : un Effect qui s'abonne à quelque chose d'externe et modifie l'état quand cet élément répond.

L'encadré utilise le hook et affiche les trois cas :

```tsx
// revisor/src/detalle/PanelDetalle.tsx
import { EditorNota } from "../reporte/EditorNota";
import { useDetalle } from "./useDetalle";

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
  const carga = useDetalle(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {carga.tipo === "cargando" && <p role="status">Cargando detalle…</p>}
      {carga.tipo === "error" && <p role="alert">No se pudo cargar el detalle: {carga.detalle}</p>}
      {carga.tipo === "listo" && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {carga.detalle.estado.tipo === "disponible"
              ? `Disponible: HTTP ${carga.detalle.estado.codigoHttp} en ${carga.detalle.estado.duracionMs} ms`
              : `En falla: ${carga.detalle.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{carga.detalle.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{carga.detalle.ultimaRevision}</dd>
        </dl>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

Compare-le avec le `DetalleSeleccion` de la Leçon 2, que ce fichier remplace. Ce dernier recevait l'`estado` déjà résolu et appliquait `key={estado.nombre}` à `EditorNota` pour que le brouillon ne traîne pas d'un service à l'autre. Celui-ci reçoit uniquement le `nombre` et le texte de la note enregistrée, et l'`EditorNota` ne porte plus de `key`. Ce n'est pas un oubli : la `key` est montée d'un étage, sur le `PanelDetalle` complet, et depuis là, elle réinitialise tout ce qui se trouve à l'intérieur, éditeur compris. Les textes « Cargando detalle… » avec `role="status"` et l'erreur avec `role="alert"` suivent la bonne pratique d'accessibilité du cours : un lecteur d'écran annonce les changements de ces deux régions sans que la personne n'ait à les chercher.

Enfin, `ContenidoReporte` monte l'encadré :

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { PanelDetalle } from "../detalle/PanelDetalle";
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
      const existe = estados.some((estado) => estado.nombre === seleccionado);

      return (
        <>
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
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

La sélection reste l'identifiant, `seleccionado: string | null`, comme le demandait la Leçon 2. `existe` est **calculé** : si le service sélectionné disparaît de la liste dans le rapport suivant, l'encadré s'en va tout seul, sans que personne n'ait à penser à réinitialiser la sélection. Et là se trouve, sur une seule ligne, la pièce qui fait la moitié du travail de cette leçon : `key={seleccionado}`.

Mis bout à bout, voici ce que fait le panneau quand tu choisis `pagos` et, 300 millisecondes plus tard, `inventario` (mesuré avec Chrome sans interface graphique sur le point de contrôle sans modification) :

```text
08:28:18.833 clic en pagos
08:28:19.136 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:19.140 clic en inventario
08:28:19.642 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:21.644 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Une demi-seconde après le second clic, l'encadré affiche déjà `inventario`, et deux secondes plus tard, quand la réponse de `pagos` aurait largement eu le temps d'arriver, il continue d'indiquer la bonne information. Et voici le journal du serveur pendant l'intégralité du test, depuis l'ouverture de la page :

```text
08:28:17.462 GET /api/estados cancelada por el cliente
08:28:17.763 GET /api/estados 200
08:28:18.836 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/inventario cancelada por el cliente
08:28:19.347 GET /api/servicios/inventario 200
```

Six lignes, et chacune a une cause que tu peux désormais nommer. Les deux premières forment le duo de `StrictMode` pour le rapport, le même que dans la Leçon 0. La troisième est le premier cycle du détail de `pagos`, que `StrictMode` a démarré et nettoyé aussitôt (3.4). La quatrième est le second cycle de `pagos`, le vrai, annulé 310 millisecondes plus tard parce que tu as choisi `inventario` : c'est **cela**, le nettoyage qui corrige la race condition. La cinquième et la sixième forment le duo de `StrictMode` pour `inventario`, dont l'encadré est né à nouveau grâce à la `key`. Aucune réponse de `pagos` n'est parvenue au panneau, parce qu'elle ne s'est jamais terminée.

### 3.3 La concurrence entre les réponses (race condition)

#### 3.3.1 La race condition en miniature

Avant de casser le `revisor`, regarde la race condition de manière isolée, sans serveur, sans réseau et sans `key`. La première figure monte deux versions du même composant dans un DOM de test. Toutes deux demandent un détail avec une fausse fonction qui met 300 ms pour `pagos` et 20 ms pour les autres. La seule différence est que l'une a un nettoyage et l'autre non. À chacune, on demande `pagos` et, immédiatement, `inventario` :

```tsx
// fig03_01.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// pagos tarda 300 ms y los demás 20 ms, como en el servidor de práctica (allá, 1500 y 200).
const DEMORA_MS: Readonly<Record<string, number>> = { pagos: 300 };

function cargarDetalle(nombre: string, senal: AbortSignal): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => resolver(`detalle de ${nombre}`), DEMORA_MS[nombre] ?? 20);
    senal.addEventListener("abort", () => {
      clearTimeout(temporizador);
      rechazar(new Error(`${nombre}: petición cancelada`));
    });
  });
}

function DetalleSinLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto);
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

function DetalleConLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto, (error: unknown) => {
      if (control.signal.aborted) {
        console.log(`  (${error instanceof Error ? error.message : "cancelada"})`);
      }
    });

    return () => control.abort();
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function elegirPagosYLuegoInventario(
  titulo: string,
  Detalle: ComponentType<{ readonly nombre: string }>,
): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => raiz.render(<Detalle nombre="pagos" />));
  await act(async () => raiz.render(<Detalle nombre="inventario" />));
  await act(async () => esperar(100));
  console.log(`  a los 100 ms: ${contenedor.textContent}`);
  await act(async () => esperar(400));
  console.log(`  a los 500 ms: ${contenedor.textContent}`);
  await act(async () => raiz.unmount());
}

await elegirPagosYLuegoInventario("sin limpieza:", DetalleSinLimpieza);
await elegirPagosYLuegoInventario("con limpieza:", DetalleConLimpieza);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_01.tsx
$ node fig03_01.js
sin limpieza:
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de pagos
con limpieza:
  (pagos: petición cancelada)
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de inventario
```

Les deux versions affichent ce qui est attendu à 100 ms. La différence apparaît après. **Sans nettoyage**, à 500 ms, le paragraphe indique `inventario: detalle de pagos` : l'en-tête appartient à un service et les données à un autre. C'est la scène d'ouverture de la leçon en quatre mots. **Avec nettoyage**, le passage de `pagos` à `inventario` a exécuté le nettoyage du premier cycle, qui a annulé la requête de `pagos` ; sa promesse a été rejetée (c'est pourquoi la ligne entre parenthèses apparaît, affichée par le gestionnaire de rejet) et elle n'en est jamais venue à appeler `establecerTexto`.

Pourquoi l'ancienne réponse gagne-t-elle ? Parce que les deux questions sont parties presque en même temps et que chacune arrive quand elle arrive. La documentation de React nomme cela exactement ainsi : ce sont des erreurs de **situation de compétition** (*race condition*), car deux opérations asynchrones « se font la course » et peuvent arriver dans un ordre inattendu ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). La référence de `useEffect` le résume en une phrase qu'il convient de retenir : les réponses du réseau peuvent arriver dans un ordre différent de celui dans lequel tu les as envoyées ([React, « useEffect »](https://react.dev/reference/react/useEffect)). Aucune ligne n'est erronée ; ce qui manque, c'est une ligne qui dise quoi faire de la question qui n'a plus d'importance.

#### 3.3.2 Annuler ou ignorer

La documentation de React propose deux façons de nettoyer un Effect qui demande des données : « si ton Effect demande quelque chose, la fonction de nettoyage doit **annuler** (*abort*) la requête ou **ignorer** son résultat » ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). Ses exemples utilisent la seconde, avec une variable locale :

```ts
// forma con bandera, como en la documentación de React (fragmento)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then((detalle) => {
    if (!ignorar) {
      establecerCarga({ tipo: "listo", detalle });
    }
  });

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

Le drapeau empêche l'ancienne réponse d'écrire dans l'état, et la même page précise qu'un drapeau explicite est la façon la plus fiable de corriger ce genre de problème. Elle en donne aussi la raison : après le `fetch`, d'autres étapes asynchrones peuvent être enchaînées ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). L'annulation arrête uniquement ce qui écoute le signal ; le drapeau bloque toute écriture, d'où qu'elle vienne. Le `revisor` utilise l'autre méthode, `AbortController`, pour trois raisons concrètes. La première : le `revisor` l'employait déjà depuis la leçon 9 de TypeScript, dans `useReporte`, et il est préférable que les deux hooks se ressemblent. La deuxième : annuler ne se contente pas d'ignorer le résultat, cela **coupe la connexion**, et le serveur cesse de travailler sur une réponse que personne ne lira ; avec le drapeau, l'ancienne requête continue de voyager intégralement. La troisième : on peut le voir, car le serveur note `cancelada por el cliente`. Les deux approches respectent la règle d'or de la documentation : faire en sorte que la requête qui n'a plus d'importance ne continue pas d'affecter l'application. Annuler ménage en plus le serveur. Et ici, l'abandon suffit pour une raison précise : dans `cargarDetalle`, tout ce qui est asynchrone écoute le signal (`fetch` et `respuesta.json()`), et après cela, il n'y a que du code synchrone. Si un jour tu ajoutes un autre `await` qui ne le reçoit pas, l'argument de la documentation devient le tien : vérifie également `control.signal.aborted` avant d'écrire le succès, ou combine les deux approches.

Le prix de l'annulation est la ligne `if (control.signal.aborted) return;` : comme la promesse est rejetée, il faut distinguer l'annulation d'un échec. Avec le drapeau, il n'y a aucun rejet à distinguer. C'est un coût modeste, et c'est pourquoi les deux approches sont valables. Ce qui n'est pas valable, c'est de n'utiliser ni l'une ni l'autre.

#### 3.3.3 La reproduire dans le `revisor`

À présent, casse le `revisor`. Fais-le sur une copie ou remets le fichier en état à la fin : on ne touche pas au point de contrôle. L'expérience évidente consiste à retirer le nettoyage de `useDetalle`, la ligne `return () => control.abort();`, à choisir `pagos` et, aussitôt, `inventario`. **Avant de continuer à lire, prédis ce que l'encadré va afficher au bout de deux secondes.**

Voici ce qu'a mesuré Chrome sans interface graphique avec cette unique modification :

```text
08:28:25.305 clic en pagos
08:28:25.606 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:25.609 clic en inventario
08:28:26.110 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:28.113 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Si tu as prédit « En falla: HTTP 503 », tu t'es trompé, tout comme la première version des notes de ce cours. L'encadré affiche la bonne information aux deux moments, à 500 ms et à deux secondes et demie. Il n'y a plus de race condition ? Regarde le journal du serveur :

```text
08:28:23.850 GET /api/estados cancelada por el cliente
08:28:24.150 GET /api/estados 200
08:28:25.812 GET /api/servicios/inventario 200
08:28:26.014 GET /api/servicios/inventario 200
08:28:26.807 GET /api/servicios/pagos 200
08:28:28.122 GET /api/servicios/pagos cancelada por el cliente
```

La race condition s'est **bel et bien** produite sur le réseau : plus personne n'annule rien, et la réponse de `pagos` est arrivée complète à 26.807, presque une seconde **après** la première d'`inventario`. Mais elle n'a pas atteint l'écran. La raison en est `key={seleccionado}`. Quand tu as choisi `inventario`, la `key` a changé et React n'a pas mis à jour le `PanelDetalle` de `pagos` : il l'a **retiré** et en a monté un nouveau. La documentation l'énonce ainsi : lorsque tu retires un composant, React détruit son état ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). La réponse de `pagos` a appelé le `establecerCarga` d'un composant qui n'existait plus, et cet appel n'a personne à modifier. (La dernière ligne, le `pagos` annulé à 28.122, correspond à la fermeture de l'onglet par le script. Elle est expliquée en 3.4.)

Le nettoyage est-il donc superflu ? Non, et pour le constater, il faut retirer également l'autre défense. Avec la `key` supprimée de `ContenidoReporte` **et** sans `control.abort()`, le même script a mesuré ceci :

```text
08:28:31.746 clic en pagos
08:28:32.048 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:32.051 clic en inventario
08:28:32.553 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:34.555 aside:
inventario
Estado
En falla: HTTP 503
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Voilà la scène de l'astreinte, mesurée : à 500 ms, l'encadré dit la vérité sur `inventario`, et à deux secondes et demie, il affiche « En falla: HTTP 503 », l'état de `pagos`, sous l'en-tête « inventario ». Le journal explique pourquoi :

```text
08:28:30.292 GET /api/estados cancelada por el cliente
08:28:30.592 GET /api/estados 200
08:28:32.252 GET /api/servicios/inventario 200
08:28:33.247 GET /api/servicios/pagos 200
08:28:34.563 GET /api/servicios/pagos cancelada por el cliente
```

Sans `key`, le `PanelDetalle` est **le même** avant et après le second clic : seule sa propriété `nombre` a changé. L'Effect de `useDetalle` a exécuté un nouveau cycle pour `inventario`, mais le cycle de `pagos` n'a jamais été nettoyé, et quand sa réponse est arrivée, elle a écrit dans l'état du composant même qui affiche maintenant `inventario`. C'est exactement la figure 1, avec un vrai réseau.

Quand tu rétablis le nettoyage en laissant le panneau sans `key`, la race condition disparaît : le changement de `nombre` exécute le nettoyage du cycle de `pagos`, qui annule la requête, et l'ancienne réponse n'arrive plus. Le script l'a confirmé avec le journal (le `pagos` du second cycle apparaît en `cancelada por el cliente` quatre millisecondes après le clic sur `inventario`, à 38.511) et avec l'encadré, qui est resté sur « Disponible: HTTP 200 en 118 ms ». Mais cette version présente un autre défaut, et c'est la raison pour laquelle le point de contrôle utilise les deux défenses. Mesuré lors de la même exécution, en choisissant `pagos`, en attendant qu'il charge et en passant à `catálogo` :

```text
08:28:43.036 clic en catálogo
08:28:43.077 aside:
catálogo
Estado
En falla: HTTP 503
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
08:28:43.678 aside:
catálogo
Estado
Disponible: HTTP 200 en 42 ms
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
```

Quarante millisecondes après le clic, l'encadré affiche « catálogo » et en dessous « En falla: HTTP 503 » : les données de `pagos`, restées là parce que personne n'a remis l'état à `cargando`. Deux cents millisecondes plus tard, la bonne réponse arrive et cela se corrige. Ce n'est pas une race condition (il n'y a pas d'ancienne réponse qui écrit en retard), mais pendant un court instant, l'écran ment tout autant. L'opératrice de la scène, si elle regarde à cet instant précis, téléphone elle aussi à inventario.

#### 3.3.4 Deux défenses, et pourquoi la `key` n'est pas une astuce

Récapitule ce qui a été mesuré :

| `key={seleccionado}` | nettoyage qui annule | Ce que l'on voit au changement de service |
|---|---|---|
| non | non | l'ancienne réponse écrase la nouvelle (la scène) |
| non | oui | pas de race condition, mais les données du service précédent sont visibles jusqu'à l'arrivée de la nouvelle réponse |
| oui | non | l'écran est correct ; l'ancienne réponse voyage entièrement et est jetée |
| oui | oui | « Cargando detalle… » puis la donnée correcte ; l'ancienne requête est coupée |

La dernière ligne correspond au point de contrôle. Pourquoi la `key` et non un `establecerCarga({ tipo: "cargando" })` au début de l'Effect, ce qui semblerait naturel pour la deuxième ligne ? Parce que le linter ne te le permet pas, et il a raison. Cette tentative produit l'erreur `set-state-in-effect` que tu verras en détail dans « L'erreur que tu vas voir ». La règle explique que modifier l'état immédiatement à l'intérieur d'un Effect force React à redémarrer le cycle de rendu complet avant même que le navigateur ne peigne l'écran ([React, « set-state-in-effect »](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)) : React calcule l'encadré avec les anciennes données, le valide, exécute l'Effect, l'Effect demande un autre rendu, et React effectue à nouveau le rendu. Un rendu jeté à la poubelle.

La `key` ne souffre pas de ce problème, car elle ne corrige pas l'état après coup : elle fait en sorte que l'état **naisse** correctement. La documentation de React la propose exactement pour ce cas, dans la section « Réinitialiser tout l'état quand une propriété change » : lorsque la `key` change, React recrée le composant et réinitialise son état ainsi que celui de tous ses enfants ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)). Et sa page sur l'état dit la même chose depuis l'autre perspective : spécifier une `key` indique à React d'utiliser la `key` comme partie intégrante de la position du composant, plutôt que son ordre au sein du parent ([React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state)). Pour React, `<PanelDetalle key="pagos">` et `<PanelDetalle key="inventario">` sont deux composants distincts qui ne partagent rien. La Leçon 2 a utilisé cet outil pour le brouillon de la note ; ici, on l'utilise pour le panneau tout entier : l'état du chargement, le brouillon de l'éditeur et l'Effect.

La `key` a une conséquence que tu dois connaître : l'encadré est monté à nouveau, et avec `StrictMode`, cela signifie que l'Effect de `useDetalle` effectue son cycle supplémentaire à chaque changement de service. Tu l'as vu dans le journal : chaque service choisi laisse généralement un duo `cancelada` + `200`. C'est le coût en développement du test gratuit, et en production, il n'existe pas. (On dit « généralement » : comme l'a précisé la Leçon 0, la ligne `cancelada` n'apparaît que si la connexion a eu le temps d'atteindre le serveur avant l'annulation.)

Et pourquoi conserver le nettoyage si la `key` protège déjà l'écran ? Parce que la `key` protège **cet** écran, monté **ainsi**. Le nettoyage protège le hook où que tu l'utilises. Si le détail devenait une page avec sa propre URL, comme le prévoit le plan pour la Leçon 5, le même composant pourrait recevoir un autre `nombre` sans se démonter lors de la navigation de `/servicios/pagos` à `/servicios/inventario`. Un hook qui ne fonctionne que si la personne qui l'utilise pense à lui adjoindre une `key` est un hook avec un piège caché. De plus, avec la seule `key`, la réponse de `pagos` a voyagé jusqu'au bout : 1,5 seconde de travail du serveur et du réseau pour rien. La règle énoncée par la documentation de React ne souffre aucune exception : « ta fonction de nettoyage doit s'assurer que la requête qui n'a plus d'importance ne continue pas d'affecter ton application » ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). La `key` règle ce qui se voit ; le nettoyage règle ce qui se passe.

### 3.4 `StrictMode` : le test gratuit

#### 3.4.1 Ce qu'il fait avec les Effects

La Leçon 0 t'a appris à lire le duo « cancelada por el cliente » + « 200 ». Tu peux désormais comprendre ce qu'il vérifie. La référence de `useEffect` le formule ainsi : avec `StrictMode` activé, React exécute un cycle supplémentaire de configuration et de nettoyage, **uniquement en développement**, avant la première véritable configuration ; c'est un test de résistance qui vérifie que le nettoyage reproduit en miroir la configuration et interrompt ou annule ce que la configuration est en train de faire ([React, « useEffect »](https://react.dev/reference/react/useEffect)). Et elle donne une règle pour savoir si le test est réussi : **l'utilisateur ne devrait pas être en mesure de distinguer un Effect s'exécutant une seule fois (comme en production) de la séquence configurer → nettoyer → configurer (comme en développement).**

Applique cette règle au détail. En développement, lors du choix de `pagos` :

1. React monte `PanelDetalle`. L'Effect commence : il crée `control₁` et demande `pagos` avec son signal.
2. `StrictMode` simule le départ du composant : il exécute le nettoyage, qui annule `control₁`. Le serveur note `cancelada por el cliente`.
3. `StrictMode` simule son retour : l'Effect recommence, crée `control₂` et demande à nouveau `pagos`. C'est cette requête qui remplit l'encadré.

L'utilisateur peut-il distinguer cela d'une seule requête ? Non : il voit « Cargando detalle… » puis le détail, exactement comme en production. Test réussi. Imagine maintenant l'Effect **sans** nettoyage (l'expérience de 3.3.3 avec `key`). À l'étape 2, rien n'est annulé ; les deux requêtes voyagent et toutes deux arrivent. Dans ce panneau, les deux réponses sont identiques et cela ne se remarque pas, mais le serveur a travaillé deux fois plus et le second `200` dans le journal le trahit bel et bien. Avec un Effect qui, au lieu de demander des données, s'abonnait à quelque chose (un intervalle, une connexion), l'étape 2 laisserait **deux** abonnements actifs, et cela se verrait.

C'est pourquoi la documentation invite à changer la question : la bonne question n'est pas « comment faire pour que l'Effect ne tourne qu'une seule fois ? », mais « comment corriger mon Effect pour qu'il fonctionne après avoir été remonté ? » ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). La même page met en garde contre le remède que tout le monde tente au début, une référence qui empêche la seconde exécution : il ne suffit pas de faire tourner l'Effect une seule fois, car le problème mis au jour par `StrictMode` survient également en production chaque fois que l'utilisateur quitte l'écran et y revient.

#### 3.4.2 Lire le journal avec ce que tu sais déjà

Reviens au journal du point de contrôle sans modification, en 3.2.3. Chaque ligne raconte désormais une histoire complète (avec la précision de la Leçon 0 : une ligne `cancelada` du cycle supplémentaire n'apparaît que si la connexion a eu le temps d'atteindre le serveur avant l'annulation ; si elle manque sur ta machine, ce n'est pas que `StrictMode` est désactivé) :

- `GET /api/estados cancelada por el cliente` et `GET /api/estados 200`, à l'ouverture : le cycle supplémentaire de la scrutation. Le nettoyage de `useReporte` annule la requête et arrête en outre l'intervalle ; s'il ne l'arrêtait pas, il y aurait deux intervalles interrogeant le serveur toutes les dix secondes.
- `GET /api/servicios/pagos cancelada por el cliente`, au premier clic : le cycle supplémentaire du détail de `pagos`.
- `GET /api/servicios/pagos cancelada por el cliente`, 310 ms plus tard : ce n'est pas `StrictMode`. C'est le vrai nettoyage, celui qui s'exécute parce que tu as choisi un autre service et que la `key` a démonté le panneau.
- Le duo d'`inventario` : le cycle supplémentaire du nouveau panneau, puis la requête qui remplit l'écran.

Remarque quelque chose que le journal ne montre pas : il manque le `200` du second cycle de `pagos`. Il n'est jamais arrivé, car le nettoyage l'a interrompu en cours de route. Cette absence, c'est la race condition corrigée.

Il y a un détail de plus dans les journaux de 3.3.3 qu'il convient d'expliquer afin qu'il ne t'induise pas en erreur si tu le constates. Dans l'expérience avec `key` et sans nettoyage, les deux requêtes d'`inventario` (celle du cycle supplémentaire et la vraie, identiques) ne sont pas parvenues au serveur ensemble, mais à 200 ms d'intervalle, et la seconde requête identique de `pagos` était toujours en attente lorsque le script a fermé l'onglet, raison pour laquelle elle apparaît en `cancelada por el cliente` à 28.122. Ce qui a été observé, c'est que Chrome n'a pas envoyé la seconde requête vers la même adresse tant que la première n'était pas terminée. Cela coïncide avec le verrou du cache HTTP de Chromium, qui n'autorise l'écriture que d'une seule requête à la fois par adresse pour ne pas télécharger deux fois la même chose ([Chromium, changement 8aacaf3](https://chromium.googlesource.com/chromium/src.git/+/8aacaf38e85c45876c72ea77e36ef17e5ab69c26)) ; Chrome ne documente pas cela comme un comportement officiel et nous n'avons pas poussé l'investigation plus loin, car ce n'est pas l'objet du cours, et cela ne change aucune des conclusions de la leçon : ce qui compte, c'est quelle réponse parvient à l'écran, et cela a été mesuré dans l'encadré, pas dans le journal.

#### 3.4.3 La tentation de le retirer

La première réaction face à deux requêtes consiste à retirer `StrictMode`. La documentation l'autorise et le déconseille dans la même phrase : on peut le désactiver, mais l'équipe de React recommande de le laisser activé ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). Tu en as maintenant la démonstration chiffrée. Dans l'expérience sans nettoyage, `StrictMode` t'a montré deux `200` là où il aurait dû y avoir un `cancelada` et un `200`, **avant** même que quiconque ne choisisse deux services à la suite. Le retirer aurait précisément masqué ce signal.

Le cycle supplémentaire n'existe pas non plus dans la version publiée. La Leçon 0 l'a mesuré avec `npm run preview` : une seule requête à l'ouverture de la page.

### 3.5 Les dépendances décrivent le code

#### 3.5.1 Tu ne choisis pas tes dépendances

Jusqu'ici, les listes de dépendances du `revisor` étaient évidentes : `[nombre]`, `[titulo]`, `[cargar, cadaMs, intento]`. Arrive à présent un cas qui ne l'est pas, et qui justifie le principe que le cours répète à chaque leçon.

L'équipe d'exploitation a demandé une ligne : « Actualizado a las 2:28:53 a.m. », sous la liste, indiquant quand est arrivé le dernier rapport. L'information « un rapport est arrivé », c'est `useReporte` qui la détient ; l'endroit où la ligne est affichée, c'est `Panel`. La façon de les relier est la pratique courante dans React : `Panel` transmet au hook une fonction, `alRecibir`, et le hook l'appelle dès qu'un rapport arrive. Le nom suit la règle du cours : les props de type fonction commencent par `al`.

La première tentative consiste à appeler `alRecibir` à l'intérieur de l'Effect, après `establecerCarga`, sans toucher à rien d'autre. ESLint réagit ainsi (mesuré sur une copie) :

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  43:6  warning  React Hook useEffect has a missing dependency: 'alRecibir'. Either include it or remove the dependency array. If 'alRecibir' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

L'avertissement dit la vérité : l'Effect **utilise** `alRecibir` et la liste ne la mentionne pas. Si tu laissais les choses en l'état (ou si tu faisais taire la règle avec un commentaire), l'Effect conserverait pour toujours la fonction `alRecibir` du premier rendu. Ici, cela ne se remarquerait pas, car toutes les versions de la fonction font la même chose, mais le jour où la fonction lirait quelque chose dans l'état de `Panel`, elle lirait la valeur du premier rendu. La documentation de React donne un nom à cela, les **valeurs périmées** (*stale values*), et fait une promesse : si tu ne fais jamais taire le linter, tu ne rencontreras jamais de problème de valeurs périmées ([React, « Lifecycle of Reactive Effects »](https://react.dev/learn/lifecycle-of-reactive-effects)).

Cette même page est catégorique sur l'idée de fond : **tu ne peux pas « choisir » tes dépendances.** Elles doivent inclure chaque valeur réactive lue par l'Effect, et le linter veille à son application. Les valeurs réactives sont les props, l'état et tout ce qui est déclaré à l'intérieur du composant, car ces valeurs sont calculées pendant le rendu et peuvent changer d'un rendu à l'autre. La page consacrée à la suppression des dépendances formule cela à l'inverse, avec une phrase qui constitue le principe directeur du cours : la liste **décrit** ton code ; pour changer la liste, change le code ([React, « Removing Effect Dependencies »](https://react.dev/learn/removing-effect-dependencies)).

#### 3.5.2 Obéir au linter sans réfléchir : la boucle

Obéis donc à l'avertissement au pied de la lettre et ajoute `alRecibir` à la liste : `[cargar, cadaMs, intento, alRecibir]`. Le linter est satisfait :

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0

```

Au vert. Ouvre maintenant le panneau. Voici ce que le serveur d'entraînement a enregistré au cours des cinq premières secondes où la page est restée ouverte dans Chrome sans interface graphique, sans le moindre clic :

```text
08:28:45.991 GET /api/estados cancelada por el cliente
08:28:46.292 GET /api/estados 200
08:28:46.602 GET /api/estados 200
08:28:46.907 GET /api/estados 200
08:28:47.210 GET /api/estados 200
08:28:47.514 GET /api/estados 200
08:28:47.819 GET /api/estados 200
08:28:48.123 GET /api/estados 200
08:28:48.428 GET /api/estados 200
08:28:48.730 GET /api/estados 200
08:28:49.036 GET /api/estados 200
08:28:49.340 GET /api/estados 200
08:28:49.645 GET /api/estados 200
...
08:28:50.565 GET /api/estados 200
08:28:50.870 GET /api/estados 200
08:28:50.944 GET /api/estados cancelada por el cliente
```

Dix-huit lignes au total : **seize** réponses `200` et deux annulées, en cinq secondes, alors que le panneau ne devait en demander qu'**une seule** (la scrutation a lieu toutes les dix secondes). Cela représente une requête toutes les 300 ms, ce qui correspond exactement au délai de réponse du serveur : le panneau demande, attend la réponse, et dès qu'elle arrive, demande à nouveau. Indéfiniment. (La dernière requête annulée correspond au script fermant l'onglet.)

Suis l'enchaînement avec ce que tu sais de 3.1 :

1. Un rapport arrive et l'Effect appelle `alRecibir`.
2. `alRecibir` vaut `() => establecerActualizadoEn(new Date())` : elle modifie l'état de `Panel`.
3. `Panel` se réaffiche, et lors de ce rendu, crée **une autre** fonction fléchée pour `alRecibir`. Elle a le même texte, mais c'est un autre objet en mémoire.
4. React compare les dépendances avec `Object.is`. Pour les fonctions, cela compare l'identité : la nouvelle fonction **n'est pas** l'ancienne. La liste a changé.
5. React exécute le nettoyage (annule la requête et arrête l'intervalle) et redémarre l'Effect, qui demande un rapport immédiatement. Retour à l'étape 1.

La documentation de React décrit exactement ce mécanisme avec un objet `options` : chaque objet et chaque fonction nouvellement créés sont considérés comme distincts de tous les autres, peu importe que leur contenu soit identique, et c'est pourquoi un Effect qui en dépend se resynchronise plus que nécessaire ([React, « Removing Effect Dependencies »](https://react.dev/learn/removing-effect-dependencies)). Et remarque ce que cela implique pour la question « combien de fois l'intervalle est-il réinitialisé ? » : **à chaque rendu de `Panel`**. Avec ce `Panel`, à chaque rapport qui arrive, ce qui transforme la réinitialisation en boucle infinie. Sans cette boucle (si `alRecibir` ne modifiait pas l'état), chaque clic sur la case « Solo fallas » ou sur un service recalculerait également `Panel` et réinitialiserait l'intervalle : la scrutation de dix secondes repartirait de zéro chaque fois que quelqu'un clique.

Voici le point le plus important de cette section : **un linter au vert ne signifie pas que le code est bon. Il signifie que la liste ne ment pas.** La liste mentait quand `alRecibir` manquait, et le linter a averti. En l'ajoutant, elle a cessé de mentir, et la vérité est apparue au grand jour : tel qu'il est écrit, cet Effect dépend **bel et bien** d'une fonction qui change à chaque rendu. Le linter a accompli sa tâche. Ce qui ne va pas, c'est la conception, et cela se corrige en modifiant le code.

#### 3.5.3 Les solutions proposées par la documentation

La page « Lifecycle of Reactive Effects » énumère ce qu'il convient de faire lorsque la suggestion du linter provoque une boucle ou resynchronise trop souvent. En résumé, il y a quatre pistes : vérifier si l'Effect n'est pas en réalité un seul processus de synchronisation ou deux processus entremêlés, et les séparer ; déplacer les valeurs non réactives hors du composant ou à l'intérieur de l'Effect ; utiliser les Effect Events pour lire les props et l'état les plus récents sans resynchroniser ; et éviter les objets et fonctions créés pendant le rendu comme dépendances ([React, « Lifecycle of Reactive Effects »](https://react.dev/learn/lifecycle-of-reactive-effects)). Regarde lesquelles s'appliquent ici :

- **Déplacer la fonction à l'intérieur de l'Effect ?** Impossible : elle est écrite par `Panel`, qui est un autre composant.
- **Déplacer la fonction hors de `Panel` ?** Impossible non plus : elle appelle `establecerActualizadoEn`, qui n'existe qu'à l'intérieur.
- **`useCallback` dans `Panel` ?** C'est ce que suggère l'avertissement lui-même. Cela fonctionnerait ici, car `establecerActualizadoEn` ne change jamais, mais cela déplace le fardeau sur celui qui utilise le hook : chaque composant qui utiliserait `useReporte` devrait penser à envelopper sa fonction, faute de quoi la scrutation redeviendrait une boucle. Et le cours n'introduit pas la mémoïsation par automatisme. Un hook qui dépend du fait que ses utilisateurs se souviennent de quelque chose est un hook fragile.
- **Un Effect Event ?** C'est la solution qui convient, pour une raison de fond détaillée dans la section suivante.

La question décisive n'est pas technique, elle est sémantique : **avertir qu'un rapport est arrivé fait-il partie de la synchronisation avec le serveur, ou est-ce quelque chose qui se produit *pendant* la synchronisation ?** Si demain `Panel` lui transmet une fonction différente, faut-il pour autant cesser d'interroger le serveur et tout recommencer ? Non. La scrutation dépend de la fonction avec laquelle on charge (`cargar`), de la fréquence (`cadaMs`) et du fait que quelqu'un ait demandé à recharger (`intento`). La personne ou la fonction que l'on prévient quand quelque chose arrive ne change rien à cela.

### 3.6 `useEffectEvent` : lire la valeur la plus récente sans réinitialiser

#### 3.6.1 Une fonction qui se comporte comme un événement

La documentation de React distingue deux catégories de logique. Celle des gestionnaires d'événements **n'est pas réactive** : elle ne s'exécute que lorsque la personne répète l'interaction, par exemple un autre clic. Celle des Effects **est réactive** : si elle lit une propriété ou un état, cette valeur doit figurer dans les dépendances, et si elle change, l'Effect s'exécute à nouveau ([React, « Separating Events from Effects »](https://react.dev/learn/separating-events-from-effects)). L'avertissement « un rapport est arrivé » mêle ces deux natures : il est déclenché depuis l'Effect (quand le serveur répond), mais ne doit pas provoquer le redémarrage de l'Effect. C'est pour cela qu'existe `useEffectEvent`. Sa référence le décrit ainsi : c'est un hook qui te permet de séparer les événements des Effects ; les Effect Events font partie de la logique de l'Effect, mais se comportent davantage comme un gestionnaire d'événements : ils « voient » toujours les valeurs les plus récentes du rendu (props et état) sans resynchroniser l'Effect, et c'est pourquoi **ils restent en dehors des dépendances** ([React, « useEffectEvent »](https://react.dev/reference/react/useEffectEvent)). Il a été introduit avec React 19.2, publié le 1er octobre 2025 ([React, « React 19.2 »](https://react.dev/blog/2025/10/01/react-19-2)) ; ce cours utilise la version 19.3.1.

Voici comment se présente `useReporte` :

```ts
// revisor/src/reporte/useReporte.ts
import { useEffect, useEffectEvent, useState } from "react";
import type { ReportePublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";

export type Carga =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly reporte: ReportePublico }
  | { readonly tipo: "error"; readonly detalle: string };

export function useReporte(
  cargar: Cargar,
  cadaMs: number,
  alRecibir: (reporte: ReportePublico) => void,
): { readonly carga: Carga; readonly recargar: () => void } {
  const [carga, establecerCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, establecerIntento] = useState(0);
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    const control = new AbortController();

    async function pedir(): Promise<void> {
      try {
        const reporte = await cargar(control.signal);
        establecerCarga({ tipo: "listo", reporte });
        avisarRecibido(reporte);
      } catch (error: unknown) {
        if (control.signal.aborted) {
          return;
        }

        const detalle = error instanceof Error ? error.message : "falló la carga";
        establecerCarga({ tipo: "error", detalle });
      }
    }

    void pedir();
    const temporizador = setInterval(() => void pedir(), cadaMs);

    return () => {
      control.abort();
      clearInterval(temporizador);
    };
  }, [cargar, cadaMs, intento]);

  function recargar(): void {
    establecerCarga({ tipo: "cargando" });
    establecerIntento((actual) => actual + 1);
  }

  return { carga, recargar };
}
```

Par rapport à la Leçon 2, quatre lignes changent : l'`import` ajoute `useEffectEvent`, le hook reçoit le paramètre `alRecibir`, l'enveloppe dans `avisarRecibido`, et l'Effect appelle `avisarRecibido(reporte)` (dans la tentative de 3.5, il appelait `alRecibir` directement). La liste des dépendances **ne change pas** : elle reste `[cargar, cadaMs, intento]`, et le linter l'accepte, car la fonction utilisée par l'Effect est désormais un Effect Event, et ceux-ci ne figurent pas dans la liste. La valeur de `alRecibir` qui s'exécute est toujours celle du tout dernier rendu, même si l'Effect a démarré plusieurs rendus auparavant.

Dans `Panel` (3.1.2), rien de ce que tu as écrit ne change : il continue de transmettre une nouvelle fonction fléchée à chaque rendu, `() => establecerActualizadoEn(new Date())`. Cela n'a plus d'importance. C'est l'avantage par rapport à `useCallback` : le hook se défend tout seul et la personne qui l'utilise n'a rien besoin de savoir.

#### 3.6.2 Compter les réinitialisations

La troisième figure répond par un chiffre à la question « combien de fois l'intervalle est-il réinitialisé ? ». Deux scrutations identiques, l'une avec la fonction dans les dépendances et l'autre avec `useEffectEvent`, sont affichées trois fois, à chaque fois avec une nouvelle fonction, exactement comme le fait `Panel` :

```tsx
// fig03_03.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useEffectEvent, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type PropsSondeo = { readonly alRecibir: () => void };

function SondeoConDependencia({ alRecibir }: PropsSondeo) {
  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(alRecibir, 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, [alRecibir]);

  return null;
}

function SondeoConEvento({ alRecibir }: PropsSondeo) {
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(() => avisarRecibido(), 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, []);

  return null;
}

async function dibujarTresVeces(titulo: string, Sondeo: ComponentType<PropsSondeo>): Promise<void> {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));

  for (const dibujo of [1, 2, 3]) {
    console.log(` dibujo ${dibujo}`);
    // Como en Panel: una función nueva en cada dibujo.
    await act(async () => raiz.render(<Sondeo alRecibir={() => console.log("  recibido")} />));
  }

  console.log(" desmontar");
  await act(async () => raiz.unmount());
}

await dibujarTresVeces("con alRecibir en las dependencias:", SondeoConDependencia);
await dibujarTresVeces("con useEffectEvent:", SondeoConEvento);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_03.tsx
$ node fig03_03.js
con alRecibir en las dependencias:
 dibujo 1
  arranca el intervalo
 dibujo 2
  detiene el intervalo
  arranca el intervalo
 dibujo 3
  detiene el intervalo
  arranca el intervalo
 desmontar
  detiene el intervalo
con useEffectEvent:
 dibujo 1
  arranca el intervalo
 dibujo 2
 dibujo 3
 desmontar
  detiene el intervalo
```

Avec la fonction dans les dépendances, l'intervalle démarre **trois** fois en trois rendus : une fois par rendu, alors même que rien d'important n'a changé. Avec `useEffectEvent`, il démarre **une** seule fois et s'arrête une fois, au démontage. (La figure n'utilise pas `StrictMode`, afin que le décompte puisse être lu sans le cycle supplémentaire ; « recibido » n'apparaît pas car la figure se termine bien avant les dix secondes de l'intervalle.)

Et dans le `revisor`, avec de vrais clics. Ce script a ouvert le point de contrôle sans modification et, pendant vingt et une secondes, a cliqué quatre fois sur la case « Solo fallas » (il l'a cochée et décochée deux fois) et a sélectionné deux services. Chacun de ces clics déclenche un nouveau rendu de `Panel` :

```text
08:28:53.073 abre http://localhost:5103/
08:28:54.581 document.querySelector(".actualizado").textContent → "Actualizado a las 2:28:53 a.m."
08:28:54.588 clic en la casilla
08:28:56.593 clic en la casilla
08:28:58.602 clic en catálogo
08:29:00.611 clic en inventario
08:29:05.611 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:03 a.m."
08:29:05.615 clic en la casilla
08:29:07.620 clic en la casilla
08:29:14.620 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:13 a.m."
```

Le journal du serveur durant ces vingt et une secondes :

```text
08:28:53.138 GET /api/estados cancelada por el cliente
08:28:53.440 GET /api/estados 200
08:28:58.612 GET /api/servicios/cat%C3%A1logo cancelada por el cliente
08:28:58.814 GET /api/servicios/cat%C3%A1logo 200
08:29:00.611 GET /api/servicios/inventario cancelada por el cliente
08:29:00.813 GET /api/servicios/inventario 200
08:29:03.443 GET /api/estados 200
08:29:13.443 GET /api/estados 200
```

Le rapport est arrivé à 53.440, 03.443 et 13.443 : toutes les dix secondes à trois millièmes de seconde près, comme si personne n'avait touché à rien. Six clics, zéro réinitialisation de la scrutation. Et la ligne « Actualizado a las … » a progressé de 2:28:53 à 2:29:03 puis à 2:29:13, suivant chaque rapport (rappelle-toi qu'il s'agit de l'heure locale du navigateur). Les deux duos de détail sont ceux de 3.4 : la `key` qui monte un nouveau panneau par service.

#### 3.6.3 Ce qu'`useEffectEvent` n'est pas

Il est tentant de voir dans `useEffectEvent` un moyen de retirer de la liste tout ce qui dérange. La documentation l'interdit expressément : n'utilise pas `useEffectEvent` pour éviter de déclarer des dépendances de ton Effect ; cela masque des erreurs et rend le code plus difficile à comprendre. Utilise-le uniquement pour la logique qui est véritablement un événement déclenché depuis un Effect ; si une valeur doit provoquer la réexécution de l'Effect, garde-la comme dépendance ([React, « useEffectEvent »](https://react.dev/reference/react/useEffectEvent)). L'annonce de React 19.2 réitère cette idée : il n'est pas nécessaire de tout envelopper dans `useEffectEvent`, ni de l'employer uniquement pour faire taire l'avertissement, car cela peut conduire à des bogues ([React, « React 19.2 »](https://react.dev/blog/2025/10/01/react-19-2)).

Le test pour le `revisor` est la question de 3.5.3. Si tu enveloppais `cadaMs` dans un Effect Event pour le sortir de la liste, le jour où quelqu'un modifierait l'intervalle de 10 à 5 secondes, l'Effect ne s'en apercevrait pas, et tu te retrouverais de retour dans la scène de la Leçon 0. `cadaMs` fait partie de la synchronisation. `alRecibir` n'en fait pas partie.

La référence fixe en outre trois limites. C'est un hook, il s'appelle donc au niveau supérieur du composant ou de ton hook, jamais à l'intérieur d'un `if` ou d'une boucle. Les Effect Events ne sont appelés que depuis des Effects ou d'autres Effect Events : pas pendant le rendu, et on ne les transmet pas à d'autres composants ni à d'autres hooks. Et leur identité change **intentionnellement** à chaque rendu ([React, « useEffectEvent »](https://react.dev/reference/react/useEffectEvent)). Cette dernière règle explique ce qui se passe si, par habitude, tu places `avisarRecibido` dans la liste. Le linter l'interrompt (mesuré sur une copie) :

```text
~/curso-react/revisor/src/reporte/useReporte.ts
  44:32  warning  Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `avisarRecibido` from the list  react-hooks/exhaustive-deps
```

Si tu l'ignorais, comme son identité change à chaque rendu, tu retrouverais la boucle de 3.5.2. La référence de `useEffectEvent` indique que le linter fait respecter ces restrictions, et l'annonce de la 19.2 réclame une version récente de `eslint-plugin-react-hooks` pour que le linter n'essaie pas d'insérer les Effect Events dans la liste ; la version 7.1.1 utilisée par le cours les connaît, comme tu viens de le voir.

### 3.7 Quand un Effect n'est pas nécessaire

#### 3.7.1 Deux Effects en trop

Tu as désormais trois Effects dans le `revisor` et tous les trois synchronisent quelque chose d'extérieur : le serveur (deux fois) et le document. Abordons à présent l'autre moitié du principe : ce qui ne **doit pas** aller dans un Effect. La documentation de React y consacre une page entière, qui s'ouvre sur deux phrases capitales : tu n'as pas besoin d'Effects pour transformer des données pour le rendu, et tu n'as pas besoin d'Effects pour gérer les événements de l'utilisateur ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)).

La deuxième figure réunit les deux erreurs dans un même fichier. Elle ne fait pas partie du `revisor`, mais ressemble beaucoup à ce que quelqu'un pourrait y écrire : un résumé qui compte les pannes dans un Effect, et un bouton qui, au clic, active un drapeau pour qu'un Effect envoie la tentative de réessai.

```tsx
// fig03_02.tsx
import { useEffect, useState } from "react";

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const [fallas, establecerFallas] = useState(0);

  useEffect(() => {
    establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
  }, [estados]);

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  const [pedido, establecerPedido] = useState(false);

  useEffect(() => {
    if (pedido) {
      void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
      establecerPedido(false);
    }
  }, [pedido, nombre]);

  return (
    <button type="button" onClick={() => establecerPedido(true)}>
      Volver a revisar
    </button>
  );
}
```
```bash
$ npx eslint fig03_02.tsx

~/curso-react/figuras/fig03_02.tsx
  10:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:10:5
   8 |
   9 |   useEffect(() => {
> 10 |     establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  11 |   }, [estados]);
  12 |
  13 |   return <p>{fallas} servicios con falla</p>;              react-hooks/set-state-in-effect
  22:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:22:7
  20 |     if (pedido) {
  21 |       void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
> 22 |       establecerPedido(false);
     |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  23 |     }
  24 |   }, [pedido, nombre]);
  25 |  react-hooks/set-state-in-effect

✖ 2 problems (2 errors, 0 warnings)
```

(Le serveur d'entraînement de cette leçon ne possède pas de route de réessai ; ici, la figure est uniquement examinée avec le linter, elle n'est jamais exécutée.) Le message est le même que celui que la Leçon 0 t'a appris à lire, et il explique tout : un Effect doit mettre à jour des systèmes externes avec l'état de React, ou s'abonner à un système externe et modifier l'état quand ce système répond. Aucun des deux cas de la figure ne fait cela.

**Le premier calcule.** `fallas` peut être obtenu à partir de `estados` au moment du rendu. Le stocker dans l'état et le copier avec un Effect produit un rendu avec l'ancien nombre, un Effect qui le corrige et un autre rendu avec le bon nombre : un rendu jeté à la poubelle, et un instant où l'écran affiche une fausse information. La documentation en fait une règle : quand quelque chose peut être calculé à partir des props ou de l'état existants, ne le place pas dans l'état ; calcule-le pendant le rendu ([React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect)). C'est la troisième règle de structuration de la Leçon 2, « ne pas stocker ce qui peut être calculé », vue du point de vue des Effects. Et c'est ce que le `revisor` fait déjà dans `Panel` : `const fallas = … contarFallas(…)`, une constante, et l'Effect se contente de la copier dans le document.

**Le second réagit à un clic.** Le réessai n'est pas provoqué par le fait que le bouton s'affiche, mais par le fait que l'utilisateur appuie dessus. La documentation emploie quasiment le même exemple, l'achat d'un produit : tu ne veux pas l'acheter deux fois, et c'est pour cela même que cela ne doit pas aller dans un Effect, car l'achat n'est pas causé par le rendu mais par une interaction concrète, et ne doit s'exécuter que lorsque la personne appuie sur le bouton ([React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects)). Pense en outre à `StrictMode` : si la requête vivait dans un Effect sans drapeau, le cycle supplémentaire de développement enverrait le réessai deux fois. La solution consiste à la déplacer dans le gestionnaire de clic, où le drapeau cesse d'exister. L'exercice 4 te demande de le faire.

#### 3.7.2 Le tableau de poche

La page « You Might Not Need an Effect » énumère douze situations où l'on écrit un Effect superflu. Celles qui sont déjà apparues dans le `revisor`, avec l'endroit où chacune réside en réalité :

| Tentation | Où cela va en réalité | Dans le `revisor` |
|---|---|---|
| mettre à jour un état à partir d'un autre | se calcule pendant le rendu | `fallas` dans `Panel`, `visibles` et `existe` dans `ContenidoReporte` |
| réinitialiser tout l'état quand une propriété change | une `key` | `<PanelDetalle key={seleccionado}>` |
| envoyer une requête `POST` suite à un clic | le gestionnaire d'événement | il n'y en a pas encore dans le `revisor` ; le plan le prévoit pour le réessai et l'enregistrement |
| avertir le parent que quelque chose a changé | on appelle la fonction du parent dans le même événement | `alSeleccionar`, `alCambiar`, `alGuardarNota` |
| demander des données | c'est bel et bien un Effect, avec nettoyage (ou une bibliothèque) | `useDetalle` et `useReporte` |

Regarde bien la dernière ligne. Demander des données, c'est **bien** synchroniser, et c'est pourquoi le `revisor` le fait dans un Effect. Mais la référence de `useEffect` est lucide quant à ses limites : récupérer des données manuellement dans des Effects ne fonctionne pas côté serveur, a tendance à créer des cascades (le parent demande, affiche, puis chaque enfant demande sa part), ne met rien en cache et exige beaucoup de code répétitif pour éviter des bogues comme la concurrence entre les réponses (race condition) ; elle recommande d'utiliser une bibliothèque de cache côté client, parmi lesquelles TanStack Query ([React, « useEffect »](https://react.dev/reference/react/useEffect)). Tu as déjà écrit ce code répétitif deux fois : `useReporte` et `useDetalle` se ressemblent beaucoup. Selon le plan du cours, c'est de là que part la Leçon 4.

#### 3.7.3 Ce qui était déjà bien fait

Avant de poursuivre, observe ce que le `revisor` faisait déjà correctement sans que personne ne l'ait encore formulé. Le bouton « Actualizar » positionne `cargando` dans `recargar`, à l'intérieur du gestionnaire de clic, et c'est seulement après qu'il incrémente `intento` pour que l'Effect redémarre : l'état de l'écran est modifié par l'événement, la synchronisation est effectuée par l'Effect. `cargarReporte` et `cargarDetalle` sont des fonctions de module, identiques à chaque rendu, de sorte que `cargar` dans la liste de `useReporte` ne redémarre rien. Et `alSeleccionar` modifie la sélection lors du clic ; personne « n'observe » la sélection avec un Effect pour faire quelque chose ensuite. Tout cela relève du même principe appliqué avant même de recevoir un nom.

## L'erreur que tu vas voir

Cette leçon comporte une erreur principale, celle qui survient lorsqu'on tente de revenir à « Cargando detalle… » sans `key`, et deux erreurs secondaires que tu as déjà rencontrées en 3.5 et 3.6.

**L'erreur principale : « réinitialiser l'état à l'intérieur de l'Effect ».** Retire la `key` de `<PanelDetalle>` et, pour que l'encadré revienne à « Cargando detalle… » lors d'un changement de service, écris `establecerCarga({ tipo: "cargando" })` comme première ligne de l'Effect de `useDetalle`. Le linter le rejette (mesuré sur une copie) :

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/detalle/useDetalle.ts
  14:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/detalle/useDetalle.ts:14:5
  12 |
  13 |   useEffect(() => {
> 14 |     establecerCarga({ tipo: "cargando" });
     |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  15 |     const control = new AbortController();
  16 |
  17 |     cargarDetalle(nombre, control.signal).then(  react-hooks/set-state-in-effect
```

(Lors de cette exécution, une seconde modification volontaire était présente dans un autre fichier, celle de 3.6.3, raison pour laquelle le récapitulatif final indiquait `✖ 2 problems (1 error, 1 warning)` ; nous n'affichons ici que le bloc relatif à cette erreur.) Cela se lit de haut en bas : le fichier, la ligne 14 et la colonne 5, le nom de l'erreur, l'explication générale (la même que pour la figure 2), le code avec une flèche qui pointe sur l'appel, et à la fin le nom de la règle, `react-hooks/set-state-in-effect`. C'est une **erreur**, et non un avertissement : elle bloque `npm run lint` même sans l'option `--max-warnings 0`.

La solution ne consiste pas à faire taire la règle ni à déplacer l'appel là où le linter ne le voit pas (par exemple dans un `setTimeout` de zéro milliseconde à l'intérieur de l'Effect, ce qui revient à masquer le même rendu inutile). La solution est de te demander ce que tu veux exprimer. Tu veux dire « quand le service change, l'encadré repart de zéro ». En React, cela s'écrit avec une `key` (3.3.4), et l'Effect reste propre car il n'a plus rien à corriger.

**L'avertissement de la dépendance manquante.** `React Hook useEffect has a missing dependency: 'alRecibir'` (3.5.1). La solution ne consiste pas à l'ajouter aveuglément, car cela a provoqué la boucle de seize requêtes en cinq secondes ; elle ne consiste pas non plus à suivre la suggestion finale du message en enveloppant la fonction dans `useCallback` au niveau du parent. Il s'agit de se demander si cette fonction fait partie de la synchronisation. Si ce n'est pas le cas, `useEffectEvent`.

**L'Effect Event dans la liste.** `Functions returned from useEffectEvent must not be included in the dependency array` (3.6.3). La solution est celle indiquée par le message : le retirer. Son identité change à chaque rendu intentionnellement.

## Ce qui se fait de travers

**Penser en termes de « au montage ».** Écrire `useEffect(() => { … }, [])` avec l'idée que « cela tourne une seule fois, au chargement » mène à des Effects sans nettoyage, et `StrictMode` les trahit avec son cycle supplémentaire. Pense en termes de cycles : commencer puis cesser de synchroniser.

**Demander des données sans nettoyage.** L'ancienne réponse arrive en retard et s'écrit par-dessus la bonne. Le fait que la `key` masque cela sur un écran ne résout rien dans le hook, et la requête voyage jusqu'au bout pour être jetée.

**Traiter l'annulation comme une erreur.** Sans `if (control.signal.aborted) return;`, l'annulation du nettoyage est affichée comme un échec : en développement, à cause du cycle supplémentaire de `StrictMode`, sur chaque service que tu choisis (tu l'as mesuré en 3.2.3) ; sans `key`, également à chaque changement de service. Une annulation, c'est le nettoyage qui fonctionne.

**Réinitialiser l'état avec un `setState` à l'intérieur de l'Effect.** Cela produit un rendu inutile et le linter le refuse. Pour réinitialiser tout l'état d'un composant quand ce qu'il affiche change, utilise une `key`.

**Faire taire `exhaustive-deps`.** Un `// eslint-disable-next-line react-hooks/exhaustive-deps` laisse la liste mentir et garantit des valeurs périmées par la suite. Si l'avertissement te gêne, le code a un problème de conception.

**Croire qu'un linter au vert signifie « correct ».** Ajouter `alRecibir` à la liste a laissé le linter vierge de tout avertissement et le panneau demandant un rapport toutes les 300 ms. Le linter garantit que la liste dit la vérité, pas que la vérité t'arrange.

**Utiliser `useEffectEvent` pour masquer des dépendances.** Si une valeur doit relancer la synchronisation, comme `cadaMs`, elle va dans la liste. `useEffectEvent` est réservé à ce qui se produit pendant la synchronisation, pas à ce qui la définit.

**Calculer dans un Effect.** Copier dans un état quelque chose qui peut être calculé pendant le rendu produit un rendu superflu et un court instant où l'écran est erroné. Calcule-le comme une constante.

**Envoyer une requête suite à un clic depuis un Effect.** Le clic est un événement ; la requête va dans son gestionnaire. Dans un Effect, `StrictMode` l'envoie deux fois en développement et tout changement de dépendance la répète.

**Retirer `StrictMode` parce qu'il double les requêtes.** Le cycle supplémentaire est la preuve que le nettoyage existe, et en production, il n'a pas lieu.

## Exercices

### Exercice 1 — Lis le journal avant de le voir

Avec le point de contrôle sans modification, le serveur d'entraînement et `npm run dev` lancés, tu vas ouvrir la page, attendre qu'elle charge, choisir `catálogo`, attendre deux secondes et choisir `inventario`. **Avant de le faire**, écris dans ton journal de bord combien de lignes le serveur va ajouter pour les deux détails, dans quel ordre, et lesquelles indiqueront `cancelada por el cliente`. Ensuite, fais-le et compare. Quelque chose changerait-il si tu choisissais `inventario` seulement 100 ms après `catálogo` ?

### Exercice 2 — L'expérience évidente, et la complète

Dans une copie du `revisor`, retire uniquement la ligne `return () => control.abort();` de `useDetalle`. Choisis `pagos` et, aussitôt après, `inventario`. Note ce qu'affiche l'encadré au bout de deux secondes et ce qu'enregistre le serveur. Retire ensuite également `key={seleccionado}` de `ContenidoReporte` et recommence. Explique en trois phrases pourquoi la première expérience ne montre pas la race condition et la seconde la montre. Le linter avertit-il dans l'un ou l'autre cas ?

### Exercice 3 — Le drapeau à la place de l'abandon

Réécris `useDetalle` avec la méthode par drapeau de 3.3.2 (`let ignorar = false` et un nettoyage qui la passe à `true`), sans `AbortController`. Vérifie que `npm run lint` ne signale rien et que, sans `key`, la race condition reste corrigée à l'écran. **Prédis** ce qui change dans le journal du serveur en choisissant `pagos` puis `inventario`, et vérifie-le. Rétablis le fichier à la fin.

### Exercice 4 — Corrige la figure 2 sans Effects

Corrige `fig03_02.tsx` pour que `npx eslint fig03_02.tsx` ne signale rien, **sans** faire taire aucune règle et sans conserver aucun `useEffect`. `Resumen` doit continuer d'afficher le nombre de pannes, et `BotonReintento` doit continuer d'envoyer le `POST` au clic.

## Solutions

### Solution 1

En choisissant `catálogo`, la `key` monte un nouveau `PanelDetalle` et `StrictMode` exécute le cycle supplémentaire : une ligne `GET /api/servicios/cat%C3%A1logo cancelada por el cliente` et, environ 200 ms plus tard, `GET /api/servicios/cat%C3%A1logo 200`. Deux secondes plus tard, en choisissant `inventario`, il se produit la même chose : `cancelada` et `200`. Quatre lignes, deux annulées, dans l'ordre cancelada, 200, cancelada, 200. C'est ce qui a été mesuré avec la case, `catálogo` et `inventario` lors de l'exécution de 3.6.2 : `08:28:58.612 … cat%C3%A1logo cancelada por el cliente`, `08:28:58.814 … cat%C3%A1logo 200`, `08:29:00.611 … inventario cancelada por el cliente` et `08:29:00.813 … inventario 200`. Remarque que le nom avec accent voyage encodé (3.2.2). Si tu choisissais `inventario` seulement 100 ms après, la vraie requête de `catálogo` ne serait pas encore terminée (elle met 200 ms), si bien qu'elle apparaîtrait aussi comme `cancelada` : tu verrais trois lignes `cancelada` et un seul `200`, celui d'`inventario`. C'est la race condition corrigée, la même que celle mesurée en 3.2.3 avec `pagos`. Ce dernier cas n'a pas été mesuré ; c'est la prédiction qui découle de la règle, et la vérifier est ta part de travail. Et rappelle-toi la précision de la Leçon 0 : la ligne `cancelada` du cycle supplémentaire n'apparaît que si la connexion a eu le temps d'atteindre le serveur avant l'annulation. S'il en manque une sur ta machine, ce n'est pas que `StrictMode` est désactivé.

### Solution 2

C'est l'expérience mesurée en 3.3.3. Avec uniquement le nettoyage retiré, l'encadré affiche au bout de deux secondes « Disponible: HTTP 200 en 118 ms », la donnée correcte d'`inventario` ; le journal montre deux `GET /api/servicios/inventario 200` et un `GET /api/servicios/pagos 200` arrivé presque une seconde après le premier d'`inventario` (et un autre `pagos` resté en attente jusqu'à la fermeture de l'onglet, pour la raison expliquée en 3.4.2). La race condition a bien eu lieu sur le réseau, mais pas à l'écran, car la `key` a démonté le panneau de `pagos` et sa réponse a écrit dans un composant qui n'existait plus. Sans `key` et sans nettoyage, l'encadré affiche au bout de deux secondes « En falla: HTTP 503 » sous « inventario » : le même composant a reçu l'ancienne réponse. Le linter n'avertit dans aucun des deux cas : un nettoyage manquant ne viole aucune règle visible dans le texte, et retirer une `key` non plus. C'est pourquoi cette leçon effectue des mesures dans le navigateur et pas seulement avec ESLint.

### Solution 3

Une méthode correcte :

```ts
// useDetalle con bandera (fragmento para el ejercicio)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then(
    (detalle) => {
      if (!ignorar) {
        establecerCarga({ tipo: "listo", detalle });
      }
    },
    (error: unknown) => {
      if (ignorar) {
        return;
      }

      const detalle = error instanceof Error ? error.message : "falló la carga";
      establecerCarga({ tipo: "error", detalle });
    },
  );

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

L'écran est tout aussi bien protégé : l'ancienne réponse arrive, mais le drapeau de son cycle est déjà à `true` et elle n'écrit rien. Ce qui change, c'est le journal : il n'y a plus aucun `cancelada por el cliente` (ni celui de `StrictMode`, ni celui du changement de service), et à leur place apparaissent des réponses `200` complètes de requêtes dont personne n'a l'usage, parmi lesquelles celle de `pagos`, 1,5 seconde de travail du serveur jetée. C'est la différence mise en avant en 3.3.2 : le drapeau ignore, l'annulation coupe en plus la connexion. Le cours conserve l'annulation. Note que `cargarDetalle` demande toujours un signal ; ici, on lui transmet un signal que personne n'annule.

### Solution 4

Aucun des deux composants ne synchronise quoi que ce soit avec un système extérieur, aucun n'a donc besoin d'un Effect :

```tsx
// fig03_02.tsx corregida (fragmento)
type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const fallas = estados.filter((estado) => estado.tipo === "falla").length;

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  function reintentar(): void {
    void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
  }

  return (
    <button type="button" onClick={reintentar}>
      Volver a revisar
    </button>
  );
}
```

`fallas` est une constante calculée lors de chaque rendu, et l'état, l'Effect ainsi que le rendu jeté disparaissent. Le `POST` réside dans le gestionnaire de clic, et le drapeau `pedido` ainsi que le risque de l'envoyer deux fois disparaissent. Remarque `encodeURIComponent` : c'est la même règle qu'en 3.2.2, et la figure la comportait déjà. Avec cette version, `npx eslint` ne signale rien. Remarque que le fichier corrigé n'importe même plus `useEffect` ni `useState` : le moyen le plus sûr de ne pas se tromper avec un Effect est de ne pas l'écrire quand il n'est pas nécessaire.

## Comment savoir que j'ai réussi

- [ ] `npm run lint` s'achève sans signaler le moindre problème, et dans tout `src/`, il n'y a pas un seul commentaire `eslint-disable`.
- [ ] `npm run build` se termine par `✓ built` et dépose dans `dist/assets/` un fichier `index-CTkBRgQQ.js`, le même nom que le point de contrôle du cours (si ton projet est identique octet par octet ; si tu as modifié un texte, le nom change et ce n'est pas une erreur).
- [ ] Avec le serveur d'entraînement démarré, `curl` sur `/api/servicios/pagos` met environ 1,5 s et répond `200`, et `curl` sur `/api/servicios/nada` répond `404` avec `{"detalle":"no existe el servicio nada"}`.
- [ ] Avec le panneau ouvert dans `npm run dev` et deux pannes dans le rapport, l'onglet indique `(2) Revisor`.
- [ ] En choisissant `pagos` et aussitôt `inventario`, l'encadré finit par afficher « Disponible: HTTP 200 en 118 ms », et dans le journal, la requête réelle de `pagos` apparaît en `cancelada por el cliente`.
- [ ] Dans une copie sans `key` et sans `control.abort()`, tu as reproduit la race condition : l'encadré finit par afficher « En falla: HTTP 503 » sous « inventario ». Et tu sais expliquer pourquoi retirer seulement `control.abort()` ne suffit pas pour l'observer.
- [ ] Avec la page ouverte pendant vingt secondes et plusieurs clics sur la case « Solo fallas », le journal enregistre un `GET /api/estados 200` toutes les dix secondes, pas un de plus.
- [ ] Tu es capable de dire, pour chacun des trois Effects du `revisor`, avec quel système externe il se synchronise, ce qu'il fait au démarrage et ce que son nettoyage défait.
- [ ] Tu as consigné dans ton [journal de bord](bitacora.md) la race condition que tu as reproduite, la boucle de requêtes causée par une obéissance aveugle au linter, et ce qui a changé dans ta manière de lire `useEffect`.

## Résumé

Réponds sans regarder la leçon :

1. Quelles sont les deux fonctions qui composent un Effect et que fait chacune d'elles ? Pourquoi la documentation demande-t-elle de penser depuis l'Effect et non depuis le composant ?
2. Qu'est-ce que la concurrence entre les réponses (race condition) ? Pourquoi la réponse de `pagos` peut-elle arriver après celle d'`inventario`, même si elle a été demandée avant ?
3. Quelle est la différence entre annuler la requête et ignorer son résultat ? Que voit le serveur dans chaque cas ?
4. Pourquoi le `revisor` réinitialise-t-il le détail avec une `key` et non avec un `setState` à l'intérieur de l'Effect ? Que dit le linter si tu essaies ?
5. Que fait `StrictMode` avec un Effect en développement, et quelle est la règle pour savoir si ton Effect passe ce test ?
6. Pourquoi le fait d'ajouter `alRecibir` à la liste a-t-il laissé le linter au vert et le panneau demandant un rapport toutes les 300 ms ? Quel rôle joue `Object.is` ?
7. Que fait `useEffectEvent`, où peut-on l'appeler, et pourquoi ne sert-il pas à retirer `cadaMs` de la liste ?
8. Donne deux exemples de code qui ne devraient pas se trouver dans un Effect et indique où chacun d'eux doit aller.

## Pour aller plus loin

- [React, « Synchronizing with Effects »](https://react.dev/learn/synchronizing-with-effects) : ce qu'est un Effect, le nettoyage, pourquoi `StrictMode` monte deux fois en développement, la concurrence entre les réponses (race condition) et l'exemple de l'achat qui ne va pas dans un Effect. Consulté le 21 octobre 2026.
- [React, « Lifecycle of Reactive Effects »](https://react.dev/learn/lifecycle-of-reactive-effects) : commencer et cesser de synchroniser, penser depuis l'Effect, les valeurs réactives, « tu ne peux pas choisir tes dépendances » et pourquoi on ne fait pas taire le linter. Consulté le 21 octobre 2026.
- [React, « Separating Events from Effects »](https://react.dev/learn/separating-events-from-effects) : logique réactive et non réactive, les Effect Events et leurs limites. Consulté le 21 octobre 2026.
- [React, « Removing Effect Dependencies »](https://react.dev/learn/removing-effect-dependencies) : fonctions et objets comme dépendances, la liste qui décrit le code, et les pistes pour retirer une dépendance. Consulté le 21 octobre 2026.
- [React, « You Might Not Need an Effect »](https://react.dev/learn/you-might-not-need-an-effect) : calculer pendant le rendu, réinitialiser l'état avec une `key`, les requêtes déclenchées par un événement et la race condition lors de la récupération de données. Consulté le 21 octobre 2026.
- [React, « useEffect »](https://react.dev/reference/react/useEffect) : la signature, comment les dépendances sont comparées avec `Object.is`, le cycle supplémentaire de `StrictMode` et les limites de la récupération manuelle de données. Consulté le 21 octobre 2026.
- [React, « useEffectEvent »](https://react.dev/reference/react/useEffectEvent) : ce qu'il fait, ses limites et la mise en garde contre son utilisation pour masquer des dépendances. Consulté le 21 octobre 2026.
- [React, « React 19.2 »](https://react.dev/blog/2025/10/01/react-19-2) : l'annonce de `useEffectEvent`, du 1er octobre 2025, et la nécessité d'une version récente du linter. Consulté le 21 octobre 2026.
- [React, « Preserving and Resetting State »](https://react.dev/learn/preserving-and-resetting-state) : la `key` comme composante de la position et l'état détruit lors du retrait d'un composant. Consulté le 21 octobre 2026.
- [React, « set-state-in-effect »](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect) : ce que rejette la règle et pourquoi. Consulté le 21 octobre 2026.
- [React, « <title> »](https://react.dev/reference/react-dom/components/title) : le composant `<title>` de React 19, qui se place dans le `<head>`, et l'avertissement de ne pas en afficher deux à la fois. Consulté le 21 octobre 2026.
- [MDN, « AbortController: abort() method »](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) : ce qu'interrompt `abort()` et l'exception `AbortError`. Consulté le 21 octobre 2026.
- [MDN, « Document: title property »](https://developer.mozilla.org/en-US/docs/Web/API/Document/title) : lire et modifier le titre du document. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| Effect | code qui s'exécute après le rendu pour synchroniser un composant avec quelque chose d'extérieur à React : un serveur, le document, un minuteur |
| nettoyage | la fonction que renvoie un Effect ; elle défait ce que l'Effect a commencé, avant le cycle suivant et au retrait du composant |
| cycle d'un Effect | commencer à synchroniser puis, ensuite, cesser de synchroniser ; se répète chaque fois qu'un élément de la liste change |
| dépendances | la liste des valeurs réactives utilisées par l'Effect ; elle décrit le code, on ne la choisit pas |
| valeur réactive | une propriété, un état ou toute valeur calculée à l'intérieur du composant, susceptible de changer d'un rendu à l'autre |
| concurrence entre les réponses (race condition) | deux requêtes en vol qui arrivent dans un ordre différent de celui de leur envoi, l'ancienne venant s'écrire par-dessus la nouvelle |
| `AbortController` | objet du navigateur permettant d'annuler une requête `fetch` depuis l'extérieur, par l'intermédiaire de son signal |
| valeur périmée (*stale*) | la valeur d'un rendu antérieur qu'un Effect continue d'utiliser parce que sa liste ne la mentionne pas |
| Effect Event | fonction créée avec `useEffectEvent` : elle est appelée depuis un Effect, voit toujours les valeurs les plus récentes et ne figure pas dans la liste des dépendances |

---

**Suivante :** [Leçon 4 — État du serveur avec TanStack Query](04-estado-del-servidor.md)
