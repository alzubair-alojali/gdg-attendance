'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { StatsCard } from '@/components/ui/StatsCard'
import { StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'

export default function DashboardPage() {
    const supabase = createClient()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            // Get total attendees
            const { count: totalAttendees } = await supabase
                .from('attendees')
                .select('*', { count: 'exact', head: true })

            // Get active session
            const { data: activeSession } = await supabase
                .from('sessions')
                .select('id')
                .eq('is_active', true)
                .single()

            let presentToday = 0
            if (activeSession) {
                const { count } = await supabase
                    .from('attendance_logs')
                    .select('*', { count: 'exact', head: true })
                    .eq('session_id', (activeSession as { id: string }).id)

                presentToday = count || 0
            }

            const total = totalAttendees || 0
            const absenceRate = total > 0 ? Math.round(((total - presentToday) / total) * 100) : 0

            return {
                totalAttendees: total,
                presentToday,
                absenceRate,
                activeSession: !!activeSession,
            }
        },
        refetchInterval: 30000, // Refetch every 30 seconds
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                    Real-time attendance overview for your GDG event
                </p>
            </div>

            {/* Stats Cards */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
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
                            subtitle="Current event session"
                            icon={Clock}
                        />
                    </StaggerItem>
                </StaggerContainer>
            )}

            {/* Active Session Banner */}
            {stats?.activeSession && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-3 w-3 items-center justify-center">
                            <span className="absolute h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75" />
                            <span className="relative h-2 w-2 rounded-full bg-green-500" />
                        </div>
                        <p className="text-sm font-medium text-green-500">
                            Session is active — Ready to scan attendees
                        </p>
                    </div>
                </div>
            )}

            {!stats?.activeSession && !isLoading && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-3 w-3 rounded-full bg-yellow-500" />
                        <p className="text-sm font-medium text-yellow-500">
                            No active session — Create a session in Supabase to start scanning
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
