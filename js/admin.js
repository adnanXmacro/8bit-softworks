const ADMIN_PASSWORD = '111005376';
const DEFAULT_OWNER = 'adnanXmacro';
const DEFAULT_REPO = '8bit-softworks';

let memoryToken = '';

export const tokenStorage = {
  setToken(token) {
    memoryToken = token || '';
  },
  getToken() {
    return memoryToken;
  },
  clear() {
    memoryToken = '';
  },
  persistTo() {
    return;
  }
};

export function unlockAdmin(password) {
  const unlocked = String(password) === ADMIN_PASSWORD;
  return { unlocked, showEditor: unlocked };
}

function utf8ToBase64(text) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('base64');
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export async function saveApps({
  token,
  apps,
  sha,
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO,
  fetchImpl = fetch
}) {
  if (!token) {
    return { ok: false, message: 'Could not save' };
  }
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/apps.json`;
  try {
    const body = {
      message: 'Update apps.json',
      content: utf8ToBase64(`${JSON.stringify(apps, null, 2)}\n`),
      sha
    };
    const response = await fetchImpl(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response || !response.ok) {
      return { ok: false, message: 'Could not save' };
    }
    const data = await response.json();
    return { ok: true, sha: data?.content?.sha || '' };
  } catch {
    return { ok: false, message: 'Could not save' };
  }
}

export async function loadRemoteApps({
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO,
  token,
  fetchImpl = fetch
}) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/apps.json`;
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchImpl(url, { headers });
  if (!response || !response.ok) {
    return { ok: false, message: 'Could not load listing', apps: [], sha: '' };
  }
  const data = await response.json();
  const decoded = typeof Buffer !== 'undefined'
    ? Buffer.from(data.content, 'base64').toString('utf8')
    : atob(data.content.replace(/\n/g, ''));
  return { ok: true, apps: JSON.parse(decoded), sha: data.sha };
}

export function emptyApp() {
  return {
    slug: '',
    name: '',
    developer: '8BiT Softworks',
    blurb: '',
    description: '',
    iconUrl: '',
    apkUrl: '',
    version: '',
    size: '',
    screenshots: ['']
  };
}
