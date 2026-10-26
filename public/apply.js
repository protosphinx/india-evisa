// Prototype application flow. Drafts and submissions go to /api/applications/*,
// which stores them in the erp.ai Applications table.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const local = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const FIELDS = ['visaType', 'nationality', 'email', 'phone', 'arrivalDate', 'portOfArrival', 'name', 'dateOfBirth', 'passportNumber', 'purposeDetails'];
const STEP_FIELDS = [
  ['visaType', 'nationality', 'email', 'arrivalDate', 'portOfArrival', 'phone'],
  ['name', 'dateOfBirth', 'passportNumber', 'purposeDetails'],
  [],
  [],
];
const LABELS = {
  visaType: 'Visa type', nationality: 'Nationality', email: 'Email', phone: 'Phone', arrivalDate: 'Arrival date',
  portOfArrival: 'Port of arrival', name: 'Full name', dateOfBirth: 'Date of birth', passportNumber: 'Passport number',
  purposeDetails: 'Purpose of visit',
};
const REQUIRED = new Set(['visaType', 'nationality', 'email', 'arrivalDate', 'portOfArrival', 'name', 'dateOfBirth', 'passportNumber']);

const state = { step: 0, reference: null, files: { photo: null, scan: null } };
const form = $('#apply-form');
const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

// --- api ----------------------------------------------------------------------

