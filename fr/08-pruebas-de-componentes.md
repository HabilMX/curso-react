# Leçon 8 — Tests de composants

*Il est 12 h 15, un jeudi, et la nouvelle version du `revisor` sort à 13 h. Quelqu'un de l'équipe a poussé une modification de « nettoyage » : il a retiré du résumé un `> 0` qui « était en trop », et a rendu au bouton d'enregistrement son `disabled={pending}`, parce que « `aria-disabled`, c'est une invention bizarre ». Le linter ne dit rien. `npm run build` se termine sans erreur. La revue de code l'approuve en deux minutes, car chaque modification, prise isolément, paraît raisonnable. Personne n'a le temps d'ouvrir les cinq écrans, de vider l'API pour voir le rapport sans pannes et de parcourir l'enregistrement au clavier. Si la version sort ainsi, le panneau affichera un `0` isolé chaque fois que tout ira bien, et Raúl, le collègue d'astreinte qui travaille avec un lecteur d'écran, perdra de nouveau le focus au moment précis de l'envoi, comme dans la leçon 7. Il reste quarante-cinq minutes. Ce dont tu as besoin, c'est de quelque chose qui fasse ce parcours à ta place en deux secondes, chaque fois que quelqu'un modifie une ligne, et qui passe au rouge précisément à ces deux endroits. C'est ce que construit cette leçon. Et tu verras aussi quelle partie de ce parcours aucun test sous Node ne peut faire à ta place.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 8.2 et 8.3)

**Ce que tu construis :** la suite de tests du panneau avec Vitest et Testing Library : 27 tests dans 7 fichiers, qui montent l'application complète dans un DOM de test, avec un routeur en mémoire et un `fetch` simulé, et qui couvrent les fonctions pures, le reducer, le schéma, les états du rapport, le détail, les routes, le périmètre d'erreur et le formulaire d'enregistrement

**Ce que tu apprends :** les requêtes (*queries*) par rôle et pourquoi elles comptent pour l'accessibilité ; `getBy`, `queryBy`, `findBy` ; `user-event` ; le `fetch` simulé ; les quatre états, le formulaire et une route avec un routeur en mémoire ; **le test qui passe au rouge quand on annule le correctif** ; ce que jsdom ne peut PAS vérifier

**D'où tu viens.** Du point de contrôle de la [Leçon 7](07-formularios-accesibilidad.md) : un `revisor` avec la liste sur `/`, le détail sur `/servicios/:nombre`, l'enregistrement sur `/servicios/nuevo` et une page « non trouvée » ; les données du serveur dans TanStack Query ; une boîte d'avis avec son reducer et son contexte ; et un formulaire qui se valide avec un schéma, signale ses erreurs avec `aria-invalid` et `aria-describedby`, et ne retire pas le focus au bouton pendant l'envoi. Jusqu'ici, tout cela a été vérifié avec des figures qui s'exécutaient dans un DOM de test et avec Chrome en mode headless, une seule fois, manuellement. Du cours de TypeScript, tu apportes, si tu l'as suivi, un test avec jsdom. Il n'est pas répété ici : on change d'outil et, surtout, de question. Non plus « cette fonction renvoie-t-elle ce que je dis ? », mais « cet écran fait-il ce qu'une personne attend ? ».

**Ce que cette leçon ne fait pas.** Elle ne modifie pas une seule ligne de l'application : le JavaScript que produit `npm run build` est identique, octet pour octet, à celui de la leçon 7. Tout ce qui est nouveau, ce sont des tests, la configuration qui les exécute et quatre fichiers utilitaires. Elle n'utilise pas `@testing-library/jest-dom`, la bibliothèque qui ajoute des comparaisons comme `toBeInTheDocument()` : les tests comparent `textContent` et des attributs avec l'`expect` de Vitest, qui suffit et oblige à dire exactement ce qu'on attend. Elle n'utilise pas `vi.mock` pour remplacer des modules de l'application : la seule chose factice, c'est le réseau, pour des raisons expliquées en 8.3. Elle n'écrit pas de tests de bout en bout avec un vrai navigateur (Playwright, Cypress, le mode navigateur de Vitest) : elle nomme ce que ces outils résoudraient et dit ce qui reste à vérifier manuellement. Et elle ne mesure pas la couverture : un pourcentage de lignes exécutées ne dit pas si un test passerait au rouge face à l'erreur qui compte, et cette leçon t'apprend à vérifier justement cela.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon. Le point de contrôle a été installé de zéro avec `npm ci` dans une copie hors du dépôt, et là, `npm run lint`, `npm run build` et `npm test` se sont terminés avec le code 0 ; `npm run build` a produit `dist/assets/index-C_lOH5GL.js` (mesuré de nouveau le 22 octobre 2026, sur macOS), le même nom que dans la leçon 7. Le nombre de tests a été lu dans le résumé de Vitest, pas dans le code de sortie. Le troisième test de `PaginaServicio.test.tsx` (celui du détail ancien, 8.3.4) a été ajouté lors de la relecture de la leçon : on l'a vu rouge avec la page précédente (`1 failed | 26 passed (27)`) et vert avec le point de contrôle, et les sorties de l'exercice 3 et de la suite complète ont été réexécutées avec le nouveau point de contrôle. Toutes les sorties de Vitest de la leçon ont été obtenues avec `--reporter=default` (ou `--reporter=verbose`, là où c'est indiqué), c'est-à-dire ce que tu verrais dans un terminal interactif ; le reporter a été fixé volontairement car, hors d'un terminal, Vitest peut en choisir un autre qui masque la console des tests qui passent (voir « L'erreur que tu vas voir »). La copie de travail contenait en outre les fichiers des exercices 3 et 4 ; pour l'exécution complète, on a passé à Vitest les chemins des sept fichiers du point de contrôle, ce qui revient à lancer `npx vitest run` dans le point de contrôle. Chaque test qui « passe au rouge » a été provoqué dans cette copie, en modifiant un seul fichier, en n'exécutant que le fichier de tests concerné, puis en restaurant ; à la fin, la copie a été comparée au point de contrôle avec `diff -r` et ne présentait aucune différence, hormis les fichiers de test des exercices 3 et 4, qui ne font pas partie du point de contrôle. Le point de contrôle a aussi été installé de zéro dans un conteneur Linux (Debian 12, image officielle `node:24.22.0-bookworm`) : là, `npm run build` a donné le même nom de fichier et `npm test` s'est terminé avec le code 0 et `Tests  27 passed (27)`. Cela n'a pas tourné sur un vrai Linux Mint ; rien de ce qui est montré ne dépend du système, sauf les mesures en pixels de la page jumelle dans Chrome (point 3 de la figure 3), qui dépendent des polices installées. Ce qui compte là, c'est que Chrome mesure et que jsdom renvoie des zéros. Les figures ont été exécutées avec leur propre `package.json` dans [`programas/08-pruebas-de-componentes/`](../programas/08-pruebas-de-componentes), aux côtés de `revisor/`, comme dans les leçons précédentes : elles sont compilées avec `tsc` et exécutées avec `node`. La figure 3 a en outre une page HTML jumelle qui a été ouverte dans Chrome 155.0.8059.85 en mode headless, avec `--headless --dump-dom` sur le fichier local, pour comparer ce que fait jsdom avec ce que fait un navigateur ; cette exécution n'a ouvert aucun port. Ce qui n'a **pas** été mesuré dans cette leçon, et c'est signalé là où cela apparaît : le parcours au clavier dans une vraie fenêtre et ce que fait entendre un lecteur d'écran. Les deux ont été mesurés ou décrits dans la leçon 7 et reviennent ici dans « Comment savoir que j'ai réussi ». Dans les sorties, les chemins longs sont affichés à partir de `~/curso-react`. Les fichiers de test des exercices et les sorties de la suite, du contrôle négatif et de chaque annulation de correctif se trouvent dans `programas/08-pruebas-de-componentes/ejercicios/` (ils ont été réexécutés lors de l'application de la révision, si bien que leurs heures et leurs durées diffèrent de celles collées ici). Le serveur d'entraînement (le même fichier depuis la leçon 4) répond `400` avec `{"detalle":"nombre de servicio inválido"}` à une adresse comportant un `%` mal formé, comme `/api/servicios/%`, et à sa route `/reintento` ; auparavant, il répondait `500`. On l'a mesuré avec `curl` contre une copie, avant et après, et le processus est resté en vie dans les deux cas.

## À la fin, tu seras capable de

- Installer Vitest, jsdom et Testing Library dans un projet Vite, configurer l'environnement de test et expliquer pourquoi il faut appeler `cleanup` manuellement lorsque Vitest n'expose pas ses fonctions comme globales.
- Trouver un élément par son rôle et son nom accessible, et démontrer avec une figure qu'une requête par rôle ne trouve ni un bouton fait avec un `<span>` ni un champ sans étiquette.
- Choisir entre `getBy`, `queryBy` et `findBy` selon ce que le test affirme (que quelque chose est là, que quelque chose n'est pas là, que quelque chose va arriver), et lire l'erreur que donne chacune quand elle échoue.
- Simuler une personne avec `user-event` : saisir du texte, appuyer sur Tab et sur Espace, cliquer, et expliquer pourquoi on attend ces actions avec `await`.
- Monter l'application complète à une adresse avec un routeur en mémoire, un cache neuf et un `fetch` simulé, et tester avec cela les états du rapport, une route et le formulaire d'enregistrement.
- Vérifier qu'un test protège un correctif : annuler le correctif dans une copie, voir le test au rouge avec le message exact puis restaurer, et reconnaître un test vert qui ne passe pas au rouge.
- Nommer ce que jsdom ne calcule pas (la mise en page, le focus qui se perd quand on désactive un bouton) et concevoir le test pour qu'il vérifie la cause lorsque l'effet ne peut pas être vu.

## Le pourquoi avant le comment

Jusqu'à la leçon 7, chaque fois que le `revisor` changeait, quelqu'un vérifiait qu'il fonctionnait toujours. Il le faisait bien : avec des figures qui rendaient un composant dans un DOM de test, avec `curl` face à l'API d'entraînement, avec Chrome en mode headless piloté par un script. Mais il le faisait **une seule fois**, au moment d'écrire la leçon. La scène du début, c'est ce qui se passe la deuxième fois : le code change, le linter et le compilateur restent au vert, et personne ne refait le parcours. Pose quatre questions au panneau et tu verras ce qui manque.

**Qui se souvient des cas rares ?** Le `0` isolé de la leçon 1 n'apparaît que lorsque **aucun** service n'est en panne. L'API d'entraînement démarre toujours avec deux services en panne. Pour voir l'erreur, il faudrait enregistrer des services sains, relancer la vérification de ceux qui sont en panne ou vider l'API, puis regarder le résumé. Personne ne fait cela avant chaque version. Un test, lui, le fait, car c'est lui qui décide de ce que renvoie l'API.

**Comment tester ce qui dépend du réseau sans dépendre du réseau ?** Le rapport a quatre états, plus un : chargement, erreur, vide, avec données, et avec données anciennes quand la mise à jour échoue. Voir l'état de chargement dans un navigateur exige une API lente ; voir celui d'erreur, une API en panne ; l'état vide, encore une autre API. L'API d'entraînement a la variable `ESCENARIO` pour cela, mais la démarrer trois fois avec trois valeurs n'est pas quelque chose qui tourne en deux secondes. Si le test contrôle ce que renvoie `fetch`, chaque état tient en une ligne.

**Comment sais-tu que le test regarde la même chose que la personne ?** Un test qui cherche `.boton-enviar` ou `div > button:nth-child(2)` passe même si le bouton est devenu un `<span>` qu'un lecteur d'écran n'annonce pas et que le clavier n'atteint pas. Les requêtes de Testing Library partent d'ailleurs : du **rôle** et du **nom accessible**, qui sont ce que le navigateur fournit à la technologie d'assistance. Si un test trouve « le bouton qui s'appelle Dar de alta », ce bouton se trouve dans l'arbre d'accessibilité avec ce rôle et ce nom : un lecteur d'écran l'annonce ainsi. Ce que la requête ne vérifie **pas**, c'est qu'on l'atteigne avec Tab ni qu'il réagisse à Entrée ou à Espace ; cela, c'est le `<button>` natif qui le garantit (leçon 7) et, dans cette suite, c'est le test du focus qui l'exerce avec `usuario.tab()` et `usuario.keyboard(" ")`. C'est la même habitude que dans la leçon 7, désormais automatique.

**Comment sais-tu que le test sert à quelque chose ?** C'est la question que presque personne ne pose. Un test vert dit que le code actuel respecte ce que le test affirme. Il ne dit pas que le test passerait au rouge si le correctif disparaissait. Certains tests passent avec le bon code **et** avec le mauvais : ils ne protègent rien et donnent une fausse tranquillité. La seule façon de le savoir, c'est de faire l'expérience : retirer le correctif, voir le rouge, restaurer. Cette leçon le fait avec trois tests de la suite (et un quatrième dans l'exercice 2) et t'apprend à reconnaître un test qui ne passe pas l'examen.

Les quatre réponses tiennent en trois concepts : interroger la page comme le fait une personne (8.2), monter l'application complète sans réseau ni navigateur (8.3) et le test qui passe au rouge quand on annule le correctif (8.4). Avant vient l'installation (8.1) et, après, avec la même franchise, ce que jsdom ne peut pas vérifier (8.5). À la fin, voici ce que dit `npm test` avec le reporter détaillé, qui affiche une ligne par test :

```bash
$ npx vitest run --reporter=verbose
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts > reducirAvisos > agrega al principio con un identificador nuevo 1ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descarta uno por su identificador y no toca los demás 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > conserva solo los 5 más recientes 0ms
 ✓ src/avisos/avisos.test.ts > reducirAvisos > descartar todos vacía la bandeja y conserva el contador 0ms
 ✓ src/reporte/resumen.test.ts > resumen > cuenta solo los servicios en falla 1ms
 ✓ src/reporte/resumen.test.ts > resumen > usa singular y plural 0ms
 ✓ src/reporte/resumen.test.ts > resumen > filtra por falla y por nombre, sin importar mayúsculas 0ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > convierte el texto del formulario en un NuevoServicio 2ms
 ✓ src/compartido/esquema.test.ts > validarCampos con el esquema del alta > informa todos los campos inválidos a la vez 0ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > cargando: anuncia la carga mientras la API no responde 157ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > sin datos marca los tres campos y lo anuncia 447ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > error: muestra el motivo y un botón para reintentar 395ms
 ✓ src/app/rutas.test.tsx > las rutas > una dirección desconocida muestra la página de no encontrada 629ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > muestra el detalle del servicio de la dirección 581ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > volver a revisar deja un aviso en la bandeja 86ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > vacío: lo dice en lugar de dejar la lista en blanco 134ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > con datos: un enlace por servicio y el resumen de fallas 53ms
 ✓ src/app/rutas.test.tsx > las rutas > el menú marca la página actual 113ms
 ✓ src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor 122ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen 34ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > con datos válidos envía el alta y confirma 546ms
 ✓ src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía 518ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > el filtro «solo fallas» viaja en la dirección 401ms
 ✓ src/reporte/PaginaReporte.test.tsx > la página del reporte > una dirección con el filtro ya puesto abre filtrada 72ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo 176ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora 613ms
 ✓ src/alta/FormularioAlta.test.tsx > el formulario de alta > un nombre repetido se marca en su campo con el mensaje de la API 550ms

 Test Files  7 passed (7)
      Tests  27 passed (27)
   Start at  16:08:16
   Duration  4.69s (environment 54%, tests 29%, setup 8%, transform 4%, import 4%, worker 1%)
```

Ce sont 27 lignes avec `✓`, et le résumé le confirme : `Tests  27 passed (27)`. Regarde comment se lisent les noms : « el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora » (*le formulaire d'enregistrement > le focus ne se perd pas à l'envoi et un second envoi est ignoré*). Chaque test dit quel comportement il protège, dans les termes de qui utilise le panneau, pas de qui l'a programmé. Quand l'un d'eux passera au rouge, le nom te dira ce qui s'est cassé avant même que tu lises une ligne de code. Et regarde les millisecondes : les tests qui montent l'application ont pris de 34 à 629 ms dans cette exécution ; ceux des fonctions pures, de 0 à 2. La suite complète, avec le démarrage de jsdom, a pris 4,69 s. Ces millisecondes dépendent de ce que la machine exécute en parallèle (l'exécution précédente, avec la machine plus libre, avait donné de 8 à 112 ms et 1,06 s), donc lis-les comme un ordre de grandeur : ce qui tient, c'est que les fonctions pures ne prennent presque rien et que monter l'application coûte des centaines de fois plus.

## Les concepts

### 8.1 L'installation : Vitest, jsdom et Testing Library

#### 8.1.1 Cinq dépendances et un script

Le point de contrôle de cette leçon ajoute cinq dépendances de développement et un script. Voici le `package.json` complet :

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.8.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@tanstack/react-query": "5.104.5",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "react-router": "8.5.0"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@testing-library/dom": "10.4.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "npm:typescript@7.0.2",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.13.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "jsdom": "30.1.3",
    "typescript": "npm:@typescript/typescript6@6.0.2",
    "typescript-eslint": "8.72.0",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

Chaque pièce a un rôle différent, et mieux vaut ne pas les confondre :

