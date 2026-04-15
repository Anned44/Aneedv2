/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANDINET V2 — lazy-loader.js
Lazy loading de módulos para performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetLazyLoader = (function () {
‘use strict’;

const loadedModules = new Set();
const moduleMap = {
// Portal (always loaded)
portal: null,

```
// OS modules (load on demand)
'os-home': 'js/os-home.js',
planner: 'js/planner.js',
inbox: 'js/inbox.js',
proyectos: 'js/proyectos.js',
journaling: 'js/journaling.js',

// Spaces (load on demand)
estudio: 'js/spaces.js',
creacion: 'js/spaces.js',
mundo: 'js/spaces.js',
loveship: 'js/spaces.js',

// Config (load on demand)
config: 'js/config.js',
```

};

function loadScript(src) {
return new Promise((resolve, reject) => {
if (!src) {
resolve();
return;
}

```
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  
  script.onload = () => resolve();
  script.onerror = () => reject(new Error(`Failed to load ${src}`));
  
  document.head.appendChild(script);
});
```

}

async function loadModule(moduleName) {
if (loadedModules.has(moduleName)) {
return; // Already loaded
}

```
const src = moduleMap[moduleName];
if (!src) {
  console.warn(`Module ${moduleName} not found in map`);
  return;
}

try {
  await loadScript(src);
  loadedModules.add(moduleName);
  console.log(`✓ Loaded module: ${moduleName}`);
} catch (err) {
  console.error(`✗ Error loading ${moduleName}:`, err);
}
```

}

async function loadView(viewName) {
// Extract module name from view name
const moduleName = viewName.replace(‘view-’, ‘’).split(’-’)[0]; // portal, os, config, estudio, etc.

```
// Load corresponding module
if (moduleName === 'os') {
  // OS views need specific modules
  const page = viewName.replace('view-os-', '');
  await loadModule(page || 'os-home');
} else {
  await loadModule(moduleName);
}
```

}

function observeViewChanges() {
// Watch for route changes and load modules on demand
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
if (mutation.type === ‘attributes’ && mutation.attributeName === ‘class’) {
const target = mutation.target;
const classes = target.className;

```
      // Check if a view became active
      if (classes.includes('active')) {
        const viewId = target.id;
        if (viewId && viewId.startsWith('view-')) {
          loadView(viewId);
        }
      }
    }
  });
});

// Observe all views
document.querySelectorAll('[id^="view-"]').forEach(view => {
  observer.observe(view, { attributes: true, attributeFilter: ['class'] });
});
```

}

function preloadCritical() {
// Preload modules that are likely to be used soon
const criticalModules = [‘os-home’, ‘planner’, ‘inbox’];

```
// Preload after initial render (200ms delay)
setTimeout(() => {
  criticalModules.forEach(mod => {
    if (!loadedModules.has(mod)) {
      loadScript(moduleMap[mod]).then(() => {
        loadedModules.add(mod);
      }).catch(err => console.warn(`Preload failed for ${mod}:`, err));
    }
  });
}, 200);
```

}

function init() {
// Mark portal as loaded (it’s in HTML)
loadedModules.add(‘portal’);

```
// Start watching for view changes
observeViewChanges();

// Preload critical modules
preloadCritical();

console.log('✓ Lazy loader initialized');
```

}

return {
init,
loadModule,
loadView,
isLoaded: (moduleName) => loadedModules.has(moduleName),
};
})();

// Auto-init
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => {
window.AndinetLazyLoader.init();
});
} else {
window.AndinetLazyLoader.init();
}