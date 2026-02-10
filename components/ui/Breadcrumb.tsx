'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

/** Maps route segments to human-readable labels */
const routeLabels: Record<string, string> = {
    '': 'Dashboard',
    participants: 'Participants',
    team: 'Team',
    sessions: 'Sessions',
    scan: 'Scan QR',
}

/**
 * Breadcrumb — Dynamic breadcrumb trail based on current pathname.
 * Automatically generates links for each segment.
 */
export function Breadcrumb() {
    const pathname = usePathname()
    const segments = pathname.split('/').filter(Boolean)

    // Dashboard root
    if (segments.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <Home className="h-3.5 w-3.5 text-primary" />
                <span className="text-foreground font-medium">Dashboard</span>
            </div>
        )
    }

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link
                href="/"
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
            </Link>
            {segments.map((segment, index) => {
                const href = '/' + segments.slice(0, index + 1).join('/')
                const isLast = index === segments.length - 1
                const label = routeLabels[segment] || decodeURIComponent(segment)

                return (
                    <div key={href} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground truncate max-w-[200px]">
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="text-muted-foreground transition-colors hover:text-foreground truncate max-w-[200px]"
                            >
                                {label}
                            </Link>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
