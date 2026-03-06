# diBoaS B2B Landing Page — Copy Final (PT-BR)

## Status do Documento

| Campo | Valor |
|-------|-------|
| Versao | FINAL — Pronta para Producao |
| Idioma | Portugues Brasileiro (PT-BR) |
| Base | EN B2B Final Champion Copy (Sessions 019-020) |
| Adaptacao Cultural | Completa (nao e traducao literal) |
| Aprovado por | CMO Board, CLO Board, Copywriter |
| Data | 26 de fevereiro de 2026 |
| Bloqueios | 0 |

## Notas de Implementacao para CTO / Claude Code

Versao completa em portugues brasileiro da landing page B2B do diBoaS. ADAPTACAO CULTURAL profunda para a realidade empresarial brasileira, nao traducao literal. Serve DUAS audiencias na MESMA pagina: PMEs (pequenas e medias empresas) e startups/empresas maiores.

### Diferencas Criticas em Relacao ao EN

| Item | EN | PT-BR | Motivo |
|------|-----|-------|--------|
| Moeda | $5 minimo, $ exemplos | R$10 minimo, R$ exemplos | Valor acessivel para BR |
| Dor PME | Card processing fees (2-3%) | Taxa da maquininha (2-5%) + antecipacao de recebiveis (30 dias de espera) | Brasil tem taxas de maquininha mais altas E o lojista espera 30 dias para receber |
| Dor startup | Idle cash earning 0.5% | Dinheiro parado rendendo CDI (que mal cobre inflacao) | Contexto brasileiro: CDI/Selic vs inflacao |
| Transferencias | $25-$50 wire fees | PIX e gratuito domestico. A dor e transferencia INTERNACIONAL + acesso ao dolar | PIX mudou o jogo no Brasil. A dor real e internacional |
| Cenarios | Coffee shop, startup | Padaria, cafeteria, startup em SP | Realidade brasileira |
| Regulatorio | MiCA (Art. 68 + Art. 7) | CVM Circular 6/2019 (3 avisos obrigatorios) | Jurisdicao brasileira. SEM MiCA. |
| Tom | Warm but direct | Mais informal, mais quente, mais proximo | Cultura brasileira. Pode usar "voce" naturalmente |
| Freelancer | Buenos Aires | Miami / Portugal / Argentina | Brasileiros enviam muito para EUA e Europa |
| Antecipacao | Nao existe no EN | Conceito central: "parar de pagar para receber seu proprio dinheiro" | Antecipacao de recebiveis e uma dor exclusiva do Brasil |
| Maquininha | "Card processor" | "Maquininha" / "adquirente" | Termo popular brasileiro para terminal de pagamento |
| Investimento | "Invest the savings" | "Fazer o dinheiro render" | Tom mais natural em portugues |

### Contexto Critico: O Problema da Maquininha no Brasil

No Brasil, quando um cliente paga com cartao:
1. O lojista paga 2% a 5% de taxa para a maquininha (Cielo, Rede, Stone, PagSeguro)
2. O dinheiro so cai na conta em 30 DIAS (para credito) ou 1-2 dias (debito)
3. Se o lojista quer receber antes, paga MAIS uma taxa de antecipacao (1-3% adicional)
4. No final, o lojista pode perder 5-8% de cada venda com cartao de credito

Isso significa que a proposta de valor da diBoaS e AINDA MAIS FORTE no Brasil:
- GRATIS vs 2-5% de taxa
- Dinheiro disponivel imediatamente vs 30 dias de espera
- Sem taxa de antecipacao vs 1-3% adicional

### Regras Globais (mesmas do EN)

- NENHUM travessao. Usar virgulas, pontos, dois pontos ou quebras de linha.
- NENHUM emoji no corpo do texto.
- Todos os CTAs sao botoes, salvo indicacao contraria.
- O Filtro Adelaide se aplica: sem jargao na pagina principal.
- Version A/B: condicional. CTO seleciona no build.

### Fluxo de Secoes

