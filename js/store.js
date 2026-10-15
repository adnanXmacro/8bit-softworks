const DEFAULT_INSTALL_STEPS = [
  'Download the APK from the Install button.',
  'Allow unknown sources for this install.',
  'Open the downloaded file and install.',
  'Open the app from your app drawer.'
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const ICONS = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  star:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.5l-5.81 3-1.11-6.47-4.7-4.58 6.5-.95z"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 3v3M16 3v3"/></svg>',
  tag:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5V5a2 2 0 0 1 2-2h6.5L21 12.5 12.5 21z"/><circle cx="7.8" cy="7.8" r="1.4"/></svg>',
  layers:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  grid:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>',
  list:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.4" fill="currentColor" stroke="none"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>'
};

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

function formatDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  const [, y, m, d] = match;
  const month = MONTHS[Number(m) - 1] || '';
  return `${month} ${Number(d)}, ${y}`;
}

export function collectCategories(apps) {
  if (!Array.isArray(apps)) return [];
  const seen = [];
  apps.forEach((app) => {
    const category = String(app?.category || '').trim();
    if (category && !seen.includes(category)) seen.push(category);
  });
  return seen;
}

export function filterApps(apps, { query = '', category = 'All' } = {}) {
  if (!Array.isArray(apps)) return [];
  const q = String(query || '').trim().toLowerCase();
  return apps.filter((app) => {
    if (category && category !== 'All' && app.category !== category) return false;
    if (!q) return true;
    const haystack = [
      app.name,
      app.developer,
      app.blurb,
      app.description,
      app.category,
      ...(Array.isArray(app.tags) ? app.tags : [])
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

function searchIndex(app) {
  return [
    app.name,
    app.developer,
    app.blurb,
    app.description,
    app.category,
    ...(Array.isArray(app.tags) ? app.tags : [])
  ]
    .join(' ')
    .toLowerCase()
    .replace(/"/g, '');
}

function statsMarkup(app) {
  const parts = [];
  if (app.rating) {
    parts.push(
      `<span class="stat rating">${ICONS.star}<span>${escapeHtml(app.rating)}</span></span>`
    );
  }
  if (app.downloads) {
    parts.push(
      `<span class="stat">${ICONS.download}<span>${escapeHtml(app.downloads)}</span></span>`
    );
  }
  const updated = formatDate(app.updatedAt);
  if (updated) {
    parts.push(`<span class="stat">${ICONS.calendar}<span>${escapeHtml(updated)}</span></span>`);
  }
  return parts.length ? `<div class="stats">${parts.join('')}</div>` : '';
}

function cardMarkup(app) {
  const href = `app/${escapeHtml(app.slug)}/`;
  const tag = app.category
    ? `<span class="tag">${escapeHtml(app.category)}</span>`
    : '';
  return `<li class="card" data-category="${escapeHtml(app.category || '')}" data-search="${escapeHtml(searchIndex(app))}">
        <a class="card-link" href="${href}">
          <img class="icon" src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)} icon" loading="lazy">
          <div class="card-body">
            <div class="card-top">
              <h2>${escapeHtml(app.name)}</h2>
              ${tag}
            </div>
            <p class="developer">${escapeHtml(app.developer)}</p>
            <p class="blurb">${escapeHtml(app.blurb)}</p>
            ${statsMarkup(app)}
          </div>
        </a>
        <a class="btn install" href="${href}">Get</a>
      </li>`;
}

export function renderCatalog(apps) {
  if (!Array.isArray(apps) || apps.length === 0) {
    return `<p class="empty"><strong>Apps unavailable</strong>Check back soon.</p>`;
  }
  return `<ul class="catalog">${apps.map(cardMarkup).join('')}</ul>`;
}

export function renderFeatured(app) {
  if (!app) return '';
  const href = `app/${escapeHtml(app.slug)}/`;
  return `
    <section class="featured">
      <img class="icon" src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)} icon">
      <div class="featured-body">
        <p class="featured-kicker">Editor's pick</p>
        <h2>${escapeHtml(app.name)}</h2>
        <p class="blurb">${escapeHtml(app.blurb)}</p>
        ${statsMarkup(app)}
      </div>
      <div class="featured-actions">
        <a class="btn" href="${href}">View app</a>
      </div>
      <span class="featured-badge">${ICONS.spark}Featured</span>
    </section>`;
}

function renderToolbar(apps) {
  const categories = collectCategories(apps);
  const chips = ['All', ...categories]
    .map(
      (category, index) =>
        `<button class="chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="${index === 0}">${escapeHtml(category)}</button>`
    )
    .join('');
  return `
    <div class="toolbar">
      <div class="toolbar-row">
        <label class="search" for="store-search">
          ${ICONS.search}
          <input id="store-search" type="search" placeholder="Search apps, developers, tags" autocomplete="off" aria-label="Search apps">
        </label>
        <div class="view-toggle" role="group" aria-label="Layout">
          <button type="button" data-view="grid" aria-pressed="true" title="Grid view" aria-label="Grid view">${ICONS.grid}</button>
          <button type="button" data-view="list" aria-pressed="false" title="List view" aria-label="List view">${ICONS.list}</button>
        </div>
      </div>
      <div class="toolbar-row">
        <div class="chips" role="group" aria-label="Filter by category">${chips}</div>
        <span class="header-spacer"></span>
        <p class="result-count" id="result-count"></p>
      </div>
    </div>`;
}

export function renderStore(apps) {
  const featured = Array.isArray(apps) ? apps.find((app) => app.featured) || apps[0] : null;
  return `
    ${renderFeatured(featured)}
    ${renderToolbar(apps)}
    <ul class="catalog" id="catalog">${(apps || []).map(cardMarkup).join('')}</ul>
    <p class="empty hidden" id="empty-state"><strong>No matches</strong>Try a different search or category.</p>`;
}

export function renderAppPage(app) {
  if (!app) {
    return '<p class="empty">App not found. <a href="../../">Back to the store</a></p>';
  }
  const apkUrl = (app.apkUrl || '').trim();
  const canInstall = /^https:\/\//i.test(apkUrl);
  const installButton = canInstall
    ? `<a class="btn install" href="${escapeHtml(apkUrl)}">${ICONS.download}Install</a>`
    : `<button class="btn install" type="button" disabled aria-disabled="true">${ICONS.download}Install</button>`;
  const steps = Array.isArray(app.installSteps) && app.installSteps.length
    ? app.installSteps
    : DEFAULT_INSTALL_STEPS;
  const screenshots = Array.isArray(app.screenshots) ? app.screenshots : [];
  const tags = Array.isArray(app.tags) ? app.tags : [];

  const tagPills = [
    app.category ? `<span class="tag">${escapeHtml(app.category)}</span>` : '',
    ...tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
  ].join('');

  const statPills = [
    `<span class="pill">Version <strong>${escapeHtml(app.version)}</strong></span>`,
    app.size ? `<span class="pill">${ICONS.layers}${escapeHtml(app.size)}</span>` : '',
    app.rating ? `<span class="pill rating">${ICONS.star}<strong>${escapeHtml(app.rating)}</strong></span>` : '',
    app.downloads ? `<span class="pill">${ICONS.download}<strong>${escapeHtml(app.downloads)}</strong></span>` : '',
    formatDate(app.updatedAt)
      ? `<span class="pill">${ICONS.calendar}Updated <strong>${escapeHtml(formatDate(app.updatedAt))}</strong></span>`
      : ''
  ].join('');

  const gallery = screenshots.length
    ? `<div class="screenshots">${screenshots
        .map(
          (src) =>
            `<button class="screenshot" type="button" data-shot="${escapeHtml(src)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(app.name)} screenshot" loading="lazy"></button>`
        )
        .join('')}</div>`
    : `<div class="gallery-note"><strong>No screenshots yet</strong>Previews for ${escapeHtml(app.name)} are coming soon.</div>`;

  return `
    <header class="app-hero">
      <img class="icon" src="${escapeHtml(app.iconUrl)}" alt="${escapeHtml(app.name)} icon">
      <div>
        <h1>${escapeHtml(app.name)}</h1>
        <p class="developer">by ${escapeHtml(app.developer)}</p>
        <div class="app-tags">${tagPills}</div>
        <div class="app-stats">${statPills}</div>
      </div>
      ${installButton}
    </header>
    <section class="section">
      <h2>Screenshots</h2>
      ${gallery}
    </section>
    <section class="section description">
      <h2>About this app</h2>
      <p>${escapeHtml(app.description)}</p>
    </section>
    <section class="section sideload">
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

function mountLightbox(root) {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector('.lightbox');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Screenshot preview');
  box.innerHTML = `<button class="lightbox-close" type="button" aria-label="Close preview">${ICONS.close}</button><img alt="Screenshot preview">`;
  document.body.appendChild(box);

  const img = box.querySelector('img');
  const close = () => {
    box.classList.remove('open');
    img.removeAttribute('src');
  };

  root.addEventListener('click', (event) => {
    const shot = event.target.closest('[data-shot]');
    if (!shot) return;
    img.src = shot.getAttribute('data-shot');
    box.classList.add('open');
  });
  box.addEventListener('click', (event) => {
    if (event.target === box || event.target.closest('.lightbox-close')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

export async function mountCatalog(root, fetchImpl = fetch) {
  root.innerHTML = `<ul class="catalog" aria-hidden="true">${'<li class="skeleton-card"></li>'.repeat(4)}</ul>`;
  const result = await loadApps(fetchImpl, appsJsonUrl());
  if (!result.ok) {
    root.innerHTML = `<p class="empty"><strong>${escapeHtml(result.message)}</strong>Check back soon.</p>`;
    return result;
  }

  root.innerHTML = renderStore(result.apps);

  const catalog = root.querySelector('#catalog');
  const emptyState = root.querySelector('#empty-state');
  const count = root.querySelector('#result-count');
  const search = root.querySelector('#store-search');
  const chips = [...root.querySelectorAll('.chip')];
  const viewButtons = [...root.querySelectorAll('.view-toggle button')];
  const cards = [...root.querySelectorAll('.card')];

  let activeCategory = 'All';
  let query = '';

  const apply = () => {
    let shown = 0;
    cards.forEach((card) => {
      const matchesCategory =
        activeCategory === 'All' || card.dataset.category === activeCategory;
      const matchesQuery = !query || card.dataset.search.includes(query);
      const visible = matchesCategory && matchesQuery;
      card.classList.toggle('hidden', !visible);
      if (visible) shown += 1;
    });
    if (count) {
      count.textContent = `${shown} of ${cards.length} apps`;
    }
    emptyState.classList.toggle('hidden', shown !== 0);
    catalog.classList.toggle('hidden', shown === 0);
  };

  if (search) {
    search.addEventListener('input', () => {
      query = search.value.trim().toLowerCase();
      apply();
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      apply();
    });
  });

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const list = button.dataset.view === 'list';
      catalog.classList.toggle('is-list', list);
      viewButtons.forEach((b) =>
        b.setAttribute('aria-pressed', String(b === button))
      );
    });
  });

  apply();
  return result;
}

export async function mountAppPage(root, slug, fetchImpl = fetch) {
  const result = await loadApps(fetchImpl, appsJsonUrl());
  if (!result.ok) {
    root.innerHTML = `<p class="empty"><strong>${escapeHtml(result.message)}</strong>Check back soon.</p>`;
    return result;
  }
  const app = findAppBySlug(result.apps, slug);
  if (!app) {
    root.innerHTML = '<p class="empty">App not found. <a href="../../">Back to the store</a></p>';
    return { ok: false, message: 'not found' };
  }
  root.innerHTML = renderAppPage(app);
  mountLightbox(root);
  return { ok: true, app };
}

export function slugFromPath(pathname) {
  const match = String(pathname || '').match(/\/app\/([^/]+)\/?/);
  return match ? match[1] : '';
}
