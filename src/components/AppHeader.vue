<script setup lang="ts">
import type { Entry } from '../composables/useEntries'
import { marked } from 'marked'
import { ref } from 'vue'

const props = defineProps<{
  entries: Entry[]
  currentId: string
  content: string
  isMarkdown: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'new'): void
  (e: 'delete'): void
  (e: 'update:isMarkdown', value: boolean): void
  (e: 'flush'): void
}>()

const copied = ref(false)

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

async function copyText() {
  let textToCopy = props.content

  if (props.isMarkdown) {
    textToCopy = await marked.parse(props.content)
  }

  await navigator.clipboard.writeText(textToCopy)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function onMarkdownChange(event: Event) {
  emit('update:isMarkdown', (event.target as HTMLInputElement).checked)
  emit('flush')
}
</script>

<template>
  <header class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <span class="brand-name">Calibre2</span>
    </div>

    <select class="selector" :value="currentId" @change="emit('select', ($event.target as HTMLSelectElement).value)">
      <option v-for="entry in entries" :key="entry.id" :value="entry.id">
        {{ entryLabel(entry) }}
      </option>
    </select>

    <button class="btn btn-outline" @click="emit('new')" title="Nouveau texte">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Nouveau
    </button>

    <button class="btn btn-icon btn-danger" @click="emit('delete')" title="Supprimer ce texte">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>

    <label class="markdown-toggle">
      <input type="checkbox" :checked="isMarkdown" @change="onMarkdownChange">
      <span class="markdown-label">Markdown</span>
    </label>

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
</template>

<style scoped>
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
</style>
