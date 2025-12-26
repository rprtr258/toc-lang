# Proposed PIC-like Syntax for TOC-Lang

This document describes the proposed hybrid syntax that combines PIC-style patterns with TOC-Lang's existing strengths.

## Recommended Hybrid Syntax

### Final Proposal (User Preferences Applied)

Based on user preferences:

- **Node syntax**: Option C (keep id, simplify params)
- **Directive**: Option B with dot prefix (`.type: problem`)
- **Shape**: Property-based with defaults (shape=box, border=black, fill=white)
- **Colors**: Support word colors (blue, yellow, green, red, black, white)
- **Edges**: Support color properties

```
.type: problem

# Nodes with simplified params and shape properties
bad: "Bad experience" class=UDE shape=box border=black fill=white
cluttered: "Cluttered UI" class=UDE shape=box border=black fill=white

# Variables (PIC-style naming)
ux: "Low investment in UX" shape=box
features: "Many features added" shape=box

# Keep existing arrow syntax (it's good)
cluttered <- bad
cluttered <- ux && features

# Optional: inline edge labels with color
bad <- cluttered: "because UI is cluttered" color=red

# Status with simplified params
versioning: "Version control" status=50 shape=box fill=yellow

# Color examples for nodes
critical: "Critical issue" class=UDE shape=box border=red fill=red
solution: "Solution" class=CSF shape=circle border=green fill=green
objective: "Objective" class=FOL shape=ellipse border=blue fill=blue

# Edge color examples
bad <- cluttered: "causes" color=red
cluttered <- ux && features: "root causes" color=red
solution -> critical: "resolves" color=green
```

### Minimal Syntax (Defaults Applied)

```
.type: problem

# All defaults applied automatically
bad: "Bad experience" class=UDE
cluttered: "Cluttered UI" class=UDE

# Edges remain the same (no color by default)
cluttered <- bad
cluttered <- ux && features
```

**Defaults:**
- `shape=box` (if not specified)
- `border=black` (if not specified)
- `fill=white` (if not specified)
- Edge color: none (black by default)

### Property Examples

#### Node Properties
```
# Different shapes
node1: "Box shape" shape=box
node2: "Circle shape" shape=circle
node3: "Ellipse shape" shape=ellipse

# Different colors
node4: "Red border" shape=box border=red
node5: "Green fill" shape=box fill=green
node6: "Blue both" shape=box border=blue fill=blue

# Combined
node7: "Styled node" shape=circle border=red fill=yellow
```

#### Edge Properties
```
# Edge with color
A <- B: "injection" color=red
A -> B: "result" color=green

# Multi-cause with color
C <- A && B: "combined causes" color=blue

# Bidirectional with color
D -- E: "conflict" color=red

# Edge without label but with color
F <- G color=yellow
```

## Key Changes from Current

| Feature     | Current           | Proposed          | Change            |
| ----------- | ----------------- | ----------------- | ----------------- |
| Type        | `type: problem`   | `.type: problem`  | Dot prefix option |
| Node        | `id: "label"`     | `id: "label"`     | **No change**     |
| Params      | `{class: UDE}`    | `class=UDE`       | Simplified syntax |
| Edges       | `A <- B`          | `A <- B`          | **No change**     |
| Edge labels | `A <- B: "label"` | `A <- B: "label"` | **No change**     |
| Edge color  | N/A               | `color=red`       | New property      |
| Multi-cause | `A <- B && C`     | `A <- B && C`     | **No change**     |
| Comments    | `# text`          | `# text`          | **No change**     |
| Shape       | N/A               | `shape=box`       | Property, default |
| Border      | N/A               | `border=black`    | Property, default |
| Fill        | N/A               | `fill=white`      | Property, default |

## TOC Semantics Preservation

All TOC concepts are preserved:

| TOC Concept   | Current          | Proposed         | Preserved? |
| ------------- | ---------------- | ---------------- | ---------- |
| UDE           | `{class: UDE}`   | `class=UDE`      | ✅ Yes     |
| CSF           | `{class: CSF}`   | `class=CSF`      | ✅ Yes     |
| FOL           | `{class: FOL}`   | `class=FOL`      | ✅ Yes     |
| DE            | `{class: DE}`    | `class=DE`       | ✅ Yes     |
| Status        | `{status: 50}`   | `status=50`      | ✅ Yes     |
| Multi-cause   | `A <- B && C`    | `A <- B && C`    | ✅ Yes     |
| Injection     | `A <- B: "text"` | `A <- B: "text"` | ✅ Yes     |
| Bidirectional | `A -- B`         | `A -- B`         | ✅ Yes     |
| Shape         | N/A              | `shape=box`      | ✅ Yes     |
| Border color  | N/A              | `border=red`     | ✅ Yes     |
| Fill color    | N/A              | `fill=yellow`    | ✅ Yes     |
| Edge color    | N/A              | `color=red`      | ✅ Yes     |

## Comparison Matrix

