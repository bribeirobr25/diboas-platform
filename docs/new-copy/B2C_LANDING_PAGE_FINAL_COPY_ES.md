# diBoaS B2C Landing Page - Copy Final (ES)

## Estado del Documento

| Campo | Valor |
|-------|-------|
| Version | FINAL - Lista para Produccion |
| Idioma | Espanol (ES) |
| Base | EN Final Champion Copy (Sessions 015-018) |
| Adaptacion Cultural | Completa (no es traduccion literal) |
| Fecha | 26 de febrero de 2026 |
| Bloqueos | 0 |

## Notas de Implementacion para CTO / Claude Code

Este documento contiene la version completa en espanol de la landing page B2C de diBoaS. Es una ADAPTACION CULTURAL orientada al mercado europeo (Espana como mercado principal), no una traduccion literal.

### Diferencias Criticas Respecto al EN

| Item | EN | ES | Motivo |
|------|-----|-----|--------|
| Moneda | $5 minimo | 5 EUR minimo | Mercado europeo |
| Transferencias | Dolor: comisiones altas | Dolor: comisiones bancarias + transferencias fuera UE | Contexto bancario espanol |
| Escenarios | San Francisco, Dubai, Mom | Familia en Latinoamerica, freelancer, mama | Realidad espanola |
| Regulatorio | MiCA en ingles | MiCA en espanol (Art. 68 + Art. 7) | Jurisdiccion UE |
| Tratamiento | "you" | "tu" (informal) | Fintechs espanolas usan tu |
| Fee table | $ references | EUR references + contexto espanol | Costes locales |

### Reglas Globales (mismas que EN)

- NINGUN caracter de raya en toda la pagina. Usar comas, puntos, dos puntos o saltos de linea.
- NINGUN emoji en el cuerpo del texto.
- Todos los CTAs son botones salvo indicacion contraria.
- El Filtro Adelaide se aplica: sin jerga en la pagina principal.

### Flujo de Secciones (Orden Final)

| Seccion | Nombre | Tipo |
|---------|--------|------|
| 1 | Hero | Estatico |
| 2 | Historia de Origen | Estatico |
| 2.5 | Carrusel de Personas | Carrusel rotativo (3 slides) |
| 3 | Escenarios de la Vida Real | Tarjetas (3) |
| 4 | Carrusel de Producto | Carrusel rotativo (3 slides) |
| 5 | Tabla de Transparencia de Comisiones | Tabla estatica |
| 6 | Cual es la Trampa? | Estatico |
| 6.5 | Como Funciona por Dentro | Expandible/colapsable (cerrado por defecto) |
| 7 | Demo Interactiva | Componente interactivo |
| 8 | Prueba Social | Contador dinamico |
| 8.5 | Sobre el Fundador | Estatico con foto |
| 9 | Lista de Espera | Formulario (dos versiones) |
| 10 | FAQ | Acordeon (13 items) |
| 11 | Pie de Pagina | Estatico con avisos legales |

---

## SECCION 1: HERO

### Contenido

**H1:**

```
El sistema no esta roto. Funciona exactamente como fue disenado. Solo que no para ti.
```

**Sub-headline:**

```
Envia dinero a cualquier lugar en segundos. Gratis. Despues, haz que crezca mientras duermes.
```

**CTA Button:**

```
Ve tu dinero en accion
```

### Notas

- H1 es intocable. No modificar.
- Sin texto reductor de friccion debajo del CTA.
- CTA enlaza a Seccion 7 (Demo Interactiva).

---

## SECCION 2: HISTORIA DE ORIGEN

### Contenido

**Transition hook (del Hero):**

```
Por eso estoy construyendo esto.
```

**H2:**

```
Se llamaba Adelaide.
```

**Body:**

```
Mi abuela nunca tuvo acceso a las herramientas financieras que podrian haber cambiado su vida.

El sistema no estaba roto. Funcionaba exactamente como fue disenado.
Solo que no para gente como ella. Como yo. Como tu.

El acceso estaba bloqueado detras de importes minimos altos, palabras complicadas y grandes instituciones financieras a las que no les importaba la gente con pocos ahorros.

10.000 EUR para abrir una cuenta de inversion. 15 EUR al mes solo para mantener una cuenta corriente. Ese era el precio del acceso.

La nueva tecnologia hizo posible esquivar a los que controlaban todo.
Solo tenia que construir la puerta.

Le puse su nombre.
```

