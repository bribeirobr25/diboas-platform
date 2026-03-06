# Sobre o diBoaS — Copy Final (PT-BR)

## Status do Documento

| Campo | Valor |
|-------|-------|
| Versao | FINAL — Pos-CLO + Pos-Copywriter |
| Idioma | Portugues Brasileiro (PT-BR) |
| Data | 28 de fevereiro de 2026 |
| Base | ABOUT_PAGE_FINAL_EN.md |
| Adaptacao Cultural | Completa (nao e traducao literal) |
| CLO Review | Todos os fixes P0/P1 do EN aplicados. |
| Copywriter Review | Todos os fixes (FIX-1 Mission, FIX-2 Transition Hooks) aplicados. |
| Pendente | CEO sign-off (rotina) |

## Notas de Implementacao para CTO / Claude Code

Este documento contem a versao completa em portugues brasileiro da pagina About do diBoaS. ADAPTACAO CULTURAL profunda para o mercado brasileiro, nao traducao literal.

### Diferencas Criticas em Relacao ao EN

| Item | EN | PT-BR | Motivo |
|------|-----|-------|--------|
| Moeda | $5 | R$10 | Valor de entrada acessivel para BR |
| Minimo Card 3 | $10,000 | R$50.000 | Realidade bancaria brasileira |
| Dor bancaria | "almost nothing" | "poupanca rendendo quase nada" | Poupanca e referencia universal |
| Transferencias | Dor: taxas altas | Dor: custo INTERNACIONAL (PIX e gratis domestico) | PIX resolveu transferencias domesticas |
| Tom | Warm, direct | Mais quente, mais informal, "pra" permitido | Cultura brasileira |
| Regulatorio | MiCA (Art. 68 + Art. 7) | CVM 3-Warning (SEM MiCA) | Jurisdicao brasileira |
| Separador decimal | 0.39% (ponto) | 0,39% (virgula) | Formato numerico brasileiro |
| Separador de milhar | 1,000 (virgula) | 1.000 (ponto) | Formato numerico brasileiro |
| Avos | "grandmother" (distante) | "avo" (historia LOCAL — Rio) | O leitor brasileiro sente isso na pele |
| Standort Berlin | Neutral | Internacional (competencia global) | Brasileiro valoriza empresa com presenca europeia |

### Regras Globais

- NENHUM travessao na pagina inteira. Usar virgulas, pontos, dois pontos ou quebras de linha.
- NENHUM emoji no corpo do texto.
- Filtro Adelaide se aplica: sem jargao. Sem "stablecoins," "protocolos," "DeFi," "yield," "APY."
- Transition hooks como texto sutil de transicao.
- Footer usa componente compartilhado de disclaimers (mesmo do B2C, Estrategias, Protocolos).
- "Pra" em vez de "para" e permitido em contextos coloquiais.

### Fluxo de Secoes

| # | Secao | Componente | Mudancas |
|---|-------|------------|----------|
| 1 | Hero | `PageHeroSection` | Subtitulo adaptado |
| t1 | Transicao | Texto sutil de transicao | **NOVO** |
| 2 | A Historia | `SectionContainer` + prosa | H2 + body adaptado |
| t2 | Transicao | Texto sutil de transicao | **NOVO** |
| 3 | O que o diBoaS faz | `SectionContainer` + prosa | Completo. Transferencias gratis primeiro. |
| 4 | No que a gente acredita | `ContentCard` x 3 | Os 3 cards adaptados |
| 5 | A Missao | `SectionContainer` | Callback pra Adelaide com detalhes concretos |
| t3 | Transicao | Texto sutil de transicao | **NOVO** |
| 6 | Pra Empresas | `SectionContainer` + CTA | Expandido com dores brasileiras |
| t4 | Transicao | Texto sutil de transicao | **NOVO** |
| 7 | Contato | `SectionContainer` | "Bar" + email pessoal |
| 8 | Lista de Espera | `WaitlistSection` | Sem mudancas |
| — | Rodape | Componente compartilhado | **NOVO: CTO deve implementar** |

### Transition Hooks

