'use client'

import { useState } from 'react'
import { useAttendees } from '@/hooks/useSupabaseQuery'
import { DataTable } from '@/components/ui/DataTable'
import { AttendeeSheet } from '@/components/ui/AttendeeSheet'
import { AttendeeDialog, DeleteAttendeeDialog } from '@/components/ui/AttendeeDialogs'
import { createAttendeeColumns } from './columns'
import { Attendee } from '@/types/database.types'
import { Skeleton } from '@/components/ui/skeleton'
import { PageTransition } from '@/components/motion/PageTransition'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

export default function ParticipantsPage() {
    const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    // CRUD Dialog States
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null)

    // Use the custom hook - fetches Students and Guests
    const { data: attendees, isLoading, isFetching } = useAttendees(['Student', 'Guest'])

    const handleRowClick = (attendee: Attendee) => {
        setSelectedAttendee(attendee)
        setSheetOpen(true)
    }

    const handleEdit = (attendee: Attendee) => {
        setEditingAttendee(attendee)
        setDialogMode('edit')
        setDialogOpen(true)
    }

    const handleDelete = (attendee: Attendee) => {
        setEditingAttendee(attendee)
        setDeleteDialogOpen(true)
    }

    const handleCreate = () => {
        setEditingAttendee(null)
        setDialogMode('create')
        setDialogOpen(true)
    }

    // Create columns with action handlers
    const columns = createAttendeeColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
    })

    return (
        <PageTransition>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Participants</h1>
                        <p className="mt-1 text-muted-foreground">
                            View and manage event participants (Students & Guests)
                        </p>
                    </div>
                    {isFetching && !isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                            Refreshing...
                        </div>
                    )}
                </div>

                {/* Table with AnimatePresence */}
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-96 rounded-xl" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DataTable
                                columns={columns}
                                data={attendees || []}
                                searchKey="full_name"
                                searchPlaceholder="Search participants..."
                                onRowClick={handleRowClick}
                                headerActions={
                                    <Button
                                        onClick={handleCreate}
                                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Participant
                                    </Button>
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Detail Sheet */}
                <AttendeeSheet
                    attendee={selectedAttendee}
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                />

                {/* Add/Edit Dialog */}
                <AttendeeDialog
                    mode={dialogMode}
                    attendee={editingAttendee}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    defaultCategory="Student"
                />

                {/* Delete Confirmation */}
                <DeleteAttendeeDialog
                    attendee={editingAttendee}
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                />
            </div>
        </PageTransition>
    )
}
