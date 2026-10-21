# Урок 6 — Споделено състояние: reducer и контекст

*Петък, 18:50 ч. Версията за седмицата излиза в 19:30 ч. В чата пристигат две съобщения почти по едно и също време. Първото е от екипа по експлоатация: „Натиснах „Повторна проверка“ за pagos, върнах се в списъка да видя дали се променя, и така и не разбрах дали сработи“. Имаш отговора: известието за грешка живееше вътре в страницата на услугата и при напускането на страницата известието си отиде с нея. Второто е от залата на дежурните: „На големия екран милисекундите се струпват едни върху други, можеш ли да ги скриеш?“. Изглежда като десетминутна промяна. Отваряш `FilaEstado.tsx`, който изобразява милисекундите, и му добавяш свойство `mostrarDuracion`. Само че `FilaEstado` го получава от `ListaEstados`, който го получава от `ContenidoReporte`, който го получава от `PaginaReporte`, който пък би трябвало да го получи от оформлението през `Outlet`. В 19:05 ч. промяната ти засяга пет файла, като три от тях не правят нищо с тези данни: просто ги предават на следващия. А все още липсва полето за отмятане, за да се променя. Този урок решава двете съобщения с два инструмента от React и обяснява защо нито един от двата не е за всяка ситуация.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 6.1 и 6.2)

**Какво изграждаш:** лентата с известия на `revisor`, която живее в оформлението и затова оцелява при смяна на страницата; бутонът „Volver a revisar“ оставя там своя резултат, както при успех, така и при грешка. И предпочитанията за екрана, „Mostrar duración“ и „Vista compacta“, които се променят в заглавната част и се четат от ред в списъка пет нива по-надолу, без да минават през компонентите по средата.

**Какво научаваш:** `useReducer`: действия, които описват какво се е случило, и чист reducer, който се тества без React; контекст само когато свойствата и `children` вече не стигат; два контекста — един за състоянието и един за изпращането (dispatch); hook, който хвърля грешка, ако липсва доставчикът; **кое състояние къде живее**: локално, в адреса, на сървъра или в контекст.

**Откъде идваш.** От [Урок 5](05-rutas-url-como-estado.md). Твоят `revisor` вече има маршрути: списъкът на `/`, с филтрите в адреса (`?fallas=1&q=`); детайлният изглед на `/servicios/:nombre`; и страница „не е намерено“ за всичко останало. Едно оформление, `Disposicion`, обвива всички страници със заглавната част и навигацията и съхранява бележките, които стигат до страниците през `<Outlet context>` и hook-а `useNotas()`. От този урок насам кореновият маршрут има освен това и собствена граница за грешки (error boundary), защото React Router улавя грешките на страниците, преди да стигнат до `LimiteDeError`. Данните продължава да ги носи TanStack Query, а „Volver a revisar“ е мутация, която инвалидира отчета и детайла. Тръгваш от контролната точка [`programas/05-rutas-url-como-estado/revisor/`](../programas/05-rutas-url-como-estado/revisor).

**Какво не прави този урок.** Не пипа тестовия сървър, нито маршрутите: API си остава във версия C, а масивът от маршрути е същият от урок 5. Не мести бележките в контекст: те си остават в оформлението, а раздел 6.3 обяснява защо тяхното място е там. Не използва Redux, нито каквато и да е библиотека за състояние: курсът няма нужда от нея, а раздел 6.3 казва кога би имало смисъл да се помисли за това. Не мемоизира стойностите на контекстите с `useMemo` или `useCallback`: тук се измерва колко пъти се рисува всеки компонент, и измерването не го изисква; измерването с Profiler е тема на [Урок 9](09-rendimiento-publicacion.md). Не записва предпочитанията в браузъра: при презареждане те се връщат към началните си стойности (упражнение 4 обсъжда къде би трябвало да живеят, ако искахме да се запазват). И не сглобява тестов пакет: reducer-ът се тества тук с фигура, която го стартира без React; пакетите с тестове с Vitest са тема на [Урок 8](08-pruebas-de-componentes.md).

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` за този урок; този урок не добавя никаква зависимост. Контролната точка беше инсталирана от нулата с `npm ci`, а `npm run lint` и `npm run build` завършиха успешно и произведоха `dist/assets/index-DBIHM1Pv.js`. Изпълненията на курса бяха проверили същата тази контролна точка в контейнер с Linux (Debian 12, образ `node:24.22.0`); това пускане не беше повторено за този урок и не беше изпълнено на реален Linux Mint, но нищо от показаното тук не зависи от операционната система. Ако `npm ci` отпечата под macOS предупреждение от `install-scripts` за `fsevents@2.3.3`, това е незадължителна зависимост, която се инсталира само на macOS за наблюдение на файлове: няма нужда да се одобрява, а в твоя Mint няма да се появи. Това, което се вижда „в браузъра“, беше измерено с Chrome в режим без графичен интерфейс (*headless*) срещу `vite preview`, контролиран през неговия протокол за дебъгване, за да може да се кликва и да се чете страницата след всяко кликване: това е реален браузър, а не симулация. Тъй като на тестовата машина имаше включени и други неща, тестовият сървър слушаше на порт 3106 (`PUERTO=3106 npm run servidor`), а предварителният преглед на 4106, с еднократна конфигурация, насочваща неговото прокси (*proxy*) към този порт; на твоята машина използвай обичайните, 3100 и 4173, и ще видиш същото. Часовете в лога на тестовия сървър са по UTC. Фигурите бяха изпълнени със собствен `package.json` в [`programas/06-reducer-contexto/`](../programas/06-reducer-contexto), до `revisor/`; фигура 1 се изпълнява с `node` директно върху файла `.ts`, без компилиране, а останалите се компилират с `tsc`, както в предишните уроци. Дългите пътища се показват спрямо `~/curso-react`.

## След урока ще можеш да

- Да пишеш действията на един reducer като дискриминирано обединение, което описва **какво се е случило** (`agregado`, `descartado`), и да накараш TypeScript да ти посочва съответния `switch`, когато добавиш действие и забравиш да го обработиш.
- Да тестваш reducer без React, с `node` и списък от действия, и да проверяваш, че той не е модифицирал състоянието, което е получил.
- Да решаваш, когато няколко компонента се нуждаят от едни и същи данни, дали стига подаването на свойства, дали е удобно пренареждане с `children`, или е нужен контекст, и да обясниш решението със случая на `revisor`.
- Да разделяш състоянието и изпращането в два контекста и да измерваш, броейки рисуванията, кои компоненти се прерисуват във всеки от случаите.
- Да напишеш hook за контекст, който хвърля ясна грешка, когато липсва доставчикът, и да показваш какво става, когато вместо да хвърля грешка, контекстът има стойност по подразбиране.
- Да класифицираш всяко парче състояние на `revisor` като локално, в адреса, на сървъра, в оформлението или в контекст, с причина за всяко от тях.

## Защо, преди как

Двете съобщения от сцената изглеждат като два различни проблема, а всъщност са един и същ въпрос, зададен два пъти: **кой пази тези данни и как стигат те до онзи, който има нужда от тях?**

Започни с изгубеното известие. В урок 5 резултатът от „Volver a revisar“ се изчертаваше вътре в `PaginaServicio`, с един `<p role="alert">`, който се появяваше, ако мутацията се провали. Работи, докато човекът остава на тази страница. Но страницата е маршрут, а маршрут, който преставаш да виждаш, **се демонтира**: неговото състояние, неговите мутации на екрана и неговите известия се унищожават. Известието има нужда да живее на място, което не се демонтира при навигация, и това място вече съществува: оформлението, което обвива всички страници. Проблемът е разстоянието. Онзи, който научава за резултата, е hook, `useReintentar`, работещ вътре в `PaginaServicio`, вътре в `Outlet`. Онзи, който трябва да го нарисува, е горе, в оформлението. Нужен е път отдолу нагоре.

И това не е само едно известие. Ако известието ще живее по-дълго от страницата, трябва да може да се отхвърля; ако дойдат няколко, трябва да се сложи таван, за да не растат безкрайно; и всяко има нужда от идентификатор, за да знае React кое да премахне. С `useState` това са три функции (`agregar`, `descartar`, `descartarTodos`), които пипат един и същ масив, всяка със свое собствено копие на правилата. Документацията на React описва точно този момент: когато един компонент има множество обновявания на състоянието, разпръснати из много обработчици на събития, е удобно цялата тази логика да се събере извън компонента, в една-единствена функция ([React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Тази функция се нарича **reducer**.

Сега второто съобщение. `mostrarDuracion` не е стойност, която принадлежи на една страница: променя се от поле за отмятане в заглавната част и се чете от всеки ред на списъка. Между полето за отмятане и реда има пет компонента, и четири от тях не използват тези данни. Предаването им от ръка на ръка работи, но задължава да се променя сигнатурата на компоненти, които нямат нищо общо с предпочитанието, и всеки нов компонент, поставен по средата, ще трябва да помни да го предава. React има инструмент, с който една стойност „прескача“ междинните нива: **контекстът**. И неговата документация, на същата страница, където го представя, предупреждава преди използването му, че е твърде изкушаващо да се прекалява с него ([React, „Passing Data Deeply with Context“](https://react.dev/learn/passing-data-deeply-with-context)). Затова този урок не започва с контекста, а с двете неща, които си струва да се опитат преди него.

Урокът има три части. В 6.1 изграждаш reducer-а на известията и го тестваш без React. В 6.2 го свързваш с два контекста, написваш hook-а, който отказва да работи без доставчик, и прилагаш същия шаблон към предпочитанията. А в 6.3 правиш пълния опис: всяко парче състояние на `revisor`, къде живее и защо точно там. Накрая ето това се вижда на екрана с детайлите за `pagos` след натискане на „Volver a revisar“, и ще знаеш откъде идва всяка частица:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div></section>
```

