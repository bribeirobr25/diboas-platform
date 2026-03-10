# diBoaS Pagina de Estrategias — Copy FINAL (PT-BR)

## Status do Documento

| Campo | Valor |
|-------|-------|
| Versao | FINAL — Pos-CLO + Pos-Copywriter |
| Idioma | Portugues Brasileiro (PT-BR) |
| Data | 27 de fevereiro de 2026 |
| Base | STRATEGIES_PAGE_FINAL_EN.md |
| Adaptacao Cultural | Completa (nao e traducao literal) |
| CLO Review | Todos os fixes P0/P1 aplicados. P0-3 taxas confirmadas pelo CEO (Fee Lab v3.3: entrada GRATIS, saida 0,39%). |
| Copywriter Review | Todos os 3 fixes + 4 polish aplicados. Aprovado para producao. |
| Pendente | Nada. Todas as aprovacoes concluidas. |

## Notas de Implementacao para CTO / Claude Code

Este documento contem a versao completa em portugues brasileiro da pagina de Estrategias do diBoaS. ADAPTACAO CULTURAL, nao traducao literal.

### Diferencas Criticas em Relacao ao EN

| Item | EN | PT-BR | Motivo |
|------|-----|-------|--------|
| Moeda | $1,000 exemplos | R$1.000 exemplos | Moeda local |
| Minimo | $5 | R$10 | Valor de entrada para BR |
| Cenarios | "trip, wedding, car" | "viagem, casamento, carro" | Mesmo conceito, linguagem natural |
| Inflacao | Implicita | "Ganhar mais que a Selic" / "acima da inflacao" | Selic/CDI e referencia universal no BR |
| Separador decimal | 0.39% (ponto) | 0,39% (virgula) | Formato numerico brasileiro |
| Separador de milhar | 1,000 (virgula) | 1.000 (ponto) | Formato numerico brasileiro |
| Regulatorio | MiCA (Art. 68 + Art. 7) | CVM 3-Warning (acima da dobra, obrigatorio) | Jurisdicao brasileira. SEM MiCA. |
| Tom | Warm, direct | Mais quente, mais informal, "pra" permitido | Cultura brasileira |
| "Reserva de emergencia" | "Emergency fund" | Conceito central na cultura financeira BR | Todo brasileiro educado financeiramente conhece esse termo |
| Taxas | "Start a strategy (invest)" | "Aplicar em uma estrategia" | "Aplicar" e mais natural que "investir" para o publico Adelaide |
| Rendimento referencia | Nenhum explicito | CDI/Selic como ancora mental | Brasileiro compara tudo com "rendendo 100% do CDI" |

### Regras Globais

- NENHUM travessao. Usar virgulas, pontos, dois pontos ou quebras de linha.
- NENHUM emoji no corpo do texto.
- Todos os CTAs sao botoes, salvo indicacao contraria.
- Filtro Adelaide se aplica a todo texto voltado ao consumidor.
- Secoes Version A/B: condicional. CTO seleciona no build.

### Fluxo de Secoes

