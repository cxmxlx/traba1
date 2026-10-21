# 001 — Mapa de calor de días estudiados

## 1. Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, un calendario mensual y estadísticas de la semana. Esas vistas son cortas: el calendario cubre un mes y no da ninguna señal de cuánto se estudió cada día.

El objetivo es añadir un **mapa de calor** que muestre de un vistazo la constancia de las últimas semanas: cada día es una celda y su color se vuelve más intenso cuanto más se estudió ese día. Sirve para que la persona vea su hábito en el tiempo y se anime a mantenerlo.

## 2. Usuarios

- **Persona que usa el diario**: estudia de forma irregular y quiere ver si mantiene el hábito a lo largo de las semanas, no solo hoy. Es el único usuario; no hay cuentas ni varios perfiles.
- **Persona que mantiene el código**: alguien que empieza a programar (proyecto didáctico).

## 3. Historias de usuario

- **HU-1**: Como persona que usa el diario, quiero ver los días de las últimas semanas en un mapa de calor, para saber si estudio de forma constante sin abrir el calendario mes a mes.
- **HU-2**: Como persona que usa el diario, quiero que el color de cada día sea más intenso cuanto más estudié ese día, para distinguir los días de un vistazo.
- **HU-3**: Como persona que usa el diario, quiero saber qué significa cada color, para no interpretar mal el mapa.
- **HU-4**: Como persona que usa el diario, quiero que el mapa refleje al instante la sesión que acabo de registrar, para no tener que recargar la página.
- **HU-5**: Como persona que usa el diario, quiero que los días sin sesión y los días futuros se vean claramente distintos, para no confundir "no estudié" con "todavía no ha pasado".

## 4. Requisitos funcionales

**RF-1 — El mapa muestra un periodo fijo de 12 semanas**
El sistema DEBE mostrar un mapa de calor con los días de las 12 semanas más recientes, incluida la semana actual, con las semanas en columnas y los días de la semana en filas (lunes a domingo).

- Criterio: CUANDO el usuario abre el diario, el sistema DEBE mostrar un mapa con 12 columnas, una por semana.
- Criterio: CUANDO el usuario abre el diario, el sistema DEBE incluir la semana actual como última columna, con sus días ya transcurridos coloreados según corresponda.
- Criterio: la semana actual DEBE mostrarse completa, incluidos sus días posteriores a hoy, que se dibujan sin nivel de intensidad.
- Criterio: SI el primer día del periodo no es lunes, ENTONCES el sistema DEBE mostrar la primera semana completa, empezando en su lunes (ese lunes puede quedar fuera del periodo de 12 semanas).
- Criterio: el sistema DEBE mantener el orden lunes a domingo en cada columna, igual que el calendario mensual.
- Criterio: CUANDO la persona usa el diario desde hace menos de 12 semanas, el sistema DEBE mostrar igualmente las 12 semanas, con las anteriores vacías.

**RF-2 — Cada día se colorea según los minutos estudiados**
El sistema DEBE calcular los minutos estudiados de cada día sumando las horas de todas las sesiones de ese día, y asignarle un nivel de intensidad mediante niveles fijos.

- Criterio: los minutos del día DEBEN calcularse a partir de las horas guardadas en cada sesión, redondeando la suma hacia abajo a minutos enteros.
- Criterio: CUANDO un día tiene 0 minutos estudiados, el sistema DEBE mostrar el día sin color de intensidad (estado "sin sesión").
- Criterio: CUANDO un día tiene entre 1 y 29 minutos, el sistema DEBE mostrar el nivel de intensidad 1.
- Criterio: CUANDO un día tiene entre 30 y 59 minutos, el sistema DEBE mostrar el nivel de intensidad 2.
- Criterio: CUANDO un día tiene entre 60 y 119 minutos, el sistema DEBE mostrar el nivel de intensidad 3.
- Criterio: CUANDO un día tiene 120 minutos o más, el sistema DEBE mostrar el nivel de intensidad 4.
- Criterio: los cortes DEBEN ser inclusivos por ambos extremos, de modo que 29 min es nivel 1, 30 min es nivel 2, 59 min es nivel 2, 60 min es nivel 3, 119 min es nivel 3 y 120 min es nivel 4.
- Criterio: CUANDO un día tiene varias sesiones, el sistema DEBE sumar sus horas y contar el día una sola vez.
- Criterio: SI varias sesiones comparten el mismo identificador, ENTONCES el sistema DEBE contarlas una sola vez.

