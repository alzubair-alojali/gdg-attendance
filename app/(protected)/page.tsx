'use client'

import { useDashboardStats } from '@/hooks/useSupabaseQuery'
import { StatsCard } from '@/components/ui/StatsCard'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
    const { data: stats, isLoading, isFetching } = useDashboardStats()

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Real-time attendance overview for your GDG event
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            Refreshing...
                        </div>
                    )}
                    <CreateSessionDialog />
                </div>
            </div>

            {/* Stats Cards */}
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
                            <Skeleton key={i} className="h-32 rounded-xl" />
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

            {/* Active Session Banner */}
            <AnimatePresence>
                {stats?.activeSession && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-xl border border-green-500/20 bg-green-500/10 p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3 items-center justify-center">
                                <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75" />
                                <span className="relative h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-500">
                                    Session Active: {stats.activeSession.title}
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
                        className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4"
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
        </div>
    )
}