### Notas

- Los importes (10.000 EUR y 15 EUR) reflejan la realidad bancaria espanola/europea.
- "Le puse su nombre" es la adaptacion natural de "I named it after her." Mantiene la emocion.

---

## SECCION 2.5: CARRUSEL DE PERSONAS

### Contenido

**Transition hook (de la Historia de Origen):**

```
Lo construi para ti.
```

#### Slide 1: Quien Envia

**Direccion de fondo:** Calido, humano. Alguien con el movil a altas horas, luz suave.

**Headline:**

```
Tu madre lo necesita ahora. No en "horario de oficina".
```

**Sub-text:**

```
Envia dinero a cualquier persona en diBoaS. En cualquier lugar del mundo. En segundos. Gratis.
```

**CTA Button:**

```
Ve tu dinero en accion
```

#### Slide 2: Quien Ahorra

**Direccion de fondo:** Limpio, practico. Alguien mirando una factura o un portatil con numeros.

**Headline:**

```
Pagas cientos de euros al ano en comisiones que ni siquiera ves.
```

**Sub-text:**

```
Sin cuotas mensuales. Sin comisiones sorpresa. Sin letra pequena. Solo tu dinero, trabajando para ti.
```

**CTA Button:**

```
Ve tu dinero en accion
```

#### Slide 3: Quien Quiere Crecer

**Direccion de fondo:** Aspiracional, tranquilo. Amanecer, alguien relajado, mirando hacia adelante.

**Headline:**

```
Tu cuenta de ahorro no te esta dando casi nada. Lo sabes.
```

**Sub-text:**

```
Elige lo que encaje con tu vida, conservador o aventurero. Desde 5 EUR. Adelaide cuida tu dinero para que tu no tengas que preocuparte.
```

**CTA Button:**

```
Ve tu dinero en accion
```

**Transition hook (salida, a Escenarios):**

```
Y esto es lo que parece en la practica.
```

---

## SECCION 3: ESCENARIOS DE LA VIDA REAL

### Contenido

**H2:**

```
Gente real. Momentos reales.
```

#### Tarjeta 1: Enviando dinero a tu hermano en Colombia

```
Esta al otro lado del oceano. Tu envias. Llega antes de que guardes el movil.
```

**Comparacion de coste (texto pequeno/destaque):**

```
Transferencias internacionales: 25 a 50 EUR + 2 a 3 dias habiles. diBoaS: gratis e instantaneo.
```

#### Tarjeta 2: Pagando a un disenador en Buenos Aires

```
Esta en Sudamerica. Tu estas en Espana. El dinero llega antes de que termine la reunion.
```

**Comparacion de coste (texto pequeno/destaque):**

```
Transferencia bancaria internacional: 15 a 45 EUR + comision por cambio de divisa. diBoaS: gratis e instantaneo.
```

#### Tarjeta 3: Dinero urgente para mama

```
Las 3 de la manana. Lo necesita ahora. No en el "siguiente dia habil".
```

**Comparacion de coste (texto pequeno/destaque):**

```
Servicios de envio de dinero tradicionales: 9,99 EUR+ y entrega al dia siguiente. diBoaS: gratis, llega ahora.
```

**Linea de aclaracion (debajo de las tarjetas):**

```
Usa diBoaS solo para transferencias gratuitas. Sin obligacion de nada mas. Cuando quieras mas, esta aqui.
```

**Nota al pie (texto pequeno):**

```
Comparaciones de precios basadas en tarifas publicamente disponibles a febrero de 2026.
```

### Notas

- Los escenarios reflejan la realidad espanola: muchos espanoles tienen familia en Latinoamerica.
- Sin competidores nombrados. Solo categorias genericas.

---

## SECCION 4: CARRUSEL DE PRODUCTO

### Contenido

**Transition hook (de los Escenarios):**

```
Asi es como funciona.
```

**H2:**

```
Dinero que se mueve como mensajes.
```

#### Slide 1: Enviar y Recibir

**Quote:**

```
"Envie 200 EUR a mi hermano. Llego antes de que guardara el movil."
```

**Descripcion:**

