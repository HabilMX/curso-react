# Leçon 0 — Un vrai projet : Vite, StrictMode et le linter

*Il est 9 h 40 et la revue avec l'équipe d'exploitation est à 10 h. Hier, tu as changé une ligne du panneau du `revisor` : tu as retiré une dépendance à un `useEffect` parce qu'elle « était en trop ». Sur ta machine, tout a l'air parfait. Ta collègue l'ouvre sur la sienne, change l'intervalle de rafraîchissement à cinq secondes pour la démonstration… et le panneau continue d'interroger toutes les dix secondes, comme s'il ne l'avait pas entendue. Personne ne sait pourquoi. Dans le même changement, quelqu'un a laissé, « juste pour tester », une clé du fournisseur de métriques dans une variable qui commence par `VITE_`, et le paquet a déjà été déployé sur le serveur de test. Il reste vingt minutes. Les deux défaillances avaient fait l'objet d'un avertissement : un outil qui n'était pas installé et une règle que personne ne connaissait. Cette leçon installe l'outil et explique la règle.*

**Durée :** 2 × 45 min (la coupure naturelle se trouve entre les sections 0.3 et 0.4)

**Ce que tu construis :** le panneau de la leçon 9 du cours de TypeScript, déplacé vers un projet Vite : avec un serveur de développement, un *proxy* vers l'API, une variable de configuration `VITE_`, `StrictMode` activé, le linter de React actif et le serveur d'entraînement du cours pour que le panneau ait un serveur à interroger

**Ce que tu apprends :** ce qu'ajoute Vite par rapport à un empaqueteur configuré manuellement ; le modèle `react-ts`, ses trois `tsconfig` et la structure par fonctionnalité ; le *proxy* vers l'API (sans CORS en développement) ; les variables `VITE_` et pourquoi aucun secret n'y a sa place ; `eslint-plugin-react-hooks` actif dès le premier jour

**D'où tu viens.** De la leçon 9 du [cours de TypeScript](https://github.com/HabilMX/curso-typescript) de Hábil, ou d'un endroit similaire : un panneau React qui fonctionne. Ce panneau a un composant `Panel`, un hook personnalisé `useReporte` qui demande `GET /api/estados` avec un `AbortController`, une frontière réseau `cargar.ts` qui valide la réponse avec `esReportePublico`, et un `cliente.tsx` qui le monte. Il s'empaquetait avec une commande esbuild d'une seule ligne et était servi par le même processus Node qui répondait à l'API. Si tu n'as pas suivi ce cours, peu importe : tout le code du panneau apparaît complet dans cette leçon, et le cours inclut un serveur d'entraînement qui répond avec la même forme de données. Tu travailles dans un nouveau dossier, `~/curso-react/revisor/`.

