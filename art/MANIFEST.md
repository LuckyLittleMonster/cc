---
layer: art
mirrors: <consumer>/<art-subdir>/.claude/   (例：Assets/Art/.claude/)
upstream_donchitos_repo: Donchitos/Claude-Code-Game-Studios
upstream_donchitos_sha: 9ccc5440af4b6e9cfa0014c993cf37c6a81f4222
upstream_game_art_skill_repo: pronitdas/game-art-skill
upstream_game_art_skill_sha: 2e342227019827b2cecd888bf0386d924ec19ad0
pinned_at: 2026-05-01
---

# cc/art/ · Cherry-pick Manifest

This layer is the **art sub-layer (L3)**, technical-stack-specific. Deploys to consumer's art assets subtree.

> **L3 art 设计哲学**：cc/art/ 是项目级**美术管理层**——风格定义、规格、命名、polish 方法论。具体 DCC 工具（Aseprite / Blender / Adobe）由消费方独立安装外部 plugin / connector，本层不包装、不 fork。详见 `cc/docs/07-art-rules.md §5.3`。

---

## 顶层

| Target | Source | Type | Files | Adapted |
|---|---|---|---|---|
| `CLAUDE.md.template` | self | file | 1 | n/a (新建) |

## agents/ (2 files)

**Donchitos** — 美术领导：

| Target | Source | Adapted |
|---|---|---|
| `agents/art-director.md` | `donchitos:.claude/agents/art-director.md` | no |
| `agents/technical-artist.md` | `donchitos:.claude/agents/technical-artist.md` | no |

## skills/ (4 dirs)

**Donchitos (3)** — 美术工作流：

| Target | Source | 文件 | Adapted |
|---|---|---|---|
| `skills/art-bible/` | `donchitos:.claude/skills/art-bible/` | 1 (SKILL.md) | no |
| `skills/asset-spec/` | `donchitos:.claude/skills/asset-spec/` | 1 (SKILL.md) | no |
| `skills/asset-audit/` | `donchitos:.claude/skills/asset-audit/` | 1 (SKILL.md) | no |

**game-art-skill (1)** — polish 方法论 + 9 reference docs：

| Target | Source | 文件 | Adapted |
|---|---|---|---|
| `skills/game-art-polish/` ⭐ | `game-art-skill:` (整 repo, 仅 .md) | 10 (SKILL + 9 refs) | no |

`game-art-polish/` 包含：`SKILL.md` `foundations.md` `juice-and-feel.md` `particles-vfx.md` `pixel-art.md` `post-processing.md` `shaders.md` `stylized-3d.md` `ui-toolkit.md` `creators-and-resources.md`。

> **未抄**：上游 `game-art-polish.skill`（52KB 打包文件）—— 我们用解包后的 .md，不需要打包版。

---

## 推荐外部插件（**不**由本层提供，consumer 自装）

按 03 §1，外部插件由消费方维护。本层在 CLAUDE.md.template §5 推荐：

| 工具 | 仓库 / 安装方式 |
|---|---|
| pixel-plugin | `willibrandon/pixel-plugin` (`/plugin marketplace add ...`) |
| blender-mcp | `ahujasid/blender-mcp` (Blender plugin + MCP) |
| Adobe for Creativity Connector | Claude Customize 面板装（官方） |
| Hyper3D Rodin | 按需，MCP server |

---

## 总数

- 文件总数：**~17**（agents 2 + skills 4 dirs / 13 文件 + 顶层 1 + MANIFEST 1）
- Donchitos: 2 agents + 3 skills = **5 entries**
- game-art-skill: 1 skill (10 文件) = **1 entry**
- 自写：1（CLAUDE.md.template）

## 同步流程

升级 Donchitos: 03 §7 流程，按 `upstream_donchitos_*` 字段对齐
升级 game-art-skill: 同上，按 `upstream_game_art_skill_*` 字段对齐
两者独立追踪。
