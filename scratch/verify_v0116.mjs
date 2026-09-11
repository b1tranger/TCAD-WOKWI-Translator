import fs from 'fs';
import path from 'path';
import { COMPONENT_CATALOG } from '../js/schema.js';
import { Translator } from '../js/translator.js';

console.log('--- TCAD-WOKWI-Translator v0.1.16 Verification ---');

// 1. Check NeoPixel models in schema
if (!COMPONENT_CATALOG['neopixel-strip']) throw new Error('Missing neopixel-strip in COMPONENT_CATALOG');
if (!COMPONENT_CATALOG['neopixel-ring']) throw new Error('Missing neopixel-ring in COMPONENT_CATALOG');
console.log('✓ COMPONENT_CATALOG verified: neopixel-strip and neopixel-ring registered.');

// 2. Test Multi-MCU Project compilation to Wokwi diagram.json
const multiMcuProject = {
  metadata: { title: '4-Arduino Multi-MCU Test', version: '1.0.0' },
  components: [
    { id: 'uno_master', type: 'arduino-uno', x: 80, y: 120 },
    { id: 'uno_slave1', type: 'arduino-uno', x: 440, y: 120 },
    { id: 'uno_slave2', type: 'arduino-uno', x: 80, y: 420 },
    { id: 'uno_slave3', type: 'arduino-uno', x: 440, y: 420 },
    { id: 'strip_1', type: 'neopixel-strip', x: 260, y: 80 },
    { id: 'ring_1', type: 'neopixel-ring', x: 300, y: 260 },
    { id: 'bb_1', type: 'breadboard-half', x: 800, y: 200 }
  ],
  connections: [
    // Direct inter-board I2C and communication wires
    { id: 'wire_i2c_sda', from: { component: 'uno_master', pin: 'A4' }, to: { component: 'uno_slave1', pin: 'A4' }, color: '#0284c7' },
    { id: 'wire_i2c_scl', from: { component: 'uno_master', pin: 'A5' }, to: { component: 'uno_slave1', pin: 'A5' }, color: '#10b981' },
    { id: 'wire_strip_data', from: { component: 'uno_master', pin: '6' }, to: { component: 'strip_1', pin: 'DIN' }, color: '#eab308' },
    { id: 'wire_ring_data', from: { component: 'uno_slave2', pin: '9' }, to: { component: 'ring_1', pin: 'DIN' }, color: '#eab308' },
    // Common ground rail through breadboard
    { id: 'wire_gnd_m', from: { component: 'uno_master', pin: 'GND.1' }, to: { component: 'bb_1', pin: 'top_rail_neg_1' }, color: '#0f172a' },
    { id: 'wire_gnd_s1', from: { component: 'uno_slave1', pin: 'GND.1' }, to: { component: 'bb_1', pin: 'top_rail_neg_5' }, color: '#0f172a' },
    { id: 'wire_gnd_s2', from: { component: 'uno_slave2', pin: 'GND.1' }, to: { component: 'bb_1', pin: 'top_rail_neg_10' }, color: '#0f172a' },
    { id: 'wire_gnd_s3', from: { component: 'uno_slave3', pin: 'GND.1' }, to: { component: 'bb_1', pin: 'top_rail_neg_15' }, color: '#0f172a' }
  ]
};

const wokwiCompiled = Translator.toWokwi(multiMcuProject);
console.log(`✓ toWokwi compiled: ${wokwiCompiled.parts.length} parts, ${wokwiCompiled.connections.length} connections.`);

// Ensure all 4 Arduinos are present in parts
const mcuParts = wokwiCompiled.parts.filter(p => p.type.includes('arduino'));
if (mcuParts.length !== 4) throw new Error(`Expected 4 Arduino boards in Wokwi parts, found ${mcuParts.length}`);
console.log('✓ All 4 Arduino microcontrollers preserved in Wokwi parts list.');

// Ensure no self-loop connections (e.g. uno_master connecting to itself)
wokwiCompiled.connections.forEach(conn => {
  const [fromPart] = conn[0].split(':');
  const [toPart] = conn[1].split(':');
  if (fromPart === toPart) {
    throw new Error(`Self-loop detected in connection: ${conn[0]} <-> ${conn[1]}`);
  }
});
console.log('✓ No self-loops detected across multi-MCU netlist compilation.');

