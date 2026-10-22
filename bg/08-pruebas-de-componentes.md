# Урок 8 — Тестове на компоненти

*12:15 ч. в четвъртък е, а новата версия на `revisor` излиза в 13:00. Някой от екипа е качил промяна за „почистване“: махнал е от обобщението едно `> 0`, което било „излишно“, и е върнал на бутона за регистрация неговото `disabled={pending}`, защото „`aria-disabled` е някакво странно изобретение“. Линтерът не казва нищо. `npm run build` завършва успешно. Прегледът на кода го одобрява за две минути, защото всяка промяна сама по себе си изглежда разумна. Никой няма време да отвори петте екрана, да изпразни API, за да види отчета без повреди, и да мине през регистрацията с клавиатурата. Ако излезе така, таблото ще изрисува самотна `0` всеки път, когато всичко е наред, а Раул, колегата на дежурство, който работи с екранен четец, отново ще загуби фокуса точно в момента на изпращане, както в урок 7. Остават четирийсет и пет минути. Това, от което имаш нужда, е нещо, което да направи това преминаване вместо теб за две секунди, всеки път, когато някой промени ред, и да стане червено точно на тези две места. Това изгражда този урок. И ще видиш също коя част от това преминаване никой тест в Node не може да направи вместо теб.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 8.2 и 8.3)

**Какво изграждаш:** тестовия пакет на таблото с Vitest и Testing Library: 27 теста в 7 файла, които монтират цялото приложение в тестов DOM, с маршрутизатор в паметта и симулиран `fetch`, и които покриват чистите функции, reducer-а, схемата, състоянията на отчета, детайлите, маршрутите, границата за грешки и формуляра за регистрация

**Какво научаваш:** заявки по роля и защо са важни за достъпността; `getBy`, `queryBy`, `findBy`; `user-event`; симулиран `fetch`; четирите състояния, формулярът и маршрут с маршрутизатор в паметта; **тестът, който става червен при връщане на поправката**; какво НЕ може да провери jsdom

**Откъде идваш.** От контролната точка на [Урок 7](07-formularios-accesibilidad.md): `revisor` със списъка на `/`, детайлите на `/servicios/:nombre`, регистрацията на `/servicios/nuevo` и страница „не е намерена“; данните от сървъра в TanStack Query; лента с известия с reducer и контекст; и формуляр, който се валидира със схема, отбелязва грешките си с `aria-invalid` и `aria-describedby` и не отнема фокуса от бутона, докато изпраща. Дотук всичко това беше проверявано с фигури, които се изпълняваха в тестов DOM, и с Chrome без графичен интерфейс, веднъж, ръчно. От курса по TypeScript носиш, ако си го минал, тест с jsdom. Тук той не се повтаря: сменя се инструментът и, преди всичко, въпросът. Вече не „връща ли тази функция това, което казвам?“, а „прави ли този екран това, което човек очаква?“.

**Какво не прави този урок.** Не променя нито един ред от приложението: JavaScript-ът, който произвежда `npm run build`, е идентичен, байт по байт, с този от урок 7. Всичко ново са тестове, конфигурацията, която ги изпълнява, и четири помощни файла. Не използва `@testing-library/jest-dom`, библиотеката, която добавя сравнения като `toBeInTheDocument()`: тестовете сравняват `textContent` и атрибути с `expect` на Vitest, което е достатъчно и задължава да се каже точно какво се очаква. Не използва `vi.mock` за подмяна на модули на приложението: единственото фалшиво нещо е мрежата, по причини, обяснени в 8.3. Не пише тестове от край до край с истински браузър (Playwright, Cypress, браузърния режим на Vitest): назовава се това, което тези инструменти биха решили, и се казва какво остава за ръчна проверка. И не измерва покритие: процент изпълнени редове не казва дали един тест би станал червен при грешката, която е важна, а този урок те учи да проверяваш онова другото.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` на този урок. Контролната точка беше инсталирана от нулата с `npm ci` в копие извън хранилището и там `npm run lint`, `npm run build` и `npm test` завършиха с код 0; `npm run build` произведе `dist/assets/index-C_lOH5GL.js` (измерено отново на 22 октомври 2026 г., на macOS), същото име като в урок 7. Броят на тестовете беше прочетен от обобщението на Vitest, а не от изходния код. Третият тест в `PaginaServicio.test.tsx` (този за стария детайл, 8.3.4) беше добавен при прегледа на урока: видян беше червен с предишната страница (`1 failed | 26 passed (27)`) и зелен с контролната точка, а изходите от упражнение 3 и от целия пакет бяха изпълнени отново с новата контролна точка. Всички изходи на Vitest в урока бяха взети с `--reporter=default` (или `--reporter=verbose`, където е казано), което е това, което би видял в интерактивен терминал; репортерът беше фиксиран нарочно, защото извън терминал Vitest може да избере друг, който скрива конзолата на минаващите тестове (виж „Грешката, която ще видиш“). Работното копие имаше освен това файловете от упражнения 3 и 4; за пълното изпълнение на Vitest бяха подадени пътищата на седемте файла от контролната точка, което е същото като да изпълниш `npx vitest run` в контролната точка. Всеки тест, който „става червен“, беше предизвикан в това копие, като се променяше един-единствен файл, изпълняваше се само засегнатият тестов файл и след това се възстановяваше; накрая копието беше сравнено с контролната точка с `diff -r` и нямаше разлики, с изключение на тестовите файлове от упражнения 3 и 4, които не са част от контролната точка. Контролната точка беше инсталирана от нулата и в контейнер с Linux (Debian 12, официален образ `node:24.22.0-bookworm`): там `npm run build` даде същото име на файл, а `npm test` завърши с код 0 и `Tests  27 passed (27)`. Не беше изпълнено на истински Linux Mint; нищо от показаното не зависи от системата, с изключение на мерките в пиксели на страницата близнак в Chrome (ред 3 от фигура 3), които зависят от инсталираните шрифтове. Важното там е, че Chrome измерва, а jsdom връща нули. Фигурите бяха изпълнени със собствен `package.json` в [`programas/08-pruebas-de-componentes/`](../programas/08-pruebas-de-componentes), до `revisor/`, както в предишните уроци: компилират се с `tsc` и се изпълняват с `node`. Фигура 3 има освен това HTML страница близнак, която беше отворена в Chrome 155.0.8059.85 без графичен интерфейс, с `--headless --dump-dom` върху локалния файл, за да се сравни това, което прави jsdom, с това, което прави браузърът; това изпълнение не отвори нито един порт. Това, което **не** беше измерено в този урок, и се казва там, където се появява: обхождането с клавиатурата в истински прозорец и звукът на екранния четец. И двете бяха измерени или описани в урок 7 и се връщат тук в „Как разбирам, че съм успял“. В изходите дългите пътища се показват спрямо `~/curso-react`. Тестовите файлове на упражненията и изходите от пакета, от отрицателната контрола и от всяко връщане са в `programas/08-pruebas-de-componentes/ejercicios/` (бяха изпълнени отново при прилагането на прегледа, така че часовете и продължителностите им се различават от поставените тук). Тестовият сървър (същият файл от урок 4) отговаря с `400` и `{"detalle":"nombre de servicio inválido"}` на адрес с неправилно оформен `%`, като `/api/servicios/%`, и на неговия път `/reintento`; преди отговаряше с `500`. Беше измерено с `curl` срещу копие, преди и след промяната, и процесът остана жив и в двата случая.

## След урока ще можеш да

- Инсталираш Vitest, jsdom и Testing Library в проект на Vite, да настроиш тестовата среда и да обясниш защо е нужно `cleanup` да се извиква ръчно, когато Vitest не излага функциите си като глобални.
- Намериш елемент по неговата роля и достъпно име и да демонстрираш с фигура, че заявка по роля не намира бутон, направен със `<span>`, нито поле без етикет.
- Избереш между `getBy`, `queryBy` и `findBy` според това, което тестът твърди (че нещо е там, че нещо не е там, че нещо ще пристигне), и да разчетеш грешката, която дава всяка от тях, когато се провали.
- Симулираш човек с `user-event`: писане, натискане на Tab и интервал, кликване, и да обясниш защо тези действия се изчакват с `await`.
- Монтираш цялото приложение на даден адрес с маршрутизатор в паметта, нов кеш и симулиран `fetch` и с това да провериш състоянията на отчета, един маршрут и формуляра за регистрация.
- Провериш, че един тест защитава поправка: да върнеш поправката в копие, да видиш теста червен с точното съобщение и да възстановиш, и да разпознаеш зелен тест, който не става червен.
- Назовеш това, което jsdom не изчислява (оформлението, фокуса, който се губи при деактивиране на бутон), и да проектираш теста така, че да проверява причината, когато следствието не може да се види.

## Защо, преди как

До урок 7 всеки път, когато `revisor` се променяше, някой проверяваше, че продължава да работи. Правеше го добре: с фигури, които рисуваха компонент в тестов DOM, с `curl` срещу тестовото API, с Chrome без графичен интерфейс, управляван от скрипт. Но го правеше **веднъж**, в момента на писане на урока. Сцената от началото е това, което се случва втория път: кодът се променя, линтерът и компилаторът остават зелени и никой не прави отново преминаването. Задай на таблото четири въпроса и ще видиш какво липсва.

**Кой помни странните случаи?** Самотната `0` от урок 1 се появява само когато **нито една** услуга не е в повреда. Тестовото API винаги стартира с две в повреда. За да видиш грешката, би трябвало да регистрираш здрави услуги, да опиташ отново неработещите или да изпразниш API и после да погледнеш обобщението. Никой не прави това преди всяка версия. Тестът — да, защото той решава какво отговаря API.

**Как тестваш това, което зависи от мрежата, без да зависиш от мрежата?** Отчетът има четири състояния плюс едно: зареждане, грешка, празно, с данни и със стари данни, когато обновяването се провали. Виждането на „зареждане“ в браузър изисква бавно API; на грешката — API, което не работи; на празното — друго API. Тестовото API има променливата `ESCENARIO` за това, но стартирането му три пъти с три стойности не е нещо, което се изпълнява за две секунди. Ако тестът контролира какво отговаря `fetch`, всяко състояние е един ред.

**Как знаеш, че тестът гледа същото, което гледа човекът?** Тест, който търси `.boton-enviar` или `div > button:nth-child(2)`, минава, дори бутонът да е станал `<span>`, който екранният четец не обявява и клавиатурата не достига. Заявките на Testing Library започват от другата страна: от **ролята** и **достъпното име**, които са това, което браузърът предава на помощните технологии. Ако тест намери „бутона, който се казва Dar de alta“, този бутон е в дървото на достъпността с тази роля и това име: екранният четец го обявява така. Това, което заявката **не** проверява, е, че се достига с Tab, нито че реагира на Enter или интервал; това го гарантира нативният `<button>` (урок 7), а в този пакет го упражнява тестът за фокуса с `usuario.tab()` и `usuario.keyboard(" ")`. Това е същият навик от урок 7, сега автоматичен.

**Как знаеш, че тестът върши работа?** Това е въпросът, който почти никой не задава. Зелен тест казва, че текущият код изпълнява това, което тестът твърди. Не казва, че тестът би станал червен, ако поправката изчезне. Има тестове, които минават с добрия код **и** с лошия: те не защитават нищо и дават фалшиво спокойствие. Единственият начин да се разбере е да се направи експериментът: махаш поправката, виждаш червеното, възстановяваш. Този урок го прави с три теста от пакета (и с четвърти в упражнение 2) и те учи да разпознаваш тест, който не минава изпита.

Четирите отговора се побират в три понятия: заявки към страницата така, както го прави човек (8.2), монтиране на цялото приложение без мрежа и без браузър (8.3) и тестът, който става червен при връщане на поправката (8.4). Преди тях е инсталацията (8.1), а след тях, със същата откровеност — това, което jsdom не може да провери (8.5). Накрая ето какво казва `npm test` с подробния репортер, който отпечатва по един ред за всеки тест:

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

Това са 27 реда с `✓`, а обобщението го потвърждава: `Tests  27 passed (27)`. Обърни внимание как се четат имената: „el formulario de alta > el foco no se pierde al enviar y un segundo envío se ignora“. Всеки тест казва какво поведение защитава, на езика на този, който използва таблото, а не на този, който го е програмирал. Когато някой стане червен, името ще ти каже какво се е счупило, преди да прочетеш ред код. И обърни внимание на милисекундите: тестовете, които монтират приложението, отнеха от 34 до 629 ms в това изпълнение; тези на чистите функции — от 0 до 2. Целият пакет, със стартирането на jsdom, отне 4.69 s. Тези милисекунди зависят от това какво още работи на машината (предишното изпълнение, при по-свободна машина, даде от 8 до 112 ms и 1.06 s), така че ги чети като порядък: това, което се запазва, е, че чистите функции отнемат почти нищо, а монтирането на приложението струва стотици пъти повече.

## Понятията

### 8.1 Инсталацията: Vitest, jsdom и Testing Library

#### 8.1.1 Пет зависимости и един скрипт

Контролната точка на този урок добавя пет зависимости за разработка и един скрипт. Това е пълният `package.json`:

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

Всяка част има различна задача и е добре да не се бъркат:

- **`vitest`** е този, който изпълнява тестовете: намира файловете `*.test.ts` и `*.test.tsx`, преобразува ги със същата конфигурация на Vite, която проектът вече използва (затова разбира TypeScript и JSX без отделна стъпка), и дава функциите `test`, `describe`, `expect` и `vi`.
- **`jsdom`** е DOM, написан на JavaScript: `document`, `window`, елементи, събития, формуляри. Той не е браузър; той е частта от браузъра, която може да се имитира, без да се рисува нищо. Вече го използва във фигурите от предишните уроци.
- **`@testing-library/dom`** носи заявките (`getByRole`, `findByText`…) и изчакването (`waitFor`). Не знае нищо за React. Инсталира се отделно, защото `@testing-library/react` я декларира като равностойна зависимост (*peer dependency*) и не я носи; документацията ѝ изисква двете да се инсталират заедно. Фигурите я импортират директно заради `logRoles` (8.2.2).
- **`@testing-library/react`** е тънък слой отгоре: `render`, който рисува компонент на React в тестовия DOM, и `cleanup`, който го демонтира. Обвива функциите си в `act` вместо теб — това е инструментът на React за прилагане на всички чакащи промени преди сравнението ([React, `act`](https://react.dev/reference/react/act)). Документацията на React добавя, че с React Testing Library променливата `IS_REACT_ACT_ENVIRONMENT` „вече е зададена“. Това е вярно наполовина: библиотеката я включва **за постоянно** само когато изпълнителят излага `beforeAll` като глобална, също както при `cleanup`; без глобални я включва само докато трае всеки `render` или всяко събитие, които тя самата обвива в `act`, и я изключва по време на всяко изчакване. Обновяване, което се случи извън тези отрязъци (таймер, отговор, който пристига късно), никога не би предизвикало предупреждение. Затова `preparar.ts` я включва ръчно (8.1.3). Затова в този пакет `act` почти не се появява: единственият път, когато се използва ръчно, е в упражнение 3, за навигиране с маршрутизатора извън кликване.
- **`@testing-library/user-event`** симулира човек: пише, кликва, натиска клавиши. Обяснява се в 8.2.3.

Новият скрипт е `"test": "vitest run"`. Думата `run` е важна: без нея в терминала ти `vitest` остава да наблюдава файловете ти и изпълнява тестовете отново при всяка промяна, което е удобно, докато програмираш, и пречи в проверка, която трябва да завърши. (Изпълнява се само веднъж от само себе си на сървър за непрекъсната интеграция, в неинтерактивен терминал или когато открие, че го изпълнява асистент за програмиране.) С `run` се изпълнява веднъж навсякъде и излиза с код 0, ако всичко е минало, или 1, ако нещо се е провалило.

Както в целия курс, версиите са точни. Измерени са с `npm view` на 21 октомври 2026 г. и са същите като в таблицата „Версии, с които е написан“ в README. Ако някой ден се различават, решаващ е `package.json` на контролната точка.

#### 8.1.2 Конфигурацията живее във `vite.config.ts`

Vitest чете конфигурацията на Vite. Не е нужен отделен файл; достатъчен е раздел `test`:

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

В сравнение с урок 7 се променят две неща. Първото: `defineConfig` се импортира от `vitest/config`, а не от `vite`. Това е същата функция с по-широк тип, който познава раздела `test`; с тази от `vite` TypeScript би отхвърлил този ключ. (Документацията на Vitest показва и другия изход — да се остави импортът от `vite` и да се добави референция към типове с тройна наклонена черта в началото на файла; контролната точка избра импорта, който се чете, без да знаеш какво е тройна наклонена черта.)

Второто: разделът `test`, с две опции.

- **`environment: "jsdom"`.** По подразбиране Vitest изпълнява тестовете в средата `node`, без `document` и без `window` ([Vitest, „Test Environment“](https://vitest.dev/guide/environment.html)). С `jsdom` преди всеки тестов файл създава DOM и слага обектите му в глобалния обхват, сякаш файлът се изпълнява в страница. Затова `jsdom` трябва да е инсталиран: Vitest го използва, но не го носи.
- **`setupFiles`.** Списък с файлове, които Vitest изпълнява преди всеки тестов файл. Тук е само един, `preparar.ts`, и това, което прави, заслужава собствен подраздел.

Това, което не се променя, също е важно: `plugins: [react()]` е същото както винаги, така че тестовете виждат кода, преобразуван по същия начин, по който го вижда сървърът за разработка. А `proxy`-то към API не участва в тестовете: в тях никой не отива в мрежата.

#### 8.1.3 Какво трябва да се почисти след всеки тест

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

Това са три инструкции и всяка има причина.

**`cleanup()`** демонтира всичко, което `render` е нарисувал. Без него вторият тест в един файл би намерил в DOM приложението на първия **и** своето: два бутона „Dar de alta“, две ленти, а заявка като `getByRole("button", { name: "Dar de alta" })` би се провалила с „намерих няколко“. Документацията на React Testing Library казва, че `cleanup` се извиква автоматично само ако тестовата среда задава глобална функция `afterEach`, а ако не, трябва да се извиква след всеки тест ([Testing Library, API за React](https://testing-library.com/docs/react-testing-library/api)). А Vitest по подразбиране **не** излага функциите си като глобални: опцията `globals` е `false` и документацията му предупреждава точно за това — че някои библиотеки, като `@testing-library/react`, разчитат на тези глобални, за да почистват сами ([Vitest, `globals`](https://vitest.dev/config/globals.html)). Курсът оставя `globals` изключено нарочно: всеки тестов файл импортира `test`, `expect` и `vi` изрично и се вижда откъде идва всяко нещо. Цената е този файл.

**`vi.unstubAllGlobals()`** отменя това, което е направил `vi.stubGlobal`. Тестовете сменят глобалния `fetch` с фалшив (8.3.1) и тази промяна не трябва да надживее теста, който я е направил. Според документацията `vi.stubGlobal` променя стойността на глобална променлива, а `vi.unstubAllGlobals` възстановява оригиналните стойности; с jsdom промяната се вижда и в `window` ([Vitest, `vi`](https://vitest.dev/api/vi.html)).

**`IS_REACT_ACT_ENVIRONMENT = true`** включва предупрежденията на React за `act`. React предупреждава за обновяване на състоянието, станало извън `act`, само ако тази глобална променлива е `true`; документацията на React изисква тя да се зададе във файла за подготовка на тестовете. React Testing Library я включва сама, но го прави от глобален `beforeAll`, който при изключено `globals` не съществува: това е същият проблем като при `cleanup`. Без този ред пакетът никога не би отпечатал предупреждение за `act` и „няма нито едно предупреждение“ не би доказвало нищо. `as { IS_REACT_ACT_ENVIRONMENT?: boolean }` е за TypeScript, който не познава това свойство на `globalThis`.

Това, че редът върши работа, беше измерено с отрицателна контрола — еднократен тест, който не е част от контролната точка: компонент променя състоянието си с таймер, а тестът изчаква с друг таймер, а не с `findBy`, така че никой не обвива промяната в `act`. (`screen`, който се появява в теста, търси в целия документ; обяснява се в 8.3.2.)

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

С `preparar.ts` без реда:

```bash
$ npx vitest run --reporter=default src/pruebas/control.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/pruebas/control.test.tsx (1 test) 61ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  03:59:10
   Duration  362ms (environment 66%, tests 20%, setup 10%, transform 3%, import 1%, worker 1%)
