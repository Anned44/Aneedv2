/* ============================================================
   config.js — Vista de Configuración
   Andinet v2
   window.AndinetConfig
   ============================================================ */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */

  function loadFontLink(id, url) {
    if (document.getElementById('font-link-' + id)) return;
    var link = document.createElement('link');
    link.id = 'font-link-' + id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  /* ── Core apply functions ────────────────────────────────── */

  function applyTheme(themeId) {
    // Remove all theme-* classes
    var classes = Array.from(document.body.classList);
    classes.forEach(function (c) {
      if (c.startsWith('theme-')) {
        document.body.classList.remove(c);
      }
    });
    // 'noche' is the default (no extra class)
    if (themeId && themeId !== 'noche') {
      document.body.classList.add('theme-' + themeId);
    }
  }

  function applyFont(fontId) {
    var temas = (window.AndinetDefaults && window.AndinetDefaults.fuentes) || [];
    var font = null;
    for (var i = 0; i < temas.length; i++) {
      if (temas[i].id === fontId) { font = temas[i]; break; }
    }
    if (!font) return;
    if (font.url) {
      loadFontLink(font.id, font.url);
    }
    if (font.serif) {
      document.documentElement.style.setProperty('--serif', font.serif);
    }
    if (font.sans) {
      document.documentElement.style.setProperty('--sans', font.sans);
    }
    if (font.mono) {
      document.documentElement.style.setProperty('--mono', font.mono);
    }
  }

  function applyTexture(textureId) {
    // Remove all tx-* classes from body
    var classes = Array.from(document.body.classList);
    classes.forEach(function (c) {
      if (c.startsWith('tx-')) {
        document.body.classList.remove(c);
      }
    });
    if (textureId && textureId !== 'none') {
      document.body.classList.add('tx-' + textureId);
    }
  }

  function applyConfig(cfg) {
    if (!cfg) return;
    if (cfg.tema) applyTheme(cfg.tema);
    if (cfg.fuente) applyFont(cfg.fuente);
    if (cfg.textura) applyTexture(cfg.textura);
  }

  /* ── Render helpers ──────────────────────────────────────── */

  function renderThemes(container, cfg) {
    var temas = (window.AndinetDefaults && window.AndinetDefaults.temas) || [];
    container.innerHTML = '';
    temas.forEach(function (tema) {
      var card = document.createElement('div');
      card.className = 'cfg-theme-card' + (cfg.tema === tema.id ? ' active' : '');
      card.setAttribute('data-id', tema.id);

      // Swatches
      var swatches = document.createElement('div');
      swatches.className = 'cfg-swatches';
      (tema.swatches || []).forEach(function (color) {
        var s = document.createElement('div');
        s.className = 'cfg-swatch';
        s.style.background = color;
        swatches.appendChild(s);
      });

      // Name
      var name = document.createElement('div');
      name.className = 'cfg-theme-name';
      name.textContent = tema.nombre || tema.id;

      card.appendChild(swatches);
      card.appendChild(name);

      card.addEventListener('click', function () {
        cfg.tema = tema.id;
        applyTheme(tema.id);
        if (window.AndinetStorage && window.AndinetStorage.config) {
          window.AndinetStorage.config.set('tema', tema.id);
        }
        // Update active states
        container.querySelectorAll('.cfg-theme-card').forEach(function (c) {
          c.classList.toggle('active', c.getAttribute('data-id') === tema.id);
        });
        if (typeof showToast === 'function') showToast('Tema aplicado');
      });

      container.appendChild(card);
    });
  }

  function renderFonts(container, cfg) {
    var fuentes = (window.AndinetDefaults && window.AndinetDefaults.fuentes) || [];
    container.innerHTML = '';
    fuentes.forEach(function (fuente) {
      var card = document.createElement('div');
      card.className = 'cfg-font-card' + (cfg.fuente === fuente.id ? ' active' : '');
      card.setAttribute('data-id', fuente.id);

      // Load font if needed
      if (fuente.url) loadFontLink(fuente.id, fuente.url);

      var sample = document.createElement('div');
      sample.className = 'cfg-font-sample';
      sample.style.fontFamily = fuente.serif || fuente.sans || 'inherit';
      sample.textContent = fuente.sample || 'Andinet';

      var nameEl = document.createElement('div');
      nameEl.className = 'cfg-font-name';
      nameEl.textContent = fuente.nombre || fuente.id;

      var pair = document.createElement('div');
      pair.className = 'cfg-font-pair';
      pair.textContent = fuente.par || '';

      card.appendChild(sample);
      card.appendChild(nameEl);
      card.appendChild(pair);

      card.addEventListener('click', function () {
        cfg.fuente = fuente.id;
        applyFont(fuente.id);
        if (window.AndinetStorage && window.AndinetStorage.config) {
          window.AndinetStorage.config.set('fuente', fuente.id);
        }
        container.querySelectorAll('.cfg-font-card').forEach(function (c) {
          c.classList.toggle('active', c.getAttribute('data-id') === fuente.id);
        });
        if (typeof showToast === 'function') showToast('Fuente aplicada');
      });

      container.appendChild(card);
    });
  }

  function renderTexturas(container, cfg) {
    var texturas = (window.AndinetDefaults && window.AndinetDefaults.texturas) || [];
    container.innerHTML = '';
    texturas.forEach(function (tex) {
      var btn = document.createElement('button');
      btn.className = 'cfg-tex-btn' + (cfg.textura === tex.id ? ' active' : '');
      btn.setAttribute('data-id', tex.id);
      btn.textContent = tex.nombre || tex.id;

      btn.addEventListener('click', function () {
        cfg.textura = tex.id;
        applyTexture(tex.id);
        if (window.AndinetStorage && window.AndinetStorage.config) {
          window.AndinetStorage.config.set('textura', tex.id);
        }
        container.querySelectorAll('.cfg-tex-btn').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-id') === tex.id);
        });
        // Show/hide image upload wrap
        var imgWrap = document.getElementById('cfg-tx-img-wrap');
        if (imgWrap) {
          imgWrap.classList.toggle('visible', tex.id === 'imagen');
        }
        if (typeof showToast === 'function') showToast('Textura aplicada');
      });

      container.appendChild(btn);
    });
  }

  /* ── Backup / Restore ────────────────────────────────────── */

  function doBackup() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith('an2_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'andinet-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Backup descargado');
  }

  function doRestore() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var data = JSON.parse(e.target.result);
          Object.keys(data).forEach(function (key) {
            if (key.startsWith('an2_')) {
              localStorage.setItem(key, JSON.stringify(data[key]));
            }
          });
          if (typeof showToast === 'function') showToast('Datos restaurados — recargando…');
          setTimeout(function () { location.reload(); }, 1200);
        } catch (err) {
          if (typeof showToast === 'function') showToast('Error al leer el archivo');
        }
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  /* ── Init ────────────────────────────────────────────────── */

  function init() {
    var storage = window.AndinetStorage;
    var cfg = (storage && storage.config && storage.config.get()) || {};

    // Apply persisted config immediately
    applyConfig(cfg);

    /* ── Nombre input ──────────────────────────────────────── */
    var nombreInput = document.getElementById('cfg-nombre-input');
    if (nombreInput) {
      nombreInput.value = cfg.nombre || '';
      nombreInput.addEventListener('input', function () {
        var val = nombreInput.value;
        if (storage && storage.config) {
          storage.config.set('nombre', val);
        }
        var portalTitle = document.getElementById('portal-title');
        if (portalTitle) portalTitle.textContent = val || 'Andinet';
      });
    }

    /* ── Temas ─────────────────────────────────────────────── */
    var themesGrid = document.getElementById('cfg-themes-grid');
    if (themesGrid) renderThemes(themesGrid, cfg);

    /* ── Fuentes ───────────────────────────────────────────── */
    var fontsGrid = document.getElementById('cfg-fonts-grid');
    if (fontsGrid) renderFonts(fontsGrid, cfg);

    /* ── Texturas ──────────────────────────────────────────── */
    var texRow = document.getElementById('cfg-tex-row');
    if (texRow) renderTexturas(texRow, cfg);

    /* ── Image upload ──────────────────────────────────────── */
    var imgUpload = document.getElementById('cfg-img-upload');
    if (imgUpload) {
      imgUpload.addEventListener('change', function () {
        var file = imgUpload.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          var dataUrl = e.target.result;
          document.body.style.setProperty('--tx-img-url', 'url("' + dataUrl + '")');
          if (storage && storage.config) {
            storage.config.set('txImgUrl', dataUrl);
          }
          if (typeof showToast === 'function') showToast('Imagen aplicada');
        };
        reader.readAsDataURL(file);
      });
    }

    /* ── Opacity slider ────────────────────────────────────── */
    var opacitySlider = document.getElementById('cfg-tx-opacity-slider');
    var opacityVal = document.getElementById('cfg-tx-opacity-val');
    if (opacitySlider) {
      opacitySlider.value = cfg.txOpacity !== undefined ? cfg.txOpacity : 0.15;
      if (opacityVal) opacityVal.textContent = opacitySlider.value;
      opacitySlider.addEventListener('input', function () {
        var v = opacitySlider.value;
        document.body.style.setProperty('--tx-img-opacity', v);
        if (opacityVal) opacityVal.textContent = parseFloat(v).toFixed(2);
        if (storage && storage.config) {
          storage.config.set('txOpacity', parseFloat(v));
        }
      });
    }

    /* ── Size buttons ──────────────────────────────────────── */
    var sizeBtns = document.querySelectorAll('.cfg-tx-size-btn');
    sizeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var size = btn.getAttribute('data-size') || 'cover';
        document.body.style.setProperty('--tx-img-size', size);
        if (storage && storage.config) {
          storage.config.set('txImgSize', size);
        }
        sizeBtns.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    // Restore image if saved
    if (cfg.txImgUrl) {
      document.body.style.setProperty('--tx-img-url', 'url("' + cfg.txImgUrl + '")');
    }
    if (cfg.txOpacity !== undefined) {
      document.body.style.setProperty('--tx-img-opacity', cfg.txOpacity);
    }
    if (cfg.txImgSize) {
      document.body.style.setProperty('--tx-img-size', cfg.txImgSize);
    }
    // Show image wrap if textura === imagen
    var imgWrap = document.getElementById('cfg-tx-img-wrap');
    if (imgWrap && cfg.textura === 'imagen') {
      imgWrap.classList.add('visible');
    }

    /* ── Backup button ─────────────────────────────────────── */
    var backupBtn = document.getElementById('cfg-backup-btn');
    if (backupBtn) {
      backupBtn.addEventListener('click', doBackup);
    }

    /* ── Restore button ────────────────────────────────────── */
    var restoreBtn = document.getElementById('cfg-restore-btn');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', doRestore);
    }
  }

  /* ── Export ──────────────────────────────────────────────── */

  window.AndinetConfig = {
    applyTheme: applyTheme,
    applyFont: applyFont,
    applyTexture: applyTexture,
    applyConfig: applyConfig,
    init: init,
  };
})();
