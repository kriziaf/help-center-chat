#!/usr/bin/env node
/**
 * Optional visual check. Walks each journey in the RUNNING app and saves one screenshot of the
 * chat popup per step, so the Figma screens can be compared with the real UI.
 *
 *   npm run dev                       # in another terminal (default http://localhost:5173)
 *   npm i --no-save playwright-core   # once
 *   node skills/chat-journey/scripts/build-data.mjs
 *   node skills/chat-journey/scripts/capture-app.mjs
 *
 * Env: APP_URL (default http://localhost:5173), CHROMIUM_PATH (path to a Chromium/Chrome binary;
 * default lets Playwright find its own). Output: skills/chat-journey/build/captures/<step>.png
 *
 * It clicks each step's `tap` label in order, so it only needs build/journeys.json. Branch steps
 * are skipped (they start from a mid-journey screen).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const build = path.resolve(here, '..', 'build');
const data = JSON.parse(fs.readFileSync(path.join(build, 'journeys.json'), 'utf8'));
const url = process.env.APP_URL || 'http://localhost:5173';
const outDir = path.join(build, 'captures');
fs.mkdirSync(outDir, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.error('playwright-core not installed. Run: npm i --no-save playwright-core'); process.exit(1); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
for (const j of data.journeys) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1600 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.click('.fab');
  await page.waitForTimeout(400);
  for (const s of j.steps) {
    if (s.tap) await page.getByRole('button', { name: s.tap, exact: true }).last().click();
    await page.waitForTimeout(1800); // bot replies are delayed
    await (await page.$('.chat-popup')).screenshot({ path: path.join(outDir, `${s.id}.png`) });
    console.log('captured', s.id);
  }
  await page.close();
}
await browser.close();
console.log('Saved to', path.relative(process.cwd(), outDir));
