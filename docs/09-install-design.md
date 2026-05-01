# 09 · 部署器设计（install.{sh,ps1}）

> 角色：cc/ → 真实文件系统的部署器**设计文档**（不是 install 实现本身）。
> 绑定：03 §1 部署目标 · §3 install.{sh,ps1} 占位 · §7 升级流程；累积自 05 §9.1 / 06 §9.1 / 07 §10.1 / 08 §10.3。
> 范围：CLI 接口规格、部署矩阵、scaffolding、自动触发 hook 设计、agent-memory 系统、跨平台。**实现 split** 为后续工作。

---

## 1. 目的

09 是**规则层的收尾**：把 04–08 各层产生的部署需求整合成一份**安装器规格**。安装器读 cc/ 仓库 → 写入消费方的 `~/.claude/` 与 `<project>/.claude/`。

**在 09**：
- CLI 接口（`install.sh` / `install.ps1`）
- 部署目标矩阵
- 多子项目支持
- Donchitos 目录 scaffolding
- Path-scoped rules 自动触发的 hook 设计
- agent-memory/ 系统启用
- Donchitos `.sh` hooks 的 Node.js 重写规格
- MANIFEST 与 pre-adapt snapshot

**不在 09**：
- 实际 `install.sh` / `install.ps1` 代码（实现属另起任务）
- Plugin marketplace 分发（v2+ 议题）
- 自动 release / versioning

---

## 2. 完整部署矩阵

整合 03 §1 与 04–08 各层 MANIFEST：

| cc/ 来源 | → 目标 | 触发条件 |
|---|---|---|
| `cc/user/CLAUDE.md` | `~/.claude/CLAUDE.md` | `install --layer user` |
| `cc/user/{rules,contexts,agents,skills,commands,scripts}/` | `~/.claude/<同名>/` | 同上 |
| `cc/user/hooks/hooks.json` | `~/.claude/hooks/hooks.json`（v2.1+ 自动加载） | 同上 |
| `cc/user/statusline.json` | `~/.claude/statusline.json` | 同上 |
| `cc/project/CLAUDE.md.template` | `<consumer>/CLAUDE.md`（按模板填占位符） | `install --layer project --target <path>` |
| `cc/project/{agents,skills,commands,rules,docs}/` | `<consumer>/.claude/<同名>/` | 同上 |
| `cc/unity/CLAUDE.md.template` | `<consumer>/<engine-subdir>/CLAUDE.md` | `install --layer unity --target <unity-dir>` |
| `cc/unity/{agents,skills,rules,docs}/` | `<consumer>/<engine-subdir>/.claude/<同名>/` | 同上 |
| `cc/art/CLAUDE.md.template` | `<consumer>/<art-subdir>/CLAUDE.md` | `install --layer art --target <art-dir>` |
| `cc/art/{agents,skills}/` | `<consumer>/<art-subdir>/.claude/<同名>/` | 同上 |
| `cc/audio/CLAUDE.md.template` | `<consumer>/<audio-subdir>/CLAUDE.md` | `install --layer audio --target <audio-dir>` |
| `cc/audio/agents/` | `<consumer>/<audio-subdir>/.claude/agents/` | 同上 |

**消费方自维护（不由 install 写入）**：
- `~/.claude/settings.json`
- `<consumer>/.claude/settings.local.json`
- `<consumer>/.mcp.json`

---

## 3. CLI 接口设计

### 3.1 命令语法

```bash
# 安装单层
install --layer <user|project|unity|art|audio> --target <path>

# 完整 game-Unity 项目（一次装齐 L1+L2+L3 unity+art+audio）
install --preset game-unity --workspace <root> --unity <unity-subdir>

# 升级（不破坏 adapted: yes 的文件）
install --upgrade [--layer <layer>]

# 卸载（删除已部署文件，保留 settings.json 等消费方文件）
install --uninstall --layer <layer>

# 演练
install --dry-run [...]

# 详细输出
install --verbose [...]
```

### 3.2 Flag 语义

| Flag | 必需 | 默认 | 含义 |
|---|---|---|---|
| `--layer` | preset 模式时不需 | — | 指定单层部署 |
| `--target` | layer 不是 user 时必需 | — | 部署到哪个目录 |
| `--preset` | 单 layer 模式不需 | — | 预设组合（`game-unity` / `game-godot` / 等） |
| `--workspace` | preset 时必需 | — | 项目根（多子项目时） |
| `--engine-subdir` | preset 时可选 | `Assets/Scripts` | 引擎子目录（Unity 默认） |
| `--art-subdir` | preset 时可选 | `Assets/Art` | 美术子目录 |
| `--audio-subdir` | preset 时可选 | `Assets/Audio` | 音频子目录 |
| `--upgrade` | — | false | 升级模式（保留 adapted 文件） |
| `--uninstall` | — | false | 卸载模式 |
| `--dry-run` | — | false | 只打印将做的操作，不写文件 |
| `--verbose` / `-v` | — | false | 详细日志 |
| `--force` | — | false | 跳过 adapted 文件保护（危险） |

