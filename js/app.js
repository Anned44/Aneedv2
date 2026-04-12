/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — app.js
   Orquestación global: init, routing, FAB, showToast
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ── Global showToast ── */
(function () {
  let _toastTimer = null;

  window.showToast = function (msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  };
})();

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN INIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function () {
  'use strict';

  /* ── onNavigate callback ── */
  function onNavigate(view, osPage) {

    /* Portal */
    if (view === 'portal') {
      if (window.AndinetPortal) window.AndinetPortal.init();
    }

    /* Config */
    if (view === 'config') {
      if (window.AndinetConfig) window.AndinetConfig.init();
    }

    /* OS pages */
    if (view === 'os') {
      if (osPage === 'os-home') {
        if (window.AndinetOsHome) window.AndinetOsHome.init();
      }
      if (osPage === 'planner') {
        if (window.AndinetPlanner) {
          // Support navigation from calendar
          const targetDate = window._plannerTargetDate;
          if (targetDate) {
            window._plannerTargetDate = null;
            window.AndinetPlanner.init(null, targetDate);
          } else {
            window.AndinetPlanner.init();
          }
        }
      }
      if (osPage === 'inbox') {
        if (window.AndinetInbox) window.AndinetInbox.init();
      }
      if (osPage === 'proyectos') {
        if (window.AndinetProyectos) window.AndinetProyectos.init();
      }
      if (osPage === 'journaling') {
        if (window.AndinetJournal) window.AndinetJournal.init();
      }
    }

    /* Espacios */
    if (view === 'estudio') {
      if (window.AndinetSpaces) window.AndinetSpaces.init();
    }
    if (view === 'creacion') {
      if (window.AndinetSpaces) window.AndinetSpaces.init();
    }
    if (view === 'mundo') {
      if (window.AndinetSpaces) window.AndinetSpaces.init();
    }
    if (view === 'loveship') {
      if (window.AndinetSpaces) window.AndinetSpaces.init();
    }
  }

  /* ── Apply saved config immediately ── */
  function applyInitialConfig() {
    if (!window.AndinetConfig) return;
    const cfg = window.AndinetStorage?.config?.get() || {};
    window.AndinetConfig.applyConfig(cfg);
  }

  /* ── FAB ── */
  function initFAB() {
    const fab     = document.getElementById('fab');
    const modal   = document.getElementById('fab-modal');
    const mClose  = document.getElementById('fab-modal-close');
    const toInbox = document.getElementById('fab-to-inbox');
    const toPlan  = document.getElementById('fab-to-planner');

    if (!fab || !modal) return;

    fab.addEventListener('click', () => {
      modal.classList.add('open');
      setTimeout(() => document.getElementById('fab-text')?.focus(), 50);
    });

    mClose?.addEventListener('click', closeFABModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeFABModal();
    });

    toInbox?.addEventListener('click', () => {
      const text = document.getElementById('fab-text')?.value.trim();
      if (!text) { showToast('Escribe algo primero'); return; }
      const type = document.getElementById('fab-type')?.value || 'task';
      const prio = document.getElementById('fab-prio')?.value || '';
      window.AndinetStorage.inbox.add({ text, type, priority: prio });
      showToast('Enviado al Inbox ✓');
      closeFABModal();
      // Refresh inbox if open
      if (window.AndinetRouter?.currentOs() === 'inbox' && window.AndinetInbox) {
        window.AndinetInbox.refresh();
      }
    });

    toPlan?.addEventListener('click', () => {
      const text = document.getElementById('fab-text')?.value.trim();
      if (!text) { showToast('Escribe algo primero'); return; }
      const type = document.getElementById('fab-type')?.value || 'task';
      const prio = document.getElementById('fab-prio')?.value || '';
      const today = window.AndinetStorage.planner.todayKey();
      window.AndinetStorage.planner.addItem(today, 'morning', { text, type, priority: prio });
      showToast('Enviado al Planner ✓');
      closeFABModal();
      // Refresh planner if open
      if (window.AndinetRouter?.currentOs() === 'planner' && window.AndinetPlanner) {
        window.AndinetPlanner.refresh();
      }
    });

    // Keyboard shortcut: Ctrl+Space to open FAB
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
        e.preventDefault();
        fab.click();
      }
    });
  }

  function closeFABModal() {
    const modal = document.getElementById('fab-modal');
    if (modal) modal.classList.remove('open');
    const ta = document.getElementById('fab-text');
    if (ta) ta.value = '';
  }

  /* ── Init ── */
  function init() {
    // Apply config theme/font before anything renders
    applyInitialConfig();

    // Init spaces (they render themselves into their view divs)
    if (window.AndinetSpaces) window.AndinetSpaces.init();

    // Init router (this fires initial navigation and binds data-nav clicks)
    if (window.AndinetRouter) {
      window.AndinetRouter.init(onNavigate);
    }

    // Init FAB
    initFAB();

    // Update portal time every minute
    setInterval(() => {
      const timeEl = document.getElementById('portal-footer-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
      }
    }, 60000);

    // Initial footer time
    const timeEl = document.getElementById('portal-footer-time');
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }

    console.log('[Andinet] v2 iniciado ✓');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
