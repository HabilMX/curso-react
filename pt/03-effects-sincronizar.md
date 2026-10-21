# Lição 3 — Effects: sincronizar, não «quando carregar»

*São 9h52 e o plantão da manhã confere o painel antes da reunião das 10h. No `revisor` novo já dá para escolher um serviço e ver seu detalhe. A operadora clica em `pagos`, se arrepende na mesma hora e escolhe `inventario`. Aparece o cabeçalho «inventario» e, embaixo, «Disponible: HTTP 200 en 118 ms». Ela respira. Um segundo depois, sem que ninguém toque em nada, o mesmo quadro muda para «En falla: HTTP 503». Ela liga para a equipe de inventário, que passa quinze minutos revisando seus servidores e não encontra nada. O inventário nunca falhou. O que apareceu foi a resposta de `pagos`, mais lenta, que chegou tarde e foi escrita por cima da de `inventario`. Ninguém tinha escrito um erro no sentido de sempre: cada linha do código fazia o que dizia. Faltava uma linha que dissesse o que fazer quando a pergunta já não importa. Esta lição escreve essa linha e explica por que ela é necessária.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 3.3 e 3.4)

**O que se constrói:** um painel de detalhe que pede ao servidor os dados do serviço escolhido e se reinicia sozinho quando outro é escolhido; o título da aba com o número de falhas, `(2) Revisor`; e a linha «Actualizado a las …», que avisa quando chegou o último relatório sem reiniciar o *polling* a cada 10 segundos

**O que se aprende:** o ciclo de um Effect: começar e parar de sincronizar; a limpeza; a condição de corrida (*race condition*) entre respostas, reproduzida e corrigida; o `StrictMode` como teste gratuito de que a limpeza existe; dependências que descrevem o código (**o linter não se silencia**); `useEffectEvent`; os casos em que não se precisa de um Effect

**De onde a gente vem.** Da [Lição 2](02-estado-instantanea-forma.md). O `revisor` já tem a caixa de seleção «Solo fallas», os nomes dos serviços como botões com `aria-pressed`, uma nota por serviço e um quadro de detalhe, `DetalleSeleccion`, que é **calculado** a partir da lista: não pergunta nada ao servidor, só volta a mostrar o que o relatório já trazia. Desde a [Lição 0](00-un-proyecto-de-verdad.md), o painel tem um Effect, o de `useReporte`, que pede `GET /api/estados` a cada 10 segundos e que o `StrictMode` monta duas vezes em desenvolvimento. Aquela lição mostrou o par «cancelada por el cliente» + «200» no registro do servidor e prometeu que aqui isso seria explicado a fundo. O trabalho acontece em `~/curso-react/revisor/`, que no início é igual ao ponto de controle da Lição 2.

