# Урок 9 — Производителност, публикуване и кога е нужен framework

*17:40 ч. в петък е, а `revisor` се публикува в 18:00 на сървъра на екипа по експлоатация. В канала на проекта има три съобщения без отговор. Първото: „таблото изглежда бавно, да сложим ли `useMemo` навсякъде, преди да публикуваме?“. Второто, от този, който е подготвил сървъра: „отварям `/servicios/pagos` и работи, но ако презаредя страницата, ми дава 404“. Третото, от някого, който е искал таблото да пита „почти никога“ в тестовата среда: сложил е `VITE_CADA_MS=2147483648` и логът на API се е напълнил със заявки, по една на всеки три десети от секундата. Никой не е измерил нищо. Има двайсет минути и три различни мнения какво да се прави. Този урок прави това, което липсваше: първо да се измери, после да се реши, и да се публикува със сървър, който знае какво е маршрут на клиента.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 9.2 и 9.3)

**Какво изграждаш:** `revisor`, измерен, оптимизиран и публикуван: компилаторът на React, включен в изграждането, собствен сървър за публикуване, който сервира `dist/` с пренаписване към `index.html`, политика за сигурност на съдържанието и правилно кеширане, и пет поправки, които излязоха от измерването на таблото, всяка с теста, който е червен преди поправката и зелен след нея

**Какво научаваш:** измерване с Profiler **преди** мемоизиране; структурата на първо място; React Compiler 1.0; `vite build` и защо `vite preview` не е продукционен сървър; пренаписване към `index.html`; `VITE_` без тайни; преговор на XSS; Server Components и Server Functions: какво са и защо това табло не ги използва; кога си струва да се мигрира към framework

**Откъде идваш.** От контролната точка на [Урок 8](08-pruebas-de-componentes.md): `revisor` с четири екрана (списъкът на `/`, детайлите на `/servicios/:nombre`, регистрацията на `/servicios/nuevo` и страницата „не е намерена“), данни от сървъра в TanStack Query, известия и предпочитания в контекст, достъпен формуляр и пакет от 27 теста в 7 файла, които стават червени, когато някой върне поправка. Всичко това работи в `npm run dev`. Това, което не е направено, е последният въпрос: колко е бързо и как се доставя на този, който ще го използва?

**Какво не прави този урок.** Не добавя екрани, нито променя това, което таблото прави. Не използва `useMemo`, `useCallback`, нито `memo` в `revisor`: измерването не ги поиска, а раздел 9.1 обяснява защо. Не мигрира таблото към framework, нито монтира Server Components: раздел 9.3 обяснява какво са и защо това табло няма нужда от тях. Не настройва продукционен уеб сървър като nginx или Caddy: пише малък на Node, за да остане всяко решение пред очите, и назовава това, което истинският сървър добавя. И не е курс по сигурност: преговаря двете защити, които таблото вече имаше срещу инжектиране на код (React и линтерът), и добавя третата, политиката за сигурност на съдържанието.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` на този урок. Контролната точка беше инсталирана от нулата с `npm ci` в копие извън хранилището, идентично файл по файл с контролната точка, и там `npm run lint`, `npm test` и `npm run build` завършиха с код 0: 35 от 35 теста в 11 файла (прочетено от обобщението на Vitest), `dist/assets/index-Cs1CcfeN.js` (името на пакета и изходите от 9.1 и 9.2 бяха измерени отново на 22 октомври 2026 г., на macOS) и `dist/assets/index-CbqUABMA.css`. Изходите на Vitest бяха взети с `--reporter=default`, което е това, което виждаш в терминала си. Петте поправки от 9.4 вече са в контролната точка. Червената им фаза беше измерена в **копие** на контролната точка без поправките, наречено `rojo`, и затова този изход казва `~/curso-react/rojo`; зелената фаза — в контролната точка. Това, което се вижда „в браузъра“, беше измерено с Chrome без графичен интерфейс (`--headless`): DOM на `/servicios/pagos` с `--dump-dom` и, за периодичното запитване и повторните опити, като страницата се отваряше за няколко секунди, докато тестовото API записваше всяка заявка. Тези изпълнения използваха портовете 3109 (API), 4109 (предварителен преглед и публикуван сървър) и 5109 (разработка) вместо 3100, 4173, 4180 и 5173, защото на машината по същото време работеха други неща; за да се насочи *proxy*-то за разработка към 3109, `vite.config.ts` беше променен в копията, а не в оригинала. Изходите показват портовете, които наистина са използвани; ти ще използваш тези на курса. Фигурите са в [`programas/09-rendimiento-publicacion/`](../programas/09-rendimiento-publicacion), до `revisor/`, със собствен `package.json`: компилират се с `tsc` и се изпълняват с `node`, както в предишните уроци, и добавят `@babel/core`, `babel-plugin-react-compiler` и `@types/convert-source-map`, които се инсталират в `~/curso-react/figuras/` с `npm install --save-dev --save-exact @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0 @types/convert-source-map@2.0.3` (последният, защото типовете на `@babel/core` 8.0.7 го импортират, а `tsc --strict` без `skipLibCheck` не се компилира без него). **Архивирани изходи.** До фигурите, в `programas/09-rendimiento-publicacion/`, са изходите от този урок, които могат да се повторят с една команда, изпълнени отново при прегледа му: `build.salida.txt`, `build-sin-compilador.salida.txt`, `secretos.grep.txt` (маркерите на компилатора и търсенето от 9.2.4), `preview.curl.txt`, `publicado.curl.txt` и `suite.vitest.txt`. Променят се само часовете и датите в заглавките. **Не са архивирани** и се измерват в едно-единствено изпълнение на урока без копие в `programas/`: червената фаза на 9.4 (изисква копие без поправките), логовете и изходът на DOM, измерени с Chrome (9.2.3, 9.4.1 и 9.4.3), изграждането със симулирани ключове от 9.2.4 и изходът на ESLint от „Грешката, която ще видиш“.

Контролната точка беше инсталирана от нулата и в контейнер с Linux (Debian 12, официален образ `node:24.22.0-bookworm`): `npm run build` даде същото име на файл, а `npm test` завърши с код 0 и `Tests  35 passed (35)`. След последната промяна на `PaginaServicio` (запазване на стария детайл, ако обновяване се провали) под macOS, срещу новата контролна точка, бяха повторени двете изграждания от 9.1.6, търсенията в `dist/` от 9.1.6 и 9.2.4, отговорите на `curl` и логът от 9.2.2 и 9.2.3, изходът на публикувания DOM и изграждането със симулирани ключове. Не беше изпълнено на истински Linux Mint; нищо от показаното не зависи от системата. Часовете в лога на сървърите са по UTC; тези на Vitest (`Start at`) — в местното време на машината. **Какво не беше измерено**, и това се казва там, където се появява: Profiler на инструментите за разработчици на React, който се чете с очите, и публикуваното табло зад продукционен уеб сървър. Дългите пътища се показват спрямо `~/curso-react`.

## След урока ще можеш да

- Измериш с `<Profiler>` колко пъти се рисува една част от дървото и колко време отнема, и да решиш с това число дали е нужно да се оптимизира.
- Премахнеш излишни рисувания чрез промяна на **структурата** (сваляне на състоянието надолу, подаване на JSX като `children`), преди да помислиш за мемоизиране (запазване на резултата от изчисление или рисуване, за да се преизползва, докато входовете му не се променят), и да покажеш с измерването, че е проработило.
- Включиш React Compiler 1.0 в проект на Vite, да разчетеш кода, който произвежда, и да провериш в `dist/`, че е действал.
- Обясниш защо `vite preview` не е продукционен сървър и да провериш с `curl`, че сървърът за публикуване пренаписва маршрутите на клиента към `index.html`, изпраща политиката за сигурност на съдържанието и кешира правилно всеки файл.
- Търсиш тайни в `dist/` и да **разчетеш** резултата, като различиш съвпадение от изтичане.
- Обясниш какво са Server Components и Server Functions, защо `revisor` не ги използва и кои сигнали биха показали, че си струва да се мигрира към framework.
- Напишеш, за дефект, открит при измерване, теста, който е червен преди поправката и зелен след нея.

## Защо, преди как

Трите съобщения от сцената са три различни въпроса и трите имат един и същ капан: на тях може да се отговори с мнение.

**„Изглежда бавно“.** Кое е бавно? Първото рисуване, писането в поле, смяната на страницата, отговорът на API? В `revisor` тестовото API отнема 300 ms, за да отговори с отчета, и 1.5 s за детайлите на `pagos`, нарочно. Ако това е, което „се усеща“, никой `useMemo` няма да го поправи, защото времето не се харчи в React. А ако времето наистина се харчи в React, трябва да се знае **в кой компонент** и **колко пъти**, защото мемоизирането на грешния компонент добавя код и не маха нищо. React има инструмент за измерването му и документацията изисква той да се използва преди мемоизиране. Този урок го използва.

**„Ако презаредя, ми дава 404“.** В Урок 5 видя защо: `/servicios/pagos` не е файл, а маршрут, който React Router решава в браузъра. Докато навигираш вътре в приложението, сървърът никога не разбира. Когато презаредиш, браузърът иска `/servicios/pagos` от сървъра, а файлов сървър, който не знае нищо за маршрутите на клиента, отговаря това, което е вярно за него: такъв файл не съществува. Предварителният преглед на Vite вече решава това и това обърква, защото кара да се мисли, че „в продукция ще работи по същия начин“. Документацията на Vite казва обратното: предварителният преглед не е продукционен сървър. Този, който публикува, трябва да реши какво отговаря всеки адрес.

**„Сложих голямо число и логът се напълни“.** Това не е проблем с производителността: това е дефект. `leerCadaMs` приема всяко положително цяло число и число, което изглеждаше като „почти никога“, завърши като „през цялото време“. Никой не го видя, докато някой не го измери. Раздел 9.4 събира пет дефекта като този, открити при измерването на таблото за този урок, и ги затваря с навика от Урок 8: първо червеният тест, после поправката, после зеленият тест.

Новите понятия са три: измерване и оставяне на компилатора да мемоизира (9.1), публикуване на това, което `vite build` оставя в `dist/` (9.2), и знание кога таблото би имало нужда от сървър на React (9.3). Раздел 9.4 е жътвата.

## Понятията

### 9.1 Измерване преди мемоизиране

#### 9.1.1 Колко струва едно излишно рисуване

Когато състоянието на компонент се промени, React го рисува отново (извиква функцията пак), а с него и всички компоненти, които той рисува вътре, макар props им да не са се променили. Видя го в Урок 1: рисуването е изчисляване на дърво, а после React сравнява това дърво с предишното и пипа DOM само там, където е имало разлики. Почти винаги това е евтино. Компонент, който връща четири `<li>`, се рисува за микросекунди, а рисуването му десет пъти в повече не се забелязва.

Забелязва се, когато се съберат две неща: **скъп** компонент (списък с хиляди редове, тежко изчисление, графика) и състояние, което се променя **често** (всеки клавиш, всяко движение на мишката) и живее **над** него. Документацията на `memo` го казва с изречение, което си струва да се запомни: оптимизирането с `memo` си струва само когато компонентът се рисува отново често с абсолютно същите props и рисуването му е скъпо; ако няма забележимо забавяне, `memo` е излишно ([React, `memo`](https://react.dev/reference/react/memo)). Двете условия се измерват. Нито едно не се отгатва.

#### 9.1.2 `<Profiler>`: измерване с програма

React има компонент за измерване: `<Profiler>`. Обвиваш част от дървото, даваш ѝ `id` и функция `onRender`, и React извиква тази функция всеки път, когато тази част от дървото бъде потвърдена (*commit*). Документацията изброява какво получава ([React, `<Profiler>`](https://react.dev/reference/react/Profiler)):

- `id`: този на `<Profiler>`, за да се знае кой е бил, ако имаш няколко;
- `phase`: `"mount"` първия път; `"update"`, когато е нарисуван отново заради промяна на props, на състоянието или на hooks; и `"nested-update"`, случай, който не се появява в този урок;
- `actualDuration`: милисекундите, изразходвани за рисуване на това поддърво при това обновяване; според документацията в идеалния случай спада значително след монтирането, ако мемоизацията работи;
- `baseDuration`: оценка колко би отнело рисуването на цялото поддърво без никаква оптимизация; сравняването ѝ с `actualDuration` казва дали мемоизацията върши работа;
- `startTime` и `commitTime`: времеви отметки.

Едно предупреждение от същата страница: измерването има цена, така че **Profiler е изключен в продукционното изграждане**. Измерваш по време на разработка или със специално изграждане на React, което го включва.

Фигура 1 възпроизвежда сцената от първото съобщение с минимално табло. То има поле за писане на бележка и списък, който се рисува за 20 ms; цената е нарочна, за да се вижда. Фигурата измерва списъка с `<Profiler>`, докато „пише“ думата `caído`, пет клавиша, в две версии на таблото. Във версия A черновата на бележката живее в таблото, което е родителят на списъка. Във версия B черновата слиза в собствен компонент, `CampoNota`, единственият, който я използва.

```tsx
// fig09_01.tsx
import { JSDOM } from "jsdom";
import { act, Profiler, useState, type ProfilerOnRenderCallback } from "react";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { createRoot } = await import("react-dom/client");

