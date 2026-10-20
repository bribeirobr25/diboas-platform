# Matriz de cenários

## Rodada original — preservada

Base `46e92077`. IDs abaixo correspondem aos prefixos dos testes. “Falha”
significa violação reproduzida em modo estrito, mesmo que `it.fails` apareça
verde no modo padrão. A matriz agrupa variantes; não usa quantidade como meta.

| ID     | Requisito / entrada                                                    | Resultado esperado                                            | Técnica / teste                        | Resultado                                            |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| A01    | R2/R5; share/price null, zero, negativo, NaN, infinito                 | recusar, preservar ledger, registrar campo ausente            | limites, `experimentalAudit`           | aprovado, 10 combinações                             |
| A02    | R5; 200 sequências × 4 semanas, recusas/sucesso/repetição              | prefixos imutáveis, sem duplicação do ledger                  | propriedade, semente 20261020          | aprovado                                             |
| A03    | R2/R5; CLI incompleto, depois completo                                 | saída 20/evidência; retry grava sem apagar evidência          | rede simulada + CLI real               | aprovado                                             |
| A04    | R5; fornecedor HTTP 500, depois sucesso                                | saída 1, sem escrita; retry recupera                          | falha controlada                       | aprovado                                             |
| A05    | R5; registro histórico incompleto para a mesma semana                  | saída 21, sem coleta, bytes preservados                       | CLI real                               | aprovado                                             |
| A06    | R5; snapshot salvo, fontes posteriores falham, repetir                 | saída 22 honesta, registro permanece, não duplica             | CLI real + rede recusada               | aprovado no comportamento atual                      |
| A07    | R5; erro de rename durante substituição JSON                           | JSON anterior íntegro, limpeza do temporário, retry           | falha controlada de I/O                | aprovado                                             |
| K01    | R5; cauda interrompida no ledger, próxima escrita                      | linha aceita deve ser legível                                 | caso mínimo                            | falha conhecida confirmada                           |
| N01    | R5; cauda interrompida no arquivo de tentativas                        | nova recusa deve ter evidência legível                        | caso mínimo                            | falha; extensão de K01 a outro arquivo               |
| B01    | R1/R2; 1.024 estados dos outros dez sinais                             | ETF zero, faixas e escala preservadas                         | exaustivo, soma independente           | aprovado                                             |
| B02    | R4; último completo 09/10, dois incompletos, outras fontes atualizadas | âncora 09/10; MODERATE até 30/10 00:00Z inclusive, LOW depois | −1/0/+1 ms                             | aprovado, 3 casos                                    |
| B03    | R4; cada prazo de cada fonte                                           | transição somente depois do limite declarado                  | limites, leitura isolada               | aprovado                                             |
| N02    | R4; BTC setembro, fronteira 04/11 00:00Z                               | geração/leitura concordam com os mesmos dados                 | caso mínimo temporal                   | falha nova, divergência na igualdade                 |
| N03    | R3/R4; ledger vazio, novas execuções                                   | não inventar data de atualização                              | contrato vs implementação              | falha nova; proposta de representação requer decisão |
| B04    | R4; UTC e offsets no mesmo instante                                    | mesmo painel, inclusive virada de mês/ano                     | metamórfico                            | aprovado                                             |
| C01    | R6; remover tradução suspended em cada língua                          | erro explícito, sem fallback indevido                         | sabotagem local da fixture             | aprovado ×4                                          |
| C02    | R6; HIGH/MODERATE/LOW e quatro estados da fonte                        | texto traduzido acompanha estado                              | renderização SSR/DOM                   | aprovado ×4                                          |
| C03    | texto hostil em source/message                                         | escape, sem elemento/script executável                        | teste de injeção no componente         | aprovado ×4                                          |
| K02    | R6; STALE/ERROR/UNKNOWN em condição macro                              | indisponível, não negativo                                    | contrato de apresentação               | falha conhecida, #713, 3 casos                       |
| K03    | 13 linhas M2 abrangendo 13 meses com um mês faltante                   | recusar “12 meses” não comprovados                            | cenário sintético                      | falha; extensão da lacuna conhecida de qualidade M2  |
| K04    | NaN em M2, demais entradas válidas                                     | recusar antes de sinal/descrição inválidos                    | limite numérico                        | falha conhecida confirmada                           |
| K05    | sexta às 01:00 UTC com dado do próprio dia                             | não usar fechamento ainda não confirmado                      | relógio fixo                           | falha conhecida confirmada                           |
| K06    | apenas `--etf-snapshot`                                                | nenhuma solicitação de fonte não ETF                          | CLI/rede registrados                   | falha conhecida, #713                                |
| K07    | gauge score 10/14, nome acessível traduzido                            | nome inclui valor visível                                     | renderização SSR/DOM                   | falha conhecida, #713, ×4                            |
| K08    | tabela acessível com CONSTRUCTIVE                                      | faixa traduzida                                               | renderização SSR/DOM                   | falha conhecida, #713, ×4                            |
| D01    | BTC com 60 meses, mas último mês obrigatório ausente                   | STALE INPUT                                                   | cenário sintético                      | aprovado                                             |
| MEMO-1 | memo correto, motor 10                                                 | controle passa                                                | controle existente em cópia            | aprovado ×4 idiomas                                  |
| MEMO-2 | 99999.123% inventado                                                   | controle rejeita                                              | sabotagem do conteúdo                  | detectado ×4                                         |
| MEMO-3 | motor 10; “quatorze de quatorze” e equivalentes                        | revisão completa deveria detectar incoerência                 | teste do limite do controle existente  | não detectado ×4; limite conhecido, reproduzido      |
| MEMO-4 | motor 10; `14/14`                                                      | revisão completa deveria detectar incoerência                 | controle de números estruturais        | não detectado ×4; mecanismo quantificado             |
| DATA-1 | dados versionados, motor, derivados e memo atuais                      | reconciliação e gerador sem drift                             | testes anteriores + `generate --check` | aprovado                                             |
| PAGE-1 | 3 páginas ×4 línguas                                                   | HTTP 200, idioma, CTA de aquisição                            | 12 GETs públicos                       | aprovado; só HTML/SSR                                |
| PAGE-2 | páginas Bitcoin públicas vs base                                       | score, faixa, confiança, memo, indisponível e ciclo coerentes | comparação textual                     | aprovado ×4                                          |
| SEC-1  | 12 respostas públicas                                                  | presença de CSP/HSTS/nosniff/Referrer-Policy                  | inspeção passiva de cabeçalhos         | presentes; não prova configuração completa           |
| PERF-1 | mesmos 12 GETs                                                         | medir, sem impor SLA inventado                                | amostra sequencial                     | medido; sem teste de carga                           |

