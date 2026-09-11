import fs from 'fs';
const dir = 'G:/My Drive/DriveSync/oUITS Resources/2. Departments ⭐/1. CSE ⭐/S03.cse/DLD CSE0611215 + CSE0611216/DLD Lab CSE0611216/LabWork.DLD';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.brd'));

function classify(name, val, pkg, library) {
  const searchKey = `${name} ${val} ${pkg} ${library}`.toLowerCase();
  if (/arduino.*mega|mega/i.test(searchKey)) return 'arduino-mega';
  if (/arduino.*nano|nano/i.test(searchKey)) return 'arduino-nano';
  if (/esp32/i.test(searchKey)) return 'esp32';
  if (/arduino|uno|atmega328/i.test(searchKey)) return 'arduino-uno';
  if (/neopixel.*ring/i.test(searchKey)) return 'neopixel-ring';
  if (/neopixel|ws2812/i.test(searchKey)) return 'neopixel-strip';
  if (/lcd|1602/i.test(searchKey)) return 'lcd1602-i2c';
  if (/74hc08|7408/i.test(searchKey)) return 'chip-7408';
  if (/74hc04|7404/i.test(searchKey)) return 'chip-74hc04';
  if (/74hc32|7432/i.test(searchKey)) return 'chip-74hc32';
  if (/74hc00|7400/i.test(searchKey)) return 'chip-7400';
  if (/74hc02|7402/i.test(searchKey)) return 'dip-ic';
  if (/74hc11|7411/i.test(searchKey)) return 'dip-ic';
  if (/74hc86|7486/i.test(searchKey)) return 'dip-ic';
  if (/74hc132|74132/i.test(searchKey)) return 'chip-7400';
  if (/^u\d*$/i.test(name) && /dip|pdip/i.test(pkg)) return 'dip-ic';
  if (/ledrd|led/i.test(pkg) || /lightbulb|bulb/i.test(searchKey) || (/^d\d*$/i.test(name) && /red|green|blue|yellow|led/i.test(searchKey))) return 'led';
  if (/^r\d*|resistor/i.test(name) || /resistor/i.test(searchKey)) return 'resistor';
  if (/^c\d*|capacitor/i.test(name) || /capacitor/i.test(searchKey)) return 'capacitor';
  if (/^d\d*|diode/i.test(name) || /diode/i.test(searchKey)) return 'diode';
  if (/78b|spst|dip.*switch/i.test(searchKey)) return 'dip-switch-4';
  if (/button|push/i.test(searchKey)) return 'pushbutton';
  if (/switch|spdt/i.test(searchKey)) return 'slide-switch';
  if (/battery|generic/i.test(searchKey)) return searchKey.includes('9v') ? 'battery-9v' : 'battery-aa-4';
  return 'generic-component';
}

for (const f of files) {
  const xml = fs.readFileSync(dir + '/' + f, 'utf8');
  const elements = [...xml.matchAll(/<element\s+([^>]+)>/gi)].map(m => m[1]);
  const classified = elements.map(e => {
    const name = (e.match(/name="([^"]*)"/i) || [])[1] || '';
    const pkg = (e.match(/package="([^"]*)"/i) || [])[1] || '';
    const val = (e.match(/value="([^"]*)"/i) || [])[1] || '';
    return `${name}->${classify(name, val, pkg, 'Tinkercad')}`;
  });
  console.log(f, ':', classified.slice(0, 6).join(', '), classified.length > 6 ? `... (+${classified.length - 6} more)` : '');
}