| # | Secao | Tipo | Audiencia |
|---|-------|------|-----------|
| 1 | Hero | Estatico | Ambos |
| 2 | Dois Mundos | Duas cards | Auto-selecao |
| 3 | Calculadora de Fluxo | Interativa (NOVA) | PME primeiro |
| 4 | Calculadora de Reserva | Interativa (refinada) | Startup primeiro |
| 5 | Historia de Origem | Estatico | Ambos |
| 6 | Como Funciona | 4 passos | Ambos |
| 7 | Tres Beneficios | 3 cards | Ambos |
| 8 | Investimento de Fluxo | Explicacao (NOVA) | PME primeiro |
| 9 | Transparencia de Taxas | Tabela | Ambos |
| 10 | Avaliacao de Encaixe | Duas colunas | Ambos |
| 11 | Sobre o Fundador | Estatico com foto | Ambos |
| 12 | Prova Social + Duplo CTA | Contador + dois caminhos | Ambos |
| 13 | FAQ | Acordeao (10 itens) | Ambos |
| 14 | Rodape | Avisos legais | Ambos |

---

## SECAO 1: HERO

**H1:**

```
O sistema nao esta quebrado. Ele foi feito pra ficar com um pedaco de tudo que voce ganha.
```

**Sub-headline:**

```
Voce perde de 2% a 5% em cada venda no cartao. E ainda espera 30 dias pra receber. O dinheiro que sobra no caixa? Rende pro banco, nao pra voce. Isso muda agora.
```

**CTA Button:**

```
Veja o que voce esta perdendo
```

CTA scroll para: Secao 2

**Trust badges:**

```
Seu dinheiro, seu controle | Relatorios prontos pro conselho | Construido sobre sistemas auditados
```

### Nota de adaptacao

O hero brasileiro inclui a dor dos "30 dias pra receber" que nao existe no EN. Isso e exclusivo do Brasil e e uma das maiores dores de comerciantes brasileiros. A taxa tambem foi ajustada para 2-5% (mais alta que o 2-3% americano/europeu).

---

## SECAO 2: DOIS MUNDOS

Duas cards lado a lado no desktop. Empilhadas no mobile (Card A primeiro).

**H2:**

```
Duas formas que o sistema custa dinheiro pra voce.
```

### Card A: Se voce aceita pagamentos no cartao

```
Cada vez que um cliente paga no cartao, voce perde de 2% a 5% pra maquininha.

Com R$5.000 por dia em vendas, sao R$3.000 a R$7.500 por mes. Sumidos. E no cartao de credito? O dinheiro so cai na sua conta em 30 dias. Se voce quer receber antes, paga MAIS uma taxa de antecipacao.

Voce paga pra receber o seu proprio dinheiro. Faz sentido?

Quando seus clientes pagam pelo diBoaS, voce fica com 100% de cada transacao. Sem maquininha no meio. Sem esperar 30 dias.
```

**CTA Button:**

```
Calcule o que voce esta perdendo
```

CTA scroll para: Secao 3

### Card B: Se sua empresa tem dinheiro parado no caixa

```
Voce captou investimento. Esta gastando com cuidado. Mas o dinheiro que voce nao esta usando agora? O banco pega, aplica, e te devolve uma miseria.

Com R$2.500.000 parados, a diferenca entre o que o banco te paga e o que e possivel pode ser de centenas de milhares de reais por ano.

E se esse dinheiro trabalhasse pra voce?
```

**CTA Button:**

```
Calcule o que o banco esta ficando
```

CTA scroll para: Secao 4

### Nota de adaptacao

- Card A foi significativamente adaptada: inclui a dor da antecipacao de recebiveis (exclusiva do Brasil) e o prazo de 30 dias. A frase "Voce paga pra receber o seu proprio dinheiro" e uma das linhas mais fortes do copy brasileiro.
- Card B usa R$2.500.000 como exemplo (equivalente a ~$500K, valor mais realista para startups brasileiras que captaram rodada seed/Series A).
- Taxa da maquininha ajustada para 2-5% (mais alta que EN/ES/DE).

---

## SECAO 3: CALCULADORA DE FLUXO

**H2:**

```
E se voce ficasse com esses 5%?
```

**Inputs:**

| Campo | Etiqueta | Valor padrao |
|-------|----------|--------------|
| Vendas diarias no cartao | Suas vendas diarias no cartao | R$5.000 |
| Taxa atual da maquininha | Sua taxa atual da maquininha | 4% |

Nota: valor padrao de R$5.000/dia e taxa de 4% refletem melhor a realidade brasileira (maquininha + antecipacao).

**Toggle:** 1 mes | 6 meses | 1 ano

**Aviso (ACIMA dos resultados):**

```
Estas projecoes sao ilustrativas. Os resultados reais podem ser maiores ou menores. Desempenho passado nao garante resultados futuros.
```

