---
name: Décisions d'architecture — extension Chromium
description: Choix techniques délibérés faits lors de la conversion en extension, avec justifications
type: project
originSessionId: 281054d3-9bef-4844-8d43-e32d1e2fcb8d
---
## Side Panel comme interface principale (pas le popup)

Clic sur l'icône → ouvre le **side panel** (configuré via `openPanelOnActionClick: true` dans le service worker).

**Why:** Le side panel persiste pendant la navigation, ce qui est plus adapté à la prise de notes. Le popup se ferme dès qu'on clique ailleurs.

**How to apply:** `popup.html` est buildé et présent dans le dist mais n'est pas déclenché par le clic icône. Si l'utilisateur veut revenir au comportement popup, il suffit de mettre `openPanelOnActionClick: false` dans `src/background/service-worker.ts` et d'ajouter `"default_popup": "popup.html"` dans la section `action` du manifest.

---

## localStorage conservé (pas de migration vers chrome.storage)

**Why:** Zéro refactoring nécessaire, `localStorage` fonctionne nativement dans les extensions. La migration vers `chrome.storage.sync` est reportée à une future itération si la sync multi-appareils devient un besoin.

**How to apply:** Si la migration est lancée, le seul fichier à modifier est `src/composables/useEntries.ts` — toutes les opérations de persistence y sont centralisées (`loadEntries`, `persist`, `STORAGE_KEY`, `CURRENT_KEY`).

---

## Build multi-entrées sans plugin tiers

**Why:** Plutôt qu'un plugin dédié (`vite-plugin-web-extension`), la configuration Rollup native de Vite suffit pour ce projet simple. Moins de dépendances, plus de contrôle.

**How to apply:** Si le projet grossit (content scripts, pages d'options, background complexe), envisager `vite-plugin-web-extension` qui gère le manifest automatiquement.

---

## Icônes PNG obligatoires (pas SVG)

Chrome n'accepte pas les SVG pour les icônes d'extension (toolbar, chrome://extensions, Web Store). Seuls les PNG aux tailles 16, 48, 128 sont supportés.

**How to apply:** Les icônes sont dans `public/icons/` et référencées dans les deux sections du manifest : `icons` (page extensions) et `action.default_icon` (toolbar).
