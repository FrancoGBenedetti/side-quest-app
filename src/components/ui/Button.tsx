import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-purple-600 hover:bg-purple-500 text-white',
      secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
      danger: 'bg-red-600 hover:bg-red-500 text-white',
      ghost: 'hover:bg-gray-800 text-gray-300 hover:text-white',
      outline: 'border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
