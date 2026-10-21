# Constitución del Diario de Estudio

1. **Cuatro archivos y nada más.** HTML, CSS y JavaScript puros, sin frameworks, librerías ni build: `index.html`, `styles.css`, `app.js` y `logica.js`. Se verifica: no existe `package.json` ni `node_modules`.
2. **La spec describe, el código cumple.** AGENTS.md y esta constitución definen el qué; el código es el cómo. Si discrepan, se corrige el código — o se cambia la spec de forma consciente y documentada.
3. **Lógica y interfaz separadas.** Toda la lógica vive en funciones de `app.js`; el HTML solo estructura y el CSS solo apariencia. Se verifica: `app.js` no escribe estilos y `styles.css` no guarda datos.
4. **Tests sin instalar dependencias.** `node --check`, casos con `node --test` (runner propio de Node, sin librerías) y `node -e`, más la prueba manual con el MCP de Chrome DevTools (procedimiento en AGENTS.md). Los tests viven en `tests/` y se ejecutan con `node --test tests/mapa.test.js`. Prohibido añadir librerías para testear.
5. **Los datos del usuario se protegen.** localStorage, clave `diarioEstudioSesiones`, formato `{id, tema, horas, fecha, creadaEn}`: cualquier cambio exige compatibilidad con lo ya guardado, y nada se borra sin confirmación explícita.
6. **Español y fechas locales.** Variables, comentarios e interfaz en español; fechas como `"AAAA-MM-DD"` en hora local del usuario, jamás UTC.
