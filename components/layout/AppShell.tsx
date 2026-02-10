'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { GridBackground } from '@/components/ui/GridBackground'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AppShellProps {
    children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            {/* Grid Background Layer */}
            <GridBackground />

            {/* Desktop Sidebar */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content */}
            <motion.main
                animate={{
                    marginLeft: isSidebarCollapsed ? 72 : 256,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative z-10 min-h-screen pb-20 lg:pb-0 max-lg:!ml-0"
            >
                {/* Top Navbar */}
                <header className="sticky top-0 z-30 hidden lg:block">
                    <div className="glass-navbar px-6 py-3">
                        <Breadcrumb />
                    </div>
                </header>

                {/* Page Content */}
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </motion.main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
