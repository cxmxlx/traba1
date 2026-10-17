# MEMORY.md — Diario de Estudio

## Estado
- Git inicializado en rama `main` (2026-10-17). Commit inicial con los 6 archivos del proyecto.
- Mejor racha implementada: se muestra junto a la racha actual (`#mejor-racha`).
- Minutos de la semana implementados: 4.º bloque de estadísticas (`#minutos-semana`), lunes–domingo local, muestra `X h Y min`.
- Archivos: `index.html`, `styles.css`, `app.js`. Sin build, funciona con doble clic.

## Decisiones
- Mejor racha recalculada desde los datos (no guardada): baja si se borran sesiones. Motivo: sin migración y compatible con `file://`.
- Minutos de la semana: cálculo al vuelo (no se guarda), semana ISO lunes–domingo en local, excluye fechas futuras, formato `X h Y min` (<1 h solo min). Minutos derivados de `horas` al mostrar; datos sin migrar.
- Mantenido formato actual `{fecha, tema, horas}` y clave `diarioEstudioSesiones` para no perder datos. `AGENTS.md` describe otro formato (`diario-estudio-sesiones`, `{date, topic, minutes}`): pendiente reconciliar.
- Fechas solo en local: `parsearFechaLocal()` con `new Date(año, mes-1, día)`. `creadaEn` ahora es `Date.now()` (antes `toISOString()`).
- Mejor racha ignora fechas futuras y cuenta días duplicados como uno.

## Errores a evitar
- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: rompen el día por UTC.
- No ordenar por `creadaEn.localeCompare`: ahora puede ser número; usar comparación con `>`.
- No guardar la mejor racha aparte sin migrar: se desincroniza al borrar.

## Verificación
- Abrir `index.html` en el navegador. Borrar datos: DevTools → Application → Local Storage.
- Propuesta permanente para `AGENTS.md`: definir mejor racha como "máximo histórico recalculado, ignorando futuras".