## Sabotagens das proteções

| ID  | Defeito plantado em cópia                            | Detector | Resultado                                          |
| --- | ---------------------------------------------------- | -------- | -------------------------------------------------- |
| M01 | aceitar coleta incompleta                            | A01      | detectado por resultado recorded em vez de refused |
| M02 | remover precedência da suspensão                     | B01      | detectado pela ausência da variante suspended      |
| M03 | datar ETF pelo último registro, inclusive incompleto | B02      | detectado ×3 pela âncora incorreta                 |
| M04 | duplicar registro em operação repetida               | A02      | detectado por diferença dos bytes                  |
| M05 | fallback silencioso quando falta tradução            | C01      | detectado ×4 pela ausência da exceção              |

Cada alvo passou no controle limpo imediatamente antes da mutação.
As mensagens correspondem às asserções do contrato; não são falhas de sintaxe
ou de montagem. Os hashes da árvore de scripts original antes/depois coincidem.

## Não executado nesta rodada

- Workflow semanal real, fornecedores reais, backtest ou recalibração.
- Escrita concorrente, queda de energia, limites de disco, partições de rede reais.
- Leitor de tela real, interação em navegador, hidratação, layout móvel e
  transcriação por falantes nativos. Os testes de acessibilidade são de DOM/SSR.
- Formulário real de aquisição, entrega de email, atribuição analítica e
  conversão; só a presença do link foi inspecionada.
- Pentest de autenticação/API, varredura ativa ou teste de carga.

Esses itens delimitam o que esta rodada não permite concluir. Não são falhas
ignoradas dentro dos 45 casos executáveis.

## Revalidação após #713 — base 6ebeab2f

Esta seção substitui os resultados atuais, sem reescrever a evidência histórica
acima. SHA testado e medições: [relatório da reexecução](report-2026-10-20-post-713.md).