**Ce que cette leçon ne fait pas.** Elle ne change rien à ce que fait le panneau : ni un nouvel écran, ni un nouvel état, ni une nouvelle règle. Le code React est le même que celui de la leçon 9 de TypeScript, avec deux petits changements expliqués là où ils apparaissent. Elle n'explique pas non plus à fond les Effects ni StrictMode : ici, tu les actives et tu vois ce qu'ils font ; la [Leçon 3](03-effects-sincronizar.md) les démonte pièce par pièce. Elle ne publie rien : la politique de sécurité du contenu (CSP), la réécriture vers `index.html` et le serveur de production arrivent dans la [Leçon 9](09-rendimiento-publicacion.md). Et elle n'a pas encore de tests automatisés : Vitest et Testing Library arrivent dans la [Leçon 8](08-pruebas-de-componentes.md).

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 (branche 24 LTS) et npm 11.19.1, sous macOS, avec les versions exactes que fixe le `package.json` de cette leçon. Comme le cours suppose Linux Mint, le point de contrôle a été réinstallé à partir de zéro avec `npm ci` à l'intérieur d'un conteneur Linux (Debian 12 avec l'image officielle `node:24.22.0`), et là `npm run lint` et `npm run build` ont donné la même sortie, avec les mêmes noms de fichiers dans `dist/`. Cela n'a pas été exécuté sur un vrai Linux Mint, mais rien de ce qui est montré ne dépend du système, sauf le terme `darwin-arm64` de `vite --version`, qui sur ton Mint indiquera `linux-x64`. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome en mode headless (`--headless`), qui charge la page, exécute son JavaScript et renvoie le document résultant : c'est un vrai navigateur, pas une simulation. Les chemins longs qu'affichent ESLint et Vite sont montrés à partir de `~/curso-react`. Les heures du journal du serveur d'entraînement sont en UTC. La veille, le 20 octobre, la 24.22.1 de la même branche était sortie, avec le même npm ; les exécutions de la leçon n'ont pas été faites avec elle, mais le point de contrôle a ensuite été rejoué avec cette version à partir d'une copie propre (`npm ci`, `npm run lint` et `npm run build`) et a produit les mêmes noms de fichiers dans `dist/`, `index-tGGc24Rg.css` et `index-BWNt33lQ.js` ; la sortie se trouve dans `node-24.22.1.salida.txt`. Les programmes se trouvent dans [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), dans le dépôt du cours : `revisor/` est le point de contrôle et les figures sont à côté.

**Avant de commencer : as-tu Node.js 24 ?** Cette leçon n'installe pas Node.js ; elle le suppose installé, donc la première chose à faire est de le vérifier. Ouvre un terminal et tape :

```text
$ node -v
v24.22.1
```

Ton numéro final peut être différent (ici, on montre celui de la version la plus récente de la branche 24 le jour de la relecture), mais il doit commencer par `v24`. Si la commande n'existe pas, ou affiche autre chose, installe Node.js 24 LTS en suivant les instructions de la page de téléchargement ([Node.js, « Download »](https://nodejs.org/en/download)), qui propose une méthode selon ton système, puis retape `node -v`. Ce n'est pas une formalité : Vite 8 exige Node.js 20.19 ou supérieur, ou 22.12 ou supérieur ([Vite, « Getting Started »](https://vite.dev/guide/)), et le serveur d'entraînement s'exécute avec `node servidor/practica.ts`, qui nécessite la 24.12 ou une version ultérieure (c'est expliqué en 0.2.2). Si ta distribution fournit un Node.js plus ancien dans ses dépôts, la commande existera et les numéros ne coïncideront pas avec ceux de la leçon : c'est pourquoi on vérifie avant.

## À la fin, tu seras capable de

- Créer un projet avec le modèle `react-ts` de Vite, fixer ses dépendances avec leur version exacte et expliquer à quoi sert chacun de ses trois fichiers `tsconfig`.
- Expliquer la différence entre `npm run dev` et `npm run build`, et prouver avec une erreur de types que Vite traduit TypeScript mais ne le vérifie pas.
- Configurer un *proxy* dans `vite.config.ts` et expliquer, la réponse de `curl` sous les yeux, pourquoi grâce à lui le navigateur n'a pas besoin de CORS en développement.
- Lire une variable `VITE_` depuis `import.meta.env`, la typer, et vérifier avec `grep` sur `dist/` que sa valeur voyage en clair dans le JavaScript que n'importe qui télécharge.
- Reconnaître dans le journal du serveur la deuxième requête que provoque `StrictMode` en développement, et expliquer pourquoi elle n'apparaît pas dans la version construite.
- Activer `eslint-plugin-react-hooks`, faire en sorte qu'un avertissement interrompe `npm run lint`, et lire les avertissements de `rules-of-hooks`, `exhaustive-deps` et `set-state-in-effect`.

## Le pourquoi avant le comment

Le panneau de la leçon 9 de TypeScript fonctionne, et il fonctionne pour de bonnes raisons : la réponse de l'API est validée, l'effet est nettoyé, la panne de l'API est visible comme une panne. Ce qu'il n'a pas, c'est un **projet** autour. Pose quatre questions à ce panneau et tu verras les failles.

**Combien de temps mets-tu pour voir un changement ?** Chaque fois que tu touchais à `Panel.tsx`, il fallait réempaqueter avec esbuild, redémarrer le serveur Node et rafraîchir la page. Cela fait quinze secondes, cent fois par jour. Un serveur de développement qui surveille tes fichiers et informe le navigateur du module qui a changé transforme ces quinze secondes en moins d'une, tout en conservant l'état de l'écran entre-temps.

**Comment parles-tu à l'API si elles ne vivent pas dans le même processus ?** En TypeScript, la page et l'API provenaient du même serveur, de la même origine, et c'est pourquoi `fetch("/api/estados")` fonctionnait sans rien configurer. Dès lors que tu sépares l'écran (qui est désormais servi par un outil de développement sur un port) de l'API (qui reste sur un autre), le navigateur commence à appliquer la politique de même origine et la requête est bloquée. Il y a deux issues : ouvrir CORS sur l'API, ce qui est une décision de sécurité qui n'appartient pas à l'écran, ou faire en sorte que l'outil de développement réexpédie ces requêtes, afin que le navigateur voie à nouveau une seule origine. Cette leçon choisit la seconde.

**Où va la configuration ?** L'intervalle de rafraîchissement était écrit dans le code, `10_000`. Le modifier pour une démonstration exigeait d'éditer un fichier. Les outils de construction proposent des variables d'environnement, mais dans une page de navigateur « variable d'environnement » signifie tout autre chose que sur un serveur, et confondre les deux est la façon la plus courante de publier une clé secrète.

**Qui te prévient quand tu enfreins une règle de React ?** Le compilateur TypeScript vérifie les types ; il ignore qu'un hook ne peut pas être appelé après un `return`, ou que la liste de dépendances d'un effet doit nommer ce que l'effet utilise. La leçon 9 de TypeScript le disait en toutes lettres : « ESLint, dans ce projet, ne vérifie pas les listes de dépendances ; le paquet officiel qui s'en charge est `eslint-plugin-react-hooks`, et c'est une excellente installation suivante ». Cette installation suivante a lieu aujourd'hui, et c'est la première de ce cours, car **un principe que le cours répète à chaque leçon — si le linter se plaint, on modifie le code — n'a de sens que si le linter est activé dès le premier jour.**

Les quatre réponses tiennent dans un outil et deux commutateurs. L'outil est **Vite**, l'un de ceux que l'équipe même de React cite, avec Parcel et Rsbuild, quand tu veux construire une application sans framework ([React, « Build a React app from Scratch »](https://react.dev/learn/build-a-react-app-from-scratch)) et celui qui a remplacé Create React App, retiré par l'équipe de React pour les nouveaux projets le 14 février 2025 ([React, « Sunsetting Create React App »](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). Les commutateurs sont **`StrictMode`**, qui pousse React à mettre tes composants à l'épreuve pendant que tu développes, et **`eslint-plugin-react-hooks`**, qui vérifie les règles de React avant d'exécuter quoi que ce soit.

Cela fait trois nouveaux concepts, ceux du paragraphe précédent. Le premier est **l'outil, Vite**, et il s'étend sur quatre sections parce qu'il répond aux trois premières questions : ce qu'est Vite et ce qu'il fait (0.1) ; le projet, ses `tsconfig` et ses dossiers (0.2) ; le *proxy* (0.3) ; et les variables `VITE_` (0.4). Le deuxième est le premier commutateur, **`StrictMode`** (0.5). Le troisième est le second commutateur, **le linter de React** (0.6). La section 0.7 n'ajoute pas de concept : c'est le parcours complet avec le serveur d'entraînement, où les trois apparaissent ensemble. À la fin, voici ce que tu vas voir, et tu sauras d'où vient chaque ligne :

```text
$ npm run build

> revisor@0.0.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 20 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-tGGc24Rg.css    0.24 kB │ gzip:  0.18 kB
dist/assets/index-BWNt33lQ.js   221.66 kB │ gzip: 69.47 kB

✓ built in 265ms
```

## Les concepts

### 0.1 Ce que fait Vite et que l'empaqueteur configuré manuellement ne faisait pas

#### 0.1.1 Deux tâches distinctes sous un même nom

La commande esbuild de la leçon 9 de TypeScript n'accomplissait qu'une seule tâche : prendre `cliente.tsx`, suivre ses `import`, rassembler le tout dans un `cliente.js` et l'écrire sur le disque. Vite accomplit **deux tâches distinctes**, et presque tout ce que tu liras à son sujet se comprend mieux si tu les sépares :

1. **Le serveur de développement** (`npm run dev`). Il ne rassemble pas ton code dans un fichier unique. Il sert chaque module de ton code séparément, lorsque le navigateur le demande, traduit à la volée de TypeScript et JSX vers JavaScript. Les navigateurs modernes savent charger des modules JavaScript (`<script type="module">` et leurs `import`) sans aide extérieure, si bien qu'il n'est pas nécessaire d'empaqueter pour développer. C'est pourquoi il démarre en peu de temps, parce qu'il n'empaquette pas ton code (le temps de démarrage croît beaucoup moins avec la taille du projet que dans un outil qui empaquette tout avant de servir), et c'est pourquoi, lorsque tu modifies un fichier, seul ce module est renvoyé : c'est le **remplacement de modules à chaud** (HMR, *Hot Module Replacement*), qui dans React s'appelle *Fast Refresh* et préserve l'état des composants qui n'ont pas changé ([Vite, « Why Vite »](https://vite.dev/guide/why)). Pour les **dépendances** (ce qui vit dans `node_modules/`, comme `react`), il fait en revanche une exception : il les **pré-empaquète** une fois, au démarrage, pour convertir en modules JavaScript celles qui arrivent dans l'ancien format de Node (CommonJS) et pour qu'une bibliothèque constituée de centaines de fichiers internes parvienne au navigateur en une seule requête et non en plusieurs centaines. Ce pré-empaquetage n'a lieu qu'en développement et ne touche pas à ton code ([Vite, « Dependency Pre-Bundling »](https://vite.dev/guide/dep-pre-bundling)).
2. **La construction** (`npm run build`). Ici, on empaquète bel et bien, car servir des centaines de modules isolés en production obligerait le navigateur à émettre une requête pour chaque `import` imbriqué. Le résultat est un dossier `dist/` avec un `index.html`, un fichier JavaScript et une feuille de styles dont les noms changent dès que leur contenu change.

Depuis Vite 8, publié le 12 mars 2026, ces deux tâches sont assurées par la même pièce : **Rolldown**, un empaqueteur écrit en Rust, avec **Oxc** pour lire, traduire et minifier le code. Auparavant, Vite utilisait esbuild en développement et Rollup pour la construction, et les maintenir en accord exigeait du code de liaison ([Vite, « Announcing Vite 8 »](https://vite.dev/blog/announcing-vite8)). Pour toi, la conséquence pratique est simple : ce que tu vois en développement et ce qui est construit passent par le même traducteur (en développement, sans empaquetage ni minification du code).

#### 0.1.2 `index.html` est le point d'entrée

Dans la leçon 9 de TypeScript, la page était une chaîne de texte à l'intérieur de `pagina.ts`, et pointait vers un `/cliente.js` qui devait exister au préalable. Dans Vite, c'est l'inverse : **`index.html` vit à la racine du projet et constitue le point de départ.** Vite le lit, y trouve le `<script type="module" src="/src/main.tsx">` et suit les `import` à partir de là ([Vite, « Getting Started »](https://vite.dev/guide/)). Tu pointes vers le fichier TypeScript, non vers un résultat empaqueté ; Vite se charge de faire parvenir du JavaScript au navigateur.

Tu peux le constater de tes propres yeux. Le serveur de développement étant démarré, demande la page avec `curl` :

```text
$ curl -s http://localhost:5173/
<!doctype html>
<html lang="es">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

    <script type="module" src="/@vite/client"></script>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
  </head>
  <body>
    <div id="raiz"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

C'est ton `index.html` avec deux ajouts que tu n'as pas écrits : `/@vite/client`, le petit script qui maintient une connexion ouverte avec le serveur pour être informé du fichier qui a changé, et `/@react-refresh`, celui qui permet de remplacer un composant sans perdre l'état des autres. Ce second ajout est inséré par `@vitejs/plugin-react`, le plugin officiel de Vite pour React, qui traduit en outre le JSX avec le *runtime* automatique, le même mode `react-jsx` que tu utilisais avec `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). Rien de tout cela n'apparaît dans `dist/` : c'est uniquement destiné au développement.

#### 0.1.3 Vite traduit TypeScript, mais ne le vérifie pas

Voici la phrase qu'il convient le plus de retenir de cette section : **Vite efface les types sans les vérifier.** Sa documentation l'écrit en majuscules : il ne fait que traduire les fichiers `.ts` et « NE » vérifie « PAS » les types ; il délègue cette tâche à l'éditeur et au processus de construction ([Vite, « Features », TypeScript](https://vite.dev/guide/features)). C'est exactement ce qui se passait avec esbuild dans la leçon 9 de TypeScript, et la conséquence est la même : si l'on se contente d'exécuter l'outil qui empaquète, on peut livrer un programme qui contient des erreurs de type.

C'est pourquoi le script `build` du modèle n'est pas simplement `vite build`, mais `tsc -b && vite build`. D'abord, le compilateur TypeScript vérifie l'ensemble ; s'il trouve une erreur, le `&&` empêche la construction même de commencer. Dans « L'erreur que tu vas voir », tu vas la provoquer exprès pour observer les deux sorties côte à côte. Et en développement, tant que `npm run dev` tourne, les erreurs de type **n'apparaissent ni dans le terminal ni dans le navigateur** : tu les vois dans ton éditeur, ou lorsque tu exécutes `npm run build`.

### 0.2 Le projet : le modèle, ses `tsconfig` et ses dossiers

#### 0.2.1 Ce qu'apporte le modèle, et ce qu'on y change

La façon officielle de commencer est `npm create vite@latest`. Avec un nom et un modèle, il ne pose aucune question. Ce cours fixe la version du créateur pour que ton résultat soit identique à celui de la leçon :

```text
$ npm create vite@9.3.1 revisor -- --template react-ts --no-interactive

> npx
> 'cva' revisor --template react-ts --no-interactive


create-vite v9.3.1

│
◇  Scaffolding project in ~/curso-react/revisor...
│
└  Done. Now run:

  cd revisor
  npm install
  npm run dev
```

Les deux tirets isolés (`--`) séparent les options de npm des options du créateur ; sans eux, npm intercepterait `--template`. Le modèle `react-ts` crée un dossier contenant `index.html`, `vite.config.ts`, trois fichiers `tsconfig`, un `package.json`, un dossier `src/` avec un compteur d'exemple et un dossier `public/` pour les fichiers copiés tels quels. Mesuré ce jour-là, son `package.json` comportait trois choix que ce cours modifie, et il convient de les signaler explicitement pour éviter toute surprise lors d'une comparaison :

- **Les versions avec `^` et `~`.** Le modèle écrit `"vite": "^8.3.4"`, ce qui autorise npm à installer n'importe quelle version 8.x plus récente. Le cours fixe chaque dépendance à sa version exacte, vérifiée avec `npm view` le jour de l'exécution : ainsi, ce que tu vois ici est exactement ce que tu installes. Le fichier de verrouillage, `package-lock.json`, enregistre en outre la résolution exacte de tout ce que ces dépendances entraînent avec elles.
- **Le linter.** Le modèle de ce mois-ci apporte **Oxlint**, un linter très rapide écrit en Rust, avec quelques règles pour React. Le cours utilise ESLint avec `eslint-plugin-react-hooks`, qui est le paquet publié par l'équipe même de React pour vérifier ses règles ([React, « eslint-plugin-react-hooks »](https://react.dev/reference/eslint-plugin-react-hooks)) et celui qui inclut les diagnostics du React Compiler que la Leçon 9 utilise. Oxlint n'est pas un mauvais choix ; c'en est un autre, et mélanger deux linters dans un cours est une source de confusion inutile. Le créateur propose une option `--eslint` qui remplace Oxlint par ESLint, mais elle a été mesurée le même jour et ajoute en outre `eslint-plugin-react-refresh` et `globals`, deux paquets que ce cours n'utilise pas ; c'est pourquoi on le crée ici sans cette option et que l'on retire Oxlint manuellement, comme expliqué ci-dessous.
- **TypeScript.** Le modèle impose TypeScript 6. Le cours de TypeScript travaille avec TypeScript 7, et nous conservons ici le même principe : TypeScript 7 vérifie les types (`tsc`), et TypeScript 6 reste en place, sous le nom `typescript`, uniquement pour qu'ESLint puisse lire les fichiers `.ts`. La raison est mesurable : `typescript-eslint` déclare prendre en charge TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, « Dependency Versions »](https://typescript-eslint.io/users/dependency-versions/)), il ne tourne donc pas encore avec la version 7. Ce sont deux rôles distincts ; ne remplace pas l'un par l'autre.

Si tu n'as pas suivi le cours de TypeScript, il n'est pas nécessaire de comprendre l'astuce des alias pour continuer : il suffit de savoir que `npx tsc --version` répond `Version 7.0.2` et que `npx tsc6 --version` n'existe que pour ESLint. Un détail curieux a été mesuré : le paquet `@typescript/typescript6` est en version 6.0.2, mais son exécutable renvoie `Version 6.0.3`. Cela n'affecte rien ; on le laisse noté car, si tu le vois, ce n'est pas une erreur de ta part.

Le point de contrôle de cette leçon ne conserve ni le compteur d'exemple ni le dossier `public/` : leurs fichiers sont remplacés par ceux du panneau. Avant d'installer quoi que ce soit, retire ce que le modèle apporte d'Oxlint, afin que ton projet aboutisse au même résultat que celui du cours : supprime le fichier `.oxlintrc.json`, supprime dans `package.json` la ligne `"oxlint"` des `devDependencies`, et laisse son bloc `scripts` identique à celui montré plus bas (le `lint` du modèle indique `oxlint` ; celui du cours, `eslint . --max-warnings 0`, et on ajoute `servidor`). Les dépendances s'installent ainsi, en deux commandes, depuis `~/curso-react/revisor/` :

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Remarque une différence avec la leçon 9 de TypeScript : là-bas, React figurait dans `devDependencies`, car le serveur de production ne l'importait pas. Ici, il va dans `dependencies`, comme le place le modèle. Pour une application qui est construite et servie sous forme de fichiers statiques, la différence ne change rien au résultat final (tout finit dans le JavaScript de `dist/`) ; c'est une convention qui sépare « ce qui voyage vers le navigateur » de « ce que tu n'utilises que pour construire ».

Le `package.json` du point de contrôle se présente ainsi :

```json revisor/package.json
{
  "name": "revisor",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "servidor": "node servidor/practica.ts"
  },
  "dependencies": {
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

Cinq scripts, cinq tâches. `dev` démarre le serveur de développement. `build` vérifie les types et construit. `lint` exécute ESLint avec `--max-warnings 0`, ce qui est expliqué en 0.6. `preview` sert ce qui se trouve dans `dist/` pour que tu puisses l'examiner avant de le publier (et seulement pour cela : la documentation de Vite précise qu'il est conçu pour prévisualiser la construction sur ta machine et qu'il ne s'agit pas d'un serveur de production, [Vite, « Deploying a Static Site »](https://vite.dev/guide/static-deploy)). Et `servidor` démarre le serveur d'entraînement, présenté en 0.7.

Avant de continuer, une habitude non négociable : `node_modules/` ne se versionne jamais dans un dépôt. Ce sont des dizaines de mégaoctets que `npm ci` reconstruit à l'identique à partir de `package-lock.json`. Le modèle fournit un `.gitignore` qui l'exclut déjà, aux côtés de `dist/` et des fichiers `*.local` ; conserve-le, et si tu crées le projet manuellement, crée-le avant le premier `git add` avec au moins ces trois lignes : `node_modules`, `dist` et `*.local`. Dans le dépôt du cours, le dossier `revisor/` ne possède pas son propre `.gitignore` : les dix points de contrôle vivent dans un seul dépôt et le `.gitignore` de sa racine les couvre tous. Ce que l'on versionne en revanche bel et bien, c'est `package-lock.json`.

#### 0.2.2 Trois `tsconfig`, car il y a deux mondes

Dans la leçon 9 de TypeScript, un seul `tsconfig.json` vérifiait à la fois le serveur et le panneau, et la leçon elle-même en soulignait le prix : le code du serveur « voyait » aussi `document`, et une étourderie passait la compilation puis échouait à l'exécution. Le modèle de Vite sépare les deux mondes au moyen de **références de projet** (*project references*) : de petits projets TypeScript vérifiés séparément, chacun avec ses propres règles ([TypeScript, « TSConfig Reference »](https://www.typescriptlang.org/tsconfig/)). Le fichier situé à la racine ne vérifie rien ; il se contente d'énumérer les deux autres :

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (pour *build*) parcourt ces références et vérifie chacune d'elles. Le premier est celui du navigateur, `tsconfig.app.json`, et il couvre `src/` :

```json revisor/tsconfig.app.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Ce qui compte dans ce fichier tient en cinq idées :

- **`"lib": ["ES2023", "DOM"]` et `"types": ["vite/client"]`.** Ici, `document` et `window` existent bel et bien, ainsi que les types que Vite ajoute au navigateur, comme `import.meta.env` ([Vite, « Features », types du client](https://vite.dev/guide/features)). Dans l'autre projet, ils n'existeront pas.
- **`"noEmit": true`.** TypeScript n'écrit aucun fichier `.js` : il se contente de vérifier. C'est Vite qui traduit. La documentation de TypeScript décrit cette option exactement ainsi : elle laisse la place à un autre outil pour convertir le code ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** C'est le mode de résolution des `import` pensé pour les empaqueteurs, et contrairement à `nodenext`, il **n'exige jamais d'extension** dans les chemins relatifs ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). C'est le premier des deux changements apportés au code de la leçon 9 : là-bas, tu écrivais `import { Panel } from "./Panel.js"`, avec un `.js` qui n'existait pas sur le disque, parce que Node l'exigeait ; ici, tu écris `from "./Panel"`.
- **`verbatimModuleSyntax` et `isolatedModules`.** Vite traduit chaque fichier isolément, sans examiner les autres, et ignore donc si ce que tu importes est un type ou une valeur. Avec `verbatimModuleSyntax`, TypeScript t'oblige à marquer avec `type` ce qui n'est qu'un type, et le traducteur peut l'effacer sans hésiter ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)) ; avec `isolatedModules`, il te prévient si tu écris quelque chose qu'un traducteur traitant un seul fichier à la fois ne peut pas interpréter correctement. La documentation de Vite réclame explicitement cette seconde option ([Vite, « Features »](https://vite.dev/guide/features)). Le modèle ne l'apporte pas ; le point de contrôle l'ajoute car la source officielle l'exige.
- **`"strict": true`.** Elle ne figure pas non plus dans le modèle de ce mois-ci, alors que le cours de TypeScript la considérait comme acquise depuis sa leçon 2. Sans elle, `null` et `undefined` s'infiltrent là où ils ne devraient pas.

Le second projet, `tsconfig.node.json`, est celui des éléments qui tournent sous Node : la configuration de Vite et le serveur d'entraînement.

```json revisor/tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,

    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "servidor"]
}
```

Ici, pas de `DOM` : si le serveur d'entraînement écrivait `document`, `tsc -b` le rejetterait. Et deux options apparaissent, liées à une capacité récente de Node : depuis la version 24.12.0, exécuter un fichier `.ts` directement avec `node fichier.ts` est stable. Node ne vérifie pas les types, il se contente de les remplacer par des espaces, et impose donc deux conditions : que les importations portent leur extension `.ts` et que le fichier n'utilise pas de syntaxe TypeScript génératrice de code, comme `enum` ([Node.js, « Modules: TypeScript »](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` autorise la première ; `erasableSyntaxOnly` fait en sorte que `tsc` surveille la seconde ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). C'est pourquoi `npm run servidor` correspond à `node servidor/practica.ts`, sans rien compiler au préalable.

La configuration de Vite est courte. Le *proxy* qu'elle contient est expliqué en 0.3 :

```ts
// revisor/vite.config.ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3100",
    },
  },
});
```

`port: 5173` est le port que Vite utilise par défaut de toute façon ; l'écrire indique clairement lequel c'est. `strictPort: true` modifie ce qui se produit si ce port est occupé : sans cette option, Vite tente silencieusement le port libre suivant ([Vite, « Server Options »](https://vite.dev/config/server-options)), et tu te retrouverais avec deux serveurs de développement oubliés sur 5173 et 5174 sans savoir lequel tu regardes. Avec elle, Vite refuse de démarrer et te le signale.

#### 0.2.3 Les dossiers : par fonctionnalité, pas par type de fichier

Il existe deux manières courantes d'organiser `src/`. L'une regroupe par type de fichier : un dossier `components/`, un autre `hooks/`, un autre `services/`. L'autre regroupe par **fonctionnalité** : tout ce qui est nécessaire pour « voir le rapport d'états » vit ensemble, qu'il s'agisse d'un composant, d'un hook ou d'une fonction réseau. Ce cours utilise la seconde, et c'est un choix propre au cours, non une règle de React (la documentation de React n'impose aucune structure). La raison en est pratique : lorsque tu modifies l'apparence du rapport, tu ouvres un seul dossier, pas trois. Et quand le `revisor` grandira — le détail d'un service dans la Leçon 5, l'enregistrement dans la Leçon 7 —, chaque nouvelle fonctionnalité sera un nouveau dossier, et non un fichier de plus dans chacun des dossiers habituels.

```text
revisor/
├── .env
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── servidor/
│   └── practica.ts
├── src/
│   ├── compartido/
│   │   └── contrato.ts
│   ├── reporte/
│   │   ├── cargar.ts
│   │   ├── Panel.tsx
│   │   ├── panel.css
│   │   └── useReporte.ts
│   ├── configuracion.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`src/reporte/` correspond à la fonctionnalité. `src/compartido/` conserve ce que plusieurs d'entre elles utilisent : aujourd'hui, uniquement les types de l'API (`contrato.ts`). Les autres fichiers de `src/` sont ceux qui touchent à l'application dans son ensemble : le démarrage et la configuration. Ce sont les mêmes types que ceux de la leçon 8 de TypeScript ; l'unique changement est que `esRegistro` vit désormais ici même, car le fichier de configuration du serveur dont il était importé ne fait pas partie de ce projet :

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
```

La frontière réseau porte le second changement. En TypeScript, `cargarReporte` recevait un second paramètre, `base`, que les tests utilisaient pour pointer vers un serveur local avec son adresse complète. Ici, le navigateur demande toujours le chemin relatif `/api/estados` et c'est le *proxy* qui décide de sa destination, ce paramètre est donc superflu et nous le supprimons. En le retirant, la fonction possède déjà exactement la forme du type `Cargar`, et `main.tsx` peut la transmettre telle quelle, sans l'envelopper dans une fonction fléchée :

```ts
// revisor/src/reporte/cargar.ts
import { esReportePublico, type ReportePublico } from "../compartido/contrato";

export type Cargar = (senal: AbortSignal) => Promise<ReportePublico>;

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

Le hook et le composant arrivent sans changement de logique ; seuls leurs `import` changent. De plus, le composant importe sa feuille de styles : dans Vite, `import "./panel.css"` suffit pour que le CSS parvienne à la page. En développement, il est injecté à l'aide d'une balise `<style>` remplacée à chaud dès que tu édites le fichier, et lors de la construction, il est rassemblé dans un fichier `.css` distinct ([Vite, « Features », CSS](https://vite.dev/guide/features)). En TypeScript, tu transmettais la feuille à esbuild comme deuxième entrée ; ici, la feuille voyage avec le composant qui l'utilise, ce qui correspond exactement à l'idée d'un regroupement par fonctionnalité.

```ts
// revisor/src/reporte/useReporte.ts
import { useEffect, useState } from "react";
import type { ReportePublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";

export type Carga =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly reporte: ReportePublico }
  | { readonly tipo: "error"; readonly detalle: string };

export function useReporte(
  cargar: Cargar,
  cadaMs: number,
): { readonly carga: Carga; readonly recargar: () => void } {
  const [carga, establecerCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, establecerIntento] = useState(0);

  useEffect(() => {
    const control = new AbortController();

    async function pedir(): Promise<void> {
      try {
        const reporte = await cargar(control.signal);
        establecerCarga({ tipo: "listo", reporte });
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

```tsx
// revisor/src/reporte/Panel.tsx
import type { EstadoPublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";
import "./panel.css";
import { useReporte, type Carga } from "./useReporte";

function FilaEstado({ estado }: { readonly estado: EstadoPublico }) {
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

function Contenido({ carga }: { readonly carga: Carga }) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo":
      return (
        <ul>
          {carga.reporte.estados.map((estado, posicion) => (
            <FilaEstado key={`${posicion}-${estado.nombre}`} estado={estado} />
          ))}
        </ul>
      );
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}

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
      <Contenido carga={carga} />
      <button type="button" onClick={recargar}>
        Actualizar
      </button>
    </main>
  );
}
```

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
```

La page et le démarrage concluent le parcours. `index.html` est celui du modèle avec trois modifications : la langue, le titre et l'identifiant du conteneur, qui reste `raiz` pour ne pas toucher au code qui le recherche. `main.tsx` est le `cliente.tsx` de TypeScript avec deux ajouts : `StrictMode`, expliqué en 0.5, et l'intervalle lu depuis la configuration, expliqué en 0.4.

```html revisor/index.html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Revisor</title>
  </head>
  <body>
    <div id="raiz"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```tsx
// revisor/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { cadaMs } from "./configuracion";
import { cargarReporte } from "./reporte/cargar";
import { Panel } from "./reporte/Panel";

const raiz = document.getElementById("raiz");

if (raiz === null) {
  throw new Error("falta el elemento #raiz en la página");
}

createRoot(raiz).render(
  <StrictMode>
    <Panel cargar={cargarReporte} cadaMs={cadaMs} />
  </StrictMode>,
);
```

Remarque un point dont la leçon 9 de TypeScript prenait soin et qui est préservé ici : `cargarReporte` est une fonction déclarée au niveau du module, elle est donc identique à chaque rendu. `useReporte` l'inclut dans sa liste de dépendances ; si elle changeait à chaque rendu, l'effet se répéterait à chaque rendu.

### 0.3 Le *proxy* : une seule origine pendant le développement

Jusqu'ici, il y a deux processus : le serveur de développement de Vite sur `http://localhost:5173` et l'API (le serveur d'entraînement) sur `http://127.0.0.1:3100`. Pour le navigateur, ce sont **deux origines**, car une origine est la combinaison d'un schéma, d'un hôte et d'un port, et ici l'hôte et le port changent. La règle qui s'applique s'appelle la **politique de même origine** : un script chargé depuis une origine peut demander des données à une autre, mais le navigateur **ne lui permet pas de lire la réponse** à moins que cette réponse ne comporte les en-têtes CORS appropriés. MDN le formule ainsi : pour des raisons de sécurité, les navigateurs restreignent les requêtes HTTP inter-origine initiées par des scripts, et `fetch()` obéit à la politique de même origine ([MDN, « Cross-Origin Resource Sharing (CORS) »](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). L'en-tête accordant la permission est `Access-Control-Allow-Origin`.

Le serveur d'entraînement le comporte-t-il ? Demande-le-lui comme le ferait le navigateur, en précisant ton origine :

```text
$ curl -s -D - -o /dev/null -H "Origin: http://localhost:5173" http://127.0.0.1:3100/api/estados
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
cache-control: no-store
Date: Wed, 21 Oct 2026 07:25:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked
```

Pas la moindre trace d'`Access-Control-Allow-Origin`. `curl` reçoit la réponse complète parce que `curl` n'est pas un navigateur et n'applique aucune politique ; mais si le panneau, chargé depuis le port 5173, demandait cette adresse complète, le navigateur recevrait la réponse et refuserait de la transmettre au code, et dans la console tu verrais une erreur de CORS. Et le fait que le serveur ne l'apporte pas est délibéré : décider quelles origines peuvent lire une API relève d'une décision de sécurité de l'API, ce n'est pas une permission que l'on accorde simplement parce qu'elle gêne l'écran en développement. La leçon 9 de TypeScript le formulait à l'inverse : tant que le panneau et l'API proviennent du même processus, il n'y a rien à configurer, et s'ils sont séparés un jour, la réponse correcte consiste à déclarer des origines explicites, jamais `*` par commodité.

L'autre solution est que le navigateur **n'apprenne jamais** qu'il y a deux processus. C'est ce que fait le *proxy* de `vite.config.ts` : « toute requête dont le chemin commence par cette clé est réexpédiée vers la cible indiquée » ([Vite, « Server Options », `server.proxy`](https://vite.dev/config/server-options)). La forme courte, `"/api": "http://127.0.0.1:3100"`, signifie que `http://localhost:5173/api/estados` devient, au sein du serveur de Vite, `http://127.0.0.1:3100/api/estados`. Le navigateur ne s'adresse qu'au port 5173 ; la réexpédition a lieu entre deux processus de ta machine, où aucune politique de même origine ne s'applique. Vérifie-le avec le même `curl`, désormais contre Vite :

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

La réponse est celle du serveur d'entraînement, servie depuis l'origine de la page. C'est pourquoi `cargar.ts` continue d'écrire `fetch("/api/estados")`, un chemin relatif, exactement comme en TypeScript : le code du panneau ne sait pas, et n'a pas besoin de savoir, sur quel port vit l'API. Trois détails qu'il convient de connaître :

- **Seul ce qui commence par la clé est réexpédié.** `/src/main.tsx` reste servi par Vite. Si demain l'API ajoute des routes qui ne commencent pas par `/api`, elles ne seront pas réexpédiées tant que tu n'auras pas ajouté une autre clé. C'est pourquoi il convient que toutes les routes d'une API résident sous un même préfixe.
- **`vite preview` réexpédie aussi.** Son option `preview.proxy` prend par défaut la valeur de `server.proxy` ([Vite, « Preview Options »](https://vite.dev/config/preview-options)), et c'est pourquoi en 0.5 la version construite trouve elle aussi l'API.
- **En production, il n'y a pas de *proxy* Vite.** Ce que l'on publie, ce sont les fichiers de `dist/`, et quiconque les sert devra résoudre la même équation : soit la page et l'API proviennent de la même origine (le cas le plus courant, avec un proxy inverse devant), soit l'API déclare CORS. La Leçon 9 reviendra là-dessus.

### 0.4 Variables `VITE_` : de la configuration, jamais de secrets

L'intervalle de rafraîchissement relève de la configuration : une valeur qui peut varier entre ta machine, celle de ta collègue et la version publiée, sans que le code ne change. Sur un serveur Node, tu le lirais depuis `process.env`. Dans une page de navigateur, **il n'y a pas d'environnement** : le code s'exécute sur l'ordinateur de la personne qui ouvre la page, et la seule chose que cette personne reçoit est le JavaScript que tu lui envoies. Dès lors, lorsque Vite te propose des « variables d'environnement », ce qu'il fait en réalité, c'est **écrire leur valeur directement dans le code** au moment de servir ou de construire.

La règle de Vite est simple : seules les variables dont le nom commence par `VITE_` parviennent au code du client, via `import.meta.env`, et leur valeur est remplacée de manière statique lors de la construction ([Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode)). Tu peux les définir dans le terminal ou dans un fichier `.env` à la racine du projet, que Vite lit systématiquement, aux côtés de `.env.local`. Si une même variable apparaît à plusieurs endroits, la plus spécifique l'emporte : celles qui existent déjà dans le terminal au démarrage de Vite ont la priorité la plus haute et les fichiers `.env` ne les écrasent pas ; entre fichiers, un fichier propre à un mode précis (`.env.production`, par exemple) pèse plus lourd qu'un fichier général ([Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode)). Le point de contrôle fournit celui-ci :

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

Et la configuration la lit et la valide en un seul endroit. Ce qui provient d'`import.meta.env` est du texte ou `undefined`, jamais un nombre, et vient de l'extérieur du programme : on le traite comme toute entrée à une frontière, à l'instar de `leerPuerto` dans le cours de TypeScript. S'il est absent ou s'il ne s'agit pas d'un entier positif, on utilise la valeur par défaut habituelle :

```ts
// revisor/src/configuracion.ts
const CADA_MS_PREDETERMINADO = 10_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  return Number(valor);
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

Pour que TypeScript sache quelles variables existent, on les déclare dans `src/vite-env.d.ts`, comme l'indique la documentation de Vite. L'interface `ViteTypeOptions` avec `strictImportMetaEnv` rend le typage strict : grâce à elle, lire une variable non déclarée constitue une erreur de compilation au lieu d'un `any` silencieux ([Vite, « Env Variables and Modes », IntelliSense](https://vite.dev/guide/env-and-mode)). Dans « L'erreur que tu vas voir », tu la verras intercepter une faute de frappe.

```ts
// revisor/src/vite-env.d.ts
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_CADA_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

À présent, la démonstration qui justifie toute la section. Demande au serveur de développement le module de configuration, tel que le reçoit le navigateur :

```text
$ curl -s http://localhost:5173/src/configuracion.ts | head -9
import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_CADA_MS": "10000"};const CADA_MS_PREDETERMINADO = 1e4;
export function leerCadaMs(valor) {
	if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
		return CADA_MS_PREDETERMINADO;
	}
	return Number(valor);
}
export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

La première ligne est celle qui compte : la valeur de la variable est **écrite dans le fichier** que le navigateur télécharge, aux côtés de quatre autres constantes que Vite définit systématiquement (`DEV`, `PROD`, `MODE`, `BASE_URL`). Lors de la construction, la même chose se produit, sous forme minifiée. Construis avec une autre valeur et recherche-la dans `dist/` :

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

Elle est bien là, `f(`15000`)`, à l'intérieur du JavaScript minifié : `f` est `leerCadaMs` avec un nom raccourci. (On utilise `npx vite build` et non `npm run build` uniquement pour transmettre la variable sur la même ligne ; le résultat est identique.) Et si quelqu'un définit une « clé secrète », il lui arrive exactement la même chose. Cette expérience ajoute temporairement une ligne à la fin de `src/main.tsx` qui affiche une variable avec préfixe et une autre sans préfixe :

```ts
console.log("con prefijo:", import.meta.env.VITE_CLAVE_API, "sin prefijo:", import.meta.env.CLAVE_API);
```

Construis avec les deux valeurs définies dans le terminal, puis cherche :

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

Celle avec `VITE_` est restée écrite en clair, lisible par quiconque ouvre les outils de développement de son navigateur. Celle sans préfixe est devenue `void 0`, c'est-à-dire `undefined` : Vite ne l'a pas exposée. C'est pourquoi la documentation de Vite avertit que les variables `VITE_*` ne doivent contenir aucune information sensible, comme des clés d'API ([Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode)). Remarque aussi que la construction a abouti sans encombre bien que le code lise deux variables que `vite-env.d.ts` ne déclare pas : `vite build` ne vérifie pas les types. `npx tsc -b` l'aurait bel et bien arrêté avec deux erreurs `TS2339` ; c'est pourquoi le script de construction du cours commence par lui. (Si tu répètes l'expérience, retire ensuite la ligne et reconstruis. La sortie complète, avec les deux `TS2339`, se trouve dans `vite-clave-api.salida.txt`.)

Une nuance qu'il vaut la peine de mesurer, car elle change le sens de « écrit dans le JavaScript ». Lors de la construction, Vite remplace **les lectures** qu'il trouve dans ton code, comme `import.meta.env.VITE_CADA_MS` ; une variable `VITE_` qu'aucun fichier ne lit ne voyage pas. Définis-en une que personne ne lit et cherche sa valeur :

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
0
```

Mais il suffit qu'une seule ligne lise l'objet entier (`console.log(import.meta.env);`, ajoutée à la fin de `main.tsx` pour l'expérience) pour que **toutes** les variables `VITE_` existant à ce moment-là voyagent :

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
1
```

C'est pourquoi la règle ne repose pas sur le fait que « cette valeur, personne ne la lit » : toute variable `VITE_` s'écrit en gardant à l'esprit qu'elle peut finir dans le JavaScript public (sortie dans `vite-variable-sin-leer.salida.txt`). C'est ce que documente Vite en avertissant que les valeurs `VITE_*` sont incluses dans le code lors de la construction et ne doivent pas contenir d'information sensible ; la partie « seulement celles qui sont lues » est ce que cette expérience a mesuré avec Vite 8.3.5, et non quelque chose qu'affirme son guide.

La règle pratique se divise en deux volets. **Ce qui va bel et bien dans `VITE_` :** ce que cela ne te dérangerait pas de voir placardé sur une affiche publique, comme un intervalle, le nom de l'environnement ou l'adresse publique d'une API. **Ce qui n'y va jamais :** des clés, des mots de passe, des jetons, tout ce qui octroie une permission. Un secret dont le navigateur a besoin cesse d'être un secret dès lors que le navigateur l'a en sa possession ; si une fonctionnalité nécessite une clé, cette clé réside sur un serveur et l'écran demande au serveur d'effectuer le travail. Une dernière chose : les fichiers `.env.local` existent pour les valeurs propres à ta machine que tu ne souhaites pas partager, et Vite recommande de placer `*.local` dans le `.gitignore` pour qu'ils ne soient jamais versionnés.

### 0.5 `StrictMode` : le test gratuit

`StrictMode` est un composant de React qui ne fait aucun rendu à l'écran. Il enveloppe une partie de l'arbre (ici, l'arbre tout entier) et, **uniquement en développement**, fait exprès trois choses pour mettre au jour des erreurs qui existent déjà dans ton code : il rend chaque composant une fois de plus, exécute pour chaque effet un cycle supplémentaire de « démarrage et nettoyage », et vérifie si tu utilises d'anciennes API ([React, « StrictMode »](https://react.dev/reference/react/StrictMode)). En production, il ne fait rien : la documentation le dit sans détour, toutes ses vérifications sont propres au développement et n'affectent pas la construction.

Le cycle supplémentaire des effets est celui qui se remarque le plus, et la première figure le montre dans un DOM de test. Un composant doté d'un effet qui affiche quand il commence et quand il cesse de se synchroniser est monté et démonté deux fois : sans `StrictMode` et avec lui.

```tsx
// fig00_01.tsx
import { JSDOM } from "jsdom";
import { act, StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Sondeo({ nombre }: { readonly nombre: string }) {
  useEffect(() => {
    console.log(`  ${nombre}: empieza a sincronizar`);
    return () => console.log(`  ${nombre}: deja de sincronizar`);
  }, [nombre]);

  return <p>{nombre}</p>;
}

async function montarYDesmontar(titulo: string, arbol: ReactNode): Promise<void> {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));

  await act(async () => {
    raiz.render(arbol);
  });
  await act(async () => {
    raiz.unmount();
  });
}

await montarYDesmontar("sin StrictMode:", <Sondeo nombre="panel" />);
await montarYDesmontar(
  "con StrictMode:",
  <StrictMode>
    <Sondeo nombre="panel" />
  </StrictMode>,
);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig00_01.tsx
$ node fig00_01.js
sin StrictMode:
  panel: empieza a sincronizar
  panel: deja de sincronizar
con StrictMode:
  panel: empieza a sincronizar
  panel: deja de sincronizar
  panel: empieza a sincronizar
  panel: deja de sincronizar
```

Les figures sont exécutées dans un dossier séparé, `~/curso-react/figuras/`, et ce dossier n'existe pas tant que tu ne l'as pas monté. Copie-y, depuis `programas/00-un-proyecto-de-verdad/` (le dossier qui se trouve à côté de `revisor/`), cinq fichiers : `package.json`, `package-lock.json`, `eslint.config.js`, `fig00_01.tsx` et `fig00_02.tsx` ; puis lance `npm ci` dans `~/curso-react/figuras/` pour installer `react`, `jsdom` et le linter avec les versions exactes. Sans le `eslint.config.js` de ce dossier, `npx eslint fig00_02.tsx` (0.6) ne sait pas quelles règles appliquer. Les figures sont compilées avec `tsc` et exécutées avec `node`, comme dans le cours de TypeScript. Avec `StrictMode`, React a monté l'effet, l'a nettoyé immédiatement et l'a remonté, comme si l'utilisateur avait quitté l'écran et était revenu en un instant. Pourquoi ? Parce que cela **se produit bel et bien** dans une vraie application : la personne change d'écran et revient, ou bien une dépendance de l'effet change. Si l'effet ne sait pas nettoyer ce qu'il a fait, ce départ et ce retour laissent des résidus : deux connexions ouvertes, deux minuteurs, deux requêtes en concurrence. `StrictMode` provoque cette situation à chaque montage pour que tu la voies aujourd'hui et non quand quelqu'un s'en apercevra en production.

Dans le `revisor`, cela s'observe dans le journal du serveur d'entraînement. Voici ce qu'il a consigné lorsque Chrome a ouvert le panneau servi par `npm run dev` :

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Deux requêtes en ouvrant la page une seule fois. La première a été émise par le premier montage de l'effet ; le nettoyage qui a suivi a appelé `control.abort()`, le navigateur a interrompu la connexion et le serveur l'a consignée comme annulée. La seconde a été émise par le second montage, et c'est elle qui a alimenté l'écran.

Une précision sur ce qui est garanti et ce qui ne l'est pas. Ce que React garantit, c'est le cycle supplémentaire de l'effet : initialiser, nettoyer et réinitialiser ([React, « StrictMode »](https://react.dev/reference/react/StrictMode)). Que le serveur parvienne à **consigner** la première requête dépend du moment où l'annulation survient : si le navigateur l'annule avant que la connexion n'atteigne le serveur, le journal n'affichera que le `200`. Lors de cette exécution, la connexion a eu le temps d'aboutir, et c'est pourquoi on observe la paire. Si sur ta machine tu ne vois qu'une seule ligne, ce n'est pas que `StrictMode` est désactivé ; ce qui prouve le cycle supplémentaire, c'est la première figure, pas le journal. Et voici ce qu'il a consigné lorsque Chrome a ouvert la version construite, servie par `npm run preview` :

```text
07:26:22.726 GET /api/estados 200
```

Une seule. En production, il n'y a pas de cycle supplémentaire. Lis bien ce que démontre le premier journal : **le nettoyage de l'effet existe et fonctionne.** Si `useReporte` n'annulait pas la requête dans son nettoyage, la première ne serait pas interrompue, les deux réponses arriveraient et toutes deux modifieraient l'état ; s'il n'arrêtait pas le minuteur, deux intervalles interrogeraient toutes les dix secondes. Le panneau de la leçon 9 disposait déjà de ce nettoyage, et `StrictMode` le confirme gratuitement chaque fois que tu ouvres la page.

La tentation, quand quelqu'un voit deux requêtes pour la première fois, est de retirer `StrictMode` « parce qu'il double les appels ». C'est couper l'alarme parce qu'elle sonne. La Leçon 3 consacre une section entière aux raisons pour lesquelles ce double montage est ton allié, et aux rares situations où ce dont tu as besoin n'est pas de l'esquiver, mais d'écrire l'effet autrement.

### 0.6 Le linter de React, actif dès le premier jour

ESLint lit ton code sans l'exécuter et y recherche des motifs qu'il sait incorrects. À lui seul, il ne connaît rien à React ; `eslint-plugin-react-hooks` lui enseigne ses règles. Sa configuration recommandée, dans la version 7.1.1, active seize règles : les deux règles classiques des hooks et quatorze issues du React Compiler. La documentation de React les décrit ainsi : les deux premières couvrent les motifs fondamentaux, `rules-of-hooks` (que les hooks soient appelés à l'identique à chaque rendu) et `exhaustive-deps` (que la liste de dépendances contienne tout ce que l'effet utilise), et les autres sont des diagnostics du compilateur exploitables même si ton application ne l'a pas encore adopté ([React, « eslint-plugin-react-hooks »](https://react.dev/reference/eslint-plugin-react-hooks)). (Cette page en énumère dix-sept ; la différence tient à `component-hook-factories`, que la version 7.1.1 du paquet n'inclut pas encore dans sa configuration recommandée. Cela a été mesuré en listant les règles activées par le paquet installé.)

La configuration du projet réunit trois blocs recommandés — ceux de JavaScript, de TypeScript et de React — et conserve la règle que la leçon 9 de TypeScript avait écrite contre les failles XSS :

```js
// revisor/eslint.config.js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "No insertes HTML sin sanitizar: usa texto como hijo de JSX.",
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "No asignes innerHTML: usa textContent o un componente de React.",
        },
      ],
    },
  },
]);
```

`globalIgnores(["dist"])` évite qu'ESLint n'examine le code construit, que tu n'as pas écrit. `files` restreint l'examen aux fichiers TypeScript. Et `reactHooks.configs.flat.recommended` est la syntaxe indiquée par le paquet lui-même pour la configuration plate d'ESLint.

À présent, le détail qui décide si le linter sert à quelque chose ou fait de la figuration. La règle `exhaustive-deps` est configurée comme un **avertissement** (*warning*), non comme une erreur. Et ESLint, en présence d'avertissements, **se termine avec succès**. Voici ce que cela donne si tu retires `cadaMs` de la liste de dépendances de `useReporte` et que tu lances ESLint tel quel :

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Code de sortie 0 : pour n'importe quel script ou vérification automatique, c'est synonyme de « tout va bien ». Cet avertissement est la scène par laquelle s'est ouverte la leçon : l'effet n'est plus informé lorsque l'intervalle change, de sorte que ta collègue peut le modifier autant qu'elle veut, le panneau continuera d'interroger toutes les dix secondes. C'est pourquoi le script du cours est `eslint . --max-warnings 0` : avec zéro avertissement autorisé, la même modification interrompt la commande.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

Le principe du cours face à cet avertissement ne varie dans aucune leçon : **on répare le code, on ne fait pas taire la règle.** Ici, la réparation consiste à remettre `cadaMs` dans la liste, ce qui correspond à la vérité : l'effet l'utilise. Un commentaire `// eslint-disable-next-line` supprimerait l'avertissement tout en laissant le défaut exactement où il était.

La seconde figure réunit, dans un composant de douze lignes, les deux erreurs classiques des hooks. Elle ne fait pas partie du `revisor` ; elle est vérifiée avec sa propre configuration, identique à celle du projet sans la règle du XSS :

```tsx
// fig00_02.tsx
import { useEffect, useState } from "react";

export function Resumen({ cadaMs, visible }: { readonly cadaMs: number; readonly visible: boolean }) {
  if (!visible) {
    return null;
  }

  const [vueltas, establecerVueltas] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => establecerVueltas((n) => n + 1), cadaMs);
    return () => clearInterval(temporizador);
  }, []);

  return <p>{vueltas} actualizaciones</p>;
}
```
```bash
$ npx eslint fig00_02.tsx

~/curso-react/figuras/fig00_02.tsx
   9:40  error    React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?   react-hooks/rules-of-hooks
  11:3   error    React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return?  react-hooks/rules-of-hooks
  14:6   warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array                                                                                    react-hooks/exhaustive-deps

✖ 3 problems (2 errors, 1 warning)
```

Les deux erreurs disent la même chose en des termes différents : React identifie chaque `useState` et chaque `useEffect` d'un composant **par l'ordre dans lequel ils sont appelés**, et non par leur nom. Si lors d'un rendu `visible` vaut `false` et que le composant sort plus tôt, ce rendu n'appelle aucun hook ; si lors du suivant il vaut `true`, il les appelle, et React ne sait plus quel état correspond à qui. Le message devine même la cause : « as-tu accidentellement appelé un hook React après un `return` anticipé ? ». La solution consiste à déplacer les hooks au-dessus du `if` et à réserver la condition uniquement à ce qui est affiché. L'avertissement de la troisième ligne est identique à celui de `useReporte`. Les solutions des exercices présentent la version corrigée.

Et les règles du compilateur ne restent pas de la théorie. Si, à l'intérieur de l'effet de `useReporte`, tu écrivais `establecerCarga({ tipo: "cargando" })` dès le début, avant de créer l'`AbortController`, le linter répondrait ainsi (le message est long ; il est affiché au complet car il s'explique de lui-même) :

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  18:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/reporte/useReporte.ts:18:5
  16 |
  17 |   useEffect(() => {
> 18 |     establecerCarga({ tipo: "cargando" });
     |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  19 |     const control = new AbortController();
  20 |
  21 |     async function pedir(): Promise<void> {  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

C'est la règle `set-state-in-effect`. Remarque que le `useReporte` original appelle bel et bien `establecerCarga` au sein de l'effet, mais **après un `await`**, lorsque la réponse est parvenue depuis l'extérieur : cela relève d'une synchronisation avec un système externe, et la règle l'autorise. Ce qu'elle rejette, c'est de modifier l'état de manière immédiate dans le corps de l'effet, car cela provoque un rendu supplémentaire que rien en dehors de React n'a réclamé. Le panneau place déjà `cargando` là où il faut : dans `recargar`, qui s'exécute suite à un clic. Il s'agit du premier contact avec le principe du cours sur les effets ; la Leçon 3 le développe dans son ensemble.

Le point de contrôle passe sans la moindre alerte. Ce n'est ni un hasard ni le mérite du linter : le code de la leçon 9 de TypeScript respectait déjà les règles. Ce qui change aujourd'hui, c'est qu'à partir de maintenant, si quelqu'un les enfreint, `npm run lint` l'indique et s'arrête.

### 0.7 Le serveur d'entraînement et le parcours complet

Le dernier fichier est le serveur d'entraînement. Le cours porte sur l'écran et ce serveur n'est pas expliqué ligne par ligne : c'est un processus Node qui répond avec les mêmes données publiques que l'API du cours de TypeScript, `GET /api/estados` et `GET /salud`, avec quatre services fixes et un délai de 300 ms pour que tu aies le temps de voir « Cargando… ». Il utilise les types de `src/compartido/contrato.ts`, de sorte que si ces types changent, `tsc -b` pointe également le serveur du doigt. Et il consigne une ligne par requête, ce que tu as utilisé en 0.5 pour observer les deux requêtes de `StrictMode`.

```ts
// revisor/servidor/practica.ts
// Servidor de práctica del curso de React. Responde los mismos datos públicos que
// la API del curso de TypeScript (GET /api/estados y GET /salud) con datos fijos,
// para que el panel tenga a quién preguntarle. No se explica en el curso: el curso
// es de pantalla. Se arranca con `npm run servidor`.
import { createServer } from "node:http";
import type { ReportePublico } from "../src/compartido/contrato.ts";

const PUERTO = Number(process.env.PUERTO ?? "3100");
const DEMORA_MS = 300;

const reporte: ReportePublico = {
  estados: [
    { nombre: "catálogo", tipo: "disponible", codigoHttp: 200, duracionMs: 42 },
    { nombre: "pagos", tipo: "falla", detalle: "HTTP 503" },
    { nombre: "inventario", tipo: "disponible", codigoHttp: 200, duracionMs: 118 },
    { nombre: "reportes", tipo: "falla", detalle: "tiempo límite agotado" },
  ],
};

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

const servidor = createServer((solicitud, respuesta) => {
  const ruta = new URL(solicitud.url ?? "/", "http://practica.local").pathname;

  respuesta.once("finish", () => {
    registrar(`${solicitud.method ?? "?"} ${ruta} ${respuesta.statusCode}`);
  });
  solicitud.once("close", () => {
    if (!respuesta.writableFinished) {
      registrar(`${solicitud.method ?? "?"} ${ruta} cancelada por el cliente`);
    }
  });

  if (solicitud.method !== "GET") {
    respuesta.writeHead(405, { allow: "GET", "content-type": "application/json; charset=utf-8" });
    respuesta.end(JSON.stringify({ detalle: "método no permitido" }));
    return;
  }

  if (ruta === "/salud") {
    respuesta.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    respuesta.end("ok");
    return;
  }

  if (ruta === "/api/estados") {
    setTimeout(() => {
      if (respuesta.destroyed) {
        return;
      }
      respuesta.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      respuesta.end(JSON.stringify(reporte));
    }, DEMORA_MS);
    return;
  }

  respuesta.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  respuesta.end(JSON.stringify({ detalle: "ruta no encontrada" }));
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`servidor de práctica en http://127.0.0.1:${PUERTO}`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor de práctica detenido"));
    servidor.closeAllConnections();
  });
}
```

Le parcours complet utilise deux terminaux. Dans le premier, le serveur d'entraînement :

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

Depuis un autre terminal, vérifie-le avant de le mélanger à quoi que ce soit d'autre. Si ces trois réponses ne ressortent pas ainsi, le problème se situe au niveau du serveur et non du panneau :

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

Dans le second terminal, le serveur de développement :

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

« Ready in 110 ms » : il n'a pas empaqueté ton code, voilà pourquoi cela prend si peu de temps. La dernière ligne indique que le serveur n'écoute que sur ta machine ; avec `--host` il s'ouvrirait à ton réseau local, ce qui n'est pas nécessaire. Ouvre `http://localhost:5173/` dans ton navigateur. Tu dois voir le titre « Revisor », un « Cargando… » fugace et quatre services avec une bordure verte ou rouge. Voici ce que Chrome en mode headless a renvoyé après avoir exécuté le JavaScript de la page (seul le conteneur est affiché) :

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

La page étant ouverte, effectue le test qui justifie à lui seul l'existence du serveur de développement : remplace dans `Panel.tsx` le texte `Revisor` du `<h1>` par `Revisor de servicios` et enregistre le fichier. La page s'actualise toute seule, sans rechargement, et la liste reste bien là : elle n'est pas repassée par « Cargando… ». C'est le *Fast Refresh* de 0.1.2. (On le constate visuellement, dans une fenêtre de navigateur ouverte ; aucun outil automatique du cours ne le mesure, et les exécutions de cette leçon faites avec Chrome en mode headless non plus : ce qui est affirmé ici correspond à la documentation du plugin React. Rétablis le texte d'origine une fois terminé.)

Pour finir, construis et examine la version qui serait publiée. Avec le serveur d'entraînement toujours en marche :

```text
$ npm run build
...
✓ built in 265ms
$ npm run preview

> revisor@0.0.0 preview
> vite preview

  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

`http://localhost:4173/` affiche le même panneau, cette fois à partir des fichiers de `dist/` et sans `StrictMode` actif, comme l'a confirmé le journal de 0.5. Arrête tout avec Ctrl+C dans chaque terminal ; le serveur d'entraînement s'arrête en affichant `servidor de práctica detenido`.

Une dernière vérification, celle qu'effectue toute validation automatique : supprimer `node_modules/`, réinstaller exactement ce qui figure dans le fichier de verrouillage avec `npm ci` et recommencer. Dans le conteneur Linux de « À propos des exécutions », à partir d'une copie sans `node_modules/` ni `dist/`, `npm ci`, `npm run lint` et `npm run build` ont abouti sans erreur, et la construction a produit les trois mêmes fichiers avec les mêmes noms (`index-tGGc24Rg.css` et `index-BWNt33lQ.js`). Que les noms coïncident n'est pas un détail anodin : les noms dans `dist/` sont calculés à partir du contenu, de sorte que si deux machines produisent les mêmes noms, il est très probable que le paquet soit le même (le nom ne porte qu'un fragment du hash du contenu), et si les noms diffèrent, le contenu est différent.

## L'erreur que tu vas voir

La leçon comporte une erreur principale, née du fait que Vite ne vérifie pas les types, et deux erreurs secondaires.

**L'erreur principale : « chez moi, ça construit ».** Change dans `Panel.tsx` le type de la prop `cadaMs` de `number` en `string` et construis des deux manières :

```text
$ npx vite build
...
✓ built in 79ms
$ npm run build

> revisor@0.0.0 build
> tsc -b && vite build

src/main.tsx(15,35): error TS2322: Type 'number' is not assignable to type 'string'.
src/reporte/Panel.tsx(46,3): error TS2322: Type 'number' is not assignable to type 'string'.
src/reporte/Panel.tsx(51,50): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

`vite build` se termine avec sa coche verte : il a effacé les types et empaqueté. `npm run build` s'interrompt à `tsc -b` avec trois erreurs, et `vite build` ne commence même pas. Cela se lit comme toute erreur TypeScript : fichier, ligne et colonne entre parenthèses, code de l'erreur et ce qui ne concorde pas avec quoi. Les trois erreurs correspondent au même désaccord observé depuis trois endroits : `main.tsx` transmet un nombre là où du texte est désormais attendu, la valeur par défaut `10_000` est un nombre, et `useReporte` reçoit du texte là où il attend un nombre. La correction consiste à rétablir le type ; la leçon à en tirer est autre : **la coche de Vite signifie « j'ai empaqueté », et non « tout est correct ».** En développement, il se passe la même chose, avec un danger accru : `npm run dev` sert le fichier contenant l'erreur et le panneau peut même fonctionner, car au moment de l'exécution, un nombre que le type qualifie de « texte » reste un nombre. Surveille ton éditeur, et avant de livrer, lance `npm run build`.

**Une faute de frappe dans une variable.** Écris `VITE_CADA_MZ` au lieu de `VITE_CADA_MS` dans `configuracion.ts` :

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

C'est le travail de `strictImportMetaEnv` (0.4). Sans cette ligne dans `vite-env.d.ts`, le nom erroné compilerait, vaudrait `undefined` dans le navigateur, `leerCadaMs` utiliserait la valeur par défaut et personne ne comprendrait pourquoi la variable « ne fonctionne pas ».

**L'avertissement qui n'arrête rien.** C'est celui de 0.6 : `exhaustive-deps` est un avertissement, ESLint se termine avec le code 0 et une vérification qui ne regarderait que le code de sortie dirait « propre ». Le signe pour le reconnaître est la ligne `✖ 1 problem (0 errors, 1 warning)` suivie de rien. Avec `--max-warnings 0`, il s'affiche en plus `ESLint found too many warnings (maximum: 0).` et la commande échoue.

## Ce qui se fait de travers

**Exécuter uniquement `vite build` ou uniquement `npm run dev`.** Ni l'un ni l'autre ne vérifie les types. Un flux qui ne passe pas par `tsc -b` peut livrer un paquet contenant des erreurs de type ; c'est pourquoi le script `build` commence par lui.

**Placer un secret dans une variable `VITE_`.** N'importe quelle variable `VITE_` peut se retrouver écrite dans le JavaScript public (celle que le code lit, à coup sûr ; toutes, si une ligne lit l'objet entier), comme tu l'as constaté avec `grep`. Changer le nom de la variable pour qu'elle ne le porte pas ne la rend pas plus sûre : si le navigateur en a besoin, le navigateur l'a. Les clés résident sur un serveur.

**Ouvrir CORS avec `*` sur l'API pour que cela fonctionne en développement.** Cela résout un désagrément sur ta machine au prix d'une décision de sécurité qui affecte tout le monde. En développement, le *proxy* de Vite élimine le problème sans toucher à l'API.

**Retirer `StrictMode` parce qu'il « fait deux requêtes ».** La deuxième requête est la preuve que le nettoyage de l'effet fonctionne, et en production elle n'existe pas. Le retirer dissimule précisément les erreurs qu'il est venu révéler.

**Faire taire le linter.** Un `// eslint-disable-next-line react-hooks/exhaustive-deps` laisse l'effet avec une liste de dépendances mensongère, et le défaut persiste alors que l'avertissement est désactivé. Si la règle se plaint, modifie le code.

**Laisser passer les avertissements.** Sans `--max-warnings 0`, un avertissement de dépendances n'arrête rien et, avec le temps, plus personne ne lit la sortie du linter sous prétexte qu'« il y a toujours quelque chose ».

**Versionner `node_modules/` ou `dist/` dans le dépôt.** Ils se reconstruisent à l'identique avec `npm ci` et `npm run build`. Ce que l'on versionne en revanche, c'est `package-lock.json`, qui permet justement de les reconstruire.

**Dépendances sans version exacte.** Avec `^` dans `package.json`, deux personnes qui installent à quelques jours d'intervalle peuvent se retrouver avec des versions distinctes. Le fichier de verrouillage aide, mais seulement s'il est versionné dans le dépôt et installé avec `npm ci`.

**Laisser Vite changer de port silencieusement.** Sans `strictPort`, un serveur oublié sur 5173 pousse le nouveau à démarrer sur 5174, et tu finis par regarder l'ancienne version. Avec `strictPort: true`, le second refuse de démarrer.

## Exercices

### Exercice 1 — Change l'intervalle sans toucher au code

Fais en sorte que le panneau se mette à jour toutes les 3 secondes sans modifier aucun fichier de `src/`. **Avant de le faire, prédis** combien de lignes `GET /api/estados 200` le serveur d'entraînement écrit dans les 10 secondes suivant l'ouverture de la page avec `npm run dev`. Fais le test avec deux mécanismes différents : en définissant la variable dans le terminal et en créant un fichier `.env.local`. Lequel des deux l'emporte s'ils sont tous les deux présents ? Pourquoi `.env.local` ne doit-il pas être versionné dans le dépôt, et quelle ligne du `.gitignore` l'empêche ?

### Exercice 2 — Répare la figure 2

Corrige `fig00_02.tsx` pour que `npx eslint fig00_02.tsx` ne signale rien et que le composant continue de ne rien afficher quand `visible` vaut `false`. Avant d'écrire, explique dans ton journal de bord pourquoi déplacer le `if` sous les hooks ne change rien à ce que l'utilisateur voit.

### Exercice 3 — Le *proxy* manquant

Ajoute à `vite.config.ts` le nécessaire pour que `curl http://localhost:5173/salud` réponde `ok`. **Avant**, prédis ce que répond aujourd'hui cette même requête et pourquoi il ne s'agit pas d'un 404 de l'API. Vérifie ta prédiction avant de modifier quoi que ce soit.

### Exercice 4 — Le nettoyage manquant

Dans `useReporte`, supprime temporairement la ligne `control.abort();` du nettoyage de l'effet. Le serveur d'entraînement et `npm run dev` étant démarrés, ouvre la page et lis le journal du serveur. Qu'est-ce qui a changé par rapport à 0.5 ? Que te dit cela sur ce que `StrictMode` était en train de vérifier ? Le linter te prévient-il ? Rétablis la ligne une fois terminé.

## Solutions

### Solution 1

Dans le terminal, la variable se place devant la commande et ne vaut que pour ce processus :

```bash
VITE_CADA_MS=3000 npm run dev
```

Avec `.env.local`, le fichier contient une ligne, `VITE_CADA_MS=3000`, et Vite la lit au démarrage (si le serveur était déjà démarré, redémarre-le). La prédiction : en 10 secondes, la requête du montage plus une toutes les 3 secondes, c'est-à-dire quatre réponses `200`, **plus**, si la connexion a le temps d'atteindre le serveur avant l'annulation (0.5), une ligne `cancelada por el cliente` au tout début, qui correspond au cycle supplémentaire de `StrictMode`. C'est ainsi que la mesure a été prise avec Chrome en mode headless pendant 10 secondes de son horloge interne : une annulée et quatre `200`. Si les deux sources sont présentes, c'est le terminal qui l'emporte : la documentation de Vite indique que les variables déjà existantes au démarrage de Vite ne sont pas écrasées par les fichiers `.env`. `.env.local` existe précisément pour les valeurs propres à ta machine, et la ligne `*.local` du `.gitignore` empêche qu'il soit versionné dans le dépôt. Une fois terminé, supprime le fichier pour que ton projet coïncide à nouveau avec le point de contrôle.

### Solution 2

Les hooks se placent en premier et la condition décide uniquement de ce qui est affiché ; la liste de dépendances nomme ce que l'effet utilise :

```tsx
// fig00_02.tsx corregida (fragmento)
export function Resumen({ cadaMs, visible }: { readonly cadaMs: number; readonly visible: boolean }) {
  const [vueltas, establecerVueltas] = useState(0);

  useEffect(() => {
    const temporizador = setInterval(() => establecerVueltas((n) => n + 1), cadaMs);
    return () => clearInterval(temporizador);
  }, [cadaMs]);

  if (!visible) {
    return null;
  }

  return <p>{vueltas} actualizaciones</p>;
}
```

Ce que l'utilisateur voit ne change pas, car le `return null` intervient toujours avant d'afficher le paragraphe. Ce qui change, c'est que les deux hooks sont appelés à chaque rendu, dans le même ordre, et React peut les associer à leur état. Remarque une conséquence qui mérite d'être discutée dans ton journal de bord : avec `visible` à `false`, le minuteur continue de tourner bien que rien ne soit visible. Si ce n'est pas ce que tu souhaites, la solution ne consiste pas à replacer le `if` en haut, mais à faire en sorte que celui qui utilise `Resumen` ne le rende pas : `{visible && <Resumen cadaMs={5000} />}` (attention à cette syntaxe lorsque la condition est un nombre : c'est le piège du `0` de la [Leçon 1](01-componentes-puros-composicion.md)).

