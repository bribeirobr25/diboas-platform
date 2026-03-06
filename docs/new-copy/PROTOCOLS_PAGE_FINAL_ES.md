# diBoaS Pagina de Protocolos — Copy FINAL (ES)

## Estado del Documento

| Campo | Valor |
|-------|-------|
| Version | v1.3 — Fixes de copywriter aplicados |
| Idioma | Espanol (ES) |
| Fecha | 28 de febrero de 2026 |
| Base | PROTOCOLS_PAGE_FINAL_EN.md v1.3 |
| Adaptacion Cultural | Completa (no es traduccion literal) |
| CLO Review | Todos los fixes P0/P1 del EN aplicados. MiCA Art. 68 + Art. 7 en espanol. |
| Copywriter Review | Los 6 fixes + 4 polish del EN aplicados. |
| Pendiente | Confirmacion del CEO sobre Balancer (posicion CLO: defendible). |

## Notas de Implementacion para CTO / Claude Code

Este documento contiene la version completa en espanol de la pagina de Protocolos. ADAPTACION CULTURAL orientada al mercado europeo (Espana como mercado principal), no traduccion literal.

### Diferencias Criticas Respecto al EN

| Item | EN | ES | Motivo |
|------|-----|-----|--------|
| Moneda | $1,000 | 1.000 EUR | Mercado europeo |
| Minimo | $5 | 5 EUR | Valor minimo UE |
| Separador decimal | 0.39% (punto) | 0,39% (coma) | Formato europeo |
| Separador de miles | 1,000 (coma) | 1.000 (punto) | Formato europeo |
| Regulatorio | MiCA en ingles | MiCA en espanol (Art. 68 + Art. 7) | Jurisdiccion UE |
| Tratamiento | "you" | "tu" (informal) | Fintechs espanolas usan tu (N26, Trade Republic) |
| Tono | Warm, direct | Cercano, directo, sin ser demasiado coloquial | Cultura fintech espanola |
| Referencia bancaria | "bank savings" | "deposito a plazo fijo" / "cuenta de ahorro" | Referencia bancaria espanola |
| Textos regulatorios | "you" | "usted" (formal) para MiCA | Textos legales requieren tratamiento formal |

### Reglas Globales

- NINGUN caracter de raya. Usar comas, puntos, dos puntos o saltos de linea.
- NINGUN emoji en el cuerpo del texto.
- Todos los CTAs son botones salvo indicacion contraria.
- Filtro Adelaide RELAJADO para esta pagina. Terminos tecnicos (DeFi, protocolo, TVL, staking, stablecoin) son esperados y necesarios. Pero las descripciones deben priorizar claridad sobre jerga.
- Las descripciones de protocolos deben responder: "Que significa esto para mi dinero?"

### Flujo de Secciones

| # | Seccion | Tipo |
|---|---------|------|
| 1 | Hero | Estatico |
| 2 | Por que existe esta pagina | Estatico (3 parrafos + aviso) |
| 3 | Cuadricula de protocolos | Grid de tarjetas por categoria (7 categorias, 26 protocolos) |
| 4 | Como elegimos | Criterios con explicacion |
| 5 | TVL combinado | Estadistica destacada |
| 6 | Lo que esta pagina no es | Marco de riesgos/limitaciones |
| 7 | FAQ | Acordeon (8 preguntas) |
| 8 | Lista de espera / CTA | Captura de email |
| 9 | Pie de pagina | Avisos legales + fuentes de datos |

---

## SECCION 1: HERO

**H1:**

```
Donde trabaja tu dinero
```

**Subtitulo:**

```
Cada sistema. Cada nombre. Nada oculto.
```

**Linea de confianza (texto menor):**

```
26 protocolos. 7 categorias. Transparencia total sobre cada sistema que toca tu dinero.
```

---

**Transicion:**

```
Por eso construimos esta pagina.
```

---

## SECCION 2: POR QUE EXISTE ESTA PAGINA

**H2:**

```
Por que existe esta pagina
```

**Texto:**

```
Pregunta a tu banco adonde va tu dinero. No te lo van a decir.

Nosotros si. Cada sistema en esta pagina es uno que tu dinero puede tocar cuando usas una estrategia de diBoaS. Publicamos los nombres, el historial, las auditorias de seguridad y las cosas que salieron mal. Porque deberias saberlo.

Cada protocolo en esta pagina se gano su lugar. Comprobamos cuanto tiempo lleva funcionando, quien auditio el codigo, como manejo los problemas y si gente real le confia dinero real. Si no paso, no esta aqui.

Listamos 26 protocolos aqui. Nuestras estrategias actualmente usan 6 de ellos. El resto son protocolos que hemos investigado y aprobado, y podrian incluirse en futuras estrategias a medida que expandamos.
```

**Caja de aviso (fondo ambar, borde izquierdo):**

```
Importante: Estar listado aqui no significa riesgo cero. Significa que hicimos nuestro trabajo y somos honestos sobre lo que encontramos. Cada sistema en esta pagina conlleva riesgo tecnico, riesgo de mercado y la posibilidad de perdidas.
```

