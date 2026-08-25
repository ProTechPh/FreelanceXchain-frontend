#!/usr/bin/env node
// Guards the SKILL.md "Anti-patterns" list. Fails the build if a prohibited
// pattern reappears, so the drift that produced 465 hardcoded colours cannot
// silently happen again.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FAMILIES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const CHECKS = [
  {
    name: 'Tailwind palette classes (use semantic tokens)',
    pattern: `(bg|text|border|ring|fill|stroke|from|to|via|divide)-(${FAMILIES})-[0-9]{2,3}`,
  },
  {
    name: 'raw hex in a utility class',
    pattern: String.raw`(text|bg|border|from|to|via|ring)-\[#[0-9a-fA-F]{3,8}\]`,
  },
  {
    name: 'arbitrary font size (use the type scale; 2xs is the floor)',
    pattern: String.raw`text-\[[0-9.]+(px|rem)\]`,
  },
  {
    name: 'text-white on a themed surface (use the surface -foreground token)',
    pattern: String.raw`\btext-white\b`,
  },
  {
    name: 'opacity-based disabled state (drops contrast below AA)',
    pattern: String.raw`disabled:opacity-`,
  },
  {
    name: 'second icon library (lucide-react only)',
    pattern: '@phosphor-icons|@radix-ui/react-icons',
  },
];

let failed = false;

for (const { name, pattern } of CHECKS) {
  let hits = '';
  try {
    hits = execSync(
      `grep -rnE ${JSON.stringify(pattern)} src/ --include=*.tsx --include=*.ts || true`,
      { encoding: 'utf8', shell: '/bin/bash' },
    ).trim();
  } catch {
    hits = '';
  }
  if (hits) {
    failed = true;
    const lines = hits.split('\n');
    console.error(`\nFAIL  ${name} — ${lines.length} occurrence(s):`);
    for (const line of lines.slice(0, 10)) console.error(`      ${line.slice(0, 140)}`);
    if (lines.length > 10) console.error(`      … and ${lines.length - 10} more`);
  } else {
    console.log(`PASS  ${name}`);
  }
}

// Every class referenced in components must actually exist somewhere in CSS.
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const CUSTOM = ['gradient-primary', 'gradient-text', 'glow-sm-primary', 'glow-primary', 'animate-element'];
for (const cls of CUSTOM) {
  const used = execSync(
    `grep -rlE "\\b${cls}\\b" src/ --include=*.tsx || true`,
    { encoding: 'utf8', shell: '/bin/bash' },
  ).trim();
  const defined = css.includes(`.${cls} {`);
  if (used && !defined) {
    failed = true;
    console.error(`\nFAIL  .${cls} is used in components but never defined in globals.css`);
  } else {
    console.log(`PASS  .${cls} ${defined ? 'defined' : 'unused and undefined'}`);
  }
}

console.log(`\n${failed ? '=== TOKEN GUARD FAILED ===' : '=== TOKEN GUARD PASSED ==='}`);
process.exit(failed ? 1 : 0);
