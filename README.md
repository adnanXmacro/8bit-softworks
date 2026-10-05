# 8BiT Softworks store

Static GitHub Pages catalog for Quiz Chaos and Open Tube.

Live URL after Pages is enabled: `https://adnanxmacro.github.io/8bit-softworks/`

This folder is the site root. Push it to a new public repo `adnanXmacro/8bit-softworks`. Do not put it inside `Qq`. Do not change `https://adnanxmacro.github.io/Qq/`.

## Create the repo

1. Create an empty public GitHub repo named `8bit-softworks` under `adnanXmacro`.
2. Push this folder to `main`.
3. Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`.
4. Wait for `https://adnanxmacro.github.io/8bit-softworks/` to go live.

## Admin

Open `https://adnanxmacro.github.io/8bit-softworks/admin/`.

The password gate only hides the form. It is not real auth. Anyone can view source.

Writes use a GitHub personal access token with `contents:write` on `8bit-softworks` only. Paste it each session. It stays in memory for that tab. Do not commit the token. Do not put it in the APK, screenshots, or error toasts.

## Data

`apps.json` is the only datastore. Download buttons are GitHub raw or Releases URLs. This site does not host APKs.

Seed APKs:

- Quiz Chaos: `https://github.com/adnanXmacro/Qq/raw/main/QuizChaos_vanilla.apk`
- Open Tube: `https://github.com/adnanXmacro/Project-Xpark/releases/download/v1.2.2/OpenTube-1.2.2.apk`

## Tests

```
node --test test/store.test.mjs test/admin.test.mjs
```