| Hook | Texto | Posicao |
|------|-------|---------|
| t1 | "Deixa eu te contar uma historia." | Depois do Hero, antes da Secao 2 |
| t2 | "Isso aqui e o que eu construi." | Depois da Secao 2, antes da Secao 3 |
| t3 | "E nao e so pra pessoa fisica." | Depois da Secao 5, antes da Secao 6 |
| t4 | "Quer conversar? To aqui." | Depois da Secao 6, antes da Secao 7 |

**Notas sobre os hooks:**
- t1: "Deixa eu te contar" e mais intimo que "Vou te contar." Tom de conversa entre amigos.
- t4: "To aqui" (contraido) e mais natural que "Estou aqui" para o tom brasileiro.

---

## SECAO 1: HERO

**H1:**

```
Sobre o diBoaS
```

**Subtitulo:**

```
Uma avo. Um problema. Uma plataforma.
```

### Notas

- "Uma avo" (nao "uma avozinha") — respeito sem diminutivo. O diminutivo seria falso aqui.

---

## SECAO 2: A HISTORIA

**H2:**

```
O nome dela era Adelaide.
```

**Body:**

```
Minha avo viveu a vida inteira no Rio de Janeiro. Ela me ensinou a economizar. Ela dizia que eu deveria tentar guardar metade de tudo que eu ganhasse. Ela mesma tentou isso. A vida inteira.
```

**Body (medium-weight):**

```
Trabalhar duro. Comprar so o basico. Tentar guardar.
```

**Body (bold):**

```
Mesmo assim nao deu.
```

**Body:**

```
O que ninguem contou pra ela: o banco dela pagava quase nada enquanto ganhava rendimentos de verdade com o dinheiro dela. Essa diferenca, entre o que os bancos ganham e o que eles repassam, e o sistema funcionando exatamente como foi feito. So que nao pra gente como ela.
```

**Body:**

```
O acesso tava trancado atras de valores minimos altos, palavras complicadas e instituicoes que nao se importavam com quem tinha pouca economia.
```

**Body:**

```
Em 2024, eu perdi meu emprego e decidi fazer alguma coisa sobre esse problema. Tecnologia nova tornou possivel passar por cima de quem controlava o acesso. Eu so precisava construir a porta.
```

**Body (medium-weight):**

```
Eu dei o nome dela.
```

### Notas

- "O nome dela era Adelaide." deve coincidir exatamente com B2C Secao 2 H2.
- "Eu dei o nome dela." e o fechamento emocional. Adicionar espacamento acima.
- "Mesmo assim nao deu." e mais forte que "Nao funcionou" porque reconhece o esforco e usa linguagem coloquial brasileira.
- Rio de Janeiro e LOCAL para o leitor brasileiro. Essa historia aconteceu AQUI. Isso muda tudo. O leitor nao esta lendo sobre uma avo distante em outro pais. Ele esta lendo sobre a avo dele, a vizinha dele, a mae dele. Essa e a diferenca fundamental dessa versao.
- "Tava trancado" em vez de "estava trancado" — tom coloquial permitido.
- "Guardar" em vez de "economizar" no medium-weight. Brasileiro fala "guardar dinheiro," nao "economizar dinheiro" no dia a dia.

---

## SECAO 3: O QUE O diBoaS FAZ

**H2:**

```
O que o diBoaS faz
```

**Body (paragrafo 1 — transferencias gratis):**

```
Primeiro, o basico. Mande dinheiro pra qualquer pessoa no diBoaS. Em qualquer lugar do mundo. Em segundos. De graca. Sem formulario, sem taxa, sem esperar tres dias uteis. Dinheiro deveria se mover como uma mensagem. Agora se move.
```

**Micro-disclaimer (texto pequeno, abaixo do paragrafo 1):**

```
Transferencias gratuitas entre usuarios do diBoaS. Tempos de transferencia sao tipicos e podem variar. Sujeito a sancoes aplicaveis e requisitos de conformidade.
```

**Body (paragrafo 2 — crescimento):**

