/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANDINET V2 — storage-compression.js
Compresión de datos en localStorage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

window.AndinetStorageCompression = (function () {
‘use strict’;

// Simple LZ string compression (for localStorage size optimization)
const compress = (str) => {
if (typeof str !== ‘string’ || str.length === 0) return str;

```
const compressed = btoa(encodeURIComponent(str));
return compressed;
```

};

const decompress = (str) => {
if (typeof str !== ‘string’ || str.length === 0) return str;

```
try {
  const decompressed = decodeURIComponent(atob(str));
  return decompressed;
} catch (e) {
  console.warn('Decompression failed, returning original:', e);
  return str;
}
```

};

// Check localStorage size
function getStorageSize() {
let total = 0;
for (let key in localStorage) {
if (localStorage.hasOwnProperty(key)) {
total += localStorage[key].length + key.length;
}
}
return (total / 1024).toFixed(2); // KB
}

// Cleanup old data
function cleanupStorage() {
const keysToCheck = [
‘an2_planner’,
‘an2_inbox’,
‘an2_proyectos’,
‘an2_journal’,
‘an2_pages’
];

```
keysToCheck.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    
    // Remove old entries (older than 90 days)
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    let cleaned = false;

    for (let k in data) {
      if (data[k].timestamp && data[k].timestamp < ninetyDaysAgo) {
        delete data[k];
        cleaned = true;
      }
    }

    if (cleaned) {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✓ Cleaned ${key}`);
    }
  } catch (e) {
    console.warn(`Error cleaning ${key}:`, e);
  }
});
```

}

// Optimize all storage
function optimizeAll() {
const before = getStorageSize();

```
// Cleanup
cleanupStorage();

const after = getStorageSize();
const saved = (before - after).toFixed(2);

console.log(`📊 Storage optimization: ${before}KB → ${after}KB (saved ${saved}KB)`);
```

}

// Export compressed data
function exportCompressed() {
const allData = {};

```
for (let key in localStorage) {
  if (key.startsWith('an2_')) {
    allData[key] = localStorage.getItem(key);
  }
}

const json = JSON.stringify(allData);
const compressed = compress(json);

console.log(`📦 Exported data: ${json.length} → ${compressed.length} chars`);
return compressed;
```

}

// Import compressed data
function importCompressed(compressed) {
try {
const json = decompress(compressed);
const data = JSON.parse(json);

```
  for (let key in data) {
    localStorage.setItem(key, data[key]);
  }

  console.log('✓ Imported compressed data');
  return true;
} catch (e) {
  console.error('Failed to import:', e);
  return false;
}
```

}

// Monitor storage quota
function monitorQuota() {
if (navigator.storage && navigator.storage.estimate) {
navigator.storage.estimate().then(estimate => {
const usage = (estimate.usage / 1024 / 1024).toFixed(2);
const quota = (estimate.quota / 1024 / 1024).toFixed(2);
const percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);

```
    console.log(`💾 Storage: ${usage}MB / ${quota}MB (${percent}%)`);

    // Warn if over 80%
    if (estimate.usage / estimate.quota > 0.8) {
      console.warn('⚠️ Storage quota > 80%, consider cleanup');
    }
  });
}
```

}

function init() {
// Run on init
optimizeAll();
monitorQuota();

```
// Run cleanup every hour
setInterval(optimizeAll, 60 * 60 * 1000);
setInterval(monitorQuota, 60 * 60 * 1000);

console.log('✓ Storage compression initialized');
```

}

return {
init,
compress,
decompress,
getStorageSize,
cleanupStorage,
optimizeAll,
exportCompressed,
importCompressed,
monitorQuota,
};
})();

// Auto-init
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => {
window.AndinetStorageCompression.init();
});
} else {
window.AndinetStorageCompression.init();
}