---

## SECCION 3: CUADRICULA DE PROTOCOLOS

**H2:**

```
Los 26 protocolos
```

**Subtitulo:**

```
Organizados por lo que hacen. Haz clic en cualquier tarjeta para ver detalles.
```

**Nota de actualizacion TVL (micro-texto bajo subtitulo):**

```
Todas las cifras de TVL son aproximadas, provienen de DeFiLlama y estan actualizadas a febrero de 2026. Los valores fluctuan diariamente.
```

---

### Categoria 1: Prestamos

**Titulo:** Protocolos de prestamo

**Descripcion:**

```
Tu depositas activos. Los prestatarios pagan intereses por usarlos. Tu ganas los intereses.
```

---

#### Tarjeta: Aave V3

**Nombre:** Aave V3

**Descripcion:**

```
El sistema de prestamos mas grande de las finanzas descentralizadas. Depositas activos, ganas intereses de prestatarios y puedes retirar en cualquier momento. Usado por instituciones y particulares en 18 blockchains.
```

**Detalles:**

| Fundado | 2017 (V3: 2022) |
| Valor Total Bloqueado | ~35.000 millones USD |
| Blockchains | Ethereum, Arbitrum, Polygon, + 15 mas |
| Auditorias de seguridad | 30+ auditorias independientes |
| Regulatorio / Historial | La SEC cerro su investigacion de 4 anos sin cargos (diciembre 2025). Fuente: carta de cierre de la SEC compartida por el fundador de Aave; informado por Yahoo Finance, CoinDesk, Unchained. |

**Links:** Website: aave.com | X: @AaveAave

**Usado en estrategias diBoaS:** Puerto Seguro, Portero, Constructor Paciente, Acumulador Constante, Maximizador de Rendimiento

---

#### Tarjeta: Compound V3

**Nombre:** Compound V3

**Descripcion:**

```
Uno de los sistemas de prestamo mas antiguos en DeFi. Ganas intereses proporcionando activos que otros toman prestados. Simple, probado en batalla y funcionando desde 2018.
```

**Detalles:**

| Fundado | 2018 (V3: 2022) |
| Valor Total Bloqueado | ~2.000 millones USD |
| Blockchains | Ethereum, Arbitrum, Base, Polygon |
| Auditorias de seguridad | 4+ auditorias independientes |
| Regulatorio / Historial | Completamente descentralizado. Sin licencias especificas requeridas. |

**Links:** Website: compound.finance | X: @compoundfinance

**Usado en estrategias diBoaS:** Puerto Seguro, Portero, Constructor Paciente, Acumulador Constante, Maximizador de Rendimiento

---

#### Tarjeta: Kamino

**Nombre:** Kamino

**Descripcion:**

```
La plataforma todo-en-uno de prestamos y liquidez de Solana. Combina prestamos, gestion automatizada de liquidez y apalancamiento en un solo sistema. Ganas intereses prestando activos a prestatarios, similar a Aave y Compound.
```

**Detalles:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~2.500 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | Multiples auditorias de OtterSec |
| Regulatorio / Historial | Protocolo descentralizado. Sin incidentes importantes. |

**Links:** Website: kamino.finance | X: @KaminoFinance

---

#### Tarjeta: Morpho

**Nombre:** Morpho

**Descripcion:**

```
Conecta prestamistas directamente con prestatarios para mejores tasas que los pools de prestamo tradicionales. Coinbase integro Morpho en Base para prestamos en USDC respaldados por bitcoin (enero 2025), originando mas de 1.200 millones USD en prestamos a finales de 2025.
```

**Detalles:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~7.000 millones USD |
| Blockchains | Ethereum, Base, Arbitrum |
| Auditorias de seguridad | 23+ auditorias independientes |
| Regulatorio / Historial | Integrado por Coinbase (ene. 2025) y Crypto.com (oct. 2025) para prestamos respaldados por DeFi. Fuente: blog de Coinbase, morpho.org/stories/coinbase, DL News. |

**Links:** Website: morpho.org | X: @MorphoLabs

---

#### Tarjeta: Spark Protocol

**Nombre:** Spark Protocol

**Descripcion:**

```
Sistema de prestamos construido sobre el codigo probado de Aave, conectado con la profunda liquidez de Sky/MakerDAO. Se beneficia de la historia operativa mas larga en DeFi (desde 2014).
```

**Detalles:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~4.000 millones USD |
| Blockchains | Ethereum, Base, Arbitrum |
| Auditorias de seguridad | 7+ auditorias independientes |
| Regulatorio / Historial | Se beneficia de los 10+ anos de historial de compliance de MakerDAO |

**Links:** Website: spark.fi | X: @sparkdotfi

---

#### Tarjeta: Fluid

**Nombre:** Fluid

**Descripcion:**

