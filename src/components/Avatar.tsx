import { useState } from 'react'

interface AvatarProps {
  src?: string
  name?: string
  size?: number
  isUser?: boolean
}

export default function Avatar({ src, name, size = 32, isUser = false }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const colors = isUser
    ? { bg: 'var(--accent)', text: 'var(--bg-primary)' }
    : { bg: 'var(--bg-tertiary)', text: 'var(--text-primary)' }

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || '头像'}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center font-medium"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: size * 0.4
      }}
    >
      {name ? getInitials(name) : (isUser ? 'U' : 'AI')}
    </div>
  )
}
