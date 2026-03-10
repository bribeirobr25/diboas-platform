# diBoaS Pagina de Protocolos — Copy FINAL (PT-BR)

## Status do Documento

| Campo | Valor |
|-------|-------|
| Versao | v1.3 — Fixes do copywriter aplicados |
| Idioma | Portugues Brasileiro (PT-BR) |
| Data | 28 de fevereiro de 2026 |
| Base | PROTOCOLS_PAGE_FINAL_EN.md v1.3 |
| Adaptacao Cultural | Completa (nao e traducao literal) |
| CLO Review | Todos os fixes P0/P1 do EN aplicados. CVM 3-Warning no lugar de MiCA. |
| Copywriter Review | Todos os 6 fixes + 4 polish do EN aplicados. |
| Pendente | Confirmacao do CEO sobre Balancer (posicao CLO: defensavel). |

## Notas de Implementacao para CTO / Claude Code

Este documento contem a versao completa em portugues brasileiro da pagina de Protocolos. ADAPTACAO CULTURAL para o mercado brasileiro, nao traducao literal.

### Diferencas Criticas em Relacao ao EN

| Item | EN | PT-BR | Motivo |
|------|-----|-------|--------|
| Moeda | $1,000 | R$1.000 | Moeda local |
| Minimo | $5 | R$10 | Valor minimo BR |
| Separador decimal | 0.39% (ponto) | 0,39% (virgula) | Formato brasileiro |
| Separador de milhar | 1,000 (virgula) | 1.000 (ponto) | Formato brasileiro |
| Regulatorio | MiCA (Art. 68 + Art. 7) | CVM 3-Warning (OBRIGATORIO, acima da dobra) | Jurisdicao brasileira. SEM MiCA. |
| Tom | Warm, direct | Mais quente, mais informal, "pra" permitido | Cultura brasileira |
| Inflacao | Implicita | Selic/CDI como referencia | Brasileiro compara tudo com "rendendo 100% do CDI" |
| Referencia bancaria | "bank savings" | "poupanca" / "Tesouro Direto" / "CDB" | Produtos brasileiros conhecidos |
| Tratamento | "you" | "voce" (informal, "pra voce" permitido) | Fintechs brasileiras usam voce |

### Regras Globais

- NENHUM travessao. Usar virgulas, pontos, dois pontos ou quebras de linha.
- NENHUM emoji no corpo do texto.
- Todos os CTAs sao botoes, salvo indicacao contraria.
- Filtro Adelaide RELAXADO para esta pagina. Termos tecnicos (DeFi, protocolo, TVL, staking, stablecoin) sao esperados e necessarios. Mas as descricoes devem priorizar clareza sobre jargao.
- Descricoes de protocolos devem responder: "O que isso significa pro meu dinheiro?"

### Fluxo de Secoes

| # | Secao | Tipo |
|---|-------|------|
| 0 | CVM 3-Warning | Banner obrigatorio acima da dobra |
| 1 | Hero | Estatico |
| 2 | Por que esta pagina existe | Estatico (3 paragrafos + aviso) |
| 3 | Grid de protocolos | Grid de cards por categoria (7 categorias, 26 protocolos) |
| 4 | Como escolhemos | Criterios com explicacao |
| 5 | TVL combinado | Destaque estatistico |
| 6 | O que esta pagina nao e | Riscos e limitacoes |
| 7 | FAQ | Acordeao (8 perguntas) |
| 8 | Lista de espera / CTA | Captura de email |
| 9 | Rodape | Avisos legais + fontes de dados |

---

## SECAO 0: CVM 3-WARNING (OBRIGATORIO — ACIMA DA DOBRA)

**Este bloco e OBRIGATORIO no Brasil. Deve aparecer ANTES do Hero.**

```
Aviso 1: As operacoes com criptoativos envolvem riscos. Esses ativos podem aumentar ou diminuir de valor e podem perder todo o seu valor. Nao ha garantia de que os ativos digitais possam ser convertidos para a moeda de referencia.

Aviso 2: Desempenho passado nao e garantia de resultados futuros.

Aviso 3: Este produto pode nao ser adequado para o perfil do investidor.
```

**Notas de implementacao:** Estilizar como banner sutil mas visivel. Texto pequeno. Fundo neutro. Nao pode ser dispensado/fechado. Deve estar presente em todas as visitas.

---

## SECAO 1: HERO

**H1:**

```
Onde seu dinheiro trabalha
```

**Subtitulo:**

```
Cada sistema. Cada nome. Nada escondido.
```

**Linha de confianca (texto menor):**

```
26 protocolos. 7 categorias. Transparencia total sobre cada sistema que toca o seu dinheiro.
```

---

**Transicao:**

```
Por isso a gente criou essa pagina.
```

---

## SECAO 2: POR QUE ESTA PAGINA EXISTE

**H2:**

```
Por que esta pagina existe
```

**Texto:**

