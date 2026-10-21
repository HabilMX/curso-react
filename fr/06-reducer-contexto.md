# Leçon 6 — État partagé : reducer et contexte

*Vendredi, 18 h 50. La version de la semaine sort à 19 h 30. Sur le chat arrivent deux messages presque coup sur coup. Le premier vient de l'exploitation : « J'ai cliqué sur "Volver a revisar" pour pagos, je suis revenu à la liste pour voir si ça changeait, et je n'ai jamais su si ça avait fonctionné ». Tu as la réponse : la notification d'erreur vivait à l'intérieur de la page du service, et en quittant la page, la notification est partie avec elle. Le second vient de l'équipe d'astreinte : « Sur le grand écran, les millisecondes s'entassent, est-ce que tu peux les masquer ? ». Ça a l'air d'un changement de dix minutes. Tu ouvres `FilaEstado.tsx`, qui affiche les millisecondes, et tu lui ajoutes une prop `mostrarDuracion`. Mais `FilaEstado` la reçoit de `ListaEstados`, qui la reçoit de `ContenidoReporte`, qui la reçoit de `PaginaReporte`, qui devrait la recevoir de la disposition via l'`Outlet`. À 19 h 05, ta modification touche cinq fichiers, et trois d'entre eux ne font rien de cette donnée : ils ne font que la passer au suivant. Et il manque encore la case à cocher pour la modifier. Cette leçon résout les deux messages avec deux outils de React, et explique pourquoi aucun des deux n'est bon pour tout.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 6.1 et 6.2)

**Ce que tu construis :** la boîte d'avis du `revisor`, qui vit dans la disposition et survit ainsi au changement de page ; le bouton « Volver a revisar » y dépose son résultat, en succès comme en erreur. Et les préférences d'affichage, « Mostrar duración » et « Vista compacta », qui se modifient dans l'en-tête et qu'une ligne de la liste lit cinq niveaux plus bas, sans passer par les composants intermédiaires.

**Ce que tu apprends :** `useReducer` : des actions qui décrivent ce qui s'est passé et un reducer pur qui se teste sans React ; le contexte uniquement quand les props et `children` ne suffisent plus ; deux contextes, l'un pour l'état et l'autre pour le dispatch ; un hook qui échoue si le fournisseur est manquant ; **quel état vit où** : local, URL, serveur ou contexte.

**D'où tu viens.** De la [Leçon 5](05-rutas-url-como-estado.md). Ton `revisor` a déjà des routes : la liste sur `/`, avec les filtres dans l'URL (`?fallas=1&q=`) ; le détail sur `/servicios/:nombre` ; et une page « non trouvée » pour le reste. Une disposition, `Disposicion`, enveloppe toutes les pages avec l'en-tête et la navigation, et conserve les notes, transmises aux pages via `<Outlet context>` et le hook `useNotas()`. Depuis cette leçon, la route racine dispose en outre de sa propre frontière d'erreur (*error boundary*), car React Router intercepte les erreurs des pages avant qu'elles n'atteignent `LimiteDeError`. Les données sont toujours récupérées par TanStack Query, et « Volver a revisar » est une mutation qui invalide le rapport et le détail. Tu pars du point de contrôle [`programas/05-rutas-url-como-estado/revisor/`](../programas/05-rutas-url-como-estado/revisor).

