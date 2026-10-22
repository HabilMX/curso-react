# Урок 2 — Състояние: моментна снимка, неизменяемост и структура

*18:05 ч. е, а нощното дежурство започва в 18:30. Преди да тръгнеш, искаш да оставиш на колежката си бележка в `revisor`: „pagos: доставчикът казва, че ще се върне в 20:00, не ескалирай“. Избираш `pagos`, пишеш бележката, записваш я… и редът не се променя. Преминаваш наум през това, което направи: кодът добавя бележката към обекта с бележки и го записва отново в състоянието. Бележката е там, в паметта; конзолата го потвърждава. Но екранът не разбира. Десет секунди по-късно пристига следващото периодично запитване, таблото се рисува отново и изведнъж отметката „с бележка“ се появява, сякаш някой я е сложил не навреме. А когато избереш `reportes`, текстовото поле все още казва „pagos: доставчикът казва, че ще се върне…“. Ако колежката ти запише, без да прочете, бележката за `pagos` ще се окаже залепена за `reportes`. Остават двайсет и пет минути. Двете повреди идват от една и съща грешка: да мислиш за състоянието на React като за променлива, която се променя. То не е такова: то е снимка, която се заменя, и React я пази на точно определено място в дървото. Този урок обяснява това изречение и го превръща в код.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 2.3 и 2.4)

**Какво изграждаш:** филтъра „Solo fallas“, избора на услуга с нейните детайли и бележка за всяка услуга, с чернова, която не се пренася от една услуга в друга

**Какво научаваш:** състоянието е снимка за всяко рисуване; формата с функция за обновяване `establecerN((n) => n + 1)`; копиране вместо мутиране; петте правила за структурата на състоянието (сред тях: един `tipo`, а не три флага, пазене на идентификатора, а не на обекта, и непазене на това, което може да се изчисли); повдигане на състоянието; `key` за нулирането му

**Откъде идваш.** От [Урок 1](01-componentes-puros-composicion.md). Твоят `revisor` вече е разделен на чисти части: `Tarjeta` получава заглавие и своите `children`; `ResumenFallas` изрисува „4 servicios revisados · 2 servicios con falla“ с чисти функции от `resumen.ts`; `ContenidoReporte` решава какво да рисува според зареждането; `ListaEstados` обхожда състоянията с `key={estado.nombre}`; а `FilaEstado` рисува един ред. `Panel` само композира. Единственото, което се променя с времето, е това, което носи `useReporte` — hook-ът от урок 0, който иска `GET /api/estados` на всеки десет секунди. До днес човекът, който гледа таблото, не може да прави нищо с него освен да натисне „Actualizar“. Днес таблото започва да помни това, което този човек прави.

**Какво не прави този урок.** Не носи нови данни от API: детайлите на услуга се сглобяват от това, което вече е пристигнало в отчета, а искането от API на детайлите на една-единствена услуга е темата на [Урок 3](03-effects-sincronizar.md), с неговата надпревара между отговорите. Бележките живеят в паметта: ако презаредиш страницата, се губят, и засега това е наред. Филтърът и изборът също не пътуват в адреса на страницата; това един филтър да може да се сподели чрез копиране на връзката е [Урок 5](05-rutas-url-como-estado.md). Няма контекст, нито reducer — те са в [Урок 6](06-reducer-contexto.md), — нито формуляри с `action`, които са в [Урок 7](07-formularios-accesibilidad.md). И няма нито един нов Effect: целият урок се решава с `useState`, изчисления по време на рисуването и една `key`.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` на този урок (React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 за `tsc`, ESLint 10.13.0 и `eslint-plugin-react-hooks` 7.1.1). Тъй като курсът предполага Linux Mint, тази контролна точка беше инсталирана наново от нулата в контейнер `node:24.22.0-bookworm` и даде същото име на файл в `dist/`, което се вижда тук, `index-7jh0TEYR.js`; не беше изпълнено на истински Linux Mint, но нищо от показаното не зависи от операционната система, с изключение на предупреждението за `fsevents`, което следва. Под macOS `npm ci` отпечатва освен това предупреждение от `install-scripts`: то се отнася до `fsevents`, незадължителен пакет, който се инсталира само на macOS и в твоя Mint не се появява; няма нужда да се одобрява. Фигурите се изпълняват в `~/curso-react/figuras/`, същата папка като в предишните уроци; техният `package.json` не се променя. Компилират се с `tsc` и се изпълняват с `node` върху тестов DOM (jsdom), както в урок 0. Това, което се вижда „в браузъра“, беше измерено с Chrome без графичен интерфейс (`--headless`), управляван от скрипт, който натиска бутони и чете страницата през протокола за дебъгване на Chrome: това е истински браузър, който изпълнява JavaScript-а от `dist/`, а не симулация. Скриптът е до фигурите, в `medir.mjs`, и първият му коментар казва как да се изпълни. Нужен му е Google Chrome или Chromium, които Linux Mint не инсталира по подразбиране; ако нямаш такъв, не ти е нужен, за да следваш урока: направи същите стъпки ръчно в браузъра си и би трябвало да видиш същото. Изходите от всяко измерване и от всяка предизвикана грешка, с точните промени на всяко копие, са в [`programas/02-estado-instantanea-forma/ejercicios/`](../programas/02-estado-instantanea-forma/ejercicios). Дългите пътища, които отпечатват ESLint и `tsc`, се показват спрямо `~/curso-react`, а в един изход на ESLint бяха съкратени интервалите, с които форматерът подравнява колоната с правилото. Грешките от „Грешката, която ще видиш“ бяха предизвикани в копие на контролната точка, никога в оригинала, който след всичко това отново мина `npm ci`, `npm run lint` и `npm run build`. Програмите са в [`programas/02-estado-instantanea-forma/`](../programas/02-estado-instantanea-forma): `revisor/` е контролната точка, а фигурите са до нея.

## След урока ще можеш да

- Предвидиш стойността, която компонентът показва, след като функция `establecer…` е извикана няколко пъти в едно и също кликване, и да провериш предвиждането си с фигура.
- Напишеш обновяване с функция за обновяване, когато следващото състояние зависи от предишното, и да обясниш кога това дава различен резултат от подаването на стойността.
- Обновиш обект в състоянието чрез създаване на копие и да демонстрираш с фигура, че мутирането му и подаването му обратно не рисува нищо наново.
- Прегледаш състоянието на компонент с петте правила за структура и да посочиш в `revisor` пример за всяко от тях (един пример може да служи за две).
- Решиш в кой компонент живее всяко парче състояние, да го повдигнеш до общия предшественик и да подадеш надолу стойността и функцията, която я променя.
- Използваш `key`, за да започне един компонент от нулата, когато се промени това, което той представя, и да възпроизведеш грешката, която се появява, ако тя липсва.

## Защо, преди как

Отвори `revisor` от урок 1 и поискай от него три неща, които един оператор би поискал още първия ден.

**„Покажи ми само това, което е в повреда.“** С четири услуги не е нужно, но истинският `revisor` на една компания наблюдава десетки. Полето за отметка „Solo fallas“ трябва да помни дали е отметнато, и две различни части трябва да го знаят: самото поле, за да се нарисува отметнато, и списъкът, за да реши кои редове да рисува.

**„Искам да видя една услуга в детайли.“** Човекът избира `pagos` и се появява каре с нейното състояние. Десет секунди по-късно пристига следващото периодично запитване и `pagos` се е възстановила: карето трябва да казва „Disponible“, а не това, което казваше преди десет секунди. Това зависи от това **какво** пазиш, когато някой избира: цялата услуга или само името ѝ.

**„Остави ме да си отбележа нещо.“** По една бележка за всяка услуга, която да оцелява при смяна на услугата и връщане и която да отбелязва реда, за да я види следващата смяна. А докато пишеш — чернова, която да не се промъкне в бележката на друга услуга.

Трите искат едно и също: таблото да **помни** нещо между едно рисуване и следващото. В React това, което се помни, се нарича **състояние**, а инструментът е `useState`, който вече използва в урок 0 вътре в `useReporte`. Урок 9 на TypeScript те научи да го пишеш; този урок те учи да **мислиш** за него, защото почти всички грешки със състоянието идват от това да се мисли за него като за променлива. Променливата се променя и промяната се вижда на следващия ред. Състоянието — не: всяко рисуване получава фиксирана снимка, а искането за промяна не пипа тази снимка, а моли React да направи друга ([React, „State as a Snapshot“](https://react.dev/learn/state-as-a-snapshot)). Мисленето за състоянието като за променлива обяснява двете повреди от сцената, макар всяка по свой начин: бележката, която не се появява, идва от снимката (даде на React същата, ретуширана, и React не видя нищо ново), а черновата, която се пренася, идва от мястото, където React пази състоянието (запази това на редактора, защото за него на тази позиция все още стоеше същият редактор).

Понятията са три. Първото е **състоянието като снимка**, с функцията за обновяване (2.1). Второто е **състояние, което се копира и има структура**: копиране вместо мутиране (2.2) и петте правила за структурата на състоянието (2.3). Третото е **кой притежава състоянието и кога то се нулира**: повдигане на състоянието до компонента, който го споделя (2.4), и `key` за нулирането му (2.5). Раздел 2.6 не добавя понятие: това е пълното преминаване, в което трите се виждат заедно. Ето как изглежда резултатът, измерен с Chrome без графичен интерфейс върху контролната точка, при избор на `pagos`, записване на бележка и смяна на услугата (това са стъпки 3 до 6 от преминаването в 2.6):

```text
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
```

В края на урока ще знаеш откъде идва всеки ред и защо последният казва това, което казва.

## Понятията

### 2.1 Състоянието е снимка

#### 2.1.1 Какво става, когато извикаш `establecer…`

Когато напишеш `const [revisiones, establecerRevisiones] = useState(0)`, React ти дава две неща: стойността, която пази **за това рисуване**, и функция, с която да поискаш друга. Важното е в думата „да поискаш“. Документацията на React го казва така: състоянието се държи като снимка; промяната му не променя променливата, която вече имаш, а предизвиква ново рисуване ([React, „State as a Snapshot“](https://react.dev/learn/state-as-a-snapshot)). А в справочника на `useState` — изрично: функцията `set` обновява променливата на състоянието само **за следващото рисуване** ([React, `useState`](https://react.dev/reference/react/useState)).

Първата фигура проверява това с най-простото, което има: бутон, който при едно кликване извиква три пъти функцията, добавяща една проверка. Има две версии. Първата подава на React стойността, `revisiones + 1`; втората му подава функция, `(actual) => actual + 1`. И двете отпечатват вътре в кликването колко е `revisiones`, а фигурата прочита какво казва бутонът накрая.

```tsx
// fig02_01.tsx
import { JSDOM } from "jsdom";
import { act, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ConValor() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    establecerRevisiones(revisiones + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

function ConActualizadora() {
  const [revisiones, establecerRevisiones] = useState(0);

  function revisarTres(): void {
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones((actual) => actual + 1);
    console.log(`  dentro del clic, revisiones vale ${revisiones}`);
  }

  return (
    <button type="button" onClick={revisarTres}>
      {revisiones}
    </button>
  );
}

async function hacerClic(titulo: string, Componente: ComponentType): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => {
    raiz.render(<Componente />);
  });

  const boton = contenedor.querySelector("button");
  await act(async () => {
    boton?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });

  console.log(`  después del clic, el botón dice ${boton?.textContent}`);
  await act(async () => {
    raiz.unmount();
  });
}

