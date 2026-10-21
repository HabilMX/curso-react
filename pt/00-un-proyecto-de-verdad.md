# Lição 0 — Um projeto de verdade: Vite, StrictMode e o linter

*São 9h40 e a revisão com a equipe de operação é às 10h. Ontem a gente mudou uma linha do painel do `revisor`: tirou uma dependência de um `useEffect` porque «sobrava». Na nossa máquina, tudo perfeito. A colega abre na dela, muda o intervalo de atualização para cinco segundos para a demonstração… e o painel continua perguntando a cada dez, como se não tivesse ouvido. Ninguém sabe por quê. Na mesma alteração, alguém deixou, «só para testar», uma chave do provedor de monitoramento em uma variável que começa com `VITE_`, e o pacote já foi publicado no servidor de testes. Faltam vinte minutos. As duas falhas tinham aviso: uma ferramenta que não estava instalada e uma regra que ninguém conhecia. Esta lição instala a ferramenta e explica a regra.*

**Tempo:** 2 × 45 min (o corte natural fica entre as seções 0.3 e 0.4)

**O que se constrói:** o painel da lição 9 do curso de TypeScript, levado para um projeto Vite: com servidor de desenvolvimento, um *proxy* para a API, uma variável de configuração `VITE_`, `StrictMode` ativado, o linter do React ativo e o servidor de prática do curso, para que o painel tenha a quem perguntar

**O que se aprende:** o que o Vite acrescenta a um empacotador montado manualmente; o template `react-ts`, seus três `tsconfig` e a estrutura por funcionalidade; o *proxy* para a API (sem CORS em desenvolvimento); as variáveis `VITE_` e por que nenhum segredo vai nelas; `eslint-plugin-react-hooks` ativo desde o primeiro dia

