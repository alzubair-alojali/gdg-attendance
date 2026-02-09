'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSessions, useAttendees } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'
import { generateAttendanceReport, type AudienceFilter } from '@/utils/generatePDF'
import { toast } from 'sonner'
import { FileDown, Calendar, Users, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { AttendanceLog } from '@/types/database.types'

interface ExportReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
}

const staggerItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

export function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
    const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())
    const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('all')
    const [isGenerating, setIsGenerating] = useState(false)

    const { data: sessions = [], isLoading: sessionsLoading } = useSessions()
    const { data: allAttendees = [], isLoading: attendeesLoading } = useAttendees(['Team', 'Student', 'Guest'])

    const allSelected = useMemo(
        () => sessions.length > 0 && selectedSessionIds.size === sessions.length,
        [sessions.length, selectedSessionIds.size]
    )

    const handleToggleSession = useCallback((sessionId: string) => {
        setSelectedSessionIds((prev) => {
            const next = new Set(prev)
            if (next.has(sessionId)) {
                next.delete(sessionId)
            } else {
                next.add(sessionId)
            }
            return next
        })
    }, [])

    const handleToggleAll = useCallback(() => {
        if (allSelected) {
            setSelectedSessionIds(new Set())
        } else {
            setSelectedSessionIds(new Set(sessions.map((s) => s.id)))
        }
    }, [allSelected, sessions])

    const handleGenerate = useCallback(async () => {
        if (selectedSessionIds.size === 0) {
            toast.error('Please select at least one session')
            return
        }

        setIsGenerating(true)

        try {
            const supabase = createClient()
            const { data: logs, error } = await supabase
                .from('attendance_logs')
                .select('*')
                .in('session_id', Array.from(selectedSessionIds))

            if (error) throw error

            await generateAttendanceReport(sessions, allAttendees, (logs || []) as AttendanceLog[], {
                selectedSessionIds: Array.from(selectedSessionIds),
                audienceFilter,
            })

            toast.success('PDF Generated!', {
                description: 'Your attendance report has been downloaded.',
            })
            onOpenChange(false)
        } catch (err) {
            console.error('PDF Generation Error:', err)
            toast.error('Failed to generate PDF', {
                description: err instanceof Error ? err.message : 'Unknown error occurred',
            })
        } finally {
            setIsGenerating(false)
        }
    }, [selectedSessionIds, audienceFilter, sessions, allAttendees, onOpenChange])

    const isLoading = sessionsLoading || attendeesLoading

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="size-5 text-primary" />
                        Export Attendance Report
                    </DialogTitle>
                    <DialogDescription>
                        Generate a PDF report with attendance data for selected sessions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Session Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="size-4 text-muted-foreground" />
                                Select Sessions
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleAll}
                                disabled={isLoading || sessions.length === 0}
                                className="h-7 text-xs"
                            >
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                                ))}
                            </div>
                        ) : sessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No sessions found. Create a session first.
                            </p>
                        ) : (
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="show"
                                className="max-h-48 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3"
                            >
                                {sessions.map((session) => (
                                    <motion.label
                                        key={session.id}
                                        variants={staggerItem}
                                        className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
                                    >
                                        <Checkbox
                                            checked={selectedSessionIds.has(session.id)}
                                            onCheckedChange={() => handleToggleSession(session.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium">{session.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                                            </p>
                                        </div>
                                        {session.is_active && (
                                            <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-600">
                                                Active
                                            </span>
                                        )}
                                    </motion.label>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* Audience Filter */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <Users className="size-4 text-muted-foreground" />
                            Select Audience
                        </label>
                        <Select value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as AudienceFilter)}>
                            <SelectTrigger className="bg-muted/50">
                                <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Everyone</SelectItem>
                                <SelectItem value="participants">Participants Only</SelectItem>
                                <SelectItem value="team">Team Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancel
                    </Button>
                    <motion.div whileTap={{ scale: 0.97 }}>
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || selectedSessionIds.size === 0}
                            className="gap-2 bg-primary hover:bg-primary/90"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileDown className="size-4" />
                                    Generate PDF
                                </>
                            )}
                        </Button>
                    </motion.div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
