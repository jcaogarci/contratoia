/* ============================================================
   ContratoIA — Lógica de aplicación
   ============================================================ */

/* ---------- Definición de tipos de contrato ---------- */
const CONTRACT_TYPES = {
  arrendamiento: {
    icon: '🏠',
    name: 'Arrendamiento de vivienda',
    desc: 'Alquiler de un inmueble entre arrendador y arrendatario.',
    roles: ['Arrendador (propietario)', 'Arrendatario (inquilino)'],
    fields: [
      { key: 'direccion', label: 'Dirección del inmueble', type: 'text', placeholder: 'Calle, número, piso, localidad', required: true },
      { key: 'renta', label: 'Renta mensual (€)', type: 'number', placeholder: '850', required: true },
      { key: 'fianza', label: 'Fianza (€)', type: 'number', placeholder: '850', required: false },
      { key: 'duracion', label: 'Duración', type: 'text', placeholder: 'p. ej. 1 año prorrogable', required: true },
      { key: 'inicio', label: 'Fecha de inicio', type: 'date', required: true },
    ],
  },
  servicios: {
    icon: '🤝',
    name: 'Prestación de servicios',
    desc: 'Servicios profesionales entre un prestador y un cliente.',
    roles: ['Prestador del servicio', 'Cliente'],
    fields: [
      { key: 'servicio', label: 'Descripción del servicio', type: 'textarea', placeholder: '¿Qué servicio se presta? Sé concreto.', required: true },
      { key: 'precio', label: 'Precio (€)', type: 'number', placeholder: '1200', required: true },
      { key: 'pago', label: 'Forma de pago', type: 'text', placeholder: 'p. ej. 50% al inicio, 50% a la entrega', required: true },
      { key: 'plazo', label: 'Plazo de ejecución', type: 'text', placeholder: 'p. ej. 30 días', required: false },
    ],
  },
  confidencialidad: {
    icon: '🔒',
    name: 'Confidencialidad (NDA)',
    desc: 'Acuerdo de no divulgación de información sensible.',
    roles: ['Parte que revela la información', 'Parte que la recibe'],
    fields: [
      { key: 'objeto', label: 'Información a proteger', type: 'textarea', placeholder: '¿Qué información es confidencial?', required: true },
      { key: 'duracion', label: 'Duración de la confidencialidad', type: 'text', placeholder: 'p. ej. 3 años desde la firma', required: true },
      { key: 'finalidad', label: 'Finalidad', type: 'text', placeholder: 'p. ej. evaluación de una colaboración', required: false },
    ],
  },
  compraventa: {
    icon: '📦',
    name: 'Compraventa',
    desc: 'Venta de un bien entre vendedor y comprador.',
    roles: ['Vendedor', 'Comprador'],
    fields: [
      { key: 'bien', label: 'Bien objeto de venta', type: 'textarea', placeholder: 'Describe el bien (vehículo, mobiliario, etc.)', required: true },
      { key: 'precio', label: 'Precio (€)', type: 'number', placeholder: '4500', required: true },
      { key: 'entrega', label: 'Forma y plazo de entrega', type: 'text', placeholder: 'p. ej. entrega inmediata en mano', required: true },
      { key: 'estado', label: 'Estado del bien', type: 'text', placeholder: 'p. ej. usado, buen estado', required: false },
    ],
  },
  colaboracion: {
    icon: '🧩',
    name: 'Colaboración',
    desc: 'Acuerdo de colaboración entre dos partes o socios.',
    roles: ['Primera parte', 'Segunda parte'],
    fields: [
      { key: 'objeto', label: 'Objeto de la colaboración', type: 'textarea', placeholder: '¿En qué consiste la colaboración?', required: true },
      { key: 'aportaciones', label: 'Aportaciones de cada parte', type: 'textarea', placeholder: '¿Qué aporta cada uno?', required: true },
      { key: 'reparto', label: 'Reparto de beneficios', type: 'text', placeholder: 'p. ej. 50% / 50%', required: false },
      { key: 'duracion', label: 'Duración', type: 'text', placeholder: 'p. ej. 12 meses', required: false },
    ],
  },
  obra: {
    icon: '🏗️',
    name: 'Contrato de obra',
    desc: 'Ejecución de obra entre contratista y promotor.',
    roles: ['Contratista', 'Promotor / Cliente'],
    fields: [
      { key: 'obra', label: 'Descripción de la obra', type: 'textarea', placeholder: '¿Qué obra se ejecuta y dónde?', required: true },
      { key: 'presupuesto', label: 'Presupuesto (€)', type: 'number', placeholder: '15000', required: true },
      { key: 'plazo', label: 'Plazo de ejecución', type: 'text', placeholder: 'p. ej. 90 días', required: true },
      { key: 'pago', label: 'Forma de pago', type: 'text', placeholder: 'p. ej. por certificaciones mensuales', required: false },
    ],
  },
};

