#!/usr/bin/env node
/**
 * Installe le dernier build EAS sur un téléphone Android branché en USB.
 *
 * Pourquoi ce script plutôt que `eas build:run` : sur Android, `build:run` ne
 * cible que les émulateurs. Il propose un AVD et ignore les appareils
 * physiques, ce qui est précisément l'inverse de ce qu'on veut ici (8 Go de
 * RAM : on évite l'émulateur).
 *
 * Usage : node scripts/install-device.mjs [development|preview|production]
 */
import { execFileSync, execSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const profile = process.argv[2] ?? 'development'

/** `adb` n'est pas toujours dans le PATH : on retombe sur le SDK par défaut. */
function resolveAdb() {
  try {
    execSync('command -v adb', { stdio: 'ignore' })
    return 'adb'
  } catch {
    const home = process.env.HOME ?? ''
    const sdk = process.env.ANDROID_HOME || join(home, 'Library/Android/sdk')
    return join(sdk, 'platform-tools/adb')
  }
}

const adb = resolveAdb()

/** Appareils physiques uniquement : on exclut les `emulator-*`. */
function connectedDevices() {
  const out = execFileSync(adb, ['devices'], { encoding: 'utf8' })
  return out
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device' && !serial.startsWith('emulator-'))
    .map(([serial]) => serial)
}

const devices = connectedDevices()
if (devices.length === 0) {
  console.error(
    'Aucun téléphone Android détecté.\n' +
      '  1. Branche le câble USB\n' +
      '  2. Active le débogage USB (Options de développement)\n' +
      '  3. Accepte le popup « Autoriser le débogage USB ? » sur le téléphone\n' +
      `  4. Vérifie avec : ${adb} devices`,
  )
  process.exit(1)
}
if (devices.length > 1) {
  console.error(`Plusieurs appareils branchés (${devices.join(', ')}). Debranche-en un.`)
  process.exit(1)
}
const [serial] = devices

console.log(`→ Recherche du dernier build EAS (profil ${profile})…`)
/**
 * `npx eas` échoue sous `npm run` : npm injecte des `npm_config_*` qui cassent
 * la résolution du binaire (« could not determine executable to run »). On
 * privilégie donc l'eas-cli global, avec `npx eas-cli` en repli explicite.
 */
function resolveEas() {
  try {
    execSync('command -v eas', { stdio: 'ignore' })
    return 'eas'
  } catch {
    return 'npx --yes eas-cli'
  }
}

const eas = resolveEas()

let raw
try {
  raw = execSync(
    `${eas} build:list --platform android --profile ${profile} --limit 1 --json --non-interactive`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
} catch (err) {
  // `npm run` injecte des variables `npm_config_*` que l'eas-cli interprète :
  // sans le stderr, l'échec est illisible. On le remonte tel quel.
  console.error('La commande eas a échoué :\n' + (err.stderr || err.message))
  process.exit(1)
}

// L'eas-cli écrit parfois une bannière de mise à jour avant le JSON.
const jsonStart = raw.indexOf('[')
const build = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw)[0]
const url = build?.artifacts?.buildUrl ?? build?.artifacts?.applicationArchiveUrl

if (!url) {
  console.error(
    `Aucun build terminé pour le profil « ${profile} ».\n` +
      `Lance d'abord : npm run mobile:build:${profile === 'development' ? 'dev' : profile}`,
  )
  process.exit(1)
}

console.log(`→ Build ${build.id} (${build.completedAt})`)

const dir = await mkdtemp(join(tmpdir(), 'poplist-apk-'))
const apk = join(dir, 'app.apk')

try {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Téléchargement impossible (HTTP ${res.status})`)
  const size = Number(res.headers.get('content-length') ?? 0)
  console.log(`→ Téléchargement${size ? ` (${(size / 1024 / 1024).toFixed(1)} Mo)` : ''}…`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(apk))

  console.log(`→ Installation sur ${serial}…`)
  // `-r` réinstalle en conservant les données si l'app est déjà là.
  execFileSync(adb, ['-s', serial, 'install', '-r', apk], { stdio: 'inherit' })
  console.log('\n✓ Installée. Ouvre Poplist sur le téléphone, puis : npm run mobile:dev')
} finally {
  await rm(dir, { recursive: true, force: true })
}
