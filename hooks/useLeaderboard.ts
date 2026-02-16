'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Attendee, AttendanceLog } from '@/types/database.types'

export type LeaderboardEntry = {
    attendeeId: string
    name: string
    category: Attendee['category']
    totalAttendance: number
    earlyCheckIns: number
}

export type LeaderboardData = {
    topTeamMembers: LeaderboardEntry[]
    topParticipants: LeaderboardEntry[]
    mostEarly: LeaderboardEntry[]
}

const supabase = createClient()

export function useLeaderboard() {
    return useQuery({
        queryKey: ['leaderboard'],
        queryFn: async (): Promise<LeaderboardData> => {
            const { data: logs, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    attendees (
                        id,
                        full_name,
                        category
                    )
                `)

            if (error) throw error

            const sessionEarliestCheckIn = new Map<string, number>()

            // 1. Find the earliest check-in time for each session
            logs.forEach((log: any) => {
                const time = new Date(log.scanned_at).getTime()
                if (!sessionEarliestCheckIn.has(log.session_id) || time < sessionEarliestCheckIn.get(log.session_id)!) {
                    sessionEarliestCheckIn.set(log.session_id, time)
                }
            })

            const attendanceMap = new Map<string, { entry: LeaderboardEntry, totalDelayMinutes: number, sessionsCount: number }>()

            // 2. Process logs
            logs.forEach((log: any) => {
                const attendee = log.attendees
                if (!attendee) return

                if (!attendanceMap.has(attendee.id)) {
                    attendanceMap.set(attendee.id, {
                        entry: {
                            attendeeId: attendee.id,
                            name: attendee.full_name,
                            category: attendee.category,
                            totalAttendance: 0,
                            earlyCheckIns: 0,
                        },
                        totalDelayMinutes: 0,
                        sessionsCount: 0
                    })
                }

                const data = attendanceMap.get(attendee.id)!
                const entry = data.entry

                entry.totalAttendance += 1

                // Calculate "delay" from the first person
                const checkInTime = new Date(log.scanned_at).getTime()
                const earliestTime = sessionEarliestCheckIn.get(log.session_id)!
                const delayMinutes = (checkInTime - earliestTime) / (1000 * 60)

                data.totalDelayMinutes += delayMinutes
                data.sessionsCount += 1
            })

            const allEntries = Array.from(attendanceMap.values()).map(d => {
                // Calculate average delay
                const avgDelay = d.sessionsCount > 0 ? Math.round(d.totalDelayMinutes / d.sessionsCount) : 0
                return {
                    ...d.entry,
                    earlyCheckIns: avgDelay // Storing avg delay in earlyCheckIns for simplicity (lower is better)
                }
            })

            // Filter and sort for Top Team Members
            const topTeamMembers = allEntries
                .filter(e => e.category === 'Team')
                .sort((a, b) => b.totalAttendance - a.totalAttendance)
                .slice(0, 5)

            // Filter and sort for Top Participants (Student/Guest)
            const topParticipants = allEntries
                .filter(e => e.category !== 'Team')
                .sort((a, b) => b.totalAttendance - a.totalAttendance)
                .slice(0, 5)

            // Sort for Most Early Check-ins (LOWEST delay is best)
            // Filter out people with only 1 attendance to avoid outliers who came early once
            const mostEarly = allEntries
                .filter(e => e.totalAttendance > 1)
                .sort((a, b) => a.earlyCheckIns - b.earlyCheckIns)
                .slice(0, 5)

            return {
                topTeamMembers,
                topParticipants,
                mostEarly
            }
        },
        staleTime: 60 * 1000, // 1 minute cache
    })
}