/* ---------- Estado ---------- */
const state = {
  step: 1,
  typeKey: null,
  freeText: '',
  partyA: { nombre: '', dni: '', domicilio: '' },
  partyB: { nombre: '', dni: '', domicilio: '' },
  details: {},
  contractText: '',
  paid: false,
};

/* ---------- Helpers DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Free tier (localStorage) ---------- */
const FREE_KEY = 'contratoia_free_used';
const isFreeUsed = () => localStorage.getItem(FREE_KEY) === '1';
const markFreeUsed = () => localStorage.setItem(FREE_KEY, '1');

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderTypesGrid();
  wireGlobalButtons();
  handlePaymentReturn();
});

function renderTypesGrid() {
  const grid = $('#types-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(CONTRACT_TYPES).forEach(([key, t]) => {
    const card = el(`
      <button class="type-card" data-type="${key}">
        <span class="type-card__icon">${t.icon}</span>
        <span class="type-card__name">${t.name}</span>
        <span class="type-card__desc">${t.desc}</span>
      </button>`);
    card.addEventListener('click', () => openGenerator(key));
    grid.appendChild(card);
  });
}

function wireGlobalButtons() {
  $$('[data-open-generator]').forEach(b => b.addEventListener('click', () => openGenerator()));
  $$('[data-close-generator]').forEach(b => b.addEventListener('click', closeGenerator));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGenerator(); });
}

/* ============================================================
   GENERADOR — apertura / cierre / pasos
   ============================================================ */
function openGenerator(typeKey = null) {
  if (typeKey) state.typeKey = typeKey;
  state.step = typeKey ? 2 : 1;
  $('#generator').hidden = false;
  document.body.style.overflow = 'hidden';
  renderStep();
}

function closeGenerator() {
  $('#generator').hidden = true;
  document.body.style.overflow = '';
}

function setProgress() {
  $$('.progress__step').forEach(s => {
    const n = +s.dataset.step;
    s.classList.toggle('is-active', n === state.step);
    s.classList.toggle('is-done', n < state.step);
  });
}

function renderStep() {
  setProgress();
  const form = $('#gen-form');
  if (state.step === 1) form.innerHTML = '', renderStep1(form);
  else if (state.step === 2) renderStep2(form);
  else if (state.step === 3) renderStep3(form);
  else if (state.step === 4) renderStep4(form);
  updatePreview();
}

/* ----- Paso 1: tipo o texto libre ----- */
function renderStep1(form) {
  form.innerHTML = `
    <h2 class="gf__title">¿Qué necesitas?</h2>
    <p class="gf__sub">Elige un tipo de contrato o descríbelo con tus palabras.</p>
    <div class="type-pick" id="type-pick"></div>
    <div class="type-pick__sep">o descríbelo tú</div>
    <div class="field">
      <textarea id="free-text" placeholder="Ej.: Necesito un contrato para alquilar una plaza de garaje a un vecino por 60 € al mes…">${esc(state.freeText)}</textarea>
    </div>
    <div class="gf__nav">
      <span></span>
      <button class="btn btn--primary" id="next1">Continuar</button>
    </div>`;

  const pick = $('#type-pick', form);
  Object.entries(CONTRACT_TYPES).forEach(([key, t]) => {
    const b = el(`<button class="type-pick__btn ${state.typeKey === key ? 'is-sel' : ''}" data-type="${key}">
      <span class="type-pick__ic">${t.icon}</span><span class="type-pick__name">${t.name}</span></button>`);
    b.addEventListener('click', () => {
      state.typeKey = key; state.freeText = '';
      $('#free-text', form).value = '';
      $$('.type-pick__btn', form).forEach(x => x.classList.remove('is-sel'));
      b.classList.add('is-sel');
      updatePreview();
    });
    pick.appendChild(b);
  });

  $('#free-text', form).addEventListener('input', e => {
    state.freeText = e.target.value;
    if (state.freeText.trim()) {
      state.typeKey = null;
      $$('.type-pick__btn', form).forEach(x => x.classList.remove('is-sel'));
    }
    updatePreview();
  });

  $('#next1', form).addEventListener('click', () => {
    if (!state.typeKey && !state.freeText.trim()) return toast('Elige un tipo o describe lo que necesitas');
    state.step = 2; renderStep();
  });
}

