# 03 · 架构合约（Hierarchy Design Contract）

> 角色：合约文档。本文不写规则内容，只**锁定**下游 04–08 必须遵守的硬约束。
> 一旦 04+ 写就，改本文 = 改宪法，必须 review 所有下游文档。
> 上游：00-README §3 仓库布局 + §4 术语表。

---

## 1. 物理层级（Physical Layers）

Claude Code 三种 CLAUDE.md 加载位置都被使用，按"远 → 近"叠加：

| Layer | 加载位置 | cc/ 来源 | 何时加载 |
|---|---|---|---|
| **L1 · 用户级** | `~/.claude/CLAUDE.md` | `cc/user/` | 任何 Claude Code 会话启动时 |
| **L2 · 项目根** | `<project>/CLAUDE.md` | `cc/project/` | 会话进入项目目录时叠加 |
| **L3 · 子目录** | `<project>/<subdir>/CLAUDE.md` | `cc/unity/` `cc/art/` `cc/audio/` | Claude 编辑该子树文件时叠加 |

**叠加语义**（Claude Code 实际行为）：
- 内容**累积进系统提示**：后加载的 CLAUDE.md 不删除前者，只补充。底层不存在硬覆盖。
- **冲突由模型解释，非机制覆盖**：Claude 按"具体 > 通用"惯例处理，所以 *实际效果* 是 L3 > L2 > L1（例：项目层声明 IL2CPP 会胜过用户层 Mono 偏好）。但这是模型解读约定，不是加载器保证。撰写下游文档时仍以此优先级为意图。
- skills / agents / commands 按 description 语义匹配触发。用户级与项目级共存时的精确合并行为以 Claude Code 实际为准——**如发现与本节描述不一致，回头修订本合约**而非反之。

**部署目标**（`install.{sh,ps1}` 的搬运表，详见 `09-install-design.md`）：

| cc/ | → 目标 |
|---|---|
| `cc/user/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| `cc/user/{rules,contexts,agents,skills,commands,scripts}/` | `~/.claude/<同名子目录>/` |
| `cc/user/hooks/hooks.json` | `~/.claude/hooks/hooks.json`（Claude Code v2.1+ 自动加载，**无需** settings.json 显式引用） |
| `cc/user/statusline.json` | `~/.claude/statusline.json` |
| `cc/project/CLAUDE.md.template` | `<consumer-project>/CLAUDE.md`（按模板填充） |
| `cc/project/{agents,skills,commands,rules,docs}/` | `<consumer-project>/.claude/<同名子目录>/` |
| `cc/unity/` | `<consumer-project>/Assets/Scripts/.claude/` 或 `<unity-subproject>/.claude/` |
| `cc/art/` | `<consumer-project>/Assets/Art/.claude/` |
| `cc/audio/` | `<consumer-project>/Assets/Audio/.claude/` |

**不**由 cc/ 提供、消费方自维护：
- `~/.claude/settings.json` — 个人偏好与权限（API key、env、disabledMcpServers）；hooks.json 已 v2.1+ 自动注册，无需在此显式 reference
- `<project>/.claude/settings.local.json` — 项目本地敏感配置
- `<project>/.mcp.json` — 项目级 MCP 服务器配置（含 token）

L3 的子目录路径**取决于消费方布局**：单一 Unity 项目时 art/audio 在 `Assets/` 下；多子项目工作区（如`修行计划`）时 art/audio 可能跨子项目，由消费方在自己的 install 配置里指定。

---

## 2. 主题命名空间（Topical Namespaces）

### 2.1 五个前缀

| Prefix | 适用层 | 含义 |
|---|---|---|
| `general-` | L1 (`cc/user/`) | 跨项目通用工程能力 |
| `gamedev-` | L2 (`cc/project/`) | 游戏开发综合，不绑引擎 |
| `unity-` | L3 (`cc/unity/`) | Unity 引擎专属 |
| `art-` | L3 (`cc/art/`) | 美术资产工作流 |
| `audio-` | L3 (`cc/audio/`) | 音频工作流 |

### 2.2 适用对象

前缀**只适用于我们自己新建**的 skill / agent / command。
- ✅ `gamedev-balance-checker` — 我们自写
- ❌ `general-planner` — **不**重命名 ECC 自带的 `planner.md`

### 2.3 ECC / Donchitos cherry-pick 的命名规则

| 来源 | 命名规则 |
|---|---|
| ECC（cherry-pick）| 保留原名（如 `planner.md` `search-first/SKILL.md`） |
| Donchitos（cherry-pick）| 保留原名（如 `art-bible.md`）— 注意 ECC 也叫 `architect`，碰名时见 §2.4 |
| 我们自写 | 必须带前缀 |

### 2.4 命名冲突处理

- 跨层同名时，就近层胜出（L3 > L2 > L1），与 §1 一致。
- 同层同名是 bug，禁止出现。`install.{sh,ps1}` 检测到必须报错。
- ECC 与 Donchitos 同名（例如两边都有某个 agent）时，cherry-pick 二者之一并加后缀（`planner-ecc.md` vs `planner-donchitos.md`），由我们决定主用哪个。

### 2.5 SKILL.md description 触发条件硬要求

每个我们自写的 skill 的 `description` 字段必须包含**关键词或路径前缀**等具体触发线索（不能只写"Helpful for Unity"）：

```yaml
---
name: unity-shader-urp-toon
description: |
  Use this when editing .shader files under Assets/Shaders/ in URP projects,
  or when the user asks for toon/cel/outline/rim-light shader help.
  Keywords: URP, ShaderLab, HLSL, toon, cel, outline.