```
Prestamos de proxima generacion que combina funciones de multiples sistemas establecidos. Penalizaciones de liquidacion muy bajas para prestatarios. Ganas intereses de prestatarios, similar a otros protocolos de prestamo.
```

**Detalles:**

| Fundado | 2024 |
| Valor Total Bloqueado | ~2.000 millones USD |
| Blockchains | Ethereum, Arbitrum, Base |
| Auditorias de seguridad | 3+ auditorias independientes |
| Regulatorio / Historial | Construido por el equipo de Instadapp (6+ anos construyendo infraestructura DeFi) |

**Nota de excepcion (micro-texto bajo la tarjeta):**

```
Excepcion a nuestro minimo de 1 ano: Fluid se lanzo en 2024 pero fue construido por el equipo de Instadapp, que tiene 6+ anos de experiencia en infraestructura DeFi.
```

**Links:** Website: fluid.io | X: @0xFluid

---

### Categoria 2: Staking

**Titulo:** Protocolos de staking

**Descripcion:**

```
Ayudas a asegurar una red blockchain. La red te paga recompensas por hacerlo.
```

---

#### Tarjeta: Lido Finance

**Nombre:** Lido Finance

**Descripcion:**

```
Haz staking de tu ETH y recibe un token (stETH) que puedes usar en otros sitios mientras sigues ganando recompensas de staking. El servicio de staking mas grande en crypto.
```

**Detalles:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~27.000 millones USD |
| Blockchains | Ethereum, Polygon |
| Auditorias de seguridad | 20+ auditorias independientes |
| Regulatorio / Historial | Declaracion del personal de la Division de Finanzas Corporativas de la SEC (5 de agosto de 2025): los tokens de recibo de liquid staking, incluido stETH, no son valores bajo la Ley de Valores de 1933 ni la Ley de Bolsas de 1934. Parte de la iniciativa "Project Crypto" del presidente de la SEC, Atkins. Fuente: declaracion en SEC.gov; informado por CoinDesk, Decrypt, CCN. |

**Links:** Website: lido.fi | X: @LidoFinance

---

#### Tarjeta: Rocket Pool

**Nombre:** Rocket Pool

**Descripcion:**

```
Staking descentralizado de Ethereum. Puedes hacer staking con tan solo 0,01 ETH. Ningun operador centralizado controla la red.
```

**Detalles:**

| Fundado | 2016 (mainnet 2021) |
| Valor Total Bloqueado | ~2.000 millones USD |
| Blockchains | Ethereum |
| Auditorias de seguridad | 5+ auditorias independientes |
| Regulatorio / Historial | Declaracion del personal de la SEC (5 de agosto de 2025): los tokens de recibo de liquid staking, incluido rETH, no son valores. Misma declaracion que cubre Lido stETH y Jito JitoSOL. Fuente: declaracion en SEC.gov. |

**Links:** Website: rocketpool.net | X: @Rocket_Pool

---

#### Tarjeta: Jito

**Nombre:** Jito

**Descripcion:**

```
Liquid staking de Solana que gana tanto recompensas estandar de staking como recompensas adicionales de MEV (arbitraje de trading). Usado en estrategias de crecimiento de diBoaS.
```

**Detalles:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~2.800 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | Multiples auditorias de Certora, OtterSec |
| Regulatorio / Historial | Declaracion del personal de la SEC (agosto 2025): los tokens de recibo de liquid staking, incluido JitoSOL, no son valores. Fuente: declaracion en SEC.gov; informado por CoinDesk, CCN, Blockchain Magazine. |

**Links:** Website: jito.network | X: @jikitonetwork

**Usado en estrategias diBoaS:** A Toda Potencia

---

#### Tarjeta: Marinade Finance

**Nombre:** Marinade Finance

**Descripcion:**

```
Staking de Solana distribuido entre mas de 100 validadores para mejor descentralizacion y recompensas. Uno de los pocos protocolos DeFi con certificacion de compliance institucional.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~550 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | 5+ auditorias independientes |
| Regulatorio / Historial | Certificado SOC 2 Tipo I y II. Compliance de grado institucional. |

**Badge:** ✓ (indicador verde de exito)

**Links:** Website: marinade.finance | X: @MarinadeFinance

---

#### Tarjeta: Sanctum (INF)

**Nombre:** Sanctum (INF)

**Descripcion:**

```
Capa de liquidez unificada para todos los tokens de staking de Solana. Te permite intercambiar al instante entre diferentes activos en staking sin periodos de espera para unstaking.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~1.700 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | Auditado por Accretion |
| Regulatorio / Historial | Con sede en Singapur. Proporciona staking para Binance y Bybit. |

**Links:** Website: sanctum.so | X: @sanctumso

**Usado en estrategias diBoaS:** Crecimiento Estable, Progreso Constante, Constructor Equilibrado, Acelerador de Riqueza, A Toda Potencia

---

#### Tarjeta: EigenLayer

**Nombre:** EigenLayer

**Descripcion:**