/* ----- Paso 2: partes ----- */
function renderStep2(form) {
  const roles = state.typeKey ? CONTRACT_TYPES[state.typeKey].roles : ['Primera parte', 'Segunda parte'];
  form.innerHTML = `
    <h2 class="gf__title">Datos de las partes</h2>
    <p class="gf__sub">Quién firma con quién.</p>
    ${partyBlock('A', roles[0], state.partyA)}
    ${partyBlock('B', roles[1], state.partyB)}
    <div class="gf__nav">
      <button class="btn btn--ghost" id="back2">Atrás</button>
      <button class="btn btn--primary" id="next2">Continuar</button>
    </div>`;

  ['A', 'B'].forEach(p => {
    ['nombre', 'dni', 'domicilio'].forEach(f => {
      $(`#${p}-${f}`, form).addEventListener('input', e => {
        state['party' + p][f] = e.target.value; updatePreview();
      });
    });
  });
  $('#back2', form).addEventListener('click', () => { state.step = 1; renderStep(); });
  $('#next2', form).addEventListener('click', () => {
    if (!state.partyA.nombre.trim() || !state.partyB.nombre.trim()) return toast('Indica el nombre de ambas partes');
    state.step = 3; renderStep();
  });
}

function partyBlock(p, role, data) {
  return `
    <div class="field"><label>${esc(role)} — Nombre completo</label>
      <input id="${p}-nombre" type="text" value="${esc(data.nombre)}" placeholder="Nombre y apellidos / razón social" /></div>
    <div class="field__row">
      <div class="field"><label>DNI / NIF</label>
        <input id="${p}-dni" type="text" value="${esc(data.dni)}" placeholder="00000000-A" /></div>
      <div class="field"><label>Domicilio</label>
        <input id="${p}-domicilio" type="text" value="${esc(data.domicilio)}" placeholder="Dirección" /></div>
    </div>`;
}

/* ----- Paso 3: detalles dinámicos ----- */
function renderStep3(form) {
  if (!state.typeKey) {
    // Modo texto libre: un único campo de contexto adicional
    form.innerHTML = `
      <h2 class="gf__title">Detalles del acuerdo</h2>
      <p class="gf__sub">Añade cualquier condición importante (importes, plazos, etc.).</p>
      <div class="field">
        <textarea id="d-libre" placeholder="Cuanto más concreto seas, mejor será el contrato.">${esc(state.details.libre || '')}</textarea>
      </div>
      <div class="gf__nav">
        <button class="btn btn--ghost" id="back3">Atrás</button>
        <button class="btn btn--primary" id="next3">Generar contrato</button>
      </div>`;
    $('#d-libre', form).addEventListener('input', e => { state.details.libre = e.target.value; updatePreview(); });
  } else {
    const t = CONTRACT_TYPES[state.typeKey];
    const fieldsHtml = t.fields.map(f => fieldHtml(f)).join('');
    form.innerHTML = `
      <h2 class="gf__title">Detalles del contrato</h2>
      <p class="gf__sub">Solo lo que un ${t.name.toLowerCase()} necesita.</p>
      ${fieldsHtml}
      <div class="gf__nav">
        <button class="btn btn--ghost" id="back3">Atrás</button>
        <button class="btn btn--primary" id="next3">Generar contrato</button>
      </div>`;
    t.fields.forEach(f => {
      $(`#d-${f.key}`, form).addEventListener('input', e => { state.details[f.key] = e.target.value; updatePreview(); });
    });
  }
  $('#back3', form).addEventListener('click', () => { state.step = 2; renderStep(); });
  $('#next3', form).addEventListener('click', validateAndGenerate);
}

function fieldHtml(f) {
  const val = esc(state.details[f.key] || '');
  let input;
  if (f.type === 'textarea') input = `<textarea id="d-${f.key}" placeholder="${esc(f.placeholder || '')}">${val}</textarea>`;
  else input = `<input id="d-${f.key}" type="${f.type}" value="${val}" placeholder="${esc(f.placeholder || '')}" />`;
  return `<div class="field"><label>${esc(f.label)}${f.required ? '' : ' <span style="color:#B9B3A4;font-weight:400">(opcional)</span>'}</label>${input}</div>`;
}

