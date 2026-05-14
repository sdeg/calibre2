<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useEntries, type Entry } from './composables/useEntries'
import AppHeader from './components/AppHeader.vue'
import AppEditor from './components/AppEditor.vue'
import AppFooter from './components/AppFooter.vue'

const {
  entries,
  currentId,
  content,
  isMarkdown,
  hydrated,
  selectEntry,
  newEntry: _newEntry,
  deleteEntry,
  onContentInput,
  flushSave,
  persist
} = useEntries()

const editorRef = ref<InstanceType<typeof AppEditor> | null>(null)

function handleNewEntry() {
  _newEntry()
  nextTick(() => {
    editorRef.value?.focus()
  })
}

function handleImport(importedEntries: Entry[]) {
  const existingIds = new Set(entries.value.map(e => e.id))
  const newEntries = importedEntries.filter(e => !existingIds.has(e.id))
  entries.value = [...entries.value, ...newEntries]
  persist(entries.value)
  alert(`${newEntries.length} entrées importées avec succès.`)
}
</script>

<template>
  <div v-if="!hydrated" class="loading">Chargement…</div>

  <div v-else class="layout">
    <AppHeader
      :entries="entries"
      :currentId="currentId"
      :content="content"
      v-model:isMarkdown="isMarkdown"
      @select="selectEntry"
      @new="handleNewEntry"
      @delete="deleteEntry"
      @flush="flushSave"
    />

    <AppEditor
      ref="editorRef"
      v-model="content"
      @input="onContentInput"
    />

    <AppFooter
      :entries="entries"
      :content="content"
      @import="handleImport"
      @flush="flushSave"
    />
  </div>
</template>

<style>
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  background-color: #f9fafb;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>

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

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(74, 222, 128, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

:deep(.pulse) {
  animation: pulse 2s infinite;
}
</style>
