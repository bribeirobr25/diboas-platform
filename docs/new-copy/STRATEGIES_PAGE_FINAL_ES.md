# diBoaS Pagina de Estrategias — Copy FINAL (ES)

## Estado del Documento

| Campo | Valor |
|-------|-------|
| Version | FINAL — Post-CLO + Post-Copywriter |
| Idioma | Espanol (ES) |
| Fecha | 27 de febrero de 2026 |
| Base | STRATEGIES_PAGE_FINAL_EN.md |
| Adaptacion Cultural | Completa (no es traduccion literal) |
| CLO Review | Todos los fixes P0/P1 aplicados. P0-3 tasas confirmadas por CEO (Fee Lab v3.3: entrada GRATIS, salida 0,39%). |
| Copywriter Review | Los 3 fixes + 4 polish aplicados. Aprobado para produccion. |
| Pendiente | Nada. Todas las aprobaciones completadas. |

## Notas de Implementacion para CTO / Claude Code

Este documento contiene la version completa en espanol de la pagina de Estrategias de diBoaS. ADAPTACION CULTURAL orientada al mercado europeo (Espana como mercado principal), no traduccion literal.

### Diferencias Criticas Respecto al EN

| Item | EN | ES | Motivo |
|------|-----|-----|--------|
| Moneda | $1,000 ejemplos | 1.000 EUR ejemplos | Mercado europeo |
| Minimo | $5 | 5 EUR | Valor minimo para UE |
| Escenarios | "trip, wedding, car" | "viaje, boda, coche" | Mismo concepto, lenguaje natural |
| Referencia bancaria | "bank savings account" | "deposito a plazo fijo" / "cuenta de ahorro" | Referencia bancaria espanola |
| Separador decimal | 0.39% (punto) | 0,39% (coma) | Formato numerico europeo |
| Separador de miles | 1,000 (coma) | 1.000 (punto) | Formato numerico europeo |
| Regulatorio | MiCA en ingles | MiCA en espanol (Art. 68 + Art. 7) | Jurisdiccion UE |
| Tratamiento | "you" | "tu" (informal) | Fintechs espanolas usan tu (N26, Trade Republic) |
| Tono | Warm, direct | Cercano, directo, sin ser demasiado coloquial | Cultura espanola fintech |
| Seguro depositos | FDIC | FGD (Fondo de Garantia de Depositos), hasta 100.000 EUR | Legislacion europea |
| Full Throttle minimo | $1,000 | 1.000 EUR | Equivalente europeo |

### Reglas Globales

- NINGUN caracter de raya en toda la pagina. Usar comas, puntos, dos puntos o saltos de linea.
- NINGUN emoji en el cuerpo del texto.
- Todos los CTAs son botones salvo indicacion contraria.
- Filtro Adelaide se aplica a todo texto orientado al consumidor.
- Secciones Version A/B: condicional. CTO selecciona en build.

### Flujo de Secciones

| # | Seccion | Tipo |
|---|---------|------|
| 1 | Hero | Estatico |
| 2 | Matriz de Estrategias | Tabla interactiva |
| 3 | Tarjetas de Estrategia (x10) | Grid de tarjetas |
| 4 | Donde Va Tu Dinero | Tabla de protocolos + detalle expandible |
| 5 | Cuanto Cuesta | Tabla de comisiones |
| 6 | Como Elegir | Guia de decision |
| 7 | FAQ (x11) | Acordeon |
| 8 | Lista de Espera / CTA | Captura de email |
| 9 | Pie de Pagina | Avisos legales |

---

## SECCION 1: HERO

**H1:**

```
El acceso que se guardaban. Ahora es tuyo.
```

**Sub-headline:**

```
10 estrategias. Objetivos diferentes. Niveles de riesgo diferentes. Ninguna es "la mejor." La mejor es la que encaja con donde estas y donde quieres llegar.
```

**Linea de confianza (texto menor):**

```
Probadas con casi 4 anos de datos reales. Caidas, recuperaciones, de todo. Construidas sobre sistemas que han protegido miles de millones en activos (verificable en DeFiLlama).
```

**Limitacion honesta (micro-texto debajo de la linea de confianza):**

```
Rentabilidades pasadas no garantizan resultados futuros. Todas las estrategias conllevan riesgo.
```

---

**Transicion:**

```
Asi encuentras la tuya.
```

---

## SECCION 2: MATRIZ DE ESTRATEGIAS

**H2:**

