'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAttendee, updateAttendee, deleteAttendee, AttendeeFormData } from '@/app/(protected)/actions'
import { useInvalidateQueries } from '@/hooks/useSupabaseQuery'
import { toast } from 'sonner'
import { Plus, Loader2, UserPlus, Trash2 } from 'lucide-react'
import { Attendee } from '@/types/database.types'

interface AttendeeDialogProps {
    mode: 'create' | 'edit'
    attendee?: Attendee | null
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultCategory?: 'Team' | 'Student' | 'Guest'
}

export function AttendeeDialog({ mode, attendee, open, onOpenChange, defaultCategory = 'Student' }: AttendeeDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { invalidateAttendees, invalidateDashboard } = useInvalidateQueries()

    const [formData, setFormData] = useState<AttendeeFormData>({
        full_name: '',
        email: '',
        phone: '',
        category: defaultCategory,
        student_id: '',
        organization: '',
    })

    // Reset form when dialog opens or attendee changes
    useEffect(() => {
        if (mode === 'edit' && attendee) {
            setFormData({
                full_name: attendee.full_name,
                email: attendee.email,
                phone: attendee.phone || '',
                category: attendee.category as 'Team' | 'Student' | 'Guest',
                student_id: attendee.student_id || '',
                organization: attendee.organization || '',
            })
        } else if (mode === 'create') {
            setFormData({
                full_name: '',
                email: '',
                phone: '',
                category: defaultCategory,
                student_id: '',
                organization: '',
            })
        }
    }, [mode, attendee, open, defaultCategory])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const result = mode === 'create'
            ? await createAttendee(formData)
            : await updateAttendee(attendee!.id, formData)

        setIsLoading(false)

        if (result.error) {
            toast.error(`Failed to ${mode} attendee`, { description: result.error })
            return
        }

        toast.success(mode === 'create' ? 'Attendee added!' : 'Attendee updated!', {
            description: formData.full_name
        })

        invalidateAttendees()
        invalidateDashboard()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {mode === 'create' ? 'Add New Attendee' : 'Edit Attendee'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="full_name" className="text-sm font-medium text-foreground">
                            Full Name *
                        </label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                            required
                            disabled={isLoading}
                            className="bg-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                            Email *
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                            disabled={isLoading}
                            className="bg-muted/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-foreground">
                                Phone
                            </label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1234567890"
                                disabled={isLoading}
                                className="bg-muted/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="category" className="text-sm font-medium text-foreground">
                                Category *
                            </label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value as 'Team' | 'Student' | 'Guest' })}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="bg-muted/50">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Student">Student</SelectItem>
                                    <SelectItem value="Guest">Guest</SelectItem>
                                    <SelectItem value="Team">Team</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="student_id" className="text-sm font-medium text-foreground">
                                Student ID
                            </label>
                            <Input
                                id="student_id"
                                value={formData.student_id}
                                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                placeholder="12345"
                                disabled={isLoading}
                                className="bg-muted/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="organization" className="text-sm font-medium text-foreground">
                                Organization
                            </label>
                            <Input
                                id="organization"
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                placeholder="University/Company"
                                disabled={isLoading}
                                className="bg-muted/50"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <motion.div whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="gap-2 bg-primary hover:bg-primary/90"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {mode === 'create' ? 'Adding...' : 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        {mode === 'create' ? <Plus className="h-4 w-4" /> : null}
                                        {mode === 'create' ? 'Add Attendee' : 'Save Changes'}
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Delete Confirmation Dialog
interface DeleteDialogProps {
    attendee: Attendee | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAttendeeDialog({ attendee, open, onOpenChange }: DeleteDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { invalidateAttendees, invalidateDashboard } = useInvalidateQueries()

    async function handleDelete() {
        if (!attendee) return

        setIsLoading(true)
        const result = await deleteAttendee(attendee.id)
        setIsLoading(false)

        if (result.error) {
            toast.error('Failed to delete attendee', { description: result.error })
            return
        }

        toast.success('Attendee deleted', { description: attendee.full_name })
        invalidateAttendees()
        invalidateDashboard()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Attendee
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{attendee?.full_name}</strong>?
                        This action cannot be undone and will also remove all their attendance records.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