**Resultados (faixa de 3 cenarios, para valores padrao: R$5.000/dia, 4%, 1 ano):**

| Cenario | Perdido em taxas | Com diBoaS (GRATIS) | Voce economiza | Se investir a economia |
|---------|------------------|--------------------|-----------------|------------------------|
| Conservador (4%) | R$72.000 | R$0 | R$72.000 | R$74.880 |
| Media historica (7%) | R$72.000 | R$0 | R$72.000 | R$77.040 |
| Otimista (10%) | R$72.000 | R$0 | R$72.000 | R$79.200 |

**Slider ajustavel:** Retorno anual esperado (media historica: 7%). Faixa: 1% a 15%.

**Abaixo dos resultados:**

```
A ultima coluna? Esse e o efeito do investimento de fluxo. Voce economiza nas taxas. Depois faz a economia render. Dois ganhos com uma so mudanca.

Retornos nao sao garantidos. Mas a economia nas taxas e real desde o primeiro dia.
```

**CTA Button:**

```
Veja o efeito duplo
```

CTA scroll para: Secao 8

### Nota de adaptacao

Os numeros brasileiros sao drasticamente maiores que os do EN porque:
- Taxa da maquininha brasileira (4%) e maior que a americana (3%) ou europeia (2,5%)
- Volume diario em R$5.000 (~$1.000 USD) gera economia MUITO maior em valor absoluto em reais
- R$72.000 de economia por ano e um numero que chama atencao de qualquer comerciante brasileiro

---

**Transicao:**

```
Isso e pra quem recebe pagamentos. Mas e o dinheiro que ja esta parado?
```

---

## SECAO 4: CALCULADORA DE RESERVA

**H2:**

```
E se o dinheiro do seu caixa trabalhasse pra voce?
```

**Inputs:**

| Campo | Etiqueta | Valor padrao |
|-------|----------|--------------|
| Capital disponivel | Capital disponivel | R$2.500.000 |
| Taxa de juros atual | Taxa de juros atual | 1% |

Nota: 1% como padrao (nao 0,5% como EN) porque o CDI brasileiro e mais alto que as taxas americanas/europeias, mas ainda assim nao cobre a inflacao real. A dor brasileira e "rende, mas nao rende de verdade."

**Aviso (ACIMA dos resultados):**

```
Estas projecoes sao ilustrativas. Os resultados reais podem ser maiores ou menores. Desempenho passado nao garante resultados futuros. Seu capital esta em risco.
```

**Resultados (faixa de 3 cenarios):**

| Cenario | Taxa | Retorno anual | Seu banco (1%) | A diferenca |
|---------|------|---------------|----------------|-------------|
| Conservador | 4% | R$100.000/ano | R$25.000/ano | R$75.000/ano |
| Media historica | 7% | R$175.000/ano | R$25.000/ano | R$150.000/ano |
| Otimista | 10% | R$250.000/ano | R$25.000/ano | R$225.000/ano |

**Slider ajustavel:** Retorno anual esperado (media historica: 7%). Faixa: 1% a 15%.

**Abaixo dos resultados:**

```
Sao projecoes, nao promessas. Mas a diferenca entre o que o banco te paga e o que e possivel? Isso e real.
```

**CTA Button:**

```
Veja o que e possivel
```

CTA scroll para: Secao 12

---

**Transicao:**

```
Deixa eu te contar por que isso importa tanto pra mim.
```

---

## SECAO 5: HISTORIA DE ORIGEM

**H2:**

```
O nome dela era Adelaide.
```

**Corpo:**

```
Minha avo economizou a vida inteira. Metade de tudo que ganhou. Fez tudo certo.

Nao foi suficiente.

O banco investiu as economias dela, lucrou, e devolveu quase nada. Te parece familiar?

Eu ja vi padarias perderem R$50.000 por ano em taxas de maquininha. Ja vi startups com R$2 milhoes no banco recebendo menos de R$1.000 por mes de rendimento. O sistema tira de todo mundo.

Nao foi feito pra pessoas como ela. Tambem nao foi feito pra negocios como o seu, seja uma cafeteria ou uma startup.

Mas agora? A tecnologia tornou possivel eliminar os intermediarios. Eu so precisava construir a porta.

Dei o nome dela.
```

**Assinatura:**

```
Bar, Fundador
```

### Nota de adaptacao

