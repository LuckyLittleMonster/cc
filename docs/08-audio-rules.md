# 08 · 音频子层规则（L3 · `<project>/<audio-subdir>/`）

> 角色：L3 音频子层设计文档 + `cc/audio/CLAUDE.md.template` 起草依据 + cherry-pick 计划 + 推荐外部插件清单。
> 绑定：03 §1 L3 · §2.1 (`audio-`) · §5 · §6.1。
> 交付物：(a) 本文；(b) 起草 `cc/audio/CLAUDE.md.template`；(c) Donchitos 音频 agent cherry-pick；(d) 更新 `cc/audio/MANIFEST.md`。

---

## 1. 目的

L3 音频子层服务"音频资产工作流"——SFX 设计、BGM、VO、响度归一化、文件格式、命名、middleware 选型与集成、Mixer 路由约定。承载内容必须满足：

> 决定**听觉**资产；不决定引擎 API 实现细节（那是引擎子层）。

判据：**"管音频资产，不管引擎实现"**。

**在 L3 audio**：
- 响度标准（LUFS / True Peak / Dynamic Range）
- 采样率 / 比特深度 / 文件格式（WAV / OGG / MP3）决策
- 命名规范（SFX / BGM / VO / Ambient 分类）
- Middleware 选型（FMOD / Wwise / Unity 内置 / 开源替代）
- Mixer 路由设计（snapshot / group / send-return）
- 自适应音乐（adaptive music / state-driven music）
- 资产管线（导入参数、压缩、loop point）

**不在 L3 audio（→ 引擎子层）**：
- 引擎 audio API 调用代码（如 Unity AudioSource / AudioMixer；Godot AudioStreamPlayer；Unreal Sound Cue 类比）
- 引擎 audio system 配置（如 Unity Audio Project Settings、Godot Audio Bus Layout 等）
- middleware **代码集成**（如 FMOD Studio Unity Integration、Wwise Integration C# 调用）

**不在 L3 audio（→ 07 art）**：
- trailer / cinematic 的视觉部分（虽然两者协作）

**不在 L3 audio（→ L2）**：
- 音乐设计的高层叙事决策（应在 L2 的 narrative-director 协调）

---

## 2. 当前状态与计划 cherry-pick

| 类别 | 之前 | 本轮新增 | 来源 |
|---|---|---|---|
| Agents | 0 | +**2** | Donchitos: audio-director, sound-designer |
| Skills | 0 | 0 | Donchitos `team-audio` 待评估（同 05 决策跳过 team-* 系列） |
| Rules | 0 | 0 | 暂无 audio-only path-scoped rules |
| 推荐外部插件 | — | **5** | Ableton 官方 + ahujasid/ableton-mcp（社区）+ Splice 官方 + **fmod-mcp** + Sound Effects Expert (ElevenLabs) |
| CLAUDE.md.template | 0（不存在） | **新建** | §3 |

完整清单见 `cc/audio/MANIFEST.md`。

---

## 3. audio/CLAUDE.md.template 起草规格

### 3.1 没有"原版"可对照

ECC 完全无音频内容；Donchitos 没有音频子层 CLAUDE.md。**全自写**。

### 3.2 必须包含的章节

1. **音频子层身份**：采样率（占位）/ 比特深度 / 主格式 / Middleware 选择 / 响度目标（LUFS）/ 主语言（VO 用）
2. **L3 在层级中位置**：依赖 L1 + L2，与 06 引擎子层 + 07 art 平级
3. **Donchitos audio agents 索引**：audio-director + sound-designer
4. **Skills 索引**：暂无 cherry-pick；自写候选见 §4
5. **推荐外部插件**：Ableton / ableton-mcp / Splice / fmod-mcp / Sound Effects Expert (ElevenLabs / AudioCraft)
6. **资源管理约定**：目录结构 / 命名规范 / 版本控制（大 .wav 文件用 git LFS）
7. **响度与格式标准**：LUFS 目标、True Peak、采样率、压缩选择
8. **与 06 引擎子层协作边界**：API 在引擎层，资产在本层
9. **与 07 art 协作边界**：trailer / cinematic 跨界
10. **修订路径**

