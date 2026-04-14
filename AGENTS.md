# AGENTS.md

## Objetivo

Este repositorio existe para:

- conectar com um servidor MySQL
- consolidar dados operacionais em relatorios confiaveis
- expor esses relatorios por API
- entregar dashboards executivos para gerencia e diretoria
- manter rastreabilidade tecnica e semantica dos dados exibidos

Este documento define as regras obrigatorias para qualquer agente que atue no projeto.

## Estado Atual do Projeto

O projeto ja possui uma base funcional e os agentes devem trabalhar considerando a arquitetura e as decisoes ja estabelecidas:

- backend em Python com FastAPI
- frontend em React + TypeScript + Vite
- visualizacao com D3.js
- catalogo de relatorios com status `available`, `blocked_by_permissions` e `query_error`
- SQL legado organizado em `database/views/mysql/`
- semantica de campos e graficos no frontend
- traducoes PT-BR e EN-US no frontend
- testes de regressao no frontend para semantica, graficos e fluxo principal

Relatorios SQL atualmente organizados:

- `atividades_completas.sql`
- `atividades_de_auditoria.sql`
- `auditorias_planejadas.sql`
- `auditorias_realizadas.sql`
- `nao_conformidade.sql`
- `ocorrencias_com_e_sem_atividade.sql`
- `ocorrencias_com_indicador.sql`
- `ocorrencias_ff.sql`

Documentacao analitica atual:

- `docs/data_dictionary_reports.md`

## Stack Oficial

### Backend

- Python 3.10+
- FastAPI
- SQLAlchemy 2.x
- Pydantic v2
- Pydantic Settings
- PyMySQL
- Pytest
- Ruff
- MyPy
- Bandit

### Frontend

- TypeScript
- React 18
- Vite
- TanStack Query
- D3.js
- Vitest
- Testing Library
- Playwright
- ESLint

## Estrutura Atual Esperada

```text
.
|-- AGENTS.md
|-- .env.example
|-- .gitignore
|-- Makefile
|-- pyproject.toml
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   `-- routes/
|   |   |-- core/
|   |   |-- db/
|   |   |-- repositories/
|   |   |-- schemas/
|   |   |-- services/
|   |   `-- main.py
|   |-- scripts/
|   `-- tests/
|       `-- unit/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- lib/
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   `-- styles.css
|   `-- tests/
|       `-- unit/
|-- database/
|   `-- views/
|       `-- mysql/
`-- docs/
    `-- data_dictionary_reports.md