- **`vitest`** est celui qui exécute les tests : il trouve les fichiers `*.test.ts` et `*.test.tsx`, les transforme avec la même configuration de Vite que celle qu'utilise déjà le projet (c'est pourquoi il comprend TypeScript et JSX sans étape supplémentaire) et fournit les fonctions `test`, `describe`, `expect` et `vi`.
- **`jsdom`** est un DOM écrit en JavaScript : `document`, `window`, éléments, événements, formulaires. Ce n'est pas un navigateur ; c'est la partie du navigateur que l'on peut imiter sans faire aucun rendu. Tu l'as déjà utilisé dans les figures des leçons précédentes.
- **`@testing-library/dom`** fournit les requêtes (`getByRole`, `findByText`…) et l'attente (`waitFor`). Il ne sait rien de React. Il s'installe à part, car `@testing-library/react` le déclare comme dépendance homologue (*peer dependency*) et ne l'apporte pas ; sa documentation demande d'installer les deux ensemble. Les figures l'importent directement pour `logRoles` (8.2.2).
- **`@testing-library/react`** est une fine couche par-dessus : `render`, qui rend un composant React dans le DOM de test, et `cleanup`, qui le démonte. Il enveloppe ses fonctions dans `act` à ta place ; c'est l'outil de React qui applique toutes les modifications en attente avant de comparer ([React, `act`](https://react.dev/reference/react/act)). La documentation de React ajoute qu'avec React Testing Library, la variable `IS_REACT_ACT_ENVIRONMENT` « est déjà définie ». C'est à moitié vrai : la bibliothèque ne l'active **en permanence** que lorsque l'exécuteur de tests expose `beforeAll` comme globale, exactement comme pour `cleanup` ; sans globales, elle ne l'active que pendant chaque `render` ou chaque événement qu'elle enveloppe elle-même dans `act`, et la désactive pendant chaque attente. Une mise à jour survenant en dehors de ces intervalles (un minuteur, une réponse qui arrive tard) ne déclencherait jamais d'avertissement. C'est pourquoi `preparar.ts` l'active manuellement (8.1.3). C'est aussi pourquoi `act` n'apparaît presque pas dans cette suite : la seule fois où on l'utilise manuellement, c'est dans l'exercice 3, pour naviguer avec le routeur en dehors d'un clic.
- **`@testing-library/user-event`** simule une personne : il saisit du texte, clique, appuie sur des touches. Il est expliqué en 8.2.3.

Le nouveau script est `"test": "vitest run"`. Le mot `run` compte : sans lui, dans ton terminal, `vitest` reste à surveiller tes fichiers et réexécute les tests à chaque modification, ce qui est pratique pendant que tu programmes et gênant dans une vérification qui doit se terminer. (Il ne s'exécute qu'une fois de lui-même sur un serveur d'intégration continue, dans un terminal non interactif ou lorsqu'il détecte qu'un assistant de programmation le lance.) Avec `run`, il s'exécute une fois n'importe où et se termine avec le code 0 si tout est passé, ou 1 si quelque chose a échoué.

Comme dans tout le cours, les versions sont exactes. Elles ont été relevées avec `npm view` le 21 octobre 2026 et sont les mêmes que celles du tableau des versions du README (« Versiones con las que se escribió »). Si un jour elles diffèrent, c'est le `package.json` du point de contrôle qui fait foi.

#### 8.1.2 La configuration vit dans `vite.config.ts`

Vitest lit la configuration de Vite. Pas besoin d'un fichier à part ; une section `test` suffit :

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
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
  },
});
```

Par rapport à la leçon 7, deux choses changent. La première : `defineConfig` s'importe depuis `vitest/config` et non depuis `vite`. C'est la même fonction avec un type plus large, qui connaît la section `test` ; avec celle de `vite`, TypeScript refuserait cette clé. (La documentation de Vitest montre aussi l'autre solution, qui consiste à garder l'importation depuis `vite` et à ajouter une référence de types à triple barre oblique au début du fichier ; le point de contrôle a choisi l'importation, qui se lit sans savoir ce qu'est une triple barre oblique.)

La seconde : la section `test`, avec deux options.

- **`environment: "jsdom"`.** Par défaut, Vitest exécute les tests dans l'environnement `node`, sans `document` ni `window` ([Vitest, « Test Environment »](https://vitest.dev/guide/environment.html)). Avec `jsdom`, avant chaque fichier de tests, il crée un DOM et place ses objets dans la portée globale, comme si le fichier s'exécutait dans une page. C'est pourquoi `jsdom` doit être installé : Vitest l'utilise, mais ne l'apporte pas.
- **`setupFiles`.** Une liste de fichiers que Vitest exécute avant chaque fichier de tests. Ici, il n'y en a qu'un, `preparar.ts`, et ce qu'il fait mérite sa propre section.

Ce qui ne change pas compte aussi : `plugins: [react()]` est le même que d'habitude, si bien que les tests voient le code transformé exactement comme le voit le serveur de développement. Et le `proxy` vers l'API n'intervient pas dans les tests : dans ceux-ci, personne ne va sur le réseau.

#### 8.1.3 Ce qu'il faut nettoyer après chaque test

```ts
// revisor/src/pruebas/preparar.ts
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// React solo avisa de las actualizaciones fuera de act() si esta variable está encendida.
// Testing Library la enciende sola cuando el ejecutor expone `beforeAll` como global; con
// `globals` apagado no lo hace, y hay que hacerlo aquí.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
```

Ce sont trois instructions, et chacune a sa raison d'être.

**`cleanup()`** démonte tout ce que `render` a rendu. Sans lui, le deuxième test d'un fichier trouverait dans le DOM l'application du premier **et** la sienne : deux boutons « Dar de alta », deux boîtes d'avis, et une requête comme `getByRole("button", { name: "Dar de alta" })` échouerait avec un « j'en ai trouvé plusieurs ». La documentation de React Testing Library indique que `cleanup` est appelé automatiquement si l'environnement de test fournit une fonction globale `afterEach`, et que sinon, il faut l'appeler après chaque test ([Testing Library, API de React](https://testing-library.com/docs/react-testing-library/api)). Or Vitest, par défaut, **n'expose pas** ses fonctions comme globales : l'option `globals` vaut `false`, et sa documentation met justement en garde contre ceci : certaines bibliothèques, comme `@testing-library/react`, dépendent de ces globales pour faire leur nettoyage toutes seules ([Vitest, `globals`](https://vitest.dev/config/globals.html)). Le cours laisse `globals` désactivé volontairement : chaque fichier de tests importe `test`, `expect` et `vi` explicitement, et l'on voit d'où vient chaque chose. Le prix à payer, c'est ce fichier.

**`vi.unstubAllGlobals()`** défait ce qu'a fait `vi.stubGlobal`. Les tests remplacent le `fetch` global par un faux (8.3.1), et ce remplacement ne doit pas survivre au test qui l'a fait. D'après la documentation, `vi.stubGlobal` modifie la valeur d'une variable globale et `vi.unstubAllGlobals` restaure les valeurs d'origine ; avec jsdom, la modification est aussi visible sur `window` ([Vitest, `vi`](https://vitest.dev/api/vi.html)).

**`IS_REACT_ACT_ENVIRONMENT = true`** active les avertissements de React à propos d'`act`. React n'avertit d'une mise à jour d'état survenue en dehors d'`act` que si cette variable globale vaut `true` ; la documentation de React demande de la définir dans le fichier de préparation des tests. React Testing Library l'active toute seule, mais elle le fait depuis un `beforeAll` global, qui n'existe pas quand `globals` est désactivé : c'est le même problème que pour `cleanup`. Sans cette ligne, la suite n'afficherait jamais d'avertissement d'`act`, et « il n'y a aucun avertissement » ne démontrerait rien. Le `as { IS_REACT_ACT_ENVIRONMENT?: boolean }` est là pour TypeScript, qui ne connaît pas cette propriété de `globalThis`.

Que la ligne serve à quelque chose a été mesuré avec un contrôle négatif, un test jetable qui ne fait pas partie du point de contrôle : un composant modifie son état avec un minuteur, et le test attend avec un autre minuteur, pas avec `findBy`, si bien que personne n'enveloppe la modification dans `act`. (`screen`, qui apparaît dans le test, interroge tout le document ; il est expliqué en 8.3.2.)

```tsx
// fragmento: una prueba de control, fuera del punto de control (programas/08-pruebas-de-componentes/ejercicios/control.test.tsx)
import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { expect, test } from "vitest";

function Tardio() {
  const [texto, establecerTexto] = useState("esperando");
  useEffect(() => {
    const temporizador = setTimeout(() => establecerTexto("listo"), 10);
    return () => clearTimeout(temporizador);
  }, []);
  return <p>{texto}</p>;
}

test("una actualización fuera de act", async () => {
  render(<Tardio />);
  // Se espera con un temporizador simple, no con findBy: nadie envuelve el cambio en act.
  await new Promise((listo) => setTimeout(listo, 50));
  expect(screen.getByText("listo")).toBeDefined();
});
```

Avec le `preparar.ts` sans la ligne :

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:10
   Duration  362ms (environment 66%, tests 20%, setup 10%, transform 3%, import 1%, worker 1%)
```

Avec la ligne :

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/pruebas/control.test.tsx > una actualización fuera de act
An update to Tardio inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:11
   Duration  349ms (environment 67%, tests 20%, setup 10%, transform 1%, import 1%, worker 1%)
```

Le test passe dans les deux cas, car le texte arrive bien à « listo ». Ce qui change, c'est qu'avec la ligne, React signale dans la sortie d'erreur (`stderr`) qu'il y a eu une mise à jour sans `act`. C'est l'avertissement que la suite du `revisor` ne doit pas avoir, et qu'elle n'a pas : avec la ligne en place, les 27 tests passent sans un seul `stderr`.

Pourquoi `afterEach` et pas `beforeEach` ? Parce que nettoyer à la fin laisse le DOM vide aussi après le **dernier** test, et parce qu'ainsi chaque test commence avec ce qu'a laissé le nettoyage, et non avec ce qu'a laissé un autre test. Les tests ne dépendent pas de leur ordre, et c'est cette propriété qui permet d'exécuter un fichier seul, comme tu le feras en 8.4.

#### 8.1.4 Le premier test n'a pas besoin de React

Avant de rendre quoi que ce soit, les pièces les plus faciles à tester sont les fonctions pures. La leçon 1 a sorti le décompte des pannes dans `resumen.ts` précisément pour cela : mêmes entrées, même sortie, sans DOM. Son test :

```ts
// revisor/src/reporte/resumen.test.ts
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { contarFallas, filtrarEstados, textoFallas } from "./resumen";

describe("resumen", () => {
  test("cuenta solo los servicios en falla", () => {
    expect(contarFallas(reporteDeEjemplo.estados)).toBe(2);
    expect(contarFallas([])).toBe(0);
  });

  test("usa singular y plural", () => {
    expect(textoFallas(1)).toBe("1 servicio con falla");
    expect(textoFallas(2)).toBe("2 servicios con falla");
  });

  test("filtra por falla y por nombre, sin importar mayúsculas", () => {
    const nombres = (soloFallas: boolean, texto: string) =>
      filtrarEstados(reporteDeEjemplo.estados, { soloFallas, texto }).map((estado) => estado.nombre);

    expect(nombres(false, "")).toEqual(["catálogo", "pagos", "inventario", "reportes"]);
    expect(nombres(true, "")).toEqual(["pagos", "reportes"]);
    expect(nombres(false, "PAG")).toEqual(["pagos"]);
    expect(nombres(true, "catá")).toEqual([]);
  });
});
```

Lis la forme, car c'est celle de toute la suite. `describe` regroupe des tests sous un nom ; `test` en définit un, avec un nom et une fonction ; `expect(valor).toBe(esperado)` compare avec `Object.is`, qui, pour les nombres et les textes, est l'égalité habituelle ; `toEqual` compare la **forme** des tableaux et des objets, élément par élément. Le troisième test utilise une fonction auxiliaire, `nombres`, pour que chaque ligne ne dise que ce qui change : avec ou sans « solo fallas », avec quel texte. Le dernier cas, `nombres(true, "catá")`, vérifie que les deux filtres se combinent : `catálogo` correspond au texte mais n'est pas en panne, c'est pourquoi la liste reste vide.

Les deux autres tests sans React suivent la même idée. Celui du reducer d'avis de la leçon 6, qui le teste sans monter un seul composant, comme l'avait déjà fait la figure de cette leçon :

```ts
// revisor/src/avisos/avisos.test.ts
import { describe, expect, test } from "vitest";
import { estadoInicialAvisos, MAXIMO_AVISOS, reducirAvisos, type EstadoAvisos } from "./avisos";

function agregar(estado: EstadoAvisos, texto: string): EstadoAvisos {
  return reducirAvisos(estado, { tipo: "agregado", nivel: "exito", texto });
}

describe("reducirAvisos", () => {
  test("agrega al principio con un identificador nuevo", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    expect(estado.avisos.map((aviso) => [aviso.id, aviso.texto])).toEqual([
      [2, "segundo"],
      [1, "primero"],
    ]);
  });

  test("descarta uno por su identificador y no toca los demás", () => {
    const estado = agregar(agregar(estadoInicialAvisos, "primero"), "segundo");
    const despues = reducirAvisos(estado, { tipo: "descartado", id: 1 });
    expect(despues.avisos.map((aviso) => aviso.texto)).toEqual(["segundo"]);
    expect(estado.avisos).toHaveLength(2);
  });

  test(`conserva solo los ${MAXIMO_AVISOS} más recientes`, () => {
    let estado = estadoInicialAvisos;
    for (let numero = 1; numero <= MAXIMO_AVISOS + 2; numero += 1) {
      estado = agregar(estado, `aviso ${numero}`);
    }
    expect(estado.avisos).toHaveLength(MAXIMO_AVISOS);
    expect(estado.avisos[0]?.texto).toBe(`aviso ${MAXIMO_AVISOS + 2}`);
  });

  test("descartar todos vacía la bandeja y conserva el contador", () => {
    const estado = reducirAvisos(agregar(estadoInicialAvisos, "uno"), { tipo: "todos-descartados" });
    expect(estado).toEqual({ avisos: [], siguienteId: 2 });
  });
});
```

Le deuxième test affirme quelque chose qu'une personne ne verrait jamais à l'écran : `expect(estado.avisos).toHaveLength(2)` après avoir écarté un avis. Il vérifie que le reducer **n'a pas muté** l'état qu'il a reçu, ce qui est la règle d'immuabilité de la leçon 2. Et le troisième utilise la constante `MAXIMO_AVISOS` au lieu d'écrire `5` : si demain le maximum change, le test continue de dire la vérité.

Et celui du schéma de la leçon 7, qui vérifie la différence que cette leçon a expliquée : toutes les erreurs à la fois, pas seulement la première.

```ts
// revisor/src/compartido/esquema.test.ts
import { describe, expect, test } from "vitest";
import { camposAlta } from "../alta/esquemaAlta";
import { validarCampos } from "./esquema";

