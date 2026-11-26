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

拉取 `cc` 仓库后跑一次 user 层安装，脚本会到 `~/.claude/scripts/agentbus/`，skill 会到 `~/.claude/skills/agentbus/`：

```powershell
cd ~/git/cc; git pull
'y' | node scripts/install/install.js --layers user    # Bash: echo y | node scripts/install/install.js --layers user
```

安装器会问「继续部署？(y/N)」。agent 的 shell 没有交互输入，问了读不到就当 N 静默退出，`install.ps1` 外壳也不会把管道转给 node，所以直接对 node 喂 `y`。你自己在终端里装可以照常 `.\install.ps1 --layers user` 再按 y。

安装器默认跳过已存在的文件。以后 agentbus 有更新时，已部署过的文件不会被覆盖，要用新版就把 `user/scripts/agentbus/` 和 `user/skills/agentbus/` 拷到 `~/.claude/` 下对应位置（`--force` 会覆盖整个 user 层，慎用）。

装完 `Test-Path "$HOME/.claude/scripts/agentbus/agentbus.js"` 应为 True。

下文的 `ab` 都代表：

```
node "$HOME/.claude/scripts/agentbus/agentbus.js"
```

想少打字可以加别名。PowerShell：在 `$PROFILE` 里加 `function ab { node "$HOME/.claude/scripts/agentbus/agentbus.js" @args }`；Bash：`alias ab='node "$HOME/.claude/scripts/agentbus/agentbus.js"'`。

## 2. 中枢（选一台常开的机器，Windows）

在**管理员** PowerShell 里跑一次：

```powershell
& "$HOME/.claude/scripts/agentbus/setup-server.ps1"
```

它会：

- 生成 token（已有 `~/.agentbus.json` 里的 token 就沿用，重跑不会让客户端失效），写进 `~/.agentbus.json`；
- 加两条防火墙入站规则（`agentbus TCP 7788`、`agentbus UDP 7788`），只放行同网段（`LocalSubnet`）的 node.exe，与网络是「公用」还是「专用」无关；如果发现有拦截 node.exe 的旧规则会提醒；
- 注册计划任务 `agentbus-server`：每次登录时用 `conhost --headless` 在后台起服务，不弹窗口；
- 立即启动，检查 HTTP 和 UDP 发现都能应答；
- 最后打印局域网地址、日志位置（`~/.agentbus-data/server.log`）、token，以及客户端要跑的那行命令。

参数：`-Port 7788`、`-DataDir <目录>`、`-Uninstall`（删任务、防火墙规则并停服务，保留数据和配置）。

服务只在这个用户登录后运行；中枢机器需要保持登录（锁屏没关系）。

## 3. 其他机器（由各机器上的 agent 执行）

把服务端打印的 token 交给那台机器上的 agent，让它跑（不需要管理员）：

```powershell
& "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Token <TOKEN>
```

它会：

- 在局域网里广播找中枢，最多等 30 秒（`-WaitSec` 可调）。中枢要用 token 对随机数签名回复，签名不对的一律不认，所以不会连到别人的或伪造的总线；token 本身不在网络上传；
- 把找到的地址和 token 写进 `~/.agentbus.json`；
- 注册计划任务 `agentbus-client`：每次登录时在后台重新发现中枢（最多等 5 分钟网络就绪），中枢换了 IP 也能自动更新，日志在 `~/.agentbus-client.log`；
- 跑一次 `ab agents` 确认能通。

另外，平时任何 `ab` 命令连不上保存的地址时，都会先自动重新发现一次再重试。

参数：`-Port 7788`、`-WaitSec 30`、`-Uninstall`。

不想用脚本时也可以手动：`ab discover --token <TOKEN>`（自动发现并保存），或 `ab init --url http://<IP>:7788 --token <TOKEN>`（手写地址）。macOS / Linux 没有安装脚本，用 `ab discover --token <TOKEN>` 连接，开机任务自己用 launchd / systemd 跑 `ab discover --wait 300`。

配置在 `~/.agentbus.json`。环境变量 `AGENTBUS_URL` / `AGENTBUS_TOKEN` / `AGENTBUS_NAME` / `AGENTBUS_CONFIG` 优先于配置文件；设了 `AGENTBUS_URL` 时不会自动改地址。

### 发现协议

客户端向 UDP 7788 发 `{"agentbus":"discover","nonce":"<随机 hex>"}`，同时发到 `255.255.255.255`、每块网卡的子网广播地址和 `127.0.0.1`。中枢回 `{"agentbus":"here","port":7788,"proof":HMAC-SHA256(token, nonce)}`，客户端校验 proof 后用回包的来源 IP 拼出地址。中枢必须和客户端在同一子网（广播不过路由器）。

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

- 明文 HTTP，只适合自家局域网。token 防的是同一局域网里的误连和顺手扫描，不防窃听；所有机器共用一个 token，拿到 token 的人能冒用任何名字发信。
- 防火墙规则只放行同网段；中枢不要放在公共 Wi-Fi 上（同网段的陌生人也算 LocalSubnet，只剩 token 挡着）。
- 发现协议只证明「对方知道 token」，不会把 token 发出去。
- 换 token：中枢上 `ab init --url http://127.0.0.1:7788 --token $(ab token)`，再跑一次 `setup-server.ps1`（它沿用配置里的 token）；各机器用新 token 重跑 `setup-client.ps1`。

## 9. 测试

```
node --test "$HOME/git/cc/user/scripts/agentbus/test/agentbus.test.js" "$HOME/git/cc/user/scripts/agentbus/test/discovery.test.js"
```
