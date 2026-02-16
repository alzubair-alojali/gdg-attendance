'use client'

import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LeaderboardCard } from '@/components/ui/LeaderboardCard'
import { Trophy, Clock, Users, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardPage() {
    const { data, isLoading } = useLeaderboard()

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leaderboard</h2>
                    <p className="text-muted-foreground">Loading statistics...</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        )
    }

    const { topTeamMembers, topParticipants, mostEarly } = data || { topTeamMembers: [], topParticipants: [], mostEarly: [] }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <div className="space-y-6 p-4 md:p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent w-fit">
                    Leaderboard
                </h2>
                <p className="text-muted-foreground">
                    Celebrating our most dedicated attendees and top performers.
                </p>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                <motion.div variants={item}>
                    <LeaderboardCard
                        title="Top Team Members"
                        icon={Crown}
                        entries={topTeamMembers.map((m, i) => ({
                            name: m.name,
                            score: m.totalAttendance,
                            rank: i + 1,
                            category: m.category,
                            avatarUrl: undefined // could fetch avatar if available
                        }))}
                        metricLabel="Sessions Attended"
                        colorClass="text-purple-500"
                    />
                </motion.div>

                <motion.div variants={item}>
                    <LeaderboardCard
                        title="Top Participants"
                        icon={Users}
                        entries={topParticipants.map((m, i) => ({
                            name: m.name,
                            score: m.totalAttendance,
                            rank: i + 1,
                            category: m.category,
                        }))}
                        metricLabel="Sessions Attended"
                        colorClass="text-blue-500"
                    />
                </motion.div>

                <motion.div variants={item}>
                    <LeaderboardCard
                        title="Early Birds"
                        icon={Clock}
                        entries={mostEarly.map((m, i) => ({
                            name: m.name,
                            score: m.earlyCheckIns,
                            rank: i + 1,
                            category: m.category,
                        }))}
                        metricLabel="Avg. Check-in Delay"
                        colorClass="text-green-500"
                        formatScore={(score) => score === 0 ? "First!" : `+${score} min`}
                    />
                </motion.div>
            </motion.div>
        </div>
    )
}
