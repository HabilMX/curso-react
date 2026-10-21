# Lição 7 — Formulários, actions e acessibilidade

*São 17h52 de uma sexta-feira e o congelamento de mudanças é às 18h. A equipe de operação precisa cadastrar o serviço `correo` na ferramenta interna antes de ir embora, e quem está de plantão é o Raúl, que trabalha com um leitor de tela. Ele preenche os três campos, aperta Enter e não ouve nada. Aperta Enter de novo: nada. Não sabe se o cadastro foi feito, se foi feito duas vezes ou se o formulário está esperando alguma coisa. O que aconteceu é que o endereço não começava com `https://`: a página pintou o campo de vermelho e escreveu o erro embaixo, em um texto que ninguém conectou ao campo nem a um aviso. Para quem olha a tela, o erro era óbvio. Para o Raúl, ele não existia. Faltam oito minutos. O formulário de que ele precisa é o que esta lição constrói, e o segundo Enter, o que ninguém ouviu, vai ser corrigido no exercício 3.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 7.2 e 7.3)

**O que se constrói:** o cadastro de um serviço no `revisor`: uma página nova em `/servicios/nuevo`, com um formulário de três campos validado com o schema do curso de TypeScript, enviado à API de prática, que mostra os erros junto de cada campo e avisa o resultado a quem usa um leitor de tela

**O que se aprende:** controlado versus não controlado; `<form action>`, `useActionState`, `useFormStatus` e `useOptimistic`; validar com o schema da lição 6 de TypeScript; `aria-invalid` com `aria-describedby`; regiões dinâmicas (`role="status"`, `role="alert"`); o HTML nativo antes do ARIA; percorrê-lo com o teclado

**De onde a gente vem.** Do ponto de controle da [Lição 6](06-reducer-contexto.md): um `revisor` com rotas (a lista em `/`, o detalhe em `/servicios/:nombre` e uma página «não encontrada»), os dados do servidor no TanStack Query, uma bandeja de avisos com seu reducer e seu contexto, e algumas preferências de tela. A API de prática já tem desde a [Lição 4](04-estado-del-servidor.md) a rota que esta lição usa pela primeira vez: `POST /api/servicios`, que responde `201` com o serviço novo, `400` com os campos inválidos ou `409` se o nome já existe. Do curso de TypeScript vem, para quem o fez, a ideia de **schema**: um valor que sabe ler `unknown` e do qual se deriva um tipo. Para quem não fez, ele aparece completo aqui.

**O que esta lição não faz.** Não usa nenhuma biblioteca de formulários nem de validação: tudo sai do React e do schema já conhecido, de propósito, para que fique claro o que cada peça resolve. Não usa Server Functions nem Server Components: `<form action>` recebe aqui uma função que roda no navegador (por que o painel não usa Server Components é discutido na [Lição 9](09-rendimiento-publicacion.md)). Não acrescenta testes automatizados: o comportamento do formulário é mostrado com figuras que rodam em um DOM de teste e com o ponto de controle aberto em um navegador. E não é um curso de acessibilidade: ensina o que este formulário precisa, contra as fontes que o definem, e nomeia o que não dá para comprovar sem uma pessoa e um leitor de tela.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição. Os pontos de controle desta lição e das duas seguintes foram instalados do zero com `npm ci`, e `npm run lint` e `npm run build` terminaram bem; o desta lição produziu `dist/assets/index-WLyq37jn.js`. Não se repetiu em um contêiner Linux. O erro do compilador de «O erro que vai aparecer» foi provocado em uma cópia do ponto de controle, não no original. As figuras foram executadas com seu próprio `package.json` em [`programas/07-formularios-accesibilidad/`](../programas/07-formularios-accesibilidad), ao lado de `revisor/`; são compiladas com `tsc` e executadas com `node`, como nas lições anteriores, e acrescentam uma única dependência nova, `dom-accessibility-api` 0.7.1, que calcula o nome e a descrição acessíveis de um elemento seguindo a especificação do W3C. O que se vê «no navegador» foi medido com o Chrome *headless*: o HTML de `/servicios/nuevo` com `--headless --dump-dom` contra `vite preview`, e a árvore de acessibilidade, o foco e as regiões dinâmicas conduzindo o Chrome pelo seu protocolo de depuração (*Chrome DevTools Protocol*) com um script Node, contra `npm run dev` e a API de prática. Essas execuções usaram as portas 4107, 5107 e 3107 em vez de 4173, 5173 e 3100, porque na máquina rodavam outras coisas ao mesmo tempo; para apontar o *proxy* para a API na 3107, `vite.config.ts` foi alterado em uma **cópia** do ponto de controle, não no original. Para quem segue a lição, nada muda. As medições de «antes» foram feitas com o formulário como estava antes das correções desta lição (o sucesso anunciado duas vezes, sem `required`, sem `aria-atomic` na bandeja, sem `startTransition` e com `disabled={pending}` no botão), nessa mesma cópia; as de «depois», com o ponto de controle. Nada foi executado em um Linux Mint real; nada do que se mostra depende do sistema. **O que não foi medido**, e é dito onde aparece: como o formulário soa em um leitor de tela de verdade (NVDA, Orca ou VoiceOver) e o percurso com o teclado em uma janela real. Essas duas verificações estão em «Como saber se deu certo», com o passo a passo para fazê-las manualmente. Os caminhos longos são mostrados a partir de `~/curso-react`.

## Ao terminar, vai ser possível

- Explicar a diferença entre um campo controlado e um não controlado, provocar o aviso do React de um `value` sem `onChange` e decidir qual dos dois convém a um formulário enviado por inteiro.
- Conectar um `<form action>` com `useActionState`, ler no estado o que a última action retornou e mostrar «Dando de alta…» com `useFormStatus` a partir de um componente filho do formulário.
- Demonstrar com uma figura que o React esvazia os campos não controlados depois de uma action, e preservar o que foi escrito quando houve erros.
- Validar os três campos com um schema que junta **todos** os erros, e comprovar com o compilador que o schema e o tipo `NuevoServicio` não podem divergir.
- Marcar um campo inválido com `aria-invalid` e `aria-describedby`, e medir com uma figura o nome e a descrição acessíveis que um leitor de tela recebe.
- Escolher entre `role="status"` e `role="alert"` para um aviso, e explicar com a especificação por que a região dinâmica precisa existir **antes** de a mensagem chegar.
- Ler na árvore de acessibilidade do Chrome se um campo é obrigatório ou inválido e se uma região dinâmica é lida inteira, antes e depois de uma mudança.

## O porquê antes do como

Até a lição 6, o `revisor` só **lia**: pedia o relatório, pedia o detalhe, e a única mudança que enviava à API era um clique em «Volver a revisar», sem dados. Cadastrar um serviço é outro tipo de problema, porque a pessoa escreve, e o que ela escreve pode estar errado de muitas formas ao mesmo tempo. Basta fazer quatro perguntas ao painel para ver o que falta.

**Onde vive o que se escreve enquanto se escreve?** Um campo de texto já guarda seu valor; o navegador faz isso desde sempre. Dá para deixar que ele guarde e ler o valor ao enviar, ou copiar cada tecla para um estado do React. As duas formas funcionam e as duas têm custo. Escolher sem saber qual é qual leva a formulários que dão avisos no console, que perdem o que foi escrito ou que são renderizados de novo a cada tecla sem necessidade.

**Quem cuida do envio?** Enviar não é uma linha de código. É evitar que o navegador recarregue a página, juntar os valores, mostrar que algo está em andamento, não permitir um segundo envio enquanto isso, esperar a resposta, convertê-la em erros ou em sucesso, e atualizar a lista de serviços que outra página mostra. O React 19 traz peças para cada um desses passos, e esta lição as usa em vez de reinventá-las.

**Quem decide se um valor é válido?** O painel já valida o que **chega** da API com guardas como `esReportePublico`. O que a pessoa escreve também é uma entrada de fronteira, e merece o mesmo tratamento. O curso de TypeScript ensinou a fazer isso com schemas; aqui eles são reutilizados, com uma diferença que importa: um formulário não pode parar no primeiro erro.

**Como fica sabendo quem não vê a tela?** É a cena do começo. Uma borda vermelha e um texto abaixo do campo são informação **visual**. Para que um leitor de tela a anuncie, o texto precisa estar **relacionado** ao campo, e a mensagem de «revise os campos» precisa viver em um lugar que o leitor vigia. Isso não se consegue com boa intenção: consegue-se com atributos concretos, definidos em uma especificação do W3C, e pode ser medido.

As quatro respostas cabem em três conceitos: o campo não controlado (7.1), o formulário como **action** (7.2) e a acessibilidade do formulário e de seus avisos (7.3). A seção 7.4 junta tudo no `revisor` e o confere com as fontes, ponto por ponto. No final, isto é o que `/servicios/nuevo` renderiza (saída do Chrome *headless*, só o formulário):

```text
<form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" novalidate="" aria-describedby="resultado-alta"><div class="campo"><label for="nombre">Nombre</label><input id="nombre" required="" aria-invalid="false" aria-describedby="nombre-ayuda" type="text" value="" name="nombre"><p id="nombre-ayuda" class="ayuda">Un nombre corto y único, por ejemplo: correo</p></div><div class="campo"><label for="url">Dirección</label><input id="url" required="" aria-invalid="false" aria-describedby="url-ayuda" type="url" value="" name="url"><p id="url-ayuda" class="ayuda">La dirección que se va a revisar, con http:// o https://</p></div><div class="campo"><label for="timeoutMs">Tiempo límite (ms)</label><input id="timeoutMs" required="" aria-invalid="false" aria-describedby="timeoutMs-ayuda" type="text" value="" name="timeoutMs"><p id="timeoutMs-ayuda" class="ayuda">Cuántos milisegundos esperar antes de declarar la falla, por ejemplo: 1500</p></div><button type="submit" aria-disabled="false">Dar de alta</button></form><div id="resultado-alta"><div role="alert"></div></div>
```

