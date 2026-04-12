/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ANDINET V2 — storage.js
   CRUD unificado para todas las entidades (localStorage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const KEYS = {
  CONFIG:    'an2_config',
  PLANNER:   'an2_planner',
  INBOX:     'an2_inbox',
  PROYECTOS: 'an2_proyectos',
  PAGES:     'an2_pages',
  JOURNAL:   'an2_journal',
  SPACES:    'an2_spaces',
};

/* ── Helpers ── */
function uid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.warn('[Andinet] localStorage error', e); }
}

/* ════════════════════════
   CONFIG
════════════════════════ */
const configStorage = {
  defaults: {
    nombre: 'Ανδρέα',
    tema: 'noche',
    fuente: 'cormorant',
    textura: 'none',
    txImgUrl: null,
    txImgOpacity: 0.35,
    txImgSize: '220px',
  },
  get() { return { ...this.defaults, ...load(KEYS.CONFIG, {}) }; },
  save(data) { save(KEYS.CONFIG, { ...this.get(), ...data }); },
  set(key, value) { this.save({ [key]: value }); },
};

/* ════════════════════════
   PLANNER
════════════════════════ */
const plannerStorage = {
  get(date) {
    const all = load(KEYS.PLANNER, {});
    return all[date] || { morning: [], afternoon: [], night: [] };
  },
  saveDay(date, data) {
    const all = load(KEYS.PLANNER, {});
    all[date] = data;
    save(KEYS.PLANNER, all);
  },
  addItem(date, block, itemData) {
    const day = this.get(date);
    const item = {
      id: uid(),
      text: itemData.text.trim(),
      type: itemData.type || 'task',    // task|note|event|reminder
      done: false,
      priority: itemData.priority || null,
      project: itemData.project || null,
      tags: itemData.tags || [],
      createdAt: Date.now(),
    };
    day[block].push(item);
    this.saveDay(date, day);
    return item;
  },
  toggleItem(date, block, id) {
    const day = this.get(date);
    const item = day[block].find(i => i.id === id);
    if (item) { item.done = !item.done; this.saveDay(date, day); }
    return day;
  },
  deleteItem(date, block, id) {
    const day = this.get(date);
    day[block] = day[block].filter(i => i.id !== id);
    this.saveDay(date, day);
    return day;
  },
  countPending(date) {
    const day = this.get(date);
    return Object.values(day).flat().filter(i => !i.done).length;
  },
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
};

/* ════════════════════════
   INBOX
════════════════════════ */
const inboxStorage = {
  get() { return load(KEYS.INBOX, []); },
  save(items) { save(KEYS.INBOX, items); },
  add(data) {
    const items = this.get();
    const item = {
      id: uid(),
      text: data.text.trim(),
      type: data.type || 'task',        // task|note|idea|reference
      status: 'pending',                // pending|processed|reference
      priority: data.priority || null,
      area: data.area || null,
      destination: { type: null, ref: null, block: null },
      tags: data.tags || [],
      createdAt: Date.now(),
    };
    items.unshift(item);
    this.save(items);
    return item;
  },
  toggle(id) {
    const items = this.get();
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = item.status === 'pending' ? 'processed' : 'pending';
      this.save(items);
    }
    return items;
  },
  process(id, destination) {
    const items = this.get();
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = 'processed';
      item.destination = destination;
      this.save(items);
    }
    return items;
  },
  setStatus(id, status) {
    const items = this.get();
    const item = items.find(i => i.id === id);
    if (item) { item.status = status; this.save(items); }
    return items;
  },
  delete(id) {
    const items = this.get().filter(i => i.id !== id);
    this.save(items);
    return items;
  },
  countPending() { return this.get().filter(i => i.status === 'pending').length; },
};