| # | Secao | Tipo |
|---|-------|------|
| 0 | CVM 3-Warning | Banner obrigatorio acima da dobra |
| 1 | Hero | Estatico |
| 2 | Matriz de Estrategias | Tabela interativa |
| 3 | Cards de Estrategia (x10) | Grid de cards |
| 4 | Onde Seu Dinheiro Vai | Tabela de protocolos + detalhe expansivel |
| 5 | Quanto Custa | Tabela de taxas |
| 6 | Como Escolher | Guia de decisao |
| 7 | FAQ (x11) | Acordeao |
| 8 | Lista de Espera / CTA | Captura de email |
| 9 | Rodape | Avisos legais |

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
O acesso que eles guardavam. Agora e voce quem escolhe.
```

**Sub-headline:**

```
10 estrategias. Objetivos diferentes. Niveis de risco diferentes. Nenhuma e "a melhor". A melhor e a que combina com onde voce esta e onde quer chegar.
```

**Linha de confianca (texto menor):**

```
Testadas com quase 4 anos de dados reais. Crises, recuperacoes, tudo. Construidas em sistemas que ja protegeram bilhoes em ativos (verificavel no DeFiLlama).
```

**Limitacao honesta (micro-texto abaixo da linha de confianca):**

```
Desempenho passado nao garante resultados futuros. Todas as estrategias envolvem risco.
```

---

**Transicao:**

```
Veja como encontrar a sua.
```

---

## SECAO 2: MATRIZ DE ESTRATEGIAS

**H2:**

```
Escolha sua estrategia
```

**Instrucoes:**

```
Seu objetivo na esquerda. Sua tolerancia a risco na direita.
```

**Tabela da matriz:**

| Seu Objetivo | Retornos Estaveis | Potencial de Crescimento |
|--------------|-------------------|--------------------------|
| Reserva de Emergencia | Porto Seguro | |
| Ganhar Acima da Inflacao | | Crescimento Estavel |
| Curto Prazo (< 2 anos) | Goleiro | Progresso Firme |
| Medio Prazo (2-5 anos) | Construtor Paciente | Construtor Equilibrado |
| Longo Prazo (5-10 anos) | Composicao Constante | Acelerador de Patrimonio |
| Construcao de Patrimonio (10+ anos) | Maximizador de Retorno | Potencia Maxima |

**Nota sobre nomes:** Os nomes das estrategias foram mantidos em portugues para conexao emocional com o publico brasileiro. Cada nome reflete a personalidade da estrategia.

**Abaixo da tabela:**

```
Nao sabe por onde comecar? Comece pelo Porto Seguro. Aprenda primeiro. Troque quando quiser. Sem multas.
```

---

**Transicao:**

```
Veja o que cada uma faz.
```

---

## SECAO 3: TODOS OS 10 CARDS DE ESTRATEGIA

Cards exibidos em grid: 2 colunas no desktop, 1 no mobile. Estrategias estaveis tem borda esquerda em teal. Estrategias de crescimento tem borda esquerda em verde.

---

### Card 1: Porto Seguro

**Badge:** Retornos Estaveis | Reserva de Emergencia

**Tagline:** Sua reserva de emergencia que realmente rende

**Descricao:**

```
Aqui e onde voce guarda o dinheiro que pode precisar amanha. Ele precisa estar la quando voce precisar. Sem surpresas.

Porto Seguro usa apenas dolares digitais estaveis. Sem exposicao a precos de ativos digitais. Seus R$1.000 foram feitos pra ficar perto de R$1.000 enquanto rendem, embora as stablecoins usadas possam variar de valor.
```

**Alocacao:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Nota de alocacao (micro-texto):**

```
Seu dinheiro e distribuido entre tres sistemas de emprestimo independentes pra reduzir o risco.
```

**Estatisticas:**

| Chance de perder dinheiro | Menos de 1% |
| Retorno anual tipico | 6-10% ao ano |
| Quao agitado e o caminho? | Muito tranquilo. Seu saldo ficou estavel ao longo de todo o nosso teste de 4 anos. |
| Nivel de risco | Minimo. Os riscos incluem possiveis vulnerabilidades tecnicas nos sistemas utilizados e a possibilidade de que as stablecoins usadas percam sua paridade com o dolar. Esses sistemas operam com seguranca ha anos. |

**Uso comum:**

```
Primeira reserva de emergencia. Aprender como tudo funciona sem oscilacao de preco.
```

---

### Card 2: Crescimento Estavel

**Badge:** Potencial de Crescimento (30%) | Ganhar Acima da Inflacao

**Tagline:** Supere a inflacao com risco controlado

**Descricao:**

```
Seu dinheiro e dividido: 70% rende de forma estavel, 30% participa do crescimento de ativos digitais. Voce aceita alguma oscilacao em troca de retornos potencialmente maiores.

Isso nao e reserva de emergencia. E pra dinheiro que voce quer fazer crescer acima da inflacao, com o entendimento de que a parte de crescimento vai se mover com os precos do mercado.
```

**Alocacao:**

```
70% Sky SSR + 30% Sanctum INF
```

**Nota de alocacao (micro-texto):**

```
A maior parte fica em dolares digitais estaveis. A parcela no Sanctum se move com os retornos de staking do Solana.
```

**Estatisticas:**

| Chance de perder dinheiro | Cerca de 5% |
| Retorno anual tipico | 7-12% ao ano |
| Quao agitado e o caminho? | Algumas ondas. No pior momento, seu saldo caiu temporariamente 8% antes de se recuperar. |
| Nivel de risco | Baixo. 30% do seu saldo vai se mover com os precos de ativos digitais. |

**Uso comum:**

```
Segunda camada de poupanca. Ja tem reserva de emergencia e quer crescimento acima da inflacao.
```

**Nota (micro-texto):**

```
Nao foi projetada como reserva de emergencia principal.
```

---

### Card 3: Goleiro

**Badge:** Retornos Estaveis | Curto Prazo

**Tagline:** Protegendo suas metas de curto prazo

**Descricao:**

```
Juntando pra algo nos proximos 2 anos? Uma viagem, um casamento, um carro? Isso mantém cada real trabalhando pro seu objetivo sem arriscar.

