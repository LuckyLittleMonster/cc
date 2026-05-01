# Everything Claude Code (ECC) · 三桶分类

> 日期：2026-05-01
> 上游：`refs/everything-claude-code/` (affaan-m/everything-claude-code)
> 视角：Unity 游戏开发 + 美术 + 音乐 + Python 数据策划脚本（多子项目工作区）
> 目的：决定 ECC 哪些组件**抄进我们自己的配置**、哪些**待定**、哪些**完全不要**

---

## 0. 总体评价

ECC 不是"为游戏开发设计"的工具集，它的真实定位偏向 **SaaS / Web 产品 / 业务运营 / 移动端 / AI agent 工程**：
- Web 框架：Next.js、Django、Laravel、Spring Boot、Rust API、NestJS、Nuxt4
- 业务运营：投融资资料、市场研究、客户/账单运营、社媒分发
- 医疗合规：HIPAA、EMR、PHI（专门一组 skill）
- 移动端：Swift、Kotlin、Flutter、Compose Multiplatform
- AI agent：continuous-learning、eval-harness、agent-harness

**对游戏开发真正有价值的部分集中在三个层次**：
1. **架构理念**（memory-persistence、continuous-learning、token 优化、并行 worktree、subagent 编排、三层 rules）
2. **通用工程 agents/skills/commands**（planner、architect、code-reviewer、search-first、skill-stocktake）
3. **C# 与 Python 语言相关**（rules/csharp、rules/python、csharp-reviewer、python-patterns）

**美术 / 音乐 / Unity 引擎 — ECC 全部缺失**。这部分仍要走我们自己的方案（pixel-plugin、blender-mcp、Donchitos/Game-Studios 骨架等）。

---

## 1. Agents（48 个）

### ✅ 需要的（直接抄）

| Agent | 用途 | 备注 |
|---|---|---|
| `planner` | 功能实现规划 | 通用核心 |
| `architect` / `code-architect` | 架构决策 | 游戏架构同样需要 |
| `code-reviewer` | 通用代码审查 | 核心 |
| `code-explorer` | 代码探索 | 通用 |
| `code-simplifier` | 简化代码 | 通用 |
| `refactor-cleaner` | 死代码清理 | 通用 |
| `csharp-reviewer` ⭐ | C# 审查 | **Unity 主语言** |
| `python-reviewer` ⭐ | Python 审查 | 数据策划脚本 |
| `performance-optimizer` ⭐ | 性能优化 | 游戏关键 |
| `silent-failure-hunter` ⭐ | 隐式失败定位 | 游戏常见 silent bug |
| `type-design-analyzer` | 类型设计分析 | C# 类型设计很重要 |
| `comment-analyzer` | 注释分析 | 通用 |
| `doc-updater` | 文档同步 | 通用 |
| `docs-lookup` | API 文档查阅 | 通用 |
| `harness-optimizer` | Claude Code 自身调优 | 元工具 |
| `loop-operator` | 自主循环 | 资源批处理 |
| `tdd-guide` | TDD 指引 | Unity 也用 NUnit |
| `pr-test-analyzer` | PR 测试分析 | 通用 |
| `build-error-resolver` | 构建错误（通用） | Unity csproj 也会用 |
| `a11y-architect` | 无障碍架构 | 游戏 UX |
| `conversation-analyzer` | 会话分析 | 元工具 |

### ⚠️ 无法决定（取决于技术选型）

| Agent | 何时需要 |
|---|---|
| `cpp-reviewer` / `cpp-build-resolver` | 只在用 Unity DOTS / Burst / native plugin 时 |
| `rust-reviewer` / `rust-build-resolver` | 只在用 Bevy 或写 Rust 工具时 |
| `pytorch-build-resolver` | 只在游戏内集成 ML 模型时 |
| `gan-evaluator` / `gan-generator` / `gan-planner` | 只在用 GAN 生成美术资源时（实验性） |
| `e2e-runner` | Playwright 主要 web，但游戏自动化测试方法可借鉴 |
| `chief-of-staff` | 单人项目可能用作起草助手 |
| `seo-specialist` | 只在做游戏官网 / Steam 页 SEO 时 |
| `flutter-reviewer` / `dart-build-resolver` | 只在用 Flutter 写编辑器/伴侣 App 时 |
| `kotlin-reviewer` / `kotlin-build-resolver` | 只在做 Android 端口时 |

