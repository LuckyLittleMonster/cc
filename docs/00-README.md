# cc/ · Claude Code 配置仓库 · 文档总览

> 本仓库的目标：为**游戏开发**（Unity + 美术 + 音乐 + Python 数据策划）打造一套**可复用、分层、可发布**的 Claude Code 配置。
> 首个目标消费方：`修行计划` 项目（多子项目游戏设计与原型工作区）。
> 设计为可适配到其他游戏开发项目。

---

## 1. 文档系列索引

| # | 文件 | 行数 | 类型 / 状态 |
|---|---|---|---|
| 00 | `00-README.md` | 当前文件 | 元文档 / 索引 |
| 01 | `01-research-resources.md` | 379 | 资料汇编（awesome 合集、Donchitos、pixel-plugin、blender-mcp 等） · 时间快照 2026-05-01 |
| 02 | `02-ecc-categorization.md` | 395 | ECC 三桶分类（需要 / 待定 / 不需要）· 已落地（cherry-pick 到 user/project/unity） |
| 03 | `03-hierarchy-design.md` | 284 | **架构合约**：层级、命名空间、目录布局、写作硬约束 · v1.1 |
| 04 | `04-general-rules.md` | 182 | 通用层 L1（`~/.claude/`）+ `cc/user/CLAUDE.md` 改写 · v1.1 |
| 05 | `05-gamedev-rules.md` | 314 | 游戏开发综合层 L2（项目根）+ Donchitos cherry-pick（21 agents / 26 skills / 7 rules / 4 coordination docs）+ project template · v1.1 |
| 06 | `06-unity-rules.md` | 292 | Unity 子层 L3 + Donchitos cherry-pick（5 agents / 4 rules / 16 engine-reference docs）+ unity template · v1.1 |
| 07 | `07-art-rules.md` | 264 | 美术子层 L3 + Donchitos cherry-pick（2 agents / 3 skills）+ game-art-skill 整 cherry-pick + art template · v1.1 |
| 08 | `08-audio-rules.md` | 286 | 音频子层 L3 + Donchitos cherry-pick（2 agents）+ audio template · v1.1 |
| 09 | `09-install-design.md` | 462 | `install.{sh,ps1}` 部署器**设计 spec**（实现待 split） |

**分组**：
- **00–02**：资料层 — 汇编与判断，**不**含可执行内容
- **03**：合约层 — 决定 04+ 怎么写的"宪法"
- **04–08**：规则层 — 真正落到 CLAUDE.md / skill / agent / hook 的内容
- **09**：部署层 — install 设计，整合 04–08 部署需求

---

## 2. 推荐阅读顺序

### 第一次读这套文档
1. **00**（本文件）— 总览
2. **02** — 看 ECC 哪些可用，建立"我们要什么 / 不要什么"的判断
3. **01** — 跨项目通用资源（Donchitos / pixel-plugin / blender-mcp / fmod-mcp 等），知道还有哪些选项
4. **03** — 架构合约（一旦写就，所有下游必须遵守）
5. **04–08** — 按层查阅
6. **09** — install 设计，准备部署到消费方时读

### 改动文档时
- 改 **03** 必须 review **04–09** 是否还满足合约
- 改 **04**（通用层）必须确认 **05–08** 没有覆盖冲突
- 改 **05–08** 不影响其他规则层，但若涉及部署需要同步 **09**
- 改 **09** 部署设计可能要回溯 **03 §1 部署目标表**

---

## 3. 仓库实际结构

```
cc/
├── README.md                       # 仓库门面（公开访客视角）
├── docs/                           # 设计文档 00–09（你正在读的）
│
├── refs/                           # 上游参考，只读 / submodule / gitignore
│   ├── everything-claude-code/     @ 841beea (ECC v1.10.0-489)
│   ├── claude-code-game-studios/   @ 9ccc544 (Donchitos)
│   ├── pixel-plugin/               @ dee3506 (Aseprite 像素美术 plugin)
│   ├── game-art-skill/             @ 2e34222 (game-art-polish skill)
│   └── fmod-mcp/                   @ 8e540e0 (FMOD Studio MCP，Claude Code 专用)
│
├── user/                           # L1 → ~/.claude/  (247 files)
│   ├── CLAUDE.md
│   ├── statusline.json
│   ├── MANIFEST.md
│   ├── rules/common/               (10)
│   ├── hooks/                      (2 + scripts/hooks/ 43)
│   ├── contexts/                   (3)
│   ├── agents/                     (20)
│   ├── skills/                     (34 dirs / 71 files)
│   ├── commands/                   (39)
│   └── scripts/{hooks,lib}/        (74)
│
├── project/                        # L2 → <consumer>/CLAUDE.md + .claude/  (69 files)
│   ├── CLAUDE.md.template          (217 行)
│   ├── MANIFEST.md
│   ├── agents/                     (22)
│   ├── skills/                     (28 dirs)
│   ├── commands/                   (1)
│   ├── rules/{python, path-scoped}/ (5+7)
│   └── docs/coordination/          (4)
│
├── unity/                          # L3 → <consumer>/<engine-subdir>/.claude/  (35 files)
│   ├── CLAUDE.md.template          (152 行)
│   ├── MANIFEST.md
│   ├── agents/                     (6: csharp-reviewer + 5 unity-*)
│   ├── skills/                     (2: csharp-testing, dotnet-patterns)
│   ├── rules/{csharp, path-scoped}/ (5+4)
│   └── docs/engine-reference/      (16)
│
├── art/                            # L3 → <consumer>/<art-subdir>/.claude/  (17 files)
│   ├── CLAUDE.md.template          (162 行)
│   ├── MANIFEST.md
│   ├── agents/                     (2: art-director + technical-artist)
│   └── skills/                     (4 dirs: art-bible / asset-spec / asset-audit / game-art-polish)
│
├── audio/                          # L3 → <consumer>/<audio-subdir>/.claude/  (4 files)
│   ├── CLAUDE.md.template          (205 行)
│   ├── MANIFEST.md
│   └── agents/                     (2: audio-director + sound-designer)
│
└── install.{sh,ps1}                # 部署器（实现待 split，设计见 09）
```

