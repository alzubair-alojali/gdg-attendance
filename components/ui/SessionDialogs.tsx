'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateSession, deleteSession } from '@/app/(protected)/actions'
import { useInvalidateQueries } from '@/hooks/useSupabaseQuery'
import { toast } from 'sonner'
import { Loader2, Calendar, Pencil, Trash2 } from 'lucide-react'
import { Session } from '@/types/database.types'

// Edit Session Dialog
interface EditSessionDialogProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditSessionDialog({ session, open, onOpenChange }: EditSessionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [date, setDate] = useState('')
    const { invalidateSessions, invalidateDashboard, invalidateActiveSession } = useInvalidateQueries()

    useEffect(() => {
        if (session && open) {
            setTitle(session.title)
            setDate(session.date)
        }
    }, [session, open])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!session) return

        setIsLoading(true)
        const result = await updateSession(session.id, title, date)
        setIsLoading(false)

        if (result.error) {
            toast.error('Failed to update session', { description: result.error })
            return
        }

        toast.success('Session updated!', { description: title })
        invalidateSessions()
        invalidateDashboard()
        invalidateActiveSession()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-primary" />
                        Edit Session
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-foreground">
                            Session Title
                        </label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., GDG DevFest 2026"
                            required
                            disabled={isLoading}
                            className="bg-muted/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="date" className="text-sm font-medium text-foreground">
                            Date
                        </label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            disabled={isLoading}
                            className="bg-muted/50"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
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
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Delete Session Dialog
interface DeleteSessionDialogProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleted?: () => void
}

export function DeleteSessionDialog({ session, open, onOpenChange, onDeleted }: DeleteSessionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { invalidateSessions, invalidateDashboard, invalidateActiveSession } = useInvalidateQueries()

    async function handleDelete() {
        if (!session) return

        setIsLoading(true)
        const result = await deleteSession(session.id)
        setIsLoading(false)

        if (result.error) {
            toast.error('Failed to delete session', { description: result.error })
            return
        }

        toast.success('Session deleted', { description: session.title })
        invalidateSessions()
        invalidateDashboard()
        invalidateActiveSession()
        onOpenChange(false)
        onDeleted?.()
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Session
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{session?.title}</strong>?
                        This will also remove all attendance records for this session. This action cannot be undone.
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
                            'Delete Session'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
