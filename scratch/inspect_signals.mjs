import fs from 'fs';
const xml = fs.readFileSync('scratch/5.lab 04-1.brd', 'utf8');
const signalRegex = /<signal\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/signal>/gi;
let m;
while ((m = signalRegex.exec(xml)) !== null) {
  const name = m[1];
  const inner = m[2];
  const cRegex = /<contactref\s+([^>]+)>/gi;
  let cm;
  const refs = [];
  while ((cm = cRegex.exec(inner)) !== null) {
    refs.push(cm[1]);
  }
  console.log(`Signal ${name} (${refs.length} contacts):`, refs);
}
