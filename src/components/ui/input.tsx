import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A 1.35px resting border. Below 1px the field disappears on a low-contrast
 * screen; at 2px it reads as an error state before anything is wrong.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-sm border-[1.35px] border-input bg-card px-3.5 py-1 text-base transition-colors duration-[var(--dur-fast)] outline-none",
        "selection:bg-primary selection:text-primary-foreground placeholder:text-faint",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm",
        "focus-visible:border-brand focus-visible:outline-none",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
