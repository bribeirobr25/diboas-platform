# Sobre diBoaS — Copy Final (ES)

## Estado del Documento

| Campo | Valor |
|-------|-------|
| Version | FINAL — Post-CLO + Post-Copywriter |
| Idioma | Espanol (ES) |
| Fecha | 28 de febrero de 2026 |
| Base | ABOUT_PAGE_FINAL_EN.md |
| Adaptacion Cultural | Completa (no es traduccion literal) |
| CLO Review | Todos los fixes P0/P1 del EN aplicados. |
| Copywriter Review | Todos los fixes (FIX-1 Mission, FIX-2 Transition Hooks) aplicados. |
| Pendiente | CEO sign-off (rutina) |

## Notas de Implementacion para CTO / Claude Code

Este documento contiene la version completa en espanol de la pagina About de diBoaS. ADAPTACION CULTURAL orientada al mercado europeo (Espana como mercado principal), no traduccion literal.

### Diferencias Criticas Respecto al EN

| Item | EN | ES | Motivo |
|------|-----|-----|--------|
| Moneda | $5 | 5 EUR | Mercado europeo |
| Minimo Tarjeta 3 | $10,000 | 10.000 EUR | Realidad bancaria espanola |
| Dolor bancario | "almost nothing" | "casi nada" / referencia a depositos a plazo | Referencia bancaria espanola |
| Tratamiento | "you" | "tu" (informal) | Fintechs espanolas usan tu (N26, Trade Republic) |
| Separador decimal | 0.39% (punto) | 0,39% (coma) | Formato numerico europeo |
| Separador de miles | 1,000 (coma) | 1.000 (punto) | Formato numerico europeo |
| Regulatorio | MiCA en ingles | MiCA en espanol (Art. 68 + Art. 7) | Jurisdiccion UE |
| Tono | Warm, direct | Cercano, directo, sin ser demasiado coloquial | Cultura espanola fintech |
| Ubicacion Berlin | Neutral | Europeo (genera confianza UE) | Lector espanol valora empresa en UE |

### Reglas Globales

- NINGUN caracter de raya en toda la pagina. Usar comas, puntos, dos puntos o saltos de linea.
- NINGUN emoji en el cuerpo del texto.
- Filtro Adelaide se aplica: sin jerga. Sin "stablecoins," "protocolos," "DeFi," "yield," "APY."
- Transition hooks como texto sutil de transicion.
- Footer usa componente compartido de disclaimers (mismo que B2C, Estrategias, Protocolos).

### Flujo de Secciones

| # | Seccion | Componente | Cambios |
|---|---------|------------|---------|
| 1 | Hero | `PageHeroSection` | Subtitulo adaptado |
| t1 | Transicion | Texto sutil de transicion | **NUEVO** |
| 2 | La Historia | `SectionContainer` + prosa | H2 + body adaptado |
| t2 | Transicion | Texto sutil de transicion | **NUEVO** |
| 3 | Que hace diBoaS | `SectionContainer` + prosa | Completo. Transferencias gratis primero. |
| 4 | En que creemos | `ContentCard` x 3 | Las 3 tarjetas adaptadas |
| 5 | La Mision | `SectionContainer` | Callback a Adelaide con detalles concretos |
| t3 | Transicion | Texto sutil de transicion | **NUEVO** |
| 6 | Para Empresas | `SectionContainer` + CTA | Ampliado con puntos de dolor espanoles |
| t4 | Transicion | Texto sutil de transicion | **NUEVO** |
| 7 | Contacto | `SectionContainer` | "Bar" + email personal |
| 8 | Lista de Espera | `WaitlistSection` | Sin cambios |
| — | Footer | Componente compartido | **NUEVO: CTO debe implementar** |

### Transition Hooks

