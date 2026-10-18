// Diario de Estudio — lógica de sesiones y racha
const CLAVE_ALMACEN = "diarioEstudioSesiones";

const formulario = document.getElementById("formulario-sesion");
const campoTema = document.getElementById("campo-tema");
const campoHoras = document.getElementById("campo-horas");
const campoFecha = document.getElementById("campo-fecha");
const errorFormulario = document.getElementById("error-formulario");

const contadorRacha = document.getElementById("contador-racha");
const mejorRacha = document.getElementById("mejor-racha");
const mensajeRacha = document.getElementById("mensaje-racha");
const listaSesiones = document.getElementById("lista-sesiones");
const listaVacia = document.getElementById("lista-vacia");
const totalSesiones = document.getElementById("total-sesiones");
const totalHoras = document.getElementById("total-horas");
const totalDias = document.getElementById("total-dias");
const minutosSemana = document.getElementById("minutos-semana");
const botonBorrarTodo = document.getElementById("boton-borrar-todo");
const tituloMes = document.getElementById("titulo-mes");
const calendario = document.getElementById("calendario");
const botonMesAnterior = document.getElementById("mes-anterior");
const botonMesSiguiente = document.getElementById("mes-siguiente");
const resumenMes = document.getElementById("resumen-mes");

// Mes que muestra el calendario: siempre arranca en el mes actual.
let mesVisible = { anio: new Date().getFullYear(), mes: new Date().getMonth() };

// Deja la fecha de hoy como valor inicial
campoFecha.value = obtenerHoyISO();
campoFecha.max = obtenerHoyISO();

// Carga inicial
let sesiones = cargarSesiones();
dibujarTodo();

// Guarda una nueva sesión desde el formulario
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  ocultarError();

  const tema = campoTema.value.trim();
  const horas = Number(campoHoras.value);
  const fecha = campoFecha.value;

  if (!tema) return mostrarError("Escribe qué has estudiado.");
  if (!fecha) return mostrarError("Elige una fecha válida.");
  if (!Number.isFinite(horas) || horas < 0.25 || horas > 24) {
    return mostrarError("Las horas deben estar entre 0.25 y 24.");
  }

  sesiones.push({
    id: Date.now().toString(),
    tema,
    horas,
    fecha, // formato YYYY-MM-DD
    creadaEn: Date.now(),
  });

  guardarSesiones();
  dibujarTodo();
  formulario.reset();
  campoFecha.value = obtenerHoyISO();
});

// Elimina una sesión individual (delegación de eventos)
listaSesiones.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-eliminar]");
  if (!boton) return;
  const id = boton.getAttribute("data-eliminar");
  sesiones = sesiones.filter((sesion) => sesion.id !== id);
  guardarSesiones();
  dibujarTodo();
});

// Borra todo el historial con confirmación
botonBorrarTodo.addEventListener("click", () => {
  if (sesiones.length === 0) return;
  if (!confirm("¿Seguro que quieres borrar todas las sesiones?")) return;
  sesiones = [];
  guardarSesiones();
  dibujarTodo();
});

// Navegación de meses del calendario
botonMesAnterior.addEventListener("click", () => cambiarMes(-1));
botonMesSiguiente.addEventListener("click", () => cambiarMes(1));

// ---- Almacenamiento ----
function cargarSesiones() {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACEN);
    const datos = texto ? JSON.parse(texto) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarSesiones() {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesiones));
}

