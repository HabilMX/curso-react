# Урок 3 — Effects: синхронизиране, а не „когато се зареди“

*9:52 ч. е и сутрешните дежурни преглеждат таблото преди срещата в 10. В новия `revisor` вече може да се избере услуга и да се видят детайлите ѝ. Операторката кликва върху `pagos`, веднага се отказва и избира `inventario`. Появява се заглавието „inventario“, а под него „Disponible: HTTP 200 en 118 ms“. Тя си отдъхва. Секунда по-късно, без никой да пипа нищо, същото каре се сменя на „En falla: HTTP 503“. Тя звъни по телефона на екипа на inventario, който петнайсет минути преглежда сървърите си и не намира нищо. Inventario никога не е било в повреда. Това, което се видя, беше отговорът за `pagos`, по-бавен, който пристигна късно и се записа върху този за `inventario`. Никой не беше написал грешка в обичайния смисъл: всеки ред от кода правеше това, което казваше. Липсваше ред, който да казва какво да се прави, когато въпросът вече няма значение. Този урок пише този ред и обяснява защо е нужен.*

**Време:** 2 × 45 мин (естественото прекъсване е между раздели 3.3 и 3.4)

**Какво изграждаш:** панел с детайли, който иска от сървъра данните за избраната услуга и се рестартира сам, когато избереш друга; заглавието на раздела в браузъра с броя на повредите, `(2) Revisor`; и реда „Actualizado a las …“, който показва кога е пристигнал последният отчет, без да рестартира периодичното запитване (polling) на всеки 10 секунди

**Какво научаваш:** цикъла на един Effect: започване и спиране на синхронизирането; почистването; надпреварата между отговорите, възпроизведена и поправена; `StrictMode` като безплатна проверка, че почистването съществува; зависимости, които описват кода (**линтерът не се заглушава**); `useEffectEvent`; случаите, в които не е нужен Effect

**Откъде идваш.** От [Урок 2](02-estado-instantanea-forma.md). Твоят `revisor` вече има полето за отмятане „Solo fallas“, имената на услугите като бутони с `aria-pressed`, бележка за всяка услуга и каре с детайли, `DetalleSeleccion`, което се **изчислява** от списъка: не пита сървъра нищо, само показва отново това, което отчетът вече е донесъл. От [Урок 0](00-un-proyecto-de-verdad.md) насам таблото има един Effect — този в `useReporte`, който иска `GET /api/estados` на всеки 10 секунди и който `StrictMode` монтира два пъти по време на разработка. Онзи урок ти показа двойката „cancelada por el cliente“ + „200“ в лога на сървъра и обеща, че тук ще бъде обяснена в дълбочина. Работиш в `~/curso-react/revisor/`, който в началото е идентичен с контролната точка на Урок 2.

**Какво не прави този урок.** Не добавя маршрути в браузъра: детайлите продължават да се появяват в същата страница, под списъка, а адресът `/servicios/pagos` идва в [Урок 5](05-rutas-url-como-estado.md). Не заменя ръчното извличане на данни с библиотека: тук пишеш със собствените си ръце Effect-а, който иска детайлите, заедно с почистването му, за да разбереш какъв проблем решава; според плана на курса в [Урок 4](04-estado-del-servidor.md) същата работа ще премине към TanStack Query. Няма и автоматични тестове: те идват в [Урок 8](08-pruebas-de-componentes.md). И не използва `useMemo`, `useCallback`, нито `memo`: курсът не ги представя без измерване, което да ги изисква, а в 3.6 ще видиш, че проблемът, който обикновено се „замазва“ с `useCallback`, тук има по-пряко решение.

**За изпълненията.** Всичко беше изпълнено на 21 октомври 2026 г. с Node.js 24.22.0 и npm 11.19.1 под macOS, с точните версии от `package.json` на контролната точка. В този урок не беше правена нова инсталация в контейнер с Linux: изпълненията на курса дадоха едни и същи имена на файлове в `dist/` под macOS и в контейнер `node:24.22.0` за всички контролни точки, а изграждането на контролната точка на този урок даде тук същото име (`index-CTkBRgQQ.js`). Нищо от показаното не зависи от операционната система. Това, което се вижда „в браузъра“, беше измерено с Chrome 155 без графичен интерфейс (`--headless`), управляван през неговия протокол за дебъгване: скрипт отваряше страницата, изчакваше, изпращаше реални кликвания с мишката (същите събития, които произвежда ръката ти) и четеше текста на карето с детайли. Експериментите, които нарочно чупят кода, бяха направени в **копие** на контролната точка, и тъй като на същата машина работеха други процеси на обичайните портове, това копие използваше 3103 за тестовия сървър, 5103 за Vite и 9303 за протокола за дебъгване на Chrome. На твоята машина те са 3100 и 5173 и нищо друго не се променя. Една първа серия изпълнения в браузъра беше отхвърлена и повторена изцяло, защото друг процес на машината използваше същия порт за дебъгване и не можеше да се гарантира, че кликванията идват само от скрипта; показаните изходи са всичките от втората серия и повториха ред по ред същото поведение като първата. Часовете в лога на сървъра са по UTC; часът в „Actualizado a las …“ е местният час на браузъра, който беше в часовата зона на Мексико Сити (UTC−6), и затова двата часовника не съвпадат. Дългите пътища, които отпечатва ESLint, се показват спрямо `~/curso-react`. Програмите са в [`programas/03-effects-sincronizar/`](../programas/03-effects-sincronizar): `revisor/` е контролната точка, а фигурите са до нея.

## След урока ще можеш да

- Да обясниш със свои думи какво синхронизира всеки от трите Effect-а на `revisor` (периодичното запитване, детайлите и заглавието), какво прави тялото му и какво отменя почистването му.
- Да възпроизведеш надпреварата между отговорите в копие на таблото, да я разчетеш в лога на сървъра и да я поправиш с `AbortController` в почистването.
- Да обясниш защо `<PanelDetalle key={seleccionado}>` рестартира целия панел и защо това е правилният начин да се върнеш към „Cargando detalle…“ вместо `setState` вътре в Effect-а.
- Да разчетеш в лога двойката „cancelada por el cliente“ + „200“, която произвежда `StrictMode`, и да кажеш какво доказва тя.
- При предупреждение от `exhaustive-deps` да промениш кода така, че списъкът със зависимости да казва истината, без да заглушаваш правилото, и да разпознаеш кога истината е, че една функция не трябва да рестартира Effect-а.
- Да използваш `useEffectEvent`, за да четеш най-новата функция от Effect, без Effect-ът да се рестартира, и да назовеш двете неща, които линтерът не ти позволява да правиш с нея.
- Да посочиш в компонент Effect, който не е нужен (изчисление или реакция на клик), и да го преместиш там, където му е мястото.

## Защо, преди как

В Урок 2 карето с детайли не питаше нищо. То показваше същия `EstadoPublico`, който вече идваше в списъка. Това има огромно предимство: няма начин то да покаже нещо различно от списъка, защото то е списъкът. Но екипът по експлоатация поиска повече: колко пъти е проверявана тази услуга и кога е била последната проверка. Тези данни не идват в отчета. Трябва да се поискат от сървъра **за всяка услуга**, и в този момент карето престава да бъде изчисление и се превръща в разговор с нещо, което живее извън React.

Задай на това каре три въпроса и ще видиш защо е нужен инструмент.

**Кога се искат детайлите?** Изкушаващият отговор е „когато се зареди компонентът“. Точно този отговор урокът е дошъл да разглоби. Детайлите не се искат „при зареждане“: искат се, **докато** карето показва една услуга, и престават да имат значение, щом то покаже друга. Ако избереш `pagos`, екранът трябва да е в съгласие със сървъра за `pagos`. Ако смениш на `inventario`, съгласието за `pagos` вече не важи и започва ново. Това не е събитие, което се случва веднъж; това е **синхронизиране**, което започва и свършва.

**Какво става със стария въпрос, когато зададеш нов?** На тестовия сървър му трябват 1,5 секунди, за да отговори с детайлите за `pagos`, и 0,2 секунди за останалите. Ако избереш `pagos` и веднага след това `inventario`, във въздуха има два въпроса, и този, който си задал първи, пристига последен. Ако никой не каже на първия, че вече няма значение, когато пристигне, той ще запише резултата си в карето, върху правилния. Точно това видяха дежурните от сцената.

**Кой разбира, когато нещо се промени извън React?** Разделът в браузъра има заглавие. Ако таблото можеше да сложи там броя на повредите, `(2) Revisor`, дежурните щяха да го виждат, дори да са в друг раздел. Но заглавието не е част от дървото на React; то е свойство на документа, `document.title`. Някой трябва да го поддържа в съгласие със състоянието на таблото и да го върне такова, каквото е било, когато таблото вече не го контролира.

Трите въпроса имат една и съща форма: има нещо извън React (сървърът, документът, таймер) и екранът трябва да е в съгласие с това нещо. За това съществува Effect-ът. Документацията на React го определя така: Effects ти позволяват да изпълниш код след рисуването, за да **синхронизираш** компонента си с някаква система извън React ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Обърни внимание на глагола. Не казва „да изпълниш код, когато компонентът се появи“. Казва да синхронизираш. Този курс повтаря един принцип във всички уроци и това е урокът, в който той се ражда: **Effect е за синхронизиране с нещо, което е извън React; не за изчисляване, не за реакция на клик и не за „когато се зареди“.**

Урокът има седем части: какво е Effect, със заглавието на раздела като пример (3.1); детайлите, които се искат от сървъра, и тяхното почистване (3.2); надпреварата между отговорите, възпроизведена и поправена (3.3); `StrictMode` като безплатна проверка (3.4); зависимостите, които описват кода (3.5); `useEffectEvent` (3.6); и случаите, в които не е нужен Effect (3.7). Ето какво се променя в проекта ти:

```text
revisor/
├── package.json                      ~ versión 0.3.0
├── servidor/practica.ts              ~ agrega GET /api/servicios/:nombre
└── src/
    ├── compartido/
    │   ├── contrato.ts               ~ agrega DetalleServicio y esDetalleServicio
    │   └── useTituloDocumento.ts     + Effect que sincroniza document.title
    ├── detalle/
    │   ├── cargar.ts                 + cargarDetalle(nombre, senal)
    │   ├── useDetalle.ts             + Effect con dependencias [nombre] y limpieza que aborta
    │   └── PanelDetalle.tsx          + el recuadro, con «Cargando detalle…»
    └── reporte/
        ├── ContenidoReporte.tsx      ~ monta <PanelDetalle key={seleccionado}>
        ├── DetalleSeleccion.tsx      − lo reemplaza PanelDetalle
        ├── Panel.tsx                 ~ «Actualizado a las …» y el título (2) Revisor
        └── useReporte.ts             ~ tercer parámetro alRecibir, con useEffectEvent
```

Знаците са тези на курса: **+** нов файл, **~** променен файл и **−** изтрит файл.

## Понятията

### 3.1 Какво е Effect: започване и спиране на синхронизирането

#### 3.1.1 Две функции, а не момент

Да започнем с най-малкото нещо в новия `revisor`: заглавието на раздела. Това е целият hook:

```ts
// revisor/src/compartido/useTituloDocumento.ts
import { useEffect } from "react";

export function useTituloDocumento(titulo: string): void {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;

    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}
```

Един Effect са **две функции** и един списък. Първата е тази, която подаваш на `useEffect`: тя казва как да се **започне** синхронизирането. Тук тя запазва заглавието, което е имало, и слага новото. Втората е тази, която първата **връща** — почистването: тя казва как да се **спре** синхронизирането. Тук тя връща заглавието, което е имало. Списъкът, `[titulo]`, казва от кои стойности зависи синхронизирането.