### ❌ 不需要的

`go-reviewer` / `go-build-resolver` · `java-reviewer` / `java-build-resolver` · `typescript-reviewer` · `database-reviewer` · `healthcare-reviewer` · `opensource-forker` / `opensource-packager` / `opensource-sanitizer` · `security-reviewer`（offline 单机游戏不必要）

---

## 2. Skills（182 个）

按主题分组评估，不逐个列。

### ✅ 需要的

#### 2.1 元工程（最有价值的部分）⭐⭐
- `agentic-engineering` — agent 工程理念
- `coding-standards` — 通用编码规范
- `continuous-learning` + `continuous-learning-v2` — 自动从会话提取模式 / 直觉系统
- `iterative-retrieval` — 子 agent 上下文优化
- `strategic-compact` + `context-budget` + `token-budget-advisor` — 上下文预算管理
- `search-first` — 先调研再编码
- `skill-stocktake` + `skill-comply` — skill 质量审计
- `rules-distill` — 规则提炼
- `hookify-rules` — hooks 规则配置
- `prompt-optimizer` — prompt 优化

#### 2.2 工作流核心
- `tdd-workflow` — TDD（Unity 也能用）
- `eval-harness` + `verification-loop` — 验证循环
- `git-workflow` — git 工作流
- `architecture-decision-records` — ADR
- `codebase-onboarding` + `code-tour` + `repo-scan` — 代码库导览
- `documentation-lookup` — 文档查阅
- `autonomous-loops` — 自主循环模式
- `dmux-workflows` — 多 agent 编排
- `agent-introspection-debugging` + `agent-harness-construction` + `agent-eval` — agent 工程

#### 2.3 语言专属
- `python-patterns` ⭐ — Python 模式（数据策划）
- `python-testing` ⭐ — pytest
- `csharp-testing` ⭐ — C# 测试
- `dotnet-patterns` — .NET 模式（部分对 Unity C# 适用）

#### 2.4 实用模式
- `content-hash-cache-pattern` ⭐ — SHA-256 缓存（资源管线必备）
- `regex-vs-llm-structured-text` — 文本解析决策
- `hexagonal-architecture` — 六边形架构（游戏架构可借鉴）
- `mcp-server-patterns` — 自建 MCP 时
- `gateguard` — 安全护栏
- `plankton-code-quality` — 实时代码质量管控
- `configure-ecc` — 安装向导（参考用）

### ⚠️ 无法决定

#### 2.5 视频 / 媒体（看是否做 trailer/devlog）
- `manim-video` — 数学/演示动画
- `remotion-video-creation` — React 程序化视频
- `video-editing` — 视频处理
- `videodb` — 音视频采集/检索/编辑
- `fal-ai-media` — AI 媒体生成（**美术资源生成可能有用，值得探索**）

#### 2.6 移动 / 跨平台（看是否做端口）
- `swift-actor-persistence` / `swift-protocol-di-testing` / `swift-concurrency-6-2` / `swiftui-patterns` — iOS 端口
- `kotlin-patterns` / `kotlin-coroutines-flows` / `kotlin-testing` / `kotlin-ktor-patterns` / `kotlin-exposed-patterns` — Android
- `compose-multiplatform-patterns` — KMP UI
- `android-clean-architecture` — Android
- `liquid-glass-design` — iOS 26 UI
- `foundation-models-on-device` — Apple 端侧 LLM
- `dart-flutter-patterns` / `flutter-dart-code-review` — Flutter 编辑器/伴侣

#### 2.7 native / Rust
- `cpp-coding-standards` / `cpp-testing` — Unity native 时
- `rust-patterns` / `rust-testing` — Bevy 或工具

#### 2.8 AI 相关
- `pytorch-patterns` — 游戏内 ML
- `cost-aware-llm-pipeline` — 游戏内 LLM
- `gan-style-harness` — GAN 美术
- `nanoclaw-repl` / `openclaw-persona-forge` / `claude-devfleet` — agent 编排实验

