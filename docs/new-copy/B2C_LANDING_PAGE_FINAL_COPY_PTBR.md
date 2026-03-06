# diBoaS B2C Landing Page - Copy Final (PT-BR)

## Status do Documento

| Campo | Valor |
|-------|-------|
| Versao | FINAL - Pronta para Producao |
| Idioma | Portugues Brasileiro (PT-BR) |
| Base | EN Final Champion Copy (Sessions 015-018) |
| Adaptacao Cultural | Completa (nao e traducao literal) |
| Data | 26 de fevereiro de 2026 |
| Bloqueios | 0 |

## Notas de Implementacao para CTO / Claude Code

Este documento contem a versao completa em portugues brasileiro da landing page B2C do diBoaS. Esta e uma ADAPTACAO CULTURAL, nao uma traducao literal. Cenarios, dores, referencias e valores foram adaptados para a realidade brasileira.

### Diferencas Criticas em Relacao ao EN

| Item | EN | PT-BR | Motivo |
|------|-----|-------|--------|
| Moeda | $5 minimo | R$10 minimo | Valor de entrada acessivel para BR |
| Transferencias | Dor: taxas altas | Dor: acesso ao dolar + envio internacional | PIX e gratuito no Brasil. A dor e INTERNACIONAL e acesso a investimentos em dolar |
| Cenarios | San Francisco, Dubai, Mom | Familia no exterior, freelancer, mae | Realidade brasileira |
| Regulatorio | MiCA Article 68 + 7 | CVM Circular 6/2019 (3 avisos) | Jurisdicao brasileira |
| Tom | Warm but direct | Mais informal, mais quente | Cultura brasileira |
| Fee table | $ references | R$ references + contexto brasileiro | Custos locais |

### Regras Globais (mesmas do EN)

- NENHUM caractere travessao em toda a pagina. Usar virgulas, pontos, dois pontos ou quebras de linha.
- NENHUM emoji no corpo do texto.
- Todos os CTAs sao botoes, salvo indicacao contraria.
- Micro-disclosures e notas de rodape usam estilo de texto pequeno/sutil.
- O Filtro Adelaide se aplica: sem jargao na pagina principal.

### Fluxo de Secoes (Ordem Final)

| Secao | Nome | Tipo |
|-------|------|------|
| 1 | Hero | Estatico |
| 2 | Historia de Origem | Estatico |
| 2.5 | Carrossel de Personas | Carrossel rotativo (3 slides) |
| 3 | Cenarios da Vida Real | Cards (3) |
| 4 | Carrossel de Produtos | Carrossel rotativo (3 slides) |
| 5 | Tabela de Taxas | Tabela estatica |
| 6 | Qual e a Pegadinha? | Estatico |
| 6.5 | Como Funciona por Dentro | Expansivel/recolhivel (fechado por padrao) |
| 7 | Demo Interativa | Componente interativo |
| 8 | Prova Social | Contador dinamico |
| 8.5 | Sobre o Fundador | Estatico com foto |
| 9 | Lista de Espera | Formulario (duas versoes) |
| 10 | FAQ | Acordeao (13 itens) |
| 11 | Rodape | Estatico com avisos legais |

---

## SECAO 1: HERO

### Content

**H1:**

```
O sistema nao esta quebrado. Ele funciona exatamente como foi projetado. So que nao pra voce.
```

**Sub-headline:**

```
Envie dinheiro pra qualquer lugar em segundos. De graca. Depois, faca ele crescer enquanto voce dorme.
```

**CTA Button:**

```
Veja seu dinheiro em acao
```

### Notas

- H1 e intocavel. Nao modificar.
- Sem texto de reducao de friccao abaixo do CTA.
- CTA leva a Secao 7 (Demo Interativa).

---

## SECAO 2: HISTORIA DE ORIGEM

### Content

**Transition hook (do Hero):**

```
E por isso que eu estou construindo isso.
```

**H2:**

```
O nome dela era Adelaide.
```

**Body:**

```
Minha avo nunca teve acesso as ferramentas financeiras que poderiam ter mudado a vida dela.

O sistema nao estava quebrado. Ele funcionava exatamente como foi projetado.
So que nao pra gente como ela. Como eu. Como voce.

O acesso estava trancado atras de valores minimos altos, palavras complicadas e grandes instituicoes financeiras que nao se importavam com quem tinha pouca economia.

R$50.000 pra abrir uma conta de investimento. R$30 por mes so pra manter uma conta corrente. Esse era o preco do acesso.

A tecnologia nova tornou possivel passar por cima de quem controlava tudo.
Eu so precisava construir a porta.

Eu dei o nome dela.
```