```
Envia dinero a cualquier persona en diBoaS. En cualquier lugar del mundo. En segundos. Desde 5 EUR hasta 5.000 EUR. Gratis. Tu dinero se guarda como dolar digital, disenado para mantener un valor de 1 USD. Retira a tu cuenta bancaria cuando quieras.
```

#### Slide 2: Invertir y Crecer

**Quote:**

```
"Tenia 200 EUR parados en mi cuenta sin hacer nada. Ahora estan generando mas de lo que mi banco me ofrecio en 5 anos."
```

**Descripcion:**

```
Elige entre 10 formas de hacer crecer tu dinero. Desde la opcion mas segura hasta la mas aventurera. Desde 5 EUR. Tu dinero trabaja mientras tu duermes.
```

#### Slide 3: Seguir y Aprender

**Quote:**

```
"Adelaide cuida mi dinero para que yo no tenga que preocuparme. Lo miro una vez al dia. Menos estres. Mas vida."
```

**Descripcion:**

```
Que se mueve. Que significa. Que puedes hacer. Lenguaje claro, sin jerga.
```

**Micro-disclosure (debajo del carrusel, texto pequeno):**

```
Los ejemplos mostrados son ilustrativos y no representan usuarios reales.
```

---

## SECCION 5: TABLA DE TRANSPARENCIA DE COMISIONES

### Contenido

**Transition hook (del Carrusel de Producto):**

```
Ahora hablemos de dinero.
```

**H2:**

```
Lo Que Cuesta. Todo.
```

**Intro de cuantificacion del dolor:**

```
La persona media paga cientos de euros al ano en comisiones bancarias, gastos de transferencia y costes ocultos. Mira como queda con nosotros.
```

#### Tabla de Comisiones

| Accion | diBoaS | Apps Habituales | Diferencia | Ejemplo |
|--------|--------|-----------------|------------|---------|
| Cuenta | Gratis para siempre | 5 a 15 EUR/mes | Ahorra 60 a 180 EUR/ano | Tu cuenta: 0 EUR. Siempre. |
| Anadir Dinero | 0,48% | 0 a 1,5% | Mas barato que lo que la mayoria de apps cobra por anadir dinero | Anade 100 EUR: te cuesta 48 centimos |
| Enviar Dinero | GRATIS* | 1,50 a 50 EUR | Ahorra 5 a 50 EUR por transferencia | Envia 50 EUR a mama: 0 EUR |
| Comprar / Invertir | GRATIS | 1,5 a 2,5% (brokers) | Ahorra 1,50 a 2,50 EUR por cada 100 EUR | Invierte 100 EUR: te cuesta 0 EUR |
| Vender / Cerrar | 0,39% | 1,5 a 2,5% (brokers) | Ahorra 1,11 a 2,11 EUR por cada 100 EUR | Vende 100 EUR: te cuesta 39 centimos |
| Intercambiar | GRATIS* | 0,5 a 2% de spread | Ahorra 0,50 a 2 EUR por cada 100 EUR | Intercambia 100 EUR: 0 EUR |
| Crecer (Estrategias) | Gratis para empezar, 0,39% al salir | N/A | Opciones de crecimiento que tu banco no ofrece | Empiezas con 100 EUR: gratis. Sales con 100 EUR: cuesta 39 centimos |
| Retirar | 0,48% | 1 a 3% + retrasos | Ahorra hasta 2,52 EUR por cada 100 EUR | Retira 100 EUR: te cuesta 48 centimos |

**Nota al pie (debajo de la tabla, texto pequeno):**

```
*Comision diBoaS mostrada. Pueden aplicarse comisiones de red de terceros (normalmente menos de 0,01 EUR).
```

**Ejemplo resumen:**

```
Una inversion de 100 EUR cuesta 0 EUR con diBoaS. Vender cuesta 39 centimos.
```

**Linea de cierre:**

```
Cada comision. Sobre la mesa. Nada mas.
```

---

## SECCION 6: CUAL ES LA TRAMPA?

### Contenido

**H2:**

```
Cual es la trampa?
```

**Body:**

