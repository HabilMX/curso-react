# Урок 7 — Формуляри, действия и достъпност

*Петък е, 17:52 ч., а замразяването на промените е в 18:00 ч. Екипът по експлоатация трябва да регистрира услугата `correo` във вътрешния инструмент, преди да си тръгне, а дежурен е Раул, който работи с екранен четец. Попълва трите полета, натиска Enter и не чува нищо. Натиска Enter отново: нищо. Не знае дали регистрацията е станала, дали е станала два пъти, или формулярът чака нещо. Случило се е следното: адресът не започваше с `https://`; страницата оцвети полето в червено и написа грешката под него, в текст, който никой не беше свързал нито с полето, нито с някакво известие. За онзи, който гледа екрана, грешката беше очевидна. За Раул тя не съществуваше. Остават осем минути. Формулярът, който му трябва, е този, който изгражда този урок, а второто натискане на Enter, онова, което никой не чу, ще поправиш ти в упражнение 3.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 7.2 и 7.3)

**Какво изграждаш:** регистрирането на услуга в `revisor`: нова страница на `/servicios/nuevo`, с формуляр от три полета, който се валидира със схемата от курса по TypeScript, изпраща се към тестовия API, показва грешките до всяко поле и съобщава резултата на онзи, който използва екранен четец

**Какво научаваш:** контролирани срещу неконтролирани полета; `<form action>`, `useActionState`, `useFormStatus` и `useOptimistic`; валидиране със схемата от урок 6 по TypeScript; `aria-invalid` заедно с `aria-describedby`; ARIA live региони (`role="status"`, `role="alert"`); нативният HTML преди ARIA; обхождане с клавиатурата

**Откъде идваш.** От контролната точка на [Урок 6](06-reducer-contexto.md): `revisor` с маршрути (списъкът на `/`, детайлът на `/servicios/:nombre` и страница „не е намерено“), данните от сървъра в TanStack Query, лента за известия със свой reducer и свой контекст, и предпочитания за екрана. Тестовият API още от [Урок 4](04-estado-del-servidor.md) има маршрута, който този урок използва за първи път: `POST /api/servicios`, който отговаря с `201` и новата услуга, с `400` и невалидните полета или с `409`, ако името вече съществува. От курса по TypeScript носиш, ако си го минал, идеята за **схема**: стойност, която умее да чете `unknown` и от която се извежда тип. Ако не си го минал, тук тя се появява изцяло.

