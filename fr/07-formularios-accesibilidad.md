# Leçon 7 — Formulaires, actions et accessibilité

*Vendredi, 17 h 52, et le gel des changements tombe à 18 h. L'équipe d'exploitation doit enregistrer le service `correo` dans l'outil interne avant de partir, et la personne d'astreinte est Raúl, qui travaille avec un lecteur d'écran. Il remplit les trois champs, appuie sur Entrée et n'entend rien. Il appuie de nouveau sur Entrée : rien. Il ne sait pas si l'enregistrement a eu lieu, s'il a eu lieu deux fois ou si le formulaire attend quelque chose. Ce qui s'est passé, c'est que l'adresse ne commençait pas par `https://` : la page a coloré le champ en rouge et écrit l'erreur en dessous, dans un texte que personne n'a relié au champ ni à un avis. Pour qui regarde l'écran, l'erreur sautait aux yeux. Pour Raúl, elle n'existait pas. Il reste huit minutes. Le formulaire dont il a besoin est celui que cette leçon construit, et le second Entrée, celui que personne n'a entendu, c'est toi qui le corrigeras dans l'exercice 3.*

**Durée :** 2 × 45 min (la coupure naturelle se situe entre les sections 7.2 et 7.3)

**Ce que tu construis :** l'enregistrement d'un service dans le `revisor` : une nouvelle page sur `/servicios/nuevo`, avec un formulaire de trois champs validé par le schéma du cours de TypeScript, envoyé à l'API d'entraînement, qui affiche les erreurs à côté de chaque champ et annonce le résultat à qui utilise un lecteur d'écran

**Ce que tu apprends :** contrôlé ou non contrôlé ; `<form action>`, `useActionState`, `useFormStatus` et `useOptimistic` ; valider avec le schéma de la leçon 6 de TypeScript ; `aria-invalid` avec `aria-describedby` ; les zones dynamiques (*live regions* : `role="status"`, `role="alert"`) ; le HTML natif avant ARIA ; le parcourir au clavier

**D'où tu viens.** Du point de contrôle de la [Leçon 6](06-reducer-contexto.md) : un `revisor` avec des routes (la liste sur `/`, le détail sur `/servicios/:nombre` et une page « non trouvée »), les données du serveur dans TanStack Query, une boîte d'avis avec son reducer et son contexte, et des préférences d'affichage. L'API d'entraînement possède depuis la [Leçon 4](04-estado-del-servidor.md) la route que cette leçon utilise pour la première fois : `POST /api/servicios`, qui renvoie `201` avec le nouveau service, `400` avec les champs invalides ou `409` si le nom existe déjà. Du cours de TypeScript, tu apportes, si tu l'as suivi, la notion de **schéma** : une valeur qui sait lire `unknown` et dont on dérive un type. Si tu ne l'as pas suivi, il est présenté ici en entier.

**Ce que cette leçon ne fait pas.** Elle n'utilise aucune bibliothèque de formulaires ni de validation : tout provient de React et du schéma que tu connais déjà, volontairement, pour que tu voies ce que résout chaque pièce. Elle n'utilise ni Server Functions ni Server Components : `<form action>` reçoit ici une fonction qui s'exécute dans le navigateur (la raison pour laquelle le panneau n'utilise pas de Server Components est discutée dans la [Leçon 9](09-rendimiento-publicacion.md)). Elle n'ajoute pas de tests automatisés : le comportement du formulaire est montré avec des figures qui s'exécutent dans un DOM de test et avec le point de contrôle ouvert dans un navigateur. Et ce n'est pas un cours d'accessibilité : elle enseigne ce dont ce formulaire a besoin, en s'appuyant sur les sources qui le définissent, et nomme ce qui ne peut pas être vérifié sans une personne et un lecteur d'écran.

**À propos des exécutions.** Tout a été exécuté le 21 octobre 2026 avec Node.js 24.22.0 et npm 11.19.1, sous macOS, avec les versions exactes du `package.json` de cette leçon. Les points de contrôle de cette leçon et des deux suivantes ont été installés de zéro avec `npm ci`, et `npm run lint` ainsi que `npm run build` se sont terminés sans erreur ; celui de cette leçon a produit `dist/assets/index-WLyq37jn.js`. L'exécution n'a pas été répétée dans un conteneur Linux. L'erreur du compilateur de « L'erreur que tu vas voir » a été provoquée dans une copie du point de contrôle, pas dans l'original. Les figures ont été exécutées avec leur propre `package.json` dans [`programas/07-formularios-accesibilidad/`](../programas/07-formularios-accesibilidad), aux côtés de `revisor/` ; elles sont compilées avec `tsc` et exécutées avec `node`, comme dans les leçons précédentes, et ajoutent une seule nouvelle dépendance, `dom-accessibility-api` 0.7.1, qui calcule le nom et la description accessibles d'un élément selon la spécification du W3C. Ce que l'on voit « dans le navigateur » a été mesuré avec Chrome en mode headless : le HTML de `/servicios/nuevo` avec `--headless --dump-dom` face à `vite preview`, et l'arbre d'accessibilité, le focus et les zones dynamiques en pilotant Chrome par son protocole de débogage (*Chrome DevTools Protocol*) avec un script Node, face à `npm run dev` et à l'API d'entraînement. Ces exécutions ont utilisé les ports 4107, 5107 et 3107 au lieu de 4173, 5173 et 3100, car d'autres processus tournaient en même temps sur la machine ; pour faire pointer le *proxy* sur l'API du port 3107, `vite.config.ts` a été modifié dans une **copie** du point de contrôle, pas dans l'original. Pour toi, rien ne change. Les mesures « avant » ont été faites avec le formulaire tel qu'il était avant les corrections de cette leçon (le succès annoncé deux fois, sans `required`, sans `aria-atomic` sur la boîte d'avis, sans `startTransition` et avec `disabled={pending}` sur le bouton), dans cette même copie ; celles « après », avec le point de contrôle. Rien n'a tourné sur un vrai Linux Mint ; rien de ce qui est montré ne dépend du système. **Ce qui n'a pas été mesuré**, et c'est signalé là où cela apparaît : la façon dont le formulaire sonne dans un vrai lecteur d'écran (NVDA, Orca ou VoiceOver) et le parcours au clavier dans une vraie fenêtre. Ces deux vérifications figurent dans « Comment savoir que j'ai réussi », avec la marche à suivre pour les faire manuellement. Les chemins longs sont affichés à partir de `~/curso-react`.

## À la fin, tu seras capable de

- Expliquer la différence entre un champ contrôlé et un champ non contrôlé, provoquer l'avertissement de React d'un `value` sans `onChange` et décider lequel des deux convient à un formulaire envoyé d'un bloc.
- Connecter un `<form action>` à `useActionState`, lire dans l'état ce qu'a renvoyé la dernière action et afficher « Dando de alta… » avec `useFormStatus` depuis un composant enfant du formulaire.
- Démontrer avec une figure que React vide les champs non contrôlés après une action, et conserver la saisie lorsqu'il y a eu des erreurs.
- Valider les trois champs avec un schéma qui rassemble **toutes** les erreurs, et vérifier avec le compilateur que le schéma et le type `NuevoServicio` ne peuvent pas diverger.
- Marquer un champ invalide avec `aria-invalid` et `aria-describedby`, et mesurer avec une figure le nom et la description accessibles que reçoit un lecteur d'écran.
- Choisir entre `role="status"` et `role="alert"` pour un avis, et expliquer avec la spécification pourquoi la zone dynamique doit exister **avant** l'arrivée du message.
- Lire dans l'arbre d'accessibilité de Chrome si un champ est obligatoire ou invalide et si une zone dynamique est lue en entier, avant et après une modification.

## Le pourquoi avant le comment

Jusqu'à la leçon 6, le `revisor` ne faisait que **lire** : il demandait le rapport, il demandait le détail, et la seule modification qu'il envoyait à l'API était un clic sur « Volver a revisar », sans données. Enregistrer un service est un problème d'une autre nature, car la personne saisit du texte, et ce qu'elle saisit peut être faux de bien des façons à la fois. Pose quatre questions au panneau et tu verras ce qui manque.

**Où vit ce qui est saisi pendant la saisie ?** Un champ de texte conserve déjà sa valeur ; le navigateur le fait depuis toujours. Tu peux le laisser la conserver et la lire à l'envoi, ou copier chaque frappe dans un état React. Les deux façons fonctionnent et les deux ont un coût. Choisir sans savoir laquelle est laquelle mène à des formulaires qui émettent des avertissements dans la console, qui perdent la saisie ou qui se re-rendent à chaque frappe sans nécessité.

**Qui se charge de l'envoi ?** Envoyer ne tient pas en une ligne de code. Il faut empêcher le navigateur de recharger la page, rassembler les valeurs, montrer qu'une opération est en cours, interdire un second envoi entre-temps, attendre la réponse, la convertir en erreurs ou en succès, et mettre à jour la liste des services qu'une autre page affiche. React 19 fournit des pièces pour chacune de ces étapes, et cette leçon les utilise au lieu de les réinventer.

**Qui décide si une valeur est valide ?** Le panneau valide déjà ce qui **arrive** de l'API avec des gardes comme `esReportePublico`. Ce que la personne saisit est aussi une entrée à une frontière, et mérite le même traitement. Le cours de TypeScript a enseigné à le faire avec des schémas ; ils sont réutilisés ici, avec une différence qui compte : un formulaire ne peut pas s'arrêter à la première erreur.

**Comment est informée la personne qui ne voit pas l'écran ?** C'est la scène du début. Une bordure rouge et un texte sous le champ sont des informations **visuelles**. Pour qu'un lecteur d'écran les annonce, le texte doit être **relié** au champ, et le message « vérifie les champs » doit vivre à un endroit que le lecteur surveille. Cela ne s'obtient pas avec de bonnes intentions : cela s'obtient avec des attributs concrets, définis dans une spécification du W3C, et cela se mesure.

Les quatre réponses tiennent en trois concepts : le champ non contrôlé (7.1), le formulaire en tant qu'**action** (7.2) et l'accessibilité du formulaire et de ses avis (7.3). La section 7.4 rassemble le tout dans le `revisor` et le vérifie point par point au regard des sources. À la fin, voici ce que rend `/servicios/nuevo` (sortie de Chrome en mode headless, le formulaire uniquement) :

```text
<form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" novalidate="" aria-describedby="resultado-alta"><div class="campo"><label for="nombre">Nombre</label><input id="nombre" required="" aria-invalid="false" aria-describedby="nombre-ayuda" type="text" value="" name="nombre"><p id="nombre-ayuda" class="ayuda">Un nombre corto y único, por ejemplo: correo</p></div><div class="campo"><label for="url">Dirección</label><input id="url" required="" aria-invalid="false" aria-describedby="url-ayuda" type="url" value="" name="url"><p id="url-ayuda" class="ayuda">La dirección que se va a revisar, con http:// o https://</p></div><div class="campo"><label for="timeoutMs">Tiempo límite (ms)</label><input id="timeoutMs" required="" aria-invalid="false" aria-describedby="timeoutMs-ayuda" type="text" value="" name="timeoutMs"><p id="timeoutMs-ayuda" class="ayuda">Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500</p></div><button type="submit" aria-disabled="false">Dar de alta</button></form><div id="resultado-alta"><div role="alert"></div></div>
```

Chaque attribut de ce HTML a une raison d'être, et à la fin de la leçon tu sauras dire laquelle. Un seul n'a pas été écrit par toi : l'`action="javascript:throw new Error(…)"` du `<form>`. C'est la marque que React pose lorsque `action` est une fonction. Elle ne s'exécute jamais lors d'un envoi normal, car React intercepte l'envoi avant ; elle ne se déclencherait que si quelqu'un appelait `form.submit()` manuellement, ce qui contourne l'événement d'envoi, et l'erreur explique alors ce qui s'est passé et suggère `requestSubmit()`. Quant aux `value=""`, ils sont le reflet de `defaultValue` dans le HTML, pas un champ contrôlé.

## Les concepts

### 7.1 Contrôlé ou non contrôlé

#### 7.1.1 Le navigateur conserve déjà ce que tu saisis

Un `<input>` du navigateur possède sa propre valeur. Si tu saisis du texte dedans, la valeur change sans que personne n'ait rien programmé. React te permet de travailler de deux manières avec ce fait, et la documentation de `<input>` les nomme ainsi ([React, `<input>`](https://react.dev/reference/react-dom/components/input)) :