**RF-3 — Los días futuros se distinguen de los días sin sesión**
El sistema DEBE diferenciar los días posteriores a hoy de los días pasados sin sesión.

- Criterio: el sistema DEBE determinar si un día es futuro comparando fechas locales con la fecha local de hoy, calculada al dibujar el mapa, nunca por diferencia de milisegundos ni en UTC.
- Criterio: CUANDO un día es posterior a hoy, el sistema NO DEBE asignarle ningún nivel de intensidad.
- Criterio: CUANDO un día es posterior a hoy, el sistema DEBE mostrar un aspecto propio que lo distinga de un día sin sesión.
- Criterio: SI existen sesiones con fecha futura, ENTONCES el sistema NO DEBE usarlas para colorear ningún día.
- Criterio: el día de hoy DEBE tratarse siempre como día no futuro.

**RF-4 — Leyenda de los niveles**
El sistema DEBE mostrar una leyenda que explique qué significa cada nivel de intensidad y qué significa un día sin sesión.

- Criterio: CUANDO el usuario ve el mapa, el sistema DEBE mostrar la leyenda junto a él.
- Criterio: la leyenda DEBE reflejar los mismos cortes de minutos que usa el mapa, indicando los cuatro intervalos y el estado "sin sesión".
- Criterio: la leyenda DEBE estar en español.
- Criterio: SI no hay ninguna sesión guardada, ENTONCES la leyenda DEBE seguir visible.

**RF-5 — El mapa se actualiza al registrar o borrar sesiones**
El sistema DEBE recalcular y redibujar el mapa cada vez que las sesiones cambian dentro de la misma página.

- Criterio: CUANDO el usuario registra una sesión con una fecha dentro del periodo, el sistema DEBE actualizar el color de ese día sin recargar la página.
- Criterio: CUANDO el usuario registra una sesión con fecha fuera del periodo, el sistema NO DEBE alterar ningún día del mapa y DEBE seguir mostrándose correctamente.
- Criterio: CUANDO el usuario borra una sesión, el sistema DEBE actualizar el color del día afectado sin recargar la página.
- Criterio: SI al borrar la última sesión de un día ese día queda sin minutos, ENTONCES el sistema DEBE devolverlo al estado "sin sesión".
- Criterio: SI el usuario borra todas sus sesiones, ENTONCES el sistema DEBE mostrar el mapa vacío con su leyenda, sin recargar.
- Criterio: el mapa DEBE tomar la fecha local de hoy en el momento de redibujarse, de modo que un cambio de día con la página abierta se refleje en la siguiente actualización.

**RF-6 — El mapa se calcula desde los datos guardados**
El sistema DEBE construir el mapa a partir de las sesiones ya guardadas, sin guardar información nueva derivada.

- Criterio: CUANDO el usuario abre el diario después de haber estudiado en sesiones anteriores, el sistema DEBE mostrar el mapa con esos días coloreados.
- Criterio: el sistema NO DEBE modificar el formato de las sesiones guardadas ni añadir claves nuevas al almacenamiento.
- Criterio: SI no hay ninguna sesión guardada, ENTONCES el sistema DEBE mostrar el mapa vacío con su leyenda.
- Criterio: el sistema NO DEBE ofrecer ninguna acción que borre sesiones para construir el mapa.

**RF-7 — Detalle de un día con sesión**
El sistema DEBE permitir consultar qué día es cada celda con sesión y cuánto se estudió ese día.

