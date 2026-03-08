---
name: plan
description: Enter Prometheus interview mode for structured planning. Best for complex tasks requiring detailed requirements gathering.
---

# Plan Skill - Prometheus Mode

Structured planning mode that gathers requirements before implementation.

## Usage

```
/plan implement user authentication system
```

## How It Works

1. **Interview Phase**: Ask clarifying questions about:
   - Requirements and constraints
   - Expected behavior
   - Edge cases
   - Integration points

2. **Analysis Phase**: Explore the codebase to understand:
   - Existing patterns
   - Related code
   - Dependencies

3. **Plan Creation**: Generate a detailed implementation plan with:
   - Step-by-step tasks
   - File modifications needed
   - Potential risks
   - Testing strategy

4. **User Approval**: Present the plan for review before execution

## When to Use

- New feature implementation
- Architectural changes
- Complex refactoring
- When requirements are unclear
- Multi-component changes

## Example Output

```
## Implementation Plan: User Authentication

### Requirements Gathered
- OAuth2 + local auth support
- Session management with JWT
- Role-based access control

### Tasks
1. Create auth middleware (src/middleware/auth.ts)
2. Add user model (src/models/user.ts)
3. Implement login/logout endpoints
4. Add session management
5. Create RBAC system

### Risks
- Breaking existing API contracts
- Session migration for existing users

### Testing Strategy
- Unit tests for auth logic
- Integration tests for endpoints
- E2E tests for login flow

Proceed with implementation? [Y/n]
```

## Options

| Option | Description |
|--------|-------------|
| `--quick` | Skip detailed interview, use defaults |
| `--deep` | Extra thorough analysis |
| `--no-execute` | Plan only, don't implement |