**关键约定**：
- `refs/` 只读，永不修改。需要时从中 cherry-pick 到 `user/`、`project/` 等
- `user/` ↔ `~/.claude/` 严格镜像
- 子层（`unity/` `art/` `audio/`）按子目录 CLAUDE.md 自动叠加加载机制设计
- 5 个上游 cherry-pick / 推荐：ECC + Donchitos（fork 替代）+ pixel-plugin + game-art-skill + fmod-mcp（外部 plugin / 推荐）

---

## 4. 术语表

| 术语 | 定义 |
|---|---|
| **CLAUDE.md** | 自然语言系统提示，按目录层级**自动叠加加载** |
| **Skill** | `.claude/skills/<name>/SKILL.md`，Claude 按 description 动态匹配触发 |
| **Subagent** | `.claude/agents/<name>.md`，隔离上下文的子 Claude 实例 |
| **Slash Command** | `.claude/commands/<name>.md`，显式 `/cmd` 触发（2026 已与 Skill 统一） |
| **Hook** | 事件脚本，确定性，不会幻觉。Claude Code v2.1+ 自动加载 `~/.claude/hooks/hooks.json` |
| **MCP** | Model Context Protocol 服务器，给 Claude 接外部工具（Unity Editor、Blender、FMOD、Ableton…） |
| **物理层级** | CLAUDE.md 的加载位置（用户级 / 项目根 / 子目录） |
| **主题命名空间** | skill / agent / command 的命名前缀（`general-*` `gamedev-*` `unity-*` `art-*` `audio-*`）— 仅适用自写文件，cherry-pick 保留原名 |
| **L1 通用层** | 跨所有项目共享，住在 `~/.claude/`，对应 `cc/user/` |
| **L2 游戏综合层** | 游戏项目专属但不绑引擎，住在 `<project>/CLAUDE.md`，对应 `cc/project/` |
| **L3 子层** | Unity / 美术 / 音频，住在 `<project>/<subdir>/CLAUDE.md`，对应 `cc/unity/` `cc/art/` `cc/audio/` |
| **MANIFEST.md** | 每层根的 cherry-pick 来源登记。frontmatter 含 `upstream_<source>_sha` 多上游字段；表格列 `Target / Source / Type / Files / Adapted` |
| **`adapted: yes/no/n/a`** | MANIFEST 表格列。`no` = 与上游字节一致；`yes` = 我们改写过（必须备注改了什么）；`n/a` = 自写文件 |
| **`Pre-adapt SHA`** | （09 §9 提议）adapted: yes 文件改写**前**的上游 git hash，用于升级三方 merge。当前未启用 |
| **agent-memory/** | （09 §7 设计）`<consumer>/.claude/agent-memory/<agent>/` 存每个 agent 跨 session 状态；与 ECC continuous-learning v2 互补 |
| **Path-scoped rules** | 按文件路径触发的规则。Donchitos 用约定式（agent 主动引用）；09 §6 提议用 hook + `_paths.yaml` 自动触发 |

**上游 5 个**：
- **ECC** — [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **Donchitos** — [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
- **pixel-plugin** — [willibrandon/pixel-plugin](https://github.com/willibrandon/pixel-plugin)（推荐外部，不 cherry-pick）
- **game-art-skill** — [pronitdas/game-art-skill](https://github.com/pronitdas/game-art-skill)（cherry-pick 到 cc/art/skills/game-art-polish/）
- **fmod-mcp** — [jmperez127/fmod-mcp](https://github.com/jmperez127/fmod-mcp)（推荐外部，不 cherry-pick）

---

## 5. 与上游的关系

本仓库**不是 ECC fork**，也**不是 Donchitos fork**。决策见 `02-ecc-categorization.md`：

> Cherry-pick 而非 fork。理由：ECC 55% 内容（Web/业务运营/医疗/区块链）对游戏开发是死重；Donchitos 缺 ECC 的 memory persistence / continuous learning 基础设施。自建 repo 才能贴合游戏开发 + 多子项目形态。

**Attribution 规则**：每层根目录维护 `MANIFEST.md`，单一文件归档来源；**不**修改被复制文件的 frontmatter。

```yaml
# cc/<layer>/MANIFEST.md frontmatter（多上游示例）
---
layer: project                                      # user | project | unity | art | audio
mirrors: <consumer-project>/.claude/
upstream_ecc_repo: affaan-m/everything-claude-code
upstream_ecc_sha: 841beea45cb25ba51f29fa45b7e272938d19b80a
upstream_donchitos_repo: Donchitos/Claude-Code-Game-Studios
upstream_donchitos_sha: 9ccc5440af4b6e9cfa0014c993cf37c6a81f4222
pinned_at: 2026-05-01
---
```

正文用表格列出 `target → source → 文件数 → adapted`。整目录 cp 的当作一条记录，不逐文件登记。

**升级流程**（多上游）：
- 升级 ECC：`refs/everything-claude-code` `git pull`，diff 影响文件，按 03 §7 流程更新对应 `upstream_ecc_*` 字段
- 升级 Donchitos：同上，更新 `upstream_donchitos_*`
- 升级 game-art-skill：同上，更新 `upstream_game_art_skill_*`
- 推荐外部插件（pixel-plugin / fmod-mcp / blender-mcp / Adobe / Ableton）由消费方独立维护，不在 cc/ MANIFEST 追踪

---

## 6. 状态

- **2026-05-01**：00–09 全部 v1 完成；03/04/05/06/07/08 各自经过 self-review v1.1 修订
- **规则层（04–08）+ 部署设计（09）已就位**：5 层（user/project/unity/art/audio）真实文件总数 372，docs/ 总行数 3027
- **2026-05-01（晚）：install v1 + v2 实现** —— `install.sh` + `install.ps1` + `scripts/install/install.js`（740 行 Node.js），支持自动检测、--check、--dry-run、占位符填充、scaffold 等。详见 `scripts/install/README.md`
- **cherry-pick 总览**：
  - ECC：覆盖 user / project / unity 的 baseline（rules/common、Python 工具链、C# baseline 等）
  - Donchitos：游戏角色 agents（21 in L2 + 5 in L3 unity + 2 in L3 art + 2 in L3 audio）+ game-dev skills（26 in L2）+ path-scoped rules（7 in L2 + 4 in L3 unity）
  - game-art-skill：1 个综合 polish skill 含 9 reference docs
- **下一步选项**：(a) ~~install v1 实现~~ ✅ 已完成（v1+v2）；(b) dogfood 真实游戏项目；(c) 写 `gamedev-*` `unity-*` `art-*` `audio-*` 自写 skill；(d) install v3（path-scoped hook + `--uninstall`）

---

## 7. 跨文档约定（v1.1）

下游所有文档（03–09）默认遵守：

- **CLAUDE.md 长度上限：300 行**（HumanLayer 经验法则；docs/ 与 MANIFEST 不受此约束）
- **Skill 描述（SKILL.md frontmatter 的 `description`）必须明确触发条件**——含路径前缀或关键词（03 §2.5）
- **Cherry-pick 文件不修改 frontmatter**；来源由每层 `MANIFEST.md` 登记
- **跨层引用方向**：高层（L1）可被低层（L3）引用；低层不能被高层引用（03 §6.1）
- **路径引用语法**：cc/ 仓库内永远用 cc/ 相对路径；引用部署后位置用 `~/.claude/...` 等绝对路径明示（03 §5）
- **MCP 上限**：总数 ≤ 30 / 项目级 ≤ 10 / 活动工具 ≤ 80（ECC README 警告）
- **文件名**：kebab-case；中文文档可在内容用中文，文件名仍英文

具体形式见 `03-hierarchy-design.md`。

---

## 8. 文档间引用速查

| 主题 | 主要 doc | cross-ref |
|---|---|---|
| 层级合约 | 03 | 04–09 全部绑定 |
| ECC 分类决策 | 02 | 04 §6 (Python rules 归属) |
| 命名空间 | 03 §2 | 04 §4 / 05 §4 / 06 §4 / 07 §4 / 08 §4（各层入选标准） |
| MANIFEST 字段 | 00 §4 + 03 §4 | 5 个 MANIFEST.md 实际文件 |
| 部署目标 | 03 §1 + 09 §2 | 各 layer template "在层级中位置" 章节 |
| Path-scoped rules | 05 §5.3 + 06 §5.3 + 09 §6 | path-scoped/ 目录 + `_paths.yaml`（待实现） |
| agent-memory | 09 §7 | 各 layer template 提及 |
| 推荐外部插件 | 07 §5.3 / 08 §5.3 | 各 art / audio template §5 |
| 升级流程 | 03 §7 / 09 §9 | MANIFEST `Pre-adapt SHA` |
