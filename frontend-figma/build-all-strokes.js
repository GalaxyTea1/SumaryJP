import fs from 'fs';
import path from 'path';

const KANJIVG_DIR = path.join(process.cwd(), 'node_modules', '@madcat', 'kanjivg', 'dist', 'main');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'app', 'utils', 'kanaData.json');
const APP_FILE = path.join(process.cwd(), 'src', 'app', 'App.tsx');

const kanaData = {};

// 1. Get Hiragana and Katakana (3041-30FA)
for (let code = 0x3041; code <= 0x30FA; code++) {
  const hex = code.toString(16).padStart(5, '0');
  const svgPath = path.join(KANJIVG_DIR, `${hex}.svg`);
  
  if (fs.existsSync(svgPath)) {
    const content = fs.readFileSync(svgPath, 'utf8');
    const paths = [];
    const regex = /<path[^>]*d="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      paths.push(match[1]);
    }
    if (paths.length > 0) kanaData[String.fromCharCode(code)] = paths;
  }
}

// 2. Get Kanji from App.tsx
const appContent = fs.readFileSync(APP_FILE, 'utf8');
const chars = new Set();
const charMatches = appContent.match(/char:\s*["']([^"']+)["']/g);
if (charMatches) {
  charMatches.forEach(m => {
    const char = m.split(/["']/)[1];
    if (char && char.length === 1 && char.match(/[\u4e00-\u9faf]/)) {
      chars.add(char);
    }
  });
}

chars.forEach(char => {
  const code = char.charCodeAt(0);
  const hex = code.toString(16).padStart(5, '0');
  const svgPath = path.join(KANJIVG_DIR, `${hex}.svg`);
  
  if (fs.existsSync(svgPath)) {
    const content = fs.readFileSync(svgPath, 'utf8');
    const paths = [];
    const regex = /<path[^>]*d="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      paths.push(match[1]);
    }
    if (paths.length > 0) kanaData[char] = paths;
  }
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kanaData, null, 2));
console.log(`Successfully generated stroke data for ${Object.keys(kanaData).length} characters (including Kanji).`);