**O que esta lição não faz.** Não acrescenta rotas do navegador: o detalhe continua aparecendo dentro da mesma página, abaixo da lista, e o endereço `/servicios/pagos` chega na [Lição 5](05-rutas-url-como-estado.md). Não troca a busca manual de dados por uma biblioteca: aqui o Effect que pede o detalhe é escrito à mão, com sua limpeza, para entender que problema ele resolve; segundo o plano do curso, na [Lição 4](04-estado-del-servidor.md) esse mesmo trabalho passaria para o TanStack Query. Também não tem testes automatizados: eles chegam na [Lição 8](08-pruebas-de-componentes.md). E não usa `useMemo`, `useCallback` nem `memo`: o curso não os apresenta sem uma medição que os peça, e em 3.6 vai dar para ver que o problema que normalmente se «tapa» com `useCallback` tem aqui uma solução mais direta.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` do ponto de controle. Nesta lição não se reinstalou em um contêiner Linux: as execuções do curso deram os mesmos nomes de arquivo em `dist/` no macOS e em um contêiner `node:24.22.0` para todos os pontos de controle, e o build do ponto de controle desta lição deu aqui esse mesmo nome (`index-CTkBRgQQ.js`). Nada do que se mostra depende do sistema operacional. O que se vê «no navegador» foi medido com o Chrome 155 em modo *headless* (`--headless`), conduzido pelo seu protocolo de depuração: um script abria a página, esperava, enviava cliques de mouse reais (os mesmos eventos que a mão produz) e lia o texto do quadro de detalhe. Os experimentos que quebram o código de propósito foram feitos em uma **cópia** do ponto de controle e, como na mesma máquina rodavam outros processos nas portas de sempre, essa cópia usou a 3103 para o servidor de prática, a 5103 para o Vite e a 9303 para o protocolo de depuração do Chrome. Na máquina de quem segue a lição são a 3100 e a 5173, e nada mais muda. Uma primeira leva de execuções no navegador foi descartada e repetida por completo, porque outro processo da máquina usava a mesma porta de depuração e não dava para garantir que os cliques viessem só do script; as saídas mostradas são todas da segunda leva, e repetiram linha por linha o mesmo comportamento da primeira. Os horários do registro do servidor estão em UTC; a hora de «Actualizado a las …» é a hora local do navegador, que estava no fuso da Cidade do México (UTC−6), e por isso os dois relógios não coincidem. Os caminhos longos impressos pelo ESLint são mostrados a partir de `~/curso-react`. Os programas estão em [`programas/03-effects-sincronizar/`](../programas/03-effects-sincronizar): `revisor/` é o ponto de controle e as figuras estão ao lado dele.

## Ao terminar, vai ser possível

- Explicar com as próprias palavras o que cada um dos três Effects do `revisor` sincroniza (o *polling*, o detalhe e o título), o que o corpo de cada um faz e o que sua limpeza desfaz.
- Reproduzir a condição de corrida entre respostas em uma cópia do painel, lê-la no registro do servidor e corrigi-la com `AbortController` na limpeza.
- Explicar por que `<PanelDetalle key={seleccionado}>` reinicia o painel inteiro, e por que essa é a forma correta de voltar a «Cargando detalle…» em vez de um `setState` dentro do Effect.
- Ler no registro o par «cancelada por el cliente» + «200» produzido pelo `StrictMode` e dizer o que ele demonstra.
- Diante de um aviso de `exhaustive-deps`, mudar o código para que a lista de dependências diga a verdade, sem silenciar a regra, e reconhecer quando a verdade é que uma função não deve reiniciar o Effect.
- Usar `useEffectEvent` para ler a função mais recente a partir de um Effect sem que o Effect seja reiniciado, e nomear as duas coisas que o linter não deixa fazer com ela.
- Apontar em um componente um Effect que não é necessário (um cálculo ou a resposta a um clique) e movê-lo para o lugar que lhe corresponde.

## O porquê antes do como

Na Lição 2, o quadro de detalhe não perguntava nada. Mostrava o mesmo `EstadoPublico` que já vinha na lista. Isso tem uma vantagem enorme: não há como ele mostrar algo diferente da lista, porque ele é a lista. Mas a equipe de operação pediu mais: quantas vezes aquele serviço foi verificado e quando foi a última verificação. Esses dados não vêm no relatório. É preciso pedi-los ao servidor **por serviço**, e nesse momento o quadro deixa de ser um cálculo e vira uma conversa com algo que vive fora do React.

Basta fazer três perguntas a esse quadro para ver por que é preciso uma ferramenta.

**Quando o detalhe é pedido?** A resposta tentadora é «quando o componente carregar». Essa é a resposta que esta lição vem desmontar. O detalhe não é pedido «ao carregar»: é pedido **enquanto** o quadro mostra um serviço, e deixa de importar assim que ele mostra outro. Ao escolher `pagos`, a tela precisa estar de acordo com o servidor sobre `pagos`. Ao trocar para `inventario`, o acordo sobre `pagos` já não vale e começa um novo. Isso não é um evento que acontece uma vez; é uma **sincronização** que começa e termina.

**O que acontece com a pergunta antiga quando se faz uma nova?** O servidor de prática leva 1,5 segundo para responder o detalhe de `pagos` e 0,2 segundo para responder os demais. Ao escolher `pagos` e logo em seguida `inventario`, há duas perguntas no ar, e a que foi feita primeiro chega por último. Se ninguém disser à primeira que ela já não importa, quando chegar ela vai escrever seu resultado no quadro, por cima do certo. Foi isso o que o plantão da cena viu.

**Quem fica sabendo quando algo muda fora do React?** A aba do navegador tem um título. Se o painel pudesse colocar ali o número de falhas, `(2) Revisor`, o plantão veria mesmo estando em outra aba. Mas o título não faz parte da árvore do React; é uma propriedade do documento, `document.title`. Alguém precisa mantê-lo de acordo com o estado do painel, e devolvê-lo como estava quando o painel deixar de controlá-lo.

As três perguntas têm a mesma forma: há algo fora do React (o servidor, o documento, um temporizador) e a tela precisa estar de acordo com esse algo. É para isso que existe o Effect. A documentação do React o define assim: os Effects permitem executar código depois de renderizar para **sincronizar** o componente com algum sistema fora do React ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Repare no verbo. Não diz «executar código quando o componente aparece». Diz sincronizar. Este curso repete um princípio em todas as lições, e esta é a lição onde ele nasce: **um Effect serve para sincronizar com algo que está fora do React; não para calcular, não para reagir a um clique e não para «quando carregar».**

A lição tem sete partes: o que é um Effect, com o título da aba como exemplo (3.1); o detalhe pedido ao servidor e sua limpeza (3.2); a condição de corrida entre respostas, reproduzida e corrigida (3.3); o `StrictMode` como teste gratuito (3.4); as dependências que descrevem o código (3.5); `useEffectEvent` (3.6); e os casos em que não se precisa de um Effect (3.7). Isto é o que muda no projeto:

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

As marcas são as do curso: **+** arquivo novo, **~** arquivo modificado e **−** arquivo removido.

## Os conceitos

### 3.1 O que é um Effect: começar e parar de sincronizar

#### 3.1.1 Duas funções, não um momento

Comecemos pelo menor elemento do `revisor` novo: o título da aba. Este é o hook completo:

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

Um Effect são **duas funções** e uma lista. A primeira é a que se passa para `useEffect`: diz como **começar** a sincronizar. Aqui, guarda o título que havia e coloca o novo. A segunda é a que essa primeira **retorna**, a limpeza: diz como **parar** de sincronizar. Aqui, devolve o título que havia. A lista, `[titulo]`, diz de quais valores a sincronização depende.

A documentação do React insiste em uma forma de pensar que custa no começo: um Effect só pode fazer duas coisas, começar a sincronizar algo e, depois, parar de sincronizá-lo ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)). A mesma página diz que convém pensar do ponto de vista do Effect, e não do componente: «concentre-se sempre em um único ciclo de começar e parar por vez; não deveria importar se o componente está sendo montado, atualizado ou desmontado». Essa frase é a diferença entre este curso e as explicações que falam de `useEffect` como «o `componentDidMount` das funções». Não existe «ao montar» nem «ao desmontar». Existe um ciclo que começa e um ciclo que termina, e ele se repete toda vez que a lista diz que algo mudou.

Quando cada função roda? A referência de `useEffect` diz com precisão: o React executa a função de preparação quando o componente é confirmado na tela (o *commit* da Lição 1); quando as dependências mudam, executa primeiro a limpeza antiga, com os valores antigos, e depois a preparação nova, com os valores novos; e quando o componente é removido, executa a limpeza uma última vez ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Para comparar as dependências usa `Object.is`, que para números e textos compara o valor, e para objetos e funções compara **a identidade**: se é o mesmo objeto na memória, não o mesmo conteúdo. Guarde esse detalhe; em 3.5 ele é a causa de um problema sério.

Percorra o título do `revisor` com essa regra. Ao abrir a página, o relatório ainda não chegou, então `Panel` calcula o título `"Revisor"`. O Effect começa: guarda `"Revisor"` (o do `<title>` de `index.html`) e coloca `"Revisor"`. Chega o relatório com duas falhas e `Panel` calcula `"(2) Revisor"`. A lista mudou, então o React executa a limpeza antiga (devolve `"Revisor"`) e a preparação nova (guarda `"Revisor"` e coloca `"(2) Revisor"`). Cada ciclo deixa as coisas como as encontrou antes que o seguinte comece. É isso que faz a ordem não importar.

#### 3.1.2 No `revisor`

`Panel` usa o hook com um valor que ele **calcula ao renderizar**, não que guarda:

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

Repare em `fallas`. Não é estado: é uma constante calculada em cada render com `contarFallas`, a função pura da Lição 1. O Effect não calcula nada; só **copia** para o documento um valor que o React já conhece. Essa divisão de trabalho é a que vai aparecer em todos os Effects bons: o React calcula, o Effect sincroniza. Em 3.7 vai dar para ver o que acontece quando alguém a inverte. (`actualizadoEn` e o terceiro argumento de `useReporte` são explicados em 3.6.)

Isto é o que o Chrome *headless* leu em `document.title`, um segundo e meio depois de abrir o painel com o servidor de prática rodando:

```text
08:28:18.814 document.title = "(2) Revisor"
```

`document.title` é exatamente o que o nome diz: a propriedade que lê ou muda o título do documento, o que aparece na aba, e que além disso muda o conteúdo do elemento `<title>` ([MDN, «Document: title property»](https://developer.mozilla.org/en-US/docs/Web/API/Document/title)). O React não mexe nela por conta própria, porque `<title>` vive no `<head>` e o painel é renderizado dentro de `<div id="raiz">`. É, no sentido exato da definição, um sistema fora do React.

O React 19 traz também um componente `<title>` que pode ser renderizado de qualquer componente e que o React sempre coloca no `<head>` ([React, «<title>»](https://react.dev/reference/react-dom/components/title)). Com ele, o título deixaria de ser um sistema externo e não seria preciso um Effect. Aqui ele não é usado por um motivo concreto: `index.html` já traz seu `<title>Revisor</title>`, e essa mesma documentação adverte para renderizar um único `<title>` por vez, porque com dois o comportamento dos navegadores e dos mecanismos de busca fica indefinido. O Effect muda o título que já existe e o devolve como estava. Se um dia o título vivesse só no React (sem o de `index.html`), o `<title>` nativo seria a opção sem Effect; seu único requisito é que o filho seja um único texto, por exemplo ``{`(${fallas}) Revisor`}``.

Por que a limpeza devolve o título anterior em vez de deixá-lo como estiver? Porque o Effect precisa poder ser desfeito. Se amanhã o painel for renderizado em só uma de várias telas (o plano do curso prevê isso para a Lição 5), ao sair dela o título não deve continuar dizendo `(2) Revisor` em uma tela que não mostra falhas. Uma limpeza que «espelha» a preparação faz o hook funcionar sem saber onde vai ser usado.

### 3.2 O detalhe que se pede ao servidor

#### 3.2.1 A rota nova do servidor de prática

O servidor de prática passa para sua segunda versão. Ele não é explicado linha por linha (o curso é de frontend), mas convém saber que rota nova ele tem e o que responde: `GET /api/servicios/:nombre` retorna o detalhe de um serviço, ou um `404` se ele não existir. Leva 1,5 segundo para `pagos` e 0,2 segundo para os demais; essa diferença foi colocada de propósito, para que em 3.3 dê para reproduzir a condição de corrida. Pergunte com `curl` antes de misturá-lo com qualquer coisa:

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

(A execução foi feita na porta 3103, como explica «Sobre as execuções».) `revisiones` conta quantas vezes o relatório completo foi pedido desde que o servidor iniciou, e `ultimaRevision` é o horário da última vez. Como ninguém tinha pedido `GET /api/estados` ainda, eles saem em `0` e com o horário da inicialização.

`contrato.ts` acrescenta o tipo e sua guarda, igual a `esReportePublico` na Lição 0: o que chega pela rede é `unknown` até que se prove o contrário. O arquivo completo fica assim:

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

`esDetalleServicio` reutiliza `esEstadoPublico` para o campo `estado`: o detalhe traz dentro o mesmo `EstadoPublico` da lista, e é validado com a mesma guarda. Como o servidor de prática importa esses tipos, `tsc -b` verifica também que o servidor e a tela estejam de acordo.

#### 3.2.2 A fronteira de rede

A função que pede o detalhe segue o modelo de `cargarReporte`: uma única responsabilidade, a rede, e nada de React.

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

Dois detalhes. O primeiro é `encodeURIComponent(nombre)`. Um dos serviços se chama `catálogo`, com acento, e em um endereço os caracteres fora do alfabeto inglês viajam codificados; o registro do servidor o mostra como `GET /api/servicios/cat%C3%A1logo`, e o servidor o decodifica de volta. Se um dia um serviço se chamasse `a/b`, sem codificar a barra a rota mudaria. O segundo detalhe é o parâmetro `senal`, uma `AbortSignal`. A função não decide quando cancelar; só aceita que alguém, de fora, possa fazer isso. Esse «alguém» é a limpeza do Effect.

O que acontece quando alguém cancela? A MDN descreve `AbortController.abort()` assim: interrompe uma operação assíncrona antes que ela termine, e isso inclui as requisições `fetch`, a leitura do corpo delas e os *streams*; se não for dado um motivo, o motivo é uma exceção `DOMException` chamada `AbortError` ([MDN, «AbortController: abort() method»](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)). Resumindo: a promise retornada por `fetch` (ou a de `respuesta.json()`, se o corpo já estava sendo lido) é **rejeitada**. E o navegador corta a conexão, que é o que o servidor de prática registra como `cancelada por el cliente`.

#### 3.2.3 O Effect que pede o detalhe

Este é o coração da lição. Leia com a ideia de 3.1 na cabeça: um ciclo que começa e um que termina.

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

Começa: cria um `AbortController` **próprio deste ciclo**, pede o detalhe de `nombre` e passa o sinal dele. Quando chega a resposta, escreve `listo`; se falha, escreve `error`. Termina: cancela. E a lista diz `[nombre]`, porque `nombre` é a única coisa que vem de fora do Effect e muda entre renders.

A forma do estado é a regra da Lição 2: uma única união `CargaDetalle` com três casos, não três flags (`cargando`, `error`, `datos`) que poderiam se contradizer. É a mesma forma de `Carga` em `useReporte`.

Veja a linha `if (control.signal.aborted) return;`. Quando a limpeza cancela, a promise é rejeitada com `AbortError`. Sem essa linha, em desenvolvimento isso apareceria em cada serviço escolhido: o ciclo extra do `StrictMode` (3.4) cancela a primeira requisição, e a rejeição dela chega ao mesmo quadro que está na tela, porque o `StrictMode` limpa e prepara de novo o Effect **do mesmo componente**, que preserva seu estado. Isso foi medido em uma cópia sem essa linha, com o Chrome *headless*, escolhendo `pagos` e, quando já tinha carregado, `inventario`:

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

Um erro falso na tela durante 1,7 segundo com `pagos` e 0,5 com `inventario`, até que a resposta certa o substitui. O texto «signal is aborted without reason» é o do Chrome; outros navegadores escrevem outro. Em produção, sem o ciclo extra, isso não apareceria com este ponto de controle, porque a `key` desmonta o painel antigo e a rejeição dele não tem para quem escrever; mas sem `key` apareceria também a cada troca de serviço. Um cancelamento **não é um erro**: é a forma de este ciclo dizer «já não me importa». Por isso ele é reconhecido e ignorado. Repare no que se pergunta: não o tipo do erro, e sim se **o meu** controlador cancelou. Se o servidor cai e, ao mesmo tempo, o usuário troca de serviço, a pergunta correta é «este ciclo ainda está vigente?», não «que tipo de erro é este?».

E repare no que ele **não** faz: não escreve `establecerCarga({ tipo: "cargando" })` ao começar. Ao trocar de serviço, o quadro precisa voltar a «Cargando detalle…», mas quem faz isso não é o Effect. É a `key`, e o motivo ocupa toda a seção 3.3.4. Por enquanto, fique com a pista: o estado inicial é `{ tipo: "cargando" }`, e o único momento em que ele é usado é quando o componente nasce.

`establecerCarga` é chamado, sim, dentro do Effect, mas só nas funções passadas para `.then(...)`, ou seja, quando a resposta **chega de fora**. Essa é exatamente a forma que a Lição 0 mostrou como permitida: um Effect que se inscreve em algo externo e muda o estado quando esse algo responde.

O quadro usa o hook e renderiza os três casos:

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

Compare com o `DetalleSeleccion` da Lição 2, que este arquivo substitui. Aquele recebia o `estado` já resolvido e colocava `key={estado.nombre}` no `EditorNota` para que o rascunho não fosse arrastado de um serviço para outro. Este recebe só o `nombre` e o texto da nota salva, e o `EditorNota` já não leva `key`. Não é descuido: a `key` subiu um andar, para o `PanelDetalle` inteiro, e dali reinicia tudo o que há dentro, inclusive o editor. Os textos «Cargando detalle…» com `role="status"` e o erro com `role="alert"` seguem o costume de acessibilidade do curso: um leitor de tela anuncia as mudanças dessas duas regiões sem que a pessoa precise procurá-las.

Por último, `ContenidoReporte` monta o quadro:

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

A seleção continua sendo o identificador, `seleccionado: string | null`, como a Lição 2 pedia. `existe` é **calculado**: se o serviço escolhido sumir da lista no relatório seguinte, o quadro vai embora sozinho, sem que ninguém precise se lembrar de limpar a seleção. E ali está, em uma linha, a peça que faz metade do trabalho desta lição: `key={seleccionado}`.

Com tudo junto, isto é o que o painel faz ao escolher `pagos` e, 300 milissegundos depois, `inventario` (medido com o Chrome *headless* sobre o ponto de controle sem alterações):

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

Meio segundo depois do segundo clique o quadro já mostra `inventario`, e dois segundos depois, quando a resposta de `pagos` já teria tido tempo de sobra para chegar, continua dizendo o correto. E este é o registro do servidor durante todo o teste, desde que a página foi aberta:

```text
08:28:17.462 GET /api/estados cancelada por el cliente
08:28:17.763 GET /api/estados 200
08:28:18.836 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/pagos cancelada por el cliente
08:28:19.146 GET /api/servicios/inventario cancelada por el cliente
08:28:19.347 GET /api/servicios/inventario 200
```

Seis linhas, e cada uma tem uma causa que já dá para nomear. As duas primeiras são o par do `StrictMode` do relatório, o mesmo da Lição 0. A terceira é o primeiro ciclo do detalhe de `pagos`, que o `StrictMode` começou e limpou imediatamente (3.4). A quarta é o segundo ciclo de `pagos`, o de verdade, cancelado 310 milissegundos depois porque `inventario` foi escolhido: **essa** é a limpeza corrigindo a condição de corrida. A quinta e a sexta são o par do `StrictMode` de `inventario`, cujo quadro nasceu de novo por causa da `key`. Nenhuma resposta de `pagos` chegou ao painel, porque nunca terminou.

### 3.3 A condição de corrida entre respostas

#### 3.3.1 A condição de corrida em miniatura

Antes de quebrar o `revisor`, veja a condição de corrida isolada, sem servidor, sem rede e sem `key`. A primeira figura monta duas versões do mesmo componente em um DOM de teste. As duas pedem um detalhe com uma função falsa que leva 300 ms para `pagos` e 20 ms para os demais. A única diferença é que uma tem limpeza e a outra não. Para cada uma se pede `pagos` e, imediatamente, `inventario`:

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

As duas versões mostram o correto aos 100 ms. A diferença aparece depois. **Sem limpeza**, aos 500 ms o parágrafo diz `inventario: detalle de pagos`: o cabeçalho é de um serviço e os dados são de outro. É a cena da lição em quatro palavras. **Com limpeza**, a troca de `pagos` para `inventario` executou a limpeza do primeiro ciclo, que cancelou a requisição de `pagos`; a promise dela foi rejeitada (por isso aparece a linha entre parênteses, impressa pelo handler de rejeição) e nunca chegou a chamar `establecerTexto`.

Por que a resposta antiga vence? Porque as duas perguntas saíram quase ao mesmo tempo e cada uma chega quando chega. A documentação do React chama isso exatamente assim: são erros de **condição de corrida**, porque duas operações assíncronas «competem» entre si e podem chegar em uma ordem inesperada ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). A referência de `useEffect` resume em uma frase que vale memorizar: as respostas da rede podem chegar em uma ordem diferente da ordem em que foram enviadas ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Nenhuma linha está errada; o que falta é uma linha que diga o que fazer com a pergunta que já não importa.

#### 3.3.2 Cancelar ou ignorar

A documentação do React dá duas formas de limpar um Effect que busca dados: «se o Effect busca algo, a função de limpeza deve **cancelar** a requisição ou **ignorar** seu resultado» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Os exemplos dela usam a segunda, com uma variável local:

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

A flag impede que a resposta antiga escreva o estado, e a mesma página diz que uma flag explícita é a forma mais confiável de corrigir esse tipo de problema. Dá também o porquê: depois do `fetch` podem ser encadeados mais passos assíncronos ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). O cancelamento só detém o que escuta o sinal; a flag detém qualquer escrita, venha de onde vier. O `revisor` usa a outra forma, `AbortController`, por três motivos concretos. O primeiro: o `revisor` já a usava desde a lição 9 de TypeScript, em `useReporte`, e convém que os dois hooks se pareçam. O segundo: cancelar não só ignora o resultado, **corta a conexão**, e o servidor para de trabalhar em uma resposta que ninguém vai ler; com a flag, a requisição antiga continua viajando inteira. O terceiro: dá para ver, porque o servidor registra `cancelada por el cliente`. As duas formas cumprem a regra de ouro da documentação, que a requisição que já não importa não continue afetando a aplicação. Cancelar, além disso, poupa o servidor. E aqui o cancelamento basta por um motivo concreto: em `cargarDetalle`, tudo o que é assíncrono escuta o sinal (`fetch` e `respuesta.json()`), e depois só há código síncrono. Se um dia for acrescentado outro `await` que não o receba, o argumento da documentação passa a valer: pergunte `control.signal.aborted` também antes de escrever o sucesso, ou combine as duas formas.

O preço de cancelar é a linha `if (control.signal.aborted) return;`: como a promise é rejeitada, é preciso distinguir o cancelamento de uma falha. Com a flag não há rejeição a distinguir. É um preço pequeno, e por isso as duas são corretas. O que não é correto é nenhuma das duas.

#### 3.3.3 Reproduzi-la no `revisor`

Agora sim, quebre o `revisor`. Faça isso em uma cópia ou restaure o arquivo ao terminar: o ponto de controle não se toca. O experimento óbvio é remover a limpeza de `useDetalle`, a linha `return () => control.abort();`, escolher `pagos` e, logo em seguida, `inventario`. **Antes de continuar lendo, preveja o que o quadro vai mostrar aos dois segundos.**

Isto é o que o Chrome *headless* mediu com essa única alteração:

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

Quem previu «En falla: HTTP 503» errou igual à primeira versão das anotações deste curso. O quadro diz o correto nos dois momentos, aos 500 ms e aos dois segundos e meio. Não há mais condição de corrida? Veja o registro:

```text
08:28:23.850 GET /api/estados cancelada por el cliente
08:28:24.150 GET /api/estados 200
08:28:25.812 GET /api/servicios/inventario 200
08:28:26.014 GET /api/servicios/inventario 200
08:28:26.807 GET /api/servicios/pagos 200
08:28:28.122 GET /api/servicios/pagos cancelada por el cliente
```

A condição de corrida **aconteceu**, sim, na rede: ninguém cancela mais nada, e a resposta de `pagos` chegou inteira às 26.807, quase um segundo **depois** da primeira de `inventario`. Mas não chegou à tela. O motivo é `key={seleccionado}`. Quando `inventario` foi escolhido, a `key` mudou e o React não atualizou o `PanelDetalle` de `pagos`: ele o **removeu** e montou um novo. A documentação diz assim: quando um componente é removido, o React destrói seu estado ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). A resposta de `pagos` chamou `establecerCarga` de um componente que já não existia, e essa chamada não tem o que mudar. (A última linha, o `pagos` cancelado às 28.122, é o fechamento da aba pelo script. Isso é explicado em 3.4.)

Então a limpeza sobra? Não, e para ver isso é preciso remover também a outra defesa. Com a `key` apagada de `ContenidoReporte` **e** sem `control.abort()`, o mesmo script mediu isto:

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

Ali está a cena do plantão, medida: aos 500 ms o quadro diz a verdade sobre `inventario`, e aos dois segundos e meio diz «En falla: HTTP 503», o estado de `pagos`, abaixo do cabeçalho «inventario». O registro conta por quê:

```text
08:28:30.292 GET /api/estados cancelada por el cliente
08:28:30.592 GET /api/estados 200
08:28:32.252 GET /api/servicios/inventario 200
08:28:33.247 GET /api/servicios/pagos 200
08:28:34.563 GET /api/servicios/pagos cancelada por el cliente
```

Sem `key`, o `PanelDetalle` é **o mesmo** antes e depois do segundo clique: só mudou a propriedade `nombre`. O Effect de `useDetalle` rodou um ciclo novo para `inventario`, mas o ciclo de `pagos` nunca foi limpo, e quando a resposta dele chegou, escreveu no estado do mesmo componente que agora mostra `inventario`. É exatamente a figura 1, com rede de verdade.

Ao restaurar a limpeza e deixar o painel sem `key`, a condição de corrida desaparece: a mudança de `nombre` executa a limpeza do ciclo de `pagos`, que cancela, e a resposta antiga já não chega. O script confirmou isso com o registro (o `pagos` do segundo ciclo sai `cancelada por el cliente` quatro milissegundos depois do clique em `inventario`, às 38.511) e com o quadro, que ficou em «Disponible: HTTP 200 en 118 ms». Mas essa versão tem outro defeito, e é o motivo de o ponto de controle usar as duas defesas. Medido na mesma execução, escolhendo `pagos`, esperando carregar e trocando para `catálogo`:

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

Quarenta milissegundos depois do clique, o quadro diz «catálogo» e embaixo «En falla: HTTP 503»: os dados de `pagos`, que ficaram ali porque ninguém voltou o estado para `cargando`. Duzentos milissegundos depois chega a resposta certa e se corrige. Não é uma condição de corrida (não há resposta antiga escrevendo tarde), mas durante um instante a tela mente do mesmo jeito. O plantão da cena, se olhar nesse instante, também liga para o inventário.

#### 3.3.4 Duas defesas, e por que a `key` não é um truque

Recapitule o que foi medido:

| `key={seleccionado}` | limpeza que cancela | O que se vê ao trocar de serviço |
|---|---|---|
| não | não | a resposta antiga sobrescreve a nova (a cena) |
| não | sim | sem condição de corrida, mas os dados do serviço anterior aparecem até chegar a resposta nova |
| sim | não | a tela está certa; a resposta antiga viaja inteira e é descartada |
| sim | sim | «Cargando detalle…» e depois o valor correto; a requisição antiga é cortada |

A última linha é o ponto de controle. Por que a `key` e não um `establecerCarga({ tipo: "cargando" })` no início do Effect, que pareceria o natural para a segunda linha? Porque o linter não deixa, e ele tem razão. Essa tentativa produz o erro `set-state-in-effect`, mostrado completo em «O erro que vai aparecer». A regra explica que mudar o estado de forma imediata dentro de um Effect obriga o React a reiniciar o ciclo de render completo antes que o navegador pinte ([React, «set-state-in-effect»](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)): o React renderiza o quadro com os dados antigos, o confirma, roda o Effect, o Effect pede outro render, e o React renderiza outra vez. Um render jogado fora.

A `key` não tem esse problema, porque não corrige o estado depois: faz o estado **nascer** certo. A documentação do React propõe isso exatamente para este caso, na seção «Redefinir todo o estado quando uma prop muda»: quando a `key` muda, o React recria o componente e reinicia o estado dele e de todos os seus filhos ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). E a página dela sobre o estado diz o mesmo pelo outro lado: especificar uma `key` diz ao React para usar a `key` como parte da posição do componente, e não a ordem dele dentro do pai ([React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state)). Para o React, `<PanelDetalle key="pagos">` e `<PanelDetalle key="inventario">` são dois componentes diferentes que não compartilham nada. A Lição 2 usou essa ferramenta para o rascunho da nota; aqui ela é usada para o painel inteiro: o estado da carga, o rascunho do editor e o Effect.

A `key` tem um efeito que é preciso conhecer: o quadro é montado de novo, e com `StrictMode` isso significa que o Effect de `useDetalle` faz seu ciclo extra a cada troca de serviço. Isso apareceu no registro: cada serviço escolhido costuma deixar um par `cancelada` + `200`. É o custo em desenvolvimento do teste gratuito, e em produção não existe. (Diz «costuma»: como a Lição 0 precisou, a linha `cancelada` só aparece se a conexão chegou ao servidor antes do cancelamento.)

E por que manter a limpeza se a `key` já protege a tela? Porque a `key` protege **esta** tela, montada **assim**. A limpeza protege o hook em qualquer lugar onde ele for usado. Se o detalhe virasse uma página com seu próprio endereço, como o plano prevê para a Lição 5, o mesmo componente poderia receber outro `nombre` sem ser desmontado ao navegar de `/servicios/pagos` para `/servicios/inventario`. Um hook que só funciona se quem o usa lembrar de colocar uma `key` é um hook com uma armadilha escondida. Além disso, só com a `key`, a resposta de `pagos` viajou inteira: 1,5 segundo de trabalho do servidor e da rede para ser jogado fora. A regra que a documentação do React dá não tem exceções: «a função de limpeza deve garantir que a requisição que já não importa não continue afetando a aplicação» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). A `key` corrige o que se vê; a limpeza corrige o que acontece.

### 3.4 `StrictMode`: o teste gratuito

#### 3.4.1 O que ele faz com os Effects

A Lição 0 ensinou a ler o par «cancelada por el cliente» + «200». Agora dá para entender o que ele está testando. A referência de `useEffect` diz com estas palavras: com o `StrictMode` ativado, o React executa um ciclo extra de preparação e limpeza, **só em desenvolvimento**, antes da primeira preparação real; é um teste de estresse que verifica que a limpeza «espelha» a preparação e interrompe ou desfaz o que a preparação está fazendo ([React, «useEffect»](https://react.dev/reference/react/useEffect)). E dá uma regra para saber se o teste passou: **a pessoa não deveria conseguir distinguir entre o Effect rodando uma vez (como em produção) e a sequência preparar → limpar → preparar (como em desenvolvimento).**

Aplique a regra ao detalhe. Em desenvolvimento, ao escolher `pagos`:

1. O React monta `PanelDetalle`. O Effect começa: cria `control₁` e pede `pagos` com o sinal dele.
2. O `StrictMode` simula que o componente foi embora: roda a limpeza, que cancela `control₁`. O servidor registra `cancelada por el cliente`.
3. O `StrictMode` simula que ele voltou: o Effect começa de novo, cria `control₂` e pede `pagos` outra vez. Essa é a requisição que preenche o quadro.

A pessoa consegue distinguir isso de uma única requisição? Não: vê «Cargando detalle…» e depois o detalhe, igual a produção. Teste aprovado. Agora imagine o Effect **sem** limpeza (o experimento de 3.3.3 com `key`). No passo 2 nada é cancelado; as duas requisições viajam e as duas chegam. Neste painel as duas respostas são iguais e não se nota, mas o servidor trabalhou em dobro e o segundo `200` do registro o denuncia. Com um Effect que, em vez de buscar dados, se inscrevesse em algo (um intervalo, uma conexão), o passo 2 deixaria **duas** inscrições vivas, e isso, sim, apareceria.

Por isso a documentação pede para mudar a pergunta: a pergunta correta não é «como fazer o Effect rodar uma única vez?», e sim «como corrigir o Effect para que ele funcione depois de ser montado de novo?» ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). A mesma página adverte contra o remédio que todo mundo tenta primeiro, uma ref que impede a segunda execução: não basta fazer o Effect rodar uma vez, porque o problema que o `StrictMode` revela também acontece em produção toda vez que a pessoa sai da tela e volta.

#### 3.4.2 Ler o registro com o que já se sabe

Volte ao registro do ponto de controle sem alterações, em 3.2.3. Agora cada linha conta uma história completa (com a ressalva da Lição 0: uma linha `cancelada` do ciclo extra só aparece se a conexão chegou ao servidor antes do cancelamento; se ela faltar na máquina local, não quer dizer que o `StrictMode` esteja desativado):

- `GET /api/estados cancelada por el cliente` e `GET /api/estados 200`, ao abrir: o ciclo extra do *polling*. A limpeza de `useReporte` cancela e além disso para o intervalo; se não o parasse, haveria dois intervalos perguntando a cada dez segundos.
- `GET /api/servicios/pagos cancelada por el cliente`, no primeiro clique: o ciclo extra do detalhe de `pagos`.
- `GET /api/servicios/pagos cancelada por el cliente`, 310 ms depois: não é o `StrictMode`. É a limpeza real, a que roda porque outro serviço foi escolhido e a `key` desmontou o painel.
- O par de `inventario`: o ciclo extra do painel novo, e depois a requisição que preenche a tela.

Repare em algo que o registro não mostra: falta o `200` do segundo ciclo de `pagos`. Ele nunca chegou, porque a limpeza o cortou no meio do caminho. Essa ausência é a condição de corrida corrigida.

Há mais um detalhe nos registros de 3.3.3 que convém explicar para não confundir quem o vir. No experimento com `key` e sem limpeza, as duas requisições de `inventario` (a do ciclo extra e a real, idênticas) não chegaram juntas ao servidor, e sim uma 200 ms depois da outra, e a segunda requisição idêntica de `pagos` ainda estava pendente quando o script fechou a aba, por isso aparece como `cancelada por el cliente` às 28.122. O que se observou é que o Chrome não enviou a segunda requisição ao mesmo endereço até a primeira terminar. Isso coincide com o lock do cache HTTP do Chromium, que deixa gravar uma única requisição por vez por endereço para não baixar duas vezes a mesma coisa ([Chromium, alteração 8aacaf3](https://chromium.googlesource.com/chromium/src.git/+/8aacaf38e85c45876c72ea77e36ef17e5ab69c26)); o Chrome não documenta isso como comportamento oficial e não se investigou mais, porque não é matéria do curso, e não muda nenhuma conclusão da lição: o que importa é qual resposta chega à tela, e isso foi medido no quadro, não no registro.

#### 3.4.3 A tentação de removê-lo

A primeira reação diante de duas requisições é remover o `StrictMode`. A documentação permite e desaconselha na mesma frase: dá para desativá-lo, mas a equipe do React recomenda deixá-lo ativado ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Agora o motivo está medido. No experimento sem limpeza, o `StrictMode` mostrou dois `200` onde deveria haver um `cancelada` e um `200`, **antes** que alguém escolhesse dois serviços seguidos. Removê-lo teria escondido justamente esse sinal.

O ciclo extra também não existe no que se publica. A Lição 0 mediu isso com `npm run preview`: uma única requisição ao abrir a página.

### 3.5 As dependências descrevem o código

#### 3.5.1 As dependências não se escolhem

Até aqui, as listas de dependências do `revisor` foram óbvias: `[nombre]`, `[titulo]`, `[cargar, cadaMs, intento]`. Agora chega um caso que não é, e que é o motivo do princípio que o curso repete em toda lição.

A equipe de operação pediu uma linha: «Actualizado a las 2:28:53 a.m.», abaixo da lista, que diga quando chegou o último relatório. A informação de «chegou um relatório» está em `useReporte`; o lugar onde a linha é renderizada é `Panel`. A forma de conectá-los é a de sempre no React: `Panel` passa ao hook uma função, `alRecibir`, e o hook a chama quando chega um relatório. O nome segue a regra do curso: as props de função começam com `al`.

A primeira tentativa é chamar `alRecibir` dentro do Effect, depois de `establecerCarga`, e não mexer em mais nada. O ESLint responde assim (medido em uma cópia):

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  43:6  warning  React Hook useEffect has a missing dependency: 'alRecibir'. Either include it or remove the dependency array. If 'alRecibir' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

O aviso diz a verdade: o Effect **usa** `alRecibir` e a lista não a nomeia. Se ficasse assim (ou fosse silenciado com um comentário), o Effect ficaria para sempre com a `alRecibir` do primeiro render. Aqui não se notaria, porque todas as versões da função fazem a mesma coisa, mas no dia em que a função lesse algo do estado de `Panel`, leria o valor do primeiro render. A documentação do React tem um nome para isso, **valores obsoletos** (*stale values*), e uma promessa: quem nunca silencia o linter nunca vai ver problemas de valores obsoletos ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)).

Essa mesma página é categórica com a ideia de fundo: **as dependências não se «escolhem».** Elas precisam incluir cada valor reativo que o Effect lê, e o linter faz isso ser cumprido. Os valores reativos são as props, o estado e tudo o que é declarado dentro do componente, porque são calculados ao renderizar e podem mudar de um render para outro. A página sobre remover dependências diz o mesmo pelo avesso, com uma frase que é o princípio do curso: a lista **descreve** o código; para mudar a lista, mude o código ([React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies)).

#### 3.5.2 Obedecer ao linter sem pensar: o loop

Então obedeça ao aviso ao pé da letra e acrescente `alRecibir` à lista: `[cargar, cadaMs, intento, alRecibir]`. O linter fica satisfeito:

```text
$ npm run lint

