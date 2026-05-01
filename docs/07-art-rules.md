# 07 · 美术子层规则（L3 · `<project>/<art-subdir>/`）

> 角色：L3 美术子层设计文档 + `cc/art/CLAUDE.md.template` 起草依据 + cherry-pick 计划 + 推荐外部插件清单。
> 绑定：03 §1 L3 · §2.1 (`art-`) · §5 · §6.1。
> 交付物：(a) 本文；(b) 起草 `cc/art/CLAUDE.md.template`；(c) cherry-pick 落地（Donchitos + game-art-skill）；(d) 更新 `cc/art/MANIFEST.md`。

---

## 1. 目的

L3 美术子层服务"美术资产工作流"——风格定义、规格、命名、调色板、shader 视觉、VFX、UI 视觉、polish & juice。承载内容必须满足：

> 决定**视觉**的工作；不决定**代码实现细节**（那是 06 unity）。

判据：**"管美术资产，不管引擎实现"**。

**在 L3 art**：
- 视觉风格定义（art bible / mood / palette）
- 资源规格（命名、维度、色彩模式、文件格式、图层组织）
- 资源审计（合规校验）
- 像素美术 / 2D / 3D / shader 视觉风格
- VFX / particles 设计原则
- UI 视觉风格（不含 UI 代码 — 那归 06）
- Post-processing & juice
- 与 DCC 工具（Aseprite / Blender / Adobe / SketchUp 等）的工作流约定

**不在 L3 art（→ 引擎子层，典型 06 unity）**：
- Shader **代码**编码规范（如 ShaderLab / HLSL）
- UI 代码（如 UXML / USS / Godot Theme）
- 引擎 API 调用

**不在 L3 art（→ 08 audio）**：
- 任何音频资产（即使是 trailer 配音）

**不在 L3 art（→ L2）**：
- 跨视觉的设计决策（GDD / 平衡 / playtest）

---

## 2. 当前状态与计划 cherry-pick

| 类别 | 之前 | 本轮新增 | 来源 |
|---|---|---|---|
| Agents | 0 | +**2** | Donchitos: art-director, technical-artist |
| Skills | 0 | +**4** | Donchitos: art-bible, asset-spec, asset-audit ; game-art-skill: game-art-polish (含 9 reference docs) |
| Rules | 0 | 0 | 暂无 art-only path-scoped rules（shader-code 在 06 unity） |
| 推荐外部插件 | — | 4 | pixel-plugin / blender-mcp / Adobe for Creativity / Hyper3D Rodin（按需） |
| CLAUDE.md.template | 0（不存在） | **新建** | §3 |

完整清单见 `cc/art/MANIFEST.md`。

---

## 3. art/CLAUDE.md.template 起草规格

### 3.1 没有"原版"可对照

ECC 完全无美术内容；Donchitos 也没有美术子层 CLAUDE.md。**全自写**。

### 3.2 必须包含的章节

1. **美术子层身份**：风格基调（占位）/ 主调色板 / 美术维度（2D / 像素 / 3D / 混合）/ 主要 DCC 工具 / 平台分辨率
2. **L3 在层级中位置**：依赖 L1 + L2，与 L3 unity (06) 平级互引
3. **Donchitos art agents 索引**：art-director + technical-artist 何时使用
4. **Skills 索引**：art-bible / asset-spec / asset-audit / game-art-polish（及其 9 个 reference 子文档）
5. **推荐外部插件**：pixel-plugin / blender-mcp / Adobe for Creativity 等的安装与触发场景
6. **资源管理约定**：命名规范、目录结构、版本控制（Excel/PSD/Blender 文件大对象处理）
7. **与 06 unity 协作边界**：shader 视觉 vs shader 代码、UI 视觉 vs UI 代码
8. **修订路径**：改 `cc/art/CLAUDE.md.template` → install 时填充

### 3.3 必须**不**包含

- ❌ 引擎 API 调用细节（→ 06 unity）
- ❌ 音频资产规则（→ 08 audio）
- ❌ 重复 L1 / L2 内容
- ❌ 强迫消费方使用某个 DCC 工具（pixel-plugin / Blender 等都是"推荐"）

### 3.4 长度上限

≤ 300 行（03 §5）。目标 ~180 行。

---

## 4. `art-*` skill 入选标准

我们什么时候**新建**一个 `art-*` skill？

### 4.1 入选条件

1. **美术资产相关**——风格定义、规格、视觉、polish
2. **不依赖具体 DCC 工具**——工具特化由外部 plugin（pixel-plugin / blender-mcp / Adobe connector）负责
3. **触发条件含路径前缀**（`Assets/Art/**` `art/**`）或关键词（"sprite naming", "color palette", "art bible"）
4. **不与 cherry-pick 重复**——优先 cherry-pick

### 4.2 不入选

- 工具操作类（"画一个像素精灵"）—— 由 pixel-plugin 负责
- shader **代码** —— 06 unity (`shader-code.md`)
- 音频资产 —— 08 audio
- 跨美术 + 设计的高层决策 —— L2 (`design-system` skill)

