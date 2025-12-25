<script setup lang="ts">
import {examples} from "./examples.ts";

const emit = defineEmits<{
  "load": [],
  "save": [],
  "selectExample": [value: string],
}>();

function onChange(e: Event & {target: HTMLSelectElement}) {
  emit('selectExample', e.target.value);
}
</script>

<template>
  <div class="file-controls">
    <button class="load" @click="emit('load')">Load</button>
    <button class="save" @click="emit('save')">Save</button>
    <select @change="onChange">
      <option value="" disabled>Examples</option>
      <option v-for="example in examples" :key="example.id" :value="example.id">
        {{ example.name }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.file-controls {
  padding: 0.3em;
  display: flex;
  gap: 8px;

  :is(button).load {
    background-color: #4a5568;
    color: white;
  }

  :is(button).save {
    background-color: #4299e1;
    color: white;
  }
}
</style>
