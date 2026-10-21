# Урок 4 — Състояние на сървъра с TanStack Query

*16:50 ч. е, а в 17:00 екипът по експлоатация приключва смяната с един въпрос: „`pagos` възстанови ли се вече?“. В твоето табло `pagos` все още е в червено. Някой от екипа по инфраструктура се кълне, че го е рестартирал преди пет минути. Отваряш детайлите на `pagos`: пише „En falla“. Затваряш детайлите, отваряш тези на `catálogo`, връщаш се на `pagos`… и таблото отново иска всичко от нулата, със същото си „Cargando…“, сякаш никога не го е виждало. Натискаш „Actualizar“: списъкът става зелен, но детайлите, които бяха отворени, продължават да казват „En falla“. Две части на един и същ екран разказват две различни истории за една и съща услуга, а ти имаш десет минути, за да кажеш коя е истината. Проблемът не е в API. Проблемът е, че всеки компонент си носи данните сам и никой не знае това, което знае другият. Този урок дава на таблото едно-единствено място, където живее това, което е дошло от сървъра.*

(Сцената все още не може да се предизвика с тестовия сървър от Урок 3: там `pagos` никога не се възстановява. Този урок дава на сървъра пътя, който „го проверява отново“, и в 4.6.1 ще видиш цялата сцена, и то решена.)

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 4.4 и 4.5)

**Какво изграждаш:** отчета на `revisor` с кеш, обновяване във фонов режим, четирите състояния на една заявка плюс това на „остарелите данни“, бутон „Volver a revisar“, който иска от сървъра да провери услуга отново и оставя списъка и детайлите актуални, и граница за грешки, която улавя това, което се провали по време на рисуване

**Какво научаваш:** защо ръчното извличане на данни не се мащабира (кеш, каскади, надпревара между заявките); `useQuery`, `queryKey` и `signal`; `status` срещу `fetchStatus`; `staleTime`, повторните опити и `refetchInterval`; `useMutation` и инвалидиране; **четвъртото състояние: празно**; какво не прави Suspense; Error Boundary — единственият клас в курса

**Откъде идваш.** От [Урок 3](03-effects-sincronizar.md). Твоят `revisor` иска отчета със собствен hook, `useReporte`, който прави периодично запитване (polling) на всеки 10 секунди с Effect, `AbortController` и `useEffectEvent`, за да не се рестартира запитването, когато `Panel` му подаде нова функция. Детайлите на услуга ги носи друг hook, `useDetalle`, със собствен Effect, който прекъсва заявката, когато името се смени, а `ContenidoReporte` монтира `<PanelDetalle key={seleccionado}>`, така че смяната на услугата рестартира целия панел. Всичко това работи, и работи по добри причини: Урок 3 възпроизведе надпреварата между отговорите и я поправи. В този урок ще изтриеш двата hook-а. Не защото бяха грешни, а защото решаваха ръчно, един по един, проблем, който има име и инструмент. Работиш върху същия проект, `~/curso-react/revisor/`.

**Какво не прави този урок.** Не добавя екрани, нито адреси: списъкът и детайлите остават в същата страница, а изборът остава състояние на `Panel`; маршрутите идват в [Урок 5](05-rutas-url-como-estado.md). Не използва Suspense за зареждане на данни: обяснява какво би направил и защо това табло няма нужда от него. Не пише автоматични тестове: тестовете на четирите състояния идват в [Урок 8](08-pruebas-de-componentes.md). Не добавя нови услуги: тестовият сървър вече умее да го прави от този урок нататък, но формулярът е от [Урок 7](07-formularios-accesibilidad.md). И не обяснява тестовия сървър, който тук достига окончателната си версия: само казва какви нови пътища има.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` на този урок. Контролната точка беше инсталирана наново с `npm ci` и мина `npm run lint` и `npm run build`, със същото име на файл в `dist/`, което изпълненията на курса получиха и в контейнер с Linux (`index-BzO-N0-M.js`); затова това, което виждаш тук, е това, което ще видиш в своя Linux Mint, с изключение на едно предупреждение от `npm ci` за `fsevents`, което се появява само под macOS и се обяснява там, където излиза. Това, което се вижда „в браузъра“, беше измерено с Chrome без графичен интерфейс (`--headless`), управляван чрез протокола му за отстраняване на грешки: малка програма отваряше страницата, натискаше бутоните така, както би го направил ти, и записваше, с милисекунди от отварянето на страницата, всяка заявка, излязла към `/api/`, и всяка промяна на екрана. Това е същият запис, който виждаш в раздела „Network“ на инструментите за разработчици, разказан писмено. Часовете в лога на тестовия сървър са по UTC; часът, който показва таблото („Actualizado a las 2:11:47 a.m.“), е местното време на машината, която беше в часовата зона на централно Мексико. Дългите пътища се показват спрямо `~/curso-react`. За да се сравнят размерите, беше изградена и контролната точка на Урок 3, със същия резултат, който изпълненията на курса записват за нея (`index-CTkBRgQQ.js`). Програмите са в [`programas/04-estado-del-servidor/`](../programas/04-estado-del-servidor): `revisor/` е контролната точка, а трите фигури са до нея, със собствен `package.json`, който е този на фигурите от Урок 0 плюс `@tanstack/react-query`. Трите бяха изпълнени отново от нулата в нова папка, като се тръгна от `package.json` на Урок 0 и се добави само Query, както е посочено в 4.1, и дадоха изходи, идентични с показаните. Всеки урок от курса беше написан със собствени портове, за да не се сблъсква с други изпълнения на същата машина; ти използвай обичайните: 3100 за тестовия сървър, 5173 за `npm run dev` и 4173 за `npm run preview`.

## След урока ще можеш да

- Да покажеш с фигура, която брои извикванията, колко заявки прави една стойност, поискана ръчно от два компонента, и колко прави с TanStack Query, и да обясниш откъде идва разликата.
- Да конфигурираш `QueryClient` със `staleTime` и `retry`, да го монтираш с `QueryClientProvider` и да напишеш заявка с `queryOptions`, ключ и функция, която получава `signal`.
- Да различаваш `status` от `fetchStatus`, да назовеш петте комбинации, които предизвиква фигура 2, и да посочиш коя показва „· actualizando…“ в долната част на панела.
- Да нарисуваш четирите състояния на една заявка (зареждане, грешка, празно и с данни) плюс това на „остарелите данни“ и да предизвикаш всяко от тях с тестовия сървър.
- Да напишеш мутация с `useMutation`, която при успешно завършване инвалидира засегнатите заявки, и да разчетеш в лога заявката `POST`, последвана от двете, които предизвиква инвалидирането.
- Да обясниш какви грешки улавя един Error Boundary и какви не, и защо той е единственият клас в курса.

## Защо, преди как

Погледни какво прави `revisor` днес, в края на Урок 3, с очите на човека, който работи с таблото.

**Едни и същи данни се искат два пъти.** `Panel` има нужда от отчета за списъка; заглавието на раздела, `(2) Revisor`, има нужда от същия отчет, за да преброи повредите. Днес това работи, защото двете живеят в един и същ компонент и споделят резултата на един-единствен `useReporte`. Но щом заглавната лента от [Урок 5](05-rutas-url-como-estado.md) поиска да покаже „2 servicios con falla“ от друга част на дървото, ще имаш две възможности: да вдигнеш състоянието до общ предшественик и да го спуснеш през props, или да извикаш `useReporte` два пъти и да направиш две заявки за едни и същи данни. Нито едната не се мащабира.

**Излизането и връщането струва колкото влизането.** Когато избереш `pagos`, `useDetalle` иска детайлите; когато избереш `catálogo` и се върнеш на `pagos`, ги иска отново от нулата, със своето „Cargando detalle…“ от 1.5 секунди, макар да си ги видял преди пет. Hook-ът няма памет: състоянието му живее в компонента, а компонентът се демонтира. Документацията на React го казва с тези думи: извличането на данни директно в Effect обикновено означава, че не ги зареждаш предварително и не ги кешираш, така че ако компонентът се демонтира и се монтира отново, трябва да ги поиска пак ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)).

**Това, което промениш на едно място, не стига до другото.** Ако утре детайлите имат бутон, който иска от сървъра да провери `pagos` отново, отговорът ще стигне до детайлите… а списъкът ще продължи да показва `pagos` в червено до следващото запитване, десет секунди по-късно. За да уведомиш списъка, ще трябва да подадеш на `PanelDetalle` функция `recargarLista` от `Panel`, и още една за всеки екран, който зависи от тази услуга.

**И всеки hook пише отново едно и също.** `useReporte` и `useDetalle` имат, всеки от тях, свой `AbortController`, свой `try`/`catch`, свое `if (control.signal.aborted) return`, свое обединение `cargando`/`listo`/`error`. Това е кодът, който Урок 3 те научи да пишеш правилно, и точно затова си струва да забележиш колко тежи: същата страница на React го описва като „неергономичен“, с доста повтарящ се код, за да не се допуснат грешки като надпреварата между отговорите.

Тази страница не спира до оплакването: препоръчва, ако не използваш framework, „да използваш или да изградиш кеш от страната на клиента“, и назовава три решения с отворен код; първото е **TanStack Query**. И добавя нещо, което си струва да се прочете бавно: ако изградиш свой, ще използваш Effects отдолу, но ще трябва да добавиш логиката, за да не се повтарят заявки, да се пазят отговори и да се избягват каскади. Това прави библиотеката. Отдолу все още има `fetch` със `signal`; това, което се променя, е **кой притежава данните**. Досега собственик на отчета беше компонентът, който го искаше. От този урок нататък собственик е кеш, който живее извън компонентите, а компонентите само се **абонират** за това, от което имат нужда.

Тази промяна има име, което дава заглавието на урока: **състояние на сървъра**. Състоянието, с което Урок 2 те научи да работиш — полето „Solo fallas“, избраната услуга, черновата на бележка, — е твое: ражда се в екрана, само екранът го променя и винаги е актуално. Отчетът е нещо друго. Той е **копие** на нещо, което живее на друг компютър, което други хора могат да променят, без да те предупредят, което се бави да пристигне, което може да се провали при искането и което започва да остарява в мига, в който пристигне. Да се третира с `useState` означава да се третира снимка като прозорец.

Урокът има девет части: измереният проблем (4.1); инсталацията и клиентът (4.2); ключове, функции на заявките и периодично запитване (4.3); `status` срещу `fetchStatus` (4.4); четирите състояния плюс едно (4.5); мутации и инвалидиране (4.6); какво не прави Suspense (4.7); границата за грешки (4.8); и пълното преминаване (4.9). Накрая ще изградиш това и ще знаеш защо JavaScript-ът е нараснал с около 36 килобайта:

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
dist/assets/index-BzO-N0-M.js   262.38 kB │ gzip: 81.53 kB

✓ built in 263ms
```