| Hook | Texto | Posicion |
|------|-------|----------|
| t1 | "Dejame contarte una historia." | Despues del Hero, antes de Seccion 2 |
| t2 | "Esto es lo que construi." | Despues de Seccion 2, antes de Seccion 3 |
| t3 | "Y no es solo para particulares." | Despues de Seccion 5, antes de Seccion 6 |
| t4 | "Quieres hablar? Estoy aqui." | Despues de Seccion 6, antes de Seccion 7 |

---

## SECCION 1: HERO

**H1:**

```
Sobre diBoaS
```

**Subtitulo:**

```
Una abuela. Un problema. Una plataforma.
```

---

## SECCION 2: LA HISTORIA

**H2:**

```
Se llamaba Adelaide.
```

**Body:**

```
Mi abuela vivio toda su vida en Rio de Janeiro. Me enseno a ahorrar. Me dijo que intentara ahorrar la mitad de todo lo que ganara. Ella misma lo intento. Toda su vida.
```

**Body (medium-weight):**

```
Trabajar duro. Comprar solo lo basico. Intentar ahorrar.
```

**Body (bold):**

```
Aun asi no fue suficiente.
```

**Body:**

```
Lo que nadie le dijo: su banco le pagaba casi nada mientras ganaba rendimientos reales con su dinero. Esa diferencia, entre lo que los bancos ganan y lo que comparten, es el sistema funcionando como fue disenado. Solo que no para gente como ella.
```

**Body:**

```
El acceso estaba bloqueado detras de importes minimos altos, palabras complicadas e instituciones a las que no les importaba la gente con pocos ahorros.
```

**Body:**

```
En 2024, perdi mi trabajo y decidi hacer algo con este problema. La nueva tecnologia hizo posible esquivar a los que controlaban el acceso. Solo tenia que construir la puerta.
```

**Body (medium-weight):**

```
Le puse su nombre.
```

### Notas

- "Se llamaba Adelaide." debe coincidir exactamente con B2C Seccion 2 H2.
- "Le puse su nombre." es la adaptacion natural de "I named it after her." Mantiene la emocion sin ser literal.
- "Aun asi no fue suficiente" es mas fuerte que "No funciono" porque reconoce el esfuerzo.
- Rio de Janeiro no cambia. La historia es internacional, eso es parte de su fuerza.

---

## SECCION 3: QUE HACE diBoaS

**H2:**

```
Que hace diBoaS
```

**Body (parrafo 1 — transferencias gratis):**

```
Primero, lo basico. Envia dinero a cualquier persona en diBoaS. En cualquier parte del mundo. En segundos. Gratis. Sin formularios, sin comisiones, sin esperar tres dias habiles. El dinero deberia moverse como un mensaje. Ahora lo hace.
```

**Micro-disclaimer (texto pequeno, debajo del parrafo 1):**

```
Transferencias gratuitas entre usuarios de diBoaS. Los tiempos de transferencia son tipicos y pueden variar. Sujeto a sanciones aplicables y requisitos de cumplimiento normativo.
```

**Body (parrafo 2 — crecimiento):**

```
Despues, crecimiento. Elige entre 10 formas de hacer crecer tu dinero, desde la opcion mas segura hasta la mas aventurera. Desde 5 EUR. Tu dinero trabaja a traves de sistemas financieros de confianza que han asegurado colectivamente miles de millones en activos. El mismo tipo de sistemas que usan las instituciones, ahora abiertos para ti.
```

**Body (parrafo 3 — Adelaide AI, medium-weight):**

```
Y Adelaide vigila todo. Llamada asi por la abuela que inspiro todo esto, Adelaide es tu inteligencia financiera personal. Que se mueve. Que significa. Que podrias hacer. Lenguaje claro, sin jerga.
```

### Notas

- Transferencias gratis van PRIMERO (prioridad del CEO).
- "El dinero deberia moverse como un mensaje" es la linea de posicionamiento OneFi.
- 5 EUR minimo (no $5).
- "Tres dias habiles" es un dolor conocido para transferencias internacionales desde Espana.
- "Sistemas financieros de confianza" en lugar de "protocolos" (Filtro Adelaide).

---

## SECCION 4: EN QUE CREEMOS