**Какво не прави този урок.** Не използва никаква библиотека за формуляри, нито за валидиране: всичко идва от React и от схемата, която вече познаваш, нарочно, за да видиш какво решава всяка част. Не използва Server Functions, нито Server Components: тук `<form action>` получава функция, която се изпълнява в браузъра (защо панелът не използва Server Components се обсъжда в [Урок 9](09-rendimiento-publicacion.md)). Не добавя автоматични тестове: поведението на формуляра се показва с фигури, които се изпълняват в тестов DOM, и с контролната точка, отворена в браузър. И не е курс по достъпност: учи на онова, от което този формуляр има нужда, спрямо източниците, които го определят, и назовава онова, което не може да се провери без човек и екранен четец.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` за този урок. Контролните точки на този и на следващите два урока бяха инсталирани от нулата с `npm ci`, а `npm run lint` и `npm run build` завършиха успешно; тази от този урок произведе `dist/assets/index-WLyq37jn.js`. Не беше повторено в контейнер с Linux. Грешката на компилатора от „Грешката, която ще видиш“ беше предизвикана в копие на контролната точка, а не в оригинала. Фигурите бяха изпълнени със собствен `package.json` в [`programas/07-formularios-accesibilidad/`](../programas/07-formularios-accesibilidad), до `revisor/`; компилират се с `tsc` и се изпълняват с `node`, както в предишните уроци, и добавят само една нова зависимост, `dom-accessibility-api` 0.7.1, която изчислява достъпното име и описание на елемент според спецификацията на W3C. Това, което се вижда „в браузъра“, беше измерено с Chrome в режим без графичен интерфейс (*headless*): HTML на `/servicios/nuevo` с `--headless --dump-dom` срещу `vite preview`, а дървото на достъпността, фокусът и ARIA live регионите — като Chrome беше управляван през неговия протокол за дебъгване (*Chrome DevTools Protocol*) със скрипт на Node, срещу `npm run dev` и тестовия API. Тези изпълнения използваха портовете 4107, 5107 и 3107 вместо 4173, 5173 и 3100, защото на машината по същото време работеха други неща; за да се насочи *proxy*-то към API на порт 3107, `vite.config.ts` беше променен в **копие** на контролната точка, а не в оригинала. За теб нищо не се променя. Измерванията „преди“ бяха направени с формуляра такъв, какъвто беше преди поправките от този урок (успехът, обявяван два пъти, без `required`, без `aria-atomic` на лентата, без `startTransition` и с `disabled={pending}` на бутона), в същото копие; измерванията „след“ — с контролната точка. Не беше изпълнено на реален Linux Mint; нищо от показаното не зависи от операционната система. **Какво не беше измерено**, и това се казва там, където се появява: как звучи формулярът в истински екранен четец (NVDA, Orca или VoiceOver) и обхождането с клавиатурата в реален прозорец. Тези две проверки са в „Как разбирам, че съм успял“, със стъпките за ръчното им изпълнение. Дългите пътища се показват от `~/curso-react` нататък.

## След урока ще можеш да

- Обясниш разликата между контролирано и неконтролирано поле, да предизвикаш предупреждението на React за `value` без `onChange` и да решиш кое от двете е по-подходящо за формуляр, който се изпраща изцяло.
- Свържеш `<form action>` с `useActionState`, да прочетеш в състоянието какво е върнало последното действие и да покажеш „Dando de alta…“ с `useFormStatus` от дъщерен компонент на формуляра.
- Докажеш с фигура, че React изпразва неконтролираните полета след действие, и да запазиш написаното, когато е имало грешки.
- Валидираш трите полета със схема, която събира **всички** грешки, и да провериш с компилатора, че схемата и типът `NuevoServicio` не могат да се разминат.
- Маркираш невалидно поле с `aria-invalid` и `aria-describedby` и да измериш с фигура достъпното име и описание, които получава екранният четец.
- Избереш между `role="status"` и `role="alert"` за дадено известие и да обясниш със спецификацията защо ARIA live регионът трябва да съществува **преди** да пристигне съобщението.
- Прочетеш в дървото на достъпността на Chrome дали едно поле е задължително или невалидно и дали един ARIA live регион се чете изцяло, преди и след промяна.

## Защо, преди как

До урок 6 `revisor` само **четеше**: искаше отчета, искаше детайла, а единствената промяна, която изпращаше към API, беше кликване върху „Volver a revisar“, без данни. Регистрирането на услуга е друг вид проблем, защото човекът пише, а написаното може да е грешно по много начини едновременно. Задай на панела четири въпроса и ще видиш какво липсва.

**Къде живее написаното, докато се пише?** Текстовото поле вече пази стойността си; браузърът го прави открай време. Можеш да го оставиш да я пази и да я прочетеш при изпращането, или да копираш всеки натиснат клавиш в състояние на React. И двата начина работят и и двата имат цена. Изборът, без да знаеш кой какъв е, води до формуляри, които пишат предупреждения в конзолата, губят написаното или се прерисуват при всеки клавиш без нужда.

**Кой отговаря за изпращането?** Изпращането не е един ред код. То е да попречиш на браузъра да презареди страницата, да събереш стойностите, да покажеш, че нещо е в ход, да не позволиш второ изпращане междувременно, да изчакаш отговора, да го превърнеш в грешки или в успех и да обновиш списъка с услуги, който показва друга страница. React 19 има готови части за всяка от тези стъпки и този урок ги използва, вместо да ги измисля наново.

**Кой решава дали една стойност е валидна?** Панелът вече валидира онова, което **пристига** от API, с проверки (guards) като `esReportePublico`. Онова, което човекът пише, също е вход през граница и заслужава същото отношение. Курсът по TypeScript научи как да се прави това със схеми; тук те се използват отново, с една важна разлика: един формуляр не може да спре при първата грешка.

**Как разбира онзи, който не вижда екрана?** Това е сцената от началото. Червена рамка и текст под полето са **визуална** информация. За да я обяви екранен четец, текстът трябва да бъде **свързан** с полето, а съобщението „провери полетата“ трябва да живее на място, което четецът наблюдава. Това не се постига с добри намерения: постига се с конкретни атрибути, определени в спецификация на W3C, и може да се измери.

Четирите отговора се побират в три понятия: неконтролираното поле (7.1), формулярът като **действие** (7.2) и достъпността на формуляра и на неговите известия (7.3). Раздел 7.4 сглобява всичко в `revisor` и го проверява спрямо източниците, точка по точка. Накрая ето какво изчертава `/servicios/nuevo` (изход от headless Chrome, само формулярът):

```text
<form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" novalidate="" aria-describedby="resultado-alta"><div class="campo"><label for="nombre">Nombre</label><input id="nombre" required="" aria-invalid="false" aria-describedby="nombre-ayuda" type="text" value="" name="nombre"><p id="nombre-ayuda" class="ayuda">Un nombre corto y único, por ejemplo: correo</p></div><div class="campo"><label for="url">Dirección</label><input id="url" required="" aria-invalid="false" aria-describedby="url-ayuda" type="url" value="" name="url"><p id="url-ayuda" class="ayuda">La dirección que se va a revisar, con http:// o https://</p></div><div class="campo"><label for="timeoutMs">Tiempo límite (ms)</label><input id="timeoutMs" required="" aria-invalid="false" aria-describedby="timeoutMs-ayuda" type="text" value="" name="timeoutMs"><p id="timeoutMs-ayuda" class="ayuda">Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500</p></div><button type="submit" aria-disabled="false">Dar de alta</button></form><div id="resultado-alta"><div role="alert"></div></div>
```

Всеки атрибут в този HTML има причина и в края на урока ще можеш да кажеш каква е тя. Само един не си написал ти: `action="javascript:throw new Error(…)"` на `<form>`. Това е маркерът, който React поставя, когато `action` е функция. Той никога не се изпълнява при нормално изпращане, защото React прихваща изпращането преди това; би се задействал само ако някой извика `form.submit()` ръчно, което прескача събитието за изпращане, и тогава грешката обяснява какво е станало и предлага `requestSubmit()`. А `value=""` са отражението на `defaultValue` в HTML, а не контролирано поле.

## Понятията

### 7.1 Контролирано или неконтролирано

#### 7.1.1 Браузърът вече пази написаното

`<input>` в браузъра има собствена стойност. Ако пишеш в него, стойността се променя, без никой да програмира нищо. React ти позволява да работиш с този факт по два начина, а документацията на `<input>` ги назовава така ([React, `<input>`](https://react.dev/reference/react-dom/components/input)):

- **Неконтролирано.** Пишеш `<input defaultValue="correo" />`. React задава **началната** стойност и след това се отдръпва: онова, което напише човекът, живее в елемента на DOM, а ти го прочиташ, когато ти потрябва (при изпращане, например). Документацията го казва точно: макар да подаваш начална стойност, твоят JSX „задава само началната стойност; той не контролира каква трябва да бъде стойността сега“.
- **Контролирано.** Пишеш `<input value={nombre} onChange={…} />`. React принуждава полето да показва **винаги** стойността, която му подаваш. Всеки клавиш задейства `onChange`, ти обновяваш състоянието, React прерисува и полето показва новата стойност. Ако не обновиш състоянието, полето не се променя.

Първата фигура поставя двете едно до друго, плюс трето, което смесва зле двете идеи: `value` без `onChange`. И в трите случая фигурата „написва“ `correo2`, както би го направил човек (променя стойността и задейства събитието `input`), и прочита какво е останало. Контролираното поле има една допълнителна особеност, за да се види кой командва: неговият `onChange` записва текста с главни букви.

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

Прочети трите реда отдолу нагоре — така се разбират най-добре:

- **Третото** получи `correo2` и се върна към `correo`. React го върна, защото `value="correo"` казва, че полето има стойност `correo` **винаги**, и никой не променя тази стойност. Преди това React предупреди в конзолата със съобщение, което си струва да се прочете изцяло: подал си `value` без `onChange`, това прави полето само за четене; ако трябва да може да се променя, използвай `defaultValue`; ако не — добави `onChange` или `readOnly`. Това е предупреждението от този раздел и поправката му зависи от това какво си искал.
- **Второто** получи `correo2` и показва `CORREO2`. Стойността на полето е онази, която **твоето** състояние е решило, а не онази, която е написана. Това е „контролирано“: можеш да трансформираш, отхвърляш или ограничаваш всеки клавиш.
- **Първото** получи `correo2` и показва `correo2`. React не се намеси.

Има и четвърти случай, който фигурата не предизвиква, но който документацията назовава: едно поле не може да премине от неконтролирано в контролирано по време на живота си. Ако `value` започне като `undefined` (например защото състоянието още няма стойност) и после получи текст, React предупреждава, че компонент „променя неконтролирано поле в контролирано“. Поправката е `value` да бъде текст още от първото изчертаване, дори да е `""`.

#### 7.1.2 Кое е подходящо за този формуляр

Документацията на React не обявява победител, и този курс също: това е собствен принцип на курса, с практическо правило. **Контролирай поле, когато екранът се нуждае от стойността му, докато се пише**: търсачка, която филтрира списъка с всяка буква (като тази от Урок 5, която освен това пази текста в адреса), брояч на символи, бутон, който се активира, когато полето престане да бъде празно. **Остави го неконтролирано, когато има значение само при изпращането.**

Регистрирането в `revisor` е от втория вид. Никой не се нуждае от името на услугата, докато се пише; то трябва цялото, заедно с другите две полета, в момента на изпращане. Да се контролират и трите би означавало три състояния, три `onChange` и прерисуване на целия формуляр при всеки клавиш, само за да се направи накрая същото, което браузърът прави безплатно. Затова `Campo` от контролната точка е **неконтролиран**, с `defaultValue`. Следващият раздел показва частта, която прави това удобно: React прочита стойностите вместо теб при изпращане, в `FormData`, и освен това използва `defaultValue` по начин, който не е очевиден и който фигура 3 измерва.

### 7.2 Формулярът като действие

#### 7.2.1 `<form action>` получава функция

В HTML атрибутът `action` на формуляр е **адрес**: при изпращане браузърът изпраща полетата на този адрес и зарежда отговора като нова страница. React 19 разширява този атрибут: ако вместо адрес му подадеш **функция**, React прихваща изпращането, събира полетата във `FormData` и извиква твоята функция с него. Документацията на `<form>` го описва с три изречения, които си струва да се четат заедно ([React, `<form>`](https://react.dev/reference/react-dom/components/form)): функцията обработва изпращането вътре в *Transition*; може да бъде асинхронна и получава един-единствен аргумент с данните от формуляра; и, за разлика от `onSubmit`, не е нужно да се извиква `e.preventDefault()`.

*Transition* е начинът, по който React маркира едно обновяване като „неспешно“: докато трае, React може да продължава да отговаря на човека и знае, че има нещо **чакащо**. Когато функцията, която се изпълнява вътре в *Transition*, се нарича „действие“ (*Action*), React ѝ дава три подаръка, които този урок използва: състояние, което пази какво е върнало последното действие (`useActionState`), флаг „чакащо“ за компонентите вътре във формуляра (`useFormStatus`) и временно състояние, което се показва, докато действието не е приключило (`useOptimistic`).

Има още два детайла от същия документ, които ще видиш в кода. Първият: когато `action` е функция, HTTP методът е `POST`, независимо от атрибута `method`. Това почти винаги е без значение, защото браузърът не изпраща нищо сам; твоята функция решава какво да поиска и как. Вторият, и най-изненадващият: **„след като функцията `action` завърши успешно, всички неконтролирани полета на формуляра се нулират“**. Фигура 3 подлага това на проверка.

#### 7.2.2 `useActionState`: резултатът от последното действие

Един формуляр трябва да помни какво е станало с последното изпращане: дали е имало грешки и какви, или регистрацията е минала успешно. `useActionState` е hook-ът, който пази това ([React, `useActionState`](https://react.dev/reference/react/useActionState)). Той получава функция и начално състояние и връща три неща: текущото състояние, функция за задействане на действието и флаг `isPending`.

```tsx
// fragmento
const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
// …
<form action={accion}>
```

Функцията, която му подаваш, получава **два** аргумента: предишното състояние и онова, което е изпратено (тук — `FormData`). Онова, което върне, става новото състояние. Ако ти напомня на reducer, то е защото е такъв, с една разлика: може да бъде асинхронен и може да има ефекти, като например да поиска нещо от API. Документацията го казва обратно на онова, което би очаквал от Урок 6: тази функция **не** се извиква два пъти в `StrictMode`, точно защото е предвидена да има ефекти. Детайл, който обърква много хора първия път: тъй като предишното състояние е първият аргумент, `FormData` е **вторият**. Документацията го пояснява в раздела си за често срещани проблеми, защото е точно обратното на онова, което става, когато подадеш на `action` самостоятелна функция, без `useActionState`, която получава `FormData` като единствен аргумент. В контролната точка първият аргумент се казва `_previo`: долната черта казва „получавам го, но не го използвам“.

Още две правила от същата страница, които контролната точка спазва. Типът на онова, което връща функцията, трябва да бъде същият като този на началното състояние: затова съществува тип `EstadoFormulario` с трите си варианта, а началното състояние е един от тях. И **ако функцията хвърли грешка, React отменя действията в опашката и показва най-близката граница за грешки (error boundary)**. В `revisor` функцията улавя всичко, което може да се провали, и го превръща в състояние `con-errores`, така че този път не се изминава; но ако някой ден грешка се изплъзне, ще я улови границата за грешки на маршрута от [Урок 5](05-rutas-url-como-estado.md), а не бял екран.

Това е състоянието на формуляра. Три варианта, по един за всяко нещо, което може да се е случило:

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

`textos` пази **онова, което човекът е написал**, както е, като текст. Това не е същото като валидираната стойност: `timeoutMs` се пише като `"1500"` и се изпраща като числото `1500`. Запазването на текстовете позволява да бъдат върнати в полетата, когато има грешки, и тук идва нулирането.

#### 7.2.3 Нулирането, което изтрива написаното

Изречението от документацията на `<form>` има непосредствено практическо следствие: „завърши успешно“ означава „функцията не хвърли грешка“, а **не** „регистрацията мина успешно“. Ако твоята функция валидира, открие три грешки и върне състояние `con-errores`, за React тя е завършила успешно и React нулира полетата. Човекът вижда грешките си… и празните полета. Трябва да напише всичко отново, включително онова, което беше вярно.

До каква стойност се нулира едно поле? До тази на `defaultValue`. И ето хитрината, която използва контролната точка: React прерисува формуляра с новото състояние, **преди** да го нулира, така че ако `defaultValue` идва от състоянието, полето се нулира до онова, което човекът беше написал. Фигура 3 го измерва с минимален формуляр: пише `correo`, изпраща и прочита полето, когато действието е приключило. Прави го два пъти: с `defaultValue`, фиксирано на `""`, и с `defaultValue`, взето от състоянието. Мимоходом отбелязва какво е видял `useFormStatus` от две места, което е темата на 7.2.4.

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

С фиксирано `defaultValue` полето остана празно; с `defaultValue` от състоянието запази `correo`. Точно това прави `revisor`: когато състоянието е `con-errores`, всеки `Campo` получава като `valorInicial` текста, който човекът е написал. Когато състоянието е `agregado`, текстовете се връщат към `""` и формулярът остава чист за следващата регистрация, което е онова, което искаш след успех.

За да може формулярът от фигурата да се изпрати в тестов DOM, трябваше да се каже на Node да използва `FormData` на jsdom (`FormData: dom.window.FormData`): без този ред React създава `FormData` с този на Node, който не умее да чете формуляр на jsdom, и изпращането се проваля с `FormData constructor: Argument 1 could not be converted`. Това е детайл на фигурата, а не на браузъра, но ако някога го видиш, вече знаеш откъде идва.

#### 7.2.4 `useFormStatus`: бутонът знае, че има изпращане в ход

Докато действието чака API, човекът трябва да вижда, че нещо се случва, и не трябва да може да изпрати два пъти. `useFormStatus` отговаря на въпроса „формулярът, в който се намирам, има ли чакащо изпращане?“ ([React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)). Импортира се от `react-dom`, а не от `react`, и връща `pending`, `data`, `method` и `action`.

Важните думи са **в който се намирам**. Документацията предупреждава за това със собствено заглавие: `useFormStatus` дава информация само за **родителски** `<form>`, а не за `<form>`, изчертан в същия компонент, който извиква hook-а. Фигура 3 го измери на двете места: компонентът `Formulario`, който изчертава `<form>`, винаги видя `mismo=false`; компонентът `Boton`, който се изчертава **вътре** в `<form>`, видя `hijo=false`, а после `hijo=true`. Затова бутонът за изпращане в `revisor` е отделен компонент:

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

Текстът се сменя на „Dando de alta…“ за онзи, който гледа, а бутонът затваря вратата пред второто изпращане. Това е `<button type="submit">` от HTML: активира се с Enter от всяко поле и с Интервал или Enter, когато има фокуса, без нито ред JavaScript. Това е първата поява на идея, която се връща в 7.3: нативното носи поведение, което ARIA не носи.

Онова, което **не** използва, е `disabled`, и причината беше измерена. Очевидният начин да се предотврати второто изпращане е `disabled={pending}`, и в началото беше написано точно така. Деактивиран бутон не може да има фокуса, а това има цена, която се вижда само с клавиатурата. С Chrome, управляван през неговия протокол за дебъгване, с формуляра, попълнен с валидни данни, фокуса върху бутона и клавиша Интервал, скриптът измери следното с `disabled={pending}`:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
pendiente: foco en body; «Dando de alta…» disabled=true aria-disabled=null opacity=1 cursor=default
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=(ausente) focused=(ausente)
segundo Espacio mientras está pendiente
al terminar: foco en body; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Докато регистрацията чакаше, фокусът вече беше върху `body` и дървото на достъпността престана да казва, че бутонът има фокуса; при приключване фокусът не се върна. За екранен четец фокусът изчезна от страницата в момента на изпращането. (Shift+Tab все пак се върна на „Tiempo límite (ms)“, защото Chrome помни откъде е излязъл фокусът; въпреки това онзи, който слуша, вече не знае къде се намира.) С Enter **от поле** това не се случва, защото фокусът остава в полето.

Бутонът от контролната точка използва `aria-disabled`, който **обявява** „недостъпен“, без да му отнема фокуса, и отменя кликването, докато има чакащо изпращане. Отменянето на кликването е достатъчно: Интервал и Enter върху бутона пристигат като кликване, а стандартът HTML определя неявното изпращане с Enter от поле като събитие `click` върху бутона за изпращане на формуляра ([WHATWG, HTML, „Implicit submission“](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). Същият скрипт, с контролната точка:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
pendiente: foco en button; «Dando de alta…» disabled=false aria-disabled=true opacity=0.6 cursor=not-allowed
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=true focused=true
segundo Espacio mientras está pendiente
al terminar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Фокусът остана върху бутона по време на изпращането и след него; дървото на достъпността го дава като `disabled=true` (което четецът обявява като „недостъпен“ или „затъмнен“) и едновременно `focusable=true` и `focused=true`; а бутонът **изглежда** деактивиран, с `opacity=0.6` и курсор `not-allowed`, благодарение на ново правило във файла със стилове (`button[aria-disabled="true"]`). Внимавай с онова, което `aria-disabled` не прави: то не деактивира нищо, само го казва. MDN го обяснява така: за разлика от `disabled`, `aria-disabled="true"` **само** представя елемента като деактивиран; разработчикът трябва да потисне функционирането му и да промени вида му, а атрибутът не променя това, че елементът може да получава фокус ([MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). Същата страница предупреждава, че стилът за „деактивирано“ трябва да продължава да отговаря на изискването за цветови контраст; `opacity: 0.6` от контролната точка не беше измерено спрямо този критерий. Проверката беше направена с премахване на `onClick={alPulsar}` в копие: второто натискане на Интервал наистина беше изпратено, а журналът на API записа две поредни регистрации, като втората беше отхвърлена като повторена:

```text
09:10:21.186 POST /api/servicios 201
09:10:21.491 POST /api/servicios 409
```

(Първите два реда са от предишните изпълнения; последните два — от копието без защитата.) Със защитата всяко изпълнение остави само един `POST`. Това е същата идея от 7.3.1, видяна от другата страна: ARIA описва, не действа, а поведението трябва да го напишеш ти. Всичко това беше измерено само в Chrome.

#### 7.2.5 `useOptimistic`: показване на онова, което API още не е потвърдил

Регистрирането отнема 300 ms в тестовия API, а при бавна мрежа може да отнеме много повече. Междувременно човекът може да вижда услугата в списък „Altas de esta sesión“, маркирана като чакаща. Това състояние, което се показва **преди** потвърждението, документацията нарича оптимистично ([React, `useOptimistic`](https://react.dev/reference/react/useOptimistic)).

`useOptimistic(valor, reductor)` връща двойка: състоянието, което се показва, и функция за промяната му. Централното му правило е изречение от документацията: оптимистичното състояние **се изчертава само докато дадено действие е в ход; иначе се изчертава `valor`**. Не е нужно то да се „почиства“: когато действието приключи, оптимистичното и реалното състояние съвпадат в едно и също изчертаване. А функцията, която го променя, трябва да се извиква **вътре в действие**; ако я извикаш извън него, React предупреждава с `An optimistic state update occurred outside a Transition or Action` и оптимистичното състояние се появява и изчезва за миг.

В `revisor` реалната стойност е `altas`, състояние с потвърдените регистрации от тази сесия, а reducer-ът добавя име, маркирано като `pendiente`. Reducer-ът пренебрегва име, което вече е в списъка. Така, ако регистрацията на `correo` е била потвърдена веднъж и някой опита отново `correo`, списъкът не показва втори чакащ ред, докато API решава (а API ще отговори с `409`).

#### 7.2.6 Състоянието, което се променя след `await`

Изречението „оптимистичното и реалното състояние съвпадат в едно и също изчертаване“ има условие, и документацията на `useActionState` го пише в предупрежденията си: ако промениш състоянието **след `await`** вътре в действието, засега трябва да обвиеш тази промяна в допълнителен `startTransition` ([React, `useActionState`](https://react.dev/reference/react/useActionState)). Причината е, че онова, което идва след `await`, вече не се изпълнява „вътре“ в действието в очите на React: то е спешно обновяване, което се изчертава веднага, макар действието все още да е чакащо.

При регистрирането `establecerAltas` идва след `await darDeAlta(…)`. За да се види какво става без `startTransition`, в копие беше премахнато отхвърлянето на дубликати в reducer-а (което иначе прикрива ефекта) и беше регистрирана услуга в Chrome, със сървъра за разработка, като се записваше всяка версия на списъка „Altas de esta sesión“ и конзолата:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo3 (agregando…)»]
  [«correo3», «correo3 (agregando…)»]
  [«correo3»]
consola:
  error: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. correo3
```

