/**
 * TCAD-WOKWI-Translator - Schema Definitions & Default State
 */

export const DEFAULT_PROJECT = {
  metadata: {
    title: "Untitled Circuit",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    author: "Maker"
  },
  viewport: {
    zoom: 1.0,
    panX: 0,
    panY: 0
  },
  components: [
    {
      id: "arduino_1",
      type: "arduino-uno",
      x: 80,
      y: 120,
      rotation: 0,
      properties: {}
    },
    {
      id: "breadboard_1",
      type: "breadboard-half",
      x: 440,
      y: 100,
      rotation: 0,
      properties: {}
    }
  ],
  connections: [
    {
      id: "wire_1",
      from: { component: "arduino_1", pin: "5V" },
      to: { component: "breadboard_1", pin: "power_pos_1" },
      color: "#ef4444",
      bends: []
    },
    {
      id: "wire_2",
      from: { component: "arduino_1", pin: "GND.1" },
      to: { component: "breadboard_1", pin: "power_neg_1" },
      color: "#0284c7",
      bends: []
    }
  ]
};

export const COMPONENT_CATALOG = {
  // Boards
  "breadboard-half": {
    name: "Half Breadboard",
    category: "Boards",
    width: 380,
    height: 220,
    wokwiType: "wokwi-breadboard-half"
  },
  "breadboard-full": {
    name: "Full Breadboard (830 Tie-Points)",
    category: "Boards",
    width: 680,
    height: 220,
    wokwiType: "wokwi-breadboard-full"
  },
  "breadboard-mini": {
    name: "Mini Breadboard",
    category: "Boards",
    width: 220,
    height: 180,
    wokwiType: "wokwi-breadboard-mini"
  },

  // Microcontrollers
  "arduino-uno": {
    name: "Arduino Uno R3",
    category: "Microcontrollers",
    width: 320,
    height: 240,
    wokwiType: "wokwi-arduino-uno"
  },
  "arduino-mega": {
    name: "Arduino Mega 2560",
    category: "Microcontrollers",
    width: 440,
    height: 240,
    wokwiType: "wokwi-arduino-mega"
  },
  "arduino-nano": {
    name: "Arduino Nano",
    category: "Microcontrollers",
    width: 140,
    height: 220,
    wokwiType: "wokwi-arduino-nano"
  },
  "esp32": {
    name: "ESP32 DevKit V1",
    category: "Microcontrollers",
    width: 160,
    height: 240,
    wokwiType: "wokwi-esp32-devkit-v1"
  },

  // Inputs & Sensors
  "pushbutton": {
    name: "Tactile Pushbutton",
    category: "Inputs & Sensors",
    width: 36,
    height: 36,
    wokwiType: "wokwi-pushbutton"
  },
  "potentiometer": {
    name: "Rotary Potentiometer",
    category: "Inputs & Sensors",
    width: 48,
    height: 48,
    wokwiType: "wokwi-potentiometer"
  },
  "slide-switch": {
    name: "Slide Switch (SPDT)",
    category: "Inputs & Sensors",
    width: 52,
    height: 32,
    wokwiType: "wokwi-slide-switch"
  },
  "dip-switch-4": {
    name: "4-Position DIP Switch",
    category: "Inputs & Sensors",
    width: 70,
    height: 90,
    wokwiType: "wokwi-dip-switch-8",
    defaultProperties: { label: "B A", positions: 4 }
  },
  "sensor-tmp36": {
    name: "TMP36 Temperature Sensor",
    category: "Inputs & Sensors",
    width: 36,
    height: 44,
    wokwiType: "wokwi-tmp36"
  },
  "pir-sensor": {
    name: "PIR Motion Sensor",
    category: "Inputs & Sensors",
    width: 110,
    height: 110,
    wokwiType: "wokwi-pir-motion-sensor"
  },
  "ultrasonic-hcsr04": {
    name: "HC-SR04 Ultrasonic Sensor",
    category: "Inputs & Sensors",
    width: 140,
    height: 70,
    wokwiType: "wokwi-hc-sr04"
  },
  "photoresistor": {
    name: "Photoresistor (LDR)",
    category: "Inputs & Sensors",
    width: 32,
    height: 36,
    wokwiType: "wokwi-photoresistor-sensor"
  },

  // Outputs & Actuators
  "led": {
    name: "LED (5mm)",
    category: "Outputs & Actuators",
    width: 32,
    height: 32,
    wokwiType: "wokwi-led",
    defaultProperties: { color: "red" }
  },
  "rgb-led": {
    name: "RGB LED (Diffuse)",
    category: "Outputs & Actuators",
    width: 38,
    height: 38,
    wokwiType: "wokwi-rgb-led"
  },
  "buzzer": {
    name: "Piezo Buzzer",
    category: "Outputs & Actuators",
    width: 64,
    height: 64,
    wokwiType: "wokwi-buzzer"
  },
  "dc-motor": {
    name: "DC Hobby Motor",
    category: "Outputs & Actuators",
    width: 100,
    height: 76,
    wokwiType: "wokwi-motor"
  },
  "servo": {
    name: "SG90 Micro Servo",
    category: "Outputs & Actuators",
    width: 90,
    height: 80,
    wokwiType: "wokwi-servo"
  },
  "relay": {
    name: "5V Relay Module",
    category: "Outputs & Actuators",
    width: 110,
    height: 80,
    wokwiType: "wokwi-relay-module"
  },

  // Passives & Semiconductors
  "resistor": {
    name: "Resistor (220Ω)",
    category: "Passives & Semiconductors",
    width: 80,
    height: 24,
    wokwiType: "wokwi-resistor",
    defaultProperties: { resistance: "220" }
  },
  "capacitor": {
    name: "Ceramic / Electrolytic Capacitor",
    category: "Passives & Semiconductors",
    width: 36,
    height: 36,
    wokwiType: "wokwi-capacitor"
  },
  "diode": {
    name: "1N4001 Rectifier / Flyback Diode",
    category: "Passives & Semiconductors",
    width: 70,
    height: 20,
    wokwiType: "wokwi-diode"
  },
  "transistor-tip120": {
    name: "TIP120 Darlington Power Transistor",
    category: "Passives & Semiconductors",
    width: 48,
    height: 72,
    wokwiType: "wokwi-transistor-npn"
  },

  // Displays & Measurement
  "lcd1602-i2c": {
    name: "16x2 I2C LCD Display",
    category: "Displays & Measurement",
    width: 260,
    height: 100,
    wokwiType: "wokwi-lcd1602",
    defaultProperties: { pins: "i2c" }
  },
  "7segment": {
    name: "7-Segment Display (1-Digit)",
    category: "Displays & Measurement",
    width: 60,
    height: 90,
    wokwiType: "wokwi-7segment"
  },
  "oled-ssd1306": {
    name: "0.96\" I2C OLED (128x64)",
    category: "Displays & Measurement",
    width: 110,
    height: 110,
    wokwiType: "wokwi-ssd1306"
  },
  "multimeter": {
    name: "Digital Multimeter",
    category: "Displays & Measurement",
    width: 140,
    height: 60,
    wokwiType: "multimeter",
    defaultProperties: { mode: "voltage", reading: "5.00 V" }
  },

  // Power
  "battery-9v": {
    name: "9V Heavy Duty Battery",
    category: "Power",
    width: 90,
    height: 140,
    wokwiType: "wokwi-battery-9v",
    defaultProperties: { voltage: "9V" }
  },
  "battery-aa-4": {
    name: "4x AA Battery Pack (6V)",
    category: "Power",
    width: 120,
    height: 90,
    wokwiType: "wokwi-battery-aa-4",
    defaultProperties: { voltage: "6V" }
  },
  "power-supply": {
    name: "DC Bench Power Supply",
    category: "Power",
    width: 180,
    height: 140,
    wokwiType: "power-supply",
    defaultProperties: { voltage: "5.0V", current: "5.0A" }
  },

  // Digital Logic ICs
  "chip-74hc32": {
    name: "74HC32 Quad 2-Input OR Gate",
    category: "Logic ICs",
    width: 130,
    height: 60,
    wokwiType: "chip-74hc32",
    defaultProperties: { label: "74HC32", function: "OR gate" }
  },
  "chip-74hc04": {
    name: "74HC04 Hex Inverter / NOT Gate",
    category: "Logic ICs",
    width: 130,
    height: 60,
    wokwiType: "chip-74hc04",
    defaultProperties: { label: "74HC04", function: "NOT gate" }
  },
  "chip-7408": {
    name: "7408 Quad 2-Input AND Gate",
    category: "Logic ICs",
    width: 130,
    height: 60,
    wokwiType: "chip-7408",
    defaultProperties: { label: "7408 AND" }
  },
  "chip-7400": {
    name: "7400 Quad 2-Input NAND Gate",
    category: "Logic ICs",
    width: 130,
    height: 60,
    wokwiType: "chip-7400",
    defaultProperties: { label: "7400 NAND" }
  },
  "chip-555": {
    name: "NE555 Precision Timer",
    category: "Logic ICs",
    width: 100,
    height: 60,
    wokwiType: "chip-555",
    defaultProperties: { label: "NE555 Timer" }
  },
  "dip-ic": {
    name: "DIP Logic IC (Generic)",
    category: "Logic ICs",
    width: 120,
    height: 60,
    wokwiType: "wokwi-logic-gate",
    defaultProperties: { label: "DIP IC" }
  }
};


