import iconLight from '@/assets/ace-tracker-icon-light.png'
import iconDark from '@/assets/ace-tracker-icon-dark.png'
import { useWorkspace } from '@/shared'
import { cn } from 'cn'

type AceTrackerIconProps = {
  className?: string
  alt?: string
}

export function AceTrackerIcon({
  className,
  alt = '',
}: AceTrackerIconProps) {
  const { resolvedTheme } = useWorkspace()
  const src = resolvedTheme === 'dark' ? iconLight : iconDark

  return (
    <img
      src={src}
      alt={alt}
      className={cn('shrink-0 object-cover', className)}
    />
  )
}
