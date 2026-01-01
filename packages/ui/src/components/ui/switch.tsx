import * as React from "react"
import { cn } from "@/lib/utils"

// Custom Switch component using standard checkbox and CSS
const Switch = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & {
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, checked, onCheckedChange, onChange, disabled, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onCheckedChange?.(e.target.checked)
  }

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          "relative w-9 h-5 bg-input peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-background rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
          checked ? "bg-primary" : "",
          className
        )}
      />
    </label>
  )
})
Switch.displayName = "Switch"

export { Switch }
