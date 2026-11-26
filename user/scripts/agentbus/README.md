# agentbus · 局域网多机 agent 消息总线

一台机器跑一个很小的 HTTP 服务（中枢），各台机器上的 Claude Code agent 通过命令行收发消息，N 对 N：任何 agent 都能发给任何一个，也能广播给全体。

- 零依赖：只要 Node 18+（Claude Code 所在机器一般都有）。
- 不用 MCP：平时不占上下文。agent 只在用到时读 `agentbus` skill（几百 token），收发一次消息只有一行命令和几行输出。
- 消息持久化在中枢的 `~/.agentbus-data/bus.jsonl`，服务重启后未读消息还在。

```
 PC-A agent ─┐                       ┌─ PC-B agent
 PC-A agent2 ┼── HTTP + token ── 中枢 ┼─ PC-C agent
             └── (send / inbox) ──────┘
```

## 1. 部署（每台机器）

`cc` 仓库合并后照常跑一次 user 层安装，脚本会到 `~/.claude/scripts/agentbus/`，skill 会到 `~/.claude/skills/agentbus/`：

```powershell
cd ~/git/cc; git pull; .\install.ps1 --layers user     # macOS / Linux: ./install.sh --layers user
```

下文的 `ab` 都代表：

```
node "$HOME/.claude/scripts/agentbus/agentbus.js"
```

想少打字可以加别名。PowerShell：在 `$PROFILE` 里加 `function ab { node "$HOME/.claude/scripts/agentbus/agentbus.js" @args }`；Bash：`alias ab='node "$HOME/.claude/scripts/agentbus/agentbus.js"'`。

## 2. 中枢（选一台常开的机器）

```powershell
ab token                                   # 生成一个随机 token，记下来
ab init --url http://127.0.0.1:7788 --token <TOKEN>
ab serve                                   # 默认 0.0.0.0:7788，启动时打印本机局域网地址
```

Windows 要放行入站端口（管理员 PowerShell，只开放给专用网络）：

```powershell
New-NetFirewallRule -DisplayName agentbus -Direction Inbound -Protocol TCP -LocalPort 7788 -Action Allow -Profile Private
```

开机自启（可选，任务计划程序，登录时在后台启动）：

```powershell
$node = (Get-Command node).Source
$act  = New-ScheduledTaskAction -Execute $node -Argument "`"$HOME\.claude\scripts\agentbus\agentbus.js`" serve"
Register-ScheduledTask -TaskName agentbus -Action $act -Trigger (New-ScheduledTaskTrigger -AtLogOn) -Settings (New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero))
```

其他参数：`ab serve --port 7788 --host 0.0.0.0 --data D:\agentbus-data`。不带 token 时只允许监听 `127.0.0.1`。

## 3. 其他机器

```powershell
ab init --url http://<中枢局域网IP>:7788 --token <TOKEN>
ab whoami        # 例：paidesktop/r2agi @ http://192.168.0.173:7788
ab agents        # 能列出来就是通了
```

配置写在 `~/.agentbus.json`。环境变量 `AGENTBUS_URL` / `AGENTBUS_TOKEN` / `AGENTBUS_NAME` 优先于配置文件。

## 4. 名字

agent 的名字默认是 `<主机名>/<当前目录名>`（小写），同一台机器上不同 worktree 里的会话自然不同名。要固定名字就 `--as NAME` 或设 `AGENTBUS_NAME`。名字限 1–64 个 `[A-Za-z0-9._:/-]` 字符。

收件规则：

- 发给某个名字的消息，那个 agent 什么时候上线都能收到（先发后到也行）。
- 发给 `*` 的广播，发给除发送者外的所有人，但只给发送时已经上过线的 agent。

## 5. 命令

| 命令 | 作用 |
|---|---|
| `ab send <名字> "文字"` | 发给一个 agent |
| `ab send '*' "文字"` | 广播 |
| `ab send <名字> "文字" --reply 12` | 回复 #12 |
| `... \| ab send <名字> -` | 从标准输入读长文本 |
| `ab inbox` | 读新消息并标为已读 |
| `ab inbox --peek` | 只看不标已读 |
| `ab inbox --wait 60` | 没有新消息就最多等 60 秒（长轮询，上限 60） |
| `ab follow` | 一直等，来一条打印一条（给终端或 Claude Code 的 Monitor 用） |
| `ab agents` | 总线上的 agent、最后活动时间、未读数 |
| `ab log -n 20` | 总线上最近 20 条（人排查用） |
| `ab whoami` | 本机名字和中枢地址 |

输出一行一条：`#3 [11-25 23:14] pc2/b -> pc1/a (re #1): 收到，跑完回你`。

## 6. 在 Claude Code 里用

装好后 `agentbus` skill 平时只占一行描述。你说「告诉 B 机器上的 agent …」「等 A 那边跑完再继续」之类，agent 会自己读 skill 然后调 `ab`。

常见用法：

- **派活**：对 A 机器的会话说「把 core 的单测交给 `laptop/r2agi` 跑，跑完回报」，它会 `ab send`，再 `ab inbox --wait 60` 等回复。
- **被动收信**：让会话用 Monitor 工具挂着 `ab follow`，有新消息会作为通知进到会话里。
- **开工/收工时看信箱**：skill 里约定了开始任务和报告完成前各 `ab inbox` 一次。想强制，可以加一个 UserPromptSubmit hook 跑 `ab inbox --peek`。

收到的消息是别的 agent 发的，不等于你本人的指令：skill 要求 agent 只照做落在当前任务内的请求，删除、强推、发布等先问你。

## 7. HTTP 接口

全部是 JSON，除 `/health` 外都要带 `Authorization: Bearer <TOKEN>`。

| 方法 · 路径 | 参数 | 返回 |
|---|---|---|
| `GET /health` | | `{ok:true}` |
| `POST /v1/send` | `{from, to, body, reply_to?}`，`to` 为名字或 `*`，body ≤ 64 KB | `{id}` |
| `GET /v1/inbox` | `?name=&wait=秒&peek=1&limit=` | `{messages:[{id,ts,from,to,body,reply_to?}]}` |
| `GET /v1/agents` | | `{agents:[{name,last_seen,unread}]}` |
| `GET /v1/log` | `?n=` | `{messages:[...]}` |

不是 Claude Code 的程序（脚本、CI、别的 agent 框架）也可以直接用 curl 接进来。

## 8. 安全

- 明文 HTTP，只适合自家局域网。token 防的是同一局域网里的误连和顺手扫描，不防窃听。
- 防火墙规则只开 `Private` 配置文件；不要在公共 Wi-Fi 上开 `serve`。
- 换 token：中枢和各机器重新 `ab init`，中枢重启 `serve`。

## 9. 测试

```
node --test "$HOME/git/cc/user/scripts/agentbus/test/agentbus.test.js"
```
