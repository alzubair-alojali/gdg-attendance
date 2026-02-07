'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSession } from '@/app/(protected)/actions'
import { useInvalidateQueries } from '@/hooks/useSupabaseQuery'
import { toast } from 'sonner'
import { Plus, Loader2, Calendar } from 'lucide-react'

export function CreateSessionDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { invalidateSessions, invalidateDashboard, invalidateActiveSession } = useInvalidateQueries()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('setActive', 'true') // New sessions become active by default

        const result = await createSession(formData)

        setIsLoading(false)

        if (result.error) {
            toast.error('Failed to create session', { description: result.error })
            return
        }

        toast.success('Session created!', {
            description: `"${formData.get('title')}" is now active`
        })

        // Invalidate related queries to refetch data
        invalidateSessions()
        invalidateDashboard()
        invalidateActiveSession()

        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                    <Plus className="h-4 w-4" />
                    Create Session
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Create New Session
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-foreground">
                            Session Title
                        </label>
                        <Input
                            id="title"
                            name="title"
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
                            name="date"
                            type="date"
                            required
                            disabled={isLoading}
                            className="bg-muted/50"
                            defaultValue={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-sm text-muted-foreground">
                            This session will be set as <span className="font-medium text-foreground">active</span> for scanning
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
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
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Create Session
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
