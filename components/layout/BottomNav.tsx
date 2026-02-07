'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    UserCog,
    QrCode
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/participants', label: 'Participants', icon: Users },
    { href: '/team', label: 'Team', icon: UserCog },
    { href: '/scan', label: 'Scan', icon: QrCode },
]

export function BottomNav() {
    const pathname = usePathname()

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border glass lg:hidden"
        >
            <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-1 px-3 py-2"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeBottomNav"
                                    className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary"
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                            <item.icon
                                className={cn(
                                    'h-5 w-5 transition-colors',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-xs font-medium transition-colors',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </motion.nav>
    )
}
