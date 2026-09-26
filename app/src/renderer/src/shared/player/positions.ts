export const PLAYER_POSITIONS = [
  'outside',
  'opposite',
  'middle',
  'setter',
  'libero',
  'universal',
] as const

export type PlayerPositionId = (typeof PLAYER_POSITIONS)[number]

export function isPlayerPositionId(value: unknown): value is PlayerPositionId {
  return (
    typeof value === 'string' &&
    (PLAYER_POSITIONS as readonly string[]).includes(value)
  )
}