const SERVICIOS = ["catálogo", "pagos", "inventario", "reportes"];

// Gasta tiempo sin hacer nada útil: simula un dibujo caro. Sigue siendo impuro (lee el
// reloj); el linter no lo ve porque está en otra función. Se acepta solo porque no
// produce nada que se dibuje: nunca escondas así una impureza de verdad.
function gastar(ms: number): void {
  const hasta = performance.now() + ms;
  while (performance.now() < hasta) {
    // espera activa
  }
}

// Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
function ListaLenta() {
  gastar(20);
  return (
    <ul>
      {SERVICIOS.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

// Lo que mide el Profiler: cuántos dibujos hubo de la lista y cuánto tardaron.
const medidas: { fase: string; ms: number }[] = [];
const anotar: ProfilerOnRenderCallback = (_id, fase, duracionReal) => {
  medidas.push({ fase, ms: duracionReal });
};

function ListaMedida() {
  return (
    <Profiler id="lista" onRender={anotar}>
      <ListaLenta />
    </Profiler>
  );
}

// A. El borrador de la nota vive en el panel: cada tecla dibuja el panel completo.
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}

// B. Estructura primero: el borrador baja al único componente que lo usa.
function CampoNota() {
  const [borrador, establecerBorrador] = useState("");
  return <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />;
}

function PanelAbajo() {
  return (
    <>
      <CampoNota />
      <ListaMedida />
    </>
  );
}

function escribir(campo: HTMLInputElement, texto: string): void {
  const asignar = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, texto);
  campo.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
}

async function medir(titulo: string, Panel: () => React.ReactNode): Promise<void> {
  medidas.length = 0;
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => raiz.render(<Panel />));
  const campo = contenedor.querySelector("input");

  if (campo === null) {
    throw new Error("no hay campo");
  }

  let texto = "";
  for (const letra of "caído") {
    texto += letra;
    await act(async () => escribir(campo, texto));
  }

  const fases = medidas.map((medida) => medida.fase).join(", ");
  const lentas = medidas.filter((medida) => medida.ms >= 20).length;
  console.log(titulo);
  const veces = medidas.length === 1 ? "1 vez" : `${medidas.length} veces`;
  console.log(`  5 teclas → la lista se dibujó ${veces}: ${fases}`);
  console.log(`  dibujos de la lista que tardaron 20 ms o más: ${lentas}`);
  await act(async () => raiz.unmount());
  contenedor.remove();
}

await medir("A. el borrador vive en el panel:", PanelArriba);
await medir("B. el borrador vive en CampoNota:", PanelAbajo);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_01.tsx
$ node fig09_01.js
A. el borrador vive en el panel:
  5 teclas → la lista se dibujó 6 veces: mount, update, update, update, update, update
  dibujos de la lista que tardaron 20 ms o más: 6
B. el borrador vive en CampoNota:
  5 teclas → la lista se dibujó 1 vez: mount
  dibujos de la lista que tardaron 20 ms o más: 1
```

Прочети двете измервания спокойно, защото казват повече, отколкото изглежда:

- **Във версия A** пет клавиша произведоха шест рисувания на списъка: монтирането и по едно за всеки клавиш. Всяко отне колкото отнема списъкът, 20 ms или повече. Списъкът никога не се промени (винаги са същите четири услуги), но беше нарисуван отново, защото родителят му смени състоянието си. Ако списъкът отнемаше 200 ms, всеки клавиш би замразявал екрана за една пета от секундата: това е „изглежда бавно“.
- **Във версия B** списъкът беше нарисуван веднъж, при монтирането. Писането промени състоянието на `CampoNota` и React нарисува отново само `CampoNota`, защото списъкът не е негово дете. Нямаше `memo`, нито `useMemo`, нито компилатор: имаше състояние, поставено на правилното място.

Обърни внимание на детайла с `gastar`: изчакването живее в отделна функция. Първата версия на фигурата го имаше вътре в `ListaLenta` и линтерът го отхвърли. Преместването му **не го прави чисто**: `gastar` продължава да чете часовника по време на рисуването, а линтерът вече не го вижда само защото не проверява вътре във функциите, които извикваш. Приема се тук, защото фигурата симулира цена и не рисува нищо, което зависи от часовника; коментарът в кода го казва. Ще го видиш изцяло в „Грешката, която ще видиш“.

#### 9.1.3 Profiler на инструментите за разработчици

`<Profiler>` е за измерване с програма. За да се разгледа цяло приложение, съществува разделът **Profiler** на инструментите за разработчици на React (React Developer Tools, разширението за браузъра). Той записва това, което се случва, докато използваш страницата, и ти рисува всеки *commit* като стълбовидна диаграма: кои компоненти са нарисувани, колко е отнел всеки и, ако включиш опцията за записване защо е нарисуван всеки компонент, причината (променил се е prop, променило се е състоянието, променил се е hook, нарисуван е родителят). Документацията на `memo` праща там, когато едно взаимодействие все още изглежда бавно: използвай Profiler, за да видиш кои компоненти биха спечелили най-много от мемоизиране, и мемоизирай само тях ([React, `memo`](https://react.dev/reference/react/memo)).

Това измерване **не беше изпълнено за урока**: Profiler на разширението се чете с очите и автоматично изпълнение не може да го провери. Стъпките, за да го направиш ти, са в упражнение 1, а начинът да разбереш дали си успял — в „Как разбирам, че съм успял“.

#### 9.1.4 Структурата на първо място

Версия B на фигурата не е трик: тя е втората от пет препоръки, които документацията на `memo` дава, за да стане по-голямата част от мемоизацията ненужна ([React, `memo`](https://react.dev/reference/react/memo)). Петте, с това, което означават в `revisor`:

1. **Ако един компонент визуално обвива други, нека ги получава като `children`.** Когато обвивката промени собственото си състояние, React знае, че децата, дошли като `children`, няма нужда да се рисуват отново, защото ги е създал друг компонент. Това е `Tarjeta`, от Урок 1.
2. **Предпочитай локалното състояние и не го качвай повече от нужното.** Черновата на бележка е на `EditorNota`, а не на страницата; от Урок 2 живее там и затова писането на бележка не рисува списъка. Фигура 1 е тази точка, измерена.
3. **Поддържай рисуването чисто.** Ако повторното рисуване причинява видим проблем, това е дефект на компонента и се поправя, а не се прикрива с мемоизация. Целият Урок 1 е за това.
4. **Избягвай Effects, които само обновяват състояние.** Документацията казва, че повечето проблеми с производителността в приложенията на React идват от вериги от обновявания, които излизат от Effects и рисуват компонентите отново и отново. Урок 3 научи как да се разпознават излишните Effects.
5. **Махни ненужните зависимости от Effects.** С TanStack Query, от Урок 4, таблото вече няма собствени Effects за извличане на данни.

Затова курсът не сложи `useMemo` в нито един урок. Това не беше пропуск: всеки път, когато изкушението се появяваше, структурата вече беше премахнала излишното рисуване. Принципът, който минава през курса, „първо се измерва, после се оптимизира“, не казва „никога не мемоизирай“; казва, че мемоизацията е инструмент с цена (по-труден за четене код, зависимости, които трябва да се поддържат актуални и които могат да я счупят) и че измерването решава кога си струва тази цена.

#### 9.1.5 React Compiler 1.0: мемоизацията, която не пишеш

Има още един път и контролната точка го поема. React Compiler е инструмент за изграждане, който мемоизира компонентите и hooks сам: чете кода ти, разбира правилата на React и пише еквивалента на `memo`, `useMemo` и `useCallback` там, където са нужни ([React, „Introduction to React Compiler“](https://react.dev/learn/react-compiler/introduction)). Първата му стабилна версия, 1.0, излезе на 7 октомври 2025 г.; съобщението казва, че вече е изпитан в големи приложения на Meta и е готов за продукция ([React, „React Compiler v1.0“](https://react.dev/blog/2025/10/07/react-compiler-1)). За нов код документацията препоръчва мемоизацията да се остави на компилатора, а `useMemo` или `useCallback` да се използват там, където е нужен прецизен контрол, например мемоизирана стойност, която е зависимост на Effect.

В проект на Vite той се включва като *preset* на Babel. Документацията за инсталация дава точно тази форма за `@vitejs/plugin-react` 6 или по-нова ([React, „Installation“](https://react.dev/learn/react-compiler/installation)) и това е основната промяна в конфигурацията на контролната точка (редовете с `css` вътре в `test` се обясняват в 9.4.4):

```ts
// revisor/vite.config.ts
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
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
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
});
```

С три нови зависимости за разработка, фиксирани с точна версия: `@rolldown/plugin-babel` 0.2.4 (*plugin*-ът, който изпълнява Babel вътре в изграждането на Vite), `@babel/core` 8.0.7 и `babel-plugin-react-compiler` 1.0.0. Инсталират се от `~/curso-react/revisor/`:

```bash
npm install --save-dev --save-exact @rolldown/plugin-babel@0.2.4 @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0
```

В `package.json` се променят още две неща: `"version": "0.9.0"`, както във всеки урок, и новият скрипт от 9.2.3, `"publicado": "node servidor/publicar.ts"`. README на `@vitejs/plugin-react` споменава и нативен път, без Babel, но го отбелязва като експериментален и контролната точка не го използва.

Какво пише компилаторът? Фигура 2 го пита директно. Тя подава на Babel, с *plugin*-а на компилатора, таблото A от фигура 1 като текст, а освен това и компонент, който нарушава правило на React: променя обект, който е получил като prop.

```ts
// fig09_02.ts
import { transformAsync } from "@babel/core";

// El panel A de la figura 1, tal cual, como texto: lo que el compilador recibe.
const panel = `
function PanelArriba() {
  const [borrador, establecerBorrador] = useState("");
  return (
    <>
      <input aria-label="Nota" value={borrador} onChange={(e) => establecerBorrador(e.target.value)} />
      <ListaMedida />
    </>
  );
}
`;

// Un componente que rompe una regla de React: cambia un objeto que recibió como prop.
const impuro = `
function FilaContada({ estado }) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
`;

async function compilar(titulo: string, codigo: string): Promise<void> {
  const resultado = await transformAsync(codigo, {
    filename: "panel.jsx",
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["jsx"] },
    plugins: [["babel-plugin-react-compiler", {}]],
  });
  console.log(`=== ${titulo}`);
  console.log(resultado?.code ?? "(sin salida)");
}

await compilar("el panel A, compilado", panel);
await compilar("un componente impuro, compilado", impuro);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_02.ts
$ node fig09_02.js
=== el panel A, compilado
import { c as _c } from "react/compiler-runtime";
function PanelArriba() {
  const $ = _c(6);
  const [borrador, establecerBorrador] = useState("");
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = e => establecerBorrador(e.target.value);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== borrador) {
    t1 = <input aria-label="Nota" value={borrador} onChange={t0} />;
    $[1] = borrador;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <ListaMedida />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1) {
    t3 = <>{t1}{t2}</>;
    $[4] = t1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}
=== un componente impuro, compilado
function FilaContada({
  estado
}) {
  estado.vecesDibujada = (estado.vecesDibujada ?? 0) + 1;
  return <li>{estado.nombre}</li>;
}
```

Компилираното табло се чете отгоре надолу:

- `const $ = _c(6)` иска от React кеш с шест клетки за този компонент. `_c` идва от `react/compiler-runtime`, който React 19 вече има.
- Функцията на `onChange` (`t0`) се създава само веднъж: клетката `$[0]` започва със специална стойност, `Symbol.for("react.memo_cache_sentinel")`, която означава „все още празна“; първия път функцията се запазва, а следващите пъти се преизползва. Това е `useCallback`, който не си написал.
- `<input>` (`t1`) се създава отново само ако `borrador` се е променило.
- `<ListaMedida />` (`t2`) се създава **само веднъж**, защото не зависи от нищо. Когато React намери в новото дърво абсолютно същия елемент като в предишното, не рисува отново този компонент. Компилаторът постигна същото като версия B от фигура 1, без да мести състоянието.

Вторият резултат е също толкова важен: **нечистият компонент излезе непокътнат**. Няма `_c`, нито кеш, нито предупреждение. Документацията обяснява това: когато компилаторът намери код, който би могъл да наруши правилата на React, той пропуска оптимизацията, вместо да рискува да промени поведението на приложението ти ([React, „Debugging and Troubleshooting“](https://react.dev/learn/react-compiler/debugging)). Компилаторът не поправя нечист компонент; оставя го какъвто си е, а този, който го открива, е линтерът, който от `eslint-plugin-react-hooks` 7 включва правилата на компилатора в препоръчаната си конфигурация.

#### 9.1.6 Проверка, че компилаторът е действал в `revisor`

Конфигурация, която не се проваля, не доказва, че нещо работи. Документацията за инсталация предлага две проверки: значката „Memo ✨“ до компонентите в инструментите за разработчици и търсене в изградения код на логиката, която компилаторът добавя. Втората може да се изпълни. Това е изграждането на контролната точка:

```text
$ npm run build
> revisor@0.9.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 193 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-Cs1CcfeN.js   374.65 kB │ gzip: 117.28 kB