Документацията на React настоява на един начин на мислене, който в началото е труден: един Effect може да прави само две неща — да започне да синхронизира нещо и после да спре да го синхронизира ([React, „Lifecycle of Reactive Effects“](https://react.dev/learn/lifecycle-of-reactive-effects)). Същата страница казва, че е добре да се мисли от гледната точка на Effect-а, а не на компонента: „винаги се съсредоточавай върху един-единствен цикъл на започване и спиране; не би трябвало да има значение дали компонентът се монтира, обновява или демонтира“. Това изречение е разликата между този курс и обясненията, които говорят за `useEffect` като за „`componentDidMount` на функциите“. Няма „при монтиране“, нито „при демонтиране“. Има цикъл, който започва, и цикъл, който свършва, и той се повтаря всеки път, когато списъкът каже, че нещо се е променило.

Кога се изпълнява всяка функция? Справочникът на `useEffect` го казва точно: React изпълнява функцията за подготовка, когато компонентът бъде потвърден на екрана (*commit*-ът от Урок 1); когато зависимостите се променят, изпълнява първо старото почистване със старите стойности, а след това новата подготовка с новите стойности; а когато компонентът бъде премахнат, изпълнява почистването за последен път ([React, „useEffect“](https://react.dev/reference/react/useEffect)). За сравняване на зависимостите използва `Object.is`, което за числа и текстове сравнява стойността, а за обекти и функции сравнява **идентичността**: дали е същият обект в паметта, а не дали е същото съдържание. Запомни този детайл; в 3.5 той е причина за сериозен проблем.

Мини през заглавието на `revisor` с това правило. При отваряне на страницата отчетът още не е пристигнал, така че `Panel` изчислява заглавието `"Revisor"`. Effect-ът започва: запазва `"Revisor"` (това от `<title>` в `index.html`) и слага `"Revisor"`. Пристига отчетът с две повреди и `Panel` изчислява `"(2) Revisor"`. Списъкът се е променил, така че React изпълнява старото почистване (връща `"Revisor"`) и новата подготовка (запазва `"Revisor"` и слага `"(2) Revisor"`). Всеки цикъл оставя нещата такива, каквито ги е намерил, преди да започне следващият. Това прави реда без значение.

#### 3.1.2 В `revisor`

`Panel` използва hook-а със стойност, която **изчислява при рисуването**, а не която пази:

```tsx
// revisor/src/reporte/Panel.tsx
import { useState } from "react";
import { Tarjeta } from "../compartido/Tarjeta";
import { useTituloDocumento } from "../compartido/useTituloDocumento";
import type { Cargar } from "./cargar";
import { ContenidoReporte } from "./ContenidoReporte";
import { FiltroFallas } from "./FiltroFallas";
import { conNota, type Notas } from "./notas";
import "./panel.css";
import { contarFallas } from "./resumen";
import { useReporte } from "./useReporte";

export function Panel({
  cargar,
  cadaMs = 10_000,
}: {
  readonly cargar: Cargar;
  readonly cadaMs?: number;
}) {
  const [actualizadoEn, establecerActualizadoEn] = useState<Date | null>(null);
  const { carga, recargar } = useReporte(cargar, cadaMs, () => establecerActualizadoEn(new Date()));
  const [soloFallas, establecerSoloFallas] = useState(false);
  const [seleccionado, establecerSeleccionado] = useState<string | null>(null);
  const [notas, establecerNotas] = useState<Notas>({});

  const fallas = carga.tipo === "listo" ? contarFallas(carga.reporte.estados) : 0;
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
          carga={carga}
          soloFallas={soloFallas}
          seleccionado={seleccionado}
          notas={notas}
          alSeleccionar={establecerSeleccionado}
          alGuardarNota={guardarNota}
        />
        {actualizadoEn !== null && (
          <p className="actualizado">Actualizado a las {actualizadoEn.toLocaleTimeString("es-MX")}</p>
        )}
        <button type="button" onClick={recargar}>
          Actualizar
        </button>
      </Tarjeta>
    </main>
  );
}
```

Обърни внимание на `fallas`. Това не е състояние: това е константа, която се изчислява при всяко рисуване с `contarFallas`, чистата функция от Урок 1. Effect-ът не изчислява нищо; той само **копира** към документа стойност, която React вече знае. Това разделение на труда ще го виждаш във всички добри Effect-и: React изчислява, Effect-ът синхронизира. В 3.7 ще видиш какво става, когато някой го обърне. (`actualizadoEn` и третият аргумент на `useReporte` се обясняват в 3.6.)

Ето какво прочете Chrome без графичен интерфейс в `document.title` секунда и половина след отваряне на таблото при работещ тестов сървър:

```text
08:28:18.814 document.title = "(2) Revisor"
```

`document.title` е точно това, което казва името му: свойството, което чете или променя заглавието на документа, това, което се появява в раздела, и което освен това променя съдържанието на елемента `<title>` ([MDN, „Document: title property“](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)). React не го пипа сам, защото `<title>` живее в `<head>`, а таблото се рисува вътре в `<div id="raiz">`. То е, в точния смисъл на определението, система извън React.

React 19 освен това включва компонент `<title>`, който можеш да рисуваш от всеки компонент и който React винаги поставя в `<head>` ([React, „<title>“](https://react.dev/reference/react-dom/components/title)). С него заглавието би престанало да бъде външна система и не би бил нужен Effect. Тук не се използва по конкретна причина: `index.html` вече има свой `<title>Revisor</title>`, а същата документация предупреждава да се рисува само един `<title>` наведнъж, защото с два поведението на браузърите и търсачките остава недефинирано. Effect-ът променя заглавието, което вече съществува, и го връща такова, каквото е било. Ако някой ден заглавието живее само в React (без това от `index.html`), вграденият `<title>` би бил вариантът без Effect; единственото му изискване е детето да бъде един-единствен текст, например ``{`(${fallas}) Revisor`}``.

Защо почистването връща предишното заглавие, вместо да го остави както е? Защото Effect-ът трябва да може да бъде отменен. Ако утре таблото се рисува само на един от няколко екрана (планът на курса го предвижда за Урок 5), при излизане от него заглавието не трябва да остане да казва `(2) Revisor` на екран, който не показва повреди. Почистване, което е „огледален образ“ на подготовката, позволява на hook-а да работи, без да знае къде ще бъде използван.

### 3.2 Детайлите, които се искат от сървъра

#### 3.2.1 Новият път на тестовия сървър

Тестовият сървър преминава към втората си версия. Не се обяснява ред по ред (курсът е за екрана), но е добре да знаеш какъв нов път има и какво отговаря: `GET /api/servicios/:nombre` връща детайлите за една услуга или `404`, ако тя не съществува. Отговаря за 1,5 секунди за `pagos` и за 0,2 секунди за останалите; тази разлика е поставена нарочно, за да можеш да възпроизведеш надпреварата в 3.3. Попитай го с `curl`, преди да го смесиш с каквото и да е:

```text
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/pagos
{"nombre":"pagos","estado":{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 1.507730 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/inventario
{"nombre":"inventario","estado":{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},"revisiones":0,"ultimaRevision":"2026-10-21T08:11:47.421Z"}
200 en 0.207895 s
$ curl -s -w "\n%{http_code} en %{time_total} s\n" http://127.0.0.1:3100/api/servicios/nada
{"detalle":"no existe el servicio nada"}
404 en 0.203791 s
```

(Изпълнението беше направено на порт 3103, както е обяснено в „За изпълненията“.) `revisiones` брои колко пъти е бил поискан пълният отчет, откакто сървърът е стартирал, а `ultimaRevision` е часът на последния път. Тъй като още никой не беше поискал `GET /api/estados`, те излизат `0` и с часа на стартиране.

`contrato.ts` добавя типа и неговата защита (type guard), точно както `esReportePublico` в Урок 0: това, което пристига по мрежата, е `unknown`, докато не се докаже обратното. Целият файл изглежда така:

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

export interface DetalleServicio {
  readonly nombre: string;
  readonly estado: EstadoPublico;
  readonly revisiones: number;
  readonly ultimaRevision: string;
}

export function esDetalleServicio(valor: unknown): valor is DetalleServicio {
  return (
    esRegistro(valor) &&
    typeof valor.nombre === "string" &&
    esEstadoPublico(valor.estado) &&
    typeof valor.revisiones === "number" &&
    typeof valor.ultimaRevision === "string"
  );
}
```

`esDetalleServicio` преизползва `esEstadoPublico` за полето `estado`: детайлите носят вътре същия `EstadoPublico` като списъка и се валидират със същата защита. Тъй като тестовият сървър импортира тези типове, `tsc -b` проверява също така, че сървърът и екранът са в съгласие.

#### 3.2.2 Мрежовата граница

Функцията, която иска детайлите, следва шаблона на `cargarReporte`: една-единствена отговорност — мрежата, и нищо от React.

```ts
// revisor/src/detalle/cargar.ts
import { esDetalleServicio, type DetalleServicio } from "../compartido/contrato";

export async function cargarDetalle(nombre: string, senal: AbortSignal): Promise<DetalleServicio> {
  const respuesta = await fetch(`/api/servicios/${encodeURIComponent(nombre)}`, { signal: senal });

  if (!respuesta.ok) {
    throw new Error(`la API respondió ${respuesta.status}`);
  }

  const cuerpo: unknown = await respuesta.json();

  if (!esDetalleServicio(cuerpo)) {
    throw new Error("la API no entregó un detalle válido");
  }

  return cuerpo;
}
```

Два детайла. Първият е `encodeURIComponent(nombre)`. Една от услугите се казва `catálogo`, с ударение, а в един адрес знаците извън английската азбука пътуват кодирани; логът на сървъра го показва като `GET /api/servicios/cat%C3%A1logo`, а сървърът го декодира обратно. Ако някой ден услуга се казва `a/b`, без кодиране наклонената черта би променила пътя. Вторият детайл е параметърът `senal`, един `AbortSignal`. Функцията не решава кога да отмени; тя само приема, че някой отвън може да го направи. Този „някой“ е почистването на Effect-а.

Какво се случва, когато някой прекъсне? MDN описва `AbortController.abort()` така: прекъсва асинхронна операция, преди да е приключила, и това включва заявките `fetch`, четенето на тялото им и *streams*; ако не е посочена причина, причината е изключение `DOMException` с име `AbortError` ([MDN, „AbortController: abort() method“](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)). Накратко: обещанието (promise), което е върнал `fetch` (или това на `respuesta.json()`, ако тялото вече се е четяло), се **отхвърля**. А браузърът прекъсва връзката, което тестовият сървър записва като `cancelada por el cliente`.

#### 3.2.3 Effect-ът, който иска детайлите

Това е сърцето на урока. Прочети го с идеята от 3.1 в главата: цикъл, който започва, и цикъл, който свършва.

```ts
// revisor/src/detalle/useDetalle.ts
import { useEffect, useState } from "react";
import type { DetalleServicio } from "../compartido/contrato";
import { cargarDetalle } from "./cargar";

export type CargaDetalle =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly detalle: DetalleServicio }
  | { readonly tipo: "error"; readonly detalle: string };

export function useDetalle(nombre: string): CargaDetalle {
  const [carga, establecerCarga] = useState<CargaDetalle>({ tipo: "cargando" });

  useEffect(() => {
    const control = new AbortController();

    cargarDetalle(nombre, control.signal).then(
      (detalle) => establecerCarga({ tipo: "listo", detalle }),
      (error: unknown) => {
        if (control.signal.aborted) {
          return;
        }

        const detalle = error instanceof Error ? error.message : "falló la carga";
        establecerCarga({ tipo: "error", detalle });
      },
    );

    return () => control.abort();
  }, [nombre]);

  return carga;
}
```

Започва: създава `AbortController`, **собствен за този цикъл**, иска детайлите за `nombre` и му подава своя сигнал. Когато пристигне отговорът, записва `listo`; ако се провали, записва `error`. Свършва: прекъсва. А списъкът казва `[nombre]`, защото `nombre` е единственото нещо, което идва извън Effect-а и се променя между рисуванията.

Формата на състоянието следва правилото от Урок 2: едно-единствено обединение `CargaDetalle` с три случая, а не три флага (`cargando`, `error`, `datos`), които биха могли да си противоречат. Това е същата форма като `Carga` в `useReporte`.

Погледни реда `if (control.signal.aborted) return;`. Когато почистването прекъсне, обещанието се отхвърля с `AbortError`. Без този ред по време на разработка би го виждал при всяка услуга, която избереш: допълнителният цикъл на `StrictMode` (3.4) прекъсва първата заявка, а нейното отхвърляне стига до същото каре, което е пред теб, защото `StrictMode` почиства и подготвя отново Effect-а **на същия компонент**, който запазва състоянието си. Беше измерено в копие без този ред, с Chrome без графичен интерфейс, като се избира `pagos`, а когато вече се е заредило — `inventario`:

```text
08:39:27.086 clic en pagos
08:39:27.237 aside:
pagos

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.939 aside:
pagos
Estado
En falla: HTTP 503
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre pagos
Guardar nota
Cerrar detalle
08:39:28.945 clic en inventario
08:39:29.045 aside:
inventario

No se pudo cargar el detalle: signal is aborted without reason

Nota sobre inventario
Guardar nota
Cerrar detalle
08:39:29.547 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:39:25.997Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Фалшива грешка на екрана в продължение на 1,7 секунди при `pagos` и 0,5 при `inventario`, докато правилният отговор не я замени. Текстът „signal is aborted without reason“ е този на Chrome; други браузъри пишат друг. В продукция, без допълнителния цикъл, не би го видял с тази контролна точка, защото `key` демонтира стария панел и неговото отхвърляне няма къде да пише; но без `key` би го виждал и при всяка смяна на услугата. Прекъсването **не е грешка**: това е начинът, по който този цикъл казва „вече не ме интересува“. Затова се разпознава и се пренебрегва. Обърни внимание какво се пита: не типът на грешката, а дали **моят** контролер е прекъснал. Ако сървърът падне и в същото време потребителят смени услугата, правилният въпрос е „този цикъл още ли е актуален?“, а не „какъв вид грешка е това?“.

И обърни внимание какво **не** прави: не пише `establecerCarga({ tipo: "cargando" })` в началото. Когато смениш услугата, карето трябва да се върне към „Cargando detalle…“, но това не го прави Effect-ът. Прави го `key`, а причината заема целия раздел 3.3.4. Засега запомни подсказката: началното състояние е `{ tipo: "cargando" }` и единственият момент, в който се използва, е когато компонентът се ражда.

`establecerCarga` наистина се извиква вътре в Effect-а, но само във функциите, подадени на `.then(...)`, тоест когато отговорът **пристига отвън**. Това е точно формата, която Урок 0 ти показа като разрешена: Effect, който се абонира за нещо външно и променя състоянието, когато това нещо отговори.

Карето използва hook-а и рисува трите случая:

```tsx
// revisor/src/detalle/PanelDetalle.tsx
import { EditorNota } from "../reporte/EditorNota";
import { useDetalle } from "./useDetalle";

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
  const carga = useDetalle(nombre);

  return (
    <aside className="detalle" aria-label={`Detalle de ${nombre}`}>
      <h3>{nombre}</h3>
      {carga.tipo === "cargando" && <p role="status">Cargando detalle…</p>}
      {carga.tipo === "error" && <p role="alert">No se pudo cargar el detalle: {carga.detalle}</p>}
      {carga.tipo === "listo" && (
        <dl>
          <dt>Estado</dt>
          <dd>
            {carga.detalle.estado.tipo === "disponible"
              ? `Disponible: HTTP ${carga.detalle.estado.codigoHttp} en ${carga.detalle.estado.duracionMs} ms`
              : `En falla: ${carga.detalle.estado.detalle}`}
          </dd>
          <dt>Revisiones</dt>
          <dd>{carga.detalle.revisiones}</dd>
          <dt>Última revisión</dt>
          <dd>{carga.detalle.ultimaRevision}</dd>
        </dl>
      )}
      <EditorNota nombre={nombre} notaGuardada={notaGuardada} alGuardar={alGuardarNota} />
      <button type="button" onClick={alCerrar}>
        Cerrar detalle
      </button>
    </aside>
  );
}
```

Сравни го с `DetalleSeleccion` от Урок 2, който този файл заменя. Онзи получаваше вече разрешения `estado` и слагаше `key={estado.nombre}` на `EditorNota`, за да не се пренася черновата от една услуга в друга. Този получава само `nombre` и текста на запазената бележка, а `EditorNota` вече няма `key`. Това не е небрежност: `key` се качи един етаж по-нагоре, на целия `PanelDetalle`, и оттам рестартира всичко вътре, включително редактора. Текстовете „Cargando detalle…“ с `role="status"` и грешката с `role="alert"` следват навика за достъпност на курса: екранен четец обявява промените в тези два региона, без човекът да трябва да ги търси.

Накрая `ContenidoReporte` монтира карето:

```tsx
// revisor/src/reporte/ContenidoReporte.tsx
import { PanelDetalle } from "../detalle/PanelDetalle";
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
      const existe = estados.some((estado) => estado.nombre === seleccionado);

      return (
        <>
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
    default: {
      const sinAtender: never = carga;
      throw new Error(`carga sin atender: ${JSON.stringify(sinAtender)}`);
    }
  }
}
```

Изборът продължава да бъде идентификаторът, `seleccionado: string | null`, както изискваше Урок 2. `existe` се **изчислява**: ако избраната услуга изчезне от списъка при следващия отчет, карето си отива само, без някой да трябва да помни да изчисти избора. И ето го, на един ред, парчето, което върши половината работа на този урок: `key={seleccionado}`.

С всичко събрано, ето какво прави таблото, когато избереш `pagos` и 300 милисекунди по-късно `inventario` (измерено с Chrome без графичен интерфейс върху непроменената контролна точка):

```text
08:28:18.833 clic en pagos
08:28:19.136 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:19.140 clic en inventario
08:28:19.642 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:21.644 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
1
Última revisión
2026-10-21T08:28:17.762Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Половин секунда след второто кликване карето вече показва `inventario`, а две секунди по-късно, когато отговорът за `pagos` вече би имал предостатъчно време да пристигне, то продължава да казва правилното. А това е логът на сървъра по време на цялата проба, от отварянето на страницата:

```text
08:28:17.462 GET /api/estados cancelada por el cliente
08:28:17.763 GET /api/estados 200
08:28:18.836 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/inventario cancelada por el cliente
08:28:19.347 GET /api/servicios/inventario 200
```

Шест реда, и всеки има причина, която вече можеш да назовеш. Първите два са двойката на `StrictMode` за отчета, същата от Урок 0. Третият е първият цикъл на детайлите за `pagos`, който `StrictMode` започна и веднага почисти (3.4). Четвъртият е вторият цикъл за `pagos`, истинският, отменен 310 милисекунди по-късно, защото си избрал `inventario`: **това** е почистването, което поправя надпреварата. Петият и шестият са двойката на `StrictMode` за `inventario`, чието каре се роди наново заради `key`. Нито един отговор за `pagos` не стигна до таблото, защото никога не завърши.

### 3.3 Надпреварата между отговорите

#### 3.3.1 Надпреварата в миниатюра

Преди да счупиш `revisor`, разгледай надпреварата изолирано, без сървър, без мрежа и без `key`. Първата фигура монтира две версии на един и същ компонент в тестов DOM. И двете искат детайли със симулирана функция, на която ѝ трябват 300 ms за `pagos` и 20 ms за останалите. Единствената разлика е, че едната има почистване, а другата — не. От всяка се иска `pagos` и веднага след това `inventario`:

```tsx
// fig03_01.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

// pagos tarda 300 ms y los demás 20 ms, como en el servidor de práctica (allá, 1500 y 200).
const DEMORA_MS: Readonly<Record<string, number>> = { pagos: 300 };

function cargarDetalle(nombre: string, senal: AbortSignal): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => resolver(`detalle de ${nombre}`), DEMORA_MS[nombre] ?? 20);
    senal.addEventListener("abort", () => {
      clearTimeout(temporizador);
      rechazar(new Error(`${nombre}: petición cancelada`));
    });
  });
}

function DetalleSinLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto);
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

