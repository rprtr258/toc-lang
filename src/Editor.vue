<script setup lang="ts">
import {ref, onMounted, watch, computed} from "vue";
import {fileOpen, fileSave} from "browser-fs-access";
import {Codemirror} from "vue-codemirror";
import {basicSetup, EditorView} from "codemirror";
import {linter, type Diagnostic} from "@codemirror/lint";
import {EditorSelection} from "@codemirror/state";
import FileControls from "./FileControls.vue";
import {TOC_LANG, TOC_LANG_HIGHLIGHT} from "./lang.ts";
import {Completion} from "./interpreter.ts";
import {examples} from "./examples.ts";

const myProps = defineProps<{
  value: string,
  diagnostics: Diagnostic[],
  completions: Completion[],
}>();
const emit = defineEmits<{
  "update": [value: string],
}>();

const editorText = ref(myProps.value || "");

const view = ref<EditorView | null>(null);

const extensions = computed(() => [
  basicSetup,
  EditorView.baseTheme({
    ".cm-gutters": {display: "none"},
  }),
  TOC_LANG(myProps.completions),
  TOC_LANG_HIGHLIGHT,
  linter(() => myProps.diagnostics),
]);

watch(editorText, newVal => emit("update", newVal));

async function handleLoad() {
  const file = await fileOpen();
  const fileText = await file.text();
  editorText.value = fileText;
  emit("update", fileText);
}

async function handleSave() {
  await fileSave(new Blob([editorText.value], {type: "text/plain"}), {
    fileName: "document.txt",
    extensions: [".txt"],
  });
}

const examplesByType = Object.fromEntries(examples.map(({id, text}) => [id, text]));

function handleSelectExample(example: string) {
  const exampleText = examplesByType[example];
  editorText.value = exampleText;
  emit("update", exampleText);
  view.value?.dispatch({
    selection: EditorSelection.cursor(0),
    scrollIntoView: true,
  });
}
onMounted(() => handleSelectExample("goal"));
</script>

<template>
  <div>
    <FileControls
      :onLoad="handleLoad"
      :onSave="handleSave"
      :onSelectExample="handleSelectExample"
    />
    <Codemirror
      v-model="editorText"
      :extensions="extensions"
      style="height: calc(100vh - 50px)"
      @ready="view = $event.view"
    />
  </div>
</template>

<style scoped></style>