```
Elige tu estrategia
```

**Instrucciones:**

```
Tu objetivo a la izquierda. Tu apetito de riesgo a la derecha.
```

**Tabla de la matriz:**

| Tu Objetivo | Retornos Estables | Potencial de Crecimiento |
|-------------|-------------------|--------------------------|
| Fondo de Emergencia | Puerto Seguro | |
| Ganar Mas Que la Inflacion | | Crecimiento Estable |
| Corto Plazo (< 2 anos) | Portero | Avance Firme |
| Medio Plazo (2-5 anos) | Constructor Paciente | Constructor Equilibrado |
| Largo Plazo (5-10 anos) | Composicion Constante | Acelerador de Patrimonio |
| Construir Patrimonio (10+ anos) | Maximizador de Retorno | A Toda Potencia |

**Debajo de la tabla:**

```
No sabes por donde empezar? Empieza con Puerto Seguro. Aprende primero. Cambia cuando quieras. Sin penalizaciones.
```

---

**Transicion:**

```
Esto es lo que hace cada una.
```

---

## SECCION 3: LAS 10 TARJETAS DE ESTRATEGIA

Tarjetas en grid: 2 columnas en escritorio, 1 en movil. Estrategias estables con borde izquierdo en teal. Estrategias de crecimiento con borde izquierdo en verde.

---

### Tarjeta 1: Puerto Seguro

**Badge:** Retornos Estables | Fondo de Emergencia

**Tagline:** Tu colchon de seguridad que realmente crece

**Descripcion:**

```
Aqui guardas el dinero que puedes necesitar manana. Tiene que estar ahi cuando lo necesites. Sin sorpresas.

Puerto Seguro utiliza solo dolares digitales estables. Sin exposicion a precios de activos digitales. Tus 1.000 EUR estan disenados para mantenerse cerca de 1.000 EUR mientras generan retornos, aunque las stablecoins utilizadas pueden fluctuar en valor.
```

**Asignacion:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Nota de asignacion (micro-texto):**

```
Tu dinero se distribuye entre tres sistemas de prestamo independientes para reducir el riesgo.
```

**Estadisticas:**

| Probabilidad de perder dinero | Menos del 1% |
| Retorno anual tipico | 6-10% anual |
| Como de movido es el camino? | Muy tranquilo. Tu saldo se mantuvo estable durante toda nuestra prueba de 4 anos. |
| Nivel de riesgo | Minimo. Los riesgos incluyen posibles vulnerabilidades tecnicas en los sistemas subyacentes y la posibilidad de que las stablecoins utilizadas pierdan su paridad con el dolar. Estos sistemas llevan anos funcionando de forma segura. |

**Uso tipico:**

```
Primer fondo de emergencia. Aprender como funciona todo sin oscilaciones de precio.
```

---

### Tarjeta 2: Crecimiento Estable

**Badge:** Potencial de Crecimiento (30%) | Ganar Mas Que la Inflacion

**Tagline:** Supera la inflacion con riesgo controlado

**Descripcion:**

```
Tu dinero se divide: el 70% genera retornos estables, el 30% participa en el crecimiento de activos digitales. Aceptas algo de movimiento de precio a cambio de retornos potencialmente mayores.

Esto no es un fondo de emergencia. Es para dinero que quieres hacer crecer por encima de la inflacion, entendiendo que la parte de crecimiento se movera con los precios del mercado.
```

**Asignacion:**

```
70% Sky SSR + 30% Sanctum INF
```

**Nota de asignacion (micro-texto):**

```
La mayor parte se queda en dolares digitales estables. La parte en Sanctum se mueve con los retornos de staking de Solana.
```

**Estadisticas:**

| Probabilidad de perder dinero | Alrededor del 5% |
| Retorno anual tipico | 7-12% anual |
| Como de movido es el camino? | Algunas olas. En el peor momento, tu saldo bajo temporalmente un 8% antes de recuperarse. |
| Nivel de riesgo | Bajo. El 30% de tu saldo se movera con los precios de activos digitales. |

**Uso tipico:**

```
Segunda capa de ahorro. Ya tiene fondo de emergencia y busca crecimiento por encima de la inflacion.
```

**Nota (micro-texto):**

```
No disenada como fondo de emergencia principal.
```

---

### Tarjeta 3: Portero

**Badge:** Retornos Estables | Corto Plazo

**Tagline:** Protegiendo tus metas a corto plazo

**Descripcion:**