## Понятията

### 4.1 Проблемът, измерен: два компонента, едни данни

Преди да инсталираш каквото и да е, измери проблема. Първата фигура монтира два пъти един и същ компонент — представи си заглавната лента и обобщението, които имат нужда от един и същ отчет, — брои колко пъти се извиква симулирано „API“, което отговаря за 50 ms, след това ги демонтира (човекът излиза от екрана) и ги монтира отново (връща се). Прави го два пъти: с по един Effect на компонент, както в Урок 3, и с TanStack Query.

Фигурите от този урок импортират TanStack Query, така че и папката ти с фигури има нужда от него. В `~/curso-react/figuras/`, която създаде в Урок 0, го добави с точната му версия:

```bash
npm install --save-dev --save-exact @tanstack/react-query@5.104.5
```

Или копирай `package.json` и `package-lock.json` от `programas/04-estado-del-servidor/` и изпълни `npm ci`. Двата начина бяха изпробвани от празна папка и трите фигури дадоха точно изходите, които виждаш тук. Ако пропуснеш тази стъпка, първото `npx tsc` ще се оплаче, че не намира модула `@tanstack/react-query`.

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

Прочети двете половини ред по ред.

**Ръчно два компонента означават две извиквания.** Всеки `ConteoAMano` има собствен Effect, собствено състояние и собствен `AbortController`. Няма начин единият да знае, че другият вече иска същото: Effects са частни за всеки компонент. При връщането и двата започват отново от `cargando` и правят още две извиквания, защото състоянието им се е загубило при демонтирането.

**С Query два компонента означават едно извикване.** Двата `ConteoConQuery` искат ключа `["reporte"]`. Първия път, когато някой го поиска, Query стартира функцията; когато вторият го поиска, докато първата още е в ход, Query не стартира друга: **абонира** го за същата. Това се нарича *дедупликация* на заявките. А при връщането екранът показва „4 servicios“ **веднага**, без да минава през `cargando`, и не прави нито едно извикване. Данните не живееха в компонентите: живееха в кеша на `QueryClient`, който си остана там, докато екранът беше празен.

Защо нито едно извикване при връщането? Заради реда `staleTime: 5_000`. Той казва на Query, че в продължение на пет секунди след пристигането си тези данни се считат за **свежи** и не си струва да се искат отново. Когато този срок изтече, данните стават **остарели** (*stale*), и следващия път, когато някой компонент се абонира, Query ще покаже това, което има, и паралелно ще ги поиска отново. В упражнение 2 махаш този ред и го проверяваш.

Планът на този курс обобщава с три думи защо ръчното извличане на данни не се мащабира: **кеш**, **каскади** и **надпревара**. Фигурата току-що измери първата. Страницата на React, цитирана в „Защо“, изброява четири проблема: че Effects не се изпълняват на сървъра, каскадите, че нищо не се зарежда предварително и нищо не се кешира, и че е неергономично, с грешки като надпреварата между отговорите. Първият не се отнася за това табло, което не се рисува на сървър; другите три са тези от плана. Втората дума са **каскадите** (*network waterfalls*), вторият проблем от този списък: родителят иска своите данни, рисува се и едва тогава децата му започват да искат своите; при бавна мрежа всяко ниво добавя своето чакане ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Фигурата не го измерва и `revisor` още не страда от него, защото детайлите му се искат само когато някой избере услуга. Това, което Query носи срещу каскадите, е, че една заявка може да се поиска **извън компонент** — например когато маршрутизаторът знае към кой екран отиваш, преди да го нарисува, — и точно от това би се възползвал Урок 5, ако имаше нужда. Тук е достатъчно да знаеш, че проблемът съществува и че има изход. Третата дума, **надпреварата** между заявките, я видя отблизо в Урок 3; как Query я избягва се обяснява в 4.3.2, когато се появи `signal`.

### 4.2 Инсталацията и клиентът

TanStack Query е библиотека от един-единствен пакет за React. Инсталира се в `dependencies`, защото пътува до браузъра, с точната си версия:

```bash
npm install --save-exact @tanstack/react-query@5.104.5
```

Тази версия беше публикувана на 19 октомври 2026 г. и е най-новата, която `npm view @tanstack/react-query version` върна в деня на изпълнението. Ако инсталираш под macOS, `npm ci` или `npm install` завършват с предупреждение, подобно на това:

```text
npm warn install-scripts 1 package has install scripts not yet covered by allowScripts:
npm warn install-scripts   fsevents@2.3.3 (install: (install scripts present))
```

Не го предизвиква Query. `fsevents` е незадължителна зависимост, само за macOS, която инструментите за разработка използват, за да разберат бързо кой файл се е променил; в npm 11 инсталационните скриптове на зависимостите остават блокирани, докато никой не ги одобри, и npm завършва инсталацията, като съобщава кои е пропуснал ([npm, „npm install-scripts“](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts)). С `fsevents` не е нужно да се одобрява нищо: пакетът вече носи компилиран своя файл `fsevents.node` (можеш да го видиш в `node_modules/fsevents/`), инсталацията завършва успешно и Vite работи по същия начин. Когато някой пакет наистина има нужда от своя скрипт, той се преглежда с `npm install-scripts ls` и се одобрява с `npm install-scripts approve <paquete>`; одобряването е решение за сигурност, защото този скрипт се изпълнява с твоите права. Под Linux не се появява, защото този пакет декларира в своя `package.json`, че е само за `darwin` (macOS), и npm дори не го инсталира.

`package.json` става такъв; единственият нов ред, освен номера на версията, е този на Query:

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

Библиотеката има две части, които се инсталират веднъж. Първата е **`QueryClient`**: обектът, който пази кеша и правилата. Контролната точка го създава с функция, в собствен файл, така че тестовете от Урок 8 да могат да създават нов за всеки тест:

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

Тези две опции променят две стойности по подразбиране, които документацията на Query изброява в страницата си за „важните стойности по подразбиране“ ([TanStack Query, „Important Defaults“](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)):

