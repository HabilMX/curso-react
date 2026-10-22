# Урок 0 — Истински проект: Vite, StrictMode и линтерът

*9:40 ч. е, а прегледът с екипа по експлоатация е в 10. Вчера промени един ред в таблото на `revisor`: махна една зависимост от `useEffect`, защото „беше излишна“. На твоята машина всичко изглежда идеално. Колежката ти го отваря на своята, сменя интервала на обновяване на пет секунди за демонстрацията… а таблото продължава да пита на всеки десет, сякаш не я е чуло. Никой не знае защо. В същата промяна някой беше оставил, „само за да пробва“, ключ на доставчика на мониторинг в променлива, която започва с `VITE_`, и пакетът вече е публикуван на тестовия сървър. Остават двайсет минути. И двете повреди са имали предупреждение: инструмент, който не беше инсталиран, и правило, което никой не познаваше. Този урок инсталира инструмента и обяснява правилото.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 0.3 и 0.4)

**Какво изграждаш:** таблото от урок 9 на курса по TypeScript, преместено в проект на Vite: със сървър за разработка, *proxy* към API, конфигурационна променлива `VITE_`, включен `StrictMode`, активен линтер за React и тестовия сървър на курса, за да има таблото кого да пита

**Какво научаваш:** какво добавя Vite спрямо ръчно сглобен бъндлър; шаблона `react-ts`, трите му `tsconfig` и структурата по функционалност; *proxy*-то към API (без CORS по време на разработка); променливите `VITE_` и защо в тях не се слага никаква тайна; `eslint-plugin-react-hooks`, активен от първия ден