```
Estas ahorrando para algo en los proximos 2 anos? Un viaje, una boda, un coche? Esto mantiene cada euro trabajando hacia tu objetivo sin arriesgarlo.

Sin exposicion a precios de activos digitales. Crecimiento predecible.
```

**Asignacion:**

```
60% Sky SSR + 25% Aave V3 + 15% Compound V3
```

**Nota de asignacion (micro-texto):**

```
Distribuido entre sistemas de prestamo probados, optimizados para estabilidad.
```

**Estadisticas:**

| Probabilidad de perder dinero | Menos del 1% |
| Retorno anual tipico | 6-9% anual |
| Como de movido es el camino? | Muy tranquilo. |
| Nivel de riesgo | Minimo. Disenado para preservacion de capital con retornos estables. Los riesgos incluyen posibles vulnerabilidades tecnicas y la posibilidad de que las stablecoins utilizadas pierdan su paridad con el dolar. |

**Uso tipico:**

```
Meta concreta en menos de 2 anos: viaje, boda, coche.
```

---

### Tarjeta 4: Avance Firme

**Badge:** Potencial de Crecimiento (35%) | Corto Plazo

**Tagline:** Metas a corto plazo con potencial de crecimiento

**Descripcion:**

```
Tienes una meta en los proximos 2 anos, pero aceptas algo de movimiento de precio si eso significa retornos mayores. La mayor parte se queda estable. Una parte participa en el crecimiento de activos digitales.
```

**Asignacion:**

```
65% Sky SSR + 35% Sanctum INF
```

**Nota de asignacion (micro-texto):**

```
La mayor parte se queda estable. La parte en Sanctum se mueve con los retornos de staking de Solana.
```

**Estadisticas:**

| Probabilidad de perder dinero | Alrededor del 7% |
| Retorno anual tipico | 7-11% anual |
| Como de movido es el camino? | Olas moderadas. En el peor momento, tu saldo bajo temporalmente un 11% antes de recuperarse. |
| Nivel de riesgo | Bajo-Medio. Tu saldo se movera con los precios de activos digitales. |

**Uso tipico:**

```
Meta a corto plazo donde algo de movimiento de precio es aceptable.
```

---

### Tarjeta 5: Constructor Paciente

**Badge:** Retornos Estables | Medio Plazo

**Tagline:** Crecimiento constante para quien sabe esperar

**Descripcion:**

```
Estas pensando a 2-5 anos vista. Quiza la entrada de un piso, quiza montar un negocio. No necesitas crecimiento agresivo. Necesitas que tu dinero este ahi, un poco mas grande, cuando estes preparado.
```

**Asignacion:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Nota de asignacion (micro-texto):**

```
Mismos sistemas estables que Puerto Seguro, modelados para un horizonte de medio plazo. Los retornos se proyectan de forma mas conservadora para el horizonte de 2-5 anos.
```

**Estadisticas:**

| Probabilidad de perder dinero | Menos del 1% |
| Retorno anual tipico | 5-8% anual |
| Como de movido es el camino? | Muy tranquilo. |
| Nivel de riesgo | Minimo. Mismo perfil estable, optimizado para mantener mas tiempo. Los riesgos incluyen posibles vulnerabilidades tecnicas y la posibilidad de que las stablecoins utilizadas pierdan su paridad con el dolar. |

**Uso tipico:**

```
Entrada de un piso. Capital para montar un negocio. Cualquier cosa a 2-5 anos donde la previsibilidad importa.
```

---

### Tarjeta 6: Constructor Equilibrado

**Badge:** Potencial de Crecimiento (40%) | Medio Plazo

**Tagline:** Estabilidad y crecimiento en una sola estrategia

**Descripcion:**

```
La mayor parte de tu dinero se mantiene segura. Una parte captura el crecimiento de activos digitales. Esta estrategia esta disenada para personas con horizontes de 3-5 anos que entienden que los precios suben y bajan.
```

**Asignacion:**

```
60% Sky SSR + 25% Sanctum INF + 15% Jupiter JLP
```

**Nota de asignacion (micro-texto):**

```
Una combinacion equilibrada: retornos de prestamo mas retornos de staking y comisiones de trading de dos sistemas Solana.
```

**Estadisticas:**

| Probabilidad de perder dinero | Alrededor del 12% |
| Retorno anual tipico | 10-16% anual |
| Como de movido es el camino? | Olas moderadas. En el peor momento, tu saldo bajo temporalmente un 13% antes de recuperarse. |
| Nivel de riesgo | Medio. Un 40% de exposicion a crecimiento significa oscilaciones significativas en ambas direcciones. |