function DetalleConLimpieza({ nombre }: { readonly nombre: string }) {
  const [texto, establecerTexto] = useState("cargando…");

  useEffect(() => {
    const control = new AbortController();
    cargarDetalle(nombre, control.signal).then(establecerTexto, (error: unknown) => {
      if (control.signal.aborted) {
        console.log(`  (${error instanceof Error ? error.message : "cancelada"})`);
      }
    });

    return () => control.abort();
  }, [nombre]);

  return <p>{nombre}: {texto}</p>;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function elegirPagosYLuegoInventario(
  titulo: string,
  Detalle: ComponentType<{ readonly nombre: string }>,
): Promise<void> {
  console.log(titulo);
  const contenedor = dom.window.document.createElement("div");
  const raiz = createRoot(contenedor);

  await act(async () => raiz.render(<Detalle nombre="pagos" />));
  await act(async () => raiz.render(<Detalle nombre="inventario" />));
  await act(async () => esperar(100));
  console.log(`  a los 100 ms: ${contenedor.textContent}`);
  await act(async () => esperar(400));
  console.log(`  a los 500 ms: ${contenedor.textContent}`);
  await act(async () => raiz.unmount());
}

await elegirPagosYLuegoInventario("sin limpieza:", DetalleSinLimpieza);
await elegirPagosYLuegoInventario("con limpieza:", DetalleConLimpieza);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_01.tsx
$ node fig03_01.js
sin limpieza:
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de pagos
con limpieza:
  (pagos: petición cancelada)
  a los 100 ms: inventario: detalle de inventario
  a los 500 ms: inventario: detalle de inventario
```

И двете версии показват правилното на 100 ms. Разликата се появява след това. **Без почистване** на 500 ms параграфът казва `inventario: detalle de pagos`: заглавието е на една услуга, а данните — на друга. Това е сцената от урока в четири думи. **С почистване** смяната от `pagos` на `inventario` изпълни почистването на първия цикъл, което прекъсна заявката за `pagos`; нейното обещание беше отхвърлено (затова се появява редът в скоби, който отпечатва обработчикът на отхвърлянето) и така и не стигна до извикване на `establecerTexto`.

Защо печели старият отговор? Защото двата въпроса тръгнаха почти едновременно и всеки пристига, когато пристигне. Документацията на React ги нарича точно така: грешки от **състояние на надпревара** (race condition), защото две асинхронни операции се „надпреварват“ една с друга и могат да пристигнат в неочакван ред ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Справочникът на `useEffect` го обобщава с изречение, което си струва да запомниш: отговорите от мрежата може да пристигнат в ред, различен от реда, в който си ги изпратил ([React, „useEffect“](https://react.dev/reference/react/useEffect)). Нито един ред не е грешен; липсва ред, който да казва какво да се прави с въпроса, който вече няма значение.

#### 3.3.2 Прекъсване или пренебрегване

Документацията на React дава два начина за почистване на Effect, който иска данни: „ако твоят Effect извлича нещо, функцията за почистване трябва да **прекъсне** заявката или да **пренебрегне** резултата ѝ“ ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Нейните примери използват втория начин, с локална променлива:

```ts
// forma con bandera, como en la documentación de React (fragmento)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then((detalle) => {
    if (!ignorar) {
      establecerCarga({ tipo: "listo", detalle });
    }
  });

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

