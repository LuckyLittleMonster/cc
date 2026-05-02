#!/usr/bin/env bash
# cc-install (Bash 壳)
# 调用 scripts/install/install.js
# 用法见 scripts/install/README.md 或 ./install.sh --help

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_JS="$SCRIPT_DIR/scripts/install/install.js"

if ! command -v node >/dev/null 2>&1; then
  echo "错误：未找到 node。请安装 Node.js >= 18。" >&2
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "错误：Node $(node -v) 太旧。需要 Node.js >= 18（util.parseArgs）。" >&2
  exit 1
fi

exec node "$INSTALL_JS" "$@"
