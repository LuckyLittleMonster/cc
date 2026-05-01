# cc · Claude Code 配置仓库 · 游戏开发分层方案

> 为 **Unity + 美术 + 音乐 + Python 数据策划** 的游戏开发工作流设计的 Claude Code 配置仓库。
> 上游 cherry-pick：[ECC](https://github.com/affaan-m/everything-claude-code) + [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) + [game-art-skill](https://github.com/pronitdas/game-art-skill)；推荐外部 plugin：[pixel-plugin](https://github.com/willibrandon/pixel-plugin) / [blender-mcp](https://github.com/ahujasid/blender-mcp) / [fmod-mcp](https://github.com/jmperez127/fmod-mcp) 等。

---

## 这是什么

**cc** 是一套**分层、可复用、可发布**的 Claude Code 配置——把 Claude Code 的 CLAUDE.md / Skills / Agents / Commands / Hooks 体系按游戏开发的**自然层次**组织：

```
L1 通用工程姿态  →  ~/.claude/                       (跨所有项目)
L2 游戏综合     →  <project>/.claude/                (游戏特定，跨引擎)
L3 引擎子层     →  <project>/<engine-subdir>/.claude/  (Unity / Godot / Unreal)
L3 美术子层     →  <project>/<art-subdir>/.claude/
L3 音频子层     →  <project>/<audio-subdir>/.claude/
```

每层只承载该层关心的工作流。**换 Unity → Godot 时，L1 + L2 不动；只重做 L3。**

---

## 为什么不直接用 ECC 或 Donchitos

| 上游 | 优势 | 不足 |
|---|---|---|
| **ECC** | 跨语言工程基础设施（agents / hooks / continuous-learning） | 55% 内容是 SaaS / 业务运营 / 医疗 / 区块链 — 对游戏开发是死重 |
| **Donchitos** | 49 game-dev agents + 72 skills + path-scoped rules + Unity engine reference | 缺 ECC 的 memory persistence / continuous-learning 基础设施；hooks 是 .sh 跨平台不友好 |

**cc 的策略**：cherry-pick 而非 fork。
- 从 ECC 抓基础设施（user/ 层 246 文件）
- 从 Donchitos 抓游戏专长（agents / skills / engine-reference / path-scoped rules）
- 自写 L3 art / audio template、跨层粘合、入选标准、外部 plugin 推荐

详见 [`docs/02-ecc-categorization.md`](docs/02-ecc-categorization.md)。

---

## 仓库结构

```
cc/
├── README.md             ← 本文（仓库门面）
├── docs/                 ← 设计文档 00–09（详细架构合约 + 各层规则）
│
├── refs/                 ← 上游参考（只读 / submodule / gitignore）
│   ├── everything-claude-code/
│   ├── claude-code-game-studios/
│   ├── pixel-plugin/
│   ├── game-art-skill/
│   └── fmod-mcp/
│
├── user/                 ← L1 → ~/.claude/                    (247 files)
├── project/              ← L2 → <project>/.claude/            (69 files)
├── unity/                ← L3 → <project>/<engine-subdir>/.claude/  (35 files)
├── art/                  ← L3 → <project>/<art-subdir>/.claude/     (17 files)
├── audio/                ← L3 → <project>/<audio-subdir>/.claude/   (4 files)
│
└── install.{sh,ps1}      ← 部署器（设计 spec 完成；实现 split 为后续工作）
```

---

## 快速上手

### 1. 阅读文档

按顺序读 `docs/`：

| # | 文档 | 时长 |
|---|---|---|
| 00 | [文档总览](docs/00-README.md) | 5 分钟 |
| 02 | [ECC 三桶分类](docs/02-ecc-categorization.md) | 10 分钟（理解 cherry-pick 哲学） |
| 03 | [架构合约](docs/03-hierarchy-design.md) | 15 分钟（必读，下游所有规则的合约） |
| 04–08 | 各层规则 | 按需 |
| 09 | [install 设计](docs/09-install-design.md) | 部署时读 |

### 2. 装到 ~/.claude/（手动，install v1 待实现）

在 install.{sh,ps1} 实现前，手动 cp：

```bash
# L1 用户级（跨项目）
cp -r cc/user/* ~/.claude/

# L2 单游戏项目
cp cc/project/CLAUDE.md.template <your-game>/CLAUDE.md   # 然后填占位符
cp -r cc/project/{agents,skills,commands,rules,docs} <your-game>/.claude/

# L3 Unity 子层
cp cc/unity/CLAUDE.md.template <your-game>/Assets/Scripts/CLAUDE.md
cp -r cc/unity/{agents,skills,rules,docs} <your-game>/Assets/Scripts/.claude/

# L3 美术 / 音频同理
```

### 3. 推荐安装的外部 plugin / connector（按你项目类型）

| 项目类型 | 安装 |
|---|---|
| 像素 2D | `/plugin marketplace add https://github.com/willibrandon/pixel-plugin` |
| 3D | [blender-mcp](https://github.com/ahujasid/blender-mcp) 安装步骤 |
| 设计 / 美术全家桶 | Adobe for Creativity Connector（Claude Customize 面板装） |
| 音频 | Ableton / Splice connector（Claude Customize 面板）+ [fmod-mcp](https://github.com/jmperez127/fmod-mcp) |

---

## 核心理念

1. **Cherry-pick > Fork**：取上游真正有用的部分（约 25% ECC + ~50% Donchitos game-dev 部分），不背 dead weight
2. **分层 > 单仓**：消费者按需装层（不做美术的项目可以不装 art/）
3. **MANIFEST 为先**：每层根 `MANIFEST.md` 是 cherry-pick 的事实来源；不修改单文件 frontmatter
4. **引擎中立**：L1 / L2 不假设 Unity；L3 unity / art / audio 才特化
5. **外部 plugin 不 fork**：pixel-plugin / blender-mcp 等由消费方独立安装；cc/ 只推荐 + 写协作约定

---

## 状态

- 📚 **设计文档**：00–09 全部 v1 完成（含 v1.1 self-review 修订）
- 📦 **Cherry-pick**：5 层全部就位，372 个文件
- 🛠️ **install 实现**：v1 待 split（设计 spec 完成于 09）
- 🧪 **Dogfood**：等待真实游戏项目消费

---

## 文档导航

```
docs/00-README.md           # 文档总览（含术语表 + 跨文档约定）
docs/01-research-resources.md   # 外部资源汇编（awesome 合集 / 单仓 plugin / engine MCP）
docs/02-ecc-categorization.md   # ECC 三桶分类（需要 / 待定 / 不需要）
docs/03-hierarchy-design.md     # 架构合约（层级、命名空间、目录、写作约束）★ 必读
docs/04-general-rules.md        # L1 通用层
docs/05-gamedev-rules.md        # L2 游戏综合层
docs/06-unity-rules.md          # L3 Unity 子层
docs/07-art-rules.md            # L3 美术子层
docs/08-audio-rules.md          # L3 音频子层
docs/09-install-design.md       # 部署器设计 spec
```

---

## 贡献 / 二次开发

本仓库是为单一项目 `修行计划` 设计，但**完全可复用**到其他游戏开发项目：

1. Fork 本仓库
2. 按需调整 `cc/<layer>/CLAUDE.md.template` 占位符
3. 按 `docs/03-hierarchy-design.md §2.1` 命名空间约定写自己的 `gamedev-*` `unity-*` `art-*` `audio-*` skill
4. MANIFEST.md 维护新增 cherry-pick 来源

---

## License

文档与自写内容：MIT
Cherry-pick 内容：保留各上游 license（ECC / Donchitos / game-art-skill 都是 MIT）
