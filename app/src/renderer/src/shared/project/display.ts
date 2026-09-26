import type { AceProject, MatchResult, ProjectDocument } from '../core/types'

export function teamInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const letter = trimmed[0]
  return letter ? letter.toLocaleUpperCase() : '?'
}

export function projectLetterMark(
  homeName: string,
  awayName: string,
): string {
  return `${teamInitial(homeName)} vs ${teamInitial(awayName)}`
}

export function projectMatchupLabel(project: ProjectDocument): string | null {
  const { home, away } = project.teams
  if (!home.name || !away.name) return null
  return `${home.name} vs ${away.name}`
}

export function resultLabelKey(
  result: MatchResult | undefined,
): 'resultHome' | 'resultAway' | 'resultDraw' | 'resultOpen' {
  if (result === 'home') return 'resultHome'
  if (result === 'away') return 'resultAway'
  if (result === 'draw') return 'resultDraw'
  return 'resultOpen'
}

export function winnerTeamName(project: ProjectDocument): string | null {
  if (project.result === 'home') return project.teams.home.name || null
  if (project.result === 'away') return project.teams.away.name || null
  return null
}

export function getAceMatchup(ace: AceProject): string | null {
  return projectMatchupLabel(ace.project)
}

export type MatchScoreDisplay = {
  home: number
  away: number
  kind: 'sets' | 'points'
}

export function matchScore(ace: AceProject): MatchScoreDisplay | null {
  const analysis = ace.tools['video-analysis']?.score
  if (analysis) {
    if (analysis.setsHome > 0 || analysis.setsAway > 0) {
      return {
        home: analysis.setsHome,
        away: analysis.setsAway,
        kind: 'sets',
      }
    }
    if (analysis.home > 0 || analysis.away > 0) {
      return { home: analysis.home, away: analysis.away, kind: 'points' }
    }
  }
  const stored = ace.project.setsScore
  if (
    stored &&
    Number.isFinite(stored.home) &&
    Number.isFinite(stored.away)
  ) {
    return { home: stored.home, away: stored.away, kind: 'sets' }
  }
  return null
}

export function formatMatchScore(score: MatchScoreDisplay | null): string {
  if (!score) return '–:–'
  return `${score.home}:${score.away}`
}
