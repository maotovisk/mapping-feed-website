import type { IconName } from '../../types/icon'

interface AppIconProps {
  name: IconName
  className?: string
  strokeWidth?: number
}

export function AppIcon({ name, className, strokeWidth = 2.35 }: AppIconProps) {
  const baseProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  return (
    <svg
      class={className}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {name === 'message-circle' && (
        <>
          <path {...baseProps} d="M20 11.5a8.5 8.5 0 1 1-4.2-7.3" />
          <path {...baseProps} d="m9 15 2.5-2.5h3.8" />
        </>
      )}
      {name === 'rotate-ccw' && (
        <>
          <path {...baseProps} d="M3 12a9 9 0 1 0 2.6-6.3" />
          <path {...baseProps} d="M3 4v5h5" />
        </>
      )}
      {name === 'heart' && (
        <path
          {...baseProps}
          d="M12 20s-7-4.4-7-10a4.4 4.4 0 0 1 8-2.7A4.4 4.4 0 0 1 20 10c0 5.6-8 10-8 10Z"
        />
      )}
      {name === 'heart-crack' && (
        <>
          <path
            {...baseProps}
            d="M12 20s-7-4.4-7-10a4.4 4.4 0 0 1 8-2.7A4.4 4.4 0 0 1 20 10c0 5.6-8 10-8 10Z"
          />
          <path {...baseProps} d="m12.6 7.8-1.8 4.5 2.5.2-1.3 3.6" />
        </>
      )}
      {name === 'sparkles' && (
        <>
          <path {...baseProps} d="M12 3.5 14 9l5.5 2L14 13l-2 5.5L10 13l-5.5-2L10 9Z" />
          <path {...baseProps} d="m18.5 3.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
        </>
      )}
      {name === 'circle-slash' && (
        <>
          <circle {...baseProps} cx="12" cy="12" r="8.2" />
          <path {...baseProps} d="m7 17 10-10" />
        </>
      )}
      {name === 'user-plus' && (
        <>
          <path {...baseProps} d="M16.2 18.5c-.8-2.5-2.5-3.7-5.2-3.7s-4.4 1.2-5.2 3.7" />
          <circle {...baseProps} cx="11" cy="8.8" r="3.2" />
          <path {...baseProps} d="M19 8v5" />
          <path {...baseProps} d="M16.5 10.5h5" />
        </>
      )}
      {name === 'user-minus' && (
        <>
          <path {...baseProps} d="M16.2 18.5c-.8-2.5-2.5-3.7-5.2-3.7s-4.4 1.2-5.2 3.7" />
          <circle {...baseProps} cx="11" cy="8.8" r="3.2" />
          <path {...baseProps} d="M16.5 10.5h5" />
        </>
      )}
      {name === 'users' && (
        <>
          <circle {...baseProps} cx="9" cy="9" r="2.7" />
          <circle {...baseProps} cx="16" cy="10.2" r="2.1" />
          <path {...baseProps} d="M4.8 18.5c.7-2.2 2.1-3.3 4.2-3.3s3.5 1.1 4.2 3.3" />
          <path {...baseProps} d="M14 18.2c.4-1.4 1.2-2.2 2.5-2.2 1.2 0 2 .8 2.4 2.2" />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle {...baseProps} cx="12" cy="12" r="8.2" />
          <path {...baseProps} d="M12 7.6V12l3 1.9" />
        </>
      )}
      {name === 'refresh' && (
        <>
          <path {...baseProps} d="M20 5.5v4.5h-4.5" />
          <path {...baseProps} d="M4 18.5V14h4.5" />
          <path {...baseProps} d="M5.8 10A7.8 7.8 0 0 1 18 7.2" />
          <path {...baseProps} d="M18.2 14A7.8 7.8 0 0 1 6 16.8" />
        </>
      )}
      {name === 'layers' && (
        <>
          <path {...baseProps} d="m12 4-8 4.2L12 12l8-3.8Z" />
          <path {...baseProps} d="m4 12.3 8 3.8 8-3.8" />
          <path {...baseProps} d="m4 16.2 8 3.8 8-3.8" />
        </>
      )}
    </svg>
  )
}
