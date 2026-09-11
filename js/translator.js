/**
 * TCAD-WOKWI-Translator - Translator Pipeline
 * Converts between Tinkercad payloads, Native Schema, Wokwi diagram.json, and Standalone HTML.
 */

import { COMPONENT_CATALOG } from './schema.js';

export const COMPONENT_ALIAS_MAP = {
  // Microcontrollers
  'arduino-uno': 'arduino-uno',
  'arduino_uno': 'arduino-uno',
  'uno': 'arduino-uno',
  'arduino_uno_r3': 'arduino-uno',
  'arduino uno': 'arduino-uno',
  'arduino uno r3': 'arduino-uno',
  'wokwi-arduino-uno': 'arduino-uno',
  'arduino-mega': 'arduino-mega',
  'arduino_mega': 'arduino-mega',
  'mega': 'arduino-mega',
  'arduino-nano': 'arduino-nano',
  'arduino_nano': 'arduino-nano',
  'nano': 'arduino-nano',
  'esp32': 'esp32',
  'wokwi-esp32-devkit-v1': 'esp32',
  // Breadboards
  'breadboard': 'breadboard-half',
  'breadboard-half': 'breadboard-half',
  'breadboard_half': 'breadboard-half',
  'half-breadboard': 'breadboard-half',
  'small-breadboard': 'breadboard-half',
  'wokwi-breadboard-half': 'breadboard-half',
  'breadboard-full': 'breadboard-full',
  'breadboard_full': 'breadboard-full',
  'full-breadboard': 'breadboard-full',
  'wokwi-breadboard': 'breadboard-full',
  'breadboard-mini': 'breadboard-mini',
  'breadboard_mini': 'breadboard-mini',
  'mini-breadboard': 'breadboard-mini',
  'wokwi-breadboard-mini': 'breadboard-mini',
  // Passives & Actuators
  'resistor': 'resistor',
  'res': 'resistor',
  'r': 'resistor',
  'wokwi-resistor': 'resistor',
  'led': 'led',
  'led-red': 'led',
  'led-green': 'led',
  'led-blue': 'led',
  'led-yellow': 'led',
  'wokwi-led': 'led',
  'rgb-led': 'rgb-led',
  'rgb_led': 'rgb-led',
  'wokwi-rgb-led': 'rgb-led',
  'capacitor': 'capacitor',
  'cap': 'capacitor',
  'diode': 'diode',
  '1n4007': 'diode',
  '1n4148': 'diode',
  'transistor': 'transistor-tip120',
  'transistor-tip120': 'transistor-tip120',
  'tip120': 'transistor-tip120',
  'bjt': 'transistor-tip120',
  'npn': 'transistor-tip120',
  'pushbutton': 'pushbutton',
  'button': 'pushbutton',
  'btn': 'pushbutton',
  'tactile': 'pushbutton',
  'wokwi-pushbutton': 'pushbutton',
  'potentiometer': 'potentiometer',
  'pot': 'potentiometer',
  'trimmer': 'potentiometer',
  'wokwi-potentiometer': 'potentiometer',
  'photoresistor': 'photoresistor',
  'ldr': 'photoresistor',
  'light-sensor': 'photoresistor',
  'wokwi-photoresistor-sensor': 'photoresistor',
  'buzzer': 'buzzer',
  'piezo': 'buzzer',
  'speaker': 'buzzer',
  'wokwi-buzzer': 'buzzer',
  'servo': 'servo',
  'servo-motor': 'servo',
  'micro-servo': 'servo',
  'sg90': 'servo',
  'wokwi-servo': 'servo',
  'dc-motor': 'dc-motor',
  'motor': 'dc-motor',
  'relay': 'relay',
  'relay-spdt': 'relay',
  'sensor-tmp36': 'sensor-tmp36',
  'tmp36': 'sensor-tmp36',
  'temperature-sensor': 'sensor-tmp36',
  'temp-sensor': 'sensor-tmp36',
  'pir-sensor': 'pir-sensor',
  'pir': 'pir-sensor',
  'motion-sensor': 'pir-sensor',
  'ultrasonic-hcsr04': 'ultrasonic-hcsr04',
  'hcsr04': 'ultrasonic-hcsr04',
  'ultrasonic': 'ultrasonic-hcsr04',
  'sonar': 'ultrasonic-hcsr04',
  'wokwi-hc-sr04': 'ultrasonic-hcsr04',
  'power-supply': 'power-supply',
  'battery-9v': 'battery-9v',
  'battery-aa-4': 'battery-aa-4',
  'dip-switch-4': 'dip-switch-4',
  'slide-switch': 'slide-switch',
  'multimeter': 'multimeter',
  'lcd1602-i2c': 'lcd1602-i2c',
  'lcd1602': 'lcd1602-i2c',
  'lcd': 'lcd1602-i2c',
  'wokwi-lcd1602': 'lcd1602-i2c',
  '7segment': '7segment',
  'seven-segment': '7segment',
  'wokwi-7segment': '7segment',
  'oled-ssd1306': 'oled-ssd1306',
  'oled': 'oled-ssd1306',
  // Chips / ICs
  'chip-74hc32': 'chip-74hc32',
  '74hc32': 'chip-74hc32',
  '7432': 'chip-74hc32',
  'chip-74hc04': 'chip-74hc04',
  '74hc04': 'chip-74hc04',
  '7404': 'chip-74hc04',
  'chip-7408': 'chip-7408',
  '74hc08': 'chip-7408',
  '7408': 'chip-7408',
  'chip-7400': 'chip-7400',
  '74hc00': 'chip-7400',
  '7400': 'chip-7400',
  'chip-555': 'chip-555',
  'ne555': 'chip-555',
  '555': 'chip-555',
  'dip-ic': 'dip-ic'
};


