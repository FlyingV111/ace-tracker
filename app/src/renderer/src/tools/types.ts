import type { LucideIcon } from 'lucide-react'
import type { Locale, ToolId } from '@/shared'

export type ToolManifest = {
  id: ToolId
  icon: LucideIcon
  available: boolean
  title: Record<Locale, string>
  description: Record<Locale, string>
}