```
Depois, crescimento. Escolha entre 10 formas de fazer seu dinheiro crescer, da opcao mais segura ate a mais aventureira. A partir de R$10. Seu dinheiro trabalha por meio de sistemas financeiros confiaveis que ja protegeram bilhoes em ativos. O mesmo tipo de sistema que as instituicoes usam, agora aberto pra voce.
```

**Body (paragrafo 3 — Adelaide AI, medium-weight):**

```
E a Adelaide cuida de tudo. Batizada com o nome da avo que inspirou isso tudo, Adelaide e a sua inteligencia financeira pessoal. O que ta se movendo. O que significa. O que voce pode fazer. Linguagem clara, sem jargao.
```

### Notas

- Transferencias gratis vem PRIMEIRO (prioridade do CEO).
- "Dinheiro deveria se mover como uma mensagem" e a linha de posicionamento OneFi.
- R$10 minimo (nao R$5 — valor de entrada acessivel para o Brasil).
- Para o leitor brasileiro, transferencias gratis tem um significado diferente: PIX ja e gratuito domesticamente. A dor real e INTERNACIONAL (IOF, spread cambial, demora, custo de remessa). O copy "em qualquer lugar do mundo" direciona pra essa dor sem excluir o uso domestico.
- "Sistemas financeiros confiaveis" em vez de "protocolos" (Filtro Adelaide).
- "Batizada com o nome da avo" e mais natural em portugues que "nomeada em homenagem."
- "O que ta se movendo" — tom coloquial permitido.

---

## SECAO 4: NO QUE A GENTE ACREDITA

**H2:**

```
No que a gente acredita
```

### Card 1

**Titulo:**

```
Seu dinheiro deveria trabalhar pra voce.
```

**Descricao:**

```
Nao pro seu banco. Nao pra um intermediario. Pra voce. A diferenca entre o que os bancos ganham com o seu dinheiro e o que eles te devolvem e real. A gente fecha essa diferenca.
```

### Card 2

**Titulo:**

```
Honestidade acima de promessa.
```

**Descricao:**

```
A gente nao promete retorno garantido porque ninguem pode. O que a gente oferece: dados reais de quase 4 anos de analise historica, explicacoes claras de como cada opcao funciona, e um Centro de Aprendizado pra voce entender o que ta fazendo antes de fazer. A gente te mostra os dois lados, as oportunidades e os riscos, sempre.
```

### Card 3

**Titulo:**

```
Comece com R$10. Aprenda no caminho.
```

**Descricao:**

```
Voce nao precisa de R$50.000 pra comecar. Comece com o que voce se sentir confortavel. Veja como funciona. Depois decide se e pra voce. Sem pressao, sem pacote, sem amarra.
```

### Notas

- Card 2 contem a promessa de marca (1 de max. 2 aparicoes): "A gente te mostra os dois lados, as oportunidades e os riscos, sempre." Deve ser literal.
- "Quase 4 anos" — nao "4 anos" (exigencia CLO).
- "Ninguem pode" — anti-garantia mais forte da plataforma.
- R$50.000 reflete a realidade brasileira: fundos de investimento decentes exigem esse minimo.
- "Sem amarra" e mais natural e emocional que "sem compromissos de longo prazo" em portugues brasileiro.
- "Honestidade acima de promessa" — adaptacao de "Honesty over hype." "Hype" nao traduz bem. "Promessa" captura a ideia de que outros prometem demais.
- "A gente" em vez de "nos" — tom mais proximo, mais brasileiro.

---

## SECAO 5: A MISSAO

**H2:**

```
A Missao
```

**Body:**

```
Adelaide nunca teve escolha. Valores minimos altos, taxas escondidas e palavras complicadas mantiveram a porta fechada.
```

**Statement (medium-weight):**

```
A gente ta construindo a porta que ela nunca teve.
```

**Pilares:**

```
Dinheiro que se move de graca. Opcoes reais de crescimento. Transparencia total. A partir de R$10. Em quatro idiomas. Pra todo mundo.
```

### Notas

