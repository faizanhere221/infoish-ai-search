import Image from 'next/image'
import { cn } from '@/lib/utils'

// The one place the brand mark's file is referenced. Every header, footer,
// auth page and print page renders <Logo>, so swapping the asset is a
// one-line change here.
export const LOGO_MARK_SRC = '/logo.png'

const SIZES = {
  sm: { px: 28, box: 'w-7 h-7 rounded-lg', text: 'text-lg' },
  md: { px: 32, box: 'w-8 h-8 rounded-lg', text: 'text-xl' },
  lg: { px: 40, box: 'w-10 h-10 rounded-xl', text: 'text-2xl' },
} as const

interface LogoProps {
  /** `full` = mark + wordmark, `mark` = the square mark only */
  variant?: 'full' | 'mark'
  /** `light` for light backgrounds (dark wordmark), `dark` for dark backgrounds (white wordmark) */
  tone?: 'light' | 'dark'
  size?: keyof typeof SIZES
  priority?: boolean
  className?: string
}

export default function Logo({
  variant = 'full',
  tone = 'light',
  size = 'md',
  priority = false,
  className,
}: LogoProps) {
  const s = SIZES[size]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src={LOGO_MARK_SRC}
        alt={variant === 'mark' ? 'Infoishai' : ''}
        width={s.px}
        height={s.px}
        priority={priority}
        className={cn('flex-shrink-0', s.box)}
      />
      {variant === 'full' && (
        <span className={cn('font-bold', s.text, tone === 'dark' ? 'text-white' : 'text-gray-900')}>
          Infoishai
        </span>
      )}
    </span>
  )
}
