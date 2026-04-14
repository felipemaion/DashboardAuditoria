# Dashboard Auditoria

Plataforma analitica para conectar a um banco MySQL, executar consultas SQL organizadas por relatorio e entregar dashboards executivos bilinguies para gerencia e diretoria.

O projeto foi estruturado para separar claramente:

- backend responsavel por conexao, leitura e exposicao da API
- frontend responsavel por exploracao, filtros, semantica e visualizacao interativa
- SQL legado tratado como ativo de negocio, versionado em pasta propria

## Visao Geral

Este repositorio consolida relatorios operacionais e os transforma em uma experiencia de analise navegavel, com foco em:

- confiabilidade dos dados
- clareza para tomada de decisao
- rastreabilidade entre campo exibido e campo original do banco
- filtros analiticos e detalhamento operacional
- visualizacoes interativas em PT-BR e EN-US

Atualmente a aplicacao oferece:

- catalogo de relatorios com identificacao de disponibilidade e bloqueio por permissao
- endpoints para executar relatorios SQL paginados
- dashboards com KPIs, correlacoes e graficos
- tabela detalhada com ordenacao, resize, pinagem e filtros rapidos
- camada semantica de campos para nomes amigaveis, descricoes e fontes tecnicas
- cobertura de testes para fluxos criticos de semantica, graficos e UI

## Principais Recursos

- API em FastAPI para saude da aplicacao e execucao de relatorios
- frontend em React + TypeScript + Vite
- graficos interativos com D3.js
- internacionalizacao PT-BR e EN-US
- semantica dos relatorios com labels, descricoes e correlacoes
- hover tecnico exibindo o campo original ou fonte da informacao
- protecao por testes de regressao para bugs de mapeamento e estado entre relatorios

## Relatorios Disponiveis no Projeto

Os SQLs organizados hoje em `database/views/mysql/` sao:

- `atividades_completas.sql`
- `atividades_de_auditoria.sql`
- `auditorias_planejadas.sql`
- `auditorias_realizadas.sql`
- `nao_conformidade.sql`
- `ocorrencias_com_e_sem_atividade.sql`
- `ocorrencias_com_indicador.sql`
- `ocorrencias_ff.sql`

No catalogo da API, cada relatorio pode ser classificado como:

- `available`: pode ser executado com o usuario atual do MySQL
- `blocked_by_permissions`: o SQL existe, mas o usuario nao tem permissao suficiente
- `query_error`: existe erro tecnico na execucao ou na consulta

## Arquitetura

### Backend

O backend concentra:

- leitura das configuracoes via `.env`
- conexao com MySQL
- organizacao do catalogo de relatorios
- execucao paginada dos SQLs
- contratos HTTP e schemas de resposta

Stack:

- Python 3.10+
- FastAPI
- SQLAlchemy 2.x
- Pydantic v2
- PyMySQL
- Pytest
- Ruff
- MyPy
- Bandit

### Frontend

O frontend concentra:

- navegacao entre relatorios
- internacionalizacao
- camada semantica dos campos
- dashboards executivos
- filtros analiticos
- detalhamento tabular operacional
- graficos com agrupamentos dinamicos

Stack:

- React 18
- TypeScript
- Vite
- TanStack Query
- D3.js
- Vitest
- Testing Library
- Playwright
- ESLint

### SQL e Dominio

Os SQLs sao tratados como ativos de negocio e ficam em:

```text
database/views/mysql/
```

As consultas sao executadas pelo backend e exibidas pelo frontend com uma camada adicional de semantica em:

```text
frontend/src/lib/reportSemantics.ts
```

Essa camada e importante porque:

- traduz os nomes tecnicos para a interface
- define o significado de campos e conceitos de negocio
- orienta KPIs, correlacoes e graficos
- protege o sistema contra exibicao inconsistente quando aliases mudam

## Estrutura do Repositorio

```text
.
|-- AGENTS.md
|-- README.md
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

## Requisitos

Para rodar localmente, recomenda-se:

- Python 3.10 ou superior
- Node.js 20 ou superior
- npm
- acesso de rede ao servidor MySQL alvo
- credenciais validas no `.env`

## Configuracao de Ambiente

Copie o arquivo de exemplo e ajuste com as credenciais reais do banco:

```bash
cp .env.example .env
```

Variaveis esperadas:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=dashboard_magna
MYSQL_USER=app_readonly_user
MYSQL_PASSWORD=change_me
MYSQL_SSL_MODE=REQUIRED

API_ENV=development
API_DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000
API_CORS_ORIGINS=http://localhost:5173

FRONTEND_APP_NAME=Dashboard Magna
FRONTEND_API_BASE_URL=http://localhost:8000
```

Observacoes importantes:

- `.env` nao deve ser commitado
- o ideal e usar um usuario MySQL de leitura para dashboards
- o status `blocked_by_permissions` e util para detectar relatorios cujo usuario atual nao consegue acessar

## Instalacao

### Opcao 1: usando Makefile

```bash
make setup
```

Isso realiza:

- criacao da virtualenv em `.venv`
- instalacao das dependencias Python em modo editavel
- instalacao das dependencias do frontend