```
Pergunta pro seu banco onde o seu dinheiro da poupanca vai. Eles nao vao te contar.

A gente conta. Cada sistema listado nessa pagina e um que o seu dinheiro pode tocar quando voce usa uma estrategia do diBoaS. A gente publica os nomes, o historico, as auditorias de seguranca e as coisas que deram errado. Porque voce merece saber.

Cada protocolo nessa pagina conquistou seu lugar. Verificamos ha quanto tempo esta rodando, quem auditou o codigo, como lidou com problemas e se pessoas reais confiam nele com dinheiro de verdade. Se nao passou, nao esta aqui.

Listamos 26 protocolos aqui. Nossas estrategias usam atualmente 6 deles. Os demais sao protocolos que pesquisamos e aprovamos, e podem ser incluidos em estrategias futuras conforme expandimos.
```

**Caixa de aviso (fundo ambar, borda esquerda):**

```
Importante: Estar listado aqui nao significa risco zero. Significa que fizemos nosso dever de casa e somos honestos sobre o que encontramos. Todo sistema nessa pagina carrega risco tecnico, risco de mercado e a possibilidade de perdas.
```

### Notas

- Primeira frase ("Pergunta pro seu banco...") usa "pra" intencional, tom conversacional brasileiro.
- "A gente" em vez de "nos" formal. Padrao fintech brasileiro (Nubank, Rico, XP).
- Referencia a poupanca toca direto no brasileiro medio.

---

## SECAO 3: GRID DE PROTOCOLOS

**H2:**

```
Os 26 protocolos
```

**Subtitulo:**

```
Organizados pelo que fazem. Clique em qualquer card pra ver detalhes.
```

**Nota de atualidade TVL (micro-texto abaixo do subtitulo):**

```
Todos os valores de TVL sao aproximados, vindos do DeFiLlama, e atualizados em fevereiro de 2026. Os valores variam diariamente.
```

---

### Categoria 1: Emprestimos

**Titulo:** Protocolos de emprestimo

**Descricao:**

```
Voce deposita ativos. Tomadores pagam juros pra usa-los. Voce ganha os juros.
```

---

#### Card: Aave V3

**Nome:** Aave V3

**Descricao:**

```
O maior sistema de emprestimos das financas descentralizadas. Voce deposita ativos, ganha juros dos tomadores e pode sacar a qualquer momento. Usado por instituicoes e individuos em 18 blockchains.
```

**Detalhes:**

| Fundado | 2017 (V3: 2022) |
| Valor Total Bloqueado | ~US$35 bilhoes |
| Blockchains | Ethereum, Arbitrum, Polygon, + 15 mais |
| Auditorias de seguranca | 30+ auditorias independentes |
| Regulatorio / Historico | SEC encerrou sua investigacao de 4 anos sem acusacoes (dezembro 2025). Fonte: carta de encerramento da SEC compartilhada pelo fundador do Aave; reportado por Yahoo Finance, CoinDesk, Unchained. |

**Links:** Website: aave.com | X: @AaveAave

**Usado nas estrategias diBoaS:** Porto Seguro, Goleiro, Construtor Paciente, Multiplicador Constante, Maximizador de Rendimento

---

#### Card: Compound V3

**Nome:** Compound V3

**Descricao:**

```
Um dos sistemas de emprestimo mais antigos em DeFi. Voce ganha juros fornecendo ativos que outros tomam emprestados. Simples, testado em batalha e rodando desde 2018.
```

**Detalhes:**

| Fundado | 2018 (V3: 2022) |
| Valor Total Bloqueado | ~US$2 bilhoes |
| Blockchains | Ethereum, Arbitrum, Base, Polygon |
| Auditorias de seguranca | 4+ auditorias independentes |
| Regulatorio / Historico | Totalmente descentralizado. Sem licencas especificas necessarias. |

**Links:** Website: compound.finance | X: @compoundfinance

**Usado nas estrategias diBoaS:** Porto Seguro, Goleiro, Construtor Paciente, Multiplicador Constante, Maximizador de Rendimento

---

#### Card: Kamino

**Nome:** Kamino

**Descricao:**

```
Plataforma tudo-em-um de emprestimos e liquidez da Solana. Combina emprestimos, gestao automatizada de liquidez e alavancagem num so sistema. Voce ganha juros emprestando ativos a tomadores, parecido com Aave e Compound.
```

**Detalhes:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~US$2,5 bilhoes |
| Blockchains | Solana |
| Auditorias de seguranca | Multiplas auditorias da OtterSec |
| Regulatorio / Historico | Protocolo descentralizado. Sem incidentes graves. |

**Links:** Website: kamino.finance | X: @KaminoFinance

---

#### Card: Morpho

**Nome:** Morpho

**Descricao:**

```
Conecta credores diretamente com tomadores pra taxas melhores que pools de emprestimo tradicionais. A Coinbase integrou o Morpho na Base pra emprestimos em USDC com garantia de bitcoin (janeiro 2025), originando mais de US$1,2 bilhao em emprestimos ate o final de 2025.
```

**Detalhes:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~US$7 bilhoes |
| Blockchains | Ethereum, Base, Arbitrum |
| Auditorias de seguranca | 23+ auditorias independentes |
| Regulatorio / Historico | Integrado pela Coinbase (jan. 2025) e Crypto.com (out. 2025) pra emprestimos lastreados em DeFi. Fonte: blog da Coinbase, morpho.org/stories/coinbase, DL News. |

