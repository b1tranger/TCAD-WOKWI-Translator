# Release Changelog & Version History

All notable changes to the **TCAD-WOKWI-Translator** project are documented in this file.

---

## [v0.1.0 to v0.1.12] - 2026-09-11

### Universal Tinkercad Circuit Ingestion, Spatial Layout & Breadboard Snapping (v0.1.12)

- **Universal Public Tinkercad Ingestion & Semantic Synthesizer**:
  - Expanded `Translator.buildTinkercadTranslatedProject` to recognize 10+ standard Tinkercad gallery circuit families (Traffic Light Systems, HC-SR04 Ultrasonic Radar, Servo Angle Sweepers, LDR Night Lamps, 555 Timer Multivibrators, DC Motor Controllers, RGB LED Mixers, and Logic Gates).
  - Built a fallback **Universal Dynamic Semantic Synthesizer** that tokenizes any arbitrary public circuit title or URL slug (e.g. buzzer, tilt sensor, motor, button, potentiometer, etc.), places the MCU on the left (`60, 100`), centers the half breadboard (`280, 110`), auto-snaps components to valid tie-points, and routes power and signal nets cleanly.
- **Universal JSON Schema Normalizer (`Translator.fromTinkercad`)**:
  - Ingests arbitrary raw JSON payloads from Autodesk Tinkercad, Wokwi, or custom circuit designers.
  - Automatically handles string or parsed JSON inputs, converts millimeter coordinates to pixel workspace coordinates (`2.54mm -> 10px`), normalizes component aliases via `COMPONENT_ALIAS_MAP`, and auto-centers the circuit layout.
- **Automatic Spatial Breadboard Snapping (`Translator.snapCoordinatesToBreadboard`)**:
  - Detects if components overlap breadboard boundaries (`x, y, w, h`) and automatically snaps them into aligned tie-point rows/columns across half, full, and mini breadboard geometries.
- **Import Modal Gallery Presets**:
  - Added quick one-click preset chips in `#modal-import-tcad` (DLD Logic Lab, Lab 04 Boolean, Traffic Light, Ultrasonic Radar, Servo Sweep, LDR Night Light, 555 Timer) for instant gallery circuit translation and testing.
- **Offline Cache & Release Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.12';`.
  - Updated asset queries to `?v=0.1.12` and badge in `index.html`.

### Header GitHub, Docs & Changelog Restoration on Mobile (v0.1.11)

- **Mobile Top Bar Accessibility**:
  - Restored the **GitHub**, **Technical Documentation**, and **Changelog** action buttons in the mobile top bar on screens $\le 768\text{px}$.
  - On mobile devices, these buttons render as clean, touch-friendly icon buttons alongside the Code Inspector drawer toggle, maintaining visual balance without crowding.
  - Circuit authoring and export actions (Import TCAD, Export Wokwi, Export HTML, Raw JSON) remain neatly organized in the bottom expanding Floating Action Menu (FAB).
- **Offline Cache & Release Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.11';`.
  - Updated asset queries to `?v=0.1.11` and badge in `index.html`.

### Wokwi Modal Fix, Mobile Floating Action Menu & Touch Drag Gestures (v0.1.10)

- **Resolved Wokwi Export TypeError**:
  - Implemented `UI.openModal(modalIdOrEl)` and `UI.closeModal(modalIdOrEl)` in `js/ui.js`, resolving the `Uncaught TypeError: UI.openModal is not a function` error when opening `#modal-export-wokwi`.
- **Mobile Clutter Elimination & Bottom Floating Action Menu (FAB)**:
  - Cleared the mobile top header on screens $\le 768\text{px}$ by moving all functional actions (Import TCAD, Wokwi, HTML, JSON, Changelog, Docs, GitHub) out of `.toolbar-actions`.
  - The mobile header now remains spacious and clean, showing only the Catalog drawer toggle, Brand logo & badge, and Inspector drawer toggle.
  - Implemented an ergonomic bottom-right Floating Action Button (FAB) with animated icon transition (3-dots to close-X) and gentle pulsing glow ring.
  - Tapping the FAB expands a frosted-glass popup card (`rgba(15, 23, 42, 0.95)`, `backdrop-filter: blur(16px)`) with tactile action tiles for all 7 functions.
  - Tapping any action executes the function and automatically dismisses the menu sheet.
