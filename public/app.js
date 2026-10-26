// Renders the portal from /api/content (served from erp.ai by server.mjs).

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
// Links to this site are stored absolute in erp.ai; render them as same-site paths.
const SITE = 'https://india-evisa.build.host';
const internal = (url) => String(url || '').startsWith(SITE) || String(url || '').startsWith('/');
const ext = (url) => (internal(url)
  ? `href="${esc(String(url).replace(SITE, '') || '/')}"`
  : `href="${esc(url)}" rel="noopener"`);

const ICONS = {
  'file-plus': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  'file-clock': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M14 3v5h5"/><circle cx="17" cy="17" r="4"/><path d="M17 15.5V17l1 1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  Airport: '<path d="M2 16h20M6 16l2-7 4 3 4-6 2 10"/>',
  Seaport: '<circle cx="12" cy="5" r="2"/><path d="M12 7v13M5 13a7 7 0 0 0 14 0M8 11h8"/>',
  'Land port': '<path d="M4 20 9 4M20 20 15 4M12 6v2M12 12v2M12 18v2"/>',
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.file}</svg>`;
const chev = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';

function renderTasks(services) {
  const tasks = services.filter((s) => s.kind === 'Task');
  $('#task-list').innerHTML = tasks.map((s) => `
    <li><a ${ext(s.link)}>
      <span class="task-ico">${icon(s.icon)}</span>
      <span><span class="task-name">${esc(s.name)}${internal(s.link) ? '' : ' <span class="ext" aria-label="opens the official portal">↗</span>'}</span><br><span class="task-desc">${esc(s.description)}</span></span>
      ${chev}
    </a></li>`).join('');

  const primary = services.filter((s) => s.kind === 'Primary');
  if (primary.length) {
    $('#primary-actions').innerHTML = primary.map((s, i) => `
      <a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'} btn-lg" ${ext(s.link)}>${esc(s.name)}${i === 0 ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' : ''}</a>`).join('');
  }
}

function renderNotices(notices) {
  $('#notice-grid').innerHTML = notices.map((n) => `
    <article class="notice">
      <span class="notice-tag">${esc(n.tag)}</span>
      <h3>${esc(n.name)}</h3>
      <p>${esc(n.body)}</p>
      ${n.link ? `<a ${ext(n.link)}>${esc(n.linkLabel || 'Learn more')} <span aria-hidden="true">→</span></a>` : ''}
    </article>`).join('');
}

function renderVisas(visas) {
  const purposes = ['All', ...new Set(visas.map((v) => v.purpose).filter(Boolean))];
  let active = 'All';
  const chips = $('#purpose-chips');
  const grid = $('#visa-grid');

  const draw = () => {
    chips.innerHTML = purposes.map((p) => {
      const n = p === 'All' ? visas.length : visas.filter((v) => v.purpose === p).length;
      return `<button type="button" class="chip" role="tab" aria-selected="${p === active}" data-purpose="${esc(p)}">${esc(p)} <span class="count">${n}</span></button>`;
    }).join('');
    const shown = visas.filter((v) => active === 'All' || v.purpose === active);
    grid.innerHTML = shown.map((v) => `
      <button type="button" class="visa-card" data-id="${esc(v.id)}" aria-haspopup="dialog">
        <span class="visa-top"><span class="purpose">${esc(v.purpose)}</span><span class="code">${esc(v.code)}</span></span>
        <h3>${esc(v.name)}</h3>
        <p>${esc(v.summary)}</p>
        <dl class="visa-meta">
          ${v.validity ? `<div><dt>Valid</dt><dd>${esc(shorten(v.validity))}</dd></div>` : ''}
          ${v.entries ? `<div><dt>Entries</dt><dd>${esc(v.entries)}</dd></div>` : ''}
        </dl>
        <span class="visa-more">Details and documents →</span>
      </button>`).join('');
  };

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-purpose]');
    if (!b) return;
    active = b.dataset.purpose;
    draw();
  });
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.visa-card');
    if (card) openVisa(visas.find((v) => v.id === card.dataset.id));
  });
  draw();
}

const shorten = (s) => (s.length > 34 ? 'See details' : s);
const lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean);

function openVisa(v) {
  if (!v) return;
  const dlg = $('#visa-dialog');
  $('#visa-dialog-body').innerHTML = `
    <span class="visa-top"><span class="purpose">${esc(v.purpose)}</span><span class="code">${esc(v.code)}</span></span>
    <h2 id="visa-dialog-title">${esc(v.name)}</h2>
    <p class="summary">${esc(v.summary)}</p>
    <dl class="facts">
      <div><dt>Validity</dt><dd>${esc(v.validity || '—')}</dd></div>
      <div><dt>Entries</dt><dd>${esc(v.entries || '—')}</dd></div>
      <div><dt>Stay</dt><dd>${esc(v.stay || 'Within validity')}</dd></div>
    </dl>
    ${lines(v.subPurposes).length ? `<section class="dlg-section"><h3>Covers</h3><ul>${lines(v.subPurposes).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>` : ''}
    ${v.documents ? `<section class="dlg-section"><h3>Documents</h3><p>${esc(v.documents)}</p></section>` : ''}
    ${v.notes ? `<section class="dlg-section"><h3>Good to know</h3><p>${esc(v.notes)}</p></section>` : ''}
    <div class="dlg-actions">
      <a class="btn btn-primary" href="/apply?type=${encodeURIComponent(v.name)}">Start an application</a>
      <a class="btn btn-ghost" href="https://indianvisaonline.gov.in/evisa/tvoa.html" rel="noopener">Check current terms</a>
    </div>`;
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

function renderFeeLinks(links) {
  $('#fee-links').innerHTML = links
    .filter((l) => l.group === 'Documents' && /fee/i.test(l.name))
    .map((l) => `<a ${ext(l.url)}>${esc(l.name)}</a>`).join('');
  $('#gov-links').innerHTML = links
    .filter((l) => l.group === 'Government')
    .map((l) => `<li><a ${ext(l.url)}>${esc(l.name)}</a></li>`).join('');
}

function renderChecklist(items) {
  const saved = new Set(store.get('checklist', []));
  const list = $('#checklist');
  list.innerHTML = items.map((c) => `
    <li><label class="check">
      <input type="checkbox" value="${esc(c.name)}" ${saved.has(c.name) ? 'checked' : ''}>
      <span class="box">${check}</span>
      <span><strong>${esc(c.name)}</strong><span class="detail">${esc(c.detail)}</span></span>
    </label></li>`).join('');

  const update = () => {
    const done = [...list.querySelectorAll('input:checked')].map((i) => i.value);
    store.set('checklist', done);
    $('#progress-fill').style.width = `${items.length ? (done.length / items.length) * 100 : 0}%`;
    $('#progress-text').textContent = done.length === items.length && items.length
      ? 'All set. You are ready to apply.'
      : `${done.length} of ${items.length} ready`;
  };
  list.addEventListener('change', update);
  update();
}

function renderPorts(ports) {
  const types = ['Airport', 'Seaport', 'Land port'].filter((t) => ports.some((p) => p.portType === t));
  let active = types[0];
  let q = '';
  const tabs = $('#port-tabs');
  const grid = $('#port-grid');
  const label = { Airport: 'Airports', Seaport: 'Seaports', 'Land port': 'Land ports' };

  tabs.innerHTML = types.map((t) => `<button type="button" role="tab" data-type="${esc(t)}">${label[t]} <span class="count">${ports.filter((p) => p.portType === t).length}</span></button>`).join('');

  const highlight = (name) => {
    if (!q) return esc(name);
    const i = name.toLowerCase().indexOf(q);
    return i < 0 ? esc(name) : `${esc(name.slice(0, i))}<mark>${esc(name.slice(i, i + q.length))}</mark>${esc(name.slice(i + q.length))}`;
  };

  const draw = () => {
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.type === active)));
    const shown = ports
      .filter((p) => (q ? true : p.portType === active))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
    grid.innerHTML = shown.length
      ? shown.map((p) => `<li title="${esc(p.portType)}">${icon(p.portType)}<span>${highlight(p.name)}</span></li>`).join('')
      : `<li class="empty">No entry port matches “${esc(q)}”.</li>`;
    $('#port-count').textContent = q
      ? `${shown.length} match${shown.length === 1 ? '' : 'es'} across all port types. Lists on the official portal differ in places; confirm your port there before travel.`
      : `${shown.length} ${label[active].toLowerCase()}. Lists on the official portal differ in places; confirm your port there before travel.`;
  };

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    active = b.dataset.type;
    q = '';
    $('#port-search').value = '';
    draw();
  });
  $('#port-search').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
  draw();
}

function renderHelp(desks) {
  $('#help-grid').innerHTML = desks.map((d, i) => `
    <article class="help-card ${i === 0 && d.kind === 'e-Visa' ? 'primary' : ''}">
      <span class="help-kind">${d.kind === 'e-Visa' ? 'Application help' : 'Payment help'}</span>
      <h3>${esc(d.name)}</h3>
      <div class="help-contact">
        ${d.phone ? `<a href="tel:${esc(d.phone.replace(/[^+\d]/g, ''))}">${esc(d.phone)}</a>` : ''}
        ${d.email ? `<a class="mail" href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ''}
      </div>
      ${d.hours ? `<span class="help-hours">${esc(d.hours)}</span>` : ''}
      ${d.note ? `<p class="help-note">${esc(d.note)}</p>` : ''}
    </article>`).join('');
}

