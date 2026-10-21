// Tests de los cálculos del mapa de calor (logica.js).
// Se ejecutan sin instalar nada:  node --test tests/
// Cada prueba indica en su nombre el requisito (RF) o caso límite (CL) que cubre.

const test = require("node:test");
const assert = require("node:assert");
const logica = require("../logica.js");

const HOY = "2026-10-20"; // martes

// ---- RF-2 / CL-2 / CL-3 / CL-10 / CL-12 / CL-15 / CL-16: minutos y niveles ----

test("RF-2 convertirHorasAMinutos: convierte horas a minutos enteros", () => {
  assert.strictEqual(logica.convertirHorasAMinutos(1), 60);
  assert.strictEqual(logica.convertirHorasAMinutos(1.5), 90);
  assert.strictEqual(logica.convertirHorasAMinutos(0.5), 30);
});

test("CL-16 convertirHorasAMinutos: acepta coma decimal como el punto", () => {
  assert.strictEqual(logica.convertirHorasAMinutos("1,5"), 90);
  assert.strictEqual(logica.convertirHorasAMinutos("1.5"), 90);
});

test("CL-10 y CL-12 convertirHorasAMinutos: datos corruptos cuentan como 0", () => {
  assert.strictEqual(logica.convertirHorasAMinutos("mucho"), 0);
  assert.strictEqual(logica.convertirHorasAMinutos(""), 0);
  assert.strictEqual(logica.convertirHorasAMinutos(null), 0);
  assert.strictEqual(logica.convertirHorasAMinutos(undefined), 0);
  assert.strictEqual(logica.convertirHorasAMinutos(-2), 0);
});

test("CL-15 calcularNivel: los cortes son inclusivos (29/30, 59/60, 119/120)", () => {
  assert.strictEqual(logica.calcularNivel(0), 0);
  assert.strictEqual(logica.calcularNivel(1), 1);
  assert.strictEqual(logica.calcularNivel(29), 1);
  assert.strictEqual(logica.calcularNivel(30), 2);
  assert.strictEqual(logica.calcularNivel(59), 2);
  assert.strictEqual(logica.calcularNivel(60), 3);
  assert.strictEqual(logica.calcularNivel(119), 3);
  assert.strictEqual(logica.calcularNivel(120), 4);
  assert.strictEqual(logica.calcularNivel(600), 4);
});

test("CL-2 y CL-3 calcularNivel: pocos minutos ya son nivel 1 y no hay nivel 5", () => {
  assert.strictEqual(logica.calcularNivel(5), 1);
  assert.strictEqual(logica.calcularNivel(5000), 4);
});

// ---- RF-2 / CL-1 / CL-11 / CL-13: agrupación por día ----

test("CL-1 calcularMinutosPorDia: varias sesiones del mismo día se suman", () => {
  const sesiones = [
    { id: "1", fecha: "2026-10-20", horas: 1 },
    { id: "2", fecha: "2026-10-20", horas: 0.5 },
    { id: "3", fecha: "2026-10-19", horas: 2 },
  ];
  const minutos = logica.calcularMinutosPorDia(sesiones);
  assert.strictEqual(minutos["2026-10-20"], 90);
  assert.strictEqual(minutos["2026-10-19"], 120);
});

test("CL-13 calcularMinutosPorDia: identificadores repetidos cuentan una vez", () => {
  const sesiones = [
    { id: "mismo", fecha: "2026-10-20", horas: 1 },
    { id: "mismo", fecha: "2026-10-20", horas: 1 },
  ];
  assert.strictEqual(logica.calcularMinutosPorDia(sesiones)["2026-10-20"], 60);
});

test("CL-11 calcularMinutosPorDia: fechas ausentes o mal formadas se ignoran", () => {
  const sesiones = [
    { id: "1", fecha: "2026-13-40", horas: 1 },
    { id: "2", fecha: "hoy", horas: 1 },
    { id: "3", horas: 1 },
    { id: "4", fecha: "2026-10-20", horas: 1 },
  ];
  const minutos = logica.calcularMinutosPorDia(sesiones);
  assert.deepStrictEqual(Object.keys(minutos), ["2026-10-20"]);
});

test("RF-2 y RF-6 calcularMinutosPorDia: datos que no son sesiones no rompen nada", () => {
  assert.deepStrictEqual(logica.calcularMinutosPorDia([]), {});
  assert.deepStrictEqual(logica.calcularMinutosPorDia(null), {});
  assert.deepStrictEqual(logica.calcularMinutosPorDia([null, "hola", 3]), {});
});

// ---- RF-3 / CL-4 / CL-5 / CL-14: días futuros ----

