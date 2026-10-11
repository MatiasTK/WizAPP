type CardProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  padding?: 'small' | 'medium' | 'large'
  shadow?: 'small' | 'medium' | 'large'
  rounded?: 'small' | 'medium' | 'large'
  className?: string
  hoverable?: boolean
  active?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  variant = 'primary',
  padding = 'medium',
  shadow = 'medium',
  rounded = 'medium',
  className = '',
  hoverable = false,
  active = false,
  onClick
}: CardProps) {
  const baseStyles = 'transition-all duration-300'

  const variants = {
    primary: 'bg-primary',
    secondary: 'bg-secondary'
  }

  const paddings = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  }

  const shadows = {
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg'
  }

  const roundeds = {
    small: 'rounded-sm',
    medium: 'rounded-md',
    large: 'rounded-lg'
  }

  const hoverEffect = hoverable
    ? 'transform transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg'
    : ''

  const activeClass = active ? 'ring-3 ring-offset-4 ring-offset-main-bg ring-primary' : ''
  const cursorClass = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${paddings[padding]}
        ${shadows[shadow]}
        ${roundeds[rounded]}
        ${hoverEffect}
        ${activeClass}
        ${cursorClass}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