> revisor@0.3.0 lint
> eslint . --max-warnings 0

```

Verde. Agora abra o painel. Isto foi o que o servidor de prática registrou nos primeiros cinco segundos da página aberta no Chrome *headless*, sem um único clique:

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

Dezoito linhas no total: **dezesseis** respostas `200` e duas canceladas, em cinco segundos, quando o painel deveria pedir **uma** (o *polling* é a cada dez). É uma requisição a cada 300 ms, que é exatamente a demora do servidor: o painel pede, espera a resposta e, assim que ela chega, pede de novo. Para sempre. (A última cancelada é o script fechando a aba.)

Siga a cadeia com o que se sabe de 3.1:

1. Chega um relatório e o Effect chama `alRecibir`.
2. `alRecibir` é `() => establecerActualizadoEn(new Date())`: muda o estado de `Panel`.
3. `Panel` é renderizado de novo e, ao renderizar, cria **outra** arrow function para `alRecibir`. Tem o mesmo texto, mas é outro objeto na memória.
4. O React compara as dependências com `Object.is`. Para funções, isso compara identidade: a função nova **não é** a antiga. A lista mudou.
5. O React executa a limpeza (cancela e para o intervalo) e começa o Effect de novo, que pede um relatório imediatamente. Volta ao passo 1.

A documentação do React descreve exatamente esse mecanismo com um objeto `options`: cada objeto e cada função recém-criados são considerados diferentes de todos os outros, ainda que o conteúdo seja igual, e por isso um Effect que depende deles se ressincroniza mais do que o necessário ([React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies)). E repare no que isso significa para a pergunta «quantas vezes o intervalo é reiniciado?»: **a cada render de `Panel`**. Com este `Panel`, a cada relatório que chega, o que transforma o reinício em um loop. Sem o loop (se `alRecibir` não mudasse o estado), cada clique na caixa «Solo fallas» ou em um serviço também renderizaria `Panel` de novo e reiniciaria o intervalo: o *polling* de dez segundos voltaria a contar do zero toda vez que alguém clicasse.

Isto é o mais importante da seção: **o linter verde não diz que o código está certo. Diz que a lista não mente.** A lista mentia quando faltava `alRecibir`, e o linter avisou. Ao acrescentá-la, ela deixou de mentir, e então a verdade ficou à vista: do jeito que está escrito, este Effect depende, **sim**, de uma função que muda a cada render. O linter fez o seu trabalho. O que está errado é o design, e ele se corrige mudando o código.

#### 3.5.3 As saídas que a documentação oferece

A página «Lifecycle of Reactive Effects» lista o que fazer quando a sugestão do linter provoca um loop ou ressincroniza demais. Resumidas, são quatro: verificar se o Effect é na verdade um único processo de sincronização ou dois misturados, e separá-los; mover os valores que não são reativos para fora do componente ou para dentro do Effect; usar Effect Events para ler as props e o estado mais recentes sem ressincronizar; e evitar objetos e funções criados ao renderizar como dependências ([React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects)). Veja quais se aplicam aqui:

- **Mover a função para dentro do Effect?** Não dá: quem a escreve é `Panel`, que é outro componente.
- **Mover a função para fora de `Panel`?** Também não: ela chama `establecerActualizadoEn`, que só existe lá dentro.
- **`useCallback` em `Panel`?** É o que o próprio aviso sugere. Funcionaria aqui, porque `establecerActualizadoEn` nunca muda, mas transfere o problema para quem usa o hook: cada componente que usasse `useReporte` teria de se lembrar de envolver sua função, ou o *polling* viraria um loop de novo. E o curso não apresenta a memoização por costume. Um hook que depende de que seus usuários se lembrem de algo é frágil.
- **Um Effect Event?** Esta é a que se aplica, por um motivo de fundo que vem na próxima seção.

A pergunta que decide não é técnica, é de significado: **avisar que chegou um relatório faz parte da sincronização com o servidor, ou é algo que acontece *durante* a sincronização?** Se amanhã `Panel` passar uma função diferente, é preciso parar de perguntar ao servidor e começar de novo? Não. O *polling* depende da função com que se carrega (`cargar`), de a cada quanto tempo (`cadaMs`) e de alguém ter pedido para recarregar (`intento`). Quem é avisado quando algo chega não muda nada disso.

### 3.6 `useEffectEvent`: ler o mais recente sem reiniciar

#### 3.6.1 Uma função que se comporta como um evento

A documentação do React distingue dois tipos de lógica. A dos event handlers **não é reativa**: só roda quando a pessoa repete a interação, por exemplo outro clique. A dos Effects **é reativa**: se lê uma prop ou um estado, esse valor vai nas dependências e, se ele muda, o Effect roda outra vez ([React, «Separating Events from Effects»](https://react.dev/learn/separating-events-from-effects)). O aviso de «chegou um relatório» tem as duas naturezas misturadas: é disparado a partir do Effect (quando o servidor responde), mas não deve fazer o Effect reiniciar. É para isso que existe o `useEffectEvent`. A referência dele o descreve assim: é um hook que permite separar eventos dos Effects; os Effect Events fazem parte da lógica do Effect, mas se comportam mais como um event handler: sempre «enxergam» os valores mais recentes do render (props e estado) sem ressincronizar o Effect, e por isso **ficam fora das dependências** ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). Ele chegou como parte do React 19.2, lançado em 1º de outubro de 2025 ([React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2)); este curso usa a 19.3.1.

`useReporte` fica assim:

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

Em relação à Lição 2 mudam quatro linhas: o `import` acrescenta `useEffectEvent`, o hook recebe o parâmetro `alRecibir`, o envolve em `avisarRecibido`, e o Effect chama `avisarRecibido(reporte)` (na tentativa de 3.5, chamava `alRecibir` diretamente). A lista de dependências **não muda**: continua sendo `[cargar, cadaMs, intento]`, e o linter a aceita, porque a função que o Effect usa agora é um Effect Event, e essas não vão na lista. O valor de `alRecibir` que roda é sempre o do último render, mesmo que o Effect tenha começado vários renders antes.

Em `Panel` (3.1.2) nada do que foi escrito muda: ele continua passando uma arrow function nova a cada render, `() => establecerActualizadoEn(new Date())`. Isso já não importa. Essa é a vantagem em relação ao `useCallback`: o hook se defende sozinho e quem o usa não precisa saber de nada.

#### 3.6.2 Contar os reinícios

A terceira figura responde com um número à pergunta «quantas vezes o intervalo é reiniciado?». Dois *pollings* idênticos, um com a função nas dependências e outro com `useEffectEvent`, são renderizados três vezes, cada vez com uma função nova, como faz `Panel`:

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

Com a função nas dependências, o intervalo inicia **três** vezes em três renders: um por render, embora nada importante tenha mudado. Com `useEffectEvent`, inicia **uma** vez e para uma vez, ao desmontar. (A figura não usa `StrictMode`, para que a contagem seja lida sem o ciclo extra; «recibido» não aparece porque a figura termina muito antes dos dez segundos do intervalo.)

E no `revisor`, com cliques de verdade. Este script abriu o ponto de controle sem alterações e, durante vinte e um segundos, deu quatro cliques na caixa «Solo fallas» (marcou e desmarcou duas vezes) e escolheu dois serviços. Cada um desses cliques renderiza `Panel` de novo:

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

O registro do servidor durante esses vinte e um segundos:

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

O relatório chegou às 53.440, 03.443 e 13.443: a cada dez segundos com três milésimos de diferença, como se ninguém tivesse mexido em nada. Seis cliques, zero reinícios do *polling*. E a linha «Actualizado a las …» avançou de 2:28:53 para 2:29:03 e para 2:29:13, acompanhando cada relatório (lembrando que é a hora local do navegador). Os dois pares de detalhe são os de 3.4: a `key` que monta um painel novo por serviço.

#### 3.6.3 O que o `useEffectEvent` não é

É tentador ver no `useEffectEvent` uma forma de tirar da lista qualquer coisa que atrapalhe. A documentação proíbe isso com todas as letras: não use `useEffectEvent` para evitar declarar dependências do Effect; isso esconde erros e torna o código mais difícil de entender. Use-o só para lógica que é de fato um evento disparado a partir de um Effect; se um valor deve fazer o Effect rodar de novo, mantenha-o como dependência ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). O anúncio do React 19.2 repete a ideia: não é preciso envolver tudo em `useEffectEvent`, nem usá-lo só para calar o aviso, porque isso pode levar a erros ([React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2)).

O teste para o `revisor` é a pergunta de 3.5.3. Se `cadaMs` fosse envolvido em um Effect Event para tirá-lo da lista, no dia em que alguém mudasse o intervalo de 10 para 5 segundos o Effect não ficaria sabendo, e a gente estaria de volta à cena da Lição 0. `cadaMs` faz parte da sincronização. `alRecibir`, não.

A referência impõe ainda três limites. É um hook, então é chamado no nível superior do componente ou do hook, nunca dentro de um `if` ou de um laço. Os Effect Events só são chamados de dentro de Effects ou de outros Effect Events: não durante o render, e não são passados para outros componentes nem para outros hooks. E a identidade deles muda **de propósito** a cada render ([React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent)). Este último limite explica o que acontece se, por costume, `avisarRecibido` for colocado na lista. O linter o impede (medido em uma cópia):

```text
~/curso-react/revisor/src/reporte/useReporte.ts
  44:32  warning  Functions returned from `useEffectEvent` must not be included in the dependency array. Remove `avisarRecibido` from the list  react-hooks/exhaustive-deps