#### 2.9 通用但用途不明
- `accessibility` — 无障碍（游戏 UX 适用）
- `design-system` — UI 设计系统
- `deep-research` — 通用研究
- `exa-search` — 第三方搜索 MCP
- `team-builder` — 多人协作
- `prp-*` 系列对应 skill — PRD 流程值得借鉴
- `data-scraper-agent` — 资料抓取
- `dashboard-builder` — 自建编辑器工具时
- `market-research` — 游戏市场研究

### ❌ 不需要的

#### 2.10 Web 后端框架
`backend-patterns` · `frontend-patterns` · `frontend-slides` · `django-patterns` · `django-security` · `django-tdd` · `django-verification` · `laravel-patterns` · `laravel-security` · `laravel-tdd` · `laravel-verification` · `laravel-plugin-discovery` · `nestjs-patterns` · `nextjs-turbopack` · `nuxt4-patterns` · `springboot-patterns` · `springboot-security` · `springboot-tdd` · `springboot-verification` · `golang-patterns` · `golang-testing` · `java-coding-standards` · `jpa-patterns` · `postgres-patterns` · `database-migrations` · `api-design` · `api-connector-builder` · `e2e-testing` · `mcp-server-patterns`（已 needed） · `bun-runtime` · `hermes-imports`

#### 2.11 业务 / 运营 / 销售
`brand-voice` · `content-engine` · `crosspost` · `social-graph-ranker` · `customer-billing-ops` · `finance-billing-ops` · `customs-trade-compliance` · `inventory-demand-planning` · `logistics-exception-management` · `returns-reverse-logistics` · `production-scheduling` · `quality-nonconformance` · `email-ops` · `messages-ops` · `unified-notifications-ops` · `google-workspace-ops` · `automation-audit-ops` · `enterprise-agent-ops` · `energy-procurement` · `carrier-relationship-management` · `lead-intelligence` · `knowledge-ops` · `project-flow-ops` · `research-ops` · `investor-materials` · `investor-outreach` · `jira-integration` · `github-ops` · `seo` · `x-api` · `product-capability` · `product-lens` · `connections-optimizer` · `council`

#### 2.12 医疗 / 合规
`healthcare-cdss-patterns` · `healthcare-emr-patterns` · `healthcare-eval-harness` · `healthcare-phi-compliance` · `hipaa-compliance` · `visa-doc-translate`

#### 2.13 区块链 / 安全审计
`agent-payment-x402` · `defi-amm-security` · `evm-token-decimals` · `nodejs-keccak256` · `llm-trading-agent-security` · `security-bounty-hunter` · `security-review` · `security-scan` · `safety-guard`

#### 2.14 其他无关
`clickhouse-io` · `ck` · `perl-patterns` · `perl-security` · `perl-testing` · `nutrient-document-processing` · `deployment-patterns` · `docker-patterns` · `terminal-ops` · `browser-qa` · `click-path-audit` · `canary-watch` · `agent-sort` · `benchmark` · `blueprint` · `santa-method` · `ralphinho-rfc-pipeline` · `repo-scan`（已 needed） · `ai-first-engineering` · `ai-regression-testing` · `ui-demo` · `workspace-surface-audit` · `opensource-pipeline` · `gan-style-harness`

---

## 3. Commands（60+ 个）

### ✅ 需要的

**核心流程**：`plan` · `code-review` · `quality-gate` · `refactor-clean` · `feature-dev` · `checkpoint` · `aside`

**学习与记忆**：`learn` · `learn-eval` · `instinct-status` · `instinct-import` · `instinct-export` · `evolve` · `prune` · `promote` · `projects`

**Skill 工程**：`skill-create` ⭐ · `skill-health` · `harness-audit` · `hookify` · `hookify-list` · `hookify-help` · `hookify-configure`

**会话管理**：`sessions` · `save-session` · `resume-session` · `setup-pm`

**Python（数据策划）**：`python-review`

**文档**：`update-docs` · `update-codemaps` ⭐

**通用**：`auto-update` · `model-route`

**PRP 流程**（值得借鉴）：`prp-prd` · `prp-plan` · `prp-implement` · `prp-pr` · `prp-commit`

**测试**：`test-coverage`

**自主循环**（按需）：`loop-start` · `loop-status`

