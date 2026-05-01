# 06 · Unity 子层规则（L3 · `<project>/<unity-subdir>/`）

> 角色：L3 Unity 子层设计文档 + `cc/unity/CLAUDE.md.template` 起草依据 + Donchitos cherry-pick 计划 + ECC csharp baseline 适配 Unity 的工作清单。
> 绑定：03 §1 L3 · §2.1 (`unity-`) · §5 · §6.1。
> 交付物：(a) 本文；(b) 起草 `cc/unity/CLAUDE.md.template`（之前不存在）；(c) Donchitos Unity cherry-pick 落地；(d) 更新 `cc/unity/MANIFEST.md`。

---

## 1. 目的

L3 Unity 子层服务"在 Unity 项目里编辑代码 / 资产路径"的工作。承载内容必须满足：

> 仅当当前项目使用 Unity 时才适用；换 Godot 立即失效。

判据：**"绑定 Unity 引擎"**。

**在 L3 unity**：MonoBehaviour / ScriptableObject / Editor 脚本约定、URP / HDRP / Built-in 管线决策、Input System 选择、Mono / IL2CPP 后端、DI 框架（VContainer / Reflex / Zenject）、Addressables、UI Toolkit / UGUI、DOTS / ECS、ShaderLab + HLSL 编码规范、Unity Profiler / Memory Profiler 用法。

**不在 L3 unity（→ L2）**：跨引擎的 GDD、平衡设计、playtest 流程、sprint 协调。

**不在 L3 unity（→ 其他 L3）**：
- 美术资产工作流（Aseprite / Blender / 调色板） → L3 art (07)
- 音频资产 LUFS / 命名规范 / 响度归一化 → L3 audio (08)

**关于 Unity 音频边界**：Unity AudioSource / AudioMixer 等引擎 **API** 归本层（属引擎代码）；音频资产工作流（命名 / LUFS / 文件格式 / 响度归一化）归 L3 audio。两层会通过 modules/audio.md 与 audio-* skill 互相引用。

---

## 2. 当前状态与计划 cherry-pick

| 类别 | 之前（baseline） | 本轮新增 | 来源 |
|---|---|---|---|
| Agents | 1 (csharp-reviewer) | +**5** Donchitos | unity-specialist + 4 sub |
| Skills | 2 (csharp-testing, dotnet-patterns) | **0** Donchitos（`setup-engine` 修订上移到 L2，见 §5.2） | — |
| Rules | 5 (csharp/) | +**4** Donchitos | path-scoped: engine-code / shader-code / ui-code / network-code |
| Docs (engine-reference) | 0 | +**16** Donchitos | VERSION / breaking-changes / deprecated-apis / current-best-practices / modules×8 / plugins×3 |
| CLAUDE.md.template | 0（之前不存在） | **新建** | §3 |

完整清单见 `cc/unity/MANIFEST.md`。

---

## 3. unity/CLAUDE.md.template 起草规格

### 3.1 没有"原版"可对照

L1 (`cc/user/`) 和 L2 (`cc/project/`) 都从 ECC 模板改写而来；L3 unity 之前没有 CLAUDE.md 模板（ECC 完全无 Unity 内容）。**本文件为全自写**。

### 3.2 必须包含的章节