```

## Principios Arquiteturais

- O frontend nunca acessa o MySQL diretamente.
- Toda leitura de banco deve passar pelo backend.
- SQL dinamico sem parametrizacao e proibido.
- Credenciais ficam apenas em `.env` local.
- `.env` nunca deve ser commitado.
- O backend e a unica camada autorizada a conhecer detalhes de conexao e seguranca do banco.
- O frontend deve consumir contratos estaveis e semanticos, nao detalhes de infraestrutura.
- Views SQL legadas sao ativos de negocio e devem ser tratadas com cuidado.
- Qualquer dado mostrado ao usuario precisa ser confiavel, explicado e rastreavel.

## Principios de Codigo

- Clareza antes de cleverness.
- Simplicidade antes de abstracao desnecessaria.
- DRY com criterio.
- KISS como padrao.
- YAGNI sempre que houver tentacao de antecipar cenarios.
- SOLID quando contribuir para modularidade e manutencao.
- Alta coesao e baixo acoplamento.
- Nomes de funcoes, variaveis, tipos e arquivos devem ser especificos e sem ambiguidades.
- Evitar arquivos monoliticos.
- Refatorar quando a estrutura estiver ruim, repetitiva ou dificil de testar.

## Regra Obrigatoria de TDD

TDD e obrigatorio neste projeto.

Fluxo obrigatorio:

1. escrever ou ajustar o teste antes da mudanca
2. executar o teste e observar falha legitima
3. implementar a menor mudanca necessaria
4. refatorar com os testes verdes
5. executar a suite relevante novamente

### TDD para bugfix

Quando houver bug:

1. reproduzir o bug em teste
2. confirmar que o teste falha no estado atual
3. corrigir o problema
4. manter o teste como regressao obrigatoria

### Proibicoes

- Nao corrigir bug sensivel sem teste de regressao quando isso for tecnicamente viavel.
- Nao refatorar comportamento sem cobertura minima.
- Nao alterar semantica de relatorio sem teste cobrindo o campo, grafico ou fluxo afetado.

## Regras para Relatorios, SQL e Semantica

### SQL

- Arquivos SQL devem permanecer em `database/views/mysql/`.
- Nome de arquivo sempre em `snake_case`.
- Nao alterar SQL legado sem entender joins, aliases, filtros e impacto analitico.
- Toda alteracao em SQL deve preservar a intencao de negocio ou documentar a nova intencao.
- Campos chave devem ser identificados e documentados quando uma query evoluir.

### Semantica de campos no frontend

O frontend ja possui uma camada semantica para rotulos, descricoes, correlacoes e graficos. Ela deve ser mantida como fonte de verdade para a interpretacao dos relatorios.

Arquivos criticos:

- `frontend/src/lib/reportSemantics.ts`
- `frontend/src/lib/i18n.ts`
- `frontend/src/lib/reportExplorer.testable.ts`
- `frontend/src/components/ReportCharts.tsx`
- `frontend/src/components/ReportExplorer.tsx`

Regras:

- Se um campo novo for exibido, avaliar se ele precisa de metadado semantico explicito.
- Se um campo muda de alias no SQL, atualizar a camada semantica e os testes.
- Se um grafico depende de um campo especifico, deve haver protecao de regressao em teste.
- Se um campo tecnico estiver vazio, o agente deve investigar se o problema e de SQL, mapeamento semantico, estado local do frontend ou renderizacao.

### Internacionalizacao

- Toda interface visivel ao usuario deve respeitar o idioma selecionado.
- PT-BR e o idioma padrao.
- EN-US deve continuar funcional.
- Rotulos humanizados, descricoes, tooltips e nomes de filtros devem ser traduziveis.
- Termos tecnicos do banco podem aparecer em tooltip, hover ou modo tecnico, mas nao devem dominar a interface principal.

## Regras de UX e Dashboards

- Dashboards devem ser claros para tomada de decisao.
- KPI sem sentido de negocio e proibido.
- Graficos devem ter titulo util, descricao, legenda e agrupamento coerente.
- Sempre que possivel, oferecer drill-down, filtros e explicacao do dado.
- O layout deve ser responsivo.
- Nenhum componente deve causar sobreposicao evitavel.
- Tabelas devem permitir leitura operacional real.
- Quando um valor vazio tiver impacto relevante, exibir isso de forma explicita e compreensivel.

## Qualidade Minima Obrigatoria

Todo codigo entregue deve:

- ser legivel e profissional
- ser tipado quando a stack suportar
- ter tratamento de erro adequado
- evitar nomes genericos e ambiguos
- manter separacao de responsabilidades
- ter testes relevantes
- passar lint e validacoes da stack
- preservar compatibilidade com o comportamento existente, salvo quando a mudanca for intencional e coberta por testes

## Seguranca

- Nunca commitar `.env`, credenciais, segredos ou dumps sensiveis.
- Nunca expor mensagem interna de excecao diretamente ao frontend em producao.
- Validar toda entrada externa no backend.
- Sanitizar filtros, ordenacoes e parametros de relatorios.
- Minimizar dados sensiveis enviados ao frontend.
- Atualizar dependencias com criterio e observar impacto de seguranca.
- Assumir que dashboards executivos podem ser usados em contexto sensivel de negocio.

## Refatoracao

Refatoracao nao e opcional quando o codigo estiver claramente piorando.

O agente deve refatorar quando identificar:

- duplicacao real
- nomes ruins
- funcoes longas demais
- condicoes demais num unico bloco
- mistura de regra de negocio com detalhes de infraestrutura
- estado de UI excessivamente acoplado
- testes dificeis de escrever por falta de separacao

Toda refatoracao deve:

- manter ou aumentar cobertura de testes
- preservar comportamento esperado
- ser incremental quando possivel
- evitar reescritas grandes sem necessidade

## Regras de Teste

### Backend

Cobrir quando aplicavel:

- contratos da API
- validacao de parametros
- servicos
- repositorios
- conexao com banco em cenarios controlados
- erros esperados

### Frontend

Cobrir quando aplicavel:

- semantica de campos e relatorios
- fluxos de filtros
- graficos e agrupamentos
- bugs de estado local
- internacionalizacao
- renderizacao principal da aplicacao

### Regressao obrigatoria

Sempre que um bug for corrigido em:

- mapeamento de campo
- status de grafico
- tooltip
- filtros
- ordenacao
- persistencia de layout
- troca de relatorio

deve existir teste de regressao correspondente.

## Gates Obrigatorios Antes de Commit

Nenhum commit deve ser criado sem passar pelos checks relevantes a mudanca.

### Backend

- `. .venv/bin/activate && ruff check backend`
- `. .venv/bin/activate && ruff format --check backend`
- `. .venv/bin/activate && mypy backend/app`
- `. .venv/bin/activate && pytest backend/tests`
- `. .venv/bin/activate && bandit -r backend/app`

### Frontend

- `npm run lint --prefix frontend`
- `npm run test --prefix frontend`
- `npm run build --prefix frontend`

### Quando houver impacto E2E

- `npm run test:e2e --prefix frontend`

### Regra pratica

O agente deve rodar apenas o conjunto relevante durante a iteracao, mas antes do commit deve rodar o gate final correspondente ao escopo da mudanca.

## Regras de Commit

Commits devem seguir boas praticas de mercado.

### Formato recomendado

Usar Conventional Commits:

- `feat:`
- `fix:`
- `refactor:`
- `test:`
- `docs:`
- `chore:`
- `build:`
- `ci:`
- `perf:`
- `revert:`

Escopo e recomendado quando ajudar:

- `feat(frontend): adiciona seletor de agrupamento no grafico de pizza`
- `fix(report-semantics): corrige campo de status em nao conformidade`
- `test(frontend): protege regressao de estado entre relatorios`

### Regras obrigatorias para mensagem de commit

- assunto no imperativo
- assunto curto e objetivo
- descrever o que mudou, nao a historia da tarefa
- evitar `wip`, `tmp`, `ajustes`, `misc`, `update` generico
- evitar mensagens enormes na linha de assunto

### Regras de conteudo do commit

- um commit = uma unidade logica de mudanca
- nao misturar feature, refactor amplo e docs sem relacao
- nao misturar alteracoes incidentais com bugfix principal sem necessidade
- se houver refatoracao separavel, preferir commit proprio
- se houver teste de regressao, ele deve ir no mesmo commit da correcao correspondente

### Corpo do commit

Adicionar corpo quando a mudanca nao for trivial, explicando:

- por que a mudanca foi feita
- risco principal
- estrategia de compatibilidade
- validacoes executadas

### Exemplo de commit bom

```text
fix(frontend): corrige agrupamento de status em nao conformidade