**Links:** Website: morpho.org | X: @MorphoLabs

---

#### Card: Spark Protocol

**Nome:** Spark Protocol

**Descricao:**

```
Sistema de emprestimos construido sobre o codigo comprovado do Aave, conectado a liquidez profunda do Sky/MakerDAO. Se beneficia do historico operacional mais longo em DeFi (desde 2014).
```

**Detalhes:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~US$4 bilhoes |
| Blockchains | Ethereum, Base, Arbitrum |
| Auditorias de seguranca | 7+ auditorias independentes |
| Regulatorio / Historico | Se beneficia dos 10+ anos de historico de compliance do MakerDAO |

**Links:** Website: spark.fi | X: @sparkdotfi

---

#### Card: Fluid

**Nome:** Fluid

**Descricao:**

```
Emprestimos de proxima geracao que combina funcionalidades de multiplos sistemas estabelecidos. Penalidades de liquidacao muito baixas pra tomadores. Voce ganha juros dos tomadores, parecido com outros protocolos de emprestimo.
```

**Detalhes:**

| Fundado | 2024 |
| Valor Total Bloqueado | ~US$2 bilhoes |
| Blockchains | Ethereum, Arbitrum, Base |
| Auditorias de seguranca | 3+ auditorias independentes |
| Regulatorio / Historico | Construido pelo time da Instadapp (6+ anos construindo infraestrutura DeFi) |

**Nota de excecao (micro-texto abaixo do card):**

```
Excecao ao nosso minimo de 1 ano: Fluid foi lancado em 2024, mas e construido pelo time da Instadapp, que tem 6+ anos de experiencia em infraestrutura DeFi.
```

**Links:** Website: fluid.io | X: @0xFluid

---

### Categoria 2: Staking

**Titulo:** Protocolos de staking

**Descricao:**

```
Voce ajuda a proteger uma rede blockchain. A rede te paga recompensas por isso.
```

---

#### Card: Lido Finance

**Nome:** Lido Finance

**Descricao:**

```
Faca staking do seu ETH e receba um token (stETH) que voce pode usar em outros lugares enquanto continua ganhando recompensas de staking. O maior servico de staking em crypto.
```

**Detalhes:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~US$27 bilhoes |
| Blockchains | Ethereum, Polygon |
| Auditorias de seguranca | 20+ auditorias independentes |
| Regulatorio / Historico | Declaracao da Divisao de Financas Corporativas da SEC (5 de agosto de 2025): tokens de recebimento de liquid staking, incluindo stETH, nao sao valores mobiliarios sob o Securities Act de 1933 ou o Exchange Act de 1934. Parte da iniciativa "Project Crypto" do presidente da SEC, Atkins. Fonte: declaracao em SEC.gov; reportado por CoinDesk, Decrypt, CCN. |

**Links:** Website: lido.fi | X: @LidoFinance

---

#### Card: Rocket Pool

**Nome:** Rocket Pool

**Descricao:**

```
Staking descentralizado de Ethereum. Voce pode fazer staking com apenas 0,01 ETH. Nenhum operador centralizado controla a rede.
```

**Detalhes:**

| Fundado | 2016 (mainnet 2021) |
| Valor Total Bloqueado | ~US$2 bilhoes |
| Blockchains | Ethereum |
| Auditorias de seguranca | 5+ auditorias independentes |
| Regulatorio / Historico | Declaracao da SEC (5 de agosto de 2025): tokens de recebimento de liquid staking, incluindo rETH, nao sao valores mobiliarios. Mesma declaracao que cobre Lido stETH e Jito JitoSOL. Fonte: declaracao em SEC.gov. |

**Links:** Website: rocketpool.net | X: @Rocket_Pool

---

#### Card: Jito

**Nome:** Jito

**Descricao:**

```
Liquid staking de Solana que ganha tanto recompensas padrao de staking quanto recompensas adicionais de MEV (arbitragem de trading). Usado nas estrategias de crescimento do diBoaS.
```

**Detalhes:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~US$2,8 bilhoes |
| Blockchains | Solana |
| Auditorias de seguranca | Multiplas auditorias da Certora, OtterSec |
| Regulatorio / Historico | Declaracao da SEC (agosto 2025): tokens de recebimento de liquid staking, incluindo JitoSOL, nao sao valores mobiliarios. Fonte: declaracao em SEC.gov; reportado por CoinDesk, CCN, Blockchain Magazine. |

**Links:** Website: jito.network | X: @jikitonetwork

**Usado nas estrategias diBoaS:** Aceleracao Total

---

#### Card: Marinade Finance

**Nome:** Marinade Finance

**Descricao:**

```
Staking de Solana distribuido entre 100+ validadores pra melhor descentralizacao e recompensas. Um dos poucos protocolos DeFi com certificacao de compliance institucional.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$550 milhoes |
| Blockchains | Solana |
| Auditorias de seguranca | 5+ auditorias independentes |
| Regulatorio / Historico | Certificado SOC 2 Tipo I e II. Compliance de grau institucional. |

**Badge:** ✓ (indicador verde de sucesso)

**Links:** Website: marinade.finance | X: @MarinadeFinance

---

#### Card: Sanctum (INF)

**Nome:** Sanctum (INF)

**Descricao:**

```
Camada de liquidez unificada pra todos os tokens de staking da Solana. Permite trocar instantaneamente entre diferentes ativos em staking sem esperar periodos de unstaking.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$1,7 bilhao |
| Blockchains | Solana |
| Auditorias de seguranca | Auditado pela Accretion |
| Regulatorio / Historico | Sediado em Singapura. Fornece staking pra Binance e Bybit. |

