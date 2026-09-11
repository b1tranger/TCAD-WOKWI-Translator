# TCAD-WOKWI-Translator

[![Version](https://img.shields.io/badge/version-v0.1.8-blue.svg)](doc/versions.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero-Dependency](https://img.shields.io/badge/dependencies-zero-success.svg)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-offline%20ready-sky.svg)](sw.js)

> **Resolving the GUI export issues of Autodesk Tinkercad with Wokwi.**  
> A lightweight, client-side web application and standalone breadboard circuit editor built with a pure Vanilla Stack (HTML5 Canvas/SVG, CSS3, modern JavaScript).

---

## 🌟 Overview

When Tinkercad exports circuits as `.brd` (Autodesk EAGLE PCB) files, they lose their beginner-friendly visual breadboard layout and cannot be re-imported into Tinkercad for continued breadboard editing. 

**TCAD-WOKWI-Translator** bridges this gap:
- **Tinkercad Ingestion**: Ingests public Tinkercad circuit links and JSON payloads to extract component coordinates, pin mappings, and wire curves.
- **Wokwi Translation**: Translates breadboard circuits into Wokwi's native `diagram.json` syntax for direct simulation.
- **Universal Standalone HTML Export**: Bundles any project into a self-contained single `.html` file that runs in any web browser without internet access, and can be dropped back into the app to resume visual editing.
- **Offline PWA**: Full offline functionality via Service Worker caching (`sw.js`).

---

## 🚀 Quick Start

No build tools, bundlers, or Node.js dependencies are required!

### 1. Run with any local static server
```bash
# Using Python 3
python -m http.server 8080

# Using Node http-server (optional)
npx http-server -p 8080
```
Open `http://localhost:8080` in your browser.

### 2. Standalone Offline Use
Open `index.html` directly in any modern browser (Chrome, Firefox, Edge, Safari).

---

## 📦 Project Architecture

```text
TCAD-WOKWI-Translator/
├── index.html               # Main user interface & canvas viewport
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (Cache version v0.1.8)
├── AGENTS.md                # Agent guidelines & version sync rules
├── README.md                # Project documentation & roadmap
├── css/
│   └── style.css            # Dark/sky-blue responsive styling
├── js/
│   ├── app.js               # Application bootstrap & lifecycle
│   ├── schema.js            # Schemas, defaults, and pinout definitions
│   ├── translator.js        # Tinkercad <-> Native <-> Wokwi conversion
│   ├── renderer.js          # SVG breadboard circuit renderer
│   └── ui.js                # Toolbar, drag-and-drop, modals & changelog loader
└── doc/
    ├── versions.md          # Active release changelog & version history
    ├── DOCUMENTATION.md     # In-depth technical architecture
    ├── idea/                # Design briefs and reference prompts
    └── prompts/             # Turn-by-turn prompts, plans, and walkthroughs
```

---

## 📋 Features & Roadmap Checklist

- [x] **Project Foundation & Scaffolding** (`v0.1.0 to v0.1.8`)
  - [x] Zero-dependency Vanilla HTML5/CSS3/ES6 architecture
  - [x] Service Worker Network-First offline caching (`sw.js` `v0.1.8`)
  - [x] Markdown-based changelog engine (`doc/versions.md`)
  - [x] Technical architecture specification (`doc/DOCUMENTATION.md`)
  - [x] Interactive dark/sky-blue UI with SVG workspace
  - [x] Mobile-responsive layout with icon-only controls and overlay navigation drawers (`v0.1.1`)
  - [x] Persistent quick import bar for direct Tinkercad public link ingestion (`v0.1.2`)
  - [x] Accurate Tinkercad Lab-04 boolean logic translation ($A + B'$, 74HC32, 74HC04, DIP switch, DC supply) (`v0.1.3`)
  - [x] Accurate Tinkercad Arduino x Arduino dual MCU communication translation with digital multimeter (`v0.1.4`)
  - [x] Accurate Tinkercad Arduino-to-Arduino I2C Master-Slave communication with potentiometer & PWM LED (`v0.1.5`)
  - [x] Accurate Tinkercad Under-Voltage Protection System with 9V battery, buzzer, 16x2 I2C LCD, and AREF jumper (`v0.1.6`)
  - [x] Comprehensive 38-component Tinkercad & Wokwi catalog audit & SVG rendering engine (`v0.1.7`)
  - [x] Categorized dynamic sidebar palette with real-time search and drag-and-drop / click-to-add placement (`v0.1.7`)
  - [x] Accurate Tinkercad ARPS2 Introductory Activity translation with full 63-column breadboard, 5 LEDs, 4 switches, TMP36, capacitor, buzzer (`v0.1.7`)
  - [x] Accurate Tinkercad Ventilador com sensor de presença e LCD translation with PIR sensor, DC motor, flyback diode, TIP120 power transistor, TMP36, 16x2 LCD (`v0.1.7`)
  - [x] Interactive canvas component drag-and-drop repositioning with dynamic wire re-routing (`v0.1.8`)
  - [x] Fluid canvas panning and mouse-wheel zoom navigation (`v0.1.8`)
- [ ] **Interactive Breadboard Workspace**
  - [x] Grid coordinate snapping math (0.1-inch pitch)
  - [x] 38 core components: Full/Half/Mini Breadboards, Arduino Uno/Mega/Nano, ESP32, PIR, Ultrasonic, DC/Servo Motors, Relay, Diodes, TIP120 Transistors, LCD, OLED, 7-Segment, 9V/AA Batteries, Logic ICs
  - [x] Exact pin terminal resolver & smart wire routing with Tinkercad floating pill badges (`v0.1.3` to `v0.1.7`)
  - [x] Interactive component movement inside canvas with live bezier wire updates (`v0.1.8`)
  - [ ] Jumper wire interactive bezier curve routing with custom colors
  - [ ] Multi-select, rotate, and delete operations
- [ ] **Translation & Import/Export Pipeline**
  - [x] Native circuit JSON schema definition
  - [x] Wokwi `diagram.json` compilation engine with canonical wire colors and chip identifiers
  - [x] Live Tinkercad public share link parser & JSON translator (`v0.1.1`, `v0.1.3`, `v0.1.4`, `v0.1.5`, `v0.1.6`, `v0.1.7`)
  - [x] Universal standalone single-file `.html` export & re-import



---

## 📖 Documentation & Release Notes

- Detailed technical architecture and data schemas are available in [doc/DOCUMENTATION.md](doc/DOCUMENTATION.md).
- Detailed version releases and change descriptions are tracked in [doc/versions.md](doc/versions.md).

---

## 📄 License

This project is licensed under the terms of the [MIT License](LICENSE).