Това е лентата за известия точно така, както я предаде Chrome, и остава същата след връщане към списъка: известието вече не зависи от страницата, която го е произвела.

## Понятията

### 6.1 `useReducer`: действия, които описват какво се е случило

#### 6.1.1 Reducer е функция, която вече познаваш

Името звучи странно, но идеята не е такава. Масивите в JavaScript имат метод, `reduce`, който обхожда елементите по ред и предава резултата от всяка стъпка на следващата; функцията, която му подаваш, се нарича точно така — *reducer*, а крайният резултат е една-единствена стойност ([MDN, `Array.prototype.reduce()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)). Документацията на React обяснява, че нейните reducer-и носят това име заради същата идея: този на масива получава „резултата до момента“ и „текущия елемент“ и връща следващия резултат; този на React получава **състоянието до момента** и **действието** и връща **следващото състояние** ([React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

Имай го предвид, защото в 6.1.4 буквално ще използваш `reduce` на масив с reducer-а на известията и той ще сработи, без да променяш нищо по него. Това е първото предимство на един reducer: **той не знае нищо за React**. Това е функция с два аргумента, която връща стойност.

#### 6.1.2 Действията: какво се е случило, а не какво трябва да се направи

С `useState` компонентът казва на React **какво да направи**: „сложи този масив“. С reducer компонентът му казва **какво се е случило**: „добави се известие“, „потребителят отхвърли известие 3“. Случилото се се описва с обект, наречен **действие (action)**, а правилото за правилното му написване според документацията на React е типът на действието в идеалния случай да описва „какво е направил човекът“, а не „как искаш да се промени състоянието“; и **всяко действие да описва едно-единствено взаимодействие**, дори това взаимодействие да предизвиква множество промени в данните ([React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer)).

В `revisor` действията са три и техните имена нарочно са минали причастия: `agregado`, `descartado`, `todos-descartados`. Четат се като хроника на фактите. Забележи какво **не** са: няма действие `recortar-a-cinco`, нито `incrementar-id`. Когато пристигне ново известие, се случват три неща (поставя се в началото, списъкът се отрязва до пет и броячът на идентификатори напредва), но човекът е направил едно-единствено нещо: предизвикал е известие. Тези три неща са *последицата*, а последицата е работа на reducer-а.

В TypeScript съвкупността от възможни действия е **дискриминирано обединение**, също като `EstadoPublico` от урок 0: всеки член има различен `tipo` и данните, от които този тип се нуждае. `agregado` носи нивото и текста; `descartado` носи идентификатора; `todos-descartados` не се нуждае от нищо повече.

#### 6.1.3 Reducer-ът на известията

Това е пълният файл. Всичко, което трябва да се знае за известията, е тук, и нищо в него не импортира нищо от React:

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

Прочети го от горе до долу:

- **Типовете.** Един `Aviso` има `id`, `nivel` (`exito` или `error`) и `texto`. Състоянието не е просто списъкът: `EstadoAvisos` пази също и `siguienteId`, числото, което ще получи следващото известие. Може да изглежда, че то може да се изчисли („най-големият идентификатор плюс едно“), но не: ако отхвърлиш най-новото известие, най-големият намалява и следващото известие би повторило идентификатор, който React вече е използвал като `key` за друг елемент. Тази стойност не може да се изведе от останалите, затова се пази. Всички полета са `readonly`, а списъкът е `readonly Aviso[]`: TypeScript не ти позволява да го модифицираш, и в „Грешката, която ще видиш“ ще се увериш в това.
- **`agregado`.** Сглобява новото известие със `siguienteId`, поставя го **в началото** на нов списък (`[nuevo, ...estado.avisos]`) и го отрязва със `slice(0, MAXIMO_AVISOS)`. Нито `[...]`, нито `slice` променят оригиналния масив: те създават друг. Таванът е в именувана константа, `MAXIMO_AVISOS = 5`, а не като „магическо число“ (*magic number*) `5`, за да може да се чете и тества.
- **`descartado`.** `filter` връща нов списък без известието с това `id`. Останалата част от състоянието се копира с `...estado`; `siguienteId` не се променя, и затова един идентификатор никога не се използва повторно.
- **`todos-descartados`.** Празен списък, броячът е непокътнат.
- **`default` с `never`.** Ако TypeScript е стигнал дотук, той вече е отхвърлил трите типа и за `accion` не остава никакъв възможен тип: тя е `never`. Присвояването ѝ на променлива от тип `never` не струва нищо, докато това е вярно. В деня, в който някой добави четвърто действие към обединението и забрави неговия `case`, това присвояване спира да се компилира. Това е същата техника, която наръчникът на TypeScript нарича изчерпателна проверка ([TypeScript, „Narrowing“, *Exhaustiveness checking*](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)), и е същата, която `ContenidoReporte` използваше още от урок 0. `throw` би се изпълнил само ако нещо заобиколи системата от типове (например действие, сглобено ръчно с `as`); това е спасителната мрежа под мрежата.

Има едно условие, което този файл изпълнява и което не се вижда с просто око: **reducer-ът е чист**. Той получава състояние и действие и връща състояние; не иска нищо от мрежата, не планира таймери, не пише в конзолата, не чете системния часовник. Документацията на `useReducer` го изисква („трябва да бъде чиста“) и обяснява как React следи за това: в `StrictMode` той извиква твоя reducer **два пъти**, за да ти помогне да откриеш случайни нечистотии ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Ако reducer-ът имаше страничен ефект, например `fetch`, това двойно извикване би го задействало два пъти по време на разработка, което е точно онова, което `StrictMode` иска да видиш. И има един детайл в този reducer, който лесно може да се счупи без да искаш: идентификаторите. Ако вместо да пазиш `siguienteId` в състоянието, използваше брояч извън функцията (`let ultimo = 0` в началото на файла и `ultimo += 1` вътре), двойното извикване на `StrictMode` би прескачало числа и два reducer-а, обработващи едни и същи действия, биха дали различни резултати. Тъй като броячът пътува в самото състояние, едно и също действие върху едно и също състояние дава винаги едно и също.

#### 6.1.4 Тестване без React

Тъй като reducer-ът е функция без React, той се тества като всяка друга функция. Тази фигура импортира файла **както си е** и му подава действия. Изпълнява се директно с `node`, без компилиране, защото Node 24 изпълнява файлове `.ts` (урок 0 го обясни в 0.2.2); `tsc` от първия ред само проверява типовете.

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

Всеки ред е твърдение, което можеш да провериш с очите си:

- **`seis agregados`.** Шест действия, подадени с `reduce` на масива, същият метод от 6.1.1. Оставят пет, най-новото най-отпред, а `a` (идентификатор 1) отпадна заради тавана. `siguienteId` има стойност 7: раздадени са шест номера.
- **`descartado el 3`.** Излиза `c`; останалите запазват своя идентификатор.
- **`todos descartados`.** Празен списък, а `siguienteId` остава 7: следващото известие ще бъде номер 7, а не 1.
- **Последните три реда** показват чистотата, измерена нагледно. Едно и също действие върху едно и също състояние даде един и същ резултат; състоянието, подадено като вход, продължава да има своите пет известия, след като reducer-ът „го е отхвърлил“; а началното състояние, използвано като отправна точка за всичко, продължава да бъде празно. Reducer-ът никога не докосна онова, което получи: той винаги връщаше нещо ново.

Това е нещото, което документацията на React изтъква в полза на reducer-а при сравнение с `useState`: тъй като не зависи от твоя компонент, той може да бъде експортиран и тестван отделно, и в него може да се добави `console.log`, за да се види всяка промяна на състоянието и **защо** се е случила, тоест кое действие я е предизвикало ([React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Същата страница е честна и относно цената: с reducer пишеш повече код в началото — функцията и действията. За три действия с таван и брояч тази цена се изплаща сама. За поле за отмятане, което само се маркира и размаркира — не; затова предпочитанията от 6.2.7 си остават с `useState`.

(Копието на `avisos.ts`, което импортира фигурата, е идентично с това от контролната точка: `cmp avisos.ts revisor/src/avisos/avisos.ts` не отпечатва нищо. На твоята машина копирай файла в твоята папка с фигури.)

#### 6.1.5 `useReducer`: свързване на reducer-а с React

Reducer-ът взима решенията; липсва онзи, който да пази състоянието между прерисуванията и да му подава действията. Това прави `useReducer`. Формата му е `const [estado, despachar] = useReducer(reducer, valorInicial)`: връща текущото състояние и функция, `despachar` (*dispatch*), която приема действие ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Когато извикаш `despachar({ tipo: "descartado", id: 3 })`, React извиква reducer-а със състоянието, с което разполага, и това действие, запазва върнатото от reducer-а и прерисува. Ако върнатото е **същият обект** (сравнено чрез `Object.is`), React прескача рисуването на компонента и неговите наследници; документацията уточнява, че понякога той все още извиква компонента веднъж, преди да отхвърли резултата, но това не променя онова, което виждаш.

В `revisor` онзи, който извиква `useReducer`, е компонент, който не рисува нищо свое — **доставчикът (provider)** на известията:

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

Четири реда логика, като два от тях се обясняват в 6.2. Важното тук е какво гарантира `useReducer` за `despachar`: документацията казва, че тази функция има **стабилна идентичност**, тоест тя е една и съща функция при всички прерисувания ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Състоянието се променя всеки път, когато пристигне известие; `despachar` — никога. Тази разлика е основата на най-важното решение в следващия раздел.

### 6.2 Контекст: когато свойствата и `children` вече не стигат

#### 6.2.1 Преди контекста — два въпроса

Документацията на React е категорична: това, че се налага да предаваш свойство през няколко нива, **не означава**, че трябва да вкараш тази информация в контекст. Преди това тя предлага две алтернативи, в този ред ([React, „Passing Data Deeply with Context“](https://react.dev/learn/passing-data-deeply-with-context)):

1. **Предаване на свойства (props).** Може да се усеща като тежест, но прави пределно ясно кой компонент какви данни използва, и всеки, който поддържа кода, ще го оцени.
2. **Извличане на компоненти и предаване на JSX като `children`.** Ако дадени данни преминават през слоеве, които не ги използват, често това е, защото е пропуснато извличането на компонент: вместо `<Disposicion avisos={avisos} />`, което задължава оформлението да предава известията надолу, се пише `<Disposicion><Bandeja avisos={avisos} /></Disposicion>`, и оформлението вече изобщо не знае, че съществуват известия.

Само ако нито едно от двете не върши работа — тогава контекст. Направи това упражнение с двата случая в `revisor`.

**Известията.** Онзи, който ги рисува — лентата с известия, живее в оформлението. Онзи, който ги произвежда — `useReintentar`, живее в `PaginaServicio`, който се изчертава вътре в `<Outlet />`. Подаването на свойства тук не работи по една конкретна причина: оформлението **не създава** `PaginaServicio`. Създава го рутерът според URL адреса, на мястото на `Outlet`. В кода няма написано никакво `<PaginaServicio despachar={…} />`, на което да можеш да му добавиш свойство. Единственият канал, който рутерът предлага надолу, е `<Outlet context>`, същият като при бележките. Би могло `despachar` да се вкара в този обект, но тогава само страниците биха могли да изпращат известия, а изпращането на известия е въпрос на цялото приложение, а не на отделен маршрут: компонент, който произвежда известие, не би трябвало да зависи от това дали се намира или не вътре в `Outlet`. А `children` също не помага: няма никакъв междинен компонент за извличане, защото между оформлението и страницата няма твои компоненти, там стои рутер.

**Предпочитанията.** Пътят е друг, а резултатът е същият. Полето за отмятане живее в заглавната част на оформлението. Редът, който изчертава милисекундите, е `Descripcion`, вътре във `FilaEstado`. Между двете стоят: `Outlet`, `PaginaReporte`, `ContenidoReporte`, `ListaEstados` и `FilaEstado`. Подаването на свойството задължава да се промени сигнатурата на четири компонента, които не го използват — точно сцената от началото на урока. А `children`? Тук наистина си струва да се помисли, защото това е алтернативата, която документацията препоръчва преди контекста. Проблемът е, че редовете не могат да се създадат отгоре: създава ги `ListaEstados` с един `map` върху **вече филтрираните** състояния, а филтърът зависи от URL адреса, който се чете от `PaginaReporte`. За да се подадат редовете като `children`, би трябвало `map`-ът да се извади от `ListaEstados` и да се качи чак до оформлението, което тогава би трябвало да знае за филтри и за заявки. Това означава да се реорганизира половин приложение само за да може една стойност за представянето да стигне до своето място. Когато единственият начин да се избегне контекстът е да се смесят отговорности, контекстът е правилният инструмент.

Сред употребите, които документацията на React изброява за контекста, са именно **темата** на приложението (как изглежда то) и **управлението на състояние**, което много далечни компоненти трябва да променят, „често с reducer заедно с контекста“ ([React, „Passing Data Deeply with Context“](https://react.dev/learn/passing-data-deeply-with-context)). Предпочитанията са първото; известията — второто.

#### 6.2.2 Създаване, предоставяне и четене на контекст

Един контекст има три части:

1. **Създава се** с `createContext(valorPorOmision)`. Аргументът е стойността, която ще получи онзи, който чете контекста, ако **няма никакъв доставчик** над него в дървото; документацията я нарича резервна стойност „в краен случай“ (*last resort*), статична, която никога не се променя ([React, `createContext`](https://react.dev/reference/react/createContext)).
2. **Предоставя се**, като контекстът се изрисува като компонент със свойство `value`: `<ContextoAvisos value={estado}>…</ContextoAvisos>`. Всичко, което остане вътре, на каквато и да е дълбочина, може да чете тази стойност. От React 19 насам се пише така, със самия контекст; преди се пишеше `<ContextoAvisos.Provider value={…}>` — форма, която документацията вече нарича наследена ([React, `createContext`](https://react.dev/reference/react/createContext)) и която екипът на React обяви, че ще маркира като остаряла в бъдещи версии ([React, „React v19“](https://react.dev/blog/2024/12/05/react-19)). Ако четеш по-стар код или уроци, ще виждаш `.Provider` навсякъде: прави същото.
3. **Чете се** с `useContext(Contexto)`, който търси **най-близкия доставчик нагоре** над компонента, който го извиква, и не взима предвид доставчик, който самият компонент изрисува ([React, `useContext`](https://react.dev/reference/react/useContext)).

Контекстите на известията живеят в собствен файл, както препоръчва документацията, когато няколко файла се нуждаят от тях ([React, `createContext`](https://react.dev/reference/react/createContext)):

```ts
// revisor/src/avisos/contextos.ts
import { createContext, type Dispatch } from "react";
import type { AccionAvisos, EstadoAvisos } from "./avisos";

export const ContextoAvisos = createContext<EstadoAvisos | null>(null);
export const ContextoDespachoAvisos = createContext<Dispatch<AccionAvisos> | null>(null);
```

Два детайла. Първият: стойността по подразбиране е `null`, и типът го казва (`EstadoAvisos | null`). Това е осъзнато решение, а не недоглеждане, и 6.2.4 обяснява защо това е по-добре от стойност, която „работи“. Вторият: **това са два контекста**, а не един.

#### 6.2.3 Два контекста: състояние и изпращане

Върни се към `ProveedorAvisos` от 6.1.5. Състоянието отива в `ContextoAvisos`; `despachar` отива в `ContextoDespachoAvisos`. Защо не един-единствен контекст с обект `{ estado, despachar }`? Ръководството на React, което обединява reducer и контекст, изисква точно такова разделение: един контекст за списъка и друг за функцията, която изпраща действия ([React, „Scaling Up with Reducer and Context“](https://react.dev/learn/scaling-up-with-reducer-and-context)). То не казва защо; причината, която този урок дава, се извежда от едно правило на `useContext`: React прерисува **всички компоненти, които четат даден контекст**, когато неговият доставчик получи различен `value`, сравнен с `Object.is`, и прескачането на рисувания с `memo` не го предотвратява ([React, `useContext`](https://react.dev/reference/react/useContext)).

С един-единствен контекст `value` е нов обект при всяка промяна на състоянието, така че всеки, който чете контекста, се прерисува, **дори да иска само да изпраща действия**. В `revisor` има точно такъв: `useReintentar`, който произвежда известия и никога не ги чете; и всеки формуляр, който известява за резултата си, би бил друг такъв пример. С два контекста този за изпращане съхранява стабилна функция и неговият `value` никога не се променя. Това не е просто теория; това се преброява. Тази фигура монтира лента за известия и бутон вътре в доставчик, натиска бутона три пъти и брои колко пъти се е нарисувал всеки от тях — първо с един контекст, а след това с два. За да се брои, без да се нарушава чистотата на самото рисуване, всеки компонент извиква `useContarDibujos`, hook с Effect **без** списък от зависимости, който се изпълнява след всяко потвърдено рисуване:

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

Лентата се рисува четири пъти и в двата случая: веднъж при монтиране и по веднъж за всяко известие. Това е правилното, защото тя показва числото. Бутонът е разликата. С един контекст той се рисува четири пъти, точно като лентата, без никога да е показал нищо ново; с два — само веднъж, при монтиране. На екран с един бутон това не се забелязва. На екран с петдесет компонента, които само изпращат действия, това са петдесет излишни прерисувания за всяко известие — и всичките ненужни.

Две наблюдения върху фигурата, защото те обясняват кода на `revisor`. Първото: бутонът и лентата **не** се прерисуват заради това, че доставчикът се прерисува. Доставчикът получава и двата като `children`, а `children` е стойност, създадена от онзи, който е извикал доставчика, еднократно; когато доставчикът промени своето състояние и се прерисува, `children` продължава да бъде същият обект и React няма защо да го прерисува отново. Единственото, което принуждава един наследник да се нарисува, е да чете контекст, който се е променил. Това е композицията от урок 1, работеща в твоя полза. Второто: фигурата монтира без `StrictMode`, за да бъдат броячите точни (с него допълнителният цикъл на Effect-ите при монтиране би добавил още едно към всеки компонент, без да промени разликата). И трето, относно инструмента: броячът е променлива извън React, а Effect-ът ѝ добавя единица. Правенето на това в тялото на компонента (`dibujos.boton += 1`, докато той се рисува) би било онази нечистотия, която урок 1 те научи да преследваш, и линтерът я отхвърля с `react-hooks/immutability`. В Effect това е позволено: Effect съществува именно за да докосва онова, което е извън React. Въпреки това, това е инструмент за измерване на фигурата, а не код за `revisor`; за измерване на прерисувания в истинско приложение инструментът е Profiler в инструментите за разработка. `npx eslint` върху фигурите от този урок не дава никакво предупреждение.

А нямаше ли да бъде по-лесно обектът да се обвие в `useMemo`? Документацията на `useContext` го предлага за случаите, когато стойността е обект с функции: това е оптимизация за производителност, и тя уточнява, че в малки приложения това не е проблем ([React, `useContext`](https://react.dev/reference/react/useContext)). Разделянето на два контекста не е оптимизация, добавена впоследствие: това е естествената форма на данните, защото състоянието и изпращането се променят с различен ритъм. И не изисква да се мемоизира нищо. Това е разликата между това да подредиш правилно от самото начало и това да кърпиш с инструмент, който има своя собствена цена — което е и критерият на този курс.

#### 6.2.4 Hook, който отказва да работи без доставчик

Никой в `revisor` не извиква `useContext` директно. Правят го два hook-а, по един за всеки контекст:

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

И двата правят едно и също: четат контекста и ако получат `null`, **хвърлят грешка, която казва какво липсва и къде**. `null` може да дойде само от едно място: стойността по подразбиране на `createContext`, която React използва единствено когато не намери никакъв доставчик нагоре по дървото. Ако дойде `null`, някой е нарисувал компонент, използващ известия, извън `ProveedorAvisos`. Тъй като проверката с `if` отхвърля `null`, върнатото от hook-а вече има точния тип, `EstadoAvisos` или `Dispatch<AccionAvisos>`, и онзи, който го използва, не се налага да проверява нищо.

Ръководството на React предлага да се експортират hook-ове като тези и отбелязва, че те не променят поведението, но по-нататък ти позволяват да разделиш контекстите или да „добавиш малко логика“ към тези функции ([React, „Scaling Up with Reducer and Context“](https://react.dev/learn/scaling-up-with-reducer-and-context)). Проверката за доставчика е именно тази логика. Защо да се хвърля грешка, а да не се даде на контекста стойност по подразбиране, която „работи“, като празен списък и функция, която не прави нищо? Защото такава стойност прикрива грешката, вместо да я покаже. Тази фигура монтира двете версии **без доставчик**:

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

Версия A не се проваля. Казва „0 avisos“, и кликването върху бутона също не хвърля грешка: извиква празната функция от стойността по подразбиране, която не прави нищо, а екранът продължава да казва „0 avisos“. Това е най-лошият възможен резултат, защото всичко **изглежда**, сякаш работи: човекът натиска „Volver a revisar“ и никога не вижда известието, и никой не разбира защо, защото никъде няма никаква грешка. Версия B спира още при първото рисуване със съобщение, което назовава липсващия компонент. Грешка, която се появява първия път, когато стартираш кода, с написана нейната причина, е много по-ценна от екран, който лъже мълчаливо.

Къде би завършила тази грешка в `revisor`? Зависи от това къде се намира компонентът без доставчик. Ако беше страница, би я уловила границата за грешки на кореновия маршрут, добавена в урок 5, и нейното съобщение, с текста от hook-а, би заело мястото на цялото оформление; ако беше извън рутера, би я уловил `LimiteDeError`. И в двата случая съобщението, което би видял, е това от hook-а. А в контролната точка това не може да се случи, защото доставчиците обвиват цялото приложение (ще го видиш в 6.2.8). Където наистина би могло да се случи, е в тест, който монтира изолирана страница: ако някой забрави доставчиците при монтирането, грешката би го казала в прав текст.

Още един детайл от `useContext`, който е полезно да се знае: ако доставчик съществува, но си забравил да напишеш `value`, React не използва стойността по подразбиране; това е все едно си подал `value={undefined}` ([React, `useContext`](https://react.dev/reference/react/useContext)). Hook-ът на `revisor` сравнява с `null` и би пропуснал това `undefined`, но TypeScript го улавя предварително: контекстът беше създаден с тип `EstadoAvisos | null`, и доставчик без `value` просто не се компилира.

#### 6.2.5 Лентата за известия — ARIA live регион

С подготвените hook-ове лентата за известия е кратка:

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

Чете известията с `useAvisos()` и получава `despachar` с `useDespachoAvisos()`. Всеки бутон „Descartar“ изпраща `descartado` с идентификатора на своето известие, и същият този идентификатор е ключът `key` на реда — стабилен и уникален благодарение на брояча в reducer-а. „Descartar todos“ се появява само ако има повече от едно.

Частта, проектирана с особено внимание, е достъпността (accessibility). Известие се появява на екрана, без човекът да го е поискал на това конкретно място: натиснал е бутон в друга част на страницата или е отишъл на друга страница. Онзи, който вижда екрана, го забелязва; онзи, който използва екранен четец — не, освен ако известието не е вътре в **ARIA live регион (live region)**. Ролята `status` дефинира live регион с информация за известие, която не е толкова критична, че да бъде тревога (alert); тя носи подразбиращи се `aria-live="polite"` и `aria-atomic="true"`, така че екранният четец я оповестява, когато човекът спре да прави нещо друго, без да го прекъсва ([MDN, rol `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).

Обърни внимание **къде** стои `role="status"`: в `div`, който съществува винаги, дори когато няма известия. Онова, което се появява и изчезва, е вътрешният списък. Това не е прищявка: ръководството на MDN за ARIA live регионите обяснява, че помощните технологии като цяло оповестяват само **динамични** промени вътре в регион, който вече съществува, че е препоръчително празният регион да се създаде, преди да се напълни, и че най-надеждното е той да присъства още в началната HTML структура ([MDN, „ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Ако регионът се появяваше заедно с първото си известие, това известие можеше изобщо никога да не бъде оповестено. Бутонът „Descartar todos“ остава **извън** региона по същата логика в обратна посока: появата или изчезването му не е новост, която трябва да се оповестява гласово. А `aria-label` на всеки „Descartar“ казва кое известие се отхвърля, за да не чете екранният четец пет абсолютно еднакви бутона.

Две последици от този live регион, които е добре да се знаят, защото те не идват даром. Първата идва от подразбиращото се `aria-atomic="true"`: с него, когато регионът се промени, четецът го представя **изцяло**, дори да се е променила само една част ([MDN, „ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). При пет известия в лентата, шестото може да накара да се изчетат останалите пет, заедно с имената на техните бутони. Ако това пречи при тестване с екранен четец, `aria-atomic="false"` върху `div`-а прави така, че да се оповестява само новото; контролната точка в този урок си остава с поведението на ролята такова, каквото е. Втората е едно осъзнато решение: известията от ниво `error` също отиват в този „polite“ регион, който изчаква човекът да завърши текущото си действие, а не в `role="alert"`, която прекъсва. Резултатът от повторен опит не оправдава прекъсване; грешка, която пречи на по-нататъшната работа, би го оправдала.

С тази промяна `revisor` има две места с `role="status"`: това в лентата с известия и съобщението „Cargando…“ на страниците. Имай го предвид, ако някой ден търсиш елемент по неговата роля: `status`-ът на страницата вече не е само един.

#### 6.2.6 Изпращане на действие от мутацията

Производителят на известия е `useReintentar`, hook-ът на мутацията от урок 4:

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

Взима `despachar` с hook-а и го използва при двата възможни изхода от мутацията. В `onSuccess` сървърът е отговорил с новото състояние на услугата и известието казва какво е било то: `disponible`, с ниво `exito`, или `sigue en falla`, с ниво `error`. В `onError` заявката се е провалила и известието носи съобщението за грешка. Инвалидиранията от урок 4 си остават там, след известието. Hook-ът не чете никакво известие; той само изпраща. Това е онзи консуматор, за когото стана дума в 6.2.3: благодарение на двата контекста фактът, че пристигат нови известия, не го кара да се рисува отново.

Има едно свойство на тези функции за обратно извикване (callbacks), благодарение на което известието оцелява при смяна на страницата, и което си струва да се знае. TanStack Query прави разлика между callbacks, които се подават на `useMutation`, както тук, и онези, които се подават на `mutate()`: вторите **не се изпълняват**, ако компонентът се е демонтирал преди мутацията да приключи ([TanStack Query, „Mutations“](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)). Тези на `useMutation` са онези, които се използват за странични ефекти като инвалидиране на заявки, и затова бяха написани там още от урок 4. За известието последицата е точно тази, която сцената изискваше: човекът натиска „Volver a revisar“ и отива в списъка; мутацията приключва; известието се изпраща към лента, която се намира в оформлението, което никога не се е демонтирало.

И тъй като резултатът вече стига до лентата, страницата на услугата спира да изчертава своя собствена тревога (alert):

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

Единствената промяна спрямо урок 5 е онова, което липсва: блокът `{reintento.isError && <p role="alert">…</p>}`, който стоеше под бутона. Ако беше останал, грешката щеше да се оповестява два пъти — веднъж на страницата и веднъж в лентата, а тази на страницата щеше да умре при напускане. Един факт — едно място.

#### 6.2.7 Предпочитанията: същият модел, без reducer

Предпочитанията използват същата форма като известията (контекст с `null` по подразбиране, доставчик, hook, който хвърля грешка), с две разлики, които са осъзнати решения и е добре да се разберат. Типът и началните стойности:

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

Контекстът в своя файл:

```ts
// revisor/src/preferencias/contexto.ts
import { createContext } from "react";
import type { ValorPreferencias } from "./preferencias";

export const ContextoPreferencias = createContext<ValorPreferencias | null>(null);
```

Доставчикът:

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

**Първа разлика: `useState`, а не `useReducer`.** Има две полета за отмятане и единствената операция е „промени тези предпочитания“. Функция `cambiarPreferencias`, която приема `Partial<Preferencias>` и го обединява с формата с актуализираща функция от урок 2, решава това в три реда. Reducer с действие `cambiado` би бил същият код с повече церемонии. Документацията поставя критерия така: `useState` се чете отлично, когато обновленията са прости ([React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer)). Reducer-ът спечели своето място при известията заради тавана, брояча и трите различни начина за промяна на списъка, а тук няма нищо от това.

**Втора разлика: един-единствен контекст, с обект.** Стойността `value` е `{ preferencias, cambiarPreferencias }`, нов обект при всяко рисуване на доставчика, а `cambiarPreferencias` също е нова функция всеки път. Не е ли това проблемът от 6.2.3? Погледни кой чете този контекст: `PanelPreferencias`, който показва полетата за отмятане и също така ги променя, и `Descripcion`, който чете `mostrarDuracion`, плюс оформлението, което чете `compacto`. **Всички четат предпочитанията.** Няма консуматор, който само да пише, така че отделянето на изпращането не би спестило нито едно рисуване: когато предпочитанията се променят, всички така или иначе трябва да се нарисуват отново. А новият обект при всяко рисуване? `ProveedorPreferencias` се прерисува само когато се промени неговото собствено състояние, защото получава съдържанието си като `children`; а когато състоянието му се промени, новият обект е точно онова, за което искаме да се оповести. Няма никакво рисуване за мемоизиране.

Hook-ът, точно като този на известията:

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

Панелът с двете полета за отмятане, който живее в заглавната част:

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

Това са **контролирани** полета за отмятане: онова, което показват, идва от `preferencias`, и всяка промяна минава през `cambiarPreferencias`. Те се намират вътре във `fieldset` с `legend` — вградения HTML елемент за групиране на свързани контроли, който дава на екранния четец името на групата, „Preferencias“, преди всяко поле за отмятане. И всеки `input` е вътре в своя `label`, така че текстът на етикета е неговото име и кликването върху текста превключва отметката.

И дълбокият консуматор, причината за всичко това:

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

`usePreferencias()` се извиква в `Descripcion`, който е точно компонентът, изобразяващ продължителността, и в никой друг компонент от списъка. `ListaEstados`, `ContenidoReporte` и `PaginaReporte` не се промениха нито с един ред. Сравни го със сцената: същият резултат, без да се докосват трите файла по средата. А `FilaEstado` не промени своята сигнатура: продължава да получава `estado` и `tieneNota`, и нищо повече.

Към файла със стилове най-накрая се добавят правилата за лентата, групата за предпочитания и компактния изглед:

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

#### 6.2.8 Къде отиват доставчиците

Един доставчик обслужва само онова, което се намира **вътре** в него. Въпросът тогава е колко нагоре да бъде поставен. Оформлението се нуждае от предпочитанията (за класа `compacto`) и рисува лентата с известия (която се нуждае от известията). `PaginaServicio` се нуждае от изпращането на действия. И двете живеят вътре в рутера, така че доставчиците трябва да бъдат разположени **над** `RouterProvider`. Те се събират в един компонент:

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

Подредбата има своя причина. `QueryClientProvider` стои най-отвън, както в урок 4. Предпочитанията и известията са независими едни от други, така че техният относителен ред няма значение; важното е и двете да останат вътре в клиента за заявки и извън рутера. Клиентът за заявки се получава като свойство, вместо да се създава вътре, за да може онзи, който монтира приложението, да реши кой да използва. Един тест например би искал нов `QueryClient` за всеки отделен случай, без повторни опити, и с този компонент би могъл да преизползва абсолютно същите доставчици като истинското приложение. Ако утре се добави четвърти доставчик, той се добавя тук, и всичко, което използва `Proveedores`, го получава без промяна.

`main.tsx` използва `Proveedores` вместо предишния `QueryClientProvider`:

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

А оформлението изчертава панела с предпочитания в заглавната част, лентата за известия между заглавната част и съдържанието, и прилага класа `compacto`:

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

Лентата с известия е **извън** `<main>` и извън `Outlet`: тя не принадлежи на нито една страница, и затова никоя страница не я отнася със себе си при демонтирането си. Бележките остават точно там, където ги остави урок 5 — в `useState` на оформлението, и се спускат през `<Outlet context>`. Следващият раздел обяснява защо тяхното място е точно там.

### 6.3 Кое състояние къде живее

#### 6.3.1 Описът

С този урок `revisor` има състояние на пет различни места. Всяко има своята причина, и е полезно тя да може да се изкаже в едно изречение:

| Състояние | Къде живее | Защо точно там |
|---|---|---|
| чернова на бележка | **локално**: `useState` в `EditorNota` | има значение само за пишещия и се рестартира при смяна на услугата с `key={nombre}` |
| „Само неуспешни“ и търсен текст | **в адреса (URL)**: `?fallas=1&q=` | описват изгледа; споделят се чрез копиране на връзката и оцеляват при презареждане |
| услугата, която разглеждаш | **в адреса (URL)**: `/servicios/:nombre` | това е самата страница |
| списък с услуги и детайли | **на сървъра**: TanStack Query, `["reporte"]` и `["servicio", nombre]` | принадлежат на сървъра; екранът пази кеширано копие, което се обновява само |
| запазени бележки | **в оформлението**: `useState` в `Disposicion`, спускат се през `<Outlet context>` | използват се от две страници, списъка и детайла, и от никого извън страниците |
| известия | **в контекст**: `useReducer` в `ProveedorAvisos` | произвеждат се от страниците и се показват от оформлението; трябва да оцелеят при смяна на страницата |
| предпочитания | **в контекст**: `useState` в `ProveedorPreferencias` | променят се в заглавната част и се четат от ред пет нива по-надолу |

Правилото, което подрежда таблицата, е това от урок 2, само че с повече нива. Документацията на React го нарича поддържане на **единствен източник на истина (single source of truth)**: за всяка част от състоянието избираш компонента, който я „притежава“, и това не означава, че цялото състояние живее на едно място, а че всяка негова част живее в конкретен компонент ([React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components)). Това, което този урок добавя, са още две места за избор — адреса и сървъра вече ги имаше — и начин за взимане на решение.

#### 6.3.2 Въпросите по ред

Когато се появят нови данни, задай тези въпроси в следния ред и избери първия отговор, който е „да“:

1. **Може ли да се изчисли от друго състояние или от свойствата?** Тогава това не е състояние. Изчислява се при рисуване. Това е правилото от урок 2 („избягвай излишното състояние“, [React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure)); броят на неуспешните услуги в заглавието и филтрираният списък в отчета се изчисляват, а не се пазят.
2. **От сървъра ли е?** Тогава то живее на сървъра и екранът го изисква с TanStack Query. Копирането му в `useState` създава две истини, които губят синхрон.
3. **Описва ли онова, което човекът вижда, така че той да поиска да го сподели или презареди?** Тогава отива в URL адреса.
4. **Използва ли се само от един компонент?** Тогава е локално.
5. **Използва ли се от няколко компонента?** Качи го в най-близкия общ прародител и го предай през свойства. Ако общият прародител е оформлението, а онези, които го използват, са страници, каналът е `<Outlet context>`.
6. **Свойствата задължават ли преминаване през компоненти, които не ги ползват, и пренареждането с `children` не го ли решава без смесване на отговорности?** Тогава — контекст.

Контекстът е последният въпрос, а не първият. Не защото е лош, а защото той скрива най-много: компонент, който чете контекст, зависи от нещо, което не фигурира в неговата сигнатура. Документацията на React защитава свойствата именно затова: те правят ясно кой компонент какви данни използва ([React, „Passing Data Deeply with Context“](https://react.dev/learn/passing-data-deeply-with-context)).

#### 6.3.3 Защо бележките не минават в контекст

Това е очевидният въпрос в този урок. Бележките вече се качват до оформлението, вече се споделят от две страници, а сега контексти има навсякъде. Защо не един `ProveedorNotas` редом с останалите два? Прекарай бележките през шестте въпроса и отговорът излиза сам: те се спират на петия. Използват се от няколко компонента, да, но **всички те са страници**, а общият прародител на страниците е оформлението. Каналът вече съществува и е точно този, който рутерът предлага за тази цел: React Router представя `<Outlet context>` като вграденото решение за случая, когато родителски маршрут управлява състояние, което иска да сподели със своите дъщерни, и отбелязва, че би могъл да създадеш свой собствен контекст, но случаят е толкова чест, че той идва вграден вътре в `Outlet` ([React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext)).

Има още три причини, и те са напълно конкретни:

- **Обхватът е точният.** С `Outlet` бележките стигат единствено до страниците. Контекст, поставен в `Proveedores`, би ги направил видими за всичко: лентата за известия, панела с предпочитания, всеки бъдещ компонент. Никой извън страниците няма нужда от тях, а даването на по-голям обхват на дадени данни от нужния е покана някой да стане зависим от нея.
- **Консуматорите не са далеч.** `PaginaReporte` чете бележките и ги спуска до `ListaEstados`, който ги използва за изчисляване на `tieneNota`. По средата има само един компонент, `ContenidoReporte`, който ги получава и ги предава, без да ги използва. Една междинна стъпка не е сцената от началото на урока с три компонента, които само пренасят данни: това е точно случаят, в който документацията препоръчва свойства, защото те позволяват да се види кой компонент кои данни ползва.
- **Промяната, ако някой ден потрябва, е само в един файл.** Страниците не извикват `useOutletContext`: те извикват `useNotas()`, hook-а, който урок 5 написа според препоръката на React Router. Ако компонент, който не е страница (лентата с известия например), се случи да потрябва бележките, би се създал контекст, `useNotas()` би преминал към неговото четене и нито една страница не би се променила. Това е конкретният сигнал, който би променил решението: **консуматор извън `Outlet`**. Докато такъв не съществува, контекстът не решава никакъв проблем.

И едно откровено уточнение: нито `Outlet`, нито контекст решават проблема с това, че бележките се губят при презареждане. И двата варианта съхраняват данните в паметта на раздела на браузъра. Ако бележките трябваше да бъдат трайни, тяхното място щеше да е на сървъра (вторият въпрос), а тестовият API няма маршрут за това. Преместването на бележките в контекст не би ги приближило до това предназначение; просто би сменило кабела.

#### 6.3.4 А Redux кога?

README файлът на курса казва, че Redux не се преподава, и тази таблица обяснява защо той не е нужен: състоянието на сървъра, което в много приложения представлява най-голямата част от онова, което се поставяше в глобално хранилище, вече се управлява от TanStack Query; адресът съхранява изгледа; а онова малко, което остава споделено, са две малки части, всяка с reducer и контекст. Ръководството на React завършва точно така: можеш да имаш множество двойки контекст и reducer в своето приложение ([React, „Scaling Up with Reducer and Context“](https://react.dev/learn/scaling-up-with-reducer-and-context)). Библиотека за глобално състояние започва да има смисъл тогава, когато има много споделено клиентско състояние, което се променя често и се чете от много компоненти, всеки от които само от една малка част. Това е въпрос на собствена преценка, а не правило на React; а `revisor` е далеч от това положение.

#### 6.3.5 Пълният преглед

С всичко на мястото му прегледът използва два терминала, както в предишните уроци: `npm run servidor` в единия и `npm run build`, последван от `npm run preview` в другия. Компилирането завършва така:

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

Отвори `http://localhost:4173/`. Заглавната част съдържа сега групата за предпочитания, а отдолу — празната лента с известия. Ето какво предаде Chrome за тези две части:

```text
<header><h1>Revisor</h1><nav aria-label="Principal"><a aria-current="page" class="active" href="/" data-discover="true">Reporte</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header>
<section class="bandeja" aria-label="Avisos"><div role="status"></div></section>
```

Live регионът съществува, макар и празен, което е точно онова, което 6.2.5 изискваше. Кликни върху `pagos`, изчакай детайлите (тестовият сървър се бави секунда и половина нарочно) и натисни „Volver a revisar“. Лентата получава известието, което видя в началото на урока. Сега натисни „Volver al reporte“: страницата на услугата се демонтира, списъкът се монтира, а известието **продължава да е там**, като `pagos` вече е отбелязана като достъпна в списъка:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200, 42 ms)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200, 95 ms)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200, 118 ms)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

Размаркирай „Mostrar duración“. Достъпните редове губят милисекундите и нищо друго не се променя:

```text
<ul><li class="disponible"><a href="/servicios/cat%C3%A1logo" data-discover="true">catálogo</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/pagos" data-discover="true">pagos</a>: disponible (HTTP 200)</li><li class="disponible"><a href="/servicios/inventario" data-discover="true">inventario</a>: disponible (HTTP 200)</li><li class="falla"><a href="/servicios/reportes" data-discover="true">reportes</a>: falla (tiempo límite agotado)</li></ul>
```

А бутонът „Descartar“ оставя лентата както в началото: `<div role="status"></div>`, празна, но присъстваща. Логът на тестовия сървър записа целия този път:

```text
08:37:54.148 GET /api/estados 200
08:37:57.289 GET /api/servicios/pagos 200
08:37:58.601 POST /api/servicios/pagos/reintento 200
08:37:59.809 GET /api/servicios/pagos cancelada por el cliente
08:38:00.110 GET /api/estados 200
```

Прочети го от горе до долу, защото той разказва история, която потвърждава две неща от този урок. `POST` е мутацията. Последващият `GET` на детайла е инвалидирането на `["servicio", "pagos"]`, което прави `useReintentar` в своя `onSuccess`, и той остана със статус **отказан (cancelada por el cliente)**: сървърът се бави секунда и половина, за да върне детайлите за `pagos`, а преди това човекът вече се беше върнал в списъка, страницата с детайлите се беше демонтирала и TanStack Query отказа заявката, която никой вече не чакаше: когато дадена заявка остане неактивна, докато се изтегля, нейният `signal` се прекъсва (abort), и тъй като `consultaDetalle` предава този `signal` на `fetch`, заявката се прекъсва ([TanStack Query, „Query Cancellation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)). Важното е онова, което не се случи: известието не изчака тази заявка. То стигна до лентата преди човекът да напусне страницата, защото `useReintentar` изпраща действието **първо**, а чака инвалидиранията **след това**. Ако редът беше обратен, известието щеше да се забави толкова, колкото отнема най-бавното презареждане. Последният `GET /api/estados` е списъкът, който беше поискан отново при монтирането си, защото инвалидирането го беше маркирало като остарял. И има само един-единствен `GET /api/estados` при отваряне на страницата: продукционната компилация (*production build*) няма допълнителния цикъл на `StrictMode`.

## Грешката, която ще видиш

Този урок има две основни грешки — тази за липсващ доставчик и предупреждението на React, което се появява, когато reducer модифицира състоянието, както и две спомагателни, които дава компилаторът.

**Основната грешка: hook за контекст без неговия доставчик.** Вече я видя във фигура 2, в тестови DOM. В приложение тя се предизвиква чрез преместване на компонент извън неговия доставчик или чрез монтирането му самостоятелно в тест. Съобщението е онова, което написа в hook-а:

```text
useAvisos necesita un <ProveedorAvisos> más arriba en el árbol
```

Чете се така: компонентът, който е извикал `useAvisos`, няма никакъв `ProveedorAvisos` сред своите предшественици. Решението никога не е да се премахне проверката, нито да се даде стойност по подразбиране на контекста: то е да се постави доставчикът там, където му е мястото — над компонента. Ако грешката се появи в тест, монтирай с `Proveedores`, който съществува точно за тази цел. А ако се появи **без** съобщение, като екран, който показва „0 avisos“ и не реагира, се усъмни в контекст със стойност по подразбиране, която се преструва, че работи (версия A от фигура 2).

**Двете спомагателни грешки: модифициране на състоянието и пропускане на действие.** Тази фигура представлява reducer-ът на известията с две нарочни промени: към обединението се добавя четвърто действие, `fijado`, без неговия `case`; а `agregado` прави `push` върху списъка, който е получил, вместо да създаде нов.

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

Първата, `TS2339`, казва, че `push` не съществува в `readonly Aviso[]`. Това е модификаторът `readonly` на типа, който си върши работата: списък само за четене няма модифициращи методи — нито `push`, нито `splice`, нито `sort`. Без този `readonly` кодът щеше да се компилира и грешката щеше да е по-лоша, защото щеше да пристигне без никакво предупреждение от компилатора. Онова, което се случва тогава, е следващата грешка.

**Грешката на React: две известия с еднакъв ключ.** За да се види това, трябва умишлено да се прескочи `readonly`. В копие на контролната точка `case "agregado"` от `avisos.ts` беше променен на `(estado.avisos as Aviso[]).push(nuevo); return { ...estado, siguienteId: estado.siguienteId + 1 };`. Чрез `as` казваме на TypeScript „довери ми се“, и той се компилира. С това копие в `npm run dev`, на страницата за `pagos`, едно-единствено кликване върху „Volver a revisar“ остави следното в лентата:

```text
<section class="bandeja" aria-label="Avisos"><div role="status"><ul><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li><li class="aviso-exito">pagos se volvió a revisar: disponible <button type="button" aria-label="Descartar: pagos se volvió a revisar: disponible">Descartar</button></li></ul></div><button type="button">Descartar todos</button></section>
```

А в конзолата на браузъра се появи тази грешка от React (съобщението идва с `%s`, което конзолата замества с единицата `1`, пътуваща отделно; тук е показано вече заместено):

```text
Encountered two children with the same key, `1`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Едно кликване, едно изпратено действие и две известия на екрана с един и същ идентификатор. Причината е двойното извикване от 6.1.3. В `StrictMode` React извиква reducer-а **два пъти с едно и също състояние** и запазва един от двата резултата ([React, `useReducer`](https://react.dev/reference/react/useReducer)). При чист reducer това не се забелязва: двата резултата са напълно еднакви и единият просто се отхвърля. С `push` обаче всяко извикване модифицира **един и същ масив** — онзи, който се намираше в състоянието, така че известието влезе вътре два пъти, с еднакъв `id`, защото и двете извиквания прочетоха едно и също `siguienteId`. React го засича, виждайки два наследника с един и същ `key`. Има и още една щета, която не се вижда веднага: първият `push` засегна `estadoInicialAvisos` — обекта на ниво модул, който служи за начална отправна точка, и го остави замърсен за всеки друг, който би го използвал отново. А в компилираната версия, без `StrictMode`, дубликатът нямаше да се появи: дефектът все пак щеше да съществува, само че без предупреждението, което го издава. Документацията на `useReducer` е категорична: състоянието е само за четене, не модифицирай обекти или масиви в състоянието ([React, `useReducer`](https://react.dev/reference/react/useReducer)). Правилният подход е този от контролната точка: нов списък с `[nuevo, ...estado.avisos]`. А поуката е двойна: `readonly` го хваща преди стартиране, а `StrictMode` го хваща по време на изпълнение, ако някой заобиколи `readonly`.

Втората грешка, `TS2322`, е изчерпателната проверка от 6.1.3, която изпълнява своето обещание: типът `fijado` стигна до `default` и не може да бъде присвоен на `never`. Съобщението посочва липсващото действие и реда от `switch`. Решението е да се напише неговият `case`. Забележи, че грешката не е там, където си добавил действието, а там, където си **забравил** да го обслужиш: точно това е ценното.

## Какво се прави погрешно

**Да вкарваш всичко в контекст „за всеки случай“.** Всеки контекст е зависимост, която не се вижда в сигнатурата на компонента. Ако дадени данни се използват от два съседни компонента, предай ги през свойства. Контекстът печели своето място тогава, когато свойствата преминават през компоненти, които не използват данните, а `children` не решава проблема.

**Един-единствен контекст с `{ estado, despachar }`, когато има компоненти, които само изпращат действия.** Всяка промяна на състоянието прерисува всички, които четат контекста, включително онези, които никога не изобразяват състоянието. Фигура 3 го измери: четири рисувания срещу едно. Разделяй на два контекста.

**Стойност по подразбиране, която „работи“.** Празен списък и функция, която не прави нищо, превръщат забравен доставчик в екран, който лъже без грешка. Използвай `null` и hook, който хвърля грешка.

**Странични ефекти вътре в reducer-а.** Извикване на `fetch`, `setTimeout`, `console.log`, който взима решения, или брояч извън функцията. Reducer-ът се извиква два пъти в `StrictMode` и трябва винаги да дава един и същ резултат за един и същ вход. Онова, което трябва да се случи извън React, отива в обработчик на събития или, ако е синхронизация — в Effect (упражнение 3 прави точно това).

**Действия, които дават заповеди.** `{ tipo: "establecer-lista", avisos: [...] }` превръща reducer-а в прикрит `useState`: логиката отново остава разпръсната в онзи, който изпраща действието. Действията описват какво се е случило; правилата живеят в reducer-а.

**Мутиране на състоянието.** Ако направиш `estado.avisos.push(nuevo)` и върнеш същото `estado`, React сравнява с `Object.is`, решава, че нищо не се е променило, и не рисува. Ако върнеш нов обект с модифицирания масив вътре, рисува, но двойното извикване на `StrictMode` вкарва известието два пъти с еднакъв ключ, както видя в „Грешката, която ще видиш“. С `readonly` в типовете TypeScript не ти позволява да направиш това.

**Изобразяване на един и същ факт на две места.** Ако грешката от повторния опит излиза и на страницата, и в лентата за известия, тя се оповестява два пъти и едното от двете съобщения умира при навигация. Един факт — едно място.

**Създаване на live региона заедно с неговото съдържание.** Написването на `{avisos.length > 0 && <div role="status">…</div>}` кара региона да се появи с вече поставено първо известие вътре, и това известие може да не бъде оповестено от екранния четец. Регионът съществува винаги; онова, което се променя, е неговото съдържание.

**Мемоизиране на стойността на контекста по навик.** `useMemo` и `useCallback` са инструменти със своя цена. Преди да ги използваш, измери: в `revisor` разделянето на състоянието и изпращането реши онова, което трябваше да се реши, а доставчикът на предпочитания няма никакви излишни прерисувания за пестене.

## Упражнения

### Упражнение 1 — Предвиди поведението на reducer-а

Без да пускаш нищо, предвиди какво ще отпечата първият ред от фигура 1, ако вместо шест букви подадеш седем (`"a"` до `"g"`), и какво ще стане, ако след това изпратиш `{ tipo: "descartado", id: 1 }`. Променя ли се `siguienteId`? Връща ли reducer-ът същия обект, който е получил? Провери предположенията си, като промениш фигурата и я изпълниш.

### Упражнение 2 — Ново действие, водено от компилатора

Добави към известията действие, което отхвърля всички известия от дадено ниво: `{ tipo: "nivel-descartado", nivel: NivelAviso }`. Направи го в твоето копие `avisos.ts` от фигурите. **Първо** добави само новия член към обединението и пусни `tsc`: предвиди кой ред ще посочи той. След това напиши съответния `case` и провери чрез вариант на фигура 1, че при три успешни известия и две за грешка, отхвърлянето на нивото `error` оставя трите успешни.

### Упражнение 3 — Известия, които изчезват сами

Направи така, че всяко известие за **успех** да се отхвърля само след пет секунди; тези за грешка да остават, докато човекът не ги отхвърли ръчно. **Преди да пишеш код**, реши къде трябва да стои таймерът: в reducer-а, в `useReintentar` или в лентата с известия? Запиши в своя [дневник](bitacora.md) защо. Решението не бива да заглушава линтера, а таймерът трябва да се отменя, ако човекът отхвърли известието преждевременно.

### Упражнение 4 — Още една колона в таблицата

Без да гледаш 6.3.1, къде би поставил всяка от тези нови данни и защо: (а) тъмният режим на екрана; (б) коя услуга държи фокуса на клавиатурата в списъка; (в) името на влезлия потребител, което се използва в заглавната част и във формуляра за създаване; (г) предпочитанията от 6.2.7, ако искахме те да оцеляват при презареждане; (д) броят на непрочетените известия, за да се показва в заглавието на раздела на браузъра.

## Решения

### Решение 1

При седем букви остават пет известия, от 7 до 3: `[7:g, 6:f, 5:e, 4:d, 3:c] siguienteId=8`. Двете най-стари отпадат заради тавана. Ако след това отхвърлиш идентификатор 1, reducer-ът не намира нищо за премахване и списъкът остава същият, със `siguienteId` на стойност 8: отхвърлянето никога не движи брояча. Връща ли същия обект? **Не**: `{ ...estado, avisos: estado.avisos.filter(…) }` създава винаги нов обект и нов списък, дори те да имат същото съдържание. Това е правилно (reducer-ът не е мутирал нищо), но означава, че React ще прерисува лентата, въпреки че нищо видимо не се е променило, тъй като `Object.is` сравнява идентичности, а не съдържание. Ако някой ден измерване покаже, че това има значение, поправката би била да се върне `estado` както си е, когато даденото `id` не съществува. Днес няма никакво измерване, което да го изисква. За да се увериш, сравни с `===` във фигурата: `console.log(reducirAvisos(conSiete, { tipo: "descartado", id: 1 }) === conSiete)` отпечатва `false`.

### Решение 2

При добавяне само на новия член към обединението, `tsc` посочва реда с `const sinAtender: never = accion;` с грешка `TS2322`, която назовава новия тип, точно както във фигура 4. Липсващият `case`:

```ts
// avisos.ts con la acción nueva (fragmento)
    case "nivel-descartado":
      return { ...estado, avisos: estado.avisos.filter((aviso) => aviso.nivel !== accion.nivel) };
```

Вътре в този `case` TypeScript вече знае, че `accion` е вариантът с `nivel`, така че `accion.nivel` се компилира без никакво `as`. Проверката: с три действия `agregado` с ниво `exito` и две с ниво `error`, състоянието съдържа пет известия; след `{ tipo: "nivel-descartado", nivel: "error" }` остават трите успешни известия, с техните идентификатори непокътнати и `siguienteId` на 6. Обърни внимание на името: `nivel-descartado` описва какво е направил човекът, а не „филтрирай списъка“.

### Решение 3

Таймерът **не** се слага в reducer-а: един `setTimeout` е страничен ефект, а reducer-ът трябва да бъде чист (6.1.3). Не отива и в `useReintentar`, защото таймерът трябва да живее толкова, колкото живее известието, а известието живее в лентата за известия, а не в страницата, която го е произвела. Той отива в лентата и представлява легитимен Effect по смисъла на урок 3: **синхронизира** всяко видимо известие с таймер, който е външна система спрямо React. Най-чистият начин е да се даде на всяко известие собствен компонент, така че неговият Effect да започва при появата му и да се почиства при изчезването му:

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

А в `BandejaAvisos` `map`-ът изрисува `<FilaAviso key={aviso.id} aviso={aviso} />`. Три неща, на които си струва да се обърне внимание. Зависимостите изброяват всичко, което Effect-ът използва, включително `despachar`; документацията на `useReducer` уточнява, че тъй като неговата идентичност е стабилна, включването му няма да доведе до повторно изпълнение на Effect-а ([React, `useReducer`](https://react.dev/reference/react/useReducer)), така че няма никаква причина той да се маха и да се заглушава линтерът. Ако човекът отхвърли известието преди изтичането на петте секунди, редът се демонтира, функцията за почистване отменя таймера и нищо излишно не се изпраща (а дори и да се изпрати, `descartado` върху вече отсъстващ `id` не чупи нищо, както видя в решение 1). А при `StrictMode` таймерът се създава, отменя и създава отново при монтиране: безплатният тест от урок 0, доказващ, че почистването работи. Този фрагмент беше проверен с линтера на курса върху копие на лентата и не даде никакво предупреждение.

Предупреждение за достъпност: известие, което изчезва само, представлява ограничение във времето по смисъла на указанията WCAG, които смятат за такова всеки процес, който протича без иницииране от човека след фиксиран интервал от време ([W3C, „Understanding SC 2.2.1: Timing Adjustable“](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)). Тук това е допустимо, защото резултатът се вижда и в самия списък, и именно затова само успешните изчезват сами. Ако известието беше единственият начин да се научи нещо, пет секунди не са достатъчни за всички хора: не го прави, или остави възможност потребителят да го изключи.

### Решение 4

(а) **Тъмен режим**: контекст, също както предпочитанията, и по същата причина: променя се от една контрола и се чете от компоненти навсякъде; това е първият пример, който документацията на React дава за контекст. (б) **Фокус на клавиатурата**: в никакво твое състояние; фокусът се управлява от браузъра и пазенето му в React създава две истини. Ако компонент трябва да премести фокуса, той използва референция (`ref`) към елемента, а не състояние. (в) **Влезлият потребител**: контекст, и това е вторият пример от документацията; но самите данни идват от сървъра, така че правилното е заявка с TanStack Query (която вече е достъпна от всеки компонент с `useQuery`), и може би дори няма нужда от собствен контекст. (г) **Предпочитания, които оцеляват при презареждане**: контекстът си остава като проводник, но стойността трябва да се съхранява извън паметта на браузърния раздел: в хранилището на браузъра (`localStorage`), ако са специфични за тази машина, или на сървъра, ако трябва да следват потребителя на друг компютър. Четенето и писането в това хранилище е синхронизиране с външен източник, и доставчикът е онзи, който би трябвало да го прави. (д) **Непрочетени известия в заглавието**: **не е състояние**. Изчислява се от известията, които вече са в контекста (първият въпрос от 6.3.2), а записването му в `document.title` е работа на `useTituloDocumento` — Effect-ът от урок 3.

## Как разбирам, че съм успял

- [ ] `npm ci`, `npm run lint` и `npm run build` завършват без грешка вътре в `~/curso-react/revisor/`, а `npm run build` произвежда `dist/assets/index-DBIHM1Pv.js`, ако твоят код е идентичен с този на контролната точка.
- [ ] `grep -rn "eslint-disable" src/` не намира нищо.
- [ ] Фигура 1 отпечатва `seis agregados: [6:f, 5:e, 4:d, 3:c, 2:b] siguienteId=7` и завършва с трите реда, доказващи, че reducer-ът не е модифицирал полученото.
- [ ] В копие с `push` и стартирано `npm run dev`, кликване върху „Volver a revisar“ оставя две еднакви известия и грешката `Encountered two children with the same key` в конзолата, и можеш да обясниш защо я предизвиква `StrictMode`.
- [ ] Можеш да предизвикаш двете грешки от фигура 4 в копие на reducer-а и да обясниш всяка от тях: `TS2339` за модифициране на списък `readonly` и `TS2322` за действие, което попада в `default`.
- [ ] Фигура 3 показва бутона, нарисуван 4 пъти при един контекст и 1 път при два, и можеш да обясниш защо лентата се рисува 4 пъти и в двата случая.
- [ ] Фигура 2 показва „0 avisos“ без никаква грешка във версия A и съобщението от hook-а във версия B, и можеш да кажеш защо B е за предпочитане.
- [ ] При работещи тестов сървър и `npm run preview`, страницата `/` показва в заглавната си част полетата за отмятане „Mostrar duración“ (маркирано) и „Vista compacta“, а под тях празна лента за известия с `role="status"`.
- [ ] В `/servicios/pagos`, бутонът „Volver a revisar“ оставя в лентата `pagos se volvió a revisar: disponible`, и известието остава там след връщане към списъка с „Volver al reporte“.
- [ ] При размаркиране на „Mostrar duración“, достъпните редове губят милисекундите, без `ListaEstados`, `ContenidoReporte` или `PaginaReporte` да са се променили.
- [ ] Можеш да възпроизведеш таблицата от 6.3.1 по памет, с обосновка за всеки ред, и да кажеш какво би трябвало да се случи, за да преминат бележките в контекст.
- [ ] Записа в своя [дневник](bitacora.md) къде живее всяко състояние от твоя `revisor` и защо избра точно това място за таймера от упражнение 3.

## Обобщение

Отговори, без да гледаш урока:

1. Защо reducer се нарича така и какво общо има с `Array.prototype.reduce`?
2. Какво описва едно действие? Защо `agregado`, а не `recortar-a-cinco`?
3. Какво прави `default` с `never` в reducer-а и в кой момент ти помага?
4. Защо reducer-ът пази `siguienteId` в състоянието, вместо да използва брояч извън функцията?
5. Кои две неща си струва да се опитат преди въвеждането на контекст? Защо нито едно от двете не върши работа за предпочитанията в `revisor`?
6. Защо известията използват два контекста, а предпочитанията — само един?
7. Какво се случва, ако компонент чете контекст без доставчик, със стойност по подразбиране `null` и без нея? Защо hook-ът хвърля грешка?
8. Защо `role="status"` на лентата за известия съществува, дори когато няма известия?
9. Защо бележките продължават да са в оформлението, а не в контекст? Какво би трябвало да се случи, за да се промени това?

## За допълнително четене

- [React, „Extracting State Logic into a Reducer“](https://react.dev/learn/extracting-state-logic-into-a-reducer): действия, описващи какво е направил потребителят, чисти reducer-и, произход на името и сравнение с `useState`. Посетено на 21 октомври 2026 г.
- [React, `useReducer`](https://react.dev/reference/react/useReducer): сигнатурата, двойното извикване на reducer-а в `StrictMode`, състоянието само за четене, сравнението с `Object.is` и стабилната идентичност на `dispatch`. Посетено на 21 октомври 2026 г.
- [React, „Passing Data Deeply with Context“](https://react.dev/learn/passing-data-deeply-with-context): двете алтернативи преди контекста, предупреждението за прекомерната му употреба и случаите на използване (тема, профил, маршрутизация, състояние). Посетено на 21 октомври 2026 г.
- [React, `createContext`](https://react.dev/reference/react/createContext): стойността по подразбиране като резервна стойност „в краен случай“, `<Contexto>` като доставчик от React 19 насам и контекстите в отделен файл. Посетено на 21 октомври 2026 г.
- [React, `useContext`](https://react.dev/reference/react/useContext): най-близкият доставчик нагоре, прерисуването на консуматорите, сравнено с `Object.is`, оптимизацията с `useMemo` и случаят със забравен `value`. Посетено на 21 октомври 2026 г.
- [React, „Scaling Up with Reducer and Context“](https://react.dev/learn/scaling-up-with-reducer-and-context): два контекста (състояние и изпращане), собствените hook-ове и доставчикът, който обединява всичко. Посетено на 21 октомври 2026 г.
- [React, „React v19“](https://react.dev/blog/2024/12/05/react-19): `<Context>` като доставчик и планът за оттегляне на `<Context.Provider>`. Посетено на 21 октомври 2026 г.
- [React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components): издигане на състоянието до общ предшественик и единствен източник на истина. Посетено на 21 октомври 2026 г.
- [React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure): принципите за структура на състоянието, сред които и да не се пази онова, което може да бъде изчислено. Посетено на 21 октомври 2026 г.
- [React Router, `useOutletContext`](https://reactrouter.com/api/hooks/useOutletContext): състоянието на родителски маршрут, споделено с неговите дъщерни, и препоръчаният собствен hook с TypeScript. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Mutations“](https://tanstack.com/query/latest/docs/framework/react/guides/mutations): `onSuccess`, `onError` и разликата между callbacks на `useMutation` и тези на `mutate`, когато компонентът се демонтира. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Cancellation“](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation): сигналът `signal`, който се прекъсва, когато заявка стане неактивна по време на извличане. Посетено на 21 октомври 2026 г.
- [TypeScript, „Narrowing“](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): типът `never` и изчерпателната проверка в `switch`. Посетено на 21 октомври 2026 г.
- [MDN, роля `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) и [„ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): live регионът за известия, с подразбиращи се `aria-live="polite"` и `aria-atomic="true"`; какво прави `aria-atomic` и защо регионът трябва да съществува, преди да бъде запълнен. Посетено на 21 октомври 2026 г.
- [W3C, „Understanding SC 2.2.1: Timing Adjustable“](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html): какво се счита за ограничение във времето и кога е необходимо да може да се регулира. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| reducer | чиста функция, която получава текущото състояние и действие и връща следващото състояние |
| действие (action) | обект, който описва какво се е случило (`{ tipo: "descartado", id: 3 }`); reducer-ът решава каква последица има това |
| изпращане (*dispatch*) | функцията, която връща `useReducer`, за да ѝ бъде подадено действие; идентичността ѝ е стабилна между прерисуванията |
| изчерпателна проверка | блокът `default`, който присвоява действието на `never`, за да предупреди TypeScript, ако дадено действие остане необработено |
| контекст | канал в React за предаване на стойност до всеки вътрешен компонент, без преминаване през свойства (props) |
| доставчик (provider) | компонентът, който поставя стойност в даден контекст за всичко, намиращо се вътре в него: `<Contexto value={…}>` |
| стойност по подразбиране | онова, което получава четящият контекста, ако няма никакъв доставчик над него; в този курс — `null` |
| консуматор (consumer) | компонент, който чете контекст; прерисува се, когато стойността `value` на неговия доставчик се промени |
| ARIA live регион (live region) | част от страницата, чиито промени се оповестяват от екранен четец; `role="status"` е „polite“ регионът, който не прекъсва |
| единствен източник на истина | всяка част от състоянието живее на едно-единствено място, а останалите я четат оттам |

---

**Следващ:** [Урок 7 — Формуляри, действия и достъпност](07-formularios-accesibilidad.md)