### 3.3 必须**不**包含

- ❌ 引擎 API 代码（→ 06 unity）
- ❌ 美术资产（→ 07 art）
- ❌ 重复 L1 / L2 内容
- ❌ 强迫消费方使用某 DAW（Ableton / FMOD 等都是推荐）

### 3.4 长度上限

≤ 300 行（03 §5）。目标 ~180 行。

---

## 4. `audio-*` skill 入选标准

我们什么时候**新建**一个 `audio-*` skill？

### 4.1 入选条件

1. **音频资产 / 声音设计相关**——响度、命名、格式、middleware 工作流
2. **不依赖具体 DAW**——工具特化由外部 plugin 负责
3. **触发条件含路径前缀**（`Assets/Audio/**` `audio/**`）或关键词（"LUFS", "AudioMixer routing", "FMOD bank", "sample rate"）
4. **不与 cherry-pick 重复**——优先 cherry-pick

### 4.2 不入选

- DAW 操作类（"在 Ableton 里打开 .als"）—— 外部 plugin 负责
- 引擎 audio API —— 06 unity
- 视觉内容 —— 07 art

### 4.3 候选清单（未来工作）

依优先级：
1. **`audio-naming-conventions`** — `Assets/Audio/**` 命名 / 路径 / 分类（SFX / BGM / VO / Ambient）
2. **`audio-loudness-lufs`** — 响度归一化（游戏 -23 LUFS / 流媒体 -16 LUFS / 移动 -18 LUFS 等场景标准）
3. **`audio-format-policy`** — `.wav` 44.1kHz/16-bit vs `.ogg` Q8 vs `.mp3` 128kbps 决策矩阵
4. **`audio-mixer-routing`** — Mixer Group / Snapshot / Send-Return 约定（按引擎实现：Unity AudioMixer / Godot AudioBus / FMOD Bus）
5. **`audio-middleware-decision`** — FMOD vs Wwise vs Unity 内置 vs 开源（Sound Bakery / Vorpal）决策树
6. **`audio-middleware-fmod`** — fmod-mcp 工作流约定（事件命名 `event:/<domain>/<sub>/<name>`、bank 组织、bus 路由）
7. **`audio-adaptive-music`** — state-driven 音乐 / 优先级层 / horizontal vs vertical re-sequencing
8. **`audio-engine-import-settings`** — 引擎 import 参数检查（按当前 06 引擎子层填实：Unity force mono / load type / compression；Godot 类比）

本轮**不写**任何 audio-* skill；§4.3 留给后续 dogfood 后按需。

---

## 5. Cherry-pick 计划

### 5.1 Agents（2 个 → `cc/audio/agents/`）

| Agent | 来源 | 何时使用 |
|---|---|---|
| **`audio-director`** | Donchitos Tier 2 | 音乐方向、音色调色、audio palette、audio bible、Mixer 总体规划 |
| `sound-designer` | Donchitos Tier 3 (Haiku) | SFX 设计文档、audio event 列表、混音 / mastering 笔记 |

不抄：
- `narrative-director` 已在 L2（VO 故事性归 narrative）
- 与外部 plugin（Ableton / FMOD）的实操由 plugin 自带 skill 处理

### 5.2 Skills

**本轮不抄** Donchitos skills。
- `team-audio`（多 agent 编排）—— 单人项目用不上，与 05 决策一致
- 其他 Donchitos skills 已在 L2（如 `/balance-check`），audio 不重复

audio-* 候选见 §4.3。

### 5.3 推荐外部插件（**不**由 cc/ 提供）

按 03 §1，外部 plugin / connector 由消费方维护。本层推荐：

