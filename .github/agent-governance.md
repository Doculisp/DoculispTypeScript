# Agent Governance Details

This file contains the detailed governance mechanics for the AI Role Panel governance pack.

## Specialist Activation Triggers
- UX Expert: user flow or interaction changes, key journey behavior changes, copy, IA, navigation, form behavior, feedback behavior, and accessibility implications.
- Technical Writer: user-visible behavior changes, CLI command changes, UI navigation or workflow changes, setup or run changes, error or status semantics changes, or explicit doc update requests.

## Role Intent Statements
- Action: enforce that each approved change is one executable, testable, independently releasable unit of value.
- Refactoring: prevent local maintainability regressions and avoidable structural debt in the touched area.
- Deletion: prevent avoidable added or retained implementation surface in the touched area.
- Architecture: preserve boundaries, low coupling, and clear ownership.
- SDET: prove behavior via observable evidence and failure coverage.
- Junior: expose hidden assumptions and weak rationale.
- UX: protect clarity, usability, accessibility, and page-purpose coherence.
- Technical Writer: protect user comprehension, task-oriented docs quality, discoverability, and release-note accuracy.

## Role Authority By Activity
Roles may comment broadly, but must vote from their authority lens.

Full role definitions are in the `roles/` directory. When invoking a role sub-agent, include the corresponding file and [vote-schema.md](./vote-schema.md) in the prompt.

| Role | File | Type |
|------|------|------|
| Action | [roles/action.md](./roles/action.md) | Required |
| Refactoring | [roles/refactoring.md](./roles/refactoring.md) | Required |
| Deletion | [roles/deletion.md](./roles/deletion.md) | Required |
| Architecture | [roles/architecture.md](./roles/architecture.md) | Required |
| Security | [roles/security-role.md](./roles/security-role.md) | Required |
| SDET | [roles/sdet.md](./roles/sdet.md) | Required |
| Junior | [roles/junior.md](./roles/junior.md) | Required |
| UX | [roles/ux.md](./roles/ux.md) | Conditional specialist |
| Technical Writer | [roles/technical-writer.md](./roles/technical-writer.md) | Conditional specialist |

## Gate Rules

### Activity Gates
- requirements: blocked if Junior, SDET, or Security votes block.
- design: blocked if Architecture, Junior, SDET, or Security votes block.
- implementation_plan: blocked if Action, Junior, SDET, or Security votes block.
- code_change acceptance: blocked if Junior, SDET, or Security votes block.

### Specialist Gates (When UX Is Activated)
- requirements and design: blocked if UX blocks within activated scope.
- implementation_plan: specialist block is task-wide only if proof path is missing for activated scope.
- code_change acceptance: blocked if UX blocks for severe activated-scope defects.

### Technical Writer Gates (When Activated)
- requirements and design: blocked if required user-doc scope is missing or ambiguous for changed behavior.
- implementation_plan: blocked if no same-change doc update proof path exists.
- code_change acceptance: blocked if user docs are materially stale or incorrect for activated scope.

### Additional Guardrails
- Action block votes must name the primary slice and the additional separately shippable slice or slices that caused the block.
- Architecture may block code_change only for true boundary or coupling violations.
- Refactoring and Deletion may block only for concrete maintainability or redundancy failures.
- Deletion may block code_change when commented-out executable code remains in the touched area, unless it is clearly temporary, narrowly scoped, and paired with a TODO that states the removal trigger and cleanup rationale.
- Refactoring block votes at requirements and design must cite a specific structural risk in the current codebase that makes the regression predictable.
- Refactoring block votes at implementation_plan must name the missing or deferred cleanup step.
- Refactoring block votes at code_change must compare the diff to a concrete pre-change baseline in the touched area.
- Refactoring must not block only because the surrounding subsystem is messy; it must show that this change made the touched area worse or preserved avoidable debt that was in scope to fix.
- Refactoring must hard-block new temporal coupling in the touched area unless it is required for the current behavior and explicitly mitigated.
- Deletion block votes at requirements and design must cite the specific existing code that makes the new surface avoidable.
- Deletion block votes at implementation_plan must name the missing reuse or removal step.
- Deletion block votes at code_change must compare the diff to a concrete pre-change baseline and identify specific added or retained surface that could have been removed, reused, or collapsed.
- Deletion block votes for commented-out code must treat the retained comments as avoidable surface unless the code is temporary, under 100 lines, and preceded by a TODO that explains why the code must remain and what condition removes it.
- Deletion must not block only because more cleanup would be nice; it must show that this change introduced or preserved unnecessary surface within scope.
- UX may block code_change only for severe usability or accessibility defects in activated scope, or context-mismatched placement without approved remodel.
- Technical Writer may block code_change only for material user-doc defects in activated scope.
- UX must block design for context-mismatched placement and provide:
  1. misplaced element
  2. current page
  3. correct page
  4. proposed flow remodel across affected pages
