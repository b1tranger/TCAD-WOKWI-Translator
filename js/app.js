/**
 * TCAD-WOKWI-Translator - Application Bootstrap & State Store
 */

import { DEFAULT_PROJECT, COMPONENT_CATALOG } from './schema.js';
import { Translator } from './translator.js';
import { CircuitRenderer } from './renderer.js';
import { UI } from './ui.js';

class App {
  constructor() {
    this.project = JSON.parse(JSON.stringify(DEFAULT_PROJECT));
    this.activeInspectorTab = 'wokwi'; // 'wokwi' | 'native'
    this.renderer = null;
  }

  init() {
    this.registerServiceWorker();
    this.initCanvas();
    this.initInspector();
    this.initToolbar();
    this.initTinkercadImportHandler();
    this.initFileLoadingHandler();
    UI.init((type) => this.addComponent(type));
    this.updateInspector();
    this.updateCircuitBanner();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            console.log('[TCAD-Wokwi] ServiceWorker registered with scope:', reg.scope);
            reg.update().catch(() => {});
          })
          .catch((err) => {
            console.warn('[TCAD-Wokwi] ServiceWorker registration failed:', err);
          });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[TCAD-Wokwi] New ServiceWorker active; freshest assets in use.');
        });
      });
    }
  }

  initCanvas() {
    const svgElement = document.getElementById('circuit-canvas');
    if (!svgElement) return;
    this.renderer = new CircuitRenderer(svgElement, {
      onComponentMove: (comp, isFinal) => {
        if (isFinal) {
          this.updateInspector();
          this.updateCircuitBanner();
        }
      }
    });
    this.renderer.render(this.project);

    // Zoom Controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        this.renderer.setZoom(this.renderer.zoom + 0.15);
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        this.renderer.setZoom(this.renderer.zoom - 0.15);
      });
    }
    if (btnZoomReset) {
      btnZoomReset.addEventListener('click', () => {
        this.renderer.setZoom(1.0);
      });
    }

    // Drag-and-drop onto canvas (Palette components or JSON files)
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
      canvasContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (e.dataTransfer.types && (e.dataTransfer.types.includes('Files') || Array.from(e.dataTransfer.types).includes('Files'))) {
          canvasContainer.classList.add('drag-over');
        }
      });

      canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (e.dataTransfer.types && (e.dataTransfer.types.includes('Files') || Array.from(e.dataTransfer.types).includes('Files'))) {
          canvasContainer.classList.add('drag-over');
        }
      });

      canvasContainer.addEventListener('dragleave', (e) => {
        if (e.relatedTarget && canvasContainer.contains(e.relatedTarget)) return;
        canvasContainer.classList.remove('drag-over');
      });

      canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        canvasContainer.classList.remove('drag-over');

        // Check if user dropped a local JSON / EAGLE circuit file
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          const ext = file.name.toLowerCase().split('.').pop();
          if (!['json', 'brd', 'xml'].includes(ext)) {
            UI.showToast('Please drop a valid .json, .brd, or .xml circuit file', 'error');
            return;
          }
          const reader = new FileReader();
          reader.onload = (evt) => {
            const content = evt.target.result;
            this.importTinkercadProject('', content, file.name);
          };
          reader.onerror = () => {
            UI.showToast('Failed to read dropped file', 'error');
          };
          reader.readAsText(file);
          return;
        }

        // Otherwise handle sidebar palette component drop
        const type = e.dataTransfer.getData('text/plain');
        if (type && COMPONENT_CATALOG[type]) {
          const rect = canvasContainer.getBoundingClientRect();
          const zoom = this.renderer ? this.renderer.zoom : 1.0;
          const panX = this.renderer ? this.renderer.panX : 0;
          const panY = this.renderer ? this.renderer.panY : 0;
          const dropX = (e.clientX - rect.left - panX) / zoom;
          const dropY = (e.clientY - rect.top - panY) / zoom;
          this.addComponent(type, dropX, dropY);
        }
      });
    }
  }

  addComponent(type, x, y) {
    const meta = COMPONENT_CATALOG[type];
    if (!meta) return;
    const sameType = (this.project.components || []).filter((c) => c.type === type);
    const count = sameType.length + 1;
    const id = `${type.replace(/-/g, '_')}_${count}_${Date.now().toString(36).slice(-4)}`;

    let posX = x;
    let posY = y;

    if (typeof posX !== 'number' || typeof posY !== 'number') {
      if (type.startsWith('arduino') || type.startsWith('esp32')) {
        const mcuCount = (this.project.components || []).filter(c => c.type.startsWith('arduino') || c.type.startsWith('esp32')).length;
        posX = 80 + (mcuCount % 3) * 360;
        posY = 120 + Math.floor(mcuCount / 3) * 280;
      } else {
        const idx = (this.project.components || []).length;
        posX = 120 + (idx * 25) % 240;
        posY = 100 + (idx * 30) % 200;
      }
    }

    const newComp = {
      id,
      type,
      name: `${meta.name} ${count}`,
      x: Math.round(posX),
      y: Math.round(posY),
      attrs: {}
    };

    if (!this.project.components) this.project.components = [];
    this.project.components.push(newComp);

    if (this.renderer) {
      this.renderer.render(this.project);
    }
    this.updateInspector();
    this.updateCircuitBanner();
    UI.showToast(`Added ${meta.name} to canvas`, 'info', 2000);
  }

  updateCircuitBanner() {
    const titleEl = document.getElementById('circuit-banner-title');
    const statsEl = document.getElementById('circuit-banner-stats');
    if (titleEl) {
      titleEl.textContent = this.project.metadata?.title || 'Untitled Circuit';
    }
    if (statsEl) {
      const compCount = (this.project.components || []).length;
      const connCount = (this.project.connections || []).length;
      statsEl.textContent = `${compCount} parts, ${connCount} wires`;
    }
  }

  initInspector() {
    const tabWokwi = document.getElementById('tab-wokwi');
    const tabNative = document.getElementById('tab-native');

    if (tabWokwi && tabNative) {
      tabWokwi.addEventListener('click', () => {
        this.activeInspectorTab = 'wokwi';
        tabWokwi.classList.add('active');
        tabNative.classList.remove('active');
        this.updateInspector();
      });

      tabNative.addEventListener('click', () => {
        this.activeInspectorTab = 'native';
        tabNative.classList.add('active');
        tabWokwi.classList.remove('active');
        this.updateInspector();
      });
    }
  }

  updateInspector() {
    const previewEl = document.getElementById('code-output');
    if (!previewEl) return;

    if (this.activeInspectorTab === 'wokwi') {
      const wokwiJson = Translator.toWokwi(this.project);
      previewEl.textContent = JSON.stringify(wokwiJson, null, 2);
    } else {
      previewEl.textContent = JSON.stringify(this.project, null, 2);
    }
  }

  initToolbar() {
    // Export Wokwi Modal
    const btnExportWokwi = document.getElementById('btn-export-wokwi');
    const modalWokwi = document.getElementById('modal-export-wokwi');
    const wokwiTextarea = document.getElementById('wokwi-json-textarea');
    const wokwiStats = document.getElementById('wokwi-stats-badge');
    const btnCopyWokwi = document.getElementById('btn-copy-wokwi-json');
    const btnDownloadWokwi = document.getElementById('btn-download-wokwi-json');
    const copyWokwiText = document.getElementById('copy-wokwi-text');

    if (btnExportWokwi) {
      btnExportWokwi.addEventListener('click', () => {
        const data = Translator.toWokwi(this.project);
        const jsonStr = JSON.stringify(data, null, 2);
        if (wokwiTextarea) wokwiTextarea.value = jsonStr;
        if (wokwiStats) {
          wokwiStats.textContent = `${data.parts?.length || 0} parts, ${data.connections?.length || 0} connections`;
        }
        UI.openModal('modal-export-wokwi');
      });
    }

    if (btnCopyWokwi && wokwiTextarea) {
      btnCopyWokwi.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(wokwiTextarea.value);
          if (copyWokwiText) copyWokwiText.textContent = 'Copied!';
          UI.showToast('Copied diagram.json to clipboard!', 'success');
          setTimeout(() => {
            if (copyWokwiText) copyWokwiText.textContent = 'Copy JSON';
          }, 2000);
        } catch (err) {
          wokwiTextarea.select();
          document.execCommand('copy');
          UI.showToast('Copied diagram.json to clipboard!', 'success');
        }
      });
    }

    if (btnDownloadWokwi && wokwiTextarea) {
      btnDownloadWokwi.addEventListener('click', () => {
        const content = wokwiTextarea.value || JSON.stringify(Translator.toWokwi(this.project), null, 2);
        this.downloadFile('diagram.json', content, 'application/json');
        UI.showToast('Exported Wokwi diagram.json', 'success');
      });
    }

    // Export Standalone HTML with embedded SVG graphics
    const btnExportHtml = document.getElementById('btn-export-html');
    if (btnExportHtml) {
      btnExportHtml.addEventListener('click', () => {
        let viewportGroup = this.renderer?.viewportGroup || document.querySelector('#circuit-canvas #viewport-group') || document.getElementById('viewport-group');
        let renderedSvg = viewportGroup ? viewportGroup.innerHTML : '';
        if (!renderedSvg.trim() && this.renderer && this.project) {
          this.renderer.render(this.project);
          viewportGroup = this.renderer?.viewportGroup || document.getElementById('viewport-group');
          renderedSvg = viewportGroup ? viewportGroup.innerHTML : '';
        }
        const html = Translator.exportStandaloneHTML(this.project, renderedSvg);
        this.downloadFile('circuit.html', html, 'text/html');
        UI.showToast('Exported Standalone circuit.html with full graphics!', 'success');
      });
    }

    // Export Raw JSON
    const btnExportJson = document.getElementById('btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        this.downloadFile('circuit.json', JSON.stringify(this.project, null, 2), 'application/json');
        UI.showToast('Exported Project circuit.json', 'success');
      });
    }
  }

  async importTinkercadProject(urlVal, jsonVal, optionalTitle = '') {
    const statusEl = document.getElementById('tcad-import-status');
    const modalTcad = document.getElementById('modal-import-tcad');
    const quickInput = document.getElementById('quick-tcad-url-input');
    const modalInput = document.getElementById('tcad-url-input');

    if (!urlVal && !jsonVal) {
      UI.showToast('Please enter a Tinkercad URL or paste circuit JSON', 'error');
      if (statusEl) {
        statusEl.className = 'import-status error';
        statusEl.textContent = 'Please enter a Tinkercad URL or paste circuit JSON.';
      }
      return;
    }

    UI.showToast('Translating circuit data...', 'info', 2000);
    if (statusEl) {
      statusEl.className = 'import-status';
      statusEl.textContent = 'Translating circuit data...';
    }

    try {
      let translated;
      const trimmed = (jsonVal || '').trim();
      if (trimmed.startsWith('<?xml') || trimmed.startsWith('<eagle') || trimmed.includes('<board>') || trimmed.includes('<signals>')) {
        translated = Translator.fromEagleBrd(trimmed);
      } else {
        translated = await Translator.fetchAndTranslateTinkercad(urlVal, jsonVal);
      }

      if (optionalTitle && (!translated.metadata.title || translated.metadata.title.startsWith('Imported '))) {
        const cleanTitle = optionalTitle.replace(/\.(json|brd|xml)$/i, '').replace(/[-_]/g, ' ');
        translated.metadata.title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      }

      this.project = translated;

      // Sync input fields
      if (quickInput && urlVal) quickInput.value = urlVal;
      if (modalInput && urlVal) modalInput.value = urlVal;

      // Re-render canvas and auto-fit to content (supporting scalable multi-MCU designs)
      if (this.renderer) {
        this.renderer.fitToContent(this.project);
        this.renderer.render(this.project);
      }

      this.updateInspector();
      this.updateCircuitBanner();

      if (statusEl) {
        statusEl.className = 'import-status success';
        statusEl.textContent = `Successfully translated: ${translated.metadata.title}`;
      }

      UI.showToast(`Imported: ${translated.metadata.title}`, 'success', 3500);

      if (modalTcad) {
        setTimeout(() => modalTcad.classList.remove('open'), 600);
      }
    } catch (err) {
      if (statusEl) {
        statusEl.className = 'import-status error';
        statusEl.textContent = err.message;
      }
      UI.showToast(err.message, 'error', 4000);
    }
  }

  initFileLoadingHandler() {
    const fileInput = document.getElementById('file-input-circuit');
    const btnOpenFile = document.getElementById('btn-open-file');
    const btnModalChooseFile = document.getElementById('btn-modal-choose-file');
    const fabOpenFile = document.getElementById('fab-open-file');

    const triggerFilePicker = () => {
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      }
    };

    if (btnOpenFile) btnOpenFile.addEventListener('click', triggerFilePicker);
    if (btnModalChooseFile) btnModalChooseFile.addEventListener('click', triggerFilePicker);
    if (fabOpenFile) fabOpenFile.addEventListener('click', triggerFilePicker);

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const labelEl = document.getElementById('modal-chosen-file-label');
        if (labelEl) labelEl.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          const modalJsonInput = document.getElementById('tcad-json-input');
          if (modalJsonInput) {
            modalJsonInput.value = content;
          }
          this.importTinkercadProject('', content, file.name);
        };
        reader.onerror = () => {
          UI.showToast(`Failed to read file ${file.name}`, 'error');
        };
        reader.readAsText(file);
      });
    }
  }

  initTinkercadImportHandler() {
    const sampleUrl = 'https://www.tinkercad.com/things/7L66saKKSJ4-dld-lab-assignment?sharecode=uN3hDiqfdmBo2YvKn9dDltuocGkzMfPV7UJnA_uWMdk';

    // 1. Persistent Quick Import Bar Elements
    const quickInput = document.getElementById('quick-tcad-url-input');
    const btnQuickSample = document.getElementById('btn-quick-sample-url');
    const btnQuickImport = document.getElementById('btn-quick-import-submit');

    if (btnQuickSample && quickInput) {
      btnQuickSample.addEventListener('click', () => {
        quickInput.value = sampleUrl;
        UI.showToast('Loaded sample Tinkercad assignment link', 'info', 2000);
      });
    }

    if (btnQuickImport && quickInput) {
      btnQuickImport.addEventListener('click', () => {
        this.importTinkercadProject(quickInput.value, '');
      });
    }

    if (quickInput) {
      quickInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.importTinkercadProject(quickInput.value, '');
        }
      });
    }

    // 2. Modal Elements
    const btnModalSubmit = document.getElementById('btn-submit-tcad-import');
    const modalUrlInput = document.getElementById('tcad-url-input');
    const modalJsonInput = document.getElementById('tcad-json-input');

    if (btnModalSubmit) {
      btnModalSubmit.addEventListener('click', () => {
        const urlVal = modalUrlInput ? modalUrlInput.value.trim() : '';
        const jsonVal = modalJsonInput ? modalJsonInput.value.trim() : '';
        this.importTinkercadProject(urlVal, jsonVal);
      });
    }
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