test("RF-3 esFechaFutura: solo es futuro lo posterior a hoy", () => {
  assert.strictEqual(logica.esFechaFutura("2026-10-21", HOY), true);
  assert.strictEqual(logica.esFechaFutura("2026-10-20", HOY), false);
  assert.strictEqual(logica.esFechaFutura("2026-10-19", HOY), false);
});

test("CL-4 esFechaFutura: no considera futuro lo que no es una fecha válida", () => {
  assert.strictEqual(logica.esFechaFutura("2026-13-40", HOY), false);
  assert.strictEqual(logica.esFechaFutura(null, HOY), false);
});

test("CL-14 construirMapa: un día futuro con sesión no se colorea", () => {
  const sesiones = [{ id: "1", fecha: "2026-10-22", horas: 5 }];
  const mapa = logica.construirMapa(sesiones, HOY, 12);
  const futuro = mapa.semanas.flatMap((s) => s.dias).find((d) => d.fecha === "2026-10-22");
  assert.strictEqual(futuro.estado, "futuro");
  assert.strictEqual(futuro.nivel, 0);
});

test("CL-5 construirMapa: hoy nunca es futuro", () => {
  const mapa = logica.construirMapa([], HOY, 12);
  const hoy = mapa.semanas.flatMap((s) => s.dias).find((d) => d.fecha === HOY);
  assert.strictEqual(hoy.esHoy, true);
  assert.strictEqual(hoy.estado, "sin sesion");
});

// ---- RF-1 / RF-8 / CL-6 / CL-9: periodo de 12 semanas ----

test("RF-1 construirMapa: siempre hay 12 semanas de 7 días", () => {
  const mapa = logica.construirMapa([], HOY, 12);
  assert.strictEqual(mapa.semanas.length, 12);
  for (const semana of mapa.semanas) assert.strictEqual(semana.dias.length, 7);
});

test("RF-1 construirMapa: cada columna va de lunes a domingo", () => {
  const mapa = logica.construirMapa([], HOY, 12);
  for (const semana of mapa.semanas) {
    assert.strictEqual(logica.inicioDeSemana(semana.dias[0].fecha), semana.dias[0].fecha);
    assert.strictEqual(semana.dias[0].fecha, semana.inicio);
    assert.strictEqual(mapa.semanas.indexOf(semana) >= 0, true);
  }
});

test("RF-1 calcularPeriodoMapa: empieza en lunes y acaba en el domingo de esta semana", () => {
  const periodo = logica.calcularPeriodoMapa(HOY, 12);
  assert.strictEqual(periodo.inicio, "2026-08-03"); // lunes
  assert.strictEqual(periodo.fin, "2026-10-25"); // domingo de la semana de hoy
  assert.strictEqual(periodo.dias.length, 12 * 7);
});

test("CL-6 calcularPeriodoMapa: la primera semana va completa aunque su lunes quede fuera del periodo", () => {
  const periodo = logica.calcularPeriodoMapa(HOY, 12);
  assert.strictEqual(logica.inicioDeSemana(periodo.inicio), periodo.inicio);
  assert.strictEqual(logica.inicioDeSemana(periodo.fin), logica.inicioDeSemana(HOY));
});

test("CL-9 calcularPeriodoMapa: no hay huecos al cruzar mes y año", () => {
  const periodo = logica.calcularPeriodoMapa("2027-01-05", 12);
  assert.strictEqual(periodo.dias.length, 12 * 7);
  for (let i = 1; i < periodo.dias.length; i++) {
    assert.strictEqual(periodo.dias[i], logica.sumarDias(periodo.dias[i - 1], 1));
  }
});

test("RF-8 construirMapa: el periodo no depende de cuántos datos haya", () => {
  const vacio = logica.construirMapa([], HOY, 12);
  const lleno = logica.construirMapa(
    [{ id: "1", fecha: "2026-10-20", horas: 2 }],
    HOY,
    12
  );
  assert.strictEqual(vacio.semanas.length, lleno.semanas.length);
  assert.strictEqual(vacio.inicio, lleno.inicio);
  assert.strictEqual(vacio.fin, lleno.fin);
});

// ---- RF-6 / CL-7 / CL-8: datos guardados ----