- "R$50.000 por ano em taxas de maquininha" e mais realista para o Brasil (maquininha + antecipacao combinados) do que os $10.000 do EN.
- "R$2 milhoes no banco" equivale aos $500K do EN mas em contexto brasileiro.
- "Menos de R$1.000 por mes" (mesmo com Selic alta, a remuneracao de conta corrente e misera).

---

**Transicao:**

```
Funciona assim.
```

---

## SECAO 6: COMO FUNCIONA

**H2:**

```
Quatro passos. Dois minutos.
```

**Passo 1: Conecte seu negocio**

```
Vincule sua conta empresarial. Dois minutos de configuracao. Sem integracao tecnica. Sem desenvolvedor. Sem parar nada. Voce faz isso enquanto toma o cafe da manha.
```

**Passo 2: Voce define as regras**

```
Diga qual e o seu minimo. "Sempre manter R$250.000 disponiveis." Tudo que estiver acima? Coloca pra trabalhar. Voce define as regras. Muda quando quiser.
```

**Passo 3: Seu dinheiro trabalha**

```
Seu caixa parado comeca a render. Pagamentos chegam em segundos, nao em 30 dias. Suas taxas de processamento caem de 4% pra zero. E voce nao precisou pensar em nada disso.
```

**Passo 4: Acesso a qualquer hora**

```
Precisa de dinheiro? Um toque. Sem bloqueios. Sem multas. Processado na hora. Tempos de transferencia bancaria podem variar.
```

---

**Transicao:**

```
Esse e o processo. Agora veja o que voce realmente recebe.
```

---

## SECAO 7: TRES BENEFICIOS

**H2:**

```
O que o seu negocio ganha.
```

### Receba sem perder um pedaco

```
Quando seus clientes pagam pelo diBoaS, voce recebe o valor total. Sem corte. Sem maquininha tirando de 2% a 5%. Sem esperar 30 dias. Sem pagar antecipacao. Dinheiro na sua conta, na hora.

Aqueles 4% que voce vinha perdendo? Agora ficam na sua conta.
```

### Pague qualquer pessoa, em qualquer lugar, na hora

```
Fornecedores, freelancers, prestadores de servico. Em qualquer lugar do mundo. Cambio real. De graca. Sem taxas SWIFT de R$75 a R$250. Sem espera de 2 a 3 dias.

Seu designer em Lisboa recebe antes da reuniao acabar. Pelo cambio real, nao o do banco.
```

### Adelaide cuida do seu dinheiro

```
Inteligencia de mercado feita pra donos de negocio, nao pra Wall Street. O que esta acontecendo com o seu dinheiro. O que significa. O que voce pode fazer. Linguagem clara, relatorios prontos pro conselho, sem enrolacao.

Inteligencia financeira que fala a sua lingua. Sem precisar de consultor a R$2.500 a hora.
```

### Nota de adaptacao

- Feature 1 inclui "sem pagar antecipacao" e "sem esperar 30 dias" — dores exclusivas do Brasil.
- Feature 2 usa "Lisboa" como exemplo de freelancer (muitos brasileiros tem conexoes profissionais com Portugal).
- Feature 3 usa R$2.500/hora (equivalente cultural dos $500/hour do EN).
- "Sem enrolacao" e mais natural que "sem jargao" em portugues brasileiro.

---

**Transicao:**

```
Mas aqui vem a parte que ninguem mais esta fazendo.
```

---

## SECAO 8: INVESTIMENTO DE FLUXO

**H2:**

```
Investimento de fluxo. Dois ganhos com uma so mudanca.
```

### Economize.

```
Hoje, a cada R$100 que passam pelo seu negocio, voce paga de R$2 a R$5 em taxas de maquininha. Com diBoaS, receber pagamentos nao custa nada.

Essa diferenca se acumula. Rapido.

Uma cafeteria que fatura R$5.000 por dia no cartao? Sao mais de R$72.000 por ano de volta pro seu bolso.
```

### Faca render.

```
O dinheiro que voce economiza nao precisa ficar parado. Mas pode. A economia nas taxas e sua, investindo ou nao.

Se voce quiser colocar pra trabalhar: a partir de R$10. Escolha sua abordagem, da mais segura ate a mais arrojada. Adelaide fica de olho.
```

**Micro-exemplo:**

```
Economize R$72.000 em taxas. Invista. Termine o ano com entre R$74.880 e R$79.200, dependendo das condicoes de mercado. Isso nao e corte de custos. E uma nova linha de receita.
```

