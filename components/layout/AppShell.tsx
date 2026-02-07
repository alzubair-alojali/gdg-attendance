'use client'

import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="min-h-screen pb-20 lg:ml-64 lg:pb-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            duration: 0.2
                        }}
                        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