### Notas

- Os valores (R$50.000 e R$30) refletem a realidade brasileira de bancos tradicionais.
- Tom mais quente e informal que o EN. "Pra" em vez de "para" em contextos coloquiais.
- A ultima frase "Eu dei o nome dela." deve ter um espacamento acima para criar uma pausa.

---

## SECAO 2.5: CARROSSEL DE PERSONAS

### Content

**Transition hook (da Historia de Origem):**

```
Eu construi pra voce.
```

#### Slide 1: Quem Envia

**Direcao de background:** Quente, humano. Alguem no celular tarde da noite, luz suave.

**Headline:**

```
Sua mae precisa agora. Nao no "horario comercial".
```

**Sub-text:**

```
Envie dinheiro pra qualquer pessoa no diBoaS. Em qualquer lugar do mundo. Em segundos. De graca.
```

**CTA Button:**

```
Veja seu dinheiro em acao
```

#### Slide 2: Quem Economiza

**Direcao de background:** Limpo, pratico. Alguem olhando uma conta ou um notebook com numeros.

**Headline:**

```
Voce paga centenas de reais por ano em taxas que nem ve.
```

**Sub-text:**

```
Sem mensalidade. Sem taxas escondidas. Sem letras miudas. So o seu dinheiro, trabalhando pra voce.
```

**CTA Button:**

```
Veja seu dinheiro em acao
```

#### Slide 3: Quem Quer Crescer

**Direcao de background:** Aspiracional, calmo. Nascer do sol, alguem relaxado, olhando pra frente.

**Headline:**

```
Sua poupanca ta rendendo quase nada. Voce sabe disso.
```

**Sub-text:**

```
Escolha o que combina com sua vida, do mais seguro ao mais aventureiro. A partir de R$10. Adelaide cuida do seu dinheiro pra voce nao ter que se preocupar.
```

**CTA Button:**

```
Veja seu dinheiro em acao
```

**Transition hook (saida, para Cenarios):**

```
E e assim que funciona na pratica.
```

---

## SECAO 3: CENARIOS DA VIDA REAL

### Content

**H2:**

```
Gente de verdade. Momentos de verdade.
```

#### Card 1: Enviando dolares pro seu irmao em Portugal

```
Ele ta do outro lado do oceano. Voce manda. Chega antes de voce guardar o celular.
```

**Comparacao de custo (texto pequeno/destaque):**

```
Servicos de remessa tradicionais: R$50 a R$150 por envio + IOF + 2 a 5 dias uteis. diBoaS: gratis e instantaneo.
```

#### Card 2: Pagando um freelancer na Argentina

```
Ele ta na America do Sul. Voce ta no Brasil. O dinheiro chega antes do cafe esfriar.
```

**Comparacao de custo (texto pequeno/destaque):**

```
Transferencia internacional pelo banco: R$80 a R$200 + spread cambial escondido. diBoaS: gratis e instantaneo.
```

#### Card 3: Dinheiro urgente pra mae

```
3 da manha. Ela precisa agora. Nao no "proximo dia util".
```

**Comparacao de custo (texto pequeno/destaque):**

```
TED/DOC fora do horario: nao disponivel. PIX: gratis, mas so no Brasil. diBoaS: gratis, qualquer lugar do mundo, agora.
```

**Linha de esclarecimento (abaixo dos cards):**

```
Use o diBoaS so pra transferencias gratuitas. Sem obrigacao de mais nada. Quando voce quiser mais, ta aqui.
```

**Nota de rodape (texto pequeno):**

```
Comparacoes de preco baseadas em valores publicamente disponiveis em fevereiro de 2026.
```

### Notas

- Os cenarios refletem a realidade brasileira: remessas internacionais sao o ponto de dor, nao transferencias domesticas (PIX ja e gratuito).
- Card 3 menciona PIX de proposito para mostrar que diBoaS complementa, nao substitui, para transferencias internacionais.
- Nenhum concorrente nomeado (sem "Western Union," sem "Wise"). Apenas categorias genericas.

