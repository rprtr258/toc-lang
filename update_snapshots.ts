#!/usr/bin/env bun
/**
 * Update snapshot files for tests
 *
 * This script regenerates all .json snapshot files
 * based on the current parser and interpreter implementation.
 */

import {mkdirSync, rmSync, writeFileSync} from "fs";
import {styleText} from "util";
import {
  parseTextToAst,
  parseProblemTreeSemantics,
  parseGoalTreeSemantics,
} from "./src/interpreter.ts";
import {examples} from "./src/examples.ts";
import {problemTreeTestcases, evaporatingCloudTestcases, goalTreeTestcases} from "./src/testcases.ts";

type Json = string | number | boolean | null | Json[] | {[k: string]: Json};

function canonicalize(obj: unknown): Json {
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean" || obj === null) {
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  } else if (obj instanceof Object) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]): [string, Json] => [key, canonicalize(value)]).toSorted());
  } else {
    throw new Error(`Unexpected type ${typeof obj}`);
  }
}

function json(obj: unknown): string {
  return JSON.stringify(canonicalize(obj), undefined, 2);
}

type RunEvent =
  | {type: "start_group", name: string}
  | {type: "test", name: string, filename: string, data: unknown}
  | {type: "end_group"};

function* run(): Generator<RunEvent> {
  yield {type: "start_group", name: "problem tree testcases"};
  for (const testCase of problemTreeTestcases) {
    const ast = parseTextToAst(testCase.text);
    yield {type: "test", name: testCase.name, filename: `parses ast for input ${testCase.name}`, data: ast};
  };
  yield {type: "end_group"};

  yield {type: "start_group", name: "evaporating cloud testcases"};
  for (const testCase of evaporatingCloudTestcases) {
    const ast = parseTextToAst(testCase.text);
    yield {type: "test", name: testCase.name, filename: `${testCase.name}.ec`, data: ast};
  };
  yield {type: "end_group"};

  yield {type: "start_group", name: "goal tree testcases"};
  for (const testCase of goalTreeTestcases) {
    const ast = parseTextToAst(testCase.text);
    yield {type: "test", name: testCase.name, filename: `${testCase.name}.gt`, data: ast};
  };
  yield {type: "end_group"};

  yield {type: "start_group", name: "problem tree example"};
  for (const example of examples.find(([group]) => group === "Current Reality Tree")![1]) {
    const ast = parseTextToAst(example.text);
    const semantics = parseProblemTreeSemantics(ast);
    yield {type: "test", name: example.name, filename: `example problem tree: ${example.name}`, data: {ast, semantics}};
  };
  yield {type: "end_group"};

  yield {type: "start_group", name: "evaporating cloud example"};
  for (const example of examples.find(([group]) => group === "Evaporating Cloud")![1]) {
    const ast = parseTextToAst(example.text);
    yield {type: "test", name: example.name, filename: `example evaporating cloud: ${example.name}`, data: ast};
  };
  yield {type: "end_group"};

  yield {type: "start_group", name: "goal tree example"};
  for (const example of examples.find(([group]) => group === "Goal Tree")![1]) {
    const ast = parseTextToAst(example.text);
    const semantics = parseGoalTreeSemantics(ast);
    yield {type: "test", name: example.name, filename: `example goal tree: ${example.name}`, data: {ast, semantics}};
  };
  yield {type: "end_group"};
}

rmSync("./src/__tests__/", {recursive: true, force: true});
mkdirSync("./src/__tests__/");
for (const e of run()) {
  switch (e.type) {
    case "start_group":
      console.log(`Updating ${e.name} snapshots...`);
      break;
    case "end_group":
      console.log("");
      break;
    case "test":
      writeFileSync(`src/__tests__/${e.filename}.json`, json(e.data) + "\n");
      console.log(`  ${styleText("greenBright", "✓")} ${e.name}`);
      break;
  }
}
console.log(`${styleText("greenBright", "✅")} All snapshots updated!`);
