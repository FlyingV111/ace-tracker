import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type TermInfoProps = {
  label: string
  text: string
  className?: string
}

export function TermInfo({ label, text, className }: TermInfoProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={cn(
            'inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
            className,
          )}
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Info className="size-3" strokeWidth={2.25} />
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
