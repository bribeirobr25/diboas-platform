# Auditoria experimental do diBoaS Market

Rodada original preservada, 20/10/2026. Base: `46e92077b3e49f1918dd52e2af3e04b46b9633c6`.
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

**Revalidação após #713:** base `6ebeab2f9497543725101241f4102323b59d6a24`.
O comando inclui os 32 casos próprios e 41 regressões canônicas já presentes
no novo `main`: 73 casos, dos quais 66 satisfazem os contratos e sete continuam
reproduzindo defeitos. O modo padrão mostra 73 aprovações do runner porque usa
`it.fails` nesses sete; o modo estrito mostra 66 aprovados e sete falhas, saída 1.

> **Atualização 2026-10-20 (LEDGER-APPEND-1):** K01 e N01 foram corrigidos por `appendJsonlLine`; sua regressão canônica fica em `src/lib/market-data/__tests__/jsonlAppend.test.ts` (incluído em `pnpm market:audit`), sem cópia equivalente no arquivo experimental; restam cinco `it.fails` (N02, N03, K03, K04, K05). Os números acima descrevem a rodada de auditoria original e não foram reescritos.
> Não há casos ignorados. K02/K06/K07/K08 são cobertos pelos testes normais do #713,
> sem manter cópias equivalentes. Consulte a atualização da matriz para o mapa.

As contagens 45/26/19 pertencem exclusivamente à rodada original. Seu relatório
e JSON permanecem intactos; não representam resultados desta reexecução.

O comando de experimentos executa controles e seis sabotagens em cópias
descartáveis, além do controle existente do memo contra quatro entradas
sintéticas. M06 remove o retorno snapshot-only apenas na cópia e verifica
que A03 detecta a busca indevida de fontes. Não simula um código 22 para
alegar uma falha real após gravação na implementação atual.
Emite JSON em stdout; pode ser redirecionado para um arquivo local.
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
- [Evidência original](evidence-2026-10-20.json).
- [Revalidação após #713](report-2026-10-20-post-713.md).
- [Evidência da revalidação](evidence-2026-10-20-post-713.json).

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

## Publicação da evidência

O escritor de experimentos passa a saída por `scripts/market-audit-evidence.mjs`:
frames do checkout são relativos ao repositório; outros caminhos locais são
substituídos por `<local-path>`. Para verificar esse filtro sem coletar dados:

```sh
pnpm --filter web exec vitest run src/lib/market/__tests__/auditEvidencePrivacy.test.ts
```

Esse filtro trata caminhos, não substitui revisão de credenciais, conteúdo
publicável ou direitos de redistribuição. Em 20/10, 70 ocorrências de caminhos
locais foram removidas da evidência pós-#713 já publicada. Resultados, tempos,
hashes de scripts e asserções foram preservados. Os commits anteriores continuam
no histórico do PR; este ajuste não alega remover exposição histórica.