Sem exposicao a precos de ativos digitais. Crescimento previsivel.
```

**Alocacao:**

```
60% Sky SSR + 25% Aave V3 + 15% Compound V3
```

**Nota de alocacao (micro-texto):**

```
Distribuido entre sistemas de emprestimo comprovados, otimizados pra estabilidade.
```

**Estatisticas:**

| Chance de perder dinheiro | Menos de 1% |
| Retorno anual tipico | 6-9% ao ano |
| Quao agitado e o caminho? | Muito tranquilo. |
| Nivel de risco | Minimo. Projetado para preservacao de capital com retornos estaveis. Riscos incluem possiveis vulnerabilidades tecnicas e a possibilidade de que as stablecoins usadas percam sua paridade com o dolar. |

**Uso comum:**

```
Meta especifica dentro de 2 anos: viagem, casamento, carro.
```

---

### Card 4: Progresso Firme

**Badge:** Potencial de Crescimento (35%) | Curto Prazo

**Tagline:** Metas de curto prazo com potencial de crescimento

**Descricao:**

```
Voce tem uma meta nos proximos 2 anos, mas aceita alguma oscilacao se isso significar retornos maiores. A maior parte fica estavel. Uma parcela participa do crescimento de ativos digitais.
```

**Alocacao:**

```
65% Sky SSR + 35% Sanctum INF
```

**Nota de alocacao (micro-texto):**

```
A maior parte fica estavel. A parcela no Sanctum se move com os retornos de staking do Solana.
```

**Estatisticas:**

| Chance de perder dinheiro | Cerca de 7% |
| Retorno anual tipico | 7-11% ao ano |
| Quao agitado e o caminho? | Ondas moderadas. No pior momento, seu saldo caiu temporariamente 11% antes de se recuperar. |
| Nivel de risco | Baixo-Medio. Seu saldo vai se mover com os precos de ativos digitais. |

**Uso comum:**

```
Meta de curto prazo onde alguma oscilacao de preco e aceitavel.
```

---

### Card 5: Construtor Paciente

**Badge:** Retornos Estaveis | Medio Prazo

**Tagline:** Crescimento constante pra quem tem paciencia

**Descricao:**

```
Voce esta pensando em 2 a 5 anos. Talvez uma entrada pra um imovel, talvez abrir um negocio. Voce nao precisa de crescimento agressivo. Voce precisa que seu dinheiro esteja la, um pouco maior, quando voce estiver pronto.
```

**Alocacao:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Nota de alocacao (micro-texto):**

```
Mesmos sistemas estaveis do Porto Seguro, modelados pra um horizonte de medio prazo. Os retornos sao projetados de forma mais conservadora pro horizonte de 2-5 anos.
```

**Estatisticas:**

| Chance de perder dinheiro | Menos de 1% |
| Retorno anual tipico | 5-8% ao ano |
| Quao agitado e o caminho? | Muito tranquilo. |
| Nivel de risco | Minimo. Mesmo perfil estavel, otimizado pra manter por mais tempo. Riscos incluem possiveis vulnerabilidades tecnicas e a possibilidade de que as stablecoins usadas percam sua paridade com o dolar. |

**Uso comum:**

```
Entrada de imovel. Capital pra abrir um negocio. Qualquer coisa de 2 a 5 anos onde previsibilidade importa.
```

---

### Card 6: Construtor Equilibrado

**Badge:** Potencial de Crescimento (40%) | Medio Prazo

**Tagline:** Estabilidade e crescimento em uma so estrategia

**Descricao:**

```
A maior parte do seu dinheiro fica segura. Uma parte captura o crescimento de ativos digitais. Essa estrategia foi feita pra quem tem um horizonte de 3-5 anos e entende que precos sobem e descem.
```

**Alocacao:**

```
60% Sky SSR + 25% Sanctum INF + 15% Jupiter JLP
```

**Nota de alocacao (micro-texto):**

```
Uma combinacao equilibrada: retornos de emprestimo mais retornos de staking e taxas de negociacao de dois sistemas Solana.
```

**Estatisticas:**

| Chance de perder dinheiro | Cerca de 12% |
| Retorno anual tipico | 10-16% ao ano |
| Quao agitado e o caminho? | Ondas moderadas. No pior momento, seu saldo caiu temporariamente 13% antes de se recuperar. |
| Nivel de risco | Medio. 40% de exposicao a crescimento significa oscilacoes significativas pra cima e pra baixo. |

**Uso comum:**

```
Horizonte de 3-5 anos com tolerancia pra oscilacao temporaria de preco.
```

---

### Card 7: Composicao Constante

**Badge:** Retornos Estaveis | Longo Prazo

**Tagline:** Deixe o tempo trabalhar por voce

**Descricao:**

```
Voce esta jogando o jogo longo. 5-10 anos. Voce nao precisa correr riscos grandes porque tem o tempo do seu lado. Retornos estaveis, compostos ano apos ano.
```

**Alocacao:**

```
55% Sky SSR + 30% Aave V3 + 15% Compound V3
```

**Nota de alocacao (micro-texto):**

```
Otimizado pra composicao de longo prazo com volatilidade minima.
```

**Estatisticas:**

| Chance de perder dinheiro | Menos de 1% |
| Retorno anual tipico | 6-10% ao ano |
| Quao agitado e o caminho? | Muito tranquilo. |
| Nivel de risco | Minimo. Devagar e sempre. Riscos incluem possiveis vulnerabilidades tecnicas e a possibilidade de que as stablecoins usadas percam sua paridade com o dolar. |

**Uso comum:**

```
Horizonte de 5-10 anos. Prioriza consistencia em vez de retorno maximo.
```

---

### Card 8: Acelerador de Patrimonio

**Badge:** Potencial de Crescimento (70%) | Longo Prazo

**Tagline:** Pra quem ja estudou o assunto

**Descricao:**

```
Isso nao e pra todo mundo. 70% de exposicao a crescimento significa que seu saldo vai se mover significativamente com os precos de ativos digitais.

