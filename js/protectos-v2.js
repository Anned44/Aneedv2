/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANDINET V2 — proyectos-v2.js
Sistema avanzado de proyectos: Kanban + Finanzas + Auto-save
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetProyectosV2 = (function () {
‘use strict’;

const STORAGE_KEY = ‘an2_proyectos_v2’;
const AUTO_SAVE_DELAY = 500; // ms
let autoSaveTimeout;
let currentProject = null;
let projectsList = [];

// ══════════════════════════════════════════════════════
// STORAGE & DATA
// ══════════════════════════════════════════════════════

function loadProjects() {
try {
const data = localStorage.getItem(STORAGE_KEY);
projectsList = data ? JSON.parse(data) : [];
return projectsList;
} catch (e) {
console.error(‘Error loading projects:’, e);
return [];
}
}

function saveProjects() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsList));
console.log(‘✓ Projects auto-saved’);
} catch (e) {
console.error(‘Error saving projects:’, e);
}
}

function autoSave() {
clearTimeout(autoSaveTimeout);
autoSaveTimeout = setTimeout(() => {
saveProjects();
}, AUTO_SAVE_DELAY);
}

// ══════════════════════════════════════════════════════
// PROJECT CRUD
// ══════════════════════════════════════════════════════

function createProject(data) {
const project = {
id: Date.now().toString(),
nombre: data.nombre || ‘Nuevo Proyecto’,
descripcion: data.descripcion || ‘’,
estado: data.estado || ‘idea’, // idea, en-progreso, completado
prioridad: data.prioridad || ‘media’,
categoria: data.categoria || [],
inicio: data.inicio || new Date().toISOString().split(‘T’)[0],
deadline: data.deadline || ‘’,
progreso: 0,
columnas: [‘Por hacer’, ‘En proceso’, ‘En revisión’, ‘Hecho’], // Customizables
tareas: {},
notas: ‘’,
archivos: [],
presupuesto: data.presupuesto || 0,
gastos: [],
historial: [],
creado: new Date().toISOString(),
actualizado: new Date().toISOString(),
};

```
// Inicializar columnas
project.columnas.forEach(col => {
  project.tareas[col] = [];
});

projectsList.push(project);
autoSave();
return project;
```

}

function getProject(id) {
return projectsList.find(p => p.id === id);
}

function updateProject(id, updates) {
const idx = projectsList.findIndex(p => p.id === id);
if (idx !== -1) {
projectsList[idx] = { …projectsList[idx], …updates, actualizado: new Date().toISOString() };
autoSave();
return projectsList[idx];
}
}

function deleteProject(id) {
projectsList = projectsList.filter(p => p.id !== id);
autoSave();
}

function duplicateProject(id) {
const original = getProject(id);
if (!original) return;

```
const dup = {
  ...original,
  id: Date.now().toString(),
  nombre: `${original.nombre} (copia)`,
  creado: new Date().toISOString(),
};

projectsList.push(dup);
autoSave();
return dup;
```

}

// ══════════════════════════════════════════════════════
// TAREAS
// ══════════════════════════════════════════════════════

function addTarea(projectId, columna, tarea) {
const project = getProject(projectId);
if (!project) return;

```
const newTarea = {
  id: Date.now().toString(),
  titulo: tarea.titulo || 'Sin título',
  descripcion: tarea.descripcion || '',
  asignado: tarea.asignado || '',
  etiquetas: tarea.etiquetas || [],
  vencimiento: tarea.vencimiento || '',
  completado: false,
  creado: new Date().toISOString(),
};

if (!project.tareas[columna]) {
  project.tareas[columna] = [];
}

project.tareas[columna].push(newTarea);
addHistorial(projectId, `Tarea agregada: ${newTarea.titulo} en ${columna}`);
updateProgreso(projectId);
autoSave();
return newTarea;
```

}

function moveTarea(projectId, tareaId, fromCol, toCol) {
const project = getProject(projectId);
if (!project) return;

```
const tareaIdx = project.tareas[fromCol].findIndex(t => t.id === tareaId);
if (tareaIdx === -1) return;

const tarea = project.tareas[fromCol].splice(tareaIdx, 1)[0];
project.tareas[toCol].push(tarea);

addHistorial(projectId, `Tarea movida: ${tarea.titulo} (${fromCol} → ${toCol})`);
updateProgreso(projectId);
autoSave();
```

}

function deleteTarea(projectId, columna, tareaId) {
const project = getProject(projectId);
if (!project) return;

```
project.tareas[columna] = project.tareas[columna].filter(t => t.id !== tareaId);
addHistorial(projectId, `Tarea eliminada`);
updateProgreso(projectId);
autoSave();
```

}

function updateProgreso(projectId) {
const project = getProject(projectId);
if (!project) return;

```
const total = Object.values(project.tareas).flat().length;
const hecho = project.tareas['Hecho']?.length || 0;
project.progreso = total > 0 ? Math.round((hecho / total) * 100) : 0;
```

}

// ══════════════════════════════════════════════════════
// FINANZAS
// ══════════════════════════════════════════════════════

function addGasto(projectId, gasto) {
const project = getProject(projectId);
if (!project) return;

```
const newGasto = {
  id: Date.now().toString(),
  descripcion: gasto.descripcion || '',
  monto: gasto.monto || 0,
  categoria: gasto.categoria || '',
  fecha: gasto.fecha || new Date().toISOString().split('T')[0],
};

project.gastos.push(newGasto);
addHistorial(projectId, `Gasto agregado: $${newGasto.monto}`);
autoSave();
return newGasto;
```

}