```

С реда:

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

Тестът минава и в двата случая, защото текстът наистина стига до „listo“. Това, което се променя, е, че с реда React предупреждава в изхода за грешки (`stderr`), че е имало обновяване без `act`. Това е предупреждението, което пакетът на `revisor` не трябва да има, и няма: с поставения ред 27-те теста минават без нито един `stderr`.

Защо `afterEach`, а не `beforeEach`? Защото почистването накрая оставя DOM празен и след **последния** тест и защото така всеки тест започва с това, което е оставило почистването, а не с това, което е оставил друг тест. Тестовете не зависят от реда си, а това е свойството, което позволява да се изпълни само един файл, както ще направиш в 8.4.

#### 8.1.4 Първият тест няма нужда от React

Преди да се нарисува каквото и да е, най-лесните за тестване части са чистите функции. Урок 1 изнесе броенето на повредите в `resumen.ts` точно за това: еднакви входове, еднакъв изход, без DOM. Неговият тест:

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

Прочети формата, защото тя е формата на целия пакет. `describe` групира тестове под едно име; `test` дефинира един, с име и функция; `expect(valor).toBe(esperado)` сравнява с `Object.is`, което за числа и текстове е обичайното равенство; `toEqual` сравнява **формата** на масиви и обекти, елемент по елемент. Третият тест използва помощна функция, `nombres`, за да казва всеки ред само това, което се променя: със или без „само повреди“, с какъв текст. Последният случай, `nombres(true, "catá")`, проверява, че двата филтъра се комбинират: `catálogo` съвпада с текста, но не е в повреда, и затова списъкът остава празен.

Другите два теста без React следват същата идея. Този на reducer-а на известията от урок 6, който го тества, без да монтира нито един компонент, както вече беше направила фигурата от онзи урок:

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

Вторият тест твърди нещо, което човек никога не би видял на екрана: `expect(estado.avisos).toHaveLength(2)` след отхвърлянето. Той проверява, че reducer-ът **не е мутирал** състоянието, което е получил, а това е правилото за неизменяемост от урок 2. А третият използва константата `MAXIMO_AVISOS`, вместо да пише `5`: ако утре максимумът се промени, тестът продължава да казва истината.

И този на схемата от урок 7, който проверява разликата, обяснена в онзи урок: всички грешки наведнъж, а не само първата.

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

Тези девет теста не струват почти нищо (от 0 до 2 ms всеки) и защитават логиката, която не зависи от React. Но не виждат екрана. Самотната `0` от сцената не живее в `contarFallas`, която правилно връща `0`: тя живее в начина, по който `ResumenFallas` използва тази `0` в JSX. За да я видиш, трябва да се рисува.

### 8.2 Заявки така, както ги прави човек

#### 8.2.1 `getBy`, `queryBy`, `findBy`

Преди да видиш защо е добре да се търси по роля (8.2.2), трябва да знаеш по какви начини може да се пита. Всяка заявка идва в три семейства и разликата не е в стила: всяко твърди нещо различно. Документацията го обобщава така: `getBy` връща елемента и хвърля описателна грешка, ако няма такъв; `queryBy` връща елемента или `null`; `findBy` връща обещание (promise), което се изпълнява, когато елементът се появи. Трите имат своя версия `All` (`getAllBy`, `queryAllBy`, `findAllBy`), която връща масив. А версиите без `All` също се провалят, ако намерят **повече от един**.

Фигура 1 го показва с намалено копие на това, което рисува `/`: празна лента с известия (`role="status"` без съдържание, като този на `revisor`) и съдържанието на отчета, което казва „Cargando…“, а сто милисекунди по-късно показва списъка.

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

Осем резултата и всеки учи на нещо.

**Преди да пристигнат данните, `getByRole("list")` хвърля грешка, а `queryByRole("list")` връща `null`.** Това е един и същ въпрос с два различни отговора за „не е там“. Използвай `getBy`, когато елементът **трябва** да е там: ако липсва, тестът спира на този ред със съобщение, което казва какво си търсил, а под него — DOM-а, който е имало (отпечатва го Testing Library, а не Vitest, съкратен до 7 000 символа, освен ако не смениш `DEBUG_PRINT_LIMIT`; фигурата го съкращава с `primeraLinea`, защото тук пречи). Използвай `queryBy`, когато искаш да твърдиш, че нещо **не** е там: `expect(screen.queryByRole("list")).toBeNull()`. Да напишеш това с `getBy` е невъзможно, защото то би хвърлило грешка, преди да стигне до `expect`. Тестът за празното състояние на `revisor` използва точно този ред.

**`getByRole("status")` хвърля „Found multiple elements with the role "status"“.** На екрана има **два** региона за състояние: лентата с известия, която е винаги там (урок 6), и „Cargando…“. `getBy` изисква един и само един. Този детайл е реален в `revisor` и обяснява един ред от неговия пакет, който иначе би изглеждал странно: тестът за „зареждане“ търси текста с `findByText("Cargando…")` и **след това** проверява, че ролята му е `status`. Така намира елемента без двусмислие и все пак твърди, че той се обявява като регион за състояние. Другият изход би бил филтриране по име, но `status` не взема името си от съдържанието си, така че „Cargando…“ не е неговото име.

**`findByRole("list")` изчаква и намира списъка с два елемента**, а след това `queryByText("Cargando…")` вече е `null`. `findBy` е комбинацията от `getBy` с `waitFor`: повтаря заявката на всеки 50 ms, докато я намери или докато минат 1000 ms, и освен това опитва отново всеки път, когато DOM се промени ([Testing Library, „Async Methods“](https://testing-library.com/docs/dom-testing-library/api-async/)). В `revisor` почти всичко пристига късно: отчетът зависи от `fetch`, известието в лентата зависи от действие, страницата зависи от маршрутизатора. Затова почти всички тестове на компоненти в пакета започват с `await screen.findBy…`: това е начинът да се каже „изчакай екранът да стигне до тази точка“.

**`findByRole("table")` отхвърля с „Unable to find role="table"“** след крайния срок, който фигурата намали на 300 ms, за да не се чака цялата секунда. `findBy`, който никога не намира, не увисва: проваля се със съобщение.

Едно правило, което произтича от това: **не обвивай ръчно `getBy` във `waitFor`**, ако това, което искаш, е да изчакаш елемент; за това съществува `findBy`. И не използвай `findBy` за нещо, което вече е там: работи, но казва на този, който чете теста, че си очаквал нещо, което не си очаквал. Всяко семейство съобщава намерение.

Защо фигурата не предупреди нищо за `act`? Защото се изпълнява с `node`, извън тест, и никой не е включил `IS_REACT_ACT_ENVIRONMENT`: без тази променлива React не предупреждава. В пакета тя е включена (`preparar.ts`, 8.1.3). И там, докато `findBy` изчаква, React Testing Library нарочно я **изключва**, защото изчакването вече е правилният начин да се остави екранът да стигне докъдето отива. Предупреждение, което споменава `act(`, се появява, когато обновяване се случи, без някой да изчаква, например след като тестът е приключил; в 8.4.3 ще видиш едно истинско. Пълният изход на пакета на `revisor` няма нито едно.

#### 8.2.2 По роля и по име

Когато човек използва таблото, не мисли „вторият `<button>` вътре във `<form>`“. Мисли „бутонът Dar de alta“. Този, който използва екранен четец, чува същото: „Dar de alta, бутон“. Тези две думи са **достъпното име** и **ролята**, същите като в урок 7, и са това, което браузърът предава на помощните технологии. Testing Library подрежда заявките си по този принцип. На страницата си за заявките поставя първи тези, които нарича „достъпни за всички“ (`getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`), защото отразяват опита на този, който използва мишката и зрението, а също и на този, който използва помощни технологии; след тях семантичните (`getByAltText`, `getByTitle`) и накрая — тестовите идентификатори (`getByTestId`) ([Testing Library, „About Queries“](https://testing-library.com/docs/queries/about/)). Зад това стои принцип, който самата библиотека формулира така: колкото повече тестовете ти приличат на начина, по който се използва програмата ти, толкова повече увереност могат да ти дадат ([Testing Library, „Guiding Principles“](https://testing-library.com/docs/guiding-principles)).

Практическото следствие е по-силно, отколкото изглежда: **заявка по роля се проваля, ако елементът няма тази роля и това име в дървото на достъпността** или ако е скрит за него. Това не е пълна проверка на достъпността (`<span role="button">` без `tabindex` би минал заявката и пак би останал извън обхвата на клавиатурата), но отхвърля най-честата имитация, която е тази от фигура 2. За да го видиш, фигура 2 рисува два пъти едно и също: известие в лентата с бутона му „Descartar“ и поле „Nombre“. Горе с нативните елементи; долу — имитация, която би изглеждала същата с малко CSS.

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

Прочети изхода по колони. **`getByText("Descartar")` намира двете версии.** Търсенето по текст не знае дали това, което е намерило, е бутон, `<span>` или абзац. Тест, написан така, би минал с имитацията, до която клавиатурата не достига и която екранният четец не обявява като бутон.

**`getByRole("button", { name: "Descartar: Se dio de alta correo" })` намира само нативния.** Ролята `button` я има `<button>`, без някой да пише `role="button"`: това е неявна роля и документацията на `ByRole` го казва със същия пример ([Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole)). Имитацията няма роля на бутон, така че не съществува за заявката, както не съществува и за екранния четец.

**`getByRole("button", { name: "Descartar" })` не намира нито един**, и това изненадва първия път. Нативният бутон **казва** „Descartar“ на екрана, но достъпното му име е „Descartar: Se dio de alta correo“, защото `aria-label` печели пред съдържанието. Точно това искаше лентата от урок 6: с пет известия в списъка пет бутона с име „Descartar“ биха били невъзможни за различаване за този, който ги чува. Тестът го проверява, без да си го поставя за цел: ако някой махне `aria-label`, тестът на формуляра, който търси „Descartar: Se dio de alta correo“, ще стане червен.

**`getByLabelText("Nombre")` и `getByRole("textbox", { name: "Nombre" })` намират нативното поле, но не и имитацията.** Абзацът „Nombre“ над полето изглежда като етикет, но не е свързан с него: това е фигура 4 от урок 7, погледната от тест.

Последната част от изхода е `logRoles`, функция за отстраняване на грешки на Testing Library, която отпечатва неявните роли на едно дърво и името на всеки елемент ([Testing Library, „Debugging“](https://testing-library.com/docs/dom-testing-library/api-debugging)). Когато не знаеш как се казва нещо за заявка, `logRoles(container)` ти го казва. Обърни внимание, че `section` се появява като `region` с името „Nativo“: `<section>` с достъпно име има ролята `region`, което е точно това, което урок 1 обясни за `Tarjeta`, и затова пакетът може да търси `getByRole("region", { name: "Avisos" })`. Два детайла от фигурата: `logRoles` оцветява изхода си за терминала, а редът `process.env.COLORS = "false"` го изключва, за да се чете файлът `.salida.txt` чисто (документацията назовава тази променлива); а абзацът се появява с празно име, защото абзаците не вземат име от съдържанието си.

Това не означава, че се използва само `getByRole`. Пакетът използва `getByLabelText` за полетата на формуляра, което е по-пряко и казва същото (полето има този етикет), и `getByText` или `findByText` за текстове, които не са контроли, като „No hay servicios configurados todavía.“. Това, което **не** използва, е `getByTestId`, нито CSS селектори. Практическото правило: търси първо по роля; ако елементът няма полезна роля (абзац, самостоятелен текст) — по текст; а ако за да намериш нещо, ти трябва тестов идентификатор, запитай се първо дали човек би могъл да го намери.

Има цена, която е добре да знаеш. `ByRole` изчислява дървото на достъпността, а документацията предупреждава, че тези изчисления могат да бъдат скъпи при големи DOM дървета. С `revisor` това не се забелязва (най-бавният тест в пакета отне 629 ms при изпълнението от 8.1, с монтирано цялото приложение), но ако някой твой пакет се влачи, това е заподозрян.

#### 8.2.3 `user-event`: човек, а не събитие

За да тестваш формуляр, трябва да пишеш в него и да го изпратиш. Testing Library има `fireEvent`, който задейства **едно** събитие на DOM: `click`, `input`. Но човек, който кликва, произвежда няколко последователни събития (показалецът слиза, показалецът се вдига, фокусът се сменя, кликването), а човек, който пише, произвежда за всеки клавиш последователност от събития на клавиатурата и на въвеждането. `user-event` симулира цялото взаимодействие. Документацията му го казва така: симулира цели *взаимодействия*, които могат да задействат няколко събития и да правят проверки по пътя; например не позволява кликване върху скрит елемент, нито писане в деактивирано поле, както не би го позволил и браузърът ([Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro)).

Три правила за употреба, и трите видими в `montar.tsx` и в тестовете:

1. **`userEvent.setup()` преди рисуването.** Документацията го препоръчва така и `montarEn` го прави в този ред. Връща обект, `usuario`, с методите `click`, `type`, `tab`, `keyboard`.
2. **Всеки метод се изчаква с `await`.** Те връщат обещания, защото между клавиш и клавиш оставят React и DOM да довършат работата си. `usuario.click(…)` без `await` е тест, който сравнява, преди кликването да се е случило.
3. **Пише се върху това, което човек би докоснал.** `usuario.type(campo, "correo")` пише в полето, което си намерил по етикета му; `usuario.tab()` премества фокуса към следващия фокусируем елемент, като клавиша Tab; `usuario.keyboard(" ")` натиска интервал върху това, което има фокуса. В [документацията за клавиатурата](https://testing-library.com/docs/user-event/keyboard) печатаемите символи се пишат както са, а клавишите с име се слагат във фигурни скоби (`{Shift}`).

Разликата се забелязва в най-финия тест от пакета: „el foco no se pierde al enviar“. Той стига до бутона с Tab от последното поле и изпраща с интервал, което е това, което прави човек с клавиатура. С `fireEvent.click(boton)` би се пропуснала точно важната част: фокусът да е бил на бутона, когато е изпратено.

### 8.3 Цялото приложение, без мрежа и без браузър

#### 8.3.1 Единственото фалшиво нещо е мрежата

За да тестваш екран на `revisor`, трябва да решиш кое е истинско и кое е фалшиво. Възможностите вървят от единия край до другия: да се нарисува само `ContenidoReporte`, като му се подаде ръчно обект, който имитира резултата от `useQuery`; да се замени с `vi.mock` модулът `cargar.ts` с такъв, който връща каквото искаш; или да се нарисува цялото приложение и да се замени само `fetch`.

Контролната точка избра третото, а причината е същото правило от 8.2: да прилича на начина, по който се използва програмата. Ако тестът подаде на `ContenidoReporte` измислен обект, той проверява, че `ContenidoReporte` умее да рисува този обект, но не и че TanStack Query го произвежда така, нито че ключът на заявката е правилният, нито че `cargarReporte` валидира отговора. Ако тестът замени `cargar.ts`, той прескача мрежовата граница, която урок 0 написа и урок 4 свърза. Обратно, `fetch` е **външната** граница на програмата: всичко, което е от тази страна (компонентите, Query, маршрутизаторът, валидирането с `esReportePublico`, reducer-ът на известията), работи наистина, и единственото, което се решава, е какво отговаря „API“. Това е същата граница, която имитира тестовият сървър, но вътре в процеса и за нула милисекунди.

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

Обходи функцията отгоре надолу.

- **Таблицата с пътищата.** `instalarFetchFalso` получава обект, чиито ключове са `"МЕТОД /път"`, като `"GET /api/estados"` или `"POST /api/servicios"`, а стойностите са отговор (`status` и `cuerpo`) или **функция**, която връща обещание за отговор. Функцията служи за това, което не отговаря веднага: отговор, който никога не пристига, или такъв, който тестът предава, когато пожелае.
- **Ключът идва от заявката.** `new URL(String(entrada), "http://localhost")` превръща относителния адрес, който таблото използва (`/api/estados`), в пълен URL, за да може да се прочете неговият `pathname`. `decodeURIComponent` е важен заради `catálogo`: при сглобяването на URL ударението остава кодирано (`/api/servicios/cat%C3%A1logo`), а таблицата се пише с ударението, както би я написал човек. Методът идва от `opciones?.method`, а ако липсва, е `GET`, също като във `fetch`.
- **Това, което не е в таблицата, отговаря с 404.** Това е малко решение с големи последствия. Ако тест забрави да декларира път, таблото получава 404 с `detalle`, който казва `sin ruta falsa para GET /api/…`, и най-вероятно тестът ще се провали, показвайки този текст. Другата възможност — да се хвърли грешка или да се върне `undefined` — би довела до по-объркващи провали или до никакви.
- **Отговорът е истински `Response`.** `new Response(JSON.stringify(…), { status, headers })` е стандартният клас, който използва и браузърът, а Node 24 го има. Така `cargarReporte` чете `respuesta.ok`, `respuesta.status` и `respuesta.json()` както в продукция.
- **`vi.fn` записва всяко извикване.** Фалшивият не е коя да е функция: `vi.fn` го обвива и пази аргументите на всяко извикване в `mock.calls`, което е масив с аргументите на всяко извикване, по един за всеки елемент ([Vitest, `mock`](https://vitest.dev/api/mock.html)). Затова `instalarFetchFalso` връща фалшивия: тестовете могат да питат дали е бил извикан, колко пъти и с какво тяло.
- **`vi.stubGlobal("fetch", falso)`** го инсталира като глобален `fetch`, а `preparar.ts` го маха, когато тестът приключи.

`nuncaResponde` е най-кратката функция в курса: обещание, което никога не се изпълнява. С него API „остава да мисли“ завинаги, а екранът остава в състоянието си на зареждане толкова, колкото е нужно на теста, за да го разгледа.

Примерните данни живеят отделно, за да използват всички тестове едни и същи:

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

Това са четирите услуги, с които стартира тестовото API, със същите състояния, и детайлите на `pagos`. Това, че съвпадат, не е случайност: така тест може да се сравни с това, което виждаш в браузъра с `npm run dev`. И са типизирани като `ReportePublico` и `DetalleServicio`: ако типовете на API се променят (`src/compartido/contrato.ts`), `tsc -b` отбелязва тестовите данни, преди някой тест да мине случайно със стари данни.

#### 8.3.2 Монтиране на приложението на даден адрес

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

`montarEn` е частта, благодарение на която всеки тест на екран се побира в пет реда, и всеки от редовете ѝ има причина.

**Нов `QueryClient` във всеки тест.** Кешът на TanStack Query пази това, което е пристигнало от API. Ако два теста споделяха клиент, вторият би видял отчета на първия, преди да поиска каквото и да е, и състоянието „зареждане“ не би съществувало. Един клиент за тест е празен кеш за тест. И има `retry: false` за заявките и мутациите: в приложението `crearClienteConsultas` иска `retry: 2`, а урок 4 измери трите заявки, които това произвежда при неработещо API. В тест тези повторни опити само забавят грешката с нарастващи изчаквания; с `retry: false` отговор 503 веднага става състояние на грешка.

**`createMemoryRouter(rutas, { initialEntries: [direccion] })`.** Приложението използва `createBrowserRouter`, който пази историята си в адресната лента на прозореца. В jsdom тази лента съществува (API-то `history` работи), но е **една-единствена** за всички тестове във файла: адресът, оставен от един тест, би бил началната точка за следващия. `createMemoryRouter` създава маршрутизатор, който пази историята си в паметта, по един за тест, а документацията му го описва като полезен за среди, които не са браузър ([React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter)). `initialEntries` са началните записи в тази история: тестът казва „започни от `/servicios/nuevo`“ и приложението стартира там. Важното е **кои** маршрути получава: същия масив `rutas`, който използва `main.tsx`. Това е причината урок 5 да го напише като експортиран масив, а не като JSX вътре в `main.tsx`. Тестовете не проверяват копие на маршрутите; проверяват маршрутите.

**`<Proveedores clienteConsultas={…}>`.** Същият компонент, който монтира `main.tsx`, с кеша, предпочитанията и лентата с известия. Урок 6 го изнесе в собствен файл за това, а урок 4 обясни грешката, която дава `useQuery` без своя доставчик: ако тестът монтираше страниците без `Proveedores`, те щяха да се проваляха по грешната причина.

**Какво връща.** `{ enrutador, usuario }`. `usuario` служи за действие; `enrutador` — за да се пита къде е останало приложението (`enrutador.state.location.search`) или за навигиране отвън, както в упражнение 3. Това, което **не** връща, са заявките на `render`: тестовете използват `screen`, който търси в целия `document.body`. Разликата е малко важна тук и донякъде в бъдеще: ако утре компонент рисува нещо с портал извън контейнера си, `screen` продължава да го намира.

Обърни внимание какво `montarEn` **не** монтира: `StrictMode` и `LimiteDeError`, които са в `main.tsx` около всичко. Тестовете монтират това, което е вътре. `StrictMode` е оставен навън нарочно: по време на разработка той монтира, демонтира и отново монтира всеки компонент (урок 3), така че първата заявка на всяка заявка за данни би била отменена и повторена, а броенето на извикванията на `fetch` би станало двусмислено. Ако някой ден искаш това двойно преминаване в тест, React Testing Library го предлага с `configure({ reactStrictMode: true })` или с опцията `reactStrictMode` на `render`. Границата за грешки на маршрутите е там, защото идва вътре в `rutas`, и има свой тест в 8.3.4.

#### 8.3.3 Състоянията на отчета

С `instalarFetchFalso` и `montarEn` състоянията на отчета са седем почти еднакви теста, които се различават само по това, което отговаря API, и по това, което се очаква да се види:

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

Обходи ги подред, защото заедно те са таблицата със състояния, която урок 4 обеща.

**Зареждане.** API никога не отговаря, така че екранът остава в `isPending`. Тестът търси „Cargando…“ по текст и проверява, че неговият `role` е `status`, по причината от фигура 1: има два региона за състояние и само `findByRole("status")` би се провалил. Какво защитава: зареждането да се **обявява**. Ако някой смени `<p role="status">` с обикновен `<p>`, тестът ще стане червен, макар текстът да остава на екрана.

**Грешка.** API отговаря с 503. Тестът търси предупреждението, проверява, че съобщението включва `la API respondió 503` (пише го `cargarReporte`) и че **вътре в предупреждението** има бутон „Reintentar“. `within(alerta)` ограничава заявката до този елемент: бутонът трябва да е до съобщението, а не където и да е в страницата. Благодарение на `retry: false` грешката се появява при първия опит.

**Празно.** API отговаря с `{ "estados": [] }`. Тестът изчаква текста „No hay servicios configurados todavía.“ и твърди с `queryByRole("list")`, че **няма** списък. Този втори `expect` е този, който различава „празно“ от „списък без елементи“: празен `<ul>` не казва нищо на никого.

**С данни.** Четирите услуги. Тестът взема списъка, в него всички връзки, и сравнява текстовете им **подред**. След това търси обобщението с регулярен израз, `/2 servicios con falla/`. Това е нужно, защото текстът на `<strong>` не е „2 servicios con falla“, а „ · 2 servicios con falla“, с разделителя отпред (`ResumenFallas.tsx`, ред 10), а `getByText` с фиксиран текст изисква текстът на елемента да съвпада изцяло. Регулярният израз търси само парчето, което е важно.

**Без повреди не изрисува самотна 0.** Тестът, от който сцената имаше нужда. API отговаря само с двете налични услуги, а тестът сравнява пълния `textContent` на обобщението с `"2 servicios revisados"`, точно, с `toBe`. Ако в този текст се появи каквото и да е друго — `0`, интервал, точка, — сравнението ще се провали. Това е случаят, който тестовото API няма и който никой не би проверил ръчно. В 8.4 ще го видиш да се проваля.

**Филтърът пътува в адреса.** Тук тестът действа: изчаква списъка, кликва полето за отметка „Solo fallas“ (намерено по ролята си, `checkbox`, и името си) и проверява две неща. Че списъкът вече има две връзки и че адресът на маршрутизатора завършва на `?fallas=1`. Второто е обещанието на урок 5: филтърът е състояние на URL, така че ако някой го премести в `useState`, списъкът ще се филтрира по същия начин, първото твърдение ще мине, а второто — не.

**Адрес с вече зададен филтър се отваря филтриран.** Другата половина на същото обещание: монтиране на `/?q=inv` и виждане само на `inventario`. Това е, което се случва, когато някой постави споделена връзка.

Липсват две състояния от таблицата и го казвам, за да не ги търсиш. Това „с данни и грешка“ на **отчета** (обновяването се е провалило, но продължава да се показва последният отчет) няма тест в контролната точка; това на **детайлите** има, и то е третият тест в 8.3.4. Това „стари данни по време на обновяване“, `· actualizando…` до часа, също няма: зависи от втора заявка в ход. Двата теста ги пишеш ти в упражнение 4, а без тях не се изпълнява третата точка от „Как разбираш, че си приключил“ на курса.

#### 8.3.4 Маршрутите, с маршрутизатор в паметта

Два файла тестват навигацията. Този за детайлите:

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

Първият тест монтира директно на `/servicios/pagos` и изчаква състоянието на услугата и заглавието „Servicio pagos“. Проверява наведнъж три неща, които никой не би проверил заедно: че маршрутът `servicios/:nombre` води към `PaginaServicio`, че `useParams` дава `pagos` и че заявката иска `GET /api/servicios/pagos`. Ако маршрутът поиска друг адрес, фалшивият ще отговори с 404 и очакваният текст никога няма да се появи.

Вторият кликва „Volver a revisar“ и изчаква известието в лентата, което е това, което урок 6 свърза с `useReintentar`. Последният му ред проверява дали някое извикване на `fetch` е било `POST`: обхожда `fetchFalso.mock.calls` и пита за метода на всяко.

Третият тест съществува заради дефект, който външен преглед откри и който нито един от другите два не можеше да види. Докато първата заявка за детайлите отговаря успешно, а следващите — с `503` (функция в таблицата на фалшивия води сметката, както в упражнение 4), тестът пише чернова в „Nota sobre pagos“, кликва „Volver a revisar“ и изчаква известието „Mostrando el último detalle que llegó“. Кликването инвалидира детайлите, втората заявка се проваля и състоянието на заявката преминава в `error` с предишните данни все още в кеша. Тестът проверява три неща: известието, състоянието „En falla: HTTP 503“, което остава видимо, и непокътнатата чернова на бележката. Последното е също толкова важно, колкото известието: с предишната версия на страницата, която рисуваше детайлите само ако `consulta.isSuccess`, редакторът на бележката се демонтираше заедно с грешката и черновата се губеше.

Един нов тест няма стойност, докато не бъде видян червен. С предишната страница (условието `consulta.isSuccess` и едно-единствено известие за грешка) пакетът дава `1 failed | 26 passed (27)`, а файлът — следното:

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

С контролната точка същият тест минава и целият пакет дава `27 passed (27)`:

```bash
$ npx vitest run --reporter=default src/detalle/PaginaServicio.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/PaginaServicio.test.tsx (3 tests)

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Пълните изходи са в `programas/08-pruebas-de-componentes/ejercicios/` (`detalle-viejo-con-isSuccess.salida.txt` и `detalle-viejo-punto-de-control.salida.txt`, с `diff` в `detalle-viejo-con-isSuccess.diff.txt`).

И този за маршрутите като цяло:

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

**Непознатият адрес** монтира на `/no-existe` и изчаква заглавието и текста на `PaginaNoEncontrada`, с включения адрес. Проверява, че маршрутът за всичко `*` съществува и е последен.

**Менюто отбелязва текущата страница** монтира на `/servicios/nuevo` и проверява, че връзката „Dar de alta“ има `aria-current="page"`. Този атрибут го слага `NavLink` на активната връзка (урок 5) и именно него екранният четец обявява като „текуща страница“. Тестът не гледа класа `active`, който служи само за оцветяване: гледа атрибута, който стига до помощните технологии.

**Страница, която се чупи при рисуване, показва известието на revisor** е различен от останалите и си струва да се прочете бавно. Не използва `montarEn`, защото има нужда от маршрут, който не съществува в приложението: страница, която хвърля грешка при рисуването си. Сглобява собствен маршрутизатор с **истинския коренов маршрут** на `revisor`, `rutas[0]`, с неговите `Component: Disposicion` и `ErrorBoundary: ErrorDeRuta`, но заменя децата му с едно-единствено, `PaginaRota`. `index: false` е заради TypeScript: в типа `RouteObject` индексен маршрут не може да има деца, а при изричното му записване копието остава от страната на маршрутите, които ги допускат. След това проверява, че се появява предупреждението със заглавието и съобщението на `AvisoDeError` и че **не** се появява „Unexpected Application Error!“, което React Router рисува, когато маршрут няма собствена граница (урок 5).

Първите два реда на този тест заглушават конзолата. Когато компонент хвърли грешка, React и React Router обявяват грешката с `console.error`, дори граница да я улови: това е информация за този, който разработва. Тук тази грешка е **сценарият** на теста, а не проблем, и пускането ѝ би напълнило изхода със stack traces, които изглеждат като провали. `vi.spyOn(console, "error")` обвива метода, а `.mockImplementation(() => undefined)` го оставя без ефект; `onTestFinished(() => consola.mockRestore())` го възстановява накрая. `mockRestore` връща оригиналния метод на обект, шпиониран с `vi.spyOn`, а `onTestFinished` се извиква винаги след като тестът е приключил изпълнението си, след `afterEach` ([Vitest, „Hooks“](https://vitest.dev/api/hooks.html)). Използва се вместо `consola.mockRestore()` в края на тялото по една причина: ако тестът се провали по средата, краят на тялото никога не се изпълнява и конзолата би останала заглушена за следващите тестове. Заглушава само това, което този тест предизвиква, и само докато трае.

#### 8.3.5 Формулярът

Регистрацията от урок 7 има най-дългия пакет, защото е екранът с най-много поведение: валидиране, изпращане, обявяване, незагубване на фокуса, неизпращане два пъти, превеждане на 409.

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

**Без данни отбелязва трите полета и го обявява.** API няма деклариран нито един път (`instalarFetchFalso({})`), така че всяка заявка би отговорила с 404. Тестът кликва „Dar de alta“ с празен формуляр и проверява четири неща: текста на предупреждението, `aria-invalid="true"` в трите полета (намерени по етикета им, в `for`), `aria-describedby` на името с грешката **преди** помощния текст (редът, в който четецът ги чете, урок 7) и че `fetch` никога не е бил извикан. Последното е това, което доказва, че валидирането се случва в браузъра: ако формулярът изпращаше заявката и чакаше API да се оплаче, тестът пак би виждал грешки (фалшивото API би отговорило с 404), но `not.toHaveBeenCalled()` би станал червен.

**С валидни данни изпраща регистрацията и потвърждава.** API отговаря с 201. Тестът пише в трите полета, кликва и изчаква бутона „Descartar: Se dio de alta correo“, който съществува само когато в лентата има известие. След това твърди, че текстът „Se dio de alta correo.“ с точка — този, който би имал формуляр със собствен регион за успех (версията с два `status`, която урок 7 отхвърли в 7.3.3) — **не** е там: успехът се обявява на едно-единствено място. Накрая чете тялото на първото извикване на `fetch`: `fetchFalso.mock.calls[0]` е масивът с аргументи `[entrada, opciones]`, а деструктурирането `const [, opciones]` прескача първия. Тялото е JSON, така че се преобразува с `JSON.parse` и се сравнява с `toEqual`. Обърни внимание на URL: човекът е написал `https://correo.example`, а е пътувало `https://correo.example/`, с крайната наклонена черта, която добавя схемата. Тестът документира тази нормализация.

**Декларира задължителните и лентата обявява само новото известие.** Две от поправките от урок 7 в един тест. `campo.required` е свойството на DOM, което отразява атрибута `required`; `as HTMLInputElement` казва на TypeScript, че намереното по етикет е `<input>`, защото `findByLabelText` обещава само `HTMLElement`. А лентата се намира по ролята си на регион и името си, „Avisos“, и в нея — `status`, за да се прочете неговото `aria-atomic`. Това е тест на атрибути, а не на поведение: jsdom няма екранен четец, така че най-близкото, до което може да стигне, е да провери, че атрибутът, от който четецът има нужда, е поставен.

**Фокусът не се губи при изпращане и второто изпращане се пренебрегва.** Най-внимателният тест в пакета и този, от който сцената имаше нужда за бутона. Минава на части.

1. *Отговорът се предава ръчно.* Пътят `POST /api/servicios` е функция, която връща обещание и пази своето `listo` в променливата `responder`. Докато никой не извика `responder`, регистрацията е в изчакване и тестът може да гледа формуляра в това състояние колкото си иска. Това е контролируемата версия на `nuncaResponde`.
2. *`onTestFinished(() => responder(creado))`.* Ако тестът се провали по средата, регистрацията би останала в изчакване завинаги, а с нея и *Transition* на React, която я обвива (урок 7). Коментарът във файла казва какво би станало: това недовършено действие би объркало действията на следващите тестове. Затова, каквото и да стане, накрая се отговаря на това, което е останало в изчакване.
3. *Стигане до бутона така, както би го направил Раул.* Пише в трите полета и натиска Tab: фокусът минава от последното поле към бутона. Тестът го проверява с `document.activeElement`, елемента, който има фокуса.
4. *Изпращане с интервал.* `usuario.keyboard(" ")` върху фокусирания бутон. Тестът изчаква бутона „Dando de alta…“, който съществува само докато `useFormStatus` казва `pending`.
5. *Проверка на причината, а не на следствието.* Тук е най-важното решение, и коментарът го казва: jsdom не изважда фокуса от деактивиран бутон; Chrome — да. Ако тестът проверяваше само `document.activeElement`, той би минал и с `disabled={pending}`, защото в jsdom фокусът остава там, където е бил, макар в браузъра да отива на `body`. Затова първо се проверява това, което **причинява** запазването на фокуса: бутонът **да няма** атрибута `disabled` и **да има** `aria-disabled="true"`. `activeElement` също се проверява, но то е слабото твърдение; силното е предишното. Раздел 8.5 измерва тази разлика между jsdom и Chrome.
6. *Вторият интервал.* При все още чакаща регистрация — още едно `usuario.keyboard(" ")`. Ако защитата в `BotonEnviar` не отменяше кликването, React би наредил това второ изпращане на опашка.
7. *Отговор и броене.* `responder(creado)` завършва регистрацията. Тестът изчаква известието в лентата, проверява, че фокусът е на бутона, който отново казва „Dar de alta“, и че `fetch` е бил извикан **веднъж**.

**Повторено име се отбелязва в полето си със съобщението на API.** API отговаря с 409 с `campos.nombre`. Тестът изчаква текста на грешката („ese nombre ya existe“, който идва от API, а не от схемата), проверява, че само „Nombre“ остава невалидно, а „Dirección“ остава `false`, и че полето запазва написаното. Последният ред защитава `defaultValue` от състоянието от урок 7: ако `Campo` получаваше фиксирана стойност, React би изпразнил полето след действието и човекът би трябвало да напише всичко отново заради една-единствена грешка.

### 8.4 Тестът, който става червен при връщане на поправката

#### 8.4.1 Експериментът

Зелен тест отговаря на „изпълнява ли кодът това?“. Не отговаря на „би ли забелязал този тест, ако поправката изчезне?“. За втория въпрос има пряк експеримент и той дава името на раздела:

1. Копирай контролната точка (или работи в клон, който ще изхвърлиш).
2. Отмени **само** поправката, която тестът твърди, че защитава, в един-единствен файл.
3. Изпълни само тестовия файл, който я покрива.
4. Разчети червеното: проваля ли се тестът, който очакваше, по причината, която очакваше, със съобщение, което обяснява проблема?
5. Възстанови и изпълни отново.

Ако в стъпка 4 всичко остане зелено, тестът не защитава тази поправка, колкото и добре написан да изглежда. Това не е провал на експеримента: точно това експериментът служи да открие. Направено беше с три поправки от курса, едната отменена по два начина, и четирите връщания станаха червени. Упражнение 2 добавя четвърта поправка. А в упражнение 3 ще напишеш тест, който не минава изпита.

Изпълнението на един-единствен файл е `npx vitest run`, последвано от пътя или от част от него: `npx vitest run src/alta` изпълнява всички тестови файлове, чийто път съдържа `src/alta`. По-бързо е и изходът не се смесва с останалото.

#### 8.4.2 Самотната нула

Поправката от урок 1: в `ResumenFallas.tsx` условието е `{fallas > 0 && …}`. В копието беше сменено с „по-кратката“ версия от сцената:

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

Един червен тест от седем — този, който трябваше. Прочети съобщението отдолу нагоре, както най-добре се чете един провал. Обобщението: `Tests  1 failed | 6 passed (7)`. Името: „sin fallas no pinta un 0 suelto en el resumen“, което вече ти казва какво се е случило. Сравнението: `Expected: "2 servicios revisados"` срещу `Received: "2 servicios revisados0"`. И мястото: ред 48 на тестовия файл, със стрелка под `toBe`.

`0`, залепена в края, е грешката от урок 1, видяна от тест: когато `fallas` е `0`, изразът `0 && <strong>…</strong>` е `0`, а React рисува числата (не рисува `false`, `null`, нито `undefined`, но рисува `0`). Другите шест теста остават зелени и това също е информация: по-специално „с данни“ остава зелен, защото при две повреди `fallas && …` се държи по същия начин като `fallas > 0 && …`. **Само един тест в този файл различава поправката от грешката**, и това е този с данни без повреди. Ако не съществуваше, пакетът би казвал „всичко е наред“ с грешката от сцената вътре.

След възстановяване на файла тестовият файл се връща към `7 passed (7)`, а целият пакет — към 27 от 27.

#### 8.4.3 Бутонът, който отнема фокуса

Поправката от урок 7: `BotonEnviar` носи `aria-disabled={pending}` и отменя кликването, докато е в изчакване, вместо `disabled={pending}`. Има **два** начина да се отмени и тестът трябва да забележи и двата.

Първият е този от сцената: връщане към `disabled`.

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

Проваля се на ред 82, `expect(pendiente.hasAttribute("disabled")).toBe(false)`, с `expected true to be false`: чакащият бутон има атрибута `disabled`. Обърни внимание **къде** се проваля: в проверката на причината, два реда преди тази за фокуса. Ако тестът нямаше този ред, щеше да стигне до `expect(document.activeElement).toBe(pendiente)`, а в jsdom това **би минало**, защото jsdom оставя фокуса на бутона, макар той да е деактивиран (8.5). Тестът би бил зелен с грешката, която урок 7 измери в Chrome. Този ред съществува, защото някой е направил този експеримент.

Обърни внимание и на това, което излиза **преди** червеното: предупреждение в `stderr`, „A suspended resource finished loading inside a test, but the event was not wrapped in act(...)“. Това е случаят, който 8.2.1 предвести — обновяване, когато вече никой не е чакал. Тестът се провали на ред 82, преди да стигне до `responder(creado)`; накрая `onTestFinished` предаде чакащия отговор и действието на формуляра завърши извън какъвто и да е `act`. Съобщението говори за „спрян ресурс“ (suspended resource), защото така React нарича обещанието, което е чакало. С контролната точка тестът стига до `responder(creado)` в тялото си и предупреждението не се появява. Редът с `IS_REACT_ACT_ENVIRONMENT` в `preparar.ts` е този, който прави това предупреждение видимо: без него червеното пак би излязло, но мълчаливо.

Вторият начин да се отмени е по-фин: да се остави `aria-disabled`, което изглежда добре при прегледа на кода, и да се махне защитата, която отменя кликването.

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

Този път се проваля на ред 91 (и отново излиза предупреждението за `act`, два пъти, по същата причина като преди), `findByRole("button", { name: "Descartar: Se dio de alta correo" })`, с „Unable to find role="button"“. Истинският изход отпечатва целия DOM на страницата, над сто реда; отгоре са оставени началото и краят, а съкращението е отбелязано. Краят е важният: след `responder(creado)` и цяла секунда изчакване бутонът **продължава** да казва „Dando de alta…“ с `aria-disabled="true"`, а „Altas de esta sesión“ продължава да показва `correo (agregando…)`. Вторият интервал не беше пренебрегнат: той нареди второ изпращане на опашката. Това второ изпращане извика отново `fetch`, който запази нов `responder`, който никой не извика, и формулярът остана в изчакване. Това се вижда в DOM; това, което се извежда, а урок 7 обясни, е, че React групира текущите действия и известието от първото не се потвърждава на екрана, докато второто не приключи. Това е същата причина, поради която тестът брои извикванията на `fetch` **накрая**: второ изпращане на опашката не се вижда, докато първото е в изчакване.

В урок 7 същата грешка беше измерена в Chrome, с лога на API: `201`, последвано от `409`. Тук същият тест я открива за по-малко от две секунди, без API и без браузър.

Двата варианта дават `Tests  1 failed | 4 passed (5)` в `src/alta`. След възстановяване — `5 passed (5)`.

#### 8.4.4 Границата за грешки на маршрутите

Поправката от урок 5: `ErrorBoundary: ErrorDeRuta` в кореновия маршрут. В копието този ред беше изтрит от `rutas.tsx`:

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

„Unable to find role="alert"“, а под него — DOM-ът, който е имало: границата по подразбиране на React Router, с „Unexpected Application Error!“, съобщението, stack trace-а (съкратен отгоре) и абзаца, който ти предлага да сложиш собствен `ErrorBoundary` или `errorElement` в маршрута. Този абзац съществува само във версията за разработка на React Router: Vitest не работи в продукционен режим (`NODE_ENV` е `test`), така че Vite зарежда тази версия, както зарежда и тази на React (обърни внимание на `react-dom-client.development.js` в stack trace-а). Това е екранът, който урок 5 показа в Chrome, сега като текст в изхода на тест. Истинският изход отпечатва този DOM два пъти; второто копие беше махнато. `Tests  1 failed | 2 passed (3)`.

Трите теста минаха изпита, четири пъти. Това, което имат общо, струва повече от всеки поотделно: **всеки твърди точно това, което поправката е променила**. Обобщението се сравнява изцяло, а не с `toContain`. Бутонът се проверява по атрибута си, а не само по фокуса. Предупреждението се търси по ролята си и освен това се проверява, че текстът на чуждата граница не се появява. Когато тест твърди нещо по-слабо от поправката, грешката минава през дупката.

### 8.5 Какво не може да провери jsdom

#### 8.5.1 DOM, който не рисува

jsdom имплементира DOM, събитията, формулярите и четенето на файловете със стилове (знае кое правило се прилага към всеки елемент, както показва ред 4 от фигурата). Това, което не прави, е да **рисува**. Неговият README поставя две неща извън обхвата си: навигацията (смяна на страницата при следване на връзка или при присвояване на `location.href`) и оформлението (layout), което определя като способността да се изчисли къде ще застанат елементите в резултат на CSS. За оформлението има запълващи стойности и много свойства връщат нули ([jsdom, README](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)).

Това има неочевидно следствие: има поведения на браузъра, които зависят от рисуването, макар да не изглеждат свързани с рисуване. Фокусът е едно от тях. Фигура 3 задава четири въпроса на jsdom, без React, а HTML страница близнак задава същите четири на Chrome:

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

А страницата близнак, `fig08_03.html` (до фигурата е, със същия HTML и същите стъпки, написани на браузърен JavaScript), отворена в Chrome без графичен интерфейс:

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

(Показано е съдържанието на `<pre id="salida">`, където страницата записва резултатите си; `--dump-dom` отпечатва цялата страница. В Chromium изпълнимият файл се казва `chromium`; на macOS, където беше измерен този изход, пътят е `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. `--virtual-time-budget` оставя таймерите и кадрите на анимацията да се изпълнят, преди да се отпечата. А `--user-data-dir` използва нов профил на Chrome в папката `perfil/`, за да не се пипа твоят: изтрий я накрая и не я качвай в хранилището.)

Сравни ред по ред.

**1. Фокусът в бутон, който се деактивира.** Веднага след `disabled = true` **и двата** казват, че фокусът остава на `#enviar`. Два кадъра на анимацията по-късно Chrome казва `body`, а jsdom продължава да казва `#enviar`. Спецификацията на HTML обяснява разликата. В стъпките за „обновяване на изобразяването“ (*update the rendering*), които браузърът изпълнява, когато се кани да нарисува кадър, има една, която казва: ако фокусираната област на документа вече не е фокусируема област, се изпълняват стъпките за фокусиране върху *viewport*-а на документа (на практика фокусът пада върху `body`, което е това, което Chrome съобщава). И дава за пример точно това: на контрола да се сложи `disabled` ([WHATWG, HTML, „Update the rendering“](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering)). Спецификацията го нарича **асинхронна** корекция: тя не се случва при поставянето на атрибута, а при следващото рисуване. jsdom не рисува, така че тази корекция никога не идва, дори с `pretendToBeVisual` да му е дадено `requestAnimationFrame`. Това е измерването от урок 7 (в Chrome, докато регистрацията беше в изчакване, фокусът вече беше на `body`), обяснено чрез спецификацията и видяно в jsdom. И това е причината за ред 82 в теста на формуляра.

Обърни внимание на един детайл в първия ред на Chrome: дори в истински браузър **незабавна** проверка би казала „фокусът остава на бутона“. Тест, който гледа фокуса веднага след деактивирането на бутона, би грешал и от двете страни.

**2. Фокусът в елемент с `display: none`.** Тук jsdom е прав: и двата отхвърлят `focus()` и фокусът остава там, където е бил. jsdom наистина прилага файла със стилове, за да знае, че елементът не се показва. Добре е да се знае, за да не се обвинява jsdom за това, което той прави.

**3. Оформлението.** Chrome измерва бутона: 81.21875 на 21 пиксела, в позиция (8, 8), която е отстъпът по подразбиране на `body`. jsdom казва `0 × 0 en (0, 0)` и `offsetWidth: 0`. Никой тест, който зависи от размери или позиции (дали нещо се побира, дали е излязло от екрана, дали два елемента се застъпват), не може да се направи в jsdom. Той не се проваля: спокойно връща нули, което е по-лошо.

**4. Файлът със стилове.** И двата изчисляват `opacity: 0.6` и `cursor: not-allowed` за бутона с `aria-disabled="true"`, от правилото във файла със стилове. jsdom разрешава каскадата на CSS за `getComputedStyle`. Това, което не може да ти каже, е дали това сиво се **вижда** или дали отговаря на контраста, който MDN изисква за деактивиран контрол (урок 7): това е оформление и възприятие.

#### 8.5.2 Какво да се прави с това, което jsdom не вижда

Фигурата оставя три правила за писане на тестове и списък с това, което остава за ръчна проверка.

**Когато следствието не се вижда, провери причината.** Фокусът, който се губи, е следствие от рисуването. Причината му е атрибут, `disabled`, който jsdom вижда. Тестът на формуляра проверява причината (без `disabled`, с `aria-disabled="true"`) и оставя проверката на следствието като второстепенно твърдение. Това работи, защото връзката между причината и следствието е измерена в браузър (урок 7) и подкрепена от спецификацията (8.5.1). Без това измерване проверката на причината би била предположение.

**Не пиши тест, който минава по грешната причина.** Тест в jsdom, който твърди „фокусът не се губи“, като гледа само `document.activeElement`, би бил зелен и с добрия код, и с лошия. Това е тестът, който не минава изпита от 8.4, и най-лошият вид тест: този, който дава увереност, без да я дава.

**Назови дупката.** Коментарът на ред 80 в тестовия файл казва с едно изречение какво не може да види jsdom и какво се проверява вместо това. Който прочете теста след шест месеца, няма да го „опрости“, като махне реда с атрибута.

А ето какво този пакет **не** проверява, макар да е зелен:

- **Истинското обхождане с клавиатурата**: Tab да минава през елементите подред, контурът на `:focus-visible` да се вижда, фокусът да не се губи в браузър. Тестът на формуляра покрива един отрязък (от последното поле до бутона и бутона по време на изпращането), с уговорката от 8.5.1.
- **Какво звучи в екранния четец.** Пакетът проверява, че ролите, имената, `aria-invalid`, `aria-describedby`, `aria-atomic` и `required` са поставени. Дали NVDA, Orca или VoiceOver ги обявяват както се очаква, е друг въпрос, и на него се отговаря чрез слушане.
- **Оформлението**: нищо да не се застъпва, приглушеният бутон да се различава, компактното табло да се побира на тесен екран.
- **Истинската мрежа и сървърът**: *proxy*-то на Vite, тестовото API, пренаписването към `index.html` от урок 9. Фалшивият `fetch` отговаря това, което тестът казва; ако истинското API промени формата на отговорите си, `tsc -b` би го забелязал чрез споделените типове, но нито един от тези тестове.

За тези неща съществуват тестовете от край до край, които управляват истински браузър. Този курс не ги преподава; това, което прави, е да ги остави написани като ръчни стъпки в „Как разбирам, че съм успял“. Редът по цена е ясен: тест в jsdom отнема милисекунди и се изпълнява при всяка промяна; тест в браузър отнема секунди и изисква инсталиран браузър; преглед с екранен четец отнема минути и изисква човек. Трите се допълват и нито един не замества другия.

## Грешката, която ще видиш

Урокът има една основна грешка и две помощни.

**Основната грешка: „Found multiple elements with the role "status"“.** Ако напишеш теста за „зареждане“ по естествения начин, `await screen.findByRole("status")`, той се проваля. Фигура 1 го показа с `getByRole`: на екрана има два региона за състояние — лентата с известия и зареждането. `findByRole` е `getByRole` с изчакване, така че и той изисква един-единствен. Пълното съобщение в тест на Vitest отпечатва освен това DOM-а с двата елемента и там се вижда кой кой е. Поправя се по два начина: търсене по текста и после проверка на ролята, както прави пакетът; или ограничаване на търсенето с `within` до частта от страницата, където е зареждането. Това, което **не** поправя нищо, е `getAllByRole("status")[1]`: зависи от реда в DOM и в деня, в който лентата смени мястото си, тестът ще гледа грешния елемент, без да предупреди.

**Помощната: „Unable to find role="…"“ с DOM от сто реда.** Видя го в 8.4.3 и 8.4.4. Плаши с размера си, но е най-добрата помощ, която ти дава Testing Library: когато заявка `get` или `find` се провали, тя отпечатва състоянието на DOM ([Testing Library, „Debugging“](https://testing-library.com/docs/dom-testing-library/api-debugging)). Разчитай го, като търсиш това, което си очаквал да намериш. Почти винаги е там с друго име (различен `aria-label`), друга роля (`<div>` с `onClick`) или още не е пристигнало (`getBy` там, където трябваше `findBy`). Ако DOM-ът е твърде дълъг, документацията обяснява, че се съкращава до 7000 символа и че променливата `DEBUG_PRINT_LIMIT` променя тази граница.

**Мълчаливата: тестът, който почиства наполовина.** Ако махнеш `cleanup()` от `preparar.ts`, тестовете, които монтират приложението, започват да се провалят с „Found multiple elements…“ на места, които нямат нищо общо помежду си, защото всеки тест намира в DOM това, което е оставил предишният. Ако махнеш `vi.unstubAllGlobals()`, фалшивият `fetch` на един тест остава за следващите в същия файл и един тест може да мине с пътищата, декларирани от друг. Второто е наистина мълчаливото: не се проваля, просто престава да тества това, което казва.

**Мълчаливата грешка на инструмента: репортерът, който скрива конзолата.** Ако изпълняваш Vitest от автоматизиран инструмент (асистент за програмиране, скрипт, който се идентифицира като агент), Vitest може да избере друг репортер, без да ти каже. Документацията му го обяснява: когато няма конфигурирани репортери и открие, че работи в агент за програмиране, използва минималния репортер, който показва само провалените тестове, и потиска конзолата на минаващите и обобщението по файлове ([Vitest, „Reporters“](https://vitest.dev/guide/reporters.html)). С този репортер предупреждение за `act` в зелен тест не се вижда. В твоя терминал това не се случва, но ако някога инструмент ти каже „без предупреждения“, поискай `--reporter=default`.

## Какво се прави погрешно

**Да търсиш по CSS класове или по структурата на DOM.** `container.querySelector(".resumen strong")` минава, дори обобщението да престане да е четимо за екранен четец, и се чупи, когато някой смени име на клас, без да промени нищо, което човек вижда. Търси по роля, етикет или текст.

**`getByTestId` като първи избор.** `data-testid` е атрибут, който съществува само за теста: намира елемента, дори той да няма роля и име. Testing Library го поставя в края на списъка си по тази причина.

**Да тестваш имплементацията.** Да четеш състоянието на компонент, да броиш колко пъти е нарисуван или да проверяваш, че е извикан `establecerAltas`. Такива тестове се чупят при всяко преструктуриране, което не променя нищо за човека, и остават зелени при грешки, които му променят нещо. Тествай това, което се вижда, чува или изпраща.

**Да симулираш модули на приложението с `vi.mock`.** Замяната на `cargar.ts` или `useReintentar.ts` оставя навън точно частта, която обикновено се чупи: валидирането, ключа на заявката, инвалидирането. Симулирай външната граница, `fetch`, и остави останалото да работи.

**Да споделяш `QueryClient` между тестовете.** Кешът на един тест се появява в следващия: зареждането не се вижда и един тест минава с данните на друг.

**Включени повторни опити в тестовете.** С `retry: 2` всеки тест за грешка изчаква повторните опити, преди да покаже грешката, и един тест за грешка може да надхвърли едносекундната граница на `findBy`.

**`fireEvent` за това, което прави човек.** Едно-единствено събитие не мести фокуса, нито зачита деактивирано поле. Използвай `user-event` и изчаквай всяко действие с `await`.

**Да забравиш `await`.** `usuario.click(boton)` без `await` сравнява, преди кликването да се е случило. Тестът може да мине случайно и да се провали в деня, в който машината е натоварена.

**`expect`, който не може да се провали.** `expect(screen.getByText("Dar de alta")).toBeDefined()` никога не се проваля в своя `expect`: ако текстът го няма, `getByText` вече е хвърлил грешка, а ако го има, той е дефиниран. Пакетът използва тази форма няколко пъти, съзнателно: това, което се твърди, е `getBy` или `findBy`, а `expect` само кара реда да се чете като твърдение. Грешното е да вярваш, че `toBeDefined()` проверява нещо повече.

**Да приемеш тест за добър, защото е зелен.** Ако не си го видял червен с отменена поправка, не знаеш дали защитава нещо. Упражнение 3 има един, който не защитава.

**Тест, който минава в jsdom по грешната причина.** Да твърдиш фокуса в jsdom след деактивиране на бутон, да измерваш размери, да очакваш `<a href>` без маршрутизатор да зареди друга страница. Ако jsdom не изчислява следствието, провери причината и назови дупката.

**Да заглушиш конзолата за целия пакет.** Заглушен `console.error` в `preparar.ts` скрива предупрежденията на React, които издават истински грешки (повтаряща се `key`, обновяване извън `act`). Заглушавай само това, което един тест предизвиква нарочно, само по време на този тест, и възстановявай с `onTestFinished`.

## Упражнения

### Упражнение 1 — Избери заявката

Без да изпълняваш нищо, запиши в дневника си коя заявка би използвал (семейство `getBy`, `queryBy` или `findBy` и вид `ByRole`, `ByLabelText` или `ByText`) за всяко твърдение и защо:

1. Когато приключи зареждането, отчетът показва списък.
2. При празно API **няма** списък.
3. Полето „Dirección“ е останало отбелязано като невалидно след празно изпращане (формулярът вече е нарисуван).
4. Появява се бутонът за отхвърляне на известието за регистрацията на `correo`.
5. Зареждането се обявява като регион за състояние.

След това потърси всеки случай в пакета на контролната точка и сравни.

### Упражнение 2 — Задължителният атрибут, който изчезва

В копие на контролната точка махни атрибута `required` от `src/alta/Campo.tsx`. **Преди** да изпълниш каквото и да е, предвиди: колко теста стават червени, кои, на кой ред и с какво съобщение? Изпълни `npx vitest run src/alta` и сравни. Възстанови, когато приключиш. И още един въпрос: какво би се променило за човек в браузъра, ако този атрибут липсваше? (Подсказка: урок 7, дърво на достъпността.)

### Упражнение 3 — Тестът, който не минава изпита

Урок 2 поправи грешка с `key`: черновата на бележка не трябва да се пренася от една услуга в друга. Днес тя живее в `PaginaServicio.tsx`, в `<EditorNota key={nombre} …>`, а контролната точка **няма** тест за нея. Напиши го в нов файл, `src/detalle/EditorNota.test.tsx`: монтирай на `/servicios/pagos`, напиши чернова в полето „Nota sobre pagos“, без да я записваш, навигирай към `/servicios/reportes` с `await act(() => enrutador.navigate("/servicios/reportes"))` (импортирай `act` от `@testing-library/react`) и провери, че полето „Nota sobre reportes“ е празно. Декларирай във фалшивия `fetch` двата пътя за детайли.

Когато стане зелен, направи изпита от 8.4: махни `key={nombre}` в копие и го изпълни отново. **Става ли червен?** Ако не, обясни защо и го поправи, докато стане. Подсказка: погледни какво рисува `PaginaServicio`, докато заявката за новата услуга е в изчакване.

### Упражнение 4 — Старите данни

Контролната точка не тества петото състояние на отчета: обновяването се проваля, но продължава да се показва последният пристигнал отчет, с известие. Напиши този тест в `src/reporte/DatosViejos.test.tsx`. Трябва първата заявка към `/api/estados` да отговори успешно, а следващите — с 503 (функция в таблицата на фалшивия може да води сметката), и начин да предизвикаш втората заявка, без да чакаш десетте секунди на периодичното запитване (потърси бутон в `PaginaReporte.tsx`). Провери точния текст на известието и че списъкът остава с четирите си връзки. След това направи изпита: в копие смени в `ContenidoReporte.tsx` условието `consulta.isError && consulta.data === undefined` с `consulta.isError` и провери, че тестът ти става червен.

Втора част, състоянието „обновяване“: в същия файл напиши още един тест, в който първата заявка отговаря успешно, а втората **никога не отговаря** (вече имаш `nuncaResponde`). След натискане на „Actualizar“ провери, че се появява `· actualizando…` до часа, че списъкът остава с четирите си връзки и че **не** се появява „Cargando…“. Изпитът за него: в копие смени в `ContenidoReporte.tsx` `if (consulta.isPending)` с `if (consulta.isFetching)`. Коя разлика от урок 4 защитава този тест?

## Решения

### Решение 1

1. `findByRole("list")`: списъкът **ще пристигне** след `fetch` и е елемент с роля. Това е първият ред на „с данни“.
2. `queryByRole("list")` в `expect(…).toBeNull()`: твърди се **отсъствие**, а `getBy` би хвърлил грешка преди `expect`. Но преди това е нужен `findBy…` за нещо, което наистина се появява („No hay servicios configurados todavía.“): иначе тестът би твърдял отсъствието, докато страницата още се зарежда, и би минал по грешната причина. Така го прави „празно“.
3. `getByLabelText("Dirección")` и после неговото `aria-invalid`: формулярът вече е нарисуван и полето **трябва** да е там; `getBy`. В пакета тестът първо изчаква предупреждението с `findByRole("alert")`, което е сигналът, че изпращането е приключило, и после използва `getByLabelText` за трите полета. `getByRole("textbox", { name: "Dirección" })` също би работил.
4. `findByRole("button", { name: "Descartar: Se dio de alta correo" })`: пристига след действието, а достъпното име е това от `aria-label`, а не видимият текст „Descartar“ (фигура 2).
5. `findByText("Cargando…")` и после проверка на `role="status"`: `findByRole("status")` се проваля, защото има два региона за състояние (фигура 1 и „Грешката, която ще видиш“).

Ако в някой случай си избрал друго семейство, запитай се какво би твърдяла твоята версия, което версията на пакета не твърди, или обратно. Двете неща, които най-често се бъркат, са „изчакай“ срещу „вече е тук“ и „трябва да е тук“ срещу „не трябва да е тук“.

### Решение 2

Става червен **един** тест, „declara los obligatorios y la bandeja anuncia solo el aviso nuevo“, на ред 52, с `expected false to be true`:

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

Тестът спира на първото поле, „Nombre“, защото `expect` в итерацията на `for` хвърля грешка при провал; затова не виждаш другите две. Останалите тестове във файла остават зелени: формулярът има `noValidate`, така че браузърът никога не е използвал `required`, за да предотврати изпращането, а валидирането го прави схемата. Това, което се променя за човека, е това, което урок 7 измери в дървото на достъпността: без `required` трите полета преминават от `required=true` към `required=false` и екранният четец престава да обявява „задължително“, когато стигне до всяко от тях. Визуално нищо не се променя. Това е перфектният пример за поправка, която само тест (или екранен четец) може да забележи.

### Решение 3

Тестът така, както го иска условието:

```tsx
// fragmento: src/detalle/EditorNota.test.tsx, versión ingenua
const { enrutador, usuario } = montarEn("/servicios/pagos");
await usuario.type(await screen.findByRole("textbox", { name: "Nota sobre pagos" }), "revisar el lunes");

await act(() => enrutador.navigate("/servicios/reportes"));
const editor = (await screen.findByRole("textbox", { name: "Nota sobre reportes" })) as HTMLTextAreaElement;
expect(editor.value).toBe("");
```

Зелен е. И в копие **без** `key={nombre}` остава зелен (за да се изпълнят двете версии една до друга, наивната беше запазена като `EditorNotaIngenua.test.tsx`):

```bash
$ npx vitest run src/detalle/EditorNotaIngenua.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNotaIngenua.test.tsx (1 test) 116ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:37
   Duration  478ms (environment 49%, tests 27%, import 9%, setup 8%, transform 6%)
```

Не минава изпита. Причината е в `PaginaServicio`: `EditorNota` се рисува само когато заявката вече има данни (`consulta.data !== undefined`). При навигиране към `reportes` заявката за тази услуга все още няма данни, така че страницата показва „Cargando detalle…“ и **демонтира** редактора. Когато данните пристигнат, монтира нов, с ново състояние. Черновата се губи по тази причина, със или без `key`. Тестът проверява нещо вярно, но не това, което `key` поправя.

Случаят, който `key` поправя, е когато страницата **не** минава през „зареждане“: когато целевата услуга вече е в кеша. Тогава данните са налице от първото рисуване, `EditorNota` остава на същото място в дървото и без `key` React го преизползва със състоянието му. Добрият тест първо посещава `reportes`, за да остане детайлът му в кеша:

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

Фалшивият `fetch` декларира двата пътя; за `reportes` е достатъчно да се копира `detallePagos`, като се смени името:

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

С контролната точка — зелен:

```bash
$ npx vitest run src/detalle/EditorNota.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/detalle/EditorNota.test.tsx (1 test) 120ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:34
   Duration  522ms (environment 49%, tests 26%, import 10%, transform 8%, setup 7%)
```

А без `key={nombre}` — червен, с черновата на `pagos` в редактора на `reportes`:

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

`act` е нужен тук, защото `enrutador.navigate` променя състоянието на приложението извън взаимодействие на Testing Library, а обвиването му в `act` кара React да приложи всички промени преди следващия ред. Версията, която минава изпита, и тестът от упражнение 4 минаха `npx eslint` и `tsc` без предупреждения. Това, което отнасяш, е идеята повече от теста: **един тест може да проверява нещо вярно по причина, различна от тази, която мислиш**, а единственият начин да го разбереш е експериментът.

### Решение 4

Един начин да се напише:

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

(Импортирай `screen` и `within` от `@testing-library/react`, `expect` и `test` от `vitest`, `reporteDeEjemplo` от `../pruebas/datos`, `instalarFetchFalso` и типа `RespuestaFalsa` от `../pruebas/fetchFalso` и `montarEn` от `../pruebas/montar`.)

Масивът `respuestas` е сметката: `shift()` изважда първия отговор първия път и връща `undefined` след това, а `??` превръща това `undefined` в 503. Бутонът „Actualizar“ на `PaginaReporte` извиква `consulta.refetch()`, което предизвиква втората заявка, без да се чака периодичното запитване. С контролната точка:

```bash
$ npx vitest run src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (1 test) 137ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  04:05:35
   Duration  649ms (environment 42%, tests 24%, transform 14%, import 12%, setup 7%, worker 1%)
```

Със сменено условие на `consulta.isError`:

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

`Received` разказва историята: без `consulta.data === undefined` всяка грешка праща към екрана за грешка и човекът губи списъка, който вече е имал, заради едно неуспешно обновяване; залепеното в края `Reintentar` е текстът на бутона, който `textContent` слива с този на абзаца. Второто твърдение на теста (списъкът с четири връзки) не успя да се изпълни, защото първото вече се провали; ако искаш да видиш и двете, смени реда им. Ако тестът ти е използвал друг път за втората заявка (например инвалидиране на заявката), това също важи, стига да минава изпита.

Втората част, в същия файл (добави `nuncaResponde` към импорта от `../pruebas/fetchFalso`):

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

Часът не се сравнява точно, защото се променя при всяко изпълнение: регулярният израз изисква абзацът да започва с „Actualizado a las“, да има нещо по средата и да завършва на `· actualizando…`. С контролната точка двата теста във файла са зелени:

```bash
$ npx vitest run --reporter=default src/reporte/DatosViejos.test.tsx
 RUN  v5.0.5 ~/curso-react/revisor

 ✓ src/reporte/DatosViejos.test.tsx (2 tests) 143ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  04:06:36
   Duration  784ms (environment 49%, tests 20%, import 11%, setup 10%, transform 10%)
```

С `consulta.isFetching` вместо `consulta.isPending`:

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

В съкратения DOM се вижда проблемът: докато пристига новият отчет, екранът казва „Cargando…“ там, където беше списъкът, макар кешът да има предишния отчет. Това е разликата от урок 4 между `status` („има ли данни?“) и `fetchStatus` („има ли заявка в ход?“): `isPending` е „още няма данни“, `isFetching` е „иска се нещо“, а бъркането им изтрива списъка при всяко периодично запитване, на всеки десет секунди. Първият тест във файла остава зелен с тази промяна: всеки защитава различна поправка. Двата минаха `npx eslint` и `tsc`.

## Как разбирам, че съм успял

- [ ] `npm ci`, `npm run lint` и `npm run build` завършват успешно в `~/curso-react/revisor/`, а `npm run build` оставя `dist/assets/index-C_lOH5GL.js`, **същото име като в урок 7**: тестовете не промениха приложението.
- [ ] `npm test` завършва с `Test Files  7 passed (7)` и `Tests  27 passed (27)`, прочетени от обобщението, а не от изходния код. С `npx vitest run --reporter=verbose` виждаш 27-те реда с `✓` и имената им.
- [ ] С `npx vitest run --reporter=default` изходът на пакета няма нито един `stderr`, нито предупреждение, което споменава `act(`. И провери, че това означава нещо: без реда с `IS_REACT_ACT_ENVIRONMENT` в `preparar.ts` контролният тест от 8.1.3 не предупреждава; с него — да.
- [ ] Направи изпита от 8.4 с поне две поправки, в копие: `fallas > 0` в `ResumenFallas.tsx` и защитата `onClick={alPulsar}` в `BotonEnviar.tsx`. Всяка остави червен теста, посочен в урока, със съобщението, посочено там; след възстановяване всичко отново стана зелено.
- [ ] Фигури 1, 2 и 3 дават на твоята машина същия изход като в урока, а страницата `fig08_03.html` в твоя Chrome казва `body` на реда „два кадъра по-късно“.
- [ ] Написа теста от упражнение 3, който **наистина** става червен без `key={nombre}`, и видя зелен онзи, който не става.
- [ ] Написа двата теста от упражнение 4 (стари данни с грешка и „actualizando…“), видя ги зелени с контролната точка и всеки червен със своята промяна (`consulta.isError` и `isFetching`). С тях всички състояния на отчета имат свой тест.
- [ ] **Ръчно, с клавиатурата, в Chrome**, с `npm run servidor` и `npm run dev`: на `/servicios/nuevo` попълни формуляра, стигни до бутона с Tab и изпрати с интервал. Синият контур остава на бутона, докато той казва „Dando de alta…“, и след това. Това е частта от теста за фокуса, която jsdom не може да види (8.5); в урок 7 имаш пълните стъпки.
- [ ] **Ръчно, с екранен четец** (Orca в твоя Mint, NVDA под Windows или VoiceOver под macOS): повтори проверките от урок 7 и запиши в своя [дневник](bitacora.md) кои атрибути проверява пакетът и кои провери само чрез слушане.

## Обобщение

Отговори, без да гледаш урока:

1. Какво прави всяка от петте нови зависимости и защо `jsdom` трябва да е инсталиран, щом Vitest е този, който го използва?
2. Защо `preparar.ts` извиква `cleanup` ръчно? Какво би станало без него и какво би станало без `vi.unstubAllGlobals`?
3. Защо заявка по роля и име казва нещо за достъпността, което заявка по текст не казва? Защо `getByRole("button", { name: "Descartar" })` не намира бутона в лентата?
4. Какво твърди всяко семейство — `getBy`, `queryBy` и `findBy`? Защо тестът за „зареждане“ търси по текст и после проверява ролята?
5. Какво прави `user-event`, което `fireEvent` не прави, и защо всяко действие носи `await`?
6. Защо контролната точка симулира `fetch`, а не модулите на приложението? Какво отговаря фалшивият на път, който не е деклариран, и защо?
7. Кои три неща монтира `montarEn` и защо всеки тест има нужда от нов `QueryClient` без повторни опити?
8. Кои са петте стъпки на изпита от 8.4? Какво ти казва тест, който остава зелен с отменена поправка?
9. Защо тестът за фокуса проверява, че бутонът няма `disabled`, щом важното е фокусът? Какво казва спецификацията на HTML за това кога се губи фокусът на деактивиран контрол?
10. Назови три неща, които пакетът не проверява, макар да е зелен, и как се проверява всяко от тях.

## За допълнително четене

- [Testing Library, „About Queries“](https://testing-library.com/docs/queries/about/): трите семейства (`getBy`, `queryBy`, `findBy`) с версиите им `All`, приоритетът на заявките и крайният срок на `findBy`. Посетено на 21 октомври 2026 г.
- [Testing Library, `ByRole`](https://testing-library.com/docs/queries/byrole): опцията `name`, неявните роли, опцията `hidden` и цената на изчисляването на дървото на достъпността. Посетено на 21 октомври 2026 г.
- [Testing Library, „Guiding Principles“](https://testing-library.com/docs/guiding-principles): колкото повече тестовете приличат на реалната употреба, толкова повече увереност дават. Посетено на 21 октомври 2026 г.
- [Testing Library, „Async Methods“](https://testing-library.com/docs/dom-testing-library/api-async/): `findBy` като `getBy` плюс `waitFor`, интервалът от 50 ms и крайният срок от 1000 ms. Посетено на 21 октомври 2026 г.
- [Testing Library, „Debugging“](https://testing-library.com/docs/dom-testing-library/api-debugging): `logRoles`, `prettyDOM`, отпечатаният DOM при провали, `DEBUG_PRINT_LIMIT` и `COLORS`. Посетено на 21 октомври 2026 г.
- [Testing Library, API на React Testing Library](https://testing-library.com/docs/react-testing-library/api): `render`, какво връща и кога `cleanup` е автоматичен и кога не. Посетено на 21 октомври 2026 г.
- [Testing Library, `user-event`](https://testing-library.com/docs/user-event/intro) и [неговата клавиатура](https://testing-library.com/docs/user-event/keyboard): цели взаимодействия срещу отделни събития, `setup()` преди рисуването и как се пишат клавишите. Посетено на 21 октомври 2026 г.
- [Vitest, „Test Environment“](https://vitest.dev/guide/environment.html): средата `node` по подразбиране и средата `jsdom`. Посетено на 21 октомври 2026 г.
- [Vitest, `globals`](https://vitest.dev/config/globals.html) и [„Reporters“](https://vitest.dev/guide/reporters.html): защо `globals` е `false` по подразбиране и кои библиотеки разчитат на глобалните, за да почистват сами; кой репортер избира Vitest и кой скрива конзолата на минаващите тестове. Посетено на 21 октомври 2026 г.
- [Vitest, `vi`](https://vitest.dev/api/vi.html), [`mock`](https://vitest.dev/api/mock.html) и [„Hooks“](https://vitest.dev/api/hooks.html): `vi.fn`, `vi.spyOn`, `vi.stubGlobal`, `vi.unstubAllGlobals`, `mock.calls`, `mockRestore`, `afterEach` и `onTestFinished`. Посетено на 21 октомври 2026 г.
- [React, `act`](https://react.dev/reference/react/act): прилагане на чакащите промени преди сравнението, `IS_REACT_ACT_ENVIRONMENT` и защо React Testing Library вече го използва вместо теб. Посетено на 21 октомври 2026 г.
- [React Router, `createMemoryRouter`](https://reactrouter.com/api/data-routers/createMemoryRouter): маршрутизаторът с история в паметта и `initialEntries`. Посетено на 21 октомври 2026 г.
- [jsdom, README, „Unimplemented parts of the web platform“](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform): навигацията и оформлението извън обхвата му, запълващите нули и `pretendToBeVisual`. Посетено на 21 октомври 2026 г.
- [WHATWG, HTML, „Update the rendering“](https://html.spec.whatwg.org/multipage/webappapis.html#update-the-rendering): асинхронната корекция на фокуса, когато фокусираният елемент престане да бъде фокусируем, например при деактивиране. Посетено на 21 октомври 2026 г.
- [MDN, атрибут `disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled): деактивиран контрол не получава фокус, нито събития като кликване. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| тест на компонент | тест, който рисува компоненти в тестов DOM и ги използва така, както би го направил човек |
| Vitest | изпълнителят на тестове, който използва конфигурацията на Vite; дава `test`, `describe`, `expect` и `vi` |
| jsdom | DOM, написан на JavaScript, без оформление и без рисуване, в който се изпълняват тестовете |
| заявка | функция на Testing Library, която търси елементи: `getBy…`, `queryBy…`, `findBy…` и версиите им `All` |
| неявна роля | ролята, която нативен елемент има, без да се пише `role`: `<button>` е `button`, `<ul>` е `list` |
| `user-event` | библиотека, която симулира цели взаимодействия на човек: писане, кликване, натискане на клавиши |
| симулиран `fetch` | `fetch`, заменен в теста, който отговаря според таблица с пътища, без мрежа |
| маршрутизатор в паметта | маршрутизатор на React Router, който пази историята си в паметта, без адресна лента |
| `act` | инструмент на React, който прилага чакащите промени преди сравнението; Testing Library го използва вместо теб |
| изпитът на теста | отмяна на поправката, която един тест защитава, виждането му червен и възстановяване; ако остане зелен, не защитава нищо |
| корекция на фокуса | стъпката на браузъра, която при рисуването на следващия кадър маха фокуса от елемент, престанал да бъде фокусируем |

---

**Следващ:** [Урок 9 — Производителност, публикуване и кога е нужен framework](09-rendimiento-publicacion.md)