Voce precisa conseguir ver seu saldo cair mais de 40% e nao entrar em panico. Se essa frase te deixou desconfortavel, essa nao e a estrategia certa pra voce.
```

**Alocacao:**

```
30% Sky SSR + 35% Sanctum INF + 35% Jupiter JLP
```

**Nota de alocacao (micro-texto):**

```
Fortemente inclinada pro crescimento. Retornos de staking mais retornos de taxas de negociacao de dois sistemas Solana.
```

**Estatisticas:**

| Chance de perder dinheiro | Cerca de 24% |
| Retorno anual tipico | Altamente variavel. Pode ser negativo ou ultrapassar 50%. |
| Quao agitado e o caminho? | Grandes oscilacoes. No pior momento, seu saldo caiu 47% antes de se recuperar. |
| Nivel de risco | Alto. Chance significativa de perdas relevantes em prazos mais curtos. |

**Uso comum:**

```
Alocacao de longo prazo com alta tolerancia a volatilidade.
```

**Aviso (estilizado como callout):**

```
Em milhares de simulacoes, os resultados variaram de -60% a +200%+. O numero da queda (47%) e o pior declinio temporario durante nosso teste. A faixa (-60% a +200%+) e a amplitude completa das simulacoes. Apenas pra quem tolera perdas significativas.
```

---

### Card 9: Maximizador de Retorno

**Badge:** Retornos Estaveis | Construcao de Patrimonio

**Tagline:** Maximo retorno, minima volatilidade

**Descricao:**

```
Voce quer os maiores retornos estaveis ao longo de 10+ anos sem exposicao a precos de ativos digitais. Sem componente de crescimento. Apenas retornos otimizados nos tres sistemas de emprestimo estaveis.
```

**Alocacao:**

```
45% Sky SSR + 35% Aave V3 + 20% Compound V3
```

**Nota de alocacao (micro-texto):**

```
Nossa configuracao estavel de maior retorno.
```

**Estatisticas:**

| Chance de perder dinheiro | Menos de 1% |
| Retorno anual tipico | 7-11% ao ano |
| Quao agitado e o caminho? | Muito tranquilo. |
| Nivel de risco | Minimo. Nossa estrategia estavel de maior retorno. Riscos incluem possiveis vulnerabilidades tecnicas e a possibilidade de que as stablecoins usadas percam sua paridade com o dolar. |

**Uso comum:**

```
Horizonte de 10+ anos. Maximo retorno estavel, zero exposicao a cripto.
```

---

### Card 10: Potencia Maxima

**Badge:** Potencial de Crescimento (85%) | Construcao de Patrimonio

**Tagline:** Risco maximo. Potencial maximo.

**Descricao:**

```
Essa e nossa estrategia mais agressiva. 85% de exposicao a crescimento. Feita pra uma parte pequena do seu patrimonio que voce esta disposto a perder completamente.

