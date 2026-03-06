# diBoaS B2B Landing Page — Copy Final (ES)

## Estado del Documento

| Campo | Valor |
|-------|-------|
| Version | FINAL — Lista para Produccion |
| Idioma | Espanol (ES) |
| Base | EN B2B Final Champion Copy (Sessions 019-020) |
| Adaptacion Cultural | Completa (no es traduccion literal) |
| Aprobado por | CMO Board, CLO Board, Copywriter |
| Fecha | 26 de febrero de 2026 |
| Bloqueos | 0 |

## Notas de Implementacion para CTO / Claude Code

Version completa en espanol de la landing page B2B de diBoaS. ADAPTACION CULTURAL para el mercado europeo (Espana como mercado principal), no traduccion literal.

### Diferencias Criticas Respecto al EN

| Item | EN | ES | Motivo |
|------|-----|-----|--------|
| Moneda | $5 minimo, $ ejemplos | 5 EUR minimo, EUR ejemplos | Mercado europeo |
| Comisiones tarjeta | 2-3% (Visa/MC generico) | 1,5-3% (TPV, comisiones bancarias espanolas) | Las comisiones de TPV en Espana son ligeramente mas bajas, pero los costes bancarios totales son altos |
| Transferencias | $25-$50 wire fees | 15-50 EUR transferencias SWIFT | Contexto SEPA vs internacional |
| Escenarios | Coffee shop, startup | Bar/restaurante, startup en Barcelona | Realidad espanola |
| Regulatorio | MiCA en ingles | MiCA en espanol (Art. 68 + Art. 7) | Jurisdiccion UE |
| Tratamiento | "you" | "tu" (informal) | Fintechs espanolas (Revolut, N26) usan tu |
| Dolor SMB | Card processing fees | Comisiones del TPV + cobros a 30 dias | En Espana, el cobro diferido es un dolor enorme |
| Dolor startup | Idle cash earning 0.5% | Dinero parado sin rendir | Mismo concepto, contexto local |
| Freelancer | Buenos Aires | Buenos Aires / Ciudad de Mexico | Conexion LATAM natural para Espana |

### Reglas Globales (mismas que EN)

- NINGUN raya (em-dash). Usar comas, puntos, dos puntos o saltos de linea.
- NINGUN emoji en el cuerpo del texto.
- Todos los CTAs son botones salvo indicacion contraria.
- El Filtro Adelaide se aplica: sin jerga en la pagina principal.
- Version A/B: condicional. CTO selecciona en build time.

### Flujo de Secciones

| # | Seccion | Tipo | Audiencia |
|---|---------|------|-----------|
| 1 | Hero | Estatico | Ambos |
| 2 | Dos Mundos | Dos tarjetas | Auto-seleccion |
| 3 | Calculadora de Flujo | Interactiva (NUEVA) | PYME primero |
| 4 | Calculadora de Tesoreria | Interactiva (refinada) | Startup primero |
| 5 | Historia de Origen | Estatico | Ambos |
| 6 | Como Funciona | 4 pasos | Ambos |
| 7 | Tres Beneficios | 3 tarjetas | Ambos |
| 8 | Inversion de Flujo | Explicacion (NUEVA) | PYME primero |
| 9 | Transparencia de Comisiones | Tabla | Ambos |
| 10 | Evaluacion de Encaje | Dos columnas | Ambos |
| 11 | Sobre el Fundador | Estatico con foto | Ambos |
| 12 | Prueba Social + Doble CTA | Contador + dos caminos | Ambos |
| 13 | FAQ | Acordeon (10 items) | Ambos |
| 14 | Pie de Pagina | Avisos legales | Ambos |

---

## SECCION 1: HERO

**H1:**

```
El sistema no esta roto. Esta disenado para quedarse con un trozo de todo lo que ganas.
```

**Sub-headline:**

