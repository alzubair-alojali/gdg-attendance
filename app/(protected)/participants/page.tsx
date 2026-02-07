'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { DataTable } from '@/components/ui/DataTable'
import { AttendeeSheet } from '@/components/ui/AttendeeSheet'
import { attendeeColumns } from './columns'
import { Attendee } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/motion/PageTransition'

export default function ParticipantsPage() {
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const supabase = createClient()

    const { data: attendees, isLoading } = useQuery({
        queryKey: ['participants'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .in('category', ['Student', 'Guest'])
                .order('full_name')

            if (error) throw error
            return data as Attendee[]
        },
    })

    const handleRowClick = (attendee: Attendee) => {
        setSelectedAttendee(attendee)
        setSheetOpen(true)
    }

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Participants</h1>
                    <p className="mt-1 text-muted-foreground">
                        View and manage event participants (Students & Guests)
                    </p>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-[400px] rounded-xl" />
                    </div>
                ) : (
                    <DataTable
                        columns={attendeeColumns}
                        data={attendees || []}
                        searchKey="full_name"
                        searchPlaceholder="Search participants..."
                        onRowClick={handleRowClick}
                    />
                )}

                {/* Detail Sheet */}
                <AttendeeSheet
                    attendee={selectedAttendee}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                />
            </div>
        </PageTransition>
    )
}
