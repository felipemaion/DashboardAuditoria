# AGENTS.md

## Objetivo do Projeto

Este repositório tem como objetivo conectar-se a um servidor MySQL para consolidar dados operacionais, expor relatórios confiáveis e entregar dashboards executivos para perfis como gerentes e CEO.

Os agentes que atuarem neste projeto devem preservar foco em:

- seguranca de dados e credenciais
- rastreabilidade e previsibilidade de mudancas
- qualidade profissional de codigo e testes
- separacao clara entre backend, frontend e ativos SQL
- manutencao simples e escalavel

## Stack Padrao do Projeto

### Backend

- Linguagem: Python 3.12+
- API: FastAPI
- Validacao e configuracao: Pydantic v2
- ORM e acesso a dados: SQLAlchemy 2.x
- Migracoes: Alembic
- Driver MySQL: `mysqlclient` ou `pymysql`, conforme compatibilidade do ambiente
- Testes: Pytest
- Lint e formatacao: Ruff
- Tipagem estatica: MyPy
- Seguranca estatica: Bandit

### Frontend

- Linguagem: TypeScript
- Framework: React
- Build tool: Vite
- Estado assinado ao servidor: TanStack Query
- Graficos e visualizacao: D3.js ou bibliotecas compatveis baseadas em D3 quando fizer sentido
- Testes unitarios e de componentes: Vitest + Testing Library
- Testes end-to-end: Playwright
- Lint: ESLint
- Formatacao: Prettier

## Principios Arquiteturais

- O frontend nunca deve acessar o MySQL diretamente.
- Todo acesso ao banco deve passar pelo backend.
- Queries SQL devem ser parametrizadas; concatenacao de string para montar SQL e proibida.
- Credenciais e segredos devem existir apenas em `.env` local e jamais ser commitados.
- Dashboards para lideranca devem ser otimizados para leitura rapida, confiabilidade e contexto de negocio.
- Views SQL legadas devem ser preservadas, versionadas e documentadas antes de refatoracoes.
- Funcoes, modulos e variaveis devem ter nomes claros, especificos e consistentes.
- Cada modulo deve ter responsabilidade unica e baixo acoplamento.
- O codigo deve ser limpo, refatorado e organizado em arquivos coerentes com a responsabilidade do dominio.
- Componentes, servicos e utilitarios nao devem crescer sem controle; quando um arquivo ficar complexo, o agente deve fatorar e extrair partes reutilizaveis.

## Principios de Codigo Limpo e Refatoracao

- Aplicar DRY com criterio: evitar duplicacao real sem criar abstracoes artificiais.
- Aplicar KISS: preferir solucoes simples, legiveis e de manutencao previsivel.
- Aplicar YAGNI: nao introduzir camadas, dependencias ou generificacoes sem necessidade concreta.
- Aplicar SOLID quando fizer sentido para a stack e o contexto do modulo.
- Priorizar alta coesao e baixo acoplamento entre arquivos, modulos e camadas.
- Separar regra de negocio, acesso a dados, apresentacao e utilitarios.
- Extrair funcoes puras e testaveis sempre que isso reduzir complexidade.
- Evitar componentes monoliticos, funcoes longas e condicionais excessivas.
- Remover codigo morto, duplicado ou intermediarios sem valor.
- Refatorar nomes ruins, estruturas confusas e repeticoes assim que forem identificadas durante a tarefa.
- Toda refatoracao deve manter comportamento coberto por testes antes, durante e depois da mudanca.

## Estrutura de Pastas

```text
.
|-- AGENTS.md
|-- .env.example
|-- .gitignore
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- db/
|   |   |-- models/
|   |   |-- repositories/
|   |   |-- schemas/
|   |   |-- services/
|   |   `-- main.py
|   `-- tests/
|       |-- integration/
|       |-- unit/
|       `-- conftest.py
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- app/
|   |   |-- components/
|   |   |-- features/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- types/
|   |   `-- main.tsx
|   `-- tests/
|       |-- e2e/
|       |-- integration/
|       `-- unit/
|-- database/
|   |-- views/
|   |   `-- mysql/
|   `-- migrations/
`-- docs/
    |-- architecture/
    |-- decisions/
    `-- assets/
```

## Estado Atual dos SQL Legados

Os arquivos SQL existentes foram organizados em `database/views/mysql/` com nomes padronizados em `snake_case`:

- `atividades_completas.sql`
- `atividades_de_auditoria.sql`
- `auditorias_planejadas.sql`
- `auditorias_realizadas.sql`
- `nao_conformidade.sql`
- `ocorrencias_com_e_sem_atividade.sql`
- `ocorrencias_com_indicador.sql`
- `ocorrencias_ff.sql`

Esses arquivos devem ser tratados como ativos de negocio e base de entendimento do dominio. Antes de alterar qualquer query legada:

- entender sua finalidade analitica
- identificar colunas criticas para os dashboards
- registrar impacto esperado
- criar testes cobrindo regressao funcional

## Regras Obrigatorias Para Todos os Agentes

### 1. TDD e obrigatorio

Sempre escrever os testes antes da implementacao. O fluxo padrao e:

1. criar ou ajustar o teste que descreve o comportamento esperado
2. executar o teste e observar falha legitima
3. implementar a menor mudanca necessaria para passar
4. refatorar mantendo os testes verdes