✓ built in 282ms
```

А това е изграждането на идентично копие с една-единствена разлика: във `vite.config.ts` — `plugins: [react()]`, без компилатора.

```text
$ npx vite build
...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-DuGgkiHN.js   367.32 kB │ gzip: 114.56 kB
```

Същата проба, направена преди петте поправки от 9.4, даде без компилатора `index-WLyq37jn.js`: същото име, което тогава произвеждаха контролните точки 7 и 8, защото дотогава кодът на приложението беше идентичен с този от онези уроци, байт по байт. След това измерване контролните точки 7, 8 и 9 промениха едно условие в `PaginaServicio` (запазване на стария детайл, ако обновяване се провали), а 7 и 8 сега се казват `index-C_lOH5GL.js`; сравнението с 9 отпреди поправките не беше повторено. Сега се броят маркерите на компилатора във всеки:

```text
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # con el compilador
      18
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # sin el compilador
       1
```

Без компилатора има един, който идва от React DOM: това е константата `Symbol.for("react.memo_cache_sentinel")`, с която React отбелязва отвътре все още празен кеш (измерено: появява се в `react-dom-client.production.js`, а не в `compiler-runtime` на React, който само иска кеша). С компилатора са 18: същият плюс 17, които добави компилаторът, по един за всяка стойност, която той запазва първия път и вече не изчислява отново, защото не зависи от нищо, като `t0` и `t2` във фигура 2. Това не е броят на клетките: в този пакет компилаторът поиска 24 кеша (24 извиквания на `c(…)`, `_c` от фигурата, вече минимизирана) с общо 255 клетки, измерено чрез сумиране на аргументите им. За да разбереш дали е действал, е достатъчно числото да се увеличи. Едно предупреждение за измерването: `grep -c` **не** върши работа за това, защото брои **редове** със съвпадения, а не съвпадения, а минимизираният JavaScript има почти всичко в малко редове. Измерено върху същия файл, `grep -c memo_cache_sentinel` казва `2`: 18-те маркера са на два реда. Число, което излиза без грешка, не е правилно число.

И още една сметка, която документацията няма да ти даде: мемоизацията не е безплатна дори в байтове. Пакетът нарасна от 367.32 kB на 374.65 kB (от 114.56 на 117.28 kB компресиран): 7.33 kB повече код, който работи при всяко рисуване, за да реши какво да преизползва. В `revisor`, където нито един компонент не е скъп, това почти сигурно е малка загуба, а не печалба; контролната точка го включва, защото планът на курса изисква компилаторът да се преподаде и защото 35-те теста минават и с него, а не защото измерване го е поискало. **Това е решение по принцип и се казва като такова.** В приложение с дълги списъци или фини взаимодействия сметката се обръща, а съобщението за версия 1.0 отчита подобрения до 12 % при зареждания и навигации в приложения на Meta ([React, „React Compiler v1.0“](https://react.dev/blog/2025/10/07/react-compiler-1)).

### 9.2 Публикуване

#### 9.2.1 Какво остава в `dist/`

`npm run build` прави две неща, подред: `tsc -b`, който проверява типовете и не генерира JavaScript (оставя само файл със състояние в `node_modules/.tmp/`, за да е по-бърза следващата проверка), и `vite build`, който пакетира. Това, което остава в `dist/`, са три файла: `index.html`, който сочи към един JavaScript и един файл със стилове, а тези два — в `dist/assets/`, с парче от съдържанието си в името (`Cs1CcfeN`, `CbqUABMA`). Това парче се променя всеки път, когато се промени съдържанието, и то позволява агресивно кеширане: браузърът може да пази `index-Cs1CcfeN.js` цяла година, защото ако кодът се промени, новият файл ще се казва различно. Този, който **не** може да се пази, без да се пита, е `index.html`, защото той казва кои файлове са актуални днес.

`dist/` е всичко, което се публикува. Няма сървър на React, нито Node, нито нещо, което се изпълнява от страната на сървъра: това са статични файлове. Документацията на Vite го казва така: можеш да разгърнеш папката `dist` на платформата, която предпочиташ ([Vite, „Deploying a Static Site“](https://vite.dev/guide/static-deploy)). Това, което това изречение не казва, е какво трябва да прави тази платформа, и там започват проблемите.

#### 9.2.2 `vite preview` не е продукционен сървър

`npm run preview` стартира сървър, който сервира `dist/` на порт 4173. Документацията на Vite е изрична за какво: той е за предварителен преглед на изграждането на твоята машина и **не е предназначен като продукционен сървър** ([Vite, „Deploying a Static Site“](https://vite.dev/guide/static-deploy)). В Урок 5 видя, че той наистина връща `index.html`, когато презаредиш маршрут на клиента. Тогава какво му липсва? Измерва се. Три въпроса към предварителния преглед на контролната точка:

```text
$ npx vite preview --port 4109 --strictPort
$ curl -sI http://localhost:4109/servicios/pagos
HTTP/1.1 200 OK
Vary: Origin
Content-Type: text/html
Cache-Control: no-cache
Etag: W/"188-NTjMluUw3sCMmwdKb29psG22o7w"
Date: Thu, 22 Oct 2026 19:29:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4109/assets/no-existe.js
200 text/html
$ curl -sI http://localhost:4109/assets/index-Cs1CcfeN.js | grep -i "cache-control\|content-type"
Content-Type: text/javascript
Cache-Control: no-cache
```

Три находки и нито една не е грешка на Vite, защото предварителният преглед не обещава нищо от това:

1. **Няма политика за сигурност на съдържанието.** Отговорът не носи `Content-Security-Policy`. Ако някой ден в страницата се промъкне чужд HTML (9.2.5), браузърът няма никакво правило, за да откаже да го изпълни.
2. **Файл, който не съществува, отговаря с `200` и HTML.** Поиска `/assets/no-existe.js` и предварителният преглед ти даде `index.html`. Представи си, че публикуваш нова версия, докато някой има отворена старата, и страницата му поиска JavaScript, който вече го няма: вместо ясно `404` браузърът получава HTML там, където е очаквал JavaScript, и се проваля с грешка за типа съдържание, която никой не разбира. Пренаписването е правилно за маршрутите на клиента и грешно за файловете.
3. **JavaScript-ът с име от съдържанието не се кешира.** `no-cache` в `index-Cs1CcfeN.js` задължава браузъра да пита всеки път, макар този файл никога да не може да се промени.

#### 9.2.3 Сървърът за публикуване на `revisor`

Контролната точка носи собствен сървър, `servidor/publicar.ts`, от 146 реда, който сервира `dist/` и решава точно тези три неща. Не е за това да го използваш както е в продукция: той е, за да видиш всяко решение, което истинският сървър (nginx, Caddy, този на хостинг платформата ти) трябва да вземе, написано на език, който вече четеш. Стартира се с нов скрипт, `"publicado": "node servidor/publicar.ts"`, на порт 4180, и препраща `/api/*` към тестовото API, както *proxy*-то на Vite по време на разработка.

```ts
// revisor/servidor/publicar.ts
// Servidor de la versión publicada del `revisor` (Lección 9). Sirve lo que
// `npm run build` dejó en dist/, con tres cosas que `vite preview` no garantiza:
//   1. Reescritura: una ruta del cliente (/servicios/pagos) responde index.html.
//   2. Encabezados de seguridad: CSP sin 'unsafe-inline' y nosniff.
//   3. Una lista CERRADA de archivos: solo se entrega lo que había en dist/ al
//      arrancar; ninguna ruta que escriba el cliente se convierte en una ruta de disco.
// Las peticiones a /api se reenvían a la API (API_URL), como hacía el proxy de Vite.
import { readdir, readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PUERTO = Number(process.env.PUERTO ?? "4180");
const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100";
const RAIZ = fileURLToPath(new URL("../dist/", import.meta.url));

const TIPOS: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const POLITICA = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "connect-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

function registrar(linea: string): void {
  console.log(`${new Date().toISOString().slice(11, 23)} ${linea}`);
}

async function listarArchivos(carpeta: string): Promise<Map<string, Buffer>> {
  const archivos = new Map<string, Buffer>();
  const entradas = await readdir(carpeta, { recursive: true, withFileTypes: true });

  for (const entrada of entradas) {
    if (entrada.isFile()) {
      const ruta = join(entrada.parentPath, entrada.name);
      archivos.set(`/${relative(carpeta, ruta).split(sep).join("/")}`, await readFile(ruta));
    }
  }

  return archivos;
}

function enviar(
  respuesta: ServerResponse,
  codigo: number,
  tipo: string,
  cuerpo: Buffer | string,
  cache: string,
): void {
  respuesta.writeHead(codigo, {
    "content-type": tipo,
    "cache-control": cache,
    "content-security-policy": POLITICA,
    "x-content-type-options": "nosniff",
  });
  respuesta.end(cuerpo);
}

const archivos = await listarArchivos(RAIZ);
const indice = archivos.get("/index.html");

if (indice === undefined) {
  registrar("no existe dist/index.html: corre `npm run build` antes de `npm run publicado`");
  process.exit(1);
}

const servidor = createServer((solicitud, respuesta) => {
  const url = new URL(solicitud.url ?? "/", "http://revisor.local");
  const metodo = solicitud.method ?? "?";

  respuesta.once("finish", () => registrar(`${metodo} ${url.pathname} ${respuesta.statusCode}`));

  if (url.pathname.startsWith("/api/")) {
    const cuerpo = metodo === "GET" || metodo === "HEAD" ? undefined : solicitud;

    fetch(new URL(url.pathname + url.search, API_URL), {
      method: metodo,
      headers: { "content-type": solicitud.headers["content-type"] ?? "application/json" },
      body: cuerpo,
      duplex: "half",
    } as RequestInit)
      .then(async (deLaApi) => {
        respuesta.writeHead(deLaApi.status, {
          "content-type": deLaApi.headers.get("content-type") ?? "application/json",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        });
        respuesta.end(Buffer.from(await deLaApi.arrayBuffer()));
      })
      .catch(() => {
        respuesta.writeHead(502, { "content-type": "application/json; charset=utf-8" });
        respuesta.end(JSON.stringify({ detalle: "la API no responde" }));
      });
    return;
  }

  if (metodo !== "GET" && metodo !== "HEAD") {
    respuesta.writeHead(405, { allow: "GET, HEAD" });
    respuesta.end();
    return;
  }

  const archivo = archivos.get(url.pathname);

  if (archivo !== undefined && url.pathname !== "/index.html") {
    const inmutable = url.pathname.startsWith("/assets/");
    enviar(
      respuesta,
      200,
      TIPOS[extname(url.pathname)] ?? "application/octet-stream",
      archivo,
      inmutable ? "public, max-age=31536000, immutable" : "no-cache",
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    enviar(respuesta, 404, "text/plain; charset=utf-8", "no existe", "no-store");
    return;
  }

  // Reescritura: cualquier otra ruta es del cliente, y la decide React Router.
  enviar(respuesta, 200, TIPOS[".html"] ?? "text/html", indice, "no-cache");
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  registrar(`revisor publicado en http://127.0.0.1:${PUERTO} (API en ${API_URL})`);
});

for (const senal of ["SIGINT", "SIGTERM"] as const) {
  process.once(senal, () => {
    servidor.close(() => registrar("servidor detenido"));
    servidor.closeAllConnections();
  });
}
```

Това, което трябва да се разбере, решение по решение:

- **Пътят до `dist/` идва от `fileURLToPath`.** `import.meta.url` е адрес `file:///…`, а свойството `pathname` на `URL` оставя интервалите и ударенията кодирани (`Mis%20cursos`), което не е път на диска: с папката ти в `~/Mis cursos/` сървърът би се провалил с `ENOENT`, без да каже защо. `fileURLToPath` ([Node.js, `url`](https://nodejs.org/api/url.html#urlfileurltopathurl)) декодира. Измерено беше: със сървъра, копиран в папка с име „con espacios y acentós“, `pathname` не намира `dist/`, а `fileURLToPath` го намира.
- **Затворен списък с файлове.** При стартиране `listarArchivos` чете **целия** `dist/` в паметта, в `Map`, чийто ключ е публичният път (`/assets/index-Cs1CcfeN.js`). След това никоя заявка не пипа диска: сървърът търси адреса в `Map` и ако го няма, той не съществува. Така никой адрес, написан от някого (`/../../etc/passwd`, например), не се превръща в път до файл. Това е най-простата защита срещу обхождане на директории (path traversal), защото атаката няма къде да се приложи.
- **Пренаписването, с едно изключение.** Всеки адрес, който не е файл, отговаря с `index.html`, за да реши React Router; **с изключение на** тези, които започват с `/assets/`, които отговарят с `404`. Там липсващ файл наистина е грешка и това се казва.
- **Политиката за сигурност на съдържанието.** `default-src 'none'` забранява всичко, а всяка следваща директива отваря само необходимото: скриптове, стилове, изображения и връзки от същия произход (`'self'`), формуляри, които се изпращат само към същия произход, нито един таг `<base>` и нито един сайт, който може да сложи таблото в `<iframe>`. Няма `'unsafe-inline'`: `<script>`, написан вътре в HTML, не се изпълнява. Изграждането на Vite не слага нито един вграден скрипт в `index.html` и затова тази политика не чупи таблото.
- **`nosniff`.** Казва на браузъра да вярва на `content-type`, който декларира сървърът, и да не се опитва да го отгатне по съдържанието.
- **Кеширане според типа файл.** `/assets/*` носи `public, max-age=31536000, immutable`: една година и обещание, че няма да се промени. `index.html` носи `no-cache`: браузърът може да го пази, но трябва да попита, преди да го използва. Този сървър не изпраща `ETag`, нито `Last-Modified`, така че това „питане“ винаги завършва с пълно изтегляне: това са 392 байта и няма значение; продукционният сървър добавя валидатора и отговаря с `304`, когато файлът не се е променил.

При работещи тестово API и сървър за публикуване — шест въпроса:

```text
$ PUERTO=3109 npm run servidor
$ PUERTO=4109 API_URL=http://127.0.0.1:3109 npm run publicado
$ curl -sI http://127.0.0.1:4109/servicios/pagos
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
content-security-policy: default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
x-content-type-options: nosniff
Date: Thu, 22 Oct 2026 19:29:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/assets/no-existe.js
404 text/plain; charset=utf-8
$ curl -sI http://127.0.0.1:4109/assets/index-Cs1CcfeN.js | grep -i cache-control
cache-control: public, max-age=31536000, immutable
$ curl -s --path-as-is -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:4109/../../etc/passwd
200 text/html; charset=utf-8
$ curl -s -X POST -H "content-type: application/json" -d '{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}' -w " → %{http_code}\n" http://127.0.0.1:4109/api/servicios
{"nombre":"correo","tipo":"disponible","codigoHttp":200,"duracionMs":75} → 201
$ curl -sI http://127.0.0.1:4109/favicon.ico | head -3
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
cache-control: no-cache
```

Първият е презареждането от сцената, решено: `200` с `index.html`, политиката и `no-cache`. Вторият е липсващият файл: `404`, вече не маскиран HTML. Третият — дългото кеширане. Четвъртият заслужава внимателно четене: `--path-as-is` иска от `curl` да **не** почиства `..` и да ги изпрати както са, както би направил някой, който се опитва да излезе от папката. Сървърът отговори с `200` и `index.html`, а не със системния файл. Логът на сървъра казва защо:

```text
19:29:32.997 revisor publicado en http://127.0.0.1:4109 (API en http://127.0.0.1:3109)
19:29:34.967 HEAD /servicios/pagos 200
19:29:34.976 GET /assets/no-existe.js 404
19:29:34.985 HEAD /assets/index-Cs1CcfeN.js 200
19:29:34.992 GET /etc/passwd 200
19:29:35.314 POST /api/servicios 201
19:29:35.322 HEAD /favicon.ico 200
19:29:36.676 GET /servicios/pagos 200
19:29:36.683 GET /assets/index-CbqUABMA.css 200
19:29:36.684 GET /assets/index-Cs1CcfeN.js 200
19:29:36.720 GET /favicon.ico 200
19:29:38.213 GET /api/servicios/pagos 200
```

`new URL()` нормализира `/../../etc/passwd` до `/etc/passwd`, което не е в `Map`, така че е „маршрут на клиента“ и отговаря с `index.html`. Две наслагани защити: нормализирането на URL и затвореният списък. А петият въпрос, `POST` на регистрацията, стигна до API чрез препращането със своя `201`. Шестият, `/favicon.ico`, ще ти трябва в упражнение 3; не го чети още.

Последните пет реда в лога са Chrome без графичен интерфейс, който отваря `/servicios/pagos` в публикувания сървър: иска страницата, файла със стилове, JavaScript-а и иконата на раздела, а при вече работещ React — детайлите от API. Това е `#raiz`, който нарисува, със заглавната част, празната лента и детайлите на `pagos`:

```text
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a><a class="" href="/servicios/nuevo" data-discover="true">Dar de alta</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header><section class="bandeja" aria-label="Avisos"><div role="status" aria-atomic="false"></div></section><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><dl><dt>Estado</dt><dd>En falla: HTTP 503</dd><dt>Revisiones</dt><dd>0</dd><dt>Última revisión</dt><dd>2026-10-22T19:29:17.619Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre pagos<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

Заглавието на раздела, в `<head>` на същия изход, беше `pagos · Revisor`: Effect-ът на `useTituloDocumento` от Урок 3, който работи в публикуваната версия, с включена политика за сигурност.

Това, което този сървър **не** прави, а продукционният сървър прави: HTTPS, компресия (gzip или brotli), логове с ротация, ограничения за размер и време на заявките и самостоятелно рестартиране, ако падне. За това се слага nginx, Caddy или платформата по твой избор отпред или на негово място, със същите правила: пренаписване без `/assets/`, същата политика и същото кеширане. Правилата са това, което този раздел преподава; програмата, която ги прилага, може да се смени.

#### 9.2.4 `VITE_` без тайни, сега в публикуваното

Урок 0 го доказа по време на разработка: това, което започва с `VITE_`, остава записано в JavaScript-а, който всеки изтегля, а това, което не започва така, не стига ([Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode)). При публикуването кръгът се затваря с един навик: **преди публикуване се търси в `dist/`**. Върху контролната точка:

```text
$ grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js dist/index.html | sort | uniq -c
   1 dist/assets/index-Cs1CcfeN.js:clave
   3 dist/assets/index-Cs1CcfeN.js:password
$ grep -ioE ".{60}password.{60}" dist/assets/*.js
datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0
.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Qr=An&&`
===`http:`||t.protocol===`https:`)return t.username!==``||t.password!==``?{ok:!1,detalle:`quita el usuario y la clave de la dire
```

Четири съвпадения, на два реда от файла (`grep -c` би казал `2`), и нито едно не е изтичане. Две са код на React DOM, който изброява типовете `<input>` (`email`, `number`, `password`, `url`…), за да знае как да третира всеки. Другите две са от самия `revisor`: схемата на регистрацията от Урок 7 чете `url.password`, за да отхвърли адрес с потребител или парола, а съобщението ѝ казва „quita el usuario y la clave de la dirección“. Важната поука не е числото: **резултатът от търсене се чете, а не се брои**. Нула съвпадения също не би доказало нищо, защото истински ключ почти никога не се казва `clave`.

Затова търсенето, което наистина върши работа, е това на **стойностите**. За да го видиш, копие на контролната точка чете две променливи, които не би трябвало (една с префикс и една без), декларира ги във `vite-env.d.ts` и ги отпечатва и двете от `main.tsx`, за да не ги изхвърли изграждането:

```ts
// fragmento: la copia, al final de src/configuracion.ts
// ⛔ SOLO PARA LA DEMOSTRACIÓN: una clave en una variable VITE_ y otra sin el prefijo.
export const claveConPrefijo = import.meta.env.VITE_CLAVE_MONITOREO;
export const claveSinPrefijo = import.meta.env.CLAVE_MONITOREO;

// fragmento: la copia, en src/vite-env.d.ts, dentro de ImportMetaEnv
  readonly VITE_CLAVE_MONITOREO?: string;
  readonly CLAVE_MONITOREO?: string;

// fragmento: la copia, en src/main.tsx, después de los import
import { claveConPrefijo, claveSinPrefijo } from "./configuracion";

console.info("monitoreo:", claveConPrefijo, claveSinPrefijo);
```

И се изгражда със симулирани стойности:

```text
$ VITE_CLAVE_MONITOREO=mon_prueba_7f3a91 CLAVE_MONITOREO=mon_secreta_c0ffee npm run build
...
dist/assets/index-DfHw2mrm.js   374.71 kB │ gzip: 117.32 kB
$ grep -o '.\{30\}mon_prueba_7f3a91.\{10\}' dist/assets/*.js
s?t:ds}var hs=ms(`10000`),gs=`mon_prueba_7f3a91`;async fu
$ grep -c mon_secreta_c0ffee dist/assets/*.js
0
```

Тази с `VITE_` остана записана до `ms(`10000`)`, което е `leerCadaMs` със стойността от `.env`. Другата — не. Ако екипът ти пази истинските стойности на ключовете си в мениджър на тайни, търсенето, което има стойност, е това: да вземеш всяка стойност и да я потърсиш в `dist/`. Ако се появи, ключът вече не е таен и трябва да се смени, а не само да се махне от пакета.

#### 9.2.5 Преговор на XSS: три слоя

Курсът по TypeScript показа атаката: ако страница вмъкне като HTML текст, дошъл отвън, този текст може да носи `<script>` или `onerror`, които да се изпълнят с правата на този, който е отворил страницата. Това се нарича *cross-site scripting* (XSS). В `revisor` „отвън“ е API: имената на услугите ги пише този, който регистрира, и те стигат до екрана на всички. Фигура 3 подава на React име на услуга с атака и адрес `javascript:` във връзка:

```tsx
// fig09_03.tsx
import { renderToStaticMarkup } from "react-dom/server";

// Lo que un atacante escribiría como nombre de servicio, si la API se lo dejara pasar.
const nombre = '<img src=x onerror="alert(1)">';
const enlace = "javascript:alert(1)";

// Los avisos de React salen por console.error: se imprimen recortados al primer renglón.
console.error = (formato: unknown) => {
  console.log(`  [aviso de React] ${String(formato).split("\n")[0]}`);
};

console.log("1. texto como hijo de JSX:");
console.log(`  ${renderToStaticMarkup(<strong>{nombre}</strong>)}`);

console.log("2. texto en un atributo:");
console.log(`  ${renderToStaticMarkup(<li title={nombre}>pagos</li>)}`);

console.log("3. una URL javascript: en href:");
console.log(`  ${renderToStaticMarkup(<a href={enlace}>pagos</a>)}`);
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig09_03.tsx
$ node fig09_03.js
1. texto como hijo de JSX:
  <strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong>
2. texto en un atributo:
  <li title="&lt;img src=x onerror=&quot;alert(1)&quot;&gt;">pagos</li>
3. una URL javascript: en href:
  <a href="javascript:throw new Error(&#x27;React has blocked a javascript: URL as a security precaution.&#x27;)">pagos</a>
```

Обърни внимание, че в това изпълнение не излезе нито едно `[aviso de React]`: React 19.3.1 замени адреса, без да отпечата нищо в `console.error`. Прихващането отгоре остава, за да го видиш сам.

**Първи слой: React екранира текста.** В случаи 1 и 2 `<img onerror>` пристигна като текст: `&lt;img …&gt;`. Браузърът го изрисува като букви и не създава никакво изображение. Това се случва винаги, когато стойността е дете в JSX или стойност на текстов атрибут (`title`, `aria-label`, `value`), а точно така `revisor` рисува всичко. Атрибутите, които браузърът третира като адрес или като документ (`href`, `src`, `formAction`, `srcDoc` на `<iframe>`), са друга история: екранирането не ги защитава, защото опасният адрес не носи нито един символ за екраниране. React 19 блокира `javascript:`, както показва случай 3, но останалото не го проверява. Адрес, който идва отвън, се валидира, преди да се използва, например като се изисква да започва с `https://`, както прави схемата на регистрацията от Урок 7 с `urlHttp`. Входната точка, която React предлага за вмъкване на HTML, е `dangerouslySetInnerHTML` (извън React, с `ref`, остават и `innerHTML`, `outerHTML` и `insertAdjacentHTML`; правилото на линтера от Урок 0 покрива първите две, а другите две се проверяват на око), а документацията на React го казва без заобикалки: ако HTML не е надежден, например ако се основава на потребителски данни, рискуваш XSS уязвимост ([React, общи компоненти](https://react.dev/reference/react-dom/components/common)). В случай 3 React 19 замени адреса `javascript:` с такъв, който хвърля грешка: „React has blocked a javascript: URL as a security precaution“. React 16.9 беше обявил, че ще го направи в бъдеща голяма версия ([React, „React v16.9.0“](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html)); фигурата показва, че 19.3.1 вече го прави.

**Втори слой: линтерът.** `eslint.config.js` на `revisor` носи от Урок 0 правило `no-restricted-syntax`, което отхвърля `dangerouslySetInnerHTML` и присвояванията на `innerHTML`. Ако някой го отвори, `npm run lint` става червен и проверката на курса не минава.

**Трети слой: политиката за сигурност на съдържанието.** Ако първите две се провалят (библиотека, която вмъква HTML сама, недоглеждане), политиката на сървъра за публикуване все още забранява изпълнението на скриптове, които не идват от файл от същия произход. `onerror`, написан в HTML, е вграден код и без `'unsafe-inline'` браузърът не го изпълнява. Това е единственият от трите слоя, който **не** живее в кода ти: живее в сървъра. Затова е важно кой публикува и как.

### 9.3 Server Components, Server Functions и кога е нужен framework

#### 9.3.1 Какво са

Всичко, което `revisor` рисува, го рисува браузърът. React 19 има и друга възможност. **Server Components** са компоненти, които се рисуват предварително, в среда, отделена от приложението в браузъра: могат да се изпълняват веднъж при изграждане, на сървъра за непрекъсната интеграция, или при всяка заявка, на уеб сървър ([React, „Server Components“](https://react.dev/reference/rsc/server-components)). Тъй като работят на сървъра, могат да четат директно база данни или файл, без API по средата, а това, което стига до браузъра, е вече нарисуваният резултат, а не кодът, който го е произвел. **Server Functions** са обратният път: асинхронни функции, които се изпълняват на сървъра и които компонент в браузъра може да извика. Отбелязват се с директивата `"use server"`; framework-ът създава референция, която пътува към браузъра, и при извикването ѝ React изпраща заявка към сървъра, за да я изпълни, и връща резултата ([React, „Server Functions“](https://react.dev/reference/rsc/server-functions)). До септември 2024 г. те се наричаха „Server Actions“; днес това име остава за тези, които се подават на `action` или се извикват от действие, като `<form action>` от Урок 7.

Две уточнения от документацията, които предотвратяват често срещани обърквания. Първото: **няма директива за Server Components**; `"use server"` е за Server Functions, а не за отбелязване на компонент. Второто, което решава много: макар Server Components на React 19 да са стабилни между второстепенните версии, вътрешните части, които бъндлърите и framework-ите използват, за да ги имплементират, **не следват семантично версиониране** и могат да се счупят между второстепенни версии на React 19.x. Затова документацията препоръчва на този, който изгражда тази интеграция, да фиксира точна версия на React или да използва версията *Canary*. Това, което следва, вече е принцип на този курс, а не на документацията: Server Components се използват чрез framework, който поддържа тази интеграция вместо теб. Vite има официален *plugin* за тях, `@vitejs/plugin-rsc` (версия 0.5.38 на 21 октомври 2026 г., все още преди 1.0), който се описва като независим от framework и предоставя частите от ниско ниво, за да се изгради такъв отгоре; той е основа за този, който прави framework-и, а не част за приложение като `revisor`.

И едно предупреждение за сигурността, което важи за всеки дизайн със сървър: аргументите на Server Function **се контролират изцяло от клиента**. Документацията изисква винаги да се третират като ненадежден вход, да се валидират и във всяка Server Function да се проверява, че човекът, който я извиква, има право на това, което иска ([React, `"use server"`](https://react.dev/reference/rsc/use-server)). Server Function на практика е публичен маршрут на сървъра ти с друго име. Най-силният прецедент е скорошен: на 3 декември 2025 г. екипът на React публикува критична уязвимост в Server Components, CVE-2025-55182, с оценка CVSS 10.0 (CVSS е стандартната скала за сериозност; 10.0 е максимумът), която позволяваше изпълнение на код на сървъра без удостоверяване, като се използва дефект в начина, по който React декодираше заявките към Server Functions. Според известието едно приложение можеше да е уязвимо, дори да не дефинира нито една Server Function, само ако поддържа Server Components; а приложение, чийто код на React не използва сървър, не беше засегнато ([React, „Critical Security Vulnerability in React Server Components“](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)). `revisor` е от вторите. Това е другата страна на „вътрешни части, които не следват семантично версиониране“: който ги използва, трябва да ги обновява веднага щом излезе корекцията. Сред пакетите, които известието изброява като засегнати, е `@vitejs/plugin-rsc`, същият *plugin* отгоре.

#### 9.3.2 Защо това табло не ги използва

`revisor` не използва Server Components по три причини и е добре те да се кажат точно, защото „няма нужда от тях“ без причини е само мнение:

1. **Данните му вече имат сървър, и той е друг.** Отчетът и детайлите идват от API, което не е на таблото: в курса това е тестовият сървър; в реалния живот би бил revisor от курса по Go или този по TypeScript. Server Component блести, когато компонентът може да чете данните отблизо. Тук той би трябвало да ги иска от същото това API по HTTP, което е това, което браузърът вече прави, само че от друга машина.
2. **Данните му се променят сами, на всеки десет секунди.** Отчетът се запитва периодично с `refetchInterval` (Урок 4) и се инвалидира при повторен опит (Урок 4) или при регистрация (Урок 7). Това е състояние на сървъра **в браузъра** и TanStack Query го решава с кеш, повторни опити и обновяване във фонов режим. Рисуването от страната на сървъра служи за първото зареждане, а не за следващите десет секунди.
3. **Няма нужда да се появява в търсачките, нито да се зарежда без JavaScript.** Това е вътрешен инструмент, зад вход. Двете най-често цитирани печалби от рисуването на сървъра (съдържанието да е в първия HTML за търсачките и нещо да се вижда, преди да пристигне JavaScript-ът) не му носят нищо.

Има и четвърта причина, която е на този курс, а не на таблото: Server Components изискват framework, а изучаването на framework, докато учиш React, скрива какво прави всеки от тях. Затова курсът първо преподаде React, който работи в браузъра.

#### 9.3.3 Кога си струва да се мигрира към framework

Документацията на React е ясна в препоръката си: за ново приложение **започни с framework** (споменава App Router на Next.js, React Router в режим на framework и Expo за нативни приложения, сред други), защото те носят решени маршрутизирането, зареждането на данни и рисуването на сървъра; започването от нулата, с инструмент като Vite, дава повече гъвкавост в замяна на това тези решения да ги вземаш ти ([React, „Creating a React App“](https://react.dev/learn/creating-a-react-app)). Същата страница признава причините да се започне от нулата: ограничения, които framework-ите не решават добре, желание да изградиш собствена структура или желание да научиш основите на едно приложение на React. Този курс е третото. И има детайл, който е добре да се знае: тези framework-и също произвеждат едностранични приложения без сървър, които могат да се публикуват като статични файлове, и ти позволяват да добавяш сървърни функции маршрут по маршрут, когато ти потрябват.

Критерият за миграция на `revisor` или на всяко подобно приложение е собствен на този курс, а не на документацията, и се записва под формата на сигнали, които могат да се проверят:

| Сигнал | Как изглежда в `revisor` | Да се мигрира ли? |
|---|---|---|
| Има публични страници, които трябва да се появяват в търсачките | Не: това е вътрешен инструмент | Не |
| Първото зареждане е бавно и измерването го доказва (голям JavaScript, каскади от заявки при отваряне) | 117 kB компресирани и една заявка при отваряне; не е измерено като проблем | Не |
| Данните са в собствена база данни и API съществува само за екрана | Не: API е на друга програма и има други клиенти | Не |
| Има данни или ключове, които не могат да стигнат до браузъра и днес принуждават да се пише API само за това | Не: на екрана няма тайни (9.2.4) | Не |
| Екипът с усилие преоткрива маршрутизирането, зареждането на данни по маршрут и обработката на грешки | Не: React Router и TanStack Query ги решават | Не |

Ако един ден два или три реда се сменят от „Не“ на „Да“, миграцията започва да изплаща цената си, която е реална: сървър на Node, който трябва да се поддържа в работа, нов мисловен модел (какво се изпълнява къде) и части, които зависят от версиите на framework-а. Дотогава `revisor` е това, което документацията нарича едностранично приложение, и е наред да бъде такова.

### 9.4 Какво открихме при измерването

Писането на този урок наложи таблото да се измери от край до край и измерването откри пет дефекта, които нито един предишен урок не беше видял. Нито един не чупи тест от Урок 8, защото нито един тест не ги търсеше. Всички се затварят по един и същ начин, с навика от онзи урок: първо се пише тестът, който описва правилното поведение, и се вижда **червен** срещу днешния код; после се поправя и същият тест се вижда **зелен**. Осемте нови теста живеят в четири файла и покриват петте дефекта (двата за CSS споделят файл).

Петте поправки и четирите им тестови файла са част от контролната точка на този урок. За да се види червената фаза, четирите тестови файла бяха изпълнени в копие на контролната точка **без** поправките, тоест срещу кода такъв, какъвто го остави Урок 8:

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts

 RUN  v5.0.5 ~/curso-react/rojo

 ❯ src/configuracion.test.ts (3 tests | 1 failed) 4ms
   ❯ leerCadaMs (3)
     ✓ acepta un intervalo razonable 1ms
     ✓ usa diez segundos si el valor no es un entero positivo 0ms
     × usa diez segundos si el intervalo se sale de los límites 2ms
 ❯ src/reporte/ResumenFallas.test.tsx (1 test | 1 failed) 14ms
   ❯ el resumen de fallas (1)
     × un solo servicio se dice en singular 13ms
 ❯ src/reporte/panel.test.ts (2 tests | 2 failed) 6ms
   ❯ la hoja de estilos (2)
     × cada clase de la hoja la usa algún componente 5ms
     × la hora de actualización se ve secundaria y se lee bien 0ms
 ❯ src/consultas/cliente.test.ts (2 tests | 1 failed) 6017ms
   ❯ el cliente de consultas (2)
     × no reintenta un 404: el servicio no va a aparecer por insistir 3011ms
     ✓ reintenta dos veces un 503: puede ser pasajero 3006ms
...
 Test Files  4 failed (4)
      Tests  5 failed | 3 passed (8)
```

Пет червени, по един за всеки дефект, и три зелени, които вече защитаваха това, което работеше. Всеки следващ раздел показва своя тест, съобщението за провала му и поправката, както са останали в контролната точка.

#### 9.4.1 `VITE_CADA_MS` без граница

**Какво беше измерено.** Това е третото съобщение от сцената. С контролната точка в `npm run dev`, `VITE_CADA_MS=2147483648` и Chrome без графичен интерфейс, отворен на `/` за пет секунди, логът на тестовото API:

```text
$ VITE_CADA_MS=2147483648 npx vite --port 5109 --strictPort
10:10:47.922 GET /api/estados cancelada por el cliente
10:10:48.225 GET /api/estados 200
10:10:48.537 GET /api/estados 200
10:10:48.842 GET /api/estados 200
10:10:49.151 GET /api/estados 200
10:10:49.457 GET /api/estados 200
10:10:49.761 GET /api/estados 200
10:10:50.066 GET /api/estados 200
10:10:50.371 GET /api/estados 200
10:10:50.675 GET /api/estados 200
10:10:50.978 GET /api/estados 200
```

(Първият ред е обичайната двойка на `StrictMode`.) Десет заявки за по-малко от три секунди, по една на всеки ~305 ms, което е точно колкото отнема на API да отговори: таблото пита веднага щом му отговорят. Който е написал това число, е искал около 25 дни между въпросите. Защо? Периодичното запитване на TanStack Query използва `setInterval`, а MDN обяснява границата: забавянето се превръща в 32-битово цяло число със знак, така че максимумът е 2,147,483,647 ms (около 24.8 дни); по-голяма стойност **препълва** и може да даде отрицателно число, което браузърът третира като „без изчакване“ ([MDN, `setTimeout`, „Maximum delay value“](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)). 2,147,483,648 е точно с едно повече от максимума: при препълването става −2,147,483,648, отрицателно забавяне. А препълването не винаги е толкова скандално: с `VITE_CADA_MS=99999999999` в същия петсекунден тест имаше само една заявка, защото това число при препълване дава около 14 дни. Дефект, който понякога се вижда, а понякога не, е най-лошият вид.

Другата крайност също съществува: `VITE_CADA_MS=1` минава филтъра на `leerCadaMs` (то е положително цяло число) и иска от браузъра периодично запитване без пауза. Същото петсекундно изпълнение:

```text
$ VITE_CADA_MS=1 npx vite --port 5109 --strictPort
13:22:56.829 GET /api/estados cancelada por el cliente
13:22:57.131 GET /api/estados 200
13:22:57.452 GET /api/estados 200
13:22:57.759 GET /api/estados 200
13:22:58.066 GET /api/estados 200
13:22:58.371 GET /api/estados 200
13:22:58.678 GET /api/estados 200
13:22:58.988 GET /api/estados 200
13:22:59.299 GET /api/estados 200
13:22:59.606 GET /api/estados 200
13:22:59.912 GET /api/estados 200
13:23:00.218 GET /api/estados 200
13:23:00.461 GET /api/estados cancelada por el cliente
```

Същият практически резултат: въпрос веднага щом пристигне отговорът. (Последният ред е заявката в ход, когато Chrome беше затворен.)

**Тестът.** Нов файл до `configuracion.ts`:

```ts
// revisor/src/configuracion.test.ts
import { describe, expect, test } from "vitest";
import { leerCadaMs } from "./configuracion";

describe("leerCadaMs", () => {
  test("acepta un intervalo razonable", () => {
    expect(leerCadaMs("5000")).toBe(5_000);
  });

  test("usa diez segundos si el valor no es un entero positivo", () => {
    for (const valor of [undefined, "", "abc", "0", "-5", "1e4", "10s"]) {
      expect(leerCadaMs(valor)).toBe(10_000);
    }
  });

  test("usa diez segundos si el intervalo se sale de los límites", () => {
    expect(leerCadaMs("999")).toBe(10_000);
    expect(leerCadaMs("1000")).toBe(1_000);
    expect(leerCadaMs("3600000")).toBe(3_600_000);
    expect(leerCadaMs("3600001")).toBe(10_000);
    expect(leerCadaMs("99999999999")).toBe(10_000);
  });
});
```

Червената фаза: `expected 999 to be 10000`. Днес `leerCadaMs("999")` връща 999; тестът казва, че интервал под една секунда не се приема.

**Поправката.** Две граници, с причината им, записана до тях. Извън тях се използва обичайната стойност, също както при текст, който не е число: невалидната конфигурация не чупи таблото, а се пренебрегва.

```ts
// revisor/src/configuracion.ts
const CADA_MS_PREDETERMINADO = 10_000;

// Menos de un segundo entre preguntas no deja respirar a la API (cada respuesta tarda
// 300 ms), y más de una hora ya no es un sondeo. Además, setInterval guarda el intervalo
// en un entero de 32 bits: arriba de 2_147_483_647 ms se desborda, y la espera queda en
// cualquier valor, a veces cero.
const CADA_MS_MINIMO = 1_000;
const CADA_MS_MAXIMO = 3_600_000;

export function leerCadaMs(valor: string | undefined): number {
  if (valor === undefined || !/^[1-9]\d*$/.test(valor)) {
    return CADA_MS_PREDETERMINADO;
  }

  const ms = Number(valor);
  return ms >= CADA_MS_MINIMO && ms <= CADA_MS_MAXIMO ? ms : CADA_MS_PREDETERMINADO;
}

export const cadaMs = leerCadaMs(import.meta.env.VITE_CADA_MS);
```

Минимумът от една секунда и максимумът от един час са собствен принцип на курса, а не норма: една секунда е повече от три пъти колкото отнема на API да отговори, а повече от един час престава да бъде периодично запитване. Това, което **не** е принцип, е максимумът да остане под 2,147,483,647: това го изисква `setInterval`. Същото измерване с поправката, същото число и същите пет секунди:

```text
10:10:59.307 GET /api/estados cancelada por el cliente
10:10:59.610 GET /api/estados 200
```

Една заявка: стойността беше пренебрегната и таблото се върна към своите десет секунди.

#### 9.4.2 Единственото число на „servicios“

**Какво беше измерено.** С една-единствена услуга в отчета обобщението казва „1 servicios revisados“. Урок 1 се погрижи за единственото число на повредите с `textoFallas` („1 servicio con falla“), но общият брой остана написан ръчно в компонента, `{estados.length} servicios revisados`, и никой не го пробва с една. Тестът от Урок 8, който защитава самотната `0`, използва две услуги, така че и той не го виждаше.

**Тестът.** Монтира само `ResumenFallas` с една услуга в повреда, защото дефектът е на този компонент и не е нужно цялото приложение:

```tsx
// revisor/src/reporte/ResumenFallas.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ResumenFallas } from "./ResumenFallas";

describe("el resumen de fallas", () => {
  test("un solo servicio se dice en singular", () => {
    render(<ResumenFallas estados={[{ nombre: "pagos", tipo: "falla", detalle: "HTTP 503" }]} />);
    expect(screen.getByText(/revisad/).textContent).toBe("1 servicio revisado · 1 servicio con falla");
  });
});
```

Червената фаза го казва буква по буква:

```text
Expected: "1 servicio revisado · 1 servicio con falla"
Received: "1 servicios revisados · 1 servicio con falla"
```

**Поправката.** Текстът се изнася в чиста функция, до `textoFallas`, и компонентът я използва:

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

export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
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

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas, textoRevisados } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {textoRevisados(estados.length)}
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

Съществуващият тест „sin fallas no pinta un 0 suelto en el resumen“ остава зелен, защото с две услуги текстът е същият като преди.

#### 9.4.3 Повторният опит при 404

**Какво беше измерено.** Отваряне на `/servicios/nada`, услуга, която не съществува, с Chrome без графичен интерфейс и тестовото API:

```text
10:11:05.994 GET /api/servicios/nada cancelada por el cliente
10:11:06.195 GET /api/servicios/nada 404
10:11:07.401 GET /api/servicios/nada 404
10:11:09.607 GET /api/servicios/nada 404
```

Три заявки, с 1.2 и 2.2 секунди между тях, а човекът вижда „Cargando detalle…“ повече от три секунди, преди да разбере, че услугата не съществува. Това е `retry: 2` от Урок 4, което се прилага към **всяка** грешка, плюс изчакването, което TanStack Query слага между опитите: започва от една секунда и се удвоява всеки път, до таван от 30 секунди ([TanStack Query, „Query Retries“](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)). Повторният опит има смисъл при `503` (услугата може да се върне след секунда) или при неработеща мрежа. При `404` отговорът си е отговор: услугата няма да се появи от настояване. Едно уточнение, преди да се обобщава: в `revisor` API отговаря само с `400`, `404` и `409` и нито един не се променя от настояване, така че правилото на контролната точка е „без повторни опити при всяко 4xx“. В истинско API има два 4xx, които са временни, `408` (изтекло време на заявката) и `429` (твърде много заявки, обикновено с `Retry-After`), и едно истинско правило за повторни опити ги отделя.

Защо Урок 8 не го видя? Защото `montarEn` създава собствен `QueryClient` с `retry: false`, нарочно, за да се вижда грешката веднага в тестовете. Това е правилно за тестване на екраните и оставя истинската конфигурация нетествана. Новият тест използва истинския клиент, `crearClienteConsultas()`:

```ts
// revisor/src/consultas/cliente.test.ts
import { describe, expect, test } from "vitest";
import { consultaDetalle } from "../detalle/consultas";
import { instalarFetchFalso } from "../pruebas/fetchFalso";
import { crearClienteConsultas } from "./cliente";

describe("el cliente de consultas", () => {
  test("no reintenta un 404: el servicio no va a aparecer por insistir", async () => {
    const fetchFalso = instalarFetchFalso({});
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("nada"))).rejects.toThrow("la API respondió 404");
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  test("reintenta dos veces un 503: puede ser pasajero", { timeout: 10_000 }, async () => {
    const fetchFalso = instalarFetchFalso({
      "GET /api/servicios/pagos": { status: 503, cuerpo: { detalle: "caída" } },
    });
    const cliente = crearClienteConsultas();
    await expect(cliente.fetchQuery(consultaDetalle("pagos"))).rejects.toThrow("la API respondió 503");
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });
});
```

Червената фаза: `expected "vi.fn()" to be called 1 times, but got 3 times`. Вторият тест, този за `503`, е зелен отпреди и той е този, който не позволява мързеливата поправка: `retry: false` би направил първия зелен, а втория червен. Двата заедно описват цялото правило. (Отнема истински три секунди заради изчакванията между опитите; затова има `timeout: 10_000`.)

**Поправката.** Грешката носи HTTP кода като своя причина (`cause`, стандартно свойство на `Error`), а клиентът решава с функция вместо с число:

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`, { cause: respuesta.status });
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

```ts
// revisor/src/consultas/cliente.ts
import { QueryClient } from "@tanstack/react-query";

// Un 4xx es una respuesta, no una falla pasajera: preguntar otra vez da lo mismo.
// Lo demás (un 503, la red caída) se reintenta dos veces, como antes.
function convieneReintentar(fallas: number, error: Error): boolean {
  const status = error.cause;

  if (typeof status === "number" && status >= 400 && status < 500) {
    return false;
  }

  return fallas < 2;
}

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: convieneReintentar,
      },
    },
  });
}
```

Същото измерване в браузъра, с поправката:

```text
10:11:13.704 GET /api/servicios/nada cancelada por el cliente
10:11:13.905 GET /api/servicios/nada 404
```

Една заявка, а известието „No se pudo cargar el detalle: la API respondió 404“ се появява веднага щом пристигне отговорът.

#### 9.4.4 Неизползван CSS

**Какво беше измерено.** `panel.css` има две правила, които нито един компонент не използва от Урок 5 насам: `.seleccionar` (бутонът с `aria-pressed` от Урок 2, който Урок 5 смени с връзка) и `.detalle` (панелът с детайли от Урок 3, който Урок 5 смени със страница). Това са 19 реда, които пътуват до всеки браузър и объркват този, който чете файла със стилове, защото изглеждат живи.

**Тестът и капанът, открит при писането му.** Тестът чете файла със стилове и текста на компонентите, изважда класовете от файла и проверява, че всеки се появява в някой `className`. За да чете файлове като текст без Node, използва две функции на Vite, които Vitest разбира: `import hoja from "./panel.css?raw"` и `import.meta.glob(…, { query: "?raw" })`.

```ts
// revisor/src/reporte/panel.test.ts
import { describe, expect, test } from "vitest";
import hoja from "./panel.css?raw";

// El texto de cada componente, tal como está escrito (sin las pruebas).
const fuentes = Object.values(
  import.meta.glob<string>(["/src/**/*.tsx", "!/src/**/*.test.tsx"], {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

