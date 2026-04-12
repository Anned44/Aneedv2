/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — router.js
   SPA routing: Portal → OS → Espacios → Config
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Router = (() => {
  const TOP_VIEWS = ['portal', 'os', 'config', 'estudio', 'creacion', 'mundo', 'loveship'];
  const OS_PAGES  = ['os-home', 'planner', 'inbox', 'proyectos', 'journaling'];

  let _onNavigate = null;
  let _current    = null;
  let _currentOs  = null;

  /* ── Activar vista top-level ── */
  function activateView(viewId) {
    TOP_VIEWS.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.classList.toggle('active', v === viewId);
    });
    _current = viewId;
  }

  /* ── Activar página dentro del OS ── */
  function activateOsPage(pageId) {
    OS_PAGES.forEach(p => {
      const el = document.getElementById('os-page-' + p);
      if (el) el.classList.toggle('active', p === pageId);
    });
    // Actualizar sidebar botones
    document.querySelectorAll('.nav-btn[data-os-page]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.osPage === pageId);
    });
    _currentOs = pageId;
  }

  /* ── Navegar ── */
  function navigate(view, osPage, push = true) {
    activateView(view);

    if (view === 'os' && osPage) {
      activateOsPage(osPage);
    }

    const hash = osPage && view === 'os' ? `${view}/${osPage}` : view;
    if (push) history.pushState({ view, osPage }, '', `#${hash}`);

    if (_onNavigate) _onNavigate(view, osPage);
  }

  /* ── Desde hash ── */
  function fromHash() {
    const hash = window.location.hash.replace('#', '') || 'portal';
    const parts = hash.split('/');
    const view   = TOP_VIEWS.includes(parts[0]) ? parts[0] : 'portal';
    const osPage = parts[1] && OS_PAGES.includes(parts[1]) ? parts[1] : 'os-home';
    return { view, osPage };
  }

  /* ── Init ── */
  function init(onNavigate) {
    _onNavigate = onNavigate;

    // Click en sidebar logo → volver al portal
    document.querySelectorAll('.sidebar-logo').forEach(el => {
      el.addEventListener('click', () => navigate('portal'));
    });

    // Botones de OS sidebar
    document.querySelectorAll('.nav-btn[data-os-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigate('os', btn.dataset.osPage);
      });
    });

    // Botones de portada (tiles)
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.dataset.nav;
        if (target.startsWith('os:')) {
          navigate('os', target.split(':')[1]);
        } else {
          navigate(target);
        }
      });
    });

    // Botón de configuración
    document.querySelectorAll('[data-nav-config]').forEach(el => {
      el.addEventListener('click', () => navigate('config'));
    });

    // Botones "volver al portal" desde secciones
    document.querySelectorAll('[data-nav-back]').forEach(el => {
      el.addEventListener('click', () => navigate('portal'));
    });

    // Botones "ir al OS" desde portada
    document.querySelectorAll('[data-nav-os]').forEach(el => {
      el.addEventListener('click', () => navigate('os', 'os-home'));
    });

    // Popstate
    window.addEventListener('popstate', () => {
      const { view, osPage } = fromHash();
      navigate(view, osPage, false);
    });

    // Ruta inicial
    const { view, osPage } = fromHash();
    navigate(view, osPage, false);
  }

  return { init, navigate, activateOsPage, current: () => _current, currentOs: () => _currentOs };
})();

window.AndinetRouter = Router;