- Criterio: CUANDO el usuario coloca el puntero sobre una celda con sesión, el sistema DEBE mostrar la fecha y los minutos estudiados de ese día.
- Criterio: CUANDO el usuario usa un dispositivo táctil, el sistema DEBE mostrar esa misma información al tocar la celda.
- Criterio: CUANDO el usuario toca de nuevo la celda o toca fuera de ella, el sistema DEBE ocultar la información.
- Criterio: CUANDO la celda no tiene sesión o es futura, el sistema DEBE indicar su estado ("sin sesión" o "día futuro") en lugar de unos minutos.
- Criterio: la fecha mostrada DEBE seguir el formato de fecha que ya usa el diario, y los minutos DEBEN mostrarse como cantidad entera.

**RF-8 — El periodo mostrado no es configurable**
El sistema DEBE usar siempre un periodo de 12 semanas, igual para todas las personas.

- Criterio: el sistema NO DEBE ofrecer controles para cambiar el número de semanas mostradas, el rango de fechas ni los colores.
- Criterio: CUANDO el usuario abre el diario, el sistema DEBE mostrar siempre 12 semanas, sin haber elegido nada antes.
- Criterio: el sistema NO DEBE guardar ninguna preferencia relacionada con el mapa.

## 5. Requisitos no funcionales

- **RNF-1**: El mapa DEBE verse bien en pantalla de móvil (375 px de ancho) sin desbordes horizontales, incluso con el navegador ampliado o con letra grande.
- **RNF-2**: El texto y los colores del mapa DEBEN cumplir un contraste mínimo de 4,5:1 en su texto, incluidos los estados "sin sesión" y "día futuro".
- **RNF-3**: El sistema DEBE distinguir los niveles por algo más que el color: cada celda con sesión DEBE exponer su nivel numérico (1–4) como texto o como información accesible.
- **RNF-4**: El mapa DEBE dibujarse en menos de 100 ms y DEBE seguir siendo fluido con años de sesiones guardadas (se prueba con al menos 3.000 sesiones).
- **RNF-5**: Todos los textos del mapa DEBEN estar en español.
- **RNF-6**: Las fechas y los cortes de semana del mapa DEBEN calcularse con la fecha local de la persona, sin desfases de día ni conversiones a UTC.
- **RNF-7**: La aparición y la actualización del mapa NO DEBEN depender de animaciones; SI la persona ha pedido movimiento reducido, ENTONCES el sistema DEBE mostrar los cambios de forma inmediata.
- **RNF-8**: El mapa NO DEBE descargar ni usar recursos externos (iconos, fuentes, imágenes ni servicios): DEBE funcionar con lo que ya trae la página.

## 6. Casos límite

- **CL-1**: Un día con dos o más sesiones suma sus minutos y cuenta como un solo día.
- **CL-2**: Una sesión de muy pocos minutos (por ejemplo 5) coloca el día en el nivel 1, no en "sin sesión".
- **CL-3**: Un día con más de 120 minutos no se diferencia de otro con exactamente 120: ambos son nivel 4, porque no hay niveles superiores.
- **CL-4**: Las sesiones con fecha futura no colorean ningún día, aunque existan en los datos.
- **CL-5**: El día de hoy con sesión se colorea con su nivel; el día de hoy sin sesión se muestra como día sin sesión, nunca como día futuro.
- **CL-6**: El primer día del periodo se muestra dentro de su semana completa, aunque quede antes del periodo.
- **CL-7**: Sin ninguna sesión guardada, el mapa se muestra vacío y la leyenda sigue visible.
- **CL-8**: Sesiones anteriores al periodo no aparecen en el mapa ni afectan a ningún color.
- **CL-9**: Los cambios de mes y de año dentro del periodo no producen huecos ni desplazamientos en el mapa.
- **CL-10**: SI una sesión tiene horas que no son un número válido, ENTONCES el sistema DEBE contarla como 0 minutos y DEBE seguir mostrando el mapa.
- **CL-11**: SI una sesión tiene una fecha ausente o mal formada, ENTONCES el sistema DEBE ignorarla para el color y DEBE seguir mostrando el mapa.
- **CL-12**: SI una sesión tiene horas negativas, ENTONCES el sistema DEBE contarla como 0 minutos.
- **CL-13**: SI dos sesiones comparten el mismo identificador, ENTONCES el sistema DEBE contar solo una.
- **CL-14**: SI la fecha del sistema se atrasa y deja sesiones guardadas en el futuro, ENTONCES el sistema DEBE mostrarlas como días futuros, sin colorearlas y sin borrar nada.
- **CL-15**: Un día con una suma de minutos justo en un corte (29, 30, 59, 60, 119 o 120) se muestra en el nivel que indica el corte superior.
- **CL-16**: Un día con horas escritas con coma decimal ("1,5") se cuenta igual que con punto ("1.5").
- **CL-17**: SI el almacenamiento no está disponible o está lleno, ENTONCES el sistema DEBE mostrar el mapa como si no hubiera sesiones, sin errores visibles.
- **CL-18**: Una sesión creada hoy después de medianoche con la página abierta se coloca en el día que corresponda la próxima vez que el mapa se redibuje.
- **CL-19**: El mapa se muestra correcto al imprimir la página, sin celdas cortadas.