---

## SECAO 4: CARROSSEL DE PRODUTOS

### Content

**Transition hook (dos Cenarios):**

```
Veja como funciona.
```

**H2:**

```
Dinheiro que se move como mensagem.
```

#### Slide 1: Enviar e Receber

**Quote:**

```
"Mandei R$500 pro meu irmao. Chegou antes de eu guardar o celular."
```

**Description:**

```
Envie dinheiro pra qualquer pessoa no diBoaS. Em qualquer lugar do mundo. Em segundos. De R$10 a R$25.000. De graca. Seu dinheiro fica guardado como dolar digital, feito pra valer sempre US$1. Saque pra sua conta bancaria quando quiser.
```

#### Slide 2: Investir e Crescer

**Quote:**

```
"Eu tinha R$500 parado na conta sem render nada. Agora ta rendendo mais do que a poupanca rendeu em 5 anos."
```

**Description:**

```
Escolha entre 10 formas de fazer seu dinheiro crescer. Da opcao mais segura a mais aventureira. A partir de R$10. Seu dinheiro trabalha enquanto voce dorme.
```

#### Slide 3: Acompanhar e Aprender

**Quote:**

```
"Adelaide cuida do meu dinheiro pra eu nao ter que me preocupar. Olho uma vez por dia. Menos estresse. Mais vida."
```

**Description:**

```
O que ta acontecendo. O que significa. O que voce pode fazer. Linguagem clara, sem jargao.
```

**Micro-disclosure (abaixo do carrossel, texto pequeno):**

```
Exemplos mostrados sao ilustrativos e nao representam usuarios reais.
```

---

## SECAO 5: TABELA DE TRANSPARENCIA DE TAXAS

### Content

**Transition hook (do Carrossel de Produtos):**

```
Agora vamos falar de dinheiro.
```

**H2:**

```
Quanto Custa. Tudo.
```

**Intro de quantificacao de dor:**

```
O brasileiro medio paga centenas de reais por ano em tarifas bancarias, taxas de transferencia e custos escondidos. Veja como fica com a gente.
```

#### Tabela de Taxas

| Acao | diBoaS | Apps Comuns | Diferenca | Exemplo |
|------|--------|-------------|-----------|---------|
| Conta | Gratis pra sempre | R$15 a R$50/mes | Economize R$180 a R$600/ano | Sua conta: R$0. Sempre. |
| Adicionar Dinheiro | 0,48% | 0 a 1,5% | Mais barato que a maioria dos apps cobra pra adicionar dinheiro | Adicione R$500: custa R$2,40 |
| Enviar Dinheiro | GRATIS* | R$5 a R$150 (internacional) | Economize R$5 a R$150 por envio | Envie R$500 pra sua mae: R$0 |
| Comprar / Investir | GRATIS | 1,5 a 2,5% (corretoras) | Economize R$1,50 a R$2,50 a cada R$100 | Invista R$100: custa R$0 |
| Vender / Encerrar | 0,39% | 1,5 a 2,5% (corretoras) | Economize R$1,11 a R$2,11 a cada R$100 | Venda R$100: custa R$0,39 |
| Trocar | GRATIS* | 0,5 a 2% de spread | Economize R$0,50 a R$2 a cada R$100 | Troque R$100: R$0 |
| Crescer (Estrategias) | Gratis pra entrar, 0,39% pra sair | N/A | Opcoes de crescimento que seu banco nao oferece | Entra com R$100: gratis. Sai com R$100: custa R$0,39 |
| Sacar | 0,48% | 1 a 3% + demora | Economize ate R$2,52 a cada R$100 | Saque R$100: custa R$0,48 |

**Nota de rodape (abaixo da tabela, texto pequeno):**

```
*Taxa diBoaS mostrada. Taxas de rede de terceiros podem se aplicar (geralmente menos de R$0,05).
```

**Exemplo resumo:**

```
Um investimento de R$100 custa R$0 no diBoaS. Vender custa 39 centavos.
```

**Linha de rodape:**

```
Cada taxa. Na mesa. Nada mais.
```

---

## SECAO 6: QUAL E A PEGADINHA?

### Content

**H2:**

```
Qual e a pegadinha?
```

**Body:**