**Ce que cette leçon ne fait pas.** Elle ne touche ni au serveur d'entraînement ni aux routes : l'API reste en version C et le tableau des routes est identique à celui de la leçon 5. Elle ne déplace pas les notes vers un contexte : elles restent dans la disposition, et la section 6.3 explique pourquoi c'est leur place. Elle n'utilise ni Redux ni aucune bibliothèque de gestion d'état : le cours n'en a pas besoin, et la section 6.3 indique quand il serait pertinent d'y penser. Elle ne mémoïse pas les valeurs des contextes avec `useMemo` ni `useCallback` : ici, on mesure le nombre de rendus de chaque composant, et la mesure ne l'exige pas ; mesurer avec le Profiler est l'objet de la [Leçon 9](09-rendimiento-publicacion.md). Elle n'enregistre pas les préférences dans le navigateur : au rechargement, elles reviennent à leurs valeurs initiales (l'exercice 4 discute d'où elles devraient vivre si l'on souhaitait les conserver). Et elle ne met pas en place de suite de tests : le reducer est testé ici avec une figure qui l'exécute sans React ; les suites avec Vitest sont le sujet de la [Leçon 8](08-pruebas-de-componentes.md).

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon ; cette leçon n'ajoute aucune dépendance. Le point de contrôle a été installé de zéro avec `npm ci`, et `npm run lint` ainsi que `npm run build` se sont terminés sans erreur et ont produit `dist/assets/index-DBIHM1Pv.js`. Les exécutions du cours avaient vérifié ce même point de contrôle dans un conteneur Linux (Debian 12, image `node:24.22.0`) ; cette exécution n'a pas été répétée pour cette leçon et n'a pas tourné sur un vrai Linux Mint, mais rien de ce qui est montré ne dépend du système. Si `npm ci` affiche sous macOS un avertissement d'`install-scripts` concernant `fsevents@2.3.3`, c'est une dépendance optionnelle qui ne s'installe que sous macOS pour surveiller les fichiers : inutile de l'approuver, et sur ton Mint elle n'apparaîtra pas. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome en mode headless face à `vite preview`, piloté par son protocole de débogage pour pouvoir cliquer et lire la page après chaque clic : c'est un vrai navigateur, pas une simulation. Comme sur la machine des exécutions d'autres processus tournaient, le serveur d'entraînement a écouté sur le port 3106 (`PUERTO=3106 npm run servidor`) et la prévisualisation sur le 4106, avec une configuration ponctuelle faisant pointer son *proxy* sur ce port ; sur ta machine, utilise les ports habituels, 3100 et 4173, et tu verras la même chose. Les heures du journal du serveur d'entraînement sont en UTC. Les figures ont été exécutées avec leur propre `package.json` dans [`programas/06-reducer-contexto/`](../programas/06-reducer-contexto), aux côtés de `revisor/` ; la figure 1 s'exécute directement avec `node` sur le fichier `.ts`, sans compilation, et les autres sont compilées avec `tsc` comme dans les leçons précédentes. Les chemins longs sont affichés à partir de `~/curso-react`.

## À la fin, tu seras capable de

- Écrire les actions d'un reducer sous forme d'union discriminée décrivant **ce qui s'est passé** (`agregado`, `descartado`), et faire en sorte que TypeScript te signale le `switch` lorsque tu ajoutes une action et oublies de la traiter.
- Tester un reducer sans React, avec `node` et une liste d'actions, et vérifier qu'il n'a pas modifié l'état reçu.
- Décider, face à une donnée dont plusieurs composants ont besoin, s'il suffit de passer des props, s'il convient de réorganiser avec `children`, ou si un contexte est nécessaire, et expliquer cette décision sur le cas du `revisor`.
- Séparer l'état et le dispatch dans deux contextes et mesurer, en comptant les rendus, quels composants sont rendus à nouveau dans chaque cas.
- Écrire un hook de contexte qui lève une erreur claire lorsque le fournisseur est manquant, et montrer ce qui se passe quand, au lieu de lever une erreur, le contexte a une valeur par défaut.
- Classer chaque fragment d'état du `revisor` en local, URL, serveur, disposition ou contexte, avec une justification pour chacun.

## Le pourquoi avant le comment

Les deux messages de la scène introductive semblent être deux problèmes distincts, alors qu'il s'agit en réalité de la même question posée deux fois : **qui conserve cette donnée, et comment parvient-elle à qui en a besoin ?**

Commence par la notification perdue. Dans la leçon 5, le résultat de « Volver a revisar » était affiché à l'intérieur de `PaginaServicio`, avec un `<p role="alert">` qui apparaissait si la mutation échouait. Cela fonctionne tant que l'utilisateur reste sur cette page. Mais la page est une route, et une route que l'on quitte **se démonte** : son état, ses mutations à l'écran et ses avis sont détruits. L'avis a besoin de vivre dans un endroit qui ne se démonte pas lors de la navigation, et cet endroit existe déjà : la disposition, qui enveloppe toutes les pages. Le problème réside dans la distance. Ce qui prend connaissance du résultat est un hook, `useReintentar`, qui s'exécute à l'intérieur de `PaginaServicio`, dans l'`Outlet`. Ce qui doit l'afficher se trouve plus haut, dans la disposition. Il faut un chemin du bas vers le haut.

Et il ne s'agit pas d'un seul avis. Si l'avis doit vivre plus longtemps que la page, il faut pouvoir l'écarter ; s'il en arrive plusieurs, il faut fixer une limite pour qu'ils ne s'accumulent pas indéfiniment ; et chacun a besoin d'un identifiant pour que React sache lequel retirer. Avec `useState`, cela représente trois fonctions (`agregar`, `descartar`, `descartarTodos`) qui touchent au même tableau, chacune avec sa propre copie des règles. La documentation de React décrit précisément ce moment : quand un composant accumule de nombreuses mises à jour d'état réparties entre plusieurs gestionnaires d'événements, il convient de regrouper toute cette logique hors du composant, dans une seule fonction ([React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Cette fonction s'appelle un **reducer**.

À présent, le second message. `mostrarDuracion` n'est pas une donnée propre à une page : elle est modifiée par une case à cocher de l'en-tête et lue par chaque ligne de la liste. Entre la case et la ligne, il y a cinq composants, et quatre d'entre eux n'utilisent pas cette donnée. La faire passer de main en main fonctionne, mais oblige à modifier la signature de composants qui n'ont rien à voir avec cette préférence, et tout nouveau composant intercalé devra penser à la transmettre. React dispose d'un outil pour qu'une donnée « saute » les niveaux intermédiaires : le **contexte**. Et sa documentation, sur la page même où elle le présente, avertit avant de s'en servir qu'il est très tentant d'en abuser ([React, « Passing Data Deeply with Context »](https://react.dev/learn/passing-data-deeply-with-context)). C'est pourquoi cette leçon ne commence pas par le contexte, mais par les deux solutions qu'il convient d'essayer avant.

La leçon comporte trois parties. En 6.1, tu construis le reducer des avis et tu le testes sans React. En 6.2, tu le connectes à deux contextes, tu écris le hook qui refuse de fonctionner sans fournisseur et tu appliques le même patron aux préférences. Et en 6.3, tu dresses l'inventaire complet : chaque fragment d'état du `revisor`, où il vit et pourquoi là. À la fin, voici ce qui apparaît sur l'écran du détail de `pagos` après avoir cliqué sur « Volver a revisar », et tu sauras d'où provient chaque pièce :

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div></section>
```

C'est la boîte d'avis telle que Chrome l'a restituée, et elle reste identique après être retourné à la liste : l'avis ne dépend plus de la page qui l'a produit.

## Les concepts

### 6.1 `useReducer` : des actions qui décrivent ce qui s'est passé

#### 6.1.1 Un reducer est une fonction que tu connais déjà

Le nom peut sembler étrange, mais l'idée ne l'est pas. Les tableaux JavaScript disposent d'une méthode, `reduce`, qui parcourt les éléments dans l'ordre et transmet le résultat de chaque étape à la suivante ; la fonction qu'on lui fournit s'appelle précisément un *reducer*, et le résultat final est une valeur unique ([MDN, `Array.prototype.reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)). La documentation de React explique que ses reducers portent ce nom par analogie : celui d'un tableau reçoit « le résultat jusqu'ici » et « l'élément courant » et renvoie le résultat suivant ; celui de React reçoit **l'état jusqu'ici** et **l'action** et renvoie **l'état suivant** ([React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Garde cela à l'esprit, car en 6.1.4 tu utiliseras littéralement le `reduce` d'un tableau avec le reducer des avis, et cela fonctionnera sans rien y changer. C'est le premier avantage d'un reducer : **il ignore tout de React**. C'est une fonction à deux arguments qui renvoie une valeur.

#### 6.1.2 Les actions : ce qui s'est passé, pas ce qu'il faut faire

Avec `useState`, le composant dit à React **quoi faire** : « mets ce tableau ». Avec un reducer, le composant lui dit **ce qui s'est passé** : « un avis a été ajouté », « la personne a écarté l'avis 3 ». Ce qui s'est passé est décrit par un objet appelé **action**, et la règle pour bien l'écrire, selon la documentation de React, est que le type d'une action décrive idéalement « ce qu'a fait l'utilisateur » et non « comment tu veux que l'état change » ; et que **chaque action décrive une seule interaction**, même si cette interaction provoque plusieurs modifications dans les données ([React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Dans le `revisor`, les actions sont au nombre de trois, et leurs noms sont volontairement au participe passé : `agregado`, `descartado`, `todos-descartados`. Elles se lisent comme un registre de faits. Remarque ce qu'elles **ne sont pas** : il n'y a pas d'action `recortar-a-cinco` ni `incrementar-id`. Quand un nouvel avis arrive, trois choses se produisent (il se place au début, la liste est tronquée à cinq et le compteur d'identifiants avance), mais la personne n'a fait qu'une seule chose : provoquer un avis. Ces trois conséquences sont l'affaire du reducer.

En TypeScript, l'ensemble des actions possibles forme une **union discriminée**, tout comme `EstadoPublico` depuis la leçon 0 : chaque membre possède une propriété `tipo` distincte et les données requises pour ce type. `agregado` apporte le niveau et le texte ; `descartado` apporte l'identifiant ; `todos-descartados` n'a besoin de rien de plus.

#### 6.1.3 Le reducer des avis

Voici le fichier complet. Tout ce qu'il y a à savoir sur les avis se trouve ici, et rien dans ce fichier n'importe quoi que ce soit de React :

```ts
// revisor/src/avisos/avisos.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      return {
        avisos: [nuevo, ...estado.avisos].slice(0, MAXIMO_AVISOS),
        siguienteId: estado.siguienteId + 1,
      };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Lis-le de haut en bas :

- **Les types.** Un `Aviso` possède un `id`, un `nivel` (`exito` ou `error`) et un `texto`. L'état n'est pas seulement la liste : `EstadoAvisos` stocke également `siguienteId`, le numéro qu'aura le prochain avis. On pourrait penser qu'il peut être calculé (« le plus grand identifiant plus un »), mais non : si tu supprimes l'avis le plus récent, le maximum diminue, et l'avis suivant réutiliserait un identifiant que React a déjà employé comme `key` pour un autre élément. C'est une donnée qui ne se déduit pas des autres, elle est donc conservée. Tous les champs sont `readonly`, et la liste est `readonly Aviso[]` : TypeScript t'interdit de la modifier, et dans « L'erreur que tu vas voir », tu pourras le vérifier.
- **`agregado`.** Construit le nouvel avis avec `siguienteId`, le place **au début** d'une nouvelle liste (`[nuevo, ...estado.avisos]`) et la découpe avec `slice(0, MAXIMO_AVISOS)`. Ni `[...]` ni `slice` ne modifient le tableau d'origine : ils en créent un autre. La limite est définie dans une constante nommée, `MAXIMO_AVISOS = 5`, et non sous la forme d'un `5` isolé, afin de pouvoir être lue et testée.
- **`descartado`.** `filter` renvoie une nouvelle liste sans l'avis portant cet `id`. Le reste de l'état est copié avec `...estado` ; `siguienteId` ne change pas, garantissant ainsi qu'un identifiant ne soit jamais réutilisé.
- **`todos-descartados`.** Une liste vide, le compteur intact.
- **`default` avec `never`.** Si TypeScript est parvenu jusqu'ici, il a déjà éliminé les trois types, et il ne reste à `accion` aucun type possible : c'est `never`. L'affecter à une variable `never` est sans conséquence tant que cette condition est vérifiée. Le jour où quelqu'un ajoutera une quatrième action à l'union en oubliant son `case`, cette affectation cessera de compiler. C'est la même technique que le manuel de TypeScript nomme vérification d'exhaustivité ([TypeScript, « Narrowing », *Exhaustiveness checking*](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)), et c'est la même que celle employée par `ContenidoReporte` depuis la leçon 0. Le `throw` ne s'exécuterait que si quelque chose contournait le système de types (par exemple, une action construite manuellement avec `as`) ; c'est le filet sous le filet.

Il y a une condition que ce fichier respecte et qui ne saute pas aux yeux : **le reducer est pur**. Il reçoit un état et une action et renvoie un état ; il ne demande rien au réseau, ne programme aucun minuteur, n'écrit pas dans la console, ne lit pas l'heure. La documentation de `useReducer` l'exige (« doit être pure ») et explique comment React la surveille : en `StrictMode`, il appelle ton reducer **deux fois** pour t'aider à détecter d'éventuelles impuretés accidentelles ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Si le reducer produisait un effet de bord, tel qu'un `fetch`, ce double appel le déclencherait deux fois en développement, ce qui est précisément ce que `StrictMode` cherche à mettre en évidence. Et il y a un détail de ce reducer qu'il est facile de casser sans le vouloir : les identifiants. Si au lieu de conserver `siguienteId` dans l'état, tu utilisais un compteur externe à la fonction (`let ultimo = 0` en haut du fichier, et `ultimo += 1` à l'intérieur), le double appel de `StrictMode` sauterait des numéros, et deux reducers traitant les mêmes actions donneraient des résultats différents. Comme le compteur voyage dans l'état, la même action appliquée au même état donne toujours exactement la même chose.

#### 6.1.4 Le tester sans React

Puisque le reducer est une fonction indépendante de React, il se teste comme n'importe quelle fonction. Cette figure importe le fichier **tel quel** et lui passe des actions. Elle s'exécute directement avec `node`, sans compilation, car Node 24 exécute les fichiers `.ts` (la leçon 0 l'a expliqué en 0.2.2) ; le `tsc` de la première ligne ne fait que vérifier les types.

```ts
// fig06_01.ts
import {
  estadoInicialAvisos,
  reducirAvisos,
  type AccionAvisos,
  type EstadoAvisos,
} from "./avisos.ts";

function mostrar(titulo: string, estado: EstadoAvisos): void {
  const lista = estado.avisos.map((aviso) => `${aviso.id}:${aviso.texto}`).join(", ");
  console.log(`${titulo}: [${lista}] siguienteId=${estado.siguienteId}`);
}

const seis: AccionAvisos[] = ["a", "b", "c", "d", "e", "f"].map((letra) => ({
  tipo: "agregado",
  nivel: "exito",
  texto: letra,
}));

const conSeis = seis.reduce(reducirAvisos, estadoInicialAvisos);
mostrar("seis agregados", conSeis);

const sinElTres = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
mostrar("descartado el 3", sinElTres);

const sinNinguno = reducirAvisos(sinElTres, { tipo: "todos-descartados" });
mostrar("todos descartados", sinNinguno);

const otraVez = reducirAvisos(conSeis, { tipo: "descartado", id: 3 });
console.log(`la misma acción sobre el mismo estado da lo mismo: ${JSON.stringify(otraVez) === JSON.stringify(sinElTres)}`);
console.log(`el estado de antes sigue intacto: ${conSeis.avisos.length} avisos`);
console.log(`el estado inicial sigue vacío: ${estadoInicialAvisos.avisos.length} avisos`);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --allowImportingTsExtensions --noEmit fig06_01.ts
$ node fig06_01.ts
seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7
descartado el 3: [6:f, 5:e, 4:d, 2:b] siguienteId=7
todos descartados: [] siguienteId=7
la misma acción sobre el mismo estado da lo mismo: true
el estado de antes sigue intacto: 5 avisos
el estado inicial sigue vacío: 0 avisos
```

Chaque ligne correspond à une affirmation que tu peux vérifier à l'œil nu :

- **`seis agregados`.** Six actions, passées avec le `reduce` du tableau, la méthode même de 6.1.1. Il en reste cinq, la plus récente en premier, et le `a` (identifiant 1) a été évincé par la limite. `siguienteId` vaut 7 : six numéros ont été attribués.
- **`descartado el 3`.** Le `c` disparaît ; les autres conservent leur identifiant.
- **`todos descartados`.** Liste vide, et `siguienteId` reste à 7 : le prochain avis sera le 7, et non le 1.
- **Les trois dernières lignes** mesurent concrètement la pureté. La même action appliquée au même état a produit le même résultat ; l'état passé en entrée conserve toujours ses cinq avis après que le reducer « l'a écarté » ; et l'état initial, qui a servi de point de départ à tout, reste vide. Le reducer n'a jamais altéré ce qu'il a reçu : il a toujours renvoyé un nouvel objet.

C'est ce que la documentation de React met au crédit du reducer lorsqu'elle le compare à `useState` : n'étant pas dépendant de ton composant, il peut être exporté et testé séparément, et on peut y ajouter un `console.log` pour observer chaque changement d'état et **pourquoi** il s'est produit, c'est-à-dire quelle action l'a déclenché ([React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer)). La même page reconnaît honnêtement le coût : avec un reducer, tu écris davantage de code au départ, entre la fonction et les actions. Pour trois actions associées à un plafond et un compteur, ce coût est largement rentabilisé. Pour une case que l'on coche et décoche, non ; c'est pourquoi les préférences de 6.2.7 conservent `useState`.

(La copie `avisos.ts` qu'importe la figure est rigoureusement identique à celle du point de contrôle : `cmp avisos.ts revisor/src/avisos/avisos.ts` n'affiche rien. Sur ta machine, copie le fichier dans ton dossier de figures.)

#### 6.1.5 `useReducer` : connecter le reducer à React

Le reducer décide ; il manque l'entité qui conserve l'état entre les rendus et lui transmet les actions. C'est le rôle de `useReducer`. Sa forme est `const [estado, despachar] = useReducer(reducer, valorInicial)` : il renvoie l'état courant et une fonction, `despachar` (*dispatch*), qui reçoit une action ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Lorsque tu appelles `despachar({ tipo: "descartado", id: 3 })`, React appelle le reducer avec l'état qu'il détient et cette action, enregistre ce que le reducer renvoie et déclenche un nouveau rendu. Si ce qu'il renvoie est **le même objet** (comparé avec `Object.is`), React saute le rendu du composant et de ses enfants ; la documentation précise qu'il appelle parfois encore le composant une fois avant d'écarter le résultat, mais cela ne modifie en rien ce qui est affiché.

Dans le `revisor`, ce qui appelle `useReducer` est un composant qui n'affiche rien qui lui soit propre, le **fournisseur** des avis :

```tsx
// revisor/src/avisos/ProveedorAvisos.tsx
import { useReducer, type ReactNode } from "react";
import { estadoInicialAvisos, reducirAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function ProveedorAvisos({ children }: { readonly children: ReactNode }) {
  const [estado, despachar] = useReducer(reducirAvisos, estadoInicialAvisos);

  return (
    <ContextoAvisos value={estado}>
      <ContextoDespachoAvisos value={despachar}>{children}</ContextoDespachoAvisos>
    </ContextoAvisos>
  );
}
```

Quatre lignes de logique, dont deux sont expliquées en 6.2. Ce qui compte ici, c'est ce que `useReducer` garantit au sujet de `despachar` : la documentation indique que cette fonction bénéficie d'une **identité stable**, c'est-à-dire qu'elle est la même fonction à chaque rendu ([React, `useReducer`](https://react.dev/reference/react/useReducer)). L'état change à chaque fois qu'un avis arrive ; `despachar`, jamais. Cette différence est à la base de la décision la plus importante de la section suivante.

### 6.2 Contexte : quand les props et `children` ne suffisent plus

#### 6.2.1 Avant le contexte, deux questions

La documentation de React est catégorique : devoir transmettre une prop sur plusieurs niveaux **ne signifie pas** que tu doives placer cette information dans un contexte. Auparavant, elle propose deux alternatives, dans cet ordre ([React, « Passing Data Deeply with Context »](https://react.dev/learn/passing-data-deeply-with-context)) :

1. **Passer des props.** Cela peut sembler fastidieux, mais cela clarifie quel composant utilise quelle donnée, et la personne qui maintiendra le code l'en remerciera.
2. **Extraire des composants et transmettre du JSX via `children`.** Si une donnée traverse des couches qui ne l'utilisent pas, c'est souvent parce qu'il a manqué d'extraire un composant : au lieu de `<Disposicion avisos={avisos} />`, qui contraint la disposition à transmettre les avis vers le bas, on écrit `<Disposicion><Bandeja avisos={avisos} /></Disposicion>`, et la disposition ignore désormais l'existence des avis.

C'est seulement si aucune des deux ne convient que le contexte intervient. Fais l'exercice avec les deux cas du `revisor`.

**Les avis.** Ce qui les affiche, la boîte d'avis, vit dans la disposition. Ce qui les produit, `useReintentar`, vit dans `PaginaServicio`, qui est rendue à l'intérieur de l'`<Outlet />`. Passer des props ne fonctionne pas ici pour une raison concrète : la disposition **ne crée pas** `PaginaServicio`. C'est le routeur qui la crée, selon l'URL, à l'emplacement de l'`Outlet`. Il n'y a aucun `<PaginaServicio despachar={…} />` écrit dans le code auquel tu pourrais ajouter une prop. Le seul canal que le routeur propose vers le bas est `<Outlet context>`, le même que celui des notes. On pourrait inclure `despachar` dans cet objet, mais alors seules les pages pourraient émettre des avis, or émettre un avis est l'affaire de l'application, pas d'une route : un composant produisant un avis ne devrait pas dépendre du fait de se trouver ou non dans l'`Outlet`. Et `children` n'aide pas non plus : il n'y a aucun composant intermédiaire à extraire, car entre la disposition et la page, il n'y a aucun de tes composants, il y a un routeur.

**Les préférences.** Le cheminement est différent, mais le résultat est identique. La case à cocher vit dans l'en-tête de la disposition. La ligne qui affiche les millisecondes est `Descripcion`, à l'intérieur de `FilaEstado`. Entre les deux : l'`Outlet`, `PaginaReporte`, `ContenidoReporte`, `ListaEstados` et `FilaEstado`. Passer la prop oblige à modifier la signature de quatre composants qui ne l'utilisent pas, ce qui correspond à la scène introductive de la leçon. Et qu'en est-il de `children` ? Ici, la question mérite d'être posée, car c'est l'alternative recommandée par la documentation avant d'envisager le contexte. Le problème est que les lignes ne peuvent pas être créées depuis le haut : c'est `ListaEstados` qui les crée via un `map` sur les états **déjà filtrés**, et le filtre dépend de l'URL, lue par `PaginaReporte`. Pour passer les lignes en tant que `children`, il faudrait extraire le `map` de `ListaEstados` et le remonter jusqu'à la disposition, qui devrait alors avoir connaissance des filtres et des requêtes. Cela reviendrait à réorganiser la moitié de l'application pour qu'une simple donnée de présentation parvienne à destination. Quand la seule manière d'éviter le contexte est de mélanger les responsabilités, le contexte est l'outil approprié.

Parmi les cas d'usage recensés par la documentation de React pour le contexte figurent précisément le **thème** de l'application (son apparence) et la **gestion d'état** que de nombreux composants éloignés doivent mettre à jour, « souvent au moyen d'un reducer combiné avec le contexte » ([React, « Passing Data Deeply with Context »](https://react.dev/learn/passing-data-deeply-with-context)). Les préférences correspondent au premier cas ; les avis, au second.

#### 6.2.2 Créer, fournir et lire un contexte

Un contexte s'articule en trois temps :

1. **Il se crée** avec `createContext(valorPorOmision)`. L'argument est la valeur que recevra quiconque lit le contexte si **aucun fournisseur** ne se trouve au-dessus de lui dans l'arborescence ; la documentation le qualifie de valeur de « dernier recours », statique, qui ne change jamais ([React, `createContext`](https://react.dev/reference/react/createContext)).
2. **Il se fournit** en rendant le contexte sous forme de composant muni d'une prop `value` : `<ContextoAvisos value={estado}>…</ContextoAvisos>`. Tout ce qui se trouve à l'intérieur, à n'importe quelle profondeur, peut lire cette valeur. Depuis React 19, cela s'écrit directement ainsi, avec le contexte lui-même ; auparavant, on écrivait `<ContextoAvisos.Provider value={…}>`, une forme que la documentation qualifie désormais d'héritée ([React, `createContext`](https://react.dev/reference/react/createContext)) et que l'équipe de React a annoncé vouloir marquer comme obsolète dans les versions futures ([React, « React v19 »](https://react.dev/blog/2024/12/05/react-19)). Si tu consultes du code ou des tutoriels antérieurs, tu verras du `.Provider` partout : le fonctionnement est le même.
3. **Il se lit** avec `useContext(Contexto)`, qui recherche **le fournisseur le plus proche vers le haut** au-dessus du composant appelant, sans tenir compte d'un fournisseur que ce composant rendrait lui-même ([React, `useContext`](https://react.dev/reference/react/useContext)).

Les contextes des avis résident dans leur propre fichier, comme le préconise la documentation lorsque plusieurs fichiers en ont besoin ([React, `createContext`](https://react.dev/reference/react/createContext)) :

```ts
// revisor/src/avisos/contextos.ts
import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
```

Deux détails. Le premier : la valeur par défaut est `null`, et le type le reflète explicitement (`EstadoAvisos | null`). C'est un choix délibéré, et non un oubli, et 6.2.4 explique pourquoi cela vaut mieux qu'une valeur qui « marche à peu près ». Le second : **ce sont deux contextes**, et non un seul.

#### 6.2.3 Deux contextes : l'état et le dispatch

Revenons à `ProveedorAvisos` de 6.1.5. L'état va dans `ContextoAvisos` ; `despachar` va dans `ContextoDespachoAvisos`. Pourquoi ne pas utiliser un seul contexte avec un objet `{ estado, despachar }` ? Le guide de React associant reducer et contexte préconise exactement cette séparation, un contexte pour la liste et un autre pour la fonction de dispatch d'actions ([React, « Scaling Up with Reducer and Context »](https://react.dev/learn/scaling-up-with-reducer-and-context)). Il n'en donne pas la raison ; celle fournie par cette leçon découle d'une règle de `useContext` : React re-rend **tous les composants qui lisent un contexte** dès lors que son fournisseur reçoit une `value` différente, comparée avec `Object.is`, et sauter des rendus avec `memo` ne l'empêche nullement ([React, `useContext`](https://react.dev/reference/react/useContext)).

Avec un seul contexte, la `value` est un nouvel objet à chaque changement d'état, de sorte que quiconque lit le contexte subit un nouveau rendu, **même s'il ne souhaite que dispatcher**. Dans le `revisor`, nous avons un composant dans ce cas : `useReintentar`, qui produit des avis et ne les lit jamais ; et n'importe quel formulaire notifiant son résultat en serait un autre. Avec deux contextes, celui de dispatch conserve une fonction stable et sa `value` ne change jamais. Ce n'est pas une simple théorie : cela se mesure en comptant. Cette figure monte une boîte d'avis et un bouton au sein d'un fournisseur, clique trois fois sur le bouton et comptabilise le nombre de rendus effectués par chacun, d'abord avec un contexte unique, puis avec deux contextes séparés. Pour compter sans polluer le rendu, chaque composant appelle `useContarDibujos`, un hook doté d'un Effect **sans** tableau de dépendances, qui s'exécute après chaque rendu confirmé :

```tsx
// fig06_03.tsx
import { JSDOM } from "jsdom";
import {
  act,
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ComponentType,
  type Dispatch,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Accion = { readonly tipo: "agregado" };
type Despachar = Dispatch<Accion>;

function contar(cuantos: number, accion: Accion): number {
  return accion.tipo === "agregado" ? cuantos + 1 : cuantos;
}

// Un Effect sin lista de dependencias corre después de cada dibujo confirmado:
// sirve para contar sin ensuciar el dibujo mismo.
const dibujos = { bandeja: 0, boton: 0 };

function useContarDibujos(quien: keyof typeof dibujos): void {
  useEffect(() => {
    dibujos[quien] += 1;
  });
}

// Uno: estado y despacho en el mismo valor.
const ContextoJunto = createContext<{ cuantos: number; despachar: Despachar } | null>(null);

function ProveedorJunto({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return <ContextoJunto value={{ cuantos, despachar }}>{children}</ContextoJunto>;
}

function BandejaJunta() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoJunto)?.cuantos} avisos</p>;
}

function BotonJunto() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoJunto)?.despachar;
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

// Dos: un contexto para el estado y otro para el despacho.
const ContextoEstado = createContext<number | null>(null);
const ContextoDespacho = createContext<Despachar | null>(null);

function ProveedorSeparado({ children }: { readonly children: ReactNode }) {
  const [cuantos, despachar] = useReducer(contar, 0);
  return (
    <ContextoEstado value={cuantos}>
      <ContextoDespacho value={despachar}>{children}</ContextoDespacho>
    </ContextoEstado>
  );
}

function BandejaSeparada() {
  useContarDibujos("bandeja");
  return <p>{useContext(ContextoEstado)} avisos</p>;
}

function BotonSeparado() {
  useContarDibujos("boton");
  const despachar = useContext(ContextoDespacho);
  return (
    <button type="button" onClick={() => despachar?.({ tipo: "agregado" })}>
      Avisar
    </button>
  );
}

async function tresClics(
  titulo: string,
  Proveedor: ComponentType<{ children: ReactNode }>,
  Bandeja: ComponentType,
  Boton: ComponentType,
): Promise<void> {
  dibujos.bandeja = 0;
  dibujos.boton = 0;
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(
      <Proveedor>
        <Bandeja />
        <Boton />
      </Proveedor>,
    );
  });

  const boton = contenedor.querySelector("button");
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }

  console.log(titulo);
  console.log(`  en pantalla: "${contenedor.querySelector("p")?.textContent}"`);
  console.log(`  dibujos de la bandeja: ${dibujos.bandeja}   dibujos del botón: ${dibujos.boton}`);
  await act(async () => {
    raiz.unmount();
  });
}

