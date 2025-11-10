import React from 'react'

export default function Icon({ name, className = 'w-6 h-6', size = 24, stroke = 'currentColor', strokeWidth = 1.5 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }

  switch (name) {
    case 'search':
      return (
        <svg {...common} className={className}>
          <circle cx="11" cy="11" r="6" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      )
    case 'hospital':
      return (
        <svg {...common} className={className}>
          <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" />
          <path d="M9 10h6v4H9z" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common} className={className}>
          <path d="M17 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common} className={className}>
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    case 'box':
      return (
        <svg {...common} className={className}>
          <path d="M21 16V8a2 2 0 00-1-1.732L12 2 4 6.268A2 2 0 003 8v8a2 2 0 001 1.732L12 22l8-4.268A2 2 0 0021 16z" />
          <path d="M12 2v10" />
        </svg>
      )
    case 'department':
      return (
        <svg {...common} className={className}>
          <path d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8" />
          <path d="M7 21V10h10v11" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common} className={className}>
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'money':
      return (
        <svg {...common} className={className}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 11a4 4 0 01-8 0 4 4 0 018 0z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common} className={className}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case 'document':
      return (
        <svg {...common} className={className}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common} className={className}>
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17V5M8 17v-3" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common} className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common} className={className}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg {...common} className={className}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common} className={className}>
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
        </svg>
      )
    case 'spinner':
      return (
        <svg {...common} className={className} fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    case 'printer':
      return (
        <svg {...common} className={className}>
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <path d="M6 14h12v8H6z" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common} className={className}>
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      )
    case 'location':
      return (
        <svg {...common} className={className}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common} className={className}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
        </svg>
      )
    case 'envelope':
      return (
        <svg {...common} className={className}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      )
    case 'repeat':
      return (
        <svg {...common} className={className}>
          <path d="M17 1l4 4-4 4" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <path d="M7 23l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
      )
    default:
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
  }
}