### 4.3 候选清单（未来工作）

依优先级：
1. **`art-naming-conventions`** — `Assets/Art/**` 命名 / 路径 / .meta 规范
2. **`art-color-palette-define`** — 项目级调色板（与 pixel-plugin 预设互补，定义本项目专属）
3. **`art-import-settings`** — 引擎导入参数检查（filter mode / compression / mipmap）
4. **`art-tileset-pipeline`** — Tile 切割 / atlas 打包 / 边界检查
5. **`art-sprite-sheet-spec`** — sprite sheet 命名 / 帧间隔 / pivot 规范
6. **`art-material-conventions`** — Material 命名与 shader 引用约定（与 06 unity 协作）
7. **`art-mood-board-builder`** — 风格收集与决策

本轮**不写**任何 art-* skill；§4.3 留给后续 dogfood 后按需。

---

## 5. Cherry-pick 计划

### 5.1 Agents（2 个 → `cc/art/agents/`）

| Agent | 来源 | 何时使用 |
|---|---|---|
| `art-director` | Donchitos Tier 2 | 视觉方向、style guide、art bible 审议、风格冲突仲裁 |
| `technical-artist` | Donchitos Tier 3 | shader 实现协作、VFX 调优、艺术管线工具、性能预算 |

不抄：
- `unity-shader-specialist` 已在 06 unity；技术美术调用它做 shader 实现
- `audio-director` `sound-designer` → 08 audio

### 5.2 Skills（4 dirs → `cc/art/skills/`）

#### 来自 Donchitos（3）：
| Skill | 用途 |
|---|---|
| `art-bible` | 引导式 art bible 撰写（视觉风格规范文档） |
| `asset-spec` | 资源规格定义（命名 / 格式 / 维度 / 质量） |
| `asset-audit` | 现有资源对照规格的合规校验 |

#### 来自 game-art-skill（1，含 9 个 reference docs）：
| Skill | 用途 | Reference docs |
|---|---|---|
| **`game-art-polish`** ⭐ | 把 "programmer art" 提升到 "polished art" 的方法论 | `foundations.md` `juice-and-feel.md` `particles-vfx.md` `pixel-art.md` `post-processing.md` `shaders.md` `stylized-3d.md` `ui-toolkit.md` `creators-and-resources.md` |

`game-art-polish` 的核心理念（已写在其 SKILL.md）：
1. **Consistency beats quality** — 一致性 > 单点高质量
2. **Contrast is readability** — 对比度决定可读性
3. **Shape language carries meaning** — 形状语言传递语义
4. **Limit the palette hard** — 严格限制调色板
5. **Juice is cheapest leverage** — juice 是最便宜的杠杆

reference 文档覆盖 Unity 与 Godot 双引擎；本层使用时按 06 unity 决策走对应 Unity 路径。

### 5.3 推荐外部插件（不 cherry-pick，consumer 自装）

按 03 §1，外部 plugin / connector 由 consumer 维护（在 `<project>/.mcp.json` 或 Claude Customize 面板装），cc/art/ 只**推荐**。

