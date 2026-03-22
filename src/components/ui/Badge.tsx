import { cn } from '../../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'purple' | 'blue'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-900/50 text-green-400 border border-green-800',
    danger: 'bg-red-900/50 text-red-400 border border-red-800',
    warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
    purple: 'bg-purple-900/50 text-purple-400 border border-purple-800',
    blue: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