Cada atributo desse HTML tem um motivo, e ao terminar a lição vai dar para dizer qual. Só um não foi escrito por nós: o `action="javascript:throw new Error(…)"` do `<form>`. É a marca que o React coloca quando `action` é uma função. Nunca é executada em um envio normal, porque o React intercepta o envio antes; só dispararia se alguém chamasse `form.submit()` manualmente, que pula o evento de envio, e então o erro explica o que aconteceu e sugere `requestSubmit()`. E os `value=""` são o reflexo de `defaultValue` no HTML, não um campo controlado.

## Os conceitos

### 7.1 Controlado ou não controlado

#### 7.1.1 O navegador já guarda o que se escreve

Um `<input>` do navegador tem seu próprio valor. Ao escrever nele, o valor muda sem que ninguém programe nada. O React permite trabalhar de duas maneiras com esse fato, e a documentação de `<input>` as nomeia assim ([React, `<input>`](https://react.dev/reference/react-dom/components/input)):

- **Não controlado.** Escreve-se `<input defaultValue="correo" />`. O React coloca o valor **inicial** e depois sai de cena: o que a pessoa escrever vive no elemento do DOM, e é lido quando necessário (ao enviar, por exemplo). A documentação diz com precisão: mesmo passando um valor inicial, o JSX «só especifica o valor inicial; não controla qual deve ser o valor agora».
- **Controlado.** Escreve-se `<input value={nombre} onChange={…} />`. O React força o campo a mostrar **sempre** o valor passado. Cada tecla dispara `onChange`, o estado é atualizado, o React renderiza de novo e o campo mostra o valor novo. Se o estado não for atualizado, o campo não muda.

A primeira figura coloca os dois lado a lado, mais um terceiro que mistura mal as duas ideias: um `value` sem `onChange`. Nos três, a figura «digita» `correo2` como uma pessoa faria (muda o valor e dispara o evento `input`) e lê o que ficou. O controlado tem um toque a mais para deixar claro quem manda: seu `onChange` guarda o texto em maiúsculas.

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

Leia as três linhas de baixo para cima, que é como se entendem melhor:

- **A terceira** recebeu `correo2` e voltou a `correo`. O React o devolveu, porque `value="correo"` diz que o campo vale `correo` **sempre**, e ninguém muda esse valor. Antes disso, o React avisou no console com uma mensagem que vale ler inteira: foi passado um `value` sem `onChange`, o que deixa o campo somente leitura; se ele deve poder mudar, use `defaultValue`; se não, acrescente `onChange` ou `readOnly`. É o aviso desta seção, e a correção depende do que se queria.
- **A segunda** recebeu `correo2` e mostra `CORREO2`. O valor do campo é o que **o nosso** estado decidiu, não o que foi digitado. Isso é «controlado»: dá para transformar, rejeitar ou limitar cada tecla.
- **A primeira** recebeu `correo2` e mostra `correo2`. O React não interveio.

Há um quarto caso que a figura não provoca, mas que a documentação nomeia: um campo não pode passar de não controlado a controlado durante sua vida. Se um `value` começa em `undefined` (por exemplo, porque o estado ainda não tem valor) e depois recebe um texto, o React avisa que um componente «está mudando um campo não controlado para controlado». A correção é que `value` seja um texto desde o primeiro render, nem que seja `""`.

#### 7.1.2 Qual convém a este formulário

A documentação do React não declara um vencedor, e este curso também não: é um princípio próprio, com uma regra prática. **Controle um campo quando a tela precisa do valor dele enquanto se escreve**: uma busca que filtra a lista a cada letra (como a da Lição 5, que além disso guarda o texto no endereço), um contador de caracteres, um botão que é habilitado quando o campo deixa de estar vazio. **Deixe-o não controlado quando ele só importa ao enviar.**

O cadastro do `revisor` é do segundo tipo. Ninguém precisa do nome do serviço enquanto ele é escrito; ele é necessário completo, junto com os outros dois campos, no momento de enviar. Controlar os três significaria três estados, três `onChange` e um render do formulário inteiro a cada tecla, para acabar fazendo o mesmo que o navegador faz de graça. Por isso o `Campo` do ponto de controle é **não controlado**, com `defaultValue`. A próxima seção mostra a peça que torna isso cômodo: o React lê os valores ao enviar, em um `FormData`, e além disso usa `defaultValue` de uma maneira que não é óbvia e que a figura 3 mede.

### 7.2 O formulário como action

#### 7.2.1 `<form action>` recebe uma função

Em HTML, o atributo `action` de um formulário é um **endereço**: ao enviar, o navegador manda os campos para esse endereço e carrega a resposta como uma página nova. O React 19 estende esse atributo: se em vez de um endereço ele receber uma **função**, o React intercepta o envio, junta os campos em um `FormData` e chama a função com ele. A documentação de `<form>` descreve isso em três frases que vale ler juntas ([React, `<form>`](https://react.dev/reference/react-dom/components/form)): a função trata o envio dentro de uma *Transition*; pode ser assíncrona e recebe um único argumento com os dados do formulário; e, diferentemente de `onSubmit`, não é preciso chamar `e.preventDefault()`.

Uma *Transition* é a forma de o React marcar uma atualização como «não urgente»: enquanto ela dura, o React pode continuar respondendo à pessoa e sabe que há algo **pendente**. Quando a função que roda dentro de uma *Transition* se chama «action» (*Action*), o React lhe dá três presentes que esta lição usa: um estado que guarda o que a última action retornou (`useActionState`), uma flag de «pendente» para os componentes de dentro do formulário (`useFormStatus`) e um estado temporário mostrado enquanto a action não termina (`useOptimistic`).

Há mais dois detalhes do mesmo documento que aparecem no código. O primeiro: quando `action` é uma função, o método HTTP é `POST`, seja qual for o atributo `method`. Isso é quase sempre irrelevante, porque o navegador não envia nada por conta própria; a função decide o que pedir e como. O segundo, e o que mais surpreende: **«depois que a função `action` termina com sucesso, todos os campos não controlados do formulário são reiniciados»**. A figura 3 põe isso à prova.

#### 7.2.2 `useActionState`: o resultado da última action

Um formulário precisa lembrar o que aconteceu com o último envio: se houve erros e quais, ou se o cadastro deu certo. `useActionState` é o hook que guarda isso ([React, `useActionState`](https://react.dev/reference/react/useActionState)). Recebe uma função e um estado inicial, e retorna três coisas: o estado atual, uma função para disparar a action e uma flag `isPending`.

```tsx
// fragmento
const [estado, accion] = useActionState(enviar, estadoInicialFormulario);
// …
<form action={accion}>
```

A função passada recebe **dois** argumentos: o estado anterior e o que foi enviado (aqui, o `FormData`). O que ela retorna vira o estado novo. Se lembra um reducer, é porque é um, com uma diferença: pode ser assíncrona e pode ter efeitos, como pedir algo à API. A documentação diz o contrário do que se esperaria da Lição 6: esta função **não** é chamada duas vezes sob `StrictMode`, justamente porque foi pensada para ter efeitos. Um detalhe que confunde muita gente na primeira vez: como o estado anterior é o primeiro argumento, o `FormData` é o **segundo**. A documentação esclarece isso na seção de problemas comuns, porque é exatamente o contrário do que acontece quando `action` recebe uma função solta, sem `useActionState`, que recebe o `FormData` como único argumento. No ponto de controle, o primeiro argumento se chama `_previo`: o sublinhado diz «recebo, mas não uso».

Mais duas regras da mesma página que o ponto de controle respeita. O tipo do que a função retorna precisa ser o mesmo do estado inicial: por isso existe um tipo `EstadoFormulario` com suas três variantes, e o estado inicial é uma delas. E **se a função lançar um erro, o React cancela as actions na fila e mostra o error boundary mais próximo**. No `revisor`, a função captura tudo o que pode falhar e converte em um estado `con-errores`, então esse caminho não é percorrido; mas se um dia um erro escapar, quem o captura é o error boundary da rota da [Lição 5](05-rutas-url-como-estado.md), não uma tela em branco.

Este é o estado do formulário. Três variantes, uma para cada coisa que pode ter acontecido:

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

`textos` guarda **o que a pessoa escreveu**, tal como está, como texto. Não é o mesmo que o valor validado: `timeoutMs` é escrito como `"1500"` e enviado como o número `1500`. Guardar os textos serve para devolvê-los aos campos quando há erros, e é aí que entra o reinício.

#### 7.2.3 O reinício que apaga o que foi escrito

A frase da documentação de `<form>` tem uma consequência prática imediata: «termina com sucesso» quer dizer «a função não lançou um erro», **não** «o cadastro deu certo». Se a função valida, encontra três erros e retorna um estado `con-errores`, para o React ela terminou com sucesso, e o React reinicia os campos. A pessoa vê seus erros… e os campos vazios. Precisa escrever tudo de novo, inclusive o que estava certo.

Para que valor um campo é reiniciado? Para o de `defaultValue`. E aqui está o truque que o ponto de controle usa: o React renderiza o formulário de novo com o estado novo **antes** de reiniciá-lo, então, se `defaultValue` vem do estado, o campo é reiniciado para o que a pessoa tinha escrito. A figura 3 mede isso com um formulário mínimo: escreve `correo`, envia e lê o campo quando a action termina. Faz isso duas vezes, com `defaultValue` fixo em `""` e com `defaultValue` tirado do estado. De quebra, anota o que `useFormStatus` viu de dois lugares, que é o tema de 7.2.4.

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

Com `defaultValue` fixo, o campo ficou vazio; com `defaultValue` vindo do estado, preservou `correo`. É exatamente o que o `revisor` faz: quando o estado é `con-errores`, cada `Campo` recebe como `valorInicial` o texto que a pessoa escreveu. Quando o estado é `agregado`, os textos voltam a `""` e o formulário fica limpo para o próximo cadastro, que é o que se quer depois de um sucesso.

Para que o formulário da figura pudesse ser enviado em um DOM de teste, foi preciso dizer ao Node para usar o `FormData` do jsdom (`FormData: dom.window.FormData`): sem essa linha, o React constrói o `FormData` com o do Node, que não sabe ler um formulário do jsdom, e o envio falha com `FormData constructor: Argument 1 could not be converted`. É um detalhe da figura, não do navegador, mas se um dia aparecer, já se sabe de onde vem.

#### 7.2.4 `useFormStatus`: o botão sabe que há um envio em andamento

Enquanto a action espera a API, a pessoa precisa ver que algo está acontecendo, e não deve conseguir enviar duas vezes. `useFormStatus` responde à pergunta «o formulário em que estou tem um envio pendente?» ([React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)). É importado de `react-dom`, não de `react`, e retorna `pending`, `data`, `method` e `action`.

A expressão que importa é **em que estou**. A documentação adverte isso com um título próprio: `useFormStatus` só informa sobre um `<form>` **pai**, e não sobre um `<form>` renderizado no mesmo componente que chama o hook. A figura 3 mediu isso nos dois lugares: o componente `Formulario`, que renderiza o `<form>`, viu sempre `mismo=false`; o componente `Boton`, renderizado **dentro** do `<form>`, viu `hijo=false` e depois `hijo=true`. Por isso o botão de envio do `revisor` é um componente separado:

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

O texto muda para «Dando de alta…» para quem olha, e o botão fecha a porta para o segundo envio. É um `<button type="submit">` de HTML: é ativado com Enter a partir de qualquer campo e com Espaço ou Enter quando tem o foco, sem uma linha de JavaScript. Essa é a primeira aparição de uma ideia que volta em 7.3: o nativo traz comportamento que o ARIA não traz.

O que ele **não** usa é `disabled`, e o motivo foi medido. A forma óbvia de impedir o segundo envio é `disabled={pending}`, e assim estava escrito no começo. Um botão desativado não pode ter o foco, e isso tem um custo que só aparece com o teclado. Com o Chrome conduzido pelo protocolo de depuração, o formulário preenchido com dados válidos, o foco no botão e a tecla Espaço, isto foi o que o script mediu com `disabled={pending}`:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
pendiente: foco en body; «Dando de alta…» disabled=true aria-disabled=null opacity=1 cursor=default
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=(ausente) focused=(ausente)
segundo Espacio mientras está pendiente
al terminar: foco en body; «Dar de alta» disabled=false aria-disabled=null opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

Enquanto o cadastro estava pendente, o foco já estava no `body` e a árvore de acessibilidade deixou de dizer que o botão tinha o foco; ao terminar, o foco não voltou. Para um leitor de tela, o foco sumiu da página no momento do envio. (Shift+Tab voltou, sim, a «Tiempo límite (ms)», porque o Chrome lembra de onde o foco saiu; ainda assim, quem escuta já não sabe onde está.) Com Enter **a partir de um campo** isso não acontece, porque o foco fica no campo.

O botão do ponto de controle usa `aria-disabled`, que **anuncia** «indisponível» sem tirar o foco, e cancela o clique enquanto há um envio pendente. Cancelar o clique basta: Espaço e Enter sobre o botão chegam como um clique, e o padrão HTML define o envio implícito com Enter a partir de um campo como um evento `click` sobre o botão de envio do formulário ([WHATWG, HTML, «Implicit submission»](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission)). O mesmo script, com o ponto de controle:

```text
antes de enviar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
pendiente: foco en button; «Dando de alta…» disabled=false aria-disabled=true opacity=0.6 cursor=not-allowed
pendiente, árbol de accesibilidad: button «Dando de alta…» disabled=true focusable=true focused=true
segundo Espacio mientras está pendiente
al terminar: foco en button; «Dar de alta» disabled=false aria-disabled=false opacity=1 cursor=default
después de Mayús+Tab: foco en input#timeoutMs
```

O foco ficou no botão durante e depois do envio; a árvore de acessibilidade o mostra como `disabled=true` (que o leitor anuncia como «indisponível» ou «esmaecido») e ao mesmo tempo `focusable=true` e `focused=true`; e o botão **aparece** desativado, com `opacity=0.6` e o cursor `not-allowed`, por uma regra nova da folha de estilos (`button[aria-disabled="true"]`). Atenção ao que `aria-disabled` não faz: não desativa nada, só diz. A MDN explica assim: diferentemente de `disabled`, `aria-disabled="true"` **só** expõe o elemento como desativado; quem desenvolve precisa suprimir seu funcionamento e mudar sua aparência, e o atributo não muda o fato de ele poder receber foco ([MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). A mesma página adverte que o estilo de «desativado» deve continuar cumprindo o contraste de cor; o `opacity: 0.6` do ponto de controle não foi medido contra esse critério. Isso foi comprovado removendo `onClick={alPulsar}` em uma cópia: o segundo Espaço foi, sim, enviado, e o registro da API mostrou dois cadastros seguidos, o segundo rejeitado por repetido:

```text
09:10:21.186 POST /api/servicios 201
09:10:21.491 POST /api/servicios 409
```

(As duas primeiras linhas são das execuções anteriores; as duas últimas, da cópia sem a guarda.) Com a guarda, cada execução deixou um único `POST`. É a mesma ideia de 7.3.1 vista do outro lado: o ARIA descreve, não age, e o comportamento precisa ser escrito por quem programa. Tudo isso foi medido só no Chrome.

#### 7.2.5 `useOptimistic`: mostrar o que a API ainda não confirmou

O cadastro leva 300 ms na API de prática, e em uma rede lenta pode levar muito mais. Enquanto isso, a pessoa pode ver o serviço em uma lista «Altas de esta sesión», marcado como pendente. Esse estado mostrado **antes** da confirmação é o que a documentação chama de otimista ([React, `useOptimistic`](https://react.dev/reference/react/useOptimistic)).

`useOptimistic(valor, reductor)` retorna um par: o estado que é mostrado e uma função para mudá-lo. Sua regra central é uma frase da documentação: o estado otimista **só é renderizado enquanto uma action está em andamento; caso contrário, renderiza-se `valor`**. Não é preciso «limpá-lo»: quando a action termina, o estado otimista e o real coincidem no mesmo render. E a função que o muda precisa ser chamada **dentro de uma action**; chamada fora, o React avisa com `An optimistic state update occurred outside a Transition or Action` e o estado otimista aparece e desaparece em um instante.

No `revisor`, o valor real é `altas`, um estado com os cadastros confirmados desta sessão, e o redutor acrescenta um nome marcado como `pendiente`. O redutor ignora um nome que já está na lista. Assim, se o cadastro de `correo` foi confirmado uma vez e alguém tenta `correo` de novo, a lista não mostra uma segunda linha pendente enquanto a API decide (e a API vai responder `409`).

#### 7.2.6 O estado que muda depois de um `await`

A frase «o estado otimista e o real coincidem no mesmo render» tem uma condição, e a documentação de `useActionState` a escreve em suas advertências: ao mudar o estado **depois de um `await`** dentro da action, por enquanto é preciso envolver essa mudança em um `startTransition` adicional ([React, `useActionState`](https://react.dev/reference/react/useActionState)). O motivo é que o que vem depois de um `await` já não roda «dentro» da action aos olhos do React: é uma atualização urgente renderizada imediatamente, mesmo que a action continue pendente.

No cadastro, `establecerAltas` vem depois de `await darDeAlta(…)`. Para ver o que acontece sem `startTransition`, removeu-se em uma cópia o descarte de duplicados do redutor (que, se não, disfarça o problema) e cadastrou-se um serviço no Chrome, com o servidor de desenvolvimento, registrando cada versão da lista «Altas de esta sesión» e o console:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo3 (agregando…)»]
  [«correo3», «correo3 (agregando…)»]
  [«correo3»]
consola:
  error: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. correo3
```

No meio apareceram **duas** linhas com o mesmo nome, uma confirmada e outra ainda «agregando…», e o React avisou no console que dois filhos tinham a mesma `key` (o `` `%s` `` é o espaço da mensagem onde vai a chave; a ferramenta de medição o imprimiu como está e colocou a chave, `correo3`, no final). É a atualização urgente sendo renderizada por cima do estado otimista, que continuava vivo porque a action não tinha terminado. A mesma cópia, sem descarte de duplicados, mas com a mudança envolvida em `startTransition`:

```text
filas de «Altas de esta sesión», en el orden en que se dibujaron:
  [«correo4 (agregando…)»]
  [«correo4»]
consola:
```

Uma linha pendente e depois a confirmada, sem passos intermediários e sem aviso. O ponto de controle leva `startTransition` em volta das duas mudanças que vêm depois do `await` (os cadastros e o aviso da bandeja), e mantém o descarte de duplicados para o que é de fato seu papel: o nome repetido do parágrafo anterior. É uma medição de uma execução no Chrome; o que a respalda em geral é a advertência da documentação.

#### 7.2.7 O formulário completo

Este é o componente que junta as peças. Leia de cima para baixo com este guia: os dois hooks de estado (`altas` e sua versão otimista); a função `enviar`, que é a action; `useActionState`; e o JSX, com o formulário, a região de erros e a lista otimista.

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

A função `enviar` segue a ordem de uma fronteira, a mesma que `cargarReporte` segue com a resposta da API: primeiro lê (`textosDe`), depois valida (`validarCampos`), e só com dados válidos faz alguma coisa. Se a validação falha, a API **não é chamada**: os erros são retornados no estado e não há nenhuma requisição. Se a validação passa, a linha otimista é acrescentada, envia-se, e a resposta se traduz em um de três finais:

1. A API rejeitou o cadastro (`400` ou `409`): estado `con-errores`, com os erros **da API** por campo e os textos para não perder o que foi escrito.
2. A API aceitou (`201`): dentro de `startTransition`, acrescenta-se o cadastro confirmado e manda-se o aviso de sucesso para a bandeja da Lição 6, que é o **único** anúncio do sucesso (7.3.3 explica por quê); depois a consulta `["reporte"]` é invalidada para que a lista de `/` traga o serviço novo na próxima vez que aparecer, e o estado passa a `agregado`.
3. Algo falhou de outra forma (a rede, uma resposta inesperada): o `catch` converte isso em `con-errores` com uma mensagem geral, sem erros por campo.

`noValidate` no `<form>` desliga a validação do navegador. A documentação da MDN descreve o atributo como «o formulário não deve ser validado ao ser enviado» ([MDN, `<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form)). Ela é desligada porque o formulário faz a sua, com as mensagens do schema e com todos os erros de uma vez; se ficasse ligada, o navegador interromperia o envio no primeiro campo com um balão próprio, diferente em cada navegador, e a action não seria executada.

#### 7.2.8 Validar com o schema: todos os erros de uma vez

O schema vem do curso de TypeScript quase igual. Um `Esquema<T>` é um objeto com um método `leer` que recebe `unknown` e retorna um resultado: ou um valor do tipo `T`, ou um detalhe do erro. `Inferir` extrai o tipo `T` de um schema, para não escrevê-lo duas vezes. Aos schemas de lá somam-se dois de que este formulário precisa: `urlHttp`, que aceita só endereços `http:` ou `https:` e os normaliza com `URL`, e `enteroPositivoDeTexto`, que lê um número escrito como texto, porque **tudo o que sai de um `FormData` é texto**.

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

A diferença que importa está no final, em `validarCampos`. Em TypeScript, o schema de um objeto parava no primeiro campo inválido, e para uma API isso está certo: rejeita a requisição e explica o primeiro motivo. Um formulário não pode fazer isso. Se a pessoa deixou o nome vazio **e** escreveu o endereço errado, dizer só o primeiro a obriga a enviar, corrigir, enviar outra vez e descobrir o segundo erro. A figura 2 compara as duas estratégias com o mesmo envio inválido:

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

Três erros encontrados de uma vez contra um. E a última linha mostra a normalização: `" https://correo.example "` sai como `https://correo.example/`, sem espaços e com a `/` final que `URL` acrescenta. Esse é o valor que viaja para a API.

O schema do cadastro junta três schemas em um objeto e deriva dele os três tipos que o formulário usa: os valores validados, os erros por campo e os textos crus.

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

A última linha merece uma leitura lenta, porque não faz nada em tempo de execução e, no entanto, é a mais importante do arquivo. `comprobarContrato` é uma função que recebe `ValoresAlta` e o retorna como `NuevoServicio`, o tipo que a API espera segundo `src/compartido/contrato.ts`. Se alguém mudar o schema (acrescentar um campo, renomeá-lo ou mudar seu tipo) e ele deixar de coincidir com o tipo da API, essa atribuição deixa de compilar e `npm run build` para em `tsc -b`. Em «O erro que vai aparecer», isso vai ser provocado.

#### 7.2.9 A fronteira de rede do cadastro

`darDeAlta` faz com a resposta do `POST` o mesmo que `cargarReporte` faz com a do `GET`: não confia nela. Traduz os três códigos que a API documenta e lança um erro para qualquer outro. Há um caso que escapa antes: se o corpo não for JSON (por exemplo, porque o servidor de prática está desligado e quem responde é o *proxy* do Vite), o erro é lançado por `respuesta.json()`, e a mensagem que aparece na região de erros é a do JavaScript, não «la API respondió …». Isso se deduz do código; não foi medido.

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

O caso interessante é o `409`. A API responde `{"detalle":"ya existe un servicio llamado correo","campos":{"nombre":"ese nombre ya existe"}}`, e `erroresDe` converte `campos` em um `ErroresAlta`. Assim, um erro que **só a API pode saber** (o formulário não conhece os nomes que já existem) aparece junto do campo correto, com a mesma aparência e a mesma acessibilidade de um erro de validação local. Para o formulário, não há diferença entre «o schema disse não» e «a API disse não»: os dois chegam como erros por campo.

### 7.3 Acessibilidade: o nativo primeiro, ARIA onde o nativo não alcança

#### 7.3.1 A primeira regra do ARIA

ARIA (*Accessible Rich Internet Applications*) é uma especificação do W3C que acrescenta atributos ao HTML para descrever às tecnologias assistivas — um leitor de tela, por exemplo — o que um elemento **é** (`role`), em que **estado** está (`aria-invalid`) e com o que **se relaciona** (`aria-describedby`). O guia do W3C para usá-la começa com uma regra, a primeira, que este curso segue ao pé da letra: se for possível usar um elemento ou atributo nativo do HTML que já traz a semântica e o comportamento necessários, em vez de reaproveitar outro elemento e acrescentar a ele um role, um estado ou uma propriedade ARIA, faça isso ([W3C, «Using ARIA»](https://www.w3.org/TR/using-aria/)). A segunda regra complementa: não mude a semântica nativa a menos que seja realmente necessário.

O motivo está em uma frase do guia de práticas do ARIA: diferentemente dos elementos de formulário do HTML, os roles ARIA **não fazem o navegador acrescentar comportamento de teclado nem estilos** ([W3C, «ARIA Authoring Practices Guide: Read Me First»](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)). Um `<div role="button">` diz ao leitor de tela «sou um botão», mas não responde a Enter, não entra na ordem de tabulação e não envia o formulário. Um `<button type="submit">` faz as três coisas sem pedir nada. O mesmo guia resume isso no título de sua seção: «nenhum ARIA é melhor que um ARIA ruim».

No formulário do `revisor`, o nativo resolve quase tudo:

- **`<label htmlFor>`** dá nome a cada campo. A MDN descreve duas vantagens: o leitor de tela lê o rótulo quando o campo recebe o foco, e ao clicar no rótulo o foco passa para o campo, o que aumenta a área em que se pode tocar ([MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). Em JSX, o atributo `for` se escreve `htmlFor`.
- **`<button type="submit">`** envia com Enter a partir de qualquer campo, entra sozinho na ordem de tabulação e pode ser desativado com `disabled`.
- **A ordem do documento** é a ordem de tabulação. A MDN diz isso para os elementos focáveis sem `tabindex` positivo: a ordem de navegação do foco é a ordem no código-fonte ([MDN, `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)). Por isso o formulário não usa um único `tabindex`: os campos estão escritos na ordem em que são preenchidos.
- **`:focus-visible`** marca onde está o foco quando a pessoa navega com o teclado. A MDN o define como a pseudoclasse que se aplica quando o elemento tem o foco e o navegador determina, por heurística, que esse foco deve ficar evidente ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)). Na prática: em um botão ou um link, aparece ao tabular e não ao clicar com o mouse; em um campo de texto, aparece também com o clique, porque o navegador supõe que se vai digitar e é preciso ver onde. A MDN dá exatamente esse exemplo: um botão clicado com o mouse em geral não mostra o foco, e um campo de texto que espera digitação, sim.

O ARIA entra em dois lugares onde o HTML não tem equivalente: relacionar um campo ao seu erro, e avisar de uma mudança que aconteceu longe do foco.

#### 7.3.2 O campo: `aria-invalid` e `aria-describedby`

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

Uma relação ou um estado por atributo:

- **`htmlFor={nombre}` com `id={nombre}`**: o nome acessível do campo é seu rótulo.
- **`required`**: o campo é obrigatório. É o atributo nativo do HTML, e por isso não se escreve `aria-required`: o WAI-ARIA define `aria-required` como «uma entrada é necessária no elemento antes de enviar o formulário» e cita como conceito relacionado o `required` do HTML ([W3C, WAI-ARIA 1.2, `aria-required`](https://www.w3.org/TR/wai-aria-1.2/#aria-required)), e a especificação que traduz o HTML para a API de acessibilidade de cada sistema operacional expõe `required` da mesma forma que `aria-required` ([W3C, «HTML Accessibility API Mappings»](https://www.w3.org/TR/html-aam-1.0/)). Com `noValidate` no formulário, o navegador já não interrompe o envio por causa de um campo vazio, mas o atributo continua dizendo «obrigatório». Isso foi medido na árvore de acessibilidade do Chrome (7.4.2): sem o atributo, os três campos saíam com `required=false`; com ele, com `required=true`.
- **`aria-invalid`**: o estado. A especificação o define como «o valor inserido não está no formato que a aplicação espera» e pede ao autor que o coloque em `true` quando o valor é calculado como inválido ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). O leitor o anuncia como «inválido» ou «entrada inválida», conforme o leitor.
- **`aria-describedby`**: a explicação. A especificação o define como o atributo que identifica o elemento, ou os elementos, que **descrevem** o objeto, e distingue o rótulo, que deve ser conciso, da descrição, pensada para dar informação mais detalhada ([W3C, WAI-ARIA 1.2, `aria-describedby`](https://www.w3.org/TR/wai-aria-1.2/#aria-describedby)). Recebe uma lista de identificadores separados por espaços, e a especificação que calcula os textos acessíveis os junta **nessa ordem**, separados por um espaço ([W3C, «Accessible Name and Description Computation 1.2»](https://www.w3.org/TR/accname-1.2/)). Por isso o erro vem primeiro: `nombre-error nombre-ayuda` é lido como «escribe un valor», e depois a ajuda.

A figura 4 renderiza uma cópia reduzida do `Campo` (as mesmas relações, sem `type`, `required` nem classes) sem erro, com erro e, para comparar, uma versão «à moda antiga» com um texto acima e outro abaixo, sem `<label>` nem relações. Para cada um, calcula o nome e a descrição acessíveis com `dom-accessibility-api`, uma biblioteca que implementa esse cálculo do W3C:

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

O que um leitor de tela lê ao chegar ao campo é, essencialmente, essas duas linhas mais o role e o estado: «Nombre, campo de texto, inválido, escribe un valor. Un nombre corto y único, por ejemplo: correo». A versão sem relações tem **nome vazio e descrição vazia**: visualmente diz o mesmo, mas para quem não vê a tela é um campo de texto sem nome. Essa é a cena do começo, medida. (A figura calcula o que **a especificação** diz que o navegador deve expor; como cada leitor de tela o pronuncia não dá para medir com uma execução, e se comprova manualmente.)

Há três decisões do componente que têm sua fonte:

- **`aria-invalid` vale `false` até que se tente enviar.** O campo começa sem erro, então o atributo sai como `aria-invalid="false"`, e só passa a `true` quando um envio retornou um erro para esse campo. A especificação recomenda isso para os obrigatórios vazios: se a pessoa ainda não tentou enviar o formulário, o autor **não deveria** marcar como inválido um campo obrigatório só porque ele ainda não tem dados ([W3C, WAI-ARIA 1.2, `aria-invalid`](https://www.w3.org/TR/wai-aria-1.2/#aria-invalid)). É um «não deveria» (*SHOULD NOT*), não uma proibição, e fala do campo vazio: marcar um formato inválido antes de enviar, por exemplo ao sair do campo, é outra decisão que a especificação não fecha. A MDN explica com outras palavras: a pessoa pode continuar preenchendo ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). Com `required` havia uma dúvida: a mesma tabela do HTML-AAM permite ao navegador expor por conta própria um campo obrigatório vazio como inválido depois que a pessoa o tocou. Isso foi medido no Chrome: ao entrar em «Nombre» e sair com Tab sem escrever, a árvore de acessibilidade continuou dizendo `invalid=false` nos três campos. Outros navegadores não foram medidos.
- **O texto do erro está escrito, não só pintado.** A borda vermelha (`input[aria-invalid="true"]` na folha de estilos) ajuda quem vê, mas o critério 3.3.1 das diretrizes WCAG 2.2 pede que, se um erro de entrada for detectado, o elemento com erro seja identificado e o erro **seja descrito em texto** ([W3C, «Understanding SC 3.3.1: Error Identification»](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)). E uma cor não chega a quem não distingue o vermelho.
- **`aria-describedby` e não `aria-errormessage`.** O ARIA 1.2 tem um atributo específico para a mensagem de erro, `aria-errormessage`, que a MDN descreve como o que identifica o elemento que contém a mensagem de erro e que só é usado quando `aria-invalid` é `true` ([MDN, `aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage)). O ponto de controle usa `aria-describedby` porque o campo já precisa de uma descrição para sua ajuda, e porque é o padrão que o tutorial de formulários do W3C mostra para associar um campo à sua mensagem de erro ([W3C WAI, «Forms Tutorial: User Notifications»](https://www.w3.org/WAI/tutorials/forms/notifications/)). É uma escolha do curso; as duas formas têm respaldo.

#### 7.3.3 O aviso: regiões dinâmicas

O campo resolve o erro **onde está o foco**. Mas depois de apertar Enter, o foco continua no botão ou no último campo, e a mensagem «Revisa los campos marcados.» aparece em outra parte da página. Se nada a anunciar, o Raúl não fica sabendo. É para isso que existem as **regiões dinâmicas** (*live regions*): partes da página que a tecnologia assistiva vigia, e cujas **mudanças** ela anuncia mesmo com o foco em outro lugar.

O critério 4.1.3 da WCAG 2.2 pede isso para as mensagens de status: elas devem poder ser determinadas por role ou propriedades, para que a tecnologia assistiva as apresente **sem que recebam o foco** ([W3C, «Understanding SC 4.1.3: Status Messages»](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). O ARIA oferece dois roles para isso, e o formulário usa os dois:

- **`role="status"`**: segundo a especificação, uma região dinâmica com informação de aviso que não é tão importante a ponto de justificar um alerta, com `aria-live` implícito em `polite` e `aria-atomic` implícito em `true` ([W3C, WAI-ARIA 1.2, `status`](https://www.w3.org/TR/wai-aria-1.2/#status)). «Polite» (educado) quer dizer que o leitor espera terminar o que está dizendo. A MDN acrescenta uma indicação: não dê o foco ao status quando seu conteúdo muda ([MDN, role `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role)).
- **`role="alert"`**: uma região dinâmica com informação importante e, em geral, urgente; `aria-live` implícito em `assertive` e `aria-atomic` em `true` ([W3C, WAI-ARIA 1.2, `alert`](https://www.w3.org/TR/wai-aria-1.2/#alert)). «Assertive» quer dizer que interrompe. A MDN adverte que, por sua natureza intrusiva, ele deve ser usado com moderação e só quando a atenção imediata da pessoa é necessária ([MDN, role `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)).

O formulário usa `alert` para «Revisa los campos marcados.» e para as rejeições da API, porque a pessoa não pode continuar sem tratá-las. O sucesso é uma boa notícia que pode esperar o leitor terminar, então vai em um `status`, e aqui há uma decisão tomada com medição. A bandeja da Lição 6 já é um `role="status"`, e o cadastro manda seu aviso para ela. Se o formulário tivesse também seu próprio `status` com «Se dio de alta correo.», o sucesso chegaria **duas vezes**. Assim se mediu no Chrome, observando as regiões dinâmicas enquanto um serviço era cadastrado, com o formulário que tinha as duas:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo Descartar»
  status (formulario): «Se dio de alta correo.»
```

E com o formulário do ponto de controle, que deixa o sucesso só para a bandeja:

```text
cambios en las regiones vivas:
  status (bandeja): «Se dio de alta correo5 Descartar»
```

Uma única mudança, em um único lugar. A MDN adverte, a propósito dos alertas, que vários avisos ao mesmo tempo criam uma experiência ruim ([MDN, role `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)); com avisos educados o problema é mais suave, mas é o mesmo: a pessoa ouve a mesma notícia duas vezes. Escolheu-se a bandeja e não o formulário porque a bandeja é o lugar dos avisos de toda a aplicação (também recebe os da nova tentativa) e porque o aviso sobrevive se a pessoa sair da página.

`aria-atomic` decide **quanto** é lido. Com `true`, implícito em `alert` e em `status`, o leitor apresenta a região **inteira** toda vez que ela muda, mesmo que só uma parte tenha mudado ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Para a mensagem de uma linha do formulário, é o que se quer. Para a bandeja, não: é uma lista que cresce até cinco avisos, cada um com seu botão «Descartar», e com `true` o quinto aviso faria o leitor repetir os cinco. Por isso a região da bandeja leva `aria-atomic="false"`, que deixa anunciar só o que foi acrescentado. A árvore de acessibilidade do Chrome confirma: antes, a região da bandeja saía com `atomic=true`; com o atributo, com `atomic=false`, e a região de erros do formulário continua com `atomic=true` (7.4.2 tem as duas leituras).

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

A regra mais quebrada com as regiões dinâmicas está no guia da MDN, e explica a forma do JSX: a tecnologia assistiva em geral só anuncia as mudanças **dinâmicas** do conteúdo de uma região dinâmica; é preciso **estabelecer a região antes** de atualizar seu conteúdo, começar com a região vazia, e a forma mais confiável é incluí-la na marcação inicial ([MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)). Por isso o ponto de controle não escreve isto:

```tsx
// fragmento: la región nace junto con su mensaje (no lo hagas así)
{estado.tipo === "con-errores" && <div role="alert">{estado.detalle}</div>}
```

e sim isto, em que o `div` existe desde o primeiro render e só muda o que está dentro (a bandeja faz o mesmo com seu `role="status"`):

```tsx
// fragmento de FormularioAlta.tsx
<div role="alert">{estado.tipo === "con-errores" && <p>{estado.detalle}</p>}</div>
```

O mesmo guia da MDN reconhece que com `role="alert"` o conteúdo é anunciado «na maioria dos casos» mesmo que a região apareça de repente; mas «a maioria dos casos» não é uma regra, e com `status` não há essa exceção. Escrever as regiões vazias desde o início funciona para os dois roles.

O `<form>` tem também `aria-describedby="resultado-alta"`, que aponta para o contêiner da região de erros. Não é ele que faz o anúncio (isso é o role); é uma descrição do formulário para quem chega a ele navegando, que inclui o último erro. Quando cada leitor de tela lê a descrição de um formulário não está definido e não foi medido: confira manualmente, e se o erro for ouvido duas vezes, é este atributo.

#### 7.3.4 O que uma região dinâmica não anuncia

Uma região dinâmica anuncia **mudanças**. A figura 5 faz o papel de ouvido: renderiza uma região `role="alert"`, observa-a com um `MutationObserver` (a API do navegador que avisa quando o DOM muda) e manda três envios seguidos: dois com a mesma mensagem e um diferente.

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

O componente foi renderizado nos três envios, mas o DOM da região só mudou no primeiro e no terceiro. No segundo, o React comparou o texto novo com o anterior, viu que eram iguais e não mexeu em nada: é a reconciliação da Lição 1 fazendo exatamente seu trabalho. Para um leitor de tela, isso significa que **um segundo envio com o mesmo erro não é anunciado**. A figura mede o DOM, não o leitor; que o leitor fique calado quando o DOM não muda é o que se deduz do guia da MDN (anuncia mudanças dinâmicas), e se comprova manualmente. No formulário do `revisor`, isso acontece se a pessoa apertar Enter duas vezes sem corrigir nada: na segunda vez o campo continua marcado e sua descrição continua dizendo o erro ao chegar a ele, mas não há anúncio. É o segundo Enter do Raúl, e o exercício 3 pede para resolvê-lo.

### 7.4 O cadastro no `revisor` e sua revisão contra as fontes

#### 7.4.1 A página, a rota e o link

A página é curta: coloca o título da aba com o hook da Lição 3 e envolve o formulário no `Tarjeta` da Lição 1, que dá a ele um cabeçalho `<h2>` e uma seção com nome.

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

A rota nova é acrescentada entre as filhas do layout. A ordem no array não decide qual vence (o React Router classifica as rotas e um segmento fixo vence um dinâmico, como se comprovou na Lição 5), mas escrevê-la **antes** de `servicios/:nombre` deixa à vista, para quem lê, que `nuevo` é um endereço fixo e não o nome de um serviço. Repare também em `ErrorBoundary: ErrorDeRuta` na rota de fora: é o error boundary da Lição 5, o que capturaria um erro que escapasse da action do formulário.

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

O layout acrescenta um link na navegação principal. É um `NavLink` da Lição 5, então o React Router coloca `aria-current="page"` nele quando se está em `/servicios/nuevo`, e um leitor de tela anuncia que é a página atual:

```tsx
// fragmento de revisor/src/app/Disposicion.tsx: lo único que cambia
<NavLink to="/servicios/nuevo">Dar de alta</NavLink>
```

E a folha de estilos cresce com o que o formulário precisa. Este é o bloco acrescentado no final de `src/reporte/panel.css`:

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

Três regras contam para a acessibilidade. `.campo input[aria-invalid="true"]` pinta a borda vermelha **a partir do atributo ARIA**, então o que vê quem olha e o que ouve quem escuta saem do mesmo dado e não podem se contradizer; é o seletor que a MDN recomenda para estilizar os campos inválidos ([MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid)). E `:focus-visible` desenha um contorno azul de 3 pixels em volta do que tem o foco quando o navegador decide que ele deve aparecer: sempre ao navegar com Tab, e também ao clicar em um campo de texto (7.3.1). Sem ele, quem navega com o teclado depende do contorno padrão de cada navegador, que em alguns fundos quase não aparece. E `button[aria-disabled="true"]` esmaece o botão enquanto há um envio pendente: com `disabled`, o navegador o esmaecia sozinho; com `aria-disabled`, não, e sem esta regra quem olha não saberia que o botão não responde (7.2.4).

O `package.json` só muda a versão para `0.7.0`: esta lição não acrescenta dependências.

Com tudo no lugar, o ponto de controle passa nas duas verificações do curso. `npm run lint` não escreve nada (as regras do React aceitam os hooks novos e `startTransition` do jeito que são usados) e o build termina bem:

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

#### 7.4.2 A revisão, ponto por ponto

Esta tabela confere o formulário e seus avisos com o que dizem o WAI-ARIA e a MDN. A coluna «Como se sabe» separa o que foi medido do que se deduz do código ou se comprova manualmente.

| O que a fonte pede | O que o `revisor` faz | Como se sabe |
|---|---|---|
| Usar o elemento nativo antes do ARIA (Using ARIA, regra 1) | `<label>`, `<input>`, `<button type="submit">`, `<form>`; nenhum `role` nos controles | Leitura do código |
| Cada campo com nome (WCAG 3.3.2) | `label htmlFor` com `id` igual ao `name` | Medido: figura 4, nome «Nombre» |
| O erro identificado e descrito em texto (WCAG 3.3.1) | Texto do erro em um `<p>` ligado por `aria-describedby`, mais a borda | Medido: figura 4, descrição com o erro |
| `aria-invalid` em `true` só depois de tentar enviar (WAI-ARIA 1.2) | `false` ao renderizar; `true` quando o estado traz um erro para esse campo | Medido: figura 4 e o HTML de `/servicios/nuevo` |
| Mensagens de status sem receber o foco (WCAG 4.1.3; MDN, `status`) | `role="alert"` para erros no formulário, `role="status"` da bandeja para o sucesso; nenhum recebe o foco | Leitura do código |
| A região dinâmica existe antes da mensagem (MDN, *Live regions*) | A região de erros e a da bandeja são renderizadas vazias desde o primeiro render | Medido: o HTML de `/servicios/nuevo` as traz vazias |
| Vários avisos ao mesmo tempo são uma experiência ruim (MDN, `alert`) | O sucesso é anunciado uma vez, na bandeja | Medido no Chrome: antes, duas regiões mudavam; agora, uma |
| Declarar os obrigatórios (WAI-ARIA, `aria-required`; HTML-AAM, `required`) | `required` nos três campos | Medido na árvore de acessibilidade: `required=false` antes, `required=true` agora |
| Ler a região inteira só quando convém (WAI-ARIA, `status`; MDN, `aria-atomic`) | `aria-atomic="false"` na bandeja; o `alert` do formulário mantém `true` | Medido na árvore de acessibilidade: a bandeja passou de `atomic=true` para `atomic=false` |
| `alert` com moderação (MDN, `alert`) | Só para erros que impedem continuar | Leitura do código |
| Ordem de foco igual à ordem do documento, sem `tabindex` positivo (MDN, `tabindex`) | Nenhum `tabindex`; campos na ordem de preenchimento | Medida a ordem do documento no HTML de `/servicios/nuevo`; percorrê-la é manual |
| Foco visível ao navegar com teclado | `:focus-visible` com contorno de 3 px | Comprova-se manualmente |
| `aria-disabled` só expõe o estado; o autor suprime a função e muda a aparência (MDN, `aria-disabled`) | `aria-disabled={pending}`, clique cancelado enquanto está pendente e `button[aria-disabled="true"]` esmaecido | Medido no Chrome: o foco fica no botão, a árvore o mostra como `disabled=true` e `focused=true`, `opacity=0.6`, um único `POST` |

As leituras da árvore de acessibilidade saíram do Chrome *headless*, com `Accessibility.getFullAXTree`, a mesma árvore que o navegador entrega aos leitores de tela. Com o formulário de antes das correções:

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

E com o ponto de controle:

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

O primeiro `status` é o da bandeja; com o formulário de antes havia um segundo `status`, o do sucesso no formulário, que já não existe. Os três campos passaram a `required=true`, e nenhum ficou `invalid` por ter sido tocado sem escrever.

E um ponto em que o formulário fica devendo, dito com a mesma franqueza:

1. **Um erro repetido não é anunciado de novo.** Medido na figura 5 sobre uma região igual à do formulário; o efeito no leitor se deduz, não foi medido. É o segundo Enter do Raúl, e é o exercício 3.

## O erro que vai aparecer

A lição tem um erro principal, o que aparece no console, e três de apoio que não se veem a olho nu.

**O erro principal: um `value` sem `onChange`.** Ao trocar `defaultValue` por `value` em `Campo.tsx`, pensando que «assim o campo mostra o valor do estado», o React escreve no console do navegador o aviso que a figura 1 capturou:

```text
You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.
```

E o campo vira somente leitura: digita-se e nada acontece, como o terceiro caso da figura. A mensagem oferece as três saídas, e a que corresponde a este formulário é a primeira, `defaultValue`. Não é um erro de compilação nem do linter: o TypeScript aceita `value` em um `<input>`, e `npm run build` termina bem. Aparece no console do navegador em desenvolvimento, e na tela, porque não dá para digitar.

**O erro do compilador: o schema se separou da API.** Em uma cópia do ponto de controle, troque em `esquemaAlta.ts` a chave `timeoutMs` por `tiempoMs` e rode `npx tsc -b`:

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

Uma chave foi renomeada e o compilador encontrou seis lugares em quatro arquivos onde isso quebra algo, e terminou com código 1. Esse código é o que importa: por isso `npm run build`, que é `tsc -b && vite build`, nunca chega a `vite build`. Eles se leem em dois grupos. Os dois `TS2741` dizem o mesmo de dois lugares: `ValoresAlta` já não tem `timeoutMs`, então não pode ser usado como `NuevoServicio`. Um está em `esquemaAlta.ts(21,…)`, que é `comprobarContrato`, e o outro em `FormularioAlta.tsx(40,…)`, a chamada a `darDeAlta(validacion.valor)`. Os outros quatro são lugares que ainda escrevem `timeoutMs` à mão (os dois atributos do `Campo` do tempo limite em `FormularioAlta`, `textosDe` e `erroresDe`) e que agora não coincidem com os tipos derivados do schema. Sem esses tipos derivados, o formulário enviaria à API um corpo com `tiempoMs` e a API responderia `400` por um campo `timeoutMs` que o formulário já não sabe mostrar. Com eles, o erro aparece antes de executar qualquer coisa. `comprobarContrato` é a linha que garante esse aviso mesmo que um dia mais ninguém chame `darDeAlta` com os valores do schema.

**O silencioso: `useFormStatus` no componente errado.** Ao mover `useFormStatus` para `FormularioAlta` para «economizar um componente», `pending` fica `false` sempre: o botão nunca diz «Dando de alta…», nunca é marcado como indisponível e nunca ignora o segundo envio, então um clique duplo envia duas vezes. Não há aviso no console nem no linter. A figura 3 mediu isso (`mismo=false` nas duas execuções) e a documentação o marca como advertência. A correção é a do ponto de controle: o hook vai em um componente renderizado **dentro** do `<form>`.

**O outro silencioso: os campos que se esvaziam.** Se `Campo` recebesse um `defaultValue` fixo, cada envio com erros deixaria os campos vazios, como na primeira execução da figura 3. Ninguém avisa também. O sinal é a reclamação de quem preenche o formulário: «apagou tudo».

## O que se faz errado

**Controlar todos os campos por costume.** Três estados e três `onChange` para um formulário que só é lido ao enviar é trabalho que o navegador já fazia, com um render completo a cada tecla. Controle quando a tela precisa do valor enquanto se escreve.

**Validar com `onSubmit` e `e.preventDefault()` e um `useState` para «enviando».** Funciona, e é reinventar `<form action>`, `useActionState` e `useFormStatus`, com mais lugares para errar (esquecer de desativar o botão, esquecer de reativá-lo quando há erro).

**Parar no primeiro erro.** Obriga a pessoa a descobrir os erros um a um, com um envio para cada. Um formulário junta todos.

**Chamar a API sem validar antes.** O schema rejeita no navegador o que a API rejeitaria, sem uma requisição e com mensagens junto de cada campo. A API continua validando, porque não pode confiar na tela; as duas validações não competem, se complementam. E há validações que só o servidor pode fazer: um revisor real que visita os endereços cadastrados precisa rejeitar os da própria rede (`127.0.0.1`, `169.254.169.254`, `10.x`…), ou qualquer um poderia usá-lo para espiar lá dentro. Esse ataque se chama falsificação de requisições do lado do servidor (SSRF), e o curso de HTTP da Hábil o trata no quadro de segurança da sua lição 1. `urlHttp` aceita esses endereços sem reclamar: o schema do navegador não protege disso, nem pretende.

**Erros que são só cor.** Uma borda vermelha sem texto não diz nada a um leitor de tela nem a quem não distingue o vermelho. A WCAG 3.3.1 pede o erro em texto.

**Um texto de erro solto, sem `aria-describedby`.** Aparece, mas não está relacionado ao campo: a figura 4 mostrou que um leitor não o associa.

**`aria-invalid="true"` desde o primeiro render.** Grita «inválido» antes de a pessoa ter escrito qualquer coisa. A especificação recomenda não marcar um obrigatório vazio antes de se tentar enviar.

**Desativar o botão que tem o foco.** `disabled` impede o envio duplo, mas leva o foco embora: medido no Chrome, ele cai no `body` e não volta. `aria-disabled` com o clique cancelado preserva o foco (7.2.4).

**`aria-disabled` sem a guarda.** O atributo diz «indisponível», mas não impede nada: medido, o segundo Espaço foi enviado.

**Anunciar a mesma coisa em duas regiões dinâmicas.** Um sucesso no formulário e outro igual na bandeja são ouvidos duas vezes. Um aviso, um lugar.

**A região dinâmica que nasce com sua mensagem.** `{error && <div role="alert">…</div>}` pode não ser anunciada. A região vai vazia desde o início e o que muda é seu conteúdo.

**`role="alert"` para tudo.** Interrompe. Um sucesso, um «salvo» ou um «carregando» são `status`.

**ARIA onde há um elemento nativo.** Um `<div role="button" onClick>` em vez de um `<button>` perde o teclado, a ordem de tabulação e o envio do formulário. A primeira regra do ARIA existe por isso.

**Mover o foco para a mensagem de erro com `tabindex` positivo ou com truques de ordem.** Bagunça a navegação de todos. Se um dia a decisão for mover o foco, que seja com `tabindex="-1"` e `.focus()` sobre a mensagem, e que seja uma decisão tomada, não um remendo.

## Exercícios

### Exercício 1 — Prever o `FormData`

Sem rodar nada, escreva no diário de bordo o `FormData` que `enviar` recebe se a pessoa escrever ` correo ` (com espaços), `https://correo.example` e `1500`, e o que `validarCampos` retorna com esses textos. Que tipo `timeoutMs` tem em cada um dos dois? Depois confira: acrescente um `console.log(textos, validacion)` temporário em `enviar`, envie o formulário com `npm run dev` e leia o console do navegador. Remova a linha ao terminar.

### Exercício 2 — O `409` de perto

Com o servidor de prática e `npm run dev` rodando, cadastre `correo` duas vezes. **Antes** do segundo envio, preveja: que campo fica marcado, o que diz sua descrição, o que a região `alert` anuncia e o que fica escrito nos três campos? Aparece uma segunda linha «(agregando…)» em «Altas de esta sesión»? Confira cada previsão no navegador. Para ver o atributo, use as ferramentas de desenvolvimento (aba de elementos) sobre o campo «Nombre».

### Exercício 3 — Que o segundo erro também seja anunciado

A figura 5 mostrou que um segundo envio com a mesma mensagem não muda o DOM da região `alert`. Mude `FormularioAlta` para que **cada** envio com erros produza uma mudança nessa região, sem mudar o texto que aparece. Dica: o estado `con-errores` pode levar um número que cresce a cada envio, e o React substitui um elemento quando sua `key` muda. Confira a solução adaptando a figura 5 antes de mexer no `revisor`. Restaure o ponto de controle ao terminar, ou guarde a mudança em uma cópia.

### Exercício 4 — A árvore de acessibilidade com os próprios olhos

Abra `http://localhost:5173/servicios/nuevo` no Chrome, com as ferramentas de desenvolvimento, e na aba de elementos procure o painel de acessibilidade. **Antes de olhar, preveja** o que esse painel diz de três elementos: o campo «Nombre» (é obrigatório?, é inválido?), a região de erros do formulário e a região da bandeja (quão educada é cada uma e se é lida inteira). Confira. Depois, envie o formulário vazio e olhe «Nombre» de novo. Por último, em uma cópia do ponto de controle, remova `required` de `Campo.tsx` e repita a primeira leitura. Restaure a cópia ao terminar.

## Soluções

### Solução 1

O `FormData` traz três textos, tal como estão: `nombre` é `" correo "`, `url` é `"https://correo.example"` e `timeoutMs` é `"1500"`; `textosDe` os copia sem mudá-los, e por isso `textos.timeoutMs` é uma `string`. `validarCampos` retorna `{ ok: true, valor: { nombre: "correo", url: "https://correo.example/", timeoutMs: 1500 } }`: `textoNoVacio` tirou os espaços, `urlHttp` normalizou o endereço com sua `/` final e `enteroPositivoDeTexto` converteu o texto no número `1500`. É o corpo que viaja para a API: `{"nombre":"correo","url":"https://correo.example/","timeoutMs":1500}`. Se no console o `FormData` aparecer como um objeto opaco, é normal: imprima `textos`, que é um objeto simples.

### Solução 2

O segundo envio passa na validação local (o formulário não sabe que nomes existem), então a API é chamada e responde `409` com `campos.nombre`. Fica marcado **só** «Nombre», com `aria-invalid="true"` e `aria-describedby="nombre-error nombre-ayuda"`, e sua descrição começa com «ese nombre ya existe». A região `alert` anuncia o `detalle` da API, «ya existe un servicio llamado correo». Os três campos preservam o que foi escrito, porque o estado `con-errores` leva os `textos` e `Campo` os usa como `defaultValue` (a figura 3). E não aparece uma segunda linha pendente: o redutor de `useOptimistic` ignora um nome que já está em `altas`, e `correo` já estava confirmado desde o primeiro envio. Se em vez disso o servidor de prática for reiniciado entre os dois envios, o segundo dá `201`: o servidor guarda os dados em memória e volta aos quatro de sempre.

### Solução 3

Uma forma é o estado `con-errores` levar um contador de envios e o parágrafo usar esse contador como `key`:

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

Com uma `key` diferente a cada envio, o React não reutiliza o `<p>`: remove o antigo e coloca um novo, e a região `alert` muda mesmo que o texto seja o mesmo. Ao adaptar a figura 5 (dando ao `<p>` uma `key={envio}`), o segundo envio deve contar mudanças, não `0`. Repare que o primeiro argumento de `enviar`, que o ponto de controle ignora com o nome `_previo`, é justamente o que fornece o contador: é o estado anterior entregue por `useActionState`. Ao usá-lo, tire o sublinhado do nome, porque ele já não é um argumento ignorado.

### Solução 4

O painel mostra o mesmo que as leituras de `Accessibility.getFullAXTree` de 7.4.2, porque é a mesma árvore. «Nombre» é obrigatório (por `required`) e não é inválido (por `aria-invalid="false"`); seu nome é «Nombre» e sua descrição, a ajuda. A região de erros é assertiva e lida inteira (`role="alert"`, com `aria-atomic` implícito em `true`); a da bandeja é educada e não é lida inteira (`role="status"` com `aria-atomic="false"`). Depois de enviar vazio, «Nombre» passa a inválido e sua descrição começa com «escribe un valor»: é o estado `con-errores` chegando ao campo. Sem `required`, a propriedade de obrigatório desaparece ou fica falsa, que é o que a árvore dizia antes das correções desta lição (`required=false`). Se a previsão falhou na bandeja, volte a 7.3.3: `status` traz `aria-atomic="true"` de fábrica, e o que muda isso é o atributo explícito. O painel pode nomear as propriedades de outra forma conforme a versão do Chrome; o que importa é o valor.

## Como saber se deu certo

- [ ] `npm ci`, `npm run lint` e `npm run build` terminam bem dentro de `~/curso-react/revisor/`, e `npm run build` deixa `dist/assets/index-WLyq37jn.js` se o código for idêntico ao do ponto de controle.
- [ ] Com `npm run dev`, abrir `http://localhost:5173/servicios/nuevo` mostra o link «Dar de alta» marcado como atual na navegação e o formulário com três campos; nas ferramentas de desenvolvimento, cada campo tem `aria-invalid="false"` e `aria-describedby` com sua ajuda.
- [ ] Enviar vazio marca os três campos, escreve «Revisa los campos marcados.» e, na aba de rede, **não** aparece nenhuma requisição para `/api/servicios`.
- [ ] Com o servidor de prática rodando, cadastrar `correo` com `https://correo.example` e `1500` mostra «Se dio de alta correo» na bandeja de avisos (e em nenhum outro lugar), acrescenta a linha em «Altas de esta sesión», deixa os campos vazios, e a lista de `/` já inclui `correo`.
- [ ] Repetir o cadastro de `correo` marca só «Nombre» e preserva o que foi escrito nos três campos.
- [ ] **Manualmente, com o teclado:** a partir da barra de endereços, Tab percorre em ordem os links «Reporte» e «Dar de alta», as duas caixas de preferências, os três campos e o botão (é a ordem em que aparecem no HTML de «O porquê antes do como» e no do layout, com a bandeja de avisos vazia), e cada um mostra o contorno azul; Enter em qualquer campo envia o formulário. Nada recebe o foco fora dessa ordem. E mais um teste: leve o foco ao botão com Tab e envie com Espaço. Enquanto diz «Dando de alta…», o botão aparece esmaecido, um segundo Espaço não faz nada, e o contorno azul continua nele; ao terminar, o foco continua ali (7.2.4).
- [ ] **Manualmente, com um leitor de tela** (Orca no Mint, NVDA no Windows ou VoiceOver no macOS): ao enviar vazio, o leitor anuncia «Revisa los campos marcados.» sem mover o foco; ao chegar a «Nombre», lê o rótulo, o estado inválido e a descrição com o erro primeiro; ao cadastrar, anuncia o sucesso **uma única vez**; com vários avisos na bandeja, lê só o novo. Anote no diário de bordo o que foi ouvido em cada caso.
- [ ] As figuras 1 a 5 dão na máquina local a mesma saída que na lição.
- [ ] No [diário de bordo](bitacora.md) ficou anotado o que faz cada atributo do HTML mostrado em «O porquê antes do como».

## Resumo

Responda sem olhar a lição:

1. Que diferença há entre `defaultValue` e `value` em um `<input>`? O que o React avisa ao receber `value` sem `onChange`, e quais são as três saídas?
2. Por que o cadastro do `revisor` usa campos não controlados? Em que caso faria sentido controlar um?
3. O que a função de `useActionState` recebe e em que ordem? O que acontece com o que ela retorna?
4. Por que o React esvazia os campos depois de uma action com erros, e como o `revisor` evita que o que foi escrito se perca?
5. De onde é preciso chamar `useFormStatus` para que `pending` chegue a ser `true`?
6. Quando o estado de `useOptimistic` é renderizado e quando deixa de ser? Por que uma mudança de estado que vem depois de um `await` dentro da action é envolvida em `startTransition`, e o que se viu no Chrome quando isso não era feito?
7. Por que `validarCampos` junta todos os erros, e o que `comprobarContrato` protege?
8. O que um leitor de tela anuncia graças a `aria-invalid` e a `aria-describedby`, e em que ordem lê a descrição?
9. Que diferença há entre `role="status"` e `role="alert"`? Por que a região precisa existir antes de a mensagem chegar? Por que a bandeja leva `aria-atomic="false"` e o `alert` do formulário não?
10. O que diz a primeira regra do ARIA, e o que um `<div role="button">` perde em relação a um `<button>`?

## Leituras complementares

- [React, `<form>`](https://react.dev/reference/react-dom/components/form): `action` como função, a *Transition*, o `POST` implícito e o reinício dos campos não controlados depois da action. Consultado em 21 de outubro de 2026.
- [React, `useActionState`](https://react.dev/reference/react/useActionState): a assinatura, os dois argumentos da action, o tipo do estado, o error boundary se a action lançar e por que ela não é chamada duas vezes sob `StrictMode`. Consultado em 21 de outubro de 2026.
- [React, `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus): `pending`, `data`, `method` e `action`, e por que só informa sobre o `<form>` pai. Consultado em 21 de outubro de 2026.
- [React, `useOptimistic`](https://react.dev/reference/react/useOptimistic): o estado otimista que só existe enquanto a action está em andamento e o aviso se for mudado fora de uma action. Consultado em 21 de outubro de 2026.
- [React, `<input>`](https://react.dev/reference/react-dom/components/input): campos controlados e não controlados, `defaultValue`, o aviso de `value` sem `onChange` e a mudança de não controlado para controlado. Consultado em 21 de outubro de 2026.
- [W3C, «Accessible Rich Internet Applications (WAI-ARIA) 1.2»](https://www.w3.org/TR/wai-aria-1.2/): os roles `status` e `alert` com seus valores implícitos, e os atributos `aria-invalid`, `aria-describedby` e `aria-required`. Consultado em 21 de outubro de 2026.
- [W3C, «Using ARIA»](https://www.w3.org/TR/using-aria/): a primeira e a segunda regra do uso de ARIA. Consultado em 21 de outubro de 2026.
- [W3C, «ARIA Authoring Practices Guide: Read Me First»](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): «nenhum ARIA é melhor que um ARIA ruim» e por que os roles não acrescentam teclado. Consultado em 21 de outubro de 2026.
- [W3C, «Accessible Name and Description Computation 1.2»](https://www.w3.org/TR/accname-1.2/): como a descrição é calculada a partir dos identificadores de `aria-describedby`, em ordem. Consultado em 21 de outubro de 2026.
- [W3C, «HTML Accessibility API Mappings 1.0»](https://www.w3.org/TR/html-aam-1.0/): o atributo `required` exposto como `aria-required`. Consultado em 21 de outubro de 2026.
- [W3C WAI, «Forms Tutorial: User Notifications»](https://www.w3.org/WAI/tutorials/forms/notifications/): associar um campo à sua mensagem de erro por meio de `aria-describedby`. Consultado em 21 de outubro de 2026.
- [W3C, WCAG 2.2: «Understanding SC 3.3.1: Error Identification»](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [«SC 3.3.2: Labels or Instructions»](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) e [«SC 4.1.3: Status Messages»](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): o erro descrito em texto, os rótulos e as mensagens de status sem foco. Consultado em 21 de outubro de 2026.
- [MDN, «ARIA live regions»](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions): estabelecer a região antes de atualizá-la, `polite` versus `assertive` e `aria-atomic`. Consultado em 21 de outubro de 2026.
- [MDN, `aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid), [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby), [`aria-errormessage`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-errormessage), [role `status`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role) e [role `alert`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role): quando marcar um campo como inválido, como ele se relaciona com sua descrição e quando usar cada região dinâmica. Consultado em 21 de outubro de 2026.
- [MDN, `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled) e [WHATWG, HTML, «Implicit submission»](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission): o que `aria-disabled` faz e não faz, e o Enter a partir de um campo como um clique no botão de envio. Consultado em 21 de outubro de 2026.
- [Chrome DevTools Protocol, domínio `Accessibility`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/): `Accessibility.getFullAXTree`, a árvore de acessibilidade lida antes e depois das correções. Consultado em 21 de outubro de 2026.
- [MDN, `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label), [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form), [`tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex) e [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible): o rótulo associado, `novalidate`, a ordem de tabulação e o foco visível. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| campo não controlado | um `<input>` cujo valor é guardado pelo navegador; o React só coloca o inicial com `defaultValue` |
| campo controlado | um `<input>` cujo valor o React decide a cada render com `value` e `onChange` |
| action (*Action*) | uma função que o React executa dentro de uma *Transition*; com `<form action>`, recebe o `FormData` |
| `useActionState` | hook que guarda o que a última action retornou e entrega a função para dispará-la |
| `useFormStatus` | hook que, a partir de um componente dentro de um `<form>`, diz se esse formulário tem um envio pendente |
| estado otimista | o que é mostrado enquanto uma action não termina, antes de a API confirmar |
| `startTransition` | função do React que marca uma atualização como parte de uma *Transition*; dentro de uma action, devolve a ela o que vem depois de um `await` |
| árvore de acessibilidade | a versão da página que o navegador entrega aos leitores de tela: roles, nomes, descrições e estados |
| nome acessível | o texto com que a tecnologia assistiva identifica um elemento; em um campo, seu rótulo |
| descrição acessível | o texto adicional lido depois do nome; aqui, o erro e a ajuda de `aria-describedby` |
| região dinâmica (*live region*) | uma parte da página cujas mudanças a tecnologia assistiva anuncia sem mover o foco |
| `role="status"` / `role="alert"` | região dinâmica educada, que espera / região dinâmica assertiva, que interrompe |
| `aria-disabled` | atributo que anuncia «indisponível» sem tirar o foco nem desativar nada; o comportamento é escrito por quem desenvolve |
| `aria-atomic` | se uma região dinâmica é lida inteira (`true`) ou só o que mudou (`false`) toda vez que muda |
| `:focus-visible` | pseudoclasse do CSS que se aplica quando o foco deve aparecer, tipicamente ao navegar com teclado |

---

**Próxima:** [Lição 8 — Testes de componentes](08-pruebas-de-componentes.md)
