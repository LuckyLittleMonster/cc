---
layer: user
mirrors: ~/.claude/
upstream_ecc_repo: affaan-m/everything-claude-code
upstream_ecc_sha: 841beea45cb25ba51f29fa45b7e272938d19b80a
upstream_ecc_version: v1.10.0-489-g841beea
pinned_at: 2026-05-01
---

# cc/user/ · Cherry-pick Manifest

This layer mirrors `~/.claude/` and is shared across all projects.

## Top-level

| Target | Source (ECC) | Type | Files | Adapted |
|---|---|---|---|---|
| `CLAUDE.md` | `examples/user-CLAUDE.md` | file | 1 | **yes** (rewritten in 04) |
| `statusline.json` | `examples/statusline.json` | file | 1 | no |

## rules/common/ (10 files)

`ecc:rules/common/` → `cc/user/rules/common/`

`agents.md` · `code-review.md` · `coding-style.md` · `development-workflow.md` · `git-workflow.md` · `hooks.md` · `patterns.md` · `performance.md` · `security.md` · `testing.md`

## hooks/ (2 files)

`ecc:hooks/` → `cc/user/hooks/`

`README.md` · `hooks.json`

> Hook script implementations live in `cc/user/scripts/hooks/` (see below).

## contexts/ (3 files)

`ecc:contexts/` → `cc/user/contexts/`

`dev.md` · `research.md` · `review.md`

## agents/ (20 files)

Per `02-ecc-categorization.md` §10 Layer 1.

`a11y-architect` · `architect` · `build-error-resolver` · `code-architect` · `code-explorer` · `code-reviewer` · `code-simplifier` · `comment-analyzer` · `conversation-analyzer` · `doc-updater` · `docs-lookup` · `harness-optimizer` · `loop-operator` · `performance-optimizer` · `planner` · `pr-test-analyzer` · `refactor-cleaner` · `silent-failure-hunter` · `tdd-guide` · `type-design-analyzer`

## skills/ (35 dirs · 72 files total)

Per `02-ecc-categorization.md` §10 Layer 1，另加 cc 自有的 `agentbus`（非 ECC，2026-11-25）。

`agentbus` (cc) · `agentic-engineering` · `coding-standards` · `continuous-learning` (3 files) · `continuous-learning-v2` (10 files) · `iterative-retrieval` · `strategic-compact` (2 files) · `context-budget` · `token-budget-advisor` · `search-first` · `skill-stocktake` (4 files) · `skill-comply` (21 files) · `rules-distill` (3 files) · `hookify-rules` · `prompt-optimizer` · `tdd-workflow` · `eval-harness` · `verification-loop` · `git-workflow` · `architecture-decision-records` · `codebase-onboarding` · `code-tour` · `repo-scan` · `documentation-lookup` · `autonomous-loops` · `dmux-workflows` · `agent-introspection-debugging` · `agent-harness-construction` · `agent-eval` · `content-hash-cache-pattern` · `regex-vs-llm-structured-text` · `hexagonal-architecture` · `gateguard` · `plankton-code-quality` · `configure-ecc`

## commands/ (39 files)

Per `02-ecc-categorization.md` §3 ✅ list.

`aside` · `auto-update` · `checkpoint` · `code-review` · `evolve` · `feature-dev` · `harness-audit` · `hookify` · `hookify-configure` · `hookify-help` · `hookify-list` · `instinct-export` · `instinct-import` · `instinct-status` · `learn` · `learn-eval` · `loop-start` · `loop-status` · `model-route` · `plan` · `projects` · `promote` · `prp-commit` · `prp-implement` · `prp-pr` · `prp-plan` · `prp-prd` · `prune` · `quality-gate` · `refactor-clean` · `resume-session` · `save-session` · `sessions` · `setup-pm` · `skill-create` · `skill-health` · `test-coverage` · `update-codemaps` · `update-docs`

## scripts/ (80 files)

Hooks runtime + shared utilities.

| Target | Source (ECC) | Files |
|---|---|---|
| `scripts/*.js` | `scripts/*.js`（顶层 23 个） | 23 |
| `scripts/hooks/` | `scripts/hooks/` | 43 |
| `scripts/lib/` | `scripts/lib/` | 31 |
| `scripts/agentbus/` | cc 自有（局域网多机 agent 消息总线，见其 README） | 6 |

> Required by `hooks/hooks.json` (which references `scripts/hooks/plugin-hook-bootstrap.js`, `scripts/hooks/run-with-flags.js`, `scripts/lib/utils.js`, etc.).
>
> 顶层 `scripts/*.js` 是 ECC 各 skill 的实现脚本（如 `skills-health.js` 给 `/skill-health` 用，`harness-audit.js` 给 `/harness-audit` 用）。本批次缺失曾导致 `/skill-health` ENOENT，2026-05-02 修复。

---

## Totals

- Files: **276**（246 → 269；2026-05-02 加 23 个 ECC 顶层 scripts；2026-11-25 加 cc 自有 agentbus 7 个）
- Top-level dirs: 7 (rules, hooks, contexts, agents, skills, commands, scripts)
- 268 files unmodified from upstream (`adapted: no`)
- 1 file rewritten: `CLAUDE.md` (`adapted: yes`) — see `cc/docs/04-general-rules.md` §3 for change rationale

## Sync workflow (future)

To pull upstream changes:
```bash
cd refs/everything-claude-code && git pull
# Inspect diff for files in our manifest
# Re-cp changed files, marking `adapted: true` on any with local changes
```