```

Se isso fosse ignorado, como a identidade dele muda a cada render, o loop de 3.5.2 voltaria. A referência de `useEffectEvent` diz que o linter faz essas restrições serem cumpridas, e o anúncio do 19.2 pede uma versão recente do `eslint-plugin-react-hooks` para que o linter não tente colocar os Effect Events na lista; a 7.1.1 do curso as conhece, como acabou de aparecer.

### 3.7 Quando não é preciso um Effect

#### 3.7.1 Dois Effects que sobram

O `revisor` já tem três Effects, e os três sincronizam algo de fora: o servidor (duas vezes) e o documento. Falta a outra metade do princípio: o que **não** vai em um Effect. A documentação do React dedica a isso uma página inteira, que começa com duas frases que valem a lição: não são necessários Effects para transformar dados para o render, e não são necessários Effects para tratar eventos da pessoa ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)).

A segunda figura junta os dois erros em um arquivo. Não faz parte do `revisor`, mas se parece muito com o que alguém escreveria nele: um resumo que conta as falhas em um Effect, e um botão que, ao ser clicado, liga uma flag para que um Effect envie a nova tentativa.

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

(O servidor de prática desta lição não tem rota de nova tentativa; aqui a figura é só verificada com o linter, nunca executada.) A mensagem é a mesma que a Lição 0 ensinou a ler, e explica tudo: um Effect deve atualizar sistemas externos com o estado do React, ou se inscrever em um sistema externo e mudar o estado quando esse sistema responde. Nenhum dos dois casos da figura faz isso.

**O primeiro calcula.** `fallas` pode ser obtido a partir de `estados` no momento de renderizar. Guardá-lo em estado e copiá-lo com um Effect produz um render com o número antigo, um Effect que o corrige e outro render com o número certo: um render jogado fora, e um instante em que a tela diz algo falso. A documentação coloca isso como regra: quando algo pode ser calculado a partir das props ou do estado existentes, não o coloque no estado; calcule-o ao renderizar ([React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect)). É a terceira regra de forma da Lição 2, «não guardar o que se pode calcular», vista do lado dos Effects. E é o que o `revisor` já faz em `Panel`: `const fallas = … contarFallas(…)`, uma constante, e o Effect só a copia para o documento.

**O segundo reage a um clique.** O que causa a nova tentativa não é o botão ser renderizado, e sim a pessoa apertá-lo. A documentação usa quase o mesmo exemplo, comprar um produto: ninguém quer comprá-lo duas vezes, e justamente por isso não deve ir em um Effect, porque a compra não é causada pelo render, e sim por uma interação concreta, e deve rodar só quando a pessoa aperta o botão ([React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects)). Pense também no `StrictMode`: se a requisição vivesse em um Effect sem flag, o ciclo extra de desenvolvimento enviaria a nova tentativa duas vezes. A correção é movê-la para o handler do clique, onde a flag deixa de existir. O exercício 4 pede isso.

#### 3.7.2 A tabela de bolso

A página «You Might Not Need an Effect» lista doze situações em que as pessoas escrevem um Effect que sobra. As que já apareceram no `revisor`, com o lugar de cada uma:

| Tentação | Onde vai na verdade | No `revisor` |
|---|---|---|
| atualizar um estado a partir de outro | calcula-se ao renderizar | `fallas` em `Panel`, `visibles` e `existe` em `ContenidoReporte` |
| reiniciar todo o estado quando uma prop muda | uma `key` | `<PanelDetalle key={seleccionado}>` |
| enviar uma requisição `POST` por um clique | o event handler | ainda não há nenhuma no `revisor`; o plano a prevê para a nova tentativa e o cadastro |
| avisar o pai que algo mudou | chama-se a função do pai no mesmo evento | `alSeleccionar`, `alCambiar`, `alGuardarNota` |
| buscar dados | é, sim, um Effect, com limpeza (ou uma biblioteca) | `useDetalle` e `useReporte` |

Repare na última linha. Buscar dados **é**, sim, sincronizar, e por isso o `revisor` faz isso em um Effect. Mas a referência de `useEffect` é honesta sobre seus limites: buscar dados manualmente em Effects não roda no servidor, tende a produzir cascatas (o pai busca, renderiza, e então cada filho busca o seu), não guarda nada em cache e exige muito código repetido para evitar erros como a condição de corrida; e recomenda usar uma biblioteca de cache do lado do cliente, entre elas o TanStack Query ([React, «useEffect»](https://react.dev/reference/react/useEffect)). Esse código repetido já foi escrito duas vezes: `useReporte` e `useDetalle` se parecem muito. Segundo o plano do curso, é daí que parte a Lição 4.

#### 3.7.3 O que já estava certo

Antes de seguir, veja o que o `revisor` fazia bem sem que ninguém explicasse. O botão «Actualizar» coloca `cargando` em `recargar`, dentro do handler do clique, e só depois muda `intento` para que o Effect reinicie: o estado da tela é mudado pelo evento, a sincronização é feita pelo Effect. `cargarReporte` e `cargarDetalle` são funções de módulo, iguais em cada render, então `cargar` na lista de `useReporte` não reinicia nada. E `alSeleccionar` muda a seleção no clique; ninguém «observa» a seleção com um Effect para fazer algo depois. Tudo isso é o mesmo princípio aplicado antes de ter nome.

## O erro que vai aparecer

A lição tem um erro principal, o que aparece ao tentar voltar a «Cargando detalle…» sem `key`, e dois de apoio que já apareceram em 3.5 e 3.6.

**O erro principal: «reiniciar o estado dentro do Effect».** Remova a `key` de `<PanelDetalle>` e, para que o quadro volte a «Cargando detalle…» ao trocar de serviço, escreva `establecerCarga({ tipo: "cargando" })` como primeira linha do Effect de `useDetalle`. O linter rejeita (medido em uma cópia):

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

(Nessa execução havia uma segunda alteração proposital em outro arquivo, a de 3.6.3, e por isso o resumo final disse `✖ 2 problems (1 error, 1 warning)`; aqui se mostra só o bloco deste erro.) Lê-se de cima para baixo: o arquivo, a linha 14 e a coluna 5, o nome do erro, a explicação geral (a mesma da figura 2), o código com uma seta que aponta para a chamada e, no final, o nome da regra, `react-hooks/set-state-in-effect`. É um **erro**, não um aviso: interrompe o `npm run lint` mesmo que não existisse `--max-warnings 0`.

A correção não é silenciar a regra nem mover a chamada para um lugar onde o linter não a veja (por exemplo, um `setTimeout` de zero milissegundos dentro do Effect, que é o mesmo render jogado fora, escondido). A correção é perguntar o que se quer dizer. O que se quer dizer é «quando o serviço muda, o quadro começa do zero». Isso, no React, se escreve com `key` (3.3.4), e o Effect fica limpo porque já não precisa corrigir nada.

**O aviso da dependência que falta.** `React Hook useEffect has a missing dependency: 'alRecibir'` (3.5.1). A correção não é acrescentá-la às cegas, porque isso produziu o loop de dezesseis requisições em cinco segundos; também não é seguir a sugestão do final da mensagem e envolver a função em `useCallback` no pai. É perguntar se essa função faz parte da sincronização. Se não faz, `useEffectEvent`.

**O Effect Event na lista.** `Functions returned from useEffectEvent must not be included in the dependency array` (3.6.3). A correção é a que a mensagem diz: removê-la. A identidade dela muda a cada render de propósito.

## O que se faz errado

**Pensar em «ao montar».** Escrever `useEffect(() => { … }, [])` com a ideia de «isto roda uma vez, quando carrega» leva a Effects sem limpeza, e o `StrictMode` os denuncia com seu ciclo extra. Pense em ciclos de começar e parar de sincronizar.

**Buscar dados sem limpeza.** A resposta antiga chega tarde e escreve por cima da certa. Que a `key` disfarce isso em uma tela não corrige o hook, e a requisição viaja inteira para ser jogada fora.

**Tratar o cancelamento como erro.** Sem `if (control.signal.aborted) return;`, o cancelamento da limpeza aparece como falha: em desenvolvimento, por causa do ciclo extra do `StrictMode`, em cada serviço escolhido (como medido em 3.2.3); sem `key`, também a cada troca de serviço. Um cancelamento é a limpeza funcionando.

**Reiniciar o estado com um `setState` dentro do Effect.** Produz um render jogado fora e o linter o rejeita. Para reiniciar todo o estado de um componente quando muda o que ele mostra, use `key`.

**Silenciar `exhaustive-deps`.** Um `// eslint-disable-next-line react-hooks/exhaustive-deps` deixa a lista mentindo e garante valores obsoletos mais adiante. Se o aviso incomoda, o código tem um problema de design.