O lado bom? Em cenarios simulados raros, os retornos ultrapassaram 1.000%. O lado ruim? 27% de chance de perda. Seu saldo caiu 66% no pior momento do nosso teste.
```

**Alocacao:**

```
15% Sky SSR + 30% Sanctum INF + 35% Jupiter JLP + 20% Jito
```

**Nota de alocacao (micro-texto):**

```
Exposicao maxima a crescimento: staking, taxas de negociacao e recompensas MEV em tres sistemas Solana com um buffer minimo de estabilidade.
```

**Estatisticas:**

| Chance de perder dinheiro | Cerca de 27% |
| Retorno anual tipico | Extremamente variavel. De perdas grandes a ganhos extraordinarios. |
| Quao agitado e o caminho? | Montanha-russa. No pior momento, seu saldo caiu 66% antes de se recuperar. |
| Nivel de risco | Muito Alto. Perda quase total e possivel. Use apenas o que pode perder completamente. |

**Uso comum:**

```
Alocacao pequena do patrimonio com entendimento total do potencial de perda.
```

**Requisitos de acesso (estilizado como callout):**

```
6+ meses de conta. Saldo minimo de R$5.000. Maximo de 20% do seu patrimonio total. Periodo de espera de 24 horas antes da ativacao. Reconhecimento de risco obrigatorio.
```

**Nota sobre minimo:** R$5.000 (nao R$1.000 como no EN) reflete a realidade brasileira: este e o equivalente proporcional ao poder de compra, e garante que o usuario tem capacidade financeira compativel com o nivel de risco.

**Aviso (estilizado como callout proeminente):**

```
Em milhares de simulacoes, os resultados variaram de -78% a +400%+. O numero da queda (66%) e o pior declinio temporario durante nosso teste. A faixa (-78% a +400%+) e a amplitude completa das simulacoes. Nunca coloque dinheiro aqui que voce precisa.
```

---

**Abaixo de todos os cards, limitacao honesta:**

```
Todas as estatisticas sao baseadas em analise historica (maio 2022 - dezembro 2025) e milhares de simulacoes Monte Carlo. Para protocolos mais recentes, os retornos de periodos anteriores sao estimados usando proxies validados baseados em sistemas similares. O que aconteceu no passado pode nao acontecer de novo. Esses numeros ajudam voce a comparar estrategias, nao a prever o futuro.
```

---

**Transicao:**

```
Agora voce sabe o que cada estrategia faz. Veja onde seu dinheiro realmente vai.
```

---

## SECAO 4: ONDE SEU DINHEIRO VAI

**H2:**

```
Onde seu dinheiro vai
```

**Introducao:**

```
Cada estrategia e construida a partir de uma combinacao desses protocolos. Eles sao independentes, de codigo aberto, e voce pode verificar tudo por conta propria.
```

**Tabela de protocolos:**

| Protocolo | Tipo | Rede | Ativo | Exposicao Cripto | Em operacao desde |
|-----------|------|------|-------|------------------|-------------------|
| Sky SSR | Rendimento em stablecoin | Arbitrum | USDS | Nenhuma | 2022 |
| Aave V3 | Emprestimo | Arbitrum | USDC | Nenhuma | 2020 (V3: 2022) |
| Compound V3 | Emprestimo | Arbitrum | USDC | Nenhuma | 2018 (V3: 2022) |
| Sanctum INF | Staking liquido (cesta de LSTs) | Solana | SOL | Sim, se move com o preco do SOL | 2024 |
| Jupiter JLP | LP de perpetuos | Solana | 45% SOL / 27% ETH / 27% BTC / 1% outros | Sim, se move com precos de SOL, ETH, BTC | 2024 |
| Jito | Staking liquido + MEV | Solana | JitoSOL | Sim, se move com o preco do SOL | 2022 |

**Abaixo da tabela (micro-texto):**

```
Jito e usado apenas no Potencia Maxima. Todos os outros protocolos aparecem em multiplas estrategias. Os nomes dos protocolos sao usados por transparencia. Sua inclusao nao implica endosso do diBoaS por esses protocolos. Para protocolos em operacao ha menos de 4 anos, retornos de periodos anteriores sao estimados usando metodologias proxy validadas baseadas em sistemas similares.
```

**Detalhe expansivel (acordeao opcional por protocolo, fechado por padrao):**

Cada protocolo tem uma secao expansivel com:
- Resumo de uma linha de como os retornos sao gerados
- Status de auditoria
- Link pro site do protocolo
- Link pra pagina do DeFiLlama mostrando TVL ao vivo

**Abaixo dos protocolos:**

```
Codigo aberto e auditado nao significa livre de risco. Codigo pode ter vulnerabilidades nao descobertas. Nos reduzimos esse risco distribuindo seu dinheiro entre multiplos protocolos independentes, mas nao podemos elimina-lo.
```

---

**Transicao:**

```
Voce conhece as estrategias. Conhece os protocolos. Veja quanto custa.
```

---

## SECAO 5: QUANTO CUSTA

**H2:**

```
Quanto custa
```

**Introducao:**

```
Uma taxa. So isso.
```

**Tabela de taxas:**

| Acao | Taxa | Exemplo |
|------|------|---------|
| Aplicar em uma estrategia | GRATIS | Aplica R$1.000: custa R$0 |
| Resgatar de uma estrategia | 0,39% | Resgata R$1.000: custa R$3,90 |

**Nota sobre terminologia:** "Aplicar/resgatar" sao os termos naturais no Brasil para investir e desinvestir. Mais familiar que "investir/vender" para o publico Adelaide.

**Abaixo da tabela:**

```
Sem taxa mensal. Sem taxa de administracao. Sem taxa de performance. Sem cobrancas escondidas.

