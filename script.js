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

// ===== Descargar el desprendible como imagen =====
const ANCHO_IMAGEN = 860;  // ancho fijo del desprendible en la imagen (px)
const ESCALA = 2;          // 2 = imagen en alta resolución

function nombreArchivo() {
  const nombre = $('nombre').value.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'empleado';
  const fecha = $('fechaPago').value || claveHoy;
  return `desprendible-${nombre}-${fecha}.png`;
}

function bajarCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('No se pudo crear la imagen')); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve();
    }, 'image/png');
  });
}

// Forma 1: con la librería html2canvas (se carga desde cdnjs)
async function capturaHtml2canvas(el) {
  return html2canvas(el, {
    scale: ESCALA,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    onclone: (doc) => doc.getElementById('desprendible').classList.add('captura'),
  });
}

// Forma 2 (respaldo): sin librerías, dibujando el desprendible dentro de un SVG
async function capturaNativa(el) {
  const css = [...document.styleSheets].map((s) => {
    try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch (e) { return ''; }
  }).join('\n');

  const clon = el.cloneNode(true);
  clon.classList.add('captura');

  // Medir el alto real con el ancho fijo
  const medida = document.createElement('div');
  medida.style.cssText = `position:absolute;left:-10000px;top:0;width:${ANCHO_IMAGEN}px;`;
  medida.appendChild(clon);
  document.body.appendChild(medida);
  const alto = Math.ceil(clon.getBoundingClientRect().height);
  document.body.removeChild(medida);

  const html = new XMLSerializer().serializeToString(clon);
  const estilos = css.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO_IMAGEN}" height="${alto}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1b2b40;">` +
    `<style>${estilos}</style>${html}</div></foreignObject></svg>`;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('No se pudo dibujar el desprendible'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO_IMAGEN * ESCALA;
  canvas.height = alto * ESCALA;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(ESCALA, ESCALA);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

async function descargarImagen() {
  const boton = $('descargar');
  const el = $('desprendible');
  boton.disabled = true;
  $('estado').textContent = 'Generando imagen...';
  try {
    let canvas;
    if (window.html2canvas) {
      try { canvas = await capturaHtml2canvas(el); } catch (e) { canvas = null; }
    }
    if (!canvas) canvas = await capturaNativa(el);
    await bajarCanvas(canvas);
    $('estado').textContent = 'Imagen descargada.';
  } catch (e) {
    $('estado').textContent = 'No se pudo generar la imagen: ' + e.message;
  } finally {
    boton.disabled = false;
  }
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
$('descargar').addEventListener('click', descargarImagen);

document.querySelectorAll('#formulario input, #formulario textarea').forEach((el) => {
  el.addEventListener('input', actualizar);
  el.addEventListener('change', actualizar);
});

// ===== Inicio =====
$('fechaPago').value = claveHoy;
pintarCalendario();
actualizar();
