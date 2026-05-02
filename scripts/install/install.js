#!/usr/bin/env node
/**
 * cc-install · 一键部署 cc/ 各层到目标系统
 *
 * 用法见 scripts/install/README.md 与 docs/09-install-design.md
 *
 * 设计原则：
 * - 纯 Node.js 内置（无 npm 依赖）
 * - 跨平台（Windows / macOS / Linux）
 * - 幂等（安全重跑）
 * - dry-run 友好（默认显示将做什么）
 * - 失败安全（原子层级回滚）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { parseArgs } = require('util');

// ─────────────────────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HOME = os.homedir();
const CLAUDE_HOME = path.join(HOME, '.claude');
const STATE_FILENAME = 'cc-install-state.json';

const LAYER_ALIASES = {
  user: 'L1 user (~/.claude/)',
  project: 'L2 project (<target>/.claude/)',
  unity: 'L3 unity (<target>/.claude/)',
  art: 'L3 art (<target>/.claude/)',
  audio: 'L3 audio (<target>/.claude/)',
};

// L1 user 顶层文件（直接 cp 到 ~/.claude/）
const USER_TOPLEVEL_FILES = ['CLAUDE.md', 'statusline.json'];
// L1 user 子目录（递归 cp 到 ~/.claude/<name>/）
const USER_SUBDIRS = ['rules', 'hooks', 'contexts', 'agents', 'skills', 'commands', 'scripts'];

// L2 project 顶层文件（部署时改名 / 替换占位符）
const PROJECT_TEMPLATE = 'CLAUDE.md.template';
// L2 project 子目录（cp 到 <target>/.claude/<name>/）
const PROJECT_SUBDIRS = ['agents', 'skills', 'commands', 'rules', 'docs'];

// L3 通用：CLAUDE.md.template → <target>/CLAUDE.md，其他子目录到 <target>/.claude/
const L3_TEMPLATE = 'CLAUDE.md.template';
const L3_SUBDIRS = ['agents', 'skills', 'commands', 'rules', 'docs'];

// 安装状态文件（追踪已部署层）
const STATE_USER = path.join(CLAUDE_HOME, STATE_FILENAME);

// 占位符正则（匹配 [xxx] 但不匹配 markdown 链接 [text](url)）
const PLACEHOLDER_RE = /\[([^\[\]]+?)\](?!\()/g;

// ─────────────────────────────────────────────────────────────
// 颜色输出（无依赖）
// ─────────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY;
const c = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  red: isTTY ? '\x1b[31m' : '',
  green: isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  blue: isTTY ? '\x1b[34m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
};

function log(level, ...args) {
  const tag = {
    info:  `${c.cyan}[info]${c.reset}`,
    ok:    `${c.green}[ ok ]${c.reset}`,
    warn:  `${c.yellow}[warn]${c.reset}`,
    err:   `${c.red}[err ]${c.reset}`,
    step:  `${c.blue}[ → ]${c.reset}`,
    plan:  `${c.dim}[plan]${c.reset}`,
  }[level] || `[${level}]`;
  console.log(tag, ...args);
}

// ─────────────────────────────────────────────────────────────
// CLI 解析
// ─────────────────────────────────────────────────────────────

function parseCliArgs() {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        layers:    { type: 'string' },
        check:     { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        force:     { type: 'boolean', default: false },
        'no-fill': { type: 'boolean', default: false },
        scaffold:  { type: 'boolean', default: true },  // 默认建 design/ production/ 等
        'no-scaffold': { type: 'boolean', default: false },
        upgrade:   { type: 'boolean', default: false },
        verbose:   { type: 'boolean', short: 'v', default: false },
        help:      { type: 'boolean', short: 'h', default: false },
      },
      allowPositionals: true,
      strict: false,
    });
  } catch (e) {
    log('err', '参数解析失败：', e.message);
    process.exit(2);
  }

  if (parsed.values.help) {
    printHelp();
    process.exit(0);
  }

  const target = parsed.positionals[0]
    ? path.resolve(parsed.positionals[0])
    : null;

  // --layers 解析（CSV）
  let layers = null;
  if (parsed.values.layers) {
    layers = parsed.values.layers.split(',').map(s => s.trim()).filter(Boolean);
    const invalid = layers.filter(l => !(l in LAYER_ALIASES));
    if (invalid.length) {
      log('err', `未知 layer：${invalid.join(', ')}`);
      log('info', `可用：${Object.keys(LAYER_ALIASES).join(', ')}`);
      process.exit(2);
    }
  }

  return {
    target,
    layers,                                                // null = auto-detect
    check: parsed.values.check,
    dryRun: parsed.values['dry-run'],
    force: parsed.values.force,
    noFill: parsed.values['no-fill'],
    scaffold: !parsed.values['no-scaffold'],
    upgrade: parsed.values.upgrade,
    verbose: parsed.values.verbose,
  };
}

function printHelp() {
  console.log(`
${c.bold}cc-install${c.reset} — 部署 cc/ 各层到目标系统

${c.bold}用法${c.reset}
  cc-install [<target-dir>] [选项]

${c.bold}模式${c.reset}
  ${c.dim}# 自动检测模式（推荐）${c.reset}
  cc-install /path/to/game-project
    检查 ~/.claude/ 是否部署 L1 → 否则先装 L1
    检测 target 是否含 Assets/ → 是则装 project + unity + art + audio
    否则只装 project

  ${c.dim}# 检查（不写文件）${c.reset}
  cc-install --check                       仅检查 L1 状态
  cc-install /path/to/game --check         检查目标项目状态

  ${c.dim}# 仅看不做${c.reset}
  cc-install /path/to/game --dry-run

  ${c.dim}# 显式 layer${c.reset}
  cc-install --layers user                 仅装 L1
  cc-install /path/to/game --layers project,unity

${c.bold}选项${c.reset}
  --layers <csv>      显式指定层（user,project,unity,art,audio）
  --check             检查模式（不写）
  --dry-run           演练（不写文件，打印将做什么）
  --force             覆盖已存在文件（默认跳过）
  --no-fill           跳过占位符交互填充（保留 [xxx] 原样）
  --no-scaffold       不创建 design/ production/ 等目录
  --upgrade           升级模式（保留 adapted: yes 文件）
  --verbose, -v       详细日志
  --help, -h          本帮助

${c.bold}示例${c.reset}
  ${c.dim}# 第一次：把 L1 装到 ~/.claude/${c.reset}
  cc-install --layers user

  ${c.dim}# 给单一 Unity 游戏一键装齐${c.reset}
  cc-install /path/to/my-unity-game

  ${c.dim}# 多子项目工作区（per-subproject 部署）${c.reset}
  cc-install /workspace/game-A
  cc-install /workspace/game-B

  ${c.dim}# 演练${c.reset}
  cc-install /workspace/test --dry-run -v
`);
}

// ─────────────────────────────────────────────────────────────
// 文件操作（带 dry-run）
// ─────────────────────────────────────────────────────────────

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function ensureDir(dir, opts) {
  if (dirExists(dir)) return;
  if (opts.dryRun) {
    log('plan', `mkdir -p ${dir}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  if (opts.verbose) log('ok', `mkdir ${dir}`);
}

function copyFile(src, dst, opts) {
  if (!fileExists(src)) {
    log('err', `源文件不存在：${src}`);
    return false;
  }
  const exists = fileExists(dst);
  if (exists && !opts.force && !opts.upgrade) {
    if (opts.verbose) log('info', `跳过已存在：${dst}`);
    return false;
  }
  if (opts.dryRun) {
    log('plan', `cp ${path.relative(REPO_ROOT, src)} → ${dst}${exists ? ' (覆盖)' : ''}`);
    return true;
  }
  ensureDir(path.dirname(dst), opts);
  fs.copyFileSync(src, dst);
  if (opts.verbose || !exists) log('ok', `${exists ? '覆盖' : '写入'} ${dst}`);
  return true;
}

function copyDir(src, dst, opts) {
  if (!dirExists(src)) {
    log('warn', `源目录不存在，跳过：${src}`);
    return { copied: 0, skipped: 0 };
  }
  let copied = 0, skipped = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      const sub = copyDir(s, d, opts);
      copied += sub.copied;
      skipped += sub.skipped;
    } else if (ent.isFile()) {
      const ok = copyFile(s, d, opts);
      if (ok) copied++; else skipped++;
    }
  }
  return { copied, skipped };
}

function writeFile(dst, content, opts) {
  const exists = fileExists(dst);
  if (exists && !opts.force && !opts.upgrade) {
    log('warn', `已存在，跳过：${dst}（用 --force 覆盖）`);
    return false;
  }
  if (opts.dryRun) {
    log('plan', `write ${dst} (${content.length} bytes)${exists ? ' (覆盖)' : ''}`);
    return true;
  }
  ensureDir(path.dirname(dst), opts);
  fs.writeFileSync(dst, content);
  log('ok', `${exists ? '覆盖' : '写入'} ${dst}`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// L1 状态检查
// ─────────────────────────────────────────────────────────────

function checkL1Status() {
  const status = {
    deployed: false,
    claudeMdExists: fileExists(path.join(CLAUDE_HOME, 'CLAUDE.md')),
    rulesCommonCount: 0,
    agentsCount: 0,
    skillsCount: 0,
    commandsCount: 0,
    expected: {
      rulesCommon: 0,
      agents: 0,
      skills: 0,
      commands: 0,
    },
  };
  // count expected (from cc/user/)
  const userDir = path.join(REPO_ROOT, 'user');
  status.expected.rulesCommon = countFiles(path.join(userDir, 'rules', 'common'));
  status.expected.agents      = countFiles(path.join(userDir, 'agents'));
  status.expected.skills      = countDirs(path.join(userDir, 'skills'));
  status.expected.commands    = countFiles(path.join(userDir, 'commands'));
  // count actual (in ~/.claude/)
  status.rulesCommonCount = countFiles(path.join(CLAUDE_HOME, 'rules', 'common'));
  status.agentsCount      = countFiles(path.join(CLAUDE_HOME, 'agents'));
  status.skillsCount      = countDirs(path.join(CLAUDE_HOME, 'skills'));
  status.commandsCount    = countFiles(path.join(CLAUDE_HOME, 'commands'));
  // 判定 deployed: claude.md exists 且 rules/common 至少一半到位
  status.deployed = status.claudeMdExists
    && status.rulesCommonCount >= status.expected.rulesCommon * 0.5;
  return status;
}

function countFiles(dir) {
  if (!dirExists(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile()).length;
}
function countDirs(dir) {
  if (!dirExists(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).length;
}

function printL1Report(status) {
  console.log(`\n${c.bold}L1 user (~/.claude/) 状态${c.reset}`);
  const tick = (a, b) => a >= b ? `${c.green}✓${c.reset}` : `${c.yellow}○${c.reset}`;
  console.log(`  CLAUDE.md:        ${status.claudeMdExists ? c.green + '✓ 存在' : c.yellow + '○ 缺失'}${c.reset}`);
  console.log(`  rules/common/:    ${tick(status.rulesCommonCount, status.expected.rulesCommon)} ${status.rulesCommonCount}/${status.expected.rulesCommon}`);
  console.log(`  agents/:          ${tick(status.agentsCount, status.expected.agents)} ${status.agentsCount}/${status.expected.agents}`);
  console.log(`  skills/:          ${tick(status.skillsCount, status.expected.skills)} ${status.skillsCount}/${status.expected.skills}`);
  console.log(`  commands/:        ${tick(status.commandsCount, status.expected.commands)} ${status.commandsCount}/${status.expected.commands}（含 plugin 自带）`);
  console.log(`  ${c.bold}判定：${status.deployed ? c.green + 'L1 已部署' : c.yellow + 'L1 未部署或不完整'}${c.reset}\n`);
}

function checkProjectStatus(target) {
  const claudeDir = path.join(target, '.claude');
  return {
    targetExists: dirExists(target),
    claudeMdExists: fileExists(path.join(target, 'CLAUDE.md')),
    claudeDirExists: dirExists(claudeDir),
    isUnityProject: dirExists(path.join(target, 'Assets')),
    hasArtAssets: dirExists(path.join(target, 'Assets', 'Art')),
    hasAudioAssets: dirExists(path.join(target, 'Assets', 'Audio')),
    hasDesignDir: dirExists(path.join(target, 'design')),
    hasProductionDir: dirExists(path.join(target, 'production')),
  };
}

function printProjectReport(target, status) {
  console.log(`\n${c.bold}目标项目状态：${target}${c.reset}`);
  if (!status.targetExists) {
    console.log(`  ${c.red}✗${c.reset} 目录不存在`);
    return;
  }
  const tick = (b) => b ? `${c.green}✓${c.reset}` : `${c.dim}–${c.reset}`;
  console.log(`  CLAUDE.md:        ${tick(status.claudeMdExists)}`);
  console.log(`  .claude/:         ${tick(status.claudeDirExists)}`);
  console.log(`  Assets/ (Unity):  ${tick(status.isUnityProject)}`);
  console.log(`  Assets/Art:       ${tick(status.hasArtAssets)}`);
  console.log(`  Assets/Audio:     ${tick(status.hasAudioAssets)}`);
  console.log(`  design/:          ${tick(status.hasDesignDir)}`);
  console.log(`  production/:      ${tick(status.hasProductionDir)}\n`);
}

// ─────────────────────────────────────────────────────────────
// 占位符填充
// ─────────────────────────────────────────────────────────────

async function fillPlaceholders(content, opts) {
  if (opts.noFill) {
    log('info', '已设 --no-fill，保留占位符原样');
    return content;
  }

  const placeholders = new Set();
  let m;
  PLACEHOLDER_RE.lastIndex = 0;
  while ((m = PLACEHOLDER_RE.exec(content)) !== null) {
    const placeholder = m[1];
    if (placeholder.length < 80 && !placeholder.includes('\n')) {
      placeholders.add(placeholder);
    }
  }
  if (placeholders.size === 0) return content;

  console.log(`\n${c.bold}发现 ${placeholders.size} 个占位符待填${c.reset}（回车跳过保留原样）`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));

  const replacements = new Map();
  for (const p of placeholders) {
    const ans = (await ask(`  ${c.cyan}[${p}]${c.reset} → `)).trim();
    if (ans) replacements.set(p, ans);
  }
  rl.close();

  let result = content;
  for (const [k, v] of replacements) {
    const re = new RegExp(`\\[${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\](?!\\()`, 'g');
    result = result.replace(re, v);
  }
  console.log();
  return result;
}

// ─────────────────────────────────────────────────────────────
// 自动检测
// ─────────────────────────────────────────────────────────────

function autoDetectLayers(target, l1Status, projStatus) {
  const layers = [];
  // L1
  if (!l1Status.deployed) {
    layers.push('user');
  }
  // Target-based
  if (target) {
    layers.push('project');
    if (projStatus.isUnityProject) {
      layers.push('unity');
      // art / audio: 默认装（即使 Assets/Art 还不存在，也提供配置）
      layers.push('art', 'audio');
    }
  }
  return layers;
}

// ─────────────────────────────────────────────────────────────
// Donchitos 目录 scaffolding
// ─────────────────────────────────────────────────────────────

function scaffoldGameProject(target, opts) {
  log('step', 'Scaffold Donchitos 目录约定');
  const dirs = [
    'design/gdd',
    'design/art',
    'design/narrative',
    'production/sprints',
    'production/milestones',
    'production/playtest-reports',
    'prototypes',
    'tests',
  ];
  for (const d of dirs) {
    ensureDir(path.join(target, d), opts);
    const gitkeep = path.join(target, d, '.gitkeep');
    if (!fileExists(gitkeep) && !opts.dryRun) {
      fs.writeFileSync(gitkeep, '');
    }
  }
  // review-mode.txt（默认 lean）
  const reviewMode = path.join(target, 'production', 'review-mode.txt');
  if (!fileExists(reviewMode)) {
    if (opts.dryRun) {
      log('plan', `write ${reviewMode} ("lean")`);
    } else {
      fs.writeFileSync(reviewMode, 'lean\n');
      if (opts.verbose) log('ok', `write ${reviewMode}`);
    }
  }
  // agent-memory/（空骨架）
  ensureDir(path.join(target, '.claude', 'agent-memory'), opts);
}

// ─────────────────────────────────────────────────────────────
// 各 layer 部署器
// ─────────────────────────────────────────────────────────────

async function deployUser(opts) {
  log('step', '部署 L1 user → ~/.claude/');
  const src = path.join(REPO_ROOT, 'user');
  if (!dirExists(src)) {
    log('err', `cc/user/ 不存在：${src}`);
    return false;
  }

  let totalCopied = 0, totalSkipped = 0;
  // 顶层文件
  for (const f of USER_TOPLEVEL_FILES) {
    const ok = copyFile(path.join(src, f), path.join(CLAUDE_HOME, f), opts);
    if (ok) totalCopied++; else totalSkipped++;
  }
  // 子目录
  for (const d of USER_SUBDIRS) {
    const r = copyDir(path.join(src, d), path.join(CLAUDE_HOME, d), opts);
    totalCopied += r.copied; totalSkipped += r.skipped;
  }
  log('ok', `L1 user：${totalCopied} 个文件部署，${totalSkipped} 个跳过`);
  return true;
}

async function deployProject(target, opts) {
  log('step', `部署 L2 project → ${target}/`);
  const src = path.join(REPO_ROOT, 'project');
  if (!dirExists(src)) {
    log('err', `cc/project/ 不存在：${src}`);
    return false;
  }

  // 1. CLAUDE.md.template → <target>/CLAUDE.md（替换占位符）
  const tplPath = path.join(src, PROJECT_TEMPLATE);
  if (fileExists(tplPath)) {
    let content = fs.readFileSync(tplPath, 'utf8');
    content = await fillPlaceholders(content, opts);
    writeFile(path.join(target, 'CLAUDE.md'), content, opts);
  } else {
    log('warn', `${PROJECT_TEMPLATE} 不存在，跳过`);
  }

  // 2. 子目录 → <target>/.claude/
  let totalCopied = 0, totalSkipped = 0;
  const claudeDir = path.join(target, '.claude');
  for (const d of PROJECT_SUBDIRS) {
    const r = copyDir(path.join(src, d), path.join(claudeDir, d), opts);
    totalCopied += r.copied; totalSkipped += r.skipped;
  }
  log('ok', `L2 project：${totalCopied} 个文件部署，${totalSkipped} 个跳过`);

  // 3. scaffold（如启用）
  if (opts.scaffold) {
    scaffoldGameProject(target, opts);
  }
  return true;
}

async function deploySubLayer(layer, target, opts) {
  log('step', `部署 L3 ${layer} → ${target}/`);
  const src = path.join(REPO_ROOT, layer);
  if (!dirExists(src)) {
    log('err', `cc/${layer}/ 不存在：${src}`);
    return false;
  }

  // 选择子目录布局：unity → Assets/Scripts；art → Assets/Art；audio → Assets/Audio
  // 若 target 是 Unity 项目（含 Assets/）则用 Assets/<X>/.claude；否则用 <target>/.claude/<layer>/
  const isUnityRoot = dirExists(path.join(target, 'Assets'));
  const subdir = layer === 'unity' && isUnityRoot ? 'Assets/Scripts'
               : layer === 'art'   && isUnityRoot ? 'Assets/Art'
               : layer === 'audio' && isUnityRoot ? 'Assets/Audio'
               : `.claude-${layer}`;  // 非 Unity 项目 fallback

  const layerRoot = path.join(target, subdir);

  // 1. CLAUDE.md.template → <layerRoot>/CLAUDE.md
  const tplPath = path.join(src, L3_TEMPLATE);
  if (fileExists(tplPath)) {
    let content = fs.readFileSync(tplPath, 'utf8');
    content = await fillPlaceholders(content, opts);
    writeFile(path.join(layerRoot, 'CLAUDE.md'), content, opts);
  } else {
    log('warn', `${layer}/${L3_TEMPLATE} 不存在`);
  }

  // 2. 子目录 → <layerRoot>/.claude/
  let totalCopied = 0, totalSkipped = 0;
  const claudeDir = path.join(layerRoot, '.claude');
  for (const d of L3_SUBDIRS) {
    const r = copyDir(path.join(src, d), path.join(claudeDir, d), opts);
    totalCopied += r.copied; totalSkipped += r.skipped;
  }
  log('ok', `L3 ${layer}：${totalCopied} 个文件部署，${totalSkipped} 个跳过`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// 状态文件（追溯已部署内容）
// ─────────────────────────────────────────────────────────────

function readState(stateFile) {
  if (!fileExists(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (e) {
    log('warn', `读取 state 失败：${stateFile}`);
    return null;
  }
}

function writeState(stateFile, data, opts) {
  if (opts.dryRun) {
    log('plan', `write state ${stateFile}`);
    return;
  }
  ensureDir(path.dirname(stateFile), opts);
  fs.writeFileSync(stateFile, JSON.stringify(data, null, 2));
  if (opts.verbose) log('ok', `state 已更新：${stateFile}`);
}

function recordInstall(layer, target, opts) {
  const stateFile = layer === 'user'
    ? STATE_USER
    : path.join(target, '.claude', STATE_FILENAME);

  const state = readState(stateFile) || { installs: [] };
  state.installs.push({
    layer,
    timestamp: new Date().toISOString(),
    repo_sha: getRepoSha(),
    options: { force: opts.force, upgrade: opts.upgrade },
  });
  writeState(stateFile, state, opts);
}

function getRepoSha() {
  try {
    const headFile = path.join(REPO_ROOT, '.git', 'HEAD');
    if (!fileExists(headFile)) return 'unknown';
    const head = fs.readFileSync(headFile, 'utf8').trim();
    if (head.startsWith('ref: ')) {
      const refPath = path.join(REPO_ROOT, '.git', head.slice(5));
      if (fileExists(refPath)) {
        return fs.readFileSync(refPath, 'utf8').trim().slice(0, 7);
      }
    }
    return head.slice(0, 7);
  } catch { return 'unknown'; }
}

// ─────────────────────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────────────────────

async function main() {
  const opts = parseCliArgs();

  // banner
  console.log(`\n${c.bold}cc-install${c.reset} ${c.dim}@ ${getRepoSha()}${c.reset}`);
  if (opts.dryRun) console.log(`${c.yellow}── DRY-RUN 模式：不会写入任何文件 ──${c.reset}`);
  if (opts.force) console.log(`${c.yellow}── FORCE 模式：覆盖已存在文件 ──${c.reset}`);

  // L1 检查（始终运行）
  const l1Status = checkL1Status();

  // Target-based 检查
  let projStatus = null;
  if (opts.target) {
    projStatus = checkProjectStatus(opts.target);
  }

  // ── 仅 check 模式 ──
  if (opts.check) {
    printL1Report(l1Status);
    if (projStatus) printProjectReport(opts.target, projStatus);
    if (l1Status.deployed) {
      const last = readState(STATE_USER);
      if (last && last.installs.length > 0) {
        const newest = last.installs[last.installs.length - 1];
        console.log(`${c.dim}最近 install：${newest.timestamp} @ ${newest.repo_sha}${c.reset}\n`);
      }
    }
    process.exit(0);
  }

  // ── 决定要部署的层 ──
  let layers = opts.layers;
  if (!layers) {
    if (!opts.target && l1Status.deployed) {
      log('info', '已无 target 且 L1 已部署，无事可做。用 --layers / --check / --help。');
      process.exit(0);
    }
    layers = autoDetectLayers(opts.target, l1Status, projStatus);
    if (layers.length === 0) {
      log('info', '自动检测：无需部署。');
      process.exit(0);
    }
    log('info', `自动检测部署层：${layers.join(', ')}`);
  } else {
    log('info', `显式部署层：${layers.join(', ')}`);
  }

  // ── 必需 target 校验 ──
  const needsTarget = layers.some(l => l !== 'user');
  if (needsTarget && !opts.target) {
    log('err', '部署 project / unity / art / audio 需要指定 target 目录');
    log('info', '示例：cc-install /path/to/game --layers project');
    process.exit(2);
  }
  if (opts.target && !dirExists(opts.target)) {
    if (opts.dryRun) {
      log('plan', `mkdir -p ${opts.target} (target 不存在)`);
    } else {
      log('warn', `target 不存在，将创建：${opts.target}`);
      ensureDir(opts.target, opts);
    }
  }

  // ── 报告 + 确认 ──
  printL1Report(l1Status);
  if (projStatus) printProjectReport(opts.target, projStatus);

  if (!opts.dryRun && !process.env.CC_INSTALL_NO_CONFIRM) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await new Promise(r => rl.question(`${c.bold}继续部署 [${layers.join(', ')}]？(y/N) ${c.reset}`, r));
    rl.close();
    if (!/^y(es)?$/i.test(ans.trim())) {
      log('info', '已取消。');
      process.exit(0);
    }
  }

  // ── 执行部署 ──
  console.log();
  for (const layer of layers) {
    let ok = false;
    if (layer === 'user')         ok = await deployUser(opts);
    else if (layer === 'project') ok = await deployProject(opts.target, opts);
    else                          ok = await deploySubLayer(layer, opts.target, opts);

    if (ok && !opts.dryRun) {
      recordInstall(layer, opts.target, opts);
    } else if (!ok) {
      log('err', `部署 ${layer} 失败，中止后续。`);
      process.exit(3);
    }
  }

  // ── 总结 ──
  console.log();
  log('ok', `${c.bold}部署完成${c.reset}：${layers.length} 层 (${layers.join(', ')})`);

  if (opts.dryRun) {
    log('info', `这是 dry-run。去掉 --dry-run 后真实执行。`);
  } else {
    if (layers.includes('user')) {
      console.log(`  ${c.dim}→ 重启 Claude Code 让 ~/.claude/ 新内容生效${c.reset}`);
    }
    if (opts.target) {
      console.log(`  ${c.dim}→ 进入 ${opts.target} 后启动 Claude Code 体验${c.reset}`);
    }
  }
  console.log();
}

main().catch(e => {
  log('err', '出错：', e.message);
  if (process.env.DEBUG) console.error(e.stack);
  process.exit(1);
});