Флагът не позволява на стария отговор да запише състоянието, а същата страница казва, че изричният флаг е най-надеждният начин да се поправи този вид проблем. Дава и причината: след `fetch` могат да се навържат още асинхронни стъпки ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Прекъсването спира само това, което слуша сигнала; флагът спира всяко записване, откъдето и да идва. `revisor` използва другия начин, `AbortController`, по три конкретни причини. Първата: `revisor` вече го използваше от урок 9 на TypeScript, в `useReporte`, и е добре двата hook-а да си приличат. Втората: прекъсването не само пренебрегва резултата, то **прекъсва връзката**, и сървърът спира да работи по отговор, който никой няма да прочете; с флага старата заявка продължава да пътува изцяло. Третата: можеш да го видиш, защото сървърът записва `cancelada por el cliente`. Двата начина изпълняват златното правило на документацията: заявката, която вече няма значение, да не продължава да влияе на приложението. Прекъсването освен това е коректно към сървъра. А тук прекъсването е достатъчно по конкретна причина: в `cargarDetalle` всичко асинхронно слуша сигнала (`fetch` и `respuesta.json()`), а след това има само синхронен код. Ако някой ден добавиш още един `await`, който не го получава, аргументът на документацията става твой: проверявай `control.signal.aborted` и преди да запишеш успеха, или комбинирай двата начина.

Цената на прекъсването е редът `if (control.signal.aborted) return;`: тъй като обещанието се отхвърля, трябва да се различи прекъсването от повреда. С флага няма отхвърляне за различаване. Цената е малка и затова и двата начина са правилни. Това, което не е правилно, е нито един от двата.

#### 3.3.3 Възпроизвеждане в `revisor`

Сега вече счупи `revisor`. Направи го в копие или върни файла, когато приключиш: контролната точка не се пипа. Очевидният експеримент е да махнеш почистването от `useDetalle`, реда `return () => control.abort();`, да избереш `pagos` и веднага след това `inventario`. **Преди да продължиш да четеш, предвиди какво ще показва карето след две секунди.**

Ето какво измери Chrome без графичен интерфейс само с тази промяна:

```text
08:28:25.305 clic en pagos
08:28:25.606 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:25.609 clic en inventario
08:28:26.110 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:28.113 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
2
Última revisión
2026-10-21T08:28:24.150Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Ако си предвидил „En falla: HTTP 503“, сгрешил си точно като първата версия на записките за този курс. Карето казва правилното и в двата момента — на 500 ms и на две секунди и половина. Вече няма ли надпревара? Погледни лога:

```text
08:28:23.850 GET /api/estados cancelada por el cliente
08:28:24.150 GET /api/estados 200
08:28:25.812 GET /api/servicios/inventario 200
08:28:26.014 GET /api/servicios/inventario 200
08:28:26.807 GET /api/servicios/pagos 200
08:28:28.122 GET /api/servicios/pagos cancelada por el cliente
```

Надпреварата **наистина** се случи в мрежата: вече никой не отменя нищо, а отговорът за `pagos` пристигна изцяло в 26.807, почти секунда **след** първия за `inventario`. Но не стигна до екрана. Причината е `key={seleccionado}`. Когато избра `inventario`, `key` се промени и React не обнови `PanelDetalle` на `pagos`: **премахна** го и монтира нов. Документацията го казва така: когато премахнеш компонент, React унищожава състоянието му ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). Отговорът за `pagos` извика `establecerCarga` на компонент, който вече не съществуваше, и това извикване няма какво да промени. (Последният ред, отмененият `pagos` в 28.122, е затварянето на раздела от скрипта. Обяснява се в 3.4.)

Значи почистването е излишно? Не, а за да се види това, трябва да се махне и другата защита. С изтрит `key` от `ContenidoReporte` **и** без `control.abort()` същият скрипт измери това:

```text
08:28:31.746 clic en pagos
08:28:32.048 aside:
pagos

Cargando detalle…

Nota sobre pagos
Guardar nota
Cerrar detalle
08:28:32.051 clic en inventario
08:28:32.553 aside:
inventario
Estado
Disponible: HTTP 200 en 118 ms
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
08:28:34.555 aside:
inventario
Estado
En falla: HTTP 503
Revisiones
3
Última revisión
2026-10-21T08:28:30.592Z
Nota sobre inventario
Guardar nota
Cerrar detalle
```

Ето я сцената с дежурните, измерена: на 500 ms карето казва истината за `inventario`, а на две секунди и половина казва „En falla: HTTP 503“ — състоянието на `pagos` — под заглавието „inventario“. Логът разказва защо:

```text
08:28:30.292 GET /api/estados cancelada por el cliente
08:28:30.592 GET /api/estados 200
08:28:32.252 GET /api/servicios/inventario 200
08:28:33.247 GET /api/servicios/pagos 200
08:28:34.563 GET /api/servicios/pagos cancelada por el cliente
```

Без `key` `PanelDetalle` е **същият** преди и след второто кликване: промени се само свойството му `nombre`. Effect-ът на `useDetalle` изпълни нов цикъл за `inventario`, но цикълът за `pagos` никога не беше почистен, и когато отговорът му пристигна, той записа в състоянието на същия компонент, който сега показва `inventario`. Това е точно фигура 1, с истинска мрежа.

Когато възстановиш почистването и оставиш панела без `key`, надпреварата изчезва: смяната на `nombre` изпълнява почистването на цикъла за `pagos`, което прекъсва, и старият отговор вече не пристига. Скриптът го потвърди с лога (`pagos` от втория цикъл излиза `cancelada por el cliente` четири милисекунди след кликването върху `inventario`, в 38.511) и с карето, което остана на „Disponible: HTTP 200 en 118 ms“. Но тази версия има друг дефект и той е причината контролната точка да използва двете защити. Измерено в същото изпълнение, като се избира `pagos`, изчаква се да се зареди и се сменя на `catálogo`:

```text
08:28:43.036 clic en catálogo
08:28:43.077 aside:
catálogo
Estado
En falla: HTTP 503
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
08:28:43.678 aside:
catálogo
Estado
Disponible: HTTP 200 en 42 ms
Revisiones
4
Última revisión
2026-10-21T08:28:37.059Z
Nota sobre catálogo
Guardar nota
Cerrar detalle
```

Четирийсет милисекунди след кликването карето казва „catálogo“, а под него „En falla: HTTP 503“: данните на `pagos`, които останаха там, защото никой не върна състоянието към `cargando`. Двеста милисекунди по-късно пристига правилният отговор и се поправя. Това не е надпревара (няма стар отговор, който записва късно), но за миг екранът лъже по същия начин. Дежурните от сцената, ако погледнат в този миг, също ще звъннат на inventario.

#### 3.3.4 Две защити и защо `key` не е трик

Обобщи измереното:

| `key={seleccionado}` | почистване, което прекъсва | Какво се вижда при смяна на услугата |
|---|---|---|
| не | не | старият отговор затрива новия (сцената) |
| не | да | без надпревара, но данните на предишната услуга се виждат, докато пристигне новият отговор |
| да | не | екранът е наред; старият отговор пътува изцяло и се изхвърля |
| да | да | „Cargando detalle…“ и после правилната стойност; старата заявка се прекъсва |

Последният ред е контролната точка. Защо `key`, а не `establecerCarga({ tipo: "cargando" })` в началото на Effect-а, което би изглеждало естествено за втория ред? Защото линтерът не ти позволява, и е прав. Този опит произвежда грешката `set-state-in-effect`, която ще видиш изцяло в „Грешката, която ще видиш“. Правилото обяснява, че незабавната промяна на състоянието вътре в Effect задължава React да рестартира целия цикъл на рисуване, преди браузърът да изрисува ([React, „set-state-in-effect“](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)): React рисува карето със старите данни, потвърждава го, изпълнява Effect-а, Effect-ът иска ново рисуване и React рисува отново. Едно рисуване, което се изхвърля.

`key` няма този проблем, защото не поправя състоянието след това: тя кара състоянието да се **роди** правилно. Документацията на React го предлага точно за този случай, в раздела „Нулиране на цялото състояние при промяна на свойство“: когато `key` се промени, React създава компонента наново и нулира неговото състояние и това на всичките му деца ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)). А страницата ѝ за състоянието казва същото от другата страна: задаването на `key` казва на React да използва `key` като част от позицията на компонента, а не реда му в родителя ([React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state)). За React `<PanelDetalle key="pagos">` и `<PanelDetalle key="inventario">` са два различни компонента, които не споделят нищо. Урок 2 използва този инструмент за черновата на бележката; тук го използва за целия панел: състоянието на зареждането, черновата на редактора и Effect-а.

`key` има един ефект, който трябва да знаеш: карето се монтира наново, а със `StrictMode` това означава, че Effect-ът на `useDetalle` прави своя допълнителен цикъл при всяка смяна на услугата. Видя го в лога: всяка услуга, която избереш, обикновено оставя двойка `cancelada` + `200`. Това е цената по време на разработка на безплатната проверка, а в продукция тя не съществува. (Казва „обикновено“: както уточни Урок 0, редът `cancelada` се появява само ако връзката е успяла да стигне до сървъра преди прекъсването.)

А защо да запазим почистването, ако `key` вече защитава екрана? Защото `key` защитава **този** екран, монтиран **така**. Почистването защитава hook-а навсякъде, където го използваш. Ако детайлите станат страница със собствен адрес, както предвижда планът за Урок 5, същият компонент може да получи друго `nombre`, без да се демонтира, когато навигираш от `/servicios/pagos` към `/servicios/inventario`. Hook, който работи само ако този, който го използва, помни да му сложи `key`, е hook със скрит капан. Освен това само с `key` отговорът за `pagos` пътува изцяло: 1,5 секунди работа на сървъра и на мрежата, за да бъде изхвърлен. Правилото, което дава документацията на React, няма изключения: „функцията ти за почистване трябва да гарантира, че заявката, която вече няма значение, не продължава да влияе на приложението ти“ ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). `key` поправя това, което се вижда; почистването поправя това, което се случва.

### 3.4 `StrictMode`: безплатната проверка

#### 3.4.1 Какво прави с Effect-ите

Урок 0 те научи да разчиташ двойката „cancelada por el cliente“ + „200“. Сега можеш да разбереш какво проверява тя. Справочникът на `useEffect` го казва с тези думи: при включен `StrictMode` React изпълнява допълнителен цикъл на подготовка и почистване, **само по време на разработка**, преди първата истинска подготовка; това е стрес тест, който проверява, че почистването е „огледален образ“ на подготовката и спира или отменя това, което подготовката прави ([React, „useEffect“](https://react.dev/reference/react/useEffect)). И дава правило, по което да разбереш дали си минал теста: **човекът не би трябвало да може да различи Effect, изпълнен веднъж (както в продукция), от последователността подготовка → почистване → подготовка (както по време на разработка).**

Приложи правилото към детайлите. По време на разработка, при избор на `pagos`:

1. React монтира `PanelDetalle`. Effect-ът започва: създава `control₁` и иска `pagos` с неговия сигнал.
2. `StrictMode` симулира, че компонентът си е отишъл: изпълнява почистването, което прекъсва `control₁`. Сървърът записва `cancelada por el cliente`.
3. `StrictMode` симулира, че се е върнал: Effect-ът започва отново, създава `control₂` и иска `pagos` пак. Това е заявката, която запълва карето.

Може ли човекът да различи това от една-единствена заявка? Не: вижда „Cargando detalle…“ и после детайлите, точно както в продукция. Тестът е минат. Сега си представи Effect-а **без** почистване (експериментът от 3.3.3 с `key`). В стъпка 2 нищо не се прекъсва; двете заявки пътуват и двете пристигат. В това табло двата отговора са еднакви и не се забелязва, но сървърът е работил двойно и вторият `200` в лога го издава. При Effect, който вместо да иска данни се абонира за нещо (интервал, връзка), стъпка 2 би оставила **два** живи абонамента, и това вече би се видяло.

Затова документацията иска да се смени въпросът: правилният въпрос не е „как да накарам Effect-а да се изпълни само веднъж?“, а „как да поправя Effect-а си, така че да работи след повторно монтиране?“ ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Същата страница предупреждава срещу лекарството, което всеки опитва първо — референция, която предотвратява второто изпълнение: не е достатъчно Effect-ът да се изпълни веднъж, защото проблемът, който `StrictMode` разкрива, се случва и в продукция всеки път, когато човекът излезе от екрана и се върне.

#### 3.4.2 Разчитане на лога с това, което вече знаеш

Върни се към лога на непроменената контролна точка в 3.2.3. Сега всеки ред разказва цяла история (с уточнението от Урок 0: ред `cancelada` от допълнителния цикъл се появява само ако връзката е успяла да стигне до сървъра преди прекъсването; ако на твоята машина липсва, това не значи, че `StrictMode` е изключен):

- `GET /api/estados cancelada por el cliente` и `GET /api/estados 200` при отваряне: допълнителният цикъл на периодичното запитване. Почистването на `useReporte` прекъсва и освен това спира интервала; ако не го спираше, щеше да има два интервала, питащи на всеки десет секунди.
- `GET /api/servicios/pagos cancelada por el cliente` при първото кликване: допълнителният цикъл на детайлите за `pagos`.
- `GET /api/servicios/pagos cancelada por el cliente` 310 ms по-късно: това не е `StrictMode`. Това е истинското почистване, което се изпълнява, защото си избрал друга услуга и `key` е демонтирала панела.
- Двойката на `inventario`: допълнителният цикъл на новия панел и после заявката, която запълва екрана.

Обърни внимание на нещо, което логът не показва: липсва `200` от втория цикъл на `pagos`. Той така и не пристигна, защото почистването го прекъсна по средата на пътя. Това отсъствие е поправената надпревара.

Има още един детайл в логовете от 3.3.3, който си струва да се обясни, за да не те обърка, ако го видиш. В експеримента с `key` и без почистване двете заявки за `inventario` (тази от допълнителния цикъл и истинската, идентични) не стигнаха до сървъра заедно, а едната 200 ms след другата, а втората идентична заявка за `pagos` още чакаше, когато скриптът затвори раздела, затова се появява като `cancelada por el cliente` в 28.122. Наблюдаваното е, че Chrome не изпрати втората заявка към същия адрес, докато първата не завърши. Това съвпада с ключалката на HTTP кеша на Chromium, която позволява записването само на една заявка наведнъж за даден адрес, за да не се изтегля едно и също два пъти ([Chromium, промяна 8aacaf3](https://chromium.googlesource.com/chromium/src.git/+/8aacaf38e85c45876c72ea77e36ef17e5ab69c26)); Chrome не го документира като официално поведение и не беше проучено повече, защото не е материя на курса, и не променя нито едно заключение на урока: важното е кой отговор стига до екрана, а това беше измерено в карето, не в лога.

#### 3.4.3 Изкушението да го махнеш

Първата реакция при две заявки е да се махне `StrictMode`. Документацията го позволява и го обезсърчава в едно и също изречение: може да се изключи, но екипът на React препоръчва да остане включен ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Сега имаш измерената причина. В експеримента без почистване `StrictMode` ти показа два `200` там, където трябваше да има един `cancelada` и един `200`, **преди** някой да е избрал две услуги последователно. Махането му би скрило точно този сигнал.

Допълнителният цикъл не съществува и в това, което се публикува. Урок 0 го измери с `npm run preview`: една-единствена заявка при отваряне на страницата.

### 3.5 Зависимостите описват кода

#### 3.5.1 Не ти избираш зависимостите си

Дотук списъците със зависимости на `revisor` бяха очевидни: `[nombre]`, `[titulo]`, `[cargar, cadaMs, intento]`. Сега идва случай, който не е, и който е причината за принципа, който курсът повтаря във всеки урок.

Екипът по експлоатация поиска един ред: „Actualizado a las 2:28:53 a.m.“ под списъка, който да казва кога е пристигнал последният отчет. Информацията „пристигна отчет“ я има `useReporte`; мястото, където се рисува редът, е `Panel`. Начинът да ги свържеш е обичайният в React: `Panel` подава на hook-а функция, `alRecibir`, и hook-ът я извиква, когато пристигне отчет. Името следва правилото на курса: свойствата-функции започват с `al`.

Първият опит е да се извика `alRecibir` вътре в Effect-а след `establecerCarga` и да не се пипа нищо друго. ESLint отговаря така (измерено в копие):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  43:6  warning  React Hook useEffect has a missing dependency: 'alRecibir'. Either include it or remove the dependency array. If 'alRecibir' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

Предупреждението казва истината: Effect-ът **използва** `alRecibir`, а списъкът не го споменава. Ако го оставиш така (или го заглушиш с коментар), Effect-ът ще остане с `alRecibir` от първото рисуване завинаги. Тук не би се забелязало, защото всички версии на функцията правят едно и също, но в деня, в който функцията чете нещо от състоянието на `Panel`, тя ще чете стойността от първото рисуване. Документацията на React има име за това, **остарели стойности** (*stale values*), и едно обещание: ако никога не заглушаваш линтера, никога няма да видиш проблеми с остарели стойности ([React, „Lifecycle of Reactive Effects“](https://react.dev/learn/lifecycle-of-reactive-effects)).

Същата страница е категорична по основната идея: **не можеш да „избираш“ зависимостите си.** Те трябва да включват всяка реактивна стойност, която Effect-ът чете, и линтерът следи за това. Реактивните стойности са свойствата, състоянието и всичко, което се декларира вътре в компонента, защото те се изчисляват при рисуване и могат да се променят от едно рисуване до друго. Страницата за премахване на зависимости го казва обратно, с изречение, което е принципът на курса: списъкът **описва** кода ти; за да промениш списъка, промени кода ([React, „Removing Effect Dependencies“](https://react.dev/learn/removing-effect-dependencies)).

#### 3.5.2 Сляпо подчинение на линтера: безкрайният цикъл

Тогава се подчини на предупреждението буквално и добави `alRecibir` към списъка: `[cargar, cadaMs, intento, alRecibir]`. Линтерът е доволен:

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0

```

