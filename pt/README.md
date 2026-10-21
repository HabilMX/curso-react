# Curso de React — de um painel monolítico a uma aplicação que se sustenta

**Por Dorian Chávez, fundador da Hábil e arquiteto de integração.**

**Para quem é:** quem já fez o curso de TypeScript da Hábil e quer entender a fundo o que a lição 9 daquele curso apenas deixou funcionando, e quem programa em JavaScript ou TypeScript, já copiou componentes que funcionam e quer saber por que funcionam e por que, de repente, deixam de funcionar. Não se pressupõe experiência com React além de ter visto um componente: cada conceito é explicado quando aparece, e explica-se por que existe, não só como se escreve.

**O que a gente vai saber ao terminar:** construir uma aplicação React de várias telas, decidir onde vive cada pedaço de estado, buscar dados sem condições de corrida nem telas em branco, testá-la com testes que de fato detectam os erros, medi-la antes de otimizá-la e publicá-la. E ganhar autonomia para ler a documentação do React por conta própria.

**Onde se situa:** este curso é o degrau seguinte ao [curso de TypeScript](https://github.com/HabilMX/curso-typescript) da Hábil. A lição 9 de lá já montou um painel com componentes, `useState` e `useEffect`; aqui isso não se repete: aprofunda-se. Se nunca escreveu uma página, comece antes pelo curso de Fundamentos da web.

**O que é preciso antes de começar:** um computador com Linux Mint, saber abrir um terminal, ler tipos de TypeScript (uniões, genéricos simples) e ter visto, nem que seja uma vez, um componente React. A [Lição 0](00-un-proyecto-de-verdad.md) instala tudo o que falta, com Node 24 LTS.

## O projeto que a gente vai construir

O **`revisor`**: a tela que mostra o estado de uma lista de serviços (nome, estado e tempo de resposta). Começa como o painel monolítico da lição 9 de TypeScript e termina como uma aplicação de várias telas: um relatório com filtros guardados na URL, o detalhe de cada serviço, dados em cache que são atualizados em segundo plano, um formulário para cadastrar serviços, avisos, uma suíte de testes e uma versão publicada.

É o mesmo problema dos cursos de Go, Rust, TypeScript e Fundamentos da web da Hábil. O que muda é o nível de exigência: não “que funcione”, mas “que se sustente quando crescer”. O curso inclui um servidor de prática com o contrato da API, então não é preciso ter terminado o curso de TypeScript para acompanhar este.

## As dez lições

| Lição | | O que se constrói | O que se aprende |
|---|---|---|---|
| 0 | [Um projeto de verdade: Vite, StrictMode e o linter](00-un-proyecto-de-verdad.md) | o painel da lição 9 de TypeScript, movido para o Vite | o que o Vite adiciona; `react-ts`, estrutura por funcionalidade, proxy para a API, variáveis `VITE_`, linter do React ativo |
| 1 | [Componentes puros e composição](01-componentes-puros-composicion.md) | o painel dividido em peças | render e *commit*; pureza; `children`; `key` estável; a armadilha do `0`; nunca um componente dentro de outro |
| 2 | [Estado: instantâneo, imutabilidade e forma](02-estado-instantanea-forma.md) | filtro “só falhas”, nota por serviço, seleção | o estado como fotografia; forma atualizadora; copiar, não mutar; cinco regras de forma; elevar o estado; `key` para reiniciar |
| 3 | [Effects: sincronizar, não “quando carregar”](03-effects-sincronizar.md) | consulta a cada 10 s e detalhe que reinicia | começar e parar de sincronizar; limpeza; condição de corrida entre respostas; StrictMode; dependências honestas; `useEffectEvent` |
| 4 | [Estado do servidor com TanStack Query](04-estado-del-servidor.md) | o relatório com cache e botão “tentar novamente” | `useQuery`, `queryKey`, `signal`; `status` e `fetchStatus`; `refetchInterval`; `useMutation`; o estado vazio; Error Boundary |
| 5 | [Rotas e a URL como estado](05-rutas-url-como-estado.md) | lista, detalhe, 404 e filtros na URL | `createBrowserRouter`, `<Outlet />`, `useSearchParams`, `NavLink`; recarregar uma rota do cliente |
| 6 | [Estado compartilhado: reducer e contexto](06-reducer-contexto.md) | bandeja de avisos e preferências | `useReducer` e reducer puro; contexto com duas partes; hook que exige provedor; que estado vive onde |
| 7 | [Formulários, ações e acessibilidade](07-formularios-accesibilidad.md) | o cadastro de um serviço | `<form action>`, `useActionState`, `useFormStatus`, `useOptimistic`; validação; `aria-invalid`; regiões ARIA live; teclado |
| 8 | [Testes de componentes](08-pruebas-de-componentes.md) | a suíte do painel | Vitest e Testing Library; consultas por papel; `findBy`; `user-event`; o teste que fica vermelho ao reverter |
| 9 | [Desempenho, publicação e quando usar um framework](09-rendimiento-publicacion.md) | o `revisor` medido e publicado | Profiler; React Compiler 1.0; `vite build`; regra de reescrita (rewrite) para `index.html`; Server Components e quando migrar |

No final de cada lição há exercícios com as respectivas soluções. E o [diário de bordo](bitacora.md) é para uso próprio: anote ali o que foi difícil.

## Três princípios que atravessam todo o curso

**Um Effect serve para sincronizar com algo que está fora do React.** Não é para calcular um valor, não é para reagir a um clique e não é para “quando carregar”. A lista de dependências descreve o código; se o linter reclamar, muda-se o código, nunca se silencia a regra. É o erro que mais custa no React e a lição 3 inteira trata dele, mas ele aparece desde a 2.

**Primeiro se mede, depois se otimiza.** `useMemo`, `useCallback` e `memo` são ferramentas com custo, não um costume. O curso as apresenta quando há uma medição que as pede, e ensina antes a estrutura (estado local, `children`) que evita a maioria das re-renderizações desnecessárias.

**A acessibilidade e a segurança não são lições, são costumes.** As consultas por papel da 8 levam a escrever HTML acessível, a 7 traz o teclado e as regiões ARIA live, e a 9 revisa o XSS e o que nunca deve ir em uma variável `VITE_`.

## Como saber que terminou

O curso não termina ao ler a lição 9, mas quando o `revisor` cumpre estas cinco coisas. São as mesmas que a verificação confere a cada alteração:

1. **`npm run lint` não reporta nada**, e não há um único `eslint-disable` das regras do React.
2. **`npm test` passa**, e cada teste que protege uma correção ficou vermelho ao revertê-la.
3. **Existem os quatro estados** (carregando, erro, vazio e com dados), mais o de “dados antigos enquanto atualiza”, e cada um tem o próprio teste.
4. **Percorre-se por completo com o teclado**, e os avisos de mudança chegam a um leitor de tela.
5. **`npm run build` termina sem erros**, a pré-visualização recarrega `/servicios/pagos` sem dar 404 quando servida com regra de reescrita, e em `dist/` não aparece nenhuma chave nem segredo.
