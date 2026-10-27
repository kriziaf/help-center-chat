// 03-lowfi — builds the "User Journey lowfi" page: the flow with no screens, v1 schematic look,
// same steps / order / column positions as the UI page. Independent of 01 and 02 except that the
// page must exist (01-setup.js creates it). `DATA` ({tokens, journeys}) is prepended by build-data.mjs.

let page = figma.root.children.find((p) => p.name.trim() === 'User Journey lowfi');
if (!page) { page = figma.createPage(); page.name = 'User Journey lowfi'; }
await figma.setCurrentPageAsync(page);
for (const c of [...page.children]) c.remove();
const FONT = DATA.tokens.fonts.lowfi;
await Promise.all(['Regular', 'Bold', 'Italic'].map((s) => figma.loadFontAsync({ family: FONT, style: s })));

const S = (r, g, b) => [{ type: 'SOLID', color: { r, g, b } }];
const T = (s, size, style, col) => { const t = figma.createText(); t.fontName = { family: FONT, style }; t.fontSize = size; t.characters = s; t.fills = S(...col); return t; };
const INK = [0.102, 0.102, 0.102];
const wrapText = (t) => { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; };

const bubble = (text, user) => {
  const row = figma.createAutoLayout('HORIZONTAL', { name: 'bubbleRow' }); row.fills = [];
  const b = figma.createAutoLayout('VERTICAL', { name: user ? 'user bubble' : 'bubble', paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, cornerRadius: 12 });
  b.fills = user ? S(0.11, 0.11, 0.11) : S(0.93, 0.93, 0.93);
  const t = T(text, 11, 'Regular', user ? [1, 1, 1] : [0.12, 0.12, 0.12]); b.appendChild(t); wrapText(t); b.maxWidth = 234;
  row.appendChild(b); return row;
};
const chips = (labels) => {
  const r = figma.createAutoLayout('HORIZONTAL', { name: 'chips', itemSpacing: 6 }); r.layoutWrap = 'WRAP'; r.counterAxisSpacing = 6; r.fills = [];
  r.resize(250, 10); r.primaryAxisSizingMode = 'FIXED'; r.counterAxisSizingMode = 'AUTO';
  for (const l of labels) {
    const c = figma.createAutoLayout('HORIZONTAL', { name: 'chip', paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5, cornerRadius: 999 });
    c.fills = S(1, 1, 1); c.strokes = S(0.6, 0.72, 0.98); c.strokeWeight = 1; c.appendChild(T(l, 9.5, 'Regular', [0.15, 0.3, 0.75])); r.appendChild(c);
  }
  return r;
};
const note = (s, kind) => {
  const t = T(s, kind === 'end' ? 9.5 : 9, 'Italic', kind === 'end' ? [0.6, 0.25, 0.25] : (s.startsWith('↺') ? [0.35, 0.35, 0.35] : [0.4, 0.4, 0.4]));
  t.name = kind === 'end' ? 'End marker' : 'Flow note'; return t;
};
const node = (title, items) => {
  const f = figma.createAutoLayout('VERTICAL', { name: title, itemSpacing: 8, paddingLeft: 14, paddingRight: 14, paddingTop: 14, paddingBottom: 14 });
  f.cornerRadius = 14; f.fills = S(1, 1, 1); f.strokes = S(0.85, 0.85, 0.85); f.strokeWeight = 1;
  f.resize(280, 100); f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED';
  const ti = T(title, 12, 'Bold', INK); ti.name = 'Step title'; f.appendChild(ti); wrapText(ti);
  for (const [k, v] of items) {
    let n;
    if (k === 'user') n = bubble(v, true); else if (k === 'bot') n = bubble(v, false); else if (k === 'chips') n = chips(v); else n = note(v, k);
    f.appendChild(n);
    if (k === 'user') { n.layoutSizingHorizontal = 'FILL'; n.primaryAxisAlignItems = 'MAX'; }
    else if (k === 'chips' || k === 'bot') n.layoutSizingHorizontal = 'FILL';
    else { n.layoutSizingHorizontal = 'FILL'; n.textAutoResize = 'HEIGHT'; }
  }
  return f;
};
const bar = (w, h, x, y, sec) => { const r = figma.createRectangle(); r.name = 'connector'; r.resize(w, h); r.fills = S(0.55, 0.55, 0.55); sec.appendChild(r); r.x = x; r.y = y; return r; };

// Same grid as the UI page: 320 px columns, 140 px gaps; nodes (280 px) centered in their column.
const PADX = 60, COLW = DATA.tokens.popup.width, GAPX = 140, NODEW = 280, OFF = (COLW - NODEW) / 2, TOP = 120;
let secY = 0; const report = [];
for (const j of DATA.journeys.journeys) {
  const sec = figma.createSection(); sec.name = j.name + ' — lowfi'; sec.fills = S(...j.bg); page.appendChild(sec);
  const h = T(j.name + ' (low-fi flow)', 20, 'Bold', INK); sec.appendChild(h); h.x = PADX; h.y = 40;
  const sb = T(j.sub + '  ·  Mirrors “User Journeys - UI” step for step, same order and column alignment.', 11, 'Regular', [0.3, 0.3, 0.3]); sec.appendChild(sb); sb.x = PADX; sb.y = 76;
  const xs = []; let maxH = 0;
  j.steps.forEach((s, i) => {
    const x = PADX + i * (COLW + GAPX) + OFF; xs.push(x);
    const f = node(s.title, s.low); sec.appendChild(f); f.x = x; f.y = TOP + 30; maxH = Math.max(maxH, f.height);
    if (s.tap) {
      const cx = x - OFF - GAPX;
      bar(GAPX - 30, 2, cx + 15, TOP + 30 + 60, sec);
      const tl = T(`tap “${s.tap}”`, 9, 'Italic', [0.3, 0.3, 0.3]); tl.textAlignHorizontal = 'CENTER'; sec.appendChild(tl);
      tl.resize(GAPX - 20, 10); tl.textAutoResize = 'HEIGHT'; tl.x = cx + 10; tl.y = TOP + 30 + 60 - tl.height - 4;
    }
  });
  let totalH = TOP + 30 + maxH + 60;
  if (j.branches.length) {
    const y2 = TOP + 30 + maxH + 90; let max2 = 0;
    for (const b of j.branches) {
      const f = node(b.title, b.low); sec.appendChild(f); f.x = xs[b.col]; f.y = y2; max2 = Math.max(max2, f.height);
      bar(2, y2 - (TOP + 30 + maxH), xs[b.col] + NODEW / 2, TOP + 30 + maxH, sec);
    }
    totalH = y2 + max2 + 60;
  }
  sec.resizeWithoutConstraints(PADX * 2 + j.steps.length * COLW + (j.steps.length - 1) * GAPX, totalH);
  sec.x = 0; sec.y = secY; secY += totalH + 100;
  report.push({ id: sec.id, name: sec.name, w: sec.width, h: Math.round(sec.height), nodes: sec.children.filter((c) => c.type === 'FRAME').map((c) => c.name + '@x' + Math.round(c.x)) });
}
return report;