**Achar que linter verde significa «correto».** Acrescentar `alRecibir` à lista deixou o linter limpo e o painel pedindo um relatório a cada 300 ms. O linter garante que a lista diz a verdade, não que a verdade seja conveniente.

**Usar `useEffectEvent` para esconder dependências.** Se um valor deve reiniciar a sincronização, como `cadaMs`, ele vai na lista. `useEffectEvent` é para o que acontece durante a sincronização, não para o que a define.

**Calcular em um Effect.** Copiar para um estado algo que pode ser calculado ao renderizar produz um render a mais e um instante de tela falsa. Calcule como constante.

**Enviar uma requisição por um clique a partir de um Effect.** O clique é um evento; a requisição vai no handler dele. Em um Effect, o `StrictMode` a envia duas vezes em desenvolvimento e qualquer mudança de dependências a repete.

**Remover o `StrictMode` porque duplica requisições.** O ciclo extra é a prova de que a limpeza existe, e em produção ele não acontece.

## Exercícios

### Exercício 1 — Ler o registro antes de vê-lo

Com o ponto de controle sem alterações, o servidor de prática e `npm run dev` rodando, a ideia é abrir a página, esperar carregar, escolher `catálogo`, esperar dois segundos e escolher `inventario`. **Antes de fazer isso**, escreva no diário de bordo quantas linhas o servidor vai acrescentar pelos dois detalhes, em que ordem, e quais vão dizer `cancelada por el cliente`. Depois faça e compare. Mudaria algo se `inventario` fosse escolhido só 100 ms depois de `catálogo`?