**H2:**

```
En que creemos
```

### Tarjeta 1

**Titulo:**

```
Tu dinero deberia trabajar para ti.
```

**Descripcion:**

```
No para tu banco. No para un intermediario. Para ti. La diferencia entre lo que los bancos ganan con tu dinero y lo que te devuelven es real. Nosotros cerramos esa brecha.
```

### Tarjeta 2

**Titulo:**

```
Honestidad antes que bombo.
```

**Descripcion:**

```
No prometemos rendimientos garantizados porque nadie puede. Lo que ofrecemos: datos reales de casi 4 anos de analisis historico, explicaciones claras de como funciona cada opcion, y un Centro de Aprendizaje para que entiendas lo que haces antes de hacerlo. Te mostramos ambos lados, las oportunidades y los riesgos, siempre.
```

### Tarjeta 3

**Titulo:**

```
Empieza con 5 EUR. Aprende sobre la marcha.
```

**Descripcion:**

```
No necesitas 10.000 EUR para empezar. Empieza con lo que te resulte comodo. Mira como funciona. Despues decide si es para ti. Sin presion, sin paquetes, sin ataduras.
```

### Notas

- Tarjeta 2 contiene la promesa de marca (1 de max. 2 apariciones): "Te mostramos ambos lados, las oportunidades y los riesgos, siempre."
- "Casi 4 anos" — no "4 anos" (requisito CLO).
- "Bombo" es la traduccion natural de "hype" en espanol europeo. Alternativa: "ruido."
- 10.000 EUR refleja los minimos de fondos de inversion espanoles.
- "Sin ataduras" es mas natural que "sin compromisos a largo plazo" para el publico fintech espanol.

---

## SECCION 5: LA MISION

**H2:**

```
La Mision
```

**Body:**

```
Adelaide nunca tuvo eleccion. Importes minimos altos, comisiones ocultas y palabras complicadas mantuvieron la puerta cerrada.
```

**Statement (medium-weight):**

```
Estamos construyendo la puerta que ella nunca tuvo.
```

**Pilares:**

```
Movimiento de dinero gratuito. Opciones reales de crecimiento. Transparencia total. Desde 5 EUR. En cuatro idiomas. Para todos.
```

### Notas

- "Adelaide nunca tuvo eleccion" conecta con Seccion 2.
- "La puerta que ella nunca tuvo" refleja "Solo tenia que construir la puerta" de Seccion 2.
- "Desde 5 EUR. En cuatro idiomas. Para todos." — concreto y verificable.

---

## SECCION 6: PARA EMPRESAS

**H2:**

```
Para Empresas
```

**Body (parrafo 1):**

```
Si aceptas pagos con tarjeta, las comisiones de procesamiento se comen cada transaccion. Si tienes dinero parado en la cuenta de empresa, tu banco esta ganando con el y a ti te paga casi nada. El mismo sistema que le fallo a mi abuela esta sentado sobre las reservas de tu empresa.
```

**Body (parrafo 2):**

```
diBoaS for Business ayuda a las empresas a quedarse con mas de lo que ganan, con liquidez en el mismo dia, informes listos para direccion, y acceso a los mismos sistemas de confianza que impulsan nuestra plataforma personal.
```

**CTA:**

```
Saber mas sobre diBoaS for Business
```

CTA enlaza a: `/business`

### Notas

- "Comisiones de procesamiento" — termino estandar espanol para processing fees.
- "Informes listos para direccion" en vez de "board-ready reporting" — adaptacion a estructura empresarial espanola.
- El callback a la abuela funciona tambien en contexto B2B.

---

## SECCION 7: CONTACTO

**H2:**

```
Contacto
```

**Datos de contacto:**

```
Fundador: Bar
Ubicacion: Berlin, Alemania
Email: hello@diboas.com
```

**Linea personal:**

```
Preguntas? Leo cada email. bar@diboas.com
```

### Notas

