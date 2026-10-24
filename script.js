// ===== Utilidades =====
const $ = (id) => document.getElementById(id);

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const SEMANA_CORTA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const fmtPesos = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const pesos = (n) => '$ ' + fmtPesos.format(n || 0);

const num = (id) => { const v = parseFloat($(id).value); return isNaN(v) ? 0 : v; };
const texto = (id) => $(id).value.trim() || '—';
const plural = (n, uno, varios) => `${fmtNum.format(n)} ${n === 1 ? uno : varios}`;

const clave = (a, m, d) => `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const claveAFecha = (k) => { const [a, m, d] = k.split('-'); return `${d}/${m}/${a}`; };
const primerDiaSemana = (a, m) => (new Date(a, m, 1).getDay() + 6) % 7; // lunes = 0
const diasEnMes = (a, m) => new Date(a, m + 1, 0).getDate();

// ===== Estado =====
const seleccion = new Set();
const hoy = new Date();
const claveHoy = clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
let verAnio = hoy.getFullYear();
let verMes = hoy.getMonth();

// ===== Calendario del formulario =====
function pintarCalendario() {
  $('mesTitulo').textContent = `${MESES[verMes]} ${verAnio}`;
  const grid = $('calGrid');
  grid.innerHTML = '';

  SEMANA.forEach((d) => {
    const s = document.createElement('span');
    s.className = 'cal-sem';
    s.textContent = d;
    grid.appendChild(s);
  });

  for (let i = 0; i < primerDiaSemana(verAnio, verMes); i++) {
    grid.appendChild(document.createElement('span'));
  }

  for (let d = 1; d <= diasEnMes(verAnio, verMes); d++) {
    const k = clave(verAnio, verMes, d);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cal-dia';
    b.textContent = d;
    if (seleccion.has(k)) b.classList.add('sel');
    if (k === claveHoy) b.classList.add('hoy');
    b.setAttribute('aria-pressed', seleccion.has(k));
    b.addEventListener('click', () => {
      if (seleccion.has(k)) seleccion.delete(k); else seleccion.add(k);
      pintarCalendario();
      actualizar();
    });
    grid.appendChild(b);
  }

  $('contadorDias').textContent = plural(seleccion.size, 'día marcado', 'días marcados');
}

// ===== Calendarios dentro del desprendible =====
function pintarMiniCalendarios() {
  const cont = $('vCalendario');
  cont.innerHTML = '';

  if (!seleccion.size) {
    cont.innerHTML = '<p class="vacio">Sin días marcados</p>';
    return;
  }

  const meses = [...new Set([...seleccion].map((k) => k.slice(0, 7)))].sort();

  meses.forEach((ym) => {
    const [a, m] = ym.split('-').map(Number);
    const mi = m - 1;
    let html = `<div class="mini-tit">${MESES[mi]} ${a}</div><div class="mini-grid">`;
    html += SEMANA_CORTA.map((d) => `<span class="mini-sem">${d}</span>`).join('');
    for (let i = 0; i < primerDiaSemana(a, mi); i++) html += '<span></span>';
    for (let d = 1; d <= diasEnMes(a, mi); d++) {
      const on = seleccion.has(clave(a, mi, d)) ? ' class="on"' : '';
      html += `<span${on}>${d}</span>`;
    }
    html += '</div>';

    const caja = document.createElement('div');
    caja.className = 'mini';
    caja.innerHTML = html;
    cont.appendChild(caja);
  });
}

// ===== Cálculos =====
const modo = () => document.querySelector('input[name="modo"]:checked').value;

function valorDiaActual() {
  if (modo() === 'calcular') {
    const dp = num('diasPactados');
    return dp > 0 ? num('salario') / dp : 0;
  }
  return num('valorDia');
}

function periodoTexto() {
  if (!seleccion.size) return '—';
  const orden = [...seleccion].sort();
  const ini = claveAFecha(orden[0]);
  const fin = claveAFecha(orden[orden.length - 1]);
  return ini === fin ? ini : `${ini} al ${fin}`;
}

function fechaPagoTexto() {
  const v = $('fechaPago').value;
  return v ? claveAFecha(v) : '—';
}

// ===== Actualizar todo el desprendible =====
function actualizar() {
  const m = modo();
  $('bloqueDirecto').hidden = m !== 'directo';
  $('bloqueCalcular').hidden = m !== 'calcular';

  const valorDia = valorDiaActual();
  const dias = seleccion.size;
  const horas = num('horasExtra');
  const valorHora = num('valorHoraExtra');

  const salarioDias = dias * valorDia;
  const totalHoras = horas * valorHora;
  const total = salarioDias + totalHoras;

  if (m === 'calcular') $('valorDiaCalc').textContent = `Valor del día: ${pesos(valorDia)}`;

  // Encabezado
  $('vFecha').textContent = fechaPagoTexto();
  $('vPeriodo').textContent = periodoTexto();
  $('vDias').textContent = plural(dias, 'día', 'días');
  $('vHoras').textContent = plural(horas, 'hora', 'horas');

  // Datos del empleado
  $('vNombre').textContent = texto('nombre');
  $('vCedula').textContent = texto('cedula');
  $('vCargo').textContent = texto('cargo');
  if (m === 'calcular') {
    $('vBaseEtq').textContent = `Salario pactado (${plural(num('diasPactados'), 'día', 'días')}):`;
    $('vBase').textContent = pesos(num('salario'));
  } else {
    $('vBaseEtq').textContent = 'Valor día:';
    $('vBase').textContent = pesos(valorDia);
  }

  // Devengados
  $('vSalEtq').textContent = `Salario por ${plural(dias, 'día', 'días')}`;
  $('vSal').textContent = pesos(salarioDias);
  $('vHxEtq').textContent = `Horas extras (${fmtNum.format(horas)})`;
  $('vHx').textContent = pesos(totalHoras);
  $('vTotal').textContent = pesos(total);
  $('vNeto').textContent = pesos(total);

  // Cálculos
  const filas = [];
  if (m === 'calcular') {
    const dp = fmtNum.format(num('diasPactados'));
    filas.push([`Salario pactado (${dp} días):`, pesos(num('salario'))]);
    filas.push([`Valor día (salario ÷ ${dp}):`, pesos(valorDia)]);
  } else {
    filas.push(['Valor día:', pesos(valorDia)]);
  }
  filas.push(['Valor hora extra:', pesos(valorHora)]);
  filas.push([`Horas extras (${fmtNum.format(horas)} × valor hora extra):`, pesos(totalHoras)]);
  filas.push([`Salario por ${dias} días (${dias} × valor día):`, pesos(salarioDias)]);

  const calc = $('vCalculos');
  calc.innerHTML = '';
  filas.forEach(([etq, val]) => agregarFila(calc, etq, val));
  agregarFila(calc, 'Total devengado:', pesos(total), 'tot');

  // Observaciones
  let obs = `El presente desprendible corresponde al pago por ${plural(dias, 'día laborado', 'días laborados')}`;
  obs += horas > 0 ? ` y ${plural(horas, 'hora extra', 'horas extras')}.` : '.';
  const extra = $('observaciones').value.trim();
  if (extra) obs += '\n\n' + extra;
  $('vObs').textContent = obs;

  pintarMiniCalendarios();
}

function agregarFila(dl, etiqueta, valor, clase) {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = etiqueta;
  dd.textContent = valor;
  if (clase) { dt.className = clase; dd.className = clase; }
  dl.append(dt, dd);
}

// ===== Eventos =====
$('mesAnt').addEventListener('click', () => {
  verMes--;
  if (verMes < 0) { verMes = 11; verAnio--; }
  pintarCalendario();
});
$('mesSig').addEventListener('click', () => {
  verMes++;
  if (verMes > 11) { verMes = 0; verAnio++; }
  pintarCalendario();
});
$('limpiarDias').addEventListener('click', () => {
  seleccion.clear();
  pintarCalendario();
  actualizar();
});
$('imprimir').addEventListener('click', () => window.print());

document.querySelectorAll('#formulario input, #formulario textarea').forEach((el) => {
  el.addEventListener('input', actualizar);
  el.addEventListener('change', actualizar);
});

// ===== Inicio =====
$('fechaPago').value = claveHoy;
pintarCalendario();
actualizar();