### 2. Nao programar sem criterio de aceite

Antes de iniciar qualquer feature, bugfix ou refatoracao, o agente deve deixar claro:

- problema a resolver
- comportamento esperado
- testes que vao provar a entrega
- riscos de seguranca, performance e regressao

### 3. Qualidade minima obrigatoria

Todo codigo deve:

- ser legivel e autocontido
- evitar duplicacao desnecessaria
- seguir principios de codigo limpo e responsabilidade unica
- possuir tratamento de erros apropriado
- usar tipagem quando a stack suportar
- preferir funcoes curtas e coesas
- evitar nomes genericos como `data`, `result`, `tmp`, `handler2`
- ser bem fatorado em arquivos, sem concentrar logica demais em um unico modulo
- ser refatorado quando a implementacao ficar improvisada, repetitiva ou dificil de manter

### 4. Seguranca e prioridade maxima

- Nunca commitar `.env`, credenciais, dumps sensiveis ou tokens.
- Nunca expor stack traces ou mensagens internas para o frontend em producao.
- Validar toda entrada externa no backend.
- Sanitizar filtros e parametros de relatorios.
- Implementar controle de acesso por perfil quando a aplicacao evoluir para autenticacao.
- Minimizar dados sensiveis enviados ao frontend.
- Auditar dependencias e manter bibliotecas atualizadas.

## Convencoes de Desenvolvimento

### Backend

- Organizar regras de negocio em `services/`.
- Centralizar acesso a dados em `repositories/`.
- Concentrar configuracoes e seguranca em `core/`.
- Definir conexao com banco em `db/`.
- Separar modelos ORM de schemas de API.
- Utilizar variaveis de ambiente carregadas via configuracao tipada.

### Frontend

- Separar telas por dominio em `features/` e `pages/`.
- Componentes reutilizaveis devem ser pequenos, acessiveis e previsiveis.
- Toda chamada HTTP deve ficar em `services/`.
- Graficos devem ter fallback textual, legenda clara e estados de carregamento/erro.
- Interfaces para diretoria devem priorizar simplicidade, contraste e narrativa visual.
- Componentes grandes devem ser quebrados em subcomponentes, hooks ou utilitarios quando a leitura ficar comprometida.
- Estado derivado, transformacoes e regras de exibicao devem ser extraidos quando ajudarem testabilidade e manutencao.

## Regras Especificas de Refatoracao

- Se uma mudanca exigir repeticao de logica existente, o agente deve pausar e avaliar extracao.
- Se um arquivo ficar grande demais ou misturar muitas responsabilidades, o agente deve refatorar a estrutura.
- Refatoracoes devem preservar interfaces publicas quando possivel, minimizando regressao.
- Refatoracao sem testes e proibida; primeiro cobrir o comportamento atual, depois reorganizar.
- Sempre que possivel, preferir pequenas refatoracoes incrementais a grandes reescritas.

### SQL

- Nomear arquivos em `snake_case`.
- Manter historico legivel e sem sobrescrever a intencao original sem documentacao.
- Adicionar comentarios quando a regra de negocio da query nao for obvia.
- Quando uma view virar dependencia do produto, documentar origem, joins criticos e filtros.

## Variaveis de Ambiente

As credenciais do MySQL devem ficar em `.env`. O repositorio deve manter apenas `.env.example`.

Padrao esperado:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_SSL_MODE`
- `API_ENV`
- `API_DEBUG`
- `API_CORS_ORIGINS`

## Lint, Testes e Gate de Commit

Nenhum commit deve ser realizado sem executar com sucesso:

### Backend

- `ruff check backend`
- `ruff format --check backend`
- `mypy backend/app`
- `pytest backend/tests`
- `bandit -r backend/app`

### Frontend

- `npm run lint --prefix frontend`
- `npm run test --prefix frontend`
- `npm run build --prefix frontend`

Quando existirem testes end-to-end relevantes para a mudanca:

- `npm run test:e2e --prefix frontend`

## Convencoes de Git

- Trabalhar em branches curtas e objetivas.
- Commits devem ser pequenos, coerentes e revisaveis.
- Nao misturar refatoracao estrutural com feature de negocio sem necessidade.
- Antes de abrir PR, atualizar documentacao e validar testes.

## O Que Fazer Ao Iniciar Uma Nova Tarefa

1. ler este `AGENTS.md`
2. localizar o dominio impactado
3. definir os testes antes da implementacao
4. avaliar riscos de seguranca
5. implementar a mudanca minima necessaria
6. rodar lint, testes e validacoes
7. atualizar documentacao se houver impacto arquitetural, operacional ou analitico

## Decisoes Iniciais Deste Repositorio

- Backend padrao em Python com FastAPI.
- Frontend padrao em React + TypeScript + Vite.
- Visualizacao analitica com D3.js quando houver necessidade de graficos customizados.
- SQL legado armazenado em `database/views/mysql/`.
- Credenciais mantidas em `.env` local.
- TDD obrigatorio para qualquer nova entrega.
- Seguranca, lint e testes sao condicoes de aceite basicas.

## Observacao Importante

Se surgirem decisoes de produto, seguranca, modelagem ou infraestrutura que alterem significativamente a arquitetura, o agente deve pausar e alinhar com o responsavel antes de seguir.