**Uso tipico:**

```
Horizonte de 3-5 anos con tolerancia a movimiento temporal de precio.
```

---

### Tarjeta 7: Composicion Constante

**Badge:** Retornos Estables | Largo Plazo

**Tagline:** Deja que el tiempo haga el trabajo pesado

**Descripcion:**

```
Estas jugando a largo plazo. 5-10 anos. No necesitas asumir grandes riesgos porque el tiempo juega a tu favor. Retornos estables, compuestos ano tras ano.
```

**Asignacion:**

```
55% Sky SSR + 30% Aave V3 + 15% Compound V3
```

**Nota de asignacion (micro-texto):**

```
Optimizado para composicion a largo plazo con volatilidad minima.
```

**Estadisticas:**

| Probabilidad de perder dinero | Menos del 1% |
| Retorno anual tipico | 6-10% anual |
| Como de movido es el camino? | Muy tranquilo. |
| Nivel de riesgo | Minimo. Sin prisa. Los riesgos incluyen posibles vulnerabilidades tecnicas y la posibilidad de que las stablecoins utilizadas pierdan su paridad con el dolar. |

**Uso tipico:**

```
Horizonte de 5-10 anos. Prioriza la consistencia sobre el maximo rendimiento.
```

---

### Tarjeta 8: Acelerador de Patrimonio

**Badge:** Potencial de Crecimiento (70%) | Largo Plazo

**Tagline:** Para quienes han hecho los deberes

**Descripcion:**

```
Esto no es para todo el mundo. Un 70% de exposicion a crecimiento significa que tu saldo se movera significativamente con los precios de activos digitales.

Necesitas poder ver como tu saldo cae un 40% o mas y no entrar en panico. Si esa frase te ha puesto nervioso, esta no es la estrategia adecuada para ti.
```

**Asignacion:**

```
30% Sky SSR + 35% Sanctum INF + 35% Jupiter JLP
```

**Nota de asignacion (micro-texto):**

```
Muy inclinada hacia el crecimiento. Retornos de staking mas comisiones de trading de dos sistemas Solana.
```

**Estadisticas:**

| Probabilidad de perder dinero | Alrededor del 24% |
| Retorno anual tipico | Muy variable. Puede ser negativo o superar el 50%. |
| Como de movido es el camino? | Grandes oscilaciones. En el peor momento, tu saldo bajo un 47% antes de recuperarse. |
| Nivel de riesgo | Alto. Probabilidad significativa de perdidas relevantes en plazos cortos. |

**Uso tipico:**

```
Asignacion a largo plazo con alta tolerancia a la volatilidad.
```

**Aviso (estilizado como callout):**

```
En miles de simulaciones, los resultados variaron de -60% a +200%+. La cifra de caida (47%) es el peor declive temporal durante nuestra prueba. El rango (-60% a +200%+) es la amplitud completa de las simulaciones. Solo para personas que pueden tolerar perdidas significativas.
```

---

### Tarjeta 9: Maximizador de Retorno

**Badge:** Retornos Estables | Construir Patrimonio

**Tagline:** Maximo retorno, minima volatilidad

**Descripcion:**

```
Quieres los mayores retornos estables a lo largo de 10+ anos sin exposicion a precios de activos digitales. Sin componente de crecimiento. Solo retornos optimizados en los tres sistemas de prestamo estables.
```

**Asignacion:**

```
45% Sky SSR + 35% Aave V3 + 20% Compound V3
```

**Nota de asignacion (micro-texto):**

```
Nuestra configuracion estable de mayor retorno.
```

**Estadisticas:**

| Probabilidad de perder dinero | Menos del 1% |
| Retorno anual tipico | 7-11% anual |
| Como de movido es el camino? | Muy tranquilo. |
| Nivel de riesgo | Minimo. Nuestra estrategia estable de mayor retorno. Los riesgos incluyen posibles vulnerabilidades tecnicas y la posibilidad de que las stablecoins utilizadas pierdan su paridad con el dolar. |

**Uso tipico:**

```
Horizonte de 10+ anos. Maximo retorno estable, cero exposicion a cripto.
```

---

### Tarjeta 10: A Toda Potencia

**Badge:** Potencial de Crecimiento (85%) | Construir Patrimonio

**Tagline:** Riesgo maximo. Potencial maximo.

