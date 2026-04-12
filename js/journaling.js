/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — journaling.js
   Diario personal con historial
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetJournal = (function () {

  /* ─── State ─── */
  let container    = null;
  let autoSaveT    = null;
  let viewingDate  = null;   // null → today, string → viewing past entry

  /* ─── Helpers ─── */
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function countWords(str) {
    return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
  }

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* Full day name in Spanish */
  function formatFullDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /* Short date for history list */
  function formatShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  /* ─── History items ─── */
  function renderHistory(todayDateKey) {
    const entries = window.AndinetStorage.journal.list()
      .filter(e => e.date !== todayDateKey); // Hoy se muestra arriba, no en historial

    if (!entries.length) return '';

    const items = entries.map(entry => `
      <div class="journal-entry-item" data-hist-date="${escHtml(entry.date)}">
        <span class="journal-entry-date">${escHtml(formatShort(entry.date))}</span>
        <span class="journal-entry-preview">${escHtml((entry.content || '').slice(0, 120))}</span>
      </div>`
    ).join('');

    return `
    <div class="journal-history">
      <div class="journal-history-title">Entradas anteriores</div>
      ${items}
    </div>`;
  }

  /* ─── Render today ─── */
  function render() {
    if (!container) return;
    const today      = todayKey();
    const todayEntry = window.AndinetStorage.journal.getEntry(today);
    const hasTodayEntry = !!todayEntry;

    const fullDate   = formatFullDate(today);
    // e.g. "lunes, 9 de junio de 2025"  →  split for display
    const [weekday, ...rest] = fullDate.split(', ');
    const dateLong = rest.join(', ');

    const content = (todayEntry && todayEntry.content) ? todayEntry.content : '';
    const wc = countWords(content);

    container.innerHTML = `
    <div class="journal-page">
      <div class="journal-header">
        <div class="journal-date-title">
          ${hasTodayEntry ? '<span class="journal-today-dot"></span>' : ''}
          ${escHtml(weekday)}
        </div>
        <div class="journal-date-sub">${escHtml(dateLong)}</div>
      </div>

      <textarea class="journal-textarea"
                id="journal-textarea"
                placeholder="¿Qué hay en tu mente hoy?…">${escHtml(content)}</textarea>
      <div class="journal-wordcount" id="journal-wc">${wc} ${wc === 1 ? 'palabra' : 'palabras'}</div>

      ${renderHistory(today)}
    </div>`;

    bindEvents(today);
    autoResizeTextarea();
  }

  /* ─── Render past entry ─── */
  function renderViewPast(dateKey) {
    if (!container) return;
    viewingDate = dateKey;
    const entry    = window.AndinetStorage.journal.getEntry(dateKey);
    const content  = (entry && entry.content) ? entry.content : '';
    const wc       = countWords(content);
    const fullDate = formatFullDate(dateKey);
    const [weekday, ...rest] = fullDate.split(', ');
    const dateLong = rest.join(', ');
    const today    = todayKey();

    container.innerHTML = `
    <div class="journal-page">
      <div class="journal-viewing-banner">
        <span>Viendo entrada del pasado</span>
        <button class="journal-viewing-back" id="journal-back-today">← Volver a hoy</button>
      </div>

      <div class="journal-header">
        <div class="journal-date-title">${escHtml(weekday)}</div>
        <div class="journal-date-sub">${escHtml(dateLong)}</div>
      </div>

      <textarea class="journal-textarea"
                id="journal-textarea"
                placeholder="Entrada vacía…">${escHtml(content)}</textarea>
      <div class="journal-wordcount" id="journal-wc">${wc} ${wc === 1 ? 'palabra' : 'palabras'}</div>

      ${renderHistory(today)}
    </div>`;

    bindEvents(dateKey);
    autoResizeTextarea();

    const backBtn = container.querySelector('#journal-back-today');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        viewingDate = null;
        render();
      });
    }
  }

  /* ─── Bind events ─── */
  function bindEvents(dateKey) {
    if (!container) return;

    const ta = container.querySelector('#journal-textarea');
    const wc = container.querySelector('#journal-wc');

    if (ta) {
      /* Auto-resize on input */
      ta.addEventListener('input', () => {
        autoResize(ta);

        /* Word count */
        const words = countWords(ta.value);
        if (wc) wc.textContent = `${words} ${words === 1 ? 'palabra' : 'palabras'}`;

        /* Autosave 1000ms debounce */
        clearTimeout(autoSaveT);
        autoSaveT = setTimeout(() => {
          window.AndinetStorage.journal.saveEntry(dateKey, ta.value);
          /* Refresh the today dot if we're on today */
          if (dateKey === todayKey()) {
            const dot = container.querySelector('.journal-today-dot');
            if (!dot && ta.value.trim()) {
              const dateTitle = container.querySelector('.journal-date-title');
              if (dateTitle) {
                const dotEl = document.createElement('span');
                dotEl.className = 'journal-today-dot';
                dateTitle.prepend(dotEl);
              }
            }
          }
        }, 1000);
      });
    }

    /* History click */
    container.querySelectorAll('[data-hist-date]').forEach(el => {
      el.addEventListener('click', () => {
        renderViewPast(el.dataset.histDate);
      });
    });
  }

  /* ─── Auto-resize ─── */
  function autoResize(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  function autoResizeTextarea() {
    const ta = container && container.querySelector('#journal-textarea');
    if (ta) autoResize(ta);
  }

  /* ─── Refresh ─── */
  function refresh() {
    if (viewingDate) {
      renderViewPast(viewingDate);
    } else {
      render();
    }
  }

  /* ─── Init ─── */
  function init(el) {
    container = el || document.getElementById('os-page-journaling');
    if (!container) return;
    viewingDate = null;
    render();
  }

  return { init, refresh };

})();