```
Restaking: usa tu ETH ya en staking para apoyar otros servicios construidos sobre Ethereum y ganar recompensas extra sobre tu rendimiento base de staking. Ganas recompensas de staking mas bonificaciones de los servicios que ayudas a asegurar.
```

**Detalles:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~12.000 millones USD |
| Blockchains | Ethereum |
| Auditorias de seguridad | Multiples auditorias independientes |
| Regulatorio / Historial | Programa de bug bounty de 2 millones USD en Immunefi |

**Links:** Website: eigenlayer.xyz | X: @eigenlayer

---

### Categoria 3: Stablecoins y activos sinteticos

**Titulo:** Stablecoins y activos sinteticos

**Descripcion:**

```
Estos sistemas crean activos digitales disenados para mantener un valor estable, generalmente vinculado al dolar estadounidense. Las stablecoins pueden perder su vinculacion.
```

---

#### Tarjeta: Sky Protocol / SSR (antes MakerDAO)

**Nombre:** Sky Protocol / SSR (antes MakerDAO)

**Descripcion:**

```
El sistema DeFi original. Funcionando desde 2014. Deposita crypto como colateral, genera stablecoins, gana la tasa de ahorro. Ha sobrevivido cada caida importante del mercado desde 2017.
```

**Detalles:**

| Fundado | 2014 |
| Valor Total Bloqueado | ~6.000 millones USD |
| Blockchains | Ethereum (las estrategias de diBoaS usan el despliegue en Arbitrum) |
| Auditorias de seguridad | 10+ auditorias independientes |
| Regulatorio / Historial | 10+ anos de operacion continua a traves de multiples ciclos de mercado |

**Links:** Website: sky.money | X: @SkyEcosystem

**Usado en estrategias diBoaS:** Las 10 estrategias (Puerto Seguro, Crecimiento Estable, Portero, Progreso Constante, Constructor Paciente, Constructor Equilibrado, Acumulador Constante, Acelerador de Riqueza, Maximizador de Rendimiento, A Toda Potencia)

---

#### Tarjeta: Ethena

**Nombre:** Ethena

**Descripcion:**

```
Crea un dolar sintetico (USDe) a traves de posiciones cubiertas. Ofrece rendimientos mas altos que las stablecoins tradicionales, pero con un mecanismo mas complejo y un perfil de riesgo mas elevado.
```

**Detalles:**

| Fundado | 2023 |
| Valor Total Bloqueado | ~6.500 millones USD |
| Blockchains | Ethereum + 23 cadenas |
| Auditorias de seguridad | 7+ auditorias independientes |
| Regulatorio / Historial | BaFin (Alemania) rechazo la solicitud de autorizacion MiCA en marzo de 2025, citando "deficiencias significativas" en la estructura organizativa y el cumplimiento de reservas. BaFin ordeno detener la emision/reembolso de USDe y congelo los activos de reserva. Ethena GmbH acepto liquidar las operaciones en Alemania (abril 2025). Toda la actividad opera ahora a traves de Ethena (BVI) Limited, una entidad de las Islas Virgenes Britanicas. BaFin tambien expreso preocupaciones de que sUSDe pueda constituir un valor no registrado bajo la ley alemana. Fuentes: aviso oficial de BaFin (21 de marzo de 2025); Decrypt, The Block, CoinTelegraph, Ledger Insights. |

**Badge:** ⚠ (indicador ambar de advertencia)

**Links:** Website: ethena.fi | X: @ethena_labs

---

#### Tarjeta: Ondo Finance

**Nombre:** Ondo Finance

**Descripcion:**

```
Trae activos financieros tradicionales a la blockchain. Bonos del Tesoro de EE.UU., bonos y acciones como tokens digitales. Adquirio licencias de broker-dealer y agente de transferencias registrado ante la SEC mediante la compra de Oasis Pro (completada en octubre de 2025).
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~1.700 millones USD |
| Blockchains | Ethereum, Solana, Arbitrum |
| Auditorias de seguridad | 4+ auditorias independientes |
| Regulatorio / Historial | Broker-dealer registrado ante la SEC, Sistema Alternativo de Negociacion (ATS) y licencias de Agente de Transferencias adquiridas via Oasis Pro (miembro de FINRA desde 2020). Adquisicion completada en octubre de 2025. Mas de 1.600 millones USD en activos tokenizados bajo gestion. Fuentes: blog de Ondo Finance, Blockworks, CoinDesk, FINRA BrokerCheck (Oasis Pro Markets LLC). |

**Badge:** ✓ (indicador verde de exito)

**Links:** Website: ondo.finance | X: @ondofinance

---

### Categoria 4: Protocolos de rendimiento y trading

**Titulo:** Protocolos de rendimiento y trading

**Descripcion:**

```
Estos sistemas generan rendimientos a traves de comisiones de trading, optimizacion de rendimiento o productos estructurados.
```

---

#### Tarjeta: Pendle Finance

**Nombre:** Pendle Finance

**Descripcion:**

```
Separa el rendimiento del capital para que puedas negociar, fijar o especular con rendimientos futuros. Te permite asegurar una tasa fija o apostar a que las tasas subiran.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~4.500 millones USD |
| Blockchains | Ethereum, Arbitrum, BNB Chain |
| Auditorias de seguridad | 6+ auditorias independientes |
| Regulatorio / Historial | Bug bounty de 250.000 USD. Acuerdo Safe Harbor vigente. |