**Descripcion:**

```
Esta es nuestra estrategia mas agresiva. 85% de exposicion a crecimiento. Disenada para una parte pequena de tu cartera que estes dispuesto a perder por completo.

El lado bueno? En escenarios simulados excepcionales, los retornos superaron el 1.000%. El lado malo? Un 27% de probabilidad de perdida. Tu saldo bajo un 66% en el peor momento de nuestra prueba.
```

**Asignacion:**

```
15% Sky SSR + 30% Sanctum INF + 35% Jupiter JLP + 20% Jito
```

**Nota de asignacion (micro-texto):**

```
Exposicion maxima a crecimiento: staking, comisiones de trading y recompensas MEV en tres sistemas Solana con un buffer minimo de estabilidad.
```

**Estadisticas:**

| Probabilidad de perder dinero | Alrededor del 27% |
| Retorno anual tipico | Extremadamente variable. Desde grandes perdidas hasta ganancias extraordinarias. |
| Como de movido es el camino? | Montana rusa. En el peor momento, tu saldo bajo un 66% antes de recuperarse. |
| Nivel de riesgo | Muy Alto. Posibilidad de perdida casi total. Usa solo lo que puedas permitirte perder por completo. |

**Uso tipico:**

```
Asignacion pequena de tu cartera con plena comprension del potencial de perdida.
```

**Requisitos de acceso (estilizado como callout):**

```
6+ meses de antiguedad en la cuenta. Saldo minimo de 1.000 EUR. Maximo del 20% de tu cartera total. Periodo de espera de 24 horas antes de la activacion. Reconocimiento de riesgo obligatorio.
```

**Aviso (estilizado como callout prominente):**

```
En miles de simulaciones, los resultados variaron de -78% a +400%+. La cifra de caida (66%) es el peor declive temporal durante nuestra prueba. El rango (-78% a +400%+) es la amplitud completa de las simulaciones. Nunca pongas aqui dinero que necesites.
```

---

**Debajo de todas las tarjetas, limitacion honesta:**

```
Todas las estadisticas se basan en analisis historico (mayo 2022 - diciembre 2025) y miles de simulaciones Monte Carlo. Para protocolos mas recientes, los retornos de periodos anteriores se estiman usando proxies validados basados en sistemas similares. Lo que paso en el pasado puede no repetirse. Estos numeros te ayudan a comparar estrategias, no a predecir el futuro.
```

---

**Transicion:**

```
Ahora sabes lo que hace cada estrategia. Mira donde va realmente tu dinero.
```

---

## SECCION 4: DONDE VA TU DINERO

**H2:**

```
Donde va tu dinero
```

**Introduccion:**

```
Cada estrategia se construye a partir de una combinacion de estos protocolos. Son independientes, de codigo abierto, y puedes verificarlo todo tu mismo.
```

**Tabla de protocolos:**

| Protocolo | Tipo | Red | Activo | Exposicion Cripto | En funcionamiento desde |
|-----------|------|-----|--------|-------------------|-------------------------|
| Sky SSR | Rendimiento en stablecoin | Arbitrum | USDS | Ninguna | 2022 |
| Aave V3 | Prestamo | Arbitrum | USDC | Ninguna | 2020 (V3: 2022) |
| Compound V3 | Prestamo | Arbitrum | USDC | Ninguna | 2018 (V3: 2022) |
| Sanctum INF | Staking liquido (cesta de LSTs) | Solana | SOL | Si, se mueve con el precio de SOL | 2024 |
| Jupiter JLP | LP de perpetuos | Solana | 45% SOL / 27% ETH / 27% BTC / 1% otros | Si, se mueve con precios de SOL, ETH, BTC | 2024 |
| Jito | Staking liquido + MEV | Solana | JitoSOL | Si, se mueve con el precio de SOL | 2022 |

**Debajo de la tabla (micro-texto):**

```
Jito se usa solo en A Toda Potencia. El resto de protocolos aparecen en multiples estrategias. Los nombres de los protocolos se usan por transparencia. Su inclusion no implica que estos protocolos respalden a diBoaS. Para protocolos en funcionamiento menos de 4 anos, los retornos de periodos anteriores se estiman usando metodologias proxy validadas basadas en sistemas similares.
```

**Detalle expandible (acordeon opcional por protocolo, colapsado por defecto):**

