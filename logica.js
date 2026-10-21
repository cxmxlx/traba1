// Diario de Estudio — cálculos puros del mapa de calor.
// Este archivo no toca la página ni el almacenamiento: solo recibe datos y devuelve datos.
// "Hoy" se pasa siempre como parámetro ("AAAA-MM-DD") para no depender del reloj.
// Se carga con <script> antes de app.js y también se puede usar desde los tests con require().

(function () {
  // Cortes del mapa de calor, en minutos. El primer tramo con sesión va de 1 a 29.
  const CORTES_MINUTOS = [30, 60, 120];
  const SEMANAS_MAPA = 12;
  const DIAS_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  // Minutos de una cantidad de horas. Devuelve 0 si no es un número válido,
  // si es negativo o si viene vacío. Acepta coma decimal ("1,5") y punto ("1.5").
  function convertirHorasAMinutos(horas) {
    if (horas === null || horas === undefined || horas === "") return 0;
    if (typeof horas === "string") horas = horas.replace(",", ".").trim();
    const numero = Number(horas);
    if (!Number.isFinite(numero) || numero < 0) return 0;
    return Math.floor(numero * 60);
  }

  // Comprueba que una fecha sea "AAAA-MM-DD" y exista en el calendario local.
  // Devuelve null si está ausente o mal formada. No construye fechas UTC.
  function normalizarFecha(fecha) {
    if (typeof fecha !== "string") return null;
    const partes = fecha.split("-");
    if (partes.length !== 3) return null;

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);
    if (!Number.isInteger(anio) || !Number.isInteger(mes) || !Number.isInteger(dia)) return null;
    if (anio < 1000 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

    // Se comprueba con una fecha local: si el día no existe, Date lo desborda.
    const prueba = new Date(anio, mes - 1, dia);
    if (
      prueba.getFullYear() !== anio ||
      prueba.getMonth() !== mes - 1 ||
      prueba.getDate() !== dia
    ) {
      return null;
    }
    return formatearFecha(prueba);
  }

  // Suma los minutos de todas las sesiones de cada día.
  // Ignora fechas inválidas y sesiones sin identificador repetido.
  function calcularMinutosPorDia(sesiones) {
    const minutosPorDia = {};
    const idsVistos = new Set();

    for (const sesion of Array.isArray(sesiones) ? sesiones : []) {
      if (!sesion || typeof sesion !== "object") continue;

      const id = sesion.id;
      if (id !== undefined && id !== null) {
        const clave = String(id);
        if (idsVistos.has(clave)) continue; // identificadores repetidos cuentan una vez
        idsVistos.add(clave);
      }

      const fecha = normalizarFecha(sesion.fecha);
      if (!fecha) continue; // fecha ausente o mal formada: se ignora, no se borra nada

      minutosPorDia[fecha] = (minutosPorDia[fecha] || 0) + convertirHorasAMinutos(sesion.horas);
    }

    return minutosPorDia;
  }

  // Nivel de intensidad de un día (0 = sin sesión, 1 a 4 según los cortes fijos).
  // Los cortes son inclusivos: 29 es nivel 1, 30 es nivel 2, 120 es nivel 4.
  function calcularNivel(minutos) {
    if (!Number.isFinite(minutos) || minutos <= 0) return 0;
    let nivel = 1;
    for (const corte of CORTES_MINUTOS) {
      if (minutos >= corte) nivel += 1;
    }
    return nivel;
  }

  // ¿La fecha es posterior a hoy? Se comparan textos "AAAA-MM-DD":
  // el orden alfabético coincide con el orden del calendario y no hay UTC de por medio.
  function esFechaFutura(fecha, hoy) {
    return normalizarFecha(fecha) !== null && normalizarFecha(hoy) !== null && fecha > hoy;
  }

  // Lunes de la semana de una fecha (la semana va de lunes a domingo).
  function inicioDeSemana(fecha) {
    const dia = parsearFecha(fecha);
    if (!dia) return null;
    const diaSemana = dia.getDay(); // 0 = domingo, 1 = lunes...
    const desplazamiento = diaSemana === 0 ? -6 : 1 - diaSemana;
    dia.setDate(dia.getDate() + desplazamiento);
    return formatearFecha(dia);
  }

  // Desplaza una fecha en días usando fecha local (sin pasar por UTC).
  function sumarDias(fecha, dias) {
    const dia = parsearFecha(fecha);
    if (!dia || !Number.isInteger(dias)) return null;
    dia.setDate(dia.getDate() + dias);
    return formatearFecha(dia);
  }

  // Periodo del mapa: 12 semanas, desde el lunes de la más antigua
  // hasta el domingo de la semana de hoy. La primera semana va completa.
  function calcularPeriodoMapa(hoy, semanas) {
    const hoyValido = normalizarFecha(hoy);
    if (!hoyValido) return { inicio: null, fin: null, dias: [] };

    const total = Number.isInteger(semanas) && semanas > 0 ? semanas : SEMANAS_MAPA;
    const lunesActual = inicioDeSemana(hoyValido);
    const inicio = sumarDias(lunesActual, -7 * (total - 1));
    const fin = sumarDias(lunesActual, 6);

    const dias = [];
    let cursor = inicio;
    while (cursor !== null && cursor <= fin) {
      dias.push(cursor);
      cursor = sumarDias(cursor, 1);
    }

    return { inicio, fin, dias };
  }

  // Construye el mapa completo: semanas con sus 7 días, cada uno con
  // su fecha, sus minutos, su nivel y su estado.
  // Estados posibles: "futuro", "sin sesion" o el número de nivel (1 a 4).
  function construirMapa(sesiones, hoy, semanas) {
    const hoyValido = normalizarFecha(hoy);
    const minutosPorDia = calcularMinutosPorDia(sesiones);
    const periodo = calcularPeriodoMapa(hoyValido || hoy, semanas);

    const resultado = [];
    let semana = null;

    for (const fecha of periodo.dias) {
      // Cada lunes abre una columna nueva.
      if (inicioDeSemana(fecha) === fecha) {
        if (semana) resultado.push(semana);
        semana = { inicio: fecha, dias: [] };
      }

      const minutos = minutosPorDia[fecha] || 0;
      const esFuturo = hoyValido ? fecha > hoyValido : false;

      let estado;
      if (esFuturo) {
        estado = "futuro"; // el futuro manda: nunca se pinta con nivel
      } else if (minutos === 0) {
        estado = "sin sesion";
      } else {
        estado = calcularNivel(minutos);
      }

      semana.dias.push({
        fecha,
        minutos,
        nivel: esFuturo ? 0 : calcularNivel(minutos),
        estado,
        esHoy: fecha === hoyValido,
      });
    }

    if (semana) resultado.push(semana);
    return { inicio: periodo.inicio, fin: periodo.fin, semanas: resultado };
  }

  // Texto del detalle de un día: fecha y minutos, o su estado.
  function describirDia(dia) {
    if (!dia || !dia.fecha) return "";
    const fecha = formatearFechaBonita(dia.fecha);
    if (dia.estado === "futuro") return `${fecha}: día futuro`;
    if (dia.estado === "sin sesion" || !dia.minutos) return `${fecha}: sin sesión`;
    return `${fecha}: ${formatearMinutos(dia.minutos)} (nivel ${dia.nivel})`;
  }

  // ---- Utilidades de fecha (locales, sin UTC) ----

  function parsearFecha(fecha) {
    const valida = normalizarFecha(fecha);
    if (!valida) return null;
    const [anio, mes, dia] = valida.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  function formatearFecha(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  }

  function formatearFechaBonita(fecha) {
    const dia = parsearFecha(fecha);
    if (!dia) return fecha;
    return dia.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  }

  // Minutos como "X h Y min"; menos de una hora, solo "Y min".
  function formatearMinutos(minutos) {
    const total = Math.floor(minutos);
    if (total < 60) return `${total} min`;
    const horas = Math.floor(total / 60);
    const resto = total % 60;
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  }

  // ---- Exportación ----
  // En la página se usan como variables globales; en Node, con require().
  const logicaMapa = {
    CORTES_MINUTOS,
    SEMANAS_MAPA,
    DIAS_SEMANA,
    convertirHorasAMinutos,
    normalizarFecha,
    calcularMinutosPorDia,
    calcularNivel,
    esFechaFutura,
    inicioDeSemana,
    sumarDias,
    calcularPeriodoMapa,
    construirMapa,
    describirDia,
    formatearMinutos,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = logicaMapa;
  }
  if (typeof window !== "undefined") {
    window.logicaMapa = logicaMapa;
  }
  if (typeof globalThis !== "undefined" && !globalThis.logicaMapa) {
    globalThis.logicaMapa = logicaMapa;
  }
})();