**Откъде идваш.** От урок 9 на [курса по TypeScript](https://github.com/HabilMX/curso-typescript) на Hábil или от подобно място: табло на React, което работи. Това табло има компонент `Panel`, собствен hook `useReporte`, който иска `GET /api/estados` с `AbortController`, мрежова граница `cargar.ts`, която валидира отговора с `esReportePublico`, и `cliente.tsx`, който го монтира. Пакетираше се с едноредова команда на esbuild и го сервираше същият процес на Node, който отговаряше на API. Ако не си минал през този курс, няма значение: целият код на таблото се появява изцяло в този урок, а курсът има тестов сървър, който отговаря със същата форма на данните. Работиш в нова папка, `~/curso-react/revisor/`.

**Какво не прави този урок.** Не променя това, което таблото прави: нито нов екран, нито ново състояние, нито ново правило. Кодът на React е същият като в урок 9 на TypeScript, с две малки промени, които се обясняват там, където се появяват. Не обяснява в дълбочина и Effects, нито StrictMode: тук ги включваш и виждаш какво правят; [Урок 3](03-effects-sincronizar.md) ги разглобява парче по парче. Не публикува нищо: политиката за сигурност на съдържанието (CSP), пренасочването към `index.html` и продукционният сървър идват в [Урок 9](09-rendimiento-publicacion.md). И все още няма автоматични тестове: Vitest и Testing Library идват в [Урок 8](08-pruebas-de-componentes.md).

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 (линия 24 LTS) и npm 11.19.1 под macOS, с точните версии, които фиксира `package.json` на този урок. Тъй като курсът предполага Linux Mint, контролната точка беше инсталирана наново от нулата с `npm ci` в контейнер с Linux (Debian 12 с официалния образ `node:24.22.0`), и там `npm run lint` и `npm run build` дадоха същия изход, със същите имена на файлове в `dist/`. Не беше изпълнено на истински Linux Mint, но нищо от показаното не зависи от системата, с изключение на думата `darwin-arm64` от `vite --version`, която в твоя Mint ще бъде `linux-x64`. Това, което се вижда „в браузъра“, беше измерено с Chrome без графичен интерфейс (`--headless`), който зарежда страницата, изпълнява нейния JavaScript и връща получения документ: това е истински браузър, а не симулация. Дългите пътища, които отпечатват ESLint и Vite, се показват спрямо `~/curso-react`. Часовете в лога на тестовия сървър са по UTC. Един ден по-рано, на 20 октомври, беше излязла 24.22.1 от същата линия, със същия npm; изпълненията на урока не бяха направени с нея, но контролната точка беше повторена след това с тази версия от чисто копие (`npm ci`, `npm run lint` и `npm run build`) и даде същите имена на файлове в `dist/`, `index-tGGc24Rg.css` и `index-BWNt33lQ.js`; изходът е в `node-24.22.1.salida.txt`. Програмите са в [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), в хранилището на курса: `revisor/` е контролната точка, а фигурите са до нея.

**Преди да започнеш: имаш ли Node.js 24?** Този урок не инсталира Node.js; приема, че е инсталиран, така че първото нещо е да го провериш. Отвори терминал и напиши:

```text
$ node -v
v24.22.1
```

Последното ти число може да е друго (тук е показано това на най-новата версия от линия 24 в деня на прегледа), но трябва да започва с `v24`. Ако командата не съществува или казва нещо друго, инсталирай Node.js 24 LTS според инструкциите на страницата за изтегляне ([Node.js, „Download“](https://nodejs.org/en/download)), която предлага метод според системата ти, и напиши отново `node -v`. Това не е формалност: Vite 8 изисква Node.js 20.19 или по-нова, или 22.12 или по-нова ([Vite, „Getting Started“](https://vite.dev/guide/)), а тестовият сървър се изпълнява с `node servidor/practica.ts`, което изисква 24.12 или по-нова (обяснено е в 0.2.2). Ако дистрибуцията ти има по-стар Node.js в своите хранилища, командата ще съществува, но числата няма да съвпадат с тези от урока: затова се проверява предварително.

## След урока ще можеш да

- Създадеш проект с шаблона `react-ts` на Vite, да фиксираш зависимостите му с точна версия и да обясниш за какво служи всеки от трите му файла `tsconfig`.
- Обясниш разликата между `npm run dev` и `npm run build` и да демонстрираш с грешка в типовете, че Vite превежда TypeScript, но не го проверява.
- Настроиш *proxy* във `vite.config.ts` и да обясниш, с отговора на `curl` пред очите си, защо с него браузърът няма нужда от CORS по време на разработка.
- Прочетеш променлива `VITE_` от `import.meta.env`, да ѝ дадеш тип и да провериш с `grep` върху `dist/`, че стойността ѝ пътува, записана в JavaScript-а, който изтегля всеки.
- Разпознаеш в лога на сървъра втората заявка, която предизвиква `StrictMode` по време на разработка, и да обясниш защо тя не се появява в изградената версия.
- Активираш `eslint-plugin-react-hooks`, да накараш едно предупреждение да спре `npm run lint` и да разчетеш предупрежденията на `rules-of-hooks`, `exhaustive-deps` и `set-state-in-effect`.

## Защо, преди как

Таблото от урок 9 на TypeScript работи, и работи по добри причини: отговорът на API е валидиран, ефектът се почиства, повредата на API се вижда като повреда. Това, което му липсва, е **проект** около него. Задай на това табло четири въпроса и ще видиш дупките.

**Колко време ти трябва, за да видиш една промяна?** Всеки път, когато пипаше `Panel.tsx`, трябваше да пакетираш отново с esbuild, да рестартираш сървъра на Node и да презаредиш страницата. Това са петнайсет секунди, сто пъти на ден. Сървър за разработка, който наблюдава файловете ти и казва на браузъра кой модул се е променил, превръща тези петнайсет секунди в по-малко от една и междувременно запазва състоянието на екрана.

**Как говориш с API, ако не живеят в един и същ процес?** В TypeScript страницата и API идваха от един и същ сървър, от един и същ произход (origin), и затова `fetch("/api/estados")` работеше, без да се настройва нищо. Щом разделиш екрана (който сега се сервира от инструмент за разработка на един порт) от API (което остава на друг), браузърът започва да прилага политиката за еднакъв произход (same-origin policy) и заявката се блокира. Има два изхода: да се отвори CORS в API, което е решение за сигурността и не е работа на екрана, или инструментът за разработка да препраща тези заявки, така че браузърът отново да вижда един-единствен произход. Този урок избира второто.

**Къде отива конфигурацията?** Интервалът на обновяване беше записан в кода, `10_000`. Промяната му за демонстрация изискваше редактиране на файл. Инструментите за изграждане предлагат променливи на средата, но в страница в браузъра „променлива на средата“ означава нещо съвсем различно от това на сървър, и бъркането им е най-честият начин да се публикува ключ.

**Кой те предупреждава, когато нарушиш правило на React?** Компилаторът на TypeScript проверява типове; той не знае, че hook не може да се извиква след `return`, нито че списъкът със зависимости на ефект трябва да назовава това, което ефектът използва. Урок 9 на TypeScript го каза направо: „ESLint в този проект не проверява списъци със зависимости; официалният пакет, който го прави, е `eslint-plugin-react-hooks`, и е добра следваща инсталация“. Тази следваща инсталация е днес и е първата в този курс, защото **принцип, който курсът повтаря във всеки урок — ако линтерът се оплаква, се променя кодът, — има смисъл само ако линтерът е включен от първия ден.**

Четирите отговора се побират в един инструмент и два превключвателя. Инструментът е **Vite**, един от тези, които самият екип на React посочва, заедно с Parcel и Rsbuild, когато искаш да изградиш приложение без framework ([React, „Build a React app from Scratch“](https://react.dev/learn/build-a-react-app-from-scratch)), и този, който замени Create React App, изведен от поддръжка от екипа на React за нови проекти на 14 февруари 2025 г. ([React, „Sunsetting Create React App“](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). Превключвателите са **`StrictMode`**, който кара React да подлага компонентите ти на проверка, докато разработваш, и **`eslint-plugin-react-hooks`**, който проверява правилата на React, преди да се изпълни каквото и да е.

Понятията са три — тези от предишния абзац. Първото е **инструментът, Vite**, и заема четири раздела, защото отговаря на първите три въпроса: какво е Vite и какво прави (0.1); проектът, неговите `tsconfig` и папки (0.2); *proxy*-то (0.3); и променливите `VITE_` (0.4). Второто е първият превключвател, **`StrictMode`** (0.5). Третото е вторият превключвател, **линтерът на React** (0.6). Раздел 0.7 не добавя понятие: това е пълното преминаване с тестовия сървър, в което трите се виждат заедно. Накрая ето какво ще видиш, и ще знаеш откъде идва всеки ред:

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

## Понятията

### 0.1 Какво прави Vite, което ръчно сглобеният бъндлър не правеше

#### 0.1.1 Две различни задачи с едно и също име

Командата на esbuild от урок 9 на TypeScript вършеше една-единствена работа: вземаше `cliente.tsx`, следваше неговите `import`, събираше всичко в един `cliente.js` и го записваше на диска. Vite върши **две различни задачи** и почти всичко, което ще прочетеш за него, се разбира по-добре, ако ги разделиш:

1. **Сървърът за разработка** (`npm run dev`). Той не събира кода ти в един файл. Сервира всеки модул от кода ти поотделно, когато браузърът го поиска, преведен в движение от TypeScript и JSX към JavaScript. Съвременните браузъри умеят да зареждат JavaScript модули (`<script type="module">` и техните `import`) без помощ, така че за разработка не е нужно пакетиране. Затова стартира бързо, защото не пакетира кода ти (времето за стартиране расте много по-малко с размера на проекта, отколкото при инструмент, който пакетира всичко, преди да сервира), и затова, когато промениш файл, се изпраща отново само този модул: това е **горещата подмяна на модули** (HMR, *Hot Module Replacement*), която в React се нарича *Fast Refresh* и запазва състоянието на компонентите, които не са се променили ([Vite, „Why Vite“](https://vite.dev/guide/why)). При **зависимостите** (това, което живее в `node_modules/`, като `react`) прави изключение: **предварително ги пакетира** веднъж, при стартиране, за да превърне в JavaScript модули онези, които идват в стария формат на Node (CommonJS), и за да може библиотека, съставена от стотици вътрешни файлове, да стигне до браузъра с една заявка, а не със стотици. Това предварително пакетиране се случва само по време на разработка и не засяга твоя код ([Vite, „Dependency Pre-Bundling“](https://vite.dev/guide/dep-pre-bundling)).
2. **Изграждането** (`npm run build`). Тук вече се пакетира, защото сервирането на стотици отделни модули в продукция принуждава браузъра да прави заявка за всеки вложен `import`. Резултатът е папка `dist/` с един `index.html`, един JavaScript и един файл със стилове, с имена, които се променят, когато се промени съдържанието им.

От Vite 8, публикуван на 12 март 2026 г., двете задачи ги върши един и същ компонент: **Rolldown**, бъндлър, написан на Rust, с **Oxc** за четене, превеждане и минимизиране на кода. Преди това Vite използваше esbuild при разработка и Rollup за изграждане, а поддържането им в съгласие изискваше свързващ код ([Vite, „Announcing Vite 8“](https://vite.dev/blog/announcing-vite8)). За теб практическото следствие е само едно: това, което виждаш при разработка, и това, което се изгражда, минават през един и същ преводач (при разработка — без пакетиране и без минимизиране на кода).

#### 0.1.2 `index.html` е входната точка

В урок 9 на TypeScript страницата беше текстов низ в `pagina.ts` и сочеше към `/cliente.js`, който трябваше да съществува предварително. Във Vite е обратното: **`index.html` живее в корена на проекта и е началната точка.** Vite го чете, намира `<script type="module" src="/src/main.tsx">` и оттам нататък следва `import`-ите ([Vite, „Getting Started“](https://vite.dev/guide/)). Ти сочиш към файла на TypeScript, а не към пакетиран резултат; Vite се грижи браузърът да получи JavaScript.

Можеш да го видиш със собствените си очи. При работещ сървър за разработка поискай страницата с `curl`:

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

Това е твоят `index.html` с две добавки, които не си писал: `/@vite/client`, малкото парче, което държи отворена връзка със сървъра, за да разбере кой файл се е променил, и `/@react-refresh`, което позволява да се подмени компонент, без да се загуби състоянието на останалите. Второто го слага `@vitejs/plugin-react`, официалният плъгин на Vite за React, който освен това превежда JSX с автоматичния *runtime* — същия режим `react-jsx`, който използваше с `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). Нищо от това не се появява в `dist/`: то е само за разработка.

#### 0.1.3 Vite превежда TypeScript, но не го проверява

Това е изречението, което най-много си струва да запомниш от раздела: **Vite изтрива типовете, без да ги проверява.** Документацията му го казва с главни букви: само превежда файловете `.ts` и „НЕ“ проверява типове; тази задача я оставя на редактора и на процеса на изграждане ([Vite, „Features“, TypeScript](https://vite.dev/guide/features)). Точно това се случваше с esbuild в урок 9 на TypeScript и има същото следствие: ако някой изпълнява само инструмента, който пакетира, може да предаде програма с грешки в типовете.

Затова скриптът `build` на шаблона не е просто `vite build`, а `tsc -b && vite build`. Първо компилаторът на TypeScript проверява всичко; ако открие грешка, `&&` не позволява изграждането изобщо да започне. В „Грешката, която ще видиш“ ще я предизвикаш нарочно, за да видиш двата изхода един до друг. А по време на разработка, докато `npm run dev` работи, грешките в типовете **не се появяват нито в терминала, нито в браузъра**: виждаш ги в редактора си или когато изпълниш `npm run build`.

### 0.2 Проектът: шаблонът, неговите `tsconfig` и папки

#### 0.2.1 Какво идва с шаблона и какво му се променя

Официалният начин да се започне е `npm create vite@latest`. С име и шаблон не задава въпроси. Този курс фиксира версията на генератора, за да бъде резултатът ти същият като в урока:

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

Двете самостоятелни тирета (`--`) отделят опциите на npm от опциите на генератора; без тях npm би взел `--template` за себе си. Шаблонът `react-ts` оставя папка с `index.html`, `vite.config.ts`, три файла `tsconfig`, `package.json`, папка `src/` с примерен брояч и папка `public/` за файлове, които се копират както са. Измерено в онзи ден, неговият `package.json` съдържаше три решения, които този курс променя, и е добре да се каже на глас, за да не те изненада, ако сравняваш:

- **Версиите с `^` и `~`.** Шаблонът пише `"vite": "^8.3.4"`, което позволява на npm да инсталира всяка по-нова 8.x. Курсът фиксира всяка зависимост с точната ѝ версия, проверена с `npm view` в деня на изпълнението: така това, което виждаш тук, е това, което инсталираш ти. Заключващият файл, `package-lock.json`, пази освен това точното разрешаване на всичко, което тези зависимости довличат.
- **Линтерът.** Шаблонът от този месец идва с **Oxlint**, много бърз линтер, написан на Rust, с някои правила за React. Курсът използва ESLint с `eslint-plugin-react-hooks`, който е пакетът, публикуван от самия екип на React за проверка на неговите правила ([React, „eslint-plugin-react-hooks“](https://react.dev/reference/eslint-plugin-react-hooks)), и който включва диагностиките на React Compiler, използвани в Урок 9. Oxlint не е лош избор; той е друг, а смесването на два линтера в един курс е шум. Генераторът има опция `--eslint`, която сменя Oxlint с ESLint, но беше измерено в същия ден, че тя добавя и `eslint-plugin-react-refresh` и `globals` — два пакета, които този курс не използва; затова тук проектът се създава без тази опция и Oxlint се маха ръчно, както е обяснено по-долу.
- **TypeScript.** Шаблонът фиксира TypeScript 6. Курсът по TypeScript работи с TypeScript 7, и тук се запазва същото като там: TypeScript 7 е този, който проверява типовете (`tsc`), а TypeScript 6 остава, с името `typescript`, само за да може ESLint да чете файловете `.ts`. Причината е измерима: `typescript-eslint` декларира, че поддържа TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, „Dependency Versions“](https://typescript-eslint.io/users/dependency-versions/)), така че все още не работи със 7. Това са две различни роли; не сменяй едната с другата.

Ако не си минал курса по TypeScript, не е нужно да разбираш трика с псевдонимите, за да продължиш: достатъчно е да знаеш, че `npx tsc --version` казва `Version 7.0.2`, а `npx tsc6 --version` съществува само за ESLint. Един любопитен детайл, който беше измерен: пакетът `@typescript/typescript6` е във версия 6.0.2, но изпълнимият му файл отговаря `Version 6.0.3`. Това не засяга нищо; оставям го отбелязано, защото, ако го видиш, грешката не е твоя.

Контролната точка на този урок не запазва примерния брояч, нито папката `public/`: файловете им се заменят с тези на таблото. Преди да инсталираш каквото и да е, махни това, което шаблонът носи от Oxlint, за да завърши проектът ти същият като този на курса: изтрий файла `.oxlintrc.json`, изтрий в `package.json` реда `"oxlint"` от `devDependencies` и остави блока му `scripts` същия като показания по-долу (`lint` на шаблона казва `oxlint`; този на курса — `eslint . --max-warnings 0`, и се добавя `servidor`). Зависимостите се инсталират така, с две команди, от `~/curso-react/revisor/`:

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Обърни внимание на една разлика с урок 9 на TypeScript: там React беше в `devDependencies`, защото продукционният сървър не го импортираше. Тук е в `dependencies`, както го слага шаблонът. За приложение, което се изгражда и сервира като статични файлове, разликата не променя резултата (всичко завършва вътре в JavaScript-а на `dist/`); това е конвенция, която разделя „това, което пътува към браузъра“, от „това, което използваш само за изграждане“.

`package.json` на контролната точка изглежда така:

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

Пет скрипта, пет задачи. `dev` стартира сървъра за разработка. `build` проверява типовете и изгражда. `lint` изпълнява ESLint с `--max-warnings 0`, което се обяснява в 0.6. `preview` сервира това, което е останало в `dist/`, за да го видиш, преди да го публикуваш (и само за това: документацията на Vite казва, че е предназначен за преглед на изграденото на твоята машина и че не е продукционен сървър, [Vite, „Deploying a Static Site“](https://vite.dev/guide/static-deploy)). А `servidor` стартира тестовия сървър, който се представя в 0.7.

Преди да продължим, един навик, по който не се преговаря: `node_modules/` никога не се качва в хранилище. Това са десетки мегабайти, които `npm ci` възстановява идентично от `package-lock.json`. Шаблонът има `.gitignore`, който вече го изключва, заедно с `dist/` и файловете `*.local`; запази го, а ако сглобяваш проекта ръчно, създай го преди първото `git add` с поне тези три реда: `node_modules`, `dist` и `*.local`. В хранилището на курса папката `revisor/` няма собствен `.gitignore`: десетте контролни точки живеят в едно хранилище и `.gitignore` в корена му покрива всички. Това, което се качва, е `package-lock.json`.

#### 0.2.2 Три `tsconfig`, защото има два свята

В урок 9 на TypeScript един-единствен `tsconfig.json` проверяваше едновременно сървъра и таблото, а самият урок посочваше цената: кодът на сървъра също „виждаше“ `document` и едно недоглеждане се компилираше и се проваляше при изпълнение. Шаблонът на Vite разделя двата свята с **референции към проекти** (*project references*): малки проекти на TypeScript, които се проверяват поотделно, всеки със собствените си правила ([TypeScript, „TSConfig Reference“](https://www.typescriptlang.org/tsconfig/)). Файлът в корена не проверява нищо; само изброява другите два:

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (от *build*) обхожда тези референции и проверява всяка. Първият е този на браузъра, `tsconfig.app.json`, и покрива `src/`:

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

Важното в този файл се побира в пет идеи:

- **`"lib": ["ES2023", "DOM"]` и `"types": ["vite/client"]`.** Тук съществуват `document` и `window`, а освен това и типовете, които Vite добавя към браузъра, като `import.meta.env` ([Vite, „Features“, типове на клиента](https://vite.dev/guide/features)). В другия проект те няма да съществуват.
- **`"noEmit": true`.** TypeScript не записва никакъв `.js`: само проверява. Този, който превежда, е Vite. Документацията на TypeScript описва тази опция точно така: оставя място друг инструмент да преобразува кода ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** Това е начинът за разрешаване на `import`, предназначен за бъндлъри, и за разлика от `nodenext` **никога не изисква разширение** в относителните пътища ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). Това е първата от двете промени в кода на урок 9: там пишеше `import { Panel } from "./Panel.js"`, с `.js`, който не съществуваше на диска, защото Node го изискваше; тук пишеш `from "./Panel"`.
- **`verbatimModuleSyntax` и `isolatedModules`.** Vite превежда всеки файл поотделно, без да гледа останалите, и затова не знае дали това, което импортираш, е тип или стойност. С `verbatimModuleSyntax` TypeScript те задължава да отбележиш с `type` това, което е само тип, и преводачът може да го изтрие без колебание ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)); с `isolatedModules` те предупреждава, ако напишеш нещо, което преводач, обработващ по един файл, не може да разбере правилно. Документацията на Vite изисква изрично втората опция ([Vite, „Features“](https://vite.dev/guide/features)). Шаблонът не я включва; контролната точка я добавя, защото официалният източник я изисква.
- **`"strict": true`.** Тя също не идва с шаблона от този месец, а курсът по TypeScript я приемаше за даденост от своя урок 2. Без нея `null` и `undefined` се промъкват там, където не трябва.

Вторият проект, `tsconfig.node.json`, е този за нещата, които работят в Node: конфигурацията на Vite и тестовият сървър.

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

Тук няма `DOM`: ако тестовият сървър напише `document`, `tsc -b` ще го отхвърли. И се появяват две опции, свързани с нова възможност на Node: от версия 24.12.0 изпълнението на файл `.ts` директно с `node archivo.ts` е стабилно. Node не проверява типове, само ги заменя с интервали, и затова поставя две условия: импортите да носят разширението си `.ts` и файлът да не използва синтаксис на TypeScript, който генерира код, като `enum` ([Node.js, „Modules: TypeScript“](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` позволява първото; `erasableSyntaxOnly` кара `tsc` да следи за второто ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). Затова `npm run servidor` е `node servidor/practica.ts`, без предварително компилиране.

Конфигурацията на Vite е кратка. *Proxy*-то, което съдържа, се обяснява в 0.3:

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

`port: 5173` е портът, който Vite използва и без това; записването му показва ясно кой е. `strictPort: true` променя какво става, ако този порт е зает: без тази опция Vite тихо пробва следващия свободен порт ([Vite, „Server Options“](https://vite.dev/config/server-options)) и би се озовал с два забравени сървъра за разработка на 5173 и 5174, без да знаеш кой гледаш. С нея Vite отказва да стартира и ти го казва.

#### 0.2.3 Папките: по функционалност, а не по тип файл

Има два често срещани начина за подреждане на `src/`. Единият групира по тип файл: папка `components/`, друга `hooks/`, друга `services/`. Другият групира по **функционалност**: всичко необходимо, за да се „види отчетът за състоянията“, живее заедно, независимо дали е компонент, hook или мрежова функция. Този курс използва втория, и това е собствен принцип, а не правило на React (документацията на React не налага никаква структура). Причината е практическа: когато променяш как изглежда отчетът, отваряш една папка, а не три. А когато `revisor` порасне — детайлите на услуга в Урок 5, регистрацията в Урок 7, — всяка нова функционалност ще бъде нова папка, а не още един файл във всяка от обичайните.

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

`src/reporte/` е функционалността. `src/compartido/` пази това, което използват няколко: днес само типовете на API (`contrato.ts`). Останалите файлове в `src/` са тези, които засягат цялото приложение: стартирането и конфигурацията. Тези типове са същите като в урок 8 на TypeScript; единствената промяна е, че `esRegistro` сега живее тук, защото конфигурационният файл на сървъра, от който се импортираше, не е част от този проект:

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

Мрежовата граница съдържа втората промяна. В TypeScript `cargarReporte` получаваше втори параметър, `base`, който тестовете използваха, за да сочат към локален сървър с пълния му адрес. Тук браузърът винаги иска относителния път `/api/estados`, а *proxy*-то решава накъде отива, така че този параметър е излишен и се маха. Без него функцията вече има точно формата на типа `Cargar` и `main.tsx` може да я подаде както си е, без да я обвива в стрелкова функция:

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

Hook-ът и компонентът идват без промени в логиката; променят се само техните `import`. Освен това компонентът импортира своя файл със стилове: във Vite `import "./panel.css"` е всичко, което е нужно, за да стигне CSS-ът до страницата. При разработка се инжектира с таг `<style>`, който се подменя в движение, когато редактираш файла, а при изграждане се събира в отделен файл `.css` ([Vite, „Features“, CSS](https://vite.dev/guide/features)). В TypeScript подаваше файла със стилове на esbuild като втори вход; тук той пътува с компонента, който го използва, а това е точно идеята за групиране по функционалност.

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

Страницата и стартирането завършват обиколката. `index.html` е този от шаблона с три промени: езикът, заглавието и идентификаторът на контейнера, който остава `raiz`, за да не се пипа кодът, който го търси. `main.tsx` е `cliente.tsx` от TypeScript с две добавки: `StrictMode`, който се обяснява в 0.5, и интервалът, прочетен от конфигурацията, който се обяснява в 0.4.

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

Забележи нещо, за което урок 9 на TypeScript се грижеше и което тук се запазва: `cargarReporte` е функция, декларирана на ниво модул, така че е една и съща при всяко рисуване. `useReporte` я има в списъка си със зависимости; ако тя се променяше при всяко рисуване, ефектът щеше да се повтаря при всяко рисуване.

### 0.3 *Proxy*-то: един-единствен произход, докато разработваш

Дотук има два процеса: сървърът за разработка на Vite на `http://localhost:5173` и API (тестовият сървър) на `http://127.0.0.1:3100`. За браузъра това са **два произхода (origins)**, защото произходът е комбинацията от схема, сървър и порт, а тук се променят сървърът и портът. Правилото, което се прилага, се нарича **политика за еднакъв произход** (same-origin policy): скрипт, зареден от един произход, може да иска данни от друг, но браузърът **не му позволява да прочете отговора**, освен ако този отговор не носи подходящите CORS заглавки. MDN го казва така: от съображения за сигурност браузърите ограничават HTTP заявките между различни произходи, които се инициират от скриптове, а `fetch()` следва политиката за еднакъв произход ([MDN, „Cross-Origin Resource Sharing (CORS)“](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). Заглавката, която дава разрешение, е `Access-Control-Allow-Origin`.

Носи ли я тестовият сървър? Попитай го така, както би го направил браузърът, като кажеш от кой произход идваш:

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

Нито следа от `Access-Control-Allow-Origin`. `curl` получава пълния отговор, защото `curl` не е браузър и не прилага никаква политика; но ако таблото, заредено от порт 5173, поиска този пълен адрес, браузърът ще получи отговора и ще откаже да го предаде на кода, а в конзолата ще видиш CORS грешка. И е нарочно сървърът да не я носи: решението кои произходи могат да четат едно API е решение за сигурността на API, а не нещо, което се отваря, защото пречи на екрана по време на разработка. Урок 9 на TypeScript го каза от обратната страна: докато таблото и API идват от един и същ процес, няма нищо за настройване, а ако някой ден се разделят, правилният отговор е да се декларират изрични произходи, никога `*` за удобство.

Другият изход е браузърът **никога да не разбере**, че има два процеса. Точно това прави *proxy*-то във `vite.config.ts`: „всяка заявка, чийто път започва с този ключ, се препраща към посочената дестинация“ ([Vite, „Server Options“, `server.proxy`](https://vite.dev/config/server-options)). Кратката форма, `"/api": "http://127.0.0.1:3100"`, означава, че `http://localhost:5173/api/estados` се превръща, вътре в сървъра на Vite, в `http://127.0.0.1:3100/api/estados`. Браузърът говори само с порт 5173; препращането се случва между два процеса на твоята машина, където няма политика за еднакъв произход, която да се прилага. Провери го със същия `curl`, сега срещу Vite:

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

Отговорът е този на тестовия сървър, сервиран от произхода на страницата. Затова `cargar.ts` продължава да пише `fetch("/api/estados")`, относителен път, както в TypeScript: кодът на таблото не знае, а и не го интересува на кой порт живее API. Три детайла, които е добре да знаеш:

- **Препраща се само това, което започва с ключа.** `/src/main.tsx` продължава да се сервира от Vite. Ако утре API добави пътища, които не започват с `/api`, те няма да се препращат, докато не добавиш друг ключ. Затова е добре всички пътища на едно API да живеят под един и същ префикс.
- **`vite preview` също препраща.** Неговата опция `preview.proxy` по подразбиране взема стойността на `server.proxy` ([Vite, „Preview Options“](https://vite.dev/config/preview-options)), и затова в 0.5 изградената версия също намира API.
- **В продукция няма *proxy* на Vite.** Това, което се публикува, са файловете от `dist/`, а който ги сервира, ще трябва да реши същото: или страницата и API идват от един и същ произход (най-често, с обратно прокси (reverse proxy) отпред), или API декларира CORS. Урок 9 се връща към това.

### 0.4 Променливи `VITE_`: конфигурация, никога тайни

Интервалът на обновяване е конфигурация: стойност, която може да се различава между твоята машина, тази на колежката ти и публикуваната версия, без кодът да се променя. В сървър на Node би я прочел от `process.env`. В страница в браузъра **няма среда**: кодът работи на компютъра на този, който отваря страницата, и единственото, което този човек получава, е JavaScript-ът, който му изпращаш. Така че когато Vite ти предлага „променливи на средата“, това, което всъщност прави, е да **записва стойността им вътре в кода** в момента на сервиране или изграждане.

Правилото на Vite е само едно: само променливите, чието име започва с `VITE_`, стигат до кода на клиента, чрез `import.meta.env`, а стойността им се заменя статично при изграждане ([Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode)). Можеш да ги дефинираш в терминала или във файл `.env` в корена на проекта, който Vite винаги чете, заедно с `.env.local`. Ако една и съща променлива се появява на повече от едно място, печели най-специфичното: тези, които вече съществуват в терминала, когато Vite стартира, имат най-висок приоритет и файловете `.env` не ги презаписват; между файловете такъв за конкретен режим (например `.env.production`) тежи повече от общия ([Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode)). Контролната точка носи този:

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

А конфигурацията я чете и валидира на едно-единствено място. Това, което идва от `import.meta.env`, е текст или `undefined`, никога число, и идва отвън на програмата: третира се като всеки вход на граница, точно както `leerPuerto` в курса по TypeScript. Ако липсва или не е положително цяло число, се използва обичайната стойност:

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

За да знае TypeScript кои променливи съществуват, те се декларират в `src/vite-env.d.ts`, както посочва документацията на Vite. Интерфейсът `ViteTypeOptions` със `strictImportMetaEnv` прави типа строг: с него четенето на променлива, която не си декларирал, е грешка при компилация, а не тих `any` ([Vite, „Env Variables and Modes“, IntelliSense](https://vite.dev/guide/env-and-mode)). В „Грешката, която ще видиш“ ще го видиш да хваща печатна грешка.

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

Сега демонстрацията, която оправдава целия раздел. Поискай от сървъра за разработка конфигурационния модул такъв, какъвто го получава браузърът:

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

Първият ред е важният: стойността на променливата е **записана във файла**, който браузърът изтегля, заедно с още четири константи, които Vite винаги дефинира (`DEV`, `PROD`, `MODE`, `BASE_URL`). При изграждане става същото, вече минимизирано. Изгради с друга стойност и я потърси в `dist/`:

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

Ето я, `f(`15000`)`, вътре в минимизирания JavaScript: `f` е `leerCadaMs` със съкратено име. (Използва се `npx vite build`, а не `npm run build`, само за да се подаде променливата на същия ред; резултатът е същият.) И ако някой дефинира „ключ“, с него се случва абсолютно същото. Този експеримент временно добавя ред в края на `src/main.tsx`, който отпечатва една променлива с префикс и една без:

```ts
console.log("con prefijo:", import.meta.env.VITE_CLAVE_API, "sin prefijo:", import.meta.env.CLAVE_API);
```

Изгради с двете стойности, дефинирани в терминала, и потърси:

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

Тази с `VITE_` остана записана, четима за всеки, който отвори инструментите за разработчици на браузъра си. Тази без префикс остана като `void 0`, тоест `undefined`: Vite не я изложи. Затова документацията на Vite предупреждава, че променливите `VITE_*` не трябва да съдържат чувствителна информация, като API ключове ([Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode)). Обърни внимание също, че изграждането завърши успешно, макар кодът да четеше две променливи, които `vite-env.d.ts` не декларира: `vite build` не проверява типове. `npx tsc -b` би го спрял с две `TS2339`; затова скриптът за изграждане на курса започва с него. (Ако повториш експеримента, махни после реда и изгради отново. Пълният изход, с двете `TS2339`, е във `vite-clave-api.salida.txt`.)

Един нюанс, който си струва да се измери, защото променя какво означава „записано в JavaScript-а“. При изграждане Vite заменя **четенията**, които намира в кода ти, като `import.meta.env.VITE_CADA_MS`; променлива `VITE_`, която никой файл не чете, не пътува. Дефинирай една, която никой не чете, и потърси стойността ѝ:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
0
```

Но е достатъчно един-единствен ред да прочете целия обект (`console.log(import.meta.env);`, добавен в края на `main.tsx` за експеримента), за да пътуват **всички** променливи `VITE_`, които съществуват в този момент:

```text
$ VITE_NADIE_LA_LEE=valor-que-nadie-lee npx vite build
...
$ grep -c 'valor-que-nadie-lee' dist/assets/*.js
1
```

Затова правилото не се опира на това, че „тази стойност никой не я чете“: всяка променлива `VITE_` се пише с мисълта, че може да се окаже в публичния JavaScript (изходът е във `vite-variable-sin-leer.salida.txt`). Това документира Vite, когато предупреждава, че стойностите `VITE_*` се включват в кода при изграждане и не трябва да носят чувствителна информация; частта „само тези, които се четат“ е това, което измери този експеримент с Vite 8.3.5, а не нещо, което ръководството му твърди.

Практическото правило има две половини. **Какво може да отиде във `VITE_`:** това, което не би имал нищо против да видиш публикувано на плакат, като интервал, името на средата или публичния адрес на API. **Какво никога не отива там:** ключове, пароли, токени, нищо, което дава разрешение за нещо. Тайна, от която браузърът има нужда, престава да бъде тайна в момента, в който браузърът я получи; ако една функционалност има нужда от ключ, ключът живее на сървър, а екранът иска от сървъра да свърши работата. И още едно парче: файловете `.env.local` съществуват за стойности от твоята машина, които не искаш да споделяш, а Vite препоръчва да се сложи `*.local` в `.gitignore`, за да не се качват никога.

### 0.5 `StrictMode`: безплатната проверка

`StrictMode` е компонент на React, който не рисува нищо. Той обвива част от дървото (тук — цялото дърво) и **само по време на разработка** прави нарочно три неща, за да извади наяве грешки, които вече съществуват в кода ти: рисува всеки компонент още веднъж, изпълнява всеки ефект с един допълнителен цикъл „започни и почисти“ и проверява дали използваш стари API ([React, „StrictMode“](https://react.dev/reference/react/StrictMode)). В продукция не прави нищо: документацията го казва без заобикалки — всичките му проверки са за разработка и не засягат изграждането.

Допълнителният цикъл на ефектите е този, който се забелязва най-много, и първата фигура го показва в тестов DOM. Компонент с ефект, който отпечатва кога започва и кога спира да се синхронизира, се монтира и демонтира два пъти: без `StrictMode` и с него.

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

Фигурите се изпълняват в отделна папка, `~/curso-react/figuras/`, и тази папка не съществува, докато не я създадеш. Копирай в нея от `programas/00-un-proyecto-de-verdad/` (папката до `revisor/`) пет файла: `package.json`, `package-lock.json`, `eslint.config.js`, `fig00_01.tsx` и `fig00_02.tsx`; после изпълни `npm ci` в `~/curso-react/figuras/`, за да се инсталират `react`, `jsdom` и линтерът с точните версии. Без `eslint.config.js` от тази папка `npx eslint fig00_02.tsx` (0.6) не знае какви правила да приложи. Фигурите се компилират с `tsc` и се изпълняват с `node`, както в курса по TypeScript. Със `StrictMode` React монтира ефекта, веднага го почисти и го монтира отново, сякаш някой е излязъл от екрана и се е върнал за миг. За какво? Защото това **наистина се случва** в истинско приложение: човекът сменя екрана и се връща или се променя зависимост на ефекта. Ако ефектът не умее да почисти това, което е направил, това излизане и връщане оставя остатъци: две отворени връзки, два таймера, две заявки, които се надпреварват. `StrictMode` предизвиква тази ситуация при всяко монтиране, за да я видиш днес, а не когато някой я забележи в продукция.

В `revisor` това се вижда в лога на тестовия сървър. Ето какво записа той, когато Chrome отвори таблото, сервирано от `npm run dev`:

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Две заявки при еднократно отваряне на страницата. Първата я направи първото монтиране на ефекта; почистването, което последва, извика `control.abort()`, браузърът прекъсна връзката, а сървърът го записа като отменена. Втората я направи второто монтиране и тя е тази, която запълни екрана.

Едно уточнение какво е гарантирано и какво не. Това, което React гарантира, е допълнителният цикъл на ефекта: подготовка, почистване и нова подготовка ([React, „StrictMode“](https://react.dev/reference/react/StrictMode)). Дали сървърът ще успее да **запише** първата заявка, зависи от момента, в който пристига прекъсването: ако браузърът я отмени, преди връзката да стигне до сървъра, логът ще покаже само `200`. В това изпълнение връзката успя да стигне и затова се вижда двойката. Ако на твоята машина видиш един-единствен ред, това не значи, че `StrictMode` е изключен; допълнителния цикъл го доказва първата фигура, а не логът. А ето какво записа той, когато Chrome отвори изградената версия, сервирана от `npm run preview`:

```text
07:26:22.726 GET /api/estados 200
```

Само една. В продукция няма допълнителен цикъл. Прочети внимателно какво доказва първият лог: **почистването на ефекта съществува и работи.** Ако `useReporte` не прекъсваше заявката в почистването си, първата нямаше да бъде отменена, двата отговора щяха да пристигнат и двата щяха да запишат състоянието; ако не спираше таймера, щеше да има два интервала, които питат на всеки десет секунди. Таблото от урок 9 вече имаше това почистване и `StrictMode` го потвърждава безплатно всеки път, когато отвориш страницата.

Изкушението, когато някой види две заявки за първи път, е да махне `StrictMode`, „защото дублира извикванията“. Това е като да махнеш алармата, защото звъни. Урок 3 посвещава цял раздел на това защо двойното монтиране е твой съюзник и на малкото ситуации, в които това, от което имаш нужда, не е да го заобиколиш, а да напишеш ефекта по друг начин.

### 0.6 Линтерът на React, включен от първия ден

ESLint чете кода ти, без да го изпълнява, и търси шаблони, за които знае, че са грешни. Сам по себе си той не познава React; `eslint-plugin-react-hooks` го учи на неговите правила. Препоръчаната му конфигурация във версия 7.1.1 включва шестнайсет правила: двете класически за hooks и четиринайсет, които идват от React Compiler. Документацията на React ги описва така: първите две покриват основните шаблони — `rules-of-hooks` (hooks да се извикват по един и същ начин при всяко рисуване) и `exhaustive-deps` (списъкът със зависимости да съдържа всичко, което ефектът използва), — а останалите са диагностики на компилатора, които могат да се използват, дори приложението ти още да не го е възприело ([React, „eslint-plugin-react-hooks“](https://react.dev/reference/eslint-plugin-react-hooks)). (Тази страница изброява седемнайсет; разликата е `component-hook-factories`, което версия 7.1.1 на пакета още не включва в препоръчаната си конфигурация. Измерено беше чрез четене на правилата, които инсталираният пакет включва.)

Конфигурацията на проекта събира три препоръчани части — тези за JavaScript, за TypeScript и за React — и запазва правилото срещу XSS, което урок 9 на TypeScript написа:

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

`globalIgnores(["dist"])` не позволява на ESLint да проверява изградения код, който не си писал ти. `files` ограничава проверката до файловете на TypeScript. А `reactHooks.configs.flat.recommended` е формата, която самият пакет посочва за плоската конфигурация на ESLint.

Сега детайлът, който решава дали линтерът върши работа, или е украса. Правилото `exhaustive-deps` е настроено като **предупреждение** (*warning*), а не като грешка. А ESLint с предупреждения **завършва успешно**. Ето как изглежда, ако махнеш `cadaMs` от списъка със зависимости на `useReporte` и изпълниш ESLint просто така:

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Изходен код 0: за всеки скрипт или автоматична проверка това означава „всичко е наред“. Това предупреждение е сцената, с която започна урокът: ефектът вече не разбира, когато интервалът се промени, така че колежката ти може да го променя колкото си иска, а таблото ще продължи да пита на всеки десет секунди. Затова скриптът на курса е `eslint . --max-warnings 0`: с нула разрешени предупреждения същата промяна спира командата.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

Принципът на курса за това предупреждение не се променя в нито един урок: **поправя се кодът, а не се заглушава правилото.** Тук поправката е да се върне `cadaMs` в списъка, което е истината: ефектът го използва. Коментар `// eslint-disable-next-line` би махнал предупреждението и би оставил дефекта точно там, където си беше.

Втората фигура събира в компонент от дванайсет реда двете класически грешки с hooks. Тя не е част от `revisor`; проверява се със собствена конфигурация, същата като тази на проекта, но без правилото за XSS:

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

Двете грешки казват едно и също с различни думи: React разпознава всеки `useState` и всеки `useEffect` на компонента **по реда, в който се извикват**, а не по името им. Ако при едно рисуване `visible` е `false` и компонентът излезе по-рано, това рисуване не извиква нито един hook; ако при следващото е `true`, ги извиква, и React вече не знае кое състояние на кой hook принадлежи. Съобщението дори отгатва причината: „извика ли hook след ранен `return`?“. Поправката е hooks да се преместят над `if`, а условието да остане само за това, което се рисува. Предупреждението на третия ред е същото като в `useReporte`. Решенията на упражненията показват поправената версия.

А правилата на компилатора не остават на теория. Ако в ефекта на `useReporte` напишеш `establecerCarga({ tipo: "cargando" })` точно в началото, преди да създадеш `AbortController`, линтерът би отговорил така (съобщението е дълго; показано е изцяло, защото само се обяснява):

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

Това е правилото `set-state-in-effect`. Обърни внимание, че оригиналният `useReporte` също извиква `establecerCarga` вътре в ефекта, но **след `await`**, когато отговорът е дошъл отвън: това е синхронизиране с външна система и правилото го позволява. Това, което то отхвърля, е състоянието да се промени веднага, в тялото на ефекта, защото това предизвиква допълнително рисуване, което нищо извън React не е поискало. Таблото вече слага `cargando` там, където му е мястото: в `recargar`, което се изпълнява при кликване. Това е първият досег с принципа на курса за ефектите; Урок 3 го развива изцяло.

Контролната точка минава чисто. Това не е случайност, нито заслуга на линтера: кодът от урок 9 на TypeScript вече спазваше правилата. Това, което се променя днес, е, че оттук нататък, ако някой ги наруши, `npm run lint` го казва и спира.

### 0.7 Тестовият сървър и пълното преминаване

Последният файл е тестовият сървър. Курсът е за екрана и този сървър не се обяснява ред по ред: той е процес на Node, който отговаря със същите публични данни като API от курса по TypeScript, `GET /api/estados` и `GET /salud`, с четири фиксирани услуги и забавяне от 300 ms, за да успееш да видиш „Cargando…“. Използва типовете от `src/compartido/contrato.ts`, така че ако тези типове се променят, `tsc -b` посочва и сървъра. И записва по един ред за всяка заявка, което използва в 0.5, за да видиш двете заявки на `StrictMode`.

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

Пълното преминаване използва два терминала. В първия — тестовият сървър:

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

От друг терминал го провери, преди да го смесиш с каквото и да е друго. Ако тези три отговора не излязат така, проблемът е в сървъра, а не в таблото:

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

Във втория терминал — сървърът за разработка:

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

„Ready in 110 ms“: не пакетира кода ти, затова отнема толкова малко. Последният ред казва, че сървърът слуша само на твоята машина; с `--host` би се отворил към мрежата ти, а това не е нужно. Отвори `http://localhost:5173/` в браузъра си. Трябва да видиш заглавието „Revisor“, краткотрайно „Cargando…“ и четири услуги със зелена или червена рамка. Ето какво върна Chrome без графичен интерфейс, след като изпълни JavaScript-а на страницата (показан е само контейнерът):

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

При отворена страница направи пробата, която оправдава сървъра за разработка: смени в `Panel.tsx` текста `Revisor` на `<h1>` с `Revisor de servicios` и запиши. Страницата се променя сама, без презареждане, и списъкът си остава: не мина отново през „Cargando…“. Това е *Fast Refresh* от 0.1.2. (Това се проверява с очите, в отворен прозорец на браузъра; никой автоматичен инструмент на курса не го измерва, нито изпълненията на този урок, направени с Chrome без графичен интерфейс: това, което се твърди тук, е документираното от плъгина на React. Върни текста, когато приключиш.)

Накрая изгради и разгледай версията, която би се публикувала. При все още работещ тестов сървър:

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

`http://localhost:4173/` показва същото табло, сега от файловете в `dist/` и без активен `StrictMode`, което потвърди логът от 0.5. Спри всичко с Ctrl+C във всеки терминал; тестовият сървър се сбогува със `servidor de práctica detenido`.

Една последна проверка — тази, която прави всяка автоматична проверка: да се изтрие `node_modules/`, да се инсталира отново точно това, което е в заключващия файл, с `npm ci` и да се повтори. В контейнера с Linux от „За изпълненията“, от копие без `node_modules/` и `dist/`, `npm ci`, `npm run lint` и `npm run build` завършиха успешно, а изграждането произведе същите три файла със същите имена (`index-tGGc24Rg.css` и `index-BWNt33lQ.js`). Съвпадението на името не е подробност: имената в `dist/` произлизат от съдържанието, така че ако две машини произведат едни и същи имена, много вероятно е пакетът да е един и същ (името съдържа само фрагмент от хеша на съдържанието), а ако имената се различават, съдържанието е различно.

## Грешката, която ще видиш

Урокът има една основна грешка — тази, която се ражда от това, че Vite не проверява типове, — и две помощни.

**Основната грешка: „при мен се изгражда“.** Смени в `Panel.tsx` типа на свойството `cadaMs` от `number` на `string` и изгради по двата начина:

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

`vite build` завършва със зелената си отметка: изтри типовете и пакетира. `npm run build` спира на `tsc -b` с три грешки, а `vite build` дори не започва. Разчита се като всяка грешка на TypeScript: файл, ред и колона в скоби, код на грешката и кое с кое не се съвместява. Трите грешки са едно и също несъгласие, видяно от три места: `main.tsx` подава число там, където сега се очаква текст, стойността по подразбиране `10_000` е число, а `useReporte` получава текст там, където очаква число. Поправката е типът да се върне; поуката е друга: **отметката на Vite казва „пакетирах“, а не „всичко е наред“.** По време на разработка става същото, и то по-опасно: `npm run dev` сервира файла с грешката и таблото може дори да работи, защото по време на изпълнение число, което типът нарича „текст“, си остава число. Проверявай редактора си, а преди да предадеш, изпълни `npm run build`.

**Печатна грешка в променлива.** Напиши `VITE_CADA_MZ` вместо `VITE_CADA_MS` в `configuracion.ts`:

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

Това е работата на `strictImportMetaEnv` (0.4). Без този ред във `vite-env.d.ts` грешното име би се компилирало, в браузъра би имало стойност `undefined`, `leerCadaMs` би използвала стойността по подразбиране и никой не би разбрал защо променливата „не работи“.

**Предупреждението, което не спира нищо.** Това е предупреждението от 0.6: `exhaustive-deps` е предупреждение, ESLint завършва с код 0 и проверка, която гледа само изходния код, казва „чисто“. Признакът, по който се разпознава, е редът `✖ 1 problem (0 errors, 1 warning)`, последван от нищо. С `--max-warnings 0` се появява освен това `ESLint found too many warnings (maximum: 0).` и командата се проваля.

## Какво се прави погрешно

**Да изпълняваш само `vite build` или само `npm run dev`.** Нито едното не проверява типове. Процес, който не минава през `tsc -b`, може да предаде пакет с грешки в типовете; затова скриптът `build` започва с него.

**Да сложиш тайна в променлива `VITE_`.** Всяка променлива `VITE_` може да остане записана в публичния JavaScript (тази, която кодът чете — със сигурност; всички — ако един ред чете целия обект), както видя с `grep`. Преименуването на променливата, за да не носи префикса, не я прави сигурна: ако браузърът има нужда от нея, браузърът я има. Ключовете живеят на сървър.

**Да отвориш CORS с `*` в API, за да работи по време на разработка.** Решаваш неудобство на твоята машина с решение за сигурността, което засяга всички. По време на разработка *proxy*-то на Vite премахва проблема, без да пипа API.

**Да махнеш `StrictMode`, защото „прави две заявки“.** Втората заявка е доказателството, че почистването на ефекта работи, а в продукция тя не съществува. Махането му скрива точно грешките, които той е дошъл да покаже.

**Да заглушиш линтера.** `// eslint-disable-next-line react-hooks/exhaustive-deps` оставя ефекта със списък със зависимости, който лъже, а дефектът си остава, само с изключено предупреждение. Ако правилото се оплаква, промени кода.

**Да оставяш предупрежденията да минават.** Без `--max-warnings 0` предупреждение за зависимости не спира нищо и с времето никой не чете изхода на линтера, защото „винаги има нещо“.

**Да качиш `node_modules/` или `dist/` в хранилището.** Те се възстановяват идентично с `npm ci` и `npm run build`. Това, което се качва, е `package-lock.json`, защото то позволява възстановяването им.

**Зависимости без точна версия.** С `^` в `package.json` двама души, които инсталират с няколко дни разлика, може да имат различни версии. Заключващият файл помага, но само ако се качи и се инсталира с `npm ci`.

**Да оставиш Vite тихо да смени порта.** Без `strictPort` забравен сървър на 5173 кара новия да стартира на 5174 и накрая гледаш старата версия. Със `strictPort: true` вторият отказва да стартира.

## Упражнения

### Упражнение 1 — Смени интервала, без да пипаш кода

Накарай таблото да се обновява на всеки 3 секунди, без да редактираш нито един файл в `src/`. **Преди да го направиш, предвиди** колко реда `GET /api/estados 200` ще запише тестовият сървър в първите 10 секунди след отварянето на страницата с `npm run dev`. Направи пробата с два различни механизма: като дефинираш променливата в терминала и като създадеш файл `.env.local`. Кой от двата печели, ако ги има и двата? Защо `.env.local` не трябва да се качва в хранилището и кой ред от `.gitignore` го предотвратява?

### Упражнение 2 — Поправи фигура 2

Поправи `fig00_02.tsx` така, че `npx eslint fig00_02.tsx` да не съобщава нищо, а компонентът да продължава да не рисува нищо, когато `visible` е `false`. Преди да пишеш, обясни в дневника си защо преместването на `if` под hooks не променя това, което човекът вижда.

### Упражнение 3 — *Proxy*-то, което липсва

Добави във `vite.config.ts` необходимото, за да отговори `curl http://localhost:5173/salud` с `ok`. **Преди това** предвиди какво отговаря днес същата заявка и защо това не е 404 от API. Провери предвиждането си, преди да промениш каквото и да е.

### Упражнение 4 — Почистването, което липсва

В `useReporte` изтрий временно реда `control.abort();` от почистването на ефекта. При работещи тестов сървър и `npm run dev` отвори страницата и разчети лога на сървъра. Какво се промени спрямо 0.5? Какво ти казва това за това, което `StrictMode` проверяваше? Предупреждава ли те линтерът? Върни реда, когато приключиш.

## Решения

### Решение 1

В терминала променливата се пише пред командата и важи само за този процес:

```bash
VITE_CADA_MS=3000 npm run dev
```

С `.env.local` файлът съдържа един ред, `VITE_CADA_MS=3000`, и Vite го чете при стартиране (ако сървърът вече работеше, рестартирай го). Предвиждането: за 10 секунди — заявката при монтирането плюс по една на всеки 3 секунди, тоест четири отговора `200`, **плюс**, ако връзката успее да стигне до сървъра преди прекъсването (0.5), един ред `cancelada por el cliente` в началото, който е допълнителният цикъл на `StrictMode`. Така излезе при измерването с Chrome без графичен интерфейс в продължение на 10 секунди от вътрешния му часовник: една отменена и четири `200`. Ако ги има и двата източника, печели терминалът: документацията на Vite казва, че променливите, които вече съществуват, когато Vite стартира, не се презаписват от файловете `.env`. `.env.local` съществува точно за стойности от твоята машина, а редът `*.local` в `.gitignore` не позволява да се качи. Когато приключиш, изтрий файла, за да съвпадне проектът ти отново с контролната точка.

### Решение 2

Hooks отиват първи, а условието само решава какво се рисува; списъкът със зависимости назовава това, което ефектът използва:

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

Това, което човекът вижда, не се променя, защото `return null` продължава да се случва преди рисуването на абзаца. Това, което се променя, е, че двата hook-а се извикват при всички рисувания, в същия ред, и React може да ги свърже със състоянието им. Забележи едно следствие, което си струва да обсъдиш в дневника си: при `visible` равно на `false` таймерът продължава да брои, макар нищо да не се вижда. Ако не искаш това, решението не е да върнеш `if` най-горе, а този, който използва `Resumen`, да не го рисува: `{visible && <Resumen cadaMs={5000} />}` (внимавай с тази форма, когато условието е число: това е капанът с `0` от [Урок 1](01-componentes-puros-composicion.md)).

### Решение 3

Днес `curl http://localhost:5173/salud` не стига до API: пътят не започва с `/api`, така че го обслужва Vite. За сървър за разработка на едностранично приложение непознат път не е грешка: той отговаря с `index.html`, за да реши маршрутизаторът на клиента (Урок 5 се връща към това). Ще получиш HTML-а на страницата, с код 200, а не `ok`. Провери го, преди да промениш каквото и да е; добър навик е да не се доверяваш на предвиждането. За да я препратиш, добави още един ключ:

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Рестартирай `npm run dev`, за да вземе новата конфигурация, и отговорът ще бъде `ok`. Това упражнение е причината за препоръката от 0.3: ако всички пътища на API живееха под `/api`, един-единствен ключ би бил достатъчен.

### Решение 4

Без `control.abort()` логът престава да показва реда `cancelada por el cliente`: сега при отваряне на страницата се появяват **две** `GET /api/estados 200`. Първата заявка, тази от монтирането, което `StrictMode` отмени, вече никой не я прекъсва; нейният отговор пристига и записва състоянието на ефект, който вече е бил почистен. В това табло това не се забелязва с просто око, защото двата отговора са еднакви, но ако първият беше по-бавен и носеше стари данни, щеше да презапише втория: това е надпреварата между отговорите, която Урок 3 възпроизвежда и поправя. `StrictMode` проверяваше точно това — че почистването отменя започнатото от ефекта. А линтерът? Не казва нищо: липсващото почистване не нарушава никое правило, което може да се види в текста на кода. Затова `StrictMode` и линтерът са две различни защити и курсът използва и двете.

## Как разбирам, че съм успял

- [ ] `node -v` отпечатва версия, която започва с `v24`, а `npx tsc --version` в `~/curso-react/revisor/` отпечатва `Version 7.0.2`.
- [ ] При работещ тестов сървър `curl -s http://127.0.0.1:3100/salud` отговаря `ok`, а `curl -s http://localhost:5173/api/estados` (при работещ `npm run dev`) отговаря с JSON на четирите услуги.
- [ ] Отварянето на `http://localhost:5173/` показва заглавието „Revisor“ и четири услуги, а логът на тестовия сървър записва `200` при отваряне на страницата. Ако преди него се появи и `cancelada por el cliente`, знаеш как да го разчетеш като допълнителния цикъл на `StrictMode`; ако не се появи, знаеш защо това не означава, че е изключен (0.5).
- [ ] С изградената версия (`npm run preview`, на `http://localhost:4173/`) същата страница произвежда само една заявка в лога.
- [ ] `npm run lint` завършва, без да изпише никакъв проблем, а при махане на `cadaMs` от списъка със зависимости на `useReporte` се проваля с `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` завършва с `✓ built` и оставя в `dist/` един `index.html`, един `.css` и един `.js`; при нарочна промяна на тип спира на `tsc -b` и `vite build` не стига до изпълнение.
- [ ] Можеш да покажеш с `grep` върху `dist/`, че стойността на `VITE_CADA_MS` пътува вътре в JavaScript-а, и да обясниш защо това изключва слагането на тайна там.
- [ ] `git status` в проекта не показва `node_modules/` и `dist/` като файлове за добавяне.
- [ ] Записа в своя [дневник](bitacora.md) версиите си, какво се промени спрямо пакетирането с esbuild и първото предупреждение, което ти даде линтерът.

## Обобщение

Отговори, без да гледаш урока:

1. Какви две различни задачи върши Vite и коя от двете пакетира? Защо сървърът за разработка няма нужда да пакетира?
2. Защо скриптът `build` започва с `tsc -b`? Какво става, ако изпълниш само `vite build` с грешка в типовете?
3. Какво проверява `tsconfig.app.json` и какво проверява `tsconfig.node.json`? Защо единият има `DOM`, а другият не?
4. Защо с `"moduleResolution": "bundler"` вече не пишеш `.js` в края на `import`-ите?
5. Какво е произход (origin)? Защо таблото на порт 5173 не може да прочете отговор от порт 3100 и как *proxy*-то решава това, без да пипа API?
6. Кои променливи стигат до `import.meta.env`, кога се заменя стойността им и защо там не отива никаква тайна?
7. Какво прави `StrictMode` с ефектите по време на разработка и какво доказва редът `cancelada por el cliente` в лога?
8. Какво проверяват `rules-of-hooks` и `exhaustive-deps`? Защо курсът изпълнява ESLint с `--max-warnings 0`?

## За допълнително четене

- [Vite, „Getting Started“](https://vite.dev/guide/): как се създава проект, списъкът с шаблони, версията на Node, която изисква, и защо `index.html` е входът. Посетено на 21 октомври 2026 г.
- [Vite, „Why Vite“](https://vite.dev/guide/why): проблемите, които решава сървърът за разработка, и защо се пакетира за продукция; Rolldown и Oxc. Посетено на 21 октомври 2026 г.
- [Vite, „Announcing Vite 8“](https://vite.dev/blog/announcing-vite8): Rolldown като единствен бъндлър, от 12 март 2026 г. Посетено на 21 октомври 2026 г.
- [Vite, „Dependency Pre-Bundling“](https://vite.dev/guide/dep-pre-bundling): защо Vite пакетира предварително зависимостите по време на разработка и че го прави с Rolldown. Посетено на 21 октомври 2026 г.
- [Vite, „Features“](https://vite.dev/guide/features): TypeScript без проверка на типовете, `isolatedModules`, типовете от `vite/client` и импортирането на CSS. Посетено на 21 октомври 2026 г.
- [Vite, „Env Variables and Modes“](https://vite.dev/guide/env-and-mode): префиксът `VITE_`, редът на файловете `.env`, предупреждението за чувствителна информация и типовете със `strictImportMetaEnv`. Посетено на 21 октомври 2026 г.
- [Vite, „Server Options“](https://vite.dev/config/server-options) и [„Preview Options“](https://vite.dev/config/preview-options): `server.proxy`, `server.port`, `strictPort` и *proxy*-то, наследено от `vite preview`. Посетено на 21 октомври 2026 г.
- [Vite, „Deploying a Static Site“](https://vite.dev/guide/static-deploy): защо `vite preview` не е продукционен сървър. Посетено на 21 октомври 2026 г.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react): *Fast Refresh*, автоматичният *runtime* на JSX и опцията за компилатора. Посетено на 21 октомври 2026 г.
- [React, „StrictMode“](https://react.dev/reference/react/StrictMode): проверките по време на разработка, допълнителният цикъл на ефектите и защо не засягат изграждането. Посетено на 21 октомври 2026 г.
- [React, „eslint-plugin-react-hooks“](https://react.dev/reference/eslint-plugin-react-hooks): препоръчаната конфигурация, правилата за hooks и тези на компилатора. Посетено на 21 октомври 2026 г.
- [React, „Build a React app from Scratch“](https://react.dev/learn/build-a-react-app-from-scratch) и [„Sunsetting Create React App“](https://react.dev/blog/2025/02/14/sunsetting-create-react-app): кога е подходящ инструмент като Vite и извеждането от поддръжка на Create React App. Посетено на 21 октомври 2026 г.
- [MDN, „Cross-Origin Resource Sharing (CORS)“](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): политиката за еднакъв произход за `fetch()` и заглавката `Access-Control-Allow-Origin`. Посетено на 21 октомври 2026 г.
- [TypeScript, „TSConfig Reference“](https://www.typescriptlang.org/tsconfig/): `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` и референциите към проекти. Посетено на 21 октомври 2026 г.
- [typescript-eslint, „Dependency Versions“](https://typescript-eslint.io/users/dependency-versions/): версиите на TypeScript и ESLint, които поддържа. Посетено на 21 октомври 2026 г.
- [Node.js, „Modules: TypeScript“](https://nodejs.org/api/typescript.html), [„Download“](https://nodejs.org/en/download) и [„Previous Releases“](https://nodejs.org/en/about/previous-releases): изпълнение на `.ts` директно с Node и условията за това; версиите от линия 24 LTS. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| сървър за разработка | процесът, който стартира `npm run dev`: сервира всеки модул поотделно, преведен в движение, и известява браузъра, когато файл се промени |
| HMR / *Fast Refresh* | подмяна в страницата само на модула, който се е променил, без презареждане; в React запазва състоянието на компонентите, които не са се променили |
| изграждане | това, което прави `npm run build`: проверка на типовете и пакетиране в `dist/` на файловете, които се публикуват |
| референции към проекти | няколко малки `tsconfig`, които `tsc -b` проверява поотделно, всеки със своите правила |
| произход (origin) | комбинацията от схема, сървър и порт на един адрес; два различни порта са два произхода |
| политика за еднакъв произход | правилото на браузъра, което не позволява на скрипт да чете отговори от друг произход, освен ако отговорът не го разрешава с CORS |
| *proxy* (за разработка) | препращането, което Vite прави на определени пътища към друг сървър, за да вижда браузърът един-единствен произход |
| променлива `VITE_` | конфигурация, която Vite записва вътре в кода на клиента; публична по определение |
| `StrictMode` | компонент на React, който само по време на разработка рисува два пъти и изпълнява допълнителен цикъл на всеки ефект, за да извади грешки наяве |
| `--max-warnings 0` | опция на ESLint, която кара командата да се провали, ако има поне едно предупреждение |

---

**Следващ:** [Урок 1 — Чисти компоненти и композиция](01-componentes-puros-composicion.md)
