import { check } from './contrast.mjs';
import { readFileSync } from 'node:fs';

// Parse the real token blocks straight out of globals.css so this can't drift.
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url),'utf8');
const block = (sel) => {
  const i = css.indexOf(sel + ' {');
  const body = css.slice(i, css.indexOf('\n}', i));
  const out = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2];
  return out;
};
const themes = { LIGHT: block(':root'), DARK: block('.dark') };
let fails = 0;
const t = (label, fg, bg, min) => { if (!check(label, fg, bg, min)) fails++; };

for (const [name, k] of Object.entries(themes)) {
  console.log(`\n########## ${name} (${Object.keys(k).length} color tokens) ##########`);
  console.log('-- body text (4.5:1) --');
  t('foreground/background', k.foreground, k.background);
  t('foreground/card', k.foreground, k.card);
  t('foreground-subtle/card', k['foreground-subtle'], k.card);
  t('muted-foreground/background', k['muted-foreground'], k.background);
  t('muted-foreground/card', k['muted-foreground'], k.card);
  t('muted-foreground/muted', k['muted-foreground'], k.muted);
  t('secondary-foreground/secondary', k['secondary-foreground'], k.secondary);
  t('popover-foreground/popover', k['popover-foreground'], k.popover);
  t('accent-foreground/accent', k['accent-foreground'], k.accent);
  t('sidebar-foreground/sidebar', k['sidebar-foreground'], k.sidebar);
  t('sidebar-accent-fg/sidebar-accent', k['sidebar-accent-foreground'], k['sidebar-accent']);
  t('sidebar-primary/sidebar', k['sidebar-primary'], k.sidebar);

  console.log('-- primary (4.5:1) --');
  t('primary-foreground/primary', k['primary-foreground'], k.primary);
  t('primary-foreground/primary-hover', k['primary-foreground'], k['primary-hover']);
  t('primary-foreground/primary-active', k['primary-foreground'], k['primary-active']);
  t('primary text/background', k.primary, k.background);
  t('primary text/card', k.primary, k.card);
  t('primary text/primary-subtle', k.primary, k['primary-subtle']);

  console.log('-- status: solid fill (4.5:1) --');
  for (const s of ['success','warning','info','destructive','neutral'])
    t(`${s}-foreground/${s}`, k[`${s}-foreground`], k[s]);
  console.log('-- status: text on card + background (4.5:1) --');
  for (const s of ['success','warning','info','destructive','neutral']) {
    t(`${s}/card`, k[s], k.card);
    t(`${s}/background`, k[s], k.background);
  }
  console.log('-- status: text on subtle fill (4.5:1) --');
  for (const s of ['success','warning','info','destructive','neutral'])
    t(`${s}/${s}-subtle`, k[s], k[`${s}-subtle`]);

  console.log('-- UI component boundaries (3:1, WCAG 1.4.11) --');
  t('input border/background', k.input, k.background, 3);
  t('input border/card', k.input, k.card, 3);
  t('ring/background', k.ring, k.background, 3);
  t('ring/card', k.ring, k.card, 3);
  for (const s of ['success','warning','info','destructive','neutral'])
    t(`${s}-border/${s}-subtle`, k[`${s}-border`], k[`${s}-subtle`], 1.2);
}
console.log(`\n================ ${fails === 0 ? 'ALL PAIRS PASS' : fails + ' FAILURE(S)'} ================`);
process.exit(fails ? 1 : 0);
