# Lição 9 — Desempenho, publicação e quando usar um framework

*São 17h40 de uma sexta-feira e o `revisor` é publicado às 18h00 no servidor da equipe de operação. No canal do projeto há três mensagens sem resposta. A primeira: «o painel parece lento, será que a gente coloca `useMemo` em tudo antes de publicar?». A segunda, de quem preparou o servidor: «abro `/servicios/pagos` e funciona, mas se recarrego a página dá 404». A terceira, de alguém que quis que o painel perguntasse «quase nunca» no ambiente de testes: colocou `VITE_CADA_MS=2147483648`, e o registro da API se encheu de requisições, uma a cada três décimos de segundo. Ninguém mediu nada. Há vinte minutos e três opiniões diferentes sobre o que fazer. Esta lição faz o que faltou: medir primeiro, depois decidir, e publicar com um servidor que sabe o que é uma rota do cliente.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 9.2 e 9.3)

**O que se constrói:** o `revisor` medido, otimizado e publicado: o compilador do React ligado no build, um servidor de publicação próprio que serve `dist/` com reescrita para `index.html`, uma política de segurança de conteúdo (CSP) e cache correto, e cinco correções que saíram de medir o painel, cada uma com o teste que fica vermelho antes da correção e verde depois

**O que se aprende:** medir com o Profiler **antes** de memoizar; estrutura primeiro; React Compiler 1.0; `vite build` e por que o `vite preview` não é um servidor de produção; reescrita para `index.html`; `VITE_` sem segredos; revisão de XSS; Server Components e Server Functions: o que são e por que este painel não os usa; quando convém migrar para um framework

**De onde a gente vem.** Do ponto de controle da [Lição 8](08-pruebas-de-componentes.md): um `revisor` com quatro telas (a lista em `/`, o detalhe em `/servicios/:nombre`, o cadastro em `/servicios/nuevo` e a página de «não encontrada»), dados do servidor no TanStack Query, avisos e preferências em contexto, um formulário acessível e uma suíte de 27 testes em 7 arquivos que ficam vermelhos quando alguém reverte uma correção. Tudo isso funciona no `npm run dev`. O que ainda não foi feito é a pergunta do final: quão rápido ele é, e como é entregue a quem vai usá-lo?

**O que esta lição não faz.** Não acrescenta telas nem muda o que o painel faz. Não usa `useMemo`, `useCallback` nem `memo` no `revisor`: a medição não os pediu, e a seção 9.1 explica por quê. Não migra o painel para um framework nem monta Server Components: a seção 9.3 explica o que são e por que este painel não precisa deles. Não configura um servidor web de produção como o nginx ou o Caddy: escreve um pequeno em Node para que cada decisão fique à vista, e nomeia o que um servidor de verdade acrescenta. E não é um curso de segurança: revisa as duas defesas que o painel já tinha contra a injeção de código (o React e o linter) e acrescenta a terceira, a política de segurança de conteúdo.

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 e npm 11.19.1, no macOS, com as versões exatas do `package.json` desta lição. O ponto de controle foi instalado do zero com `npm ci` em uma cópia fora do repositório, idêntica arquivo por arquivo ao ponto de controle, e ali `npm run lint`, `npm test` e `npm run build` terminaram com código 0: 35 de 35 testes em 11 arquivos (lido do resumo do Vitest), `dist/assets/index-Cs1CcfeN.js` (o nome do pacote e as saídas de 9.1 e 9.2 foram medidos de novo em 22 de outubro de 2026, no macOS) e `dist/assets/index-CbqUABMA.css`. As saídas do Vitest foram tomadas com `--reporter=default`, que é o que se vê em um terminal. As cinco correções de 9.4 já estão no ponto de controle. Sua fase vermelha foi medida em uma **cópia** do ponto de controle sem as correções, chamada `rojo`, e por isso essa saída diz `~/curso-react/rojo`; a fase verde, no ponto de controle. O que se vê «no navegador» foi medido com o Chrome *headless* (`--headless`): o DOM de `/servicios/pagos` com `--dump-dom` e, para o polling e as novas tentativas, abrindo a página por alguns segundos enquanto a API de prática anotava cada requisição. Essas execuções usaram as portas 3109 (API), 4109 (prévia e servidor publicado) e 5109 (desenvolvimento) em vez de 3100, 4173, 4180 e 5173, porque na máquina rodavam outras coisas ao mesmo tempo; para apontar o *proxy* de desenvolvimento para a 3109, `vite.config.ts` foi alterado nas cópias, não no original. As saídas mostram as portas que de fato foram usadas; quem acompanha usará as do curso. As figuras estão em [`programas/09-rendimiento-publicacion/`](../programas/09-rendimiento-publicacion), ao lado de `revisor/`, com seu próprio `package.json`: são compiladas com `tsc` e executadas com `node`, como nas lições anteriores, e acrescentam `@babel/core`, `babel-plugin-react-compiler` e `@types/convert-source-map`, que são instalados em `~/curso-react/figuras/` com `npm install --save-dev --save-exact @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0 @types/convert-source-map@2.0.3` (o último porque os tipos de `@babel/core` 8.0.7 o importam e o `tsc --strict` sem `skipLibCheck` não compila sem ele). **Saídas arquivadas.** Junto às figuras, em `programas/09-rendimiento-publicacion/`, estão as saídas desta lição que podem ser repetidas com um comando, executadas de novo ao revisá-la: `build.salida.txt`, `build-sin-compilador.salida.txt`, `secretos.grep.txt` (as marcas do compilador e a busca de 9.2.4), `preview.curl.txt`, `publicado.curl.txt` e `suite.vitest.txt`. Só mudam os horários e as datas dos cabeçalhos. **Não estão arquivadas**, e foram medidas em uma única execução da lição sem cópia em `programas/`: a fase vermelha de 9.4 (precisa de uma cópia sem as correções), os registros e o despejo do DOM que foram medidos com o Chrome (9.2.3, 9.4.1 e 9.4.3), o build com chaves falsas de 9.2.4, e a saída do ESLint de «O erro que vai aparecer».

O ponto de controle também foi instalado do zero em um contêiner Linux (Debian 12, imagem oficial `node:24.22.0-bookworm`): o `npm run build` deu o mesmo nome de arquivo e o `npm test` terminou com código 0 e `Tests  35 passed (35)`. Depois da última mudança em `PaginaServicio` (conservar o detalhe antigo se uma atualização falha), repetiram-se no macOS, contra o ponto de controle novo, os dois builds de 9.1.6, as buscas em `dist/` de 9.1.6 e 9.2.4, as respostas do `curl` e o registro de 9.2.2 e 9.2.3, o despejo do DOM publicado e o build com chaves falsas. Nada foi executado em um Linux Mint real; nada do que se mostra depende do sistema. Os horários do registro dos servidores estão em UTC; os do Vitest (`Start at`), na hora local da máquina. **O que não foi medido**, e é dito onde aparece: o Profiler das ferramentas de desenvolvimento do React, que se lê com os olhos, e o painel publicado atrás de um servidor web de produção. Os caminhos longos são mostrados a partir de `~/curso-react`.

## Ao terminar, vai ser possível

- Medir com `<Profiler>` quantas vezes uma parte da árvore é renderizada e quanto tempo leva, e decidir com esse número se é preciso otimizar.
- Eliminar renderizações a mais mudando a **estrutura** (descer o estado, passar JSX como `children`) antes de pensar em memoizar (guardar o resultado de um cálculo ou de uma renderização para reutilizá-lo enquanto suas entradas não mudarem), e mostrar com a medição que funcionou.
- Ligar o React Compiler 1.0 em um projeto Vite, ler o código que ele produz e comprovar em `dist/` que atuou.
- Explicar por que o `vite preview` não é um servidor de produção, e comprovar com `curl` que o servidor de publicação reescreve as rotas do cliente para `index.html`, envia a política de segurança de conteúdo e faz o cache corretamente de cada arquivo.
- Buscar segredos em `dist/` e **interpretar** o resultado, separando uma coincidência de um vazamento.
- Explicar o que são os Server Components e as Server Functions, por que o `revisor` não os usa, e que sinais indicariam que convém migrar para um framework.
- Escrever, para um defeito encontrado ao medir, o teste que fica vermelho antes da correção e verde depois.

## O porquê antes do como

As três mensagens da cena são três perguntas diferentes, e as três têm a mesma armadilha: podem ser respondidas com uma opinião.

**«Parece lento».** O que é lento? A primeira renderização, a digitação em um campo, a troca de página, a resposta da API? No `revisor`, a API de prática leva 300 ms para responder o relatório e 1.5 s o detalhe de `pagos`, de propósito. Se é isso que «parece», nenhum `useMemo` resolve, porque o tempo não é gasto no React. E se o tempo é gasto no React, é preciso saber **em que componente** e **quantas vezes**, porque memoizar o componente errado acrescenta código e não tira nada. O React traz uma ferramenta para medir isso e a documentação pede para usá-la antes de memoizar. Esta lição a usa.

**«Se recarrego dá 404».** Na Lição 5 se viu por quê: `/servicios/pagos` não é um arquivo, é uma rota que o React Router decide no navegador. Enquanto se navega dentro da aplicação, o servidor nunca fica sabendo. Quando se recarrega, o navegador pede `/servicios/pagos` ao servidor, e um servidor de arquivos que não sabe nada de rotas do cliente responde o que é verdade para ele: esse arquivo não existe. A prévia do Vite já resolve isso, e isso confunde, porque faz pensar que «em produção vai funcionar igual». A documentação do Vite diz o contrário: a prévia não é um servidor de produção. Quem publica tem que decidir o que cada endereço responde.

