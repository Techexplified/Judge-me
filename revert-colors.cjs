const fs = require('fs');
const file = 'app/routes/app._index.jsx';
let content = fs.readFileSync(file, 'utf8');

const map = {
  'linear-gradient(90deg, #6f63ed, #6f63ed)': 'linear-gradient(90deg, #14b8a6, #0d9488)',
  '#6f63ed': '#23b5b5',
  'rgba(111,99,237,0.14)': 'rgba(35,181,181,0.14)',
  'rgba(111,99,237,0.25)': 'rgba(20,184,166,0.25)',
  '#4c1d95': '#0f766e',
  '#ede9fe': '#ccfbf1',
  '#c4b5fd': '#5eead4',
  '#a78bfa': '#99f6e4',
  '#f5f3ff': '#f0fdfa'
};

for (const [purple, teal] of Object.entries(map)) {
  content = content.split(purple).join(teal);
}

// Manually fix a couple of specific ones to their darker teal counterparts for contrast
content = content.replace(/color: "#23b5b5",\s*background: "#ccfbf1",\s*border: "1px solid #5eead4"/g, 'color: "#0d9488",\n    background: "#ccfbf1",\n    border: "1px solid #5eead4"');
content = content.replace(/color="#23b5b5"/g, 'color="#0d9488"');
// The button Pill needs to be slightly darker teal
content = content.replace(/background: "#23b5b5", color: "#fff", fontWeight: 800/g, 'background: "#14b8a6", color: "#fff", fontWeight: 800');

fs.writeFileSync(file, content);
console.log('Reverted colors in ' + file);
