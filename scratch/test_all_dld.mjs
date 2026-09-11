import { Translator } from '../js/translator.js';
import fs from 'fs';
import path from 'path';

const dir = 'G:/My Drive/DriveSync/oUITS Resources/2. Departments ⭐/1. CSE ⭐/S03.cse/DLD CSE0611215 + CSE0611216/DLD Lab CSE0611216/LabWork.DLD';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.brd'));
console.log(`Total BRD files found: ${files.length}`);

let successCount = 0;
for (const f of files) {
  const fullPath = path.join(dir, f);
  const content = fs.readFileSync(fullPath, 'utf8');
  const project = Translator.fromEagleBrd(content);
  const partsCount = (project.components || []).length;
  const connsCount = (project.connections || []).length;
  const types = [...new Set((project.components || []).map(c => c.type))];
  console.log(`[PASS] ${f}: ${partsCount} components (${types.join(', ')}), ${connsCount} wires`);
  if (partsCount > 0) successCount++;
}

console.log(`\nSummary: ${successCount} / ${files.length} successfully translated!`);