```
Pergunta justa. Aqui vai a resposta de verdade:

Investir e gratis. Quando voce vende, a gente cobra 0,39%. Se voce vender R$100, a gente ganha 39 centavos. A unica forma da gente ganhar mais e se o seu dinheiro crescer. Nossos incentivos estao alinhados com os seus.

Sem mensalidade. Sem cobrancas surpresa. Sem multa pra sacar.

Como? Tecnologia nova eliminou as agencias, os executivos e os custos antigos. A gente repassa essa economia pra voce.

Tem risco? Tem. Seu dinheiro nao ta num banco. Ele ta trabalhando com tecnologia nova. Isso quer dizer que pode crescer mais, mas tambem tem risco real. A gente monitora 24 horas por dia e testa toda estrategia contra crises passadas (COVID, FTX, Terra), mas nao da pra garantir retorno, e quem disser que da ta mentindo.

A gente ganha quando voce ganha. A gente te mostra os dois lados, as oportunidades E os riscos, sempre.
```

---

## SECAO 6.5: COMO FUNCIONA POR DENTRO

### Content

**Label do toggle (sempre visivel):**

```
Quer os detalhes tecnicos?
```

**Conteudo expandido:**

```
Arquitetura: o diBoaS e construido sobre infraestrutura financeira de codigo aberto. Sua carteira e protegida de forma que ninguem, incluindo o diBoaS, possa acessar seus fundos. So voce pode autorizar transacoes.

Sua carteira: cada usuario recebe sua propria carteira pessoal com sua propria chave privada. O diBoaS nunca ve, guarda ou tem acesso a sua chave. Se o diBoaS desaparecesse amanha, seu dinheiro continuaria sendo seu.

Seguranca: toda estrategia e testada contra crises historicas do mercado antes de ser oferecida aos usuarios. Monitoramos todas as posicoes 24 horas por dia. A assinatura de transacoes acontece em milissegundos.

Transparencia: todas as taxas sao divulgadas antecipadamente. Todos os riscos sao declarados de forma clara. Sem mecanismos escondidos.
```

**Link (no final do conteudo expandido):**

```
Veja a documentacao tecnica completa
```

Link: /strategies

---

## SECAO 7: DEMO INTERATIVA

### Content

**Transition hook (de Como Funciona):**

```
Nao acredite so na nossa palavra.
```

**H2:**

```
O que seus R$100 fariam aqui?
```

**Sub:**

```
Sem cadastro. Sem dinheiro de verdade. So a prova.
```

**CTA 1 (Botao primario):**

```
Teste com R$100 (dinheiro de pratica)
```

**CTA 2 (Botao secundario/menor):**

```
Quer comecar menor? Veja o que R$10 pode virar.
```

---

## SECAO 8: PROVA SOCIAL

### Content

**H2:**

```
Os primeiros 1.200.
```

**Contador (dinamico, tempo real):**

```
[X] membros fundadores. [Y] paises. [Z] vagas restantes.
```

**Sub:**

```
Estamos comecando pequeno pra poder cuidar de cada pessoa que entra.
```

**CTA Button:**

```
Garantir minha vaga
```

---

## SECAO 8.5: SOBRE O FUNDADOR

### Content

**Foto:** Usar a imagem de `apps/web/public/assets/images/` (foto do Bar).

**Texto:**

```
Construido por Bar.

Eu cresci vendo minha avo Adelaide navegar um sistema financeiro que nao foi feito pra ela. Ela merecia ferramentas melhores. Todo mundo como ela tambem merece.

O diBoaS esta sendo criado em Berlim, Alemanha, construido pra pessoas nos EUA, na Europa e no Brasil. Eu tenho mais de 20 anos trabalhando com Produtos e TI no Brasil, nos EUA, no Japao e na Alemanha. Agora estou construindo a ferramenta financeira que eu queria que minha avo tivesse.

Perguntas? Eu leio todos os emails. bar@diboas.com
```

---

## SECAO 9: LISTA DE ESPERA

### Versao A: Antes de atingir 1.200

**H2:**

```
Seja um dos primeiros 1.200.
```

**Sub:**

```
Estamos comecando pequeno pra poder cuidar de cada pessoa que entra.
```

**Lista de beneficios:**

```
Selo permanente de Membro Fundador (#47 de 1.200)
Seu nome no Mural dos Fundadores
5 convites pessoais
Beneficios exclusivos futuros so pra Membros Fundadores
```

