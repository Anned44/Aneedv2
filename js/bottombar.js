/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANDINET V2 — bottombar.js
Bottom bar: Day/Night mode toggle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetBottomBar = (function () {
‘use strict’;

const THEMES = {
noche: {
class: ‘’,
label: ‘Modo Noche’,
icon: ‘🌙’,
isDark: true
},
alba: {
class: ‘theme-alba’,
label: ‘Modo Alba’,
icon: ‘☀️’,
isDark: false
},
};

let currentTheme = ‘noche’;

function getStoredTheme() {
const cfg = window.AndinetStorage && window.AndinetStorage.config
? window.AndinetStorage.config.get()
: {};
return cfg.tema || ‘noche’;
}

function applyTheme(themeId) {
const themeData = THEMES[themeId];
if (!themeData) return;

```
// Remove all theme-* classes
const classes = Array.from(document.body.classList);
classes.forEach(c => {
  if (c.startsWith('theme-')) {
    document.body.classList.remove(c);
  }
});

// Apply new theme
if (themeData.class) {
  document.body.classList.add(themeData.class);
}

currentTheme = themeId;

// Save to storage
if (window.AndinetStorage && window.AndinetStorage.config) {
  window.AndinetStorage.config.set('tema', themeId);
}

// Update button with visual feedback
const btn = document.getElementById('bb-day-toggle');
if (btn) {
  btn.textContent = themeData.icon;
  btn.title = themeData.label;
  // Add/remove dark/light indicator class
  btn.classList.remove('bb-btn-dark', 'bb-btn-light');
  if (themeData.isDark) {
    btn.classList.add('bb-btn-dark');
  } else {
    btn.classList.add('bb-btn-light');
  }
}
```

}

function toggleTheme() {
const nextTheme = currentTheme === ‘noche’ ? ‘alba’ : ‘noche’;
applyTheme(nextTheme);
}

function init() {
// Create bottom bar if it doesn’t exist
let bottomBar = document.getElementById(‘bottom-bar’);
if (!bottomBar) {
bottomBar = document.createElement(‘div’);
bottomBar.id = ‘bottom-bar’;
bottomBar.className = ‘bottom-bar’;
bottomBar.innerHTML = `<button class="bb-btn bb-btn-dark" id="bb-day-toggle" title="Modo Noche">🌙</button>`;
document.body.appendChild(bottomBar);
}

```
// Bind events
const btn = document.getElementById('bb-day-toggle');
if (btn) {
  btn.addEventListener('click', toggleTheme);
}

// Load saved theme
const savedTheme = getStoredTheme();
applyTheme(savedTheme);
```

}

return {
init,
toggleTheme,
applyTheme,
};
})();

// Auto-init when DOM is ready
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => {
window.AndinetBottomBar.init();
});
} else {
window.AndinetBottomBar.init();
}