Colocar dinheiro em uma estrategia nao custa nada. Nos so cobramos quando voce resgata. Se seu dinheiro esta em uma estrategia rendendo, nos nao ganhamos nada ate voce sair.
```

**Micro-texto:**

```
Taxas de rede de terceiros podem se aplicar (normalmente menos de R$0,05). Para a tabela completa de taxas incluindo transferencias e saques, veja nossa pagina de taxas.
```

---

**Transicao:**

```
Nao sabe qual escolher? Comece aqui.
```

---

## SECAO 6: COMO ESCOLHER

**H2:**

```
Comece aqui
```

### Pra que e esse dinheiro?

```
Reserva de emergencia: Porto Seguro. Dinheiro que voce pode precisar amanha fica estavel.

Ganhar acima da inflacao: Crescimento Estavel. Seu dinheiro trabalha mais, mas 30% se move com o mercado.

Algo nos proximos 2 anos: Goleiro (estavel) ou Progresso Firme (com crescimento). Depende de como voce se sente com oscilacao de preco.

Algo em 2-5 anos: Construtor Paciente (estavel) ou Construtor Equilibrado (com crescimento). Mais tempo significa que voce pode considerar mais crescimento.

Patrimonio de longo prazo: Composicao Constante, Acelerador de Patrimonio, Maximizador de Retorno ou Potencia Maxima. Seu horizonte de tempo e sua maior vantagem.
```

### Como voce se sente com oscilacao de preco?

```
"Nao quero nenhuma." Fique na coluna Retornos Estaveis. Cinco estrategias, zero exposicao a cripto.

"Eu entendo e consigo esperar as quedas passarem." Considere a coluna Potencial de Crescimento. Quanto mais longo seu horizonte, mais exposicao a crescimento voce pode considerar.

"Nao tenho certeza." Comece no estavel. Aprenda como tudo funciona com dinheiro que voce esta confortavel em arriscar. Voce sempre pode adicionar exposicao a crescimento depois.
```

### O que voce faria se seu saldo caisse 20%?

```
"Eu entraria em panico e sacaria." Apenas estrategias de Retornos Estaveis. Isso nao e fraqueza. E autoconhecimento.

"Eu esperaria recuperar." Estrategias de crescimento baixo-medio podem funcionar pra voce.

"Eu colocaria mais dinheiro." Voce pode estar pronto pra mais exposicao a crescimento. Isso e inteligente se for planejado. Menos inteligente se for desespero tentando recuperar o que perdeu. Tenha certeza de qual dos dois voce quer dizer.
```

**Promessa da marca + regra de ouro:**

```
Nos mostramos os dois lados, as oportunidades e os riscos, sempre.

Na duvida, comece no seguro. Voce sempre pode subir depois. Considere consultar um consultor financeiro licenciado se nao tiver certeza de qual abordagem se encaixa na sua situacao.
```

---

**Transicao:**

```
Tem perguntas? Otimo.
```

---

## SECAO 7: FAQ

**H2:**

```
Antes de decidir
```

### Posso trocar de estrategia?

```
Sim, a qualquer momento. Sem multas. Sem perguntas.

Algo pra ter em mente: se voce trocar durante uma queda do mercado, pode travar uma perda temporaria. O melhor momento pra trocar e quando seus objetivos mudam, nao quando o mercado se move.
```

### Posso usar mais de uma estrategia ao mesmo tempo?

```
Sim. Muita gente faz isso.

Pense como contas diferentes pra propositos diferentes: reserva de emergencia no Porto Seguro, poupanca pra ferias no Goleiro, patrimonio de longo prazo no Construtor Equilibrado.
```

### Como funciona o rebalanceamento?

```
Quando os movimentos do mercado empurram sua alocacao pra fora do alvo (mais de 10% de desvio), nos avisamos voce. Por exemplo, se seu alvo e 60% estavel e 40% crescimento, e os movimentos do mercado empurrarem pra perto de 55/45 ou mais longe, a gente avisa.

