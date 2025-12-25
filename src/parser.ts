// Parser for TOC-Lang
import {EOF, SyntaxError, Token, tokenize, TokenType} from "./tokenizer.ts";

export type ParamsAst = Record<string, string>;

export type StatementAst =
| {
  type: "edge",
  id?: string,
  text?: string,
  fromIds: string[],
  toId: string,
  biDir?: boolean,
  params?: ParamsAst,
  biDirectional?: true,
}
| {
  type: "node",
  id: string,
  text: string,
  params: ParamsAst,
}
| {
  type: "type",
  value: string,
};

export type EDiagramType = "problem" | "conflict" | "goal";

export type AstNode = {
  id: string,
  text: string,
  params: ParamsAst,
};
export type AstEdge = {
  fromIds: string[],
  toId: string,
  text?: string,
  biDirectional?: true,
};
export interface Ast {
  type: EDiagramType,
  nodes: AstNode[],
  edges: AstEdge[],
}

class Parser {
  private tokens: Token[];
  private current: number = 0;
  private input: string;

  constructor(input: string) {
    this.input = input;
    this.tokens = tokenize(input);
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private advance(): Token {
    const token = this.tokens[this.current];
    if (!this.check("EOF")) this.current++;
    return token;
  }

  private check(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new SyntaxError(message, this.peek());
  }

  private value(tok: Token): string {
    if (tok.type === "STRING") return this.input.slice(tok.start + 1, tok.end - 1);
    return this.input.slice(tok.start, tok.end);
  }

  // type: ident
  private parseTypeStatement(): StatementAst {
    this.consume("IDENT", "Expected 'type'");
    this.consume("COLON", "Expected ':' after 'type'");
    const typeValue = this.consume("IDENT", "Expected type value");
    return {
      type: "type",
      value: this.value(typeValue),
    };
  }

  // # text
  private parseCommentLine(): void {
    this.consume("COMMENT", "Expected comment");
  }

  // ident : label params?
  private parseNodeStatement(): StatementAst {
    const id = this.value(this.consume("IDENT", "Expected identifier for node"));
    this.consume("COLON", "Expected ':' after node identifier");
    const label = this.parseLabel();
    const params = this.parseParamBlock();
    return {
      type: "node",
      id,
      text: label,
      params: params || {},
    };
  }

  private parseLabel(): string {
    if (!this.check("STRING")) {
      throw new SyntaxError("Expected label", this.peek());
    }
    return this.value(this.advance());
  }

  private parseParamBlock(): ParamsAst | null {
    if (!this.match("LBRACE")) return null;
    while (this.match("EOL"));
    const params: ParamsAst = {};
    while (!this.check("RBRACE") && !this.check("EOF")) {
      while (this.match("EOL"));
      if (this.check("RBRACE")) break;
      const key = this.value(this.consume("IDENT", "Expected parameter key"));
      this.consume("COLON", "Expected ':' in parameter");
      params[key] = this.parseExpression();
      while (this.match("EOL"));
    }
    this.consume("RBRACE", "Expected '}' after parameters");
    return params;
  }

  private parseExpression(): string {
    if (this.check("STRING")) {
      return this.value(this.advance());
    } else if (this.check("IDENT")) {
      return this.value(this.advance());
    } else {
      return this.value(this.consume("IDENT", "Expected expression"));
    }
  }

  private parseEdgeStatement(): StatementAst {
    if (this.check("IDENT") && this.peekAhead()?.type === "ARROW_LEFT") {
      return this.parseLeftEdge();
    } else if (this.check("IDENT") && this.peekAhead()?.type === "ARROW_RIGHT") {
      return this.parseRightEdge();
    } else if (this.check("IDENT") && this.peekAhead()?.type === "ARROW_BI") {
      return this.parseBiDirEdge();
    } else if (this.check("IDENT") && this.peekAhead()?.type === "AND") {
      return this.parseRightEdge();
    } else {
      throw new SyntaxError("Unexpected edge syntax", this.peek());
    }
  }

  private peekAhead(): Token {
    const idx = this.current + 1;
    return idx < this.tokens.length ? this.tokens[idx] : EOF;
  }

  private parseLeftEdge(): StatementAst {
    // toId <- fromIds && ... : label?
    const toId = this.value(this.consume("IDENT", "Expected target identifier"));
    this.consume("ARROW_LEFT", "Expected '<-'");
    const fromIds = this.parseIdentList();
    let label: string | undefined;
    if (this.match("COLON")) {
      label = this.parseLabel();
    }
    return {
      type: "edge",
      toId,
      fromIds,
      text: label,
    };
  }

  private parseRightEdge(): StatementAst {
    // fromIds && ... -> toId : label?
    const fromIds = this.parseIdentList();
    this.consume("ARROW_RIGHT", "Expected '->'");
    const toId = this.value(this.consume("IDENT", "Expected target identifier"));
    let label: string | undefined;
    if (this.match("COLON")) {
      label = this.parseLabel();
    }
    return {
      type: "edge",
      toId,
      fromIds,
      text: label,
    };
  }

  private parseBiDirEdge(): StatementAst {
    // fromId -- toId : label?
    const fromId = this.value(this.consume("IDENT", "Expected source identifier"));
    this.consume("ARROW_BI", "Expected '--'");
    const toId = this.value(this.consume("IDENT", "Expected target identifier"));
    let label: string | undefined;
    if (this.match("COLON")) {
      label = this.parseLabel();
    }
    return {
      type: "edge",
      toId,
      fromIds: [fromId],
      text: label,
      biDirectional: true,
    };
  }

  private parseIdentList(): string[] {
    const ids: string[] = [];
    ids.push(this.value(this.consume("IDENT", "Expected identifier")));
    while (this.match("AND")) {
      ids.push(this.value(this.consume("IDENT", "Expected identifier after '&&'")));
    }
    return ids;
  }

  private isEdgeStart(): boolean {
    const next = this.peekAhead().type;
    return ["ARROW_LEFT", "ARROW_RIGHT", "ARROW_BI", "AND"].includes(next);
  }

  *parseStatement(): Generator<StatementAst> {
    while (this.match("EOL"));

    if (this.check("EOF")) return;

    if (this.check("IDENT") && this.value(this.peek()) === "type") {
      yield this.parseTypeStatement();
      return;
    } else if (this.check("COMMENT")) {
      this.parseCommentLine();
      return;
    } else if (this.check("IDENT") && this.peekAhead()?.type === "COLON") {
      yield this.parseNodeStatement();
      return;
    } else if (this.check("IDENT") && this.isEdgeStart()) {
      yield this.parseEdgeStatement();
      return;
    } else if (this.check("EOF")) {
      return;
    } else {
      // Skip unknown tokens to next EOL
      while (!this.check("EOL") && !this.check("EOF")) {
        this.advance();
      }
      return;
    }
  }

  *parse(): Generator<StatementAst> {
    while (!this.check("EOF")) {
      const stmt = this.parseStatement();
      if (stmt) {
        yield* stmt;
      }
    }
  }
}

const zeroLocation = {col: 0, end: 0, line: 0, start: 0};

export function parse(input: string): Ast {
  const parser = new Parser(input);
  const statements: StatementAst[] = Array.from(parser.parse());

  const typeStatements: (StatementAst & {type: "type"})[] = [];
  const nodeStatements: (StatementAst & {type: "node"})[] = [];
  const edgeStatements: (StatementAst & {type: "edge"})[] = [];
  for (const s of statements) {
    switch (s.type) {
      case "type": typeStatements.push(s); break;
      case "node": nodeStatements.push(s); break;
      case "edge": edgeStatements.push(s); break;
      default: {const _: never = s; void(_);}
    }
  }

  const validTypes = ["problem", "conflict", "goal"];
  if (typeStatements.length > 1)
    throw new SyntaxError("Only one 'type' statement is allowed", zeroLocation);
  else if (typeStatements.length === 1 && !validTypes.includes(typeStatements[0].value))
    throw new SyntaxError(`Invalid type '${typeStatements[0].value}'. Must be one of: ${validTypes.join(", ")}`, zeroLocation);

  const parserType = (typeStatements.length === 1 ? typeStatements[0].value : "problem") as EDiagramType;
  return {
    type: parserType,
    nodes: nodeStatements.map(({id, text, params}) => ({id, text, params})),
    edges: edgeStatements.map(({fromIds, toId, text, biDirectional}) => {
      const res: AstEdge = {fromIds, toId};
      if (text) res.text = text;
      if (biDirectional) res.biDirectional = biDirectional;
      return res;
    }),
  };
}
