# Método reutilizável

## Contratos antes da implementação

Os sete requisitos desta rodada foram confrontados com o guia editorial
versionado, o contrato dos dados, a implementação e os testes anteriores.
Relatos históricos orientam a investigação; não substituem reprodução.

| Requisito                                                    | Oráculo independente                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| R1: coleta completa não reativa ETF                          | ETF continua UNAVAILABLE/suspended; contribuição zero                        |
| R2: completude não prova atualidade                          | preenchimento de campos não remove suspensão nem comprova observação semanal |
| R3: âncora, coleta, observação e publicação são distintos    | preservar os valores disponíveis; não criar datas desconhecidas              |
| R4: coleta incompleta não renova confiança                   | última âncora completa + 21 dias; LOW estritamente depois do limite          |
| R5: repetir não duplica o ledger nem muda evidência anterior | prefixo preservado byte a byte; um registro por âncora                       |
| R6: indisponível não equivale a demanda fraca                | texto/status próprios, inclusive nos quatro idiomas e na árvore acessível    |
| R7: testes não provam previsão                               | nenhuma inferência financeira a partir dos resultados                        |

O guia editorial confirma a escala de 14 pontos, sem reescalonamento. Para o
teste exaustivo, os pesos dos dez sinais restantes são declarados na fixture;
o valor esperado é calculado por soma independente, com as cinco faixas
publicadas. O resultado histórico 10/14 não é imposto aos cenários.

## Contradições registradas antes de escolher a expectativa

- **Datas sem ledger (N03):** o requisito R3 proíbe inventar datas; a função
  `etfLedgerEntry` explicitamente usa o dia da execução quando o ledger está
  vazio. O teste pede `null`, permitido pelo tipo público, como proposta de
  contrato. O defeito factual é a data avançar sem evidência; a representação
  final e a confiança sem histórico ainda dependem de decisão.
- **Limite mensal (N02):** a regra de geração troca o mês esperado no início do
  dia 4 UTC; a leitura usa `now > delayed_after`. Em igualdade, discordam.
  O oráculo exige equivalência mantendo os mesmos dados, sem escolher
  arbitrariamente qual componente deveria prevalecer.
- **Recuperação JSONL (K01/N01):** o leitor tolera a cauda truncada e o comentário
  promete recuperação na próxima execução. O appender concatena a nova linha à
  cauda, tornando-a ilegível. O oráculo exige que um resultado `recorded` ou
  `refused` com evidência corresponda a um registro legível e preserve o prefixo.
- **M2 (K03/K04):** “12-month ROC” requer meses correspondentes e números
  válidos; verificar apenas quantidade de linhas ou recência não demonstra isso.
- **Memo:** o controle existente declara verificar números, não o significado
  de cada frase. O experimento não exige que esse controle já seja um parser
  semântico; demonstra o que sua aprovação não garante.

Não se escolheu “todas as 11 chaves obrigatórias” como novo oráculo: a regra
atual define completude dos fundos listados, e o coletor enumera 11. Alterar
esse contrato exigiria uma decisão própria.

## Instrumentos e isolamento

1. Identificar `main` no GitHub; registrar PRs incluídos e pendentes.
2. Criar checkout próprio a partir desse SHA, sem copiar alterações locais.
3. Executar primeiro os testes existentes e o gerador em modo `--check`.
4. Fixar relógio e rede; usar somente valores sintéticos nos novos cenários.
5. Executar matriz de limites, estados pequenos exaustivos e sequências com
   semente fixa. Registrar falhas separadamente de limitações do instrumento.
6. Para cada proteção principal, executar controle limpo e depois sua
   sabotagem numa cópia descartável. Exigir falha da asserção correspondente;
   erro de importação, sintaxe, timeout ou ambiente não conta como detecção.
7. Reexecutar casos mínimos em modo estrito e conservar apenas evidência útil.
8. Revisar conteúdo publicável, diff, checks e abrir PR draft sem correções
   de produção. Reavaliar a base quando outras alterações forem integradas.

