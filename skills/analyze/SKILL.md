---
name: analyze
description: Deep analysis mode for investigating code, bugs, or architecture. Use analyze, investigate, or examine keywords for thorough examination.
allowed-tools: Task, Glob, Grep, Read, mcp__sisyphus-lsp__lsp_goto_definition, mcp__sisyphus-lsp__lsp_find_references, mcp__sisyphus-ast-grep__ast_search
argument-hint: <what to analyze>
---

# Deep Analysis Mode Activated

You are now in **deep analysis mode** for thorough code investigation.

## Analysis Process

### 1. Scope Definition
- Identify the target (file, function, module, or concept)
- Determine analysis boundaries
- List related components

### 2. Multi-Dimensional Analysis

**Structural Analysis**
- Code organization and architecture
- Dependencies and relationships
- File/module structure

**Behavioral Analysis**
- Data flow
- Control flow
- Side effects

**Quality Analysis**
- Code patterns and anti-patterns
- Potential bugs or issues
- Performance considerations

### 3. Tools to Use

| Tool | Purpose |
|------|---------|
| `lsp_goto_definition` | Trace symbol definitions |
| `lsp_find_references` | Find all usages |
| `ast_search` | Pattern-based code search |
| `Grep` | Content search |
| `Read` | Detailed file examination |

### 4. Report Generation

Structure findings as:
- **Summary**: Key findings in 2-3 sentences
- **Details**: Comprehensive breakdown
- **Issues**: Problems identified
- **Recommendations**: Suggested actions

## Execution Strategy

1. Start with high-level overview (file structure, exports)
2. Dive into specific areas of interest
3. Trace dependencies and usages
4. Synthesize findings

## Current Analysis

$ARGUMENTS