// ---- Racha ----
// Regla: un día cuenta si tiene al menos una sesión.
// La racha son los días consecutivos hasta hoy (o ayer si hoy aún está vacío).
// Si falta un día intermedio, la racha se pierde y vuelve a 0.
function calcularRacha(fechasUnicasOrdenadas, hoyISO) {
  if (fechasUnicasOrdenadas.length === 0) return 0;

  const fechas = new Set(fechasUnicasOrdenadas);
  let racha = 0;
  const cursor = parsearFechaLocal(hoyISO);

  // Si hoy no tiene sesión, la racha sigue viva solo si ayer sí tiene.
  if (!fechas.has(hoyISO)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!fechas.has(formatearISO(cursor))) return 0;
  }

  while (fechas.has(formatearISO(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

// Mejor racha: secuencia consecutiva más larga, en cualquier momento.
// Se recalcula desde los datos (baja si se borran sesiones).
// Ignora fechas futuras y cuenta días duplicados como uno solo.
function calcularMejorRacha(fechasUnicas, hoyISO) {
  const dias = [...new Set(fechasUnicas)].filter((f) => f <= hoyISO).sort();
  if (dias.length === 0) return 0;

  let mejor = 1;
  let actual = 1;
  for (let i = 1; i < dias.length; i++) {
    const anterior = parsearFechaLocal(dias[i - 1]);
    anterior.setDate(anterior.getDate() + 1);
    if (formatearISO(anterior) === dias[i]) {
      actual += 1;
      if (actual > mejor) mejor = actual;
    } else {
      actual = 1;
    }
  }
  return mejor;
}

function obtenerDiasUnicos() {
  const dias = new Set(sesiones.map((s) => s.fecha));
  return [...dias].sort().reverse(); // de más reciente a más antiguo
}

// Minutos estudiados de la semana actual (de lunes a domingo, en local).
// No cuenta fechas futuras, igual que la racha.
function calcularMinutosSemana() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  // getDay(): 1 = lunes ... 6 = sábado, 0 = domingo.
  const diaSemana = inicio.getDay();
  const desplazamiento = diaSemana === 0 ? -6 : 1 - diaSemana;
  inicio.setDate(inicio.getDate() + desplazamiento);

  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);

  // Tope: hoy inclusive; cualquier fecha posterior no suma.
  const tope = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return sesiones.reduce((acum, sesion) => {
    const fecha = parsearFechaLocal(sesion.fecha);
    const dentro = fecha >= inicio && fecha < fin && fecha <= tope;
    return dentro ? acum + Number(sesion.horas || 0) * 60 : acum;
  }, 0);
}

// Muestra minutos como "X h Y min"; menos de una hora, solo "Y min".
function formatearMinutos(minutos) {
  const total = Math.round(minutos);
  if (total < 60) return `${total} min`;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

// ---- Calendario ----
function cambiarMes(delta) {
  let mes = mesVisible.mes + delta;
  let anio = mesVisible.anio;
  if (mes < 0) { mes = 11; anio -= 1; }
  if (mes > 11) { mes = 0; anio += 1; }
  mesVisible = { anio, mes };
  dibujarCalendario();
}

// Rejilla del mes visible (lunes primero). Marca 🔥 y fondo naranja en cada
// día con al menos una sesión; nunca marca fechas futuras (regla de AGENTS.md).
function dibujarCalendario() {
  const hoyISO = obtenerHoyISO();
  const diasConSesion = new Set(sesiones.map((s) => s.fecha));

  const primerDia = new Date(mesVisible.anio, mesVisible.mes, 1);
  const diasDelMes = new Date(mesVisible.anio, mesVisible.mes + 1, 0).getDate();
  const huecoInicial = (primerDia.getDay() + 6) % 7; // lunes = 0

  tituloMes.textContent = capitalizar(
    primerDia.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  );

  const diasEstudiados = contarDiasEstudiadosMes(mesVisible.anio, mesVisible.mes);
  resumenMes.textContent =
    diasEstudiados === 1 ? "1 día estudiado" : `${diasEstudiados} días estudiados`;

  // No se navega más allá del mes actual.
  const ahora = new Date();
  botonMesSiguiente.disabled =
    mesVisible.anio === ahora.getFullYear() && mesVisible.mes === ahora.getMonth();

  // Borra solo las celdas; conserva la cabecera de días de la semana.
  calendario.querySelectorAll(".dia").forEach((celda) => celda.remove());

  for (let i = 0; i < huecoInicial; i++) {
    const hueco = document.createElement("span");
    hueco.className = "dia dia-vacio";
    calendario.append(hueco);
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fechaISO = formatearISO(new Date(mesVisible.anio, mesVisible.mes, dia));
    const esFutura = fechaISO > hoyISO;
    const tieneSesion = diasConSesion.has(fechaISO) && !esFutura;

    const celda = document.createElement("span");
    celda.className = "dia";
    if (tieneSesion) celda.classList.add("dia-con-sesion");
    if (fechaISO === hoyISO) celda.classList.add("dia-hoy");
    if (esFutura) celda.classList.add("dia-futuro");

    const numero = document.createElement("span");
    numero.className = "numero-dia";
    numero.textContent = dia;
    celda.append(numero);

    if (tieneSesion) {
      const fuego = document.createElement("span");
      fuego.className = "marca-fuego";
      fuego.textContent = "🔥";
      fuego.setAttribute("aria-hidden", "true");
      celda.append(fuego);
    }

    calendario.append(celda);
  }
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Días distintos con sesión en el mes dado (varias sesiones un mismo día = 1).
// Compara solo texto "AAAA-MM-DD": sin new Date, sin riesgo de UTC.
// Las fechas futuras no cuentan (regla de AGENTS.md).
function contarDiasEstudiadosMes(anio, mes) {
  const claveMes = `${anio}-${String(mes + 1).padStart(2, "0")}`;
  const hoyISO = obtenerHoyISO();
  const diasUnicos = new Set(sesiones.map((s) => s.fecha));
  let cuenta = 0;
  for (const fecha of diasUnicos) {
    if (fecha.startsWith(claveMes) && fecha <= hoyISO) cuenta += 1;
  }
  return cuenta;
}

// ---- Dibujo ----
function dibujarTodo() {
  const diasUnicos = obtenerDiasUnicos();
  const hoy = obtenerHoyISO();
  const racha = calcularRacha(diasUnicos, hoy);
  const mejor = calcularMejorRacha(diasUnicos, hoy);

  contadorRacha.textContent = racha;
  mejorRacha.textContent = mejor;
  mensajeRacha.textContent = textoRacha(racha, diasUnicos.includes(hoy));

  const horasTotales = sesiones.reduce((acum, s) => acum + Number(s.horas || 0), 0);
  totalSesiones.textContent = sesiones.length;
  totalHoras.textContent = `${redondear(horasTotales)} h`;
  totalDias.textContent = diasUnicos.length;
  minutosSemana.textContent = formatearMinutos(calcularMinutosSemana());

  dibujarLista();
  dibujarCalendario();
}

function dibujarLista() {
  listaSesiones.innerHTML = "";
  const ordenadas = [...sesiones].sort((a, b) => {
    if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
    if (a.creadaEn === b.creadaEn) return 0;
    return a.creadaEn > b.creadaEn ? -1 : 1;
  });

  listaVacia.hidden = ordenadas.length > 0;

  for (const sesion of ordenadas) {
    const elemento = document.createElement("li");

    const info = document.createElement("div");
    const titulo = document.createElement("p");
    titulo.className = "tema";
    titulo.textContent = sesion.tema;

    const detalle = document.createElement("p");
    detalle.className = "detalle";
    detalle.textContent = `${formatearFechaBonita(sesion.fecha)} · ${redondear(Number(sesion.horas))} h`;

    info.append(titulo, detalle);

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-eliminar";
    boton.textContent = "Eliminar";
    boton.setAttribute("data-eliminar", sesion.id);

    elemento.append(info, boton);
    listaSesiones.append(elemento);
  }
}

function textoRacha(racha, estudioHoy) {
  if (racha === 0) return "Racha perdida. ¡Estudia hoy para empezar otra!";
  if (!estudioHoy) return `Llevas ${racha} día(s). ¡Estudia hoy para no perderla!`;
  if (racha === 1) return "¡Buen comienzo! Vuelve mañana.";
  if (racha < 7) return "¡Vas muy bien, sigue así!";
  return "🔥 ¡Imparable! Más de una semana seguida.";
}

// ---- Utilidades ----
function obtenerHoyISO() {
  return formatearISO(new Date());
}

// Construye fecha local desde "AAAA-MM-DD" sin pasar por UTC.
function parsearFechaLocal(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function formatearISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaBonita(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function redondear(numero) {
  return Math.round(numero * 100) / 100;
}

function mostrarError(mensaje) {
  errorFormulario.textContent = mensaje;
  errorFormulario.hidden = false;
}

function ocultarError() {
  errorFormulario.hidden = true;
}
