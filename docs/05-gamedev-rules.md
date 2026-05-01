# 05 · 游戏开发综合层规则（L2 · `<project>/`）

> 角色：L2 设计文档 + `cc/project/CLAUDE.md.template` 改写依据 + Donchitos cherry-pick 计划。
> 绑定：03 §1 L2 · §2.1 (`gamedev-`) · §5 · §6.1。
> 交付物：(a) 本文；(b) 改写 `cc/project/CLAUDE.md.template`；(c) Donchitos cherry-pick 落地；(d) 更新 `cc/project/MANIFEST.md`。

---

## 1. 目的

L2 是**游戏项目根层**——服务"游戏项目，但不绑定具体引擎"的工作。承载内容必须满足：

> 换 Unity → Godot，或 2D → 3D，规则仍然成立。

判据：**"换引擎仍适用"**。

**在 L2**：游戏设计、平衡、关卡设计、playtest、sprint 流程、跨子系统协调、角色 agent（producer / game-designer / writer 等）、与具体游戏数据相关的 Python 脚本规范。

**不在 L2（→ L3）**：URP/HDRP shader、MonoBehaviour、Aseprite、LUFS、AudioMixer、Unity Addressables、引擎编辑器特定 API。

**也不在 L2（→ L1）**：跨语言通用工程姿态、git 习惯、TDD、Plan Mode 用法。

---

## 2. 当前状态与计划 cherry-pick

| 类别 | 当前（L2） | 本轮新增 | 来源 |
|---|---|---|---|
| Agents | 1 (python-reviewer) | +**21** Donchitos | Donchitos Tier 1+2+3 非引擎非美音 |
| Skills | 2 (python-patterns, python-testing) | +**26** Donchitos | 设计 / sprint / 评审 / playtest / 引擎初始化 |
| Rules | 5 (python/) | +**7** Donchitos | path-scoped: design-docs / data-files / test-standards / 等 |
| Commands | 1 (python-review) | （0） | 暂不抄 Donchitos commands（与 skill 重叠） |
| Hooks | 0 | (0) | Donchitos `.sh` 与 ECC `.js` 体系冲突，本轮**不抄**（见 §5.4） |
| CLAUDE.md.template | 1（ECC 直拷） | **改写** | §3 |

完整清单见 `cc/project/MANIFEST.md`（本轮更新）。

---

## 3. project/CLAUDE.md.template 改写规格

### 3.1 与 ECC 原版的差异

ECC `examples/CLAUDE.md`（项目层版本）通用通杀，但缺：
- 游戏项目身份声明（这是 L2，不是普通项目）
- 引擎选择占位符（`[Unity / Godot / Unreal]`，由消费者填）
- 数据策划工作流（修行计划这种 Excel + Python 表驱动）
- Donchitos 资源索引（agents/skills/rules）

### 3.2 必须包含的章节

1. **项目身份**：游戏类型、引擎选择占位符、技术栈占位符
2. **L2 在干什么**：链接到 `~/.claude/CLAUDE.md`（L1）；说明 L3 按需叠加（引擎中立描述）
3. **Donchitos 资源索引**：本层带的 agents / skills / path-scoped rules + Python 数据策划工具链（不重复内容，只索引）
4. **数据策划工作流**：表驱动设计（Python + CSV + Excel），如何与游戏代码协作
5. **Sprint / playtest / milestone 默认工作流**：由 Donchitos skills 提供
6. **技术规范**：通用风格 / 游戏代码风格 / 数据文件 / 测试，引用对应 rules
7. **多子项目工作区支持**：单一 game project vs 多子项目形态
8. **引擎子层（L3）位置**：典型布局（Unity / Godot / Unreal / 自研）+ 加载条件
9. **修订路径**：改 `cc/project/CLAUDE.md.template` → install 时填充到 `<project>/CLAUDE.md`

修订路径作为顶部 quote 块标注 + §9 章节，保证消费者两处看见。

### 3.3 必须**不**包含

- ❌ 引擎特定 API（URP / MonoBehaviour / GDScript）—— 03 §6.1 违反
- ❌ 美术 / 音频细节（Aseprite / LUFS）
- ❌ 重复 L1 工程姿态
- ❌ 重复具体 skill / agent 的 description（让 description 字段说话）

### 3.4 长度上限

≤ 300 行（03 §5）。目标 ~200 行。

---

## 4. `gamedev-*` skill 入选标准

我们什么时候**新建**一个 `gamedev-*` skill（vs 抄 Donchitos 或留 L1）？

### 4.1 入选条件（必须全部满足）

