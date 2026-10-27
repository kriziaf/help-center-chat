// 02-ui — builds the "User Journeys - UI" page: one section per journey, one popup per step,
// arrows with "tap …" labels, branch screens in a second row. Needs 01-setup.js to have run.
// `DATA` ({tokens, journeys}) is prepended by build-data.mjs. Safe to re-run (clears sections).

const ui = figma.root.children.find((p) => p.name.trim() === 'User Journeys - UI');
await figma.setCurrentPageAsync(ui);
const FONT = DATA.tokens.fonts.ui;
await Promise.all(['Regular', 'Medium', 'SemiBold'].map((s) => figma.loadFontAsync({ family: FONT, style: s })));
for (const n of ui.children.filter((c) => c.type === 'SECTION')) n.remove();

// ---- tokens + components (looked up by name, so this script is stateless)
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === DATA.tokens.collection);
const V = {}; for (const id of col.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); V[v.name] = v; }
const TOK = DATA.tokens.colors;
const hx = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const P = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: hx(TOK[n]) }, 'color', V[n]);
const T = (s, size, w, cn, lh) => { const t = figma.createText(); t.fontName = { family: FONT, style: w }; t.fontSize = size; t.characters = s; t.fills = [P(cn)]; if (lh) t.lineHeight = { unit: 'PERCENT', value: lh }; return t; };
const holder = ui.children.find((c) => c.name === 'Components');
const C = {}; for (const c of holder.children) if (c.type === 'COMPONENT') C[c.name] = c;
const key = (c, pre) => { const d = c.componentPropertyDefinitions; return Object.keys(d).find((k) => d[k].type === 'TEXT' && (!pre || k.startsWith(pre))); };
const K = { chip: key(C['Chip']), bot: key(C['Bubble / Bot']), user: key(C['Bubble / User']), title: key(C['Article Card'], 'Title'), desc: key(C['Article Card'], 'Description'), read: key(C['Article Card'], 'Read') };
const inst = (n) => C[n].createInstance();
const gap = (h) => { const g = figma.createFrame(); g.name = 'gap'; g.resize(10, h); g.fills = []; return g; };
const POP = DATA.tokens.popup;