### Solution 3

Aujourd'hui, `curl http://localhost:5173/salud` n'atteint pas l'API : le chemin ne commence pas par `/api`, il est donc pris en charge par Vite. Pour le serveur de développement d'une application monopage, un chemin inconnu ne constitue pas une erreur : il répond avec `index.html`, afin que le routeur du client décide (la Leçon 5 reviendra là-dessus). Tu recevras le code HTML de la page, avec le code 200, et non `ok`. Vérifie-le avant de modifier quoi que ce soit ; c'est une saine habitude de ne pas se fier aveuglément à sa prédiction. Pour la réexpédier, ajoute une autre clé :

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Redémarre `npm run dev` pour qu'il prenne en compte la nouvelle configuration, et la réponse sera `ok`. Cet exercice est la raison d'être de la recommandation de 0.3 : si toutes les routes de l'API vivaient sous `/api`, une seule clé suffirait.

### Solution 4

Sans `control.abort()`, le journal cesse d'afficher la ligne `cancelada por el cliente` : désormais, **deux** `GET /api/estados 200` apparaissent lors de l'ouverture de la page. La première requête, celle du montage que `StrictMode` a défait, n'est plus annulée par personne ; sa réponse arrive et écrit l'état d'un effet qui avait déjà été nettoyé. Dans ce panneau, cela ne saute pas aux yeux, parce que les deux réponses sont identiques, mais si la première était plus lente et apportait des données périmées, elle écraserait la seconde : c'est la concurrence entre les réponses (*race condition*) que la Leçon 3 reproduit et corrige. `StrictMode` vérifiait précisément cela, que le nettoyage défait bien ce que l'effet avait commencé. Et le linter ? Il ne dit rien : le nettoyage manquant n'enfreint aucune règle décelable dans le texte du code. C'est pourquoi `StrictMode` et le linter sont deux défenses distinctes, et le cours emploie les deux.

