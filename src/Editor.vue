<script setup lang="ts">
import {ref, onMounted, watch, computed} from "vue";
import {fileOpen, fileSave} from "browser-fs-access";
import {Codemirror} from "vue-codemirror";
import {EditorView} from "codemirror";
import {linter, type Diagnostic} from "@codemirror/lint";
import {EditorSelection} from "@codemirror/state";
import {
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {defaultKeymap, historyKeymap} from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import FileControls from "./FileControls.vue";
import {
  exampleEvaporatingCloudText,
  exampleGoalTreeText,
  exampleProblemTreeText,
} from "./examples.ts";
import {Completions} from "./interpreter.ts";
import {TOC_LANG, TOC_LANG_HIGHLIGHT} from "./highlight.ts";

const myProps = withDefaults(defineProps<{
  rows: number,
  value: string,
  diagnostics: Diagnostic[],
  completions: Completions,
}>(), {rows: 20});
const emit = defineEmits<{
  "update": [value: string],
}>();

const editorText = ref(myProps.value || "");

const view = ref<EditorView | null>(null);

const extensions = computed(() => [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  highlightActiveLine(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...completionKeymap,
  ]),
  TOC_LANG({idents: myProps.completions.idents}),
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

const examplesByType = {
  conflict: exampleEvaporatingCloudText,
  goal: exampleGoalTreeText,
  problem: exampleProblemTreeText,
};

function handleSelectExample(example: string) {
  if (example in examplesByType) {
    const exampleText = examplesByType[example as keyof typeof examplesByType];
    editorText.value = exampleText;
    emit("update", exampleText);
    view.value?.dispatch({
      selection: EditorSelection.cursor(0),
      scrollIntoView: true,
    });
  }
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
