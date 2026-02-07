'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { DataTable } from '@/components/ui/DataTable'
import { AttendeeSheet } from '@/components/ui/AttendeeSheet'
import { attendeeColumns } from '../participants/columns'
import { Attendee } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/motion/PageTransition'

export default function TeamPage() {
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const supabase = createClient()

    const { data: teamMembers, isLoading } = useQuery({
        queryKey: ['team'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .eq('category', 'Team')
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Team</h1>
                    <p className="mt-1 text-muted-foreground">
                        View and manage GDG team members and organizers
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
                        data={teamMembers || []}
                        searchKey="full_name"
                        searchPlaceholder="Search team members..."
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
