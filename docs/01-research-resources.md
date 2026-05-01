# Claude Code 高效配置 · 资料汇编（Research Notes）

> 日期：2026-05-01
> 用途：cc/ 这个 Claude Code 配置仓库的**素材库**。本文件只整理外部资源链接与要点，**不**作为可执行规则。后续 03–08 号文档基于本文件 + `02-ecc-categorization.md` 分层落地。
> 首个目标消费方：`修行计划`（Unity + 美术 + 音乐 + Python 数据策划脚本，多子项目工作区）。配置方案设计为**可复用**到其他游戏开发项目。

---

## 0. 阅读顺序建议

1. 第 1 章：理解 Claude Code 的可定制点（CLAUDE.md / Skills / Subagents / Hooks / Slash Commands / MCP），这是层级设计的前提。
2. 第 2 章：综合 awesome 列表 — 当索引用，不要全装。
3. 第 3 章：游戏开发专用骨架（重点是 Donchitos/Game-Studios）。
4. 第 4 章：引擎 MCP（让 Claude 直接动 Unity/Godot/UE 编辑器）。
5. 第 5 章：美术 / 像素 / 3D / Shader 工作流。
6. 第 6 章：CLAUDE.md 写作要点。
7. 第 7 章：首个目标项目「修行计划」备注（可作为其他游戏项目的接入参考）。

---

## 1. Claude Code 核心机制速览

### 1.1 五大可定制对象（2026 现状）

| 对象 | 位置 | 作用 | 是否自动加载 |
|---|---|---|---|
| **CLAUDE.md** | 任意目录 | 自然语言系统提示，进入该目录会话时叠加 | ✅ 自动，按目录层级累积 |
| **Skills** | `.claude/skills/<name>/SKILL.md` | 模型按描述动态调用的"专长包"，可含 scripts/templates | ⚠️ 按描述匹配触发 |
| **Subagents** | `.claude/agents/<name>.md` | 隔离上下文的子 Claude 实例，结果回主会话 | ⚠️ 按描述匹配或显式调用 |
| **Slash Commands** | `.claude/commands/<name>.md`（旧） / `.claude/skills/`（新） | 显式 `/cmd` 触发；2026 已与 skills 统一 | ⚠️ 显式触发或 skill 自动选 |
| **Hooks** | `.claude/settings.json` 的 `hooks` 字段 | 事件驱动的确定性脚本（pre-commit、PostToolUse 等），不会幻觉 | ✅ 事件触发 |
| **MCP Servers** | `.claude/settings.json` 的 `mcp` 字段或 `claude mcp add` | 给 Claude 接外部工具（Unity Editor、Blender、DB…） | ⚠️ 调用时启动 |

**关键事实**：
- Slash command 与 Skill 在 2026 已**统一**：`.claude/commands/` 仍兼容，但推荐 `.claude/skills/`，每个 skill 自带 `/slash` 接口。
- CLAUDE.md 建议 **< 300 行**，越短越好（HumanLayer 经验法则）。
- 子目录的 CLAUDE.md 会**叠加**到父目录之上 → 这就是天然的层级嵌套基础。

### 1.2 上下文与并行的硬规律

| 规律 | 出处 | 实操含义 |
|---|---|---|
| 单会话 60K token 后开始出错 | Claude 团队 | 大功能前 `/compact`，或开新会话 |
| `Shift+Tab` / `--permission-mode plan` | 官方 | 复杂任务**先规划，后执行** |
| Claude 团队首推：开 3–5 个 git worktree 并行 | Boris Cherny (Anthropic) | `claude --worktree` 原生支持 |
| `Ctrl+S` 暂存草稿 prompt | 官方 power user tips | 中途插问不丢草稿 |
| 共享 `~/code/.claude-notes.md` | 多 worktree 实践 | 跨会话状态同步 |
| Prompt cache 5 分钟 TTL | Anthropic | 断点重连最好 < 5 分钟，否则缓存失效 |