**Links:** Website: sanctum.so | X: @sanctumso

**Usado nas estrategias diBoaS:** Crescimento Estavel, Progresso Firme, Construtor Equilibrado, Acelerador de Patrimonio, Aceleracao Total

---

#### Card: EigenLayer

**Nome:** EigenLayer

**Descricao:**

```
Restaking: use seu ETH ja em staking pra apoiar outros servicos construidos no Ethereum e ganhar recompensas extras sobre seu rendimento base de staking. Voce ganha recompensas de staking mais bonus dos servicos que ajuda a proteger.
```

**Detalhes:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~US$12 bilhoes |
| Blockchains | Ethereum |
| Auditorias de seguranca | Multiplas auditorias independentes |
| Regulatorio / Historico | Programa de bug bounty de US$2 milhoes no Immunefi |

**Links:** Website: eigenlayer.xyz | X: @eigenlayer

---

### Categoria 3: Stablecoins e ativos sinteticos

**Titulo:** Stablecoins e ativos sinteticos

**Descricao:**

```
Esses sistemas criam ativos digitais projetados pra manter um valor estavel, geralmente atrelado ao dolar americano. Stablecoins podem perder o lastro.
```

---

#### Card: Sky Protocol / SSR (antigo MakerDAO)

**Nome:** Sky Protocol / SSR (antigo MakerDAO)

**Descricao:**

```
O sistema DeFi original. Rodando desde 2014. Deposite crypto como garantia, gere stablecoins, ganhe a taxa de poupanca. Sobreviveu a toda grande queda de mercado desde 2017.
```

**Detalhes:**

| Fundado | 2014 |
| Valor Total Bloqueado | ~US$6 bilhoes |
| Blockchains | Ethereum (as estrategias do diBoaS usam o deploy no Arbitrum) |
| Auditorias de seguranca | 10+ auditorias independentes |
| Regulatorio / Historico | 10+ anos de operacao continua atraves de multiplos ciclos de mercado |

**Links:** Website: sky.money | X: @SkyEcosystem

**Usado nas estrategias diBoaS:** Todas as 10 estrategias (Porto Seguro, Crescimento Estavel, Goleiro, Progresso Firme, Construtor Paciente, Construtor Equilibrado, Multiplicador Constante, Acelerador de Patrimonio, Maximizador de Rendimento, Aceleracao Total)

---

#### Card: Ethena

**Nome:** Ethena

**Descricao:**

```
Cria um dolar sintetico (USDe) atraves de posicoes protegidas. Oferece rendimentos mais altos que stablecoins tradicionais, mas com um mecanismo mais complexo e perfil de risco mais elevado.
```

**Detalhes:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~US$6,5 bilhoes |
| Blockchains | Ethereum + 23 cadeias |
| Auditorias de seguranca | 7+ auditorias independentes |
| Regulatorio / Historico | BaFin (Alemanha) rejeitou a solicitacao de autorizacao MiCA em marco de 2025, citando "deficiencias significativas" na estrutura organizacional e cumprimento de reservas. BaFin ordenou a interrupcao da emissao/resgate de USDe e congelou ativos de reserva. Ethena GmbH concordou em encerrar operacoes na Alemanha (abril 2025). Todas as atividades agora operam via Ethena (BVI) Limited, uma entidade das Ilhas Virgens Britanicas. BaFin tambem levantou preocupacoes de que sUSDe possa constituir um valor mobiliario nao registrado sob a lei alema. Fontes: aviso oficial da BaFin (21 de marco de 2025); Decrypt, The Block, CoinTelegraph, Ledger Insights. |

**Badge:** ⚠ (indicador ambar de alerta)

**Links:** Website: ethena.fi | X: @ethena_labs

---

#### Card: Ondo Finance

**Nome:** Ondo Finance

**Descricao:**

```
Traz ativos financeiros tradicionais pra blockchain. Titulos do Tesouro dos EUA, titulos e acoes como tokens digitais. Adquiriu licencas de broker-dealer e agente de transferencia registradas na SEC atraves da compra da Oasis Pro (concluida em outubro de 2025).
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$1,7 bilhao |
| Blockchains | Ethereum, Solana, Arbitrum |
| Auditorias de seguranca | 4+ auditorias independentes |
| Regulatorio / Historico | Broker-dealer registrado na SEC, Sistema Alternativo de Negociacao (ATS) e licencas de Agente de Transferencia adquiridos via Oasis Pro (membro da FINRA desde 2020). Aquisicao concluida em outubro de 2025. Mais de US$1,6 bilhao em ativos tokenizados sob gestao. Fontes: blog da Ondo Finance, Blockworks, CoinDesk, FINRA BrokerCheck (Oasis Pro Markets LLC). |

**Badge:** ✓ (indicador verde de sucesso)

**Links:** Website: ondo.finance | X: @ondofinance

---

### Categoria 4: Protocolos de rendimento e trading

**Titulo:** Protocolos de rendimento e trading

**Descricao:**

```
Esses sistemas geram retornos atraves de taxas de trading, otimizacao de rendimento ou produtos estruturados.
```

---

#### Card: Pendle Finance

**Nome:** Pendle Finance

**Descricao:**

```
Separa rendimento do principal pra que voce possa negociar, travar ou especular com retornos futuros. Permite garantir uma taxa fixa ou apostar que as taxas vao subir.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$4,5 bilhoes |
| Blockchains | Ethereum, Arbitrum, BNB Chain |
| Auditorias de seguranca | 6+ auditorias independentes |
| Regulatorio / Historico | Bug bounty de US$250 mil. Acordo Safe Harbor vigente. |

