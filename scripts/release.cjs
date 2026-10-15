#!/usr/bin/env node

/**
 * Script de release automatisé pour Planiscol
 * Usage: node scripts/release.cjs [patch|minor|major]
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const type = process.argv[2] || 'patch'
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error(`❌ Type de version invalide: ${type}. Utilisez: patch, minor, ou major.`)
  process.exit(1)
}

const rootDir = path.resolve(__dirname, '..')
const pkgPath = path.join(rootDir, 'package.json')
const changelogPath = path.join(rootDir, 'CHANGELOG.md')

function run(cmd, options = {}) {
  console.log(`> ${cmd}`)
  return execSync(cmd, { cwd: rootDir, stdio: 'pipe', encoding: 'utf-8', ...options })
}

console.log(`\n🚀 Lancement du processus de release (${type})...\n`)

// 1. Vérification des tests & build
console.log('🧪 Exécution des tests unitaires...')
try {
  run('npm.cmd run test')
  console.log('✅ Tests unitaires réussis.\n')
} catch (err) {
  console.error('❌ Échec des tests. Release annulée.')
  console.error(err.stdout || err.stderr || err.message)
  process.exit(1)
}

console.log('🔨 Vérification du build de production...')
try {
  run('npm.cmd run build')
  console.log('✅ Build réussi.\n')
} catch (err) {
  console.error('❌ Échec du build. Release annulée.')
  console.error(err.stdout || err.stderr || err.message)
  process.exit(1)
}

// 2. Calcul du nouveau numéro de version SemVer
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
const oldVersion = pkg.version
const parts = oldVersion.split('.').map(Number)
if (type === 'major') {
  parts[0] += 1
  parts[1] = 0
  parts[2] = 0
} else if (type === 'minor') {
  parts[1] += 1
  parts[2] = 0
} else {
  parts[2] += 1
}
const newVersion = parts.join('.')
console.log(`📦 Mise à jour de version : v${oldVersion} → v${newVersion}`)

// 3. Mise à jour de package.json
pkg.version = newVersion
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

// 4. Génération de la section dans CHANGELOG.md
const today = new Date().toISOString().split('T')[0]
let commitsList = ''
try {
  const lastTag = run('git describe --tags --abbrev=0 2>nul || echo ""').trim()
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
  const logOutput = run(`git log ${range} --pretty=format:"- %s (%h)"`).trim()
  commitsList = logOutput || '- Mises à jour diverses et améliorations'
} catch {
  commitsList = '- Mises à jour diverses et améliorations'
}

const changelogEntry = `\n## [${newVersion}] - ${today}\n\n${commitsList}\n`
let currentChangelog = ''
if (fs.existsSync(changelogPath)) {
  currentChangelog = fs.readFileSync(changelogPath, 'utf-8')
} else {
  currentChangelog = `# Journal des modifications (Changelog) — Planiscol\n\nToutes les modifications notables apportées à ce projet sont documentées dans ce fichier.\n`
}

const updatedChangelog = currentChangelog.includes('# Journal des modifications')
  ? currentChangelog.replace(
      '# Journal des modifications (Changelog) — Planiscol\n\nToutes les modifications notables apportées à ce projet sont documentées dans ce fichier.\n',
      `# Journal des modifications (Changelog) — Planiscol\n\nToutes les modifications notables apportées à ce projet sont documentées dans ce fichier.\n${changelogEntry}`
    )
  : `${changelogEntry}\n${currentChangelog}`

fs.writeFileSync(changelogPath, updatedChangelog, 'utf-8')
console.log('📝 CHANGELOG.md mis à jour.\n')

// 5. Commit de release et Tag Git
console.log('🔖 Création du commit de release et du tag Git...')
try {
  run(`git add package.json CHANGELOG.md`)
  run(`git commit -m "chore(release): v${newVersion}"`)
  run(`git tag -a v${newVersion} -m "Release v${newVersion}"`)
  console.log(`✅ Tag v${newVersion} créé.\n`)
} catch (err) {
  console.error('❌ Erreur lors de la création du commit ou du tag:', err.message)
  process.exit(1)
}

// 6. Push vers origin main
console.log('📤 Envoi vers le dépôt GitHub distant...')
try {
  run('git push origin main')
  run(`git push origin v${newVersion}`)
  console.log(`\n🎉 Release v${newVersion} publiée avec succès sur GitHub !`)
  console.log(`🔗 Le workflow GitHub Actions a été déclenché pour construire l'installeur Windows.`)
} catch (err) {
  console.warn('⚠️ Le push distant a rencontré un avertissement ou nécessite une authentification active :')
  console.warn(err.message)
  console.log(`Vous pouvez exécuter manuellement : git push origin main && git push origin v${newVersion}`)
}