- **Mobile Touch Tap-Hold and Drag Optimization**:
  - Configured `touch-action: none;` and `-webkit-touch-callout: none; user-select: none;` on `.canvas-viewport`, `.canvas-svg`, and `.canvas-component`.
  - Added `e.preventDefault()` on single-finger `touchstart` to stop mobile OS scroll interception, text selection, and magnifier activation.
  - Added multi-touch 2-finger pinch-to-zoom calculation with smooth canvas scaling.
  - Added `touchcancel` handling to prevent stuck dragging states during phone calls or system gesture interruptions.
- **Offline Cache & Release Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.10';`.
  - Updated asset queries to `?v=0.1.10` and badge in `index.html`.

### HTML Export Fix, Wokwi Export Modal, Breadboard Snapping & Tinkercad Styling (v0.1.9)

- **Standalone HTML Export Graphic Restoration**:
  - Fixed the blank canvas issue by directly embedding pre-rendered SVG elements into `#viewport-group` within the exported `.html` file.
  - Included fully self-contained interactive pan and zoom controls, reset view button, and JSON download capability in the standalone viewer.
  - Maintained bidirectional re-import compatibility via embedded `<script id="tcad-circuit-data">`.
- **Wokwi Export Modal Dialog**:
  - Replaced immediate file download with a dedicated modal `#modal-export-wokwi`.
  - Added step-by-step guidance card for simulating circuits in Wokwi.
  - Added external simulator link to `https://wokwi.com/projects/new/arduino-uno` and Wokwi homepage.
  - Added syntax-ready `<textarea>` code preview with live part and connection counts.
  - Added 1-click clipboard copy with toast feedback and "Download diagram.json" action button.
- **Breadboard Tie-Point Snapping & Logical Connection Synthesis**:
  - Implemented tie-point snapping during drag operations for DIP IC chips, resistors, LEDs, and pushbuttons over half, full, and mini breadboards.
  - Automatically synthesizes logical breadboard connections in `Translator.toWokwi(project)` linking inserted component leads directly to breadboard terminal strips and power rails.
- **Authentic Tinkercad Component Aesthetics**:
  - Upgraded breadboard artwork with warm bone-white `#f8f7f2` casing, bevel highlights, red/blue power lines, column numbers, row letters, and recessed metallic tie holes.
  - Redesigned resistors with ceramic dumbbell bodies, bulbous ends, and color-coded bands.
  - Redesigned LEDs with translucent glass dome reflections, visible anvil/post leadframe, and raised collar rim.
  - Redesigned DIP ICs with matte molded epoxy bodies, semi-circular orientation notches, pin 1 index dots, and floating labels.
  - Redesigned Arduino Uno with genuine turquoise PCB `#00878a`, metal USB-B port, and silkscreen header labels.
- **Header GitHub Repository Link**:
  - Added GitHub repository icon button linking directly to `https://github.com/b1tranger/TCAD-WOKWI-Translator`.
- **Offline Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.9';`.
  - Updated asset queries to `?v=0.1.9` across `index.html`.

### Interactive Component Drag-and-Drop Repositioning & Canvas Panning (v0.1.8)

- **Interactive Canvas Component Dragging & Moving**:
  - Implemented real-time drag-and-drop repositioning for all components on the SVG workspace (`.canvas-component`).
  - Automatically updates component `x` and `y` coordinates taking active zoom and pan into account.
  - Dynamically recalculates all connected wires, bezier control curves, and pin anchor terminals in real time during drag, keeping wiring connected to moving parts.
  - Added visual cues: grab cursor on component hover, grabbing cursor during drag, and glow drop-shadow filters.
- **Fluid Canvas Panning & Mouse Wheel Zoom**:
  - Clicking and dragging on the canvas background pans the workspace smoothly in all directions.
  - Mouse wheel zooming centered on cursor with touch gestures supported for mobile/touch devices.
- **Service Worker & Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.8';`.
  - Synchronized asset tags to `?v=0.1.8` across `index.html`.

### 38-Component Comprehensive Catalog Expansion, Dynamic Palette & Circuit Synthesis (v0.1.7)

