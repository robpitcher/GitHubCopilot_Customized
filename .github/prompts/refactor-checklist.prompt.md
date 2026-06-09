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