Cada protocolo tiene una seccion expandible con:
- Resumen en una linea de como se generan los retornos
- Estado de auditorias
- Enlace al sitio del protocolo
- Enlace a la pagina de DeFiLlama mostrando TVL en vivo

**Debajo de los protocolos:**

```
Codigo abierto y auditado no significa libre de riesgo. El codigo puede tener vulnerabilidades no descubiertas. Reducimos este riesgo distribuyendo tu dinero entre multiples protocolos independientes, pero no podemos eliminarlo.
```

---

**Transicion:**

```
Conoces las estrategias. Conoces los protocolos. Esto es lo que cuesta.
```

---

## SECCION 5: CUANTO CUESTA

**H2:**

```
Cuanto cuesta
```

**Introduccion:**

```
Una comision. Nada mas.
```

**Tabla de comisiones:**

| Accion | Comision | Ejemplo |
|--------|----------|---------|
| Iniciar una estrategia (invertir) | GRATIS | Inviertes 1.000 EUR: cuesta 0 EUR |
| Cerrar una estrategia (vender) | 0,39% | Vendes 1.000 EUR: cuesta 3,90 EUR |

**Debajo de la tabla:**

```
Sin cuotas mensuales. Sin comisiones de gestion. Sin comisiones de exito. Sin cargos ocultos.

Meter dinero en una estrategia no cuesta nada. Solo cobramos cuando sacas tu dinero. Si tu dinero esta en una estrategia generando retornos, nosotros no ganamos nada hasta que salgas.
```

**Micro-texto:**

```
Pueden aplicarse comisiones de red de terceros (normalmente menos de 0,01 EUR). Para el cuadro completo de comisiones incluyendo transferencias y retiradas, consulta nuestra pagina de comisiones.
```

---

**Transicion:**

```
No sabes cual elegir? Empieza aqui.
```

---

## SECCION 6: COMO ELEGIR

**H2:**

```
Empieza aqui
```

### Para que es este dinero?

```
Fondo de emergencia: Puerto Seguro. Dinero que puedes necesitar manana se queda estable.

Superar la inflacion: Crecimiento Estable. Tu dinero trabaja mas, pero el 30% se mueve con el mercado.

Algo en los proximos 2 anos: Portero (estable) o Avance Firme (con crecimiento). Depende de como te sientes con el movimiento de precio.

Algo a 2-5 anos: Constructor Paciente (estable) o Constructor Equilibrado (con crecimiento). Mas tiempo significa que puedes considerar mas crecimiento.

Patrimonio a largo plazo: Composicion Constante, Acelerador de Patrimonio, Maximizador de Retorno o A Toda Potencia. Tu horizonte temporal es tu mayor ventaja.
```

### Como te sientes con las oscilaciones de precio?

```
"No quiero ninguna." Quedate en la columna de Retornos Estables. Cinco estrategias, cero exposicion a cripto.

"Las entiendo y puedo esperar a que pasen las caidas." Considera la columna de Potencial de Crecimiento. Cuanto mas largo tu horizonte, mas exposicion a crecimiento puedes considerar.

"No estoy seguro." Empieza en estable. Aprende como funciona todo con dinero que te sientas comodo arriesgando. Siempre puedes anadir exposicion a crecimiento despues.
```

### Que harias si tu saldo bajara un 20%?

```
"Entraria en panico y retiraria." Solo estrategias de Retornos Estables. Eso no es debilidad. Es autoconocimiento.

"Esperaria a que se recupere." Las estrategias de crecimiento bajo-medio podrian funcionar para ti.

"Meteria mas dinero." Puede que estes preparado para mas exposicion a crecimiento. Es inteligente si esta planificado. Menos inteligente si es panico intentando recuperar lo que perdiste. Asegurate de saber cual de las dos es.
```

**Promesa de marca + regla de oro:**

```
Te mostramos las dos caras, las oportunidades y los riesgos, siempre.

En caso de duda, empieza seguro. Siempre puedes subir despues. Considera consultar a un asesor financiero autorizado si no tienes claro que enfoque se ajusta a tu situacion.
```

---

**Transicion:**

```
Tienes preguntas? Bien.
```

---

## SECCION 7: FAQ

**H2:**

```
Antes de decidir
```

### Puedo cambiar de estrategia?

```
Si, en cualquier momento. Sin penalizaciones. Sin preguntas.

Algo a tener en cuenta: si cambias durante una caida del mercado, podrias materializar una perdida temporal. El mejor momento para cambiar es cuando tus objetivos cambian, no cuando el mercado se mueve.
```

