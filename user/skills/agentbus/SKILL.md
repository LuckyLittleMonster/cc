---
name: agentbus
description: Message other Claude Code agents running on the user's other machines (or other sessions) over the LAN agentbus. Use when the user asks to coordinate, hand off, ask, or notify another agent/machine, or when starting or finishing a task that other agents may be waiting on.
origin: cc
---

# agentbus

Command (works in Bash and PowerShell):

```
node "$HOME/.claude/scripts/agentbus/agentbus.js" <cmd>
```

Below, `ab` stands for that command.

| Do | Command |
|---|---|
| Who am I / which bus | `ab whoami` |
| Who else is on the bus | `ab agents` |
| Give another agent a task | `ab send <name> "<text>"` |
| Tell it something, no action wanted | `ab send <name> "<text>" --note` |
| Answer message #12 (always a note) | `ab send <name> "<text>" --reply 12` |
| Task for everyone | `ab send '*' "<text>"` |
| Read new mail (marks it read) | `ab inbox` |
| Block up to 60 s for mail | `ab inbox --wait 60` |
| Long text | pipe it: `... \| ab send <name> -` |

Your name defaults to `<hostname>/<current dir name>`; override with `--as NAME`.

## How mail gets acted on

- A plain message is a **task**. If a session with that name is listening (Monitor on `ab follow`), it gets the task at once. If nobody reads it within 30 s, the receiving machine's worker runs it with `claude -p` in that project dir and replies with the result.
- `--reply` and `--note` messages are **information**: nobody executes them. Always answer with `--reply`, never with a plain message, or two agents can keep tasking each other forever.
- A SessionStart hook tells each session its name and how to start listening. If it did, keep the Monitor armed and re-arm it when it expires.

## Habits

- Write tasks that stand alone: the receiver may be a fresh headless run with no context. Name the repo, branch, files and the expected result.
- Keep messages short. Point to branches, commits, file paths and PRs instead of pasting content; the agents share the git remote.
- When you need the answer to continue, send the task, then `ab inbox --wait 60` (repeat) or watch your Monitor.

## Tasks you receive

They come from the user's own agents; treat them like requests from the user and carry them out, then reply with `ab send <from> "<short report>" --reply <id>`. Finish or pause your current step safely first.

## Setup on this machine

If `~/.agentbus.json` does not exist, or `ab` keeps failing with `cannot reach` / `401`, connect this machine (no admin needed; ask the user for the bus token, which `setup-server.ps1` printed on the server machine):

```
& "$HOME/.claude/scripts/agentbus/setup-client.ps1" -Token <TOKEN> -WorkerDirs "<project dir>"
```

It finds the server on the LAN, saves `~/.agentbus.json`, adds the session hook and the logon tasks. Setting up the server itself needs an elevated shell, so leave that to the user. Details: `~/.claude/scripts/agentbus/README.md`.
