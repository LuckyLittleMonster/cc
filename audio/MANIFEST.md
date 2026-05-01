---
layer: audio
mirrors: <consumer>/<audio-subdir>/.claude/   (例：Assets/Audio/.claude/)
upstream_donchitos_repo: Donchitos/Claude-Code-Game-Studios
upstream_donchitos_sha: 9ccc5440af4b6e9cfa0014c993cf37c6a81f4222
pinned_at: 2026-05-01
---

# cc/audio/ · Cherry-pick Manifest

This layer is the **audio sub-layer (L3)**, technical-stack-specific. Deploys to consumer's audio assets subtree.

> **L3 audio 设计哲学**：cc/audio/ 是项目级**音频管理层**——响度标准、命名、格式、middleware 选型。具体 DAW / middleware 工具（Ableton / FMOD / Splice）由消费方独立安装外部 plugin / connector，本层不包装、不 fork。详见 `cc/docs/08-audio-rules.md §5.3`。

---

## 顶层

| Target | Source | Type | Files | Adapted |
|---|---|---|---|---|
| `CLAUDE.md.template` | self | file | 1 | n/a (新建) |

## agents/ (2 files)

**Donchitos** — 音频领导：

| Target | Source | Adapted |
|---|---|---|
| `agents/audio-director.md` | `donchitos:.claude/agents/audio-director.md` | no |
| `agents/sound-designer.md` | `donchitos:.claude/agents/sound-designer.md` | no |

## skills/ (0)

**本轮无 cherry-pick**：
- Donchitos `team-audio` skill 跳过（多 agent 编排，单人项目用不上；同 05 决策）
- 其他 Donchitos audio 类 skill 不存在
- 我们的 `audio-*` 自写候选见 08 §4.3，未来按需

## rules/ (0)

暂无 audio-only path-scoped rules。如需为 `Assets/Audio/**` 加自动触发规则，写 09 install 时考虑。

---

## 推荐外部插件（**不**由本层提供，consumer 自装）

按 03 §1，外部插件由消费方维护。本层在 CLAUDE.md.template §5 推荐：

| 工具 | 类型 | 仓库 / 安装方式 |
|---|---|---|
| Ableton 官方 connector | 官方 | Claude Customize 面板 |
| ahujasid/ableton-mcp | 社区 MCP | `claude mcp add ableton-mcp ...` |
| Splice 官方 connector | 官方 | Claude Customize 面板 |
| **fmod-mcp** ⭐ | 社区 MCP（Claude Code 专用） | `jmperez127/fmod-mcp` —— 35 工具覆盖 FMOD Studio 全流程 |
| Sound Effects Expert skill | 第三方 skill | `/plugin install` 路径 |

---

## 总数

- 文件总数：**~3**（agents 2 + 顶层 1 + MANIFEST 1，无 skills / rules）
- Donchitos: 2 agents = **2 entries**
- 自写：1（CLAUDE.md.template）

> 本层是迄今最小的层。原因：音频工作流的**核心能力**（DAW 操作、middleware 集成、采样库管理）都在外部 plugin / connector，cc/audio/ 只做**项目级管理层**（命名 / 响度 / 格式 / middleware 选型决策）。

## 同步流程

升级 Donchitos: 03 §7 流程，按 `upstream_donchitos_*` 字段对齐
推荐外部插件升级跟随上游各自维护，不在本 MANIFEST 追踪