```
Pierdes entre un 1,5% y un 3% en cada pago con tarjeta. Y el dinero que tienes en el banco? Esta generando beneficios para todos menos para ti. Eso se acaba ahora.
```

**CTA Button:**

```
Mira lo que estas perdiendo
```

CTA scroll a: Seccion 2

**Trust badges:**

```
Tu dinero, tu cartera | Informes listos para tu consejo | Construido sobre protocolos auditados
```

---

## SECCION 2: DOS MUNDOS

Dos tarjetas lado a lado en escritorio. Apiladas en movil (Tarjeta A primero).

**H2:**

```
Dos formas en las que el sistema te cuesta dinero.
```

### Tarjeta A: Si aceptas pagos con tarjeta

```
Cada vez que un cliente paga con tarjeta, pierdes entre un 1,5% y un 3%.

Con 1.000 EUR al dia en ventas, son entre 450 y 900 EUR al mes. Desaparecidos. Y encima, el dinero tarda de 1 a 5 dias laborables en llegar a tu cuenta. Tu dinero, en el bolsillo de otro, generando intereses para ellos.

Y si te quedaras con todo? Cuando tus clientes pagan a traves de diBoaS, te quedas con el 100% de cada transaccion. Sin procesador de tarjetas de por medio.
```

**CTA Button:**

```
Calcula lo que estas perdiendo
```

CTA scroll a: Seccion 3

### Tarjeta B: Si tu empresa tiene efectivo parado

```
Has levantado capital. Lo estas gastando con cuidado. Pero el dinero que no estas usando ahora mismo? Tu banco lo pone a trabajar, genera beneficios y a ti te paga casi nada.

Con 500.000 EUR parados, la diferencia entre lo que tu banco te paga y lo que es posible podria ser de decenas de miles de euros al ano.

Y si ese dinero trabajara para ti?
```

**CTA Button:**

```
Calcula lo que tu banco se queda
```

CTA scroll a: Seccion 4

---

## SECCION 3: CALCULADORA DE FLUJO

**H2:**

```
Y si te quedaras con ese 3%?
```

**Inputs:**

| Campo | Etiqueta | Valor por defecto |
|-------|----------|-------------------|
| Ventas diarias con tarjeta | Tus ventas diarias con tarjeta | 1.000 EUR |
| Comision actual | Tu comision de procesamiento actual | 2,5% |

Nota: el valor por defecto de comision es 2,5% (no 3%) porque refleja mejor la media espanola de comisiones TPV.

**Toggle:** 1 mes | 6 meses | 1 ano

**Aviso (ENCIMA de los resultados):**

```
Estas proyecciones son ilustrativas. Los resultados reales pueden ser mayores o menores. El rendimiento pasado no garantiza resultados futuros.
```

**Resultados (rango de 3 escenarios, para valores por defecto: 1.000 EUR/dia, 2,5%, 1 ano):**

