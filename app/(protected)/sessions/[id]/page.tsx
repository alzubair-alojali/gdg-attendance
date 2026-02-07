'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Session, Attendee } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, CheckCircle, XCircle, Users, UserCog } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toggleSessionActive, markAttendeePresent, markAttendeeAbsent } from '@/app/(protected)/actions'
import { toast } from 'sonner'
import { useInvalidateQueries } from '@/hooks/useSupabaseQuery'

export default function SessionDetailPage() {
    const params = useParams()
    const sessionId = params.id as string
    const supabase = createClient()
    const queryClient = useQueryClient()
    const { invalidateSessions, invalidateDashboard, invalidateActiveSession, invalidateAttendanceLogs } = useInvalidateQueries()

    // Fetch session details
    const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
        queryKey: ['session', sessionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (error) throw error
            return data as Session
        },
        refetchOnMount: 'always',
    })

    // Fetch all attendees
    const { data: allAttendees } = useQuery({
        queryKey: ['all-attendees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .order('full_name')

            if (error) throw error
            return data as Attendee[]
        },
        refetchOnMount: 'always',
    })

    // Fetch attendance logs for this session
    const { data: attendanceLogs, refetch: refetchLogs } = useQuery({
        queryKey: ['attendance-logs', sessionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select('attendee_id')
                .eq('session_id', sessionId)

            if (error) throw error
            return data as { attendee_id: string }[]
        },
        refetchOnMount: 'always',
    })

    // Split attendees into Team and Participants
    const presentIds = new Set(attendanceLogs?.map((log) => log.attendee_id) || [])

    // Team members (category === 'Team')
    const teamMembers = allAttendees?.filter((a) => a.category === 'Team') || []
    const teamPresent = teamMembers.filter((a) => presentIds.has(a.id))
    const teamAbsent = teamMembers.filter((a) => !presentIds.has(a.id))

    // Participants (Students & Guests)
    const participants = allAttendees?.filter((a) => a.category !== 'Team') || []
    const participantsPresent = participants.filter((a) => presentIds.has(a.id))
    const participantsAbsent = participants.filter((a) => !presentIds.has(a.id))

    // Calculate stats
    const teamTotal = teamMembers.length
    const teamPresentCount = teamPresent.length
    const teamRate = teamTotal > 0 ? Math.round((teamPresentCount / teamTotal) * 100) : 0

    const participantsTotal = participants.length
    const participantsPresentCount = participantsPresent.length
    const participantsRate = participantsTotal > 0 ? Math.round((participantsPresentCount / participantsTotal) * 100) : 0

    const isLoading = sessionLoading || !allAttendees || !attendanceLogs

    async function handleToggleActive() {
        if (!session) return

        const result = await toggleSessionActive(sessionId, !session.is_active)
        if (result.error) {
            toast.error('Failed to update session', { description: result.error })
            return
        }

        toast.success(session.is_active ? 'Session deactivated' : 'Session activated')
        refetchSession()
        invalidateSessions()
        invalidateDashboard()
        invalidateActiveSession()
    }

    async function handleToggleAttendance(attendeeId: string, isPresent: boolean) {
        // Optimistic update
        const previousLogs = queryClient.getQueryData(['attendance-logs', sessionId])

        if (isPresent) {
            queryClient.setQueryData(['attendance-logs', sessionId], (old: { attendee_id: string }[] | undefined) => [
                ...(old || []),
                { attendee_id: attendeeId }
            ])
        } else {
            queryClient.setQueryData(['attendance-logs', sessionId], (old: { attendee_id: string }[] | undefined) =>
                (old || []).filter(log => log.attendee_id !== attendeeId)
            )
        }

        const result = isPresent
            ? await markAttendeePresent(attendeeId, sessionId)
            : await markAttendeeAbsent(attendeeId, sessionId)

        if (result.error) {
            queryClient.setQueryData(['attendance-logs', sessionId], previousLogs)
            toast.error('Failed to update attendance', { description: result.error })
            return
        }

        refetchLogs()
        invalidateAttendanceLogs(sessionId)
        invalidateSessions()
    }

    if (isLoading) {
        return (
            <PageTransition>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="space-y-8">
                {/* Back Button & Header */}
                <div className="flex flex-col gap-4">
                    <Link href="/sessions">
                        <Button variant="ghost" className="gap-2 -ml-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sessions
                        </Button>
                    </Link>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {session?.title}
                            </h1>
                            <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {session?.date && format(new Date(session.date), 'PPP')}
                                </div>
                                {session?.is_active && (
                                    <div className="flex items-center gap-1.5 text-green-500">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                                        </span>
                                        Active Session
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            variant={session?.is_active ? 'outline' : 'default'}
                            onClick={handleToggleActive}
                            className="gap-2"
                        >
                            {session?.is_active ? (
                                <>
                                    <XCircle className="h-4 w-4" />
                                    Deactivate Session
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4" />
                                    Activate Session
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Tabs: Participants vs Team */}
                <Tabs defaultValue="participants" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="participants" className="gap-2">
                            <Users className="h-4 w-4" />
                            Participants
                            <Badge variant="secondary" className="ml-1">
                                {participantsTotal}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="team" className="gap-2">
                            <UserCog className="h-4 w-4" />
                            GDG Team
                            <Badge variant="secondary" className="ml-1">
                                {teamTotal}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* Participants Tab */}
                    <TabsContent value="participants" className="space-y-6 mt-6">
                        {/* Participants Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{participantsPresentCount}</p>
                                            <p className="text-sm text-muted-foreground">Present</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{participantsAbsent.length}</p>
                                            <p className="text-sm text-muted-foreground">Absent</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{participantsTotal}</p>
                                            <p className="text-sm text-muted-foreground">Total</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="min-w-48">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                                        <span className="text-lg font-bold text-primary">{participantsRate}%</span>
                                    </div>
                                    <Progress value={participantsRate} className="h-3" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Participants Attendance Lists */}
                        <Tabs defaultValue="present" className="space-y-4">
                            <TabsList className="grid w-full max-w-sm grid-cols-2">
                                <TabsTrigger value="present" className="gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Present ({participantsPresentCount})
                                </TabsTrigger>
                                <TabsTrigger value="absent" className="gap-2">
                                    <XCircle className="h-4 w-4" />
                                    Absent ({participantsAbsent.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="present">
                                <AttendeeList
                                    attendees={participantsPresent}
                                    type="present"
                                    onToggle={handleToggleAttendance}
                                    emptyMessage="No participants checked in yet"
                                />
                            </TabsContent>

                            <TabsContent value="absent">
                                <AttendeeList
                                    attendees={participantsAbsent}
                                    type="absent"
                                    onToggle={handleToggleAttendance}
                                    emptyMessage="All participants are present!"
                                />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* Team Tab */}
                    <TabsContent value="team" className="space-y-6 mt-6">
                        {/* Team Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-google-blue/30 bg-google-blue/5 p-6"
                        >
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{teamPresentCount}</p>
                                            <p className="text-sm text-muted-foreground">Present</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                            <XCircle className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{teamAbsent.length}</p>
                                            <p className="text-sm text-muted-foreground">Absent</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-google-blue/10">
                                            <UserCog className="h-5 w-5 text-google-blue" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{teamTotal}</p>
                                            <p className="text-sm text-muted-foreground">Total Team</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="min-w-48">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Team Attendance</span>
                                        <span className="text-lg font-bold text-google-blue">{teamRate}%</span>
                                    </div>
                                    <Progress value={teamRate} className="h-3 [&>div]:bg-google-blue" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Team Attendance Lists */}
                        {teamTotal === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12">
                                <UserCog className="h-10 w-10 text-muted-foreground/50" />
                                <p className="mt-3 text-muted-foreground">No team members assigned</p>
                                <p className="text-sm text-muted-foreground/70">Add team members from the Team page</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="present" className="space-y-4">
                                <TabsList className="grid w-full max-w-sm grid-cols-2">
                                    <TabsTrigger value="present" className="gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Present ({teamPresentCount})
                                    </TabsTrigger>
                                    <TabsTrigger value="absent" className="gap-2">
                                        <XCircle className="h-4 w-4" />
                                        Absent ({teamAbsent.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="present">
                                    <AttendeeList
                                        attendees={teamPresent}
                                        type="present"
                                        onToggle={handleToggleAttendance}
                                        emptyMessage="No team members checked in yet"
                                        showRole
                                    />
                                </TabsContent>

                                <TabsContent value="absent">
                                    <AttendeeList
                                        attendees={teamAbsent}
                                        type="absent"
                                        onToggle={handleToggleAttendance}
                                        emptyMessage="All team members are present!"
                                        showRole
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </PageTransition>
    )
}

// Attendee List Component with Toggle
interface AttendeeListProps {
    attendees: Attendee[]
    type: 'present' | 'absent'
    onToggle: (attendeeId: string, markAsPresent: boolean) => Promise<void>
    emptyMessage?: string
    showRole?: boolean
}

function AttendeeList({ attendees, type, onToggle, emptyMessage, showRole }: AttendeeListProps) {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const categoryColors: Record<string, string> = {
        Team: 'bg-google-blue/10 text-google-blue',
        Student: 'bg-google-green/10 text-google-green',
        Guest: 'bg-google-yellow/10 text-google-yellow',
    }

    async function handleToggle(attendeeId: string) {
        setLoadingIds(prev => new Set(prev).add(attendeeId))
        await onToggle(attendeeId, type === 'absent')
        setLoadingIds(prev => {
            const next = new Set(prev)
            next.delete(attendeeId)
            return next
        })
    }

    if (attendees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-12">
                {type === 'present' ? (
                    <CheckCircle className="h-10 w-10 text-muted-foreground/50" />
                ) : (
                    <XCircle className="h-10 w-10 text-muted-foreground/50" />
                )}
                <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="max-h-96 overflow-auto">
                <AnimatePresence>
                    {attendees.map((attendee, index) => (
                        <motion.div
                            key={attendee.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: Math.min(index * 0.02, 0.5) }}
                            className="flex items-center justify-between border-b border-border p-4 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${type === 'present' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {type === 'present' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">{attendee.full_name}</p>
                                        {showRole && attendee.organization && (
                                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                {attendee.organization}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{attendee.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryColors[attendee.category]}`}>
                                    {attendee.category}
                                </span>

                                {/* Attendance Toggle Switch */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        {type === 'present' ? 'Present' : 'Absent'}
                                    </span>
                                    <Switch
                                        checked={type === 'present'}
                                        disabled={loadingIds.has(attendee.id)}
                                        onCheckedChange={() => handleToggle(attendee.id)}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
