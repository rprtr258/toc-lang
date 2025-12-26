# TOC-Lang Language Reference

This document describes the complete syntax for TOC-Lang, including the new PIC-like syntax with styling properties and backward-compatible legacy syntax.

---

## Type Declaration

### New Syntax (Recommended)

**Syntax:** `.type: problem` | `.type: conflict` | `.type: goal`

**Characteristics:**

- Directive format with leading dot
- Key-value format with colon
- Required at top level
- Only one allowed
- Valid values: `problem`, `conflict`, `goal`

**Example:**

```
.type: problem
```

### Legacy Syntax (Still Supported)

**Syntax:** `type: problem` | `type: conflict` | `type: goal`

**Example:**

```
type: problem
```

---

## Node Syntax

### New Syntax (Recommended)

**Syntax:** `id: "label" key=value key=value ...`

**Characteristics:**

- Label in double quotes
- Optional properties in `key=value` format
- Properties can be in any order
- Multiple properties separated by spaces

**Supported Properties:**

- `class` - Node annotation (UDE, CSF, FOL, DE, NC, G)
- `status` - Percentage status (0-100) - affects goal tree coloring
- `shape` - Visual shape: `box`, `circle`, `diamond`
- `fill` - Fill color (see Colors section)
- `border` - Border color (see Colors section)

**Examples:**

```
# Basic node
bad: "Bad user experience"

# With class annotation
bad: "Bad user experience" class=UDE

# With styling
critical: "Critical issue" class=UDE shape=circle border=red fill=red

# Goal tree with status
revenue: "Increase revenue" class=CSF status=85 fill=green
```

### Legacy Syntax (Still Supported)

**Syntax:** `id: "label" {key: value, key2: value2}`

**Example:**

```
bad: "Bad user experience" {class: UDE}
revenue: "Increase revenue" {class: CSF, status: 85}
```

### Mixed Syntax

Both syntaxes can be used together:

```
.type: problem
bad: "Bad" class=UDE
cluttered: "Cluttered" {class: UDE}
bad <- cluttered
```

---

## Edge Syntax

### Single Cause (Left Arrow)

**Syntax:** `toId <- fromId: "label"? color=color?`

**Examples:**

```
bad <- cluttered
bad <- cluttered: "caused by"
bad <- cluttered: "caused by" color=red
```

### Multi-Cause (Left Arrow)

**Syntax:** `toId <- fromId && fromId2 && ...: "label"? color=color?`

**Example:**

```
cluttered <- ux && features
cluttered <- ux && features: "combined" color=blue
```

### Single Cause (Right Arrow)

**Syntax:** `fromId -> toId: "label"? color=color?`

**Example:**

```
cluttered -> bad
cluttered -> bad: "causes" color=red
```

### Multi-Cause (Right Arrow)

**Syntax:** `fromId && fromId2 -> toId: "label"? color=color?`

**Example:**

```
ux && features -> cluttered
ux && features -> cluttered: "combined" color=blue
```

### Bidirectional Edge

**Syntax:** `fromId -- toId: "label"? color=color?`

**Example:**

```
D -- E
D -- E: "conflict" color=red
```

---

## Colors

### Valid Color Names (lowercase only)

- `black`, `white`, `red`, `green`, `blue`, `yellow`, `orange`, `purple`, `pink`

### Valid Hex Colors

- 6-digit hex: `#000000`, `#ff0000`, `#00ff00`, `#0000ff`, `#ffff00`

### Predefined Light Colors

- `#ffb2b2` (light red), `#95f795` (light green), `#fdfdbe` (light yellow), `#dff8ff` (light blue)

**Note:** Color names are case-sensitive and must be lowercase. `RED`, `Blue`, etc. will throw errors.

---

## Shapes

### Valid Shapes

- `box` - Rectangle with rounded corners (default)
- `circle` - Ellipse
- `diamond` - Diamond shape

**Note:** Shapes are only supported in tree diagrams (problem, goal). Evaporating clouds always use rectangles.

---

## Comments

**Syntax:** `# comment text`

**Characteristics:**

- Single line only
- Starts with `#`
- Rest of line is comment

**Example:**

```
.type: problem
# This is a root cause
cause: "Root cause"
```

---

## Diagram Types

### Problem Tree (Current Reality Tree)

- **Type:** `.type: problem`
- **Flow:** Bottom-to-top (causes → effects)
- **Annotations:** UDE, FOL, DE
- **Multi-cause:** Creates intermediate AND nodes

**Example:**