### Exercício 2 — O experimento óbvio, e o completo

Em uma cópia do `revisor`, remova só a linha `return () => control.abort();` de `useDetalle`. Escolha `pagos` e, logo em seguida, `inventario`. Anote o que o quadro mostra aos dois segundos e o que o servidor registra. Depois remova também `key={seleccionado}` de `ContenidoReporte` e repita. Explique em três frases por que o primeiro experimento não mostra a condição de corrida e o segundo mostra. O linter avisa em algum dos dois?

### Exercício 3 — A flag em vez do cancelamento

Reescreva `useDetalle` com a forma de flag de 3.3.2 (`let ignorar = false` e uma limpeza que a coloca em `true`), sem `AbortController`. Confira que `npm run lint` não avisa nada e que, sem `key`, a condição de corrida continua corrigida na tela. **Preveja** o que muda no registro do servidor ao escolher `pagos` e depois `inventario`, e confira. Restaure o arquivo ao terminar.

### Exercício 4 — Corrigir a figura 2 sem Effects

Corrija `fig03_02.tsx` para que `npx eslint fig03_02.tsx` não informe nada, **sem** silenciar nenhuma regra e sem manter nenhum `useEffect`. `Resumen` deve continuar mostrando o número de falhas, e `BotonReintento` deve continuar enviando o `POST` ao ser clicado.