**Links:** Website: pendle.finance | X: @pendle_fi

---

#### Tarjeta: Yearn Finance

**Nombre:** Yearn Finance

**Descripcion:**

```
Yield farming automatizado. Mueve tu dinero entre sistemas para buscar el mejor rendimiento disponible. Un pionero que lleva funcionando desde 2020.
```

**Detalles:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~500 millones USD |
| Blockchains | Ethereum, Arbitrum, Fantom |
| Auditorias de seguridad | 6+ auditorias independientes |
| Regulatorio / Historial | Pionero de la agregacion de rendimiento. 5+ anos de operacion continua. |

**Links:** Website: yearn.fi | X: @yearnfinance

---

#### Tarjeta: Curve Finance

**Nombre:** Curve Finance

**Descripcion:**

```
Exchange especializado en stablecoins y activos similares. Disenado para un impacto minimo en el precio al intercambiar entre activos de valor similar.
```

**Detalles:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~2.200 millones USD |
| Blockchains | Ethereum + 20 cadenas |
| Auditorias de seguridad | 15+ auditorias independientes |
| Regulatorio / Historial | Julio 2023: exploit de 70 millones USD. 73% de los fondos recuperados. La causa raiz fue un bug del compilador (Vyper), no del codigo de Curve. |

**Badge:** ⚠ (indicador ambar de advertencia)

**Links:** Website: curve.finance | X: @CurveFinance

---

#### Tarjeta: Convex Finance

**Nombre:** Convex Finance

**Descripcion:**

```
Aumenta tus recompensas de Curve sin necesidad de bloquear tokens durante anos. Simplifica la participacion en Curve.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~1.500 millones USD |
| Blockchains | Ethereum, Arbitrum |
| Auditorias de seguridad | 7 auditorias independientes |
| Regulatorio / Historial | Sin exploits en 4 anos. Una vulnerabilidad critica fue encontrada y parcheada en 2022 antes de que se perdieran fondos. |

**Links:** Website: convexfinance.com | X: @ConvexFinance

---

### Categoria 5: Exchanges perpetuos y de trading

**Titulo:** Exchanges perpetuos y de trading

**Descripcion:**

```
Los traders usan estos sistemas para apostar por movimientos de precios. Tu ganas rendimientos proporcionando la liquidez contra la que operan.
```

---

#### Tarjeta: GMX V2

**Nombre:** GMX V2

**Descripcion:**

```
Exchange perpetuo descentralizado. Proporcionas liquidez a un pool compartido. Los traders pagan comisiones al pool. Tu ganas una parte de cada operacion.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~400 millones USD |
| Blockchains | Arbitrum, Avalanche, Solana |
| Auditorias de seguridad | 10+ auditorias independientes |
| Regulatorio / Historial | Bug bounty de 5 millones USD en Immunefi (uno de los mas grandes en DeFi) |

**Links:** Website: gmx.io | X: @GMX_IO

---

#### Tarjeta: Jupiter JLP

**Nombre:** Jupiter JLP

**Descripcion:**

```
El exchange perpetuo lider de Solana. Proporciona liquidez y gana el 70% de todas las comisiones de trading. Usado en varias estrategias de crecimiento de diBoaS.
```

**Detalles:**

| Fundado | 2021 (perpetuos: 2023) |
| Valor Total Bloqueado | ~1.600 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | 6+ auditorias independientes |
| Regulatorio / Historial | Mas de 137 millones USD pagados a proveedores de liquidez de enero a octubre de 2024, basado en datos de comisiones de Dune Analytics (75% de 183 millones USD en comisiones totales). Fuente: SolanaFloor / Dune Analytics (octubre 2024). La cifra es probablemente significativamente mayor al momento de la publicacion. |

**Links:** Website: jup.ag | X: @JupiterExchange

**Usado en estrategias diBoaS:** Constructor Equilibrado, Acelerador de Riqueza, A Toda Potencia

---

#### Tarjeta: Drift Protocol

**Nombre:** Drift Protocol

**Descripcion:**

```
Plataforma de trading completa en Solana. Perpetuos, trading spot y prestamos en un solo sistema. El panel de monitorizacion de riesgos en tiempo real es publico.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~850 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | 3+ auditorias de Trail of Bits, OtterSec |
| Regulatorio / Historial | Codigo open-source. Monitorizacion de riesgos publica. |

**Links:** Website: drift.trade | X: @DriftProtocol

---

### Categoria 6: Exchanges descentralizados (DEX)

**Titulo:** Exchanges descentralizados

**Descripcion:**

```
Intercambia un token por otro sin un exchange centralizado. Tambien puedes ganar comisiones proporcionando liquidez para que otros operen.
```

---

#### Tarjeta: Raydium

**Nombre:** Raydium

**Descripcion:**

```
El principal exchange descentralizado de Solana. Market making automatizado, liquidez concentrada y lanzamientos de tokens.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~2.000 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | 4+ auditorias independientes |
| Regulatorio / Historial | Noviembre 2022: exploit de 4,4 millones USD causado por clave de administrador comprometida. Todos los usuarios afectados fueron reembolsados. |

