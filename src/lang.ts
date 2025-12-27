import {
  LanguageSupport,
  HighlightStyle,
  syntaxHighlighting,
  defaultHighlightStyle,
  StreamLanguage,
} from "@codemirror/language";
import type {
  CompletionSource,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import {tags as t} from "@lezer/highlight";
import {Completion} from "./interpreter.ts";

export function myLanguage(idents: string[]) {
  return StreamLanguage.define<undefined>({
    startState() { return undefined; },
    token(stream, state: undefined): keyof typeof t {
      void(state);
      if (stream.match(/^#.*/) === true) return "lineComment";
      if (stream.match(":") === true) return "punctuation";
      if (stream.match(/^(->|<-|--)/) === true) return "arithmeticOperator";
      if (stream.match("type") === true) return "keyword";
      if (stream.match(/^[{}]/) === true) return "brace";
      if (idents.find(ident => stream.match(ident) === true) !== undefined) return "variableName";
      if (stream.match('"', false) === true && stream.match(/^"[^"]*"/) === true) return "string";

      stream.eat(/./);
      return "name";
    },
  });
}

export const TOC_LANG_HIGHLIGHT = syntaxHighlighting(HighlightStyle.define([
  ...defaultHighlightStyle.specs,
  {tag: t.punctuation, color: "#99b"},
  {tag: t.arithmeticOperator, color: "#686"},
  {tag: t.variableName, color: "#55a"},
  {tag: t.string, color: "#677", fontStyle: "italic"},
], {themeType: "light"}));

export function TOC_LANG(completions: Completion[]): LanguageSupport {
  completions.sort((a: Completion, b: Completion) => a.id.localeCompare(b.id));
  const autocomplete: CompletionSource = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (word !== null && word.from === word.to && !context.explicit) {
      return null;
    }
    return {
      from: word?.from ?? context.pos,
      options: completions.map(({id, text}) => ({label: id, type: "variable", info: text})),
      validFor: /^(\w+)?$/,
    };
  };
  const idents = completions.map(c => c.id);
  const lang = myLanguage(idents);
  return new LanguageSupport(lang, [lang.data.of({autocomplete})]);
}