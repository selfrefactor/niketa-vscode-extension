#!/usr/bin/env node
/**
 * Standalone dispatcher mirroring the VS Code "Run Niketa scripts" tool,
 * intended to be called from a Zed Task (so it can be bound to a key,
 * e.g. alt-w/ctrl+1, which a Zed extension cannot do on its own).
 *
 * Usage (from the project root):
 *   node niketa-run.js run  <path>   # run the matching niketaScripts command
 *   node niketa-run.js lint <path>   # run `run fmt <path>`
 *   node niketa-run.js status        # print the active niketaScripts config
 *
 * `<path>` is relative to the project root.
 */
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const CWD = process.cwd()
const LINT_COMMANDS = ['yarn lint:files', 'yarn lint:file']

const [, , subcommand, file] = process.argv

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function loadConfig() {
  const config = { scripts: [], named: [], active: null, legacy: [] }
  const packagePath = path.join(CWD, 'package.json')
  if (!fs.existsSync(packagePath)) return config

  const packageJson = readJson(packagePath)
  const niketa = packageJson.niketaScripts

  if (niketa && typeof niketa === 'object') {
    const isNamed =
      niketa.scripts && typeof niketa.scripts === 'object' && niketa.active !== undefined
    if (isNamed) {
      config.named = Object.keys(niketa.scripts)
      config.active = niketa.active
      const set = niketa.scripts[niketa.active]
      if (set && typeof set === 'object') {
        config.scripts = collectStringMap(set)
      }
    } else {
      config.scripts = collectStringMap(niketa)
    }
  }

  if (packageJson.niketaScriptsLegacy && typeof packageJson.niketaScriptsLegacy === 'object') {
    config.legacy = collectStringMap(packageJson.niketaScriptsLegacy)
  }

  return config
}

function collectStringMap(obj) {
  return Object.entries(obj)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => [key, value])
}

// minimatch subset: `**`, `*`, `?`, literals
function globMatch(pattern, relPath) {
  const pat = pattern.split('/')
  const segs = relPath.split('/')
  const matchSegments = (p, s) => {
    if (p.length === 0) return s.length === 0
    if (p[0] === '**') {
      for (let skip = 0; skip <= s.length; skip++) {
        if (matchSegments(p.slice(1), s.slice(skip))) return true
      }
      return false
    }
    if (s.length === 0 || !matchSegment(p[0], s[0])) return false
    return matchSegments(p.slice(1), s.slice(1))
  }
  return matchSegments(pat, segs)
}

function matchSegment(pattern, segment) {
  const matchChars = (p, s) => {
    if (p.length === 0) return s.length === 0
    if (p[0] === '*') {
      for (let i = 0; i <= s.length; i++) {
        if (matchChars(p.slice(1), s.slice(i))) return true
      }
      return false
    }
    if (p[0] === '?') return s.length > 0 && matchChars(p.slice(1), s.slice(1))
    return s.length > 0 && s[0] === p[0] && matchChars(p.slice(1), s.slice(1))
  }
  return matchChars([...pattern], [...segment])
}

// VS Code behavior: run against the `.spec.` sibling when it exists.
function resolveSpecPath(rel) {
  if (rel.includes('.spec.')) return rel
  const dot = rel.lastIndexOf('.')
  if (dot === -1) return rel
  const spec = `${rel.slice(0, dot)}.spec.${rel.slice(dot + 1)}`
  return fs.existsSync(path.join(CWD, spec)) ? spec : rel
}

function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function runCommand(command, filePath, useShell) {
  if (useShell) {
    return spawnSync(command, [], { cwd: CWD, shell: true, stdio: 'inherit' })
  }
  return spawnSync(command, filePath ? [filePath] : [], { cwd: CWD, stdio: 'inherit' })
}

function execCommand(command, filePath) {
  // Sends the same command a VS Code terminal would receive.
  const full = `${command} ${shellQuote(filePath)}`
  console.log(`$ ${full}`)
  return spawnSync('sh', ['-lc', full], { cwd: CWD, stdio: 'inherit' })
}

function run() {
  if (!file) {
    console.error('usage: niketa-run.js <run|lint|status> [path]')
    process.exit(2)
  }
  const rel = file
  const config = loadConfig()

  if (config.legacy.length > 0) {
    const entry = config.legacy.find(([entryPath]) => entryPath === rel)
    if (entry) {
      const [command, ...rest] = entry[1].split(' ')
      spawnSync(command, rest, { cwd: CWD, stdio: 'inherit' })
      return
    }
    console.error(`niketa: no legacy entry for \`${rel}\``)
    process.exit(1)
  }

  if (config.scripts.length === 0) {
    doLint(rel)
    return
  }

  if (config.scripts.length === 1 && config.scripts[0][0] === '*') {
    execCommand(config.scripts[0][1], rel)
    return
  }

  const found = config.scripts.find(([pattern]) => globMatch(pattern, rel))
  if (!found) {
    console.error(`niketa: no script matches \`${rel}\``)
    process.exit(1)
  }

  const command = found[1]
  const isLint = LINT_COMMANDS.includes(command)
  const target = isLint ? rel : resolveSpecPath(rel)
  execCommand(command, target)
}

function doLint(rel) {
  const full = `run fmt ${shellQuote(rel)}`
  console.log(`$ ${full}`)
  spawnSync('sh', ['-lc', full], { cwd: CWD, stdio: 'inherit' })
}

function status() {
  const config = loadConfig()
  const lines = []
  if (config.named.length > 0) {
    lines.push(`script sets : ${config.named.join(', ')}`)
    lines.push(`active      : ${config.active ?? 'none'}`)
  }
  lines.push(`glob commands: ${config.scripts.length}`)
  for (const [pattern, command] of config.scripts) lines.push(`  ${pattern} -> ${command}`)
  if (config.legacy.length > 0) {
    lines.push(`legacy      : ${config.legacy.length}`)
    for (const [entryPath, command] of config.legacy) lines.push(`  ${entryPath} -> ${command}`)
  }
  lines.push(`root        : ${CWD}`)
  console.log(lines.join('\n'))
}

switch (subcommand) {
  case 'run':
    run()
    break
  case 'lint':
    if (!file) {
      console.error('usage: niketa-run.js lint <path>')
      process.exit(2)
    }
    doLint(file)
    break
  case 'status':
    status()
    break
  default:
    console.error('usage: niketa-run.js <run|lint|status> [path]')
    process.exit(2)
}