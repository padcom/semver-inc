#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises'
import SemVer from 'semver'
import minimist from 'minimist'
import pkg from './package.json' assert { type: 'json' }

const args = minimist(process.argv.slice(2));
args.inc = args.i || args.inc || args._.length > 0 ? args._[0] : 'patch'
args.help = args.h || args.help || false
args.version = args.V || args.version || false
args['dry-run'] = args.d || args['dry-run'] || false

if (args.help) {
  console.log(pkg.name, '-', pkg.description)
  console.log('usage:', pkg.name, '[-h|--help] [-V|--version] [-i|--inc tag]')
  process.exit(0)
}
if (args.version) {
  console.log(pkg.version)
  process.exit(0)
}

function makeNextVersion(version, tag = null) {
  const parsed = SemVer.parse(version)
  if (version === 'master') {
    version = 'patch'
  }
  if (['major', 'minor', 'patch'].includes(tag)) {
    return SemVer.inc(version, tag)
  } else if (tag === 'pass') {
    return version
  } else if (tag === 'release' || tag === null) {
    if (parsed.prerelease.length > 0) {
      return `${parsed.major}.${parsed.minor}.${parsed.patch}`
    } else {
      return SemVer.inc(version, 'patch')
    }
  } else if (parsed.prerelease.length === 0) {
    return SemVer.inc(version, 'patch') + `-${tag}.0`
  } else if (parsed.prerelease[0] === tag) {
    return SemVer.inc(version, 'prerelease')
  } else {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}-${tag}.0`
  }
}

async function withPackageJSON(filename = './package.json', callback = async (x) => x) {
  const pkg = JSON.parse(await readFile(filename))
  await callback(pkg)
  await writeFile(filename, JSON.stringify(pkg, null, 2))
}

await withPackageJSON('./package.json', async (pkg) => {
  const next = makeNextVersion(pkg.version, args.inc)
  console.log(pkg.version, '=>', next)
  if (!args['dry-run']) pkg.version = next
})