## Soluções

### Solução 1

Ao escolher `catálogo`, a `key` monta um `PanelDetalle` novo e o `StrictMode` roda o ciclo extra: uma linha `GET /api/servicios/cat%C3%A1logo cancelada por el cliente` e, uns 200 ms depois, `GET /api/servicios/cat%C3%A1logo 200`. Dois segundos depois, ao escolher `inventario`, acontece o mesmo: `cancelada` e `200`. Quatro linhas, duas canceladas, na ordem cancelada, 200, cancelada, 200. Foi isso o que se mediu com a caixa, `catálogo` e `inventario` na execução de 3.6.2: `08:28:58.612 … cat%C3%A1logo cancelada por el cliente`, `08:28:58.814 … cat%C3%A1logo 200`, `08:29:00.611 … inventario cancelada por el cliente` e `08:29:00.813 … inventario 200`. Repare que o nome com acento viaja codificado (3.2.2). Se `inventario` fosse escolhido só 100 ms depois, a requisição real de `catálogo` ainda não teria terminado (leva 200 ms), então também sairia `cancelada`: apareceriam três linhas `cancelada` e um único `200`, o de `inventario`. É a condição de corrida corrigida, a mesma que 3.2.3 mediu com `pagos`. Este último caso não foi medido; é a previsão que sai da regra, e conferi-la é a parte de quem segue a lição. E vale lembrar a ressalva da Lição 0: a linha `cancelada` do ciclo extra só aparece se a conexão chegou ao servidor antes do cancelamento. Se faltar alguma na máquina local, não quer dizer que o `StrictMode` esteja desativado.

### Solução 2

