import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Status pills always carry their text label (MASTER.md: status is never colour-only).
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-brand-line bg-brand-soft text-brand",
        secondary: "border-line bg-subtle text-ink-2",
        outline: "border-line-strong text-ink-2",
        destructive: "border-danger-line bg-danger-soft text-danger",
        danger: "border-danger-line bg-danger-soft text-danger",
        warn: "border-warn-line bg-warn-soft text-warn",
        caution: "border-caution-line bg-caution-soft text-caution",
        success: "border-success-line bg-success-soft text-success",
        neutral: "border-line bg-subtle text-ink-2",
        ghost: "border-transparent",
        link: "border-transparent text-brand underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
