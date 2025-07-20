import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-white hover:opacity-90",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100 hover:text-black",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        ghost: "hover:bg-gray-100 hover:text-black",
        link: "underline-offset-4 hover:underline text-black",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Apply default background color for default variant if no style is provided
    const defaultStyle =
      variant === "default" && !style?.backgroundColor ? { backgroundColor: "#1A1B30", ...style } : style

    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} style={defaultStyle} {...props} />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