### Puedo usar varias estrategias a la vez?

```
Si. Mucha gente lo hace.

Piensa en ello como diferentes cuentas para diferentes propositos: fondo de emergencia en Puerto Seguro, ahorro para vacaciones en Portero, patrimonio a largo plazo en Constructor Equilibrado.
```

### Como funciona el rebalanceo?

```
Cuando los movimientos del mercado empujan tu asignacion fuera del objetivo (mas del 10% de desviacion), te avisamos. Por ejemplo, si tu objetivo es 60% estable y 40% crecimiento, y los movimientos del mercado lo llevan a algo como 55/45 o mas lejos, te lo hacemos saber.

Veras exactamente que cambio y por que. Luego tu decides: apruebas el rebalanceo o lo dejas como esta.

Nunca movemos tu dinero sin tu aprobacion.
```

### Estan garantizados estos retornos?

```
No. Y cualquiera que te garantice retornos te esta mintiendo.

Lo que podemos decirte: hemos probado cada estrategia con casi 4 anos de datos reales de mercado (mayo 2022 - diciembre 2025). Los numeros se basan en lo que realmente ocurrio y en miles de simulaciones Monte Carlo.

Estos numeros te ayudan a comparar estrategias y entender el rango de resultados posibles. No predicen el futuro. Empieza con lo que puedas permitirte aprender.
```

### Y si uno de los sistemas tiene un problema?

```
Es un riesgo real. Estos sistemas estan construidos sobre codigo, y el codigo puede tener vulnerabilidades.

Reducimos este riesgo usando solo sistemas que han protegido miles de millones de euros durante anos, distribuyendo tu dinero entre multiples sistemas independientes, y monitorizando continuamente cualquier actividad inusual.

No podemos eliminar este riesgo. Nadie puede. Pero podemos ser honestos al respecto.
```

### Donde va realmente mi dinero?

```
Los protocolos detras de cada estrategia estan listados en esta pagina con sus nombres, redes, tipos de activo e historial. Sin necesidad de registrarte. Sin informacion oculta.

Sky SSR, Aave V3 y Compound V3 gestionan los retornos estables. Sanctum INF, Jupiter JLP y Jito gestionan el crecimiento. Cada estrategia es una combinacion especifica de estos protocolos con porcentajes exactos mostrados en cada tarjeta de estrategia.

Elegimos estos protocolos porque son transparentes, estan probados en batalla, y puedes verificar todo tu mismo.
```

### Por que hay requisitos extra para A Toda Potencia?

```
Porque queremos protegerte de ti mismo.

A Toda Potencia puede perder la mayor parte de su valor. Los requisitos no estan para excluirte. Estan para asegurarse de que lo has pensado bien: 6 meses de experiencia, un saldo minimo, un limite del 20% de tu cartera, y un periodo de espera de 24 horas.
```

### Mi dinero esta seguro?

**Version A (No-Custodia):**

```
Tu dinero esta protegido por ti. Tu monedero, tus claves. Nadie en diBoaS puede acceder a tus fondos sin tu autorizacion.

Dicho esto, esto no es una cuenta bancaria. Tus fondos trabajan a traves de sistemas automatizados construidos sobre codigo. El valor puede fluctuar, y podrias perder parte o toda tu inversion. No existe seguro de depositos.

Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

**Version B (MPC):**

```
Tu dinero esta protegido por seguridad multi-parte. Tu autorizacion es necesaria para cada transaccion. DiBoaS posee una parte parcial de la clave con fines de recuperacion, pero no puede mover tus fondos de forma unilateral.

Dicho esto, esto no es una cuenta bancaria. Tus fondos trabajan a traves de sistemas automatizados construidos sobre codigo. El valor puede fluctuar, y podrias perder parte o toda tu inversion. No existe seguro de depositos.

Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

### Puedo perderlo todo?

```
En las estrategias estables (Puerto Seguro, Portero, Constructor Paciente, Composicion Constante, Maximizador de Retorno): la probabilidad de perdida total es extremadamente baja. En casi 4 anos de pruebas y miles de simulaciones, no ocurrio. Pero "extremadamente baja" no es cero.

En las estrategias de crecimiento: cuanto mayor el porcentaje de crecimiento, mas amplio el rango de resultados posibles. A Toda Potencia con un 85% de exposicion a crecimiento ha registrado caidas simuladas superiores al 78%.

El riesgo es real. No lo minimizamos. Te ayudamos a elegir el nivel que encaja con lo que puedes asumir.
```