**Links:** Website: pendle.finance | X: @pendle_fi

---

#### Card: Yearn Finance

**Nome:** Yearn Finance

**Descricao:**

```
Yield farming automatizado. Move seu dinheiro entre sistemas pra buscar o melhor rendimento disponivel. Um pioneiro rodando desde 2020.
```

**Detalhes:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~US$500 milhoes |
| Blockchains | Ethereum, Arbitrum, Fantom |
| Auditorias de seguranca | 6+ auditorias independentes |
| Regulatorio / Historico | Pioneiro da agregacao de rendimento. 5+ anos de operacao continua. |

**Links:** Website: yearn.fi | X: @yearnfinance

---

#### Card: Curve Finance

**Nome:** Curve Finance

**Descricao:**

```
Exchange especializada em stablecoins e ativos similares. Projetada pra impacto minimo no preco ao trocar entre ativos de valor similar.
```

**Detalhes:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~US$2,2 bilhoes |
| Blockchains | Ethereum + 20 cadeias |
| Auditorias de seguranca | 15+ auditorias independentes |
| Regulatorio / Historico | Julho 2023: exploit de US$70 milhoes. 73% dos fundos recuperados. A causa raiz foi um bug do compilador (Vyper), nao do codigo da Curve. |

**Badge:** ⚠ (indicador ambar de alerta)

**Links:** Website: curve.finance | X: @CurveFinance

---

#### Card: Convex Finance

**Nome:** Convex Finance

**Descricao:**

```
Aumenta suas recompensas do Curve sem precisar travar tokens por anos. Simplifica a participacao no Curve.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$1,5 bilhao |
| Blockchains | Ethereum, Arbitrum |
| Auditorias de seguranca | 7 auditorias independentes |
| Regulatorio / Historico | Nenhum exploit em 4 anos. Uma vulnerabilidade critica foi encontrada e corrigida em 2022 antes que fundos fossem perdidos. |

**Links:** Website: convexfinance.com | X: @ConvexFinance

---

### Categoria 5: Exchanges perpetuos e de trading

**Titulo:** Exchanges perpetuos e de trading

**Descricao:**

```
Traders usam esses sistemas pra apostar em movimentos de preco. Voce ganha retornos fornecendo a liquidez contra a qual eles operam.
```

---

#### Card: GMX V2

**Nome:** GMX V2

**Descricao:**

```
Exchange perpetuo descentralizado. Voce fornece liquidez pra um pool compartilhado. Traders pagam taxas pro pool. Voce ganha uma parte de cada operacao.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$400 milhoes |
| Blockchains | Arbitrum, Avalanche, Solana |
| Auditorias de seguranca | 10+ auditorias independentes |
| Regulatorio / Historico | Bug bounty de US$5 milhoes no Immunefi (um dos maiores em DeFi) |

**Links:** Website: gmx.io | X: @GMX_IO

---

#### Card: Jupiter JLP

**Nome:** Jupiter JLP

**Descricao:**

```
O exchange perpetuo lider da Solana. Forneca liquidez e ganhe 70% de todas as taxas de trading. Usado em varias estrategias de crescimento do diBoaS.
```

**Detalhes:**

| Fundado | 2021 (perpetuos: 2023) |
| Valor Total Bloqueado | ~US$1,6 bilhao |
| Blockchains | Solana |
| Auditorias de seguranca | 6+ auditorias independentes |
| Regulatorio / Historico | Mais de US$137 milhoes pagos a provedores de liquidez de janeiro a outubro de 2024, baseado em dados de taxas do Dune Analytics (75% de US$183 milhoes em taxas totais). Fonte: SolanaFloor / Dune Analytics (outubro 2024). O numero e provavelmente significativamente maior na data de publicacao. |

**Links:** Website: jup.ag | X: @JupiterExchange

**Usado nas estrategias diBoaS:** Construtor Equilibrado, Acelerador de Patrimonio, Aceleracao Total

---

#### Card: Drift Protocol

**Nome:** Drift Protocol

**Descricao:**