// Clases que ningún className escribe con todas sus letras: `disponible` y `falla`
// salen de `estado.tipo` (FilaEstado), y `active` la pone el NavLink de React Router.
const DINAMICAS = ["disponible", "falla", "active"];

function clasesDeLaHoja(css: string): string[] {
  const selectores = css.replace(/\{[^}]*\}/g, " ");
  return [...new Set([...selectores.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1] ?? ""))];
}

// Los textos entre comillas o acentos graves que aparecen después de `className=`.
function usosDeClassName(codigo: string): string[] {
  return codigo
    .split("\n")
    .filter((linea) => linea.includes("className="))
    .flatMap((linea) =>
      [...linea.slice(linea.indexOf("className=")).matchAll(/"([^"]*)"|`([^`]*)`/g)].map(
        (m) => m[1] ?? m[2] ?? "",
      ),
    );
}

function seUsa(clase: string, usos: readonly string[]): boolean {
  return (
    DINAMICAS.includes(clase) ||
    usos.some((uso) =>
      uso
        .split(/\s+/)
        .some((pieza) => new RegExp(`^${pieza.replace(/\$\{[^}]*\}/g, "[a-z0-9-]+")}$`).test(clase)),
    )
  );
}

// Contraste entre dos colores #rrggbb, con la fórmula de WCAG 2.2.
function contraste(uno: string, otro: string): number {
  const luminancia = (hex: string): number => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [clara, oscura] = [luminancia(uno), luminancia(otro)].sort((a, b) => b - a);
  return ((clara ?? 0) + 0.05) / ((oscura ?? 0) + 0.05);
}