Voce vai ver exatamente o que mudou e por que. Ai voce decide: aprova o rebalanceamento ou deixa como esta.

Nos nunca movemos seu dinheiro sem sua aprovacao.
```

### Esses retornos sao garantidos?

```
Nao. E qualquer um que garanta retornos esta mentindo pra voce.

O que podemos dizer: testamos cada estrategia com quase 4 anos de dados reais de mercado (maio 2022 - dezembro 2025). Os numeros sao baseados no que realmente aconteceu e em milhares de simulacoes Monte Carlo.

Esses numeros ajudam voce a comparar estrategias e entender a faixa de resultados possiveis. Eles nao preveem o futuro. Comece com o que voce pode se dar ao luxo de aprender.
```

### E se um dos sistemas tiver um problema?

```
Esse e um risco real. Esses sistemas sao construidos em codigo, e codigo pode ter vulnerabilidades.

Nos reduzimos esse risco usando apenas sistemas que protegeram bilhoes de dolares por anos, distribuindo seu dinheiro entre multiplos sistemas independentes, e monitorando continuamente pra atividade incomum.

Nao podemos eliminar esse risco. Ninguem pode. Mas podemos ser honestos sobre ele.
```

### Onde meu dinheiro realmente vai?

```
Os protocolos por tras de cada estrategia estao listados nesta pagina com seus nomes, redes, tipos de ativo e historico. Sem precisar se cadastrar. Sem informacao escondida.

Sky SSR, Aave V3 e Compound V3 cuidam dos retornos estaveis. Sanctum INF, Jupiter JLP e Jito cuidam do crescimento. Cada estrategia e uma combinacao especifica desses protocolos com porcentagens exatas mostradas em cada card de estrategia acima.

Nos escolhemos esses protocolos porque sao transparentes, testados em batalha, e voce pode verificar tudo por conta propria.
```

### Por que tem requisitos extras pro Potencia Maxima?

```
Porque queremos proteger voce de voce mesmo.

Potencia Maxima pode perder a maior parte do seu valor. Os requisitos nao existem pra te excluir. Existem pra garantir que voce pensou bem: 6 meses de experiencia, saldo minimo, limite de 20% do seu patrimonio, e um periodo de espera de 24 horas.
```

### Meu dinheiro esta seguro?

**Versao A (Nao-Custodial):**

```
Seu dinheiro e protegido por voce. Sua carteira, suas chaves. Ninguem no diBoaS pode acessar seus fundos sem sua autorizacao.

Dito isso, isso nao e uma conta bancaria. Seus fundos trabalham atraves de sistemas automatizados construidos em codigo. O valor pode oscilar, e voce pode perder parte ou todo o seu dinheiro. Nao existe seguro de deposito.

Nos mostramos os dois lados, as oportunidades e os riscos, sempre.
```

**Versao B (MPC):**

```
Seu dinheiro e protegido por seguranca multi-parte. Sua autorizacao e necessaria pra cada transacao. O diBoaS detem uma parcela parcial da chave pra fins de recuperacao, mas nao pode mover seus fundos unilateralmente.

Dito isso, isso nao e uma conta bancaria. Seus fundos trabalham atraves de sistemas automatizados construidos em codigo. O valor pode oscilar, e voce pode perder parte ou todo o seu dinheiro. Nao existe seguro de deposito.

Nos mostramos os dois lados, as oportunidades e os riscos, sempre.
```

### Posso perder tudo?

```
Nas estrategias estaveis (Porto Seguro, Goleiro, Construtor Paciente, Composicao Constante, Maximizador de Retorno): a chance de perda total e extremamente baixa. Em quase 4 anos de testes e milhares de simulacoes, isso nao aconteceu. Mas "extremamente baixo" nao e zero.

Nas estrategias de crescimento: quanto maior a porcentagem de crescimento, maior a faixa de resultados possiveis. Potencia Maxima com 85% de exposicao a crescimento teve quedas simuladas ultrapassando 78%.

O risco e real. Nos nao minimizamos isso. Nos ajudamos voce a escolher o nivel que combina com o que voce aguenta.
```

### Qual a diferenca pra uma poupanca?

```
A caderneta de poupanca e protegida pelo FGC (ate R$250.000 por instituicao). Seu dinheiro rende uma taxa fixa. O banco controla tudo.

As estrategias do diBoaS usam sistemas automatizados de emprestimo e staking. Os retornos sao variaveis. Seu dinheiro nao e segurado. Voce controla atraves da sua propria carteira.