**Badge:** ⚠ (indicador ambar de advertencia)

**Links:** Website: raydium.io | X: @RaydiumProtocol

---

#### Tarjeta: Orca

**Nombre:** Orca

**Descripcion:**

```
Exchange de Solana facil de usar, conocido por su diseno limpio, swaps eficientes y uno de los historiales de seguridad mas solidos del ecosistema. Puedes proporcionar liquidez y ganar comisiones de las operaciones en la plataforma.
```

**Detalles:**

| Fundado | 2021 |
| Valor Total Bloqueado | ~400 millones USD |
| Blockchains | Solana |
| Auditorias de seguridad | 6+ auditorias independientes |
| Regulatorio / Historial | Sin exploits en 4+ anos. Elogiado por revisores independientes por la calidad del codigo. |

**Links:** Website: orca.so | X: @orca_so

---

#### Tarjeta: Balancer

**Nombre:** Balancer

**Descripcion:**

```
Pools de liquidez programables que pueden contener multiples tokens en proporciones personalizadas. Mas flexible que los pools de exchange estandar. Proporcionas tokens al pool y ganas una parte de las comisiones de trading.
```

**Detalles:**

| Fundado | 2020 |
| Valor Total Bloqueado | ~258 millones USD (despues del exploit; era ~775M USD antes de noviembre 2025) |
| Blockchains | Ethereum, Arbitrum, Polygon |
| Auditorias de seguridad | 11+ auditorias independientes |
| Regulatorio / Historial | 3 de noviembre de 2025: exploit de 128 millones USD que afecto a pools V2 en Ethereum, Polygon, Base, Arbitrum y otras cadenas. Vulnerabilidad de error de redondeo en contratos ComposableStablePool. Aproximadamente 28 millones USD recuperados a traves de operaciones whitehat e intervenciones del protocolo. La mayoria de los fondos (~100 millones USD) permanecen sin recuperar a febrero de 2026. Balancer DAO aprobo bounty de recuperacion del 10% (BIP-908, febrero 2026). V3 (version actual) NO fue afectada por este exploit. Las estrategias de diBoaS usan exclusivamente V3. Fuentes: Check Point Research, CoinJournal, The Defiant, DL News, Halborn. |

**Badge:** ⚠ (indicador ambar de advertencia)

**Links:** Website: balancer.fi | X: @Balancer

---

### Categoria 7: Infraestructura de pagos y activos del mundo real

**Titulo:** Infraestructura de pagos y activos del mundo real

**Descripcion:**

```
Estos sistemas conectan las finanzas tradicionales y crypto. Pagos transfronterizos, financiacion comercial y activos del mundo real en blockchain.
```

---

#### Tarjeta: Huma Finance

**Nombre:** Huma Finance

**Descripcion:**

```
Pagos transfronterizos instantaneos y financiacion comercial usando infraestructura crypto. Socios de Circle y la Stellar Development Foundation. Los rendimientos provienen de las comisiones cobradas por el procesamiento de pagos transfronterizos.
```

**Detalles:**

| Fundado | 2022 |
| Valor Total Bloqueado | ~100 millones USD |
| Blockchains | Solana, Stellar, Polygon |
| Auditorias de seguridad | 6+ auditorias independientes |
| Regulatorio / Historial | Alianzas estrategicas con Circle y Stellar Development Foundation |

**Links:** Website: huma.finance | X: @humafinance

---

## SECCION 4: COMO ELEGIMOS

**Transicion:**

```
Como llegaron estos 26 a la lista?
```

**H2:**

```
Nuestro proceso de seleccion
```

**Texto:**

```
No anadimos protocolos porque sean populares. Los anadimos porque pasaron nuestra lista de verificacion.
```

**Criterios (renderizados como lista con marcas de verificacion):**

```
✓ Al menos 1 ano de operacion continua. Hacemos excepciones para protocolos construidos por equipos con largo historial, pero lo indicamos claramente.

✓ Auditorias de seguridad profesionales de firmas reconocidas. No solo una. Buscamos multiples auditorias independientes.

✓ Sin exploits no resueltos que afecten a la version que usamos donde los fondos de usuarios se perdieron permanentemente. Los incidentes pasados y exploits especificos de version se divulgan en cada tarjeta con un badge de advertencia.

✓ Operaciones transparentes. Podemos verificar como funciona el protocolo. Se prefiere el codigo open-source.

✓ Uso real. Usuarios reales depositando dinero real. No solo hype, no solo un precio de token.
```

**Bajo los criterios:**