function renderFaqs(faqs) {
  const topics = ['All', ...new Set(faqs.map((f) => f.topic).filter(Boolean))];
  let active = 'All';
  let q = '';
  const side = $('#faq-topics');
  const list = $('#faq-list');

  const draw = () => {
    side.innerHTML = topics.map((t) => {
      const n = t === 'All' ? faqs.length : faqs.filter((f) => f.topic === t).length;
      return `<button type="button" class="chip" aria-pressed="${t === active}" data-topic="${esc(t)}">${esc(t)} <span class="count">${n}</span></button>`;
    }).join('');
    const shown = faqs
      .filter((f) => active === 'All' || f.topic === active)
      .filter((f) => !q || `${f.name} ${f.answer}`.toLowerCase().includes(q));
    list.innerHTML = shown.length
      ? shown.map((f) => `<details><summary><span>${esc(f.name)}</span>${active === 'All' ? `<span class="topic">${esc(f.topic)}</span>` : ''}</summary><p class="answer">${esc(f.answer)}</p></details>`).join('')
      : `<p class="faq-empty">No questions match “${esc(q)}”. Try the helpdesk above.</p>`;
  };

  side.addEventListener('click', (e) => {
    const b = e.target.closest('[data-topic]');
    if (!b) return;
    active = b.dataset.topic;
    draw();
  });
  $('#faq-search').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
  draw();
}