**Limitacao honesta + Promessa de marca:**

```
A economia e certa. O crescimento nao. Essa e a conta honesta. Mostramos os dois lados, as oportunidades e os riscos, sempre.
```

**CTA Button:**

```
Faca as contas
```

CTA scroll para: Secao 3

**Micro-aviso (texto pequeno):**

```
Exemplo baseado em R$5.000/dia de vendas no cartao a 4% de taxa, com economias investidas a uma faixa de 4% a 10% de retorno anual. Projecoes de retorno sao ilustrativas. Os resultados reais podem variar.
```

---

## SECAO 9: TRANSPARENCIA DE TAXAS

**H2:**

```
Quanto custa. Tudo.
```

**Intro:**

```
Sem taxas escondidas. Sem saldo minimo. Sem mensalidade. Aqui esta cada taxa, na mesa.
```

| Acao | diBoaS | Provedores tipicos | Exemplo |
|------|--------|---------------------|---------|
| Conta empresarial | Gratis pra sempre | R$50 a R$250/mes | Sua conta: R$0. Sempre. |
| Receber pagamentos | GRATIS | 2 a 5% (maquininha) | Receber R$5.000: custa R$0 (nao R$100 a R$250) |
| Enviar / Pagar | GRATIS* | R$7,50 a R$250 (SWIFT) | Pagar um fornecedor R$2.500: R$0 |
| Adicionar dinheiro | 0,48% | 0 a 1,5% | Adicionar R$50.000: custa R$240 |
| Investir / Crescer | GRATIS | 0,5 a 2% (assessores, plataformas) | Investir R$50.000: R$0. Gratis pra comecar. |
| Vender / Fechar | 0,39% | 0,5 a 2% | Vender R$50.000: custa R$195 |
| Trocar | GRATIS* | 0,5 a 2% spread | Trocar R$50.000: R$0 |
| Sacar | 0,48% | 1 a 3% + atrasos | Sacar R$50.000: custa R$240 |

```
*Taxa diBoaS mostrada. Taxas de rede de terceiros podem se aplicar (normalmente menos de R$0,05).
```

```
Comparacoes de precos baseadas em tarifas publicas de fevereiro de 2026. As faixas refletem precos comuns entre os principais provedores. O preco real de cada concorrente varia por provedor, volume e condicoes contratuais.
```

**Resumo:**

```
Receba R$5.000 em pagamentos: voce fica com R$5.000 na sua conta diBoaS. Saque para o banco: R$4.976 (apos 0,48% de taxa de saque). Ainda muito mais barato que os R$4.750 a R$4.900 que uma maquininha deixa pra voce.
```

**Linha final:**

```
Cada taxa. Na mesa. Nada mais.
```

---

**Transicao:**

```
Ainda lendo? Otimo. Vamos ver se isso encaixa pro seu negocio.
```

---

## SECAO 10: AVALIACAO DE ENCAIXE

**H2:**

```
Isso e certo pro seu negocio?
```

### Bom Encaixe

```
Seu negocio aceita pagamentos no cartao e voce esta cansado de perder de 2% a 5% na maquininha.

Sua empresa tem dinheiro parado no caixa rendendo quase nada.

Voce quer controle total sobre o seu dinheiro.

Voce esta confortavel com um tipo diferente de risco em troca de retornos melhores.
```

### Nao e pra Voce

```
Voce precisa de protecao do FGC acima de tudo.

Voce tem tolerancia zero pra qualquer tipo de risco.

Voce prefere bancos tradicionais mesmo que custem mais.

Voce precisa que alguem gerencie seu dinheiro por voce.
```

### Nota de adaptacao

"FGC" (Fundo Garantidor de Creditos) substitui "government deposit insurance" — e o equivalente brasileiro e todo empresario brasileiro conhece a sigla.

---

## SECAO 11: SOBRE O FUNDADOR

*(Foto de Bar)*

### Versao A: Empresa registrada

```
Construido por Bar.

Eu cresci vendo minha avo Adelaide navegar um sistema financeiro que nao foi feito pra ela. Ela merecia ferramentas melhores. Assim como cada dono de negocio como voce.

A diBoaS tem sede em Berlim, Alemanha, construindo para negocios nos EUA, na UE e no Brasil. Passei mais de 20 anos trabalhando com Produtos e Tecnologia no Brasil, nos EUA, no Japao e na Alemanha. Agora estou construindo a ferramenta financeira que eu queria que cada pequeno negocio e startup tivesse.

Perguntas? Eu leio cada email. bar@diboas.com
```