```
Cuando los protocolos han tenido incidentes de seguridad, lo indicamos en la tarjeta con una advertencia ambar. La transparencia funciona en ambas direcciones. Mostramos lo bueno y lo malo.
```

---

**Transicion:**

```
Entonces, cuanto dinero real hay en estos sistemas?
```

---

## SECCION 5: TVL COMBINADO

**H2:**

```
Valor combinado asegurado
```

**Texto:**

```
Los protocolos en esta pagina mantienen colectivamente mas de
```

**Numero grande (estilizado como estadistica hero, teal-700, negrita):**

```
120.000 millones USD
```

**Continuacion:**

```
en depositos de usuarios a traves de todos sus despliegues. Eso es mas de lo que la mayoria de bancos regionales mantienen en depositos totales.
```

**Contexto (texto menor debajo):**

```
Esto no significa que tu dinero este en todos ellos. Cada estrategia de diBoaS usa protocolos especificos adecuados a su nivel de riesgo y objetivos. Consulta la pagina de Estrategias para ver que protocolos se usan en cada estrategia.
```

**Linea de fuente (micro-texto):**

```
TVL combinado obtenido de DeFiLlama. Ultima verificacion: enero 2026. Los valores fluctuan diariamente.
```

---

**Transicion:**

```
Antes de seguir, algo importante.
```

---

## SECCION 6: LO QUE ESTA PAGINA NO ES

**H2:**

```
Lo que esta pagina no es
```

**Texto:**

```
Esto no es una recomendacion de usar ninguno de estos protocolos directamente.

Las estrategias de diBoaS estan construidas sobre estos sistemas, y nuestro equipo maneja la complejidad. No necesitas interactuar con ningun protocolo tu mismo. Esta pagina existe para que puedas ver exactamente donde va tu dinero y verificar todo lo que decimos.

Cada protocolo aqui conlleva riesgo. Los smart contracts pueden tener bugs. Los mercados pueden desplomarse. Las stablecoins pueden perder su vinculacion. Sistemas que han operado de forma segura durante anos pueden enfrentar problemas manana. Monitorizamos estos sistemas de forma continua, pero no podemos eliminar el riesgo. Nadie puede.

Esta pagina existe porque creemos que mereces saberlo. No porque tengas que hacer nada con ella.

Si no estas seguro de si esto es adecuado para ti, consulta a un asesor financiero autorizado antes de tomar decisiones de inversion.
```

---

**Transicion:**

```
Probablemente aun tienes preguntas. Bien.
```

---

## SECCION 7: FAQ

**H2:**

```
Preguntas sobre nuestros protocolos
```

---

**P1: Por que no listais todos los protocolos DeFi?**

```
Hay miles de protocolos DeFi. Preferimos listar 26 que hemos investigado a fondo a 200 que no conocemos.
```

---

**P2: Con que frecuencia actualizais esta lista?**

```
Monitorizamos todos los protocolos listados de forma continua. Si un protocolo tiene un incidente de seguridad, cambio regulatorio o problema operativo significativo, actualizamos esta pagina. Tambien revisamos la lista completa trimestralmente para decidir si anadir o eliminar protocolos.
```

---

**P3: Puedo solicitar que se anade un protocolo?**

```
Si. Escribe a hello@diboas.com con tu sugerencia y por que crees que deberia incluirse. Revisamos cada solicitud segun nuestros criterios de seleccion.
```

---

**P4: Estar listado aqui significa que diBoaS recomienda estos protocolos?**

```
No. Estar listado significa que los hemos investigado, cumplen nuestros criterios y los usamos en nuestras estrategias. No estamos afiliados con ningun protocolo. Su inclusion no implica que ellos respalden a diBoaS, y nuestra lista no constituye una recomendacion de usarlos directamente.
```

---

**P5: Que pasa si un protocolo es hackeado?**

```
Depende de la gravedad. Para incidentes menores que se resuelven rapidamente, podemos mantener el protocolo listado con una nota de advertencia actualizada. Para exploits graves donde los fondos de usuarios se pierden permanentemente, eliminamos el protocolo de nuestra lista y ajustamos las estrategias afectadas. Si el exploit afecto a una version anterior que no usamos, podemos mantener el protocolo listado con una advertencia clara. Consulta nuestros criterios de seleccion arriba para detalles. Siempre comunicaremos los cambios a nuestros usuarios.
```

---

**P6: Por que algunos protocolos tienen badges de advertencia?**

```
El badge de advertencia ambar significa que el protocolo ha tenido un incidente de seguridad notable, problema regulatorio o un perfil de riesgo elevado comparado con sus pares. Incluimos estos protocolos porque siguen cumpliendo nuestros criterios generales, pero queremos que veas el panorama completo. Los detalles estan en cada tarjeta.
```

---

**P7: Que es TVL y por que importa?**

```
TVL significa Total Value Locked (Valor Total Bloqueado). Es la cantidad total de dinero depositada en un protocolo por todos los usuarios a nivel mundial. Un TVL mas alto generalmente significa que mas personas confian en el sistema con dinero real. No es garantia de seguridad, pero es una senal que tenemos en cuenta.
```