Зелено. Сега отвори таблото. Ето какво записа тестовият сървър през първите пет секунди от отварянето на страницата в Chrome без графичен интерфейс, без нито едно кликване:

```text
08:28:45.991 GET /api/estados cancelada por el cliente
08:28:46.292 GET /api/estados 200
08:28:46.602 GET /api/estados 200
08:28:46.907 GET /api/estados 200
08:28:47.210 GET /api/estados 200
08:28:47.514 GET /api/estados 200
08:28:47.819 GET /api/estados 200
08:28:48.123 GET /api/estados 200
08:28:48.428 GET /api/estados 200
08:28:48.730 GET /api/estados 200
08:28:49.036 GET /api/estados 200
08:28:49.340 GET /api/estados 200
08:28:49.645 GET /api/estados 200
...
08:28:50.565 GET /api/estados 200
08:28:50.870 GET /api/estados 200
08:28:50.944 GET /api/estados cancelada por el cliente
```

Осемнайсет реда общо: **шестнайсет** отговора `200` и два отменени, за пет секунди, когато таблото трябваше да поиска **един** (периодичното запитване е на всеки десет). Това е една заявка на всеки 300 ms, което е точно забавянето на сървъра: таблото пита, чака отговора и щом той пристигне, пита отново. Завинаги. (Последният отменен е скриптът, който затваря раздела.)

Проследи веригата с това, което знаеш от 3.1:

1. Пристига отчет и Effect-ът извиква `alRecibir`.
2. `alRecibir` е `() => establecerActualizadoEn(new Date())`: променя състоянието на `Panel`.
3. `Panel` се рисува отново и при рисуването създава **друга** стрелкова функция за `alRecibir`. Тя има същия текст, но е друг обект в паметта.
4. React сравнява зависимостите с `Object.is`. За функции това сравнява идентичност: новата функция **не е** старата. Списъкът се е променил.
5. React изпълнява почистването (прекъсва и спира интервала) и стартира Effect-а наново, който веднага иска отчет. Обратно към стъпка 1.