export const Translator = {

  /**
   * Normalizes any raw component type, alias, or human name to a valid schema type
   */
  normalizeComponentType(rawType) {
    if (!rawType) return 'generic-component';
    const clean = String(rawType)
      .toLowerCase()
      .replace(/^(wokwi|tcad|part)[-_]/, '')
      .trim();
    if (COMPONENT_ALIAS_MAP[clean]) return COMPONENT_ALIAS_MAP[clean];
    if (COMPONENT_CATALOG[clean]) return clean;

    // Substring heuristical matching
    if (clean.includes('uno')) return 'arduino-uno';
    if (clean.includes('mega')) return 'arduino-mega';
    if (clean.includes('nano')) return 'arduino-nano';
    if (clean.includes('esp32')) return 'esp32';
    if (clean.includes('breadboard')) {
      if (clean.includes('full')) return 'breadboard-full';
      if (clean.includes('mini')) return 'breadboard-mini';
      return 'breadboard-half';
    }
    if (clean.includes('resistor') || clean === 'res' || clean === 'r') return 'resistor';
    if (clean.includes('rgb')) return 'rgb-led';
    if (clean.includes('led')) return 'led';
    if (clean.includes('pot')) return 'potentiometer';
    if (clean.includes('servo')) return 'servo';
    if (clean.includes('motor')) return 'dc-motor';
    if (clean.includes('ultrasonic') || clean.includes('hcsr04')) return 'ultrasonic-hcsr04';
    if (clean.includes('pir')) return 'pir-sensor';
    if (clean.includes('tmp36') || clean.includes('temp')) return 'sensor-tmp36';
    if (clean.includes('photo') || clean.includes('ldr')) return 'photoresistor';
    if (clean.includes('button') || clean.includes('switch')) return clean.includes('slide') ? 'slide-switch' : clean.includes('dip') ? 'dip-switch-4' : 'pushbutton';
    if (clean.includes('buzzer') || clean.includes('piezo')) return 'buzzer';
    if (clean.includes('lcd')) return 'lcd1602-i2c';
    if (clean.includes('7segment') || clean.includes('seven')) return '7segment';
    if (clean.includes('oled')) return 'oled-ssd1306';
    if (clean.includes('555')) return 'chip-555';
    if (clean.includes('7432')) return 'chip-74hc32';
    if (clean.includes('7404')) return 'chip-74hc04';
    if (clean.includes('7408')) return 'chip-7408';
    if (clean.includes('7400')) return 'chip-7400';
    if (clean.includes('battery')) return clean.includes('9v') ? 'battery-9v' : 'battery-aa-4';

    return 'generic-component';
  },

  /**
   * Snaps a component directly to breadboard holes if overlapping
   */
  snapCoordinatesToBreadboard(comp, rawX, rawY, bb) {
    if (!bb || comp.type.startsWith('breadboard')) {
      return { x: rawX, y: rawY, isSnapped: false };
    }

    const bbWidth = bb.type === 'breadboard-full' ? 680 : bb.type === 'breadboard-mini' ? 240 : 560;
    const bbHeight = 252;
    const colPitch = bb.type === 'breadboard-full' ? 10 : bb.type === 'breadboard-mini' ? 11 : 17.5;
    const startX = bb.type === 'breadboard-full' ? 22 : bb.type === 'breadboard-mini' ? 20 : 28;
    const maxCols = bb.type === 'breadboard-full' ? 63 : bb.type === 'breadboard-mini' ? 17 : 30;

    if (
      rawX >= bb.x - 40 &&
      rawX <= bb.x + bbWidth - 10 &&
      rawY >= bb.y - 30 &&
      rawY <= bb.y + bbHeight - 10
    ) {
      if (comp.type.startsWith('chip-') || comp.type === 'dip-ic') {
        const targetCol = Math.round((rawX + 18 - (bb.x + startX)) / colPitch) + 1;
        const clampedCol = Math.max(1, Math.min(maxCols - 6, targetCol));
        const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 18);
        const snappedY = Math.round(bb.y + 70);
        return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
      }

      if (comp.type === 'resistor') {
        if (comp.rotation === 90) {
          const targetCol = Math.round((rawX + 12 - (bb.x + startX)) / colPitch) + 1;
          const clampedCol = Math.max(1, Math.min(maxCols, targetCol));
          const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 12);
          const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
          const targetRowY = Math.round((rawY + 4 - rowBase) / 11) * 11 + rowBase;
          const snappedY = Math.round(targetRowY - 4);
          return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
        } else {
          const targetCol = Math.round((rawX + 4 - (bb.x + startX)) / colPitch) + 1;
          const clampedCol = Math.max(1, Math.min(maxCols - 3, targetCol));
          const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 4);
          const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
          const targetRowY = Math.round((rawY + 12 - rowBase) / 11) * 11 + rowBase;
          const snappedY = Math.round(targetRowY - 12);
          return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
        }
      }

      if (comp.type === 'led') {
        const targetCol = Math.round((rawX + 10 - (bb.x + startX)) / colPitch) + 1;
        const clampedCol = Math.max(1, Math.min(maxCols - 1, targetCol));
        const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 10);
        const rowBase = rawY < bb.y + 118 ? bb.y + 64 : bb.y + 138;
        const targetRowY = Math.round((rawY + 38 - rowBase) / 11) * 11 + rowBase;
        const snappedY = Math.round(targetRowY - 38);
        return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
      }

      if (comp.type === 'pushbutton') {
        const targetCol = Math.round((rawX + 8 - (bb.x + startX)) / colPitch) + 1;
        const clampedCol = Math.max(1, Math.min(maxCols - 1, targetCol));
        const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 8);
        const snappedY = Math.round(bb.y + 98);
        return { x: snappedX, y: snappedY, isSnapped: true, bbId: bb.id, col: clampedCol };
      }

      const targetCol = Math.round((rawX + 20 - (bb.x + startX)) / colPitch) + 1;
      const clampedCol = Math.max(1, Math.min(maxCols, targetCol));
      const snappedX = Math.round(bb.x + startX + (clampedCol - 1) * colPitch - 20);
      return { x: snappedX, y: rawY, isSnapped: true, bbId: bb.id, col: clampedCol };
    }

    return { x: rawX, y: rawY, isSnapped: false };
  },
  /**
    * Convert Native Project Schema to Wokwi diagram.json
   */
  toWokwi(project) {
    const parts = (project.components || []).map((comp) => {
      const catalogEntry = COMPONENT_CATALOG[comp.type] || {};
      return {
        type: catalogEntry.wokwiType || `wokwi-${comp.type}`,
        id: comp.id,
        top: Math.round(comp.y || 0),
        left: Math.round(comp.x || 0),
        rotate: comp.rotation || 0,
        attrs: { ...(comp.properties || {}) }
      };
    });

    const connections = (project.connections || []).map((conn) => {
      const fromPin = `${conn.from.component}:${conn.from.pin}`;
      const toPin = `${conn.to.component}:${conn.to.pin}`;
      let color = conn.color || 'blue';
      // Map standard hex colors to canonical Wokwi wire names
      if (color === '#ef4444' || color === '#dc2626') color = 'red';
      else if (color === '#0f172a' || color === '#1e293b' || color === '#000000' || color === '#000') color = 'black';
      else if (color === '#10b981' || color === '#059669' || color === '#22c55e') color = 'green';
      else if (color === '#eab308' || color === '#f59e0b' || color === '#fbbf24') color = 'yellow';
      else if (color === '#0284c7' || color === '#38bdf8' || color === '#2563eb') color = 'blue';

      const instructions = conn.bends || [];
      return [fromPin, toPin, color, instructions];
    });

    // Synthesize Logical Breadboard Connections:
    // If any component pin sits on a breadboard column or power rail, logically connect it
    const breadboards = (project.components || []).filter((c) =>
      c.type === 'breadboard-half' || c.type === 'breadboard-full' || c.type === 'breadboard-mini'
    );

    if (breadboards.length > 0) {
      const existingConnKeys = new Set(
        connections.map((c) => `${c[0]}<->${c[1]}`)
      );

      (project.components || []).forEach((comp) => {
        if (comp.type.startsWith('breadboard')) return;

        breadboards.forEach((bb) => {
          // Check collision with breadboard
          const bbWidth = bb.type === 'breadboard-full' ? 680 : bb.type === 'breadboard-mini' ? 240 : 560;
          const bbHeight = 252;
          if (
            comp.x >= bb.x - 40 &&
            comp.x <= bb.x + bbWidth &&
            comp.y >= bb.y - 20 &&
            comp.y <= bb.y + bbHeight
          ) {
            // Find component pins and match to breadboard holes
            const pins = this.getComponentPins(comp);
            pins.forEach((pin) => {
              const hole = this.resolveHoleOnBreadboard(pin.x, pin.y, bb);
              if (hole) {
                const compPinStr = `${comp.id}:${pin.name}`;
                const bbPinStr = `${bb.id}:${hole}`;
                const key1 = `${compPinStr}<->${bbPinStr}`;
                const key2 = `${bbPinStr}<->${compPinStr}`;
                if (!existingConnKeys.has(key1) && !existingConnKeys.has(key2)) {
                  existingConnKeys.add(key1);
                  connections.push([compPinStr, bbPinStr, 'green', []]);
                }
              }
            });
          }
        });
      });
    }

    return {
      version: 1,
      author: project.metadata?.author || 'TCAD-WOKWI-Translator',
      editor: 'wokwi',
      parts,
      connections
    };
  },

  /**
   * Helper to get component terminal positions
   */
  getComponentPins(comp) {
    const px = comp.x || 0;
    const py = comp.y || 0;
    const type = comp.type;

    if (type === 'resistor') {
      if (comp.rotation === 90) {
        return [{ name: '1', x: px + 12, y: py + 4 }, { name: '2', x: px + 12, y: py + 76 }];
      }
      return [{ name: '1', x: px + 4, y: py + 12 }, { name: '2', x: px + 76, y: py + 12 }];
    }
    if (type === 'led') {
      return [{ name: 'a', x: px + 10, y: py + 38 }, { name: 'c', x: px + 22, y: py + 38 }];
    }
    if (type === 'capacitor') {
      return [{ name: '1', x: px + 6, y: py + 30 }, { name: '2', x: px + 18, y: py + 30 }];
    }
    if (type === 'diode') {
      return [{ name: 'anode', x: px + 6, y: py + 10 }, { name: 'cathode', x: px + 64, y: py + 10 }];
    }
    if (type === 'pushbutton') {
      return [
        { name: '1a', x: px + 8, y: py + 8 },
        { name: '1b', x: px + 8, y: py + 28 },
        { name: '2a', x: px + 28, y: py + 8 },
        { name: '2b', x: px + 28, y: py + 28 }
      ];
    }
    if (type.startsWith('chip-') || type === 'dip-ic') {
      const pins = [];
      for (let i = 1; i <= 7; i++) {
        pins.push({ name: String(i), x: px + 18 + (i - 1) * 20, y: py + 52 });
      }
      for (let i = 8; i <= 14; i++) {
        pins.push({ name: String(i), x: px + 18 + (14 - i) * 20, y: py + 2 });
      }
      return pins;
    }
    return [];
  },

  /**
   * Helper to map absolute pin coordinates to a breadboard hole name
   */
  resolveHoleOnBreadboard(px, py, bb) {
    if (bb.type === 'breadboard-half') {
      const col = Math.round((px - (bb.x + 28)) / 17.5) + 1;
      if (col < 1 || col > 30) return null;

      // Top power rails
      if (Math.abs(py - (bb.y + 22)) <= 8) return `tn.${col}`;
      if (Math.abs(py - (bb.y + 36)) <= 8) return `tp.${col}`;

      // Top terminal strip: j, i, h, g, f
      if (py >= bb.y + 55 && py <= bb.y + 115) {
        const r = Math.round((py - (bb.y + 64)) / 11);
        const rows = ['j', 'i', 'h', 'g', 'f'];
        const rowLetter = rows[Math.max(0, Math.min(4, r))];
        return `${col}t.${rowLetter}`;
      }

      // Bottom terminal strip: e, d, c, b, a
      if (py >= bb.y + 130 && py <= bb.y + 190) {
        const r = Math.round((py - (bb.y + 138)) / 11);
        const rows = ['e', 'd', 'c', 'b', 'a'];
        const rowLetter = rows[Math.max(0, Math.min(4, r))];
        return `${col}b.${rowLetter}`;
      }

      // Bottom power rails
      if (Math.abs(py - (bb.y + 215)) <= 8) return `bn.${col}`;
      if (Math.abs(py - (bb.y + 229)) <= 8) return `bp.${col}`;
    }
    return null;
  },

  /**
   * Convert Wokwi diagram.json back to Native Project Schema
   */
  fromWokwi(wokwiData) {
    const components = (wokwiData.parts || []).map((part) => {
      let matchedType = 'breadboard-half';
      for (const [typeKey, info] of Object.entries(COMPONENT_CATALOG)) {
        if (info.wokwiType === part.type) {
          matchedType = typeKey;
          break;
        }
      }

      return {
        id: part.id,
        type: matchedType,
        x: part.left || 0,
        y: part.top || 0,
        rotation: part.rotate || 0,
        properties: part.attrs || {}
      };
    });

    const connections = (wokwiData.connections || []).map((conn, idx) => {
      const [fromStr, toStr, color, bends] = conn;
      const [fromComp, fromPin] = (fromStr || '').split(':');
      const [toComp, toPin] = (toStr || '').split(':');

      return {
        id: `wire_${idx + 1}`,
        from: { component: fromComp, pin: fromPin },
        to: { component: toComp, pin: toPin },
        color: color || '#38bdf8',
        bends: bends || []
      };
    });

    return {
      metadata: {
        title: 'Imported from Wokwi',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author: wokwiData.author || 'Wokwi User'
      },
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      components,
      connections
    };
  },

  /**
   * Parse Tinkercad URL parameters
   */
  parseTinkercadUrl(urlStr) {
    try {
      const parsed = new URL(urlStr.trim());
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const thingsIdx = pathParts.indexOf('things');
      let thingIdentifier = '';
      if (thingsIdx !== -1 && pathParts[thingsIdx + 1]) {
        thingIdentifier = pathParts[thingsIdx + 1];
      }

      // Split ID and slug (e.g., 7L66saKKSJ4-dld-lab-assignment)
      let thingId = thingIdentifier;
      let slug = '';
      if (thingIdentifier.includes('-')) {
        const dashIdx = thingIdentifier.indexOf('-');
        thingId = thingIdentifier.substring(0, dashIdx);
        slug = thingIdentifier.substring(dashIdx + 1);
      }

      const sharecode = parsed.searchParams.get('sharecode') || '';
      const formattedTitle = slug
        ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : `Tinkercad Circuit ${thingId}`;

      return {
        valid: true,
        thingId,
        slug,
        sharecode,
        title: formattedTitle,
        originalUrl: urlStr
      };
    } catch (e) {
      return {
        valid: false,
        error: e.message
      };
    }
  },

  /**
   * Ingest and translate Tinkercad public link or raw JSON
   */
  async fetchAndTranslateTinkercad(urlStr, rawJsonStr) {
    // 1. Direct raw JSON input provided
    if (rawJsonStr && rawJsonStr.trim()) {
      try {
        const parsed = JSON.parse(rawJsonStr);
        return this.fromTinkercad(parsed);
      } catch (err) {
        throw new Error('Invalid JSON payload: ' + err.message);
      }
    }

    if (!urlStr || !urlStr.trim()) {
      throw new Error('Please enter a Tinkercad public share link or paste JSON.');
    }

    const urlInfo = this.parseTinkercadUrl(urlStr);
    if (!urlInfo.valid) {
      throw new Error('Invalid Tinkercad URL format. Expected: https://www.tinkercad.com/things/<id>?sharecode=...');
    }

    let pageTitle = urlInfo.title;

    // 2. Attempt fetching via CORS proxies to extract live page metadata
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(urlStr)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(urlStr)}`
    ];

    for (const proxyUrl of proxies) {
      try {
        const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const html = await res.text();
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            const rawTitle = titleMatch[1].replace('- Tinkercad', '').replace('Circuit design', '').trim();
            if (rawTitle) pageTitle = rawTitle;
          }
          break;
        }
      } catch {
        // Fallback to URL info if CORS proxy fails or times out
      }
    }

    // 3. Build normalized Native Project from Tinkercad parameters
    return this.buildTinkercadTranslatedProject(urlInfo, pageTitle);
  },

  /**
   * Constructs translated Native Circuit based on Tinkercad metadata
   */
  buildTinkercadTranslatedProject(urlInfo, pageTitle) {
    if (typeof urlInfo === 'string') {
      const parsed = this.parseTinkercadUrl(urlInfo);
      if (parsed.valid) {
        urlInfo = parsed;
      } else {
        urlInfo = { slug: urlInfo, title: pageTitle || urlInfo, thingId: '' };
      }
    } else if (!urlInfo) {
      urlInfo = { slug: '', title: pageTitle || '', thingId: '' };
    }

    const slug = (urlInfo.slug || '').toLowerCase();
    const title = (pageTitle || urlInfo.title || '').toLowerCase();
    const thingId = (urlInfo.thingId || '').toLowerCase();

    // 1. Detect Lab 04 / Boolean Logic (74HC32 OR gate + 74HC04 NOT gate + DIP Switch + Bench Power Supply)
    const isLab04 = /7muyp3p|lab-?0?4|or-not|74hc32|74hc04|a\+b|boolean/i.test(slug) ||
                    /7muyp3p|lab-?0?4|or-not|74hc32|74hc04|a\+b|boolean/i.test(title) ||
                    thingId.includes('7muyp3p');

    // 2. Detect Arduino-to-Arduino I2C Master-Slave (hlN1zSLgxrk / I2C / Potentiometer to PWM LED)
    const isI2CDualArduino = !isLab04 && (
      thingId.includes('hln1zsl') ||
      /hln1zsl|i2c|master.*slave|arduino-arduino|pot.*led/i.test(slug) ||
      /i2c|master.*slave|pot.*led/i.test(title)
    );

    // 3. Detect Arduino x Arduino Direct Pushbutton / Serial Communication (fW33vGM7l3H)
    const isDirectDualArduino = !isLab04 && !isI2CDualArduino && (
      thingId.includes('fw33vgm') ||
      /fw33vgm|arduino-x-arduino|dual.*arduino/i.test(slug) ||
      /arduino-x-arduino|dual.*arduino/i.test(title)
    );

    // 4. Detect Under-Voltage Protection System (3q5bLzaJGOu / 9V battery, buzzer, LCD, pot)
    const isUnderVoltage = !isLab04 && !isI2CDualArduino && !isDirectDualArduino && (
      thingId.includes('3q5blz') ||
      /3q5blz|under-?voltage|protection-?system|battery.*monitor/i.test(slug) ||
      /under-?voltage|protection-?system|battery.*monitor/i.test(title)
    );

    // 5. Detect ARPS2 Activity 1 (0A7EIOHHtCo / Full breadboard, 5 LEDs, 4 switches, TMP36, Buzzer)
    const isArps2 = !isLab04 && !isI2CDualArduino && !isDirectDualArduino && !isUnderVoltage && (
      thingId.includes('0a7eioh') ||
      /0a7eioh|arps2|activity-1|introductory-activity/i.test(slug) ||
      /arps2|activity 1|introductory activity/i.test(title)
    );

    // 6. Detect Ventilador com Sensor de Presenca (b0lYqnBVRnZ / PIR, DC Motor, TIP120, Diode, LCD, TMP36)
    const isVentilador = !isLab04 && !isI2CDualArduino && !isDirectDualArduino && !isUnderVoltage && !isArps2 && (
      thingId.includes('b0lyqnb') ||
      /b0lyqnb|ventilador|sensor-de-presenca|presenca.*lcd/i.test(slug) ||
      /ventilador|presenca|sensor de presenca/i.test(title)
    );

    const isDld = !isLab04 && !isI2CDualArduino && !isDirectDualArduino && !isUnderVoltage && !isArps2 && !isVentilador && (/dld|logic|gate|assignment|7408|7400/i.test(slug) || /dld|logic|gate/i.test(title));

    const components = [];
    const connections = [];

    if (!isDirectDualArduino && !isI2CDualArduino && !isUnderVoltage && !isArps2 && !isVentilador) {
      components.push({
        id: 'bb_main',
        type: 'breadboard-half',
        x: 280,
        y: 110,
        rotation: 0,
        properties: { label: 'Half Breadboard' }
      });
    }


    if (isLab04) {
      // Lab 04: Boolean Function F = A + B'

      components.push(
        {
          id: 'pwr_supply',
          type: 'power-supply',
          x: 30,
          y: 95,
          rotation: 0,
          properties: { label: 'DC Voltage Supply', voltage: '5.0V', current: '5.0A' }
        },
        {
          id: 'sw_dip4',
          type: 'dip-switch-4',
          x: 135,
          y: 360,
          rotation: 0,
          properties: { label: 'B A', positions: 4 }
        },
        {
          id: 'ic_74hc32',
          type: 'chip-74hc32',
          x: 410,
          y: 205,
          rotation: 0,
          properties: { label: '74HC32', function: 'OR gate' }
        },
        {
          id: 'ic_74hc04',
          type: 'chip-74hc04',
          x: 630,
          y: 205,
          rotation: 0,
          properties: { label: '74HC04', function: 'NOT gate' }
        },
        {
          id: 'led_output',
          type: 'led',
          x: 850,
          y: 120,
          rotation: 0,
          properties: { color: 'red', label: "A + B'" }
        }
      );

      connections.push(
        // Power Supply Red (+) to Breadboard Top + Rail (col 1)
        {
          id: 'wire_pwr_pos',
          from: { component: 'pwr_supply', pin: 'V+' },
          to: { component: 'bb_main', pin: 'top_rail_pos_1' },
          color: '#ef4444',
          bends: []
        },
        // Power Supply Black (-) to Breadboard Top - Rail (col 1)
        {
          id: 'wire_pwr_neg',
          from: { component: 'pwr_supply', pin: 'V-' },
          to: { component: 'bb_main', pin: 'top_rail_neg_1' },
          color: '#0f172a',
          bends: []
        },
        // Power Rail Bridge: Top + Rail (col 2) to Bottom + Rail (col 2)
        {
          id: 'wire_bridge_pos',
          from: { component: 'bb_main', pin: 'top_rail_pos_2' },
          to: { component: 'bb_main', pin: 'bottom_rail_pos_2' },
          color: '#ef4444',
          bends: []
        },
        // Power Rail Bridge: Top - Rail (col 30) to Bottom - Rail (col 30)
        {
          id: 'wire_bridge_neg',
          from: { component: 'bb_main', pin: 'top_rail_neg_30' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_30' },
          color: '#0f172a',
          bends: []
        },
        // DIP Switch 1 Top Terminal to Bottom + Rail (col 4)
        {
          id: 'wire_sw1_pwr',
          from: { component: 'bb_main', pin: 'bottom_rail_pos_4' },
          to: { component: 'sw_dip4', pin: '1a' },
          color: '#ef4444',
          bends: []
        },
        // DIP Switch 2 Top Terminal to Bottom + Rail (col 5)
        {
          id: 'wire_sw2_pwr',
          from: { component: 'bb_main', pin: 'bottom_rail_pos_5' },
          to: { component: 'sw_dip4', pin: '2a' },
          color: '#ef4444',
          bends: []
        },
        // DIP Switch 1 Bottom Terminal (Input B) to 74HC04 Pin 1 (col 17)
        {
          id: 'wire_sw1_to_not',
          from: { component: 'sw_dip4', pin: '1b' },
          to: { component: 'ic_74hc04', pin: '1' },
          color: '#10b981',
          label: 'Input B',
          bends: []
        },
        // DIP Switch 2 Bottom Terminal (Input A) to 74HC32 Pin 1 (col 6)
        {
          id: 'wire_sw2_to_or',
          from: { component: 'sw_dip4', pin: '2b' },
          to: { component: 'ic_74hc32', pin: '1' },
          color: '#10b981',
          label: 'Input A',
          bends: []
        },
        // 74HC32 Pin 14 (VCC, col 6) to Top + Rail (col 6)
        {
          id: 'wire_vcc_or',
          from: { component: 'bb_main', pin: 'top_rail_pos_6' },
          to: { component: 'ic_74hc32', pin: '14' },
          color: '#ef4444',
          bends: []
        },
        // 74HC32 Pin 7 (GND, col 12) to Bottom - Rail (col 12)
        {
          id: 'wire_gnd_or',
          from: { component: 'bb_main', pin: 'bottom_rail_neg_12' },
          to: { component: 'ic_74hc32', pin: '7' },
          color: '#0f172a',
          bends: []
        },
        // 74HC04 Pin 14 (VCC, col 17) to Top + Rail (col 17)
        {
          id: 'wire_vcc_not',
          from: { component: 'bb_main', pin: 'top_rail_pos_17' },
          to: { component: 'ic_74hc04', pin: '14' },
          color: '#ef4444',
          bends: []
        },
        // 74HC04 Pin 7 (GND, col 23) to Bottom - Rail (col 23)
        {
          id: 'wire_gnd_not',
          from: { component: 'bb_main', pin: 'bottom_rail_neg_23' },
          to: { component: 'ic_74hc04', pin: '7' },
          color: '#0f172a',
          bends: []
        },
        // 74HC04 Pin 2 Output (B') to 74HC32 Pin 2 (col 7)
        {
          id: 'wire_not_to_or',
          from: { component: 'ic_74hc04', pin: '2' },
          to: { component: 'ic_74hc32', pin: '2' },
          color: '#eab308',
          label: "B'",
          bends: []
        },
        // 74HC32 Pin 3 Output (A + B') to LED Anode (col 28)
        {
          id: 'wire_or_to_led',
          from: { component: 'ic_74hc32', pin: '3' },
          to: { component: 'led_output', pin: 'anode' },
          color: '#ef4444',
          label: "A + B'",
          bends: []
        },
        // LED Cathode (col 29) to Top - Rail (col 29)
        {
          id: 'wire_led_gnd',
          from: { component: 'led_output', pin: 'cathode' },
          to: { component: 'bb_main', pin: 'top_rail_neg_29' },
          color: '#0f172a',
          bends: []
        }
      );
    } else if (isI2CDualArduino) {
      // Arduino-to-Arduino I2C Master-Slave Communication Setup
      components.push(
        {
          id: 'arduino_master',
          type: 'arduino-uno',
          x: 100,
          y: 70,
          rotation: 0,
          properties: { label: 'Arduino Uno (Master)' }
        },
        {
          id: 'arduino_slave',
          type: 'arduino-uno',
          x: 640,
          y: 70,
          rotation: 0,
          properties: { label: 'Arduino Uno (Slave)' }
        },
        {
          id: 'bb_main',
          type: 'breadboard-half',
          x: 430,
          y: 430,
          rotation: 0,
          properties: { label: 'Half Breadboard' }
        },
        {
          id: 'pot_input',
          type: 'potentiometer',
          x: 520,
          y: 470,
          rotation: 0,
          properties: { label: 'Potentiometer', resistance: '10k' }
        },
        {
          id: 'res_led',
          type: 'resistor',
          x: 770,
          y: 560,
          rotation: 90,
          properties: { resistance: '220', label: '220Ω' }
        },
        {
          id: 'led_pwm',
          type: 'led',
          x: 765,
          y: 480,
          rotation: 0,
          properties: { color: 'red', label: 'PWM Dimmer LED' }
        }
      );

      connections.push(
        // 1. I2C Bus: 5V Power Link between Master and Slave
        {
          id: 'wire_i2c_5v',
          from: { component: 'arduino_master', pin: '5V' },
          to: { component: 'arduino_slave', pin: '5V' },
          color: '#10b981',
          label: 'I2C 5V Bus',
          bends: []
        },
        // 2. I2C Bus: Common Ground Reference between Master and Slave
        {
          id: 'wire_i2c_gnd',
          from: { component: 'arduino_master', pin: 'GND.1' },
          to: { component: 'arduino_slave', pin: 'GND.1' },
          color: '#10b981',
          label: 'I2C GND Bus',
          bends: []
        },
        // 3. I2C Bus: SDA Data Line (A4 to A4)
        {
          id: 'wire_i2c_sda',
          from: { component: 'arduino_master', pin: 'A4' },
          to: { component: 'arduino_slave', pin: 'A4' },
          color: '#10b981',
          label: 'I2C SDA (A4)',
          bends: []
        },
        // 4. I2C Bus: SCL Clock Line (A5 to A5)
        {
          id: 'wire_i2c_scl',
          from: { component: 'arduino_master', pin: 'A5' },
          to: { component: 'arduino_slave', pin: 'A5' },
          color: '#10b981',
          label: 'I2C SCL (A5)',
          bends: []
        },
        // 5. Master 5V to Breadboard Bottom + Rail
        {
          id: 'wire_master_bb_vcc',
          from: { component: 'arduino_master', pin: '5V' },
          to: { component: 'bb_main', pin: 'bottom_rail_pos_1' },
          color: '#ef4444',
          bends: []
        },
        // 6. Master GND to Breadboard Bottom - Rail
        {
          id: 'wire_master_bb_gnd',
          from: { component: 'arduino_master', pin: 'GND.2' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_1' },
          color: '#0f172a',
          bends: []
        },
        // 7. Potentiometer Wiper to Master Pin A0
        {
          id: 'wire_pot_wiper',
          from: { component: 'arduino_master', pin: 'A0' },
          to: { component: 'pot_input', pin: 'wiper' },
          color: '#eab308',
          label: 'Analog In (A0)',
          bends: []
        },
        // 8. Breadboard Bottom + Rail to Potentiometer Pin 3
        {
          id: 'wire_pot_vcc',
          from: { component: 'bb_main', pin: 'bottom_rail_pos_10' },
          to: { component: 'pot_input', pin: '3' },
          color: '#ef4444',
          bends: []
        },
        // 9. Breadboard Bottom - Rail to Potentiometer Pin 1
        {
          id: 'wire_pot_gnd',
          from: { component: 'bb_main', pin: 'bottom_rail_neg_8' },
          to: { component: 'pot_input', pin: '1' },
          color: '#0f172a',
          bends: []
        },
        // 10. Slave Pin 9 (PWM) looping around right edge to Resistor Pin 1
        {
          id: 'wire_slave_pwm',
          from: { component: 'arduino_slave', pin: '9' },
          to: { component: 'res_led', pin: '1' },
          color: '#ef4444',
          label: 'PWM Out (Pin 9)',
          bends: []
        },
        // 11. Resistor Pin 2 to Red LED Anode
        {
          id: 'wire_res_led',
          from: { component: 'res_led', pin: '2' },
          to: { component: 'led_pwm', pin: 'anode' },
          color: '#ef4444',
          bends: []
        },
        // 12. Red LED Cathode to Breadboard Bottom - Rail
        {
          id: 'wire_led_gnd',
          from: { component: 'led_pwm', pin: 'cathode' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_24' },
          color: '#0f172a',
          bends: []
        }
      );
    } else if (isDirectDualArduino) {

      // Arduino x Arduino: Dual MCU Direct Communication Setup
      components.push(
        {
          id: 'arduino_tx',
          type: 'arduino-uno',
          x: 100,
          y: 280,
          rotation: 0,
          properties: { label: 'Arduino Uno (Sender)' }
        },
        {
          id: 'arduino_rx',
          type: 'arduino-uno',
          x: 680,
          y: 280,
          rotation: 0,
          properties: { label: 'Arduino Uno (Receiver)' }
        },
        {
          id: 'btn_input',
          type: 'pushbutton',
          x: 400,
          y: 400,
          rotation: 0,
          properties: { label: 'Transmit Pushbutton' }
        },
        {
          id: 'res_pulldown',
          type: 'resistor',
          x: 395,
          y: 470,
          rotation: 90,
          properties: { resistance: '10k', label: '10kΩ Pull-down' }
        },
        {
          id: 'res_led',
          type: 'resistor',
          x: 745,
          y: 240,
          rotation: 90,
          properties: { resistance: '220', label: '220Ω' }
        },
        {
          id: 'led_rx',
          type: 'led',
          x: 740,
          y: 165,
          rotation: 0,
          properties: { color: 'green', label: 'RX Signal LED' }
        },
        {
          id: 'multimeter_1',
          type: 'multimeter',
          x: 710,
          y: 40,
          rotation: 0,
          properties: { mode: 'voltage', reading: '5.00 V', label: 'Digital Multimeter' }
        }
      );

      connections.push(
        // 1. Common Ground Wire bridging Left Arduino and Right Arduino
        {
          id: 'wire_common_gnd',
          from: { component: 'arduino_tx', pin: 'GND.2' },
          to: { component: 'arduino_rx', pin: 'GND.1' },
          color: '#0f172a',
          label: 'Common Ground',
          bends: []
        },
        // 2. Left Arduino 5V to Pushbutton
        {
          id: 'wire_btn_pwr',
          from: { component: 'arduino_tx', pin: '5V' },
          to: { component: 'btn_input', pin: '2b' },
          color: '#ef4444',
          bends: []
        },
        // 3. Pushbutton to Left Arduino Pin 2 (Signal Input)
        {
          id: 'wire_btn_sig',
          from: { component: 'arduino_tx', pin: '2' },
          to: { component: 'btn_input', pin: '1a' },
          color: '#10b981',
          label: 'Digital In (Pin 2)',
          bends: []
        },
        // 4. Pushbutton to 10kΩ Pull-down Resistor
        {
          id: 'wire_btn_pulldown',
          from: { component: 'btn_input', pin: '1b' },
          to: { component: 'res_pulldown', pin: '1' },
          color: '#0f172a',
          bends: []
        },
        // 5. Pull-down Resistor to Left Arduino GND
        {
          id: 'wire_pulldown_gnd',
          from: { component: 'res_pulldown', pin: '2' },
          to: { component: 'arduino_tx', pin: 'GND.1' },
          color: '#0f172a',
          bends: []
        },
        // 6. Data Communication Link: Left Arduino Pin 13 across to Right Arduino Pin 12
        {
          id: 'wire_comm_data',
          from: { component: 'arduino_tx', pin: '13' },
          to: { component: 'arduino_rx', pin: '12' },
          color: '#ef4444',
          label: 'Signal Link (13 -> 12)',
          bends: []
        },
        // 7. Right Arduino Pin 12 to 220Ω Limiting Resistor
        {
          id: 'wire_rx_res',
          from: { component: 'arduino_rx', pin: '12' },
          to: { component: 'res_led', pin: '1' },
          color: '#ef4444',
          bends: []
        },
        // 8. Resistor to Green LED Anode
        {
          id: 'wire_res_led',
          from: { component: 'res_led', pin: '2' },
          to: { component: 'led_rx', pin: 'anode' },
          color: '#10b981',
          bends: []
        },
        // 9. Green LED Cathode to Right Arduino Digital Header GND
        {
          id: 'wire_led_gnd',
          from: { component: 'led_rx', pin: 'cathode' },
          to: { component: 'arduino_rx', pin: 'GND' },
          color: '#0f172a',
          bends: []
        },
        // 10. Multimeter Red probe (+) to Green LED Anode
        {
          id: 'wire_meter_pos',
          from: { component: 'multimeter_1', pin: 'V+' },
          to: { component: 'led_rx', pin: 'anode' },
          color: '#ef4444',
          bends: []
        },
        // 11. Multimeter Black probe (-) to Green LED Cathode / GND
        {
          id: 'wire_meter_neg',
          from: { component: 'multimeter_1', pin: 'COM' },
          to: { component: 'arduino_rx', pin: 'GND' },
          color: '#0f172a',
          bends: []
        }
      );
    } else if (isUnderVoltage) {
      // Under-Voltage Protection System (3q5bLzaJGOu)
      // 9V Battery + Arduino Uno + Breadboard + Potentiometer + Tactile Pushbutton + Piezo Buzzer + 16x2 I2C LCD

      components.push(
        {
          id: 'arduino_main',
          type: 'arduino-uno',
          x: 100,
          y: 220,
          rotation: 0,
          properties: { label: 'Arduino Uno R3' }
        },
        {
          id: 'bb_main',
          type: 'breadboard-half',
          x: 460,
          y: 260,
          rotation: 0,
          properties: { label: 'Half Breadboard' }
        },
        {
          id: 'battery_9v',
          type: 'battery-9v',
          x: 840,
          y: 120,
          rotation: 0,
          properties: { label: '9V Battery', voltage: '9V' }
        },
        {
          id: 'pot_input',
          type: 'potentiometer',
          x: 845,
          y: 310,
          rotation: 0,
          properties: { label: 'Simulated Discharge' }
        },
        {
          id: 'btn_reset',
          type: 'pushbutton',
          x: 855,
          y: 410,
          rotation: 0,
          properties: { label: 'Alarm Reset' }
        },
        {
          id: 'buzzer_alarm',
          type: 'buzzer',
          x: 915,
          y: 390,
          rotation: 0,
          properties: { label: 'Piezo Alarm' }
        },
        {
          id: 'lcd_i2c',
          type: 'lcd1602-i2c',
          x: 460,
          y: 560,
          rotation: 0,
          properties: { label: '16x2 I2C LCD', text: 'V: 8.94V NORMAL' }
        }
      );

      connections.push(
        // 1. 9V Battery Positive to Breadboard Top + Rail
        {
          id: 'wire_bat_pos',
          from: { component: 'battery_9v', pin: '+' },
          to: { component: 'bb_main', pin: 'top_rail_pos_28' },
          color: '#dc2626',
          label: '9V VCC',
          bends: []
        },
        // 2. 9V Battery Negative to Breadboard Top - Rail
        {
          id: 'wire_bat_neg',
          from: { component: 'battery_9v', pin: '-' },
          to: { component: 'bb_main', pin: 'top_rail_neg_27' },
          color: '#0f172a',
          label: '9V GND',
          bends: []
        },
        // 3. Potentiometer Pin 3 to Breadboard Top + Rail
        {
          id: 'wire_pot_vcc',
          from: { component: 'bb_main', pin: 'top_rail_pos_30' },
          to: { component: 'pot_input', pin: '3' },
          color: '#dc2626',
          bends: []
        },
        // 4. Potentiometer Pin 1 to Breadboard Top - Rail
        {
          id: 'wire_pot_gnd',
          from: { component: 'bb_main', pin: 'top_rail_neg_29' },
          to: { component: 'pot_input', pin: '1' },
          color: '#0f172a',
          bends: []
        },
        // 5. Potentiometer Wiper to Arduino Pin A0
        {
          id: 'wire_pot_wiper',
          from: { component: 'pot_input', pin: 'wiper' },
          to: { component: 'arduino_main', pin: 'A0' },
          color: '#eab308',
          label: 'Analog In (A0)',
          bends: []
        },
        // 6. AREF External Precision Reference Jumper (3.3V to AREF)
        {
          id: 'wire_aref_jump',
          from: { component: 'arduino_main', pin: '3.3V' },
          to: { component: 'arduino_main', pin: 'AREF' },
          color: '#a855f7',
          label: '3.3V AREF Jumper',
          bends: []
        },
        // 7. Arduino 5V to LCD VCC
        {
          id: 'wire_lcd_vcc',
          from: { component: 'arduino_main', pin: '5V' },
          to: { component: 'lcd_i2c', pin: 'VCC' },
          color: '#dc2626',
          bends: []
        },
        // 8. Arduino GND.1 to LCD GND
        {
          id: 'wire_lcd_gnd',
          from: { component: 'arduino_main', pin: 'GND.1' },
          to: { component: 'lcd_i2c', pin: 'GND' },
          color: '#10b981',
          bends: []
        },
        // 9. Arduino A4 (SDA) to LCD SDA
        {
          id: 'wire_lcd_sda',
          from: { component: 'arduino_main', pin: 'A4' },
          to: { component: 'lcd_i2c', pin: 'SDA' },
          color: '#0284c7',
          label: 'I2C SDA',
          bends: []
        },
        // 10. Arduino A5 (SCL) to LCD SCL
        {
          id: 'wire_lcd_scl',
          from: { component: 'arduino_main', pin: 'A5' },
          to: { component: 'lcd_i2c', pin: 'SCL' },
          color: '#eab308',
          label: 'I2C SCL',
          bends: []
        },
        // 11. Arduino Pin 8 to Piezo Buzzer Positive (loops over top and right)
        {
          id: 'wire_buzzer_pos',
          from: { component: 'arduino_main', pin: '8' },
          to: { component: 'buzzer_alarm', pin: '+' },
          color: '#ec4899',
          label: 'Alarm Tone (Pin 8)',
          bends: []
        },
        // 12. Piezo Buzzer Negative to Breadboard Bottom - Rail
        {
          id: 'wire_buzzer_neg',
          from: { component: 'buzzer_alarm', pin: '-' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_30' },
          color: '#0f172a',
          bends: []
        },
        // 13. Arduino RESET to Pushbutton Terminal 2a (loops under LCD)
        {
          id: 'wire_reset_btn',
          from: { component: 'arduino_main', pin: 'RESET' },
          to: { component: 'btn_reset', pin: '2a' },
          color: '#f97316',
          label: 'Hardware Reset',
          bends: []
        },
        // 14. Pushbutton Terminal 1a to Breadboard Bottom - Rail
        {
          id: 'wire_btn_gnd',
          from: { component: 'btn_reset', pin: '1a' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_28' },
          color: '#0f172a',
          bends: []
        },
        // 15. Arduino GND.2 to Breadboard Bottom - Rail
        {
          id: 'wire_bb_gnd',
          from: { component: 'arduino_main', pin: 'GND.2' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_1' },
          color: '#0f172a',
          bends: []
        },
        // 16. Common Ground Bridging Top - Rail and Bottom - Rail
        {
          id: 'wire_rail_gnd',
          from: { component: 'bb_main', pin: 'top_rail_neg_26' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg_26' },
          color: '#0f172a',
          label: 'Common GND Rail',
          bends: []
        }
      );
    } else if (isArps2) {
      // ARPS2 Introductory Activity 1 (0A7EIOHHtCo)
      // Arduino Uno + Full Breadboard + 5 Amber LEDs + 4 Pushbuttons + TMP36 + Capacitor + Buzzer
      components.push(
        { id: 'arduino_main', type: 'arduino-uno', x: 80, y: 320, rotation: 0, properties: { label: 'Arduino Uno R3' } },
        { id: 'bb_full', type: 'breadboard-full', x: 420, y: 350, rotation: 0, properties: { label: 'Full Breadboard' } },
        { id: 'led_5', type: 'led', x: 490, y: 440, rotation: 0, properties: { color: 'orange', label: 'LED 5' } },
        { id: 'led_4', type: 'led', x: 510, y: 440, rotation: 0, properties: { color: 'orange', label: 'LED 4' } },
        { id: 'led_3', type: 'led', x: 530, y: 440, rotation: 0, properties: { color: 'orange', label: 'LED 3' } },
        { id: 'led_2', type: 'led', x: 550, y: 440, rotation: 0, properties: { color: 'orange', label: 'LED 2' } },
        { id: 'led_1', type: 'led', x: 570, y: 440, rotation: 0, properties: { color: 'orange', label: 'LED 1' } },
        { id: 'btn_sw5', type: 'pushbutton', x: 580, y: 540, rotation: 0, properties: { label: 'SW5' } },
        { id: 'btn_sw3', type: 'pushbutton', x: 600, y: 460, rotation: 0, properties: { label: 'SW3' } },
        { id: 'btn_sw4', type: 'pushbutton', x: 630, y: 540, rotation: 0, properties: { label: 'SW4' } },
        { id: 'btn_sw2', type: 'pushbutton', x: 630, y: 480, rotation: 0, properties: { label: 'SW2' } },
        { id: 'sensor_tmp', type: 'sensor-tmp36', x: 660, y: 500, rotation: 0, properties: { label: 'TMP36' } },
        { id: 'cap_decouple', type: 'capacitor', x: 650, y: 540, rotation: 0, properties: { label: '104 Cap' } },
        { id: 'buzzer_alarm', type: 'buzzer', x: 670, y: 310, rotation: 0, properties: { label: 'Piezo Buzzer' } }
      );

      connections.push(
        // LEDs to Arduino Digital Pins
        { id: 'wire_led5', from: { component: 'arduino_main', pin: '11' }, to: { component: 'led_5', pin: 'anode' }, color: '#eab308' },
        { id: 'wire_led4', from: { component: 'arduino_main', pin: '10' }, to: { component: 'led_4', pin: 'anode' }, color: '#eab308' },
        { id: 'wire_led3', from: { component: 'arduino_main', pin: '9' }, to: { component: 'led_3', pin: 'anode' }, color: '#eab308' },
        { id: 'wire_led2', from: { component: 'arduino_main', pin: '6' }, to: { component: 'led_2', pin: 'anode' }, color: '#eab308' },
        { id: 'wire_led1', from: { component: 'arduino_main', pin: '5' }, to: { component: 'led_1', pin: 'anode' }, color: '#eab308' },
        // Switches to Arduino Digital Pins
        { id: 'wire_sw5', from: { component: 'arduino_main', pin: '2' }, to: { component: 'btn_sw5', pin: '1a' }, color: '#10b981' },
        { id: 'wire_sw3', from: { component: 'arduino_main', pin: '3' }, to: { component: 'btn_sw3', pin: '1a' }, color: '#10b981' },
        { id: 'wire_sw4', from: { component: 'arduino_main', pin: '4' }, to: { component: 'btn_sw4', pin: '1a' }, color: '#10b981' },
        { id: 'wire_sw2', from: { component: 'arduino_main', pin: '7' }, to: { component: 'btn_sw2', pin: '1a' }, color: '#10b981' },
        // Buzzer to Digital Pin 8
        { id: 'wire_buzzer', from: { component: 'arduino_main', pin: '8' }, to: { component: 'buzzer_alarm', pin: '+' }, color: '#ec4899' },
        { id: 'wire_buzzer_gnd', from: { component: 'buzzer_alarm', pin: '-' }, to: { component: 'bb_full', pin: 'top_rail_neg_27' }, color: '#0f172a' },
        // TMP36 to Pin A0
        { id: 'wire_tmp_sig', from: { component: 'sensor_tmp', pin: '2' }, to: { component: 'arduino_main', pin: 'A0' }, color: '#f97316' },
        { id: 'wire_tmp_vcc', from: { component: 'sensor_tmp', pin: '1' }, to: { component: 'bb_full', pin: 'bottom_rail_pos_24' }, color: '#dc2626' },
        { id: 'wire_tmp_gnd', from: { component: 'sensor_tmp', pin: '3' }, to: { component: 'bb_full', pin: 'bottom_rail_neg_24' }, color: '#0f172a' },
        // Power rails
        { id: 'wire_pwr_5v', from: { component: 'arduino_main', pin: '5V' }, to: { component: 'bb_full', pin: 'bottom_rail_pos_1' }, color: '#dc2626' },
        { id: 'wire_pwr_gnd', from: { component: 'arduino_main', pin: 'GND.1' }, to: { component: 'bb_full', pin: 'bottom_rail_neg_1' }, color: '#0f172a' }
      );
    } else if (isVentilador) {
      // Ventilador com Sensor de Presença e Tela LCD (b0lYqnBVRnZ)
      // Arduino Uno + PIR + DC Motor + Diode + TIP120 + TMP36 + LCD1602 I2C + Breadboard
      components.push(
        { id: 'arduino_main', type: 'arduino-uno', x: 140, y: 340, rotation: 0, properties: { label: 'Arduino Uno R3' } },
        { id: 'bb_main', type: 'breadboard-half', x: 620, y: 360, rotation: 0, properties: { label: 'Half Breadboard' } },
        { id: 'pir_sensor', type: 'pir-sensor', x: 180, y: 80, rotation: 0, properties: { label: 'PIR Motion Sensor' } },
        { id: 'motor_fan', type: 'dc-motor', x: 440, y: 80, rotation: 0, properties: { label: 'DC Fan Motor' } },
        { id: 'diode_flyback', type: 'diode', x: 450, y: 20, rotation: 0, properties: { label: '1N4001 Flyback' } },
        { id: 'transistor_q1', type: 'transistor-tip120', x: 580, y: 120, rotation: 0, properties: { label: 'TIP120 NPN' } },
        { id: 'sensor_tmp', type: 'sensor-tmp36', x: 480, y: 440, rotation: 0, properties: { label: 'TMP36' } },
        { id: 'lcd_i2c', type: 'lcd1602-i2c', x: 630, y: 680, rotation: 0, properties: { label: '16x2 I2C LCD', text: 'FAN: ON  TMP: 28C' } },
        { id: 'led_status', type: 'led', x: 280, y: 300, rotation: 0, properties: { color: 'red', label: 'Status LED' } },
        { id: 'res_base', type: 'resistor', x: 580, y: 200, rotation: 90, properties: { resistance: '1k' } }
      );

      connections.push(
        // PIR Sensor
        { id: 'wire_pir_vcc', from: { component: 'pir_sensor', pin: 'vcc' }, to: { component: 'bb_main', pin: 'top_rail_pos_2' }, color: '#dc2626' },
        { id: 'wire_pir_gnd', from: { component: 'pir_sensor', pin: 'gnd' }, to: { component: 'bb_main', pin: 'top_rail_neg_2' }, color: '#0f172a' },
        { id: 'wire_pir_sig', from: { component: 'pir_sensor', pin: 'out' }, to: { component: 'arduino_main', pin: '2' }, color: '#0284c7' },
        // DC Motor & Diode
        { id: 'wire_motor_pos', from: { component: 'motor_fan', pin: '+' }, to: { component: 'bb_main', pin: 'top_rail_pos_3' }, color: '#dc2626' },
        { id: 'wire_motor_neg', from: { component: 'motor_fan', pin: '-' }, to: { component: 'transistor_q1', pin: 'collector' }, color: '#0f172a' },
        { id: 'wire_diode_cat', from: { component: 'diode_flyback', pin: 'cathode' }, to: { component: 'motor_fan', pin: '+' }, color: '#dc2626' },
        { id: 'wire_diode_ano', from: { component: 'diode_flyback', pin: 'anode' }, to: { component: 'motor_fan', pin: '-' }, color: '#0284c7' },
        // TIP120 Transistor Drive
        { id: 'wire_pwm_base', from: { component: 'arduino_main', pin: '9' }, to: { component: 'res_base', pin: '1' }, color: '#f97316' },
        { id: 'wire_res_base', from: { component: 'res_base', pin: '2' }, to: { component: 'transistor_q1', pin: 'base' }, color: '#0284c7' },
        { id: 'wire_tip_emit', from: { component: 'transistor_q1', pin: 'emitter' }, to: { component: 'bb_main', pin: 'top_rail_neg_3' }, color: '#0f172a' },
        // TMP36 Temperature Sensor
        { id: 'wire_tmp_vcc', from: { component: 'sensor_tmp', pin: '1' }, to: { component: 'bb_main', pin: 'bottom_rail_pos_1' }, color: '#dc2626' },
        { id: 'wire_tmp_gnd', from: { component: 'sensor_tmp', pin: '3' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a' },
        { id: 'wire_tmp_sig', from: { component: 'sensor_tmp', pin: '2' }, to: { component: 'arduino_main', pin: 'A0' }, color: '#f97316' },
        // 16x2 I2C LCD
        { id: 'wire_lcd_gnd', from: { component: 'lcd_i2c', pin: 'gnd' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_2' }, color: '#10b981' },
        { id: 'wire_lcd_vcc', from: { component: 'lcd_i2c', pin: 'vcc' }, to: { component: 'bb_main', pin: 'bottom_rail_pos_2' }, color: '#dc2626' },
        { id: 'wire_lcd_sda', from: { component: 'lcd_i2c', pin: 'sda' }, to: { component: 'arduino_main', pin: 'A4' }, color: '#eab308' },
        { id: 'wire_lcd_scl', from: { component: 'lcd_i2c', pin: 'scl' }, to: { component: 'arduino_main', pin: 'A5' }, color: '#0284c7' },
        // Status LED on Pin 13
        { id: 'wire_led_pin13', from: { component: 'arduino_main', pin: '13' }, to: { component: 'led_status', pin: 'anode' }, color: '#eab308' },
        { id: 'wire_led_gnd', from: { component: 'led_status', pin: 'cathode' }, to: { component: 'arduino_main', pin: 'GND' }, color: '#0f172a' },
        // Power Distribution
        { id: 'wire_mcu_5v', from: { component: 'arduino_main', pin: '5V' }, to: { component: 'bb_main', pin: 'bottom_rail_pos_3' }, color: '#dc2626' },
        { id: 'wire_mcu_gnd', from: { component: 'arduino_main', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_3' }, color: '#0f172a' },
        { id: 'wire_rail_gnd', from: { component: 'bb_main', pin: 'top_rail_neg_30' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_30' }, color: '#0f172a' },
        { id: 'wire_rail_pos', from: { component: 'bb_main', pin: 'top_rail_pos_30' }, to: { component: 'bb_main', pin: 'bottom_rail_pos_30' }, color: '#dc2626' }
      );
    } else if (isDld) {

      // Digital Logic Design setup (7408 AND Gate)
      components.push(
        {
          id: 'ic_7408',
          type: 'dip-ic',
          x: 440,
          y: 195,
          rotation: 0,
          properties: { label: '7408 AND' }
        },
        {
          id: 'btn_input_a',
          type: 'pushbutton',
          x: 180,
          y: 140,
          rotation: 0,
          properties: { label: 'Input A' }
        },
        {
          id: 'btn_input_b',
          type: 'pushbutton',
          x: 180,
          y: 220,
          rotation: 0,
          properties: { label: 'Input B' }
        },
        {
          id: 'res_pull_a',
          type: 'resistor',
          x: 230,
          y: 170,
          rotation: 90,
          properties: { resistance: '10k' }
        },
        {
          id: 'res_pull_b',
          type: 'resistor',
          x: 230,
          y: 250,
          rotation: 90,
          properties: { resistance: '10k' }
        },
        {
          id: 'res_led_limit',
          type: 'resistor',
          x: 580,
          y: 180,
          rotation: 0,
          properties: { resistance: '220' }
        },
        {
          id: 'led_output',
          type: 'led',
          x: 680,
          y: 170,
          rotation: 0,
          properties: { color: 'green', label: 'AND Out' }
        }
      );

      connections.push(
        {
          id: 'wire_vcc_ic',
          from: { component: 'bb_main', pin: 'top_rail_pos' },
          to: { component: 'ic_7408', pin: 'VCC' },
          color: '#ef4444',
          bends: []
        },
        {
          id: 'wire_gnd_ic',
          from: { component: 'bb_main', pin: 'bottom_rail_neg' },
          to: { component: 'ic_7408', pin: 'GND' },
          color: '#0284c7',
          bends: []
        },
        {
          id: 'wire_in_a',
          from: { component: 'btn_input_a', pin: '2' },
          to: { component: 'ic_7408', pin: '1A' },
          color: '#f59e0b',
          bends: []
        },
        {
          id: 'wire_in_b',
          from: { component: 'btn_input_b', pin: '2' },
          to: { component: 'ic_7408', pin: '1B' },
          color: '#f59e0b',
          bends: []
        },
        {
          id: 'wire_out_res',
          from: { component: 'ic_7408', pin: '1Y' },
          to: { component: 'res_led_limit', pin: '1' },
          color: '#10b981',
          bends: []
        },
        {
          id: 'wire_res_led',
          from: { component: 'res_led_limit', pin: '2' },
          to: { component: 'led_output', pin: 'anode' },
          color: '#10b981',
          bends: []
        },
        {
          id: 'wire_led_gnd',
          from: { component: 'led_output', pin: 'cathode' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg' },
          color: '#0284c7',
          bends: []
        }
      );
    } else if (/traffic|semaforo|ampel|feux/i.test(slug) || /traffic.*light/i.test(title)) {
      // Traffic Light Controller (Red, Yellow, Green LEDs with Current-Limiting Resistors)
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'led_red', type: 'led', x: 520, y: 95, rotation: 0, properties: { color: 'red', label: 'Red Light' } },
        { id: 'led_yellow', type: 'led', x: 605, y: 95, rotation: 0, properties: { color: 'yellow', label: 'Yellow Light' } },
        { id: 'led_green', type: 'led', x: 690, y: 95, rotation: 0, properties: { color: 'green', label: 'Green Light' } },
        { id: 'res_red', type: 'resistor', x: 520, y: 160, rotation: 90, properties: { resistance: '220', label: '220Ω' } },
        { id: 'res_yellow', type: 'resistor', x: 605, y: 160, rotation: 90, properties: { resistance: '220', label: '220Ω' } },
        { id: 'res_green', type: 'resistor', x: 690, y: 160, rotation: 90, properties: { resistance: '220', label: '220Ω' } }
      );
      connections.push(
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_sig_red', from: { component: 'arduino_uno', pin: '13' }, to: { component: 'led_red', pin: 'a' }, color: '#ef4444', bends: [] },
        { id: 'w_sig_yellow', from: { component: 'arduino_uno', pin: '12' }, to: { component: 'led_yellow', pin: 'a' }, color: '#eab308', bends: [] },
        { id: 'w_sig_green', from: { component: 'arduino_uno', pin: '11' }, to: { component: 'led_green', pin: 'a' }, color: '#10b981', bends: [] },
        { id: 'w_r_red_gnd', from: { component: 'res_red', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_5' }, color: '#0f172a', bends: [] },
        { id: 'w_r_yel_gnd', from: { component: 'res_yellow', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_10' }, color: '#0f172a', bends: [] },
        { id: 'w_r_grn_gnd', from: { component: 'res_green', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_15' }, color: '#0f172a', bends: [] }
      );
    } else if (/ultrasonic|distance|hcsr04|hc-sr04|radar|sonar/i.test(slug) || /ultrasonic|distance|radar/i.test(title)) {
      // Ultrasonic Distance / Obstacle Detector System
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'sensor_sonar', type: 'ultrasonic-hcsr04', x: 480, y: 30, rotation: 0, properties: { label: 'HC-SR04 Ultrasonic' } },
        { id: 'buzzer_alert', type: 'buzzer', x: 640, y: 200, rotation: 0, properties: { label: 'Piezo Alarm' } },
        { id: 'led_dist', type: 'led', x: 570, y: 130, rotation: 0, properties: { color: 'red', label: 'Proximity Warning' } },
        { id: 'res_dist', type: 'resistor', x: 570, y: 175, rotation: 90, properties: { resistance: '220', label: '220Ω' } }
      );
      connections.push(
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'sensor_sonar', pin: 'VCC' }, color: '#ef4444', bends: [] },
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'sensor_sonar', pin: 'GND' }, color: '#0f172a', bends: [] },
        { id: 'w_trig', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'sensor_sonar', pin: 'TRIG' }, color: '#0284c7', bends: [] },
        { id: 'w_echo', from: { component: 'arduino_uno', pin: '10' }, to: { component: 'sensor_sonar', pin: 'ECHO' }, color: '#eab308', bends: [] },
        { id: 'w_buzz_pos', from: { component: 'arduino_uno', pin: '8' }, to: { component: 'buzzer_alert', pin: '1' }, color: '#f97316', bends: [] },
        { id: 'w_buzz_neg', from: { component: 'buzzer_alert', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_20' }, color: '#0f172a', bends: [] },
        { id: 'w_led_sig', from: { component: 'arduino_uno', pin: '13' }, to: { component: 'led_dist', pin: 'a' }, color: '#ef4444', bends: [] },
        { id: 'w_led_res', from: { component: 'led_dist', pin: 'c' }, to: { component: 'res_dist', pin: '1' }, color: '#10b981', bends: [] },
        { id: 'w_res_gnd', from: { component: 'res_dist', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_15' }, color: '#0f172a', bends: [] }
      );
    } else if (/servo|sg90|sweep/i.test(slug) || /servo/i.test(title)) {
      // Servo Motor Angle / Sweep Controller
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'servo_motor', type: 'servo', x: 790, y: 130, rotation: 0, properties: { label: 'Micro Servo SG90' } },
        { id: 'pot_angle', type: 'potentiometer', x: 500, y: 135, rotation: 0, properties: { label: '10kΩ Potentiometer', resistance: '10k' } }
      );
      connections.push(
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'top_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_servo_sig', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'servo_motor', pin: 'PWM' }, color: '#f97316', bends: [] },
        { id: 'w_servo_pwr', from: { component: 'bb_main', pin: 'top_rail_pos_25' }, to: { component: 'servo_motor', pin: 'V+' }, color: '#ef4444', bends: [] },
        { id: 'w_servo_gnd', from: { component: 'bb_main', pin: 'top_rail_neg_25' }, to: { component: 'servo_motor', pin: 'GND' }, color: '#0f172a', bends: [] },
        { id: 'w_pot_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_5' }, to: { component: 'pot_angle', pin: '1' }, color: '#ef4444', bends: [] },
        { id: 'w_pot_sig', from: { component: 'pot_angle', pin: '2' }, to: { component: 'arduino_uno', pin: 'A0' }, color: '#0284c7', bends: [] },
        { id: 'w_pot_gnd', from: { component: 'bb_main', pin: 'top_rail_neg_5' }, to: { component: 'pot_angle', pin: '3' }, color: '#0f172a', bends: [] }
      );
    } else if (/ldr|photoresistor|night-light|street-light|smart-light|light-sensor/i.test(slug) || /night.*light|ldr|photoresistor/i.test(title)) {
      // Smart Street Light / LDR Night Light
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'sensor_ldr', type: 'photoresistor', x: 490, y: 130, rotation: 0, properties: { label: 'Photoresistor (LDR)' } },
        { id: 'res_div', type: 'resistor', x: 490, y: 175, rotation: 90, properties: { resistance: '10k', label: '10kΩ' } },
        { id: 'led_lamp', type: 'led', x: 650, y: 130, rotation: 0, properties: { color: 'yellow', label: 'Street Lamp' } },
        { id: 'res_lamp', type: 'resistor', x: 650, y: 175, rotation: 90, properties: { resistance: '220', label: '220Ω' } }
      );
      connections.push(
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_ldr_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_5' }, to: { component: 'sensor_ldr', pin: '1' }, color: '#ef4444', bends: [] },
        { id: 'w_ldr_node', from: { component: 'sensor_ldr', pin: '2' }, to: { component: 'res_div', pin: '1' }, color: '#0284c7', bends: [] },
        { id: 'w_ldr_a0', from: { component: 'sensor_ldr', pin: '2' }, to: { component: 'arduino_uno', pin: 'A0' }, color: '#0284c7', bends: [] },
        { id: 'w_div_gnd', from: { component: 'res_div', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_5' }, color: '#0f172a', bends: [] },
        { id: 'w_lamp_sig', from: { component: 'arduino_uno', pin: '13' }, to: { component: 'led_lamp', pin: 'a' }, color: '#eab308', bends: [] },
        { id: 'w_lamp_res', from: { component: 'led_lamp', pin: 'c' }, to: { component: 'res_lamp', pin: '1' }, color: '#10b981', bends: [] },
        { id: 'w_lamp_gnd', from: { component: 'res_lamp', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_15' }, color: '#0f172a', bends: [] }
      );
    } else if (/dc-motor|motor-speed|fan/i.test(slug) || /dc.*motor|motor.*speed/i.test(title)) {
      // DC Motor Driver / Fan Speed Controller
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'dc_motor', type: 'dc-motor', x: 800, y: 130, rotation: 0, properties: { label: 'DC Motor' } },
        { id: 'bjt_tip120', type: 'transistor-tip120', x: 570, y: 130, rotation: 0, properties: { label: 'TIP120 NPN Darlington' } },
        { id: 'diode_flyback', type: 'diode', x: 640, y: 130, rotation: 0, properties: { label: '1N4007 Flyback Diode' } },
        { id: 'res_base', type: 'resistor', x: 520, y: 140, rotation: 0, properties: { resistance: '1k', label: '1kΩ' } },
        { id: 'pot_speed', type: 'potentiometer', x: 450, y: 180, rotation: 0, properties: { label: 'Speed Dial', resistance: '10k' } }
      );
      connections.push(
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_pot_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_2' }, to: { component: 'pot_speed', pin: '1' }, color: '#ef4444', bends: [] },
        { id: 'w_pot_sig', from: { component: 'pot_speed', pin: '2' }, to: { component: 'arduino_uno', pin: 'A0' }, color: '#0284c7', bends: [] },
        { id: 'w_pot_gnd', from: { component: 'bb_main', pin: 'bottom_rail_neg_2' }, to: { component: 'pot_speed', pin: '3' }, color: '#0f172a', bends: [] },
        { id: 'w_pwm_out', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'res_base', pin: '1' }, color: '#f97316', bends: [] },
        { id: 'w_base_in', from: { component: 'res_base', pin: '2' }, to: { component: 'bjt_tip120', pin: 'base' }, color: '#f97316', bends: [] },
        { id: 'w_emitter_gnd', from: { component: 'bjt_tip120', pin: 'emitter' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_10' }, color: '#0f172a', bends: [] },
        { id: 'w_motor_pos', from: { component: 'bb_main', pin: 'top_rail_pos_20' }, to: { component: 'dc_motor', pin: '1' }, color: '#ef4444', bends: [] },
        { id: 'w_motor_neg', from: { component: 'dc_motor', pin: '2' }, to: { component: 'bjt_tip120', pin: 'collector' }, color: '#0284c7', bends: [] },
        { id: 'w_diode_cath', from: { component: 'diode_flyback', pin: 'cathode' }, to: { component: 'dc_motor', pin: '1' }, color: '#ef4444', bends: [] },
        { id: 'w_diode_anode', from: { component: 'diode_flyback', pin: 'anode' }, to: { component: 'dc_motor', pin: '2' }, color: '#0284c7', bends: [] }
      );
    } else if (/555|ne555|astable|monostable|flasher|oscillator/i.test(slug) || /555.*timer/i.test(title)) {
      // NE555 Timer Astable Multivibrator / Blinker
      components.push(
        { id: 'batt_9v', type: 'battery-9v', x: 80, y: 120, rotation: 0, properties: { label: '9V Battery' } },
        { id: 'ic_ne555', type: 'chip-555', x: 500, y: 180, rotation: 0, properties: { label: 'NE555 Timer' } },
        { id: 'cap_timing', type: 'capacitor', x: 440, y: 150, rotation: 0, properties: { capacitance: '10uF', label: '10µF' } },
        { id: 'res_ra', type: 'resistor', x: 470, y: 130, rotation: 0, properties: { resistance: '10k', label: '10kΩ R1' } },
        { id: 'res_rb', type: 'resistor', x: 560, y: 130, rotation: 0, properties: { resistance: '100k', label: '100kΩ R2' } },
        { id: 'led_out', type: 'led', x: 650, y: 130, rotation: 0, properties: { color: 'red', label: 'Output Flash' } },
        { id: 'res_led', type: 'resistor', x: 650, y: 175, rotation: 90, properties: { resistance: '470', label: '470Ω' } }
      );
      connections.push(
        { id: 'w_batt_pos', from: { component: 'batt_9v', pin: 'pos' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_batt_neg', from: { component: 'batt_9v', pin: 'neg' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_555_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_10' }, to: { component: 'ic_ne555', pin: '8' }, color: '#ef4444', bends: [] },
        { id: 'w_555_rst', from: { component: 'bb_main', pin: 'top_rail_pos_10' }, to: { component: 'ic_ne555', pin: '4' }, color: '#ef4444', bends: [] },
        { id: 'w_555_gnd', from: { component: 'bb_main', pin: 'bottom_rail_neg_10' }, to: { component: 'ic_ne555', pin: '1' }, color: '#0f172a', bends: [] },
        { id: 'w_555_out', from: { component: 'ic_ne555', pin: '3' }, to: { component: 'led_out', pin: 'a' }, color: '#ef4444', bends: [] },
        { id: 'w_led_res', from: { component: 'led_out', pin: 'c' }, to: { component: 'res_led', pin: '1' }, color: '#10b981', bends: [] },
        { id: 'w_res_gnd', from: { component: 'res_led', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_15' }, color: '#0f172a', bends: [] }
      );
    } else if (/rgb|color-mixer|rainbow/i.test(slug) || /rgb.*led/i.test(title)) {
      // RGB LED Multi-Color Mixer
      components.push(
        { id: 'arduino_uno', type: 'arduino-uno', x: 60, y: 100, rotation: 0, properties: { label: 'Arduino Uno' } },
        { id: 'rgb_light', type: 'rgb-led', x: 620, y: 120, rotation: 0, properties: { label: 'RGB LED' } },
        { id: 'pot_r', type: 'potentiometer', x: 450, y: 170, rotation: 0, properties: { label: 'Red Level', resistance: '10k' } },
        { id: 'pot_g', type: 'potentiometer', x: 540, y: 170, rotation: 0, properties: { label: 'Green Level', resistance: '10k' } },
        { id: 'pot_b', type: 'potentiometer', x: 700, y: 170, rotation: 0, properties: { label: 'Blue Level', resistance: '10k' } }
      );
      connections.push(
        { id: 'w_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] },
        { id: 'w_rgb_r', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'rgb_light', pin: 'R' }, color: '#ef4444', bends: [] },
        { id: 'w_rgb_g', from: { component: 'arduino_uno', pin: '10' }, to: { component: 'rgb_light', pin: 'G' }, color: '#10b981', bends: [] },
        { id: 'w_rgb_b', from: { component: 'arduino_uno', pin: '11' }, to: { component: 'rgb_light', pin: 'B' }, color: '#0284c7', bends: [] },
        { id: 'w_rgb_cat', from: { component: 'rgb_light', pin: 'C' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_15' }, color: '#0f172a', bends: [] },
        { id: 'w_pot_r_sig', from: { component: 'pot_r', pin: '2' }, to: { component: 'arduino_uno', pin: 'A0' }, color: '#ef4444', bends: [] },
        { id: 'w_pot_g_sig', from: { component: 'pot_g', pin: '2' }, to: { component: 'arduino_uno', pin: 'A1' }, color: '#10b981', bends: [] },
        { id: 'w_pot_b_sig', from: { component: 'pot_b', pin: '2' }, to: { component: 'arduino_uno', pin: 'A2' }, color: '#0284c7', bends: [] }
      );
    } else {
      // UNIVERSAL DYNAMIC SEMANTIC SYNTHESIZER
      // Extracts any recognized components from URL slug, title, and keywords, arranging them faithfully
      components.push({
        id: 'arduino_uno',
        type: 'arduino-uno',
        x: 60,
        y: 100,
        rotation: 0,
        properties: { label: 'Arduino Uno' }
      });

      // Always connect Arduino power to breadboard rails
      connections.push(
        { id: 'w_pwr_5v', from: { component: 'arduino_uno', pin: '5V' }, to: { component: 'bb_main', pin: 'top_rail_pos_1' }, color: '#ef4444', bends: [] },
        { id: 'w_pwr_gnd', from: { component: 'arduino_uno', pin: 'GND.1' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_1' }, color: '#0f172a', bends: [] }
      );

      const allTokens = (slug + ' ' + title + ' ' + thingId).toLowerCase();
      let colCursor = 5;
      let pinCursor = 13;

      if (/ultrasonic|sonar|distance/.test(allTokens)) {
        components.push({ id: 'sensor_us', type: 'ultrasonic-hcsr04', x: 480, y: 30, rotation: 0, properties: { label: 'HC-SR04' } });
        connections.push(
          { id: 'w_us_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_5' }, to: { component: 'sensor_us', pin: 'VCC' }, color: '#ef4444', bends: [] },
          { id: 'w_us_trig', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'sensor_us', pin: 'TRIG' }, color: '#0284c7', bends: [] },
          { id: 'w_us_echo', from: { component: 'arduino_uno', pin: '10' }, to: { component: 'sensor_us', pin: 'ECHO' }, color: '#eab308', bends: [] },
          { id: 'w_us_gnd', from: { component: 'bb_main', pin: 'bottom_rail_neg_5' }, to: { component: 'sensor_us', pin: 'GND' }, color: '#0f172a', bends: [] }
        );
      }

      if (/servo/.test(allTokens)) {
        components.push({ id: 'servo_dyn', type: 'servo', x: 790, y: 130, rotation: 0, properties: { label: 'Servo Motor' } });
        connections.push(
          { id: 'w_srv_sig', from: { component: 'arduino_uno', pin: '9' }, to: { component: 'servo_dyn', pin: 'PWM' }, color: '#f97316', bends: [] },
          { id: 'w_srv_pwr', from: { component: 'bb_main', pin: 'top_rail_pos_25' }, to: { component: 'servo_dyn', pin: 'V+' }, color: '#ef4444', bends: [] },
          { id: 'w_srv_gnd', from: { component: 'bb_main', pin: 'top_rail_neg_25' }, to: { component: 'servo_dyn', pin: 'GND' }, color: '#0f172a', bends: [] }
        );
      }

      if (/buzzer|piezo|speaker|sound|tone/.test(allTokens)) {
        components.push({ id: 'piezo_dyn', type: 'buzzer', x: 440 + (colCursor * 17.5), y: 190, rotation: 0, properties: { label: 'Buzzer' } });
        connections.push(
          { id: 'w_bz_sig', from: { component: 'arduino_uno', pin: '8' }, to: { component: 'piezo_dyn', pin: '1' }, color: '#f97316', bends: [] },
          { id: 'w_bz_gnd', from: { component: 'piezo_dyn', pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_' + colCursor }, color: '#0f172a', bends: [] }
        );
        colCursor += 5;
      }

      if (/button|switch|push/.test(allTokens)) {
        components.push({ id: 'btn_dyn', type: 'pushbutton', x: 440 + (colCursor * 17.5), y: 160, rotation: 0, properties: { label: 'Pushbutton' } });
        connections.push(
          { id: 'w_btn_sig', from: { component: 'arduino_uno', pin: '2' }, to: { component: 'btn_dyn', pin: '1a' }, color: '#0284c7', bends: [] },
          { id: 'w_btn_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_' + colCursor }, to: { component: 'btn_dyn', pin: '2a' }, color: '#ef4444', bends: [] }
        );
        colCursor += 4;
      }

      if (/pot|potentiometer/.test(allTokens)) {
        components.push({ id: 'pot_dyn', type: 'potentiometer', x: 440 + (colCursor * 17.5), y: 165, rotation: 0, properties: { label: 'Potentiometer', resistance: '10k' } });
        connections.push(
          { id: 'w_pot_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_' + colCursor }, to: { component: 'pot_dyn', pin: '1' }, color: '#ef4444', bends: [] },
          { id: 'w_pot_sig', from: { component: 'pot_dyn', pin: '2' }, to: { component: 'arduino_uno', pin: 'A0' }, color: '#0284c7', bends: [] },
          { id: 'w_pot_gnd', from: { component: 'bb_main', pin: 'bottom_rail_neg_' + colCursor }, to: { component: 'pot_dyn', pin: '3' }, color: '#0f172a', bends: [] }
        );
        colCursor += 5;
      }

      if (/lcd|screen|display/.test(allTokens)) {
        components.push({ id: 'lcd_dyn', type: 'lcd1602-i2c', x: 790, y: 220, rotation: 0, properties: { label: '16x2 I2C LCD' } });
        connections.push(
          { id: 'w_lcd_vcc', from: { component: 'bb_main', pin: 'top_rail_pos_20' }, to: { component: 'lcd_dyn', pin: 'VCC' }, color: '#ef4444', bends: [] },
          { id: 'w_lcd_gnd', from: { component: 'bb_main', pin: 'bottom_rail_neg_20' }, to: { component: 'lcd_dyn', pin: 'GND' }, color: '#0f172a', bends: [] },
          { id: 'w_lcd_sda', from: { component: 'arduino_uno', pin: 'A4' }, to: { component: 'lcd_dyn', pin: 'SDA' }, color: '#0284c7', bends: [] },
          { id: 'w_lcd_scl', from: { component: 'arduino_uno', pin: 'A5' }, to: { component: 'lcd_dyn', pin: 'SCL' }, color: '#eab308', bends: [] }
        );
      }

      // Default or extracted LEDs + Current limiting resistors
      const ledColors = [];
      if (/red/.test(allTokens)) ledColors.push('red');
      if (/green/.test(allTokens)) ledColors.push('green');
      if (/yellow/.test(allTokens)) ledColors.push('yellow');
      if (/blue/.test(allTokens)) ledColors.push('blue');
      if (ledColors.length === 0) ledColors.push('red');

      ledColors.forEach((clr, i) => {
        if (colCursor > 25) return;
        const ledId = 'led_' + clr + '_' + (i + 1);
        const resId = 'res_' + clr + '_' + (i + 1);
        const pinNum = Math.max(2, pinCursor - i);
        const col = colCursor;

        components.push(
          { id: ledId, type: 'led', x: 440 + (col * 17.5), y: 130, rotation: 0, properties: { color: clr, label: clr.toUpperCase() + ' LED' } },
          { id: resId, type: 'resistor', x: 440 + (col * 17.5), y: 175, rotation: 90, properties: { resistance: '220', label: '220Ω' } }
        );

        connections.push(
          { id: 'w_led_sig_' + i, from: { component: 'arduino_uno', pin: String(pinNum) }, to: { component: ledId, pin: 'a' }, color: clr === 'red' ? '#ef4444' : clr === 'green' ? '#10b981' : clr === 'yellow' ? '#eab308' : '#0284c7', bends: [] },
          { id: 'w_led_res_' + i, from: { component: ledId, pin: 'c' }, to: { component: resId, pin: '1' }, color: '#10b981', bends: [] },
          { id: 'w_res_gnd_' + i, from: { component: resId, pin: '2' }, to: { component: 'bb_main', pin: 'bottom_rail_neg_' + col }, color: '#0f172a', bends: [] }
        );

        colCursor += 4;
      });
    }

    // Auto-snap all components placed over or near breadboard to tie points
    const breadboard = components.find(c => c.type.startsWith('breadboard'));
    if (breadboard) {
      components.forEach((c) => {
        if (c.type.startsWith('breadboard')) return;
        const snapped = this.snapCoordinatesToBreadboard(c, c.x, c.y, breadboard);
        if (snapped.isSnapped) {
          c.x = snapped.x;
          c.y = snapped.y;
        }
      });
    }

    return {
      metadata: {
        title: pageTitle || 'Tinkercad Circuit',
        source: 'Tinkercad',
        thingId: urlInfo.thingId,
        sharecode: urlInfo.sharecode,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author: 'Tinkercad Importer'
      },
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      components,
      connections
    };
  },

  /**
   * Universal JSON Normalizer: parses any arbitrary Tinkercad or external circuit schema
   */
  fromTinkercad(rawPayload) {
    if (typeof rawPayload === 'string') {
      try {
        rawPayload = JSON.parse(rawPayload);
      } catch (err) {
        throw new Error('Invalid circuit payload: malformed JSON string.');
      }
    }
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid circuit payload: expected an object.');
    }

    // 1. If payload is already Wokwi diagram.json
    if (Array.isArray(rawPayload.parts)) {
      return this.fromWokwi(rawPayload);
    }

    const title = rawPayload.name || rawPayload.title || rawPayload.metadata?.title || 'Imported Tinkercad Circuit';
    const author = rawPayload.author || rawPayload.metadata?.author || 'Tinkercad User';

    const rawComps = rawPayload.components || rawPayload.parts || rawPayload.elements || rawPayload.devices || rawPayload.schematic?.components || [];
    const rawConns = rawPayload.connections || rawPayload.wires || rawPayload.nets || rawPayload.signals || [];

    const components = rawComps.map((rawComp, idx) => {
      const rawType = rawComp.type || rawComp.name || rawComp.part || 'generic-component';
      const normType = this.normalizeComponentType(rawType);

      let x = Number(rawComp.x ?? rawComp.left ?? rawComp.pos?.[0] ?? rawComp.position?.x ?? 0);
      let y = Number(rawComp.y ?? rawComp.top ?? rawComp.pos?.[1] ?? rawComp.position?.y ?? 0);

      // Detect if units are mm (typical bounding box < 100) and scale to px
      if (Math.abs(x) < 200 && Math.abs(y) < 150 && (rawComp.unit === 'mm' || rawComp.mm === true)) {
        x = Math.round(x * 3.78);
        y = Math.round(y * 3.78);
      }

      const rotation = Number(rawComp.rotation ?? rawComp.rotate ?? rawComp.angle ?? 0);
      const id = String(rawComp.id || (normType + '_' + (idx + 1)));

      return {
        id,
        type: normType,
        x: Math.round(x),
        y: Math.round(y),
        rotation,
        properties: { ...(rawComp.properties || rawComp.attrs || rawComp.attributes || {}) }
      };
    });

    // Auto-center and normalize layout coordinates if they are offset strangely
    if (components.length > 0) {
      let minX = Infinity, minY = Infinity;
      components.forEach((c) => {
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
      });
      if (minX < 40 || minY < 40 || minX > 500 || minY > 500) {
        const offsetX = 80 - Math.min(0, minX);
        const offsetY = 80 - Math.min(0, minY);
        components.forEach((c) => {
          c.x += offsetX;
          c.y += offsetY;
        });
      }
    }

    // Auto-snap any components on or near breadboards to tie points
    const breadboards = components.filter((c) => c.type.startsWith('breadboard'));
    if (breadboards.length > 0) {
      components.forEach((c) => {
        if (c.type.startsWith('breadboard')) return;
        breadboards.forEach((bb) => {
          const snapped = this.snapCoordinatesToBreadboard(c, c.x, c.y, bb);
          if (snapped.isSnapped) {
            c.x = snapped.x;
            c.y = snapped.y;
          }
        });
      });
    }

    // Normalize connections
    const connections = rawConns.map((rawConn, idx) => {
      let fromComp = '', fromPin = '', toComp = '', toPin = '';
      let color = '#38bdf8';

      if (Array.isArray(rawConn)) {
        const [fStr, tStr, cStr, bends] = rawConn;
        [fromComp, fromPin] = (fStr || '').split(':');
        [toComp, toPin] = (tStr || '').split(':');
        color = cStr || color;
        return {
          id: 'wire_' + (idx + 1),
          from: { component: fromComp, pin: fromPin },
          to: { component: toComp, pin: toPin },
          color,
          bends: bends || []
        };
      }

      if (rawConn.from && rawConn.to) {
        fromComp = typeof rawConn.from === 'string' ? rawConn.from.split(':')[0] : rawConn.from.component || rawConn.from.id;
        fromPin = typeof rawConn.from === 'string' ? rawConn.from.split(':')[1] : rawConn.from.pin;
        toComp = typeof rawConn.to === 'string' ? rawConn.to.split(':')[0] : rawConn.to.component || rawConn.to.id;
        toPin = typeof rawConn.to === 'string' ? rawConn.to.split(':')[1] : rawConn.to.pin;
        color = rawConn.color || color;
      }

      return {
        id: 'wire_' + (idx + 1),
        from: { component: fromComp, pin: fromPin },
        to: { component: toComp, pin: toPin },
        color,
        bends: rawConn.bends || []
      };
    });

    return {
      metadata: {
        title,
        source: 'Tinkercad',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author
      },
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      components,
      connections
    };
  },

  /**
   * Bundle project into Standalone Universal HTML file
   */
  exportStandaloneHTML(project, renderedSvgInner = '') {
    const jsonStr = JSON.stringify(project, null, 2);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.metadata?.title || 'TCAD Circuit'} - Standalone Viewer</title>
  <style>
    :root {
      --bg-dark: #090d16;
      --bg-surface: #0f172a;
      --border-subtle: #1e293b;
      --sky-primary: #38bdf8;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      height: 52px;
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      border-bottom: 1px solid var(--border-subtle);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .badge {
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: var(--sky-primary);
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.825rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn:hover {
      background: #334155;
      border-color: #38bdf8;
      color: #38bdf8;
    }
    .btn-primary {
      background: #0284c7;
      border-color: #0369a1;
    }
    .btn-primary:hover {
      background: #0369a1;
      color: #ffffff;
    }
    #canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      user-select: none;
    }
    #canvas-container.is-panning {
      cursor: grabbing;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .zoom-controls {
      position: absolute;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      gap: 0.5rem;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .zoom-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 1rem;
    }
    .zoom-btn:hover {
      background: #0284c7;
      border-color: #38bdf8;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-brand">
      <strong>${project.metadata?.title || 'Circuit Layout'}</strong>
      <span class="badge">Standalone Universal HTML</span>
    </div>
    <div class="header-actions">
      <button class="btn" id="btn-download-json" title="Export Circuit JSON">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
        Download JSON
      </button>
      <button class="btn btn-primary" id="btn-reset-view" title="Reset Pan & Zoom">
        Reset View
      </button>
    </div>
  </header>
  <div id="canvas-container">
    <svg id="circuit-svg" viewBox="0 0 1400 900">
      <defs>
        <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.2" fill="rgba(56, 189, 248, 0.18)"/>
        </pattern>
        <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#canvas-grid)"/>
      <g id="viewport-group">
        ${renderedSvgInner}
      </g>
    </svg>
    <div class="zoom-controls">
      <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
      <button class="zoom-btn" id="zoom-out" title="Zoom Out">-</button>
      <button class="zoom-btn" id="zoom-reset" title="Reset Zoom">1:1</button>
    </div>
  </div>
  <script id="tcad-circuit-data" type="application/json">
${jsonStr}
  </script>
  <script>
    // Embedded Pan & Zoom Interactive Controls
    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startX = 0, startY = 0;
    const container = document.getElementById('canvas-container');
    const viewportGroup = document.getElementById('viewport-group');

    function updateTransform() {
      if (viewportGroup) {
        viewportGroup.setAttribute('transform', \`translate(\${panX}, \${panY}) scale(\${zoom})\`);
      }
    }

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      container.classList.add('is-panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      container.classList.remove('is-panning');
    });

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.15 : 0.85;
      zoom = Math.max(0.2, Math.min(4.0, zoom * delta));
      updateTransform();
    }, { passive: false });

    document.getElementById('zoom-in').addEventListener('click', () => {
      zoom = Math.min(4.0, zoom * 1.25);
      updateTransform();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      zoom = Math.max(0.2, zoom / 1.25);
      updateTransform();
    });
    document.getElementById('zoom-reset').addEventListener('click', () => {
      zoom = 1.0; panX = 0; panY = 0;
      updateTransform();
    });
    document.getElementById('btn-reset-view').addEventListener('click', () => {
      zoom = 1.0; panX = 0; panY = 0;
      updateTransform();
    });

    document.getElementById('btn-download-json').addEventListener('click', () => {
      const dataStr = document.getElementById('tcad-circuit-data').textContent;
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'circuit.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>`;
  }
};
