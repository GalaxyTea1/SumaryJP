import fs from 'fs';
import path from 'path';

const KANJIVG_DIR = path.join(process.cwd(), 'node_modules', '@madcat', 'kanjivg', 'dist', 'main');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'app', 'utils', 'kanaData.json');

// Hiragana: 3041-3096
// Katakana: 30A1-30FA
const ranges = [
  [0x3041, 0x3096],
  [0x30A1, 0x30FA]
];

const kanaData = {};

ranges.forEach(([start, end]) => {
  for (let code = start; code <= end; code++) {
    const hex = code.toString(16).padStart(5, '0');
    const svgPath = path.join(KANJIVG_DIR, `${hex}.svg`);
    
    if (fs.existsSync(svgPath)) {
      const content = fs.readFileSync(svgPath, 'utf8');
      
      // Extract path 'd' attributes
      const paths = [];
      const regex = /<path[^>]*d="([^"]+)"/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        paths.push(match[1]);
      }
      
      if (paths.length > 0) {
        kanaData[String.fromCharCode(code)] = paths;
      }
    }
  }
});

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kanaData, null, 2));

console.log(`Successfully generated kanaData.json with ${Object.keys(kanaData).length} characters.`);