## Comment savoir que j'ai réussi

- [ ] `node -v` affiche une version commençant par `v24`, et `npx tsc --version`, dans `~/curso-react/revisor/`, affiche `Version 7.0.2`.
- [ ] Le serveur d'entraînement étant démarré, `curl -s http://127.0.0.1:3100/salud` répond `ok`, et `curl -s http://localhost:5173/api/estados` (avec `npm run dev` démarré) renvoie le JSON des quatre services.
- [ ] L'ouverture de `http://localhost:5173/` affiche le titre « Revisor » et quatre services, et le journal du serveur d'entraînement enregistre un `200` à l'ouverture de la page. Si en plus un `cancelada por el cliente` apparaît auparavant, tu sais l'interpréter comme le cycle supplémentaire de `StrictMode` ; s'il n'apparaît pas, tu sais pourquoi cela ne signifie pas qu'il est désactivé (0.5).
- [ ] Avec la version construite (`npm run preview`, sur `http://localhost:4173/`), la même page produit une seule requête dans le journal.
- [ ] `npm run lint` se termine sans signaler aucun problème, et le fait de retirer `cadaMs` de la liste de dépendances de `useReporte` le fait échouer avec `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` se termine avec `✓ built` et dépose dans `dist/` un `index.html`, un `.css` et un `.js` ; en modifiant un type exprès, il s'interrompt à `tsc -b` et `vite build` n'arrive pas à s'exécuter.
- [ ] Tu peux prouver avec `grep` sur `dist/` que la valeur de `VITE_CADA_MS` voyage à l'intérieur du JavaScript, et expliquer pourquoi cela exclut formellement d'y placer un secret.
- [ ] `git status` au sein du projet n'affiche ni `node_modules/` ni `dist/` parmi les fichiers à ajouter.
- [ ] Tu as noté dans ton [journal de bord](bitacora.md) tes versions, ce qui a changé par rapport à l'empaquetage avec esbuild et le premier avertissement que t'a donné le linter.