## 7. Fuera de alcance

- Cambiar el calendario mensual existente o sustituirlo por el mapa.
- Cambiar la racha, la mejor racha o las estadísticas actuales.
- Registrar tiempo automáticamente o cronometrar sesiones.
- Objetivos diarios o semanales, recordatorios y notificaciones.
- Comparar periodos, exportar el mapa o compartirlo.
- Elegir el número de semanas, el rango de fechas o los colores.
- Filtros por tema.
- Navegar el mapa y consultar celdas solo con el teclado (queda como mejora futura).
- Editar sesiones ya guardadas desde el mapa.
- Sincronización, cuentas de usuario o datos en la nube.
- Cambiar el formato de las sesiones guardadas.
- Descargar o incluir recursos externos (iconos, fuentes, imágenes o servicios).

## 8. Criterios de finalización

- RF-1 a RF-8 verificados con datos de prueba reales: al menos un día por nivel, los días justo en los cortes (29, 30, 59, 60, 119 y 120 min), un día con varias sesiones, un día futuro con sesión, sesiones corruptas y un periodo con cambio de mes y de año.
- Los cálculos del mapa (minutos por día, nivel, bordes de semana y días futuros) verificados sin navegador, con casos repetibles.
- El mapa se ve correcto en móvil (375 px) después de registrar y borrar sesiones, y sin desbordes.
- La consola del navegador queda sin errores.
- Los datos guardados existentes siguen intactos y el diario sigue funcionando con doble clic.

## 9. Decisiones tomadas por delegación

Estas decisiones no venían de la idea inicial: se tomaron en la conversación por delegación explícita ("decide tú"). Quedan aquí para poder revisarlas o revertirlas.

- **Número de semanas: 12.** Cubre unos tres meses, cabe en 375 px sin encoger demasiado la celda y el detalle por mes ya lo da el calendario.
- **Los cortes son inclusivos y redondeados hacia abajo.** Elimina los huecos entre niveles: cualquier suma de minutos cae en un nivel.
- **El mapa redibuja tomando "hoy" local.** Evita que la página abierta de un día para otro muestre un "hoy" congelado.
- **La semana actual se dibuja completa**, con sus días futuros mostrados sin nivel.
- **El detalle de un día se acota a celdas con sesión**; las demás indican su estado. Evita el choque con los estados "sin sesión" y "día futuro" y con el contraste.
- **Accesibilidad: cada celda con sesión expone su nivel numérico** además del color, para no depender de la percepción del color.
- **En táctil el detalle se abre al tocar y se cierra al tocar de nuevo o fuera.** Equivalente natural del puntero, sin añadir pantallas.
- **Los datos corruptos se ignoran para el color, sin borrar nada**, y los identificadores duplicados cuentan una vez: protege los datos sin migraciones.
- **El teclado queda fuera de alcance** en esta versión, anotado como mejora futura.
- **Sin recursos externos**, en línea con la constitución y con el funcionamiento con doble clic.