**Contador:**

```
[Z] vagas restantes
```

**Campo de email** (placeholder: "Seu email")

**CTA Button:**

```
Garantir minha vaga
```

**Abaixo do CTA (texto pequeno):**

```
Sem spam. So seu convite quando estivermos prontos.
```

**Checkbox de privacidade:**

```
Concordo com a Politica de Privacidade
```

(Link "Politica de Privacidade" para /legal/privacy)

### Versao B: Apos atingir 1.200

**H2:**

```
As vagas de fundador esgotaram.
```

**Sub:**

```
Tem um codigo de convite? Voce entra como Membro Pioneiro, com seu proprio selo e 5 convites.
Sem codigo? Entre na lista prioritaria. Vamos abrir mais vagas em breve.
```

#### Caminho 1: Codigo de convite

**Campo de codigo** (placeholder: "Digite seu codigo de convite")

**CTA Button:**

```
Entrar com meu convite
```

#### Caminho 2: Lista de espera prioritaria

**Campo de email** (placeholder: "Seu email")

**CTA Button:**

```
Entrar na lista prioritaria
```

**Abaixo do CTA (texto pequeno):**

```
Sem spam. So seu convite quando estivermos prontos.
```

---

## SECAO 10: FAQ

### Content

**H2:**

```
Antes de voce decidir.
```

#### FAQ 1: O diBoaS e um banco?

**Pergunta:**

```
O diBoaS e um banco?
```

**Resposta:**

```
Nao. O diBoaS e uma plataforma que te ajuda a se conectar com oportunidades financeiras. A gente nao gerencia seu dinheiro e nao toma decisoes sobre seus fundos. Sua carteira e protegida de forma que so VOCE pode autorizar transacoes. A gente oferece as ferramentas, voce toma as decisoes.
```

#### FAQ 2: O diBoaS e pra todo mundo?

**Pergunta:**

```
O diBoaS e pra todo mundo?
```

**Resposta:**

```
Nao. Se voce quer que outra pessoa tome decisoes financeiras por voce, nao somos nos. Se voce quer um banco tradicional com agencia e extrato de papel, tambem nao somos nos.

O diBoaS e pra quem quer controle sobre o proprio dinheiro, transparencia sobre custos e acesso a oportunidades que antes exigiam R$50.000 de entrada. Voce nao precisa entender tudo agora, e pra isso que a gente ta aqui. Voce so precisa estar disposto a aprender.
```

#### FAQ 3: Posso sacar meu dinheiro a qualquer hora?

**Pergunta:**

```
Posso sacar meu dinheiro a qualquer hora?
```

**Resposta:**

```
Sim. Seu dinheiro e seu. Saque pra sua conta bancaria quando quiser. A taxa e 0,48%, entao sacar R$100 custa R$0,48. Nao tem periodo de carencia e nao tem multa. A gente processa seu saque na hora. O tempo de transferencia bancaria pode variar.
```

#### FAQ 4: Meu dinheiro esta seguro?

**Pergunta:**

```
Meu dinheiro esta seguro?
```

**Resposta:**

```
Seu dinheiro e protegido por voce. So voce tem as chaves. Ninguem mais pode acessar seus fundos sem sua permissao.

Dito isso, isso nao e conta bancaria. Criptoativos nao sao cobertos por esquemas de garantia de depositos. O valor dos seus ativos pode variar, e voce pode perder parte ou todo o seu investimento.

A gente te mostra os dois lados, as oportunidades e os riscos, sempre.
```

#### FAQ 5: Como isso e possivel sem taxas altas?

**Pergunta:**

```
Como isso e possivel sem taxas altas?
```

**Resposta:**

```
Eliminando os intermediarios, as agencias, os executivos, os custos antigos. Tecnologia nova faz o mesmo trabalho por uma fracao do preco. A gente repassa essa economia pra voce. Esse e o modelo inteiro.
```

#### FAQ 6: Qual o valor minimo pra comecar?

**Pergunta:**

```
Qual o valor minimo pra comecar?
```

**Resposta:**

```
R$10. O preco de um cafezinho. A maioria das plataformas de investimento exige R$500 a R$50.000 so pra abrir a porta. A gente acha que isso faz parte do problema.
```

#### FAQ 7: Posso usar o diBoaS so pra transferencias?

**Pergunta:**