A troca: retornos potencialmente maiores, mas voce aceita o risco que vem com um tipo diferente de sistema.
```

**Nota:** No Brasil, a referencia natural e a poupanca (caderneta de poupanca), nao "bank savings account". FGC e o Fundo Garantidor de Creditos, equivalente ao FDIC americano, com limite de R$250.000 por CPF por instituicao.

---

**Transicao:**

```
Ainda aqui depois de todos esses avisos de risco? Otimo. Voce pesquisou mais do que a maioria.
```

---

## SECAO 8: LISTA DE ESPERA / CTA

**H2:**

```
Gostou do que viu?
```

**Body:**

```
Voce vai escolher sua estrategia quando lancarmos. Por enquanto, deixe seu email e garanta sua vaga.
```

**[Campo de email: Seu endereco de email]**

**Botao CTA:**

```
Quero acesso antecipado
```

**Abaixo do CTA:**

```
Sem spam. Apenas seu convite quando estivermos prontos.
```

**Checkbox:**

```
Concordo com a Politica de Privacidade
```

**Abaixo do checkbox (micro-texto):**

```
Gratuito. Sem compromisso. Escolha sua estrategia quando lancarmos.
```

---

## SECAO 9: RODAPE

**Aviso principal:**

```
Todos os dados de desempenho sao baseados em analise historica (maio 2022 - dezembro 2025) e milhares de simulacoes Monte Carlo. Desempenho passado nao garante resultados futuros. Seu dinheiro e colocado em sistemas automatizados que carregam risco tecnico, risco de mercado, risco de liquidez e risco de desvalorizacao de stablecoin. Estrategias de crescimento envolvem risco adicional de volatilidade de preco. Estrategias de crescimento usam protocolos na blockchain Solana; eventos que afetem o Solana especificamente podem impactar todas as estrategias de crescimento simultaneamente. Use apenas dinheiro que voce pode perder. O diBoaS nao e um banco e seus fundos nao sao segurados.
```

**Divulgacao de IA:**

```
Certos conteudos nesta plataforma, incluindo analise de mercado e materiais educacionais, sao gerados ou assistidos por inteligencia artificial. Conteudo gerado por IA pode conter erros ou limitacoes. Usuarios devem verificar as informacoes de forma independente antes de tomar decisoes financeiras.
```

**Divulgacao de Resultados Ficticios:**

```
Retornos projetados, estimativas de probabilidade e resultados de simulacao nesta pagina sao ilustrativos e nao representam resultados garantidos. Projecoes de calculadora sao baseadas em cenarios hipoteticos e medias historicas. Resultados reais vao variar.
```

**Aviso de Aconselhamento Profissional:**

```
As informacoes nesta pagina sao apenas para fins educacionais e informativos. Nao constituem aconselhamento de investimento, aconselhamento financeiro, nem qualquer outra forma de aconselhamento profissional. Considere consultar um consultor financeiro licenciado antes de tomar decisoes de investimento.
```

**Nota:** Nenhum bloco MiCA no PT-BR. Os avisos CVM ja foram colocados acima da dobra na Secao 0.

**(c) 2026 diBoaS. Todos os direitos reservados.**

---

## NOTAS DE LOCALIZACAO PT-BR

### Decisoes de Adaptacao

1. **Nomes das estrategias traduzidos:** Diferente dos nomes de protocolos (que sao tecnicos e ficam em ingles), os nomes das estrategias sao emocionais e de marketing. Traduzir para "Porto Seguro", "Potencia Maxima" etc. cria conexao mais forte com o publico brasileiro.

2. **"Poupanca" como referencia:** No FAQ "Qual a diferenca pra uma poupanca?", usamos a caderneta de poupanca como ponto de comparacao (nao "bank savings account"). Todo brasileiro conhece a poupanca. FGC (R$250.000) e o equivalente ao FDIC.

3. **"Aplicar/resgatar" em vez de "investir/vender":** Termos mais familiares pro publico Adelaide brasileiro. "Aplicar" e o que todo mundo diz quando coloca dinheiro em algo.

4. **R$5.000 minimo pro Potencia Maxima** (em vez de $1,000/R$1.000): Ajuste proporcional ao poder de compra E funciona como protecao adicional. R$1.000 e muito pouco pra arriscar em uma estrategia de 85% crescimento no contexto brasileiro.

5. **"Ganhar Acima da Inflacao"** em vez de "Beat Inflation": No Brasil, com a Selic historicamente alta, "ganhar acima da inflacao" e uma frase que todo investidor iniciante entende.

6. **Formato numerico:** Virgula como separador decimal (0,39%), ponto como separador de milhar (R$1.000). Padrao brasileiro.