По средата се появиха **два** реда с едно и също име, единият потвърден, а другият все още „agregando…“, и React предупреди в конзолата, че две деца имат един и същ `key` (`` `%s` `` е празното място в съобщението, където стои ключът; инструментът за измерване го отпечата както е и постави ключа, `correo3`, накрая). Това е спешното обновяване, изчертаващо се върху оптимистичното състояние, което все още беше живо, защото действието не беше приключило. Същото копие, без отхвърляне на дубликати, но с промяната, обвита в `startTransition`:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo4 (agregando…)»]
  [«correo4»]
consola:
```

Един чакащ ред и после потвърденият, без междинни стъпки и без предупреждение. Контролната точка има `startTransition` около двете промени, които следват `await` (регистрациите и известието в лентата), и запазва отхвърлянето на дубликати за онова, за което то наистина отговаря: повтореното име от предишния абзац. Това е измерване от едно изпълнение в Chrome; онова, което го подкрепя в общия случай, е предупреждението в документацията.

#### 7.2.7 Целият формуляр

Това е компонентът, който събира частите. Прочети го от горе до долу с този пътеводител: двата hook-а за състояние (`altas` и оптимистичната му версия); функцията `enviar`, която е действието; `useActionState`; и JSX, с формуляра, региона за грешки и оптимистичния списък.

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

Функцията `enviar` следва реда на една граница, същия, който `cargarReporte` следва с отговора от API: първо чете (`textosDe`), после валидира (`validarCampos`) и само с валидни данни прави нещо. Ако валидирането се провали, API **не се извиква**: грешките се връщат в състоянието и няма никаква заявка. Ако валидирането мине, се добавя оптимистичният ред, изпраща се, а отговорът се превежда в един от три изхода:

1. API отхвърли регистрацията (`400` или `409`): състояние `con-errores`, с грешките **от API** по полета и с текстовете, за да не се изгуби написаното.
2. API прие (`201`): вътре в `startTransition` се добавя потвърдената регистрация и се изпраща известието за успех към лентата от Урок 6, което е **единственото** обявяване на успеха (7.3.3 обяснява защо); после заявката `["reporte"]` се инвалидира, за да може списъкът на `/` да донесе новата услуга следващия път, когато бъде видян, а състоянието преминава в `agregado`.
3. Нещо се провали по друг начин (мрежата, неочакван отговор): `catch` го превръща в `con-errores` с общо съобщение, без грешки по полета.

`noValidate` на `<form>` изключва валидирането от браузъра. Документацията на MDN описва атрибута като „формулярът не трябва да се валидира при изпращане“ ([MDN, `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)). Изключва се, защото формулярът прави собствено валидиране, със съобщенията на схемата и с всички грешки наведнъж; ако беше оставено включено, браузърът щеше да спре изпращането при първото поле със собствено балонче, различно във всеки браузър, и действието нямаше да се изпълни.