参考：
- [Claude Code Best Practices 官方](https://code.claude.com/docs/en/best-practices)
- [Claude Code Power User Tips 官方](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)
- [Builder.io 50 Tips](https://www.builder.io/blog/claude-code-tips-best-practices)
- [Marmelab Day-One Tips](https://marmelab.com/blog/2026/04/24/claude-code-tips-i-wish-id-had-from-day-one.html)
- [alexop.dev — Customization Guide](https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/)
- [alexop.dev — Full Stack Guide (MCP/Skills/Subagents/Hooks)](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [parallel worktree guide](https://www.codewithseb.com/blog/parallel-claude-code-sessions-git-worktrees-guide)

---

## 2. 综合 Awesome 合集（当索引，不要全装）

| 仓库 | 内容 | 备注 |
|---|---|---|
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | skills/hooks/slash commands/agent orchestrators/plugins | **首选元仓库** |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 1000+ skills，含 Anthropic、Google Labs、Vercel、Stripe、Figma 等官方包 | 强调"engineering team daily use" |
| [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) | 1400+ skills + 安装器 CLI，跨 Claude Code/Cursor/Codex/Gemini | 量大，质量参差 |
| [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 232+ 生产级 skills | |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | 经典 awesome 列表 | |
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | 偏 Claude Code | |
| [josix/awesome-claude-md](https://github.com/josix/awesome-claude-md) | **CLAUDE.md 范例库** | 写 CLAUDE.md 必看 |
| [ArthurClune/claude-md-examples](https://github.com/ArthurClune/claude-md-examples) | 简洁 CLAUDE.md 样例 | |
| [VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design) | 68 个 DESIGN.md 设计系统模板 | UI 项目可参考 |

CLAUDE.md 写法理论：[HumanLayer — Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## 3. 游戏开发专用骨架 ⭐

### 3.1 [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) — 最值得抄的骨架

把 Claude Code 整合成一个完整游戏工作室：**49 个 agent + 72 个 workflow skill**。MIT，16.8k stars。

**Agent 三层架构**：

- **Tier 1 Directors（Opus）**：Creative Director / Technical Director / Producer
- **Tier 2 Department Leads（Sonnet）**：
  - Game Designer · Lead Programmer · **Art Director** · Audio Director
  - Narrative Director · QA Lead · Release Manager · Localization Lead
- **Tier 3 Specialists（Sonnet/Haiku）**：
  - 设计：Systems / Level / Economy Designer
  - 编程：Gameplay / Engine / AI / Network / Tools / UI Programmer
  - **美术 & 音频：Technical Artist · Sound Designer**
  - 叙事：Writer · World Builder
  - UX：UX Designer · Accessibility Specialist
  - 测试：QA Tester · Performance Analyst · Analytics Engineer
  - 运维：DevOps · Security · Live-Ops · Community Manager
  - 原型：Prototyper
- **引擎专家**：
  - **Unity Specialist**（DOTS/ECS、Shaders/VFX、Addressables、UI Toolkit）
  - Godot Specialist（GDScript / Shaders / GDExtension）
  - Unreal Specialist（GAS / Blueprints / Replication / CommonUI）

**72 Skill 分组（节选）**：

| 分组 | Slash Commands |
|---|---|
| 入口 / 导航 | `/start` `/help` `/project-stage-detect` `/setup-engine` `/adopt` |
| 设计 | `/brainstorm` `/map-systems` `/design-system` `/quick-design` `/review-all-gdds` `/propagate-design-change` |
| **美术 & 资产** | **`/art-bible`** **`/asset-spec`** **`/asset-audit`** |
| UX | `/ux-design` `/ux-review` |
| 架构 | `/create-architecture` `/architecture-decision` `/architecture-review` `/create-control-manifest` |
| Story / Sprint | `/create-epics` `/create-stories` `/dev-story` `/sprint-plan` `/sprint-status` `/story-readiness` `/story-done` `/estimate` |
| 评审 | `/design-review` `/code-review` `/balance-check` `/content-audit` `/scope-check` `/perf-profile` `/tech-debt` `/gate-check` `/consistency-check` |
| QA | `/qa-plan` `/smoke-check` `/soak-test` `/regression-suite` `/test-setup` `/test-helpers` `/test-evidence-review` `/test-flakiness` `/skill-test` `/skill-improve` |
| 制作 | `/milestone-review` `/retrospective` `/bug-report` `/bug-triage` `/reverse-document` `/playtest-report` |
| 发布 | `/release-checklist` `/launch-checklist` `/changelog` `/patch-notes` `/hotfix` |
| 创意 | `/prototype` `/onboard` `/localize` |
| 多 agent 协调 | `/team-combat` `/team-narrative` `/team-ui` `/team-release` `/team-polish` `/team-audio` `/team-level` `/team-live-ops` `/team-qa` |

**目录结构（直接照抄）**：
```
CLAUDE.md                      # 主配置
.claude/
  settings.json                # hooks, permissions, rules
  agents/                      # 49 agent 定义
  skills/                      # 72 slash command
  hooks/                       # 12 自动校验脚本
  rules/                       # 11 路径作用域编码规范
  statusline.sh                # 上下文 / 会话状态
  docs/
    workflow-catalog.yaml      # 7 阶段 pipeline
    templates/                 # 39 文档模板
src/                           # 游戏源码
assets/                        # 美术 / 音频 / VFX / shader / data
design/                        # GDD / 叙事 / 关卡设计
docs/                          # 技术文档 + ADR
tests/                         # 单元 / 集成 / 性能 / playtest
tools/                         # 构建 / pipeline 工具
prototypes/                    # 抛弃式实验
production/                    # sprint / milestone / release
```

**12 Hook 自动校验**：硬编码值、TODO 格式、危险 push、文档缺失、agent 调用审计。
**11 Path-scoped Rules**：编辑 `assets/**` 时自动应用命名 / JSON 校验。

### 3.2 [devdavv/unity-ai-workflow](https://github.com/devdavv/unity-ai-workflow) — Unity 6.2+ 专精

- **9 Slash Commands**：`/uw-cmd-{setup-project, brainstorm, plan, create, implement-feature, test, debug, polish, review}`
- **13 Skills**：Game Feel（VFX/SFX/相机/震动 Rule of Three）、Architecture（Reflex DI、状态机、UI binding、ScriptableObject）、Tooling（NUnit/Gherkin）、Networking
- **流程**：Interrogation → GDD/GFD → TDD → Game Feel → Commit
- **模式**：默认 Guided（AI 提议 + 你确认）/ Autonomous（快速原型）
- ⚠️ **不覆盖美术/Shader 管线**，纯代码与手感向

### 3.3 [The1Studio/theone-training-skills](https://github.com/The1Studio/theone-training-skills) — Unity 工程规范执法

强制 VContainer + SignalBus + 简洁 C# 模式。**4 层优先级**：Code Quality（nullable / 访问修饰符 / 异常 / 日志）→ Modern Language → Architecture（DI / 状态管理）→ Performance。

也提供 [the1-unity-claude-agents best-practices](https://github.com/The1Studio/the1-unity-claude-agents/blob/master/docs/best-practices.md)。

### 3.4 [nowsprinting/claude-code-settings-for-unity](https://github.com/nowsprinting/claude-code-settings-for-unity)

个人 Unity 项目的完整 settings/skills 实战样本。直接借鉴 hooks 与 settings.json。

### 3.5 其他引擎

| 仓库 | 引擎 | 备注 |
|---|---|---|
| [htdt/godogen](https://github.com/htdt/godogen) | Godot + Bevy | 自主开发框架 |
| [Natfii/UnrealClaude](https://github.com/Natfii/UnrealClaude) | UE 5.7 | 内嵌文档 + 20+ MCP 工具 |
| [davila7/claude-code-templates — unity-game-developer.md](https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/agents/game-development/unity-game-developer.md) | 跨引擎 | C#/C++/GDScript 通用模板 |
| [Game Development Skills 目录](https://claudemarketplaces.com/skills/category/game-dev) | — | skill 市场 |

---

## 4. 引擎 MCP（让 Claude 直接控制编辑器）

### 4.1 Unity

| 项目 | 特点 |
|---|---|
| **[CoplayDev/unity-mcp](https://github.com/CoplayDev/unity-mcp)** | 主流方案，资源/场景/脚本/任务自动化。[Coplay setup 文档](https://docs.coplay.dev/coplay-mcp/claude-code-guide) |
| [CoderGamester/mcp-unity](https://github.com/CoderGamester/mcp-unity) | Node.js bridge，跨 Cursor/Claude Code/Copilot/Antigravity |
| [Unity 官方 MCP 2.0](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-overview.html) | 启动 Unity 即开 named pipe / unix socket，relay 装到 `~/.unity/relay/` |
| [pjbaron/unity-claude-code](https://github.com/pjbaron/unity-claude-code) | 适配 Claude Code Pro/Max plan |

**接入 Coplay 的命令**：
```bash
claude mcp add --scope user --transport stdio coplay-mcp \
  --env MCP_TOOL_TIMEOUT=720000 \
  -- uvx --python ">=3.11" coplay-mcp-server@latest
```

排错：[CoplayDev wiki — Fix Unity MCP and Claude Code](https://github.com/CoplayDev/unity-mcp/wiki/2.-Fix-Unity-MCP-and-Claude-Code)

### 4.2 Godot

- [ee0pdt/Godot-MCP](https://github.com/ee0pdt/Godot-MCP)
- [Dokujaa/Godot-MCP](https://github.com/Dokujaa/Godot-MCP)
- [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp)
- [Godot AI（Asset Library）](https://godotengine.org/asset-library/asset/5050) — 100+ 操作覆盖场景/节点/脚本/动画/UI/材质/粒子/音频，一键接入 18 个 MCP 客户端

---

## 5. 美术 / 音频资源工作流 ⭐

### 5.1 像素 / 2D

| 资源 | 说明 |
|---|---|
| **[willibrandon/pixel-plugin](https://github.com/willibrandon/pixel-plugin)** | Claude Code 控 **Aseprite**：自然语言出图、多帧动画、调色板预设（NES / Game Boy / C64 / PICO-8 / Sweetie16 / DawnBringer）、导出 PNG/spritesheet/JSON、对接 Unity/Godot/Phaser。安装：`/plugin` → Add marketplace → `willibrandon/pixel-plugin` |
| [Pixel Art Creator skill](https://mcpmarket.com/tools/skills/pixel-art-creator) | Aseprite 协同 |
| [Pixel Art Generator skill](https://mcpmarket.com/tools/skills/pixel-art-generator) | 文本→PNG，结构化设计流程（grid → palette → layered） |
| [pixel-art-game-builder](https://lobehub.com/skills/cooksaw-claude-skills-pixel-art-game-builder) | React+TS+Zustand 像素 idle 游戏脚手架 + 程序化精灵 + sheet 导出 |

### 5.2 3D / Blender

| 资源 | 说明 |
|---|---|
| **[ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)** | Blender ↔ Claude 自然语言建模/场景操作 |
| **[Anthropic 官方 Blender connector](https://9to5mac.com/2026/04/28/anthropic-releases-9-new-claude-connectors-for-creative-tools-including-blender-and-adobe/)** | 2026-04-28 发布，可分析整场景、批量改对象 |
| [Blender Toolkit skill](https://mcpmarket.com/tools/skills/blender-toolkit) | 建模 + 材质 + Mixamo 重定向（WebSocket 实时控制） |
| [Blender 3D Animation Studio](https://mcpmarket.com/tools/skills/blender-3d-animation-studio) | 2D→3D、程序化动画、分布式渲染 |
| [Generate 3D Model](https://mcpmarket.com/tools/skills/generate-3d-model) | image → GLB |
| [Hyper3D Rodin](https://mcpmarket.com/es/tools/skills/hyper3d-rodin-3d-generation) | 3D 资产生成 |

### 5.3 Shader / VFX

| 资源 | 说明 |
|---|---|
| [Unity Shaders Assistant](https://mcpmarket.com/tools/skills/unity-shaders-assistant) | ShaderLab + HLSL 模板，移动/VR 性能优化向 |
| [pronitdas/game-art-skill — shaders.md](https://github.com/pronitdas/game-art-skill/blob/main/shaders.md) | 卡通、描边、菲涅尔、溶解、全息、水/冰/玻璃配方（Unity Shader Graph + Godot 4） |
| [Top 8 Skills for 3D/Shader (Snyk)](https://snyk.io/articles/top-claude-skills-3d-modeling-game-dev-shader-programming/) | 综述 |

### 5.4 综合美术 plugin

- [seanlan/game-asset-design](https://www.claudepluginhub.com/plugins/seanlan-game-asset-design) — Gemini 图像生成 + Python 后处理 + Web 资源管理器

### 5.5 音频（资料相对薄弱）

- Donchitos/Game-Studios 自带 **Sound Designer agent** + `/team-audio` 协调命令，可作起点
- 目前没找到像 pixel-plugin / blender-mcp 那样成熟的"DAW MCP"。建议自建轻 skill：负责命名规范、文件格式（.wav 44.1kHz vs .ogg 压缩）、音量归一化（LUFS）、Unity AudioMixer 路由约定

---

## 6. CLAUDE.md 写作要点（Unity 场景）

参考 [The1Studio best-practices](https://github.com/The1Studio/the1-unity-claude-agents/blob/master/docs/best-practices.md)、[claudelab Unity guide](https://claudelab.net/en/articles/claude-code/claude-code-unity-game-development-guide)、[codewithmukesh CLAUDE.md mastery](https://codewithmukesh.com/blog/claude-md-mastery-dotnet/)。

CLAUDE.md 至少声明：
1. **Unity Version**（如 `6000.0.x LTS`）
2. **Rendering Pipeline**（URP / HDRP / Built-in）— 否则 Claude 会乱写 shader
3. **Input System**（new Input System / 旧 Input Manager）
4. **Scripting Backend**（Mono / IL2CPP）
5. **DI 框架**（VContainer / Reflex / Zenject）
6. **资源命名规范**与 `Assets/**` 路径作用域规则
7. **引用 skills**：例如 `Use 'theone-unity-standards' skill for all C# code.`

**硬规则**：< 300 行，越短越好。配 `.claude/rules/` 做 path-scoped 规范，让 Claude 编辑特定路径时自动应用。

---

## 7. 「修行计划」项目相关备注

> **快照时间**：2026-05-01 上午。后续项目状态可能变化（如 `game_develop/` 不再为空、新增子项目等），本节内容**不**随后续 v1.x 持续更新。如需最新状态，运行 `ls 修行计划/` 实地确认。

### 7.1 当前目录现状（2026-05-01 ls）
```
修行计划/
├── classify_formulas.py / extract_formulas.py    # 公式抽取
├── dsp_calculator.py / dsp_sim/                  # DSP 计算/模拟
├── economic_simulation.py + .png                 # 经济系统模拟
├── era.xlsx / era公式.csv / 基础公式.csv         # 数据策划表
├── game_develop/                                 # 游戏开发子目录
├── novel-helper/                                 # 子项目
├── 中国象棋/                                     # 子项目
├── refs/                                         # 参考资料
└── debug_log.txt
```

**性质判断**：这是一个**多子项目并行的游戏设计 + 原型工作区**，包含数据策划（Python + Excel）、经济模拟、若干独立游戏子项目（中国象棋、novel-helper、dsp_sim）和一个主战场 `game_develop/`。

**对配置方案的影响**：
- 不是单一 Unity 项目 → 顶层 CLAUDE.md 不能写"Unity 6000.0 LTS"这类硬约束
- 子项目可能用不同引擎/语言（Python 脚本、可能的 Unity 项目、纯文本子项目）→ **分层 CLAUDE.md 是天然合理的**
- 数据策划工作流（公式 / 经济模拟）应当作为通用 skill 之一保留

### 7.2 可在哪一层借鉴

| 资源 | 推荐层级 |
|---|---|
| HumanLayer CLAUDE.md 写法 / josix awesome-claude-md | 通用层（用户级 + 项目根） |
| Donchitos Game-Studios 骨架（agents + skills + hooks + 目录） | 游戏开发综合层 |
| theone-training-skills C# 4 层优先级 / nowsprinting Unity settings | Unity 子层 |
| pixel-plugin / blender-mcp / Unity Shaders Assistant / game-art-skill shaders.md | 美术子层 |
| `/team-audio` + Sound Designer agent | 音频子层（自建为主） |
| Coplay/CoderGamester unity-mcp | Unity 子层（MCP 配置） |

---

## 8. 「Everything」类巨型合集评估

代表：[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)（1000+）、[sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills)（1400+）、`mrcalderon3d/everything-game-dev-code` 等。

**结论：当索引用，不要全装**。理由：

1. **上下文污染**：Skill 描述会进入 Claude 的检索池。装 1000 个 skill，模型每次匹配都要在描述里"翻字典"，命中错误概率显著上升。
2. **质量参差**：很多是批量 AI 生成，没经过实际工程团队磨合。VoltAgent 自己强调"real-world skills used by actual engineering teams"正是在和批量合集划线。
3. **维护成本**：版本更新、命名冲突、与本项目 CLAUDE.md 的优先级冲突，调试代价极高。
4. **真正用得上的就 10–20 个**。

**正确用法**：
- 把这些大合集当 GitHub 上的"专业 skill 索引"
- 看到合适的就 **fork 单个 skill 文件夹** 进自己的 `.claude/skills/` 并裁剪
- 优先选有明确出处（Anthropic / Google Labs / Vercel / Stripe / Figma 等）或单仓库高 star 的（pixel-plugin、blender-mcp、Donchitos/Game-Studios）

---

## 附录 A · 完整链接索引（按主题）

### 综合
- https://github.com/hesreallyhim/awesome-claude-code
- https://github.com/VoltAgent/awesome-agent-skills
- https://github.com/sickn33/antigravity-awesome-skills
- https://github.com/alirezarezvani/claude-skills
- https://github.com/ComposioHQ/awesome-claude-skills
- https://github.com/travisvn/awesome-claude-skills
- https://github.com/josix/awesome-claude-md
- https://github.com/ArthurClune/claude-md-examples
- https://github.com/VoltAgent/awesome-claude-design

### 游戏开发骨架
- https://github.com/Donchitos/Claude-Code-Game-Studios
- https://github.com/devdavv/unity-ai-workflow
- https://github.com/The1Studio/theone-training-skills
- https://github.com/The1Studio/the1-unity-claude-agents
- https://github.com/nowsprinting/claude-code-settings-for-unity
- https://github.com/htdt/godogen
- https://github.com/Natfii/UnrealClaude
- https://github.com/davila7/claude-code-templates
- https://claudemarketplaces.com/skills/category/game-dev

### Unity / Godot MCP
- https://github.com/CoplayDev/unity-mcp
- https://github.com/CoderGamester/mcp-unity
- https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-overview.html
- https://github.com/pjbaron/unity-claude-code
- https://docs.coplay.dev/coplay-mcp/claude-code-guide
- https://github.com/ee0pdt/Godot-MCP
- https://github.com/Dokujaa/Godot-MCP
- https://github.com/Coding-Solo/godot-mcp
- https://godotengine.org/asset-library/asset/5050

### 美术 / 像素 / 3D / Shader
- https://github.com/willibrandon/pixel-plugin
- https://mcpmarket.com/tools/skills/pixel-art-creator
- https://mcpmarket.com/tools/skills/pixel-art-generator
- https://lobehub.com/skills/cooksaw-claude-skills-pixel-art-game-builder
- https://github.com/ahujasid/blender-mcp
- https://9to5mac.com/2026/04/28/anthropic-releases-9-new-claude-connectors-for-creative-tools-including-blender-and-adobe/
- https://mcpmarket.com/tools/skills/blender-toolkit
- https://mcpmarket.com/tools/skills/blender-3d-animation-studio
- https://mcpmarket.com/tools/skills/generate-3d-model
- https://mcpmarket.com/es/tools/skills/hyper3d-rodin-3d-generation
- https://mcpmarket.com/tools/skills/unity-shaders-assistant
- https://github.com/pronitdas/game-art-skill/blob/main/shaders.md
- https://snyk.io/articles/top-claude-skills-3d-modeling-game-dev-shader-programming/
- https://www.claudepluginhub.com/plugins/seanlan-game-asset-design

### 官方 / 教程 / 实战
- https://code.claude.com/docs/en/best-practices
- https://support.claude.com/en/articles/14554000-claude-code-power-user-tips
- https://www.builder.io/blog/claude-code-tips-best-practices
- https://marmelab.com/blog/2026/04/24/claude-code-tips-i-wish-id-had-from-day-one.html
- https://alexop.dev/posts/claude-code-customization-guide-claudemd-skills-subagents/
- https://alexop.dev/posts/understanding-claude-code-full-stack/
- https://www.codewithseb.com/blog/parallel-claude-code-sessions-git-worktrees-guide
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://codewithmukesh.com/blog/claude-md-mastery-dotnet/
- https://claudelab.net/en/articles/claude-code/claude-code-unity-game-development-guide