### 3.3 幂等性

- 同 sha 重复 install：no-op
- 升级 install：按 03 §7 逐文件 diff，跳过 adapted 不变文件
- 删除后重新 install：完整重建

### 3.4 占位符填充

`CLAUDE.md.template` 含 `[占位符]`。install 时：

- **交互模式**（默认）：逐项询问，写入 `<consumer>/CLAUDE.md`
- **配置文件模式**：消费方提供 `cc-install.yaml` 含所有占位符的值
- **跳过模式**（`--no-fill`）：直接 cp template 不替换；消费方手动填

---

## 4. 多子项目工作区支持

参 05 §7：**B（per-subproject L2）**为推荐，**C（hybrid）**作为变体。

### 4.1 单游戏项目

```bash
install --preset game-unity --workspace <project>
# 部署：
#   ~/.claude/                    L1
#   <project>/CLAUDE.md           L2
#   <project>/.claude/            L2
#   <project>/Assets/Scripts/.claude/   L3 unity
#   <project>/Assets/Art/.claude/       L3 art
#   <project>/Assets/Audio/.claude/     L3 audio
```

### 4.2 多子项目工作区（如 `修行计划/`）

```bash
# 仅安装 L1
install --layer user

# 单独装某游戏子项目
install --preset game-unity --workspace 修行计划/中国象棋
install --preset game-unity --workspace 修行计划/卡牌游戏

# 工作区根可选不部署 L2，或部署"导航 L2"
install --layer project --target 修行计划 --navigation-only
```

`--navigation-only` flag 让 L2 模板只生成"导航 CLAUDE.md"骨架，不引入完整 game-dev 内容。

### 4.3 非游戏子项目（如 `novel-helper/`）

不部署任何 L2 / L3，只继承 L1。**install 不主动跑入这种子目录**。

---

## 5. Donchitos 目录约定 scaffolding

来自 07 §10.1：Donchitos `/art-bible` `/asset-spec` 等假设 `production/` `design/art/` 目录存在。`/start` skill 会建出来，但若消费方先调 `/art-bible` 会失败。

### 5.1 install 时建出基本骨架

L2 / L3 部署时，install 创建：

```
<consumer>/                 # L2 部署根
├── design/                 # 设计文档
│   ├── gdd/
│   ├── art/                # /art-bible 输出位置
│   └── narrative/
├── production/             # sprint / playtest / release
│   ├── sprints/
│   ├── milestones/
│   ├── playtest-reports/
│   └── review-mode.txt     # 默认值: lean (Donchitos 协议)
├── prototypes/             # /prototype skill 输出
└── tests/                  # 已通用规则有
```

每个目录放 `.gitkeep` 和 README.md（说明这是哪个 skill 的输出位置）。

### 5.2 review-mode.txt 默认值

Donchitos `/art-bible` 等 skill 用此控制审议深度：
- `lean`（默认）— 单人 / 小团队
- `full`（默认 fall-back）— 完整团队
- `solo`— 完全单人

install 写入 `lean` 作为默认值；消费方按需改。

---

## 6. Path-scoped rules 自动触发（hook）

来自 05 §9.1：Donchitos path-scoped rules 当前是约定式（agents 主动引用）。要做到自动触发，需 hook 介入。

### 6.1 触发机制

PostToolUse hook on `Edit | Write`：
1. 读 tool_input 的 `file_path`
2. 与配置中的 path patterns 比对
3. 若命中，输出到 stderr：`[Path-scoped] Editing X — see rules/path-scoped/<rule>.md`
4. Claude 读 stderr 后会自然引用对应 rule

### 6.2 配置文件

每层 `rules/path-scoped/_paths.yaml`（自写，不是 cherry-pick）：

```yaml
# cc/project/rules/path-scoped/_paths.yaml 例
- rule: gameplay-code.md
  paths:
    - "src/gameplay/**"
    - "**/Gameplay/**"
- rule: data-files.md
  paths:
    - "data/**"
    - "**/*.csv"
    - "**/*.yaml"
- rule: design-docs.md
  paths:
    - "design/**"
- rule: test-standards.md
  paths:
    - "tests/**"
    - "**/*_test.py"
    - "**/*.test.cs"
- rule: prototype-code.md
  paths: ["prototypes/**"]
- rule: ai-code.md
  paths: ["**/AI/**", "**/Behavior/**"]
- rule: narrative.md
  paths: ["narrative/**", "dialogue/**"]
```