```
Plataforma de trading completa na Solana. Perpetuos, trading spot e emprestimos num so sistema. O painel de monitoramento de riscos em tempo real e publico.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$850 milhoes |
| Blockchains | Solana |
| Auditorias de seguranca | 3+ auditorias da Trail of Bits, OtterSec |
| Regulatorio / Historico | Codigo open-source. Monitoramento de riscos publico. |

**Links:** Website: drift.trade | X: @DriftProtocol

---

### Categoria 6: Exchanges descentralizados (DEX)

**Titulo:** Exchanges descentralizados

**Descricao:**

```
Troque um token por outro sem exchange centralizado. Voce tambem pode ganhar taxas fornecendo liquidez pra outros operarem.
```

---

#### Card: Raydium

**Nome:** Raydium

**Descricao:**

```
O principal exchange descentralizado da Solana. Market making automatizado, liquidez concentrada e lancamentos de tokens.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$2 bilhoes |
| Blockchains | Solana |
| Auditorias de seguranca | 4+ auditorias independentes |
| Regulatorio / Historico | Novembro 2022: exploit de US$4,4 milhoes causado por chave de administrador comprometida. Todos os usuarios afetados foram reembolsados. |

**Badge:** ⚠ (indicador ambar de alerta)

**Links:** Website: raydium.io | X: @RaydiumProtocol

---

#### Card: Orca

**Nome:** Orca

**Descricao:**

```
Exchange de Solana facil de usar, conhecido pelo design limpo, swaps eficientes e um dos historicos de seguranca mais solidos do ecossistema. Voce pode fornecer liquidez e ganhar taxas das operacoes na plataforma.
```

**Detalhes:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~US$400 milhoes |
| Blockchains | Solana |
| Auditorias de seguranca | 6+ auditorias independentes |
| Regulatorio / Historico | Nenhum exploit em 4+ anos. Elogiado por revisores independentes pela qualidade do codigo. |

**Links:** Website: orca.so | X: @orca_so

---

#### Card: Balancer

**Nome:** Balancer

**Descricao:**

```
Pools de liquidez programaveis que podem conter multiplos tokens em proporcoes customizadas. Mais flexivel que pools de exchange padrao. Voce fornece tokens pro pool e ganha uma parte das taxas de trading.
```

**Detalhes:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~US$258 milhoes (pos-exploit; era ~US$775M antes de novembro 2025) |
| Blockchains | Ethereum, Arbitrum, Polygon |
| Auditorias de seguranca | 11+ auditorias independentes |
| Regulatorio / Historico | 3 de novembro de 2025: exploit de US$128 milhoes afetando pools V2 em Ethereum, Polygon, Base, Arbitrum e outras cadeias. Vulnerabilidade de erro de arredondamento em contratos ComposableStablePool. Aproximadamente US$28 milhoes recuperados atraves de operacoes whitehat e intervencoes do protocolo. A maioria dos fundos (~US$100 milhoes) permanece sem recuperacao em fevereiro de 2026. Balancer DAO aprovou bounty de recuperacao de 10% (BIP-908, fevereiro 2026). V3 (versao atual) NAO foi afetada por este exploit. As estrategias do diBoaS usam exclusivamente V3. Fontes: Check Point Research, CoinJournal, The Defiant, DL News, Halborn. |

**Badge:** ⚠ (indicador ambar de alerta)

**Links:** Website: balancer.fi | X: @Balancer

---

### Categoria 7: Infraestrutura de pagamentos e ativos do mundo real

**Titulo:** Infraestrutura de pagamentos e ativos do mundo real

**Descricao:**

```
Esses sistemas conectam financas tradicionais e crypto. Pagamentos internacionais, financiamento comercial e ativos do mundo real em blockchain.
```

---

#### Card: Huma Finance

**Nome:** Huma Finance

**Descricao:**

```
Pagamentos internacionais instantaneos e financiamento comercial usando infraestrutura crypto. Parceiros da Circle e da Stellar Development Foundation. Os retornos vem das taxas cobradas no processamento de pagamentos internacionais.
```

**Detalhes:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~US$100 milhoes |
| Blockchains | Solana, Stellar, Polygon |
| Auditorias de seguranca | 6+ auditorias independentes |
| Regulatorio / Historico | Parcerias estrategicas com Circle e Stellar Development Foundation |

**Links:** Website: huma.finance | X: @humafinance

---

## SECAO 4: COMO ESCOLHEMOS

**Transicao:**

```
Como esses 26 entraram na lista?
```

**H2:**

```
Nosso processo de selecao
```

**Texto:**

```
A gente nao adiciona protocolos porque sao populares. Adicionamos porque passaram pela nossa checklist.
```

**Criterios (renderizados como lista com marcas de verificacao):**

```
✓ Pelo menos 1 ano de operacao continua. Fazemos excecoes pra protocolos construidos por times com historico longo, mas indicamos isso claramente.

✓ Auditorias de seguranca profissionais de firmas reconhecidas. Nao apenas uma. Procuramos multiplas auditorias independentes.

✓ Nenhum exploit nao resolvido afetando a versao que usamos onde fundos de usuarios foram perdidos permanentemente. Incidentes passados e exploits especificos de versao sao divulgados em cada card com um badge de alerta.

✓ Operacoes transparentes. Conseguimos verificar como o protocolo funciona. Codigo open-source e preferido.

✓ Uso real. Usuarios reais depositando dinheiro de verdade. Nao so hype, nao so preco de token.
```

