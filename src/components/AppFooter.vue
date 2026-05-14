<script setup lang="ts">
import type { Entry } from '../composables/useEntries'
import { computed, ref } from 'vue'

const props = defineProps<{
  entries: Entry[]
  content: string
}>()

const emit = defineEmits<{
  (e: 'import', entries: Entry[]): void
  (e: 'flush'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const wordCount = computed(() => props.content.trim() ? props.content.trim().split(/\s+/).length : 0)
const charCount = computed(() => props.content.length)

function exportData() {
  emit('flush')
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const filename = `calibre_${day}${month}${year}-${hours}${minutes}.json`
  const filteredEntries = props.entries.filter(e => e.content.trim() !== '')

  const data = JSON.stringify(filteredEntries, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const importedEntries = JSON.parse(content) as Entry[]
      if (Array.isArray(importedEntries)) {
        emit('import', importedEntries)
      }
    } catch (err) {
      alert('Erreur lors de l\'importation du fichier.')
      console.error(err)
    } finally {
      if (fileInputRef.value) fileInputRef.value.value = ''
    }
  }
  reader.readAsText(file)
}

function onActionChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'export') {
    exportData()
  } else if (value === 'import') {
    fileInputRef.value?.click()
  }
  (event.target as HTMLSelectElement).value = ''
}
</script>

<template>
  <footer class="footer">
    <div class="footer-left">
      <span>{{ wordCount }} mot{{ wordCount !== 1 ? 's' : '' }} · {{ charCount }} caractère{{ charCount !== 1 ? 's' : '' }}</span>
      <select class="action-selector" @change="onActionChange">
        <option value="" disabled selected>Actions...</option>
        <option value="export">Sauvegarder</option>
        <option value="import">Importer</option>
      </select>
      <input type="file" ref="fileInputRef" @change="handleImport" accept=".json" style="display: none">
    </div>
    <div class="footer-right">
      <span class="version">v0.1.8</span>
      <span class="status">
        <span class="dot pulse"></span>
        Sauvegarde auto
      </span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-selector {
  font-size: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  outline: none;
}

.action-selector:hover {
  border-color: #d1d5db;
  color: #374151;
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