- "Adelaide nunca teve escolha" conecta com a Secao 2.
- "A porta que ela nunca teve" espelha "Eu so precisava construir a porta" da Secao 2.
- "A partir de R$10. Em quatro idiomas. Pra todo mundo." — concreto e verificavel.
- "A gente ta construindo" — tom coloquial brasileiro, mais proximo que "estamos construindo."

---

## SECAO 6: PRA EMPRESAS

**H2:**

```
Pra Empresas
```

**Body (paragrafo 1):**

```
Se voce aceita pagamento com cartao, as taxas de processamento comem cada transacao. Se tem dinheiro parado na conta da empresa, seu banco ta ganhando com ele e te pagando quase nada. O mesmo sistema que nao serviu pra minha avo ta sentado em cima das reservas da sua empresa.
```

**Body (paragrafo 2):**

```
diBoaS for Business ajuda empresas a ficar com mais do que ganham, com liquidez no mesmo dia, relatorios prontos pra diretoria, e acesso aos mesmos sistemas confiaveis que movem nossa plataforma pessoal.
```

**CTA:**

```
Saiba mais sobre o diBoaS for Business
```

CTA leva pra: `/business`

### Notas

- "Taxas de processamento" — termo padrao brasileiro.
- "Relatorios prontos pra diretoria" em vez de "board-ready reporting" — adaptacao pra estrutura empresarial brasileira.
- O callback pra avo funciona tambem no contexto B2B: "O mesmo sistema que nao serviu pra minha avo..."
- "Ta sentado em cima" — tom coloquial mas eficaz. Transmite urgencia e absurdo.

---

## SECAO 7: CONTATO

**H2:**

```
Contato
```

**Dados de contato:**

```
Fundador: Bar
Sede: Berlim, Alemanha
Email: hello@diboas.com
```

**Linha pessoal:**

```
Perguntas? Eu leio todos os emails. bar@diboas.com
```

### Notas

- "Bar" (nao "Breno"). Coincide com B2C Secao 8.5.
- "Berlim, Alemanha" — pra o leitor brasileiro, ter sede na Europa transmite seriedade e regulacao. E um sinal de confianca diferente: "essas pessoas nao estao em algum pais obscuro."
- "Eu leio todos os emails." — pessoal e direto. Tom de fundador acessivel.

---

## SECAO 8: LISTA DE ESPERA

Sem mudancas de copy. Usa componente compartilhado `WaitlistSection`.

---

## RODAPE

### Avisos Obrigatorios

#### CVM 3-Warning (OBRIGATORIO — SEM MiCA)

**Este bloco e OBRIGATORIO no Brasil. NÃO incluir MiCA.**

```
Aviso 1: As operacoes com criptoativos envolvem riscos. Esses ativos podem aumentar ou diminuir de valor e podem perder todo o seu valor. Nao ha garantia de que os ativos digitais possam ser convertidos para a moeda de referencia.

Aviso 2: Desempenho passado nao e garantia de resultados futuros.

Aviso 3: Este produto pode nao ser adequado para o perfil do investidor.
```

**Nota:** Os 3 avisos CVM devem ter destaque visual IGUAL ao conteudo promocional. Texto pequeno e aceitavel desde que o peso visual seja equivalente.

#### Divulgacao de IA (em portugues)

```
Parte do conteudo desta plataforma, incluindo analises de mercado e materiais educacionais, e gerado ou assistido por inteligencia artificial. Conteudo gerado por IA pode conter erros ou limitacoes. Usuarios devem verificar informacoes de forma independente antes de tomar decisoes financeiras.
```

Usa o mesmo componente compartilhado do B2C, Estrategias e Protocolos.

### IMPORTANTE

- REMOVER todo texto MiCA. NÃO se aplica ao Brasil.
- Garantir que os 3 avisos CVM tenham destaque visual IGUAL ao conteudo promocional.

---

## SEO

