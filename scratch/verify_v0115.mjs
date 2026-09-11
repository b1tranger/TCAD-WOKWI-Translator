import fs from 'fs';
import { Translator } from '../js/translator.js';

console.log('=== TEST 1: Service Worker & Version Sync ===');
const sw = fs.readFileSync('./sw.js', 'utf8');
if (!sw.includes("const CACHE_VERSION = 'v0.1.15';")) {
  throw new Error('sw.js CACHE_VERSION mismatch: ' + sw.slice(0, 100));
}
const html = fs.readFileSync('./index.html', 'utf8');
if (!html.includes('v0.1.15')) {
  throw new Error('index.html version mismatch');
}
if (!html.includes('btn-open-file')) {
  throw new Error('btn-open-file missing in index.html');
}
if (!html.includes('file-input-circuit')) {
  throw new Error('file-input-circuit missing in index.html');
}
if (!html.includes('btn-modal-choose-file')) {
  throw new Error('btn-modal-choose-file missing in index.html');
}
console.log('PASS: Version & HTML controls synchronized to v0.1.15');

console.log('=== TEST 2: diagram.json Parsing ===');
const diagramJson = JSON.parse(fs.readFileSync('C:/Users/gsmur/Downloads/diagram.json', 'utf8'));
const translated = Translator.fromWokwi(diagramJson);
console.log('Title:', translated.metadata.title);
console.log('Parts count:', translated.components.length);
console.log('Connections count:', translated.connections.length);
if (translated.components.length !== 10) throw new Error('Expected 10 components');
if (translated.connections.length !== 21) throw new Error('Expected 21 connections');
console.log('PASS: diagram.json translated correctly');

console.log('=== TEST 3: Standalone HTML Generation ===');
const dummySvg = '<g class="canvas-component" data-id="arduino_uno"><rect width="260" height="180"/></g>';
const standaloneHtml = Translator.exportStandaloneHTML(translated, dummySvg);
if (!standaloneHtml.includes('Standalone Universal HTML')) throw new Error('Standalone title missing');
if (!standaloneHtml.includes('wokwi-circuit-data')) throw new Error('wokwi-circuit-data missing');
if (!standaloneHtml.includes('renderDynamicSvg')) throw new Error('renderDynamicSvg missing');
if (!standaloneHtml.includes('btn-load-file')) throw new Error('btn-load-file missing');
if (!standaloneHtml.includes('btn-download-wokwi')) throw new Error('btn-download-wokwi missing');
if (!standaloneHtml.includes('arduino_uno')) throw new Error('Embedded SVG missing');
console.log('PASS: Standalone HTML export contains all scripts, controls, and graphics');

console.log('=== ALL 3 TEST SUITES PASSED CLEANLY! ===');