await tresClics("un contexto con { cuantos, despachar }:", ProveedorJunto, BandejaJunta, BotonJunto);
await tresClics("dos contextos, estado y despacho:", ProveedorSeparado, BandejaSeparada, BotonSeparado);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_03.tsx
$ node fig06_03.js
un contexto con { cuantos, despachar }:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 4
dos contextos, estado y despacho:
  en pantalla: "3 avisos"
  dibujos de la bandeja: 4   dibujos del botón: 1
```

La boîte d'avis effectue quatre rendus dans les deux configurations : un au montage et un pour chaque avis. C'est normal, puisqu'elle affiche le décompte. La différence porte sur le bouton. Avec un contexte unique, il effectue quatre rendus, tout comme la boîte d'avis, sans jamais avoir affiché quoi que ce soit de nouveau ; avec deux contextes, il n'en effectue qu'un seul, au montage. Sur un écran comportant un seul bouton, cela ne se remarque pas. Sur un écran doté de cinquante composants qui ne font que dispatcher, cela représente cinquante rendus superflus à chaque avis, tous parfaitement inutiles.

Trois remarques au sujet de la figure, car elles éclairent le code du `revisor`. La première : le bouton et la boîte d'avis **ne subissent pas** de nouveau rendu du simple fait que le fournisseur se re-rende. Le fournisseur reçoit les deux sous forme de `children`, et `children` est une valeur créée par l'appelant du fournisseur, une seule fois ; quand le fournisseur modifie son état et se re-rende, `children` reste le même objet et React n'a aucune raison de le re-rendre. La seule chose qui contraint un enfant à se re-rendre est la lecture d'un contexte ayant changé. C'est la composition de la leçon 1 qui joue en ta faveur. La deuxième : la figure monte sans `StrictMode` afin que les décomptes soient exacts (avec lui, le cycle supplémentaire des Effects au montage ajouterait une unité à chaque composant, sans modifier l'écart observé). Et une troisième sur l'instrumentation : le compteur est une variable externe à React, et l'Effect l'incrémente. Le faire dans le corps du composant (`dibujos.boton += 1` pendant le rendu) constituerait l'impureté que la leçon 1 t'a appris à traquer, et le linter la rejetterait avec `react-hooks/immutability`. Au sein d'un Effect, c'est licite : l'Effect existe précisément pour interagir avec ce qui se trouve hors de React. Il s'agit néanmoins d'un instrument de mesure propre à la figure, et non de code destiné au `revisor` ; pour mesurer les rendus dans une véritable application, l'outil adéquat est le Profiler des outils de développement. `npx eslint` sur les figures de cette leçon ne renvoie aucun avertissement.

Ne serait-il pas plus simple d'envelopper l'objet dans un `useMemo` ? La documentation de `useContext` le suggère lorsque la valeur est un objet contenant des fonctions : c'est une optimisation de performance, tout en précisant que dans de petites applications, ce n'est pas un problème ([React, `useContext`](https://react.dev/reference/react/useContext)). Séparer en deux contextes n'est pas une optimisation ajoutée après coup : c'est la structure naturelle des données, car l'état et le dispatch évoluent à des rythmes différents. Et cela n'exige de mémoïser quoi que ce soit. C'est la différence entre bien structurer dès le départ et colmater avec un outil qui a son propre coût, ce qui constitue la philosophie de ce cours.

#### 6.2.4 Un hook qui refuse de fonctionner sans fournisseur

Personne dans le `revisor` n'appelle `useContext` directement. Deux hooks s'en chargent, un par contexte :

```ts
// revisor/src/avisos/usarAvisos.ts
import { useContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";
import { ContextoAvisos, ContextoDespachoAvisos } from "./contextos";

export function useAvisos(): EstadoAvisos {
  const estado = useContext(ContextoAvisos);

  if (estado === null) {
    throw new Error("useAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return estado;
}

export function useDespachoAvisos(): Dispatch<AccionAvisos> {
  const despachar = useContext(ContextoDespachoAvisos);

  if (despachar === null) {
    throw new Error("useDespachoAvisos necesita un <ProveedorAvisos> más arriba en el árbol");
  }

  return despachar;
}
```

Tous deux accomplissent la même tâche : ils lisent le contexte et, s'ils reçoivent `null`, **lèvent une erreur précisant ce qui manque et où**. `null` ne peut provenir que d'un seul endroit : la valeur par défaut de `createContext`, que React n'utilise que lorsqu'il ne trouve aucun fournisseur vers le haut. Si `null` survient, c'est que quelqu'un a rendu un composant utilisant les avis en dehors de `ProveedorAvisos`. Comme le `if` élimine le `null`, ce que renvoie le hook bénéficie déjà du type exact, `EstadoAvisos` ou `Dispatch<AccionAvisos>`, et l'utilisateur du hook n'a aucune vérification à faire.

Le guide de React suggère d'exporter des hooks personnalisés de ce type et indique qu'ils ne modifient pas le comportement, mais qu'ils te permettent plus tard de scinder les contextes ou « d'ajouter un peu de logique » à ces fonctions ([React, « Scaling Up with Reducer and Context »](https://react.dev/learn/scaling-up-with-reducer-and-context)). La vérification du fournisseur constitue précisément cette logique. Pourquoi lever une erreur plutôt que de fournir au contexte une valeur par défaut « fonctionnelle », comme une liste vide et une fonction no-op ? Parce qu'une telle valeur masque l'erreur au lieu de la signaler. Cette figure monte les deux variantes **sans fournisseur** :

```tsx
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
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig06_02.tsx
$ node fig06_02.js
A, con valor por omisión:
  en pantalla: "0 avisos"
  después del clic: "0 avisos"
B, con el hook que lanza:
  error al dibujar: useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
  en pantalla: ""
```

La version A n'échoue pas. Elle affiche « 0 avisos », et le clic sur le bouton n'échoue pas davantage : il appelle la fonction vide de la valeur par défaut, qui ne fait rien, et l'écran continue d'afficher « 0 avisos ». C'est le pire résultat possible, car tout **semble** fonctionner : l'utilisateur clique sur « Volver a revisar » et ne voit jamais l'avis, sans que personne ne comprenne pourquoi, car aucune erreur n'apparaît nulle part. La version B s'interrompt dès le premier rendu avec un message désignant nommément le composant manquant. Une erreur qui survient dès la première exécution du code, énonçant explicitement sa cause, a bien plus de valeur qu'un écran qui ment en silence.

Où atterrirait cette erreur dans le `revisor` ? Cela dépend d'où se trouverait le composant dépourvu de fournisseur. S'il s'agissait d'une page, la frontière d'erreur de la route racine ajoutée à la leçon 5 l'intercepterait, et son avertissement, portant le message du hook, occuperait l'emplacement de toute la disposition ; s'il se trouvait hors du routeur, `LimiteDeError` l'intercepterait. Dans les deux cas, le message affiché serait celui du hook. Dans le point de contrôle, cela ne peut pas se produire, car les fournisseurs enveloppent l'ensemble de l'application (comme tu le verras en 6.2.8). En revanche, cela pourrait arriver dans un test montant une page isolée : si quelqu'un omettait les fournisseurs lors du montage, l'erreur le signalerait sans la moindre ambiguïté.

Un détail supplémentaire de `useContext` qu'il convient de connaître : si un fournisseur existe mais que tu as oublié d'écrire `value`, React n'utilise pas la valeur par défaut ; c'est comme si tu avais passé `value={undefined}` ([React, `useContext`](https://react.dev/reference/react/useContext)). Le hook du `revisor` compare à `null` et laisserait passer cet `undefined`, mais TypeScript l'intercepte en amont : le contexte a été créé avec le type `EstadoAvisos | null`, et un fournisseur dépourvu de `value` ne compile pas.

#### 6.2.5 La boîte d'avis, une région dynamique

Les hooks étant prêts, la boîte d'avis est brève :

```tsx
// revisor/src/avisos/BandejaAvisos.tsx
import { useAvisos, useDespachoAvisos } from "./usarAvisos";

export function BandejaAvisos() {
  const { avisos } = useAvisos();
  const despachar = useDespachoAvisos();

  return (
    <section className="bandeja" aria-label="Avisos">
      <div role="status">
        {avisos.length > 0 && (
          <ul>
            {avisos.map((aviso) => (
              <li key={aviso.id} className={`aviso-${aviso.nivel}`}>
                {aviso.texto}{" "}
                <button
                  type="button"
                  aria-label={`Descartar: ${aviso.texto}`}
                  onClick={() => despachar({ tipo: "descartado", id: aviso.id })}
                >
                  Descartar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {avisos.length > 1 && (
        <button type="button" onClick={() => despachar({ tipo: "todos-descartados" })}>
          Descartar todos
        </button>
      )}
    </section>
  );
}
```

Elle lit les avis avec `useAvisos()` et obtient `despachar` avec `useDespachoAvisos()`. Chaque bouton « Descartar » dispatche `descartado` avec l'identifiant de son avis, et ce même identifiant sert de `key` à la ligne, stable et unique grâce au compteur du reducer. « Descartar todos » n'apparaît que s'il y a plus d'un avis.

La partie conçue avec le plus grand soin est l'accessibilité. Un avis surgit à l'écran sans que l'utilisateur ne l'ait demandé à cet endroit précis : il a cliqué sur un bouton ailleurs sur la page, ou a navigué vers une autre page. Une personne voyant l'écran le remarque ; celle qui utilise un lecteur d'écran ne le remarque pas, à moins que l'avis ne figure au sein d'une **région dynamique** (*live region*). Le rôle `status` définit une région dynamique véhiculant des informations de notification qui ne sont pas assez urgentes pour constituer une alerte ; il implique par défaut `aria-live="polite"` et `aria-atomic="true"`, si bien que le lecteur d'écran l'annonce dès que l'utilisateur cesse son activité en cours, sans l'interrompre ([MDN, rôle `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).

Remarque bien **où** se trouve le `role="status"` : sur un `div` qui existe en permanence, même en l'absence d'avis. Ce qui apparaît et disparaît, c'est la liste interne. Ce n'est pas un caprice : le guide des régions dynamiques de MDN explique que les technologies d'assistance n'annoncent généralement que les changements **dynamiques** au sein d'une région préexistante, qu'il est préférable d'établir la région vide avant de la remplir, et que la solution la plus fiable consiste à ce qu'elle figure dans le balisage initial ([MDN, « ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Si la région apparaissait en même temps que son premier avis, cet avis risquerait de ne jamais être vocalisé. Le bouton « Descartar todos » reste **en dehors** de la région selon la même logique inversée : son apparition ou sa disparition ne constitue pas une nouveauté à vocaliser. Enfin, l'`aria-label` de chaque bouton « Descartar » spécifie quel avis il écarte, évitant ainsi qu'un lecteur d'écran n'énonce cinq boutons identiques.

Deux implications de cette région méritent d'être soulignées, car elles ont des conséquences directes. La première découle du `aria-atomic="true"` implicite : avec cet attribut, dès que la région change, le lecteur d'écran la restitue **intégralement**, même si seule une partie a été modifiée ([MDN, « ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Avec cinq avis dans la boîte, le sixième peut provoquer la relecture des cinq avis restants, avec l'intitulé de leurs boutons respectifs. Si cela s'avère gênant lors des essais avec un lecteur d'écran, placer `aria-atomic="false"` sur le `div` permet de n'annoncer que les nouveaux éléments ; le point de contrôle de cette leçon s'en tient au comportement par défaut du rôle. La seconde relève d'un choix de conception : les avis de niveau `error` prennent également place dans cette région polie, qui patiente jusqu'à ce que la personne ait terminé son action, plutôt que dans un `role="alert"`, qui interrompt immédiatement. Le résultat d'une nouvelle tentative ne justifie pas une interruption ; une erreur bloquant la poursuite du travail la justifierait.

Avec ce changement, le `revisor` dispose désormais de deux éléments avec `role="status"` : celui de la boîte d'avis et le « Cargando… » des pages. Garde-le à l'esprit si tu recherches un jour un élément par son rôle : « le » `status` de la page n'est plus unique.

#### 6.2.6 Dispatcher depuis la mutation

Le producteur d'avis est `useReintentar`, le hook de mutation issu de la leçon 4 :

```ts
// revisor/src/detalle/useReintentar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { claves } from "../consultas/claves";
import { reintentarServicio } from "./reintentar";

export function useReintentar(nombre: string) {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();

  return useMutation({
    mutationFn: () => reintentarServicio(nombre),
    onSuccess: async (estado) => {
      despachar({
        tipo: "agregado",
        nivel: estado.tipo === "disponible" ? "exito" : "error",
        texto:
          estado.tipo === "disponible"
            ? `${nombre} se volvió a revisar: disponible`
            : `${nombre} se volvió a revisar: sigue en falla`,
      });
      await Promise.all([
        clienteConsultas.invalidateQueries({ queryKey: claves.reporte }),
        clienteConsultas.invalidateQueries({ queryKey: claves.servicio(nombre) }),
      ]);
    },
    onError: (error) => {
      despachar({
        tipo: "agregado",
        nivel: "error",
        texto: `No se pudo volver a revisar ${nombre}: ${error.message}`,
      });
    },
  });
}
```

Il obtient `despachar` via le hook et l'emploie dans les deux issues de la mutation. Dans `onSuccess`, le serveur a répondu en renvoyant le nouvel état du service, et l'avis indique ce qu'il en est : `disponible`, avec le niveau `exito`, ou `sigue en falla`, avec le niveau `error`. Dans `onError`, la requête a échoué et l'avis comporte le message d'erreur. Les invalidations de la leçon 4 demeurent en place, après l'avis. Le hook ne lit aucun avis ; il se contente de dispatcher. C'est exactement le consommateur évoqué en 6.2.3 : grâce aux deux contextes, l'arrivée de nouveaux avis ne l'oblige nullement à se re-rendre.

Ces callbacks présentent une propriété essentielle qui permet à l'avis de survivre au changement de page, et qu'il convient de connaître. TanStack Query fait la distinction entre les callbacks transmis à `useMutation`, comme ici, et ceux passés à `mutate()` : les seconds **ne s'exécutent pas** si le composant a été démonté avant l'achèvement de la mutation ([TanStack Query, « Mutations »](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). Ceux de `useMutation` sont ceux prévus pour les effets de bord tels que l'invalidation de requêtes, raison pour laquelle ils ont été placés là dès la leçon 4. Pour l'avis, la conséquence répond exactement au besoin de la scène initiale : l'utilisateur clique sur « Volver a revisar » et retourne à la liste ; la mutation s'achève ; l'avis est dispatché vers une boîte d'avis située dans la disposition, qui n'a jamais été démontée.

Et comme le résultat parvient désormais à la boîte d'avis, la page du service cesse d'afficher sa propre alerte :

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
      {consulta.isError && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isSuccess && (
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

Le seul changement par rapport à la leçon 5 réside dans ce qui a disparu : le bloc `{reintento.isError && <p role="alert">…</p>}` qui figurait sous le bouton. S'il était resté, une erreur aurait été annoncée deux fois, une fois sur la page et une fois dans la boîte d'avis, et celle de la page aurait disparu à la navigation. Un seul fait, un seul endroit.

#### 6.2.7 Les préférences : le même patron, sans reducer

Les préférences adoptent la même structure que les avis (un contexte initialisé à `null` par défaut, un fournisseur, un hook qui lève une erreur), avec deux différences qui relèvent de choix délibérés qu'il convient de comprendre. Le type et les valeurs initiales :

```ts
// revisor/src/preferencias/preferencias.ts
export interface Preferencias {
  readonly mostrarDuracion: boolean;
  readonly compacto: boolean;
}

export const preferenciasIniciales: Preferencias = { mostrarDuracion: true, compacto: false };

export interface ValorPreferencias {
  readonly preferencias: Preferencias;
  readonly cambiarPreferencias: (cambio: Partial<Preferencias>) => void;
}
```

Le contexte, dans son fichier :

```ts
// revisor/src/preferencias/contexto.ts
import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
```

Le fournisseur :

```tsx
// revisor/src/preferencias/ProveedorPreferencias.tsx
import { useState, type ReactNode } from "react";
import { ContextoPreferencias } from "./contexto";
import { preferenciasIniciales, type Preferencias } from "./preferencias";

export function ProveedorPreferencias({ children }: { readonly children: ReactNode }) {
  const [preferencias, establecerPreferencias] = useState<Preferencias>(preferenciasIniciales);

  function cambiarPreferencias(cambio: Partial<Preferencias>): void {
    establecerPreferencias((actuales) => ({ ...actuales, ...cambio }));
  }

  return (
    <ContextoPreferencias value={{ preferencias, cambiarPreferencias }}>
      {children}
    </ContextoPreferencias>
  );
}
```

**Première différence : `useState` et non `useReducer`.** Il n'y a que deux cases à cocher, et l'unique opération consiste à « modifier ces préférences ». Une fonction `cambiarPreferencias` recevant un `Partial<Preferencias>` et le fusionnant via la forme fonctionnelle de mise à jour de la leçon 2 règle la question en trois lignes. Un reducer muni d'une action `cambiado` produirait le même résultat avec un surcroît de cérémonie inutile. La documentation le formule ainsi : `useState` reste très lisible lorsque les mises à jour sont simples ([React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Le reducer a gagné sa place dans les avis en raison du plafond, du compteur et de trois manières distinctes de modifier la liste, conditions qui sont totalement absentes ici.

**Seconde différence : un contexte unique, avec un objet.** La `value` est `{ preferencias, cambiarPreferencias }`, un nouvel objet à chaque rendu du fournisseur, et `cambiarPreferencias` est également une nouvelle fonction à chaque fois. Ne retrouve-t-on pas le problème soulevé en 6.2.3 ? Regarde qui lit ce contexte : `PanelPreferencias`, qui affiche les cases et les modifie, et `Descripcion`, qui lit `mostrarDuracion`, en plus de la disposition, qui lit `compacto`. **Tous lisent les préférences.** Aucun consommateur n'écrit exclusivement, si bien que dissocier le dispatch n'économiserait aucun rendu : lorsque les préférences changent, tous doivent de toute façon être re-rendus. Et qu'en est-il du nouvel objet créé à chaque rendu ? `ProveedorPreferencias` ne subit de nouveau rendu que lorsque son propre état change, car il reçoit son contenu sous forme de `children` ; et lorsque son état change, ce nouvel objet constitue précisément l'information que l'on veut notifier. Aucun rendu n'est à mémoïser.

Le hook, analogue à celui des avis :

```ts
// revisor/src/preferencias/usarPreferencias.ts
import { useContext } from "react";
import { ContextoPreferencias } from "./contexto";
import type { ValorPreferencias } from "./preferencias";

export function usePreferencias(): ValorPreferencias {
  const valor = useContext(ContextoPreferencias);

  if (valor === null) {
    throw new Error("usePreferencias necesita un <ProveedorPreferencias> más arriba en el árbol");
  }

  return valor;
}
```

Le panneau comportant les deux cases à cocher, logé dans l'en-tête :

```tsx
// revisor/src/preferencias/PanelPreferencias.tsx
import { usePreferencias } from "./usarPreferencias";

export function PanelPreferencias() {
  const { preferencias, cambiarPreferencias } = usePreferencias();

  return (
    <fieldset className="preferencias">
      <legend>Preferencias</legend>
      <label>
        <input
          type="checkbox"
          checked={preferencias.mostrarDuracion}
          onChange={(evento) => cambiarPreferencias({ mostrarDuracion: evento.target.checked })}
        />{" "}
        Mostrar duración
      </label>
      <label>
        <input
          type="checkbox"
          checked={preferencias.compacto}
          onChange={(evento) => cambiarPreferencias({ compacto: evento.target.checked })}
        />{" "}
        Vista compacta
      </label>
    </fieldset>
  );
}
```

Ce sont des cases **contrôlées** : leur état affiché découle de `preferencias`, et chaque modification passe par `cambiarPreferencias`. Elles sont logées au sein d'un `fieldset` avec `legend`, le regroupement natif du HTML pour les contrôles associés, qui fournit au lecteur d'écran l'intitulé du groupe, « Preferencias », avant chaque case. Et chaque `input` se trouve imbriqué dans son `label`, de sorte que le libellé constitue son nom accessible et qu'un clic sur le texte active la case.

Et le consommateur en profondeur, justification de toute cette mise en place :

```tsx
// revisor/src/reporte/FilaEstado.tsx
import { Link } from "react-router";
import type { EstadoPublico } from "../compartido/contrato";
import { usePreferencias } from "../preferencias/usarPreferencias";

function Descripcion({ estado }: { readonly estado: EstadoPublico }) {
  const { preferencias } = usePreferencias();

  if (estado.tipo === "disponible") {
    return preferencias.mostrarDuracion ? (
      <>
        disponible (HTTP {estado.codigoHttp}, {estado.duracionMs} ms)
      </>
    ) : (
      <>disponible (HTTP {estado.codigoHttp})</>
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

`usePreferencias()` est appelé dans `Descripcion`, qui est précisément le composant affichant la durée, et dans aucun autre composant de la liste. `ListaEstados`, `ContenidoReporte` et `PaginaReporte` n'ont pas changé d'une seule ligne. Compare avec la scène initiale : le même résultat, sans altérer les trois fichiers intermédiaires. Et `FilaEstado` n'a pas modifié sa signature : il continue de recevoir `estado` et `tieneNota`, et rien d'autre.

À la feuille de style s'ajoutent, à la fin, les règles de la boîte d'avis, du groupe de préférences et de la vue compacte :

```css
/* agregado al final de revisor/src/reporte/panel.css */
.preferencias {
  border: none;
  display: flex;
  gap: 1rem;
  padding: 0;
}

.bandeja ul {
  margin: 0.5rem 0;
}

.bandeja li.aviso-exito {
  border-color: #1a7f37;
}

.bandeja li.aviso-error {
  border-color: #cf222e;
}

main.compacto li {
  margin: 0.125rem 0;
  padding: 0.125rem 0.5rem;
}
```

#### 6.2.8 Où placer les fournisseurs

Un fournisseur ne dessert que ce qui se trouve à **l'intérieur** de lui. La question consiste donc à déterminer à quelle hauteur le positionner. La disposition a besoin des préférences (pour la classe `compacto`) et effectue le rendu de la boîte d'avis (qui a besoin des avis). `PaginaServicio` a besoin de dispatcher. Les deux résident à l'intérieur du routeur, si bien que les fournisseurs doivent se situer **au-dessus** de `RouterProvider`. On les regroupe dans un composant dédié :

```tsx
// revisor/src/app/Proveedores.tsx
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ProveedorAvisos } from "../avisos/ProveedorAvisos";
import { ProveedorPreferencias } from "../preferencias/ProveedorPreferencias";

export function Proveedores({
  clienteConsultas,
  children,
}: {
  readonly clienteConsultas: QueryClient;
  readonly children: ReactNode;
}) {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorPreferencias>
        <ProveedorAvisos>{children}</ProveedorAvisos>
      </ProveedorPreferencias>
    </QueryClientProvider>
  );
}
```

L'ordre repose sur une raison précise. `QueryClientProvider` se place à l'extérieur, comme dans la leçon 4. Préférences et avis étant mutuellement indépendants, leur ordre relatif importe peu ; ce qui compte, c'est qu'ils se situent tous deux à l'intérieur du client de requêtes et à l'extérieur du routeur. Le client de requêtes est reçu en tant que prop, au lieu d'être instancié à l'intérieur, afin que quiconque monte l'application puisse décider lequel utiliser. Un test, par exemple, nécessitera un `QueryClient` neuf pour chaque scénario, sans nouvelles tentatives, et pourra avec ce composant réutiliser exactement les mêmes fournisseurs que l'application réelle. Si un quatrième fournisseur venait à s'ajouter demain, on l'ajouterait ici, et tout ce qui utilise `Proveedores` en bénéficierait sans modification.

`main.tsx` utilise `Proveedores` à la place du `QueryClientProvider` qu'il contenait :

```tsx
// revisor/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Proveedores } from "./app/Proveedores";
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
      <Proveedores clienteConsultas={clienteConsultas}>
        <RouterProvider router={enrutador} />
      </Proveedores>
    </LimiteDeError>
  </StrictMode>,
);
```

Et la disposition effectue le rendu du panneau de préférences dans l'en-tête, de la boîte d'avis entre l'en-tête et le contenu, tout en appliquant la classe `compacto` :

```tsx
// revisor/src/app/Disposicion.tsx
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BandejaAvisos } from "../avisos/BandejaAvisos";
import { PanelPreferencias } from "../preferencias/PanelPreferencias";
import { usePreferencias } from "../preferencias/usarPreferencias";
import { conNota, type Notas } from "../reporte/notas";
import "../reporte/panel.css";
import type { ContextoNotas } from "./contextoNotas";

export function Disposicion() {
  const [notas, establecerNotas] = useState<Notas>({});
  const { preferencias } = usePreferencias();

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
        <PanelPreferencias />
      </header>
      <BandejaAvisos />
      <main className={preferencias.compacto ? "compacto" : undefined}>
        <Outlet context={contexto} />
      </main>
    </>
  );
}
```

La boîte d'avis se trouve **en dehors** de `<main>` et en dehors de l'`Outlet` : elle n'appartient à aucune page en particulier, raison pour laquelle aucune page ne l'emporte en se démontant. Les notes demeurent exactement là où la leçon 5 les avait laissées, dans le `useState` de la disposition, et descendent via `<Outlet context>`. La section suivante explique pourquoi à cet endroit précis.

### 6.3 Quel état vit où

#### 6.3.1 L'inventaire

Avec cette leçon, le `revisor` héberge de l'état dans cinq emplacements distincts. Chacun repose sur une justification propre, qu'il convient de pouvoir formuler en une phrase :

| État | Où il vit | Pourquoi là |
|---|---|---|
| brouillon d'une note | **local** : `useState` dans `EditorNota` | n'intéresse que la personne en train d'écrire, et se réinitialise lors du changement de service via `key={nombre}` |
| « Solo fallas » et texte recherché | **URL** : `?fallas=1&q=` | décrivent la vue ; se partagent en copiant le lien et survivent à un rechargement |
| service actuellement consulté | **URL** : `/servicios/:nombre` | c'est la page elle-même |
| liste des services et détail | **serveur** : TanStack Query, `["reporte"]` et `["servicio", nombre]` | appartiennent au serveur ; l'écran conserve une copie en cache qui s'actualise d'elle-même |
| notes enregistrées | **disposition** : `useState` dans `Disposicion`, descendent via `<Outlet context>` | deux pages les utilisent, la liste et le détail, et personne d'autre en dehors des pages |
| avis | **contexte** : `useReducer` dans `ProveedorAvisos` | produits par les pages et affichés par la disposition ; doivent survivre au changement de page |
| préférences | **contexte** : `useState` dans `ProveedorPreferencias` | modifiées par l'en-tête et lues par une ligne située cinq niveaux plus bas |

La règle qui organise ce tableau reprend celle de la leçon 2, avec des paliers supplémentaires. La documentation de React l'énonce sous le principe d'une **source unique de vérité** : pour chaque fragment d'état, on choisit le composant qui en est le « propriétaire », ce qui ne signifie pas que tout l'état doive résider au même endroit, mais que chaque fragment vit dans un composant spécifique ([React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components)). Cette leçon y ajoute deux destinations de choix supplémentaires — l'URL et le serveur étant déjà acquis — ainsi qu'une démarche de décision.

#### 6.3.2 Les questions, dans l'ordre

Face à une nouvelle donnée, pose-toi ces questions dans cet ordre précis, et arrête-toi à la première réponse affirmative :

1. **Peut-elle être calculée à partir d'un autre état ou des props ?** Alors ce n'est pas un état. On la calcule lors du rendu. C'est la règle de la leçon 2 (« évite l'état redondant », [React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure)) ; le nombre d'anomalies du titre et la liste filtrée du rapport se calculent, ils ne se stockent pas.
2. **Appartient-elle au serveur ?** Alors elle réside sur le serveur et l'écran la sollicite via TanStack Query. La dupliquer dans un `useState` crée deux vérités vouées à se désynchroniser.
3. **Décrit-elle ce que l'utilisateur est en train de regarder, de façon à ce qu'il veuille la partager ou recharger la page ?** Alors elle va dans l'URL.
4. **Un seul composant l'utilise-t-il ?** Alors elle est locale.
5. **Plusieurs composants l'utilisent-ils ?** Remonte-la vers l'ancêtre commun le plus proche et transmets-la par les props. Si l'ancêtre commun est la disposition et que les consommateurs sont des pages, le canal approprié est `<Outlet context>`.
6. **Les props obligent-elles à traverser des composants qui n'en ont pas l'usage, et réorganiser avec `children` ne permet-il pas de le résoudre sans mélanger les responsabilités ?** Alors, contexte.

Le contexte est l'ultime question, et non la première. Non pas qu'il soit néfaste, mais parce qu'il masque davantage les choses : un composant qui lit un contexte dépend d'un élément qui ne figure pas dans sa signature. La documentation de React défend les props précisément pour cette raison : elles explicitent quel composant utilise quelle donnée ([React, « Passing Data Deeply with Context »](https://react.dev/learn/passing-data-deeply-with-context)).

#### 6.3.3 Pourquoi les notes ne passent pas dans un contexte

C'est la question évidente de cette leçon. Les notes remontent déjà jusqu'à la disposition, elles sont déjà partagées par deux pages, et il y a désormais des contextes un peu partout. Pourquoi ne pas créer un `ProveedorNotas` aux côtés des deux autres ? Soumets les notes aux six questions et la réponse s'impose d'elle-même : elles s'arrêtent à la cinquième. Plusieurs composants les utilisent, certes, mais **ce sont tous des pages**, et l'ancêtre commun des pages est la disposition. Le canal existe déjà et correspond à celui que le routeur met à disposition à cet effet : React Router présente `<Outlet context>` comme la solution intégrée au cas où une route parente gère un état qu'elle souhaite partager avec ses enfants, en précisant que tu pourrais créer ton propre contexte, mais que ce cas d'usage est si fréquent qu'il est directement intégré dans l'`Outlet` ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)).

Trois raisons supplémentaires, parfaitement concrètes, s'y ajoutent :

- **La portée est la bonne.** Avec l'`Outlet`, les notes n'atteignent que les pages. Un contexte placé dans `Proveedores` les rendrait visibles par tout le monde : la boîte d'avis, le panneau de préférences, n'importe quel composant futur. Personne en dehors des pages n'en a besoin, et accorder à une donnée une portée supérieure à ses besoins revient à inviter d'autres composants à en dépendre.
- **Les consommateurs ne sont pas éloignés.** `PaginaReporte` lit les notes et les transmet à `ListaEstados`, qui les utilise pour calculer `tieneNota`. Entre les deux ne s'intercale qu'un seul composant, `ContenidoReporte`, qui les reçoit et les passe sans s'en servir. Un niveau intermédiaire ne correspond pas à la scène du début de leçon où trois composants ne faisaient que véhiculer une donnée : c'est le cas où la documentation préconise le passage de props, car cela permet de voir clairement quel composant utilise quelle donnée.
- **L'évolution éventuelle ne toucherait qu'un seul fichier.** Les pages n'appellent pas `useOutletContext` : elles appellent `useNotas()`, le hook conçu dans la leçon 5 conformément aux recommandations de React Router. Si un composant autre qu'une page (la boîte d'avis, par exemple) venait un jour à nécessiter les notes, il suffirait de créer un contexte, de faire en sorte que `useNotas()` le lise, et aucune page n'aurait à changer. C'est le signal tangible qui justifierait un changement de décision : **un consommateur situé hors de l'`Outlet`**. Tant qu'il n'existe pas, le contexte ne résout aucun problème.

Et pour être tout à fait honnête : ni l'`Outlet` ni un contexte n'empêchent la perte des notes au rechargement de la page. Les deux mécanismes ne conservent les données que dans la mémoire de l'onglet. Si les notes devaient persister, leur place relèverait du serveur (la deuxième question), et l'API d'entraînement ne dispose pas de route pour cela. Déplacer les notes vers un contexte ne les rapprocherait en rien de cet objectif ; cela ne ferait que changer le câblage.

#### 6.3.4 Et Redux, quand ?

Le README du cours indique que Redux n'est pas enseigné, et ce tableau montre pourquoi il n'est pas nécessaire : l'état du serveur, qui dans de nombreuses applications représentait l'essentiel de ce que l'on plaçait dans un store global, est déjà pris en charge par TanStack Query ; l'URL gère la vue ; et le peu qui reste partagé se limite à deux petits éléments, chacun muni d'un reducer et d'un contexte. Le guide de React se conclut précisément ainsi : tu peux avoir de nombreux couples de contexte et reducer dans ton application ([React, « Scaling Up with Reducer and Context »](https://react.dev/learn/scaling-up-with-reducer-and-context)). Une bibliothèque d'état global commence à se justifier lorsqu'il y a un volume important d'état client partagé, évoluant fréquemment et lu par de nombreux composants, chacun n'en consommant qu'une fraction. C'est une question d'appréciation propre à chaque projet, et non une règle absolue de React ; et le `revisor` en est très éloigné.

#### 6.3.5 Le parcours complet

Tout étant en place, le parcours mobilise deux terminaux, comme dans les leçons précédentes : `npm run servidor` dans l'un, et `npm run build` suivi de `npm run preview` dans l'autre. La compilation aboutit ainsi :

```text
$ npm run build

> revisor@0.6.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 183 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-D-tTS2ut.css    1.11 kB │ gzip:   0.52 kB
dist/assets/index-DBIHM1Pv.js   362.37 kB │ gzip: 112.97 kB

✓ built in 258ms
```

Ouvre `http://localhost:4173/`. L'en-tête présente désormais le groupe de préférences, et en dessous, la boîte d'avis vide. Voici ce que Chrome a restitué pour ces deux éléments :

```text
<header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header>
<section class="bandeja" aria-label="Avisos"><div role="status"></div></section>
```

La région dynamique existe même vide, conformément aux prescriptions de 6.2.5. Clique sur `pagos`, attends l'affichage du détail (le serveur d'entraînement met une seconde et demie délibérément) et clique sur « Volver a revisar ». La boîte d'avis reçoit la notification observée au début de la leçon. Clique ensuite sur « Volver al reporte » : la page du service se démonte, la liste se monte, et l'avis **demeure présent**, avec `pagos` désormais affiché comme disponible dans la liste :

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200, 42 ms)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200, 95 ms)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Décoche « Mostrar duración ». Les lignes disponibles perdent l'affichage des millisecondes, sans que rien d'autre ne change :

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Et « Descartar » rétablit la boîte d'avis dans son état d'origine : `<div role="status"></div>`, vide mais présente. Le journal du serveur d'entraînement a consigné l'intégralité du parcours :

```text
08:37:54.148 GET /api/estados 200
08:37:57.289 GET /api/servicios/pagos 200
08:37:58.601 POST /api/servicios/pagos/reintento 200
08:37:59.809 GET /api/servicios/pagos cancelada por el cliente
08:38:00.110 GET /api/estados 200
```

Lis-le de haut en bas, car il raconte une histoire qui confirme deux points clés de la leçon. Le `POST` correspond à la mutation. Le `GET` du détail qui suit représente l'invalidation de `["servicio", "pagos"]` effectuée par `useReintentar` dans son `onSuccess`, et elle apparaît comme **annulée** : le serveur mettant une seconde et demie à renvoyer le détail de `pagos`, l'utilisateur est retourné à la liste avant ce délai, la page du détail s'est démontée et TanStack Query a annulé la requête que plus personne n'attendait : lorsqu'une requête devient inactive en cours de récupération, son `signal` est interrompu, et comme `consultaDetalle` transmet ce `signal` à `fetch`, la requête est coupée ([TanStack Query, « Query Cancellation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). L'essentiel réside dans ce qui ne s'est pas produit : l'avis n'a pas attendu cette requête. Il est parvenu à la boîte d'avis avant même que l'utilisateur ne quitte la page, car `useReintentar` dispatche **d'abord** et attend les invalidations **ensuite**. Si l'ordre avait été inverse, l'avis aurait été retardé de la durée du rechargement le plus lent. Le dernier `GET /api/estados` correspond à la liste, redemandée lors de son montage car l'invalidation l'avait marquée comme obsolète. Enfin, on ne relève qu'un seul `GET /api/estados` à l'ouverture de la page : la version compilée ne subit pas le cycle supplémentaire de `StrictMode`.

## L'erreur que tu vas voir

Cette leçon comporte deux erreurs principales — le fournisseur manquant et l'avertissement de React qui apparaît lorsque le reducer modifie l'état —, ainsi que deux erreurs de confirmation émises par le compilateur.

**L'erreur principale : un hook de contexte sans son fournisseur.** Tu l'as déjà vue dans la figure 2, au sein d'un DOM de test. Dans une application, elle se déclenche en déplaçant un composant hors de son fournisseur, ou en le montant isolément dans un test. Le message est celui que tu as rédigé dans le hook :

```text
useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
```

Il se lit ainsi : le composant ayant appelé `useAvisos` ne compte aucun `ProveedorAvisos` parmi ses ancêtres. La correction ne consiste jamais à supprimer la vérification ni à attribuer au contexte une valeur par défaut : elle consiste à placer le fournisseur à sa place légitime, au-dessus du composant. Si l'erreur survient dans un test, monte l'arbre avec `Proveedores`, qui a été conçu précisément pour cela. Et si elle survient **sans** message, sous la forme d'un écran qui affiche « 0 avisos » sans réagir, soupçonne un contexte doté d'une valeur par défaut simulant un fonctionnement normal (la version A de la figure 2).

**Les deux erreurs de confirmation : modifier l'état et oublier une action.** Cette figure reprend le reducer des avis en y introduisant délibérément deux modifications : une quatrième action, `fijado`, est ajoutée à l'union sans son `case` associé ; et `agregado` effectue un `push` directement sur la liste reçue au lieu d'en créer une nouvelle.

```ts
// fig06_04.ts
export type NivelAviso = "exito" | "error";

export interface Aviso {
  readonly id: number;
  readonly nivel: NivelAviso;
  readonly texto: string;
}

export interface EstadoAvisos {
  readonly avisos: readonly Aviso[];
  readonly siguienteId: number;
}

export type AccionAvisos =
  | { readonly tipo: "agregado"; readonly nivel: NivelAviso; readonly texto: string }
  | { readonly tipo: "descartado"; readonly id: number }
  | { readonly tipo: "todos-descartados" }
  | { readonly tipo: "fijado"; readonly id: number };

export const estadoInicialAvisos: EstadoAvisos = { avisos: [], siguienteId: 1 };

export const MAXIMO_AVISOS = 5;

export function reducirAvisos(estado: EstadoAvisos, accion: AccionAvisos): EstadoAvisos {
  switch (accion.tipo) {
    case "agregado": {
      const nuevo: Aviso = { id: estado.siguienteId, nivel: accion.nivel, texto: accion.texto };
      estado.avisos.push(nuevo);
      return { ...estado, siguienteId: estado.siguienteId + 1 };
    }
    case "descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.id !== accion.id) };
    case "todos-descartados":
      return { ...estado, avisos: [] };
    default: {
      const sinAtender: never = accion;
      throw new Error(`acción sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --noEmit fig06_04.ts
fig06_04.ts(29,21): error TS2339: Property 'push' does not exist on type 'readonly Aviso[]'.
fig06_04.ts(37,13): error TS2322: Type '{ readonly tipo: "fijado"; readonly id: number; }' is not assignable to type 'never'.
```

La première, `TS2339`, signale que `push` n'existe pas sur le type `readonly Aviso[]`. C'est le modificateur `readonly` du type qui opère : une liste en lecture seule ne dispose pas des méthodes de mutation, ni `push`, ni `splice`, ni `sort`. Sans ce `readonly`, le code compilerait et l'erreur serait pire, car elle surviendrait sans le moindre avertissement du compilateur. Ce qui se produit alors correspond à l'erreur suivante.

**L'erreur de React : deux avis avec la même clé.** Pour l'observer, il faut contourner délibérément le `readonly`. Dans une copie du point de contrôle, le `case "agregado"` de `avisos.ts` a été remplacé par `(estado.avisos as Aviso[]).push(nuevo); return { ...estado, siguienteId: estado.siguienteId + 1 };`. Le mot-clé `as` dit à TypeScript « fais-moi confiance », et le code compile. Avec cette version sous `npm run dev`, sur la page de `pagos`, un unique clic sur « Volver a revisar » a produit ceci dans la boîte d'avis :

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div><button type="button">Descartar todos</button></section>
```

Et dans la console du navigateur, cette erreur de React s'affiche (le message arrive avec un `%s` que la console remplace par la valeur `1` transmise séparément ; il est montré ici déjà substitué) :

```text
Encountered two children with the same key, `1`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Un seul clic, un seul avis dispatché, et pourtant deux avis à l'écran portant le même identifiant. La cause réside dans le double appel expliqué en 6.1.3. En `StrictMode`, React appelle le reducer **deux fois avec le même état** et ne retient que l'un des deux résultats ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Avec un reducer pur, cela ne se remarque pas : les deux résultats sont strictement identiques et l'un est écarté. Avec `push`, chaque appel a modifié **le même tableau**, celui contenu dans l'état, de sorte que l'avis a été inséré deux fois, avec le même `id`, les deux appels ayant lu le même `siguienteId`. React s'en est rendu compte en constatant la présence de deux enfants dotés de la même `key`. Il y a un dégât supplémentaire, invisible à l'œil nu : le premier `push` a affecté `estadoInicialAvisos`, l'objet au niveau du module servant de point de départ général, le laissant souillé pour quiconque le réutiliserait ultérieurement. Et dans la version compilée pour la production, sans `StrictMode`, le doublon n'apparaîtrait pas : le bogue subsisterait, simplement privé de l'avertissement qui le démasque. La documentation de `useReducer` est formelle : l'état est en lecture seule, ne modifie aucun objet ni tableau présent dans l'état ([React, `useReducer`](https://react.dev/reference/react/useReducer)). La solution est celle du point de contrôle : une nouvelle liste construite avec `[nuevo, ...estado.avisos]`. La leçon est donc double : le `readonly` intercepte la faute avant l'exécution, et `StrictMode` l'intercepte à l'exécution si quelqu'un contourne le `readonly`.

La seconde erreur, `TS2322`, concrétise la promesse de la vérification d'exhaustivité de 6.1.3 : le type `fijado` a atteint la branche `default` et ne peut pas être assigné à `never`. Le message indique nommément l'action manquante ainsi que la ligne du `switch`. La correction consiste à rédiger son `case`. Remarque bien que l'erreur n'apparaît pas là où tu as ajouté l'action, mais là où tu as **oublié** de la traiter : c'est toute la valeur de ce mécanisme.

## Ce qui se fait de travers

**Tout placer dans un contexte « au cas où ».** Chaque contexte représente une dépendance qui ne figure pas dans la signature du composant. Si une donnée n'est partagée que par deux composants voisins, passe-la via les props. Le contexte ne gagne sa légitimité que lorsque les props doivent traverser des composants intermédiaires qui n'en ont pas l'usage et que `children` ne permet pas de régler la situation.

**Un seul contexte avec `{ estado, despachar }` alors que certains composants ne font que dispatcher.** Chaque changement d'état force le re-rendu de tous les composants qui lisent le contexte, y compris ceux qui n'affichent jamais l'état. La figure 3 l'a mesuré : quatre rendus contre un seul. Sépare en deux contextes distincts.

**Une valeur par défaut qui « fonctionne ».** Une liste vide et une fonction no-op transforment l'oubli d'un fournisseur en un écran qui ment silencieusement, sans émettre la moindre erreur. Utilise `null` et un hook qui lève une exception explicite.

**Des effets de bord au sein du reducer.** Un `fetch`, un `setTimeout`, un `console.log` conditionnant une décision ou un compteur externe à la fonction. Le reducer étant appelé deux fois en `StrictMode`, il doit impérativement fournir le même résultat pour une entrée identique. Tout ce qui doit interagir avec l'extérieur de React doit prendre place dans un gestionnaire d'événements ou, s'il s'agit de synchronisation, au sein d'un Effect (comme le démontre l'exercice 3).

**Des actions formulées sous forme d'ordres.** `{ tipo: "establecer-lista", avisos: [...] }` rétrograde le reducer au rang de simple `useState` déguisé : la logique se retrouve de nouveau dispersée chez les appelants qui dispatchent. Les actions décrivent ce qui s'est passé ; les règles de gestion résident dans le reducer.

**Muter l'état.** Si tu écris `estado.avisos.push(nuevo)` et renvoies le même `estado`, React compare avec `Object.is`, conclut que rien n'a changé et ne déclenche aucun rendu. Si tu renvoies un nouvel objet contenant la liste modifiée en place, React effectue le rendu, mais le double appel de `StrictMode` insère l'avis deux fois avec la même clé, comme illustré dans « L'erreur que tu vas voir ». Grâce à `readonly` sur les types, TypeScript t'en empêche dès la compilation.

**Afficher le même fait à deux endroits.** Si l'erreur d'une nouvelle tentative est affichée à la fois sur la page et dans la boîte d'avis, elle est vocalisée deux fois et l'une d'elles disparaît lors de la navigation. Un seul fait, un seul endroit.

**Créer la région dynamique en même temps que son contenu.** Un balisage `{avisos.length > 0 && <div role="status">…</div>}` fait apparaître la région avec le premier avis déjà inséré, risquant de priver cet avis d'annonce vocale. La région doit exister en permanence ; c'est son contenu qui varie.

**Mémoïser la valeur du contexte par réflexe.** `useMemo` et `useCallback` sont des outils ayant un coût propre. Avant de les dégainer, mesure : dans le `revisor`, la séparation de l'état et du dispatch a réglé ce qui devait l'être, et le fournisseur de préférences n'a aucun rendu inutile à économiser.

## Exercices

### Exercice 1 — Prédis le reducer

Sans rien exécuter, prédis ce qu'affiche la première ligne de la figure 1 si, au lieu de six lettres, tu en transmets sept (`"a"` à `"g"`), et ce qui se passe si tu dispatches ensuite `{ tipo: "descartado", id: 1 }`. `siguienteId` change-t-il ? Le reducer renvoie-t-il le même objet que celui reçu ? Vérifie tes prédictions en modifiant la figure et en l'exécutant.

### Exercice 2 — Une nouvelle action, guidée par le compilateur

Ajoute aux avis une action qui supprime tous les avis d'un niveau donné : `{ tipo: "nivel-descartado", nivel: NivelAviso }`. Fais-le dans ta copie `avisos.ts` des figures. Ajoute **d'abord** uniquement le membre à l'union et lance `tsc` : prédis quelle ligne il va pointer. Rédige ensuite le `case` et vérifie, avec une variante de la figure 1, qu'en partant de trois avis de succès et deux d'erreur, écarter le niveau `error` n'en laisse que trois.

### Exercice 3 — Des avis qui s'effacent tout seuls

Fais en sorte que chaque avis de **succès** s'efface automatiquement au bout de cinq secondes ; ceux d'erreur restent affichés jusqu'à ce que l'utilisateur les écarte manuellement. **Avant d'écrire du code**, détermine où doit résider le minuteur : dans le reducer, dans `useReintentar` ou dans la boîte d'avis ? Note dans ton journal de bord les raisons de ton choix. La solution ne doit pas faire taire le linter, et le minuteur doit impérativement être annulé si la personne écarte l'avis avant l'échéance.

### Exercice 4 — Une colonne de plus dans le tableau

Sans regarder 6.3.1, où placerais-tu chacune de ces nouvelles données, et pourquoi : (a) le mode sombre de l'interface ; (b) le service détenant le focus clavier dans la liste ; (c) le nom de la personne connectée, utilisé dans l'en-tête et dans le formulaire de création ; (d) les préférences de 6.2.7, si l'on souhaitait qu'elles persistent après un rechargement de page ; (e) le nombre d'avis non lus, destiné à figurer dans le titre de l'onglet du navigateur.

## Solutions

### Solution 1

Avec sept lettres, il reste cinq avis, du 7 au 3 : `[7:g, 6:f, 5:e, 4:d, 3:c] siguienteId=8`. Les deux plus anciens sont éliminés par la limite. Si l'on écarte ensuite l'identifiant 1, le reducer ne trouve aucun élément correspondant à retirer et la liste reste identique, avec `siguienteId` à 8 : écarter un élément ne fait jamais bouger le compteur. Renvoie-t-il le même objet ? **Non** : `{ ...estado, avisos: estado.avisos.filter(…) }` génère systématiquement un nouvel objet et une nouvelle liste, même s'ils partagent le même contenu. C'est normal et correct (le reducer n'a rien muté), mais cela signifie que React re-rendra la boîte d'avis quand bien même rien de visible n'a changé, car `Object.is` compare les identités référentielles et non le contenu. Si un jour une mesure montrait que cela a un impact sensible, la correction consisterait à renvoyer `estado` tel quel lorsque l'`id` est introuvable. À ce jour, aucune mesure ne le justifie. Pour le constater par toi-même, compare avec `===` dans la figure : `console.log(reducirAvisos(conSiete, { tipo: "descartado", id: 1 }) === conSiete)` renvoie `false`.

### Solution 2

En ajoutant uniquement le membre à l'union, `tsc` pointe la ligne `const sinAtender: never = accion;` avec une erreur `TS2322` nommant le nouveau type, exactement comme dans la figure 4. Le `case` manquant :

```ts
// avisos.ts con la acción nueva (fragmento)
    case "nivel-descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.nivel !== accion.nivel) };
```

À l'intérieur de ce `case`, TypeScript sait déjà que `accion` est la variante dotée de `nivel`, de sorte que `accion.nivel` compile sans recourir au moindre `as`. La vérification : avec trois actions `agregado` de niveau `exito` et deux de niveau `error`, l'état contient cinq avis ; après `{ tipo: "nivel-descartado", nivel: "error" }`, il ne reste que les trois succès, avec leurs identifiants préservés et `siguienteId` à 6. Observe bien le nom : `nivel-descartado` décrit ce qu'a fait la personne, et non « filtrer la liste ».

### Solution 3

Le minuteur ne va **pas** dans le reducer : un `setTimeout` constitue un effet de bord, or le reducer doit obligatoirement être pur (6.1.3). Il ne va pas non plus dans `useReintentar`, car le minuteur doit vivre aussi longtemps que l'avis, et l'avis réside dans la boîte d'avis, non dans la page qui l'a émis. Il a sa place dans la boîte d'avis, et constitue un Effect parfaitement légitime au sens de la leçon 3 : il **synchronise** chaque avis visible avec un minuteur, qui est un système extérieur à React. La structure la plus propre consiste à doter chaque avis de son propre composant, afin que son Effect débute dès son apparition et se nettoie à sa disparition :

```tsx
// BandejaAvisos.tsx con descarte automático (fragmento)
function FilaAviso({ aviso }: { readonly aviso: Aviso }) {
  const despachar = useDespachoAvisos();

  useEffect(() => {
    if (aviso.nivel !== "exito") {
      return;
    }
    const temporizador = setTimeout(() => despachar({ tipo: "descartado", id: aviso.id }), 5_000);
    return () => clearTimeout(temporizador);
  }, [aviso.id, aviso.nivel, despachar]);

  return (
    <li className={`aviso-${aviso.nivel}`}>
      {aviso.texto}{" "}
      <button
        type="button"
        aria-label={`Descartar: ${aviso.texto}`}
        onClick={() => despachar({ tipo: "descartado", id: aviso.id })}
      >
        Descartar
      </button>
    </li>
  );
}
```

Et dans `BandejaAvisos`, le `map` effectue le rendu de `<FilaAviso key={aviso.id} aviso={aviso} />`. Trois éléments méritent d'être soulignés. Les dépendances déclarent tout ce que l'Effect consomme, y compris `despachar` ; la documentation de `useReducer` précisant que son identité est stable, l'inclure ne provoquera pas de réexécution de l'Effect ([React, `useReducer`](https://react.dev/reference/react/useReducer)), il n'y a donc aucune raison de l'omettre pour faire taire le linter. Si l'utilisateur écarte l'avis avant les cinq secondes, la ligne est démontée, la fonction de nettoyage annule le minuteur et rien n'est dispatché en trop (et même si c'était le cas, `descartado` sur un `id` déjà absent ne casse rien, comme tu l'as vu dans la solution 1). De plus, avec `StrictMode`, le minuteur est créé, annulé et recréé au montage : la preuve, sans rien écrire de plus, comme à la leçon 0, que le nettoyage fonctionne bel et bien. Ce fragment a été vérifié avec le linter du cours sur une copie de la boîte d'avis et n'a émis aucun avertissement.

Un avertissement d'accessibilité s'impose : un avis qui disparaît de lui-même constitue une limite temporelle au sens des directives WCAG, qui considèrent comme telle tout processus se produisant sans intervention de l'utilisateur après un délai fixe ([W3C, « Understanding SC 2.2.1: Timing Adjustable »](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). Ici, cela reste acceptable car le résultat demeure visible dans la liste, raison pour laquelle seuls les avis de succès s'effacent automatiquement. Si un avis constituait l'unique moyen de prendre connaissance d'une information, cinq secondes seraient insuffisantes pour bon nombre de personnes : ne le fais pas, ou permets à l'utilisateur de désactiver ce comportement.

### Solution 4

(a) **Mode sombre** : contexte, au même titre que les préférences, et pour la même raison : un contrôle le modifie et des composants dispersés dans toute l'application le lisent ; c'est le premier exemple que donne la documentation de React pour illustrer le contexte. (b) **Le focus clavier** : dans aucun état React ; le focus est géré nativement par le navigateur, et le stocker dans React crée deux vérités concurrentes. Si un composant doit déplacer le focus, il utilise une référence (`ref`) vers l'élément DOM, pas un état. (c) **La personne connectée** : contexte, second exemple de la documentation ; néanmoins, la donnée en soi provient du serveur, la solution rigoureuse consiste donc en une requête TanStack Query (déjà accessible depuis n'importe quel composant avec `useQuery`), ce qui peut rendre inutile un contexte dédié. (d) **Préférences qui survivent à un rechargement** : le contexte est conservé comme canal de diffusion, mais la valeur doit être enregistrée hors de la mémoire de l'onglet : dans le stockage local du navigateur (`localStorage`) si elles concernent cette machine, ou sur le serveur si elles doivent suivre la personne sur un autre poste. Lire et écrire dans ce stockage relève d'une synchronisation avec l'extérieur, tâche qui incomberait au fournisseur. (e) **Avis non lus dans le titre** : **ce n'est pas un état**. Cela se calcule à partir des avis déjà présents dans le contexte (première question de 6.3.2), et écrire cette valeur dans `document.title` est le rôle de `useTituloDocumento`, l'Effect conçu dans la leçon 3.

## Comment savoir que j'ai réussi

- [ ] `npm ci`, `npm run lint` et `npm run build` s'exécutent sans erreur dans `~/curso-react/revisor/`, et `npm run build` produit `dist/assets/index-DBIHM1Pv.js` si ton code est identique à celui du point de contrôle.
- [ ] `grep -rn "eslint-disable" src/` ne renvoie aucun résultat.
- [ ] La figure 1 affiche `seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7` et se termine par les trois lignes vérifiant que le reducer n'a pas altéré ce qu'il a reçu.
- [ ] Dans une copie comportant le `push` et sous `npm run dev`, un clic sur « Volver a revisar » produit deux avis identiques et l'erreur `Encountered two children with the same key` dans la console, et tu es en mesure d'expliquer pourquoi `StrictMode` la provoque.
- [ ] Tu peux reproduire les deux erreurs de la figure 4 dans une copie du reducer et expliquer chacune : `TS2339` pour avoir modifié une liste `readonly` et `TS2322` pour une action atteignant le `default`.
- [ ] La figure 3 montre le bouton rendu 4 fois avec un contexte unique et 1 seule fois avec deux contextes, et tu sais expliquer pourquoi la boîte d'avis est rendue 4 fois dans les deux cas.
- [ ] La figure 2 montre « 0 avisos » sans aucune erreur dans la version A et le message du hook dans la version B, et tu es capable d'expliquer pourquoi B est préférable.
- [ ] Avec le serveur d'entraînement et `npm run preview` en marche, la page `/` présente dans l'en-tête les cases « Mostrar duración » (cochée) et « Vista compacta », et juste en dessous une boîte d'avis vide munie de `role="status"`.
- [ ] Sur `/servicios/pagos`, « Volver a revisar » dépose dans la boîte d'avis `pagos se volvió a revisar: disponible`, et l'avis demeure visible après être revenu à la liste via « Volver al reporte ».
- [ ] En décochant « Mostrar duración », les lignes disponibles perdent l'affichage des millisecondes sans que `ListaEstados`, `ContenidoReporte` ni `PaginaReporte` n'aient changé.
- [ ] Tu peux réciter le tableau de 6.3.1 de mémoire, avec une justification par ligne, et indiquer ce qui devrait se produire pour que les notes passent dans un contexte.
- [ ] Tu as consigné dans ton [journal de bord](bitacora.md) où réside chaque état de ton `revisor` et pourquoi tu as choisi cet emplacement pour le minuteur de l'exercice 3.

## Résumé

Réponds sans regarder la leçon :

1. Pourquoi un reducer porte-t-il ce nom, et quel est le lien avec `Array.prototype.reduce` ?
2. Que décrit une action ? Pourquoi `agregado` plutôt que `recortar-a-cinco` ?
3. À quoi sert le `default` avec `never` dans le reducer, et à quel moment t'aide-t-il ?
4. Pourquoi le reducer stocke-t-il `siguienteId` dans l'état plutôt que d'utiliser un compteur externe à la fonction ?
5. Quelles sont les deux alternatives à tenter avant d'envisager un contexte ? Pourquoi aucune des deux ne convient pour les préférences du `revisor` ?
6. Pourquoi les avis utilisent-ils deux contextes et les préférences un seul ?
7. Que se passe-t-il si un composant lit un contexte sans fournisseur, avec une valeur par défaut `null` et sans elle ? Pourquoi le hook lève-t-il une erreur ?
8. Pourquoi le `role="status"` de la boîte d'avis existe-t-il même en l'absence d'avis ?
9. Pourquoi les notes restent-elles dans la disposition plutôt que dans un contexte ? Que faudrait-il pour que cela change ?

## Pour aller plus loin

- [React, « Extracting State Logic into a Reducer »](https://react.dev/learn/extracting-state-logic-into-a-reducer) : actions décrivant ce qu'a fait la personne, reducers purs, origine du nom et comparaison avec `useState`. Consulté le 21 octobre 2026.
- [React, `useReducer`](https://react.dev/reference/react/useReducer) : la signature, le double appel du reducer en `StrictMode`, l'état en lecture seule, la comparaison avec `Object.is` et l'identité stable de `dispatch`. Consulté le 21 octobre 2026.
- [React, « Passing Data Deeply with Context »](https://react.dev/learn/passing-data-deeply-with-context) : les deux alternatives avant le contexte, la mise en garde contre son usage excessif et ses cas d'usage (thème, compte utilisateur, routage, état). Consulté le 21 octobre 2026.
- [React, `createContext`](https://react.dev/reference/react/createContext) : la valeur par défaut comme dernier recours, `<Contexto>` comme fournisseur depuis React 19 et les contextes logés dans un fichier dédié. Consulté le 21 octobre 2026.
- [React, `useContext`](https://react.dev/reference/react/useContext) : le fournisseur le plus proche vers le haut, le re-rendu des consommateurs comparé avec `Object.is`, l'optimisation avec `useMemo` et le cas de la `value` omise. Consulté le 21 octobre 2026.
- [React, « Scaling Up with Reducer and Context »](https://react.dev/learn/scaling-up-with-reducer-and-context) : deux contextes (état et dispatch), les hooks personnalisés et le fournisseur qui unifie l'ensemble. Consulté le 21 octobre 2026.
- [React, « React v19 »](https://react.dev/blog/2024/12/05/react-19) : `<Context>` utilisé comme fournisseur et le plan d'abandon de `<Context.Provider>`. Consulté le 21 octobre 2026.
- [React, « Sharing State Between Components »](https://react.dev/learn/sharing-state-between-components) : faire remonter l'état vers l'ancêtre commun et le principe de la source unique de vérité. Consulté le 21 octobre 2026.
- [React, « Choosing the State Structure »](https://react.dev/learn/choosing-the-state-structure) : les principes d'organisation de l'état, notamment ne pas stocker ce qui peut être calculé. Consulté le 21 octobre 2026.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext) : l'état d'une route parente partagé avec ses enfants et le hook recommandé avec TypeScript. Consulté le 21 octobre 2026.
- [TanStack Query, « Mutations »](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) : `onSuccess`, `onError` et la différence entre les callbacks de `useMutation` et ceux de `mutate` lors du démontage du composant. Consulté le 21 octobre 2026.
- [TanStack Query, « Query Cancellation »](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) : le `signal` interrompu lorsqu'une requête devient inactive en cours de récupération. Consulté le 21 octobre 2026.
- [TypeScript, « Narrowing »](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) : le type `never` et la vérification d'exhaustivité dans un `switch`. Consulté le 21 octobre 2026.
- [MDN, rôle `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) et [« ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) : la région dynamique de notification, avec `aria-live="polite"` et `aria-atomic="true"` implicites ; le rôle de `aria-atomic` et la raison pour laquelle la région doit exister avant d'être remplie. Consulté le 21 octobre 2026.
- [W3C, « Understanding SC 2.2.1: Timing Adjustable »](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) : définition d'une limite temporelle et conditions dans lesquelles son ajustement est requis. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| reducer | fonction pure recevant l'état actuel et une action et renvoyant l'état suivant |
| action | objet décrivant ce qui s'est passé (`{ tipo: "descartado", id: 3 }`) ; le reducer décide des conséquences à en tirer |
| dispatcher (*dispatch*) | la fonction renvoyée par `useReducer` pour lui transmettre une action ; son identité est stable d'un rendu à l'autre |
| vérification d'exhaustivité | la branche `default` assignant l'action à `never`, afin que TypeScript signale toute action non traitée |
| contexte | canal de React permettant à une valeur d'atteindre n'importe quel composant situé en profondeur sans passer par les props |
| fournisseur (*provider*) | le composant injectant une valeur dans un contexte pour tous ses descendants : `<Contexto value={…}>` |
| valeur par défaut | ce que reçoit quiconque lit un contexte si aucun fournisseur n'est présent vers le haut ; dans ce cours, `null` |
| consommateur | composant lisant un contexte ; subit un nouveau rendu dès que la `value` de son fournisseur change |
| région dynamique (*live region*) | zone de la page dont les modifications sont annoncées par un lecteur d'écran ; `role="status"` correspond à la variante polie, qui n'interrompt pas |
| source unique de vérité | chaque fragment d'état réside en un lieu unique, et les autres le lisent depuis cet endroit |

---

**Suivante :** [Leçon 7 — Formulaires, actions et accessibilité](07-formularios-accesibilidad.md)
