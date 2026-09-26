#!/usr/bin/env node
/**
 * stop: after the agent finishes a turn with source edits, once ask it to
 * strip unnecessary comments from those files (loop_limit: 1).
 */
const fs = require('fs')
const path = require('path')

const STATE_DIR = path.join(__dirname, 'state')
const MARKER = path.join(STATE_DIR, 'edited-sources.json')

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

function clearMarker() {
  try {
    if (fs.existsSync(MARKER)) fs.unlinkSync(MARKER)
  } catch {
    // ignore
  }
}

function projectRelative(absPath) {
  const root = path.resolve(path.join(__dirname, '..', '..'))
  const rel = path.relative(root, absPath)
  return rel && !rel.startsWith('..') ? rel.replace(/\\/g, '/') : absPath
}

;(async () => {
  try {
    const raw = await readStdin()
    const input = raw ? JSON.parse(raw) : {}
    const status = input.status
    const loopCount = Number(input.loop_count || 0)

    if (status !== 'completed') {
      clearMarker()
      reply({})
      return
    }

    // Already ran the cleanup follow-up - do not loop again.
    if (loopCount > 0) {
      clearMarker()
      reply({})
      return
    }

    if (!fs.existsSync(MARKER)) {
      reply({})
      return
    }

    let files = []
    try {
      const data = JSON.parse(fs.readFileSync(MARKER, 'utf8'))
      if (Array.isArray(data.files)) files = data.files
    } catch {
      clearMarker()
      reply({})
      return
    }

    clearMarker()
    if (files.length === 0) {
      reply({})
      return
    }

    const listed = files.map(projectRelative).slice(0, 40).join('\n- ')
    const more =
      files.length > 40 ? `\n- … und ${files.length - 40} weitere` : ''

    reply({
      followup_message: [
        'Routine nach Agent-Lauf: Entferne unnötige Kommentare in den gerade geänderten Dateien.',
        '',
        'Entfernen: Tutorial-/Essay-JSDoc, offensichtliche Property-Docs, Abschnittskommentare, auskommentierten Stub-Code, „Later:“-Notizen.',
        'Behalten: `/// <reference …>`, kurze Catch-Marker (`// ignore`, `// fall through`), nicht-offensichtliche WHY-Kommentare (Workarounds, Legacy, Plattform-Bugs).',
        'Keine Logik ändern. Wenn nichts zu tun ist: kurz bestätigen und stoppen.',
        '',
        'Dateien:',
        `- ${listed}${more}`,
      ].join('\n'),
    })
  } catch {
    reply({})
  }
})()