- "Bar" (no "Breno"). Coincide con B2C Seccion 8.5.
- "Berlin, Alemania" — ubicacion europea genera confianza para el mercado espanol (empresa regulada en UE).
- "Leo cada email." — directo y personal.

---

## SECCION 8: LISTA DE ESPERA

Sin cambios de copy. Usa componente compartido `WaitlistSection`.

---

## FOOTER

### Avisos Requeridos

#### MiCA Art. 68 + Art. 7 (en espanol)

```
Los criptoactivos no estan protegidos por los sistemas de garantia de depositos. Las rentabilidades pasadas no garantizan resultados futuros. Deberias realizar tu propia evaluacion independiente antes de tomar una decision de inversion.
```

#### Divulgacion de IA (en espanol)

```
Parte del contenido de esta plataforma, incluidos analisis de mercado y materiales educativos, es generado o asistido por inteligencia artificial. El contenido generado por IA puede contener errores o limitaciones. Los usuarios deben verificar la informacion de forma independiente antes de tomar decisiones financieras.
```

Usa el mismo componente compartido que B2C, Estrategias y Protocolos.

---

## SEO

```json
{
  "seo.title": "Sobre diBoaS | Construido para los que los bancos olvidaron",
  "seo.description": "diBoaS se construyo porque una abuela merecia algo mejor. Ahora todos lo merecen. Transferencias gratis, opciones reales de crecimiento, desde 5 EUR.",
  "seo.ogTitle": "Sobre diBoaS | Construido para los que los bancos olvidaron",
  "seo.ogDescription": "diBoaS se construyo porque una abuela merecia algo mejor. Ahora todos lo merecen. Transferencias gratis, opciones reales de crecimiento, desde 5 EUR."
}
```

---

## VERIFICACION DE CONSISTENCIA CROSS-PAGE

| Elemento | Otras Paginas | Pagina About | Coincide |
|----------|---------------|--------------|----------|
| "Se llamaba Adelaide" | B2C Seccion 2 | Seccion 2 H2 | ✅ |
| "Bar" (no "Breno") | B2C + B2B | Secciones 2, 7 | ✅ |
| 5 EUR minimo | B2C FAQ, Estrategias | Secciones 3, 4, 5 | ✅ |
| "Casi 4 anos" | Estrategias hero | Seccion 4 Tarjeta 2 | ✅ |
| Promesa de marca literal | B2C (2x) | Seccion 4 Tarjeta 2 | ✅ |
| Filtro Adelaide | Todas las paginas | Limpio (0 violaciones) | ✅ |
| 10 estrategias | B2C Seccion 4 | Seccion 3 | ✅ |
| "Le puse su nombre" | B2C Seccion 2 | Seccion 2 cierre | ✅ |
| Transferencias gratis = prop principal | B2C hero | Seccion 3 parrafo 1 | ✅ |
| Transition hooks | B2C (7), Protocolos (5) | About (4) | ✅ |
| MiCA footer | Todas las paginas ES | Footer | ✅ |

---

## NOTAS DE ADAPTACION CULTURAL

| Aspecto | EN | ES | Motivo |
|---------|-----|-----|--------|
| "It still didn't work" | Directo | "Aun asi no fue suficiente" | Reconoce el esfuerzo, mas fuerte en espanol |
| Dolor bancario | Generico "high fees" | "Comisiones" (termino estandar) | Todo espanol conoce las comisiones bancarias |
| Importe minimo | $10,000 | 10.000 EUR | Fondos de inversion espanoles |
| B2B lenguaje | "board-ready" | "Listos para direccion" | Estructura empresarial espanola |
| Ubicacion | Neutral | UE (genera confianza regulatoria) | Espana valora empresa regulada en UE |
| "Three business days" | Contexto US | "Tres dias habiles" | Mismo dolor, termino local |
| "Locked-in commitments" | Contratos US | "Ataduras" | Mas natural y emotivo en espanol |
| "Hype" | Ingles | "Bombo" | Espanol europeo estandar |

**Fin del documento ES.**