O CLI real é executado em processo filho, com ambiente permitido explícito,
chave fictícia, relógio fixo e `fetch` substituído. Toda requisição é registrada
antes de ser respondida; requisições não previstas são recusadas. O stub usa
esperas aceleradas somente no filho. O teste mede os códigos 1/20/21/22,
mensagens, bytes do ledger, evidências e reexecução.

As falhas de escrita cobrem cauda interrompida e exceção antes de rename.
Não simulam perda elétrica, corrupção de disco ou concorrência entre processos.
Chamadas repetidas ao coletor incompleto representam novas tentativas e podem
acrescentar evidências; a idempotência de âncoras se aplica ao ledger. Evidências
anteriores nunca são substituídas.

## Limites definidos para a rodada

- 200 sequências, quatro semanas por sequência, de zero a três recusas antes
  do sucesso; PRNG xorshift32, semente `20261020`.
- 1.024 combinações exaustivas dos outros dez sinais; nenhuma amostragem
  aleatória necessária para esse espaço.
- Timeout de 30 segundos por subprocesso; cinco sabotagens com um controle
  limpo por alvo; quatro experimentos do memo. Sem serviços pagos.
- Relógio nas fronteiras: −1 ms, igualdade e +1 ms; três representações
  equivalentes de instante com offsets, incluindo mudança de mês/ano.
- Inspeção pública limitada a 12 páginas, requisições sequenciais; uma amostra
  de tempo por URL. Não interpretar esses tempos como p95, SLA ou carga máxima.
- Expansão para M2 e meses obrigatórios motivada pelas lacunas já documentadas
  e pela discrepância entre profundidade e continuidade observadas no motor.

As sequências aleatórias não produziram contraexemplo; portanto não houve
redução automática a executar. As falhas determinísticas foram reduzidas a
uma cauda parcial e uma escrita; uma fonte mensal na igualdade do prazo; e
ledger vazio em duas datas. Não se apresenta frequência simulada como
probabilidade real.

## Encerramento e confidencialidade

Encerrar quando os cenários da matriz tiverem resultado ou limite explícito,
as falhas forem reproduzidas e as cinco sabotagens forem verificadas.
Não ampliar por meta de cobertura ou pontuação de mutação.

Os arquivos adicionados contêm fixtures sintéticas, resultados resumidos,
hashes e fatos verificáveis no código público. Não incluem posições jurídicas,
documentos de autoridade, dados pessoais, credenciais, relatórios privados,
respostas cruas de fornecedores ou cópias de séries financeiras.
A saída dos experimentos não inclui chaves; o stub as mascara.

Este procedimento prepara uma futura skill. Nenhuma skill foi criada,
modificada ou instalada.

## Atualização após o merge do #713 — base 6ebeab2f

O método original acima é preservado como descrição da primeira rodada.
Nesta revalidação, sucesso snapshot-only exige saída 0 e nenhuma requisição
fora do ETF. A03/A04 verificam também a recuperação após recusa/falha.
A06/K06 usam as regressões canônicas SNAP-ONLY-1 do #713. O código 22 não é
critério de sucesso nem uma falha após gravação reproduzida no novo `main`.
M06 remove o retorno antecipado numa cópia: detecta uma regressão plantada,
não um defeito presente. São seis sabotagens nesta execução.

K02/K07/K08 são verificados pelos testes normais de apresentação e
acessibilidade já integrados, incluídos em `pnpm market:audit`. A ausência de
cópias não elimina os requisitos. Os identificadores históricos permanecem
mapeados na matriz e no relatório original.

N03 agora compara a data de evidência em duas execuções sem nenhum registro:
não pode avançar sem evidência nova. Esse oráculo reproduz o defeito factual
sem impor `null` como representação final nem exigir LOW sem histórico.
A política de confiança sem histórico e a representação recomendada continuam
propostas não aprovadas, fora dos testes de contrato e sem alteração de produção.
Os sete `defect(...)` restantes exigem reprodução estrita, identificação e caso
mínimo na matriz; um erro de montagem não conta como confirmação do defeito.
