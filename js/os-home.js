/* ============================================================
   os-home.js — OS Home Dashboard
   Andinet v2
   window.AndinetOsHome
   ============================================================ */

(function () {
  'use strict';

  var _calYear = null;
  var _calMonth = null;
  var _clockInterval = null;

  /* ── Time helpers ────────────────────────────────────────── */

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function formatTime(d) {
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function getGreeting() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Buenos días';
    if (h >= 12 && h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /* ── Stats ───────────────────────────────────────────────── */

  function countPlannerHoy() {
    if (!window.AndinetStorage || !window.AndinetStorage.planner) return 0;
    var today = getTodayStr();
    var items = window.AndinetStorage.planner.getDay(today) || {};
    var total = 0;
    ['manana', 'tarde', 'noche'].forEach(function (block) {
      var list = items[block] || [];
      list.forEach(function (item) {
        if (!item.done) total++;
      });
    });
    return total;
  }

  function countInboxPendientes() {
    if (!window.AndinetStorage || !window.AndinetStorage.inbox) return 0;
    var items = window.AndinetStorage.inbox.getAll() || [];
    return items.filter(function (i) { return !i.done; }).length;
  }

  function countProyectosActivos() {
    if (!window.AndinetStorage || !window.AndinetStorage.proyectos) return 0;
    var items = window.AndinetStorage.proyectos.getAll() || [];
    return items.filter(function (p) { return p.estado === 'activo' || !p.estado; }).length;
  }

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* ── Mini Calendar ───────────────────────────────────────── */

  var MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  var DIAS_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  function hasTasks(dateStr) {
    if (!window.AndinetStorage || !window.AndinetStorage.planner) return false;
    var items = window.AndinetStorage.planner.getDay(dateStr) || {};
    var found = false;
    ['manana', 'tarde', 'noche'].forEach(function (b) {
      if ((items[b] || []).length > 0) found = true;
    });
    return found;
  }

  function renderMiniCal() {
    var titleEl = document.getElementById('os-mini-cal-title');
    var gridEl = document.getElementById('os-mini-cal-grid');
    if (!gridEl) return;

    var today = new Date();
    var todayStr = getTodayStr();

    if (_calYear === null) _calYear = today.getFullYear();
    if (_calMonth === null) _calMonth = today.getMonth();

    if (titleEl) {
      titleEl.textContent = MESES[_calMonth] + ' ' + _calYear;
    }

    // Day-of-week headers (Mon first)
    // Build grid: first clear then add headers + days
    gridEl.innerHTML = '';

    DIAS_CORTOS.forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'cdow';
      el.textContent = d;
      gridEl.appendChild(el);
    });

    var firstDay = new Date(_calYear, _calMonth, 1);
    // JS getDay: 0=Sun,1=Mon...6=Sat → convert to Mon-first (0=Mon…6=Sun)
    var startDow = (firstDay.getDay() + 6) % 7;
    var daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

    // Empty cells before first
    for (var e = 0; e < startDow; e++) {
      var empty = document.createElement('div');
      empty.className = 'cday empty';
      gridEl.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = _calYear + '-' + pad2(_calMonth + 1) + '-' + pad2(day);
      var cell = document.createElement('div');
      var classes = ['cday'];
      if (dateStr === todayStr) classes.push('today');
      if (hasTasks(dateStr)) classes.push('has-tasks');
      cell.className = classes.join(' ');
      cell.textContent = day;
      cell.setAttribute('data-date', dateStr);

      (function (ds) {
        cell.addEventListener('click', function () {
          window._plannerTargetDate = ds;
          if (window.AndinetRouter) {
            window.AndinetRouter.navigate('os', 'planner');
          }
        });
      })(dateStr);

      gridEl.appendChild(cell);
    }
  }

  /* ── Quick Inbox List ────────────────────────────────────── */

  function renderInboxWidget() {
    var container = document.getElementById('os-inbox-widget');
    if (!container) return;
    container.innerHTML = '';

    if (!window.AndinetStorage || !window.AndinetStorage.inbox) return;
    var items = window.AndinetStorage.inbox.getAll() || [];
    var pending = items.filter(function (i) { return !i.done; });
    var recent = pending.slice(-5).reverse();

    if (recent.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'wlink';
      empty.style.pointerEvents = 'none';
      empty.textContent = 'Sin pendientes';
      container.appendChild(empty);
      return;
    }

    recent.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'wlink';
      btn.textContent = item.texto || item.text || '(sin texto)';
      btn.addEventListener('click', function () {
        if (window.AndinetRouter) {
          window.AndinetRouter.navigate('inbox');
        }
      });
      container.appendChild(btn);
    });
  }

  /* ── Proyectos Widget ────────────────────────────────────── */

  function renderProyectosWidget() {
    var container = document.getElementById('os-proyectos-widget');
    if (!container) return;
    container.innerHTML = '';

    if (!window.AndinetStorage || !window.AndinetStorage.proyectos) return;
    var items = window.AndinetStorage.proyectos.getAll() || [];
    var activos = items.filter(function (p) {
      return p.estado === 'activo' || !p.estado;
    }).slice(0, 4);

    if (activos.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'wlink';
      empty.style.pointerEvents = 'none';
      empty.textContent = 'Sin proyectos activos';
      container.appendChild(empty);
      return;
    }

    activos.forEach(function (proyecto) {
      var btn = document.createElement('button');
      btn.className = 'wlink';
      btn.textContent = proyecto.title || proyecto.nombre || proyecto.name || '(sin nombre)';
      btn.addEventListener('click', function () {
        if (window.AndinetRouter) {
          window.AndinetRouter.navigate('proyectos');
        }
      });
      container.appendChild(btn);
    });
  }

  /* ── Refresh counters/lists ──────────────────────────────── */

  function refresh() {
    // Stats
    var statPlanner = document.getElementById('os-stat-planner');
    if (statPlanner) statPlanner.textContent = countPlannerHoy();

    var statInbox = document.getElementById('os-stat-inbox');
    if (statInbox) statInbox.textContent = countInboxPendientes();

    var statProyectos = document.getElementById('os-stat-proyectos');
    if (statProyectos) statProyectos.textContent = countProyectosActivos();

    renderMiniCal();
    renderInboxWidget();
    renderProyectosWidget();
  }

  /* ── Init ────────────────────────────────────────────────── */

  function init() {
    // Greeting
    var greetEl = document.getElementById('os-greeting');
    var cfg = (window.AndinetStorage && window.AndinetStorage.config && window.AndinetStorage.config.get()) || {};
    var nombre = cfg.nombre || '';
    if (greetEl) {
      greetEl.innerHTML = getGreeting() + (nombre ? ', <em>' + nombre + '</em>' : '');
    }

    // Clock
    var timeEl = document.getElementById('os-htime');
    function updateClock() {
      if (timeEl) timeEl.textContent = formatTime(new Date());
    }
    updateClock();
    if (_clockInterval) clearInterval(_clockInterval);
    _clockInterval = setInterval(updateClock, 60000);

    // Frase del día
    var phraseEl = document.getElementById('os-hphrase');
    if (phraseEl) {
      var frases = (window.AndinetDefaults && window.AndinetDefaults.frases) || [];
      if (frases.length > 0) {
        var idx = Math.floor(Date.now() / 86400000) % frases.length;
        phraseEl.textContent = frases[idx];
      }
    }

    // Calendar nav
    var today = new Date();
    _calYear = today.getFullYear();
    _calMonth = today.getMonth();

    var prevBtn = document.getElementById('os-cal-prev');
    var nextBtn = document.getElementById('os-cal-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        _calMonth--;
        if (_calMonth < 0) { _calMonth = 11; _calYear--; }
        renderMiniCal();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        _calMonth++;
        if (_calMonth > 11) { _calMonth = 0; _calYear++; }
        renderMiniCal();
      });
    }

    refresh();
  }

  /* ── Export ──────────────────────────────────────────────── */

  window.AndinetOsHome = {
    init: init,
    refresh: refresh,
  };
})();