### Versao B: Empresa em registro

```
Construido por Bar.

Eu cresci vendo minha avo Adelaide navegar um sistema financeiro que nao foi feito pra ela. Ela merecia ferramentas melhores. Assim como cada dono de negocio como voce.

A diBoaS esta sendo estabelecida em Berlim, Alemanha, construindo para negocios nos EUA, na UE e no Brasil. Passei mais de 20 anos trabalhando com Produtos e Tecnologia no Brasil, nos EUA, no Japao e na Alemanha. Agora estou construindo a ferramenta financeira que eu queria que cada pequeno negocio e startup tivesse.

Perguntas? Eu leio cada email. bar@diboas.com
```

### Versao C: Pre-registro

```
Construido por Bar.

Eu cresci vendo minha avo Adelaide navegar um sistema financeiro que nao foi feito pra ela. Ela merecia ferramentas melhores. Assim como cada dono de negocio como voce.

Estamos construindo a diBoaS de Berlim, Alemanha, para negocios nos EUA, na UE e no Brasil. Passei mais de 20 anos trabalhando com Produtos e Tecnologia no Brasil, nos EUA, no Japao e na Alemanha. Agora estou construindo a ferramenta financeira que eu queria que cada pequeno negocio e startup tivesse.

Perguntas? Eu leio cada email. bar@diboas.com
```

**CEO: Confirme a versao (A, B ou C). Padrao: Versao B.**

---

## SECAO 12: PROVA SOCIAL + DUPLO CTA

**H2:**

```
Junte-se aos negocios que pararam de pagar demais.
```

**Contador:**

```
[X] negocios explorando diBoaS. [Y] paises.
```

### Caminho A: Garanta acesso antecipado.

```
Deixe seu email. Avisamos quando seu negocio puder comecar a economizar.
```

**Input email:** "Seu email empresarial"

**CTA Button:**

```
Quero acesso antecipado
```

```
Sem spam. So o seu convite quando estivermos prontos.
```

**Checkbox privacidade:** Concordo com a Politica de Privacidade (/legal/privacy)

### Caminho B: Vamos olhar seus numeros.

*Para empresas com fluxo de caixa ou reservas significativas.*

```
15 minutos. Sem compromisso. Sem apresentacao de vendas. So numeros.
```

**CTA Button:**

```
Agende uma conversa
```

Link: https://cal.com/diboas/treasury-conversation (nova aba)

```
Ou escreva pra bar@diboas.com
```

---

## SECAO 13: FAQ

**H2:**

```
Antes de decidir.
```

### FAQ 1: Qual e a pegadinha?

```
Cobramos taxas pequenas quando o dinheiro se move. Receber pagamentos e gratis. Investir e gratis. 0,39% quando voce vende ou fecha uma posicao. 0,48% quando voce saca.

Se voce recebe R$50.000 em pagamentos, nao ficamos com nada. Se voce investe R$50.000, nao ficamos com nada. Se voce vende R$50.000, ficamos com R$195. Se voce nao ganha nada e nao envia nada, a gente nao ganha nada.

Sem taxas escondidas. Sem saldo minimo. Sem mensalidade. Sem pegadinha.
```

### FAQ 2: E pra pequenas empresas ou startups?

```
Pras duas. Se voce tem uma padaria perdendo 4% em cada venda no cartao, ajudamos voce a ficar com esse dinheiro. Se voce e uma startup com R$2 milhoes parados no banco rendendo CDI, ajudamos a render mais.

As ferramentas sao as mesmas. So os numeros que mudam.
```

### FAQ 3: Meu dinheiro esta seguro?

#### Versao A (Nao Custodia)

```
Seu dinheiro e protegido por voce. Sua carteira, suas chaves. Ninguem na diBoaS pode acessar seus fundos sem sua autorizacao.

Dito isso, nao e uma conta bancaria. Seu dinheiro funciona atraves de tecnologia nova. O valor pode oscilar e voce pode perder parte ou todo o seu investimento. Nao existe cobertura do FGC.

Mostramos os dois lados, as oportunidades e os riscos, sempre.
```

#### Versao B (MPC)

