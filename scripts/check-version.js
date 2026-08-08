#!/usr/bin/env node
/**
 * check-version.js — 版本号同步检查脚本
 *
 * 跨端应用发版前最常见的坑：版本号散落在多个文件（package.json、桌面端配置、
 * 更新检查常量、官网下载链接），漏改一处就导致用户下错版本/更新检测失效。
 * 本脚本扫描指定文件中的版本号，报告不一致项。
 *
 * 用法：
 *   node check-version.js [文件或目录...]
 *   node check-version.js package.json src-tauri/tauri.conf.json src/utils/updateChecker.js
 *
 * 支持的文件类型：
 *   - JSON（含 .json 后缀）：读取顶层 version 字段
 *   - JS/TS 源码：匹配 CURRENT_VERSION = 'x.y.z' / 'x.y.z'
 *   - 任意文本：匹配 v\d+\.\d+\.\d+ 或 \d+\.\d+\.\d+
 *   - 目录：递归扫描（自动跳过 node_modules / dist / target / .git / android）
 */
const fs = require('fs')
const path = require('path')

const SEMVER = /(\d+\.\d+\.\d+)/g
const SKIP_DIRS = new Set(['node_modules', 'dist', 'target', '.git', 'android', '.reasonix', 'build'])
const SKIP_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.apk', '.exe', '.zip', '.lock'])

function findVersions(file) {
  const ext = path.extname(file).toLowerCase()
  if (SKIP_EXTS.has(ext)) return []
  let content
  try {
    content = fs.readFileSync(file, 'utf8')
  } catch {
    return []
  }
  const hits = []
  // JSON：只读顶层 version 字段（避免把依赖版本号当噪音扫进来）
  if (ext === '.json') {
    try {
      const data = JSON.parse(content)
      if (data.version) hits.push({ value: String(data.version), source: 'version 字段' })
    } catch { /* 忽略非标准 JSON */ }
    return hits
  }
  // TOML：version = "x.y.z"
  if (ext === '.toml') {
    const m = content.match(/^version\s*=\s*"([^"]+)"/m)
    if (m) hits.push({ value: m[1], source: 'version 字段' })
    return hits
  }
  // JS/TS：只匹配 CURRENT_VERSION 常量（避免注释示例被误扫）
  if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
    const m = content.match(/CURRENT_VERSION\s*=\s*['"]([^'"]+)['"]/)
    if (m) hits.push({ value: m[1], source: 'CURRENT_VERSION 常量' })
    return hits
  }
  // 其他文本（HTML/MD 等）：通用扫描 v1.2.3 形式的版本标记（去重）
  const seen = new Set()
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // 跳过超长行（内嵌 base64 / SVG path 数据会产生假版本号）
    if (line.length > 500) continue
    for (const m of line.matchAll(/(?:v)(\d+\.\d+\.\d+)/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1])
        hits.push({ value: m[1], source: `第 ${i + 1} 行` })
      }
    }
  }
  return hits
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out)
    } else {
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

function collectFiles(args) {
  const files = []
  for (const arg of args) {
    const full = path.resolve(arg)
    if (!fs.existsSync(full)) {
      console.warn(`⚠ 路径不存在，跳过: ${arg}`)
      continue
    }
    const stat = fs.statSync(full)
    if (stat.isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('用法: node check-version.js [文件或目录...]')
    console.log('示例: node check-version.js package.json src-tauri/tauri.conf.json src/utils/updateChecker.js')
    process.exit(0)
  }

  const report = new Map() // value -> [{file, source}]
  const files = collectFiles(args)
  for (const file of files) {
    for (const hit of findVersions(file)) {
      if (!report.has(hit.value)) report.set(hit.value, [])
      report.get(hit.value).push({ file, source: hit.source })
    }
  }

  const values = [...report.keys()].sort()
  if (values.length === 0) {
    console.log('ℹ 未在任何文件中找到版本号。')
    return
  }
  console.log(`共找到 ${values.length} 个不同版本号：\n`)
  for (const v of values) {
    console.log(`  v${v}`)
    for (const { file, source } of report.get(v)) {
      console.log(`      ${path.relative(process.cwd(), file)} (${source})`)
    }
  }
  console.log('\n' + (values.length === 1 ? '✅ 版本号一致，可以发布。' : '❌ 版本号不一致！请同步后再打包发布。'))
}

main()
