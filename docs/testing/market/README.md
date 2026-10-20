# Auditoria experimental do diBoaS Market

Primeira rodada, 20/10/2026. Base: `46e92077b3e49f1918dd52e2af3e04b46b9633c6`.
Escopo: integridade/recuperação do ETF, confiança no tempo e comunicação do
Market, Bitcoin e Backdrop em en, pt-BR, es e de.

Esta bateria encontra falhas de software. Não mede capacidade preditiva,
adequação financeira, conversão comercial ou prontidão completa de produção.
Não altera código de produção, dados publicados, regras, workflows ou credenciais.

## Repetir

Em um checkout próprio, com Node 22 e pnpm 10.33.2:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @diboas/i18n --filter @diboas/ui --filter @diboas/email build
pnpm market:audit
MARKET_AUDIT_STRICT=1 pnpm market:audit
pnpm market:audit:experiments
```

**Interpretação dos resultados:** há 45 casos executáveis: 26 satisfazem o
contrato e 19 reproduzem falhas ainda abertas, incluindo variantes por idioma.
O modo padrão usa `it.fails` para esses 19 casos: saída zero significa que as
falhas continuam reproduzíveis, **não que os 45 cenários passaram**.
O modo `MARKET_AUDIT_STRICT=1` remove essa inversão e termina com saída 1,
mostrando as 19 violações. Nenhum caso foi simplesmente ignorado.
Se um caso passar após uma correção, remover o marcador somente depois de
reavaliar a evidência e o oráculo. Especialmente relevante após integrar #713.

O comando de experimentos executa controles e cinco sabotagens em cópias
descartáveis, além do controle existente do memo contra quatro entradas
sintéticas. Emite JSON em stdout; pode ser redirecionado para um arquivo local.
Não depende de chaves nem consulta fornecedores.

Reutilização das verificações anteriores:

```sh
pnpm --filter web exec vitest run src/lib/market-data src/lib/analytics-sdk src/lib/market src/components/Analytics/SignalCard
node apps/web/scripts/market-refresh/generate.mjs --check
```

Inspeção opcional de produção, separada do CI e dos testes offline:

```sh
python3 scripts/market-audit-public.py
```

Esse comando faz 12 GETs sequenciais de páginas públicas, com timeout de
20 segundos por página. Não abre formulários nem carrega ativos de terceiros.
Compara HTML/SSR com a base local; não substitui um navegador ou leitor de tela.

## Arquivos

- [Metodologia e oráculos](methodology.md).
- [Matriz de cenários](scenario-matrix.md).
- [Relatório e propostas](report-2026-10-20.md).
- [Evidência compacta](evidence-2026-10-20.json).

Os testes estão em `apps/web/src/lib/market/__tests__/experimental*.test.*`.
O helper e o simulador de rede ficam em `fixtures/`; o simulador de rede já
existia na base e foi reutilizado.

## CI

Os dois arquivos entram no `pnpm test` normal. **Não entram no preflight
bloqueante semanal**, que seleciona apenas `src/lib/market-data` e
`src/lib/analytics-sdk`, excluindo o controle de figuras do memo.
Não houve mudança no workflow. O CI do PR semanal continua executando o
conjunto normal, como já acontecia.

Manter as verificações determinísticas no CI normal; executar sabotagens e
inspeção pública sob demanda. Não promover os casos experimentais ao
preflight semanal sem uma decisão explícita.