```
Seu dinheiro e protegido por seguranca multipartidaria. Sua autorizacao e necessaria para cada transacao. A diBoaS possui uma parte parcial da chave para recuperacao, mas nao pode movimentar seus fundos unilateralmente.

Dito isso, nao e uma conta bancaria. Seu dinheiro funciona atraves de tecnologia nova. O valor pode oscilar e voce pode perder parte ou todo o seu investimento. Nao existe cobertura do FGC.

Mostramos os dois lados, as oportunidades e os riscos, sempre.
```

### FAQ 4: Posso acessar meu dinheiro a qualquer momento?

```
Sim. Sem bloqueios. Voce define o minimo: "sempre manter R$250.000 liquidos." So colocamos pra trabalhar o que esta acima disso.

Precisa de dinheiro? Um toque. Processamos na hora. Tempos de transferencia bancaria podem variar. Sem multas. Sem perguntas.
```

### FAQ 5: Como funcionam os pagamentos instantaneos?

```
Transferencias tradicionais passam por bancos correspondentes. Seu banco, o banco deles, talvez outro banco, e ai o banco do destinatario. Cada etapa leva tempo e cobra taxas.

Com diBoaS, os pagamentos vao direto. Da sua carteira pra carteira deles. Pronto.

Seu freelancer em Miami recebe em segundos, pelo cambio real, de graca. Nao R$75 a R$250 e 3 dias uteis.
```

### FAQ 6: E quanto a compliance e impostos?

```
Construimos a diBoaS pra negocios reais com necessidades reais de compliance.

Extratos mensais formatados pro seu software contabil. Historico de transacoes com trilha de auditoria completa. Documentacao fiscal no final do ano. Relatorios prontos pro conselho que seu CFO realmente vai entender.

Sabemos que uma hora voce vai ser auditado. Garantimos que voce esteja preparado.
```

### FAQ 7: Pra onde vai meu dinheiro exatamente?

```
Seu dinheiro e colocado em sistemas financeiros estabelecidos que operam ha mais de 3 anos, sobreviveram a multiplas quedas de mercado e sao auditados de forma independente em seguranca.

Todos os detalhes, incluindo nomes, historico e nossos criterios de selecao, estao publicados na nossa pagina de Estrategias. Sem necessidade de cadastro.

Escolhemos esses sistemas porque sao transparentes, testados em batalha, e voce pode ver exatamente onde seus fundos estao a qualquer momento.
```

"Pagina de Estrategias" linka para /strategies

### FAQ 8: Por que a diBoaS nao pode tocar no meu dinheiro?

#### Versao A (Nao Custodia)

```
Esse e exatamente o ponto da nossa arquitetura.

Financas tradicionais: voce deposita dinheiro, vira dinheiro do banco, e eles te devem um saldo.

diBoaS: seu dinheiro fica na sua propria carteira. Fornecemos o software que te ajuda a colocar ele em sistemas que geram retorno. Mas nunca temos acesso pra movimenta-lo.

Se a diBoaS falir, seu dinheiro continua sendo seu. Ninguem na diBoaS pode movimentar seus fundos. Cada transacao precisa da sua aprovacao.

Mais controle pra voce. Menos risco nosso.
```

#### Versao B (MPC)

```
Isso e parte fundamental de como somos construidos.

Financas tradicionais: voce deposita dinheiro, vira dinheiro do banco, e eles te devem um saldo.

diBoaS: seu dinheiro e protegido por seguranca multipartidaria. Possuimos uma parte parcial da chave para recuperacao de conta, mas cada transacao requer sua aprovacao explicita. Nao podemos movimentar seus fundos unilateralmente.

Se a diBoaS tiver problemas, seus fundos permanecem protegidos pelo sistema de seguranca multipartidaria. Cada transacao requer sua autorizacao.

Mais protecao pra voce. Menos risco nosso.
```

### FAQ 9: Qual e o risco real?

```
Vamos ser honestos.

Os sistemas onde seu dinheiro e colocado sao construidos com codigo. Codigo pode ter vulnerabilidades. Reduzimos isso usando apenas sistemas com valor total significativo sob gestao, multiplas auditorias de seguranca independentes, anos de historico atraves de eventos de mercado, e distribuindo seu dinheiro entre multiplos sistemas independentes.

Risco zero? Nao. Nada e, incluindo o seu banco.

A pergunta real: vale a pena um perfil de risco diferente em troca de retornos melhores? Pra alguns negocios, sim. Pra outros, nao. As duas respostas sao validas.
```