1. **跨引擎适用**——Unity / Godot / Unreal 任一都用得上
2. **游戏特化**——非游戏项目用不上
3. **Donchitos 没覆盖或不够好**——优先 cherry-pick
4. **触发条件具体**（03 §2.5）——含路径前缀（`design/**` `production/**`）或关键词（GDD / sprint / playtest / balance）

### 4.2 不入选（应放 L1 或 L3）

- 描述里出现"Unity"/"URP"/"MonoBehaviour"/"DOTS"——L3 (`unity-*`)
- 描述里出现"sprite"/"调色板"/"Aseprite"/"Blender"——L3 (`art-*`)
- 描述里出现"WAV"/"LUFS"/"AudioMixer"——L3 (`audio-*`)
- 描述里**不含**任何游戏术语（GDD / mechanic / playtest / balance / progression）——L1 (`general-*`)

### 4.3 优先级：Donchitos > 自写

如果某能力 Donchitos 已有 skill（如 `balance-check`、`playtest-report`），cherry-pick 而非自写。仅当 Donchitos 缺失或不适配时自写。

---

## 5. Donchitos cherry-pick 计划

### 5.1 Agents（21 个 → `cc/project/agents/`）

**Tier 1 · 领导（3）**：
`creative-director` · `technical-director` · `producer`

**Tier 2 · 部门 lead（4）**：
`game-designer` · `lead-programmer` · `qa-lead` · `narrative-director`

**Tier 3 · 通用专家（14）**：
- 设计：`systems-designer` `level-designer` **`economy-designer`** ⭐
- 编程：`gameplay-programmer` `engine-programmer` `ai-programmer` `ui-programmer` `tools-programmer`
- 内容：`writer` `world-builder`
- UX / QA：`ux-designer` `qa-tester`
- 性能 / 原型：`performance-analyst` `prototyper`

> **关于 `engine-programmer`**：Donchitos 把它当通用角色 agent，但实际工作（rendering / physics / memory）依赖具体引擎。L2 保留它的角色协调能力，**但具体引擎实现必须委托 L3 引擎专家**（`unity-specialist` 等）。CLAUDE.md.template 的 `engine-programmer` description 不改（cherry-pick 不动 frontmatter，03 §5）；委托关系在 §3.1 协作协议里体现。

**不抄到 L2**（→ L3）：
- `art-director` `technical-artist` → `cc/art/`（07）
- `audio-director` `sound-designer` → `cc/audio/`（08）
- `unity-specialist` + 4 sub → `cc/unity/`（06）
- `godot-*` `unreal-*` → 我们不做这两个引擎，不抄
- `unity-*` 4 个 sub → `cc/unity/`（06）

**暂不抄**（小项目用不上）：
- `release-manager` `localization-lead` `network-programmer` `accessibility-specialist` `devops-engineer` `analytics-engineer` `security-engineer` `live-ops-designer` `community-manager`

随项目长大需要时再 cherry-pick；MANIFEST 留追溯。

### 5.2 Skills（26 个 → `cc/project/skills/`）

**入口**：`start` `setup-engine`（多引擎 init wizard，`/setup-engine unity` 等）

**设计**（5）：`brainstorm` `quick-design` `design-system` `propagate-design-change` `map-systems`

**架构**（2）：`create-architecture` `architecture-decision`

**Sprint / Story**（5）：`create-stories` `dev-story` `sprint-plan` `story-done` `estimate`

**评审**（4）：`design-review` **`balance-check`** ⭐ `scope-check` `perf-profile`

**Bug / playtest**（3）：`bug-report` `bug-triage` **`playtest-report`** ⭐

**制作**（2）：`milestone-review` `release-checklist`

**创意**（1）：`prototype`

**UX**（2）：`ux-design` `ux-review`

**不抄**（理由）：
- `code-review`（Donchitos）vs ECC `code-review`（L1）—— **冲突，用 ECC 版**
- `team-*` 系列 —— 单人项目用不上多 agent 编排；将来再说
- `team-audio` `team-narrative` 中的 audio/narrative —— 推到 L3
- `qa-plan` `smoke-check` `regression-suite` 等 —— 复杂 QA 流，单人用不上
- `localize` `onboard` 等 —— 阶段未到
- `hotfix` `patch-notes` `day-one-patch` —— 发布期再加
- `architecture-review` `create-control-manifest` `create-epics` —— 重流程，单人精简
- `gate-check` `consistency-check` `content-audit` `tech-debt` —— 后期质量门
- `security-audit` —— offline 单机不需

### 5.3 Path-scoped rules（7 个 → `cc/project/rules/path-scoped/`）

