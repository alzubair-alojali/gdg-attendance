'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Users,
    UserCog,
    QrCode,
    Calendar,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/participants', label: 'Participants', icon: Users },
    { href: '/team', label: 'Team', icon: UserCog },
    { href: '/sessions', label: 'Sessions', icon: Calendar },
    { href: '/scan', label: 'Scan QR', icon: QrCode },
]

interface SidebarProps {
    isCollapsed: boolean
    onToggleCollapse: () => void
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Logged out successfully')
        router.push('/login')
        router.refresh()
    }

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? 72 : 256,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-40 hidden h-screen flex-col glass-sidebar lg:flex"
        >
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-4">
                <img
                    src="/gdg-logo.png"
                    alt="GDG Logo"
                    className="h-8 w-8 min-w-8"
                />
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-lg font-semibold text-foreground tracking-tight"
                        >
                            Attendance
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isCollapsed && 'justify-center px-2',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                            {/* Hover glow effect */}
                            {!isActive && (
                                <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-white/[0.04]" />
                            )}
                            <item.icon className={cn(
                                'relative z-10 h-5 w-5 transition-colors min-w-5',
                                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            )} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="relative z-10 overflow-hidden whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse Toggle */}
            <div className="border-t border-white/[0.06] p-3">
                <button
                    onClick={onToggleCollapse}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground',
                        isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronsRight className="h-5 w-5 min-w-5" />
                    ) : (
                        <>
                            <ChevronsLeft className="h-5 w-5 min-w-5" />
                            <span className="overflow-hidden whitespace-nowrap">Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {/* Logout */}
            <div className="border-t border-white/[0.06] p-3">
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
                        isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? 'Logout' : undefined}
                >
                    <LogOut className="h-5 w-5 min-w-5" />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    )
}