**«Coloquei um número grande e o registro se encheu».** Isso não é um problema de desempenho: é um defeito. `leerCadaMs` aceita qualquer inteiro positivo, e um número que parecia «quase nunca» terminou em «o tempo todo». Ninguém viu até que alguém mediu. A seção 9.4 reúne cinco defeitos como este, encontrados ao medir o painel para esta lição, e os fecha com o hábito da Lição 8: primeiro o teste vermelho, depois a correção, depois o teste verde.

Os conceitos novos são três: medir e deixar que o compilador memoize (9.1), publicar o que o `vite build` deixa em `dist/` (9.2) e saber quando o painel precisaria de um servidor de React (9.3). A seção 9.4 é a colheita.

## Os conceitos

### 9.1 Medir antes de memoizar

#### 9.1.1 O que custa uma renderização a mais

Quando o estado de um componente muda, o React o renderiza de novo (chama a função outra vez), e com ele todos os componentes que renderiza dentro, mesmo que suas props não tenham mudado. Isso foi visto na Lição 1: renderizar é calcular uma árvore, e depois o React compara essa árvore com a anterior e só mexe no DOM onde houve diferenças. Quase sempre isso é barato. Um componente que devolve quatro `<li>` é renderizado em microssegundos, e renderizá-lo dez vezes a mais não se nota.