| Escenario | Perdido en comisiones | Con diBoaS (GRATIS) | Ahorras | Si inviertes el ahorro |
|-----------|-----------------------|---------------------|---------|------------------------|
| Conservador (4%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.360 EUR |
| Media historica (7%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.630 EUR |
| Optimista (10%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.900 EUR |

**Slider ajustable:** Retorno anual esperado (media historica: 7%). Rango: 1% a 15%.

**Debajo de los resultados:**

```
Esa ultima columna? Eso es el efecto de inversion de flujo. Ahorras en comisiones. Luego haces que el ahorro crezca. Dos beneficios de un solo cambio.

Los retornos no estan garantizados. Pero el ahorro en comisiones es real desde el primer dia.
```

**CTA Button:**

```
Descubre el efecto doble
```

CTA scroll a: Seccion 8

---

**Transicion:**

```
Eso es para negocios que reciben pagos. Pero que pasa con el dinero que ya esta ahi parado?
```

---

## SECCION 4: CALCULADORA DE TESORERIA

**H2:**

```
Y si tu dinero trabajara para ti?
```

**Inputs:**

| Campo | Etiqueta | Valor por defecto |
|-------|----------|-------------------|
| Efectivo disponible | Efectivo disponible | 500.000 EUR |
| Tipo de interes actual | Tipo de interes actual | 0,5% |

**Aviso (ENCIMA de los resultados):**

```
Estas proyecciones son ilustrativas. Los resultados reales pueden ser mayores o menores. El rendimiento pasado no garantiza resultados futuros. Tu capital esta en riesgo.
```

**Resultados (rango de 3 escenarios):**

| Escenario | Tipo | Retorno anual | Tu banco (0,5%) | La diferencia |
|-----------|------|---------------|-----------------|---------------|
| Conservador | 4% | 20.000 EUR/ano | 2.500 EUR/ano | 17.500 EUR/ano |
| Media historica | 7% | 35.000 EUR/ano | 2.500 EUR/ano | 32.500 EUR/ano |
| Optimista | 10% | 50.000 EUR/ano | 2.500 EUR/ano | 47.500 EUR/ano |

**Slider ajustable:** Retorno anual esperado (media historica: 7%). Rango: 1% a 15%.

**Debajo de los resultados:**

```
Son proyecciones, no promesas. Pero la diferencia entre lo que tu banco te paga y lo que es posible? Eso es real.
```

**CTA Button:**

```
Descubre lo que es posible
```

CTA scroll a: Seccion 12

---

**Transicion:**

```
Te cuento por que esto me importa tanto.
```

---

## SECCION 5: HISTORIA DE ORIGEN

**H2:**

```
Se llamaba Adelaide.
```

**Cuerpo:**

```
Mi abuela ahorro toda su vida. La mitad de todo lo que gano. Hizo todo bien.

No fue suficiente.

El banco invirtio sus ahorros, genero beneficios, y a ella le devolvio casi nada. Te suena?

He visto bares perder 8.000 EUR al ano en comisiones de tarjeta. He visto startups con medio millon en el banco ganando menos de 200 EUR al mes en intereses. El sistema le quita a todos.

No estaba hecho para personas como ella. Tampoco para negocios como el tuyo, ya sea un restaurante o una startup.

Pero ahora? La tecnologia hizo posible eliminar a los intermediarios. Solo tenia que construir la puerta.

Le puse su nombre.
```

**Firma:**

```
Bar, Fundador
```

---

**Transicion:**

```
Asi funciona.
```

---

## SECCION 6: COMO FUNCIONA

**H2:**

```
Cuatro pasos. Dos minutos.
```

**Paso 1: Conecta tu negocio**

```
Vincula tu cuenta empresarial. Dos minutos de configuracion. Sin integracion tecnica. Sin desarrollador. Sin interrupciones. Lo haces mientras te tomas el cafe de la manana.
```

**Paso 2: Tu pones las reglas**

```
Dinos tu minimo. "Siempre tener 50.000 EUR disponibles." Todo lo que este por encima? A trabajar. Tu pones las reglas. Las cambias cuando quieras.
```

**Paso 3: Tu dinero trabaja**

```
Tu efectivo parado empieza a generar. Los pagos llegan en segundos, no en dias. Tus comisiones de procesamiento bajan del 2,5% a cero. Y no tuviste que pensar en nada de esto.
```

**Paso 4: Acceso en cualquier momento**

```
Necesitas efectivo? Un toque. Sin bloqueos. Sin penalizaciones. Procesado al instante. Los tiempos de transferencia bancaria pueden variar.
```

---

**Transicion:**

```
Ese es el proceso. Esto es lo que realmente recibes.
```

---

## SECCION 7: TRES BENEFICIOS

**H2:**

```
Lo que tu negocio recibe.
```

### Cobra sin que te quiten un trozo

```
Cuando tus clientes pagan a traves de diBoaS, recibes el importe completo. Sin recorte. Sin procesador de tarjetas llevandose un 1,5% a 3%. Sin esperar de 1 a 5 dias laborables. Dinero en tu cuenta, al instante.

Ese 2,5% que has estado perdiendo? Ahora se queda en tu cuenta.
```

### Paga a cualquiera, en cualquier lugar, al instante

```
Proveedores, autonomos, freelancers. En cualquier lugar del mundo. Tipo de cambio real. Gratis. Sin comisiones SWIFT de 15 a 50 EUR. Sin esperas de 2 a 3 dias.

Tu disenador en Buenos Aires cobra antes de que termine la reunion. Al tipo de cambio real.
```

### Adelaide vigila tu dinero

```
Inteligencia de mercado creada para propietarios de negocios, no para Wall Street. Que esta pasando con tu dinero. Que significa. Que podrias hacer. Lenguaje claro, informes listos para tu consejo de administracion, sin jerga.

Inteligencia financiera que habla en cristiano. Sin necesidad de asesores a 500 EUR la hora.
```

---

**Transicion:**

```
Pero aqui viene la parte que nadie mas esta haciendo.
```

---

## SECCION 8: INVERSION DE FLUJO

**H2:**

```
Inversion de flujo. Dos beneficios de un solo cambio.
```

### Ahorralo.

```
Hoy, por cada 100 EUR que pasan por tu negocio, pagas entre 1,50 y 3 EUR en comisiones de procesamiento. Con diBoaS, recibir pagos no cuesta nada.

Esa diferencia se acumula. Rapido.

Un bar que factura 1.000 EUR al dia en tarjeta? Son mas de 8.000 EUR al ano de vuelta a tu bolsillo.
```

### Hazlo crecer.

```
El dinero que ahorras no tiene que quedarse ahi parado. Pero puede. El ahorro en comisiones es tuyo decidas o no invertirlo.

Si decides ponerlo a trabajar: desde 5 EUR. Elige tu enfoque, desde el mas seguro hasta el mas aventurero. Adelaide vigila.
```

**Micro-ejemplo:**

```
Ahorra 9.000 EUR en comisiones. Inviertelo. Termina el ano con entre 9.360 y 9.900 EUR, dependiendo de las condiciones del mercado. Eso no es un recorte de gastos. Es una nueva linea de ingresos.
```

**Limitacion honesta + Promesa de marca:**

```
El ahorro es seguro. El crecimiento no. Esa es la cuenta real. Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

**CTA Button:**

```
Calcula tus numeros
```

CTA scroll a: Seccion 3

**Micro-aviso (texto pequeno):**

```
Ejemplo basado en 1.000 EUR/dia en ventas con tarjeta al 2,5% de comision, con ahorros invertidos a un rango del 4% al 10% de retorno anual. Las proyecciones de retorno son ilustrativas. Los resultados reales pueden variar.
```

---

## SECCION 9: TRANSPARENCIA DE COMISIONES

**H2:**

```
Lo que cuesta. Todo.
```

**Intro:**

```
Sin comisiones ocultas. Sin saldos minimos. Sin cargos mensuales. Aqui tienes cada comision, sobre la mesa.
```

| Accion | diBoaS | Proveedores tipicos | Ejemplo |
|--------|--------|---------------------|---------|
| Cuenta empresa | Gratis para siempre | 10 a 50 EUR/mes | Tu cuenta: 0 EUR. Siempre. |
| Recibir pagos | GRATIS | 1,5 a 3% (TPV) | Recibir 1.000 EUR: cuesta 0 EUR (no 15 a 30 EUR) |
| Enviar / Pagar | GRATIS* | 1,50 a 50 EUR (SWIFT) | Pagar a un proveedor 500 EUR: 0 EUR |
| Anadir dinero | 0,48% | 0 a 1,5% | Anadir 10.000 EUR: cuesta 48 EUR |
| Invertir / Crecer | GRATIS | 0,5 a 2% (asesores, plataformas) | Invertir 10.000 EUR: 0 EUR. Gratis para empezar. |
| Vender / Cerrar | 0,39% | 0,5 a 2% | Vender 10.000 EUR: cuesta 39 EUR |
| Intercambiar | GRATIS* | 0,5 a 2% spread | Intercambiar 10.000 EUR: 0 EUR |
| Retirar | 0,48% | 1 a 3% + retrasos | Retirar 10.000 EUR: cuesta 48 EUR |

```
*Comision diBoaS mostrada. Pueden aplicarse comisiones de red de terceros (normalmente menos de 0,01 EUR).
```

```
Comparaciones de precios basadas en tarifas publicas a febrero de 2026. Los rangos reflejan precios comunes entre los principales proveedores. El precio real de cada competidor varia segun proveedor, volumen y condiciones contractuales.
```

**Resumen:**

```
Recibes 1.000 EUR en pagos: te quedas con 1.000 EUR en tu cuenta diBoaS. Retiras a tu banco: 995,20 EUR (tras 0,48% de comision de retirada). Aun asi mas barato que los 970 a 980 EUR que te deja un procesador de tarjetas.
```

**Linea final:**

```
Cada comision. Sobre la mesa. Nada mas.
```

---

**Transicion:**

```
Sigues leyendo? Bien. Veamos si esto encaja con tu negocio.
```

---

## SECCION 10: EVALUACION DE ENCAJE

**H2:**

```
Es esto para tu negocio?
```

### Buen encaje

```
Tu negocio acepta pagos con tarjeta y estas harto de la comision del 2 al 3%.

Tu empresa tiene efectivo parado generando casi nada.

Quieres control total sobre tu dinero.

Te sientes comodo con un tipo de riesgo diferente a cambio de mejores retornos.
```

### No es para ti

```
Necesitas seguro de depositos gubernamental por encima de todo.

Tienes tolerancia cero al riesgo.

Prefieres los bancos tradicionales aunque cuesten mas.

Necesitas que alguien mas gestione tu dinero por ti.
```

---

## SECCION 11: SOBRE EL FUNDADOR

*(Foto de Bar)*

### Version A: Empresa registrada

```
Construido por Bar.

Creci viendo a mi abuela Adelaide navegar un sistema financiero que no estaba hecho para ella. Merecia mejores herramientas. Igual que cada propietario de negocio como tu.

diBoaS tiene su sede en Berlin, Alemania, construyendo para negocios en EEUU, la UE y Brasil. He pasado mas de 20 anos trabajando en Producto y Tecnologia en Brasil, EEUU, Japon y Alemania. Ahora estoy construyendo la herramienta financiera que desearía que cada pequeno negocio y startup tuviera.

Preguntas? Leo cada email. bar@diboas.com
```

### Version B: Empresa en registro

```
Construido por Bar.

Creci viendo a mi abuela Adelaide navegar un sistema financiero que no estaba hecho para ella. Merecia mejores herramientas. Igual que cada propietario de negocio como tu.

diBoaS esta siendo constituida en Berlin, Alemania, construyendo para negocios en EEUU, la UE y Brasil. He pasado mas de 20 anos trabajando en Producto y Tecnologia en Brasil, EEUU, Japon y Alemania. Ahora estoy construyendo la herramienta financiera que desearia que cada pequeno negocio y startup tuviera.

Preguntas? Leo cada email. bar@diboas.com
```

### Version C: Pre-registro

```
Construido por Bar.

Creci viendo a mi abuela Adelaide navegar un sistema financiero que no estaba hecho para ella. Merecia mejores herramientas. Igual que cada propietario de negocio como tu.

Estamos construyendo diBoaS desde Berlin, Alemania, para negocios en EEUU, la UE y Brasil. He pasado mas de 20 anos trabajando en Producto y Tecnologia en Brasil, EEUU, Japon y Alemania. Ahora estoy construyendo la herramienta financiera que desearia que cada pequeno negocio y startup tuviera.

Preguntas? Leo cada email. bar@diboas.com
```

**CEO: Confirmar version (A, B o C). Por defecto: Version B.**

---

## SECCION 12: PRUEBA SOCIAL + DOBLE CTA

**H2:**

```
Unete a los negocios que han dejado de pagar de mas.
```

**Contador:**

```
[X] negocios explorando diBoaS. [Y] paises.
```

### Camino A: Consigue acceso anticipado.

```
Deja tu email. Te avisamos cuando tu negocio pueda empezar a ahorrar.
```

**Input email:** "Tu email empresarial"

**CTA Button:**

```
Quiero acceso anticipado
```

```
Sin spam. Solo tu invitacion cuando estemos listos.
```

**Checkbox privacidad:** Acepto la Politica de Privacidad (/legal/privacy)

### Camino B: Revisemos tus numeros.

*Para negocios con flujo de caja o reservas significativas.*

```
15 minutos. Sin compromiso. Sin presentacion de ventas. Solo numeros.
```

**CTA Button:**

```
Reserva una conversacion
```

Enlace: https://cal.com/diboas/treasury-conversation (nueva pestana)

```
O escribe a bar@diboas.com
```

---

## SECCION 13: FAQ

**H2:**

```
Antes de decidir.
```

### FAQ 1: Cual es la trampa?

```
Cobramos comisiones pequenas cuando el dinero se mueve. Recibir pagos es gratis. Invertir es gratis. 0,39% cuando vendes o cierras una posicion. 0,48% cuando retiras.

Si recibes 10.000 EUR en pagos, no nos quedamos nada. Si inviertes 10.000 EUR, no nos quedamos nada. Si vendes 10.000 EUR, nos quedamos 39 EUR. Si no ganas nada y no envias nada, nosotros no ganamos nada.

Sin comisiones ocultas. Sin saldos minimos. Sin cargos mensuales. Sin trampa.
```

### FAQ 2: Es esto para pequenas empresas o startups?

```
Para ambas. Si tienes un bar que pierde un 2,5% en cada pago con tarjeta, te ayudamos a quedarte con ese dinero. Si eres una startup con 500.000 EUR parados en el banco ganando un 0,5%, ayudamos a que generen mas.

Las herramientas son las mismas. Solo cambian los numeros.
```

### FAQ 3: Esta seguro mi dinero?

#### Version A (No Custodia)

```
Tu dinero esta asegurado por ti. Tu cartera, tus claves. Nadie en diBoaS puede acceder a tus fondos sin tu autorizacion.

Dicho esto, no es una cuenta bancaria. Tus fondos funcionan a traves de nueva tecnologia. El valor puede fluctuar y podrias perder parte o la totalidad de tu inversion. No hay seguro de depositos.

Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

#### Version B (MPC)

```
Tu dinero esta protegido por seguridad multipartita. Tu autorizacion es necesaria para cada transaccion. DiBoaS tiene una parte parcial de la clave para recuperacion, pero no puede mover tus fondos unilateralmente.

Dicho esto, no es una cuenta bancaria. Tus fondos funcionan a traves de nueva tecnologia. El valor puede fluctuar y podrias perder parte o la totalidad de tu inversion. No hay seguro de depositos.

Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

### FAQ 4: Puedo acceder a mi dinero en cualquier momento?

```
Si. Sin bloqueos. Tu pones el minimo: "siempre tener 50.000 EUR liquidos." Solo ponemos a trabajar lo que esta por encima.

Necesitas efectivo? Un toque. Lo procesamos al instante. Los tiempos de transferencia bancaria pueden variar. Sin penalizaciones. Sin preguntas.
```

### FAQ 5: Como funcionan los pagos instantaneos?

```
Las transferencias tradicionales pasan por bancos corresponsales. Tu banco, su banco, quiza otro banco, y luego el banco del receptor. Cada paso lleva tiempo y cobra comisiones.

Con diBoaS, los pagos van directos. De tu cartera a la suya. Hecho.

Tu freelancer en Buenos Aires cobra en segundos, al tipo de cambio real, gratis. No 15 a 50 EUR y 3 dias laborables.
```

### FAQ 6: Que pasa con el cumplimiento normativo y los impuestos?

```
Construimos diBoaS para negocios reales con necesidades de cumplimiento reales.

Extractos mensuales formateados para tu software contable. Historial de transacciones con rastro de auditoria completo. Documentacion fiscal a final de ano. Informes listos para tu consejo que tu CFO realmente entendera.

Sabemos que en algun momento te van a auditar. Nos aseguramos de que estes preparado.
```

### FAQ 7: A donde va mi dinero exactamente?

```
Tu dinero se coloca en sistemas financieros establecidos que llevan operando mas de 3 anos, han sobrevivido a multiples caidas de mercado y son auditados de forma independiente en seguridad.

Todos los detalles, incluyendo nombres, historial y nuestros criterios de seleccion, estan publicados en nuestra pagina de Estrategias. Sin necesidad de registro.

Elegimos estos sistemas porque son transparentes, probados en batalla, y puedes ver exactamente donde estan tus fondos en todo momento.
```

"Pagina de Estrategias" enlaza a /strategies

### FAQ 8: Por que diBoaS no puede tocar mi dinero?

#### Version A (No Custodia)

```
Ese es precisamente el punto de como estamos construidos.

Finanzas tradicionales: depositas dinero, pasa a ser del banco, y te deben un saldo.

diBoaS: tu dinero se queda en tu propia cartera. Proporcionamos el software que te ayuda a desplegarlo en sistemas que generan retornos. Pero nunca tenemos acceso para moverlo nosotros mismos.

Si diBoaS quiebra, tu dinero sigue siendo tuyo. Nadie en diBoaS puede mover tus fondos. Cada transaccion requiere tu aprobacion.

Mas control para ti. Menos riesgo nuestro.
```

#### Version B (MPC)

```
Esto es una parte fundamental de como estamos construidos.

Finanzas tradicionales: depositas dinero, pasa a ser del banco, y te deben un saldo.

diBoaS: tu dinero esta protegido por seguridad multipartita. Tenemos una parte parcial de la clave para recuperacion de cuenta, pero cada transaccion requiere tu aprobacion explicita. No podemos mover tus fondos unilateralmente.

Si diBoaS tiene problemas, tus fondos permanecen protegidos por el sistema de seguridad multipartita. Cada transaccion requiere tu autorizacion.

Mas proteccion para ti. Menos riesgo nuestro.
```

### FAQ 9: Cual es el riesgo real?

```
Seamos honestos.

Los sistemas donde va tu dinero estan construidos con codigo. El codigo puede tener vulnerabilidades. Reducimos esto usando solo sistemas con un valor total asegurado significativo, multiples auditorias de seguridad independientes, anos de historial a traves de eventos de mercado, y distribuyendo tu dinero entre multiples sistemas independientes.

Riesgo cero? No. Nada lo es, incluido tu banco.

La pregunta real: merece la pena un perfil de riesgo diferente a cambio de mejores retornos? Para algunos negocios, si. Para otros, no. Ambas respuestas son validas.
```

### FAQ 10: Ha sido auditada diBoaS?

```
Somos una plataforma en fase de pre-lanzamiento. Nuestras estrategias estan testeadas contra caidas historicas y escenarios reales, y usamos protocolos auditados y establecidos. A medida que crezcamos, planeamos realizar auditorias independientes de terceros.

Para todos los detalles sobre los sistemas y la tecnologia detras de cada estrategia, visita nuestras paginas de Estrategias y Protocolos.
```

"Estrategias" enlaza a /strategies, "Protocolos" enlaza a /protocols.

---

## SECCION 14: PIE DE PAGINA

### Aviso de Riesgos (TODOS los idiomas)

```
diBoaS te conecta a sistemas de finanzas descentralizadas. Los retornos no estan garantizados. El rendimiento pasado no predice resultados futuros. Implica riesgos incluyendo vulnerabilidades de codigo, fluctuaciones de mercado y desafios de acceso. Usa solo fondos que puedas permitirte arriesgar. diBoaS no es un banco. No se aplica seguro de depositos.
```

### MiCA Articulo 68: Advertencia de Riesgo

```
El valor de los criptoactivos puede fluctuar. Puede perder parte o la totalidad de su dinero. Los criptoactivos no estan cubiertos por los sistemas de garantia de depositos.
```

### MiCA Articulo 7: Aviso de Comunicacion de Marketing

```
Esta comunicacion de marketing sobre criptoactivos no ha sido revisada ni aprobada por ninguna autoridad competente de ningun Estado miembro de la Union Europea. El oferente del criptoactivo es el unico responsable del contenido de esta comunicacion de marketing sobre criptoactivos.
```

### Divulgacion de IA

```
Ciertos contenidos de esta plataforma, incluyendo analisis de mercado y materiales educativos, son generados o asistidos por inteligencia artificial. El contenido generado por IA puede contener errores o limitaciones. Los usuarios deben verificar la informacion de forma independiente antes de tomar decisiones financieras.
```

### Divulgacion de Resultados Ficticios

```
Los ejemplos en esta pagina son ilustrativos y no representan negocios reales ni resultados reales. Las proyecciones de las calculadoras se basan en escenarios hipoteticos y medias historicas. Los resultados reales variaran.
```

### Elementos adicionales del pie

- Redes sociales: Instagram, X, YouTube, LinkedIn
- Navegacion: Sobre nosotros, Legal, Politica de Privacidad, Terminos de Servicio, Politica de Cookies, Ayuda, Seguridad
- Copyright: (c) 2026 diBoaS. Todos los derechos reservados.

---

## MAPA DE TRANSICIONES

| Despues de | Texto | Hacia |
|------------|-------|-------|
| 1. Hero | (CTA scroll) | Dos Mundos |
| 2. Dos Mundos | (CTAs scroll a calculadoras) | Calculadoras |
| 3. Calc. Flujo | "Eso es para negocios que reciben pagos. Pero que pasa con el dinero que ya esta ahi parado?" | Calc. Tesoreria |
| 4. Calc. Tesoreria | "Te cuento por que esto me importa tanto." | Historia de Origen |
| 5. Historia | "Asi funciona." | Como Funciona |
| 6. Como Funciona | "Ese es el proceso. Esto es lo que realmente recibes." | Tres Beneficios |
| 7. Beneficios | "Pero aqui viene la parte que nadie mas esta haciendo." | Inversion de Flujo |
| 8. Inv. Flujo | (flujo natural) | Comisiones |
| 9. Comisiones | "Sigues leyendo? Bien. Veamos si esto encaja con tu negocio." | Evaluacion |
| 10-14 | (flujo natural) | Secuencial |

---

## REGLAS DE MARCA

### Filtro Adelaide — Palabras Prohibidas

Blockchain, DeFi, Protocolo(s) (excepto FAQ 10), Stablecoin(s), Pegged, On-ramp/Off-ramp, Smart contract(s), Rendimiento/Yield, No custodia, TVL, APY/APR

### Promesa de Marca (max 2 apariciones)

```
Te mostramos las dos caras, las oportunidades y los riesgos, siempre.
```

1. FAQ 3
2. Seccion 8

### Voz

- Segunda persona ("tu")
- Calida pero directa
- Honesta con las limitaciones
- Sin rayas, sin emojis
- Habla al dueno de un bar Y al CFO de una startup