**Abaixo dos criterios:**

```
Quando protocolos tiveram incidentes de seguranca, indicamos no card com um alerta ambar. Transparencia funciona nos dois sentidos. Mostramos o bom e o ruim.
```

---

**Transicao:**

```
Quanto dinheiro de verdade tem nesses sistemas?
```

---

## SECAO 5: TVL COMBINADO

**H2:**

```
Valor combinado protegido
```

**Texto:**

```
Os protocolos nessa pagina mantem juntos mais de
```

**Numero grande (estilizado como estatistica hero, teal-700, negrito):**

```
US$120 bilhoes
```

**Continuacao:**

```
em depositos de usuarios em todos os seus deploys. Isso e mais do que a maioria dos bancos regionais mantem em depositos totais.
```

**Contexto (texto menor abaixo):**

```
Isso nao significa que seu dinheiro esta em todos eles. Cada estrategia do diBoaS usa protocolos especificos adequados ao seu nivel de risco e objetivos. Veja a pagina de Estrategias pra saber quais protocolos sao usados em cada estrategia.
```

**Linha de fonte (micro-texto):**

```
TVL combinado obtido do DeFiLlama. Ultima verificacao: janeiro 2026. Os valores variam diariamente.
```

---

**Transicao:**

```
Antes de continuar, algo importante.
```

---

## SECAO 6: O QUE ESTA PAGINA NAO E

**H2:**

```
O que esta pagina nao e
```

**Texto:**

```
Isso nao e uma recomendacao pra usar qualquer um desses protocolos diretamente.

As estrategias do diBoaS sao construidas em cima desses sistemas, e nosso time cuida da complexidade. Voce nao precisa interagir com nenhum protocolo. Essa pagina existe pra que voce possa ver exatamente pra onde o seu dinheiro vai e verificar tudo que a gente diz.

Todo protocolo aqui tem risco. Smart contracts podem ter bugs. Mercados podem desabar. Stablecoins podem perder o lastro. Sistemas que operam com seguranca ha anos podem ter problemas amanha. Monitoramos esses sistemas continuamente, mas nao conseguimos eliminar o risco. Ninguem consegue.

Essa pagina existe porque acreditamos que voce merece saber. Nao porque voce precisa fazer algo com ela.

Se voce nao tem certeza se isso e certo pra voce, consulte um assessor de investimentos antes de tomar decisoes.
```

---

**Transicao:**

```
Provavelmente voce ainda tem perguntas. Otimo.
```

---

## SECAO 7: FAQ

**H2:**

```
Perguntas sobre nossos protocolos
```

---

**P1: Por que voces nao listam todos os protocolos DeFi?**

```
Existem milhares de protocolos DeFi. Preferimos listar 26 que pesquisamos a fundo do que 200 que nao conhecemos.
```

---

**P2: Com que frequencia voces atualizam essa lista?**

```
Monitoramos todos os protocolos listados continuamente. Se um protocolo tem um incidente de seguranca, mudanca regulatoria ou problema operacional significativo, atualizamos essa pagina. Tambem revisamos a lista completa trimestralmente pra decidir se adicionamos ou removemos protocolos.
```

---

**P3: Posso sugerir um protocolo pra ser adicionado?**

```
Sim. Mande um email pra hello@diboas.com com sua sugestao e por que voce acha que deveria ser incluido. Avaliamos cada sugestao conforme nossos criterios de selecao.
```

---

**P4: Estar listado aqui significa que o diBoaS recomenda esses protocolos?**

```
Nao. Estar listado significa que pesquisamos, eles cumprem nossos criterios e os usamos em nossas estrategias. Nao somos afiliados a nenhum protocolo. A inclusao deles nao implica que eles endossam o diBoaS, e nossa listagem nao constitui uma recomendacao de usa-los diretamente.
```

---

**P5: O que acontece se um protocolo for hackeado?**

```
Depende da gravidade. Pra incidentes menores resolvidos rapidamente, podemos manter o protocolo listado com uma nota de alerta atualizada. Pra exploits graves onde fundos de usuarios sao perdidos permanentemente, removemos o protocolo da nossa lista e ajustamos estrategias afetadas. Se o exploit afetou uma versao anterior que nao usamos, podemos manter o protocolo listado com um alerta claro. Veja nossos criterios de selecao acima pra detalhes. Sempre comunicaremos mudancas aos nossos usuarios.
```

---

**P6: Por que alguns protocolos tem badges de alerta?**

```
O badge de alerta ambar significa que o protocolo teve um incidente de seguranca notavel, problema regulatorio ou perfil de risco elevado comparado aos pares. Incluimos esses protocolos porque ainda cumprem nossos criterios gerais, mas queremos que voce veja o quadro completo. Os detalhes estao em cada card.
```

---

**P7: O que e TVL e por que importa?**

```
TVL significa Total Value Locked (Valor Total Bloqueado). E o valor total de dinheiro depositado num protocolo por todos os usuarios no mundo. TVL mais alto geralmente significa que mais pessoas confiam no sistema com dinheiro de verdade. Nao e garantia de seguranca, mas e um sinal que levamos em conta.
```

---