### Opcao 2: manual

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[dev]"
cd frontend && npm install
```

## Como Rodar Localmente

### Backend

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload
```

Servidor padrao:

- API: `http://localhost:8000`
- Docs Swagger: `http://localhost:8000/docs`

### Frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

Endereco padrao:

- Frontend: `http://localhost:5173`

## Endpoints Principais

### Health

Verifica se a API esta de pe:

```http
GET /api/v1/health
```

Verifica conectividade com o banco:

```http
GET /api/v1/health/database
```

### Catalogo de relatorios

Lista todos os relatorios conhecidos e sua disponibilidade:

```http
GET /api/v1/reports
```

Exemplo de resposta:

```json
{
  "reports": [
    {
      "report_id": "auditorias-planejadas",
      "title": "Auditorias Planejadas",
      "sql_file_name": "auditorias_planejadas.sql",
      "status": "available",
      "blocked_reason": null
    }
  ]
}
```

### Execucao de relatorio

Executa um relatorio especifico com paginacao:

```http
GET /api/v1/reports/{report_id}?limit=100&offset=0
```

Exemplo:

```bash
curl -s "http://localhost:8000/api/v1/reports/atividades-de-auditoria?limit=5"
```

## Experiencia do Frontend

O frontend foi desenhado para combinacao de visao executiva com detalhamento operacional.

### O que a interface oferece hoje

- navegacao por relatorio
- suporte a relatorios bloqueados por permissao
- KPIs
- graficos de pizza, barra e barra + linha
- sugestoes de correlacao
- filtros analiticos
- tabela detalhada
- ordenacao por cabecalho
- redimensionamento de colunas
- ocultacao e exibicao de colunas
- congelamento de colunas importantes
- exportacao CSV
- tooltips com explicacoes e fonte do campo
- alternancia de idioma PT-BR e EN-US

### Semantica e Dicionario de Dados

O projeto possui uma camada semantica para:

- traduzir nomes tecnicos
- explicar o que cada campo significa
- associar graficos aos campos corretos
- exibir a origem do dado em hover

Arquivos relevantes:

- `frontend/src/lib/reportSemantics.ts`
- `frontend/src/lib/i18n.ts`
- `docs/data_dictionary_reports.md`

## Testes e Qualidade

### Backend

Executar validacoes:

```bash
source .venv/bin/activate
ruff check backend
ruff format --check backend
mypy backend/app
pytest backend/tests
bandit -r backend/app
```

### Frontend

Executar validacoes:

```bash
npm run lint --prefix frontend
npm run test --prefix frontend
npm run build --prefix frontend
```

### Atalhos

Lint geral:

```bash
make lint
```

Testes gerais:

```bash
make test
```

## Regras de Contribuicao

As regras completas de trabalho estao em [AGENTS.md](/Users/maion/Projects/DashboardMagna/AGENTS.md).

Resumo pratico:

- TDD e obrigatorio
- bugfix deve nascer com teste de regressao
- SQL legado nao pode ser alterado sem entender o impacto
- seguranca e requisito basico
- refatoracao e esperada quando o codigo estiver ruim
- commits devem seguir boas praticas e ser logicamente coerentes

## Convencao de Commits

O projeto adota Conventional Commits.

Exemplos:

- `feat(frontend): adiciona seletor de agrupamento da pizza`
- `fix(report-semantics): corrige status de nao conformidade`
- `test(frontend): protege regressao de troca entre relatorios`
- `docs(readme): documenta arquitetura e setup local`

Antes de commitar:

- rode os testes relevantes
- rode lint
- rode build quando houver mudanca no frontend
- nao misture mudancas sem relacao no mesmo commit

## Seguranca

- nunca commite `.env`
- nao exponha credenciais em codigo ou logs
- use usuario MySQL com privilegios minimos
- valide parametros no backend
- minimize dados sensiveis enviados ao frontend
- revise dependencias e mantenha as ferramentas de analise em dia

## Roadmap Sugerido

Proximos passos naturais para evolucao:

- autenticacao e autorizacao por perfil
- cache para relatorios pesados
- observabilidade e logs estruturados
- testes E2E mais amplos
- documentacao formal de significado de todos os campos
- padronizacao mais forte dos aliases SQL
- empacotamento/deploy do backend e frontend

## Troubleshooting

### O catalogo mostra `blocked_by_permissions`

O SQL existe, mas o usuario atual do MySQL nao consegue acessar todas as tabelas envolvidas. Revise grants e dependencias da consulta.

### O frontend abre, mas nao carrega os dados

Verifique:

- se o backend esta rodando
- se o `.env` esta correto
- se o CORS permite `http://localhost:5173`
- se o MySQL esta acessivel a partir da maquina local

### O grafico mostra valores vazios

Isso normalmente pode indicar:

- campo semantico apontando para alias incorreto
- dado realmente nulo no SQL
- agrupamento antigo reaproveitado indevidamente

Nesses casos, revisar:

- `frontend/src/lib/reportSemantics.ts`
- `frontend/src/components/ReportCharts.tsx`
- aliases do SQL correspondente
- testes de regressao do frontend

## Licenca

Definir a licenca oficial do projeto antes de distribuicao publica externa.
