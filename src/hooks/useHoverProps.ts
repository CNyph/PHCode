import { useCallback } from 'react'

interface HoverStyleOptions {
  backgroundColor?: string
  color?: string
}

export function useHoverProps(
  normalStyle: HoverStyleOptions,
  hoverStyle: HoverStyleOptions
) {
  const onMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, hoverStyle)
    },
    [hoverStyle]
  )

  const onMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      Object.assign(e.currentTarget.style, normalStyle)
    },
    [normalStyle]
  )

  return { onMouseEnter, onMouseLeave }
}
