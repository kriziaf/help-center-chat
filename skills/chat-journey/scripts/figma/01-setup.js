// 01-setup — pages, color tokens (variables) and reusable chat components.
// Runs in the Figma use_figma tool. `DATA` ({tokens, icons}) is prepended by build-data.mjs.
// Safe to re-run: it clears the UI page and the "Repo tokens" collection first.

const PAGES = ['Frontmatter', 'User Journey lowfi', 'User Journeys - UI'];
const UI_PAGE = 'User Journeys - UI';

// ---- pages (reuse the file's blank default page as the first one)
const named = (n) => figma.root.children.find((p) => p.name.trim() === n);
const first = figma.root.children[0];
if (!PAGES.some(named) && first.children.length === 0) first.name = PAGES[0];
let order = 0;
for (const n of PAGES) {
  if (!named(n)) { const p = figma.createPage(); p.name = n; }
  figma.root.insertChild(order++, named(n));
}
const ui = named(UI_PAGE);
await figma.setCurrentPageAsync(ui);
for (const c of [...ui.children]) c.remove();

const FONT = DATA.tokens.fonts.ui;
await Promise.all(['Regular', 'Medium', 'SemiBold'].map((s) => figma.loadFontAsync({ family: FONT, style: s })));

// ---- tokens
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) if (c.name === DATA.tokens.collection) c.remove();
const col = figma.variables.createVariableCollection(DATA.tokens.collection);
const mode = col.modes[0].modeId;
const TOK = DATA.tokens.colors;
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const V = {};
for (const [n, h] of Object.entries(TOK)) {
  const v = figma.variables.createVariable(n, col, 'COLOR');
  v.scopes = ['ALL_FILLS', 'STROKE_COLOR'];
  v.setValueForMode(mode, hex(h));
  V[n] = v;
}
const P = (n) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: hex(TOK[n]) }, 'color', V[n]);
const T = (s, size, w, cn, lh) => {
  const t = figma.createText(); t.fontName = { family: FONT, style: w }; t.fontSize = size; t.characters = s; t.fills = [P(cn)];
  if (lh) t.lineHeight = { unit: 'PERCENT', value: lh }; return t;
};
const ICON = DATA.icons.icons;
const SVG = (name, size, cn) => {
  const f = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${DATA.icons.viewBox}" fill="${TOK[cn]}"><path d="${ICON[name]}"/></svg>`);
  f.resize(size, size); f.name = 'icon'; return f;
};

// ---- helpers
const comps = {};
const mk = (name) => { const c = figma.createComponent(); c.name = name; comps[name] = c; return c; };
const AL = (c, dir, o = {}) => { c.layoutMode = dir; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; Object.assign(c, o); return c; };
const strokeAll = (n, cn, w) => { n.strokes = [P(cn)]; n.strokeWeight = w; };
const addTextProp = (c, t, label, def) => { const k = c.addComponentProperty(label, 'TEXT', def); t.componentPropertyReferences = { characters: k }; return k; };
const MAXW = DATA.tokens.popup.bubbleMaxWidth;
const bubbleText = (c, t) => { c.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; c.maxWidth = MAXW; };