| Rule | 作用路径（约定） | 为何 L2 |
|---|---|---|
| `design-docs.md` | `design/**` | 跨引擎设计文档规范 |
| **`data-files.md`** ⭐ | `data/**` `*.json` `*.yaml` `*.csv` | 修行计划公式表正中 |
| `test-standards.md` | `tests/**` `**/*_test.{cs,py,...}` | 跨引擎测试标准 |
| `prototype-code.md` | `prototypes/**` | 抛弃式原型 |
| `gameplay-code.md` | `src/gameplay/**` 等 | 玩法代码（具体 API 在 L3） |
| `ai-code.md` | `src/ai/**` 等 | AI / NPC 行为代码 |
| `narrative.md` | `narrative/**` `dialogue/**` | 叙事文本 |

**不抄**（→ L3 unity）：`engine-code.md` `network-code.md` `shader-code.md` `ui-code.md`

**关于"path-scoped" 机制**：Donchitos 这些 rules 不是 Claude Code 引擎自动按路径加载（Claude Code 没这个机制），而是**约定**：agents/CLAUDE.md 在编辑相关路径时主动引用对应 rule。要做到自动触发，需要 hook 介入（见 §9 已知 gap）。

### 5.4 暂不抄：Donchitos hooks

Donchitos 12 个 hook 都是 `.sh`：
- 我们 L1 已有 ECC 的 Node.js hooks（74 个 scripts），跨平台
- Donchitos `.sh` 在 Windows 需要 git-bash，体验差
- `validate-assets.sh` 等独有功能值得**重写为 Node.js**，但本轮不做

**已知 gap**：`validate-assets`（资源命名/格式校验）+ `validate-skill-change`（skill 修改完整性）值得借鉴。后续作为 09-install-design 或独立任务。

**未来引入路径**：`.js` 版本完成后部署到 `cc/project/hooks/hooks.json` + `cc/project/scripts/hooks/*.js`，与 ECC L1 hooks 注册机制一致——Claude Code v2.1+ 自动加载 plugin 的 `hooks/hooks.json`，**无需** consumer 在 settings.json 显式 reference。

### 5.5 命名冲突处理（按 03 §2.4）

逐项核对：

| 项目 | ECC（L1） | Donchitos（L2） | 处理 |
|---|---|---|---|
| `code-review` | command | skill | 都是 slash command 接口 → **冲突，用 ECC 版**，Donchitos 不抄 |
| `architecture-decision-records` vs `architecture-decision` | ECC skill | Donchitos skill | 不同名，不冲突 |
| `planner` agent | ECC | （Donchitos 无） | 不冲突 |
| `architect` agent | ECC | Donchitos `lead-programmer` | 不同名，不冲突 |
| `code-reviewer` agent | ECC | Donchitos `lead-programmer`（部分重叠） | 不同名，不冲突；可同时存在 |

**结论**：除 `code-review` 一处外无冲突。03 §2.4 "加 -ecc / -donchitos 后缀"机制本轮无需启用。

**关于丢失的 Donchitos `code-review`**：Donchitos 版本可能含游戏特化 lens（balance / UX / level flow），ECC 版偏代码质量与安全。我们的补救：
- 简单情况：`/code-review` 用 ECC 版（代码质量 + 安全）
- 游戏特化情况：调用 `lead-programmer` 或 `game-designer` agent，让其按游戏维度审查
- 未来如发现 ECC 版漏掉的游戏审查点形成模式，触发 04 §4.5（fork ECC `/code-review` 到 L2 重命名 + adapted: yes）

---

## 6. ECC `rules/python/` 归属决策

来自 04 §6.1 留下的 TODO："是否上移 L1？"

**决策：保留 L2，不上移**。

**理由**：
- 我们的项目语境下，Python 主要用于**游戏数据策划**（修行计划的 `economic_simulation.py` `dsp_calculator.py` `era公式.csv` 公式表抽取等）
- L1 应当语言无关；L1 装 Python rules 会污染非 Python 项目（虽然 Claude Code 是文本叠加无强制覆盖，但描述会进入语义匹配池）
- L2 的 Python rules 加载条件：消费方在项目 CLAUDE.md.template 里 @ import；非 Python 项目不 import 即可

**未来变化触发**：如发现 Python 在多个非游戏项目中也常用，触发 04 §4.3 上移条件。当前不触发。

---

## 7. 多子项目工作区支持

修行计划这种**多子项目并行**形态（`game_develop/` `中国象棋/` `novel-helper/` `dsp_sim/` 各自独立）需要决策：L2 部署到哪？

### 7.1 三种部署策略

**A. Workspace-level L2**（部署到工作区根）
- `修行计划/CLAUDE.md` 是 L2
- 所有子项目继承
- 适合：所有子项目都是游戏

