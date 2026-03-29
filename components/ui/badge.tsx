import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Status badges
        pending: 'border-transparent bg-slate-700 text-slate-200',
        contacted: 'border-transparent bg-blue-900 text-blue-200',
        replied: 'border-transparent bg-emerald-900 text-emerald-200',
        unresponsive: 'border-transparent bg-amber-900 text-amber-200',
        opted_out: 'border-transparent bg-red-900 text-red-300',
        // AI category badges
        hot_lead: 'border-transparent bg-orange-900 text-orange-200',
        neutral: 'border-transparent bg-slate-700 text-slate-300',
        not_interested: 'border-transparent bg-red-900 text-red-300',
        objection: 'border-transparent bg-yellow-900 text-yellow-200',
        complaint: 'border-transparent bg-rose-900 text-rose-200',
        positive: 'border-transparent bg-green-900 text-green-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
