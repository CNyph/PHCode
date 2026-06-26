import { CSSProperties } from 'react'

interface LogoProps {
  size?: number
  className?: string
  style?: CSSProperties
}

export default function Logo({ size = 24, className = '', style }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
      <path
        d="M8 10C8 8.89543 8.89543 8 10 8H14C15.1046 8 16 8.89543 16 10V14C16 15.1046 15.1046 16 14 16H10C8.89543 16 8 15.1046 8 14V10Z"
        fill="currentColor"
      />
      <path
        d="M16 18C16 16.8954 16.8954 16 18 16H22C23.1046 16 24 16.8954 24 18V22C24 23.1046 23.1046 24 22 24H18C16.8954 24 16 23.1046 16 22V18Z"
        fill="currentColor"
      />
      <path
        d="M12 20C12 18.8954 12.8954 18 14 18H18C19.1046 18 20 18.8954 20 20V22C20 23.1046 19.1046 24 18 24H14C12.8954 24 12 23.1046 12 22V20Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  )
}
