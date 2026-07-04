<script setup lang="ts">
import {ref} from "vue";
import type {Diagnostic} from "@codemirror/lint";
import Editor from "./Editor.vue";
import Diagram from "./Diagram.vue";
import {
  parseTextToAst,
  parseGoalTreeSemantics,
  parseProblemTreeSemantics,
  type TreeSemantics,
  Completion,
  cloudDefaultLabels,
} from "./interpreter.ts";
import {Ast, DiagramType} from "./parser.ts";
import {SyntaxError} from "./tokenizer.ts";

const completions = ref<Completion[]>([]);

const ast = ref<Ast | null>(null);
const semantics = ref<TreeSemantics | null>(null);
const diagnostics = ref<Diagnostic[]>([]);
const text = ref<string>("");
const diagramType = ref<DiagramType | null>(null);

const containerRef = ref<HTMLElement | null>(null);
const splitPos = ref(33);
const dragging = ref(false);

function onSplitMouseDown(e: MouseEvent) {
  e.preventDefault();
  dragging.value = true;
  function onMove(ev: MouseEvent) {
    const rect = containerRef.value!.getBoundingClientRect();
    const pct = ((ev.clientX - rect.left) / rect.width) * 100;
    splitPos.value = pct;
  }
  function onUp() {
    dragging.value = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

const onEditorChange = (value: string) => {
  try {
    const parsedAst = parseTextToAst(value);
    switch (parsedAst.type) {
      case "goal": {
        const sem = parseGoalTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value = parsedAst.nodes;
        break;
      }
      case "problem": {
        const sem = parseProblemTreeSemantics(parsedAst);
        semantics.value = sem;
        completions.value = parsedAst.nodes;
        break;
      }
      default:
        semantics.value = null; // TODO: validate semantics
        completions.value = Object.entries(cloudDefaultLabels).map(([id, text]) => ({
          id,
          text: parsedAst.nodes.find(n => n.id === id)?.text ?? text,
        }));
    }
    ast.value = parsedAst;
    diagramType.value = parsedAst.type;
    diagnostics.value = [];
  } catch (e) {
    const err = e as SyntaxError;
    const diag: Diagnostic = {
      from: err.token.start - err.token.col,
      to: err.token.end ?? value.length,
      severity: "error",
      message: err.message,
    };
    diagnostics.value = [diag];
  }
};
</script>

<template>
  <div ref="containerRef" class="two-panes" :class="{dragging}">
    <div class="pane" :style="{width: splitPos + '%'}">
      <Editor
        :rows="20"
        :value="text"
        @update="v => {text = v; onEditorChange(v);}"
        :diagnostics="diagnostics"
        :completions="completions"
      />
    </div>
    <div
      class="splitter"
      @mousedown="onSplitMouseDown"
    ></div>
    <div class="pane" :style="{width: (100 - splitPos) + '%'}">
      <Diagram
        v-if="ast"
        :key="diagramType || 'none'"
        :ast="ast"
        :semantics="semantics"
        :diagramType="diagramType"
      />
      <div v-else>No AST</div>
    </div>
  </div>
</template>

<style scoped>
.two-panes {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.pane {
  min-height: 0;
  flex-shrink: 0;
  overflow: auto;
}
.splitter {
  flex-shrink: 0;
  width: 6px;
  cursor: col-resize;
  background: #ccc;
  transition: background 0.15s;
}
.splitter:hover,
.two-panes.dragging .splitter {
  background: #888;
}
</style>