#### 7.2.8 Валидиране със схемата: всички грешки наведнъж

Схемата идва от курса по TypeScript почти същата. `Esquema<T>` е обект с метод `leer`, който получава `unknown` и връща резултат: или стойност от тип `T`, или описание на грешката. `Inferir` извлича типа `T` от схема, за да не се пише два пъти. Към тамошните схеми се добавят две, от които този формуляр има нужда: `urlHttp`, която приема само адреси `http:` или `https:` и ги нормализира с `URL`, и `enteroPositivoDeTexto`, която чете число, написано като текст, защото **всичко, което излиза от `FormData`, е текст**.

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

Важната разлика е накрая, във `validarCampos`. В TypeScript схемата за обект спираше при първото невалидно поле, и за API това е наред: отхвърля заявката и обяснява първата причина. Един формуляр не може да прави така. Ако човекът е оставил името празно **и** е написал грешно адреса, да му кажеш само първото го принуждава да изпрати, да поправи, да изпрати отново и да открие втората грешка. Фигура 2 сравнява двете стратегии с едно и също невалидно изпращане:

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

Три грешки, открити наведнъж, срещу една. А последният ред показва нормализирането: `" https://correo.example "` излиза като `https://correo.example/`, без интервали и с крайната `/`, която добавя `URL`. Това е стойността, която пътува към API.

Схемата на регистрацията събира три схеми в един обект и извежда от него трите типа, които използва формулярът: валидираните стойности, грешките по полета и суровите текстове.

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

Последният ред заслужава бавно четене, защото не прави нищо по време на изпълнение и въпреки това е най-важният във файла. `comprobarContrato` е функция, която получава `ValoresAlta` и го връща като `NuevoServicio` — типът, който API очаква според `src/compartido/contrato.ts`. Ако някой промени схемата (добави поле, преименува го или смени типа му) и тя престане да съвпада с типа на API, това присвояване спира да се компилира и `npm run build` спира на `tsc -b`. В „Грешката, която ще видиш“ ще го предизвикаш.

#### 7.2.9 Мрежовата граница на регистрирането

`darDeAlta` прави с отговора от `POST` същото, което `cargarReporte` прави с отговора от `GET`: не му се доверява. Превежда трите кода, които API документира, и хвърля грешка за всеки друг. Има един случай, който се изплъзва по-рано: ако тялото не е JSON (например защото тестовият сървър е спрян и отговаря *proxy*-то на Vite), грешката я хвърля `respuesta.json()`, а съобщението, което ще видиш в региона за грешки, е това на JavaScript, а не „la API respondió …“. Това се извежда от кода; не беше измерено.

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

Интересният случай е `409`. API отговаря с `{"detalle":"ya existe un servicio llamado correo","campos":{"nombre":"ese nombre ya existe"}}`, а `erroresDe` превръща `campos` в `ErroresAlta`. Така грешка, която **само API може да знае** (формулярът не знае кои имена вече съществуват), се появява до правилното поле, със същия вид и същата достъпност като грешка от локалното валидиране. За формуляра няма разлика между „схемата каза не“ и „API каза не“: и двете пристигат като грешки по полета.

### 7.3 Достъпност: първо нативното, ARIA там, където нативното не стига

#### 7.3.1 Първото правило на ARIA

