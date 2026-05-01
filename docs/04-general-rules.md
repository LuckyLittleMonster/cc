# 04 · 通用层规则（L1 · `~/.claude/`）

> 角色：L1 设计文档 + `cc/user/CLAUDE.md` 改写依据。
> 绑定：03 §1 L1 · §2.1 · §2.5 · §5 · §6.1。
> 交付物：(a) 本文（设计 + 入选标准）；(b) 改写 `cc/user/CLAUDE.md`。

---

## 1. 目的

L1 是**跨项目工程基线**。承载内容必须满足：

> 不论项目是游戏、Python 数据脚本、文档库、纯配置仓库，这条规则都适用。

**不**承载：
- 任何引擎 / 框架 / 语言生态特化（这些归 L2 / L3）
- 项目身份信息（"这是修行计划"——归 L2）
- 美术 / 音频 / shader 等垂直子领域（归 L3）

服务对象：用户在任何项目里启动 Claude Code 时都先加载 L1，作为下层叠加的 baseline。

---

## 2. 当前状态（cherry-pick 摘要）

完整清单见 `cc/user/MANIFEST.md`。L1 已有：

| 类别 | 数量 | 关键项 |
|---|---|---|
| Rules | 10 | `common/{coding-style,git-workflow,testing,performance,patterns,hooks,agents,security,code-review,development-workflow}.md` |
| Hooks | 2 + 74 scripts | `hooks.json` + `scripts/{hooks,lib}/` 运行时 |
| Contexts | 3 | `dev.md` `review.md` `research.md` |
| Agents | 20 | planner / architect / code-reviewer / search-first 配套 / silent-failure-hunter / 等 |
| Skills | 34 | continuous-learning v2 / search-first / tdd-workflow / eval-harness / strategic-compact / 等 |
| Commands | 39 | /plan /code-review /skill-create /sessions /prp-* / 等 |
| 顶层 | 2 | `CLAUDE.md`（待改写）+ `statusline.json` |

**现状**：CLAUDE.md 是 ECC 的 `examples/user-CLAUDE.md` 直拷（109 行），与我们的实际环境（中文、Windows、VS Code、cc/ 层级体系）不符。本文 §3 给出改写规格。

---

## 3. user/CLAUDE.md 改写规格

### 3.1 与 ECC 原版的差异

| 项 | ECC 原版 | 改写版 | 理由 |
|---|---|---|---|
| 语言 | 全英文 | 中文为主，关键术语保留英文 | 用户母语；技术名词避免翻译失真 |
| 编辑器 | "I use Zed" | VS Code on Windows | 用户实际环境 |
| Agents 列表 | 9 个，含未 cherry-pick 的（security-reviewer / e2e-runner） | 20 个分组指引，不逐个枚举 | 与 MANIFEST 同步；详细查 ~/.claude/agents/ |
| Skills 列表 | 缺失 | 分组指引 + 关键 skill 提及 | 帮助 Claude 主动选用 |
| Commands 列表 | 缺失 | 分组指引 + PRP 流程标注 | 同上 |
| 个人偏好 | 通用 | 加 Windows + PowerShell + 中文响应规则 | 平台/语言一致性 |
| Hooks 章节 | 缺失 | 列出自动行为 + 修改路径 | 用户知道哪些是自动的 |
| MCP 上限 | 缺失 | 写入硬约束（30 / 10 / 80） | 03 §5 强制 |
| 修订路径 | 缺失 | 指向 `cc/user/CLAUDE.md` | 防止用户改错位置 |

### 3.2 必须包含的章节（按 03 §5 硬约束）

1. 工程姿态（plan-first / evidence / parsimony / verify-not-trust / test-first）
2. 自动加载的 `rules/common/` 索引（一行一个，不展开）
3. 当前 agents 分组指引（按"何时用"，不按字母）
4. 当前 skills 分组指引（按主题）
5. 当前 commands 分组指引（按工作流）
6. Contexts（dev/review/research）说明
7. 个人偏好（编码 / 通信 / git / 测试 / 知识沉淀 / 工具偏好）
8. Hooks 自动行为说明 + 修改路径
9. MCP 硬约束（30 / 10 / 80）
10. 工作环境（Windows + PowerShell + VS Code）
11. 成功标准（任务完成判据）

修订路径作为顶部 quote 块标注，不占独立章节。

### 3.3 必须**不**包含

- ❌ 任何 Unity / 游戏开发 / 美术 / 音频字眼（违反 03 §6.1）
- ❌ 项目名（修行计划 / 中国象棋）
- ❌ 引擎 / 框架特定 API
- ❌ 重复 `rules/common/*.md` 已有内容（rules 自动加载）
- ❌ 单 skill / agent 的详细描述（让 description 字段说话）

### 3.4 长度上限

≤ 300 行（03 §5）。目标 ~150 行。

---

## 4. `general-*` skill 入选标准

我们什么时候**新建**一个 `general-*` skill（而不是放 L2/L3）？

### 4.1 入选条件（必须全部满足）

