import { COMPONENT_CATALOG } from './schema.js';

export const UI = {
  init(onAddComponent) {
    this.initModals();
    this.initDrawers();
    this.initTinkercadModal();
    this.initComponentPalette(onAddComponent);
  },

  initDrawers() {
    const sidebar = document.getElementById('sidebar-palette');
    const inspector = document.getElementById('inspector-panel');
    const backdrop = document.getElementById('drawer-backdrop');

    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnToggleInspector = document.getElementById('btn-toggle-inspector');

    const closeDrawers = () => {
      if (sidebar) sidebar.classList.remove('open');
      if (inspector) inspector.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    };

    if (btnToggleSidebar && sidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('open');
        closeDrawers();
        if (!isOpen) {
          sidebar.classList.add('open');
          if (backdrop) backdrop.classList.add('active');
        }
      });
    }

    if (btnToggleInspector && inspector) {
      btnToggleInspector.addEventListener('click', () => {
        const isOpen = inspector.classList.contains('open');
        closeDrawers();
        if (!isOpen) {
          inspector.classList.add('open');
          if (backdrop) backdrop.classList.add('active');
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeDrawers);
    }

    document.querySelectorAll('[data-close-drawer]').forEach((btn) => {
      btn.addEventListener('click', closeDrawers);
    });
  },

  initModals() {
    // Changelog Modal Open
    const btnChangelog = document.getElementById('btn-changelog');
    const changelogModal = document.getElementById('modal-changelog');
    const changelogBody = document.getElementById('changelog-body');

    if (btnChangelog && changelogModal) {
      btnChangelog.addEventListener('click', async () => {
        changelogModal.classList.add('open');
        changelogBody.innerHTML = '<div style="color: var(--accent-sky); padding: 1rem;">Loading version history...</div>';
        try {
          const res = await fetch('./doc/versions.md');
          if (!res.ok) throw new Error('Failed to load doc/versions.md');
          const markdown = await res.text();
          changelogBody.innerHTML = `<div class="changelog-content">${this.parseMarkdown(markdown)}</div>`;
        } catch (err) {
          changelogBody.innerHTML = `<div style="color: var(--accent-rose); padding: 1rem;">Error loading doc/versions.md: ${err.message}</div>`;
        }
      });
    }

    // Generic Modal Close Handlers
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });
  },

  initTinkercadModal() {
    const btnImportTcad = document.getElementById('btn-import-tcad');
    const modalTcad = document.getElementById('modal-import-tcad');
    const btnSampleUrl = document.getElementById('btn-load-sample-url');
    const urlInput = document.getElementById('tcad-url-input');

    if (btnImportTcad && modalTcad) {
      btnImportTcad.addEventListener('click', () => {
        const quickVal = document.getElementById('quick-tcad-url-input')?.value;
        if (quickVal && urlInput && !urlInput.value) {
          urlInput.value = quickVal;
        }
        modalTcad.classList.add('open');
      });
    }

    if (btnSampleUrl && urlInput) {
      btnSampleUrl.addEventListener('click', () => {
        urlInput.value = 'https://www.tinkercad.com/things/7L66saKKSJ4-dld-lab-assignment?sharecode=uN3hDiqfdmBo2YvKn9dDltuocGkzMfPV7UJnA_uWMdk';
        this.showToast('Sample Tinkercad URL loaded', 'info');
      });
    }
  },

  /**
   * Toast notification system
   */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  /**
   * Lightweight markdown parser for versions.md
   */
  parseMarkdown(md) {
    const lines = md.split('\n');
    let html = '';
    let inList = false;

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3>${this.escapeHtml(line.slice(4))}</h3>`;
      } else if (line.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2>${this.escapeHtml(line.slice(3))}</h2>`;
      } else if (line.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h1>${this.escapeHtml(line.slice(2))}</h1>`;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        let content = line.slice(2);
        content = this.formatInlineMarkdown(content);
        html += `<li>${content}</li>`;
      } else if (line.startsWith('---')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<hr style="border:0; border-top:1px solid var(--border-subtle); margin:1rem 0;" />';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${this.formatInlineMarkdown(line)}</p>`;
      }
    }

    if (inList) html += '</ul>';
    return html;
  },

  formatInlineMarkdown(str) {
    let out = this.escapeHtml(str);
    // Bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Code
    out = out.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent-sky);">$1</a>');
    return out;
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /**
   * Initializes categorized sidebar palette from COMPONENT_CATALOG with search and drag/click handling
   */
  initComponentPalette(onAddComponent) {
    const listEl = document.getElementById('component-list');
    const searchInput = document.getElementById('component-search-input');
    const countEl = document.getElementById('palette-count');
    if (!listEl) return;

    const categories = [
      'Boards & Prototyping',
      'Microcontrollers',
      'Inputs & Sensors',
      'Outputs & Actuators',
      'Passives & Semiconductors',
      'Displays & Measurement',
      'Logic ICs & Power'
    ];

    const renderList = (filterText = '') => {
      listEl.innerHTML = '';
      const filter = filterText.toLowerCase().trim();
      let totalVisible = 0;

      categories.forEach((catName) => {
        const items = Object.entries(COMPONENT_CATALOG).filter(([type, comp]) => {
          if (comp.category !== catName) return false;
          if (!filter) return true;
          return (
            comp.name.toLowerCase().includes(filter) ||
            type.toLowerCase().includes(filter) ||
            comp.wokwiType.toLowerCase().includes(filter) ||
            (comp.description && comp.description.toLowerCase().includes(filter))
          );
        });

        if (items.length === 0) return;
        totalVisible += items.length;

        const groupEl = document.createElement('div');
        groupEl.className = 'palette-category-group';

        const titleEl = document.createElement('div');
        titleEl.className = 'palette-category-title';
        titleEl.innerHTML = `<span>${catName}</span><span class="palette-category-count">${items.length}</span>`;
        groupEl.appendChild(titleEl);

        items.forEach(([type, comp]) => {
          const card = document.createElement('div');
          card.className = 'component-card';
          card.setAttribute('draggable', 'true');
          card.setAttribute('data-type', type);
          card.setAttribute('title', `Click or drag to place ${comp.name} on canvas`);

          const iconSvg = this.getComponentIcon(type, comp.category);

          card.innerHTML = `
            <div class="component-icon">
              ${iconSvg}
            </div>
            <div class="component-details">
              <span class="component-name">${this.escapeHtml(comp.name)}</span>
              <span class="component-type">${this.escapeHtml(comp.wokwiType)}</span>
            </div>
          `;

          // Click to add
          card.addEventListener('click', () => {
            if (typeof onAddComponent === 'function') {
              onAddComponent(type);
            }
          });

          // Drag start
          card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', type);
            e.dataTransfer.setData('application/json', JSON.stringify({ type, name: comp.name }));
            e.dataTransfer.effectAllowed = 'copy';
          });

          groupEl.appendChild(card);
        });

        listEl.appendChild(groupEl);
      });

      if (countEl) {
        countEl.textContent = totalVisible;
      }

      if (totalVisible === 0) {
        listEl.innerHTML = `
          <div style="padding: 1.5rem 0.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
            No components matching "${this.escapeHtml(filterText)}"
          </div>
        `;
      }
    };

    renderList();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderList(e.target.value);
      });
    }
  },

  /**
   * Helper generating crisp 16x16 SVG icons for palette component cards
   */
  getComponentIcon(type, category) {
    if (category === 'Microcontrollers' || type.startsWith('ic-')) {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="5" y="4" width="14" height="16" rx="2"/>
        <line x1="2" y1="8" x2="5" y2="8"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="2" y1="16" x2="5" y2="16"/>
        <line x1="19" y1="8" x2="22" y2="8"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="19" y1="16" x2="22" y2="16"/>
      </svg>`;
    }
    if (type.startsWith('breadboard')) {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="6" y1="9" x2="6" y2="9.01"/><line x1="10" y1="9" x2="10" y2="9.01"/><line x1="14" y1="9" x2="14" y2="9.01"/><line x1="18" y1="9" x2="18" y2="9.01"/>
        <line x1="6" y1="15" x2="6" y2="15.01"/><line x1="10" y1="15" x2="10" y2="15.01"/><line x1="14" y1="15" x2="14" y2="15.01"/><line x1="18" y1="15" x2="18" y2="15.01"/>
      </svg>`;
    }
    if (type === 'resistor') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12h4l2-4 3 8 3-8 3 8 2-4h5"/>
      </svg>`;
    }
    if (type === 'capacitor') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="12" x2="9" y2="12"/>
        <line x1="9" y1="6" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="18"/>
        <line x1="15" y1="12" x2="22" y2="12"/>
      </svg>`;
    }
    if (type === 'diode') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="12" x2="7" y2="12"/>
        <polygon points="7,6 7,18 16,12" fill="currentColor"/>
        <line x1="16" y1="6" x2="16" y2="18"/>
        <line x1="16" y1="12" x2="22" y2="12"/>
      </svg>`;
    }
    if (type === 'transistor-npn') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
        <line x1="12" y1="7" x2="12" y2="17"/>
        <line x1="5" y1="12" x2="12" y2="12"/>
        <line x1="12" y1="9" x2="18" y2="6"/>
        <line x1="12" y1="15" x2="18" y2="18"/>
      </svg>`;
    }
    if (type === 'led' || type === 'rgb-led') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="11" r="5"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="16" x2="12" y2="22"/>
        <line x1="18" y1="6" x2="21" y2="3"/>
      </svg>`;
    }
    if (type === 'buzzer') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>`;
    }
    if (type === 'dc-motor' || type === 'servo-motor') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="8"/>
        <text x="12" y="15" font-size="9" text-anchor="middle" fill="currentColor" font-weight="bold">M</text>
      </svg>`;
    }
    if (type.includes('sensor') || type === 'tmp36' || type === 'photoresistor') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M7.76 7.76a6 6 0 0 1 8.48 0"/>
        <path d="M4.93 4.93a10 10 0 0 1 14.14 0"/>
      </svg>`;
    }
    if (category === 'Displays & Measurement') {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="18" x2="12" y2="21"/>
      </svg>`;
    }
    if (type.includes('battery')) {
      return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="18" height="10" rx="2"/>
        <line x1="22" y1="10" x2="22" y2="14"/>
      </svg>`;
    }
    // Default switch / generic
    return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>`;
  }
};
