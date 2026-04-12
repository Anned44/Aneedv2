/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — portal.js
   Portada principal: fecha, contadores, calendario, cita
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const Portal = (() => {
  const DIAS   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const MESES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const MESES_C = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DIAS_S = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

  let calYear, calMonth;

  /* ── Fecha actual formateada ── */
  function dateStr(d) {
    return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  }

  /* ── Actualizar contadores ── */
  function updateStats() {
    const today   = AndinetStorage.planner.todayKey();
    const pending = AndinetStorage.planner.countPending(today);
    const inbox   = AndinetStorage.inbox.countPending();
    const proyectos = AndinetStorage.proyectos.get().filter(p => p.status === 'activo').length;

    _set('portal-stat-planner', pending);
    _set('portal-stat-inbox',   inbox);
    _set('portal-stat-proyectos', proyectos);

    // Tile counts
    const allProyectos = AndinetStorage.proyectos.get();
    _set('tile-count-estudio',  allProyectos.filter(p => p.area === 'estudio').length  + ' proyectos');
    _set('tile-count-creacion', allProyectos.filter(p => p.area === 'creacion').length + ' proyectos');
    _set('tile-count-mundo',    '');
    _set('tile-count-love',     '');
  }

  function _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── Fecha en hero ── */
  function setDate() {
    const d = new Date();
    const el = document.getElementById('portal-date');
    if (el) el.textContent = dateStr(d).toUpperCase();
  }

  /* ── Cita aleatoria ── */
  function setQuote() {
    const frases = AndinetDefaults.frases;
    const el = document.getElementById('portal-quote');
    if (el) el.textContent = frases[Math.floor(Math.random() * frases.length)];
  }

  /* ── Calendario de portada ── */
  function renderCal() {
    const today = new Date();
    if (calYear === undefined) { calYear = today.getFullYear(); calMonth = today.getMonth(); }

    const titleEl = document.getElementById('portal-cal-title');
    const gridEl  = document.getElementById('portal-cal-grid');
    if (!titleEl || !gridEl) return;

    titleEl.textContent = `${MESES_C[calMonth]} ${calYear}`;

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const offset   = (firstDay + 6) % 7; // Lu=0
    const days     = new Date(calYear, calMonth + 1, 0).getDate();

    // Get planner days that have tasks this month
    const plannerAll = JSON.parse(localStorage.getItem('an2_planner') || '{}');

    let html = DIAS_S.map(d => `<span class="hcal-dow">${d}</span>`).join('');

    for (let i = 0; i < offset; i++) {
      html += `<span class="hcal-day empty"></span>`;
    }

    for (let d = 1; d <= days; d++) {
      const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
      const hasTasks = plannerAll[dateKey] && Object.values(plannerAll[dateKey]).flat().length > 0;

      let cls = 'hcal-day';
      if (isToday)  cls += ' today';
      if (hasTasks) cls += ' has-tasks';

      html += `<span class="${cls}" data-date="${dateKey}">${d}</span>`;
    }

    gridEl.innerHTML = html;

    // Click en día → ir al planner con esa fecha
    gridEl.querySelectorAll('.hcal-day:not(.empty)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        window._plannerTargetDate = dayEl.dataset.date;
        AndinetRouter.navigate('os', 'planner');
      });
    });
  }

  function prevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCal();
  }
  function nextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCal();
  }

  /* ── Init ── */
  function init() {
    setDate();
    setQuote();
    updateStats();
    renderCal();

    const prevBtn = document.getElementById('portal-cal-prev');
    const nextBtn = document.getElementById('portal-cal-next');
    if (prevBtn) prevBtn.addEventListener('click', prevMonth);
    if (nextBtn) nextBtn.addEventListener('click', nextMonth);
  }

  return { init, updateStats, renderCal };
})();

window.AndinetPortal = Portal;