describe("validarCampos con el esquema del alta", () => {
  test("convierte el texto del formulario en un NuevoServicio", () => {
    expect(
      validarCampos(camposAlta, { nombre: " correo ", url: "https://correo.example", timeoutMs: "1500" }),
    ).toEqual({
      ok: true,
      valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 },
    });
  });

  test("informa todos los campos inválidos a la vez", () => {
    expect(validarCampos(camposAlta, { nombre: "  ", url: "ftp://x", timeoutMs: "1.5" })).toEqual({
      ok: false,
      errores: {
        nombre: "escribe un valor",
        url: "escribe una dirección que empiece con http:// o https://",
        timeoutMs: "escribe un número entero mayor que cero",
      },
    });
  });
});
```

Ces neuf tests ne coûtent presque rien (de 0 à 2 ms chacun) et protègent la logique qui ne dépend pas de React. Mais ils ne voient pas l'écran. Le `0` isolé de la scène ne vit pas dans `contarFallas`, qui renvoie `0` correctement : il vit dans la façon dont `ResumenFallas` utilise ce `0` en JSX. Pour le voir, il faut faire un rendu.

### 8.2 Interroger la page comme le fait une personne

#### 8.2.1 `getBy`, `queryBy`, `findBy`

Avant de voir pourquoi il vaut mieux chercher par rôle (8.2.2), il faut savoir de quelles façons on peut interroger la page. Chaque requête existe en trois familles, et la différence n'est pas une question de style : chacune affirme quelque chose de différent. La documentation le résume ainsi : `getBy` renvoie l'élément et lève une erreur descriptive s'il n'y en a aucun ; `queryBy` renvoie l'élément ou `null` ; `findBy` renvoie une promesse qui se résout quand il apparaît. Les trois ont leur version `All` (`getAllBy`, `queryAllBy`, `findAllBy`), qui renvoie un tableau. Et les versions sans `All` échouent aussi si elles trouvent **plus d'un** élément.

La figure 1 le montre avec une copie réduite de ce que rend `/` : une boîte d'avis vide (un `role="status"` sans contenu, comme celui du `revisor`) et le contenu du rapport, qui affiche « Cargando… » puis, cent millisecondes plus tard, la liste.

```tsx
// fig08_01.tsx
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { useEffect, useState } from "react";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Una copia reducida de lo que dibuja `/`: la bandeja de avisos (un `status` vacío)
// y el contenido del reporte, que dice «Cargando…» y 100 ms después muestra la lista.
function Reporte() {
  const [estados, establecerEstados] = useState<readonly string[] | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerEstados(["catálogo", "pagos"]), 100);
    return () => clearTimeout(temporizador);
  }, []);

  return (
    <>
      <section aria-label="Avisos">
        <div role="status" aria-atomic="false"></div>
      </section>
      {estados === null ? (
        <p role="status">Cargando…</p>
      ) : (
        <ul>
          {estados.map((nombre) => (
            <li key={nombre}>{nombre}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// Solo la primera línea del mensaje: el resto es el DOM completo, que aquí estorba.
function primeraLinea(error: unknown): string {
  return error instanceof Error ? error.message.split("\n")[0] : String(error);
}

const pantalla = render(<Reporte />);

console.log("1. antes de que lleguen los datos");
try {
  pantalla.getByRole("list");
} catch (error) {
  console.log(`   getByRole("list")   lanza: ${primeraLinea(error)}`);
}
console.log(`   queryByRole("list") devuelve: ${String(pantalla.queryByRole("list"))}`);
try {
  pantalla.getByRole("status");
} catch (error) {
  console.log(`   getByRole("status") lanza: ${primeraLinea(error)}`);
}
console.log(`   getAllByRole("status") encuentra: ${pantalla.getAllByRole("status").length}`);
const cargando = pantalla.getByText("Cargando…");
console.log(`   getByText("Cargando…") tiene role="${cargando.getAttribute("role")}"`);

console.log("2. esperando con findBy");
const lista = await pantalla.findByRole("list");
console.log(`   findByRole("list") la encontró, con ${lista.children.length} elementos`);
console.log(`   queryByText("Cargando…") ahora devuelve: ${String(pantalla.queryByText("Cargando…"))}`);

console.log("3. lo que nunca aparece");
try {
  await pantalla.findByRole("table", {}, { timeout: 300 });
} catch (error) {
  console.log(`   findByRole("table") rechaza: ${primeraLinea(error)}`);
}

pantalla.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_01.tsx
$ node fig08_01.js
1. antes de que lleguen los datos
   getByRole("list")   lanza: Unable to find an accessible element with the role "list"
   queryByRole("list") devuelve: null
   getByRole("status") lanza: Found multiple elements with the role "status"
   getAllByRole("status") encuentra: 2
   getByText("Cargando…") tiene role="status"
2. esperando con findBy
   findByRole("list") la encontró, con 2 elementos
   queryByText("Cargando…") ahora devuelve: null
3. lo que nunca aparece
   findByRole("table") rechaza: Unable to find role="table"
```

Huit résultats, et chacun enseigne quelque chose.

**Avant l'arrivée des données, `getByRole("list")` lève une erreur et `queryByRole("list")` renvoie `null`.** C'est la même question avec deux réponses différentes pour « absent ». Utilise `getBy` quand l'élément **doit** être là : s'il manque, le test s'arrête à cette ligne avec un message qui dit ce que tu cherchais et, en dessous, le DOM qu'il y avait (c'est Testing Library qui l'affiche, pas Vitest, tronqué à 7 000 caractères sauf si tu modifies `DEBUG_PRINT_LIMIT` ; la figure le coupe avec `primeraLinea` parce qu'ici il gêne). Utilise `queryBy` quand tu veux affirmer que quelque chose n'est **pas** là : `expect(screen.queryByRole("list")).toBeNull()`. L'écrire avec `getBy` est impossible, car il lèverait une erreur avant d'atteindre l'`expect`. Le test de l'état vide du `revisor` utilise exactement cette ligne.

**`getByRole("status")` lève « Found multiple elements with the role "status" ».** À l'écran, il y a **deux** zones d'état : la boîte d'avis, qui est toujours là (leçon 6), et le « Cargando… ». `getBy` en exige un et un seul. Ce détail est bien réel dans le `revisor` et explique une ligne de sa suite qui, sinon, paraîtrait étrange : le test du chargement cherche le texte avec `findByText("Cargando…")` et vérifie **ensuite** que son rôle est `status`. Ainsi, il trouve l'élément sans ambiguïté et affirme malgré tout qu'il est annoncé comme zone d'état. L'autre solution serait de filtrer par nom, mais un `status` ne tire pas son nom de son contenu, si bien que « Cargando… » n'est pas son nom.

**`findByRole("list")` attend et trouve la liste avec deux éléments**, et ensuite `queryByText("Cargando…")` vaut déjà `null`. `findBy` est la combinaison de `getBy` et de `waitFor` : il répète la requête toutes les 50 ms jusqu'à la trouver ou jusqu'à ce que 1 000 ms se soient écoulées, et il réessaie en outre chaque fois que le DOM change ([Testing Library, « Async Methods »](https://testing-library.com/docs/dom-testing-library/api-async/)). Dans le `revisor`, presque tout arrive en retard : le rapport dépend d'un `fetch`, l'avis de la boîte dépend d'une action, la page dépend du routeur. C'est pourquoi presque tous les tests de composants de la suite commencent par un `await screen.findBy…` : c'est la façon de dire « attends que l'écran arrive à ce point ».

**`findByRole("table")` rejette avec « Unable to find role="table" »** après le délai d'expiration, que la figure a abaissé à 300 ms pour ne pas attendre la seconde entière. Un `findBy` qui ne trouve jamais ne reste pas bloqué : il échoue avec un message.

Une règle qui en découle : **n'enveloppe pas manuellement un `getBy` dans un `waitFor`** si ce que tu veux, c'est attendre un élément ; `findBy` existe pour cela. Et n'utilise pas `findBy` pour quelque chose qui est déjà là : cela fonctionne, mais cela dit à qui lit le test que tu attendais quelque chose que tu n'attendais pas. Chaque famille communique une intention.

Pourquoi la figure n'a-t-elle émis aucun avertissement à propos d'`act` ? Parce qu'elle s'exécute avec `node`, en dehors d'un test, et que personne n'a activé `IS_REACT_ACT_ENVIRONMENT` : sans cette variable, React n'avertit pas. Dans la suite, elle est bien activée (`preparar.ts`, 8.1.3). Et là, pendant qu'un `findBy` attend, React Testing Library la **désactive** volontairement, car l'attente est déjà la bonne façon de laisser l'écran arriver là où il va. Un avertissement qui mentionne `act(` apparaît quand une mise à jour se produit sans que personne n'attende, par exemple après la fin du test ; en 8.4.3, tu en verras un vrai. La sortie complète de la suite du `revisor` n'en contient aucun.

#### 8.2.2 Par rôle et par nom

Quand une personne utilise le panneau, elle ne pense pas « le deuxième `<button>` à l'intérieur du `<form>` ». Elle pense « le bouton Dar de alta ». Qui utilise un lecteur d'écran entend la même chose : « Dar de alta, bouton ». Ces deux mots sont le **nom accessible** et le **rôle**, les mêmes que dans la leçon 7, et ce sont eux que le navigateur fournit à la technologie d'assistance. Testing Library classe ses requêtes selon ce principe. Dans sa page sur les requêtes, elle place d'abord celles qu'elle appelle « accessibles à tous » (`getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`), car elles reflètent l'expérience de qui utilise la souris et la vue, mais aussi celle de qui utilise une technologie d'assistance ; ensuite les sémantiques (`getByAltText`, `getByTitle`), et enfin les identifiants de test (`getByTestId`) ([Testing Library, « About Queries »](https://testing-library.com/docs/queries/about/)). Derrière, il y a un principe que la bibliothèque formule elle-même ainsi : plus tes tests ressemblent à la façon dont ton logiciel est utilisé, plus ils peuvent te donner confiance ([Testing Library, « Guiding Principles »](https://testing-library.com/docs/guiding-principles)).

La conséquence pratique est plus forte qu'il n'y paraît : **une requête par rôle échoue si l'élément n'a pas ce rôle et ce nom dans l'arbre d'accessibilité**, ou s'il y est masqué. Ce n'est pas un test complet d'accessibilité (un `<span role="button">` sans `tabindex` passerait la requête et resterait hors de portée du clavier), mais cela écarte l'imitation la plus courante, celle de la figure 2. Pour le voir, la figure 2 rend deux fois la même chose : un avis de la boîte avec son bouton « Descartar » et un champ « Nombre ». En haut, avec les éléments natifs ; en bas, une imitation qui aurait le même aspect avec un peu de CSS.

```tsx
// fig08_02.tsx
import { logRoles } from "@testing-library/dom";
import { render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>");

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
});

// Dos versiones de lo mismo: un aviso de la bandeja con su botón y un campo.
// La de arriba usa los elementos nativos; la de abajo se ve igual con CSS, pero no lo es.
function Nativo() {
  return (
    <section aria-label="Nativo">
      <p>
        Se dio de alta correo{" "}
        <button type="button" aria-label="Descartar: Se dio de alta correo">
          Descartar
        </button>
      </p>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" />
    </section>
  );
}

function Imitacion() {
  return (
    <section aria-label="Imitación">
      <p>
        Se dio de alta correo <span className="boton">Descartar</span>
      </p>
      <p>Nombre</p>
      <input name="nombre" />
    </section>
  );
}

function probar(descripcion: string, consulta: () => unknown): void {
  try {
    consulta();
    console.log(`   ${descripcion}: lo encuentra`);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(`   ${descripcion}: ${mensaje}`);
  }
}

for (const [titulo, Componente] of [
  ["nativo", Nativo],
  ["imitación", Imitacion],
] as const) {
  const pantalla = render(<Componente />);
  console.log(`${titulo}:`);
  probar('getByText("Descartar")', () => pantalla.getByText("Descartar"));
  probar('getByRole("button", { name: "Descartar: Se dio de alta correo" })', () =>
    pantalla.getByRole("button", { name: "Descartar: Se dio de alta correo" }),
  );
  probar('getByRole("button", { name: "Descartar" })', () =>
    pantalla.getByRole("button", { name: "Descartar" }),
  );
  probar('getByLabelText("Nombre")', () => pantalla.getByLabelText("Nombre"));
  probar('getByRole("textbox", { name: "Nombre" })', () =>
    pantalla.getByRole("textbox", { name: "Nombre" }),
  );
  pantalla.unmount();
}

// logRoles colorea su salida para la terminal; en un archivo, los colores estorban.
process.env.COLORS = "false";
console.log("logRoles del nativo:");
const nativo = render(<Nativo />);
logRoles(nativo.container);
nativo.unmount();
dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_02.tsx
$ node fig08_02.js
nativo:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): lo encuentra
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): lo encuentra
   getByRole("textbox", { name: "Nombre" }): lo encuentra
imitación:
   getByText("Descartar"): lo encuentra
   getByRole("button", { name: "Descartar: Se dio de alta correo" }): Unable to find an accessible element with the role "button" and name "Descartar: Se dio de alta correo"
   getByRole("button", { name: "Descartar" }): Unable to find an accessible element with the role "button" and name "Descartar"
   getByLabelText("Nombre"): Unable to find a label with the text of: Nombre
   getByRole("textbox", { name: "Nombre" }): Unable to find an accessible element with the role "textbox" and name "Nombre"
logRoles del nativo:
region:

Name "Nativo":
<section
  aria-label="Nativo"
/>

--------------------------------------------------
paragraph:

Name "":
<p />

--------------------------------------------------
button:

Name "Descartar: Se dio de alta correo":
<button
  aria-label="Descartar: Se dio de alta correo"
  type="button"
/>

--------------------------------------------------
textbox:

Name "Nombre":
<input
  id="nombre"
  name="nombre"
/>

--------------------------------------------------
```

Lis la sortie par colonnes. **`getByText("Descartar")` trouve les deux versions.** Chercher par texte ne permet pas de savoir si ce qu'on a trouvé est un bouton, un `<span>` ou un paragraphe. Un test écrit ainsi passerait avec l'imitation, que le clavier n'atteint pas et qu'un lecteur d'écran n'annonce pas comme un bouton.

**`getByRole("button", { name: "Descartar: Se dio de alta correo" })` ne trouve que le natif.** Le rôle `button`, le `<button>` l'a sans que personne n'écrive `role="button"` : c'est un rôle implicite, et la documentation de `ByRole` le dit avec ce même exemple ([Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole)). L'imitation n'a pas de rôle de bouton, elle n'existe donc pas pour la requête, pas plus qu'elle n'existe pour un lecteur d'écran.

**`getByRole("button", { name: "Descartar" })` n'en trouve aucun**, et cela surprend la première fois. Le bouton natif **affiche** « Descartar » à l'écran, mais son nom accessible est « Descartar: Se dio de alta correo », car `aria-label` l'emporte sur le contenu. C'est exactement ce que voulait la boîte d'avis de la leçon 6 : avec cinq avis dans la liste, cinq boutons qui s'appelleraient « Descartar » seraient impossibles à distinguer pour qui les entend. Le test le vérifie sans l'avoir cherché : si quelqu'un retirait l'`aria-label`, le test du formulaire qui cherche « Descartar: Se dio de alta correo » passerait au rouge.

**`getByLabelText("Nombre")` et `getByRole("textbox", { name: "Nombre" })` trouvent le champ natif et pas l'imitation.** Le paragraphe « Nombre » au-dessus du champ ressemble à une étiquette, mais il n'est pas relié au champ : c'est la figure 4 de la leçon 7 vue depuis un test.

La dernière partie de la sortie est `logRoles`, une fonction de débogage de Testing Library qui affiche les rôles implicites d'un arbre et le nom de chaque élément ([Testing Library, « Debugging »](https://testing-library.com/docs/dom-testing-library/api-debugging)). Quand tu ne sais pas comment s'appelle quelque chose pour une requête, `logRoles(container)` te le dit. Remarque que `section` apparaît comme `region` avec le nom « Nativo » : une `<section>` dotée d'un nom accessible a le rôle `region`, ce qui est justement ce que la leçon 1 a expliqué pour la `Tarjeta`, et c'est pourquoi la suite peut chercher `getByRole("region", { name: "Avisos" })`. Deux détails de la figure : `logRoles` colore sa sortie pour le terminal, et la ligne `process.env.COLORS = "false"` désactive la couleur pour que le fichier `.salida.txt` se lise proprement (la documentation nomme cette variable) ; et le paragraphe apparaît avec un nom vide, car les paragraphes ne tirent pas leur nom de leur contenu.

Cela ne veut pas dire qu'on n'utilise que `getByRole`. La suite utilise `getByLabelText` pour les champs du formulaire, ce qui est plus direct et dit la même chose (le champ a cette étiquette), et `getByText` ou `findByText` pour les textes qui ne sont pas des contrôles, comme « No hay servicios configurados todavía. ». Ce qu'elle n'utilise **pas**, c'est `getByTestId` ni des sélecteurs CSS. La règle pratique : cherche d'abord par rôle ; si l'élément n'a pas de rôle utile (un paragraphe, un texte isolé), par texte ; et si, pour trouver quelque chose, tu as besoin d'un identifiant de test, demande-toi d'abord si une personne pourrait le trouver.

Il y a un coût qu'il vaut mieux connaître. `ByRole` calcule l'arbre d'accessibilité, et la documentation avertit que ces calculs peuvent être coûteux avec de grands arbres DOM. Avec le `revisor`, cela ne se remarque pas (le test le plus lent de la suite a pris 629 ms lors de l'exécution de 8.1, avec l'application complète montée), mais si l'une de tes suites se traîne, c'est un suspect.

#### 8.2.3 `user-event` : une personne, pas un événement

Pour tester un formulaire, il faut y saisir du texte et l'envoyer. Testing Library fournit `fireEvent`, qui déclenche **un** événement du DOM : un `click`, un `input`. Mais une personne qui clique produit plusieurs événements à la suite (le pointeur descend, le pointeur remonte, le focus change, le clic), et une personne qui saisit du texte produit, pour chaque touche, une séquence d'événements de clavier et de saisie. `user-event` simule l'interaction complète. Sa documentation le dit ainsi : il simule des *interactions* complètes, qui peuvent déclencher plusieurs événements et faire des vérifications en chemin ; par exemple, il ne permet pas de cliquer sur un élément masqué ni de saisir du texte dans un champ désactivé, pas plus que ne le permettrait le navigateur ([Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro)).

Trois règles d'utilisation, toutes trois visibles dans `montar.tsx` et dans les tests :

1. **`userEvent.setup()` avant le rendu.** La documentation le recommande ainsi, et `montarEn` le fait dans cet ordre. Il renvoie un objet, `usuario`, avec les méthodes `click`, `type`, `tab`, `keyboard`.
2. **Chaque méthode s'attend avec `await`.** Elles renvoient des promesses, car entre une touche et la suivante, elles laissent React et le DOM terminer leur travail. Un `usuario.click(…)` sans `await`, c'est un test qui compare avant que le clic ait eu lieu.
3. **On agit sur ce que la personne toucherait.** `usuario.type(campo, "correo")` saisit du texte dans le champ que tu as trouvé par son étiquette ; `usuario.tab()` déplace le focus vers l'élément focalisable suivant, comme la touche Tab ; `usuario.keyboard(" ")` appuie sur Espace sur l'élément qui a le focus. Dans la [documentation du clavier](https://testing-library.com/docs/user-event/keyboard), les caractères imprimables s'écrivent tels quels et les touches nommées vont entre accolades (`{Shift}`).

La différence se remarque dans le test le plus fin de la suite, celui où le focus ne se perd pas à l'envoi. Il atteint le bouton avec Tab depuis le dernier champ et envoie avec Espace, ce que fait une personne au clavier. Avec `fireEvent.click(boton)`, il aurait sauté précisément la partie qui compte : que le focus soit sur le bouton au moment de l'envoi.

### 8.3 L'application entière, sans réseau ni navigateur

#### 8.3.1 Seul le réseau est factice

Pour tester un écran du `revisor`, il faut décider de ce qui est réel et de ce qui est factice. Les options vont d'un extrême à l'autre : rendre `ContenidoReporte` seul, en lui passant manuellement un objet qui imite le résultat de `useQuery` ; remplacer avec `vi.mock` le module `cargar.ts` par un autre qui renvoie ce que tu veux ; ou rendre l'application complète et ne remplacer que `fetch`.

Le point de contrôle a choisi la troisième, et la raison est la même règle qu'en 8.2 : ressembler à la façon dont le logiciel est utilisé. Si le test passe à `ContenidoReporte` un objet inventé, il vérifie que `ContenidoReporte` sait rendre cet objet, mais pas que TanStack Query le produise ainsi, ni que la clé de requête soit la bonne, ni que `cargarReporte` valide la réponse. Si le test remplace `cargar.ts`, il saute la frontière réseau que la leçon 0 a écrite et que la leçon 4 a raccordée. En revanche, `fetch` est la frontière **extérieure** du programme : tout ce qui se trouve de ce côté-ci (les composants, Query, le routeur, la validation avec `esReportePublico`, le reducer d'avis) s'exécute pour de vrai, et la seule chose que l'on décide, c'est ce que renvoie « l'API ». C'est la même frontière que celle qu'imite le serveur d'entraînement, mais à l'intérieur du processus et en zéro milliseconde.

```ts
// revisor/src/pruebas/fetchFalso.ts
import { vi } from "vitest";

export interface RespuestaFalsa {
  readonly status: number;
  readonly cuerpo: unknown;
}

export type Rutas = Readonly<Record<string, RespuestaFalsa | (() => Promise<RespuestaFalsa>)>>;

// Sustituye `fetch` por una función que responde según "MÉTODO /ruta". Lo que no
// esté en la tabla responde 404, para que una ruta olvidada se note en la prueba.
export function instalarFetchFalso(rutas: Rutas) {
  const falso = vi.fn(async (entrada: RequestInfo | URL, opciones?: RequestInit) => {
    const url = new URL(String(entrada), "http://localhost");
    const clave = `${opciones?.method ?? "GET"} ${decodeURIComponent(url.pathname)}`;
    const definida = rutas[clave];
    const respuesta =
      definida === undefined
        ? { status: 404, cuerpo: { detalle: `sin ruta falsa para ${clave}` } }
        : typeof definida === "function"
          ? await definida()
          : definida;

    return new Response(JSON.stringify(respuesta.cuerpo), {
      status: respuesta.status,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", falso);
  return falso;
}

export function nuncaResponde(): Promise<RespuestaFalsa> {
  return new Promise(() => {});
}
```

Parcours la fonction de haut en bas.

- **La table des routes.** `instalarFetchFalso` reçoit un objet dont les clés sont `"MÉTODO /ruta"`, comme `"GET /api/estados"` ou `"POST /api/servicios"`, et dont les valeurs sont une réponse (`status` et `cuerpo`) ou une **fonction** qui renvoie une promesse de réponse. La fonction sert pour ce qui ne répond pas immédiatement : une réponse qui n'arrive jamais, ou une réponse que le test livre quand il le décide.
- **La clé est tirée de la requête.** `new URL(String(entrada), "http://localhost")` convertit l'adresse relative qu'utilise le panneau (`/api/estados`) en une URL complète afin de pouvoir lire son `pathname`. `decodeURIComponent` compte avec `catálogo` : quand l'URL est construite, l'accent est encodé (`/api/servicios/cat%C3%A1logo`), et la table s'écrit avec l'accent, comme l'écrirait une personne. La méthode est tirée de `opciones?.method`, et si elle n'est pas fournie, c'est `GET`, comme dans `fetch`.
- **Ce qui n'est pas dans la table renvoie 404.** C'est une petite décision aux grandes conséquences. Si un test oublie de déclarer une route, le panneau reçoit un 404 avec un `detalle` qui dit `sin ruta falsa para GET /api/…`, et le plus probable est que le test échoue en affichant ce texte. L'autre option, lever une erreur ou renvoyer `undefined`, produirait des échecs plus déroutants, voire aucun.
- **La réponse est une vraie `Response`.** `new Response(JSON.stringify(…), { status, headers })` est la classe standard qu'utilise aussi le navigateur, et Node 24 l'inclut. Ainsi, `cargarReporte` lit `respuesta.ok`, `respuesta.status` et `respuesta.json()` exactement comme en production.
- **`vi.fn` enregistre chaque appel.** Le faux n'est pas une fonction quelconque : `vi.fn` l'enveloppe et conserve les arguments de chaque appel dans `mock.calls`, un tableau qui contient les arguments de chaque appel, un par élément ([Vitest, `mock`](https://vitest.dev/api/mock.html)). C'est pourquoi `instalarFetchFalso` renvoie le faux : les tests peuvent demander s'il a été appelé, combien de fois et avec quel corps.
- **`vi.stubGlobal("fetch", falso)`** l'installe comme `fetch` global, et `preparar.ts` le retire à la fin du test.

`nuncaResponde` est la fonction la plus courte du cours : une promesse qui ne se résout jamais. Avec elle, l'API « réfléchit » sans fin, et l'écran reste dans son état de chargement aussi longtemps que le test en a besoin pour l'examiner.

Les données d'exemple vivent à part, pour que tous les tests utilisent les mêmes :

```ts
// revisor/src/pruebas/datos.ts
import type { DetalleServicio, ReportePublico } from "../compartido/contrato";

export const reporteDeEjemplo: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

export const detallePagos: DetalleServicio = {
  nombre: "pagos",
  estado: { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
  revisiones: 3,
  ultimaRevision: "2026-10-21T08:00:00.000Z",
};
```

Ce sont les quatre services avec lesquels démarre l'API d'entraînement, avec les mêmes états, et le détail de `pagos`. Qu'ils coïncident n'est pas un hasard : ainsi, un test peut être comparé à ce que tu vois dans le navigateur avec `npm run dev`. Et ils sont typés comme `ReportePublico` et `DetalleServicio` : si les types de l'API changent (`src/compartido/contrato.ts`), `tsc -b` signale les données de test avant qu'un test ne passe par accident avec des données obsolètes.

#### 8.3.2 Monter l'application à une adresse

```tsx
// revisor/src/pruebas/montar.tsx
import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Proveedores } from "../app/Proveedores";
import { rutas } from "../app/rutas";

// Monta la aplicación completa en una dirección, con un enrutador en memoria y una
// caché nueva en cada prueba, sin reintentos para que un error se vea de inmediato.
export function montarEn(direccion: string) {
  const clienteConsultas = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const enrutador = createMemoryRouter(rutas, { initialEntries: [direccion] });
  const usuario = userEvent.setup();

  render(
    <Proveedores clienteConsultas={clienteConsultas}>
      <RouterProvider router={enrutador} />
    </Proveedores>,
  );

  return { enrutador, usuario };
}
```

`montarEn` est la pièce qui permet à chaque test d'écran de tenir en cinq lignes, et chacune de ses lignes a sa raison d'être.

**Un `QueryClient` neuf pour chaque test.** Le cache de TanStack Query conserve ce qui est arrivé de l'API. Si deux tests partageaient un client, le second verrait le rapport du premier avant d'avoir rien demandé, et l'état de chargement n'existerait pas. Un client par test, c'est un cache vide par test. Et il a `retry: false` pour les requêtes et les mutations : dans l'application, `crearClienteConsultas` demande `retry: 2`, et la leçon 4 a mesuré les trois requêtes réseau que cela produit quand l'API est en panne. Dans un test, ces nouvelles tentatives ne font que retarder l'erreur avec des attentes croissantes ; avec `retry: false`, une réponse 503 devient immédiatement l'état d'erreur.

**`createMemoryRouter(rutas, { initialEntries: [direccion] })`.** L'application utilise `createBrowserRouter`, qui conserve son historique dans la barre d'adresse de la fenêtre. Dans jsdom, cette barre existe (l'API `history` fonctionne), mais il n'y en a **qu'une seule** pour tous les tests du fichier : l'adresse laissée par un test serait le point de départ du suivant. `createMemoryRouter` crée un routeur qui conserve son historique en mémoire, un par test, et sa documentation le décrit comme utile pour les environnements qui ne sont pas un navigateur ([React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter)). `initialEntries` sont les entrées initiales de cet historique : le test dit « commence sur `/servicios/nuevo` » et l'application démarre là. Ce qui compte, c'est **quelles** routes il reçoit : le même tableau `rutas` que celui qu'utilise `main.tsx`. C'est la raison pour laquelle la leçon 5 l'a écrit sous forme de tableau exporté et non de JSX à l'intérieur de `main.tsx`. Les tests ne testent pas une copie des routes ; ils testent les routes.

**`<Proveedores clienteConsultas={…}>`.** Le même composant que monte `main.tsx`, avec le cache, les préférences et la boîte d'avis. La leçon 6 l'a sorti dans son propre fichier pour cela, et la leçon 4 a expliqué l'erreur que donne un `useQuery` sans son fournisseur : si le test montait les pages sans `Proveedores`, elles échoueraient pour la mauvaise raison.

**Ce qu'il renvoie.** `{ enrutador, usuario }`. L'`usuario` sert à agir ; l'`enrutador`, à demander où en est restée l'application (`enrutador.state.location.search`) ou à naviguer depuis l'extérieur, comme dans l'exercice 3. Ce qu'il ne renvoie **pas**, ce sont les requêtes de `render` : les tests utilisent `screen`, qui interroge tout le `document.body`. La différence compte peu ici et un peu plus à l'avenir : si demain un composant rend quelque chose avec un portail hors de son conteneur, `screen` le trouve toujours.

Remarque ce que `montarEn` ne monte **pas** : ni `StrictMode` ni `LimiteDeError`, qui se trouvent dans `main.tsx` autour de tout le reste. Les tests montent ce qui est à l'intérieur. `StrictMode` reste dehors volontairement : en développement, il monte, démonte et remonte chaque composant (leçon 3), si bien que le premier appel réseau de chaque requête serait annulé puis répété, et compter les appels à `fetch` deviendrait ambigu. Si un jour tu veux ce double passage dans un test, React Testing Library le propose avec `configure({ reactStrictMode: true })` ou avec l'option `reactStrictMode` de `render`. Le périmètre d'erreur des routes, lui, est bien présent, car il vient à l'intérieur de `rutas`, et il a son test en 8.3.4.

#### 8.3.3 Les états du rapport

Avec `instalarFetchFalso` et `montarEn`, les états du rapport donnent sept tests presque identiques, qui ne diffèrent que par ce que renvoie l'API et par ce qu'on s'attend à voir :

```tsx
// revisor/src/reporte/PaginaReporte.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { reporteDeEjemplo } from "../pruebas/datos";
import { instalarFetchFalso, nuncaResponde } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página del reporte", () => {
  test("cargando: anuncia la carga mientras la API no responde", async () => {
    instalarFetchFalso({ "GET /api/estados": nuncaResponde });
    montarEn("/");
    const cargando = await screen.findByText("Cargando…");
    expect(cargando.getAttribute("role")).toBe("status");
  });

  test("error: muestra el motivo y un botón para reintentar", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 503, cuerpo: { detalle: "caída" } } });
    montarEn("/");
    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("la API respondió 503");
    expect(within(alerta).getByRole("button", { name: "Reintentar" })).toBeDefined();
  });

  test("vacío: lo dice en lugar de dejar la lista en blanco", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: { estados: [] } } });
    montarEn("/");
    expect(await screen.findByText("No hay servicios configurados todavía.")).toBeDefined();
    expect(screen.queryByRole("list")).toBeNull();
  });

  test("con datos: un enlace por servicio y el resumen de fallas", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual([
      "catálogo",
      "pagos",
      "inventario",
      "reportes",
    ]);
    expect(screen.getByText(/2 servicios con falla/)).toBeDefined();
  });

  test("sin fallas no pinta un 0 suelto en el resumen", async () => {
    const sinFallas = { estados: reporteDeEjemplo.estados.filter((estado) => estado.tipo === "disponible") };
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: sinFallas } });
    montarEn("/");
    const resumen = await screen.findByText(/servicios revisados/);
    expect(resumen.textContent).toBe("2 servicios revisados");
  });

  test("el filtro «solo fallas» viaja en la dirección", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    const { enrutador, usuario } = montarEn("/");
    await screen.findByRole("list");
    await usuario.click(screen.getByRole("checkbox", { name: "Solo fallas" }));
    expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(2);
    expect(enrutador.state.location.search).toBe("?fallas=1");
  });

  test("una dirección con el filtro ya puesto abre filtrada", async () => {
    instalarFetchFalso({ "GET /api/estados": { status: 200, cuerpo: reporteDeEjemplo } });
    montarEn("/?q=inv");
    const lista = await screen.findByRole("list");
    expect(within(lista).getAllByRole("link").map((enlace) => enlace.textContent)).toEqual(["inventario"]);
  });
});
```

Parcours-les dans l'ordre, car ensemble ils forment le tableau des états que la leçon 4 avait promis.

**Chargement.** L'API ne répond jamais, si bien que l'écran reste sur `isPending`. Le test cherche « Cargando… » par son texte et vérifie que son `role` est `status`, pour la raison vue dans la figure 1 : il y a deux zones d'état et `findByRole("status")` tout court échouerait. Ce qu'il protège : que le chargement soit **annoncé**. Si quelqu'un remplaçait le `<p role="status">` par un simple `<p>`, le test passerait au rouge même si le texte restait à l'écran.

**Erreur.** L'API renvoie 503. Le test cherche l'alerte, vérifie que le message contient `la API respondió 503` (c'est `cargarReporte` qui l'écrit) et qu'il y a **à l'intérieur de l'alerte** un bouton « Reintentar ». `within(alerta)` restreint la requête à cet élément : le bouton doit se trouver à côté du message, pas n'importe où sur la page. Grâce à `retry: false`, l'erreur apparaît dès la première tentative.

**Vide.** L'API renvoie `{ "estados": [] }`. Le test attend le texte « No hay servicios configurados todavía. » et affirme avec `queryByRole("list")` qu'il n'y a **pas** de liste. Ce second `expect` est celui qui distingue « vide » d'« une liste sans éléments » : un `<ul>` vide ne dit rien à personne.

**Avec données.** Les quatre services. Le test prend la liste, puis tous les liens qu'elle contient, et compare leurs textes **dans l'ordre**. Il cherche ensuite le résumé avec une expression régulière, `/2 servicios con falla/`. C'est nécessaire, car le texte du `<strong>` n'est pas « 2 servicios con falla » mais « · 2 servicios con falla », précédé du séparateur (`ResumenFallas.tsx`, ligne 10), et `getByText` avec un texte fixe exige que le texte de l'élément corresponde en entier. L'expression régulière ne cherche que le morceau qui compte.

**Sans pannes, pas de 0 isolé.** Le test dont la scène avait besoin. L'API ne renvoie que les deux services disponibles, et le test compare le `textContent` complet du résumé avec `"2 servicios revisados"`, exactement, avec `toBe`. Si quoi que ce soit d'autre apparaissait dans ce texte, un `0`, un espace, un point, la comparaison échouerait. C'est le cas que l'API d'entraînement n'a pas et que personne ne vérifierait manuellement. En 8.4, tu le vois échouer.

**Le filtre voyage dans l'adresse.** Ici, le test agit : il attend la liste, clique sur la case « Solo fallas » (trouvée par son rôle, `checkbox`, et son nom) et vérifie deux choses. Que la liste ait maintenant deux liens, et que l'adresse du routeur se termine par `?fallas=1`. La seconde est la promesse de la leçon 5 : le filtre est un état de l'URL, si bien que si quelqu'un le déplaçait dans un `useState`, la liste se filtrerait quand même, la première assertion passerait et la seconde non.

**Une adresse avec le filtre déjà appliqué s'ouvre filtrée.** L'autre moitié de la même promesse : monter sur `/?q=inv` et ne voir que `inventario`. C'est ce qui se passe quand quelqu'un colle un lien partagé.

Il manque deux états du tableau, et je le dis pour que tu ne les cherches pas. Celui « avec données et erreur » du **rapport** (la mise à jour a échoué, mais le dernier rapport reste affiché) n'a pas de test dans le point de contrôle ; celui du **détail** en a un, et c'est le troisième test de 8.3.4. Celui des « données anciennes pendant la mise à jour », le `· actualizando…` à côté de l'heure, non plus : il dépend d'une seconde requête réseau en cours. Ces deux tests, c'est toi qui les écris dans l'exercice 4, et sans eux le troisième point de « Comment savoir que tu as terminé » du cours n'est pas rempli.

#### 8.3.4 Les routes, avec un routeur en mémoire

Deux fichiers testent la navigation. Celui du détail :

```tsx
// revisor/src/detalle/PaginaServicio.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { detallePagos } from "../pruebas/datos";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("la página de un servicio", () => {
  test("muestra el detalle del servicio de la dirección", async () => {
    instalarFetchFalso({ "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos } });
    montarEn("/servicios/pagos");
    expect(await screen.findByText("En falla: HTTP 503")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Servicio pagos" })).toBeDefined();
  });

  test("volver a revisar deja un aviso en la bandeja", async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    await usuario.click(await screen.findByRole("button", { name: "Volver a revisar" }));
    expect(await screen.findByText("pagos se volvió a revisar: disponible")).toBeDefined();
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "POST")).toBe(true);
  });

  test("si la actualización del detalle falla, conserva el detalle y la nota que se escribía", async () => {
    // El primer GET responde bien; los siguientes, 503. El clic en «Volver a revisar»
    // invalida el detalle, y esa segunda petición es la que falla.
    const detalles: RespuestaFalsa[] = [{ status: 200, cuerpo: detallePagos }];
    instalarFetchFalso({
      "GET /api/servicios/pagos": async () => detalles.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
      "POST /api/servicios/pagos/reintento": {
        status: 200,
        cuerpo: { nombre: "pagos", tipo: "disponible", codigoHttp: 200, duracionMs: 95 },
      },
    });
    const { usuario } = montarEn("/servicios/pagos");
    const nota = await screen.findByLabelText("Nota sobre pagos");
    await usuario.type(nota, "revisar con infraestructura");
    await usuario.click(screen.getByRole("button", { name: "Volver a revisar" }));

    expect(await screen.findByText(/Mostrando el último detalle que llegó/)).toBeDefined();
    expect(screen.getByText("En falla: HTTP 503")).toBeDefined();
    expect((screen.getByLabelText("Nota sobre pagos") as HTMLTextAreaElement).value).toBe("revisar con infraestructura");
  });
});
```

Le premier test monte directement sur `/servicios/pagos` et attend l'état du service et le titre « Servicio pagos ». Il vérifie d'un seul coup trois choses que personne ne vérifierait ensemble : que la route `servicios/:nombre` mène à `PaginaServicio`, que `useParams` fournisse `pagos`, et que la requête demande `GET /api/servicios/pagos`. Si la route demandait une autre adresse, le faux renverrait 404 et le texte attendu n'apparaîtrait jamais.

Le second clique sur « Volver a revisar » et attend l'avis dans la boîte, ce que la leçon 6 a raccordé avec `useReintentar`. Sa dernière ligne vérifie que l'un des appels à `fetch` a été un `POST` : elle parcourt `fetchFalso.mock.calls` et demande la méthode de chacun.

Le troisième test existe à cause d'un défaut qu'une relecture externe a trouvé et qu'aucun des deux autres ne pouvait voir. Tant que la première requête du détail répond bien et que les suivantes répondent `503` (une fonction dans la table du faux tient le compte, comme dans l'exercice 4), le test écrit un brouillon dans « Nota sobre pagos », clique sur « Volver a revisar » et attend l'avertissement « Mostrando el último detalle que llegó ». Le clic invalide le détail, la seconde requête échoue et l'état de la requête passe à `error` avec les données précédentes encore dans le cache. Le test vérifie trois choses : l'avertissement, l'état « En falla: HTTP 503 » qui reste visible et le brouillon de la note intact. Cette dernière importe autant que l'avertissement : avec la version précédente de la page, qui n'affichait le détail que si `consulta.isSuccess`, l'éditeur de la note était démonté avec l'erreur et le brouillon était perdu.

Un nouveau test ne vaut rien tant qu'on ne l'a pas vu rouge. Avec la page précédente (la condition `consulta.isSuccess` et un seul avertissement d'erreur), la suite donne `1 failed | 26 passed (27)`, et le fichier, ceci :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
20c20
<       {consulta.isError && consulta.data === undefined && (
---
>       {consulta.isError && (
23,28c23
<       {consulta.isError && consulta.data !== undefined && (
<         <p role="alert" className="viejo">
<           Mostrando el último detalle que llegó: la actualización falló ({consulta.error.message}).
<         </p>
<       )}
<       {consulta.data !== undefined && (
---
>       {consulta.isSuccess && (
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/PaginaServicio.test.tsx (3 tests | 1 failed)
   ❯ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección
     ✓ volver a revisar deja un aviso en la bandeja
     × si la actualización del detalle falla, conserva el detalle y la nota que se escribía

 FAIL  src/detalle/PaginaServicio.test.tsx > la página de un servicio > si la actualización del detalle falla, conserva el detalle y la nota que se escribía
TestingLibraryElementError: Unable to find an element with the text: /Mostrando el último detalle que llegó/.
[… el DOM que había: solo «No se pudo cargar el detalle: la API respondió 503», sin detalle ni editor …]

 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
```

