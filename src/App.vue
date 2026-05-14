<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { marked } from 'marked'

interface Entry {
  id: string
  content: string
  updatedAt: string
  isMarkdown?: boolean
}

const STORAGE_KEY = 'textpad_entries'
const CURRENT_KEY = 'textpad_current'

function generateId(): string {
  return crypto.randomUUID()
}

function entryLabel(entry: Entry): string {
  const preview = entry.content.trim().slice(0, 50) || '— texte vide —'
  const ellipsis = entry.content.trim().length > 50 ? '…' : ''
  const date = new Date(entry.updatedAt)
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${preview}${ellipsis} · ${dateStr}`
}

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Entry[]
  } catch {}
  return []
}

function persist(entries: Entry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// --- State ---
const entries = ref<Entry[]>([])
const currentId = ref('')
const content = ref('')
const copied = ref(false)
const hydrated = ref(false)
const isMarkdown = ref(false)
const editorRef = ref<HTMLTextAreaElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const currentEntry = computed(() => entries.value.find(e => e.id === currentId.value))
const wordCount = computed(() => content.value.trim() ? content.value.trim().split(/\s+/).length : 0)
const charCount = computed(() => content.value.length)

function setUrlId(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('id', id)
  history.replaceState(null, '', url)
}

// --- Init ---
onMounted(() => {
  const stored = loadEntries()
  const urlId = new URLSearchParams(window.location.search).get('id') ?? ''

  if (stored.length === 0) {
    const first: Entry = { id: generateId(), content: '', updatedAt: new Date().toISOString(), isMarkdown: false }
    entries.value = [first]
    currentId.value = first.id
    content.value = ''
    persist([first])
  } else {
    entries.value = stored
    const active = stored.find(e => e.id === urlId)
      ?? stored.find(e => e.id === (localStorage.getItem(CURRENT_KEY) ?? ''))
      ?? stored[0]
    currentId.value = active.id
    content.value = active.content
    isMarkdown.value = !!active.isMarkdown
  }
  hydrated.value = true
})

// Synchroniser l'URL et le localStorage dès que l'entrée active change
watch(currentId, id => {
  if (!hydrated.value) return
  localStorage.setItem(CURRENT_KEY, id)
  setUrlId(id)
})

// --- Sauvegarde debounced du contenu ---
function flushSave() {
  if (debounceTimer) clearTimeout(debounceTimer)
  entries.value = entries.value.map(e =>
    e.id === currentId.value
      ? { ...e, content: content.value, updatedAt: new Date().toISOString(), isMarkdown: isMarkdown.value }
      : e
  )
  persist(entries.value)
}

function onContentInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(flushSave, 500)
}

// --- Actions ---
function selectEntry(id: string) {
  flushSave()
  currentId.value = id
  const entry = entries.value.find(e => e.id === id)
  content.value = entry?.content ?? ''
  isMarkdown.value = !!entry?.isMarkdown
}

function newEntry() {
  flushSave()
  const entry: Entry = { id: generateId(), content: '', updatedAt: new Date().toISOString(), isMarkdown: false }
  entries.value = [entry, ...entries.value]
  currentId.value = entry.id
  content.value = ''
  isMarkdown.value = false
  persist(entries.value)
  nextTick(() => {
    editorRef.value?.focus()
  })
}

function deleteEntry() {
  if (entries.value.length === 1) {
    entries.value = [{ ...entries.value[0], content: '', updatedAt: new Date().toISOString() }]
    content.value = ''
    persist(entries.value)
    return
  }
  entries.value = entries.value.filter(e => e.id !== currentId.value)
  persist(entries.value)
  currentId.value = entries.value[0].id
  content.value = entries.value[0].content
}

async function copyText() {
  let textToCopy = content.value

  if (isMarkdown.value) {
    textToCopy = await marked.parse(content.value)
  }

  await navigator.clipboard.writeText(textToCopy)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div v-if="!hydrated" class="loading">Chargement…</div>

  <div v-else class="layout">
    <!-- Header -->
    <header class="header">
      <!-- Logo -->
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span class="brand-name">Calibre2</span>
      </div>

      <!-- Sélecteur -->
      <select class="selector" :value="currentId" @change="selectEntry(($event.target as HTMLSelectElement).value)">
        <option v-for="entry in entries" :key="entry.id" :value="entry.id">
          {{ entryLabel(entry) }}
        </option>
      </select>

      <!-- Nouveau -->
      <button class="btn btn-outline" @click="newEntry" title="Nouveau texte">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nouveau
      </button>

      <!-- Poubelle -->
      <button class="btn btn-icon btn-danger" @click="deleteEntry" title="Supprimer ce texte">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <!-- Markdown Toggle -->
      <label class="markdown-toggle">
        <input type="checkbox" v-model="isMarkdown" @change="flushSave">
        <span class="markdown-label">Markdown</span>
      </label>

      <!-- Copier -->
      <button class="btn" :class="copied ? 'btn-success' : 'btn-primary'" @click="copyText">
        <svg v-if="copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {{ copied ? 'Copié !' : 'Copier' }}
      </button>
    </header>

    <!-- Textarea -->
    <main class="main">
      <textarea
        ref="editorRef"
        class="editor"
        v-model="content"
        @input="onContentInput"
        placeholder="Commencez à taper ici… Le texte est sauvegardé automatiquement."
        spellcheck="true"
        lang="fr"
      />
    </main>

    <!-- Barre de statut -->
    <footer class="footer">
      <span>{{ wordCount }} mot{{ wordCount !== 1 ? 's' : '' }} · {{ charCount }} caractère{{ charCount !== 1 ? 's' : '' }}</span>
      <div class="footer-right">
        <span class="version">v0.1.4</span>
        <span class="status">
          <span class="dot pulse"></span>
          Sauvegarde auto
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.brand-icon {
  width: 1.75rem;
  height: 1.75rem;
  background: #4f46e5;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-icon svg {
  width: 1rem;
  height: 1rem;
}

.brand-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: -0.01em;
}

.selector {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #fff;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.selector:focus {
  border-color: transparent;
  box-shadow: 0 0 0 2px #4f46e5;
}

/* Boutons */
.btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.btn svg {
  width: 1rem;
  height: 1rem;
}

.btn-icon {
  padding: 0.375rem;
}

.btn-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
}

.btn-primary:hover { background: #4338ca; }
.btn-primary:active { background: #3730a3; }

.btn-success {
  background: #22c55e;
  color: #fff;
}

.btn-outline {
  background: transparent;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

.btn-outline:hover { background: #eef2ff; }
.btn-outline:active { background: #e0e7ff; }

.btn-danger {
  background: transparent;
  color: #9ca3af;
  border: none;
}

.btn-danger:hover { background: #fef2f2; color: #ef4444; }

/* Markdown Toggle */
.markdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.5rem;
  cursor: pointer;
  user-select: none;
}

.markdown-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.markdown-toggle input {
  cursor: pointer;
}

/* Textarea */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  min-height: 0;
}

.editor {
  flex: 1;
  width: 100%;
  resize: none;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 1.25rem;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.75;
  color: #1f2937;
  outline: none;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.editor::placeholder {
  color: #d1d5db;
}

.editor:focus {
  border-color: transparent;
  box-shadow: 0 0 0 2px #4f46e5;
}

/* Footer */
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.version {
  font-family: monospace;
  opacity: 0.8;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.dot {
  display: inline-block;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: #4ade80;
}
</style>