1. **跨语言 / 跨技术栈适用**——例如"先写测试再实现"适用任何语言；"Unity Shader Graph 配方"不行
2. **跨项目类型适用**——游戏 / 数据脚本 / 文档库 / 工具仓库 都需要
3. **不依赖具体框架 / 引擎 / 平台**——纯方法论或通用工具
4. **触发条件可以用通用关键词描述**（03 §2.5）——不能只靠"Unity 项目里"才能匹配

### 4.2 不入选（应放 L2 或 L3）

- 描述里出现"游戏"/"GDD"/"playtest"——L2 (`gamedev-*`)
- 描述里出现"Unity"/"URP"/"MonoBehaviour"——L3 (`unity-*`)
- 描述里出现"sprite"/"调色板"/"Aseprite"——L3 (`art-*`)
- 描述里出现"WAV"/"LUFS"/"AudioMixer"——L3 (`audio-*`)

### 4.3 上移条件（L2/L3 → L1）

如果一个原本写在 L2/L3 的 skill 被发现：
- 在多个非游戏项目里也常用
- 触发条件能改写成跨领域通用

→ 上移到 L1，去掉前缀（如 `gamedev-balance-checker` 重命名 `balance-checker`）。MANIFEST 同步更新。

### 4.4 下移条件（L1 → L2/L3）

如果一个 ECC cherry-pick 到 L1 的 skill 被发现：
- 触发场景实际只在某垂直领域
- 描述泛化但实际命中只在一类项目

→ 下移到对应层（`cc/project/skills/` 或 `cc/unity/skills/`），加前缀。MANIFEST 双向同步（L1 删条 + 目标层加条）。

### 4.5 ECC cherry-pick 的领域沾染

ECC 自带文件的 description 偶尔会提及具体领域（"works on web, mobile, game" 之类）。这些**不主动改写**——保持 cherry-pick 字节一致是 MANIFEST 体系的前提（03 §5 "不修改 cherry-pick frontmatter"）。

但若 `/skill-stocktake` 评审时发现某 ECC 文件的描述强烈倾向某垂直领域以致触发率失衡（该触发的没触发，或反之），列入 §4.4 下移候选。下移意味着 fork 该文件到对应层 + 改写 description + MANIFEST 标 `adapted: yes`。

---

## 5. 跨项目验证

### 5.1 dogfood 目标

cc/ 自身就是 L1 的第一个消费方。本仓库的工作（写文档、cherry-pick、整理）应当：
- 触发 `search-first` skill（写代码前先调研）
- 触发 `skill-stocktake` skill（定期审计 skills/ 质量）
- 触发 `continuous-learning` 提取模式

### 5.2 候选消费方

| 项目 | 类型 | 验证 L1 的什么 |
|---|---|---|
| `修行计划/` | 多子项目游戏工作区 | L1 不污染游戏特化；中文响应；Python + C# 共存 |
| `修行计划/中国象棋/` | 单游戏子项目 | L1 + L2 叠加；多语言切换 |
| `修行计划/novel-helper/` | 文档/文本项目 | L1 在非游戏项目下的纯净度 |

### 5.3 验证流程

任何对 L1 的改动必须：
1. 在至少两个不同性质的项目里**完成 5 个真实任务**（一个游戏，一个非游戏）
2. 不出现"加了 L1 改动后游戏项目反而坏了"的回归
3. 触发记录通过 `continuous-learning` 直觉系统留痕（如该 hook 链路尚未跑通，回退到人工记日志）

---

## 6. 已知 gap / 未来工作

### 6.1 待评估

- **ECC 的 `rules/python/` 当前在 L2**——但内容是通用 Python，不是游戏数据策划专用。05 写完后回看：是否上移 L1？决策记入 05 的 §"开放问题"。
- **`general-windows-powershell` skill**？用户在 Windows + PowerShell，ECC 默认 Bash 假设较多。是否新建一个 PowerShell 触发的 skill 提示"用 PowerShell 语法而非 Bash"？写 04 时**先不建**，观察 ECC 通用 skills 是否已涵盖。
- **`general-chinese-response` skill**？中文响应已在 user/CLAUDE.md 个人偏好里，是否需要单独 skill？暂不需要。

### 6.2 不做

- ❌ 在 L1 加任何"游戏"相关 skill — 违反 §1 与 03 §6.1
- ❌ 创建 `general-game-balance` 之类的 skill — 错位
- ❌ 把 ECC 的整个 `mcp-configs/` 抄到 L1 — MCP 配置消费者敏感（Token、API key），交给消费方自己定

### 6.3 后续

- ✅ L1 改写完成；05 已写
- ✅ **写 05 前的硬前置已实现**：Donchitos clone at `refs/claude-code-game-studios/` @ 9ccc544
- 05 review L1 时未发现 game-tinted 表述（grep 验证 user/CLAUDE.md 无 Unity/游戏字眼）
- ECC 升级流程（`git pull refs/everything-claude-code`）由 03 §7 + 09 §9 规范

---

## 7. 状态

- 2026-05-01：本文 + cc/user/CLAUDE.md 改写完成。
- 待办：05 起草（依赖 04 定型）；art/ audio/ 目录的实际 skill 待 07 / 08 写。