---

**P8: Necesito interactuar con estos protocolos yo mismo?**

```
No. diBoaS gestiona todas las interacciones con los protocolos en tu nombre cuando eliges una estrategia. No necesitas crear cuentas en ningun protocolo, gestionar wallets en diferentes blockchains ni entender los detalles tecnicos. Esta pagina existe por transparencia, no porque necesites hacer nada con ella.
```

---

## SECCION 8: LISTA DE ESPERA / CTA

**Transicion:**

```
Satisfecho con lo que ves? Unete a la lista de espera.
```

**CTA:**

Usa el componente compartido `WaitlistSection`. Sin copy personalizado necesario.

---

## SECCION 9: PIE DE PAGINA

**Ultima actualizacion:**

```
Ultima actualizacion: febrero de 2026
```

**Fuentes de datos:**

```
Fuentes de datos: DeFiLlama (TVL), documentacion oficial de protocolos, informes de auditorias de seguridad publicados, SEC EDGAR (presentaciones regulatorias), CoinGecko y comunicaciones directas con protocolos.
```

**Aviso principal:**

```
La informacion en esta pagina es unicamente con fines educativos y de transparencia. No constituye asesoramiento de inversion, asesoramiento financiero ni una recomendacion de usar ningun protocolo listado. La inclusion de protocolos refleja nuestra investigacion y no implica respaldo por ni afiliacion con ningun protocolo listado. Todos los protocolos DeFi conllevan riesgo tecnico, riesgo de smart contracts, riesgo de mercado, riesgo de liquidez y riesgo de desvinculacion de stablecoins. El rendimiento, TVL y estado regulatorio de los protocolos pueden cambiar en cualquier momento. Usa solo dinero que puedas permitirte perder. diBoaS no es un banco y tus fondos no estan asegurados.
```

**MiCA Articulo 68:**

```
El valor de los criptoactivos puede fluctuar. Puede perder la totalidad o parte de su dinero invertido. Los criptoactivos no estan cubiertos por los sistemas de garantia de depositos.
```

**MiCA Articulo 7:**

```
Esta comunicacion comercial relativa a criptoactivos no ha sido revisada ni aprobada por ninguna autoridad competente de ningun Estado miembro de la Union Europea. El emisor del criptoactivo es el unico responsable del contenido de esta comunicacion comercial relativa a criptoactivos.
```

**Divulgacion de IA:**

```
Ciertos contenidos de esta plataforma, incluyendo analisis de mercado y materiales educativos, son generados o asistidos por inteligencia artificial. El contenido generado por IA puede contener errores o limitaciones. Los usuarios deben verificar la informacion de forma independiente antes de tomar decisiones financieras.
```

**Divulgacion US:**

```
diBoaS es una interfaz no custodial que proporciona acceso a protocolos de finanzas descentralizadas. diBoaS no esta registrado ante la SEC, CFTC, FinCEN ni ninguna agencia regulatoria estatal. El tratamiento regulatorio de DeFi en EE.UU. esta evolucionando. Eres responsable de determinar si tu uso de esta interfaz cumple con las leyes aplicables.
```

**Enlaces externos:**

```
Los enlaces externos en esta pagina conducen a sitios web de terceros no controlados por diBoaS. No somos responsables de su contenido, practicas de privacidad o disponibilidad.
```

**Asesoramiento profesional:**

```
Considere consultar a un asesor financiero autorizado antes de tomar decisiones de inversion.
```

**(c) 2026 diBoaS. Todos los derechos reservados.**

---

## NOTAS DE LOCALIZACION ES

### Decisiones de adaptacion

1. **"tu" como tratamiento:** Igual que N26, Trade Republic y fintechs espanolas modernas. Solo los textos MiCA usan "usted" formal (requisito regulatorio).

2. **"Deposito a plazo fijo" como referencia mental:** En Espana, los ahorradores comparan rendimientos con su deposito a plazo fijo o cuenta de ahorro remunerada. FGD (Fondo de Garantia de Depositos) con limite de 100.000 EUR.

3. **BaFin en contexto para Ethena:** Aunque BaFin es el regulador aleman, los usuarios espanoles entienden su peso como regulador europeo. La referencia MiCA es directamente relevante para el mercado espanol.

4. **Formato numerico:** Coma como separador decimal (0,39%), punto como separador de miles (1.000). Estandar europeo.

5. **Nombres de protocolos en ingles:** Los nombres tecnicos de protocolos no se traducen. "Puerto Seguro" etc. son los nombres de las estrategias, no de los protocolos.

6. **Tono cercano pero no coloquial:** El espanol europeo fintech es directo y cercano, pero evita el coloquialismo excesivo. Diferente del tono mas informal del PT-BR.

7. **"Comision" en lugar de "tasa":** En el espanol financiero espanol, "comision" es el termino estandar para fees bancarias.
