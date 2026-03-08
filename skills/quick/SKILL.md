---
name: quick
description: Fast execution mode for simple tasks. Uses Haiku for speed and cost efficiency. Skips planning and assessment.
---

# Quick Skill - Fast Mode

Optimized for speed on simple, well-defined tasks.

## Usage

```
/quick add a loading spinner to the submit button
```

## How It Works

1. **Skip Planning**: No interview or analysis phase
2. **Direct Execution**: Immediately start implementation
3. **Minimal Context**: Load only essential files
4. **Fast Model**: Use Haiku for routine operations

## When to Use

- Simple bug fixes
- Small UI changes
- Adding single functions
- Renaming/refactoring
- Quick file edits
- Well-defined tasks

## When NOT to Use

- Complex features
- Unclear requirements
- Multi-file changes
- Architectural decisions
- Security-sensitive code

## Examples

### Simple Fix
```
/quick fix the typo in the error message
```

### Small Addition
```
/quick add console.log to debug the API response
```

### UI Tweak
```
/quick change the button color to blue
```

### Quick Refactor
```
/quick rename getUserData to fetchUserProfile
```

## Speed Comparison

| Mode | Planning | Model | Best For |
|------|----------|-------|----------|
| `/quick` | None | Haiku | Simple tasks |
| Default | Minimal | Sonnet | Normal tasks |
| `/plan` | Full | Sonnet | Complex tasks |
| `/ultrawork` | Adaptive | All | Large projects |

## Constraints

- Max 3 files modified
- No architectural decisions
- No security-sensitive changes
- Fails fast if task is complex