```
Buena pregunta. Aqui va la respuesta real:

Invertir es gratis. Cuando vendes, cobramos 0,39%. Si vendes 100 EUR, nosotros ganamos 39 centimos. La unica forma de que ganemos mas es que tu dinero crezca. Nuestros incentivos estan alineados con los tuyos.

Sin cuotas mensuales. Sin cargos sorpresa. Sin penalizaciones por retirar.

Como? La nueva tecnologia elimino las sucursales, los ejecutivos y los costes heredados. Te pasamos ese ahorro a ti.

Hay riesgo? Si. Tu dinero no esta en un banco. Esta trabajando con tecnologia nueva. Eso significa que puede crecer mas, pero tambien hay riesgo real. Monitorizamos las 24 horas del dia y probamos cada estrategia contra crisis pasadas (COVID, FTX, Terra), pero no podemos garantizar rentabilidad, y quien diga que puede esta mintiendo.

Nosotros ganamos cuando tu ganas. Te mostramos ambos lados, las oportunidades Y los riesgos, siempre.
```

---

## SECCION 6.5: COMO FUNCIONA POR DENTRO

### Contenido

**Label del toggle (siempre visible):**

```
Quieres los detalles tecnicos?
```

**Contenido expandido:**

```
Arquitectura: diBoaS esta construido sobre infraestructura financiera de codigo abierto. Tu cartera esta protegida de forma que nadie, incluido diBoaS, pueda acceder a tus fondos. Solo tu puedes autorizar transacciones.

Tu cartera: cada usuario recibe su propia cartera personal con su propia clave privada. diBoaS nunca ve, guarda ni tiene acceso a tu clave. Si diBoaS desapareciera manana, tu dinero seguiria siendo tuyo.

Seguridad: cada estrategia se prueba contra crisis historicas del mercado antes de ofrecerla a los usuarios. Monitorizamos todas las posiciones las 24 horas del dia. La firma de transacciones ocurre en milisegundos.

Transparencia: todas las comisiones se revelan por adelantado. Todos los riesgos se declaran con claridad. Sin mecanismos ocultos.
```

**Link (al final del contenido expandido):**

```
Ver la documentacion tecnica completa
```

Link: /strategies

---

## SECCION 7: DEMO INTERACTIVA

### Contenido

**Transition hook (de Como Funciona):**

```
No te fies solo de nuestra palabra.
```

**H2:**

```
Que harian tus 100 EUR aqui?
```

**Sub:**

```
Sin registro. Sin dinero real. Solo la prueba.
```

**CTA 1 (Boton primario):**

```
Pruebalo con 100 EUR (dinero de practica)
```

**CTA 2 (Boton secundario/mas pequeno):**

```
Quieres empezar con menos? Mira en que se pueden convertir 5 EUR.
```

---

## SECCION 8: PRUEBA SOCIAL

### Contenido

**H2:**

```
Los primeros 1.200.
```

**Contador (dinamico, tiempo real):**

```
[X] miembros fundadores. [Y] paises. [Z] plazas restantes.
```

**Sub:**

```
Empezamos poco a poco para poder cuidar a cada persona que se une.
```

**CTA Button:**

```
Conseguir acceso anticipado
```

---

## SECCION 8.5: SOBRE EL FUNDADOR

### Contenido

**Foto:** Usar la imagen de `apps/web/public/assets/images/` (foto de Bar).

**Texto:**

```
Construido por Bar.

Creci viendo a mi abuela Adelaide navegar un sistema financiero que no fue disenado para ella. Merecia mejores herramientas. Todos los que son como ella tambien lo merecen.

diBoaS se esta estableciendo en Berlin, Alemania, construido para personas en EE.UU., la UE y Brasil. He pasado mas de 20 anos trabajando en Productos y TI en Brasil, EE.UU., Japon y Alemania. Ahora estoy construyendo la herramienta financiera que ojala mi abuela hubiera tenido.

Preguntas? Leo todos los correos. bar@diboas.com
```

---

## SECCION 9: LISTA DE ESPERA

### Version A: Antes de alcanzar 1.200

**H2:**

```
Se de los primeros 1.200.
```

**Sub:**

```
Empezamos poco a poco para poder cuidar a cada persona que se une.
```

**Lista de beneficios:**

```
Insignia permanente de Miembro Fundador (#47 de 1.200)
Tu nombre en el Muro de los Fundadores
5 invitaciones personales
Beneficios exclusivos futuros solo para Miembros Fundadores
```