describe("la hoja de estilos", () => {
  test("cada clase de la hoja la usa algún componente", () => {
    const clases = clasesDeLaHoja(hoja);
    const usos = fuentes.flatMap(usosDeClassName);
    // Control positivo: si la hoja o los componentes llegaran vacíos, no habría nada que revisar.
    expect(clases).toContain("tarjeta");
    expect(usos).toContain("tarjeta");
    expect(clases.filter((clase) => !seUsa(clase, usos))).toEqual([]);
  });

  test("la hora de actualización se ve secundaria y se lee bien", () => {
    const regla = /\.actualizado\s*\{([^}]*)\}/.exec(hoja)?.[1] ?? "";
    const color = /(?:^|;|\s)color:\s*(#[0-9a-f]{6})/i.exec(regla)?.[1];
    expect(color, "falta el color de .actualizado").toBeDefined();
    expect(contraste(color ?? "#000000", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(color ?? "#000000", "#ffffff")).toBeLessThan(21);
  });
});
```

Първата версия на този тест **мина зелена срещу кода с дефекта**. Не че дефектът не съществуваше: файлът със стилове пристигаше празен. Vitest по подразбиране не обработва файловете `.css`; документацията му казва, че изключените файлове се заменят с празен текст и че `css.include` (празен по подразбиране) е списъкът на тези, които се обработват ([Vitest, `css`](https://vitest.dev/config/css)). Останалото беше измерено, документацията не го казва: файл, който не е в този списък, също пристигна празен, дори с `?raw`: `hoja.length` беше `0`. Празен файл със стилове няма неизползвани класове и тестът заключаваше, без грешка, че всичко е наред. Това е най-опасният вид зелено — това, което не е измерило нищо.

Затова тестът има две промени. Първата е във `vite.config.ts`, вътре в `test`:

```ts
// fragmento: revisor/vite.config.ts, solo la parte de `test`
  test: {
    environment: "jsdom",
    setupFiles: ["./src/pruebas/preparar.ts"],
    // Sin esto, Vitest entrega cada .css como un texto vacío, también con `?raw`,
    // y la prueba de la hoja de estilos pasaría sin haber leído nada.
    css: { include: [/panel\.css/] },
  },
```

Втората е **положителната контрола** в самия тест: преди да търси неизползвани класове, той проверява, че е намерил поне един, който се използва, `tarjeta`, във файла със стилове и в компонентите. Без `css.include` тестът сега се проваля там, където трябва, вместо да минава:

```text
 FAIL  src/reporte/panel.test.ts > la hoja de estilos > cada clase de la hoja la usa algún componente
AssertionError: expected [] to include 'tarjeta'
```

С наистина прочетен файл със стилове червената фаза е тази, която е интересна:

```text
AssertionError: expected [ 'seleccionar', 'detalle' ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "seleccionar",
+   "detalle",
+ ]
```

Обърни внимание на `DINAMICAS`. Има класове, които никой `className` не пише с всичките им букви: `disponible` и `falla` идват от `estado.tipo`, а `active` го слага `NavLink` на връзката към текущата страница. Такъв тест не може да ги отгатне; те трябва да се декларират, а списъкът е част от кода, който се преглежда. Това е същият проблем, който имат инструментите, които автоматично изтриват неизползван CSS, и затова те обикновено приемат списък с изключения (в PurgeCSS той се нарича *safelist*). Поправката в този случай е да се изтрият тези 19 реда.

#### 9.4.5 CSS-ът на `.actualizado`

**Какво беше измерено.** Това е дефектът наобратно: `PaginaReporte` рисува `<p className="actualizado">` от Урок 3, а `panel.css` никога не е имал правило за този клас. Редът „Actualizado a las … · actualizando…“ се вижда със същия размер и същия цвят като данните и се конкурира с това, което е важно. Клас, който компонентът слага, а файлът със стилове пренебрегва, е неизпълнено обещание.

**Тестът.** Вече го видя в `panel.test.ts`: търси правилото `.actualizado`, взема неговия `color` и изчислява контраста спрямо белия фон по формулата на WCAG 2.2. Изисква две неща: да е поне 4.5 към 1, минимумът за нормален текст според критерий 1.4.3 ([W3C, „Understanding SC 1.4.3: Contrast (Minimum)“](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), и да е по-малко от 21 към 1, което е чисто черно. Тази горна граница изключва само точното черно (`#111111` дава 18.88 към 1 и би минал): дали редът изглежда **второстепенен**, решава окото, а тестът гарантира само, че правилото съществува, декларира цвят и се чете. Червената фаза: `falta el color de .actualizado: expected undefined to be defined`.

**Поправката.** Едно правило, на мястото, където бяха двете изтрити, със същото сиво, което вече използваха помощните текстове на формуляра от Урок 7:

```css
/* fragmento: revisor/src/reporte/panel.css, solo la regla nueva */
.actualizado {
  color: #57606a;
  font-size: 0.875rem;
}
```

Контрастът на `#57606a` върху бяло, изчислен по същата формула: 6.39 към 1. За сравнение, сиво, което „изглежда добре“ на пръв поглед, `#999999`, дава 2.85 към 1 и тестът би го отхвърлил.

#### 9.4.6 Зелената фаза и целият пакет

Същите четири тестови файла, в контролната точка, с петте поправки:

```text
$ npx vitest run --reporter=default src/configuracion.test.ts src/reporte/ResumenFallas.test.tsx src/consultas/cliente.test.ts src/reporte/panel.test.ts
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 22ms
 ✓ src/configuracion.test.ts (3 tests) 3ms
 ✓ src/reporte/panel.test.ts (2 tests) 3ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3012ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  4 passed (4)
      Tests  8 passed (8)
   Start at  07:11:08
   Duration  4.09s (tests 47%, environment 44%, setup 7%, transform 1%, import 1%)
```

И целият пакет, за да се провери, че нито една поправка не е счупила вече защитеното:

```text
$ npm test -- --reporter=default

> revisor@0.9.0 test
> vitest run --reporter=default

 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/avisos/avisos.test.ts (4 tests) 8ms
 ✓ src/reporte/ResumenFallas.test.tsx (1 test) 153ms
 ✓ src/reporte/resumen.test.ts (3 tests) 67ms
 ✓ src/reporte/panel.test.ts (2 tests) 5ms
 ✓ src/app/rutas.test.tsx (3 tests) 486ms
   ✓ las rutas (3)
     ✓ una dirección desconocida muestra la página de no encontrada 414ms
 ✓ src/detalle/PaginaServicio.test.tsx (3 tests) 778ms
   ✓ la página de un servicio (3)
     ✓ muestra el detalle del servicio de la dirección 428ms
 ✓ src/reporte/PaginaReporte.test.tsx (7 tests) 791ms
   ✓ la página del reporte (7)
     ✓ error: muestra el motivo y un botón para reintentar 331ms
 ✓ src/compartido/esquema.test.ts (2 tests) 6ms
 ✓ src/configuracion.test.ts (3 tests) 4ms
 ✓ src/alta/FormularioAlta.test.tsx (5 tests) 1259ms
   ✓ el formulario de alta (5)
     ✓ sin datos marca los tres campos y lo anuncia 554ms
 ✓ src/consultas/cliente.test.ts (2 tests) 3020ms
   ✓ el cliente de consultas (2)
     ✓ reintenta dos veces un 503: puede ser pasajero 3005ms

 Test Files  11 passed (11)
      Tests  35 passed (35)
   Start at  16:13:56
   Duration  6.23s (environment 53%, tests 18%, transform 13%, import 8%, setup 7%)

Environment  jsdom was created 11 times · 19.53s total, 53% of tracked time
             create it once per worker with pool: 'vmThreads' (keeps per-file isolation) or isolate: false (shares it across files)
             learn more: https://vitest.dev/guide/improving-performance#test-environments
```

35 от 35 в 11 файла: 27-те от Урок 8 плюс 8-те нови. Блокът `Environment` от три реда в края е предложение на Vitest за собствената му скорост (jsdom да се създава веднъж за процес вместо единайсет пъти), а не предупреждение от тестовете; може да ти излезе или не. В контролната точка `npm run lint` завърши без предупреждения, а `npm run build` остави `index-Cs1CcfeN.js` (374.65 kB) и `index-CbqUABMA.css` от 1.27 kB: около 230 байта по-малко от файла със стилове преди поправките (1.50 kB; Vite закръгля до стотни, а ако искаш точното число — `wc -c` върху двата файла). Компилаторът продължи да действа: 18 маркера.

## Грешката, която ще видиш

**Основната грешка: четене на часовника по време на рисуване.** Първата версия на фигура 1 имаше изчакването вътре в компонента, така:

```tsx
// fragmento: la primera versión de ListaLenta, la que el linter rechazó
function ListaLenta() {
  const hasta = performance.now() + 20;
  while (performance.now() < hasta) {
    // espera activa
  }
  // …
```

А `npx eslint` отговори:

```text
~/curso-react/figuras/fig09_01.tsx
  19:17  error  Error: Cannot call impure function during render

`performance.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

~/curso-react/figuras/fig09_01.tsx:19:17
  17 | // Una lista que tarda 20 ms en dibujarse: el costo es a propósito, para que se vea.
  18 | function ListaLenta() {
> 19 |   const hasta = performance.now() + 20;
     |                 ^^^^^^^^^^^^^^^^^ Cannot call impure function
  20 |   while (performance.now() < hasta) {
  21 |     // espera activa
  22 |   }  react-hooks/purity
  20:10  error  Error: Cannot call impure function during render
…
✖ 2 problems (2 errors, 0 warnings)
```

Това е правилото `react-hooks/purity`, едно от тези, които `eslint-plugin-react-hooks` 7 носи от компилатора. То казва нещо, което знаеш от Урок 1: компонентът трябва да дава един и същ резултат при едни и същи входове, а `performance.now()` дава различно число всеки път. Ако компилаторът мемоизираше компонент, който чете часовника, вторият път би преизползвал часа от първия. Затова двата инструмента споделят правила: линтерът предупреждава за това, което би накарало компилатора да сгреши (или да пропусне компонента, както във фигура 2). Поправката на фигурата изнася изчакването в отделна функция. Внимание: това не го прави чисто, само го скрива от линтера, който не проверява вътре във функциите, които извикваш. Приема се тук **единствено** защото симулира цена и не произвежда нищо, което се рисува, и коментарът на `gastar` предупреждава за това; да се направи същото с истинска нечистота би означавало да заглушиш линтера по друг път. В истински компонент час, който се показва, се пази в състоянието или идва като prop.

**Мълчаливата: файлът, който не съществува и отговаря с HTML.** В предварителния преглед `/assets/no-existe.js` отговори с `200 text/html` (9.2.2). В браузъра това изглежда като празна страница, а в конзолата — грешка, която казва, че се е очаквал JavaScript модул, а сървърът е отговорил с MIME тип `text/html`. Не казва кой файл е липсвал, нито защо. Ако я видиш след публикуване, въпросът е: пренаписва ли сървърът ми и адресите от `/assets/`? Поправката е тази от `publicar.ts`: пренаписването е за маршрутите на клиента, никога за файловете.

**Другата мълчалива: зеленият тест, който не прочете нищо.** Видя го в 9.4.4. Ако тест чете файл и заключава „няма проблеми“, запитай се какво би казал с празния файл. Ако отговорът е „същото“, липсва му положителна контрола.

## Какво се прави погрешно

**`useMemo` и `memo` навсякъде, „за всеки случай“.** Фигура 1 показа, че причината за излишните рисувания беше състояние на грешното място. Мемоизирането би скрило симптома и би оставило причината, с повече код за поддръжка.

**Да оптимизираш, без да измерваш.** Ако не знаеш колко пъти се рисува един компонент, нито колко време отнема, не знаеш дали това, което си променил, е свършило работа. `<Profiler>` или разделът Profiler отговарят на двата въпроса за минути.

**Да измерваш в продукционното изграждане с `<Profiler>`.** Там той е изключен, нарочно. Измерванията на рисуването се правят по време на разработка, а тези на цялото изживяване (зареждане, мрежа) — в публикуваната версия, с инструментите на браузъра.

**Да включиш компилатора и да не провериш, че е действал.** Конфигурация, която не дава грешка, не доказва нищо. Търси маркерите му в `dist/` и ги брой с `grep -o … | wc -l`, а не с `grep -c`.

**Да заглушиш линтера, за да „работи“ компилаторът.** Ако правило на компилатора се оплаква, компонентът нарушава правило на React. Поправя се компонентът. Заглушаването му оставя компонент, който компилаторът пропуска или, още по-лошо, оптимизира зле.

**Да публикуваш с `vite preview`.** Не е направен за това: без политика за сигурност, без кеширане за файловете с име от съдържанието и с отговор HTML там, където липсва файл.

**Да пренаписваш всичко към `index.html`, включително файловете.** Превръща ясно `404` в грешка за типа съдържание, която никой не разбира.

**Да сервираш файлове, като сглобяваш пътя на диска от това, което иска клиентът.** Отваря вратата за обхождане на директории. Затвореният списък на `publicar.ts` няма такава врата.

**Да броиш съвпадения при търсене на тайни.** `password` от React DOM е съвпадение, което не е изтичане; истински ключ почти никога не се казва `clave`. Чете се всеки резултат и се търсят **стойностите**.

**Тест, който чете файл без положителна контрола.** Ако файлът пристигне празен, минава. Добави проверка, че е намерил нещо, за което знаеш, че е там.

**`retry: false`, за да се „поправи“ излишен повторен опит.** Престава да опитва отново това, което си заслужаваше да се опита отново. Затова тестът за `503` придружава този за `404`.

**Да мигрираш към framework, защото това препоръчва документацията за нови проекти.** `revisor` не е нов проект, а таблицата от 9.3.3 няма нито едно „Да“. Миграцията се обосновава със сигнали, а не с мода.

## Упражнения

### Упражнение 1 — Profiler със собствените ти очи

Инсталирай разширението React Developer Tools в браузъра си. При работещи тестово API и `npm run dev` отвори `http://localhost:5173/`, отвори раздела **Profiler** и в настройките му включи опцията за записване защо е нарисуван всеки компонент. **Преди да записваш, предвиди:** ако напишеш `pag` в „Buscar por nombre“, кои компоненти ще се рисуват с всяка буква? Рисува ли се `EditorNota`? Рисува ли се `BandejaAvisos`? Запиши, напиши трите букви, спри записа и провери предвиждането си във всеки *commit*. След това погледни раздела **Components**: кои компоненти носят значката „Memo ✨“? Накрая повтори записа в копие с `plugins: [react()]`, без компилатора, и отбележи дали някой компонент се появява в повече.

### Упражнение 2 — Другата посока

Тестът от 9.4.4 търси класове от файла със стилове, които никой компонент не използва. Задай въпроса наобратно, ръчно: има ли `className`, написан в компонент, който няма нито едно правило в `panel.css`? Използвай `grep -rn 'className' src` в копието с поправките. **Първо предвиди** колко ще намериш, освен `actualizado`, който вече е поправен. После реши за всеки дали му липсва правило, или е наред без такова, и запиши причината си в дневника.

### Упражнение 3 — Иконата, която отговори с `200`

В лога на публикувания сървър от 9.2.3 се появява `GET /favicon.ico 200`, но `dist/` няма никакъв `favicon.ico`. Без да изпълняваш нищо, обясни какво е отговорил сървърът и с какъв тип съдържание. След това го провери с `curl -sI http://127.0.0.1:4180/favicon.ico`. Дефект ли е? Какво би променил в `publicar.ts`, ако би променил нещо?

### Упражнение 4 — Да мигрираме ли, или не?

Един екип ти описва приложението си: онлайн магазин с 4,000 продукта, всеки със своя страница, който днес е едностранично приложение, направено с Vite и React Router; маркетингът се оплаква, че страниците на продуктите не се появяват добре в търсачките, а първото зареждане на телефон отнема, измерено, четири секунди. Попълни таблицата от 9.3.3 за това приложение и реши дали си струва да се мигрира към framework. Запиши какво би измерил, преди да започнеш.

## Решения

### Решение 1

Това, което би трябвало да видиш, изведено от кода: с всяка буква се рисуват поне `PaginaReporte` (защото адресът се е променил: текстът за търсене живее в `?q=`, Урок 5, и го чете с `useSearchParams`, така че причината, която показва Profiler, ще бъде промяна на hook или „родителят се нарисува“, според версията на инструментите), `FiltroFallas`, `ContenidoReporte`, `ListaEstados` и `FilaEstado`, които остават в списъка. `EditorNota` не се появява: в списъка не се рисува, а само в страницата с детайли. `BandejaAvisos` също не, нито `PanelPreferencias`: те живеят в `Disposicion`, а `Disposicion` **не** се рисува отново с всяка буква, защото този, който чете `?q=`, е `PaginaReporte`, и промяната се случва там, а не в оформлението около него. Това не е мемоизация, нито контекст, който не се е променил: това е структурата от 9.1.4. Измерено беше с брояч във всеки компонент и две написани букви: `PaginaReporte` мина от 1 на 3 рисувания, а `Disposicion`, `BandejaAvisos` и `PanelPreferencias` останаха на 1, **с компилатора и без него**. Ако в твоя Profiler се появи някой от трите, нещо в копието ти е качило състоянието в оформлението, и това е следата. Ако компилаторът е включен, няколко компонента в раздела **Components** носят „Memo ✨“, а в Profiler е вероятно някои деца, чиито props не са се променили, да се появят без рисуване в даден *commit*. Ако някое предвиждане се е провалило, запиши кое и защо: точно на това учи Profiler. Това измерване не беше изпълнено за урока; важи твоят резултат.

### Решение 2

Освен `actualizado` се появява `marca-nota`, във `FilaEstado`: текстът „ · con nota“, който отбелязва услуга с бележка от Урок 2, без правило в `panel.css`. Динамичните класове (`disponible` и `falla` от `estado.tipo`, `aviso-${aviso.nivel}`) имат правило. Липсва ли правило на `marca-nota`? Това е решение, а не факт: текстът се чете добре до името, така че може да остане без стил, а класът служи, за да се намира в тест или в инструментите за разработчици. Ако решиш да изглежда различно (например в сивото на `.actualizado`), напиши първо теста му, както в 9.4.5. Това, което не е допустимо, е въпросът да остане без отговор: клас без правило трябва да е решение, а не пропуск.

### Решение 3

`/favicon.ico` не е в списъка с файлове и не започва с `/assets/`, така че сървърът го третира като маршрут на клиента и отговори с `index.html`: `200`, `text/html; charset=utf-8`, с политиката и `no-cache` (това е шестият въпрос от 9.2.3: `200`, `content-type: text/html; charset=utf-8` и `cache-control: no-cache`). Браузърът получава HTML там, където е очаквал икона, не може да я нарисува и оставя раздела без икона; друга вреда няма. Това е малък дефект от същото семейство като този на предварителния преглед (9.2.2): пренаписването е приложено към нещо, което е файл. Има две разумни поправки. Най-простата е да се добави `favicon.ico` (или `<link rel="icon">` към файл в `/assets/`), за да съществува. По-общата е пренаписването да се прилага само към адреси без разширение, така че `/favicon.ico` да отговаря с `404`; но ако направиш това, провери, че нито един маршрут на клиента няма точка (`/servicios/v1.2` би престанал да се презарежда). Изборът между двете е въпрос на принцип; измерването на ефекта — не.

### Решение 4

Таблицата се променя почти изцяло. Публични страници, които трябва да се появяват в търсачките: **Да**, 4,000. Бавно и измерено първо зареждане: **Да**, четири секунди на телефон. Собствени данни (каталогът е техен): вероятно **Да**. Тайни: зависи (специални цени, наличности), за проверка. Преоткриване на зареждането на данни по маршрут: вероятно. С два или три измерени „Да“ framework с рисуване на сървъра по маршрут започва да изплаща цената си: страниците на продуктите биха пристигали вече нарисувани в HTML. Преди да започнеш, би измерил: каква част от четирите секунди е изтеглянето на JavaScript и каква — изчакването на данни (разделът за мрежата на браузъра), колко тежи пакетът и дали проблемът с търсачките е в съдържанието (не е в HTML) или в нещо друго (заглавия, връзки). И едно предупреждение: миграцията може да е маршрут по маршрут, като се започне от страницата на продукта, без да се пренаписват количката, нито профилът.

## Как разбирам, че съм успял

- [ ] `npm ci`, `npm run lint`, `npm test` и `npm run build` завършват с код 0 в `~/curso-react/revisor/`; обобщението на `npm test -- --reporter=default` казва `Tests  35 passed (35)` в `11 passed (11)` файла, а `npm run build` оставя `dist/assets/index-Cs1CcfeN.js` и `dist/assets/index-CbqUABMA.css`, ако кодът ти е идентичен с този на контролната точка.
- [ ] `grep -o memo_cache_sentinel dist/assets/*.js | wc -l` дава `18`, а в копие без компилатора дава `1`.
- [ ] Фигури 1, 2 и 3 дават на твоята машина същия изход като в урока.
- [ ] С `npm run servidor` и `npm run publicado` `curl -sI http://127.0.0.1:4180/servicios/pagos` отговаря с `200` с `content-security-policy` и `cache-control: no-cache`; `/assets/no-existe.js` отговаря с `404`; а при отваряне на `http://127.0.0.1:4180/servicios/pagos` в браузъра ти и **презареждане** се виждат детайлите на `pagos`.
- [ ] `grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js` намира само съвпаденията от React DOM и тези от схемата на регистрацията и знаеш как да обясниш защо те не са изтичане.
- [ ] В твое копие **без** петте поправки от 9.4 (с новите тестове и реда `css` във `vite.config.ts`) четирите нови тестови файла се виждат червени, с 5 провалени теста от 8; в контролната точка — зелени.
- [ ] **Ръчно, с инструментите за разработчици:** направи упражнение 1 и записа в своя [дневник](bitacora.md) кои компоненти се рисуваха с всяка буква и кои носят „Memo ✨“.
- [ ] Можеш да обясниш, без да гледаш, защо `revisor` не използва Server Components.

## Обобщение

Отговори, без да гледаш урока:

1. Кои две условия трябва да са изпълнени, за да си струва `memo`? Как измерваш всяко от тях?
2. Каква е разликата между `actualDuration` и `baseDuration` в `onRender`? Защо не можеш да използваш `<Profiler>` в продукционното изграждане?
3. Във фигура 1 защо версия B не нарисува отново списъка, щом не използва `memo`? Коя от петте препоръки на документацията се прилага?
4. Какво прави React Compiler с компонент, който спазва правилата на React, и какво прави с такъв, който ги нарушава? Как проверяваш, че е действал в изграждането ти?
5. Защо `grep -c` даваше 2, а `grep -o … | wc -l` даваше 18 върху един и същ файл?
6. Кои три неща липсваха на `vite preview`, за да се публикува? Как ги решава `publicar.ts`?
7. Защо пренаписването към `index.html` не се прилага към `/assets/*`?
8. Кои са трите слоя срещу XSS на `revisor` и кой от тях не живее в кода ти?
9. Какво е Server Component и какво е Server Function? Защо `revisor` не ги използва?
10. От петте дефекта в 9.4 кой имаше зелен тест, който не беше измерил нищо, и какво го поправи?

## За допълнително четене

- [React, `<Profiler>`](https://react.dev/reference/react/Profiler): `onRender` и параметрите му, `actualDuration` срещу `baseDuration` и защо е изключен в продукция. Посетено на 21 октомври 2026 г.
- [React, `memo`](https://react.dev/reference/react/memo): кога си струва да се мемоизира, петте препоръки, за да не е нужно, и бележката за React Compiler. Посетено на 21 октомври 2026 г.
- [React, „React Compiler v1.0“](https://react.dev/blog/2025/10/07/react-compiler-1), [„Introduction“](https://react.dev/learn/react-compiler/introduction), [„Installation“](https://react.dev/learn/react-compiler/installation) и [„Debugging and Troubleshooting“](https://react.dev/learn/react-compiler/debugging): стабилната версия от 7 октомври 2025 г., какво мемоизира, какво да се прави с `useMemo` и `useCallback`, конфигурацията с `reactCompilerPreset` във Vite, как да се провери, че е действал, и че пропуска кода, който би могъл да наруши правилата на React. Посетено на 21 октомври 2026 г.
- [Vite, „Deploying a Static Site“](https://vite.dev/guide/static-deploy): `vite build`, папката `dist` и предупреждението, че `vite preview` не е продукционен сървър. Посетено на 21 октомври 2026 г.
- [Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode): префиксът `VITE_`, статичната замяна при изграждане и предупреждението за чувствителна информация. Посетено на 21 октомври 2026 г.
- [React, общи компоненти: `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) и [„React v16.9.0“](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html): рискът от XSS с ненадежден HTML и обявяването, че React ще престане да приема адреси `javascript:`. Посетено на 21 октомври 2026 г.
- [React, „Server Components“](https://react.dev/reference/rsc/server-components), [„Server Functions“](https://react.dev/reference/rsc/server-functions) и [`"use server"`](https://react.dev/reference/rsc/use-server): какво са, къде работят, защо вътрешните им части не следват семантично версиониране и защо аргументите на Server Function са ненадежден вход; и известието за [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components). Посетено на 21 октомври 2026 г.
- [React, „Creating a React App“](https://react.dev/learn/creating-a-react-app): препоръката да се започне с framework и причините да се започне от нулата. Посетено на 21 октомври 2026 г.
- [MDN, `setTimeout`, „Maximum delay value“](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value) и [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval): забавянето като 32-битово цяло число със знак и препълването. Посетено на 21 октомври 2026 г.
- [TanStack Query, „Query Retries“](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries): `retry` като число или функция и изчакването, което се удвоява между опитите. Посетено на 21 октомври 2026 г.
- [Vitest, `css`](https://vitest.dev/config/css): `css.include` и файловете със стилове, които се заменят с празен текст. Посетено на 21 октомври 2026 г.
- [W3C, „Understanding SC 1.4.3: Contrast (Minimum)“](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): минималният контраст от 4.5 към 1 и формулата за относителна яркост. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| излишно рисуване | повторно рисуване на компонент, чийто резултат не се е променил, защото се е променило състоянието на родител |
| `<Profiler>` | компонент на React, който измерва колко пъти и колко време се рисува една част от дървото |
| `actualDuration` / `baseDuration` | колко е отнело рисуването при това обновяване / колко би отнело без никаква мемоизация |
| мемоизиране | запазване на резултат, за да се преизползва, докато входовете му не се променят |
| React Compiler | инструмент за изграждане, който мемоизира компонентите и hooks сам и пропуска тези, които нарушават правилата на React |
| `memo_cache_sentinel` | маркерът на React за „все още празен кеш“; компилаторът го записва за всяка стойност, която пази веднъж, така че преброяването му в `dist/` казва дали е действал |
| пренаписване към `index.html` | отговаряне със страницата на приложението за всеки адрес, който е маршрут на клиента |
| политика за сигурност на съдържанието (CSP) | заглавка, която казва на браузъра откъде може да зарежда и изпълнява всеки вид ресурс |
| `immutable` | указание за кеширане, което обещава, че файлът никога няма да се промени |
| обхождане на директории | атака, която използва `..` в адрес, за да чете файлове извън публикуваната папка |
| Server Component | компонент, който се рисува на сървъра или при изграждане, преди да стигне до браузъра |
| Server Function | функция, която работи на сървъра и която компонент в браузъра може да извика |
| положителна контрола | проверка в тест, че е намерено нещо, за което знаеш, че съществува, за да не даде празен файл зелено |
| препълване (*overflow*) | число, което не се побира в размера, в който се пази, и се превръща в друго |

---

**Край на курса.** Ако си стигнал дотук със своя `revisor`, върни се към [„Как разбираш, че си приключил“](README.md#cómo-sabes-que-terminaste) в README и провери петте условия. И отвори своя [дневник](bitacora.md): това, което си записал в тези десет урока, е това, което си струва да се преговори.
