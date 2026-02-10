'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Session } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateSessionDialog } from '@/components/ui/CreateSessionDialog'
import { EditSessionDialog, DeleteSessionDialog } from '@/components/ui/SessionDialogs'
import { ExportReportDialog } from '@/components/reports/ExportReportDialog'
import { StaggerContainer, StaggerItem } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, MoreHorizontal, Pencil, Trash2, FileDown } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface SessionWithStats extends Session {
    present_count: number
}

export default function SessionsPage() {
    const supabase = createClient()
    const [editSession, setEditSession] = useState<Session | null>(null)
    const [deleteSession, setDeleteSession] = useState<Session | null>(null)
    const [exportOpen, setExportOpen] = useState(false)

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['sessions-with-stats'],
        queryFn: async () => {
            // Fetch all sessions
            const { data: sessionsData, error } = await supabase
                .from('sessions')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error

            // Fetch attendance counts for each session
            const sessionsWithStats: SessionWithStats[] = await Promise.all(
                (sessionsData as Session[]).map(async (session) => {
                    const { count } = await supabase
                        .from('attendance_logs')
                        .select('*', { count: 'exact', head: true })
                        .eq('session_id', session.id)

                    return {
                        ...session,
                        present_count: count || 0,
                    }
                })
            )

            return sessionsWithStats
        },
        refetchOnMount: 'always',
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-data text-xs uppercase tracking-wider">
                            Session Management
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Sessions</h1>
                    <p className="text-muted-foreground">
                        View attendance analytics for all event sessions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setExportOpen(true)}
                        className="gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-rose-700 hover:shadow-red-500/40 transition-all duration-300 active:scale-95"
                    >
                        <FileDown className="size-4" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </Button>
                    <CreateSessionDialog />
                </div>
            </motion.div>

            {/* Sessions Grid */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl bg-white/[0.04]" />
                    ))}
                </div>
            ) : sessions?.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl glass-card py-16">
                    <Calendar className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No sessions yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your first session to start tracking attendance
                    </p>
                </div>
            ) : (
                <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sessions?.map((session) => (
                        <StaggerItem key={session.id}>
                            <div className="group relative overflow-hidden rounded-2xl glass-card glow-hover p-6 transition-all hover:border-primary/30">
                                {/* Actions Dropdown */}
                                <div className="absolute right-4 top-4 z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.preventDefault()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass">
                                            <DropdownMenuItem onClick={() => setEditSession(session)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteSession(session)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Active Badge */}
                                {session.is_active && (
                                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500 ring-1 ring-green-500/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                                        </span>
                                        Active
                                    </div>
                                )}

                                {/* Clickable Content */}
                                <Link href={`/sessions/${session.id}`}>
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="cursor-pointer"
                                    >
                                        {/* Session Info */}
                                        <div className="space-y-4 pt-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {session.title}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(session.date), 'PPP')}
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 ring-1 ring-green-500/20">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-foreground font-data">
                                                            {session.present_count}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">Present</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover Arrow */}
                                        <div className="absolute bottom-4 right-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                                                <svg
                                                    className="h-4 w-4 text-primary"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </div>
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}

            {/* Edit Session Dialog */}
            <EditSessionDialog
                session={editSession}
                open={!!editSession}
                onOpenChange={(open) => !open && setEditSession(null)}
            />

            {/* Delete Session Dialog */}
            <DeleteSessionDialog
                session={deleteSession}
                open={!!deleteSession}
                onOpenChange={(open) => !open && setDeleteSession(null)}
            />

            {/* Export Report Dialog */}
            <ExportReportDialog open={exportOpen} onOpenChange={setExportOpen} />
        </div>
    )
}
