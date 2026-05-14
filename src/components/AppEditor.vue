<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'input'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <main class="main">
    <textarea
      ref="textareaRef"
      class="editor"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); emit('input')"
      placeholder="Commencez à taper ici… Le texte est sauvegardé automatiquement."
      spellcheck="true"
      lang="fr"
    />
  </main>
</template>

<style scoped>
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
</style>