---
```

**为什么**：Claude Code 的 skill 触发是**语义匹配 description**。同义词能命中，但模糊描述（"Helpful for X"）会让该触发的不触发、不该触发的乱触发。可命中的描述包含**任一**：路径前缀（`Assets/Shaders/`）、明确关键词（`URP`、`HLSL`）、或具体动作词（"editing .shader files"）。

---

## 3. 仓库目录（cc/）

```
cc/
├── README.md                 仓库门面
├── docs/                     设计文档（00–09）
├── refs/                     上游只读，submodule 或 gitignore
│   ├── everything-claude-code/    @ 841beea (ECC v1.10.0-489)
│   ├── claude-code-game-studios/  @ 9ccc544 (Donchitos)
│   ├── pixel-plugin/              @ dee3506 (推荐外部 plugin，未 cherry-pick)
│   ├── game-art-skill/            @ 2e34222 (cherry-pick game-art-polish)
│   └── fmod-mcp/                  @ 8e540e0 (推荐外部 MCP，未 cherry-pick)
├── user/                     L1 → ~/.claude/
│   ├── CLAUDE.md
│   ├── statusline.json
│   ├── MANIFEST.md           cherry-pick 来源登记
│   ├── rules/common/
│   ├── hooks/
│   ├── contexts/
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   └── scripts/{hooks,lib}/
├── project/                  L2 → <consumer>/CLAUDE.md + <consumer>/.claude/
│   ├── CLAUDE.md.template
│   ├── MANIFEST.md
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   ├── rules/
│   └── docs/                 协调 / 工作流说明（按需）
├── unity/                    L3 → <consumer>/Assets/Scripts/.claude/
│   ├── MANIFEST.md
│   └── {agents,skills,commands,rules,docs}/   按需建子目录
├── art/                      L3 → <consumer>/Assets/Art/.claude/
│   ├── MANIFEST.md
│   └── {agents,skills,commands,rules,docs}/   按需建子目录
├── audio/                    L3 → <consumer>/Assets/Audio/.claude/
│   ├── MANIFEST.md
│   └── {agents,skills,commands,rules,docs}/   按需建子目录
└── install.{sh,ps1}          部署器（设计见 `09-install-design.md`；实现待 split）
```

**禁止**：
- 跨层目录复制同一文件（同一文件**只能存在一层**，跨层引用见 §6）
- `refs/` 修改任何文件（只读）
- 在 `user/` 放游戏特化内容、在 `unity/` 放通用内容（违反层级隔离）

---

## 4. MANIFEST.md 规范

每层根目录强制有一份 `MANIFEST.md`，登记所有 cherry-pick。已建立：`cc/user/`、`cc/project/`、`cc/unity/`。

### 4.1 frontmatter

```yaml
---
layer: user | project | unity | art | audio
mirrors: <部署目标路径>
upstream_ecc_repo: affaan-m/everything-claude-code     # 或 Donchitos/...
upstream_ecc_sha: <40-char sha>
upstream_ecc_version: <git describe>
pinned_at: <YYYY-MM-DD>
---
```

多上游（ECC + Donchitos）时，重复 `upstream_*` 字段并加后缀（`upstream_donchitos_sha`）。

### 4.2 表格行

```markdown
| Target | Source | Type | Files | Adapted |
|---|---|---|---|---|
| rules/common/ | ecc:rules/common/ | dir | 10 | no |
| agents/csharp-reviewer.md | ecc:agents/csharp-reviewer.md | file | 1 | yes |
```

- **Target**：相对本层根目录
- **Source**：`ecc:<path>` 或 `donchitos:<path>` 或 `self`（自写）
- **Type**：`file` / `dir`
- **Files**：dir 时是该目录下文件总数（含子目录递归）
- **Adapted**：`no` 表示与上游字节一致；`yes` 必须在表格下方加备注说明改了什么

### 4.3 自写文件登记

我们自写的也要登记，`Source` 写 `self`：

```markdown
| skills/gamedev-balance-checker/ | self | dir | 3 | n/a |
```

---

## 5. 写作硬约束（适用于所有 04–08）

| 约束 | 上限/规则 | 出处 |
|---|---|---|
| CLAUDE.md 行数 | ≤ 300 行 | HumanLayer 经验法则（00-README §7） |
| Skill description | 必须含触发关键词 + 路径前缀 | §2.5 |
| Agent description | 必须含 1 句"何时启用" | Claude Code agent 协议 |
| Slash command 描述 | 必须含 1 行触发示例（"何时用此命令"） | 同上 |
| Cherry-pick 文件 | **不**修改 frontmatter；MANIFEST 登记 | 00-README §5 |
| 自写文件 frontmatter | 必须含 `name` `description`；可选 `model` `tools` | Claude Code 标准 |
| MCP 服务器 | **总数 ≤ 30 / 项目级 ≤ 10 / 活动工具 ≤ 80** | ECC README 警告 |
| 文件名 | kebab-case；中文文档可在内容用中文，文件名仍英文 | 跨平台兼容 |
| 路径引用 | cc/ 仓库内永远用 cc/ 相对路径（如 `cc/user/skills/...`）；引用部署后位置用 `~/.claude/...` 等绝对路径明示 | 减少歧义 |

---

## 6. 跨层引用（Cross-Layer References）

### 6.1 引用方向

允许：**高层（L1）被低层（L3）引用**。
- L3 unity skill 可以"调用 L1 的 search-first skill" — Claude 全局看得到
- L2 gamedev CLAUDE.md 可以"参考 L1 common/coding-style.md"

禁止：**低层被高层引用**。
- L1 user/CLAUDE.md **不**能写"在 Unity 项目中…" — 它对消费者是否做 Unity 一无所知

### 6.2 引用语法

文档里引用其他层文件时，用相对 cc/ 根目录的路径：

```markdown
见 `user/rules/common/coding-style.md` §3
触发后调用 `cc/user/skills/search-first/SKILL.md`
```

部署到目标系统后路径会变（`~/.claude/...`），但 cc/ 仓库内永远用 cc/ 相对路径。

---

## 7. 升级流程（与 ECC 同步）

ECC 推送新版本时：

```
1. cd refs/everything-claude-code && git pull
2. 对每层 MANIFEST.md：
   git diff <old-sha>..<new-sha> -- <Source 列出现的所有路径>
