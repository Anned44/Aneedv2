/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — spaces.js
   Estudio · Creación · Mundo · Loveship
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetSpaces = (function () {

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

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  function formatDateShort(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  }

  /* ═══════════════════════════════════════════════════
     ESTUDIO
  ════════════════════════════════════════════════════ */
  const Estudio = (function () {

    let container = null;

    function getSpaceData() {
      const data = window.AndinetStorage.spaces.get('estudio');
      return {
        ideas: data.ideas || [],
        notas: data.notas || [],
      };
    }

    function saveSpaceData(patch) {
      const current = window.AndinetStorage.spaces.get('estudio');
      window.AndinetStorage.spaces.save('estudio', { ...current, ...patch });
    }

    /* Folders = proyectos de area estudio */
    function renderFolders() {
      const projs = window.AndinetStorage.proyectos.get()
        .filter(p => p.area === 'estudio' && p.status !== 'archivado');
      if (!projs.length) {
        return `<p style="font-family:var(--mono);font-size:10px;color:var(--muted);">No hay proyectos de estudio.</p>`;
      }
      return projs.map(p => `
        <div class="est-folder" data-folder="${escHtml(p.id)}">
          <div class="est-folder-hdr">
            <span class="est-folder-emoji">${escHtml(p.emoji)}</span>
            <span class="est-folder-title">${escHtml(p.title)}</span>
            <span class="est-folder-tag ${escHtml(p.status)}">${escHtml(p.status)}</span>
            <span class="est-folder-chev">›</span>
          </div>
          <div class="est-folder-body">
            <div class="est-folder-desc">${escHtml(p.description || 'Sin descripción.')}</div>
            <div class="est-folder-progress">
              <div class="est-folder-progress-fill" style="width:${p.progress || 0}%"></div>
            </div>
          </div>
        </div>`
      ).join('');
    }

    /* Post-its */
    function renderPostits() {
      const { ideas } = getSpaceData();
      if (!ideas.length) {
        return `<p style="font-family:var(--mono);font-size:10px;color:var(--muted);">Ninguna idea todavía.</p>`;
      }
      return ideas.map(idea => `
        <div class="est-postit" data-idea-id="${escHtml(idea.id)}">
          <div class="est-postit-text">${escHtml(idea.text)}</div>
          <span class="est-postit-date">${formatDateShort(idea.createdAt)}</span>
          <button class="est-postit-del" data-del-idea="${escHtml(idea.id)}">×</button>
        </div>`
      ).join('');
    }

    /* Notas */
    function renderNotas() {
      const { notas } = getSpaceData();
      if (!notas.length) {
        return `<p style="font-family:var(--mono);font-size:10px;color:var(--muted);">Sin notas todavía.</p>`;
      }
      return notas.map(nota => `
        <div class="est-nota" data-nota-id="${escHtml(nota.id)}">
          <span class="est-nota-date">${formatDateShort(nota.createdAt)}</span>
          <span class="est-nota-text">${escHtml(nota.text)}</span>
          <button class="est-nota-del" data-del-nota="${escHtml(nota.id)}">×</button>
        </div>`
      ).join('');
    }

    function render() {
      if (!container) return;
      container.innerHTML = `
      <div class="est-wrap">
        <div class="est-top">
          <span class="est-logo">Estudio</span>
          <span class="est-section-title">El espacio del saber</span>
          <div class="est-top-actions">
            <button class="space-back-btn" data-nav-back>← Portal</button>
          </div>
        </div>
        <div class="est-grid">
          <!-- Block 1: Proyectos -->
          <div class="est-block">
            <div class="est-block-head">
              <span class="est-block-glyph">◈</span>
              <div class="est-block-info">
                <span class="est-block-label">Proyectos</span>
                <span class="est-block-name">En curso</span>
              </div>
            </div>
            <div class="est-block-body" id="est-folders-body">
              ${renderFolders()}
            </div>
          </div>
          <!-- Block 2: Ideas / Post-its -->
          <div class="est-block">
            <div class="est-block-head">
              <span class="est-block-glyph">✦</span>
              <div class="est-block-info">
                <span class="est-block-label">Ideas</span>
                <span class="est-block-name">Post-its</span>
              </div>
            </div>
            <div class="est-block-body" id="est-postits-body">
              ${renderPostits()}
            </div>
            <div class="est-block-foot">
              <textarea class="est-idea-input" id="est-idea-ta" rows="2"
                        placeholder="Nueva idea…"></textarea>
              <button class="est-idea-btn" id="est-idea-btn">+ guardar idea</button>
            </div>
          </div>
          <!-- Block 3: Notas libres -->
          <div class="est-block">
            <div class="est-block-head">
              <span class="est-block-glyph">○</span>
              <div class="est-block-info">
                <span class="est-block-label">Notas</span>
                <span class="est-block-name">Registro libre</span>
              </div>
            </div>
            <div class="est-block-body" id="est-notas-body">
              ${renderNotas()}
            </div>
            <div class="est-block-foot">
              <input class="est-nota-input" id="est-nota-inp" placeholder="Añadir nota…">
            </div>
          </div>
        </div>
      </div>`;

      bindEvents();
    }

    function bindEvents() {
      if (!container) return;

      /* Back */
      container.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', () => window.AndinetRouter.navigate('portal'));
      });

      /* Folder toggle */
      container.querySelectorAll('.est-folder-hdr').forEach(hdr => {
        hdr.addEventListener('click', () => {
          const folder = hdr.closest('.est-folder');
          folder.classList.toggle('open');
          const body = folder.querySelector('.est-folder-body');
          if (body) body.classList.toggle('open');
        });
      });

      /* Idea save */
      const ideaBtn = container.querySelector('#est-idea-btn');
      const ideaTa  = container.querySelector('#est-idea-ta');
      function saveIdea() {
        const text = ideaTa ? ideaTa.value.trim() : '';
        if (!text) return;
        const data = getSpaceData();
        data.ideas.unshift({ id: window.AndinetStorage.uid(), text, createdAt: Date.now() });
        saveSpaceData({ ideas: data.ideas });
        ideaTa.value = '';
        refreshPostits();
      }
      if (ideaBtn) ideaBtn.addEventListener('click', saveIdea);
      if (ideaTa) {
        ideaTa.addEventListener('keydown', e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveIdea();
        });
      }

      /* Delete idea (delegation) */
      const postitsBody = container.querySelector('#est-postits-body');
      if (postitsBody) {
        postitsBody.addEventListener('click', e => {
          const del = e.target.closest('[data-del-idea]');
          if (!del) return;
          const data = getSpaceData();
          data.ideas = data.ideas.filter(i => i.id !== del.dataset.delIdea);
          saveSpaceData({ ideas: data.ideas });
          refreshPostits();
        });
      }

      /* Nota save */
      const notaInp = container.querySelector('#est-nota-inp');
      if (notaInp) {
        notaInp.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            const text = notaInp.value.trim();
            if (!text) return;
            const data = getSpaceData();
            data.notas.unshift({ id: window.AndinetStorage.uid(), text, createdAt: Date.now() });
            saveSpaceData({ notas: data.notas });
            notaInp.value = '';
            refreshNotas();
          }
        });
      }

      /* Delete nota (delegation) */
      const notasBody = container.querySelector('#est-notas-body');
      if (notasBody) {
        notasBody.addEventListener('click', e => {
          const del = e.target.closest('[data-del-nota]');
          if (!del) return;
          const data = getSpaceData();
          data.notas = data.notas.filter(n => n.id !== del.dataset.delNota);
          saveSpaceData({ notas: data.notas });
          refreshNotas();
        });
      }
    }

    function refreshPostits() {
      const body = container && container.querySelector('#est-postits-body');
      if (body) body.innerHTML = renderPostits();
    }

    function refreshNotas() {
      const body = container && container.querySelector('#est-notas-body');
      if (body) body.innerHTML = renderNotas();
    }

    function init(el) {
      container = el || document.getElementById('view-estudio');
      if (!container) return;
      render();
    }

    function refresh() { render(); }

    return { init, refresh };
  })();

  /* ═══════════════════════════════════════════════════
     LOVESHIP
  ════════════════════════════════════════════════════ */
  const Loveship = (function () {

    let container  = null;
    let counterInt = null;

    function getLove() {
      return window.AndinetStorage.spaces.getLove();
    }
    function saveLove(patch) {
      const current = getLove();
      window.AndinetStorage.spaces.saveLove({ ...current, ...patch });
    }

    /* Days counter */
    function countDays(startDate) {
      if (!startDate) return 0;
      const start = new Date(startDate);
      const now   = new Date();
      const diff  = now - start;
      return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }

    function renderDreams(dreams) {
      if (!dreams || !dreams.length) return '';
      return dreams.map(d => `
        <div class="love-list-item">
          <span class="love-list-glyph">♡</span>
          <span class="love-list-text">${escHtml(d.text)}</span>
          <span class="love-list-date">${formatDateShort(d.createdAt)}</span>
          <button class="love-list-del" data-del-dream="${escHtml(d.id)}">×</button>
        </div>`
      ).join('');
    }

    function renderMemories(memories) {
      if (!memories || !memories.length) {
        return `<p style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:2rem 0;">
          Guarda vuestros recuerdos…</p>`;
      }
      return memories.map((m, i) => {
        const tilt = ((i % 5) - 2) * 1.4;
        return `
        <div class="ls-polaroid" style="--tilt:${tilt}deg">
          <div class="ls-polaroid-photo-placeholder">${escHtml(m.emoji || '♡')}</div>
          <div class="ls-polaroid-caption">
            <div class="ls-polaroid-title">${escHtml(m.title)}</div>
            <div class="ls-polaroid-date">${formatDate(m.createdAt)}</div>
          </div>
          <button class="ls-polaroid-del" data-del-mem="${escHtml(m.id)}">×</button>
        </div>`;
      }).join('');
    }

    function render() {
      if (!container) return;
      if (counterInt) clearInterval(counterInt);

      const love = getLove();
      const days = countDays(love.startDate);

      container.innerHTML = `
      <div class="love-wrap">
        <div class="love-top">
          <span class="love-logo">Loveship</span>
          <span class="love-section-title">El espacio del amor</span>
          <button class="space-back-btn" data-nav-back>← Portal</button>
        </div>

        <!-- Counter Hero -->
        <div class="love-counter-hero">
          <span class="love-counter-num" id="love-days-num">${days}</span>
          <span class="love-counter-label">días juntos</span>
          ${love.startDate ? `<span class="love-counter-since">desde ${new Date(love.startDate).toLocaleDateString('es', { day:'numeric', month:'long', year:'numeric' })}</span>` : ''}
          <div class="love-date-set">
            <span class="love-date-label">Desde:</span>
            <input class="love-date-input" type="date" id="love-start-date"
                   value="${escHtml(love.startDate || '')}">
          </div>
        </div>

        <!-- Grid -->
        <div class="love-grid">
          <!-- Col 1 -->
          <div class="love-col">
            <div class="love-card">
              <div class="love-sec">Nuestra historia</div>
              <textarea class="love-note-area" id="love-main-note"
                        placeholder="Escribe algo hermoso…">${escHtml(love.note || '')}</textarea>
            </div>
          </div>
          <!-- Col 2 -->
          <div class="love-col">
            <div class="love-card">
              <div class="love-sec">Sueños & deseos</div>
              <div id="love-dreams-list">
                ${renderDreams(love.dreams)}
              </div>
              <input class="love-input" id="love-dream-input"
                     placeholder="Un sueño que quiero compartir…">
              <span class="love-add-hint">↵ enter para agregar</span>
            </div>
          </div>
        </div>

        <!-- Memories -->
        <div class="ls-mem-section">
          <div class="ls-mem-header">
            <span class="ls-mem-title">Memorias</span>
            <button class="ls-mem-add-btn" id="ls-mem-add-btn">+ añadir memoria</button>
          </div>
          <div class="ls-polaroid-grid" id="ls-polaroid-grid">
            ${renderMemories(love.memories)}
          </div>
        </div>
      </div>`;

      bindEvents();

      /* Live counter */
      if (love.startDate) {
        counterInt = setInterval(() => {
          const numEl = container && container.querySelector('#love-days-num');
          if (numEl) numEl.textContent = countDays(love.startDate);
        }, 60000);
      }
    }

    const saveNote = debounce(function (val) {
      saveLove({ note: val });
    }, 1000);

    function bindEvents() {
      if (!container) return;

      container.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', () => window.AndinetRouter.navigate('portal'));
      });

      /* Date input */
      const dateInp = container.querySelector('#love-start-date');
      if (dateInp) {
        dateInp.addEventListener('change', () => {
          saveLove({ startDate: dateInp.value });
          render(); // re-render to update counter label
        });
      }

      /* Note autosave */
      const noteTA = container.querySelector('#love-main-note');
      if (noteTA) {
        noteTA.addEventListener('input', () => saveNote(noteTA.value));
      }

      /* Dreams add */
      const dreamInp = container.querySelector('#love-dream-input');
      if (dreamInp) {
        dreamInp.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            const text = dreamInp.value.trim();
            if (!text) return;
            const love = getLove();
            const dreams = [...(love.dreams || [])];
            dreams.unshift({ id: window.AndinetStorage.uid(), text, createdAt: Date.now() });
            saveLove({ dreams });
            dreamInp.value = '';
            const list = container.querySelector('#love-dreams-list');
            if (list) list.innerHTML = renderDreams(dreams);
            bindDreamDelEvents();
          }
        });
      }

      bindDreamDelEvents();

      /* Memory add */
      const memAddBtn = container.querySelector('#ls-mem-add-btn');
      if (memAddBtn) memAddBtn.addEventListener('click', openMemModal);

      /* Memory delete (delegation) */
      const grid = container.querySelector('#ls-polaroid-grid');
      if (grid) {
        grid.addEventListener('click', e => {
          const del = e.target.closest('[data-del-mem]');
          if (!del) return;
          const love = getLove();
          const memories = (love.memories || []).filter(m => m.id !== del.dataset.delMem);
          saveLove({ memories });
          grid.innerHTML = renderMemories(memories);
        });
      }
    }

    function bindDreamDelEvents() {
      const list = container && container.querySelector('#love-dreams-list');
      if (!list) return;
      list.querySelectorAll('[data-del-dream]').forEach(btn => {
        btn.addEventListener('click', () => {
          const love = getLove();
          const dreams = (love.dreams || []).filter(d => d.id !== btn.dataset.delDream);
          saveLove({ dreams });
          list.innerHTML = renderDreams(dreams);
          bindDreamDelEvents();
        });
      });
    }

    function openMemModal() {
      const overlay = document.createElement('div');
      overlay.className = 'ls-mem-modal-overlay';
      overlay.innerHTML = `
      <div class="ls-mem-modal">
        <div class="ls-mem-modal-title">Nueva memoria</div>
        <div class="ls-mem-field">
          <label class="ls-mem-label">Título</label>
          <input class="ls-mem-input" id="lmem-title" placeholder="¿Qué recuerdo es este?">
        </div>
        <div class="ls-mem-field">
          <label class="ls-mem-label">Emoji (foto placeholder)</label>
          <input class="ls-mem-input" id="lmem-emoji" value="♡" style="width:80px;">
        </div>
        <div class="ls-mem-modal-actions">
          <button class="ls-mem-cancel" id="lmem-cancel">Cancelar</button>
          <button class="ls-mem-save" id="lmem-save">Guardar</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);

      const titleInp = overlay.querySelector('#lmem-title');
      if (titleInp) setTimeout(() => titleInp.focus(), 50);

      overlay.querySelector('#lmem-cancel').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      overlay.querySelector('#lmem-save').addEventListener('click', () => {
        const title = overlay.querySelector('#lmem-title').value.trim();
        if (!title) { showToast('Escribe un título'); return; }
        const emoji = overlay.querySelector('#lmem-emoji').value || '♡';
        const love = getLove();
        const memories = [...(love.memories || [])];
        memories.unshift({ id: window.AndinetStorage.uid(), title, emoji, createdAt: Date.now() });
        saveLove({ memories });
        overlay.remove();
        const grid = container && container.querySelector('#ls-polaroid-grid');
        if (grid) grid.innerHTML = renderMemories(memories);
      });
    }

    function init(el) {
      container = el || document.getElementById('view-loveship');
      if (!container) return;
      render();
    }

    function refresh() { render(); }

    return { init, refresh };
  })();

  /* ═══════════════════════════════════════════════════
     CREACION
  ════════════════════════════════════════════════════ */
  const Creacion = (function () {

    let container = null;

    function renderCards() {
      const projs = window.AndinetStorage.proyectos.get()
        .filter(p => p.area === 'creacion' && p.status !== 'archivado');
      if (!projs.length) {
        return `<div class="crea-empty" style="font-family:var(--mono);font-size:11px;color:var(--muted);">
          No hay proyectos de creación todavía.</div>`;
      }
      return `<div class="crea-grid">` + projs.map(p => `
        <div class="crea-card">
          <div class="crea-card-header">
            <span class="crea-card-emoji">${escHtml(p.emoji)}</span>
            <span class="crea-card-title">${escHtml(p.title)}</span>
            <span class="crea-card-status">${escHtml(p.status)}</span>
          </div>
          ${p.description ? `<div class="crea-card-desc">${escHtml(p.description)}</div>` : ''}
          <div class="crea-card-progress">
            <div class="crea-card-progress-fill" style="width:${p.progress||0}%"></div>
          </div>
        </div>`
      ).join('') + `</div>`;
    }

    function render() {
      if (!container) return;
      container.innerHTML = `
      <div class="crea-wrap">
        <div class="crea-top">
          <span class="crea-logo">Creación</span>
          <span class="crea-section-title">El taller creativo</span>
          <button class="space-back-btn" data-nav-back>← Portal</button>
        </div>
        <div class="crea-body">
          <div class="crea-intro">Proyectos creativos en progreso</div>
          ${renderCards()}
        </div>
      </div>`;

      container.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', () => window.AndinetRouter.navigate('portal'));
      });
    }

    function init(el) {
      container = el || document.getElementById('view-creacion');
      if (!container) return;
      render();
    }

    function refresh() { render(); }

    return { init, refresh };
  })();

  /* ═══════════════════════════════════════════════════
     MUNDO
  ════════════════════════════════════════════════════ */
  const Mundo = (function () {

    let container = null;

    function getMundoData() {
      return window.AndinetStorage.spaces.get('mundo') || { nota: '' };
    }

    const saveNota = debounce(function (val) {
      const current = window.AndinetStorage.spaces.get('mundo') || {};
      window.AndinetStorage.spaces.save('mundo', { ...current, nota: val });
    }, 800);

    function render() {
      if (!container) return;
      const data = getMundoData();

      container.innerHTML = `
      <div class="mundo-wrap">
        <div class="mundo-top">
          <span class="mundo-logo">Mundo</span>
          <span class="mundo-section-title">El espacio del afuera</span>
          <button class="space-back-btn" data-nav-back>← Portal</button>
        </div>
        <div class="mundo-body">
          <div class="mundo-section-header">Notas personales · observaciones · mundo exterior</div>
          <textarea class="mundo-textarea" id="mundo-nota"
                    placeholder="Escribe lo que observas, sientes o piensas sobre el mundo…">${escHtml(data.nota || '')}</textarea>
          <div class="mundo-save-hint" id="mundo-hint"></div>
        </div>
      </div>`;

      container.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', () => window.AndinetRouter.navigate('portal'));
      });

      const ta = container.querySelector('#mundo-nota');
      const hint = container.querySelector('#mundo-hint');
      if (ta) {
        ta.addEventListener('input', () => {
          if (hint) hint.textContent = '…guardando';
          saveNota(ta.value);
          setTimeout(() => { if (hint) hint.textContent = 'guardado'; }, 1000);
        });
      }
    }

    function init(el) {
      container = el || document.getElementById('view-mundo');
      if (!container) return;
      render();
    }

    function refresh() { render(); }

    return { init, refresh };
  })();

  /* ─── Init all ─── */
  function init() {
    Estudio.init();
    Loveship.init();
    Creacion.init();
    Mundo.init();
  }

  function refresh() {
    Estudio.refresh();
    Loveship.refresh();
    Creacion.refresh();
    Mundo.refresh();
  }

  return {
    init,
    refresh,
    estudio:  Estudio,
    loveship: Loveship,
    creacion: Creacion,
    mundo:    Mundo,
  };

})();
