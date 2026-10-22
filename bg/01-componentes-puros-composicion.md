# Урок 1 — Чисти компоненти и композиция

*6:50 вечерта е и началничката на експлоатацията иска за утре сутринта един-единствен ред над таблото: колко услуги са проверени и колко са в повреда. Изглежда като промяна от пет минути. Отваряш `Panel.tsx` и се натъкваш на файл, в който живеят заедно редът, списъкът, трите състояния на зареждането и бутонът; за да добавиш един ред, трябва да разбереш и четирите неща наведнъж. Добавяш го както можеш и го пробваш с обичайните данни: изглежда добре. В 7:30 някой от нощната смяна рестартира API с всички услуги в изправност и в края на новия ред, залепена за „revisados“, се появява `0`, която никой не е писал: `4 servicios revisados0`. По-късно, когато подреждаш списъка, „за да изглежда хубаво“, списъкът, който пазеше друга част от програмата, също се оказва подреден, без никой да го е искал. А когато колега слага брояч в „помощен“ компонент, дефиниран вътре в таблото, броячът се връща на нула на всеки десет секунди, при всяко обновяване. Нищо от това не чупи компилацията, нито линтера. Този урок разделя таблото на части, които се разбират поотделно, и те учи на трите правила, които предотвратяват тези три уплахи.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 1.3 и 1.4)

**Какво изграждаш:** таблото, разделено на части, които могат да се разбират и променят поотделно: `Tarjeta`, която обвива всякакво съдържание, обобщение на повредите, изчислено с чисти функции, и списъкът, редът и трите състояния на зареждането в собствени файлове

**Какво научаваш:** render и *commit*; чистота: еднакви входове, еднакъв изход; три нарочно поставени нечистоти, които трябва да се открият; `children` и композиция; `key` със стабилен идентификатор; капанът с `0`, изрисувана от `&&`; защо компонент никога не се дефинира вътре в друг

**Откъде идваш.** От [Урок 0](00-un-proyecto-de-verdad.md). Твоят `revisor` вече е проект на Vite с включен линтер за React, активен `StrictMode`, *proxy* към тестовия сървър и `Panel.tsx`, който прави всичко: дефинира `FilaEstado`, дефинира `Contenido` със `switch` за трите състояния на зареждането и сглобява страницата. Работи и минава линтера. Това, което му липсва, е форма: един-единствен файл с три отговорности. Работиш в същата папка, `~/curso-react/revisor/`.

**Какво не прави този урок.** Не добавя ново състояние: няма филтри, избор, нито бележки; това идва в [Урок 2](02-estado-instantanea-forma.md). Не пипа `useReporte`, нито мрежовата граница: hook-ът и `cargar.ts` остават идентични. Не променя тестовия сървър, който остава в първата си версия (`GET /salud` и `GET /api/estados`). И не прави оптимизации: ще видиш, че React извиква компонентите ти повече пъти, отколкото очакваш, а отговорът на този урок не е „мемоизирай го“, а „погрижи се извикването в повече да не вреди“. Измерването и оптимизирането са тема на [Урок 9](09-rendimiento-publicacion.md).

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии, които фиксира `package.json` на контролната точка (същите като в Урок 0: React 19.3.1, Vite 8.3.5, ESLint 10.13.0, `eslint-plugin-react-hooks` 7.1.1). С изключение на предупреждението за `fsevents`, обяснено в раздел 1.7, нищо от показаното не зависи от операционната система. В изпълненията на курса тази контролна точка беше инсталирана отново от нулата в контейнер с Linux (`node:24.22.0-bookworm`) и даде същото име на файл в `dist/`, което е показано тук, `index-Dezp5bTH.js`; тъй като това име идва от фрагмент от хеша на съдържанието, много вероятно е двете машини да са произвели един и същ пакет. Фигурите бяха изпълнени само под macOS; нищо не беше изпълнено на истински Linux Mint. Решенията на упражненията бяха изпълнени отделно, с Node.js 24.22.0, а програмите и изходите им са в [`programas/01-componentes-puros-composicion/ejercicios/`](../programas/01-componentes-puros-composicion/ejercicios). Това, което се вижда „в браузъра“, беше измерено с Chrome без графичен интерфейс (`--headless --dump-dom`), който изпълнява JavaScript-а на страницата и връща получения документ. Фигурите се изпълняват в `~/curso-react/figuras/`, същата папка като в Урок 0, със същия `package.json`; дългите пътища, които отпечатва ESLint, се показват спрямо `~/curso-react`. Часовете в лога на тестовия сървър са по UTC. Програмите са в [`programas/01-componentes-puros-composicion/`](../programas/01-componentes-puros-composicion): `revisor/` е контролната точка, а фигурите са до нея.

## След урока ще можеш да

- Различиш в реален изход коя част е *render* (React извиква твоите функции) и коя е *commit* (React пипа DOM), и да обясниш защо един render в повече не променя екрана.
- Откриеш трите нечистоти на компонент — промяна на нещо отвън, мутиране на prop, четене на часовника — и да поправиш всяка, без да промениш това, което човекът вижда.
- Разделиш голям компонент на части с по една отговорност и да напишеш компонент, който получава `children`, за да обвие съдържание, което не познава.
- Избереш `key` за списък и да демонстрираш с изпълнение какво става със състоянието на всеки ред, когато `key` е позицията, когато се променя заедно с позицията и когато е идентификаторът.
- Разпознаеш капана с `0` в `&&` и да напишеш условието така, че никога да не изрисува самотно число.
- Разчетеш грешката `static-components` на линтера и да обясниш с изпълнение защо компонент, дефиниран вътре в друг, губи състоянието си.

## Защо, преди как

Отвори `Panel.tsx` от Урок 0 и преброй на колко различни въпроса отговаря. Как изглежда налична услуга и как такава в повреда? Това е `FilaEstado`. Какво се показва, докато се зарежда, ако зареждането се провали и когато има данни? Това е `Contenido`. Какво има около страницата — заглавието и бутона? Това е `Panel`. Три въпроса във файл от шейсет реда. Днес се чете; проблемът е това, което предстои. В следващите уроци таблото ще получи филтър, избор, бележки, детайлите на всяка услуга, известия и формуляр. Ако всичко това влезе в същия файл, началничката на експлоатацията от сцената ще поиска един ред, а ти ще трябва да прочетеш триста.

Очевидният отговор е „раздели го на компоненти“. И той е правилният, но разделянето без разбиране какво е компонент за React произвежда части, които се чупят по странни начини: `0`, която се появява сама, списъкът, който се подрежда, без никой да го пипа, броячът, който се връща на нула при всяко обновяване. Тези три повреди имат един и същ корен: **React не извиква компонентите ти тогава, когато си мислиш, нито толкова пъти, колкото си мислиш.** Извиква ги всеки път, когато нещо може да се е променило, понякога два пъти подред, и разчита, че извикването им няма последствия. Ако компонентът спазва тази уговорка, можеш да го разделяш, местиш и преизползваш без страх. Ако не я спазва, всяка нова част умножава изненадите.

Затова този урок не започва с разделяне на файлове, а с три идеи, по една за всеки голям раздел:

1. **Чистота** (1.1 и 1.2). Какво прави React, когато „рисува“, и защо компонентите ти трябва да бъдат чисти функции: еднакви входове, еднакъв изход и никаква промяна на това, което е съществувало преди извикването им.
2. **Композиция** (1.3). Как се разделя компонент по отговорности и как компонент може да обвие съдържание, което не познава, с `children`.
3. **Идентичност** (1.4 до 1.6). Как React знае, че редът на `pagos` от това рисуване е същият като от предишното: `key`, позицията в дървото и причината компонент никога да не се дефинира вътре в друг. Капанът с `0` също се побира тук, защото е случай на „React изрисува нещо, което не си очаквал“.

Раздел 1.7 прави пълното преминаване: проверка на контролната точка и разглеждането ѝ в браузъра. Накрая ето изграждането, което ще получиш, и ще знаеш защо JavaScript-ът е сменил името си спрямо Урок 0, макар таблото „да прави същото“:

```text
$ npm run build

> revisor@0.1.0 build
> tsc -b && vite build

vite v8.3.5 building client environment for production...
transforming...
✓ 26 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.39 kB │ gzip:  0.26 kB
dist/assets/index-BUsPRE_Z.css    0.35 kB │ gzip:  0.22 kB
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

Двайсет и шест модула вместо двайсет: това са шестте нови файла от този урок. Таблото показва същото като преди, плюс карта със заглавна част и ред с обобщение; голямата разлика не се вижда на екрана, а се вижда, когато някой трябва да го промени.

## Понятията

### 1.1 Render и *commit*: какво прави React, когато „рисува“

#### 1.1.1 Три стъпки, а не една

Досега казваше „React рисува компонента“, сякаш е едно-единствено нещо. Документацията на React го разделя на три стъпки, със сравнение с ресторант: някой **подава** поръчката, кухнята я **приготвя**, а сервитьорът я **занася** на масата. В React те се наричат *trigger*, *render* и *commit* и всяко обновяване на екрана минава през трите ([React, „Render and Commit“](https://react.dev/learn/render-and-commit)):

1. **Задействане** (*trigger*). Нещо поисква рисуване: първото `createRoot(...).render(...)` при отваряне на страницата или промяна на състоянието, като `establecerCarga` от `useReporte`, когато пристигне отговорът.
2. **Render.** React **извиква твоите функции на компоненти**. Извиква `Panel`, `Panel` връща JSX, който споменава `Tarjeta`, React извиква `Tarjeta` и така надолу. Документацията казва, че процесът е рекурсивен: продължава, докато не останат вложени компоненти и React знае точно какво трябва да се покаже. Резултатът от тази стъпка не е екранът; той е описание как трябва да изглежда.
3. ***Commit.*** React прилага към DOM разликите, които вече е изчислил по време на render-а, и **пипа DOM само там, където има разлика**. Сравнението между новото и предишното описание става, докато рисува; в *commit* само се изпълняват промените. С думите на документацията: React променя възлите на DOM само ако има разлика между два render-а и прилага минималните необходими операции, „изчислени по време на render-а“.

След *commit* браузърът отново изрисува екрана. Документацията нарича тази последна стъпка *painting* (оцветяване), за да не се бърка с render-а на React. В този курс се използва същото разграничение: **render** е, когато React извиква твоите функции; **оцветяване** е, когато браузърът рисува пиксели. На български „рисуване“ на компонент досега се използваше като синоним на render и така ще продължи да се използва.

Render-ът произвежда **дърво**: `Panel` горе, `Tarjeta` под него, после `ContenidoReporte` и така нататък. Документацията го нарича дърво на render-а и уточнява, че е съставено само от компоненти на React ([React, „Understanding Your UI as a Tree“](https://react.dev/learn/understanding-your-ui-as-a-tree)). Това дърво ще бъде важно в 1.4 и 1.6, когато въпросът ще бъде как React знае, че компонент от този render е същият като от предишния.

#### 1.1.2 Да го видим в изпълнение

Първата фигура го прави видимо. Списък с два реда отпечатва по един ред всеки път, когато React извиква компонент (render), а `MutationObserver` — API на браузъра, което известява, когато нещо се промени в DOM — брои колко записа за промяна е получил контейнерът при всеки *commit* („промените в DOM“ в изхода). Рисува се три пъти: първия път, още веднъж със същите данни и още веднъж с различно число.

```tsx
// fig01_01.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly ms: number };

