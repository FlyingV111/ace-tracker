import type { ComponentType } from 'react'
import type { ToolId } from '@/shared'
import type { ToolManifest } from './types'
import {
  playerTrackerManifest,
  PlayerTrackerPage,
} from '@/tools/player-tracker'
import {
  videoAnalysisManifest,
  VideoAnalysisPage,
} from '@/tools/video-analysis'

export type RegisteredTool = {
  manifest: ToolManifest
  Page: ComponentType
}

export const toolRegistry: RegisteredTool[] = [
  { manifest: playerTrackerManifest, Page: PlayerTrackerPage },
  // { manifest: liveTrackingManifest, Page: LiveTrackingPage },
  { manifest: videoAnalysisManifest, Page: VideoAnalysisPage },
]

export function getToolPage(id: ToolId) {
  return toolRegistry.find((tool) => tool.manifest.id === id)?.Page
}
