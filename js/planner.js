/* ============================================================
   planner.js — Planner completo del OS
   Andinet v2
   window.AndinetPlanner
   ============================================================ */

(function () {
  'use strict';

  /* ── State ───────────────────────────────────────────────── */

  var _currentDate = null; // YYYY-MM-DD
  var _blockState = { manana: true, tarde: true, noche: true }; // expanded
  var _blockType = { manana: 'task', tarde: 'task', noche: 'task' };
  var _blockPrio = { manana: 'media', tarde: 'media', noche: 'media' };
  var _blockProject = { manana: null, tarde: null, noche: null };
  var _listenersInit = false;

  /* ── Date helpers ────────────────────────────────────────── */

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function toDateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function todayStr() { return toDateStr(new Date()); }

  function parseDate(str) {
    var p = str.split('-');
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  }

  function addDays(str, n) {
    var d = parseDate(str);
    d.setDate(d.getDate() + n);
    return toDateStr(d);
  }

  function formatDayTitle(str) {
    var d = parseDate(str);
    var dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return dias[d.getDay()] + ' ' + d.getDate() + ' de ' + meses[d.getMonth()];
  }

  function formatDaySubtitle(str) {
    var d = parseDate(str);
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return str + ' · ' + meses[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ── Storage shortcuts ───────────────────────────────────── */

  function getPlannerDay(date) {
    if (!window.AndinetStorage || !window.AndinetStorage.planner) return {};
    return window.AndinetStorage.planner.getDay(date) || {};
  }

  function getBlockItems(date, block) {
    var day = getPlannerDay(date);
    return day[block] || [];
  }

  function getAllItems(date) {
    var all = [];
    ['manana', 'tarde', 'noche'].forEach(function (b) {
      getBlockItems(date, b).forEach(function (item) {
        all.push({ block: b, item: item });
      });
    });
    return all;
  }

  /* ── Priority color ──────────────────────────────────────── */

  var PRIO_COLORS = {
    alta: '#c86e6e',
    media: 'var(--amber)',
    baja: 'var(--green)',
  };

  /* ── Projects helper ─────────────────────────────────────── */

  function getActiveProjects() {
    if (!window.AndinetStorage || !window.AndinetStorage.proyectos) return [];
    var all = window.AndinetStorage.proyectos.getAll() || [];
    return all.filter(function (p) { return p.estado === 'activo' || !p.estado; });
  }

  function getProjectById(id) {
    var projs = getActiveProjects();
    for (var i = 0; i < projs.length; i++) {
      if (projs[i].id === id) return projs[i];
    }
    return null;
  }

  /* ── Render week strip ───────────────────────────────────── */

  function renderWeekStrip() {
    var container = document.getElementById('planner-week-strip');
    if (!container) return;
    container.innerHTML = '';

    var DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    var current = parseDate(_currentDate);
    var dow = (current.getDay() + 6) % 7; // 0=Mon
    var monday = new Date(current);
    monday.setDate(current.getDate() - dow);

    for (var i = 0; i < 7; i++) {
      var d = new Date(monday);
      d.setDate(monday.getDate() + i);
      var ds = toDateStr(d);
      var isActive = ds === _currentDate;

      var cell = document.createElement('div');
      cell.className = 'wday' + (isActive ? ' active' : '');
      cell.setAttribute('data-date', ds);

      var dn = document.createElement('div');
      dn.className = 'wdn';
      dn.textContent = DIAS[i];

      var dd = document.createElement('div');
      dd.className = 'wdd';
      dd.textContent = d.getDate();

      // Dots for tasks
      var dots = document.createElement('div');
      dots.className = 'wday-dots';
      var items = getAllItems(ds);
      var pendiente = items.filter(function (x) { return !x.item.done; }).length;
      var completado = items.filter(function (x) { return x.item.done; }).length;
      if (pendiente > 0) {
        var dot = document.createElement('div');
        dot.className = 'wday-dot';
        dot.style.background = 'var(--grape2)';
        dots.appendChild(dot);
      }
      if (completado > 0) {
        var dot2 = document.createElement('div');
        dot2.className = 'wday-dot';
        dot2.style.background = 'var(--green)';
        dots.appendChild(dot2);
      }

      cell.appendChild(dn);
      cell.appendChild(dd);
      cell.appendChild(dots);

      (function (dateStr) {
        cell.addEventListener('click', function () {
          _currentDate = dateStr;
          render();
        });
      })(ds);

      container.appendChild(cell);
    }
  }

  /* ── Render day summary ──────────────────────────────────── */

  function renderDaySummary() {
    var items = getAllItems(_currentDate);
    var total = items.length;
    var completados = items.filter(function (x) { return x.item.done; }).length;
    var pendientes = total - completados;

    var elTotal = document.getElementById('planner-total');
    var elComp = document.getElementById('planner-completados');
    var elPend = document.getElementById('planner-pendientes');

    if (elTotal) elTotal.textContent = total;
    if (elComp) elComp.textContent = completados;
    if (elPend) elPend.textContent = pendientes;
  }

  /* ── Migrate banner ──────────────────────────────────────── */

  function renderMigrateBanner() {
    var banner = document.getElementById('planner-migrate-banner');
    if (!banner) return;

    var yesterday = addDays(_currentDate, -1);
    var yesterdayItems = getAllItems(yesterday);
    var pending = yesterdayItems.filter(function (x) { return !x.item.done; });

    if (pending.length === 0) {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'flex';
    var textEl = banner.querySelector('.migrate-text');
    if (textEl) {
      textEl.textContent = pending.length + ' tarea' + (pending.length > 1 ? 's' : '') +
        ' pendiente' + (pending.length > 1 ? 's' : '') + ' de ayer sin completar';
    }

    var btn = banner.querySelector('.migrate-btn');
    if (btn) {
      btn.onclick = function () {
        pending.forEach(function (x) {
          var newItem = Object.assign({}, x.item, { migrated: true, done: false });
          delete newItem.id;
          if (window.AndinetStorage && window.AndinetStorage.planner) {
            window.AndinetStorage.planner.addItem(_currentDate, x.block, newItem);
          }
        });
        banner.style.display = 'none';
        renderBlocks();
        renderDaySummary();
        renderWeekStrip();
        if (typeof showToast === 'function') showToast('Tareas migradas');
      };
    }
  }

  /* ── Render single task item ─────────────────────────────── */

  function renderTaskItem(item, block) {
    var el = document.createElement('div');
    el.className = 'task-item' + (item.done ? ' done' : '');
    el.setAttribute('data-id', item.id);

    // Checkbox
    var chk = document.createElement('div');
    chk.className = 'tchk';
    chk.innerHTML = item.done ? '✓' : '';
    chk.addEventListener('click', function () {
      if (window.AndinetStorage && window.AndinetStorage.planner) {
        window.AndinetStorage.planner.toggleItem(_currentDate, block, item.id);
      }
      renderBlocks();
      renderDaySummary();
      renderWeekStrip();
    });

    // Text
    var txt = document.createElement('div');
    txt.className = 'ttxt';
    txt.textContent = item.text || item.texto || '';

    // Priority dot
    if (item.priority && item.priority !== 'media') {
      var dot = document.createElement('div');
      dot.className = 'tpdot';
      dot.style.background = PRIO_COLORS[item.priority] || 'var(--muted)';
      el.appendChild(dot);
    }

    // Migrate badge
    if (item.migrated) {
      var mb = document.createElement('span');
      mb.className = 'migrate-badge';
      mb.textContent = 'migrado';
      el.appendChild(chk);
      el.appendChild(txt);
      el.appendChild(mb);
    } else {
      el.appendChild(chk);
      el.appendChild(txt);
    }

    // Project badge
    if (item.project) {
      var proj = getProjectById(item.project);
      if (proj) {
        var pb = document.createElement('span');
        pb.className = 'task-proj-badge';
        pb.textContent = proj.nombre || proj.name || item.project;
        pb.addEventListener('click', function () {
          if (window.AndinetRouter) window.AndinetRouter.navigate('proyectos');
        });
        el.appendChild(pb);
      }
    }

    // Actions
    var actions = document.createElement('div');
    actions.className = 'task-actions';

    // Migrate to next day
    var migBtn = document.createElement('button');
    migBtn.className = 'tact';
    migBtn.title = 'Migrar al día siguiente';
    migBtn.textContent = '→';
    migBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var nextDay = addDays(_currentDate, 1);
      var newItem = Object.assign({}, item, { migrated: true, done: false });
      delete newItem.id;
      if (window.AndinetStorage && window.AndinetStorage.planner) {
        window.AndinetStorage.planner.addItem(nextDay, block, newItem);
      }
      if (typeof showToast === 'function') showToast('Migrado al ' + nextDay);
    });

    // Delete
    var delBtn = document.createElement('button');
    delBtn.className = 'tact del';
    delBtn.title = 'Eliminar';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.AndinetStorage && window.AndinetStorage.planner) {
        window.AndinetStorage.planner.deleteItem(_currentDate, block, item.id);
      }
      renderBlocks();
      renderDaySummary();
      renderWeekStrip();
    });

    actions.appendChild(migBtn);
    actions.appendChild(delBtn);
    el.appendChild(actions);

    return el;
  }

  /* ── Project picker ──────────────────────────────────────── */

  function showProjectPicker(inputEl, block, onSelect) {
    // Remove existing picker
    var existing = document.getElementById('proj-picker-' + block);
    if (existing) existing.remove();

    var projs = getActiveProjects();
    if (projs.length === 0) return;

    var picker = document.createElement('div');
    picker.className = 'proj-picker';
    picker.id = 'proj-picker-' + block;

    projs.forEach(function (p) {
      var btn = document.createElement('button');
      btn.className = 'proj-picker-item';
      btn.textContent = (p.emoji ? p.emoji + ' ' : '') + (p.nombre || p.name || p.id);
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        onSelect(p);
        picker.remove();
        // Remove @ from input
        var val = inputEl.value;
        var atIdx = val.lastIndexOf('@');
        if (atIdx !== -1) {
          inputEl.value = val.slice(0, atIdx);
        }
      });
      picker.appendChild(btn);
    });

    var wrap = inputEl.parentElement;
    wrap.style.position = 'relative';
    wrap.appendChild(picker);

    // Close on outside click
    function onOutside(e) {
      if (!picker.contains(e.target) && e.target !== inputEl) {
        picker.remove();
        document.removeEventListener('click', onOutside);
      }
    }
    setTimeout(function () {
      document.addEventListener('click', onOutside);
    }, 0);
  }

  /* ── Render a single block ───────────────────────────────── */

  var BLOCK_LABELS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
  var BLOCK_ICONS = { manana: '☀', tarde: '⛅', noche: '🌙' };
  var TYPE_OPTS = ['task', 'note', 'event', 'reminder'];
  var TYPE_LABELS = { task: 'Tarea', note: 'Nota', event: 'Evento', reminder: 'Recordatorio' };
  var PRIO_OPTS = ['alta', 'media', 'baja'];

  function renderBlock(block) {
    var container = document.getElementById('planner-block-' + block);
    if (!container) return;
    container.innerHTML = '';

    var items = getBlockItems(_currentDate, block);
    var expanded = _blockState[block];

    // Header
    var header = document.createElement('div');
    header.className = 'block-header ' + block + (expanded ? '' : ' collapsed');

    var titleWrap = document.createElement('div');
    titleWrap.className = 'block-title ' + block;

    var icon = document.createElement('span');
    icon.textContent = BLOCK_ICONS[block];

    var label = document.createElement('span');
    label.textContent = BLOCK_LABELS[block];

    var count = document.createElement('span');
    count.className = 'block-count';
    var pending = items.filter(function (i) { return !i.done; }).length;
    count.textContent = '(' + pending + '/' + items.length + ')';

    titleWrap.appendChild(icon);
    titleWrap.appendChild(label);
    titleWrap.appendChild(count);

    var chevron = document.createElement('span');
    chevron.className = 'block-chevron';
    chevron.textContent = '▾';

    header.appendChild(titleWrap);
    header.appendChild(chevron);

    header.addEventListener('click', function () {
      _blockState[block] = !_blockState[block];
      renderBlock(block);
    });

    container.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'block-body' + (expanded ? '' : ' collapsed');

    // Type opts
    var typeOpts = document.createElement('div');
    typeOpts.className = 'block-opts';
    TYPE_OPTS.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'bopt' + (_blockType[block] === t ? ' active' : '');
      btn.textContent = TYPE_LABELS[t];
      btn.addEventListener('click', function () {
        _blockType[block] = t;
        renderBlock(block);
      });
      typeOpts.appendChild(btn);
    });
    body.appendChild(typeOpts);

    // Priority opts
    var prioOpts = document.createElement('div');
    prioOpts.className = 'block-opts';
    PRIO_OPTS.forEach(function (p) {
      var btn = document.createElement('button');
      btn.className = 'bopt p-' + p + (_blockPrio[block] === p ? ' active' : '');
      btn.textContent = p.charAt(0).toUpperCase() + p.slice(1);
      btn.addEventListener('click', function () {
        _blockPrio[block] = p;
        renderBlock(block);
      });
      prioOpts.appendChild(btn);
    });
    body.appendChild(prioOpts);

    // Add row
    var addRow = document.createElement('div');
    addRow.className = 'block-add-row';

    var input = document.createElement('input');
    input.className = 'block-input';
    input.type = 'text';
    input.placeholder = 'Añadir ' + TYPE_LABELS[_blockType[block]].toLowerCase() + '…';

    // @ project picker
    input.addEventListener('input', function () {
      var val = input.value;
      var atIdx = val.lastIndexOf('@');
      if (atIdx !== -1 && (atIdx === 0 || val[atIdx - 1] === ' ')) {
        showProjectPicker(input, block, function (proj) {
          _blockProject[block] = proj.id;
          if (typeof showToast === 'function') {
            showToast('Proyecto: ' + (proj.nombre || proj.name));
          }
        });
      }
    });

    var addBtn = document.createElement('button');
    addBtn.className = 'block-add-btn';
    addBtn.textContent = '+';
    addBtn.setAttribute('aria-label', 'Añadir');

    function doAdd() {
      var text = input.value.replace(/@\S*/g, '').trim();
      if (!text) return;
      var newItem = {
        text: text,
        type: _blockType[block],
        priority: _blockPrio[block],
        project: _blockProject[block] || null,
        done: false,
      };
      if (window.AndinetStorage && window.AndinetStorage.planner) {
        window.AndinetStorage.planner.addItem(_currentDate, block, newItem);
      }
      input.value = '';
      _blockProject[block] = null;
      renderBlock(block);
      renderDaySummary();
      renderWeekStrip();
    }

    addBtn.addEventListener('click', doAdd);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') doAdd();
      if (e.key === 'Escape') {
        var picker = document.getElementById('proj-picker-' + block);
        if (picker) picker.remove();
      }
    });

    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    body.appendChild(addRow);

    // Task list
    var taskList = document.createElement('div');
    taskList.className = 'task-list';
    items.forEach(function (item) {
      taskList.appendChild(renderTaskItem(item, block));
    });
    body.appendChild(taskList);

    container.appendChild(body);
  }

  /* ── Render all blocks ───────────────────────────────────── */

  function renderBlocks() {
    renderBlock('manana');
    renderBlock('tarde');
    renderBlock('noche');
  }

  /* ── Render header ───────────────────────────────────────── */

  function renderHeader() {
    var titleEl = document.getElementById('planner-day-title');
    var subEl = document.getElementById('planner-day-sub');
    if (titleEl) titleEl.textContent = formatDayTitle(_currentDate);
    if (subEl) subEl.textContent = formatDaySubtitle(_currentDate);
  }

  /* ── Full render ─────────────────────────────────────────── */

  function render() {
    renderHeader();
    renderWeekStrip();
    renderDaySummary();
    renderMigrateBanner();
    renderBlocks();
  }

  /* ── Refresh (re-render without re-init listeners) ───────── */

  function refresh() {
    renderDaySummary();
    renderWeekStrip();
    renderBlocks();
    renderMigrateBanner();
  }

  /* ── Init ────────────────────────────────────────────────── */

  function init() {
    // Check for target date from OS calendar
    if (window._plannerTargetDate) {
      _currentDate = window._plannerTargetDate;
      window._plannerTargetDate = null;
    } else {
      _currentDate = todayStr();
    }

    // Nav buttons (bind only once)
    if (!_listenersInit) {
      var prevBtn = document.getElementById('planner-prev');
      var nextBtn = document.getElementById('planner-next');
      var todayBtn = document.getElementById('planner-today');

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          _currentDate = addDays(_currentDate, -1);
          render();
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          _currentDate = addDays(_currentDate, 1);
          render();
        });
      }
      if (todayBtn) {
        todayBtn.addEventListener('click', function () {
          _currentDate = todayStr();
          render();
        });
      }

      _listenersInit = true;
    }

    render();
  }

  /* ── Export ──────────────────────────────────────────────── */

  window.AndinetPlanner = {
    init: init,
    refresh: refresh,
  };
})();
