---
name: search
description: Parallel exploration mode for codebase search. Use search or find keywords to quickly locate files, functions, and patterns across the codebase.
allowed-tools: Task, Glob, Grep, Read
argument-hint: <what to search for>
---

# Parallel Search Mode Activated

You are now in **parallel exploration mode** for fast codebase search.

## Search Strategy

1. **Launch Parallel Explore Agents**: Use multiple Task agents with subagent_type=Explore
2. **Cover Multiple Angles**: Search by filename, content pattern, and semantic meaning
3. **Aggregate Results**: Combine findings from all agents

## Search Techniques

### By Filename
```
Glob: **/*<keyword>*.ts
```

### By Content
```
Grep: pattern="<keyword>" with appropriate file filters
```

### By Semantic Meaning
Use Explore agent to understand context and find related code.

## Execution

Launch 2-3 Explore agents in parallel with different search focuses:
- Agent 1: Filename patterns
- Agent 2: Content search with Grep
- Agent 3: Related implementations

## Output Format

Present results as:
- **Found Files**: List of relevant files with paths
- **Key Matches**: Most relevant code snippets
- **Related**: Other potentially relevant locations

## Current Search

$ARGUMENTS
