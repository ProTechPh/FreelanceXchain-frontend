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

export { Textarea }