```
Posso usar o diBoaS so pra transferencias?
```

**Resposta:**

```
Sim. Com certeza. Voce pode usar o diBoaS so pra enviar e receber dinheiro, gratis, instantaneo, mundial. As funcoes de investimento e crescimento estao la quando e se voce quiser. Sem pressao. Sem pacote.
```

#### FAQ 8: E se eu nao entendo de investimento?

**Pergunta:**

```
E se eu nao entendo de investimento?
```

**Resposta:**

```
E exatamente pra voce que a gente construiu isso. Nosso objetivo e fazer tao simples que qualquer pessoa consiga. Sem jargao. Sem decisoes complicadas. So opcoes claras e informacoes transparentes. Comece com R$10. Explore. Aprenda. A gente ta aqui em cada passo.
```

#### FAQ 9: E se algo der errado?

**Pergunta:**

```
E se algo der errado?
```

**Resposta:**

```
A tecnologia que a gente usa tem risco real. Retornos podem subir ou descer. Os sistemas nao sao perfeitos, nenhum sistema e. A gente monitora 24 horas por dia e testa toda estrategia contra crises passadas (COVID, FTX, Terra) antes de oferecer. A gente sempre vai te dizer o que ta acontecendo. Mas nao da pra eliminar todo risco, e quem disser que da ta mentindo.
```

#### FAQ 10: O que acontece com meu dinheiro se o diBoaS fechar?

**Pergunta:**

```
O que acontece com meu dinheiro se o diBoaS fechar?
```

**Resposta:**

```
Seu dinheiro ta na SUA carteira. Nao na nossa. Se o diBoaS desaparecesse amanha, voce ainda teria seus fundos, acessiveis pelas suas chaves de carteira. A gente nunca guarda seu dinheiro. Nunca pode. Isso nao e uma funcionalidade que a gente adicionou. E como o sistema inteiro foi construido.
```

#### FAQ 11: O diBoaS ja foi auditado?

**Pergunta:**

```
O diBoaS ja foi auditado?
```

**Resposta:**

```
Somos uma plataforma em pre-lancamento. Nossas estrategias sao testadas contra crises historicas e cenarios reais, e usamos protocolos auditados e estabelecidos. Conforme crescemos, planejamos buscar auditorias independentes de terceiros. Pra detalhes completos sobre os protocolos e a tecnologia por tras de cada estrategia, visite nossas paginas de Estrategias e Protocolos.
```

Links: "Estrategias" para /strategies, "Protocolos" para /protocols.

#### FAQ 12: O que acontece depois que eu me cadastro?

**Pergunta:**

```
O que acontece depois que eu me cadastro?
```

**Resposta:**

```
Voce vai receber um email com seu selo e numero de Membro Fundador, seu link pessoal de convite (5 convites pra compartilhar) e instrucoes pra comecar.

A partir dai, voce configura sua carteira, adiciona fundos e ta dentro.
```

---

## SECAO 11: RODAPE

### Avisos Obrigatorios

#### CVM Circular 6/2019: Tres Avisos Obrigatorios

**Aplica-se a:** SOMENTE pt-BR. NAO incluir MiCA.

**Textos (na integra, com destaque visual igual ao conteudo promocional):**

```
Retornos passados nao sao garantia de retorno futuro.
```

```
Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido.
```

```
Percentuais prospectivos refletem apenas a opiniao do autor, com base em informacoes disponiveis a epoca e consideradas confiaveis.
```

Nota: Acentos adequados devem ser aplicados na implementacao final (nao, sao, garantia, etc.)

#### Divulgacao de IA

**Aplica-se a:** TODOS os idiomas.

**Texto (na integra, nao modificar):**

```
Parte do conteudo desta plataforma, incluindo analises de mercado e materiais educacionais, e gerado ou assistido por inteligencia artificial. Conteudo gerado por IA pode conter erros ou limitacoes. Usuarios devem verificar informacoes de forma independente antes de tomar decisoes financeiras.
```

### Elementos Adicionais do Rodape

- Linguagem de autonomia do usuario / nao-custodia (uma linha breve)
- Divulgacao de depoimentos ficticios: "Depoimentos nesta pagina sao exemplos ilustrativos e nao representam usuarios reais."
- Links sociais: Instagram, X, YouTube, LinkedIn
- Links de navegacao: Sobre, Legal, Politica de Privacidade, Termos de Servico, Politica de Cookies, Ajuda, Seguranca
- Copyright: (c) 2026 diBoaS. Todos os direitos reservados.