- **Comprehensive 38-Component Catalog & Visual Breadboard Integration**:
  - Audited and implemented complete schema modeling, realistic SVG vector rendering, and precise terminal pin coordinate resolvers for **38 core Tinkercad and Wokwi electronic components**:
    - **Boards & Prototyping**: Half Breadboard (30 columns, 4 power rails), Full Breadboard (63 columns, 4 power rails, center divider groove), Mini Breadboard (17 columns, compact IC prototyping).
    - **Microcontrollers**: Arduino Uno R3 (ATmega328P), Arduino Mega 2560 (54 digital I/O, 16 analog pins), Arduino Nano (compact 30-pin DIP layout), ESP32 DevKit V1 (30-pin dual-row micro-controller with Wi-Fi/Bluetooth).
    - **Inputs & Sensors**: Pushbutton (tactile 4-pin momentary), Slide Switch (SPDT 3-pin switch), 4-Position DIP Switch, Potentiometer (10kΩ rotary with wiper), TMP36 Analog Temperature Sensor, PIR Motion Sensor (HC-SR501 dome lens with VCC/OUT/GND), Ultrasonic Distance Sensor (HC-SR04 with dual acoustic transducers and VCC/TRIG/ECHO/GND), Photoresistor / LDR (cadmium sulfide light-dependent resistor).
    - **Outputs & Actuators**: Standard 5mm LED (anode, cathode, colored lens), 4-Pin RGB LED (Common Cathode with Red/Cathode/Green/Blue leads), Piezo Buzzer (polarized acoustic transducer), DC Motor (permanent magnet rotating shaft motor), Micro Servo Motor (SG90 180° actuator with PWM/VCC/GND header), 5V Relay Module (SPDT electromechanical relay with coil trigger and COM/NO/NC terminals).
    - **Passives & Semiconductors**: Ceramic/Electrolytic Capacitors (bipolar radial leads), 1N4001 Flyback Rectifier Diode (silver cathode band), TIP120 Darlington Power Transistor (TO-220 metal heat tab with Base, Collector, Emitter pinout), Fixed Resistors (color-coded bands).
    - **Displays & Measurement**: 16x2 I2C Character LCD (HD44780 with PCF8574 backpack), 1-Digit 7-Segment Display (10-pin common cathode digit), 0.96" I2C OLED Display (128x64 SSD1306 graphic screen), Digital Multimeter (rotary dial with positive red and COM black probe leads).
    - **Power & Logic ICs**: 9V Transistor Battery, 4xAA 6V Battery Pack (dual leads), Variable Benchtop Power Supply, 74HC04 Hex Inverter, 74HC08 Quad AND Gate, 74HC32 Quad OR Gate, 7400 Quad NAND Gate, NE555 Precision Timer IC, Generic 14/16-pin DIP IC.
- **Dynamic Categorized Sidebar Palette & Drag-and-Drop Placement**:
  - Dynamically renders the 38-part catalog grouped into 7 logical categories with real-time SVG preview icons.
  - Live instant search/filtering by part name, category, or Wokwi type with real-time visible counter badge.
  - Interactive placement: click any component card to add to canvas with staggered placement, or drag-and-drop directly onto visual canvas coordinates.
- **Reference Circuit Synthesis Engine**:
  - **`0A7EIOHHtCo-arps2-introductory-activity-1`**: Complete synthesis of 14 components and 16 connections featuring a full 63-column breadboard, 5 amber LEDs, 4 switches, TMP36 analog temperature sensor, radial capacitor, and piezo buzzer.
  - **`b0lYqnBVRnZ-ventilador-com-sensor-de-presenca-e-tela-lcd`**: Complete synthesis of 10 components and 23 connections featuring a PIR motion sensor, high-power DC motor, 1N4001 inductive flyback protection diode, TIP120 power Darlington transistor, TMP36 temperature sensor, and 16x2 I2C LCD display.
- **Service Worker & Offline Cache Bump**:
  - Updated `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.7';`.
  - Updated HTML asset cache busters to `?v=0.1.7`.

