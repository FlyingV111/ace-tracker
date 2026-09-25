import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ToolCardProps = {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
  className?: string
}

export function ToolCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: ToolCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Card className="h-full transition group-hover:bg-muted/40 group-hover:ring-foreground/20">
        <CardHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Icon className="size-5" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </button>
  )
}
