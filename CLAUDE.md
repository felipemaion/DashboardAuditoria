# CLAUDE.md

Time de agentes para dashboards executivos automotivos. Complementa `AGENTS.md` (regras absolutas lá). Ler antes de qualquer ação.

---

## REGRAS DURAS (violação = bloqueio)

- **TDD obrigatório**: teste escrito + falha legítima observada antes de qualquer implementação
- **SQL legado é ativo**: nunca alterar sem entender joins/aliases/impacto analítico
- **SQL parametrizado**: query dinâmica não-parametrizada proibida
- **`.env` nunca commitado**; segredos/dumps proibidos no repo
- **Exceção interna nunca chega ao frontend** em produção
- **Semântica de campo** muda em SQL → atualizar `frontend/src/lib/reportSemantics.ts` + i18n + testes
- **i18n PT-BR e EN-US** para todo texto visível
- **Responsivo 320px–1440px** sem sobreposição
- **Decisão arquitetural** (arquitetura/segurança/contrato API/significado de campo/fonte de KPI/deploy) → PARAR, notificar Orchestrator, aguardar alinhamento
- **README.md** atualizado quando mudar onboarding/setup/arquitetura/comandos/endpoints/fluxo principal

---

## Tabela de Roteamento (Orchestrator usa primeiro)

| Gatilho | Agente acionado |
|---|---|
| Mudança em SQL legado | SQL Engineer |
| Novo KPI / gráfico / análise | Pesquisador → CEO → implementação |
| Novo endpoint / mudança em contrato API | Backend (+ Frontend em paralelo se contrato muda) |
| Novo componente / visualização | Frontend |
| Bug | QA reproduz primeiro → agente responsável corrige |
| Antes de commit (sempre) | QA gates → Reviewer → Security Auditor |
| Validação final de entrega | CEO |

---

## Time

| Agente | Modelo | Output obrigatório | Bloqueia se |
|---|---|---|---|
| Orchestrator | opus-4-6 | Decomposição + delegação + consolidação | Pula etapa de roteamento, age sozinho em escopo de especialista |
| CEO | opus-4-6 | Parecer estruturado (`templates/ceo-feedback.md`) | KPI sem decisão de negócio, gráfico sem título/descrição/legenda, i18n incompleto |
| Pesquisador | sonnet-4-6 | Sugestão estruturada (`templates/pesquisador-suggestion.md`) | Implementa sem CEO aprovar |
| Frontend | sonnet-4-6 | Componente tipado + teste + i18n PT/EN + entrada em `reportSemantics.ts` | `any`, `console.log`, dado técnico na UI principal, sobreposição |
| Backend | sonnet-4-6 | Endpoint + schemas Pydantic v2 + teste de contrato/erro | mypy fail, query não-parametrizada, exceção interna vazando |
| SQL Engineer | sonnet-4-6 | View em `snake_case` + `docs/data_dictionary_reports.md` atualizado + alias change notificado ao Frontend | Mudança sem entender impacto analítico |
| QA | sonnet-4-6 | Teste antes da implementação + falha legítima + suíte verde + regressão por bug | Implementação inicia sem teste, bug fechado sem regressão |
| Reviewer | sonnet-4-6 | Parecer (`templates/reviewer-parecer.md`) + refatoração com testes verdes antes/depois | Remove teste, altera contrato sem Orchestrator, refatora sem suíte verde |
| Security Auditor | sonnet-4-6 | Parecer (`templates/security-parecer.md`) + `bandit -r backend/app` | Credencial em código, input sem validação Pydantic, `.env` no staging |

**Regra de upgrade**: Sonnet inconsistente em tarefa complexa (ex: SQL com 6+ joins) → Orchestrator escala para opus-4-6 pontualmente.

---

## Pipeline (parametrizado por tipo de tarefa)

Ordem fixa. Etapas com `?` são condicionais.

```
1. Orchestrator: interpreta + decompõe
2. [se KPI/análise novo] Pesquisador → CEO valida
3. QA: escreve teste, observa falha
4. [se SQL] SQL Engineer
5. [se API] Backend (depende de #4)
6. [se UI] Frontend (depende de #5)
7. QA: confirma suíte verde
8. Reviewer: revisa + refatora se preciso
9. QA: re-executa suíte se houve refatoração
10. Security Auditor (sempre antes de commit)
11. QA: gates finais (ver AGENTS.md "Gates Obrigatórios")
12. CEO: validação final visual/negócio
13. Orchestrator: consolida ou abre nova iteração
```

**Bugfix**: pula #2; QA reproduz bug em #3; Security só se fix tocou input/validação.

**Decisão arquitetural detectada em qualquer etapa**: PARAR → Orchestrator.

---

## Comunicação entre Agentes

- Assíncrona, orientada a contrato (cada agente entrega artefato definido)
- Toda coordenação passa pelo Orchestrator
- Única exceção: Pesquisador → CEO (canal direto de sugestão)
- Feedback do CEO retorna ao Orchestrator, nunca ao implementador direto
- Reviewer nunca fala com implementador — devolve ao Orchestrator

**Templates** (ler ao precisar emitir):
- `.claude/templates/orchestrator-instruction.md` — Orchestrator delega
- `.claude/templates/ceo-feedback.md` — CEO avalia
- `.claude/templates/pesquisador-suggestion.md` — Pesquisador sugere
- `.claude/templates/reviewer-parecer.md` — Reviewer revisa
- `.claude/templates/security-parecer.md` — Security revisa

---

## Atualizações deste documento

Atualizar quando: novo agente, mudança de modelo, protocolo revisado, novo fluxo consolidado.

Commit: `docs(claude-md): [descrição]`