- **`staleTime`** по подразбиране е `0`: данните се считат за остарели в момента, в който пристигнат. С `0` при всеки нов компонент, който се абонира, всеки път, когато прозорецът получи отново фокуса, и всеки път, когато мрежата се върне, Query иска данните отново. За табло, което така или иначе се обновява на всеки десет секунди, пет секунди свежест спестяват заявки, които не носят нищо: ако току-що си получил отчета, отварянето на детайлите или връщането в раздела не изисква нов. Това е принцип на този курс, а не правило: правилното число зависи от това колко бързо се променят данните ти и колко ти струва да ги покажеш малко остарели.
- **`retry`** по подразбиране е `3`: заявка, която се провали, се опитва отново три пъти, безшумно, с изчакване, което се удвоява между опитите. Курсът го намалява на `2`, за да може, когато API е недостъпно, предупреждението да се появи след около четири секунди, а не след осем. В раздел 4.5 ще го видиш в лога, опит по опит.

Има още две стойности, които си струва да познаваш, макар контролната точка да не ги пипа. **`gcTime`** (от *garbage collection*) е колко време оцеляват в кеша данни, които никой компонент не използва: пет минути. Затова във фигура 1 данните си бяха там при връщането. А **`refetchOnWindowFocus`** е включено: когато човекът се върне в раздела на таблото, остарелите заявки се искат отново. Това кара табло, стояло половин час зад друг прозорец, да се актуализира в момента, в който го погледнеш. Казва го същата страница: остарелите заявки се искат отново във фонов режим, когато се монтира нова инстанция, когато прозорецът получи отново фокуса или когато мрежата се свърже отново.

Втората част е **`QueryClientProvider`**, който прави клиента достъпен за цялото дърво. `main.tsx` го създава **само веднъж, извън всеки компонент**, и обвива таблото:

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

Това, че `crearClienteConsultas()` се извиква на ниво модул, а не вътре в компонент, не е въпрос на стил. Ако го създадеш вътре в компонент, всяко рисуване на този компонент ще създава нов, празен кеш и ще загубиш всичко, което фигура 1 току-що показа. В `main.tsx` се изпълнява веднъж, когато браузърът зареди модула. (`LimiteDeError`, който обвива всичко, се обяснява в 4.8.)

И ето размера, който се появи в края на „Защо“. За сравнение беше изградена и контролната точка на Урок 3: нейният JavaScript беше 225.86 kB (70.67 kB компресиран) и идваше от 33 модула; този на урока е 262.38 kB (81.53 kB компресиран) и идва от 83. Между единия и другия урок собственият код на `revisor` почти не расте — дори се изтриват два hook-а, — така че тези 36 kB и 50 модула в повече са в по-голямата си част библиотеката. Струва си да се запиташ дали си заслужава. За табло, което иска само едно нещо веднъж, вероятно не; за такова, което има кеш, периодично запитване, повторни опити, дедупликация, инвалидиране и остарели данни по време на обновяване, тежи това, което си спестяваш да пишеш и поддържаш сам.

### 4.3 Ключове, функции на заявките и периодично запитване

Една заявка има две задължителни части: **ключ**, който я идентифицира, и **функция**, която носи данните. Всичко останало са опции.

#### 4.3.1 Ключът: името на данните в кеша

Ключът е масив. Документацията поставя три правила: трябва да е масив на най-горното ниво, трябва да може да се преобразува в JSON и трябва да е уникален за тези данни; и добавя четвърто, което предотвратява най-много грешки: **ако функцията зависи от променлива, тази променлива влиза в ключа** ([TanStack Query, „Query Keys“](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)). Детайлите на `pagos` и тези на `catálogo` са различни данни, така че ключовете им трябва да са различни: `["servicio", "pagos"]` и `["servicio", "catálogo"]`.

Контролната точка събира всички ключове в един файл, за да не напише никой `["reportes"]` на едно място и `["reporte"]` на друго:

```ts
// revisor/src/consultas/claves.ts
export const claves = {
  reporte: ["reporte"] as const,
  servicio: (nombre: string) => ["servicio", nombre] as const,
};
```

`as const` кара TypeScript да запомни точната форма на масива (`readonly ["reporte"]`, а не `string[]`), а `servicio` е функция, защото ключът ѝ зависи от името. Този начин на записване има предимство, което се появява в 4.6: ключовете се сравняват **по префикс**. Инвалидирането на `["servicio"]` би обхванало всички детайли; инвалидирането на `["servicio", "pagos"]` — само детайлите на една услуга.

Обърни внимание какво заменя това правило. В Урок 3 `useDetalle` имаше `[nombre]` в списъка си със зависимости, а `exhaustive-deps` следеше да не го забравиш. Ключът на Query играе същата роля: когато `nombre` се промени, ключът се променя и Query иска новите данни. Разликата е, че линтерът на React не проверява ключовете на Query. Ако забравиш да сложиш името в ключа, никой не те предупреждава; упражнение 4 ти показва какво виждаш на екрана, когато това се случи.

#### 4.3.2 Функцията: същата мрежова граница, със `signal`, който подава Query

Функцията на заявката за отчета е `cargarReporte`, мрежовата граница от Урок 0, с една-единствена промяна: губи типа `Cargar`, който съществуваше, за да се подава функцията като prop на `Panel`, и вече не се използва.

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

