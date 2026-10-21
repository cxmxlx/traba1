# Plan — 001 Mapa de calor de días estudiados

> Cumple `docs/constitution.md` (4 archivos, lógica separada, tests sin dependencias, datos intactos, español y fechas locales) y cubre RF-1 a RF-8 de `specs/001-heat-map/spec.md`.

## 1. Archivos que se crean o modifican

| Archivo | Acción | Responsabilidad | RF que cubre |
|---|---|---|---|
| `index.html` | **Modificar** | Añadir el contenedor del mapa y su leyenda (solo estructura, sin lógica ni estilos en línea). Debe cargarse **antes** que `app.js`. | RF-1, RF-4, RF-8 |
| `styles.css` | **Modificar** | Apariencia de celdas, los 5 estados (sin sesión, niveles 1–4, día futuro), leyenda y adaptación a móvil. Nada de datos. | RF-3, RF-4, RNF-1, RNF-2, RNF-7 |
| `logica.js` | **Crear** | Funciones puras de cálculo del mapa. Sin DOM, sin `localStorage`, sin `Date.now()`: "hoy" siempre entra como parámetro. Se escribe como script clásico que además expone sus funciones para los tests. | RF-1, RF-2, RF-3, RF-6 |
| `app.js` | **Modificar** | Leer las sesiones guardadas, llamar a la lógica y pintar el mapa en el DOM; gestionar el detalle del día. Mantiene intacto lo que ya funciona (racha, estadísticas, calendario). | RF-4, RF-5, RF-7, RF-8 |
| `tests/mapa.test.js` | **Crear** | Casos automáticos con `node --test` sobre `logica.js`. Es test, no código del producto: no se carga en la página. | RF-1 a RF-3, RF-6, CL-1 a CL-16 |
| `specs/001-heat-map/spec.md` | Sin cambios | Fuente del qué. | — |
| `docs/constitution.md` | **Ya modificado** | Principios 1 y 4 actualizados a 4 archivos y `node --test`. | — |

`index.html` debe incluir `logica.js` antes de `app.js` para que la página siga funcionando con doble clic (`file://`), igual que ocurre ahora con un solo script.

## 2. Funciones puras de lógica (todas con "hoy" como parámetro)

Se escriben en `logica.js`, sin tocar el DOM ni el almacenamiento. "Hoy" se recibe siempre como texto `"AAAA-MM-DD"` para no depender del reloj dentro de la lógica.

| Función | Entrada → Salida | Responsabilidad | RF que cubre |
|---|---|---|---|
| `convertirHorasAMinutos(horas)` | número o texto → entero ≥ 0 | Convierte horas a minutos, redondeando hacia abajo; acepta coma decimal; devuelve 0 si no es un número válido o es negativo. | RF-2, CL-10, CL-12, CL-16 |
| `normalizarFecha(fecha)` | texto → `"AAAA-MM-DD"` o `null` | Comprueba que la fecha tenga forma válida y exista en el calendario; devuelve `null` si está ausente o mal formada. | RF-6, CL-11 |
| `calcularMinutosPorDia(sesiones)` | array de sesiones → objeto `{ "AAAA-MM-DD": minutos }` | Suma los minutos de todas las sesiones de cada día, ignorando fechas inválidas y contando cada identificador una sola vez. | RF-2, RF-6, CL-1, CL-10 a CL-13 |
| `calcularNivel(minutos)` | entero ≥ 0 → 0 \| 1 \| 2 \| 3 \| 4 | Aplica los cortes inclusivos: 0; 1–29; 30–59; 60–119; 120 o más. | RF-2, CL-2, CL-3, CL-15 |
| `esFechaFutura(fecha, hoy)` | dos textos → booleano | Compara dos fechas locales por texto; devuelve `true` solo si la fecha es posterior a hoy. | RF-3, CL-4, CL-5, CL-14 |
| `inicioDeSemana(fecha)` | texto → texto | Devuelve el lunes de la semana de esa fecha (lunes a domingo). | RF-1 |
| `sumarDias(fecha, dias)` | texto + entero → texto | Desplaza una fecha en días usando fecha local, sin pasar por UTC. | RF-1, CL-9 |
| `calcularPeriodoMapa(hoy, semanas)` | texto + entero → `{ inicio, fin, dias }` | Calcula las 12 semanas: desde el lunes de la semana más antigua hasta el domingo de la semana actual, como lista ordenada de días. | RF-1, RF-8, CL-6, CL-9 |
| `construirMapa(sesiones, hoy, semanas)` | datos + textos/entero → estructura del mapa | Une todo: minutos por día, nivel, si el día es futuro y la fecha. Devuelve las semanas con sus 7 días, sin datos derivados guardados. | RF-1, RF-2, RF-3, RF-6 |
| `describirDia(diaMapa)` | día → texto | Devuelve el texto del detalle: fecha y minutos, o "sin sesión", o "día futuro". | RF-7 |

