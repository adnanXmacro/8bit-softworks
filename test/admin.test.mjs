import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlockAdmin, saveApps, tokenStorage } from '../js/admin.js';

test('wrong password stays on the gate', () => {
  const result = unlockAdmin('000000');
  assert.equal(result.unlocked, false);
  assert.equal(result.showEditor, false);
});

test('correct password unlocks the editor', () => {
  const result = unlockAdmin('111005376');
  assert.equal(result.unlocked, true);
  assert.equal(result.showEditor, true);
});

test('save without token shows could not save', async () => {
  const result = await saveApps({
    token: '',
    apps: [{ slug: 'quiz-chaos', name: 'Quiz Chaos' }],
    fetchImpl: async () => {
      throw new Error('should not fetch');
    }
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /could not save/i);
});

test('save with GitHub 401 shows could not save and keeps token out of the message', async () => {
  const token = 'ghp_super_secret_token_value';
  const result = await saveApps({
    token,
    apps: [{ slug: 'quiz-chaos', name: 'Quiz Chaos' }],
    sha: 'abc',
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Bad credentials' }),
      text: async () => 'Bad credentials'
    })
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /could not save/i);
  assert.equal(result.message.includes(token), false);
});

test('save with GitHub 403 or 404 shows could not save', async () => {
  for (const status of [403, 404]) {
    const result = await saveApps({
      token: 'tok',
      apps: [{ slug: 'open-tube', name: 'Open Tube' }],
      fetchImpl: async () => ({
        ok: false,
        status,
        json: async () => ({}),
        text: async () => ''
      })
    });
    assert.equal(result.ok, false);
    assert.match(result.message, /could not save/i);
  }
});

test('save commits apps.json through the GitHub Contents API', async () => {
  const calls = [];
  const result = await saveApps({
    token: 'tok123',
    owner: 'adnanXmacro',
    repo: '8bit-softworks',
    apps: [{ slug: 'quiz-chaos', name: 'Quiz Chaos', apkUrl: 'https://github.com/x/y.apk' }],
    sha: 'deadbeef',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: { sha: 'newsha' } }),
        text: async () => '{}'
      };
    }
  });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    'https://api.github.com/repos/adnanXmacro/8bit-softworks/contents/apps.json'
  );
  assert.equal(calls[0].options.method, 'PUT');
  const auth = calls[0].options.headers.Authorization || calls[0].options.headers.authorization;
  assert.match(auth, /tok123/);
  const body = JSON.parse(calls[0].options.body);
  assert.ok(body.content);
  assert.equal(body.sha, 'deadbeef');
  const decoded = Buffer.from(body.content, 'base64').toString('utf8');
  assert.match(decoded, /quiz-chaos/);
});

test('token storage keeps the token in memory and not in localStorage', () => {
  const fakeLocal = {
    store: {},
    setItem(k, v) {
      this.store[k] = v;
    },
    getItem(k) {
      return this.store[k] ?? null;
    }
  };
  tokenStorage.setToken('ghp_mem_only');
  tokenStorage.persistTo(fakeLocal);
  assert.equal(tokenStorage.getToken(), 'ghp_mem_only');
  assert.equal(Object.keys(fakeLocal.store).length, 0);
  tokenStorage.clear();
  assert.equal(tokenStorage.getToken(), '');
});