## Résumé

Réponds sans regarder la leçon :

1. Quelles sont les deux tâches distinctes qu'accomplit Vite et laquelle des deux procède à un empaquetage ? Pourquoi le serveur de développement n'a-t-il pas besoin d'empaqueter ?
2. Pourquoi le script `build` commence-t-il par `tsc -b` ? Que se passe-t-il si tu lances uniquement `vite build` avec une erreur de type ?
3. Que vérifie `tsconfig.app.json` et que vérifie `tsconfig.node.json` ? Pourquoi l'un comporte-t-il `DOM` et l'autre non ?
4. Pourquoi avec `"moduleResolution": "bundler"` n'écris-tu plus `.js` à la fin des `import` ?
5. Qu'est-ce qu'une origine ? Pourquoi le panneau sur le port 5173 ne peut-il pas lire une réponse provenant du port 3100, et comment le *proxy* résout-il cela sans toucher à l'API ?
6. Quelles variables parviennent à `import.meta.env`, à quel moment leur valeur est-elle remplacée et pourquoi aucun secret n'y a sa place ?
7. Que fait `StrictMode` avec les effets en développement, et que prouve la ligne `cancelada por el cliente` dans le journal ?
8. Que vérifient `rules-of-hooks` et `exhaustive-deps` ? Pourquoi le cours exécute-t-il ESLint avec `--max-warnings 0` ?

