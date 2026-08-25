// WCAG 2.2 contrast checker for the FreelanceXchain token set.
const hex = (h) => {
  h = h.replace('#','').trim();
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  return [0,2,4].map(i => parseInt(h.slice(i,i+2),16));
};
const lum = (h) => {
  const [r,g,b] = hex(h).map(v => {
    const s = v/255;
    return s <= 0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  });
  return 0.2126*r + 0.7152*g + 0.0722*b;
};
export const ratio = (a,b) => {
  const [l1,l2] = [lum(a), lum(b)].sort((x,y)=>y-x);
  return (l1+0.05)/(l2+0.05);
};
// Composite a translucent fg over a solid bg -> resulting solid hex
export const over = (fg, bg, alpha) => {
  const f = hex(fg), b = hex(bg);
  const c = f.map((v,i) => Math.round(v*alpha + b[i]*(1-alpha)));
  return '#' + c.map(v=>v.toString(16).padStart(2,'0')).join('');
};
export const check = (label, fg, bg, min=4.5) => {
  const r = ratio(fg,bg);
  const ok = r >= min;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}  ${fg} on ${bg}`);
  return ok;
};
