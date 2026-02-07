'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Attendee, Session } from '@/types/database.types'

// Create a stable Supabase client singleton for the browser
let browserClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient()
    }
    return browserClient
}

/**
 * Custom hook to fetch attendees by category
 * Ensures data is fetched immediately on mount and handles refetching properly
 */
export function useAttendees(categories: ('Team' | 'Student' | 'Guest')[]) {
    const supabase = getSupabaseClient()
    const queryKey = ['attendees', ...categories.sort()]

    return useQuery({
        queryKey,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .in('category', categories)
                .order('full_name')

            if (error) throw error
            return (data || []) as Attendee[]
        },
        staleTime: 30 * 1000, // 30 seconds
        refetchOnMount: 'always', // Always refetch when component mounts
        refetchOnWindowFocus: true,
    })
}

/**
 * Custom hook to fetch dashboard statistics
 */
export function useDashboardStats() {
    const supabase = getSupabaseClient()

    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            // Get total attendees
            const { count: totalAttendees } = await supabase
                .from('attendees')
                .select('*', { count: 'exact', head: true })

            // Get active session
            const { data: activeSession } = await supabase
                .from('sessions')
                .select('*')
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
                activeSession: activeSession as Session | null,
            }
        },
        staleTime: 10 * 1000, // 10 seconds for dashboard
        refetchInterval: 30000, // Auto-refetch every 30 seconds
        refetchOnMount: 'always',
    })
}

/**
 * Custom hook to fetch all sessions
 */
export function useSessions() {
    const supabase = getSupabaseClient()

    return useQuery({
        queryKey: ['sessions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .order('date', { ascending: false })

            if (error) throw error
            return (data || []) as Session[]
        },
        staleTime: 30 * 1000,
        refetchOnMount: 'always',
    })
}

/**
 * Custom hook to fetch the active session
 */
export function useActiveSession() {
    const supabase = getSupabaseClient()

    return useQuery({
        queryKey: ['active-session'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data as Session | null
        },
        staleTime: 10 * 1000,
        refetchOnMount: 'always',
    })
}

/**
 * Hook to get the query client instance for manual invalidation
 */
export function useInvalidateQueries() {
    const queryClient = useQueryClient()

    return {
        invalidateAttendees: () => queryClient.invalidateQueries({ queryKey: ['attendees'] }),
        // Invalidate ALL session-related queries (sessions, sessions-with-stats, etc.)
        invalidateSessions: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] })
            queryClient.invalidateQueries({ queryKey: ['sessions-with-stats'] })
            queryClient.invalidateQueries({
                predicate: (query) =>
                    Array.isArray(query.queryKey) && query.queryKey[0] === 'session'
            })
        },
        invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        invalidateActiveSession: () => queryClient.invalidateQueries({ queryKey: ['active-session'] }),
        invalidateAttendanceLogs: (sessionId?: string) => {
            if (sessionId) {
                queryClient.invalidateQueries({ queryKey: ['attendance-logs', sessionId] })
            } else {
                queryClient.invalidateQueries({
                    predicate: (query) =>
                        Array.isArray(query.queryKey) && query.queryKey[0] === 'attendance-logs'
                })
            }
        },
        invalidateAll: () => queryClient.invalidateQueries(),
    }
}
