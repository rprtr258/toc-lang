<script setup lang="ts">
const emit = defineEmits<{
  "load": [],
  "save": [],
  "selectExample": [value: string],
}>();

const examples = [
  {value: "goal", label: "Goal Tree"},
  {value: "problem", label: "Problem Tree"},
  {value: "conflict", label: "Conflict Cloud"},
];

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
      <option v-for="example in examples" :key="example.value" :value="example.value">
        {{ example.label }}
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