### IMPORTANTE: Correcoes de Locale

- REMOVER todo texto MiCA (Article 68 e Article 7). Nao se aplica ao Brasil.
- Corrigir gramatica: "Oportunidades justa" deve ser "oportunidades justas" em toda a pagina.
- Garantir que os 3 avisos CVM tenham destaque visual IGUAL ao conteudo promocional.

---

## HOOKS DE TRANSICAO: MAPA COMPLETO

| Apos Secao | Texto do Hook | Leva Para |
|------------|---------------|-----------|
| 1. Hero | E por isso que eu estou construindo isso. | Historia de Origem |
| 2. Historia de Origem | Eu construi pra voce. | Carrossel de Personas |
| 2.5. Carrossel de Personas | E e assim que funciona na pratica. | Cenarios da Vida Real |
| 3. Cenarios | Veja como funciona. | Carrossel de Produtos |
| 4. Carrossel de Produtos | Agora vamos falar de dinheiro. | Tabela de Taxas |
| 5. Tabela de Taxas | (fluxo natural) | Qual e a Pegadinha |
| 6. Qual e a Pegadinha | (fluxo natural) | Como Funciona por Dentro |
| 6.5. Como Funciona | Nao acredite so na nossa palavra. | Demo |
| 7. Demo | (fluxo natural) | Prova Social |
| 8. Prova Social | (fluxo natural) | Sobre o Fundador |
| 8.5. Sobre o Fundador | (fluxo natural) | Lista de Espera |
| 9. Lista de Espera | (fluxo natural) | FAQ |
| 10. FAQ | (fluxo natural) | Rodape |

---

## REGRAS DE MARCA (PT-BR)

### Filtro Adelaide

Cada palavra nesta pagina deve passar no Teste da Avo: a avo Adelaide entenderia? Se nao, reescreva.

### Palavras Banidas na Pagina Principal

- Blockchain
- DeFi
- Protocolo(s) (exceto Secao 6.5)
- Stablecoin(s)
- Pegged / Atrelado
- On-ramp / Off-ramp
- Smart contract(s) / Contrato inteligente
- Yield (usar "retornos" ou "crescimento")
- Non-custodial / Nao-custodial (usar "voce tem as chaves" ou "voce controla seus fundos")

### Promessa da Marca

```
A gente te mostra os dois lados, as oportunidades e os riscos, sempre.
```

Maximo 2 aparicoes na pagina:
1. Secao 6: Qual e a Pegadinha (ultima linha)
2. FAQ 4: Meu dinheiro esta seguro? (ultima linha)

### Regras de Voz (PT-BR)

- Segunda pessoa (voce). O leitor e sempre o sujeito.
- Quente e direto. Mais informal que o EN. Tom de conversa.
- Honesto sobre limitacoes. Divulgacao de risco e uma caracteristica da marca.
- Frases simples. Se precisa de virgula, considere dividir.
- Zero emojis no corpo do texto.
- "Pra" em vez de "para" em contextos coloquiais e permitido.
- Tom de avo brasileira: mais caloroso, mais proximo, mais pessoal.

---

## NOTAS DE ADAPTACAO CULTURAL

| Aspecto | EN | PT-BR | Motivo |
|---------|-----|-------|--------|
| Transferencias domesticas | Ponto de dor forte | Nao e ponto de dor (PIX e gratis) | PIX resolveu isso no Brasil |
| Transferencias internacionais | Secundario | Ponto de dor PRINCIPAL | IOF, spread cambial, demora, custo alto |
| Acesso a dolar | Nao mencionado | Valor central | Brasileiro quer protecao contra Real |
| Poupanca | "Savings account" | "Poupanca" | Referencia direta ao produto que todo brasileiro conhece |
| Valor minimo | $5 (cafe) | R$10 (cafezinho) | Equivalencia cultural |
| Dor bancaria | Fees genericas | Tarifas, pacotes, anuidade | Vocabulario especifico brasileiro |
| Investimento minimo | $10,000 | R$50.000 | Realidade brasileira para fundos decentes |
| Manutencao de conta | $25/month | R$30/mes | Realidade brasileira |

**Final do documento PT-BR.**
