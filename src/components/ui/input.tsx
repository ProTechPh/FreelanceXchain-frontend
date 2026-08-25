import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Shared with Textarea and Select so every field in a form row lines up and
// carries the same states. `--input` is a 3:1 boundary colour (WCAG 1.4.11), so
// it is used for borders only — surfaces come from --background / --muted.
const fieldVariants = cva(
  [
    "w-full min-w-0 rounded-md border border-input bg-background text-foreground",
    "transition-[border-color,box-shadow] duration-fast ease-out outline-none",
    "placeholder:text-muted-foreground",
    "hover:border-foreground/30",
    "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:placeholder:text-muted-foreground",
    "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
    "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/40",
  ].join(" "),
  {
    variants: {
      inputSize: {
        sm: "h-9 px-2.5 text-sm",
        // Matches Button's default height so labels, fields and actions align.
        default: "h-10 px-3 text-sm",
        lg: "h-11 px-3.5 text-base",
      },
    },
    defaultVariants: { inputSize: "default" },
  },
)

interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof fieldVariants> {}

function Input({ className, type, inputSize, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        fieldVariants({ inputSize }),
        "file:mr-2 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Input, fieldVariants, type InputProps }