**多 agent**（需 ccg-workflow runtime）：`multi-plan` · `multi-execute` · `multi-workflow`

**C# 相关命令缺失** — ECC 没有 `csharp-review` / `csharp-build` / `csharp-test`，需要我们自己写。

### ⚠️ 无法决定

`cpp-build` / `cpp-review` / `cpp-test`（Unity native） · `rust-build` / `rust-review` / `rust-test`（Bevy） · `gan-build` / `gan-design`（GAN 美术）· `multi-backend` / `multi-frontend`（不是栈，但模式可借鉴）· `santa-loop`（用途不明）· `review-pr`

### ❌ 不需要的

`go-build` / `go-review` / `go-test` · `flutter-build` / `flutter-review` / `flutter-test` · `kotlin-build` / `kotlin-review` / `kotlin-test` · `gradle-build` · `pm2`（后端进程管理） · `jira`

---

## 4. Rules（16 个语言目录）

### ✅ 需要的

| Rules | 用途 |
|---|---|
| `common/` ⭐ | 全部 10 个文件直接抄：`agents.md` `code-review.md` `coding-style.md` `development-workflow.md` `git-workflow.md` `hooks.md` `patterns.md` `performance.md` `security.md` `testing.md` |
| `csharp/` ⭐ | Unity 主语言（**注意：是 .NET / Web 偏向，需为 Unity 改写**） |
| `python/` ⭐ | 数据策划脚本 |
| `zh/` | 如果含中文规范习惯，值得参考（中文项目） |

### ⚠️ 无法决定

`cpp/`（Unity native） · `rust/`（Bevy/工具） · `swift/`、`kotlin/`、`dart/`（移动端口）

### ❌ 不需要

`golang/` · `java/` · `typescript/` · `php/` · `perl/` · `web/`（其中部分通用项可考察后并入 common）

---

## 5. Hooks（关键基础设施）⭐

### ✅ 全部需要

ECC 的 hook 系统是其**最有价值的基础设施之一**：
- `memory-persistence/` — session-start / session-end / pre-compact 自动存取上下文
- `strategic-compact/` — 上下文压缩建议
- `evaluate-session.js` — 从会话提取模式（与 continuous-learning 联动）
- `suggest-compact.js` — 何时该 `/compact` 的智能提示

**直接抄 `hooks/hooks.json` 整个文件 + `scripts/hooks/*.js` 实现**，作为通用层基础。

注意：Claude Code v2.1+ 通过插件分发 hooks 时**不要**在 `plugin.json` 里再声明，会重复注册。

---

## 6. Contexts ⭐

`contexts/dev.md` · `contexts/review.md` · `contexts/research.md`

**全部需要**。这套"按模式动态注入系统提示"的机制可以直接套用：
- `dev.md` → 编码模式
- `review.md` → 评审模式
- `research.md` → 调研模式

我们可以再加：`gamedev.md` `art.md` `audio.md` `unity.md`。

---

## 7. Examples（CLAUDE.md 模板）

### ✅ 需要的
- `CLAUDE.md` — 项目级模板
- `user-CLAUDE.md` — 用户级模板
- `statusline.json` — 状态栏配置

### ❌ 不需要
- `saas-nextjs-CLAUDE.md` · `go-microservice-CLAUDE.md` · `django-api-CLAUDE.md` · `laravel-api-CLAUDE.md` · `rust-api-CLAUDE.md` · `gan-harness/`

**结论**：我们要**自建** `unity-CLAUDE.md` · `art-CLAUDE.md` · `audio-CLAUDE.md` · `data-design-CLAUDE.md`（数据策划）。

---

## 8. 生态工具 / 周边