// ---- Chip
{ const c = mk('Chip'); AL(c, 'HORIZONTAL', { paddingLeft: 12, paddingRight: 12, paddingTop: 7, paddingBottom: 7, cornerRadius: 18, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  c.fills = [P('surface/2')]; strokeAll(c, 'border/strong', 0.5);
  const t = T('Chip label', 12, 'Regular', 'text/primary', 150); t.textAlignHorizontal = 'CENTER'; c.appendChild(t); addTextProp(c, t, 'Label', 'Chip label'); }
// ---- Bubbles
{ const c = mk('Bubble / Bot'); AL(c, 'VERTICAL', { paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, topLeftRadius: 14, topRightRadius: 14, bottomRightRadius: 14, bottomLeftRadius: 4 });
  c.fills = [P('surface/1')]; strokeAll(c, 'border', 0.5);
  const t = T('Message text', 13, 'Regular', 'text/primary', 150); bubbleText(c, t); addTextProp(c, t, 'Text', 'Message text'); }
{ const c = mk('Bubble / User'); AL(c, 'VERTICAL', { paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, topLeftRadius: 14, topRightRadius: 14, bottomRightRadius: 4, bottomLeftRadius: 14 });
  c.fills = [P('fill/primary')];
  const t = T('Message text', 13, 'Regular', 'on-primary', 150); bubbleText(c, t); addTextProp(c, t, 'Text', 'Message text'); }
// ---- Bot avatar
{ const c = mk('Bot Avatar'); c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.resize(24, 24); c.cornerRadius = 12;
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.fills = []; strokeAll(c, 'border/stronger', 1.5); c.dashPattern = [3, 3]; c.appendChild(SVG('sparkle', 12, 'text/muted')); }
// ---- Entry buttons (order and icons as in the app)
for (const [n, ic] of [['Ask MD Live', 'headset'], ['Popular Topics', 'sparkle'], ['Ask about conditions', 'steth']]) {
  const c = mk('Entry Button / ' + n); AL(c, 'HORIZONTAL', { itemSpacing: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 11, paddingBottom: 11, cornerRadius: 8, counterAxisAlignItems: 'CENTER' });
  c.primaryAxisSizingMode = 'FIXED'; c.resize(290, 40); c.counterAxisSizingMode = 'AUTO'; c.fills = [P('surface/1')]; strokeAll(c, 'border', 0.5);
  c.appendChild(SVG(ic, 16, 'text/secondary')); c.appendChild(T(n, 13, 'Medium', 'text/primary', 150));
}
// ---- Toolbar (with / without back)
for (const withBack of [false, true]) {
  const c = mk(withBack ? 'Toolbar / With back' : 'Toolbar'); AL(c, 'HORIZONTAL', { itemSpacing: 12, counterAxisAlignItems: 'CENTER' });
  c.primaryAxisSizingMode = 'FIXED'; c.resize(290, 24); c.counterAxisSizingMode = 'FIXED'; c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.fills = [];
  if (withBack) c.appendChild(SVG('back', 16, 'text/secondary'));
  else { const sp = figma.createFrame(); sp.name = 'spacer'; sp.resize(1, 1); sp.fills = []; c.appendChild(sp); }
  const a = figma.createAutoLayout('HORIZONTAL', { name: 'actions', itemSpacing: 12 }); a.fills = [];
  for (const k of ['pencil', 'history', 'expand', 'close']) a.appendChild(SVG(k, 16, 'text/secondary'));
  c.appendChild(a);
}
// ---- Tabs
for (const active of ['Conversation', 'Articles']) {
  const c = mk('Tabs / ' + active + ' active'); AL(c, 'HORIZONTAL', { itemSpacing: 4 }); c.primaryAxisSizingMode = 'FIXED'; c.resize(290, 34); c.counterAxisSizingMode = 'AUTO';
  c.fills = []; c.strokes = [P('border')]; c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 0.5;
  for (const n of ['Conversation', 'Articles']) {
    const tab = figma.createAutoLayout('HORIZONTAL', { name: 'tab', paddingLeft: 4, paddingRight: 4, paddingTop: 8, paddingBottom: 8 }); tab.fills = [];
    const on = n === active; tab.strokes = [on ? P('fill/primary') : P('border')];
    tab.strokeTopWeight = 0; tab.strokeLeftWeight = 0; tab.strokeRightWeight = 0; tab.strokeBottomWeight = on ? 2 : 0;
    tab.appendChild(T(n, 12, 'Medium', on ? 'text/primary' : 'text/secondary', 150)); c.appendChild(tab);
  }
}
// ---- Composer
{ const c = mk('Composer'); AL(c, 'HORIZONTAL', { itemSpacing: 8, paddingLeft: 14, paddingRight: 4, paddingTop: 4, paddingBottom: 4, cornerRadius: 20, counterAxisAlignItems: 'CENTER' });
  c.primaryAxisSizingMode = 'FIXED'; c.resize(290, 40); c.counterAxisSizingMode = 'AUTO'; c.fills = [P('surface/1')]; strokeAll(c, 'border/strong', 0.5);
  const t = T('Ask a question...', 13, 'Regular', 'text/muted', 150); c.appendChild(t); t.layoutSizingHorizontal = 'FILL';
  const b = figma.createAutoLayout('HORIZONTAL', { name: 'send', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  b.primaryAxisSizingMode = 'FIXED'; b.counterAxisSizingMode = 'FIXED'; b.resize(28, 28); b.cornerRadius = 14; b.fills = [P('fill/primary')]; b.appendChild(SVG('send', 14, 'on-primary')); c.appendChild(b); }
// ---- Greeting
{ const c = mk('Greeting'); AL(c, 'VERTICAL', { itemSpacing: 6, counterAxisAlignItems: 'CENTER' }); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(290, 100); c.primaryAxisSizingMode = 'AUTO'; c.fills = [];
  const logo = figma.createAutoLayout('HORIZONTAL', { name: 'logo', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  logo.primaryAxisSizingMode = 'FIXED'; logo.counterAxisSizingMode = 'FIXED'; logo.resize(40, 40); logo.cornerRadius = 20; logo.fills = []; strokeAll(logo, 'border/stronger', 2); logo.dashPattern = [4, 3];
  logo.appendChild(SVG('sparkle', 18, 'text/muted')); c.appendChild(logo);
  c.appendChild(T('Hi, How Can I Help?', 15, 'Medium', 'text/primary', 150));
  const lg = T('By using this service, you agree to the AI terms.', 11, 'Regular', 'text/muted', 150); lg.textAlignHorizontal = 'CENTER'; c.appendChild(lg); }
// ---- Article card
{ const c = mk('Article Card'); AL(c, 'VERTICAL'); c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED'; c.resize(MAXW, 200); c.primaryAxisSizingMode = 'AUTO';
  c.cornerRadius = 8; c.clipsContent = true; c.fills = [P('surface/2')]; strokeAll(c, 'border/strong', 0.5);
  const bc = figma.createAutoLayout('HORIZONTAL', { name: 'breadcrumb', itemSpacing: 6, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8 });
  bc.fills = []; bc.strokes = [P('border')]; bc.strokeTopWeight = 0; bc.strokeLeftWeight = 0; bc.strokeRightWeight = 0; bc.strokeBottomWeight = 0.5;
  for (const s of ['MDLIVE', '·', 'Articles']) bc.appendChild(T(s, 11, 'Regular', 'text/muted', 150));
  c.appendChild(bc); bc.layoutSizingHorizontal = 'FILL';
  const th = figma.createAutoLayout('HORIZONTAL', { name: 'thumb', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  th.primaryAxisSizingMode = 'FIXED'; th.counterAxisSizingMode = 'FIXED'; th.resize(MAXW, 72); th.fills = [P('surface/1')]; th.appendChild(SVG('file', 24, 'text/muted'));
  c.appendChild(th); th.layoutSizingHorizontal = 'FILL';
  const body = figma.createAutoLayout('VERTICAL', { name: 'body', itemSpacing: 8, paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 12 }); body.fills = [];
  c.appendChild(body); body.layoutSizingHorizontal = 'FILL';
  const ti = T('Article title', 13, 'SemiBold', 'text/primary', 150); body.appendChild(ti); ti.layoutSizingHorizontal = 'FILL'; ti.textAutoResize = 'HEIGHT';
  const de = T('Article description', 12, 'Regular', 'text/secondary', 140); body.appendChild(de); de.layoutSizingHorizontal = 'FILL'; de.textAutoResize = 'HEIGHT';
  const by = figma.createAutoLayout('HORIZONTAL', { name: 'byline', itemSpacing: 6 }); by.fills = [];
  const bylineRead = T('1 min read', 11, 'Regular', 'text/muted', 150);
  for (const s of [T('MDLIVE Care Team', 11, 'Regular', 'text/muted', 150), T('·', 11, 'Regular', 'text/muted', 150), bylineRead]) by.appendChild(s);
  body.appendChild(by);
  const cta = figma.createAutoLayout('HORIZONTAL', { name: 'View article', paddingTop: 10, paddingBottom: 10, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER', cornerRadius: 8 });
  cta.fills = [P('fill/primary')]; cta.appendChild(T('View article', 13, 'Medium', 'on-primary', 150)); body.appendChild(cta); cta.layoutSizingHorizontal = 'FILL';
  const kt = c.addComponentProperty('Title', 'TEXT', 'Article title'); ti.componentPropertyReferences = { characters: kt };
  const kd = c.addComponentProperty('Description', 'TEXT', 'Article description'); de.componentPropertyReferences = { characters: kd };
  const kr = c.addComponentProperty('Read time', 'TEXT', '1 min read'); bylineRead.componentPropertyReferences = { characters: kr }; }

// ---- holder frame
const holder = figma.createAutoLayout('HORIZONTAL', { name: 'Components', itemSpacing: 24, paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24 });
holder.fills = [P('surface/2')]; ui.appendChild(holder);
holder.layoutWrap = 'WRAP'; holder.resize(1400, 100); holder.layoutSizingHorizontal = 'FIXED'; holder.counterAxisSpacing = 24; holder.x = 0; holder.y = -700;
for (const c of Object.values(comps)) holder.appendChild(c);

return { pages: figma.root.children.map((p) => p.name), holder: holder.id, components: Object.keys(comps).length, variables: Object.keys(V).length };
