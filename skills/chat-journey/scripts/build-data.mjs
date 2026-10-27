#!/usr/bin/env node
/**
 * Builds everything the chat-journey skill needs to create the Figma file, straight from this
 * repo. No Figma access needed. Run from anywhere:
 *
 *   node skills/chat-journey/scripts/build-data.mjs
 *
 * Reads:   src/config/smartFlow.ts, src/config/conditionsFlow.ts, public/**\/*.md,
 *          public/KB_SCHEMA.json, assets/*.json
 * Writes:  skills/chat-journey/build/journeys.json
 *          skills/chat-journey/build/frontmatter.json
 *          skills/chat-journey/build/stats.json
 *          skills/chat-journey/build/figma/01-setup.js ... 04-frontmatter.js
 *          (ready to paste into the Figma use_figma tool; data already inlined)
 *
 * Needs `npm ci` first (uses the esbuild that ships with vite).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const skill = path.resolve(here, '..');
const root = path.resolve(skill, '..', '..');
const out = path.join(skill, 'build');
const read = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));

// ---- load the TS configs by bundling them with esbuild -----------------------------------
let esbuild;
try {
  esbuild = createRequire(path.join(root, 'package.json'))('esbuild');
} catch {
  console.error('esbuild not found. Run `npm ci` in the repo root first.');
  process.exit(1);
}
async function loadTs(rel) {
  const r = await esbuild.build({
    entryPoints: [path.join(root, rel)],
    bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
  });
  const code = r.outputFiles[0].text;
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const { SMART_FLOW } = await loadTs('src/config/smartFlow.ts');
const { CONDITION_NODES, CONDITIONS } = await loadTs('src/config/conditionsFlow.ts');
const NODES = { ...SMART_FLOW, ...CONDITION_NODES };

// ---- knowledge base ---------------------------------------------------------------------
const schema = json(path.join(root, 'public', 'KB_SCHEMA.json'));
const catName = Object.fromEntries(schema.categories.map((c) => [c.id, c.name]));

function parseArticle(rel) {
  const file = path.join(root, 'public', rel);
  if (!fs.existsSync(file)) throw new Error(`Article not found: public/${rel}`);
  const raw = read(file);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = {};
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  const body = m ? m[2] : raw;
  const clean = body.replace(/^#.+$/gm, '').replace(/\s+/g, ' ').trim(); // same as App.tsx excerpt()
  return {
    title: fm.title || path.basename(rel, '.md'),
    desc: clean.length > 100 ? clean.slice(0, 100).trim() + '…' : clean,
    readMin: Math.max(1, Math.round(body.trim().split(/\s+/).filter(Boolean).length / 200)),
    lines: body.split('\n').map((l) => l.trim()).filter(Boolean),
  };
}
function articleTitles(category) {
  const dir = path.join(root, 'public', category);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
    .map((f) => parseArticle(`${category}/${f}`).title);
}
let qaHeadings = 0, articleCount = 0;
for (const c of schema.categories) {
  for (const f of fs.readdirSync(path.join(root, 'public', c.id)).filter((x) => x.endsWith('.md'))) {
    articleCount++;
    qaHeadings += (read(path.join(root, 'public', c.id, f)).match(/^## /gm) || []).length;
  }
}
const leafSnippets = Object.values(CONDITION_NODES).filter((n) => (n.chips || []).some((c) => c.key === 'blog')).length;
const stats = {
  articles: articleCount,
  categories: schema.categories.length,
  qaHeadings,
  schemaQA: schema.stats.totalQAPairs,
  tags: schema.stats.totalUniqueTags,
  conditions: CONDITIONS.length,
  snippets: leafSnippets,
};

// ---- resolve the journey template -------------------------------------------------------
const tpl = json(path.join(skill, 'assets', 'journeys.template.json'));
const article = Object.fromEntries(Object.entries(tpl.articles).map(([k, rel]) => [k, parseArticle(rel)]));
const ctx = { cat: catName, article, stats, j: {} };
for (const j of tpl.journeys) ctx.j[j.id] = { screens: j.steps.length, branches: (j.branches || []).length };

const lookup = (p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), ctx);
const mustache = (s) => s.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => {
  const v = lookup(p);
  if (v === undefined) throw new Error(`Unresolved {{${p}}}`);
  return String(v);
});
const node = (id) => {
  const n = NODES[id];
  if (!n) throw new Error(`Unknown flow node "${id}" (not in smartFlow.ts or conditionsFlow.ts)`);
  return n;
};
function chips(spec) {
  if (Array.isArray(spec)) return spec.map(mustache);
  if (spec.$articleTitles) return articleTitles(spec.$articleTitles);
  if (spec.$conditions) {
    const all = CONDITIONS.map((c) => c.label);
    if (!spec.pick) return all;
    return [...spec.pick, spec.more.replace('{n}', all.length - spec.pick.length)];
  }
  if (spec.$node) {
    const all = (node(spec.$node).chips || []).map((c) => c.label);
    if (spec.limit == null) return all;
    const tail = spec.keepTail ? all.slice(-spec.keepTail) : [];
    const head = all.slice(0, spec.limit);
    const hidden = all.length - head.length - tail.length;
    return [...head, ...(hidden > 0 ? [spec.more.replace('{n}', hidden)] : []), ...tail];
  }
  throw new Error('Bad chips spec: ' + JSON.stringify(spec));
}
function item([kind, a, b]) {
  switch (kind) {
    case 'user': case 'note': case 'end': return [kind, mustache(a)];
    case 'bot': return ['bot', typeof a === 'string' ? mustache(a) : node(a.$node).text];
    case 'chips': return ['chips', chips(a)];
    case 'card': { const x = article[a.$article]; return ['card', { title: x.title, desc: x.desc, readMin: x.readMin }]; }
    case 'viewer': { const x = article[a.$article]; return ['viewer', { title: x.title, lines: x.lines }]; }
    default: throw new Error('Unknown item kind: ' + kind);
  }
}
const items = (list) => (list || []).map(item);
const step = (s) => ({
  id: s.id, title: s.title, uiLabel: s.uiLabel, tap: s.tap ? mustache(s.tap) : null, col: s.col,
  entry: !!s.entry, tab: s.tab || 'Conversation', composer: s.composer !== false,
  ui: items(s.ui), low: items(s.low),
});
const journeys = {
  journeys: tpl.journeys.map((j) => ({
    id: j.id, name: j.name, sub: j.sub, bg: j.bg,
    steps: j.steps.map(step), branches: (j.branches || []).map(step),
  })),
};

// ---- frontmatter ------------------------------------------------------------------------
const ftpl = json(path.join(skill, 'assets', 'frontmatter.template.json'));
const card = (c) => ({
  name: c.name, heading: mustache(c.heading),
  blocks: c.blocks.map(([k, ...rest]) => [k, ...rest.map(mustache)]),
});
const frontmatter = { section: ftpl.section, left: ftpl.left.map(card), grid: ftpl.grid.map(card) };

// ---- write data + ready-to-paste Figma scripts -----------------------------------------
const tokens = json(path.join(skill, 'assets', 'tokens.json'));
const icons = json(path.join(skill, 'assets', 'icons.json'));
fs.mkdirSync(path.join(out, 'figma'), { recursive: true });
const w = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 1));
w('journeys.json', journeys); w('frontmatter.json', frontmatter); w('stats.json', stats);

const scripts = {
  '01-setup.js': { tokens, icons },
  '02-ui.js': { tokens, journeys },
  '03-lowfi.js': { tokens, journeys },
  '04-frontmatter.js': { tokens, frontmatter },
};
const report = [];
for (const [name, data] of Object.entries(scripts)) {
  const body = read(path.join(here, 'figma', name));
  const code = `// Generated by build-data.mjs — do not edit. Source: skills/chat-journey/scripts/figma/${name}\nconst DATA = ${JSON.stringify(data)};\n${body}`;
  fs.writeFileSync(path.join(out, 'figma', name), code);
  report.push(`${name}: ${code.length} chars${code.length > 50000 ? '  ⚠ over the 50,000-char use_figma limit' : ''}`);
}
console.log('Stats:', JSON.stringify(stats));
console.log('Journeys:', journeys.journeys.map((j) => `${j.id}=${j.steps.length} steps + ${j.branches.length} branches`).join(', '));
console.log(report.join('\n'));
console.log('Wrote', path.relative(root, out) + '/');