function validateAndGenerate() {
  if (state.typeKey) {
    const missing = CONTRACT_TYPES[state.typeKey].fields.filter(f => f.required && !(state.details[f.key] || '').trim());
    if (missing.length) return toast(`Falta: ${missing[0].label}`);
  } else if (!(state.details.libre || '').trim() && !state.freeText.trim()) {
    return toast('Añade algún detalle del acuerdo');
  }
  state.step = 4; renderStep();
}

/* ----- Paso 4: generar + resultado + paywall ----- */
async function renderStep4(form) {
  form.innerHTML = `
    <div class="loading">
      <div class="loading__spin"></div>
      <p>Redactando tu contrato…</p>
    </div>`;

  try {
    const text = await generateContract();
    state.contractText = text;
    showResult(form);
  } catch (err) {
    console.error(err);
    form.innerHTML = `
      <h2 class="gf__title">No se pudo generar</h2>
      <p class="gf__sub">Algo ha fallado al redactar el contrato. Inténtalo de nuevo.</p>
      <div class="gf__nav"><button class="btn btn--ghost" id="back4">Atrás</button>
      <button class="btn btn--primary" id="retry4">Reintentar</button></div>`;
    $('#back4', form).addEventListener('click', () => { state.step = 3; renderStep(); });
    $('#retry4', form).addEventListener('click', () => renderStep());
  }
}

function showResult(form) {
  const mustPay = isFreeUsed() && !state.paid;
  form.innerHTML = `
    <h2 class="gf__title">Tu contrato está listo</h2>
    <p class="gf__sub">Revísalo y descárgalo en PDF.</p>
    <div class="result__doc ${mustPay ? 'is-locked' : ''}" id="result-doc">${esc(state.contractText)}</div>
    <div id="action-zone"></div>`;

  const zone = $('#action-zone', form);
  if (mustPay) {
    zone.appendChild(el(`
      <div class="paywall">
        <h4>Desbloquea la descarga</h4>
        <p>Tu primer contrato ya lo usaste. Este cuesta 4,99 € — pago único, sin suscripción.</p>
        <button class="btn btn--primary btn--block" id="pay-btn">Pagar 4,99 € y descargar</button>
      </div>`));
    $('#pay-btn', zone).addEventListener('click', startPayment);
  } else {
    const note = isFreeUsed() ? '' : `<div class="banner banner--free">✓ Este es tu contrato gratuito. Los siguientes costarán 4,99 € cada uno.</div>`;
    zone.innerHTML = note;
    zone.appendChild(el(`<button class="btn btn--primary btn--block" id="dl-btn">Descargar PDF</button>`));
    $('#dl-btn', zone).addEventListener('click', () => {
      if (!isFreeUsed() && !state.paid) markFreeUsed();
      downloadPDF();
    });
  }
}

/* ============================================================
   GENERACIÓN (API)
   ============================================================ */
async function generateContract() {
  const payload = {
    typeKey: state.typeKey,
    typeName: state.typeKey ? CONTRACT_TYPES[state.typeKey].name : 'Contrato a medida',
    roles: state.typeKey ? CONTRACT_TYPES[state.typeKey].roles : ['Primera parte', 'Segunda parte'],
    freeText: state.freeText,
    partyA: state.partyA,
    partyB: state.partyB,
    details: state.details,
  };
  const r = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('API ' + r.status);
  const data = await r.json();
  if (!data.contract) throw new Error('Sin contrato en la respuesta');
  return data.contract;
}

/* ============================================================
   PAGO (Stripe)
   ============================================================ */
async function startPayment() {
  // Guardamos el contrato para recuperarlo al volver de Stripe
  sessionStorage.setItem('contratoia_pending', JSON.stringify({
    contractText: state.contractText,
    typeName: state.typeKey ? CONTRACT_TYPES[state.typeKey].name : 'Contrato a medida',
  }));
  try {
    const r = await fetch('/api/create-checkout', { method: 'POST' });
    const { url, error } = await r.json();
    if (error || !url) throw new Error(error || 'sin url');
    window.location.href = url;
  } catch (err) {
    console.error(err);
    toast('No se pudo iniciar el pago. Inténtalo de nuevo.');
  }
}