**Contador:**

```
[Z] plazas restantes
```

**Campo de email** (placeholder: "Tu correo electronico")

**CTA Button:**

```
Conseguir acceso anticipado
```

**Debajo del CTA (texto pequeno):**

```
Sin spam. Solo tu invitacion cuando estemos listos.
```

**Checkbox de privacidad:**

```
Acepto la Politica de Privacidad
```

(Link "Politica de Privacidad" a /legal/privacy)

### Version B: Despues de alcanzar 1.200

**H2:**

```
Las plazas de fundador estan completas.
```

**Sub:**

```
Tienes un codigo de invitacion? Entras como Miembro Pionero, con tu propia insignia y 5 invitaciones.
Sin codigo? Unete a la lista prioritaria. Abriremos mas plazas pronto.
```

#### Camino 1: Codigo de invitacion

**Campo de codigo** (placeholder: "Introduce tu codigo de invitacion")

**CTA Button:**

```
Entrar con mi invitacion
```

#### Camino 2: Lista de espera prioritaria

**Campo de email** (placeholder: "Tu correo electronico")

**CTA Button:**

```
Unirme a la lista prioritaria
```

**Debajo del CTA (texto pequeno):**

```
Sin spam. Solo tu invitacion cuando estemos listos.
```

---

## SECCION 10: FAQ

### Contenido

**H2:**

```
Antes de que decidas.
```

#### FAQ 1: Es diBoaS un banco?

**Pregunta:**

```
Es diBoaS un banco?
```

**Respuesta:**

```
No. diBoaS es una plataforma que te ayuda a conectar con oportunidades financieras. No gestionamos tu dinero ni tomamos decisiones sobre tus fondos. Tu cartera esta protegida de forma que solo TU puedes autorizar transacciones. Nosotros damos las herramientas, tu tomas las decisiones.
```

#### FAQ 2: Es diBoaS para todo el mundo?

**Pregunta:**

```
Es diBoaS para todo el mundo?
```

**Respuesta:**

```
No. Si quieres que otra persona tome decisiones financieras por ti, no somos nosotros. Si quieres un banco tradicional con sucursales y extractos en papel, tampoco somos nosotros.

diBoaS es para quien quiere control sobre su propio dinero, transparencia en los costes y acceso a oportunidades que antes exigian 10.000 EUR de minimo. No necesitas entenderlo todo ahora, para eso estamos. Solo necesitas estar dispuesto a aprender.
```

#### FAQ 3: Puedo retirar mi dinero en cualquier momento?

**Pregunta:**

```
Puedo retirar mi dinero en cualquier momento?
```

**Respuesta:**

```
Si. Tu dinero es tuyo. Retira a tu cuenta bancaria cuando quieras. La comision es del 0,48%, asi que retirar 100 EUR te cuesta 48 centimos. No hay periodos de permanencia ni penalizaciones. Procesamos tu retirada al instante. Los tiempos de transferencia bancaria pueden variar.
```

#### FAQ 4: Esta seguro mi dinero?

**Pregunta:**

```
Esta seguro mi dinero?
```

**Respuesta:**

```
Tu dinero esta protegido por ti. Solo tu tienes las claves. Nadie mas puede acceder a tus fondos sin tu permiso.

Dicho esto, esto no es una cuenta bancaria. Los criptoactivos no estan cubiertos por los esquemas de garantia de depositos. El valor de tus activos puede fluctuar, y podrias perder parte o la totalidad de tu inversion.

Te mostramos ambos lados, las oportunidades y los riesgos, siempre.
```

#### FAQ 5: Como es posible sin comisiones altas?

**Pregunta:**

```
Como es posible sin comisiones altas?
```

**Respuesta:**

```
Eliminando a los intermediarios, las sucursales, los ejecutivos, los costes heredados. La nueva tecnologia hace el mismo trabajo por una fraccion del precio. Te pasamos ese ahorro a ti. Ese es todo el modelo.
```

#### FAQ 6: Cual es el importe minimo para empezar?

**Pregunta:**

```
Cual es el importe minimo para empezar?
```

**Respuesta:**

```
5 EUR. El precio de un cafe. La mayoria de las plataformas de inversion exigen 500 a 10.000 EUR solo para abrirte la puerta. Creemos que eso es parte del problema.
```