**P8: Preciso interagir com esses protocolos pessoalmente?**

```
Nao. O diBoaS cuida de todas as interacoes com os protocolos quando voce escolhe uma estrategia. Voce nao precisa criar contas em nenhum protocolo, gerenciar wallets em diferentes blockchains ou entender os detalhes tecnicos. Essa pagina existe pela transparencia, nao porque voce precisa fazer algo com ela.
```

---

## SECAO 8: LISTA DE ESPERA / CTA

**Transicao:**

```
Gostou do que viu? Entra na lista de espera.
```

**CTA:**

Usa o componente compartilhado `WaitlistSection`. Sem copy personalizado necessario.

---

## SECAO 9: RODAPE

**Ultima atualizacao:**

```
Ultima atualizacao: fevereiro de 2026
```

**Fontes de dados:**

```
Fontes de dados: DeFiLlama (TVL), documentacao oficial de protocolos, relatorios de auditoria de seguranca publicados, SEC EDGAR (registros regulatorios), CoinGecko e comunicacoes diretas com protocolos.
```

**Aviso principal:**

```
As informacoes nesta pagina sao exclusivamente para fins educacionais e de transparencia. Nao constituem assessoria de investimentos, assessoria financeira ou recomendacao de uso de qualquer protocolo listado. A inclusao de protocolos reflete nossa pesquisa e nao implica endosso por ou afiliacao com qualquer protocolo listado. Todos os protocolos DeFi carregam risco tecnico, risco de smart contract, risco de mercado, risco de liquidez e risco de perda de lastro de stablecoins. Performance, TVL e status regulatorio dos protocolos podem mudar a qualquer momento. Use apenas dinheiro que voce pode perder. diBoaS nao e um banco e seus fundos nao sao segurados.
```

**CVM 3-Warning (rodape, complementar ao banner acima da dobra):**

```
1. Retornos passados nao sao garantia de retorno futuro.
2. Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido.
3. Percentuais prospectivos refletem apenas a opiniao do autor, com base em informacoes disponiveis a epoca e consideradas confiaveis.
```

**Divulgacao de IA:**

```
Determinados conteudos nesta plataforma, incluindo analises de mercado e materiais educacionais, sao gerados ou assistidos por inteligencia artificial. Conteudo gerado por IA pode conter erros ou limitacoes. Usuarios devem verificar informacoes de forma independente antes de tomar decisoes financeiras.
```

**Divulgacao US:**

```
diBoaS e uma interface nao custodial que fornece acesso a protocolos de financas descentralizadas. diBoaS nao e registrado na SEC, CFTC, FinCEN ou qualquer agencia regulatoria estadual. O tratamento regulatorio de DeFi nos EUA esta evoluindo. Voce e responsavel por determinar se o uso dessa interface esta em conformidade com as leis aplicaveis.
```

**Links externos:**

```
Links externos nesta pagina levam a sites de terceiros nao controlados pelo diBoaS. Nao somos responsaveis pelo conteudo, praticas de privacidade ou disponibilidade desses sites.
```

**Assessoria profissional:**

```
Considere consultar um assessor de investimentos antes de tomar decisoes financeiras.
```

**(c) 2026 diBoaS. Todos os direitos reservados.**

---

## NOTAS DE LOCALIZACAO PT-BR

### Decisoes de adaptacao

1. **"A gente" em vez de "nos":** Padrao fintech brasileiro. Nubank, Rico, XP usam tom conversacional. "Pra" permitido no corpo do texto.

2. **"Poupanca" como referencia mental:** Todo brasileiro conhece a poupanca. "Pergunta pro seu banco" toca diretamente na experiencia brasileira, onde rendimentos da poupanca sao inferiores ao CDI.

3. **Selic/CDI como ancora:** Brasileiro compara tudo com "rendendo 100% do CDI". Essa referencia mental e implicita na pagina de protocolos mas explicita na pagina de estrategias.

4. **CVM 3-Warning OBRIGATORIO:** Substitui completamente MiCA. Deve aparecer acima da dobra E no rodape. Nao pode ser dispensado. Exigencia regulatoria brasileira.

5. **SEM MiCA:** Art. 68 e Art. 7 do MiCA NAO se aplicam ao Brasil. Removidos completamente.

6. **Formato numerico:** Virgula como separador decimal (0,39%), ponto como separador de milhar (1.000). Padrao brasileiro.

7. **Moeda em USD:** TVL exibido em USD (padrao internacional DeFi). Valores minimos de investimento convertidos pra R$10 na pagina de estrategias, mas nao se aplica aqui (nao ha valores de investimento na pagina de protocolos).

8. **"Assessor de investimentos":** Em vez de "financial advisor". No Brasil, o profissional regulado e o assessor de investimentos (registrado na CVM).

9. **Nomes de protocolos em ingles:** Nomes tecnicos nao sao traduzidos. "Porto Seguro" etc. sao nomes de estrategias, nao de protocolos.

10. **Tom mais quente:** O portugues brasileiro permite um tom mais informal e acolhedor que o ingles ou europeu. Isso reflete a cultura brasileira de comunicacao financeira (fintechs brasileiras sao conhecidas por linguagem acessivel).