await hacerClic("con el valor (revisiones + 1, tres veces):", ConValor);
await hacerClic("con la forma actualizadora (actual => actual + 1, tres veces):", ConActualizadora);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_01.tsx
$ node fig02_01.js
con el valor (revisiones + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

Преди да прочетеш обяснението, погледни двата реда, които казват „вътре в кликването“: и в двете версии `revisiones` е `0`, макар `establecerRevisiones` вече да е извикана три пъти. Това е снимката. Обработчикът на кликването е функция, създадена по време на рисуването, в което `revisiones` беше `0`, и за тази функция `revisiones` е `0` завинаги, като константа. React не пренаписва твоите променливи; това, което прави, е да извика отново компонента ти, а в това ново извикване `useState` връща новата стойност. Документацията го обобщава в едно правило: **стойността на променлива на състоянието никога не се променя в рамките на едно рисуване**, дори кодът на обработчика да е асинхронен ([React, „State as a Snapshot“](https://react.dev/learn/state-as-a-snapshot)).

С това първата версия се обяснява сама. Трите извиквания казват едно и също: „при следващото рисуване `revisiones` е `0 + 1`“. Три пъти `1` е `1`. Бутонът казва `1`, а не `3`. Това е точно примерът, който използва документацията на React със своя бутон „+3“ ([React, „State as a Snapshot“](https://react.dev/learn/state-as-a-snapshot)).

#### 2.1.2 Опашката от обновявания и функцията за обновяване

Защо бутонът не беше нарисуван три пъти, по веднъж за всяко извикване? Защото React **изчаква целият код на обработчика да завърши**, преди да обработи обновяванията на състоянието. Това се нарича **групиране** (*batching*) и то предотвратява излишни рисувания и наполовина обновени екрани ([React, „Queueing a Series of State Updates“](https://react.dev/learn/queueing-a-series-of-state-updates)). Докато обработчикът работи, всяко извикване на `establecer…` се нарежда на опашка. Когато той приключи, React обхожда опашката подред, за да изчисли стойността за следващото рисуване.

Тук влиза втората версия. Ако вместо стойност подадеш **функция**, React не я изпълнява в момента: нарежда я на опашката и при обработката ѝ подава резултата от предишната. Документацията нарича това **функция за обновяване** (*updater function*) ([React, „Queueing a Series of State Updates“](https://react.dev/learn/queueing-a-series-of-state-updates)). Първата получава `0` и връща `1`; втората получава `1` и връща `2`; третата получава `2` и връща `3`. Бутонът казва `3`. Обърни внимание, че дори така редът „вътре в кликването“ продължава да казва `0`: функцията за обновяване не променя снимката, а променя **как се изчислява следващата**.

Три детайла, които да запомниш:

- **Името на параметъра.** Документацията предлага да се нарича с инициалите на променливата (`n => n + 1`) или, ако предпочиташ нещо по-дълго, като се повтори пълното име или се добави префикс като `prev` ([React, „Queueing a Series of State Updates“](https://react.dev/learn/queueing-a-series-of-state-updates)). Този курс използва име на испански, което казва какво е: `actual`, `actuales`. Това е собствен принцип, замислен така, че да се чете като останалия код.
- **Трябва да бъде чиста.** Функцията за обновяване работи по време на рисуването, така че трябва само да изчислява и да връща: никакво искане на данни, отпечатване или извикване на друга функция `establecer…`. В `StrictMode`, и само докато разработваш, React я извиква **два пъти** и запазва един от резултатите (в изградената версия я извиква веднъж), точно за да извади наяве нечистите ([React, `useState`](https://react.dev/reference/react/useState)). Това е същата безплатна проверка от урок 0, приложена към състоянието.
- **Ако имаш нужда от новата стойност веднага, изчисли я сам.** Ако след `establecerRevisiones(revisiones + 1)` искаш да използваш новата стойност в същия обработчик, запази я преди това в константа: `const siguiente = revisiones + 1`. Четенето на `revisiones` ще ти даде старата снимка; справочникът на `useState` посочва това като първия случай в раздела си с често срещани проблеми ([React, `useState`](https://react.dev/reference/react/useState)).

#### 2.1.3 В `revisor`: `establecerNotas((actuales) => …)`

В контролната точка функцията за обновяване се появява веднъж, в `Panel`, при записване на бележка:

```tsx
// revisor/src/reporte/Panel.tsx (fragmento)
  function guardarNota(nombre: string, texto: string): void {
    establecerNotas((actuales) => conNota(actuales, nombre, texto));
  }
```

Бъди честен за това какво доказва това: в днешното табло `establecerNotas(conNota(notas, nombre, texto))` би дало същия резултат, защото `guardarNota` се извиква само веднъж при кликване. Тогава защо функция за обновяване? Защото **следващото състояние зависи от предишното**: новата бележка се добавя към тези, които вече са били. С функцията за обновяване изчислението се прави с последното, което е на опашката, а не със снимката, която обработчикът е имал, когато е бил създаден. В деня, в който някой добави бутон, който записва две бележки в едно и също кликване, или бележката дойде от функция, създадена при предишно рисуване, този код продължава да е правилен, без никой да трябва да мисли за него отново. Документацията на React не изисква функцията за обновяване във всички случаи; принципът на курса е по-кратък за запомняне: **ако новата стойност се изчислява от старата, подай на React функция**. Ако новата стойност не зависи от старата, като `establecerSoloFallas(true)` или `establecerSeleccionado("pagos")`, подай стойността.

### 2.2 Копиране вместо мутиране

#### 2.2.1 React сравнява снимката, а не съдържанието ѝ

Как React знае, че състоянието се е променило? Не обхожда обекта ти поле по поле: сравнява новата стойност с текущата чрез `Object.is` и ако са **едно и също**, пропуска рисуването на този компонент и на децата му ([React, `useState`](https://react.dev/reference/react/useState)). За числата и текста „едно и също“ означава това, което очакваш. За обектите и масивите означава друго: `Object.is` казва, че два обекта са едно и също само ако са **една и съща референция в паметта**, а не ако имат едни и същи полета ([MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is)). Два обекта с едно и също съдържание са различни; обект, на който си променил поле, остава същият.

Втората фигура възпроизвежда първата повреда от сцената. Бележник пази обект в състоянието и има два бутона. „mutar“ добавя бележката към вече съществуващия обект и го подава обратно. „copiar“ създава нов обект с всичко предишно плюс бележката. `<Profiler>` на React брои колко пъти е завършило едно рисуване; това е начинът да се брои, без да се слага страничен ефект в компонента (Урок 9 се връща към Profiler).

```tsx
// fig02_02.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Notas = Record<string, string>;

let dibujos = 0;

function BlocDeNotas() {
  const [notas, establecerNotas] = useState<Notas>({});

  function mutar(): void {
    notas.pagos = "se reinició a las 9:40";
    establecerNotas(notas);
  }

  function copiar(): void {
    establecerNotas({ ...notas, pagos: "se reinició a las 9:40" });
  }

  return (
    <>
      <p>notas guardadas: {Object.keys(notas).length}</p>
      <button type="button" id="mutar" onClick={mutar}>
        mutar
      </button>
      <button type="button" id="copiar" onClick={copiar}>
        copiar
      </button>
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);

async function clic(id: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`#${id}`)
      ?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
  console.log(`clic en «${id}»: pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
}

await act(async () => {
  raiz.render(
    <Profiler id="bloc" onRender={() => (dibujos += 1)}>
      <BlocDeNotas />
    </Profiler>,
  );
});
console.log(`al montar:      pantalla «${contenedor.querySelector("p")?.textContent}», dibujos: ${dibujos}`);
await clic("mutar");
await clic("copiar");
await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_02.tsx
$ node fig02_02.js
al montar:      pantalla «notas guardadas: 0», dibujos: 1
clic en «mutar»: pantalla «notas guardadas: 0», dibujos: 1
clic en «copiar»: pantalla «notas guardadas: 1», dibujos: 2
```

След „mutar“ броячът на рисуванията остава `1`, а екранът продължава да казва `0`. Обектът наистина се е променил: има бележката за `pagos`. Но това, което подаде на React, е **същият обект**, който той вече имаше, `Object.is` каза „еднакви“ и React не направи нищо. Документацията го обяснява с примера на точка, която следва мишката: без функцията, която променя състоянието, React няма представа, че обектът се е променил, и не реагира ([React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state)); а справочникът на `useState` го посочва като проблема „обнових състоянието, но екранът не се променя“ ([React, `useState`](https://react.dev/reference/react/useState)).

Погледни сега последния ред: след „copiar“ има ново рисуване и екранът казва `1`. Обърни внимание, че новият обект има бележката за `pagos` по два пътя: от предишната мутация, която продължаваше да е скрита в стария обект и беше копирана с `...notas`, и от самото копие. Екранът показа мутацията, **когато нещо друго предизвика рисуването**. Точно това видя в сцената с десетсекундното периодично запитване: отметката „с бележка“ се появи не навреме, когато следващият отчет принуди рисуване и скритата мутация излезе наяве. Мутацията не винаги се губи; понякога се появява късно, и това е по-лошо, защото изглежда, че работи.

#### 2.2.2 Копиране: синтаксисът за разгъване

Правилото на документацията е пряко: **третирай всеки обект, който слагаш в състоянието, като само за четене**; вместо да го променяш, замени го с друг ([React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state)). Инструментът на JavaScript за това е **синтаксисът за разгъване** (spread, `...`): в обектен литерал `{ ...notas, pagos: "texto" }` копира собствените изброими свойства на `notas` (за обект като този — всички) в нов обект и след това записва `pagos`; ако `pagos` вече е съществувал, остава последната стойност ([MDN, „Spread syntax“](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).

Едно предупреждение, което е важно, щом състоянието ти порасне: разгъването е **плитко**. Копира едно ниво; ако някое свойство на свой ред е обект, копието сочи към същия вътрешен обект и промяната му отново би била мутация. Документацията на React отбелязва това и показва как се копира ниво по ниво ([React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state)). Това е една от причините за петото правило за структура (2.3): плоското състояние се копира с една стъпка.

В `revisor` копирането живее в чиста функция, извън компонентите, в собствен файл:

```ts
// revisor/src/reporte/notas.ts
export type Notas = Readonly<Record<string, string>>;

export function conNota(notas: Notas, nombre: string, texto: string): Notas {
  const limpio = texto.trim();

  if (limpio === "") {
    return Object.fromEntries(Object.entries(notas).filter(([clave]) => clave !== nombre));
  }

  return { ...notas, [nombre]: limpio };
}
```

Прочети я ред по ред:

- **`Notas` е `Readonly<Record<string, string>>`.** Запис, чиито ключове са имена на услуги, а стойностите — текстът на бележката, отбелязан като само за четене. `Record<K, T>` изгражда обектен тип с ключове `K` и стойности `T`, а `Readonly<T>` прави така, че свойствата му да не могат да се присвояват наново ([TypeScript, „Utility Types“](https://www.typescriptlang.org/docs/handbook/utility-types.html)). Това е проверка на типовете, а не защита по време на изпълнение: обектът не се замразява, но `tsc` отхвърля всяко присвояване. В „Грешката, която ще видиш“ ще го видиш да спира мутацията от сцената, преди да стигне до браузъра.
- **`texto.trim()`.** Бележка, съставена само от интервали, не е бележка. Почиства се веднъж, тук, и никой друг не трябва да помни за това.
- **Ако текстът остане празен, бележката се маха.** `Object.entries` превръща обекта в списък от двойки `[ключ, стойност]`, `filter` изключва тази на услугата, а `Object.fromEntries` сглобява отново обект с останалите. Трите функции създават нови обекти; никоя не пипа `notas`. Така „изтрий текста и запиши“ маха отметката „с бележка“ от реда, което е това, което човек би очаквал.
- **Ако има текст, се копира и се записва.** `{ ...notas, [nombre]: limpio }` е разгъването отгоре, с изчислен ключ в квадратни скоби.

Защо отделна функция, а не три реда вътре в `Panel`? По същата причина, поради която `contarFallas` в урок 1: чистата функция — еднакви входове, еднакъв изход, без да пипа нищо отвън — се разбира сама, може да се провери без React (ще го видиш с `resumen.ts` в Урок 8) и може да се извиква от функцията за обновяване без страх, че `StrictMode` ще я извика два пъти.

#### 2.2.3 Защо толкова церемонии

Може да изглежда, че копирането е по-скъпо и по-дълго от мутирането. Документацията на React дава пет причини то да се прави въпреки това ([React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state)), и три от тях се забелязват още днес в `revisor`:

1. **Отстраняване на грешки.** Ако отпечатваш състоянието с `console.log` и никога не го мутираш, старите записи продължават да казват това, което са казвали в своя момент; с мутации запис отпреди пет секунди ти показва сегашната стойност.
2. **Оптимизиране.** Ако предишният обект е същият като новия, нищо вътре не е могло да се промени. Това сравнение с една стъпка е това, което React прави с `Object.is`, и това, което ще използва мемоизацията, когато Урок 9 я измери.
3. **Новите функции на React го предполагат.** Документацията казва, че функциите, които React изгражда, зависят от това състоянието да се третира като снимка. В този курс ще го забележиш с `useOptimistic` в Урок 7.

Ако един ден състоянието ти е толкова вложено, че ръчното копиране стане нечетимо, документацията споменава Immer, библиотека, която ти позволява да пишеш във формата на мутация и създава копията вместо теб ([React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state)). Този курс не я използва: състоянието на `revisor` е плоско нарочно, а следващият раздел обяснява защо.

### 2.3 Структурата на състоянието: пет правила

#### 2.3.1 Петте правила и какво предотвратява всяко

Да знаеш как се променя състоянието не е достатъчно; важно е и **какво** пазиш. Документацията на React предлага пет принципа за структуриране на състоянието ([React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure)). Представени са с `revisor` до тях, защото всеки има пример в контролната точка:

1. **Групирай свързаното състояние.** Ако винаги променяш две променливи едновременно, обедини ги в една. В `revisor`: резултатът от зареждането е една-единствена стойност `Carga`, а не „отчет“ от една страна и „детайл на грешката“ от друга, които винаги се променят заедно. `Carga` е пример за правила 1 и 2 едновременно: групира отчета и детайла на грешката (правило 1) и, тъй като е обединение (union), не позволява те да си противоречат (правило 2).
2. **Избягвай противоречията.** Ако няколко парчета състояние могат „да не са съгласни“, оставяш място за грешки. Примерът на документацията са два флага, `isSending` и `isSent`, които никога не трябва да са верни едновременно и които се заменят с едно-единствено `status` с три стойности. В `revisor` това е `Carga` от урок 0: `tipo`, който е `"cargando"`, `"listo"` или `"error"`. С три флага `cargando`, `listo` и `conError` би имало осем комбинации и само три биха имали смисъл; с дискриминирано обединение петте невъзможни дори не могат да се напишат. Документацията го поставя като цел: в паметта никога да няма състояние, което не съответства на нито един валиден екран ([React, „Reacting to Input with State“](https://react.dev/learn/reacting-to-input-with-state)).
3. **Избягвай излишното състояние.** Ако нещо може да се изчисли по време на рисуването от свойствата или от вече съществуващото състояние, не го пази. В `revisor`: филтрираният списък, избраната услуга, броят повреди и дали един ред има бележка. Нито едно от тях не е състояние; и четирите се изчисляват.
4. **Избягвай дублирането.** Ако едни и същи данни живеят на две места, поддържането им в съгласие е твой проблем. В `revisor`: пази се **името** на избраната услуга, а не услугата.
5. **Избягвай дълбоко вложеното състояние.** Йерархичното състояние е неудобно за копиране. В `revisor`: бележките са плосък запис по име, `{ pagos: "…", reportes: "…" }`, отделен от състоянията в отчета; не се слагат вътре във всяка услуга.

Правила 3 и 4 са тези, които предотвратяват най-много грешки, и двете имат своя проверка.

#### 2.3.2 Пази идентификатора, а не обекта

Когато човекът избере `pagos`, изкушението е да пазиш обекта, който е бил избран: `{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }`. Вече го имаш в ръката си, а за рисуване на детайлите е точно това, от което имаш нужда. Проблемът е, че този обект **вече е запазен** на друго място: в отчета. Документацията го казва така: съдържанието на избрания елемент е същият обект като един от списъка, така че информацията му е дублирана на две места ([React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure)). Докато нищо не се променя, това не се забелязва. В `revisor` нещо се променя на всеки десет секунди.

Четвъртата фигура поставя двете стратегии една до друга. Един екран получава списъка със състояния; един компонент пази избрания обект, а друг пази само името и търси обекта при рисуване. След това пристига нов отчет, в който `pagos` се е възстановила:

```tsx
// fig02_04.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

const primerReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "falla" },
];
const segundoReporte: readonly Estado[] = [
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "pagos", tipo: "disponible" },
];

function GuardaElObjeto({ estados }: { readonly estados: readonly Estado[] }) {
  const [elegido] = useState<Estado | null>(estados[1] ?? null);
  return <p>guarda el objeto: {elegido === null ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function GuardaElNombre({ estados }: { readonly estados: readonly Estado[] }) {
  const [seleccionado] = useState<string | null>("pagos");
  const elegido = estados.find((estado) => estado.nombre === seleccionado);
  return <p>guarda el nombre: {elegido === undefined ? "nada" : `${elegido.nombre} está ${elegido.tipo}`}</p>;
}

function Pantalla({ estados }: { readonly estados: readonly Estado[] }) {
  const lista = estados.map((estado) => `${estado.nombre}=${estado.tipo}`).join(", ");
  return (
    <>
      <p>lista: {lista}</p>
      <GuardaElObjeto estados={estados} />
      <GuardaElNombre estados={estados} />
    </>
  );
}

const contenedor = dom.window.document.createElement("div");
const raiz = createRoot(contenedor);
const imprimir = (titulo: string) => {
  console.log(titulo);
  for (const parrafo of contenedor.querySelectorAll("p")) {
    console.log(`  ${parrafo.textContent}`);
  }
};

await act(async () => {
  raiz.render(<Pantalla estados={primerReporte} />);
});
imprimir("primer reporte, con pagos elegido:");

await act(async () => {
  raiz.render(<Pantalla estados={segundoReporte} />);
});
imprimir("llega el siguiente sondeo (pagos se recuperó):");

await act(async () => {
  raiz.unmount();
});
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_04.tsx
$ node fig02_04.js
primer reporte, con pagos elegido:
  lista: catálogo=disponible, pagos=falla
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está falla
llega el siguiente sondeo (pagos se recuperó):
  lista: catálogo=disponible, pagos=disponible
  guarda el objeto: pagos está falla
  guarda el nombre: pagos está disponible
```

Списъкът казва, че `pagos` е налична, а компонентът, който е запазил обекта, продължава да казва, че е в повреда: той има снимка отпреди едно периодично запитване и никой няма да я обнови, защото състоянието се инициализира само при първото рисуване. Този, който е запазил името, казва истината, без да прави нищо специално: при всяко рисуване търси `pagos` в списъка, който току-що е пристигнал. Представи си оператора от сцената, който чете „En falla“ в детайлите и „disponible“ в съседния ред, когато дежурството всеки момент започва.

Затова в контролната точка `seleccionado` е `string | null` — името или нищо, — а избраната услуга се търси при рисуване, в `ContenidoReporte`:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx (fragmento)
      const { estados } = carga.reporte;
      const visibles = filtrarEstados(estados, soloFallas);
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

`elegido` не е състояние: това е константа, която живее, докато трае рисуването. Документацията предлага точно това със своето `selectedId`: да се пази само идентификаторът, който е същественото, а останалото да се изчислява по време на рисуването ([React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure)). И носи подарък: ако услугата изчезне от отчета, `find` връща `undefined` и детайлите просто не се рисуват; няма нужда изборът да се „почиства“ с какъвто и да е код ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)). Търсенето по име е безопасно, докато API спазва правилото си да няма две услуги с едно и също име — същото правило, на което стъпва `key={estado.nombre}` от урок 1; ако някой ден API го наруши, `find` ще върне първата, която намери, а React ще предупреди в конзолата за повтарящите се `key`.

#### 2.3.3 Не пази това, което може да се изчисли

Третото правило има версия, която документацията повтаря на две страници: **когато нещо може да се изчисли от вече съществуващите свойства или състояние, не го слагай в състоянието; изчисли го по време на рисуването** ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)). В контролната точка има четири такива изчисления и нито едно не изисква състояние:

- **Филтрираният списък.** `filtrarEstados(estados, soloFallas)` е нова чиста функция в `resumen.ts`. Ако полето е отметнато, оставя само повредите; ако не е, връща същия списък, без да го копира.

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}

export function filtrarEstados(
  estados: readonly EstadoPublico[],
  soloFallas: boolean,
): readonly EstadoPublico[] {
  return soloFallas ? estados.filter((estado) => estado.tipo === "falla") : estados;
}
```

- **Избраната услуга**, която току-що видя.
- **Обобщението.** `ResumenFallas` получава **пълния** списък, а не филтрирания, нарочно: „4 servicios revisados · 2 servicios con falla“ описва това, което е проверило периодичното запитване, а не това, което си оставил видимо. Измерването с Chrome го потвърждава: при отметнато поле обобщението продължава да казва 4 и 2.
- **Дали един ред има бележка.** `ListaEstados` подава на всеки ред `tieneNota={notas[estado.nombre] !== undefined}`. Няма отделен списък с „услуги с бележка“, който трябва да се поддържа актуален.

А ако изчислението беше скъпо? Филтрирането на четири или на четиристотин елемента при всяко рисуване не е скъпо. Принципът на курса е този от неговия README: първо се измерва, после се оптимизира, а Урок 9 носи измерването. Пазенето на изчисление в състоянието, „за да не се повтаря“, не е оптимизация: това е копие, което някой трябва да поддържа синхронизирано, а най-честият начин да се синхронизира — Effect, който го преизчислява — е този, който линтерът отхвърля, както ще видиш в „Грешката, която ще видиш“.

### 2.4 Повдигане на състоянието

#### 2.4.1 Всяко парче състояние има собственик

Вече знаеш как се променя състоянието и какво да пазиш. Остава да решиш **къде**. Документацията го поставя като принцип: за всяко уникално парче състояние избираш компонента, който е негов „собственик“, и това означава да имаш **един-единствен източник на истината**; това не значи, че цялото състояние живее на едно място, а че всяко парче има конкретен компонент, който го пази ([React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components)). Когато два компонента имат нужда от едни и същи данни, собственикът е техният **най-близък общ предшественик**: състоянието се маха от децата, слага се в родителя и им се подава надолу чрез свойства, заедно с функциите, които го променят. Документацията нарича това **повдигане на състоянието** (*lifting state up*) и казва, че то е от нещата, които ще правиш най-често в React ([React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components)).

Приложи въпроса „кой има нужда от него?“ към трите нови състояния на `revisor`:

| Състояние | Кой го чете | Кой го променя | Общ предшественик |
|---|---|---|---|
| `soloFallas` | `FiltroFallas` (за да се нарисува) и `ContenidoReporte` (за да филтрира) | `FiltroFallas` | `Panel` |
| `seleccionado` | `FilaEstado` (за `aria-pressed`) и `ContenidoReporte` (за детайлите) | `FilaEstado` и бутонът „Cerrar detalle“ | `Panel` |
| `notas` | `FilaEstado` (отметката) и `EditorNota` (записаното) | `EditorNota` | `Panel` |
| `borrador` | само `EditorNota` | само `EditorNota` | `EditorNota` |

Първите три се качват в `Panel`. Четвъртото остава долу и е също толкова важно да се разбере защо: черновата е това, което човекът пише, **преди** да реши да го запише. Никой друг няма нужда от нея, а ако се качи в `Panel`, всеки клавиш би рисувал наново цялото табло, вместо само редактора. Повдигането не е добродетел само по себе си: състоянието се качва **дотам, докъдето е нужно, и нито едно ниво повече**.

Ето как изглежда `Panel`, който сега е собственикът:

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const { carga, recargar } = useReporte(cargar, cadaMs);
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

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
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Три `useState`, по един за всяко парче състояние, всеки със своя тип: `false` е достатъчно на TypeScript, за да изведе `boolean`; `seleccionado` има нужда от `<string | null>`, защото започва от `null`, а после ще пази име; `notas` започва от `{}` с типа `Notas`. Функциите слизат надолу с префикса `al` (`alCambiar`, `alSeleccionar`, `alGuardarNota`), което е правилото на курса за именуване на свойства, които са функции. Обърни внимание, че две от тях са директно функциите на React: `alCambiar={establecerSoloFallas}` и `alSeleccionar={establecerSeleccionado}`. Функциите `establecer…`, които дава `useState`, са стабилни — справочникът на `useState` казва, че имат стабилна идентичност, една и съща при всяко рисуване ([React, `useState`](https://react.dev/reference/react/useState)), — и формата им съвпада с това, което детето очаква, така че няма нужда да се обвиват.

#### 2.4.2 Полето за отметка: контролиран компонент

`FiltroFallas` няма състояние. Получава стойността и една функция и се ограничава до това да рисува и да известява:

```tsx
// revisor/src/reporte/FiltroFallas.tsx
export function FiltroFallas({
  soloFallas,
  alCambiar,
}: {
  readonly soloFallas: boolean;
  readonly alCambiar: (soloFallas: boolean) => void;
}) {
  return (
    <label className="filtro">
      <input
        type="checkbox"
        checked={soloFallas}
        onChange={(evento) => alCambiar(evento.target.checked)}
      />{" "}
      Solo fallas
    </label>
  );
}
```

`<input>`, на който подаваш `checked`, е **контролирано поле**: React решава дали е отметнато, а не браузърът. Затова документацията изисква заедно с `checked` да подадеш `onChange`, който обновява тази стойност синхронно; без него полето остава само за четене и React предупреждава в конзолата с „You provided a `checked` prop to a form field without an `onChange` handler“ ([React, `<input>`](https://react.dev/reference/react-dom/components/input)). За поле за отметка се чете `evento.target.checked`, а не `evento.target.value` — още едно недоглеждане, което същата страница посочва. А полето е вътре в своя `<label>`: така кликването върху текста „Solo fallas“ също го отмята, а екранният четец обявява полето с името му. Това е чист HTML, без ARIA.

Думата „контролиран“ се използва и за цели компоненти: документацията нарича контролиран компонента, чиято важна информация идва от свойствата му, а не от собственото му състояние, и неконтролиран — този, който я пази сам ([React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components)). `FiltroFallas` е контролиран; `EditorNota`, с черновата си, е неконтролиран. Внимавай с двойното значение: `<textarea>` на `EditorNota` е контролирано поле (стойността му я задава `borrador`), но компонентът е неконтролиран, защото този `borrador` живее вътре в него и `Panel` не може да го пипне. Първата дума говори за полето; втората — за компонента; самата документация уточнява, че „контролиран“ и „неконтролиран“ не са строги технически термини. Нито едното не е по-добро: контролираният позволява на родителя да координира; неконтролираният е по-лесен за използване. Урок 7 се връща към това разграничение при формулярите.

#### 2.4.3 Редът: бутон, който казва дали е избран

За да се избере услуга, името на всеки ред става бутон:

```tsx
// revisor/src/reporte/FilaEstado.tsx
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
  seleccionado,
  tieneNota,
  alSeleccionar,
}: {
  readonly estado: EstadoPublico;
  readonly seleccionado: boolean;
  readonly tieneNota: boolean;
  readonly alSeleccionar: (nombre: string | null) => void;
}) {
  return (
    <li className={estado.tipo}>
      <button
        type="button"
        className="seleccionar"
        aria-pressed={seleccionado}
        onClick={() => alSeleccionar(seleccionado ? null : estado.nombre)}
      >
        {estado.nombre}
      </button>
      : <Descripcion estado={estado} />
      {tieneNota && <span className="marca-nota"> · con nota</span>}
    </li>
  );
}
```

Няколко решения в малко редове:

- **`<button>`, а не `<span>` с `onClick`.** До нативен бутон се стига с табулатора, натиска се с Enter или с интервал, а екранният четец го обявява като бутон. Със `<span>` би трябвало да изработиш всичко това ръчно.
- **`aria-pressed` и бутон, който наистина превключва.** Указва състоянието „натиснат“ на превключващ бутон: с `true` или `false` бутонът се обявява като нещо, което може да се натисне, и казва дали е натиснат ([MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)). Затова кликването казва `seleccionado ? null : estado.nombre`: според MDN превключващият бутон преминава в `true`, когато бъде натиснат веднъж, и се връща в `false`, когато бъде натиснат отново, а екранен четец, който обявява „натиснат“, приканва да се натисне пак. Ако кликването винаги повтаряше едно и също име, бутонът щеше да казва, че може да се превключва, а нямаше да превключва. Измерено: при двукратно натискане на `pagos` детайлите се появяват и изчезват, а `aria-pressed` минава от `true` към `false` (`node medir.mjs alternar`, изход в `ejercicios/medir-alternar.salida.txt`). MDN изисква освен това текстът на бутона да не се променя, когато се промени това състояние, и `revisor` го спазва: бутонът казва `pagos`, независимо дали е избран. Файлът със стилове използва същия атрибут, за да удебели подчертаването, със селектора `.seleccionar[aria-pressed="true"]`: това, което вижда окото, и това, което чува екранният четец, идват от една и съща стойност.
- **`className={estado.tipo}`.** Класът на реда, `disponible` или `falla`, е същият текст като типа, така че вече няма нужда от `if` с два почти еднакви `<li>`. `if`-ът, който различава двата случая, се премести в `Descripcion`, малък компонент, който рисува само текста. Той е дефиниран **извън** `FilaEstado`, никога вътре, по правилото от урок 1: компонент, дефиниран вътре в друг, е нов компонент при всяко рисуване и състоянието му би се нулирало без предупреждение ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)).
- **`{tieneNota && …}`.** Тук `&&` е безопасен, защото `tieneNota` е булева стойност; капанът с `0` от урок 1 се появява само когато условието е число.
- **Редът не знае какво е избрано.** Получава `seleccionado: boolean`, вече изчислено от списъка. Редът е чист: еднакви свойства, еднакво рисуване.

Списъкът прави изчисленията за всеки ред и не пази нищо:

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";
import type { Notas } from "./notas";

export function ListaEstados({
  estados,
  seleccionado,
  notas,
  alSeleccionar,
}: {
  readonly estados: readonly EstadoPublico[];
  readonly seleccionado: string | null;
  readonly notas: Notas;
  readonly alSeleccionar: (nombre: string | null) => void;
}) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado
          key={estado.nombre}
          estado={estado}
          seleccionado={estado.nombre === seleccionado}
          tieneNota={notas[estado.nombre] !== undefined}
          alSeleccionar={alSeleccionar}
        />
      ))}
    </ul>
  );
}
```

Неговият `alSeleccionar` приема `string | null`, също като този на `Panel`: `null` означава „нищо не е избрано“. Изпраща го редът, когато вече избраната услуга бъде натисната отново, и го изпраща и друга част — бутонът „Cerrar detalle“.

#### 2.4.4 Този, който разпределя

`ContenidoReporte` получава всичко и решава какво да рисува. Случаят `"listo"` сега има собствени скоби, за да декларира трите изчислени константи, които видя в 2.3:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { DetalleSeleccion } from "./DetalleSeleccion";
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
      const elegido = estados.find((estado) => estado.nombre === seleccionado);

      return (
        <>
          <ResumenFallas estados={estados} />
          <ListaEstados
            estados={visibles}
            seleccionado={seleccionado}
            notas={notas}
            alSeleccionar={alSeleccionar}
          />
          {elegido !== undefined && (
            <DetalleSeleccion
              estado={elegido}
              notas={notas}
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

Обърни внимание на две неща. Първото: детайлите се търсят в `estados`, пълния списък, а не във `visibles`. Това е решение, а не недоглеждане, и упражнение 3 те моли да помислиш върху него. Второто: `alCerrar={() => alSeleccionar(null)}` е единствената нова функция, която се създава тук; „затварянето“ не е нищо повече от избор на нищо.

### 2.5 `key` за нулиране на състоянието

#### 2.5.1 Състоянието живее в позиция, а не в компонента

Остава втората повреда от сцената: черновата, която се пренася. За да я разбереш, трябва да знаеш **къде** React пази състоянието на компонента. Не го пази „вътре“ във функцията, нито вътре в JSX: свързва го с **позицията**, която компонентът заема в дървото, което се рисува. Докато на тази позиция продължава да се рисува същият компонент, React запазва състоянието му; ако бъде махнат или ако на тази позиция се нарисува друг, React го изхвърля ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)).

Помисли за редактора на бележки. Избираш `pagos`: на позицията на редактора се рисува `EditorNota` с `nombre="pagos"`. Пишеш. Избираш `reportes`: на **същата позиция** се рисува **същият компонент**, `EditorNota`, сега с `nombre="reportes"`. За React нищо не показва, че това е друг редактор: променило се е едно свойство, както се променя всяко свойство, и състоянието `borrador` се запазва. Документацията използва почти идентичен случай, чат, в който текстът, който си написал за един човек, остава там, когато избереш друг, и го казва ясно: в много приложения това е желаното, но не и в чат, защото някой може да изпрати на грешния човек вече написано съобщение ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). В `revisor` това е бележка за `pagos`, записана в `reportes`.

Третата фигура го възпроизвежда с минимален редактор, който пази черновата си, и го рисува два пъти: без `key` и с `key={nombre}`.

```tsx
// fig02_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// react-dom comprueba al cargarse si existe `window.document` y si el documento
// admite el evento `input`, así que se importa después de que exista `window`
// (los import de arriba se cargan antes).
const { createRoot } = await import("react-dom/client");

function Editor({ nombre }: { readonly nombre: string }) {
  const [borrador, establecerBorrador] = useState("");

  return (
    <label>
      {`Nota sobre ${nombre}`}
      <textarea value={borrador} onChange={(evento) => establecerBorrador(evento.target.value)} />
    </label>
  );
}

function Detalle({ nombre, conKey }: { readonly nombre: string; readonly conKey: boolean }) {
  return conKey ? <Editor key={nombre} nombre={nombre} /> : <Editor nombre={nombre} />;
}

function escribir(area: HTMLTextAreaElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")?.set;
  asignar?.call(area, texto);
  area.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function probar(conKey: boolean): Promise<void> {
  console.log(conKey ? "con key={nombre}:" : "sin key:");
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  const leer = () =>
    `«${contenedor.querySelector("label")?.firstChild?.textContent}» → borrador «${contenedor.querySelector("textarea")?.value}»`;

  await act(async () => {
    raiz.render(<Detalle nombre="pagos" conKey={conKey} />);
  });
  await act(async () => {
    const area = contenedor.querySelector("textarea");
    if (area !== null) {
      escribir(area, "llamar al proveedor");
    }
  });
  console.log(`  escribes en pagos:    ${leer()}`);

  await act(async () => {
    raiz.render(<Detalle nombre="reportes" conKey={conKey} />);
  });
  console.log(`  eliges reportes:      ${leer()}`);

  await act(async () => {
    raiz.unmount();
  });
  contenedor.remove();
}

await probar(false);
await probar(true);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig02_03.tsx
$ node fig02_03.js
sin key:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «llamar al proveedor»
con key={nombre}:
  escribes en pagos:    «Nota sobre pagos» → borrador «llamar al proveedor»
  eliges reportes:      «Nota sobre reportes» → borrador «»
```

Без `key` заглавието на редактора се сменя на „Nota sobre reportes“, но черновата продължава да казва „llamar al proveedor“: свойството се промени, а състоянието остана. С `key={nombre}` черновата остава празна. (Една бележка за фигурата: за разлика от тези в урок 0, тя импортира `react-dom/client` **след** създаването на `window`. react-dom проверява при зареждането си дали съществува `window.document` и дали документът поддържа събитието `input` и с този резултат решава как да открива, че някой пише в `<textarea>` (това беше прочетено в кода на инсталирания пакет, `react-dom-client.development.js`: променливите `canUseDOM` и `isInputEventSupported`; това не е нещо, което документацията на React описва). Ако се зареди, преди да съществува прозорец, тази проверка излиза отрицателна и писането, което фигурата предизвиква, не стига правилно до `onChange`. В истински браузър прозорецът винаги съществува първи, така че в `revisor` нищо от това не е нужно.)

#### 2.5.2 Какво прави `key`

В урок 1 използва `key` в списък, за да може React да разпознава всеки ред между две рисувания. Това е същият инструмент: **`key` казва на React да използва самата `key` като част от позицията**, вместо да използва само реда в родителя ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). А документацията подчертава: `key` не са само за списъци. С `key="pagos"` и после `key="reportes"` за React това са **два различни редактора**: демонтира първия с цялото му състояние и монтира нов, който започва от `useState(…)` като в първия ден. `key` не трябва да са уникални в цялото приложение; те само различават позиции в един и същ родител ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)).

Документацията дава на тази употреба точно име в „You Might Not Need an Effect“: **нулиране на цялото състояние, когато се промени свойство**. Нейният пример е профил, който получава `key={userId}`, така че при смяна на потребителя да се нулират наполовина написаният коментар и всяко друго състояние под него; и отбелязва като „за избягване“ алтернативата състоянието да се нулира от Effect ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)). Това е вторият принцип на курса, който се показва преди Урок 3: това, което може да се реши със структура, не се решава с Effect.

В контролната точка `key` е в `DetalleSeleccion`, карето на избраната услуга:

```tsx
// revisor/src/reporte/DetalleSeleccion.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { EditorNota } from "./EditorNota";
import type { Notas } from "./notas";

export function DetalleSeleccion({
  estado,
  notas,
  alGuardarNota,
  alCerrar,
}: {
  readonly estado: EstadoPublico;
  readonly notas: Notas;
  readonly alGuardarNota: (nombre: string, texto: string) => void;
  readonly alCerrar: () => void;
}) {
  return (
    <aside className="detalle" aria-label={`Detalle de ${estado.nombre}`}>
      <h3>{estado.nombre}</h3>
      <p>
        {estado.tipo === "disponible"
          ? `Disponible: HTTP ${estado.codigoHttp} en ${estado.duracionMs} ms`
          : `En falla: ${estado.detalle}`}
      </p>
      <EditorNota
        key={estado.nombre}
        nombre={estado.nombre}
        notaGuardada={notas[estado.nombre] ?? ""}
        alGuardar={alGuardarNota}
      />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

`key={estado.nombre}` казва точно това, което означава: редактор на бележката за `pagos` и редактор на бележката за `reportes` са, концептуално, два различни редактора. Същото казва документацията за своя чат: разговор с един човек е различен от разговор с друг, така че има смисъл да му се даде `key` според това с кого говориш ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). Един детайл за достъпността: карето е `<aside>` с `aria-label="Detalle de pagos"`, така че екранният четец го обявява като допълващо съдържание с име, „Detalle de pagos“. `aria-label` не е украса: тъй като `<aside>` е вътре в `<section>` на `Tarjeta`, без име би загубил тази роля и би останал общ контейнер ([MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside)). А описанието на състоянието използва тернарния оператор върху `estado.tipo`, който TypeScript стеснява във всеки клон: в първия знае, че съществуват `codigoHttp` и `duracionMs`, във втория — `detalle`.

#### 2.5.3 Редакторът: локално състояние с начална стойност

```tsx
// revisor/src/reporte/EditorNota.tsx
import { useState } from "react";

export function EditorNota({
  nombre,
  notaGuardada,
  alGuardar,
}: {
  readonly nombre: string;
  readonly notaGuardada: string;
  readonly alGuardar: (nombre: string, texto: string) => void;
}) {
  const [borrador, establecerBorrador] = useState(notaGuardada);

  return (
    <div className="editor-nota">
      <label>
        Nota sobre {nombre}
        <textarea
          rows={3}
          value={borrador}
          onChange={(evento) => establecerBorrador(evento.target.value)}
        />
      </label>
      <button type="button" onClick={() => alGuardar(nombre, borrador)}>
        Guardar nota
      </button>
    </div>
  );
}
```

`borrador` започва с `notaGuardada`, бележката, която вече е съществувала, или `""`. Това заслужава уточнение, защото документацията предупреждава срещу нещо, което прилича на него: копиране на свойство в състоянието. Нейният пример е съобщение, което прави `useState(messageColor)`: ако родителят после подаде друг цвят, състоянието не разбира, защото **състоянието се инициализира само при първото рисуване** ([React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure)). Същата страница казва кога това има смисъл: когато **искаш** да пренебрегнеш последващите промени на свойството, и тогава е добре името му да започва с `initial` или `default`, за да се забелязва.

Тук това е точно желаното. Докато човекът пише, черновата не трябва да се променя, защото е пристигнал нов отчет; трябва да започне отначало само когато се смени услугата. А за това се грижи `key` на `DetalleSeleccion`: всеки път, когато се смени услугата, редакторът се монтира наново и `useState(notaGuardada)` отново прочита записаната бележка на **тази** услуга. Затова при измерването с Chrome връщането към `pagos` показва „llamar al proveedor“, записаната бележка, а не черновата, която е останала незаписана. Двойката „начална стойност + `key`“ е пълният шаблон; махането на което и да е от двете го чупи.

А ако искаш да **запазиш** незаписаната чернова на всяка услуга, за да я възстановиш при връщане? Документацията дава три пътя: да се рисуват всички редактори и да се скриват неактивните, да се пазят черновите на друго място или да се повдигне състоянието в родителя, което нарича най-често срещаното решение ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). В `revisor` „повдигането“ вече съществува за това, което е важно: записаната бележка живее в `Panel`. Незаписаната чернова се изхвърля нарочно.

### 2.6 Пълното преминаване

С повдигнатото състояние и `key` на мястото ѝ остава файлът със стилове. Това са правилата, които се добавят в края на `panel.css`, единствения файл със стилове на курса, който расте урок след урок:

```css
/* revisor/src/reporte/panel.css (fragmento: lo que se agrega al final) */
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
```

`.seleccionar` маха от бутона вида на бутон и го оставя като име с удебелен шрифт, подчертано, за да се забелязва, че може да се натисне; `font: inherit` го кара да използва същия шрифт като останалата част от реда, защото бутоните не го наследяват по подразбиране. Останалата част от файла е тази от урок 1. Другите файлове на контролната точка — `main.tsx`, `useReporte.ts`, `cargar.ts`, `contrato.ts`, `Tarjeta`, `ResumenFallas`, конфигурацията и тестовият сървър — не се променят в този урок; `package.json` само сменя версията си на `0.2.0`.

Проверката на контролната точка е обичайната, от `~/curso-react/revisor/`:

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0

$ npm run build

> revisor@0.2.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 30 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-CGNql20r.css    0.68 kB │ gzip:  0.38 kB
dist/assets/index-7jh0TEYR.js   224.30 kB │ gzip: 70.28 kB

✓ built in 189ms
```

Линтерът не казва нищо, а изграждането завършва с `index-7jh0TEYR.js`, същото име, което излезе под macOS и под Linux. Тъй като това име идва от съдържанието, ако твоят `revisor` е идентичен с контролната точка, ще видиш същото. С `npm run servidor` в един терминал и `npm run dev` (или `npm run preview`) в друг отвори страницата и я обходи. Ето какво измери Chrome без графичен интерфейс върху изградената версия, сервирана с `vite preview`, стъпка по стъпка, с `node medir.mjs recorrido`:

```text
1. al cargar
   resumen: 4 servicios revisados · 2 servicios con falla
   botones: catálogo aria-pressed=false, pagos aria-pressed=false, inventario aria-pressed=false, reportes aria-pressed=false
2. marcas «Solo fallas»
   filas: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado)
   resumen: 4 servicios revisados · 2 servicios con falla
3. desmarcas y eliges pagos
   pagos aria-pressed: true
   detalle: Detalle de pagos — En falla: HTTP 503
4. escribes una nota y la guardas
   filas: catálogo: disponible (HTTP 200, 42 ms) | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
5. empiezas otra nota en pagos sin guardarla y eliges reportes
   detalle: Detalle de reportes · borrador: ""
6. regresas a pagos
   borrador: "llamar al proveedor"
7. cierras el detalle
   ¿hay detalle?: false · pagos aria-pressed: false
```

Всеки ред има обяснението си в урока. Стъпка 1 показва бутоните с `aria-pressed="false"` (2.4.3). Стъпка 2 — филтрирания списък с непокътнато обобщение (2.3.3). Стъпка 3 — избрания бутон в `true` и детайлите, потърсени по име (2.3.2). Стъпка 4 — бележката, копирана в състоянието, и отметката „с бележка“ на реда (2.2). Стъпка 5 — незаписаната чернова, която **не** се пренася в `reportes` (2.5). Стъпка 6 — записаната бележка, която се връща при връщане към `pagos`, прочетена от току-що монтирания редактор (2.5.3). А стъпка 7 — „затварянето“ като избор на нищо (2.4.4). Спри всичко с Ctrl+C във всеки терминал.

## Грешката, която ще видиш

Този урок има две грешки, които инструментите спират, и една, която никой инструмент не вижда.

**Мутацията от сцената.** В копие на контролната точка промени `guardarNota` в `Panel.tsx` така, че да добавя бележката към вече съществуващия обект:

```tsx
// guardarNota mutando (fragmento; en una copia, nunca en el punto de control)
  function guardarNota(nombre: string, texto: string): void {
    notas[nombre] = texto;
    establecerNotas(notas);
  }
```

Две различни защити го спират, всяка по свой начин. Първо, `tsc`:

(Точните промени в копието са в `ejercicios/copia-mutando.diff.txt`, а пълните изходи — в `ejercicios/copia-mutando.lint-tsc.salida.txt`.)

```text
$ npx tsc -b
src/reporte/Panel.tsx(6,10): error TS6133: 'conNota' is declared but its value is never read.
src/reporte/Panel.tsx(23,5): error TS2542: Index signature in type 'Readonly<Record<string, string>>' only permits reading.
```

Вторият ред е важният: типът `Notas` е `Readonly`, така че индексът му „позволява само четене“. (Първият е следствие: `conNota` вече не се използва.) А ESLint, с правилото `immutability` от пакета на React:

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/Panel.tsx
   6:10  error  'conNota' is defined but never used  @typescript-eslint/no-unused-vars
  23:5   error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/revisor/src/reporte/Panel.tsx:23:5
  21 |
  22 |   function guardarNota(nombre: string, texto: string): void {
> 23 |     notas[nombre] = texto;
     |     ^^^^^ `notas` cannot be modified
  24 |     establecerNotas(notas);
  25 |   }
  26 |  react-hooks/immutability

✖ 2 problems (2 errors, 0 warnings)
```

„Модифициране на стойност, върната от `useState()`, която не трябва да се модифицира директно. Използвай функцията, която я променя.“ Правилото проверява да не се мутират свойства, състояние и други стойности, които React третира като неизменни; документацията му казва, че свойствата и състоянието на компонент са неизменни снимки ([React, „immutability“](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability)). Обърни внимание, че то я спира, дори типът да не е `Readonly`: фигура 2 използва `Record<string, string>` без `Readonly` и `tsc` я компилира без оплакване, но линтерът я отхвърля все пак:

```text
$ npx eslint fig02_02.tsx

~/curso-react/figuras/fig02_02.tsx
  22:5  error  Error: This value cannot be modified

Modifying a value returned from 'useState()', which should not be modified directly. Use the setter function to update instead.

~/curso-react/figuras/fig02_02.tsx:22:5
  20 |
  21 |   function mutar(): void {
> 22 |     notas.pagos = "se reinició a las 9:40";
     |     ^^^^^ `notas` cannot be modified
  23 |     establecerNotas(notas);
  24 |   }
  25 |  react-hooks/immutability

✖ 1 problem (1 error, 0 warnings)
```

Затова `revisor` има и двете: типът те предупреждава в редактора, докато пишеш, а линтерът хваща мутацията, дори някой да забрави `Readonly`. Поправката е тази от 2.2: `establecerNotas((actuales) => conNota(actuales, nombre, texto))`.

**Да пазиш това, което може да се изчисли, и да го синхронизираш с Effect.** В друго копие, вместо да подаде на редактора директно `notas[estado.nombre] ?? ""`, `DetalleSeleccion` пази бележката в собствено състояние и го „поддържа актуално“ с Effect:

```tsx
// DetalleSeleccion con estado redundante (fragmento; en una copia)
  const [notaGuardada, establecerNotaGuardada] = useState("");

  useEffect(() => {
    establecerNotaGuardada(notas[estado.nombre] ?? "");
  }, [notas, estado.nombre]);
```

`tsc -b` не казва нищо: типовете са наред. Линтерът обаче казва (`ejercicios/copia-efecto.diff.txt` и `ejercicios/copia-efecto.lint-tsc.salida.txt`):

```text
$ npm run lint

> revisor@0.2.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx
  20:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/reporte/DetalleSeleccion.tsx:20:5
  18 |
  19 |   useEffect(() => {
> 20 |     establecerNotaGuardada(notas[estado.nombre] ?? "");
     |     ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  21 |   }, [notas, estado.nombre]);
  22 |
  23 |   return (  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)
```

Това е правилото `set-state-in-effect`, същото, което урок 0 ти показа в `useReporte`. Тук то се появява по причината от 2.3.3: `notaGuardada` е копие на нещо, което вече е в `notas`, а Effect-ът съществува само за да поддържа копието в съгласие с оригинала. Струва едно допълнително рисуване при всяка промяна — първо със старото копие, после с новото — и, още по-лошо, има грешка, която се вижда. При смяна на услугата `DetalleSeleccion` не се монтира отново: на същата позиция е и е същият компонент, така че при това рисуване неговото `notaGuardada` все още има стойността на **предишната** услуга. Редакторът, който наистина се монтира наново заради своята `key`, започва с тази стара стойност и, както е обяснено в 2.5.3, вече не обръща внимание на това, което идва после, когато Effect-ът поправя копието. Това копие беше изградено и измерено с Chrome без графичен интерфейс (`node medir.mjs efecto`):

```text
a. guardas una nota en pagos, eliges catálogo y regresas: Detalle de pagos · borrador: ""
b. guardas una nota en catálogo y eliges pagos: Detalle de pagos · borrador: "revisar el disco"
   filas: catálogo: disponible (HTTP 200, 42 ms) · con nota | pagos: falla (HTTP 503) · con nota | inventario: disponible (HTTP 200, 118 ms) | reportes: falla (tiempo límite agotado)
```

В стъпка a `catálogo` нямаше бележка, така че редакторът на `pagos` започва празен: редът казва „с бележка“, а човекът не вижда бележката. В стъпка b `catálogo` има бележка и редакторът на `pagos` започва с **бележката на `catálogo`**: това е повредата от сцената — бележка на една услуга, която всеки момент ще се запише в друга, — с друга причина. Поправката не е правилото да се заглуши, а да се изтрият състоянието и Effect-ът: това, което може да се изчисли, се изчислява.

**Грешката, която никой не вижда: махане на `key`.** В трето копие изтрий реда `key={estado.nombre}` от `DetalleSeleccion.tsx`:

(Изходът е в `ejercicios/copia-sin-key.lint-tsc.salida.txt`; промяната — в `ejercicios/copia-sin-key.diff.txt`.)

```text
$ npx tsc -b; echo "tsc: $?"
tsc: 0
$ npx eslint . --max-warnings 0; echo "lint: $?"
lint: 0
```

И двете са зелени, а таблото има повредата от сцената: черновата се пренася от една услуга в друга. Нито едно правило на линтера на курса не открива, че за теб редактор на `pagos` и редактор на `reportes` са различни неща; това е решение за смисъла, а не за формата. Виждаш го само като използваш таблото или с тест на компонент, който го използва вместо теб: Урок 8 учи как се пишат такива. Това е същата поука, която остави липсващото почистване в урок 0: линтерът и типовете са две защити, а не всички.

## Какво се прави погрешно

**Да четеш състоянието веднага след като го промениш.** `establecerX(nuevo); console.log(x)` отпечатва стойността от снимката на текущото рисуване, която е старата (в обработчик на събитие като тези). Ако имаш нужда от новата в същия обработчик, запази я предварително в константа.

**Да подаваш стойността, когато следващата зависи от предишната.** `establecerN(n + 1)` работи до деня, в който се извика два пъти в едно и също кликване или от функция, създадена при предишно рисуване. Ако новата стойност се изчислява от старата, подай функция.

**Да мутираш и да подадеш отново същия обект.** React сравнява с `Object.is`; ретуширан обект си остава същият и екранът не се променя. Или се променя късно, когато нещо друго предизвика рисуване, което е по-лошо, защото изглежда, че работи.

**Да копираш само първото ниво на вложено състояние.** Разгъването е плитко. Ако състоянието ти има обекти в обекти, всяко ниво, което се променя, се копира; още по-добре — направи го плоско.

**Три флага там, където се побира един `tipo`.** `cargando`, `listo` и `conError` като отделни булеви стойности позволяват комбинации, които не съответстват на нито един екран. Дискриминираното обединение не позволява те да бъдат написани.

**Да пазиш избрания обект.** Това е копие на елемент от списъка, което остарява при следващото периодично запитване. Пази идентификатора и търси обекта при рисуване.

**Да пазиш това, което може да се изчисли, и, още по-лошо, да го синхронизираш с Effect.** Филтриран списък, сума или избран елемент не са състояние. Изчисляването им по време на рисуването е по-просто, по-бързо и не се разсинхронизира.

**Да повдигаш състоянието повече от нужното.** Качването на черновата на текстово поле до корена кара всеки клавиш да рисува наново целия екран. Състоянието се качва до общия предшественик на тези, които го използват, и нито едно ниво повече.

**Да нулираш състоянието с Effect, когато се промени свойство.** Effect, който слага черновата на `""`, когато се промени `nombre`, рисува първо със старата чернова и после с празната. `key` го прави с една стъпка и го казва в кода.

**Да дефинираш компонент вътре в друг.** Това е нов компонент при всяко рисуване: React вижда друго нещо на същата позиция и изхвърля състоянието му без предупреждение. Това е правилото от урок 1, а сега знаеш какво губи този, който го наруши.

## Упражнения

### Упражнение 1 — Предвиди бутона

Запиши копие на `fig02_01.tsx` като `ejercicio1.tsx` в `~/curso-react/figuras/` и смени в него трите извиквания на `ConValor` с тези:

```tsx
// ejercicio 1 (fragmento)
    establecerRevisiones(revisiones + 5);
    establecerRevisiones((actual) => actual + 1);
    establecerRevisiones(revisiones + 1);
```

Смени и заглавието на извикването, за да казва изходът какво си изпълнил: `await hacerClic("ejercicio (+5, actualizadora, +1):", ConValor);`.

**Преди да го изпълниш**, запиши в дневника си какво число ще казва бутонът след кликването и защо, като обходиш опашката от обновявания ред по ред. След това го компилирай и изпълни.

### Упражнение 2 — Преброй бележките без ново състояние

Добави в заглавието на картата или точно под обобщението текст, който казва „Notas guardadas: N“ с броя на услугите, които имат бележка. Условието: **не можеш да добавяш нито един `useState`**. Преди да пишеш, отговори: кое правило за структура ти забранява състояние `cuantasNotas` и какво би трябвало да не забравиш да правиш в `guardarNota`, ако го имаше?

### Упражнение 3 — Детайлите и филтърът

При отворено табло избери `catálogo` и после отметни „Solo fallas“. **Преди да го направиш**, предвиди: остават ли видими детайлите на `catálogo`? Провери го и обясни защо, като посочиш отговорния ред в `ContenidoReporte`. След това промени таблото така, че детайлите да изчезват, когато избраната услуга остане извън филтъра, **без да добавяш състояние и без да изтриваш `seleccionado`**. Какво става с избора, ако махнеш отметката?

### Упражнение 4 — Липсващата `key`, ръчно

В копие на контролната точка махни `key={estado.nombre}` от `DetalleSeleccion.tsx`. Провери, че `npm run lint` и `npm run build` остават зелени. Отвори таблото, избери `pagos`, напиши чернова, **без да я записваш**, и избери `reportes`. Запиши това, което виждаш. След това запиши бележка в `pagos`, избери `catálogo` и се върни към `pagos`: какво показва редакторът и защо? Върни `key`, когато приключиш.

## Решения

### Решение 1

Бутонът казва `1`. Опашката от обновявания, подред:

| На опашката | Получава | Резултат |
|---|---|---|
| „замени с `revisiones + 5`“, при `revisiones` равно на `0` | — | `5` |
| `(actual) => actual + 1` | `5` | `6` |
| „замени с `revisiones + 1`“, при `revisiones` равно на `0` | — | `1` |

Последното извикване не зависи от предишното: заменя стойността с `0 + 1`, защото снимката на обработчика продължава да казва `0`. Ето как излезе изпълнението (файлът и изходът му са в `ejercicios/ejercicio1.tsx` и `ejercicios/ejercicio1.salida.txt`):

```text
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx ejercicio1.tsx
$ node ejercicio1.js
ejercicio (+5, actualizadora, +1):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 1
con la forma actualizadora (actual => actual + 1, tres veces):
  dentro del clic, revisiones vale 0
  después del clic, el botón dice 3
```

Втората половина е тази от фигурата, която не се е променила. Документацията на React има упражнение със същата форма, със заместване след функция за обновяване ([React, „Queueing a Series of State Updates“](https://react.dev/learn/queueing-a-series-of-state-updates)). Поуката, която да запомниш: смесването на двете форми върху едно и също състояние в един и същ обработчик е позволено, но който го чете, трябва да направи тази таблица наум. Ако се хванеш, че я правиш, използвай само една форма.

### Решение 2

Числото се изчислява по време на рисуването, от `notas`, в `Panel`:

```tsx
// Panel.tsx (fragmento de la solución)
        <FiltroFallas soloFallas={soloFallas} alCambiar={establecerSoloFallas} />
        <p>Notas guardadas: {Object.keys(notas).length}</p>
```

Състояние `cuantasNotas` би нарушило правило 3, излишното състояние: това е информация, която се изчислява от `notas`. Ако го имаше, `guardarNota` би трябвало да обновява две състояния всеки път и освен това да решава дали да добави едно (нова бележка), да остави същото (бележка, която се презаписва) или да извади едно (бележка, която се изтрива с празен текст). С изчислението `conNota` вече решава всичко това и числото винаги идва от `notas`, така че не може да се размине с тях. Обърни внимание и на това, че няма нужда от `&&`: `0` тук е точно това, което искаш да покажеш.

### Решение 3

Да: детайлите на `catálogo` остават видими, макар редът ѝ вече да не се показва. Ето как го измери Chrome без графичен интерфейс върху контролната точка (`node medir.mjs filtro`):

```text
a. eliges catálogo: Detalle de catálogo
b. marcas «Solo fallas»: pagos: falla (HTTP 503) | reportes: falla (tiempo límite agotado) · Detalle de catálogo
c. desmarcas: Detalle de catálogo
```

Отговорен е този ред на `ContenidoReporte`:

```tsx
// ContenidoReporte.tsx (fragmento)
      const elegido = estados.find((estado) => estado.nombre === seleccionado);
```

Търси в `estados`, пълния списък, а не във `visibles`. За да изчезват детайлите с филтъра, е достатъчно да се търси във филтрирания списък:

```tsx
// ContenidoReporte.tsx (fragmento de la solución)
      const elegido = visibles.find((estado) => estado.nombre === seleccionado);
```

Когато махнеш отметката, детайлите на `catálogo` **се появяват отново**, защото `seleccionado` през цялото време продължава да е `"catálogo"`; промени се само това, което се изчислява от него. Това е подаръкът от 2.3.2 в друга форма: тъй като детайлите се изчисляват, няма нужда нищо да се „почиства“. Коя от двете версии е по-добра? Това е продуктово решение, а не решение на React: контролната точка запазва детайлите видими, защото човекът ги е избрал нарочно, а скриването им при филтриране може да го изненада. Това, което не подлежи на мнение, е, че нито една от двете няма нужда от ново състояние.

### Решение 4

Lint и build остават зелени, както в „Грешката, която ще видиш“. Ето какво измери Chrome без графичен интерфейс върху това копие, изградено (`node medir.mjs sin-key`):

```text
a. escribes en pagos sin guardar y eliges reportes: Detalle de reportes · borrador: "borrador de pagos"
b. guardas una nota en pagos y eliges catálogo: Detalle de catálogo · borrador: "llamar al proveedor"
c. cierras el detalle y eliges reportes: Detalle de reportes · borrador: ""
```

В стъпка a заглавието се сменя на „Detalle de reportes“, а полето запазва черновата от `pagos`: това е фигура 3 вътре в `revisor`. Стъпка b е по-фина: при записана бележка в `pagos`, когато отидеш в `catálogo`, редакторът **продължава да показва бележката на `pagos`**. `useState(notaGuardada)` прочете началната си стойност само първия път, когато редакторът беше монтиран; без `key` редакторът никога не се монтира наново, докато има избрана услуга, така че `notaGuardada` се променя, а черновата я пренебрегва. Това е точно предупреждението на документацията за копирането на свойство в състоянието (2.5.3). С `key` всяка услуга монтира собствен редактор и двойката „начална стойност + `key`“ отново работи. А стъпка c показва едно изключение: ако затвориш детайлите и избереш друга услуга, редакторът наистина се монтира наново, защото при затварянето е изчезнал от дървото, и черновата излиза празна. Това прави грешката периодична, а това е най-лошият вид грешка.

## Как разбирам, че съм успял

- [ ] `npm run lint` завършва, без да изпише никакъв проблем, а `npm run build` завършва с `✓ built`, с `index-….js` в `dist/assets/`.
- [ ] При работещи тестов сървър и `npm run dev` полето „Solo fallas“ оставя само `pagos` и `reportes`, а обобщението продължава да казва „4 servicios revisados · 2 servicios con falla“.
- [ ] При избор на услуга бутонът ѝ преминава в `aria-pressed="true"` (погледни го в инструментите за разработчици, раздел Elements) и се появяват детайлите ѝ; „Cerrar detalle“ ги маха и бутонът се връща към `false`; повторното натискане на същата услуга също ги маха.
- [ ] Записана бележка отбелязва реда с „· con nota“, а записването на празен текст маха отметката.
- [ ] Незаписана чернова не се пренася при избор на друга услуга, а при връщане се появява записаната бележка.
- [ ] Можеш да изпълниш четирите фигури и да обясниш всеки ред от изхода им, без да гледаш урока.
- [ ] В копие мутацията в `guardarNota` се отхвърля от `tsc` (TS2542) и от `npm run lint` (`react-hooks/immutability`) и можеш да кажеш защо са нужни и двете.
- [ ] Можеш да посочиш в `revisor` пример за всяко от петте правила за структура (един пример може да служи за две).
- [ ] Записа в своя [дневник](bitacora.md) предвиждането си за упражнение 1, преди да го изпълниш, и дали позна.

## Обобщение

Отговори, без да гледаш урока:

1. Защо `revisiones` има една и съща стойност преди и след извикването на `establecerRevisiones` вътре в кликване? Какво означава състоянието да е снимка?
2. Какво е групиране (*batching*) и каква връзка има с опашката от обновявания?
3. Какво се променя, ако подадеш на `establecer…` функция вместо стойност? Кога курсът използва всяка от формите?
4. Защо мутирането на обект и подаването му обратно не рисува наново? Какво сравнява React и с коя функция на JavaScript?
5. Кои са петте правила за структурата на състоянието? Дай пример от `revisor` за всяко.
6. Защо `seleccionado` пази име, а не услуга? Какво би изглеждало погрешно, ако пазеше услугата?
7. Как решаваш в кой компонент живее едно парче състояние? Защо черновата не се качва в `Panel`?
8. Къде React пази състоянието на компонент? Какво прави `key` с това и защо никой инструмент не те предупреждава, ако тя липсва?

## За допълнително четене

- [React, „State as a Snapshot“](https://react.dev/learn/state-as-a-snapshot): състоянието като снимка, примерът с бутона „+3“ и защо стойността не се променя в рамките на едно рисуване. Посетено на 21 октомври 2026 г.
- [React, „Queueing a Series of State Updates“](https://react.dev/learn/queueing-a-series-of-state-updates): групирането, опашката от обновявания, функцията за обновяване и как да се именува параметърът ѝ. Посетено на 21 октомври 2026 г.
- [React, `useState`](https://react.dev/reference/react/useState): функцията `set`, сравнението с `Object.is`, двойното извикване в `StrictMode` и често срещаните проблеми („логът дава старата стойност“, „екранът не се променя“). Посетено на 21 октомври 2026 г.
- [React, „Updating Objects in State“](https://react.dev/learn/updating-objects-in-state): третиране на състоянието като само за четене, плиткото разгъване, причините за неизменяемостта и Immer. Посетено на 21 октомври 2026 г.
- [React, „Choosing the State Structure“](https://react.dev/learn/choosing-the-state-structure): петте правила за структура, `selectedId` вместо обекта и предупреждението за копирането на свойства в състоянието. Посетено на 21 октомври 2026 г.
- [React, „Reacting to Input with State“](https://react.dev/learn/reacting-to-input-with-state): „невъзможните“ състояния и едно `status` вместо няколко флага. Посетено на 21 октомври 2026 г.
- [React, „Sharing State Between Components“](https://react.dev/learn/sharing-state-between-components): повдигане на състоянието, контролирани и неконтролирани компоненти и единственият източник на истината. Посетено на 21 октомври 2026 г.
- [React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state): състоянието, обвързано с позицията в дървото, `key` извън списъците и примерът с чата. Посетено на 21 октомври 2026 г.
- [React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect): изчисляване по време на рисуването, нулиране на цялото състояние с `key` и пазене на избрания идентификатор. Посетено на 21 октомври 2026 г.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): контролирани полета, `checked` с `onChange` и `evento.target.checked` при полетата за отметка. Посетено на 21 октомври 2026 г.
- [React, „immutability“](https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability): правилото на линтера, което отхвърля мутирането на свойства и състояние. Посетено на 21 октомври 2026 г.
- [MDN, `Object.is()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is): какво означава „една и съща стойност“ и че два обекта са едно и също само ако са една и съща референция. Посетено на 21 октомври 2026 г.
- [MDN, „Spread syntax“](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax): разгъването в обектни литерали, плиткото копие и коя стойност печели, когато свойство се повтаря. Посетено на 21 октомври 2026 г.
- [MDN, `aria-pressed`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed): състоянието на превключващ бутон и защо текстът му не се променя. Посетено на 21 октомври 2026 г.
- [MDN, `<aside>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/aside): ролята на допълващо съдържание и защо в секция то има нужда от име. Посетено на 21 октомври 2026 г.
- [TypeScript, „Utility Types“](https://www.typescriptlang.org/docs/handbook/utility-types.html): `Readonly<Type>` и `Record<Keys, Type>`. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| състояние | това, което компонентът помни между едно рисуване и следващото; React го пази и го дава с `useState` |
| снимка (*snapshot*) | фиксираната стойност на състоянието по време на едно рисуване; промяната ѝ иска ново рисуване, а не пренаписва променливата |
| групиране (*batching*) | изчакване обработчикът да приключи, за да се обработят всички обновявания на състоянието в едно-единствено рисуване |
| функция за обновяване | функцията, която се подава на `establecer…`, за да изчисли новата стойност от последната, която е на опашката |
| мутиране | промяна на вече съществуващ обект вместо създаване на нов |
| разгъване (`...`) | синтаксисът, който копира свойствата на един обект в нов; копира само едно ниво |
| излишно състояние | информация, пазена в състоянието, която би могла да се изчисли от друго състояние или от свойствата |
| повдигане на състоянието | преместване на състояние в общия предшественик на компонентите, които го използват, и подаването му надолу чрез свойства |
| контролиран компонент | този, който получава важната си информация чрез свойства, вместо да я пази сам |
| `key` (за нулиране) | идентификатор, който React използва като част от позицията; ако се промени, демонтира компонента и монтира нов |

---

**Следващ:** [Урок 3 — Effects: синхронизиране, а не „когато се зареди“](03-effects-sincronizar.md)
