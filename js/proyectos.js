/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — proyectos.js
   Lista + Vista detalle + Kanban + Tags + Notas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetProyectos = (function () {

  /* ─── State ─── */
  let container    = null;
  let currentProjId = null;    // null → list, id → detail
  let saveTimer     = null;

  /* ─── Helpers ─── */
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  const saveNotes = debounce(function (projId, val) {
    window.AndinetStorage.proyectos.update(projId, { notes: val });
  }, 800);

  /* ─── Status label ─── */
  const STATUS_LABELS = {
    nuevo:     'nuevo',
    activo:    'activo',
    building:  'building',
    pausa:     'pausa',
    completo:  'completo',
    archivado: 'archivado',
  };

  /* ─── Card ─── */
  function renderCard(proj) {
    const pct = proj.progress || 0;
    return `
    <div class="proy-card" data-status="${escHtml(proj.status)}" data-proj-id="${escHtml(proj.id)}">
      <div class="proy-card-header">
        <span class="proy-card-emoji">${escHtml(proj.emoji)}</span>
        <span class="proy-card-title">${escHtml(proj.title)}</span>
        <span class="proy-status-badge">${escHtml(STATUS_LABELS[proj.status] || proj.status)}</span>
      </div>
      ${proj.description ? `<div class="proy-card-desc">${escHtml(proj.description)}</div>` : ''}
      <div class="proy-card-meta">
        <span class="proy-card-meta-item">área: ${escHtml(proj.area || '—')}</span>
        ${proj.props?.deadline ? `<span class="proy-card-meta-item">deadline: ${escHtml(proj.props.deadline)}</span>` : ''}
        <span class="proy-card-meta-item">${pct}% completado</span>
      </div>
      <div class="proy-progress-bar">
        <div class="proy-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
  }

  /* ─── List ─── */
  function renderList() {
    const projs = window.AndinetStorage.proyectos.get();
    if (!projs.length) {
      return `<div class="proy-empty">
        <span class="proy-empty-glyph">◈</span>
        No hay proyectos todavía.
      </div>
      <button class="proy-add-btn" id="proy-new-btn">+ Nuevo proyecto</button>`;
    }
    return `
    <div class="proy-card-grid" id="proy-card-grid">
      ${projs.map(renderCard).join('')}
    </div>
    <button class="proy-add-btn" id="proy-new-btn" style="margin-top:10px;">+ Nuevo proyecto</button>`;
  }

  /* ─── Detail ─── */
  function renderDetail(projId) {
    const proj = window.AndinetStorage.proyectos.getById(projId);
    if (!proj) { showView('list'); return; }

    const tags = (proj.tags || []).map(t =>
      `<span class="vproy-tag">${escHtml(t)}<button class="vproy-tag-del" data-tag-del="${escHtml(t)}">×</button></span>`
    ).join('');

    const kanban = (proj.kanban || []).map((col, ci) => {
      const cards = col.cards.map((card, ki) => {
        const prevColId = ci > 0 ? proj.kanban[ci - 1].id : null;
        const nextColId = ci < proj.kanban.length - 1 ? proj.kanban[ci + 1].id : null;
        return `
        <div class="kn-card" data-card-id="${escHtml(card.id)}">
          <div class="kn-card-text">${escHtml(card.text)}</div>
          <div class="kn-card-actions">
            ${prevColId ? `<button class="kn-btn" data-kn-move-left data-card="${escHtml(card.id)}" data-from="${escHtml(col.id)}" data-to="${escHtml(prevColId)}" title="Mover atrás">←</button>` : ''}
            ${nextColId ? `<button class="kn-btn" data-kn-move-right data-card="${escHtml(card.id)}" data-from="${escHtml(col.id)}" data-to="${escHtml(nextColId)}" title="Mover adelante">→</button>` : ''}
            <button class="kn-btn" data-kn-del data-card="${escHtml(card.id)}" data-col="${escHtml(col.id)}" title="Eliminar">×</button>
          </div>
        </div>`;
      }).join('');

      return `
      <div class="kn-col" data-col-id="${escHtml(col.id)}">
        <div class="kn-col-head">
          <span class="kn-col-name">${escHtml(col.name)}</span>
          <span class="kn-col-count">${col.cards.length}</span>
        </div>
        <div class="kn-col-body">${cards}</div>
        <div class="kn-col-foot">
          <input class="kn-input" placeholder="+ añadir card…"
                 data-kn-input="${escHtml(col.id)}">
        </div>
      </div>`;
    }).join('');

    const links = (proj.props?.links || []).map((url, li) =>
      `<div class="vproy-link-item">
        <input class="vproy-link-url" value="${escHtml(url)}" placeholder="https://…"
               data-link-idx="${li}">
        <button class="vproy-link-del" data-link-del="${li}">×</button>
      </div>`
    ).join('');

    return `
    <div class="vproy-wrap">
      <button class="vproy-back-btn" id="vproy-back">← Proyectos</button>
      <div class="vproy-header">
        <div class="vproy-title-row" style="position:relative;">
          <span class="vproy-emoji" id="vproy-emoji-btn" title="Cambiar emoji">${escHtml(proj.emoji)}</span>
          <input class="vproy-name" id="vproy-name" value="${escHtml(proj.title)}" placeholder="Título del proyecto">
        </div>
        <textarea class="vproy-desc" id="vproy-desc" rows="2" placeholder="Descripción…">${escHtml(proj.description || '')}</textarea>
        <div class="vproy-props">
          <div class="vproy-prop">
            <span class="vproy-prop-label">Estado</span>
            <div class="vproy-prop-val">
              <select id="vproy-status">
                ${Object.entries(STATUS_LABELS).map(([k, v]) =>
                  `<option value="${k}"${proj.status === k ? ' selected' : ''}>${v}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="vproy-prop">
            <span class="vproy-prop-label">Área</span>
            <input class="vproy-prop-val" id="vproy-area" value="${escHtml(proj.area || '')}" placeholder="estudio…">
          </div>
          <div class="vproy-prop">
            <span class="vproy-prop-label">Inicio</span>
            <input class="vproy-prop-val" id="vproy-inicio" type="date" value="${escHtml(proj.props?.inicio || '')}">
          </div>
          <div class="vproy-prop">
            <span class="vproy-prop-label">Deadline</span>
            <input class="vproy-prop-val" id="vproy-deadline" type="date" value="${escHtml(proj.props?.deadline || '')}">
          </div>
        </div>
        <div class="vproy-progress-row">
          <span class="vproy-progress-label">Progreso</span>
          <input class="vproy-progress-slider" type="range" min="0" max="100"
                 id="vproy-progress" value="${proj.progress || 0}">
          <span class="vproy-progress-num" id="vproy-progress-num">${proj.progress || 0}%</span>
        </div>
        <div class="vproy-tags" id="vproy-tags-container">
          ${tags}
          <input class="vproy-tag-input" id="vproy-tag-input" placeholder="+ tag">
        </div>
      </div>

      <!-- Kanban -->
      <div class="vproy-section-title" style="margin-bottom:10px;">Tablero</div>
      <div class="vproy-kanban-wrap">
        <div class="vproy-kanban" id="vproy-kanban">
          ${kanban}
        </div>
      </div>

      <!-- Bottom: Notas + Links -->
      <div class="vproy-bottom">
        <div>
          <div class="vproy-section-title">Notas del proyecto</div>
          <textarea class="vproy-notes" id="vproy-notes"
                    placeholder="Notas libres sobre el proyecto…">${escHtml(proj.notes || '')}</textarea>
        </div>
        <div>
          <div class="vproy-section-title">Links</div>
          <div class="vproy-links" id="vproy-links-list">
            ${links}
          </div>
          <button class="vproy-link-add" id="vproy-link-add">+ añadir link</button>
        </div>
      </div>
    </div>`;
  }

  /* ─── Show view ─── */
  function showView(which, projId) {
    if (!container) return;
    if (which === 'list') {
      currentProjId = null;
      container.innerHTML = renderList();
      bindListEvents();
    } else {
      currentProjId = projId;
      container.innerHTML = renderDetail(projId);
      bindDetailEvents(projId);
    }
  }

  /* ─── Bind list events ─── */
  function bindListEvents() {
    if (!container) return;

    container.querySelectorAll('.proy-card').forEach(card => {
      card.addEventListener('click', () => {
        showView('detail', card.dataset.projId);
      });
    });

    const newBtn = container.querySelector('#proy-new-btn');
    if (newBtn) newBtn.addEventListener('click', openNewModal);
  }

  /* ─── Bind detail events ─── */
  function bindDetailEvents(projId) {
    if (!container) return;

    /* Back */
    const back = container.querySelector('#vproy-back');
    if (back) back.addEventListener('click', () => showView('list'));

    /* Inline edits */
    function patchDebounced(field, val) {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        window.AndinetStorage.proyectos.update(projId, { [field]: val });
      }, 600);
    }

    const nameIn = container.querySelector('#vproy-name');
    if (nameIn) {
      nameIn.addEventListener('input', () => patchDebounced('title', nameIn.value));
    }

    const descIn = container.querySelector('#vproy-desc');
    if (descIn) {
      descIn.addEventListener('input', () => {
        descIn.style.height = 'auto';
        descIn.style.height = descIn.scrollHeight + 'px';
        patchDebounced('description', descIn.value);
      });
    }

    const statusSel = container.querySelector('#vproy-status');
    if (statusSel) {
      statusSel.addEventListener('change', () => {
        window.AndinetStorage.proyectos.update(projId, { status: statusSel.value });
      });
    }

    const areaIn = container.querySelector('#vproy-area');
    if (areaIn) areaIn.addEventListener('input', () => patchDebounced('area', areaIn.value));

    /* Props */
    function patchProps(field, val) {
      const proj = window.AndinetStorage.proyectos.getById(projId);
      if (!proj) return;
      const props = { ...(proj.props || {}), [field]: val };
      window.AndinetStorage.proyectos.update(projId, { props });
    }

    const inicioIn = container.querySelector('#vproy-inicio');
    if (inicioIn) inicioIn.addEventListener('change', () => patchProps('inicio', inicioIn.value));
    const dlIn = container.querySelector('#vproy-deadline');
    if (dlIn) dlIn.addEventListener('change', () => patchProps('deadline', dlIn.value));

    /* Progress */
    const prog = container.querySelector('#vproy-progress');
    const progNum = container.querySelector('#vproy-progress-num');
    if (prog) {
      prog.addEventListener('input', () => {
        if (progNum) progNum.textContent = prog.value + '%';
        patchDebounced('progress', parseInt(prog.value, 10));
      });
    }

    /* Tags */
    const tagInput = container.querySelector('#vproy-tag-input');
    if (tagInput) {
      tagInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const val = tagInput.value.trim();
          if (!val) return;
          const proj = window.AndinetStorage.proyectos.getById(projId);
          if (!proj) return;
          const tags = [...(proj.tags || [])];
          if (!tags.includes(val)) {
            tags.push(val);
            window.AndinetStorage.proyectos.update(projId, { tags });
          }
          tagInput.value = '';
          refreshTags(projId);
        }
      });
    }

    /* Tag delete (event delegation) */
    const tagsContainer = container.querySelector('#vproy-tags-container');
    if (tagsContainer) {
      tagsContainer.addEventListener('click', e => {
        const del = e.target.closest('[data-tag-del]');
        if (!del) return;
        const tag = del.dataset.tagDel;
        const proj = window.AndinetStorage.proyectos.getById(projId);
        if (!proj) return;
        const tags = (proj.tags || []).filter(t => t !== tag);
        window.AndinetStorage.proyectos.update(projId, { tags });
        refreshTags(projId);
      });
    }

    /* Emoji picker */
    const emojiBtn = container.querySelector('#vproy-emoji-btn');
    if (emojiBtn) {
      emojiBtn.addEventListener('click', () => {
        const existing = container.querySelector('.proy-emoji-pick');
        if (existing) { existing.remove(); return; }
        const pick = document.createElement('div');
        pick.className = 'proy-emoji-pick';
        pick.style.position = 'absolute';
        pick.style.top = '100%';
        pick.style.left = '0';
        const emojis = ['◈','○','◎','✦','✧','⬡','◆','✿','⊕','★','▲','◉','⬟','✱','⟡','📚','✏️','🎨','🌍','💙','💡','🔬','⚡','🎯','🧠','🪐','🌱','🌊'];
        emojis.forEach(em => {
          const btn = document.createElement('button');
          btn.textContent = em;
          btn.addEventListener('click', () => {
            window.AndinetStorage.proyectos.update(projId, { emoji: em });
            emojiBtn.textContent = em;
            pick.remove();
          });
          pick.appendChild(btn);
        });
        emojiBtn.parentElement.style.position = 'relative';
        emojiBtn.parentElement.appendChild(pick);
        document.addEventListener('click', function handler(ev) {
          if (!pick.contains(ev.target) && ev.target !== emojiBtn) {
            pick.remove();
            document.removeEventListener('click', handler);
          }
        }, { capture: true });
      });
    }

    /* Notes autosave */
    const notesTA = container.querySelector('#vproy-notes');
    if (notesTA) {
      notesTA.addEventListener('input', () => saveNotes(projId, notesTA.value));
    }

    /* Kanban */
    bindKanbanEvents(projId);

    /* Links */
    bindLinksEvents(projId);
  }

  /* ─── Tags refresh ─── */
  function refreshTags(projId) {
    const proj = window.AndinetStorage.proyectos.getById(projId);
    if (!proj) return;
    const c = container.querySelector('#vproy-tags-container');
    if (!c) return;
    const tags = (proj.tags || []).map(t =>
      `<span class="vproy-tag">${escHtml(t)}<button class="vproy-tag-del" data-tag-del="${escHtml(t)}">×</button></span>`
    ).join('');
    const input = c.querySelector('#vproy-tag-input');
    const inputVal = input ? input.value : '';
    c.innerHTML = tags + `<input class="vproy-tag-input" id="vproy-tag-input" placeholder="+ tag" value="${escHtml(inputVal)}">`;
    // Re-bind
    const newInput = c.querySelector('#vproy-tag-input');
    if (newInput) {
      newInput.focus();
      newInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const val = newInput.value.trim();
          if (!val) return;
          const p = window.AndinetStorage.proyectos.getById(projId);
          if (!p) return;
          const tags2 = [...(p.tags || [])];
          if (!tags2.includes(val)) {
            tags2.push(val);
            window.AndinetStorage.proyectos.update(projId, { tags: tags2 });
          }
          newInput.value = '';
          refreshTags(projId);
        }
      });
    }
    c.addEventListener('click', e => {
      const del = e.target.closest('[data-tag-del]');
      if (!del) return;
      const tag = del.dataset.tagDel;
      const p = window.AndinetStorage.proyectos.getById(projId);
      if (!p) return;
      const tags2 = (p.tags || []).filter(t => t !== tag);
      window.AndinetStorage.proyectos.update(projId, { tags: tags2 });
      refreshTags(projId);
    });
  }

  /* ─── Kanban events ─── */
  function bindKanbanEvents(projId) {
    const kb = container && container.querySelector('#vproy-kanban');
    if (!kb) return;

    /* Add card via input enter */
    kb.querySelectorAll('[data-kn-input]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const text = inp.value.trim();
          if (!text) return;
          window.AndinetStorage.proyectos.addKanbanCard(projId, inp.dataset.knInput, text);
          inp.value = '';
          refreshKanban(projId);
        }
      });
    });

    /* Move left */
    kb.querySelectorAll('[data-kn-move-left]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        window.AndinetStorage.proyectos.moveKanbanCard(projId, btn.dataset.card, btn.dataset.from, btn.dataset.to);
        refreshKanban(projId);
      });
    });

    /* Move right */
    kb.querySelectorAll('[data-kn-move-right]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        window.AndinetStorage.proyectos.moveKanbanCard(projId, btn.dataset.card, btn.dataset.from, btn.dataset.to);
        refreshKanban(projId);
      });
    });

    /* Delete card */
    kb.querySelectorAll('[data-kn-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        window.AndinetStorage.proyectos.deleteKanbanCard(projId, btn.dataset.col, btn.dataset.card);
        refreshKanban(projId);
      });
    });
  }

  function refreshKanban(projId) {
    const proj = window.AndinetStorage.proyectos.getById(projId);
    if (!proj) return;
    const kbWrap = container && container.querySelector('#vproy-kanban');
    if (!kbWrap) return;
    // Re-render kanban inline
    const tmp = document.createElement('div');
    tmp.innerHTML = `<div>${renderDetail(projId)}</div>`;
    const newKb = tmp.querySelector('#vproy-kanban');
    if (newKb) {
      kbWrap.innerHTML = newKb.innerHTML;
      bindKanbanEvents(projId);
    }
  }

  /* ─── Links events ─── */
  function bindLinksEvents(projId) {
    const addBtn = container && container.querySelector('#vproy-link-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const proj = window.AndinetStorage.proyectos.getById(projId);
        if (!proj) return;
        const links = [...(proj.props?.links || ''), ''];
        const props = { ...(proj.props || {}), links };
        window.AndinetStorage.proyectos.update(projId, { props });
        refreshLinks(projId);
      });
    }
    bindLinkItemEvents(projId);
  }

  function bindLinkItemEvents(projId) {
    const list = container && container.querySelector('#vproy-links-list');
    if (!list) return;

    list.querySelectorAll('[data-link-idx]').forEach(inp => {
      inp.addEventListener('input', debounce(() => {
        const proj = window.AndinetStorage.proyectos.getById(projId);
        if (!proj) return;
        const links = [...(proj.props?.links || [])];
        links[parseInt(inp.dataset.linkIdx, 10)] = inp.value;
        const props = { ...(proj.props || {}), links };
        window.AndinetStorage.proyectos.update(projId, { props });
      }, 600));
    });

    list.querySelectorAll('[data-link-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const proj = window.AndinetStorage.proyectos.getById(projId);
        if (!proj) return;
        const links = (proj.props?.links || []).filter((_, i) => i !== parseInt(btn.dataset.linkDel, 10));
        const props = { ...(proj.props || {}), links };
        window.AndinetStorage.proyectos.update(projId, { props });
        refreshLinks(projId);
      });
    });
  }

  function refreshLinks(projId) {
    const proj = window.AndinetStorage.proyectos.getById(projId);
    if (!proj) return;
    const list = container && container.querySelector('#vproy-links-list');
    if (!list) return;
    const links = (proj.props?.links || []).map((url, li) =>
      `<div class="vproy-link-item">
        <input class="vproy-link-url" value="${escHtml(url)}" placeholder="https://…"
               data-link-idx="${li}">
        <button class="vproy-link-del" data-link-del="${li}">×</button>
      </div>`
    ).join('');
    list.innerHTML = links;
    bindLinkItemEvents(projId);
  }

  /* ─── New project modal ─── */
  function openNewModal() {
    const overlay = document.createElement('div');
    overlay.className = 'proy-modal-overlay';
    overlay.innerHTML = `
    <div class="proy-modal">
      <div class="proy-modal-title">Nuevo proyecto</div>
      <div class="proy-modal-field">
        <label class="proy-modal-label">Emoji</label>
        <input class="proy-modal-input" id="pnew-emoji" value="◈" style="width:60px;">
      </div>
      <div class="proy-modal-field">
        <label class="proy-modal-label">Título</label>
        <input class="proy-modal-input" id="pnew-title" placeholder="Nombre del proyecto" autofocus>
      </div>
      <div class="proy-modal-field">
        <label class="proy-modal-label">Descripción</label>
        <textarea class="proy-modal-textarea" id="pnew-desc" rows="2" placeholder="Breve descripción…"></textarea>
      </div>
      <div class="proy-modal-field">
        <label class="proy-modal-label">Área</label>
        <select class="proy-modal-select" id="pnew-area">
          <option value="estudio">estudio</option>
          <option value="creacion">creación</option>
          <option value="mundo">mundo</option>
          <option value="love">loveship</option>
          <option value="general">general</option>
        </select>
      </div>
      <div class="proy-modal-field">
        <label class="proy-modal-label">Estado inicial</label>
        <select class="proy-modal-select" id="pnew-status">
          <option value="nuevo">nuevo</option>
          <option value="activo">activo</option>
          <option value="building">building</option>
        </select>
      </div>
      <div class="proy-modal-actions">
        <button class="proy-modal-cancel" id="pnew-cancel">Cancelar</button>
        <button class="proy-modal-save" id="pnew-save">Crear</button>
      </div>
    </div>`;

    document.body.appendChild(overlay);

    const titleIn = overlay.querySelector('#pnew-title');
    if (titleIn) setTimeout(() => titleIn.focus(), 50);

    overlay.querySelector('#pnew-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#pnew-save').addEventListener('click', () => {
      const title = overlay.querySelector('#pnew-title').value.trim();
      if (!title) { showToast('Escribe un título'); return; }
      window.AndinetStorage.proyectos.add({
        emoji:       overlay.querySelector('#pnew-emoji').value || '◈',
        title,
        description: overlay.querySelector('#pnew-desc').value,
        area:        overlay.querySelector('#pnew-area').value,
        status:      overlay.querySelector('#pnew-status').value,
      });
      overlay.remove();
      showToast('Proyecto creado ✓');
      showView('list');
    });
  }

  /* ─── Refresh ─── */
  function refresh() {
    if (currentProjId) {
      showView('detail', currentProjId);
    } else {
      showView('list');
    }
  }

  /* ─── Init ─── */
  function init(el) {
    container = el || document.getElementById('os-page-proyectos');
    if (!container) return;
    showView('list');
  }

  return { init, refresh, openNewModal };

})();
