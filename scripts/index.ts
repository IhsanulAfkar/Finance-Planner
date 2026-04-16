#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

const command = process.argv[2]

async function main() {
  const scriptsDir = __dirname

  const files = fs.readdirSync(scriptsDir)

  const scriptFiles = files.filter(
    (file) =>
      file !== 'index.ts' &&
      (file.endsWith('.ts') || file.endsWith('.js'))
  )

  const normalizedCommand = command?.toLowerCase()

  const match = scriptFiles.find((file) => {
    const name = file.replace(/\.(ts|js)$/, '').toLowerCase()
    return name === normalizedCommand
  })

  if (!match) {
    console.log(`❌ Unknown command: ${command}`)
    console.log(`Available commands:`)
    scriptFiles.forEach((file) => {
      console.log(`- ${file.replace(/\.(ts|js)$/, '')}`)
    })
    process.exit(1)
  }

  // ✅ FIX: convert to file:// URL
  const modulePath = path.join(scriptsDir, match)
  const moduleUrl = pathToFileURL(modulePath).href

  const mod = await import(moduleUrl)

  const fn =
    mod.default ||
    mod[Object.keys(mod).find((k) => typeof mod[k] === 'function') || '']

  if (!fn) {
    console.log(`❌ No executable function found in ${match}`)
    process.exit(1)
  }

  await fn()
}

main().catch((err) => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})