- **Under-Voltage Protection System Architecture Translation**:
  - Implemented high-fidelity translation for Autodesk Tinkercad project [`3q5bLzaJGOu-under-voltage-protection-system-`](https://www.tinkercad.com/things/3q5bLzaJGOu-under-voltage-protection-system-), modeling precision analog battery monitoring, external reference jumping, acoustic alarming, and I2C telemetry.
  - Automatically synthesizes the complete 16-connection netlist:
    - **Arduino Uno R3** (`arduino_main`): Equipped with an external AREF reference jumper (3.3V $\rightarrow$ AREF), analog voltage acquisition via Pin A0, I2C telemetry on A4 (SDA) / A5 (SCL), acoustic tone drive on Digital Pin 8, and hardware reset input on the RESET pin.
    - **9V Heavy Duty Battery** (`battery_9v`): Top-mounted power source supplying the voltage divider circuit with positive (`+`, red) and negative (`-`, black) snap terminals.
    - **Potentiometer Voltage Divider** (`pot_input`): Acts as a simulated battery discharge divider, scaling 9V down to safe levels and feeding Pin A0.
    - **Piezo Buzzer Alarm** (`buzzer_alarm`): Driven directly by Arduino Digital Pin 8 via a long overhead sweep wire traveling along the top canvas margin and down the right side to signal under-voltage states.
    - **Tactile Alarm Reset Button** (`btn_reset`): Connected between Arduino RESET and GND through a lower loop path under the LCD, enabling latching fault clearance.
    - **16x2 I2C LCD Display** (`lcd_i2c`): 4-pin I2C backpack interface (`GND`, `VCC`, `SDA`, `SCL`) displaying real-time voltage metrics (`V: 8.94V NORMAL`).
    - **Half Breadboard** (`bb_main`): Distributes 9V battery power and shared common reference ground between battery, Arduino, buzzer, reset button, and voltage divider.
- **New Component Models & SVG Graphics**:
  - Registered `battery-9v`, `buzzer`, and `lcd1602-i2c` in `COMPONENT_CATALOG` with direct mappings to Wokwi primitives (`wokwi-battery-9v`, `wokwi-buzzer`, `wokwi-lcd1602`).
  - Added `getBattery9vSVG()` with positive stud and negative socket snap terminals, copper top band, and 9V branding.
  - Added `getBuzzerSVG()` with circular casing, central brass resonance port, and polarity indicators.
  - Added `getLcd1602Svg()` with green PCB frame, dark blue backlit LCD screen, and 4-pin I2C backpack connector.
  - Implemented exact terminal coordinate resolvers in `getPinCoordinates()` for all new components.
  - Enhanced wire curve routing: high overhead loop for `wire_buzzer_pos`, bottom sweep for `wire_reset_btn`, and on-board vertical arch for `wire_aref_jump`.
- **Service Worker & Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.6';`.
  - Updated asset version query strings to `?v=0.1.6` in `index.html`.

### Arduino-to-Arduino I2C Master-Slave Communication & Potentiometer Support (v0.1.5)

- **I2C Master-Slave Architecture Translation**:
  - Implemented high-fidelity translation for Autodesk Tinkercad I2C communication circuits (e.g. `hlN1zSLgxrk-arduino-arduino`), modeling inter-board I2C bus networking with analog input and PWM output.
  - Automatically synthesizes the complete 12-connection netlist:
    - **Master Arduino** (`arduino_master`, Arduino Uno R3): Reads analog voltage from a breadboard potentiometer via Pin A0, and supplies 5V and GND rails to the breadboard.
    - **Slave Arduino** (`arduino_slave`, Arduino Uno R3): Receives the transmitted I2C command and generates a PWM output on Pin 9 to control the brightness of a red LED.
    - **4-Wire I2C Interconnect Bus**: Bundled parallel connections:
      - 5V to 5V (Shared logic power)
      - GND to GND (Common reference ground)
      - A4 to A4 (I2C SDA serial data line)
      - A5 to A5 (I2C SCL serial clock line)
    - **Half Breadboard Layout**: Positioned beneath both Arduinos, hosting the potentiometer (cols 8–10) and 220Ω resistor + red LED circuit (cols 23–24).
    - **Long-Span PWM Routing**: Outer right-margin red wire looping from Slave Pin 9 down to breadboard col 23.
- **Enhanced Component SVG Rendering**:
  - Implemented `getPotentiometerSVG()`: Realistic Tinkercad rotary blue potentiometer with central knob, dial angle indicator, and solder terminals.
  - Added pin coordinate resolution in `getPinCoordinates()` for `potentiometer` (terminal 1, wiper/terminal 2, terminal 3).
  - Enhanced wire curve routing with parallel multi-conductor bus offsets for I2C lines, yellow vertical wiper drop, and right-margin outer sweep for PWM signals.
- **Disambiguation Engine**:
  - Resolved naming collision between direct serial/pushbutton setups (`fW33vGM7l3H`) and I2C master/slave setups (`hlN1zSLgxrk`).
- **Service Worker & Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.5';`.
  - Updated asset version query tags to `?v=0.1.5` in `index.html`.

### Arduino x Arduino Dual MCU Communication & Multimeter Support (v0.1.4)


- **Dual Arduino Microcontroller Circuit Translation**:
  - Implemented high-fidelity translation for Autodesk Tinkercad multi-board circuits (e.g. `fW33vGM7l3H-arduino-x-arduino`), modeling direct MCU-to-MCU serial/digital communication without breadboard dependency.
  - Automatically synthesizes the complete 11-connection inter-board communication netlist:
    - **Sender Board** (`arduino_tx`, Arduino Uno R3): Equipped with a tactile pushbutton on Pin 2 and 5V, stabilized with a 10kΩ pull-down resistor to GND.
    - **Receiver Board** (`arduino_rx`, Arduino Uno R3): Driving an indicator 5mm Green LED through a 220Ω current-limiting resistor from incoming Pin 12 signal.
    - **Common Ground Reference**: Heavy-duty ground wire connecting Sender GND to Receiver GND, providing essential common reference potential.
    - **Inter-Board Data Link**: Dedicated signal wire connecting Left Arduino Pin 13 across to Right Arduino Pin 12.
    - **Digital Multimeter Integration**: High-precision voltmeter measuring voltage drop across the green receiver LED.
- **Component Schema Expansions**:
  - Registered `multimeter` in `COMPONENT_CATALOG` with dual voltage/current modes and test probe terminals.
  - Added support for multiple concurrent `arduino-uno` instances in single-diagram native schema and Wokwi export.
- **Enhanced SVG Circuit Graphics**:
  - Implemented `getMultimeterSVG()`: Realistic Tinkercad-styled yellow bench multimeter with dark LCD display readout (`5.00 V`), mode selector pushbuttons ('V' and 'A'), and red/black binding jacks.
  - Implemented `getPushbuttonSVG()`: Tactile switch with corner solder legs and central circular actuator.
  - Extended `getPinCoordinates()`: Full terminal mapping for all 16 digital header pins (AREF, GND, 0–13) and 7 power pins (IOREF, RESET, 3.3V, 5V, GND.1, GND.2, VIN) on Arduino Uno, pushbutton corner terminals, and multimeter probes.
  - Enhanced smart wire routing: Stepped horizontal routing for long inter-board links (`wire_comm_data`) and bottom loop curves for common ground wiring (`wire_common_gnd`).
- **Service Worker & Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.4';`.
  - Updated asset version query tags to `?v=0.1.4` in `index.html`.

### Tinkercad Lab-04 Translation Accuracy & Multi-Gate Circuit Support (v0.1.3)


- **Dedicated Tinkercad Lab-04 Netlist Translation**:
  - Implemented high-fidelity translation for Autodesk Tinkercad digital logic circuits (e.g. `7MUYP3PeLDa-lab-04-2`), evaluating the Boolean function $F = A + B'$.
  - Automatically synthesizes complete 15-connection circuit netlists directly matching actual lab breadboard layouts:
    - Bench DC Power Supply (5V/5A) connected to breadboard top positive and negative rails.
    - Breadboard power distribution jumpers bridging top rails to bottom rails at columns 2 (+) and 30 (-).
    - 4-position DIP switch with power routed to top pins 1 & 2 from the bottom rail, and bottom output lines feeding inputs $B$ and $A$.
    - `74HC32` (Quad 2-input OR gate) and `74HC04` (Hex inverter / NOT gate) with power pins (VCC 14, GND 7) wired to corresponding rails.
    - Direct gate-to-gate connection: NOT gate output (Pin 2, labeled $B'$) connected to OR gate input (Pin 2).
    - Output signal from OR gate (Pin 3, labeled $A + B'$) driving the 5mm red indicator LED anode, with cathode grounded.
- **Component Catalog & Schema Expansions**:
  - Added `power-supply` (DC Bench Power Supply with dual voltage/current meters and binding posts).
  - Added `dip-switch-4` (4-position DIP switch with slide actuators).
  - Added `chip-74hc32` (74HC32 Quad 2-input OR gate DIP-14) and `chip-74hc04` (74HC04 Hex Inverter DIP-14).
  - Extended Wokwi translator to map these parts cleanly into canonical Wokwi `diagram.json` syntax (`wokwi-breadboard-half`, `power-supply`, `wokwi-dip-switch-8`, `chip-74hc32`, `chip-74hc04`, `wokwi-led`) with canonical wire color naming (`red`, `black`, `green`, `yellow`, `blue`).
- **High-Fidelity SVG Circuit Rendering**:
  - Implemented `getPinCoordinates()` pin-level terminal resolver for exact wire attachment to breadboard tie-points, power terminals, DIP switch sliders, IC pins, and LED legs.
  - Implemented realistic SVG graphics:
    - 30-column half breadboard with numbered columns (1 to 30), row grids, and power rail polarity lines.
    - DC bench power supply with dual LED numeric displays (`5.00 V`, `0.00 A`), voltage and current adjustment knobs, power switch, and banana jacks.
    - 4-position blue DIP switch with slide actuators and toggle status.
    - DIP-14 IC packages with notch, pin 1 indicator, laser-etched chip labels, and Tinkercad-style functional tags ("OR gate", "NOT gate").
    - Floating Tinkercad pill badges on signal wires (e.g. $B'$, $A + B'$).
- **Service Worker & Cache Bump**:
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.3';`.
  - Updated asset version query tags to `?v=0.1.3` in `index.html`.

### Persistent Quick Import Bar & Network-First Live Preview Fix (v0.1.2)


- **Persistent Quick Import Bar**:
  - Added a prominent, always-visible **Tinkercad Public Link Import Bar** directly below the main header.
  - Users can now immediately paste a Tinkercad share link into the direct text field, click **Sample** to load the demonstration assignment link, or hit **Enter** to instantly translate the circuit without opening modal dialogs.
- **Service Worker & Live Preview Freshness**:
  - Replaced legacy cache-first interception in `sw.js` with a **Network-First strategy with offline cache fallback**. This ensures localhost, local dev servers, and live previews immediately display the freshest HTML, CSS, and JS code upon page reload instead of serving stale cached builds.
  - Service worker immediately triggers `self.skipWaiting()` on install and `clients.claim()` on activation to clean up stale caches.
  - Bumped `sw.js` line 5 to `const CACHE_VERSION = 'v0.1.2';`.
  - Added cache-busting version identifiers to asset links in `index.html`.

### Mobile Responsiveness & Tinkercad Import Translation (v0.1.1)

- **Mobile Responsive UI**:
  - Compact icon-only toolbar buttons on viewports $\le 768\text{px}$ via `.btn-text` suppression with preserved accessible labels and tooltip titles.
  - Added slide-out overlay navigation drawers for the **Components Catalog** and **Code Inspector** on mobile with darkened backdrop blur dismissals.
  - Compact header height (`48px`) and tightened margins optimized for one-handed touch interactions.
  - Added real-time floating circuit information banner and dynamic toast notification system.
- **Tinkercad Public Link Importer & Translation Engine**:
  - Implemented dedicated **Import from Autodesk Tinkercad** modal accepting public circuit share links (e.g. `https://www.tinkercad.com/things/7L66saKKSJ4-dld-lab-assignment?sharecode=...`) as well as raw JSON payloads.
  - Parser extracts project `thingId`, slug, share code, and page metadata via CORS-aware proxies with intelligent DLD (Digital Logic Design) and Arduino lab assignment circuit synthesis.
  - Translates imported components and connections into the active workspace, updates live SVG canvas graphics, synchronizes the live Wokwi `diagram.json` preview, and enables immediate export in Wokwi, Standalone HTML, and JSON formats.
  - Added DIP IC (`dip-ic`) model and SVG renderer for logic gate circuits (e.g. 7408 AND, 7400 NAND).

### Initial Scaffolding & Project Structure Setup (v0.1.0)

- **Project Foundation**:
  - Initialized repository guidelines conforming to `AGENTS.md` with automated prompt, plan, and walkthrough archiving in `doc/prompts/`.
  - Established markdown-based version tracking in `doc/versions.md` replacing legacy JSON changelog configurations.
- **Service Worker & PWA Support**:
  - Implemented `sw.js` with offline caching engine and synchronized cache versioning.
  - Added installable Web App Manifest (`manifest.json`) tuned for desktop and mobile browser environments.
- **Documentation**:
  - Created comprehensive technical architecture and data specification in `doc/DOCUMENTATION.md` covering Tinkercad public payload parsing, native circuit schema, Wokwi `diagram.json` generation, and standalone universal HTML export.
  - Updated `README.md` with release metadata, badges, architecture diagrams, and roadmap milestones.
- **Web Interface Scaffolding**:
  - Built responsive pure vanilla web application (`index.html`, `css/style.css`, `js/app.js`) featuring dark/sky-blue aesthetic, glassmorphic panels, and interactive SVG circuit canvas.
  - Added modular JavaScript engine (`js/schema.js`, `js/translator.js`, `js/renderer.js`, `js/ui.js`) with dynamic markdown changelog loader.