### 6.3 Hook 实现位置

- 全局触发器：`cc/user/scripts/hooks/post-edit-pathscoped-rule-hint.js`
- 注册到 `cc/user/hooks/hooks.json`
- 读所有 `.claude/**/rules/path-scoped/_paths.yaml`（用户级 + 项目级）
- 与现有 ECC `post-edit-*` hooks 同 stage 运行

### 6.4 与 cherry-pick 文件的关系

cherry-pick 来的 Donchitos rules 不动（保 frontmatter 原貌）。`_paths.yaml` 是**外部映射**，记我们认为的路径模式。

---

## 7. agent-memory/ 系统

Donchitos 有 `.claude/agent-memory/<agent>/` 存每 agent 的持久状态。ECC 有 continuous-learning v2（session 级直觉）。两者**互补**，不替代。

### 7.1 目录布局

```
<consumer>/.claude/
├── agent-memory/
│   ├── lead-programmer/        # Donchitos 兼容
│   │   ├── decisions.md        # 历史决策
│   │   └── conventions.md      # 项目约定记录
│   ├── art-director/
│   ├── unity-specialist/
│   └── ...
└── instincts/                  # ECC continuous-learning v2
    └── ...
```

### 7.2 install 时做什么

- 创建 `.claude/agent-memory/` 父目录（空，自动 .gitkeep）
- **不**预填具体 agent 子目录（lazy 创建——agent 首次写时才建）
- README.md 说明用途

### 7.3 与 continuous-learning v2 的边界

| 系统 | 范围 | 何时写 | 何时读 |
|---|---|---|---|
| `agent-memory/<agent>/` | 单 agent 跨 session | agent 完成大决策时 | agent 启动时（自检） |
| `instincts/` | 整 session 模式 | session-end / pre-compact hook | session-start |

两者文件位置不同，互不冲突。agent 写 agent-memory；continuous-learning 写 instincts。

### 7.4 启用条件

install 默认创建空骨架；agent / continuous-learning 自己决定何时写。消费方可在 settings 里 `disabledFeatures: ["agent-memory"]` 关闭。

---

## 8. Donchitos hooks Node.js 重写

来自 05 §5.4 / §9.1：Donchitos 12 个 `.sh` hook 跨平台不友好。其中 2 个独有 + 高价值，值得重写：

### 8.1 `validate-assets.js`

资源命名 / 格式 / 大小校验。PreToolUse on `Bash` (检测 git add 等) 或 PostEdit。

**功能**：
- 检查 `Assets/Art/**` `Assets/Audio/**` 文件命名（kebab-case / 前缀 / 不含中文空格）
- 检查文件大小（PSD < 100MB / WAV < 50MB 等门槛）
- 与 cc/<layer>/MANIFEST.md 中规格对齐

**实现位置**：`cc/project/scripts/hooks/validate-assets.js`

### 8.2 `validate-skill-change.js`

skill 修改完整性校验。PostEdit on `*.md` 在 `skills/`。

**功能**：
- 检查 SKILL.md frontmatter 完整（name / description）
- 检查 description 长度（不超过 5KB；含触发关键词，03 §2.5）
- 检查 cherry-pick 文件是否被改写（若是，提示更新 MANIFEST adapted 字段）

**实现位置**：`cc/user/scripts/hooks/validate-skill-change.js`

### 8.3 注册

加入 `cc/user/hooks/hooks.json`（项目级 hooks 加 `cc/project/hooks/hooks.json`，自动加载）。

---

## 9. MANIFEST 同步与 pre-adapt snapshot

来自 03 §7："未来改进（暂不强制）"。09 提议正式启用。

### 9.1 现状

每层 MANIFEST.md 表格列：`Target | Source | Type | Files | Adapted`。`Adapted: yes` 时无可追溯的 pre-adapt 上游版本。

### 9.2 提议改进

MANIFEST 表格加列：

```markdown
| Target | Source | Type | Files | Adapted | Pre-adapt SHA |
|---|---|---|---|---|---|
| `agents/csharp-reviewer.md` | `ecc:agents/csharp-reviewer.md` | file | 1 | yes | a3f...8b2 |
```

`Pre-adapt SHA` 是该文件被改写**之前**上游的 file-level SHA（git hash-object）。升级时三方 merge 有据可依。

### 9.3 install 自动维护

`install --upgrade` 检测 `Adapted: yes` 文件时：
1. 读 `Pre-adapt SHA`
2. 与新上游 SHA 比对：若同 → 上游未改我们改的部分，安全跳过
3. 若异 → 三方 merge（需要 git）或人工

