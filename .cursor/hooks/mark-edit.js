#!/usr/bin/env node
/**
 * afterFileEdit: remember source files the agent touched this turn.
 */
const fs = require('fs')
const path = require('path')

const STATE_DIR = path.join(__dirname, 'state')
const MARKER = path.join(STATE_DIR, 'edited-sources.json')
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|css|scss)$/i

function readStdin() {
  return new Promise((resolve) => {
    let raw = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      raw += chunk
    })
    process.stdin.on('end', () => resolve(raw))
  })
}

function reply(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

;(async () => {
  try {
    const raw = await readStdin()
    const input = raw ? JSON.parse(raw) : {}
    const filePath = String(input.file_path || '')
    if (!filePath || !SOURCE_EXT.test(filePath)) {
      reply({})
      return
    }

    fs.mkdirSync(STATE_DIR, { recursive: true })
    let files = []
    if (fs.existsSync(MARKER)) {
      try {
        const prev = JSON.parse(fs.readFileSync(MARKER, 'utf8'))
        if (Array.isArray(prev.files)) files = prev.files
      } catch {
        files = []
      }
    }
    const normalized = path.normalize(filePath)
    if (!files.includes(normalized)) files.push(normalized)
    fs.writeFileSync(
      MARKER,
      JSON.stringify({ files, updatedAt: new Date().toISOString() }, null, 2),
    )
    reply({})
  } catch {
    reply({})
  }
})()