test("RF-6 construirMapa: los días con sesión llevan su nivel", () => {
  const sesiones = [
    { id: "1", fecha: "2026-10-20", horas: 1.5 }, // 90 min -> nivel 3
    { id: "2", fecha: "2026-10-19", horas: 2.5 }, // 150 min -> nivel 4
    { id: "3", fecha: "2026-10-18", horas: 0.4 }, // 24 min -> nivel 1
  ];
  const mapa = logica.construirMapa(sesiones, HOY, 12);
  const dias = mapa.semanas.flatMap((s) => s.dias);
  assert.strictEqual(dias.find((d) => d.fecha === "2026-10-20").estado, 3);
  assert.strictEqual(dias.find((d) => d.fecha === "2026-10-19").estado, 4);
  assert.strictEqual(dias.find((d) => d.fecha === "2026-10-18").estado, 1);
});

test("CL-7 construirMapa: sin sesiones todo queda vacío y el mapa existe igual", () => {
  const mapa = logica.construirMapa([], HOY, 12);
  const dias = mapa.semanas.flatMap((s) => s.dias);
  assert.strictEqual(dias.length, 84);
  assert.strictEqual(dias.filter((d) => d.estado === "sin sesion").length, 84 - 5); // 5 días futuros
});

test("CL-8 construirMapa: las sesiones fuera del periodo no afectan al mapa", () => {
  const dentro = logica.construirMapa(
    [{ id: "1", fecha: "2026-10-20", horas: 2 }],
    HOY,
    12
  );
  const fuera = logica.construirMapa(
    [
      { id: "1", fecha: "2026-10-20", horas: 2 },
      { id: "2", fecha: "2020-01-01", horas: 10 },
    ],
    HOY,
    12
  );
  assert.deepStrictEqual(fuera, dentro);
});

test("RF-6 construirMapa: no modifica las sesiones que recibe", () => {
  const sesiones = [{ id: "1", fecha: "2026-10-20", horas: 2 }];
  const copia = JSON.parse(JSON.stringify(sesiones));
  logica.construirMapa(sesiones, HOY, 12);
  assert.deepStrictEqual(sesiones, copia);
});

// ---- RF-7: texto del detalle ----

test("RF-7 describirDia: con sesión muestra minutos y nivel", () => {
  const texto = logica.describirDia({ fecha: "2026-10-19", minutos: 90, nivel: 3, estado: 3 });
  assert.strictEqual(texto, "lunes, 19 de octubre: 1 h 30 min (nivel 3)");
});

test("RF-7 describirDia: sin sesión y futuro se explican con palabras", () => {
  const sinSesion = logica.describirDia({ fecha: "2026-10-18", minutos: 0, nivel: 0, estado: "sin sesion" });
  const futuro = logica.describirDia({ fecha: "2026-10-22", minutos: 0, nivel: 0, estado: "futuro" });
  assert.strictEqual(sinSesion, "domingo, 18 de octubre: sin sesión");
  assert.strictEqual(futuro, "jueves, 22 de octubre: día futuro");
});

// ---- Utilidades ----

test("RF-1 inicioDeSemana: devuelve el lunes de esa semana", () => {
  assert.strictEqual(logica.inicioDeSemana("2026-10-20"), "2026-10-19");
  assert.strictEqual(logica.inicioDeSemana("2026-10-19"), "2026-10-19");
  assert.strictEqual(logica.inicioDeSemana("2026-10-25"), "2026-10-19");
});

test("CL-9 sumarDias: cruza meses y años sin desfases", () => {
  assert.strictEqual(logica.sumarDias("2026-12-31", 1), "2027-01-01");
  assert.strictEqual(logica.sumarDias("2027-01-01", -1), "2026-12-31");
  assert.strictEqual(logica.sumarDias("2026-02-28", 1), "2026-03-01");
});

test("CL-11 normalizarFecha: acepta solo fechas reales", () => {
  assert.strictEqual(logica.normalizarFecha("2026-10-20"), "2026-10-20");
  assert.strictEqual(logica.normalizarFecha("2026-02-30"), null);
  assert.strictEqual(logica.normalizarFecha("2026-13-01"), null);
  assert.strictEqual(logica.normalizarFecha("hola"), null);
  assert.strictEqual(logica.normalizarFecha(undefined), null);
});

test("RNF-4 construirMapa: con 3.000 sesiones el mapa sigue siendo correcto", () => {
  const sesiones = [];
  let fecha = "2026-08-03";
  for (let i = 0; i < 3000; i++) {
    sesiones.push({ id: String(i), fecha, horas: 0.5 });
    fecha = logica.sumarDias(fecha, 1);
    if (fecha > "2026-10-20") fecha = "2020-01-01"; // el resto cae fuera del periodo
  }
  const inicio = Date.now();
  const mapa = logica.construirMapa(sesiones, HOY, 12);
  const duracion = Date.now() - inicio;
  assert.strictEqual(mapa.semanas.length, 12);
  assert.ok(duracion < 100, `el cálculo tardó ${duracion} ms`);
});