### En que se diferencia de una cuenta de ahorro?

```
Una cuenta de ahorro bancaria esta asegurada por el Fondo de Garantia de Depositos (hasta 100.000 EUR por entidad). Tu dinero genera un tipo fijo. El banco lo controla.

Las estrategias de diBoaS usan sistemas automatizados de prestamo y staking. Los retornos son variables. Tu dinero no esta asegurado. Tu lo controlas a traves de tu propio monedero.

La contrapartida: retornos potencialmente mayores, pero aceptas el riesgo que conlleva un tipo de sistema diferente.
```

---

**Transicion:**

```
Sigues aqui despues de todos esos avisos de riesgo? Bien. Has investigado mas que la mayoria.
```

---

## SECCION 8: LISTA DE ESPERA / CTA

**H2:**

```
Te gusta lo que ves?
```

**Body:**

```
Elegiras tu estrategia cuando lancemos. Por ahora, deja tu email y asegura tu plaza.
```

**[Campo de email: Tu direccion de email]**

**Boton CTA:**

```
Quiero acceso anticipado
```

**Debajo del CTA:**

```
Sin spam. Solo tu invitacion cuando estemos listos.
```

**Checkbox:**

```
Acepto la Politica de Privacidad
```

**Debajo del checkbox (micro-texto):**

```
Gratis. Sin compromiso. Elige tu estrategia cuando lancemos.
```

---

## SECCION 9: PIE DE PAGINA

**Aviso principal:**

```
Todos los datos de rentabilidad se basan en analisis historico (mayo 2022 - diciembre 2025) y miles de simulaciones Monte Carlo. Rentabilidades pasadas no garantizan resultados futuros. Tu dinero se coloca en sistemas automatizados que conllevan riesgo tecnico, riesgo de mercado, riesgo de liquidez y riesgo de desvinculacion de stablecoins. Las estrategias de crecimiento conllevan riesgo adicional de volatilidad de precio. Las estrategias de crecimiento usan protocolos en la blockchain Solana; eventos que afecten a Solana especificamente podrian impactar todas las estrategias de crecimiento simultaneamente. Usa solo dinero que puedas permitirte perder. diBoaS no es un banco y tus fondos no estan asegurados.
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

**Divulgacion de Resultados Ficticios:**

```
Los retornos proyectados, las estimaciones de probabilidad y los resultados de simulacion en esta pagina son ilustrativos y no representan resultados garantizados. Las proyecciones de la calculadora se basan en escenarios hipoteticos y medias historicas. Los resultados reales variaran.
```

**Aviso de Asesoramiento Profesional:**

```
La informacion de esta pagina tiene fines exclusivamente educativos e informativos. No constituye asesoramiento de inversion, asesoramiento financiero ni ninguna otra forma de asesoramiento profesional. Considere consultar a un asesor financiero autorizado antes de tomar decisiones de inversion.
```

**(c) 2026 diBoaS. Todos los derechos reservados.**

---

## NOTAS DE LOCALIZACION ES

### Decisiones de Adaptacion

1. **Nombres de estrategias traducidos:** "Puerto Seguro", "Portero", "A Toda Potencia", etc. crean conexion emocional mas fuerte que los nombres en ingles. Los protocolos mantienen nombres tecnicos en ingles.

2. **"Deposito a plazo fijo" / "cuenta de ahorro":** En Espana, la referencia natural es el deposito a plazo fijo o la cuenta de ahorro remunerada. FGD (Fondo de Garantia de Depositos) con limite de 100.000 EUR por entidad.

3. **"Invertir/vender":** En espanol europeo, "invertir" y "vender" son terminos naturales y no necesitan sustitutos como en PT-BR ("aplicar/resgatar").

4. **"Entrada de un piso":** En Espana, comprar un "piso" (apartamento) es la referencia de compra de vivienda mas comun, no "casa" (que suele referirse a una casa independiente y es mas cara).

5. **"Comision" en vez de "tasa":** En espanol espanol financiero, "comision" es el termino estandar para fees bancarias. "Tasa" se usa mas para impuestos.

6. **Formato numerico:** Coma como separador decimal (0,39%), punto como separador de miles (1.000). Estandar europeo.

7. **MiCA en espanol:** Los articulos 68 y 7 se incluyen en el pie de pagina con redaccion formal ("usted") porque son textos regulatorios, aunque el resto de la pagina usa "tu".
