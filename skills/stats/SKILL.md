---
name: stats
description: View session metrics, model usage, and cost estimates
---

# Stats Skill - Session Metrics

View detailed statistics about your Claude Code session.

## Usage

```
/stats           # Current session
/stats week      # Past 7 days
/stats month     # Past 30 days
```

## Metrics Displayed

### Session Stats
```
Session Metrics
===============
Duration: 2h 34m
API Calls: 47
  - Sonnet: 42
  - Haiku: 5

Tokens
------
Input:  125,432
Output:  34,221
Total:  159,653

Estimated Cost: $4.32

Tools Used
----------
Read: 89
Edit: 23
Bash: 15
Grep: 12
Task: 8
```

### Aggregate Stats (week/month)
```
Weekly Metrics (7 days)
=======================
Sessions: 12
Total API Calls: 523
Total Tokens: 1,234,567
Estimated Cost: $45.23

Top Activities:
- Code editing: 45%
- Research: 30%
- Testing: 15%
- Documentation: 10%
```

## Cost Breakdown

Current pricing estimates:
| Model | Input | Output |
|-------|-------|--------|
| Opus | $15/M | $75/M |
| Sonnet | $3/M | $15/M |
| Haiku | $0.25/M | $1.25/M |

## Data Storage

Stats are stored locally in:
```
~/.claude/metrics/
  session-{id}.json
  aggregate.json
```

## Privacy

- All data stays local
- No external reporting
- Clear with `/stats clear`

## Options

| Command | Description |
|---------|-------------|
| `/stats` | Current session |
| `/stats week` | Last 7 days |
| `/stats month` | Last 30 days |
| `/stats all` | All time |
| `/stats clear` | Clear history |
| `/stats export` | Export to CSV |
