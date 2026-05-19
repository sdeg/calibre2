---
name: Extension Chromium — branche extention-alpha
description: Contexte et état d'avancement de la conversion de l'app web Calibre en extension Chromium
type: project
originSessionId: 281054d3-9bef-4844-8d43-e32d1e2fcb8d
---
Conversion de l'application web Vue 3 / Vite en extension Chromium (Manifest V3), démarrée sur la branche `extention-alpha` (orthographe conservée telle quelle dans le nom de branche).

**Why:** L'app est une prise de notes stockée dans le localStorage ; la transformer en extension permet un accès rapide depuis n'importe quel onglet sans ouvrir un site séparé.

**How to apply:** Toutes les évolutions liées à l'extension se font sur la branche `extention-alpha`. Le `main` conserve la version web originale.

## Ce qui a été fait

### Fichiers créés
- `public/manifest.json` — Manifest V3 (side panel, service worker, icônes, permission `sidePanel`)
- `popup.html` — entrée popup (420×600 px, dimensions fixes via `<style>` inline)
- `sidepanel.html` — entrée side panel (hauteur flexible, `100vh`)
- `src/background/service-worker.ts` — active `openPanelOnActionClick: true` à l'installation
- `public/icons/icn-calibre-16.png`, `48.png`, `128.png` — icônes fournies par l'utilisateur

### Fichiers modifiés
- `vite.config.ts` — build multi-entrées Rollup : `popup.html`, `sidepanel.html`, `src/background/service-worker.ts` → sorti dans `background/service-worker.js`
- `src/composables/useEntries.ts` — suppression de `setUrlId()` et de la lecture du param `?id=` dans l'URL (sans sens dans une extension)
- `package.json` — `build` renommé en `build:ext` ; `@types/chrome` ajouté en devDependency

### Structure du dist/ produit
```
dist/
├── manifest.json
├── popup.html
├── sidepanel.html
├── favicon.svg
├── icons/                        ← copiés depuis public/
│   ├── icn-calibre-16.png
│   ├── icn-calibre-48.png
│   └── icn-calibre-128.png
├── background/
│   └── service-worker.js
└── assets/
    ├── main-[hash].js            ← app Vue (partagée popup + sidepanel)
    └── main-[hash].css
```

## Procédure de build et test

```bash
npm run build:ext          # type-check + bundle → dist/
```

Pour charger dans Chrome :
1. `chrome://extensions` → Mode développeur ON
2. "Charger l'extension non empaquetée" → sélectionner `dist/`
3. Recharger après chaque `build:ext`

## Ce qui reste à faire (pistes d'évolution)

- Migrer de `localStorage` vers `chrome.storage.sync` pour la synchronisation multi-appareils (décision délibérément reportée)
- Ajouter une page d'options (`options.html`) si des préférences utilisateur sont nécessaires
- Publier sur le Chrome Web Store (requiert un compte développeur, fichier ZIP du `dist/`)
- Envisager un raccourci clavier global (`commands` dans le manifest) pour ouvrir le side panel
