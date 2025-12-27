# Current TOC-Lang Syntax

This document describes the current syntax patterns used in TOC-Lang.

## Type Declaration

**Syntax:** `type: problem` | `type: conflict` | `type: goal`

**Characteristics:**
- Key-value format
- Required at top level
- Only one allowed
- Valid values: `problem`, `conflict`, `goal`

**Example:**
```
type: problem
```

---

## Node Syntax

### Basic Node
**Syntax:** `id: "label"`

**Characteristics:**
- Identifier followed by colon
- Label in double quotes
- Optional parameters block

**Example:**
```
bad: "Bad user experience"
ux: "Low investment in UX design"
```

### Node with Parameters
**Syntax:** `id: "label" {key: value, key2: value2}`

**Characteristics:**
- Parameters in braces
- `key: value` pairs
- Values can be strings or identifiers
- Multiple parameters separated by newlines or commas

**Examples:**
```
bad: "Bad user experience" {class: UDE}
cluttered: "Cluttered interface" {class: UDE}
versioning: "Version control" {status: 50}
```

**Parameter Patterns:**
- `class: UDE` - Node annotation (UDE, CSF, FOL, DE)
- `status: 50` - Percentage status (0-100)

---

## Edge Syntax

### Single Cause (Left Arrow)
**Syntax:** `toId <- fromId`

**Example:**
```
bad <- cluttered
```

### Multi-Cause (Left Arrow)
**Syntax:** `toId <- fromId && fromId2 && ...`

**Example:**
```
cluttered <- ux && features
```

### Single Cause (Right Arrow)
**Syntax:** `fromId -> toId`

**Example:**
```
cluttered -> bad
```

### Multi-Cause (Right Arrow)
**Syntax:** `fromId && fromId2 -> toId`

**Example:**
```
ux && features -> cluttered
```

### Bidirectional Edge
**Syntax:** `fromId -- toId`

**Example:**
```
D -- E
```

### Edge with Label (Injection)
**Syntax:** `A <- B: "label"` or `A -> B: "label"` or `A -- B: "label"`

**Example:**
```
A <- D: "inject Psychological flow triggers"
D -- E: "Discover they don't conflict"
```

---

## Comments
**Syntax:** `# comment text`

**Characteristics:**
- Single line only
- Starts with `#`
- Rest of line is comment

**Example:**
```
# This is a comment
```

---

## AST Structure

### Node AST
```typescript
{
  type: "node",
  id: string,
  text: string,
  params: Record<string, string>
}
```

### Edge AST
```typescript
{
  type: "edge",
  fromIds: string[],
  toId: string,
  text?: string,
  biDirectional?: true
}
```

### Type AST
```typescript
{
  type: "type",
  value: string
}
```

---

## Syntax Patterns Summary

| Pattern | Current Syntax | Example |
|---------|---------------|---------|
| Type | `type: X` | `type: problem` |
| Node | `id: "label"` | `bad: "Bad experience"` |
| Node params | `{key: value}` | `{class: UDE, status: 50}` |
| Edge left | `to <- from` | `bad <- cluttered` |
| Edge right | `from -> to` | `cluttered -> bad` |
| Edge bi | `from -- to` | `D -- E` |
| Multi-cause | `&&` | `A <- B && C` |
| Edge label | `: "text"` | `A <- B: "label"` |
| Comment | `# text` | `# comment` |