function renderSource(meta) {
  const when = meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;
  $('#source-note').innerHTML = meta.source === 'erp.ai'
    ? `<span class="source-dot"></span>Content is managed in an ERP.ai app and served by build.host. Last synced ${esc(when)}.`
    : `<span class="source-dot off"></span>Showing the bundled content snapshot (${esc(meta.reason || 'ERP.ai unavailable')}).`;
}

function setupChrome() {
  const root = document.documentElement;
  const sizeBtns = document.querySelectorAll('[data-size]');
  const markSize = () => sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String((root.dataset.text || 'md') === b.dataset.size)));
  sizeBtns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.size === 'md') delete root.dataset.text; else root.dataset.text = b.dataset.size;
    try { localStorage.setItem('textSize', b.dataset.size === 'md' ? '' : b.dataset.size); } catch {}
    markSize();
  }));
  markSize();

  $('#theme-toggle').addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  });

  const nav = $('#nav');
  const menu = $('#menu-toggle');
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
  });

  const dlg = $('#visa-dialog');
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}

async function main() {
  setupChrome();
  let data;
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    $('#source-note').textContent = 'Content could not be loaded. Use the official portal at indianvisaonline.gov.in.';
    return;
  }
  renderTasks(data.services);
  renderNotices(data.notices);
  renderVisas(data.visaTypes);
  renderFeeLinks(data.links);
  renderChecklist(data.checklist);
  renderPorts(data.ports);
  renderHelp(data.helpdesks);
  renderFaqs(data.faqs);
  renderSource(data.meta);
}

main();
