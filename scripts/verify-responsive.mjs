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

// Three or more columns is never readable on a 320px screen, so a base
// `grid-cols-3`+ must either start at one column or be gated behind a
// breakpoint. A base `grid-cols-2` is left alone: two stat tiles at ~120px is a
// deliberate and widely used choice here, and it does not overflow.
function hasUngatedGrid(line) {
  if (!/(?<![\w:-])grid-cols-[3-9]\b/.test(line)) return false;
  if (/grid-cols-1\b/.test(line)) return false;
  return true;
}

// The base DialogContent supplies `max-w-[calc(100%-2rem)]`. Because cn() is
// twMerge, a call site passing its own unprefixed max-w REPLACES that gutter --
// unless the value is itself a viewport-relative gutter.
function dropsDialogGutter(line) {
  const match = line.match(/<DialogContent[^>]*className="([^"]*)"/);
  if (!match) return false;
  return match[1]
    .split(/\s+/)
    .some((cls) => /^max-w-/.test(cls) && !/^max-w-\[calc\(/.test(cls) && cls !== 'max-w-full');
}

const CHECKS = [
  {
    name: 'multi-column grid with no single-column base (collapses nowhere on a phone)',
    test: hasUngatedGrid,
  },
  {
    name: 'vh unit on a height (mobile URL bars make it overshoot; use dvh)',
    test: (line) => /(?:^|[\s"'`])(?:min-h|max-h|h)-\[[^\]]*\d+vh/.test(line),
  },
  {
    name: 'DialogContent with an unprefixed max-w (twMerge drops the mobile gutter)',
    test: dropsDialogGutter,
  },
  {
    name: 'raw <table> with no overflow-x-auto wrapper (page body would scroll sideways)',
    test: (line, lines, idx) =>
      /<table[\s>]/.test(line) &&
      !lines.slice(Math.max(0, idx - 3), idx).some((prev) => /overflow-x-auto/.test(prev)),
  },
];

// Deliberate, reviewed exceptions. Each needs a reason.
const ALLOW = new Set([
  // A wide comparison grid that is intentionally horizontally scrollable, and is
  // already wrapped in `overflow-x-auto` + `min-w-[620px]` with a swipe hint.
  'src/components/marketing/comparison-table.tsx',
  // The Table primitive itself.
  'src/components/ui/table.tsx',
  // Markdown output renders author-supplied tables inside its own scroller.
  'src/components/ui/markdown.tsx',
]);

let failed = false;
const files = getFiles(srcDir, ['.tsx']);

for (const { name, test } of CHECKS) {
  const occurrences = [];
  for (const filePath of files) {
    const relPath = relative(rootDir, filePath).replace(/\\/g, '/');
    if (ALLOW.has(relPath)) continue;
    const lines = readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      if (test(line, lines, idx)) occurrences.push(`${relPath}:${idx + 1}:${line.trim()}`);
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

if (failed) {
  console.error('\nResponsive check failed.');
  process.exit(1);
}
console.log('\nAll responsive checks passed.');