```json
{
  "seo.title": "Sobre o diBoaS | Construido pra quem os bancos esqueceram",
  "seo.description": "O diBoaS foi construido porque uma avo merecia mais. Agora todo mundo merece. Transferencias gratis, opcoes reais de crescimento, a partir de R$10.",
  "seo.ogTitle": "Sobre o diBoaS | Construido pra quem os bancos esqueceram",
  "seo.ogDescription": "O diBoaS foi construido porque uma avo merecia mais. Agora todo mundo merece. Transferencias gratis, opcoes reais de crescimento, a partir de R$10."
}
```

---

## VERIFICACAO DE CONSISTENCIA CROSS-PAGE

| Elemento | Outras Paginas | Pagina About | Coincide |
|----------|----------------|--------------|----------|
| "O nome dela era Adelaide" | B2C Secao 2 | Secao 2 H2 | ✅ |
| "Bar" (nao "Breno") | B2C + B2B | Secoes 2, 7 | ✅ |
| R$10 minimo | B2C FAQ, Estrategias | Secoes 3, 4, 5 | ✅ |
| "Quase 4 anos" | Estrategias hero | Secao 4 Card 2 | ✅ |
| Promessa de marca literal | B2C (2x) | Secao 4 Card 2 | ✅ |
| Filtro Adelaide | Todas as paginas | Limpo (0 violacoes) | ✅ |
| 10 estrategias | B2C Secao 4 | Secao 3 | ✅ |
| "Eu dei o nome dela" | B2C Secao 2 | Secao 2 fechamento | ✅ |
| Transferencias gratis = prop principal | B2C hero | Secao 3 paragrafo 1 | ✅ |
| Transition hooks | B2C (7), Protocolos (5) | About (4) | ✅ |
| CVM footer (SEM MiCA) | Todas as paginas PT-BR | Rodape | ✅ |

---

## NOTAS DE ADAPTACAO CULTURAL

| Aspecto | EN | PT-BR | Motivo |
|---------|-----|-------|--------|
| Historia da avo | Distante (outro pais) | LOCAL (Rio de Janeiro) | O leitor brasileiro sente na pele. Essa e a avo DELE. |
| "It still didn't work" | Direto | "Mesmo assim nao deu" | Coloquial, reconhece o esforco, gutural |
| Dor bancaria | Generica "high fees" | Poupanca rendendo quase nada | Todo brasileiro sabe que a poupanca rende pouco |
| Valor minimo | $10,000 | R$50.000 | Realidade brasileira pra fundos decentes |
| Transferencias gratis | Dor principal | Dor INTERNACIONAL (PIX e gratis domestico) | "Em qualquer lugar do mundo" direciona pra dor real |
| B2B linguagem | "board-ready" | "Pra diretoria" | Estrutura empresarial brasileira |
| Localizacao | Neutral | Internacional (gera confianca) | Brasileiro valoriza empresa europeia como sinal de seriedade |
| "Three business days" | Contexto US | "Tres dias uteis" | Mesmo dor, termo local |
| "Locked-in commitments" | Contratos US | "Amarra" | Emocional, coloquial, forte |
| "Hype" | Ingles | "Promessa" | "Hype" nao traduz bem; "promessa" captura o overclaim |
| "We" | "We" | "A gente" | Mais proximo, mais brasileiro, menos corporativo |
| "Grandmother" | "Grandmother" | "Avo" | Mesma palavra, mas peso emocional DIFERENTE pra brasileiro |

### Nota Especial sobre a Historia

A historia da Adelaide tem um peso COMPLETAMENTE diferente para o leitor brasileiro. No EN, DE e ES, e uma historia sobre uma avo em um pais distante (Rio de Janeiro = exotico). No PT-BR, e uma historia sobre a avo que mora na rua de baixo. Todo brasileiro conhece uma Adelaide. A vizinha que trabalhou a vida inteira e nao conseguiu guardar nada. A mae que colocou tudo na poupanca e viu o dinheiro perder valor. A tia que nunca entendeu por que o banco cobrava tanto.

Essa proximidade e a arma secreta da versao PT-BR. O copy nao precisa convencer o leitor de que o problema existe. O leitor ja sabe. O copy so precisa mostrar que alguem finalmente esta fazendo alguma coisa a respeito.

**Fim do documento PT-BR.**
