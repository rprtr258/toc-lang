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

function isTrue(value: boolean | RegExpMatchArray | null): value is true {
  if (value === null) return false;
  if (typeof value === "boolean") return value;
  return value.length > 0;
}

export function myLanguage(idents: string[]) {
  return StreamLanguage.define<undefined>({
    startState() {
      return undefined;
    },
    token(stream, state: undefined): keyof typeof t {
      void state;

      // Comments
      if (isTrue(stream.match(/^#.*/))) return "lineComment";

      // Punctuation
      if (isTrue(stream.match(":"))) return "punctuation";

      // Arrows
      if (isTrue(stream.match(/^(->|<-|--)/))) return "arithmeticOperator";
      if (isTrue(stream.match("type"))) return "keyword";
      if (isTrue(stream.match(/^[{}]/))) return "brace";
      if (idents.find(ident => isTrue(stream.match(ident))) !== undefined) return "variableName";
      if (isTrue(stream.match('"', false)) && isTrue(stream.match(/^"[^"]*"/))) return "string";

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
  // to highlight "lol_kek" before "lol"
  completions.sort((a: Completion, b: Completion) => -a.id.localeCompare(b.id));

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
