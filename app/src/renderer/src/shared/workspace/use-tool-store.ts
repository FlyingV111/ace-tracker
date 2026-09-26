import { useCallback } from 'react'
import type { ProjectToolDocuments, ToolId } from '@/shared'
import { useWorkspace } from '@/shared'

/**
 * Tool-local store backed by the active project's tool file.
 * Every write updates the project and is autosaved (AppData / .aceproj tools/*).
 */
export function useToolStore<T extends ToolId>(toolId: T) {
  const { activeProject, updateToolData } = useWorkspace()

  const data = activeProject?.tools[toolId] as ProjectToolDocuments[T] | undefined

  const setData = useCallback(
    (
      next:
        | ProjectToolDocuments[T]
        | ((prev: ProjectToolDocuments[T]) => ProjectToolDocuments[T]),
    ) => {
      updateToolData(toolId, next)
    },
    [toolId, updateToolData],
  )

  return [data, setData] as const
}
