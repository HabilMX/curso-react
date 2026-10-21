# Урок 5 — Маршрути и URL като състояние

*23:10 ч. е и си дежурен. В 23:04 ч. `pagos` започна да дава грешки, а човекът от екипа по експлоатация, който води инцидента, ти пише в чата: „Ще ми пратиш ли панела вече филтриран, само с онова, което не работи?“. Поставяш ѝ адреса, който имаш в браузъра. Тя го отваря и вижда четирите услуги, без филтър, защото полето за отмятане „Solo fallas“ живееше в паметта на твоя раздел, а не в адреса. Обясняваш ѝ писмено: „отметни полето, после кликни върху pagos“. Тя го прави, вижда детайла и за да има свежи данни, натиска F5. Браузърът ѝ отговаря със страница за грешка от сървъра: `404 File not found`. В 23:12 ч. тя ти звъни да те пита дали и панелът не е спрял да работи. Не е спрял. Липсваха му две неща: адрес, който казва какво гледаш, и сървър, който знае какво да отговори, когато някой презареди този адрес. Този урок изгражда и двете.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 5.2 и 5.3)

**Какво изграждаш:** `revisor` с три екрана, към които може да се дава връзка: списъкът на `/`, детайлът на всяка услуга на `/servicios/:nombre` и страница „не е намерено“ за всеки друг адрес; филтрите „Solo fallas“ и „Buscar por nombre“ пътуват в адреса (`?fallas=1&q=pag`), а бележките оцеляват при ходене напред-назад между екраните; и ако някоя страница се счупи при изрисуването си, панелът показва собственото си известие, а не страница за грешка на английски

**Какво научаваш:** маршрути като обекти с `createBrowserRouter`, вложени с `<Outlet />`; параметри на маршрута с `useParams` и параметри на търсенето с `useSearchParams`; филтър, който се споделя чрез копиране на връзката; `Link` и `NavLink`; границата за грешки (error boundary) на маршрут с `ErrorBoundary` и `useRouteError`; **какво става, когато някой презареди клиентски маршрут, и защо сървърът трябва да отговори с `index.html`**

**Откъде идваш.** От [Урок 4](04-estado-del-servidor.md). Твоят `revisor` вече извлича данните с TanStack Query: отчетът се иска с `useQuery`, пази се в кеша, обновява се във фонов режим на всеки 10 секунди и има своите четири състояния плюс едно (зареждане, грешка, празно, с данни и стари данни с известие). Детайлът на една услуга се появява под списъка, в `PanelDetalle`, когато кликнеш върху името ѝ, а бутонът „Volver a revisar“ е мутация, която инвалидира отчета и детайла. Всичко това живее в един-единствен екран, управляван от компонента `Panel`, който пази три състояния с `useState`: `soloFallas`, `seleccionado` и `notas`. Тръгваш от контролната точка [`programas/04-estado-del-servidor/revisor/`](../programas/04-estado-del-servidor/revisor).

**Какво не прави този урок.** Не пипа тестовия сървър: той остава във версия C, същата от урок 4, със същите маршрути. Не използва *loaders* и *actions* на React Router: данните продължава да ги извлича TanStack Query, по причини, които се обясняват в 5.1. Не мести бележките в контекст на React: те се качват едно ниво нагоре, в оформлението (layout) на маршрутите, а [Урок 6](06-reducer-contexto.md) обсъжда дали това е окончателното им място. Не добавя екрана за създаване, който идва със своя маршрут `/servicios/nuevo` в [Урок 7](07-formularios-accesibilidad.md). Не тества маршрутите с рутер в паметта в рамките на тестов пакет: това е [Урок 8](08-pruebas-de-componentes.md), макар че фигурите от този урок вече използват този рутер. И не пише сървъра, който публикува `dist/` с пренаписване (rewrite): този урок показва защо е нужен; [Урок 9](09-rendimiento-publicacion.md) го пише.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` за този урок, и с Python 3.12 за статичния сървър от 5.3. Контролната точка беше инсталирана от нулата с `npm ci`; `npm run lint` и `npm run build` завършиха успешно и произведоха `dist/assets/index-CLDgPzLo.js`, същото име, което даде контролната точка при проверката ѝ в контейнер с Linux (Debian 12, образ `node:24.22.0-bookworm`). Не беше изпълнено на реален Linux Mint; нищо от показаното не зависи от операционната система. `npm ci` отпечатва под macOS предупреждение от `install-scripts` за `fsevents@2.3.3`: това е незадължителна зависимост, която се инсталира само на macOS за наблюдение на файлове, няма нужда да се одобрява и в твоя Mint няма да се появи. Това, което се вижда „в браузъра“, беше измерено с Chrome в режим без графичен интерфейс (*headless*, `--headless --dump-dom`) срещу `vite preview`, с опцията `--virtual-time-budget`, която превърта часовниците на страницата напред, за да не се чака наистина: затова часовете в лога на тестовия сървър (по UTC) не служат за измерване на закъснения в този урок, а само за преброяване на заявките. Изпълненията на границата за грешки (5.1.6, упражнение 3) и тези с `curl` от 5.3 бяха направени с тестовото API на порт 3199 и с `vite preview` и сървъра на Python на 4199, защото на машината за изпълненията обичайните портове бяха заети от други процеси; урокът ги показва с портовете на курса (3100, 4173 и 4190), което е единственото, което се променя. Фигурите бяха изпълнени със собствен `package.json` в [`programas/05-rutas-url-como-estado/`](../programas/05-rutas-url-como-estado), до `revisor/`; дългите пътища се показват спрямо `~/curso-react`.

## След урока ще можеш да

- Да декларираш маршрутите на едно приложение като масив от обекти (`RouteObject[]`), да ги влагаш под оформление с `<Outlet />` и да предвиждаш кой компонент изрисува всеки адрес, включително такъв, който не съществува.
- Да четеш параметър на маршрута с `useParams`, да обясниш защо TypeScript му дава тип `string | undefined` и да провериш, че той пристига декодиран (`cat%C3%A1logo` → `catálogo`).
- Да пазиш филтри в адреса с `useSearchParams`, да обясниш с фигура разликата между `replace: true` и обикновена навигация за бутона „Назад“ и да споделиш филтър, като копираш връзката.
- Да използваш `Link` и `NavLink` и да посочиш в HTML атрибута `aria-current="page"` и класа `active`, които поставя `NavLink`.
- Да обясниш защо компонент на маршрут запазва състоянието си, когато се променя само параметърът, и да го нулираш с `key`.
- Да обясниш защо `LimiteDeError` от урок 4 престава да вижда грешките на страниците, когато се появи рутерът, да предизвикаш `Unexpected Application Error!` и да декларираш `ErrorBoundary` в кореновия маршрут, който показва същото известие.
- Да докажеш с `curl`, че статичен сървър без пренаписване отговаря с 404 при презареждане на `/servicios/pagos`, а `vite preview` отговаря с `index.html`.

## Защо, преди как

`revisor` от урок 4 работи, но има **един-единствен адрес**: `http://localhost:5173/`. Всичко останало — дали филтрираш, коя услуга си избрал, каква бележка си написал — живее вътре в раздела, в състоянието на `Panel`. Задай на този екран четири въпроса и ще видиш празнините.

**Можеш ли да изпратиш това, което гледаш?** Не. Адресът винаги е един и същ, така че който го отвори, вижда целия списък, без филтър и без избрана услуга. За да „изпратиш“ един изглед, трябва да изпратиш инструкции. Това е сцената от началото.

**Работи ли бутонът „Назад“?** Също не. Ако избереш `pagos`, а после `inventario`, и натиснеш „Назад“, браузърът не се връща към `pagos`: излиза от панела, защото за него никога не е имало повече от една страница. Човекът използва бутона, който използва най-много в живота си, а приложението прави нещо, което той не очаква.

**Какво става, ако презаредиш?** Губи се всичко, което не е било в адреса: филтърът и избраната услуга се връщат към началната си стойност. На екран за дежурство, където презареждането е рефлекс, това означава всеки път да кликаш отново.

**Как расте?** В урок 7 идва екран за създаване. С един-единствен адрес `Panel` би трябвало да решава с все повече `if` какво да изрисува, а всеки нов екран би бил още едно разклонение на състоянието, което някой забравя да нулира.

Четирите въпроса имат един и същ отговор: **това, което човекът гледа, трябва да е записано в адреса.** Адресът е състояние, също като `useState`, с три предимства, които никой `useState` няма: може да се копира, браузърът пази неговата история (затова съществува „Назад“) и оцелява при презареждане. И има една последица, която лесно се забравя: ако адресът `/servicios/pagos` може да се копира, някой ще го постави в току-що отворен браузър, а този браузър ще го поиска **от сървъра**, който никога не е чувал за `pagos`.