```
.type: problem

# UDEs (Undesirable Effects)
bad: "Bad user experience" class=UDE
cluttered: "Cluttered interface" class=UDE

# Root causes
ux: "Low investment in UX design"
features: "Many features added"

# Relationships
bad <- cluttered
cluttered <- ux && features
```

### Goal Tree

- **Type:** `.type: goal`
- **Flow:** Bottom-to-top (requirements → goals)
- **Annotations:** G, CSF, NC
- **Status:** Supports percentage status (0-100)
- **Coloring:** Status-based when no fill specified (70%+ = green, 30-70% = yellow, <30% = red)

**Example:**

```
.type: goal

Goal: "Achieve market leadership"
Revenue: "Increase revenue" class=CSF status=85 fill=green
Quality: "Maintain uptime" class=CSF status=92 fill=blue
Speed: "Ship features" class=NC status=65 fill=orange

Goal <- Revenue: "primary"
Goal <- Quality: "secondary"
Goal <- Speed: "supporting"
```

### Evaporating Cloud

- **Type:** `.type: conflict`
- **Nodes:** A, B, C, D, E (fixed positions)
- **Flow:** A → B, A → C, B → D, C → E, D ↔ E
- **Annotations:** Injection labels on edges

**Example:**

```
.type: conflict

A: "Maximize business performance"
B: "Subordinate to financial goal"
C: "Ensure optimal performance"
D: "Subordinate people's needs"
E: "Attend to people's needs"

A <- D: "inject Psychological flow triggers"
D -- E: "Discover they don't conflict"
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
  biDirectional?: true,
  color?: string
}
```

### Directive AST

```typescript
{
  type: "directive",
  id: string,
  value: string
}
```

### Type AST (Legacy)

```typescript
{
  type: "type",
  value: string
}
```

---

## Semantics

### Tree Semantics (Problem & Goal)

```typescript
{
  rankdir: "BT",  // Bottom to Top
  nodes: Record<NodeID, {
    id: string,
    label: string,
    annotation?: string,
    statusPercentage?: number,
    intermediate?: true,
    shape: "box" | "circle" | "diamond",
    fill: Color,
    border: Color,
  }>,
  edges: Array<{
    from: string,
    to: string,
    color: Color,
  }>
}
```

### Intermediate Nodes

Multi-cause edges create intermediate AND nodes:

- ID: `{cause1}_{cause2}_cause_{effect}`
- Label: "AND"
- Shape: circle
- Intermediate: true

---

## Migration Guide

### From Old to New Syntax

| Old Syntax                           | New Syntax                               |
| ------------------------------------ | ---------------------------------------- |
| `type: problem`                      | `.type: problem`                         |
| `bad: "Bad" {class: UDE}`            | `bad: "Bad" class=UDE`                   |
| `bad: "Bad" {class: UDE, fill: red}` | `bad: "Bad" class=UDE fill=red`          |
| `bad <- cluttered`                   | `bad <- cluttered` (unchanged)           |
| `bad <- cluttered: "causes"`         | `bad <- cluttered: "causes"` (unchanged) |

### Key Differences

1. **Type declaration:** Add dot prefix (`.type:`)
2. **Node params:** Remove braces, use `key=value` format
3. **Colors:** Must be lowercase
4. **Properties:** Can be in any order
5. **Edge colors:** Now supported with `color=value`

---

## Complete Examples

### Problem Tree with Styling

```
.type: problem

# Critical issues (red)
critical: "Critical failure" class=UDE shape=circle border=red fill=red
blocked: "User blocked" class=UDE fill=red

# Minor issues (orange)
minor: "Minor annoyance" class=UDE fill=orange

# Root causes (blue)
backend: "Slow backend" shape=diamond border=blue fill=blue
network: "Poor network" shape=diamond border=blue fill=blue

# Relationships
critical <- blocked
blocked <- backend && network: "caused by" color=blue
minor <- backend
```

### Goal Tree with Status

```
.type: goal

Goal: "Market leadership"
Revenue: "50% growth" class=CSF status=85 fill=green border=green
Quality: "99.9% uptime" class=CSF status=92 fill=green border=green
Speed: "Faster shipping" class=NC status=65 fill=orange border=orange

Goal <- Revenue: "primary" color=red
Goal <- Quality: "secondary"
Goal <- Speed: "supporting"
```

### Evaporating Cloud

```
.type: conflict

A: "Maximize performance"
B: "Focus on finances"
C: "Focus on people"
D: "Cut costs"
E: "Invest in people"

A <- B: "Constraint"
A <- C: "Constraint"
B <- D
C <- E
D -- E: "Conflict resolution"
```