- **Non contrôlé.** Tu écris `<input defaultValue="correo" />`. React pose la valeur **initiale** puis s'efface : ce que la personne saisit vit dans l'élément du DOM, et tu le lis quand tu en as besoin (à l'envoi, par exemple). La documentation le dit avec précision : même si tu passes une valeur initiale, ton JSX « ne fait que spécifier la valeur initiale ; il ne contrôle pas ce que la valeur doit être maintenant ».
- **Contrôlé.** Tu écris `<input value={nombre} onChange={…} />`. React force le champ à afficher **toujours** la valeur que tu lui passes. Chaque frappe déclenche `onChange`, tu mets à jour l'état, React refait le rendu et le champ affiche la nouvelle valeur. Si tu ne mets pas l'état à jour, le champ ne change pas.

La première figure place les deux côte à côte, plus un troisième qui mélange mal les deux idées : un `value` sans `onChange`. Dans les trois cas, la figure « saisit » `correo2` comme le ferait une personne (elle modifie la valeur et déclenche l'événement `input`) et lit ce qui reste. Le champ contrôlé a une petite subtilité pour qu'on voie bien qui commande : son `onChange` enregistre le texte en majuscules.

```tsx
// fig07_01.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom decide al CARGARSE si hay un DOM con eventos `input`; por eso se
// importa después de preparar `window`, y no arriba con los demás.
const { createRoot } = await import("react-dom/client");

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

// Escribe en un <input> como lo haría una persona: cambia el valor y avisa con un evento.
function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

function NoControlado() {
  return <input aria-label="no controlado" defaultValue="correo" />;
}

function Controlado() {
  const [nombre, establecerNombre] = useState("correo");
  return (
    <>
      <input aria-label="controlado" value={nombre} onChange={(e) => establecerNombre(e.target.value.toUpperCase())} />
      <output>{nombre}</output>
    </>
  );
}

function SinOnChange() {
  return <input aria-label="sin onChange" value="correo" />;
}

async function probar(titulo: string, arbol: React.ReactNode, texto: string): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(arbol));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  await act(async () => escribir(campo, texto));
  console.log(`  escribí «${texto}» → el campo dice «${campo.value}»`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await probar("1. no controlado (defaultValue):", <NoControlado />, "correo2");
await probar("2. controlado (value + onChange):", <Controlado />, "correo2");
await probar("3. value sin onChange:", <SinOnChange />, "correo2");
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_01.tsx
$ node fig07_01.js
1. no controlado (defaultValue):
  escribí «correo2» → el campo dice «correo2»
2. controlado (value + onChange):
  escribí «correo2» → el campo dice «CORREO2»
3. value sin onChange:
  [aviso de React] You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
  escribí «correo2» → el campo dice «correo»
```

Lis les trois cas de bas en haut, c'est ainsi qu'on les comprend le mieux :

- **Le troisième** a reçu `correo2` et est revenu à `correo`. React l'a rétabli, car `value="correo"` dit que le champ vaut `correo` **toujours**, et personne ne modifie cette valeur. Auparavant, React a émis dans la console un avertissement qui mérite d'être lu en entier : tu as fourni un `value` sans `onChange`, cela rend le champ en lecture seule ; s'il doit pouvoir changer, utilise `defaultValue` ; sinon, ajoute `onChange` ou `readOnly`. C'est l'avertissement de cette section, et sa correction dépend de ce que tu voulais.
- **Le deuxième** a reçu `correo2` et affiche `CORREO2`. La valeur du champ est celle que **ton** état a décidée, pas celle qui a été saisie. C'est cela, « contrôlé » : tu peux transformer, refuser ou limiter chaque frappe.
- **Le premier** a reçu `correo2` et affiche `correo2`. React n'est pas intervenu.

Il existe un quatrième cas que la figure ne provoque pas, mais que la documentation mentionne : un champ ne peut pas passer de non contrôlé à contrôlé au cours de sa vie. Si un `value` commence à `undefined` (par exemple parce que l'état n'a pas encore de donnée) puis reçoit un texte, React avertit qu'un composant « fait passer un champ non contrôlé à contrôlé ». La correction consiste à ce que `value` soit un texte dès le premier rendu, même `""`.

#### 7.1.2 Lequel convient à ce formulaire

La documentation de React ne désigne pas de gagnant, et ce cours non plus : c'est un principe propre au cours, avec une règle pratique. **Contrôle un champ lorsque l'écran a besoin de sa valeur pendant la saisie** : un champ de recherche qui filtre la liste à chaque lettre (comme celui de la Leçon 5, qui conserve en plus le texte dans l'URL), un compteur de caractères, un bouton qui s'active lorsque le champ n'est plus vide. **Laisse-le non contrôlé lorsqu'il n'importe qu'à l'envoi.**

L'enregistrement du `revisor` relève du second cas. Personne n'a besoin du nom du service pendant la saisie ; on en a besoin complet, avec les deux autres champs, au moment de l'envoi. Contrôler les trois représenterait trois états, trois `onChange` et un rendu du formulaire entier à chaque frappe, pour finir par faire ce que le navigateur fait gratuitement. C'est pourquoi le `Campo` du point de contrôle est **non contrôlé**, avec `defaultValue`. La section suivante montre la pièce qui rend cela confortable : React lit les valeurs pour toi à l'envoi, dans un `FormData`, et utilise en outre `defaultValue` d'une manière qui n'a rien d'évident et que la figure 3 mesure.

### 7.2 Le formulaire en tant qu'action

#### 7.2.1 `<form action>` reçoit une fonction

En HTML, l'attribut `action` d'un formulaire est une **adresse** : à l'envoi, le navigateur transmet les champs à cette adresse et charge la réponse comme une nouvelle page. React 19 étend cet attribut : si au lieu d'une adresse tu lui passes une **fonction**, React intercepte l'envoi, rassemble les champs dans un `FormData` et appelle ta fonction avec. La documentation de `<form>` le décrit en trois phrases qu'il vaut la peine de lire ensemble ([React, `<form>`](https://react.dev/reference/react-dom/components/form)) : la fonction gère l'envoi à l'intérieur d'une *Transition* ; elle peut être asynchrone et reçoit un seul argument avec les données du formulaire ; et, contrairement à `onSubmit`, il n'est pas nécessaire d'appeler `e.preventDefault()`.

Une *Transition* est la manière dont React marque une mise à jour comme « non urgente » : tant qu'elle dure, React peut continuer à répondre à la personne et sait qu'une opération est **en attente**. Lorsque la fonction qui s'exécute dans une *Transition* s'appelle une « action » (*Action*), React lui offre trois cadeaux que cette leçon utilise : un état qui conserve ce qu'a renvoyé la dernière action (`useActionState`), un indicateur « en attente » pour les composants situés à l'intérieur du formulaire (`useFormStatus`) et un état temporaire affiché tant que l'action n'est pas terminée (`useOptimistic`).

Deux autres détails du même document apparaîtront dans le code. Le premier : lorsque `action` est une fonction, la méthode HTTP est `POST` quel que soit l'attribut `method`. C'est presque toujours sans importance, car le navigateur n'envoie rien de lui-même ; ta fonction décide quoi demander et comment. Le second, le plus surprenant : **« une fois que la fonction `action` a réussi, tous les champs non contrôlés du formulaire sont réinitialisés »**. La figure 3 le met à l'épreuve.

#### 7.2.2 `useActionState` : le résultat de la dernière action

Un formulaire doit se souvenir de ce qui est arrivé au dernier envoi : s'il y a eu des erreurs et lesquelles, ou si l'enregistrement a réussi. `useActionState` est le hook qui le conserve ([React, `useActionState`](https://react.dev/reference/react/useActionState)). Il reçoit une fonction et un état initial, et renvoie trois choses : l'état courant, une fonction pour déclencher l'action et un indicateur `isPending`.

```tsx
// fragmento
const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
// …
<form action={accion}>
```

La fonction que tu lui passes reçoit **deux** arguments : l'état précédent et ce qui a été envoyé (ici, le `FormData`). Ce qu'elle renvoie devient le nouvel état. Si cela te rappelle un reducer, c'est parce que c'en est un, à une différence près : elle peut être asynchrone et avoir des effets, comme interroger l'API. La documentation dit l'inverse de ce que tu attendrais après la Leçon 6 : cette fonction n'est **pas** appelée deux fois sous `StrictMode`, précisément parce qu'elle est conçue pour avoir des effets. Un détail qui déroute beaucoup de monde la première fois : comme l'état précédent est le premier argument, le `FormData` est le **second**. La documentation le précise dans sa section de dépannage, car c'est exactement l'inverse de ce qui se passe lorsque tu donnes à `action` une fonction isolée, sans `useActionState`, qui reçoit le `FormData` comme unique argument. Dans le point de contrôle, le premier argument s'appelle `_previo` : le tiret bas signifie « je le reçois, mais je ne l'utilise pas ».

Deux autres règles de la même page que le point de contrôle respecte. Le type de ce que renvoie la fonction doit être le même que celui de l'état initial : c'est pourquoi il existe un type `EstadoFormulario` avec ses trois variantes, et l'état initial est l'une d'elles. Et **si la fonction lève une erreur, React annule les actions en file d'attente et affiche le périmètre d'erreur (*error boundary*) le plus proche**. Dans le `revisor`, la fonction intercepte tout ce qui peut échouer et le convertit en un état `con-errores`, de sorte que ce chemin n'est jamais emprunté ; mais si un jour une erreur s'échappe, c'est le périmètre d'erreur de la route de la [Leçon 5](05-rutas-url-como-estado.md) qui l'intercepte, et non un écran blanc.

Voici l'état du formulaire. Trois variantes, une pour chaque chose qui a pu se produire :

```ts
// revisor/src/alta/estadoFormulario.ts
import type { ErroresAlta, TextosAlta } from "./esquemaAlta";

export type EstadoFormulario =
  | { readonly tipo: "inicial" }
  | {
      readonly tipo: "con-errores";
      readonly detalle: string;
      readonly errores: ErroresAlta;
      readonly textos: TextosAlta;
    }
  | { readonly tipo: "agregado"; readonly nombre: string };

export const estadoInicialFormulario: EstadoFormulario = { tipo: "inicial" };

export function textosDe(datos: FormData): TextosAlta {
  const texto = (clave: string): string => {
    const valor = datos.get(clave);
    return typeof valor === "string" ? valor : "";
  };

  return { nombre: texto("nombre"), url: texto("url"), timeoutMs: texto("timeoutMs") };
}
```

`textos` conserve **ce que la personne a saisi**, tel quel, sous forme de texte. Ce n'est pas la même chose que la valeur validée : `timeoutMs` est saisi comme `"1500"` et envoyé comme le nombre `1500`. Conserver les textes sert à les rendre aux champs en cas d'erreur, et c'est là qu'intervient la réinitialisation.

#### 7.2.3 La réinitialisation qui efface la saisie

La phrase de la documentation de `<form>` a une conséquence pratique immédiate : « a réussi » signifie « la fonction n'a pas levé d'erreur », et **non** « l'enregistrement a réussi ». Si ta fonction valide, trouve trois erreurs et renvoie un état `con-errores`, pour React elle a réussi, et React réinitialise les champs. La personne voit ses erreurs… et des champs vides. Elle doit tout ressaisir, y compris ce qui était correct.

À quelle valeur un champ est-il réinitialisé ? À celle de `defaultValue`. Et voici l'astuce qu'utilise le point de contrôle : React refait le rendu du formulaire avec le nouvel état **avant** de le réinitialiser, de sorte que si `defaultValue` provient de l'état, le champ est réinitialisé à ce que la personne avait saisi. La figure 3 le mesure avec un formulaire minimal : elle saisit `correo`, envoie, et lit le champ une fois l'action terminée. Elle le fait deux fois, avec `defaultValue` fixé à `""` et avec `defaultValue` tiré de l'état. Au passage, elle note ce qu'a vu `useFormStatus` depuis deux endroits, ce qui est le sujet de 7.2.4.

```tsx
// fig07_03.tsx
import { JSDOM } from "jsdom";
import { act, useActionState } from "react";
import { createRoot } from "react-dom/client";
import { useFormStatus } from "react-dom";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  FormData: dom.window.FormData,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const vistos: string[] = [];

function Boton() {
  const { pending } = useFormStatus();
  vistos.push(`hijo=${pending}`);
  return <button type="submit">{pending ? "Dando de alta…" : "Dar de alta"}</button>;
}

type Estado = { readonly vueltas: number; readonly ultimo: string };

function Formulario({ conservar }: { readonly conservar: boolean }) {
  const [estado, accion] = useActionState(async (previo: Estado, datos: FormData): Promise<Estado> => {
    await new Promise((listo) => setTimeout(listo, 10));
    return { vueltas: previo.vueltas + 1, ultimo: String(datos.get("nombre")) };
  }, { vueltas: 0, ultimo: "" });
  const { pending } = useFormStatus();
  vistos.push(`mismo=${pending}`);

  return (
    <form action={accion}>
      <input name="nombre" aria-label="Nombre" defaultValue={conservar ? estado.ultimo : ""} />
      <Boton />
    </form>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function enviar(conservar: boolean): Promise<void> {
  vistos.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Formulario conservar={conservar} />));
  const campo = contenedor.querySelector("input");
  const formulario = contenedor.querySelector("form");

  if (campo === null || formulario === null) {
    throw new Error("falta el formulario");
  }

  await act(async () => escribir(campo, "correo"));
  await act(async () => {
    formulario.requestSubmit();
    await new Promise((listo) => setTimeout(listo, 50));
  });

  console.log(`defaultValue ${conservar ? "desde el estado" : 'fijo en ""'}:`);
  console.log(`  pending visto: ${[...new Set(vistos)].join(", ")}`);
  console.log(`  después de la acción, el campo dice «${campo.value}»`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await enviar(false);
await enviar(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_03.tsx
$ node fig07_03.js
defaultValue fijo en "":
  pending visto: mismo=false, hijo=false, hijo=true
  después de la acción, el campo dice «»
defaultValue desde el estado:
  pending visto: mismo=false, hijo=false, hijo=true
  después de la acción, el campo dice «correo»
```

Avec `defaultValue` fixe, le champ est resté vide ; avec `defaultValue` tiré de l'état, il a conservé `correo`. C'est exactement ce que fait le `revisor` : lorsque l'état est `con-errores`, chaque `Campo` reçoit comme `valorInicial` le texte que la personne a saisi. Lorsque l'état est `agregado`, les textes reviennent à `""` et le formulaire est propre pour le prochain enregistrement, ce qui est bien ce que l'on veut après un succès.

Pour que le formulaire de la figure puisse être envoyé dans un DOM de test, il a fallu dire à Node d'utiliser le `FormData` de jsdom (`FormData: dom.window.FormData`) : sans cette ligne, React construit le `FormData` avec celui de Node, qui ne sait pas lire un formulaire jsdom, et l'envoi échoue avec `FormData constructor: Argument 1 could not be converted`. C'est un détail de la figure, pas du navigateur, mais si tu le vois un jour, tu sauras d'où il vient.

#### 7.2.4 `useFormStatus` : le bouton sait qu'un envoi est en cours

Pendant que l'action attend l'API, la personne doit voir qu'il se passe quelque chose, et ne doit pas pouvoir envoyer deux fois. `useFormStatus` répond à la question « le formulaire dans lequel je me trouve a-t-il un envoi en attente ? » ([React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)). Il s'importe depuis `react-dom`, pas depuis `react`, et renvoie `pending`, `data`, `method` et `action`.

L'expression qui compte est **dans lequel je me trouve**. La documentation le signale sous un titre dédié : `useFormStatus` ne renseigne que sur un `<form>` **parent**, et non sur un `<form>` rendu dans le même composant que celui qui appelle le hook. La figure 3 l'a mesuré aux deux endroits : le composant `Formulario`, qui rend le `<form>`, a toujours vu `mismo=false` ; le composant `Boton`, qui est rendu **à l'intérieur** du `<form>`, a vu `hijo=false` puis `hijo=true`. C'est pourquoi le bouton d'envoi du `revisor` est un composant à part :

```tsx
// revisor/src/alta/BotonEnviar.tsx
import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";

export function BotonEnviar() {
  const { pending } = useFormStatus();

  // `disabled` le quitaría el foco al botón mientras está pendiente, y quien usa el
  // teclado perdería su lugar. `aria-disabled` lo anuncia como no disponible sin
  // sacarle el foco; el segundo envío se ignora aquí, cancelando el clic.
  function alPulsar(evento: MouseEvent<HTMLButtonElement>): void {
    if (pending) {
      evento.preventDefault();
    }
  }

  return (
    <button type="submit" aria-disabled={pending} onClick={alPulsar}>
      {pending ? "Dando de alta…" : "Dar de alta"}
    </button>
  );
}
```

Le texte devient « Dando de alta… » pour qui regarde, et le bouton ferme la porte au second envoi. C'est un `<button type="submit">` HTML : il s'active avec Entrée depuis n'importe quel champ et avec Espace ou Entrée lorsqu'il a le focus, sans une ligne de JavaScript. C'est la première apparition d'une idée qui revient en 7.3 : le natif apporte un comportement qu'ARIA n'apporte pas.

Ce qu'il n'utilise **pas**, c'est `disabled`, et la raison a été mesurée. La façon évidente d'empêcher le second envoi est `disabled={pending}`, et c'est ainsi que c'était écrit au départ. Un bouton désactivé ne peut pas avoir le focus, et cela a un coût qui ne se voit qu'au clavier. Avec Chrome piloté par son protocole de débogage, le formulaire rempli de données valides, le focus sur le bouton et la touche Espace, voici ce qu'a mesuré le script avec `disabled={pending}` :

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
pendiente: foco en body; «Dando de alta…» disabled=true aria-disabled=null opacity=1 cursor=default
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=(ausente) focused=(ausente)
segundo Espacio mientras está pendiente
al terminar: foco en body; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Pendant que l'enregistrement était en attente, le focus était déjà sur le `body` et l'arbre d'accessibilité ne disait plus que le bouton avait le focus ; à la fin, le focus n'est pas revenu. Pour un lecteur d'écran, le focus a disparu de la page au moment de l'envoi. (Maj+Tab est bien revenu à « Tiempo límite (ms) », car Chrome se souvient d'où le focus est parti ; malgré cela, la personne qui écoute ne sait plus où elle se trouve.) Avec Entrée **depuis un champ**, cela ne se produit pas, car le focus reste sur le champ.

Le bouton du point de contrôle utilise `aria-disabled`, qui **annonce** « indisponible » sans lui retirer le focus, et annule le clic tant qu'un envoi est en attente. Annuler le clic suffit : Espace et Entrée sur le bouton arrivent sous forme de clic, et la norme HTML définit l'envoi implicite avec Entrée depuis un champ comme un événement `click` sur le bouton d'envoi du formulaire ([WHATWG, HTML, « Implicit submission »](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). Le même script, avec le point de contrôle :

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
pendiente: foco en button; «Dando de alta…» disabled=false aria-disabled=true opacity=0.6 cursor=not-allowed
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=true focused=true
segundo Espacio mientras está pendiente
al terminar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Le focus est resté sur le bouton pendant et après l'envoi ; l'arbre d'accessibilité l'indique comme `disabled=true` (que le lecteur annonce comme « indisponible » ou « estompé ») et à la fois `focusable=true` et `focused=true` ; et le bouton **a l'air** désactivé, avec `opacity=0.6` et le curseur `not-allowed`, grâce à une nouvelle règle de la feuille de style (`button[aria-disabled="true"]`). Attention à ce que `aria-disabled` ne fait pas : il ne désactive rien, il se contente de le dire. MDN l'explique ainsi : contrairement à `disabled`, `aria-disabled="true"` **ne fait qu'**exposer l'élément comme désactivé ; c'est au développeur de supprimer sa fonctionnalité et de modifier son apparence, et l'attribut ne change rien au fait qu'il puisse recevoir le focus ([MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). La même page avertit que le style « désactivé » doit continuer à respecter le contraste des couleurs ; l'`opacity: 0.6` du point de contrôle n'a pas été mesuré au regard de ce critère. La vérification a consisté à retirer `onClick={alPulsar}` dans une copie : le second Espace a bien été envoyé, et le journal de l'API a enregistré deux enregistrements consécutifs, le second rejeté comme doublon :

```text
09:10:21.186 POST /api/servicios 201
09:10:21.491 POST /api/servicios 409
```

(Les deux premières lignes proviennent des exécutions précédentes ; les deux dernières, de la copie sans la garde.) Avec la garde, chaque exécution n'a laissé qu'un seul `POST`. C'est la même idée que 7.3.1 vue sous l'autre angle : ARIA décrit, il n'agit pas, et le comportement, c'est à toi de l'écrire. Tout cela n'a été mesuré que dans Chrome.

#### 7.2.5 `useOptimistic` : afficher ce que l'API n'a pas encore confirmé

L'enregistrement prend 300 ms dans l'API d'entraînement, et sur un réseau lent il peut prendre bien plus. Pendant ce temps, la personne peut voir le service dans une liste « Altas de esta sesión », marqué comme en attente. Cet état affiché **avant** la confirmation est ce que la documentation appelle optimiste ([React, `useOptimistic`](https://react.dev/reference/react/useOptimistic)).

`useOptimistic(valor, reductor)` renvoie une paire : l'état affiché et une fonction pour le modifier. Sa règle centrale est une phrase de la documentation : l'état optimiste **n'est rendu que pendant qu'une action est en cours ; sinon, c'est `valor` qui est rendu**. Il n'y a pas besoin de le « nettoyer » : quand l'action se termine, l'état optimiste et l'état réel coïncident dans le même rendu. Et la fonction qui le modifie doit être appelée **à l'intérieur d'une action** ; si tu l'appelles à l'extérieur, React avertit avec `An optimistic state update occurred outside a Transition or Action` et l'état optimiste apparaît et disparaît en un instant.

Dans le `revisor`, la valeur réelle est `altas`, un état contenant les enregistrements confirmés de cette session, et le reducer ajoute un nom marqué comme `pendiente`. Le reducer ignore un nom déjà présent dans la liste. Ainsi, si l'enregistrement de `correo` a été confirmé une fois et que quelqu'un retente `correo`, la liste n'affiche pas de seconde ligne en attente pendant que l'API décide (et l'API renverra `409`).

#### 7.2.6 L'état qui change après un `await`

La phrase « l'état optimiste et l'état réel coïncident dans le même rendu » comporte une condition, et la documentation de `useActionState` l'écrit dans ses mises en garde : si tu modifies l'état **après un `await`** dans l'action, tu dois pour l'instant envelopper cette modification dans un `startTransition` supplémentaire ([React, `useActionState`](https://react.dev/reference/react/useActionState)). La raison est que ce qui vient après un `await` ne s'exécute plus « dans » l'action aux yeux de React : c'est une mise à jour urgente qui est rendue immédiatement, même si l'action est toujours en attente.

Dans l'enregistrement, `establecerAltas` se trouve après `await darDeAlta(…)`. Pour voir ce qui se passe sans `startTransition`, on a retiré dans une copie l'élimination des doublons du reducer (qui, sinon, masque le problème) et on a enregistré un service dans Chrome, avec le serveur de développement, en consignant chaque version de la liste « Altas de esta sesión » et la console :

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo3 (agregando…)»]
  [«correo3», «correo3 (agregando…)»]
  [«correo3»]
consola:
  error: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. correo3
```

Au milieu sont apparues **deux** lignes portant le même nom, l'une confirmée et l'autre encore « agregando… », et React a averti dans la console que deux enfants avaient la même `key` (le `` `%s` `` est l'emplacement du message où va la clé ; l'outil de mesure l'a imprimé tel quel et a placé la clé, `correo3`, à la fin). C'est la mise à jour urgente qui se rend par-dessus l'état optimiste, toujours actif puisque l'action n'était pas terminée. La même copie, sans élimination des doublons mais avec la modification enveloppée dans `startTransition` :

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo4 (agregando…)»]
  [«correo4»]
consola:
```

Une ligne en attente puis la ligne confirmée, sans étape intermédiaire et sans avertissement. Le point de contrôle place `startTransition` autour des deux modifications qui suivent l'`await` (les enregistrements et l'avis de la boîte d'avis), et conserve l'élimination des doublons pour ce qui la concerne vraiment : le nom répété du paragraphe précédent. C'est la mesure d'une seule exécution dans Chrome ; ce qui l'étaie de façon générale, c'est la mise en garde de la documentation.

#### 7.2.7 Le formulaire complet

Voici le composant qui assemble les pièces. Lis-le de haut en bas avec ce guide : les deux hooks d'état (`altas` et sa version optimiste) ; la fonction `enviar`, qui est l'action ; `useActionState` ; et le JSX, avec le formulaire, la zone des erreurs et la liste optimiste.

```tsx
// revisor/src/alta/FormularioAlta.tsx
import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState, useOptimistic, useState } from "react";
import { useDespachoAvisos } from "../avisos/usarAvisos";
import { validarCampos } from "../compartido/esquema";
import { claves } from "../consultas/claves";
import { BotonEnviar } from "./BotonEnviar";
import { Campo } from "./Campo";
import { darDeAlta } from "./darDeAlta";
import { camposAlta } from "./esquemaAlta";
import { estadoInicialFormulario, textosDe, type EstadoFormulario } from "./estadoFormulario";

interface Alta {
  readonly nombre: string;
  readonly pendiente: boolean;
}

export function FormularioAlta() {
  const clienteConsultas = useQueryClient();
  const despachar = useDespachoAvisos();
  const [altas, establecerAltas] = useState<readonly Alta[]>([]);
  const [altasVisibles, agregarAltaOptimista] = useOptimistic(
    altas,
    (actuales, nombre: string) =>
      actuales.some((alta) => alta.nombre === nombre)
        ? actuales
        : [...actuales, { nombre, pendiente: true }],
  );

  async function enviar(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
    const textos = textosDe(datos);
    const validacion = validarCampos(camposAlta, textos);

    if (!validacion.ok) {
      return { tipo: "con-errores", detalle: "Revisa los campos marcados.", errores: validacion.errores, textos };
    }

    agregarAltaOptimista(validacion.valor.nombre);

    try {
      const respuesta = await darDeAlta(validacion.valor);

      if (!respuesta.ok) {
        return { tipo: "con-errores", detalle: respuesta.detalle, errores: respuesta.errores, textos };
      }

      // Después de un `await`, una actualización de estado ya no pertenece a la acción:
      // `startTransition` la devuelve a ella, y la fila optimista y la confirmada se
      // reemplazan en el mismo dibujo. El aviso de éxito lo da solo la bandeja.
      startTransition(() => {
        establecerAltas((actuales) => [...actuales, { nombre: respuesta.estado.nombre, pendiente: false }]);
        despachar({ tipo: "agregado", nivel: "exito", texto: `Se dio de alta ${respuesta.estado.nombre}` });
      });
      await clienteConsultas.invalidateQueries({ queryKey: claves.reporte });
      return { tipo: "agregado", nombre: respuesta.estado.nombre };
    } catch (error: unknown) {
      const detalle = error instanceof Error ? error.message : "falló el alta";
      return { tipo: "con-errores", detalle: `No se pudo dar de alta: ${detalle}`, errores: {}, textos };
    }
  }

  const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
  const errores = estado.tipo === "con-errores" ? estado.errores : {};
  const textos = estado.tipo === "con-errores" ? estado.textos : { nombre: "", url: "", timeoutMs: "" };

  return (
    <>
      <form action={accion} noValidate aria-describedby="resultado-alta">
        <Campo
          nombre="nombre"
          etiqueta="Nombre"
          ayuda="Un nombre corto y único, por ejemplo: correo"
          valorInicial={textos.nombre}
          error={errores.nombre}
        />
        <Campo
          nombre="url"
          etiqueta="Dirección"
          tipo="url"
          ayuda="La dirección que se va a revisar, con http:// o https://"
          valorInicial={textos.url}
          error={errores.url}
        />
        <Campo
          nombre="timeoutMs"
          etiqueta="Tiempo límite (ms)"
          ayuda="Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500"
          valorInicial={textos.timeoutMs}
          error={errores.timeoutMs}
        />
        <BotonEnviar />
      </form>
      <div id="resultado-alta">
        <div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
      </div>
      {altasVisibles.length > 0 && (
        <section aria-label="Altas de esta sesión">
          <h3>Altas de esta sesión</h3>
          <ul>
            {altasVisibles.map((alta) => (
              <li key={alta.nombre} className={alta.pendiente ? "pendiente" : undefined}>
                {alta.nombre}
                {alta.pendiente && " (agregando…)"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
```

La fonction `enviar` suit l'ordre d'une frontière, le même que celui que suit `cargarReporte` avec la réponse de l'API : d'abord elle lit (`textosDe`), ensuite elle valide (`validarCampos`), et ce n'est qu'avec des données valides qu'elle fait quelque chose. Si la validation échoue, l'API **n'est pas appelée** : les erreurs sont renvoyées dans l'état et aucune requête n'a lieu. Si la validation réussit, la ligne optimiste est ajoutée, l'envoi a lieu, et la réponse se traduit par l'une de trois issues :

1. L'API a refusé l'enregistrement (`400` ou `409`) : état `con-errores`, avec les erreurs **de l'API** par champ et les textes pour ne pas perdre la saisie.
2. L'API a accepté (`201`) : dans `startTransition`, l'enregistrement confirmé est ajouté et l'avis de succès est envoyé à la boîte d'avis de la Leçon 6, qui est l'**unique** annonce du succès (7.3.3 explique pourquoi) ; ensuite la requête `["reporte"]` est invalidée pour que la liste de `/` récupère le nouveau service la prochaine fois qu'elle sera affichée, et l'état passe à `agregado`.
3. Quelque chose a échoué autrement (le réseau, une réponse inattendue) : le `catch` le convertit en `con-errores` avec un message général, sans erreurs par champ.

`noValidate` sur le `<form>` désactive la validation du navigateur. La documentation de MDN décrit l'attribut comme « le formulaire ne doit pas être validé lors de son envoi » ([MDN, `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)). On la désactive parce que le formulaire fait la sienne, avec les messages du schéma et toutes les erreurs à la fois ; si on la laissait activée, le navigateur arrêterait l'envoi au premier champ avec sa propre bulle, différente dans chaque navigateur, et l'action ne s'exécuterait pas.

#### 7.2.8 Valider avec le schéma : toutes les erreurs à la fois

Le schéma arrive du cours de TypeScript presque à l'identique. Un `Esquema<T>` est un objet doté d'une méthode `leer` qui reçoit `unknown` et renvoie un résultat : soit une valeur de type `T`, soit le détail de l'erreur. `Inferir` extrait le type `T` d'un schéma, pour ne pas l'écrire deux fois. Aux schémas de là-bas s'ajoutent deux schémas dont ce formulaire a besoin : `urlHttp`, qui n'accepte que les adresses `http:` ou `https:` et les normalise avec `URL`, et `enteroPositivoDeTexto`, qui lit un nombre écrit sous forme de texte, car **tout ce qui sort d'un `FormData` est du texte**.

```ts
// revisor/src/compartido/esquema.ts
// Los esquemas de la lección 6 del curso de TypeScript: un valor que sabe leer
// `unknown` en ejecución y del que se deriva el tipo de su salida.
export type Resultado<T> = { ok: true; valor: T } | { ok: false; detalle: string };

export type Esquema<T> = {
  leer(valor: unknown): Resultado<T>;
};

export type Inferir<E extends Esquema<unknown>> = E extends Esquema<infer T> ? T : never;

export const textoNoVacio: Esquema<string> = {
  leer(valor) {
    if (typeof valor === "string" && valor.trim() !== "") {
      return { ok: true, valor: valor.trim() };
    }

    return { ok: false, detalle: "escribe un valor" };
  },
};

export const urlHttp: Esquema<string> = {
  leer(valor) {
    if (typeof valor !== "string") {
      return { ok: false, detalle: "escribe una dirección" };
    }

    try {
      const url = new URL(valor.trim());

      if (url.protocol === "http:" || url.protocol === "https:") {
        return { ok: true, valor: url.href };
      }
    } catch {
      // cae al mensaje de abajo
    }

    return { ok: false, detalle: "escribe una dirección que empiece con http:// o https://" };
  },
};

export const enteroPositivoDeTexto: Esquema<number> = {
  leer(valor) {
    if (typeof valor === "string" && /^[1-9]\d*$/.test(valor.trim())) {
      const numero = Number(valor.trim());

      if (Number.isSafeInteger(numero)) {
        return { ok: true, valor: numero };
      }
    }

    return { ok: false, detalle: "escribe un número entero mayor que cero" };
  },
};

export type ValoresDe<T extends Record<string, Esquema<unknown>>> = {
  [K in keyof T]: Inferir<T[K]>;
};

export type ErroresDe<T> = Partial<Record<keyof T, string>>;

// A diferencia de `objeto` en TypeScript, que se detiene en el primer error, un
// formulario necesita TODOS los errores a la vez: uno junto a cada campo.
export function validarCampos<T extends Record<string, Esquema<unknown>>>(
  campos: T,
  valores: Readonly<Record<string, unknown>>,
): { ok: true; valor: ValoresDe<T> } | { ok: false; errores: ErroresDe<T> } {
  const salida: Record<string, unknown> = {};
  const errores: ErroresDe<T> = {};

  for (const clave of Object.keys(campos) as (keyof T & string)[]) {
    const resultado = campos[clave].leer(valores[clave]);

    if (resultado.ok) {
      salida[clave] = resultado.valor;
    } else {
      errores[clave] = resultado.detalle;
    }
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return { ok: true, valor: salida as ValoresDe<T> };
}
```

La différence qui compte se trouve à la fin, dans `validarCampos`. En TypeScript, le schéma d'un objet s'arrêtait au premier champ invalide, et pour une API c'est très bien : elle rejette la requête et explique la première raison. Un formulaire ne peut pas faire cela. Si la personne a laissé le nom vide **et** mal saisi l'adresse, ne lui signaler que la première erreur l'oblige à envoyer, corriger, renvoyer et découvrir la seconde. La figure 2 compare les deux stratégies avec le même envoi invalide :

```ts
// fig07_02.ts
type Resultado<T> = { ok: true; valor: T } | { ok: false; detalle: string };
type Esquema<T> = { leer(valor: unknown): Resultado<T> };

const textoNoVacio: Esquema<string> = {
  leer: (v) =>
    typeof v === "string" && v.trim() !== "" ? { ok: true, valor: v.trim() } : { ok: false, detalle: "escribe un valor" },
};

const urlHttp: Esquema<string> = {
  leer(v) {
    try {
      const url = new URL(String(v).trim());
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { ok: true, valor: url.href };
      }
    } catch {
      // cae al mensaje de abajo
    }
    return { ok: false, detalle: "escribe una dirección que empiece con http:// o https://" };
  },
};

const enteroPositivoDeTexto: Esquema<number> = {
  leer: (v) =>
    typeof v === "string" && /^[1-9]\d*$/.test(v.trim())
      ? { ok: true, valor: Number(v.trim()) }
      : { ok: false, detalle: "escribe un número entero mayor que cero" },
};

const campos: Record<string, Esquema<unknown>> = { nombre: textoNoVacio, url: urlHttp, timeoutMs: enteroPositivoDeTexto };

// Como `objeto` en la lección 6 de TypeScript: se detiene en el primer error.
function primerError(valores: Record<string, unknown>): string {
  for (const [clave, esquema] of Object.entries(campos)) {
    const r = esquema.leer(valores[clave]);
    if (!r.ok) {
      return `${clave}: ${r.detalle}`;
    }
  }
  return "sin errores";
}

// Como `validarCampos` del revisor: junta todos.
function todosLosErrores(valores: Record<string, unknown>): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const [clave, esquema] of Object.entries(campos)) {
    const r = esquema.leer(valores[clave]);
    if (!r.ok) {
      errores[clave] = r.detalle;
    }
  }
  return errores;
}

const enviado = { nombre: "  ", url: "ftp://correo", timeoutMs: "1.5" };
console.log("primer error:     ", primerError(enviado));
console.log("todos los errores:", todosLosErrores(enviado));
console.log("válido:           ", urlHttp.leer(" https://correo.example "));
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_02.ts
$ node fig07_02.js
primer error:      nombre: escribe un valor
todos los errores: {
  nombre: 'escribe un valor',
  url: 'escribe una dirección que empiece con http:// o https://',
  timeoutMs: 'escribe un número entero mayor que cero'
}
válido:            { ok: true, valor: 'https://correo.example/' }
```

Trois erreurs trouvées d'un coup contre une seule. Et la dernière ligne montre la normalisation : `" https://correo.example "` ressort sous la forme `https://correo.example/`, sans espaces et avec la `/` finale qu'ajoute `URL`. C'est cette valeur qui part vers l'API.

Le schéma de l'enregistrement réunit trois schémas dans un objet et en dérive les trois types qu'utilise le formulaire : les valeurs validées, les erreurs par champ et les textes bruts.

```ts
// revisor/src/alta/esquemaAlta.ts
import type { NuevoServicio } from "../compartido/contrato";
import {
  enteroPositivoDeTexto,
  textoNoVacio,
  urlHttp,
  type ErroresDe,
  type ValoresDe,
} from "../compartido/esquema";

export const camposAlta = {
  nombre: textoNoVacio,
  url: urlHttp,
  timeoutMs: enteroPositivoDeTexto,
};

export type ValoresAlta = ValoresDe<typeof camposAlta>;
export type ErroresAlta = ErroresDe<typeof camposAlta>;
export type TextosAlta = Readonly<Record<keyof typeof camposAlta, string>>;

// Si el contrato y el esquema dejan de coincidir, esta línea deja de compilar.
export const comprobarContrato: (valores: ValoresAlta) => NuevoServicio = (valores) => valores;
```

La dernière ligne mérite une lecture attentive, car elle ne fait rien à l'exécution et pourtant c'est la plus importante du fichier. `comprobarContrato` est une fonction qui reçoit `ValoresAlta` et le renvoie en tant que `NuevoServicio`, le type que l'API attend selon `src/compartido/contrato.ts`. Si quelqu'un modifie le schéma (ajoute un champ, le renomme ou change son type) et qu'il ne correspond plus au type de l'API, cette affectation cesse de compiler et `npm run build` s'arrête dans `tsc -b`. Dans « L'erreur que tu vas voir », tu vas le provoquer.

#### 7.2.9 La frontière réseau de l'enregistrement

`darDeAlta` fait avec la réponse du `POST` ce que `cargarReporte` fait avec celle du `GET` : elle ne lui fait pas confiance. Elle traduit les trois codes que l'API documente et lève une erreur pour tout autre. Un cas s'échappe plus tôt : si le corps n'est pas du JSON (par exemple parce que le serveur d'entraînement est arrêté et que c'est le *proxy* de Vite qui répond), l'erreur est levée par `respuesta.json()`, et le message que tu verras dans la zone des erreurs sera celui de JavaScript, pas « la API respondió … ». Cela se déduit du code ; ce n'a pas été mesuré.

```ts
// revisor/src/alta/darDeAlta.ts
import { esEstadoPublico, esRegistro, type EstadoPublico, type NuevoServicio } from "../compartido/contrato";
import type { ErroresAlta } from "./esquemaAlta";

export type RespuestaAlta =
  | { readonly ok: true; readonly estado: EstadoPublico }
  | { readonly ok: false; readonly detalle: string; readonly errores: ErroresAlta };

function erroresDe(valor: unknown): ErroresAlta {
  if (!esRegistro(valor)) {
    return {};
  }

  const errores: ErroresAlta = {};

  for (const clave of ["nombre", "url", "timeoutMs"] as const) {
    const texto = valor[clave];

    if (typeof texto === "string") {
      errores[clave] = texto;
    }
  }

  return errores;
}

export async function darDeAlta(nuevo: NuevoServicio): Promise<RespuestaAlta> {
  const respuesta = await fetch("/api/servicios", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nuevo),
  });
  const cuerpo: unknown = await respuesta.json();

  if (respuesta.status === 201 && esEstadoPublico(cuerpo)) {
    return { ok: true, estado: cuerpo };
  }

  if ((respuesta.status === 400 || respuesta.status === 409) && esRegistro(cuerpo)) {
    return {
      ok: false,
      detalle: typeof cuerpo.detalle === "string" ? cuerpo.detalle : "la API rechazó el alta",
      errores: erroresDe(cuerpo.campos),
    };
  }

  throw new Error(`la API respondió ${respuesta.status}`);
}
```

Le cas intéressant est le `409`. L'API renvoie `{"detalle":"ya existe un servicio llamado correo","campos":{"nombre":"ese nombre ya existe"}}`, et `erroresDe` convertit `campos` en un `ErroresAlta`. Ainsi, une erreur que **seule l'API peut connaître** (le formulaire ne connaît pas les noms qui existent déjà) apparaît à côté du bon champ, avec le même aspect et la même accessibilité qu'une erreur de validation locale. Pour le formulaire, il n'y a pas de différence entre « le schéma a dit non » et « l'API a dit non » : les deux arrivent sous forme d'erreurs par champ.

### 7.3 Accessibilité : le natif d'abord, ARIA là où le natif ne suffit pas

#### 7.3.1 La première règle d'ARIA

ARIA (*Accessible Rich Internet Applications*) est une spécification du W3C qui ajoute au HTML des attributs pour décrire aux technologies d'assistance — un lecteur d'écran, par exemple — ce qu'un élément **est** (`role`), dans quel **état** il se trouve (`aria-invalid`) et à quoi il **est relié** (`aria-describedby`). Le guide du W3C pour l'utiliser commence par une règle, la première, que ce cours prend au pied de la lettre : si tu peux utiliser un élément ou un attribut HTML natif qui possède déjà la sémantique et le comportement dont tu as besoin, au lieu de détourner un autre élément et de lui ajouter un rôle, un état ou une propriété ARIA, fais-le ([W3C, « Using ARIA »](https://www.w3.org/TR/using-aria/)). La deuxième règle la complète : ne modifie pas la sémantique native, sauf si tu y es vraiment obligé.

La raison tient dans une phrase du guide des pratiques ARIA : contrairement aux éléments de formulaire HTML, les rôles ARIA **n'amènent pas le navigateur à ajouter un comportement clavier ni des styles** ([W3C, « ARIA Authoring Practices Guide: Read Me First »](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)). Un `<div role="button">` dit au lecteur d'écran « je suis un bouton », mais ne répond pas à Entrée, n'entre pas dans l'ordre de tabulation et n'envoie pas le formulaire. Un `<button type="submit">` fait les trois sans rien demander. Le même guide le résume dans le titre de sa section : « pas d'ARIA vaut mieux qu'un mauvais ARIA ».

Dans le formulaire du `revisor`, le natif règle presque tout :

- **`<label htmlFor>`** donne un nom à chaque champ. MDN décrit deux avantages : le lecteur d'écran lit l'étiquette lorsque le champ reçoit le focus, et un clic sur l'étiquette fait passer le focus au champ, ce qui agrandit la zone cliquable ([MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). En JSX, l'attribut `for` s'écrit `htmlFor`.
- **`<button type="submit">`** envoie avec Entrée depuis n'importe quel champ, entre de lui-même dans l'ordre de tabulation et peut être désactivé avec `disabled`.
- **L'ordre du document** est l'ordre de tabulation. MDN le dit pour les éléments focalisables sans `tabindex` positif : l'ordre de navigation du focus est l'ordre du code source ([MDN, `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)). C'est pourquoi le formulaire n'utilise pas un seul `tabindex` : les champs sont écrits dans l'ordre où on les remplit.
- **`:focus-visible`** signale où se trouve le focus lorsque la personne navigue au clavier. MDN la définit comme la pseudo-classe qui s'applique lorsque l'élément a le focus et que le navigateur détermine, par heuristique, que ce focus doit être rendu évident ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)). En pratique : sur un bouton ou un lien, elle apparaît en tabulant et non en cliquant avec la souris ; sur un champ de texte, elle apparaît aussi au clic, car le navigateur suppose que tu vas saisir du texte et que tu as besoin de voir où. MDN donne précisément cet exemple : un bouton actionné à la souris n'affiche généralement pas le focus, alors qu'un champ de texte qui attend ta saisie, si.

ARIA intervient à deux endroits où le HTML n'a pas d'équivalent : relier un champ à son erreur, et annoncer un changement survenu loin du focus.

#### 7.3.2 Le champ : `aria-invalid` et `aria-describedby`

```tsx
// revisor/src/alta/Campo.tsx
export function Campo({
  nombre,
  etiqueta,
  ayuda,
  tipo = "text",
  valorInicial,
  error,
}: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly tipo?: "text" | "url";
  readonly valorInicial: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required
        defaultValue={valorInicial}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && (
        <p id={idError} className="error-campo">
          {error}
        </p>
      )}
      <p id={idAyuda} className="ayuda">
        {ayuda}
      </p>
    </div>
  );
}
```

Une relation ou un état par attribut :

- **`htmlFor={nombre}` avec `id={nombre}`** : le nom accessible du champ est son étiquette.
- **`required`** : le champ est obligatoire. C'est l'attribut HTML natif, et c'est pourquoi on n'écrit pas `aria-required` : WAI-ARIA définit `aria-required` comme « une saisie est nécessaire dans l'élément avant l'envoi du formulaire » et cite comme concept apparenté le `required` du HTML ([W3C, WAI-ARIA 1.2, `aria-required`](https://www.w3.org/TR/wai-aria-1.2/#aria-required)), et la spécification qui traduit le HTML vers l'API d'accessibilité de chaque système d'exploitation expose `required` de la même façon qu'`aria-required` ([W3C, « HTML Accessibility API Mappings »](https://www.w3.org/TR/html-aam-1.0/)). Avec `noValidate` sur le formulaire, le navigateur n'arrête plus l'envoi pour un champ vide, mais l'attribut continue de dire « obligatoire ». Cela a été mesuré dans l'arbre d'accessibilité de Chrome (7.4.2) : sans l'attribut, les trois champs sortaient avec `required=false` ; avec lui, avec `required=true`.
- **`aria-invalid`** : l'état. La spécification le définit comme « la valeur saisie n'est pas au format attendu par l'application » et demande à l'auteur de le mettre à `true` lorsque la valeur est jugée invalide ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). Le lecteur l'annonce comme « invalide » ou « saisie non valide », selon le lecteur.
- **`aria-describedby`** : l'explication. La spécification le définit comme l'attribut qui identifie l'élément, ou les éléments, qui **décrivent** l'objet, et distingue l'étiquette, qui doit être concise, de la description, destinée à fournir des informations plus détaillées ([W3C, WAI-ARIA 1.2, `aria-describedby`](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)). Il reçoit une liste d'identifiants séparés par des espaces, et la spécification qui calcule les textes accessibles les assemble **dans cet ordre**, séparés par un espace ([W3C, « Accessible Name and Description Computation 1.2 »](https://www.w3.org/TR/accname-1.2/)). C'est pourquoi l'erreur vient en premier : `nombre-error nombre-ayuda` se lit « escribe un valor », puis l'aide.

La figure 4 rend une copie réduite du `Campo` (les mêmes relations, sans `type`, `required` ni classes) sans erreur, avec erreur et, pour comparer, une version « à l'ancienne » avec un texte au-dessus et un autre en dessous, sans `<label>` ni relations. Pour chacune, elle calcule le nom et la description accessibles avec `dom-accessibility-api`, une bibliothèque qui implémente ce calcul du W3C :

```tsx
// fig07_04.tsx
import { computeAccessibleDescription, computeAccessibleName } from "dom-accessibility-api";
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Una copia reducida del Campo del revisor (src/alta/Campo.tsx): las mismas relaciones de
// etiqueta, aria-invalid y aria-describedby; sin type, required, defaultValue ni clases,
// que no cambian el nombre ni la descripción accesibles.
function Campo({ nombre, etiqueta, ayuda, error }: {
  readonly nombre: string;
  readonly etiqueta: string;
  readonly ayuda: string;
  readonly error: string | undefined;
}) {
  const idAyuda = `${nombre}-ayuda`;
  const idError = `${nombre}-error`;

  return (
    <div className="campo">
      <label htmlFor={nombre}>{etiqueta}</label>
      <input
        id={nombre}
        name={nombre}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? idAyuda : `${idError} ${idAyuda}`}
      />
      {error !== undefined && <p id={idError}>{error}</p>}
      <p id={idAyuda}>{ayuda}</p>
    </div>
  );
}

// Lo mismo, a la antigua: un texto encima del campo, sin <label> ni aria-*.
function CampoSinRelaciones() {
  return (
    <div>
      <p>Nombre</p>
      <input name="nombre" />
      <p>escribe un valor</p>
    </div>
  );
}

const raiz = createRoot(dom.window.document.getElementById("raiz")!);

async function leer(titulo: string, arbol: React.ReactNode): Promise<void> {
  await act(async () => raiz.render(arbol));
  const campo = dom.window.document.querySelector("input")!;
  console.log(titulo);
  console.log(`  html:        ${campo.outerHTML}`);
  console.log(`  nombre:      «${computeAccessibleName(campo)}»`);
  console.log(`  descripción: «${computeAccessibleDescription(campo)}»`);
}

const ayuda = "Un nombre corto y único, por ejemplo: correo";
await leer("sin error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error={undefined} />);
await leer("con error:", <Campo nombre="nombre" etiqueta="Nombre" ayuda={ayuda} error="escribe un valor" />);
await leer("sin relaciones:", <CampoSinRelaciones />);
await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_04.tsx
$ node fig07_04.js
sin error:
  html:        <input id="nombre" aria-invalid="false" aria-describedby="nombre-ayuda" name="nombre">
  nombre:      «Nombre»
  descripción: «Un nombre corto y único, por ejemplo: correo»
con error:
  html:        <input id="nombre" aria-invalid="true" aria-describedby="nombre-error nombre-ayuda" name="nombre">
  nombre:      «Nombre»
  descripción: «escribe un valor Un nombre corto y único, por ejemplo: correo»
sin relaciones:
  html:        <input name="nombre">
  nombre:      «»
  descripción: «»
```

Ce que lit un lecteur d'écran en arrivant sur le champ, ce sont pour l'essentiel ces deux lignes, plus le rôle et l'état : « Nombre, champ de texte, invalide, escribe un valor. Un nombre corto y único, por ejemplo: correo ». La version sans relations a un **nom vide et une description vide** : visuellement elle dit la même chose, mais pour qui ne voit pas l'écran c'est un champ de texte sans nom. C'est la scène du début, mesurée. (La figure calcule ce que **la spécification** dit que le navigateur doit exposer ; la façon dont chaque lecteur d'écran le prononce ne peut pas se mesurer par une exécution, et se vérifie manuellement.)

Trois décisions du composant s'appuient sur une source :

- **`aria-invalid` vaut `false` jusqu'à la tentative d'envoi.** Le champ démarre sans erreur, donc l'attribut sort comme `aria-invalid="false"`, et ne passe à `true` que lorsqu'un envoi a renvoyé une erreur pour ce champ. La spécification le recommande pour les champs obligatoires vides : si la personne n'a pas tenté d'envoyer le formulaire, l'auteur **ne devrait pas** marquer comme invalide un champ obligatoire simplement parce qu'il n'a pas encore de données ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). C'est un « ne devrait pas » (*SHOULD NOT*), pas une interdiction, et il parle du champ vide : signaler un format invalide avant l'envoi, par exemple en quittant le champ, est une autre décision que la spécification ne tranche pas. MDN l'explique autrement : la personne peut encore être en train de le remplir ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). Avec `required`, il y avait un doute : le même tableau de HTML-AAM permet au navigateur d'exposer de lui-même un champ obligatoire vide comme invalide après que la personne l'a touché. Cela a été mesuré dans Chrome : en entrant dans « Nombre » et en sortant avec Tab sans rien saisir, l'arbre d'accessibilité a continué d'indiquer `invalid=false` pour les trois champs. Les autres navigateurs n'ont pas été mesurés.
- **Le texte de l'erreur est écrit, pas seulement coloré.** La bordure rouge (`input[aria-invalid="true"]` dans la feuille de style) aide qui voit, mais le critère 3.3.1 des règles WCAG 2.2 exige que, si une erreur de saisie est détectée, l'élément en erreur soit identifié et l'erreur **décrite sous forme de texte** ([W3C, « Understanding SC 3.3.1: Error Identification »](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)). Et une couleur ne parvient pas à qui ne distingue pas le rouge.
- **`aria-describedby` et non `aria-errormessage`.** ARIA 1.2 possède un attribut spécifique pour le message d'erreur, `aria-errormessage`, que MDN décrit comme celui qui identifie l'élément contenant le message d'erreur et qui ne s'utilise que lorsque `aria-invalid` vaut `true` ([MDN, `aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)). Le point de contrôle utilise `aria-describedby` parce que le champ a déjà besoin d'une description pour son aide, et parce que c'est le modèle que montre le tutoriel de formulaires du W3C pour associer un champ à son message d'erreur ([W3C WAI, « Forms Tutorial: User Notifications »](https://www.w3.org/WAI/tutorials/forms/notifications/)). C'est un choix du cours ; les deux façons sont étayées.

#### 7.3.3 L'avis : les zones dynamiques

Le champ règle l'erreur **là où se trouve le focus**. Mais après l'appui sur Entrée, le focus reste sur le bouton ou sur le dernier champ, et le message « Revisa los campos marcados. » apparaît ailleurs sur la page. Si rien ne l'annonce, Raúl n'en sait rien. C'est pour cela qu'existent les **zones dynamiques** (*live regions*) : des parties de la page que la technologie d'assistance surveille, et dont elle annonce les **changements** même si le focus est ailleurs.

Le critère 4.1.3 des WCAG 2.2 l'exige pour les messages d'état : ils doivent pouvoir être déterminés par leur rôle ou leurs propriétés, pour que la technologie d'assistance les présente **sans qu'ils reçoivent le focus** ([W3C, « Understanding SC 4.1.3: Status Messages »](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). ARIA propose deux rôles pour cela, et le formulaire utilise les deux :

- **`role="status"`** : selon la spécification, une zone dynamique contenant une information d'avis qui n'est pas assez importante pour justifier une alerte, avec `aria-live` implicite à `polite` et `aria-atomic` implicite à `true` ([W3C, WAI-ARIA 1.2, `status`](https://www.w3.org/TR/wai-aria-1.2/#status)). « Poli » signifie que le lecteur attend d'avoir fini ce qu'il est en train de dire. MDN ajoute une indication : ne donne pas le focus au statut lorsque son contenu change ([MDN, rôle `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).
- **`role="alert"`** : une zone dynamique contenant une information importante et, en général, urgente ; `aria-live` implicite à `assertive` et `aria-atomic` à `true` ([W3C, WAI-ARIA 1.2, `alert`](https://www.w3.org/TR/wai-aria-1.2/#alert)). « Assertive » signifie qu'elle interrompt. MDN avertit que, du fait de sa nature intrusive, elle doit être utilisée avec parcimonie et uniquement lorsque l'attention immédiate de la personne est requise ([MDN, rôle `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)).

Le formulaire utilise `alert` pour « Revisa los campos marcados. » et pour les refus de l'API, car la personne ne peut pas continuer sans s'en occuper. Le succès est une bonne nouvelle qui peut attendre que le lecteur ait terminé, il va donc dans un `status`, et c'est ici qu'une décision a été prise en mesurant. La boîte d'avis de la Leçon 6 est déjà un `role="status"`, et l'enregistrement lui envoie son avis. Si le formulaire avait en plus son propre `status` avec « Se dio de alta correo. », le succès arriverait **deux fois**. Voici ce qui a été mesuré dans Chrome, en observant les zones dynamiques pendant l'enregistrement d'un service, avec le formulaire qui avait les deux :

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo Descartar»
  status (formulario): «Se dio de alta correo.»
```

Et avec le formulaire du point de contrôle, qui laisse le succès à la seule boîte d'avis :

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo5 Descartar»
```

Un seul changement, à un seul endroit. MDN avertit, à propos des alertes, que plusieurs avis simultanés créent une mauvaise expérience ([MDN, rôle `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)) ; avec des avis polis le problème est atténué, mais c'est le même : la personne entend la même nouvelle deux fois. On a choisi la boîte d'avis et non le formulaire parce que la boîte d'avis est l'endroit des avis de toute l'application (elle reçoit aussi ceux de la nouvelle vérification) et parce que l'avis survit si la personne quitte la page.

`aria-atomic` décide de **la quantité** lue. Avec `true`, implicite dans `alert` et dans `status`, le lecteur présente la zone **entière** chaque fois qu'elle change, même si une partie seulement a changé ([MDN, « ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Pour le message d'une ligne du formulaire, c'est ce que l'on veut. Pour la boîte d'avis, non : c'est une liste qui grandit jusqu'à cinq avis, chacun avec son bouton « Descartar », et avec `true` le cinquième avis ferait répéter les cinq au lecteur. C'est pourquoi la zone de la boîte d'avis porte `aria-atomic="false"`, qui permet d'annoncer uniquement ce qui a été ajouté. L'arbre d'accessibilité de Chrome le confirme : avant, la zone de la boîte d'avis sortait avec `atomic=true` ; avec l'attribut, avec `atomic=false`, et la zone des erreurs du formulaire reste à `atomic=true` (7.4.2 contient les deux lectures).

```tsx
// revisor/src/avisos/BandejaAvisos.tsx
import { useAvisos, useDespachoAvisos } from "./usarAvisos";

export function BandejaAvisos() {
  const { avisos } = useAvisos();
  const despachar = useDespachoAvisos();

  return (
    <section className="bandeja" aria-label="Avisos">
      {/* `status` trae aria-atomic="true": se leería la lista entera con cada aviso. */}
      <div role="status" aria-atomic="false">
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

La règle la plus souvent enfreinte avec les zones dynamiques figure dans le guide de MDN, et explique la forme du JSX : la technologie d'assistance n'annonce en général que les changements **dynamiques** du contenu d'une zone dynamique ; il faut **établir la zone avant** de mettre à jour son contenu, commencer avec la zone vide, et la façon la plus fiable est de l'inclure dans le balisage initial ([MDN, « ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). C'est pourquoi le point de contrôle n'écrit pas ceci :

```tsx
// fragmento: la región nace junto con su mensaje (no lo hagas así)
{estado.tipo === "con-errores" && <div role="alert">{estado.detalle}</div>}
```

mais ceci, où le `div` existe dès le premier rendu et seul son contenu change (la boîte d'avis fait de même avec son `role="status"`) :

```tsx
// fragmento de FormularioAlta.tsx
<div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
```

Le même guide de MDN reconnaît qu'avec `role="alert"` le contenu est annoncé « dans la plupart des cas » même si la zone apparaît d'un coup ; mais « la plupart des cas » n'est pas une règle, et avec `status` cette exception n'existe pas. Écrire les zones vides dès le début fonctionne pour les deux rôles.

Le `<form>` porte en outre `aria-describedby="resultado-alta"`, qui pointe vers le conteneur de la zone des erreurs. Ce n'est pas lui qui fait l'annonce (c'est le rôle qui s'en charge) ; c'est une description du formulaire pour qui y arrive en naviguant, qui inclut la dernière erreur. Le moment où chaque lecteur d'écran lit la description d'un formulaire n'est pas défini et n'a pas été mesuré : vérifie-le manuellement, et si tu entends l'erreur deux fois, c'est cet attribut.

#### 7.3.4 Ce qu'une zone dynamique n'annonce pas

Une zone dynamique annonce des **changements**. La figure 5 joue le rôle de l'oreille : elle rend une zone `role="alert"`, l'observe avec un `MutationObserver` (l'API du navigateur qui signale les changements du DOM) et lui envoie trois envois successifs : deux avec le même message et un différent.

```tsx
// fig07_05.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// Un lector de pantalla anuncia los CAMBIOS de una región viva. Aquí un
// MutationObserver hace de oído: cuenta qué cambió dentro de la región.
// `envio` no se dibuja: solo prueba que cada envío vuelve a dibujar el componente.
function Resultado({ envio, detalle }: { readonly envio: number; readonly detalle: string | null }) {
  console.log(`  (dibujo del envío ${envio})`);
  return (
    <div role="alert">
      {detalle !== null && <p>{detalle}</p>}
    </div>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
const raiz = createRoot(contenedor);
await act(async () => raiz.render(<Resultado envio={0} detalle={null} />));

const region = contenedor.querySelector('[role="alert"]')!;
let cambios = 0;
const oido = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
oido.observe(region, { childList: true, subtree: true, characterData: true });

const envios: [number, string | null][] = [
  [1, "Revisa los campos marcados."],
  [2, "Revisa los campos marcados."],
  [3, "ya existe un servicio llamado correo"],
];

for (const [envio, detalle] of envios) {
  cambios = 0;
  await act(async () => raiz.render(<Resultado envio={envio} detalle={detalle} />));
  console.log(`envío ${envio}: «${region.textContent}» → cambios en role="alert": ${cambios}`);
}

oido.disconnect();
await act(async () => raiz.unmount());
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig07_05.tsx
$ node fig07_05.js
  (dibujo del envío 0)
  (dibujo del envío 1)
envío 1: «Revisa los campos marcados.» → cambios en role="alert": 1
  (dibujo del envío 2)
envío 2: «Revisa los campos marcados.» → cambios en role="alert": 0
  (dibujo del envío 3)
envío 3: «ya existe un servicio llamado correo» → cambios en role="alert": 1
```

Le composant a été rendu lors des trois envois, mais le DOM de la zone n'a changé qu'au premier et au troisième. Au deuxième, React a comparé le nouveau texte à l'ancien, a vu qu'ils étaient identiques et n'a touché à rien : c'est la réconciliation de la Leçon 1 qui fait exactement son travail. Pour un lecteur d'écran, cela signifie qu'**un second envoi avec la même erreur n'est pas annoncé**. La figure mesure le DOM, pas le lecteur ; que le lecteur se taise quand le DOM ne change pas, c'est ce que l'on déduit du guide de MDN (il annonce les changements dynamiques), et cela se vérifie manuellement. Dans le formulaire du `revisor`, cela arrive si la personne appuie deux fois sur Entrée sans rien corriger : la seconde fois, le champ reste marqué et sa description continue d'énoncer l'erreur quand on y arrive, mais il n'y a pas d'annonce. C'est le second Entrée de Raúl, et l'exercice 3 te demande de le résoudre.

### 7.4 L'enregistrement dans le `revisor` et sa vérification au regard des sources

#### 7.4.1 La page, la route et le lien

La page est courte : elle définit le titre de l'onglet avec le hook de la Leçon 3 et enveloppe le formulaire dans la `Tarjeta` de la Leçon 1, qui lui donne un titre `<h2>` et une section nommée.

```tsx
// revisor/src/alta/PaginaAlta.tsx
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import { FormularioAlta } from "./FormularioAlta";

export function PaginaAlta() {
  useTituloDocumento("Dar de alta · Revisor");

  return (
    <Tarjeta titulo="Dar de alta un servicio">
      <FormularioAlta />
    </Tarjeta>
  );
}
```

La nouvelle route s'ajoute parmi les enfants de la disposition. L'ordre dans le tableau ne décide pas laquelle l'emporte (React Router classe les routes et un segment fixe l'emporte sur un segment dynamique, comme on l'a vérifié dans la Leçon 5), mais l'écrire **avant** `servicios/:nombre` rend visible, pour qui lit, que `nuevo` est une adresse fixe et non le nom d'un service. Remarque aussi `ErrorBoundary: ErrorDeRuta` sur la route extérieure : c'est le périmètre d'erreur de la Leçon 5, celui qui intercepterait une erreur échappée de l'action du formulaire.

```tsx
// revisor/src/app/rutas.tsx
import type { RouteObject } from "react-router";
import { PaginaAlta } from "../alta/PaginaAlta";
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
      { path: "servicios/nuevo", Component: PaginaAlta },
      { path: "servicios/:nombre", Component: PaginaServicio },
      { path: "*", Component: PaginaNoEncontrada },
    ],
  },
];
```

La disposition ajoute un lien dans la navigation principale. C'est un `NavLink` de la Leçon 5, donc React Router lui ajoute `aria-current="page"` lorsque tu es sur `/servicios/nuevo`, et un lecteur d'écran annonce qu'il s'agit de la page courante :

```tsx
// fragmento de revisor/src/app/Disposicion.tsx: lo único que cambia
<NavLink to="/servicios/nuevo">Dar de alta</NavLink>
```

Et la feuille de style s'enrichit de ce dont le formulaire a besoin. Voici le bloc ajouté à la fin de `src/reporte/panel.css` :

```css
/* fragmento: lo que se agrega al final de revisor/src/reporte/panel.css */
.campo {
  margin: 0 0 1rem;
}

.campo label {
  display: block;
  font-weight: bold;
}

.campo input {
  font: inherit;
  width: 100%;
}

.campo input[aria-invalid="true"] {
  border: 2px solid #cf222e;
}

.error-campo {
  color: #cf222e;
  margin: 0.25rem 0 0;
}

.ayuda {
  color: #57606a;
  margin: 0.25rem 0 0;
}

li.pendiente {
  opacity: 0.6;
}

:focus-visible {
  outline: 3px solid #0969da;
  outline-offset: 2px;
}

button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.6;
}
```

Trois règles comptent pour l'accessibilité. `.campo input[aria-invalid="true"]` dessine la bordure rouge **à partir de l'attribut ARIA**, de sorte que ce que voit qui regarde et ce qu'entend qui écoute proviennent de la même donnée et ne peuvent pas se contredire ; c'est le sélecteur que recommande MDN pour styliser les champs invalides ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). Et `:focus-visible` dessine un contour bleu de 3 pixels autour de ce qui a le focus lorsque le navigateur décide qu'il doit être visible : toujours en naviguant avec Tab, et aussi en cliquant dans un champ de texte (7.3.1). Sans lui, qui navigue au clavier dépend du contour par défaut de chaque navigateur, qui sur certains fonds se voit à peine. Et `button[aria-disabled="true"]` estompe le bouton pendant qu'un envoi est en attente : avec `disabled`, le navigateur l'estompait de lui-même ; avec `aria-disabled`, non, et sans cette règle qui regarde ne saurait pas que le bouton ne répond pas (7.2.4).

Le `package.json` ne change que sa version, qui passe à `0.7.0` : cette leçon n'ajoute aucune dépendance.

Tout étant en place, le point de contrôle passe les deux vérifications du cours. `npm run lint` n'affiche rien (les règles de React acceptent les nouveaux hooks et `startTransition` tels qu'ils sont utilisés) et la compilation se termine sans erreur :

```text
$ npm run lint

> revisor@0.7.0 lint
> eslint . --max-warnings 0

$ npm run build

> revisor@0.7.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 191 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-BBxlOd8Z.css    1.50 kB │ gzip:   0.66 kB
dist/assets/index-WLyq37jn.js   366.82 kB │ gzip: 114.40 kB

✓ built in 312ms
```

#### 7.4.2 La vérification, point par point

Ce tableau vérifie le formulaire et ses avis au regard de ce que disent WAI-ARIA et MDN. La colonne « Comment on le sait » distingue ce qui a été mesuré de ce qui se déduit du code ou se vérifie manuellement.

| Ce que demande la source | Ce que fait le `revisor` | Comment on le sait |
|---|---|---|
| Utiliser l'élément natif avant ARIA (Using ARIA, règle 1) | `<label>`, `<input>`, `<button type="submit">`, `<form>` ; aucun `role` sur les contrôles | Lecture du code |
| Chaque champ a un nom (WCAG 3.3.2) | `label htmlFor` avec un `id` égal au `name` | Mesuré : figure 4, nom « Nombre » |
| L'erreur identifiée et décrite sous forme de texte (WCAG 3.3.1) | Texte de l'erreur dans un `<p>` relié par `aria-describedby`, plus la bordure | Mesuré : figure 4, description contenant l'erreur |
| `aria-invalid` à `true` seulement après une tentative d'envoi (WAI-ARIA 1.2) | `false` au rendu ; `true` lorsque l'état contient une erreur pour ce champ | Mesuré : figure 4 et le HTML de `/servicios/nuevo` |
| Messages d'état sans recevoir le focus (WCAG 4.1.3 ; MDN, `status`) | `role="alert"` pour les erreurs du formulaire, `role="status"` de la boîte d'avis pour le succès ; aucun ne reçoit le focus | Lecture du code |
| La zone dynamique existe avant le message (MDN, *Live regions*) | La zone des erreurs et celle de la boîte d'avis sont rendues vides dès le premier rendu | Mesuré : le HTML de `/servicios/nuevo` les contient vides |
| Plusieurs avis simultanés sont une mauvaise expérience (MDN, `alert`) | Le succès est annoncé une fois, dans la boîte d'avis | Mesuré dans Chrome : avant, deux zones changeaient ; maintenant, une |
| Déclarer les champs obligatoires (WAI-ARIA, `aria-required` ; HTML-AAM, `required`) | `required` sur les trois champs | Mesuré dans l'arbre d'accessibilité : `required=false` avant, `required=true` maintenant |
| Lire la zone entière seulement quand c'est utile (WAI-ARIA, `status` ; MDN, `aria-atomic`) | `aria-atomic="false"` sur la boîte d'avis ; l'`alert` du formulaire conserve `true` | Mesuré dans l'arbre d'accessibilité : la boîte d'avis est passée d'`atomic=true` à `atomic=false` |
| `alert` avec parcimonie (MDN, `alert`) | Uniquement pour les erreurs qui empêchent de continuer | Lecture du code |
| Ordre du focus identique à l'ordre du document, sans `tabindex` positif (MDN, `tabindex`) | Aucun `tabindex` ; champs dans l'ordre de remplissage | Ordre du document mesuré dans le HTML de `/servicios/nuevo` ; le parcourir se fait manuellement |
| Focus visible lors de la navigation au clavier | `:focus-visible` avec un contour de 3 px | Se vérifie manuellement |
| `aria-disabled` ne fait qu'exposer l'état ; l'auteur supprime la fonction et modifie l'apparence (MDN, `aria-disabled`) | `aria-disabled={pending}`, clic annulé pendant l'attente et `button[aria-disabled="true"]` estompé | Mesuré dans Chrome : le focus reste sur le bouton, l'arbre l'indique comme `disabled=true` et `focused=true`, `opacity=0.6`, un seul `POST` |

Les lectures de l'arbre d'accessibilité proviennent de Chrome en mode headless, avec `Accessibility.getFullAXTree`, le même arbre que le navigateur fournit aux lecteurs d'écran. Avec le formulaire d'avant les corrections :

```text
al cargar:
  status: live=polite atomic=true relevant=additions text
  textbox «Nombre»: required=false invalid=false
  textbox «Dirección»: required=false invalid=false
  textbox «Tiempo límite (ms)»: required=false invalid=false
  alert: live=assertive atomic=true relevant=additions text
  status: live=polite atomic=true relevant=additions text
después de entrar a «Nombre» y salir con Tab sin escribir:
  status: live=polite atomic=true relevant=additions text
  textbox «Nombre»: required=false invalid=false
  textbox «Dirección»: required=false invalid=false
  textbox «Tiempo límite (ms)»: required=false invalid=false
  alert: live=assertive atomic=true relevant=additions text
  status: live=polite atomic=true relevant=additions text
```

Et avec le point de contrôle :

```text
al cargar:
  status: live=polite atomic=false relevant=additions text
  textbox «Nombre»: required=true invalid=false
  textbox «Dirección»: required=true invalid=false
  textbox «Tiempo límite (ms)»: required=true invalid=false
  alert: live=assertive atomic=true relevant=additions text
después de entrar a «Nombre» y salir con Tab sin escribir:
  status: live=polite atomic=false relevant=additions text
  textbox «Nombre»: required=true invalid=false
  textbox «Dirección»: required=true invalid=false
  textbox «Tiempo límite (ms)»: required=true invalid=false
  alert: live=assertive atomic=true relevant=additions text
```

Le premier `status` est celui de la boîte d'avis ; avec le formulaire d'avant, il y avait un second `status`, celui du succès dans le formulaire, qui n'existe plus. Les trois champs sont passés à `required=true`, et aucun n'est devenu `invalid` pour avoir été touché sans saisie.

Et un point où le formulaire reste en deçà, dit avec la même franchise :

1. **Une erreur répétée n'est pas annoncée de nouveau.** Mesuré dans la figure 5 sur une zone identique à celle du formulaire ; l'effet sur le lecteur est déduit, il n'a pas été mesuré. C'est le second Entrée de Raúl, et c'est l'exercice 3.

## L'erreur que tu vas voir

La leçon comporte une erreur principale, celle qui apparaît dans la console, et trois erreurs secondaires qui ne se voient pas à l'œil nu.

**L'erreur principale : un `value` sans `onChange`.** Si tu remplaces `defaultValue` par `value` dans `Campo.tsx`, en pensant que « comme ça le champ affiche la valeur de l'état », React écrit dans la console du navigateur l'avertissement que la figure 1 a capturé :

```text
You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
```

Et le champ devient en lecture seule : tu saisis et il ne se passe rien, comme dans le troisième cas de la figure. Le message propose les trois issues et celle qui convient à ce formulaire est la première, `defaultValue`. Ce n'est ni une erreur de compilation ni une erreur du linter : TypeScript accepte `value` sur un `<input>`, et `npm run build` se termine sans erreur. Cela se voit dans la console du navigateur en développement, et à l'écran, puisqu'on ne peut pas saisir.

**L'erreur du compilateur : le schéma s'est éloigné de l'API.** Dans une copie du point de contrôle, remplace dans `esquemaAlta.ts` la clé `timeoutMs` par `tiempoMs` et lance `npx tsc -b` :

```text
$ npx tsc -b; echo "código de salida: $?"
src/alta/FormularioAlta.tsx(40,41): error TS2741: Property 'timeoutMs' is missing in type 'ValoresDe<{ nombre: Esquema<string>; url: Esquema<string>; tiempoMs: Esquema<number>; }>' but required in type 'NuevoServicio'.
src/alta/FormularioAlta.tsx(87,32): error TS2339: Property 'timeoutMs' does not exist on type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>> | { nombre: string; url: string; timeoutMs: string; }'.
  Property 'timeoutMs' does not exist on type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/FormularioAlta.tsx(88,26): error TS2339: Property 'timeoutMs' does not exist on type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/darDeAlta.ts(19,7): error TS7053: Element implicitly has an 'any' type because expression of type '"nombre" | "timeoutMs" | "url"' can't be used to index type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
  Property 'timeoutMs' does not exist on type 'Partial<Record<"nombre" | "tiempoMs" | "url", string>>'.
src/alta/esquemaAlta.ts(21,88): error TS2741: Property 'timeoutMs' is missing in type 'ValoresDe<{ nombre: Esquema<string>; url: Esquema<string>; tiempoMs: Esquema<number>; }>' but required in type 'NuevoServicio'.
src/alta/estadoFormulario.ts(21,56): error TS2353: Object literal may only specify known properties, and 'timeoutMs' does not exist in type 'Readonly<Record<"nombre" | "tiempoMs" | "url", string>>'.
código de salida: 1
```

Tu as renommé une clé et le compilateur a trouvé six endroits, dans quatre fichiers, où cela casse quelque chose, et il s'est terminé avec le code 1. C'est ce code qui compte : c'est pourquoi `npm run build`, qui est `tsc -b && vite build`, n'atteint jamais `vite build`. Ces erreurs se lisent en deux groupes. Les deux `TS2741` disent la même chose depuis deux endroits : `ValoresAlta` n'a plus `timeoutMs`, donc il ne peut pas être utilisé comme `NuevoServicio`. L'une se trouve dans `esquemaAlta.ts(21,…)`, c'est-à-dire `comprobarContrato`, et l'autre dans `FormularioAlta.tsx(40,…)`, l'appel à `darDeAlta(validacion.valor)`. Les quatre autres sont des endroits qui écrivent encore `timeoutMs` en dur (les deux attributs du `Campo` du délai d'expiration dans `FormularioAlta`, `textosDe` et `erroresDe`) et qui ne correspondent plus aux types dérivés du schéma. Sans ces types dérivés, le formulaire enverrait à l'API un corps avec `tiempoMs` et l'API renverrait `400` pour un champ `timeoutMs` que le formulaire ne sait plus afficher. Avec eux, l'erreur apparaît avant toute exécution. `comprobarContrato` est la ligne qui garantit cet avertissement même si un jour plus personne n'appelle `darDeAlta` avec les valeurs du schéma.

**L'erreur silencieuse : `useFormStatus` dans le mauvais composant.** Si tu déplaces `useFormStatus` dans `FormularioAlta` pour « t'économiser un composant », `pending` vaut toujours `false` : le bouton n'affiche jamais « Dando de alta… », n'est jamais marqué comme indisponible et n'ignore jamais le second envoi, si bien qu'un double clic envoie deux fois. Il n'y a d'avertissement ni dans la console ni dans le linter. La figure 3 l'a mesuré (`mismo=false` dans les deux exécutions) et la documentation le signale comme mise en garde. La correction est celle du point de contrôle : le hook va dans un composant rendu **à l'intérieur** du `<form>`.

**L'autre erreur silencieuse : les champs qui se vident.** Si `Campo` recevait un `defaultValue` fixe, chaque envoi avec erreurs laisserait les champs vides, comme dans la première exécution de la figure 3. Là non plus, personne ne prévient. Le signal, c'est la plainte de la personne qui remplit le formulaire : « ça m'a tout effacé ».

## Ce qui se fait de travers

**Contrôler tous les champs par habitude.** Trois états et trois `onChange` pour un formulaire qu'on ne lit qu'à l'envoi, c'est refaire le travail que le navigateur faisait déjà, avec un rendu complet à chaque frappe. Contrôle un champ quand l'écran a besoin de sa valeur pendant la saisie.

**Valider avec `onSubmit`, `e.preventDefault()` et un `useState` pour « en cours d'envoi ».** Cela fonctionne, et c'est réinventer `<form action>`, `useActionState` et `useFormStatus`, avec davantage d'occasions de se tromper (oublier de désactiver le bouton, oublier de le réactiver en cas d'erreur).

**S'arrêter à la première erreur.** Cela oblige la personne à découvrir les erreurs une par une, avec un envoi pour chacune. Un formulaire les rassemble toutes.

**Appeler l'API sans valider avant.** Le schéma rejette dans le navigateur ce que l'API rejetterait, sans requête et avec des messages à côté de chaque champ. L'API continue de valider, car elle ne peut pas faire confiance à l'écran ; les deux validations ne se concurrencent pas, elles se complètent. Et certaines validations ne peuvent être faites que par le serveur : un vrai `revisor` qui visite les adresses que quelqu'un enregistre doit refuser celles de son propre réseau (`127.0.0.1`, `169.254.169.254`, `10.x`…), sinon n'importe qui pourrait s'en servir pour jeter un œil à l'intérieur. Cette attaque s'appelle la falsification de requête côté serveur (SSRF), et le cours HTTP de Hábil la traite dans l'encadré de sécurité de sa leçon 1. `urlHttp` accepte ces adresses sans broncher : le schéma du navigateur ne protège pas contre cela, et ne prétend pas le faire.

**Des erreurs qui ne sont qu'une couleur.** Une bordure rouge sans texte ne dit rien à un lecteur d'écran ni à qui ne distingue pas le rouge. WCAG 3.3.1 exige l'erreur sous forme de texte.

**Un texte d'erreur isolé, sans `aria-describedby`.** Il se voit, mais il n'est pas relié au champ : la figure 4 a montré qu'un lecteur ne l'associe pas.

**`aria-invalid="true"` dès le premier rendu.** Cela crie « invalide » avant que la personne ait saisi quoi que ce soit. La spécification recommande de ne pas marquer un champ obligatoire vide avant une tentative d'envoi.

**Désactiver le bouton qui a le focus.** `disabled` empêche le double envoi, mais emporte le focus : mesuré dans Chrome, il tombe sur le `body` et ne revient pas. `aria-disabled` avec le clic annulé conserve le focus (7.2.4).

**`aria-disabled` sans la garde.** L'attribut dit « indisponible » mais n'empêche rien : mesuré, le second Espace a été envoyé.

**Annoncer la même chose dans deux zones dynamiques.** Un succès dans le formulaire et un autre identique dans la boîte d'avis s'entendent deux fois. Un avis, un endroit.

**La zone dynamique qui naît avec son message.** `{error && <div role="alert">…</div>}` peut ne pas être annoncé. La zone est vide dès le début et c'est son contenu qui change.

**`role="alert"` pour tout.** Il interrompt. Un succès, un « enregistré » ou un « chargement » relèvent de `status`.

**ARIA là où il existe un élément natif.** Un `<div role="button" onClick>` au lieu d'un `<button>` perd le clavier, l'ordre de tabulation et l'envoi du formulaire. La première règle d'ARIA existe pour cela.

**Déplacer le focus vers le message d'erreur avec un `tabindex` positif ou des astuces d'ordre.** Cela désorganise la navigation de tout le monde. Si un jour tu décides de déplacer le focus, fais-le avec `tabindex="-1"` et `.focus()` sur le message, et que ce soit une décision réfléchie, pas un rafistolage.

## Exercices

### Exercice 1 — Prédis le `FormData`

Sans rien exécuter, écris dans ton journal de bord le `FormData` que reçoit `enviar` si la personne saisit ` correo ` (avec des espaces), `https://correo.example` et `1500`, et ce que renvoie `validarCampos` avec ces textes. Quel type a `timeoutMs` dans chacun des deux ? Vérifie ensuite : ajoute un `console.log(textos, validacion)` temporaire dans `enviar`, envoie le formulaire avec `npm run dev` et lis la console du navigateur. Retire la ligne quand tu as terminé.

### Exercice 2 — Le `409` de près

Avec le serveur d'entraînement et `npm run dev` démarrés, enregistre `correo` deux fois. **Avant** le second envoi, prédis : quel champ reste marqué, que dit sa description, qu'annonce la zone `alert` et que reste-t-il de saisi dans les trois champs ? Une seconde ligne « (agregando…) » apparaît-elle dans « Altas de esta sesión » ? Vérifie chaque prédiction dans le navigateur. Pour voir l'attribut, utilise les outils de développement (onglet des éléments) sur le champ « Nombre ».

### Exercice 3 — Que la seconde erreur soit annoncée elle aussi

La figure 5 a montré qu'un second envoi avec le même message ne modifie pas le DOM de la zone `alert`. Modifie `FormularioAlta` pour que **chaque** envoi avec erreurs produise un changement dans cette zone, sans changer le texte affiché. Indice : l'état `con-errores` peut contenir un nombre qui augmente à chaque envoi, et React remplace un élément lorsque sa `key` change. Vérifie ta solution en adaptant la figure 5 avant de toucher au `revisor`. Restaure le point de contrôle quand tu as terminé, ou garde ta modification dans une copie.

### Exercice 4 — L'arbre d'accessibilité de tes propres yeux

Ouvre `http://localhost:5173/servicios/nuevo` dans Chrome, avec les outils de développement, et dans l'onglet des éléments cherche le panneau d'accessibilité. **Avant de regarder, prédis** ce que dit ce panneau de trois éléments : le champ « Nombre » (est-il obligatoire ? est-il invalide ?), la zone des erreurs du formulaire et la zone de la boîte d'avis (à quel point chacune est polie et si elle est lue en entier). Vérifie. Ensuite, envoie le formulaire vide et regarde de nouveau « Nombre ». Enfin, dans une copie du point de contrôle, retire `required` de `Campo.tsx` et refais la première lecture. Restaure la copie quand tu as terminé.

## Solutions

### Solution 1

Le `FormData` contient trois textes, tels quels : `nombre` vaut `" correo "`, `url` vaut `"https://correo.example"` et `timeoutMs` vaut `"1500"` ; `textosDe` les copie sans les modifier, et c'est pourquoi `textos.timeoutMs` est un `string`. `validarCampos` renvoie `{ ok: true, valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 } }` : `textoNoVacio` a retiré les espaces, `urlHttp` a normalisé l'adresse avec sa `/` finale et `enteroPositivoDeTexto` a converti le texte en nombre `1500`. C'est le corps qui part vers l'API : `{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}`. Si dans la console tu vois le `FormData` comme un objet opaque, c'est normal : affiche `textos`, qui est un objet simple.

### Solution 2

Le second envoi passe la validation locale (le formulaire ne sait pas quels noms existent), donc l'API est appelée et renvoie `409` avec `campos.nombre`. **Seul** « Nombre » reste marqué, avec `aria-invalid="true"` et `aria-describedby="nombre-error nombre-ayuda"`, et sa description commence par « ese nombre ya existe ». La zone `alert` annonce le `detalle` de l'API, « ya existe un servicio llamado correo ». Les trois champs conservent ce que tu as saisi, car l'état `con-errores` contient les `textos` et `Campo` les utilise comme `defaultValue` (la figure 3). Et aucune seconde ligne en attente n'apparaît : le reducer de `useOptimistic` ignore un nom déjà présent dans `altas`, et `correo` était déjà confirmé depuis le premier envoi. Si au lieu de cela tu redémarres le serveur d'entraînement entre les deux envois, le second donne `201` : le serveur conserve les données en mémoire et revient aux quatre habituels.

### Solution 3

Une façon de faire consiste à ce que l'état `con-errores` contienne un compteur d'envois et que le paragraphe utilise ce compteur comme `key` :

```tsx
// fragmento: estadoFormulario.ts y FormularioAlta.tsx
| {
    readonly tipo: "con-errores";
    readonly envio: number;
    // …los demás campos
  }

// en enviar: envio: (_previo.tipo === "con-errores" ? _previo.envio : 0) + 1

<div role="alert">
  {estado.tipo === "con-errores" && <p key={estado.envio}>{estado.detalle}</p>}
</div>
```

Avec une `key` différente à chaque envoi, React ne réutilise pas le `<p>` : il retire l'ancien et en place un nouveau, et la zone `alert` change même si le texte est identique. En adaptant la figure 5 (donner au `<p>` une `key={envio}`), le second envoi doit compter des changements, et non `0`. Remarque que le premier argument d'`enviar`, que le point de contrôle ignore sous le nom `_previo`, est justement celui qui fournit le compteur : c'est l'état précédent que te remet `useActionState`. Si tu l'utilises, retire le tiret bas de son nom, car ce n'est plus un argument ignoré.

### Solution 4

Le panneau montre la même chose que les lectures de `Accessibility.getFullAXTree` de 7.4.2, car c'est le même arbre. « Nombre » est obligatoire (grâce à `required`) et n'est pas invalide (grâce à `aria-invalid="false"`) ; son nom est « Nombre » et sa description, l'aide. La zone des erreurs est assertive et se lit en entier (`role="alert"`, avec `aria-atomic` implicite à `true`) ; celle de la boîte d'avis est polie et ne se lit pas en entier (`role="status"` avec `aria-atomic="false"`). Après l'envoi à vide, « Nombre » devient invalide et sa description commence par « escribe un valor » : c'est l'état `con-errores` qui arrive jusqu'au champ. Sans `required`, la propriété d'obligation disparaît ou passe à faux, ce que l'arbre indiquait avant les corrections de cette leçon (`required=false`). Si ta prédiction a échoué pour la boîte d'avis, reviens à 7.3.3 : `status` apporte `aria-atomic="true"` par défaut, et c'est l'attribut explicite qui le change. Le panneau peut nommer les propriétés autrement selon la version de Chrome ; ce qui compte, c'est la valeur.

## Comment savoir que j'ai réussi

- [ ] `npm ci`, `npm run lint` et `npm run build` s'exécutent sans erreur dans `~/curso-react/revisor/`, et `npm run build` produit `dist/assets/index-WLyq37jn.js` si ton code est identique à celui du point de contrôle.
- [ ] Avec `npm run dev`, ouvrir `http://localhost:5173/servicios/nuevo` affiche le lien « Dar de alta » marqué comme courant dans la navigation et le formulaire à trois champs ; dans les outils de développement, chaque champ a `aria-invalid="false"` et `aria-describedby` pointant vers son aide.
- [ ] Envoyer le formulaire vide marque les trois champs, écrit « Revisa los campos marcados. » et, dans l'onglet réseau, **aucune** requête vers `/api/servicios` n'apparaît.
- [ ] Avec le serveur d'entraînement démarré, enregistrer `correo` avec `https://correo.example` et `1500` affiche « Se dio de alta correo » dans la boîte d'avis (et nulle part ailleurs), ajoute la ligne dans « Altas de esta sesión », vide les champs, et la liste de `/` inclut déjà `correo`.
- [ ] Répéter l'enregistrement de `correo` ne marque que « Nombre » et conserve la saisie dans les trois champs.
- [ ] **Manuellement, au clavier :** depuis la barre d'adresse, Tab parcourt dans l'ordre les liens « Reporte » et « Dar de alta », les deux cases des préférences, les trois champs et le bouton (c'est l'ordre dans lequel ils apparaissent dans le HTML de « Le pourquoi avant le comment » et dans celui de la disposition, avec la boîte d'avis vide), et chacun affiche le contour bleu ; Entrée dans n'importe quel champ envoie le formulaire. Rien ne reçoit le focus hors de cet ordre. Et un test de plus : amène le focus sur le bouton avec Tab et envoie avec Espace. Tant qu'il affiche « Dando de alta… », le bouton apparaît estompé, un second Espace ne fait rien, et le contour bleu reste sur lui ; à la fin, le focus est toujours là (7.2.4).
- [ ] **Manuellement, avec un lecteur d'écran** (Orca sur ton Mint, NVDA sous Windows ou VoiceOver sous macOS) : à l'envoi à vide, le lecteur annonce « Revisa los campos marcados. » sans que tu déplaces le focus ; en arrivant sur « Nombre », il lit l'étiquette, l'état invalide et la description avec l'erreur en premier ; à l'enregistrement, il annonce le succès **une seule fois** ; avec plusieurs avis dans la boîte d'avis, il ne lit que le nouveau. Note dans ton journal de bord ce que tu as entendu dans chaque cas.
- [ ] Les figures 1 à 5 donnent sur ta machine la même sortie que dans la leçon.
- [ ] Tu as noté dans ton [journal de bord](bitacora.md) ce que fait chaque attribut du HTML montré dans « Le pourquoi avant le comment ».

## Résumé

Réponds sans regarder la leçon :

1. Quelle différence y a-t-il entre `defaultValue` et `value` sur un `<input>` ? Quel avertissement React émet-il si tu passes `value` sans `onChange`, et quelles sont ses trois issues ?
2. Pourquoi l'enregistrement du `revisor` utilise-t-il des champs non contrôlés ? Dans quel cas en contrôlerais-tu un ?
3. Que reçoit la fonction de `useActionState`, et dans quel ordre ? Que devient ce qu'elle renvoie ?
4. Pourquoi React vide-t-il les champs après une action avec erreurs, et comment le `revisor` évite-t-il que la saisie soit perdue ?
5. D'où faut-il appeler `useFormStatus` pour que `pending` passe à `true` ?
6. Quand l'état de `useOptimistic` est-il rendu et quand cesse-t-il de l'être ? Pourquoi une modification d'état qui suit un `await` dans l'action est-elle enveloppée dans `startTransition`, et qu'a-t-on vu dans Chrome quand on ne le faisait pas ?
7. Pourquoi `validarCampos` rassemble-t-il toutes les erreurs, et que protège `comprobarContrato` ?
8. Qu'annonce un lecteur d'écran grâce à `aria-invalid` et à `aria-describedby`, et dans quel ordre lit-il la description ?
9. Quelle différence y a-t-il entre `role="status"` et `role="alert"` ? Pourquoi la zone doit-elle exister avant l'arrivée du message ? Pourquoi la boîte d'avis porte-t-elle `aria-atomic="false"` et pas l'`alert` du formulaire ?
10. Que dit la première règle d'ARIA, et que perd un `<div role="button">` par rapport à un `<button>` ?

## Pour aller plus loin

- [React, `<form>`](https://react.dev/reference/react-dom/components/form) : `action` en tant que fonction, la *Transition*, le `POST` implicite et la réinitialisation des champs non contrôlés après l'action. Consulté le 21 octobre 2026.
- [React, `useActionState`](https://react.dev/reference/react/useActionState) : la signature, les deux arguments de l'action, le type de l'état, le périmètre d'erreur si l'action lève une erreur et la raison pour laquelle elle n'est pas appelée deux fois sous `StrictMode`. Consulté le 21 octobre 2026.
- [React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus) : `pending`, `data`, `method` et `action`, et pourquoi il ne renseigne que sur le `<form>` parent. Consulté le 21 octobre 2026.
- [React, `useOptimistic`](https://react.dev/reference/react/useOptimistic) : l'état optimiste qui n'existe que pendant que l'action est en cours et l'avertissement s'il est modifié hors d'une action. Consulté le 21 octobre 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input) : champs contrôlés et non contrôlés, `defaultValue`, l'avertissement de `value` sans `onChange` et le passage de non contrôlé à contrôlé. Consulté le 21 octobre 2026.
- [W3C, « Accessible Rich Internet Applications (WAI-ARIA) 1.2 »](https://www.w3.org/TR/wai-aria-1.2/) : les rôles `status` et `alert` avec leurs valeurs implicites, et les attributs `aria-invalid`, `aria-describedby` et `aria-required`. Consulté le 21 octobre 2026.
- [W3C, « Using ARIA »](https://www.w3.org/TR/using-aria/) : la première et la deuxième règle d'utilisation d'ARIA. Consulté le 21 octobre 2026.
- [W3C, « ARIA Authoring Practices Guide: Read Me First »](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/) : « pas d'ARIA vaut mieux qu'un mauvais ARIA » et pourquoi les rôles n'ajoutent pas de comportement clavier. Consulté le 21 octobre 2026.
- [W3C, « Accessible Name and Description Computation 1.2 »](https://www.w3.org/TR/accname-1.2/) : comment la description est calculée à partir des identifiants d'`aria-describedby`, dans l'ordre. Consulté le 21 octobre 2026.
- [W3C, « HTML Accessibility API Mappings 1.0 »](https://www.w3.org/TR/html-aam-1.0/) : l'attribut `required` exposé comme `aria-required`. Consulté le 21 octobre 2026.
- [W3C WAI, « Forms Tutorial: User Notifications »](https://www.w3.org/WAI/tutorials/forms/notifications/) : associer un champ à son message d'erreur au moyen d'`aria-describedby`. Consulté le 21 octobre 2026.
- [W3C, WCAG 2.2 : « Understanding SC 3.3.1: Error Identification »](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [« SC 3.3.2: Labels or Instructions »](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) et [« SC 4.1.3: Status Messages »](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) : l'erreur décrite sous forme de texte, les étiquettes et les messages d'état sans focus. Consulté le 21 octobre 2026.
- [MDN, « ARIA live regions »](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) : établir la zone avant de la mettre à jour, `polite` par rapport à `assertive` et `aria-atomic`. Consulté le 21 octobre 2026.
- [MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid), [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby), [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage), [rôle `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) et [rôle `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role) : quand marquer un champ comme invalide, comment il se relie à sa description et quand utiliser chaque zone dynamique. Consulté le 21 octobre 2026.
- [MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled) et [WHATWG, HTML, « Implicit submission »](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission) : ce que fait et ne fait pas `aria-disabled`, et Entrée depuis un champ comme un clic sur le bouton d'envoi. Consulté le 21 octobre 2026.
- [Chrome DevTools Protocol, domaine `Accessibility`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/) : `Accessibility.getFullAXTree`, l'arbre d'accessibilité lu avant et après les corrections. Consulté le 21 octobre 2026.
- [MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) et [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible) : l'étiquette associée, `novalidate`, l'ordre de tabulation et le focus visible. Consulté le 21 octobre 2026.

### Termes de cette leçon

| Terme | Ce qu'il signifie |
|---|---|
| champ non contrôlé | un `<input>` dont la valeur est conservée par le navigateur ; React ne pose que la valeur initiale avec `defaultValue` |
| champ contrôlé | un `<input>` dont la valeur est décidée par React à chaque rendu avec `value` et `onChange` |
| action (*Action*) | une fonction que React exécute à l'intérieur d'une *Transition* ; avec `<form action>`, elle reçoit le `FormData` |
| `useActionState` | hook qui conserve ce qu'a renvoyé la dernière action et fournit la fonction pour la déclencher |
| `useFormStatus` | hook qui, depuis un composant situé dans un `<form>`, indique si ce formulaire a un envoi en attente |
| état optimiste | ce qui est affiché tant qu'une action n'est pas terminée, avant que l'API ne confirme |
| `startTransition` | fonction de React qui marque une mise à jour comme faisant partie d'une *Transition* ; dans une action, elle y ramène ce qui suit un `await` |
| arbre d'accessibilité | la version de la page que le navigateur fournit aux lecteurs d'écran : rôles, noms, descriptions et états |
| nom accessible | le texte par lequel la technologie d'assistance identifie un élément ; pour un champ, son étiquette |
| description accessible | le texte supplémentaire lu après le nom ; ici, l'erreur et l'aide d'`aria-describedby` |
| zone dynamique (*live region*) | une partie de la page dont la technologie d'assistance annonce les changements sans déplacer le focus |
| `role="status"` / `role="alert"` | zone dynamique polie, qui attend / zone dynamique assertive, qui interrompt |
| `aria-disabled` | attribut qui annonce « indisponible » sans retirer le focus ni rien désactiver ; le comportement est écrit par le développeur |
| `aria-atomic` | indique si une zone dynamique est lue en entier (`true`) ou seulement ce qui a changé (`false`) à chaque changement |
| `:focus-visible` | pseudo-classe CSS qui s'applique lorsque le focus doit être visible, typiquement lors de la navigation au clavier |

---

**Suivante :** [Leçon 8 — Tests de composants](08-pruebas-de-componentes.md)
