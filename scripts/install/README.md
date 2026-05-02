# cc-install

`cc/` 一键部署器。把 cc/ 各层 cherry-pick 内容部署到 `~/.claude/` 与 `<game-project>/.claude/`。

设计文档：[`docs/09-install-design.md`](../../docs/09-install-design.md)

---

## 入口

| 平台 | 命令 |
|---|---|
| Bash (macOS / Linux / Git-bash) | `./install.sh` |
| PowerShell (Windows 原生) | `.\install.ps1` |
| 直接 Node | `node scripts/install/install.js` |

需要 Node.js ≥ 18（用 `util.parseArgs`）。

---

## 5 个常用场景

### 1. 第一次：装 L1 到 `~/.claude/`

```bash
./install.sh --layers user
```

部署 246 文件到 `~/.claude/`：CLAUDE.md / rules/common / hooks / contexts / agents / skills / commands / scripts。

完成后**重启 Claude Code** 让新 hooks/skills 生效。

### 2. 单一 Unity 游戏：自动检测一键装齐

```bash
./install.sh /path/to/my-unity-game
```

自动检测：
- ~/.claude/ 是否已部署 L1 → 否则先装
- target 目录含 `Assets/` → 装 unity + art + audio 子层
- 否则只装 project 层

会交互式询问 `CLAUDE.md.template` 占位符（`[Unity Version]` `[Render Pipeline]` 等）。

### 3. 多子项目工作区：per-subproject 部署

```bash
./install.sh /workspace/game-A
./install.sh /workspace/game-B
./install.sh /workspace/game-C
```

每个游戏子项目独立部署 L2 + L3。`/workspace/non-game-tool/` 不部署，仅继承 L1。

### 4. 检查状态（不写文件）

```bash
./install.sh --check                     # 仅检查 L1
./install.sh /workspace/game-A --check   # 检查 L1 + 目标项目
```

报告 L1 哪些文件已部署 / 缺失，目标是否 Unity 项目，是否已有 `design/` `production/` 等。

### 5. 演练（看会做什么但不做）

```bash
./install.sh /workspace/game-A --dry-run -v
```

打印每个文件的 `cp` 计划与 `mkdir` 计划，不写任何文件。

---

## 自动检测逻辑

`install.sh <target>` 不带 `--layers` 时：

| L1 状态 | target 状态 | 自动选择层 |
|---|---|---|
| 未部署 | 无 target | `user` |
| 未部署 | 含 Assets/（Unity 项目） | `user + project + unity + art + audio` |
| 未部署 | 普通目录 | `user + project` |
| 已部署 | 含 Assets/ | `project + unity + art + audio` |
| 已部署 | 普通目录 | `project` |
| 已部署 | 无 target | （提示无事可做） |

---

## 部署目标映射

| layer | 源 | 目标 |
|---|---|---|
| `user` | `cc/user/` | `~/.claude/` |
| `project` | `cc/project/` | `<target>/CLAUDE.md` + `<target>/.claude/` |
| `unity` | `cc/unity/` | Unity 项目：`<target>/Assets/Scripts/CLAUDE.md` + `<target>/Assets/Scripts/.claude/`<br>非 Unity：`<target>/.claude-unity/` |
| `art` | `cc/art/` | Unity 项目：`<target>/Assets/Art/...`<br>非 Unity：`<target>/.claude-art/` |
| `audio` | `cc/audio/` | Unity 项目：`<target>/Assets/Audio/...`<br>非 Unity：`<target>/.claude-audio/` |

---

## 选项参考

| 选项 | 含义 |
|---|---|
| `--layers <csv>` | 显式 user,project,unity,art,audio |
| `--check` | 仅检查（不写文件） |
| `--dry-run` | 演练（不写） |
| `--force` | 覆盖已存在文件 |
| `--no-fill` | 跳过占位符交互填充 |
| `--no-scaffold` | 不创建 design/ production/ 等目录 |
| `--upgrade` | 升级模式（保留 adapted: yes 文件） |
| `--verbose, -v` | 详细日志（每个 cp） |
| `--help, -h` | 帮助 |

环境变量：

| 变量 | 含义 |
|---|---|
| `CC_INSTALL_NO_CONFIRM=1` | 跳过确认提示（自动化场景） |
| `DEBUG=1` | 出错时打印 stack trace |

---

## 幂等性

- 默认：已存在文件**跳过**（不覆盖）
- `--force`：覆盖所有
- `--upgrade`：覆盖未改写文件，保留 adapted 文件（需 MANIFEST 支持，v3 完整启用）
- 多次重跑同一命令：第二次会发现"全部已存在 → 跳过"，不会破坏现状

每次成功 install 写入 `cc-install-state.json`：
- L1 → `~/.claude/cc-install-state.json`
- 项目层 → `<target>/.claude/cc-install-state.json`

记录 layer / timestamp / cc 仓库 SHA / 用过的选项，作部署历史追溯。

---

## 占位符填充

`CLAUDE.md.template` 含形如 `[Unity Version]` 的占位符。install 检测后逐个询问：

```
发现 8 个占位符待填（回车跳过保留原样）
  [Unity Version] → 6000.0.30f1
  [Render Pipeline] → URP
  [DI Framework] → VContainer
  [Input System] → New Input System
  ...
```

跳过的（直接回车）保留 `[xxx]` 原样，可后续手填。

加 `--no-fill` 完全跳过此步。

---

## 已知限制（v1+v2 范围内）

- `--upgrade` 三方 merge 暂未实现（依赖 MANIFEST `Pre-adapt SHA` 字段，09 §9）
- `--uninstall` 暂未实现（v3）
- Path-scoped rules 自动触发 hook 暂未实现（依赖 `_paths.yaml` + 新 hook，09 §6）
- agent-memory/ 目录建出，但 agent 写入逻辑由 agent 自决
- Donchitos `validate-assets.sh` 等独有 hook 暂未 Node.js 重写（09 §8）

---

## 失败处理

- 任一层部署失败 → 立即中止后续层（避免半部署状态）
- L1 部署失败 → 检查 `~/.claude/` 写权限
- 项目层失败 → 检查 target 目录写权限

`--verbose` 打开看每个文件操作；`DEBUG=1` 打印异常 stack。
