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
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, CheckCircle, XCircle, Users } from 'lucide-react'
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

    // Calculate present and absent lists
    const presentIds = new Set(attendanceLogs?.map((log) => log.attendee_id) || [])
    const presentAttendees = allAttendees?.filter((a) => presentIds.has(a.id)) || []
    const absentAttendees = allAttendees?.filter((a) => !presentIds.has(a.id)) || []

    const totalAttendees = allAttendees?.length || 0
    const presentCount = presentAttendees.length
    const attendanceRate = totalAttendees > 0 ? Math.round((presentCount / totalAttendees) * 100) : 0

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
            // Mark as present - optimistically add to list
            queryClient.setQueryData(['attendance-logs', sessionId], (old: { attendee_id: string }[] | undefined) => [
                ...(old || []),
                { attendee_id: attendeeId }
            ])
        } else {
            // Mark as absent - optimistically remove from list
            queryClient.setQueryData(['attendance-logs', sessionId], (old: { attendee_id: string }[] | undefined) =>
                (old || []).filter(log => log.attendee_id !== attendeeId)
            )
        }

        const result = isPresent
            ? await markAttendeePresent(attendeeId, sessionId)
            : await markAttendeeAbsent(attendeeId, sessionId)

        if (result.error) {
            // Rollback on error
            queryClient.setQueryData(['attendance-logs', sessionId], previousLogs)
            toast.error('Failed to update attendance', { description: result.error })
            return
        }

        // Refresh to ensure sync with server
        refetchLogs()
        invalidateAttendanceLogs(sessionId)
        invalidateSessions() // Update session stats
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

                {/* Stats Bar */}
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
                                    <p className="text-2xl font-bold text-foreground">{presentCount}</p>
                                    <p className="text-sm text-muted-foreground">Present</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                                    <XCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{absentAttendees.length}</p>
                                    <p className="text-sm text-muted-foreground">Absent</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalAttendees}</p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </div>

                        <div className="min-w-48">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Attendance Rate</span>
                                <span className="text-lg font-bold text-primary">{attendanceRate}%</span>
                            </div>
                            <Progress value={attendanceRate} className="h-3" />
                        </div>
                    </div>
                </motion.div>

                {/* Attendance Lists */}
                <Tabs defaultValue="present" className="space-y-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="present" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Present ({presentCount})
                        </TabsTrigger>
                        <TabsTrigger value="absent" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Absent ({absentAttendees.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="present">
                        <AttendeeList
                            attendees={presentAttendees}
                            type="present"
                            onToggle={handleToggleAttendance}
                        />
                    </TabsContent>

                    <TabsContent value="absent">
                        <AttendeeList
                            attendees={absentAttendees}
                            type="absent"
                            onToggle={handleToggleAttendance}
                        />
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
}

function AttendeeList({ attendees, type, onToggle }: AttendeeListProps) {
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

    const categoryColors: Record<string, string> = {
        Team: 'bg-[#4285F4]/10 text-[#4285F4]',
        Student: 'bg-[#34A853]/10 text-[#34A853]',
        Guest: 'bg-[#FBBC05]/10 text-[#FBBC05]',
    }

    async function handleToggle(attendeeId: string) {
        setLoadingIds(prev => new Set(prev).add(attendeeId))
        await onToggle(attendeeId, type === 'absent') // If absent, mark present; if present, mark absent
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
                    <>
                        <CheckCircle className="h-10 w-10 text-muted-foreground/50" />
                        <p className="mt-3 text-muted-foreground">No attendees scanned yet</p>
                    </>
                ) : (
                    <>
                        <XCircle className="h-10 w-10 text-muted-foreground/50" />
                        <p className="mt-3 text-muted-foreground">All attendees are present!</p>
                    </>
                )}
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
                                    <p className="font-medium text-foreground">{attendee.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{attendee.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryColors[attendee.category]}`}>
                                    {attendee.category}
                                </span>

                                {/* Attendance Toggle Switch */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
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