| 工具 | 类型 | 适用场景 | 安装 |
|---|---|---|---|
| **Ableton 官方 connector** | Anthropic 官方 | DAW 编排 / 音乐生产 | Claude Customize 面板 |
| [ahujasid/ableton-mcp](https://github.com/ahujasid/ableton-mcp) | 社区 MCP | Ableton 备选；同 blender-mcp 作者 | `claude mcp add ableton-mcp ...` |
| **Splice 官方 connector** | Anthropic 官方 | 采样 / loop 库 | Claude Customize 面板 |
| **[fmod-mcp](https://github.com/jmperez127/fmod-mcp)** ⭐ | 社区 MCP（**Claude Code 专用**） | FMOD Studio middleware 集成；35 工具：导入/创建事件/effect 链/sends-returns/parameters | 见下方多步骤安装 |

**fmod-mcp 安装（多步骤）**：

```bash
# 1. clone 到任意位置
git clone https://github.com/jmperez127/fmod-mcp.git
cd fmod-mcp

# 2. 创建 venv 并 install（Python 3.11+）
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -e .

# 3. 在 fmod-mcp 目录内执行注册（$(pwd) 必须解析为本仓库路径）
claude mcp add fmod -s user -- "$(pwd)/.venv/bin/python" -m fmod_mcp
```

前置：FMOD Studio 2.02+ 必须已安装并打开目标项目；TCP scripting 端口 3663 默认开启。
| Sound Effects Expert skill | 第三方 skill | ElevenLabs Sound Effects API + Meta AudioCraft 生成 SFX | 安装方式见 [mcpmarket 页面](https://mcpmarket.com/tools/skills/sound-effects-expert)（未必开源 / `/plugin install` 兼容性未验证） |

`fmod-mcp` 工具能力（v0.2，35 工具）：
- 发现：`ping` `list_banks` `list_events` `list_buses` `get_event`
- 音频与事件：`import_audio` `create_event` `add_single_sound` `set_event_property` `assign_to_bank/bus`
- Effects：`add_effect` `set_effect_param` `bypass_effect` 等 7 个
- 路由（sends + returns）：`add_return` `add_send` `set_send_level` 等 7 个
- 多音 + 参数：`add_multi_sound` `add_local_parameter` `add_global_parameter`
- 清理：`delete_event` `rename_event` `move_event` 等
- 项目：`save_project` `build_banks` `run_js`（escape hatch）

### 5.4 命名冲突处理

| 项目 | 已存在 | 本轮加入 | 处理 |
|---|---|---|---|
| `audio-director` agent | （无） | Donchitos | 不冲突 |
| `sound-designer` agent | （无） | Donchitos | 不冲突 |

**结论**：本轮无冲突。

---

## 6. 与引擎子层的边界（以 06 unity 为例）

L3 audio 与 L3 引擎子层同级，分工。下表实现栏以 Unity 为例；Godot / Unreal 类比对应 API：

| 维度 | L3 audio（本层） | 引擎子层（Unity 例） |
|---|---|---|
| **运行时 API** | 不管 | `unity:engine-reference/modules/audio.md`（如 AudioSource / AudioListener） |
| **AudioMixer 路由设计** | 设计 group / snapshot 命名约定 | 实现（如 Unity AudioMixer.SetFloat / Snapshot.TransitionTo；Godot AudioBus 类比） |
| **响度归一化** | 决定 LUFS 目标、文件级响度 | 引擎运行时音量曲线（不是资产层关心） |
| **资产 import** | 决定文件格式 / 采样率 | 配置引擎 import settings（force to mono / load type；各引擎不同） |
| **Middleware 集成** | 决定事件命名约定、bank 拆分 | 写 SDK C# 调用（如 FMOD Studio Unity Integration） |
| **VO** | 录音规格、loudness、命名 | 引擎播放 / dialogue system 实现 |

工作流：audio 设计资产 + middleware 项目 → 引擎子层集成代码。

---

## 7. 与 07 art 的边界

明确不交叉，但有协作场景：

| 场景 | 主导层 | 协作 |
|---|---|---|
| Trailer / cinematic 视觉 | 07 art | audio 提供配乐 / 音效 |
| Trailer / cinematic 配音 | **08 audio** | art 跟进字幕设计 |
| UI 反馈音 | 08 audio | art 提供视觉反馈样式 |
| Particle VFX 配音（魔法 / 击中） | 08 audio | art 提供 VFX 时间表 |
| BGM 风格基调 | 08 audio | art-bible 中标注音乐风格描述 |

**默认归属**：以听觉资产为主的归 audio；视觉为主的归 art。混合时双方各自负责自己的层。

---

## 8. 决策点（消费者填 CLAUDE.md.template 时定）

| 项 | 选择 | 影响 |
|---|---|---|
| **采样率** | 44.1kHz / 48kHz / 22kHz | 文件大小 vs 质量 vs 引擎默认 |
| **比特深度** | 16-bit / 24-bit / 32-bit float | 同上 |
| **主格式** | `.wav` 无损 / `.ogg` Vorbis / `.mp3` / `.flac` | 跨平台、引擎支持、压缩比 |
| **响度目标** | -23 LUFS（游戏 / 广播） / -16 LUFS（流媒体）/ -18 LUFS（移动） | 一致性、平台规范 |
| **True Peak 上限** | -1 dBTP / -3 dBTP | 防止 codec 过载 |
| **Middleware** | FMOD / Wwise / Unity 内置 / Sound Bakery / Vorpal / 不用 | 复杂度、功能、license、集成成本 |
| **VO 语言** | （列表） | 录音 / 字幕同步、本地化 |
| **音乐风格** | （一段话） | 与 art bible 风格基调对齐 |

---

## 9. 验证流程

### 9.1 dogfood 路径

L3 audio 需要在**真实有音频资产的项目**上验证。当前 `修行计划/中国象棋/` 是 Python AI，无音频；`game_develop/` 空；其他子项目同样无音频。

**dogfood 候选**：
- 修行计划下未来真实游戏项目
- 或新建一个最小有音频 demo（hello-audio）专门验证

**必须验证**：
- `audio-director` 真在被音乐/音色相关查询触发
- `sound-designer` 处理 SFX 设计文档
- 推荐的 fmod-mcp 在装好后真能跑通"导入 SFX → 创建 event → 打 bank"流程

### 9.2 不能出现的回归

- L3 audio 内容溢出到 06 unity（如把 AudioMixer C# API 写进 audio）
- L3 audio 内容溢出到 07 art（如把 trailer 视觉规则写进 audio）
- 假设某 DAW（Ableton / FMOD 等都是推荐，不是必需）

---

## 10. 已知 gap / 后续

### 10.1 待补全
- **`audio-*` skill 候选**（§4.3 列了 8 个）— dogfood 出真实需求后写；优先级最高的是 `audio-naming-conventions` 与 `audio-loudness-lufs`
- **`audio/rules/` path-scoped**（如 `audio-naming.md` for `Assets/Audio/**`）— 写 09 install 时考虑触发机制
- **真音频项目 dogfood** — 同 06 / 07，需新建或等待

### 10.2 待评估
- `team-audio` skill 是否未来加入（多 agent 协作 / polish 流）
- 第三方 skill（Sound Effects Expert / Sound Engineer / Game Audio Design）是否有开源版本可借鉴（部分在 mcpmarket / fastmcp.me，未必开源）
- 开源 middleware（[Sound Bakery](https://github.com/james-e-kelly/sound-bakery) / [Second Music System](https://github.com/SolraBizna/second-music-system) / [Vorpal](https://github.com/vorpal-project/vorpal)）作为 FMOD/Wwise 替代是否进推荐——按需
- `agent-memory/` 系统设计推迟到 09——见 05 §9.2

### 10.3 写 09 前需要 ✅ 已实现

- ✅ 09 已写（install design 收尾文档），整合 03–08 部署需求：
  - ✅ path-scoped rules 自动触发机制（09 §6 + `_paths.yaml` 设计）
  - ✅ 多子项目 install 子命令（09 §4）
  - ✅ Donchitos 目录约定 scaffold（09 §5：`design/art/` `production/review-mode.txt` 等）
  - ✅ agent-memory/ 系统启用（09 §7）
  - ✅ Donchitos `.sh` hooks Node.js 重写规格（09 §8：validate-assets / validate-skill-change）
  - 实现 split 为后续工作（v1 / v2 / v3 渐进，09 §11）

---

## 11. 状态

- 2026-05-01：本文 v1 + cc/audio/ Donchitos cherry-pick 完成 + audio/CLAUDE.md.template 起草完成。
- 待办：09（install 设计）— 收尾文档；规则层（04–08）至此全部就位。