É o experimento que 3.3.3 mediu. Só com a limpeza removida, o quadro diz aos dois segundos «Disponible: HTTP 200 en 118 ms», o valor correto de `inventario`; o registro mostra dois `GET /api/servicios/inventario 200` e um `GET /api/servicios/pagos 200` que chegou quase um segundo depois do primeiro de `inventario` (e outro `pagos` que ficou pendente até a aba ser fechada, pelo que 3.4.2 explica). A condição de corrida aconteceu na rede, mas não na tela, porque a `key` desmontou o painel de `pagos` e a resposta dele escreveu em um componente que já não existia. Sem `key` e sem limpeza, o quadro diz aos dois segundos «En falla: HTTP 503» abaixo de «inventario»: o mesmo componente recebeu a resposta antiga. O linter não avisa em nenhum dos dois casos: uma limpeza que falta não quebra nenhuma regra visível no texto, e remover uma `key` também não. Por isso esta lição mede no navegador e não só com o ESLint.

### Solução 3

Uma forma correta:

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

A tela fica igualmente protegida: a resposta antiga chega, mas a flag do ciclo dela já está em `true` e ela não escreve nada. O que muda é o registro: já não há nenhum `cancelada por el cliente` (nem o do `StrictMode` nem o da troca de serviço), e no lugar aparecem respostas `200` completas de requisições que ninguém usa, entre elas a de `pagos`, 1,5 segundo de trabalho do servidor jogado fora. É a diferença de 3.3.2: a flag ignora, o cancelamento além disso corta. O curso mantém o cancelamento. Repare que `cargarDetalle` continua pedindo um sinal; aqui se passa um que ninguém cancela.

### Solução 4

Nenhum dos dois componentes sincroniza nada com um sistema externo, então nenhum precisa de um Effect:

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

`fallas` é uma constante calculada a cada render, e desaparecem o estado, o Effect e o render jogado fora. O `POST` vive no handler do clique, e desaparecem a flag `pedido` e o risco de enviá-lo duas vezes. Repare em `encodeURIComponent`: é a mesma regra de 3.2.2, e a figura já a trazia. Com esta versão, `npx eslint` não informa nada. Repare que o arquivo corrigido nem sequer importa `useEffect` nem `useState`: a forma mais segura de não errar com um Effect é não escrevê-lo quando ele não é necessário.

## Como saber se deu certo

- [ ] `npm run lint` termina sem escrever nenhum problema, e em todo o `src/` não há um único comentário `eslint-disable`.
- [ ] `npm run build` termina com `✓ built` e deixa em `dist/assets/` um arquivo `index-CTkBRgQQ.js`, o mesmo nome do ponto de controle do curso (se o projeto for idêntico byte a byte; se algum texto foi alterado, o nome muda e não é um erro).
- [ ] Com o servidor de prática rodando, um `curl` para `/api/servicios/pagos` leva cerca de 1,5 s e responde `200`, e um `curl` para `/api/servicios/nada` responde `404` com `{"detalle":"no existe el servicio nada"}`.
- [ ] Com o painel aberto em `npm run dev` e duas falhas no relatório, a aba diz `(2) Revisor`.
- [ ] Ao escolher `pagos` e logo em seguida `inventario`, o quadro termina dizendo «Disponible: HTTP 200 en 118 ms», e no registro a requisição real de `pagos` aparece como `cancelada por el cliente`.
- [ ] Em uma cópia sem `key` e sem `control.abort()`, a condição de corrida foi reproduzida: o quadro termina dizendo «En falla: HTTP 503» abaixo de «inventario». E dá para explicar por que remover só `control.abort()` não basta para vê-la.
- [ ] Com a página aberta por vinte segundos e vários cliques na caixa «Solo fallas», o registro mostra um `GET /api/estados 200` a cada dez segundos, nem um a mais.
- [ ] Dá para dizer, para cada um dos três Effects do `revisor`, com que sistema externo ele se sincroniza, o que faz ao começar e o que sua limpeza desfaz.
- [ ] No [diário de bordo](bitacora.md) ficaram anotados a condição de corrida reproduzida, o loop de requisições produzido por obedecer ao linter sem pensar, e o que mudou na forma de ler `useEffect`.

## Resumo

Responda sem olhar a lição:

1. Que duas funções um Effect tem e o que cada uma faz? Por que a documentação pede para pensar a partir do Effect e não do componente?
2. O que é a condição de corrida entre respostas? Por que a resposta de `pagos` pode chegar depois da de `inventario`, mesmo tendo sido pedida antes?
3. Qual é a diferença entre cancelar a requisição e ignorar seu resultado? O que o servidor vê em cada caso?
4. Por que o `revisor` reinicia o detalhe com `key` e não com um `setState` dentro do Effect? O que o linter diz na tentativa?
5. O que o `StrictMode` faz com um Effect em desenvolvimento, e qual é a regra para saber se o Effect passa nesse teste?
6. Por que acrescentar `alRecibir` à lista deixou o linter verde e o painel pedindo um relatório a cada 300 ms? Que papel o `Object.is` desempenha?
7. O que o `useEffectEvent` faz, onde pode ser chamado, e por que não serve para tirar `cadaMs` da lista?
8. Dê dois exemplos de código que não deveria estar em um Effect e diga onde vai cada um.

## Leituras complementares

- [React, «Synchronizing with Effects»](https://react.dev/learn/synchronizing-with-effects): o que é um Effect, a limpeza, por que o `StrictMode` monta duas vezes em desenvolvimento, a condição de corrida entre respostas e o exemplo da compra que não vai em um Effect. Consultado em 21 de outubro de 2026.
- [React, «Lifecycle of Reactive Effects»](https://react.dev/learn/lifecycle-of-reactive-effects): começar e parar de sincronizar, pensar a partir do Effect, os valores reativos, «as dependências não se escolhem» e por que o linter não se silencia. Consultado em 21 de outubro de 2026.
- [React, «Separating Events from Effects»](https://react.dev/learn/separating-events-from-effects): lógica reativa e não reativa, os Effect Events e seus limites. Consultado em 21 de outubro de 2026.
- [React, «Removing Effect Dependencies»](https://react.dev/learn/removing-effect-dependencies): funções e objetos como dependências, a lista que descreve o código, e as saídas para remover uma dependência. Consultado em 21 de outubro de 2026.
- [React, «You Might Not Need an Effect»](https://react.dev/learn/you-might-not-need-an-effect): calcular ao renderizar, reiniciar o estado com `key`, as requisições por um evento e a condição de corrida ao buscar dados. Consultado em 21 de outubro de 2026.
- [React, «useEffect»](https://react.dev/reference/react/useEffect): a assinatura, como as dependências são comparadas com `Object.is`, o ciclo extra do `StrictMode` e os limites de buscar dados manualmente. Consultado em 21 de outubro de 2026.
- [React, «useEffectEvent»](https://react.dev/reference/react/useEffectEvent): o que faz, seus limites e a advertência contra usá-lo para esconder dependências. Consultado em 21 de outubro de 2026.
- [React, «React 19.2»](https://react.dev/blog/2025/10/01/react-19-2): o anúncio do `useEffectEvent`, de 1º de outubro de 2025, e a necessidade de uma versão recente do linter. Consultado em 21 de outubro de 2026.
- [React, «Preserving and Resetting State»](https://react.dev/learn/preserving-and-resetting-state): a `key` como parte da posição e o estado que é destruído ao remover um componente. Consultado em 21 de outubro de 2026.
- [React, «set-state-in-effect»](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect): o que a regra rejeita e por quê. Consultado em 21 de outubro de 2026.
- [React, «<title>»](https://react.dev/reference/react-dom/components/title): o componente `<title>` do React 19, que é colocado no `<head>`, e a advertência de não renderizar dois ao mesmo tempo. Consultado em 21 de outubro de 2026.
- [MDN, «AbortController: abort() method»](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort): o que `abort()` interrompe e a exceção `AbortError`. Consultado em 21 de outubro de 2026.
- [MDN, «Document: title property»](https://developer.mozilla.org/en-US/docs/Web/API/Document/title): ler e mudar o título do documento. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| Effect | código que roda depois de renderizar para sincronizar um componente com algo fora do React: um servidor, o documento, um temporizador |
| limpeza | a função que um Effect retorna; desfaz o que o Effect começou, antes do ciclo seguinte e ao remover o componente |
| ciclo de um Effect | começar a sincronizar e, depois, parar de sincronizar; repete-se toda vez que algo da lista muda |
| dependências | a lista de valores reativos que o Effect usa; descreve o código, não se escolhe |
| valor reativo | uma prop, um estado ou qualquer valor calculado dentro do componente, que pode mudar entre renders |
| condição de corrida entre respostas | duas requisições no ar que chegam em uma ordem diferente da que foram enviadas, e a antiga escreve por cima da nova |
| `AbortController` | objeto do navegador que permite cancelar uma requisição `fetch` de fora, por meio do seu sinal |
| valor obsoleto (*stale*) | o valor de um render anterior que um Effect continua usando porque a lista dele não o nomeia |
| Effect Event | função criada com `useEffectEvent`: é chamada a partir de um Effect, sempre enxerga os valores mais recentes e não vai na lista de dependências |

---

**Próxima:** [Lição 4 — Estado do servidor com TanStack Query](04-estado-del-servidor.md)