ARIA (*Accessible Rich Internet Applications*) е спецификация на W3C, която добавя атрибути към HTML, за да опише пред помощните технологии — например екранен четец — какво **е** даден елемент (`role`), в какво **състояние** се намира (`aria-invalid`) и с какво **е свързан** (`aria-describedby`). Ръководството на W3C за използването ѝ започва с едно правило, първото, което този курс приема буквално: ако можеш да използваш нативен елемент или атрибут на HTML, който вече има нужната ти семантика и поведение, вместо да преизползваш друг елемент и да му добавиш ARIA роля, състояние или свойство, направи го ([W3C, „Using ARIA“](https://www.w3.org/TR/using-aria/)). Второто правило допълва: не променяй нативната семантика, освен ако наистина не се налага.

Причината е в едно изречение от ръководството за практики на ARIA: за разлика от елементите на HTML формулярите, ролите на ARIA **не карат браузъра да добавя поведение за клавиатурата, нито стилове** ([W3C, „ARIA Authoring Practices Guide: Read Me First“](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)). `<div role="button">` казва на екранния четец „аз съм бутон“, но не реагира на Enter, не влиза в реда на табулация и не изпраща формуляра. `<button type="submit">` прави и трите неща, без да иска нищо. Същото ръководство го обобщава в заглавието на своя раздел: „никаква ARIA е по-добре от лоша ARIA“.

Във формуляра на `revisor` нативното решава почти всичко:

- **`<label htmlFor>`** дава име на всяко поле. MDN описва две предимства: екранният четец прочита етикета, когато полето получи фокуса, а при кликване върху етикета фокусът преминава в полето, което уголемява зоната, която може да се докосне ([MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). В JSX атрибутът `for` се пише `htmlFor`.
- **`<button type="submit">`** изпраща с Enter от всяко поле, сам влиза в реда на табулация и може да бъде деактивиран с `disabled`.
- **Редът на документа** е редът на табулация. MDN го казва за елементите, които могат да получат фокус, без положителен `tabindex`: редът на навигация с фокуса е редът в изходния код ([MDN, `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)). Затова формулярът не използва нито един `tabindex`: полетата са написани в реда, в който се попълват.
- **`:focus-visible`** отбелязва къде е фокусът, когато човекът навигира с клавиатурата. MDN го определя като псевдокласа, която се прилага, когато елементът има фокуса и браузърът определи евристично, че този фокус трябва да стане видим ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)). На практика: при бутон или връзка се появява при табулиране, а не при кликване с мишката; при текстово поле се появява и при кликване, защото браузърът предполага, че ще пишеш и трябва да виждаш къде. MDN дава точно този пример: бутон, натиснат с мишката, по принцип не показва фокуса, а текстово поле, което чака да въведеш нещо — показва.

ARIA влиза на две места, където HTML няма еквивалент: свързването на поле с неговата грешка и съобщаването за промяна, станала далеч от фокуса.

#### 7.3.2 Полето: `aria-invalid` и `aria-describedby`

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

По една връзка или едно състояние на атрибут:

- **`htmlFor={nombre}` с `id={nombre}`**: достъпното име на полето е неговият етикет.
- **`required`**: полето е задължително. Това е нативният атрибут на HTML, и затова не се пише `aria-required`: WAI-ARIA определя `aria-required` като „необходимо е въвеждане в елемента, преди формулярът да бъде изпратен“ и посочва като свързано понятие `required` от HTML ([W3C, WAI-ARIA 1.2, `aria-required`](https://www.w3.org/TR/wai-aria-1.2/#aria-required)), а спецификацията, която превежда HTML към API за достъпност на всяка операционна система, представя `required` по същия начин като `aria-required` ([W3C, „HTML Accessibility API Mappings“](https://www.w3.org/TR/html-aam-1.0/)). С `noValidate` на формуляра браузърът вече не спира изпращането заради празно поле, но атрибутът продължава да казва „задължително“. Беше измерено в дървото на достъпността на Chrome (7.4.2): без атрибута трите полета излизаха с `required=false`; с него — с `required=true`.
- **`aria-invalid`**: състоянието. Спецификацията го определя като „въведената стойност не е във формата, който приложението очаква“ и иска от автора да го постави на `true`, когато стойността е изчислена като невалидна ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). Четецът го обявява като „невалидно“ или „невалидно въвеждане“, според четеца.
- **`aria-describedby`**: обяснението. Спецификацията го определя като атрибута, който идентифицира елемента или елементите, които **описват** обекта, и разграничава етикета, който трябва да е кратък, от описанието, предназначено да дава по-подробна информация ([W3C, WAI-ARIA 1.2, `aria-describedby`](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)). Получава списък от идентификатори, разделени с интервали, а спецификацията, която изчислява достъпните текстове, ги съединява **в този ред**, разделени с интервал ([W3C, „Accessible Name and Description Computation 1.2“](https://www.w3.org/TR/accname-1.2/)). Затова грешката е първа: `nombre-error nombre-ayuda` се чете като „escribe un valor“, а после помощният текст.

Фигура 4 изчертава намалено копие на `Campo` (същите връзки, без `type`, `required` и класове) без грешка, с грешка и, за сравнение, версия „по старому“ с текст отгоре и друг отдолу, без `<label>` и без връзки. За всяко от тях изчислява достъпното име и описание с `dom-accessibility-api`, библиотека, която реализира това изчисление на W3C:

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

Онова, което прочита екранният четец при достигане на полето, по същество са тези два реда плюс ролята и състоянието: „Nombre, текстово поле, невалидно, escribe un valor. Un nombre corto y único, por ejemplo: correo“. Версията без връзки има **празно име и празно описание**: визуално казва същото, но за онзи, който не вижда екрана, това е текстово поле без име. Това е сцената от началото, измерена. (Фигурата изчислява онова, което **спецификацията** казва, че браузърът трябва да представи; как го произнася всеки екранен четец не може да се измери с едно изпълнение и се проверява ръчно.)

Има три решения в компонента, които имат своя източник:

- **`aria-invalid` е `false`, докато не се опита изпращане.** Полето започва без грешка, така че атрибутът излиза като `aria-invalid="false"` и преминава в `true` само когато изпращане е върнало грешка за това поле. Спецификацията препоръчва това за празните задължителни полета: ако човекът не е опитал да изпрати формуляра, авторът **не би трябвало** да маркира като невалидно задължително поле само защото то все още няма данни ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). Това е „не би трябвало“ (*SHOULD NOT*), а не забрана, и се отнася до празното поле: маркирането на невалиден формат преди изпращане, например при напускане на полето, е друго решение, което спецификацията не затваря. MDN го обяснява с други думи: човекът може все още да го попълва ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). С `required` имаше едно съмнение: същата таблица на HTML-AAM позволява на браузъра сам да представи празно задължително поле като невалидно, след като човекът го е докоснал. Беше измерено в Chrome: при влизане в „Nombre“ и излизане с Tab без писане дървото на достъпността продължи да казва `invalid=false` и за трите полета. Други браузъри не бяха измерени.
- **Текстът на грешката е написан, а не само оцветен.** Червената рамка (`input[aria-invalid="true"]` във файла със стилове) помага на онзи, който вижда, но критерий 3.3.1 от насоките WCAG 2.2 изисква, ако бъде открита грешка при въвеждане, елементът с грешка да бъде идентифициран и грешката **да бъде описана с текст** ([W3C, „Understanding SC 3.3.1: Error Identification“](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)). А един цвят не стига до онзи, който не различава червеното.
- **`aria-describedby`, а не `aria-errormessage`.** ARIA 1.2 има специален атрибут за съобщението за грешка, `aria-errormessage`, който MDN описва като атрибута, идентифициращ елемента, който съдържа съобщението за грешка, и който се използва само когато `aria-invalid` е `true` ([MDN, `aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)). Контролната точка използва `aria-describedby`, защото полето вече има нужда от описание за помощния си текст и защото това е моделът, който показва ръководството на W3C за формуляри за свързване на поле с неговото съобщение за грешка ([W3C WAI, „Forms Tutorial: User Notifications“](https://www.w3.org/WAI/tutorials/forms/notifications/)). Това е избор на курса; и двата начина имат опора.

#### 7.3.3 Известието: ARIA live региони

Полето решава грешката **там, където е фокусът**. Но след натискане на Enter фокусът остава върху бутона или в последното поле, а съобщението „Revisa los campos marcados.“ се появява на друго място в страницата. Ако нищо не го обяви, Раул не разбира. Точно за това съществуват **ARIA live регионите** (*live regions*): части от страницата, които помощната технология наблюдава и чиито **промени** обявява, дори фокусът да е другаде.

Критерий 4.1.3 от WCAG 2.2 го изисква за съобщенията за състояние: те трябва да могат да бъдат определени чрез роля или свойства, за да може помощната технология да ги представи, **без те да получават фокуса** ([W3C, „Understanding SC 4.1.3: Status Messages“](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). ARIA предлага две роли за това и формулярът използва и двете:

- **`role="status"`**: според спецификацията, ARIA live регион с информативно съобщение, което не е толкова важно, че да оправдае тревога (alert), с неявно `aria-live` със стойност `polite` и неявно `aria-atomic` със стойност `true` ([W3C, WAI-ARIA 1.2, `status`](https://www.w3.org/TR/wai-aria-1.2/#status)). „Polite“ означава, че четецът изчаква да довърши онова, което казва. MDN добавя указание: не давай фокуса на състоянието, когато съдържанието му се промени ([MDN, роля `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).
- **`role="alert"`**: ARIA live регион с важна и, по принцип, спешна информация; неявно `aria-live` със стойност `assertive` и `aria-atomic` със стойност `true` ([W3C, WAI-ARIA 1.2, `alert`](https://www.w3.org/TR/wai-aria-1.2/#alert)). „Assertive“ означава, че прекъсва. MDN предупреждава, че поради натрапчивия си характер тя трябва да се използва пестеливо и само когато е нужно незабавното внимание на човека ([MDN, роля `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)).

Формулярът използва `alert` за „Revisa los campos marcados.“ и за отказите от API, защото човекът не може да продължи, без да им обърне внимание. Успехът е добра новина, която може да изчака четецът да довърши, затова отива в `status`, и тук има решение, взето с измерване. Лентата от Урок 6 вече е `role="status"`, и регистрирането ѝ изпраща своето известие. Ако формулярът имаше и собствен `status` със „Se dio de alta correo.“, успехът щеше да пристигне **два пъти**. Ето как беше измерено в Chrome, с наблюдение на ARIA live регионите по време на регистриране на услуга, с формуляра, който имаше и двата:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo Descartar»
  status (formulario): «Se dio de alta correo.»
```

А с формуляра от контролната точка, който оставя успеха само на лентата:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo5 Descartar»
```

Една-единствена промяна, на едно-единствено място. MDN предупреждава, по повод тревогите (alerts), че няколко известия едновременно създават лошо изживяване ([MDN, роля `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)); при „polite“ известията проблемът е по-мек, но е същият: човекът чува една и съща новина два пъти. Избрана беше лентата, а не формулярът, защото лентата е мястото за известията на цялото приложение (тя получава и тези от повторната проверка) и защото известието оцелява, ако човекът напусне страницата.

`aria-atomic` решава **колко** се чете. С `true`, неявно за `alert` и за `status`, четецът представя региона **изцяло** всеки път, когато се промени, дори да се е променила само част от него ([MDN, „ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). За едноредовото съобщение на формуляра това е желаното. За лентата — не: тя е списък, който расте до пет известия, всяко със своя бутон „Descartar“, и с `true` петото известие би накарало четеца да повтори и петте. Затова регионът на лентата има `aria-atomic="false"`, което позволява да се обявява само добавеното. Дървото на достъпността на Chrome го потвърждава: преди регионът на лентата излизаше с `atomic=true`; с атрибута — с `atomic=false`, а регионът за грешки на формуляра остава с `atomic=true` (в 7.4.2 са двете четения).

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

Правилото, което най-често се нарушава при ARIA live регионите, е в ръководството на MDN и обяснява формата на JSX: помощната технология по принцип обявява само **динамичните** промени в съдържанието на ARIA live регион; регионът трябва **да бъде създаден преди** обновяването на съдържанието му, да започва празен, а най-надеждният начин е да бъде включен в началната маркировка ([MDN, „ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Затова контролната точка не пише това:

```tsx
// fragmento: la región nace junto con su mensaje (no lo hagas así)
{estado.tipo === "con-errores" && <div role="alert">{estado.detalle}</div>}
```

а това, където `div` съществува от първото изчертаване и се променя само съдържанието му (лентата прави същото със своя `role="status"`):

```tsx
// fragmento de FormularioAlta.tsx
<div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
```

Същото ръководство на MDN признава, че с `role="alert"` съдържанието се обявява „в повечето случаи“, дори регионът да се появи внезапно; но „в повечето случаи“ не е правило, а при `status` няма такова изключение. Писането на празните региони от самото начало работи и за двете роли.

`<form>` има освен това `aria-describedby="resultado-alta"`, което сочи към контейнера на региона за грешки. Не то прави обявяването (това го прави ролята); то е описание на формуляра за онзи, който стига до него с навигация, и включва последната грешка. Кога всеки екранен четец прочита описанието на един формуляр не е определено и не беше измерено: провери го ръчно, и ако чуеш грешката два пъти, причината е този атрибут.

#### 7.3.4 Какво не обявява един ARIA live регион

ARIA live регионът обявява **промени**. Фигура 5 играе ролята на ухо: изчертава регион `role="alert"`, наблюдава го с `MutationObserver` (API на браузъра, което известява, когато DOM се промени) и му подава три поредни изпращания: две с едно и също съобщение и едно различно.

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

Компонентът се изчерта и при трите изпращания, но DOM на региона се промени само при първото и при третото. При второто React сравни новия текст с предишния, видя, че са еднакви, и не докосна нищо: това е съгласуването (reconciliation) от Урок 1, което върши точно своята работа. За екранния четец това означава, че **второ изпращане със същата грешка не се обявява**. Фигурата измерва DOM, а не четеца; това, че четецът мълчи, когато DOM не се променя, е онова, което се извежда от ръководството на MDN (обявява динамични промени), и се проверява ръчно. Във формуляра на `revisor` това се случва, ако човекът натисне Enter два пъти, без да поправи нищо: вторият път полето остава маркирано и описанието му продължава да казва грешката при достигането му, но обявяване няма. Това е второто натискане на Enter на Раул, и упражнение 3 те кара да го решиш.

### 7.4 Регистрирането в `revisor` и проверката му спрямо източниците

#### 7.4.1 Страницата, маршрутът и връзката

Страницата е кратка: задава заглавието на раздела с hook-а от Урок 3 и обвива формуляра в `Tarjeta` от Урок 1, която му дава заглавие `<h2>` и раздел с име.

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

Новият маршрут се добавя сред дъщерните маршрути на оформлението. Редът в масива не решава кой печели (React Router класира маршрутите и фиксиран сегмент печели пред динамичен, както беше проверено в Урок 5), но писането му **преди** `servicios/:nombre` прави видимо за читателя, че `nuevo` е фиксиран адрес, а не името на услуга. Обърни внимание и на `ErrorBoundary: ErrorDeRuta` във външния маршрут: това е границата за грешки от Урок 5, която би уловила грешка, изплъзнала се от действието на формуляра.

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

Оформлението добавя връзка в основната навигация. Това е `NavLink` от Урок 5, така че React Router му поставя `aria-current="page"`, когато си на `/servicios/nuevo`, и екранният четец обявява, че това е текущата страница:

```tsx
// fragmento de revisor/src/app/Disposicion.tsx: lo único que cambia
<NavLink to="/servicios/nuevo">Dar de alta</NavLink>
```

А файлът със стилове расте с онова, от което се нуждае формулярът. Това е блокът, който се добавя в края на `src/reporte/panel.css`:

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

Три правила имат значение за достъпността. `.campo input[aria-invalid="true"]` оцветява рамката в червено **въз основа на ARIA атрибута**, така че онова, което вижда гледащият, и онова, което чува слушащият, идват от една и съща стойност и не могат да си противоречат; това е селекторът, който MDN препоръчва за стилизиране на невалидни полета ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). А `:focus-visible` изчертава син контур от 3 пиксела около онова, което има фокуса, когато браузърът реши, че трябва да се вижда: винаги при навигация с Tab, а също и при кликване в текстово поле (7.3.1). Без него онзи, който навигира с клавиатурата, зависи от контура по подразбиране на всеки браузър, който на някои фонове почти не се вижда. А `button[aria-disabled="true"]` затъмнява бутона, докато има чакащо изпращане: с `disabled` браузърът го затъмняваше сам; с `aria-disabled` — не, и без това правило онзи, който гледа, нямаше да знае, че бутонът не реагира (7.2.4).

`package.json` променя само версията си на `0.7.0`: този урок не добавя зависимости.

С всичко на мястото си контролната точка минава двете проверки на курса. `npm run lint` не пише нищо (правилата на React приемат новите hook-ове и `startTransition` така, както са използвани), а компилирането завършва успешно:

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

#### 7.4.2 Проверката, точка по точка

Тази таблица проверява формуляра и неговите известия спрямо онова, което казват WAI-ARIA и MDN. Колоната „Как се знае“ отделя измереното от онова, което се извежда от кода или се проверява ръчно.

| Какво изисква източникът | Какво прави `revisor` | Как се знае |
|---|---|---|
| Нативният елемент преди ARIA (Using ARIA, правило 1) | `<label>`, `<input>`, `<button type="submit">`, `<form>`; нито една `role` на контролите | Четене на кода |
| Всяко поле с име (WCAG 3.3.2) | `label htmlFor` с `id`, равен на `name` | Измерено: фигура 4, име „Nombre“ |
| Грешката идентифицирана и описана с текст (WCAG 3.3.1) | Текстът на грешката в `<p>`, свързан чрез `aria-describedby`, плюс рамката | Измерено: фигура 4, описание с грешката |
| `aria-invalid` със стойност `true` само след опит за изпращане (WAI-ARIA 1.2) | `false` при изчертаване; `true`, когато състоянието носи грешка за това поле | Измерено: фигура 4 и HTML на `/servicios/nuevo` |
| Съобщения за състояние, без да получават фокуса (WCAG 4.1.3; MDN, `status`) | `role="alert"` за грешките във формуляра, `role="status"` на лентата за успеха; нито едно не получава фокуса | Четене на кода |
| ARIA live регионът съществува преди съобщението (MDN, *Live regions*) | Регионът за грешки и този на лентата се изчертават празни от първото изчертаване | Измерено: HTML на `/servicios/nuevo` ги съдържа празни |
| Няколко известия едновременно са лошо изживяване (MDN, `alert`) | Успехът се обявява веднъж, в лентата | Измерено в Chrome: преди се променяха два региона; сега — един |
| Обявяване на задължителните полета (WAI-ARIA, `aria-required`; HTML-AAM, `required`) | `required` на трите полета | Измерено в дървото на достъпността: `required=false` преди, `required=true` сега |
| Целият регион се чете само когато е уместно (WAI-ARIA, `status`; MDN, `aria-atomic`) | `aria-atomic="false"` на лентата; `alert` на формуляра запазва `true` | Измерено в дървото на достъпността: лентата премина от `atomic=true` към `atomic=false` |
| `alert` пестеливо (MDN, `alert`) | Само за грешки, които не позволяват да се продължи | Четене на кода |
| Ред на фокуса, равен на реда на документа, без положителен `tabindex` (MDN, `tabindex`) | Нито един `tabindex`; полетата в реда на попълване | Измерен е редът на документа в HTML на `/servicios/nuevo`; обхождането е ръчно |
| Видим фокус при навигация с клавиатура | `:focus-visible` с контур от 3 px | Проверява се ръчно |
| `aria-disabled` само представя състоянието; авторът потиска функцията и променя вида (MDN, `aria-disabled`) | `aria-disabled={pending}`, кликване, отменяно докато е чакащо, и затъмнен `button[aria-disabled="true"]` | Измерено в Chrome: фокусът остава върху бутона, дървото го дава като `disabled=true` и `focused=true`, `opacity=0.6`, един-единствен `POST` |

Четенията на дървото на достъпността бяха получени от headless Chrome с `Accessibility.getFullAXTree`, същото дърво, което браузърът предава на екранните четци. С формуляра отпреди поправките:

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

А с контролната точка:

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

Първият `status` е този на лентата; с формуляра отпреди имаше втори `status`, този за успеха във формуляра, който вече не съществува. Трите полета преминаха в `required=true` и нито едно не стана `invalid` от това, че е било докоснато без писане.

И една точка, в която формулярът не стига, казана със същата откровеност:

1. **Повторена грешка не се обявява отново.** Измерено във фигура 5 върху регион, еднакъв с този на формуляра; ефектът върху четеца е изведен, не е измерен. Това е второто натискане на Enter на Раул, и това е упражнение 3.

## Грешката, която ще видиш

Урокът има една основна грешка, онази, която се вижда в конзолата, и три допълнителни, които не се виждат с просто око.

**Основната грешка: `value` без `onChange`.** Ако смениш `defaultValue` с `value` в `Campo.tsx`, мислейки, че „така полето показва стойността от състоянието“, React пише в конзолата на браузъра предупреждението, което фигура 1 улови:

```text
You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
```

А полето става само за четене: пишеш и нищо не става, като в третия случай от фигурата. Съобщението предлага трите изхода, а подходящият за този формуляр е първият, `defaultValue`. Това не е грешка при компилиране, нито на линтера: TypeScript приема `value` в `<input>`, а `npm run build` завършва успешно. Вижда се в конзолата на браузъра по време на разработка, и на екрана, защото не може да се пише.

**Грешката на компилатора: схемата се е отделила от API.** В копие на контролната точка смени в `esquemaAlta.ts` ключа `timeoutMs` с `tiempoMs` и изпълни `npx tsc -b`:

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

Преименува един ключ и компилаторът откри шест места в четири файла, където това чупи нещо, и завърши с код 1. Именно този код е важен: затова `npm run build`, което е `tsc -b && vite build`, никога не стига до `vite build`. Грешките се четат на две групи. Двете `TS2741` казват едно и също от две места: `ValoresAlta` вече няма `timeoutMs`, така че не може да се използва като `NuevoServicio`. Едната е в `esquemaAlta.ts(21,…)`, което е `comprobarContrato`, а другата във `FormularioAlta.tsx(40,…)`, извикването на `darDeAlta(validacion.valor)`. Другите четири са места, които все още пишат `timeoutMs` ръчно (двата атрибута на `Campo` за времето за изчакване във `FormularioAlta`, `textosDe` и `erroresDe`) и които сега не съвпадат с типовете, изведени от схемата. Без тези изведени типове формулярът би изпратил към API тяло с `tiempoMs` и API би отговорил с `400` за поле `timeoutMs`, което формулярът вече не умее да покаже. С тях грешката се появява, преди да се изпълни каквото и да е. `comprobarContrato` е редът, който гарантира това предупреждение, дори някой ден никой друг да не извиква `darDeAlta` със стойностите от схемата.

**Тихата грешка: `useFormStatus` в грешния компонент.** Ако преместиш `useFormStatus` във `FormularioAlta`, за да си „спестиш един компонент“, `pending` е винаги `false`: бутонът никога не казва „Dando de alta…“, никога не се маркира като недостъпен и никога не пренебрегва второто изпращане, така че двойно кликване изпраща два пъти. Няма предупреждение нито в конзолата, нито в линтера. Фигура 3 го измери (`mismo=false` и при двете изпълнения), а документацията го отбелязва като предупреждение. Поправката е тази от контролната точка: hook-ът отива в компонент, който се изчертава **вътре** в `<form>`.

**Другата тиха грешка: полетата, които се изпразват.** Ако `Campo` получаваше фиксирано `defaultValue`, всяко изпращане с грешки би оставяло полетата празни, като при първото изпълнение на фигура 3. И за това никой не предупреждава. Сигналът е оплакването на онзи, който попълва формуляра: „изтри ми всичко“.

## Какво се прави погрешно

**Контролиране на всички полета по навик.** Три състояния и три `onChange` за формуляр, който се чете само при изпращане, е работа, която браузърът вече вършеше, с пълно прерисуване при всеки клавиш. Контролирай, когато екранът се нуждае от стойността, докато се пише.

**Валидиране с `onSubmit` и `e.preventDefault()` и `useState` за „изпраща се“.** Работи, но е преоткриване на `<form action>`, `useActionState` и `useFormStatus`, с повече места за грешки (забравяш да деактивираш бутона, забравяш да го активираш отново, когато има грешка).

**Спиране при първата грешка.** Принуждава човека да открива грешките една по една, с по едно изпращане за всяка. Формулярът събира всички.

**Извикване на API без предварително валидиране.** Схемата отхвърля в браузъра онова, което API би отхвърлил, без заявка и със съобщения до всяко поле. API продължава да валидира, защото не може да се довери на екрана; двете валидирания не се състезават, а се допълват. И има валидирания, които само сървърът може да направи: истински `revisor`, който посещава адресите, регистрирани от някого, трябва да отхвърля тези от собствената си мрежа (`127.0.0.1`, `169.254.169.254`, `10.x`…), иначе всеки би могъл да го използва, за да надзърне вътре. Тази атака се нарича фалшифициране на заявки от страна на сървъра (SSRF), а курсът по HTTP на Hábil я разглежда в карето за сигурност на своя урок 1. `urlHttp` приема тези адреси, без да възрази: схемата в браузъра не защитава от това, нито претендира да го прави.

**Грешки, които са само цвят.** Червена рамка без текст не казва нищо на екранен четец, нито на онзи, който не различава червеното. WCAG 3.3.1 изисква грешката да е в текст.

**Самостоятелен текст на грешка, без `aria-describedby`.** Вижда се, но не е свързан с полето: фигура 4 показа, че четецът не го асоциира.

**`aria-invalid="true"` от първото изчертаване.** Крещи „невалидно“, преди човекът да е написал каквото и да е. Спецификацията препоръчва празно задължително поле да не се маркира, преди да е направен опит за изпращане.

**Деактивиране на бутона, който има фокуса.** `disabled` предотвратява двойното изпращане, но отнема фокуса: измерено в Chrome, той пада върху `body` и не се връща. `aria-disabled` с отменено кликване запазва фокуса (7.2.4).

**`aria-disabled` без защитата.** Атрибутът казва „недостъпен“, но не предотвратява нищо: измерено, второто натискане на Интервал беше изпратено.

**Обявяване на едно и също в два ARIA live региона.** Успех във формуляра и още един същият в лентата се чуват два пъти. Едно известие, едно място.

**ARIA live регионът, който се ражда заедно със съобщението си.** `{error && <div role="alert">…</div>}` може да не бъде обявен. Регионът е празен от самото начало, а онова, което се променя, е съдържанието му.

**`role="alert"` за всичко.** Прекъсва. Успех, „запазено“ или „зарежда се“ са `status`.

**ARIA там, където има нативен елемент.** `<div role="button" onClick>` вместо `<button>` губи клавиатурата, реда на табулация и изпращането на формуляра. Първото правило на ARIA съществува заради това.

**Преместване на фокуса към съобщението за грешка с положителен `tabindex` или с трикове с реда.** Разбърква навигацията на всички. Ако някога решиш да преместиш фокуса, нека бъде с `tabindex="-1"` и `.focus()` върху съобщението, и нека е взето решение, а не кръпка.

## Упражнения

### Упражнение 1 — Предвиди `FormData`

Без да изпълняваш нищо, запиши в дневника си `FormData`, който получава `enviar`, ако човекът напише ` correo ` (с интервали), `https://correo.example` и `1500`, и какво връща `validarCampos` с тези текстове. Какъв тип има `timeoutMs` във всяко от двете? След това провери: добави временен `console.log(textos, validacion)` в `enviar`, изпрати формуляра с `npm run dev` и прочети конзолата на браузъра. Махни реда, когато приключиш.

### Упражнение 2 — `409` отблизо

С пуснати тестов сървър и `npm run dev` регистрирай `correo` два пъти. **Преди** второто изпращане предвиди: кое поле остава маркирано, какво казва описанието му, какво обявява регионът `alert` и какво остава написано в трите полета? Появява ли се втори ред „(agregando…)“ в „Altas de esta sesión“? Провери всяко предвиждане в браузъра. За да видиш атрибута, използвай инструментите за разработчици (раздела с елементите) върху полето „Nombre“.

### Упражнение 3 — Втората грешка също да се обявява

Фигура 5 показа, че второ изпращане със същото съобщение не променя DOM на региона `alert`. Промени `FormularioAlta` така, че **всяко** изпращане с грешки да предизвиква промяна в този регион, без да се променя видимият текст. Подсказка: състоянието `con-errores` може да носи число, което расте при всяко изпращане, а React заменя елемент, когато се промени неговият `key`. Провери решението си, като адаптираш фигура 5, преди да пипаш `revisor`. Възстанови контролната точка, когато приключиш, или запази промяната си в копие.

### Упражнение 4 — Дървото на достъпността с твоите очи

Отвори `http://localhost:5173/servicios/nuevo` в Chrome, с инструментите за разработчици, и в раздела с елементите намери панела за достъпност. **Преди да погледнеш, предвиди** какво казва този панел за три елемента: полето „Nombre“ (задължително ли е?, невалидно ли е?), региона за грешки на формуляра и региона на лентата (колко „polite“ е всеки от тях и дали се чете изцяло). Провери. След това изпрати празния формуляр и погледни отново „Nombre“. Накрая, в копие на контролната точка, махни `required` от `Campo.tsx` и повтори първото четене. Възстанови копието, когато приключиш.

## Решения

### Решение 1

`FormData` носи три текста, както са: `nombre` е `" correo "`, `url` е `"https://correo.example"`, а `timeoutMs` е `"1500"`; `textosDe` ги копира, без да ги променя, и затова `textos.timeoutMs` е `string`. `validarCampos` връща `{ ok: true, valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 } }`: `textoNoVacio` махна интервалите, `urlHttp` нормализира адреса с крайната му `/`, а `enteroPositivoDeTexto` превърна текста в числото `1500`. Това е тялото, което пътува към API: `{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}`. Ако в конзолата виждаш `FormData` като непрозрачен обект, това е нормално: отпечатай `textos`, който е обикновен обект.

### Решение 2

Второто изпращане минава локалното валидиране (формулярът не знае кои имена съществуват), така че се извиква API, който отговаря с `409` и `campos.nombre`. Маркирано остава **само** „Nombre“, с `aria-invalid="true"` и `aria-describedby="nombre-error nombre-ayuda"`, а описанието му започва с „ese nombre ya existe“. Регионът `alert` обявява `detalle` от API, „ya existe un servicio llamado correo“. Трите полета запазват написаното, защото състоянието `con-errores` носи `textos`, а `Campo` ги използва като `defaultValue` (фигура 3). И не се появява втори чакащ ред: reducer-ът на `useOptimistic` пренебрегва име, което вече е в `altas`, а `correo` вече беше потвърден от първото изпращане. Ако вместо това рестартираш тестовия сървър между двете изпращания, второто дава `201`: сървърът пази данните в паметта и се връща към обичайните четири.

### Решение 3

Един начин е състоянието `con-errores` да носи брояч на изпращанията, а абзацът да използва този брояч като `key`:

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

С различен `key` при всяко изпращане React не преизползва `<p>`: маха стария и поставя нов, и регионът `alert` се променя, макар текстът да е същият. При адаптирането на фигура 5 (давайки на `<p>` `key={envio}`) второто изпращане трябва да отчита промени, а не `0`. Обърни внимание, че първият аргумент на `enviar`, който контролната точка пренебрегва с името `_previo`, е точно този, който дава брояча: това е предишното състояние, което ти предоставя `useActionState`. Ако го използваш, махни долната черта от името, защото вече не е пренебрегнат аргумент.

### Решение 4

Панелът показва същото като четенията с `Accessibility.getFullAXTree` от 7.4.2, защото е същото дърво. „Nombre“ е задължително (заради `required`) и не е невалидно (заради `aria-invalid="false"`); името му е „Nombre“, а описанието — помощният текст. Регионът за грешки е „assertive“ и се чете изцяло (`role="alert"`, с неявно `aria-atomic` със стойност `true`); този на лентата е „polite“ и не се чете изцяло (`role="status"` с `aria-atomic="false"`). След изпращане на празния формуляр „Nombre“ става невалидно и описанието му започва с „escribe un valor“: това е състоянието `con-errores`, стигащо до полето. Без `required` свойството за задължителност изчезва или остава невярно, което е онова, което дървото казваше преди поправките от този урок (`required=false`). Ако предвиждането ти за лентата се е провалило, върни се към 7.3.3: `status` има `aria-atomic="true"` по подразбиране, а онова, което го променя, е изричният атрибут. Панелът може да назовава свойствата по друг начин според версията на Chrome; важна е стойността.

## Как разбирам, че съм успял

- [ ] `npm ci`, `npm run lint` и `npm run build` завършват успешно в `~/curso-react/revisor/`, а `npm run build` оставя `dist/assets/index-WLyq37jn.js`, ако кодът ти е идентичен с този от контролната точка.
- [ ] С `npm run dev` отварянето на `http://localhost:5173/servicios/nuevo` показва връзката „Dar de alta“, маркирана като текуща в навигацията, и формуляра с три полета; в инструментите за разработчици всяко поле има `aria-invalid="false"` и `aria-describedby` със своя помощен текст.
- [ ] Изпращането на празен формуляр маркира трите полета, пише „Revisa los campos marcados.“ и в раздела за мрежата **не** се появява никаква заявка към `/api/servicios`.
- [ ] С пуснат тестов сървър регистрирането на `correo` с `https://correo.example` и `1500` показва „Se dio de alta correo“ в лентата за известия (и никъде другаде), добавя реда в „Altas de esta sesión“, оставя полетата празни, а списъкът на `/` вече включва `correo`.
- [ ] Повтарянето на регистрацията на `correo` маркира само „Nombre“ и запазва написаното в трите полета.
- [ ] **Ръчно, с клавиатурата:** от адресната лента Tab обхожда по ред връзките „Reporte“ и „Dar de alta“, двете полета за отмятане на предпочитанията, трите полета и бутона (това е редът, в който се появяват в HTML от „Защо, преди как“ и в този на оформлението, с празна лента за известия), и всеки от тях показва синия контур; Enter във всяко поле изпраща формуляра. Нищо не получава фокуса извън този ред. И още една проверка: премести фокуса върху бутона с Tab и изпрати с Интервал. Докато казва „Dando de alta…“, бутонът изглежда затъмнен, второ натискане на Интервал не прави нищо, а синият контур остава върху него; при приключване фокусът си остава там (7.2.4).
- [ ] **Ръчно, с екранен четец** (Orca на твоя Mint, NVDA под Windows или VoiceOver под macOS): при изпращане на празен формуляр четецът обявява „Revisa los campos marcados.“, без да преместваш фокуса; при достигане на „Nombre“ прочита етикета, невалидното състояние и описанието, с грешката най-напред; при регистриране обявява успеха **само веднъж**; при няколко известия в лентата прочита само новото. Запиши в дневника си какво си чул във всеки случай.
- [ ] Фигурите от 1 до 5 дават на твоята машина същия изход като в урока.
- [ ] Записа в своя [дневник](bitacora.md) какво прави всеки атрибут от HTML, показан в „Защо, преди как“.

## Обобщение

Отговори, без да гледаш урока:

1. Каква е разликата между `defaultValue` и `value` в `<input>`? За какво предупреждава React, ако подадеш `value` без `onChange`, и кои са трите изхода, които предлага?
2. Защо регистрирането в `revisor` използва неконтролирани полета? В какъв случай би контролирал някое?
3. Какво получава функцията на `useActionState` и в какъв ред? Какво става с онова, което тя връща?
4. Защо React изпразва полетата след действие с грешки и как `revisor` предотвратява загубата на написаното?
5. Откъде трябва да се извика `useFormStatus`, за да стане `pending` някога `true`?
6. Кога се изчертава състоянието на `useOptimistic` и кога престава да се изчертава? Защо промяна на състоянието, която идва след `await` вътре в действието, се обвива в `startTransition`, и какво се видя в Chrome, когато това не се правеше?
7. Защо `validarCampos` събира всички грешки и какво защитава `comprobarContrato`?
8. Какво обявява екранният четец благодарение на `aria-invalid` и `aria-describedby` и в какъв ред чете описанието?
9. Каква е разликата между `role="status"` и `role="alert"`? Защо регионът трябва да съществува, преди да пристигне съобщението? Защо лентата има `aria-atomic="false"`, а `alert` на формуляра — не?
10. Какво казва първото правило на ARIA и какво губи `<div role="button">` в сравнение с `<button>`?

## За допълнително четене

- [React, `<form>`](https://react.dev/reference/react-dom/components/form): `action` като функция, *Transition*, неявният `POST` и нулирането на неконтролираните полета след действието. Посетено на 21 октомври 2026 г.
- [React, `useActionState`](https://react.dev/reference/react/useActionState): сигнатурата, двата аргумента на действието, типът на състоянието, границата за грешки, ако действието хвърли грешка, и защо не се извиква два пъти в `StrictMode`. Посетено на 21 октомври 2026 г.
- [React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus): `pending`, `data`, `method` и `action`, и защо дава информация само за родителския `<form>`. Посетено на 21 октомври 2026 г.
- [React, `useOptimistic`](https://react.dev/reference/react/useOptimistic): оптимистичното състояние, което съществува само докато действието е в ход, и предупреждението, ако бъде променено извън действие. Посетено на 21 октомври 2026 г.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): контролирани и неконтролирани полета, `defaultValue`, предупреждението за `value` без `onChange` и преминаването от неконтролирано към контролирано. Посетено на 21 октомври 2026 г.
- [W3C, „Accessible Rich Internet Applications (WAI-ARIA) 1.2“](https://www.w3.org/TR/wai-aria-1.2/): ролите `status` и `alert` с техните неявни стойности и атрибутите `aria-invalid`, `aria-describedby` и `aria-required`. Посетено на 21 октомври 2026 г.
- [W3C, „Using ARIA“](https://www.w3.org/TR/using-aria/): първото и второто правило за използване на ARIA. Посетено на 21 октомври 2026 г.
- [W3C, „ARIA Authoring Practices Guide: Read Me First“](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): „никаква ARIA е по-добре от лоша ARIA“ и защо ролите не добавят поведение за клавиатурата. Посетено на 21 октомври 2026 г.
- [W3C, „Accessible Name and Description Computation 1.2“](https://www.w3.org/TR/accname-1.2/): как се изчислява описанието от идентификаторите в `aria-describedby`, по ред. Посетено на 21 октомври 2026 г.
- [W3C, „HTML Accessibility API Mappings 1.0“](https://www.w3.org/TR/html-aam-1.0/): атрибутът `required`, представен като `aria-required`. Посетено на 21 октомври 2026 г.
- [W3C WAI, „Forms Tutorial: User Notifications“](https://www.w3.org/WAI/tutorials/forms/notifications/): свързване на поле с неговото съобщение за грешка чрез `aria-describedby`. Посетено на 21 октомври 2026 г.
- [W3C, WCAG 2.2: „Understanding SC 3.3.1: Error Identification“](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [„SC 3.3.2: Labels or Instructions“](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) и [„SC 4.1.3: Status Messages“](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): грешката, описана с текст, етикетите и съобщенията за състояние без фокус. Посетено на 21 октомври 2026 г.
- [MDN, „ARIA live regions“](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): създаване на региона преди обновяването му, `polite` срещу `assertive` и `aria-atomic`. Посетено на 21 октомври 2026 г.
- [MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid), [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby), [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage), [роля `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) и [роля `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role): кога да се маркира поле като невалидно, как се свързва с описанието си и кога да се използва всеки ARIA live регион. Посетено на 21 октомври 2026 г.
- [MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled) и [WHATWG, HTML, „Implicit submission“](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission): какво прави и какво не прави `aria-disabled`, и Enter от поле като кликване върху бутона за изпращане. Посетено на 21 октомври 2026 г.
- [Chrome DevTools Protocol, домейн `Accessibility`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/): `Accessibility.getFullAXTree`, дървото на достъпността, прочетено преди и след поправките. Посетено на 21 октомври 2026 г.
- [MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) и [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible): свързаният етикет, `novalidate`, редът на табулация и видимият фокус. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| неконтролирано поле | `<input>`, чиято стойност пази браузърът; React задава само началната с `defaultValue` |
| контролирано поле | `<input>`, чиято стойност React решава при всяко изчертаване с `value` и `onChange` |
| действие (*Action*) | функция, която React изпълнява вътре в *Transition*; с `<form action>` получава `FormData` |
| `useActionState` | hook, който пази какво е върнало последното действие и предоставя функцията за задействането му |
| `useFormStatus` | hook, който от компонент вътре в `<form>` казва дали този формуляр има чакащо изпращане |
| оптимистично състояние | онова, което се показва, докато действието не е приключило, преди API да потвърди |
| `startTransition` | функция на React, която маркира обновяване като част от *Transition*; вътре в действие връща към него онова, което идва след `await` |
| дърво на достъпността | версията на страницата, която браузърът предава на екранните четци: роли, имена, описания и състояния |
| достъпно име | текстът, с който помощната технология идентифицира даден елемент; при поле — неговият етикет |
| достъпно описание | допълнителният текст, който се чете след името; тук — грешката и помощният текст от `aria-describedby` |
| ARIA live регион (live region) | част от страницата, чиито промени помощната технология обявява, без да премества фокуса |
| `role="status"` / `role="alert"` | „polite“ регион, който изчаква / „assertive“ регион, който прекъсва |
| `aria-disabled` | атрибут, който обявява „недостъпен“, без да отнема фокуса и без да деактивира нищо; поведението го пише разработчикът |
| `aria-atomic` | дали ARIA live регионът се чете изцяло (`true`) или само онова, което се е променило (`false`), при всяка промяна |
| `:focus-visible` | CSS псевдокласа, която се прилага, когато фокусът трябва да се вижда, обикновено при навигация с клавиатура |

---

**Следващ:** [Урок 8 — Тестове на компоненти](08-pruebas-de-componentes.md)