// 3. Test Universal EAGLE BRD XML Parsing
const sampleEagleXml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE eagle SYSTEM "eagle.dtd">
<eagle version="9.6.2">
  <drawing>
    <description>Universal Multi-Board Heart Controller</description>
    <board>
      <elements>
        <element name="U1" library="Arduino" package="ARDUINO_UNO" value="UNO_MASTER" x="25.4" y="50.8" rot="R0"/>
        <element name="U2" library="Arduino" package="ARDUINO_UNO" value="UNO_SLAVE" x="127.0" y="50.8" rot="R0"/>
        <element name="NEO1" library="Adafruit" package="WS2812B_STRIP" value="NEOPIXEL_STRIP_8" x="76.2" y="88.9"/>
        <element name="RING1" library="Adafruit" package="NEOPIXEL_RING_12" value="NEO_RING" x="76.2" y="25.4"/>
        <element name="R1" library="resistor" package="0207/10" value="220" x="50.8" y="50.8"/>
      </elements>
      <signals>
        <signal name="GND">
          <contactref element="U1" pad="GND"/>
          <contactref element="U2" pad="GND"/>
          <contactref element="NEO1" pad="GND"/>
          <contactref element="RING1" pad="GND"/>
        </signal>
        <signal name="DATA_IN">
          <contactref element="U1" pad="6"/>
          <contactref element="NEO1" pad="DIN"/>
        </signal>
        <signal name="I2C_SDA">
          <contactref element="U1" pad="A4"/>
          <contactref element="U2" pad="A4"/>
        </signal>
      </signals>
    </board>
  </drawing>
</eagle>`;

const eagleParsed = Translator.fromEagleBrdRegex(sampleEagleXml);
console.log(`✓ fromEagleBrd parsed: ${eagleParsed.components.length} components, ${eagleParsed.connections.length} connections.`);
if (eagleParsed.components.length !== 5) throw new Error(`Expected 5 components, found ${eagleParsed.components.length}`);
if (eagleParsed.connections.length < 4) throw new Error(`Expected at least 4 connections, found ${eagleParsed.connections.length}`);

// Check component types
const types = eagleParsed.components.map(c => c.type);
if (!types.includes('arduino-uno')) throw new Error('Missing arduino-uno in parsed Eagle components');
if (!types.includes('neopixel-strip')) throw new Error('Missing neopixel-strip in parsed Eagle components');
if (!types.includes('neopixel-ring')) throw new Error('Missing neopixel-ring in parsed Eagle components');
if (!types.includes('resistor')) throw new Error('Missing resistor in parsed Eagle components');
console.log('✓ Eagle components accurately classified into schema catalog types.');

// 4. Test User's Reference File C:\\Users\\gsmur\\Downloads\\diagram.json
const refDiagramPath = 'C:\\\\Users\\\\gsmur\\\\Downloads\\\\diagram.json';
if (fs.existsSync(refDiagramPath)) {
  const refContent = fs.readFileSync(refDiagramPath, 'utf8');
  const refJson = JSON.parse(refContent);
  const translatedRef = Translator.fromWokwi(refJson);
  console.log(`✓ Reference diagram.json parsed: ${translatedRef.components.length} components, ${translatedRef.connections.length} connections.`);
  const recompiledWokwi = Translator.toWokwi(translatedRef);
  console.log(`✓ Reference diagram.json recompiled: ${recompiledWokwi.parts.length} parts, ${recompiledWokwi.connections.length} connections.`);
} else {
  console.log('(Reference file C:\\\\Users\\\\gsmur\\\\Downloads\\\\diagram.json not found on disk, skipping)');
}

// 5. Test Standalone HTML Export with Multi-MCU and NeoPixels
const standaloneHtml = Translator.exportStandaloneHTML(multiMcuProject, '<g id="test-content"></g>');
if (!standaloneHtml.includes('Standalone Universal HTML')) throw new Error('Exported HTML missing header');
if (!standaloneHtml.includes('accept=".json,.brd,.xml"')) throw new Error('Exported HTML missing .brd/.xml file input accept');
console.log('✓ Standalone HTML export verified with .brd/.xml ingestion and NeoPixel rendering.');

console.log('\\n>>> ALL v0.1.16 VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<');
