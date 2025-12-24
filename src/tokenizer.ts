export type TokenType =
  | "IDENT"
  | "STRING"
  | "COLON"
  | "ARROW_LEFT"
  | "ARROW_RIGHT"
  | "ARROW_BI"
  | "AND"
  | "LBRACE"
  | "RBRACE"
  | "COMMENT"
  | "EOL"
  | "EOF";

type Location = {
  start: number,
  end: number,
  line: number,
  col: number,
};

export type Token = Location & {type: TokenType};

export const EOF: Token = {
  type: "EOF",
  start: -1,
  end: -1,
  line: -1,
  col: -1,
};

export class SyntaxError extends Error {
  token: Location;
  constructor(message: string, token: Location) {
    super(message);
    this.name = "SyntaxError";
    this.token = token;
  }
}

class Tokenizer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private col: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  private peek(offset: number = 0): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : "";
  }

  private advance(): string {
    const char = this.input[this.position];
    this.position++;
    if (char === "\n") {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return char;
  }

  private readWhile(predicate: (char: string) => boolean): string {
    let result = "";
    while (this.position < this.input.length && predicate(this.peek())) {
      result += this.advance();
    }
    return result;
  }

  *tokenize(): Generator<Token> {
    while (this.position < this.input.length) {
      const char = this.peek();
      const start = this.position;
      const startLine = this.line;
      const startCol = this.col;

      if (char === " " || char === "\t") {
        // skip whitespaces
        this.advance();
        continue;
      }

      if (char === "\n" || char === "\r") {
        this.advance();
        if (char === "\r" && this.peek() === "\n" || char === "\n" && this.peek() === "\r") {
          this.advance();
        }
        yield {
          type: "EOL",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "#") {
        this.readWhile((c) => c !== "\n" && c !== "\r");
        yield {
          type: "COMMENT",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === '"') {
        this.advance(); // skip opening quote
        while (this.position < this.input.length && this.peek() !== '"' && this.peek() != "") {
          this.advance();
        }
        if (this.peek() === '"') {
          this.advance(); // skip closing quote
        }
        yield {
          type: "STRING",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === ":") {
        this.advance();
        yield {
          type: "COLON",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "<" && this.peek(1) === "-") {
        this.advance();
        this.advance();
        yield {
          type: "ARROW_LEFT",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "-" && this.peek(1) === ">") {
        this.advance();
        this.advance();
        yield {
          type: "ARROW_RIGHT",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "-" && this.peek(1) === "-") {
        this.advance();
        this.advance();
        yield {
          type: "ARROW_BI",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "&" && this.peek(1) === "&") {
        this.advance();
        this.advance();
        yield {
          type: "AND",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "{") {
        this.advance();
        yield {
          type: "LBRACE",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      if (char === "}") {
        this.advance();
        yield {
          type: "RBRACE",
          start,
          end: this.position,
          line: startLine,
          col: startCol,
        };
        continue;
      }

      const re = /[a-zA-Z0-9_'*&()]/;
      if (!re.test(char)) { // Unknown character
        throw new SyntaxError(`Unknown character: ${char}`, {
          start: this.position,
          end: this.position,
          line: startLine,
          col: startCol,
        });
      }
      this.readWhile(c => re.test(c));
      yield {
        type: "IDENT",
        start,
        end: this.position,
        line: startLine,
        col: startCol,
      };
    }

    yield EOF;
  }
}

export function tokenize(input: string): Token[] {
  const tokenizer = new Tokenizer(input);
  return Array.from(tokenizer.tokenize());
}