### FAQ 10: A diBoaS foi auditada?

```
Somos uma plataforma em fase de pre-lancamento. Nossas estrategias sao testadas contra quedas historicas e cenarios reais, e usamos sistemas auditados e estabelecidos. Conforme crescermos, planejamos realizar auditorias independentes de terceiros.

Para todos os detalhes sobre os sistemas e a tecnologia por tras de cada estrategia, visite nossas paginas de Estrategias e Protocolos.
```

"Estrategias" linka para /strategies, "Protocolos" linka para /protocols.

---

## SECAO 14: RODAPE

### Aviso de Risco (TODOS os idiomas)

```
A diBoaS conecta voce a sistemas de financas descentralizadas. Retornos nao sao garantidos. Desempenho passado nao preve resultados futuros. Envolve riscos incluindo vulnerabilidades de codigo, flutuacoes de mercado e desafios de acesso. Use apenas fundos que voce pode se dar ao luxo de arriscar. A diBoaS nao e um banco. Nao se aplica seguro de depositos ou cobertura do FGC.
```

### CVM Circular 6/2019 — 3 Avisos Obrigatorios

```
Retornos passados nao sao garantia de retorno futuro.
```

```
Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido.
```

```
Percentuais prospectivos refletem apenas a opiniao do autor, com base em informacoes disponiveis a epoca e consideradas confiaveis.
```

**IMPORTANTE: Estes 3 avisos da CVM sao OBRIGATORIOS para o mercado brasileiro. Devem ser exibidos de forma proeminente. NAO incluir MiCA (Art. 68 ou Art. 7) na versao pt-BR.**

### Divulgacao de IA

```
Determinados conteudos desta plataforma, incluindo analises de mercado e materiais educativos, sao gerados ou assistidos por inteligencia artificial. Conteudo gerado por IA pode conter erros ou limitacoes. Usuarios devem verificar informacoes de forma independente antes de tomar decisoes financeiras.
```

### Divulgacao de Resultados Ficticios

```
Os exemplos nesta pagina sao ilustrativos e nao representam negocios reais ou resultados reais. Projecoes das calculadoras sao baseadas em cenarios hipoteticos e medias historicas. Os resultados reais irao variar.
```

### Elementos adicionais do rodape

- Redes sociais: Instagram, X, YouTube, LinkedIn
- Navegacao: Sobre nos, Legal, Politica de Privacidade, Termos de Servico, Politica de Cookies, Ajuda, Seguranca
- Copyright: (c) 2026 diBoaS. Todos os direitos reservados.

---

## MAPA DE TRANSICOES

| Apos | Texto | Para |
|------|-------|------|
| 1. Hero | (CTA scroll) | Dois Mundos |
| 2. Dois Mundos | (CTAs scroll para calculadoras) | Calculadoras |
| 3. Calc. Fluxo | "Isso e pra quem recebe pagamentos. Mas e o dinheiro que ja esta parado?" | Calc. Reserva |
| 4. Calc. Reserva | "Deixa eu te contar por que isso importa tanto pra mim." | Historia |
| 5. Historia | "Funciona assim." | Como Funciona |
| 6. Como Funciona | "Esse e o processo. Agora veja o que voce realmente recebe." | Tres Beneficios |
| 7. Beneficios | "Mas aqui vem a parte que ninguem mais esta fazendo." | Inv. Fluxo |
| 8. Inv. Fluxo | (fluxo natural) | Taxas |
| 9. Taxas | "Ainda lendo? Otimo. Vamos ver se isso encaixa pro seu negocio." | Avaliacao |
| 10-14 | (fluxo natural) | Sequencial |

---

## REGRAS DE MARCA

### Filtro Adelaide — Palavras Proibidas

Blockchain, DeFi, Protocolo(s) (exceto FAQ 10 link), Stablecoin(s), Pegged, On-ramp/Off-ramp, Smart contract(s), Yield, Nao custodia, TVL, APY/APR

### Promessa de Marca (max 2 aparicoes)

```
Mostramos os dois lados, as oportunidades e os riscos, sempre.
```

1. FAQ 3
2. Secao 8

### Voz

- Segunda pessoa ("voce")
- Quente, direta, proxima
- Honesta com as limitacoes
- Sem travessao, sem emojis
- Fala com o dono da padaria E o CFO da startup
- Tom mais informal que EN/DE (natural para o portugues brasileiro)
