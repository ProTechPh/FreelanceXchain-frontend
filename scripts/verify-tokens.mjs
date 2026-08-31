import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(rootDir, 'src');

function getFiles(dir, extensions = ['.ts', '.tsx']) {
  let results = [];
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFiles(filePath, extensions));
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  } catch {}
  return results;
}

const FAMILIES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const CHECKS = [
  {
    name: 'Tailwind palette classes (use semantic tokens)',
    pattern: new RegExp(`(bg|text|border|ring|fill|stroke|from|to|via|divide)-(${FAMILIES})-[0-9]{2,3}`),
  },
  {
    name: 'raw hex in a utility class',
    pattern: /(text|bg|border|from|to|via|ring)-\[#[0-9a-fA-F]{3,8}\]/,
  },
  {
    name: 'arbitrary font size (use the type scale; 2xs is the floor)',
    pattern: /text-\[[0-9.]+(px|rem)\]/,
  },
  {
    name: 'text-white on a themed surface (use the surface -foreground token)',
    pattern: /\btext-white\b/,
  },
  {
    name: 'opacity-based disabled state (drops contrast below AA)',
    pattern: /disabled:opacity-/,
  },
  {
    name: 'second icon library (lucide-react only)',
    pattern: /@phosphor-icons|@radix-ui\/react-icons/,
  },
  {
    name: 'dashboard route re-exporting a public route',
    pattern: /export \{ default \} from ['"]@\/app\//,
  },
];

let failed = false;
let failedChrome = false;
const CHROME_PATTERN = /layout\/navbar|layout\/footer-section/;
const CHROME_ALLOWED = ['src/components/marketplace/public-marketplace-shell.tsx'];

const chromeDirs = [
  join(srcDir, 'app', 'dashboard'),
  join(srcDir, 'components', 'dashboard'),
  join(srcDir, 'components', 'marketplace'),
  join(srcDir, 'components', 'contracts'),
  join(srcDir, 'components', 'messages'),
  join(srcDir, 'components', 'disputes'),
  join(srcDir, 'components', 'transactions'),
];

const chromeFiles = chromeDirs.flatMap((dir) => getFiles(dir, ['.ts', '.tsx']));
const badChrome = [];

for (const filePath of chromeFiles) {
  const relPath = relative(rootDir, filePath).replace(/\\/g, '/');
  if (CHROME_ALLOWED.includes(relPath)) continue;
  const content = readFileSync(filePath, 'utf8');
  if (CHROME_PATTERN.test(content)) {
    badChrome.push(relPath);
  }
}

if (badChrome.length) {
  failedChrome = true;
  console.error('\nFAIL  public page chrome reachable from a dashboard surface:');
  for (const f of badChrome) console.error(`      ${f}`);
} else {
  console.log('PASS  no public chrome on dashboard surfaces');
}

const allSrcFiles = getFiles(srcDir, ['.ts', '.tsx']);

for (const { name, pattern } of CHECKS) {
  const occurrences = [];
  for (const filePath of allSrcFiles) {
    const relPath = relative(rootDir, filePath).replace(/\\/g, '/');
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        occurrences.push(`${relPath}:${idx + 1}:${line.trim()}`);
      }
    });
  }

  if (occurrences.length) {
    failed = true;
    console.error(`\nFAIL  ${name} — ${occurrences.length} occurrence(s):`);
    for (const line of occurrences.slice(0, 10)) console.error(`      ${line.slice(0, 140)}`);
    if (occurrences.length > 10) console.error(`      … and ${occurrences.length - 10} more`);
  } else {
    console.log(`PASS  ${name}`);
  }
}

// Every class referenced in components must actually exist somewhere in CSS.
const css = readFileSync(join(srcDir, 'app', 'globals.css'), 'utf8');
const CUSTOM = ['gradient-primary', 'gradient-text', 'glow-sm-primary', 'glow-primary', 'animate-element'];
const tsxFiles = getFiles(srcDir, ['.tsx']);

for (const cls of CUSTOM) {
  const clsPattern = new RegExp(`\\b${cls}\\b`);
  const used = tsxFiles.some((filePath) => clsPattern.test(readFileSync(filePath, 'utf8')));
  const defined = css.includes(`.${cls} {`);
  if (used && !defined) {
    failed = true;
    console.error(`\nFAIL  .${cls} is used in components but never defined in globals.css`);
  } else {
    console.log(`PASS  .${cls} ${defined ? 'defined' : 'unused and undefined'}`);
  }
}

failed = failed || failedChrome;
console.log(`\n${failed ? '=== TOKEN GUARD FAILED ===' : '=== TOKEN GUARD PASSED ==='}`);
process.exit(failed ? 1 : 0);