| IDs                                 | Estado nesta execução                                       | Cobertura atual / cenário mínimo                                                                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01/A02/A03/A04/A05/A07             | Contratos satisfeitos                                       | `experimentalAudit.test.ts`; 200 sequências, recusa 20, retry 0 sem fontes externas ao ETF, falha de fornecedor e recuperação, histórico incompleto 21 e rename interrompido.                                                                                   |
| A06/K06                             | Corrigidos pelo #713; regressões normais canônicas          | `etfSnapshotOnly.test.ts`: “should append exactly one ledger line…” e “should make no request and add no line…”; saída 0, só ledger muda, repetição não faz requisições. A06 deixa de exigir falha posterior: esse caminho não faz parte do snapshot exclusivo. |
| K02                                 | Corrigido pelo #713; regressões normais canônicas           | `presentationState.test.ts`: “should read %s as unavailable…” com STALE/ERROR/SOMETHING_NEW (classe de estado desconhecido); não duplicar com UNKNOWN.                                                                                                          |
| K07                                 | Corrigido pelo #713; regressão normal canônica              | `marketAccessibleText.test.tsx`: “should carry the final score in its accessible name”; nome final “Aktueller Wert: 10/14”, contrato independente do texto do rótulo.                                                                                           |
| K08                                 | Corrigido pelo #713; regressões normais canônicas           | `marketAccessibleText.test.tsx`: “should show translated bands and server-formatted dates…” em quatro línguas × três períodos; fornece `regimeLabels` e `dateLabels` pela API atual.                                                                            |
| B01/B02/B03/B04/C01/C02/C03/D01     | Contratos satisfeitos                                       | Testes experimentais mantidos; 1.024 estados, limites −1/0/+1 ms, quatro idiomas, ausência de tradução, escape de HTML e mês obrigatório. B03 caracteriza o comparador de leitura; N02 continua demonstrando a divergência mensal com a geração.                |
| K01                                 | Corrigido em 2026-10-20 (LEDGER-APPEND-1); regressão normal | Ledger com prefixo válido + `{"anchor":`, seguido de uma gravação reconhecida como recorded; a nova âncora não é legível.                                                                                                                                       |
| N01                                 | Corrigido em 2026-10-20 (LEDGER-APPEND-1); regressão normal | Arquivo de tentativas com `{"anchor":`, seguido de recusa reconhecida; evidência nova não é legível.                                                                                                                                                            |
| N02                                 | Falha esperada ainda reproduzida                            | Mesmos dados mensais na igualdade de 04/11/2026 00:00Z: leitura FRESH, geração DELAYED.                                                                                                                                                                         |
| N03                                 | Falha esperada ainda reproduzida                            | Ledger vazio em 26/10 e 28/12: `last_updated_at` avança de 26/10 para 28/12 sem evidência. Não exige null nem LOW.                                                                                                                                              |
| K03                                 | Falha esperada ainda reproduzida                            | 13 linhas M2 com mês obrigatório ausente não provocam recusa.                                                                                                                                                                                                   |
| K04                                 | Falha esperada ainda reproduzida                            | NaN em M2 não provoca recusa antes do cálculo.                                                                                                                                                                                                                  |
| K05                                 | Falha esperada ainda reproduzida                            | Sexta-feira 01:00Z aceita dado do próprio dia como fechamento confirmado.                                                                                                                                                                                       |
| MEMO-1/2/3/4                        | Reexecutados                                                | Controle válido passa; numeral inventado rejeitado; score errado em palavras ou 14/14 continua não detectado pelo controle existente. Limite do instrumento, fora de it.fails.                                                                                  |
| DATA-1                              | Reexecutado                                                 | Bateria afetada e gerador --check; resultados medidos no relatório.                                                                                                                                                                                             |
| PAGE-1/PAGE-2/SEC-1/PERF-1          | Não reexecutados                                            | Nenhuma nova alegação sobre páginas públicas, cabeçalhos ou tempos HTTP.                                                                                                                                                                                        |
| Política de confiança sem histórico | Proposta, não contrato aprovado                             | LOW imediato e representação de datas ausentes não são exigidos pela suíte nem implementados.                                                                                                                                                                   |

Sete marcadores de falha esperada, um por caso mínimo acima; 12 variantes
historicamente falhas de K02/K06/K07/K08 foram substituídas por cobertura normal
canônica. A06 foi consolidado com a regressão de repetição do #713. A bateria
atual inclui 32 casos próprios e 41 canônicos, sem duplicar os antigos casos.

M01–M05 foram reexecutadas com controles limpos. M06 planta a remoção do
retorno snapshot-only e é detectada pela asserção de requisições de A03.
Os resultados e hashes desta execução estão no novo JSON de evidência.

Além da inspeção pública, continuam não executados os cenários explicitamente
listados na seção original: workflow/coleta reais, backtest, carga, concorrência,
queda elétrica, navegador/leitor de tela real e conversão de aquisição.
