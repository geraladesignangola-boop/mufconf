import React from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

/**
 * NOTA: o projeto não tem `@types/react` instalado, pelo que `React.ButtonHTMLAttributes`
 * não resolve propriedades. As props essenciais são declaradas explicitamente e o
 * índice `[key: string]` permite receber qualquer outro atributo HTML.
 */
interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: any) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  title?: string
  'aria-label'?: string
  [key: string]: any
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-bold shadow-lg shadow-cyan-500/10',
  secondary:
    'bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/40 hover:text-white font-semibold',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold',
  danger:
    'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-semibold',
  ghost:
    'text-slate-400 hover:text-white hover:bg-slate-800 font-medium',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  type = 'button',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin flex-shrink-0`} />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
