<script setup lang="ts">
import {ref, onMounted, watch, computed} from "vue";
import {fileOpen, fileSave} from "browser-fs-access";
import {Codemirror} from "vue-codemirror";
import {basicSetup} from "codemirror";
import FileControls from "./FileControls.vue";
import {
  exampleEvaporatingCloudText,
  exampleGoalTreeText,
  exampleProblemTreeText,
} from "./examples";
import {Completions} from "./interpreter";
import {TOC_LANG, TOC_LANG_HIGHLIGHT} from "./highlight";

const myProps = withDefaults(defineProps<{
  onChange: (value: string) => void,
  rows: number,
  text: string | undefined,
  setText: (text: string) => void,
  error: string,
  completions: Completions,
}>(), {rows: 20});

const editorText = ref(myProps.text || "");

const extensions = computed(() => [
  basicSetup,
  TOC_LANG({ idents: myProps.completions.idents }),
  TOC_LANG_HIGHLIGHT,
]);

watch(editorText, (newVal) => {
  myProps.setText(newVal);
  myProps.onChange(newVal);
});

const handleLoad = async () => {
  const file = await fileOpen();
  const fileText = await file.text();
  editorText.value = fileText;
  myProps.setText(fileText);
  myProps.onChange(fileText);
};

const handleSave = async () => {
  await fileSave(new Blob([editorText.value], { type: "text/plain" }), {
    fileName: "document.txt",
    extensions: [".txt"],
  });
};

const examplesByType = {
  conflict: exampleEvaporatingCloudText,
  goal: exampleGoalTreeText,
  problem: exampleProblemTreeText,
};

async function handleSelectExample(example: string) {
  if (example in examplesByType) {
    const exampleText = examplesByType[example as keyof typeof examplesByType];
    editorText.value = exampleText;
    myProps.setText(exampleText);
    myProps.onChange(exampleText);
  }
}

onMounted(() => handleSelectExample("goal"));
</script>

<template>
  <div class="editor">
    <FileControls
      :onLoad="handleLoad"
      :onSave="handleSave"
      :onSelectExample="handleSelectExample"
    />
    <Codemirror
      v-model="editorText"
      :extensions="extensions"
      style="height: 80vh"
    />
    <p :class="['edit-result', {error: myProps.error}]">
      {{myProps.error}}
    </p>
  </div>
</template>

<style scoped>
.edit-result {
  border-radius: 0.5em;
  -moz-border-radius: 0.5em;
  padding: 0.5em 1em;
  min-height: 3em;
}
.error {
  background-color: orange;
}
</style>
