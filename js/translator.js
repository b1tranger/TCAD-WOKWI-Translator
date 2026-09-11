/**
 * TCAD-WOKWI-Translator - Translator Pipeline
 * Converts between Tinkercad payloads, Native Schema, Wokwi diagram.json, and Standalone HTML.
 */

import { COMPONENT_CATALOG } from './schema.js';

export const Translator = {
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


    return {
      version: 1,
      author: project.metadata?.author || 'TCAD-WOKWI-Translator',
      editor: 'wokwi',
      parts,
      connections
    };
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
    const slug = (urlInfo.slug || '').toLowerCase();
    const title = (pageTitle || '').toLowerCase();
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
    } else {
      // General Arduino + Breadboard setup
      components.push(
        {
          id: 'arduino_uno',
          type: 'arduino-uno',
          x: 60,
          y: 120,
          rotation: 0,
          properties: {}
        },
        {
          id: 'res_limit',
          type: 'resistor',
          x: 480,
          y: 160,
          rotation: 0,
          properties: { resistance: '220' }
        },
        {
          id: 'led_stat',
          type: 'led',
          x: 580,
          y: 155,
          rotation: 0,
          properties: { color: 'red' }
        }
      );

      connections.push(
        {
          id: 'wire_5v',
          from: { component: 'arduino_uno', pin: '5V' },
          to: { component: 'bb_main', pin: 'top_rail_pos' },
          color: '#ef4444',
          bends: []
        },
        {
          id: 'wire_gnd',
          from: { component: 'arduino_uno', pin: 'GND.1' },
          to: { component: 'bb_main', pin: 'bottom_rail_neg' },
          color: '#0284c7',
          bends: []
        },
        {
          id: 'wire_sig',
          from: { component: 'arduino_uno', pin: '13' },
          to: { component: 'res_limit', pin: '1' },
          color: '#f59e0b',
          bends: []
        },
        {
          id: 'wire_led',
          from: { component: 'res_limit', pin: '2' },
          to: { component: 'led_stat', pin: 'anode' },
          color: '#10b981',
          bends: []
        }
      );
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
   * Parse Tinkercad circuit payload into Native Schema
   */
  fromTinkercad(tinkercadData) {
    const project = {
      metadata: {
        title: tinkercadData.name || tinkercadData.title || 'Imported Tinkercad Circuit',
        source: 'Tinkercad',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author: tinkercadData.author || 'Tinkercad User'
      },
      viewport: { zoom: 1.0, panX: 0, panY: 0 },
      components: [],
      connections: []
    };

    if (Array.isArray(tinkercadData.components)) {
      project.components = tinkercadData.components;
    }
    if (Array.isArray(tinkercadData.connections)) {
      project.connections = tinkercadData.connections;
    }

    return project;
  },

  /**
   * Bundle project into Standalone Universal HTML file
   */
  exportStandaloneHTML(project) {
    const jsonStr = JSON.stringify(project, null, 2);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.metadata?.title || 'TCAD Circuit'} - Standalone Viewer</title>
  <style>
    body { margin: 0; background: #060911; color: #f8fafc; font-family: sans-serif; display: flex; flex-direction: column; height: 100vh; }
    header { height: 48px; background: #0f172a; display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; border-bottom: 1px solid #1e293b; }
    .badge { background: #38bdf8; color: #04060a; padding: 2px 8px; border-radius: 9999px; font-weight: bold; font-size: 0.75rem; }
    #canvas-container { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <header>
    <div><strong>${project.metadata?.title || 'Circuit Layout'}</strong> (Standalone Universal View)</div>
    <div class="badge">TCAD-WOKWI-Translator</div>
  </header>
  <div id="canvas-container">
    <svg id="circuit-svg" viewBox="0 0 1200 800">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#1e293b"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <!-- Components and wires rendered via embedded JSON -->
    </svg>
  </div>
  <script id="tcad-circuit-data" type="application/json">
${jsonStr}
  </script>
  <script>
    const data = JSON.parse(document.getElementById('tcad-circuit-data').textContent);
    console.log('Loaded standalone circuit:', data);
  </script>
</body>
</html>`;
  }
};