**B. Per-subproject L2**（每个游戏子项目独立部署）
- `修行计划/game_develop/CLAUDE.md` 是 L2
- `修行计划/中国象棋/CLAUDE.md` 是 L2
- `修行计划/novel-helper/`（非游戏）不部署 L2
- 适合：子项目混合（部分游戏，部分非游戏）

**C. Hybrid**（A + B）
- 工作区根有轻量 L2（介绍 workspace）
- 子项目根有完整 L2
- Claude 进入子项目时叠加加载

### 7.2 推荐：B 或 C

修行计划是混合类型（中国象棋是游戏、novel-helper 是文本工具）。**B 最干净**；C 在工作区根有"导航 CLAUDE.md"时更友好。

`cc/project/CLAUDE.md.template` 默认用 B 形态写。消费者按需调整。

### 7.3 install 选项

`09-install-design.md` 已规范该接口（v1+ 支持）：
```bash
install --layer project --target <subproject-path>     # 单子项目
install --layer project --target <workspace-root>      # 工作区根
```

---

## 8. 验证流程

### 8.1 dogfood 路径

经 ls 确认（2026-05-01）：
- `修行计划/中国象棋/` ✅ 真实可用（Python MCTS 国际象棋：`game.py` `mcts.py` `model.py` `train.py`）—— 主 dogfood
- `修行计划/game_develop/` ❌ 空目录占位
- `修行计划/dsp_sim/` ⚠️ 工业 DSP 模拟（C/C++ + Makefile），不是游戏，不计入 L2 dogfood

**主 dogfood**：`修行计划/中国象棋/`。在该项目完成 5 个真实任务（按 04 §5.3 标准）：
- 触发 `brainstorm` skill 为棋类 AI 增强设计新机制（如开局库 / 残局库）
- 触发 `balance-check` 校验 MCTS 探索参数
- 触发 `playtest-report` 记录对弈测试反馈
- 触发 `bug-triage` 处理 AI bug
- 触发 `dev-story` 实现一个 user story（如新棋种 / GUI 界面）

**非游戏对照项目**（验证 L1 不污染）：
- `修行计划/novel-helper/`（文档 / 文本工具）—— 验证 L1 在非游戏项目下的纯净度
- `修行计划/dsp_sim/`（C/C++ DSP 模拟）—— 非游戏，验证 L2 不被部署

### 8.2 不能出现的回归

- L2 把 Unity 词汇泄露到非 Unity 子项目（违反 03 §6.1）
- L2 在非游戏子项目（novel-helper）下还自动加载（应只在游戏路径触发）
- ECC L1 已有的能力被 Donchitos 重复（注意力分散）

---

## 9. 已知 gap / 后续

### 9.1 待补全
- **path-scoped rules 自动触发**：当前是约定，agents 手动检查；理想方案是 hook 在 PostEdit 时按文件路径反查应该应用哪条 rule，并提醒 Claude。**写 09 时考虑**。
- **`validate-assets` / `validate-skill-change` Node.js 重写**：Donchitos `.sh` 改 ECC 风格 `.js`；写 09 时一并。
- **多子项目 install 子命令**：`install --layer project --target <path>` 需要 09 文档定义。

### 9.2 待评估
- Tier 1 agent（creative-director / technical-director / producer）在单人项目里是否过度？默认抄进来，使用频率低就移除。
- `team-*` 系列是否值得未来抄？单人项目用不上多 agent 编排。继续观察。
- Donchitos 有 `agent-memory/` 目录（每 agent 一份持久化状态），是否值得映射到我们体系？ECC 的 continuous-learning v2 是 session 级，Donchitos 是 agent 级——结合可能更强。**L2 dogfood 时观察是否需要**（非 06 专属，09 install 设计时一并考虑）。

### 9.3 写 06 前需要 ✅ 已实现

- ✅ 06 已写；`engine-reference/unity/` 整 16 文件 cherry-pick 到 `cc/unity/docs/engine-reference/`
- ✅ `unity-specialist` + 4 sub-specialists 已 cherry-pick 到 `cc/unity/agents/`
- ✅ `engine-code.md` `shader-code.md` `ui-code.md` `network-code.md` 已 cherry-pick 到 `cc/unity/rules/path-scoped/`
- ⚠️ `setup-engine` skill 修订上移到 L2（见本节末尾备注）—— 06 self-review 时发现并修正

---

## 10. 状态

- 2026-05-01：本文 v1 + cc/project/ Donchitos cherry-pick 完成 + project/CLAUDE.md.template 改写完成。
- 待办：06（Unity 子层）— 依赖本轮的"L2 已就位"。
