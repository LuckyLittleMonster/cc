# CLAUDE.md · 用户级（L1）

> 跨项目工程基线。任何 Claude Code 会话启动时自动叠加。
> 修订路径：改 `cc/user/CLAUDE.md` → `install.{sh,ps1}` 同步到 `~/.claude/CLAUDE.md`。**不要**直接改部署后的副本，下次 install 会被覆盖。
> 上游层级合约：`cc/docs/03-hierarchy-design.md`。

---

## 1. 工程姿态

- **Plan first** — 复杂任务先用 Plan Mode（Shift+Tab）列计划，用户确认后再执行
- **Evidence-based** — 主张要带证据：文件路径 `path:line`、grep 结果、官方文档引用；不靠"我记得"
- **Parsimonious** — 不发明需求；不为假想未来抽象；三行重复优于早抽象；只解决当前问题
- **Verify, don't trust memory** — recall 出来的 memory 必须重新验证当前状态再用
- **Test before implementation** — TDD 是默认；先写失败测试，再实现到通过
- **Boundary-only validation** — 只在系统边界（用户输入、外部 API）做参数校验；内部代码信任契约
- **No backwards-compat shims** — 没人调用就直接删；不留 `// removed` 注释、不重命名 `_var`

---

## 2. 自动加载的 rules

`~/.claude/rules/common/` 每次会话叠加进系统提示，不需要手动引用：

`agents.md` · `code-review.md` · `coding-style.md` · `development-workflow.md` · `git-workflow.md` · `hooks.md` · `patterns.md` · `performance.md` · `security.md` · `testing.md`

跨语言 / 跨平台规则一律放这里。语言或领域特化的 rules 由消费方按需在下层补充，不在本层。

---

## 3. Agents（20 个，`~/.claude/agents/`）

按"何时使用"分组。Claude 会按 description 自动选择，也可显式调用：

| 场景 | Agent |
|---|---|
| 规划 / 架构 | `planner` `architect` `code-architect` `a11y-architect` |
| 代码理解 | `code-explorer` `comment-analyzer` `type-design-analyzer` |
| 代码改写 | `code-simplifier` `refactor-cleaner` |
| 审查 | `code-reviewer` `pr-test-analyzer` |
| 测试 | `tdd-guide` |
| 文档 | `doc-updater` `docs-lookup` |
| 调试 | `silent-failure-hunter` `build-error-resolver` |
| 性能 | `performance-optimizer` |
| 元工具 | `harness-optimizer` `loop-operator` `conversation-analyzer` |

**默认行为**：复杂任务（>3 个相关步骤、跨多文件、需要并行调研）优先委托 agent；简单单步直接干。

---

## 4. Skills（35 个，`~/.claude/skills/`）

按 description 自动触发。按主题速查：

| 主题 | 关键 skills |
|---|---|
| 元工程 | `agentic-engineering` `agent-introspection-debugging` `prompt-optimizer` |
| 学习与记忆 | `continuous-learning` `continuous-learning-v2` `iterative-retrieval` `strategic-compact` `context-budget` `token-budget-advisor` |
| 工作流 | **`search-first`**（写代码前调研） `tdd-workflow` `eval-harness` `verification-loop` `autonomous-loops` `dmux-workflows` |
| Skill 维护 | `skill-stocktake` `skill-comply` `rules-distill` `hookify-rules` |
| 代码库导览 | `codebase-onboarding` `code-tour` `repo-scan` `documentation-lookup` `architecture-decision-records` |
| 编码模式 | `coding-standards` `content-hash-cache-pattern` `regex-vs-llm-structured-text` `hexagonal-architecture` `gateguard` |
| Git | `git-workflow` |
| 多机协作 | `agentbus`（局域网 agent 消息总线，用法见 `~/.claude/scripts/agentbus/README.md`） |

**默认触发**：编辑文件前若任务模糊 → `search-first`；会话长 → `strategic-compact`；调研型任务 → `iterative-retrieval`。

---

## 5. Slash Commands（39 个，`~/.claude/commands/`）

| 工作流 | 命令 |
|---|---|
| 规划 / 实现 | `/plan` `/feature-dev` `/aside` |
| 审查 | `/code-review` `/quality-gate` `/refactor-clean` |
| 测试 | `/test-coverage` |
| 文档 | `/update-docs` `/update-codemaps` |
| 学习与直觉 | `/learn` `/learn-eval` `/instinct-status` `/instinct-import` `/instinct-export` `/evolve` `/prune` `/promote` `/projects` |
| Skill 工程 | `/skill-create` `/skill-health` `/harness-audit` `/hookify` `/hookify-list` `/hookify-help` `/hookify-configure` |
| 会话 | `/sessions` `/save-session` `/resume-session` `/checkpoint` |
| PRP 流程 | `/prp-prd` `/prp-plan` `/prp-implement` `/prp-pr` `/prp-commit` |
| 自主循环 | `/loop-start` `/loop-status` |
| 通用 | `/auto-update` `/model-route` `/setup-pm` |