O grafico de pizza reaproveitava estado de agrupamento entre relatorios e podia
exibir 100% empty ao entrar em nao conformidade.

- reseta agrupamento invalido no ReportCharts
- usa key por reportId no componente
- adiciona teste de regressao para troca entre relatorios

Validacao:
- npm run test --prefix frontend
- npm run build --prefix frontend
```

### Proibicoes em commit

- nao commitar codigo falhando teste ou lint
- nao commitar arquivos temporarios
- nao commitar segredo
- nao commitar mudanca sem entender impacto basico
- nao fazer commit grande e desorganizado quando puder separar

## Regras de Branch e PR

- trabalhar em branches curtas e objetivas
- nome da branch deve refletir o objetivo
- atualizar documentacao quando a mudanca alterar arquitetura, semantica, operacao ou regras de negocio
- atualizar obrigatoriamente o `README.md` quando a mudanca impactar onboarding, setup, arquitetura, comandos, endpoints, estrutura do repositorio, fluxo principal da aplicacao ou modo de uso do produto
- PR deve explicar objetivo, risco, validacao e impacto no usuario
- se houver mudanca visual relevante, anexar evidencia quando possivel

## Fluxo Obrigatorio ao Iniciar uma Tarefa

1. ler este `AGENTS.md`
2. entender o dominio afetado
3. localizar os pontos de codigo e teste relacionados
4. escrever ou ajustar os testes primeiro
5. executar a falha esperada
6. implementar a menor mudanca necessaria
7. refatorar se preciso
8. rodar lint, testes e build relevantes
9. atualizar documentacao se houver impacto
10. se a mudanca impactar onboarding, setup, arquitetura, comandos, endpoints, estrutura do projeto, fluxo principal ou modo de uso, atualizar obrigatoriamente o `README.md`
11. so entao preparar commit

## Decisoes Consolidadas do Projeto

- backend oficial em Python com FastAPI
- frontend oficial em React + TypeScript + Vite
- relatorios SQL organizados em `database/views/mysql/`
- frontend bilinguie PT-BR e EN-US
- D3.js como base de visualizacao interativa
- TDD obrigatorio
- seguranca como prioridade
- semantica dos campos e graficos tratada como parte critica do produto
- testes de regressao sao requisito de manutencao

## Regra Final

Se surgir uma decisao que altere significativamente:

- arquitetura
- seguranca
- contrato de API
- significado de campos
- fonte oficial de status ou KPI
- estrategia de deploy ou infraestrutura

o agente deve pausar, registrar o impacto e alinhar antes de seguir.