Инструментът за първото е **рутер (router)**: част, която чете адреса, решава кои компоненти да изрисува и променя адреса, без да презарежда страницата, когато човекът навигира. Курсът използва **React Router**, във версия 8.5.0, и го инсталира като един-единствен пакет, `react-router`: версия 8 спря да публикува `react-router-dom`, пакета, който ще срещнеш в стари уроци в интернет, а специфичните за браузъра части сега се импортират от `react-router/dom` ([React Router, „Upgrading from v7“](https://reactrouter.com/upgrading/v7)). Същото ръководство определя какво изисква: Node 22.22 или по-нова версия и React 19.2.7 или по-нова; курсът използва Node 24 и React 19.3.1. За второто не е нужна никаква библиотека, а да се разбере какво иска браузърът от сървъра и какво трябва да отговори той; това е 5.3.

Урокът има три части, по една за всяко понятие: маршрутите като обекти, оформлението, което ги обвива, и границата за грешки, която ги пази (5.1); параметрите и търсенето, тоест адресът като състояние (5.2); и презареждането на клиентски маршрут (5.3). Накрая ето какво изрисува `revisor`, когато отвориш `http://localhost:4173/?fallas=1` в нов браузър, без да си направил нито едно кликване (показват се заглавието и контейнерът, точно както ги предаде Chrome в режим *headless*):

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox" checked=""> Solo fallas</label><label>Buscar por nombre <input type="search" value=""></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="falla"><a href="/servicios/pagos" data-discover="true">pagos</a>: falla (HTTP 503)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul><p class="actualizado">Actualizado a las 2:14:52 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

Полето за отмятане пристига отметнато (`checked=""`), а списъкът съдържа само `pagos` и `reportes`. Никой не го е отметнал: отметна го адресът.

## Понятията

### 5.1 Маршрутите са обекти, а оформлението ги обвива

#### 5.1.1 Инсталиране на рутера и в какъв режим да се използва

От `~/curso-react/revisor/`, с точната версия, която курсът фиксира:

```bash
npm install --save-exact react-router@8.5.0
```

`package.json` на контролната точка изглежда така; променят се версията, която следва урока, и новата зависимост:

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

React Router може да се използва по три начина, които документацията му нарича **режими** и които се надграждат един върху друг ([React Router, „Picking a Mode“](https://reactrouter.com/start/modes)). В **декларативния режим** обвиваш приложението в `<BrowserRouter>` и пишеш маршрутите като компоненти вътре в дървото. В **режима с данни** декларираш маршрутите **извън** React, като масив от обекти, който подаваш на `createBrowserRouter`, и ги изрисуваш с `<RouterProvider>`; в замяна получаваш *loaders*, *actions* и състояния на навигацията. А **режимът framework** обвива режима с данни с приставка (plugin) за Vite, която добавя конвенции за файловете, разделяне на кода и изрисуване на сървъра.

Курсът използва режима с данни, но не и неговите *loaders*. Причината за първото е практическа: масив от обекти може да се **експортира**, а урок 8 монтира същия този масив в рутер в паметта, за да тества екраните без браузър; фигурите от този урок вече го правят. Причината за второто е, че `revisor` вече реши в урок 4 как да извлича данни: TanStack Query пази кеша, обновява във фонов режим и споделя една заявка между екраните. Ако се добавят и *loaders*, ще има две системи, отговорни за едно и също нещо. Това е принцип на курса, а не правило на React Router; в приложение без библиотека за данни *loaders* са добър отговор. А режимът framework остава извън курса по същата причина, която урок 9 обсъжда, когато говори за framework-ове: курсът иска да видиш всяка част.

#### 5.1.2 Маршрутите на `revisor`

Това е най-важният нов файл в урока. Той е масив от обекти и всеки обект казва **кой адрес** и **кой компонент**:

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

Прочети го отвън навътре, защото така го чете React Router:

- **Външният маршрут**, `path: "/"`, изрисува `Disposicion`: заглавната част, навигацията и мястото, където отива страницата. Всички останали маршрути са негови **дъщерни** (`children`), така че оформлението се изрисува винаги, независимо от страницата. Документацията го казва така: маршрутът на родителя се добавя автоматично към този на всеки дъщерен, а дъщерните се изрисуват в `<Outlet />` на родителя ([React Router, „Routing“](https://reactrouter.com/start/data/routing)).
- **Индексният маршрут**, `index: true`, няма `path`: това е страницата, която се изрисува в `<Outlet />`, когато адресът е точно този на родителя, `/`. Това е отчетът.
- **`servicios/:nombre`** не започва с `/`, защото е относителен спрямо родителя: пълният адрес е `/servicios/:nombre`. Двоеточието маркира **динамичен сегмент**: когато адресът съвпадне, онова, което стои на тази позиция, се предава като параметъра `nombre`.
- **`*`** съвпада с всичко, което никой от съседните маршрути не е уловил. Това е страницата „не е намерено“.
- **`ErrorBoundary: ErrorDeRuta`** не е адрес: казва какво да се изрисува, ако нещо от този маршрут или от дъщерните му се счупи при изрисуването. Това е последната част от 5.1 и има собствен раздел, 5.1.6.

Забележи, че маршрутите използват `Component: PaginaReporte`, а не `element: <PaginaReporte />`. Съществуват и двете форми; с `Component` подаваш компонента и React Router го изрисува, когато е нужно, без да създава елементи предварително. Това е формата, която използват актуалните примери в документацията.

А редът? Може да си помислиш, че `*` трябва да е накрая, за да не „погълне“ останалите. Не е нужно: React Router не изпробва маршрутите в реда, в който си ги написал, а ги **класира** според това колко специфични са: фиксиран сегмент печели пред динамичен, а динамичен печели пред `*`. Страницата от документацията, която би трябвало да обяснява алгоритъма, [„Route Matching“](https://reactrouter.com/explanation/route-matching), е празна в тази версия (посетена на 21 октомври 2026 г.), затова беше проверено ръчно: с функцията `matchRoutes` от `react-router` и три маршрута, декларирани наобратно (`*`, после `servicios/:nombre`, после `servicios/nuevo`), `/servicios/nuevo` избра фиксирания, `/servicios/pagos` — динамичния, а `/otra` — заместващия символ (wildcard). Въпреки това курсът ги пише от най-специфичния към най-общия, защото така се четат по-лесно. Урок 7 добавя `servicios/nuevo` точно преди `servicios/:nombre` по същата причина.

Първата фигура проверява тези четири правила без браузър. Тя сглобява дърво от маршрути със същата форма като това на `revisor`, с компоненти, които само изписват какво са, и го изрисува с `createMemoryRouter`, събрата на `createBrowserRouter`, който пази адреса в паметта, вместо да го чете от адресната лента на браузъра:

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

Пет адреса, пет отговора, и в петте се появява `[disposición]`: външният маршрут се изрисува винаги. Третият ред изпреварва нещо от 5.2: адресът съдържаше `cat%C3%A1logo`, кодиран, а параметърът пристигна като `catálogo`. Последните два показват, че динамичният сегмент е **точно един сегмент**: `/servicios` (липсва му) и `/servicios/pagos/extra` (има в повече) не съвпадат със `servicios/:nombre` и ги улавя `*`.

#### 5.1.3 Рутерът се създава само веднъж, извън React

Стартирането се променя малко. `Panel` изчезва от `main.tsx` и на негово място влиза рутерът:

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

Два детайла са важни. Първият: **`createBrowserRouter(rutas)` се извиква само веднъж, при зареждането на модула, извън който и да е компонент.** Документацията е изрична: рутерите с данни не се пазят в състоянието на React; те се създават веднъж извън дървото и се подават на `<RouterProvider>` ([React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter)). Ако го създадеш вътре в компонент, всяко изрисуване на този компонент би създало нов рутер, който би започнал от нулата. Това е същата идея, за която урок 0 се погрижи с `cargarReporte`: онова, което трябва винаги да е едно и също, се декларира на ниво модул. И обърни внимание откъде идва всяка част: `createBrowserRouter` от `react-router`, а `RouterProvider` от `react-router/dom`, както посочва ръководството за инсталиране на режима с данни ([React Router, „Installation“](https://reactrouter.com/start/data/installation)).

Вторият детайл е **редът на обвивките**. Кешът на TanStack Query живее в обекта `clienteConsultas`, който `main.tsx` създава само веднъж; `QueryClientProvider` само го прави достъпен за компонентите под него. Като го поставиш **извън** `RouterProvider`, всички страници стигат до него: когато отидеш от списъка към детайла, `PaginaReporte` изчезва, но отчетът остава в кеша, и при връщане списъкът може да се изрисува с тези данни, докато Query решава дали е нужно да ги поиска отново (онова, което урок 4 нарече `staleTime`). Ако поставиш доставчика вътре в `PaginaReporte`, `PaginaServicio` би останала без клиент и нейният `useQuery` би хвърлил грешка. А ако освен това създадеш клиента вътре в страницата, кешът наистина би умирал всеки път, когато страницата се демонтира.

Какво означава „изрисуване с рутера на браузъра“? `createBrowserRouter` променя адреса с `history.pushState` и `history.replaceState`, две функции на браузъра, които променят онова, което пише в адресната лента, **без да искат нищо от сървъра**. MDN казва за `pushState` следното: браузърът няма да се опита да зареди този адрес след извикването, макар че може да се опита да го зареди по-късно, например след рестартиране ([MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)). Запомни това изречение, „може да се опита да го зареди по-късно“, защото целият раздел 5.3 е посветен на него.

#### 5.1.4 Оформлението и `<Outlet />`

Оформлението е компонентът на външния маршрут. То изрисува онова, което не се променя между страниците, и оставя празно място за онова, което се променя:

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

`<Outlet />` е това празно място. Когато адресът е `/`, там се изрисува `PaginaReporte`; когато е `/servicios/pagos` — `PaginaServicio`. Заглавната част и навигацията не се монтират наново при смяна на страницата: те остават същите компоненти, със същото състояние. И точно това се използва за бележките.

В урок 2 бележките живееха в `Panel`, до списъка и детайла, защото и двата имаха нужда от тях. Сега списъкът и детайлът са **различни страници** и когато навигираш от едната към другата, първата се демонтира. Ако бележките останеха в `PaginaReporte`, щеше да напишеш бележка в детайла на `pagos`, да се върнеш към списъка и маркировката „con nota“ нямаше да я има, защото състоянието на списъка е унищожено при излизането и е създадено празно при връщането. Правилото от урок 2 продължава да важи, само че с едно ниво повече: **състоянието се качва до най-близкия общ предшественик на онези, които го използват**, а общият предшественик на двете страници е оформлението.

За да свали стойността към страниците, `<Outlet>` приема свойство `context`, а страниците го четат с hook-а `useOutletContext`. Документацията го представя точно за този случай: родителските маршрути често управляват състояние, което искат да споделят с дъщерните си, и това е толкова често, че е вградено в `<Outlet>`, без да се налага да създаваш собствен контекст ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)). Същата страница препоръчва, с TypeScript, родителят да предлага **собствен hook** за четенето му, защото така онези, които го използват, получават правилния тип и се знае кой го използва. Това е `contextoNotas.ts`:

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

`useNotas()` е единственото място в кода, което извиква `useOutletContext`, и единственото, което казва на TypeScript каква форма има тази стойност. Страниците импортират `useNotas` и не знаят откъде идват бележките. Ако в урок 6 бележките сменят мястото си, ще се промени само този файл.

Една честна забележка за `Disposicion`: обектът `contexto` и функцията `guardarNota` се създават наново при всяко изрисуване. Това означава, че всеки път, когато оформлението се прерисува, се прерисува и страницата, която чете контекста. Това не е проблем, който да е бил измерен, а курсът не мемоизира без измерване, което да го изисква; урок 9 учи как се измерва.

#### 5.1.5 Страницата „не е намерено“

Маршрутът `*` изрисува тази страница:

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

`useLocation()` предава текущия адрес; от него интересува само `pathname`, за да се каже на човека кой адрес не съществува. Страницата се изрисува **вътре** в оформлението, така че заглавната част и навигацията са на мястото си: човекът има откъде да излезе. И тя слага собствено заглавие с hook-а от урок 3. Ето какво предаде Chrome за `/no-existe`:

```text
<title>Página no encontrada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Página no encontrada"><h2>Página no encontrada</h2><p>No existe ninguna página en /no-existe.</p><p><a href="/" data-discover="true">Ir al reporte</a></p></section></main></div>
```

#### 5.1.6 Когато една страница се счупи: границата за грешки на маршрутите

Има и друг вид „страница, която не работи“, и е добре да се разграничи от предишния: такава, която **съществува**, но хвърля грешка при изрисуването си. В урок 4 написа `LimiteDeError` точно за това: той обвиваше `Panel` и ако нещо се счупеше при изрисуването, вместо бял екран се появяваше известие със съобщението и бутон за презареждане. В `main.tsx` той все още е там, сега около `RouterProvider`. Изглежда, че нищо не се е променило. Променило се е, и единственият начин да го повярваш е да го видиш.

За целта е нужна страница, която се чупи. В **копие** на контролната точка, никога в оригинала, добави към `PaginaReporte`, точно след `useTituloDocumento`, грешка, която се задейства от адреса:

```tsx
// en una copia: revisor/src/reporte/PaginaReporte.tsx (fragmento)
  if (filtros.texto === "romper") {
    throw new Error("la página se rompió al dibujar");
  }
```

Тя стои след hook-овете, а не като първи ред на компонента, по причина, която вече знаеш: с `throw` преди `useQuery` hook-овете отдолу биха се извиквали „понякога“, а `react-hooks/rules-of-hooks` отхвърля това с по една грешка за всеки hook (измерено: четири). С `npm run build`, тестовия сървър и `npm run preview` стартирани, отвори `http://localhost:4173/?q=romper`. Ето какво предаде Chrome с кода, който `revisor` имаше преди този раздел (стекът на грешката (stack trace), десет реда с пътища от машината, е съкратен с `…`):

```text
<title>Revisor</title>
<div id="raiz"><h2>Unexpected Application Error!</h2><h3 style="font-style: italic;">la página se rompió al dibujar</h3><pre style="padding: 0.5rem; background-color: rgba(200, 200, 200, 0.5);">Error: la página se rompió al dibujar
    at …</pre></div>
```

Ни следа от `LimiteDeError`: нито неговият `role="alert"`, нито „Algo salió mal al dibujar el panel“, нито бутонът за презареждане. Вместо тях — страница на английски, със стека на грешката пред очите на всеки, която твоят код никога не е изрисувал. А с нея изчезнаха и заглавната част, и навигацията. Това би видял дежурният човек от сцената в 23:10 ч., ако панелът имаше дефект.

Причината: React Router поставя **собствена граница за грешки на всеки маршрут**. Когато една страница хвърли грешка, React търси нагоре най-близката граница, а най-близката вече не е `LimiteDeError`: тя е тази на React Router, която застана между твоята граница и страницата. Документацията го обяснява така: грешките на един маршрут се улавят автоматично и се изрисува най-близкият `ErrorBoundary`, а ако маршрутът няма собствен, грешката се качва към родителския маршрут ([React Router, „Error Boundaries“](https://reactrouter.com/how-to/error-boundary)). Ако никой маршрут не декларира такъв, React Router изрисува своя по подразбиране, който току-що видя. Грешката никога не стига до `LimiteDeError`, защото някой я е уловил преди това.

Фигура 6 възпроизвежда двата случая без браузър, с минимално оформление и страница, която хвърля грешка. Първо без собствена граница, а после с такава в кореновия маршрут, която чете грешката с `useRouteError`:

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

От това изпълнение излизат три неща. Без собствена граница на екрана остава `Unexpected Application Error!` и няма никакъв `role="alert"`: екранният четец не оповестява нищо. С границата в корена остава твоето известие, със своя `role="alert"`. И в двата случая **заглавната част я няма**, защото границата на един маршрут се изрисува **вместо** онова, което този маршрут би изрисувал, а тук маршрутът с граница е външният, онзи, който изрисува оформлението. (Двете предупреждения в конзолата се появяват и в двата случая: улавянето на грешка не я крие от програмиста.)

Решението е да се декларира тази граница. Същата страница от документацията изисква всяко приложение да има поне една в кореновия маршрут. В режима с данни тя се декларира със свойството `ErrorBoundary` на обекта на маршрута, а компонентът чете грешката с `useRouteError()`, защото не получава свойства. Съществува и `errorElement`, който получава вече създаден елемент; това е същата разлика като между `Component` и `element`, и курсът използва `ErrorBoundary` по същата причина, по която използва `Component`.

А какво трябва да показва? Идиоматичното за `revisor` е да показва **същото известие** като `LimiteDeError`. За човека, който използва панела, „нещо се счупи при изрисуването“ е едно и също, откъдето и да идва, а две различни известия за едно и също нещо биха били две неща за поддръжка. За да не се пише известието два пъти, представянето се изнася от класа в собствен компонент:

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

`LimiteDeError` прави същото като в урок 4; само делегира изрисуването:

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

А това е границата на маршрутите:

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

`useRouteError` предава онова, което е било хвърлено, а типът му е `unknown`, не `Error`, защото в JavaScript може да се хвърли всичко: текст, число, обект. Затова `describirError` проверява, преди да чете. Документацията разграничава три случая и `describirError` ги следва в същия ред: отговор с грешка от React Router, който се разпознава с `isRouteErrorResponse` и носи `status` и `statusText` (хвърлят го *loaders* и *actions*; `revisor` не ги използва, така че днес не пристига нито един, но покриването му струва три реда); `Error`, със своя `message`; и всичко останало. Обърни внимание, че `ErrorDeRuta` е **функционален** компонент: единственият клас в курса си остава `LimiteDeError`, защото React Router вече е написал класа вместо теб и иска от теб само онова, което се изрисува.

Последното е да се свърже: редът `ErrorBoundary: ErrorDeRuta` в `rutas.tsx`, който вече видя в 5.1.2. С него същото копие, построено наново, предаде това на `/?q=romper`:

```text
<title>Revisor</title>
<div id="raiz"><div role="alert" class="limite-de-error"><h2>Algo salió mal al dibujar el panel</h2><p>la página se rompió al dibujar</p><button type="button">Recargar la página</button></div></div>
```

Това е известието от урок 4, дума по дума, със своя `role="alert"` и своя бутон. А в същото копие `/?q=pag` продължи да изрисува списъка със заглавната си част: границата се появява само когато нещо се счупи. Още два детайла. Заглавието остана `Revisor`, това от `index.html`: страницата, която хвърли грешката, никога не завърши изрисуването си и нейният Effect от `useTituloDocumento` така и не се изпълни. И заглавната част изчезна, точно както във фигура 6: тази граница е последната мярка, онази, която замества всичко. Ако искаш човекът да запази заглавната част и навигацията, когато се счупи **една** страница, границата трябва да е по-навътре; това е упражнение 3.

Излишен ли е тогава `LimiteDeError`? Не. Границите на маршрутите виждат само онова, което се изрисува **вътре** в маршрутите. Онова, което е извън тях, като `QueryClientProvider`, остава извън обхвата им, и за това `LimiteDeError` остава в `main.tsx`. Всяка граница пази своя етаж, а двете показват едно и също известие.

### 5.2 Параметри и търсене: адресът като състояние

Един адрес има части, а React Router предава две от тях като данни. В `http://localhost:5173/servicios/pagos` частта, която има значение, е **пътят** (`/servicios/pagos`), а динамичният сегмент се чете с `useParams`. В `http://localhost:5173/?fallas=1&q=pag` пътят е `/`, а онова, което идва след `?`, е **търсенето** (*query string*), което се чете с `useSearchParams`. И двете са състояние: променят онова, което се изрисува, а да ги промениш означава да навигираш.

#### 5.2.1 Параметърът на маршрута: `useParams`

Детайлът на една услуга престава да бъде панел под списъка и става страница. `PanelDetalle` изчезва, а на негово място влиза `PaginaServicio`:

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

Първият ред на компонента е този, който най-много трябва да се разбере: `const { nombre = "" } = useParams();`. `useParams` връща динамичните сегменти на адреса като обект; тук `{ nombre: "pagos" }` ([React Router, `useParams`](https://reactrouter.com/api/hooks/useParams)). Типът му казва, че всяка стойност е `string | undefined`, и това не е песимизъм на TypeScript: hook-ът не знае в кой маршрут го извикваш, а един компонент би могъл да се използва в маршрут без `:nombre`. `= ""` му дава стойност по подразбиране, за да работи останалата част от компонента със `string`. В „Грешката, която ще видиш“ ще я премахнеш, за да видиш четирите грешки, които се появяват. На практика тази страница се изрисува само в `servicios/:nombre`, така че `nombre` никога не пристига празно.

С това име страницата прави онова, което правеше `PanelDetalle`: иска детайла със същата заявка от урок 4, `consultaDetalle(nombre)`, чийто ключ `["servicio", nombre]` разграничава кеша на всяка услуга, и предлага мутацията „Volver a revisar“. Новото е онова, което вече не е нужно. В урок 4 `ContenidoReporte` проверяваше дали избраната услуга съществува в списъка, преди да покаже нейния панел. Сега всеки може да напише `/servicios/nada` в адресната лента, а страницата няма списък, срещу който да провери. Не е нужно: API отговаря с 404 за услуга, която не съществува, `cargarDetalle` превръща това в грешка, а страницата показва предупреждението. Ето как го предаде Chrome:

```text
<title>nada · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio nada"><h2>Servicio nada</h2><p role="alert">No se pudo cargar el detalle: la API respondió 404</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

А ето как го видя логът на тестовия сървър:

```text
08:15:01.057 GET /api/servicios/nada 404
08:15:01.263 GET /api/servicios/nada 404
08:15:01.468 GET /api/servicios/nada 404
```

Три заявки за едно-единствено посещение. Не е `StrictMode`, защото това е построената версия, в която няма допълнителен цикъл: това е `retry: 2`, който урок 4 конфигурира в клиента за заявки и който опитва повторно при **всяка** грешка, включително 404, който никога няма да се промени. (Часовете са сбити заради превъртения напред часовник на Chrome; с обикновен браузър повторните опити пристигат на интервали.) Това е решение, което може да се прецизира — да се опитва повторно само когато грешката го заслужава, — но не е тема на този урок; запиши го в своя дневник като нещо, което си видял.

#### 5.2.2 Кодиране при писане, декодиране при четене

Услугата `catálogo` съдържа `á`. В един адрес символите извън едно малко множество пътуват **процентно кодирани**: `á` е два байта в UTF-8, които се записват като `%C3%A1`. Който сглобява адреса, кодира; който го чете, декодира. В `revisor` има три момента:

1. `FilaEstado` сглобява връзката с `encodeURIComponent(estado.nombre)`, което превръща `catálogo` в `cat%C3%A1logo`. Използва се `encodeURIComponent`, а не `encodeURI`, защото кодира и символите, които имат значение в един адрес, като `/`, `?` и `#` ([MDN, `encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)). Ако някой ден една услуга се казва `a/b`, без кодиране адресът би бил `/servicios/a/b`, което е друг път, и би попаднал в „не е намерено“.
2. `useParams` предава параметъра **вече декодиран**. Видя го във фигура 1: `cat%C3%A1logo` пристигна като `catálogo`. Документацията на hook-а не го казва с тези думи; казва го изпълнението, и затова фигурата съществува.
3. `cargarDetalle`, още от урок 3, кодира отново името, за да го поиска от API. Логът го потвърждава: `GET /api/servicios/cat%C3%A1logo 200`.

Двойното кодиране подред би било грешка (`%C3` би станало `%25C3`), а също и липсата на кодиране. Правилото е просто: **текстът, който пътува в един адрес, се кодира точно когато се поставя в него и се декодира точно когато се изважда**, а междувременно се работи с обикновения текст. Ето как го изрисува Chrome при отваряне на `/servicios/cat%C3%A1logo`:

```text
<title>catálogo · Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio catálogo"><h2>Servicio catálogo</h2><dl><dt>Estado</dt><dd>Disponible: HTTP 200 en 42 ms</dd><dt>Revisiones</dt><dd>2</dd><dt>Última revisión</dt><dd>2026-10-21T08:14:55.465Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre catálogo<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

#### 5.2.3 Същата страница, друг параметър: защо `key={nombre}`

В урок 3 `<PanelDetalle key={seleccionado}>` нулираше целия панел при смяна на услугата. В `PaginaServicio` `key` е по-надолу, в `<EditorNota key={nombre}>`. Нужно ли е? За да се отговори, трябва да се знае какво прави React Router, когато адресът се смени от `/servicios/pagos` на `/servicios/inventario`: **маршрутът е същият** (`servicios/:nombre`), така че компонентът, който го изрисува, е същият, на същата позиция в дървото. React не вижда нова страница; вижда същата `PaginaServicio` с друг параметър. А документацията на React е ясна какво означава това: същият компонент на същата позиция запазва състоянието си ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)).

Фигура 2 го показва с компонент, който, подобно на `EditorNota`, инициализира състоянието си от свойство. Навигира от `pagos` към `inventario` два пъти: без `key` и с него.

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

Без `key` адресът казва `inventario`, но черновата продължава да говори за `pagos`: `useState` използва началната си стойност само първия път, когато компонентът се монтира, а тук той не беше монтиран отново. С `key={nombre}` React третира всяко име като различен компонент, унищожава стария и създава нов. В `revisor`, без този `key`, черновата на бележката за `pagos` би се появила на страницата на `inventario`, готова да бъде записана за грешната услуга.

А защо `key` е в `EditorNota`, а не на цялата страница? Защото единственото, което пази собствено състояние, е черновата. Заявката за детайла няма нужда да се нулира: ключът ѝ включва името, така че при смяна на името TanStack Query сам преминава към друг запис в кеша. И днес, честно казано, интерфейсът на `revisor` не предлага директен път от един детайл към друг: винаги минаваш през списъка, а това демонтира страницата. `key` предпазва от деня, в който някой добави връзка „следваща услуга“, и е толкова евтин, че не си струва да се чака този ден, за да се постави.

#### 5.2.4 Филтрите в търсенето: `useSearchParams`

Филтрите са учебникарският случай на „състояние, което трябва да живее в адреса“: те описват какво гледаш, а някой друг ще иска да види същото. Планът на курса ги поставя в търсенето, с два параметъра: `fallas=1` за „Solo fallas“ и `q=texto` за „Buscar por nombre“. Първо типът и чистата функция, която филтрира, в `resumen.ts`:

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

`Filtros` събира двата филтъра в един обект, а `filtrarEstados` прилага и двата едновременно: една услуга преминава, ако отговаря на „само повреди“ (или филтърът е изключен) **и** ако името ѝ съдържа търсения текст (или не се търси нищо). Търсенето пренебрегва главните букви и интервалите в краищата и използва `toLocaleLowerCase("es-MX")`, за да следва сравнението правилата на испанския език. Тя продължава да бъде чиста функция: еднакви входове, еднакъв изход, а урок 8 я тества без React.

Сега новата част — hook-ът, който превежда между адреса и филтрите:

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

`useSearchParams` връща две неща, също като `useState`: текущите параметри, като обект `URLSearchParams` на браузъра, и функция за промяната им, която **предизвиква навигация** към новия адрес ([React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams)). `URLSearchParams` е стандартен интерфейс с методи за четене и писане на търсенето; неговият `get` връща `null`, когато параметърът липсва ([MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)). Пет решения в този файл заслужават собствен ред:

- **Филтрите се изчисляват, а не се пазят.** Няма `useState` с филтрите, който да се „синхронизира“ с адреса: всяко изрисуване ги чете от адреса. Това е правилото от урок 2, „не пази онова, което можеш да изчислиш“, приложено към нов източник на истина. Ако имаше `useState` в допълнение към адреса, щеше да имаш две истини, които могат да се разминат, и изкушението да ги поддържаш в съгласие с Effect, което е точно онова, което първият принцип на курса забранява.
- **`fallas` е `"1"` или не съществува.** Четенето е `parametros.get("fallas") === "1"`, а при изключване на филтъра параметърът се **изтрива**, вместо да се пише `fallas=0`. Същото с празното `q`. Така адресът без филтри е `/`, чист, а не `/?fallas=0&q=`.
- **Функцията за промяна получава само онова, което се е променило.** `cambiarFiltros({ soloFallas: true })` не пипа текста, защото `{ ...filtros, ...cambio }` смесва промяната с онова, което вече е имало. Затова типът е `Partial<Filtros>`.
- **Копира се, вместо да се мутира.** Формата с функция, `establecerParametros((actuales) => …)`, получава текущите параметри; кодът създава копие с `new URLSearchParams(actuales)` и променя копието. Документацията предупреждава, че обектът, който предава hook-ът, е мутируем и че ако го промениш, без да извикаш функцията за промяна, стойностите му се променят между изрисуванията, без адресът да го отразява. Копирането избягва този капан и запазва всеки друг параметър, който адресът носи. Същата страница предупреждава за още една разлика с `useState`: две последователни извиквания в един и същ момент **не** се навързват, както би го направила обновяващата форма на React. В `revisor` всяко събитие извиква функцията само веднъж, така че това не хапе.
- **`replace: true`.** Това е решението, което се забелязва най-много, и има собствена фигура.

#### 5.2.5 `replace: true`: писане в адреса, без да се пълни историята

Всеки път, когато промениш адреса с `pushState`, браузърът добавя запис в историята си, а „Назад“ се връща към предишния. За прехода от списъка към детайла това е точно онова, което искаш. За поле за търсене — не: всеки клавиш променя `q` и ако всеки клавиш беше запис, писането на `pagos` би създало пет, а човекът би трябвало да натисне „Назад“ пет пъти, за да излезе от списъка. С `replace: true` промяната **заменя** текущия запис, вместо да добавя нов: това е `replaceState`, която MDN описва като функцията, която променя текущия запис в историята ([MDN, `History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)). Документацията на `Link` го рисува с букви: при история `A → B` обикновена връзка оставя `A → B → C`; с `replace` — `A → C` ([React Router, `Link`](https://reactrouter.com/api/components/Link)).

Фигура 3 го измерва. Тя започва в списъка, след като е видян детайлът на `pagos` (история от два записа), въвежда `p`, `pa` и `pag` в поле за търсене като това на `revisor` и натиска „Назад“. Прави го два пъти: с обикновена навигация и с `replace: true`.

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

При обикновена навигация всеки клавиш беше `PUSH`, а „Назад“ те оставя на `/?q=pa`: отменя една буква. С `replace: true` всеки клавиш беше `REPLACE`, а „Назад“ те връща към детайла на `pagos`, където човекът е искал да се върне. Адресът е един и същ и в двата случая; онова, което се променя, е историята. Две бележки за фигурата: React DOM се импортира **след** създаването на тестовия DOM, защото при зареждането си решава дали има браузър, а без това събитията от клавиатурата не стигат до `onChange` (фигури 1, 2 и 5 не задействат събития, а само изрисуват и четат текст, и затова могат да го импортират отгоре); а фигурата пише в полето със `set` от прототипа на `HTMLInputElement`, за да забележи React промяната, което урок 8 ще прави вместо теб с `user-event`.

Това е принцип, а не закон: в `revisor` и „Solo fallas“ заменя записа. Би могъл да защитиш тезата, че отметването на полето заслужава собствен запис в историята; курсът избра да третира двата филтъра еднакво, като едно-единствено „как гледам списъка“, и „Назад“ да означава „към предишния екран“.

А интервалите? Ако търсиш `pago s` (с интервал), `URLSearchParams` записва интервала като `+`: MDN обяснява, че кодира процентно необходимото, а интервала — като `+`, и че при четене тълкува `+` като интервал. Не трябва да правиш нищо: hook-ът пише и чете по едни и същи правила. Просто не се изненадвай, ако видиш `?q=pago+s` в лентата.

#### 5.2.6 Отчетът, сега като страница

`Panel` изчезва и мястото му заема `PaginaReporte`. Тя вече няма нито един `useState`: заявката е същата от урок 4, филтрите идват от адреса, а бележките — от оформлението.

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

`cadaMs` вече не пристига като свойство от `main.tsx`: страницата го импортира от `configuracion.ts`, защото `main.tsx` вече не изрисува страници, а изрисува рутера. Останалото се разпределя така:

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

`ContenidoReporte` губи три свойства (`seleccionado`, `alSeleccionar`, `alGuardarNota`) и панела с детайла: това вече не е негова работа. Четирите му състояния плюс едно остават идентични. Той получава филтрите като обект и ги подава на `filtrarEstados`. Обърни внимание на един детайл, който се вижда в изхода на Chrome за `/?q=inv`: резюмето казва `4 servicios revisados · 2 servicios con falla`, макар че списъкът показва само една услуга. Това е нарочно: `ResumenFallas` получава `estados`, всичките, а не филтрираните. Резюмето описва отчета; филтърът само решава кои редове виждаш.

```text
<title>(2) Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><div class="filtros"><label><input type="checkbox"> Solo fallas</label><label>Buscar por nombre <input type="search" value="inv"></label></div><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li></ul><p class="actualizado">Actualizado a las 2:14:55 a.m.</p><button type="button">Actualizar</button></section></main></div>
```

Филтърът получава второ поле:

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

Двете полета са **контролирани**: стойността им идва от `filtros`, който идва от адреса, а всяка промяна изисква нов адрес. Пълният цикъл на един клавиш е: човекът натиска клавиш, `onChange` извиква `alCambiar`, hook-ът навигира с `replace`, адресът се променя, React Router прерисува страницата, `useFiltrosEnUrl` прочита новия текст и полето го показва. Изглежда дълго, а се случва в един и същ миг. Полето за търсене е `type="search"`, родната HTML контрола за това, която екранните четци оповестяват като поле за търсене.

Списъкът вече различава два вида празнота:

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

„No hay servicios configurados todavía.“ (в `ContenidoReporte`) означава, че сървърът няма услуги: това е четвъртото състояние от урок 4. „Ningún servicio coincide con los filtros.“ означава, че има, но твоите филтри ги скриват. Това са две различни ситуации, които изискват различни действия — да се изчака някой да конфигурира услуги или да се махне филтър, — и затова имат две различни съобщения.

#### 5.2.7 `Link` и `NavLink`

Редът престава да има бутон, който избира, и получава връзка, която води:

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

`Link` изрисува обикновен таг `<a>`, със своя `href`: документацията го нарича „прогресивно подобрена обвивка около `<a href>`“ за навигация от страна на клиента ([React Router, `Link`](https://reactrouter.com/api/components/Link)). В изхода на Chrome се вижда: `<a href="/servicios/pagos" data-discover="true">pagos</a>`. Когато кликнеш, `Link` не позволява на браузъра да поиска страницата от сървъра и иска от рутера да навигира с `pushState`. Тъй като е истински `<a>`, работи всичко, което човекът очаква от една връзка: да я отвори в друг раздел с Ctrl+клик или със средния бутон, да копира адреса ѝ, да го види при задържане на мишката. С бутона от урок 2 нищо от това не беше възможно. А екранният четец я оповестява като „връзка“, каквато тя е: води на друго място. Атрибутът `data-discover` се добавя от React Router към връзките му за откриването на маршрути, функция на режима framework ([React Router, „Lazy Route Discovery“](https://reactrouter.com/explanation/lazy-route-discovery)); в режима с данни можеш да го пренебрегнеш.

Навигацията в клиента има цена, която презареждането няма. Когато браузърът зарежда цяла страница, екранният четец оповестява новата страница, а фокусът започва отгоре. С `pushState` нито едното, нито другото не се случва от само себе си: страницата се променя под човека, а фокусът остава там, където си е бил. React Router предлага възстановяване на позицията на превъртане със `ScrollRestoration` („емулира възстановяването на превъртането на браузъра“, казва документацията му, [React Router, `ScrollRestoration`](https://reactrouter.com/api/components/ScrollRestoration)), а тази страница не споменава фокуса. Заглавието за всяка страница, което поставя `useTituloDocumento`, е част от отговора; другата част, преместването на фокуса там, където започва новата страница, е твоя работа. Урок 7, този за достъпността, се връща към клавиатурата и фокуса. Засега обходи `revisor` с Tab, след като кликнеш върху някоя услуга, и запиши в своя дневник къде е останал фокусът.

Навигацията на оформлението използва `NavLink` — `Link`, който знае дали неговата цел съвпада с текущия адрес. Когато съвпада, му добавя класа `active` и атрибута `aria-current="page"`, който казва на екранните четци „това е страницата, на която се намираш“ ([React Router, `NavLink`](https://reactrouter.com/api/components/NavLink)). Сравни двата изхода на Chrome: на `/?fallas=1` връзката казва `aria-current="page" class="active"`; на `/servicios/pagos` казва `class=""`. Файлът със стилове прави активната връзка удебелена:

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

А `end` в `<NavLink to="/" end>`? Обикновено един `NavLink` е активен и на адресите, които **започват** с неговата цел: връзка към `/servicios` би била активна на `/servicios/pagos`. `end` променя това: връзката е активна само ако адресът **завършва** там. Но документацията посочва един специален случай: тъй като **всички** адреси започват с `/`, `NavLink` към `/` вече се държи така, сякаш има `end`. Фигура 5 го проверява:

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

На `/servicios/pagos` е активна само „servicios sin end“; двете връзки към корена не са, независимо дали имат `end`. Така че в `revisor` `end` не променя резултата, и въпреки това се пише: той казва намерението („тази връзка е само списъкът“) на онзи, който чете кода, и не зависи от това някой да помни едно изключение.

И едно сбогуване: `.seleccionar` и `.detalle` от файла със стилове вече не се използват от нито един компонент. Те бяха на бутона от урок 2 и на панела от урок 3. Контролната точка ги запазва; запиши го като чакащо почистване.

### 5.3 Презареждане на клиентски маршрут: сървърът трябва да отговори с `index.html`

#### 5.3.1 Два пътя до един и същ адрес

Има два начина да се стигне до `/servicios/pagos`, и за сървъра те са напълно различни.

**Навигиране вътре в приложението.** Отваряш `/`, сървърът предава `index.html`, JavaScript се стартира и кликваш върху `pagos`. `Link` извиква `pushState`, лентата казва `/servicios/pagos`, а React Router изрисува `PaginaServicio`. **Сървърът не разбра нищо**: единствената нова заявка беше тази към API, `GET /api/servicios/pagos`.

**Пристигане отвън.** Презареждаш с F5, или поставяш връзката в нов браузър, или я отваряш от имейл. Сега няма заредено приложение. Браузърът прави онова, което прави с всеки адрес: иска `GET /servicios/pagos` **от сървъра**. Това е „може да се опита да го зареди по-късно“ от MDN. А сървърът трябва да отговори с нещо, с което браузърът да може да стартира приложението, за да прочете React Router адреса и да изрисува детайла. Това нещо е `index.html`, същият като за `/`: страницата не се променя, променя се само адресът, с който тя стартира.

Ако сървърът търси файл с име `servicios/pagos` вътре в `dist/`, няма да го намери, защото не съществува: в `dist/` има само един `index.html`, един `.js` и един `.css`. И отговаря с 404.

#### 5.3.2 Какво отговарят `vite dev` и `vite preview`

Досега никога не си виждал този 404, защото двата сървъра на Vite вече правят правилното. Vite има опция, `appType`, чиято стойност по подразбиране е `'spa'` (приложение с една страница), и която включва онова, което документацията му нарича *SPA fallback*: резервният вариант, който предава `index.html`, когато адресът не е файл ([Vite, „Shared Options“, `appType`](https://vite.dev/config/shared-options)). Във `vite dev` това го прави *middleware* на Vite; във `vite preview` същата документация казва, че той конфигурира `sirv`, файловия сървър, който използва вътрешно, със `single: true` — опцията, която отговаря с `index.html` на онова, което не намери. Урок 0 вече го беше докоснал в своето упражнение 3, когато `curl http://localhost:5173/salud` върна HTML-а на страницата. Ето какво отговори `vite preview` в този урок:

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
    <script type="module" crossorigin src="/assets/index-CLDgPzLo.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-yYL09Z4k.css">
  </head>
  <body>
    <div id="raiz"></div>
  </body>
```

Това е `index.html`, с код 200. И обърни внимание на пътищата до файловете: `/assets/index-CLDgPzLo.js`, с `/` в началото. Това е по-важно, отколкото изглежда. Ако пишеше `assets/index-CLDgPzLo.js`, без наклонената черта, браузърът би го разрешил **спрямо текущия адрес** и от `/servicios/pagos` би поискал `/servicios/assets/index-CLDgPzLo.js`, който не съществува. Началната наклонена черта кара JavaScript винаги да се иска от едно и също място, каквато и да е дълбочината на адреса.

Резервният вариант на `vite preview` е щедър, може би прекалено. Ето какво отговори на още три адреса:

```text
/no-existe → 200 text/html
/assets/no-existe.js → 200 text/html
/servicios/pagos?x=1 → 200 text/html
```

Първият е очакваният: `/no-existe` е клиентски маршрут и страницата „не е намерено“ се изрисува от React. Забележи, че пристига с код **200**: сървърът не знае кои маршрути съществуват в `rutas.tsx`, така че не може да каже 404. Вторият е спорната част: JavaScript файл, който не съществува, също получава HTML с 200, и браузър, който е очаквал код, получава страница. Сървърът, който пише урок 9, разграничава двата случая: пренасочва към `index.html` клиентските маршрути, но отговаря с 404 на онова, което липсва под `/assets/`.

#### 5.3.3 Сървърът, който не пренаписва

За да видиш 404, е нужен сървър, който сервира файлове и нищо повече. Python има вграден такъв: `python3 -m http.server`, с `--directory` за избор на папката и `--bind`, за да слуша само на твоята машина. Документацията му предупреждава, че не се препоръчва за продукция, и обяснява, че ако заявката не отговаря на файл, той отговаря с `404 File not found` ([Python, `http.server`](https://docs.python.org/3/library/http.server.html)). Идеален е за целта, точно защото е глупав. След като `npm run build` вече е изпълнен, от `~/curso-react/revisor/`:

```text
$ python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

А от друг терминал:

```text
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/
200 text/html
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/servicios/pagos
404 text/html;charset=utf-8
$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4190/assets/index-CLDgPzLo.js
200 text/javascript
```

Коренът работи, защото `dist/index.html` съществува; JavaScript също. Но `/servicios/pagos`, който с `vite preview` беше 200, тук е 404. Ако отвориш корена в браузъра и кликнеш върху `pagos`, всичко работи, защото кликването не стига до сървъра. Ако в този момент презаредиш, браузърът ти показва това, което видя човекът от сцената:

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

Логът на Python го записва черно на бяло:

```text
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /assets/index-CLDgPzLo.js HTTP/1.1" 200 -
127.0.0.1 - - [21/Oct/2026 02:37:43] code 404, message File not found
127.0.0.1 - - [21/Oct/2026 02:37:43] "GET /servicios/pagos HTTP/1.1" 404 -
```

Има по един ред `GET` за всяко от четирите `curl`, а всеки 404 е предшестван от своето обяснение; последната двойка е от `curl`, който донесе цялата страница за грешка. (Часовете в този лог са тези на машината, не UTC.) Спри сървъра с Ctrl+C.

Урокът е пряк: **щом едно приложение използва клиентски маршрути, сървърът, който го публикува, получава нова задача.** За всеки адрес, който не е реален файл, той трябва да отговори с `index.html` и да остави рутера да реши. Как се конфигурира зависи от сървъра: класическият уеб сървър има правило за пренаписване (rewrite rule), платформата за публикуване има опция „приложение с една страница“, а собственият сървър го прави с няколко реда код, които са онези, които пише урок 9. Онова, което не се променя, е проверката: **презареди дълбок маршрут на реалния сървър.** Проверката само с `vite preview` не доказва нищо за продукцията, защото `vite preview` вече прави пренаписването вместо теб и, както напомня документацията на Vite още от урок 0, не е сървър за продукция.

Има и друг изход, който си струва да се знае, за да се отхвърли с аргументи: да се постави маршрутът след `#` (`/#/servicios/pagos`). Браузърът никога не изпраща на сървъра онова, което идва след `#`, така че сървърът винаги вижда `/` и винаги предава `index.html`. React Router го предлага с `createHashRouter`. Работи на всеки статичен сървър, но адресите стават грозни, `#` престава да служи за скок към раздел от страницата, а истинският проблем — сървър, който не знае как да сервира приложение — остава скрит, вместо решен. Курсът използва обикновени адреси и решава проблема със сървъра.

## Грешката, която ще видиш

Урокът има една основна грешка, 404 при презареждане, която вече видя в 5.3, и две спомагателни, които се появяват при писането на страниците.

**Основната грешка: „при мен работи“.** Работи в `npm run dev`, работи в `npm run preview`, работи при кликване. Проваля се само когато някой **презареди** или **отвори връзка** на сървъра, където е публикувано приложението, и се проваля със страница, която не е от твоето приложение: `Error code: 404`, `File not found` или еквивалента на твоя сървър. Признакът, по който да я разпознаеш, е, че коренът `/` винаги работи, а онова, което се проваля, е всичко останало, и че в раздела за мрежата на браузъра заявката, която се проваля, е тази за **документа** (`/servicios/pagos`), а не тази към API (`/api/servicios/pagos`). Ако се проваля тази към API, проблемът е друг. Решението не е в React: то е да се конфигурира сървърът да отговаря с `index.html` на клиентските маршрути.

**Компонент на маршрут извън рутера.** Фигура 4 изрисува две дървета в собствена граница за грешки, като `LimiteDeError` на `revisor`. Първото използва `useSearchParams` без никакъв рутер около себе си, което става, ако изрисуваш самостоятелна страница, например в тест, който е забравил да я монтира в рутер. Второто е маршрут, който хвърля грешка при изрисуването, вътре в `RouterProvider`:

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

Първото съобщение казва `useLocation() may be used only in the context of a <Router> component.`, макар че кодът извика `useSearchParams`: вътрешно `useSearchParams` използва `useLocation`, а грешката я хвърля онзи, който пръв забележи. Разчитай я така: „този hook има нужда от рутер отгоре и не го намери“. Решението никога не е да се пипа hook-ът, а да се изрисува компонентът вътре в рутер; в урок 8 `montarEn(direccion)` прави точно това с `createMemoryRouter(rutas)`.

Вторият случай е този от 5.1.6. Собствената граница не разбра нищо: React казва в конзолата, че ще използва границата `RenderErrorBoundary`, която е на React Router, а на екрана се появява `Unexpected Application Error!`, последвано от съобщението. (Фигурата премахва от изхода блока със стека на грешката, който съдържа пътища от машината. А при изпълнение в режим на разработка React Router добавя абзац за програмиста, който го приканва да декларира собствен `ErrorBoundary`; фигурата се изпълнява с продукционната версия на пакета, в която го няма.) Това е същото, което видя в `revisor` в 5.1.6, а решението е това от онзи раздел: `ErrorBoundary` в маршрута.

**Параметърът, който може да липсва.** Премахни стойността по подразбиране в `PaginaServicio` и напиши `const { nombre } = useParams();`. Ето какво отговаря `tsc -b`:

```text
$ npx tsc -b
src/detalle/PaginaServicio.tsx(12,45): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(13,35): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(45,13): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/detalle/PaginaServicio.tsx(46,33): error TS2538: Type 'undefined' cannot be used as an index type.
```

Четири грешки, по една за всяко място, което **изисква** `string`: заявката за детайла, мутацията, свойството `nombre` на `EditorNota` и индексът `notas[nombre]`. Другите три употреби (заглавието на раздела, това на картата и `key`) не се оплакват: шаблонният низ превръща `undefined` в думата `"undefined"` и я изписва на екрана без предупреждение, а това е грешка, която TypeScript не улавя. Това е същото предупреждение от 5.2.1, видяно от страна на компилатора: `useParams` не може да обещае, че параметърът съществува. Има три разумни решения: стойността по подразбиране `= ""`, която използва контролната точка; проверка в началото, която изрисува нещо друго, ако параметърът липсва; или, в режима framework, генерираните типове за всеки маршрут. Онова, което не е разумно, е да се заглуши с `nombre!`: този удивителен знак казва на TypeScript „довери ми се“, а това е точно онова, което компилаторът се опитваше да предотврати. (Тази грешка беше предизвикана в копие на контролната точка; оригиналът минава `tsc -b` чисто.)

## Какво се прави погрешно

**Копиране на адреса в `useState` и синхронизирането им с Effect.** „Чета `?q=` при монтиране, пазя го в състояние, а един Effect записва състоянието в адреса, когато се промени.“ Това са два източника на истина, едно допълнително изрисуване при всяка промяна и Effect, който не се синхронизира с нищо външно. Адресът вече е състоянието: чети го при всяко изрисуване.

**Използване на `<a href>` за навигиране вътре в приложението.** Работи, и затова заблуждава: всяко кликване презарежда цялата страница: губи се кешът на TanStack Query, губят се бележките в оформлението, а браузърът отново иска страницата и стартира цялото приложение от нулата. Вътре в приложението — `Link`; обикновен `<a>` само за излизане от него.

**Бутон с `onClick`, който навигира, вместо връзка.** Губи всичко, което една връзка дава безплатно: отваряне в друг раздел, копиране на адреса, оповестяване от екранния четец като връзка. Ако води на друго място, това е връзка.

**Писане в историята при всеки клавиш.** Без `replace: true` едно поле за търсене оставя по един запис за всяка буква, а „Назад“ се превръща в „отмяна“ буква по буква (фигура 3).

**Сглобяване на адреси без кодиране.** `` `/servicios/${nombre}` `` работи с `pagos` и се проваля в деня, в който някое име съдържа `/`, `?` или `#`. Кодирай при поставянето на текста, с `encodeURIComponent`, и остави `useParams` да декодира.

**Да се разчита на външната граница за грешките на страниците.** `LimiteDeError` в `main.tsx` не вижда какво става вътре в маршрутите: React Router улавя грешката преди това. Без собствен `ErrorBoundary` човекът вижда `Unexpected Application Error!` и стека на грешката (5.1.6).

**Създаване на рутера вътре в компонент.** Всяко изрисуване би създало нов рутер, който започва от нулата. Той се създава веднъж, на ниво модул, както изисква документацията.

**Инсталиране на `react-router-dom`.** Пакетът все още е в npm, но остана на версия 7 (измерено: неговата версия `latest` е 7.18.4 и зависи от `react-router` 7.18.4); версия 8 вече не го публикува. Затова `npm install react-router-dom` не се проваля: той тихомълком ти донася второ копие, `react-router@7`, до версия 8. Ако смесиш импорти от двата пакета, всяко копие търси собствения си рутер и не намира този на другото, а резултатът е първата грешка от фигура 4. Всичко идва от `react-router`, а `RouterProvider` — от `react-router/dom`.

**Публикуването да се смята за проверено, защото `vite preview` работи.** `vite preview` пренасочва към `index.html` сам. Единствената проверка, която има значение, е да се презареди дълбок маршрут на сървъра, където се публикува.

**Пазене в адреса на онова, което не описва изгледа.** Недописана чернова, парола, токен: адресът се копира, пази се в историята, появява се в логовете на сървърите и пътува в заглавката `Referer`. В адреса отива онова, което някой би искал да сподели; останалото — не.

## Упражнения

### Упражнение 1 — Предвиди адреса

С тестовия сървър и `npm run dev` стартирани, отвори `http://localhost:5173/`. **Преди да пипнеш каквото и да е**, запиши в своя дневник какъв адрес ще имаш, след като направиш, в този ред: напишеш `rep` в „Buscar por nombre“ и после отметнеш „Solo fallas“. Запиши също кои услуги ще видиш и къде те отвежда бутонът „Назад“ на браузъра. Направи го и сравни. После повтори в обратния ред (първо полето за отмятане, после текста), започвайки от `/`. Адресът същият ли е? Има ли значение?

### Упражнение 2 — Махни `replace` и брой

В копие на контролната точка изтрий `{ replace: true }` от `filtrosEnUrl.ts` (заедно със запетаята му). **Предвиди** колко пъти ще трябва да натиснеш „Назад“, за да се върнеш към детайла на `pagos`, ако от този детайл отидеш в списъка и напишеш `inventario` в полето за търсене. Провери го в браузъра. Съвпада ли с онова, което показа фигура 3? Възстанови реда накрая и изпълни `npm run lint` и `npm run build`.

### Упражнение 3 — Собствена граница за детайла

Границата в корена е последната мярка: когато се появи, тя отнася заглавната част и навигацията. За детайла на една услуга можеш да се справиш по-добре. В копие на контролната точка добави към маршрута `servicios/:nombre` собствена граница, в нов файл `src/detalle/ErrorDeServicio.tsx`, която изрисува `Tarjeta` със заглавие `Servicio <nombre>`, абзац с `role="alert"`, който казва „No se pudo mostrar este servicio:“, последвано от съобщението на грешката, и връзка „Volver al reporte“. За да го провериш, накарай `PaginaServicio` да хвърля грешка **само** когато `nombre` е `pagos`; помисли къде да постави `throw`, така че `npm run lint` да го приеме.

**Преди да изпробваш**, предвиди три неща: на `/servicios/pagos` вижда ли се заглавната част „Revisor“ с навигацията си?; какво заглавие има разделът?; а на `/servicios/inventario` променя ли се нещо? Провери го с `npm run build` и `npm run preview` и изхвърли копието накрая.

### Упражнение 4 — Къде живее всяко състояние?

Без да гледаш кода, класифицирай всяко парче състояние на `revisor` в едно от четири места: **локално** (`useState` вътре в компонент), **адрес**, **сървър** (TanStack Query) или **оформление** (`Outlet context`). Парчетата: черновата на една бележка; вече записаната бележка; „Solo fallas“; търсеният текст; услугата, чийто детайл гледаш; списъкът с услуги; детайлът на една услуга; дали тече обновяване („· actualizando…“). За всяко от тях напиши причина от един ред. После го провери срещу кода.

## Решения

### Решение 1

Докато пишеш `rep`, адресът минава през `/?q=r`, `/?q=re` и `/?q=rep`, а списъкът показва само `reportes`. При отметване на полето остава `/?q=rep&fallas=1` и продължаваш да виждаш `reportes`, която е в грешка. „Назад“ те изкарва от списъка там, където си бил, преди да го отвориш (ако си отворил раздела директно на `/` — към предишната страница на браузъра), защото четирите промени замениха записа, вместо да добавят други. В обратния ред адресът става `/?fallas=1&q=rep`. Не е същият низ, защото `cambiarFiltros` копира текущите параметри, а `set` добавя накрая параметър, който не е съществувал, като запазва реда на вече съществуващите. Но това няма значение: `useFiltrosEnUrl` чете всеки параметър по името му с `get`, така че двата адреса изрисуват точно едно и също. Ако споделиш който и да е от двата, онзи, който го отвори, вижда твоя изглед.

### Решение 2

Без `replace`, от детайла на `pagos` историята става такава: детайлът, списъкът при кликване върху „Volver al reporte“ и по един запис за всяка от десетте букви на `inventario`. За да се върнеш към детайла, са нужни единадесет натискания на „Назад“: десет, за да отмениш буквите, и едно, за да излезеш от списъка. Това е същото, което показа фигура 3 с три букви, където едно „Назад“ отмени само една. С възстановения `replace: true` стига едно. Това упражнение се проверява с очите в реален браузър; фигура 3 е неговата автоматична версия.

### Решение 3

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

В `rutas.tsx` маршрутът на детайла получава своята граница (а файлът — импорта на `ErrorDeServicio`):

```tsx
// en una copia: revisor/src/app/rutas.tsx (fragmento)
      { path: "servicios/:nombre", Component: PaginaServicio, ErrorBoundary: ErrorDeServicio },
```

А нарочната грешка отива в `PaginaServicio` след всичките ѝ hook-ове, точно преди `return`, по същата причина като тази от 5.1.6:

```tsx
// en una copia: revisor/src/detalle/PaginaServicio.tsx (fragmento)
  if (nombre === "pagos") {
    throw new Error("el detalle se rompió al dibujar");
  }
```

С това копието мина `npm run lint` и `npm run build`, а Chrome предаде следното на `/servicios/pagos`:

```text
<title>Revisor</title>
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a></nav></header><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><p role="alert">No se pudo mostrar este servicio: el detalle se rompió al dibujar</p><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Трите предвиждания. **Да**, заглавната част и навигацията са на мястото си: грешката потърси нагоре най-близката граница, а най-близката сега е тази на маршрута на детайла, която замества само `PaginaServicio`; `Disposicion` не разбра нищо. Заглавието на раздела е `Revisor`, а не `pagos · Revisor`: страницата хвърли грешка, преди да завърши изрисуването си, и нейният Effect от `useTituloDocumento` така и не се изпълни. Ако искаш заглавието, границата трябва да го постави сама. А на `/servicios/inventario` нищо не се променя: детайлът се изрисува изцяло (`Disponible: HTTP 200 en 118 ms`), защото границата се появява само когато нещо се счупи.

`useParams` работи вътре в границата, защото границата се изрисува на мястото на маршрута, със същите му параметри. А съобщението е собствено нарочно: „No se pudo mostrar este servicio“ казва на човека коя част се е провалила и му оставя изхода под ръка, докато известието в корена говори за целия панел. Ако си поставил `throw` като първи ред на компонента, `npm run lint` е отговорил с `rules-of-hooks`, по една грешка за всеки hook отдолу; а и `tsc` се оплаква, защото след безусловен `throw` вече не може да изведе, че `consulta.data` съществува.

### Решение 4

| Състояние | Къде живее | Защо |
|---|---|---|
| чернова на бележка | локално (`EditorNota`) | интересува само онзи, който я пише, и трябва да се нулира при смяна на услугата (`key`) |
| записана бележка | оформление (`Outlet context`) | нужна е на две страници, списъка (маркировката „con nota“) и детайла, и трябва да оцелява при ходене напред-назад |
| „Solo fallas“ | адрес (`?fallas=1`) | описва изгледа и човек иска да го споделя |
| търсен текст | адрес (`?q=`) | същото като предишното |
| услугата, която гледаш | адрес (`/servicios/:nombre`) | тя е самата страница; в урок 2 беше `useState` `seleccionado` |
| списък с услуги | сървър (`["reporte"]`) | принадлежи на сървъра; екранът пази копие в кеша |
| детайл на услуга | сървър (`["servicio", nombre]`) | същото, с по един запис в кеша за всяка услуга |
| „· actualizando…“ | сървър (`isFetching` на заявката) | никой не го пази: изчислява го TanStack Query |

Ако си поставил бележките в адреса, помисли какво би станало при споделяне на връзката: твоите бележки биха пътували до другия човек и биха раздували адреса без ограничение. Ако си ги поставил на сървъра, прав си в дългосрочен план — днес те се губят при презареждане, — но тестовото API няма маршрут за записването им. [Урок 6](06-reducer-contexto.md) се връща към тази таблица и добавя колона: контекста.

## Как разбирам, че съм успял

- [ ] `npm ci`, `npm run lint` и `npm run build` завършват без грешка вътре в `~/curso-react/revisor/`, а `npm run build` произвежда `dist/assets/index-CLDgPzLo.js`, ако твоят код е идентичен с този на контролната точка.
- [ ] `npm ls react-router` показва `react-router@8.5.0`, а `npm ls react-router-dom` отговаря с `└── (empty)` и завършва с код 1, което тук е очакваното: пакетът не е намерен.
- [ ] С тестовия сървър и `npm run preview` стартирани, отварянето на `http://localhost:4173/?fallas=1` в нов раздел показва отметнатото поле и само `pagos` и `reportes`; заглавието на раздела е `(2) Revisor`.
- [ ] `http://localhost:4173/servicios/pagos` показва детайла на `pagos` и заглавието `pagos · Revisor`; `http://localhost:4173/no-existe` показва „Página no encontrada“ със заглавната част на `revisor` отгоре.
- [ ] В браузъра: пишеш бележка в детайла на `pagos`, записваш я, връщаш се към отчета с „Volver al reporte“ и редът на `pagos` казва „· con nota“. (Това се проверява ръчно: изпълненията от този урок не правят кликвания.)
- [ ] Когато пишеш в „Buscar por nombre“, адресът се променя с всеки клавиш, а едно-единствено „Назад“ те изкарва от списъка.
- [ ] В HTML на страницата (с инструментите за разработчици или с Chrome в режим *headless*) връзката „Reporte“ има `aria-current="page"` на `/` и го няма на `/servicios/pagos`.
- [ ] С `python3 -m http.server 4190 --bind 127.0.0.1 --directory dist` `curl` към `/servicios/pagos` отговаря с `404`, а с `vite preview` същият маршрут отговаря с `200 text/html`. Можеш да обясниш защо и си спрял и двата сървъра.
- [ ] В копие с `throw` от 5.1.6 `/?q=romper` показва „Algo salió mal al dibujar el panel“ с `role="alert"`, а не `Unexpected Application Error!`; в контролната точка, без `throw`, списъкът изглежда както винаги. Можеш да кажеш защо това известие не се изрисува от `LimiteDeError`.
- [ ] Шестте фигури се компилират с `tsc` и изходът им съвпада с този от урока.
- [ ] Записа в своя [дневник](bitacora.md) кое състояние отиде в адреса, кое състояние се качи в оформлението и 404, който видя с Python.

## Обобщение

Отговори, без да гледаш урока:

1. Кои четири неща, които липсваха на панела с един-единствен адрес, решава запазването на изгледа в адреса?
2. Какво изрисува индексният маршрут? Защо `servicios/:nombre` не започва с `/`? Какво улавя `*`?
3. Защо рутерът се създава на ниво модул и защо `QueryClientProvider` е извън `RouterProvider`?
4. Защо бележките се качиха в оформлението и как ги четат страниците?
5. Защо `useParams` дава на параметъра тип `string | undefined`? В кой момент се кодира и в кой момент се декодира `catálogo`?
6. Защо `PaginaServicio` не се монтира отново при преминаване от `/servicios/pagos` към `/servicios/inventario` и какво прави `key={nombre}` в `EditorNota`?
7. Защо филтрите се четат от адреса при всяко изрисуване, вместо да се пазят в `useState`? Какво променя `replace: true`?
8. Какво иска браузърът от сървъра, когато презаредиш `/servicios/pagos`, какво трябва да отговори той и защо проверката с `vite preview` не доказва нищо за продукцията?
9. Защо `LimiteDeError` престана да вижда грешките на страниците, когато се появи рутерът? Къде се декларира границата, която ги улавя, защо нейното известие замества заглавната част и за какво `LimiteDeError` остава в `main.tsx`?

## За допълнително четене

- [React Router, „Picking a Mode“](https://reactrouter.com/start/modes) и [„Installation“ (режим с данни)](https://reactrouter.com/start/data/installation): декларативният режим, режимът с данни и режимът framework, какво добавя всеки от тях и откъде се импортират `createBrowserRouter` и `RouterProvider`. Посетено на 21 октомври 2026 г.
- [React Router, „Routing“ (режим с данни)](https://reactrouter.com/start/data/routing): маршрути като обекти, вложени маршрути с `<Outlet />`, индексни маршрути, динамични сегменти и `*`. Посетено на 21 октомври 2026 г.
- [React Router, `createBrowserRouter`](https://reactrouter.com/api/data-routers/createBrowserRouter): че използва `pushState` и `replaceState` и че рутерът се създава веднъж извън дървото на React. Посетено на 21 октомври 2026 г.
- [React Router, `useParams`](https://reactrouter.com/api/hooks/useParams): динамичните параметри на адреса и техният тип. Посетено на 21 октомври 2026 г.
- [React Router, `useSearchParams`](https://reactrouter.com/api/hooks/useSearchParams): двойката параметри и функция, формата с функция, предупреждението за последователни извиквания и за мутиране на обекта. Посетено на 21 октомври 2026 г.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): споделяне на състоянието на родителя с дъщерните маршрути и препоръката за собствен hook с TypeScript. Посетено на 21 октомври 2026 г.
- [React Router, `Link`](https://reactrouter.com/api/components/Link) и [`NavLink`](https://reactrouter.com/api/components/NavLink): подобреният `<a href>`, `replace`, класът `active`, `aria-current="page"`, `end` и специалният случай на `/`. Посетено на 21 октомври 2026 г.
- [React Router, „Error Boundaries“](https://reactrouter.com/how-to/error-boundary): как се улавят грешките на един маршрут, минималната граница в кореновия маршрут, `ErrorBoundary` с `useRouteError` в режима с данни, трите случая (`isRouteErrorResponse`, `Error`, всичко останало) и как грешката се качва до най-близката граница. Посетено на 21 октомври 2026 г.
- [React Router, „Upgrading from v7“](https://reactrouter.com/upgrading/v7): защо версия 8 вече не публикува `react-router-dom` и минималните версии на Node и React. Посетено на 21 октомври 2026 г.
- [React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state): същият компонент на същата позиция запазва състоянието си, а `key` го нулира. Посетено на 21 октомври 2026 г.
- [MDN, `History.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) и [`History.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState): добавяне или замяна на запис в историята без зареждане на адреса. Посетено на 21 октомври 2026 г.
- [MDN, `URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) и [`encodeURIComponent()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent): четене и писане на търсенето, интервалът като `+` и кои символи се кодират в част от адрес. Посетено на 21 октомври 2026 г.
- [Vite, „Shared Options“, `appType`](https://vite.dev/config/shared-options): стойността `'spa'` по подразбиране и резервният вариант към `index.html` на `vite dev` и `vite preview`. Посетено на 21 октомври 2026 г.
- [Python, `http.server`](https://docs.python.org/3/library/http.server.html): статичният сървър от командния ред, `--directory`, `--bind`, 404 за файл, който не съществува, и предупреждението да не се използва в продукция. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
||---|---|
| рутер (router) | частта, която чете адреса, решава кои компоненти да изрисува и променя адреса, без да презарежда страницата |
| клиентски маршрут | адрес, който съществува само за рутера, като `/servicios/pagos`; на сървъра няма файл с това име |
| оформление (*layout*) | компонентът на родителски маршрут: изрисува онова, което не се променя между страниците, и оставя `<Outlet />` за страницата |
| индексен маршрут | дъщерният маршрут без `path`, който се изрисува, когато адресът е точно този на родителя |
| динамичен сегмент | частта от маршрута, която започва с `:`, като `:nombre`; онова, което стои на тази позиция, се предава като параметър |
| търсене (*query string*) | онова, което идва след `?` в един адрес, като `fallas=1&q=pag`; чете се с `useSearchParams` |
| процентно кодиране | записване в адрес на специалните символи като `%` и две шестнадесетични цифри за всеки байт, като `á` → `%C3%A1` |
| `replace` | навигиране със замяна на текущия запис в историята, вместо добавяне на нов |
| граница за грешки (*error boundary*) | компонентът, който се изрисува вместо онова, което е под него, когато нещо там хвърли грешка при изрисуването; React Router поставя по една на всеки маршрут, а твоята се декларира с `ErrorBoundary` |
| пренаписване (SPA fallback) | правилото на сървъра, което отговаря с `index.html` на всеки адрес, който не е файл, за да се стартира приложението и рутерът да реши |

---

**Следващ:** [Урок 6 — Споделено състояние: reducer и контекст](06-reducer-contexto.md)