/* ════════════════════════
   PROYECTOS
════════════════════════ */
const proyectosStorage = {
  get() {
    const stored = load(KEYS.PROYECTOS, null);
    if (!stored) {
      // Seed con ejemplo
      const defaults = window.AndinetDefaults?.proyectosEjemplo || [];
      save(KEYS.PROYECTOS, defaults);
      return defaults;
    }
    return stored;
  },
  save(list) { save(KEYS.PROYECTOS, list); },
  add(data) {
    const list = this.get();
    const project = {
      id: uid(),
      emoji: data.emoji || '◈',
      title: data.title || 'Nuevo proyecto',
      description: data.description || '',
      status: data.status || 'nuevo',
      area: data.area || 'estudio',
      color: data.color || '#7a5c9a',
      progress: 0,
      tags: data.tags || [],
      props: { inicio: null, deadline: null, links: [] },
      notes: '',
      kanban: [
        { id: uid(), name: 'Ideas', cards: [] },
        { id: uid(), name: 'En progreso', cards: [] },
        { id: uid(), name: 'Revisión', cards: [] },
        { id: uid(), name: 'Hecho', cards: [] },
      ],
      pages: [],
      createdAt: Date.now(),
    };
    list.unshift(project);
    this.save(list);
    return project;
  },
  update(id, patch) {
    const list = this.get();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...patch }; this.save(list); }
    return list[idx] || null;
  },
  delete(id) {
    const list = this.get().filter(p => p.id !== id);
    this.save(list);
  },
  getById(id) { return this.get().find(p => p.id === id) || null; },
  addKanbanCard(projectId, colId, text) {
    const list = this.get();
    const p = list.find(x => x.id === projectId);
    if (!p) return;
    const col = p.kanban.find(c => c.id === colId);
    if (!col) return;
    const card = { id: uid(), text: text.trim(), createdAt: Date.now() };
    col.cards.push(card);
    this.save(list);
    return card;
  },
  deleteKanbanCard(projectId, colId, cardId) {
    const list = this.get();
    const p = list.find(x => x.id === projectId);
    if (!p) return;
    const col = p.kanban.find(c => c.id === colId);
    if (col) { col.cards = col.cards.filter(c => c.id !== cardId); this.save(list); }
  },
  moveKanbanCard(projectId, cardId, fromColId, toColId) {
    const list = this.get();
    const p = list.find(x => x.id === projectId);
    if (!p) return;
    const fromCol = p.kanban.find(c => c.id === fromColId);
    const toCol   = p.kanban.find(c => c.id === toColId);
    if (!fromCol || !toCol) return;
    const card = fromCol.cards.find(c => c.id === cardId);
    if (!card) return;
    fromCol.cards = fromCol.cards.filter(c => c.id !== cardId);
    toCol.cards.push(card);
    this.save(list);
  },
};

/* ════════════════════════
   PAGES
════════════════════════ */
const pagesStorage = {
  get() { return load(KEYS.PAGES, []); },
  save(list) { save(KEYS.PAGES, list); },
  add(data) {
    const list = this.get();
    const page = {
      id: uid(),
      emoji: data.emoji || '○',
      title: data.title || 'Sin título',
      cover: { type: 'color', value: '#1a1625' },
      area: data.area || null,
      project: data.project || null,
      blocks: [],
      tags: data.tags || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    list.unshift(page);
    this.save(list);
    return page;
  },
  update(id, patch) {
    const list = this.get();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
      this.save(list);
    }
    return list[idx] || null;
  },
  addBlock(pageId, type, content) {
    const list = this.get();
    const page = list.find(p => p.id === pageId);
    if (!page) return;
    const block = { id: uid(), type, content: content || '', meta: {} };
    page.blocks.push(block);
    page.updatedAt = Date.now();
    this.save(list);
    return block;
  },
  updateBlock(pageId, blockId, content) {
    const list = this.get();
    const page = list.find(p => p.id === pageId);
    if (!page) return;
    const block = page.blocks.find(b => b.id === blockId);
    if (block) { block.content = content; page.updatedAt = Date.now(); this.save(list); }
  },
  deleteBlock(pageId, blockId) {
    const list = this.get();
    const page = list.find(p => p.id === pageId);
    if (!page) return;
    page.blocks = page.blocks.filter(b => b.id !== blockId);
    page.updatedAt = Date.now();
    this.save(list);
  },
  delete(id) {
    const list = this.get().filter(p => p.id !== id);
    this.save(list);
  },
  getById(id) { return this.get().find(p => p.id === id) || null; },
};

/* ════════════════════════
   JOURNAL
════════════════════════ */
const journalStorage = {
  get() { return load(KEYS.JOURNAL, {}); },
  getEntry(date) { return this.get()[date] || null; },
  saveEntry(date, content) {
    const all = this.get();
    all[date] = { date, content, updatedAt: Date.now() };
    save(KEYS.JOURNAL, all);
  },
  deleteEntry(date) {
    const all = this.get();
    delete all[date];
    save(KEYS.JOURNAL, all);
  },
  list() {
    return Object.values(this.get()).sort((a, b) => b.date.localeCompare(a.date));
  },
};

/* ════════════════════════
   SPACES (Love · Mundo · etc.)
════════════════════════ */
const spacesStorage = {
  get(space) { return load(KEYS.SPACES + '_' + space, {}); },
  save(space, data) { save(KEYS.SPACES + '_' + space, data); },
  // Love
  getLove() {
    return this.get('love') || {
      startDate: null,
      note: '',
      dreams: [],
      memories: [],
    };
  },
  saveLove(data) { this.save('love', data); },
};

/* ── Compatibility aliases for subagent-generated modules ── */
plannerStorage.getDay   = plannerStorage.get.bind(plannerStorage);
inboxStorage.getAll     = inboxStorage.get.bind(inboxStorage);
proyectosStorage.getAll = proyectosStorage.get.bind(proyectosStorage);

/* ── Export global ── */
window.AndinetStorage = {
  config:    configStorage,
  planner:   plannerStorage,
  inbox:     inboxStorage,
  proyectos: proyectosStorage,
  pages:     pagesStorage,
  journal:   journalStorage,
  spaces:    spacesStorage,
  uid,
};