async function handlePaymentReturn() {
  const params = new URLSearchParams(location.search);
  if (params.get('paid') !== 'true' || !params.get('session_id')) return;

  try {
    const r = await fetch(`/api/verify-session?session_id=${encodeURIComponent(params.get('session_id'))}`);
    const { paid } = await r.json();
    if (paid) {
      const pending = JSON.parse(sessionStorage.getItem('contratoia_pending') || 'null');
      if (pending) {
        state.contractText = pending.contractText;
        state.paid = true;
        state.step = 4;
        $('#generator').hidden = false;
        document.body.style.overflow = 'hidden';
        setProgress();
        showResult($('#gen-form'));
        updatePreview();
        toast('Pago confirmado. Ya puedes descargar tu contrato.');
        sessionStorage.removeItem('contratoia_pending');
      }
    } else {
      toast('El pago no se completó.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    history.replaceState({}, '', location.pathname);
  }
}

/* ============================================================
   DESCARGA PDF
   ============================================================ */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20, maxW = 170, lineH = 6;
  let y = margin;

  const typeName = state.typeKey ? CONTRACT_TYPES[state.typeKey].name : 'Contrato';
  doc.setFont('times', 'bold'); doc.setFontSize(15);
  doc.text(typeName.toUpperCase(), 105, y, { align: 'center' }); y += 12;

  doc.setFont('times', 'normal'); doc.setFontSize(11);
  const lines = doc.splitTextToSize(state.contractText, maxW);
  lines.forEach(line => {
    if (y > 277) { doc.addPage(); y = margin; }
    doc.text(line, margin, y); y += lineH;
  });

  // Pie
  if (y > 270) { doc.addPage(); y = margin; }
  y += 6; doc.setFontSize(8); doc.setTextColor(150);
  doc.text('Documento generado con ContratoIA · contratoia.es', 105, 290, { align: 'center' });

  const safe = typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`contrato-${safe}.pdf`);
  toast('Contrato descargado ✓');
}

/* ============================================================
   VISTA PREVIA EN VIVO
   ============================================================ */
function updatePreview() {
  const typeName = state.typeKey ? CONTRACT_TYPES[state.typeKey].name
    : (state.freeText.trim() ? 'Contrato a medida' : 'Tu contrato');
  $('#prev-type').textContent = typeName;

  const seal = $('#prev-seal');
  if (state.step === 4 && state.contractText) { seal.textContent = 'Generado'; seal.classList.remove('seal--draft'); }
  else { seal.textContent = 'Borrador'; seal.classList.add('seal--draft'); }

  const body = $('#prev-body');
  const a = state.partyA, b = state.partyB;
  const roles = state.typeKey ? CONTRACT_TYPES[state.typeKey].roles : ['Primera parte', 'Segunda parte'];

  if (state.step === 4 && state.contractText) {
    // Mostrar extracto del contrato real
    const excerpt = state.contractText.split('\n').filter(l => l.trim()).slice(0, 14);
    body.innerHTML = excerpt.map(l => `<p class="ln">${esc(l)}</p>`).join('');
    return;
  }

  let html = '<p class="ln ln--title">Reunidos</p>';
  html += `<p class="ln">De una parte, <strong>${esc(a.nombre || '…')}</strong>${a.dni ? `, con DNI ${esc(a.dni)}` : ''} (${esc(roles[0])}).</p>`;
  html += `<p class="ln">De otra, <strong>${esc(b.nombre || '…')}</strong>${b.dni ? `, con DNI ${esc(b.dni)}` : ''} (${esc(roles[1])}).</p>`;
  html += '<p class="ln ln--title">Detalles</p>';

  const d = state.details;
  const detailKeys = Object.keys(d).filter(k => d[k] && String(d[k]).trim());
  if (detailKeys.length) {
    detailKeys.slice(0, 6).forEach(k => {
      const label = state.typeKey ? (CONTRACT_TYPES[state.typeKey].fields.find(f => f.key === k)?.label || k) : 'Detalle';
      html += `<p class="ln"><strong>${esc(label)}:</strong> ${esc(String(d[k]).slice(0, 80))}</p>`;
    });
  } else if (state.freeText.trim()) {
    html += `<p class="ln">${esc(state.freeText.slice(0, 160))}…</p>`;
  } else {
    html += '<p class="ln ln--muted">Los detalles aparecerán aquí a medida que los completes…</p>';
  }
  body.innerHTML = html;
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2800);
}
