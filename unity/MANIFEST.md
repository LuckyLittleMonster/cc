---
layer: unity
mirrors: <consumer>/<unity-subdir>/.claude/   (例：Assets/Scripts/.claude/ 或 repo 根)
upstream_ecc_repo: affaan-m/everything-claude-code
upstream_ecc_sha: 841beea45cb25ba51f29fa45b7e272938d19b80a
upstream_ecc_version: v1.10.0-489-g841beea
upstream_donchitos_repo: Donchitos/Claude-Code-Game-Studios
upstream_donchitos_sha: 9ccc5440af4b6e9cfa0014c993cf37c6a81f4222
pinned_at: 2026-05-01
---

# cc/unity/ · Cherry-pick Manifest

This layer is the **Unity sub-layer (L3)**, engine-specific. Deploys to consumer's Unity script subtree.

> **L3 Unity 设计哲学**：ECC 提供通用 C# baseline（.NET / Web 偏向，标 `adapted: no`）；Donchitos 提供 Unity 引擎专家 agents + path-scoped 规则 + engine-reference。两者并存，Unity 特化决策由 Donchitos `unity-specialist` 接管，CLAUDE.md.template 显式协调。详见 `cc/docs/06-unity-rules.md §6`。

---

## 顶层

| Target | Source | Type | Files | Adapted |
|---|---|---|---|---|
| `CLAUDE.md.template` | self | file | 1 | n/a (新建) |

## agents/ (6 files)

**ECC (1)** — 通用 C# baseline：

| Target | Source | Adapted |
|---|---|---|
| `agents/csharp-reviewer.md` | `ecc:agents/csharp-reviewer.md` | no（不强行改写；Unity 特化由 unity-specialist 接管） |

**Donchitos (5)** — Unity 引擎专家：

| Target | Source | Adapted |
|---|---|---|
| `agents/unity-specialist.md` | `donchitos:.claude/agents/unity-specialist.md` | no |
| `agents/unity-dots-specialist.md` | `donchitos:.claude/agents/unity-dots-specialist.md` | no |
| `agents/unity-shader-specialist.md` | `donchitos:.claude/agents/unity-shader-specialist.md` | no |
| `agents/unity-addressables-specialist.md` | `donchitos:.claude/agents/unity-addressables-specialist.md` | no |
| `agents/unity-ui-specialist.md` | `donchitos:.claude/agents/unity-ui-specialist.md` | no |

## skills/ (2 dirs)

**ECC (2)** — 通用 baseline：

| Target | Source | Adapted |
|---|---|---|
| `skills/csharp-testing/` | `ecc:skills/csharp-testing/` | no |
| `skills/dotnet-patterns/` | `ecc:skills/dotnet-patterns/` | no |

**Donchitos**：无（`setup-engine` 移到 L2 `cc/project/skills/`，详见 06 §5.2）。

## rules/ (9 files)

**ECC (5)** — 通用 C# 风格：

| Target | Source | Adapted |
|---|---|---|
| `rules/csharp/coding-style.md` | `ecc:rules/csharp/coding-style.md` | no |
| `rules/csharp/hooks.md` | `ecc:rules/csharp/hooks.md` | no |
| `rules/csharp/patterns.md` | `ecc:rules/csharp/patterns.md` | no |
| `rules/csharp/security.md` | `ecc:rules/csharp/security.md` | no |
| `rules/csharp/testing.md` | `ecc:rules/csharp/testing.md` | no |

**Donchitos (4)** — Path-scoped Unity rules：

| Target | Source | 适用路径 | Adapted |
|---|---|---|---|
| `rules/path-scoped/engine-code.md` | `donchitos:.claude/rules/engine-code.md` | `Assets/Scripts/Engine/**` | no |
| `rules/path-scoped/shader-code.md` | `donchitos:.claude/rules/shader-code.md` | `Assets/Shaders/**` | no |
| `rules/path-scoped/ui-code.md` | `donchitos:.claude/rules/ui-code.md` | `Assets/Scripts/UI/**` | no |
| `rules/path-scoped/network-code.md` | `donchitos:.claude/rules/network-code.md` | `Assets/Scripts/Net/**` | no |

## docs/engine-reference/ (16 files)

**Donchitos**：Unity 引擎参考文档整树：

| 子集 | 文件 | Adapted |
|---|---|---|
| 顶层 | `VERSION.md` `breaking-changes.md` `deprecated-apis.md` `current-best-practices.md` `PLUGINS.md` | no |
| modules/ | `animation` `audio` `input` `navigation` `networking` `physics` `rendering` `ui` (×8) | no |
| plugins/ | `addressables` `cinemachine` `dots-entities` (×3) | no |

`VERSION.md` 是占位文档，由消费者根据本项目 Unity 版本填充。

---

## 总数

- 文件总数：**~35**（agents 6 + skills 2 dirs + rules 9 + docs 16 + 顶层 1 + MANIFEST 1）
- ECC: 1 agent + 2 skills + 5 rules = **8 entries**
- Donchitos: 5 agents + 4 rules + 16 engine-reference docs = **25 entries**（`setup-engine` 移到 L2）
- 自写：1（CLAUDE.md.template）

## 适配状态

所有 cherry-pick 当前 `adapted: no`，但**编辑 Unity 文件时优先级**：
1. `unity-specialist` + sub-specialists 主导（覆盖 ECC csharp 通用规则的引擎相关部分）
2. Donchitos path-scoped rules（按路径作用域）
3. ECC csharp baseline（通用 C# 风格，Unity 无关部分）

详见 `cc/docs/06-unity-rules.md §6` 与 `cc/unity/CLAUDE.md.template §6`。

## 同步流程

升级 ECC: 03 §7 流程，按 `upstream_ecc_*` 字段对齐
升级 Donchitos: 同上，按 `upstream_donchitos_*` 字段对齐
两者独立追踪。
