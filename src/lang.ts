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
      if (stream.match(/^#.*/)) return "lineComment";
      if (stream.match(":")) return "punctuation";
      if (stream.match(/^(->|<-|--)/)) return "arithmeticOperator";
      if (stream.match("type")) return "keyword";
      if (stream.match(/^[{}]/)) return "brace";
      if (idents.find(ident => stream.match(ident))) return "variableName";
      if (stream.match('"', false) && stream.match(/^"[^"]*"/)) return "string";

      stream.eat(/./);
      return "name";
    },
  });
}

// export const TocLangLanguage = LRLanguage.define({
//   parser: parser.configure({
//     props: [
//       indentNodeProp.add({
//         Application: delimitedIndent({closing: "}", align: false}),
//       }),
//       foldNodeProp.add({
//         Application: foldInside,
//       }),
//       styleTags({
//         Ident: t.variableName,
//         Boolean: t.bool,
//         String: t.string,
//         Label: t.string,
//         ":": t.punctuation,
//         "->": t.arithmeticOperator,
//         "--": t.arithmeticOperator,
//         "<-": t.arithmeticOperator,
//         LineComment: t.lineComment,
//         "{ }": t.brace,
//       }),
//     ],
//   }),
//   languageData: {
//     commentTokens: {line: "#"},
//   },
// });

export const TOC_LANG_HIGHLIGHT = syntaxHighlighting(
  HighlightStyle.define(
    [
      ...defaultHighlightStyle.specs,
      {tag: t.punctuation, color: "#99b"},
      {tag: t.arithmeticOperator, color: "#686"},
      {tag: t.variableName, color: "#55a"},
      {tag: t.string, color: "#677", fontStyle: "italic"},
    ],
    {themeType: "light"},
  ),
);

export function TOC_LANG(completions: Completion[]): LanguageSupport {
  completions.toSorted((a: Completion, b: Completion) => a.id.localeCompare(b.id));
  const autocomplete: CompletionSource = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (word !== null && word.from === word.to && !context.explicit) {
      return null;
    }
    return {
      from: word?.from || context.pos,
      options: completions.map(({id, text}) => ({label: id, type: "variable", info: text})),
      validFor: /^(\w+)?$/,
    };
  };
  const idents = completions.map(c => c.id);
  const lang = myLanguage(idents);
  return new LanguageSupport(lang, [lang.data.of({autocomplete})]);
}