- Security fallback votes are provisional until the minimum security artifact contract is satisfied.
- Security must not produce a final approve/block outcome without minimum security artifacts that include executed evidence for material security claims.
- Any block vote is invalid without a clear condition and evidence requirement.

### Security Fallback Minimum Artifact Contract
When distinct role agents are unavailable and Security runs in fallback mode, final Security outcomes require all of the following:
- threat-surface evidence: assets, trust boundaries, privileged actions, and external inputs for touched scope.
- proof-path evidence: named tests/checks/scans for each material security claim.
- executed evidence: at least one executed artifact per material security claim with pass/fail outcome.
- provenance evidence: command or tool identity plus run id, timestamp, or artifact path for each executed artifact.

If any required security fallback artifact is missing:
- Security output is provisional only.
- activity gate status remains blocked until artifacts are collected.

## Overlap Policy
Each role must:
- anchor comments to its authority lens.
- state at least one agreement or disagreement with another role when applicable.
- identify one concern likely underweighted by others.

## Tie Resolution
1. Attempt specialist reconciliation using conditions and evidence.
2. If still tied and no unresolved block remains, allow non-specialized arbiter choice between viable options.
3. Arbiter cannot override specialist block votes.

## User Escalation Policy
Escalate only for unresolved ties or explicit preference-dependent choices.

Do not escalate solely because:
- a gate failed and can be remediated internally.
- role artifacts are missing and can be collected.

Escalation format:
- Decision (1 sentence)
- Why unresolved (1 sentence)
- Option A: supporting roles, benefits, costs and risks
- Option B: supporting roles, benefits, costs and risks
- What would resolve internally (missing constraint or evidence)
- Default if no user preference

## Final Recommendation Completeness
A recommendation is complete only when all are true:
- all required role votes are present for relevant activities.
- all activated specialist votes are present.
- block votes are resolved or escalated.
- approve_with_risk items are documented as accepted risks.
- disagreement resolution is explicit.
- each major decision has at least one proof path.
- security decisions over material claims include executed evidence artifacts with provenance.
- code-changing requests include invocation evidence for required and activated specialist roles.

### Documentation Completeness Requirement (When Technical Writer Is Activated)
- user-facing docs updated in the same change.
- docs include current UI paths and CLI commands for changed behavior.
- docs include at least one end-to-end example task.

## TDD Rules (Detailed)
1. Define tests first.
2. State expected behavior.
3. Implement minimum code to pass.
4. Refactor after passing tests.
5. Re-run tests and report outcomes.

## Response Format (Detailed)
For coding tasks, include Role Engagement Record before section 1.

1. Activity and scope
2. Requirements summary (objective, constraints, assumptions, risks)
3. Role votes by activity
4. Gate decision (pass or blocked)
5. Agreement and disagreement summary
6. Tie resolution or user escalation (if needed)
7. Final recommendation
8. TDD plan and implementation steps (if coding is requested)
9. Risk register
10. Agent invocation evidence (required for code-changing requests)

### Agent Invocation Evidence Format
- Required and activated specialist roles: role, agent name, role-specific prompt summary, output summary, vote by activity, evidence artifacts, and limitations if fallback.
- Non-activated specialists: role, activation decision (not activated), and one-sentence rationale.

## Stop Conditions
Stop and request user decision only when:
- tie escalation conditions are met.
- tradeoff is user-preference dependent.

Do not stop for internal remediation of:
- gates that can be cleared with technical iteration.
- missing required role artifacts.

If tooling cannot execute required role agents, use best-available fallback per role and escalate only if no deterministic valid vote set can be produced.
