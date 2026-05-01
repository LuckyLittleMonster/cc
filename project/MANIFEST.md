---
layer: project
mirrors: <consumer-project>/.claude/ + <consumer-project>/CLAUDE.md
upstream_ecc_repo: affaan-m/everything-claude-code
upstream_ecc_sha: 841beea45cb25ba51f29fa45b7e272938d19b80a
upstream_ecc_version: v1.10.0-489-g841beea
upstream_donchitos_repo: Donchitos/Claude-Code-Game-Studios
upstream_donchitos_sha: 9ccc5440af4b6e9cfa0014c993cf37c6a81f4222
pinned_at: 2026-05-01
---

# cc/project/ · Cherry-pick Manifest

This layer is the **game development comprehensive layer (L2)**. It deploys to a consumer project's root as `<consumer>/CLAUDE.md` + `<consumer>/.claude/`.

> **L2 origin philosophy**: ECC contributes only Python data-design tooling (since ECC has no game-dev content). Donchitos is the primary source for game-dev agents/skills/rules. Self-written content lives in 05's spec.

---

## 顶层

| Target | Source | Type | Files | Adapted |
|---|---|---|---|---|
| `CLAUDE.md.template` | `ecc:examples/CLAUDE.md` | file | 1 | **yes** (rewritten in 05) |

## agents/ (22 files)

**ECC (1)** — 数据策划：

| Target | Source | Adapted |
|---|---|---|
| `agents/python-reviewer.md` | `ecc:agents/python-reviewer.md` | no |

**Donchitos (21)** — 游戏角色 agent，按 Tier 分组：

| Tier | Agents (Source: `donchitos:.claude/agents/<name>.md`) |
|---|---|
| 1 (Opus) | `creative-director` `technical-director` `producer` |
| 2 (Sonnet) | `game-designer` `lead-programmer` `qa-lead` `narrative-director` |
| 3 设计 | `systems-designer` `level-designer` `economy-designer` |
| 3 编程 | `gameplay-programmer` `engine-programmer` `ai-programmer` `ui-programmer` `tools-programmer` |
| 3 内容 | `writer` `world-builder` |
| 3 UX/QA | `ux-designer` `qa-tester` |
| 3 性能/原型 | `performance-analyst` `prototyper` |

All Donchitos agents `adapted: no`.

## skills/ (27 dirs)

**ECC (2)** — Python 数据策划：

| Target | Source | Adapted |
|---|---|---|
| `skills/python-patterns/` | `ecc:skills/python-patterns/` | no |
| `skills/python-testing/` | `ecc:skills/python-testing/` | no |

**Donchitos (26)** — 游戏开发流程：

| 类别 | Skills (Source: `donchitos:.claude/skills/<name>/`) |
|---|---|
| 入口 | `start` `setup-engine` |
| 设计 | `brainstorm` `quick-design` `design-system` `propagate-design-change` `map-systems` |
| 架构 | `create-architecture` `architecture-decision` |
| Sprint / Story | `create-stories` `dev-story` `sprint-plan` `story-done` `estimate` |
| 评审 | `design-review` `balance-check` `scope-check` `perf-profile` |
| Bug / playtest | `bug-report` `bug-triage` `playtest-report` |
| 制作 | `milestone-review` `release-checklist` |
| 创意 | `prototype` |
| UX | `ux-design` `ux-review` |

All Donchitos skills `adapted: no`.

## rules/ (12 files)

**ECC (5)** — Python 通用：

| Target | Source | Adapted |
|---|---|---|
| `rules/python/coding-style.md` | `ecc:rules/python/coding-style.md` | no |
| `rules/python/hooks.md` | `ecc:rules/python/hooks.md` | no |
| `rules/python/patterns.md` | `ecc:rules/python/patterns.md` | no |
| `rules/python/security.md` | `ecc:rules/python/security.md` | no |
| `rules/python/testing.md` | `ecc:rules/python/testing.md` | no |

**Donchitos (7)** — Path-scoped（约定式触发，非自动加载）：

| Target | Source | 适用路径（约定） | Adapted |
|---|---|---|---|
| `rules/path-scoped/design-docs.md` | `donchitos:.claude/rules/design-docs.md` | `design/**` | no |
| `rules/path-scoped/data-files.md` ⭐ | `donchitos:.claude/rules/data-files.md` | `data/**` `*.json` `*.yaml` `*.csv` | no |
| `rules/path-scoped/test-standards.md` | `donchitos:.claude/rules/test-standards.md` | `tests/**` | no |
| `rules/path-scoped/prototype-code.md` | `donchitos:.claude/rules/prototype-code.md` | `prototypes/**` | no |
| `rules/path-scoped/gameplay-code.md` | `donchitos:.claude/rules/gameplay-code.md` | 玩法代码 | no |
| `rules/path-scoped/ai-code.md` | `donchitos:.claude/rules/ai-code.md` | AI / NPC 代码 | no |
| `rules/path-scoped/narrative.md` | `donchitos:.claude/rules/narrative.md` | `narrative/**` `dialogue/**` | no |

## commands/ (1 file)

| Target | Source | Adapted |
|---|---|---|
| `commands/python-review.md` | `ecc:commands/python-review.md` | no |

> Donchitos commands 不抄；其 skills 已含同等接口。

## docs/coordination/ (4 files)

Donchitos agent 协调说明，部署到 `<consumer>/.claude/docs/coordination/`。agents 在大决策前应引用这些文档了解 delegation 协议。

| Target | Source | Adapted |
|---|---|---|
| `docs/coordination/agent-roster.md` | `donchitos:.claude/docs/agent-roster.md` | no |
| `docs/coordination/agent-coordination-map.md` | `donchitos:.claude/docs/agent-coordination-map.md` | no |
| `docs/coordination/coordination-rules.md` | `donchitos:.claude/docs/coordination-rules.md` | no |
| `docs/coordination/director-gates.md` | `donchitos:.claude/docs/director-gates.md` | no |

## hooks/ (0 files)

**本轮不抄**。原因：Donchitos hooks 是 `.sh`，ECC L1 hooks 是 `.js`（跨平台）。Donchitos 独有功能（`validate-assets.sh` `validate-skill-change.sh`）值得用 Node.js 重写——见 05 §5.4 与 §9.1。

---

## 改写说明（adapted: yes 的项）

### `CLAUDE.md.template` (rewritten in 05)

ECC 原版（100 行）通用通杀，缺：
- 游戏项目身份占位符
- L2 在层级体系中的位置说明
- Donchitos 资源索引
- 数据策划工作流
- 多子项目工作区支持
- Sprint / playtest / milestone 默认流程

改写版（202 行）补齐上述。详细差异见 `cc/docs/05-gamedev-rules.md` §3.1。

---

## 总数

- 文件总数：**~75**（agents 22 + skills 28 dirs + rules 12 + commands 1 + docs 4 + 顶层 1 + MANIFEST 1）
- ECC: 8（python-reviewer + python rules + python skills + python-review command）
- Donchitos: 21 agents + 26 skills + 7 rules + 4 coordination docs = **58 entries**
- 自写：1（CLAUDE.md.template）

## 同步流程

升级 ECC: 03 §7 流程，按 `upstream_ecc_*` 字段对齐
升级 Donchitos: 同上，按 `upstream_donchitos_*` 字段对齐
两者独立追踪。
