const DEFAULT_INSTALL_STEPS = [
  'Download the APK from the Install button.',
  'Allow unknown sources for this install.',
  'Open the downloaded file and install.',
  'Open the app from your app drawer.'
];

export async function loadApps(fetchImpl, url) {
  try {
    const response = await fetchImpl(url);
    if (!response || !response.ok) {
      return { ok: false, message: 'Apps unavailable', apps: [] };
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      return { ok: false, message: 'Apps unavailable', apps: [] };
    }
    return { ok: true, apps: data };
  } catch {
    return { ok: false, message: 'Apps unavailable', apps: [] };
  }
}

export function findAppBySlug(apps, slug) {
  if (!Array.isArray(apps)) return null;
  return apps.find((app) => app.slug === slug) || null;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCatalog(apps) {
  if (!Array.isArray(apps) || apps.length === 0) {
    return '<p class="empty">Apps unavailable</p>';
  }
  return `<ul class="catalog">${apps
    .map((app) => {
      const href = `app/${escapeHtml(app.slug)}/`;
      return `<li class="card">
        <a class="card-link" href="${href}">
          <img class="icon" src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)} icon">
          <div class="card-body">
            <h2>${escapeHtml(app.name)}</h2>
            <p class="developer">${escapeHtml(app.developer)}</p>
            <p class="blurb">${escapeHtml(app.blurb)}</p>
          </div>
        </a>
        <a class="btn install" href="${href}">Get</a>
      </li>`;
    })
    .join('')}</ul>`;
}

export function renderAppPage(app) {
  if (!app) {
    return '<p>App not found. <a href="../../">Home</a></p>';
  }
  const apkUrl = (app.apkUrl || '').trim();
  const canInstall = /^https:\/\//i.test(apkUrl);
  const installButton = canInstall
    ? `<a class="btn install" href="${escapeHtml(apkUrl)}">Install</a>`
    : `<button class="btn install" type="button" disabled aria-disabled="true">Install</button>`;
  const steps = Array.isArray(app.installSteps) && app.installSteps.length
    ? app.installSteps
    : DEFAULT_INSTALL_STEPS;
  const screenshots = Array.isArray(app.screenshots) ? app.screenshots : [];
  return `
    <header class="app-hero">
      <img class="icon" src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)} icon">
      <div>
        <h1>${escapeHtml(app.name)}</h1>
        <p class="developer">${escapeHtml(app.developer)}</p>
        <p class="meta">Version ${escapeHtml(app.version)} · ${escapeHtml(app.size)}</p>
      </div>
      ${installButton}
    </header>
    <section class="screenshots">
      ${screenshots
        .map(
          (src) =>
            `<img src="${escapeHtml(src)}" alt="${escapeHtml(app.name)} screenshot">`
        )
        .join('')}
    </section>
    <section class="description">
      <p>${escapeHtml(app.description)}</p>
    </section>
    <section class="sideload">
      <h2>How to install</h2>
      <ol>
        ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
      </ol>
    </section>
  `;
}

export function appsJsonUrl() {
  if (typeof window === 'undefined') return 'apps.json';
  const path = window.location.pathname;
  if (path.includes('/app/')) return '../../apps.json';
  if (path.includes('/admin/')) return '../apps.json';
  return 'apps.json';
}

export async function mountCatalog(root, fetchImpl = fetch) {
  const result = await loadApps(fetchImpl, appsJsonUrl());
  if (!result.ok) {
    root.innerHTML = `<p class="empty">${escapeHtml(result.message)}</p>`;
    return result;
  }
  root.innerHTML = renderCatalog(result.apps);
  return result;
}

export async function mountAppPage(root, slug, fetchImpl = fetch) {
  const result = await loadApps(fetchImpl, appsJsonUrl());
  if (!result.ok) {
    root.innerHTML = `<p class="empty">${escapeHtml(result.message)}</p>`;
    return result;
  }
  const app = findAppBySlug(result.apps, slug);
  if (!app) {
    root.innerHTML = '<p>App not found. <a href="../../">Home</a></p>';
    return { ok: false, message: 'not found' };
  }
  root.innerHTML = renderAppPage(app);
  return { ok: true, app };
}

export function slugFromPath(pathname) {
  const match = String(pathname || '').match(/\/app\/([^/]+)\/?/);
  return match ? match[1] : '';
}