function deleteGasto(projectId, gastoId) {
const project = getProject(projectId);
if (!project) return;

```
project.gastos = project.gastos.filter(g => g.id !== gastoId);
autoSave();
```

}

function getTotalGastos(projectId) {
const project = getProject(projectId);
if (!project) return 0;
return project.gastos.reduce((sum, g) => sum + g.monto, 0);
}

// ══════════════════════════════════════════════════════
// ARCHIVOS & LINKS
// ══════════════════════════════════════════════════════

function addArchivo(projectId, archivo) {
const project = getProject(projectId);
if (!project) return;

```
const newArchivo = {
  id: Date.now().toString(),
  titulo: archivo.titulo || 'Sin título',
  url: archivo.url || '',
  tipo: archivo.tipo || 'link', // link, archivo, nota
  agregado: new Date().toISOString(),
};

project.archivos.push(newArchivo);
autoSave();
return newArchivo;
```

}

function deleteArchivo(projectId, archivoId) {
const project = getProject(projectId);
if (!project) return;

```
project.archivos = project.archivos.filter(a => a.id !== archivoId);
autoSave();
```

}

// ══════════════════════════════════════════════════════
// HISTORIAL
// ══════════════════════════════════════════════════════

function addHistorial(projectId, evento) {
const project = getProject(projectId);
if (!project) return;

```
project.historial.push({
  evento,
  timestamp: new Date().toISOString(),
});

// Mantener últimos 50 eventos
if (project.historial.length > 50) {
  project.historial.shift();
}

autoSave();
```

}

// ══════════════════════════════════════════════════════
// COLUMNAS CUSTOMIZABLES
// ══════════════════════════════════════════════════════

function renameColumna(projectId, oldName, newName) {
const project = getProject(projectId);
if (!project) return;

```
const idx = project.columnas.indexOf(oldName);
if (idx !== -1) {
  project.columnas[idx] = newName;
  project.tareas[newName] = project.tareas[oldName] || [];
  delete project.tareas[oldName];
  addHistorial(projectId, `Columna renombrada: ${oldName} → ${newName}`);
  autoSave();
}
```

}

function addColumna(projectId, nombreColumna) {
const project = getProject(projectId);
if (!project) return;

```
if (!project.columnas.includes(nombreColumna)) {
  project.columnas.push(nombreColumna);
  project.tareas[nombreColumna] = [];
  addHistorial(projectId, `Columna agregada: ${nombreColumna}`);
  autoSave();
}
```

}

function deleteColumna(projectId, nombreColumna) {
const project = getProject(projectId);
if (!project) return;

```
project.columnas = project.columnas.filter(c => c !== nombreColumna);
delete project.tareas[nombreColumna];
addHistorial(projectId, `Columna eliminada: ${nombreColumna}`);
autoSave();
```

}

// ══════════════════════════════════════════════════════
// BÚSQUEDA & FILTROS
// ══════════════════════════════════════════════════════

function searchProjects(query) {
return projectsList.filter(p =>
p.nombre.toLowerCase().includes(query.toLowerCase()) ||
p.descripcion.toLowerCase().includes(query.toLowerCase())
);
}

function filterByEstado(estado) {
return projectsList.filter(p => p.estado === estado);
}

function filterByCategoria(categoria) {
return projectsList.filter(p => p.categoria.includes(categoria));
}

// ══════════════════════════════════════════════════════
// ESTADÍSTICAS
// ══════════════════════════════════════════════════════

function getStats(projectId) {
const project = getProject(projectId);
if (!project) return null;

```
const totalTareas = Object.values(project.tareas).flat().length;
const tareasHechas = project.tareas['Hecho']?.length || 0;
const totalGastos = getTotalGastos(projectId);
const presupuestoRestante = project.presupuesto - totalGastos;

return {
  totalTareas,
  tareasHechas,
  porcentajeCompleto: project.progreso,
  presupuesto: project.presupuesto,
  totalGastos,
  presupuestoRestante,
  diasTranscurridos: Math.floor((Date.now() - new Date(project.creado).getTime()) / (1000 * 60 * 60 * 24)),
};
```

}

// ══════════════════════════════════════════════════════
// EXPORT & IMPORT
// ══════════════════════════════════════════════════════

function exportProject(projectId) {
const project = getProject(projectId);
if (!project) return null;

```
return JSON.stringify(project, null, 2);
```

}

function importProject(jsonString) {
try {
const project = JSON.parse(jsonString);
project.id = Date.now().toString();
projectsList.push(project);
autoSave();
return project;
} catch (e) {
console.error(‘Error importing project:’, e);
return null;
}
}

// ══════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════

function init() {
loadProjects();
console.log(‘✓ Proyectos V2 initialized’);
}

return {
init,
// Project
loadProjects,
createProject,
getProject,
updateProject,
deleteProject,
duplicateProject,
// Tareas
addTarea,
moveTarea,
deleteTarea,
// Finanzas
addGasto,
deleteGasto,
getTotalGastos,
// Archivos
addArchivo,
deleteArchivo,
// Historial
addHistorial,
// Columnas
renameColumna,
addColumna,
deleteColumna,
// Búsqueda
searchProjects,
filterByEstado,
filterByCategoria,
// Stats
getStats,
// Export/Import
exportProject,
importProject,
};
})();

// Auto-init
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => {
window.AndinetProyectosV2.init();
});
} else {
window.AndinetProyectosV2.init();
}