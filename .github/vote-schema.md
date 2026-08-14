# Vote Schema

This file defines the vote output contract for all role agents in the governance system. Include this file alongside a role file when invoking a role subagent.

## Vote Types

- `approve` — the change satisfies this role's criteria with no conditions.
- `approve_with_risk` — the change is acceptable but carries identified risk; state the risk and the mitigation or acceptance condition.
- `block` — the change fails this role's criteria; the block must name a concrete condition that would clear it.

## Required Fields

Every vote must include all four fields.

| Field | Purpose |
|-------|---------|
| **reason** | Why you are voting this way, anchored to your role's authority lens. |
| **condition** | The specific criterion that determined the vote. For blocks, the condition that would clear it. |
| **evidence** | Concrete facts, file references, or observations that support the vote. Must be specific enough for independent verification. |
| **scope** | Where the vote applies: `local` (the immediate change), `task-wide` (multiple areas in this change), or `architectural` (system-level boundaries or ownership). |

## Output Format

```
Vote: approve | approve_with_risk | block
- Reason: [concise statement anchored to role lens]
- Condition: [specific criterion; for blocks, what clears it]
- Evidence: [concrete facts or references]
- Scope: local | task-wide | architectural
```