### 9.4 当前迁移

现有 MANIFEST 全部 `Adapted: no`（除 `cc/user/CLAUDE.md` 与 `cc/project/CLAUDE.md.template`）。这两个标 `adapted: yes` 的，install v2+ 时回填 pre-adapt SHA：

```bash
# 回填脚本
cd cc/refs/everything-claude-code
git hash-object examples/user-CLAUDE.md  # 拿 SHA → 写入 cc/user/MANIFEST.md
```

---

## 10. 跨平台

### 10.1 三种部署方式

1. **Bash**（macOS / Linux / Windows git-bash）：`install.sh`
2. **PowerShell**（Windows 原生）：`install.ps1`
3. **Node.js**（跨平台）：`npx cc-install` 或 `node install.js`

### 10.2 推荐：Node.js 为主，shell 为壳

ECC 走的就是这条路（hooks 是 Node.js）。原因：
- ECC 已有 `scripts/lib/utils.js` 跨平台工具，复用
- 路径处理（`path.join` vs `\` 与 `/`）Node.js 内置
- Windows + macOS + Linux 单实现

`install.sh` 与 `install.ps1` 成壳子调 Node：

```bash
# install.sh
#!/usr/bin/env bash
exec node "$(dirname "$0")/scripts/install.js" "$@"
```

```powershell
# install.ps1
node "$PSScriptRoot/scripts/install.js" $args
```

### 10.3 Python 不用

避免再加一个运行时依赖。fmod-mcp 用 Python 是消费方需求，cc/ 自身不引入。

---

## 11. 实现优先级

按价值与依赖排：

### v1（最小可用）
- `install --layer user` 与 `install --layer project --target <path>`
- 占位符填充（交互模式）
- `--dry-run`
- 基础幂等（cp 覆盖）
- Donchitos 目录 scaffolding（§5）
- 跨平台壳（§10.2）

### v2（提升）
- `install --preset game-unity` 一键装齐
- L3 unity / art / audio 部署
- `--upgrade` 与基本 MANIFEST 同步
- agent-memory/ 父目录创建（§7）
- `validate-assets.js` 与 `validate-skill-change.js` 重写（§8）

### v3（成熟）
- Path-scoped rules 自动触发 hook（§6）
- `--upgrade` 三方 merge（pre-adapt SHA，§9）
- `--uninstall`
- 配置文件模式（cc-install.yaml）
- `--navigation-only` 多子项目支持

### v4+（远期）
- Plugin marketplace 分发
- `cc-install` 发布到 npm
- 自动 release / versioning

---

## 12. 已知 gap / 后续

### 12.1 待补全
- 实际写 `install.{sh,ps1}` 与 `scripts/install.js`（不在 09 范围）
- 测试矩阵（Windows + macOS + Linux × 各 layer × dry-run / real）
- 错误处理（部分失败回滚？还是部分失败接受？v1 先接受）
- 升级 ECC / Donchitos 时的 MANIFEST 自动更新流程（v3）

### 12.2 待评估
- 是否提供 `install --check` 验证当前状态（已部署的与 cc/ 是否同步）
- Plugin marketplace 路径：cc/ 是否拆成多个独立 plugins（`cc-user-plugin` `cc-gamedev-plugin` `cc-unity-plugin`）便于 Claude Code marketplace 单独装？v4+ 议题
- agent-memory 是否需要专门 hook 把 agent 输出引导到正确目录

### 12.3 Dogfood
- 09 实现完成后，跑 `install --preset game-unity --workspace 修行计划/中国象棋` 验证
- 中国象棋目前是 Python AI（无 unity 子树）；需要先有 Unity demo 才能测 L3 unity 路径

---

## 13. 与上游约定的接口

### 13.1 Claude Code v2.1+ 自动加载约定

- `~/.claude/hooks/hooks.json` 自动加载（无需 settings.json reference）
- `~/.claude/skills/<name>/SKILL.md` 自动发现
- `~/.claude/agents/<name>.md` 自动发现
- `~/.claude/commands/<name>.md` 自动发现

install 把文件放对位置即可被 Claude Code 自动发现。

### 13.2 项目级与用户级的优先关系

03 §1 已定义。install 不需特殊处理——就近优先由 Claude Code 解释。

---

## 14. 状态

- 2026-05-01：本文 v1 设计文档完成，**实现 split** 为后续任务。
- 规则层文档（00–08）已全部 v1.1 就位 + 09 v1 完成 → docs/ 阶段收尾。
- 下一步：(a) 实际实现 install v1；(b) dogfood `修行计划/中国象棋/`；(c) 写 README.md（仓库门面）。