function Fila({ servicio }: { readonly servicio: Servicio }) {
  console.log(`  render: Fila ${servicio.nombre}`);
  return (
    <li>
      {servicio.nombre}: {servicio.ms} ms
    </li>
  );
}

function Lista({ servicios }: { readonly servicios: readonly Servicio[] }) {
  console.log("  render: Lista");
  return (
    <ul>
      {servicios.map((servicio) => (
        <Fila key={servicio.nombre} servicio={servicio} />
      ))}
    </ul>
  );
}

const contenedor = dom.window.document.getElementById("raiz")!;
let cambios = 0;
const observador = new dom.window.MutationObserver((registros) => {
  cambios += registros.length;
});
observador.observe(contenedor, { childList: true, subtree: true, characterData: true });
const raiz = createRoot(contenedor);

async function dibujar(titulo: string, servicios: readonly Servicio[]): Promise<void> {
  console.log(titulo);
  await act(async () => {
    raiz.render(<Lista servicios={servicios} />);
  });
  cambios += observador.takeRecords().length;
  console.log(`  commit: cambios en el DOM = ${cambios}`);
  cambios = 0;
}

await dibujar("1) primera vez:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("2) mismos datos:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 118 },
]);
await dibujar("3) cambia un número:", [
  { nombre: "catálogo", ms: 42 },
  { nombre: "inventario", ms: 97 },
]);
console.log(`DOM final: ${contenedor.innerHTML}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_01.tsx
$ node fig01_01.js
1) primera vez:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
2) mismos datos:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 0
3) cambia un número:
  render: Lista
  render: Fila catálogo
  render: Fila inventario
  commit: cambios en el DOM = 1
DOM final: <ul><li>catálogo: 42 ms</li><li>inventario: 97 ms</li></ul>
```

Прочети трите части спокойно, защото целият урок стъпва на тях:

- **Първия път** React извика трите компонента и *commit*-ът произведе един-единствен запис за промяна: вмъкването на цялата `<ul>`, с двата ѝ реда вътре, наведнъж. (`MutationObserver` дава записи за това, което се е променило в контейнера, а не списък с вътрешните операции на React; затова `1` означава „вмъкната е `<ul>`“, а не „React е направил точно една операция“. [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).)
- **Със същите данни** React отново извика трите компонента — render-ът се случи изцяло, — а *commit*-ът направи **нула** промени. React сравни, не намери разлики и не пипна DOM.
- **С различно число** отново бяха извикани трите, включително редът на `catálogo`, който не се е променил. *Commit*-ът произведе един-единствен запис за промяна: текстът `118` стана `97`. Не замени реда, нито списъка; промени един текстов възел.

От тук излизат два извода и и двата са против интуицията. Първият: **това, че React извиква компонента ти, не означава, че екранът се променя.** Render-ът е въпрос („как трябва да изглежда това сега?“), а не заповед за преизрисуване. Вторият: **React извиква компонентите ти повече, отколкото би ти трябвало**: редът на `catálogo` беше изчислен три пъти, два от които без нищо негово да се е променило. Това не е дефект, който трябва да се преследва с `memo` (Урок 9 обяснява кога да, и винаги след измерване); това е част от дизайна. React може да си позволи да извиква в повече, защото разчита на едно условие: извикването на компонента ти да няма последствия. Това условие има име.

#### 1.1.3 Защо това е важно за разделянето на таблото

Когато таблото беше едно цяло, всеки render извикваше `Panel`, `Contenido` и четири `FilaEstado`. Сега, когато ще го разделиш, компонентите ще са повече и всеки ще се извиква при всеки render на родителя си. Ако някой от тях „прави нещо“, когато бъде извикан — увеличава брояч, променя масив, чете часа, — това нещо ще се повтаря толкова пъти, колкото React реши да го извика, а ти не контролираш колко са те. Затова чистотата идва преди разделянето: тя прави безопасно да имаш много части.

### 1.2 Чистота: еднакви входове, еднакъв изход

#### 1.2.1 Двете условия

Документацията на React определя чистия компонент с две условия, взети от определението за чиста функция в математиката и в програмирането ([React, „Keeping Components Pure“](https://react.dev/learn/keeping-components-pure)):

- **Гледа си работата.** Не променя нито един обект или променлива, които са съществували, преди да бъде извикан.
- **Еднакви входове, еднакъв изход.** При еднакви входове винаги връща един и същ резултат.

Кои са входовете на един компонент? Същата страница го казва: в React има три вида вход, които можеш да четеш по време на рисуване — props, състоянието и контекстът — и трите се третират **като само за четене**. Днес използваш само props; състоянието идва в Урок 2, а контекстът в Урок 6, и правилото ще бъде същото и за трите. Справочникът с правилата на React го формулира с технически термин: компонентите трябва да бъдат **идемпотентни**, винаги да връщат един и същ изход спрямо входовете си, защото React може да рисува един компонент няколко пъти, за да даде възможно най-доброто изживяване ([React, „Components and Hooks must be pure“](https://react.dev/reference/rules/components-and-hooks-must-be-pure)).

Това, което е позволено, е да се промени онова, което самият компонент току-що е създал. Документацията го нарича **локална мутация**: ако вътре в компонента създадеш нов масив и добавиш елементи към него, никой отвън не го вижда, а следващото извикване създава нов. Проблемът никога не е мутирането; проблемът е да се мутира нещо, което **вече е съществувало** преди извикването.

#### 1.2.2 Три нарочно поставени нечистоти

Втората фигура съдържа компонент с три нечистоти, скрити в три последователни реда. Преди да прочетеш обяснението, погледни кода и изхода и се опитай да ги откриеш сам. Подсказките са в изхода: всеки от редове 2, 3 и 4 е симптомът на една от тях.

```tsx
// fig01_02.tsx
import { JSDOM } from "jsdom";
import { act, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type Servicio = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

let revision = 0;

function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
  revision = revision + 1;
  const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  const hora = new Date().toISOString().slice(11, 19);

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}

const servicios: Servicio[] = [
  { nombre: "pagos", tipo: "falla" },
  { nombre: "catálogo", tipo: "disponible" },
  { nombre: "reportes", tipo: "falla" },
];
const nombres = () => servicios.map((s) => s.nombre).join(", ");

console.log(`1) el arreglo antes de dibujar:   ${nombres()}`);
const raiz = createRoot(dom.window.document.getElementById("raiz")!);
await act(async () => {
  raiz.render(
    <StrictMode>
      <ResumenImpuro servicios={servicios} />
    </StrictMode>,
  );
});
console.log(`2) el arreglo después de dibujar: ${nombres()}`);
console.log(`3) se montó una vez y el contador dice: ${revision}`);

const horaDe = (html: string) => /a las (\d\d:\d\d:\d\d)/.exec(html)?.[1];
const primera = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
await new Promise((listo) => setTimeout(listo, 1100));
const segunda = renderToStaticMarkup(<ResumenImpuro servicios={servicios} />);
console.log(`4) mismas props, ¿misma hora en los dos dibujos? ${horaDe(primera) === horaDe(segunda) ? "sí" : "no"}`);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_02.tsx
$ node fig01_02.js
1) el arreglo antes de dibujar:   pagos, catálogo, reportes
2) el arreglo después de dibujar: catálogo, pagos, reportes
3) se montó una vez y el contador dice: 2
4) mismas props, ¿misma hora en los dos dibujos? no
```

`renderToStaticMarkup` е функция от `react-dom/server`, която рисува дърво и връща HTML като текст, без браузър и без DOM; тук тя служи, за да се нарисува един и същ компонент два пъти, с една секунда разлика, и да се сравни. Ако вече си открил трите, сравни със списъка. Ако не, прочети отново първите три реда от тялото на `ResumenImpuro`, преди да продължиш.

**Нечистота 1: променя променлива отвън.** `revision = revision + 1` модифицира променлива, която е съществувала преди извикването на компонента. Симптомът е ред 3: монтиран е **веднъж**, а броячът казва **2**. Защо? Защото `StrictMode` по време на разработка извиква всеки компонент два пъти точно за да извади това наяве; документацията го казва така: като извиква функциите на компонентите два пъти, `StrictMode` помага да се открият компонентите, които нарушават тези правила ([React, „Keeping Components Pure“](https://react.dev/learn/keeping-components-pure)). В Урок 0 видя допълнителния цикъл на ефектите; това е неговият брат — допълнителният render. В продукция няма да има двойно извикване, но и така не се спасяваш: React може да извиква компонента всеки път, когато родителят му се рисува, и числото би престанало да означава „проверки“ и би започнало да означава „пъти, когато на React му е било удобно да ме извика“.

**Нечистота 2: мутира prop.** `servicios.sort(...)` изглежда, че „изчислява подредена версия“, но `sort` подрежда масива **на място** и връща същия масив ([MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). Симптомът е ред 2: масивът, който принадлежеше на този, който извика компонента, остана пренареден. Това е втората уплаха от сцената — списъкът, който се подреди сам. Props са, по думите на документацията, неизменни снимки на един момент: не се променят ([React, „Passing Props to a Component“](https://react.dev/learn/passing-props-to-a-component)).

**Нечистота 3: чете часовника.** `new Date()` връща нещо различно при всяко извикване, макар props да са същите. Симптомът е ред 4: еднакви props, две рисувания, два различни часа. Справочникът на React използва същия пример: `new Date()` не е идемпотентно, защото връща текущата дата и се променя при всяко извикване; същото важи и за `Math.random()` ([React, „Components and Hooks must be pure“](https://react.dev/reference/rules/components-and-hooks-must-be-pure)). С часовник в render-а изходът зависи от това **кога** React е решил да извика компонента — нещо, което ти не контролираш.

#### 1.2.3 Кой те предупреждава за всяка от тях?

Практическият въпрос е кой от инструментите ти хваща всяка нечистота, преди да стигне до потребителя. Измерено беше с трите инструмента на курса и резултатът не е този, който човек би очаквал.

**Линтерът хваща първата.** Ето какво казва ESLint за фигурата:

```text
$ npx eslint fig01_02.tsx

~/curso-react/figuras/fig01_02.tsx
  19:3  error  Error: Cannot reassign variables declared outside of the component/hook

Variable `revision` is declared outside of the component/hook. Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render).

~/curso-react/figuras/fig01_02.tsx:19:3
  17 |
  18 | function ResumenImpuro({ servicios }: { readonly servicios: Servicio[] }) {
> 19 |   revision = revision + 1;
     |   ^^^^^^^^ `revision` cannot be reassigned
  20 |   const ordenados = servicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  21 |   const hora = new Date().toISOString().slice(11, 19);
  22 |  react-hooks/globals

✖ 1 problem (1 error, 0 warnings)
```

Това е правилото `globals`, едно от четиринайсетте, които идват от React Compiler и които Урок 0 включи: то проверява да не се присвояват и мутират глобални променливи по време на render-а ([React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals)). Съобщението дори предлага двата изхода: ако стойността се използва за рисуване, да бъде състояние; ако не, да се обновява в ефект.

**Другите две линтерът не ги видя.** Това беше проверено, като в копие се изтри редът с `revision` и ESLint се изпълни отново: единственото предупреждение, което остана, беше `prefer-const` (защото `revision` вече не се присвояваше наново), нищо от React. Нито `sort` върху prop-а, нито `new Date()` предизвикаха грешка. Второто заслужава коментар: страницата на правилото `purity` споменава `new Date()` сред примерите си ([React, lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity)), но във версия 7.1.1 на пакета, измерено в онзи ден, правилото се задейства с `Date.now()`, а не с `new Date()`. Когато в копието `new Date()` беше заменено с `new Date(Date.now())`, се появи `Error: Cannot call impure function during render`, с правилото `react-hooks/purity`. Самата страница представя списъка си като „обичайни примери“ (*usual examples*, с `Date.now()` и `new Date()` на един и същ ред), а не като опис на това, което инсталираната версия открива. Практическата поука: **линтерът е мрежа, а не стена.** Хваща много, а това, което не хваща, остава твоя отговорност.

**TypeScript хваща втората, ако го помолиш.** Обърни внимание на типа на prop-а: `Servicio[]`, без `readonly`. Написан е така нарочно, за да се компилира фигурата. Ако смениш типа на `readonly Servicio[]`, както `contrato.ts` на `revisor` декларира списъците си от Урок 0 насам (`readonly estados: readonly EstadoPublico[]`), компилацията спира:

```text
fig01_02.tsx(20,31): error TS2339: Property 'sort' does not exist on type 'readonly Servicio[]'.
```

(Това е първата от четирите грешки в това изпълнение; пълният изход е в `ejercicios/fig01_02.tipos-esperado.txt`.)

Масив `readonly` в TypeScript няма методите, които мутират: нито `sort`, нито `push`, нито `splice`. Тази дума, която изглеждаше като украса в `contrato.ts`, всъщност е защитата срещу втората нечистота. Трите грешки в типовете, които я съпровождат в това изпълнение (`TS7006`, параметри с неявен тип `any`), са следствие от първата: тъй като `sort` не съществува, TypeScript вече не знае какъв тип имат `a` и `b`, нито резултатът `ordenados`, и затова не знае и типа на `s` от `map` на ред 25.

**`StrictMode` хваща тези, които променят нещо при всяко извикване.** Броячът, който казва 2, го извади наяве `StrictMode`. В истинско приложение би го видял като „проверката скача през две по време на разработка“, и тази странност е следата.

Обобщение на защитата: **линтерът** за това, което се вижда в текста на кода, **TypeScript с `readonly`** за мутациите на данни, които получаваш, **`StrictMode`** за ефектите, които се повтарят, и **твоите очи** за останалото. Нито едно само по себе си не стига. Упражнение 1 те моли да поправиш и трите.

#### 1.2.4 Къде отива нечистото

Ако компонентът не може да чете часовника, нито да променя каквото и да е, къде се правят тези неща? Документацията на React отговаря с ред на предпочитание: страничните ефекти обикновено отиват в **обработчиците на събития** (например `onClick` на бутон), които React не извиква по време на render-а; а ако няма подходящо събитие, като последна мярка — в `useEffect` ([React, „Keeping Components Pure“](https://react.dev/learn/keeping-components-pure)). Таблото ти вече го прави добре: заявката към API живее в ефекта на `useReporte`, защото това е синхронизиране с нещо отвън, а `establecerCarga({ tipo: "cargando" })` на „Actualizar“ живее в `recargar`, което се изпълнява при кликване. Урок 3 се връща подробно към ефектите.

А това, което може да се **изчисли** от props, не е страничен ефект: точно това прави чистият компонент. Преброяването на услугите в повреда е изчисление. Затова първият нов файл в контролната точка не е компонент, а две чисти функции:

```ts
// revisor/src/reporte/resumen.ts
import type { EstadoPublico } from "../compartido/contrato";

export function contarFallas(estados: readonly EstadoPublico[]): number {
  return estados.filter((estado) => estado.tipo === "falla").length;
}

export function textoFallas(fallas: number): string {
  return fallas === 1 ? "1 servicio con falla" : `${fallas} servicios con falla`;
}
```

Двете изпълняват двете условия. `contarFallas` получава списък `readonly`, така че не би могла да го мутира, дори да иска, а `filter` връща нов масив (локална мутация, която никой не вижда). `textoFallas` решава единственото число, защото „1 servicios con falla“ звучи зле. Никоя от двете не знае за React, JSX или DOM, и затова могат да се проверят с `console.log` или, в Урок 8, с тест от три реда, без да се монтира нищо. **Отделянето на изчислението от представянето** е първият ход в този урок: това, което е изчисление, отива в чиста функция във файл `.ts`; това, което е представяне, отива в компонент, който я извиква.

### 1.3 Композиция: разделяне на таблото по отговорности

#### 1.3.1 Кога да се раздели и откъде

Документацията на React, в ръководството си за мислене за интерфейс, предлага да се разделя със същите техники, с които решаваш дали да напишеш нова функция; една от тях е разделянето на отговорностите: компонентът в идеалния случай се занимава само с едно нещо, а ако порасне, се разлага на по-малки подкомпоненти ([React, „Thinking in React“](https://react.dev/learn/thinking-in-react)). Приложено към `Panel.tsx` от Урок 0, отговорностите вече бяха пред очите ни; просто живееха в един и същ файл. Контролната точка ги разделя така, отдолу нагоре:

| Файл | Въпрос, на който отговаря | Получава |
|---|---|---|
| `FilaEstado.tsx` | Как изглежда **една** услуга? | един `EstadoPublico` |
| `ListaEstados.tsx` | Как изглежда **списъкът** с услуги? | списъка |
| `ResumenFallas.tsx` | Какво казва редът с **обобщението**? | списъка |
| `ContenidoReporte.tsx` | Какво се показва според **зареждането**: изчакване, грешка или данни? | една `Carga` |
| `Tarjeta.tsx` | Как изглежда **кутия със заглавие**, каквото и да е съдържанието ѝ? | заглавие и `children` |
| `Panel.tsx` | Как се **сглобява** страницата? | `cargar` и `cadaMs` |

Обърни внимание на колоната „Получава“: всяка част получава само това, от което има нужда. `FilaEstado` не знае, че съществува зареждане; `ListaEstados` не знае, че има бутон; `ResumenFallas` не знае как се иска отчетът. Това незнание е ценното: ако утре промениш как изглежда един ред, отваряш файл от осемнайсет реда и не трябва да разбираш нищо друго.

Първите два излизат от стария `Panel.tsx` почти без промени. `FilaEstado` е идентична с тази от Урок 0, сега експортирана от собствен файл:

```tsx
// revisor/src/reporte/FilaEstado.tsx
import type { EstadoPublico } from "../compartido/contrato";

export function FilaEstado({ estado }: { readonly estado: EstadoPublico }) {
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
```

`ListaEstados` е `<ul>` с неговия `map`, който преди живееше вътре в `case "listo"`. Има една промяна спрямо Урок 0, в `key`, която раздел 1.4 обяснява с изпълнение:

```tsx
// revisor/src/reporte/ListaEstados.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { FilaEstado } from "./FilaEstado";

export function ListaEstados({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  return (
    <ul>
      {estados.map((estado) => (
        <FilaEstado key={estado.nombre} estado={estado} />
      ))}
    </ul>
  );
}
```

Обобщението е ново и е редът, който поиска началничката на експлоатацията. Използва двете чисти функции от 1.2.4 и съдържа, вече решен, капана с `0`, който 1.5 обяснява:

```tsx
// revisor/src/reporte/ResumenFallas.tsx
import type { EstadoPublico } from "../compartido/contrato";
import { contarFallas, textoFallas } from "./resumen";

export function ResumenFallas({ estados }: { readonly estados: readonly EstadoPublico[] }) {
  const fallas = contarFallas(estados);

  return (
    <p className="resumen">
      {estados.length} servicios revisados
      {fallas > 0 && <strong> · {textoFallas(fallas)}</strong>}
    </p>
  );
}
```

Един детайл на JSX, който обяснява защо текстът излиза слепен както трябва: новият ред и отстъпът между `servicios revisados` и скобата `{fallas > 0 && …}` **не** създават интервал в страницата, защото JSX изхвърля празните пространства, които включват нов ред. Затова разделителят `·` носи интервала си вътре в `<strong>`: `<strong> · …</strong>`. Ако махнеш този интервал, на екрана ще видиш `revisados· 2 servicios`.

`ContenidoReporte` е старият `Contenido`, с пълното си име и `case "listo"`, превърнат в две части. `<>` и `</>` са **фрагмент**: начин да се върнат два съседни елемента, без да се обвиват в `<div>`, който не означава нищо:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { ListaEstados } from "./ListaEstados";
import { ResumenFallas } from "./ResumenFallas";
import type { Carga } from "./useReporte";

export function ContenidoReporte({ carga }: { readonly carga: Carga }) {
  switch (carga.tipo) {
    case "cargando":
      return <p role="status">Cargando…</p>;
    case "error":
      return <p role="alert">No se pudo cargar el reporte: {carga.detalle}</p>;
    case "listo":
      return (
        <>
          <ResumenFallas estados={carga.reporte.estados} />
          <ListaEstados estados={carga.reporte.estados} />
        </>
      );
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

`default` с `never` е същият като в Урок 0 и остава по същата причина: ако утре някой добави четвърти тип към `Carga` (Урок 4 добавя празното състояние, макар и по друг начин), TypeScript ще посочи този `switch` като непълен. Забележи и това, което **не** беше направено: `ResumenFallas` и `ListaEstados` получават един и същ списък и всеки прави с него своето. Нито един не го пази, нито един не го копира в състояние, нито един не го променя. И двата са чисти и затова споделянето на един и същ списък е безопасно.

#### 1.3.2 `children`: празното място, което запълва родителят

Липсва частта, която учи най-много. Началничката на експлоатацията иска отчетът да изглежда като карта: рамка със заглавие. И е лесно да се досетиш, че щом съществува, някой ще поиска още една такава карта за детайлите на услуга, още една за известията и още една за формуляра. Можеш да напишеш `TarjetaReporte`, `TarjetaDetalle` и `TarjetaAvisos`, три почти еднакви компонента. Или можеш да напишеш **една** карта, която не знае какво носи вътре.

React решава това със специален prop. Когато вложиш съдържание в JSX таг, родителският компонент получава това съдържание в prop с име `children`. Документацията предлага да си го представиш така: компонент с `children` има „празно място“, което компонентите, които го използват, могат да запълнят с какъвто JSX искат, и той няма нужда да знае какво се рисува вътре ([React, „Passing Props to a Component“](https://react.dev/learn/passing-props-to-a-component)). Това е **композицията**: сглобяване на големи части чрез събиране на части, които не се познават помежду си.

```tsx
// revisor/src/compartido/Tarjeta.tsx
import type { ReactNode } from "react";

export function Tarjeta({
  titulo,
  children,
}: {
  readonly titulo: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="tarjeta" aria-label={titulo}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}
```

Три решения в този файл:

- **Живее в `src/compartido/`, а не в `src/reporte/`.** Не знае нищо за отчета. Това е първата част на приложението, замислена за няколко функционалности, и папката го казва. Това е принципът за папки по функционалност от Урок 0: това, което използва една-единствена функционалност, живее с нея; това, което използват няколко — в `compartido/`.
- **`children` има тип `ReactNode`.** Това е типът, който React експортира за „всичко, което може да се нарисува“: JSX елемент, текст, число, списък от елементи, `null`. Така картата приема каквото сложиш вътре, а TypeScript те предупреждава, ако ѝ подадеш нещо, което React не умее да рисува, например самостоятелен обект.
- **Използва `<section>` с достъпно име.** Произволен `<section>` не означава нищо особено за екранен четец. Но според MDN `<section>` предава ролята `region` (зона с име, към която човекът може да прескочи), когато има достъпно име ([MDN, роля `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role)). Тук името му го дава `aria-label={titulo}`. Когато има видимо заглавие, MDN предпочита `aria-labelledby`, сочещ към заглавието, вместо да се повтаря текстът; контролната точка използва `aria-label` за простота: текстът е същият като този на `<h2>`, а формата, която MDN предпочита, `aria-labelledby`, изисква уникален `id` за всяка карта, който в React се генерира с `useId` — hook, който курсът още не представя. Това е решение на курса, а не правило: двете форми дават едно и също име. Достъпността, както казва README на курса, е навик, който се преподава там, където се появява; Урок 8 търси в страницата по роля и по име и този регион е едно от нещата, които открива.

А `Panel` остава така, без никаква собствена логика за представяне:

```tsx
// revisor/src/reporte/Panel.tsx
import { Tarjeta } from "../compartido/Tarjeta";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
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

  return (
    <main>
      <h1>Revisor</h1>
      <Tarjeta titulo="Estado de los servicios">
        <ContenidoReporte carga={carga} />
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Прочети JSX-а на `Panel` като изречение: „страницата има заглавие и карта с име Estado de los servicios, която съдържа съдържанието на отчета и бутон“. Това, което е между `<Tarjeta>` и `</Tarjeta>` — съдържанието и бутонът, — е точно това, което `Tarjeta` получава като `children` и поставя под своя `<h2>`. `Tarjeta` не знае, че има бутон, нито че съществува зареждане; `Panel` не знае, че картата използва `<section>`. Ако утре картата смени стила си, променяш един файл и всички карти го наследяват.

Има един по-малко видим и много полезен ефект: бутонът **пътува заедно със състоянието, което го управлява**. `recargar` идва от `useReporte`, който живее в `Panel`; бутонът е в JSX-а на `Panel`. `Tarjeta` го рисува, но не го познава. Ако вместо `children` беше подал `recargar` като prop на `Tarjeta`, за да рисува тя бутона, картата щеше да престане да бъде обща: щеше да знае за презарежданията. `children` позволява на всяка част да знае само своето, а Урок 6 се връща към това, когато се пита дали е нужен контекст: много често отговорът е „не, `children` е достатъчно“.

Файлът със стилове расте с две правила, едно за картата и друго за подчертаване на броя повреди:

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
```

Правилото `.tarjeta` живее във файла със стилове на отчета, макар `Tarjeta` да е в `compartido/`. Курсът използва **един-единствен файл със стилове**, който расте урок след урок; това е съзнателно опростяване, за да не се налага да се гонят стилове между файловете. Когато един проект наистина порасне, всеки споделен компонент обикновено носи свой файл със стилове; тук това още не е нужно.

`useReporte.ts`, `cargar.ts`, `main.tsx`, `contrato.ts`, `configuracion.ts` и тестовият сървър не се променят. В `package.json` се променя само номерът на версията, от `0.0.0` на `0.1.0`: курсът използва `0.N.0` в контролната точка на урок N.

### 1.4 `key`: как React знае, че един ред е същият

#### 1.4.1 Проблемът, който решава

Върни се към фигура 1. При третото рисуване React промени един текст и не замени реда. Как разбра, че редът на `inventario` от третото рисуване е **същият** като от второто и че е достатъчно да му се промени числото? При списък, който винаги носи едни и същи елементи в един и същ ред, би могъл да използва позицията. Но списъците се променят: нова услуга се появява най-горе, друга се премахва, редът се сменя. За да съпостави елементите на един списък между два render-а, React използва `key`.

Документацията поставя две правила ([React, „Rendering Lists“](https://react.dev/learn/rendering-lists)):

- **`key` са уникални сред съседните елементи.** Два елемента от един и същ списък не могат да споделят един и същ `key` (в различни списъци могат да се повтарят).
- **`key` не трябва да се променят**, иначе губят смисъла си; затова не се генерират по време на render-а.

И изяснява един объркващ детайл: компонентът ти **не получава** `key` като prop. Това е подсказка за React; ако `FilaEstado` имаше нужда от името, щеше да му го подадеш отделно (тук то вече го има, вътре в `estado`).

#### 1.4.2 Три `key` за един и същ списък

В Урок 0 редът носеше `` key={`${posicion}-${estado.nombre}`} ``. Работеше и нямаше повторения. Защо да се променя? Фигура 3 отговаря чрез измерване. Списък от четири услуги получава пета, `correo`, **в началото**, и се пробват три форми на `key`. Всеки ред пази в състоянието си името, с което се е родил — `useState` с начална стойност, който се обяснява подробно в Урок 2; тук е достатъчно да знаеш, че React го запазва, докато редът е „същият“, — и показва предупреждение, ако сега му се налага да рисува друго име. Освен това се брои колко `<li>` от DOM са нови след промяната.

```tsx
// fig01_03.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function Fila({ nombre }: { readonly nombre: string }) {
  const [nacio] = useState(nombre);

  return <li>{nombre === nacio ? nombre : `${nombre} (nació como ${nacio})`}</li>;
}

type Llave = (nombre: string, posicion: number) => string;

function Lista({ nombres, llave }: { readonly nombres: readonly string[]; readonly llave: Llave }) {
  return (
    <ul>
      {nombres.map((nombre, posicion) => (
        <Fila key={llave(nombre, posicion)} nombre={nombre} />
      ))}
    </ul>
  );
}

const antes = ["catálogo", "pagos", "inventario", "reportes"];
const despues = ["correo", ...antes];

const estrategias: readonly (readonly [string, Llave])[] = [
  ["key={posicion}", (_nombre, posicion) => String(posicion)],
  ["key={`${posicion}-${nombre}`}", (nombre, posicion) => `${posicion}-${nombre}`],
  ["key={nombre}", (nombre) => nombre],
];

for (const [titulo, llave] of estrategias) {
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Lista nombres={antes} llave={llave} />);
  });
  const viejos = new Set(contenedor.querySelectorAll("li"));
  await act(async () => {
    raiz.render(<Lista nombres={despues} llave={llave} />);
  });
  const filas = [...contenedor.querySelectorAll("li")];
  const nuevos = filas.filter((li) => !viejos.has(li));
  console.log(titulo);
  console.log(`  filas creadas desde cero: ${nuevos.length} de ${filas.length}`);
  console.log(`  ${filas.map((li) => li.textContent).join(" | ")}`);
  await act(async () => {
    raiz.unmount();
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_03.tsx
$ node fig01_03.js
key={posicion}
  filas creadas desde cero: 1 de 5
  correo (nació como catálogo) | catálogo (nació como pagos) | pagos (nació como inventario) | inventario (nació como reportes) | reportes
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 5 de 5
  correo | catálogo | pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 1 de 5
  correo | catálogo | pagos | inventario | reportes
```

Три резултата, три поуки:

- **`key={posicion}`: грешната идентичност.** React съпостави по позиция: редът, който беше на място 0 (този на `catálogo`), сега получава `correo`, този на място 1 (на `pagos`) получава `catálogo` и така нататък. Създаде само един нов ред — последния. DOM остана с правилните текстове, но **състоянието на всеки ред остана на мястото си, докато данните се изместиха**: редът, който казва `correo`, за React е този, който се е родил като `catálogo`. Ако редът на `pagos` пазеше в собственото си състояние нещо, което човекът е написал, сега този текст щеше да се появи до `catálogo`. Документацията предупреждава за това: използването на позицията като `key` (което React прави, ако не сложиш нищо) често води до фини и объркващи грешки, когато елементи се вмъкват, изтриват или пренареждат ([React, „Rendering Lists“](https://react.dev/learn/rendering-lists)).
- **`` key={`${posicion}-${nombre}`} ``: идентичността, която се губи.** Това е `key` от Урок 0. Докато имената не се повтарят, тя не бърка един ред с друг, защото включва името. Но включва и позицията, а при вмъкването на `correo` най-горе **всички** позиции се промениха: `0-catálogo` стана `1-catálogo`, `key`, която React никога не е виждал. Резултат: пет реда, създадени от нулата от общо пет, а четирите стари — унищожени с цялото им състояние. Това е същият дефект, който документацията посочва за `key={Math.random()}`, в по-малка степен: `key` не съвпадат между render-ите и компонентите и DOM се пресъздават. В `revisor` това не се забелязва, защото `FilaEstado` не пази собствено състояние, а Урок 2 го запазва така нарочно: бележките ще живеят в `Panel`, а отметката „с бележка“ на всеки ред ще се изчислява от тях, така че пресъздаването на ред не изтрива нищо. Но цената в работа остава (пет реда, унищожени и пресъздадени там, където беше достатъчно да се създаде един), а в деня, в който един ред наистина пази нещо в собственото си състояние, например наполовина написано текстово поле, това нещо би се загубило във всички редове. Стабилната `key` е тази, която не зависи от това някой да помни това условие.
- **`key={nombre}`: правилната идентичност.** Само един нов ред, този на `correo`, а четирите обичайни са запазени, всеки със собственото си състояние. Това е `key` на контролната точка.

#### 1.4.3 Защо името е сигурна `key`

Документацията препоръчва `key` да се взема от данните: ако идват от база данни, идентификаторите им са уникални по природа ([React, „Rendering Lists“](https://react.dev/learn/rendering-lists)). Типовете на API, в `contrato.ts`, нямат числов идентификатор; имат името на услугата. Уникално ли е? В дизайна на тази система — да: името е идентичността на услугата (пътят на детайлите от Урок 3 насам е `/api/servicios/:nombre`), а от Урок 4 нататък, когато тестовият сървър приема регистрации, опитът да се регистрира име, което вече съществува, отговаря с `409` и `ya existe un servicio llamado X`. Екранът стъпва на това правило, защото този, който го налага, е API; екранът не го измисля. И като всяко правило на друга система, то важи, докато тази система го спазва: затова е добре да знаеш какво става, ако един ден не го спази.

А ако API сгреши и изпрати две услуги с едно и също име? React те предупреждава по време на разработка. Фигура 4 предизвиква двете предупреждения за `key`, които ще видиш в конзолата на браузъра: списъка без `key` и повтарящата се `key`. Съобщенията на React излизат през `console.error`; фигурата ги улавя, за да ги отпечата с префикс.

```tsx
// fig01_04.tsx
import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { format } from "node:util";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

console.error = (...partes: unknown[]) => {
  const mensaje = format(...partes);
  console.log(`  console.error: ${mensaje}`);
};

function SinLlave({ nombres }: { readonly nombres: readonly string[] }) {
  return <ul>{nombres.map((nombre) => <li>{nombre}</li>)}</ul>;
}

function LlaveRepetida({ nombres }: { readonly nombres: readonly string[] }) {
  return (
    <ul>
      {nombres.map((nombre) => (
        <li key={nombre}>{nombre}</li>
      ))}
    </ul>
  );
}

for (const [titulo, arbol] of [
  ["sin key:", <SinLlave nombres={["catálogo", "pagos"]} />],
  ["dos servicios con el mismo nombre:", <LlaveRepetida nombres={["pagos", "pagos"]} />],
] as const) {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));
  await act(async () => {
    raiz.render(arbol);
  });
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_04.tsx
$ node fig01_04.js
sin key:
  console.error: Each child in a list should have a unique "key" prop.

Check the render method of `SinLlave`. See https://react.dev/link/warning-keys for more information.
dos servicios con el mismo nombre:
  console.error: Encountered two children with the same key, `pagos`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

Първото предупреждение казва „всяко дете в списък трябва да има уникален prop `key`“ и посочва виновния компонент: „провери метода за render на `SinLlave`“. Второто казва „намерени са две деца с една и съща `key`, `pagos`“, и предупреждава, че при повтарящи се `key` React може да дублира или пропусне елементи и че това поведение не се поддържа. Нещо, което беше измерено и е добре да се знае: **нито TypeScript, нито линтерът на курса откриват липсващата `key`.** `npx eslint fig01_04.tsx` завършва без предупреждения, защото `eslint-plugin-react-hooks` проверява правилата на hooks и на компилатора, а не тези за списъците. Предупреждението се появява само при изпълнение, в конзолата, и само по време на разработка. Затова конзолата на браузъра не се пренебрегва: `console.error` от React е дефект, дори страницата да изглежда добре.

### 1.5 Капанът с `0`

Това е най-известната повреда на JSX и най-лесната за избягване, щом я разбереш. Операторът `&&` на JavaScript не връща `true` или `false`: връща **първата стойност, която решава**. `a && b` връща `a`, ако `a` е „неистинно“ (`false`, `0`, `""`, `null`, `undefined`), и `b` в противен случай. С булева стойност отляво `false && <strong>…</strong>` връща `false`, а React не рисува нищо за `false`. С число отляво `0 && <strong>…</strong>` връща `0`… а React **рисува числата**. Документацията го поставя като изрично предупреждение: не слагай числа от лявата страна на `&&`, защото ако лявата страна е `0`, целият израз е `0` и React ще нарисува `0` вместо нищо ([React, „Conditional Rendering“](https://react.dev/learn/conditional-rendering)).

Фигура 5 го показва с обобщението на таблото, в две версии, които се различават само в един ред:

```tsx
// fig01_05.tsx
import { renderToStaticMarkup } from "react-dom/server";

function ResumenConTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

function ResumenSinTrampa({ total, fallas }: { readonly total: number; readonly fallas: number }) {
  return (
    <p className="resumen">
      {total} servicios revisados
      {fallas > 0 && <strong> · {fallas} con falla</strong>}
    </p>
  );
}

for (const fallas of [2, 0]) {
  console.log(`con ${fallas} fallas:`);
  console.log(`  fallas && …     ${renderToStaticMarkup(<ResumenConTrampa total={4} fallas={fallas} />)}`);
  console.log(`  fallas > 0 && … ${renderToStaticMarkup(<ResumenSinTrampa total={4} fallas={fallas} />)}`);
}
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_05.tsx
$ node fig01_05.js
con 2 fallas:
  fallas && …     <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
  fallas > 0 && … <p class="resumen">4 servicios revisados<strong> · 2 con falla</strong></p>
con 0 fallas:
  fallas && …     <p class="resumen">4 servicios revisados0</p>
  fallas > 0 && … <p class="resumen">4 servicios revisados</p>
```

При две повреди двете версии са идентични: затова капанът оцелява при ръчните проби с обичайните данни, в които `pagos` и `reportes` са в повреда. При нула повреди първата изрисува `4 servicios revisados0`: това е `0`, която се появи в сцената, когато нощната смяна рестартира API с всичко в изправност. Втората не изрисува нищо допълнително.

Поправката е тази, която предлага документацията: **направи лявата страна булева.** `fallas > 0` е `true` или `false`, никога число. Точно това прави `ResumenFallas` в контролната точка. Други форми, които работят: `Boolean(fallas) && …`, `!!fallas && …` или тернарен оператор, `fallas > 0 ? <strong>…</strong> : null`. Курсът използва сравнението, защото се чете като това, което означава: „ако има повреди“. И тук няма мрежа: TypeScript приема `fallas && …` без протест (`number` е валидно дете в JSX), а линтерът на курса също не го отбелязва; това беше проверено с изпълнение на `npx eslint fig01_05.tsx`, което завършва без предупреждения. Защитата е навикът: **отляво на `&&` — винаги булева стойност.** В Урок 8 един тест на курса нарочно слага `fallas &&` и проверява, че текстът излиза с прилепената `0`; това е тестът, който става червен, когато поправката се върне.

### 1.6 Никога компонент вътре в друг

#### 1.6.1 Изкушението

Когато разделяш компонент, се появява естествено изкушение: да дефинираш малката част **вътре** в голямата, за да има под ръка променливите на родителя, без да ѝ ги подаваш като props. Нещо такова, вътре в `Panel`:

```tsx
// Fragmento: lo que NO se hace
export function Panel({ cargar, cadaMs = 10_000 }: { readonly cargar: Cargar; readonly cadaMs?: number }) {
  const { carga, recargar } = useReporte(cargar, cadaMs);

  function BotonActualizar() {
    return <button type="button" onClick={recargar}>Actualizar</button>;
  }

  // ...
}
```

Изглежда удобно: `BotonActualizar` вижда `recargar`, без някой да му я подава. Документацията го забранява без уговорки: компонентите могат да рисуват други компоненти, но **никога** не се влагат дефинициите им; всеки компонент се дефинира на най-горното ниво на файла, а ако детето има нужда от данни от родителя, той му ги подава чрез props ([React, „Your First Component“](https://react.dev/learn/your-first-component)).

#### 1.6.2 Защо: отново идентичност

Причината е същата като при `key`. За да реши дали един компонент от този render е същият като от предишния, React гледа **позицията му в дървото и типа му**. Типът на `<BotonActualizar />` е функцията `BotonActualizar`. Ако тази функция е дефинирана вътре в `Panel`, **всеки render на `Panel` създава нова функция**: същият код, но друг обект. За React това е друг тип компонент. Тогава унищожава стария, с неговото състояние и възлите му в DOM, и монтира нов. Документацията го обяснява чрез състоянието: React запазва състоянието, докато един и същ компонент се рисува на една и съща позиция, а състоянието изчезва, защото при всеки render се създава различна функция ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)).

Фигура 6 го измерва. Две еднакви табла; в едното броячът на кликвания е дефиниран отвън, а в другото — отвътре. Броячът се кликва два пъти, а след това родителят се обновява:

```tsx
// fig01_06.tsx
import { JSDOM } from "jsdom";
import { act, useState } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

function ContadorDeFuera() {
  const [clics, establecerClics] = useState(0);
  return (
    <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
      clics: {clics}
    </button>
  );
}

function PanelBien() {
  const [vueltas, establecerVueltas] = useState(0);
  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeFuera />
    </section>
  );
}

function PanelMal() {
  const [vueltas, establecerVueltas] = useState(0);

  function ContadorDeDentro() {
    const [clics, establecerClics] = useState(0);
    return (
      <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
        clics: {clics}
      </button>
    );
  }

  return (
    <section>
      <button type="button" className="actualizar" onClick={() => establecerVueltas((n) => n + 1)}>
        actualizar ({vueltas})
      </button>
      <ContadorDeDentro />
    </section>
  );
}

async function clic(contenedor: Element, clase: string): Promise<void> {
  await act(async () => {
    contenedor
      .querySelector(`.${clase}`)!
      .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  });
}

for (const [titulo, Panel] of [
  ["definido fuera", PanelBien],
  ["definido dentro", PanelMal],
] as const) {
  const contenedor = dom.window.document.createElement("div");
  dom.window.document.body.append(contenedor);
  const raiz = createRoot(contenedor);
  await act(async () => {
    raiz.render(<Panel />);
  });
  await clic(contenedor, "mas");
  await clic(contenedor, "mas");
  const antes = contenedor.querySelector(".mas")!.textContent;
  await clic(contenedor, "actualizar");
  const despues = contenedor.querySelector(".mas")!.textContent;
  console.log(`${titulo}: dos clics → «${antes}»; el padre se actualiza → «${despues}»`);
}
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig01_06.tsx
$ node fig01_06.js
definido fuera: dos clics → «clics: 2»; el padre se actualiza → «clics: 2»
definido dentro: dos clics → «clics: 2»; el padre se actualiza → «clics: 0»
```

Броячът отвън запазва двете си кликвания, когато родителят се обнови. Този отвътре се връща на нула, което е третата уплаха от сцената: render-ът на `PanelMal` създаде нов `ContadorDeDentro`, React го видя като различен тип, демонтира стария и монтира друг с начално състояние. Представи си това в `revisor`: на всеки десет секунди периодичното запитване на `useReporte` обновява таблото; ако редът беше дефиниран вътре в таблото, на всеки десет секунди щеше да се изтрива всичко, което човекът е написал в него. Освен състоянието се губи и работа: React унищожава и пресъздава възлите на DOM при всеки render, а фигура 1 показа, че нормалното е да се пипа само това, което се е променило.

Този път линтерът наистина е на твоя страна. Това е правилото `static-components`, още едно от тези на компилатора:

```text
$ npx eslint fig01_06.tsx

~/curso-react/figuras/fig01_06.tsx
  51:8  error  Error: Cannot create components during render

Components created during render will reset their state each time they are created. Declare components outside of render.

~/curso-react/figuras/fig01_06.tsx:51:8
  49 |         actualizar ({vueltas})
  50 |       </button>
> 51 |       <ContadorDeDentro />
     |        ^^^^^^^^^^^^^^^^ This component is created during render
  52 |     </section>
  53 |   );
  54 | }

~/curso-react/figuras/fig01_06.tsx:37:3
  35 |   const [vueltas, establecerVueltas] = useState(0);
  36 |
> 37 |   function ContadorDeDentro() {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 38 |     const [clics, establecerClics] = useState(0);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 39 |     return (
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 40 |       <button type="button" className="mas" onClick={() => establecerClics((n) => n + 1)}>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 41 |         clics: {clics}
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 42 |       </button>
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 43 |     );
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |   }
     | ^^^^ The component is created during render here
  45 |
  46 |   return (
  47 |     <section>  react-hooks/static-components

✖ 1 problem (1 error, 0 warnings)
```

Съобщението посочва две места: къде се **използва** компонентът, създаден по време на render-а (ред 51), и къде се **дефинира** (редове 37 до 44). И казва последствието с едно изречение: компонентите, създадени по време на render-а, нулират състоянието си всеки път, когато бъдат създадени. Страницата на правилото добавя причината: React вижда всеки от тях като нов тип компонент, демонтира стария и монтира новия, като унищожава цялото състояние и възлите на DOM ([React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components)). Тъй като е грешка, а не предупреждение, `npm run lint` спира, дори да не използваш `--max-warnings 0`.

Обичайната поправка е дефиницията да се изнесе на най-горното ниво на файла (или в собствен файл) и да ѝ се подаде чрез props това, което е използвала от родителя. За бутона от фрагмента в 1.6.1 това означава `function BotonActualizar({ alPulsar }: { readonly alPulsar: () => void })` извън `Panel` и `<BotonActualizar alPulsar={recargar} />` вътре. Името `alPulsar` открива една конвенция на курса: свойствата, които получават **обработчик на събитие** (нещо, което се изпълнява, когато човекът направи нещо), започват с `al`, като `alPulsar` тук и `alCambiar` или `alSeleccionar` в Урок 2. `cargar`, напротив, не започва с `al`: то не отговаря на събитие, а е работата, която таблото иска от hook-а. В контролната точка дори не се наложи този компонент: бутонът живее директно в JSX-а на `Panel`, където живее и `recargar`, и пътува към картата като `children`. Понякога най-добрият начин да не вложиш компонент е да не го създаваш.

### 1.7 Пълното преминаване

С шестте части по местата им провери контролната точка така, както го прави всяка автоматична проверка на курса: чиста инсталация, линтер и изграждане. Трите завършиха с код 0:

```text
$ npm ci
...
$ npm run lint

> revisor@0.1.0 lint
> eslint . --max-warnings 0

$ npm run build
...
dist/assets/index-Dezp5bTH.js   222.34 kB │ gzip: 69.68 kB

✓ built in 225ms
```

`npm run lint` не отпечатва нищо след заглавието: нито един проблем. (При изпълнението на `npm ci` в този урок npm отпечата освен това предупреждение от `install-scripts`. То идва от `fsevents`, незадължителна зависимост, която се инсталира само на macOS за наблюдение на файлове и носи инсталационен скрипт; няма нужда да се одобрява нищо. На Linux тази зависимост не се инсталира, така че е очаквано предупреждението да не излезе; в контейнера с Linux на курса не беше измерено дали излиза, така че ако го видиш или не го видиш, грешката не е твоя.) Изграждането е това, което видя в „Защо, преди как“: двайсет и шест модула, малко по-голям файл със стилове заради двете нови правила и JavaScript, който е сменил името си. Тази смяна на името не е каприз: Vite изчислява името от съдържанието, а съдържанието се е променило. Това е `index-Dezp5bTH.js`, който курсът документира за тази контролна точка; ако при теб излезе друго име, нещо се различава: кодът ти или версиите на зависимостите ти (сравни с `package-lock.json`).

За да го видиш в браузъра, използвай същите два терминала като в Урок 0: `npm run servidor` в единия и, в другия, `npm run dev` за разработка или `npm run preview`, за да видиш изградената версия. Ето какво върна Chrome без графичен интерфейс при отваряне на изградената версия (показан е само контейнерът):

```text
<div id="raiz"><main><h1>Revisor</h1><section class="tarjeta" aria-label="Estado de los servicios"><h2>Estado de los servicios</h2><p class="resumen">4 servicios revisados<strong> · 2 servicios con falla</strong></p><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></section></main></div>
```

Сравни го с този от Урок 0. Редовете са идентични, символ по символ: изнасянето на `FilaEstado` в собствен файл не промени това, което той рисува. Новото е `<section>` с достъпното си име, `<h2>` и абзацът с обобщението, с `4 servicios revisados` и, в червено, `· 2 servicios con falla`. Бутонът „Actualizar“ остана вътре в картата, като `children`. А логът на тестовия сървър записа само една заявка, както се полага за изградената версия: `StrictMode` все още е в `main.tsx`, но проверките му действат само по време на разработка:

```text
08:14:17.848 GET /api/estados 200
```

С `npm run dev`, напротив, ще видиш двойката от Урок 0 (една `cancelada por el cliente` и един `200`), ако връзката успее да стигне. И сега знаеш, че освен допълнителния цикъл на ефекта `StrictMode` извиква два пъти всеки от шестте ти компонента при всеки render. Не го забелязваш, защото и шестте са чисти: извикването им два пъти дава два пъти един и същ резултат. Това е безплатната проверка от Урок 0, приложена към компонентите.

## Грешката, която ще видиш

**Основната грешка: `Cannot create components during render`.** Това е грешката от 1.6. Появява се веднага щом дефинираш компонент вътре в друг и тъй като е грешка (а не предупреждение), `npm run lint` спира. Разчита се на три части: редът, където използваш компонента (`This component is created during render`), блокът, където го дефинираш (`The component is created during render here`), и правилото, `react-hooks/static-components`. Поправя се, като дефиницията се изнесе на най-горното ниво и му се подаде чрез props това, което е вземал от родителя. Документацията на React изисква дефинициите на компоненти да не се влагат ([React, „Your First Component“](https://react.dev/learn/your-first-component)); ако ти се струва, че имаш нужда от това, почти винаги това, което искаш, е да подадеш съдържанието като `children`.

**Предупреждението, което излиза само при изпълнение: `Each child in a list should have a unique "key" prop.`** Това е предупреждението от фигура 4. Не го дават нито TypeScript, нито линтерът на курса; излиза в конзолата на браузъра, по време на разработка, първия път, когато списъкът се нарисува. Казва ти в кой компонент да търсиш (`Check the render method of …`). Поправя се със стабилна `key`, взета от данните, никога с позицията и никога със стойност, генерирана в render-а. Неговият роднина, `Encountered two children with the same key`, означава, че данните ти не изпълняват уникалността, която си предположил: поправката не е да измислиш друга `key`, а да разбереш защо API е изпратил повторения.

**Грешката в типовете, която те спасява от мутиране: `Property 'sort' does not exist on type 'readonly …[]'`.** Това е грешката от 1.2.3. Ако я видиш, TypeScript ти казва, че си се опитал да промениш списък, който не е твой. Не махай `readonly`, за да се компилира: копирай, преди да подредиш, с `[...lista].sort(…)`, или използвай `toSorted`, който връща нов масив и оставя оригинала непокътнат ([MDN, `Array.prototype.toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted); `sort`, който променя оригинала, е в [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)). `toSorted` е част от ES2023; `tsconfig.app.json` на `revisor` декларира `"lib": ["ES2023", "DOM"]`, така че там можеш да го използваш.

## Какво се прави погрешно

**Да промениш нещо отвън по време на render-а.** Брояч на ниво модул, глобална променлива, `document.title = …` в тялото на компонента. Изпълнява се толкова пъти, колкото React извика компонента, което не е същото като „всеки път, когато екранът се промени“. По време на разработка `StrictMode` го удвоява и ти дава следа; в продукция числото просто лъже.

**Да мутираш props.** `props.estados.sort()`, `props.estados.push(…)`, `estado.nombre = …`. Променяш данни, които принадлежат на друг компонент, а този друг компонент не разбира, че са се променили. Цената е повреда далеч от мястото, където е допусната: списъкът се подрежда сам „някъде другаде“. Декларирай props с `readonly` и TypeScript ще го предотврати.

**Да четеш часовника или случайността в render-а.** `new Date()`, `Date.now()`, `Math.random()`. Изходът зависи от това кога React е решил да те извика. Ако компонентът има нужда от часа, нека го получи като prop или да го пази в състояние и да го обновява от ефект, както показва справочникът на React.

**Да използваш позицията като `key` или `key`, която се променя с позицията.** Първото бърка редовете един с друг, когато списъкът се промени; второто ги унищожава всичките. Нито едното не се забелязва, докато редовете нямат състояние, и затова и двете оцеляват до деня, в който редът получи бележка или текстово поле.

**Да генерираш `key` по време на render-а.** `key={Math.random()}` или `key={crypto.randomUUID()}` вътре в `map`. Всеки render произвежда нови `key` и React пресъздава всички компоненти и целия DOM на списъка всеки път.

**Число отляво на `&&`.** `{fallas && …}`, `{lista.length && …}`. Работи с тестовите данни и изрисува `0` в деня, в който няма нищо. Отляво на `&&` — винаги булева стойност.

**Да дефинираш компонент вътре в друг.** Губи състоянието и DOM-а си при всеки render на родителя. Линтерът го спира със `static-components`; не го заглушавай.

**Да разделяш, само за да разделяш.** Компонент за всеки HTML таг не е по-добър дизайн: това са повече файлове за четене. Критерият е отговорността, „на какъв въпрос отговаря тази част?“, а не размерът. `Tarjeta` съществува, защото „кутия със заглавие“ е въпрос, който се повтаря; едноредов `TextoRevisados`, който никой друг не използва, не би бил такъв.

**Да направиш карта, която знае твърде много.** Ако подадеш на `Tarjeta` `recargar`, зареждането или типа съдържание, за да реши тя какво да рисува, я обвързваш с една-единствена функционалност. С `children` този, който я използва, решава какво да има вътре.

## Упражнения

### Упражнение 1 — Изчисти трите нечистоти

Копирай `fig01_02.tsx` в `~/curso-react/figuras/` и поправи `ResumenImpuro`, така че да бъде чист, без да загуби това, което показва: номер на проверка, час и подредените имена. **Преди да промениш каквото и да е, предвиди** какво ще казват четирите реда на изхода, когато компонентът е чист. Когато приключиш, изходът трябва да потвърди предвиждането ти, а `npx eslint` не трябва да съобщава проблеми. Подсказка: чист компонент не може да измисли проверката, нито часа; някой трябва да му ги даде.

### Упражнение 2 — Да махнеш вместо да добавиш

Във фигура 3 `correo` се добавяше в началото. Промени един ред така, че вместо това да се **махне** `catálogo`, първата в списъка: `const despues = antes.slice(1);`. **Преди да я изпълниш, предвиди** за всяка от трите `key` колко реда се създават от нулата и какъв текст показва всеки ред. След това я изпълни и сравни. Кой от трите резултата би бил най-опасен, ако всеки ред пазеше в собственото си състояние бележка, написана от човека? (В `revisor` няма да е така: от Урок 2 нататък бележките живеят в `Panel`. Въпросът е, за да разпознаеш риска, когато един ред наистина пази състояние.)

### Упражнение 3 — Липсващото единствено число

Обобщението на контролната точка решава единственото число за повредите („1 servicio con falla“), но не и за проверените: с една-единствена услуга би казало `1 servicios revisados`. Напиши във файл `textoRevisados.ts` в `~/curso-react/figuras/` (а не в `revisor`, за да остане проектът ти същият като контролната точка) чиста функция `textoRevisados(total: number): string` по модела на `textoFallas` и я провери с `node textoRevisados.ts` за 0, 1 и 4. **Преди да я изпълниш, запиши** трите изхода, които очакваш. Защо тази функция може да се провери без React, без jsdom и без браузър?

### Упражнение 4 — Открий капана

Колега предлага за Урок 4 списъкът да се показва само ако има услуги: `{carga.reporte.estados.length && <ListaEstados estados={carga.reporte.estados} />}` вътре в `<section>`. **Без да изпълняваш нищо**, напиши какъв HTML се получава, когато API отговори с `{"estados":[]}`. След това го провери с `renderToStaticMarkup`, както във фигура 5, и напиши правилната версия.

## Решения

### Решение 1

Предвиждането, с чистия компонент: ред 2 показва масива **без промени** (`pagos, catálogo, reportes`), защото вече никой не го подрежда на място; ред 3 казва `0`, защото компонентът вече не пипа променливата на ниво модул; а ред 4 казва `sí`, защото часът идва като prop и е един и същ в двете рисувания. Трите поправки, по една за всяка нечистота:

```tsx
// fig01_02.tsx corregida (fragmento)
function ResumenImpuro({
  servicios,
  revision,
  hora,
}: {
  readonly servicios: readonly Servicio[];
  readonly revision: number;
  readonly hora: string;
}) {
  const ordenados = [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <p>
      Revisión {revision} a las {hora}: {ordenados.map((s) => s.nombre).join(", ")}
    </p>
  );
}
```

Проверката и часът сега са props: този, който използва компонента, решава какви са (в извикванията от фигурата например `revision={1} hora="10:00:00"`), а компонентът само ги показва. Списъкът се копира с `[...servicios]`, преди да се подреди: това е локална мутация върху масив, който компонентът току-що е създал, и е позволена. Типът `readonly Servicio[]` не позволява някой отново да напише `servicios.sort(…)`, без TypeScript да го спре. Остава един детайл от останалата част на фигурата: ред 3 продължава да отпечатва променливата на ниво модул `revision`, която вече никой не променя. Ако я оставиш като `let revision = 0;`, ESLint предупреждава с `prefer-const` именно защото никой не я присвоява наново; смени я на `const revision = 0;`. Измерена беше точно тази версия (`ejercicios/fig01_02.corregida.tsx`, с изхода ѝ в `ejercicios/fig01_02.corregida.salida.txt`), компилирана със същата обичайна команда: четирите реда излязоха `pagos, catálogo, reportes` (преди), `pagos, catálogo, reportes` (след), `0` и `sí`, а `npx eslint` завърши без проблеми. В `revisor` откъде наистина биха дошли проверката и часът? От данни, които се променят с времето, тоест от състояние; Урок 2 го носи.

### Решение 2

Измерено при изпълнението (`ejercicios/fig01_03.ejercicio2.tsx` и изходът му в `ejercicios/fig01_03.ejercicio2.salida.txt`):

```text
key={posicion}
  filas creadas desde cero: 0 de 3
  pagos (nació como catálogo) | inventario (nació como pagos) | reportes (nació como inventario)
key={`${posicion}-${nombre}`}
  filas creadas desde cero: 3 de 3
  pagos | inventario | reportes
key={nombre}
  filas creadas desde cero: 0 de 3
  pagos | inventario | reportes
```

С позицията React не създава нищо и **маха последния ред**, този, който се е родил като `reportes`; трите останали запазват собственото си състояние (това на реда, който се е родил на това място), но сега рисуват името на съседа отдолу: този, който се е родил като `catálogo`, казва `pagos` и така нататък. С позиция и име трите останали реда се пресъздават от нулата, защото позициите им са се променили. С името не се създава нищо: React маха реда на `catálogo`, а другите три остават същите. Най-опасният резултат е първият, защото не се вижда: екранът показва правилните имена и грешното състояние. Бележката, която човекът е написал за `pagos`, би се появила до `inventario` и никой не би го забелязал, докато не стане късно. Вторият поне „само“ изтрива работата; първият я премества на друго място.

### Решение 3

Очакваните изходи са `0 servicios revisados`, `1 servicio revisado` и `4 servicios revisados`. Едно решение:

```ts
// textoRevisados.ts (en ~/curso-react/figuras/)
export function textoRevisados(total: number): string {
  return total === 1 ? "1 servicio revisado" : `${total} servicios revisados`;
}

for (const n of [0, 1, 4]) console.log(`${n} → ${textoRevisados(n)}`);
```

```text
$ node textoRevisados.ts
0 → 0 servicios revisados
1 → 1 servicio revisado
4 → 4 servicios revisados
```

(Файлът и изходът му са в `ejercicios/textoRevisados.ts` и `ejercicios/textoRevisados.salida.txt`.)

Node 24 изпълнява файла `.ts` директно, както тестовия сървър (Урок 0). Може да се провери без React, защото е чиста функция, която не знае за React: получава число и връща текст. Това е предимството на отделянето на изчислението от представянето: това, което се изчислява, се проверява с `console.log`. Обърни внимание, че `0` е в множествено число („0 servicios“), както се казва на испански. Ако искаш да я пренесеш в `revisor`, функцията би отишла в `resumen.ts`, до `textoFallas`, и `ResumenFallas` би я извикал; не го прави в копието си на контролната точка, за да продължи да съвпада с тази на курса.

### Решение 4

При празен списък `estados.length` е `0`, `0 && …` е `0` и React рисува числото. Проверено с `renderToStaticMarkup` върху `<section>` със същия `&&` и празен списък (`ejercicios/solucion4.tsx` и `ejercicios/solucion4.salida.txt`):

```text
<section>0</section>
<section></section>
```

Първият ред е версията на колегата: самотна `0` вътре в секцията. Вторият е правилната версия, с булева стойност отляво: `{carga.reporte.estados.length > 0 && <ListaEstados estados={carga.reporte.estados} />}`. Едно наблюдение за дизайна за дневника ти: празен списък в `revisor` не би трябвало да се показва като „нищо“, а със съобщение, което казва, че няма услуги. Това е четвъртото състояние, „празно“, което Урок 4 добавя със собствен текст.

## Как разбирам, че съм успял

- [ ] В `~/curso-react/revisor/` `npm ci`, `npm run lint` и `npm run build` завършват с код 0, `npm run lint` не съобщава нито един проблем, а изграждането оставя в `dist/assets/` файл с име `index-Dezp5bTH.js`.
- [ ] При работещи тестов сървър и `npm run dev` `http://localhost:5173/` показва карта със заглавие „Estado de los servicios“, реда `4 servicios revisados · 2 servicios con falla` над списъка и бутона „Actualizar“ вътре в картата. Конзолата на браузъра няма нито една грешка от React.
- [ ] Можеш да посочиш в изхода на фигура 1 кои редове са render и кои са *commit*, и да обясниш защо второто рисуване прави нула промени в DOM.
- [ ] Откри трите нечистоти от фигура 2 и знаеш коя хваща линтерът, коя хваща TypeScript с `readonly` и коя се вижда само в изхода.
- [ ] Когато временно дефинираш компонент вътре в `Panel`, `npm run lint` се проваля с `react-hooks/static-components`; когато го изнесеш, отново минава. (Върни файла, когато приключиш.)
- [ ] Когато копираш `fig01_05.tsx` и смениш `[2, 0]` с `[0]`, предвиждаш, преди да я изпълниш, двата реда, които отпечатва, и изпълнението ти дава право: с `fallas &&` излиза `4 servicios revisados0`, а с `fallas > 0 &&` — `4 servicios revisados`. (Тестовият сървър на този урок няма сценарий без повреди; Урок 8 го проверява върху `revisor`.)
- [ ] Можеш да обясниш, с изхода на фигура 3, защо `revisor` използва `key={estado.nombre}` и защо това е безопасно с API на курса.
- [ ] Записа в своя [дневник](bitacora.md) трите нечистоти и как ги откри, един компонент, който раздели, и какво спечели, и една `0`, която се появи на екрана, без да си я искал.

## Обобщение

Отговори, без да гледаш урока:

1. Какво се случва в render-а и какво в *commit*-а? Защо React може да извика компонента ти, без екранът да се промени?
2. Кои са двете условия за чист компонент? Какво е локална мутация и защо е позволена?
3. Назови три типични нечистоти и за всяка кой инструмент на курса я открива (или че никой не я открива).
4. Какво получава компонентът в `children`? Защо `Tarjeta` живее в `compartido/`, а не в `reporte/`?
5. Какво става със състоянието на редовете, ако `key` е позицията и в началото се вмъкне елемент? А ако `key` комбинира позиция и име?
6. Защо `{fallas && …}` може да изрисува `0` и как се пише, за да не се случи?
7. Защо компонент, дефиниран вътре в друг, губи състоянието си при всеки render на родителя? Кое правило на линтера го открива?

## За допълнително четене

- [React, „Render and Commit“](https://react.dev/learn/render-and-commit): трите стъпки на едно обновяване, рекурсивният render и защо React пипа DOM само там, където има разлики. Посетено на 21 октомври 2026 г.
- [React, „Keeping Components Pure“](https://react.dev/learn/keeping-components-pure): двете условия на чистотата, локалната мутация, двойният render на `StrictMode` и къде отиват страничните ефекти. Посетено на 21 октомври 2026 г.
- [React, „Components and Hooks must be pure“](https://react.dev/reference/rules/components-and-hooks-must-be-pure): идемпотентност, `new Date()` и `Math.random()`, неизменни props и състояние, ефекти извън render-а. Посетено на 21 октомври 2026 г.
- [React, „Passing Props to a Component“](https://react.dev/learn/passing-props-to-a-component): `children` като празно място, което запълва родителят, и props като неизменни снимки. Посетено на 21 октомври 2026 г.
- [React, „Understanding Your UI as a Tree“](https://react.dev/learn/understanding-your-ui-as-a-tree): дървото на render-а, съставено само от компоненти. Посетено на 21 октомври 2026 г.
- [React, „Thinking in React“](https://react.dev/learn/thinking-in-react): разделяне на интерфейс на компоненти чрез разделяне на отговорностите. Посетено на 21 октомври 2026 г.
- [React, „Rendering Lists“](https://react.dev/learn/rendering-lists): правилата за `key`, опасността от позицията и от `key`, генерирани в движение, и откъде да се вземат. Посетено на 21 октомври 2026 г.
- [React, „Conditional Rendering“](https://react.dev/learn/conditional-rendering): предупреждението за числата отляво на `&&`. Посетено на 21 октомври 2026 г.
- [React, „Your First Component“](https://react.dev/learn/your-first-component): никога да не се влагат дефиниции на компоненти; имена с главна начална буква. Посетено на 21 октомври 2026 г.
- [React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state): състоянието, обвързано с позицията в дървото, и защо вложеният компонент го губи. Посетено на 21 октомври 2026 г.
- [React, lint `static-components`](https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components): правилото, което открива компоненти, създадени по време на render-а. Посетено на 21 октомври 2026 г.
- [React, lint `globals`](https://react.dev/reference/eslint-plugin-react-hooks/lints/globals) и [lint `purity`](https://react.dev/reference/eslint-plugin-react-hooks/lints/purity): правилата, които откриват промени на външни променливи и нечисти функции по време на render-а. Посетено на 21 октомври 2026 г.
- [MDN, `MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver): какво дава наблюдателят от фигура 1: записи за мутациите на контейнера. Посетено на 21 октомври 2026 г.
- [MDN, `Array.prototype.sort()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) и [`toSorted()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted): `sort` подрежда на място; `toSorted` връща нов масив. Посетено на 21 октомври 2026 г.
- [MDN, ARIA роля `region`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/region_role): кога `<section>` е регион и как му се дава име. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| render | стъпката, в която React извиква твоите функции на компоненти, за да разбере как трябва да изглежда екранът; не пипа DOM |
| *commit* | стъпката, в която React прилага към DOM само разликите между новия и предишния render |
| оцветяване (*painting*) | това, което прави браузърът след *commit*-а: рисува пикселите |
| чист компонент | не променя нищо, което е съществувало преди извикването му, и при еднакви входове връща еднакъв изход |
| локална мутация | промяна на обект или масив, който самият компонент току-що е създал; позволена е, защото никой отвън не я вижда |
| идемпотентен | който връща едно и също всеки път, когато бъде извикан с едни и същи входове |
| композиция | сглобяване на големи компоненти чрез събиране на части, които не се познават помежду си |
| `children` | prop-ът, в който компонентът получава съдържанието, вложено между отварящия и затварящия му таг |
| фрагмент (`<>…</>`) | начин да се върнат няколко съседни елемента, без да се обвиват в друг елемент |
| `key` | подсказката, с която React съпоставя елементите на списък между два render-а; уникална сред съседните и стабилна |
| регион | зона от страницата със собствено име, към която екранният четец може да прескочи; `<section>` с достъпно име е такава |

---

**Следващ:** [Урок 2 — Състояние: моментна снимка, неизменяемост и структура](02-estado-instantanea-forma.md)