### ✅ 需要的
- **`/skill-create` 本地版** — 从 git 历史生成 skill，强力工具
- **持续学习 v2 系统**（`continuous-learning-v2/` + 直觉文件） — 长期最有价值
- **ecc2/** Rust 控制层（`dashboard` `start` `sessions` `status` 等命令）— 值得评估，但不是必需

### ❌ 不需要
- **AgentShield** — 安全审计 SaaS/agent 配置漏洞，离线游戏不需要
- **ECC Tools 成本控制 / 计费门户** — SaaS 用
- **GitHub App for skill-creator** — 私仓不需要

---

## 9. 架构理念（最值得吸收的部分）⭐⭐

这部分**不直接复制代码**，而是吸收设计原则。来源：`the-shortform-guide.md` `the-longform-guide.md` `the-security-guide.md` + `EVALUATION.md` + `WORKING-CONTEXT.md` + `SOUL.md`。

| 原则 | 来源 | 我们如何套用 |
|---|---|---|
| **三层 rules：common + 语言** | `rules/` 结构 | **直接对应我们的"通用 → 游戏综合 → Unity/美术/音乐"层级**。把"语言"换成"主题"即可 |
| **Memory persistence**（session-start/end hook 自动存取 context） | `hooks/memory-persistence/` | 跨会话保持游戏设计上下文，不丢线索 |
| **Continuous learning instinct system** | `skills/continuous-learning-v2/` | 自动累积"这个项目的我习惯"，是 CLAUDE.md 的可学习版本 |
| **Token 优化**（模型选择、prompt 精简、后台进程） | longform-guide | 大量批处理用 Haiku，主线用 Opus；后台跑 build/test |
| **验证循环**（checkpoint vs continuous evaluation, pass@k） | `EVALUATION.md` | 游戏数值/平衡测试可用 pass@k |
| **并行 worktrees + cascade 方法** | longform-guide | 与我们之前讨论一致，已纳入通用规则 |
| **Subagent 编排上下文问题** | `iterative-retrieval` skill | 子 agent 不要喂全部上下文，按需迭代检索 |
| **MCP 上限：20–30 总数 / <10 项目级 / <80 工具** | README 警告 | **写进通用规则**，避免上下文窗口被 MCP 工具描述吃光 |
| **PRP 流程：PRD → Plan → Implement → PR → Commit** | `prp-*` 命令 | 大功能开发流程模板 |
| **三 contexts 模式注入** | `contexts/` | 扩展为 dev/review/research/gamedev/art/audio |

---

## 10. 给我们配置方案的具体建议

> **注**：本节是 02 写作时（2026-05-01）的**原计划**。实际落地时部分项有调整（如 `setup-engine` skill 经 06 self-review 修正后从 L3 unity 上移到 L2，`code-review` 命名冲突按 03 §2.4 解决）。**实际落地以各 `cc/<layer>/MANIFEST.md` 为准**；本节保留作设计判断的历史追溯。

按照之前讨论的**层级方案 A + B（位置 × 主题）**，ECC 资源映射到各层：

### 层 1 · 用户级 `~/.claude/`
- ECC `rules/common/` → `~/.claude/rules/common/`（10 个文件全抄）
- ECC `hooks/` 全套 → `~/.claude/hooks/`（memory-persistence + strategic-compact）
- ECC `contexts/{dev,review,research}.md` → `~/.claude/contexts/`
- ECC `examples/user-CLAUDE.md` → 改写为 `~/.claude/CLAUDE.md`
- 通用 agents：`planner` `architect` `code-reviewer` `code-explorer` `code-simplifier` `refactor-cleaner` `doc-updater` `docs-lookup` `harness-optimizer` `tdd-guide` `silent-failure-hunter` `comment-analyzer` `type-design-analyzer` `performance-optimizer` `pr-test-analyzer` `loop-operator` `conversation-analyzer`
- 通用 skills：`agentic-engineering` `coding-standards` `continuous-learning(-v2)` `iterative-retrieval` `strategic-compact` `context-budget` `token-budget-advisor` `search-first` `skill-stocktake` `skill-comply` `rules-distill` `hookify-rules` `prompt-optimizer` `tdd-workflow` `eval-harness` `verification-loop` `git-workflow` `architecture-decision-records` `codebase-onboarding` `code-tour` `repo-scan` `documentation-lookup` `autonomous-loops` `dmux-workflows` `agent-introspection-debugging` `agent-harness-construction` `agent-eval` `content-hash-cache-pattern` `regex-vs-llm-structured-text` `hexagonal-architecture` `gateguard` `plankton-code-quality` `configure-ecc`
- 通用 commands：`plan` `code-review` `quality-gate` `refactor-clean` `feature-dev` `checkpoint` `aside` `learn(-eval)` `instinct-*` `evolve` `prune` `promote` `projects` `skill-create` `skill-health` `harness-audit` `hookify*` `sessions` `save/resume-session` `setup-pm` `update-docs` `update-codemaps` `auto-update` `model-route` `prp-*` `test-coverage` `loop-start/status`

### 层 2 · 项目根 `<game-project>/`
- ECC `examples/CLAUDE.md` → 起草项目 `CLAUDE.md`
- 自建：游戏开发综合规则（参考 Donchitos/Game-Studios，**ECC 没这部分**）
- ECC `python-reviewer` agent + `rules/python/` + `python-patterns` skill + `python-testing` skill + `python-review` command → 数据策划工作流

### 层 3 · 子目录 `Assets/Scripts/CLAUDE.md`（Unity 子层）
- ECC `csharp-reviewer` agent + `rules/csharp/` + `csharp-testing` skill + `dotnet-patterns` skill
- **必须自写**：Unity 版本/管线/Input System/DI 框架/资源命名（ECC 完全没有 Unity 特化）
- **必须自写**：`csharp-review` / `csharp-build` / `csharp-test` 命令（ECC 缺）

### 层 3 · 子目录 `Assets/Art/CLAUDE.md`（美术子层）
- **ECC 无任何贡献**。走我们之前的方案：pixel-plugin、blender-mcp、Unity Shaders skill、game-art-skill shaders.md

### 层 3 · 子目录 `Assets/Audio/CLAUDE.md`（音频子层）
- **ECC 无任何贡献**。基本要全部自建。

---

## 11. 速览三桶（决策摘要）

```
✅ 需要 (~25% 的 ECC 量)
├── 全部 hooks + contexts + common rules
├── ~21/48 agents（通用 + C#/Python）
├── ~35/182 skills（元工程 + 工作流核心 + Python/C#）
├── ~30/60 commands（核心流程 + 学习记忆 + skill 工程）
└── 全套架构理念（memory persistence、continuous learning、三层 rules、token 优化）

⚠️ 待定 (~20% 的 ECC 量)
├── native/Rust/移动端 agents 与 rules（取决于技术选型）
├── 视频/媒体 skills（trailer/devlog 看是否做）
├── AI 相关 skills（游戏内 LLM/ML 看是否集成）
├── PRP 流程命令（值得借鉴但要适配）
└── ecc2/ Rust 控制层（评估后再定）

❌ 不需要 (~55% 的 ECC 量)
├── 全部 Web 后端框架（Django/Laravel/Spring/Next/Nuxt/Nest）
├── 全部业务运营 skills（投融资/客服/账单/物流/销售/社媒）
├── 全部医疗合规
├── 全部区块链相关
├── Go/Java/PHP/Perl 全栈
├── AgentShield（offline 游戏不需要）
└── 大部分 SaaS 部署/数据库迁移工具
```

---

## 12. 下一步

1. ✅ 这份文档定型 → 之后写 `02-hierarchy-design.md` 时直接拿"需要的"清单作为通用层资源
2. 写 `02-hierarchy-design.md` 锁定层级 + 命名空间约定
3. 通用层（层 1）实施时，**直接 `cp -r` ECC 对应目录** + 删冗余项
4. 游戏综合层（层 2）实施时，**自写为主**（参考 Donchitos/Game-Studios 骨架，ECC 此处贡献低）
5. Unity / 美术 / 音乐子层（层 3）实施时，**完全自写**（ECC 完全缺失）

---

## 附录：ECC 核心文档清单（值得读完）

阅读顺序建议：
1. `the-shortform-guide.md`（精简指南，先读）
2. `the-longform-guide.md`（详细指南，token 优化 / memory / parallelization）
3. `the-security-guide.md`（安全 — 选读）
4. `WORKING-CONTEXT.md`（工作上下文设计）
5. `EVALUATION.md`（验证循环 / pass@k 详解）
6. `SOUL.md`（项目理念）
7. `RULES.md`（规则系统设计）
8. `AGENTS.md`（agent 协议）
9. `COMMANDS-QUICK-REF.md`（命令速查）
10. `examples/CLAUDE.md` + `examples/user-CLAUDE.md`（CLAUDE.md 写法范例）