#### FAQ 7: Puedo usar diBoaS solo para transferencias?

**Pregunta:**

```
Puedo usar diBoaS solo para transferencias?
```

**Respuesta:**

```
Si. Absolutamente. Puedes usar diBoaS solo para enviar y recibir dinero, gratis, instantaneo, mundial. Las funciones de inversion y crecimiento estan ahi cuando y si alguna vez las quieras. Sin presion. Sin paquetes.
```

#### FAQ 8: Y si no entiendo de inversiones?

**Pregunta:**

```
Y si no entiendo de inversiones?
```

**Respuesta:**

```
Para eso exactamente lo hemos construido. Nuestro objetivo es hacerlo tan sencillo que cualquiera pueda hacerlo. Sin jerga. Sin decisiones complicadas. Solo opciones claras e informacion transparente. Empieza con 5 EUR. Explora. Aprende. Estamos aqui en cada paso.
```

#### FAQ 9: Y si algo sale mal?

**Pregunta:**

```
Y si algo sale mal?
```

**Respuesta:**

```
La tecnologia que usamos tiene riesgo real. La rentabilidad puede subir o bajar. Los sistemas no son perfectos, ningun sistema lo es. Monitorizamos las 24 horas del dia y probamos cada estrategia contra crisis pasadas (COVID, FTX, Terra) antes de ofrecerla. Siempre te diremos que esta pasando. Pero no podemos eliminar todo el riesgo, y quien diga que puede esta mintiendo.
```

#### FAQ 10: Que pasa con mi dinero si diBoaS cierra?

**Pregunta:**

```
Que pasa con mi dinero si diBoaS cierra?
```

**Respuesta:**

```
Tu dinero esta en TU cartera. No en la nuestra. Si diBoaS desapareciera manana, seguirias teniendo tus fondos, accesibles a traves de las claves de tu cartera. Nunca guardamos tu dinero. Nunca podemos. Eso no es una funcionalidad que anadimos. Es como se construyo todo el sistema.
```

#### FAQ 11: Ha sido diBoaS auditado?

**Pregunta:**

```
Ha sido diBoaS auditado?
```

**Respuesta:**

```
Somos una plataforma en pre-lanzamiento. Nuestras estrategias se prueban contra crisis historicas y escenarios reales, y usamos protocolos auditados y establecidos. Conforme crezcamos, planeamos buscar auditorias independientes de terceros. Para detalles completos sobre los protocolos y la tecnologia detras de cada estrategia, visita nuestras paginas de Estrategias y Protocolos.
```

Links: "Estrategias" enlaza a /strategies, "Protocolos" enlaza a /protocols.

#### FAQ 12: Que pasa despues de registrarme?

**Pregunta:**

```
Que pasa despues de registrarme?
```

**Respuesta:**

```
Recibiras un correo con tu insignia y numero de Miembro Fundador, tu enlace personal de invitacion (5 invitaciones para compartir) e instrucciones para empezar.

A partir de ahi, configuras tu cartera, anades fondos y ya estas dentro.
```

---

## SECCION 11: PIE DE PAGINA

### Avisos Obligatorios

#### MiCA Articulo 68: Advertencia de Riesgo

**Aplica a:** EN, DE, ES. NO aplica a pt-BR.

**Texto (integro, no modificar):**

```
El valor de los criptoactivos puede fluctuar. Puede perder parte o la totalidad de su dinero. Los criptoactivos no estan cubiertos por los sistemas de garantia de depositos.
```

#### MiCA Articulo 7: Aviso de Comunicacion Comercial

**Aplica a:** EN, DE, ES. NO aplica a pt-BR.

**Texto (integro, no modificar):**

```
Esta comunicacion comercial sobre criptoactivos no ha sido revisada ni aprobada por ninguna autoridad competente de ningun Estado miembro de la Union Europea. El oferente de los criptoactivos es el unico responsable del contenido de esta comunicacion comercial sobre criptoactivos.
```

#### Divulgacion de IA

**Aplica a:** TODOS los idiomas.

**Texto (integro, no modificar):**

```
Cierto contenido de esta plataforma, incluidos analisis de mercado y materiales educativos, es generado o asistido por inteligencia artificial. El contenido generado por IA puede contener errores o limitaciones. Los usuarios deben verificar la informacion de forma independiente antes de tomar decisiones financieras.
```

