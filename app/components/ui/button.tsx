import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/app/utils"

interface RippleProps {
  x: number
  y: number
  size: number
}

const Ripple: React.FC<RippleProps> = ({ x, y, size }) => {
  return (
    <span
      className="absolute rounded-full bg-white/30 pointer-events-none ripple-effect"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
      }}
    />
  )
}

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-95 transform",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive:
          "bg-destructive text-white shadow-lg hover:bg-destructive/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-md hover:bg-accent hover:text-accent-foreground hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const [ripples, setRipples] = React.useState<RippleProps[]>([])
  const Comp = asChild ? Slot : "button"

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const newRipple: RippleProps = {
      x,
      y,
      size,
    }
    
    setRipples(prev => [...prev, newRipple])
    
    // 清除涟漪效果
    setTimeout(() => {
      setRipples(prev => prev.slice(1))
    }, 600)
    
    // 调用原始的onClick事件
    if (props.onClick) {
      props.onClick(event)
    }
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      onClick={asChild ? props.onClick : handleClick}
    >
      {props.children}
      {!asChild && ripples.map((ripple, index) => (
        <Ripple key={index} {...ripple} />
      ))}
    </Comp>
  )
}

export { Button, buttonVariants }