## Pour aller plus loin

- [Vite, « Getting Started »](https://vite.dev/guide/) : comment créer un projet, la liste des modèles, la version de Node requise et pourquoi `index.html` est le point d'entrée. Consulté le 21 octobre 2026.
- [Vite, « Why Vite »](https://vite.dev/guide/why) : les problèmes que résout le serveur de développement et pourquoi on empaquète pour la production ; Rolldown et Oxc. Consulté le 21 octobre 2026.
- [Vite, « Announcing Vite 8 »](https://vite.dev/blog/announcing-vite8) : Rolldown comme empaqueteur unique, depuis le 12 mars 2026. Consulté le 21 octobre 2026.
- [Vite, « Dependency Pre-Bundling »](https://vite.dev/guide/dep-pre-bundling) : pourquoi Vite pré-empaquète les dépendances en développement, et qu'il le fait avec Rolldown. Consulté le 21 octobre 2026.
- [Vite, « Features »](https://vite.dev/guide/features) : TypeScript sans vérification des types, `isolatedModules`, les types de `vite/client` et l'importation de CSS. Consulté le 21 octobre 2026.
- [Vite, « Env Variables and Modes »](https://vite.dev/guide/env-and-mode) : le préfixe `VITE_`, l'ordre de priorité des fichiers `.env`, l'avertissement sur les informations sensibles et les types avec `strictImportMetaEnv`. Consulté le 21 octobre 2026.
- [Vite, « Server Options »](https://vite.dev/config/server-options) et [« Preview Options »](https://vite.dev/config/preview-options) : `server.proxy`, `server.port`, `strictPort` et le *proxy* hérité par `vite preview`. Consulté le 21 octobre 2026.
- [Vite, « Deploying a Static Site »](https://vite.dev/guide/static-deploy) : pourquoi `vite preview` n'est pas un serveur de production. Consulté le 21 octobre 2026.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react) : *Fast Refresh*, le *runtime* automatique de JSX et l'option du compilateur. Consulté le 21 octobre 2026.
- [React, « StrictMode »](https://react.dev/reference/react/StrictMode) : les vérifications en développement, le cycle supplémentaire des effets et pourquoi elles n'affectent pas la construction. Consulté le 21 octobre 2026.
- [React, « eslint-plugin-react-hooks »](https://react.dev/reference/eslint-plugin-react-hooks) : la configuration recommandée, les règles des hooks et celles du compilateur. Consulté le 21 octobre 2026.
- [React, « Build a React app from Scratch »](https://react.dev/learn/build-a-react-app-from-scratch) et [« Sunsetting Create React App »](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) : quand un outil comme Vite convient, et le retrait de Create React App. Consulté le 21 octobre 2026.
- [MDN, « Cross-Origin Resource Sharing (CORS) »](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) : la politique de même origine pour `fetch()` et l'en-tête `Access-Control-Allow-Origin`. Consulté le 21 octobre 2026.
- [TypeScript, « TSConfig Reference »](https://www.typescriptlang.org/tsconfig/) : `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` et les références de projet. Consulté le 21 octobre 2026.
- [typescript-eslint, « Dependency Versions »](https://typescript-eslint.io/users/dependency-versions/) : les versions de TypeScript et d'ESLint prises en charge. Consulté le 21 octobre 2026.
- [Node.js, « Modules: TypeScript »](https://nodejs.org/api/typescript.html), [« Download »](https://nodejs.org/en/download) et [« Previous Releases »](https://nodejs.org/en/about/previous-releases) : exécuter des fichiers `.ts` directement avec Node et les conditions requises ; les versions de la branche 24 LTS. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| serveur de développement | le processus que démarre `npm run dev` : sert chaque module séparément, traduit à la volée, et prévient le navigateur lorsqu'un fichier change |
| HMR / *Fast Refresh* | remplacer dans la page uniquement le module qui a changé, sans recharger ; dans React, préserve l'état des composants qui n'ont pas changé |
| construction | ce que réalise `npm run build` : vérifier les types et empaqueter dans `dist/` les fichiers qui sont publiés |
| références de projet | plusieurs petits `tsconfig` que `tsc -b` vérifie séparément, chacun avec ses propres règles |
| origine | la combinaison d'un schéma, d'un hôte et d'un port d'une adresse ; deux ports distincts sont deux origines |
| politique de même origine | la règle du navigateur qui empêche un script de lire des réponses provenant d'une autre origine, sauf si la réponse l'autorise avec CORS |
| *proxy* (de développement) | la réexpédition effectuée par Vite de certaines routes vers un autre serveur, afin que le navigateur ne voie qu'une seule origine |
| variable `VITE_` | configuration que Vite écrit à l'intérieur du code client ; publique par définition |
| `StrictMode` | composant de React qui, uniquement en développement, effectue un double rendu et exécute un cycle supplémentaire pour chaque effet afin de révéler des erreurs |
| `--max-warnings 0` | option d'ESLint qui fait échouer la commande s'il existe au moins un avertissement |

---

**Suivante :** [Leçon 1 — Composants purs et composition](01-componentes-puros-composicion.md)