Todas devuelven datos nuevos y no modifican lo que reciben, para poder probarlas con casos repetibles.

## 3. Algoritmo del mapa (pseudocódigo)

```
FUNCIÓN construirMapa(sesiones, hoy, semanas):
    minutosPorDia ← calcularMinutosPorDia(sesiones)      // suma por día, ignora corruptas y duplicadas
    inicio ← lunes de la semana más antigua del periodo  // hoy menos (semanas - 1) semanas, ajustado a lunes
    fin    ← domingo de la semana de hoy

    semanas ← lista vacía
    fecha   ← inicio
    MIENTRAS fecha ≤ fin:
        SI es lunes:
            semana ← lista vacía (nueva columna)

        minutos ← minutosPorDia[fecha] o 0
        nivel   ← calcularNivel(minutos)
        SI esFechaFutura(fecha, hoy):
            estado ← "futuro"        // el futuro manda sobre cualquier sesión
        SI NO SI minutos = 0:
            estado ← "sin sesión"
        SI NO:
            estado ← nivel           // 1 a 4

        añadir a semana: { fecha, minutos, nivel, estado, esHoy: fecha = hoy }
        SI es domingo:
            añadir semana a semanas

        fecha ← fecha + 1 día

    DEVOLVER { inicio, fin, semanas }
```

Reglas que resuelve el bucle:
- **Orden lunes a domingo**: cada columna empieza en lunes y cierra en domingo (RF-1).
- **Semana actual completa**: el fin es el domingo de esta semana, así que los días posteriores a hoy existen y quedan en estado "futuro" (RF-1, RF-3, CL-5).
- **Primera semana completa**: el inicio se ajusta al lunes, aunque ese lunes caiga fuera del periodo contado (RF-1, CL-6).
- **Cambio de mes y año**: como se avanza día a día con fecha local, no hay huecos (CL-9).
- **Sin datos derivados**: el resultado se calcula al vuelo y no se guarda (RF-6).

## 4. Cómo se pinta en la interfaz

**Estructura (HTML).** Una tarjeta nueva con el mapa y su leyenda, y un contenedor oculto para el detalle del día. Solo etiquetas y huecos vacíos; el contenido lo pone `app.js`.

**Pintado (app.js).** Al arrancar y cada vez que cambian las sesiones, `app.js`:
1. Lee las sesiones guardadas y obtiene la fecha de hoy con una función local (`AAAA-MM-DD`), nunca con `toISOString()`.
2. Llama a `construirMapa(sesiones, hoy, 12)`.
3. Por cada semana crea una columna, y por cada día, una celda con:
   - su clase según el **estado** (`sin sesión`, `nivel 1` … `nivel 4`, `futuro`), que es lo que da el color desde CSS;
   - el **nivel como número visible o accesible** en las celdas con sesión, para no depender del color (RNF-3);
   - el día de la semana y el mes en las celdas que corresponda, como etiquetas de la cuadrícula.
4. La leyenda se construye recorriendo los mismos cortes que usa `calcularNivel`, para que mapa y leyenda no puedan decir cosas distintas (RF-4).
5. El detalle del día se muestra al pasar el puntero y al tocar; se oculta al tocar de nuevo o al tocar fuera (RF-7).

**Apariencia (CSS).** Cinco estados con la paleta existente de "tinta y brasa": sin sesión casi vacío, y los cuatro niveles como una escala de brasa cada vez más intensa; los días futuros con un tratamiento propio (por ejemplo borde discontinuo o trama) que no se confunda con "sin sesión", cumpliendo contraste AA. La cuadrícula se ajusta a 12 columnas que quepan en 375 px, sin desbordes.

**Reutilización.** `app.js` ya tiene la función que redibuja el diario tras registrar o borrar: el mapa se engancha a esa misma llamada, así que no se añade ningún camino nuevo ni se duplica lógica (RF-5).

## 5. Decisiones técnicas justificadas

