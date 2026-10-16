#!/usr/bin/env node

/**
 * Script de test et validation de configuration pour electron-updater et electron-builder
 * Usage: node scripts/test-updater.cjs
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const pkgPath = path.join(rootDir, 'package.json')
const builderConfigPath = path.join(rootDir, 'electron-builder.yml')
const distPath = path.join(rootDir, 'dist')

console.log('🔍 [test:updater] Validation de la configuration de mise à jour...\n')

let errorsCount = 0

// 1. Vérification de package.json
if (!fs.existsSync(pkgPath)) {
  console.error('❌ package.json introuvable')
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

// Validation version SemVer
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/
if (!pkg.version || !semverRegex.test(pkg.version)) {
  console.error(`❌ package.json: Version invalide (${pkg.version}). Format SemVer attendu.`)
  errorsCount++
} else {
  console.log(`✅ package.json: Version SemVer valide (v${pkg.version})`)
}

// Validation repository
const repoUrl = typeof pkg.repository === 'object' ? pkg.repository.url : pkg.repository
if (!repoUrl || !repoUrl.includes('AgentViande/Planiscol-')) {
  console.error(`❌ package.json: repository invalide. Doit cibler AgentViande/Planiscol-. Reçu: ${repoUrl}`)
  errorsCount++
} else {
  console.log(`✅ package.json: Repository ciblé valide (${repoUrl})`)
}

// 2. Vérification de electron-builder.yml
if (!fs.existsSync(builderConfigPath)) {
  console.error('❌ electron-builder.yml introuvable')
  process.exit(1)
}

const builderContent = fs.readFileSync(builderConfigPath, 'utf-8')

// Vérification publish block
if (!builderContent.includes('provider: github')) {
  console.error('❌ electron-builder.yml: publish.provider "github" manquant.')
  errorsCount++
} else {
  console.log('✅ electron-builder.yml: publish.provider est configuré sur "github"')
}

if (!builderContent.includes('owner: AgentViande')) {
  console.error('❌ electron-builder.yml: publish.owner "AgentViande" manquant.')
  errorsCount++
} else {
  console.log('✅ electron-builder.yml: publish.owner configuré sur "AgentViande"')
}

if (!builderContent.includes('repo: Planiscol-')) {
  console.error('❌ electron-builder.yml: publish.repo "Planiscol-" manquant (attention au tiret final).')
  errorsCount++
} else {
  console.log('✅ electron-builder.yml: publish.repo configuré sur "Planiscol-"')
}

// Vérification nsis perMachine: false
if (!builderContent.includes('perMachine: false')) {
  console.error('❌ electron-builder.yml: nsis.perMachine: false manquant (recommandé pour installation par utilisateur).')
  errorsCount++
} else {
  console.log('✅ electron-builder.yml: nsis.perMachine: false configuré')
}

// 3. Vérification de la présence de latest.yml dans dist (si un build existe)
if (fs.existsSync(distPath)) {
  const latestYmlPath = path.join(distPath, 'latest.yml')
  if (fs.existsSync(latestYmlPath)) {
    const latestContent = fs.readFileSync(latestYmlPath, 'utf-8')
    console.log(`✅ dist/latest.yml trouvé :`)
    const firstLines = latestContent.split('\n').slice(0, 4).join('\n')
    console.log('   ' + firstLines.replace(/\n/g, '\n   '))
  } else {
    console.log('ℹ️ dist/latest.yml non présent actuellement (sera généré automatiquement lors du build avec publish).')
  }
} else {
  console.log('ℹ️ Dossier dist/ non encore créé (sera généré lors de npm run build:win).')
}

console.log('\n----------------------------------------')
if (errorsCount === 0) {
  console.log('🎉 Tous les contrôles updater sont conformes !')
  process.exit(0)
} else {
  console.error(`💥 ${errorsCount} anomalie(s) détectée(s) dans la configuration updater.`)
  process.exit(1)
}
