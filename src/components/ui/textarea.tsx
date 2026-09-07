import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldVariants } from "@/components/ui/input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        fieldVariants(),
        // Height comes from content, so drop the fixed field height.
        "field-sizing-content h-auto min-h-20 py-2",
        className,
      )}
      {...props}
    />
  )
}

interface TextareaWithCountProps extends React.ComponentProps<typeof Textarea> {
  maxLength?: number
  showCount?: boolean
}

const TextareaWithCount = React.forwardRef<HTMLTextAreaElement, TextareaWithCountProps>(
  ({ maxLength, showCount = true, value, onChange, className, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value ?? '')
    const currentValue = value !== undefined ? value : internalValue
    const length = String(currentValue).length
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value)
      onChange?.(e)
    }
    const countColor = maxLength
      ? length >= maxLength
        ? 'text-destructive'
        : length >= maxLength * 0.9
        ? 'text-amber-500'
        : 'text-muted-foreground'
      : 'text-muted-foreground'
    return (
      <div className="relative">
        <Textarea ref={ref} value={currentValue} onChange={handleChange} maxLength={maxLength} className={className} {...props} />
        {showCount && maxLength && (
          <p className={`text-xs text-right mt-1 ${countColor}`}>{length} / {maxLength}</p>
        )}
      </div>
    )
  }
)
TextareaWithCount.displayName = 'TextareaWithCount'

export { Textarea, TextareaWithCount }