Тя продължава да получава `AbortSignal`, и това е важно. Query дава на всяка функция на заявка собствен `AbortSignal` и го прекъсва, когато заявката престане да е нужна преди да е завършила: защото ключът се е сменил или защото не е останал нито един абониран компонент ([TanStack Query, „Query Cancellation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Вече не пишеш `new AbortController()`, нито `control.abort()`: Query ги пише вместо теб, а ти само трябва да подадеш `signal` на `fetch`. Документацията добавя един детайл: ако функцията ти **използва** `signal`, Query отменя promise-а и връща заявката в предишното ѝ състояние; ако не го използва, отговорът се записва в кеша, макар никой вече да не го чака.

В раздел 4.9 ще видиш тази отмяна в лога, със същата двойка `cancelada por el cliente` + `200`, която `StrictMode` предизвикваше в Урок 0. Това не е случайно: `StrictMode` демонтира и монтира отново таблото, заявката остава за миг без нито един абониран, Query прекъсва `signal` и иска отново при повторното монтиране. Почистването все още съществува; само смени собственика си.

И това затваря надпреварата от Урок 3, от две страни. Това, което видя в Урок 3, е, че закъснелият отговор на `pagos` стигаше до екрана само когато липсваха и двете защити едновременно: `abort` в почистването и `key`, който демонтира панела. Query носи своя версия на всяка от тях. Първата е `signal`: ако избереш `pagos` и веднага след това `catálogo`, заявката за `pagos` остава без абонати и Query прекъсва нейната мрежова заявка. Втората е ключът: дори заявката да не беше прекъсната, отговорът ѝ би се записал в записа `["servicio", "pagos"]` на кеша, а не в този на `catálogo`. Всеки ключ е отделно чекмедже и закъснелият отговор няма как да попадне в грешното чекмедже. Компонентът на `catálogo` чете само чекмеджето на `catálogo`.

#### 4.3.3 `queryOptions`: заявката на едно място

С ключа и функцията се сглобява заявката. Контролната точка не я пише вътре в компонента, а във файл на функционалността, с `queryOptions`:

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

`queryOptions` не прави нищо по време на изпълнение: връща същия обект, който му подадеш. Това, което добавя, е тип. Събира ключ, функция и опции в обект, който може да се споделя между няколко места — компонент, тест, предварително зареждане, — а TypeScript извежда от функцията типа на данните, `ReportePublico`, за всички тях ([TanStack Query, „Query Options“](https://tanstack.com/query/latest/docs/framework/react/guides/query-options)). Ако утре Урок 8 поиска да попита кеша какво има под `["reporte"]`, използва същия обект и получава правилния тип, без да повтаря нищо.

Новата опция е **`refetchInterval: cadaMs`**: докато има абониран компонент, Query иска данните отново с тази честота, в милисекунди ([TanStack Query, „useQuery“](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)). Това е периодичното запитване на всеки десет секунди от Урок 0, същото `VITE_CADA_MS`, без `setInterval` и `clearInterval`. И носи правило, което ръчното запитване нямаше: когато придружаващата я опция `refetchIntervalInBackground` е `false`, което е стойността ѝ по подразбиране, запитването спира, докато разделът е във фонов режим. Табло, забравено в някой раздел, вече не пита API на всеки десет секунди през цялата нощ.

Заявката за детайлите има същата форма, с името в ключа и във функцията:

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

Нейният `cargarDetalle` не се променя спрямо Урок 3. С това `useReporte.ts` и `useDetalle.ts` изчезват от проекта, а заедно с `useReporte` си отива и `useEffectEvent`, който Урок 3 му сложи, за да не се рестартира запитването. Това не беше лоша употреба: беше правилният начин да се реши този проблем с ръчно написан Effect. Просто вече няма ръчно написан Effect.

А `useTituloDocumento`, другият Effect от Урок 3? Той остава. Синхронизира `document.title` с това, което React знае, а точно за това съществува Effect. Не всеки Effect си отива: отива си този, който носеше данни.

### 4.4 `status` срещу `fetchStatus`

`useQuery` връща обект с много полета. Двете, които най-много си струва да се разберат, са `status` и `fetchStatus`, защото отговарят на **два различни въпроса**, а документацията го обобщава в едно практическо правило: `status` те информира за **данните** — имам ли, или нямам? — а `fetchStatus` те информира за **функцията** — изпълнява ли се, или не? ([TanStack Query, „Queries“](https://tanstack.com/query/latest/docs/framework/react/guides/queries)).

| Поле | Стойност | Какво означава |
|---|---|---|
| `status` | `pending` | все още няма данни |
| | `error` | последният опит се е провалил |
| | `success` | има данни |
| `fetchStatus` | `fetching` | функцията се изпълнява |
| | `paused` | искаше да се изпълни, но няма мрежа |
| | `idle` | не прави нищо |

Защо две полета, а не едно? Защото с кеш и обновяване във фонов режим **всички комбинации са възможни**, а една-единствена променлива не може да ги опише. Втората фигура ги предизвиква една по една: монтира компонент без мрежа, връща мрежата, след това кара API да се провали и иска отново. Компонентът записва ред всеки път, когато някое от двете полета се промени.

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

Пет реда, пет ситуации, които таблото трябва да умее да нарисува:

1. **`pending` + `paused`.** Няма данни и дори не се иска нищо: Query е видял, че няма мрежа (`onlineManager.setOnline(false)` го симулира), и е изчакал. Ако екранът ти гледа само „зарежда ли се?“, тук би казал „не“, а ако гледа само „имам ли данни?“, също би казал „не“. И двете са верни.
2. **`pending` + `fetching`.** Първото зареждане: няма данни и се искат. Това е „Cargando…“.
3. **`success` + `idle`.** Има данни и не се иска нищо. Екранът в покой.
4. **`success` + `fetching`.** Има данни **и** се искат отново. Това е случаят, който обединение `cargando`/`listo`/`error` като това от Урок 0 не можеше да изрази: там обновяването означаваше връщане към `cargando` и изтриване на списъка. Тук списъкът остава и най-много се съобщава, че се обновява.
5. **`error` + `idle` с „4 servicios“.** Последният опит се е провалил, **но предишните данни са още там**. Query не ги изтрива. `status` казва `error`, а `data` продължава да съдържа предишния отчет.

Петият ред е този, който изненадва най-много, и този, който е най-важен за табло за мониторинг: когато API се провали за момент, най-лошото, което можеш да направиш, е да оставиш човека без нищо за гледане. Query ти дава двете неща едновременно — грешката и последните добри данни, — а екранът ти решава как да ги покаже.

Освен двете полета `useQuery` предлага булеви съкращения: `isPending` е `status === "pending"`, `isError` е `status === "error"`, `isSuccess` е `status === "success"`, а `isFetching` е `fetchStatus === "fetching"`. Документацията на `useQuery` го казва точно за `isFetching`: то е `true` винаги когато функцията се изпълнява, **включително** при първоначалното зареждане. Контролната точка използва съкращенията, защото освен това помагат на TypeScript: след `if (consulta.isPending) return …` TypeScript знае, че `consulta.data` вече не може да бъде `undefined`. В „Грешката, която ще видиш“ махаш този `if` и TypeScript ти го напомня.

Ето как изглежда `Panel`, който вече получава само `cadaMs`:

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

Три неща се промениха спрямо Урок 3:

- **Заявката заменя hook-а.** `useQuery(consultaReporte(cadaMs))` връща целия обект, а `Panel` го подава както си е на `ContenidoReporte`. Вече няма prop `cargar`: компонентът не получава функцията, която носи данните, защото функцията живее в заявката.
- **„Actualizado a las“ идва от `dataUpdatedAt`.** В Урок 3 това беше собствено състояние, `actualizadoEn`, което се записваше в `alRecibir`, обвит в `useEffectEvent`. Сега Query вече пази момента, в който са пристигнали последните добри данни, като брой милисекунди ([TanStack Query, „useQuery“](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)), и стойността е `0`, докато не е пристигнало нищо. Това е състояние, което престана да се пази, защото вече можеше да се прочете: правилото от Урок 2 „не пази това, което можеш да изчислиш“, приложено към кеша.
- **Бутонът „Actualizar“ извиква `refetch`** и е деактивиран, докато `isFetching` е `true`. А долната част добавя „· actualizando…“ точно в четвъртия случай от фигурата: има данни и се искат. Това е разликата между `status` и `fetchStatus`, нарисувана в един ред.

### 4.5 Четирите състояния, плюс едно

Данните, които идват от сървър, имат най-малко **четири състояния**, които екранът трябва да нарисува: зареждане, грешка, празно и с данни. Първите три са тези, които се забравят. Грешката — защото на машината на програмиста API винаги отговаря. А **празното** — защото на машината на програмиста винаги има тестови данни: празният списък се рисува като списък без редове, който на екрана не се различава от счупен екран. Затова планът на курса го нарича „четвъртото състояние“ и го отбелязва с удебелен шрифт.

Петото, което съществува само благодарение на кеша, е **с данни и с грешка**: последното обновяване се е провалило, но има предишен отчет, който да се покаже. Това е ред 5 от фигура 2. `ContenidoReporte` рисува и петте, в този ред:

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

Прочети реда на `if`-овете, защото всеки от тях изключва един случай и оставя на следващия по-малко възможности:

1. **`isPending`** → „Cargando…“, вътре в `role="status"`, което екранният четец обявява, без да прекъсва. Ако все още няма данни, няма какво друго да се рисува.
2. **`isError` без данни** → предупреждението и бутон „Reintentar“, който извиква `refetch`. Това е истинската грешка: заявката се е провалила и няма какво да се покаже на нейно място. `role="alert"` кара екранния четец да го обяви веднага.
3. **Празен списък** → „No hay servicios configurados todavía.“ Обърни внимание, че това не е нито грешка, нито зареждане: това е валиден отговор, `{"estados":[]}`, който означава нещо различно. Текстът казва на човека какво се случва, вместо да го остави да гадае дали екранът се е счупил.
4. **С данни** → обобщението, списъкът и детайлите, както в Урок 3.
5. **С данни и с грешка** → същото като в 4, с предупреждение отгоре: „Mostrando el último reporte que llegó“. Класът `viejo` го оцветява с кехлибарена рамка, за да се различава от списъка, без да го скрива.

След втория `if` TypeScript знае, че `consulta.data` съществува: ако `isPending` беше вярно, вече щеше да се е излязло, а също и ако имаше грешка без данни. Затова `const { estados } = consulta.data;` се компилира без `?.` и без `!`. Редът на `if`-овете не е само въпрос на четимост: той позволява на компилатора да върви редом с теб.

Файлът със стилове добавя едно правило, което споделя с границата за грешки от 4.8:

```css
.viejo,
.limite-de-error {
  border-left: 0.5rem solid #bf8700;
  padding-left: 0.75rem;
}
```

Сега ги предизвикай с тестовия сървър, който от този урок нататък приема променлива `ESCENARIO`: `normal` (обичайното), `vacio` (стартира без услуги) или `caido` (`GET /api/estados` винаги отговаря с `503`). С `ESCENARIO=vacio npm run servidor` и `npm run dev` ето какво остави на екрана Chrome без графичен интерфейс (видимият текст на контейнера):

```text
Revisor
Estado de los servicios
 Solo fallas

No hay servicios configurados todavía.

Actualizado a las 2:11:47 a.m.

Actualizar
```

А това е логът на сървъра: двойката на `StrictMode` и един добър, празен отговор.

```text
08:11:44.790 servidor de práctica en http://127.0.0.1:3100 (escenario: vacio)
08:11:47.090 GET /api/estados cancelada por el cliente
08:11:47.395 GET /api/estados 200
```

Обърни внимание, че се появява „Actualizado a las…“: за Query празният списък е успех, и той наистина е такъв. С `ESCENARIO=caido` обаче екранът остана така:

```text
Revisor
Estado de los servicios
 Solo fallas

No se pudo cargar el reporte: la API respondió 503

Reintentar
Actualizar
```

Интересната част е в лога и в мрежовия запис, който браузърът е отбелязал, с милисекунди от отварянето на страницата:

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

Три `503` след отменената заявка: първоначалният опит и **двата повторни опита** от `retry: 2`. Виж паузите между един отговор и следващата заявка: около 1,000 ms и след това около 2,000 ms. Това е изчакването по подразбиране на Query, което започва от една секунда и се удвоява при всеки опит, без да надхвърля 30 секунди ([TanStack Query, „Query Retries“](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries)). Междувременно екранът остана на „Cargando…“: повторните опити са безшумни, а предупреждението се появява едва когато се изчерпат. С `retry: 3` по подразбиране човекът би чакал около осем секунди, за да разбере, че API е недостъпно; с `2` — около четири. (Един детайл при разчитането: в записа на браузъра между първата заявка и нейния `503` има само 33 ms, докато сървърът се бави 300. Не е, че сървърът е отговорил по-рано; логът на сървъра показва 300-те ms. Причината е, че докато страницата се отваряше, браузърът е предал наведнъж първите известия на програмата, която ги записваше, и програмата им е сложила часа, в който ги е получила. От втората заявка нататък известията пристигат едно по едно и 300-те ms се появяват отново: от 1373 до 1685 и от 3682 до 3986.)

И едно наблюдение, което не е в нито един ред: „Actualizado a las…“ не се появява, защото `dataUpdatedAt` остава `0`. Никога не са пристигнали добри данни. Ако сървърът беше станал недостъпен **след** успешно зареждане, щеше да видиш петото състояние — списъка с кехлибареното предупреждение отгоре.

### 4.6 Мутации и инвалидиране

Дотук всичко е четене. Но детайлите на услуга вече имат бутон, който **променя** нещо на сървъра: „Volver a revisar“ иска от тестовия сървър да провери услугата отново. Сървърът има нов път за това, `POST /api/servicios/:nombre/reintento`, който винаги намира услугата възстановена: отговаря с `200` и `{"nombre":"pagos","tipo":"disponible","codigoHttp":200,"duracionMs":95}` и, което е важното, **променя това, което пази**, така че следващото `GET /api/estados` вече носи `pagos` в зелено. (Отговаря и с `404`, ако услугата не съществува, а от този урок има и пътя `POST /api/servicios` за добавяне на услуги; него го използва Урок 7.)

Операция, която променя данни на сървъра, се нарича **мутация**, и в Query има собствен hook, `useMutation`. Мрежовата граница е като другите две: иска, проверява кода, валидира формата.

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

За да валидира отговора, използва `esEstadoPublico` — type guard, който съществува от Урок 0 и който досега `contrato.ts` не експортираше, защото го използваше само `esReportePublico`. Единствената промяна в `contrato.ts` е тази дума, `export`, плюс интерфейса `NuevoServicio`, от който сървърът има нужда за добавянето:

```ts
// revisor/src/compartido/contrato.ts (fragmento)
export function esEstadoPublico(valor: unknown): valor is EstadoPublico {
```

Hook-ът е кратък и всеки ред има причина:

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

- **`useMutation` не се изпълнява сам.** За разлика от `useQuery`, който иска данни веднага щом се монтира, мутацията чака някой да извика `mutate()`. Четенето може да се повтори без последствия; записът — не, и затова той се случва само когато човекът го поиска.
- **`useQueryClient()`** връща същия клиент, който `main.tsx` сложи в доставчика. Това е начинът да се говори с кеша от компонент.
- **`onSuccess` инвалидира два ключа.** `invalidateQueries` прави две неща: маркира като остарели заявките, чийто ключ съвпада, и ако някоя от тях се рисува в този момент, я иска отново във фонов режим ([TanStack Query, „Query Invalidation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)). Двата ключа са `["reporte"]`, защото списъкът се е променил, и `["servicio", nombre]`, защото детайлите също.
- **`onSuccess` връща promise** (той е `async` и чака `Promise.all`). Това променя кога завършва мутацията. Ръководството за инвалидиране от мутации го казва с един ред: връщането на promise в `onSuccess` гарантира, че данните ще се обновят, преди мутацията да завърши напълно, а `isPending` остава `true`, докато този promise не се изпълни ([TanStack Query, „Invalidations from Mutations“](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)). Без `await` бутонът отново би казвал „Volver a revisar“, докато екранът все още показва старото.

Това е, което `revisor` не можеше да направи в Урок 3, без да подава функции от един компонент на друг: `PanelDetalle` не знае, че съществува списък, нито къде е, нито кой го рисува. Знае само, че след промяна на услуга данните `["reporte"]` вече не са надеждни. Кешът се грижи да уведоми всеки, който ги използва.

`PanelDetalle` използва двете части — заявката и мутацията:

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
      {consulta.isError && (
        <p role="alert">No se pudo cargar el detalle: {consulta.error.message}</p>
      )}
      {consulta.isSuccess && (
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

Бутонът се деактивира и сменя текста си на „Revisando…“, докато `reintento.isPending` е вярно, за да не изпрати никой същия `POST` пет пъти от нетърпение. Ако мутацията се провали, `reintento.isError` показва предупреждението под бутона. И забележи, че заявката за детайлите продължава да използва `isPending` и `isSuccess`, а не `isFetching`: докато детайлите се искат отново след инвалидирането, човекът продължава да вижда предишните данни, а не „Cargando detalle…“, което да ги изтрие.

#### 4.6.1 Какво се случва при натискане на „Volver a revisar“, измерено

Това е частта от урока, която най-много си струва да се види с очите, а не да се приеме на доверие. Със сървъра в нормален сценарий и `npm run dev` програмата, която управлява Chrome, избра `pagos`, изчака детайлите му и натисна „Volver a revisar“. Записа всяка заявка към `/api/` и, всеки път, когато нещо се промени, четири неща от екрана: реда на `pagos` в списъка, състоянието в детайлите, бутона и долната част. Часът в долната част беше заменен с `HH:MM:SS`, за да се чете по-лесно. Ето пълния запис:

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

И логът на сървъра от същото изпълнение:

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

Прочети записа от кликването върху „Volver a revisar“ (3111 ms):

- **`POST` излиза само веднъж**, а бутонът се сменя на „Revisando… [deshabilitado]“ две милисекунди по-късно. Това е „мутацията в раздела Network“: един `POST`, без двойка от `StrictMode`, защото не го задейства Effect, а кликване.
- **Когато пристигне неговият `200` (3418 ms), в същата милисекунда излизат два `GET`**: `/api/estados` и `/api/servicios/pagos`. Това са двете инвалидирания от `onSuccess`. Никой не ги е написал като заявки; написани са като „тези данни вече не са надеждни“, а Query ги е превърнал в заявки, защото и двете стойности бяха на екрана.
- **Докато пристигат, екранът не се изпразва.** На 3428 ms списъкът все още казва `falla (HTTP 503)`, детайлите все още казват `En falla`, а долната част добавя „· actualizando…“. Това е четвъртият ред от фигура 2, `success` + `fetching`, в истинското табло.
- **Списъкът се актуализира пръв (3741 ms)**, защото `GET /api/estados` отнема 300 ms. В продължение на 1.2 секунди списъкът казва `disponible`, а детайлите все още казват `En falla`: детайлите на `pagos` нарочно отнемат 1.5 s, още от Урок 3. Това са две различни стойности в кеша, всяка със собствено пътуване. Сцената, с която започна урокът — две части на екрана, които разказват различни истории, — тук трае една секунда и се решава сама, вместо да трае, докато някой натисне „Actualizar“.
- **Бутонът се връща към „Volver a revisar“ едва на 4965 ms**, когато са пристигнали и детайлите. Това е `await Promise.all` в `onSuccess`: мутацията не се счита за приключена, докато двете заявки не бъдат поискани отново. Бутонът казва истината за това кога екранът е актуален.

В горната част на записа има още два детайла. При избора на `pagos` се появява двойката `cancelada` + `200` на детайлите: `StrictMode` монтира, демонтира и отново монтира `PanelDetalle`, а тъй като `cargarDetalle` използва `signal`, Query отменя първата заявка. А детайлите пристигнаха за 1.5 s, точно както в Урок 3, защото се искаха за първи път. Ако ги затвориш и ги отвориш отново преди да са минали пет секунди, вече няма заявка: те са в кеша и са свежи.

### 4.7 Какво не прави Suspense

Ако потърсиш как да покажеш „Cargando…“ в React, рано или късно ще попаднеш на `<Suspense fallback={…}>`. Изкушението е да мислиш, че обвиването на таблото в `Suspense` кара `fallback` да се появи, докато се иска отчетът. Не е така, и си струва да знаеш защо, преди това да ти струва един следобед.

`Suspense` показва своя `fallback`, докато нещо **вътре в него** не е готово за рисуване. Документацията на React изброява какво се брои за „не е готово“: кодът на компонент, зареден с `lazy`, promise, прочетен с `use` (например данни, които идват от Server Components или от framework, подготвен за Suspense), файл със стилове с `precedence` и още някои случаи на рисуване на сървъра и на преходите. И добавя предупреждение, което е важното тук: **Suspense не открива данните, които се искат вътре в Effect или в обработчик на събития** ([React, „Suspense“](https://react.dev/reference/react/Suspense)). `useQuery` иска данните си извън рисуването и съобщава чрез своя обект с резултата, така че `Suspense` около това табло никога не би показал своя `fallback`: таблото би се нарисувало веднага с `isPending` равно на `true`.

Query наистина има начин да работи със Suspense: отделен hook, `useSuspenseQuery`, който **спира** рисуването, докато няма данни. С него `data` винаги е дефинирано, защото зареждането и грешката **без данни** ги поемат `Suspense` и границата за грешки, които го обграждат ([TanStack Query, „Suspense“](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)). Същото ръководство уточнява, че не всяка грешка стига до границата: тя се хвърля само когато няма други данни за показване. Ако обновяване се провали, докато в кеша има отчет, `useSuspenseQuery` продължава да рисува компонента с `data` и с `isError`, равно на `true`, така че петото състояние, „с данни и с грешка“, остава на мястото си. Това е валиден начин да се напише екран, но има цена за това, което този урок преподава: „зареждане“ и „грешка без данни“ вече не се виждат в компонента, а са разпределени между `fallback` отгоре и граница за грешки още по-нагоре. За табло, чиято стойност е именно в това да показва добре петте състояния, курсът предпочита да ги има всичките заедно, в `ContenidoReporte`, пред очите. Затова контролната точка не използва Suspense; това е собствен принцип, а не правило.

### 4.8 Границата за грешки: единственият клас в курса

Всичко дотук се отнася за **очаквани** грешки: API отговори с 503, мрежата изчезна. Те се рисуват като състояния. Но има и друг вид грешка: компонент, който при рисуването си хвърля изключение. `undefined`, който никой не е очаквал, `.map` върху нещо, което не е масив. В React такава грешка по време на рисуване демонтира цялото дърво: екранът остава бял.

За да се улови, съществува **Error Boundary** (граница за грешки), която в този курс се казва `LimiteDeError`. Документацията на React описва как се пише: компонент, който дефинира `static getDerivedStateFromError`, което React извиква, когато дете — дори далечно — хвърли грешка при рисуването си, така че вместо да изтриеш екрана, да покажеш съобщение; и, ако искаш, `componentDidCatch`, за да запишеш грешката в някоя услуга. И казва също защо този курс, който не преподава класови компоненти, прави тук изключение: **днес няма начин Error Boundary да се напише като функционален компонент** ([React, „Component“](https://react.dev/reference/react/Component)).

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

Чете се на три части:

- **`getDerivedStateFromError`** е статичен: няма достъп до `this`, само получава грешката и връща новото състояние. React го извиква по време на рисуването, така че трябва да е чист, като всяко рисуване (Урок 1).
- **`componentDidCatch`** се извиква след това, когато React вече е приключил, и затова може да прави неща със странични ефекти: тук записва в конзолата грешката и стека на компонентите. В публикувана система това би било мястото да се изпрати към услуга за регистриране на грешки.
- **`render`** рисува предупреждението, ако е имало грешка, или децата, ако не е имало. Бутонът презарежда цялата страница: грешката при рисуване почти винаги е дефект в кода и няма нищо по-добро за предлагане от това да се започне отначало. Обърни внимание, че предупреждението показва `error.message` както си е. Тъй като то е текст-дете в JSX, не отваря дупка за XSS, но показва на всеки суровото съобщение на изключението, което може да разкрие вътрешни детайли: имена на полета, пътища, части от заявка. В това тренировъчно табло помага при отстраняването на грешки; в приложение, отворено за публиката, е добре да се показва общ текст, а детайлът да остане само в записа на `componentDidCatch`.

Това, което границата за грешки **не** улавя, е толкова важно, колкото и това, което улавя. Според същата страница: грешките в обработчиците на събития (`onClick`, който хвърля грешка), асинхронният код (`setTimeout`, promise без обработка), рисуването на сървъра и грешките на самата граница. Страницата добавя изключение, което ще срещнеш в [Урок 7](07-formularios-accesibilidad.md): това, което се хвърли вътре в преход, като действие на формуляр, стига до границата. Това обяснява разпределението в това табло: `fetch`, който се провали, не е грешка при рисуване, а данни, които са пристигнали зле, и Query ги обработва като състояние; границата за грешки остава за това, което никой не е предвидил.

Къде отива? В `main.tsx`, **извън** `QueryClientProvider`, обвивайки всичко. Така улавя и грешките на доставчика и на всичко, което е под него. Фигура 3 от „Грешката, която ще видиш“ ти показва първата грешка, която ще направиш с Query, и как тази граница я превръща в съобщение вместо в бял екран.

### 4.9 Пълното преминаване

С два терминала, както в Урок 0. В първия — тестовият сървър; от този урок нататък той казва в какъв сценарий е стартирал:

```text
08:11:23.119 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
```

Във втория — `npm run dev`, и отвори `http://localhost:5173/`. Трябва да видиш списъка с четирите услуги, обобщението „4 servicios revisados · 2 servicios con falla“, „Actualizado a las…“ и, на всеки десет секунди, краткотрайно „· actualizando…“ в долната част. Избери `pagos`, изчакай детайлите му и натисни „Volver a revisar“: редът става зелен, после детайлите, а бутонът се връща към текста си. Това е записът от 4.6.1.

След това изгради и разгледай версията, която би се публикувала, докато сървърът още работи: `npm run build` и `npm run preview`, на `http://localhost:4173/`. Ето какво записа логът, когато Chrome отвори тази версия:

```text
08:13:08.422 servidor de práctica en http://127.0.0.1:3100 (escenario: normal)
08:13:10.768 GET /api/estados 200
```

Една-единствена заявка. Без `StrictMode` няма допълнително монтиране и заявката се иска веднъж. А екранът, със заглавие на раздела `(2) Revisor`:

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

Спри всичко с Ctrl+C. Накрая — проверката на контролната точка, тази, която изпълнява всеки автоматичен преглед: `npm ci`, `npm run lint` и `npm run build`, и трите с изходен код 0. Линтерът не съобщи нищо, а изграждането даде същото име на файл, което изпълненията на курса получиха под macOS и под Linux, `index-BzO-N0-M.js`.

## Грешката, която ще видиш

Урокът има една основна грешка, тази, която почти всеки прави първия път, когато използва Query, и една помощна, която TypeScript улавя вместо теб.

**Основната грешка: липсва доставчикът.** `useQuery` има нужда от `QueryClient` и го търси в най-близкия `QueryClientProvider` нагоре по дървото. Ако няма такъв — забравил си да обвиеш дървото или си монтирал компонент в тест без него, — `useQuery` хвърля грешка **при рисуването си**. Третата фигура я предизвиква нарочно, с граница за грешки по същия модел като `LimiteDeError`, и иска от React да съобщи, когато граница улови нещо (`onCaughtError`):

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

Съобщението се обяснява само: „няма никакъв `QueryClient`; използвай `QueryClientProvider`, за да зададеш такъв“. Вижда се и какво е направила границата: вместо бял екран човекът вижда съобщение. Без границата React би демонтирал цялото дърво, а в конзолата би се появила същата грешка като неуловена. Поправката е `QueryClientProvider` в `main.tsx`. В тестовете от Урок 8 същата грешка е причината да съществува помощна функция, която монтира всеки компонент вече вътре в неговия доставчик.

**Помощната грешка: използване на `data`, преди да знаеш дали съществува.** В `ContenidoReporte` изтрий първия `if`, този с `isPending`, и провери типовете. Беше направено в копие на контролната точка:

```text
$ npx tsc -b
src/reporte/ContenidoReporte.tsx(35,11): error TS2339: Property 'estados' does not exist on type 'ReportePublico | undefined'.
src/reporte/ContenidoReporte.tsx(42,32): error TS7006: Parameter 'estado' implicitly has an 'any' type.
```

Без този `if` `consulta.data` може да бъде `undefined` — това е точно случаят `pending`, — и TypeScript отказва да го разглоби. Втората грешка е следствие от първата: щом не знае какво е `estados`, не знае и какво е всеки `estado`. Ценното тук е, че предупреждението идва **преди** изпълнението: в браузъра този пропуск би бил `TypeError` по време на първото рисуване — точно видът грешка, който стига до границата от 4.8. Поправката не е `consulta.data!.estados`, нито `consulta.data?.estados ?? []`: първото лъже, а второто превръща „още не знам“ в „няма услуги“, което е четвъртото състояние и означава нещо друго. Поправката е да се нарисува случаят `pending`.

## Какво се прави погрешно

**Копиране на данните от Query в `useState`.** `const [reporte, establecerReporte] = useState(consulta.data)` и Effect, който ги синхронизира. Това е изкушението на онзи, който идва от ръчното извличане на данни. Сега има две копия на едни и същи данни, едното остарява, а Effect-ът е точно този, който Урок 3 те научи да не пишеш. Чети `consulta.data` там, където ти трябва.

**Създаване на `QueryClient` вътре в компонент.** Всяко рисуване създава нов, празен кеш: губят се дедупликацията, данните, които оцеляват при връщането, и всичко от фигура 1. Той се създава на ниво модул, в `main.tsx`, или във функция, която се извиква веднъж.

**Оставяне извън ключа на променлива, която функцията използва.** `queryKey: ["servicio"]` с функция, която иска `nombre`, кара всички детайли да споделят един-единствен запис в кеша. Линтерът не го вижда. Правилото: това, което функцията използва, влиза в ключа.

**Третиране на `isFetching` като „зареждане“.** Ако скриваш списъка всеки път, когато `isFetching` е вярно, го изпразваш на всеки десет секунди с периодичното запитване. „Зареждане“ е `isPending`; `isFetching` е най-много дискретно известие.

**Показване само на грешката и скриване на остарелите данни.** Когато `status` е `error`, но `data` съществува, имаш нещо полезно за показване. Табло за мониторинг, което остава празно, защото едно обновяване се е провалило, е по-лошо от такова, което казва „това е отпреди минута“.

**Забравяне на празното състояние.** Списък без редове не се различава от счупен екран. Изречение като „No hay servicios configurados todavía.“ струва един ред.

**Инвалидиране в компонента след `mutate()`.** Извикването на `invalidateQueries` веднага след `mutate()`, в `onClick`, инвалидира **преди** сървърът да е отговорил: списъкът се иска отново и може да донесе старите данни. Инвалидирането отива в `onSuccess`, който се изпълнява, когато отговорът вече е пристигнал.

**Увеличаване на `retry`, за да се „поправи“ нестабилно API.** Повече повторни опити не карат API да се проваля по-рядко: карат човека да разбере по-късно, че се проваля. С изчакването, което се удвоява, всеки допълнителен опит добавя секунди към „Cargando…“.

**Слагане на `Suspense` около `useQuery` в очакване на `fallback`.** Той не се появява: `useQuery` не спира рисуването. Ако искаш Suspense, това е друг hook, `useSuspenseQuery`, с друго разпределение на състоянията.

**Използване на границата за грешки за мрежовите грешки.** `fetch`, който се провали, е състояние, което се рисува до списъка, с неговия бутон „Reintentar“. Границата за грешки е за това, което никой не е предвидил.

## Упражнения

### Упражнение 1 — Предвиди лога без повторни опити

Със сървъра в `ESCENARIO=caido` логът от 4.5 записа една отменена заявка и три `503`. **Преди да промениш каквото и да е**, предвиди какво ще запише, ако в `cliente.ts` смениш `retry: 2` с `retry: 0`, и след колко време ще се появи предупреждението. След това го провери с `npm run dev` и върни `2`, когато приключиш.

### Упражнение 2 — Без `staleTime`

Във `fig04_01.tsx` изтрий реда `staleTime: 5_000,` от `ConteoConQuery`. Предвиди какво се променя в трите реда от половината на Query: извикванията при отваряне, това, което се вижда веднага при връщането, и извикванията при връщането. Компилирай и я изпълни.

### Упражнение 3 — Инвалидирай само детайлите

В `useReintentar.ts` остави в `Promise.all` само инвалидирането на `claves.servicio(nombre)`. Преди да пробваш, предвиди какво показва **списъкът** след натискане на „Volver a revisar“ за `pagos` и кога се актуализира. Коя част от сцената в началото на урока се появява отново? Върни файла в изходното му състояние, когато приключиш.

### Упражнение 4 — Ключът, който забрави името

В `src/detalle/consultas.ts` смени `queryKey: claves.servicio(nombre)` с `queryKey: ["servicio"]`. Отвори детайлите на `pagos`, изчакай да се заредят и, преди да са минали пет секунди, избери `catálogo`. Какво казват детайлите под заглавието „catálogo“? Предупреди ли те линтерът или TypeScript? Обясни кое правило от 4.3.1 наруши. Върни файла в изходното му състояние, когато приключиш.

## Решения

### Решение 1

С `retry: 0` Query не прави повторни опити: логът записва двойката на `StrictMode` и **един-единствен** `503`, тоест `GET /api/estados cancelada por el cliente`, последвано от `GET /api/estados 503`. Предупреждението се появява веднага щом пристигне този отговор, около 300 ms след отварянето на страницата, вместо четирите секунди, които отне с `retry: 2`. Предвиждането следва от две вече измерени неща: всеки `503` от 4.5 съответства на един опит, а паузите от 1 и 2 секунди между тях са изчакването на повторните опити, което при нула повторни опити не съществува. Ако в твоето изпълнение не се появи `cancelada`, причината е тази, която обясни Урок 0: зависи от това дали връзката е успяла да стигне до сървъра преди прекъсването. Нулата повторни опити има своята цена: едно мигновено препъване в мрежата веднага се превръща в предупреждение на екрана. Затова курсът не използва `0`, а `2`.

### Решение 2

Това е реалният изход на фигурата без този ред:

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

Променя се едно-единствено число: **при връщането има едно извикване**. При отварянето все така има само едно, защото дедупликацията не зависи от `staleTime`. И при връщането все така веднага се вижда „4 servicios“, защото данните все още са в кеша (пази ги `gcTime`, а не `staleTime`). Това, което се променя, е, че при `staleTime`, равно на `0`, тези данни вече са остарели, така че Query ги показва **и** ги иска отново във фонов режим, само веднъж за двата компонента. Това е стратегията, която обикновено се нарича „покажи това, което имаш, докато потвърждаваш“ (*stale-while-revalidate*): човекът никога не вижда ненужно „зареждане“, а данните се актуализират сами. `staleTime` не решава дали има кеш; решава кога си струва той да се потвърди.

### Решение 3

Списъкът **продължава да казва `pagos: falla (HTTP 503)`**, след като детайлите вече казват „Disponible“. Актуализира се едва при следващото запитване от `refetchInterval`, най-много десет секунди по-късно, или по-рано, ако прозорецът загуби и получи отново фокуса (защото данните на списъка остаряват след пет секунди, а `refetchOnWindowFocus` е включено). Това е сцената от началото на урока: детайлите и списъкът разказват две различни истории за една и съща услуга. Нищо в кода не е „грешно“ в смисъл, че не се компилира или че линтерът го забелязва; липсва уведомяването на кеша, че данните `["reporte"]` също са се променили. Инвалидирането описва **кои данни засяга един запис**, и този списък е отговорност на този, който пише мутацията. В лога го виждаш директно: след `POST` излиза само един `GET` — този за детайлите.

### Решение 4

Под заглавието „catálogo“ се появяват детайлите **на `pagos`**: „En falla: HTTP 503“. С `["servicio"]` като ключ детайлите на всички услуги споделят един-единствен запис в кеша. Когато избереш `catálogo`, `PanelDetalle` се монтира отново (заради `key={seleccionado}` в `ContenidoReporte`) и иска ключа `["servicio"]`; Query намира там данните на `pagos`, все още свежи, защото не са минали петте секунди на `staleTime`, и ги връща, без да иска нищо. След тези пет секунди при повторно монтиране би ги поискал отново и би показал `catálogo`, но с един миг грешни данни преди това. Нито линтерът, нито TypeScript предупреждават: ключът е валиден масив и типът на данните е правилният, само че това са данните на друга услуга. Наруши правилото от 4.3.1, „ако функцията зависи от променлива, тази променлива влиза в ключа“: `cargarDetalle(nombre, signal)` зависи от `nombre`, така че `nombre` трябва да е в ключа. Това е еквивалентът в Query на зависимостта, която липсваше в Effect-а от Урок 0, с една разлика, която си струва да се помни: тук няма `exhaustive-deps`, който да те пази.

## Как разбирам, че съм успял

- [ ] `npm ls @tanstack/react-query`, вътре в `~/curso-react/revisor/`, отпечатва `@tanstack/react-query@5.104.5`, а в `src/` вече не съществуват `useReporte.ts` и `useDetalle.ts`.
- [ ] `npm run lint` завършва, без да изписва никакъв проблем, а `npm run build` завършва с `✓ built` и оставя в `dist/assets/` файл с име `index-BzO-N0-M.js`: ако кодът ти е идентичен с този на контролната точка, името съвпада.
- [ ] `node fig04_01.js` отпечатва `1 llamada(s)` при отваряне и `0 llamada(s)` при връщане в половината на Query, и можеш да обясниш откъде идва всяко число.
- [ ] С `ESCENARIO=vacio` таблото казва „No hay servicios configurados todavía.“; с `ESCENARIO=caido` показва предупреждението с „Reintentar“, а логът записва три `503` (плюс, ако успее да стигне, една `cancelada por el cliente` преди тях).
- [ ] При нормалния сценарий натискането на „Volver a revisar“ за `pagos` кара лога да запише `POST /api/servicios/pagos/reintento 200`, последвано от `GET /api/estados 200` и `GET /api/servicios/pagos 200`, а редът на `pagos` става зелен, без да се натиска „Actualizar“.
- [ ] Можеш да назовеш петте комбинации на `status` и `fetchStatus` от фигура 2 и да кажеш коя показва „· actualizando…“ в долната част.
- [ ] С `npm run preview` отварянето на страницата произвежда една-единствена заявка `GET /api/estados` в лога.
- [ ] Като махнеш `QueryClientProvider` от `main.tsx` (и го върнеш), виждаш съобщението на `LimiteDeError` вместо бял екран.
- [ ] Записа в своя [дневник](bitacora.md) колко заявки правеше ръчно в сравнение с колко прави сега, нещо, което Query направи само и те изненада, и кога ти беше удобен `staleTime`, различен от нула.

## Обобщение

Отговори, без да гледаш урока:

1. Според плана на курса ръчното извличане на данни не се мащабира по три причини: кеш, каскади и надпревара. Какво казва документацията на React за всяка от тях и как Query отговаря на всяка? Коя измери фигура 1?
2. Защо `QueryClient` се създава в `main.tsx`, а не вътре в компонент? Какво пази той?
3. Какво е ключ на заявка и кое правило не позволява две различни стойности да споделят запис в кеша?
4. Кой създава сега `AbortController` и кога Query прекъсва `signal`?
5. На кой въпрос отговаря `status` и на кой — `fetchStatus`? Коя комбинация означава „имам данни и ги искам отново“?
6. Кои са четирите състояния на една заявка и кое е петото, което съществува само благодарение на кеша?
7. Какво правят `staleTime`, `retry` и `refetchInterval` в това табло? Защо три `503` в лога при `retry: 2`?
8. Какво прави `invalidateQueries` и защо отива в `onSuccess`? Защо бутонът казва „Revisando…“, докато не пристигнат и детайлите?
9. Защо `Suspense` около `useQuery` не показва своя `fallback`?
10. Какви грешки улавя Error Boundary, какви не и защо е клас?

## За допълнително четене

- [React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects), раздел „What are good alternatives to data fetching in Effects?“: цената на извличането на данни в Effect (без сървър, каскади, без кеш, неергономично) и препоръката за кеш от страната на клиента. Посетено на 21 октомври 2026 г.
- [React, „Suspense“](https://react.dev/reference/react/Suspense): какво активира една граница на Suspense и предупреждението, че тя не открива данни, поискани в Effect или в обработчик на събития. Посетено на 21 октомври 2026 г.
- [React, „Component“](https://react.dev/reference/react/Component), раздел „Catching rendering errors with an Error Boundary“: `getDerivedStateFromError`, `componentDidCatch`, кои грешки не улавя и защо все още няма функционална версия. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Important Defaults“](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults): `staleTime`, равно на нула, `gcTime` от пет минути, три повторни опита и обновяванията при монтиране, при връщане на фокуса и при повторно свързване. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Queries“](https://tanstack.com/query/latest/docs/framework/react/guides/queries): `status` срещу `fetchStatus` и техните стойности. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Keys“](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys): ключовете като сериализуеми масиви и правилото да се включват променливите на функцията. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Options“](https://tanstack.com/query/latest/docs/framework/react/guides/query-options): `queryOptions` за споделяне на ключ и функция заедно с типа им. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Cancellation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): `AbortSignal`, който получава всяка функция, и кога се прекъсва. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Retries“](https://tanstack.com/query/latest/docs/framework/react/guides/query-retries): броят повторни опити и изчакването, което се удвоява от една секунда до 30. Посетено на 21 октомври 2026 г.
- [TanStack Query, „useQuery“](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery): `refetchInterval`, `refetchIntervalInBackground`, `dataUpdatedAt`, `isFetching`, `isPending` и `refetch`. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Mutations“](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `useMutation`, неговите състояния и функциите, които връщат promise. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Invalidation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation): какво прави `invalidateQueries` и съвпадението по префикс на ключа. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Invalidations from Mutations“](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations): връщането на promise в `onSuccess` и това, че `isPending` остава `true`, докато той не се изпълни. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Suspense“](https://tanstack.com/query/latest/docs/framework/react/guides/suspense): `useSuspenseQuery`, винаги дефинираните данни и кои грешки стигат до границата за грешки. Посетено на 21 октомври 2026 г.
- [npm, „npm install-scripts“](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts): инсталационните скриптове на зависимостите, блокирани до одобрението им, и как се преглеждат и одобряват. Посетено на 21 октомври 2026 г.
- [npm, `@tanstack/react-query`](https://www.npmjs.com/package/@tanstack/react-query): версия 5.104.5, публикувана на 19 октомври 2026 г. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| състояние на сървъра | копието на екрана на данни, които живеят на друг компютър: бавят се да пристигнат, могат да се провалят и остаряват |
| кеш | мястото извън компонентите, където Query пази това, което е дошло от сървъра, по един запис за всеки ключ |
| ключ на заявка | масивът, който идентифицира данните в кеша, например `["servicio", "pagos"]` |
| дедупликация | когато два компонента искат един и същ ключ едновременно, се прави една-единствена заявка |
| свежи / остарели (*stale*) | данните са свежи в продължение на `staleTime` след пристигането си; след това се показват, но се искат отново, когато е нужно |
| `status` / `fetchStatus` | дали има данни (`pending`, `error`, `success`) / дали функцията се изпълнява (`fetching`, `paused`, `idle`) |
| мутация | операция, която променя данни на сървъра; в Query — `useMutation`, който се изпълнява само при извикване на `mutate()` |
| инвалидиране | маркиране като остарели на заявките с даден ключ и повторно искане на тези, които са на екрана |
| празно състояние | валиден отговор без данни, който екранът трябва да различава от зареждане и от грешка |
| Error Boundary (граница за грешки) | класов компонент, който улавя грешките, хвърлени от децата му при рисуването, и показва нещо на тяхно място |

---

**Следващ:** [Урок 5 — Маршрути и URL като състояние](05-rutas-url-como-estado.md)
