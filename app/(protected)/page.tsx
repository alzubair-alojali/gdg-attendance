'use client'

import { useDashboardStats } from '@/hooks/useSupabaseQuery'
import { StatsCard } from '@/components/ui/StatsCard'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import { AttendanceTrendChart, CategoryDistributionChart } from '@/components/ui/AnalyticsCharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, UserX, Clock, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
    const { data: stats, isLoading, isFetching } = useDashboardStats()

    return (
        <div className="space-y-8">
            {/* ============================================
                Hero Section
               ============================================ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-data text-xs uppercase tracking-wider">
                            Analytics Overview
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        <span className="text-foreground">Welcome to </span>
                        <span className="gradient-text-blue">
                            Data Analysis Bootcamp
                        </span>
                    </h1>
                    <p className="max-w-lg text-muted-foreground">
                        Real-time attendance analytics and insights for your bootcamp sessions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            <span className="font-data text-xs">Syncing...</span>
                        </div>
                    )}
                    <CreateSessionDialog />
                </div>
            </motion.div>

            {/* ============================================
                Stats Cards
               ============================================ */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.04]" />
                        ))}
                    </motion.div>
                ) : (
                    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StaggerItem>
                            <StatsCard
                                title="Total Attendees"
                                value={stats?.totalAttendees || 0}
                                subtitle="Registered participants"
                                icon={Users}
                            />
                        </StaggerItem>
                        <StaggerItem>
                            <StatsCard
                                title="Present Today"
                                value={stats?.presentToday || 0}
                                subtitle={stats?.activeSession ? 'Active session' : 'No active session'}
                                icon={UserCheck}
                            />
                        </StaggerItem>
                        <StaggerItem>
                            <StatsCard
                                title="Absence Rate"
                                value={`${stats?.absenceRate || 0}%`}
                                subtitle="Not yet checked in"
                                icon={UserX}
                            />
                        </StaggerItem>
                        <StaggerItem>
                            <StatsCard
                                title="Session Status"
                                value={stats?.activeSession ? 'Active' : 'Inactive'}
                                subtitle={stats?.activeSession?.title || 'No current session'}
                                icon={Clock}
                            />
                        </StaggerItem>
                    </StaggerContainer>
                )}
            </AnimatePresence>

            {/* ============================================
                Active Session Banner
               ============================================ */}
            <AnimatePresence>
                {stats?.activeSession && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-2xl glass-card border-green-500/20 bg-green-500/5 p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3 items-center justify-center">
                                <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75" />
                                <span className="relative h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-500">
                                    Session Active: <span className="font-data">{stats.activeSession.title}</span>
                                </p>
                                <p className="text-xs text-green-500/70">
                                    Ready to scan attendees
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {!stats?.activeSession && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-2xl glass-card border-yellow-500/20 bg-yellow-500/5 p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-3 w-3 rounded-full bg-yellow-500" />
                            <p className="text-sm font-medium text-yellow-500">
                                No active session — Click &quot;Create Session&quot; to start scanning
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================
                Analytics Charts
               ============================================ */}
            <div className="grid gap-6 lg:grid-cols-2">
                <AttendanceTrendChart />
                <CategoryDistributionChart />
            </div>
        </div>
    )
}
