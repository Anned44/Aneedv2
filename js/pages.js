/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — pages.js
   Editor de páginas con bloques
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetPages = (function () {

  /* ─── State ─── */
  let container   = null;
  let currentPage = null;   // null → list, page object → editor
  let autoSaveT   = null;

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
    return new Date(ts).toLocaleDateString('es', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  /* ─── Cover palettes ─── */
  const COVER_COLORS = [
    { value: '#1a1625', label: 'grape dark' },
    { value: '#0e1820', label: 'deep blue' },
    { value: '#1a1010', label: 'dark red' },
    { value: '#0e1a12', label: 'forest' },
    { value: '#1a1208', label: 'amber dark' },
    { value: '#180e1a', label: 'violet' },
    { value: '#0a0a0a', label: 'black' },
    { value: '#7a5c9a', label: 'grape' },
    { value: '#5a7aaa', label: 'blue' },
    { value: '#c8965a', label: 'amber' },
    { value: '#5a8a6a', label: 'green' },
    { value: '#c86e8a', label: 'love' },
  ];

  const EMOJIS = ['○','◎','◈','✦','✧','⬡','◆','✿','⊕','★','▲','◉','⬟','✱','⟡','📝','💡','🔬','📚','🎨','🌍','⚡','🧠','🪐','🌱','🌊','🎯','💫'];

  /* ─── Block types ─── */
  const BLOCK_TYPES = [
    { type: 'text',     icon: '¶',  label: 'Texto',      hint: 'párrafo' },
    { type: 'heading',  icon: 'H',  label: 'Encabezado', hint: 'h1' },
    { type: 'quote',    icon: '"',  label: 'Cita',       hint: 'blockquote' },
    { type: 'callout',  icon: '!',  label: 'Callout',    hint: 'destacado' },
    { type: 'divider',  icon: '—',  label: 'Divisor',    hint: 'hr' },
  ];

  /* ─── Pages list ─── */
  function renderList() {
    const pages = window.AndinetStorage.pages.get();
    if (!container) return;

    let html = `
    <div class="pages-list-wrap">
      <div class="pages-list-header">
        <span class="pages-list-title">Páginas</span>
        <button class="pages-new-btn" id="pages-new-btn">+ Nueva página</button>
      </div>`;

    if (!pages.length) {
      html += `<div class="pages-empty">
        <span style="font-size:2rem;opacity:.3;display:block;margin-bottom:10px;">○</span>
        Aún no hay páginas. Crea tu primera página.
      </div>`;
    } else {
      html += `<div class="pages-list-grid">` +
        pages.map(p => `
        <div class="pages-list-item" data-page-id="${escHtml(p.id)}">
          <span class="pages-list-emoji">${escHtml(p.emoji)}</span>
          <div class="pages-list-info">
            <div class="pages-list-name">${escHtml(p.title)}</div>
            <div class="pages-list-date">${formatDate(p.updatedAt || p.createdAt)}</div>
          </div>
          <button class="pages-list-del" data-del-page="${escHtml(p.id)}" title="Eliminar página">×</button>
        </div>`).join('') +
        `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    bindListEvents();
  }

  function bindListEvents() {
    if (!container) return;
    const newBtn = container.querySelector('#pages-new-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        const page = window.AndinetStorage.pages.add({ emoji: '○', title: 'Sin título' });
        openEditor(page.id);
      });
    }

    container.querySelectorAll('[data-page-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-del-page]')) return;
        openEditor(el.dataset.pageId);
      });
    });

    container.querySelectorAll('[data-del-page]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta página?')) {
          window.AndinetStorage.pages.delete(btn.dataset.delPage);
          renderList();
        }
      });
    });
  }

  /* ─── Block renderer ─── */
  function renderBlock(block) {
    const isDiv = block.type === 'divider';
    const handleHtml = `
      <div class="pblock-handle">
        <div class="pblock-handle-dot"></div>
        <div class="pblock-handle-dot"></div>
      </div>`;

    let contentHtml;
    if (isDiv) {
      contentHtml = `
        <div class="pblock-content">
          <div class="pblock-divider-wrap"><div class="pblock-divider"></div></div>
          <div class="pblock-actions">
            <button class="pblock-del-btn" data-del-block="${escHtml(block.id)}" title="Eliminar">×</button>
          </div>
        </div>`;
    } else {
      const extraClass = block.type === 'heading'  ? ' pblock-heading'
                       : block.type === 'quote'    ? ' pblock-quote'
                       : block.type === 'callout'  ? ' pblock-callout'
                       : '';
      const wrapOpen  = block.type === 'callout' ? '<div class="pblock-callout-wrap">' : '';
      const wrapClose = block.type === 'callout' ? '</div>' : '';

      contentHtml = `
        <div class="pblock-content">
          ${wrapOpen}
          <textarea class="pblock-text${extraClass}"
                    data-block-id="${escHtml(block.id)}"
                    rows="1"
                    placeholder="${block.type === 'heading' ? 'Encabezado…' : block.type === 'quote' ? 'Cita…' : block.type === 'callout' ? 'Callout…' : 'Escribe algo…'}">${escHtml(block.content)}</textarea>
          ${wrapClose}
          <div class="pblock-actions">
            <button class="pblock-del-btn" data-del-block="${escHtml(block.id)}" title="Eliminar">×</button>
          </div>
        </div>`;
    }

    return `<div class="pblock" data-block="${escHtml(block.id)}">${handleHtml}${contentHtml}</div>`;
  }

  /* ─── Editor ─── */
  function openEditor(pageId) {
    const page = window.AndinetStorage.pages.getById(pageId);
    if (!page) { renderList(); return; }
    currentPage = page;
    renderEditor(page);
  }

  function renderEditor(page) {
    if (!container) return;
    const coverColor = (page.cover && page.cover.value) ? page.cover.value : '#1a1625';
    const swatches = COVER_COLORS.map(c => `
      <div class="page-cover-swatch${c.value === coverColor ? ' active' : ''}"
           style="background:${c.value};"
           data-swatch="${escHtml(c.value)}"
           title="${escHtml(c.label)}"></div>`
    ).join('');

    const blocks = (page.blocks || []).map(renderBlock).join('');

    container.innerHTML = `
    <div class="page-editor-wrap">
      <div class="page-cover" id="page-cover" style="background:${escHtml(coverColor)};">
        <div class="page-cover-overlay"></div>
        <div class="page-cover-content">
          <div class="page-emoji-title" style="position:relative;">
            <button class="page-emoji-btn" id="page-emoji-btn">${escHtml(page.emoji)}</button>
            <input class="page-title-input" id="page-title-input"
                   value="${escHtml(page.title)}"
                   placeholder="Título de la página">
          </div>
        </div>
        <div class="page-cover-picker">${swatches}</div>
      </div>

      <div class="page-meta-bar">
        <button class="page-back-btn" id="page-back-btn">← Páginas</button>
        <span class="page-meta-item">
          Actualizado: <span id="page-updated-label">${formatDate(page.updatedAt || page.createdAt)}</span>
        </span>
        <span class="page-meta-item">
          ${(page.blocks || []).length} bloques
        </span>
      </div>

      <div class="page-body" id="page-body">
        <div id="page-blocks-list">${blocks}</div>
        <div style="position:relative;">
          <button class="pblock-add-btn" id="pblock-add-btn">+ bloque</button>
          <div class="cmd-palette" id="cmd-palette" style="display:none;">
            ${BLOCK_TYPES.map(bt => `
              <div class="cmd-item" data-add-block="${escHtml(bt.type)}">
                <span class="cmd-item-icon">${escHtml(bt.icon)}</span>
                <span class="cmd-item-label">${escHtml(bt.label)}</span>
                <span class="cmd-item-hint">${escHtml(bt.hint)}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

    bindEditorEvents(page.id);
    autoResizeAll();
  }

  function bindEditorEvents(pageId) {
    if (!container) return;

    /* Back */
    const backBtn = container.querySelector('#page-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        currentPage = null;
        renderList();
      });
    }

    /* Title */
    const titleInp = container.querySelector('#page-title-input');
    if (titleInp) {
      titleInp.addEventListener('input', debounce(() => {
        window.AndinetStorage.pages.update(pageId, { title: titleInp.value });
        updateTimestamp();
      }, 800));
    }

    /* Cover swatch */
    const cover = container.querySelector('#page-cover');
    container.querySelectorAll('[data-swatch]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        container.querySelectorAll('[data-swatch]').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const val = swatch.dataset.swatch;
        if (cover) cover.style.background = val;
        window.AndinetStorage.pages.update(pageId, { cover: { type: 'color', value: val } });
      });
    });

    /* Emoji picker */
    const emojiBtn = container.querySelector('#page-emoji-btn');
    if (emojiBtn) {
      emojiBtn.addEventListener('click', e => {
        e.stopPropagation();
        const existing = container.querySelector('.page-emoji-palette');
        if (existing) { existing.remove(); return; }
        const palette = document.createElement('div');
        palette.className = 'page-emoji-palette';
        EMOJIS.forEach(em => {
          const btn = document.createElement('button');
          btn.textContent = em;
          btn.addEventListener('click', () => {
            emojiBtn.textContent = em;
            window.AndinetStorage.pages.update(pageId, { emoji: em });
            palette.remove();
          });
          palette.appendChild(btn);
        });
        emojiBtn.parentElement.appendChild(palette);
        document.addEventListener('click', function handler(ev) {
          if (!palette.contains(ev.target) && ev.target !== emojiBtn) {
            palette.remove();
            document.removeEventListener('click', handler);
          }
        }, { capture: true });
      });
    }

    /* Add block toggle */
    const addBtn = container.querySelector('#pblock-add-btn');
    const cmdPal = container.querySelector('#cmd-palette');
    if (addBtn && cmdPal) {
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        cmdPal.style.display = cmdPal.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', function closer(ev) {
        if (!cmdPal.contains(ev.target) && ev.target !== addBtn) {
          cmdPal.style.display = 'none';
        }
      });
    }

    /* Add block from palette */
    if (cmdPal) {
      cmdPal.querySelectorAll('[data-add-block]').forEach(item => {
        item.addEventListener('click', () => {
          const type = item.dataset.addBlock;
          const block = window.AndinetStorage.pages.addBlock(pageId, type, '');
          if (cmdPal) cmdPal.style.display = 'none';
          appendBlock(pageId, block);
          updateTimestamp();
        });
      });
    }

    /* Block events (delegation) */
    bindBlockEvents(pageId);
  }

  function bindBlockEvents(pageId) {
    const blocksList = container && container.querySelector('#page-blocks-list');
    if (!blocksList) return;

    /* Textarea input → autosave + auto-resize */
    blocksList.addEventListener('input', e => {
      const ta = e.target.closest('[data-block-id]');
      if (!ta) return;
      autoResize(ta);
      clearTimeout(autoSaveT);
      autoSaveT = setTimeout(() => {
        window.AndinetStorage.pages.updateBlock(pageId, ta.dataset.blockId, ta.value);
        updateTimestamp();
      }, 800);
    });

    /* Delete block */
    blocksList.addEventListener('click', e => {
      const del = e.target.closest('[data-del-block]');
      if (!del) return;
      window.AndinetStorage.pages.deleteBlock(pageId, del.dataset.delBlock);
      const blockEl = blocksList.querySelector(`[data-block="${del.dataset.delBlock}"]`);
      if (blockEl) blockEl.remove();
      updateTimestamp();
    });
  }

  function appendBlock(pageId, block) {
    const blocksList = container && container.querySelector('#page-blocks-list');
    if (!blocksList) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = renderBlock(block);
    const el = tmp.firstElementChild;
    blocksList.appendChild(el);
    // Focus textarea
    const ta = el.querySelector('textarea');
    if (ta) { autoResize(ta); ta.focus(); }
    // Re-bind events
    bindBlockEvents(pageId);
  }

  function autoResize(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  function autoResizeAll() {
    container && container.querySelectorAll('.pblock-text').forEach(autoResize);
  }

  function updateTimestamp() {
    const el = container && container.querySelector('#page-updated-label');
    if (el) el.textContent = formatDate(Date.now());
  }

  /* ─── renderList external ─── */
  function renderListPublic() {
    currentPage = null;
    renderList();
  }

  /* ─── Init ─── */
  function init(el, pageId) {
    container = el || document.getElementById('os-page-pages');
    if (!container) return;
    if (pageId) {
      openEditor(pageId);
    } else {
      renderList();
    }
  }

  /* ─── Open a specific page from outside ─── */
  function openPage(pageId) {
    openEditor(pageId);
  }

  return {
    init,
    renderList: renderListPublic,
    openPage,
  };

})();