async function post(path, body) {
  const res = await fetch(`/api/applications/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { errors: data.errors || {} });
  return data;
}

// --- views --------------------------------------------------------------------

function show(view) {
  $$('.view').forEach((v) => { v.hidden = v.id !== `view-${view}`; });
  const nav = view === 'lookup' ? (lookupMode === 'status' ? 'status' : 'resume') : 'form';
  $$('[data-view-link]').forEach((a) => a.setAttribute('aria-current', a.dataset.viewLink === nav ? 'page' : 'false'));
  window.scrollTo({ top: 0 });
}

let lookupMode = 'resume';
function openLookup(mode) {
  lookupMode = mode;
  $('#status-card').hidden = true;
  $('#lookup-form').hidden = false;
  $('#lookup-error').hidden = true;
  $('#lookup-eyebrow').textContent = mode === 'status' ? 'Check status' : 'Continue saved application';
  $('#lookup-title').textContent = mode === 'status' ? 'Check your application' : 'Find your saved application';
  $('#lookup-btn').textContent = mode === 'status' ? 'Check status' : 'Continue application';
  const saved = local.get('evisa-last');
  if (saved) {
    $('#lookup-form').reference.value ||= saved.reference || '';
    $('#lookup-form').email.value ||= saved.email || '';
  }
  show('lookup');
}

// --- form ---------------------------------------------------------------------

function values() {
  const out = {};
  for (const f of FIELDS) {
    if (f === 'visaType') out[f] = $('input[name="visaType"]:checked', form)?.value || '';
    else out[f] = form.elements[f]?.value || '';
  }
  return out;
}

function fill(v = {}) {
  for (const f of FIELDS) {
    if (v[f] === undefined) continue;
    if (f === 'visaType') {
      const r = $$('input[name="visaType"]', form).find((i) => i.value === v[f]);
      if (r) r.checked = true;
    } else if (form.elements[f]) {
      form.elements[f].value = v[f] || '';
    }
  }
}

function clearErrors() {
  $$('[data-err]', form).forEach((e) => { e.textContent = ''; });
  $$('.invalid', form).forEach((e) => e.classList.remove('invalid'));
  $('#form-error').hidden = true;
}

function showErrors(errors, message) {
  let first = null;
  for (const [k, msg] of Object.entries(errors || {})) {
    const slot = $(`[data-err="${k}"]`, form);
    if (slot) slot.textContent = msg;
    const input = form.elements[k];
    if (input && input.classList) { input.classList.add('invalid'); first ??= input; }
    const idx = STEP_FIELDS.findIndex((fs) => fs.includes(k));
    if (idx >= 0 && idx < state.step && first === input) goTo(idx);
  }
  if (message) { $('#form-error').textContent = message; $('#form-error').hidden = false; }
  first?.focus?.();
}

// Client-side checks mirror the server's rules so errors show before a round trip.
function check(step) {
  const v = values();
  const errors = {};
  for (const f of STEP_FIELDS[step]) {
    if (REQUIRED.has(f) && !v[f].trim()) errors[f] = 'Required';
  }
  if (step === 0) {
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = 'Enter a valid email address';
    if (v.arrivalDate && (v.arrivalDate < day(4) || v.arrivalDate > day(120))) errors.arrivalDate = 'Arrival must be 4 to 120 days from today';
    if (v.phone && !/^[+\d\s()-]*$/.test(v.phone)) errors.phone = 'Use digits, spaces and + only';
  }
  if (step === 1) {
    if (v.passportNumber && !/^[A-Z0-9]{6,12}$/i.test(v.passportNumber.replace(/\s/g, ''))) errors.passportNumber = 'Use 6 to 12 letters and digits';
    if (v.dateOfBirth && v.dateOfBirth >= day(0)) errors.dateOfBirth = 'Must be in the past';
  }
  if (step === 3 && !form.elements.consent.checked) errors.consent = 'Tick this box to submit';
  return errors;
}

function goTo(step) {
  state.step = step;
  $$('.step', form).forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
  $$('#stepper li').forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle('current', n === step);
    li.classList.toggle('done', n < step);
    li.setAttribute('aria-current', n === step ? 'step' : 'false');
  });
  $('#back-btn').style.visibility = step === 0 ? 'hidden' : 'visible';
  $('#next-btn').textContent = step === 3 ? 'Submit application' : 'Continue';
  if (step === 3) renderReview();
  clearErrors();
}

function renderReview() {
  const v = values();
  const fileLine = (f) => (f ? `${esc(f.name)} · ${f.ok ? 'meets the rules' : esc(f.msg)}` : 'Not added');
  $('#review').innerHTML = FIELDS.map((f) => `
    <div><dt>${LABELS[f]}</dt><dd>${v[f] ? esc(v[f]) : '<span class="muted">Not given</span>'}</dd></div>`).join('') + `
    <div><dt>Photo</dt><dd>${fileLine(state.files.photo)}</dd></div>
    <div><dt>Passport page</dt><dd>${fileLine(state.files.scan)}</dd></div>`;
}

function persistLocal() {
  local.set('evisa-draft', { reference: state.reference, values: values(), step: state.step });
}

function setDraftLine() {
  $('#draft-line').innerHTML = state.reference
    ? `Draft <strong>${esc(state.reference)}</strong>. Save at any step and come back later.`
    : 'Takes about 10 minutes. Save at any step and come back later.';
  $('#form-eyebrow').textContent = state.reference ? 'Saved application' : 'New application';
}

async function save() {
  clearErrors();
  const v = values();
  if (!v.email) return showErrors({ email: 'Add your email so you can find this draft again' }, state.step === 0 ? null : 'Add your email on step 1 to save a draft.');
  $('#save-btn').disabled = true;
  try {
    const r = await post('save', { reference: state.reference, values: v, website: form.website.value });
    state.reference = r.reference;
    local.set('evisa-last', { reference: r.reference, email: v.email });
    persistLocal();
    setDraftLine();
    $('#saved-ref').textContent = r.reference;
    show('saved');
  } catch (err) {
    showErrors(err.errors, err.message);
  } finally {
    $('#save-btn').disabled = false;
  }
}

async function submit() {
  const btn = $('#next-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  try {
    const v = values();
    const r = await post('submit', { reference: state.reference, values: v, consent: form.elements.consent.checked, website: form.website.value });
    local.set('evisa-last', { reference: r.reference, email: v.email });
    local.del('evisa-draft');
    $('#done-ref').textContent = r.reference;
    show('done');
  } catch (err) {
    showErrors(err.errors, err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit application';
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();
  const errors = check(state.step);
  if (Object.keys(errors).length) return showErrors(errors);
  if (state.step < 3) { goTo(state.step + 1); persistLocal(); return; }
  submit();
});
$('#back-btn').addEventListener('click', () => goTo(Math.max(0, state.step - 1)));
$('#save-btn').addEventListener('click', save);
$('#keep-editing').addEventListener('click', () => show('form'));
$('#stepper').addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (li && Number(li.dataset.step) < state.step) goTo(Number(li.dataset.step));
});
form.addEventListener('input', persistLocal);

$('#fill-sample').addEventListener('click', () => {
  const firstVisa = $('input[name="visaType"]', form)?.value || 'e-Tourist Visa';
  const port = $('#port-select option[value="Delhi"]') ? 'Delhi' : $('#port-select option:nth-child(2)')?.value || '';
  fill({
    visaType: firstVisa, nationality: 'United Kingdom', email: 'test.applicant@example.com', phone: '+44 7700 900123',
    arrivalDate: day(30), portOfArrival: port, name: 'Test Applicant', dateOfBirth: '1990-05-14',
    passportNumber: 'TEST12345', purposeDetails: 'Two weeks of sightseeing in Delhi, Agra and Jaipur.',
  });
  persistLocal();
  clearErrors();
});

// File checks: same limits as the official portal; nothing leaves the browser.
$$('.drop input[type="file"]').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files[0];
    const kind = input.dataset.kind;
    const status = $(`#${kind}-status`);
    if (!file) { state.files[kind] = null; status.textContent = 'No file chosen'; return; }
    const kb = file.size / 1024;
    let msg = '';
    if (kind === 'photo') {
      if (file.type !== 'image/jpeg') msg = 'Must be a JPEG';
      else if (kb < 10 || kb > 1024) msg = 'Must be 10 KB to 1 MB';
      const prev = $('#photo-preview');
      prev.style.backgroundImage = file.type.startsWith('image/') ? `url(${URL.createObjectURL(file)})` : '';
      prev.classList.toggle('has-image', file.type.startsWith('image/'));
    } else {
      if (file.type !== 'application/pdf') msg = 'Must be a PDF';
      else if (kb < 10 || kb > 300) msg = 'Must be 10 KB to 300 KB';
    }
    state.files[kind] = { name: file.name, ok: !msg, msg };
    status.textContent = msg ? `${file.name}: ${msg}` : `${file.name} · ${Math.round(kb)} KB · meets the rules`;
    status.className = `file-status ${msg ? 'bad' : 'good'}`;
  });
});

