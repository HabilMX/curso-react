# Cours de React — d'un panneau d'un seul bloc à une application qui tient la route

**Par Dorian Chávez, fondateur de Hábil et architecte d'intégration.**

**À qui il s'adresse :** à qui a déjà suivi le cours de TypeScript de Hábil et veut comprendre à fond ce que sa leçon 9 a tout juste laissé fonctionnel, et à qui programme en JavaScript ou en TypeScript, a copié des composants qui fonctionnent et veut savoir pourquoi ils fonctionnent et pourquoi, tout à coup, ils cessent de le faire. Aucune expérience avec React n'est supposée au-delà d'avoir déjà vu un composant : chaque concept est expliqué au moment où il apparaît, et l'on explique pourquoi il existe, pas seulement comment il s'écrit.

**Ce que tu sauras faire à la fin :** construire une application React de plusieurs écrans, décider où vit chaque morceau d'état, récupérer des données sans conflits entre les requêtes ni écrans blancs, la tester avec des tests qui détectent vraiment les erreurs, la mesurer avant de l'optimiser et la publier. Et garder le jugement nécessaire pour lire par toi-même la documentation de React.

**Où il se situe :** ce cours est la marche qui suit le [cours de TypeScript](https://github.com/HabilMX/curso-typescript) de Hábil. Sa leçon 9 a déjà assemblé un panneau avec des composants, `useState` et `useEffect` ; ici, on ne répète pas : on approfondit. Si tu n'as jamais écrit une page, commence plutôt par le cours de Fondamentaux du web.

**Ce dont tu as besoin avant de commencer :** un ordinateur avec Linux Mint, savoir ouvrir un terminal, lire des types de TypeScript (unions, génériques simples) et avoir vu, ne serait-ce qu'une fois, un composant React. La [Leçon 0](00-un-proyecto-de-verdad.md) installe tout ce qui manque, avec Node 24 LTS.

## Le projet que tu vas construire

Le **`revisor`** : l'écran qui affiche l'état d'une liste de services —nom, état et temps de réponse—. Il commence comme le panneau d'un seul bloc de la leçon 9 de TypeScript et se termine comme une application de plusieurs écrans : un rapport avec des filtres conservés dans l'URL, le détail de chaque service, des données en cache qui se mettent à jour en arrière-plan, un formulaire pour enregistrer des services, des notifications, une suite de tests et une version publiée.

C'est le même problème que dans les cours de Go, de Rust, de TypeScript et de Fondamentaux du web de Hábil. Ce qui change, c'est le niveau d'exigence : non pas « que ça marche », mais « que ça tienne la route quand ça grandit ». Le cours inclut un serveur d'entraînement avec le contrat de l'API, tu n'as donc pas besoin d'avoir terminé le cours de TypeScript pour suivre celui-ci.

## Les dix leçons

| Leçon | | Ce que tu construis | Ce que tu apprends |
|---|---|---|---|
| 0 | [Un vrai projet : Vite, StrictMode et le linter](00-un-proyecto-de-verdad.md) | le panneau de la leçon 9 de TypeScript, déplacé vers Vite | ce qu'ajoute Vite ; `react-ts`, structure par fonctionnalité, proxy vers l'API, variables `VITE_`, linter de React actif |
| 1 | [Composants purs et composition](01-componentes-puros-composicion.md) | le panneau découpé en pièces | render et *commit* ; pureté ; `children` ; `key` stable ; le piège du `0` ; jamais un composant à l'intérieur d'un autre |
| 2 | [État : instantané, immuabilité et forme](02-estado-instantanea-forma.md) | filtre « pannes uniquement », note par service, sélection | l'état comme photographie ; fonction de mise à jour ; copier, ne pas muter ; cinq règles pour structurer l'état ; faire remonter l'état ; `key` pour réinitialiser |
| 3 | [Effects : synchroniser, pas « quand ça charge »](03-effects-sincronizar.md) | interrogation périodique (polling) toutes les 10 s et détail qui se réinitialise | commencer et cesser de synchroniser ; nettoyage ; concurrence entre les réponses (race condition) ; StrictMode ; dépendances honnêtes ; `useEffectEvent` |
| 4 | [État du serveur avec TanStack Query](04-estado-del-servidor.md) | le rapport avec cache et bouton « réessayer » | `useQuery`, `queryKey`, `signal` ; `status` et `fetchStatus` ; `refetchInterval` ; `useMutation` ; l'état vide ; Error Boundary |
| 5 | [Routes et l'URL comme état](05-rutas-url-como-estado.md) | liste, détail, 404 et filtres dans l'URL | `createBrowserRouter`, `<Outlet />`, `useSearchParams`, `NavLink` ; recharger une route du client |
| 6 | [État partagé : reducer et contexte](06-reducer-contexto.md) | zone de notifications et préférences | `useReducer` et reducer pur ; contexte en deux parties ; hook qui exige un fournisseur ; quel état vit où |
| 7 | [Formulaires, actions et accessibilité](07-formularios-accesibilidad.md) | l'enregistrement d'un service | `<form action>`, `useActionState`, `useFormStatus`, `useOptimistic` ; validation ; `aria-invalid` ; zones dynamiques (live regions) ; clavier |
| 8 | [Tests de composants](08-pruebas-de-componentes.md) | la suite du panneau | Vitest et Testing Library ; requêtes par rôle ; `findBy` ; `user-event` ; le test qui passe au rouge quand on annule le correctif |
| 9 | [Performance, publication et quand utiliser un framework](09-rendimiento-publicacion.md) | le `revisor` mesuré et publié | Profiler ; React Compiler 1.0 ; `vite build` ; réécriture vers `index.html` ; Server Components et quand migrer |

À la fin de chaque leçon, il y a des exercices avec leurs solutions. Et le [journal de bord](bitacora.md) est à toi : note-y ce qui t'a donné du mal.

## Trois principes qui traversent tout le cours

**Un Effect sert à se synchroniser avec quelque chose qui est en dehors de React.** Ce n'est pas pour calculer une valeur, ce n'est pas pour réagir à un clic et ce n'est pas pour « quand ça charge ». La liste de dépendances décrit le code ; si le linter se plaint, on change le code, on ne fait jamais taire la règle. C'est l'erreur qui coûte le plus cher en React et toute la leçon 3 lui est consacrée, mais elle apparaît dès la 2.

**D'abord on mesure, ensuite on optimise.** `useMemo`, `useCallback` et `memo` sont des outils qui ont un coût, pas une habitude. Le cours les présente quand une mesure les réclame, et enseigne d'abord la structure —état local, `children`— qui évite la plupart des rendus superflus.

**L'accessibilité et la sécurité ne sont pas des leçons, ce sont des habitudes.** Les requêtes par rôle de la 8 te poussent à écrire du HTML accessible, la 7 apporte le clavier et les zones dynamiques (live regions), et la 9 passe en revue le XSS et ce qui ne doit jamais aller dans une variable `VITE_`.

## Comment savoir que tu as terminé

Le cours ne se termine pas quand tu as lu la leçon 9, mais quand ton `revisor` remplit ces cinq conditions. Ce sont les mêmes que la vérification contrôle à chaque changement :

1. **`npm run lint` ne signale rien**, et il n'y a pas un seul `eslint-disable` des règles de React.
2. **`npm test` passe**, et chaque test qui protège un correctif est passé au rouge quand tu l'as annulé.
3. **Les quatre états existent** —chargement, erreur, vide et avec données—, plus celui de « données anciennes pendant la mise à jour », et chacun a son test.
4. **Il se parcourt entièrement au clavier**, et les notifications de changement arrivent à un lecteur d'écran.
5. **`npm run build` se termine bien**, l'aperçu recharge `/servicios/pagos` sans donner de 404 lorsqu'il est servi avec réécriture, et aucune clé ni aucun secret n'apparaît dans `dist/`.
