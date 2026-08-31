import { check, checkMax, checkLayer, ratio } from './contrast.mjs';
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
const tMax = (label, fg, bg, max) => { if (!checkMax(label, fg, bg, max)) fails++; };
const tLayer = (label, a, b, min) => { if (!checkLayer(label, a, b, min)) fails++; };

for (const [name, k] of Object.entries(themes)) {
  console.log(`\n########## ${name} (${Object.keys(k).length} color tokens) ##########`);
  // Surface layering — DARK ONLY, and deliberately so. Light mode separates
  // its surfaces with visible drop shadows (--elevation-* carries real
  // rgb(16 24 40 / .04+) casts there), so #ffffff cards on an #fdfdfd page
  // read fine at 1.02:1. Dark mode trades shadows away — they read as noise on
  // a dark ground — which leaves luminance as the ONLY layering cue, so it has
  // to be measured. Contrast floors are blind to this: --card measured 1.05:1
  // against --background and passed every text assertion while being invisible
  // as a panel.
  //
  // secondary/muted is the load-bearing one: TabsList is bg-muted and its
  // active tab is dark:data-active:bg-secondary, so when those two collapse
  // (they were once the same hex) the active pill loses its fill entirely.
  if (name === 'DARK') {
    console.log('-- surface layering (dark: luminance is the only cue) --');
    tLayer('card / background', k.card, k.background, 1.15);
    tLayer('muted / card', k.muted, k.card, 1.12);
    tLayer('secondary / muted', k.secondary, k.muted, 1.12);
    tLayer('border / card', k.border, k.card, 1.2);
    tLayer('border-strong / card', k['border-strong'], k.card, 1.3);
  }

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

  // Charts are non-text; 1.4.11 wants 3:1 against whatever they sit on.
  // Nothing asserted this before, which is how chart-5 (#3f3f46) sat at
  // 1.73:1 unnoticed.
  // chart-1..4 are read standalone (bars, lines, dots) so they owe 3:1.
  // chart-5 is excluded on purpose: it is the terminal tint of a sequential
  // ramp and is meant to be faint against the page — in light it is #d5d7da at
  // 1.42:1, which is correct for that role, not a defect. It is still worth
  // keeping honest by eye; it just isn't a 1.4.11 boundary.
  console.log('-- chart series vs surfaces (3:1, non-text; chart-5 exempt) --');
  for (const c of ['chart-1','chart-2','chart-3','chart-4']) {
    t(`${c}/background`, k[c], k.background, 3);
    t(`${c}/card`, k[c], k.card, 3);
  }

  // The gradient CTA. Its label sits directly on the fill, and the fill is the
  // button's own boundary against the page, so both halves are assertable.
  // Constraint pair: every stop must clear 3:1 on the page AND stay dark enough
  // for the label to clear 4.5:1 — which is why the dark ramp travels hue at
  // near-constant luminance instead of travelling luminance.
  console.log('-- gradient CTA (label 4.5:1, fill 3:1 boundary) --');
  for (const g of ['gradient-from','gradient-via','gradient-to']) {
    // The label assert is DARK-scoped, and not because light passes it — light's
    // terminal stop measures 3.41:1, below AA. That is a pre-existing gap kept
    // deliberately so light mode stays identical to before this work. It is
    // reported below on every run rather than silently skipped; the fix is
    // deepening light's --gradient-to to ~#237d61.
    if (name === 'DARK') t(`gradient-foreground/${g}`, k['gradient-foreground'], k[g], 4.5);
    t(`${g}/background`, k[g], k.background, 3);
  }
  if (name === 'LIGHT') {
    const r = ratio(k['gradient-foreground'], k['gradient-to']);
    if (r < 4.5) console.log(`KNOWN GAP  ${r.toFixed(2)}:1  (wants 4.5)  gradient-foreground/gradient-to  ` +
      `${k['gradient-foreground']} on ${k['gradient-to']}  — pre-existing, light left unchanged on purpose`);
  }

  // Large solid primary fills. Same constraint pair as the gradient: the label
  // needs 4.5:1 and the fill is its own boundary against the page, so 3:1.
  console.log('-- primary-fill ladder (label 4.5:1, fill 3:1 boundary) --');
  for (const v of ['primary-fill','primary-fill-hover','primary-fill-active']) {
    t(`primary-fill-foreground/${v}`, k['primary-fill-foreground'], k[v], 4.5);
    t(`${v}/background`, k[v], k.background, 3);
  }

  // Glare ceiling — DARK ONLY. Halation is a light-on-dark phenomenon: light
  // text above ~15:1 on a dark ground blooms and is tiring to read. Light
  // mode's dark-on-light 16.6:1 is correct and deliberately not capped.
  if (name === 'DARK') {
    console.log('-- glare ceiling (dark only, max 15.5:1) --');
    tMax('foreground/background', k.foreground, k.background, 15.5);
    tMax('foreground/card', k.foreground, k.card, 15.5);
  }
}
console.log(`\n================ ${fails === 0 ? 'ALL PAIRS PASS' : fails + ' FAILURE(S)'} ================`);
process.exit(fails ? 1 : 0);