### Elementos Adicionales del Pie de Pagina

- Lenguaje de autonomia del usuario / no custodia (una linea breve)
- Divulgacion de testimonios ficticios: "Los testimonios en esta pagina son ejemplos ilustrativos y no representan usuarios reales."
- Links sociales: Instagram, X, YouTube, LinkedIn
- Links de navegacion: Acerca de, Legal, Politica de Privacidad, Terminos de Servicio, Politica de Cookies, Ayuda, Seguridad
- Copyright: (c) 2026 diBoaS. Todos los derechos reservados.

### Notas de Implementacion para ES

- Incluir MiCA Articulo 68 + Articulo 7 EN ESPANOL (textos de arriba).
- Eliminar cualquier parrafo MiCA duplicado si existe.
- Verificar que ambos articulos estan presentes.

---

## HOOKS DE TRANSICION: MAPA COMPLETO

| Despues de Seccion | Texto del Hook | Lleva A |
|--------------------|----------------|---------|
| 1. Hero | Por eso estoy construyendo esto. | Historia de Origen |
| 2. Historia de Origen | Lo construi para ti. | Carrusel de Personas |
| 2.5. Carrusel de Personas | Y esto es lo que parece en la practica. | Escenarios |
| 3. Escenarios | Asi es como funciona. | Carrusel de Producto |
| 4. Carrusel de Producto | Ahora hablemos de dinero. | Tabla de Comisiones |
| 5. Tabla de Comisiones | (flujo natural) | Cual es la Trampa |
| 6. Cual es la Trampa | (flujo natural) | Como Funciona por Dentro |
| 6.5. Como Funciona | No te fies solo de nuestra palabra. | Demo |
| 7. Demo | (flujo natural) | Prueba Social |
| 8. Prueba Social | (flujo natural) | Sobre el Fundador |
| 8.5. Sobre el Fundador | (flujo natural) | Lista de Espera |
| 9. Lista de Espera | (flujo natural) | FAQ |
| 10. FAQ | (flujo natural) | Pie de Pagina |

---

## REGLAS DE MARCA (ES)

### Filtro Adelaide

Cada palabra en esta pagina debe pasar el Test de la Abuela: la abuela Adelaide lo entenderia? Si no, reescribelo.

### Palabras Prohibidas en la Pagina Principal

- Blockchain
- DeFi
- Protocolo(s) (excepto Seccion 6.5)
- Stablecoin(s)
- Pegged / Vinculado
- On-ramp / Off-ramp
- Smart contract(s) / Contrato inteligente
- Yield (usar "rentabilidad" o "crecimiento")
- Non-custodial / No custodia (usar "tu tienes las claves" o "tu controlas tus fondos")

### Promesa de Marca

```
Te mostramos ambos lados, las oportunidades y los riesgos, siempre.
```

Maximo 2 apariciones en la pagina:
1. Seccion 6: Cual es la Trampa (ultima linea)
2. FAQ 4: Esta seguro mi dinero? (ultima linea)

### Reglas de Voz (ES)

- Segunda persona informal (tu). El lector siempre es el sujeto.
- Calido pero directo. Nunca corporativo, nunca comercial.
- Honesto sobre las limitaciones. La divulgacion de riesgos es una caracteristica de marca.
- Frases simples.
- Cero emojis en el cuerpo del texto.

---

## NOTAS DE ADAPTACION CULTURAL

| Aspecto | EN | ES | Motivo |
|---------|-----|-----|--------|
| Moneda | $ (USD) | EUR | Mercado europeo |
| Minimo | $5 | 5 EUR | Equivalencia local |
| Cafe | "$5 coffee" | "5 EUR cafe" | Referencia cultural |
| Transferencias | Dolor general | Dolor: fuera de UE + familia en LATAM | Muchos espanoles tienen familia en Latinoamerica |
| Mantenimiento cuenta | $25/month | 15 EUR/mes | Realidad bancaria espanola |
| Minimo inversion | $10,000 | 10.000 EUR | Realidad europea |
| Formato numeros | 1,000.00 | 1.000,00 | Estandar europeo |

**Fin del documento ES.**