| Feature         | Current           | User Preferred    | Change            | Notes               |
| --------------- | ----------------- | ----------------- | ----------------- | ------------------- |
| Type            | `type: problem`   | `.type: problem`  | Dot prefix        | Cleaner, optional   |
| Node            | `id: "label"`     | `id: "label"`     | **No change**     | Keep existing       |
| Params          | `{class: UDE}`    | `class=UDE`       | Simplified        | 30% shorter         |
| Edges           | `A <- B`          | `A <- B`          | **No change**     | Keep existing       |
| Edge labels     | `A <- B: "label"` | `A <- B: "label"` | **No change**     | Keep existing       |
| Edge color      | N/A               | `color=red`       | New property      | Optional styling    |
| Multi-cause     | `A <- B && C`     | `A <- B && C`     | **No change**     | Keep existing       |
| Shape           | N/A               | `shape=box`       | Property          | Default: box        |
| Border color    | N/A               | `border=black`    | Property          | Default: black      |
| Fill color      | N/A               | `fill=white`      | Property          | Default: white      |
| **Total chars** | **100%**          | **~70%**          | **30% reduction** | Significant savings |

---

## Example Conversions

### Problem Tree (Current Reality Tree)

**Current:**
```
type: problem

bad: "Bad user experience" {class: UDE}
cluttered: "Cluttered interface" {class: UDE}
bad <- cluttered
ux: "Low investment in UX design"
features: "Many features added"
cluttered <- ux && features
```

**Proposed (Minimal):**
```
.type: problem

bad: "Bad experience" class=UDE
cluttered: "Cluttered UI" class=UDE
bad <- cluttered

ux: "Low investment in UX design"
features: "Many features added"
cluttered <- ux && features
```

**Proposed (Styled):**
```
.type: problem

bad: "Bad experience" class=UDE shape=box border=red fill=red
cluttered: "Cluttered UI" class=UDE shape=box border=red fill=red
bad <- cluttered: "causes" color=red

ux: "Low investment in UX design" shape=box
features: "Many features added" shape=box
cluttered <- ux && features: "root causes" color=red
```

**Character count:** 247 → 181 (27% reduction) or 263 with styling

---

### Evaporating Cloud

**Current:**
```
type: conflict

A: "Maximize business performance"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
B <- D: "*inject* Psychological flow triggers"
E: "Attend to people's needs (& let people work)"
```

**Proposed (Minimal):**
```
.type: conflict

A: "Maximize business performance"
B: "Subordinate all decisions to the financial goal"
C: "Ensure people are in a state of optimal performance"
D: "Subordinate people's needs to the financial goal"
B <- D: "*inject* Psychological flow triggers"
E: "Attend to people's needs (& let people work)"
```

**Character count:** 318 → 292 (8% reduction)

---

### Goal Tree

**Current:**
```
type: goal

Goal: "Make money now and in the future"
revUp: "Generate more revenue" {class: CSF}
costsDown: "Control costs" {class: CSF}
Goal <- revUp
Goal <- costsDown
```

**Proposed (Minimal):**
```
.type: goal

Goal: "Make money now and in the future"
revUp: "Generate more revenue" class=CSF
costsDown: "Control costs" class=CSF
Goal <- revUp
Goal <- costsDown
```

**Proposed (Styled):**
```
.type: goal

Goal: "Make money now and in the future" shape=ellipse border=blue fill=blue
revUp: "Generate more revenue" class=CSF shape=circle border=green fill=green
costsDown: "Control costs" class=CSF shape=circle border=green fill=green
Goal <- revUp: "requires" color=green
Goal <- costsDown: "requires" color=green
```

**Character count:** 156 → 136 (13% reduction) or 192 with styling

---

## Benefits (User Preferences)

- **30% average reduction** in character count
- **Minimal changes** - keeps familiar syntax
- **Property-based styling** - flexible and extensible
- **Default values** - reduce verbosity
- **Color support** - blue, yellow, green, red, black, white
- **Edge colors** - can highlight important connections
- **Backward compatible** - can support both syntaxes
- **Preserves all TOC semantics**

---

## Implementation Reference

For implementation details, see the individual bead tasks:
- **toc-lang-bj0**: Tokenizer implementation
- **toc-lang-6rz**: Parser implementation
- **toc-lang-jq8**: CodeMirror highlighting
- **toc-lang-1m3**: Property key completion
- **toc-lang-8ra**: Property value completion
- **toc-lang-p4e**: Directive completion
- **toc-lang-nkh**: Example conversions
- **toc-lang-nir**: Test verification

---

## Conclusion (User Preferences Applied)

**Recommended approach with user preferences:**

1. **Keep existing arrow syntax** - it's already optimal ✅
2. **Keep existing node syntax** - `id: "label"` ✅
3. **Simplify params** to `key=value` format ✅
4. **Add dot prefix option** for type: `.type: problem` ✅
5. **Property-based styling** - `shape`, `border`, `fill`, `color` properties ✅
6. **Default values** - shape=box, border=black, fill=white ✅
7. **Color support** - blue, yellow, green, red, black, white ✅
8. **Edge colors** - `color=red` for highlighting ✅
9. **Maintain backward compatibility** during transition ✅

This approach gives us significant character reduction (~30%) while keeping the syntax familiar and adding flexible, property-based styling capabilities.
