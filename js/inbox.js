/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — inbox.js
   Vista Inbox: captura, filtrado, procesamiento
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetInbox = (function () {

  /* ─── State ─── */
  let currentTab    = 'pending';   // pending | processed | reference
  let currentFilter = 'all';       // all | task | note | idea | reference
  let container     = null;

  /* ─── Helpers ─── */
  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* ─── Capture ─── */
  function renderCapture() {
    return `
    <div class="ibx-page-capture">
      <textarea class="ibx-capture-input" id="ibx-input" placeholder="Captura algo… idea, tarea, nota…" rows="2"></textarea>
      <div class="ibx-capture-meta">
        <select class="ibx-type-sel" id="ibx-type">
          <option value="task">tarea</option>
          <option value="note">nota</option>
          <option value="idea">idea</option>
          <option value="reference">referencia</option>
        </select>
        <select class="ibx-prio-sel" id="ibx-prio">
          <option value="">— prioridad</option>
          <option value="alta">alta</option>
          <option value="media">media</option>
          <option value="baja">baja</option>
        </select>
        <select class="ibx-area-sel" id="ibx-area">
          <option value="">— área</option>
          <option value="estudio">estudio</option>
          <option value="creacion">creación</option>
          <option value="mundo">mundo</option>
          <option value="love">loveship</option>
          <option value="general">general</option>
        </select>
        <button class="ibx-capture-btn" id="ibx-save-btn">+ guardar</button>
      </div>
    </div>`;
  }

  /* ─── Status Tabs ─── */
  function renderTabs() {
    const tabs = [
      { id: 'pending',   label: 'Pendiente' },
      { id: 'processed', label: 'Procesado' },
      { id: 'reference', label: 'Referencia' },
    ];
    return `
    <div class="ibx-status-tabs">
      ${tabs.map(t => `
        <button class="ibx-stab${currentTab === t.id ? ' active' : ''}"
                data-stab="${t.id}">${escHtml(t.label)}</button>
      `).join('')}
    </div>`;
  }

  /* ─── Filter Bar ─── */
  function renderFilters() {
    const filters = [
      { id: 'all',       label: 'Todos' },
      { id: 'task',      label: 'Tareas' },
      { id: 'note',      label: 'Notas' },
      { id: 'idea',      label: 'Ideas' },
      { id: 'reference', label: 'Referencias' },
    ];
    return `
    <div class="ibx-filters-bar">
      ${filters.map(f => `
        <button class="ibx-fil${currentFilter === f.id ? ' active' : ''}"
                data-filter="${f.id}">${escHtml(f.label)}</button>
      `).join('')}
    </div>`;
  }

  /* ─── Item ─── */
  function renderItem(item) {
    const isDone = item.status !== 'pending';
    const prioBadge = item.priority
      ? `<span class="ibx-prio-badge ${escHtml(item.priority)}">${escHtml(item.priority)}</span>`
      : '';
    const areaBadge = item.area
      ? `<span class="ibx-area-badge">${escHtml(item.area)}</span>`
      : '';
    const typeBadge = `<span class="ibx-type-badge">${escHtml(item.type)}</span>`;

    return `
    <div class="ibx-item${isDone ? ' done' : ''}" data-id="${escHtml(item.id)}">
      <div class="ibx-item-top">
        <button class="ibx-item-check${isDone ? ' done' : ''}"
                data-check="${escHtml(item.id)}"
                title="Toggle estado">✓</button>
        <div class="ibx-item-body">
          <div class="ibx-item-text${isDone ? ' done' : ''}">${escHtml(item.text)}</div>
          <div class="ibx-item-tags">
            ${typeBadge}
            ${prioBadge}
            ${areaBadge}
            <span class="idate-badge">${formatDate(item.createdAt)}</span>
          </div>
        </div>
        <button class="ibx-item-toggle" data-expand="${escHtml(item.id)}" title="Expandir">⋯</button>
        <button class="ibx-item-del" data-del="${escHtml(item.id)}" title="Eliminar">×</button>
      </div>
      <div class="ibx-item-actions" id="ibx-act-${escHtml(item.id)}">
        <textarea class="ibx-note-area"
                  data-note="${escHtml(item.id)}"
                  placeholder="Añade una nota…">${escHtml(item.note || '')}</textarea>
        <div class="ibx-act-row">
          <button class="ibx-act-btn to-planner" data-planner="${escHtml(item.id)}">
            ◷ Planner
          </button>
          <button class="ibx-act-btn to-proyecto" data-proyecto="${escHtml(item.id)}">
            ◈ Proyecto
          </button>
          <button class="ibx-act-btn to-referencia" data-referencia="${escHtml(item.id)}">
            ⬡ Referencia
          </button>
          <button class="ibx-act-btn archivar" data-archivar="${escHtml(item.id)}">
            × Archivar
          </button>
        </div>
        <!-- Planner block picker (hidden until needed) -->
        <div class="ibx-planner-pick" id="ibx-pp-${escHtml(item.id)}" style="display:none; margin-top:8px;">
          <select class="ibx-dest-pick" data-pp-sel="${escHtml(item.id)}">
            <option value="morning">Mañana</option>
            <option value="afternoon">Tarde</option>
            <option value="night">Noche</option>
          </select>
          <button class="ibx-act-btn to-planner" data-pp-confirm="${escHtml(item.id)}"
                  style="margin-left:6px;">Confirmar</button>
        </div>
        <!-- Proyecto picker (hidden until needed) -->
        <div class="ibx-proyecto-pick" id="ibx-prpick-${escHtml(item.id)}" style="display:none; margin-top:8px;">
          <select class="ibx-dest-pick" data-prp-sel="${escHtml(item.id)}">
            <option value="">— elegir proyecto</option>
          </select>
          <button class="ibx-act-btn to-proyecto" data-prp-confirm="${escHtml(item.id)}"
                  style="margin-left:6px;">Asignar</button>
        </div>
      </div>
    </div>`;
  }

  /* ─── List ─── */
  function renderList() {
    const all   = window.AndinetStorage.inbox.get();
    let items   = all.filter(i => {
      if (currentTab === 'pending')   return i.status === 'pending';
      if (currentTab === 'processed') return i.status === 'processed';
      if (currentTab === 'reference') return i.status === 'reference';
      return true;
    });
    if (currentFilter !== 'all') {
      items = items.filter(i => i.type === currentFilter);
    }
    if (!items.length) {
      return `<div class="ibx-empty">
        <span class="ibx-empty-glyph">◌</span>
        Nada por aquí todavía.
      </div>`;
    }
    return items.map(renderItem).join('');
  }

  /* ─── Full Render ─── */
  function render() {
    if (!container) return;
    container.innerHTML =
      renderCapture() +
      renderTabs()    +
      renderFilters() +
      `<div id="ibx-list">${renderList()}</div>`;
    bindEvents();
  }

  /* ─── Refresh ─── */
  function refresh() {
    const list = container && container.querySelector('#ibx-list');
    if (list) {
      list.innerHTML = renderList();
      bindListEvents();
    }
  }

  /* ─── Bind Events ─── */
  function bindEvents() {
    if (!container) return;

    /* Capture save */
    const saveBtn = container.querySelector('#ibx-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleCapture);
    }
    const inp = container.querySelector('#ibx-input');
    if (inp) {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCapture();
      });
    }

    /* Status tabs */
    container.querySelectorAll('[data-stab]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.stab;
        render();
      });
    });

    /* Filters */
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
      });
    });

    bindListEvents();
  }

  function bindListEvents() {
    if (!container) return;

    /* Toggle check */
    container.querySelectorAll('[data-check]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.check;
        window.AndinetStorage.inbox.toggle(id);
        refresh();
      });
    });

    /* Delete */
    container.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.AndinetStorage.inbox.delete(btn.dataset.del);
        refresh();
      });
    });

    /* Expand/collapse */
    container.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const actEl = container.querySelector('#ibx-act-' + btn.dataset.expand);
        if (actEl) actEl.classList.toggle('open');
      });
    });

    /* Note autosave */
    container.querySelectorAll('[data-note]').forEach(ta => {
      ta.addEventListener('input', debounce(() => {
        const items = window.AndinetStorage.inbox.get();
        const item  = items.find(i => i.id === ta.dataset.note);
        if (item) {
          item.note = ta.value;
          window.AndinetStorage.inbox.save(items);
        }
      }, 800));
    });

    /* → Planner (show picker) */
    container.querySelectorAll('[data-planner]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.planner;
        const pp   = container.querySelector('#ibx-pp-' + id);
        if (pp) pp.style.display = pp.style.display === 'none' ? 'flex' : 'none';
      });
    });

    /* Planner confirm */
    container.querySelectorAll('[data-pp-confirm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.ppConfirm;
        const sel = container.querySelector(`[data-pp-sel="${id}"]`);
        const block = sel ? sel.value : 'morning';
        sendToPlanner(id, block);
      });
    });

    /* → Proyecto (show picker) */
    container.querySelectorAll('[data-proyecto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.dataset.proyecto;
        const pick = container.querySelector('#ibx-prpick-' + id);
        if (!pick) return;
        // Populate projects
        const sel = pick.querySelector(`[data-prp-sel="${id}"]`);
        if (sel) {
          const projs = window.AndinetStorage.proyectos.get()
            .filter(p => p.status !== 'archivado');
          sel.innerHTML = '<option value="">— elegir proyecto</option>' +
            projs.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.emoji + ' ' + p.title)}</option>`).join('');
        }
        pick.style.display = pick.style.display === 'none' ? 'flex' : 'none';
      });
    });

    /* Proyecto confirm */
    container.querySelectorAll('[data-prp-confirm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id  = btn.dataset.prpConfirm;
        const sel = container.querySelector(`[data-prp-sel="${id}"]`);
        if (!sel || !sel.value) {
          showToast('Selecciona un proyecto');
          return;
        }
        window.AndinetStorage.inbox.process(id, { type: 'proyecto', ref: sel.value, block: null });
        showToast('Asignado al proyecto');
        refresh();
      });
    });

    /* → Referencia */
    container.querySelectorAll('[data-referencia]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.AndinetStorage.inbox.setStatus(btn.dataset.referencia, 'reference');
        showToast('Movido a referencias');
        refresh();
      });
    });

    /* Archivar */
    container.querySelectorAll('[data-archivar]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.AndinetStorage.inbox.process(btn.dataset.archivar, { type: 'archivado', ref: null, block: null });
        showToast('Archivado');
        refresh();
      });
    });
  }

  /* ─── Send to Planner ─── */
  function sendToPlanner(itemId, block) {
    const items = window.AndinetStorage.inbox.get();
    const item  = items.find(i => i.id === itemId);
    if (!item) return;
    const today = todayKey();
    window.AndinetStorage.planner.addItem(today, block, {
      text:     item.text,
      type:     item.type,
      priority: item.priority,
    });
    window.AndinetStorage.inbox.process(itemId, { type: 'planner', ref: today, block });
    showToast('Enviado al Planner (' + block + ')');
    refresh();
  }

  /* ─── Capture ─── */
  function handleCapture() {
    const inp  = container && container.querySelector('#ibx-input');
    const type = container && container.querySelector('#ibx-type');
    const prio = container && container.querySelector('#ibx-prio');
    const area = container && container.querySelector('#ibx-area');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) { showToast('Escribe algo primero'); return; }
    window.AndinetStorage.inbox.add({
      text,
      type:     type ? type.value : 'task',
      priority: prio ? prio.value : '',
      area:     area ? area.value : '',
    });
    inp.value = '';
    showToast('Capturado ✓');
    refresh();
  }

  /* ─── Debounce ─── */
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ─── Init ─── */
  function init(el) {
    container = el || document.getElementById('os-page-inbox');
    if (!container) return;
    render();
  }

  return { init, refresh };

})();