// ---- pieces
const chipRow = (labels) => {
  const r = figma.createAutoLayout('HORIZONTAL', { name: 'chip-row', itemSpacing: 6 }); r.layoutWrap = 'WRAP'; r.counterAxisSpacing = 6; r.fills = [];
  r.resize(POP.chipRowWidth, 10); r.primaryAxisSizingMode = 'FIXED'; r.counterAxisSizingMode = 'AUTO';
  for (const l of labels) {
    const c = inst('Chip'); r.appendChild(c); c.setProperties({ [K.chip]: l });
    if (c.width > POP.chipRowWidth) { // long label: own full-width row, text wraps
      c.layoutSizingHorizontal = 'FIXED'; c.resize(POP.chipRowWidth, c.height);
      const t = c.findOne((n) => n.type === 'TEXT'); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
    }
  }
  return r;
};
const userMsg = (text) => { const r = figma.createAutoLayout('HORIZONTAL', { name: 'msg-row user' }); r.fills = []; const b = inst('Bubble / User'); r.appendChild(b); b.setProperties({ [K.user]: text }); return r; };
const botRow = () => {
  const r = figma.createAutoLayout('HORIZONTAL', { name: 'msg-row bot', itemSpacing: 8 }); r.fills = []; r.counterAxisAlignItems = 'MIN'; r.appendChild(inst('Bot Avatar'));
  const ct = figma.createAutoLayout('VERTICAL', { name: 'msg-content', itemSpacing: 8 }); ct.fills = []; r.appendChild(ct);
  return { row: r, content: ct };
};
const thread = (items) => {
  const t = figma.createAutoLayout('VERTICAL', { name: 'thread', itemSpacing: 10 }); t.fills = [];
  let lastBot = null;
  for (const [kind, v] of items) {
    if (kind === 'user') { const m = userMsg(v); t.appendChild(m); m.layoutSizingHorizontal = 'FILL'; m.primaryAxisAlignItems = 'MAX'; lastBot = null; }
    else if (kind === 'bot') { const b = botRow(); const bb = inst('Bubble / Bot'); b.content.appendChild(bb); bb.setProperties({ [K.bot]: v }); t.appendChild(b.row); lastBot = b; }
    else if (kind === 'card') { const b = botRow(); const cd = inst('Article Card'); b.content.appendChild(cd); cd.setProperties({ [K.title]: v.title, [K.desc]: v.desc, [K.read]: `${v.readMin} min read` }); t.appendChild(b.row); lastBot = b; }
    else if (kind === 'chips') { if (!lastBot) throw new Error('chips must follow a bot item'); lastBot.content.appendChild(chipRow(v)); }
  }
  return t;
};
const viewer = (v) => {
  const w = figma.createAutoLayout('VERTICAL', { name: 'viewer', itemSpacing: 10 }); w.fills = [];
  const bl = figma.createAutoLayout('HORIZONTAL', { name: 'back-link', itemSpacing: 6, counterAxisAlignItems: 'CENTER' }); bl.fills = [];
  bl.appendChild(T('←', 12, 'Regular', 'text/secondary')); bl.appendChild(T('All articles', 12, 'Regular', 'text/secondary', 150)); w.appendChild(bl);
  const h = T(v.title, 16, 'Medium', 'text/primary', 150); w.appendChild(h); h.layoutSizingHorizontal = 'FILL'; h.textAutoResize = 'HEIGHT';
  for (const s of v.lines) { const t = T(s, 13, 'Regular', 'text/primary', 160); w.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; }
  return w;
};
const popup = (name, parts) => {
  const f = figma.createAutoLayout('VERTICAL', { name, paddingLeft: POP.padding, paddingRight: POP.padding, paddingTop: POP.padding, paddingBottom: POP.padding });
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; f.resize(POP.width, 100); f.primaryAxisSizingMode = 'AUTO';
  f.cornerRadius = POP.radius; f.fills = [P('surface/2')]; f.strokes = [P('border/strong')]; f.strokeWeight = 0.5; f.clipsContent = true;
  f.effects = [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' },
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 2 }, radius: 6, spread: 0, visible: true, blendMode: 'NORMAL' }];
  for (const p of parts) { f.appendChild(p); if (p.name === 'thread' || p.name === 'viewer') p.layoutSizingHorizontal = 'FILL'; }
  return f;
};
const screen = (s, back) => {
  let body;
  if (s.entry) { const m = figma.createAutoLayout('VERTICAL', { name: 'entry-menu', itemSpacing: 6 }); m.fills = [];
    for (const n of ['Ask MD Live', 'Popular Topics', 'Ask about conditions']) m.appendChild(inst('Entry Button / ' + n));
    body = [inst('Greeting'), gap(18), m]; }
  else { const viewerItem = s.ui.find((i) => i[0] === 'viewer'); body = [viewerItem ? viewer(viewerItem[1]) : thread(s.ui)]; }
  const parts = [inst(back ? 'Toolbar / With back' : 'Toolbar'), gap(8), inst('Tabs / ' + s.tab + ' active'), gap(12), ...body];
  if (s.composer) { parts.push(gap(14)); parts.push(inst('Composer')); }
  return popup(s.title, parts);
};
const ARROW = (w) => { const f = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="12" viewBox="0 0 ${w} 12" fill="none"><path d="M0 6H${w - 6}" stroke="#9a9a9a" stroke-width="2"/><path d="M${w - 12} 1L${w - 4} 6L${w - 12} 11" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`); f.name = 'arrow'; return f; };

// ---- layout
const GAPX = 140, PADX = 60, TOP = 120, W = POP.width;
let secY = 0; const report = [];
for (const j of DATA.journeys.journeys) {
  const sec = figma.createSection(); sec.name = j.name; sec.fills = [{ type: 'SOLID', color: { r: j.bg[0], g: j.bg[1], b: j.bg[2] } }]; ui.appendChild(sec);
  const h = T(j.name, 22, 'SemiBold', 'text/primary'); sec.appendChild(h); h.x = PADX; h.y = 40;
  const sb = T(j.sub + '  ·  Rebuilt from src/styles/helpcenter.css + App.tsx. Each screen shows the last turn of the chat thread.', 12, 'Regular', 'text/secondary'); sec.appendChild(sb); sb.x = PADX; sb.y = 76;
  let x = PADX, maxH = 0; const xs = [];
  j.steps.forEach((s, i) => {
    const f = screen(s, i > 0); sec.appendChild(f); f.x = x; f.y = TOP + 30; xs.push(x);
    const lb = T(s.title, 12, 'SemiBold', 'text/primary'); sec.appendChild(lb); lb.x = x; lb.y = TOP + 6;
    if (s.tap) {
      const a = ARROW(GAPX - 24); sec.appendChild(a); a.x = x - GAPX + 12; a.y = TOP + 30 + 120;
      const tl = T(`tap “${s.tap}”`, 10, 'Regular', 'text/secondary', 140); tl.textAlignHorizontal = 'CENTER'; sec.appendChild(tl);
      tl.resize(GAPX - 20, 10); tl.textAutoResize = 'HEIGHT'; tl.x = x - GAPX + 10; tl.y = a.y - tl.height - 4;
    }
    maxH = Math.max(maxH, f.height); x += W + GAPX;
  });
  let totalH = TOP + 30 + maxH + 60;
  if (j.branches.length) {
    const y2 = TOP + 30 + maxH + 110; let max2 = 0;
    for (const b of j.branches) {
      const f = screen(b, true); sec.appendChild(f); f.x = xs[b.col]; f.y = y2 + 30;
      const lb = T(b.uiLabel || b.title, 12, 'SemiBold', 'text/primary'); sec.appendChild(lb); lb.resize(W, 10); lb.textAutoResize = 'HEIGHT'; lb.x = f.x; lb.y = f.y - lb.height - 8;
      max2 = Math.max(max2, f.height);
    }
    totalH = y2 + 30 + max2 + 60;
  }
  sec.resizeWithoutConstraints(PADX * 2 + j.steps.length * W + (j.steps.length - 1) * GAPX, totalH);
  sec.x = 0; sec.y = secY; secY += totalH + 100;
  report.push({ id: sec.id, name: j.name, w: sec.width, h: Math.round(sec.height), screens: sec.children.filter((c) => c.type === 'FRAME').map((c) => `${c.name} ${Math.round(c.height)}`) });
}
return report;