---

## 6. Contexts（动态注入模式）

`~/.claude/contexts/` 三档：`dev.md` 编码 · `review.md` 评审 · `research.md` 调研。

下层（L2 / L3）按消费方需要扩展更多模式；本层只放跨领域通用模式。

---

## 7. 个人偏好

### 编码
- **不写 emoji** 到代码 / 注释 / 文档（除非用户明确要求）
- **默认不写注释**；写注释要解释 *why*（约束、不变式、bug 注脚），不解释 *what*
- **不写多段 docstring**；一行注释通常够
- 优先小文件多个；典型 200–400 行，800 行封顶
- 偏不可变；尽量不 mutate 对象与数组

### 通信
- 用**中文响应**（除非内容是代码、命令、错误信息、专有名词）
- 简短，一句话能说完不写两句
- 引用代码用 `path:line` 格式
- 不在每个回复结尾总结刚做了什么——用户能看 diff
- 工具调用前一句说做什么；调用后只在有结果或方向变化时再说

### Git
- Conventional Commits：`feat:` `fix:` `refactor:` `docs:` `test:` `chore:`
- 提交前本地测试通过
- 一个提交干一件事；不混 refactor + feat
- 不 `--no-verify` 跳钩子；不 `--amend` 已推送的提交

### 测试
- TDD 默认：测试先于实现
- 单元 + 集成 + 关键流程 E2E
- 集成测试**不要 mock 数据库**
- 80% 覆盖率为下限，不是目标

### 知识沉淀
- 个人偏好 / debug 笔记 / 临时上下文 → auto memory（`memory/` 目录）
- 项目级知识（架构决策、API 变更、操作手册）→ 项目内文档
- 已存在文档位置时不另起；没有时先问再建
- 跨会话状态有两套互补系统：
  - **`continuous-learning-v2` 直觉**（session 级）—— ECC 风格，session-end hook 自动提取模式
  - **`agent-memory/`**（agent 级，consumer 项目里 `<project>/.claude/agent-memory/<agent>/`）—— 单 agent 跨 session 持久化决策与约定（按 09 §7 设计；agent 自决何时写）

### 工具偏好
- 复杂任务：Plan Mode（Shift+Tab）
- 多任务并行：`claude --worktree`，3–5 个 worktree 同时跑
- 大功能前 `/compact` 释放上下文
- `Ctrl+S` 暂存草稿 prompt

---

## 8. Hooks 自动行为

`~/.claude/hooks/hooks.json` 已注册以下自动行为（不要手动改部署后的 settings.json，改 `cc/user/hooks/hooks.json`）：

- **session-start** — 加载持久化上下文与直觉
- **session-end** / **pre-compact** — 持久化关键状态，防止跨会话丢线索
- **pre-bash** — commit 质量检查、tmux 提醒、危险 push 拦截、GateGuard
- **post-edit** — 自动格式化 + 类型检查
- **evaluate-session** — 提取本次会话模式存为直觉

钩子运行时控制（环境变量）：
- `ECC_HOOK_PROFILE=standard|strict|lenient` — 严格度
- `ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"` — 临时禁用

---

## 9. MCP 硬约束

- 总数 ≤ **30**
- 每个项目活跃 ≤ **10**
- 活动工具 ≤ **80**

超过会让 200K 上下文窗口被工具描述压到 70K。在项目级 settings 用 `disabledMcpServers` 关掉不用的。

---

## 10. 工作环境

- **平台**：Windows 11
- **Shell**：PowerShell 7+ 默认；Bash 用于 POSIX 脚本
- **编辑器**：VS Code 主用
- **Git**：本地 + GitHub
- **行结尾**：项目内 `.gitattributes` 控制；不强制 LF/CRLF

PowerShell 与 Bash 的路径处理差异：
- 路径分隔用 `/` 通用安全（PowerShell 与 Bash 都接受）
- 环境变量：PS 用 `$env:VAR`，Bash 用 `$VAR`
- null：PS 用 `$null`，Bash 用 `/dev/null`

---

## 11. 成功标准

任务完成的判据（按优先级）：
1. 用户需求满足
2. 测试通过且覆盖率达标
3. 代码可读、可维护、最小化复杂度
4. 没有引入安全漏洞或性能回归
5. 文档与代码同步