3. 对 adapted: no 的项：
   - 上游有变更 → 直接 cp 覆盖
   - 上游无变更 → 跳过
4. 对 adapted: yes 的项：
   - 比较 upstream diff 是否触及我们改写的部分
   - 不触及（上游改的是别的段落） → 接受 upstream 改动后重新应用我们的改写
   - 触及 → 手动 merge，更新 MANIFEST 备注我们的改写仍保留
5. 更新 MANIFEST.md 的 upstream_ecc_sha + pinned_at
```

不允许：批量 `git pull` 后一次性 cp 全部。每个变更必须个体审视。

**未来改进（暂不强制）**：MANIFEST 加 `pre_adapt_sha` 字段保留 pre-adapt 上游快照引用，让 §4 步骤能做真正的三方 merge。当前流量级（几十个 adapted 文件量级）下，手动 diff 已够用。

---

## 8. 章节绑定（下游文档锚点）

| 下游 | 必须遵守的本合约章节 | 主要交付物 |
|---|---|---|
| 04-general-rules.md | §1 L1 · §2.1 §2.5 · §5 · §6.1 | 改写 `cc/user/CLAUDE.md`；新增 `general-*` skill 的入选标准 |
| 05-gamedev-rules.md | §1 L2 · §2.1 (`gamedev-`) · §5 · §6.1 | 改写 `cc/project/CLAUDE.md.template`；定义 `gamedev-*` skill 矩阵 |
| 06-unity-rules.md | §1 L3 · §2.1 (`unity-`) · §5 · `cc/unity/MANIFEST.md` 中的 Unity 改写清单 | 起草 `cc/unity/CLAUDE.md.template`；改写 csharp baseline 为 Unity 版 |
| 07-art-rules.md | §1 L3 · §2.1 (`art-`) · §5 | 起草 `cc/art/CLAUDE.md.template`；新建 `art-*` skill |
| 08-audio-rules.md | §1 L3 · §2.1 (`audio-`) · §5 | 起草 `cc/audio/CLAUDE.md.template`；新建 `audio-*` skill |

---

## 9. 反模式清单（Anti-Patterns）

写下游文档时**不要**：

1. ❌ 在 user/CLAUDE.md 提"Unity"或"美术资源"（违反 §6.1）
2. ❌ 给 ECC cherry-pick 的文件加前缀重命名（违反 §2.2）
3. ❌ 让 CLAUDE.md 超 300 行（违反 §5）
4. ❌ skill description 写"Helpful for Unity"这种语义匹配不到的（违反 §2.5）
5. ❌ 在 MANIFEST 之外用 frontmatter source: 字段（违反 00-README §5 修订）
6. ❌ 复制同一文件到多个层（违反 §3 禁止条款）
7. ❌ 直接用绝对路径 `~/.claude/...` 引用 — cc/ 内部永远用 cc/ 相对路径（违反 §6.2）
8. ❌ 跳过 MANIFEST 直接 cp 文件（无登记 = 永久失追溯）

---

## 10. 状态

- 2026-05-01：本合约 v1 出炉，下游 04–08 据此起草。
- 2026-05-01：v1.1 修订（self-review 后）：§1 优先级语义改为解释惯例；§2.5 字面级 → 关键词/路径前缀；§3 art/audio 与 unity 对等；§5 模糊条目收紧；§7 三方 merge 改为现实流程；§1 加 settings.json / .mcp.json 部署边界。
- 2026-05-01：v1.2 同步 — 04–09 全部就位；§3 树更新含 5 个 refs 仓库；删除 "09 待写" 等历史标记。
- ✅ **写 05 前的硬前置已实现**：Donchitos 已 clone 至 `refs/claude-code-game-studios/`（pinned at 9ccc544）
- 修订需要：变更影响下游的章节时，必须列出受影响文档并同步更新。
