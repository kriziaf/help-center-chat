// 04-frontmatter — builds the "Frontmatter" page: explainer cards (accent rule, heading, body,
// callout, supporting points). `DATA` ({tokens, frontmatter}) is prepended by build-data.mjs.
// Safe to re-run (clears the page).

let page = figma.root.children.find((p) => p.name.trim() === 'Frontmatter');
if (!page) { page = figma.createPage(); page.name = 'Frontmatter'; figma.root.insertChild(0, page); }
await figma.setCurrentPageAsync(page);
for (const c of [...page.children]) c.remove();
const FONT = DATA.tokens.fonts.frontmatter;
await Promise.all(['Regular', 'Medium', 'SemiBold'].map((s) => figma.loadFontAsync({ family: FONT, style: s })));

const F = DATA.tokens.frontmatter;
const hx = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const S = (h) => [{ type: 'SOLID', color: hx(h) }];
const T = (s, size, style, col, lh) => { const t = figma.createText(); t.fontName = { family: FONT, style }; t.fontSize = size; t.characters = s; t.fills = S(col); if (lh) t.lineHeight = { unit: 'PERCENT', value: lh }; return t; };
const fillW = (t) => { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; };

const card = (c) => {
  const f = figma.createAutoLayout('VERTICAL', { name: c.name, itemSpacing: 28, paddingLeft: 40, paddingRight: 40, paddingTop: 40, paddingBottom: 40 });
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; f.resize(800, 100); f.primaryAxisSizingMode = 'AUTO';
  f.cornerRadius = 12; f.fills = S(F.card); f.strokes = S(F.cardStroke); f.strokeWeight = 1;
  const h = figma.createAutoLayout('VERTICAL', { name: 'Heading', itemSpacing: 20 }); h.fills = [];
  const r = figma.createRectangle(); r.name = 'Accent rule'; r.resize(40, 4); r.cornerRadius = 2; r.fills = S(F.accent); h.appendChild(r);
  const ht = T(c.heading, 32, 'SemiBold', F.ink, 120); ht.name = 'Feature heading'; h.appendChild(ht); fillW(ht);
  f.appendChild(h); h.layoutSizingHorizontal = 'FILL';
  for (const [kind, a, b] of c.blocks) {
    if (kind === 'p') { const t = T(a, 24, 'Regular', F.body, 150); t.name = 'Explanation'; f.appendChild(t); fillW(t); }
    else if (kind === 'callout') {
      const k = figma.createAutoLayout('VERTICAL', { name: 'Example sequence', itemSpacing: 12, paddingLeft: 20, paddingRight: 20, paddingTop: 20, paddingBottom: 20, cornerRadius: 8 }); k.fills = S(F.callout);
      const l = T(a, 21, 'SemiBold', F.accent); l.name = 'Example label'; k.appendChild(l); fillW(l);
      const q = T(b, 24, 'Medium', F.ink, 160); q.name = 'Topic sequence'; k.appendChild(q); fillW(q);
      f.appendChild(k); k.layoutSizingHorizontal = 'FILL';
    } else if (kind === 'point') {
      const p = figma.createAutoLayout('VERTICAL', { name: 'Supporting point', itemSpacing: 12 }); p.fills = [];
      const ph = T(a, 24, 'SemiBold', F.ink, 130); ph.name = 'Point heading'; p.appendChild(ph); fillW(ph);
      const pe = T(b, 24, 'Regular', F.body, 150); pe.name = 'Explanation'; p.appendChild(pe); fillW(pe);
      f.appendChild(p); p.layoutSizingHorizontal = 'FILL';
    }
  }
  return f;
};

const sec = figma.createSection(); sec.name = DATA.frontmatter.section; sec.fills = S(F.section); sec.strokes = S('#ffffff'); page.appendChild(sec);
const X0 = 130, Y0 = 157, COLX = [1102, 1960], GAP = 95;
let y = Y0;
for (const c of DATA.frontmatter.left) { const f = card(c); sec.appendChild(f); f.x = X0; f.y = y; y += f.height + GAP; }
const leftBottom = y - GAP;
const grid = DATA.frontmatter.grid.map(card);
const maxH = Math.max(...grid.map((g) => g.height));
grid.forEach((g, i) => { sec.appendChild(g); g.primaryAxisSizingMode = 'FIXED'; g.resize(800, maxH); g.x = COLX[i % 2]; g.y = Y0 + Math.floor(i / 2) * (maxH + GAP); });
const rows = Math.ceil(grid.length / 2);
const bottom = Math.max(leftBottom, Y0 + rows * maxH + (rows - 1) * GAP);
sec.resizeWithoutConstraints(2964, bottom + 157);
return { section: sec.id, leftCards: DATA.frontmatter.left.length, gridCards: grid.length, cardH: Math.round(maxH), sectionH: Math.round(sec.height) };
