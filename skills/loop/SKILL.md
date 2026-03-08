---
name: loop
description: Ralph Loop - continuous execution until task completion. Automatically continues work across iterations.
---

# Loop Skill - Ralph Mode

Continuous execution mode that persists until the task is complete.

## Usage

```
/loop implement the entire checkout flow
```

## How It Works

1. **Initial Assessment**: Understand full scope of work
2. **Task Decomposition**: Break into manageable chunks
3. **Continuous Execution**: Work through tasks sequentially
4. **Auto-Continue**: Automatically proceed to next task
5. **Completion Check**: Verify all requirements met

## Features

### Auto-Resume
If interrupted, the loop remembers progress and resumes:
```
[Loop Progress: 7/12 tasks complete]
Resuming from: "Add payment validation"
```

### Progress Tracking
Visual progress indicator:
```
[=====>    ] 5/10 tasks
Current: Implementing order confirmation
Next: Email notification setup
```

### Smart Pausing
Automatically pauses for:
- User input needed
- Ambiguous requirements
- Error requiring decision
- Resource limits

## When to Use

- Multi-step implementations
- Large refactoring projects
- Feature development
- Migration tasks
- Batch operations

## Example Session

```
/loop migrate all API endpoints to v2

[Loop Started: API Migration]
Tasks identified: 15

[1/15] Analyzing current v1 endpoints...
[2/15] Creating v2 router structure...
[3/15] Migrating /users endpoint...
...
[15/15] Updating API documentation...

[Loop Complete]
- 15 tasks completed
- 23 files modified
- 0 errors
```

## Control Commands

During loop execution:
- `pause` - Pause at next safe point
- `skip` - Skip current task
- `status` - Show progress
- `stop` - End loop (saves progress)

## Options

| Option | Description |
|--------|-------------|
| `--max-tasks N` | Limit to N tasks |
| `--pause-on-error` | Stop on any error |
| `--dry-run` | Plan only, don't execute |
| `--verbose` | Detailed progress output |
