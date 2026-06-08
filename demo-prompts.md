# Module 1: Foundations Exercise 3 — Demo Prompts

**Demo file:** `api/src/routes/branch.ts`

---

## Step 1 — Compare two models

> Switch models, run the same prompt twice, compare depth/style/speed.

```text
Compare two safe ways to improve #file:branch.ts and recommend one based on maintainability and test impact.
```

---

## Step 2 — Create the custom agent

> Save as `.github/agents/refactor-coach.agent.md`.

```yaml
---
tools: ['search/codebase', 'search', 'edit/editFiles']
description: Help implement small, low-risk refactors with explanations
model: Claude Sonnet 4.6
---

You are a careful refactoring partner for this repository.

- Explain the plan before editing files
- Keep changes limited to the active task
- Prefer small, reversible edits
```

---

## Step 3 — Give the agent a small task

> Select `refactor-coach` in the mode picker, open `branch.ts`, then:

```text
Extract the duplicated "find index + 404" logic from the PUT and DELETE handlers into a helper. Explain the plan first.
```

---

## Step 4 — Create the reusable prompt

> Save as `.github/prompts/refactor-checklist.prompt.md`.

```yaml
---
agent: 'agent'
description: 'Review the active file, propose a safe refactor, and suggest validation steps'
tools: ['search/codebase', 'search', 'edit/editFiles']
model: Claude Sonnet 4.6
---

# Safe Refactor Checklist

## Objective
Improve the active file without changing intended behavior.

## Requirements
- Explain the current structure first
- Suggest the smallest useful improvement
- Call out risks and recommended tests
```

---

## Step 5 — Run the prompt

> Open `branch.ts`, run `/refactor-checklist`, compare with the agent experience.

```text
/refactor-checklist
```

---

## Step 6 — Token reflection

> Compare the two model responses from Step 1. The longer one used more output tokens — was the extra detail worth the cost?