Avec le point de contrôle, le même test passe et la suite complète donne `27 passed (27)` :

```bash
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/PaginaServicio.test.tsx (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Les sorties complètes se trouvent dans `programas/08-pruebas-de-componentes/ejercicios/` (`detalle-viejo-con-isSuccess.salida.txt` et `detalle-viejo-punto-de-control.salida.txt`, avec le `diff` dans `detalle-viejo-con-isSuccess.diff.txt`).

Et celui des routes en général :

```tsx
// revisor/src/app/rutas.test.tsx
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";
import { Proveedores } from "./Proveedores";
import { rutas } from "./rutas";

function PaginaRota(): never {
  throw new Error("la página se rompió al dibujar");
}

describe("las rutas", () => {
  test("una dirección desconocida muestra la página de no encontrada", async () => {
    instalarFetchFalso({});
    montarEn("/no-existe");
    expect(await screen.findByRole("heading", { name: "Página no encontrada" })).toBeDefined();
    expect(screen.getByText("No existe ninguna página en /no-existe.")).toBeDefined();
  });

  test("el menú marca la página actual", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");
    const actual = await screen.findByRole("link", { name: "Dar de alta" });
    expect(actual.getAttribute("aria-current")).toBe("page");
  });

  test("una página que se rompe al dibujar muestra el aviso del revisor", async () => {
    // React y React Router anuncian el error en la consola; aquí se espera, así que se calla.
    const consola = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => consola.mockRestore());

    // La ruta raíz del revisor, con su límite de error, y una sola página: una que lanza.
    const enrutador = createMemoryRouter([
      { ...rutas[0], index: false, children: [{ index: true, Component: PaginaRota }] },
    ]);
    render(
      <Proveedores clienteConsultas={new QueryClient()}>
        <RouterProvider router={enrutador} />
      </Proveedores>,
    );

    const aviso = await screen.findByRole("alert");
    expect(aviso.querySelector("h2")?.textContent).toBe("Algo salió mal al dibujar el panel");
    expect(aviso.querySelector("p")?.textContent).toBe("la página se rompió al dibujar");
    expect(screen.queryByText("Unexpected Application Error!")).toBeNull();
  });
});
```

**L'adresse inconnue** : ce test monte sur `/no-existe` et attend le titre et le texte de `PaginaNoEncontrada`, adresse comprise. Il vérifie que la route générique `*` existe et qu'elle se trouve à la fin.

**Le menu marque la page actuelle** : ce test monte sur `/servicios/nuevo` et vérifie que le lien « Dar de alta » a `aria-current="page"`. Cet attribut est posé par `NavLink` sur le lien actif (leçon 5), et c'est ce qu'un lecteur d'écran annonce comme « page actuelle ». Le test ne regarde pas la classe `active`, qui ne sert qu'à l'apparence : il regarde l'attribut qui parvient à la technologie d'assistance.

**Une page qui plante au rendu affiche l'avis du revisor** : ce test est différent des autres, et il vaut la peine de le lire lentement. Il n'utilise pas `montarEn`, car il a besoin d'une route qui n'existe pas dans l'application : une page qui lève une erreur pendant son rendu. Il construit son propre routeur avec **la vraie route racine** du `revisor`, `rutas[0]`, avec son `Component: Disposicion` et son `ErrorBoundary: ErrorDeRuta`, mais remplace ses enfants par un seul, `PaginaRota`. Le `index: false` est là pour TypeScript : dans le type `RouteObject`, une route index ne peut pas avoir d'enfants, et en l'écrivant explicitement, la copie se range du côté des routes qui en admettent. Il vérifie ensuite que l'alerte apparaît avec le titre et le message d'`AvisoDeError`, et que n'apparaît **pas** le « Unexpected Application Error! » que rend React Router quand une route n'a pas de périmètre d'erreur propre (leçon 5).

Les deux premières lignes de ce test font taire la console. Quand un composant lève une erreur, React et React Router annoncent l'erreur avec `console.error`, même si un périmètre d'erreur l'intercepte : c'est une information pour qui développe. Ici, cette erreur est **le scénario** du test, pas un problème, et la laisser sortir remplirait la sortie de traces de pile qui ressemblent à des échecs. `vi.spyOn(console, "error")` enveloppe la méthode et `.mockImplementation(() => undefined)` la rend sans effet ; `onTestFinished(() => consola.mockRestore())` la restaure à la fin. `mockRestore` rend la méthode d'origine d'un objet espionné avec `vi.spyOn`, et `onTestFinished` est toujours appelé après que le test a fini de s'exécuter, après les `afterEach` ([Vitest, « Hooks »](https://vitest.dev/api/hooks.html)). On l'utilise au lieu d'un `consola.mockRestore()` à la fin du corps pour une raison : si le test échoue en cours de route, la fin du corps ne s'exécute jamais, et la console resterait muette pour les tests suivants. Il ne fait taire que ce que ce test provoque, et seulement pendant sa durée.

#### 8.3.5 Le formulaire

L'enregistrement de la leçon 7 a la suite la plus longue, car c'est l'écran qui a le plus de comportement : valider, envoyer, annoncer, ne pas perdre le focus, ne pas envoyer deux fois, traduire le 409.

```tsx
// revisor/src/alta/FormularioAlta.test.tsx
import { screen, within } from "@testing-library/react";
import { describe, expect, onTestFinished, test } from "vitest";
import { instalarFetchFalso, type RespuestaFalsa } from "../pruebas/fetchFalso";
import { montarEn } from "../pruebas/montar";

