# MEMORY.md — Diario de Estudio

## Estado
- Git inicializado en rama `main` (2026-10-17). Commit inicial con los 6 archivos del proyecto.
- Remoto `origin`: https://github.com/cxmxlx/traba1 (público), sincronizado con `main`.
- Mejor racha implementada: se muestra junto a la racha actual (`#mejor-racha`).
- Minutos de la semana implementados: 4.º bloque de estadísticas (`#minutos-semana`), lunes–domingo local, muestra `X h Y min`.
- Calendario mensual implementado: tarjeta a ancho completo, rejilla lunes–domingo, 🔥 + fondo naranja en días con sesión, hoy con recuadro azul, futuro atenuado.
- Contador de días estudiados del mes visible: `#resumen-mes` bajo el título del calendario, se actualiza al navegar meses.
- Rediseño visual (2026-10-18, skill `frontend-design`): identidad "tinta y brasa" — banda de tinta con número de racha gigante serif y resplandor de brasa, tarjetas con filete sin sombra, lista en filas con filete, foco visible y `prefers-reduced-motion`.
- Archivos: `index.html`, `styles.css`, `app.js`. Sin build, funciona con doble clic.

## Decisiones
- Mejor racha recalculada desde los datos (no guardada): baja si se borran sesiones. Motivo: sin migración y compatible con `file://`.
- Minutos de la semana: cálculo al vuelo (no se guarda), semana ISO lunes–domingo en local, excluye fechas futuras, formato `X h Y min` (<1 h solo min). Minutos derivados de `horas` al mostrar; datos sin migrar.
- Mantenido formato actual `{fecha, tema, horas}` y clave `diarioEstudioSesiones` para no perder datos. `AGENTS.md` describe otro formato (`diario-estudio-sesiones`, `{date, topic, minutes}`): pendiente reconciliar.
- Fechas solo en local: `parsearFechaLocal()` con `new Date(año, mes-1, día)`. `creadaEn` ahora es `Date.now()` (antes `toISOString()`).
- Mejor racha ignora fechas futuras y cuenta días duplicados como uno.
- Calendario: marca cualquier día con ≥1 sesión (no solo rachas consecutivas), excluye futuras, solo lectura, navegación limitada al mes actual y mes visible no se persiste (al recargar vuelve al mes actual).
- Contador de días estudiados: cuenta el mes visible en el calendario (no siempre el actual), días únicos con sesión y no futuros; cálculo por prefijo de string `AAAA-MM` con `padStart(2)`, sin `new Date`. Texto sin "este mes" porque al navegar dejaría de ser "este".
- Paleta y tipografías solo del sistema (Palatino/Iowan + Avenir Next) por `file://`: nada de fuentes externas ni degradados; contraste AA en botones con brasa honda #C2410C. Se eliminaron sombras de tarjeta e indigo→violeta de forma consciente (clichés de diseño generado).

## Errores a evitar
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: rompen el día por UTC.
- No ordenar por `creadaEn.localeCompare`: ahora puede ser número; usar comparación con `>`.
- No guardar la mejor racha aparte sin migrar: se desincroniza al borrar.

## Verificación
- Abrir `index.html` en el navegador. Borrar datos: DevTools → Application → Local Storage.
- Propuesta permanente para `AGENTS.md`: definir mejor racha como "máximo histórico recalculado, ignorando futuras".