Nota-se quando se juntam duas coisas: um componente **caro** (uma lista de milhares de linhas, um cálculo pesado, um gráfico) e um estado que muda **com frequência** (a cada tecla, a cada movimento do mouse) e que vive **acima** dele. A documentação do `memo` diz isso com uma frase que convém memorizar: otimizar com `memo` só vale a pena quando o componente é renderizado de novo com frequência com exatamente as mesmas props e sua renderização é cara; se não há um atraso perceptível, o `memo` é desnecessário ([React, `memo`](https://react.dev/reference/react/memo)). As duas condições se medem. Nenhuma se adivinha.

#### 9.1.2 `<Profiler>`: medir com um programa

O React traz um componente para medir: `<Profiler>`. Envolve-se uma parte da árvore, dá-se um `id` e uma função `onRender`, e o React chama essa função toda vez que essa parte da árvore é confirmada (*commit*). A documentação lista o que ela recebe ([React, `<Profiler>`](https://react.dev/reference/react/Profiler)):

- `id`: o do `<Profiler>`, para saber qual foi se houver vários;
- `phase`: `"mount"` na primeira vez; `"update"` quando foi renderizado de novo por uma mudança de props, de estado ou de hooks; e `"nested-update"`, um caso que não aparece nesta lição;
- `actualDuration`: os milissegundos gastos renderizando essa subárvore nesta atualização; segundo a documentação, idealmente cai muito depois da montagem se a memoização funciona;
- `baseDuration`: uma estimativa de quanto levaria renderizar a subárvore completa sem nenhuma otimização; compará-la com `actualDuration` diz se a memoização serve;
- `startTime` e `commitTime`: marcas de tempo.

Uma advertência da mesma página: medir tem um custo, então **o Profiler está desligado no build de produção**. Mede-se em desenvolvimento, ou com um build especial do React que o liga.

A figura 1 reproduz a cena da primeira mensagem com um painel mínimo. Tem um campo para escrever uma nota e uma lista que leva 20 ms para ser renderizada; o custo é de propósito, para que se veja. A figura mede a lista com um `<Profiler>` enquanto «digita» a palavra `caído`, cinco teclas, em duas versões do painel. Na versão A, o rascunho da nota vive no painel, que é o pai da lista. Na versão B, o rascunho desce para um componente próprio, `CampoNota`, o único que o usa.

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

Leia as duas medições com calma, porque dizem mais do que parece:

- **Na versão A**, cinco teclas produziram seis renderizações da lista: a montagem e uma por tecla. Cada uma levou o que a lista leva, 20 ms ou mais. A lista nunca mudou (são sempre os mesmos quatro serviços), mas foi renderizada de novo porque seu pai mudou de estado. Se a lista levasse 200 ms, cada tecla congelaria a tela por um quinto de segundo: isso é «parece lento».
- **Na versão B**, a lista foi renderizada uma vez, ao montar. Digitar mudou o estado de `CampoNota`, e o React só renderizou de novo `CampoNota`, porque a lista não é filha dele. Não houve `memo`, nem `useMemo`, nem compilador: houve um estado colocado no lugar correto.

Repare no detalhe de `gastar`: a espera vive em uma função à parte. A primeira versão da figura a tinha dentro de `ListaLenta`, e o linter a rejeitou. Movê-la **não a torna pura**: `gastar` continua lendo o relógio durante a renderização, e o linter deixa de vê-la apenas porque não revisa dentro das funções chamadas. Aceita-se aqui porque a figura simula um custo e não renderiza nada que dependa do relógio; o comentário do código diz isso. Será visto completo em «O erro que vai aparecer».

#### 9.1.3 O Profiler das ferramentas de desenvolvimento

O `<Profiler>` serve para medir com um programa. Para olhar uma aplicação inteira existe a aba **Profiler** das ferramentas de desenvolvimento do React (React Developer Tools, a extensão do navegador). Grava o que acontece enquanto se usa a página e exibe cada *commit* como um gráfico de barras: que componentes foram renderizados, quanto levou cada um e, se for ativada a opção de registrar por que cada componente foi renderizado, a causa (mudou uma prop, mudou o estado, mudou um hook, o pai foi renderizado). A documentação do `memo` manda para lá quando uma interação ainda parece lenta: use o Profiler para ver que componentes mais se beneficiariam de ser memoizados, e memoize apenas esses ([React, `memo`](https://react.dev/reference/react/memo)).

Esta medição **não foi executada para a lição**: o Profiler da extensão se lê com os olhos, e uma execução automática não pode comprová-lo. O passo a passo para fazê-la está no exercício 1, e a maneira de saber se deu certo, em «Como saber se deu certo».

#### 9.1.4 A estrutura primeiro

A versão B da figura não é um truque: é a segunda de cinco recomendações que a documentação do `memo` dá para que a maior parte da memoização seja desnecessária ([React, `memo`](https://react.dev/reference/react/memo)). As cinco, com o que significam no `revisor`:

1. **Se um componente envolve visualmente outros, que os receba como `children`.** Quando o envoltório muda seu próprio estado, o React sabe que os filhos que chegaram como `children` não precisam ser renderizados de novo, porque foram criados por outro componente. É o `Tarjeta`, desde a Lição 1.
2. **Prefira o estado local e não o suba mais do que o necessário.** O rascunho de uma nota é do `EditorNota`, não da página; desde a Lição 2 vive ali, e por isso escrever uma nota não renderiza a lista. A figura 1 é este ponto medido.
3. **Mantenha pura a renderização.** Se renderizar de novo causa um problema visível, é um defeito do componente e se corrige, não se tapa com memoização. A Lição 1 inteira trata disso.
4. **Evite Effects que só atualizam estado.** A documentação diz que a maioria dos problemas de desempenho em aplicações React vem de cadeias de atualizações que saem de Effects e que renderizam os componentes uma e outra vez. A Lição 3 ensinou a reconhecer os Effects que sobram.
5. **Retire as dependências desnecessárias dos Effects.** Com o TanStack Query, desde a Lição 4, o painel já não tem Effects próprios para buscar dados.

Por isso o curso não colocou `useMemo` em nenhuma lição. Não foi um esquecimento: toda vez que a tentação apareceu, a estrutura já havia eliminado a renderização a mais. O critério que atravessa o curso, «primeiro se mede e depois se otimiza», não diz «nunca memoize»; diz que a memoização é uma ferramenta com custo (código mais difícil de ler, dependências que é preciso manter em dia e que podem quebrá-la) e que a medição decide quando esse custo vale a pena.

#### 9.1.5 React Compiler 1.0: a memoização que não se escreve

Há mais um caminho, e o ponto de controle o toma. O React Compiler é uma ferramenta de build que memoiza os componentes e os hooks por conta própria: lê o código, entende as regras do React e escreve o equivalente a `memo`, `useMemo` e `useCallback` onde fazem falta ([React, «Introduction to React Compiler»](https://react.dev/learn/react-compiler/introduction)). Sua primeira versão estável, a 1.0, saiu em 7 de outubro de 2025; o anúncio diz que já foi testada em aplicações grandes da Meta e que está pronta para produção ([React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1)). Para código novo, a documentação recomenda deixar a memoização para o compilador e usar `useMemo` ou `useCallback` onde for necessário um controle preciso, por exemplo um valor memoizado que é dependência de um Effect.

Em um projeto Vite, liga-se como um *preset* do Babel. A documentação de instalação dá exatamente esta forma para `@vitejs/plugin-react` 6 ou posterior ([React, «Installation»](https://react.dev/learn/react-compiler/installation)), e é a principal mudança de configuração do ponto de controle (as linhas de `css` dentro de `test` são explicadas em 9.4.4):

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

Com três dependências de desenvolvimento novas, fixadas com versão exata: `@rolldown/plugin-babel` 0.2.4 (o *plugin* que roda o Babel dentro do build do Vite), `@babel/core` 8.0.7 e `babel-plugin-react-compiler` 1.0.0. São instaladas a partir de `~/curso-react/revisor/`:

```bash
npm install --save-dev --save-exact @rolldown/plugin-babel@0.2.4 @babel/core@8.0.7 babel-plugin-react-compiler@1.0.0
```

No `package.json` mudam mais duas coisas: `"version": "0.9.0"`, como em cada lição, e o script novo de 9.2.3, `"publicado": "node servidor/publicar.ts"`. O README do `@vitejs/plugin-react` também menciona um caminho nativo, sem Babel, mas o marca como experimental, e o ponto de controle não o usa.

O que o compilador escreve? A figura 2 pergunta isso diretamente. Entrega ao Babel, com o *plugin* do compilador, o painel A da figura 1 como texto, e além disso um componente que quebra uma regra do React: muda um objeto que recebeu como prop.

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

O painel compilado se lê de cima para baixo:

- `const $ = _c(6)` pede ao React um cache de seis casas para este componente. `_c` vem de `react/compiler-runtime`, que o React 19 já traz.
- A função do `onChange` (`t0`) é criada uma única vez: a casa `$[0]` começa com um valor especial, `Symbol.for("react.memo_cache_sentinel")`, que significa «ainda vazia»; na primeira vez a função é guardada e nas seguintes é reutilizada. É um `useCallback` que não foi escrito.
- O `<input>` (`t1`) só é criado de novo se `borrador` mudou.
- `<ListaMedida />` (`t2`) é criado **uma única vez**, porque não depende de nada. Quando o React encontra na árvore nova exatamente o mesmo elemento que na anterior, não renderiza de novo esse componente. O compilador conseguiu o mesmo que a versão B da figura 1, sem mover o estado.

O segundo resultado é igualmente importante: **o componente impuro saiu intocado**. Não há `_c`, nem cache, nem aviso. A documentação explica: quando o compilador encontra código que poderia quebrar as regras do React, pula a otimização em vez de arriscar mudar o comportamento da aplicação ([React, «Debugging and Troubleshooting»](https://react.dev/learn/react-compiler/debugging)). O compilador não corrige um componente impuro; deixa-o como estava, e quem o detecta é o linter, que desde o `eslint-plugin-react-hooks` 7 traz as regras do compilador em sua configuração recomendada.

#### 9.1.6 Comprovar que o compilador atuou no `revisor`

Uma configuração que não falha não prova que algo funciona. A documentação de instalação sugere duas verificações: o selo «Memo ✨» junto aos componentes nas ferramentas de desenvolvimento, e buscar no código construído a lógica que o compilador acrescenta. A segunda pode ser executada. Este é o build do ponto de controle:

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

E este, o de uma cópia idêntica com uma única diferença: em `vite.config.ts`, `plugins: [react()]`, sem o compilador.

```text
$ npx vite build
...
dist/index.html                   0.39 kB │ gzip:   0.26 kB
dist/assets/index-CbqUABMA.css    1.27 kB │ gzip:   0.59 kB
dist/assets/index-DuGgkiHN.js   367.32 kB │ gzip: 114.56 kB
```

A mesma prova, feita antes das cinco correções de 9.4, deu sem o compilador `index-WLyq37jn.js`: o mesmo nome que os pontos de controle 7 e 8 produziam então, porque até ali o código da aplicação era idêntico ao dessas lições, byte a byte. Desde essa medição, os pontos de controle 7, 8 e 9 mudaram uma condição de `PaginaServicio` (conservar o detalhe antigo se uma atualização falha), e os 7 e 8 agora se chamam `index-C_lOH5GL.js`; a comparação com o 9 anterior às correções não foi repetida. Agora contam-se as marcas do compilador em cada um:

```text
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # con el compilador
      18
$ grep -o memo_cache_sentinel dist/assets/*.js | wc -l      # sin el compilador
       1
```

Sem o compilador há uma, que vem do React DOM: é a constante `Symbol.for("react.memo_cache_sentinel")` com a qual o React marca, por dentro, um cache ainda vazio (medido: aparece em `react-dom-client.production.js` e não no `compiler-runtime` do React, que só pede o cache). Com o compilador há 18: essa mesma mais 17 que o compilador acrescentou, uma para cada valor que guarda na primeira vez e já não volta a calcular porque não depende de nada, como `t0` e `t2` na figura 2. Não é a conta de casas: neste pacote o compilador pediu 24 caches (24 chamadas a `c(…)`, o `_c` da figura já minificado) com 255 casas no total, medido somando seus argumentos. Para saber se atuou basta que o número suba. Uma advertência de medição: `grep -c` **não** serve para isto, porque conta **linhas** com coincidências e não coincidências, e o JavaScript minificado tem quase tudo em poucas linhas. Medido sobre o mesmo arquivo, `grep -c memo_cache_sentinel` diz `2`: as 18 marcas estão em duas linhas. Um número que sai sem erro não é um número correto.

E mais uma conta, que a documentação não dá: a memoização não é grátis nem em bytes. O pacote cresceu de 367.32 kB para 374.65 kB (de 114.56 para 117.28 kB comprimido): 7.33 kB a mais de código que roda em cada renderização para decidir o que reutilizar. No `revisor`, onde nenhum componente é caro, isso é quase certamente uma perda pequena, não um ganho; o ponto de controle o liga porque o plano do curso pede ensinar o compilador e porque os 35 testes passam igual com ele, não porque uma medição o tenha pedido. **Essa é uma decisão de critério, e é dita como tal.** Em uma aplicação com listas longas ou interações finas, a conta se inverte, e o anúncio da versão 1.0 relata melhorias de até 12 % em carregamentos e navegações em aplicações da Meta ([React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1)).

### 9.2 Publicar

#### 9.2.1 O que fica em `dist/`

O `npm run build` faz duas coisas, em ordem: `tsc -b`, que revisa os tipos e não gera JavaScript (só deixa um arquivo de estado em `node_modules/.tmp/` para que a revisão seguinte seja mais rápida), e `vite build`, que empacota. O que fica em `dist/` são três arquivos: um `index.html` que aponta para um JavaScript e uma folha de estilos, e esses dois em `dist/assets/`, com um pedaço de seu conteúdo no nome (`Cs1CcfeN`, `CbqUABMA`). Esse pedaço muda toda vez que o conteúdo muda, e é o que permite um cache agressivo: o navegador pode guardar `index-Cs1CcfeN.js` um ano inteiro, porque se o código mudar, o arquivo novo terá outro nome. O que **não** pode ser guardado sem perguntar é o `index.html`, que é o que diz quais arquivos valem hoje.

`dist/` é tudo o que se publica. Não há servidor de React, nem Node, nem nada que se execute do lado do servidor: são arquivos estáticos. A documentação do Vite diz assim: pode-se implantar a pasta `dist` na plataforma que se preferir ([Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). O que essa frase não diz é o que essa plataforma tem que fazer, e aí começam os problemas.

#### 9.2.2 O `vite preview` não é um servidor de produção

O `npm run preview` sobe um servidor que serve `dist/` na porta 4173. A documentação do Vite é explícita sobre para quê: é para pré-visualizar o build na própria máquina e **não foi pensado como servidor de produção** ([Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). Na Lição 5 se viu que ele de fato devolve `index.html` quando se recarrega uma rota do cliente. Então, o que lhe falta? Mede-se. Três perguntas à prévia do ponto de controle:

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

Três achados, e nenhum é um erro do Vite, porque a prévia não promete nada disso:

1. **Não há política de segurança de conteúdo.** A resposta não traz `Content-Security-Policy`. Se um dia HTML alheio se infiltrar na página (9.2.5), o navegador não tem nenhuma regra para se recusar a executá-lo.
2. **Um arquivo que não existe responde `200` com HTML.** Pediu-se `/assets/no-existe.js` e a prévia deu `index.html`. Imagine que se publique uma versão nova enquanto alguém tem aberta a antiga, e sua página pede um JavaScript que já não existe: em vez de um `404` claro, o navegador recebe HTML onde esperava JavaScript e falha com um erro de tipo de conteúdo que ninguém entende. A reescrita é correta para as rotas do cliente e errada para os arquivos.
3. **O JavaScript com nome de conteúdo não é cacheado.** `no-cache` em `index-Cs1CcfeN.js` obriga o navegador a perguntar toda vez, embora esse arquivo nunca possa mudar.

#### 9.2.3 O servidor de publicação do `revisor`

O ponto de controle traz um servidor próprio, `servidor/publicar.ts`, de 146 linhas, que serve `dist/` e resolve justamente essas três coisas. Não é para ser usado tal qual em produção: é para que se veja cada decisão que um servidor de verdade (nginx, Caddy, o da plataforma de hospedagem) tem que tomar, escrita em uma linguagem que já se lê. É iniciado com um script novo, `"publicado": "node servidor/publicar.ts"`, na porta 4180, e repassa `/api/*` para a API de prática, como o *proxy* do Vite em desenvolvimento.

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

O que é preciso entender, decisão por decisão:

- **O caminho de `dist/` sai de `fileURLToPath`.** `import.meta.url` é um endereço `file:///…`, e a propriedade `pathname` de uma `URL` deixa os espaços e os acentos codificados (`Mis%20cursos`), que não são um caminho de disco: com a pasta em `~/Mis cursos/` o servidor falharia com `ENOENT` sem dizer por quê. `fileURLToPath` ([Node.js, `url`](https://nodejs.org/api/url.html#urlfileurltopathurl)) decodifica. Foi medido: com o servidor copiado para uma pasta chamada «con espacios y acentós», `pathname` não encontra `dist/` e `fileURLToPath` encontra.
- **Uma lista fechada de arquivos.** Ao iniciar, `listarArchivos` lê **todo** `dist/` para a memória, em um `Map` cuja chave é o caminho público (`/assets/index-Cs1CcfeN.js`). Depois, nenhuma requisição toca o disco: o servidor busca o endereço no `Map` e, se não estiver, não existe. Assim, nenhum endereço que alguém escreva (`/../../etc/passwd`, por exemplo) se converte em um caminho de arquivo. É a defesa mais simples contra o percurso de diretórios (*path traversal*), porque o ataque não tem onde se aplicar.
- **A reescrita, com uma exceção.** Qualquer endereço que não seja um arquivo responde `index.html`, para que o React Router decida; **exceto** os que começam com `/assets/`, que respondem `404`. Ali sim um arquivo faltante é um erro e se diz.
- **A política de segurança de conteúdo.** `default-src 'none'` proíbe tudo, e cada diretiva seguinte abre só o necessário: scripts, estilos, imagens e conexões a partir da mesma origem (`'self'`), formulários que só se enviam à mesma origem, nenhuma tag `<base>` e nenhum site que possa colocar o painel em um `<iframe>`. Não há `'unsafe-inline'`: um `<script>` escrito dentro do HTML não é executado. O build do Vite não coloca nenhum script inline em `index.html`, e por isso esta política não quebra o painel.
- **`nosniff`.** Diz ao navegador que acredite no `content-type` que o servidor declara e não tente adivinhá-lo pelo conteúdo.
- **Cache por tipo de arquivo.** `/assets/*` leva `public, max-age=31536000, immutable`: um ano, e a promessa de que não vai mudar. `index.html` leva `no-cache`: o navegador pode guardá-lo, mas tem que perguntar antes de usá-lo. Este servidor não envia `ETag` nem `Last-Modified`, então essa «pergunta» termina sempre em um download completo: são 392 bytes e não importa; um servidor de produção acrescenta o validador e responde `304` quando o arquivo não mudou.

Com a API de prática e o servidor de publicação ligados, seis perguntas:

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

A primeira é a recarga da cena, resolvida: `200` com `index.html`, a política e `no-cache`. A segunda é o arquivo faltante: `404`, já não HTML disfarçado. A terceira, o cache longo. A quarta merece uma leitura cuidadosa: `--path-as-is` pede ao `curl` que **não** limpe os `..` e os envie tal qual, como faria alguém que tenta sair da pasta. O servidor respondeu `200` com `index.html`, não com o arquivo do sistema. O registro do servidor diz por quê:

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

`new URL()` normalizou `/../../etc/passwd` para `/etc/passwd`, que não está no `Map`, então é «uma rota do cliente» e responde `index.html`. Duas defesas sobrepostas: a normalização da URL e a lista fechada. E a quinta pergunta, o `POST` do cadastro, chegou à API através do repasse com seu `201`. A sexta, `/favicon.ico`, será necessária no exercício 3; não a leia ainda.

As últimas cinco linhas do registro são o Chrome *headless* abrindo `/servicios/pagos` no servidor publicado: pede a página, a folha de estilos, o JavaScript e o ícone da aba, e já com o React rodando, o detalhe à API. Este é o `#raiz` que ele renderizou, com o cabeçalho, a bandeja vazia e o detalhe de `pagos`:

```text
<div id="raiz"><header><h1>Revisor</h1><nav aria-label="Principal"><a class="" href="/" data-discover="true">Reporte</a><a class="" href="/servicios/nuevo" data-discover="true">Dar de alta</a></nav><fieldset class="preferencias"><legend>Preferencias</legend><label><input type="checkbox" checked=""> Mostrar duración</label><label><input type="checkbox"> Vista compacta</label></fieldset></header><section class="bandeja" aria-label="Avisos"><div role="status" aria-atomic="false"></div></section><main><section class="tarjeta" aria-label="Servicio pagos"><h2>Servicio pagos</h2><dl><dt>Estado</dt><dd>En falla: HTTP 503</dd><dt>Revisiones</dt><dd>0</dd><dt>Última revisión</dt><dd>2026-10-22T19:29:17.619Z</dd></dl><button type="button">Volver a revisar</button><div class="editor-nota"><label>Nota sobre pagos<textarea rows="3"></textarea></label><button type="button">Guardar nota</button></div><p><a href="/" data-discover="true">Volver al reporte</a></p></section></main></div>
```

O título da aba, no `<head>` do mesmo despejo, era `pagos · Revisor`: o Effect de `useTituloDocumento` da Lição 3, funcionando na versão publicada, com a política de segurança ligada.

O que este servidor **não** faz, e um servidor de produção sim: HTTPS, compressão (gzip ou brotli), registros com rotação, limites de tamanho e de tempo para as requisições, e reiniciar-se sozinho se cair. Para isso se coloca o nginx, o Caddy ou a plataforma escolhida na frente, ou no lugar, com as mesmas regras: reescrita exceto `/assets/`, a mesma política e o mesmo cache. As regras são o que esta seção ensina; o programa que as aplica pode ser trocado.

#### 9.2.4 `VITE_` sem segredos, agora no que foi publicado

A Lição 0 demonstrou isso em desenvolvimento: o que começa com `VITE_` fica escrito no JavaScript que qualquer um baixa, e o que não começa assim não chega ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). Na publicação se fecha o círculo com um hábito: **antes de publicar, busca-se em `dist/`**. Sobre o ponto de controle:

```text
$ grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js dist/index.html | sort | uniq -c
   1 dist/assets/index-Cs1CcfeN.js:clave
   3 dist/assets/index-Cs1CcfeN.js:password
$ grep -ioE ".{60}password.{60}" dist/assets/*.js
datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0
.type===`search`||e.type===`tel`||e.type===`url`||e.type===`password`)||t===`textarea`||e.contentEditable===`true`)}var Qr=An&&`
===`http:`||t.protocol===`https:`)return t.username!==``||t.password!==``?{ok:!1,detalle:`quita el usuario y la clave de la dire
```

Quatro coincidências, em duas linhas do arquivo (`grep -c` diria `2`), e nenhuma é um vazamento. Duas são código do React DOM que enumera os tipos de `<input>` (`email`, `number`, `password`, `url`…) para saber como tratar cada um. As outras duas são do próprio `revisor`: o schema do cadastro da Lição 7 lê `url.password` para rejeitar um endereço com usuário ou senha, e sua mensagem diz «quita el usuario y la clave de la dirección». A lição importante não é o número: **um resultado de busca se interpreta, não se conta**. Zero coincidências tampouco teria provado nada, porque uma chave real quase nunca se chama `clave`.

Por isso a busca que de fato serve é a dos **valores**. Para vê-lo, uma cópia do ponto de controle lê duas variáveis que não deveria (uma com prefixo e outra sem ele), as declara em `vite-env.d.ts` e imprime as duas a partir de `main.tsx` para que o build não as descarte:

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

E faz-se o build com valores falsos:

```text
$ VITE_CLAVE_MONITOREO=mon_prueba_7f3a91 CLAVE_MONITOREO=mon_secreta_c0ffee npm run build
...
dist/assets/index-DfHw2mrm.js   374.71 kB │ gzip: 117.32 kB
$ grep -o '.\{30\}mon_prueba_7f3a91.\{10\}' dist/assets/*.js
s?t:ds}var hs=ms(`10000`),gs=`mon_prueba_7f3a91`;async fu
$ grep -c mon_secreta_c0ffee dist/assets/*.js
0
```

A de `VITE_` ficou escrita junto a `ms(`10000`)`, que é `leerCadaMs` com o valor do `.env`. A outra não. Se a equipe guarda os valores reais de suas chaves em um gerenciador de segredos, a busca que vale é essa: pegar cada valor e buscá-lo em `dist/`. Se aparecer, a chave deixou de ser secreta e é preciso trocá-la, não apenas retirá-la do pacote.

#### 9.2.5 Revisão de XSS: três camadas

O curso de TypeScript ensinou o ataque: se uma página insere como HTML um texto que veio de fora, esse texto pode trazer um `<script>` ou um `onerror` que é executado com as permissões de quem abriu a página. Isso se chama *cross-site scripting* (XSS). No `revisor`, «de fora» é a API: os nomes de serviço são escritos por quem faz o cadastro, e chegam à tela de todos. A figura 3 dá ao React um nome de serviço com um ataque, e um endereço `javascript:` em um link:

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

Repare que não saiu nenhum `[aviso de React]` nesta execução: o React 19.3.1 substituiu o endereço sem imprimir nada em `console.error`. O gancho de cima fica para que se veja por conta própria.

**Primeira camada: o React escapa o texto.** Nos casos 1 e 2, o `<img onerror>` chegou como texto: `&lt;img …&gt;`. O navegador o pinta como letras e não cria nenhuma imagem. Isso acontece sempre que o dado vai como filho de JSX ou como valor de um atributo de texto (`title`, `aria-label`, `value`), que é como o `revisor` pinta tudo. Os atributos que o navegador trata como endereço ou como documento (`href`, `src`, `formAction`, `srcDoc` de um `<iframe>`) são outra história: escapar não os protege, porque um endereço perigoso não leva nenhum caractere para escapar. O React 19 bloqueia `javascript:`, como mostra o caso 3, mas o resto não revisa. Um endereço que vem de fora é validado antes de usá-lo, por exemplo exigindo que comece com `https://`, como faz o schema do cadastro da Lição 7 com `urlHttp`. A porta que o React oferece para inserir HTML é `dangerouslySetInnerHTML` (por fora do React, com um `ref`, ficam também `innerHTML`, `outerHTML` e `insertAdjacentHTML`; a regra do linter da Lição 0 cobre as duas primeiras, e as outras duas são revisadas a olho), e a documentação do React diz isso sem rodeios: se o HTML não é de confiança, por exemplo se se baseia em dados de usuários, corre-se o risco de uma vulnerabilidade de XSS ([React, componentes comuns](https://react.dev/reference/react-dom/components/common)). No caso 3, o React 19 substituiu o endereço `javascript:` por um que lança um erro: «React has blocked a javascript: URL as a security precaution». O React 16.9 havia anunciado que o faria em uma versão maior futura ([React, «React v16.9.0»](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html)); a figura mostra que a 19.3.1 já o faz.

**Segunda camada: o linter.** O `eslint.config.js` do `revisor` traz desde a Lição 0 uma regra `no-restricted-syntax` que rejeita `dangerouslySetInnerHTML` e as atribuições a `innerHTML`. Se alguém abrir essa porta, o `npm run lint` fica vermelho e a verificação do curso não passa.

**Terceira camada: a política de segurança de conteúdo.** Se as duas primeiras falhassem (uma biblioteca que insere HTML por conta própria, um descuido), a política do servidor de publicação ainda proíbe executar scripts que não venham de um arquivo da mesma origem. Um `onerror` escrito no HTML é código inline, e sem `'unsafe-inline'` o navegador não o executa. É a única das três camadas que **não** vive no código: vive no servidor. Por isso importa quem publica e como.

### 9.3 Server Components, Server Functions e quando um framework

#### 9.3.1 O que são

Tudo o que o `revisor` renderiza, quem renderiza é o navegador. O React 19 tem outra possibilidade. Os **Server Components** são componentes que são renderizados antes, em um ambiente separado da aplicação do navegador: podem rodar uma vez ao fazer o build, no servidor de integração contínua, ou a cada requisição, em um servidor web ([React, «Server Components»](https://react.dev/reference/rsc/server-components)). Como rodam no servidor, podem ler um banco de dados ou um arquivo diretamente, sem uma API no meio, e o que chega ao navegador é o resultado já renderizado, não o código que o produziu. As **Server Functions** são o caminho de volta: funções assíncronas que são executadas no servidor e que um componente do navegador pode chamar. São marcadas com a diretiva `"use server"`; o framework cria uma referência que viaja ao navegador, e ao chamá-la, o React manda uma requisição ao servidor para executá-la e devolve o resultado ([React, «Server Functions»](https://react.dev/reference/rsc/server-functions)). Até setembro de 2024 se chamavam «Server Actions»; hoje esse nome fica para as que são passadas a um `action` ou chamadas a partir de uma action, como o `<form action>` da Lição 7.

Dois esclarecimentos da documentação que evitam confusões comuns. O primeiro: **não há diretiva para os Server Components**; `"use server"` é para Server Functions, não para marcar um componente. O segundo, que decide muito: embora os Server Components do React 19 sejam estáveis entre versões menores, as peças internas que os empacotadores e os frameworks usam para implementá-los **não seguem versionamento semântico** e podem quebrar entre versões menores do React 19.x. Por isso a documentação recomenda a quem constrói essa integração fixar uma versão exata do React ou usar a versão *Canary*. O que vem a seguir já é critério deste curso, não da documentação: os Server Components são usados por meio de um framework que mantém essa integração por nós. O Vite tem um *plugin* oficial para eles, `@vitejs/plugin-rsc` (versão 0.5.38 em 21 de outubro de 2026, ainda antes da 1.0), que se descreve como agnóstico de framework e entrega as peças de baixo nível para construir um por cima; é uma base para quem faz frameworks, não uma peça para uma aplicação como o `revisor`.

E uma advertência de segurança que vale para qualquer design com servidor: os argumentos de uma Server Function **são controlados por completo pelo cliente**. A documentação pede para tratá-los sempre como entrada não confiável, validá-los, e verificar em cada Server Function que quem a chama tem permissão para o que pede ([React, `"use server"`](https://react.dev/reference/rsc/use-server)). Uma Server Function é, na prática, uma rota pública do servidor com outro nome. O antecedente mais forte é recente: em 3 de dezembro de 2025, a equipe do React publicou uma vulnerabilidade crítica nos Server Components, a CVE-2025-55182, com nota CVSS de 10.0 (CVSS é a escala padrão de gravidade; 10.0 é o máximo), que permitia executar código no servidor sem autenticação aproveitando um defeito em como o React decodificava as requisições às Server Functions. Segundo o aviso, uma aplicação podia ser vulnerável mesmo sem definir nenhuma Server Function, apenas admitindo Server Components; e uma aplicação cujo código React não usa um servidor não era afetada ([React, «Critical Security Vulnerability in React Server Components»](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)). O `revisor` é das segundas. É a outra face de «peças internas que não seguem versionamento semântico»: quem as usa tem que atualizá-las assim que sai o patch. Entre os pacotes que o aviso lista como afetados está o `@vitejs/plugin-rsc`, o mesmo *plugin* de cima.

#### 9.3.2 Por que este painel não os usa

O `revisor` não usa Server Components por três razões, e convém dizê-las com precisão, porque «não precisa deles» sem razões é apenas uma opinião:

1. **Seus dados já têm um servidor, e é outro.** O relatório e o detalhe vêm de uma API que não é do painel: no curso é o servidor de prática; na vida real seria o revisor do curso de Go ou o de TypeScript. Um Server Component brilha quando o componente pode ler os dados de perto. Aqui teria que pedi-los a essa mesma API por HTTP, que é o que o navegador já faz, só que a partir de outra máquina.
2. **Seus dados mudam sozinhos, a cada dez segundos.** O relatório é consultado por polling com `refetchInterval` (Lição 4) e é invalidado ao tentar de novo (Lição 4) ou ao cadastrar (Lição 7). Isso é estado do servidor **no navegador**, e o TanStack Query o resolve com cache, novas tentativas e atualização em segundo plano. Uma renderização do lado do servidor serve para o primeiro carregamento, não para os dez segundos seguintes.
3. **Não precisa aparecer em buscadores nem carregar sem JavaScript.** É uma ferramenta interna, atrás de um acesso. Os dois ganhos mais citados de renderizar no servidor (que o conteúdo esteja no primeiro HTML para os buscadores, e que algo se veja antes de o JavaScript chegar) não lhe rendem nada.

Há uma quarta razão, que é deste curso e não do painel: Server Components exigem um framework, e aprender um framework enquanto se aprende React esconde o que cada um faz. Por isso o curso ensinou primeiro o React que roda no navegador.

#### 9.3.3 Quando convém migrar para um framework

A documentação do React é clara em sua recomendação: para uma aplicação nova, **começar com um framework** (menciona o App Router do Next.js, o React Router em seu modo framework e o Expo para aplicações nativas, entre outros), porque trazem resolvidos o roteamento, o carregamento de dados e a renderização no servidor; começar do zero, com uma ferramenta como o Vite, dá mais flexibilidade em troca de tomar essas decisões por conta própria ([React, «Creating a React App»](https://react.dev/learn/creating-a-react-app)). A mesma página reconhece as razões para começar do zero: restrições que os frameworks não resolvem bem, querer construir a própria estrutura, ou querer aprender o básico de uma aplicação React. Este curso é a terceira. E há um detalhe que convém saber: esses frameworks também produzem aplicações de página única sem servidor, que podem ser publicadas como arquivos estáticos, e permitem acrescentar funções de servidor rota por rota quando forem necessárias.

O critério para migrar o `revisor`, ou qualquer aplicação parecida, é próprio deste curso, não da documentação, e se escreve em forma de sinais que podem ser verificados:

| Sinal | Como se vê no `revisor` | Migrar? |
|---|---|---|
| Há páginas públicas que devem aparecer em buscadores | Não: é uma ferramenta interna | Não |
| O primeiro carregamento é lento e a medição demonstra (JavaScript grande, cascatas de requisições ao abrir) | 117 kB comprimidos e uma requisição ao abrir; não medido como problema | Não |
| Os dados estão em um banco de dados próprio e a API existe só para a tela | Não: a API é de outro programa e tem outros clientes | Não |
| Há dados ou chaves que não podem chegar ao navegador e hoje obrigam a escrever uma API só para isso | Não: não há segredos na tela (9.2.4) | Não |
| A equipe reinventa com esforço o roteamento, o carregamento de dados por rota e o tratamento de erros | Não: o React Router e o TanStack Query resolvem | Não |

Se um dia duas ou três linhas passarem de «Não» a «Sim», a migração começa a compensar seu custo, que é real: um servidor Node que é preciso operar, um modelo mental novo (o que roda onde), e peças que dependem de versões do framework. Até então, o `revisor` é o que a documentação chama de uma aplicação de página única, e está bem que seja.

### 9.4 O que encontramos ao medir

Escrever esta lição obrigou a medir o painel de ponta a ponta, e a medição encontrou cinco defeitos que nenhuma lição anterior havia visto. Nenhum quebra um teste da Lição 8, porque nenhum teste os procurava. Todos se fecham do mesmo modo, com o hábito dessa lição: primeiro se escreve o teste que descreve o comportamento correto e se vê **vermelho** contra o código de hoje; depois se corrige, e o mesmo teste se vê **verde**. Os oito testes novos vivem em quatro arquivos e cobrem os cinco defeitos (os dois de CSS compartilham arquivo).

As cinco correções e seus quatro arquivos de teste fazem parte do ponto de controle desta lição. Para ver a fase vermelha, os quatro arquivos de teste foram executados em uma cópia do ponto de controle **sem** as correções, ou seja, contra o código como a Lição 8 o deixou:

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

Cinco vermelhos, um por defeito, e três verdes que já protegiam o que de fato funcionava. Cada seção seguinte mostra seu teste, a mensagem de sua falha e a correção, tal como ficaram no ponto de controle.

#### 9.4.1 `VITE_CADA_MS` sem limite

**O que foi medido.** É a terceira mensagem da cena. Com o ponto de controle no `npm run dev`, `VITE_CADA_MS=2147483648` e o Chrome *headless* aberto em `/` durante cinco segundos, o registro da API de prática:

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

(A primeira linha é o par do `StrictMode` de sempre.) Dez requisições em menos de três segundos, uma a cada ~305 ms, que é exatamente o que a API leva para responder: o painel pergunta assim que lhe respondem. Quem escreveu esse número queria uns 25 dias entre perguntas. Por quê? O polling do TanStack Query usa `setInterval`, e a MDN explica o limite: o atraso é convertido em um inteiro com sinal de 32 bits, então o máximo é 2,147,483,647 ms (uns 24.8 dias); um valor maior **estoura** e pode dar um número negativo, que o navegador trata como «sem espera» ([MDN, `setTimeout`, «Maximum delay value»](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value)). 2,147,483,648 é exatamente um a mais que o máximo: ao estourar vira −2,147,483,648, um atraso negativo. E o estouro nem sempre é tão escandaloso: com `VITE_CADA_MS=99999999999`, no mesmo teste de cinco segundos houve uma única requisição, porque esse número, ao estourar, dá uns 14 dias. Um defeito que às vezes se vê e às vezes não é o pior tipo.

O outro extremo também existe: `VITE_CADA_MS=1` passa pelo filtro de `leerCadaMs` (é um inteiro positivo) e pede ao navegador um polling sem pausa. A mesma execução de cinco segundos:

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

O mesmo resultado prático: uma pergunta assim que a resposta chega. (A última linha é a requisição em curso quando o Chrome foi fechado.)

**O teste.** Um arquivo novo junto a `configuracion.ts`:

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

A fase vermelha: `expected 999 to be 10000`. Hoje `leerCadaMs("999")` devolve 999; o teste diz que um intervalo menor que um segundo não é aceito.

**A correção.** Dois limites, com sua razão escrita ao lado. Fora deles, usa-se o valor de sempre, igual a um texto que não é número: a configuração inválida não quebra o painel, é ignorada.

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

O mínimo de um segundo e o máximo de uma hora são um critério próprio do curso, não uma norma: um segundo é mais de três vezes o que a API leva para responder, e mais de uma hora deixa de ser um polling. O que **não** é critério é que o máximo fique abaixo de 2,147,483,647: isso quem exige é o `setInterval`. A mesma medição com a correção, o mesmo número e os mesmos cinco segundos:

```text
10:10:59.307 GET /api/estados cancelada por el cliente
10:10:59.610 GET /api/estados 200
```

Uma requisição: o valor foi ignorado e o painel voltou a seus dez segundos.

#### 9.4.2 O singular de «servicios»

**O que foi medido.** Com um único serviço no relatório, o resumo diz «1 servicios revisados». A Lição 1 cuidou do singular das falhas com `textoFallas` («1 servicio con falla»), mas o total ficou escrito à mão no componente, `{estados.length} servicios revisados`, e ninguém o testou com um. O teste da Lição 8 que protege o `0` solto usa dois serviços, então tampouco o via.

**O teste.** Monta só o `ResumenFallas` com um serviço em falha, porque o defeito é desse componente e não é preciso a aplicação inteira:

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

A fase vermelha o diz letra por letra:

```text
Expected: "1 servicio revisado · 1 servicio con falla"
Received: "1 servicios revisados · 1 servicio con falla"
```

**A correção.** O texto sai para uma função pura, ao lado de `textoFallas`, e o componente a usa:

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

O teste existente «sin fallas no pinta un 0 suelto en el resumen» continua verde, porque com dois serviços o texto é o mesmo de antes.

#### 9.4.3 A nova tentativa diante de um 404

**O que foi medido.** Abrir `/servicios/nada`, um serviço que não existe, com o Chrome *headless* e a API de prática:

```text
10:11:05.994 GET /api/servicios/nada cancelada por el cliente
10:11:06.195 GET /api/servicios/nada 404
10:11:07.401 GET /api/servicios/nada 404
10:11:09.607 GET /api/servicios/nada 404
```

Três requisições, com 1.2 e 2.2 segundos entre elas, e a pessoa vendo «Cargando detalle…» por mais de três segundos antes de saber que o serviço não existe. É o `retry: 2` da Lição 4, que se aplica a **todo** erro, mais a espera que o TanStack Query coloca entre tentativas: começa em um segundo e dobra a cada vez, até um teto de 30 segundos ([TanStack Query, «Query Retries»](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)). Tentar de novo faz sentido diante de um `503` (o serviço pode voltar em um segundo) ou de uma rede fora do ar. Diante de um `404`, a resposta é a resposta: o serviço não vai aparecer por insistência. Uma precisão antes de generalizar: no `revisor` a API só responde `400`, `404` e `409`, e nenhum muda por insistência, então a regra do ponto de controle é «não tentar de novo nenhum 4xx». Em uma API real há dois 4xx que sim são passageiros, o `408` (esgotou-se o tempo da requisição) e o `429` (requisições demais, que costuma trazer `Retry-After`), e uma regra de nova tentativa de verdade os separa.

Por que a Lição 8 não viu isso? Porque o `montarEn` cria seu próprio `QueryClient` com `retry: false`, de propósito, para que um erro apareça imediatamente nos testes. Isso é correto para testar as telas, e deixa sem testar a configuração real. O teste novo usa o cliente de verdade, `crearClienteConsultas()`:

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

A fase vermelha: `expected "vi.fn()" to be called 1 times, but got 3 times`. O segundo teste, o do `503`, está verde desde antes, e é o que impede a correção preguiçosa: `retry: false` poria verde o primeiro e vermelho o segundo. Os dois juntos descrevem a regra completa. (Leva três segundos de verdade, pelas esperas entre tentativas; por isso leva `timeout: 10_000`.)

**A correção.** O erro leva o código HTTP como causa (`cause`, uma propriedade padrão de `Error`), e o cliente decide com uma função em vez de um número:

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

A mesma medição no navegador, com a correção:

```text
10:11:13.704 GET /api/servicios/nada cancelada por el cliente
10:11:13.905 GET /api/servicios/nada 404
```

Uma requisição, e o aviso «No se pudo cargar el detalle: la API respondió 404» aparece assim que a resposta chega.

#### 9.4.4 CSS sem uso

**O que foi medido.** O `panel.css` tem duas regras que nenhum componente usa desde a Lição 5: `.seleccionar` (o botão com `aria-pressed` da Lição 2, que a 5 trocou por um link) e `.detalle` (o painel de detalhe da Lição 3, que a 5 trocou por uma página). São 19 linhas que viajam a cada navegador e que confundem quem lê a folha, porque parecem vivas.

**O teste, e a armadilha encontrada ao escrevê-lo.** O teste lê a folha de estilos e o texto dos componentes, extrai as classes da folha e verifica que cada uma apareça em algum `className`. Para ler arquivos como texto sem Node, usa duas funções do Vite que o Vitest entende: `import hoja from "./panel.css?raw"` e `import.meta.glob(…, { query: "?raw" })`.

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

A primeira versão deste teste **passou em verde contra o código com o defeito**. Não é que o defeito não existisse: é que a folha chegava vazia. O Vitest, por padrão, não processa os arquivos `.css`; sua documentação diz que os arquivos excluídos são substituídos por um texto vazio, e que `css.include` (vazio por padrão) é a lista dos que de fato são processados ([Vitest, `css`](https://vitest.dev/config/css)). O resto foi medido, a documentação não diz: um arquivo que não está nessa lista também chegou vazio, mesmo com `?raw`: `hoja.length` era `0`. Uma folha vazia não tem classes sem uso, e o teste concluía, sem erro, que estava tudo bem. É a classe de verde mais perigosa, a que não mediu nada.

Por isso o teste tem duas mudanças. A primeira é em `vite.config.ts`, dentro de `test`:

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

A segunda é o **controle positivo** dentro do próprio teste: antes de buscar classes sem uso, verifica que encontrou pelo menos uma que de fato se usa, `tarjeta`, na folha e nos componentes. Sem `css.include`, o teste agora falha onde deve, em vez de passar:

```text
 FAIL  src/reporte/panel.test.ts > la hoja de estilos > cada clase de la hoja la usa algún componente
AssertionError: expected [] to include 'tarjeta'
```

Com a folha lida de verdade, a fase vermelha é a que interessa:

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

Repare em `DINAMICAS`. Há classes que nenhum `className` escreve com todas as letras: `disponible` e `falla` saem de `estado.tipo`, e `active` quem coloca é o `NavLink` no link da página atual. Um teste assim não pode adivinhá-las; é preciso declará-las, e a lista faz parte do código que se revisa. É o mesmo problema que têm as ferramentas que apagam CSS sem uso automaticamente, e por isso costumam aceitar uma lista de exceções (no PurgeCSS se chama *safelist*). A correção, neste caso, é apagar essas 19 linhas.

#### 9.4.5 O CSS de `.actualizado`

**O que foi medido.** É o defeito às avessas: `PaginaReporte` renderiza `<p className="actualizado">` desde a Lição 3, e o `panel.css` nunca teve uma regra para essa classe. A linha «Actualizado a las … · actualizando…» aparece com o mesmo tamanho e a mesma cor dos dados, competindo com o que importa. Uma classe que o componente coloca e a folha ignora é uma promessa não cumprida.

**O teste.** Já foi visto em `panel.test.ts`: busca a regra `.actualizado`, pega sua `color` e calcula o contraste contra o fundo branco com a fórmula da WCAG 2.2. Exige duas coisas: que seja pelo menos 4.5 para 1, o mínimo para texto normal segundo o critério 1.4.3 ([W3C, «Understanding SC 1.4.3: Contrast (Minimum)»](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)), e que seja menor que 21 para 1, que é preto puro. Esse limite superior só descarta o preto exato (um `#111111` dá 18.88 para 1 e passaria): que a linha se veja **secundária** quem decide é o olho, e o teste apenas garante que a regra exista, que declare uma cor e que se leia. A fase vermelha: `falta el color de .actualizado: expected undefined to be defined`.

**A correção.** Uma regra, no lugar onde estavam as duas que foram apagadas, com o mesmo cinza que as ajudas do formulário da Lição 7 já usavam:

```css
/* fragmento: revisor/src/reporte/panel.css, solo la regla nueva */
.actualizado {
  color: #57606a;
  font-size: 0.875rem;
}
```

O contraste de `#57606a` sobre branco, calculado com a mesma fórmula: 6.39 para 1. Para comparar, um cinza que «parece bom» à primeira vista, `#999999`, dá 2.85 para 1 e o teste o rejeitaria.

#### 9.4.6 A fase verde e a suíte completa

Os mesmos quatro arquivos de teste, no ponto de controle, com as cinco correções:

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

E a suíte completa, para comprovar que nenhuma correção quebrou o que já estava protegido:

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

35 de 35 em 11 arquivos: as 27 da Lição 8 mais as 8 novas. O bloco `Environment` de três linhas no final é uma sugestão do Vitest sobre sua própria velocidade (criar o jsdom uma vez por processo em vez de onze), não um aviso dos testes; pode ou não aparecer. No ponto de controle, o `npm run lint` terminou sem avisos e o `npm run build` deixou `index-Cs1CcfeN.js` (374.65 kB) e `index-CbqUABMA.css`, de 1.27 kB: uns 230 bytes a menos que a folha de antes das correções (1.50 kB; o Vite arredonda para centésimos, e para o número exato, `wc -c` sobre os dois arquivos). O compilador continuou atuando: 18 marcas.

## O erro que vai aparecer

**O erro principal: ler o relógio durante a renderização.** A primeira versão da figura 1 tinha a espera dentro do componente, assim:

```tsx
// fragmento: la primera versión de ListaLenta, la que el linter rechazó
function ListaLenta() {
  const hasta = performance.now() + 20;
  while (performance.now() < hasta) {
    // espera activa
  }
  // …
```

E o `npx eslint` respondeu:

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

É a regra `react-hooks/purity`, uma das que o `eslint-plugin-react-hooks` 7 traz do compilador. Diz algo que já se sabe desde a Lição 1: um componente tem que dar o mesmo resultado com as mesmas entradas, e `performance.now()` dá um número diferente a cada vez. Se o compilador memoizasse um componente que lê o relógio, na segunda vez reutilizaria a hora da primeira. Por isso as duas ferramentas compartilham regras: o linter avisa do que faria o compilador se enganar (ou pular o componente, como na figura 2). A correção da figura tira a espera para uma função à parte. Atenção: isso não a torna pura, apenas a esconde do linter, que não revisa dentro das funções chamadas. Aceita-se aqui **unicamente** porque simula um custo e não produz nada que seja renderizado, e o comentário de `gastar` avisa; fazer o mesmo com uma impureza de verdade seria calar o linter por outro caminho. Em um componente de verdade, uma hora que se mostra é guardada no estado ou chega como prop.

**O silencioso: o arquivo que não existe e responde HTML.** Na prévia, `/assets/no-existe.js` respondeu `200 text/html` (9.2.2). No navegador isso se vê como uma página em branco e, no console, um erro que diz que se esperava um módulo de JavaScript e o servidor respondeu com o tipo MIME `text/html`. Não diz que arquivo faltava nem por quê. Se isso aparecer depois de publicar, a pergunta é: o servidor também reescreve os endereços de `/assets/`? A correção é a de `publicar.ts`: a reescrita é para as rotas do cliente, nunca para os arquivos.

**O outro silencioso: o teste verde que não leu nada.** Foi visto em 9.4.4. Se um teste lê um arquivo e conclui «não há problemas», convém perguntar o que teria dito com o arquivo vazio. Se a resposta é «o mesmo», falta-lhe um controle positivo.

## O que se faz errado

**`useMemo` e `memo` em tudo, «por via das dúvidas».** A figura 1 mostrou que a causa das renderizações a mais era um estado no lugar errado. Memoizar teria escondido o sintoma e deixado a causa, com mais código para manter.

**Otimizar sem medir.** Se não se sabe quantas vezes um componente é renderizado nem quanto leva, não se sabe se o que foi mudado serviu. O `<Profiler>` ou a aba Profiler respondem as duas perguntas em minutos.

**Medir no build de produção com `<Profiler>`.** Está desligado ali, de propósito. As medições de renderização se fazem em desenvolvimento, e as da experiência completa (carregamento, rede) na versão publicada, com as ferramentas do navegador.

**Ligar o compilador e não comprovar que atuou.** Uma configuração que não dá erro não prova nada. Busque suas marcas em `dist/`, e conte-as com `grep -o … | wc -l`, não com `grep -c`.

**Calar o linter para que o compilador «funcione».** Se uma regra do compilador reclama, o componente quebra uma regra do React. Corrige-se o componente. Silenciá-la deixa um componente que o compilador pula, ou pior, que otimiza mal.

**Publicar com o `vite preview`.** Não foi feito para isso: sem política de segurança, sem cache para os arquivos com nome de conteúdo, e respondendo HTML onde falta um arquivo.

**Reescrever tudo para `index.html`, inclusive os arquivos.** Converte um `404` claro em um erro de tipo de conteúdo que ninguém entende.

**Servir arquivos montando o caminho de disco com o que o cliente pede.** Abre a porta ao percurso de diretórios. A lista fechada de `publicar.ts` não tem essa porta.

**Contar coincidências ao buscar segredos.** O `password` do React DOM é uma coincidência que não é vazamento; uma chave real quase nunca se chama `clave`. Lê-se cada resultado, e buscam-se os **valores**.

**Um teste que lê um arquivo sem controle positivo.** Se o arquivo chega vazio, passa. Acrescente uma verificação de que encontrou algo que se sabe que está.

**`retry: false` para «corrigir» uma nova tentativa a mais.** Deixa de tentar de novo o que convinha tentar. Por isso o teste do `503` acompanha o do `404`.

**Migrar para um framework porque é o que a documentação recomenda para projetos novos.** O `revisor` não é um projeto novo, e a tabela de 9.3.3 não tem um único «Sim». Uma migração se justifica com sinais, não com uma tendência.

## Exercícios

### Exercício 1 — O Profiler com os próprios olhos

Instale a extensão React Developer Tools no navegador. Com a API de prática e o `npm run dev` ligados, abra `http://localhost:5173/`, abra a aba **Profiler**, e em sua configuração ative a opção de registrar por que cada componente foi renderizado. **Antes de gravar, preveja:** se se escrever `pag` em «Buscar por nombre», que componentes vão ser renderizados a cada letra? `EditorNota` é renderizado? `BandejaAvisos` é renderizado? Grave, escreva as três letras, pare a gravação e confira a previsão em cada *commit*. Depois, olhe a aba **Components**: que componentes levam o selo «Memo ✨»? Por fim, repita a gravação em uma cópia com `plugins: [react()]`, sem o compilador, e anote se algum componente aparece a mais.

### Exercício 2 — A outra direção

O teste de 9.4.4 busca classes da folha que nenhum componente usa. Faça a pergunta ao contrário, manualmente: há algum `className` escrito em um componente que não tenha nenhuma regra em `panel.css`? Use `grep -rn 'className' src` na cópia com as correções. **Preveja primeiro** quantas serão encontradas, além de `actualizado`, que já foi corrigida. Depois decida, para cada uma, se lhe falta uma regra ou se está bem sem ela, e escreva a razão no diário de bordo.

### Exercício 3 — O ícone que respondeu `200`

No registro do servidor publicado de 9.2.3 aparece `GET /favicon.ico 200`, mas `dist/` não tem nenhum `favicon.ico`. Sem rodar nada, explique o que o servidor respondeu e com que tipo de conteúdo. Depois comprove com `curl -sI http://127.0.0.1:4180/favicon.ico`. É um defeito? O que seria mudado em `publicar.ts`, se algo fosse mudado?

### Exercício 4 — Migrar ou não?

Uma equipe descreve sua aplicação: uma loja virtual com 4,000 produtos, cada um com sua página, que hoje é uma aplicação de página única feita com Vite e React Router; a área de marketing reclama que as páginas de produto não aparecem bem nos buscadores, e o primeiro carregamento em celular leva, medido, quatro segundos. Preencha a tabela de 9.3.3 para essa aplicação e decida se convém migrar para um framework. Escreva o que mediria antes de começar.

## Soluções

### Solução 1

O que deveria aparecer, deduzido do código: a cada letra são renderizados pelo menos `PaginaReporte` (porque o endereço mudou: o texto de busca vive em `?q=`, Lição 5, e é lido com `useSearchParams`, então a razão que o Profiler mostrar será uma mudança de hook, ou «o pai foi renderizado», conforme a versão das ferramentas), `FiltroFallas`, `ContenidoReporte`, `ListaEstados` e as `FilaEstado` que restam na lista. `EditorNota` não aparece: na lista não é renderizado, só na página de detalhe. `BandejaAvisos` tampouco, nem `PanelPreferencias`: vivem em `Disposicion`, e `Disposicion` **não** é renderizado de novo a cada letra, porque quem lê `?q=` é `PaginaReporte` e a mudança ocorre ali, não no layout que a rodeia. Não é memoização nem um contexto que não mudou: é a estrutura de 9.1.4. Foi medido com um contador em cada componente e duas letras digitadas: `PaginaReporte` passou de 1 a 3 renderizações e `Disposicion`, `BandejaAvisos` e `PanelPreferencias` ficaram em 1, **com o compilador e sem ele**. Se no Profiler de quem faz algum dos três aparecer, algo na cópia subiu o estado para o layout, e essa é a pista. Se o compilador está ligado, vários componentes da aba **Components** levam «Memo ✨», e no Profiler é provável que alguns filhos cujas props não mudaram apareçam sem ser renderizados em um *commit*. Se alguma previsão falhou, anote qual e por quê: é exatamente o que o Profiler ensina. Esta medição não foi executada para a lição; o resultado de quem a faz é o que vale.

### Solução 2

Além de `actualizado`, aparece `marca-nota`, em `FilaEstado`: o texto « · con nota» que marca um serviço com nota desde a Lição 2, sem regra em `panel.css`. As classes dinâmicas (`disponible` e `falla` de `estado.tipo`, `aviso-${aviso.nivel}`) sim têm regra. Falta uma regra a `marca-nota`? É uma decisão, não um fato: o texto se lê bem junto ao nome, então pode ficar sem estilo, e a classe serve para encontrá-la em um teste ou nas ferramentas de desenvolvimento. Se se decidir que ela deve aparecer diferente (por exemplo, no cinza de `.actualizado`), escreva o teste antes, como em 9.4.5. O que não vale é deixar a pergunta sem resposta: uma classe sem regra tem que ser uma decisão, não um esquecimento.

### Solução 3

`/favicon.ico` não está na lista de arquivos nem começa com `/assets/`, então o servidor o tratou como uma rota do cliente e respondeu `index.html`: `200`, `text/html; charset=utf-8`, com a política e `no-cache` (é a sexta pergunta de 9.2.3: `200`, `content-type: text/html; charset=utf-8` e `cache-control: no-cache`). O navegador recebe HTML onde esperava um ícone, não consegue renderizá-lo e deixa a aba sem ícone; não há mais dano. É um defeito menor da mesma família que o da prévia (9.2.2): a reescrita foi aplicada a algo que é um arquivo. Há duas correções razoáveis. A mais simples, acrescentar um `favicon.ico` (ou um `<link rel="icon">` para um arquivo em `/assets/`) para que exista. A mais geral, que a reescrita só se aplique a endereços sem extensão, de modo que `/favicon.ico` responda `404`; mas se isso for feito, convém verificar que nenhuma rota do cliente tenha um ponto (`/servicios/v1.2` deixaria de recarregar). Escolher entre as duas é critério; medir o efeito, não.

### Solução 4

A tabela muda quase inteira. Páginas públicas que devem aparecer em buscadores: **Sim**, 4,000. Primeiro carregamento lento e medido: **Sim**, quatro segundos em celular. Dados próprios (o catálogo é deles): provavelmente **Sim**. Segredos: depende (preços especiais, estoque), a verificar. Reinventar o carregamento de dados por rota: provável. Com duas ou três linhas «Sim» medidas, um framework com renderização no servidor por rota começa a compensar seu custo: as páginas de produto chegariam já renderizadas no HTML. Antes de começar, mediria: que parte dos quatro segundos é baixar JavaScript e que parte é esperar dados (aba de rede do navegador), quanto pesa o pacote, e se o problema dos buscadores é de conteúdo (não está no HTML) ou de outra coisa (títulos, links). E uma advertência: a migração pode ser rota por rota, começando pela página de produto, sem reescrever o carrinho nem a conta.

## Como saber se deu certo

- [ ] `npm ci`, `npm run lint`, `npm test` e `npm run build` terminam com código 0 dentro de `~/curso-react/revisor/`; o resumo de `npm test -- --reporter=default` diz `Tests  35 passed (35)` em `11 passed (11)` arquivos, e o `npm run build` deixa `dist/assets/index-Cs1CcfeN.js` e `dist/assets/index-CbqUABMA.css` se o código for idêntico ao do ponto de controle.
- [ ] `grep -o memo_cache_sentinel dist/assets/*.js | wc -l` dá `18`, e em uma cópia sem o compilador dá `1`.
- [ ] As figuras 1, 2 e 3 dão na máquina de quem executa a mesma saída da lição.
- [ ] Com `npm run servidor` e `npm run publicado`, `curl -sI http://127.0.0.1:4180/servicios/pagos` responde `200` com `content-security-policy` e `cache-control: no-cache`; `/assets/no-existe.js` responde `404`; e ao abrir `http://127.0.0.1:4180/servicios/pagos` no navegador e **recarregar**, vê-se o detalhe de `pagos`.
- [ ] `grep -oiE "clave|secret|token|password|apikey" dist/assets/*.js` encontra apenas as coincidências do React DOM e as do schema do cadastro, e sabe-se explicar por que não são um vazamento.
- [ ] Em uma cópia **sem** as cinco correções de 9.4 (com os testes novos e a linha `css` do `vite.config.ts`), os quatro arquivos de teste novos aparecem vermelhos, com 5 testes falhando de 8; no ponto de controle, verdes.
- [ ] **Manualmente, com as ferramentas de desenvolvimento:** foi feito o exercício 1 e anotado no [diário de bordo](bitacora.md) que componentes foram renderizados a cada letra e quais levam «Memo ✨».
- [ ] Sabe-se explicar, sem olhar, por que o `revisor` não usa Server Components.

## Resumo

Responda sem olhar a lição:

1. Que duas condições precisam ser cumpridas para que o `memo` valha a pena? Como se mede cada uma?
2. Que diferença há entre `actualDuration` e `baseDuration` em `onRender`? Por que não se pode usar `<Profiler>` no build de produção?
3. Na figura 1, por que a versão B não renderizou a lista de novo, se não usa `memo`? Qual das cinco recomendações da documentação se aplica?
4. O que o React Compiler faz com um componente que respeita as regras do React, e o que faz com um que as quebra? Como se comprova que atuou no build?
5. Por que `grep -c` dava 2 e `grep -o … | wc -l` dava 18 sobre o mesmo arquivo?
6. Que três coisas faltavam ao `vite preview` para publicar? Como o `publicar.ts` as resolve?
7. Por que a reescrita para `index.html` não se aplica a `/assets/*`?
8. Quais são as três camadas contra XSS do `revisor`, e qual delas não vive no código?
9. O que é um Server Component e o que é uma Server Function? Por que o `revisor` não os usa?
10. Dos cinco defeitos de 9.4, qual tinha um teste verde que não havia medido nada, e o que o corrigiu?

## Leituras complementares

- [React, `<Profiler>`](https://react.dev/reference/react/Profiler): `onRender` e seus parâmetros, `actualDuration` versus `baseDuration`, e por que está desligado em produção. Consultado em 21 de outubro de 2026.
- [React, `memo`](https://react.dev/reference/react/memo): quando vale a pena memoizar, as cinco recomendações para que não seja necessário, e o aviso sobre o React Compiler. Consultado em 21 de outubro de 2026.
- [React, «React Compiler v1.0»](https://react.dev/blog/2025/10/07/react-compiler-1), [«Introduction»](https://react.dev/learn/react-compiler/introduction), [«Installation»](https://react.dev/learn/react-compiler/installation) e [«Debugging and Troubleshooting»](https://react.dev/learn/react-compiler/debugging): a versão estável de 7 de outubro de 2025, o que memoiza, o que fazer com `useMemo` e `useCallback`, a configuração com `reactCompilerPreset` no Vite, como comprovar que atuou, e que ele pula o código que poderia quebrar as regras do React. Consultado em 21 de outubro de 2026.
- [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy): `vite build`, a pasta `dist` e a advertência de que o `vite preview` não é um servidor de produção. Consultado em 21 de outubro de 2026.
- [Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode): o prefixo `VITE_`, a substituição estática ao fazer o build e a advertência sobre informação sensível. Consultado em 21 de outubro de 2026.
- [React, componentes comuns: `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) e [«React v16.9.0»](https://legacy.reactjs.org/blog/2019/08/08/react-v16.9.0.html): o risco de XSS com HTML que não é de confiança, e o anúncio de que o React deixaria de aceitar endereços `javascript:`. Consultado em 21 de outubro de 2026.
- [React, «Server Components»](https://react.dev/reference/rsc/server-components), [«Server Functions»](https://react.dev/reference/rsc/server-functions) e [`"use server"`](https://react.dev/reference/rsc/use-server): o que são, onde rodam, por que suas peças internas não seguem versionamento semântico, e por que os argumentos de uma Server Function são entrada não confiável; e o aviso da [CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components). Consultado em 21 de outubro de 2026.
- [React, «Creating a React App»](https://react.dev/learn/creating-a-react-app): a recomendação de começar com um framework e as razões para começar do zero. Consultado em 21 de outubro de 2026.
- [MDN, `setTimeout`, «Maximum delay value»](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value) e [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval): o atraso como inteiro com sinal de 32 bits e o estouro. Consultado em 21 de outubro de 2026.
- [TanStack Query, «Query Retries»](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries): `retry` como número ou função, e a espera que dobra entre tentativas. Consultado em 21 de outubro de 2026.
- [Vitest, `css`](https://vitest.dev/config/css): `css.include` e os arquivos de estilos que são substituídos por texto vazio. Consultado em 21 de outubro de 2026.
- [W3C, «Understanding SC 1.4.3: Contrast (Minimum)»](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): o contraste mínimo de 4.5 para 1 e a fórmula de luminância relativa. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| renderização a mais | renderizar de novo um componente cujo resultado não mudou, porque mudou o estado de um pai |
| `<Profiler>` | componente do React que mede quantas vezes e quanto tempo leva a renderização de uma parte da árvore |
| `actualDuration` / `baseDuration` | o que levou a renderização desta atualização / o que levaria sem nenhuma memoização |
| memoizar | guardar um resultado para reutilizá-lo enquanto suas entradas não mudarem |
| React Compiler | ferramenta de build que memoiza componentes e hooks por conta própria, e pula os que quebram as regras do React |
| `memo_cache_sentinel` | a marca de «cache ainda vazio» do React; o compilador a escreve em cada valor que guarda uma única vez, então contá-la em `dist/` diz se atuou |
| reescrita para `index.html` | responder a página da aplicação para qualquer endereço que seja uma rota do cliente |
| política de segurança de conteúdo (CSP) | cabeçalho que diz ao navegador de onde pode carregar e executar cada tipo de recurso |
| `immutable` | indicação de cache que promete que o arquivo nunca vai mudar |
| percurso de diretórios (*path traversal*) | ataque que usa `..` em um endereço para ler arquivos fora da pasta publicada |
| Server Component | componente que é renderizado no servidor ou no build, antes de chegar ao navegador |
| Server Function | função que roda no servidor e que um componente do navegador pode chamar |
| controle positivo | verificação, dentro de um teste, de que encontrou algo que se sabe que existe, para que um arquivo vazio não dê verde |
| estouro (*overflow*) | um número que não cabe no tamanho em que é guardado e se converte em outro |

---

**Fim do curso.** Quem chegou até aqui com o seu `revisor` volta a [«Como saber que terminou»](README.md#como-saber-que-terminou) no README e confere as cinco condições. E abre o [diário de bordo](bitacora.md): o que foi anotado nestas dez lições é o que vale a pena revisar.