| Decisión | Porqué | Alternativa descartada |
|---|---|---|
| `logica.js` con funciones puras y "hoy" por parámetro | Permite probar los cálculos sin navegador y sin depender del día en que se ejecute el test; el paso de semana, los cortes y el futuro se verifican solos (RNF-4, criterios de finalización). | Poner todo en `app.js`: obligaría a simular el DOM para probar y el test se volvería incomprensible para alguien que empieza. |
| Fechas como texto `"AAAA-MM-DD"` y comparación por texto | Comparar fechas así ordena igual que el calendario y evita por completo los desfases de UTC (principio 6). | Comparar objetos `Date` o restar milisegundos: introduce horas sueltas y errores de un día, justo lo que AGENTS.md prohíbe. |
| Niveles por cortes fijos en una función única | El color significa siempre lo mismo y se prueba en los bordes exactos (29/30/59/60/119/120) sin casos raros. | Escala relativa al mejor día: no es verificable y el mapa cambiaría de significado cada vez que se estudia más. |
| Agrupar por día en un objeto `{ fecha: minutos }` de una sola pasada | Con miles de sesiones el coste es lineal y el mapa se dibuja en menos de 100 ms (RNF-4). | Recorrer todas las sesiones por cada celda del mapa: mismo resultado con mucho más trabajo. |
| El estado "futuro" se decide antes que el color | Un día futuro con sesión guardada nunca se pinta con nivel, y hoy nunca es futuro (RF-3, CL-4, CL-5). | Decidir el futuro después del nivel: dejaría días futuros coloreados y contradiría la spec. |
| Los datos corruptos se ignoran y no se borran | Cumple el principio 5: nunca se pierden datos del usuario ni se cambia el formato guardado (CL-10 a CL-13). | "Limpiar" las sesiones inválidas al cargar: destruiría datos y exigiría migración. |
| El mapa se engancha al redibujado que ya existe | Sin caminos duplicados ni estados que se desincronicen (RF-5). | Escuchar el almacenamiento o usar temporizadores: añade complejidad y efectos raros entre pestañas. |
| Leyenda generada desde los mismos cortes | Leyenda y mapa no pueden contradecirse (RF-4). | Texto fijo escrito a mano: se quedaría desactualizado al primer cambio de cortes. |
| Navegación con teclado fuera de alcance | La spec ya lo deja fuera; hacerlo bien exige foco y atajos, alcance no pedido. | Añadirlo ahora: crece el alcance y el riesgo sin estar en la spec. |

## 6. Estrategia de tests con `node --test`

Sin dependencias y sin `package.json`: se ejecuta con `node --test tests/` (o `node --test tests/mapa.test.js`) desde la raíz del proyecto.

**Pruebas automáticas sobre `logica.js` (no necesitan navegador):**

| Bloque | Casos | RF |
|---|---|---|
| Minutos y niveles | 0, 1, 29, 30, 59, 60, 119, 120 y valores altos; horas con coma decimal; horas no numéricas, negativas o vacías. | RF-2, CL-2, CL-3, CL-10, CL-12, CL-15, CL-16 |
| Agrupación por día | Varias sesiones el mismo día; identificadores duplicados; fecha ausente o mal formada. | RF-2, CL-1, CL-11, CL-13 |
| Días futuros | Día anterior, hoy, día posterior y sesión con fecha futura. | RF-3, CL-4, CL-5, CL-14 |
| Periodo | Siempre 12 semanas; primera semana completa aunque su lunes caiga fuera; fin en el domingo de la semana actual; cruce de mes y de año seguido, sin huecos. | RF-1, RF-8, CL-6, CL-9 |
| Mapa completo | Con datos, sin datos, con una sola sesión y con sesiones fuera del periodo. | RF-6, CL-7, CL-8 |
| Texto del detalle | Día con sesión, sin sesión y futuro. | RF-7 |

Los casos se escriben a partir de la spec: cada prueba declara en su nombre el requisito o el caso límite que cubre, así que quien mantenga el código sabe por qué existe cada test. Las fechas de prueba se fijan a mano y "hoy" siempre se pasa como argumento, de modo que el resultado no cambia según el día en que se ejecute.

**Pruebas que no pueden ser automáticas (MCP de Chrome DevTools, según AGENTS.md):**

| Qué se comprueba | Cómo | RF |
|---|---|---|
| El mapa aparece al abrir `index.html` con las 12 semanas y la leyenda | Abrir la página y revisar la cuadrícula y la leyenda | RF-1, RF-4, RF-8 |
| Se actualiza al registrar y al borrar, sin recargar | Registrar y borrar sesiones desde el formulario real y revisar los colores | RF-5 |
| El detalle del día con puntero y con toque | Pasar el puntero y emular toque; comprobar que se abre y se cierra | RF-7 |
| Móvil 375 px sin desbordes y contraste AA | Emular el viewport y medir el ancho; auditoría de accesibilidad | RNF-1, RNF-2, RNF-3 |
| Consola sin errores | Revisar los mensajes de consola | Criterios de finalización |
| Rendimiento con 3.000 sesiones | Cargar datos de prueba y medir el dibujado | RNF-4 |
| Rotura de datos | Guardar horas y fechas corruptas y comprobar que el mapa sigue viéndose | CL-10 a CL-13, CL-17 |

Comprobaciones de sintaxis y casos sueltos cuando convenga: `node --check` sobre los archivos de JavaScript y `node -e` para alguna comprobación puntual.

**Orden de trabajo sugerido:** primero `logica.js` con sus tests en verde, después el pintado en `app.js` con el HTML y el CSS, y al final la verificación con el MCP y el registro en `MEMORY.md`.
