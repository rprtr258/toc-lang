# PIC Language Syntax Research

This document researches the PIC (Picture) language syntax patterns that inspired the proposed TOC-Lang syntax changes.

## PIC (Picture) Language Basics

PIC is a troff preprocessor for drawing pictures. Key patterns:

```
# Basic shapes
box "label"
circle "label"
ellipse "label"

# Positioning
arrow left 200% from last box
arrow left from A to B

# Variables
ux: box "Low UX investment"
features: box "Many features"

# Multi-cause (implicit AND)
arrow left from ux && features
```

## Key PIC Features for TOC-Lang Adaptation

1. **Shape-based nodes**: `box "label"` instead of `id: "label"`
2. **Directive-style**: `.problem` instead of `type: problem`
3. **Positioning**: `arrow left from last box` or `arrow left from A to B`
4. **Variables**: `ux: box "..."` for named references
5. **Inline labels**: `arrow left "because" from A to B`
6. **Multi-cause**: `from A && B to C` (already similar)

## Research Sources

### PIC Language
- Original troff PIC preprocessor
- Used for technical diagrams
- Shape-based drawing language
- Positioning and flow control

### Similar Syntaxes
- **Graphviz DOT**: `A -> B [label="text"]`
- **Mermaid**: `A-->B`
- **PlantUML**: `A --> B : label`
- **PIC**: `arrow from A to B`

### Why PIC-like?
- More visual than DOT
- More concise than PlantUML
- Better positioning control than Mermaid
- Fits TOC diagram flow naturally

## Key Takeaways

1. **Shape keywords** (`box`, `circle`) add visual clarity
2. **Simplified params** (`class=UDE`) reduce verbosity
3. **Directive style** (`.problem`) is cleaner
4. **Keep existing arrows** - they're already good
5. **Hybrid approach** maintains compatibility