// --- lookup (continue + status) -------------------------------------------------

const STAGES = ['Submitted', 'Under review', 'Granted'];
function renderStatus(r) {
  const rejected = r.status === 'Rejected';
  const reached = rejected ? 1 : STAGES.indexOf(r.status);
  const when = r.submittedAt ? new Date(r.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
  const v = r.values || {};
  $('#status-card').innerHTML = `
    <p class="eyebrow">Application ${esc(r.reference)}</p>
    <h1>${esc(r.status)}</h1>
    <p class="muted">${esc(v.name || '')}${v.visaType ? ` · ${esc(v.visaType)}` : ''}${v.arrivalDate ? ` · arriving ${esc(v.arrivalDate)}` : ''}${v.portOfArrival ? ` at ${esc(v.portOfArrival)}` : ''}</p>
    <ol class="timeline">
      ${STAGES.map((s, i) => {
        const label = rejected && i === 2 ? 'Rejected' : s;
        const cls = i < reached || (i === reached && !rejected) ? 'done' : rejected && i === 2 ? 'bad' : '';
        return `<li class="${cls}"><span class="dot"></span><span>${label}${i === 0 && when ? `<small>${esc(when)}</small>` : ''}</span></li>`;
      }).join('')}
    </ol>
    ${r.officerNote ? `<div class="officer-note"><strong>Note from the officer</strong><p>${esc(r.officerNote)}</p></div>` : ''}
    <div class="result-actions">
      <button type="button" class="btn btn-ghost" id="status-again">Check another</button>
      <a class="btn btn-ghost" href="/">Back to home</a>
    </div>`;
  $('#lookup-form').hidden = true;
  $('#status-card').hidden = false;
  $('#status-again').addEventListener('click', () => openLookup('status'));
}

$('#lookup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const err = $('#lookup-error');
  err.hidden = true;
  const reference = f.reference.value.trim().toUpperCase();
  const email = f.email.value.trim();
  if (!reference || !email) { err.textContent = 'Enter both your reference and email.'; err.hidden = false; return; }
  $('#lookup-btn').disabled = true;
  try {
    const r = await post('lookup', { reference, email });
    local.set('evisa-last', { reference: r.reference, email });
    if (lookupMode === 'resume' && r.status === 'Draft') {
      state.reference = r.reference;
      form.reset();
      fill(r.values);
      setDraftLine();
      const firstGap = STEP_FIELDS.findIndex((fs) => fs.some((k) => REQUIRED.has(k) && !r.values[k]));
      goTo(firstGap < 0 ? 2 : firstGap);
      show('form');
    } else {
      renderStatus(r);
    }
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    $('#lookup-btn').disabled = false;
  }
});

// --- setup --------------------------------------------------------------------

function countries() {
  const codes = 'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT QA KR RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW';
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    $('#countries').innerHTML = codes.split(' ').map((c) => names.of(c)).sort().map((n) => `<option value="${esc(n)}">`).join('');
  } catch {}
}

async function loadContent() {
  let data = null;
  try { data = await (await fetch('/api/content')).json(); } catch {}
  const visas = data?.visaTypes ?? [];
  const wanted = new URLSearchParams(location.search).get('type');
  $('#visa-options').innerHTML = visas.map((v) => `
    <label class="visa-option">
      <input type="radio" name="visaType" value="${esc(v.name)}" ${wanted && (wanted === v.name || wanted === v.code) ? 'checked' : ''}>
      <span><strong>${esc(v.name)}</strong><small>${esc(v.summary)}</small></span>
    </label>`).join('');
  const groups = { Airport: [], Seaport: [], 'Land port': [] };
  for (const p of data?.ports ?? []) (groups[p.portType] ??= []).push(p.name);
  $('#port-select').innerHTML = '<option value="">Choose a port</option>' + Object.entries(groups)
    .filter(([, list]) => list.length)
    .map(([type, list]) => `<optgroup label="${esc(type)}s">${[...new Set(list)].sort().map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}</optgroup>`)
    .join('');
}

function setupTheme() {
  const root = document.documentElement;
  $('#theme-toggle').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  });
}

async function main() {
  setupTheme();
  countries();
  const arrival = form.elements.arrivalDate;
  arrival.min = day(4);
  arrival.max = day(120);
  form.elements.dateOfBirth.max = day(-1);
  await loadContent();

  const params = new URLSearchParams(location.search);
  if (params.has('status')) return openLookup('status');
  if (params.has('resume')) return openLookup('resume');

  const draft = local.get('evisa-draft');
  if (draft?.values) {
    state.reference = draft.reference || null;
    fill(draft.values);
    goTo(Math.min(draft.step || 0, 3));
  } else {
    goTo(0);
  }
  setDraftLine();
  show('form');
}

main();