**De onde a gente vem.** Da lição 9 do [curso de TypeScript](https://github.com/HabilMX/curso-typescript) da Hábil, ou de um lugar parecido: um painel React que funciona. Esse painel tem um componente `Panel`, um hook próprio `useReporte` que pede `GET /api/estados` com um `AbortController`, uma fronteira de rede `cargar.ts` que valida a resposta com `esReportePublico`, e um `cliente.tsx` que o monta. Era empacotado com um comando de esbuild de uma linha e servido pelo mesmo processo Node que respondia à API. Quem não fez esse curso não precisa se preocupar: todo o código do painel aparece completo nesta lição, e o curso traz um servidor de prática que responde ao mesmo contrato. O trabalho acontece em uma pasta nova, `~/curso-react/revisor/`.

**O que esta lição não faz.** Não muda o que o painel faz: nenhuma tela nova, nenhum estado novo, nenhuma regra nova. O código React é o mesmo da lição 9 de TypeScript, com duas pequenas alterações explicadas onde aparecem. Também não explica a fundo os Effects nem o StrictMode: aqui eles são ativados e dá para ver o que fazem; a [Lição 3](03-effects-sincronizar.md) os desmonta peça por peça. Não publica nada: a política de segurança de conteúdo (CSP), a reescrita para `index.html` e o servidor de produção chegam na [Lição 9](09-rendimiento-publicacion.md). E ainda não tem testes automatizados: Vitest e Testing Library chegam na [Lição 8](08-pruebas-de-componentes.md).

**Sobre as execuções.** Tudo foi executado em 21 de outubro de 2026 com Node.js 24.22.0 (a versão LTS mais recente naquele dia) e npm 11.19.1, no macOS, com as versões exatas fixadas pelo `package.json` desta lição. Como o curso supõe Linux Mint, o ponto de controle foi instalado novamente do zero com `npm ci` dentro de um contêiner Linux (Debian 12 com a imagem oficial `node:24.22.0`), e ali `npm run lint` e `npm run build` deram a mesma saída, com os mesmos nomes de arquivo em `dist/`. Nada foi executado em um Linux Mint real, mas nada do que se mostra depende do sistema, exceto a palavra `darwin-arm64` de `vite --version`, que no Mint vai aparecer como `linux-x64`. O que se vê «no navegador» foi medido com o Chrome em modo *headless* (`--headless`), que carrega a página, executa seu JavaScript e entrega o documento resultante: é um navegador real, não uma simulação. Os caminhos longos impressos pelo ESLint e pelo Vite são mostrados a partir de `~/curso-react`. Os horários do registro do servidor de prática estão em UTC. Os programas estão em [`programas/00-un-proyecto-de-verdad/`](../programas/00-un-proyecto-de-verdad), no repositório do curso: `revisor/` é o ponto de controle e as figuras estão ao lado dele.

## Ao terminar, vai ser possível

- Criar um projeto com o template `react-ts` do Vite, fixar suas dependências com versão exata e explicar para que serve cada um dos seus três arquivos `tsconfig`.
- Explicar a diferença entre `npm run dev` e `npm run build`, e demonstrar com um erro de tipos que o Vite traduz TypeScript, mas não o verifica.
- Configurar um *proxy* em `vite.config.ts` e explicar, com a resposta do `curl` à vista, por que com ele o navegador não precisa de CORS em desenvolvimento.
- Ler uma variável `VITE_` a partir de `import.meta.env`, tipá-la e comprovar com `grep` sobre `dist/` que seu valor viaja escrito no JavaScript que qualquer pessoa baixa.
- Reconhecer no registro do servidor a segunda requisição que o `StrictMode` provoca em desenvolvimento, e explicar por que ela não aparece na versão construída.
- Ativar o `eslint-plugin-react-hooks`, fazer um aviso interromper o `npm run lint` e interpretar os avisos de `rules-of-hooks`, `exhaustive-deps` e `set-state-in-effect`.

## O porquê antes do como

O painel da lição 9 de TypeScript funciona, e funciona por bons motivos: o contrato está validado, o efeito é limpo, a falha da API aparece como falha. O que falta é um **projeto** em volta. Basta fazer quatro perguntas a esse painel para enxergar as lacunas.

**Quanto tempo leva para ver uma alteração?** Cada vez que se mexia em `Panel.tsx`, era preciso empacotar de novo com esbuild, reiniciar o servidor Node e recarregar a página. São quinze segundos, cem vezes por dia. Um servidor de desenvolvimento que observa os arquivos e avisa o navegador sobre qual módulo mudou transforma esses quinze segundos em menos de um, e ainda preserva o estado da tela.

**Como falar com a API se elas não vivem no mesmo processo?** Em TypeScript, a página e a API saíam do mesmo servidor, da mesma origem, e por isso `fetch("/api/estados")` funcionava sem configurar nada. Assim que a tela (que agora é servida por uma ferramenta de desenvolvimento em uma porta) é separada da API (que continua em outra), o navegador passa a aplicar a política de mesma origem e a requisição é bloqueada. Há duas saídas: abrir CORS na API, que é uma decisão de segurança que não cabe à tela, ou fazer a ferramenta de desenvolvimento repassar essas requisições, para que o navegador volte a enxergar uma única origem. Esta lição fica com a segunda.

**Onde fica a configuração?** O intervalo de atualização estava escrito no código, `10_000`. Mudá-lo para uma demonstração exigia editar um arquivo. As ferramentas de build oferecem variáveis de ambiente, mas em uma página do navegador «variável de ambiente» significa algo muito diferente do que em um servidor, e confundir as duas coisas é a forma mais comum de publicar uma chave.

**Quem avisa quando uma regra do React é quebrada?** O compilador de TypeScript verifica tipos; ele não sabe que um hook não pode ser chamado depois de um `return`, nem que a lista de dependências de um efeito precisa nomear o que o efeito usa. A lição 9 de TypeScript disse isso com todas as letras: «o ESLint, neste projeto, não verifica listas de dependências; o pacote oficial que faz isso é o `eslint-plugin-react-hooks`, e é uma boa próxima instalação». Essa próxima instalação é hoje, e é a primeira deste curso, porque **um princípio que o curso repete em toda lição — se o linter reclama, muda-se o código — só faz sentido se o linter estiver ativo desde o primeiro dia.**

As quatro respostas cabem em uma ferramenta e dois interruptores. A ferramenta é o **Vite**, a que a própria equipe do React propõe para construir uma aplicação sem framework ([React, «Build a React app from Scratch»](https://react.dev/learn/build-a-react-app-from-scratch)) e a que substituiu o Create React App, descontinuado pela equipe do React para projetos novos em 14 de fevereiro de 2025 ([React, «Sunsetting Create React App»](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). Os interruptores são o **`StrictMode`**, que faz o React pôr os componentes à prova durante o desenvolvimento, e o **`eslint-plugin-react-hooks`**, que verifica as regras do React antes de executar qualquer coisa.

A lição tem sete partes: o que é o Vite e o que ele faz (0.1); o projeto, seus `tsconfig` e suas pastas (0.2); o *proxy* (0.3); as variáveis `VITE_` (0.4); o `StrictMode` (0.5); o linter (0.6); e o percurso completo com o servidor de prática (0.7). No final, isto é o que vai aparecer, e vai dar para saber de onde sai cada linha:

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

## Os conceitos

### 0.1 O que o Vite faz que o empacotador montado manualmente não fazia

#### 0.1.1 Dois trabalhos diferentes com o mesmo nome

O comando de esbuild da lição 9 de TypeScript fazia um único trabalho: pegar `cliente.tsx`, seguir seus `import`, juntar tudo em um `cliente.js` e gravá-lo em disco. O Vite faz **dois trabalhos diferentes**, e quase tudo o que se lê sobre ele fica mais claro quando os dois são separados:

1. **O servidor de desenvolvimento** (`npm run dev`). Não junta o código em um arquivo. Serve cada módulo do código separadamente, quando o navegador pede, traduzido na hora de TypeScript e JSX para JavaScript. Os navegadores modernos sabem carregar módulos JavaScript (`<script type="module">` e seus `import`) sem ajuda, então não é preciso empacotar para desenvolver. Por isso ele inicia em um instante, seja qual for o tamanho do projeto, e por isso, quando um arquivo muda, só aquele módulo é reenviado: é a **substituição de módulos a quente** (HMR, *Hot Module Replacement*), que no React se chama *Fast Refresh* e preserva o estado dos componentes que não mudaram ([Vite, «Why Vite»](https://vite.dev/guide/why)). Com as **dependências** (o que vive em `node_modules/`, como `react`) ele abre uma exceção: faz o **pré-empacotamento** delas uma vez, ao iniciar, para converter em módulos JavaScript as que vêm no formato antigo do Node (CommonJS) e para que uma biblioteca feita de centenas de arquivos internos chegue ao navegador em uma única requisição, e não em centenas. Esse pré-empacotamento só acontece em desenvolvimento e não mexe no nosso código ([Vite, «Dependency Pre-Bundling»](https://vite.dev/guide/dep-pre-bundling)).
2. **O build** (`npm run build`). Aqui sim se empacota, porque servir centenas de módulos soltos em produção obriga o navegador a fazer uma requisição para cada `import` aninhado. O resultado é uma pasta `dist/` com um `index.html`, um JavaScript e uma folha de estilos com nomes que mudam quando o conteúdo muda.

Desde o Vite 8, lançado em 12 de março de 2026, os dois trabalhos são feitos pela mesma peça: o **Rolldown**, um empacotador escrito em Rust, com o **Oxc** para ler, traduzir e minificar o código. Antes, o Vite usava esbuild em desenvolvimento e Rollup para o build, e manter os dois de acordo exigia código de cola ([Vite, «Announcing Vite 8»](https://vite.dev/blog/announcing-vite8)). Na prática, a consequência é uma só: o que se vê em desenvolvimento e o que vai para o build passam pelas mesmas regras de tradução.

#### 0.1.2 `index.html` é o ponto de entrada

Na lição 9 de TypeScript, a página era uma string dentro de `pagina.ts` e apontava para um `/cliente.js` que precisava existir de antemão. No Vite é o contrário: **`index.html` fica na raiz do projeto e é o ponto de partida.** O Vite o lê, encontra o `<script type="module" src="/src/main.tsx">` e a partir dali segue os `import` ([Vite, «Getting Started»](https://vite.dev/guide/)). Aponta-se para o arquivo TypeScript, não para um resultado empacotado; o Vite se encarrega de que o navegador receba JavaScript.

Dá para ver isso com os próprios olhos. Com o servidor de desenvolvimento rodando, peça a página com `curl`:

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

É o nosso `index.html` com dois acréscimos que ninguém escreveu: `/@vite/client`, o pedacinho que mantém uma conexão aberta com o servidor para saber qual arquivo mudou, e `/@react-refresh`, o que permite substituir um componente sem perder o estado dos demais. O segundo é colocado pelo `@vitejs/plugin-react`, o plugin oficial do Vite para React, que além disso traduz o JSX com o *runtime* automático, o mesmo modo `react-jsx` usado com `tsc` ([vite-plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)). Nada disso aparece em `dist/`: é só para desenvolver.

#### 0.1.3 O Vite traduz TypeScript, mas não o verifica

Esta é a frase que mais vale levar desta seção: **o Vite apaga os tipos sem verificá-los.** A documentação dele diz isso em maiúsculas: só traduz os arquivos `.ts` e «NÃO» verifica tipos; essa tarefa fica com o editor e com o processo de build ([Vite, «Features», TypeScript](https://vite.dev/guide/features)). É exatamente o que acontecia com o esbuild na lição 9 de TypeScript, e tem a mesma consequência: quem roda só a ferramenta que empacota pode entregar um programa com erros de tipo.

Por isso o script `build` do template não é um simples `vite build`, mas `tsc -b && vite build`. Primeiro o compilador de TypeScript verifica tudo; se encontra um erro, o `&&` impede que o build sequer comece. Em «O erro que vai aparecer», esse erro vai ser provocado de propósito para ver as duas saídas lado a lado. E em desenvolvimento, enquanto `npm run dev` roda, os erros de tipo **não aparecem no terminal nem no navegador**: aparecem no editor, ou ao rodar `npm run build`.

### 0.2 O projeto: o template, seus `tsconfig` e suas pastas

#### 0.2.1 O que o template traz, e o que se muda nele

A forma oficial de começar é `npm create vite@latest`. Com um nome e um template, ele não faz perguntas. Este curso fixa a versão do criador para que o resultado seja igual ao da lição:

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

Os dois hifens soltos (`--`) separam as opções do npm das opções do criador; sem eles, o npm ficaria com o `--template`. O template `react-ts` deixa uma pasta com `index.html`, `vite.config.ts`, três arquivos `tsconfig`, um `package.json`, uma pasta `src/` com um contador de exemplo e uma pasta `public/` para arquivos copiados como estão. Medido naquele dia, o `package.json` dele trazia três decisões que este curso muda, e convém dizer isso em voz alta para não surpreender quem comparar:

- **As versões com `^` e `~`.** O template escreve `"vite": "^8.3.4"`, o que deixa o npm instalar qualquer 8.x mais nova. O curso fixa cada dependência com sua versão exata, verificada com `npm view` no dia da execução: assim, o que se vê aqui é o que se instala. O arquivo de lock, `package-lock.json`, guarda além disso a resolução exata de tudo o que essas dependências arrastam.
- **O linter.** O template deste mês traz o **Oxlint**, um linter muito rápido escrito em Rust, com algumas regras de React. O curso usa ESLint com `eslint-plugin-react-hooks`, que é o pacote publicado pela própria equipe do React para verificar suas regras ([React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks)) e o que inclui os diagnósticos do React Compiler usados na Lição 9. O Oxlint não é uma má escolha; é outra, e misturar dois linters em um curso é ruído. O criador tem uma opção `--eslint` que troca o Oxlint pelo ESLint, mas, medido no mesmo dia, ela também acrescenta `eslint-plugin-react-refresh` e `globals`, dois pacotes que este curso não usa; por isso aqui o projeto é criado sem essa opção e o Oxlint é removido manualmente, como se explica abaixo.
- **TypeScript.** O template fixa o TypeScript 6. O curso de TypeScript trabalha com o TypeScript 7, e aqui isso se mantém igual: o TypeScript 7 é o que verifica os tipos (`tsc`), e o TypeScript 6 fica, com o nome `typescript`, só para que o ESLint consiga ler os arquivos `.ts`. O motivo é mensurável: o `typescript-eslint` declara que suporta TypeScript `>=4.8.4 <6.1.0` ([typescript-eslint, «Dependency Versions»](https://typescript-eslint.io/users/dependency-versions/)), então ainda não roda com a 7. São dois papéis diferentes; não troque um pelo outro.

Para quem não fez o curso de TypeScript, não é preciso entender o truque dos aliases para acompanhar: basta saber que `npx tsc --version` diz `Version 7.0.2` e que `npx tsc6 --version` existe só para o ESLint. Um detalhe curioso que foi medido: o pacote `@typescript/typescript6` está na versão 6.0.2, mas o executável responde `Version 6.0.3`. Não afeta nada; fica registrado porque, se aparecer, não é um erro de quem está seguindo a lição.

O ponto de controle desta lição não mantém o contador de exemplo nem a pasta `public/`: seus arquivos são substituídos pelos do painel. Antes de instalar qualquer coisa, remova o que o template traz do Oxlint, para que o projeto fique igual ao do curso: apague o arquivo `.oxlintrc.json`, apague no `package.json` a linha `"oxlint"` de `devDependencies` e deixe o bloco `scripts` igual ao mostrado mais abaixo (o `lint` do template diz `oxlint`; o do curso, `eslint . --max-warnings 0`, e acrescenta-se `servidor`). As dependências são instaladas assim, em dois comandos, a partir de `~/curso-react/revisor/`:

```bash
npm install --save-exact react@19.3.1 react-dom@19.3.1
npm install --save-dev --save-exact vite@8.3.5 @vitejs/plugin-react@6.1.2 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 "@typescript/native@npm:typescript@7.0.2" "typescript@npm:@typescript/typescript6@6.0.2" eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-react-hooks@7.1.1
```

Repare em uma diferença em relação à lição 9 de TypeScript: lá o React ia em `devDependencies`, porque o servidor de produção não o importava. Aqui ele vai em `dependencies`, como o template coloca. Para uma aplicação que é construída e servida como arquivos estáticos, a diferença não muda o resultado (tudo termina dentro do JavaScript de `dist/`); é uma convenção que separa «o que viaja para o navegador» de «o que só se usa para construir».

O `package.json` do ponto de controle fica assim:

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

Cinco scripts, cinco trabalhos. `dev` inicia o servidor de desenvolvimento. `build` verifica tipos e constrói. `lint` roda o ESLint com `--max-warnings 0`, explicado em 0.6. `preview` serve o que ficou em `dist/` para ver antes de publicar (e só para isso: a documentação do Vite diz que ele foi pensado para ver o build na máquina local e que não é um servidor de produção, [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy)). E `servidor` inicia o servidor de prática, apresentado em 0.7.

Antes de seguir, um costume inegociável: `node_modules/` nunca vai para um repositório. São dezenas de megabytes que o `npm ci` reconstrói idênticos a partir do `package-lock.json`. O template traz um `.gitignore` que já o exclui, junto com `dist/` e os arquivos `*.local`; mantenha-o e, ao montar o projeto manualmente, crie-o antes do primeiro `git add` com pelo menos estas três linhas: `node_modules`, `dist` e `*.local`. No repositório do curso, a pasta `revisor/` não traz um `.gitignore` próprio: os dez pontos de controle vivem em um único repositório e o `.gitignore` da raiz cobre todos. O que vai, sim, para o repositório é o `package-lock.json`.

#### 0.2.2 Três `tsconfig`, porque há dois mundos

Na lição 9 de TypeScript, um único `tsconfig.json` verificava ao mesmo tempo o servidor e o painel, e a própria lição apontava o custo: o código do servidor também «enxergava» `document`, e um descuido compilava e falhava na execução. O template do Vite separa os dois mundos com **referências de projeto** (*project references*): pequenos projetos TypeScript verificados separadamente, cada um com suas próprias regras ([TypeScript, «TSConfig Reference»](https://www.typescriptlang.org/tsconfig/)). O arquivo da raiz não verifica nada; só lista os outros dois:

```json revisor/tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsc -b` (de *build*) percorre essas referências e verifica cada uma. A primeira é a do navegador, `tsconfig.app.json`, e cobre `src/`:

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

O que importa deste arquivo cabe em cinco ideias:

- **`"lib": ["ES2023", "DOM"]` e `"types": ["vite/client"]`.** Aqui existem `document` e `window`, além dos tipos que o Vite acrescenta ao navegador, como `import.meta.env` ([Vite, «Features», tipos do cliente](https://vite.dev/guide/features)). No outro projeto eles não vão existir.
- **`"noEmit": true`.** O TypeScript não gera nenhum `.js`: só verifica. Quem traduz é o Vite. A documentação do TypeScript descreve essa opção exatamente assim: abre espaço para que outra ferramenta converta o código ([TypeScript, `noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit)).
- **`"moduleResolution": "bundler"`.** É a forma de resolver `import` pensada para empacotadores e, diferentemente de `nodenext`, **nunca exige extensão** nos caminhos relativos ([TypeScript, `moduleResolution`](https://www.typescriptlang.org/tsconfig/#moduleResolution)). Esta é a primeira das duas alterações no código da lição 9: lá se escrevia `import { Panel } from "./Panel.js"`, com um `.js` que não existia em disco, porque o Node exigia; aqui se escreve `from "./Panel"`.
- **`verbatimModuleSyntax` e `isolatedModules`.** O Vite traduz cada arquivo separadamente, sem olhar os outros, e por isso não sabe se o que se importa é um tipo ou um valor. Com `verbatimModuleSyntax`, o TypeScript obriga a marcar com `type` o que é só tipo, e o tradutor pode apagá-lo sem hesitar ([TypeScript, `verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax)); com `isolatedModules`, ele avisa quando se escreve algo que um tradutor de um arquivo por vez não consegue interpretar bem. A documentação do Vite pede essa segunda opção explicitamente ([Vite, «Features»](https://vite.dev/guide/features)). O template não a traz; o ponto de controle a acrescenta porque a fonte oficial exige.
- **`"strict": true`.** Também não vem no template deste mês, e o curso de TypeScript o dava como certo desde a lição 2. Sem ele, `null` e `undefined` se infiltram onde não devem.

O segundo projeto, `tsconfig.node.json`, é o das coisas que rodam no Node: a configuração do Vite e o servidor de prática.

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

Aqui não há `DOM`: se o servidor de prática escrevesse `document`, `tsc -b` rejeitaria. E aparecem duas opções que têm a ver com uma capacidade nova do Node: desde a versão 24.12.0, executar um arquivo `.ts` diretamente com `node arquivo.ts` é estável. O Node não verifica tipos, só os substitui por espaços, e por isso impõe duas condições: que as importações tragam a extensão `.ts` e que o arquivo não use sintaxe de TypeScript que gere código, como `enum` ([Node.js, «Modules: TypeScript»](https://nodejs.org/api/typescript.html)). `allowImportingTsExtensions` permite a primeira; `erasableSyntaxOnly` faz o `tsc` vigiar a segunda ([TypeScript, `erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly)). Por isso `npm run servidor` é `node servidor/practica.ts`, sem compilar nada antes.

A configuração do Vite é curta. O *proxy* que ela contém é explicado em 0.3:

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

`port: 5173` é a porta que o Vite usa de qualquer forma; escrevê-la deixa claro qual é. `strictPort: true` muda o que acontece se essa porta estiver ocupada: sem essa opção, o Vite tenta em silêncio a próxima porta livre ([Vite, «Server Options»](https://vite.dev/config/server-options)), e o resultado seriam dois servidores de desenvolvimento esquecidos em 5173 e 5174 sem saber qual se está olhando. Com ela, o Vite se recusa a iniciar e avisa.

#### 0.2.3 As pastas: por funcionalidade, não por tipo de arquivo

Há duas formas comuns de organizar `src/`. Uma agrupa por tipo de arquivo: uma pasta `components/`, outra `hooks/`, outra `services/`. A outra agrupa por **funcionalidade**: tudo o que é necessário para «ver o relatório de estados» fica junto, seja componente, hook ou função de rede. Este curso usa a segunda, e é um princípio próprio, não uma regra do React (a documentação do React não impõe nenhuma estrutura). O motivo é prático: quando muda a aparência do relatório, abre-se uma pasta, não três. E quando o `revisor` crescer — o detalhe de um serviço na Lição 5, o cadastro na Lição 7 —, cada funcionalidade nova vai ser uma pasta nova, não mais um arquivo em cada uma das de sempre.

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

`src/reporte/` é a funcionalidade. `src/compartido/` guarda o que várias usam: hoje, só o contrato. Os demais arquivos de `src/` são os que dizem respeito à aplicação inteira: a inicialização e a configuração. Este é o contrato, o mesmo da lição 8 de TypeScript; a única alteração é que `esRegistro` agora fica aqui mesmo, porque o arquivo de configuração do servidor de onde era importado não faz parte deste projeto:

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

A fronteira de rede tem a segunda alteração. Em TypeScript, `cargarReporte` recebia um segundo parâmetro, `base`, que os testes usavam para apontar para um servidor local com o endereço completo. Aqui o navegador sempre pede o caminho relativo `/api/estados` e é o *proxy* que decide para onde vai, então esse parâmetro sobra e é removido. Sem ele, a função fica exatamente com a forma do tipo `Cargar`, e `main.tsx` pode passá-la como está, sem envolvê-la em uma arrow function:

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

O hook e o componente chegam sem alterações de lógica; só mudam seus `import`. O componente, além disso, importa sua folha de estilos: no Vite, `import "./panel.css"` é tudo o que é preciso para que o CSS chegue à página. Em desenvolvimento, ele é injetado com uma tag `<style>` que é substituída a quente quando o arquivo é editado, e no build é reunido em um arquivo `.css` separado ([Vite, «Features», CSS](https://vite.dev/guide/features)). Em TypeScript, a folha era passada ao esbuild como segunda entrada; aqui a folha viaja com o componente que a usa, que é justamente a ideia de agrupar por funcionalidade.

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

A página e a inicialização fecham o percurso. `index.html` é o do template com três alterações: o idioma, o título e o identificador do contêiner, que fica como `raiz` para não mexer no código que o procura. `main.tsx` é o `cliente.tsx` de TypeScript com dois acréscimos: o `StrictMode`, explicado em 0.5, e o intervalo lido da configuração, explicado em 0.4.

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

Repare em algo que a lição 9 de TypeScript cuidava e que aqui se mantém: `cargarReporte` é uma função declarada no nível do módulo, então é a mesma em cada render. `useReporte` a tem na sua lista de dependências; se ela mudasse a cada render, o efeito se repetiria a cada render.

### 0.3 O *proxy*: uma única origem durante o desenvolvimento

Até aqui há dois processos: o servidor de desenvolvimento do Vite em `http://localhost:5173` e a API (o servidor de prática) em `http://127.0.0.1:3100`. Para o navegador, são **duas origens**, porque uma origem é a combinação de esquema, host e porta, e aqui mudam o host e a porta. A regra que se aplica se chama **política de mesma origem**: um script carregado de uma origem pode pedir dados a outra, mas o navegador **não o deixa ler a resposta** a menos que essa resposta traga os cabeçalhos de CORS adequados. A MDN diz assim: por segurança, os navegadores restringem as requisições HTTP entre origens iniciadas por scripts, e `fetch()` segue a política de mesma origem ([MDN, «Cross-Origin Resource Sharing (CORS)»](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)). O cabeçalho que dá a permissão é `Access-Control-Allow-Origin`.

O servidor de prática o envia? Pergunte como o navegador perguntaria, dizendo de que origem se vem:

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

Nem sinal de `Access-Control-Allow-Origin`. O `curl` recebe a resposta completa porque o `curl` não é um navegador e não aplica nenhuma política; mas se o painel, carregado da porta 5173, pedisse esse endereço completo, o navegador receberia a resposta e se recusaria a entregá-la ao código, e no console apareceria um erro de CORS. E é deliberado que o servidor não o envie: decidir quais origens podem ler uma API é uma decisão de segurança da API, não algo que se abre porque atrapalha a tela em desenvolvimento. A lição 9 de TypeScript disse isso pelo outro lado: enquanto painel e API saírem do mesmo processo, não há nada a configurar, e se um dia se separarem, a resposta correta é declarar origens explícitas, nunca `*` por comodidade.

A outra saída é o navegador **nunca ficar sabendo** que há dois processos. É isso que faz o *proxy* de `vite.config.ts`: «toda requisição cujo caminho comece com essa chave é repassada ao destino indicado» ([Vite, «Server Options», `server.proxy`](https://vite.dev/config/server-options)). A forma curta, `"/api": "http://127.0.0.1:3100"`, significa que `http://localhost:5173/api/estados` se converte, dentro do servidor do Vite, em `http://127.0.0.1:3100/api/estados`. O navegador só fala com a porta 5173; o repasse acontece entre dois processos da máquina local, onde não há nenhuma política de mesma origem a aplicar. Confirme com o mesmo `curl`, agora contra o Vite:

```text
$ curl -s http://localhost:5173/api/estados | head -c 120
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla"
```

A resposta é a do servidor de prática, servida a partir da origem da página. Por isso `cargar.ts` continua escrevendo `fetch("/api/estados")`, um caminho relativo, igual ao TypeScript: o código do painel não sabe nem se importa em qual porta a API vive. Três detalhes que vale saber:

- **Só é repassado o que começa com a chave.** `/src/main.tsx` continua sendo servido pelo Vite. Se amanhã a API acrescentar rotas que não comecem com `/api`, elas não serão repassadas até que se acrescente outra chave. Por isso convém que todas as rotas de uma API fiquem sob um mesmo prefixo.
- **`vite preview` também repassa.** A opção `preview.proxy` assume por padrão o valor de `server.proxy` ([Vite, «Preview Options»](https://vite.dev/config/preview-options)), e por isso em 0.5 a versão construída também encontra a API.
- **Em produção não há *proxy* do Vite.** O que se publica são os arquivos de `dist/`, e quem os servir vai ter de resolver a mesma coisa: ou a página e a API saem da mesma origem (o mais comum, com um proxy reverso na frente), ou a API declara CORS. A Lição 9 volta a esse assunto.

### 0.4 Variáveis `VITE_`: configuração, nunca segredos

O intervalo de atualização é configuração: um valor que pode mudar entre a nossa máquina, a da colega e a versão publicada, sem que o código mude. Em um servidor Node ele seria lido de `process.env`. Em uma página do navegador **não há ambiente**: o código roda no computador de quem abre a página, e a única coisa que essa pessoa recebe é o JavaScript enviado a ela. Então, quando o Vite oferece «variáveis de ambiente», o que ele de fato faz é **escrever o valor dentro do código** no momento de servir ou construir.

A regra do Vite é uma só: apenas as variáveis cujo nome começa com `VITE_` chegam ao código do cliente, por meio de `import.meta.env`, e seu valor é substituído de forma estática no build ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). Elas podem ser definidas no terminal ou em um arquivo `.env` na raiz do projeto, que o Vite sempre lê, junto com `.env.local`. O ponto de controle traz este:

```bash
# Variables que Vite expone al navegador. TODO lo que empieza con VITE_ termina
# escrito en el JavaScript que descarga cualquier persona: aquí no va ningún secreto.
VITE_CADA_MS=10000
```

E a configuração é lida e validada em um único lugar. O que chega de `import.meta.env` é texto ou `undefined`, nunca um número, e vem de fora do programa: é tratado como qualquer entrada de uma fronteira, igual a `leerPuerto` no curso de TypeScript. Se faltar ou não for um inteiro positivo, usa-se o valor de sempre:

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

Para que o TypeScript saiba quais variáveis existem, elas são declaradas em `src/vite-env.d.ts`, como indica a documentação do Vite. A interface `ViteTypeOptions` com `strictImportMetaEnv` torna o tipo estrito: com ela, ler uma variável não declarada é um erro de compilação em vez de um `any` silencioso ([Vite, «Env Variables and Modes», IntelliSense](https://vite.dev/guide/env-and-mode)). Em «O erro que vai aparecer», dá para vê-la pegar um erro de digitação.

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

Agora, a demonstração que justifica a seção inteira. Peça ao servidor de desenvolvimento o módulo de configuração, tal como o navegador o recebe:

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

A primeira linha é a que importa: o valor da variável está **escrito no arquivo** que o navegador baixa, junto com outras quatro constantes que o Vite sempre define (`DEV`, `PROD`, `MODE`, `BASE_URL`). No build acontece a mesma coisa, já minificado. Construa com outro valor e procure-o em `dist/`:

```text
$ VITE_CADA_MS=15000 npx vite build
...
$ grep -o '.\{30\}15000.\{30\}' dist/assets/*.js
.test(e)?d:Number(e)}var p=f(`15000`);function m(e){return typeof
```

Ali está, `f(`15000`)`, dentro do JavaScript minificado: `f` é `leerCadaMs` com o nome encurtado. (Usa-se `npx vite build` e não `npm run build` só para passar a variável na mesma linha; o resultado é igual.) E se alguém define uma «chave», acontece exatamente a mesma coisa. Este experimento acrescenta temporariamente uma linha a `main.tsx` que imprime uma variável com prefixo e outra sem, constrói com os dois valores definidos no terminal e procura:

```text
$ VITE_CLAVE_API=clave-de-mentira-123 CLAVE_API=otra-clave-456 npx vite build
...
$ grep -o 'con prefijo:.\{0,80\}' dist/assets/*.js
con prefijo:`,`clave-de-mentira-123`,`sin prefijo:`,void 0);
```

A de `VITE_` ficou escrita, legível para qualquer pessoa que abra as ferramentas de desenvolvimento do navegador. A que não tem prefixo ficou como `void 0`, ou seja, `undefined`: o Vite não a expôs. Por isso a documentação do Vite adverte que as variáveis `VITE_*` não devem conter informação sensível, como chaves de API ([Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode)). Repare também que o build terminou bem, embora o código lesse duas variáveis que `vite-env.d.ts` não declara: `vite build` não verifica tipos. `npx tsc -b`, sim, o teria interrompido com dois `TS2339`; por isso o script de build do curso começa com ele. (Ao repetir o experimento, remova a linha depois e construa de novo.)

A regra prática tem duas metades. **O que pode ir em `VITE_`:** o que não incomodaria ver publicado em um cartaz, como um intervalo, o nome do ambiente ou o endereço público de uma API. **O que nunca vai:** chaves, senhas, tokens, nada que dê permissão para algo. Um segredo de que o navegador precisa deixa de ser segredo assim que o navegador o tem; se uma funcionalidade precisa de uma chave, a chave fica em um servidor e a tela pede ao servidor que faça o trabalho. E mais uma peça: os arquivos `.env.local` existem para valores da máquina local que não se quer compartilhar, e o Vite recomenda colocar `*.local` no `.gitignore` para que nunca sejam versionados.

### 0.5 `StrictMode`: o teste gratuito

`StrictMode` é um componente do React que não renderiza nada. Ele envolve uma parte da árvore (aqui, a árvore inteira) e, **só em desenvolvimento**, faz três coisas de propósito para revelar erros que já existem no código: renderiza cada componente uma vez a mais, executa cada efeito em um ciclo extra de «iniciar e limpar» e verifica o uso de APIs antigas ([React, «StrictMode»](https://react.dev/reference/react/StrictMode)). Em produção não faz nada: a documentação diz isso sem rodeios, todas as suas verificações são de desenvolvimento e não afetam o build.

O ciclo extra dos efeitos é o que mais se nota, e a primeira figura o mostra em um DOM de teste. Um componente com um efeito que imprime quando começa e quando deixa de sincronizar é montado e desmontado duas vezes: sem `StrictMode` e com ele.

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

As figuras rodam em uma pasta separada, `~/curso-react/figuras/`, com seu próprio `package.json` (está na pasta de programas da lição, ao lado de `revisor/`); são compiladas com `tsc` e executadas com `node`, como no curso de TypeScript. Com `StrictMode`, o React montou o efeito, limpou-o imediatamente e o montou de novo, como se alguém tivesse saído da tela e voltado em um instante. Para quê? Porque isso **acontece de fato** em uma aplicação real: a pessoa troca de tela e volta, ou muda uma dependência do efeito. Se o efeito não sabe limpar o que fez, essa saída e volta deixa lixo: duas conexões abertas, dois temporizadores, duas requisições que competem. O `StrictMode` provoca essa situação em cada montagem para que ela apareça hoje, e não quando alguém a notar em produção.

No `revisor`, isso se vê no registro do servidor de prática. Isto é o que ele registrou quando o Chrome abriu o painel servido por `npm run dev`:

```text
07:26:06.245 GET /api/estados cancelada por el cliente
07:26:06.545 GET /api/estados 200
```

Duas requisições ao abrir a página uma única vez. A primeira foi feita pela primeira montagem do efeito; a limpeza que veio em seguida chamou `control.abort()`, o navegador cortou a conexão e o servidor a registrou como cancelada. A segunda foi feita pela segunda montagem, e é a que preencheu a tela.

Uma precisão sobre o que é garantido e o que não é. O que o React garante é o ciclo extra do efeito: preparar, limpar e preparar de novo ([React, «StrictMode»](https://react.dev/reference/react/StrictMode)). Se o servidor consegue **registrar** a primeira requisição depende do momento em que o abort chega: se o navegador a cancela antes de a conexão chegar ao servidor, o registro mostra só o `200`. Nesta execução a conexão chegou a tempo, e por isso aparece o par. Se na máquina local aparecer uma única linha, não quer dizer que o `StrictMode` está desativado; o que prova o ciclo extra é a primeira figura, não o registro. E isto é o que ele registrou quando o Chrome abriu a versão construída, servida por `npm run preview`:

```text
07:26:22.726 GET /api/estados 200
```

Uma só. Em produção não há ciclo extra. Leia com atenção o que o primeiro registro demonstra: **a limpeza do efeito existe e funciona.** Se `useReporte` não abortasse a requisição na limpeza, a primeira não seria cancelada, as duas respostas chegariam e as duas escreveriam o estado; se não parasse o temporizador, haveria dois intervalos perguntando a cada dez segundos. O painel da lição 9 já tinha essa limpeza, e o `StrictMode` a confirma de graça toda vez que a página é aberta.

A tentação, quando alguém vê duas requisições pela primeira vez, é remover o `StrictMode` «porque duplica as chamadas». É desligar o alarme porque ele toca. A Lição 3 dedica uma seção inteira a por que essa montagem dupla é uma aliada, e às poucas situações em que o necessário não é contorná-la, mas escrever o efeito de outra forma.

### 0.6 O linter do React, ativo desde o primeiro dia

O ESLint lê o código sem executá-lo e procura padrões que sabe que estão errados. Sozinho, ele não conhece o React; o `eslint-plugin-react-hooks` ensina as regras dele. A configuração recomendada, na versão 7.1.1, ativa dezesseis regras: as duas clássicas dos hooks e catorze que vêm do React Compiler. A documentação do React as descreve assim: as duas primeiras cobrem os padrões fundamentais, `rules-of-hooks` (que os hooks sejam chamados da mesma forma em cada render) e `exhaustive-deps` (que a lista de dependências contenha tudo o que o efeito usa), e as demais são diagnósticos do compilador que podem ser usados mesmo que a aplicação ainda não o adote ([React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks)). (Essa página lista dezessete; a diferença é `component-hook-factories`, que a versão 7.1.1 do pacote ainda não inclui na configuração recomendada. Isso foi medido lendo as regras que o pacote instalado ativa.)

A configuração do projeto junta três peças recomendadas — as de JavaScript, as de TypeScript e as do React — e mantém a regra que a lição 9 de TypeScript escreveu contra XSS:

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

`globalIgnores(["dist"])` evita que o ESLint verifique o código construído, que não foi escrito por nós. `files` limita a verificação aos arquivos TypeScript. E `reactHooks.configs.flat.recommended` é a forma indicada pelo próprio pacote para a configuração flat do ESLint.

Agora, o detalhe que decide se o linter serve ou só enfeita. A regra `exhaustive-deps` está configurada como **aviso** (*warning*), não como erro. E o ESLint, com avisos, **termina com sucesso**. É assim que fica se `cadaMs` for removido da lista de dependências de `useReporte` e o ESLint rodar sem mais nada:

```text
$ npx eslint .

~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

$ echo "código de salida: $?"
código de salida: 0
```

Código de saída 0: para qualquer script ou verificação automatizada, isso é «tudo certo». Esse aviso é a cena com que a lição começou: o efeito já não fica sabendo quando o intervalo muda, então a colega pode mudá-lo quanto quiser e o painel vai continuar perguntando a cada dez segundos. Por isso o script do curso é `eslint . --max-warnings 0`: com zero avisos permitidos, a mesma alteração interrompe o comando.

```text
$ npm run lint

> revisor@0.0.0 lint
> eslint . --max-warnings 0


~/curso-react/revisor/src/reporte/useReporte.ts
  41:6  warning  React Hook useEffect has a missing dependency: 'cadaMs'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)

ESLint found too many warnings (maximum: 0).
```

O princípio do curso para esse aviso não muda em nenhuma lição: **corrige-se o código, não se silencia a regra.** Aqui a correção é devolver `cadaMs` à lista, que é a verdade: o efeito o usa. Um comentário `// eslint-disable-next-line` tiraria o aviso e deixaria o defeito exatamente onde estava.

A segunda figura junta, em um componente de doze linhas, os dois erros clássicos dos hooks. Ela não faz parte do `revisor`; é verificada com sua própria configuração, igual à do projeto sem a regra de XSS:

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

Os dois erros dizem a mesma coisa com palavras diferentes: o React identifica cada `useState` e cada `useEffect` de um componente **pela ordem em que são chamados**, não pelo nome. Se em um render `visible` é `false` e o componente sai antes, esse render não chama nenhum hook; se no seguinte é `true`, chama, e o React já não sabe qual estado corresponde a qual. A mensagem até adivinha a causa: «chamou um hook depois de um `return` antecipado?». A correção é mover os hooks para cima do `if` e deixar a condição só para o que é renderizado. O aviso da terceira linha é o mesmo de `useReporte`. As soluções dos exercícios mostram a versão corrigida.

E as regras do compilador não ficam na teoria. Se dentro do efeito de `useReporte` fosse escrito `establecerCarga({ tipo: "cargando" })` logo no início, antes de criar o `AbortController`, o linter responderia assim (a mensagem é longa; é mostrada completa porque se explica sozinha):

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

É a regra `set-state-in-effect`. Repare que o `useReporte` original chama, sim, `establecerCarga` dentro do efeito, mas **depois de um `await`**, quando a resposta chegou de fora: isso é sincronizar-se com um sistema externo, e a regra permite. O que ela rejeita é mudar o estado de forma imediata, no corpo do efeito, porque isso provoca um render extra que nada fora do React pediu. O painel já coloca `cargando` onde deve: em `recargar`, que é executado por um clique. Este é o primeiro contato com o princípio do curso sobre os efeitos; a Lição 3 o desenvolve por inteiro.

O ponto de controle passa limpo. Não é acaso nem mérito do linter: o código da lição 9 de TypeScript já respeitava as regras. O que muda hoje é que, daqui em diante, se alguém as quebrar, `npm run lint` avisa e para.

### 0.7 O servidor de prática e o percurso completo

O último arquivo é o servidor de prática. O curso é de frontend e este servidor não é explicado linha por linha: é um processo Node que responde ao mesmo contrato público da API do curso de TypeScript, `GET /api/estados` e `GET /salud`, com quatro serviços fixos e uma demora de 300 ms para dar tempo de ver «Cargando…». Ele usa os tipos de `src/compartido/contrato.ts`, então, se o contrato mudar, `tsc -b` aponta também o servidor. E escreve uma linha por requisição, que é o que se usou em 0.5 para ver as duas requisições do `StrictMode`.

```ts
// revisor/servidor/practica.ts
// Servidor de práctica del curso de React. Responde el mismo contrato público que
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

O percurso completo usa dois terminais. No primeiro, o servidor de prática:

```text
$ npm run servidor

> revisor@0.0.0 servidor
> node servidor/practica.ts

07:25:45.111 servidor de práctica en http://127.0.0.1:3100
```

De outro terminal, confira antes de misturá-lo com qualquer outra coisa. Se estas três respostas não saírem assim, o problema está no servidor e não no painel:

```text
$ curl -s http://127.0.0.1:3100/salud
ok
$ curl -s http://127.0.0.1:3100/api/estados
{"estados":[{"nombre":"catálogo","tipo":"disponible","codigoHttp":200,"duracionMs":42},{"nombre":"pagos","tipo":"falla","detalle":"HTTP 503"},{"nombre":"inventario","tipo":"disponible","codigoHttp":200,"duracionMs":118},{"nombre":"reportes","tipo":"falla","detalle":"tiempo límite agotado"}]}
$ curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3100/no-existe
404
```

No segundo terminal, o servidor de desenvolvimento:

```text
$ npm run dev

> revisor@0.0.0 dev
> vite


  VITE v8.3.5  ready in 110 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

«Ready in 110 ms»: não empacotou o código, por isso demora tão pouco. A última linha diz que o servidor só escuta na máquina local; com `--host` ele ficaria aberto para a rede, e não é necessário. Abra `http://localhost:5173/` no navegador. Devem aparecer o título «Revisor», um «Cargando…» de um instante e quatro serviços com borda verde ou vermelha. Isto é o que o Chrome *headless* entregou depois de executar o JavaScript da página (mostra-se só o contêiner):

```text
<div id="raiz"><main><h1>Revisor</h1><ul><li class="disponible"><strong>catálogo</strong>: disponible (HTTP 200, 42 ms)</li><li class="falla"><strong>pagos</strong>: falla (HTTP 503)</li><li class="disponible"><strong>inventario</strong>: disponible (HTTP 200, 118 ms)</li><li class="falla"><strong>reportes</strong>: falla (tiempo límite agotado)</li></ul><button type="button">Actualizar</button></main></div>
```

Com a página aberta, faça o teste que justifica o servidor de desenvolvimento: em `Panel.tsx`, troque o texto `Revisor` do `<h1>` por `Revisor de servicios` e salve. A página muda sozinha, sem recarregar, e a lista continua ali: não passou de novo por «Cargando…». É o *Fast Refresh* de 0.1.2. (Isso se comprova com os olhos, em uma janela de navegador aberta; nenhuma ferramenta automatizada do curso mede isso, e as execuções desta lição, feitas com o Chrome *headless*, também não: o que se afirma aqui é o que o plugin do React documenta. Volte o texto ao original ao terminar.)

Para terminar, construa e veja a versão que seria publicada. Com o servidor de prática ainda rodando:

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

`http://localhost:4173/` mostra o mesmo painel, agora a partir dos arquivos de `dist/` e sem `StrictMode` ativo, que é o que o registro de 0.5 confirmou. Encerre tudo com Ctrl+C em cada terminal; o servidor de prática se despede com `servidor de práctica detenido`.

Uma última verificação, a que qualquer verificação automatizada faz: apagar `node_modules/`, reinstalar exatamente o que está no arquivo de lock com `npm ci` e repetir. No contêiner Linux de «Sobre as execuções», a partir de uma cópia sem `node_modules/` nem `dist/`, `npm ci`, `npm run lint` e `npm run build` terminaram bem, e o build produziu os mesmos três arquivos com os mesmos nomes (`index-tGGc24Rg.css` e `index-BWNt33lQ.js`). Que o nome coincida não é um detalhe: os nomes de `dist/` saem do conteúdo, então duas máquinas que produzem os mesmos nomes produziram o mesmo pacote.

## O erro que vai aparecer

A lição tem um erro principal, o que nasce do fato de o Vite não verificar tipos, e dois de apoio.

**O erro principal: «na minha máquina o build passa».** Em `Panel.tsx`, mude o tipo da propriedade `cadaMs` de `number` para `string` e construa das duas maneiras:

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

`vite build` termina com seu check verde: apagou os tipos e empacotou. `npm run build` para em `tsc -b` com três erros, e `vite build` nem sequer começa. Lê-se como qualquer erro de TypeScript: arquivo, linha e coluna entre parênteses, código do erro e o que não se encaixa com o quê. Os três erros são o mesmo desacordo visto de três lugares: `main.tsx` passa um número onde agora se espera texto, o valor padrão `10_000` é um número, e `useReporte` recebe texto onde espera um número. A correção é devolver o tipo; a lição é outra: **o check do Vite diz «empacotei», não «está certo».** Em desenvolvimento acontece o mesmo, com mais perigo: `npm run dev` serve o arquivo com o erro e o painel pode até funcionar, porque em tempo de execução um número que o tipo chama de «texto» continua sendo um número. Confira o editor e, antes de entregar, rode `npm run build`.

**Um erro de digitação em uma variável.** Escreva `VITE_CADA_MZ` em vez de `VITE_CADA_MS` em `configuracion.ts`:

```text
$ npx tsc -b
src/configuracion.ts(11,50): error TS2551: Property 'VITE_CADA_MZ' does not exist on type 'ImportMetaEnv'. Did you mean 'VITE_CADA_MS'?
```

É o trabalho de `strictImportMetaEnv` (0.4). Sem essa linha em `vite-env.d.ts`, o nome errado compilaria, valeria `undefined` no navegador, `leerCadaMs` usaria o valor padrão e ninguém saberia por que a variável «não funciona».

**O aviso que não interrompe nada.** É o de 0.6: `exhaustive-deps` é um aviso, o ESLint termina com código 0 e uma verificação que só olhe o código de saída diz «limpo». O sinal para reconhecê-lo é a linha `✖ 1 problem (0 errors, 1 warning)` seguida de nada. Com `--max-warnings 0`, aparece também `ESLint found too many warnings (maximum: 0).` e o comando falha.

## O que se faz errado

**Rodar só `vite build` ou só `npm run dev`.** Nenhum dos dois verifica tipos. Um fluxo que não passa por `tsc -b` pode entregar um pacote com erros de tipo; por isso o script `build` começa com ele.

**Colocar um segredo em uma variável `VITE_`.** Tudo o que começa com `VITE_` fica escrito no JavaScript público, como se viu com `grep`. Mudar o nome da variável para que não tenha o prefixo não a torna segura: se o navegador precisa dela, o navegador a tem. As chaves ficam em um servidor.

**Abrir CORS com `*` na API para funcionar em desenvolvimento.** Resolve um incômodo da máquina local com uma decisão de segurança que afeta todo mundo. Em desenvolvimento, o *proxy* do Vite elimina o problema sem mexer na API.

**Remover o `StrictMode` porque «faz duas requisições».** A segunda requisição é a prova de que a limpeza do efeito funciona, e em produção ela não existe. Removê-lo esconde justamente os erros que ele veio mostrar.

**Silenciar o linter.** Um `// eslint-disable-next-line react-hooks/exhaustive-deps` deixa o efeito com uma lista de dependências que mente, e o defeito continua ali com o aviso desligado. Se a regra reclama, mude o código.

**Deixar os avisos passarem.** Sem `--max-warnings 0`, um aviso de dependências não interrompe nada e, com o tempo, ninguém lê a saída do linter porque «sempre tem alguma coisa».

**Versionar `node_modules/` ou `dist/`.** Eles são reconstruídos idênticos com `npm ci` e `npm run build`. O que vai, sim, para o repositório é o `package-lock.json`, que é o que permite reconstruí-los.

**Dependências sem versão exata.** Com `^` no `package.json`, duas pessoas que instalam com dias de diferença podem ter versões diferentes. O arquivo de lock ajuda, mas só se for versionado e a instalação for feita com `npm ci`.

**Deixar o Vite trocar de porta em silêncio.** Sem `strictPort`, um servidor esquecido em 5173 faz o novo iniciar em 5174, e acaba-se olhando a versão antiga. Com `strictPort: true`, o segundo se recusa a iniciar.

## Exercícios

### Exercício 1 — Mudar o intervalo sem mexer no código

Faça o painel se atualizar a cada 3 segundos sem editar nenhum arquivo de `src/`. **Antes de fazer, preveja** quantas linhas `GET /api/estados 200` o servidor de prática escreve nos 10 segundos seguintes à abertura da página com `npm run dev`. Teste com dois mecanismos diferentes: definindo a variável no terminal e criando um arquivo `.env.local`. Qual dos dois vence se os dois existirem? Por que `.env.local` não deve ir para o repositório, e qual linha do `.gitignore` impede isso?

### Exercício 2 — Corrigir a figura 2

Corrija `fig00_02.tsx` para que `npx eslint fig00_02.tsx` não informe nada e o componente continue sem renderizar nada quando `visible` é `false`. Antes de escrever, explique no diário de bordo por que mover o `if` para baixo dos hooks não muda o que a pessoa vê.

### Exercício 3 — O *proxy* que falta

Acrescente ao `vite.config.ts` o necessário para que `curl http://localhost:5173/salud` responda `ok`. **Antes**, preveja o que essa mesma requisição responde hoje e por que não é um 404 da API. Confira a previsão antes de mudar qualquer coisa.

### Exercício 4 — A limpeza que falta

Em `useReporte`, apague temporariamente a linha `control.abort();` da limpeza do efeito. Com o servidor de prática e `npm run dev` rodando, abra a página e leia o registro do servidor. O que mudou em relação a 0.5? O que isso diz sobre o que o `StrictMode` estava verificando? O linter avisa? Restaure a linha ao terminar.

## Soluções

### Solução 1

No terminal, a variável vai antes do comando e vale só para aquele processo:

```bash
VITE_CADA_MS=3000 npm run dev
```

Com `.env.local`, o arquivo leva uma linha, `VITE_CADA_MS=3000`, e o Vite o lê ao iniciar (se o servidor já estava rodando, reinicie-o). A previsão: em 10 segundos, a requisição da montagem mais uma a cada 3 segundos, ou seja, quatro respostas `200`, **mais**, se a conexão chegar ao servidor antes do abort (0.5), uma linha `cancelada por el cliente` no início, que é o ciclo extra do `StrictMode`. Foi isso o que se mediu com o Chrome *headless* durante 10 segundos do seu relógio interno: uma cancelada e quatro `200`. Se as duas fontes existirem, vence o terminal: a documentação do Vite diz que as variáveis que já existem quando o Vite inicia não são sobrescritas pelos arquivos `.env`. O `.env.local` existe justamente para valores da máquina local, e a linha `*.local` do `.gitignore` impede que ele seja versionado. Ao terminar, apague o arquivo para que o projeto volte a coincidir com o ponto de controle.

### Solução 2

Os hooks vêm primeiro e a condição só decide o que é renderizado; a lista de dependências nomeia o que o efeito usa:

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

O que a pessoa vê não muda, porque o `return null` continua acontecendo antes de renderizar o parágrafo. O que muda é que os dois hooks são chamados em todos os renders, na mesma ordem, e o React consegue associá-los ao seu estado. Repare em uma consequência que vale discutir no diário de bordo: com `visible` em `false`, o temporizador continua contando, embora nada apareça. Se não é isso o que se quer, a solução não é colocar o `if` de volta em cima, e sim que quem usa `Resumen` não o renderize: `{visible && <Resumen cadaMs={5000} />}` (cuidado com essa forma quando a condição for um número: é a armadilha do `0` da [Lição 1](01-componentes-puros-composicion.md)).

### Solução 3

Hoje, `curl http://localhost:5173/salud` não chega à API: o caminho não começa com `/api`, então quem o atende é o Vite. Para um servidor de desenvolvimento de uma aplicação de página única, uma rota desconhecida não é um erro: ele responde com `index.html`, para que o roteador do cliente decida (a Lição 5 volta a isso). A resposta vai ser o HTML da página, com código 200, não `ok`. Confira antes de mudar qualquer coisa; é um bom costume não confiar na previsão. Para repassá-la, acrescente outra chave:

```ts
// vite.config.ts (fragmento)
proxy: {
  "/api": "http://127.0.0.1:3100",
  "/salud": "http://127.0.0.1:3100",
},
```

Reinicie o `npm run dev` para que ele carregue a configuração nova, e a resposta vai ser `ok`. Este exercício é o motivo da recomendação de 0.3: se todas as rotas da API ficassem sob `/api`, uma única chave bastaria.

### Solução 4

Sem `control.abort()`, o registro deixa de mostrar a linha `cancelada por el cliente`: agora aparecem **dois** `GET /api/estados 200` ao abrir a página. A primeira requisição, a da montagem que o `StrictMode` desfez, já não é cancelada por ninguém; a resposta dela chega e escreve o estado de um efeito que já tinha sido limpo. Neste painel isso não se nota a olho nu, porque as duas respostas são iguais, mas se a primeira fosse mais lenta e trouxesse dados antigos, sobrescreveria a segunda: é a condição de corrida (*race condition*) entre respostas que a Lição 3 reproduz e corrige. O `StrictMode` estava verificando exatamente isso, que a limpeza desfaz o que o efeito começou. E o linter? Não diz nada: a limpeza que falta não quebra nenhuma regra visível no texto do código. Por isso o `StrictMode` e o linter são duas defesas diferentes, e o curso usa as duas.

## Como saber se deu certo

- [ ] `node -v` imprime uma versão que começa com `v24`, e `npx tsc --version`, dentro de `~/curso-react/revisor/`, imprime `Version 7.0.2`.
- [ ] Com o servidor de prática rodando, `curl -s http://127.0.0.1:3100/salud` responde `ok`, e `curl -s http://localhost:5173/api/estados` (com `npm run dev` rodando) responde o JSON dos quatro serviços.
- [ ] Abrir `http://localhost:5173/` mostra o título «Revisor» e quatro serviços, e o registro do servidor de prática registra um `200` ao abrir a página. Se além disso aparecer antes uma `cancelada por el cliente`, dá para interpretá-la como o ciclo extra do `StrictMode`; se não aparecer, dá para explicar por que isso não significa que ele esteja desativado (0.5).
- [ ] Com a versão construída (`npm run preview`, em `http://localhost:4173/`), a mesma página produz uma única requisição no registro.
- [ ] `npm run lint` termina sem escrever nenhum problema, e ao remover `cadaMs` da lista de dependências de `useReporte` falha com `ESLint found too many warnings (maximum: 0).`
- [ ] `npm run build` termina com `✓ built` e deixa em `dist/` um `index.html`, um `.css` e um `.js`; ao mudar um tipo de propósito, para em `tsc -b` e `vite build` nem chega a ser executado.
- [ ] Dá para mostrar com `grep` sobre `dist/` que o valor de `VITE_CADA_MS` viaja dentro do JavaScript, e explicar por que isso descarta colocar ali um segredo.
- [ ] `git status` dentro do projeto não mostra `node_modules/` nem `dist/` como arquivos a acrescentar.
- [ ] No [diário de bordo](bitacora.md) ficaram anotadas as versões, o que mudou em relação ao empacotamento com esbuild e o primeiro aviso dado pelo linter.

## Resumo

Responda sem olhar a lição:

1. Quais são os dois trabalhos diferentes que o Vite faz e qual dos dois empacota? Por que o servidor de desenvolvimento não precisa empacotar?
2. Por que o script `build` começa com `tsc -b`? O que acontece ao rodar só `vite build` com um erro de tipos?
3. O que `tsconfig.app.json` verifica e o que `tsconfig.node.json` verifica? Por que um tem `DOM` e o outro não?
4. Por que, com `"moduleResolution": "bundler"`, já não se escreve `.js` no final dos `import`?
5. O que é uma origem? Por que o painel na porta 5173 não consegue ler uma resposta da porta 3100, e como o *proxy* resolve isso sem mexer na API?
6. Quais variáveis chegam a `import.meta.env`, quando seu valor é substituído e por que nenhum segredo vai ali?
7. O que o `StrictMode` faz com os efeitos em desenvolvimento, e o que demonstra a linha `cancelada por el cliente` no registro?
8. O que `rules-of-hooks` e `exhaustive-deps` verificam? Por que o curso roda o ESLint com `--max-warnings 0`?

## Leituras complementares

- [Vite, «Getting Started»](https://vite.dev/guide/): como criar um projeto, a lista de templates, a versão do Node exigida e por que `index.html` é a entrada. Consultado em 21 de outubro de 2026.
- [Vite, «Why Vite»](https://vite.dev/guide/why): os problemas que o servidor de desenvolvimento resolve e por que se empacota para produção; Rolldown e Oxc. Consultado em 21 de outubro de 2026.
- [Vite, «Announcing Vite 8»](https://vite.dev/blog/announcing-vite8): o Rolldown como único empacotador, desde 12 de março de 2026. Consultado em 21 de outubro de 2026.
- [Vite, «Dependency Pre-Bundling»](https://vite.dev/guide/dep-pre-bundling): por que o Vite pré-empacota as dependências em desenvolvimento, e que faz isso com o Rolldown. Consultado em 21 de outubro de 2026.
- [Vite, «Features»](https://vite.dev/guide/features): TypeScript sem verificação de tipos, `isolatedModules`, os tipos de `vite/client` e a importação de CSS. Consultado em 21 de outubro de 2026.
- [Vite, «Env Variables and Modes»](https://vite.dev/guide/env-and-mode): o prefixo `VITE_`, a ordem dos arquivos `.env`, a advertência sobre informação sensível e os tipos com `strictImportMetaEnv`. Consultado em 21 de outubro de 2026.
- [Vite, «Server Options»](https://vite.dev/config/server-options) e [«Preview Options»](https://vite.dev/config/preview-options): `server.proxy`, `server.port`, `strictPort` e o *proxy* herdado por `vite preview`. Consultado em 21 de outubro de 2026.
- [Vite, «Deploying a Static Site»](https://vite.dev/guide/static-deploy): por que `vite preview` não é um servidor de produção. Consultado em 21 de outubro de 2026.
- [vite-plugin-react, `@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react): *Fast Refresh*, o *runtime* automático de JSX e a opção do compilador. Consultado em 21 de outubro de 2026.
- [React, «StrictMode»](https://react.dev/reference/react/StrictMode): as verificações de desenvolvimento, o ciclo extra dos efeitos e por que elas não afetam o build. Consultado em 21 de outubro de 2026.
- [React, «eslint-plugin-react-hooks»](https://react.dev/reference/eslint-plugin-react-hooks): a configuração recomendada, as regras dos hooks e as do compilador. Consultado em 21 de outubro de 2026.
- [React, «Build a React app from Scratch»](https://react.dev/learn/build-a-react-app-from-scratch) e [«Sunsetting Create React App»](https://react.dev/blog/2025/02/14/sunsetting-create-react-app): quando convém uma ferramenta como o Vite, e a descontinuação do Create React App. Consultado em 21 de outubro de 2026.
- [MDN, «Cross-Origin Resource Sharing (CORS)»](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS): a política de mesma origem para `fetch()` e o cabeçalho `Access-Control-Allow-Origin`. Consultado em 21 de outubro de 2026.
- [TypeScript, «TSConfig Reference»](https://www.typescriptlang.org/tsconfig/): `moduleResolution`, `noEmit`, `verbatimModuleSyntax`, `isolatedModules`, `erasableSyntaxOnly` e as referências de projeto. Consultado em 21 de outubro de 2026.
- [typescript-eslint, «Dependency Versions»](https://typescript-eslint.io/users/dependency-versions/): as versões de TypeScript e ESLint que ele suporta. Consultado em 21 de outubro de 2026.
- [Node.js, «Modules: TypeScript»](https://nodejs.org/api/typescript.html) e [«Previous Releases»](https://nodejs.org/en/about/previous-releases): executar `.ts` diretamente com o Node e suas condições; a linha 24 LTS e sua versão mais recente. Consultado em 21 de outubro de 2026.

### Termos desta lição

| Termo | O que significa |
|---|---|
| servidor de desenvolvimento | o processo iniciado por `npm run dev`: serve cada módulo separadamente, traduzido na hora, e avisa o navegador quando um arquivo muda |
| HMR / *Fast Refresh* | substituir na página só o módulo que mudou, sem recarregar; no React preserva o estado dos componentes que não mudaram |
| build | o que `npm run build` faz: verificar tipos e empacotar em `dist/` os arquivos que são publicados |
| referências de projeto | vários `tsconfig` pequenos que `tsc -b` verifica separadamente, cada um com suas regras |
| origem | a combinação de esquema, host e porta de um endereço; duas portas diferentes são duas origens |
| política de mesma origem | a regra do navegador que impede um script de ler respostas de outra origem, a menos que a resposta permita isso com CORS |
| *proxy* (de desenvolvimento) | o repasse que o Vite faz de certos caminhos para outro servidor, para que o navegador veja uma única origem |
| variável `VITE_` | configuração que o Vite escreve dentro do código do cliente; pública por definição |
| `StrictMode` | componente do React que, só em desenvolvimento, renderiza duas vezes e executa um ciclo extra de cada efeito para revelar erros |
| `--max-warnings 0` | opção do ESLint que faz o comando falhar se houver pelo menos um aviso |

---

**Próxima:** [Lição 1 — Componentes puros e composição](01-componentes-puros-composicion.md)