Документацията на React описва точно този механизъм с обект `options`: всеки новосъздаден обект и всяка новосъздадена функция се смятат за различни от всички останали, независимо че съдържанието им е еднакво, и затова Effect, който зависи от тях, се ресинхронизира повече от необходимото ([React, „Removing Effect Dependencies“](https://react.dev/learn/removing-effect-dependencies)). И обърни внимание какво означава това за въпроса „колко пъти се рестартира интервалът?“: **при всяко рисуване на `Panel`**. С този `Panel` — при всеки пристигнал отчет, което превръща рестартирането в безкраен цикъл. Без цикъла (ако `alRecibir` не променяше състоянието) всяко кликване върху полето за отмятане „Solo fallas“ или върху услуга също би нарисувало `Panel` наново и би рестартирало интервала: десетсекундното запитване би започвало да брои от нула всеки път, когато някой кликне.

Това е най-важното в раздела: **зеленият линтер не казва, че кодът е наред. Казва, че списъкът не лъже.** Списъкът лъжеше, когато липсваше `alRecibir`, и линтерът предупреди. С добавянето ѝ той престана да лъже и тогава истината излезе наяве: така, както е написан, този Effect **наистина** зависи от функция, която се променя при всяко рисуване. Линтерът си свърши работата. Това, което е погрешно, е дизайнът, и той се поправя чрез промяна на кода.

#### 3.5.3 Изходите, които дава документацията

Страницата „Lifecycle of Reactive Effects“ изброява какво да се прави, когато предложението на линтера предизвиква безкраен цикъл или ресинхронизира твърде често. Обобщени, те са четири: да се провери дали Effect-ът всъщност е един процес на синхронизиране или два, смесени заедно, и да се разделят; да се преместят нереактивните стойности извън компонента или вътре в Effect-а; да се използват Effect Events, за да се четат най-новите свойства и състояние без ресинхронизиране; и да се избягват като зависимости обекти и функции, създадени при рисуване ([React, „Lifecycle of Reactive Effects“](https://react.dev/learn/lifecycle-of-reactive-effects)). Виж кои от тях важат тук:

- **Да се премести функцията вътре в Effect-а?** Не може: пише я `Panel`, който е друг компонент.
- **Да се премести функцията извън `Panel`?** Също не: тя извиква `establecerActualizadoEn`, което съществува само вътре.
- **`useCallback` в `Panel`?** Това предлага самото предупреждение. Тук би сработило, защото `establecerActualizadoEn` никога не се променя, но прехвърля проблема към този, който използва hook-а: всеки компонент, използващ `useReporte`, би трябвало да помни да обвие функцията си, иначе периодичното запитване отново би станало безкраен цикъл. А курсът не въвежда мемоизацията по навик. Hook, който зависи от това потребителите му да помнят нещо, е крехък.
- **Effect Event?** Това е подходящият, по една дълбока причина, която идва в следващия раздел.

Въпросът, който решава, не е технически, а смислов: **съобщаването, че е пристигнал отчет, част ли е от синхронизирането със сървъра, или е нещо, което се случва *по време на* синхронизирането?** Ако утре `Panel` подаде различна функция, трябва ли да спрем да питаме сървъра и да започнем отначало? Не. Периодичното запитване зависи от това с коя функция се зарежда (`cargar`), на колко време (`cadaMs`) и дали някой е поискал презареждане (`intento`). На кого се съобщава, когато нещо пристигне, не променя нищо от това.

### 3.6 `useEffectEvent`: четене на най-новото без рестартиране

#### 3.6.1 Функция, която се държи като събитие

Документацията на React разграничава два вида логика. Тази на обработчиците на събития **не е реактивна**: изпълнява се само когато човекът повтори взаимодействието, например още едно кликване. Тази на Effect-ите **е реактивна**: ако чете свойство или състояние, тази стойност отива в зависимостите и ако се промени, Effect-ът се изпълнява отново ([React, „Separating Events from Effects“](https://react.dev/learn/separating-events-from-effects)). Съобщението „пристигна отчет“ има двете природи, смесени: задейства се от Effect-а (когато сървърът отговори), но не трябва да кара Effect-а да се рестартира. За това съществува `useEffectEvent`. Справочникът му го описва така: това е hook, който ти позволява да отделиш събития от Effect-ите; Effect Events са част от логиката на Effect-а, но се държат повече като обработчик на събития: винаги „виждат“ най-новите стойности от рисуването (свойства и състояние), без да ресинхронизират Effect-а, и затова **остават извън зависимостите** ([React, „useEffectEvent“](https://react.dev/reference/react/useEffectEvent)). Той дойде като част от React 19.2, публикуван на 1 октомври 2025 г. ([React, „React 19.2“](https://react.dev/blog/2025/10/01/react-19-2)); този курс използва 19.3.1.

Ето как изглежда `useReporte`:

```ts
// revisor/src/reporte/useReporte.ts
import { useEffect, useEffectEvent, useState } from "react";
import type { ReportePublico } from "../compartido/contrato";
import type { Cargar } from "./cargar";

export type Carga =
  | { readonly tipo: "cargando" }
  | { readonly tipo: "listo"; readonly reporte: ReportePublico }
  | { readonly tipo: "error"; readonly detalle: string };

export function useReporte(
  cargar: Cargar,
  cadaMs: number,
  alRecibir: (reporte: ReportePublico) => void,
): { readonly carga: Carga; readonly recargar: () => void } {
  const [carga, establecerCarga] = useState<Carga>({ tipo: "cargando" });
  const [intento, establecerIntento] = useState(0);
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    const control = new AbortController();

    async function pedir(): Promise<void> {
      try {
        const reporte = await cargar(control.signal);
        establecerCarga({ tipo: "listo", reporte });
        avisarRecibido(reporte);
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

Спрямо Урок 2 се променят четири реда: `import` добавя `useEffectEvent`, hook-ът получава параметъра `alRecibir`, обвива го в `avisarRecibido`, а Effect-ът извиква `avisarRecibido(reporte)` (в опита от 3.5 извикваше `alRecibir` директно). Списъкът със зависимости **не се променя**: продължава да бъде `[cargar, cadaMs, intento]`, и линтерът го приема, защото функцията, която Effect-ът използва сега, е Effect Event, а те не влизат в списъка. Стойността на `alRecibir`, която се изпълнява, е винаги тази от последното рисуване, дори Effect-ът да е започнал няколко рисувания по-рано.

В `Panel` (3.1.2) не се променя нищо от това, което написа: той продължава да подава нова стрелкова функция при всяко рисуване, `() => establecerActualizadoEn(new Date())`. Това вече няма значение. Това е предимството пред `useCallback`: hook-ът се защитава сам и този, който го използва, не трябва да знае нищо.

#### 3.6.2 Преброяване на рестартиранията

Третата фигура отговаря с число на въпроса „колко пъти се рестартира интервалът?“. Две еднакви периодични запитвания, едното с функцията в зависимостите, а другото с `useEffectEvent`, се рисуват три пъти, всеки път с нова функция, както прави `Panel`:

```tsx
// fig03_03.tsx
import { JSDOM } from "jsdom";
import { act, useEffect, useEffectEvent, type ComponentType } from "react";
import { createRoot } from "react-dom/client";

const dom = new JSDOM('<!doctype html><div id="raiz"></div>');

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  IS_REACT_ACT_ENVIRONMENT: true,
});

type PropsSondeo = { readonly alRecibir: () => void };

function SondeoConDependencia({ alRecibir }: PropsSondeo) {
  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(alRecibir, 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, [alRecibir]);

  return null;
}

function SondeoConEvento({ alRecibir }: PropsSondeo) {
  const avisarRecibido = useEffectEvent(alRecibir);

  useEffect(() => {
    console.log("  arranca el intervalo");
    const temporizador = setInterval(() => avisarRecibido(), 10_000);
    return () => {
      console.log("  detiene el intervalo");
      clearInterval(temporizador);
    };
  }, []);

  return null;
}

async function dibujarTresVeces(titulo: string, Sondeo: ComponentType<PropsSondeo>): Promise<void> {
  console.log(titulo);
  const raiz = createRoot(dom.window.document.createElement("div"));

  for (const dibujo of [1, 2, 3]) {
    console.log(` dibujo ${dibujo}`);
    // Como en Panel: una función nueva en cada dibujo.
    await act(async () => raiz.render(<Sondeo alRecibir={() => console.log("  recibido")} />));
  }

  console.log(" desmontar");
  await act(async () => raiz.unmount());
}

await dibujarTresVeces("con alRecibir en las dependencias:", SondeoConDependencia);
await dibujarTresVeces("con useEffectEvent:", SondeoConEvento);
dom.window.close();
```
```bash
$ npx tsc --strict --target ES2022 --module nodenext --jsx react-jsx fig03_03.tsx
$ node fig03_03.js
con alRecibir en las dependencias:
 dibujo 1
  arranca el intervalo
 dibujo 2
  detiene el intervalo
  arranca el intervalo
 dibujo 3
  detiene el intervalo
  arranca el intervalo
 desmontar
  detiene el intervalo
con useEffectEvent:
 dibujo 1
  arranca el intervalo
 dibujo 2
 dibujo 3
 desmontar
  detiene el intervalo
```

С функцията в зависимостите интервалът стартира **три** пъти при три рисувания: по веднъж на рисуване, въпреки че нищо важно не се е променило. С `useEffectEvent` стартира **веднъж** и спира веднъж, при демонтиране. (Фигурата не използва `StrictMode`, за да може броенето да се чете без допълнителния цикъл; „recibido“ не се появява, защото фигурата приключва много преди десетте секунди на интервала.)

А в `revisor` — с истински кликвания. Този скрипт отвори непроменената контролна точка и в продължение на двайсет и една секунди направи четири кликвания върху полето за отмятане „Solo fallas“ (отметна го и го размаркира два пъти) и избра две услуги. Всяко от тези кликвания рисува `Panel` наново:

```text
08:28:53.073 abre http://localhost:5103/
08:28:54.581 document.querySelector(".actualizado").textContent → "Actualizado a las 2:28:53 a.m."
08:28:54.588 clic en la casilla
08:28:56.593 clic en la casilla
08:28:58.602 clic en catálogo
08:29:00.611 clic en inventario
08:29:05.611 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:03 a.m."
08:29:05.615 clic en la casilla
08:29:07.620 clic en la casilla
08:29:14.620 document.querySelector(".actualizado").textContent → "Actualizado a las 2:29:13 a.m."
```

Логът на сървъра през тези двайсет и една секунди:

```text
08:28:53.138 GET /api/estados cancelada por el cliente
08:28:53.440 GET /api/estados 200
08:28:58.612 GET /api/servicios/cat%C3%A1logo cancelada por el cliente
08:28:58.814 GET /api/servicios/cat%C3%A1logo 200
08:29:00.611 GET /api/servicios/inventario cancelada por el cliente
08:29:00.813 GET /api/servicios/inventario 200
08:29:03.443 GET /api/estados 200
08:29:13.443 GET /api/estados 200
```

Отчетът пристигна в 53.440, 03.443 и 13.443: на всеки десет секунди с разлика от три хилядни, сякаш никой не е пипал нищо. Шест кликвания, нула рестартирания на периодичното запитване. А редът „Actualizado a las …“ напредна от 2:28:53 на 2:29:03 и на 2:29:13, следвайки всеки отчет (помни, че това е местният час на браузъра). Двете двойки за детайлите са тези от 3.4: `key`, която монтира нов панел за всяка услуга.

#### 3.6.3 Какво не е `useEffectEvent`

Изкушаващо е да видиш в `useEffectEvent` начин да извадиш от списъка всичко, което пречи. Документацията го забранява съвсем ясно: не използвай `useEffectEvent`, за да избегнеш декларирането на зависимости на своя Effect; това скрива грешки и прави кода по-труден за разбиране. Използвай го само за логика, която наистина е събитие, задействано от Effect; ако една стойност трябва да кара Effect-а да се изпълни отново, запази я като зависимост ([React, „useEffectEvent“](https://react.dev/reference/react/useEffectEvent)). Обявлението на React 19.2 повтаря идеята: не е нужно всичко да се обвива в `useEffectEvent`, нито той да се използва само за да се заглуши предупреждението, защото това може да доведе до грешки ([React, „React 19.2“](https://react.dev/blog/2025/10/01/react-19-2)).

Проверката за `revisor` е въпросът от 3.5.3. Ако обвиеш `cadaMs` в Effect Event, за да го извадиш от списъка, в деня, в който някой смени интервала от 10 на 5 секунди, Effect-ът няма да разбере, и ще си обратно в сцената от Урок 0. `cadaMs` е част от синхронизирането. `alRecibir` — не.

Справочникът поставя освен това три ограничения. Това е hook, така че се извиква на първо ниво на компонента или на твоя hook, никога вътре в `if` или в цикъл. Effect Events се извикват само от Effect-и или от други Effect Events: не по време на рисуването, и не се подават на други компоненти, нито на други hooks. А идентичността им се променя **нарочно** при всяко рисуване ([React, „useEffectEvent“](https://react.dev/reference/react/useEffectEvent)). Последното обяснява какво се случва, ако по навик сложиш `avisarRecibido` в списъка. Линтерът го спира (измерено в копие):

```text
~/curso-react/revisor/src/reporte/useReporte.ts
  44:32  warning  Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `avisarRecibido` from the list  react-hooks/exhaustive-deps
```

Ако го пренебрегнеш, тъй като идентичността му се променя при всяко рисуване, ще имаш отново безкрайния цикъл от 3.5.2. Справочникът на `useEffectEvent` казва, че линтерът следи за спазването на тези ограничения, а обявлението на 19.2 изисква нова версия на `eslint-plugin-react-hooks`, за да не се опитва линтерът да вкарва Effect Events в списъка; версия 7.1.1 от курса ги познава, както току-що видя.

### 3.7 Кога не е нужен Effect

#### 3.7.1 Два излишни Effect-а

Вече имаш три Effect-а в `revisor` и трите синхронизират нещо отвън: сървъра (два пъти) и документа. Сега е ред на другата половина от принципа: това, което **не** отива в Effect. Документацията на React му посвещава цяла страница и започва с две изречения, които струват колкото целия урок: не ти трябват Effects, за да трансформираш данни за рисуването, и не ти трябват Effects, за да обработваш събития от потребителя ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)).

Втората фигура събира двете грешки в един файл. Тя не е част от `revisor`, но много прилича на това, което някой би написал в него: обобщение, което брои повредите в Effect, и бутон, който при кликване вдига флаг, за да изпрати Effect повторния опит.

```tsx
// fig03_02.tsx
import { useEffect, useState } from "react";

type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const [fallas, establecerFallas] = useState(0);

  useEffect(() => {
    establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
  }, [estados]);

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  const [pedido, establecerPedido] = useState(false);

  useEffect(() => {
    if (pedido) {
      void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
      establecerPedido(false);
    }
  }, [pedido, nombre]);

  return (
    <button type="button" onClick={() => establecerPedido(true)}>
      Volver a revisar
    </button>
  );
}
```
```bash
$ npx eslint fig03_02.tsx

~/curso-react/figuras/fig03_02.tsx
  10:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:10:5
   8 |
   9 |   useEffect(() => {
> 10 |     establecerFallas(estados.filter((estado) => estado.tipo === "falla").length);
     |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  11 |   }, [estados]);
  12 |
  13 |   return <p>{fallas} servicios con falla</p>;              react-hooks/set-state-in-effect
  22:7  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/figuras/fig03_02.tsx:22:7
  20 |     if (pedido) {
  21 |       void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
> 22 |       establecerPedido(false);
     |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  23 |     }
  24 |   }, [pedido, nombre]);
  25 |  react-hooks/set-state-in-effect

✖ 2 problems (2 errors, 0 warnings)
```

(Тестовият сървър на този урок няма път за повторен опит; тук фигурата само се проверява с линтера, никога не се изпълнява.) Съобщението е същото, което Урок 0 те научи да разчиташ, и то обяснява всичко: един Effect трябва да обновява външни системи със състоянието на React или да се абонира за външна система и да променя състоянието, когато тази система отговори. Нито един от двата случая във фигурата не прави това.

**Първият изчислява.** `fallas` може да се получи от `estados` в момента на рисуване. Пазенето му в състояние и копирането му с Effect произвежда рисуване със старото число, Effect, който го поправя, и още едно рисуване с правилното число: едно изхвърлено рисуване и един миг, в който екранът казва нещо невярно. Документацията го поставя като правило: когато нещо може да се изчисли от съществуващите свойства или състояние, не го слагай в състоянието; изчисли го при рисуване ([React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect)). Това е третото правило за формата от Урок 2, „не пази това, което може да се изчисли“, видяно от страната на Effect-ите. И това е, което `revisor` вече прави в `Panel`: `const fallas = … contarFallas(…)`, константа, а Effect-ът само я копира в документа.

**Вторият реагира на клик.** Повторният опит не се предизвиква от това, че бутонът се рисува, а от това, че човекът го натиска. Документацията използва почти същия пример — покупка на продукт: не искаш да го купиш два пъти, и точно затова това не трябва да е в Effect, защото покупката не се предизвиква от рисуването, а от конкретно взаимодействие, и трябва да се изпълни само когато човекът натисне бутона ([React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects)). Помисли и за `StrictMode`: ако заявката живееше в Effect без флаг, допълнителният цикъл по време на разработка би изпратил повторния опит два пъти. Поправката е тя да се премести в обработчика на кликването, където флагът престава да съществува. Упражнение 4 те кара да го направиш.

#### 3.7.2 Джобната таблица

Страницата „You Might Not Need an Effect“ изброява дванайсет ситуации, в които хората пишат излишен Effect. Тези, които вече се появиха в `revisor`, и къде живее всяка от тях:

| Изкушение | Къде всъщност отива | В `revisor` |
|---|---|---|
| обновяване на състояние въз основа на друго | изчислява се при рисуване | `fallas` в `Panel`, `visibles` и `existe` в `ContenidoReporte` |
| нулиране на цялото състояние при промяна на свойство | `key` | `<PanelDetalle key={seleccionado}>` |
| изпращане на заявка `POST` при клик | обработчикът на събитието | в `revisor` все още няма такава; планът я предвижда за повторния опит и регистрацията |
| съобщаване на родителя, че нещо се е променило | извиква се функцията на родителя в същото събитие | `alSeleccionar`, `alCambiar`, `alGuardarNota` |
| извличане на данни | това наистина е Effect, с почистване (или библиотека) | `useDetalle` и `useReporte` |

Обърни внимание на последния ред. Извличането на данни **наистина** е синхронизиране и затова `revisor` го прави в Effect. Но справочникът на `useEffect` е честен за ограниченията си: ръчното извличане на данни в Effects не работи на сървъра, склонно е да произвежда каскади (родителят извлича, рисува и тогава всяко дете извлича своето), не кешира нищо и изисква много повтарящ се код, за да се избегнат грешки като надпреварата; и препоръчва да се използва библиотека за кеширане от страната на клиента, сред тях TanStack Query ([React, „useEffect“](https://react.dev/reference/react/useEffect)). Вече написа този повтарящ се код два пъти: `useReporte` и `useDetalle` много си приличат. Според плана на курса оттам тръгва Урок 4.

#### 3.7.3 Това, което вече беше наред

Преди да продължиш, погледни какво `revisor` правеше добре, без никой да го е обяснил. Бутонът „Actualizar“ слага `cargando` в `recargar`, вътре в обработчика на кликването, и едва след това променя `intento`, за да се рестартира Effect-ът: състоянието на екрана го променя събитието, синхронизирането го прави Effect-ът. `cargarReporte` и `cargarDetalle` са функции на ниво модул, еднакви при всяко рисуване, така че `cargar` в списъка на `useReporte` не рестартира нищо. А `alSeleccionar` променя избора при кликването; никой не „наблюдава“ избора с Effect, за да направи нещо после. Всичко това е същият принцип, приложен, преди да има име.

## Грешката, която ще видиш

Урокът има една основна грешка — тази, която се появява при опит да се върнеш към „Cargando detalle…“ без `key`, — и две помощни, които вече видя в 3.5 и 3.6.

**Основната грешка: „нулиране на състоянието вътре в Effect-а“.** Махни `key` от `<PanelDetalle>` и, за да може карето да се върне към „Cargando detalle…“ при смяна на услугата, напиши `establecerCarga({ tipo: "cargando" })` като първи ред на Effect-а в `useDetalle`. Линтерът го отхвърля (измерено в копие):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/detalle/useDetalle.ts
  14:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

~/curso-react/revisor/src/detalle/useDetalle.ts:14:5
  12 |
  13 |   useEffect(() => {
> 14 |     establecerCarga({ tipo: "cargando" });
     |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  15 |     const control = new AbortController();
  16 |
  17 |     cargarDetalle(nombre, control.signal).then(  react-hooks/set-state-in-effect
```

(В това изпълнение имаше втора нарочна промяна в друг файл, тази от 3.6.3, и затова крайното обобщение каза `✖ 2 problems (1 error, 1 warning)`; тук е показан само блокът на тази грешка.) Разчита се отгоре надолу: файлът, ред 14 и колона 5, името на грешката, общото обяснение (същото като във фигура 2), кодът със стрелка, която сочи извикването, и накрая името на правилото, `react-hooks/set-state-in-effect`. Това е **грешка**, а не предупреждение: спира `npm run lint`, дори да нямаше `--max-warnings 0`.

Поправката не е да се заглуши правилото, нито да се премести извикването на място, където линтерът не го вижда (например в `setTimeout` от нула милисекунди вътре в Effect-а, което е същото изхвърлено рисуване, само че скрито). Поправката е да се запиташ какво искаш да кажеш. Искаш да кажеш „когато услугата се смени, карето започва от нула“. Това в React се пише с `key` (3.3.4), а Effect-ът остава чист, защото вече няма какво да поправя.

**Предупреждението за липсващата зависимост.** `React Hook useEffect has a missing dependency: 'alRecibir'` (3.5.1). Поправката не е тя да се добави сляпо, защото това произведе безкрайния цикъл от шестнайсет заявки за пет секунди; не е и да се последва предложението в края на съобщението и функцията да се обвие в `useCallback` в родителя. Тя е да се запиташ дали тази функция е част от синхронизирането. Ако не е — `useEffectEvent`.

**Effect Event в списъка.** `Functions returned from useEffectEvent must not be included in the dependency array` (3.6.3). Поправката е тази, която казва съобщението: да се махне. Идентичността му се променя нарочно при всяко рисуване.

## Какво се прави погрешно

**Мислене в „при монтиране“.** Писането на `useEffect(() => { … }, [])` с идеята „това се изпълнява веднъж, когато се зареди“ води до Effect-и без почистване, а `StrictMode` ги издава с допълнителния си цикъл. Мисли в цикли на започване и спиране на синхронизирането.

**Извличане на данни без почистване.** Старият отговор пристига късно и записва върху правилния. Това, че `key` го прикрива на един екран, не го поправя в hook-а, а заявката пътува изцяло, за да бъде изхвърлена.

**Третиране на прекъсването като грешка.** Без `if (control.signal.aborted) return;` прекъсването от почистването се изобразява като повреда: по време на разработка, заради допълнителния цикъл на `StrictMode`, при всяка услуга, която избереш (измери го в 3.2.3); без `key` — и при всяка смяна на услугата. Прекъсването е почистването, което работи.

**Нулиране на състоянието със `setState` вътре в Effect-а.** Произвежда изхвърлено рисуване, а линтерът го отхвърля. За да нулираш цялото състояние на компонент, когато се смени това, което показва, използвай `key`.

**Заглушаване на `exhaustive-deps`.** `// eslint-disable-next-line react-hooks/exhaustive-deps` оставя списъка да лъже и гарантира остарели стойности по-нататък. Ако предупреждението те дразни, кодът има проблем в дизайна.

**Вярата, че зеленият линтер означава „правилно“.** Добавянето на `alRecibir` в списъка остави линтера чист, а таблото — да иска отчет на всеки 300 ms. Линтерът гарантира, че списъкът казва истината, а не че истината ти отърва.

**Използване на `useEffectEvent`, за да се скрият зависимости.** Ако една стойност трябва да рестартира синхронизирането, като `cadaMs`, тя отива в списъка. `useEffectEvent` е за това, което се случва по време на синхронизирането, а не за това, което го определя.

**Изчисляване в Effect.** Копирането в състояние на нещо, което може да се изчисли при рисуване, произвежда едно рисуване в повече и миг на невярен екран. Изчисли го като константа.

**Изпращане на заявка при клик от Effect.** Кликването е събитие; заявката отива в неговия обработчик. В Effect `StrictMode` я изпраща два пъти по време на разработка, а всяка промяна в зависимостите я повтаря.

**Махане на `StrictMode`, защото удвоява заявките.** Допълнителният цикъл е доказателството, че почистването съществува, а в продукция той не се случва.

## Упражнения

### Упражнение 1 — Разчети лога, преди да го видиш

С непроменената контролна точка, при работещи тестов сървър и `npm run dev`, ще отвориш страницата, ще изчакаш да се зареди, ще избереш `catálogo`, ще изчакаш две секунди и ще избереш `inventario`. **Преди да го направиш**, запиши в дневника си колко реда ще добави сървърът за двата детайла, в какъв ред и кои ще казват `cancelada por el cliente`. После го направи и сравни. Би ли се променило нещо, ако избереш `inventario` само 100 ms след `catálogo`?

### Упражнение 2 — Очевидният експеримент и пълният

В копие на `revisor` махни само реда `return () => control.abort();` от `useDetalle`. Избери `pagos` и веднага след това `inventario`. Запиши какво показва карето след две секунди и какво записва сървърът. После махни и `key={seleccionado}` от `ContenidoReporte` и повтори. Обясни в три изречения защо първият експеримент не показва надпреварата, а вторият я показва. Предупреждава ли линтерът в някой от двата?

### Упражнение 3 — Флагът вместо прекъсването

Препиши `useDetalle` във формата с флаг от 3.3.2 (`let ignorar = false` и почистване, което го прави `true`), без `AbortController`. Провери, че `npm run lint` не предупреждава за нищо и че без `key` надпреварата остава поправена на екрана. **Предвиди** какво се променя в лога на сървъра при избор на `pagos` и после на `inventario`, и го провери. Възстанови файла, когато приключиш.

### Упражнение 4 — Поправи фигура 2 без Effects

Поправи `fig03_02.tsx` така, че `npx eslint fig03_02.tsx` да не съобщава нищо, **без** да заглушаваш никое правило и без да запазваш нито един `useEffect`. `Resumen` трябва да продължи да показва броя на повредите, а `BotonReintento` трябва да продължи да изпраща `POST` при кликване.

## Решения

### Решение 1

При избора на `catálogo` `key` монтира нов `PanelDetalle` и `StrictMode` изпълнява допълнителния цикъл: един ред `GET /api/servicios/cat%C3%A1logo cancelada por el cliente` и около 200 ms по-късно `GET /api/servicios/cat%C3%A1logo 200`. Две секунди по-късно, при избора на `inventario`, се случва същото: `cancelada` и `200`. Четири реда, два отменени, в реда cancelada, 200, cancelada, 200. Точно така излезе при измерване с полето за отмятане, `catálogo` и `inventario` в изпълнението от 3.6.2: `08:28:58.612 … cat%C3%A1logo cancelada por el cliente`, `08:28:58.814 … cat%C3%A1logo 200`, `08:29:00.611 … inventario cancelada por el cliente` и `08:29:00.813 … inventario 200`. Обърни внимание, че името с ударение пътува кодирано (3.2.2). Ако избереш `inventario` само 100 ms по-късно, истинската заявка за `catálogo` още не би завършила (отнема 200 ms), така че и тя би излязла `cancelada`: би видял три реда `cancelada` и само един `200` — този за `inventario`. Това е поправената надпревара, същата, която 3.2.3 измери с `pagos`. Последният случай не беше измерен; това е предвиждането, което следва от правилото, а проверката му е твоя работа. И помни уточнението от Урок 0: редът `cancelada` от допълнителния цикъл се появява само ако връзката е успяла да стигне до сървъра преди прекъсването. Ако на твоята машина липсва някой, това не значи, че `StrictMode` е изключен.

### Решение 2

Това е експериментът, който 3.3.3 измери. Само с махнато почистване карето казва след две секунди „Disponible: HTTP 200 en 118 ms“ — правилната стойност за `inventario`; логът показва два `GET /api/servicios/inventario 200` и един `GET /api/servicios/pagos 200`, който пристигна почти секунда след първия за `inventario` (и още един `pagos`, който остана чакащ до затварянето на раздела, по причината, обяснена в 3.4.2). Надпреварата се случи в мрежата, но не и на екрана, защото `key` демонтира панела на `pagos` и неговият отговор записа в компонент, който вече не съществуваше. Без `key` и без почистване карето казва след две секунди „En falla: HTTP 503“ под „inventario“: същият компонент получи стария отговор. Линтерът не предупреждава в нито един от двата случая: липсващото почистване не нарушава никое правило, видимо в текста, а махането на `key` — също. Затова този урок измерва в браузъра, а не само с ESLint.

### Решение 3

Един правилен начин:

```ts
// useDetalle con bandera (fragmento para el ejercicio)
useEffect(() => {
  let ignorar = false;

  cargarDetalle(nombre, new AbortController().signal).then(
    (detalle) => {
      if (!ignorar) {
        establecerCarga({ tipo: "listo", detalle });
      }
    },
    (error: unknown) => {
      if (ignorar) {
        return;
      }

      const detalle = error instanceof Error ? error.message : "falló la carga";
      establecerCarga({ tipo: "error", detalle });
    },
  );

  return () => {
    ignorar = true;
  };
}, [nombre]);
```

Екранът остава защитен по същия начин: старият отговор пристига, но флагът на неговия цикъл вече е `true` и той не записва нищо. Това, което се променя, е логът: вече няма нито един `cancelada por el cliente` (нито този на `StrictMode`, нито този от смяната на услугата), а на тяхно място се появяват пълни отговори `200` на заявки, които никой не използва, сред тях този за `pagos` — 1,5 секунди работа на сървъра, изхвърлени. Това е разликата от 3.3.2: флагът пренебрегва, прекъсването освен това прекъсва. Курсът запазва прекъсването. Забележи, че `cargarDetalle` продължава да иска сигнал; тук му се дава такъв, който никой не прекъсва.

### Решение 4

Нито един от двата компонента не синхронизира нищо с външна система, така че нито един не се нуждае от Effect:

```tsx
// fig03_02.tsx corregida (fragmento)
type Estado = { readonly nombre: string; readonly tipo: "disponible" | "falla" };

export function Resumen({ estados }: { readonly estados: readonly Estado[] }) {
  const fallas = estados.filter((estado) => estado.tipo === "falla").length;

  return <p>{fallas} servicios con falla</p>;
}

export function BotonReintento({ nombre }: { readonly nombre: string }) {
  function reintentar(): void {
    void fetch(`/api/servicios/${encodeURIComponent(nombre)}/reintento`, { method: "POST" });
  }

  return (
    <button type="button" onClick={reintentar}>
      Volver a revisar
    </button>
  );
}
```

`fallas` е константа, изчислявана при всяко рисуване, и изчезват състоянието, Effect-ът и изхвърленото рисуване. `POST` живее в обработчика на кликването, и изчезват флагът `pedido` и рискът да се изпрати два пъти. Обърни внимание на `encodeURIComponent`: това е същото правило от 3.2.2, а фигурата вече го съдържаше. С тази версия `npx eslint` не съобщава нищо. Забележи, че поправеният файл дори не импортира `useEffect`, нито `useState`: най-сигурният начин да не сбъркаш с Effect е да не го пишеш, когато не е нужен.

## Как разбирам, че съм успял

- [ ] `npm run lint` завършва, без да изписва никакъв проблем, а в целия `src/` няма нито един коментар `eslint-disable`.
- [ ] `npm run build` завършва с `✓ built` и оставя в `dist/assets/` файл `index-CTkBRgQQ.js`, със същото име като контролната точка на курса (ако проектът ти е идентичен байт по байт; ако си променил текст, името се променя и това не е грешка).
- [ ] При работещ тестов сървър `curl` към `/api/servicios/pagos` отнема около 1,5 s и отговаря с `200`, а `curl` към `/api/servicios/nada` отговаря с `404` и `{"detalle":"no existe el servicio nada"}`.
- [ ] При отворено табло в `npm run dev` и две повреди в отчета разделът казва `(2) Revisor`.
- [ ] При избор на `pagos` и веднага след това `inventario` карето накрая казва „Disponible: HTTP 200 en 118 ms“, а в лога истинската заявка за `pagos` се появява като `cancelada por el cliente`.
- [ ] В копие без `key` и без `control.abort()` възпроизведе надпреварата: карето накрая казва „En falla: HTTP 503“ под „inventario“. И можеш да обясниш защо махането само на `control.abort()` не е достатъчно, за да се види.
- [ ] При отворена страница в продължение на двайсет секунди и няколко кликвания върху полето за отмятане „Solo fallas“ логът записва по един `GET /api/estados 200` на всеки десет секунди, нито един повече.
- [ ] Можеш да кажеш за всеки от трите Effect-а на `revisor` с коя външна система се синхронизира, какво прави при започване и какво отменя почистването му.
- [ ] Записа в своя [дневник](bitacora.md) надпреварата, която възпроизведе, безкрайния цикъл от заявки, предизвикан от сляпото подчинение на линтера, и какво се промени в начина ти да разчиташ `useEffect`.

## Обобщение

Отговори, без да гледаш урока:

1. Кои две функции има един Effect и какво прави всяка от тях? Защо документацията изисква да се мисли от гледна точка на Effect-а, а не на компонента?
2. Какво е надпреварата между отговорите? Защо отговорът за `pagos` може да пристигне след този за `inventario`, въпреки че е поискан по-рано?
3. Каква е разликата между прекъсването на заявката и пренебрегването на резултата ѝ? Какво вижда сървърът във всеки от случаите?
4. Защо `revisor` нулира детайлите с `key`, а не със `setState` вътре в Effect-а? Какво казва линтерът, ако опиташ?
5. Какво прави `StrictMode` с един Effect по време на разработка и какво е правилото, по което да разбереш дали твоят Effect минава тази проверка?
6. Защо добавянето на `alRecibir` в списъка остави линтера зелен, а таблото — да иска отчет на всеки 300 ms? Каква роля играе `Object.is`?
7. Какво прави `useEffectEvent`, откъде може да се извиква и защо не служи за изваждане на `cadaMs` от списъка?
8. Дай два примера за код, който не трябва да е в Effect, и кажи къде отива всеки от тях.

## За допълнително четене

- [React, „Synchronizing with Effects“](https://react.dev/learn/synchronizing-with-effects): какво е Effect, почистването, защо `StrictMode` монтира два пъти по време на разработка, надпреварата между отговорите и примерът с покупката, която не отива в Effect. Посетено на 21 октомври 2026 г.
- [React, „Lifecycle of Reactive Effects“](https://react.dev/learn/lifecycle-of-reactive-effects): започване и спиране на синхронизирането, мисленето от гледна точка на Effect-а, реактивните стойности, „не можеш да избираш зависимостите си“ и защо линтерът не се заглушава. Посетено на 21 октомври 2026 г.
- [React, „Separating Events from Effects“](https://react.dev/learn/separating-events-from-effects): реактивна и нереактивна логика, Effect Events и техните ограничения. Посетено на 21 октомври 2026 г.
- [React, „Removing Effect Dependencies“](https://react.dev/learn/removing-effect-dependencies): функции и обекти като зависимости, списъкът, който описва кода, и изходите за премахване на зависимост. Посетено на 21 октомври 2026 г.
- [React, „You Might Not Need an Effect“](https://react.dev/learn/you-might-not-need-an-effect): изчисляване при рисуване, нулиране на състоянието с `key`, заявките при събитие и надпреварата при извличане на данни. Посетено на 21 октомври 2026 г.
- [React, „useEffect“](https://react.dev/reference/react/useEffect): сигнатурата, как се сравняват зависимостите с `Object.is`, допълнителният цикъл на `StrictMode` и ограниченията на ръчното извличане на данни. Посетено на 21 октомври 2026 г.
- [React, „useEffectEvent“](https://react.dev/reference/react/useEffectEvent): какво прави, ограниченията му и предупреждението срещу използването му за скриване на зависимости. Посетено на 21 октомври 2026 г.
- [React, „React 19.2“](https://react.dev/blog/2025/10/01/react-19-2): обявлението на `useEffectEvent` от 1 октомври 2025 г. и нуждата от нова версия на линтера. Посетено на 21 октомври 2026 г.
- [React, „Preserving and Resetting State“](https://react.dev/learn/preserving-and-resetting-state): `key` като част от позицията и състоянието, което се унищожава при премахване на компонент. Посетено на 21 октомври 2026 г.
- [React, „set-state-in-effect“](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect): какво отхвърля правилото и защо. Посетено на 21 октомври 2026 г.
- [React, „<title>“](https://react.dev/reference/react-dom/components/title): компонентът `<title>` на React 19, който се поставя в `<head>`, и предупреждението да не се рисуват два едновременно. Посетено на 21 октомври 2026 г.
- [MDN, „AbortController: abort() method“](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort): какво прекъсва `abort()` и изключението `AbortError`. Посетено на 21 октомври 2026 г.
- [MDN, „Document: title property“](https://developer.mozilla.org/en-US/docs/Web/API/Document/title): четене и промяна на заглавието на документа. Посетено на 21 октомври 2026 г.

### Термини от този урок

| Термин | Какво означава |
|---|---|
| Effect | код, който се изпълнява след рисуването, за да синхронизира компонент с нещо извън React: сървър, документа, таймер |
| почистване | функцията, която връща един Effect; отменя това, което Effect-ът е започнал, преди следващия цикъл и при премахване на компонента |
| цикъл на Effect | започване на синхронизирането и после спирането му; повтаря се всеки път, когато нещо от списъка се промени |
| зависимости | списъкът с реактивни стойности, които Effect-ът използва; описва кода, не се избира |
| реактивна стойност | свойство, състояние или всяка стойност, изчислена вътре в компонента, която може да се променя между рисуванията |
| надпревара между отговорите | две заявки във въздуха, които пристигат в ред, различен от реда на изпращане, и старата записва върху новата |
| `AbortController` | обект на браузъра, който позволява заявка `fetch` да бъде отменена отвън чрез неговия сигнал |
| остаряла стойност (*stale*) | стойността от предишно рисуване, която Effect продължава да използва, защото списъкът му не я споменава |
| Effect Event | функция, създадена с `useEffectEvent`: извиква се от Effect, винаги вижда най-новите стойности и не влиза в списъка със зависимости |

---

**Следващ:** [Урок 4 — Състояние на сървъра с TanStack Query](04-estado-del-servidor.md)
