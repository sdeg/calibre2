import { ref, watch, onMounted } from 'vue'

export interface Entry {
  id: string
  content: string
  updatedAt: string
  isMarkdown?: boolean
}

const STORAGE_KEY = 'textpad_entries'
const CURRENT_KEY = 'textpad_current'

export function useEntries() {
  const entries = ref<Entry[]>([])
  const currentId = ref('')
  const content = ref('')
  const isMarkdown = ref(false)
  const hydrated = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function generateId(): string {
    return crypto.randomUUID()
  }

  function loadEntries(): Entry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Entry[]
    } catch {}
    return []
  }

  function persist(data: Entry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function flushSave() {
    if (debounceTimer) clearTimeout(debounceTimer)
    entries.value = entries.value.map(e =>
      e.id === currentId.value
        ? { ...e, content: content.value, updatedAt: new Date().toISOString(), isMarkdown: isMarkdown.value }
        : e
    )
    persist(entries.value)
  }

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
    isMarkdown.value = !!entries.value[0].isMarkdown
  }

  function onContentInput() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(flushSave, 500)
  }

  onMounted(() => {
    const stored = loadEntries()

    if (stored.length === 0) {
      const first: Entry = { id: generateId(), content: '', updatedAt: new Date().toISOString(), isMarkdown: false }
      entries.value = [first]
      currentId.value = first.id
      content.value = ''
      persist([first])
    } else {
      entries.value = stored
      const active = stored.find(e => e.id === (localStorage.getItem(CURRENT_KEY) ?? ''))
        ?? stored[0]
      currentId.value = active.id
      content.value = active.content
      isMarkdown.value = !!active.isMarkdown
    }
    hydrated.value = true
  })

  watch(currentId, id => {
    if (!hydrated.value) return
    localStorage.setItem(CURRENT_KEY, id)
  })

  return {
    entries,
    currentId,
    content,
    isMarkdown,
    hydrated,
    selectEntry,
    newEntry,
    deleteEntry,
    onContentInput,
    flushSave,
    persist
  }
}
