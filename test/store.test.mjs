import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApps, findAppBySlug, renderCatalog, renderAppPage } from '../js/store.js';

const sampleApps = [
  {
    slug: 'quiz-chaos',
    name: 'Quiz Chaos',
    developer: '8BiT Softworks',
    blurb: 'Trivia that does not sit still.',
    description: 'Fast quiz rounds.',
    iconUrl: 'https://example.com/qc.png',
    apkUrl: 'https://github.com/adnanXmacro/Qq/raw/main/QuizChaos_vanilla.apk',
    version: '1.0',
    size: '12 MB',
    screenshots: ['https://example.com/qc-1.png']
  },
  {
    slug: 'open-tube',
    name: 'Open Tube',
    developer: '8BiT Softworks',
    blurb: 'Watch without the clutter.',
    description: 'YouTube client.',
    iconUrl: 'https://example.com/ot.png',
    apkUrl: 'https://github.com/adnanXmacro/Project-Xpark/releases/download/v1.2.2/OpenTube-1.2.2.apk',
    version: '1.2.2',
    size: '8 MB',
    screenshots: ['https://example.com/ot-1.png']
  }
];

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
  };
}

test('loadApps returns apps from a JSON array', async () => {
  const fetchImpl = async () => jsonResponse(sampleApps);
  const result = await loadApps(fetchImpl, 'apps.json');
  assert.equal(result.ok, true);
  assert.equal(result.apps.length, 2);
  assert.equal(result.apps[0].slug, 'quiz-chaos');
});

test('loadApps returns apps unavailable when JSON is invalid', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error('bad json');
    },
    text: async () => '{not json'
  });
  const result = await loadApps(fetchImpl, 'apps.json');
  assert.equal(result.ok, false);
  assert.match(result.message, /apps unavailable/i);
});

test('loadApps returns apps unavailable when fetch fails', async () => {
  const fetchImpl = async () => {
    throw new Error('network');
  };
  const result = await loadApps(fetchImpl, 'apps.json');
  assert.equal(result.ok, false);
  assert.match(result.message, /apps unavailable/i);
});

test('renderCatalog shows two cards with names and app links', () => {
  const html = renderCatalog(sampleApps);
  assert.match(html, /Quiz Chaos/);
  assert.match(html, /Open Tube/);
  assert.match(html, /app\/quiz-chaos\//);
  assert.match(html, /app\/open-tube\//);
  assert.match(html, /Get|Install/i);
});

test('renderAppPage Install href is the GitHub APK URL', () => {
  const html = renderAppPage(sampleApps[1]);
  assert.match(html, /href="https:\/\/github.com\/adnanXmacro\/Project-Xpark\/releases\/download\/v1\.2\.2\/OpenTube-1\.2\.2\.apk"/);
  assert.match(html, /8BiT Softworks/);
  assert.match(html, /1\.2\.2/);
});

test('renderAppPage Quiz Chaos Install href is the GitHub raw APK URL', () => {
  const html = renderAppPage(sampleApps[0]);
  assert.match(html, /href="https:\/\/github.com\/adnanXmacro\/Qq\/raw\/main\/QuizChaos_vanilla.apk"/);
});

test('renderAppPage disables Install when apkUrl is empty', () => {
  const html = renderAppPage({ ...sampleApps[0], apkUrl: '' });
  assert.doesNotMatch(html, /href="https:\/\/github.com\/adnanXmacro\/Qq\/raw\/main\/QuizChaos_vanilla.apk"/);
  assert.match(html, /disabled|aria-disabled="true"/i);
});

test('findAppBySlug returns the matching app', () => {
  assert.equal(findAppBySlug(sampleApps, 'open-tube').name, 'Open Tube');
});

test('findAppBySlug returns null when missing', () => {
  assert.equal(findAppBySlug(sampleApps, 'missing'), null);
});

test('renderAppPage includes four sideload steps by default', () => {
  const html = renderAppPage(sampleApps[0]);
  assert.match(html, /unknown sources/i);
  const steps = html.match(/<li[\s>]/gi) || [];
  assert.ok(steps.length >= 4);
});

test('seed apps.json lists Quiz Chaos and Open Tube with GitHub APK URLs', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const apps = JSON.parse(readFileSync(join(root, 'apps.json'), 'utf8'));
  assert.equal(apps.length, 2);
  const qc = apps.find((a) => a.slug === 'quiz-chaos');
  const ot = apps.find((a) => a.slug === 'open-tube');
  assert.equal(qc.apkUrl, 'https://github.com/adnanXmacro/Qq/raw/main/QuizChaos_vanilla.apk');
  assert.equal(ot.apkUrl, 'https://github.com/adnanXmacro/Project-Xpark/releases/download/v1.2.2/OpenTube-1.2.2.apk');
  assert.equal(qc.developer, '8BiT Softworks');
  assert.equal(ot.developer, '8BiT Softworks');
});