| 工具 | 安装方式 | 适用场景 |
|---|---|---|
| **[pixel-plugin](https://github.com/willibrandon/pixel-plugin)** | `/plugin marketplace add https://github.com/willibrandon/pixel-plugin` | 像素美术（Aseprite 自动化） |
| **[blender-mcp](https://github.com/ahujasid/blender-mcp)** | Blender plugin + `claude mcp add blender-mcp ...` | 3D 建模 / 材质 / 动画 / 渲染 |
| **Adobe for Creativity Connector** | Claude **Customize** 面板装（官方） | Photoshop / Illustrator / Firefly / Premiere / Lightroom / InDesign / Stock / Express，50+ 工具 |
| Hyper3D Rodin（按需） | MCP server | image → 3D model 生成 |

CLAUDE.md.template 列出这些；具体安装由 09-install-design.md 时再统一指导（或留给消费方按 README 自装）。

### 5.4 命名冲突处理

| 项目 | 已存在 | 本轮加入 | 处理 |
|---|---|---|---|
| `art-director` agent | （无） | Donchitos | 不冲突 |
| `technical-artist` agent | （无） | Donchitos | 不冲突 |
| `art-bible` skill | （无） | Donchitos | 不冲突 |
| `asset-spec` `asset-audit` | （无） | Donchitos | 不冲突 |
| `game-art-polish` skill | （无） | game-art-skill | 不冲突 |

**结论**：本轮无冲突。

---

## 6. 与引擎子层的边界（以 06 unity 为例）

L3 art 与 L3 引擎子层（unity / godot / unreal）同级，需要明确分工。下表以 Unity (06) 为例；其他引擎类比：

| 维度 | L3 art | 引擎子层（Unity 例） |
|---|---|---|
| **Shader** | 视觉风格 / 配方 / 何时用 toon vs PBR（`game-art-polish/shaders.md`） | 代码规范、HLSL / ShaderLab 语法（`unity:rules/path-scoped/shader-code.md`） |
| **UI** | 视觉风格 / 配色 / 排版（`game-art-polish/ui-toolkit.md`） | 代码实现（UXML / USS / UGUI Canvas → `ui-code.md`） |
| **VFX** | 视觉概念、形状、密度（`game-art-polish/particles-vfx.md`） | 实现（VFX Graph / Particle System API） |
| **资产路径** | 命名规范、规格 | 引擎特定 import settings + 代码组织 |
| **Material** | 材质参数美学决策 | Material C# API、Shader Graph 集成 |

工作流上美术先行（art bible → asset spec → 风格资源），引擎实现接下（shader code、material、UI 代码）。两层互相引用（如 art 推荐 shader 风格 → engine layer 实现 shader 代码）。

---

## 7. 与 08 audio 的边界

明确不交叉：
- L3 art 不管音频资产
- 但 trailer / cinematic 制作可能跨 art + audio：约定**默认归 art**（视觉为主），audio 资产单独按 08 处理

---

## 8. 决策点（消费者填 CLAUDE.md.template 时定）

| 项 | 选择 | 影响 |
|---|---|---|
| **美术维度** | 2D pixel / 2D 矢量 / 2D 手绘 / 3D 卡通 / 3D 写实 / 混合 | 决定调用哪些外部插件、哪些 reference docs |
| **主调色板** | NES / Game Boy / PICO-8 / 自定义 / 无 | pixel art 强相关；与 pixel-plugin 预设对接 |
| **核心 DCC 工具** | Aseprite / Blender / Photoshop / Illustrator / Substance / 等 | 决定推荐安装哪个 plugin |
| **目标分辨率** | 480p / 720p / 1080p / 4K / 多分辨率 | 资产规格上限 |
| **Pixel-perfect** | 是 / 否 | 决定 sprite 尺寸是否必须为 base 倍数 |
| **风格基调** | (一段话) | art bible 起点 |

---

## 9. 验证流程

### 9.1 dogfood 路径

L3 art 需要在**真实有美术资产的项目**上验证。`修行计划/中国象棋/` 是 Python MCTS，没有美术资产；其他子项目同样不带美术。

**dogfood 候选**：
- 修行计划下未来真正开始的游戏项目（修行 / 卡牌等）
- 或新建一个小型 demo（hello-art）专门验证 art 工作流

**必须验证**：
- `art-director` 真在被风格相关查询触发
- `art-bible` skill 能从 `/brainstorm` 输出（L2）顺利启动
- `asset-spec` + `asset-audit` 形成闭环（先定 spec，后审 audit）
- `game-art-polish` 的 9 个 reference docs 在合适场景被引用

### 9.2 不能出现的回归

- L3 art 内容溢出到 06 unity（如把 shader 代码规范写进 art）
- L3 art 假设某 DCC 工具（外部插件应是推荐，不是必需）
- 重复 L2 design-system / L1 通用内容

---

## 10. 已知 gap / 后续

### 10.1 待补全
- **`art-*` skill 候选**（§4.3 列了 7 个）— dogfood 出真实需求后写
- **`art/rules/` path-scoped**（如 `art-naming.md` for `Assets/Art/**`）— 写 09 install 时考虑触发机制
- **真美术项目 dogfood** — 同 06 unity，需新建或等待
- **Donchitos `/art-bible` `/asset-spec` 假设的目录约定**（`production/review-mode.txt` `design/art/art-bible.md`）— consumer 需先建出这套骨架，或 fork skill 改路径；09 install 时考虑自动 scaffold

### 10.2 待评估
- `game-art-polish` 的 SKILL.md 含 Unity + Godot 双引擎指导。我们只做 Unity，是否要 fork 成 unity-only 简版？**先观察**触发率与噪音
- `Hyper3D Rodin` / `fal-ai-media` 等 AI 图像 / 3D 生成 MCP 是否纳入推荐外部插件——按需
- `agent-memory/` 系统设计推迟到 09——见 05 §9.2

### 10.3 写 08 前需要 ✅ 已实现

- ✅ 08 已写；`audio-director` + `sound-designer` cherry-pick 到 `cc/audio/agents/`
- ✅ `team-audio` skill 评估后跳过（与 05 决策一致：team-* 系列单人项目用不上）
- ✅ Ableton 官方 connector + Splice 官方 + ahujasid/ableton-mcp + **fmod-mcp** + Sound Effects Expert 在 audio template §5 推荐
- 备注：Adobe for Creativity Connector 不含 Audition；游戏音频由 Ableton / Splice / fmod-mcp 主导（08 §10.3）

---

## 11. 状态

- 2026-05-01：本文 v1 + cc/art/ Donchitos + game-art-skill cherry-pick 完成 + art/CLAUDE.md.template 起草完成。
- 待办：08（Audio 子层）— L3 同级，与 07 互不阻塞。