describe("el formulario de alta", () => {
  test("sin datos marca los tres campos y lo anuncia", async () => {
    const fetchFalso = instalarFetchFalso({});
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.click(await screen.findByRole("button", { name: "Dar de alta" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Revisa los campos marcados.");
    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      expect(screen.getByLabelText(etiqueta).getAttribute("aria-invalid")).toBe("true");
    }
    expect(screen.getByLabelText("Nombre").getAttribute("aria-describedby")).toBe(
      "nombre-error nombre-ayuda",
    );
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  test("con datos válidos envía el alta y confirma", async () => {
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": {
        status: 201,
        cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    // El éxito se anuncia una sola vez: en la bandeja de avisos, no también en el formulario.
    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(screen.queryByText("Se dio de alta correo.")).toBeNull();
    const [, opciones] = fetchFalso.mock.calls[0] ?? [];
    expect(JSON.parse(String(opciones?.body))).toEqual({
      nombre: "correo",
      url: "https://correo.example/",
      timeoutMs: 1500,
    });
  });

  test("declara los obligatorios y la bandeja anuncia solo el aviso nuevo", async () => {
    instalarFetchFalso({});
    montarEn("/servicios/nuevo");

    for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)"]) {
      const campo = (await screen.findByLabelText(etiqueta)) as HTMLInputElement;
      expect(campo.required).toBe(true);
    }
    const bandeja = screen.getByRole("region", { name: "Avisos" });
    expect(within(bandeja).getByRole("status").getAttribute("aria-atomic")).toBe("false");
  });

  test("el foco no se pierde al enviar y un segundo envío se ignora", async () => {
    // La respuesta se entrega a mano. Una acción que nunca terminara dejaría pendiente
    // la Transition y enredaría las acciones de las pruebas siguientes: por eso, aunque
    // esta prueba falle a la mitad, al terminar se responde lo que quede pendiente.
    const creado: RespuestaFalsa = {
      status: 201,
      cuerpo: { nombre: "correo", tipo: "disponible", codigoHttp: 200, duracionMs: 75 },
    };
    let responder: (respuesta: RespuestaFalsa) => void = () => {};
    const fetchFalso = instalarFetchFalso({
      "POST /api/servicios": () => new Promise<RespuestaFalsa>((listo) => (responder = listo)),
    });
    onTestFinished(() => responder(creado));
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "correo");
    await usuario.type(screen.getByLabelText("Dirección"), "https://correo.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Dar de alta" }));

    await usuario.keyboard(" ");
    const pendiente = await screen.findByRole("button", { name: "Dando de alta…" });
    // jsdom no saca el foco de un botón desactivado (Chrome sí: lo manda al body), así
    // que se comprueba la causa: el botón sigue habilitado y anuncia que no está disponible.
    expect(pendiente.hasAttribute("disabled")).toBe(false);
    expect(pendiente.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(pendiente);

    // Un segundo Espacio mientras está pendiente. Si no se ignorara, React lo pondría en
    // cola y lo enviaría en cuanto terminara el primero: por eso se cuenta al final.
    await usuario.keyboard(" ");
    responder(creado);

    expect(await screen.findByRole("button", { name: "Descartar: Se dio de alta correo" })).toBeDefined();
    expect(document.activeElement).toBe(await screen.findByRole("button", { name: "Dar de alta" }));
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("un nombre repetido se marca en su campo con el mensaje de la API", async () => {
    instalarFetchFalso({
      "POST /api/servicios": {
        status: 409,
        cuerpo: { detalle: "ya existe un servicio llamado pagos", campos: { nombre: "ese nombre ya existe" } },
      },
    });
    const { usuario } = montarEn("/servicios/nuevo");
    await usuario.type(await screen.findByLabelText("Nombre"), "pagos");
    await usuario.type(screen.getByLabelText("Dirección"), "https://pagos.example");
    await usuario.type(screen.getByLabelText("Tiempo límite (ms)"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(await screen.findByText("ese nombre ya existe")).toBeDefined();
    expect(screen.getByLabelText("Nombre").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Dirección").getAttribute("aria-invalid")).toBe("false");
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("pagos");
  });
});
```

**Sans données, il marque les trois champs et l'annonce.** L'API n'a aucune route déclarée (`instalarFetchFalso({})`), si bien que toute requête obtiendrait un 404. Le test clique sur « Dar de alta » avec le formulaire vide et vérifie quatre choses : le texte de l'alerte, `aria-invalid="true"` sur les trois champs (trouvés par leur étiquette, dans un `for`), l'`aria-describedby` du nom avec l'erreur **avant** l'aide (l'ordre dans lequel le lecteur les lit, leçon 7), et que `fetch` n'a jamais été appelé. C'est cette dernière vérification qui démontre que la validation a lieu dans le navigateur : si le formulaire envoyait la requête et attendait que l'API se plaigne, le test verrait toujours des erreurs (la fausse API renverrait 404), mais `not.toHaveBeenCalled()` passerait au rouge.

**Avec des données valides, il envoie l'enregistrement et confirme.** L'API renvoie 201. Le test saisit les trois champs, clique et attend le bouton « Descartar: Se dio de alta correo », qui n'existe que lorsqu'il y a un avis dans la boîte. Il affirme ensuite que le texte « Se dio de alta correo. » avec un point, celui qu'aurait un formulaire doté de sa propre zone de succès (la version à deux `status` que la leçon 7 a écartée en 7.3.3), n'est **pas** là : le succès est annoncé à un seul endroit. Enfin, il lit le corps du premier appel à `fetch` : `fetchFalso.mock.calls[0]` est le tableau d'arguments `[entrada, opciones]`, et la déstructuration `const [, opciones]` saute le premier. Le corps est du JSON, il est donc converti avec `JSON.parse` et comparé avec `toEqual`. Regarde l'URL : la personne a saisi `https://correo.example` et c'est `https://correo.example/` qui a voyagé, avec la barre oblique finale qu'ajoute le schéma. Le test documente cette normalisation.

**Il déclare les champs obligatoires et la boîte d'avis n'annonce que le nouvel avis.** Deux des correctifs de la leçon 7, dans un seul test. `campo.required` est la propriété du DOM qui reflète l'attribut `required` ; le `as HTMLInputElement` dit à TypeScript que ce qu'on a trouvé par étiquette est un `<input>`, car `findByLabelText` ne promet qu'un `HTMLElement`. Et la boîte d'avis se trouve par son rôle de région et son nom, « Avisos », et à l'intérieur, le `status`, pour lire son `aria-atomic`. C'est un test d'attributs, pas de comportement : jsdom n'a pas de lecteur d'écran, si bien que le plus près qu'il puisse aller, c'est de vérifier que l'attribut dont le lecteur a besoin est bien posé.

**Le focus ne se perd pas à l'envoi et un second envoi est ignoré.** Le test le plus soigné de la suite, et celui dont la scène avait besoin pour le bouton. Il procède par étapes.

1. *La réponse est livrée manuellement.* La route `POST /api/servicios` est une fonction qui renvoie une promesse et range son `listo` dans la variable `responder`. Tant que personne n'appelle `responder`, l'enregistrement est en attente, et le test peut examiner le formulaire dans cet état aussi longtemps qu'il le veut. C'est la version contrôlable de `nuncaResponde`.
2. *`onTestFinished(() => responder(creado))`.* Si le test échouait en cours de route, l'enregistrement resterait en attente pour toujours, et avec lui la *Transition* de React qui l'enveloppe (leçon 7). Le commentaire du fichier dit ce qui se passerait : cette action inachevée embrouillerait les actions des tests suivants. C'est pourquoi, quoi qu'il arrive, à la fin, on répond à ce qui reste en attente.
3. *Atteindre le bouton comme le ferait Raúl.* Il saisit les trois champs et appuie sur Tab : le focus passe du dernier champ au bouton. Le test le vérifie avec `document.activeElement`, l'élément qui a le focus.
4. *Envoyer avec Espace.* `usuario.keyboard(" ")` sur le bouton qui a le focus. Le test attend le bouton « Dando de alta… », qui n'existe que tant que `useFormStatus` indique `pending`.
5. *Vérifier la cause, pas l'effet.* C'est ici qu'est prise la décision la plus importante, et le commentaire la formule : jsdom ne retire pas le focus d'un bouton désactivé ; Chrome, si. Si le test ne vérifiait que `document.activeElement`, il passerait aussi avec `disabled={pending}`, car dans jsdom le focus reste où il était, alors que dans le navigateur il part sur le `body`. C'est pourquoi il vérifie d'abord ce qui **fait** que le focus est conservé : que le bouton n'a **pas** l'attribut `disabled` et qu'il a **bien** `aria-disabled="true"`. L'`activeElement` est vérifié aussi, mais c'est l'assertion faible ; la forte, c'est la précédente. La section 8.5 mesure cette différence entre jsdom et Chrome.
6. *Le second Espace.* Alors que l'enregistrement est toujours en attente, un autre `usuario.keyboard(" ")`. Si la garde de `BotonEnviar` n'annulait pas le clic, React mettrait ce second envoi en file d'attente.
7. *Répondre et compter.* `responder(creado)` termine l'enregistrement. Le test attend l'avis de la boîte, vérifie que le focus est sur le bouton, qui affiche de nouveau « Dar de alta », et que `fetch` a été appelé **une** fois.

**Un nom en double est signalé sur son champ avec le message de l'API.** L'API renvoie 409 avec `campos.nombre`. Le test attend le texte de l'erreur (« ese nombre ya existe », qui vient de l'API et non du schéma), vérifie que seul « Nombre » est invalide et que « Dirección » reste à `false`, et que le champ conserve ce qui a été saisi. Cette dernière ligne protège le `defaultValue` alimenté par l'état, introduit dans la leçon 7 : si `Campo` recevait une valeur fixe, React viderait le champ après l'action, et la personne devrait tout ressaisir pour une seule erreur.

### 8.4 Le test qui passe au rouge quand on annule le correctif

#### 8.4.1 L'expérience

Un test vert répond à « le code respecte-t-il ceci ? ». Il ne répond pas à « ce test remarquerait-il que le correctif a disparu ? ». Pour la seconde question, il existe une expérience directe, et c'est elle qui donne son nom à cette section :

1. Copie le point de contrôle (ou travaille dans une branche que tu vas jeter).
2. Défais **uniquement** le correctif que le test dit protéger, dans un seul fichier.
3. Exécute uniquement le fichier de tests qui le couvre.
4. Lis le rouge : le test qui échoue est-il celui que tu attendais, pour la raison que tu attendais, avec un message qui explique le problème ?
5. Restaure et relance.

Si à l'étape 4 tout reste vert, le test ne protège pas ce correctif, aussi bien écrit qu'il paraisse. Ce n'est pas un échec de l'expérience : c'est justement ce que l'expérience sert à découvrir. Elle a été faite avec trois correctifs du cours, dont l'un défait de deux façons, et les quatre annulations sont passées au rouge. L'exercice 2 ajoute un quatrième correctif. Et dans l'exercice 3, tu écriras un test qui ne passe pas l'examen.

Exécuter un seul fichier, c'est `npx vitest run` suivi du chemin, ou d'un morceau de celui-ci : `npx vitest run src/alta` exécute tous les fichiers de test dont le chemin contient `src/alta`. C'est plus rapide et la sortie ne se mélange pas avec le reste.

#### 8.4.2 Le zéro isolé

Le correctif de la leçon 1 : dans `ResumenFallas.tsx`, la condition est `{fallas > 0 && …}`. Dans la copie, elle a été remplacée par la version « plus courte » de la scène :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ResumenFallas.tsx src/reporte/ResumenFallas.tsx
10c10
<       {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
---
>       {fallas && <strong> · {textoFallas(fallas)}</strong>}
$ npx vitest run src/reporte/PaginaReporte.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/PaginaReporte.test.tsx (7 tests | 1 failed) 256ms
   ❯ la página del reporte (7)
     ✓ cargando: anuncia la carga mientras la API no responde 36ms
     ✓ error: muestra el motivo y un botón para reintentar 58ms
     ✓ vacío: lo dice en lugar de dejar la lista en blanco 28ms
     ✓ con datos: un enlace por servicio y el resumen de fallas 25ms
     × sin fallas no pinta un 0 suelto en el resumen 16ms
     ✓ el filtro «solo fallas» viaja en la dirección 57ms
     ✓ una dirección con el filtro ya puesto abre filtrada 35ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/PaginaReporte.test.tsx > la página del reporte > sin fallas no pinta un 0 suelto en el resumen
AssertionError: expected '2 servicios revisados0' to be '2 servicios revisados' // Object.is equality

Expected: "2 servicios revisados"
Received: "2 servicios revisados0"

 ❯ src/reporte/PaginaReporte.test.tsx:48:33
     46|     montarEn("/");
     47|     const resumen = await screen.findByText(/servicios revisados/);
     48|     expect(resumen.textContent).toBe("2 servicios revisados");
       |                                 ^
     49|   });
     50|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 6 passed (7)
   Start at  04:04:54
   Duration  1.13s (environment 53%, tests 25%, transform 8%, import 7%, setup 6%)
```

Un test au rouge sur sept, celui qui devait l'être. Lis le message de bas en haut, c'est ainsi qu'on lit le mieux un échec. Le résumé : `Tests  1 failed | 6 passed (7)`. Le nom : « sin fallas no pinta un 0 suelto en el resumen » (*sans pannes, le résumé n'affiche pas de zéro isolé*), qui te dit déjà ce qui s'est passé. La comparaison : `Expected: "2 servicios revisados"` face à `Received: "2 servicios revisados0"`. Et l'endroit : la ligne 48 du fichier de tests, avec une flèche sous `toBe`.

Le `0` collé à la fin est l'erreur de la leçon 1, vue depuis un test : quand `fallas` vaut `0`, l'expression `0 && <strong>…</strong>` vaut `0`, et React rend les nombres (il ne rend ni `false`, ni `null`, ni `undefined`, mais il rend `0`). Les six autres tests restent verts, et c'est aussi une information : en particulier, le test « avec données » reste vert, car avec deux pannes, `fallas && …` se comporte exactement comme `fallas > 0 && …`. **Un seul test de ce fichier distingue le correctif de l'erreur**, et c'est celui qui a des données sans pannes. S'il n'existait pas, la suite dirait « tout va bien » avec l'erreur de la scène à l'intérieur.

Une fois le fichier restauré, le fichier de tests revient à `7 passed (7)`, et la suite complète, à 27 sur 27.

#### 8.4.3 Le bouton qui emporte le focus

Le correctif de la leçon 7 : `BotonEnviar` porte `aria-disabled={pending}` et annule le clic tant que l'envoi est en attente, au lieu de `disabled={pending}`. Il y a **deux** façons de le défaire, et le test doit remarquer les deux.

La première est celle de la scène : revenir à `disabled`.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" disabled={pending} onClick={alPulsar}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 362ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 75ms
     ✓ con datos válidos envía el alta y confirma 96ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 94ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ src/alta/FormularioAlta.test.tsx:82:48
     80|     // jsdom no saca el foco de un botón desactivado (Chrome sí: lo ma…
     81|     // que se comprueba la causa: el botón sigue habilitado y anuncia …
     82|     expect(pendiente.hasAttribute("disabled")).toBe(false);
       |                                                ^
     83|     expect(pendiente.getAttribute("aria-disabled")).toBe("true");
     84|     expect(document.activeElement).toBe(pendiente);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:26
   Duration  1.31s (environment 43%, tests 29%, import 11%, transform 10%, setup 6%)
```

Il échoue à la ligne 82, `expect(pendiente.hasAttribute("disabled")).toBe(false)`, avec `expected true to be false` : le bouton en attente a l'attribut `disabled`. Remarque **où** il échoue : dans la vérification de la cause, deux lignes avant celle du focus. Si le test n'avait pas cette ligne, il arriverait à `expect(document.activeElement).toBe(pendiente)`, et dans jsdom cela **passerait**, car jsdom laisse le focus sur le bouton même s'il est désactivé (8.5). Le test serait vert avec l'erreur que la leçon 7 a mesurée dans Chrome. Cette ligne existe parce que quelqu'un a fait cette expérience.

Remarque aussi ce qui sort **avant** le rouge : un avertissement dans `stderr`, « A suspended resource finished loading inside a test, but the event was not wrapped in act(...) ». C'est le cas que 8.2.1 avait annoncé, une mise à jour alors que plus personne n'attendait. Le test a échoué à la ligne 82, avant d'atteindre `responder(creado)` ; à la fin, `onTestFinished` a livré la réponse en attente, et l'action du formulaire s'est terminée en dehors de tout `act`. Le message parle d'une « ressource suspendue » (*suspended resource*), car c'est ainsi que React appelle la promesse qu'il attendait. Avec le point de contrôle, le test atteint `responder(creado)` à l'intérieur de son corps et l'avertissement n'apparaît pas. C'est la ligne d'`IS_REACT_ACT_ENVIRONMENT` dans `preparar.ts` qui rend cet avertissement visible : sans elle, le rouge sortirait quand même, mais en silence.

La seconde façon de le défaire est plus subtile : garder `aria-disabled`, qui fait bonne impression en revue de code, et retirer la garde qui annule le clic.

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/BotonEnviar.tsx src/alta/BotonEnviar.tsx
17c17
<     <button type="submit" aria-disabled={pending} onClick={alPulsar}>
---
>     <button type="submit" aria-disabled={pending}>
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

stderr | src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act
A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://react.dev/link/wrap-tests-with-act

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 1387ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 77ms
     ✓ con datos válidos envía el alta y confirma 97ms
     ✓ declara los obligatorios y la bandeja anuncia solo el aviso nuevo 9ms
     × el foco no se pierde al enviar y un segundo envío se ignora 1095ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 109ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora
TestingLibraryElementError: Unable to find role="button" and name "Descartar: Se dio de alta correo"

Ignored nodes: comments, script, style
<body>
[… recortado: 141 líneas del DOM (encabezado, bandeja y los tres campos) …]
          <button
            aria-disabled="true"
            type="submit"
          >
            Dando de alta…
          </button>
        </form>
        <div
          id="resultado-alta"
        >
          <div
            role="alert"
          />
        </div>
        <section
          aria-label="Altas de esta sesión"
        >
          <h3>
            Altas de esta sesión
          </h3>
          <ul>
            <li
              class="pendiente"
            >
              correo
               (agregando…)
            </li>
          </ul>
        </section>
      </section>
    </main>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 177 líneas …]
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/alta/FormularioAlta.test.tsx:91:25
     89|     responder(creado);
     90|
     91|     expect(await screen.findByRole("button", { name: "Descartar: Se di…
       |                         ^
     92|     expect(document.activeElement).toBe(await screen.findByRole("butto…
     93|     expect(fetchFalso).toHaveBeenCalledTimes(1);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:27
   Duration  1.79s (tests 80%, environment 14%, import 3%, setup 2%, transform 2%)
```

Cette fois, il échoue à la ligne 91 (et l'avertissement d'`act` ressort, deux fois, pour la même raison qu'avant), `findByRole("button", { name: "Descartar: Se dio de alta correo" })`, avec « Unable to find role="button" ». La vraie sortie affiche le DOM complet de la page, plus de cent lignes ; ci-dessus, on a gardé le début et la fin, et la coupure est signalée. C'est la fin qui compte : après `responder(creado)` et une seconde entière d'attente, le bouton affiche **toujours** « Dando de alta… » avec `aria-disabled="true"`, et « Altas de esta sesión » affiche toujours `correo (agregando…)`. Le second Espace n'a pas été ignoré : il a mis un second envoi en file d'attente. Ce second envoi a de nouveau appelé `fetch`, qui a rangé un nouveau `responder` que personne n'a appelé, et le formulaire est resté en attente. Voilà ce que l'on voit dans le DOM ; ce que l'on en déduit, et que la leçon 7 a expliqué, c'est que React regroupe les actions en cours, et l'avis de la première n'est pas confirmé à l'écran tant que la seconde n'est pas terminée. C'est pour la même raison que le test compte les appels à `fetch` **à la fin** : un second envoi en file d'attente ne se voit pas tant que le premier est en attente.

Dans la leçon 7, cette même erreur a été mesurée dans Chrome, avec le journal de l'API : un `201` suivi d'un `409`. Ici, le même test la détecte en moins de deux secondes, sans API et sans navigateur.

Les deux variantes donnent `Tests  1 failed | 4 passed (5)` dans `src/alta`. Une fois le fichier restauré, `5 passed (5)`.

#### 8.4.4 Le périmètre d'erreur des routes

Le correctif de la leçon 5 : `ErrorBoundary: ErrorDeRuta` sur la route racine. Dans la copie, cette ligne a été supprimée de `rutas.tsx` :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/app/rutas.tsx src/app/rutas.tsx
13d12
<     ErrorBoundary: ErrorDeRuta,
$ npx vitest run src/app
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/app/rutas.test.tsx (3 tests | 1 failed) 1089ms
   ❯ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 59ms
     ✓ el menú marca la página actual 8ms
     × una página que se rompe al dibujar muestra el aviso del revisor 1019ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/app/rutas.test.tsx > las rutas > una página que se rompe al dibujar muestra el aviso del revisor
TestingLibraryElementError: Unable to find role="alert"

Ignored nodes: comments, script, style
<body>
  <div>
    <h2>
      Unexpected Application Error!
    </h2>
    <h3
      style="font-style: italic;"
    >
      la página se rompió al dibujar
    </h3>
    <pre
      style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);"
    >
      Error: la página se rompió al dibujar
[… recortado: 10 renglones de la pila …]
    </pre>
    <p>
      💿 Hey developer 👋
    </p>
    <p>
      You can provide a way better UX than this when your app throws errors by providing your own
      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        ErrorBoundary
      </code>
       or

      <code
        style="padding: 2px 4px; background-color: rgba(200, 200, 200, 0.5);"
      >
        errorElement
      </code>
       prop on your route.
    </p>
  </div>
</body>
[… recortado: la salida imprime el mismo DOM otra vez, 48 líneas …]
 ❯ PaginaRota src/app/rutas.test.tsx:11:9
      9|
     10| function PaginaRota(): never {
     11|   throw new Error("la página se rompió al dibujar");
       |         ^
     12| }
     13|
 ❯ Object.react_stack_bottom_frame node_modules/react-dom/cjs/react-dom-client.development.js:28571:20
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom-client.development.js:8030:22
 ❯ updateFunctionComponent node_modules/react-dom/cjs/react-dom-client.development.js:10569:19
 ❯ beginWork node_modules/react-dom/cjs/react-dom-client.development.js:12205:18
 ❯ runWithFiberInDEV node_modules/react-dom/cjs/react-dom-client.development.js:1048:13
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom-client.development.js:19176:22
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom-client.development.js:19004:41
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom-client.development.js:18985:11
 ❯ waitForWrapper node_modules/@testing-library/dom/dist/wait-for.js:163:27
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:86:33
 ❯ src/app/rutas.test.tsx:44:32

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 2 passed (3)
   Start at  04:05:30
   Duration  2.20s (tests 56%, environment 36%, import 3%, transform 3%, setup 2%)
```

« Unable to find role="alert" », et en dessous, le DOM qui était bien là : le périmètre d'erreur par défaut de React Router, avec « Unexpected Application Error! », le message, la trace de pile (tronquée ci-dessus) et le paragraphe qui te suggère de placer ton propre `ErrorBoundary` ou `errorElement` sur la route. Ce paragraphe n'existe que dans la version de développement de React Router : Vitest ne s'exécute pas en mode production (`NODE_ENV` vaut `test`), si bien que Vite charge cette version, tout comme il charge celle de React (remarque `react-dom-client.development.js` dans la trace de pile). C'est l'écran que la leçon 5 a montré dans Chrome, désormais sous forme de texte dans la sortie d'un test. La vraie sortie affiche ce DOM deux fois ; la seconde copie a été retirée. `Tests  1 failed | 2 passed (3)`.

Les trois tests ont passé l'examen, quatre fois. Ce qu'ils ont en commun vaut plus que chacun d'eux : **chacun affirme exactement ce que le correctif a changé**. Le résumé est comparé en entier, pas avec un `toContain`. Le bouton est vérifié par son attribut, pas seulement par le focus. L'alerte est cherchée par son rôle, et l'on vérifie en outre que le texte du périmètre par défaut n'apparaît pas. Quand un test affirme quelque chose de plus faible que le correctif, l'erreur se glisse dans la brèche.

### 8.5 Ce que jsdom ne peut pas vérifier

#### 8.5.1 Un DOM sans rendu

jsdom implémente le DOM, les événements, les formulaires et la lecture des feuilles de style (il sait quelle règle s'applique à chaque élément, comme le montre le point 4 de la figure). Ce qu'il ne fait pas, c'est le **rendu**. Son README place deux choses hors de sa portée : la navigation (changer de page en suivant un lien ou en affectant `location.href`) et la mise en page (*layout*), qu'il définit comme la capacité de calculer où les éléments seront placés sous l'effet du CSS. Pour la mise en page, il y a des valeurs de substitution, et beaucoup de propriétés renvoient des zéros ([jsdom, README](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)).

Cela a une conséquence qui n'est pas évidente : certains comportements du navigateur dépendent du rendu même s'ils n'en ont pas l'air. Le focus en fait partie. La figure 3 pose quatre questions à jsdom, sans React, et une page HTML jumelle pose les mêmes quatre questions à Chrome :

```tsx
// fig08_03.tsx
import { JSDOM } from "jsdom";

// Sin React a propósito: lo que se mide aquí es el DOM de prueba, no la biblioteca.
// `pretendToBeVisual` le da a jsdom un requestAnimationFrame, para esperar dos cuadros
// como en fig08_03.html, la misma página para Chrome.
const dom = new JSDOM(`<!doctype html>
<style>
  button[aria-disabled="true"] { opacity: 0.6; cursor: not-allowed; }
  .oculto { display: none; }
</style>
<button type="submit" id="enviar">Dar de alta</button>
<button type="button" id="escondido" class="oculto">Escondido</button>`, { pretendToBeVisual: true });

const { document } = dom.window;
const enviar = document.getElementById("enviar") as HTMLButtonElement;
const escondido = document.getElementById("escondido") as HTMLButtonElement;

function quienTieneElFoco(): string {
  const activo = document.activeElement;
  return activo === null ? "nadie" : activo.id === "" ? activo.tagName.toLowerCase() : `#${activo.id}`;
}

console.log("1. el foco en un botón que se desactiva");
enviar.focus();
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);
enviar.disabled = true;
console.log(`   después de disabled = true: foco en ${quienTieneElFoco()}`);
await new Promise((listo) => dom.window.requestAnimationFrame(() => dom.window.requestAnimationFrame(listo)));
console.log(`   dos cuadros después: foco en ${quienTieneElFoco()}`);
enviar.disabled = false;
enviar.focus();

console.log("2. el foco en un elemento con display: none");
escondido.focus();
console.log(`   display calculado: ${dom.window.getComputedStyle(escondido).display}`);
console.log(`   después de focus(): foco en ${quienTieneElFoco()}`);

console.log("3. el diseño");
const caja = enviar.getBoundingClientRect();
console.log(`   getBoundingClientRect(): ${caja.width} × ${caja.height} en (${caja.x}, ${caja.y})`);
console.log(`   offsetWidth: ${enviar.offsetWidth}`);

console.log("4. la hoja de estilos");
enviar.setAttribute("aria-disabled", "true");
const estilo = dom.window.getComputedStyle(enviar);
console.log(`   opacity: ${estilo.opacity}, cursor: ${estilo.cursor}`);

dom.window.close();
```

```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig08_03.tsx
$ node fig08_03.js
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en #enviar
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 0 × 0 en (0, 0)
   offsetWidth: 0
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

Et la page jumelle, `fig08_03.html` (elle se trouve à côté de la figure, avec le même HTML et les mêmes étapes écrites en JavaScript de navigateur), ouverte dans Chrome en mode headless :

```bash
$ google-chrome --headless --disable-gpu --no-first-run \
    --user-data-dir="$PWD/perfil" --virtual-time-budget=3000 --dump-dom "file://$PWD/fig08_03.html"
1. el foco en un botón que se desactiva
   después de focus(): foco en #enviar
   después de disabled = true: foco en #enviar
   dos cuadros después: foco en body
2. el foco en un elemento con display: none
   display calculado: none
   después de focus(): foco en #enviar
3. el diseño
   getBoundingClientRect(): 81.21875 × 21 en (8, 8)
   offsetWidth: 81
4. la hoja de estilos
   opacity: 0.6, cursor: not-allowed
```

(Ce qui est affiché est le contenu du `<pre id="salida">` où la page écrit ses résultats ; `--dump-dom` affiche la page entière. Avec Chromium, l'exécutable s'appelle `chromium` ; sous macOS, où cette sortie a été mesurée, le chemin est `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. `--virtual-time-budget` laisse s'exécuter les minuteurs et les images d'animation avant d'afficher. Et `--user-data-dir` utilise un profil Chrome neuf dans le dossier `perfil/`, pour ne pas toucher au tien : supprime-le à la fin et ne le versionne pas.)

Compare point par point.

**1. Le focus sur un bouton qui se désactive.** Juste après `disabled = true`, **les deux** disent que le focus est toujours sur `#enviar`. Deux images d'animation plus tard, Chrome dit `body` et jsdom dit toujours `#enviar`. La spécification HTML explique la différence. Parmi les étapes de « mise à jour du rendu » (*update the rendering*), que le navigateur exécute lorsqu'il s'apprête à rendre une image, il y en a une qui dit : si la zone qui a le focus dans le document n'est plus une zone focalisable, on exécute les étapes de focalisation sur le *viewport* du document (en pratique, le focus tombe sur le `body`, ce que Chrome indique). Et elle prend précisément cet exemple : un contrôle auquel on ajoute `disabled` ([WHATWG, HTML, « Update the rendering »](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)). La spécification la qualifie de correction **asynchrone** : elle ne se produit pas quand on pose l'attribut, mais au rendu suivant. jsdom ne fait pas de rendu, si bien que cette correction n'arrive jamais, même si `pretendToBeVisual` lui fournit `requestAnimationFrame`. C'est la mesure de la leçon 7 (dans Chrome, pendant que l'enregistrement était en attente, le focus était déjà sur le `body`), expliquée à partir de la spécification et observée dans jsdom. Et c'est la raison d'être de la ligne 82 du test du formulaire.

Remarque un détail du premier point de la sortie de Chrome : même dans un vrai navigateur, une vérification **immédiate** aurait dit « le focus est toujours sur le bouton ». Un test qui regarderait le focus juste après avoir désactivé le bouton se tromperait des deux côtés.

**2. Le focus sur un élément en `display: none`.** Ici, jsdom a raison : les deux refusent le `focus()` et le focus reste où il était. jsdom applique bien la feuille de style pour savoir que l'élément n'est pas affiché. Mieux vaut le savoir pour ne pas reprocher à jsdom ce qu'il fait bel et bien.

**3. La mise en page.** Chrome mesure le bouton : 81,21875 par 21 pixels, à la position (8, 8), qui correspond à la marge par défaut du `body`. jsdom dit `0 × 0 en (0, 0)` et `offsetWidth: 0`. Aucun test qui dépend de tailles ou de positions (si quelque chose tient, si cela dépasse de l'écran, si deux éléments se chevauchent) ne peut se faire dans jsdom. jsdom n'échoue pas : il renvoie des zéros en toute tranquillité, ce qui est pire.

**4. La feuille de style.** Les deux calculent `opacity: 0.6` et `cursor: not-allowed` pour le bouton avec `aria-disabled="true"`, à partir de la règle de la feuille de style. jsdom résout la cascade CSS pour `getComputedStyle`. Ce qu'il ne peut pas te dire, c'est si ce gris se **voit**, ou s'il respecte le contraste que demande MDN pour un contrôle désactivé (leçon 7) : cela relève de l'apparence visuelle et de la perception.

#### 8.5.2 Que faire de ce que jsdom ne voit pas

La figure laisse trois règles pour écrire des tests, et une liste de ce qui reste à vérifier manuellement.

**Quand l'effet ne se voit pas, vérifie la cause.** Le focus qui se perd est un effet du rendu. Sa cause est un attribut, `disabled`, que jsdom voit bel et bien. Le test du formulaire vérifie la cause (sans `disabled`, avec `aria-disabled="true"`) et garde la vérification de l'effet comme assertion secondaire. Cela fonctionne parce que la relation entre la cause et l'effet a été mesurée dans un navigateur (leçon 7) et qu'elle est appuyée par la spécification (8.5.1). Sans cette mesure, vérifier la cause serait une supposition.

**N'écris pas un test qui passe pour la mauvaise raison.** Un test jsdom qui affirmerait « le focus ne se perd pas » en ne regardant que `document.activeElement` serait vert avec le bon code comme avec le mauvais. C'est le test qui ne passe pas l'examen de 8.4, et la pire espèce de test : celui qui inspire confiance sans la mériter.

**Nomme l'angle mort.** Le commentaire de la ligne 80 du fichier de tests dit, en une phrase, ce que jsdom ne peut pas voir et ce qui est vérifié à la place. Qui lira le test dans six mois ne va pas le « simplifier » en retirant la ligne de l'attribut.

Et voici ce que cette suite ne vérifie **pas**, même quand elle est au vert :

- **Le vrai parcours au clavier** : que Tab passe par les éléments dans l'ordre, que le contour de `:focus-visible` se voie, que le focus ne se perde pas dans un navigateur. Le test du formulaire couvre un tronçon (du dernier champ au bouton, et le bouton pendant l'envoi), avec la réserve de 8.5.1.
- **Ce que fait entendre un lecteur d'écran.** La suite vérifie que les rôles, les noms, `aria-invalid`, `aria-describedby`, `aria-atomic` et `required` sont en place. Que NVDA, Orca ou VoiceOver les annoncent comme prévu est une autre question, et on y répond en écoutant.
- **La mise en page** : que rien ne se chevauche, que le bouton estompé se distingue, que le panneau compact tienne sur un écran étroit.
- **Le réseau et le vrai serveur** : le *proxy* de Vite, l'API d'entraînement, la réécriture vers `index.html` de la leçon 9. Le faux `fetch` renvoie ce que le test dit ; si la vraie API changeait la forme de ses réponses, `tsc -b` le remarquerait grâce aux types partagés, mais aucun de ces tests.

C'est pour ces choses-là qu'existent les tests de bout en bout, qui pilotent un vrai navigateur. Ce cours ne les enseigne pas ; ce qu'il fait, en revanche, c'est les laisser écrits sous forme d'étapes manuelles dans « Comment savoir que j'ai réussi ». L'ordre des coûts est clair : un test jsdom prend des millisecondes et s'exécute à chaque modification ; un test dans un navigateur prend des secondes et a besoin d'un navigateur installé ; une revue avec un lecteur d'écran prend des minutes et a besoin d'une personne. Les trois se complètent, et aucun ne remplace les autres.

## L'erreur que tu vas voir

La leçon comporte une erreur principale et deux erreurs secondaires.

**L'erreur principale : « Found multiple elements with the role "status" ».** Si tu écris le test du chargement de la façon naturelle, `await screen.findByRole("status")`, il échoue. La figure 1 l'a montré avec `getByRole` : à l'écran, il y a deux zones d'état, la boîte d'avis et le chargement. `findByRole` est `getByRole` avec attente, il en exige donc lui aussi un seul. Le message complet, dans un test Vitest, affiche en outre le DOM avec les deux éléments, et l'on y voit lequel est lequel. Cela se corrige de deux façons : chercher par le texte puis vérifier le rôle, comme le fait la suite ; ou restreindre la recherche avec `within` à la partie de la page où se trouve le chargement. Ce qui ne corrige **rien**, c'est `getAllByRole("status")[1]` : cela dépend de l'ordre du DOM, et le jour où la boîte d'avis changera de place, le test regardera le mauvais élément sans prévenir.

**L'erreur secondaire : « Unable to find role="…" » avec un DOM de cent lignes.** Tu l'as vue en 8.4.3 et en 8.4.4. Elle fait peur par sa taille, mais c'est la meilleure aide que te donne Testing Library : quand une requête `get` ou `find` échoue, elle affiche l'état du DOM ([Testing Library, « Debugging »](https://testing-library.com/docs/dom-testing-library/api-debugging)). Lis-le en cherchant ce que tu t'attendais à trouver. C'est presque toujours là, sous un autre nom (un `aria-label` différent), avec un autre rôle (un `<div>` avec `onClick`), ou pas encore arrivé (un `getBy` là où il fallait un `findBy`). Si le DOM est trop long, la documentation explique qu'il est tronqué à 7 000 caractères et que la variable `DEBUG_PRINT_LIMIT` modifie cette limite.

**L'erreur silencieuse : le test qui nettoie à moitié.** Si tu retires `cleanup()` de `preparar.ts`, les tests qui montent l'application commencent à échouer avec « Found multiple elements… » à des endroits qui n'ont rien à voir entre eux, car chaque test trouve dans le DOM ce qu'a laissé le précédent. Si tu retires `vi.unstubAllGlobals()`, le faux `fetch` d'un test reste en place pour les suivants du même fichier, et un test peut passer avec les routes qu'un autre a déclarées. Ce second cas est le vrai silencieux : il n'échoue pas, il cesse simplement de tester ce qu'il prétend tester.

**L'erreur silencieuse de l'outil : le reporter qui masque la console.** Si tu exécutes Vitest depuis un outil automatisé (un assistant de programmation, un script qui s'identifie comme agent), Vitest peut choisir un autre reporter sans te le dire. Sa documentation l'explique : quand aucun reporter n'est configuré et qu'il détecte qu'il s'exécute au sein d'un agent de programmation, il utilise le reporter minimal, qui n'affiche que les tests qui échouent, et supprime la console de ceux qui passent ainsi que le résumé par fichier ([Vitest, « Reporters »](https://vitest.dev/guide/reporters.html)). Avec ce reporter, un avertissement d'`act` dans un test vert ne se voit pas. Dans ton terminal, cela n'arrive pas, mais si un jour un outil te dit « aucun avertissement », demande-lui `--reporter=default`.

## Ce qui se fait de travers

**Chercher par classes CSS ou par la structure du DOM.** `container.querySelector(".resumen strong")` passe même si le résumé cesse d'être lisible pour un lecteur d'écran, et casse quand quelqu'un change un nom de classe sans rien changer de ce que voit une personne. Cherche par rôle, par étiquette ou par texte.

**`getByTestId` comme premier choix.** Un `data-testid` est un attribut qui n'existe que pour le test : il trouve l'élément même s'il n'a ni rôle ni nom. Testing Library le place à la fin de sa liste pour cette raison.

**Tester l'implémentation.** Lire l'état d'un composant, compter combien de fois il a été rendu ou vérifier qu'on a appelé `establecerAltas`. Ces tests cassent à chaque refactorisation qui ne change rien pour la personne, et restent verts avec des erreurs qui, elles, changent quelque chose pour elle. Teste ce qui se voit, s'entend ou s'envoie.

**Simuler des modules de l'application avec `vi.mock`.** Remplacer `cargar.ts` ou `useReintentar.ts` laisse de côté précisément la partie qui casse le plus souvent : la validation, la clé de requête, l'invalidation. Simule la frontière extérieure, `fetch`, et laisse le reste s'exécuter.

**Partager le `QueryClient` entre les tests.** Le cache d'un test apparaît dans le suivant : le chargement ne se voit pas et un test passe avec les données d'un autre.

**Les nouvelles tentatives activées dans les tests.** Avec `retry: 2`, chaque test d'erreur attend les nouvelles tentatives avant d'afficher l'erreur, et un test d'erreur peut dépasser le délai d'une seconde de `findBy`.

**`fireEvent` pour ce que fait une personne.** Un seul événement ne déplace pas le focus et ne respecte pas un champ désactivé. Utilise `user-event` et attends chaque action avec `await`.

**Oublier l'`await`.** `usuario.click(boton)` sans `await` compare avant que le clic ait lieu. Le test peut passer par hasard et échouer le jour où la machine est chargée.

**Un `expect` qui ne peut pas échouer.** `expect(screen.getByText("Dar de alta")).toBeDefined()` n'échoue jamais dans son `expect` : si le texte n'est pas là, le `getByText` a déjà levé une erreur, et s'il est là, il est défini. La suite utilise cette forme quelques fois, en connaissance de cause : ce qui affirme, c'est le `getBy` ou le `findBy`, et l'`expect` ne sert qu'à faire en sorte que la ligne se lise comme une assertion. Ce qui se fait de travers, c'est de croire que le `toBeDefined()` vérifie autre chose.

**Tenir un test pour bon parce qu'il est vert.** Si tu ne l'as pas vu au rouge avec le correctif défait, tu ne sais pas s'il protège quoi que ce soit. L'exercice 3 en contient un qui ne protège rien.

**Un test qui passe dans jsdom pour la mauvaise raison.** Affirmer le focus dans jsdom après avoir désactivé un bouton, mesurer des tailles, attendre qu'un `<a href>` sans routeur charge une autre page. Si jsdom ne calcule pas l'effet, vérifie la cause et nomme l'angle mort.

**Faire taire la console pour toute la suite.** Un `console.error` réduit au silence dans `preparar.ts` cache les avertissements de React qui trahissent de vraies erreurs (une `key` en double, une mise à jour en dehors d'`act`). Ne fais taire que ce qu'un test provoque volontairement, seulement pendant ce test, et restaure avec `onTestFinished`.

## Exercices

### Exercice 1 — Choisis la requête

Sans rien exécuter, écris dans ton journal de bord quelle requête tu utiliserais (famille `getBy`, `queryBy` ou `findBy`, et type `ByRole`, `ByLabelText` ou `ByText`) pour chaque affirmation, et pourquoi :

1. Une fois le chargement terminé, le rapport affiche une liste.
2. Avec l'API vide, il n'y a **pas** de liste.
3. Le champ « Dirección » est marqué comme invalide après un envoi à vide (le formulaire est déjà rendu).
4. Le bouton pour écarter l'avis d'enregistrement de `correo` apparaît.
5. Le chargement est annoncé comme zone d'état.

Cherche ensuite chaque cas dans la suite du point de contrôle et compare.

### Exercice 2 — L'attribut obligatoire qui disparaît

Dans une copie du point de contrôle, retire l'attribut `required` de `src/alta/Campo.tsx`. **Avant** d'exécuter quoi que ce soit, prédis : combien de tests passent au rouge, lesquels, à quelle ligne et avec quel message ? Lance `npx vitest run src/alta` et compare. Restaure à la fin. Et une question de plus : qu'est-ce qui changerait pour une personne, dans le navigateur, si cet attribut manquait ? (Indice : la leçon 7, l'arbre d'accessibilité.)

### Exercice 3 — Le test qui ne passe pas l'examen

La leçon 2 a corrigé une erreur avec `key` : le brouillon d'une note ne doit pas être emporté d'un service à l'autre. Aujourd'hui, ce correctif vit dans `PaginaServicio.tsx`, dans `<EditorNota key={nombre} …>`, et le point de contrôle n'a **pas** de test pour lui. Écris-le dans un nouveau fichier, `src/detalle/EditorNota.test.tsx` : monte sur `/servicios/pagos`, écris un brouillon dans le champ « Nota sobre pagos » sans le sauvegarder, navigue vers `/servicios/reportes` avec `await act(() => enrutador.navigate("/servicios/reportes"))` (importe `act` depuis `@testing-library/react`) et vérifie que le champ « Nota sobre reportes » est vide. Déclare dans le faux `fetch` les deux routes de détail.

Quand il est vert, fais l'examen de 8.4 : retire `key={nombre}` dans une copie et relance-le. **Passe-t-il au rouge ?** Sinon, explique pourquoi et corrige-le jusqu'à ce qu'il y passe. Indice : regarde ce que rend `PaginaServicio` pendant que la requête du nouveau service est en attente.

### Exercice 4 — Les données anciennes

Le point de contrôle ne teste pas le cinquième état du rapport : la mise à jour échoue, mais le dernier rapport arrivé reste affiché, avec un avis. Écris ce test dans `src/reporte/DatosViejos.test.tsx`. Il te faut que la première requête vers `/api/estados` réponde correctement et les suivantes avec 503 (une fonction dans la table du faux peut tenir le compte), et un moyen de provoquer la deuxième requête sans attendre les dix secondes de l'interrogation périodique, le *polling* (cherche un bouton dans `PaginaReporte.tsx`). Vérifie le texte exact de l'avis et que la liste est toujours là avec ses quatre liens. Fais ensuite l'examen : dans une copie, remplace dans `ContenidoReporte.tsx` la condition `consulta.isError && consulta.data === undefined` par `consulta.isError` et vérifie que ton test passe au rouge.

Seconde partie, l'état « actualizando » : dans le même fichier, écris un autre test où la première requête répond correctement et la deuxième **ne répond jamais** (tu as déjà `nuncaResponde`). Après avoir appuyé sur « Actualizar », vérifie que `· actualizando…` apparaît à côté de l'heure, que la liste est toujours là avec ses quatre liens et que « Cargando… » n'apparaît **pas**. L'examen de celui-ci : dans une copie, remplace dans `ContenidoReporte.tsx` le `if (consulta.isPending)` par `if (consulta.isFetching)`. Quelle différence de la leçon 4 ce test protège-t-il ?

## Solutions

### Solution 1

1. `findByRole("list")` : la liste **va arriver** après un `fetch`, et c'est un élément doté d'un rôle. C'est la première ligne du test « avec données ».
2. `queryByRole("list")` à l'intérieur de `expect(…).toBeNull()` : on affirme une **absence**, et `getBy` lèverait une erreur avant l'`expect`. Mais il faut d'abord un `findBy…` sur quelque chose qui apparaît bel et bien (« No hay servicios configurados todavía. ») : sinon, le test affirmerait l'absence pendant que la page est encore en train de charger, et passerait pour la mauvaise raison. C'est ce que fait le test « vide ».
3. `getByLabelText("Dirección")` puis son `aria-invalid` : le formulaire est déjà rendu et le champ **doit** être là ; `getBy`. Dans la suite, le test attend d'abord l'alerte avec `findByRole("alert")`, qui est le signal que l'envoi est terminé, puis utilise `getByLabelText` sur les trois champs. `getByRole("textbox", { name: "Dirección" })` fonctionnerait aussi.
4. `findByRole("button", { name: "Descartar: Se dio de alta correo" })` : il arrive après l'action, et le nom accessible est celui de l'`aria-label`, pas le texte visible « Descartar » (figure 2).
5. `findByText("Cargando…")` puis vérifier `role="status"` : `findByRole("status")` échoue parce qu'il y a deux zones d'état (figure 1 et « L'erreur que tu vas voir »).

Si, dans un cas, tu as choisi une autre famille, demande-toi ce qu'affirmerait ta version que celle de la suite n'affirme pas, ou l'inverse. Les deux choses que l'on confond le plus sont « il faut attendre » face à « c'est déjà là », et « doit être là » face à « ne doit pas être là ».

### Solution 2

Un **seul** test passe au rouge, « declara los obligatorios y la bandeja anuncia solo el aviso nuevo » (celui des champs obligatoires et de la boîte d'avis), à la ligne 52, avec `expected false to be true` :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/alta/Campo.tsx src/alta/Campo.tsx
26d25
<         required
$ npx vitest run src/alta
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/alta/FormularioAlta.test.tsx (5 tests | 1 failed) 363ms
   ❯ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 72ms
     ✓ con datos válidos envía el alta y confirma 91ms
     × declara los obligatorios y la bandeja anuncia solo el aviso nuevo 7ms
     ✓ el foco no se pierde al enviar y un segundo envío se ignora 110ms
     ✓ un nombre repetido se marca en su campo con el mensaje de la API 82ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/alta/FormularioAlta.test.tsx > el formulario de alta > declara los obligatorios y la bandeja anuncia solo el aviso nuevo
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ src/alta/FormularioAlta.test.tsx:52:30
     50|     for (const etiqueta of ["Nombre", "Dirección", "Tiempo límite (ms)…
     51|       const campo = (await screen.findByLabelText(etiqueta)) as HTMLIn…
     52|       expect(campo.required).toBe(true);
       |                              ^
     53|     }
     54|     const bandeja = screen.getByRole("region", { name: "Avisos" });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
   Start at  04:05:33
   Duration  935ms (tests 44%, environment 39%, import 6%, setup 5%, transform 5%)
```

Le test s'arrête au premier champ, « Nombre », car l'`expect` de l'itération du `for` lève une erreur en cas d'échec ; c'est pourquoi tu ne vois pas les deux autres. Les autres tests du fichier restent verts : le formulaire a `noValidate`, si bien que le navigateur n'a jamais utilisé `required` pour empêcher l'envoi, et c'est le schéma qui fait la validation. Ce qui change pour la personne, c'est ce que la leçon 7 a mesuré dans l'arbre d'accessibilité : sans `required`, les trois champs passent de `required=true` à `required=false`, et un lecteur d'écran cesse d'annoncer « obligatoire » en arrivant sur chacun d'eux. Rien ne change à l'œil. C'est l'exemple parfait d'un correctif que seul un test (ou un lecteur d'écran) peut remarquer.

### Solution 3

Le test tel que le demande l'énoncé :

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, versión ingenua
const { enrutador, usuario } = montarEn("/servicios/pagos");
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

Il est vert. Et dans une copie **sans** `key={nombre}`, il reste vert (pour exécuter les deux versions côte à côte, la version naïve a été sauvegardée sous le nom `EditorNotaIngenua.test.tsx`) :

```bash
$ npx vitest run src/detalle/EditorNotaIngenua.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNotaIngenua.test.tsx (1 test) 116ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:37
   Duration  478ms (environment 49%, tests 27%, import 9%, setup 8%, transform 6%)
```

Il ne passe pas l'examen. La raison se trouve dans `PaginaServicio` : `EditorNota` n'est rendu que lorsque la requête a déjà des données (`consulta.data !== undefined`). En naviguant vers `reportes`, la requête de ce service n'a pas encore de données, si bien que la page affiche « Cargando detalle… » et **démonte** l'éditeur. Quand les données arrivent, elle en monte un nouveau, avec son nouvel état. Le brouillon se perd pour cette raison, avec ou sans `key`. Le test vérifie quelque chose de vrai, mais pas ce que corrige la `key`.

Le cas que corrige la `key`, c'est quand la page ne passe **pas** par l'état de chargement : quand le service de destination est déjà dans le cache. Alors les données sont là dès le premier rendu, `EditorNota` reste au même endroit de l'arbre, et sans `key`, React le réutilise avec son état. Le bon test visite d'abord `reportes` pour que son détail soit dans le cache :

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, la que pasa el examen
const { enrutador, usuario } = montarEn("/servicios/reportes");
await screen.findByRole("textbox", { name: "Nota sobre reportes" });
await act(() => enrutador.navigate("/servicios/pagos"));
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

Le faux `fetch` déclare les deux routes ; pour `reportes`, il suffit de copier `detallePagos` en changeant le nom :

```tsx
// fragmento: la tabla del fetch falso en EditorNota.test.tsx
instalarFetchFalso({
  "GET /api/servicios/pagos": { status: 200, cuerpo: detallePagos },
  "GET /api/servicios/reportes": {
    status: 200,
    cuerpo: { ...detallePagos, nombre: "reportes", estado: { ...detallePagos.estado, nombre: "reportes" } },
  },
});
```

Avec le point de contrôle, vert :

```bash
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNota.test.tsx (1 test) 120ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:34
   Duration  522ms (environment 49%, tests 26%, import 10%, transform 8%, setup 7%)
```

Et sans `key={nombre}`, rouge, avec le brouillon de `pagos` dans l'éditeur de `reportes` :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/detalle/PaginaServicio.tsx src/detalle/PaginaServicio.tsx
46d45
<             key={nombre}
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/detalle/EditorNota.test.tsx (1 test | 1 failed) 131ms
   × el borrador de una nota no se arrastra a otro servicio 131ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/detalle/EditorNota.test.tsx > el borrador de una nota no se arrastra a otro servicio
AssertionError: expected 'revisar el lunes' to be '' // Object.is equality

- Expected
+ Received

+ revisar el lunes

 ❯ src/detalle/EditorNota.test.tsx:24:24
     22|   await act(() => enrutador.navigate("/servicios/reportes"));
     23|   const editor = (await screen.findByRole("textbox", { name: "Nota sob…
     24|   expect(editor.value).toBe("");
       |                        ^
     25| });
     26|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:36
   Duration  695ms (environment 54%, tests 21%, import 9%, setup 8%, transform 7%, worker 1%)
```

`act` est nécessaire ici, car `enrutador.navigate` modifie l'état de l'application en dehors d'une interaction de Testing Library, et l'envelopper dans `act` fait que React applique toutes les modifications avant la ligne suivante. La version qui passe l'examen et le test de l'exercice 4 ont passé `npx eslint` et `tsc` sans avertissement. Ce que tu retiens, c'est l'idée, plus que le test : **un test peut vérifier quelque chose de vrai pour une raison différente de celle que tu crois**, et le seul moyen de le savoir, c'est l'expérience.

### Solution 4

Une façon de l'écrire :

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx
test("datos viejos: si la actualización falla, conserva la lista y lo avisa", async () => {
  // La primera petición responde bien; las siguientes, 503.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": async () => respuestas.shift() ?? { status: 503, cuerpo: { detalle: "caída" } },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  const aviso = await screen.findByRole("alert");
  expect(aviso.textContent).toBe(
    "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503).",
  );
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
});
```

(Importe `screen` et `within` depuis `@testing-library/react`, `expect` et `test` depuis `vitest`, `reporteDeEjemplo` depuis `../pruebas/datos`, `instalarFetchFalso` et le type `RespuestaFalsa` depuis `../pruebas/fetchFalso`, et `montarEn` depuis `../pruebas/montar`.)

Le tableau `respuestas` tient le compte : `shift()` retire la première réponse la première fois et renvoie `undefined` ensuite, et le `??` convertit cet `undefined` en 503. Le bouton « Actualizar » de `PaginaReporte` appelle `consulta.refetch()`, qui provoque la deuxième requête sans attendre l'interrogation périodique. Avec le point de contrôle :

```bash
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (1 test) 137ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:35
   Duration  649ms (environment 42%, tests 24%, transform 14%, import 12%, setup 7%, worker 1%)
```

Avec la condition remplacée par `consulta.isError` :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
21c21
<   if (consulta.isError && consulta.data === undefined) {
---
>   if (consulta.isError) {
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (1 test | 1 failed) 88ms
   × datos viejos: si la actualización falla, conserva la lista y lo avisa 87ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > datos viejos: si la actualización falla, conserva la lista y lo avisa
AssertionError: expected 'No se pudo cargar el reporte: la API …' to be 'Mostrando el último reporte que llegó…' // Object.is equality

Expected: "Mostrando el último reporte que llegó: la actualización falló (la API respondió 503)."
Received: "No se pudo cargar el reporte: la API respondió 503Reintentar"

 ❯ src/reporte/DatosViejos.test.tsx:19:29
     17|
     18|   const aviso = await screen.findByRole("alert");
     19|   expect(aviso.textContent).toBe(
       |                             ^
     20|     "Mostrando el último reporte que llegó: la actualización falló (la…
     21|   );

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  04:05:38
   Duration  579ms (environment 56%, tests 18%, import 10%, setup 8%, transform 7%, worker 1%)
```

Le `Received` raconte l'histoire : sans `consulta.data === undefined`, n'importe quelle erreur envoie vers l'écran d'erreur, et la personne perd la liste qu'elle avait déjà à cause d'une mise à jour qui a échoué ; le `Reintentar` collé à la fin est le texte du bouton, que `textContent` accole à celui du paragraphe. La seconde assertion du test (la liste avec quatre liens) n'a pas été exécutée, car la première avait déjà échoué ; si tu voulais voir les deux, inverse leur ordre. Si ton test a pris un autre chemin pour provoquer la deuxième requête réseau (par exemple, invalider la requête), c'est valable aussi, tant qu'il passe l'examen.

La seconde partie, dans le même fichier (ajoute `nuncaResponde` à l'importation depuis `../pruebas/fetchFalso`) :

```tsx
// fragmento: src/reporte/DatosViejos.test.tsx, segunda prueba
test("actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista", async () => {
  // La primera petición responde bien; la segunda no responde nunca.
  const respuestas: RespuestaFalsa[] = [{ status: 200, cuerpo: reporteDeEjemplo }];
  instalarFetchFalso({
    "GET /api/estados": () => {
      const siguiente = respuestas.shift();
      return siguiente === undefined ? nuncaResponde() : Promise.resolve(siguiente);
    },
  });
  const { usuario } = montarEn("/");
  await screen.findByRole("list");

  await usuario.click(screen.getByRole("button", { name: "Actualizar" }));

  expect((await screen.findByText(/· actualizando…/)).textContent).toMatch(/^Actualizado a las .+ · actualizando…$/);
  expect(within(screen.getByRole("list")).getAllByRole("link")).toHaveLength(4);
  expect(screen.queryByText("Cargando…")).toBeNull();
});
```

L'heure n'est pas comparée exactement, car elle change à chaque exécution : l'expression régulière exige que le paragraphe commence par « Actualizado a las », contienne quelque chose au milieu et se termine par `· actualizando…`. Avec le point de contrôle, les deux tests du fichier au vert :

```bash
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:06:36
   Duration  784ms (environment 49%, tests 20%, import 11%, setup 10%, transform 10%)
```

Avec `consulta.isFetching` au lieu de `consulta.isPending` :

```bash
$ diff programas/08-pruebas-de-componentes/revisor/src/reporte/ContenidoReporte.tsx src/reporte/ContenidoReporte.tsx
17c17
<   if (consulta.isPending) {
---
>   if (consulta.isFetching) {
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ❯ src/reporte/DatosViejos.test.tsx (2 tests | 1 failed) 161ms
   ✓ datos viejos: si la actualización falla, conserva la lista y lo avisa 126ms
   × actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista 34ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/reporte/DatosViejos.test.tsx > actualizando: mientras llega el reporte nuevo, el viejo sigue a la vista
TestingLibraryElementError: Unable to find an accessible element with the role "list"
[… recortado: la lista de roles accesibles y el principio del DOM, 218 líneas …]
        <p
          role="status"
        >
          Cargando…
        </p>
        <p
          class="actualizado"
        >
          Actualizado a las
          4:06:38 a.m.
           · actualizando…
        </p>
        <button
          disabled=""
          type="button"
        >
          Actualizar
        </button>
      </section>
    </main>
  </div>
</body>
 ❯ Object.getElementError node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:52:17
 ❯ node_modules/@testing-library/dom/dist/query-helpers.js:95:19
 ❯ src/reporte/DatosViejos.test.tsx:40:24
     38|
     39|   expect((await screen.findByText(/· actualizando…/)).textContent).toM…
     40|   expect(within(screen.getByRole("list")).getAllByRole("link")).toHave…
       |                        ^
     41|   expect(screen.queryByText("Cargando…")).toBeNull();
     42| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
   Start at  04:06:37
   Duration  600ms (environment 44%, tests 30%, import 9%, transform 9%, setup 7%)
```

Le DOM tronqué montre le problème : pendant que le nouveau rapport arrive, l'écran affiche « Cargando… » là où se trouvait la liste, alors que le cache contient le rapport précédent. C'est la différence de la leçon 4 entre `status` (« y a-t-il des données ? ») et `fetchStatus` (« y a-t-il une requête en cours ? ») : `isPending` signifie « pas encore de données », `isFetching` signifie « quelque chose est en train d'être demandé », et les confondre efface la liste à chaque interrogation périodique, toutes les dix secondes. Le premier test du fichier reste vert avec ce changement : chacun protège un correctif différent. Les deux ont passé `npx eslint` et `tsc`.

## Comment savoir que j'ai réussi

- [ ] `npm ci`, `npm run lint` et `npm run build` se terminent sans erreur dans `~/curso-react/revisor/`, et `npm run build` produit `dist/assets/index-C_lOH5GL.js`, **le même nom que dans la leçon 7** : les tests n'ont pas modifié l'application.
- [ ] `npm test` se termine avec `Test Files  7 passed (7)` et `Tests  27 passed (27)`, lus dans le résumé, pas dans le code de sortie. Avec `npx vitest run --reporter=verbose`, tu vois les 27 lignes avec `✓` et leurs noms.
- [ ] Avec `npx vitest run --reporter=default`, la sortie de la suite ne contient aucun `stderr` ni aucun avertissement qui mentionne `act(`. Et tu as vérifié que cela signifie quelque chose : sans la ligne d'`IS_REACT_ACT_ENVIRONMENT` dans `preparar.ts`, le test de contrôle de 8.1.3 n'avertit pas ; avec elle, si.
- [ ] Tu as fait l'examen de 8.4 avec au moins deux correctifs, dans une copie : `fallas > 0` dans `ResumenFallas.tsx` et la garde `onClick={alPulsar}` dans `BotonEnviar.tsx`. Chacun a fait passer au rouge le test indiqué dans la leçon, avec le message indiqué ; une fois restauré, tout est revenu au vert.
- [ ] Les figures 1, 2 et 3 donnent sur ta machine la même sortie que dans la leçon, et la page `fig08_03.html` dans ton Chrome indique `body` à la ligne « dos cuadros después ».
- [ ] Tu as écrit le test de l'exercice 3 qui passe **bien** au rouge sans `key={nombre}`, et tu as vu au vert celui qui n'y passe pas.
- [ ] Tu as écrit les deux tests de l'exercice 4 (données anciennes avec erreur et « actualizando… »), tu les as vus au vert avec le point de contrôle et chacun au rouge avec sa modification (`consulta.isError` et `isFetching`). Avec eux, les états du rapport ont tous leur test.
- [ ] **Manuellement, au clavier, dans Chrome**, avec `npm run servidor` et `npm run dev` : sur `/servicios/nuevo`, remplis le formulaire, atteins le bouton avec Tab et envoie avec Espace. Le contour bleu reste sur le bouton pendant qu'il affiche « Dando de alta… » et après. C'est la partie du test du focus que jsdom ne peut pas voir (8.5) ; dans la leçon 7, tu as la marche à suivre complète.
- [ ] **Manuellement, avec un lecteur d'écran** (Orca sur ton Mint, NVDA sous Windows ou VoiceOver sous macOS) : refais les vérifications de la leçon 7 et note dans ton [journal de bord](bitacora.md) quels attributs la suite vérifie et ce que tu n'as vérifié qu'en écoutant.

## Résumé

Réponds sans regarder la leçon :

1. Que fait chacune des cinq nouvelles dépendances, et pourquoi `jsdom` doit-il être installé si c'est Vitest qui l'utilise ?
2. Pourquoi `preparar.ts` appelle-t-il `cleanup` manuellement ? Que se passerait-il sans lui, et que se passerait-il sans `vi.unstubAllGlobals` ?
3. Pourquoi une requête par rôle et par nom dit-elle sur l'accessibilité quelque chose que ne dit pas une requête par texte ? Pourquoi `getByRole("button", { name: "Descartar" })` ne trouve-t-il pas le bouton de la boîte d'avis ?
4. Qu'affirme chaque famille, `getBy`, `queryBy` et `findBy` ? Pourquoi le test du chargement cherche-t-il par texte puis vérifie-t-il le rôle ?
5. Que fait `user-event` que `fireEvent` ne fait pas, et pourquoi chaque action porte-t-elle un `await` ?
6. Pourquoi le point de contrôle simule-t-il `fetch` et non les modules de l'application ? Que renvoie le faux pour une route qui n'a pas été déclarée, et pourquoi ?
7. Quelles trois choses `montarEn` monte-t-il, et pourquoi chaque test a-t-il besoin d'un `QueryClient` neuf et sans nouvelles tentatives ?
8. Quelles sont les cinq étapes de l'examen de 8.4 ? Que te dit un test qui reste vert avec le correctif défait ?
9. Pourquoi le test du focus vérifie-t-il que le bouton n'a pas `disabled`, si ce qui compte, c'est le focus ? Que dit la spécification HTML sur le moment où un contrôle désactivé perd le focus ?
10. Nomme trois choses que la suite ne vérifie pas même quand elle est au vert, et comment on vérifie chacune d'elles.

## Pour aller plus loin

- [Testing Library, « About Queries »](https://testing-library.com/docs/queries/about/) : les trois familles (`getBy`, `queryBy`, `findBy`) avec leurs versions `All`, la priorité des requêtes et le délai d'expiration de `findBy`. Consulté le 21 octobre 2026.
- [Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole) : l'option `name`, les rôles implicites, l'option `hidden` et le coût du calcul de l'arbre d'accessibilité. Consulté le 21 octobre 2026.
- [Testing Library, « Guiding Principles »](https://testing-library.com/docs/guiding-principles) : plus les tests ressemblent à l'utilisation réelle, plus ils donnent confiance. Consulté le 21 octobre 2026.
- [Testing Library, « Async Methods »](https://testing-library.com/docs/dom-testing-library/api-async/) : `findBy` comme `getBy` plus `waitFor`, l'intervalle de 50 ms et le délai d'expiration de 1 000 ms. Consulté le 21 octobre 2026.
- [Testing Library, « Debugging »](https://testing-library.com/docs/dom-testing-library/api-debugging) : `logRoles`, `prettyDOM`, le DOM affiché lors des échecs, `DEBUG_PRINT_LIMIT` et `COLORS`. Consulté le 21 octobre 2026.
- [Testing Library, API de React Testing Library](https://testing-library.com/docs/react-testing-library/api) : `render`, ce qu'il renvoie, et quand `cleanup` est automatique et quand il ne l'est pas. Consulté le 21 octobre 2026.
- [Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro) et [sa page sur le clavier](https://testing-library.com/docs/user-event/keyboard) : des interactions complètes plutôt que des événements isolés, `setup()` avant le rendu, et comment s'écrivent les touches. Consulté le 21 octobre 2026.
- [Vitest, « Test Environment »](https://vitest.dev/guide/environment.html) : l'environnement `node` par défaut et l'environnement `jsdom`. Consulté le 21 octobre 2026.
- [Vitest, `globals`](https://vitest.dev/config/globals.html) et [« Reporters »](https://vitest.dev/guide/reporters.html) : pourquoi `globals` vaut `false` par défaut et quelles bibliothèques dépendent des globales pour faire leur nettoyage toutes seules ; quel reporter Vitest choisit et lequel masque la console des tests qui passent. Consulté le 21 octobre 2026.
- [Vitest, `vi`](https://vitest.dev/api/vi.html), [`mock`](https://vitest.dev/api/mock.html) et [« Hooks »](https://vitest.dev/api/hooks.html) : `vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.unstubAllGlobals`, `mock.calls`, `mockRestore`, `afterEach` et `onTestFinished`. Consulté le 21 octobre 2026.
- [React, `act`](https://react.dev/reference/react/act) : appliquer les modifications en attente avant de comparer, `IS_REACT_ACT_ENVIRONMENT`, et pourquoi React Testing Library l'utilise déjà à ta place. Consulté le 21 octobre 2026.
- [React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter) : le routeur avec historique en mémoire et `initialEntries`. Consulté le 21 octobre 2026.
- [jsdom, README, « Unimplemented parts of the web platform »](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform) : la navigation et la mise en page hors de sa portée, les zéros de substitution et `pretendToBeVisual`. Consulté le 21 octobre 2026.
- [WHATWG, HTML, « Update the rendering »](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering) : la correction asynchrone du focus quand l'élément qui a le focus cesse d'être focalisable, par exemple quand il est désactivé. Consulté le 21 octobre 2026.
- [MDN, attribut `disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled) : un contrôle désactivé ne reçoit ni le focus ni des événements comme le clic. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| test de composant | un test qui rend des composants dans un DOM de test et les utilise comme le ferait une personne |
| Vitest | l'exécuteur de tests qui utilise la configuration de Vite ; il fournit `test`, `describe`, `expect` et `vi` |
| jsdom | un DOM écrit en JavaScript, sans mise en page ni rendu, dans lequel s'exécutent les tests |
| requête (*query*) | une fonction de Testing Library qui cherche des éléments : `getBy…`, `queryBy…`, `findBy…` et leurs versions `All` |
| rôle implicite | le rôle qu'a un élément natif sans qu'on écrive `role` : `<button>` est `button`, `<ul>` est `list` |
| `user-event` | bibliothèque qui simule des interactions complètes d'une personne : saisir du texte, cliquer, appuyer sur des touches |
| `fetch` simulé | un `fetch` remplacé dans le test, qui répond selon une table de routes, sans réseau |
| routeur en mémoire | un routeur de React Router qui conserve son historique en mémoire, sans barre d'adresse |
| `act` | outil de React qui applique les modifications en attente avant de comparer ; Testing Library l'utilise à ta place |
| l'examen du test | défaire le correctif qu'un test protège, le voir au rouge et restaurer ; s'il reste vert, il ne protège rien |
| correction du focus | l'étape du navigateur qui, au rendu de l'image suivante, retire le focus d'un élément qui a cessé d'être focalisable |

---

**Suivante :** [Leçon 9 — Performance, publication et quand utiliser un framework](09-rendimiento-publicacion.md)