1. **Unity 子层身份**：Unity 版本（占位）/ 渲染管线（URP / HDRP / Built-in 占位）/ Input System / Scripting Backend / DI 框架 / 目标平台
2. **L3 在层级中位置**：L1 + L2 + 本层叠加加载条件
3. **Donchitos Unity agent 索引**：unity-specialist + 4 sub 的何时使用
4. **Skills + commands 索引**：本层带的 + 自写候选（§4）
5. **Path-scoped rules 索引**：engine-code / shader-code / ui-code / network-code 的适用路径
6. **Engine-reference 文档导航**：modules + plugins 索引（VERSION 占位由消费者填）
7. **ECC csharp baseline 与 Unity 实际差异**：明示 csharp-reviewer 是 .NET / Web 偏向，Unity 特化由 unity-specialist 接管
8. **编辑 Assets/** 时的协作约定**：文件修改触发 path-scoped rule + 委托 unity-specialist
9. **修订路径**：改 `cc/unity/CLAUDE.md.template` → install 时填充到 `<project>/<unity-subdir>/CLAUDE.md`

### 3.3 必须**不**包含

- ❌ Godot / Unreal 字眼（除并列示例标注或交叉引用）
- ❌ 美术 / 音频资产工作流细节（→ 07 / 08）
- ❌ 重复 L1 / L2 内容
- ❌ ECC csharp baseline 文件的逐字内容（让 csharp-reviewer 等 description 说话）

### 3.4 长度上限

≤ 300 行（03 §5）。目标 ~200 行。

---

## 4. `unity-*` skill 入选标准

我们什么时候**新建**一个 `unity-*` skill？

### 4.1 入选条件（必须全部满足）

1. **Unity 引擎专属**——换引擎完全失效
2. **触发条件含 Unity 路径或 API 关键词**（03 §2.5）——`Assets/**`、`MonoBehaviour`、`URP`、`Addressables` 等
3. **Donchitos 没覆盖或不够细**——优先 cherry-pick；自写仅作为补充
4. **现有 5 个 unity-* agent 不能直接代替**——agents 是 chat-driven 角色；skills 是流程化模板

### 4.2 不入选（应放其他层）

- 描述里**不含** Unity 关键词，可在任何引擎用 → L2 (`gamedev-*`)
- 描述里出现 sprite / 调色板 / Aseprite / texture authoring → L3 art (`art-*`)
- 描述里出现 LUFS / AudioMixer 路由策略 / 音频文件格式 → L3 audio (`audio-*`)
- 描述里**不含**任何游戏术语 → L1 (`general-*`)

### 4.3 候选清单（未来工作）

依优先级：
1. **`unity-urp-shader-recipes`** — URP / Shader Graph + HLSL 配方（参考 [pronitdas/game-art-skill — shaders.md](https://github.com/pronitdas/game-art-skill/blob/main/shaders.md)）
2. **`unity-addressables-loader`** — Addressables 异步加载与内存策略
3. **`unity-input-system-bindings`** — 新 Input System 配置 / 旧 Input Manager 迁移
4. **`unity-di-vcontainer`** — VContainer DI 模式（与 Reflex / Zenject 对比）
5. **`unity-ui-toolkit-vs-ugui`** — UI 实现选择决策树
6. **`unity-monobehaviour-lifecycle`** — Update / FixedUpdate / LateUpdate / 协程的边界
7. **`unity-allocation-hotpath`** — Update / OnUpdate 中避免 GC 分配的模式
8. **`unity-build-pipeline`** — Build settings / Asset Bundles / IL2CPP 构建链
9. **`unity-editor-scripts`** — `Editor/` 目录、`[InitializeOnLoad]`、运行时 vs Editor 模式差异
10. **`unity-profiler-workflow`** — Unity Profiler / Memory Profiler / Frame Debugger 解读与调优

本轮**不写**任何 unity-* skill；§4.3 留给后续 dogfood 后按需触发。

---

## 5. Donchitos Unity cherry-pick 计划

### 5.1 Agents（5 个 → `cc/unity/agents/`）

| Agent | model | 何时使用 |
|---|---|---|
| `unity-specialist` | sonnet | Unity Engine 总体决策（MonoBehaviour vs DOTS、Addressables、URP/HDRP、Unity 优化） |
| `unity-dots-specialist` | sonnet | DOTS / ECS / Jobs / Burst compiler / Hybrid Renderer |
| `unity-shader-specialist` | sonnet | Shader Graph / VFX Graph / URP/HDRP customization / post-processing |
| `unity-addressables-specialist` | sonnet | Addressable groups / async loading / 内存 / content delivery |
| `unity-ui-specialist` | sonnet | UI Toolkit / UXML/USS / UGUI Canvas / data binding / 跨平台输入 |

### 5.2 Skills（0 Donchitos → 本层；1 个上移到 L2）

**修订**：`setup-engine` 原计划 cherry-pick 到本层，self-review 后**修正放到 L2** (`cc/project/skills/setup-engine/`)。理由：

- 它是**多引擎**的（`/setup-engine unity` `/setup-engine godot`）
- 用户在 L2（项目根）调用，**还没**进入 unity 子树时即需触发；放 L3 unity 太晚——只有进入 unity 子树才加载，违反 setup 语义
- L2 + L3 加载顺序：L2 先于 L3 unity，setup-engine 在 L2 才能"启动"unity subtree 创建

修订后落地：
- `cc/project/skills/setup-engine/` ✅ 已搬入 L2（详见 05 §5.2）
- `cc/unity/skills/` 仅留 ECC csharp-testing + dotnet-patterns

**Donchitos 没有更多 Unity 专属 skill**（其架构靠 agent 处理 Unity 细节）。我们的 unity-* skill 候选见 §4.3，未来按需。

### 5.3 Path-scoped rules（4 个 → `cc/unity/rules/path-scoped/`）

| Rule | 适用路径（约定） | 内容偏重 |
|---|---|---|
| `engine-code.md` | `Assets/Scripts/Engine/**` 等引擎内部代码 | 性能、内存、引擎子系统 |
| **`shader-code.md`** | `Assets/Shaders/**` `*.shader` `*.hlsl` `*.shadergraph` | ShaderLab + HLSL 编码规范、URP/HDRP 兼容 |
| `ui-code.md` | `Assets/Scripts/UI/**` `*.uxml` `*.uss` | UI Toolkit / UGUI 代码规范 |
| `network-code.md` | `Assets/Scripts/Net/**` 等 | Netcode for GameObjects / Mirror / Photon API 规范 |

**注**：`shader-code.md` 是关于 shader **代码**（HLSL / ShaderLab），归 unity 引擎层；shader 视觉风格 / 配方 / 美术调用归 L3 art (07)。两层会互相引用。

### 5.4 Engine-reference docs（16 文件 → `cc/unity/docs/engine-reference/`）

整树 cherry-pick：
- `VERSION.md`（占位，消费者填）
- `breaking-changes.md` `deprecated-apis.md` `current-best-practices.md`
- `PLUGINS.md`
- `modules/{animation, audio, input, navigation, networking, physics, rendering, ui}.md`（**8** 个）
- `plugins/{addressables, cinemachine, dots-entities}.md`（**3** 个）

**关于 `modules/audio.md`**：是 Unity 引擎 AudioSource / AudioMixer **API** 文档；归 unity 层。L3 audio 处理音频**资产**工作流（LUFS、命名）；两者不冲突。

### 5.5 命名冲突处理

逐项核对（含 ECC L1 + Donchitos L2）：

| 项目 | 已存在 | L3 unity（本轮） | 处理 |
|---|---|---|---|
| `setup-engine` | （无） | Donchitos skill | 不冲突 |
| `unity-specialist` 等 | （无） | Donchitos agent | 不冲突 |
| `engine-code.md` | （L1/L2 无） | Donchitos rule | 不冲突 |
| Unity engine docs | （无） | 全新 | 不冲突 |

**结论**：本轮无冲突。

---

## 6. ECC csharp baseline 适配 Unity 工作清单

`cc/unity/MANIFEST.md` 已标记 ECC csharp 内容"待 Unity 改写"。本节锁定具体清单。

### 6.1 ECC csharp 内容定位

ECC `rules/csharp/` 与 `csharp-reviewer` 偏 **.NET / Web 后端**：依赖注入是 ASP.NET Core DI、async/await 是 web 请求模型、测试是 xUnit。Unity 是不同生态：
- DI 是 VContainer / Reflex / Zenject（ASP.NET DI 不适用）
- 协程 / async 边界是 MonoBehaviour 生命周期
- 测试是 NUnit + Unity Test Framework（Edit Mode / Play Mode）
- 性能瓶颈是 Update GC 分配，不是 web 请求延迟

### 6.2 适配策略：保留 baseline + 添加 Unity 特化层

**不修改 ECC 文件**（保 cherry-pick 原貌；MANIFEST `adapted: no`）。Unity 特化由：
- `unity-specialist` agent 接管引擎决策
- `cc/unity/CLAUDE.md.template` 显式声明 "ECC csharp baseline 为通用 C# 风格；Unity 特化以本子层为准"
- 必要时未来自写 `unity-csharp-style.md`（Unity 特化风格规范）覆盖 ECC

### 6.3 csharp-reviewer 的处理

ECC csharp-reviewer 是通用 C# code reviewer（继承自 ECC L1 风格）。L3 unity 用法：
- 简单代码审查：`csharp-reviewer` 即可
- Unity 特化审查：调用 `unity-specialist`（DOTS / Burst / 内存等专项 → 对应 sub-specialist）
- 极端 Unity 特化：未来 fork csharp-reviewer 到 `unity-csharp-reviewer`，加 MonoBehaviour-aware 检查

本轮**不 fork**；观察 dogfood 触发率。

### 6.4 csharp-testing skill 的处理

ECC `csharp-testing` skill 假设 xUnit / NUnit 在 .NET 项目。Unity 用 NUnit 但运行在 Unity Test Framework 容器里（Edit Mode / Play Mode），写法不同。

**保留 cherry-pick**作为通用 NUnit 起点；未来按需写 `unity-test-framework` skill。

### 6.5 dotnet-patterns skill 的处理

ECC `dotnet-patterns` 是 .NET 服务端模式。Unity 极少用其中模式（async/await / DI 容器风格不同）。

**保留 cherry-pick**作为参考；不主动用。如发现完全不触发，下次 stocktake 时考虑下移到 `<unity>/_dotnet-reference/` 边缘位置或删除。

---

## 7. 决策点（消费者填 CLAUDE.md.template 时定）

| 项 | 选择 | 影响 |
|---|---|---|
| **Unity Version** | `6000.0.x LTS` / `2022.3.x LTS` / etc. | engine-reference 中 breaking-changes 与 deprecated-apis 直接对应 |
| **Render Pipeline** | URP / HDRP / Built-in | shader 写法、material setup、post-processing |
| **Input System** | New Input System / 旧 Input Manager | input.md 中两套 API 取舍 |
| **Scripting Backend** | IL2CPP / Mono | 性能、内存、AOT 限制（reflection / 动态代码） |
| **DI Framework** | VContainer / Reflex / Zenject / 无 | 项目架构、生命周期管理 |
| **Asset Pipeline** | Addressables / AssetBundles / Resources | 加载策略、内存、构建链 |
| **UI** | UI Toolkit / UGUI / 混用 | UI 代码规范、跨平台输入 |
| **目标平台** | Win/Mac/Linux/iOS/Android/Switch/PS/Xbox/Web | 性能预算、平台特化分支 |

CLAUDE.md.template 把这 8 项做成占位符，install / 消费者填实。

---

## 8. 验证流程

### 8.1 dogfood 路径

L3 unity 改动需要在**真实 Unity 项目**上验证。当前 `修行计划/` 没有 Unity 项目（中国象棋是 Python，game_develop 空）。

**dogfood 候选**：
- 新建 hello-unity 项目（Unity 6000.0 LTS + URP）作为 L3 unity 验证目标
- 或等修行计划开始 Unity 工作时一并验证

**必须验证**：
- `unity-specialist` 真的在 Unity 项目场景下被触发（grep 描述里 "Unity"）
- `setup-engine unity` 能跑通 init 流程
- `engine-reference/VERSION.md` 占位被消费者实际填充
- ECC csharp baseline 不抢 unity-specialist 的 Unity 特化职责

### 8.2 不能出现的回归

- L3 unity 文件叠加到非 Unity 项目（违反 03 §6.1：低层不应被高层引用，但 L3 是被 L2 调用的；这里说的是部署边界——install 不应把 unity/ 装到非 Unity 项目）
- ECC csharp 风格强行 override Unity 特化决策（导致写出 ASP.NET 风格 C#）
- L3 art / audio 内容被误装到 unity/ 子目录

---

## 9. 已知 gap / 后续

### 9.1 待补全
- **dogfood 真 Unity 项目**：08 之后或独立任务，新建一个最小 Unity 6000.0 + URP 验证
- **`unity-csharp-reviewer` agent**（按需）：如发现 ECC csharp-reviewer 漏 Unity 特化点
- **§4.3 候选 unity-* skill**：dogfood 出真实需求后逐个写
- **`unity-test-framework` skill**：Edit Mode / Play Mode test 写法

### 9.2 待评估
- ECC `dotnet-patterns` 在 Unity 项目下的实际触发率——0 触发就考虑下移或删除
- `engine-reference/modules/audio.md` 与 L3 audio (08) 的边界——再次确认我们的划分（API 在 unity，资产工作流在 audio）
- `agent-memory/` 系统设计推迟到 09——见 05 §9.2

### 9.3 Unity MCP server 选型（消费方维护）

Unity MCP 让 Claude 直接控制 Unity Editor（场景 / 资源 / 脚本编辑）。**不**由 cc/ 提供（按 03 §1 消费方维护 `<project>/.mcp.json`），但选型建议见 `01-research-resources.md §4.1`：

- **Coplay** — 主流方案，资源/场景/脚本/任务自动化
- **CoderGamester mcp-unity** — Node.js bridge，跨 IDE
- **Unity 官方 MCP** — Unity 启动即开 named pipe / unix socket

接入命令（Coplay 例）：
```bash
claude mcp add --scope user --transport stdio coplay-mcp \
  --env MCP_TOOL_TIMEOUT=720000 -- uvx --python ">=3.11" coplay-mcp-server@latest
```

### 9.4 写 07 前需要 ✅ 已实现

- ✅ 07 已写；`art-director` + `technical-artist` cherry-pick 到 `cc/art/agents/`
- ✅ `art-bible` `asset-spec` `asset-audit` cherry-pick 到 `cc/art/skills/`
- ✅ 外部 pixel-plugin / blender-mcp / Adobe connector 在 art template §5 推荐
- ✅ shader 工作流跨 06/07 边界已写：07 §6 表格 + template §7

---

## 10. 状态

- 2026-05-01：本文 v1 + cc/unity/ Donchitos cherry-pick 完成 + unity/CLAUDE.md.template 起草完成。
- 待办：07（美术子层）— L3 同级，与 06 互不阻塞。
